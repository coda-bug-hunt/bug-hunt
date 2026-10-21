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
- The API contract is spec section 3.2 (v1). The front end codes against it
  through a mock client; never change a route or a field without updating the spec.

## Commands

- Front end (in `frontend/`): `npm ci`, `npm run dev`, `npm run lint`, `npm run build`
- Back end (in `backend/`): `make install` (first time), `make up`, `make down`,
  `make logs`, `make migrate`; `make help` lists every target

## Project layout

- `frontend/` — the player, leaderboard and admin views
- `backend/` — the API
- `data/bugs/` — game content, one JSON file per bug (format below)

## Domain rules (do not change without asking)

- A game is 8 bugs: 4 dev, 4 network, alternating, levels 1 to 4.
- Points: 100 x level. Wrong line then right fix: 50%. Wrong fix or timeout: 0.
- 60 seconds per bug, enforced by the server, never by the client.
- The right answer is never sent to the client before the player answers.
- Orientation: compare dev % and network %; a gap of 10 points or less is "both".

## Bug JSON format

Fields: id, track (dev|network), difficulty (1-4), points, title, code (array of
lines) or diagram, bugLine (0-based) or bugTarget, choices (3), answer (0-based),
explanation. Game texts in French, everything else in English.

## Working rules

- Start from the GitHub issue: its "Done when" list is the acceptance criteria.
- Plan before coding on anything bigger than a small fix; show the plan first.
- Work on a branch, never on main. Keep changes within the scope of the issue.
- Run tests and lint before saying a task is done.
- Never read, print or commit .env files or secrets.
- Code, comments and commit messages in English (Conventional Commits).
