import Phaser from 'phaser';
import { MAP_W, MAP_H, ASSETS, CASTLES, CURSOR } from '../config.js';

// ============================================================
//  MapScene
//  Point-and-click overworld. The map image fills the canvas;
//  each castle is an invisible interactive zone. Hovering shows
//  the castle's name; clicking enters its BattleScene.
//  Press D to toggle a debug overlay that draws the zones.
// ============================================================
export default class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  create() {
    this.input.setDefaultCursor(CURSOR.default);

    // --- map background, pinned to native resolution ---
    this.add.image(0, 0, ASSETS.map.key).setOrigin(0, 0).setDisplaySize(MAP_W, MAP_H);

    // subtle vignette so hotspots/tooltips pop a touch
    this.add.rectangle(0, 0, MAP_W, MAP_H, 0x05050f, 0.10).setOrigin(0, 0);

    // --- title banner ---
    this.add.text(MAP_W / 2, 18, 'ADVERSARIAL ALGORITHM ARENA', {
      fontFamily: '"Press Start 2P"', fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5, 0).setStroke('#1a1030', 8).setShadow(0, 3, '#000', 6).setDepth(100);
    this.add.text(MAP_W / 2, 52, 'Choose a castle to lay siege to', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffd166'
    }).setOrigin(0.5, 0).setShadow(0, 2, '#000', 4).setDepth(100);

    // --- tooltip (hidden until hover) ---
    this.tip = this.add.container(0, 0).setDepth(500).setVisible(false);
    this.tipBg = this.add.rectangle(0, 0, 10, 40, 0x080818, 0.95)
      .setOrigin(0.5, 1).setStrokeStyle(3, 0xffffff);
    this.tipName = this.add.text(0, -30, '', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    this.tipDiff = this.add.text(0, -12, '', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffd166'
    }).setOrigin(0.5, 0.5);
    this.tip.add([this.tipBg, this.tipName, this.tipDiff]);

    // --- castle hotspots ---
    this.debug = false;
    this.zoneGfx = this.add.graphics().setDepth(400).setVisible(false);

    CASTLES.forEach((c) => this.addHotspot(c));

    // pulsing markers so players know where to click
    this.markers = CASTLES.map((c) => this.addMarker(c));

    // --- debug toggle ---
    this.input.keyboard.on('keydown-D', () => this.toggleDebug());

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  addHotspot(c) {
    const { x, y, w, h } = c.zone;
    const zone = this.add.zone(x, y, w, h).setOrigin(0, 0)
      .setInteractive({ cursor: CURSOR.pointer });

    zone.on('pointerover', () => this.showTip(c));
    zone.on('pointerout',  () => this.tip.setVisible(false));
    zone.on('pointerdown', () => this.enter(c));

    c._zone = zone;
  }

  addMarker(c) {
    const { x, y, w, h } = c.zone;
    const mk = this.add.image(x + w / 2, y + h / 2, 'glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(c.color).setScale(1.6).setAlpha(0.35).setDepth(50);
    this.tweens.add({
      targets: mk, alpha: 0.7, scale: 2.1,
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });
    return mk;
  }

  showTip(c) {
    const { x, y, w } = c.zone;
    this.tipName.setText(c.name);
    this.tipDiff.setText(c.diff);
    const tw = Math.max(this.tipName.width, this.tipDiff.width) + 40;
    this.tipBg.width = tw;
    this.tipBg.setStrokeStyle(3, c.color);
    this.tip.setPosition(x + w / 2, y - 6).setVisible(true);
  }

  enter(c) {
    this.tip.setVisible(false);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Battle', { castle: c.key });
    });
  }

  toggleDebug() {
    this.debug = !this.debug;
    this.zoneGfx.setVisible(this.debug).clear();
    if (!this.debug) return;
    CASTLES.forEach((c) => {
      const { x, y, w, h } = c.zone;
      this.zoneGfx.fillStyle(c.color, 0.25).fillRect(x, y, w, h);
      this.zoneGfx.lineStyle(2, c.color, 1).strokeRect(x, y, w, h);
    });
  }
}
