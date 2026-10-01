/*
 * THE SIGNED YEAR-0 GAP (research/solver/signed-gap.mjs; O74; PLAN.md 7aq). On a small P solve of S126 (READER/TS+J,
 * switchCharge 0.001, switchMargin 0, 7am's settings at 8 points) and the bundle's (switchMargin 0.001 left at its
 * default, no charge), on one path, for every tier pair the household could hold:
 * at each of the path's first 8 years:
 *   A. the signed gap agrees with the bisected one (crossCheck) - positive where the held pair needs a margin, 0 or below
 *      where it wins at margin 0 - and the held pair the chooser keeps at margin 0 has a signed gap of 0 or below;
 *   B. both signs occur (a check that ran on one side only is not a check);
 *   C. planted faults are refused by the cross-check: the charge left out, the sign flipped, the held pair's best taken
 *      from the moves that leave it, and the mixture's weights ignored.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { signedGap, bisectedGap, crossCheck } from '../solver/signed-gap.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const s126 = buildScenarios().find(s => s.id === 'S126');
const src = s126.plan;
const plan = E.resolveMpaa(E.normalizePlan({ ...src, config: { ...src.config, guardrails: false, lookaheadYears: 0 }, spending: { ...src.spending, floorSpend: Math.round(0.8 * E.num(src.spending.targetSpend, 0)) } }));
const YEARS = 8;
const base = { lambda: 0.0223606797749979, points: 8, bridgeRead: 'reader', bequestWeight: 0.02, tierState: true, jointWorlds: true };

// a faulty signed gap for the plants: f(SC per table, weights) with one change
function faulty(r, s, t, held, how) {
  const n = r.actions.length, acts = r.c.acts, sc = how === 'nocharge' ? 0 : r.switchCharge || 0;
  const SC = new Float64Array(n), S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
  r.mix.tables.forEach((tab, k) => { scoreMoves(tab, s, t, S2, T2, B2, held); const w = how === 'noweights' ? (k === 0 ? 1 : 0) : r.mix.weights[k]; for (let ai = 0; ai < n; ai++) SC[ai] = S2[ai] === -Infinity || SC[ai] === -Infinity ? -Infinity : SC[ai] + w * S2[ai]; });
  let stay = -Infinity, move = -Infinity;
  for (let ai = 0; ai < n; ai++) {
    if (SC[ai] === -Infinity) continue;
    const keeps = acts[ai].tierPen === held.pen && acts[ai].tierIsa === held.isa;
    if (keeps !== (how === 'swapped')) stay = Math.max(stay, SC[ai]); else move = Math.max(move, SC[ai] - sc);
  }
  return how === 'flipped' ? stay - move : move - stay;
}

for (const [name, opts] of [['P', { switchMargin: 0, switchCharge: 0.001 }], ['the bundle', {}]]) {
  console.log(`=========== ${name} ===========`);
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { ...base, ...opts });
  const zs = E.pathsForSeed(7002, 1, r.m.ctx.totalYears)[0];
  // the path's own positions in its first YEARS years (the years before the final one), every tier pair held at each
  const at = [];
  runPolicy(r, zs, { choose: (t, st, held) => { if (t < YEARS && t < r.m.ctx.totalYears && !at[t]) at[t] = { s: Float64Array.from(st), h: { ...held } }; return chooseAction(r, st, t, held); } });
  const tiers = [...new Set(r.c.acts.map(a => `${a.tierPen},${a.tierIsa}`))].map(k => k.split(',').map(Number));
  const cases = at.flatMap(({ s, h }, t) => tiers.map(([pen, isa]) => ({ t, s, held: { ...h, pen, isa } })));
  console.log(`  solved in ${((Date.now() - t0) / 1000).toFixed(1)} s; ${tiers.length} tier pairs at ${at.length} years: ${cases.length} cases`);
  let neg = 0, pos = 0, bad = [];
  const plants = { nocharge: 0, flipped: 0, swapped: 0, noweights: 0 };
  for (const { t, s, held } of cases) {
    const sg = signedGap(r, s, t, held), bg = bisectedGap(r, s, t, held), e = crossCheck(sg.gap, bg);
    if (e) bad.push(`year ${t} ${held.pen},${held.isa}: ${e}`);
    if (sg.gap <= 0) neg++; else pos++;
    const kept = r.c.acts[chooseAction(r, s, t, held)];
    if (kept.tierPen === held.pen && kept.tierIsa === held.isa && r.switchMargin === 0 && !(sg.gap <= 1e-9)) bad.push(`year ${t} ${held.pen},${held.isa}: kept at margin 0 with a signed gap ${sg.gap}`);
    for (const how of Object.keys(plants)) if (how !== 'nocharge' || r.switchCharge > 0) if (crossCheck(faulty(r, s, t, held, how), bg)) plants[how]++;
  }
  ok(`A  ${name}: the signed gap agrees with the bisected one on all ${cases.length} cases`, !bad.length, bad.slice(0, 3).join('; '));
  ok(`B  ${name}: both signs occur (${neg} at or below 0, ${pos} above)`, neg > 0 && pos > 0);
  for (const [how, k] of Object.entries(plants)) {
    if (how === 'nocharge' && !(r.switchCharge > 0)) continue;
    ok(`C  ${name}: the plant '${how}' is refused on at least one case`, k > 0, `${k} of ${cases.length}`);
  }
}
ok('D  signedGap refuses a solve without the mixture', (() => { try { signedGap({ mix: null }, null, 0, {}); return false; } catch { return true; } })());
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
