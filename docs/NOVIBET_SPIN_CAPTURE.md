# Novibet / Evolution spin capture (paper-trade only)

RoSiStrat **never places bets** on Novibet. This flow only reads winning numbers and `POST`s them to the local backend so `/novibet` can paper-trade the robust Compound strategy.

## Architecture

1. You open European roulette on Novibet in Chrome (already signed in).
2. Capture layer extracts each new strike `0–36`.
3. `POST http://localhost:8080/api/spins` with `{ number, tableId, source, roundId?, ts? }`.
4. `/novibet` **Live** mode polls `GET /api/spins?tableId=…&afterId=…` every 2s and advances the engine.

## Prerequisites

- Backend: `cd backend && npm run dev` (port **8080**)
- Frontend: `npm run dev` → open `http://localhost:5173/novibet`
- Set `VITE_API_BASE=http://localhost:8080` in `.env.local` if needed

## API

```http
POST /api/spins
Content-Type: application/json

{ "number": 17, "tableId": "novibet-european-default", "source": "devtools", "roundId": "optional-unique-id" }
```

Batch:

```json
[
  { "number": 0, "source": "csv" },
  { "number": 32, "source": "csv" }
]
```

```http
GET /api/spins?tableId=novibet-european-default&afterId=0&limit=50
```

## Chrome DevTools MCP (operator steps)

1. Open the Evolution European table tab in Chrome.
2. With Cursor DevTools MCP connected to that browser:
   - `list_pages` → select the Novibet/Evolution tab
   - `evaluate_script` to read the **results history strip** (winning numbers ribbon)
3. When a **new** number appears that was not seen before, POST it to `/api/spins` with `source: "devtools"`.
4. Prefer a stable `roundId` if the DOM exposes one (avoids duplicates).

### Example evaluate idea (selectors change — verify live)

```js
() => {
  // Adapt selectors after inspecting the live DOM once
  const nodes = document.querySelectorAll('[data-role="recent-number"], .recent-results span, .number-history .value');
  return Array.from(nodes).slice(0, 20).map((el) => el.textContent?.trim());
}
```

If DOM scrape fails, fall back to **paste/CSV** on the Backtest tab or the helper script below.

## Helper script

From repo root (backend running):

```bash
node scripts/post-novibet-spin.mjs 17
node scripts/post-novibet-spin.mjs --table novibet-european-default --source manual 0 32 15
```

## Failure modes

| Issue | Mitigation |
|-------|------------|
| Evolution UI update breaks selectors | Re-inspect DOM; use paste/CSV |
| Backend down | Live panel shows feed error; backtest still works offline with PRNG/paste |
| Duplicate posts | Send unique `roundId`; DB unique index ignores duplicates |

## Legal / ToS

- Do **not** automate betting, clicking chips, or account actions.
- Capture is for **personal paper-trading / PFE simulation** of numbers you already can see on screen.
