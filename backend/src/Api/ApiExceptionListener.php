<?php

namespace App\Api;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Every error under /api/ is {"error": "<code>"} (contract v1): the front maps
 * the code to a French message, and shows "Connexion perdue" for anything else.
 * Runs after Symfony has logged the exception, before its HTML error page.
 */
#[AsEventListener(event: KernelEvents::EXCEPTION, priority: -64)]
final class ApiExceptionListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $exception = $event->getThrowable();
        [$code, $status] = match (true) {
            $exception instanceof ApiException => [$exception->errorCode, $exception->status],
            $exception instanceof HttpExceptionInterface => [self::codeOf($exception->getStatusCode()), $exception->getStatusCode()],
            default => ['server_error', 500],
        };

        $event->setResponse(new JsonResponse(['error' => $code], $status));
    }

    // Errors outside the contract: an unknown route, a body that is not JSON...
    private static function codeOf(int $status): string
    {
        return match ($status) {
            404 => 'not_found',
            405 => 'method_not_allowed',
            default => $status < 500 ? 'bad_request' : 'server_error',
        };
    }
}
