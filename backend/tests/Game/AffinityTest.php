<?php

namespace App\Tests\Game;

use App\Game\Affinity;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class AffinityTest extends TestCase
{
    #[DataProvider('scores')]
    public function testAffinity(int $dev, int $network, string $expected): void
    {
        self::assertSame($expected, Affinity::of($dev, $network));
    }

    /**
     * 1 percentage point = 15 points (out of 1500 per track).
     *
     * @return iterable<string, array{int, int, string}>
     */
    public static function scores(): iterable
    {
        yield '0-0' => [0, 0, 'both'];
        yield 'tie' => [900, 900, 'both'];
        yield 'gap of 10 for dev' => [900, 750, 'both'];
        yield 'gap of 10 for network' => [750, 900, 'both'];
        yield 'gap of 11 for dev' => [915, 750, 'dev'];
        yield 'gap of 11 for network' => [750, 915, 'network'];
        yield 'just above 10' => [751, 600, 'dev'];
        yield 'dev only' => [1500, 0, 'dev'];
        yield 'network only' => [0, 1500, 'network'];
    }
}
