<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Ce que le client a le droit d'envoyer pour créer / modifier une tâche.
 * Symfony remplit cet objet à partir du JSON reçu puis applique les règles de validation.
 * Si une règle échoue, l'API répond automatiquement 422 avec le détail des erreurs.
 */
final class TaskInput
{
    public function __construct(
        #[Assert\NotBlank(message: 'Le titre est obligatoire.')]
        #[Assert\Length(max: 255)]
        public readonly string $title = '',

        public readonly bool $done = false,
    ) {
    }
}
