/*
 * S2'S IDENTITY TEST, ITS FULL FORM, for the nightly full suite: chooser-share.test.mjs --full, S224, S362 and S370 under
 * SHIP and the candidate (results-chooser-share.txt). The quick form, chooser-share.test.mjs itself, is in the fast suite.
 *   node research/tests/chooser-share-full.test.mjs
 */
process.argv.push('--full');
await import('./chooser-share.test.mjs');
