# Adversarial Algorithm Arena (Phaser 3 + Vite)

A night-themed, pixel-art wizarding game that gamifies **defensive coding**. You
explore a hand-painted overworld map of castles; entering one pulls a real
data-structures problem, you write code to solve it, and your code is **run in a
sandbox against hidden test cases** — only correct *and* resilient solutions win
the duel.

> **The thesis:** we don't just check if your code is *correct* — we run it and
> check if it's *fast* and *crash-free*. Slow code times out (TLE), buggy code
> crashes (CRASH); only efficient, robust solutions deal full damage.

## The loop

1. **Map** — hover a castle (name + difficulty), click to enter.
2. **Battle** — a real problem is fetched from the **Supabase question bank**
   (title, difficulty, description, constraints, worked examples).
3. **Code** — write `solve(input)` in the in-browser editor and hit **CAST**.
4. **Grade** — your code runs in a **Web Worker sandbox** against the question's
   test cases → `PASS / WRONG / TLE / CRASH` → a score → battle damage.
5. **Win** — reduce the opponent (the AI Wizard) to 0 HP; your score posts to the
   **Supabase leaderboard** under your player identity.

## Run it

```bash
npm install
cp .env.example .env     # then fill in your Supabase values (see below)
npm run dev
```

Vite serves the **landing page** at `http://localhost:5173`; click **▶ Enter the
Arena** (or open `/play.html`) for the game.

- **Map:** hover a castle for its name + difficulty, click to enter. Press **`D`**
  to toggle a debug overlay of the clickable hotspot zones.
- **Battle:** type your `solve(input)`, hit **CAST SPELL**. Reduce the opponent to
  0 HP to win. Use **← MAP** to return.
- The map/battle scale to fit the window (no cropping); the cursor is a custom
  pixel-art arrow (gold sparkle over clickables).

Build with `npm run build` (multi-page: `index.html` + `play.html` → `dist/`),
preview with `npm run preview`.

## Environment variables (Supabase)

The question bank and leaderboard live in **Supabase**. Create a `.env`
(git-ignored) from `.env.example`:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon / public key>
```

- These are **build-time** vars (Vite inlines `import.meta.env.VITE_*`). On
  **Vercel**, set them in Project → Settings → Environment Variables **and
  redeploy** — a build made before they existed won't have them.
- Without them the game still runs: it falls back to bundled local challenges and
  skips the leaderboard (a `[supabase] … disabled` console warning is shown).
- The tables need Row-Level Security policies: anon `select` on `questions`; anon
  `select` + `insert` on `leaderboard`.

## How it works

**Grading (`src/engine/`)** — `runSolution(code, challenge)` runs the player's
code inside a **Web Worker** (`worker.js`), one test at a time. A hard per-test
timeout is enforced from the main thread by **terminating** a hung worker, so an
infinite loop becomes a clean **TLE** instead of freezing the page. Verdicts:
`PASS / WRONG / TLE / CRASH`. `scoreResults()` turns them into four axes
(correctness, efficiency, robustness, adversarial) → a composite → damage.

> The Web Worker keeps the page safe/responsive but is **not** a hardened security
> boundary (code can still use memory/network). Sandboxed multi-language
> execution via Docker is the documented Phase B (`docs/SYSTEM_ARCHITECTURE.md`).

**Questions (`src/supabaseClient.js`)** — `getRandomQuestion(difficulty)` pulls a
problem for the castle's difficulty; the battle screen shows its title,
difficulty badge, description, constraints, and examples, and grades `solve(input)`
against its `test_cases` (`{ input, expected_output }`). Local `src/challenges/`
are the offline fallback when the DB is unavailable.

**Identity & leaderboard** — `main.js` assigns an anonymous `player_username`
(stored in localStorage) shown in the map profile panel; on a win,
`submitScore(username, points)` records it to the Supabase `leaderboard`.

## Project structure

```
.
├── index.html              # LANDING page (pixel theme, hero uses map.png)
├── play.html               # GAME page (mounts Phaser; HOME link back)
├── vite.config.js          # multi-page build (index.html + play.html)
├── .env.example            # Supabase env var template
├── public/assets/          # map.png, cleaned *_idle.png cut-outs, cursors, source sheets
├── docs/
│   └── SYSTEM_ARCHITECTURE.md   # target/Phase-B architecture
├── CLAUDE.md               # team roles, contracts, status (AI/teammate reference)
└── src/
    ├── main.js             # Phaser config + player identity (localStorage)
    ├── config.js           # MAP_W/H, ASSETS, CURSOR, CASTLES (zones, difficulty, points)
    ├── supabaseClient.js    # Supabase client: getRandomQuestion / submitScore / getTopScores
    ├── engine/
    │   ├── runner.js       # runSolution() orchestrator + scoreResults()
    │   └── worker.js       # sandboxed Web Worker that runs player code vs tests
    ├── challenges/
    │   ├── schema.js       # Challenge/Result typedefs + VERDICT
    │   ├── index.js        # registry (getChallenge)
    │   └── arrays.js / trees.js / graphs.js / dp.js   # local fallback challenges
    └── scenes/
        ├── BootScene.js    # loads art with a progress bar, builds glow texture
        ├── MapScene.js     # map, castle hotspots, hover tooltip, profile panel
        └── BattleScene.js  # question panel, code editor, grading, HP/FX, leaderboard submit
