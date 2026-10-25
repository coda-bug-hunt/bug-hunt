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

    public function testTheFirstPlayerRanksFirst(): void
    {
        $game = $this->play('Neo42', 900, 5_000);

        self::assertSame(['rank' => 1, 'playersCount' => 1], $this->players->standing($game));
    }

    public function testRankAmongTheBestScores(): void
    {
        $this->play('Better', 1200, 1_000);
        $this->play('Worse', 300, 2_000);
        $game = $this->play('Neo42', 900, 5_000);

        self::assertSame(['rank' => 2, 'playersCount' => 3], $this->players->standing($game));
    }

    // Same order as the leaderboard: on a tie, the score reached first ranks higher.
    public function testATieGoesToTheScoreReachedFirst(): void
    {
        $this->play('Early', 900, 1_000);
        $this->play('Late', 900, 9_000);
        $game = $this->play('Neo42', 900, 5_000);

        self::assertSame(['rank' => 2, 'playersCount' => 3], $this->players->standing($game));
    }

    public function testHiddenPlayersAreLeftOut(): void
    {
        $this->play('Rude', 1200, 1_000);
        $this->players->setHidden('Rude', true);
        $game = $this->play('Neo42', 900, 5_000);

        self::assertSame(['rank' => 1, 'playersCount' => 1], $this->players->standing($game));
    }

    public function testPlayersWithoutAFinishedGameAreLeftOut(): void
    {
        $this->players->save(new Player('Starter', 'device2', 1_000));
        $game = $this->play('Neo42', 900, 5_000);

        self::assertSame(['rank' => 1, 'playersCount' => 1], $this->players->standing($game));
    }

    // A replay below the player's own best is not ranked behind that best.
    public function testAWorseReplayIsRankedAgainstTheOthersOnly(): void
    {
        $this->play('Other', 600, 1_000);
        $this->play('Neo42', 1200, 2_000);
        $replay = $this->play('Neo42', 300, 5_000);

        self::assertSame(['rank' => 2, 'playersCount' => 2], $this->players->standing($replay));
    }

    // A hidden player still sees a rank, and is counted so the rank never exceeds the count.
    public function testAHiddenPlayerStillGetsARank(): void
    {
        $this->play('Other', 1200, 1_000);
        $this->play('Neo42', 300, 2_000);
        $this->players->setHidden('Neo42', true);
        $replay = $this->play('Neo42', 900, 5_000);

        self::assertSame(['rank' => 2, 'playersCount' => 2], $this->players->standing($replay));
    }

    public function testTopIsInLeaderboardOrder(): void
    {
        $this->play('Middle', 900, 1_000);
        $this->play('Best', 1200, 2_000);
        $this->play('Late', 900, 3_000);

        self::assertSame(['Best', 'Middle', 'Late'], $this->pseudos($this->players->top(10)));
    }

    public function testTopLeavesOutHiddenPlayersAndPlayersWithoutAFinishedGame(): void
    {
        $this->play('Neo42', 900, 1_000);
        $this->play('Rude', 1200, 2_000);
        $this->players->setHidden('Rude', true);
        $this->players->save(new Player('Starter', 'device2', 1_000));

        self::assertSame(['Neo42'], $this->pseudos($this->players->top(10)));
    }

    public function testAReplayAppearsOnceWithTheBestScore(): void
    {
        $this->play('Neo42', 1200, 1_000);
        $this->play('Neo42', 300, 2_000);
        $this->reload();

        $top = $this->players->top(10);

        self::assertSame(['Neo42'], $this->pseudos($top));
        self::assertSame(1200, $top[0]->getBestScore());
    }

    public function testTopIsLimited(): void
    {
        for ($i = 1; $i <= 12; ++$i) {
            $this->play("Player$i", $i * 100, 1_000);
        }

        $top = $this->players->top(10);

        self::assertCount(10, $top);
        self::assertSame('Player12', $top[0]->getPseudo());
        self::assertSame('Player3', $top[9]->getPseudo());
    }

    // The end screen and the big screen show the same rank.
    public function testTopAgreesWithTheStanding(): void
    {
        $games = [
            'Middle' => $this->play('Middle', 900, 1_000),
            'Best' => $this->play('Best', 1200, 2_000),
            'Late' => $this->play('Late', 900, 3_000),
        ];

        foreach ($this->players->top(10) as $index => $player) {
            self::assertSame($index + 1, $this->players->standing($games[$player->getPseudo()])['rank']);
        }
    }

    /**
     * @param list<Player> $players
     *
     * @return list<string>
     */
    private function pseudos(array $players): array
    {
        return array_map(fn (Player $player): string => $player->getPseudo(), $players);
    }

    // Saves the player if needed, then records a finished game (all points in dev).
    private function play(string $pseudo, int $score, int $finishedAt): Game
    {
        if (null === $this->players->findByPseudo($pseudo)) {
            $this->players->save(new Player($pseudo, 'device1', 1_000));
        }
        $game = $this->finishedGame($pseudo, $score, 0, 'dev', $finishedAt);
        $this->players->recordFinishedGame($game);

        return $game;
    }

    private function finishedGame(string $pseudo, int $dev, int $network, string $affinity, int $finishedAt): Game
    {
        return (new Game(bin2hex(random_bytes(16)), 'token', $pseudo, 'device1', [], 1_000))
            ->setDevPoints($dev)
            ->setNetworkPoints($network)
            ->finish($affinity, $finishedAt);
    }
}
