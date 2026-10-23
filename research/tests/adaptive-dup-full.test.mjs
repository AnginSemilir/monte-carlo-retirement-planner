/*
 * S3'S IDENTITY TEST, ITS FULL FORM, for the nightly full suite: adaptive-dup.test.mjs --full, S362, S366 and S370 at the
 * candidate's own lattice, and S362's solve with S3 off and on (results-adaptive-dup.txt). The quick form,
 * adaptive-dup.test.mjs itself, is in the fast suite.
 *   node research/tests/adaptive-dup-full.test.mjs
 */
process.argv.push('--full');
await import('./adaptive-dup.test.mjs');
