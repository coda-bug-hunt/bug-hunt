<?php

namespace App\Entity;

use App\Repository\GameRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A game in progress or finished. PHP keeps nothing between two requests,
 * so the whole state of the game lives here. Times are in milliseconds.
 */
#[ORM\Entity(repositoryClass: GameRepository::class)]
class Game
{
    #[ORM\Id]
    #[ORM\Column(length: 32)]
    private string $id;

    #[ORM\Column(length: 32)]
    private string $token;

    #[ORM\Column(length: 16)]
    private string $pseudo;

    #[ORM\Column(length: 64)]
    private string $deviceId;

    /** @var list<string> The bug ids, in game order. */
    #[ORM\Column(type: Types::JSON)]
    private array $bugIds;

    // Index of the current bug; equals count($bugIds) once the game is over.
    #[ORM\Column]
    private int $currentIndex = 0;

    // When the current bug was first served, for the timer. Null until then.
    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?int $currentSentAt = null;

    // Result of the line selection for the current bug. Null before it.
    #[ORM\Column(nullable: true)]
    private ?bool $currentLineCorrect = null;

    #[ORM\Column]
    private int $devPoints = 0;

    #[ORM\Column]
    private int $networkPoints = 0;

    // dev, network or both; null until the end, or in dev-only mode.
    #[ORM\Column(length: 8, nullable: true)]
    private ?string $affinity = null;

    #[ORM\Column(type: Types::BIGINT)]
    private int $createdAt;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?int $finishedAt = null;

    /**
     * @param list<string> $bugIds
     */
    public function __construct(string $id, string $token, string $pseudo, string $deviceId, array $bugIds, int $createdAt)
    {
        $this->id = $id;
        $this->token = $token;
        $this->pseudo = $pseudo;
        $this->deviceId = $deviceId;
        $this->bugIds = $bugIds;
        $this->createdAt = $createdAt;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function getPseudo(): string
    {
        return $this->pseudo;
    }

    public function getDeviceId(): string
    {
        return $this->deviceId;
    }

    /**
     * @return list<string>
     */
    public function getBugIds(): array
    {
        return $this->bugIds;
    }

    public function getCurrentIndex(): int
    {
        return $this->currentIndex;
    }

    public function setCurrentIndex(int $currentIndex): static
    {
        $this->currentIndex = $currentIndex;

        return $this;
    }

    public function getCurrentSentAt(): ?int
    {
        return $this->currentSentAt;
    }

    public function setCurrentSentAt(?int $currentSentAt): static
    {
        $this->currentSentAt = $currentSentAt;

        return $this;
    }

    public function getCurrentLineCorrect(): ?bool
    {
        return $this->currentLineCorrect;
    }

    public function setCurrentLineCorrect(?bool $currentLineCorrect): static
    {
        $this->currentLineCorrect = $currentLineCorrect;

        return $this;
    }

    public function getDevPoints(): int
    {
        return $this->devPoints;
    }

    public function setDevPoints(int $devPoints): static
    {
        $this->devPoints = $devPoints;

        return $this;
    }

    public function getNetworkPoints(): int
    {
        return $this->networkPoints;
    }

    public function setNetworkPoints(int $networkPoints): static
    {
        $this->networkPoints = $networkPoints;

        return $this;
    }

    public function getScore(): int
    {
        return $this->devPoints + $this->networkPoints;
    }

    public function getAffinity(): ?string
    {
        return $this->affinity;
    }

    public function getCreatedAt(): int
    {
        return $this->createdAt;
    }

    public function getFinishedAt(): ?int
    {
        return $this->finishedAt;
    }

    public function isFinished(): bool
    {
        return null !== $this->finishedAt;
    }

    public function finish(?string $affinity, int $finishedAt): static
    {
        $this->affinity = $affinity;
        $this->finishedAt = $finishedAt;

        return $this;
    }
}
