# Contributing

## Workflow

1. Pick an issue on the board and assign yourself.
2. Create a branch: `<type>/<issue-number>-<short-description>`.
3. Commit with Conventional Commits: `feat: ...`, `fix: ...`, `content: ...`.
4. Open a pull request and fill in the template.
5. Another team member reviews it. Never merge your own PR without a review.
6. Squash and merge, then delete the branch.

## Rules

- Never push directly to `main`.
- Keep PRs small: around 400 changed lines, content files excluded.
- You must be able to explain every line you submit, whoever or whatever wrote it.
- Never commit secrets. Use `.env` (ignored) and document variables in `.env.example`.
- Code, comments and commit messages in English. Game texts in French.

## Coding agents

Using a coding agent is allowed, never required. Agent instructions live in `CLAUDE.md`.
The same rules apply to agent-written code: same review, same tests, same PR size.