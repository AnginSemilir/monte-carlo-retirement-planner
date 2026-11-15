/*
 * D97 (2): A COUPLE'S TIE RULE ABOVE THE ESTATE CAPS (couple.js chooseJoint, solveCouple's opts.tieJoint; an option, off in
 * code; research/solver/TIE-C.md reads it). Where both people's wealth is above their tables' estate caps, among the joint moves
 * at the best move's spending level and each person's tier pair that score within the margin of it, the one paying the least
 * tax this year, then the larger household wealth after the move.
 *   1. the option unset: S007's joint value at the start and its engine runs on 20 paths the code before the option's, bit for
 *      bit (couple-estate.test.mjs check 1's digest, taken at 4380aa81); cp carries no margin and its record none
 *   2. above both caps (S007's state along a path with every pot eight times what it holds, years 1 to 20): with the rule on at
 *      1e-4 and at 0.01 (the widest the option allows, where moves at other spending levels come within it), every decision that
 *      differs from the rule off keeps the best move's level and each person's tier pair, scores within the margin of it and pays
 *      no more tax this year (the exact model's row); and the rule acts at both
 *   3. at or below either cap (S007 as it stands, years 0 to 20 along the same path): the rule on picks the rule off's move at
 *      every decision; and in the plan's last year, above the caps, too
 *   4. the engine and the rollout in step under the rule: S007 solved with each person's estate cap at £300,000 (both above it
 *      from the start), 10 paths, the engine's run and runCouplePolicy alike in survival and within a pound at the end, and the
 *      rule acting on those paths
 *   5. the refusals: a margin below 0 or above 0.01
 *   6. the pick by hand (couple.js tiePick): among a move at another level, one at another tier pair, one outside the margin,
 *      one paying the best's tax with more wealth left and one paying less tax, all but the third paying less than the best,
 *      the rule takes the one paying less tax at the best's level and tier pairs within the margin; with no such move, the best
 * Plants (COUPLE.plant): 'tieanylevel' (the level and tier-pair rule dropped) fails check 6; 'tieanywhere' (the caps' test
 * dropped) fails check 3. --planted runs both and reads which fail. On S007 the moves on offer within even the widest margin
 * never pay less tax at another level or tier pair, so check 2 alone cannot see the first plant; check 6 does.
 *   node research/tests/couple-tie.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { prepareForSolve } from '../../src/solverSettings.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['tieanylevel', ['6']], ['tieanywhere', ['3']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_TIE_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { bad++; console.log(r.stdout + r.stderr); }
  }
  process.exit(bad ? 1 : 0);
}
const { solveCouple, withCouple, chooseJoint, runCouplePolicy, ratesFor, COUPLE } = CPL;
const PLANT = process.env.COUPLE_TIE_PLANT || '';
COUPLE.plant = PLANT;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-tie: a couple's tie rule above the estate caps (D97 (2))${PLANT ? `; planted: ${PLANT}` : ''}`);
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const S007 = prepareForSolve(E, E.normalizePlan(buildScenarios().find(s => s.id === 'S007').plan));
const memo = new Map();
const one = research => (p, o) => { const k = JSON.stringify([p, o.partnerAge0, research]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: 4, research: { ...LIGHT, ...research }, ageWith: o.partnerAge0 })); return memo.get(k); };
const MARGIN = 1e-4;
const tiersOf = j => ['self', 'part'].map(w => `${j.perOwner[w].tierPen || 0}/${j.perOwner[w].tierIsa || 0}`).join(' ');
// the joint move's own year in the exact model: the tax it pays (as the rollout counts it)
const taxOf = (cp, state, j, t) => { const st = M.cloneState(state), row = M.step(cp.m, st, j, t, null, true); return row.taxPaid + row.cgtPaid; };
const same = (a, b) => a.spendLevel === b.spendLevel && a.split === b.split && JSON.stringify(a.perOwner) === JSON.stringify(b.perOwner) && JSON.stringify(a.steps) === JSON.stringify(b.steps);

// ---- 1. the option unset ----
const off = solveCouple(E, M, S007, { solveOne: one({}) }), on = solveCouple(E, M, S007, { solveOne: one({}), tieJoint: MARGIN });
{
  const BEFORE = '4410b47199e2b9207f1ef57b1ef294b97e736c877e950c3309ea860fb9b56954', N = 20;
  const ctx = E.buildContext(withCouple(off.plan, off)), paths = E.pathsForSeed(7002, N, ctx.totalYears);
  const v = new Float64Array(1 + 3 * N);
  v[0] = chooseJoint(off, off.M.initialState(off.m), 0).score;
  paths.forEach((zs, k) => { const o = E.runTrial(ctx, zs); v[1 + 3 * k] = o.survived ? 1 : 0; v[2 + 3 * k] = o.terminalPotNet; v[3 + 3 * k] = o.lifetimeTax; });
  const dig = createHash('sha256').update(Buffer.from(v.buffer)).digest('hex');
  ok(1, 'the option unset: S007\'s joint value at the start and its engine runs on 20 paths the code before the option\'s, bit for bit; no margin carried or recorded',
    dig === BEFORE && off.tieJoint === undefined && off.meta.tieJoint === undefined && on.tieJoint === MARGIN && on.meta.tieJoint === MARGIN, `${dig.slice(0, 16)} against ${BEFORE.slice(0, 16)}; on: margin ${on.tieJoint}`);
}

// a path of S007's states under the rule off, each year's state kept (the exact model's market, the path's own draws)
const T = off.m.ctx.totalYears, zs = E.pathsForSeed(7002, 1, T)[0];
const states = [];
{ const st = M.initialState(off.m); for (let t = 0; t <= T; t++) { states.push(M.cloneState(st)); const j = chooseJoint(off, st, t); M.step(off.m, st, j, t, ratesFor(off.m, zs, t, st)); } }
// both people above their caps, as chooseJoint reads it (couple.js aboveCaps on each person's vector)
const above = st => CPL.aboveCaps(off.tables, vecOf(off.tables.self.m, CPL.ownerState(st, 'self')), vecOf(off.tables.part.m, CPL.ownerState(st, 'part')));
const scaled = (st, f) => { const s = M.cloneState(st); for (const k of Object.keys(s.pots)) s.pots[k] *= f; for (const w of Object.keys(s.basis || {})) s.basis[w] *= f; for (const w of Object.keys(s.cashIsa || {})) s.cashIsa[w] *= f; return s; };

// ---- 2. above both caps, at the margin and at the widest the option allows ----
{
  // each person's six best-ranked moves (couple.js topK, 2 in the app), so the joint moves offered span other levels and tier
  // pairs, which the rule must not take: the same tables, the rule off and on at the two margins
  const K = 6, off6 = solveCouple(E, M, S007, { solveOne: one({}), topK: K }), on6 = solveCouple(E, M, S007, { solveOne: one({}), topK: K, tieJoint: MARGIN }), wide = solveCouple(E, M, S007, { solveOne: one({}), topK: K, tieJoint: 0.01 });
  let spread = 0;
  const at = (cp, margin) => {
    let acted = 0, decisions = 0; const bad = [];
    for (let t = 1; t <= Math.min(20, T - 1); t++) {
      const st = scaled(states[t], 8);
      if (!above(st)) { bad.push(`year ${t}: the state is not above both caps`); continue; }
      const a = chooseJoint(off6, st, t), b = chooseJoint(cp, st, t);
      decisions++;
      if (same(a, b)) continue;
      acted++;
      const ta = taxOf(off6, st, a, t), tb = taxOf(cp, st, b, t), why = [];
      if (b.spendLevel !== a.spendLevel) why.push(`level ${b.spendLevel} not ${a.spendLevel}`);
      if (tiersOf(b) !== tiersOf(a)) why.push(`tiers ${tiersOf(b)} not ${tiersOf(a)}`);
      if (b.score < a.score - margin - 1e-15) why.push(`score ${b.score} below ${a.score} by more than the margin`);
      if (tb > ta + 1e-9) why.push(`tax ${tb.toFixed(2)} above ${ta.toFixed(2)}`);
      if (why.length) bad.push(`year ${t}: ${why.join(', ')}`);
    }
    return { acted, decisions, bad };
  };
  const r4 = at(on6, MARGIN), r2 = at(wide, 0.01);
  // the joint moves on offer span more than one level or tier pair at some decision (else the rule's limits test nothing)
  for (let t = 1; t <= Math.min(20, T - 1) && !spread; t++) { const st = scaled(states[t], 8), lv = new Set(), tp = new Set(); for (const w of ['self', 'part']) { const tab = off6.tables[w], sv = vecOf(tab.m, CPL.ownerState(st, w)); for (const ai of CPL.rankFor(tab, sv, t, st.tierHeld && st.tierHeld[w] ? { pen: st.tierHeld[w].pen || 0, isa: st.tierHeld[w].isa || 0 } : { pen: 0, isa: 0 }, K)) { lv.add(tab.levelOf ? tab.levelOf[ai] : tab.actions[ai].spendLevel); tp.add(`${tab.actions[ai].tierPen || 0}/${tab.actions[ai].tierIsa || 0}`); } } if (lv.size > 1 || tp.size > 1) spread = t; }
  ok(2, 'above both caps (S007\'s pots eight times over, years 1 to 20), each person\'s six best moves on offer, at a margin of 1e-4 and of 0.01: each decision the rule changes keeps the level and tier pairs, scores within the margin and pays no more tax; the rule acts at both',
    r4.acted > 0 && r2.acted > 0 && !r4.bad.length && !r2.bad.length && spread > 0, `the moves on offer span levels or tier pairs from year ${spread || 'none'}; 1e-4: ${r4.decisions} decisions, ${r4.acted} changed${r4.bad.length ? `; ${r4.bad.slice(0, 2).join('; ')}` : ''}; 0.01: ${r2.decisions} decisions, ${r2.acted} changed${r2.bad.length ? `; ${r2.bad.slice(0, 2).join('; ')}` : ''}`);
}

// ---- 3. at or below either cap, and the last year ----
{
  let differ = [], aboveAt = [];
  for (let t = 0; t <= Math.min(20, T - 1); t++) {
    const st = states[t], a = chooseJoint(off, st, t), b = chooseJoint(on, st, t);
    if (!same(a, b)) differ.push(t);
    if (above(st)) aboveAt.push(t);
  }
  const last = scaled(states[T], 8), lastSame = same(chooseJoint(off, last, T), chooseJoint(on, last, T));
  ok(3, 'at or below either cap (S007 as it stands, years 0 to 20): the rule picks the rule off\'s move at every decision; in the last year above the caps too',
    !differ.length && lastSame && !aboveAt.length, `${differ.length ? `differing in years ${differ.join(', ')}` : 'none differing'}${aboveAt.length ? `; above both caps in years ${aboveAt.join(', ')}` : ''}; the last year ${lastSame ? 'the same' : 'DIFFERS'}`);
}

// ---- 4. the engine and the rollout in step under the rule ----
{
  const CAP = { bequestCap: 300000 };
  const cp = solveCouple(E, M, S007, { solveOne: one(CAP), tieJoint: MARGIN }), cpOff = solveCouple(E, M, S007, { solveOne: one(CAP) });
  const ctx = E.buildContext(withCouple(cp.plan, cp)), N = 10, paths = E.pathsForSeed(7002, N, ctx.totalYears);
  let gap = 0, surv = 0, diff = 0;
  paths.forEach(z => {
    const e = E.runTrial(ctx, z), r = runCouplePolicy(cp, z);
    if (e.survived !== r.survived) diff++; else if (e.survived) gap = Math.max(gap, Math.abs(e.terminalPotNet - r.terminalNet)); if (e.survived) surv++;
  });
  // the rule acting on these paths: the first path's decisions under the rule against the rule off at the same states
  let acted = 0;
  { const st = M.initialState(cp.m); for (let t = 0; t < ctx.totalYears; t++) { const b = chooseJoint(cp, st, t), a = chooseJoint(cpOff, st, t); if (!same(a, b)) acted++; M.step(cp.m, st, b, t, ratesFor(cp.m, paths[0], t, st)); } }
  ok(4, 'the engine and the rollout in step under the rule: S007 with each person\'s estate cap at £300,000, 10 paths alike in survival and within a pound at the end, the rule acting',
    diff === 0 && gap < 1 && acted > 0, `${surv} of ${N} survive; differing in survival ${diff}, the largest gap at the end £${gap.toFixed(6)}; the rule changed ${acted} of the first path's decisions; the caps ${cp.tables.self.estateCap} and ${cp.tables.part.estateCap}`);
}

// ---- 5. the refusals ----
{
  const threw = m => { try { solveCouple(E, M, S007, { tieJoint: m, solveOne: () => { throw new Error('solved'); } }); return 'no'; } catch (e) { return e.message; } };
  const a = threw(-1e-4), b = threw(0.02);
  ok(5, 'the refusals: a margin below 0 or above 0.01, before any solve', /tieJoint -0\.0001/.test(a) && /tieJoint 0\.02/.test(b), `${a}; ${b}`);
}

// ---- 6. the pick by hand ----
{
  const j = (level, pen = 1, isa = 1) => ({ spendLevel: level, perOwner: { self: { tierPen: pen, tierIsa: isa }, part: { tierPen: pen, tierIsa: isa } } });
  const best = { joint: j(1.1), score: 0.9, tax: 5000, wealth: 1e6 };
  const cands = [
    { joint: j(1.0), score: 0.89995, tax: 1000, wealth: 1.1e6 },        // another level, within the margin, far less tax
    { joint: j(1.1, 2, 1), score: 0.89995, tax: 2000, wealth: 1e6 },    // another tier pair, within the margin, less tax
    { joint: j(1.1), score: 0.8998, tax: 2500, wealth: 1e6 },           // outside the margin (1e-4), less tax
    { joint: j(1.1), score: 0.89999, tax: 5000, wealth: 1.2e6 },        // the best's tax, more wealth left
    { joint: j(1.1), score: 0.89991, tax: 4000, wealth: 0.9e6 },        // less tax, at the best's level and tiers, within it
    best
  ];
  const got = CPL.tiePick(cands, best, MARGIN), none = CPL.tiePick([cands[0], cands[1], cands[2], best], best, MARGIN), eq = CPL.tiePick([cands[3], best], best, MARGIN);
  ok(6, 'the pick by hand: the least tax at the best\'s level and tier pairs within the margin, past another level, another tier pair and a move outside it; the best where none qualifies; at the best\'s tax, the larger wealth',
    got === cands[4] && none === best && eq === cands[3], `took the move paying ${got.tax} at level ${got.joint.spendLevel} (${got === cands[4] ? 'the right one' : 'NOT the right one'}); with none qualifying ${none === best ? 'the best' : `a move paying ${none.tax}`}; at the best's tax ${eq === cands[3] ? 'the larger wealth' : 'NOT the larger wealth'}`);
}

console.log(`\ncouple-tie: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
