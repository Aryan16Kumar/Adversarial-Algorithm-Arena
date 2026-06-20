// ============================================================
//  Phase A contract — shared shapes for challenges & grading.
//  Owned by Person 1. Person 3 (API client) and Person 2 (DB)
//  consume the `Result` object produced here.
// ============================================================

/**
 * Per-test outcomes.
 * @typedef {'PASS'|'WRONG'|'TLE'|'CRASH'} Verdict
 */
export const VERDICT = Object.freeze({
  PASS: 'PASS',
  WRONG: 'WRONG',
  TLE: 'TLE',     // exceeded the challenge time limit (slow / infinite loop)
  CRASH: 'CRASH'  // threw an error / invalid output
});

/**
 * A single test case. `input` is the argument list spread into the
 * player's function: solve(...input). The runner deep-clones `input`
 * before each run so player mutation can't corrupt later tests.
 * @typedef {Object} TestCase
 * @property {string} name
 * @property {any[]}  input
 * @property {any}    expected
 */

/**
 * A challenge attached to a castle (keyed by the castle's `key`).
 * @typedef {Object} Challenge
 * @property {string}     key           - matches a CASTLES key (e.g. 'arrays')
 * @property {string}     name
 * @property {string}     functionName  - the function the player must define
 * @property {string}     starterCode   - editor seed
 * @property {number}     timeLimitMs   - per-test wall-clock budget
 * @property {TestCase[]} tests             - baseline correctness
 * @property {TestCase[]} adversarialTests  - worst-case / attacker inputs
 */

/**
 * Per-test result the runner records.
 * @typedef {Object} TestResult
 * @property {string}  name
 * @property {Verdict} verdict
 * @property {number}  timeMs
 * @property {boolean} adversarial
 */

/**
 * Grading output of runSolution() — the scored part of a submission.
 * @typedef {Object} GradeResult
 * @property {TestResult[]} perTest
 * @property {{correctness:number, efficiency:number, robustness:number, adversarial:number}} score  - each 0..1
 * @property {number} composite   - 0..1 weighted blend
 * @property {number} damage      - 0..100 dealt to the opponent
 */

/**
 * Full Result object POSTed to the backend (Person 2/3 contract).
 * = GradeResult + identity/context fields filled by BattleScene.
 * @typedef {GradeResult & {
 *   userId: string,
 *   challengeKey: string,
 *   code: string,
 *   won: boolean
 * }} Result
 */

/**
 * Combine a GradeResult with submission context into the full Result
 * object that Person 3 sends to the API.
 * @param {GradeResult} grade
 * @param {{userId:string, challengeKey:string, code:string, won:boolean}} ctx
 * @returns {Result}
 */
export function makeResult(grade, ctx) {
  return { ...grade, ...ctx };
}
