<?php

namespace App\Game;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Every bug of the pool, read from the JSON files under BUGS_DIR (subfolders
 * included). Bugs are never copied into backend/ or the database. A broken file
 * fails loudly: better than a broken game in front of a visitor.
 */
final class BugCatalog
{
    /** @var array<string, Bug>|null */
    private ?array $bugs = null;

    public function __construct(
        #[Autowire('%env(BUGS_DIR)%')]
        private readonly string $bugsDir,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    public function get(string $id): ?Bug
    {
        return $this->bugs()[$id] ?? null;
    }

    /**
     * @return list<Bug> The bugs of a track and level, sorted by id.
     */
    public function byTrackAndLevel(string $track, int $level): array
    {
        return array_values(array_filter(
            $this->bugs(),
            static fn (Bug $bug): bool => $bug->track === $track && $bug->difficulty === $level,
        ));
    }

    /**
     * @return array<string, Bug> Every bug, by id, sorted by id.
     */
    public function all(): array
    {
        return $this->bugs();
    }

    /**
     * @return array<string, Bug>
     */
    private function bugs(): array
    {
        return $this->bugs ??= $this->load();
    }

    /**
     * @return array<string, Bug>
     */
    private function load(): array
    {
        // Relative paths start from backend/: ../data/bugs works in the container and in CI.
        $dir = str_starts_with($this->bugsDir, '/') ? $this->bugsDir : $this->projectDir.'/'.$this->bugsDir;
        if (!is_dir($dir)) {
            throw new \RuntimeException(\sprintf('BUGS_DIR "%s" is not a folder.', $dir));
        }

        $bugs = [];
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS));
        /** @var \SplFileInfo $file */
        foreach ($files as $file) {
            if ('json' !== $file->getExtension()) {
                continue;
            }
            $path = $file->getPathname();

            try {
                $bug = Bug::fromArray(json_decode((string) file_get_contents($path), true, flags: \JSON_THROW_ON_ERROR));
            } catch (\JsonException|InvalidBugException $e) {
                throw new InvalidBugException(\sprintf('%s: %s', $path, $e->getMessage()), previous: $e);
            }
            if ($file->getBasename('.json') !== $bug->id) {
                throw new InvalidBugException(\sprintf('%s: the file must be named after its id "%s"', $path, $bug->id));
            }
            if (isset($bugs[$bug->id])) {
                throw new InvalidBugException(\sprintf('%s: id "%s" is already used', $path, $bug->id));
            }
            $bugs[$bug->id] = $bug;
        }

        ksort($bugs);

        return $bugs;
    }
}
