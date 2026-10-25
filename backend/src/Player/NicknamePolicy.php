<?php

namespace App\Player;

/**
 * Nickname rules (spec 2.5). For now the format only; banned words and
 * uniqueness come with #30.
 */
final class NicknamePolicy
{
    // Same pattern as frontend/src/api/pseudo.ts.
    private const PATTERN = '/^[A-Za-z0-9_-]{3,16}\z/';

    public function isValidFormat(string $pseudo): bool
    {
        return 1 === preg_match(self::PATTERN, $pseudo);
    }
}
