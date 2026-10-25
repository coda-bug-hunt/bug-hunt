<?php

namespace App\Repository;

use App\Entity\Game;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Game>
 */
class GameRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Game::class);
    }

    public function save(Game $game): void
    {
        $this->getEntityManager()->persist($game);
        $this->getEntityManager()->flush();
    }

    /**
     * Finished games of the day, in one query. Hidden players still count:
     * hiding a nickname does not erase the games played. "both" adds 1 to
     * each gauge, a null affinity (dev-only mode) to none.
     *
     * @return array{gauges: array{dev: int, network: int}, gamesPlayed: int}
     */
    public function stats(): array
    {
        /** @var array{dev: int|string|null, network: int|string|null, played: int|string} $row */
        $row = $this->createQueryBuilder('g')
            ->select(
                "SUM(CASE WHEN g.affinity IN ('dev', 'both') THEN 1 ELSE 0 END) AS dev",
                "SUM(CASE WHEN g.affinity IN ('network', 'both') THEN 1 ELSE 0 END) AS network",
                'COUNT(g.id) AS played',
            )
            ->where('g.finishedAt IS NOT NULL')
            ->getQuery()
            ->getSingleResult();

        return [
            'gauges' => ['dev' => (int) $row['dev'], 'network' => (int) $row['network']],
            'gamesPlayed' => (int) $row['played'],
        ];
    }
}
