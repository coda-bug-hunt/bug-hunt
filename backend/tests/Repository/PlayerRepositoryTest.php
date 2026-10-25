<?php

namespace App\Tests\Repository;

use App\Entity\Game;
use App\Entity\Player;
use App\Repository\PlayerRepository;
use App\Tests\DatabaseTestCase;

final class PlayerRepositoryTest extends DatabaseTestCase
{
    private PlayerRepository $players;

    protected function setUp(): void
    {
        parent::setUp();
        $this->players = self::getContainer()->get(PlayerRepository::class);
    }

    public function testNicknamesAreCaseInsensitive(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));
        $this->reload();

        $player = $this->players->findByPseudo('neo42');

        self::assertNotNull($player);
        self::assertSame('Neo42', $player->getPseudo());
        self::assertSame('neo42', $player->getPseudoKey());
        self::assertSame($player, $this->players->findByPseudo('NEO42'));
    }

    public function testRecordAFinishedGame(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));

        $this->players->recordFinishedGame($this->finishedGame('neo42', 900, 1250, 'network', 5_000));
        $this->reload();

        $player = $this->players->findByPseudo('Neo42');
        self::assertNotNull($player);
        self::assertTrue($player->hasFinishedGame());
        self::assertSame(2150, $player->getBestScore());
        self::assertSame(900, $player->getBestDev());
        self::assertSame(1250, $player->getBestNetwork());
        self::assertSame('network', $player->getAffinity());
        self::assertSame(5_000, $player->getBestReachedAt());
    }

    public function testAFirstGameAtZeroIsStillRecorded(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));

        $this->players->recordFinishedGame($this->finishedGame('Neo42', 0, 0, 'both', 5_000));
        $this->reload();

        $player = $this->players->findByPseudo('Neo42');
        self::assertNotNull($player);
        self::assertTrue($player->hasFinishedGame());
        self::assertSame(0, $player->getBestScore());
    }

    public function testALowerScoreNeverReplacesABetterOne(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));
        $this->players->recordFinishedGame($this->finishedGame('Neo42', 1000, 500, 'dev', 5_000));

        $this->players->recordFinishedGame($this->finishedGame('Neo42', 200, 300, 'both', 9_000));
        // An equal score keeps the first one: it was reached earlier.
        $this->players->recordFinishedGame($this->finishedGame('Neo42', 500, 1000, 'network', 9_500));
        $this->reload();

        $player = $this->players->findByPseudo('Neo42');
        self::assertNotNull($player);
        self::assertSame(1500, $player->getBestScore());
        self::assertSame(1000, $player->getBestDev());
        self::assertSame('dev', $player->getAffinity());
        self::assertSame(5_000, $player->getBestReachedAt());
    }

    public function testAHigherScoreReplacesTheBestOne(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));
        $this->players->recordFinishedGame($this->finishedGame('Neo42', 200, 300, 'both', 5_000));

        $this->players->recordFinishedGame($this->finishedGame('Neo42', 1000, 500, 'dev', 9_000));
        $this->reload();

        $player = $this->players->findByPseudo('Neo42');
        self::assertNotNull($player);
        self::assertSame(1500, $player->getBestScore());
        self::assertSame('dev', $player->getAffinity());
        self::assertSame(9_000, $player->getBestReachedAt());
    }

    public function testAnUnfinishedGameCannotBeRecorded(): void
    {
        $this->expectException(\LogicException::class);

        $this->players->recordFinishedGame(new Game('game1', 'token1', 'Neo42', 'device1', [], 1_000));
    }

    public function testHideAndShowAPlayer(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));

        self::assertTrue($this->players->setHidden('NEO42', true));
        $this->reload();
        self::assertTrue($this->players->findByPseudo('Neo42')?->isHidden());

        // Hiding twice still finds the player.
        self::assertTrue($this->players->setHidden('Neo42', true));
        self::assertTrue($this->players->setHidden('Neo42', false));
        $this->reload();
        self::assertFalse($this->players->findByPseudo('Neo42')?->isHidden());
    }

    public function testHidingAnUnknownPlayerFails(): void
    {
        self::assertFalse($this->players->setHidden('Ghost', true));
    }

    public function testLatestPlayersComeFirst(): void
    {
        $this->players->save(new Player('Old', 'device1', 1_000));
        $this->players->save(new Player('Newest', 'device2', 3_000));
        $this->players->save(new Player('Middle', 'device3', 2_000));

        $latest = $this->players->latest(2);

        self::assertSame(['Newest', 'Middle'], array_map(fn (Player $player) => $player->getPseudo(), $latest));
    }

    private function finishedGame(string $pseudo, int $dev, int $network, string $affinity, int $finishedAt): Game
    {
        return (new Game(bin2hex(random_bytes(16)), 'token', $pseudo, 'device1', [], 1_000))
            ->setDevPoints($dev)
            ->setNetworkPoints($network)
            ->finish($affinity, $finishedAt);
    }
}
