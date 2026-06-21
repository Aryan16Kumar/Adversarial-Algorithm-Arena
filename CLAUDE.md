# CLAUDE.md — Project Reference for AI Assistants & Teammates

> Read this first. It is the single source of truth for **what this project is,
> what is built, what still needs building, the architecture, and the tech
> stack**. Keep it updated as features land.

---

## 0. Team roles & tasks — READ THIS IF YOU ARE A TEAMMATE

> **AI assistant instructions:** If a teammate says *"I am Person N, read
> CLAUDE.md and tell me my task,"* go to that person's subsection below and
> reply with: (a) their **mission**, (b) the **files/dirs they own**, (c) their
> **task checklist** (next actions in order), (d) what they **depend on**, and
> (e) the **contracts they must honor** (§0.4). Do not assign work outside their
> ownership without flagging cross-team coordination.

We are a **team of 3**. Work is split so everyone runs in parallel with minimal
merge conflicts. Two shared **contracts** (§0.4) are the glue — lock them on day
0, then build independently.

```
Person 1 (Phase A engine + game)  ──Result object──▶  Person 3 (API client + UI + deploy)
                                                              │  REST API contract
                                                              ▼
                                                       Person 2 (database + API)
```

### 0.1 Person 1 — Phase A: Execution, Scoring & Game Integration
- **Mission:** Make combat actually work, fully client-side (no backend). Player
  code is run and graded; the score determines battle damage.
- **Owns:** `src/engine/` (new), `src/challenges/` (new), `src/scenes/BattleScene.js`.
- **Tasks (in order):**
  1. Define + commit the **Result object** contract (§0.4) and a **mock
     `runSolution()`** so Person 3 can start.
  2. Add **challenge definitions** for the 4 castles (function signature,
     `starterCode`, baseline `tests[]`, `adversarialTests[]`, reference solution).
  3. Build the **Web Worker sandbox runner** with a hard timeout + try/catch.
  4. Implement **verdicts** (PASS / WRONG / TLE / CRASH) and the **scoring
     matrix** → 4 axes → composite → `damage`.
  5. Wire it into `BattleScene.onCast()` (replace the fixed-damage stub); show
     verdict feedback + a resilience radar in the result screen.
- **Depends on:** nobody (runs standalone). Produces the **Result object** the
  rest of the system consumes.
- **Definition of done:** writing a real solution and casting it produces a real
  verdict + score + damage; full detail in **§6 Phase A**.

### 0.2 Person 2 — Database & Backend Data Layer
- **Mission:** Persist players, submissions, results, and serve leaderboard /
  progress (and, later, matches + ELO). This is Phase B groundwork.
- **Owns:** the backend service + database (new repo folder, e.g. `server/`).
- **Tasks (in order):**
  1. With Person 3, lock the **REST API contract** (§0.4).
  2. Design the **schema:** `users`, `challenges`, `submissions`, `results`
     (+ Phase B: `matches`, `elo_history`).
  3. Stand up the **API:** `POST /api/users`, `POST /api/submissions` (stores the
     **Result object**), `GET /api/leaderboard`, `GET /api/users/:id/progress`
     (+ Phase B: `POST /api/matchmaking/queue`, `GET /api/matches/:id`).
  4. **Seed** the 4 castles' metadata.
  5. Own migrations + provide connection/env details to Person 3.
- **Tech (hackathon-fast):** **Supabase** (managed Postgres + auth + auto API) is
  the quickest path; or hand-build with **Postgres + Prisma + Fastify** (matches
  the target stack in §8).
- **Depends on:** the API contract (shared with Person 3). Independent otherwise.
- **Definition of done:** a deployed API that accepts a Result object and returns
  a working leaderboard + per-user progress.

### 0.3 Person 3 — Integration, Identity & Delivery (the glue)
- **Mission:** Connect Person 1's game results to Person 2's database, build the
  surrounding UI, and ship the whole thing live.
- **Owns:** frontend API client (`src/api/`), identity/progression state
  (`src/state/`), leaderboard/profile UI, deployment config.
- **Tasks (in order):**
  1. With Person 2, lock the **REST API contract** (§0.4); build against a **mock
     API** until the real one lands.
  2. **Frontend API client:** after a battle, take Person 1's **Result object**
     and `POST` it to `/api/submissions`.
  3. **Player identity:** anonymous handle via localStorage + `POST /api/users`
     (no full auth needed for the prototype).
  4. **Leaderboard + progression UI** (pixel-themed) consuming `GET
     /api/leaderboard` and `/progress`.
  5. **Deploy:** frontend on **Vercel**, backend on Render/Railway/Fly; wire env
     vars + CORS so there's always a live demo URL.
  6. **Stretch (Phase B):** matchmaking service logic + WebSocket, on a separate
     branch so it never blocks the demo.
