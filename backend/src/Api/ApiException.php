<?php

namespace App\Api;

/**
 * An error of the API contract: answered as {"error": "<code>"} with its status.
 */
final class ApiException extends \RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        public readonly int $status,
    ) {
        parent::__construct($errorCode);
    }
}
