import Phaser from 'phaser';
import { MAP_W, MAP_H, SHEET, CASTLES } from '../config.js';

// ============================================================
//  BattleScene
//  The per-castle "coding + attack" arena. A problem panel and
//  code editor sit up top; two characters face off at the
//  bottom (Builder vs the castle's opponent) with HP bars.
//  Casting a spell = submitting code (grading is stubbed).
// ============================================================
export default class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  init(data) {
    this.castle = CASTLES.find((c) => c.key === data.castle) || CASTLES[0];
  }

  create() {
    const W = MAP_W, H = MAP_H;
    const c = this.castle;

    this.playerHP = 100;
    this.enemyHP = 100;
    this.busy = false;

    // ---------- arena backdrop ----------
    this.add.rectangle(0, 0, W, H, 0x0a0a1f).setOrigin(0, 0);
    this.add.rectangle(0, 0, W, H, c.color, 0.06).setOrigin(0, 0);
    // floor band
    this.add.rectangle(0, H - 170, W, 170, 0x06060f).setOrigin(0, 0);
    this.add.rectangle(0, H - 170, W, 4, c.color, 0.6).setOrigin(0, 0);

    // ---------- title ----------
    this.add.text(W / 2, 24, c.name, {
      fontFamily: '"Press Start 2P"', fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5, 0).setStroke('#1a1030', 8);
    this.add.text(W / 2, 60, 'DUEL OF SECURE CODE  ' + c.diff, {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffd166'
    }).setOrigin(0.5, 0);

    this.buildProblemPanel();
    this.buildEditor();
    this.buildCharacters();
    this.buildBackButton();

    this.cameras.main.fadeIn(350, 0, 0, 0);
  }

  // ---------- left: challenge / problem panel ----------
  buildProblemPanel() {
    const c = this.castle;
    const x = 40, y = 110, w = 600, h = 470;
    this.add.rectangle(x, y, w, h, 0x060614, 0.92).setOrigin(0, 0).setStrokeStyle(3, c.color);

    this.add.text(x + 22, y + 20, '\u25C6 THE CHALLENGE', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#4fd17a'
    }).setOrigin(0, 0);

    this.add.text(x + 22, y + 64, c.prompt, {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#e8e8ff',
      wordWrap: { width: w - 44 }, lineSpacing: 8
    }).setOrigin(0, 0);

    this.add.text(x + 22, y + 200, c.challenge, {
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#9aa0c0',
      wordWrap: { width: w - 44 }, lineSpacing: 8
    }).setOrigin(0, 0);

    this.add.text(x + 22, y + h - 40, 'Write your spell, then CAST it \u2192', {
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#8a8ab0'
    }).setOrigin(0, 0);
  }

  // ---------- right: code editor (DOM textarea) + CAST ----------
  buildEditor() {
    const c = this.castle;
    const x = 700, y = 110, w = 660, h = 400;

    this.add.rectangle(x, y, w, h + 86, 0x05050d, 0.95).setOrigin(0, 0).setStrokeStyle(3, 0x4a4a7a);
    this.add.text(x + 18, y + 14, 'spellbook.js', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#6fd0ff'
    }).setOrigin(0, 0);

    const starter =
      `// ${c.name}\n` +
      `function solve(input) {\n` +
      `  // your incantation here\n` +
      `  \n` +
      `}\n`;

    const css =
      `width:${w - 36}px;height:${h - 60}px;` +
      `background:#0b0f1a;color:#9be7a0;border:2px solid #243049;` +
      `font-family:monospace;font-size:18px;line-height:1.5;padding:12px;` +
      `resize:none;outline:none;caret-color:#9be7a0;`;

    this.editor = this.add.dom(x + 18, y + 44, 'textarea', css, starter).setOrigin(0, 0);

    // CAST button
    const bx = x + w / 2, by = y + h + 36;
    this.castBtn = this.add.rectangle(bx, by, 280, 56, c.color).setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.castLabel = this.add.text(bx, by, '\u2728 CAST SPELL', {
      fontFamily: '"Press Start 2P"', fontSize: '16px', color: '#0a0a1f'
    }).setOrigin(0.5);

    this.castBtn.on('pointerover', () => this.castBtn.setScale(1.05));
    this.castBtn.on('pointerout',  () => this.castBtn.setScale(1));
    this.castBtn.on('pointerdown', () => this.onCast());
  }

  // ---------- bottom: the two duelists ----------
  buildCharacters() {
    const W = MAP_W, H = MAP_H;
    const ground = H - 24;

    // player: Builder, lower-left, facing right
    this.player = this.add.sprite(360, ground, 'builder', SHEET.frontFrame)
      .setOrigin(0.5, 1).setScale(1.35);
    // opponent: this castle's foe, lower-right, facing left
    this.enemy = this.add.sprite(W - 360, ground, this.castle.opponent, SHEET.frontFrame)
      .setOrigin(0.5, 1).setScale(1.35).setFlipX(true);

    // glows under each fighter
    this.add.image(360, ground - 30, 'glow').setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0x4ea3ff).setScale(2.2).setAlpha(0.4);
    this.add.image(W - 360, ground - 30, 'glow').setBlendMode(Phaser.BlendModes.ADD)
      .setTint(this.castle.color).setScale(2.2).setAlpha(0.4);

    // name + HP bars
    this.playerHpFill = this.makeHpBar(360, ground - 430, 'BUILDER', 0x4fd17a);
    this.enemyName = this.castle.opponent === 'witch' ? 'THE WITCH' : 'THE WIZARD';
    this.enemyHpFill = this.makeHpBar(W - 360, ground - 430, this.enemyName, 0xff6d6d);
  }

  makeHpBar(cx, y, label, col) {
    const w = 300, h = 22;
    this.add.text(cx, y - 22, label, {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffffff'
    }).setOrigin(0.5, 1);
    this.add.rectangle(cx, y, w + 6, h + 6, 0x000000).setStrokeStyle(2, 0x4a4a7a);
    const fill = this.add.rectangle(cx - w / 2, y, w, h, col).setOrigin(0, 0.5);
    fill._fullW = w;
    return fill;
  }

  setHp(fill, hp) {
    fill.width = Math.max(0, fill._fullW * (hp / 100));
  }

  // ---------- combat ----------
  onCast() {
    if (this.busy) return;
    const code = this.editor.node.value || '';
    // Light tie-in: must actually write something past the stub.
    if (code.replace(/[^a-zA-Z0-9]/g, '').length < 30) {
      this.flash('Your spellbook is too empty to cast!', '#ff6d6d');
      return;
    }
    this.busy = true;

    // NOTE: real code grading would run here and scale damage by
    // correctness / performance. For now a cast lands a fixed hit.
    const dmg = Phaser.Math.Between(22, 34);
    this.castFx(this.player, this.enemy, this.castle.color);
    this.tweens.add({ targets: this.enemy, x: this.enemy.x + 12, yoyo: true, duration: 90, delay: 180 });

    this.time.delayedCall(220, () => {
      this.enemyHP = Math.max(0, this.enemyHP - dmg);
      this.setHp(this.enemyHpFill, this.enemyHP);
      this.popDamage(this.enemy.x, this.enemy.y - 360, dmg, '#ffd166');

      if (this.enemyHP <= 0) return this.finish(true);

      // enemy retaliates
      this.time.delayedCall(520, () => {
        const back = Phaser.Math.Between(12, 22);
        this.castFx(this.enemy, this.player, 0xff6d6d);
        this.time.delayedCall(220, () => {
          this.playerHP = Math.max(0, this.playerHP - back);
          this.setHp(this.playerHpFill, this.playerHP);
          this.popDamage(this.player.x, this.player.y - 360, back, '#ff6d6d');
          if (this.playerHP <= 0) return this.finish(false);
          this.busy = false;
        });
      });
    });
  }

  castFx(from, to, color) {
    const orb = this.add.image(from.x, from.y - 220, 'glow')
      .setBlendMode(Phaser.BlendModes.ADD).setTint(color).setScale(1.2).setDepth(600);
    this.tweens.add({
      targets: orb, x: to.x, y: to.y - 220, scale: 2,
      duration: 240, ease: 'Quad.in',
      onComplete: () => {
        orb.setScale(3).setAlpha(0.9);
        this.tweens.add({ targets: orb, alpha: 0, scale: 4, duration: 220, onComplete: () => orb.destroy() });
      }
    });
  }

  popDamage(x, y, dmg, color) {
    const t = this.add.text(x, y, '-' + dmg, {
      fontFamily: '"Press Start 2P"', fontSize: '20px', color
    }).setOrigin(0.5).setDepth(700);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  flash(msg, color) {
    const t = this.add.text(MAP_W / 2, MAP_H - 210, msg, {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color,
      backgroundColor: '#080818cc', padding: { x: 12, y: 10 }
    }).setOrigin(0.5).setDepth(700);
    this.time.delayedCall(1400, () => t.destroy());
  }

  finish(won) {
    const overlay = this.add.rectangle(0, 0, MAP_W, MAP_H, 0x000000, 0.7).setOrigin(0, 0).setDepth(800);
    this.add.text(MAP_W / 2, MAP_H / 2 - 30, won ? 'VICTORY!' : 'DEFEATED', {
      fontFamily: '"Press Start 2P"', fontSize: '48px', color: won ? '#4fd17a' : '#ff6d6d'
    }).setOrigin(0.5).setDepth(801);
    this.add.text(MAP_W / 2, MAP_H / 2 + 30,
      won ? 'The castle yields. Click to return to the map.' : 'The Breakers prevail. Click to retreat.', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#e8e8ff'
    }).setOrigin(0.5).setDepth(801);

    this.input.once('pointerdown', () => this.backToMap());
  }

  buildBackButton() {
    const b = this.add.rectangle(120, 36, 180, 44, 0x080818).setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true }).setDepth(900);
    this.add.text(120, 36, '\u2190 MAP', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(901);
    b.on('pointerdown', () => this.backToMap());
  }

  backToMap() {
    if (this.editor) this.editor.destroy();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}
