<?php

namespace App\Tests;

use App\Entity\Game;
use App\Repository\GameRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Clock\MockClock;
use Symfony\Component\Clock\Test\ClockSensitiveTrait;

/**
 * Calls the API on the test database (emptied before each test), with a mock
 * clock: $this->clock->sleep(25) moves time forward without waiting.
 */
abstract class ApiTestCase extends WebTestCase
{
    use ClockSensitiveTrait;

    protected KernelBrowser $client;
    protected MockClock $clock;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $clock = static::mockTime('2026-11-07 10:00:00');
        \assert($clock instanceof MockClock);
        $this->clock = $clock;

        $connection = self::getContainer()->get(EntityManagerInterface::class)->getConnection();
        $connection->executeStatement('DELETE FROM game');
        $connection->executeStatement('DELETE FROM player');
    }

    /**
     * @param array<string, mixed>|null $json
     *
     * @return array<string, mixed>
     */
    protected function request(string $method, string $uri, ?array $json = null, ?string $token = null): array
    {
        $server = ['CONTENT_TYPE' => 'application/json'];
        if (null !== $token) {
            $server['HTTP_AUTHORIZATION'] = "Bearer $token";
        }
        $this->client->request($method, $uri, server: $server, content: null === $json ? null : json_encode($json, \JSON_THROW_ON_ERROR));

        return $this->json();
    }

    /**
     * @return array<string, mixed>
     */
    protected function json(): array
    {
        $content = (string) $this->client->getResponse()->getContent();
        self::assertJson($content);

        /** @var array<string, mixed> */
        return json_decode($content, true, flags: \JSON_THROW_ON_ERROR);
    }

    protected function saveGame(Game $game): void
    {
        self::getContainer()->get(GameRepository::class)->save($game);
    }
}
