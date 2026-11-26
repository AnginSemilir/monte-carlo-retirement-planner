/*
 * A COUPLE WHOSE ELDER IS ENTERED SECOND, HANDED TO THE SOLVER ELDER FIRST (D104 (1); src/couplesSwitch.js SWAP_ELDER and
 * swapOf, on since its change of default of 15 Nov; src/solverClient.js the swap and the answers put back; src/coupleOrder.js
 * otherOrder and its back* functions).
 *   1. the switch and its rollback: SWAP_ELDER on as shipped, a library couple entered younger first swapped; and with the
 *      swap taken off (the plant 'swapoff', the rollback's one line), no plan is swapped and the guard's decisions ({ on,
 *      share, why }) on the library's 210 couples, each as entered and mirrored, are the code before the swap's to the bit (a
 *      digest taken on 1dc3afea, when the swap was built off in code)
 *   2. the guard with the swap on, as shipped: a couple whose elder is entered second and holds 75% or 90% (stage C's
 *      re-held units, mirrored) is on and swapped, where today it keeps the app's rules; a library couple entered younger
 *      first (inside the band) on and swapped; a couple of one age not swapped; and a couple entered at 50 and 80 with its plan
 *      to 95 on and swapped since D150 (COUPLES-ANY.md amendment 3, D: its mirror keeps the plan's years past 120,
 *      couple-past120.test.mjs), where under the guard before D150 (the plant 'beforeall', the rollback) the age cap, read on
 *      the plan as entered, keeps it on the app's rules, as it does with the swap off (the plant 'swapoff': the couple not
 *      mirrored, so its table would stop at 120; the reviewer on D150's change of default, MINOR 4)
 *   3. the identity: a couple written younger first by hand (S007's people put in each other's places field by field, with
 *      a band), cut through its mirror by the page's route (solverCouple.js couplePlans), is cut exactly as the same couple
 *      entered elder first: each person's plan, the share, the household and the ages each table is solved with, to the bit
 *   4. the answers put back: S007 solved light, elder first; its answers (the meta, this year's actions, the next years, the
 *      year rows and their verdict) put back for the couple written younger first are in that couple's terms: each person's
 *      meta, actions and parts under their own name (in the next years and in the year rows, each compared with the other
 *      person's on a year where the two differ), the split the entered first person's fraction, each age the entered first
 *      person's, each account under its entered id with the other person's figures, the tiers the entered first person's,
 *      and the failure age the entered first person's, on a run that fails (the year rows in a market at z -2.5 every year)
 *   5. the Strategy tab's figures put back (the reviewer on the change of default, BLOCKING 1): the summary worked out on the
 *      mirror's solve against the couple written younger first, put back, has the raise's age and every outlook year's age
 *      the entered first person's, where the mirror's are the elder's, and every other figure the mirror's as it was
 * Plants: 'capafter' (couplesSwitch.js PLANT: the age cap read on the mirror, so under the guard before D150 the couple at 50 and
 * 80 runs) and 'noagecap' (couplesSwitch.js PLANT: the age cap not read, so that couple runs with the swap off and before D150)
 * fail check 2; coupleOrder.js PLANT's 'noback'
 * (every answer left as the mirror's) fails checks 4 and 5, 'noaheadparts', 'norowsparts' and 'noverdict' (each one put-back
 * left out) fail check 4, 'nostrategy' check 5.
 *   node research/tests/couple-swap.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import * as SW from '../../src/couplesSwitch.js';
import * as ORD from '../../src/coupleOrder.js';
import { couplePlans, coupleMeta, coupleActionsOf, coupleAheadOf, coupleRowsOf } from '../../src/solverCouple.js';
import { strategyRuns, strategySummary } from '../../src/solverStrategy.js';
import { solveForApp } from '../../src/solverApp.js';
import { prepareForSolve } from '../../src/solverSettings.js';
import { couplesOf } from '../solver/couple-panel.mjs';
import { readSharePanel } from '../solver/couples-share-panel.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['capafter', ['2']], ['noagecap', ['2']], ['noback', ['4', '5']], ['noaheadparts', ['4']], ['norowsparts', ['4']], ['noverdict', ['4']], ['nostrategy', ['5']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_SWAP_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.COUPLE_SWAP_PLANT || '';
if (['noback', 'noaheadparts', 'norowsparts', 'noverdict', 'nostrategy'].includes(PLANT)) ORD.PLANT.rule = PLANT;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-swap: a couple whose elder is entered second, handed to the solver elder first${PLANT ? `; planted: ${PLANT}` : ''}`);
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const library = couplesOf();
const pick = o => ({ on: o.on, share: o.share, why: o.why });

// ---- 1. the switch on as shipped, and its rollback ----
{
  const BEFORE = 'e18be1b36a22a4b81928063addc43692d505b391c25241aa15dfeaefcde8c34e';   // taken on 1dc3afea, the code before the swap
  // as shipped: a library couple (its elder entered first, as every one) mirrored, so entered younger first, is swapped
  const mirrored = library.map(s => ORD.otherOrder(E, E.normalizePlan(s.plan))).filter(q => SW.elderOf(q) === 'part');
  const shipped = SW.SWAP_ELDER && mirrored.length > 0 && mirrored.every(q => SW.swapOf(q));
  // the rollback: the swap taken off, the guard the code before's
  SW.PLANT.rule = 'swapoff';
  const h = createHash('sha256');
  let swapped = 0;
  for (const s of library) {
    const p = E.normalizePlan(s.plan), q = ORD.otherOrder(E, p);
    h.update(JSON.stringify([s.id, pick(SW.coupleSolverOn(p, true)), pick(SW.coupleSolverOn(q, true))]));
    if (SW.swapOf(p) || SW.swapOf(q)) swapped++;
  }
  SW.PLANT.rule = '';
  const dig = h.digest('hex');
  ok(1, `the switch: SWAP_ELDER ${SW.SWAP_ELDER ? 'on' : 'OFF'}, the ${mirrored.length} library couples mirrored with an elder second ${shipped ? 'all swapped' : 'NOT all swapped'}; taken off (the rollback), ${swapped} plans swapped and the guard's decisions on the library's ${library.length} couples, as entered and mirrored, the code before's to the bit`,
    shipped && swapped === 0 && dig === BEFORE, `${dig.slice(0, 16)} against the code before's ${BEFORE.slice(0, 16)}`);
}

// ---- 2. the guard with the swap on, as shipped ----
{
  SW.PLANT.rule = PLANT === 'capafter' || PLANT === 'noagecap' ? PLANT : '';
  const bad = [], units = readSharePanel().filter(u => u.kind === 'reheld');
  let elderSecond = 0;
  for (const u of units) {
    const q = ORD.otherOrder(E, E.normalizePlan(u.plan)), g = SW.coupleSolverOn(q, true);
    if (!(g.on && g.swap)) bad.push(`${u.id} entered younger first: ${g.on ? 'on' : `off (${g.why})`}${g.swap ? ', swapped' : ''}`); else elderSecond++;
  }
  const inBand = library.map(s => SW.coupleSolverOn(ORD.otherOrder(E, E.normalizePlan(s.plan)), true)).filter(g => g.on && g.swap).length;
  const sameAge = (() => { const p = JSON.parse(JSON.stringify(E.normalizePlan(library[0].plan))); p.demographics.currentAgePart = ctxOf(p).ageSelf0; return SW.swapOf(E.normalizePlan(p)); })();
  // the age cap: S015-90 (stage C) entered younger first at 50 and 80, its plan to 95: since D150 on and swapped, its mirror
  // keeping the plan's years past 120; under the guard before D150 (the plant 'beforeall') the cap, read on the plan as entered,
  // keeps it off ('capafter' with it: read on the mirror, whose end age the cap's reading stops at 120, so it runs)
  const s015 = units.find(u => u.id === 'S015-90'), young = ORD.otherOrder(E, E.normalizePlan(s015.plan));
  const wide = E.normalizePlan({ ...young, demographics: { ...young.demographics, currentAgeSelf: 50, currentAgePart: 80, terminalAge: 95 } }), gw = SW.coupleSolverOn(wide, true);
  if (!(gw.on && gw.swap)) bad.push(`the couple entered at 50 and 80 to 95: ${gw.on ? 'on' : `off (${gw.why})`}${gw.swap ? ', swapped' : ', not swapped'}`);
  const was = SW.PLANT.rule; SW.PLANT.rule = [was, 'beforeall'].filter(Boolean).join(',');
  const gb = SW.coupleSolverOn(wide, true);
  SW.PLANT.rule = was;
  if (gb.on || gb.why !== 'ages') bad.push(`the couple entered at 50 and 80 to 95, under the guard before D150: ${gb.on ? 'on' : `off (${gb.why})`}`);
  // with the swap off the couple is not mirrored, so the cap is read on the plan as entered: 'ages', not swapped
  SW.PLANT.rule = [was, 'swapoff'].filter(Boolean).join(',');
  const go = SW.coupleSolverOn(wide, true);
  SW.PLANT.rule = was;
  if (go.on || go.why !== 'ages' || go.swap) bad.push(`the couple entered at 50 and 80 to 95, the swap off: ${go.on ? 'on' : `off (${go.why})`}${go.swap ? ', swapped' : ''}`);
  if (sameAge) bad.push('a couple of one age swapped');
  if (inBand !== library.length) bad.push(`${inBand} of ${library.length} library couples entered younger first on and swapped`);
  // the same couples without the swap (the rollback, as the code before it): each keeps the app's rules
  SW.PLANT.rule = 'swapoff';
  const today = units.filter(u => SW.coupleSolverOn(ORD.otherOrder(E, E.normalizePlan(u.plan)), true).on).length;
  SW.PLANT.rule = '';
  ok(2, `the guard with the swap on: stage C's ${units.length} re-held couples entered younger first on and swapped (${elderSecond}; today ${today} on); the library's couples entered younger first on and swapped (${inBand}); one age not swapped; a couple whose mirror passes 120 on and swapped since D150, kept off by the age cap on the plan as entered before it and with the swap off`,
    !bad.length && today === 0, bad.slice(0, 3).join('; ') || 'every case');
}

// the couple written younger first by hand: S007's two people's fields put in each other's places, with a band
const A = (() => { const p = JSON.parse(JSON.stringify(E.normalizePlan(library.find(s => s.id === 'S007').plan))); const a = ctxOf(p).ageSelf0; p.spending.spendBands = [{ id: 'b1', fromAge: a + 8, toAge: a + 14, amount: Math.round(0.8 * Number(p.spending.targetSpend)) }]; return E.normalizePlan(p); })();
const B = (() => {
  const d = A.demographics, b = JSON.parse(JSON.stringify(A)), h = b.demographics, c = ctxOf(A);
  for (const k of ORD.PAIRED) { h[`${k}Self`] = d[`${k}Part`]; h[`${k}Part`] = d[`${k}Self`]; }
  h.currentAgeSelf = c.agePart0; h.currentAgePart = c.ageSelf0; h.terminalAge = c.terminalAge - c.ageSelf0 + c.agePart0;
  const other = o => (o === 'Myself' ? 'Partner' : 'Myself'), oid = id => (id.endsWith('_self') ? id.slice(0, -5) + '_part' : id.slice(0, -5) + '_self');
  b.accounts = A.accounts.map(x => ({ ...x, owner: other(x.owner), id: oid(x.id) }));
  b.otherIncomes = A.otherIncomes.map(i => ({ ...i, owner: other(i.owner) }));
  b.oneOffContributions = A.oneOffContributions.map(x => ({ ...x, owner: other(x.owner || 'Myself') }));
  b.oneOffCosts = A.oneOffCosts.map(x => (x.owner ? { ...x, owner: other(x.owner) } : x));
  const gap = c.agePart0 - c.ageSelf0;
  b.spending.spendBands = A.spending.spendBands.map(x => ({ ...x, fromAge: x.fromAge + gap, toAge: x.toAge === '' ? '' : x.toAge + gap }));
  return E.normalizePlan(b);
})();

// ---- 3. the identity ----
{
  const viaMirror = couplePlans(E, ORD.otherOrder(E, B), { shareRule: 'pots' }), elderFirst = couplePlans(E, A, { shareRule: 'pots' });
  const same = JSON.stringify(viaMirror) === JSON.stringify(elderFirst);
  ok(3, "the identity: the couple written younger first by hand, cut through its mirror by the page's route, is cut as the same couple entered elder first (each person's plan, the share, the household, the ages) to the bit",
    same && SW.elderOf(B) === 'part', `the share ${viaMirror.share} and ${elderFirst.share}`);
}

// ---- 4. the answers put back ----
{
  const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
  const cpl = couplePlans(E, A, { shareRule: 'pots' }), memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: 4, research: LIGHT, ageWith: o.partnerAge0 })); return memo.get(k); };
  const cp = CPL.solveCouple(E, M, cpl.household, { shareRule: 'pots', solveOne });
  const cA = ctxOf(cpl.household), cB = ctxOf(B), gap = cB.ageSelf0 - cA.ageSelf0, ages = { self0: cB.ageSelf0, mirror0: cA.ageSelf0 }, bad = [];
  // the meta
  const meta = coupleMeta(cp), mB = ORD.backMeta(meta);
  if (!(mB.share === 1 - meta.share && JSON.stringify(mB.self) === JSON.stringify(meta.part) && JSON.stringify(mB.part) === JSON.stringify(meta.self))) bad.push('the meta');
  // this year's actions
  const acts = coupleActionsOf(E, cp, A, { seed: 7002, n: 40 }), aB = ORD.backAnswer('actions', { actions: acts }, ages).actions;
  const whoCount = (x, w) => x.actions.filter(y => y.who === w).length;
  if (whoCount(aB, 'self') !== whoCount(acts, 'part') || whoCount(aB, 'part') !== whoCount(acts, 'self')) bad.push("the actions' persons");
  if (JSON.stringify(aB.move.parts.self) !== JSON.stringify(acts.move.parts.part) || (acts.move.parts.split !== undefined && aB.move.parts.split !== 1 - acts.move.parts.split)) bad.push("the move's parts or split");
  // the next years
  const runs = strategyRuns(E, cp, A, { seed: 7002, from: 0, to: 40 }), ahead = coupleAheadOf(E, cp, A, runs, { years: 10 }), hB = ORD.backAnswer('ahead', { ahead }, ages).ahead;
  if (hB.rows.some(r => r.age !== cB.ageSelf0 + r.t)) bad.push('the next years\' ages not the entered first person\'s');
  // each person's moves in the next years under their own name, seen on a year where the two people's moves differ
  const js = x => JSON.stringify(x), twoAhead = ahead.rows.filter(r => r.parts && js(r.parts.self) !== js(r.parts.part));
  if (!twoAhead.length) bad.push('no year ahead where the two people\'s moves differ: the fixture cannot see the parts');
  if (ahead.rows.some((r, i) => r.parts && (js(hB.rows[i].parts.self) !== js(r.parts.part) || js(hB.rows[i].parts.part) !== js(r.parts.self)))) bad.push('the next years\' moves not under each person\'s own name');
  // the year rows and their verdict
  const rows = coupleRowsOf(E, cp, 'expected'), rB = ORD.backAnswer('rows', { rows }, ages).rows;
  const idsB = new Set(cB.accounts.map(x => x.id));
  rB.rows.forEach((row, t) => {
    if (row.ageSelf !== cB.ageSelf0 + t || row.agePart !== cB.agePart0 + t) bad.push(`row ${t}'s ages`);
    if (!Object.keys(row.pots || {}).every(id => idsB.has(id))) bad.push(`row ${t}'s accounts not the entered ids`);
    const a0 = rows.rows[t];
    if (row.taxablePensionSelf !== a0.taxablePensionPart || row.spSelf !== a0.spPart) bad.push(`row ${t}'s first person's figures not the entered first person's`);
    const pa = rows.parts[t];
    if (pa && pa.part && row.tierPen !== pa.part.tierPen) bad.push(`row ${t}'s tier not the entered first person's`);
  });
  // each person's moves in the year rows under their own name, seen on a year where the two differ
  const twoRows = rows.parts.filter(pa => pa && js(pa.self) !== js(pa.part));
  if (!twoRows.length) bad.push('no year row where the two people\'s moves differ: the fixture cannot see the parts');
  if (rows.parts.some((pa, t) => pa && (js(rB.parts[t].self) !== js(pa.part) || js(rB.parts[t].part) !== js(pa.self)))) bad.push('the year rows\' moves not under each person\'s own name');
  // the failure age, on a run that fails: the year rows in a market at z -2.5 every year
  const fail = coupleRowsOf(E, cp, { z: -2.5 }), fB = ORD.backAnswer('rows', { rows: fail }, ages).rows;
  if (!(fail.verdict && fail.verdict.failAge !== null && fail.verdict.failAge !== undefined)) bad.push('the failing run survives: the fixture cannot see the failure age');
  else if (fB.verdict.failAge !== cB.ageSelf0 + (fail.verdict.failAge - cA.ageSelf0)) bad.push(`the failure age ${fB.verdict.failAge}, not the entered first person's ${cB.ageSelf0 + (fail.verdict.failAge - cA.ageSelf0)}`);
  if (rows.verdict && rows.verdict.failAge !== null && rows.verdict.failAge !== undefined && rB.verdict.failAge !== cB.ageSelf0 + (rows.verdict.failAge - cA.ageSelf0)) bad.push('the failure age on the expected market');
  ok(4, `the answers put back: S007 solved light, its meta, ${acts.actions.length} actions, ${ahead.rows.length} years ahead (${twoAhead.length} where the two people's moves differ) and ${rows.rows.length} year rows (${twoRows.length} so) put back for the couple written younger first, each in that couple's terms, and a failing run's failure age`,
    !bad.length, bad.slice(0, 4).join('; ') + (bad.length > 4 ? `; and ${bad.length - 4} more` : '') || `the gap ${gap} years; the failing run fails at ${fail.verdict.failAge} as the mirror reads it, ${fB.verdict.failAge} as entered`);

  // ---- 5. the Strategy tab's figures put back ----
  {
    const sum = strategySummary(E, cp, strategyRuns(E, cp, B, { seed: 7002, from: 0, to: 40 })), sB = ORD.backAnswer('strategy', { strategy: sum }, ages).strategy, bad5 = [];
    const sp = sum.outlook.spend, spB = sB.outlook.spend;
    if (!sp.length) bad5.push('no outlook years');
    if (sp.some(x => x.age !== cA.ageSelf0 + x.t)) bad5.push('the mirror\'s outlook not in the elder\'s ages (the fixture)');
    if (spB.some((x, i) => x.age !== cB.ageSelf0 + x.t || x.t !== sp[i].t || x.p50 !== sp[i].p50)) bad5.push('the outlook years not in the entered first person\'s ages, or a figure moved');
    if (sum.raise && !(sB.raise.age === cB.ageSelf0 + sum.raise.t && sB.raise.level === sum.raise.level)) bad5.push('the raise\'s age not the entered first person\'s');
    const rest = x => js({ ...x, raise: x.raise ? { ...x.raise, age: 0 } : x.raise, outlook: { ...x.outlook, spend: x.outlook.spend.map(y => ({ ...y, age: 0 })) } });
    if (rest(sB) !== rest(sum)) bad5.push('a figure other than an age moved');
    ok(5, `the Strategy tab's figures put back: the summary on the mirror's solve against the couple written younger first, ${sp.length} outlook years${sum.raise ? ' and the raise' : ''} in the entered first person's ages, every other figure the mirror's`,
      !bad5.length, bad5.join('; ') || `the first outlook year at ${spB[0] && spB[0].age} as entered, ${sp[0] && sp[0].age} as the mirror reads it${sum.raise ? `; the raise from ${sB.raise.age} as entered, ${sum.raise.age} as the mirror reads it` : ''}`);
  }
}

console.log(`\ncouple-swap: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
