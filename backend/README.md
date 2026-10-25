# Bug Hunt — back end

The game API: it draws the bugs, runs the timer, computes the scores and serves
the leaderboard. Symfony 7.4, Doctrine, MariaDB, FrankenPHP, all in Docker.

Rules for writing code here: [CLAUDE.md](CLAUDE.md). API contract: "API contract (v1)"
in the [root CLAUDE.md](../CLAUDE.md). Team workflow: [CONTRIBUTING.md](../CONTRIBUTING.md).

## Prerequisites

- **Docker** with Docker Compose (Docker Desktop on Mac and Windows, Docker Engine on Linux)
- **make** (on Windows, run everything from WSL2; turn on the WSL integration in Docker Desktop)

## Run it

```bash
make install   # first time: builds the image, starts the containers, installs dependencies, migrates
make up        # the next times
make down      # stop
```

| What | Address |
| --- | --- |
| The API | http://localhost:8000 |
| Health check | http://localhost:8000/api/health |
| Adminer | http://localhost:8081 (system MySQL, server `database`, user `app`, password `app`, database `app`) |

## Commands

Type `make` alone for the up-to-date list.

| Command | What it does |
| --- | --- |
| `make install` | First full install |
| `make up` / `make down` / `make restart` | Start / stop / restart the containers |
| `make logs` | Follow the logs (Ctrl+C to quit) |
| `make sh` | Shell in the PHP container |
| `make test` | PHPUnit tests |
| `make stan` | PHPStan static analysis (level 6) |
| `make composer c="require symfony/uid"` | Run Composer |
| `make console c="debug:router"` | Run a Symfony command |
| `make entity` / `make migration` / `make migrate` | Create an entity, generate the migration, apply it |
| `make db-reset` | Drop and recreate the database, then replay the migrations |
| `make clean` | Stop everything and **delete the database data** |

Run `make test` and `make stan` before pushing: the CI runs the same checks.

## Configuration

Environment variables only, declared with harmless defaults in `.env.example`
(`make install` copies it to `.env`, which is never committed).

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | MariaDB connection |
| `ADMIN_PIN` | PIN of the admin view (header `X-Admin-Pin`) |
| `BUGS_DIR` | Folder of the bug JSON files, `../data/bugs` (format: [data/bugs/README.md](../data/bugs/README.md)) |

## Layout

```
src/
  Controller/   one controller per resource (Game, Leaderboard, Admin, Health)
  Entity/       Doctrine entities: Game, Player
  Repository/   Doctrine repositories
  Game/         game flow: bug catalog, draw, scoring, timer, affinity
  Player/       nickname rules, banned words
tests/          same layout as src/
migrations/     database schema changes, generated with `make migration`
config/         Symfony configuration
```

Every route starts with `/api/`: the Vite proxy and the stand set-up depend on it.

## Common problems

**`port is already allocated`**: another program uses port 8000 or 8081. Change
`APP_PORT` or `ADMINER_PORT` in `.env`, then `make restart`.

**Error about `vendor/autoload_runtime.php`**: dependencies are missing. Run `make composer c=install`.

**`Connection refused` to the database**: MariaDB takes a few seconds to start
the first time. Wait, then try again; `make logs` shows where it is.

**An entity changed but the database did not**: run `make migration` then `make migrate`.

**Start from scratch**: `make clean` then `make install`. This deletes all the data.

**Permission error on `var/`**: `make sh` then `rm -rf var/cache/*`.
