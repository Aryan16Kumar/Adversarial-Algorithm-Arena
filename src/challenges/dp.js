// ============================================================
//  Challenge: CITADEL OF DP — longest strictly increasing subsequence.
//  Adversarial angle: 100k-element inputs make naive O(2^n) recursion
//  impossible and O(n^2) DP time out (TLE). Only an O(n log n)
//  solution survives. Rewards efficient, memoised thinking.
// ============================================================

// reference: O(n log n) patience sorting
function ref(nums) {
  const tails = [];
  for (let k = 0; k < nums.length; k++) {
    const x = nums[k];
    let lo = 0, hi = tails.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tails[mid] < x) lo = mid + 1; else hi = mid; }
    tails[lo] = x;
  }
  return tails.length;
}

function seeded(n, seed) {
  const out = new Array(n);
  let s = seed >>> 0;
  for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; out[i] = s % 1000000; }
  return out;
}
const big = seeded(100000, 999);
const incr = Array.from({ length: 100000 }, (_, i) => i);   // LIS = 100000

/** @type {import('./schema.js').Challenge} */
export const dp = {
  key: 'dp',
  name: 'CITADEL OF DP',
  functionName: 'solve',
  timeLimitMs: 1000,
  spec: 'solve(nums): number \u2014 return the length of the longest strictly increasing subsequence.',
  example: 'solve([10,9,2,5,3,7,101,18]) \u2192 4    // 2,3,7,18',
  starterCode:
`// Return the length of the longest strictly increasing subsequence.
// Beware: the adversary sends 100,000-element inputs \u2014 O(n^2) will TIME OUT.
function solve(nums) {

}`,
  tests: [
    { name: 'empty',     input: [[]],                          expected: 0 },
    { name: 'single',    input: [[5]],                         expected: 1 },
    { name: 'classic',   input: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 },
    { name: 'mixed',     input: [[0, 1, 0, 3, 2, 3]],          expected: 4 },
    { name: 'all equal', input: [[7, 7, 7, 7]],                expected: 1 }
  ],
  adversarialTests: [
    { name: 'large random (100k)',        input: [big],  expected: ref(big) },
    { name: 'strictly increasing (100k)', input: [incr], expected: ref(incr) }
  ]
};

export default dp;
