# System Architecture — Adversarial Algorithm Arena

A pixel-art wizarding arena where **Builders** defend algorithms and **Breakers**
attack them with adversarial inputs. This document describes the end-to-end
system, from a click in the browser to a sandboxed verdict and a ranked score.

> **Status:** The **frontend arena is implemented** (Phaser 3 + Vite — landing
> page, point-and-click map, castle duels, in-browser code editor, HP combat,
> verdict hooks). The **matchmaking + sandbox + scoring backend** described here
> is the designed system; the grading integration point is already stubbed in
> `BattleScene.onCast()`.

---

## 1. High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT (browser)                                                     │
│  Landing (index.html)  →  Game (play.html)                            │
│  Phaser 3 Arena: MapScene → BattleScene (code editor + CAST)          │
└───────────────┬───────────────────────────────┬──────────────────────┘
                │ REST (submit / auth)           │ WebSocket (queue / live)
                ▼                                 ▼
        ┌───────────────────────────────────────────────┐
        │  API GATEWAY  (Node.js / Fastify) + JWT auth    │
        └───────┬───────────────────────┬────────────────┘
                │                        │
                ▼                        ▼
   ┌───────────────────────┐   ┌──────────────────────────┐
   │  MATCHMAKING SERVICE   │   │  SUBMISSION SERVICE       │
   │  pool by (topic, ELO,  │   │  stores defense artifacts │
   │  role); async pairing; │   │  + adversarial test sets  │
   │  bot fallback          │   └────────────┬─────────────┘
   └───────────┬────────────┘                │
               │ enqueue run jobs            │
               ▼                             ▼
         ┌───────────────────────────────────────────┐
         │  JOB QUEUE  (Redis + BullMQ)                │
         └───────────────────┬───────────────────────┘
                             │ dispatch
                             ▼
         ┌───────────────────────────────────────────┐
         │  SANDBOX RUNNER POOL  (Docker, ephemeral)   │
         │  no-net · read-only FS · non-root ·         │
         │  seccomp · cgroups (CPU / mem / time) ·      │
         │  gVisor (optional)                          │
         │  → verdict: PASS / WRONG / TLE / OOM / CRASH │
         │    + runtime & memory metrics                │
         └───────────────────┬───────────────────────┘
                             │ raw results
                             ▼
         ┌───────────────────────────────────────────┐
         │  SCORING ENGINE                              │
         │  verdict × category matrix → 4-axis radar →  │
         │  composite score → ELO update                │
         └───────────────────┬───────────────────────┘
                             ▼
         ┌───────────────────────────────────────────┐
         │  DATA LAYER                                  │
         │  PostgreSQL: users, ratings, submissions,    │
         │    matches, results                          │
         │  Redis: matchmaking pool, queue, cache       │
         │  Object store: code artifacts / test sets    │
         └───────────────────┬───────────────────────┘
                             │ result push (WebSocket)
                             ▼
                   back to CLIENT (HP bars, radar, ELO)
