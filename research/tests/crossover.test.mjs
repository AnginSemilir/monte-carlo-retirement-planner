/*
 * SWITCHING PAGES MUST NOT LOSE OR INVENT MONEY.
 *
 * The shell now carries a plan between the simple page and the full planner, through toFullPlan and
 * fromFullPlan in src/simplePlan.js. Those two are NOT inverses - the full planner holds things the
 * small page cannot - so the properties worth pinning are not "round trip is identity" but:
 *
 *   A  simple -> full -> simple returns every field the small page owns, unchanged. This direction IS
 *      lossless, and a visitor who crosses over and comes back must find their own figures.
 *   B  the pot is conserved in both directions: no balance is dropped, none is duplicated.
 *   C  what cannot cross is REPORTED, not silently dropped. Every lossy case names itself.
 *   D  a blank plan is recognised as blank, so the switch never writes an empty form over saved work.
 *
 * These run against the engine slice, which carries normalizePlan; simplePlan.js is imported directly.
 */
import * as E from '../engine.mjs';
import { SIMPLE_BLANK, toFullPlan, fromFullPlan, simpleHasInput } from '../simplePlan.mjs';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

const filled = {
  ...SIMPLE_BLANK, couple: true,
  ageSelf: 51, retireSelf: 61, agePart: 49, retirePart: 60, terminalAge: 93,
  spend: 42000, salary: 68000, salaryPart: 41000,
  statePensionSelf: 11500, statePensionPart: 9800, region: 'scotland',
  pen: 410000, isa: 120000, gia: 35000, cash: 22000,
  penPart: 190000, isaPart: 64000, giaPart: 0, cashPart: 8000,
  penC: 14000, isaC: 5000, giaC: 1200, cashC: 600,
  penCPart: 7000, isaCPart: 2400, giaCPart: 0, cashCPart: 0,
  penG: 2, isaG: 1, giaG: 0, cashG: 0, penGPart: 3, isaGPart: 0, giaGPart: 0, cashGPart: 0,
  taperPct: 12, taperFromAge: 76,
  oneOffs: [{ id: 'o_a', date: '2031-06-01', amount: 40000, direction: 'in', desc: 'inheritance' },
            { id: 'o_b', date: '2029-03-01', amount: 25000, direction: 'out', desc: 'roof' }],
  earnings: [{ id: 'e_a', amount: 15000, startAge: 61, endAge: 65, owner: 'Myself' }]
};

console.log('=========== A. SIMPLE -> FULL -> SIMPLE KEEPS EVERY FIELD ===========');
{
  const { simple: back, dropped } = fromFullPlan(toFullPlan(filled), SIMPLE_BLANK);
  const scalars = ['couple','ageSelf','retireSelf','agePart','retirePart','terminalAge','spend','salary','salaryPart',
    'statePensionSelf','statePensionPart','region','pen','isa','gia','cash','penPart','isaPart','giaPart','cashPart',
    'penC','isaC','giaC','cashC','penCPart','isaCPart','giaCPart','cashCPart',
    'penG','isaG','giaG','cashG','penGPart','isaGPart','giaGPart','cashGPart'];
  const bad = scalars.filter(k => String(back[k] ?? '') !== String(filled[k] ?? ''));
  ok('every scalar field survives the round trip', bad.length === 0, bad.map(k => `${k}: ${filled[k]} -> ${back[k]}`).join(', '));
  ok('the taper survives', Number(back.taperPct) === 12 && Number(back.taperFromAge) === 76, `${back.taperPct}% from ${back.taperFromAge}`);
  ok('both one-offs survive, with their direction', back.oneOffs.length === 2
    && back.oneOffs.some(o => o.direction === 'in' && o.amount === 40000)
    && back.oneOffs.some(o => o.direction === 'out' && o.amount === 25000), JSON.stringify(back.oneOffs));
  ok('post-retirement earnings survive', back.earnings.length === 1 && Number(back.earnings[0].amount) === 15000
    && Number(back.earnings[0].startAge) === 61, JSON.stringify(back.earnings));
  /*
   * The round trip should claim exactly two losses and no more. Config, which the small page has no room
   * for; and where a one-off deposit lands, which normalizePlan resolves so early that no code downstream
   * can tell a user's choice from the policy's. Anything else appearing here is a false alarm - the kind
   * that teaches people to ignore the banner.
   */
  ok('it claims exactly the two losses that are real', dropped.length === 2
    && dropped.some(d => /Config/.test(d)) && dropped.some(d => /one-off deposit/.test(d)), dropped.join(' | '));
}

