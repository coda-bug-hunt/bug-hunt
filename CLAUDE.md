# Bug Hunt

Web game for Coda's open day (Nov 7, 2026). Players find bugs in short code
snippets or network diagrams on their phone; a leaderboard runs on a big screen.
Team workflow and rules: see CONTRIBUTING.md. Follow them.

## Stack

| Outil           | À quoi ça sert                                                                                   |
|-----------------|--------------------------------------------------------------------------------------------------|
| **Symfony 7.4** | Le framework PHP. Il gère les routes, le JSON, la validation, etc.                               |
| **Doctrine**    | Fait le lien entre tes classes PHP et la base de données (pas besoin d'écrire du SQL à la main). |
| **FrankenPHP**  | Le serveur web qui exécute PHP.                                                                  |
| **MariaDB**     | La base de données.                                                                              |
| **Adminer**     | Une page web pour voir et modifier la base.                                                      |
| **Make**        | Des raccourcis : `make up` au lieu de `docker compose up -d --wait`.                             |
| **React**       | Pour le front.                                                                                   |

- Front end details: `frontend/CLAUDE.md`.
- The API contract is the "API contract (v1)" section below. The front end codes
  against it through a mock client; never change a route or a field without
  updating that section and `frontend/src/api/types.ts`.

## Commands

- Front end (in `frontend/`): `npm ci`, `npm run dev`, `npm run lint`, `npm run build`
- Back end (in `backend/`): `make install` (first time), `make up`, `make down`,
  `make logs`, `make migrate`; `make help` lists every target

## Project layout

- `frontend/` — the player, leaderboard and admin views
- `backend/` — the API
- `data/bugs/` — game content, one JSON file per bug (format below)

## Domain rules (do not change without asking)

- 2 tracks: dev and network (shown as "SR" to players). Track id stays `network`.
- 5 levels, 0 to 4. Level 0 targets complete beginners (high-school students):
  very short, everyday logic, no jargon. Difficulty rises with each level.
- A game is 10 bugs: for each level from 0 to 4, one dev bug then one network bug.
- Pool: 5 bugs per level per track (50 bugs); each game picks one at random.
- Points: 100 x (level + 1). Wrong line then right fix: 50%. Wrong fix or timeout: 0.
- 60 seconds per bug, enforced by the server, never by the client.
- The right answer is never sent to the client before the player answers.
- Affinity: dev % = dev points / max dev points, same for network.
  A gap of 10 points or less is "both".

## Bug JSON format

Fields: id, track (dev|network), difficulty (0-4), points, title, code (array of
lines) or diagram, bugLine (0-based) or bugTarget, choices (3), answer (0-based),
explanation. Game texts in French, everything else in English.

## API contract (v1)

Types: `frontend/src/api/types.ts`. Game routes need `Authorization: Bearer <token>`
(401 `bad_token`, 404 `unknown_game`). Every error is `{"error": "<code>"}`.

| Method | Route | Input | Output |
| --- | --- | --- | --- |
| POST | `/api/games` | `pseudo`, `deviceId` | 201 `gameId`, `token`, `totalBugs` (10) · 400 `pseudo_invalid`, `pseudo_unavailable` |
| GET | `/api/games/{id}/next` | – | 200 `index`, `bug` (no `bugLine`, `bugTarget`, `answer`, `explanation`), `timeLimit`, `remainingSeconds` · 204 when the game is over |
| POST | `/api/games/{id}/selection` | `bugId`, `selectedLine` or `selectedTarget` | 200 `lineCorrect`, `correctLine` or `correctTarget` · 409 `already_selected`, `not_current_bug` |
| POST | `/api/games/{id}/answers` | `bugId`, `choice` (0-2, or `null` on timeout, allowed without a selection) | 200 `correct`, `correctChoice`, `points`, `explanation`, `score`, `finished` · 409 `already_answered`, `selection_missing`, `not_current_bug` |
| GET | `/api/games/{id}/result` | – | 200 `score`, `maxScore` (3000), `byTrack`, `percentByTrack` (track points / 1500), `affinity` (`dev`, `network`, `both`, or `null` in dev-only mode), `rank`, `playersCount` · 409 `game_not_finished` |
| GET | `/api/leaderboard` | – | 200 `top` (10: `rank`, `pseudo`, `score`, `affinity`, `byTrack`), `gauges` (`dev`, `network`), `gamesPlayed` |
| GET | `/api/admin/players` | header `X-Admin-Pin` | 200 `players` (50 latest: `pseudo`, `bestScore`, `affinity`, `hidden`, `lastPlayedAt`) · 401 `bad_pin` |
| PATCH | `/api/admin/players/{pseudo}` | `hidden`, header `X-Admin-Pin` | 204 · 401 `bad_pin` · 404 `unknown_player` |

## Working rules

- Start from the GitHub issue: its "Done when" list is the acceptance criteria.
- Plan before coding on anything bigger than a small fix; show the plan first.
- Work on a branch, never on main. Keep changes within the scope of the issue.
- Run tests and lint before saying a task is done.
- Never read, print or commit .env files or secrets.
- Code, comments and commit messages in English (Conventional Commits).
