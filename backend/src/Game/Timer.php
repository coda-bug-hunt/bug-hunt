<?php

namespace App\Game;

/**
 * The time of a bug, held by the server: the client only displays it.
 * Times are in milliseconds.
 */
final class Timer
{
    public const TIME_LIMIT = 60;

    // Whole seconds left, rounded up, never below 0.
    public static function remainingSeconds(int $sentAt, int $now): int
    {
        $elapsed = ($now - $sentAt) / 1000;

        return max(0, (int) ceil(self::TIME_LIMIT - $elapsed));
    }
}
