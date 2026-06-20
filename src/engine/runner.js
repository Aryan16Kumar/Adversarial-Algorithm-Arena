// ============================================================
//  Phase A engine — grading pipeline.
//
//  scoreResults()  : turns per-test verdicts into the 4-axis score,
//                    composite, and battle damage. SHARED by the mock
//                    and the future real runner — keep it pure.
//
//  runSolution()   : ⚠️ MOCK. Returns a structured GradeResult so the
//                    rest of the team can integrate against the
//                    contract NOW. Person 1 replaces the body with the
//                    real Web Worker sandbox (run code vs tests, with a
//                    hard timeout + try/catch → real verdicts).
// ============================================================
import { VERDICT } from '../challenges/schema.js';

const clamp01 = (n) => Math.max(0, Math.min(1, n));

/**
 * Pure scoring: per-test results -> { score, composite, damage }.
 * @param {import('../challenges/schema.js').TestResult[]} perTest
 * @returns {{score:object, composite:number, damage:number}}
 */
export function scoreResults(perTest) {
  const base = perTest.filter((t) => !t.adversarial);
  const adv = perTest.filter((t) => t.adversarial);
  const passRatio = (list) => (list.length ? list.filter((t) => t.verdict === VERDICT.PASS).length / list.length : 1);

  const correctness = passRatio(base);
  const adversarial = passRatio(adv);
  // robustness: share of tests that didn't crash (graceful handling)
  const robustness = perTest.length
    ? perTest.filter((t) => t.verdict !== VERDICT.CRASH).length / perTest.length : 1;
  // efficiency: among passed tests, how far under the time budget (rough)
  const passed = perTest.filter((t) => t.verdict === VERDICT.PASS);
  const efficiency = passed.length
    ? clamp01(passed.reduce((s, t) => s + (t.budgetMs ? 1 - t.timeMs / t.budgetMs : 0.6), 0) / passed.length)
    : 0;

  const score = { correctness, efficiency, robustness, adversarial };
  // adversarial survival and correctness dominate — rewards defensive code
  const composite = clamp01(0.35 * correctness + 0.35 * adversarial + 0.15 * robustness + 0.15 * efficiency);
  // tuned so a battle takes several casts (enemy starts at 100 HP)
  const damage = Math.round(15 + composite * 60);

  return { score, composite, damage };
}

/**
 * ⚠️ MOCK runner — DO NOT ship as the real grader.
 * Produces plausible verdicts so the UI + API integration can be built.
 * Baseline tests pass; adversarial tests pass ~70% (else TLE) to exercise
 * the resilience scoring. Replace with the Web Worker implementation.
 *
 * @param {string} code
 * @param {import('../challenges/schema.js').Challenge} challenge
 * @returns {Promise<import('../challenges/schema.js').GradeResult>}
 */
export async function runSolution(code, challenge) {
  const budget = challenge.timeLimitMs || 1000;
  const wrote = (code || '').replace(/[^a-zA-Z0-9]/g, '').length > 30;

  const grade = (cases, adversarial) => (cases || []).map((t) => {
    let verdict = VERDICT.PASS;
    if (!wrote) verdict = VERDICT.CRASH;
    else if (adversarial && Math.random() > 0.7) verdict = VERDICT.TLE;
    return {
      name: t.name,
      verdict,
      timeMs: verdict === VERDICT.TLE ? budget : Math.round(Math.random() * budget * 0.5),
      budgetMs: budget,
      adversarial
    };
  });

  const perTest = [
    ...grade(challenge.tests, false),
    ...grade(challenge.adversarialTests, true)
  ];

  // simulate async work (the real worker is async too)
  await new Promise((r) => setTimeout(r, 120));

  const { score, composite, damage } = scoreResults(perTest);
  return { perTest, score, composite, damage };
}
