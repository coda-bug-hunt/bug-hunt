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

    #[DataProvider('percents')]
    public function testPercentOfATrack(int $points, int $expected): void
    {
        self::assertSame($expected, Affinity::percent($points));
    }

    /**
     * @return iterable<string, array{int, int}>
     */
    public static function percents(): iterable
    {
        yield 'nothing' => [0, 0];
        yield 'exact' => [900, 60];
        yield 'rounded down' => [1250, 83];
        yield 'rounded up' => [8, 1];
        yield 'everything' => [1500, 100];
    }
}
