<?php

namespace App\Game;

/**
 * Points of one bug (spec 2.3). Only the server computes them: the client sends
 * what the player tapped, never points. No negative points, ever.
 */
final class Scoring
{
    // 100 at level 0 to 500 at level 4.
    public static function basePoints(int $level): int
    {
        return 100 * ($level + 1);
    }

    public static function points(int $level, bool $lineCorrect, bool $choiceCorrect, bool $timedOut): int
    {
        if ($timedOut || !$choiceCorrect) {
            return 0;
        }

        // Wrong line, then right fix: half the points.
        return $lineCorrect ? self::basePoints($level) : intdiv(self::basePoints($level), 2);
    }
}
