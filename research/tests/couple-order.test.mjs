/*
 * A COUPLE ENTERED THE OTHER WAY ROUND, THE APP'S MIRROR (src/coupleOrder.js otherOrder; D104 (1)): each person's year in the
 * mirror the plan as entered, as the engine reads it.
 *   1. twice is itself: the library's 210 couples, and couples built with bands (whole ages, closed and open), incomes with
 *      blank and given end ages, deposits, one-off costs with an owner and a tier ceiling each, mirrored twice, the plan
 *      itself (normalised), to the bit
 *   2. each person's year: on the built couples (the partner older, younger, and younger by three and a half years; and the
 *      partner older with the plan's years ending in .5, by the end age 95.5 with the first person's annuity left open too,
 *      and by a first age ending .5: the reviewer's second round on D104 (1)'s change of default, finding 1), the plan as
 *      entered and its mirror read by the engine (buildContext) give the same horizon and, plan year by plan year, the
 *      same scheduled target (the bands), each person's incomes paid and their amounts, each person's pots and
 *      contributions, the one-off costs and the minimum pot, each person's fields in the other's place
 *   3. the research mirror (research/solver/couple-order.mjs, the other-order read's own) on the library's couples, none of
 *      which holds a band: the same plan, to the bit
 *   4. a couple written younger first by hand, not by the mirror: S007's two people's fields, accounts and incomes put in each
 *      other's places field by field, with a band at the first person's ages; its mirror read by the engine is the plan as
 *      written elder first, read by the engine (the ages, the horizon, each person's pots and incomes, the bands' years)
 *   5. the limits per person (the reviewer on D104 (1)'s change of default, MINOR 3: the built ceilings were written as
 *      strings, which normalising drops, so nothing saw the swap): on the built couples, each with a ceiling per person as the
 *      page writes them ({ pen, isa }, each a risk tier) and kept by normalising, the mirror's are the entered ones swapped
 *   6. the ages put back over ages in tenths (the reviewer's second round, finding 2: adding the gap read 63.99999999999999
 *      for 64): for a first person entered from 40 to 63 in tenths and an elder entered second 0.1 to 10 years older, the
 *      mirror's answers (the next years, the Strategy tab's outlook and raise, a run's failure age), each age its first
 *      person's in a plan year as the engine writes it, put back are the entered first person's age in that plan year exactly
 * Plants (--planted runs each and wants exactly its checks to fail): 'bandstay' (coupleOrder.js PLANT.rule: the bands left
 * where they were entered, as the research mirror leaves them) fails checks 2 and 4; 'locksstay' (the limits left where they
 * were entered) fails check 5; 'wholeend' (the end age the new first person's age plus the whole years, the first form of the
 * fix) and 'incomeopen' (an open income left blank whatever the plan as entered reads) fail check 2; 'gapadd' (the gap
 * added) fails check 6.
 *   node research/tests/couple-order.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as ORD from '../../src/coupleOrder.js';
import { couplesOf } from '../solver/couple-panel.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['bandstay', ['2', '4']], ['locksstay', ['5']], ['wholeend', ['2']], ['incomeopen', ['2']], ['gapadd', ['6']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_ORDER_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
const { otherOrder } = ORD;
const PLANT = process.env.COUPLE_ORDER_PLANT || '';
ORD.PLANT.rule = PLANT;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-order: the app's mirror of a couple entered the other way round${PLANT ? `; planted: ${PLANT}` : ''}`);
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const library = couplesOf();
const S007 = E.normalizePlan(library.find(s => s.id === 'S007').plan), c007 = ctxOf(S007);

// the built couples: S007 with the partner older, younger (as it is) and younger by three and a half years, each with two
// bands, a DB pension of the partner's (end blank) and an annuity of the first person's (end given), a deposit of each, a
// one-off cost of the partner's and a tier ceiling each
function built(partAge) {
  const p = JSON.parse(JSON.stringify(S007)), a = c007.ageSelf0, tgt = Number(p.spending.targetSpend), y0 = c007.baseYear;
  if (partAge !== null) p.demographics.currentAgePart = partAge;
  p.spending.spendBands = [{ id: 'b1', fromAge: a + 6, toAge: a + 12, amount: Math.round(1.1 * tgt) }, { id: 'b2', fromAge: a + 20, toAge: '', amount: Math.round(0.75 * tgt) }];
  p.otherIncomes = [{ id: 'db1', name: 'DB pension', owner: 'Partner', startAge: 66, endAge: '', amount: 9000, incomeType: 'otherTaxable', notes: '' },
    { id: 'an1', name: 'Annuity', owner: 'Myself', startAge: 70, endAge: 85, amount: 4000, incomeType: 'otherTaxable', notes: '' }];
  p.oneOffContributions = [{ id: 'd1', owner: 'Myself', category: 'ISA', year: y0 + 2, amount: 10000 }, { id: 'd2', owner: 'Partner', category: 'ISA', year: y0 + 3, amount: 8000 }];
  p.oneOffCosts = [{ id: 'c1', name: 'car', owner: 'Partner', date: `${y0 + 4}-06-01`, amount: 20000 }];
  p.solver = { ...(p.solver || {}), locks: { ...((p.solver && p.solver.locks) || {}), tierCeiling: { pen: 'Medium Risk', isa: 'Medium/Low Risk' }, tierCeilingPart: { pen: 'Medium/High Risk', isa: 'Low Risk' } } };
  return E.normalizePlan(p);
}
const CASES = [['the partner younger', built(null)], ['the partner older', built(c007.ageSelf0 + 4)], ['the partner 3.5 years younger', built(c007.ageSelf0 - 3.5)]];
// the plan's years ending in .5, so its last year falls past the end age, which the engine reads unrounded for an open band and
// an open income: by the end age (with the first person's annuity left open as well) and by the first age
{
  const older = built(c007.ageSelf0 + 4), withEnd = JSON.parse(JSON.stringify(older)), withFirst = JSON.parse(JSON.stringify(older));
  withEnd.demographics.terminalAge = 95.5; withEnd.otherIncomes = withEnd.otherIncomes.map(i => (i.owner === 'Myself' ? { ...i, endAge: '' } : i));
  withFirst.demographics.currentAgeSelf = c007.ageSelf0 + 0.5;
  CASES.push(['the partner older, the end age 95.5, both incomes open', E.normalizePlan(withEnd)], ['the partner older, the first age ending .5', E.normalizePlan(withFirst)]);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- 1. twice is itself ----
{
  const bad = [];
  for (const s of library) { const p = E.normalizePlan(s.plan); if (!same(otherOrder(E, otherOrder(E, p)), p)) bad.push(s.id); }
  for (const [name, p] of CASES.slice(0, 2)) if (!same(otherOrder(E, otherOrder(E, p)), p)) bad.push(name);
  ok(1, `twice is itself: the library's ${library.length} couples and the built couples with whole ages, mirrored twice, the plan itself to the bit`, !bad.length, bad.slice(0, 5).join(', ') || `${library.length + 2} plans`);
}

// each person's year as the engine reads it, the plan as entered against its mirror (whose persons are in each other's places)
function yearDiffs(p, q) {
  const a = ctxOf(p), b = ctxOf(q), out = [];
  const other = o => (o === 'self' ? 'part' : 'self'), age0 = (c, o) => (o === 'self' ? c.ageSelf0 : c.agePart0);
  if (a.totalYears !== b.totalYears) out.push(`the horizon ${a.totalYears} against ${b.totalYears}`);
  if (a.ageSelf0 !== b.agePart0 || a.agePart0 !== b.ageSelf0) out.push('the ages not swapped');
  if (a.solvencyFloor !== b.solvencyFloor) out.push('the minimum pot');
  for (let t = 0; t <= Math.min(a.totalYears, b.totalYears); t++) {
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

// ---- 2. each person's year ----
{
  const bad = [];
  for (const [name, p] of CASES) { const d = yearDiffs(p, otherOrder(E, p)); if (d.length) bad.push(`${name}: ${d.length} differences (${d.slice(0, 2).join('; ')})`); }
  ok(2, `each person's year: on ${CASES.length} built couples the plan as entered and its mirror, read by the engine, give each person the same year, plan year by plan year`, !bad.length, bad.join(' | ') || 'every plan year, both people');
}

// ---- 3. the research mirror, where no plan holds a band ----
{
  const { otherOrder: researchOrder } = await import('../solver/couple-order.mjs');
  const bad = [], banded = library.filter(s => (s.plan.spending.spendBands || []).length > 0).length;
  for (const s of library) { const p = E.normalizePlan(s.plan); if (!same(otherOrder(E, p), researchOrder(E, p))) bad.push(s.id); }
  ok(3, `the research mirror: on the library's ${library.length} couples (${banded} holding a band) the same plan to the bit`, !bad.length && banded === 0, bad.slice(0, 5).join(', ') || `${library.length} plans`);
}

// ---- 4. a couple written younger first by hand ----
{
  // S007 as entered (the first person the elder), with a band; and the same couple written by hand the other way round:
  // each Self/Part field put in the other's place, each account and income given to the other person, the end age moved
  const elder = built(null), d = elder.demographics, byHand = JSON.parse(JSON.stringify(elder)), h = byHand.demographics;
  for (const k of ORD.PAIRED) { h[`${k}Self`] = d[`${k}Part`]; h[`${k}Part`] = d[`${k}Self`]; }
  const ce = ctxOf(elder);
  h.currentAgeSelf = ce.agePart0; h.currentAgePart = ce.ageSelf0; h.terminalAge = ce.terminalAge - ce.ageSelf0 + ce.agePart0;
  byHand.accounts = elder.accounts.map(a => ({ ...a, owner: a.owner === 'Myself' ? 'Partner' : 'Myself', id: a.id.endsWith('_self') ? a.id.slice(0, -5) + '_part' : a.id.slice(0, -5) + '_self' }));
  byHand.otherIncomes = elder.otherIncomes.map(i => ({ ...i, owner: i.owner === 'Myself' ? 'Partner' : 'Myself' }));
  byHand.oneOffContributions = elder.oneOffContributions.map(c => ({ ...c, owner: c.owner === 'Myself' ? 'Partner' : 'Myself' }));
  byHand.oneOffCosts = elder.oneOffCosts.map(c => ({ ...c, owner: c.owner === 'Myself' ? 'Partner' : 'Myself' }));
  byHand.solver.locks = { ...elder.solver.locks, tierCeiling: elder.solver.locks.tierCeilingPart, tierCeilingPart: elder.solver.locks.tierCeiling };
  // the bands written by hand in the younger's ages, the same plan years (whole ages: the age gap added)
  const gap = ce.agePart0 - ce.ageSelf0;
  byHand.spending.spendBands = elder.spending.spendBands.map(b => ({ ...b, fromAge: b.fromAge + gap, toAge: b.toAge === '' ? '' : b.toAge + gap }));
  const written = E.normalizePlan(byHand), mirrored = otherOrder(E, written);
  const d1 = yearDiffs(written, elder), d2 = yearDiffs(mirrored, written);
  const sameAsElder = (() => { const a = ctxOf(mirrored), b = ctxOf(elder); return a.ageSelf0 === b.ageSelf0 && a.agePart0 === b.agePart0 && a.totalYears === b.totalYears && JSON.stringify(a.spendBands) === JSON.stringify(b.spendBands) && JSON.stringify(a.otherIncomes) === JSON.stringify(b.otherIncomes); })();
  ok(4, "a couple written younger first by hand: the hand-written plan is the elder-first plan's household person for person, and its mirror, read by the engine, is the elder-first plan's (ages, horizon, bands, incomes)",
    !d1.length && !d2.length && sameAsElder, `${d1.length + d2.length} differences${d1.length + d2.length ? `: ${[...d1, ...d2].slice(0, 2).join('; ')}` : ''}; the mirror read as the elder-first plan: ${sameAsElder ? 'yes' : 'NO'}`);
}

// ---- 5. the limits per person ----
{
  const bad = [];
  for (const [name, p] of CASES) {
    const L = p.solver && p.solver.locks, q = otherOrder(E, p), Q = q.solver && q.solver.locks;
    const kept = !!L && L.tierCeiling && L.tierCeiling.pen === 'Medium Risk' && L.tierCeilingPart && L.tierCeilingPart.isa === 'Low Risk';
    if (!kept) { bad.push(`${name}: the built ceilings not kept by normalising`); continue; }
    if (!(Q && same(Q.tierCeiling, L.tierCeilingPart) && same(Q.tierCeilingPart, L.tierCeiling))) bad.push(`${name}: the mirror's ceilings ${JSON.stringify(Q && Q.tierCeiling)} and ${JSON.stringify(Q && Q.tierCeilingPart)}, not the entered ones swapped`);
  }
  ok(5, `the limits per person: on the ${CASES.length} built couples, each person's ceiling kept by normalising, and the mirror's the entered ones swapped`, !bad.length, bad.slice(0, 2).join('; ') || 'each one');
}

// ---- 6. the ages put back, over ages in tenths ----
{
  const bad = []; let n = 0;
  for (let a10 = 400; a10 <= 630; a10++) for (let d10 = 1; d10 <= 100; d10 += 3) {
    // the entered first person a, the elder entered second b; the mirror's answers in b's ages as the engine writes them
    const a = a10 / 10, b = (a10 + d10) / 10, ages = { self0: a, mirror0: b }, years = 40;
    const rows = Array.from({ length: years }, (_, t) => ({ t, age: b + t, parts: null }));
    const ahead = ORD.backAnswer('ahead', { ahead: { couple: true, rows } }, ages).ahead;
    const strat = ORD.backAnswer('strategy', { strategy: { raise: { level: 1.1, age: b + 3, t: 3 }, outlook: { spend: rows.map(r => ({ t: r.t, age: r.age, p50: 1 })) } } }, ages).strategy;
    const verdict = ORD.backAnswer('rows', { rows: { couple: true, rows: [], parts: [], verdict: { survived: false, failAge: b + 17 } } }, ages).rows.verdict;
    n++;
    const off = [...ahead.rows.filter(r => r.age !== a + r.t).map(r => `the year ahead at ${r.age}`), ...strat.outlook.spend.filter(x => x.age !== a + x.t).map(x => `the outlook at ${x.age}`),
      ...(strat.raise.age !== a + 3 ? [`the raise at ${strat.raise.age}`] : []), ...(verdict.failAge !== a + 17 ? [`the failure age ${verdict.failAge}`] : [])];
    if (off.length) bad.push(`${a} and ${b}: ${off[0]}, as entered ${a + (off[0].startsWith('the raise') ? 3 : off[0].startsWith('the failure') ? 17 : 0)}${off.length > 1 ? ` (and ${off.length - 1} more)` : ''}`);
  }
  ok(6, `the ages put back: over ${n} couples with ages in tenths, the next years, the outlook, the raise and the failure age each the entered first person's age in its plan year, exactly`,
    !bad.length, bad.length ? `${bad.length} couples off (${bad.slice(0, 2).join('; ')})` : `${n} couples, ${n * 82} ages`);
}

console.log(`\ncouple-order: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
