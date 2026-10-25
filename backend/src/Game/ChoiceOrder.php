<?php

namespace App\Game;

use Random\Randomizer;

/**
 * The order in which a game shows the 3 choices of each bug, drawn once when
 * the game is created. In every bug file the right fix may sit at the same
 * index: shuffled per game, tapping "always the first one" stops working.
 *
 * An order lists the file index of each choice on screen: [2, 0, 1] shows
 * choice 2 of the file first.
 */
final class ChoiceOrder
{
    public const FILE_ORDER = [0, 1, 2];

    public function __construct(private readonly Randomizer $randomizer)
    {
    }

    /**
     * @param list<Bug> $bugs
     *
     * @return array<string, list<int>> By bug id.
     */
    public function draw(array $bugs): array
    {
        $orders = [];
        foreach ($bugs as $bug) {
            $orders[$bug->id] = $this->randomizer->shuffleArray(self::FILE_ORDER);
        }

        return $orders;
    }

    /**
     * @param list<int> $order
     */
    public static function choiceAt(array $order, int $position): int
    {
        return $order[$position];
    }

    /**
     * @param list<int> $order
     */
    public static function positionOf(array $order, int $choice): int
    {
        return (int) array_search($choice, $order, true);
    }
}
