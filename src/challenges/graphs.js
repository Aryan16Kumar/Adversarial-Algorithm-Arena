// ============================================================
//  Challenge: GRAPH CATACOMBS — detect a cycle in a directed graph.
//  Adversarial angle: a 50k-node chain (no cycle) blows the stack
//  for naive recursive DFS (CRASH); a 50k-node ring (cycle) tests
//  that detection still works at scale. Rewards iterative DFS.
// ============================================================

// reference: iterative DFS with colors (0 unvisited, 1 in-stack, 2 done)
function ref(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const color = new Int8Array(n);
  for (let s = 0; s < n; s++) {
    if (color[s] !== 0) continue;
    color[s] = 1;
    const stack = [[s, 0]];
    while (stack.length) {
      const top = stack[stack.length - 1];
      const node = top[0];
      if (top[1] < adj[node].length) {
        const nxt = adj[node][top[1]++];
        if (color[nxt] === 1) return true;            // back edge -> cycle
        if (color[nxt] === 0) { color[nxt] = 1; stack.push([nxt, 0]); }
      } else {
        color[node] = 2;
        stack.pop();
      }
    }
  }
  return false;
}

const N = 50000;
const chainEdges = Array.from({ length: N - 1 }, (_, i) => [i, i + 1]);   // no cycle
const ringEdges = Array.from({ length: N }, (_, i) => [i, (i + 1) % N]);  // one big cycle

/** @type {import('./schema.js').Challenge} */
export const graphs = {
  key: 'graphs',
  name: 'GRAPH CATACOMBS',
  functionName: 'solve',
  timeLimitMs: 1000,
  spec: 'solve(n, edges): boolean \u2014 n nodes (0..n-1), edges = [[u,v],\u2026] directed. Return true if the graph contains a cycle.',
  example: 'solve(3, [[0,1],[1,2],[2,0]]) \u2192 true',
  starterCode:
`// n nodes labelled 0..n-1; edges is a list of [from, to].
// Return true if the directed graph contains a cycle, else false.
// Beware: the adversary sends very LONG chains \u2014 mind your recursion.
function solve(n, edges) {

}`,
  tests: [
    { name: 'simple edge',     input: [2, [[0, 1]]],                 expected: false },
    { name: 'two-cycle',       input: [2, [[0, 1], [1, 0]]],         expected: true },
    { name: 'triangle cycle',  input: [3, [[0, 1], [1, 2], [2, 0]]], expected: true },
    { name: 'tree (no cycle)', input: [3, [[0, 1], [0, 2]]],         expected: false },
    { name: 'self loop',       input: [1, [[0, 0]]],                 expected: true }
  ],
  adversarialTests: [
    { name: 'long chain 50k (no cycle)', input: [N, chainEdges], expected: ref(N, chainEdges) },
    { name: 'huge ring 50k (cycle)',     input: [N, ringEdges],  expected: ref(N, ringEdges) }
  ]
};

export default graphs;
