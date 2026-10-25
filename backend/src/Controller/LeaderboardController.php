<?php

namespace App\Controller;

use App\Repository\GameRepository;
use App\Repository\PlayerRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class LeaderboardController extends AbstractController
{
    private const TOP_SIZE = 10;

    public function __construct(
        private readonly PlayerRepository $players,
        private readonly GameRepository $games,
    ) {
    }

    // GET /api/leaderboard: read by the big screen every 2 seconds, no authentication.
    // Two queries, whatever the number of games. The record of the day is top[0].
    #[Route('/api/leaderboard', methods: ['GET'], format: 'json')]
    public function __invoke(): JsonResponse
    {
        $top = [];
        foreach ($this->players->top(self::TOP_SIZE) as $index => $player) {
            $top[] = [
                'rank' => $index + 1,
                'pseudo' => $player->getPseudo(),
                'score' => $player->getBestScore(),
                'affinity' => $player->getAffinity(),
                'byTrack' => ['dev' => $player->getBestDev(), 'network' => $player->getBestNetwork()],
            ];
        }

        return $this->json(['top' => $top, ...$this->games->stats()]);
    }
}
