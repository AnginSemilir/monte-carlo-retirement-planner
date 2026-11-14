/*
 * A COUPLE'S SOLVE FROM TWO SINGLE SOLVES (Part D, D5.1; research/solver/PART-D.md; src/solverCouple.js).
 *
 * The page solves a couple as two single solves, each person's plan with their partner's age, each keyed, stored and split as
 * a single's is, and the owner worker assembles the couple from the two tables. This holds that to solveCouple run whole:
 *   1. couplePlans cuts the household's plan, each person's plan and each partner's age exactly as solveCouple hands them to
 *      its own solveOne;
 *   2. the couple assembled from two separate solves (assembleCouple) is solveCouple's whole: each table's fingerprint, and the
 *      engine's run of the couple (src/solverStrategy.js solvedContext, the couple through the joint move) on 200 paths of
 *      seed 99001, survival, the pot and the tax on every path, bit for bit;
 *   3. a table solved for another plan, or for another partner's age, is refused by the assembly;
 *   4. the couple's figures run: the headline and the comparison on the couple (strategyRuns, headlineOf), its first retired year
 *      the household's (the earlier of the two people's), and a single's first retired year as before;
 *   5. the page's switch module (src/couplesSwitch.js) reads the band as couple.js does: its band couple.js's SHARE_BAND, and on
 *      every plan where couple.js's shareFor gives the half share, over the library's couples re-held from 30/70 to 90/10;
 *      outside the band it is on or off by the guard on the elder's share (D99; research/tests/couple-default.test.mjs);
 *   6. the solve's key (src/solverKey.js): every one of the library's 210 singles keyed as on the code before D5 (their keys'
 *      digest pinned, taken on 3cec591e, fefdb387's parent, 14 Nov; the reviewer of 14 Nov, finding 7), and a person's moved by
 *      their partner's age.
 * Plants (--planted runs each and wants its checks to fail): 'swap' (assembleCouple hands each person the other's table: check
 * 2), 'noage' (the plans cut with no partner's age, each solved as a single's: check 2 refused, so 2 fails), 'agenull'
 * (src/solverKey.js: a partner's age of null in every key without one, which moves every single's key: check 6).
 *   node research/tests/couple-solve-client.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCouple, shareFor, SHARE_BAND } from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { couplePlans, assembleCouple, householdPlan, isCouple, PLANT } from '../../src/solverCouple.js';
import { COUPLE_BAND, coupleSolverOn } from '../../src/couplesSwitch.js';
import { solvedContext, strategyRuns, headlineOf, retireYearOf, runPath } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { solveKey, PLANT as KEY_PLANT } from '../../src/solverKey.js';
import { createHash } from 'node:crypto';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['swap', ['2']], ['noage', ['2']], ['agenull', ['6']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_SOLVE_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), ok = want.every(c => failed.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${ok ? 'yes' : 'NO'}`);
    if (!ok) bad++;
  }
  process.exit(bad ? 1 : 0);
}
{ const pl = process.env.COUPLE_SOLVE_PLANT || ''; if (pl === 'agenull') KEY_PLANT.rule = pl; else PLANT.rule = pl; }

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const lib = buildScenarios(), couples = lib.filter(s => s.plan.demographics.planningMode === 'couple');
// a library couple with years before the second person's pension access, so the bridge reader and the partner's age both act
const base = couples.find(s => Number(s.plan.demographics.currentAgePart) < 55 && Number(s.plan.demographics.currentAgeSelf) >= 50) || couples[0];
const plan = base.plan;

// 1. the plans and the partners' ages
const cut = couplePlans(E, plan), seen = {};
const household = householdPlan(E, plan);
solveCouple(E, M, household, { solveOne: (p, o) => { seen[o.who] = { plan: JSON.stringify(p), age: o.partnerAge0 }; return solveForApp(E, M, p, { ...light, ageWith: o.partnerAge0 }); } });
const same1 = ['self', 'part'].every(w => seen[w] && seen[w].plan === JSON.stringify(cut.plans[w]) && seen[w].age === cut.ageWith[w]);
ok(`1. ${base.id}: each person's plan and partner's age cut as solveCouple hands them to its solveOne`, PLANT.rule === 'noage' ? true : same1,
  `self aged ${cut.plans.self.demographics.currentAgeSelf} with a partner of ${cut.ageWith.self}; part aged ${cut.plans.part.demographics.currentAgeSelf} with ${cut.ageWith.part}; share ${cut.share}`);

// 2. assembled from two separate solves against solveCouple whole
const whole = solveCouple(E, M, household, { solveOne: (p, o) => solveForApp(E, M, p, { ...light, ageWith: o.partnerAge0 }) });
const tabs = { self: solveForApp(E, M, cut.plans.self, { ...light, ageWith: cut.ageWith.self }), part: solveForApp(E, M, cut.plans.part, { ...light, ageWith: cut.ageWith.part }) };
let cp = null, why = '';
try { cp = assembleCouple(E, M, cut.household, tabs, { solvedOn: { self: { plan: cut.plans.self, ageWith: cut.ageWith.self }, part: { plan: cut.plans.part, ageWith: cut.ageWith.part } } }); } catch (e) { why = e.message; }
let same2 = false, extra2 = why ? `refused: ${why}` : '';
if (cp) {
  const d = async r => digestOf(tablesOf(r));
  const dig = { a: [await d(whole.tables.self), await d(whole.tables.part)], b: [await d(cp.tables.self), await d(cp.tables.part)] };
  const cA = solvedContext(E, whole), cB = solvedContext(E, cp), paths = E.pathsForSeed(99001, 200, cA.totalYears);
  let differ = 0;
  for (const zs0 of paths) { const zs = Float64Array.from(zs0), a = runPath(E, cA, zs), b = runPath(E, cB, zs); if (a.survived !== b.survived || a.terminalPot !== b.terminalPot || a.lifetimeTax !== b.lifetimeTax) differ++; }
  same2 = isCouple(cp) && dig.a[0] === dig.b[0] && dig.a[1] === dig.b[1] && differ === 0;
  extra2 = `tables ${dig.b.map(x => x.slice(0, 12)).join(' and ')} (whole ${dig.a.map(x => x.slice(0, 12)).join(' and ')}); the engine's run differing on ${differ} of 200 paths`;
}
ok('2. the couple from two separate solves is solveCouple\'s whole: both tables and the engine\'s run of it, bit for bit', same2, extra2);

// 3. a table solved for another plan or another partner's age is refused
{ const refuses = o => { try { assembleCouple(E, M, cut.household, tabs, { solvedOn: o }); return false; } catch { return true; } };
  const other = { ...cut.plans.self, spending: { ...cut.plans.self.spending, targetSpend: Number(cut.plans.self.spending.targetSpend) + 100 } };
  const r1 = refuses({ self: { plan: other, ageWith: cut.ageWith.self }, part: { plan: cut.plans.part, ageWith: cut.ageWith.part } });
  const r2 = refuses({ self: { plan: cut.plans.self, ageWith: cut.ageWith.self + 1 }, part: { plan: cut.plans.part, ageWith: cut.ageWith.part } });
  const r3 = refuses(undefined);
  ok('3. the assembly refuses a table solved on another plan, with another partner\'s age, or with no record', r1 && r2 && r3, `${r1} ${r2} ${r3}`); }

// 4. the couple's figures, and a single's first retired year as before
{ const ref = cp || whole, ctx = solvedContext(E, ref), runs = strategyRuns(E, ref, household, { seed: 4, from: 0, to: 60 });
  const rt = retireYearOf(ctx), want = Math.max(0, Math.min(ctx.totalYears, ...ctx.owners.map(o => Math.ceil(o.retireAge - o.age0))));
  const h = headlineOf(E, ctx, runs.solved, rt);
  const single = lib.find(s => s.plan.demographics.planningMode === 'single'), sc = E.buildContext(E.resolveMpaa(E.normalizePlan(single.plan)));
  const singleWas = Math.max(0, Math.min(sc.totalYears, Math.ceil(sc.owners[0].retireAge - sc.ageSelf0)));
  ok('4. the couple\'s headline and comparison run on the joint move; its first retired year the earlier of the two; a single\'s as before',
    runs.solved.length === 60 && runs.yours.length === 60 && Number.isFinite(h.survival) && rt === want && retireYearOf(sc) === singleWas,
    `the household retired from year ${rt} (the people from ${ctx.owners.map(o => Math.ceil(o.retireAge - o.age0)).join(' and ')}); survival ${h.survival.toFixed(1)}% on 60 paths; a single's year ${retireYearOf(sc)} (was ${singleWas})`); }

// 5. the page's switch reads the band as couple.js does: on wherever shareFor gives the half share; outside the band, the guard
// on the elder's share decides (D99; couple-default.test.mjs check 2 holds that)
{ const reheld = (p, f) => ({ ...p, accounts: p.accounts.map(a => { const tot = p.accounts.filter(x => x.id.replace(/_(self|part)$/, '') === a.id.replace(/_(self|part)$/, '')).reduce((t, x) => t + (Number(x.balance) || 0), 0); return /_self$/.test(a.id) ? { ...a, balance: tot * f } : /_part$/.test(a.id) ? { ...a, balance: tot * (1 - f) } : a; }) });
  let n = 0, half = 0, differ = 0, onCount = 0;
  for (const c of couples) for (const f of [null, 0.3, 0.4, 0.5, 0.6, 0.65, 0.9]) {
    const p = f === null ? c.plan : reheld(c.plan, f), mine = coupleSolverOn(p, true).on, theirs = shareFor(p) === 0.5;
    n++; if (theirs) { half++; if (!mine) differ++; } if (mine) onCount++;
  }
  ok('5. the page\'s switch module reads couple.js\'s band: the same band, and every plan on where shareFor gives the half share', JSON.stringify(COUPLE_BAND) === JSON.stringify(SHARE_BAND) && half > 0 && differ === 0 && !coupleSolverOn(plan, false).on,
    `${n} plans (the library's couples as held and re-held 30/70 to 90/10), ${half} at the half share, ${differ} of them off; ${onCount} on in all`); }

// 6. the key: every single keyed as on the code before D5 (the digest of their 210 keys, taken on 3cec591e, fefdb387's parent:
// research/solver/results-couple-solve-client.txt), and a person's key moved by their partner's age
{ const KEYS_BEFORE_D5 = '6825f36b3e1a20ff';
  const singles = lib.filter(s => s.plan.demographics.planningMode === 'single'), h = createHash('sha256');
  for (const s of singles) h.update(`${s.id}:${await solveKey(E, s.plan, {})};`);
  const got = h.digest('hex').slice(0, 16);
  const c = await solveKey(E, cut.plans.self, { ageWith: cut.ageWith.self }), d = await solveKey(E, cut.plans.self, { ageWith: cut.ageWith.self + 1 });
  ok('6. every single keyed as on the code before D5; a person\'s key moved by their partner\'s age', singles.length === 210 && got === KEYS_BEFORE_D5 && c !== d,
    `${singles.length} singles' keys' digest ${got} against ${KEYS_BEFORE_D5} before D5; the first person's key ${c.slice(0, 12)}, and with the partner a year older ${d.slice(0, 12)}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
