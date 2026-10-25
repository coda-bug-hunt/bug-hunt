<?php

namespace App\Tests\Controller;

use App\Entity\Game;
use App\Entity\Player;
use App\Repository\PlayerRepository;
use App\Tests\ApiTestCase;
use Doctrine\ORM\EntityManagerInterface;

final class LeaderboardControllerTest extends ApiTestCase
{
    public function testTheLeaderboard(): void
    {
        $this->finish('Neo42', 900, 1250, 'network', 1_000);
        $this->finish('Pixel', 1300, 1050, 'dev', 2_000);
        $this->finish('Rude', 1500, 1500, 'both', 3_000);
        self::getContainer()->get(PlayerRepository::class)->setHidden('Rude', true);
        $this->saveGame(new Game('abandoned', 'token', 'Pixel', 'device1', [], 4_000));
        // The best scores were written by a DQL UPDATE: drop the stale players in memory.
        self::getContainer()->get(EntityManagerInterface::class)->clear();

        $body = $this->request('GET', '/api/leaderboard');

        self::assertResponseIsSuccessful();
        self::assertSame([
            'top' => [
                ['rank' => 1, 'pseudo' => 'Pixel', 'score' => 2350, 'affinity' => 'dev', 'byTrack' => ['dev' => 1300, 'network' => 1050]],
                ['rank' => 2, 'pseudo' => 'Neo42', 'score' => 2150, 'affinity' => 'network', 'byTrack' => ['dev' => 900, 'network' => 1250]],
            ],
            // The hidden player is not in the top but still counts in the gauges.
            'gauges' => ['dev' => 2, 'network' => 2],
            'gamesPlayed' => 3,
        ], $body);
    }

    public function testAnEmptyLeaderboard(): void
    {
        $body = $this->request('GET', '/api/leaderboard');

        self::assertSame(['top' => [], 'gauges' => ['dev' => 0, 'network' => 0], 'gamesPlayed' => 0], $body);
    }

    private function finish(string $pseudo, int $dev, int $network, string $affinity, int $finishedAt): void
    {
        $players = self::getContainer()->get(PlayerRepository::class);
        if (null === $players->findByPseudo($pseudo)) {
            $players->save(new Player($pseudo, 'device1', 0));
        }
        $game = (new Game(bin2hex(random_bytes(16)), 'token', $pseudo, 'device1', [], 0))
            ->setDevPoints($dev)
            ->setNetworkPoints($network)
            ->finish($affinity, $finishedAt);
        $this->saveGame($game);
        $players->recordFinishedGame($game);
    }
}
