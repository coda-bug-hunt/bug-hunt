<?php

namespace App\Tests\Controller;

use App\Entity\Game;
use App\Entity\Player;
use App\Repository\GameRepository;
use App\Repository\PlayerRepository;
use App\Tests\ApiTestCase;

/**
 * Selection and answer of a bug. Fixtures (tests/fixtures/bugs): dev-001 is
 * level 0, faulty line 0, right fix 0; net-001 is level 1, faulty device
 * "printer", right fix 0.
 */
final class GameAnswerTest extends ApiTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        self::getContainer()->get(PlayerRepository::class)->save(new Player('Neo42', 'device1', 0));
        $this->saveGame(new Game('game1', 'token1', 'Neo42', 'device1', ['dev-001', 'net-001'], 0));
    }

    public function testSelectTheRightLine(): void
    {
        $body = $this->select(['bugId' => 'dev-001', 'selectedLine' => 0]);

        self::assertResponseIsSuccessful();
        self::assertSame(['lineCorrect' => true, 'correctLine' => 0], $body);
    }

    public function testSelectAWrongLineRevealsTheRightOne(): void
    {
        $body = $this->select(['bugId' => 'dev-001', 'selectedLine' => 1]);

        self::assertSame(['lineCorrect' => false, 'correctLine' => 0], $body);
    }

    public function testSelectADevice(): void
    {
        $this->playFirstBug();

        $body = $this->select(['bugId' => 'net-001', 'selectedTarget' => 'pc']);

        self::assertSame(['lineCorrect' => false, 'correctTarget' => 'printer'], $body);
    }

    public function testOnlyOneSelectionPerBug(): void
    {
        $this->select(['bugId' => 'dev-001', 'selectedLine' => 1]);
        $body = $this->select(['bugId' => 'dev-001', 'selectedLine' => 0]);

        self::assertResponseStatusCodeSame(409);
        self::assertSame(['error' => 'already_selected'], $body);
    }

    public function testSelectAnotherBugThanTheCurrentOne(): void
    {
        $body = $this->select(['bugId' => 'net-001', 'selectedTarget' => 'printer']);

        self::assertResponseStatusCodeSame(409);
        self::assertSame(['error' => 'not_current_bug'], $body);
    }

    public function testSelectWithoutTheFieldOfTheTrack(): void
    {
        $body = $this->select(['bugId' => 'dev-001', 'selectedTarget' => 'printer']);

        self::assertResponseStatusCodeSame(400);
        self::assertSame(['error' => 'bad_request'], $body);
    }

    public function testRightLineAndRightFix(): void
    {
        $this->select(['bugId' => 'dev-001', 'selectedLine' => 0]);

        $body = $this->answer(['bugId' => 'dev-001', 'choice' => 0]);

        self::assertResponseIsSuccessful();
        self::assertSame([
            'correct' => true,
            'correctChoice' => 0,
            'points' => 100,
            'explanation' => 'Il faut additionner les frais de port.',
            'score' => 100,
            'finished' => false,
        ], $body);
    }

    public function testTheChoiceIsAPositionOnScreen(): void
    {
        // On screen: choice 2 of the file, then 0 (the right fix), then 1.
        $this->saveGame(new Game('game2', 'token2', 'Neo42', 'device1', ['dev-001'], 0, ['dev-001' => [2, 0, 1]]));
        $this->request('POST', '/api/games/game2/selection', ['bugId' => 'dev-001', 'selectedLine' => 0], 'token2');

        $body = $this->request('POST', '/api/games/game2/answers', ['bugId' => 'dev-001', 'choice' => 1], 'token2');

        self::assertTrue($body['correct']);
        self::assertSame(1, $body['correctChoice']);
        self::assertSame(100, $body['points']);
    }

    public function testTheFirstPositionIsNoLongerAlwaysRight(): void
    {
        $this->saveGame(new Game('game2', 'token2', 'Neo42', 'device1', ['dev-001'], 0, ['dev-001' => [2, 0, 1]]));
        $this->request('POST', '/api/games/game2/selection', ['bugId' => 'dev-001', 'selectedLine' => 0], 'token2');

        $body = $this->request('POST', '/api/games/game2/answers', ['bugId' => 'dev-001', 'choice' => 0], 'token2');

        self::assertFalse($body['correct']);
        self::assertSame(1, $body['correctChoice'], 'the right fix in the order on screen');
        self::assertSame(0, $body['points']);
    }

    public function testWrongLineThenRightFixScoresHalf(): void
    {
        $this->select(['bugId' => 'dev-001', 'selectedLine' => 1]);

        $body = $this->answer(['bugId' => 'dev-001', 'choice' => 0]);

        self::assertTrue($body['correct']);
        self::assertSame(50, $body['points']);
    }

    public function testWrongFixScoresNothing(): void
    {
        $this->select(['bugId' => 'dev-001', 'selectedLine' => 0]);

        $body = $this->answer(['bugId' => 'dev-001', 'choice' => 2]);

        self::assertFalse($body['correct']);
        self::assertSame(0, $body['correctChoice']);
        self::assertSame(0, $body['points']);
    }

    public function testATimeoutNeedsNoSelection(): void
    {
        $body = $this->answer(['bugId' => 'dev-001', 'choice' => null]);

        self::assertResponseIsSuccessful();
        self::assertFalse($body['correct']);
        self::assertSame(0, $body['points']);
        self::assertSame(1, $this->game()->getCurrentIndex());
    }

    public function testARightAnswerAfterTheTimeLimitScoresNothing(): void
    {
        $this->request('GET', '/api/games/game1/next', token: 'token1');
        $this->clock->sleep(65);
        $this->select(['bugId' => 'dev-001', 'selectedLine' => 0]);

        $body = $this->answer(['bugId' => 'dev-001', 'choice' => 0]);

        self::assertTrue($body['correct']);
        self::assertSame(0, $body['points']);
    }

    public function testAnAnswerNeedsASelection(): void
    {
        $body = $this->answer(['bugId' => 'dev-001', 'choice' => 0]);

        self::assertResponseStatusCodeSame(409);
        self::assertSame(['error' => 'selection_missing'], $body);
    }

    public function testOnlyOneAnswerPerBug(): void
    {
        $this->playFirstBug();

        $body = $this->answer(['bugId' => 'dev-001', 'choice' => 0]);

        self::assertResponseStatusCodeSame(409);
        self::assertSame(['error' => 'already_answered'], $body);
        self::assertSame(100, $this->game()->getScore());
    }

    public function testAnswerAnotherBugThanTheCurrentOne(): void
    {
        $body = $this->answer(['bugId' => 'net-001', 'choice' => 0]);

        self::assertResponseStatusCodeSame(409);
        self::assertSame(['error' => 'not_current_bug'], $body);
    }

    public function testAChoiceOutOfRange(): void
    {
        $this->select(['bugId' => 'dev-001', 'selectedLine' => 0]);

        foreach ([['choice' => 3], ['choice' => '0'], []] as $choice) {
            $body = $this->answer(['bugId' => 'dev-001', ...$choice]);

            self::assertResponseStatusCodeSame(400);
            self::assertSame(['error' => 'bad_request'], $body);
        }
    }

    public function testTheLastAnswerFinishesTheGame(): void
    {
        $this->playFirstBug();
        $this->select(['bugId' => 'net-001', 'selectedTarget' => 'printer']);

        $body = $this->answer(['bugId' => 'net-001', 'choice' => 0]);

        self::assertSame(200, $body['points']);
        self::assertSame(300, $body['score']);
        self::assertTrue($body['finished']);

        $game = $this->game();
        self::assertSame(100, $game->getDevPoints());
        self::assertSame(200, $game->getNetworkPoints());
        self::assertTrue($game->isFinished());
        self::assertSame('both', $game->getAffinity());

        $player = self::getContainer()->get(PlayerRepository::class)->findByPseudo('Neo42');
        self::assertSame(300, $player?->getBestScore());
        self::assertSame('both', $player?->getAffinity());

        $this->client->request('GET', '/api/games/game1/next', server: ['HTTP_AUTHORIZATION' => 'Bearer token1']);
        self::assertResponseStatusCodeSame(204);
    }

    // A full game through the API only, as a phone plays it.
    public function testPlayAFullGame(): void
    {
        $game = $this->request('POST', '/api/games', ['pseudo' => 'Pixel', 'deviceId' => 'device2']);
        $token = $game['token'];
        $url = "/api/games/{$game['gameId']}";
        $answer = [];

        for ($i = 0; $i < $game['totalBugs']; ++$i) {
            $bug = $this->request('GET', "$url/next", token: $token)['bug'];
            $pick = 'dev' === $bug['track'] ? ['selectedLine' => 0] : ['selectedTarget' => 'printer'];
            $this->request('POST', "$url/selection", ['bugId' => $bug['id'], ...$pick], $token);
            // The right fix is choice 0 of every fixture file: find where this game shows it.
            $order = self::getContainer()->get(GameRepository::class)->find($game['gameId'])?->getChoiceOrder($bug['id']) ?? [];
            $answer = $this->request('POST', "$url/answers", ['bugId' => $bug['id'], 'choice' => array_search(0, $order, true)], $token);
            self::assertSame($i === $game['totalBugs'] - 1, $answer['finished']);
        }

        // Dev: line 0 is right for dev-001 only (100), the 4 others score half: 100 + 100 + 150 + 200 + 250.
        // Network: every faulty device is "printer", all right: 100 + 200 + 300 + 400 + 500.
        self::assertSame(2300, $answer['score']);
        self::assertSame(2300, self::getContainer()->get(PlayerRepository::class)->findByPseudo('pixel')?->getBestScore());
    }

    private function playFirstBug(): void
    {
        $this->select(['bugId' => 'dev-001', 'selectedLine' => 0]);
        $this->answer(['bugId' => 'dev-001', 'choice' => 0]);
    }

    /**
     * @param array<string, mixed> $json
     *
     * @return array<string, mixed>
     */
    private function select(array $json): array
    {
        return $this->request('POST', '/api/games/game1/selection', $json, 'token1');
    }

    /**
     * @param array<string, mixed> $json
     *
     * @return array<string, mixed>
     */
    private function answer(array $json): array
    {
        return $this->request('POST', '/api/games/game1/answers', $json, 'token1');
    }

    private function game(): Game
    {
        $game = self::getContainer()->get(GameRepository::class)->find('game1');
        self::assertNotNull($game);

        return $game;
    }
}
