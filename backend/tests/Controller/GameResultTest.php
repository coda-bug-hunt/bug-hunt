<?php

namespace App\Tests\Controller;

use App\Entity\Game;
use App\Entity\Player;
use App\Repository\GameRepository;
use App\Repository\PlayerRepository;
use App\Tests\ApiTestCase;

/**
 * End-of-game result. Fixtures: dev-001 is worth 100 points, net-001 200.
 */
final class GameResultTest extends ApiTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        self::getContainer()->get(PlayerRepository::class)->save(new Player('Neo42', 'device1', 0));
        $this->saveGame(new Game('game1', 'token1', 'Neo42', 'device1', ['dev-001', 'net-001'], 0));
    }

    public function testTheResultOfAFinishedGame(): void
    {
        $this->playAll(devChoice: 2, networkChoice: 0);

        $body = $this->request('GET', '/api/games/game1/result', token: 'token1');

        self::assertResponseIsSuccessful();
        self::assertSame([
            'score' => 200,
            'maxScore' => 300,
            'byTrack' => ['dev' => 0, 'network' => 200],
            // Out of what this 2-bug game could earn (100 and 200); 1500 each on a real game.
            'percentByTrack' => ['dev' => 0, 'network' => 100],
            'affinity' => 'network',
            'rank' => 1,
            'playersCount' => 1,
        ], $body);
    }

    public function testTheAffinityIsTheOneStoredWithTheGame(): void
    {
        $this->playAll(devChoice: 0, networkChoice: 0);

        $body = $this->request('GET', '/api/games/game1/result', token: 'token1');

        $game = self::getContainer()->get(GameRepository::class)->find('game1');
        // 100 and 200 points: a gap of 6.7 percentage points.
        self::assertSame('both', $body['affinity']);
        self::assertSame($game?->getAffinity(), $body['affinity']);
    }

    public function testTheRankComesFromTheOtherPlayers(): void
    {
        $players = self::getContainer()->get(PlayerRepository::class);
        $players->save(new Player('Better', 'device2', 0));
        $players->recordFinishedGame((new Game('game2', 'token2', 'Better', 'device2', [], 0))
            ->setDevPoints(300)->finish('dev', 1_000));
        $this->playAll(devChoice: 0, networkChoice: 2);

        $body = $this->request('GET', '/api/games/game1/result', token: 'token1');

        self::assertSame(2, $body['rank']);
        self::assertSame(2, $body['playersCount']);
    }

    // Dev-only mode (#27): 10 dev bugs, so the dev maximum is the game's, not 1500.
    public function testAGameWithoutNetworkBugsHasNoAffinity(): void
    {
        $this->saveGame(new Game('game2', 'token2', 'Neo42', 'device1', ['dev-001', 'dev-002'], 0));
        $url = '/api/games/game2';
        $this->request('POST', "$url/selection", ['bugId' => 'dev-001', 'selectedLine' => 0], 'token2');
        $this->request('POST', "$url/answers", ['bugId' => 'dev-001', 'choice' => 0], 'token2');
        $this->request('POST', "$url/selection", ['bugId' => 'dev-002', 'selectedLine' => 1], 'token2');
        $this->request('POST', "$url/answers", ['bugId' => 'dev-002', 'choice' => 0], 'token2');

        $body = $this->request('GET', "$url/result", token: 'token2');

        self::assertNull($body['affinity']);
        self::assertSame(['dev' => 100, 'network' => 0], $body['percentByTrack']);
        self::assertNull(self::getContainer()->get(PlayerRepository::class)->findByPseudo('Neo42')?->getAffinity());
    }

    public function testAGameNotFinished(): void
    {
        $body = $this->request('GET', '/api/games/game1/result', token: 'token1');

        self::assertResponseStatusCodeSame(409);
        self::assertSame(['error' => 'game_not_finished'], $body);
    }

    public function testTheTokenIsRequired(): void
    {
        $this->playAll(devChoice: 0, networkChoice: 0);

        $body = $this->request('GET', '/api/games/game1/result', token: 'wrong');

        self::assertResponseStatusCodeSame(401);
        self::assertSame(['error' => 'bad_token'], $body);
    }

    // Right line on both bugs, then the given fixes (0 is the right one).
    private function playAll(int $devChoice, int $networkChoice): void
    {
        $url = '/api/games/game1';
        $this->request('POST', "$url/selection", ['bugId' => 'dev-001', 'selectedLine' => 0], 'token1');
        $this->request('POST', "$url/answers", ['bugId' => 'dev-001', 'choice' => $devChoice], 'token1');
        $this->request('POST', "$url/selection", ['bugId' => 'net-001', 'selectedTarget' => 'printer'], 'token1');
        $this->request('POST', "$url/answers", ['bugId' => 'net-001', 'choice' => $networkChoice], 'token1');
    }
}
