// ============================================================
//  Challenge registry — maps a castle `key` (from config.CASTLES)
//  to its Challenge definition. BattleScene looks challenges up
//  here by castle key.
// ============================================================
import { arrays } from './arrays.js';
import { trees } from './trees.js';
import { graphs } from './graphs.js';
import { dp } from './dp.js';

/** @type {Record<string, import('./schema.js').Challenge>} */
const CHALLENGES = {
  arrays,
  trees,
  graphs,
  dp
};

/**
 * @param {string} key castle key
 * @returns {import('./schema.js').Challenge | undefined}
 */
export function getChallenge(key) {
  return CHALLENGES[key];
}

export { CHALLENGES };
