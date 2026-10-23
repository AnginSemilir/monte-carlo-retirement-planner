/*
 * V2'S STATE CHECK (the follow-up review of 22 Oct, answer 4; STATE.md D20 (4)). V2 compares the engine's survival under a
 * solved table with the solver's forward run (runPolicy) path by path; this compares what each carries from year to year.
 * Both run the same paths and the same moves: the engine takes, each year, the move the forward run took (its own pick is
 * counted beside it), so a near-tie cannot part them and every gap is a gap in the state.
 *   1. lockstep: at the top of every year the engine's state, mapped into the solver's vector (vecOf of bridge.js
 *      modelStateOf: what a table reads), against the forward run's, slot by slot: the pots (slots 0 to 2), the gain held
 *      in the taxable account (slot 3 times its value), the tax-free cash taken (4), the cash ISA (6), the gains carried
 *      into next year's tax (11) and the cash (12) within a pound; the lump-sum flag (5) and the tiers held exact; the
 *      wealth at the end within a pound where the forward run survives. The guardrails' four slots (7 to 10) are not
 *      compared: a table runs with guardrails off, and check 3 shows both sides' copies inert. The light candidate (the
 *      candidate's settings with 4 wealth points and a small lattice: its moves, tiers, switch charge and lump sums, its
 *      table crude, which only widens the moves taken) on five single households: the taxable household of
 *      solver-carry.test.mjs (£400k holding £240k of gain), S224, S370 (a bridge, half its cash in an ISA), S008 and S380;
 *      40 paths each of seed 99001 (--full; the quick form takes the first and S370 at 10 paths);
 *   2. planted: a forward run that drops its carried gains (slot 11) each year parts from the engine; so does one that
 *      forgets the basis left on an emptied taxable account (slot 13), the fault check 1 found on S370 (23 Oct);
 *   3. inventory: every field of the engine's state, gathered at every year of every run, is listed as carried (its slot)
 *      or inert under a table, and a field not listed, or listed and gone, fails. An inert field, perturbed at every year of
 *      one path a household, leaves the engine's year unchanged: its audit row (to a penny) and every slot of the next
 *      state but the guardrails', and the tiers held. The forward run's guardrail slots, perturbed at every year of the same
 *      path, leave the rest of its run unchanged. And no run writes to the engine's context, so nothing path-dependent
 *      hides there;
 *   4. planted: a field added to the state fails the inventory, and the carried gains listed as inert fail the
 *      perturbation.
 * Singles only: a couple's forward run is couple.js's own (7u-F's panel is all singles). Two forms: by default the quick
 * one, in the fast suite (so this file is protected): the taxable household and S370 at 10 paths each, so both planted
 * faults still fire; with --full (state-check-full.test.mjs, in the nightly full suite) all five households, 40 paths.
 *   node research/tests/state-check.test.mjs [--full] [--paths N]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { modelStateOf, withTable } from '../../src/solver/bridge.js';
import { solveCandidate } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const QUICK = !process.argv.includes('--full'), argAt = process.argv.indexOf('--paths'), NP = argAt > 0 ? Number(process.argv[argAt + 1]) : QUICK ? 10 : 40, SEED = 99001;
const LIGHT = { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };

const acc = (id, owner, category, balance, risk, extra = {}) => ({ id, owner, category, balance, contrib: 0, growth: 0, risk, ...extra });
const CARRY = {
  demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [acc('pen_self', 'Myself', 'Pensions', 200000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 100000, 'Medium/High Risk'),
    acc('other_self', 'Myself', 'Other Investments (e.g. GIA)', 400000, 'Medium Risk', { unrealisedGain: 240000 }), acc('cash_self', 'Myself', 'Cash Savings', 15000, 'Cash Equivalents')],
  config: { valuationDate: '2026-01-01' }
};
const all = buildScenarios();
const HH = [['carry', CARRY], ...(QUICK ? ['S370'] : ['S224', 'S370', 'S008', 'S380']).map(id => [id, all.find(s => s.id === id).plan])];
const planOf = p => { const h = JSON.parse(JSON.stringify(p)); return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } })); };

// the move a table hands the engine for index ai, as tablePolicy builds it (checked against it whenever both pick the same)
const moveOf = (r, ai, code) => {
  const a = r.actions[ai], ca = r.c.acts[ai];
  return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
    spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code,
    tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name };
};
const MONEY = [0, 1, 2, 4, 6, 11, 12, 13];
const NAMES = { 0: 'pension', 1: 'ISA', 2: 'taxable and cash', 4: 'tax-free cash taken', 6: 'cash ISA', 11: 'gains carried', 12: 'cash', 13: 'basis of an emptied account', gain: 'gain held', 5: 'lump sum taken', held: 'tiers held', end: 'wealth at the end' };
const gainOf = v => v[3] * (v[2] - v[12]);
// the slot-by-slot gaps between the engine's mapped state e and the forward run's f, and their tiers held
const gaps = (e, f, he, hf) => {
  const g = {};
  for (const k of MONEY) g[k] = Math.abs((e[k] || 0) - (f[k] || 0));   // slot 13 absent before 23 Oct: nothing
  g.gain = Math.abs(gainOf(e) - gainOf(f)); g[5] = e[5] === f[5] ? 0 : Infinity;
  g.held = he && hf && he.pen === hf.pen && he.isa === hf.isa ? 0 : Infinity;
  return g;
};
const NOT_GUARD = [0, 1, 2, 3, 4, 5, 6, 11, 12, 13];

const setAt = (o, path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };
const getAt = (o, path) => path.split('.').reduce((x, k) => x[k], o);
// every leaf of the engine's state, by its path ('pots.pen_self', 'guard.mult', ...)
const leaves = (o, pre = '', out = new Set()) => {
  for (const [k, v] of Object.entries(o)) { const p = pre ? `${pre}.${k}` : k; if (v !== null && typeof v === 'object') leaves(v, p, out); else out.add(p); }
  return out;
};
// the inventory: each field carried (into its slot) or inert under a table; the pots by their account's category
const CARRIED_POT = { pen: 'slot 0', isa: 'slot 1', other: 'slots 2 and 3', cash: 'slots 2 and 12' };
const CARRIED = { 'giaBasis.self': 'slot 3, the gain share of slot 2 less slot 12, and slot 13 when that is empty', 'cgtCarry.self': 'slot 11', 'cumPcls.self': 'slot 4', 'lumpSumTaken.self': 'slot 5', 'cashIsa.self': 'slot 6', 'tierHeld.self.pen': 'the tiers held', 'tierHeld.self.isa': 'the tiers held' };
// a single's partner fields: the engine reads some (cgtCarry.part opens each year's tally), so they are not unread, but
// nothing writes them; each is checked at nothing (0, or false) in every year of every run, which is what the forward run assumes
const CONSTANT = ['giaBasis.part', 'cgtCarry.part', 'cumPcls.part', 'lumpSumTaken.part', 'cashIsa.part', 'tierHeld.part.pen', 'tierHeld.part.isa'];
const INERT = { 'guard.rate0': 'guardrails off', 'guard.mult': 'guardrails off', 'guard.lostLastYear': 'guardrails off', 'guard.lastBaseDraw': 'guardrails off' };
const classify = (ctx, path, carried = CARRIED, inert = INERT) => {
  const m = /^pots\.(.+)$/.exec(path);
  if (m) { const a = ctx.accounts.find(x => x.id === m[1]); return a && a.owner === 'self' && CARRIED_POT[a.cat] ? 'carried' : null; }
  return carried[path] ? 'carried' : CONSTANT.includes(path) ? 'constant' : inert[path] ? 'inert' : null;
};
// the constants not at nothing in a state
const offConstant = st => CONSTANT.filter(f => { const v = getAt(st, f); return !(v === 0 || v === false); });
const perturbed = v => (typeof v === 'boolean' ? !v : v === null ? 0.04 : typeof v === 'number' ? v + 54321 : v);
// a context's data (functions and the table left out, Maps as their entries): to see whether a run writes to it
const snap = ctx => JSON.stringify(ctx, (k, v) => (k === 'policyOverride' || typeof v === 'function' ? undefined : v instanceof Map ? [...v.entries()] : v));
const rowKey = row => JSON.stringify(row, (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v));

const worst = {}, worstAt = {}, planted = {}, planted13 = {}, seen = new Map(), perHH = [], offConst = {};
const emptied = { paths: 0, of: 0, largest: 0, at: '' };   // the engine's taxable account empty with a basis left on it
let picksDiffer = 0, pickYears = 0, mapMismatch = 0, years = 0, ctxWrites = 0, pickStored = 0;
const pickGap = { v: -Infinity, at: '', tol: 0 }, plantedPick = { v: -Infinity };   // the largest score gap between the engine's own pick and the forward run's
const inertMoved = {}, plantInertMoved = { n: 0, of: 0, first: '' }, guardMoved = { n: 0, of: 0, first: '' };
let inertTried = 0;

for (const [id, p] of HH) {
  const t0 = Date.now(), r = solveCandidate(E, M, planOf(p), LIGHT);
  if (r.c.tiers.gia) throw new Error('state-check: the taxable account carries a tier, which moveOf does not hand to the engine');
  const T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NP, T).map(z => Float64Array.from(z));
  // the engine's context, built once: its table hands back the forward run's move on the path being run (cur)
  const base = withTable(r.m.ctx.plan, r), real = base.spending.policyOverride;
  let cur = null;
  const pol = { ...real, choose(st, t, held) {
    const want = real.choose(st, t, held), rec = cur.recs[t];
    if (!rec) return want;   // after the forward run stopped (it failed): the engine goes on, nothing to compare
    const forced = moveOf(r, rec.ai, want.index === rec.ai ? want.code : 'forced');
    if (cur.sink) {
      // the picks are compared on the lockstep's runs only: in a planted run the forward run's state is wrong on purpose
      if (cur.sink === worst) pickYears++;
      if (cur.sink === worst && want.index !== rec.ai) {
        // the engine's chooser scored every move in r._sc (chooseAction): how far the forward run's pick sits below its own
        picksDiffer++;
        if (t >= r.m.ctx.totalYears && !r.finalExact) pickStored++;
        else { const gap = r._sc[want.index] - r._sc[rec.ai]; if (!(gap <= pickGap.v)) { pickGap.v = gap; pickGap.at = `${id} path ${cur.i} year ${t}, moves ${want.index} and ${rec.ai}`; } pickGap.tol = Math.max(r.eps || 0, r.tieMargin || 0); }
      }
      // planted: with the carried gains dropped the forward run's picks part from the engine's by more than a tie
      if (cur.sink === planted && want.index !== rec.ai && !(t >= r.m.ctx.totalYears && !r.finalExact)) plantedPick.v = Math.max(plantedPick.v, r._sc[want.index] - r._sc[rec.ai]);
      if (want.index === rec.ai && JSON.stringify(forced) !== JSON.stringify(want)) mapMismatch++;
      if (cur.sink === worst) years++;
      const g = gaps(vecOf(r.m, modelStateOf(st)), rec.s, held, rec.held);
      for (const [k, v] of Object.entries(g)) if (!(v <= (cur.sink[k] ?? -1))) { cur.sink[k] = v; if (cur.sink === worst) worstAt[k] = `${id} path ${cur.i} year ${t}`; }
    }
    return forced;
  } };
  const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: pol } }), ctx0 = snap(ctx);
  const zPathOf = zs => (zs.length > T + 1 ? zs[T + 1] : 0);
  const forward = (zs, plant = null) => {
    const recs = [];
    const out = runPolicy(r, zs, { visit: (t, s, held, ai) => { if (plant) plant(s); recs[t] = { s: Float64Array.from(s), held: { pen: held.pen, isa: held.isa }, ai }; } });
    return { out, recs };
  };
  const engine = (zs, recs, i, sink, onYear = null) => {
    cur = { recs, i, sink };
    const st = E.freshState(ctx);
    let row = null;
    for (let t = 0; t <= T; t++) {
      for (const f of leaves(st)) { if (!seen.has(f)) seen.set(f, new Set()); seen.get(f).add(id); }
      for (const f of offConstant(st)) offConst[f] = offConst[f] || `${id} path ${i} year ${t}: ${getAt(st, f)}`;
      if (onYear) onYear(st, t);
      cur = { recs, i, sink };
      row = E.stepYear(ctx, st, t, { z: zs[t], zPath: zPathOf(zs) });
    }
    for (const f of leaves(st)) { if (!seen.has(f)) seen.set(f, new Set()); seen.get(f).add(id); }
    for (const f of offConstant(st)) offConst[f] = offConst[f] || `${id} path ${i} after the last year: ${getAt(st, f)}`;
    return { st, row };
  };

  // 1. lockstep on every path
  let hhWorst = 0, survived = 0;
  for (let i = 0; i < paths.length; i++) {
    const { out, recs } = forward(paths[i]);
    const before = { ...worst };
    let ghost = 0;
    const { row } = engine(paths[i], recs, i, worst, st => { const o = ctx.owners[0].ids; if (!(st.pots[o.other] > 0) && st.giaBasis.self > ghost) ghost = st.giaBasis.self; });
    emptied.of++; if (ghost > 0) { emptied.paths++; if (ghost > emptied.largest) { emptied.largest = ghost; emptied.at = `${id} path ${i}`; } }
    if (out.survived) {
      survived++;
      const d = Math.abs(out.terminal - row.totalCombined);
      if (!(d <= (worst.end ?? -1))) { worst.end = d; worstAt.end = `${id} path ${i}`; }
    }
    for (const k of Object.keys(worst)) if (worst[k] !== before[k]) hhWorst = Math.max(hhWorst, worst[k]);
  }
  // 2. planted: the forward run drops its carried gains (the carry household, where they are sure to arise); and forgets an
  // emptied account's basis (S370, where check 1 first found it), as before 23 Oct
  if (id === 'carry') for (let i = 0; i < paths.length; i++) { const { recs } = forward(paths[i], s => { s[11] = 0; }); engine(paths[i], recs, i, planted); }
  if (id === 'S370') for (let i = 0; i < paths.length; i++) { const { recs } = forward(paths[i], s => { if (s.length > 13) s[13] = 0; }); engine(paths[i], recs, i, planted13); }

  // 3. the inert fields perturbed at every year of path 0, the engine's year run from the state as it is and as perturbed
  {
    const zs = paths[0], { recs } = forward(zs), plantInert = { ...INERT, 'cgtCarry.self': 'planted' };
    engine(zs, recs, 0, null, (st, t) => {
      const market = { z: zs[t], zPath: zPathOf(zs) };
      const stepFrom = (path) => {
        const s2 = structuredClone(st);
        if (path) setAt(s2, path, perturbed(getAt(s2, path)));
        cur = { recs, i: 0, sink: null };
        const row = E.stepYear(ctx, s2, t, market), v = vecOf(r.m, modelStateOf(s2));
        return `${rowKey(row)}|${NOT_GUARD.map(k => Math.round(v[k] * 100) / 100).join(',')}|${s2.tierHeld.self.pen},${s2.tierHeld.self.isa}`;
      };
      const as = stepFrom(null);
      for (const path of Object.keys(plantInert)) {
        const moved = stepFrom(path) !== as;
        if (INERT[path]) { inertTried++; if (moved) inertMoved[path] = inertMoved[path] || `${id} year ${t}`; }
        else { plantInertMoved.of++; if (moved) { plantInertMoved.n++; plantInertMoved.first = plantInertMoved.first || `${id} year ${t}`; } }
      }
    });
    // the forward run's guardrail slots perturbed from each year on: the rest of its run, every slot but theirs, unchanged
    for (let t = 0; t < recs.length; t++) {
      const traceFrom = (s) => { const tr = []; const out = runPolicy(r, zs, { start: { t, s, held: recs[t].held, firstAi: recs[t].ai }, visit: (u, sv) => tr.push(NOT_GUARD.map(k => sv[k]).join(',')) }); return `${tr.join('|')}|${out.survived}|${out.terminal}|${out.lifetimeTax}`; };
      const s1 = Float64Array.from(recs[t].s), s2 = Float64Array.from(recs[t].s);
      s2[7] = 0.05; s2[8] = 0.7; s2[9] = 1 - s2[9]; s2[10] = s2[10] + 54321;
      guardMoved.of++;
      if (traceFrom(s1) !== traceFrom(s2)) { guardMoved.n++; guardMoved.first = guardMoved.first || `${id} year ${t}`; }
    }
  }
  if (snap(ctx) !== ctx0) ctxWrites++;
  perHH.push(`${id} (${T + 1} years, solve ${Math.round((Date.now() - t0) / 1000)} s): the forward run survives ${survived} of ${paths.length}; its worst gap ${hhWorst < 1e-6 ? hhWorst.toExponential(1) : hhWorst.toFixed(4)}`);
}

const ctxOf = E.buildContext(planOf(CARRY));
console.log(`the light candidate on ${HH.length} households, ${NP} paths each of seed ${SEED}`);
perHH.forEach(l => console.log(`  ${l}`));
const fmt = k => `${NAMES[k] || `slot ${k}`} ${Number.isFinite(worst[k]) ? (worst[k] < 1e-3 ? worst[k].toExponential(1) : `£${worst[k].toFixed(4)}`) : 'differs'}${worst[k] > 0 ? ` (${worstAt[k]})` : ''}`;
const keys = [...MONEY, 'gain', 5, 'held', 'end'];
ok(keys.every(k => worst[k] <= (k === 5 || k === 'held' ? 0 : 1)) && years > 0,
  `1. lockstep, ${years} household-years: the engine's state in the solver's slots against the forward run's, worst gaps: ${keys.map(fmt).join('; ')}`);
console.log(`  the engine's taxable account empty with a basis left on it, in some year: ${emptied.paths} of ${emptied.of} paths (the largest £${emptied.largest.toFixed(0)}${emptied.at ? `, ${emptied.at}` : ''})`);
ok(picksDiffer === pickStored || pickGap.v <= pickGap.tol + 1e-9, `1. where the engine's own pick differs from the forward run's (${picksDiffer} of ${pickYears} years${pickStored ? `, ${pickStored} of them read from the stored final-year policy` : ''}), the two moves score alike to the engine's chooser: the largest gap ${picksDiffer > pickStored ? `${pickGap.v.toExponential(1)} (${pickGap.at})` : 'none'}, its tie tolerance ${pickGap.tol.toExponential(1)} (a near-tie, broken by noise in the last digits; a larger gap means the chooser reads something the state does not carry)`);
ok(mapMismatch === 0, `the move handed to the engine is tablePolicy's own whenever both pick the same index (mismatches ${mapMismatch})`);
ok(planted13.gain > 1, `2. planted: a forward run that forgets an emptied account's basis each year (slot 13 at nothing, the code before 23 Oct) parts from the engine on S370 (gain held, worst £${(planted13.gain || 0).toFixed(0)}; basis of an emptied account £${(planted13[13] || 0).toFixed(0)}; gains carried £${(planted13[11] || 0).toFixed(0)})`);
ok(plantedPick.v > Math.max(pickGap.tol, 1e-9), `2. planted: with the carried gains dropped, the forward run's picks part from the engine chooser's by more than a tie (the largest gap ${plantedPick.v === -Infinity ? 'none' : plantedPick.v.toExponential(1)})`);
ok(planted[11] > 1, `2. planted: a forward run that drops its carried gains each year parts from the engine (gains carried, worst £${(planted[11] || 0).toFixed(0)}; pension £${(planted[0] || 0).toFixed(0)}, taxable and cash £${(planted[2] || 0).toFixed(0)})`);

const unlisted = [...seen.keys()].filter(f => !classify(ctxOf, f)), gone = [...Object.keys(CARRIED), ...CONSTANT, ...Object.keys(INERT)].filter(f => !seen.has(f));
const pots = [...seen.keys()].filter(f => f.startsWith('pots.'));
ok(unlisted.length === 0 && gone.length === 0, `3. inventory: ${seen.size} fields of the engine's state seen over every year of every run, each listed: ${pots.length} pots carried (${pots.join(', ')}), ${Object.keys(CARRIED).length} more carried (${Object.entries(CARRIED).map(([f, s]) => `${f} as ${s}`).join('; ')}), ${CONSTANT.length} constant for a single (${CONSTANT.join(', ')}), ${Object.keys(INERT).length} inert under a table (${Object.keys(INERT).join(', ')})${unlisted.length ? `; NOT LISTED: ${unlisted.join(', ')}` : ''}${gone.length ? `; LISTED BUT GONE: ${gone.join(', ')}` : ''}`);
ok(Object.keys(offConst).length === 0, `3. the constants are at nothing in every year of every run${Object.keys(offConst).length ? `; OFF: ${Object.entries(offConst).map(([f, w]) => `${f} (${w})`).join(', ')}` : ''}`);
ok(Object.keys(inertMoved).length === 0 && inertTried > 0, `3. each inert field (the guardrails' memory) perturbed at every year of path 0 on every household (${inertTried} trials) leaves the engine's year unchanged: its row to a penny, every slot but the guardrails', the tiers held${Object.keys(inertMoved).length ? `; MOVED: ${Object.entries(inertMoved).map(([f, w]) => `${f} (${w})`).join(', ')}` : ''}`);
ok(guardMoved.n === 0 && guardMoved.of > 0, `3. the forward run's guardrail slots (7 to 10) perturbed from each year of path 0 on (${guardMoved.of} runs) leave the rest of its run unchanged${guardMoved.n ? `; MOVED in ${guardMoved.n} (first ${guardMoved.first})` : ''}`);
ok(ctxWrites === 0, `3. no run writes to the engine's context (households whose context changed: ${ctxWrites})`);
{
  const st = E.freshState(ctxOf); st.extra = { flag: true };
  const miss = [...leaves(st)].filter(f => !classify(ctxOf, f));
  ok(miss.length === 1 && miss[0] === 'extra.flag', `4. planted: a field added to the state fails the inventory (not listed: ${miss.join(', ') || 'none'})`);
  const st2 = E.freshState(ctxOf); st2.cgtCarry.part = 1200;
  ok(offConstant(st2).join() === 'cgtCarry.part', `4. planted: a partner's carried gains of 1,200 fail the constants (off: ${offConstant(st2).join(', ') || 'none'})`);
}
ok(plantInertMoved.n > 0, `4. planted: the carried gains listed as inert fail the perturbation (the year moved in ${plantInertMoved.n} of ${plantInertMoved.of}; first ${plantInertMoved.first || 'none'})`);

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
