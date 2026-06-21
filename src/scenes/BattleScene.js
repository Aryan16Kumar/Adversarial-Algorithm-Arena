import Phaser from 'phaser';
import { MAP_W, MAP_H, CASTLES, CURSOR } from '../config.js';
import { runSolution } from '../engine/runner.js';
import { getChallenge } from '../challenges/index.js';
import { VERDICT } from '../challenges/schema.js';
import { getRandomQuestion, submitScore } from '../supabaseClient.js';

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

    this.input.setDefaultCursor(CURSOR.default);

    this.challenge = getChallenge(this.castle.key);  // may be undefined (TODO castles)
    this.playerHP = 100;
    this.enemyHP = 100;
    this.busy = false;
    this.question = null;

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

    this.buildCharacters();
    this.buildBackButton();
    this.loadQuestion();   // async: fetch DB question -> set challenge -> build panel + editor

    this.cameras.main.fadeIn(350, 0, 0, 0);
  }

  // Fetch this castle's question from Supabase (by difficulty). If found, it
  // becomes the graded challenge (player code runs against its test_cases).
  // Falls back to the local challenge when the DB isn't configured / empty.
  async loadQuestion() {
    const loading = this.add.text(62, 186, 'Summoning challenge\u2026', {
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#8a8ab0'
    }).setDepth(10);
    try {
      const q = await getRandomQuestion(this.castle.difficultyLevel);
      if (q) {
        this.question = q;
        this.challenge = this.challengeFromQuestion(q);
      }
    } catch (err) {
      console.error('Failed to load question:', err);
    }
    loading.destroy();
    this.buildProblemPanel();
    this.buildEditor();
  }

  // Convert a Supabase question row into the Challenge shape the runner grades.
  // The player implements solve(input); each test_case input object is passed
  // as the single argument and compared to expected_output.
  challengeFromQuestion(q) {
    const cases = Array.isArray(q.test_cases) ? q.test_cases : [];
    const ex = Array.isArray(q.examples) && q.examples[0] ? q.examples[0] : null;
    return {
      key: 'db-' + q.id,
      name: q.title,
      functionName: 'solve',
      timeLimitMs: 2000,
      spec: q.description || '',
      example: ex ? `solve(${JSON.stringify(ex.input)}) -> ${JSON.stringify(ex.output)}` : '',
      starterCode:
        `// ${q.title}\n` +
        `// Implement solve(input). See EXAMPLES for the input shape.\n` +
        `function solve(input) {\n\n}`,
      tests: cases.map((t, i) => ({ name: 'case ' + (i + 1), input: [t.input], expected: t.expected_output })),
      adversarialTests: []
    };
  }

  // ---------- left: challenge / problem panel ----------
  buildProblemPanel() {
    const c = this.castle;
    const ch = this.challenge;
    const q = this.question;
    const x = 40, y = 110, w = 600, h = 470;
    this.add.rectangle(x, y, w, h, 0x060614, 0.92).setOrigin(0, 0).setStrokeStyle(3, c.color);

    this.add.text(x + 20, y + 16, '\u25C6 THE CHALLENGE', {
      fontFamily: '"Press Start 2P"', fontSize: '13px', color: '#4fd17a'
    }).setOrigin(0, 0);

    if (q) {
      // ----- DB question: full statement in a scrollable DOM panel -----
      const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const diffColor = { Easy: '#4fd17a', Medium: '#ffd166', Hard: '#ff6d6d' }[q.difficulty_level] || '#4ea3ff';
      const cons = Array.isArray(q.constraints) ? q.constraints : [];
      const exs = Array.isArray(q.examples) ? q.examples : [];

      const body =
        `<div style="font-family:'Press Start 2P';font-size:11px;color:#fff;line-height:1.6;margin-bottom:10px;">${esc(q.title)}</div>` +
        `<span style="font-family:'Press Start 2P';font-size:8px;color:#0a0a1f;background:${diffColor};padding:4px 8px;">${esc(q.difficulty_level || '')}</span>` +
        `<p style="margin:12px 0;color:#cdd4f0;">${esc(q.description || '')}</p>` +
        (cons.length
          ? `<div style="color:#ffd166;font-family:'Press Start 2P';font-size:9px;margin:12px 0 6px;">CONSTRAINTS</div>` +
            `<ul style="margin:0 0 8px 16px;color:#9aa0c0;">${cons.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
          : '') +
        (exs.length
          ? `<div style="color:#ffd166;font-family:'Press Start 2P';font-size:9px;margin:12px 0 6px;">EXAMPLES</div>` +
            exs.map((e) => `<pre style="white-space:pre-wrap;word-break:break-word;color:#9be7a0;margin:0 0 10px;">solve(${esc(JSON.stringify(e.input))})\n\u2192 ${esc(JSON.stringify(e.output))}</pre>`).join('')
          : '');

      const wrap =
        `<div style="width:${w - 44}px;height:${h - 104}px;overflow-y:auto;` +
        `font-family:ui-monospace,Consolas,monospace;font-size:13px;line-height:1.5;` +
        `color:#cdd4f0;padding-right:8px;">${body}</div>`;
      this.problemDom = this.add.dom(x + 20, y + 46).createFromHTML(wrap).setOrigin(0, 0);
    } else if (ch) {
      // ----- local challenge fallback: precise spec + example -----
      let yy = y + 54;
      const specT = this.add.text(x + 22, yy, ch.spec, {
        fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#cdd4f0',
        wordWrap: { width: w - 44 }, lineSpacing: 8
      }).setOrigin(0, 0);
      yy += specT.height + 22;
      this.add.text(x + 22, yy, 'EXAMPLE', {
        fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffd166'
      }).setOrigin(0, 0);
      this.add.text(x + 22, yy + 18, ch.example, {
        fontFamily: 'monospace', fontSize: '15px', color: '#9be7a0',
        wordWrap: { width: w - 44 }, lineSpacing: 4
      }).setOrigin(0, 0);
    } else {
      this.add.text(x + 22, y + 54, c.challenge, {
        fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#9aa0c0',
        wordWrap: { width: w - 44 }, lineSpacing: 7
      }).setOrigin(0, 0);
    }

    this.add.text(x + 20, y + h - 32, 'Write your spell, then CAST it \u2192', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#8a8ab0'
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

    const starter = this.challenge
      ? this.challenge.starterCode + '\n'
      : `// ${c.name}\n` +
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
      .setInteractive({ cursor: CURSOR.pointer });
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
    const CHAR_H = 360;                       // uniform on-screen height
    const place = (x, key, flip) => {
      const s = this.add.sprite(x, ground, key).setOrigin(0.5, 1);
      s.setScale(CHAR_H / s.height);          // normalise differing trim sizes
      s.setFlipX(flip);
      return s;
    };
    this.player = place(360, 'builder', false);
    // opponent: this castle's foe, lower-right, facing left
    this.enemy = place(W - 360, this.castle.opponent, true);

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
  async onCast() {
    if (this.busy) return;
    const code = this.editor.node.value || '';
    if (code.replace(/[^a-zA-Z0-9]/g, '').length < 30) {
      this.flash('Your spellbook is too empty to cast!', '#ff6d6d');
      return;
    }
    this.busy = true;
    this.castLabel.setText('CASTING\u2026');

    // Grade the code (real Web Worker run). Falls back to a flat hit for
    // castles whose challenge isn't authored yet.
    let dmg, grade = null;
    if (this.challenge) {
      try {
        grade = await runSolution(code, this.challenge);
        dmg = grade.damage;
      } catch (e) {
        console.warn('[cast error]', e);
        grade = null;
        dmg = Phaser.Math.Between(22, 34);
      }
    } else {
      dmg = Phaser.Math.Between(22, 34);
    }
    this.castLabel.setText('\u2728 CAST SPELL');
    if (grade) this.showVerdict(grade);

    // resolve the cast: player hits, enemy retaliates
    this.castFx(this.player, this.enemy, this.castle.color);
    this.tweens.add({ targets: this.enemy, x: this.enemy.x + 12, yoyo: true, duration: 90, delay: 180 });

    this.time.delayedCall(220, () => {
      this.enemyHP = Math.max(0, this.enemyHP - dmg);
      this.setHp(this.enemyHpFill, this.enemyHP);
      this.popDamage(this.enemy.x, this.enemy.y - 360, dmg, '#ffd166');

      if (this.enemyHP <= 0) return this.finish(true);

      // enemy retaliates harder if your code was weak (low composite)
      this.time.delayedCall(520, () => {
        const weak = grade ? (1 - grade.composite) : 0.5;
        const back = Math.round(8 + weak * 22);
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

  // ---------- per-cast verdict feedback ----------
  showVerdict(grade) {
    const total = grade.perTest.length;
    const passed = grade.perTest.filter((t) => t.verdict === VERDICT.PASS).length;
    const crash = grade.perTest.filter((t) => t.verdict === VERDICT.CRASH);
    const tle = grade.perTest.filter((t) => t.verdict === VERDICT.TLE).length;
    const wrong = grade.perTest.filter((t) => t.verdict === VERDICT.WRONG).length;
    const adv = grade.perTest.filter((t) => t.adversarial);

    let msg, col;
    if (crash.length) {
      const fe = crash.find((t) => t.error);
      msg = `CRASH \u00d7${crash.length}: ${fe ? fe.error : 'your spell backfired'}`;
      col = '#ff6d6d';
    } else if (wrong) {
      msg = `WRONG on ${wrong} test(s).`;
      col = '#ff6d6d';
    } else if (tle) {
      msg = `TLE on ${tle} test(s) \u2014 too slow!`;
      col = '#ffd166';
    } else {
      msg = 'FLAWLESS \u2014 all tests passed!';
      col = '#4fd17a';
    }

    let extra = `[${passed}/${total} passed]`;
    if (adv.length) extra += ` \u00b7 resilience ${(grade.score.adversarial * 100) | 0}%`;
    this.flash(`${msg}   ${extra}`, col);
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
    // Persist the win to Supabase (Person 2's leaderboard), keyed by the
    // player's identity (Person 3's localStorage username).
    if (won) {
      const username = localStorage.getItem('player_username') || 'Anonymous_Player';
      submitScore(username, this.castle.points).catch(() => {});
    }

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
      .setInteractive({ cursor: CURSOR.pointer }).setDepth(900);
    this.add.text(120, 36, '\u2190 MAP', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(901);
    b.on('pointerdown', () => this.backToMap());
  }

  backToMap() {
    if (this.editor) this.editor.destroy();
    if (this.problemDom) this.problemDom.destroy();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map'));
  }
}
