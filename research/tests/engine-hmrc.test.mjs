/*
 * THE ENGINE'S YEAR AGAINST HMRC'S ORDER (the external review of 9 Nov, Review 1; EXPERIMENTS-AND-PORTS.md item 3).
 *
 * The other tax tests pin each published figure (tax-2026, scottax, savings-tax). This one pins how a person's incomes
 * are STACKED within a year, which no test did: the solver's model repeats the engine's stacking line for line, so the two
 * agree with each other and can both differ from HMRC.
 *
 * `hmrcYear` below is an independent statement of the order (ITA 2007 s23, as GOV.UK describes it): the personal allowance
 * (tapered on ALL the year's income) against non-savings income first, then interest, then dividends; non-savings income on
 * the region's ladder; interest and dividends on the UK's bands above it; the starting rate band (£5,000 less taxable
 * non-savings income) and the savings allowance at 0% at the bottom of the TAXABLE interest; £500 at 0% at the bottom of the
 * TAXABLE dividends.
 *   A. `hmrcYear` itself, against twelve years worked by hand in the comments;
 *   B. the engine's two functions (taxParams' savingsTax, dividendTax) against it over a grid;
 *   C. whole years: each fixture's plan run on the expected path, and every year's `taxPaid` against `hmrcYear` on that
 *      row's own incomes (a worker's pay included: the row's tax is the person's whole bill less the tax on the pay alone,
 *      which the take-home already paid).
 * The review of 9 Nov's test (research/reviews/2026-11-09/tests/ on review/external-2026-10-21 at f77ca16c), ported with item 3
 * (D66): on the engine before the port it printed 12 passed, 10 failed (research/tests/results-engine-hmrc-before.txt, the
 * test shown failing, CHECKLIST 7). Here section C reads each row's taxable pay (after the year's pension contribution) and,
 * per person, its interest and dividends, so it also runs C4 and C5 with the library's saving left on and C6 with cash and a
 * taxable account split between the two.
 *   D. the solver's memo (fast.js KNOCK.memo, step 2's remedy for the solve's time): each income level's bill and each gross
 *      draw worked once a decision; S116's tables at light settings the same to the bit with it on and off.
 * The plants (--planted reads both): ENGINE_HMRC_PLANT=nopaydiv, the pay dropped from the dividends' stack in a patched copy
 * of the engine, must fail C5; ENGINE_HMRC_PLANT=noceiling, the draw's ceiling left out of the memo's key, must fail D1.
 *   node research/tests/engine-hmrc.test.mjs [--planted]
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), SELF = fileURLToPath(import.meta.url);
// --planted: this test again on the planted engine, read for which checks fail (C5 must, among them)
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['nopaydiv', ['C5', 'C5S']], ['noceiling', ['D1']], ['rawceiling', ['E1', 'E3', 'E5', 'E6', 'E7']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, ENGINE_HMRC_PLANT: plant }, encoding: 'utf8' });
    const failed = [...r.stdout.matchAll(/^FAIL {2}(\S+)/gm)].map(m => m[1]);
    const ok = want.every(w => failed.includes(w));
    if (!ok) bad++;
    console.log(`planted ${plant}: the checks that fail: ${failed.join(', ') || 'none'}; ${want.join(' and ')} among them: ${ok ? 'yes' : 'NO'}`);
  }
  process.exit(bad ? 1 : 0);
}
// the plant: the pay dropped from the dividends' stack (each person's bill with the dividends taxed as if there were no pay)
const PLANT = process.env.ENGINE_HMRC_PLANT || '';
let E, tmp = null;
if (PLANT === 'nopaydiv') {
  const src = readFileSync(join(HERE, '../engine.mjs'), 'utf8');
  const anchor = "const billOf = (key) => P.personTax({ nonSavings: taxablePay[key] + taxable[key], interest: savingsInterest[key], dividends: giaDividends[key] });";
  if (src.split(anchor).length !== 2) throw new Error('engine-hmrc: the plant\'s anchor is not in research/engine.mjs once');
  const planted = "const billOf = (key) => { const b = P.personTax({ nonSavings: taxablePay[key] + taxable[key], interest: savingsInterest[key], dividends: giaDividends[key] }); const d = P.personTax({ nonSavings: taxable[key], interest: savingsInterest[key], dividends: giaDividends[key] }).onDividends; return { ...b, onDividends: d, total: b.onNonSavings + b.onInterest + d }; };";
  tmp = mkdtempSync(join(tmpdir(), 'engine-hmrc-'));
  writeFileSync(join(tmp, 'engine.mjs'), src.replace(anchor, planted));
  E = await import(join(tmp, 'engine.mjs'));
} else if (PLANT === 'rawceiling') {
  // the plant: a draw's ceiling read on the non-savings income alone, as before the fix (section E)
  const src = readFileSync(join(HERE, '../engine.mjs'), 'utf8');
  const anchor = "if (!(i > 0 || d > 0) || !Number.isFinite(ceiling)) return ceiling;";
  if (src.split(anchor).length !== 2) throw new Error('engine-hmrc: the plant\'s anchor is not in research/engine.mjs once');
  tmp = mkdtempSync(join(tmpdir(), 'engine-hmrc-'));
  writeFileSync(join(tmp, 'engine.mjs'), src.replace(anchor, "if (true) return ceiling;"));
  E = await import(join(tmp, 'engine.mjs'));
} else E = await import('../engine.mjs');

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) passed++; else failed++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? '  -- ' + note : ''}`); };
const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;
const gbp = v => `£${(Math.round(v * 100) / 100).toLocaleString('en-GB')}`;

/* ---------------------------------------------------------------- the reference: one person's year, by HMRC's order */
const UK_BANDS = [37700, 125140];                                     // taxable income: basic to 37,700, higher to 125,140
const SCOT_2026 = [[3967, 0.19], [16956, 0.20], [31092, 0.21], [62430, 0.42], [125140, 0.45], [Infinity, 0.48]];   // gov.scot, 2026 to 2027
const RUK = [[UK_BANDS[0], 0.20], [UK_BANDS[1], 0.40], [Infinity, 0.45]];
const bandTax = (lo, hi, bands) => { let t = 0, a = 0; for (const [top, r] of bands) { const w = Math.min(hi, top) - Math.max(lo, a); if (w > 0) t += w * r; a = top; } return t; };
export function hmrcYear({ nonSavings = 0, interest = 0, dividends = 0, scottish = false }) {
  const total = nonSavings + interest + dividends;
  const pa = Math.max(0, 12570 - Math.max(0, total - 100000) / 2);
  let left = pa;
  const tns = Math.max(0, nonSavings - left); left = Math.max(0, left - nonSavings);
  const ti = Math.max(0, interest - left); left = Math.max(0, left - interest);
  const td = Math.max(0, dividends - left);
  const onNonSavings = bandTax(0, tns, scottish ? SCOT_2026 : RUK);
  const all = tns + ti + td;
  const psa = all <= UK_BANDS[0] ? 1000 : all <= UK_BANDS[1] ? 500 : 0;
  const zeroI = Math.min(ti, Math.max(0, 5000 - tns) + psa);
  const onInterest = bandTax(tns + zeroI, tns + ti, RUK);
  const zeroD = Math.min(td, 500);
  const onDividends = bandTax(tns + ti + zeroD, tns + ti + td, [[UK_BANDS[0], 0.1075], [UK_BANDS[1], 0.3575], [Infinity, 0.3935]]);
  return { pa, onNonSavings, onInterest, onDividends, total: onNonSavings + onInterest + onDividends };
}

