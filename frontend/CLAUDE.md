# Front end

React + TypeScript + Vite + Tailwind CSS 4. Three views: player (phone, also the
backup PC), leaderboard (big screen), admin (moderation).
Mockups: "Coda" variant, screens E1 to E8.

## Commands (run from frontend/)

- Dev server: npm run dev (add -- --host to test from a phone on the same network)
- Lint: npm run lint
- Type-check and build: npm run build
- Tests: npm test -- --run (Vitest; component tests opt in with `// @vitest-environment jsdom`)

Always run lint, build and tests before saying a task is done.

## Structure

- src/api/ - API types, client interface, mock client, HTTP client
- src/game/ - game state (reducer), useGame, countdown, saved session, view transitions
- src/hooks/ - shared hooks (usePolling)
- src/sound/ - generated sounds, vibration, mute setting, speaker button
- src/components/ - UI shared by several screens (Duck mascot, TrackIcon)
- src/screens/ - one folder per screen (Home, Bug, Feedback, End, Leaderboard, Admin),
  with the pieces only that screen uses (CodeLines, FixSheet, NetworkDiagram...)
- src/index.css - Tailwind import, the @theme tokens and the animations

How to run, test by hand and drive the big screen with the mock: README.md.

## Routing

React Router with three routes: / (player), /leaderboard, /admin.
Inside the player view, game steps (home, bug, feedback, end) are React state, not routes.

## Styling (Tailwind)

- Design tokens live in the @theme block of src/index.css. Use them through
  Tailwind classes: bg-night, bg-surface, border-line, bg-code, text-ink,
  text-ink-soft, text-muted, bg-lime / text-lime, bg-pink / text-pink, text-danger,
  fill-duck / fill-duck-dark / fill-tear (mascot), font-display, font-sans, font-mono.
- Never use arbitrary colors (bg-[#123456]) or Tailwind's default palette
  (bg-blue-500). If a color is missing, ask me before adding a token.
- Dark text on lime: text-night on bg-lime.
- Dev and network are always shown with an icon (</> and network nodes),
  never by color alone.
- Long class lists: extract a component, not an @apply rule.
- Animations are `--animate-*` tokens with their keyframes in @theme, always used
  as `motion-safe:animate-...`: nothing moves with prefers-reduced-motion.
  SVG parts that turn or scale get `transform-fill` and an origin.

## Rules

- Mobile first: design at 390px wide, then check a small phone (360 x 640):
  the main action stays visible without scrolling. Touch targets at least 44px (min-h-11).
- Real elements: button, a, input with label. No click handlers on divs.
- All API calls go through the client in src/api/. Components never call fetch.
- The client never knows the right answer before the player answers.
  Scores, timer and orientation come from the API, never computed in the UI.
- UI texts in French, code and comments in English.
- No new dependency without asking first.
- Sounds are generated with the Web Audio API (no audio files), go through
  src/sound/player.ts and respect the mute setting. Never music on the phones.
- Browser storage (localStorage, sessionStorage) only for per-device
  conveniences, with keys `bug-hunt:<name>`, always inside try/catch: the game
  must work when storage is blocked.
- Test-first: write the failing tests, then the code. Screens that call the API
  take an optional `client` prop, used only by tests.
- Small components; one screen per pull request.