/*
 * V2'S STATE CHECK, ITS FULL FORM, for the nightly full suite: state-check.test.mjs --full, all five households at 40 paths
 * each (results-state-check.txt). The quick form, state-check.test.mjs itself, is in the fast suite.
 *   node research/tests/state-check-full.test.mjs
 */
process.argv.push('--full');
await import('./state-check.test.mjs');
