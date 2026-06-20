// ============================================================
//  Challenge registry — maps a castle `key` (from config.CASTLES)
//  to its Challenge definition. BattleScene looks challenges up
//  here by castle key.
//
//  TODO (Person 1): add trees / graphs / dp challenges and
//  register them below as they are authored.
// ============================================================
import { arrays } from './arrays.js';

/** @type {Record<string, import('./schema.js').Challenge>} */
const CHALLENGES = {
  arrays
  // trees,
  // graphs,
  // dp
};

/**
 * @param {string} key castle key
 * @returns {import('./schema.js').Challenge | undefined}
 */
export function getChallenge(key) {
  return CHALLENGES[key];
}

export { CHALLENGES };
