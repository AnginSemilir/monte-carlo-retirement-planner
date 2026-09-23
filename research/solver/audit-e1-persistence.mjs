/*
 * E1's HYPOTHESIS, MEASURED RATHER THAN GUESSED.   (PLAN.md Part E, phase E1)
 *
 *   node research/solver/audit-e1-persistence.mjs [bandIndex=32]
 *
 * E1 proposes evaluating only actions NEAR next year's winner instead of all 360, which makes it turn
 * entirely on one number: HOW OFTEN IS THIS YEAR'S BEST MOVE ALREADY IN A SMALL SET BUILT FROM NEXT
 * YEAR'S? I had recorded E1 as "not derivable - the run is the argument". That was wrong, and the
 * maintainer said so: the policy tables are ALREADY COMPUTED by any ordinary solve, so the quantity
 * E1's saving depends on can be read straight off them for the price of one solve.
 *
 * Backward induction fills `pol[t][cell]` for every year and cell, so comparing `pol[t]` against
 * `pol[t+1]` measures persistence exactly - no new machinery, no approximation, no E1 needed.
 *
 * FOUR CANDIDATE SETS, cheapest first, each a superset of the last:
 *   1  next year's winner alone
 *   2  + every action sharing its spend level and tier, differing only in draw order and harvest
 *   3  + every action sharing its draw order and harvest, differing only in level and tier
 *   4  the union of 2 and 3
 * Coverage is the fraction of cells whose TRUE winner this year is inside the set. The saving is
 * 1 - (set size / 360). E1 is worth building only where coverage is near total AND the set is small.
 */
import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
import * as M from '/home/user/vitejs-vite-kdvuf9qw/src/solver/model.js';
import { solve } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/solve.js';
import { tiersFor } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/fast.js';
import { buildScenarios } from '/home/user/vitejs-vite-kdvuf9qw/research/policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[Number(process.argv[2] || 32)].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
/* the household's OWN flex-tiers configuration: its landed lambda, raises on (without a raise weight the
 * solver drops the levels above 1, which silently left three levels and 216 actions on the first run),
 * joint tiers, 30 points. Single table, not the three-world mixture: these probes read r.pol directly. */
const FT = (() => { try { return JSON.parse(readFileSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/flex-tiers/' + sc.id + '.json', 'utf8')); } catch { return null; } })();
const LAMBDA = FT ? FT.solver.lambda : 0.5;
const r = solve(E, M, plan, { points: 30, lambda: LAMBDA, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum });
if (r.actions.length !== 360) { console.log(`REFUSED: ${r.actions.length} actions, expected 360 (5 levels x 24 cores x 3 tiers) - the probe would not measure the real menu`); process.exit(2); }
const A = r.actions, nA = A.length, T = r.m.ctx.totalYears, N = r.g.size;
/* the label minus its spend clause identifies the draw order + harvest core; tier is on the action */
const core = (a) => a.label.replace(/, spend \d+%/, '').replace(/, pension \d+ tiers? down/, '').replace(/, ISA \d+ tiers? down/, '');
const coreOf = A.map(core), lvlOf = A.map(a => a.spendLevel), tierOf = A.map(a => `${a.tierPen}/${a.tierIsa}`);
const sameLevelTier = [], sameCore = [];
for (let i = 0; i < nA; i++) {
  sameLevelTier[i] = []; sameCore[i] = [];
  for (let j = 0; j < nA; j++) {
    if (lvlOf[j] === lvlOf[i] && tierOf[j] === tierOf[i]) sameLevelTier[i].push(j);
    if (coreOf[j] === coreOf[i]) sameCore[i].push(j);
  }
}
console.log(`${sc.id}: ${nA} actions, ${N.toLocaleString()} cells, ${T + 1} years, grid 30 points, lambda ${LAMBDA}\n`);
console.log(`candidate set sizes from one winner:  1 / ${sameLevelTier[0].length} / ${sameCore[0].length} / ${new Set([...sameLevelTier[0], ...sameCore[0]]).size} of ${nA}\n`);

let n = 0; const hit = [0, 0, 0, 0];
for (let t = 0; t < T; t++) {
  const a = r.pol[t], b = r.pol[t + 1];
  for (let i = 0; i < N; i++) {
    const want = a[i], seed = b[i];
    n++;
    if (want === seed) { hit[0]++; hit[1]++; hit[2]++; hit[3]++; continue; }
    const s2 = sameLevelTier[seed].includes(want), s3 = sameCore[seed].includes(want);
    if (s2) hit[1]++;
    if (s3) hit[2]++;
    if (s2 || s3) hit[3]++;
  }
}
const sizes = [1, sameLevelTier[0].length, sameCore[0].length, new Set([...sameLevelTier[0], ...sameCore[0]]).size];
const names = ['next year\'s winner alone', '+ same level and tier', '+ same draw order and harvest', 'the union of both'];
console.log('  candidate set                      size    coverage    work saved');
for (let k = 0; k < 4; k++) {
  console.log('  ' + names[k].padEnd(33) + String(sizes[k]).padStart(4) + '   ' + (100 * hit[k] / n).toFixed(2).padStart(8) + '%   ' + (100 * (1 - sizes[k] / nA)).toFixed(1).padStart(9) + '%');
}
console.log(`\n  ${n.toLocaleString()} cell-years compared. Exact persistence - this year's winner IS next year's - is ${(100 * hit[0] / n).toFixed(2)}%.`);
const best = hit.map((h, k) => ({ k, cov: h / n, save: 1 - sizes[k] / nA })).filter(x => x.cov > 0.99).sort((a, b) => b.save - a.save)[0];
console.log(best
  ? `\n  PREDICTION FOR E1: the "${names[best.k]}" set covers ${(100 * best.cov).toFixed(2)}% of cells and skips ${(100 * best.save).toFixed(0)}% of the action work.`
  : `\n  PREDICTION FOR E1: NO candidate set here reaches 99% coverage. The policy does not persist enough for seeding to be safe,`);
if (best) console.log(`  Since the solve is 45.7% of a landing and the action loop is most of a solve, that is roughly ${(100 * best.save * 0.457).toFixed(0)}% off a run -`);
if (best) console.log(`  BUT E1 is a HEURISTIC: the ${(100 * (1 - best.cov)).toFixed(2)}% it misses take a worse action, which is why its gate is a paired field check.`);
