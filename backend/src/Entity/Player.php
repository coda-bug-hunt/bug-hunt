<?php

namespace App\Entity;

use App\Repository\PlayerRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A nickname and the best game played with it. Times are in milliseconds.
 */
#[ORM\Entity(repositoryClass: PlayerRepository::class)]
class Player
{
    // Lowercase pseudo: "Neo42" and "neo42" are the same player.
    #[ORM\Id]
    #[ORM\Column(length: 16)]
    private string $pseudoKey;

    #[ORM\Column(length: 16)]
    private string $pseudo;

    #[ORM\Column(length: 64)]
    private string $deviceId;

    #[ORM\Column]
    private int $bestScore = 0;

    #[ORM\Column]
    private int $bestDev = 0;

    #[ORM\Column]
    private int $bestNetwork = 0;

    // Affinity of the best game. The best* fields are written by
    // PlayerRepository::recordFinishedGame(), with a single UPDATE.
    #[ORM\Column(length: 8, nullable: true)]
    private ?string $affinity = null; // @phpstan-ignore property.unusedType

    // When the best score was reached: earlier ranks higher on a tie.
    // Null until the first finished game.
    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?int $bestReachedAt = null; // @phpstan-ignore property.unusedType

    #[ORM\Column]
    private bool $hidden = false;

    #[ORM\Column(type: Types::BIGINT)]
    private int $lastPlayedAt;

    public function __construct(string $pseudo, string $deviceId, int $lastPlayedAt)
    {
        $this->pseudoKey = self::keyOf($pseudo);
        $this->pseudo = $pseudo;
        $this->deviceId = $deviceId;
        $this->lastPlayedAt = $lastPlayedAt;
    }

    public static function keyOf(string $pseudo): string
    {
        return mb_strtolower($pseudo);
    }

    public function getPseudoKey(): string
    {
        return $this->pseudoKey;
    }

    public function getPseudo(): string
    {
        return $this->pseudo;
    }

    public function getDeviceId(): string
    {
        return $this->deviceId;
    }

    public function getBestScore(): int
    {
        return $this->bestScore;
    }

    public function getBestDev(): int
    {
        return $this->bestDev;
    }

    public function getBestNetwork(): int
    {
        return $this->bestNetwork;
    }

    public function getAffinity(): ?string
    {
        return $this->affinity;
    }

    public function getBestReachedAt(): ?int
    {
        return $this->bestReachedAt;
    }

    public function hasFinishedGame(): bool
    {
        return null !== $this->bestReachedAt;
    }

    public function isHidden(): bool
    {
        return $this->hidden;
    }

    public function setHidden(bool $hidden): static
    {
        $this->hidden = $hidden;

        return $this;
    }

    public function getLastPlayedAt(): int
    {
        return $this->lastPlayedAt;
    }

    public function setLastPlayedAt(int $lastPlayedAt): static
    {
        $this->lastPlayedAt = $lastPlayedAt;

        return $this;
    }
}
