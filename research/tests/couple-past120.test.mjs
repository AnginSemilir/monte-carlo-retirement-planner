/*
 * A PLAN PAST THE ELDER'S 120TH YEAR, ON THE SOLVER (D150; research/solver/COUPLES-ANY.md amendment 3, D). The plan's end age
 * is the first person's, at most 120, and a partner older than the first person can pass 120 within the plan, which the engine
 * runs as entered to its end. The household route solves such a couple elder first, on its mirror (src/coupleOrder.js
 * otherOrder), whose end age then passes 120: the mirror is marked as derived from the plan as entered (`derivedEnd`) and the
 * engine keeps its years (App.jsx buildContext), where before it stopped them at 120, the mirror ran short and the solve
 * failed. Since D150's change of default the guard runs such a couple (src/couplesSwitch.js AGE_CAP off: the age cap,
 * horizonFits, read only where the couple is not solved on its mirror; research/tests/couple-default.test.mjs check 6); the
 * guard before it kept it on the app's rules (the plant 'beforeall', the rollback).
 *   1. the mirror's years: over the variants (each of the library's 210 couples with the partner made the elder, entered
 *      second, their age at the plan's end 122 and 127), the mirror runs the plan's whole years, marked, its end age past 120;
 *   2. each person's year: on S007 built with bands, incomes, deposits, a one-off cost and a ceiling each, the partner the
 *      elder past 120 (their end age 122 and 127, and with the plan's years ending in .5), the plan as entered and its mirror,
 *      read by the engine, give each person the same year, plan year by plan year (couple-order.test.mjs check 2's reading);
 *   3. the household solved: on three variants, the household's cut (src/solverCouple.js householdCut, the couples' default
 *      form and shapes) and the plan it solves run the plan's years, its table solved apart inside the bands at the light
 *      settings, the household assembled (householdSolved) and run by the engine on 50 paths of seed 99001 over those years;
 *   4. the identity: the library's 210 couples as entered, all within the ceiling, mirrored as by the code before (no mark), the
 *      mirror and its context the same; and a plan as entered with an end age of 130 still stopping at 120;
 *   5. twice is itself: each variant with whole ages, mirrored twice, the plan as entered, the mark gone.
 * Plants (--planted runs each and wants exactly its checks to fail): 'nomark' (coupleOrder.js PLANT.rule: the mirror never
 * marked, so its years stop at 120, as before) fails checks 1, 2, 3 and 5; 'markall' (every mirror marked) fails checks 4 and 5.
 * Light settings: the route and the years are under test, not the table's quality. EXPLORATORY in nothing: it reads no outcome.
 *   node research/tests/couple-past120.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as ORD from '../../src/coupleOrder.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { APP_COUPLE } from '../../src/solverSettings.js';
import { couplesOf } from '../solver/couple-panel.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['nomark', ['1', '2', '3', '5']], ['markall', ['4', '5']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, PAST120_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.PAST120_PLANT || '';
ORD.PLANT.rule = PLANT;
const { otherOrder } = ORD;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-past120: a plan past the elder's 120th year, its mirror and the household solved${PLANT ? `; planted: ${PLANT}` : ''}`);
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const library = couplesOf();

// the variants: each library couple with the partner made the elder, entered second, their age at the plan's end 120 + k
const variants = [];
for (const s of library) {
  const p0 = E.normalizePlan(s.plan), c = ctxOf(p0);
  for (const k of [2, 7]) {
    const partAge = 120 - c.totalYears + k;
    if (!(partAge > c.ageSelf0 + 1 && partAge <= 110)) continue;
    const p = JSON.parse(JSON.stringify(p0)); p.demographics.currentAgePart = partAge;
    variants.push([`${s.id} with the partner ${partAge}, ${partAge + c.totalYears} at the end`, E.normalizePlan(p)]);
  }
}

// ---- 1. the mirror's years ----
{
  const bad = [];
  for (const [name, p] of variants) {
    const q = otherOrder(E, p), a = ctxOf(p), b = ctxOf(q);
    if (b.totalYears !== a.totalYears || q.demographics.derivedEnd !== true || !(Number(q.demographics.terminalAge) > 120)) bad.push(`${name}: ${a.totalYears} years as entered, ${b.totalYears} mirrored, its end age ${q.demographics.terminalAge}, ${q.demographics.derivedEnd === true ? 'marked' : 'unmarked'}`);
  }
  ok(1, `the mirror's years: over ${variants.length} variants of the library's couples, the partner the elder past 120 at the plan's end, the mirror runs the plan's years, marked`, variants.length >= 300 && !bad.length, bad.length ? `${bad.length} not (${bad.slice(0, 2).join('; ')})` : 'every one');
}

// ---- 2. each person's year ----
// S007 built as couple-order.test.mjs builds it: two bands, a DB pension of the partner's (end blank) and an annuity of the first
// person's (end given), a deposit of each, a one-off cost of the partner's and a ceiling each, with the partner the elder past 120
const S007 = E.normalizePlan(library.find(s => s.id === 'S007').plan), c007 = ctxOf(S007);
function built(partAge, terminalAge = null) {
  const p = JSON.parse(JSON.stringify(S007)), a = c007.ageSelf0, tgt = Number(p.spending.targetSpend), y0 = c007.baseYear;
  p.demographics.currentAgePart = partAge;
  if (terminalAge !== null) p.demographics.terminalAge = terminalAge;
  p.spending.spendBands = [{ id: 'b1', fromAge: a + 6, toAge: a + 12, amount: Math.round(1.1 * tgt) }, { id: 'b2', fromAge: a + 20, toAge: '', amount: Math.round(0.75 * tgt) }];
  p.otherIncomes = [{ id: 'db1', name: 'DB pension', owner: 'Partner', startAge: 66, endAge: '', amount: 9000, incomeType: 'otherTaxable', notes: '' },
    { id: 'an1', name: 'Annuity', owner: 'Myself', startAge: 70, endAge: 85, amount: 4000, incomeType: 'otherTaxable', notes: '' }];
  p.oneOffContributions = [{ id: 'd1', owner: 'Myself', category: 'ISA', year: y0 + 2, amount: 10000 }, { id: 'd2', owner: 'Partner', category: 'ISA', year: y0 + 3, amount: 8000 }];
  p.oneOffCosts = [{ id: 'c1', name: 'car', owner: 'Partner', date: `${y0 + 4}-06-01`, amount: 20000 }];
  p.solver = { ...(p.solver || {}), locks: { ...((p.solver && p.solver.locks) || {}), tierCeiling: { pen: 'Medium Risk', isa: 'Medium/Low Risk' }, tierCeilingPart: { pen: 'Medium/High Risk', isa: 'Low Risk' } } };
  return E.normalizePlan(p);
}
// each person's year as the engine reads it, the plan as entered against its mirror (couple-order.test.mjs yearDiffs)
function yearDiffs(p, q) {
  const a = ctxOf(p), b = ctxOf(q), out = [];
  const other = o => (o === 'self' ? 'part' : 'self'), age0 = (c, o) => (o === 'self' ? c.ageSelf0 : c.agePart0);
  if (a.totalYears !== b.totalYears) out.push(`the horizon ${a.totalYears} against ${b.totalYears}`);
  if (a.ageSelf0 !== b.agePart0 || a.agePart0 !== b.ageSelf0) out.push('the ages not swapped');
  if (a.solvencyFloor !== b.solvencyFloor) out.push('the minimum pot');
  for (let t = 0; t <= Math.max(a.totalYears, b.totalYears); t++) {
    if (E.spendTargetAtAge(a, a.ageSelf0 + t) !== E.spendTargetAtAge(b, b.ageSelf0 + t)) out.push(`the scheduled target in plan year ${t}`);
    for (const o of ['self', 'part']) {
      const pay = (c, w) => c.otherIncomes.filter(i => i.owner === w).reduce((s, i) => { const age = age0(c, w) + t; return s + (age >= i.startAge && age <= i.endAge ? i.amount : 0); }, 0);
      if (pay(a, o) !== pay(b, other(o))) out.push(`${o}'s incomes in plan year ${t}`);
    }
    const y = a.baseYear + t;
    if ((a.oneOffCosts.get(y) || 0) !== (b.oneOffCosts.get(y) || 0)) out.push(`the one-off costs in ${y}`);
  }
  for (const o of ['self', 'part']) {
    const pots = (c, w) => c.accounts.filter(x => x.owner === w).map(x => `${x.cat}:${x.balance}:${x.contrib || 0}`).sort().join('|');
    if (pots(a, o) !== pots(b, other(o))) out.push(`${o}'s pots`);
    const own = (c, w) => c.owners.find(x => x.key === w);
    const f = (c, w) => { const x = own(c, w); return `${x.retireAge}:${x.statePension}:${x.salary}`; };
    if (f(a, o) !== f(b, other(o))) out.push(`${o}'s own fields`);
  }
  return out;
}
{
  const Y = c007.totalYears, CASES = [[`the partner ${120 - Y + 2}`, built(120 - Y + 2)], [`the partner ${120 - Y + 7}`, built(120 - Y + 7)],
    [`the partner ${120 - Y + 7}, the end age ${Number(S007.demographics.terminalAge) + 0.5}`, built(120 - Y + 7, Number(S007.demographics.terminalAge) + 0.5)]];
  const bad = [];
  for (const [name, p] of CASES) {
    const end = ctxOf(p).agePart0 + ctxOf(p).totalYears, d = yearDiffs(p, otherOrder(E, p));
    if (!(end > 120)) bad.push(`${name}: the partner ${end} at the end, not past 120`);
    if (d.length) bad.push(`${name}: ${d.length} differences (${d.slice(0, 2).join('; ')})`);
  }
  ok(2, `each person's year: on ${CASES.length} built couples whose partner passes 120, the plan as entered and its mirror, read by the engine, give each person the same year, plan year by plan year`, !bad.length, bad.join(' | ') || 'every plan year');
}

// ---- 3. the household solved ----
{
  const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, picks = [0, Math.floor(variants.length / 2), variants.length - 1];
  const bad = [];
  for (const i of picks) {
    const [name, p] = variants[i], Y = ctxOf(p).totalYears;
    try {
      const cut = householdCut(E, M, otherOrder(E, p), APP_COUPLE.household, { takeShapes: APP_COUPLE.takeShapes });
      const yh = ctxOf(cut.household).totalYears, yc = ctxOf(cut.hplan).totalYears;
      if (yh !== Y || yc !== Y) { bad.push(`${name}: the household plan ${yh} years and the plan it solves ${yc}, against ${Y}`); continue; }
      const H = bandsAt(E, cut.bands.k, cut.bands.paOne, () => solveForApp(E, M, cut.hplan, { points: 6, ageWith: cut.ageWith, research: { ...LIGHT } }), cut.bands.paK);
      const cp = householdSolved(E, M, { household: cut.household, form: APP_COUPLE.household, topK: 3, tieJoint: APP_COUPLE.tieJoint, holdPast: APP_COUPLE.holdPast, takeShapes: APP_COUPLE.takeShapes }, { r: H, plan: cut.hplan, ageWith: cut.ageWith });
      const ctx = solvedContext(E, cp); let n = 0;
      for (const zs of E.pathsForSeed(99001, 50, ctx.totalYears)) { const q = E.runTrial(ctx, Float64Array.from(zs)); if (q && typeof q.survived === 'boolean') n++; }
      if (ctx.totalYears !== Y || n !== 50) bad.push(`${name}: the solved household ${ctx.totalYears} years, ${n} of 50 paths run`);
    } catch (e) { bad.push(`${name}: ${e.message.slice(0, 120)}`); }
  }
  // the passing line names no library plan, as a committed record must not (D147: the held-out scan counts a plan a results
  // file names as used); a failing one names the variant
  ok(3, `the household solved: on ${picks.length} variants, its cut and the plan it solves run the plan's years, its table is solved inside the bands and the household assembled and run by the engine over them`, !bad.length, bad.join(' | ') || picks.map(i => variants[i][0].replace(/^\S+ with /, '')).join('; '));
}

// ---- 4. the identity within the ceiling ----
{
  const digestOf = () => {
    const h = createHash('sha256');
    for (const s of library) { const p = E.normalizePlan(s.plan), q = otherOrder(E, p), c = ctxOf(q); h.update(JSON.stringify([s.id, q, c.totalYears, c.terminalAge, c.ageSelf0, c.agePart0])); }
    return h.digest('hex');
  };
  const now = digestOf(), kept = ORD.PLANT.rule;
  ORD.PLANT.rule = 'nomark'; const before = digestOf(); ORD.PLANT.rule = kept;
  const p130 = JSON.parse(JSON.stringify(S007)); p130.demographics.terminalAge = 130;
  const c130 = ctxOf(p130), within = library.every(s => { const c = ctxOf(s.plan); return c.agePart0 + c.totalYears <= 120 + 1e-9; });
  ok(4, `the identity: the library's ${library.length} couples, every one within the ceiling, mirrored as by the code before, and a plan as entered with an end age of 130 still stopping at 120`,
    within && now === before && c130.terminalAge === 120, `${now.slice(0, 16)} against the code before's ${before.slice(0, 16)}; the end age 130 read as ${c130.terminalAge}`);
}

// ---- 5. twice is itself ----
{
  const bad = [];
  for (const [name, p] of variants) {
    const d = p.demographics; if (!Number.isInteger(Number(d.currentAgeSelf)) || !Number.isInteger(Number(d.currentAgePart))) continue;
    const back = otherOrder(E, otherOrder(E, p));
    if (!same(back, p)) bad.push(name);
  }
  ok(5, `twice is itself: the variants with whole ages, mirrored twice, the plan as entered, the mark gone`, !bad.length, bad.slice(0, 3).join(', ') || `${variants.length} plans`);
}

console.log(`couple-past120: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
