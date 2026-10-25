<?php

namespace App\Tests\Controller;

use App\Controller\HealthController;
use App\Game\BugCatalog;
use App\Game\BugDraw;
use Random\Randomizer;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class HealthControllerTest extends WebTestCase
{
    public function testHealthAnswersOk(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/health');

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Content-Type', 'application/json');
        self::assertJsonStringEqualsJsonString('{"status":"ok"}', (string) $client->getResponse()->getContent());
    }

    // The stand healthcheck calls this route: a pool that cannot make a game
    // keeps the API unhealthy, so the problem shows before a visitor scans.
    public function testHealthFailsWhenTheBugsCannotMakeAGame(): void
    {
        $catalog = new BugCatalog('tests/fixtures/bugs/network', \dirname(__DIR__, 2));

        $this->expectExceptionMessage('No dev bug for level 0');

        (new HealthController(new BugDraw($catalog, new Randomizer(), 'dev,network')))();
    }
}
