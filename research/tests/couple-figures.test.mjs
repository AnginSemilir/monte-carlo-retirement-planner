/*
 * A COUPLE'S FIGURES (Part D, D5.2; research/solver/PART-D.md; src/solverStrategy.js on a couple's solve).
 *   1. the money bands from the strategy's runs on a solved couple are the engine's monteCarlo(..., { collectPaths: true }).bands
 *      on the same seed and paths, run on the couple's context (the joint move each year), bit for bit; the headline's chance
 *      the money lasts is monteCarlo's success rate;
 *   2. the household's first retired year is the first year either person is retired (the engine's rule: App.jsx stepYear's
 *      anyRetired), on a couple whose partner retires first; the headline's starting level read in that year.
 * Plants (--planted): 'oneperson' (the couple's context built from the first person's table alone: check 1), 'firstalone' (the
 * household's first retired year read from the first person: check 2).
 *   node research/tests/couple-figures.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCouple } from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { householdPlan } from '../../src/solverCouple.js';
import { solvedContext, strategyRuns, strategySummary, retireYearOf, PLANT } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['oneperson', ['1']], ['firstalone', ['2']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_FIGURES_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), ok = want.every(c => failed.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${ok ? 'yes' : 'NO'}`);
    if (!ok) bad++;
  }
  process.exit(bad ? 1 : 0);
}

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const N = 300, SEED = 4242;
// a couple some years from retiring, the partner retiring first (the library has both at one age: the partner's moved earlier)
const c0 = buildScenarios().find(s => s.plan.demographics.planningMode === 'couple' && Number(s.plan.demographics.currentAgeSelf) <= 50);
const plan = JSON.parse(JSON.stringify(c0.plan));
const d = plan.demographics, selfIn = Number(d.retireAgeSelf) - Number(d.currentAgeSelf);
d.retireAgePart = Number(d.currentAgePart) + selfIn - 2;   // the partner retires two years before the first person
const household = householdPlan(E, plan);
const cp = solveCouple(E, M, household, { solveOne: (p, o) => solveForApp(E, M, p, { ...light, ageWith: o.partnerAge0 }) });
PLANT.rule = process.env.COUPLE_FIGURES_PLANT || '';

// 1. the money bands and the chance the money lasts against the engine's own Monte Carlo of the couple
{ let mine = null, mc = null, why = '';
  try {
    const runs = strategyRuns(E, cp, plan, { seed: SEED, from: 0, to: N }), s = strategySummary(E, cp, runs);
    PLANT.rule = '';
    mc = E.monteCarlo(solvedContext(E, cp), { trials: N, seed: SEED, collectPaths: true });
    mine = { bands: s.outlook.wealth.solved, survival: s.headline.survival };
  } catch (e) { why = e.message; }
  PLANT.rule = process.env.COUPLE_FIGURES_PLANT || '';
  const diff = !mine ? Infinity : mine.bands.length !== mc.bands.length ? Infinity : mine.bands.filter((b, t) => ['t', 'p10', 'p25', 'p50', 'p75', 'p90'].some(k => b[k] !== mc.bands[t][k])).length;
  // the survival as a count of paths: the headline takes 100 k / n and monteCarlo (k / n) 100, which can differ in the last place
  const paths = x => Math.round((x * N) / 100);
  ok(`1. ${c0.id} as a couple: the money bands on ${N} paths are monteCarlo's on the couple bit for bit, and the paths that last its paths`, diff === 0 && !!mine && paths(mine.survival) === paths(mc.successRate),
    mine ? `${mine.bands.length} years, ${diff} differ; ${paths(mine.survival)} paths last against ${paths(mc.successRate)}` : `threw: ${why}`); }

// 2. the household's first retired year
{ const ctx = solvedContext(E, cp), want = Math.min(...ctx.owners.map(o => Math.ceil(o.retireAge - o.age0)));
  const got = retireYearOf(ctx), first = Math.ceil(ctx.owners[0].retireAge - ctx.owners[0].age0);
  ok('2. the household retired from the first year either person is: the partner\'s, two years before the first person\'s', got === want && want === first - 2, `year ${got} (the partner's ${want}, the first person's ${first})`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
