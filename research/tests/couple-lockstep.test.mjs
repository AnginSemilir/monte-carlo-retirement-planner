/*
 * PART D, D2: THE ENGINE AND THE COUPLES' YEAR IN STEP (the launch plan's section 6, D2: "the engine and the couple's forward
 * model in step (the state check's lockstep, for couples)"). A couple's joint move (src/solver/couple.js chooseJoint) carries
 * the share of the year's net need the first person funds and each person's own draw order, harvest and ceiling; the engine
 * (src/App.jsx stepYear, under a table's move) and the exact model's year (src/solver/model.js step) must carry it alike.
 *   1. lockstep: library couples, each year a random joint move from the candidate's menu (HR's ceilings in it, every
 *      spending level, an uneven split, each person their own order, harvest and ceiling, now and then the lump sum), the
 *      same market; every pot, the taxable account's basis, the gains carried, the tax-free cash taken, the cash ISA and the
 *      lump-sum flags at the top of every year, and the year's flows, the engine's and the model's within a pound;
 *      Each person's pension and ISA take a random tier of their own list now and then (the switch charged), and half the
 *      couples run on lists with the third step down (`tiersBelow: 3`); the tiers each holds and the switch charged are
 *      compared too (D2's tiers per person);
 *   2. the moves that matter were made: years with an uneven split, with the two orders different, with an HR step or
 *      ceiling, with a level other than the target, and tier switches by each person, each counted and none absent;
 *   3. what D2 leaves alone: the engine's year with no table (twelve library households, singles and couples), a single's
 *      years under a solved table (two singles, ten paths each), and a single's years under a table solved with tiers and the
 *      third step down (two more, ten paths each, its switches charged), the code before D2's bit for bit (their digests
 *      taken on c6f9456);
 *   4. a step the model's year knows nothing of throws by name;
 *   5. each person's tier lists, as the engine builds them for a couple under a table with the third step down, are that
 *      person's own single table's lists (fast.js tiersFor on their own plan), on every library couple; some couples' two
 *      people take the rule differently, so the check bites (before D2 the second person's lists took the first person's
 *      rule).
 * Plants: MODEL.plant 'non4' (the model's couple year without N4's ceilings, as before D2, where a penHR step reached drawPot
 * with no pot id and threw a TypeError) fails checks 1 and 4; 'notier' (the model leaves a couple's tiers where they are)
 * fails checks 1 and 2. Shown failing on
 * the code before D2 (results-couple-lockstep.txt): with the engine of c6f9456, which split a couple's need evenly in one
 * order whatever the move, check 1 fails.
 *   node research/tests/couple-lockstep.test.mjs [--paths N]
 *   COUPLE_PLANT=non4 node research/tests/couple-lockstep.test.mjs
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildActions, productLevels, solve, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { SPLITS, ratesAt, singlePlanFor } from '../../src/solver/couple.js';
import { tiersFor } from '../../src/solver/fast.js';
import { withTable } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const args = process.argv.slice(2);
const pathsAt = args.indexOf('--paths');
const NP = pathsAt >= 0 && /^\d+$/.test(args[pathsAt + 1] || '') ? Number(args[pathsAt + 1]) : 3;
const PLANT = process.env.COUPLE_PLANT || '';
if (PLANT) M.MODEL.plant = PLANT;

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const library = buildScenarios();
const couples = library.filter(s => s.plan.demographics.planningMode !== 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const sha = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex');

// ---- 1 and 2. lockstep under random joint moves ----
const MENU = buildActions({ menuPlus: ['hr'], spendLevels: productLevels(0.8) });
const CEILS = ['pa', 'basic', 'hr'];
const PICK = couples.filter((_, i) => i % Math.floor(couples.length / 8) === 0).slice(0, 8);
const FIELDS = ['totalCombined', 'taxPaid', 'cgtPaid', 'drawdownPensions', 'harvested', 'targetSpend', 'netDrawdown', 'unmetDemand'];
let worst = 0, worstAt = '', years = 0;
const made = { uneven: 0, twoOrders: 0, hr: 0, level: 0, lump: 0, tierSelf: 0, tierPart: 0, third: 0 };
const SC = 0.004;   // the switch cost a unit of equity moved, the same on both sides
for (const [ci, sc] of PICK.entries()) {
  const tb = ci % 2 ? 3 : 2, plan = prep(sc.plan), m = M.prepare(E, plan, { tiersBelow: tb }), T = m.ctx.totalYears;
  const listOf = (o, cat) => (m.ctx.tierProfiles[o.ids[cat]] || null);
  const zsAll = E.pathsForSeed(99001, NP, T);
  for (let i = 0; i < zsAll.length; i++) {
    const zs = zsAll[i], rnd = E.mulberry32(1000 * Number(sc.id.slice(1, 4)) + i);
    const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
    const moves = [], tiers = { self: { pen: 0, isa: 0 }, part: { pen: 0, isa: 0 } };
    for (let t = 0; t <= T; t++) {
      const a = pick(MENU), b = pick(MENU), ca = pick(CEILS), cb = pick(CEILS);
      const level = pick([a.spendLevel !== undefined ? a.spendLevel : 1, b.spendLevel !== undefined ? b.spendLevel : 1]);
      const ha = rnd() < 0.5, hb = rnd() < 0.5;
      // now and then each person's pension and ISA move to a random tier of their own list, named as the list names it
      const tierMove = (o) => {
        const out = {};
        for (const cat of ['pen', 'isa']) {
          const L = listOf(o, cat); if (!L) continue;
          if (rnd() < 0.3) tiers[o.key][cat] = Math.floor(rnd() * L.length);
          out[cat === 'pen' ? 'tierPen' : 'tierIsa'] = tiers[o.key][cat]; out[cat === 'pen' ? 'tierPenName' : 'tierIsaName'] = L[tiers[o.key][cat]].name;
        }
        return out;
      };
      const [oS, oP] = [m.ctx.owners.find(o => o.key === 'self'), m.ctx.owners.find(o => o.key === 'part')];
      moves.push({ steps: a.steps, costSteps: a.costSteps || a.steps, harvest: ha, harvestCeil: ca, sweepCash: true, lump: rnd() < 0.15, contrib: null, spendLevel: level, split: pick(SPLITS), switchCost: SC,
        perOwner: { self: { steps: a.steps, harvest: ha, harvestCeil: ca, ...tierMove(oS) }, part: { steps: b.steps, harvest: hb, harvestCeil: cb, ...tierMove(oP) } } });
    }
    const ctx = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: (st, t) => moves[t], switchCost: SC, tiersBelow: tb } } });
    const eng = E.freshState(ctx), mod = M.initialState(m);
    // a year either side cannot run is a gap without bound, named by its error
    try { for (let t = 0; t <= T; t++) {
      const j = moves[t];
      // the top of the year: every field each side carries
      const gaps = [];
      for (const id of Object.keys(eng.pots)) gaps.push([`pot ${id}`, Math.abs((eng.pots[id] || 0) - (mod.pots[id] || 0))]);
      for (const k of ['self', 'part']) {
        gaps.push([`basis ${k}`, Math.abs((eng.giaBasis[k] || 0) - (mod.basis[k] || 0))], [`gains carried ${k}`, Math.abs((eng.cgtCarry[k] || 0) - (mod.cgtCarry[k] || 0))],
          [`tax-free cash ${k}`, Math.abs((eng.cumPcls[k] || 0) - (mod.cumPcls[k] || 0))], [`cash ISA ${k}`, Math.abs(((eng.cashIsa && eng.cashIsa[k]) || 0) - ((mod.cashIsa && mod.cashIsa[k]) || 0))],
          [`lump ${k}`, !!(eng.lumpSumTaken && eng.lumpSumTaken[k]) === !!(mod.lumpTaken && mod.lumpTaken[k]) ? 0 : Infinity]);
        for (const cat of ['pen', 'isa']) gaps.push([`tier held ${k} ${cat}`, (eng.tierHeld[k] ? eng.tierHeld[k][cat] : 0) === (mod.tierHeld[k] ? mod.tierHeld[k][cat] : 0) ? 0 : Infinity]);
      }
      const heldBefore = JSON.stringify(mod.tierHeld);
      const re = E.stepYear(ctx, eng, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 });
      const rm = M.step(m, mod, j, t, ratesAt(m, zs, t));
      for (const k of FIELDS) gaps.push([`${k}`, Math.abs(E.num(re[k], 0) - E.num(rm[k], 0))]);
      gaps.push(['switch charged', Math.abs(E.num(re.switchPaid, 0) - E.num(rm.switchPaid, 0))]);
      const heldNow = mod.tierHeld;
      if (JSON.stringify(heldNow.self) !== JSON.stringify(JSON.parse(heldBefore).self)) made.tierSelf++;
      if (JSON.stringify(heldNow.part) !== JSON.stringify(JSON.parse(heldBefore).part)) made.tierPart++;
      if (tb === 3 && [heldNow.self.pen, heldNow.self.isa, heldNow.part.pen, heldNow.part.isa].some(k => k === 3)) made.third++;
      for (const [k, g] of gaps) if (!(g <= worst)) { worst = g; worstAt = `${sc.id} path ${i} year ${t}: ${k}`; }
      years++;
      if (re.netDrawdown > 0) {
        if (j.split !== 0.5) made.uneven++;
        if (j.perOwner.self.steps.join() !== j.perOwner.part.steps.join()) made.twoOrders++;
        if ([...j.perOwner.self.steps, ...j.perOwner.part.steps].includes('penHR') || (j.perOwner.self.harvest && j.perOwner.self.harvestCeil === 'hr') || (j.perOwner.part.harvest && j.perOwner.part.harvestCeil === 'hr')) made.hr++;
      }
      if (j.spendLevel !== 1 && re.targetSpend > 0) made.level++;
      if (j.lump) made.lump++;
    } } catch (e) { worst = Infinity; worstAt = `${sc.id} path ${i}: threw ${e.message.split('\n')[0]}`; }
  }
}
ok(1, `the engine and the couples' year in step under a couple's joint moves (${PICK.length} couples, ${NP} paths each)`, worst <= 1,
  `${years} household-years; the largest gap £${worst.toExponential(2)}${worst > 1 ? ` at ${worstAt}` : ''}`);
ok(2, 'the moves that matter were made: an uneven split, two orders, HR\'s ceilings, a level off the target, the lump sum, each person\'s tier switches',
  made.uneven > 0 && made.twoOrders > 0 && made.hr > 0 && made.level > 0 && made.lump > 0 && made.tierSelf > 0 && made.tierPart > 0 && made.third > 0,
  `years drawing with an uneven split ${made.uneven}, two orders ${made.twoOrders}, an HR step or ceiling ${made.hr}; a level off the target ${made.level}; the lump sum asked ${made.lump}; tier switches, the first person ${made.tierSelf}, the second ${made.tierPart}; years holding the third step down ${made.third}`);

// ---- 3. what D2 leaves alone ----
{
  const BEFORE = { rows: 'a90aae26ebf1e021a206d6d13ee6a1d0739c06f371db2d5b5a54ebff49c7c5bf', table: '9f1e5192e6e593f68b1e928e1fb1a5a9a07f9d79c8b1e5c2885f88bd5e9487c5', tiered: 'b57bdf151a05a48a7120481d35b8f3d10570e80c7a0e5e3331adfd4e14cb849b' };   // taken on c6f9456, the code before D2
  const spread = library.filter((_, i) => i % Math.floor(library.length / 12) === 0).slice(0, 12);
  const rows = spread.map(sc => E.simulateDeterministic(prep(sc.plan), 'expected'));
  const singles = ['S116', 'S224'].map(id => library.find(s => s.id === id));
  const tableRuns = singles.map(sc => {
    const plan = prep(sc.plan), r = solve(E, M, plan, { ...PRODUCT_BASELINE, mix: 0, points: 4 });
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = r.m.ctx.totalYears;
    return E.pathsForSeed(99002, 10, T).map(zs => { const st = E.freshState(ctx), out = []; for (let t = 0; t <= T; t++) out.push(E.stepYear(ctx, st, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 })); return out; });
  });
  let moved = 0;
  const tieredRuns = ['S224', 'S370'].map(id => library.find(s => s.id === id)).map(sc => {
    const plan = prep(sc.plan), r = solve(E, M, plan, { ...PRODUCT_BASELINE, mix: 0, points: 4, tiers: true, tiersBelow: 3 });
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = r.m.ctx.totalYears;
    return E.pathsForSeed(99003, 10, T).map(zs => { const st = E.freshState(ctx), out = []; for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 }); if (row.switchPaid > 0) moved++; out.push(row); } return out; });
  });
  const dr = sha(rows), dt = sha(tableRuns), dtt = sha(tieredRuns);
  if (process.env.COUPLE_LOCKSTEP_PRINT) console.log(`  digests: rows ${dr} table ${dt} tiered ${dtt}`);
  ok(3, 'the engine\'s year with no table, and a single\'s years under a solved table, with and without tiers, the code before D2\'s bit for bit',
    dr === BEFORE.rows && dt === BEFORE.table && dtt === BEFORE.tiered && moved > 0,
    `${spread.length} households with no table ${dr.slice(0, 16)} (before ${BEFORE.rows.slice(0, 16)}); 2 singles x 10 paths under a table ${dt.slice(0, 16)} (before ${BEFORE.table.slice(0, 16)}); 2 more under a tiered table ${dtt.slice(0, 16)} (before ${BEFORE.tiered.slice(0, 16)}), switches charged in ${moved} years`);
}

// ---- 4. a step the year knows nothing of ----
{
  // the first year a couple draws on its pots under its own move, then that year again with an unknown step in both orders
  let threw = '', at = '';
  for (const sc of PICK) {
    const plan = prep(sc.plan), m = M.prepare(E, plan), own = M.actionFromContext(m.ctx), st = M.initialState(m);
    for (let t = 0; t <= m.ctx.totalYears && !at; t++) {
      const probe = M.cloneState(st);
      if (M.step(m, probe, own, t, null, true).netDrawdown > 0) {
        at = `${sc.id} year ${t}`;
        const bad = { ...own, steps: ['penXX', 'cash'], split: 0.5, perOwner: { self: { steps: ['penXX', 'cash'], harvest: false }, part: { steps: ['penXX', 'cash'], harvest: false } } };
        try { M.step(m, M.cloneState(st), bad, t, null, true); } catch (e) { threw = e.message; }
      }
      M.step(m, st, own, t);
    }
    if (at) break;
  }
  ok(4, 'a step the couples\' year knows nothing of throws by name', /no draw for the step penXX/.test(threw), `${at}: ${threw || 'no throw'}`);
}

// ---- 5. each person's tier lists are their own table's ----
{
  let bad = 0, differ = 0, n = 0, first = '';
  const names = (L) => (L || []).map(x => x.name);
  // no library couple's two people take the third step differently, so one is made: S001 with the first person's pension
  // and ISA at Medium Risk (whose third step down would be Cash Equivalents), the second person's left at High and
  // Medium/High (which can take it)
  const s001 = couples.find(s => s.id === 'S001'), made1 = JSON.parse(JSON.stringify(s001));
  made1.id = 'S001 (the first person at Medium Risk)';
  made1.plan.accounts.forEach(a => { if (a.owner === 'Myself' && (a.id === 'pen_self' || a.id === 'isa_self')) a.risk = 'Medium Risk'; });
  for (const sc of [...couples, made1]) {
    const plan = prep(sc.plan);
    const ctx = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => null, tiersBelow: 3 } } });
    const rule = {};
    for (const who of ['self', 'part']) {
      const sp = E.resolveMpaa(E.normalizePlan(singlePlanFor(plan, who))), ms = M.prepare(E, sp);
      ms.tiersBelow = 3;
      const own = tiersFor(ms), o = ctx.owners.find(x => x.key === who);
      rule[who] = Math.max(own.pen.length, own.isa.length);
      for (const cat of ['pen', 'isa']) {
        const eng = names(ctx.tierProfiles[o.ids[cat]]), tab = names(own[cat]);
        if (!ctx.tierProfiles[o.ids[cat]]) continue;
        n++;
        if (tab.join() !== eng.slice(0, tab.length).join()) { bad++; if (!first) first = `${sc.id} ${who} ${cat}: table ${tab.join('/')} engine ${eng.join('/')}`; }
      }
    }
    // the two people take the third step differently (one can, the other cannot): their own lists' lengths differ
    if (rule.self !== rule.part) differ++;
  }
  ok(5, 'each person\'s tier lists in a couple\'s engine are that person\'s own table\'s lists (the third step down)', bad === 0 && differ > 0 && n > 0,
    `${n} pension and ISA lists over ${couples.length} library couples and one made, ${bad} apart${first ? ` (first ${first})` : ''}; couples whose two people take the third step differently ${differ}`);
}

console.log(`\n${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
