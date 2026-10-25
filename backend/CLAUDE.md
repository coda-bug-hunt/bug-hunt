# Back end

Symfony 7.4 API on FrankenPHP, Doctrine on MariaDB, everything in Docker.
The API contract is "API contract (v1)" in the root CLAUDE.md; the domain rules
there (points, timer, affinity, draw) are the spec this code implements.

## Commands (run from backend/)

- Start / stop: make up, make down (first time: make install)
- Tests: make test (PHPUnit)
- Static analysis: make stan (PHPStan level 6, src/ and tests/)
- Symfony console: make console c="debug:router"
- Schema change: make migration, then make migrate

Always run make test and make stan before saying a task is done.
PHP and Composer only exist in the container: never run them on the host.

## Structure

- src/Api/ - ApiException and the listener that turns every error into {"error": "<code>"}
- src/Controller/ - one controller per resource (Game, Leaderboard, Admin, Health)
- src/Entity/, src/Repository/ - Doctrine entities (Game, Player) and their repositories
- src/Game/ - game flow: bug catalog, draw, scoring, timer, affinity
- src/Player/ - nickname rules, banned words
- tests/ - same layout as src/

How to run and the environment variables: README.md.

## Rules

- Every route starts with /api/ and answers JSON. Every error is {"error": "<code>"},
  with a code from the contract.
- The server is the only judge: scores, timer and affinity are computed here,
  never trusted from the client.
- The right answer never leaves the server before the player answers. Public bug
  fields are an explicit list, never "the JSON minus a few keys".
- Bugs are read from BUGS_DIR (data/bugs/), never copied into backend/ or the database.
- Configuration comes from environment variables only (ADMIN_PIN, BUGS_DIR,
  DATABASE_URL), declared in .env.example with harmless defaults. Never read or commit .env.
- Game rules live in plain classes with no database access, unit tested.
  Inject the clock (ClockInterface, MockClock in tests) and the random source.
- Test-first: write the failing test, then the code.
- No new dependency without asking first.
- Code and comments in English; game texts (bug content) in French.
