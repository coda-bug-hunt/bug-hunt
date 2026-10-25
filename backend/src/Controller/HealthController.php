<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController extends AbstractController
{
    // GET /api/health: the API is up. Used by the stand set-up and the Docker checks.
    #[Route('/api/health', methods: ['GET'], format: 'json')]
    public function __invoke(): JsonResponse
    {
        return $this->json(['status' => 'ok']);
    }
}
