/*
 * THE TIER ABOVE, EXECUTED BY THE ENGINE (the external review of 21 Oct, F2a; Part B Step 1, item 5). The solver lists a
 * wrapper's tiers as the plan's, up to two below, then (tiersAbove) the tiers above, so index 3 is "one above"; the engine's
 * list for a solved table stopped below the plan's tier and clamped the index, so index 3 grew at the lowest tier. Now the
 * engine's list is the solver's, and the table names its tiers. On S070 with its pension and ISA held at Medium Risk and
 * risk above on (consent is the default):
 *   1. the engine's lists for the pension and the ISA begin with the solver's, name by name (the engine lists every tier
 *      above; the solver takes `tiersAbove` of them, so every index it can choose means the same tier);
 *   2. along 200 paths of the real table, every year the table holds index 3 the engine grows the pension at Medium/High
 *      (and every year at index k, at the solver's tier k); at least one such year must occur;
 *   3. a fixed move at index 3 gives, year by year, the pots of the same move on the plan held at Medium/High (index 0);
 *   4. planted: the old list (no tiers above) with the names off - check 3 must see the difference; a move naming a tier
 *      the engine's list does not hold at that index must throw.
 *   node research/tests/tier-above.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { withTable, tablePolicy } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

const sc = buildScenarios().find(s => s.id === 'S070');
const at = (p, pen, isa) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, accounts: p.accounts.map(x => (/^Pensions/.test(x.category) ? { ...x, risk: pen } : /^S&S ISA/.test(x.category) ? { ...x, risk: isa } : x)) }));
const med = at(sc.plan, 'Medium Risk', 'Medium Risk');
const r = solvePlan(E, M, med, { lambda: 0.5, points: 8, riskAbove: true });
const names = cat => r.c.tiers[cat].map(x => x.name);
ok(JSON.stringify(names('pen')) === JSON.stringify(['Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Medium/High Risk']), `the solver's pension tiers, held at Medium with risk above: ${names('pen').join(', ')}`);

// 1. the engine's lists
const ctx = E.buildContext(withTable(med, r));
const penId = ctx.accounts.find(a => a.owner === 'self' && a.cat === 'pen').id, isaId = ctx.accounts.find(a => a.owner === 'self' && a.cat === 'isa').id;
for (const [cat, id] of [['pen', penId], ['isa', isaId]]) {
  const eng = ctx.tierProfiles[id].map(x => x.name);
  ok(JSON.stringify(eng.slice(0, names(cat).length)) === JSON.stringify(names(cat)), `the engine's ${cat} list begins with the solver's: ${eng.join(', ')}`);
}

// 2. the real table along 200 paths: the tier the engine grew the pension at, against the solver's tier at that index
const T = ctx.totalYears, paths = E.pathsForSeed(424242, 200, T);
let years = 0, above = 0, wrong = 0, firstWrong = '';
for (const zs of paths) {
  const st = E.freshState(ctx), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
  for (let t = 0; t <= T; t++) {
    const row = E.stepYear(ctx, st, t, { z: zs[t], zPath });
    years++;
    if (row.tierPen === 3) above++;
    if (row.tierPenName !== names('pen')[row.tierPen] || row.tierIsaName !== names('isa')[row.tierIsa]) { wrong++; if (!firstWrong) firstWrong = `year ${t}: pension index ${row.tierPen} grown at ${row.tierPenName}`; }
  }
}
ok(above > 0 && wrong === 0, `200 paths, ${years} years: the table held the tier above in ${above}, and every year each wrapper grew at the solver's tier for its index (mismatches ${wrong}${firstWrong ? `, first ${firstWrong}` : ''})`);

// 3. a fixed move at index 3 against the same move on the plan held at Medium/High (index 0); no switch charge
const fixed = tablePolicy(r).choose(E.freshState(ctx), 0, null);
const potsOf = (plan, move, mutate = null) => {
  const c2 = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => move, switchCost: 0 } } });
  if (mutate) mutate(c2);
  return E.simulateDeterministic(c2, 'expected').map(row => row.totalCombined);
};
const mh = at(sc.plan, 'Medium/High Risk', 'Medium Risk');   // the pension held at Medium/High, the ISA at Medium as in `med`
const ref = potsOf(mh, { ...fixed, tierPen: 0, tierPenName: 'Medium/High Risk', tierIsa: 0, tierIsaName: 'Medium Risk' });
const near = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= 1e-9 * Math.max(1, Math.abs(b[i])));
const up = potsOf(med, { ...fixed, tierPen: 3, tierPenName: 'Medium/High Risk', tierIsa: 0, tierIsaName: 'Medium Risk' });
ok(near(up, ref), `index 3 on the Medium plan gives the Medium/High plan's pots every year (final ${up[T].toFixed(0)} against ${ref[T].toFixed(0)})`);

// 4. planted: the old list (the plan's tier and two below, no names): check 3 must see the difference
const old = potsOf(med, { ...fixed, tierPen: 3, tierPenName: undefined, tierIsa: 0, tierIsaName: undefined }, c2 => { for (const id of Object.keys(c2.tierProfiles)) c2.tierProfiles[id] = c2.tierProfiles[id].slice(0, 3); });
ok(!near(old, ref), `planted: with the old list, index 3 grows at ${'Low Risk'} and check 3 sees it (final ${old[T].toFixed(0)} against ${ref[T].toFixed(0)})`);
let msg = '';
try { potsOf(med, { ...fixed, tierPen: 3, tierPenName: 'Low Risk', tierIsa: 0, tierIsaName: 'Medium Risk' }); } catch (e) { msg = e.message; }
ok(/table move: tier 3 of .* is Medium\/High Risk in the engine but Low Risk in the table/.test(msg), `planted: a move naming the wrong tier throws (${msg || 'it did not throw'})`);

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} tier-above checks failed`);
