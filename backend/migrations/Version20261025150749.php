<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Creates the game and player tables (App\Entity\Game, App\Entity\Player).
 */
final class Version20261025150749 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the game and player tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE game (id VARCHAR(32) NOT NULL, token VARCHAR(32) NOT NULL, pseudo VARCHAR(16) NOT NULL, device_id VARCHAR(64) NOT NULL, bug_ids JSON NOT NULL, current_index INT NOT NULL, current_sent_at BIGINT DEFAULT NULL, current_line_correct TINYINT DEFAULT NULL, dev_points INT NOT NULL, network_points INT NOT NULL, affinity VARCHAR(8) DEFAULT NULL, created_at BIGINT NOT NULL, finished_at BIGINT DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE player (pseudo_key VARCHAR(16) NOT NULL, pseudo VARCHAR(16) NOT NULL, device_id VARCHAR(64) NOT NULL, best_score INT NOT NULL, best_dev INT NOT NULL, best_network INT NOT NULL, affinity VARCHAR(8) DEFAULT NULL, best_reached_at BIGINT DEFAULT NULL, hidden TINYINT NOT NULL, last_played_at BIGINT NOT NULL, PRIMARY KEY (pseudo_key)) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE game');
        $this->addSql('DROP TABLE player');
    }
}