- **Depends on:** Person 1's Result object shape; Person 2's API contract.
- **Definition of done:** playing a castle stores a score that appears on a live
  leaderboard.

### 0.4 Shared contracts (lock on day 0)

**(A) Result object** — produced by Person 1, consumed by Person 3 → Person 2:
```js
{
  userId, challengeKey, code,
  perTest: [{ name, verdict /* 'PASS' | 'WRONG' | 'TLE' | 'CRASH' */, timeMs }],
  score:   { correctness, efficiency, robustness, adversarial }, // each 0..1
  composite,   // 0..1
  damage,      // 0..100
  won          // boolean
}
```
Runner signature: `runSolution(code, challenge) -> Promise<Result>`.

**(B) REST API contract** — owned by Person 2, consumed by Person 3:
```
POST /api/users                  { handle }                  -> { id, handle, elo }
POST /api/submissions            { Result object }           -> { ok, resultId }
GET  /api/leaderboard            ?limit=20                   -> [{ handle, elo, bestComposite }]
GET  /api/users/:id/progress                                 -> [{ challengeKey, bestComposite, cleared }]
-- Phase B --
POST /api/matchmaking/queue      { userId, topic, role }     -> { matchId | queued }
GET  /api/matches/:id                                        -> { match + results }
```

### 0.5 Git workflow
- Branches: `feat/engine` (P1), `feat/database` (P2), `feat/platform` (P3).
  **Never push to `main`.** Small, frequent PRs.
- Touchpoints are only the two contracts in §0.4 — agree them first, then work
  independently.
- **Must-ship for Round 2:** Person 1's Phase A working + scores persisted
  (Person 2) + a live leaderboard (Person 3). Matchmaking/ELO duels are stretch.

---

## 1. What this is

**Adversarial Algorithm Arena** — a night-themed, pixel-art wizarding game that
gamifies **secure / defensive coding**. Players write algorithms that must
survive **adversarial inputs**, not just pass happy-path tests.

- **Builder** (the player, defender): writes an algorithm to solve a challenge.
- **Breaker** (the attacker; currently an **AI Wizard** opponent): throws
  adversarial / worst-case inputs at the Builder's code.
- Each **castle** on the map = a data-structures / secure-coding **challenge**
  (Arrays, Trees, Graphs, DP).
- Combat: you write code, **CAST** it; correctness + resilience determine damage;
  reduce the opponent's HP to win.

**Round status:** We passed Round 1 (visual prototype). **Round 2 requires an
actually working prototype** — real code execution, real grading, real combat
outcomes. See §6–§7.

---

## 2. Current status snapshot

### ✅ Done (implemented & verified via `npm run build`)
- **Two-page app:** `index.html` (pixel landing page) + `play.html` (game),
  multi-page Vite build.
- **Landing page:** hero (uses `map.png` as background), how-it-works, duelists
  showcase, castles preview, footer; shared pixel theme; responsive.
- **MapScene:** full-map background, **4 clickable castle hotspots**, hover
  tooltip (name + difficulty), click → battle, pulsing markers, **`D` debug
  overlay** to visualise/tune hotspot zones.
- **BattleScene UI:** challenge/problem panel, **in-browser code editor** (DOM
  `<textarea>`), **CAST** button, **HP bars**, two duelists (Builder vs AI
  Wizard), spell FX, win/lose screen, back-to-map.
- **Asset pipeline:** background-removed + trimmed character sprites
  (`*_idle.png`), pixel-art **cursor** (default + hover), CRT overlay,
  fit-to-window scaling (`Scale.FIT` into an aspect-locked container).
- **BootScene:** asset loading with a progress bar.
- **Real grading (all 4 castles):** Web Worker sandbox runs player code →
  PASS/WRONG/TLE/CRASH → 4-axis score → damage, wired into `BattleScene.onCast()`.
- **Docs:** `README.md`, `docs/SYSTEM_ARCHITECTURE.md`.

### 🚧 Partial
- **Resilience radar:** per-cast feedback is textual; a graphical radar is TODO.
- **Debug log:** a `console.log('[grade]', …)` remains in `onCast` for testing \u2014
  remove before the final build.

### ❌ Not started
- Real **code execution / sandbox** (client Web Worker now; Docker later).
- **Scoring engine** (verdict×category matrix → resilience radar → score).
- **Matchmaking** (async pairing, ELO, queue).
- **Breaker role** (humans submitting adversarial inputs).
- **Auth, persistence, backend services.**
- **Multi-language** support, progression/leaderboards.

---

## 3. Run it

