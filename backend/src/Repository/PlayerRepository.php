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
