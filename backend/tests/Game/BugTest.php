<?php

namespace App\Tests\Game;

use App\Game\Bug;
use App\Game\InvalidBugException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class BugTest extends TestCase
{
    public function testTheDevPublicViewHidesTheAnswer(): void
    {
        $public = Bug::fromArray(self::devBug())->toPublic();

        self::assertSame(
            ['id', 'track', 'difficulty', 'points', 'title', 'choices', 'code'],
            array_keys($public),
        );
        self::assertSame(['total = price - shipping', 'print(total)'], $public['code']);
    }

    public function testTheNetworkPublicViewHidesTheAnswer(): void
    {
        $public = Bug::fromArray(self::networkBug())->toPublic();

        self::assertSame(
            ['id', 'track', 'difficulty', 'points', 'title', 'choices', 'diagram'],
            array_keys($public),
        );
        self::assertSame(self::networkBug()['diagram'], $public['diagram']);
    }

    public function testThePublicViewCarriesTheHint(): void
    {
        foreach ([self::devBug(), self::networkBug()] as $data) {
            $public = Bug::fromArray([...$data, 'hint' => 'Regarde le signe.'])->toPublic();

            self::assertSame('Regarde le signe.', $public['hint']);
            foreach (['bugLine', 'bugTarget', 'answer', 'explanation'] as $secret) {
                self::assertArrayNotHasKey($secret, $public);
            }
        }
    }

    public function testNoHintWhenTheFileHasNone(): void
    {
        self::assertArrayNotHasKey('hint', Bug::fromArray(self::devBug())->toPublic());
    }

    public function testAnUnknownFieldNeverReachesThePublicView(): void
    {
        $public = Bug::fromArray([...self::devBug(), 'secret' => 'leak'])->toPublic();

        self::assertArrayNotHasKey('secret', $public);
    }

    public function testKeepsTheAnswerOnTheServer(): void
    {
        $dev = Bug::fromArray(self::devBug());
        $network = Bug::fromArray(self::networkBug());

        self::assertSame(0, $dev->bugLine);
        self::assertSame(0, $dev->answer);
        self::assertSame('Il faut additionner.', $dev->explanation);
        self::assertSame('printer', $network->bugTarget);
    }

    /**
     * @param array<string, mixed> $data
     */
    #[DataProvider('brokenBugs')]
    public function testRejectsABrokenBug(array $data, string $message): void
    {
        $this->expectException(InvalidBugException::class);
        $this->expectExceptionMessage($message);

        Bug::fromArray($data);
    }

    /**
     * @return iterable<string, array{array<string, mixed>, string}>
     */
    public static function brokenBugs(): iterable
    {
        $dev = self::devBug();
        $network = self::networkBug();

        yield 'missing id' => [array_diff_key($dev, ['id' => 0]), 'id must be'];
        yield 'unknown track' => [[...$dev, 'track' => 'sr'], 'track must be'];
        yield 'level 5' => [[...$dev, 'difficulty' => 5, 'points' => 600], 'difficulty must be'];
        yield 'wrong points' => [[...$dev, 'points' => 150], 'points must be'];
        yield 'two choices' => [[...$dev, 'choices' => ['a', 'b']], 'choices must hold 3'];
        yield 'answer 3' => [[...$dev, 'answer' => 3], 'answer must be'];
        yield 'answer as a string' => [[...$dev, 'answer' => '0'], 'answer must be an integer'];
        yield 'no explanation' => [array_diff_key($dev, ['explanation' => 0]), 'explanation must be'];
        yield 'no code' => [array_diff_key($dev, ['code' => 0]), 'code must be'];
        yield 'bugLine out of the code' => [[...$dev, 'bugLine' => 2], 'bugLine must be'];
        yield 'no diagram' => [array_diff_key($network, ['diagram' => 0]), 'diagram must hold'];
        yield 'empty hint' => [[...$dev, 'hint' => ''], 'hint must be'];
        yield 'bugTarget not a device' => [[...$network, 'bugTarget' => 'router'], 'bugTarget must be'];
    }

    public function testRejectsSomethingElseThanAnObject(): void
    {
        $this->expectException(InvalidBugException::class);

        Bug::fromArray('dev-001');
    }

    /**
     * @return array<string, mixed>
     */
    private static function devBug(): array
    {
        return [
            'id' => 'dev-001',
            'track' => 'dev',
            'difficulty' => 0,
            'points' => 100,
            'title' => 'Le total est faux',
            'code' => ['total = price - shipping', 'print(total)'],
            'bugLine' => 0,
            'choices' => ['total = price + shipping', 'total = price * shipping', 'total = shipping - price'],
            'answer' => 0,
            'explanation' => 'Il faut additionner.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function networkBug(): array
    {
        return [
            'id' => 'net-001',
            'track' => 'network',
            'difficulty' => 1,
            'points' => 200,
            'title' => "Le PC ne trouve pas l'imprimante",
            'diagram' => [
                'devices' => [
                    ['id' => 'pc', 'label' => 'PC', 'ip' => '192.168.1.10'],
                    ['id' => 'printer', 'label' => 'Imprimante', 'ip' => '192.168.2.20'],
                ],
                'links' => [['pc', 'printer']],
            ],
            'bugTarget' => 'printer',
            'choices' => ['a', 'b', 'c'],
            'answer' => 1,
            'explanation' => 'Même réseau.',
        ];
    }
}
