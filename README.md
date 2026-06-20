# Adversarial Algorithm Arena (Phaser 3 + Vite)

A night-themed wizarding pixel game. You stand before a hand-painted overworld
map dotted with castles. **Hover** a castle to see its name, **click** it to lay
siege — entering a per-castle **coding duel** where you write a spell (code) and
cast it at your opponent while HP bars tick down.

Each castle is themed around a data-structures / secure-coding challenge:

| Castle               | Theme   | Difficulty |
| -------------------- | ------- | ---------- |
| **Castle of Arrays** | Arrays  | ★☆☆        |
| **Tower of Trees**   | Trees   | ★★☆        |
| **Graph Catacombs**  | Graphs  | ★★★        |
| **Citadel of DP**    | DP      | ★★★        |

> Visual prototype. The combat currently lands fixed damage per cast — real
> code grading (run tests, scale damage by correctness / performance) is a
> clearly marked hook in `BattleScene.onCast()`.

## Run it

```bash
npm install
npm run dev
```

Vite serves the game at `http://localhost:5173`.

- **Map:** hover a castle for its name, click to enter. Press **`D`** to toggle a
  debug overlay that draws the clickable hotspot zones (useful for tuning).
- **Battle:** type your solution in the code editor, hit **CAST SPELL** to attack.
  Reduce the opponent to 0 HP to win. Use **← MAP** to return.
- The whole map and battle screen scale to fit your window with no cropping, and
  the cursor is a custom pixel-art arrow (gold sparkle variant over clickables).

Build a static bundle with `npm run build` (output in `dist/`, deployable to
GitHub Pages / Netlify / itch.io). Preview the build with `npm run preview`.

## Assets

Pixel art lives in `public/assets/`. The originals are AI-generated reference
sheets; the game renders cleaned, background-removed cut-outs derived from them.

| File                    | Used as                  | Notes                                |
| ----------------------- | ------------------------ | ------------------------------------ |
| `map.png`               | overworld map background | 1402×1122; canvas is sized to match  |
| `builder_idle.png`      | player (Builder)         | cleaned front-idle, transparent bg   |
| `wizard_idle.png`       | attacker (AI Wizard)     | cleaned front-idle, transparent bg   |
| `witch_idle.png`        | spare variant (unused)   | cleaned front-idle, transparent bg   |
| `cursor.png`            | default pixel cursor     | arrow, hotspot 0,0                   |
| `cursor-hover.png`      | hover pixel cursor       | gold sparkle arrow                   |
| `castle sprite.png`     | reference only           | not loaded                           |
| `builder sprite.png`, `Witch.png`, `Ai wizards sprite.png` | source sheets | 1254×1254, 5 cols × 4 rows (front / side / back / casting) |

Every duel is **Builder** (player) vs the **AI Wizard** (attacker). The
`*_idle.png` cut-outs were extracted from the source sheets — the near-white
background is flood-filled to transparent, then trimmed to the figure.

### Swapping art

- **Map:** replace `public/assets/map.png`. If the resolution differs, update
  `MAP_W` / `MAP_H` in `src/config.js`, then re-tune each castle's `zone`
  (press `D` in the map to visualise the boxes).
- **Characters:** replace the matching `*_idle.png` (transparent background
  recommended) and point `ASSETS` in `src/config.js` at it. Battle sprites are
  auto-scaled to a uniform height, so the source dimensions aren't critical.
- **Cursor:** replace `cursor.png` / `cursor-hover.png`, or edit the `CURSOR`
  strings in `src/config.js`.

## Adding / editing castles

Everything is data-driven from the `CASTLES` array in `src/config.js`. Each
entry defines the clickable zone (in **map pixels**, top-left origin), name,
difficulty, theme color, opponent, and challenge text:

```js
{
  key: 'arrays',
  name: 'CASTLE OF ARRAYS',
  diff: '★☆☆',
  color: 0x4ea3ff,
  opponent: 'wizard',                 // 'witch' | 'wizard'
  zone: { x: 900, y: 40, w: 384, h: 320 },
  prompt: '…flavor text shown in the battle panel…',
  challenge: '…the problem statement…'
}
```

Add an object to the array and a new hotspot appears on the map automatically.

## Project structure

```
.
├── index.html              # Vite entry + CRT scanline overlay + pixel font
├── vite.config.js
├── public/
│   └── assets/             # map.png, cleaned *_idle.png cut-outs, cursors, source sheets
└── src/
    ├── main.js             # Phaser config (canvas size, DOM container, scenes)
    ├── config.js           # map size, asset keys, cursors, CASTLES data
    └── scenes/
        ├── BootScene.js    # loads art with a progress bar, builds glow texture
        ├── MapScene.js     # map background, castle hotspots, hover tooltip, click
        └── BattleScene.js  # coding + attack UI, HP bars, duelists, spell FX
```

## Tech

- **[Phaser 3](https://phaser.io/)** — rendering, scenes, input, tweens.
- **[Vite](https://vitejs.dev/)** — dev server + build.
- **"Press Start 2P"** pixel font (Google Fonts) + a CSS CRT scanline overlay.
- `pixelArt: true` and DOM container enabled (for the in-game code editor).
- `Scale.FIT` into an aspect-ratio-locked container (whole image, no crop) and a
  custom pixel-art cursor applied site-wide and on interactive objects.

## Roadmap

- **Landing page** in the same pixel theme (hero, features, character/castle
  showcase). The pixelated cursor it would share is already in place.
- **Real challenge grading:** run submitted code against test cases in a
  sandbox; scale damage by correctness, time, and memory (PASS / CRASH / TLE /
  OOM verdicts).
- Walk/cast **animations** sliced from the character sheets.
- Progression: track scores, ELO, and unlocked castles.
- Backend: matchmaking, sandboxed execution, AI hint assistant.
```

