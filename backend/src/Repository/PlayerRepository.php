<?php

namespace App\Repository;

use App\Entity\Game;
use App\Entity\Player;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Player>
 */
class PlayerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Player::class);
    }

    // Case-insensitive: "Neo42" finds "neo42".
    public function findByPseudo(string $pseudo): ?Player
    {
        return $this->find(Player::keyOf($pseudo));
    }

    public function save(Player $player): void
    {
        $this->getEntityManager()->persist($player);
        $this->getEntityManager()->flush();
    }

    /**
     * Keeps the game as the player's best only if it beats the current best
     * (or is the first finished one). A single UPDATE: two games of the same
     * player ending at the same moment cannot overwrite a better score.
     */
    public function recordFinishedGame(Game $game): void
    {
        if (!$game->isFinished()) {
            throw new \LogicException(\sprintf('Game %s is not finished.', $game->getId()));
        }

        $this->getEntityManager()->createQuery(
            'UPDATE '.Player::class.' p
             SET p.bestScore = :score, p.bestDev = :dev, p.bestNetwork = :network,
                 p.affinity = :affinity, p.bestReachedAt = :reachedAt
             WHERE p.pseudoKey = :key AND (p.bestReachedAt IS NULL OR p.bestScore < :score)'
        )
            ->setParameter('score', $game->getScore())
            ->setParameter('dev', $game->getDevPoints())
            ->setParameter('network', $game->getNetworkPoints())
            ->setParameter('affinity', $game->getAffinity())
            ->setParameter('reachedAt', $game->getFinishedAt())
            ->setParameter('key', Player::keyOf($game->getPseudo()))
            ->execute();
    }

    /**
     * Where a finished game stands among the best scores of the visible players,
     * in leaderboard order: higher score first, then the score reached first.
     * The player of the game is left out of the comparison (a replay below their
     * own best is not ranked behind it) but always counted.
     *
     * @return array{rank: int, playersCount: int}
     */
    public function standing(Game $game): array
    {
        if (!$game->isFinished()) {
            throw new \LogicException(\sprintf('Game %s is not finished.', $game->getId()));
        }

        $others = $this->createQueryBuilder('p')
            ->select('COUNT(p.pseudoKey)')
            ->where('p.hidden = false')
            ->andWhere('p.bestReachedAt IS NOT NULL')
            ->andWhere('p.pseudoKey != :key')
            ->setParameter('key', Player::keyOf($game->getPseudo()));
        $playersCount = 1 + (int) (clone $others)->getQuery()->getSingleScalarResult();
        $above = (int) $others
            ->andWhere('p.bestScore > :score OR (p.bestScore = :score AND p.bestReachedAt < :reachedAt)')
            ->setParameter('score', $game->getScore())
            ->setParameter('reachedAt', $game->getFinishedAt())
            ->getQuery()
            ->getSingleScalarResult();

        return ['rank' => 1 + $above, 'playersCount' => $playersCount];
    }

    /**
     * The best visible players, one row per nickname, in the same order as
     * standing(): higher score first, then the score reached first.
     *
     * @return list<Player>
     */
    public function top(int $limit): array
    {
        /** @var list<Player> */
        return $this->createQueryBuilder('p')
            ->where('p.hidden = false')
            ->andWhere('p.bestReachedAt IS NOT NULL')
            ->orderBy('p.bestScore', 'DESC')
            ->addOrderBy('p.bestReachedAt', 'ASC')
            ->addOrderBy('p.pseudoKey', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    // False when the nickname is unknown.
    public function setHidden(string $pseudo, bool $hidden): bool
    {
        $player = $this->findByPseudo($pseudo);
        if (null === $player) {
            return false;
        }

        $player->setHidden($hidden);
        $this->getEntityManager()->flush();

        return true;
    }

    /**
     * @return list<Player> The players who played last, most recent first.
     */
    public function latest(int $limit): array
    {
        /** @var list<Player> */
        return $this->createQueryBuilder('p')
            ->orderBy('p.lastPlayedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
