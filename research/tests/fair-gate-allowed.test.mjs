/*
 * THE FAIR-TEST GATE'S ALLOWED VERSIONS (17 Nov, D126: the maintainer's unlock for exactly fair-gate.mjs's stamp check, "an
 * optional list of allowed versions ... with a dated note and a planted case refusing a third"; SHAPES.md amendment 1).
 * checkLogStamps on a read's unit logs, each "stamp: code <id> audit <hash> prediction none sha -":
 *   1. without an allowed list, logs on two versions are refused, as before the change;
 *   2. with the two versions allowed, the same logs pass;
 *   3. the planted case: a log on a third version, beside the two allowed, is refused;
 *   4. an allowed list naming two codes is refused (the versions allowed are of one code);
 *   5. logs on one version pass without a list, as before, and with a list naming that version.
 *   node research/tests/fair-gate-allowed.test.mjs
 */
import { checkLogStamps } from '../solver/fair-gate.mjs';

const log = (code, audit) => `stamp: code ${code} audit ${audit} prediction none sha -\nSHAPES (EXPLORATORY): a unit\n`;
const opts = (allowed = null) => ({ blob: () => '-', textAt: () => null, textNow: () => null, ...(allowed ? { allowed } : {}) });
const A = 'code 603eeb595679 audit 260916d007cd', B = 'code 603eeb595679 audit d97b3e32482d';
const two = { case0: log('603eeb595679', '260916d007cd'), case1: log('603eeb595679', '260916d007cd'), case20: log('603eeb595679', 'd97b3e32482d') };
const checks = [
  ['without an allowed list, logs on two versions are refused', checkLogStamps(two, 'none', opts()).some(p => /more than one version/.test(p))],
  ['with the two versions allowed, the same logs pass', checkLogStamps(two, 'none', opts([A, B])).length === 0],
  ['the planted case: a third version beside the two allowed is refused', checkLogStamps({ ...two, case5: log('603eeb595679', 'ffffffffffff') }, 'none', opts([A, B])).some(p => /ffffffffffff/.test(p))],
  ['an allowed list naming two codes is refused', checkLogStamps(two, 'none', opts([A, 'code 000000000000 audit d97b3e32482d'])).length > 0],
  ['logs on one version pass without a list, and with a list naming it', checkLogStamps({ case0: two.case0, case1: two.case1 }, 'none', opts()).length === 0 && checkLogStamps({ case0: two.case0, case1: two.case1 }, 'none', opts([A])).length === 0]
];
let bad = 0;
for (const [label, ok] of checks) { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`); }
console.log(bad ? `FAILED: ${bad} of ${checks.length} checks` : `ALL PASS: ${checks.length} checks`);
process.exit(bad ? 1 : 0);
