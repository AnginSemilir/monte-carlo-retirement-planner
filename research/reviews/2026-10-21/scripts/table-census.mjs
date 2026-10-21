// TABLE CENSUS (external review, 21 Oct 2026). Solves one single household under the product baseline and counts the
// cells where the backward pass chose no move - survival left at its starting value -1 and the estate at -Infinity -
// which is what a cell gets when every move's score is NaN (O200: finalYearExact passes u = 1 to PhiInv). Such a cell
// reads as certain failure one year earlier and its -Infinity estate makes every move that reads it score -Infinity,
// so the damage spreads backwards. Prints the count per world and year and the opening read per world.
//
// usage (from the repository root, after `python3 research/build-engine.py`):
//   node research/reviews/2026-10-21/scripts/table-census.mjs <household> <points> [solverDir]
// e.g. node research/reviews/2026-10-21/scripts/table-census.mjs S070 60
// solverDir defaults to src/solver; pass a patched copy's folder to compare.
//
// Settings: PRODUCT_BASELINE with the plan's withdrawal moves only (spendLevels [1], raiseWeight 0, lambda 0, no tier
// moves), guardrails and lookahead off, the minimum end pot one year of target spending unless the plan sets one.
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const E = await import(pathToFileURL(resolve(root, 'research/engine.mjs')).href);
const { buildScenarios } = await import(pathToFileURL(resolve(root, 'research/policy-study/scenarios.mjs')).href);
const [id, ptsArg, dirArg] = process.argv.slice(2);
const dir = resolve(root, dirArg || 'src/solver');
const M = await import(pathToFileURL(resolve(dir, 'model.js')).href);
const S = await import(pathToFileURL(resolve(dir, 'solve.js')).href);

const points = Number(ptsArg || 30);
const sc = buildScenarios().find(s => s.id === id);
if (!sc) throw new Error(`no household ${id}`);
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
let plan = prep(sc.plan);
const own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0));
const target = E.num(plan.spending && plan.spending.targetSpend, 0);
if (!(own > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(target) } };
const r = S.solveMixture(E, M, plan, { ...S.PRODUCT_BASELINE, points, spendLevels: [1], raiseWeight: 0, lambda: 0 });
const s0 = M.initialState(r.m), T = r.m.ctx.totalYears;
console.log(`${id} at ${points} wealth points, solver ${dir}: grid ${r.meta.points}, ${T + 1} years, ${r.actions.length} moves, solve ${(r.meta.ms / 1000).toFixed(1)} s`);
let total = 0;
r.mix.tables.forEach((tab, k) => {
  let unchosen = 0, nonFinite = 0; const byYear = [];
  for (let t = 0; t <= T; t++) {
    let n = 0;
    for (let i = 0; i < tab.surv[t].length; i++) {
      const sv = tab.surv[t][i], b = tab.beq[t][i];
      if (!Number.isFinite(sv) || !Number.isFinite(b)) nonFinite++;
      if (!(sv >= 0)) { unchosen++; n++; }
    }
    if (n) byYear.push(`${t}:${n}`);
  }
  total += unchosen;
  const v = tab.value(s0, 0);
  console.log(`  world ${k} (weight ${r.mix.weights[k].toFixed(3)}): opening survival ${(100 * v.survival).toFixed(2)}%, cells with no move chosen ${unchosen} of ${tab.surv[0].length * (T + 1)}, non-finite cells ${nonFinite}${byYear.length ? `; by year ${byYear.slice(0, 12).join(' ')}${byYear.length > 12 ? ' ...' : ''}` : ''}`);
});
console.log(total === 0 ? 'CLEAN: every cell has a chosen move' : `FAULT: ${total} cells with no move chosen`);
process.exitCode = total === 0 ? 0 : 1;
