<?php

namespace App\Controller;

use App\Api\ApiException;
use App\Entity\Game;
use App\Entity\Player;
use App\Game\Affinity;
use App\Game\Bug;
use App\Game\BugCatalog;
use App\Game\BugDraw;
use App\Game\ChoiceOrder;
use App\Game\Scoring;
use App\Game\Timer;
use App\Player\NicknamePolicy;
use App\Repository\GameRepository;
use App\Repository\PlayerRepository;
use Doctrine\ORM\OptimisticLockException;
use Psr\Clock\ClockInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * A game, from its creation to its last bug (contract v1). The answer of a bug
 * never leaves the server before the player answers.
 */
#[Route('/api/games', format: 'json')]
final class GameController extends AbstractController
{
    public function __construct(
        private readonly GameRepository $games,
        private readonly PlayerRepository $players,
        private readonly BugCatalog $catalog,
        private readonly BugDraw $draw,
        private readonly ChoiceOrder $choiceOrder,
        private readonly NicknamePolicy $nicknames,
        private readonly ClockInterface $clock,
    ) {
    }

    // POST /api/games {pseudo, deviceId}: creates the game and draws its bugs.
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $request->toArray();
        $pseudo = $data['pseudo'] ?? null;
        if (!\is_string($pseudo) || !$this->nicknames->isValidFormat($pseudo)) {
            throw new ApiException('pseudo_invalid', Response::HTTP_BAD_REQUEST);
        }
        $deviceId = $data['deviceId'] ?? null;
        if (!\is_string($deviceId) || '' === $deviceId || \strlen($deviceId) > 64) {
            throw new ApiException('bad_request', Response::HTTP_BAD_REQUEST);
        }

        // A banned word and a taken nickname get the same answer: the phone shows
        // one neutral message. The same device may replay with its nickname.
        $player = $this->players->findByPseudo($pseudo);
        if (!$this->nicknames->isAllowed($pseudo) || (null !== $player && $player->getDeviceId() !== $deviceId)) {
            throw new ApiException('pseudo_unavailable', Response::HTTP_BAD_REQUEST);
        }

        $now = $this->now();
        if (null === $player) {
            $player = new Player($pseudo, $deviceId, $now);
        } else {
            $player->setLastPlayedAt($now);
        }
        $this->players->save($player);

        $bugs = $this->draw->draw();
        $bugIds = array_map(static fn (Bug $bug): string => $bug->id, $bugs);
        $game = new Game(bin2hex(random_bytes(16)), bin2hex(random_bytes(16)), $pseudo, $deviceId, $bugIds, $now, $this->choiceOrder->draw($bugs));
        $this->games->save($game);

