<?php

namespace App\Tests\Player;

use App\Player\NicknamePolicy;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class NicknamePolicyTest extends TestCase
{
    #[DataProvider('nicknames')]
    public function testFormat(string $pseudo, bool $valid): void
    {
        self::assertSame($valid, (new NicknamePolicy())->isValidFormat($pseudo));
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
}
