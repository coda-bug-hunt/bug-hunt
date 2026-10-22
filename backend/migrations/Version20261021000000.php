<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Crée la table "task" (correspond à l'entité App\Entity\Task).
 * Les prochaines migrations seront générées automatiquement avec "make migration".
 */
final class Version20261021000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création de la table task';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE task (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(255) NOT NULL, done TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE task');
    }
}
