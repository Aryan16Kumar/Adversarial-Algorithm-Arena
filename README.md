# Adversarial Algorithm Arena — Builder Track (Phaser 3 + Vite)

A night-themed wizarding pixel-RPG overworld. The player explores a map and
approaches themed castles (**Castle of Arrays**, **Tower of Trees**, **Graph
Catacombs**), each gating a DSA / secure-coding challenge.

> This is the **Builder track** overworld — a front-end visual prototype built
> for hackathon Round 1 screenshots. It runs with **zero external assets**
> (tiles + character are generated procedurally), and is pre-wired to drop in
> real art.

## Run it

```bash
cd arena
npm install
npm run dev
```

Vite opens `http://localhost:5173`. Move with **arrow keys / WASD**. Walk up to
a castle to trigger the `[E] to enter` prompt and the matching quest dialogue —
that framed shot is your Round 1 screenshot.

Build a static bundle (for an optional deploy link) with `npm run build`
(output in `dist/`, deployable to GitHub Pages / Netlify / itch.io).

## Swap in your own character

1. Drop `your-character.png` into `public/assets/`.
2. In `src/scenes/BootScene.js`, uncomment:
   ```js
   this.load.image('hero', 'assets/your-character.png');
   ```
That's it — movement, the lantern glow, and the interact prompt keep working.

---

## How to make the map with Kenney "Tiny Town"

You have two options. **Option A (code map)** is what ships here and is fastest
for a hackathon. **Option B (Tiled)** is the "proper" pipeline if you want to
hand-paint the world.

### Get the tileset
1. Download **Tiny Town** from <https://kenney.nl/assets/tiny-town> (free, CC0).
2. Inside the pack, find `Tilemap/tilemap_packed.png` (16×16 tiles, no spacing).
3. Copy it to `arena/public/assets/tilemap_packed.png`.
4. In `src/scenes/BootScene.js`, uncomment:
   ```js
   this.load.image('tiles', 'assets/tilemap_packed.png');
   ```
   The Overworld auto-detects the `tiles` texture and skips the procedural one.
5. Update the tile indices in `src/config.js` to Tiny Town's layout. Tiny Town
   is **12 tiles per row**, so index = `row * 12 + col` (0-based). Open the PNG,
   count to the tile you want, and set e.g. `GRASS`, `PATH`, `TREE`, etc.
   (Tip: keep `COLLIDE` pointing at the water/house tiles you don't want to walk
   through.)

### Option A — generate the map in code (current setup)
`generateMap()` in `config.js` builds the 2D tile array (grass base, winding
path, pond, scattered trees, cleared castle plazas). Edit that function to
reshape the world. No external tools needed.

### Option B — paint the map in Tiled, load the JSON
1. Install **Tiled** (free): <https://www.mapeditor.org/>.
2. `New Map` → Orthogonal, tile size **16×16**, e.g. 80×50 tiles.
3. `New Tileset` → "Based on Tileset Image" → choose `tilemap_packed.png`,
   tile width/height **16**, margin/spacing **0**. Name it `tiles`.
4. Paint your layers (a ground layer, a decoration layer). Add an
   **object layer** with point objects named `arrays`, `trees`, `graphs` to mark
   castle spots if you like.
5. `File → Export As…` → **JSON** → save to `arena/public/assets/map.json`.
6. In `BootScene.preload()` load both:
   ```js
   this.load.image('tiles', 'assets/tilemap_packed.png');
   this.load.tilemapTiledJSON('map', 'assets/map.json');
   ```
7. In `OverworldScene.create()`, replace the procedural block with:
   ```js
   const map = this.make.tilemap({ key: 'map' });
   const tileset = map.addTilesetImage('tiles', 'tiles'); // (Tiled name, Phaser key)
   const ground = map.createLayer('Ground', tileset, 0, 0);
   const deco   = map.createLayer('Decoration', tileset, 0, 0);
   deco.setCollisionByExclusion([-1]); // collide with any painted deco tile
   this.physics.add.collider(this.player, deco);
   ```
   (Match the layer names to what you created in Tiled.)

### Which should you use for Round 1?
**Option A.** You only need a good screenshot — the code map already produces a
clean night overworld with castles. Save Tiled for when you want a hand-crafted
world in Round 2.

---

## Project structure
```
arena/
  index.html              # Vite entry + CRT scanline overlay + pixel font
  vite.config.js
  src/
    main.js               # Phaser game config, waits for font load
    config.js             # world size, tile indices, castle defs, map generator
    scenes/
      BootScene.js        # generates procedural tileset / wizard / glow textures
      OverworldScene.js   # map, castles, player, night, HUD, dialogue, movement
  public/assets/          # drop tilemap_packed.png / your-character.png here
```

## Roadmap (Round 2)
- Attacker map (dark dungeon palette, exploit-themed castles)
- Track-select ("sorting") screen
- Challenge screen: code editor + sandbox verdict (PASS / CRASH / TLE / OOM) + resilience radar
- Backend: matchmaking, sandboxed execution, scoring matrix, AI hint assistant
