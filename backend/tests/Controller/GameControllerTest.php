<?php

namespace App\Tests\Controller;

use App\Entity\Game;
use App\Repository\GameRepository;
use App\Repository\PlayerRepository;
use App\Tests\ApiTestCase;

final class GameControllerTest extends ApiTestCase
{
    private const SECRET_FIELDS = ['bugLine', 'bugTarget', 'answer', 'explanation'];

    public function testCreateAGame(): void
    {
        $body = $this->request('POST', '/api/games', ['pseudo' => 'Neo42', 'deviceId' => 'device1']);

        self::assertResponseStatusCodeSame(201);
        self::assertSame(['gameId', 'token', 'totalBugs'], array_keys($body));
        self::assertMatchesRegularExpression('/^[0-9a-f]{32}$/', $body['gameId']);
        self::assertMatchesRegularExpression('/^[0-9a-f]{32}$/', $body['token']);
        self::assertSame(10, $body['totalBugs']);

        $game = self::getContainer()->get(GameRepository::class)->find($body['gameId']);
        // One bug per track and level in the fixtures: the draw has no choice.
        self::assertSame(
            ['dev-001', 'net-002', 'dev-002', 'net-001', 'dev-003', 'net-003', 'dev-004', 'net-004', 'dev-005', 'net-005'],
            $game?->getBugIds(),
        );
        self::assertSame('Neo42', self::getContainer()->get(PlayerRepository::class)->findByPseudo('neo42')?->getPseudo());
        self::assertNotNull($game);
        foreach ($game->getBugIds() as $bugId) {
            $order = $game->getChoiceOrder($bugId);
            sort($order);
            self::assertSame([0, 1, 2], $order, "a choice order for $bugId");
        }
    }

    public function testServesTheChoicesInTheOrderOfTheGame(): void
    {
        $this->saveGame(new Game('game1', 'token1', 'Neo42', 'device1', ['dev-001'], 0, ['dev-001' => [2, 0, 1]]));

        $first = $this->request('GET', '/api/games/game1/next', token: 'token1');
        $second = $this->request('GET', '/api/games/game1/next', token: 'token1');

        // dev-001.json: "total = price + shipping" (the right fix), then two wrong ones.
        self::assertSame('total = price + shipping', $first['bug']['choices'][1]);
        self::assertSame($first['bug']['choices'], $second['bug']['choices'], 'reloading keeps the order');
    }

    public function testReplayingKeepsOnePlayer(): void
    {
        $players = self::getContainer()->get(PlayerRepository::class);
        $this->request('POST', '/api/games', ['pseudo' => 'Neo42', 'deviceId' => 'device1']);
        $firstPlayedAt = $players->findByPseudo('neo42')?->getLastPlayedAt();
        $this->clock->sleep(120);
        $this->request('POST', '/api/games', ['pseudo' => 'NEO42', 'deviceId' => 'device1']);

        self::assertResponseStatusCodeSame(201);
        self::assertSame(1, $players->count());
        self::assertSame($firstPlayedAt + 120_000, $players->findByPseudo('neo42')?->getLastPlayedAt());
    }

    public function testRejectsAnInvalidNickname(): void
    {
        foreach (['Bo', 'Neo 42', 'abcdefghijklmnopq', 42] as $pseudo) {
            $body = $this->request('POST', '/api/games', ['pseudo' => $pseudo, 'deviceId' => 'device1']);

            self::assertResponseStatusCodeSame(400);
            self::assertSame(['error' => 'pseudo_invalid'], $body);
        }
        self::assertSame(0, self::getContainer()->get(GameRepository::class)->count());
    }

    public function testRejectsAMissingDeviceId(): void
    {
        $body = $this->request('POST', '/api/games', ['pseudo' => 'Neo42']);

        self::assertResponseStatusCodeSame(400);
        self::assertSame(['error' => 'bad_request'], $body);
    }

    public function testRejectsABodyThatIsNotJson(): void
    {
        $this->client->request('POST', '/api/games', server: ['CONTENT_TYPE' => 'application/json'], content: 'pseudo=Neo42');

        self::assertResponseStatusCodeSame(400);
        self::assertSame(['error' => 'bad_request'], $this->json());
    }

