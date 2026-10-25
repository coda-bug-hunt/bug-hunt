<?php

namespace App\Game;

use Random\Randomizer;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Picks the 10 bugs of a new game (spec 2.3): for each level from 0 to 4,
 * one dev bug then one network bug, at random among that track and level.
 *
 * Dev-only fallback, when GAME_TRACKS=dev or a level has no network bug yet:
 * two different dev bugs per level. The affinity of such a game is null.
 */
final class BugDraw
{
    private const TRACK_SETTINGS = ['dev,network' => ['dev', 'network'], 'dev' => ['dev']];

    public function __construct(
        private readonly BugCatalog $catalog,
        private readonly Randomizer $randomizer,
        #[Autowire('%env(GAME_TRACKS)%')]
        private readonly string $gameTracks,
    ) {
    }

    /**
     * @return list<Bug> In game order.
     */
    public function draw(): array
    {
        $devOnly = $this->isDevOnly();
        $bugs = [];
        foreach (Bug::LEVELS as $level) {
            $dev = $this->pick('dev', $level, $devOnly ? 2 : 1);
            array_push($bugs, ...($devOnly ? $dev : [$dev[0], $this->pick('network', $level, 1)[0]]));
        }

        return $bugs;
    }

    public function isDevOnly(): bool
    {
        $tracks = self::TRACK_SETTINGS[$this->gameTracks] ?? throw new \RuntimeException(\sprintf(
            'GAME_TRACKS must be "%s", got "%s".',
            implode('" or "', array_keys(self::TRACK_SETTINGS)),
            $this->gameTracks,
        ));
        if (!\in_array('network', $tracks, true)) {
            return true;
        }

        foreach (Bug::LEVELS as $level) {
            if ([] === $this->catalog->byTrackAndLevel('network', $level)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<Bug> $count different bugs of the track and level.
     */
    private function pick(string $track, int $level, int $count): array
    {
        $pool = $this->catalog->byTrackAndLevel($track, $level);
        if ([] === $pool) {
            throw new \RuntimeException(\sprintf('No %s bug for level %d in BUGS_DIR.', $track, $level));
        }
        if (\count($pool) < $count) {
            throw new \RuntimeException(\sprintf('Dev-only mode needs %d %s bugs for level %d in BUGS_DIR, found %d.', $count, $track, $level, \count($pool)));
        }

        return \array_slice($this->randomizer->shuffleArray($pool), 0, $count);
    }
}
