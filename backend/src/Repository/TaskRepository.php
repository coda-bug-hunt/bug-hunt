<?php

namespace App\Repository;

use App\Entity\Task;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Le repository sert à LIRE des Task en base (find, findAll, findBy, requêtes perso...).
 *
 * @extends ServiceEntityRepository<Task>
 */
class TaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Task::class);
    }

    /**
     * Exemple de requête perso : les tâches pas encore faites, les plus récentes d'abord.
     *
     * @return Task[]
     */
    public function findTodo(): array
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.done = false')
            ->orderBy('t.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
