<?php

namespace App\Game;

use Random\Randomizer;

/**
 * Picks the bugs of a new game. Prototype rule: one dev bug per level, 0 to 4.
 * The full rule (one dev then one network bug per level) comes with #27.
 */
final class BugDraw
{
    public function __construct(
        private readonly BugCatalog $catalog,
        private readonly Randomizer $randomizer,
    ) {
    }

    /**
     * @return list<Bug> In game order.
     */
    public function draw(): array
    {
        return array_map(fn (int $level): Bug => $this->pick('dev', $level), Bug::LEVELS);
    }

    private function pick(string $track, int $level): Bug
    {
        $pool = $this->catalog->byTrackAndLevel($track, $level);
        if ([] === $pool) {
            throw new \RuntimeException(\sprintf('No %s bug for level %d in BUGS_DIR.', $track, $level));
        }

        return $pool[$this->randomizer->getInt(0, \count($pool) - 1)];
    }
}
