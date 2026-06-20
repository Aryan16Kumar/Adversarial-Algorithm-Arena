import Phaser from 'phaser';
import { MAP_W, MAP_H } from './config.js';
import BootScene from './scenes/BootScene.js';
import MapScene from './scenes/MapScene.js';
import BattleScene from './scenes/BattleScene.js';

const config = {
  type: Phaser.AUTO,
  width: MAP_W,                 // canvas matches the map's native resolution
  height: MAP_H,                // so castle hotspots are 1:1 with the art
  parent: 'game-container',
  pixelArt: true,               // crisp, no smoothing — essential for pixel art
  backgroundColor: '#05050f',
  dom: { createContainer: true }, // enables the in-game code editor (textarea)
  scene: [BootScene, MapScene, BattleScene],
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
