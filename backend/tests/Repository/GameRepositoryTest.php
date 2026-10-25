<?php

namespace App\Tests\Repository;

use App\Entity\Game;
use App\Repository\GameRepository;
use App\Tests\DatabaseTestCase;

final class GameRepositoryTest extends DatabaseTestCase
{
    private GameRepository $games;

    protected function setUp(): void
    {
        parent::setUp();
        $this->games = self::getContainer()->get(GameRepository::class);
    }

    public function testCreateAndReadBackAGame(): void
    {
        $this->games->save(new Game('game1', 'token1', 'Neo42', 'device1', ['dev-001', 'net-001'], 1_000));
        $this->reload();

        $game = $this->games->find('game1');

        self::assertNotNull($game);
        self::assertSame('token1', $game->getToken());
        self::assertSame('Neo42', $game->getPseudo());
        self::assertSame('device1', $game->getDeviceId());
        self::assertSame(['dev-001', 'net-001'], $game->getBugIds());
        self::assertSame(0, $game->getCurrentIndex());
        self::assertNull($game->getCurrentSentAt());
        self::assertNull($game->getCurrentLineCorrect());
        self::assertSame(0, $game->getScore());
        self::assertSame(1_000, $game->getCreatedAt());
        self::assertFalse($game->isFinished());
    }

    public function testSaveTheProgressOfAGame(): void
    {
        $game = new Game('game1', 'token1', 'Neo42', 'device1', ['dev-001', 'net-001'], 1_000);
        $this->games->save($game);

        // Times above 2^31 ms: they need the BIGINT columns.
        $game->setCurrentIndex(2)
            ->setCurrentSentAt(1_761_400_000_000)
            ->setCurrentLineCorrect(false)
            ->setDevPoints(100)
            ->setNetworkPoints(50)
            ->finish('dev', 1_761_400_060_000);
        $this->games->save($game);
        $this->reload();

        $game = $this->games->find('game1');

        self::assertNotNull($game);
        self::assertSame(2, $game->getCurrentIndex());
        self::assertSame(1_761_400_000_000, $game->getCurrentSentAt());
        self::assertFalse($game->getCurrentLineCorrect());
        self::assertSame(150, $game->getScore());
        self::assertSame('dev', $game->getAffinity());
        self::assertSame(1_761_400_060_000, $game->getFinishedAt());
    }

    public function testUnknownGameIsNull(): void
    {
        self::assertNull($this->games->find('nope'));
    }
}
