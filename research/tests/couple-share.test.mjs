/*
 * THE REVIEW OF 9 NOV, ITEM 6, STAGE B: A COUPLE'S SHARE OF THE SPENDING FROM THEIR POTS (solveCouple's opts.shareRule
 * 'pots'; a research option, off; D70, on stage A's read, results-share-a.txt). Each person's table is solved on
 * shareFor(plan) of the household's spending, not half: 0.5 where the first person holds 40% to 60% of the pots (D4's couples,
 * who hold 60/40, keep the share they ran at), their share of the pots outside it, held to 5% to 95%.
 *   1. shareFor on five couples worked by hand: 60/40 gives 0.5; 45/55 0.5; 75/25 0.75; 90/10 0.9; one person holding
 *      everything 0.95; and every library couple as the library holds it: 0.5
 *   2. the rule off: S007's two tables the code before the option's, bit for bit (a digest taken there, at the sweep's light
 *      settings); the rule on, S007 as held: the same tables; meta records share and shareRule
 *   3. S007 re-held 90/10 at 6 points, 200 paths of seed 7002, the target landed so the rules arm survives about 85% on them
 *      (stage A's landing): the rollout under the rule not more than 2 points below the rules arm (the review measured -9.3
 *      at 4 points under half)
 *   4. the refusals: a shareRule other than 'pots'; share and shareRule both given
 * The plant 'sharehalf' (COUPLE.plant: shareFor held at 0.5) fails checks 1 and 3. --planted runs it and reads which fail.
 *   node research/tests/couple-share.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCouple, withCouple, shareFor, COUPLE } from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { prepareForSolve } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { reheld, asRules } from '../solver/audit-share.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  const want = ['1', '3'];
  const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_SHARE_PLANT: 'sharehalf' }, encoding: 'utf8' });
  const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
  const exact = failed.length === want.length && want.every(n => failed.includes(n));
  console.log(`plant sharehalf fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
  if (!exact) console.log(r.stdout + r.stderr);
  process.exit(exact ? 0 : 1);
}
const PLANT = process.env.COUPLE_SHARE_PLANT || '';
COUPLE.plant = PLANT;
const RECORD = !!process.env.COUPLE_SHARE_RECORD;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-share: a couple's share of the spending from their pots (the review of 9 Nov, item 6, stage B)${PLANT ? `; planted: ${PLANT}` : ''}`);
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const library = buildScenarios();
const solveAt = (pts) => (p, o) => solveForApp(E, M, p, { points: pts, research: LIGHT, ageWith: o.partnerAge0 });

// ---- 1. shareFor by hand ----
{
  const plan = (a, b) => ({ accounts: [{ id: 'pen_self', balance: a * 0.7 }, { id: 'isa_self', balance: a * 0.3 }, { id: 'pen_part', balance: b * 0.7 }, { id: 'isa_part', balance: b * 0.3 }] });
  const cases = [[60, 40, 0.5], [45, 55, 0.5], [75, 25, 0.75], [90, 10, 0.9], [100, 0, 0.95]];
  const got = cases.map(([a, b, w]) => ({ a, b, w, s: shareFor(plan(a * 1000, b * 1000)) }));
  const off = library.filter(s => s.plan.demographics && s.plan.demographics.planningMode !== 'single').map(s => ({ id: s.id, s: shareFor(E.normalizePlan(s.plan)) })).filter(x => x.s !== 0.5);
  const nCouples = library.filter(s => s.plan.demographics && s.plan.demographics.planningMode !== 'single').length;
  ok(1, 'shareFor on five couples worked by hand, and every library couple as held: 0.5', got.every(g => Math.abs(g.s - g.w) < 1e-12) && off.length === 0,
    `${got.map(g => `${g.a}/${g.b} ${+g.s.toFixed(12)} (by hand ${g.w})`).join('; ')}; library couples off 0.5: ${off.length} of ${nCouples}${off.length ? ` (${off.slice(0, 3).map(x => `${x.id} ${x.s}`).join(', ')})` : ''}`);
}

// ---- 2. the rule off, and on where the band keeps half ----
{
  // S007 at 4 points, taken on the code before the option (items 3 to 5: ee4875424b94acb8...), re-taken on D73's candidate (11 Nov, D81 (A),
  // D83: with the sweep to the ISA and the solve on anchors left out the solve gives the earlier figure, results-d73-digests.txt)
  const BEFORE = '1320a1db06372238bfbbe1811f253475d3f02555f3067ec333a12a19e33e0bd7';
  const plan = prepareForSolve(E, E.normalizePlan(library.find(s => s.id === 'S007').plan));
  const dig = async cp => digestOf([...tablesOf(cp.tables.self), ...tablesOf(cp.tables.part)]);
  const off = solveCouple(E, M, plan, { solveOne: solveAt(4) }), dOff = await dig(off);
  if (RECORD) { console.log(`RECORD S007 ${dOff}`); process.exit(0); }
  const on = solveCouple(E, M, plan, { shareRule: 'pots', solveOne: solveAt(4) }), dOn = await dig(on);
  ok(2, 'the rule off: S007\'s tables the code before the option\'s, bit for bit; on, S007 as held (60/40): the same tables; meta records share and shareRule',
    dOff === BEFORE && dOn === BEFORE && off.meta.share === 0.5 && off.meta.shareRule === 'half' && on.meta.share === 0.5 && on.meta.shareRule === 'pots',
    `off ${dOff.slice(0, 16)}, on ${dOn.slice(0, 16)} against ${BEFORE.slice(0, 16)}; meta off ${off.meta.share} ${off.meta.shareRule}, on ${on.meta.share} ${on.meta.shareRule}`);
}

// ---- 3. S007 at 90/10: the rollout under the rule against the rules arm ----
{
  const N = 200, SEED = 7002, LAND = 85;
  let plan = reheld(E.normalizePlan(library.find(s => s.id === 'S007').plan), 'ninety-ten');
  const T = E.buildContext(plan).totalYears, paths = E.pathsForSeed(SEED, N, T);
  const surv = ctx => { let s = 0; for (const zs of paths) if (E.runTrial(ctx, zs).survived) s++; return 100 * s / N; };
  const withTarget = (p, t) => E.normalizePlan({ ...p, spending: { ...p.spending, targetSpend: t } });
  let lo = 0.3, hi = 3; const tBase = Number(plan.spending.targetSpend);
  for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (surv(E.buildContext(E.resolveMpaa(asRules(withTarget(plan, tBase * mid))))) > LAND) lo = mid; else hi = mid; }
  plan = withTarget(plan, Math.round(tBase * lo));
  const rules = surv(E.buildContext(E.resolveMpaa(asRules(plan))));
  const t0 = Date.now();
  const cp = solveCouple(E, M, prepareForSolve(E, plan), { shareRule: 'pots', solveOne: solveAt(6) });
  const rollout = surv(E.buildContext(withCouple(cp.plan, cp))), d = rollout - rules;
  ok(3, 'S007 re-held 90/10 at 6 points, 200 paths: the rollout under the rule not more than 2 points below the rules arm', d >= -2 && cp.meta.share === (PLANT ? 0.5 : 0.9),
    `the share ${cp.meta.share}; the rules ${rules.toFixed(1)}%, the rollout ${rollout.toFixed(1)}%: ${d >= 0 ? '+' : ''}${d.toFixed(1)} points (target £${Number(plan.spending.targetSpend).toLocaleString('en-GB')}; ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

// ---- 4. the refusals ----
{
  const plan = prepareForSolve(E, E.normalizePlan(library.find(s => s.id === 'S007').plan));
  const threw = o => { try { solveCouple(E, M, plan, { ...o, solveOne: () => { throw new Error('solved'); } }); return 'no'; } catch (e) { return e.message; } };
  const a = threw({ shareRule: 'even' }), b = threw({ shareRule: 'pots', share: 0.5 });
  ok(4, 'the refusals: a shareRule other than \'pots\'; share and shareRule both given', /shareRule 'even'/.test(a) && /both given/.test(b), `${a}; ${b}`);
}

console.log(`\ncouple-share: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
