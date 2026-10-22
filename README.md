# Bug Hunt

A web game for Coda's open day (November 7, 2026): visitors find and fix bugs
in simplified code or network setups, then discover whether they lean towards
development or networking. A live leaderboard is shown on a big screen.

> **Working on a task? Start with [CONTRIBUTING.md](CONTRIBUTING.md).**
> It explains, step by step, how each of us picks, does, reviews and merges a task.

## Team

- René - Archi
- Charly — front end, repo, contact with the school
- AeRia — back end (game flow), CI, Docker
- Bezou — back end (storage, players, leaderboard) and game content

## Stack

- Front end: React, TypeScript, Vite, Tailwind CSS (`frontend/`)
- Back end: PHP, Symfony, Doctrine, FrankenPHP, MariaDB (`backend/`)
- Game content: one JSON file per bug (`data/bugs/`)
- Docker Compose runs the API and the stand version of the game

## Run the project

Front end only, against the mock API:

```bash
cd frontend
npm ci
npm run dev        # http://localhost:5173
```

The back end and Docker Compose instructions are added with their issues.

## Where things are

- Tasks: the **Bug Hunt** board (*Projects* tab) and the issues
- Specification, mockups, meeting notes: the team's Claude Doc
