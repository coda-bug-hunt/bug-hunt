<?php

namespace App\Tests\Command;

use App\Entity\Game;
use App\Entity\Player;
use App\Repository\GameRepository;
use App\Repository\PlayerRepository;
use App\Tests\DatabaseTestCase;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;

final class ResetScoresCommandTest extends DatabaseTestCase
{
    private CommandTester $command;

    protected function setUp(): void
    {
        parent::setUp();
        $application = new Application(self::$kernel);
        $this->command = new CommandTester($application->find('app:reset-scores'));

        self::getContainer()->get(PlayerRepository::class)->save(new Player('Neo42', 'device1', 1_000));
        self::getContainer()->get(GameRepository::class)->save(new Game('game1', 'token1', 'Neo42', 'device1', [], 1_000));
    }

    public function testEmptiesBothTables(): void
    {
        $this->command->setInputs(['yes']);

        self::assertSame(Command::SUCCESS, $this->command->execute([]));
        $this->reload();
        self::assertSame(0, self::getContainer()->get(GameRepository::class)->count());
        self::assertSame(0, self::getContainer()->get(PlayerRepository::class)->count());
    }

    public function testDeletesNothingWithoutConfirmation(): void
    {
        $this->command->setInputs(['no']);

        self::assertSame(Command::FAILURE, $this->command->execute([]));
        $this->reload();
        self::assertSame(1, self::getContainer()->get(GameRepository::class)->count());
        self::assertSame(1, self::getContainer()->get(PlayerRepository::class)->count());
    }
}
