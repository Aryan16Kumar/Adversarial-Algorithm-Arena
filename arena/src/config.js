// ============================================================
//  Shared config: world size, tile indices, castles, map gen
// ============================================================

export const TILE = 16;        // pixel size of one tile
export const MAP_W = 80;       // map width  in tiles  (80 * 16 = 1280 px)
export const MAP_H = 50;       // map height in tiles  (50 * 16 =  800 px)

// ---- Tile indices for the PROCEDURAL tileset (generated in BootScene) ----
// When you switch to Kenney Tiny Town, replace these with Tiny Town indices
// (see README) — nothing else in the code needs to change.
export const T = {
  GRASS:  0,
  FLOWER: 1,
  PATH:   2,
  WATER:  3,
  TREE:   4,
  STONE:  5,
  BUSH:   6
};
export const TILE_COUNT = 7;           // how many tiles to generate
export const COLLIDE = [T.WATER, T.STONE]; // tiles the player can't walk through

// ---- Castle definitions (topic = DSA theme) ----
export const CASTLES = [
  { key: 'arrays', name: 'CASTLE OF ARRAYS', diff: '\u2605\u2605\u2606',
    color: 0x4ea3ff, hint: 'Beware adversarial inputs that force worst-case sorting...',
    tx: 14, ty: 32 },
  { key: 'trees',  name: 'TOWER OF TREES',  diff: '\u2605\u2605\u2605',
    color: 0x4fd17a, hint: 'Mind your recursion depth, lest the Breakers topple your stack...',
    tx: 44, ty: 13 },
  { key: 'graphs', name: 'GRAPH CATACOMBS', diff: '\u2605\u2605\u2605',
    color: 0xb07bff, hint: 'Cycles and dense edges hide resource-exhaustion traps...',
    tx: 63, ty: 35 }
];

// ------------------------------------------------------------
//  Procedurally generate the overworld as a 2D index array.
//  Grass base + a winding path + a pond + scattered trees,
//  with a clear, path-connected plaza around each castle.
// ------------------------------------------------------------
export function generateMap() {
  const grid = [];
  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) {
      row.push(Math.random() < 0.05 ? T.FLOWER : T.GRASS);
    }
    grid.push(row);
  }

  // Pond (top-left-ish)
  const pcx = 24, pcy = 9, prx = 7, pry = 4;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const d = ((x - pcx) / prx) ** 2 + ((y - pcy) / pry) ** 2;
      if (d < 1) grid[y][x] = T.WATER;
      else if (d < 1.4) grid[y][x] = T.BUSH;
    }
  }

  // Winding main path across the map
  for (let x = 0; x < MAP_W; x++) {
    const py = Math.round(28 + Math.sin(x * 0.14) * 6 + Math.cos(x * 0.05) * 3);
    for (let dy = 0; dy < 2; dy++) {
      const yy = py + dy;
      if (yy >= 0 && yy < MAP_H && grid[yy][x] !== T.WATER) grid[yy][x] = T.PATH;
    }
  }

  // Scatter trees on grass
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (grid[y][x] === T.GRASS && Math.random() < 0.07) grid[y][x] = T.TREE;
    }
  }

  // Clear a plaza around each castle + a little approach path
  for (const c of CASTLES) {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = c.tx + dx, y = c.ty + dy;
        if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) grid[y][x] = T.GRASS;
      }
    }
    // approach path going downward from the castle door
    for (let dy = 0; dy <= 6; dy++) {
      const y = c.ty + dy;
      if (y < MAP_H) grid[y][c.tx] = T.PATH;
    }
  }

  return grid;
}
