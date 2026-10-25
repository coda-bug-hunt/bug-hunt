<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Adds the order of the choices of each bug, drawn per game (#102). Games
 * already in the table get no order: they keep the order of the files.
 */
final class Version20261025212522 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add game.choice_orders to shuffle the choices per game';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE game ADD choice_orders JSON DEFAULT NULL');
        $this->addSql("UPDATE game SET choice_orders = '{}'");
        $this->addSql('ALTER TABLE game MODIFY choice_orders JSON NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE game DROP choice_orders');
    }
}
