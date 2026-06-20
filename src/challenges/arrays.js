// ============================================================
//  Challenge: CASTLE OF ARRAYS — sort an integer array ascending.
//  Adversarial angle: large / already-sorted / reverse / duplicate
//  inputs that punish naive O(n^2) sorts (TLE) and reward an
//  efficient, defensive implementation.
// ============================================================
import { VERDICT } from './schema.js';

const ref = (arr) => [...arr].sort((a, b) => a - b);

// deterministic pseudo-random array (seeded) so tests are reproducible
function seededArray(n, seed) {
  const out = new Array(n);
  let s = seed >>> 0;
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out[i] = s % 1000000;
  }
  return out;
}

const big = seededArray(100000, 12345);
const sortedAsc = Array.from({ length: 100000 }, (_, i) => i);
const reversed = Array.from({ length: 100000 }, (_, i) => 100000 - i);
const dupes = Array.from({ length: 100000 }, (_, i) => i % 7);

/** @type {import('./schema.js').Challenge} */
export const arrays = {
  key: 'arrays',
  name: 'CASTLE OF ARRAYS',
  functionName: 'solve',
  timeLimitMs: 1000,
  starterCode:
`// Return the array sorted in non-decreasing order.
// Beware: the adversary will hurl 100,000-element inputs at you.
function solve(arr) {
  // your incantation here

}`,
  tests: [
    { name: 'empty',        input: [[]],            expected: [] },
    { name: 'single',       input: [[42]],          expected: [42] },
    { name: 'small',        input: [[3, 1, 2]],     expected: [1, 2, 3] },
    { name: 'negatives',    input: [[0, -5, 3, -1]], expected: [-5, -1, 0, 3] },
    { name: 'with dupes',   input: [[5, 3, 5, 1, 3]], expected: [1, 3, 3, 5, 5] }
  ],
  adversarialTests: [
    { name: 'large random (100k)',   input: [big],       expected: ref(big) },
    { name: 'already sorted (100k)', input: [sortedAsc], expected: ref(sortedAsc) },
    { name: 'reverse sorted (100k)', input: [reversed],  expected: ref(reversed) },
    { name: 'many duplicates (100k)',input: [dupes],     expected: ref(dupes) }
  ]
};

// re-export so callers can grab the verdict enum alongside the challenge
export { VERDICT };
export default arrays;
