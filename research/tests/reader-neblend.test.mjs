/*
 * NE-BLEND's two reader arms (`readerSplit: 'rz'`, `readerBlend: 'logodds'`; solve.js and grid.js, research only; PLAN.md
 * NE-BLEND): each acts only in a bridge year. S224 has none (it retires at 60, its pension access 58), so its tables are
 * bit for bit BASE's under either arm; S380 (eight bridge years) is the planted case where the same check must fail.
 * e3pcls off (declared): the check is of the reader's arms, not e3's copy.
 *   node research/tests/reader-neblend.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { candidatePlan, CANDIDATE_OPTS } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const all = buildScenarios();
const planOf = id => { const h = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } })); };
const solve = (id, extra) => solvePlan(E, M, candidatePlan(E, planOf(id)), { ...CANDIDATE_OPTS, e3pcls: false, lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, ...extra });
const surv = r => { const s0 = M.initialState(r.m); return r.worlds.map(wd => wd.value(s0, 0).survival); };
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
for (const id of ['S224', 'S380']) {
  const base = surv(solve(id, {})), rz = surv(solve(id, { readerSplit: 'rz' })), lor = surv(solve(id, { readerBlend: 'logodds' }));
  if (id === 'S224') ok(same(base, rz) && same(base, lor), `S224 (no bridge year): its year-0 survival in every world is BASE's bit for bit under RZ and LOR (${base.map(x => x.toFixed(6)).join(', ')})`);
  else ok(!same(base, rz) && !same(base, lor), `planted: S380 (eight bridge years) moves under RZ and LOR, so the identity check can fail (BASE ${base.map(x => x.toFixed(4)).join(', ')}; RZ ${rz.map(x => x.toFixed(4)).join(', ')}; LOR ${lor.map(x => x.toFixed(4)).join(', ')})`);
}
const meta = solve('S380', { readerSplit: 'rz', readerBlend: 'logodds' }).meta;
ok(meta.readerSplit === 'rz' && meta.readerBlend === 'logodds', 'the solve\'s meta carries both arms');
assert.throws(() => solve('S380', { readerBlend: 'linear' }), /only 'logodds'/); assert.throws(() => solve('S380', { readerBlend: 'logodds', bridgeRead: false, bridgeStep: undefined }), /need the bridge reader/);
ok(true, 'an unknown blend, and a blend without the reader, are refused');
console.log(`reader-neblend: ${n} checks passed`);
