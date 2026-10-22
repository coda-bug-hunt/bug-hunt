<?php

namespace App\Controller;

use App\Dto\TaskInput;
use App\Entity\Task;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * CRUD complet sur les tâches. Toutes les routes commencent par /api/tasks.
 * format: 'json' => même les erreurs (404, 422...) sont renvoyées en JSON.
 */
#[Route('/api/tasks', format: 'json')]
final class TaskController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly TaskRepository $tasks,
    ) {
    }

    // GET /api/tasks : liste toutes les tâches
    #[Route('', methods: ['GET'])]
    public function list(): JsonResponse
    {
        return $this->json($this->tasks->findAll());
    }

    // GET /api/tasks/12 : une tâche (Symfony va chercher la Task id=12 tout seul, 404 si absente)
    #[Route('/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Task $task): JsonResponse
    {
        return $this->json($task);
    }

    // POST /api/tasks : crée une tâche à partir du JSON {"title": "...", "done": false}
    #[Route('', methods: ['POST'])]
    public function create(#[MapRequestPayload] TaskInput $input): JsonResponse
    {
        $task = new Task($input->title);
        $task->setDone($input->done);

        $this->em->persist($task); // "je veux enregistrer cet objet"
        $this->em->flush();        // "exécute vraiment les requêtes SQL"

        return $this->json($task, Response::HTTP_CREATED);
    }

    // PUT /api/tasks/12 : remplace le titre et l'état
    #[Route('/{id}', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(Task $task, #[MapRequestPayload] TaskInput $input): JsonResponse
    {
        $task->setTitle($input->title);
        $task->setDone($input->done);

        $this->em->flush(); // l'objet vient déjà de la base, pas besoin de persist

        return $this->json($task);
    }

    // DELETE /api/tasks/12 : supprime la tâche
    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Task $task): Response
    {
        $this->em->remove($task);
        $this->em->flush();

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