console.log('=========== A. THE REFERENCE, AGAINST YEARS WORKED BY HAND ===========');
// A1  £30,000 of pension, nothing else: (30,000 - 12,570) x 20% = 3,486
ok('A1  a pension of £30,000', near(hmrcYear({ nonSavings: 30000 }).total, 3486));
// A2  £8,000 of pension and £9,000 of interest: the allowance covers the 8,000 and 4,570 of the interest; the other 4,430 is
//     inside the £5,000 starting rate band. Nothing to pay.
ok('A2  £8,000 and £9,000 of interest: nothing', near(hmrcYear({ nonSavings: 8000, interest: 9000 }).total, 0));
// A3  £10,000 and £10,000 of interest: the allowance covers 10,000 + 2,570; of the 7,430 left, 5,000 starting rate, 1,000
//     savings allowance, 1,430 x 20% = 286
ok('A3  £10,000 and £10,000 of interest: £286', near(hmrcYear({ nonSavings: 10000, interest: 10000 }).total, 286));
// A4  GOV.UK's own example: wages £16,000, interest £200. Wages above the allowance, 3,430, cut the starting rate band to
//     1,570, which covers the interest. Tax: 3,430 x 20% = 686, all on the wages.
{ const r = hmrcYear({ nonSavings: 16000, interest: 200 }); ok('A4  GOV.UK: wages £16,000, interest £200', near(r.total, 686) && near(r.onInterest, 0)); }
// A5  a pension drawn to the allowance (£12,570) and £8,489 of dividends: (8,489 - 500) x 10.75% = 858.82
ok('A5  a draw to the allowance and £8,489 of dividends: £858.82', near(hmrcYear({ nonSavings: 12570, dividends: 8489 }).total, 858.82, 0.01));
// A6  £12,070 and £1,500 of dividends: the allowance covers 500 of them, the next 500 are at 0%, 500 x 10.75% = 53.75
ok('A6  £12,070 and £1,500 of dividends: £53.75', near(hmrcYear({ nonSavings: 12070, dividends: 1500 }).total, 53.75, 0.01));
// A7  pay £60,000 and a pension of £12,929: on 72,929, 37,700 x 20% + 22,659 x 40% = 16,603.60; on the pay alone,
//     37,700 x 20% + 9,730 x 40% = 11,432; the pension's tax is the difference, 5,171.60
ok('A7  a pension of £12,929 on top of pay of £60,000: £5,171.60', near(hmrcYear({ nonSavings: 72929 }).total - hmrcYear({ nonSavings: 60000 }).total, 5171.6, 0.01));
// A8  pay £142,500, interest £3,825.32, dividends £22,397.04: no allowance, no savings allowance; the interest at 45% =
//     1,721.39; the dividends, (22,397.04 - 500) x 39.35% = 8,616.49
{ const r = hmrcYear({ nonSavings: 142500, interest: 3825.32, dividends: 22397.04 }); ok('A8  pay £142,500: interest at 45%, dividends at 39.35%', near(r.onInterest, 1721.39, 0.01) && near(r.onDividends, 8616.49, 0.01)); }
// A9  a state pension of £12,000, a taxable draw of £45,000 and £10,000 of dividends: taxable non-savings 44,430, past the
//     basic band, so the dividends are all in the higher band: (10,000 - 500) x 35.75% = 3,396.25
ok('A9  £57,000 and £10,000 of dividends: £3,396.25 on the dividends', near(hmrcYear({ nonSavings: 57000, dividends: 10000 }).onDividends, 3396.25, 0.01));
// A10 Scotland, £30,000: taxable 17,430: 3,967 x 19% + 12,989 x 20% + 474 x 21% = 753.73 + 2,597.80 + 99.54 = 3,451.07.
//     Scotland, £20,000 and £5,000 of interest: taxable 7,430 = 3,967 x 19% + 3,463 x 20% = 1,446.33; no starting rate band
//     left; the interest, (5,000 - 1,000) x 20% (the UK's rate) = 800
ok('A10 Scotland: £30,000; £20,000 with £5,000 of interest', near(hmrcYear({ nonSavings: 30000, scottish: true }).total, 3451.07, 0.01) && near(hmrcYear({ nonSavings: 20000, interest: 5000, scottish: true }).total, 2246.33, 0.01));
// A11 the taper, £110,000: allowance 7,570; taxable 102,430: 37,700 x 20% + 64,730 x 40% = 33,432. And the taper counts ALL
//     income: £95,000 with £20,000 of dividends leaves an allowance of 5,070, so 7,500 more of the 95,000 is taxed at 40%
ok('A11 the taper on all income', near(hmrcYear({ nonSavings: 110000 }).total, 33432) && near(hmrcYear({ nonSavings: 95000, dividends: 20000 }).onNonSavings - hmrcYear({ nonSavings: 95000 }).onNonSavings, 3000));
// A12 £49,000 and £3,000 of interest: taxable 36,430 + 3,000 passes 37,700, so the savings allowance is 500: 500 at 0%,
//     770 x 20% = 154, 1,730 x 40% = 692; 846
ok('A12 interest across the higher-rate line: £846', near(hmrcYear({ nonSavings: 49000, interest: 3000 }).onInterest, 846));

