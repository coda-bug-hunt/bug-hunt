<?php

namespace App\Tests\Game;

use App\Game\BugCatalog;
use App\Game\ChoiceOrder;
use PHPUnit\Framework\TestCase;
use Random\Engine\Mt19937;
use Random\Randomizer;

final class ChoiceOrderTest extends TestCase
{
    public function testOneOrderPerBugOfTheGame(): void
    {
        $bugs = array_values((new BugCatalog('tests/fixtures/bugs', __DIR__.'/../..'))->all());

        $orders = (new ChoiceOrder(new Randomizer(new Mt19937(42))))->draw($bugs);

        self::assertSame(array_map(static fn ($bug): string => $bug->id, $bugs), array_keys($orders));
        foreach ($orders as $order) {
            $sorted = $order;
            sort($sorted);
            self::assertSame([0, 1, 2], $sorted, 'a permutation of the 3 choices');
        }
    }

    // Done when of #102: over many games, the right fix (index 0 in every file) moves.
    public function testTheRightFixIsNotAlwaysAtTheSamePosition(): void
    {
        $bugs = array_values((new BugCatalog('tests/fixtures/bugs', __DIR__.'/../..'))->all());
        $shuffle = new ChoiceOrder(new Randomizer(new Mt19937(42)));

        $positions = [];
        for ($game = 0; $game < 30; ++$game) {
            foreach ($shuffle->draw($bugs) as $order) {
                $positions[ChoiceOrder::positionOf($order, 0)] = true;
            }
        }

        ksort($positions);
        self::assertSame([0, 1, 2], array_keys($positions));
    }

    public function testFromAPositionOnScreenToTheChoiceOfTheFileAndBack(): void
    {
        // On screen: choice 2 of the file, then 0, then 1.
        $order = [2, 0, 1];

        self::assertSame(2, ChoiceOrder::choiceAt($order, 0));
        self::assertSame(0, ChoiceOrder::choiceAt($order, 1));
        self::assertSame(1, ChoiceOrder::positionOf($order, 0));
        self::assertSame(0, ChoiceOrder::positionOf($order, 2));
    }
}
