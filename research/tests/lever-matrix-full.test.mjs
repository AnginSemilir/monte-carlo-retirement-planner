/*
 * THE LEVER MATRIX, WHOLE (the launch plan's step L3; the full tier): every combination of the all-pairs design over the
 * levers and locks on two households (research/tests/lever-matrix.mjs), each solved without a throw and every check held
 * on 100 engine paths. Its plants are lever-matrix.test.mjs's (the fast tier).
 *   node research/tests/lever-matrix-full.test.mjs
 */
// e3pcls guard: the solves below go through solveForApp on this code (the app's path); e3pcls's own exactness is solver-e3pcls.test.mjs's
import { allPairs, coversAllPairs, solveCombo, checkCombo, label } from './lever-matrix.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const rows = allPairs(), gap = coversAllPairs(rows);
ok(!gap, `the design: ${rows.length} combinations, every pair of settings covered${gap ? ` (missing ${gap})` : ''}`);
for (const c of rows) {
  const t0 = Date.now();
  let bad;
  try { bad = await checkCombo(c, solveCombo(c)); } catch (e) { bad = [`threw: ${e.message}`]; }
  ok(bad.length === 0, `${label(c)}: ${bad.length ? bad.join('; ') : 'every check holds'} (${(Date.now() - t0) / 1000} s)`);
}
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