console.log('=========== B. THE ENGINE\'S savingsTax AND dividendTax AGAINST THE REFERENCE ===========');
{
  const P = E.taxParams(E.DEFAULT_CONFIG);
  const NS = [0, 4000, 8000, 10000, 12070, 12570, 15000, 17570, 30000, 49000, 60000, 130000], I = [0, 500, 3980, 9000, 20000], D = [0, 400, 1500, 8489, 30000];
  let nI = 0, badI = 0, worstI = null, nD = 0, badD = 0, worstD = null;
  for (const ns of NS) for (const i of I) {
    if (i > 0) { const got = P.savingsTax(ns, i), want = hmrcYear({ nonSavings: ns, interest: i }).onInterest; nI++; if (!near(got, want)) { badI++; if (!worstI || Math.abs(got - want) > Math.abs(worstI.got - worstI.want)) worstI = { ns, i, got, want }; } }
    for (const d of D) if (d > 0) { const got = P.dividendTax(ns, i, d), want = hmrcYear({ nonSavings: ns, interest: i, dividends: d }).onDividends; nD++; if (!near(got, want)) { badD++; if (!worstD || Math.abs(got - want) > Math.abs(worstD.got - worstD.want)) worstD = { ns, i, d, got, want }; } }
  }
  ok(`B1  savingsTax: ${nI} cases`, badI === 0, badI ? `${badI} differ; the worst: other income ${gbp(worstI.ns)}, interest ${gbp(worstI.i)}: the engine ${gbp(worstI.got)}, HMRC ${gbp(worstI.want)}` : '');
  ok(`B2  dividendTax: ${nD} cases`, badD === 0, badD ? `${badD} differ; the worst: other income ${gbp(worstD.ns)}, interest ${gbp(worstD.i)}, dividends ${gbp(worstD.d)}: the engine ${gbp(worstD.got)}, HMRC ${gbp(worstD.want)}` : '');
  ok('B3  the review\'s 1.3: £8,000 and £9,000 of interest is untaxed', near(P.savingsTax(8000, 9000), 0), `the engine ${gbp(P.savingsTax(8000, 9000))}`);
}