        return $this->json(
            ['gameId' => $game->getId(), 'token' => $game->getToken(), 'totalBugs' => \count($bugIds)],
            Response::HTTP_CREATED,
        );
    }

    // GET /api/games/{id}/next: the current bug, without its answer, and the score so far. 204 once the game is over.
    #[Route('/{id}/next', methods: ['GET'])]
    public function next(string $id, Request $request): Response
    {
        $game = $this->gameFor($id, $request);
        $bugIds = $game->getBugIds();
        $index = $game->getCurrentIndex();
        if ($index >= \count($bugIds)) {
            return new Response(status: Response::HTTP_NO_CONTENT);
        }

        $bug = $this->bugOf($bugIds[$index]);

        // The timer starts on the first call; reloading the page does not restart it.
        $now = $this->now();
        if (null === $game->getCurrentSentAt()) {
            $game->setCurrentSentAt($now);
            $this->games->save($game);
        }

        return $this->json([
            'index' => $index,
            'bug' => $bug->toPublic($game->getChoiceOrder($bug->id)),
            'timeLimit' => Timer::TIME_LIMIT,
            'remainingSeconds' => Timer::remainingSeconds((int) $game->getCurrentSentAt(), $now),
            // Points so far: a reload in the middle of a game shows the right score at once.
            'score' => $game->getScore(),
        ]);
    }

    // POST /api/games/{id}/selection {bugId, selectedLine | selectedTarget}: the line
    // or device the player tapped. Revealing the right one here is intended (spec 2.3).
    #[Route('/{id}/selection', methods: ['POST'])]
    public function select(string $id, Request $request): JsonResponse
    {
        $game = $this->gameFor($id, $request);
        $data = $request->toArray();
        $bug = $this->currentBug($game, $data['bugId'] ?? null);
        if (null !== $game->getCurrentLineCorrect()) {
            throw new ApiException('already_selected', Response::HTTP_CONFLICT);
        }

        if ($bug->isDrawnAsLines()) {
            $selected = $data['selectedLine'] ?? null;
            if (!\is_int($selected)) {
                throw new ApiException('bad_request', Response::HTTP_BAD_REQUEST);
            }
            $lineCorrect = $selected === $bug->bugLine;
            $answer = ['lineCorrect' => $lineCorrect, 'correctLine' => $bug->bugLine];
        } else {
            $selected = $data['selectedTarget'] ?? null;
            if (!\is_string($selected)) {
                throw new ApiException('bad_request', Response::HTTP_BAD_REQUEST);
            }
            $lineCorrect = $selected === $bug->bugTarget;
            $answer = ['lineCorrect' => $lineCorrect, 'correctTarget' => $bug->bugTarget];
        }

        $game->setCurrentLineCorrect($lineCorrect);
        $this->saveOnce($game, 'already_selected');

        return $this->json($answer);
    }

    // POST /api/games/{id}/answers {bugId, choice}: the fix the player picked, or
    // null when the timer ran out on screen. Scores the bug and moves to the next one.
    #[Route('/{id}/answers', methods: ['POST'])]
    public function answer(string $id, Request $request): JsonResponse
    {
        $game = $this->gameFor($id, $request);
        $data = $request->toArray();
        if (\is_string($data['bugId'] ?? null) && $game->hasPlayed($data['bugId'])) {
            throw new ApiException('already_answered', Response::HTTP_CONFLICT);
        }
        $bug = $this->currentBug($game, $data['bugId'] ?? null);

        $choice = $data['choice'] ?? null;
        if (!\array_key_exists('choice', $data) || (null !== $choice && !\in_array($choice, [0, 1, 2], true))) {
            throw new ApiException('bad_request', Response::HTTP_BAD_REQUEST);
        }
        // A timeout needs no selection: the timer can run out before it.
        $lineCorrect = $game->getCurrentLineCorrect();
        if (null === $lineCorrect && null !== $choice) {
            throw new ApiException('selection_missing', Response::HTTP_CONFLICT);
        }

        $now = $this->now();
        $sentAt = $game->getCurrentSentAt();
        $timedOut = null === $choice || (null !== $sentAt && Timer::isOver($sentAt, $now));
        // choice is a position on screen; the answer is an index in the file.
        $order = $game->getChoiceOrder($bug->id);
        $correct = null !== $choice && ChoiceOrder::choiceAt($order, $choice) === $bug->answer;
        $points = Scoring::points($bug->difficulty, $lineCorrect ?? false, $correct, $timedOut);

        if ('dev' === $bug->track) {
            $game->setDevPoints($game->getDevPoints() + $points);
        } else {
            $game->setNetworkPoints($game->getNetworkPoints() + $points);
        }
        $game->setCurrentIndex($game->getCurrentIndex() + 1)
            ->setCurrentSentAt(null)
            ->setCurrentLineCorrect(null);
        $finished = null === $game->getCurrentBugId();
        if ($finished) {
            // A game without network bugs (dev-only mode) says nothing about the track.
            $affinity = $this->maxByTrack($game)['network'] > 0 ? Affinity::of($game->getDevPoints(), $game->getNetworkPoints()) : null;
            $game->finish($affinity, $now);
        }
        $this->saveOnce($game, 'already_answered');
        if ($finished) {
            $this->players->recordFinishedGame($game);
        }

        return $this->json([
            'correct' => $correct,
            'correctChoice' => ChoiceOrder::positionOf($order, $bug->answer),
            'points' => $points,
            'explanation' => $bug->explanation,
            'score' => $game->getScore(),
            'finished' => $finished,
        ]);
    }

    // GET /api/games/{id}/result: the end screen, once the last bug is answered.
    #[Route('/{id}/result', methods: ['GET'])]
    public function result(string $id, Request $request): JsonResponse
    {
        $game = $this->gameFor($id, $request);
        if (!$game->isFinished()) {
            throw new ApiException('game_not_finished', Response::HTTP_CONFLICT);
        }

        $dev = $game->getDevPoints();
        $network = $game->getNetworkPoints();
        $max = $this->maxByTrack($game);

        return $this->json([
            'score' => $game->getScore(),
            'maxScore' => $max['dev'] + $max['network'],
            'byTrack' => ['dev' => $dev, 'network' => $network],
            'percentByTrack' => ['dev' => Affinity::percent($dev, $max['dev']), 'network' => Affinity::percent($network, $max['network'])],
            // The one stored at the end of the game, which the gauges count.
            'affinity' => $game->getAffinity(),
            ...$this->players->standing($game),
        ]);
    }

    /**
     * Points a game could earn on each track: 1500 each on a real game, 3000 and 0 in dev-only mode.
     *
     * @return array{dev: int, network: int}
     */
    private function maxByTrack(Game $game): array
    {
        $max = ['dev' => 0, 'network' => 0];
        foreach ($game->getBugIds() as $bugId) {
            $bug = $this->bugOf($bugId);
            $max[$bug->track] += $bug->points;
        }

        return $max;
    }

    // The bug being played, if the request names it.
    private function currentBug(Game $game, mixed $bugId): Bug
    {
        if (!\is_string($bugId)) {
            throw new ApiException('bad_request', Response::HTTP_BAD_REQUEST);
        }
        if ($bugId !== $game->getCurrentBugId()) {
            throw new ApiException('not_current_bug', Response::HTTP_CONFLICT);
        }

        return $this->bugOf($bugId);
    }

    private function bugOf(string $bugId): Bug
    {
        return $this->catalog->get($bugId)
            ?? throw new \RuntimeException(\sprintf('Bug %s is not in BUGS_DIR.', $bugId));
    }

    // Two requests on the same game at once (a double tap): only the first one counts.
    private function saveOnce(Game $game, string $conflictCode): void
    {
        try {
            $this->games->save($game);
        } catch (OptimisticLockException) {
            throw new ApiException($conflictCode, Response::HTTP_CONFLICT);
        }
    }

    // The game of the URL, if the request carries its token (Authorization: Bearer <token>).
    private function gameFor(string $id, Request $request): Game
    {
        $game = $this->games->find($id) ?? throw new ApiException('unknown_game', Response::HTTP_NOT_FOUND);

        $header = (string) $request->headers->get('Authorization');
        $token = str_starts_with($header, 'Bearer ') ? substr($header, 7) : '';
        if (!hash_equals($game->getToken(), $token)) {
            throw new ApiException('bad_token', Response::HTTP_UNAUTHORIZED);
        }

        return $game;
    }

    private function now(): int
    {
        return (int) $this->clock->now()->format('Uv');
    }
}
