<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Adds the optimistic lock version of a game (a double tap cannot score a bug twice).
 */
final class Version20261025160427 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add game.version for optimistic locking';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE game ADD version INT DEFAULT 1 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE game DROP version');
    }
}
