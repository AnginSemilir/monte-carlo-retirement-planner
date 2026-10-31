/*
 * THE FAILURE YEAR AT WHAT IT CAN PAY (`failDelivered`; STATE.md D43; the external review of 29 Oct, SPENDING-CURVE.md
 * section 7 on review/external-2026-10-21 at 37fdbf7, its curve/curve-test2.mjs adapted: the candidate's objective only, the
 * review's spending-utility prototype not ported). The option's tests (CHECKLIST 5), on S090 (Phase 4's panel) at the light
 * settings, along all five routes to a failure year in solve.js (the design review of 29 Oct, finding 8):
 *   TERN    the product's settings with the ternary level search (the ternary path's site, a tier variant reading its
 *           base's unmet);
 *   E5      Phase 4's candidate (the tier state's one-pass layers, E5);
 *   TSLOOP  the same with tsOnce off (the tier state's layer loop);
 *   JOINT   the same with consent to change risk withdrawn (one tier pair: no tier state, the joint worlds; D39's route);
 *   PASS2   the product's settings (the plain pass 2);
 * and, quick and full alike:
 *   2. the option reaches the solve: with it on, the tables differ from those with it off, and meta records it;
 *   3. the unmet term matters: with the unmet ignored (the plant `failDeliveredPlant: 'nounmet'`) the tables differ from the
 *      option's;
 *   4. failDelivered without failureShortfall is refused.
 * With --full, on the code before the option (BASE, the last commit of src/solver/solve.js before the port) as
 * src/solver/_orig_solve.js, the script first checking the two differ so the identity cannot pass by comparing the code with
 * itself:
 *   0. the code under test is not BASE's;
 *   1. identity: with the option off, every table the same bit for bit as BASE's along every route on S090, and on S304F
 *      under the candidate; planted: lambda x (1 + 1e-9) must differ.
 * The full form's identity is tied to BASE's solve.js, so a later change of solve.js's tables breaks it by design: the quick
 * form is the one in the fast suite (the design review of 29 Oct, finding 8).
 *   node research/tests/fail-delivered.test.mjs [--full]
 */
// e3pcls guard: the solves compare tables on this code with the option off, on and planted (and against BASE's with --full); e3pcls's own exactness is solver-e3pcls.test.mjs's, which retakes the pin
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { candidatePlan, PHASE4_OPTS } from '../solver/candidate.mjs';
import { readPanel } from '../solver/phase4-panel.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), FULL = process.argv.includes('--full');
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const BASE = '8e63de3';
let O = null;
if (FULL) {
  const ORIG = join(ROOT, 'src/solver/_orig_solve.js'), base = execFileSync('git', ['show', `${BASE}:src/solver/solve.js`], { cwd: ROOT });
  const sha = b => createHash('sha256').update(b).digest('hex').slice(0, 16), cur = sha(readFileSync(join(ROOT, 'src/solver/solve.js')));
  writeFileSync(ORIG, base);
  try { O = await import(pathToFileURL(ORIG).href); } finally { unlinkSync(ORIG); }
  ok(cur !== sha(base), `0. the code under test (solve.js ${cur}) is not the base it is compared with (${BASE}, solve.js ${sha(base)})`);
}

const LAMBDA = 0.0223606797749979, LIGHT = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const P = Object.fromEntries(readPanel().map(h => [h.id, h]));
const planOf = id => E.resolveMpaa(E.normalizePlan({ ...P[id].plan, config: { ...P[id].plan.config, guardrails: false, lookaheadYears: 0 } }));
const hashOf = r => { const h = createHash('sha256'), seen = new Set(); let k = 0; const walk = o => { if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o); if (ArrayBuffer.isView(o)) { k++; h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; } if (Array.isArray(o)) { o.forEach(walk); return; } for (const key of Object.keys(o).sort()) walk(o[key]); }; walk(r.tablesW); return { hash: h.digest('hex').slice(0, 16), k }; };
// the five routes: the candidate's settings as Phase 4 read them (failDelivered off unless a check sets it), the product's
const CAND = { ...PHASE4_OPTS, ...LIGHT }, PROD = { lambda: LAMBDA, points: 4, failureShortfall: true };
const ROUTES = {
  TERN: { plan: id => planOf(id), opts: { ...PROD, levelSearch: 'ternary' } },
  E5: { plan: id => candidatePlan(E, planOf(id)), opts: CAND },
  TSLOOP: { plan: id => candidatePlan(E, planOf(id)), opts: { ...CAND, tsOnce: false } },
  JOINT: { plan: id => candidatePlan(E, planOf(id)), opts: { ...CAND, riskConsent: false } },
  PASS2: { plan: id => planOf(id), opts: PROD }
};
// each route must reach its own site: what the solve recorded
const reached = (route, r) => ({ TERN: r.meta.levelSearch === 'ternary', E5: !!r.meta.tierState && r.meta.tsOnce === true, TSLOOP: !!r.meta.tierState && r.meta.tsOnce === false,
  JOINT: !r.meta.tierState && !!r.meta.tierStateOff && !!r.meta.jointWorlds, PASS2: !r.meta.tierState && r.meta.levelSearch !== 'ternary' && !r.meta.jointWorlds })[route];
const NEW = (route, id, x) => solvePlan(E, M, ROUTES[route].plan(id), { ...ROUTES[route].opts, ...x });
const OLD = (route, id, x) => O.solvePlan(E, M, ROUTES[route].plan(id), { ...ROUTES[route].opts, ...x });

for (const route of Object.keys(ROUTES)) {
  const r0 = NEW(route, 'S090', { failDelivered: false }), off = hashOf(r0);
  if (FULL) { const b = hashOf(OLD(route, 'S090', {})); ok(off.hash === b.hash && off.k > 0 && !r0.meta.failDelivered, `1. S090 ${route}: with failDelivered off the ${off.k} tables hash ${off.hash}, as at ${BASE} (${b.hash})`); }
  const r1 = NEW(route, 'S090', { failDelivered: true }), on = hashOf(r1), pl = hashOf(NEW(route, 'S090', { failDelivered: true, failDeliveredPlant: 'nounmet' }));
  ok(on.hash !== off.hash && r1.meta.failDelivered === true && reached(route, r0) && reached(route, r1), `2. S090 ${route}: with it on the tables hash ${on.hash}, not ${off.hash} (meta.failDelivered ${r1.meta.failDelivered}; the route ${reached(route, r1) ? 'reached' : 'NOT REACHED'})`);
  ok(pl.hash !== on.hash, `3. S090 ${route}: with the unmet ignored (planted) ${pl.hash}, not ${on.hash}`);
}
if (FULL) {
  const a = hashOf(NEW('E5', 'S304F', { failDelivered: false })), b = hashOf(OLD('E5', 'S304F', {}));
  ok(a.hash === b.hash && a.k > 0, `1. S304F E5: with failDelivered off the ${a.k} tables hash ${a.hash}, as at ${BASE} (${b.hash})`);
  const c = hashOf(NEW('E5', 'S090', { failDelivered: false })), d = hashOf(OLD('E5', 'S090', { lambda: LAMBDA * (1 + 1e-9) }));
  ok(c.hash !== d.hash, `1. planted: lambda x (1 + 1e-9) at ${BASE} hashes ${d.hash}, not ${c.hash}`);
}
{ let err = null; try { NEW('PASS2', 'S090', { failDelivered: true, failureShortfall: false }); } catch (e) { err = e.message; }
  ok(err && /needs failureShortfall/.test(err), `4. failDelivered without failureShortfall is refused: ${err || 'NOT REFUSED'}`); }
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
