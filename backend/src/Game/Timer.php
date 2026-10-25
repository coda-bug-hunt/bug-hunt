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

    // An answer after the limit scores 0. The 2-second grace for network delay comes with #28.
    public static function isOver(int $sentAt, int $now): bool
    {
        return $now - $sentAt > self::TIME_LIMIT * 1000;
    }
}
