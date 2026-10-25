<?php

namespace App\Controller;

use App\Game\BugDraw;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController extends AbstractController
{
    public function __construct(private readonly BugDraw $draw)
    {
    }

    // GET /api/health: the API is up. Used by the stand set-up and the Docker checks.
    // A test draw first: a pool that cannot make a game (or a broken bug file)
    // answers 500 server_error and logs why, so the stand never turns healthy.
    #[Route('/api/health', methods: ['GET'], format: 'json')]
    public function __invoke(): JsonResponse
    {
        $this->draw->draw();

        return $this->json(['status' => 'ok']);
    }
}