console.log('=========== C. WHOLE YEARS: EVERY ROW\'S taxPaid AGAINST THE REFERENCE ON THE ROW\'S OWN INCOMES ===========');
const lib = buildScenarios();
const planOf = (id) => JSON.parse(JSON.stringify(lib.find(s => s.id === id).plan));
const setBal = (plan, id, balance, extra = {}) => { const a = plan.accounts.find(x => x.id === id); if (!a) throw new Error(`no account ${id}`); Object.assign(a, { balance, ...extra }); };
const noSaving = (plan) => { plan.accounts.forEach(a => { a.contrib = 0; if ('employerContrib' in a) a.employerContrib = 0; }); return plan; };
// the plan's rules drawing the pension to the allowance first and re-wrapping it: the move every solved plan favours
const PA_FIRST = { steps: ['penPA', 'cash', 'other', 'isa', 'penBasic', 'penAny'], harvest: true };
const FIXTURES = [
  ['C1  S116 as the library has it (retired, Scotland)', () => planOf('S116')],
  ['C2  S116 with its cash ISA held in the taxable account, the pension drawn to the allowance first (1.2)', () => { const p = planOf('S116'); const c = p.accounts.find(a => a.id === 'cashIsa_self').balance; setBal(p, 'cashIsa_self', 0); setBal(p, 'other_self', p.accounts.find(a => a.id === 'other_self').balance + c); p.spending.policyOverride = PA_FIRST; return p; }],
  ['C3  the same in England', () => { const p = planOf('S116'); const c = p.accounts.find(a => a.id === 'cashIsa_self').balance; setBal(p, 'cashIsa_self', 0); setBal(p, 'other_self', p.accounts.find(a => a.id === 'other_self').balance + c); p.spending.policyOverride = PA_FIRST; p.config = { ...p.config, taxRegion: 'ruk' }; return p; }],
  ['C4  S210, no saving (working to 60 on £77,500, a taxable account and cash) (1.1)', () => noSaving(planOf('S210'))],
  ['C5  S214, no saving (working to 60 on £142,500) (1.1)', () => noSaving(planOf('S214'))],
  ['C6  a couple: the first retired at 68, the second 60 and working to 66 on £60,000, holding the only money, a £600,000 pension (1.1)', () => {
    const p = planOf('S021'); Object.assign(p.demographics, { currentAgePart: 60, retireAgePart: 66, salaryPart: 60000 });
    p.accounts.forEach(a => { if (a.id === 'pen_part') Object.assign(a, { balance: 600000, contrib: 0 }); else if (/^(pen|isa|other|cash|cashIsa)_/.test(a.id)) a.balance = 0; });
    return noSaving(p);
  }],
  // with the library's saving left on: the taxable pay is the salary less the year's pension contribution
  ['C4S S210 with its saving (the taxable pay after contributions)', () => planOf('S210')],
  ['C5S S214 with its saving (the taxable pay after contributions)', () => planOf('S214')],
  // C6's couple with £200,000 of cash and a £300,000 taxable account, split 60/40 between the two (the row's split by person)
  ['C6S C6 with £200,000 of cash and a £300,000 taxable account split between the two', () => {
    const p = planOf('S021'); Object.assign(p.demographics, { currentAgePart: 60, retireAgePart: 66, salaryPart: 60000 });
    p.accounts.forEach(a => { if (a.id === 'pen_part') Object.assign(a, { balance: 600000, contrib: 0 }); else if (/^(pen|isa|cashIsa)_/.test(a.id)) a.balance = 0; });
    setBal(p, 'cash_self', 120000); setBal(p, 'cash_part', 80000); setBal(p, 'other_self', 180000); setBal(p, 'other_part', 120000);
    return noSaving(p);
  }],
  // the allowance tapers on ALL the year's income (A11).
  ['C7  S116 in England with a £95,000 pension in payment and its cash ISA held in the taxable account: the allowance tapers on all income', () => {
    const p = planOf('S116'); const c = p.accounts.find(a => a.id === 'cashIsa_self').balance; setBal(p, 'cashIsa_self', 0); setBal(p, 'other_self', p.accounts.find(a => a.id === 'other_self').balance + c);
    p.config = { ...p.config, taxRegion: 'ruk' };
    p.otherIncomes = [{ id: 'db1', owner: 'Myself', name: 'DB', type: 'otherTaxable', amount: 95000, startAge: Number(p.demographics.currentAgeSelf), endAge: 120 }];
    return p;
  }]
];
for (const [name, make] of FIXTURES) {
  const plan = E.resolveMpaa(E.normalizePlan(make()));
  const ctx = E.buildContext(plan), rows = E.simulateDeterministic(ctx, 'expected');
  const scottish = (plan.config || {}).taxRegion === 'scotland', couple = ctx.owners.length > 1;
  let bad = 0, worst = null, under = 0, over = 0;
  rows.forEach((x, t) => {
    const frac = t === 0 ? ctx.yf : 1;
    let want = 0;
    ctx.owners.forEach((o, k) => {
      const key = k === 0 ? 'Self' : 'Part';
      // the row's taxable pay (the salary less the year's pension contribution given up), interest and dividends, per person
      const pay = x[`taxablePay${key}`];
      if (!(pay >= 0) || (pay > 0 && !x[`working${key}`])) throw new Error(`${name}: year ${x.year}: the row's taxable pay ${pay} (working ${x[`working${key}`]})`);
      const mine = { nonSavings: pay + x[`otherTaxable${key}`] + x[`taxablePension${key}`], interest: x[`savingsInterest${key}`], dividends: x[`giaDividends${key}`], scottish };
      want += hmrcYear(mine).total - (pay > 0 ? hmrcYear({ nonSavings: pay, scottish }).total : 0);
    });
    const gap = x.taxPaid - want;
    if (Math.abs(gap) > 1) { bad++; if (gap < 0) under -= gap; else over += gap; if (!worst || Math.abs(gap) > Math.abs(worst.gap)) worst = { year: x.year, gap, got: x.taxPaid, want }; }
  });
  ok(`${name}: ${rows.length} years`, bad === 0, bad ? `${bad} years differ by over £1: the engine ${gbp(under)} under and ${gbp(over)} over across the plan; the worst, ${worst.year}: the engine ${gbp(worst.got)}, HMRC ${gbp(worst.want)}` : '');
}

