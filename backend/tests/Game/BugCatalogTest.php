<?php

namespace App\Tests\Game;

use App\Game\Bug;
use App\Game\BugCatalog;
use App\Game\InvalidBugException;
use PHPUnit\Framework\TestCase;

final class BugCatalogTest extends TestCase
{
    private const BACKEND_DIR = __DIR__.'/../..';

    private string $tempDir = '';

    protected function tearDown(): void
    {
        if ('' !== $this->tempDir) {
            array_map('unlink', glob($this->tempDir.'/*') ?: []);
            rmdir($this->tempDir);
        }
    }

    public function testReadsEveryFileUnderTheFolder(): void
    {
        $catalog = new BugCatalog('tests/fixtures/bugs', self::BACKEND_DIR);

        self::assertSame(['dev-001', 'dev-002', 'dev-003', 'dev-004', 'dev-005', 'net-001'], array_keys($catalog->all()));
        self::assertSame('Le total est faux', $catalog->get('dev-001')?->title);
        self::assertNull($catalog->get('dev-999'));
    }

    public function testFindsTheBugsOfATrackAndLevel(): void
    {
        $catalog = new BugCatalog('tests/fixtures/bugs', self::BACKEND_DIR);

        self::assertSame(['net-001'], $this->ids($catalog->byTrackAndLevel('network', 1)));
        self::assertSame([], $catalog->byTrackAndLevel('network', 0));
    }

    public function testAcceptsAnAbsoluteFolder(): void
    {
        $catalog = new BugCatalog(realpath(self::BACKEND_DIR.'/tests/fixtures/bugs') ?: '', '/nowhere');

        self::assertCount(6, $catalog->all());
    }

    // The real pool, as the game uses it: 5 bugs per level per track.
    public function testTheRealPoolIsComplete(): void
    {
        $catalog = new BugCatalog('../data/bugs', self::BACKEND_DIR);

        foreach (Bug::TRACKS as $track) {
            foreach (Bug::LEVELS as $level) {
                self::assertCount(5, $catalog->byTrackAndLevel($track, $level), "$track level $level");
            }
        }
    }

    public function testFailsOnAMissingFolder(): void
    {
        $this->expectExceptionMessage('is not a folder');

        (new BugCatalog('tests/fixtures/nope', self::BACKEND_DIR))->all();
    }

    public function testFailsOnInvalidJsonAndNamesTheFile(): void
    {
        $this->writeBug('dev-001', '{ "id": ');

        $this->expectException(InvalidBugException::class);
        $this->expectExceptionMessage('dev-001.json');

        (new BugCatalog($this->tempDir, '/'))->all();
    }

    public function testFailsWhenTheFileIsNotNamedAfterTheId(): void
    {
        $this->writeBug('dev-002', (string) file_get_contents(self::BACKEND_DIR.'/tests/fixtures/bugs/dev/dev-001.json'));

        $this->expectExceptionMessage('must be named after its id');

        (new BugCatalog($this->tempDir, '/'))->all();
    }

    private function writeBug(string $name, string $json): void
    {
        $this->tempDir = sys_get_temp_dir().'/bugs-'.bin2hex(random_bytes(4));
        mkdir($this->tempDir);
        file_put_contents($this->tempDir.'/'.$name.'.json', $json);
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
