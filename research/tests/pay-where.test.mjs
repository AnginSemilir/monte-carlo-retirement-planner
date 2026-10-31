/*
 * PAYING WHERE ONE PAYS (`payWhereOnePays`; STATE.md D46, FD-RAISE; the deep review of 30 Oct, reviews/2026-10-30-deep-
 * fail-delivered.md section 4, its CANDDP arm). The option's tests (CHECKLIST 5), on S050 and S340F of Phase 4's panel (the
 * design review of 29 Oct measured the most failing cells there) at the light settings, along the four exhaustive routes to
 * the backward pass's argmax: E5 (the candidate's tier state, one pass), TSLOOP (its layer loop), JOINT (consent withdrawn:
 * the joint worlds without the tier state), PASS2 (the product's settings with the failure year at what it can pay):
 *   1. the count alone (`countFailPicks`): every table the same as without it, at 4 wealth points on both households;
 *   2. at 12 points on S050 (at 4 and 8 the grid has no cell between paying the floor and paying 110% a year before ruin:
 *      none is counted), the count finds layer-cells that store a failing move while a paying one exists (meta.failPicks),
 *      and with the option there is none and the tables differ; meta records the option;
 *   3. planted: 'onesite' (the tier state's one-pass phase B left without the skip) leaves failing picks on E5 at 12 points,
 *      and the ternary level search refuses the option;
 * and with --full, on the code before the option (BASE, the last commit of src/solver/solve.js before it) as
 * src/solver/_orig_solve.js, the two first checked to differ:
 *   0. the code under test is not BASE's;
 *   4. identity: with the option unset, every table the same bit for bit as BASE's on every route on S050; planted, lambda x 2
 *      at BASE must differ.
 *   node research/tests/pay-where.test.mjs [--full]
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
import { candidatePlan, CANDIDATE_OPTS } from '../solver/candidate.mjs';
import { checkE3pclsPin } from '../solver/e3pcls-pin.mjs';
import { readPanel } from '../solver/phase4-panel.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..'), FULL = process.argv.includes('--full');
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
checkE3pclsPin({ ...CANDIDATE_OPTS });
const BASE = '6367017';
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
const CAND = { ...CANDIDATE_OPTS, ...LIGHT }, PROD = { lambda: LAMBDA, points: 4, failureShortfall: true, failDelivered: true };
const ROUTES = {
  E5: { plan: id => candidatePlan(E, planOf(id)), opts: CAND },
  TSLOOP: { plan: id => candidatePlan(E, planOf(id)), opts: { ...CAND, tsOnce: false } },
  JOINT: { plan: id => candidatePlan(E, planOf(id)), opts: { ...CAND, riskConsent: false } },
  PASS2: { plan: id => planOf(id), opts: PROD }
};
const reached = (route, r) => ({ E5: !!r.meta.tierState && r.meta.tsOnce === true, TSLOOP: !!r.meta.tierState && r.meta.tsOnce === false,
  JOINT: !r.meta.tierState && !!r.meta.tierStateOff && !!r.meta.jointWorlds, PASS2: !r.meta.tierState && !r.meta.jointWorlds })[route];
const NEW = (route, id, x = {}) => solvePlan(E, M, ROUTES[route].plan(id), { ...ROUTES[route].opts, ...x });
const OLD = (route, id, x = {}) => O.solvePlan(E, M, ROUTES[route].plan(id), { ...ROUTES[route].opts, ...x });

for (const id of ['S050', 'S340F']) for (const route of Object.keys(ROUTES)) {
  const r0 = NEW(route, id), off = hashOf(r0);
  if (FULL && id === 'S050') { const b = hashOf(OLD(route, id)); ok(off.hash === b.hash && off.k > 0 && !r0.meta.payWhereOnePays, `4. ${id} ${route}: with the option unset the ${off.k} tables hash ${off.hash}, as at ${BASE} (${b.hash})`); }
  const rc = NEW(route, id, { countFailPicks: true }), cnt = hashOf(rc);
  ok(cnt.hash === off.hash && rc.meta.failPicks >= 0 && reached(route, r0), `1. ${id} ${route} at 4 points: counted alone (${rc.meta.failPicks} failing picks), the tables the same (${cnt.hash}); the route ${reached(route, r0) ? 'reached' : 'NOT REACHED'}`);
}
for (const route of Object.keys(ROUTES)) {
  const rc = NEW(route, 'S050', { countFailPicks: true, points: 12 }), picks = rc.meta.failPicks, off = hashOf(rc);
  const r1 = NEW(route, 'S050', { payWhereOnePays: true, points: 12 }), on = hashOf(r1);
  ok(picks > 0 && r1.meta.failPicks === 0 && r1.meta.payWhereOnePays === true && on.hash !== off.hash, `2. S050 ${route} at 12 points: ${picks} layer-cells store a failing move where one pays; with the option ${r1.meta.failPicks}, and the tables differ (${on.hash}, not ${off.hash})`);
  if (route === 'E5') { const pl = NEW(route, 'S050', { payWhereOnePays: true, payWhereOnePaysPlant: 'onesite', points: 12 }); ok(pl.meta.failPicks > 0, `3. S050 E5 at 12 points, planted: phase B without the skip leaves ${pl.meta.failPicks} failing picks`); }
}
{ let err = null; try { NEW('PASS2', 'S050', { payWhereOnePays: true, levelSearch: 'ternary' }); } catch (e) { err = e.message; }
  ok(err && /ternary level search/.test(err), `3. the ternary level search refuses the option: ${err || 'NOT REFUSED'}`); }
if (FULL) { const c = hashOf(NEW('PASS2', 'S050')), d = hashOf(OLD('PASS2', 'S050', { lambda: LAMBDA * 2 })); ok(c.hash !== d.hash, `4. planted: lambda x 2 at ${BASE} hashes ${d.hash}, not ${c.hash}`); }
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
