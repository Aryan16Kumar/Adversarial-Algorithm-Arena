import Phaser from 'phaser';
import { inject } from '@vercel/analytics';
import { MAP_W, MAP_H } from './config.js';
import BootScene from './scenes/BootScene.js';
import MapScene from './scenes/MapScene.js';
import BattleScene from './scenes/BattleScene.js';

// Initialize Vercel Web Analytics
inject();

// ==========================================
// PERSON 3: PLAYER IDENTITY LOGIC
// ==========================================
async function initializePlayerIdentity() {
  // 1. Check if the player already has a username saved in their browser
  let username = localStorage.getItem('player_username');

  if (!username) {
    // 2. If they don't, generate a random anonymous handle
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    username = `Player_${randomNumber}`;
    localStorage.setItem('player_username', username);
    
    console.log(`Generated new user: ${username}`);

    // 3. Send this new username to Person 2's backend database
    // REPLACE 'http://localhost:5000' WITH THE ACTUAL LINK PERSON 2 GIVES YOU
    const BACKEND_URL = 'http://localhost:5000'; 
    
    try {
      await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username }),
      });
      console.log('Successfully registered username with backend!');
    } catch (error) {
      console.error('Could not connect to backend database:', error);
    }
  } else {
    console.log(`Welcome back, user: ${username}`);
  }
}

// Run the identity function immediately when the game loads
initializePlayerIdentity();
// ==========================================

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