# Bug Hunt — front end

The player view (phones), the big screen of the stand and the admin view.
React 19, TypeScript, Vite, Tailwind CSS 4, React Router.

Rules for writing code here: [CLAUDE.md](CLAUDE.md). Team workflow: [CONTRIBUTING.md](../CONTRIBUTING.md).

## Run it

```bash
npm ci
npm run dev              # http://localhost:5173
npm run dev -- --host    # also on your phone, at the "Network" address (same Wi-Fi)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test -- --run` | All unit and component tests, once (`npm test` watches) |
| `npm run lint` | ESLint |
| `npm run build` | Type-check (`tsc -b`) and production build in `dist/` |

CI runs lint, tests and build on every pull request.

## Mock or real API

The client is picked once, at start-up, from two variables:

| Variable | Values | Default |
| --- | --- | --- |
| `VITE_API_MODE` | `mock`: in-memory game, no back end needed · `http`: the real API | `mock` |
| `VITE_API_URL` | Base URL of the API, in `http` mode | `/api` |

- In dev, `mock` is set by `.env.development`.
- The mock follows the real rules (points, 60 s, affinity) with 10 demo bugs.
  Its data lives in the browser tab: a game played on a phone does not show
  on the big screen of another device. Use the console snippet below.
- In dev, Vite proxies `/api` to `http://localhost:8000`. `http` mode can
  keep the default `VITE_API_URL` (`/api`). The stand image does the same
  with nginx (`frontend/Dockerfile`).

## Routes

| Route | For | Notes |
| --- | --- | --- |
| `/` | Players, on their phone | Home, then the 10 bugs, feedback after each, end screen. A reload resumes the game (`sessionStorage`). |
| `/leaderboard` | Big screen of the stand, landscape | Refreshes every 2 s. Click once to unlock the sound; **M** mutes it. |
| `/admin` | The stand team | Hide or show nicknames. PIN asked once per tab (mock PIN: `0000`). |

## Test it by hand

**Right answers of the mock**: dev bugs, line 2 then fix A; first network bug, the PC then fix A.

| Feature | How |
| --- | --- |
| Tutorial | Shown on the first bug of the first game of a device. To see it again: `localStorage.clear()` in the console. |
| Sound and vibration | On by default, unlocked by "Lancer la partie". Speaker button to mute; vibration on Android only. |
| Duck hint | Wait 20 s on a bug, or touch the duck. |
| Streak | 3 right answers in a row. |
| Ring timer | Around the duck; red under 10 s. |
| Reduced motion | iPhone: Accessibility › Motion › Reduce Motion. Android: Accessibility › Remove animations. Chrome: DevTools › Rendering › `prefers-reduced-motion: reduce`. Nothing should move. |

**Big screen with players** (mock mode): open `/leaderboard`, then paste this in the console.
It plays through the same mock as the page.

```js
async function play(pseudo, perfect) {
  const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('/src/api/index.ts'))
  const { api } = await import(url)
  const { mockBugs } = await import('/src/api/mockBugs.ts')
  const session = await api.createGame({ pseudo, deviceId: pseudo })
  for (let i = 0; i < 10; i++) {
    const next = await api.nextBug(session)
    const bug = mockBugs.find((b) => b.id === next.bug.id)
    await api.select(session, bug.track === 'dev' ? { bugId: bug.id, selectedLine: bug.bugLine } : { bugId: bug.id, selectedTarget: bug.bugTarget })
    await api.answer(session, { bugId: bug.id, choice: perfect || i % 3 === 0 ? bug.answer : (bug.answer + 1) % 3 })
  }
}
await play('Lyra_09', false)
await play('PixelKid', true)   // climbs to first place: highlight, banner, confetti, fanfare
```

Reload the page after changing a file, before running it again.

## Where things are

```
src/
  api/          Contract types, GameApi interface, mock client, HTTP client
  game/         Game state (reducer), useGame, countdown, saved session, view transitions
  hooks/        usePolling (leaderboard, admin)
  sound/        Generated sounds, vibration, mute setting, speaker button
  components/   Duck (mascot, animated) and TrackIcon
  screens/      One folder per screen: Home, Bug, Feedback, End, Leaderboard, Admin
  index.css     Tailwind import, theme tokens, duck and screen animations
  main.tsx      Routes
  App.tsx       Player view: home → game → end
```

The API contract is the "API contract (v1)" section of the root [CLAUDE.md](../CLAUDE.md),
mirrored in `src/api/types.ts`.
