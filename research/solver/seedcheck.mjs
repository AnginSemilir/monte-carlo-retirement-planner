/*
 * IS THE SEARCH SAMPLE EASIER, OR ONLY SMALLER?  (plan: the floor landing)
 *
 *   node research/solver/seedcheck.mjs <bandIndex> [<bandIndex> ...]
 *
 * This separates the two things that make a landing chosen on search paths miss on held-out ones:
 * sampling error in a small sample, and selection bias from picking the largest lambda that clears it.
 * It runs the SAME fixed policy - the gkFloor arm's own chosen move, so no lambda selection is
 * involved - across several path samples. Any difference is the sample, not the choice.
 *
 * CAVEAT when reading several households at once: pathsForSeed builds path i deterministically from
 * the seed, so every household of a given horizon sees the SAME draws. Four households agreeing is one
 * sample observed four times, not four observations.
 *
 * Is the 600-path search sample systematically easier than the 3,000-path held-out sample, or just
 * noisy? Run the SAME fixed policy (the gkFloor arm's own chosen move) on both, plus fresh seeds.
 * Forward runs only, no solves.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync(HERE + '/results/band-70-98-7001.json', 'utf8'));

const world = (c, z, out, act, t, zp = 0) => {
  const r = act ? act.real : c.real, v = act ? act.volEffAt[t] : c.volEffAt[t], sg = act ? act.sigma : c.sigma;
  for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + r[i]) + sg[i] * zp + v[i] * z) - 1;
  return out;
};
function survives(c, ai, zs) {
  const m = c.m, s = c.rule ? F.withRuleSlots(vecOf(m, M.initialState(m))) : vecOf(m, M.initialState(m));
  const real = new Float64Array(4);
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    const unmet = F.flow(c, t, ai, s);
    if (unmet > 1 || c.last.preNmpaInsolvent) return false;
    world(c, zs[t], real, c.acts[ai], t, zs.length > m.ctx.totalYears + 1 ? zs[m.ctx.totalYears + 1] : 0);
    F.grow(c, t, s, real);
  }
  return !(m.ctx.solvencyFloor > 0 && s[0] + s[1] + s[2] < m.ctx.solvencyFloor);
}
const rate = (c, ai, zsAll) => 100 * zsAll.filter(z => survives(c, ai, z)).length / zsAll.length;

const want = process.argv.slice(2);
console.log('household   the gkFloor arm\'s own move, floor rate by path sample');
console.log('            search 7001/600   held 7002/3000   7001/3000   fresh 9001/3000   fresh 9002/3000');
for (const idx of want) {
  const b = band[Number(idx)];
  const sc = singles[b.i];
  const res = JSON.parse(readFileSync(`${HERE}/results/flex-mix/${sc.id}.json`, 'utf8'));
  const raw = JSON.parse(JSON.stringify(sc.plan));
  const target = E.num(raw.spending.targetSpend, 0), floorSpend = Math.round(target * 0.8);
  const plan = E.resolveMpaa(E.normalizePlan({ ...raw, config: { ...raw.config, guardrails: true, lookaheadYears: 0 },
    spending: { ...raw.spending, floorSpend, floorConfidence: res.confidence * 100 } }));
  const m = M.prepare(E, plan); m.shiftZ = 0;
  const menu = buildActions(); const c = F.compile(m, menu);
  const ai = menu.findIndex(a => a.label === res.gkFloor.label);
  const yrs = m.ctx.totalYears;
  const sets = [['7001', 600], ['7002', 3000], ['7001b', 3000], ['9001', 3000], ['9002', 3000]];
  const out = sets.map(([tag, n]) => rate(c, ai, E.pathsForSeed(Number(tag.replace('b', '')), n, yrs)));
  console.log(`${sc.id}      ` + out.map(v => v.toFixed(2).padStart(9)).join('   ') + `   (recorded held ${res.gkFloor.floorRate.toFixed(2)})`);
}