console.log('=========== E. A DRAW\'S CEILING IS ON THE YEAR\'S WHOLE TAXABLE INCOME (the review of 11 Nov, ANSWERS.md section 5) ===========');
{
  const P = E.taxParams(E.DEFAULT_CONFIG), PS = E.taxParams({ ...E.DEFAULT_CONFIG, taxRegion: 'scotland' });
  const ceil = (p, c, T0, i, d) => (E.pensionCeiling ? E.pensionCeiling(p, c, T0, i, d) : c);
  const U = 50270, PA = 12570;
  // E1  the review's table, 2026/27: other income £20,000 and £8,000 of interest, a harvest to the basic ceiling. To the
  //     threshold less the interest, £42,270: its taxable part 22,270, at 20% = 4,454; the interest, 7,000 x 20% after the
  //     £1,000 allowance = 1,400. To the threshold itself, as before: 30,270 x 20% = 6,054, and the interest is in the higher
  //     band, a £500 allowance and 7,500 x 40% = 3,000. The last 8,000 of the draw costs 1,600 on itself and 1,600 on the interest.
  {
    const c = ceil(P, P.higherRateStartsAt, 20000, 8000, 0), at = hmrcYear({ nonSavings: c, interest: 8000 }), base = hmrcYear({ nonSavings: 20000, interest: 8000 }), old = hmrcYear({ nonSavings: U, interest: 8000 });
    ok('E1  the basic ceiling with £20,000 of other income and £8,000 of interest: £42,270; the draw\'s tax £4,454, the interest\'s £1,400 (to the threshold: £6,054 and £3,000)',
      near(c, 42270) && near(at.onNonSavings - base.onNonSavings, 4454) && near(at.onInterest, 1400) && near(old.onNonSavings - base.onNonSavings, 6054) && near(old.onInterest, 3000),
      `the ceiling ${gbp(c)}; the draw's tax ${gbp(at.onNonSavings - base.onNonSavings)}, the interest's ${gbp(at.onInterest)}`);
  }
  // E2  the same with £8,000 of dividends in the interest's place: to £42,270 they are in the basic band, (8,000 - 500) x
  //     10.75% = 806.25; to the threshold they are all in the higher band, 7,500 x 35.75% = 2,681.25
  {
    const c = ceil(P, P.higherRateStartsAt, 20000, 0, 8000), at = hmrcYear({ nonSavings: c, dividends: 8000 }), old = hmrcYear({ nonSavings: U, dividends: 8000 });
    ok('E2  the same with £8,000 of dividends: £42,270; the dividends\' tax £806.25 (to the threshold: £2,681.25)', near(c, 42270) && near(at.onDividends, 806.25) && near(old.onDividends, 2681.25), `the ceiling ${gbp(c)}; the dividends' tax ${gbp(at.onDividends)}`);
  }
  // E3  the allowance's ceiling, nothing else coming in. £3,000 of interest: the allowance itself (the interest sits in the
  //     starting rate band above it, 0%). £9,000: the allowance, the £5,000 band and the £1,000 savings allowance cover
  //     18,570 of income, so the draw stops at 18,570 - 9,000 = 9,570, £3,000 short; a pound more costs 20p on the interest.
  {
    const a = ceil(P, P.pa, 0, 3000, 0), b = ceil(P, P.pa, 0, 9000, 0);
    ok('E3  the allowance\'s ceiling: unchanged with £3,000 of interest; £9,570 with £9,000, £3,000 short, and nothing to pay at either',
      near(a, PA) && near(b, 9570) && near(hmrcYear({ nonSavings: a, interest: 3000 }).total, 0) && near(hmrcYear({ nonSavings: b, interest: 9000 }).total, 0) && hmrcYear({ nonSavings: b + 100, interest: 9000 }).total > 19,
      `£3,000 of interest: ${gbp(a)}; £9,000: ${gbp(b)}`);
  }
  // E4  Scotland: the basic step's own ceiling is where the 42% rate starts, £43,662; interest is taxed on the UK's bands, so
  //     its test is against £50,270. £20,000 of other income and £3,000 of interest: 47,270 is past the Scottish ceiling, so
  //     43,662, and the interest is (3,000 - 1,000) x 20% = 400. With £8,000 of interest: 42,270, and the interest 1,400.
  {
    const a = ceil(PS, PS.higherRateStartsAt, 20000, 3000, 0), b = ceil(PS, PS.higherRateStartsAt, 20000, 8000, 0);
    ok('E4  Scotland, the basic ceiling: £43,662 with £3,000 of interest (its tax £400), £42,270 with £8,000 (its tax £1,400)',
      near(PS.higherRateStartsAt, 43662) && near(a, 43662) && near(b, 42270) && near(hmrcYear({ nonSavings: a, interest: 3000, scottish: true }).onInterest, 400) && near(hmrcYear({ nonSavings: b, interest: 8000, scottish: true }).onInterest, 1400),
      `£3,000 of interest: ${gbp(a)}; £8,000: ${gbp(b)}`);
  }
  // E5  a search over the reference's own bill. The allowance's ceiling (and half of it): the bill at the ceiling is the bill
  //     with no draw, on every case; and where the year's whole income is below the UK threshold it is the LARGEST such draw,
  //     a pound more costing something unless it is the ceiling itself. The basic ceiling and the taper's: never past the
  //     ceiling, and the whole income at it no more than the threshold, or the draw is one that costs nothing.
  {
    const T0s = [0, 4000, 9000, 12570, 15000, 30000], Is = [0, 500, 3000, 6500, 9000, 20000, 45000], Ds = [0, 400, 2000, 8489, 45000];
    let n = 0, bad = 0, worst = '';
    const note = (what, c, T0, i, d, got) => { bad++; if (!worst) worst = `${what}: ceiling ${gbp(c)}, other income ${gbp(T0)}, interest ${gbp(i)}, dividends ${gbp(d)}: the engine ${gbp(got)}`; };
    for (const scottish of [false, true]) for (const T0 of T0s) for (const i of Is) for (const d of Ds) {
      const p = scottish ? PS : P, bill = (N) => hmrcYear({ nonSavings: N, interest: i, dividends: d, scottish }).total, b0 = bill(T0);
      for (const c of [p.pa, p.pa / 2]) {
        const got = ceil(p, c, T0, i, d); n++;
        if (got > c + 1e-9) note('past the ceiling', c, T0, i, d, got);
        else if (got > T0 && Math.abs(bill(got) - b0) > 0.005) note('the draw costs', c, T0, i, d, got);
        else if (T0 + i + d < U && T0 < c && got < c - 1e-9 && Math.abs(bill(Math.max(got, T0) + 1) - b0) <= 0.005) note('a larger draw is free', c, T0, i, d, got);
      }
      for (const c of [p.higherRateStartsAt, p.thr]) {
        const got = ceil(p, c, T0, i, d), S = c === p.higherRateStartsAt ? U : c; n++;
        if (got > c + 1e-9) note('past the ceiling', c, T0, i, d, got);
        else if (got > T0 && got + i + d > S + 1e-6 && Math.abs(bill(got) - b0) > 0.005) note('the whole income past the threshold', c, T0, i, d, got);
        else if (got < Math.min(c, S - i - d) - 1e-6) note('short of the threshold less the interest and dividends', c, T0, i, d, got);
      }
    }
    ok(`E5  ${n} ceilings against a search over the reference's bill, England and Scotland`, bad === 0 && !!E.pensionCeiling, bad ? `${bad} wrong; the first, ${worst}` : (E.pensionCeiling ? '' : 'the engine has no pensionCeiling'));
  }
  // E6, E7  whole years. S116 in England with £300,000 of cash and £100,000 in the taxable account (its ISAs emptied), its
  //     spending met from the cash: about £10,600 of interest and £2,000 of dividends in the first year, no other income.
  const withCash = (harvest, ceiling, region = 'ruk') => {
    const p = planOf('S116'); p.config = { ...p.config, taxRegion: region, harvestPersonalAllowance: harvest, harvestCeiling: ceiling };
    setBal(p, 'cashIsa_self', 0); setBal(p, 'isa_self', 0); setBal(p, 'cash_self', 300000); setBal(p, 'other_self', 100000);
    p.spending.policyOverride = { steps: ['cash', 'other', 'isa', 'penAny'], harvest };
    return E.simulateDeterministic(E.buildContext(E.resolveMpaa(E.normalizePlan(p))), 'expected')[0];
  };
  {
    // E6  the harvest to the allowance is the plan's "free" move: the year's tax with it is the year's tax without it
    const off = withCash(false, 'pa'), on = withCash(true, 'pa');
    ok('E6  the first year\'s harvest to the allowance costs nothing: the year\'s tax the same with it and without', on.harvested > 0 && near(on.taxPaid, off.taxPaid, 0.01),
      `without ${gbp(off.taxPaid)}, with ${gbp(on.taxPaid)} (harvested ${gbp(on.harvested)}, interest ${gbp(on.savingsInterestSelf)}, dividends ${gbp(on.giaDividendsSelf)})`);
    // E7  the harvest to the basic ceiling leaves the year's whole taxable income at the UK threshold, in England and in Scotland
    const whole = (x) => x.otherTaxableSelf + x.taxablePensionSelf + x.savingsInterestSelf + x.giaDividendsSelf;
    const en = withCash(true, 'basic'), sc = withCash(true, 'basic', 'scotland');
    ok('E7  the first year\'s harvest to the basic ceiling: the whole taxable income at £50,270 in England; in Scotland the draw at its own £43,662 or the whole at £50,270, whichever comes first',
      near(whole(en), U, 1) && en.harvested > 0 && sc.harvested > 0 && near(Math.min(43662 - (sc.otherTaxableSelf + sc.taxablePensionSelf), U - whole(sc)), 0, 1),
      `England ${gbp(whole(en))}; Scotland: the draw ${gbp(sc.otherTaxableSelf + sc.taxablePensionSelf)}, the whole ${gbp(whole(sc))}`);
  }
}

console.log('=========== D. THE SOLVER\'S MEMO OF THE YEAR\'S INTEREST AND DIVIDENDS TAX ===========');
if (PLANT !== 'nopaydiv' && PLANT !== 'rawceiling') {
  const M = await import('../../src/solver/model.js'), F = await import('../../src/solver/fast.js');
  const { solveForApp } = await import('../../src/solverApp.js'), { tablesOf, digestOf } = await import('../../src/solverDigest.js');
  const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
  const plan = E.normalizePlan(planOf('S116'));
  const tablesWith = async (memo) => { F.KNOCK.memo = memo; F.KNOCK.plant = memo && PLANT === 'noceiling' ? 'noceiling' : ''; const r = solveForApp(E, M, plan, LIGHT); return digestOf(tablesOf(r)); };
  const off = await tablesWith(false), on = await tablesWith(true);
  F.KNOCK.memo = true; F.KNOCK.plant = '';
  ok('D1  S116 at light settings: every table the same to the bit with the memo on and off', off === on, `off ${off.slice(0, 12)}, on ${on.slice(0, 12)}`);
}
if (tmp) rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
