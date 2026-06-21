// ============================================================
//  Challenge: TOWER OF TREES — max depth of a rooted tree.
//  Adversarial angle: a very deep chain (50k nodes) makes naive
//  RECURSIVE solutions blow the call stack (CRASH); an iterative
//  traversal survives. Rewards stack-safe, defensive code.
// ============================================================

// reference: iterative depth (root = node 0)
function ref(children) {
  let max = 0;
  const stack = [[0, 1]];
  while (stack.length) {
    const [n, d] = stack.pop();
    if (d > max) max = d;
    const kids = children[n] || [];
    for (let i = 0; i < kids.length; i++) stack.push([kids[i], d + 1]);
  }
  return max;
}

const N = 50000;
const chain = Array.from({ length: N }, (_, i) => (i < N - 1 ? [i + 1] : []));        // depth 50000
const wide = [Array.from({ length: N }, (_, i) => i + 1), ...Array.from({ length: N }, () => [])]; // depth 2

/** @type {import('./schema.js').Challenge} */
export const trees = {
  key: 'trees',
  name: 'TOWER OF TREES',
  functionName: 'solve',
  timeLimitMs: 1000,
  spec: 'solve(children): number \u2014 children[i] lists node i\u2019s child indices, root = 0. Return the depth (nodes on the longest root-to-leaf path).',
  example: 'solve([[1,2],[],[3],[]]) \u2192 3    // path 0 \u2192 2 \u2192 3',
  starterCode:
`// children[i] = array of child indices; root is node 0.
// Return the max depth (count of nodes on the longest root-to-leaf path).
// Beware: the adversary sends very DEEP trees \u2014 mind your recursion.
function solve(children) {

}`,
  tests: [
    { name: 'single node',  input: [[[]]],                 expected: 1 },
    { name: 'two levels',   input: [[[1, 2], [], []]],      expected: 2 },
    { name: 'three deep',   input: [[[1, 2], [], [3], []]], expected: 3 },
    { name: 'left chain',   input: [[[1], [2], [3], []]],   expected: 4 }
  ],
  adversarialTests: [
    { name: 'deep chain (50k)',       input: [chain], expected: ref(chain) },
    { name: 'wide tree (50k leaves)', input: [wide],  expected: ref(wide) }
  ]
};

export default trees;
