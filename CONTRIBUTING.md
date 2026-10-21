# How we work on a task

Every task follows the same seven steps, whoever you are and whatever the task
(code, content, Docker, a question to the school). Keep this page open the first
few times.

```
Pick -> Understand -> Branch -> Work -> Pull request -> Review -> Merge
```

## Once, before your first task

```bash
gh auth login                                   # GitHub CLI, used below
git clone https://github.com/coda-bug-hunt/bug-hunt.git
cd bug-hunt
```

Then follow the "Run the project" section of the README for your part
(front end, back end or the whole game with Docker).

## 1. Pick

- Open the **Bug Hunt** board (repo -> *Projects*).
- Take an issue of the **current milestone** (Prototype first, then MVP).
- Check its **Depends on** section: those issues must be closed, or at least
  far enough along for you to start. Otherwise pick another one.
- Assign yourself and move the card to **In Progress**:

```bash
gh issue edit <number> --add-assignee @me
```

One task in progress per person at a time. Finish it (or hand it back) before
starting another.

## 2. Understand

- Read the whole issue: **Why**, **What to do**, **Done when**.
- Read the spec sections listed in **References** (Claude Doc, tab
  *Cahier des charges*).
- Something unclear? **Ask in the issue comments**, not only on Discord: the
  answer then stays with the task for whoever reads it next. Tag the person:
  `@Charkx`.

You are ready to start when you could explain the task to someone else in two
sentences.

## 3. Branch

```bash
git switch main
git pull
git switch -c <type>/<issue-number>-<short-description>
```

| Type | For | Example |
| --- | --- | --- |
| `feat` | a new feature | `feat/14-start-game` |
| `fix` | a bug in our code | `fix/31-timer-negative` |
| `content` | game bugs in `data/bugs/` | `content/22-first-dev-bugs` |
| `chore` | setup, tooling, dependencies | `chore/12-symfony-skeleton` |
| `ci` | the GitHub Actions workflow | `ci/27-backend-job` |
| `infra` | Docker, stand, network | `infra/2-front-docker-image` |
| `docs` | documentation only | `docs/40-run-the-game` |

Never work on `main`: the ruleset refuses any push to it.

## 4. Work

- Commit small and often, with [Conventional Commits](https://www.conventionalcommits.org):

```bash
git add <files>
git commit -m "feat: serve the next bug without its answer"
```

- Run the checks of your part **before** pushing. The CI runs the same ones and
  blocks the merge if one fails:

| Part | Checks |
| --- | --- |
| Front end (`frontend/`) | `npm run lint`, `npm run build`, `npm test -- --run` |
| Back end (`backend/`) | None yet: added with the back-end CI issue |
| Content (`data/bugs/`) | `jq empty data/bugs/**/*.json`, then play the bug once in the game |

- Stuck for more than an hour? Say it in the issue or on Discord. Asking early
  is part of the job, not a failure.
- Blocked by someone else's task? Comment `Blocked by #<number>` in the issue,
  tell the team, and pick another task in the meantime.

## 5. Pull request

```bash
git push -u origin HEAD
gh pr create --fill
```

- Fill in the template. The line `Closes #<number>` links the PR to the issue:
  the issue closes and its card moves to **Done** when the PR is merged.
- In **How to test**, write the exact steps or commands a reviewer runs.
- Keep it small: around 400 changed lines, content files excluded. A big task
  becomes several PRs (`Part of #<number>` on all but the last one).
- Not finished but want early feedback? Open it as a draft:
  `gh pr create --fill --draft`.

## 6. Review

Every PR is reviewed by someone other than its author.

| Change | Reviewer |
| --- | --- |
| Front end | AeRia or Bezou: test the screen at 390 px wide, against the mockup |
| Back end | the other back-end developer (AeRia <-> Bezou) |
| Dev bugs | Charly or AeRia: play the bug, read the explanation |
| Network bugs | a network-track student for the content, then Bezou or Charly |
| Docker, CI, infra | Charly |

**As a reviewer**, answer within 24 hours, and check:

- [ ] Every box of the issue's **Done when** is really done
- [ ] You ran the **How to test** steps, and they work
- [ ] The rules of the game (spec 2.3) and the API contract (spec 3.2) are respected
- [ ] You understand every line; if not, ask in the PR, that is what review is for

Leave comments, then **Approve** or **Request changes**. The author answers each
comment, pushes the fixes on the same branch, and asks for a new review.

## 7. Merge

When the CI is green and the PR is approved:

```bash
gh pr merge --squash --delete-branch
git switch main
git pull
```

Then check that the issue is closed and that its card is in **Done**. Tick the
boxes of **Done when** in the issue if you did not do it in the PR.

## A task is done when

- every box of **Done when** is ticked,
- the CI is green,
- the PR is approved and merged,
- the issue is closed.

Not before. "It works on my machine" is step 4, not step 7.

## Working with a coding agent

Using a coding agent is allowed, never required. The same seven steps apply.

1. Give it the issue: `gh issue view <number>`, plus the mockup for a screen.
2. Ask for a plan first (plan mode), read it, correct it.
3. Let it code, then read the whole diff yourself before committing.
4. You are the author of the PR: you must be able to explain every line,
   whoever or whatever wrote it.

Agent instructions live in `CLAUDE.md` (root) and `frontend/CLAUDE.md`.

## Rules

- Never push directly to `main`.
- Keep PRs small: around 400 changed lines, content files excluded.
- You must be able to explain every line you submit.
- Never commit secrets. Use `.env` (ignored) and document variables in `.env.example`.
- Code, comments and commit messages in English. Game texts in French.
- A gap between the code and the API contract is fixed in the spec first
  (section 3.2), then on both sides, each in its own PR.
