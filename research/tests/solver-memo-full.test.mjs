/*
 * S1'S IDENTITY TEST, ITS FULL FORM, for the nightly full suite: solver-memo.test.mjs --full, S224, S362 and S370 under
 * SHIP, CAND, FROZEN, DECOMP and JOINT (results-solver-memo.txt). The quick form, solver-memo.test.mjs itself, is in the
 * fast suite.
 *   node research/tests/solver-memo-full.test.mjs
 */
process.argv.push('--full');
await import('./solver-memo.test.mjs');
