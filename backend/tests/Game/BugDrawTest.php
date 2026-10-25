<?php

namespace App\Tests\Game;

use App\Game\Bug;
use App\Game\BugCatalog;
use App\Game\BugDraw;
use PHPUnit\Framework\TestCase;
use Random\Engine\Mt19937;
use Random\Randomizer;

final class BugDrawTest extends TestCase
{
    public function testOneDevBugPerLevelInOrder(): void
    {
        $catalog = new BugCatalog('../data/bugs', __DIR__.'/../..');

        $bugs = (new BugDraw($catalog, new Randomizer(new Mt19937(42))))->draw();

        self::assertSame([0, 1, 2, 3, 4], array_map(static fn (Bug $bug): int => $bug->difficulty, $bugs));
        self::assertSame(['dev'], array_values(array_unique(array_map(static fn (Bug $bug): string => $bug->track, $bugs))));
    }

    public function testTwoDrawsDiffer(): void
    {
        $catalog = new BugCatalog('../data/bugs', __DIR__.'/../..');
        $ids = static fn (int $seed): array => array_map(
            static fn (Bug $bug): string => $bug->id,
            (new BugDraw($catalog, new Randomizer(new Mt19937($seed))))->draw(),
        );

        self::assertNotSame($ids(1), $ids(2));
    }

    public function testFailsWhenALevelHasNoBug(): void
    {
        $catalog = new BugCatalog('tests/fixtures/bugs/network', __DIR__.'/../..');

        $this->expectExceptionMessage('No dev bug for level 0');

        (new BugDraw($catalog, new Randomizer()))->draw();
    }
}
