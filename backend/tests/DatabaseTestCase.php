<?php

namespace App\Tests;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Boots the kernel on the test database (app_test, see .env.test) and empties
 * the tables before each test, so every test starts from a clean state.
 */
abstract class DatabaseTestCase extends KernelTestCase
{
    protected EntityManagerInterface $em;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);

        $connection = $this->em->getConnection();
        $connection->executeStatement('DELETE FROM game');
        $connection->executeStatement('DELETE FROM player');
    }

    // Forget the loaded entities: the next read really goes to the database.
    protected function reload(): void
    {
        $this->em->clear();
    }
}
