// ============================================================
//  Phase A sandbox worker.
//  Runs the player's code in a Worker thread (no DOM access). The
//  MAIN thread enforces the hard timeout by terminating us if a run
//  hangs (a synchronous infinite loop can't time itself out).
//
//  ⚠️ This keeps the PAGE responsive and isolates from the DOM, but it
//  is NOT a security sandbox for untrusted *remote* code (a worker can
//  still call fetch/importScripts). Real multi-user execution belongs
//  in the Phase B Docker sandbox.
// ============================================================

let userFn = null;
let initError = null;

function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }
  return false;
}

self.onmessage = (e) => {
  const msg = e.data;

  if (msg.type === 'init') {
    userFn = null;
    initError = null;
    try {
      // Define the player's code, then hand back the target function.
      const factory = new Function(
        `${msg.code}\n;return (typeof ${msg.functionName} === 'function') ? ${msg.functionName} : null;`
      );
      userFn = factory();
      if (typeof userFn !== 'function') {
        initError = `No function "${msg.functionName}" defined`;
      }
    } catch (err) {
      initError = String((err && err.message) || err);
    }
    self.postMessage({ type: 'inited', ok: !initError, error: initError });
    return;
  }

  if (msg.type === 'run') {
    if (initError || !userFn) {
      self.postMessage({ type: 'result', error: initError || 'no function' });
      return;
    }
    const t0 = performance.now();
    try {
      const out = userFn(...msg.input);
      const timeMs = performance.now() - t0;
      // Compare here so we don't ship huge outputs back to the main thread.
      self.postMessage({ type: 'result', correct: deepEqual(out, msg.expected), timeMs });
    } catch (err) {
      self.postMessage({ type: 'result', error: String((err && err.message) || err) });
    }
  }
};
