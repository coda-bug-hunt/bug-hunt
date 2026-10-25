<?php

namespace App\Tests\Controller;

use App\Entity\Game;
use App\Entity\Player;
use App\Repository\PlayerRepository;
use App\Tests\ApiTestCase;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Admin view. The PIN of the test environment is "test-pin" (.env.test).
 */
final class AdminControllerTest extends ApiTestCase
{
    private PlayerRepository $players;

    protected function setUp(): void
    {
        parent::setUp();
        $this->players = self::getContainer()->get(PlayerRepository::class);
    }

    public function testTheLatestPlayers(): void
    {
        // 2026-11-07 10:00:00.250 and 10:05:00 UTC, in milliseconds.
        $this->players->save(new Player('Older', 'device1', 1_794_045_600_250));
        $this->finish('Neo42', 900, 1250, 'network');
        $this->players->setHidden('Neo42', true);
        $this->players->find('neo42')?->setLastPlayedAt(1_794_045_900_000);
        self::getContainer()->get(EntityManagerInterface::class)->flush();

        $body = $this->admin('GET', '/api/admin/players');

        self::assertResponseIsSuccessful();
        self::assertSame(['players' => [
            ['pseudo' => 'Neo42', 'bestScore' => 2150, 'affinity' => 'network', 'hidden' => true, 'lastPlayedAt' => '2026-11-07T10:05:00.000Z'],
            ['pseudo' => 'Older', 'bestScore' => 0, 'affinity' => null, 'hidden' => false, 'lastPlayedAt' => '2026-11-07T10:00:00.250Z'],
        ]], $body);
    }

    public function testTheListStopsAtFifty(): void
    {
        for ($i = 0; $i < 52; ++$i) {
            $this->players->save(new Player("Player$i", 'device1', 1_000 + $i));
        }

        $body = $this->admin('GET', '/api/admin/players');

        self::assertCount(50, $body['players']);
        self::assertSame('Player51', $body['players'][0]['pseudo']);
    }

    public function testHideThenShowAPlayer(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));

        $this->admin('PATCH', '/api/admin/players/NEO42', ['hidden' => true]);
        self::assertResponseStatusCodeSame(204);
        $this->reload();
        self::assertTrue($this->players->findByPseudo('Neo42')?->isHidden());

        $this->admin('PATCH', '/api/admin/players/neo42', ['hidden' => false]);
        self::assertResponseStatusCodeSame(204);
        $this->reload();
        self::assertFalse($this->players->findByPseudo('Neo42')?->isHidden());
    }

    // Done when of #31: out of the top at the next refresh, still in the gauges.
    public function testAHiddenPlayerLeavesTheTopButStillCountsInTheGauges(): void
    {
        $this->finish('Neo42', 900, 1250, 'network');
        $this->finish('Pixel', 1300, 1050, 'dev');

        $this->admin('PATCH', '/api/admin/players/Neo42', ['hidden' => true]);
        $board = $this->request('GET', '/api/leaderboard');

        self::assertSame(['Pixel'], array_column($board['top'], 'pseudo'));
        self::assertSame(['dev' => 1, 'network' => 1], $board['gauges']);
        self::assertSame(2, $board['gamesPlayed']);
    }

    public function testAnUnknownPlayer(): void
    {
        $body = $this->admin('PATCH', '/api/admin/players/Ghost', ['hidden' => true]);

        self::assertResponseStatusCodeSame(404);
        self::assertSame(['error' => 'unknown_player'], $body);
    }

    public function testHiddenMustBeABoolean(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));

        foreach ([['hidden' => 'true'], ['hidden' => 1], []] as $json) {
            $body = $this->admin('PATCH', '/api/admin/players/Neo42', $json);

            self::assertResponseStatusCodeSame(400);
            self::assertSame(['error' => 'bad_request'], $body);
        }
    }

    public function testAWrongOrMissingPinIsRefused(): void
    {
        $this->players->save(new Player('Neo42', 'device1', 1_000));

        foreach (['wrong', null, ''] as $pin) {
            $list = $this->admin('GET', '/api/admin/players', pin: $pin);
            self::assertResponseStatusCodeSame(401);
            self::assertSame(['error' => 'bad_pin'], $list);

            $patch = $this->admin('PATCH', '/api/admin/players/Neo42', ['hidden' => true], $pin);
            self::assertResponseStatusCodeSame(401);
            self::assertSame(['error' => 'bad_pin'], $patch);
        }
        $this->reload();
        self::assertFalse($this->players->findByPseudo('Neo42')?->isHidden());
    }

    // The PIN is checked first: without it, nobody learns which nicknames exist.
    public function testThePinIsCheckedBeforeThePlayer(): void
    {
        $body = $this->admin('PATCH', '/api/admin/players/Ghost', ['hidden' => true], 'wrong');

        self::assertResponseStatusCodeSame(401);
        self::assertSame(['error' => 'bad_pin'], $body);
    }

    /**
     * @param array<string, mixed>|null $json
     *
     * @return array<string, mixed>
     */
    private function admin(string $method, string $uri, ?array $json = null, ?string $pin = 'test-pin'): array
    {
        $server = ['CONTENT_TYPE' => 'application/json'];
        if (null !== $pin) {
            $server['HTTP_X_ADMIN_PIN'] = $pin;
        }
        $this->client->request($method, $uri, server: $server, content: null === $json ? null : json_encode($json, \JSON_THROW_ON_ERROR));

        return 204 === $this->client->getResponse()->getStatusCode() ? [] : $this->json();
    }

    private function finish(string $pseudo, int $dev, int $network, string $affinity): void
    {
        if (null === $this->players->findByPseudo($pseudo)) {
            $this->players->save(new Player($pseudo, 'device1', 0));
        }
        $game = (new Game(bin2hex(random_bytes(16)), 'token', $pseudo, 'device1', [], 0))
            ->setDevPoints($dev)
            ->setNetworkPoints($network)
            ->finish($affinity, 1_000);
        $this->saveGame($game);
        $this->players->recordFinishedGame($game);
        $this->reload();
    }

    // The best scores are written by a DQL UPDATE: drop the stale players in memory.
    private function reload(): void
    {
        self::getContainer()->get(EntityManagerInterface::class)->clear();
    }
}
