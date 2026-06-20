import Phaser from 'phaser';
import { ASSETS } from '../config.js';

// ============================================================
//  BootScene
//  Loads the real artwork (map + character sheets) and shows
//  a simple loading bar, then hands off to the MapScene.
// ============================================================
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.buildLoadingBar();

    // Full map background (native 1402 x 1122).
    this.load.image(ASSETS.map.key, ASSETS.map.file);

    // Cleaned, trimmed front-idle character poses (transparent bg).
    this.load.image(ASSETS.builder.key, ASSETS.builder.file);
    this.load.image(ASSETS.witch.key,   ASSETS.witch.file);
    this.load.image(ASSETS.wizard.key,  ASSETS.wizard.file);
  }

  create() {
    this.makeGlow();
    this.scene.start('Map');
  }

  // ---- minimal progress UI ----
  buildLoadingBar() {
    const { width: W, height: H } = this.scale;
    const cx = W / 2, cy = H / 2;

    this.add.text(cx, cy - 60, 'ADVERSARIAL ALGORITHM ARENA', {
      fontFamily: '"Press Start 2P"', fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(cx, cy - 24, 'summoning the realm\u2026', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffd166'
    }).setOrigin(0.5);

    const barW = 520, barH = 26;
    this.add.rectangle(cx, cy + 20, barW + 8, barH + 8, 0x000000)
      .setStrokeStyle(3, 0x4a4a7a);
    const fill = this.add.rectangle(cx - barW / 2, cy + 20, 1, barH, 0x4ea3ff)
      .setOrigin(0, 0.5);
    const pct = this.add.text(cx, cy + 58, '0%', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#9aa0c0'
    }).setOrigin(0.5);

    this.load.on('progress', (v) => {
      fill.width = Math.max(1, barW * v);
      pct.setText(Math.round(v * 100) + '%');
    });
  }

  // ---- radial glow texture reused by other scenes ----
  makeGlow() {
    if (this.textures.exists('glow')) return;
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    this.textures.addCanvas('glow', c);
  }
}
