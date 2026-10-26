<?php

namespace App\Game;

/**
 * One bug of the pool, read from its JSON file (format: data/bugs/README.md).
 * Holds the answer: only toPublic() may leave the server before the player answers.
 */
final readonly class Bug
{
    public const TRACKS = ['dev', 'network'];
    public const LEVELS = [0, 1, 2, 3, 4];
    // How a bug is drawn. Every view but diagram is a list of lines (code,
    // bugLine), whatever the track: a network bug can be a terminal.
    public const VIEWS = ['code', 'terminal', 'email', 'config', 'rules', 'diagram'];

    /**
     * @param list<string>              $choices
     * @param list<string>|null         $code    bugs drawn as lines
     * @param array<string, mixed>|null $diagram bugs drawn as a diagram
     */
    private function __construct(
        public string $id,
        public string $track,
        public int $difficulty,
        public int $points,
        public string $title,
        public array $choices,
        public int $answer,
        public string $explanation,
        public ?array $code = null,
        public ?int $bugLine = null,
        public ?array $diagram = null,
        public ?string $bugTarget = null,
        // A nudge whispered by the duck: points the way, never gives the answer.
        public ?string $hint = null,
        // As written in the file; null: code for dev, diagram for network.
        public ?string $view = null,
        // Shown above the lines: "Python", "SQL"...
        public ?string $language = null,
        // Shown above the lines, e.g. an error message to trace back.
        public ?string $context = null,
    ) {
    }

    /**
     * @throws InvalidBugException when the data breaks the format
     */
    public static function fromArray(mixed $data): self
    {
        if (!\is_array($data)) {
            throw new InvalidBugException('not a JSON object');
        }

        $id = self::string($data, 'id');
        $track = self::string($data, 'track');
        if (!\in_array($track, self::TRACKS, true)) {
            throw new InvalidBugException('track must be dev or network');
        }
        $difficulty = self::int($data, 'difficulty');
        if (!\in_array($difficulty, self::LEVELS, true)) {
            throw new InvalidBugException('difficulty must be 0 to 4');
        }
        $points = self::int($data, 'points');
        if ($points !== 100 * ($difficulty + 1)) {
            throw new InvalidBugException('points must be 100 x (difficulty + 1)');
        }
        $choices = self::strings($data, 'choices');
        if (3 !== \count($choices)) {
            throw new InvalidBugException('choices must hold 3 strings');
        }
        $answer = self::int($data, 'answer');
        if ($answer < 0 || $answer > 2) {
            throw new InvalidBugException('answer must be 0 to 2');
        }
        $common = [$id, $track, $difficulty, $points, self::string($data, 'title'), $choices, $answer, self::string($data, 'explanation')];
        $hint = self::optionalString($data, 'hint');
        $view = self::optionalString($data, 'view');
        if (null !== $view && !\in_array($view, self::VIEWS, true)) {
            throw new InvalidBugException('view must be one of '.implode(', ', self::VIEWS));
        }

        if ('diagram' !== ($view ?? ('dev' === $track ? 'code' : 'diagram'))) {
            $code = self::strings($data, 'code');
            $bugLine = self::int($data, 'bugLine');
            if ($bugLine < 0 || $bugLine >= \count($code)) {
                throw new InvalidBugException('bugLine must be a line of code');
            }

            return new self(
                ...$common,
                code: $code,
                bugLine: $bugLine,
                hint: $hint,
                view: $view,
                language: self::optionalString($data, 'language'),
                context: self::optionalString($data, 'context'),
            );
        }

        $diagram = $data['diagram'] ?? null;
        if (!\is_array($diagram) || !\is_array($diagram['devices'] ?? null) || !\is_array($diagram['links'] ?? null)) {
            throw new InvalidBugException('diagram must hold devices and links');
        }
        $deviceIds = array_map(
            static fn (mixed $device): mixed => \is_array($device) ? ($device['id'] ?? null) : null,
            $diagram['devices'],
        );
        $bugTarget = self::string($data, 'bugTarget');
        if (!\in_array($bugTarget, $deviceIds, true)) {
            throw new InvalidBugException('bugTarget must be the id of a device');
        }

        /** @var array<string, mixed> $diagram */
        return new self(...$common, diagram: $diagram, bugTarget: $bugTarget, hint: $hint, view: $view);
    }

    // Lines are selected with selectedLine, a diagram with selectedTarget.
    public function isDrawnAsLines(): bool
    {
        return null !== $this->code;
    }

    /**
     * What the client may see before answering: an explicit list of fields, so a
     * secret field added to the JSON later cannot leak. bugLine, bugTarget, answer
     * and explanation are never in it.
     *
     * @param list<int> $choiceOrder The order of the game (ChoiceOrder)
     *
     * @return array<string, mixed>
     */
    public function toPublic(array $choiceOrder = ChoiceOrder::FILE_ORDER): array
    {
        $public = [
            'id' => $this->id,
            'track' => $this->track,
            'difficulty' => $this->difficulty,
            'points' => $this->points,
            'title' => $this->title,
            'choices' => array_map(fn (int $choice): string => $this->choices[$choice], $choiceOrder),
        ];

        if (null !== $this->view) {
            $public['view'] = $this->view;
        }
        if ($this->isDrawnAsLines()) {
            $public['code'] = $this->code;
            foreach (['language' => $this->language, 'context' => $this->context] as $key => $value) {
                if (null !== $value) {
                    $public[$key] = $value;
                }
            }
        } else {
            $public['diagram'] = $this->diagram;
        }
        if (null !== $this->hint) {
            $public['hint'] = $this->hint;
        }

        return $public;
    }

    /**
     * @param array<mixed> $data
     */
    private static function string(array $data, string $key): string
    {
        if (!\is_string($data[$key] ?? null) || '' === $data[$key]) {
            throw new InvalidBugException(\sprintf('%s must be a non-empty string', $key));
        }

        return $data[$key];
    }

    /**
     * @param array<mixed> $data
     */
    private static function optionalString(array $data, string $key): ?string
    {
        return \array_key_exists($key, $data) ? self::string($data, $key) : null;
    }

    /**
     * @param array<mixed> $data
     */
    private static function int(array $data, string $key): int
    {
        if (!\is_int($data[$key] ?? null)) {
            throw new InvalidBugException(\sprintf('%s must be an integer', $key));
        }

        return $data[$key];
    }

    /**
     * @param array<mixed> $data
     *
     * @return list<string>
     */
    private static function strings(array $data, string $key): array
    {
        $value = $data[$key] ?? null;
        if (!\is_array($value) || [] === $value || !array_is_list($value)) {
            throw new InvalidBugException(\sprintf('%s must be a non-empty array of strings', $key));
        }
        foreach ($value as $item) {
            if (!\is_string($item)) {
                throw new InvalidBugException(\sprintf('%s must be a non-empty array of strings', $key));
            }
        }

        /** @var list<string> $value */
        return $value;
    }
}