    public function testServesTheCurrentDevBugWithoutItsAnswer(): void
    {
        $game = $this->request('POST', '/api/games', ['pseudo' => 'Neo42', 'deviceId' => 'device1']);

        $body = $this->request('GET', "/api/games/{$game['gameId']}/next", token: $game['token']);

        self::assertResponseIsSuccessful();
        self::assertSame(['index', 'bug', 'timeLimit', 'remainingSeconds', 'score'], array_keys($body));
        self::assertSame(0, $body['index']);
        self::assertSame(60, $body['timeLimit']);
        self::assertSame(60, $body['remainingSeconds']);
        self::assertSame(0, $body['score']);
        self::assertSame('dev-001', $body['bug']['id']);
        self::assertSame(['total = price - shipping', 'print(total)'], $body['bug']['code']);
        self::assertSame('Regarde le signe entre le prix et les frais.', $body['bug']['hint']);
        foreach (self::SECRET_FIELDS as $field) {
            self::assertArrayNotHasKey($field, $body['bug']);
        }
    }

    public function testServesANetworkBugWithoutItsAnswer(): void
    {
        $this->saveGame(new Game('game1', 'token1', 'Neo42', 'device1', ['net-001'], 0));

        $body = $this->request('GET', '/api/games/game1/next', token: 'token1');

        self::assertResponseIsSuccessful();
        self::assertSame('network', $body['bug']['track']);
        self::assertArrayHasKey('diagram', $body['bug']);
        foreach (self::SECRET_FIELDS as $field) {
            self::assertArrayNotHasKey($field, $body['bug']);
        }
    }

    public function testServesANetworkBugDrawnAsLinesWithItsView(): void
    {
        $this->saveGame(new Game('game1', 'token1', 'Neo42', 'device1', ['net-005'], 0));

        $bug = $this->request('GET', '/api/games/game1/next', token: 'token1')['bug'];

        self::assertSame('network', $bug['track']);
        self::assertSame('terminal', $bug['view']);
        self::assertSame('Le PC joint 8.8.8.8, mais aucun site.', $bug['context']);
        self::assertCount(4, $bug['code']);
        self::assertArrayNotHasKey('diagram', $bug);
        foreach (self::SECRET_FIELDS as $secret) {
            self::assertArrayNotHasKey($secret, $bug);
        }
    }

    // A reload in the middle of a game shows the right score at once (#116).
    public function testServesTheScoreSoFarWithTheBug(): void
    {
        $this->saveGame((new Game('game1', 'token1', 'Neo42', 'device1', ['dev-001', 'net-001', 'dev-002'], 0))
            ->setCurrentIndex(2)->setDevPoints(100)->setNetworkPoints(100));

        $body = $this->request('GET', '/api/games/game1/next', token: 'token1');

        self::assertSame(2, $body['index']);
        self::assertSame(200, $body['score']);
    }

    public function testCallingNextAgainDoesNotRestartTheTimer(): void
    {
        $game = $this->request('POST', '/api/games', ['pseudo' => 'Neo42', 'deviceId' => 'device1']);
        $next = "/api/games/{$game['gameId']}/next";

        $first = $this->request('GET', $next, token: $game['token']);
        $this->clock->sleep(25);
        $second = $this->request('GET', $next, token: $game['token']);
        $this->clock->sleep(60);
        $third = $this->request('GET', $next, token: $game['token']);

        self::assertSame($first['bug'], $second['bug']);
        self::assertSame(0, $second['index']);
        self::assertSame(35, $second['remainingSeconds']);
        self::assertSame(0, $third['remainingSeconds']);
    }

    public function testAnswers204OnceTheGameIsOver(): void
    {
        $this->saveGame((new Game('game1', 'token1', 'Neo42', 'device1', ['dev-001'], 0))->setCurrentIndex(1));

        $this->client->request('GET', '/api/games/game1/next', server: ['HTTP_AUTHORIZATION' => 'Bearer token1']);

        self::assertResponseStatusCodeSame(204);
        self::assertSame('', $this->client->getResponse()->getContent());
    }

    public function testRejectsAWrongOrMissingToken(): void
    {
        $this->saveGame(new Game('game1', 'token1', 'Neo42', 'device1', ['dev-001'], 0));

        foreach (['wrong', null] as $token) {
            $body = $this->request('GET', '/api/games/game1/next', token: $token);

            self::assertResponseStatusCodeSame(401);
            self::assertSame(['error' => 'bad_token'], $body);
        }
        // The token is not accepted without the Bearer prefix either.
        $this->client->request('GET', '/api/games/game1/next', server: ['HTTP_AUTHORIZATION' => 'token1']);
        self::assertResponseStatusCodeSame(401);
    }

    public function testRejectsAnUnknownGame(): void
    {
        $body = $this->request('GET', '/api/games/nope/next', token: 'token1');

        self::assertResponseStatusCodeSame(404);
        self::assertSame(['error' => 'unknown_game'], $body);
    }

    public function testAnUnknownRouteIsAJsonError(): void
    {
        $body = $this->request('GET', '/api/nope');

        self::assertResponseStatusCodeSame(404);
        self::assertSame(['error' => 'not_found'], $body);
    }
}
