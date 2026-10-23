/*
 * V2'S STATE CHECK, ITS QUICK FORM, for the fast suite (added on the maintainer's unlock of 23 Oct): state-check.test.mjs
 * on the taxable household and S370 at 10 paths each, so both planted faults (the carried gains dropped, an emptied
 * account's basis forgotten) still fire. The full form (five households, 40 paths each) runs in the nightly full suite.
 *   node research/tests/state-check-quick.test.mjs
 */
process.argv.push('--quick');
await import('./state-check.test.mjs');
