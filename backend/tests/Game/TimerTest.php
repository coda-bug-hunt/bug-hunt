<?php

namespace App\Tests\Game;

use App\Game\Timer;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class TimerTest extends TestCase
{
    #[DataProvider('elapsedTimes')]
    public function testRemainingSeconds(int $elapsedMs, int $expected): void
    {
        self::assertSame($expected, Timer::remainingSeconds(10_000, 10_000 + $elapsedMs));
    }

    /**
     * @return iterable<string, array{int, int}>
     */
    public static function elapsedTimes(): iterable
    {
        yield 'just sent' => [0, 60];
        yield 'rounded up' => [500, 60];
        yield 'one second' => [1_000, 59];
        yield 'last second' => [59_500, 1];
        yield 'time is up' => [60_000, 0];
        yield 'never negative' => [90_000, 0];
    }

    public function testTheTimeIsOverAfterTheLimit(): void
    {
        self::assertFalse(Timer::isOver(10_000, 10_000 + 30_000));
        self::assertFalse(Timer::isOver(10_000, 10_000 + 60_000));
        self::assertTrue(Timer::isOver(10_000, 10_000 + 60_001));
    }
}
