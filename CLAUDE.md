# Bug Hunt

Web game for Coda's open day (Nov 7, 2026). Players find bugs in short code
snippets or network diagrams on their phone; a leaderboard runs on a big screen.
Team workflow and rules: see CONTRIBUTING.md. Follow them.

## Stack

TBD (React front end; back end in Node or FastAPI, decided by AeRia).

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

- Plan before coding on anything bigger than a small fix; show the plan first.
- Work on a branch, never on main. Keep changes within the scope of the issue.
- Run tests and lint before saying a task is done.
- Never read, print or commit .env files or secrets.
- Code, comments and commit messages in English (Conventional Commits).