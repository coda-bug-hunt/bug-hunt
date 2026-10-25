<?php

namespace App\Tests\Game;

use App\Game\Scoring;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class ScoringTest extends TestCase
{
    #[DataProvider('situations')]
    public function testPoints(int $level, bool $lineCorrect, bool $choiceCorrect, bool $timedOut, int $expected): void
    {
        self::assertSame($expected, Scoring::points($level, $lineCorrect, $choiceCorrect, $timedOut));
    }

    /**
     * One line per row of the table in #19, at levels 0 and 4.
     *
     * @return iterable<string, array{int, bool, bool, bool, int}>
     */
    public static function situations(): iterable
    {
        yield 'level 0, right line and right fix' => [0, true, true, false, 100];
        yield 'level 4, right line and right fix' => [4, true, true, false, 500];
        yield 'level 0, wrong line then right fix' => [0, false, true, false, 50];
        yield 'level 4, wrong line then right fix' => [4, false, true, false, 250];
        yield 'level 0, wrong fix' => [0, true, false, false, 0];
        yield 'level 4, wrong line and wrong fix' => [4, false, false, false, 0];
        yield 'level 0, right answer after the time limit' => [0, true, true, true, 0];
        yield 'level 4, right answer after the time limit' => [4, true, true, true, 0];
    }

    public function testBasePointsGrowWithTheLevel(): void
    {
        self::assertSame([100, 200, 300, 400, 500], array_map(Scoring::basePoints(...), [0, 1, 2, 3, 4]));
    }
}
