import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import OverworldScene from './scenes/OverworldScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  pixelArt: true,            // crisp, no smoothing — essential for pixel art
  backgroundColor: '#0a0a1f',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [BootScene, OverworldScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

// Wait for the pixel font to load so HUD/dialogue text renders correctly,
// then boot the game. Falls back gracefully if the Font Loading API is absent.
function start() { new Phaser.Game(config); }

if (document.fonts && document.fonts.load) {
  document.fonts.load('10px "Press Start 2P"')
    .then(() => document.fonts.ready)
    .then(start)
    .catch(start);
} else {
  start();
}
