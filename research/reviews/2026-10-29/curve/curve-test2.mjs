/*
 * THE FAILURE-YEAR OPTION'S TESTS (EXPLORATORY; SPENDING-CURVE.md, the amendment). Run from the root of the code under test,
 * its solve.js beside a copy of the one before the option (git's HEAD, the spending-utility prototype) as src/solver/_orig_solve.js.
 *   1. identity: with `failDelivered` unset, every table the same bit for bit as before, under the candidate and under HYB's
 *      spending utility, on S090 and S304F at the light settings; planted: lambda x (1 + 1e-9) must differ;
 *   2. the option reaches the solve: the tables with it differ from those without, under the candidate and HYB;
 *   3. the unmet term matters: the tables with the unmet ignored (the plant `failDeliveredPlant: 'nounmet'`) differ from
 *      the option's.
 *   node <this file>
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js');
const C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
writeFileSync('src/solver/_orig_solve.js', execSync('git show HEAD:src/solver/solve.js'));
let O;
try { O = await imp('src/solver/_orig_solve.js'); } finally { unlinkSync('src/solver/_orig_solve.js'); }
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const LAMBDA = 0.0223606797749979, LIGHT = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const P = Object.fromEntries(readPanel().map(h => [h.id, h]));
const planOf = id => E.resolveMpaa(E.normalizePlan({ ...P[id].plan, config: { ...P[id].plan.config, guardrails: false, lookaheadYears: 0 } }));
const hashOf = r => { const h = createHash('sha256'), seen = new Set(); let k = 0; const walk = o => { if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o); if (ArrayBuffer.isView(o)) { k++; h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; } if (Array.isArray(o)) { o.forEach(walk); return; } for (const key of Object.keys(o).sort()) walk(o[key]); }; walk(r.tablesW); return { hash: h.digest('hex').slice(0, 16), k }; };
const HYB = id => { const c0 = E.buildContext(planOf(id)), scale = c0.accounts.reduce((x, a) => x + a.balance, 0), K = 0.25 / (LAMBDA * 0.04);
  return { spendUtility: { gamma: 2, kappa: 1 / K, beta: 1, mortality: { mode: 90, disp: 9 }, ruinMin: 0.1 }, bequestWeight: 0.25 * (1 / K) * scale / c0.targetSpend }; };
const NEW = (id, x) => C.solveCandidate(E, M, planOf(id), { ...LIGHT, ...x }), OLD = (id, x) => O.solvePlan(E, M, C.candidatePlan(E, planOf(id)), { ...C.CANDIDATE_OPTS, ...LIGHT, ...x });
for (const id of ['S090', 'S304F']) for (const [arm, x] of [['CAND', {}], ['HYB', HYB(id)]]) {
  const a = hashOf(NEW(id, x)), b = hashOf(OLD(id, x));
  ok(a.hash === b.hash && a.k > 0, `1. ${id} ${arm}: with failDelivered unset the ${a.k} tables hash ${a.hash}, as before (${b.hash})`);
  const on = hashOf(NEW(id, { ...x, failDelivered: true })), pl = hashOf(NEW(id, { ...x, failDelivered: true, failDeliveredPlant: 'nounmet' }));
  ok(on.hash !== a.hash, `2. ${id} ${arm}: with it the tables hash ${on.hash}, not ${a.hash}`);
  ok(pl.hash !== on.hash, `3. ${id} ${arm}: with the unmet ignored (planted) ${pl.hash}, not ${on.hash}`);
}
{ const a = hashOf(NEW('S090', {})), b = hashOf(OLD('S090', { lambda: LAMBDA * (1 + 1e-9) })); ok(a.hash !== b.hash, `1. planted: lambda x (1 + 1e-9) hashes ${b.hash}, not ${a.hash}`); }
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
