/*
 * THE SOLVE'S PROGRESS HOOK (Part C Phase 7, research/solver/PHASE-7.md step 7a): `opts.progress({ phase, done, total,
 * pass })`, called by solve() once per solved year ('years') and by the adaptive reference's build once per bridge year
 * ('reference'), and labelled by the 'auto' risk rule with the solve it is in (`pass`). It feeds the app's progress bar
 * and must change nothing the solve computes.
 *   1. identity: every typed array of the result the same bit for bit with the hook and without it, on the product's path
 *      (S224, the 'auto' rule) and the candidate's (S370, the adaptive reference at a light lattice);
 *   2. the calls: within each pass and phase, done rises by one from 1 to total; the candidate reports the reference's
 *      build and the years; the product's path labels its pass;
 *   3. planted: the identity's hash parts a solve at lambda x 2 (on the product's path lambda only ranks the moves, so a
 *      change as small as fail-delivered.test.mjs's can leave every table as it was), and the calls' check refuses a
 *      sequence with a repeated year.
 *   node research/tests/solver-progress.test.mjs
 */
// e3pcls guard: the candidate's solves below compare tables with the hook and without it on this code; e3pcls's own exactness is solver-e3pcls.test.mjs's, which retakes the pin
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { CANDIDATE_OPTS, candidatePlan } from '../solver/candidate.mjs';
import { checkE3pclsPin } from '../solver/e3pcls-pin.mjs';
import { LAMBDA } from '../solver/panel-7uf.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const all = buildScenarios();
// the floor at 80% of the target, as speed-port.test.mjs and e2.test.mjs set it: without one the product's path has no cut
// level, and lambda, which only prices cuts, could not move a table (the plant below needs it to)
const planOf = id => { const h = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } })); };
checkE3pclsPin({ ...CANDIDATE_OPTS });
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const ARMS = {
  PRODUCT: id => [planOf(id), { lambda: LAMBDA, points: 4 }],
  CAND: id => [candidatePlan(E, planOf(id)), { ...CANDIDATE_OPTS, ...LIGHT, lambda: LAMBDA, points: 4 }]
};
/* every typed array reachable from the result but the model (the engine's functions), in key order */
const hashOf = r => {
  const h = createHash('sha256'), seen = new Set(); let k = 0;
  const walk = o => {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    if (ArrayBuffer.isView(o)) { k++; h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; }
    if (o instanceof Map) { for (const v of o.values()) walk(v); return; }
    if (Array.isArray(o)) { o.forEach(walk); return; }
    for (const key of Object.keys(o).sort()) if (key !== 'm' && key !== 'E') walk(o[key]);
  };
  walk(r);
  return { hash: h.digest('hex').slice(0, 16), k };
};
/* within each pass and phase, done must run 1, 2, ..., total */
const callsOk = calls => {
  const by = new Map();
  for (const c of calls) { const key = `${c.pass || ''}|${c.phase}`; if (!by.has(key)) by.set(key, []); by.get(key).push(c); }
  for (const seq of by.values()) {
    if (!seq.every((c, i) => c.done === i + 1 && c.total === seq[0].total)) return false;
    if (seq[seq.length - 1].done !== seq[0].total) return false;
  }
  return by.size > 0;
};

for (const [arm, id] of [['PRODUCT', 'S224'], ['CAND', 'S370']]) {
  const [plan, opts] = ARMS[arm](id);
  const calls = [];
  const a = hashOf(solvePlan(E, M, plan, opts)), r = solvePlan(E, M, plan, { ...opts, progress: x => calls.push(x) }), b = hashOf(r);
  ok(a.hash === b.hash && a.k > 0, `1. ${id} ${arm}: the ${a.k} arrays hash ${a.hash} without the hook and ${b.hash} with it`);
  const phases = [...new Set(calls.map(c => c.phase))], passes = [...new Set(calls.map(c => c.pass).filter(Boolean))];
  const want = arm === 'CAND' ? phases.includes('reference') && phases.includes('years') : passes.length > 0;
  ok(callsOk(calls) && want, `2. ${id} ${arm}: ${calls.length} calls, phases ${phases.join(', ')}${passes.length ? `, passes ${passes.join('; ')}` : ''}; each runs 1 to its total (${r.meta.riskAbove ? r.meta.riskAbove.decision : 'no auto rule'})`);
  if (arm === 'PRODUCT') {
    const c = hashOf(solvePlan(E, M, plan, { ...opts, lambda: LAMBDA * 2 }));
    ok(c.hash !== a.hash, `3. planted: lambda x 2 hashes ${c.hash}, not ${a.hash}`);
    const bad = calls.slice(); const i = bad.findIndex(x => x.phase === 'years' && x.done === 3); bad.splice(i + 1, 0, { ...bad[i] });
    ok(!callsOk(bad), '3. planted: a repeated year fails the calls\' check');
  }
}
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
