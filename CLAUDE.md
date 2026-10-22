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


## Commands

<!-- Fill in once the stack is chosen -->
- Install: TBD
- Dev server: TBD
- Tests: TBD
- Lint: TBD

## Project layout

- `data/bugs/` — game content, one JSON file per bug (format below)
- Front end and back end folders: TBD

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

## Working rules

- Plan before coding on anything bigger than a small fix; show the plan first.
- Work on a branch, never on main. Keep changes within the scope of the issue.
- Run tests and lint before saying a task is done.
- Never read, print or commit .env files or secrets.
- Code, comments and commit messages in English (Conventional Commits).
