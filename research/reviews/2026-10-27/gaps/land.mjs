/*
 * THE FIRE HOUSEHOLDS' TARGETS (EXPLORATORY; GAPS-SWEEP.md, Part B): each library household retiring at 52 (as Phase 4 builds
 * one) is landed where the outcome is in doubt, so the savings split can show: its target set by bisection, in whole hundreds
 * of pounds, until the plan's own rules (its named policy, as N1's probe prepares the plan, at the candidate's return
 * assumptions) survive 85% +/- 2 on 500 paths of seed 99001 (the state check's seed, not the probes' 7002), run by the engine.
 *   node land.mjs <id ...>        (from the root of the code under test; writes landing.json beside this file)
 */
import { resolve, dirname, join } from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { pathToFileURL, fileURLToPath } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const C = await imp('research/solver/candidate.mjs');
const { rawOf, prep } = await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), 'plan-probe.mjs')).href);
const HERE = dirname(fileURLToPath(import.meta.url)), OUT = join(HERE, 'landing.json');
const AIM = 85, TOL = 2, N = 500, SEED = 99001, MAX = 20;
const landing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
for (const id of process.argv.slice(2)) {
  if (!id.endsWith('F')) throw new Error(`land: ${id} is not a FIRE household`);
  const survivalAt = target => {
    const p = rawOf(id, { [id]: { target } }), plan = C.candidatePlan(E, prep(p)), ctx = E.buildContext(plan);
    const paths = E.pathsForSeed(SEED, N, ctx.totalYears);
    let ok = 0; for (const z of paths) if (E.runTrial(ctx, Float64Array.from(z)).survived) ok++;
    return 100 * ok / N;
  };
  let lo = 1000, hi = 400000, steps = 0, best = null;
  while (steps < MAX) {
    const mid = Math.round((lo + hi) / 2 / 100) * 100, s = survivalAt(mid); steps++;
    best = { target: mid, survival: s, steps };
    if (Math.abs(s - AIM) <= TOL) break;
    if (s > AIM) lo = mid; else hi = mid;
  }
  if (!(Math.abs(best.survival - AIM) <= TOL)) throw new Error(`land: ${id} did not land within ${MAX} steps (last ${JSON.stringify(best)})`);
  landing[id] = best;
  console.log(`${id}: target £${best.target}, the plan's rules survive ${best.survival.toFixed(1)}% of ${N} paths of seed ${SEED} (${best.steps} steps)`);
}
writeFileSync(OUT, JSON.stringify(landing, null, 1) + '\n');
