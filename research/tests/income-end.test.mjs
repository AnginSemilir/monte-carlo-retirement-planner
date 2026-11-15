/*
 * AN INCOME WITH ITS END AGE LEFT BLANK RUNS TO THE END OF THE PLAN, WHOEVER OWNS IT (App.jsx buildContext; the field's hint,
 * "Leave blank to run to the end of the plan"; the reviewer at D100's stage A read, second round, 15 Nov; CHECKLIST 7).
 * Before this fix a blank end age was read as the first person's end age and compared with the owner's own age, so the
 * income of a partner older than the first person stopped before the plan ended, by the age gap: in the app's own
 * projection, in the household's year under the solver, and against the partner's own plan and the plan entered the other
 * way round, which both pay it to the end.
 *   1. the context: on couples with the partner older and younger and on a single, each blank-end income's end age reaches
 *      its owner's age in the plan's last year; the first person's, a single's and a younger partner's are the first
 *      person's end age, as before
 *   2. the engine's year (simulateDeterministic, the expected path): S129 with the partner four years older and a £12,000 DB
 *      pension of the partner's from 66, its end blank: the partner's other taxable income is the pension in every plan
 *      year from 66 to the plan's last
 *   3. the cut: each person's plan (couple.js singlePlanFor, and the page's route, solverCouple.js couplePlans) pays each
 *      blank-end income in the same plan years as the household's year; also with the plan's years ending in .5 (S129's end
 *      age half a year on), where the plan's last year falls past the younger partner's own plan's end age, so the partner's
 *      plan, reading a blank end as its own end age, stopped the income a year early (the reviewer's second round on D104
 *      (1)'s change of default measured it: a younger first person's income in the mirror; the cut's the same class)
 *   4. the other order: the couple entered the other way round (couple-order.mjs otherOrder) pays each income in the same
 *      plan years as the couple as entered
 *   5. the library: no couple of the 210 has its partner older, and every library plan's incomes in its context (the 210
 *      couples and the singles) are the code before's, bit for bit (against the engine with the line before the fix)
 * Plants: 'incomeend' (the engine's line as before, in a copy of research/engine.mjs) fails checks 1 to 4; 'incomeopen'
 * (couple.js COUPLE.plant: a blank end left blank in the person's plan whatever the household reads) fails check 3.
 *   node research/tests/income-end.test.mjs [--planted]
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SELF = fileURLToPath(import.meta.url), HERE = dirname(SELF);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['incomeend', ['1', '2', '3', '4']], ['incomeopen', ['3']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, INCOME_END_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
// the engine as it is, and as it was before the fix (its one line put back, in a copy)
const FIXED = 'endAge: isBlank(i.endAge) ? planEndAge(i.owner) : num(i.endAge, planEndAge(i.owner)),';
const BEFORE = 'endAge: isBlank(i.endAge) ? terminalAge : num(i.endAge, terminalAge),';
const src = readFileSync(join(HERE, '../engine.mjs'), 'utf8');
if (src.split(FIXED).length !== 2) throw new Error('income-end: the fixed line is not in research/engine.mjs once (rebuild it: python3 research/build-engine.py)');
const tmp = mkdtempSync(join(tmpdir(), 'income-end-'));
writeFileSync(join(tmp, 'engine.mjs'), src.replace(FIXED, BEFORE));
const OLD = await import(pathToFileURL(join(tmp, 'engine.mjs')).href);
const PLANT = process.env.INCOME_END_PLANT || '';
const E = PLANT === 'incomeend' ? OLD : await import('../engine.mjs');
const { singlePlanFor, COUPLE } = await import('../../src/solver/couple.js');
if (PLANT === 'incomeopen') COUPLE.plant = 'incomeopen';
const { couplePlans } = await import('../../src/solverCouple.js');
const { otherOrder } = await import('../solver/couple-order.mjs');
const { couplesOf } = await import('../solver/couple-panel.mjs');
const { buildScenarios } = await import('../policy-study/scenarios.mjs');

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`income-end: an income with its end age left blank runs to the end of the plan, whoever owns it${PLANT ? `; planted: ${PLANT}` : ''}`);
const ctxOf = (Eng, p) => Eng.buildContext(Eng.resolveMpaa(Eng.normalizePlan(p)));
const library = couplesOf(), S129 = E.normalizePlan(library.find(s => s.id === 'S129').plan), c129 = ctxOf(E, S129);
// the couples: S129 with the partner four years older, and as it is (the partner three years younger), each with a DB
// pension of the partner's and an income of the first person's, both from 66, their ends blank
const withIncomes = (p, ageGap) => {
  const q = JSON.parse(JSON.stringify(p));
  if (ageGap !== null) q.demographics.currentAgePart = c129.ageSelf0 + ageGap;
  q.otherIncomes = [{ id: 'db1', name: 'DB pension', owner: 'Partner', startAge: 66, endAge: '', amount: 12000, incomeType: 'otherTaxable', notes: '' },
    { id: 'db2', name: 'Annuity', owner: 'Myself', startAge: 66, endAge: '', amount: 8000, incomeType: 'otherTaxable', notes: '' }];
  return E.normalizePlan(q);
};
const OLDER = withIncomes(S129, 4), YOUNGER = withIncomes(S129, null);
// the same with the end age half a year on: the plan's years end in .5 and round up, so its last year falls past the end age
const YOUNGER_HALF = (() => { const q = JSON.parse(JSON.stringify(YOUNGER)); q.demographics.terminalAge = c129.terminalAge + 0.5; return E.normalizePlan(q); })();
const single = (() => { const s = buildScenarios().find(x => x.plan.demographics.planningMode === 'single'); const q = JSON.parse(JSON.stringify(E.normalizePlan(s.plan))); q.otherIncomes = [{ id: 'a1', name: 'Annuity', owner: 'Myself', startAge: 66, endAge: '', amount: 8000, incomeType: 'otherTaxable', notes: '' }]; return { id: s.id, plan: E.normalizePlan(q) }; })();
// the plan years an owner's incomes are paid in, by the context's own rule (the engine's year: the owner's age that year)
const paidYears = (ctx, owner, id) => { const out = []; const inc = ctx.otherIncomes.filter(i => i.owner === owner); for (let t = 0; t <= ctx.totalYears; t++) { const age = (owner === 'self' ? ctx.ageSelf0 : ctx.agePart0) + t; if (inc.some(i => age >= i.startAge && age <= i.endAge)) out.push(t); } return out; };

// ---- 1. the context ----
{
  const bad = [], notes = [];
  for (const [name, p] of [['the partner older', OLDER], ['the partner younger', YOUNGER], [`a single (${single.id})`, single.plan]]) {
    const c = ctxOf(E, p);
    for (const i of c.otherIncomes) {
      const own0 = i.owner === 'part' ? c.agePart0 : c.ageSelf0, last = own0 + c.totalYears;
      if (i.endAge < last) bad.push(`${name}: the ${i.owner === 'part' ? "partner's" : "first person's"} income ends at ${i.endAge}, before its owner's ${last} in the plan's last year`);
      const was = c.terminalAge;
      if ((i.owner === 'self' || c.agePart0 <= c.ageSelf0) && i.endAge !== was) bad.push(`${name}: the ${i.owner === 'part' ? "partner's" : "first person's"} income ends at ${i.endAge}, not the first person's end age ${was} as before`);
      notes.push(`${name} ${i.owner} ${i.endAge}`);
    }
  }
  ok(1, 'the context: each blank-end income reaches its owner\'s age in the plan\'s last year; the first person\'s, a single\'s and a younger partner\'s at the first person\'s end age, as before', !bad.length, bad.length ? bad.join('; ') : notes.join(', '));
}

// ---- 2. the engine's year ----
{
  const rows = E.simulateDeterministic(OLDER), c = ctxOf(E, OLDER), off = [];
  for (const r of rows) {
    const age = c.agePart0 + r.t;
    if (age < 66) continue;
    // the row's other taxable income carries the state pension too (from the state pension age): the DB pension is the rest
    const want = 12000 * (r.t === 0 ? c.yf : 1), db = r.otherTaxablePart - r.spPart;
    if (Math.abs(db - want) > 1e-6) off.push(`plan year ${r.t} (the partner ${age}): £${Math.round(db)} beside the state pension`);
  }
  ok(2, `the engine's year: S129 with the partner four years older (${c.ageSelf0}/${c.agePart0}, ${c.totalYears} years), the partner's £12,000 DB pension from 66 with its end blank paid in every plan year to the last`, !off.length,
    off.length ? `${off.length} years short: ${off.slice(0, 3).join('; ')}` : `from plan year ${66 - c.agePart0} to ${c.totalYears}`);
}

// ---- 3. the cut ----
{
  const bad = [];
  for (const [name, p] of [['the partner older', OLDER], ['the partner younger', YOUNGER], ['the partner younger, the years ending in .5', YOUNGER_HALF]]) {
    const h = ctxOf(E, p);
    for (const [who, owner] of [['self', 'self'], ['part', 'part']]) {
      const q = ctxOf(E, singlePlanFor(p, who, 0.5)), a = paidYears(h, owner).join(), b = paidYears(q, 'self').join();
      if (a !== b) bad.push(`${name}, ${who}'s plan: paid in ${paidYears(q, 'self').length} plan years, the household's year ${paidYears(h, owner).length}`);
    }
    const cp = couplePlans(E, p, { shareRule: 'pots' }), hh = ctxOf(E, cp.household);
    for (const who of ['self', 'part']) if (paidYears(hh, who).join() !== paidYears(ctxOf(E, cp.plans[who]), 'self').join()) bad.push(`${name}, ${who}'s plan by the page's route`);
  }
  ok(3, "the cut: each person's plan, and by the page's route, pays each blank-end income in the household's plan years, also where the plan's years end in .5", !bad.length, bad.join('; ') || `three couples (the third ${ctxOf(E, YOUNGER_HALF).ageSelf0} and ${ctxOf(E, YOUNGER_HALF).agePart0} to ${ctxOf(E, YOUNGER_HALF).terminalAge}, ${ctxOf(E, YOUNGER_HALF).totalYears} years), both people, both routes`);
}

// ---- 4. the other order ----
{
  const bad = [];
  for (const [name, p] of [['the partner older', OLDER], ['the partner younger', YOUNGER]]) {
    const h = ctxOf(E, p), m = ctxOf(E, otherOrder(E, p));
    if (paidYears(h, 'self').join() !== paidYears(m, 'part').join() || paidYears(h, 'part').join() !== paidYears(m, 'self').join()) bad.push(`${name}: the plan as entered pays the incomes in ${paidYears(h, 'self').length} and ${paidYears(h, 'part').length} plan years, entered the other way round in ${paidYears(m, 'part').length} and ${paidYears(m, 'self').length}`);
  }
  ok(4, 'the other order: each income paid in the same plan years whichever partner is entered first', !bad.length, bad.join('; ') || 'both couples');
}

// ---- 5. the library ----
{
  const all = buildScenarios(), couples = all.filter(s => s.plan.demographics.planningMode !== 'single');
  const older = couples.filter(s => { const c = ctxOf(E, s.plan); return c.agePart0 > c.ageSelf0; }).length;
  const dig = Eng => { const h = createHash('sha256'); for (const s of all) h.update(JSON.stringify(ctxOf(Eng, s.plan).otherIncomes)); return h.digest('hex'); };
  const now = dig(E), before = dig(OLD);
  ok(5, `the library: ${couples.length} couples, ${older} with the partner older; the incomes of all ${all.length} plans in their contexts the code before's, bit for bit`, couples.length === 210 && older === 0 && now === before, `${now.slice(0, 16)} against the code before's ${before.slice(0, 16)}`);
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\nincome-end: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