Requires **Node 18+**.

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173 (opens automatically)
npm run build    # production build → dist/ (index.html + play.html)
npm run preview  # preview the production build
```

In-game: on the map, **hover** a castle for its name, **click** to enter, press
**`D`** to toggle hotspot debug boxes. In battle, type code → **CAST SPELL**;
**← MAP** to return.

---

## 4. Repository structure

```
.
├── index.html                  # LANDING page (pixel theme, hero uses map.png)
├── play.html                   # GAME page (mounts Phaser; HOME link back)
├── vite.config.js              # multi-page build (index.html + play.html), base './'
├── package.json                # phaser + vite; scripts: dev / build / preview
├── README.md                   # human-facing project readme
├── docs/
│   └── SYSTEM_ARCHITECTURE.md  # full target architecture + diagram
├── public/assets/              # served at /assets/*
│   ├── map.png                 # 1402x1122 overworld map
│   ├── builder_idle.png        # player sprite (bg removed, trimmed)
│   ├── wizard_idle.png         # AI Wizard attacker sprite (bg removed)
│   ├── witch_idle.png          # spare variant (unused)
│   ├── cursor.png / cursor-hover.png   # pixel cursors
│   └── *.png (source sheets)   # original 1254x1254 reference sheets
└── src/
    ├── main.js                 # Phaser config: canvas 1402x1122, dom container,
    │                           #   Scale.FIT, scenes [Boot, Map, Battle]
    ├── config.js               # MAP_W/H, ASSETS, CURSOR, CASTLES (data-driven)
    └── scenes/
        ├── BootScene.js        # loads assets + builds glow texture → starts Map
        ├── MapScene.js         # map bg, castle hotspots, tooltip, click→Battle, D-debug
        └── BattleScene.js      # problem panel, code editor, CAST, HP, duelists, FX
```

---

## 5. Key data structures & extension points

### `CASTLES` (in `src/config.js`) — data-driven; add an entry, a hotspot appears
```js
{
  key: 'arrays',
  name: 'CASTLE OF ARRAYS',
  diff: '★☆☆',
  color: 0x4ea3ff,
  opponent: 'wizard',                  // 'wizard' | 'witch'
  zone: { x, y, w, h },                // hotspot in MAP pixels (tune with 'D')
  prompt: '…flavor shown in battle…',
  challenge: '…problem statement text…'
}
```

### The grading hook — `BattleScene.onCast()`
This is where Round 2 work plugs in. Today it does:
```js
const dmg = Phaser.Math.Between(22, 34);   // <-- STUB. Replace with real grading.
```
**Target:** read `this.editor.node.value`, run it against the castle's test
suite, get a verdict + metrics, compute damage from the score (see §6).

### Other
- `ASSETS` — asset keys/paths; `CURSOR` — cursor CSS strings.
- Sprites are scaled to a **uniform on-screen height** in `BattleScene.buildCharacters()`.

---

## 6. Feature roadmap (what we need for a working prototype)

Priorities for **Round 2** are ordered. Phase A makes combat genuinely work with
**no backend**; Phase B adds the real multiplayer/secure backend.

### Phase A — Real single-player grading (client-side, demo-ready) 🎯
- [x] **Contract + runner:** `src/challenges/schema.js` (Result/Challenge/Verdict
      shapes + `makeResult`) and `src/engine/runner.js` (real `runSolution` +
      shared pure `scoreResults`).
- [x] **Challenge definitions:** all four authored \u2014 Arrays (sort), Trees (max
      depth), Graphs (cycle detection), DP (LIS) \u2014 each with baseline + large
      adversarial inputs; registry in `src/challenges/index.js`. The problem panel
      shows a precise spec + concrete example I/O.
- [x] **Sandboxed execution:** player JS runs in a **Web Worker**
      (`src/engine/worker.js`), one test at a time, with a **hard per-test
      timeout** enforced by terminating a hung worker.
- [x] **Verdicts:** real `PASS / WRONG / TLE / CRASH` from the worker.
- [x] **Scoring matrix:** `scoreResults()` → 4 axes → composite → damage.
- [x] **Wired into `onCast()`:** damage comes from the grade; `showVerdict()`
      feedback ("TLE on adversarial input!", etc.); enemy retaliates harder when
      your composite score is low.
- [ ] **Resilience radar:** graphical radar on the result screen (per-cast
      textual breakdown is shown for now).

### Phase B — Backend, multiplayer, security
- [ ] **API gateway** (Node.js + Fastify) + **JWT** auth.
- [ ] **Docker sandbox runners** (seccomp/cgroups/gVisor, no-net, RO FS) for safe,
      multi-language execution → replaces the Web Worker for real matches.
- [ ] **Job queue** (Redis + BullMQ) between submission and execution.
- [ ] **Matchmaking service:** async store-and-replay pairing by
      `(topic, eloBucket, role)`, AI-Wizard bot fallback, ELO updates.
- [ ] **Breaker role:** UI + flow for submitting adversarial test inputs.
- [ ] **Persistence** (PostgreSQL): users, ratings, submissions, matches, results;
      **object store** for code artifacts/test sets.
- [ ] **Scoring engine** as a service (matrix → radar → ELO).

### Polish / cross-cutting
- [ ] Migrate to **TypeScript** before the codebase grows (shared verdict/score types).
- [ ] Walk/cast **animations** from the original sprite sheets.
- [ ] Deploy: **Vercel** (frontend) + Docker host (backend).

---

## 7. Architecture (target)

Full diagram + component details: **`docs/SYSTEM_ARCHITECTURE.md`**. Summary:

```
Client (Phaser) ──REST/WebSocket──▶ API Gateway (Fastify, JWT)
        ├─▶ Matchmaking Service (Redis pool; async pairing; bot fallback)
        ├─▶ Submission Service (defense artifacts + adversarial test sets)
        ▼
   Job Queue (Redis + BullMQ)
        ▼
   Sandbox Runner Pool (Docker: no-net, RO FS, seccomp, cgroups, gVisor)
        │  → verdict: PASS/WRONG/TLE/OOM/CRASH + runtime/memory metrics
        ▼
   Scoring Engine (verdict×category matrix → 4-axis radar → composite → ELO)
        ▼
   Data Layer (PostgreSQL + Redis + S3-compatible object store)
        └─▶ results pushed back to Client (HP, radar, ELO)
