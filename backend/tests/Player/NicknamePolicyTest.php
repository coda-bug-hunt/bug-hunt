<?php

namespace App\Tests\Player;

use App\Player\NicknamePolicy;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Runs against the real list in config/banned_words.txt.
 */
final class NicknamePolicyTest extends TestCase
{
    private static function policy(): NicknamePolicy
    {
        return new NicknamePolicy(\dirname(__DIR__, 2).'/config/banned_words.txt');
    }

    #[DataProvider('nicknames')]
    public function testFormat(string $pseudo, bool $valid): void
    {
        self::assertSame($valid, self::policy()->isValidFormat($pseudo));
    }

    /**
     * @return iterable<string, array{string, bool}>
     */
    public static function nicknames(): iterable
    {
        yield 'letters and digits' => ['Neo42', true];
        yield 'dash and underscore' => ['pixel-kid_2', true];
        yield '3 characters' => ['Bob', true];
        yield '16 characters' => ['abcdefghijklmnop', true];
        yield '2 characters' => ['Bo', false];
        yield '17 characters' => ['abcdefghijklmnopq', false];
        yield 'space' => ['Neo 42', false];
        yield 'accent' => ['Zoé', false];
        yield 'empty' => ['', false];
        yield 'trailing newline' => ["Neo42\n", false];
    }

    #[DataProvider('bannedNicknames')]
    public function testBannedWords(string $pseudo): void
    {
        self::assertFalse(self::policy()->isAllowed($pseudo));
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function bannedNicknames(): iterable
    {
        yield 'banned word' => ['connard'];
        yield 'any case' => ['CoNNaRD'];
        yield 'inside the nickname' => ['xXconnardXx'];
        yield 'English' => ['fuckyou'];
        yield 'disguised with digits' => ['c0nn4rd'];
        yield 'disguised with 1, 3 and 5' => ['5h1t3'];
        yield 'split with dashes' => ['con-nard'];
        yield 'split with underscores' => ['f_u_c_k'];
        yield 'short word alone' => ['con'];
        yield 'short word, disguised' => ['C0N'];
        yield 'short word between dashes' => ['le-con'];
        yield 'short word before digits' => ['cul42'];
        yield 'short word after digits' => ['69pd'];
    }

    // Short banned sequences hide in ordinary words: these must stay allowed.
    #[DataProvider('innocentNicknames')]
    public function testInnocentNicknames(string $pseudo): void
    {
        self::assertTrue(self::policy()->isAllowed($pseudo));
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function innocentNicknames(): iterable
    {
        foreach ([
            'Neo42', 'pixel-kid_2', 'Conan', 'Second', 'Connect4', 'Hercule', 'Calcul', 'Computer',
            'Scunthorpe', 'Dickens', 'Cockpit', 'Peacock', 'Classe', 'Bassiste', 'Assassin', 'Anass',
            'Grape', 'Therapist', 'Montenegro', 'Fichier', 'Technique', 'Unique', 'Speeder', 'Violette',
            'Sussex', 'Habite', 'Nazim', 'Mongolia', 'Booboo', 'Sh4dow', 'Bastien', 'Pascal', 'EnRetard', 'Fagundes',
        ] as $pseudo) {
            yield $pseudo => [$pseudo];
        }
    }
}
