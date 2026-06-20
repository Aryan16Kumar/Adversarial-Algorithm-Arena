// ============================================================
//  Shared config for the point-and-click Arena
//  - Map is a single background image (assets/map.png)
//  - Each castle is a clickable hotspot defined in MAP-PIXEL
//    coordinates (the map's native resolution below).
// ============================================================

// Native pixel size of assets/map.png. The game canvas uses
// these dimensions so hotspot coordinates are 1:1 with the art.
export const MAP_W = 1402;
export const MAP_H = 1122;

// ---- Asset keys + source files ----
export const ASSETS = {
  map:     { key: 'map',     file: 'assets/map.png' },
  // Background-removed, trimmed front-idle poses (cleaned from the
  // original 1254x1254 reference sheets). Used for the battle duelists.
  builder: { key: 'builder', file: 'assets/builder_idle.png' },
  witch:   { key: 'witch',   file: 'assets/witch_idle.png' },
  wizard:  { key: 'wizard',  file: 'assets/wizard_idle.png' }
};

// ---- Pixel-art cursors (served from public/assets) ----
export const CURSOR = {
  default: "url('/assets/cursor.png') 0 0, auto",
  pointer: "url('/assets/cursor-hover.png') 0 0, pointer"
};

// ------------------------------------------------------------
//  Castles — each is a clickable zone over the map art.
//  zone = { x, y, w, h } rectangle in MAP-PIXEL coordinates
//  (top-left origin). Tune these with the in-game debug
//  overlay (press D on the map to visualise the zones).
// ------------------------------------------------------------
export const CASTLES = [
  {
    key: 'arrays',
    name: 'CASTLE OF ARRAYS',
    diff: '\u2605\u2606\u2606',
    color: 0x4ea3ff,
    opponent: 'wizard',
    zone: { x: 900, y: 40, w: 384, h: 320 },
    prompt: 'The Array Keep stands tall. Sort the adversary\u2019s shuffled legion before they breach the gate.',
    challenge: 'Return the given array sorted in non-decreasing order.\nBeware inputs crafted to force worst-case behaviour.'
  },
  {
    key: 'trees',
    name: 'TOWER OF TREES',
    diff: '\u2605\u2605\u2606',
    color: 0x4fd17a,
    opponent: 'wizard',
    zone: { x: 72, y: 372, w: 300, h: 196 },
    prompt: 'Cross the bridge to the Tree Tower. Mind your recursion depth, lest the stack topple.',
    challenge: 'Given the root of a binary tree, return its maximum depth.\nWatch for degenerate, list-like trees.'
  },
  {
    key: 'graphs',
    name: 'GRAPH CATACOMBS',
    diff: '\u2605\u2605\u2605',
    color: 0xb07bff,
    opponent: 'wizard',
    zone: { x: 52, y: 706, w: 224, h: 224 },
    prompt: 'The violet Catacombs hum with cycles. Traverse the dark halls without falling into a loop.',
    challenge: 'Given a directed graph, determine whether it contains a cycle.\nDense edges hide resource-exhaustion traps.'
  },
  {
    key: 'dp',
    name: 'CITADEL OF DP',
    diff: '\u2605\u2605\u2605',
    color: 0xffd166,
    opponent: 'wizard',
    zone: { x: 936, y: 848, w: 256, h: 220 },
    prompt: 'The banner Citadel guards optimal substructure. Build your table stone by stone.',
    challenge: 'Compute the length of the longest increasing subsequence.\nNaive recursion will be exploited \u2014 memoise.'
  }
];