```

---

## 2. Components

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| Client | **Phaser 3 Arena** | Landing → game; `MapScene` (pick a castle) → `BattleScene` (write & CAST code). Renders HP bars, spell FX, results. |
| Edge | **API Gateway** (Node.js / Fastify) | Auth (JWT), request routing, rate limiting, REST + WebSocket entry. |
| Core | **Matchmaking Service** | Async store-and-replay pairing; pools by `(topic, eloBucket, role)`; anti-rematch; AI-Wizard bot fallback on timeout. |
| Core | **Submission Service** | Persists Builder "defense artifacts" and Breaker adversarial test sets; versioning. |
| Infra | **Job Queue** (Redis + BullMQ) | Decouples submission from execution; retries, backpressure, one job per (defense × test set). |
| Execution | **Sandbox Runner Pool** (Docker) | Runs untrusted code in isolated, ephemeral containers; enforces limits; emits verdicts + metrics. |
| Core | **Scoring Engine** | Applies the verdict×category matrix, builds the 4-axis resilience radar, computes composite score and ELO delta. |
| Data | **PostgreSQL** | Durable state: users, ratings, submissions, matches, results. |
| Data | **Redis** | Real-time matchmaking pool, job queue, cache. |
| Data | **Object Store (S3-compatible)** | Code artifacts and adversarial test sets. |

---

## 3. Match lifecycle (data flow)

1. **Queue** — Client joins via WebSocket; enters the Redis matchmaking pool keyed
   by `(topic, eloBucket, role)`.
2. **Pair** — Matchmaker pops a compatible Builder/Breaker pair (or an AI-Wizard
   bot if none within the timeout) and creates a `match` record.
3. **Dispatch** — Match fans out into **sandbox jobs** (one run per defense ×
   adversarial test set) on the BullMQ queue.
4. **Execute** — Sandbox runners spin up ephemeral Docker containers, run the
   code under hard limits, and return a verdict (`PASS / WRONG / TLE / OOM /
   CRASH`) plus runtime and memory metrics.
5. **Score** — The scoring engine applies the matrix, produces the resilience
   radar + composite score, and updates ELO ratings.
6. **Return** — Results are persisted to PostgreSQL and pushed to clients over
   WebSocket; the arena animates HP, shows the radar, and reflects the new ELO.

### Why async (store-and-replay)
A Builder's defense is **persisted**, so Breakers can be matched against it later
— Builder and Breaker timelines are decoupled, and one strong defense can be
attacked by many Breakers, generating rich resilience data.

---

## 4. Sandbox isolation

Every submission runs in a **fresh, ephemeral Docker container**, destroyed after
the run. Hardening:

- **No network** access.
- **Read-only filesystem** (writable scratch tmpfs only).
- **Non-root** user.
- **seccomp** syscall filtering.
- **cgroups** resource caps: CPU shares, **memory limit**, **wall-clock timeout**.
- **gVisor** (optional) for kernel-level isolation.

Resource limits map directly to deterministic verdicts: a timeout → **TLE**, an
out-of-memory kill → **OOM**, a runtime fault → **CRASH**.

---

## 5. Scoring model (summary)

Submissions are scored on four axes, surfaced as a **resilience radar**:

1. **Correctness** — passes baseline functional tests.
2. **Efficiency / Complexity** — runtime & memory vs input size.
3. **Robustness** — survives edge / boundary / malformed inputs.
4. **Adversarial Resilience** — withstands Breaker-crafted worst-case inputs
   (hash-flood collisions, deep recursion, pathological data) without TLE / OOM /
   CRASH.

The **verdict × test-category matrix** weights adversarial survival far above
baseline passes, so points flow to **defensive coding** (input validation,
bounds checks, iterative over deep recursion, collision-resistant hashing).

```
Composite = w1·correctness + w2·efficiency + w3·robustness + w4·adversarialResilience
```

---

## 6. Tech stack

**Frontend (implemented)**
- Vite (multi-page build: `index.html` landing + `play.html` game)
- Phaser 3 (scenes, input, tweens), HTML5 Canvas / WebGL (`pixelArt`)
- JavaScript (ES Modules), HTML + CSS (CRT overlay, fit-to-window, pixel cursor)
- "Press Start 2P" font; pixel-art assets; in-browser editor via DOM `<textarea>`

**Backend & services (designed)**
- Node.js + Fastify/Express; WebSocket (Socket.IO / ws)
- Redis (matchmaking pool + cache); BullMQ (job queue)
- PostgreSQL (durable state); S3-compatible object store (artifacts)
- JWT (auth)

**Execution & isolation (designed)**
- Docker (ephemeral runners); gVisor, seccomp, cgroups; multi-language runtimes
  (Node, Python, …); Judge0 as an off-the-shelf alternative

**DevOps & delivery**
- Git + GitHub; GitHub Actions (CI/CD)
- Vercel (frontend hosting); Docker on Fly.io / Render / AWS ECS (backend +
  sandbox pool); logging & metrics for observability
