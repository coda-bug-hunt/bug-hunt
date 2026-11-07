<?php

namespace App\Command;

use App\Repository\PlayerRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

// Run the day before the open day and after it (spec 6).
#[AsCommand(name: 'app:reset-scores', description: 'Delete every game and every player')]
final class ResetScoresCommand extends Command
{
    public function __construct(private readonly PlayerRepository $players)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if (!$io->confirm('Delete every game and every player?', false)) {
            $io->note('Nothing deleted.');

            return Command::FAILURE;
        }

        $deleted = $this->players->deleteAll();

        $io->success(\sprintf('Deleted %d games and %d players.', $deleted['games'], $deleted['players']));

        return Command::SUCCESS;
    }
}
