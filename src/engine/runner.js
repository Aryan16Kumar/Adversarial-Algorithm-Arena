// ============================================================
//  Phase A engine — grading pipeline.
//
//  scoreResults()  : turns per-test verdicts into the 4-axis score,
//                    composite, and battle damage. SHARED by the mock
//                    and the future real runner — keep it pure.
//
//  runSolution()   : runs the player's code in a Web Worker (src/engine/
//                    worker.js), one test at a time, enforcing a hard
//                    per-test timeout by terminating a hung worker, and
//                    produces real PASS/WRONG/TLE/CRASH verdicts.
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
  // adversarial survival and correctness dominate — rewards defensive code.
  // DB-sourced questions have no adversarial split, so renormalise without it.
  let composite;
  if (adv.length > 0) {
    composite = clamp01(0.35 * correctness + 0.35 * adversarial + 0.15 * robustness + 0.15 * efficiency);
  } else {
    composite = clamp01(0.55 * correctness + 0.25 * robustness + 0.20 * efficiency);
  }
  // tuned so a battle takes several casts (enemy starts at 100 HP)
  const damage = Math.round(15 + composite * 60);

  return { score, composite, damage };
}

/**
 * Real runner: executes the player's code in a Web Worker, one test at a
 * time, enforcing a hard per-test timeout by terminating a hung worker.
 *
 * @param {string} code
 * @param {import('../challenges/schema.js').Challenge} challenge
 * @returns {Promise<import('../challenges/schema.js').GradeResult>}
 */
export async function runSolution(code, challenge) {
  const budget = challenge.timeLimitMs || 1000;
  const all = [
    ...(challenge.tests || []).map((t) => ({ ...t, adversarial: false })),
    ...(challenge.adversarialTests || []).map((t) => ({ ...t, adversarial: true }))
  ];

  let worker = makeWorker();
  let init = await initWorker(worker, code, challenge.functionName);

  const perTest = [];
  for (const t of all) {
    let verdict, timeMs = 0, error;
    if (!init.ok) {
      verdict = VERDICT.CRASH;                 // code didn't compile / no function
      error = init.error;
    } else {
      const res = await runOne(worker, t, budget);
      verdict = res.verdict;
      timeMs = res.timeMs;
      error = res.error;
      if (res.killed) {
        // worker is stuck in an infinite loop — kill it and start fresh
        worker.terminate();
        worker = makeWorker();
        init = await initWorker(worker, code, challenge.functionName);
      }
    }
    if (error) console.warn('[arena]', t.name, verdict, '-', error);
    perTest.push({
      name: t.name, verdict, timeMs: Math.round(timeMs),
      budgetMs: budget, adversarial: t.adversarial, error
    });
  }
  worker.terminate();

  const { score, composite, damage } = scoreResults(perTest);
  return { perTest, score, composite, damage };
}

// ---- worker plumbing ----

function makeWorker() {
  const w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  w.onerror = (e) => console.error('[arena] worker error:', (e && e.message) || e);
  return w;
}

function initWorker(worker, code, functionName) {
  return new Promise((resolve) => {
    const onMsg = (e) => {
      if (e.data && e.data.type === 'inited') {
        worker.removeEventListener('message', onMsg);
        resolve(e.data);
      }
    };
    worker.addEventListener('message', onMsg);
    worker.postMessage({ type: 'init', code, functionName });
  });
}

/** Resolves with {verdict, timeMs, killed?}. On timeout, marks TLE (caller kills the worker). */
function runOne(worker, test, timeLimitMs) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (val) => { if (!done) { done = true; clearTimeout(timer); worker.removeEventListener('message', onMsg); resolve(val); } };

    const timer = setTimeout(() => finish({ verdict: VERDICT.TLE, timeMs: timeLimitMs, killed: true }), timeLimitMs + 50);

    const onMsg = (e) => {
      const d = e.data;
      if (!d || d.type !== 'result') return;
      if (d.error) finish({ verdict: VERDICT.CRASH, timeMs: d.timeMs || 0, error: d.error });
      else finish({ verdict: d.correct ? VERDICT.PASS : VERDICT.WRONG, timeMs: d.timeMs || 0 });
    };

    worker.addEventListener('message', onMsg);
    worker.postMessage({ type: 'run', input: test.input, expected: test.expected });
  });
}