```

## Assets

Pixel art lives in `public/assets/`. Battle sprites are cleaned, background-removed
cut-outs derived from AI-generated reference sheets.

| File                    | Used as                  | Notes                                |
| ----------------------- | ------------------------ | ------------------------------------ |
| `map.png`               | overworld map background | 1402×1122; canvas is sized to match  |
| `builder_idle.png`      | player (Builder)         | cleaned front-idle, transparent bg   |
| `wizard_idle.png`       | attacker (AI Wizard)     | cleaned front-idle, transparent bg   |
| `witch_idle.png`        | spare variant            | cleaned front-idle, transparent bg   |
| `cursor.png` / `cursor-hover.png` | pixel cursors  | default arrow / gold hover arrow     |
| `*.png` (source sheets) | reference originals      | 1254×1254, 5 cols × 4 rows           |

## Adding / editing castles

Castles are data-driven from the `CASTLES` array in `src/config.js`:

```js
{
  key: 'arrays',
  name: 'CASTLE OF ARRAYS',
  diff: '★☆☆',
  difficultyLevel: 'Easy',            // matches Supabase questions.difficulty_level
  points: 10,                          // score posted to the leaderboard on a win
  color: 0x4ea3ff,
  opponent: 'wizard',
  zone: { x: 900, y: 40, w: 384, h: 320 },   // hotspot in map pixels (press D to tune)
  prompt: '…flavor text…',
  challenge: '…local fallback problem text…'
}
```

`difficultyLevel` selects which Supabase questions can appear at that castle.

## Tech

- **[Phaser 3](https://phaser.io/)** — scenes, input, tweens, rendering.
- **[Vite](https://vitejs.dev/)** — dev server + multi-page build.
- **Web Workers** — sandboxed, timeout-enforced code execution.
- **[Supabase](https://supabase.com/)** (Postgres) — question bank + leaderboard.
- **Vercel** — hosting.
- **"Press Start 2P"** font + CSS CRT overlay; `Scale.FIT` into an aspect-locked
  container; custom pixel cursor.

## Roadmap (Phase B)

- **Adversarial matchmaking:** async store-and-replay pairing (Builders vs
  Breakers), ELO, a job queue.
- **Docker execution sandbox:** isolated, multi-language, with no-network +
  CPU/memory limits (the real security boundary).
- Real **accounts** (beyond device-local identity); in-game **leaderboard** view.
- Walk/cast **animations** from the character sheets.

See `docs/SYSTEM_ARCHITECTURE.md` for the full target architecture and
`CLAUDE.md` for team roles, contracts, and status.
```