```

**Scoring axes:** Correctness · Efficiency/Complexity · Robustness ·
**Adversarial Resilience**. The matrix weights surviving adversarial inputs far
above baseline passes — points reward **defensive coding**.

**Async "store-and-replay":** a Builder's defense is persisted, so Breakers can
attack it later; Builder/Breaker timelines are decoupled.

---

## 8. Tech stack

### Implemented now (frontend)
- **Phaser 3** — game engine (scenes, input, tweens, rendering).
- **Vite** — dev server + multi-page build.
- **JavaScript (ES Modules)** — game logic.
- **HTML5 Canvas/WebGL + CSS** — rendering (`pixelArt`), CRT overlay, pixel cursor.
- **"Press Start 2P"** font; pixel-art assets.

### Target full product
- **Frontend:** Phaser 3, Vite, **TypeScript** (planned), HTML5 Canvas/CSS.
- **Backend:** **Node.js + Fastify**, **WebSocket (Socket.IO)**, **JWT**.
- **Data/queue:** **Redis** (+ **BullMQ**), **PostgreSQL**, S3-compatible storage.
- **Sandbox/execution:** **Docker** + **gVisor/seccomp/cgroups**; multi-language
  runtimes (Node, Python, …) or **Judge0**. Client-side **Web Worker** for the
  Phase-A demo.
- **DevOps:** Git + GitHub, GitHub Actions; **Vercel** (frontend), Docker on
  Fly.io / Render / AWS ECS (backend + sandbox pool).

**Headline six for slides:** Phaser 3 · Node.js (Fastify) · Docker · Redis ·
PostgreSQL · Vite (with **gVisor** as the secure-sandbox layer).

---

## 9. Conventions & guidance for AI agents

- **Stay data-driven:** new castles/challenges go in `config.js` / `src/challenges/`,
  not hard-coded into scenes.
- **Scenes:** keep gameplay in `BootScene` → `MapScene` → `BattleScene`. Register
  new scenes in `src/main.js`.
- **Assets** live in `public/assets/` and are referenced as `assets/<file>` (Phaser
  loader) or `/assets/<file>` (CSS/HTML). Sprites should be transparent PNGs.
- **Hotspot tuning:** press **`D`** on the map; adjust `zone` in `config.js`.
- **Security:** when adding code execution, **never `eval()` untrusted code on the
  main thread or server without isolation.** Phase A = Web Worker + timeout;
  Phase B = Docker sandbox. This is the core security premise of the project —
  do not shortcut it.
- **Verify changes:** run `npm run build` (and `npm run dev` for a visual check)
  before considering a task done.
- **Keep this file current:** when a feature moves from ❌/🚧 to ✅, update §2 and §6.

---

## 10. Glossary

- **Builder** — player/defender who writes the algorithm.
- **Breaker** — attacker who supplies adversarial inputs (AI Wizard for now).
- **Castle** — a challenge node on the map (one DSA/secure-coding topic).
- **Verdict** — outcome of a test run: PASS / WRONG / TLE / OOM / CRASH.
- **Adversarial resilience** — ability of a solution to survive worst-case,
  attacker-crafted inputs without failing.
