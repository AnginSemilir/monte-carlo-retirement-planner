/*
 * THE FIXED SHARE RULES (D104 (4); couple.js shareBy, 'potsflat' and 'means'; research options, off in code, until their
 * registered test reads). A couple's plan is cut into one plan for each person at the first person's share of the household's
 * spending; 'pots' (the app's since D99) takes the pots' share outside a 40% to 60% band and half inside it. The two rules:
 * 'potsflat', the pots' share with the band dropped; 'means', each person's share of the two people's means. Both held to 5%
 * to 95%.
 *   1. without them, as before: the library's 210 couples cut by the page's route (solverCouple.js couplePlans) under 'pots'
 *      and with no rule, each person's plan, the share and the household, the code before's to the bit (a digest taken on
 *      1dc3afea, before the rules); shareBy 'pots' is shareFor on every couple
 *   2. 'potsflat': on every library couple the first person's share of the pots, held to 5% to 95%, inside the band too
 *      (where 'pots' gives a half)
 *   3. 'means': on every library couple the research meansOf (audit-share-choose.mjs, the share choice's read), held, to the
 *      bit; and by hand on a couple built for it: its pots alone, then a DB pension of the partner's from 66, each year's
 *      at 2.5% real, the share moving by the pension's discounted sum
 *   4. the solve: solveCouple under each rule records it and cuts each person's plan at that share (each person's target the
 *      share of the household's, rounded); couplePlans the same by the page's route
 *   5. the refusals: an unknown rule; a rule and a share both given
 * Plants (COUPLE.plant): 'flatband' keeps the band under 'potsflat' (fails check 2); 'meansnoinc' leaves other incomes out of
 * the means (fails check 3).
 *   node research/tests/couple-share-rules.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { couplePlans } from '../../src/solverCouple.js';
import { prepareForSolve } from '../../src/solverSettings.js';
import { solveForApp } from '../../src/solverApp.js';
import { couplesOf } from '../solver/couple-panel.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['flatband', ['2']], ['meansnoinc', ['3']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_SHARE_RULES_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
const { shareBy, shareFor, meansOf, solveCouple, COUPLE, SHARE_HOLD, SHARE_BAND } = CPL;
const PLANT = process.env.COUPLE_SHARE_RULES_PLANT || '';
COUPLE.plant = PLANT;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-share-rules: the fixed share rules, 'potsflat' and 'means', off in code${PLANT ? `; planted: ${PLANT}` : ''}`);
const library = couplesOf();
const potsOf = p => { const of = w => (p.accounts || []).filter(a => String(a.id).endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0); return { a: of('self'), b: of('part') }; };
const hold = f => Math.min(SHARE_HOLD[1], Math.max(SHARE_HOLD[0], f));

// ---- 1. without the rules, as before ----
{
  const BEFORE = 'dda86da9972ea44562d0f71b94ba11d21c207f9a18827a093913797b862715a7';   // taken on 1dc3afea, the code before the rules
  const h = createHash('sha256');
  let potsSame = 0;
  for (const s of library) {
    for (const rule of ['pots', undefined]) { const c = couplePlans(E, s.plan, { shareRule: rule }); h.update(JSON.stringify([s.id, rule || 'none', c.share, c.shareRule, c.plans, c.household])); }
    if (shareBy(E, s.plan, 'pots') === shareFor(s.plan)) potsSame++;
  }
  const dig = h.digest('hex');
  ok(1, `without the rules, as before: the library's ${library.length} couples cut by the page's route under 'pots' and with no rule, the code before's to the bit; shareBy 'pots' shareFor's on ${potsSame} of ${library.length}`,
    dig === BEFORE && potsSame === library.length, `${dig.slice(0, 16)} against the code before's ${BEFORE.slice(0, 16)}`);
}

// ---- 2. 'potsflat' ----
{
  let same = 0, inBand = 0, moved = 0;
  for (const s of library) {
    const { a, b } = potsOf(s.plan), want = a + b > 0 ? hold(a / (a + b)) : 0.5, got = shareBy(E, s.plan, 'potsflat');
    if (got === want) same++;
    const f = a / (a + b);
    if (f >= SHARE_BAND[0] - 1e-9 && f <= SHARE_BAND[1] + 1e-9) { inBand++; if (got !== 0.5) moved++; }
  }
  ok(2, `'potsflat': on every library couple the first person's share of the pots, held to 5% to 95%; inside the band too (${inBand} couples there, ${moved} of them off the half)`,
    same === library.length && moved > 0, `${same} of ${library.length} as by hand`);
}

// ---- 3. 'means' ----
{
  const { meansOf: researchMeans } = await import('../solver/audit-share-choose.mjs');
  let same = 0;
  for (const s of library) { const r = researchMeans(s.plan), got = shareBy(E, s.plan, 'means'); if (got === (r.self + r.part > 0 ? hold(r.share) : 0.5)) same++; }
  // by hand: S007 with its other incomes taken out, then a DB pension of the partner's from 66 added
  const base = JSON.parse(JSON.stringify(E.normalizePlan(library.find(s => s.id === 'S007').plan)));
  base.otherIncomes = [];
  const bare = E.normalizePlan(base), m0 = meansOf(E, bare), c = E.buildContext(E.resolveMpaa(bare));
  const withDb = E.normalizePlan({ ...bare, otherIncomes: [{ id: 'db_test', name: 'DB pension', owner: 'Partner', startAge: 66, endAge: '', amount: 10000, incomeType: 'otherTaxable', notes: '' }] });
  const m1 = meansOf(E, withDb);
  let pv = 0; for (let t = 0; t <= c.totalYears; t++) if (c.agePart0 + t >= 66) pv += 10000 * Math.pow(1.025, -t);
  const byHand = Math.abs(m1.part - m0.part - pv) < 1e-6 && Math.abs(m1.self - m0.self) < 1e-9 && shareBy(E, withDb, 'means') === hold(m1.self / (m1.self + m1.part));
  ok(3, `'means': the research meansOf, held, on ${same} of ${library.length} library couples to the bit; by hand on S007, the partner's £10,000 DB pension from 66 adding its discounted sum to the partner's means (£${Math.round(pv).toLocaleString('en-GB')})`,
    same === library.length && byHand, `the partner's means £${Math.round(m0.part).toLocaleString('en-GB')} to £${Math.round(m1.part).toLocaleString('en-GB')}; the first person's share ${m0.share.toFixed(4)} to ${m1.share.toFixed(4)}`);
}

// ---- 4. the solve ----
{
  const S = prepareForSolve(E, E.normalizePlan(library.find(s => s.id === 'S007').plan)), bad = [];
  // each person's table solved light (4 points, a small lattice), as couple-estate.test.mjs solves its couples
  const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
  const stub = (p, o) => solveForApp(E, M, p, { points: 4, research: LIGHT, ageWith: o.partnerAge0 });
  for (const rule of ['potsflat', 'means']) {
    const share = shareBy(E, S, rule);
    let cp = null;
    try { cp = solveCouple(E, M, S, { shareRule: rule, solveOne: stub }); } catch (e) { bad.push(`${rule}: solveCouple threw ${e.message.slice(0, 80)}`); continue; }
    const tgt = Number(S.spending.targetSpend);
    if (cp.share !== share || cp.meta.shareRule !== rule) bad.push(`${rule}: the solve's share ${cp.share} (${cp.meta.shareRule}), not ${share}`);
    if (Number(cp.plans.self.spending.targetSpend) !== Math.round(tgt * share) || Number(cp.plans.part.spending.targetSpend) !== Math.round(tgt * (1 - share))) bad.push(`${rule}: each person's target not the share's`);
    const pg = couplePlans(E, S, { shareRule: rule });
    if (pg.shareRule !== rule || Math.abs(pg.share - shareBy(E, pg.household, rule)) > 0) bad.push(`${rule}: the page's route at ${pg.share} (${pg.shareRule})`);
  }
  ok(4, "the solve: solveCouple under 'potsflat' and 'means' records the rule and cuts each person's plan at its share; the page's route the same", !bad.length, bad.join('; ') || 'S007, both rules');
}

// ---- 5. the refusals ----
{
  const S = prepareForSolve(E, E.normalizePlan(library.find(s => s.id === 'S007').plan)), msgs = [];
  for (const o of [{ shareRule: 'income' }, { shareRule: 'means', share: 0.6 }]) { try { solveCouple(E, M, S, { ...o, solveOne: () => { throw new Error('solved'); } }); msgs.push('none'); } catch (e) { msgs.push(e.message); } }
  ok(5, 'the refusals: an unknown rule, and a rule with a share, each before any solve', /none of pots, potsflat, means/.test(msgs[0]) && /share and shareRule both given/.test(msgs[1]), msgs.map(m => m.slice(0, 60)).join(' | '));
}

console.log(`\ncouple-share-rules: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
