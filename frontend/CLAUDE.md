# Front end

React + TypeScript + Vite + Tailwind CSS 4. Three views: player (phone, also the
backup PC), leaderboard (big screen), admin (moderation).
Mockups: "Coda" variant, screens E1 to E8.

## Commands (run from frontend/)

- Dev server: npm run dev (add -- --host to test from a phone on the same network)
- Lint: npm run lint
- Type-check and build: npm run build
- Tests: npm test (from step F5)

Always run lint, build and tests before saying a task is done.

## Structure

- src/api/ - API types, client interface, mock client, HTTP client
- src/screens/ - one folder per screen (Home, Bug, BugNetwork, Feedback, End, Leaderboard, Admin)
- src/components/ - shared UI pieces (Duck mascot, code viewer, choice sheet...)
- src/index.css - Tailwind import and the @theme tokens

## Routing

React Router with three routes: / (player), /leaderboard, /admin.
Inside the player view, game steps (home, bug, feedback, end) are React state, not routes.

## Styling (Tailwind)

- Design tokens live in the @theme block of src/index.css. Use them through
  Tailwind classes: bg-night, bg-surface, border-line, bg-code, text-ink,
  text-ink-soft, text-muted, bg-lime / text-lime, bg-pink / text-pink, text-danger,
  font-display, font-sans, font-mono.
- Never use arbitrary colors (bg-[#123456]) or Tailwind's default palette
  (bg-blue-500). If a color is missing, ask me before adding a token.
- Dark text on lime: text-night on bg-lime.
- Dev and network are always shown with an icon (</> and network nodes),
  never by color alone.
- Long class lists: extract a component, not an @apply rule.

## Rules

- Mobile first: design at 390px wide, touch targets at least 44px (min-h-11).
- Real elements: button, a, input with label. No click handlers on divs.
- All API calls go through the client in src/api/. Components never call fetch.
- The client never knows the right answer before the player answers.
  Scores, timer and orientation come from the API, never computed in the UI.
- UI texts in French, code and comments in English.
- No new dependency without asking first.
- Small components; one screen per pull request.