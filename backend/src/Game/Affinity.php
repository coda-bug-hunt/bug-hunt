<?php

namespace App\Game;

/**
 * Which track a player leans towards (spec 2.3): dev %, network %, and "both"
 * when the gap is 10 percentage points or less.
 */
final class Affinity
{
    // 100 + 200 + 300 + 400 + 500
    public const MAX_PER_TRACK = 1500;
    private const BOTH_GAP_PERCENT = 10;

    public static function of(int $devPoints, int $networkPoints): string
    {
        // Compared in integers, on exact values: no rounding, no float at the boundary.
        $gap = $devPoints - $networkPoints;
        if (abs($gap) * 100 <= self::BOTH_GAP_PERCENT * self::MAX_PER_TRACK) {
            return 'both';
        }

        return $gap > 0 ? 'dev' : 'network';
    }
}
