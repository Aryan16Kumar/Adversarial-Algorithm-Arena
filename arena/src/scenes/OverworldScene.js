import Phaser from 'phaser';
import { TILE, MAP_W, MAP_H, COLLIDE, CASTLES, generateMap } from '../config.js';

const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;
const SPEED = 130;
const IDLE_TEXT = 'Welcome, young Builder. Seek a castle and defend your algorithm against the Breakers\u2019 dark arts...';

export default class OverworldScene extends Phaser.Scene {
  constructor() { super('Overworld'); }

  create() {
    // ---------- Tilemap ----------
    const grid = generateMap();
    const map = this.make.tilemap({ data: grid, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles');
    const layer = map.createLayer(0, tileset, 0, 0);
    layer.setCollision(COLLIDE);

    // ---------- Castles ----------
    CASTLES.forEach(c => this.addCastle(c));

    // ---------- Player ----------
    this.player = this.physics.add.sprite(WORLD_W / 2, WORLD_H / 2 + 40, 'hero');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(14, 12).setOffset(5, 18); // feet-only collision
    this.physics.add.collider(this.player, layer);

    // bluish lantern that follows the wizard (night ambiance)
    this.playerGlow = this.add.image(0, 0, 'glow')
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0x88aaff).setScale(1.1).setAlpha(0.5).setDepth(950);

    // floating interaction hint above the player
    this.hint = this.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ffffff',
      backgroundColor: '#080818cc', padding: { x: 6, y: 5 }
    }).setOrigin(0.5, 1).setDepth(1200).setVisible(false);

    // ---------- World bounds + camera ----------
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.6); // closer, cozier RPG framing

    // ---------- Night overlay ----------
    this.add.rectangle(0, 0, WORLD_W, WORLD_H, 0x0a1038, 0.45).setOrigin(0).setDepth(900);

    // ---------- Input ----------
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    // ---------- HUD + dialogue ----------
    this.buildHUD();
  }

  // ---- a themed castle built from primitives ----
  addCastle(def) {
    const x = def.tx * TILE, y = def.ty * TILE, d = y;
    const STONE = 0x3a3a55, STONE_DK = 0x2a2a40;

    this.add.rectangle(x, y, 26, 46, STONE).setOrigin(0.5, 1).setDepth(d);
    this.add.rectangle(x - 22, y, 18, 32, STONE_DK).setOrigin(0.5, 1).setDepth(d);
    this.add.rectangle(x + 22, y, 18, 32, STONE_DK).setOrigin(0.5, 1).setDepth(d);
    this.add.rectangle(x, y - 46, 26, 5, def.color).setOrigin(0.5, 0).setDepth(d); // colored roof band

    // glowing windows (above the night overlay so they actually shine)
    [y - 34, y - 22].forEach(wy => {
      this.add.rectangle(x, wy, 7, 9, 0xffe08a).setOrigin(0.5).setDepth(d + 1);
      this.add.image(x, wy, 'glow').setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0xffd166).setScale(0.45).setAlpha(0.8).setDepth(950);
    });

    // door + door glow tinted to the castle's theme color
    this.add.rectangle(x, y, 12, 18, 0x140d06).setOrigin(0.5, 1).setDepth(d + 1);
    this.add.image(x, y - 4, 'glow').setBlendMode(Phaser.BlendModes.ADD)
      .setTint(def.color).setScale(0.7).setAlpha(0.6).setDepth(950);

    // name plaque
    const py = y + 8;
    this.add.rectangle(x, py, 108, 30, 0x080818).setOrigin(0.5, 0).setDepth(d + 2)
      .setStrokeStyle(2, def.color);
    this.add.text(x, py + 6, def.name, {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5, 0).setDepth(d + 3);
    this.add.text(x, py + 17, def.diff, {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ffd166'
    }).setOrigin(0.5, 0).setDepth(d + 3);

    def._cx = x; def._cy = y;
  }

  // ---- screen-fixed HUD + dialogue box ----
  buildHUD() {
    const fix = o => o.setScrollFactor(0).setDepth(2000);
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;

    // title
    fix(this.add.text(W / 2, 10, 'ADVERSARIAL ALGORITHM ARENA', {
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5, 0)).setStroke('#3a2a6b', 4);
    fix(this.add.text(W / 2, 28, '~ THE WIZARDING ACADEMY OF SECURE CODE ~', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffd166'
    }).setOrigin(0.5, 0));

    // crest + stats (top-left)
    fix(this.add.rectangle(14, 50, 40, 46, 0x7a1f1f).setOrigin(0, 0).setStrokeStyle(3, 0xffd166));
    fix(this.add.text(24, 62, '\u{1F9D9}', { fontSize: '20px' }).setOrigin(0, 0));
    fix(this.add.text(62, 50, 'BUILDER TRACK', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#4ea3ff'
    }).setOrigin(0, 0));
    fix(this.add.text(62, 66, 'House: GRYFFINMORE', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#ffffff'
    }).setOrigin(0, 0));
    fix(this.add.text(62, 80, 'LVL 4   XP 1250   ELO 1340', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#9aa0c0'
    }).setOrigin(0, 0));

    // dialogue box (bottom)
    fix(this.add.rectangle(W / 2, H - 14, W - 36, 78, 0x060614, 0.92)
      .setOrigin(0.5, 1).setStrokeStyle(3, 0x4a4a7a));
    fix(this.add.text(30, H - 84, '\u25C6 PROFESSOR ALGORITHMUS', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#4fd17a'
    }).setOrigin(0, 0));
    this.dlg = fix(this.add.text(30, H - 66, IDLE_TEXT, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#e8e8ff',
      wordWrap: { width: W - 70 }, lineSpacing: 6
    }).setOrigin(0, 0));
    fix(this.add.text(30, H - 26, 'MOVE \u2190\u2191\u2193\u2192 / WASD     INTERACT [E]', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#8a8ab0'
    }).setOrigin(0, 0));
  }

  update() {
    const p = this.player;
    const k = this.cursors, w = this.wasd;
    let vx = 0, vy = 0;
    if (k.left.isDown || w.A.isDown)  vx = -SPEED;
    if (k.right.isDown || w.D.isDown) vx =  SPEED;
    if (k.up.isDown || w.W.isDown)    vy = -SPEED;
    if (k.down.isDown || w.S.isDown)  vy =  SPEED;
    p.body.setVelocity(vx, vy);
    if (vx && vy) p.body.velocity.normalize().scale(SPEED);

    p.setDepth(p.y);                       // sort against castles by y
    this.playerGlow.setPosition(p.x, p.y);

    // proximity to nearest castle
    let near = null, best = 70;
    for (const c of CASTLES) {
      const dist = Phaser.Math.Distance.Between(p.x, p.y, c._cx, c._cy);
      if (dist < best) { best = dist; near = c; }
    }
    if (near) {
      this.hint.setText('Press [E] to enter\n' + near.name)
        .setPosition(p.x, p.y - 20).setVisible(true);
      this.dlg.setText(near.hint);
    } else {
      this.hint.setVisible(false);
      this.dlg.setText(IDLE_TEXT);
    }
  }
}
