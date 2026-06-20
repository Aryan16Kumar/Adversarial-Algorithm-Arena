import Phaser from 'phaser';
import { TILE, TILE_COUNT, T } from '../config.js';

// ============================================================
//  BootScene
//  Generates all textures procedurally so the game runs with
//  ZERO external assets. To use real art (Kenney Tiny Town,
//  your own wizard PNG), see the clearly marked hooks below
//  and the README.
// ============================================================
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // ---------- HOOK: real Kenney Tiny Town tileset ----------
    // 1) Download Tiny Town from kenney.nl, copy its
    //    `tilemap_packed.png` to  arena/public/assets/
    // 2) Uncomment the next line. The Overworld will auto-detect
    //    the 'tiles' texture and skip the procedural one.
    //    (Then set Tiny Town indices in config.js — see README.)
    // this.load.image('tiles', 'assets/tilemap_packed.png');

    // ---------- HOOK: your own character sprite ----------
    // Drop your PNG in arena/public/assets/ and uncomment:
    // this.load.image('hero', 'assets/your-character.png');
  }

  create() {
    if (!this.textures.exists('tiles')) this.makeTileset();
    if (!this.textures.exists('hero'))  this.makeHero();
    this.makeGlow();
    this.scene.start('Overworld');
  }

  // ----- small canvas helper -----
  canvasTex(key, w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { c, ctx, key };
  }

  // ============ procedural 16x16 tileset (one row) ============
  makeTileset() {
    const { c, ctx, key } = this.canvasTex('tiles', TILE_COUNT * TILE, TILE);
    for (let i = 0; i < TILE_COUNT; i++) this.drawTile(ctx, i * TILE, i);
    this.textures.addCanvas(key, c);
  }

  drawTile(ctx, ox, idx) {
    const fill = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(ox + x, y, w, h); };
    // grass base used by most tiles
    fill(0, 0, 16, 16, '#4f9a43');
    fill(2, 5, 2, 2, '#3f7d34'); fill(10, 3, 2, 2, '#3f7d34');
    fill(6, 11, 2, 2, '#5cad4e'); fill(13, 9, 2, 2, '#5cad4e');

    switch (idx) {
      case T.FLOWER:
        fill(3, 4, 2, 2, '#ffe14d'); fill(11, 6, 2, 2, '#ff6d8a');
        fill(7, 11, 2, 2, '#ffffff'); fill(12, 12, 2, 2, '#7bd0ff');
        break;
      case T.PATH:
        fill(0, 0, 16, 16, '#b58a52');
        fill(3, 4, 2, 2, '#a07a45'); fill(9, 7, 2, 2, '#c99a62');
        fill(6, 11, 2, 2, '#a07a45'); fill(12, 3, 2, 2, '#c99a62');
        break;
      case T.WATER:
        fill(0, 0, 16, 16, '#3f6fae');
        fill(2, 5, 5, 1, '#5a86c2'); fill(8, 10, 5, 1, '#5a86c2');
        fill(4, 12, 4, 1, '#345f97'); fill(10, 3, 4, 1, '#345f97');
        break;
      case T.TREE:
        fill(7, 11, 3, 5, '#6b4a2b');                 // trunk
        fill(3, 2, 10, 9, '#2f6b35');                  // canopy
        fill(2, 5, 12, 5, '#3f8044');
        fill(5, 3, 6, 4, '#54a05a');                   // highlight
        fill(4, 4, 2, 2, '#62b567');
        break;
      case T.STONE:
        fill(0, 0, 16, 16, '#6f6f86');
        fill(0, 5, 16, 1, '#565670'); fill(0, 11, 16, 1, '#565670');
        fill(7, 0, 1, 5, '#565670'); fill(3, 6, 1, 5, '#565670'); fill(11, 12, 1, 4, '#565670');
        fill(1, 1, 4, 3, '#84849c'); fill(9, 7, 4, 3, '#84849c');
        break;
      case T.BUSH:
        fill(2, 6, 12, 8, '#2f6b35'); fill(4, 4, 8, 6, '#3f8044');
        fill(5, 5, 3, 2, '#54a05a');
        break;
      // GRASS = default (already drawn)
    }
  }

  // ============ procedural wizard (24x32) ============
  makeHero() {
    const { c, ctx, key } = this.canvasTex('hero', 24, 32);
    const f = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
    // hat (narrowing rows)
    f(10, 0, 4, 2, '#3a2a6b'); f(8, 2, 8, 2, '#3a2a6b'); f(6, 4, 12, 3, '#3a2a6b');
    f(4, 9, 16, 3, '#2a1d52');                 // brim
    f(11, 2, 3, 3, '#ffd166');                 // hat star
    // face
    f(7, 12, 10, 8, '#e8c9a0');
    f(9, 15, 2, 2, '#222'); f(14, 15, 2, 2, '#222'); // eyes
    f(10, 18, 4, 1, '#b98c63');                // mouth
    // robe (widening)
    f(7, 20, 10, 3, '#3a2a6b'); f(5, 23, 14, 4, '#3a2a6b'); f(3, 27, 18, 5, '#34245c');
    f(11, 20, 2, 12, '#ffd166');               // glowing trim
    // wand + spark
    f(18, 18, 6, 2, '#8a5a2b'); f(22, 16, 3, 3, '#ffd166');
    this.textures.addCanvas(key, c);
  }

  // ============ radial glow (for windows / lanterns) ============
  makeGlow() {
    if (this.textures.exists('glow')) return;
    const { c, ctx, key } = this.canvasTex('glow', 128, 128);
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    this.textures.addCanvas(key, c);
  }
}
