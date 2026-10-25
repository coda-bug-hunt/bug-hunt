<?php

namespace App\Tests\Game;

use App\Game\Bug;
use App\Game\BugCatalog;
use App\Game\BugDraw;
use PHPUnit\Framework\TestCase;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * The draw runs on fake catalogs written to a temporary folder, so each test
 * says exactly how many bugs each track and level has.
 */
final class BugDrawTest extends TestCase
{
    private const LEVEL_ORDER = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];

    private ?string $tempDir = null;

    protected function tearDown(): void
    {
        if (null !== $this->tempDir) {
            array_map('unlink', glob($this->tempDir.'/*.json') ?: []);
            rmdir($this->tempDir);
        }
    }

    public function testOneDevThenOneNetworkBugPerLevel(): void
    {
        $bugs = $this->draw($this->catalog(dev: 3, network: 3));

        self::assertSame(self::LEVEL_ORDER, $this->levels($bugs));
        self::assertSame(array_merge(...array_fill(0, 5, ['dev', 'network'])), $this->tracks($bugs));
        self::assertFalse($this->drawer($this->catalog(dev: 3, network: 3))->isDevOnly());
    }

    public function testTwoDrawsDiffer(): void
    {
        $catalog = $this->catalog(dev: 5, network: 5);

        self::assertNotSame($this->ids($this->draw($catalog, seed: 1)), $this->ids($this->draw($catalog, seed: 2)));
    }

    public function testDevOnlyWhenGameTracksIsDev(): void
    {
        $catalog = $this->catalog(dev: 2, network: 2);

        $bugs = $this->draw($catalog, tracks: 'dev');

        self::assertSame(self::LEVEL_ORDER, $this->levels($bugs));
        self::assertSame(array_fill(0, 10, 'dev'), $this->tracks($bugs));
        self::assertCount(10, array_unique($this->ids($bugs)), 'two different bugs per level');
        self::assertTrue($this->drawer($catalog, 'dev')->isDevOnly());
    }

    public function testDevOnlyWhenALevelHasNoNetworkBug(): void
    {
        $bugs = $this->draw($this->catalog(dev: 2, network: 2, emptyNetworkLevel: 3));

        self::assertSame(self::LEVEL_ORDER, $this->levels($bugs));
        self::assertSame(array_fill(0, 10, 'dev'), $this->tracks($bugs));
    }

    public function testFailsWhenALevelHasNoDevBug(): void
    {
        $this->expectExceptionMessage('No dev bug for level 2');

        $this->draw($this->catalog(dev: 2, network: 2, emptyDevLevel: 2));
    }

    public function testDevOnlyNeedsTwoDevBugsPerLevel(): void
    {
        $this->expectExceptionMessage('Dev-only mode needs 2 dev bugs for level 0');

        $this->draw($this->catalog(dev: 1, network: 0));
    }

    public function testRejectsAnUnknownGameTracks(): void
    {
        $this->expectExceptionMessage('GAME_TRACKS');

        $this->draw($this->catalog(dev: 2, network: 2), tracks: 'dev,sr');
    }

    public function testTheRealPoolPlaysBothTracks(): void
    {
        $catalog = new BugCatalog('../data/bugs', __DIR__.'/../..');

        $bugs = $this->draw($catalog);

        self::assertCount(10, $bugs);
        self::assertSame('network', $bugs[1]->track);
    }

    /**
     * @return list<Bug>
     */
    private function draw(BugCatalog $catalog, string $tracks = 'dev,network', int $seed = 42): array
    {
        return $this->drawer($catalog, $tracks, $seed)->draw();
    }

    private function drawer(BugCatalog $catalog, string $tracks = 'dev,network', int $seed = 42): BugDraw
    {
        return new BugDraw($catalog, new Randomizer(new Mt19937($seed)), $tracks);
    }

    // $dev and $network bugs for each level, except the empty level given.
    private function catalog(int $dev, int $network, ?int $emptyDevLevel = null, ?int $emptyNetworkLevel = null): BugCatalog
    {
        $this->tempDir = sys_get_temp_dir().'/draw-'.bin2hex(random_bytes(4));
        mkdir($this->tempDir);
        foreach (Bug::LEVELS as $level) {
            for ($i = 0; $i < ($level === $emptyDevLevel ? 0 : $dev); ++$i) {
                $this->writeBug("dev-$level-$i", ['track' => 'dev', 'difficulty' => $level, 'code' => ['x = 1'], 'bugLine' => 0]);
            }
            for ($i = 0; $i < ($level === $emptyNetworkLevel ? 0 : $network); ++$i) {
                $this->writeBug("net-$level-$i", [
                    'track' => 'network',
                    'difficulty' => $level,
                    'diagram' => ['devices' => [['id' => 'pc', 'label' => 'PC']], 'links' => []],
                    'bugTarget' => 'pc',
                ]);
            }
        }

        return new BugCatalog($this->tempDir, '/');
    }

    /**
     * @param array<string, mixed> $fields
     */
    private function writeBug(string $id, array $fields): void
    {
        $bug = [
            'id' => $id,
            'points' => 100 * ($fields['difficulty'] + 1),
            'title' => 'Bug',
            'choices' => ['a', 'b', 'c'],
            'answer' => 0,
            'explanation' => 'Parce que.',
            ...$fields,
        ];
        file_put_contents("$this->tempDir/$id.json", json_encode($bug, \JSON_THROW_ON_ERROR));
    }

    /**
     * @param list<Bug> $bugs
     *
     * @return list<int>
     */
    private function levels(array $bugs): array
    {
        return array_map(static fn (Bug $bug): int => $bug->difficulty, $bugs);
    }

    /**
     * @param list<Bug> $bugs
     *
     * @return list<string>
     */
    private function tracks(array $bugs): array
    {
        return array_map(static fn (Bug $bug): string => $bug->track, $bugs);
    }

    /**
     * @param list<Bug> $bugs
     *
     * @return list<string>
     */
    private function ids(array $bugs): array
    {
        return array_map(static fn (Bug $bug): string => $bug->id, $bugs);
    }
}