console.log('\n=========== B. THE POT IS CONSERVED IN BOTH DIRECTIONS ===========');
{
  const potOf = (s) => ['pen','isa','gia','cash','penPart','isaPart','giaPart','cashPart'].reduce((t,k) => t + (Number(s[k]) || 0), 0);
  const full = toFullPlan(filled);
  const fullPot = (full.accounts || []).reduce((t,a) => t + (Number(a.balance) || 0), 0);
  ok('simple -> full carries the whole pot and no more', fullPot === potOf(filled), `${fullPot} vs ${potOf(filled)}`);
  const { simple: back } = fromFullPlan(full, SIMPLE_BLANK);
  ok('full -> simple carries it back intact', potOf(back) === potOf(filled), `${potOf(back)} vs ${potOf(filled)}`);
  const contribOf = (s) => ['penC','isaC','giaC','cashC','penCPart','isaCPart','giaCPart','cashCPart'].reduce((t,k) => t + (Number(s[k]) || 0), 0);
  ok('and every contribution with it', contribOf(back) === contribOf(filled), `${contribOf(back)} vs ${contribOf(filled)}`);
}

console.log('\n=========== C. WHAT CANNOT CROSS SAYS SO ===========');
{
  const base = toFullPlan(filled);
  const withBands = E.normalizePlan({ ...base, spending: { ...base.spending,
    spendBands: [{ fromAge: 70, toAge: 80, amount: 38000 }, { fromAge: 80, toAge: 93, amount: 30000 }] } });
  const a = fromFullPlan(withBands, SIMPLE_BLANK);
  ok('two spending bands are reported, not flattened', a.dropped.some(d => /spending band/i.test(d)), a.dropped.join(' | '));
  ok('...and no bogus taper is invented from them', a.simple.taperPct === '' , String(a.simple.taperPct));

  const withIncome = E.normalizePlan({ ...base, otherIncomes: [
    ...(base.otherIncomes || []), { id: 'i1', incomeType: 'db_pension', amount: 9000, owner: 'Myself', startAge: 65, endAge: '' }] });
  const b = fromFullPlan(withIncome, SIMPLE_BLANK);
  ok('a non-earnings income stream is reported', b.dropped.some(d => /neither earnings nor tax-free/i.test(d)), b.dropped.join(' | '));
  ok('...while the earnings one still crosses', b.simple.earnings.length === 1);
  ok('...as a gross figure', b.simple.earnings[0].taxed === 'gross', String(b.simple.earnings[0].taxed));

  // A tax-free stream is what the simple page's "after tax" option makes, so it has to survive the trip
  // back down - and come back marked net, or the next crossing up would tax it.
  const withNet = E.normalizePlan({ ...base, otherIncomes: [
    ...(base.otherIncomes || []), { id: 'i2', incomeType: 'taxFree', amount: 6000, owner: 'Myself', startAge: 66, endAge: '' }] });
  const c = fromFullPlan(withNet, SIMPLE_BLANK);
  ok('an after-tax income stream crosses down as one', c.simple.earnings.length === 2 && c.simple.earnings.some(e => e.taxed === 'net'),
    c.simple.earnings.map(e => `${e.amount}:${e.taxed}`).join(' | '));
  ok('...and back up as tax-free rather than taxed twice',
    (toFullPlan(c.simple).otherIncomes || []).some(i => i.incomeType === 'taxFree' && i.amount === 6000),
    (toFullPlan(c.simple).otherIncomes || []).map(i => `${i.incomeType}:${i.amount}`).join(' | '));

  const withSchedule = E.normalizePlan({ ...base, accounts: base.accounts.map(x =>
    x.id === 'pen_self' ? { ...x, contribByYear: [1000, 2000, 3000] } : x) });
  ok('a per-year contribution schedule is reported',
    fromFullPlan(withSchedule, SIMPLE_BLANK).dropped.some(d => /per-year/i.test(d)));
}

console.log('\n=========== D. A BLANK IS RECOGNISED AS BLANK ===========');
{
  ok('the untouched simple shape has no input', simpleHasInput(SIMPLE_BLANK) === false);
  ok('null and undefined are handled', simpleHasInput(null) === false && simpleHasInput(undefined) === false);
  ok('a filled one does have input', simpleHasInput(filled) === true);
  // the case the guard exists for: a blank full plan must not come back looking like something
  const { simple: fromBlank } = fromFullPlan(E.normalizePlan(null), SIMPLE_BLANK);
  ok('a blank full plan converts to something still recognised as blank', simpleHasInput(fromBlank) === false, JSON.stringify(fromBlank).slice(0, 120));
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
