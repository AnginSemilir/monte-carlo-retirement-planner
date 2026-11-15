/*
 * A COUPLE WHOSE ELDER IS ENTERED SECOND, HANDED TO THE SOLVER ELDER FIRST (D104 (1); src/couplesSwitch.js SWAP_ELDER and
 * swapOf, built off in code; src/solverClient.js the swap and the answers put back; src/coupleOrder.js otherOrder and its
 * back* functions).
 *   1. off in code: SWAP_ELDER off, no plan is swapped, and the guard's decisions ({ on, share, why }) on the library's 210
 *      couples, each as entered and mirrored, are the code before's to the bit (a digest taken on 1dc3afea)
 *   2. the guard with the swap on (the plant 'swapon'): a couple whose elder is entered second and holds 75% or 90% (stage C's
 *      re-held units, mirrored) is on and swapped, where today it keeps the app's rules; a library couple entered younger
 *      first (inside the band) on and swapped; a couple of one age not swapped; and the age cap read on the plan as entered:
 *      a couple entered at 50 and 80 with its plan to 95 keeps the app's rules (its mirror's end age would pass 120)
 *   3. the identity: a couple written younger first by hand (S007's people put in each other's places field by field, with
 *      a band), cut through its mirror by the page's route (solverCouple.js couplePlans), is cut exactly as the same couple
 *      entered elder first: each person's plan, the share, the household and the ages each table is solved with, to the bit
 *   4. the answers put back: S007 solved light, elder first; its answers (the meta, this year's actions, the next years, the
 *      year rows and their verdict) put back for the couple written younger first are in that couple's terms: each person's
 *      meta, actions and parts under their own name, the split the entered first person's fraction, each age the entered
 *      first person's, each account under its entered id with the other person's figures, the tiers the entered first
 *      person's, the failure age the entered first person's
 * Plants: 'capafter' (couplesSwitch.js PLANT: the age cap read on the mirror) fails check 2; 'noback' (coupleOrder.js PLANT:
 * the answers left as the mirror's) fails check 4.
 *   node research/tests/couple-swap.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import * as SW from '../../src/couplesSwitch.js';
import * as ORD from '../../src/coupleOrder.js';
import { couplePlans, coupleMeta, coupleActionsOf, coupleAheadOf, coupleRowsOf } from '../../src/solverCouple.js';
import { strategyRuns } from '../../src/solverStrategy.js';
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
  for (const [plant, want] of [['capafter', ['2']], ['noback', ['4']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_SWAP_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.COUPLE_SWAP_PLANT || '';
if (PLANT === 'noback') ORD.PLANT.rule = 'noback';
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-swap: a couple whose elder is entered second, handed to the solver elder first${PLANT ? `; planted: ${PLANT}` : ''}`);
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const library = couplesOf();
const pick = o => ({ on: o.on, share: o.share, why: o.why });

// ---- 1. off in code ----
{
  const BEFORE = 'e18be1b36a22a4b81928063addc43692d505b391c25241aa15dfeaefcde8c34e';   // taken on 1dc3afea, the code before the swap
  const h = createHash('sha256');
  let swapped = 0;
  for (const s of library) {
    const p = E.normalizePlan(s.plan), q = ORD.otherOrder(E, p);
    h.update(JSON.stringify([s.id, pick(SW.coupleSolverOn(p, true)), pick(SW.coupleSolverOn(q, true))]));
    if (SW.swapOf(p) || SW.swapOf(q)) swapped++;
  }
  const dig = h.digest('hex');
  ok(1, `off in code: SWAP_ELDER ${SW.SWAP_ELDER ? 'ON' : 'off'}, ${swapped} plans swapped; the guard's decisions on the library's ${library.length} couples, as entered and mirrored, the code before's to the bit`,
    !SW.SWAP_ELDER && swapped === 0 && dig === BEFORE, `${dig.slice(0, 16)} against the code before's ${BEFORE.slice(0, 16)}`);
}

// ---- 2. the guard with the swap on ----
{
  SW.PLANT.rule = ['swapon', ...(PLANT === 'capafter' ? ['capafter'] : [])].join(',');
  const bad = [], units = readSharePanel().filter(u => u.kind === 'reheld');
  let elderSecond = 0;
  for (const u of units) {
    const q = ORD.otherOrder(E, E.normalizePlan(u.plan)), g = SW.coupleSolverOn(q, true);
    if (!(g.on && g.swap)) bad.push(`${u.id} entered younger first: ${g.on ? 'on' : `off (${g.why})`}${g.swap ? ', swapped' : ''}`); else elderSecond++;
  }
  const inBand = library.map(s => SW.coupleSolverOn(ORD.otherOrder(E, E.normalizePlan(s.plan)), true)).filter(g => g.on && g.swap).length;
  const sameAge = (() => { const p = JSON.parse(JSON.stringify(E.normalizePlan(library[0].plan))); p.demographics.currentAgePart = ctxOf(p).ageSelf0; return SW.swapOf(E.normalizePlan(p)); })();
  // the age cap: S015-90 (stage C) entered younger first at 50 and 80, its plan to 95
  const s015 = units.find(u => u.id === 'S015-90'), young = ORD.otherOrder(E, E.normalizePlan(s015.plan));
  const wide = E.normalizePlan({ ...young, demographics: { ...young.demographics, currentAgeSelf: 50, currentAgePart: 80, terminalAge: 95 } }), gw = SW.coupleSolverOn(wide, true);
  if (gw.on || gw.why !== 'ages') bad.push(`the couple entered at 50 and 80 to 95: ${gw.on ? 'on' : `off (${gw.why})`}`);
  if (sameAge) bad.push('a couple of one age swapped');
  if (inBand !== library.length) bad.push(`${inBand} of ${library.length} library couples entered younger first on and swapped`);
  SW.PLANT.rule = '';
  const today = units.filter(u => SW.coupleSolverOn(ORD.otherOrder(E, E.normalizePlan(u.plan)), true).on).length;
  ok(2, `the guard with the swap on: stage C's ${units.length} re-held couples entered younger first on and swapped (${elderSecond}; today ${today} on); the library's couples entered younger first on and swapped (${inBand}); one age not swapped; the age cap on the plan as entered`,
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
  const cA = ctxOf(cpl.household), cB = ctxOf(B), gap = cB.ageSelf0 - cA.ageSelf0, bad = [];
  // the meta
  const meta = coupleMeta(cp), mB = ORD.backMeta(meta);
  if (!(mB.share === 1 - meta.share && JSON.stringify(mB.self) === JSON.stringify(meta.part) && JSON.stringify(mB.part) === JSON.stringify(meta.self))) bad.push('the meta');
  // this year's actions
  const acts = coupleActionsOf(E, cp, A, { seed: 7002, n: 40 }), aB = ORD.backAnswer('actions', { actions: acts }, gap).actions;
  const whoCount = (x, w) => x.actions.filter(y => y.who === w).length;
  if (whoCount(aB, 'self') !== whoCount(acts, 'part') || whoCount(aB, 'part') !== whoCount(acts, 'self')) bad.push("the actions' persons");
  if (JSON.stringify(aB.move.parts.self) !== JSON.stringify(acts.move.parts.part) || (acts.move.parts.split !== undefined && aB.move.parts.split !== 1 - acts.move.parts.split)) bad.push("the move's parts or split");
  // the next years
  const runs = strategyRuns(E, cp, A, { seed: 7002, from: 0, to: 40 }), ahead = coupleAheadOf(E, cp, A, runs, { years: 10 }), hB = ORD.backAnswer('ahead', { ahead }, gap).ahead;
  if (hB.rows.some(r => r.age !== cB.ageSelf0 + r.t)) bad.push('the next years\' ages not the entered first person\'s');
  // the year rows and their verdict
  const rows = coupleRowsOf(E, cp, 'expected'), rB = ORD.backAnswer('rows', { rows }, gap).rows;
  const idsB = new Set(cB.accounts.map(x => x.id));
  rB.rows.forEach((row, t) => {
    if (row.ageSelf !== cB.ageSelf0 + t || row.agePart !== cB.agePart0 + t) bad.push(`row ${t}'s ages`);
    if (!Object.keys(row.pots || {}).every(id => idsB.has(id))) bad.push(`row ${t}'s accounts not the entered ids`);
    const a0 = rows.rows[t];
    if (row.taxablePensionSelf !== a0.taxablePensionPart || row.spSelf !== a0.spPart) bad.push(`row ${t}'s first person's figures not the entered first person's`);
    const pa = rows.parts[t];
    if (pa && pa.part && row.tierPen !== pa.part.tierPen) bad.push(`row ${t}'s tier not the entered first person's`);
  });
  if (rows.verdict && rows.verdict.failAge !== null && rB.verdict.failAge !== rows.verdict.failAge + gap) bad.push('the failure age');
  ok(4, `the answers put back: S007 solved light, its meta, ${acts.actions.length} actions, ${ahead.rows.length} years ahead and ${rows.rows.length} year rows put back for the couple written younger first, each in that couple's terms`,
    !bad.length, bad.slice(0, 4).join('; ') + (bad.length > 4 ? `; and ${bad.length - 4} more` : '') || `the gap ${gap} years`);
}

console.log(`\ncouple-swap: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
