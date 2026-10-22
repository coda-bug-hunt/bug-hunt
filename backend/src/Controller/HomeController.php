<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class HomeController extends AbstractController
{
    // GET / : page d'accueil de l'API, liste les routes disponibles
    #[Route('/', methods: ['GET'], format: 'json')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Bienvenue sur l\'API',
            'routes' => [
                'GET /api/health',
                'GET /api/tasks',
                'GET /api/tasks/{id}',
                'POST /api/tasks',
                'PUT /api/tasks/{id}',
                'DELETE /api/tasks/{id}',
            ],
        ]);
    }

    // GET /api/health : vérifie que l'app ET la base de données répondent
    #[Route('/api/health', methods: ['GET'], format: 'json')]
    public function health(Connection $connection): JsonResponse
    {
        try {
            $connection->executeQuery('SELECT 1');
            $database = 'ok';
        } catch (\Throwable) {
            $database = 'ko';
        }

        return $this->json(
            ['status' => 'ok', 'database' => $database],
            'ok' === $database ? 200 : 503,
        );
    }
}
