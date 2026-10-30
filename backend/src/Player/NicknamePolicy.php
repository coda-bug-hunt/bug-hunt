<?php

namespace App\Player;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Nickname rules (spec 2.5): the format, and no banned word, even disguised.
 * Uniqueness needs the players: GameController checks it.
 */
final class NicknamePolicy
{
    // Same pattern as frontend/src/api/pseudo.ts.
    private const PATTERN = '/^[A-Za-z0-9_-]{3,16}\z/';

    // Digits and symbols used to disguise a letter.
    private const DISGUISES = ['0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '@' => 'a', '5' => 's', '$' => 's'];

    /** @var array{anywhere: list<string>, whole: list<string>}|null */
    private ?array $banned = null;

    public function __construct(
        #[Autowire('%kernel.project_dir%/config/banned_words.txt')]
        private readonly string $bannedWordsFile,
    ) {
    }

    public function isValidFormat(string $pseudo): bool
    {
        return 1 === preg_match(self::PATTERN, $pseudo);
    }

    // False when the nickname holds a banned word (see config/banned_words.txt).
    public function isAllowed(string $pseudo): bool
    {
        $lower = strtolower($pseudo);
        $plain = str_replace(['-', '_'], '', strtr($lower, self::DISGUISES));
        // The parts a short word must fill on its own: between - and _ once
        // undisguised ("le-c0n"), or between anything but letters ("cul42").
        $parts = [
            $plain,
            ...array_map(static fn (string $part): string => strtr($part, self::DISGUISES), preg_split('/[-_]+/', $lower) ?: []),
            ...(preg_split('/[^a-z]+/', $lower) ?: []),
        ];

        $banned = $this->banned();
        foreach ($banned['anywhere'] as $word) {
            if (str_contains($plain, $word)) {
                return false;
            }
        }

        return [] === array_intersect($parts, $banned['whole']);
    }

    /**
     * @return array{anywhere: list<string>, whole: list<string>}
     */
    private function banned(): array
    {
        if (null === $this->banned) {
            $lines = file($this->bannedWordsFile, \FILE_IGNORE_NEW_LINES | \FILE_SKIP_EMPTY_LINES)
                ?: throw new \RuntimeException(\sprintf('Cannot read %s.', $this->bannedWordsFile));
            $this->banned = ['anywhere' => [], 'whole' => []];
            foreach ($lines as $line) {
                $word = trim($line);
                if ('' === $word || str_starts_with($word, '#')) {
                    continue;
                }
                if (str_starts_with($word, '=')) {
                    $this->banned['whole'][] = substr($word, 1);
                } else {
                    $this->banned['anywhere'][] = $word;
                }
            }
        }

        return $this->banned;
    }
}
