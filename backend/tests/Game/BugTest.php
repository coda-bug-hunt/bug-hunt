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

    public function testTheSummaryNamesTheViewEvenWhenTheFileHasNone(): void
    {
        self::assertSame(
            ['id' => 'dev-001', 'track' => 'dev', 'difficulty' => 0, 'title' => 'Le total est faux', 'view' => 'code'],
            Bug::fromArray(self::devBug())->toSummary(),
        );
        self::assertSame('diagram', Bug::fromArray(self::networkBug())->toSummary()['view']);
        self::assertSame('terminal', Bug::fromArray(self::terminalBug())->toSummary()['view']);
    }

    // Admin only: the test tool plays the bug in the page, so it needs the answer.
    public function testTheFullViewCarriesTheAnswer(): void
    {
        $dev = Bug::fromArray(self::devBug())->toFull();
        self::assertSame(['bugLine' => 0, 'answer' => 0, 'explanation' => 'Il faut additionner.'], array_intersect_key($dev, array_flip(['bugLine', 'answer', 'explanation'])));
        self::assertSame(self::devBug()['choices'], $dev['choices']);
        self::assertArrayNotHasKey('bugTarget', $dev);

        $network = Bug::fromArray(self::networkBug())->toFull();
        self::assertSame('printer', $network['bugTarget']);
        self::assertSame(1, $network['answer']);
        self::assertArrayNotHasKey('bugLine', $network);
    }

    public function testANetworkBugCanBeDrawnAsLines(): void
    {
        $bug = Bug::fromArray(self::terminalBug());
        $public = $bug->toPublic();

        self::assertTrue($bug->isDrawnAsLines());
        self::assertSame(
            ['id', 'track', 'difficulty', 'points', 'title', 'choices', 'view', 'code', 'context'],
            array_keys($public),
        );
        self::assertSame('network', $public['track']);
        self::assertSame('terminal', $public['view']);
        self::assertSame(1, $bug->bugLine);
    }

    public function testTheShapeFollowsTheViewNotTheTrack(): void
    {
        self::assertTrue(Bug::fromArray(self::devBug())->isDrawnAsLines(), 'dev without a view: code');
        self::assertFalse(Bug::fromArray(self::networkBug())->isDrawnAsLines(), 'network without a view: diagram');
        self::assertFalse(Bug::fromArray([...self::networkBug(), 'view' => 'diagram'])->isDrawnAsLines());
    }

    public function testTheLinesCarryTheirLanguage(): void
    {
        $public = Bug::fromArray([...self::devBug(), 'language' => 'SQL'])->toPublic();

        self::assertSame('SQL', $public['language']);
        self::assertArrayNotHasKey('view', $public, 'no view in the file, none sent');
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

    public function testThePublicChoicesFollowTheOrderOfTheGame(): void
    {
        $choices = self::devBug()['choices'];

        $public = Bug::fromArray(self::devBug())->toPublic([2, 0, 1]);

        self::assertSame([$choices[2], $choices[0], $choices[1]], $public['choices']);
        self::assertSame($choices, Bug::fromArray(self::devBug())->toPublic()['choices'], 'file order by default');
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
        yield 'unknown view' => [[...$dev, 'view' => 'video'], 'view must be'];
        yield 'terminal without lines' => [[...$network, 'view' => 'terminal'], 'code must be'];
        yield 'dev diagram without a diagram' => [[...$dev, 'view' => 'diagram'], 'diagram must hold'];
        yield 'empty language' => [[...$dev, 'language' => ''], 'language must be'];
        yield 'empty context' => [[...self::terminalBug(), 'context' => ''], 'context must be'];
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
    private static function terminalBug(): array
    {
        return [
            'id' => 'net-006',
            'track' => 'network',
            'difficulty' => 0,
            'points' => 100,
            'view' => 'terminal',
            'title' => 'Les sites ne répondent plus',
            'context' => 'Le PC joint 8.8.8.8, mais aucun site.',
            'code' => ['$ ping exemple.fr', 'ping: exemple.fr : nom inconnu'],
            'bugLine' => 1,
            'choices' => ['Corriger le DNS', 'Changer le câble', 'Redémarrer'],
            'answer' => 0,
            'explanation' => 'C\'est le DNS.',
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
