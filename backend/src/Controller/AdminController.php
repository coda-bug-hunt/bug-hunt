<?php

namespace App\Controller;

use App\Api\ApiException;
use App\Repository\PlayerRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Admin view: a team member hides a nickname from the big screen, from a phone.
 * Every route needs the X-Admin-Pin header, checked before anything else.
 */
#[Route('/api/admin/players', format: 'json')]
final class AdminController extends AbstractController
{
    private const LIST_SIZE = 50;

    public function __construct(
        private readonly PlayerRepository $players,
        #[Autowire('%env(ADMIN_PIN)%')]
        private readonly string $adminPin,
    ) {
    }

    // GET /api/admin/players: the latest players, most recent first.
    #[Route('', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $this->checkPin($request);

        $players = [];
        foreach ($this->players->latest(self::LIST_SIZE) as $player) {
            $players[] = [
                'pseudo' => $player->getPseudo(),
                'bestScore' => $player->getBestScore(),
                'affinity' => $player->getAffinity(),
                'hidden' => $player->isHidden(),
                'lastPlayedAt' => self::isoDate($player->getLastPlayedAt()),
            ];
        }

        return $this->json(['players' => $players]);
    }

    // PATCH /api/admin/players/{pseudo} {hidden}: hides or shows a nickname. Their games still count in the gauges.
    #[Route('/{pseudo}', methods: ['PATCH'])]
    public function setHidden(string $pseudo, Request $request): Response
    {
        $this->checkPin($request);

        $hidden = $request->toArray()['hidden'] ?? null;
        if (!\is_bool($hidden)) {
            throw new ApiException('bad_request', Response::HTTP_BAD_REQUEST);
        }
        if (!$this->players->setHidden($pseudo, $hidden)) {
            throw new ApiException('unknown_player', Response::HTTP_NOT_FOUND);
        }

        return new Response(status: Response::HTTP_NO_CONTENT);
    }

    // An empty ADMIN_PIN refuses every PIN, the empty one included.
    private function checkPin(Request $request): void
    {
        $pin = (string) $request->headers->get('X-Admin-Pin');
        if ('' === $this->adminPin || !hash_equals($this->adminPin, $pin)) {
            throw new ApiException('bad_pin', Response::HTTP_UNAUTHORIZED);
        }
    }

    // Milliseconds to ISO 8601 in UTC, as the front reads it: 2026-11-07T10:05:00.000Z.
    private static function isoDate(int $ms): string
    {
        return (new \DateTimeImmutable('@'.intdiv($ms, 1000)))->format('Y-m-d\TH:i:s').\sprintf('.%03dZ', $ms % 1000);
    }
}
