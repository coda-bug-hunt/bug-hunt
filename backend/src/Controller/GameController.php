<?php

namespace App\Controller;

use App\Api\ApiException;
use App\Entity\Game;
use App\Entity\Player;
use App\Game\Bug;
use App\Game\BugCatalog;
use App\Game\BugDraw;
use App\Game\Timer;
use App\Player\NicknamePolicy;
use App\Repository\GameRepository;
use App\Repository\PlayerRepository;
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

        $now = $this->now();
        $player = $this->players->findByPseudo($pseudo);
        if (null === $player) {
            $player = new Player($pseudo, $deviceId, $now);
        } else {
            $player->setLastPlayedAt($now);
        }
        $this->players->save($player);

        $bugIds = array_map(static fn (Bug $bug): string => $bug->id, $this->draw->draw());
        $game = new Game(bin2hex(random_bytes(16)), bin2hex(random_bytes(16)), $pseudo, $deviceId, $bugIds, $now);
        $this->games->save($game);

        return $this->json(
            ['gameId' => $game->getId(), 'token' => $game->getToken(), 'totalBugs' => \count($bugIds)],
            Response::HTTP_CREATED,
        );
    }

    // GET /api/games/{id}/next: the current bug, without its answer. 204 once the game is over.
    #[Route('/{id}/next', methods: ['GET'])]
    public function next(string $id, Request $request): Response
    {
        $game = $this->gameFor($id, $request);
        $bugIds = $game->getBugIds();
        $index = $game->getCurrentIndex();
        if ($index >= \count($bugIds)) {
            return new Response(status: Response::HTTP_NO_CONTENT);
        }

        $bug = $this->catalog->get($bugIds[$index])
            ?? throw new \RuntimeException(\sprintf('Bug %s of game %s is not in BUGS_DIR.', $bugIds[$index], $id));

        // The timer starts on the first call; reloading the page does not restart it.
        $now = $this->now();
        if (null === $game->getCurrentSentAt()) {
            $game->setCurrentSentAt($now);
            $this->games->save($game);
        }

        return $this->json([
            'index' => $index,
            'bug' => $bug->toPublic(),
            'timeLimit' => Timer::TIME_LIMIT,
            'remainingSeconds' => Timer::remainingSeconds((int) $game->getCurrentSentAt(), $now),
        ]);
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
