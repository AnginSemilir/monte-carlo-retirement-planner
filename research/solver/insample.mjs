/*
 * THE EARLY SIGNAL: IS A STATE-DEPENDENT PLAN WORTH MORE THAN THE BEST FIXED RULE?
 *
 * This is the cheapest point at which the whole solver idea can be shown not to be worth continuing,
 * and it deliberately comes before the bridge into the engine is built. It is scored INSIDE the reduced
 * model, on both sides, so it cannot pass any gate on its own: the engine has tax detail the model's
 * grid gives up, and only phase 4 measures that. What it can do is say whether there is anything here
 * at all. If a table that re-decides every year from the household's actual position cannot beat a
 * fixed rule on its own terms, it will not beat one on the engine's.
 *
 * THE TWO ARMS, on common random numbers.
 *
 *   fixed   what the app does today, in the model: score all five named draw orders with the harvest
 *           both ways on the SEARCH paths, take the winner, and report what it scores on paths it has
 *           never seen. That last step is the whole point - a rule picked on the same sample it is
 *           judged on is flattered, and the app's own policy search has exactly that exposure.
 *   solved  backward induction over the grid. It sees no paths at all while solving: it integrates
 *           over a return distribution. So it has nothing to overfit to, and its held-out score is its
 *           only score.
 *
 * The table's own survival figure is NOT reported and is not the measurement. A value function read by
 * interpolation across a coarse grid can flatter itself badly; a simulation that actually spends the
 * money cannot. Both arms are simulated.
 *
 * Single-person households only. Couples need two tables and a funding split, which is phase 5, and a
 * single-person grid models them so badly that including them here would measure the wrong thing.
 *
 * Usage: node insample.mjs [households=10] [points=10] [searchPaths=400] [heldOut=1200] [seed=4242]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy, buildActions } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const N = Number(process.argv[2] || 10);
const POINTS = Number(process.argv[3] || 10);
const SEARCH = Number(process.argv[4] || 400);
const HELD = Number(process.argv[5] || 1200);
const SEED = Number(process.argv[6] || 4242);

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const pick = [];
for (let i = 0; i < N; i++) pick.push(singles[Math.floor(i * singles.length / N)]);
/*
 * ONLY=<i> runs just the i-th of the N, so a long sweep can be one process per household. A 20-point
 * solve holds about 140MB of tables and ten in a row exhausted the container, killing the run with no
 * output; one process each also makes progress visible rather than buffered to the end.
 */
if (process.env.ONLY !== undefined) { const i = Number(process.env.ONLY); pick.length = 0; pick.push(singles[Math.floor(i * singles.length / N)]); }

const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));

/* Run a fixed action forward on one market path, in the model, and say how it went. */
function runFixedPath(m, action, zs) {
  const state = M.initialState(m);
  const rates = {};
  let lifetimeTax = 0;
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    const z = zs[t];
    m.ctx.accounts.forEach(a => {
      const vol = Math.sqrt(a.vol * a.vol + a.sigmaParam * a.sigmaParam);
      rates[a.id] = Math.exp(Math.log(1 + a.real) + vol * z) - 1;
    });
    const row = M.step(m, state, action, t, rates);
    lifetimeTax += row.taxPaid + row.cgtPaid;
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) return { survived: false, terminalNet: 0, lifetimeTax };
  }
  const o = m.ctx.owners[0];
  const total = ['pen', 'isa', 'other', 'cash'].reduce((s, c) => s + (state.pots[o.ids[c]] || 0), 0);
  const pen = state.pots[o.ids.pen] || 0;
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, terminalNet: 0, lifetimeTax };
  return { survived: true, terminalNet: Math.max(0, total - pen * m.ctx.pensionDeathTaxRate), lifetimeTax };
}

const summarise = (rs) => ({
  survival: 100 * rs.filter(r => r.survived).length / rs.length,
  median: (() => { const a = rs.map(r => r.terminalNet).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; })(),
  tax: (() => { const a = rs.map(r => r.lifetimeTax).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; })()
});

console.log(`${pick.length} single-person households, grid ${POINTS} points, ${SEARCH} search paths, ${HELD} held-out, seed ${SEED}`);
console.log('both arms simulated in the reduced model; the table\'s own figure is not used\n');

const rows = [];
const t0 = Date.now();
for (const sc of pick) {
  const plan = prep(sc.plan);
  const m = M.prepare(E, plan);
  const years = m.ctx.totalYears;
  const searchPaths = E.pathsForSeed(SEED, SEARCH, years);
  const heldPaths = E.pathsForSeed(SEED + 991, HELD, years);

  /*
   * ---- the fixed arm, two ways.
   *
   * FAIR=same: the SAME twenty-four moves the solver may choose from, each held fixed for life, with the
   * cash sweep on, so the only thing that differs between the arms is whether the move may change with
   * the position. That isolates state-dependence, which is the question this file exists to answer.
   *
   * Otherwise: the app's own menu as it stands today, sweep off. That measures "solver against the app",
   * which is gate 4's question and is confounded here by the sweep and by the two menus not nesting.
   */
  const menu = [];
  if (process.env.FAIR === 'same') {
    buildActions().forEach(a => menu.push({ ...a, lump: m.ctx.fullLumpSum }));
  } else for (const key of Object.keys(E.DECUMULATION_POLICIES)) {
    const pol = E.DECUMULATION_POLICIES[key];
    for (const harvest of pol.harvest ? [false, true] : [false]) {
      for (const ceil of harvest ? ['pa', 'basic'] : ['pa']) {
        menu.push({ key, steps: pol.steps, costSteps: m.ctx.costSteps, harvest, harvestCeil: ceil, sweepCash: false, lump: m.ctx.fullLumpSum, contrib: null,
          label: `${key}${harvest ? ` + harvest to ${ceil === 'pa' ? 'allowance' : 'basic'}` : ''}` });
      }
    }
  }
  let best = null;
  for (const a of menu) {
    const s = summarise(searchPaths.map(zs => runFixedPath(m, a, zs)));
    if (!best || s.survival > best.s.survival || (s.survival === best.s.survival && s.median > best.s.median)) best = { a, s };
  }
  const fixedHeld = summarise(heldPaths.map(zs => runFixedPath(m, best.a, zs)));

  // ---- the solved arm: no paths seen while solving
  const r = solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum });
  const solvedHeld = summarise(heldPaths.map(zs => runPolicy(r, zs)));

  const d = solvedHeld.survival - fixedHeld.survival;
  rows.push({ id: sc.id, name: sc.name, d, fixed: fixedHeld, solved: solvedHeld, curse: best.s.survival - fixedHeld.survival, label: best.a.label, ms: r.meta.ms });
  console.log(`${sc.id} ${sc.name.slice(0, 32).padEnd(33)} fixed ${fixedHeld.survival.toFixed(1).padStart(5)}  solved ${solvedHeld.survival.toFixed(1).padStart(5)}  (${d >= 0 ? '+' : ''}${d.toFixed(1)})   median ${((solvedHeld.median - fixedHeld.median) / 1000 >= 0 ? '+' : '')}${Math.round((solvedHeld.median - fixedHeld.median) / 1000)}k   tax ${((solvedHeld.tax - fixedHeld.tax) / 1000 >= 0 ? '+' : '')}${Math.round((solvedHeld.tax - fixedHeld.tax) / 1000)}k   solve ${(r.meta.ms / 1000).toFixed(0)}s`);
  console.log(`      fixed winner: ${best.a.label}   (claimed ${best.s.survival.toFixed(1)} on its own search paths, scored ${fixedHeld.survival.toFixed(1)} on held-out)`);
}

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const ds = rows.map(r => r.d);
const eps = E.RATE_EPSILON_PTS;
console.log(`\n${rows.length} households in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(`solved minus fixed: mean ${mean(ds).toFixed(2)} pts, median ${med(ds).toFixed(2)}, best +${Math.max(...ds).toFixed(1)}, worst ${Math.min(...ds).toFixed(1)}`);
console.log(`wins ${ds.filter(x => x > eps).length}, ties ${ds.filter(x => Math.abs(x) <= eps).length}, losses ${ds.filter(x => x < -eps).length}  (tie threshold ${eps} pts)`);
console.log(`median terminal pot: ${mean(rows.map(r => r.solved.median - r.fixed.median)) >= 0 ? '+' : ''}£${Math.round(mean(rows.map(r => r.solved.median - r.fixed.median)) / 1000)}k mean`);
console.log(`lifetime tax:        ${mean(rows.map(r => r.solved.tax - r.fixed.tax)) >= 0 ? '+' : ''}£${Math.round(mean(rows.map(r => r.solved.tax - r.fixed.tax)) / 1000)}k mean`);
console.log(`the fixed arm's winner's curse (claimed on its search paths minus held-out): ${mean(rows.map(r => r.curse)).toFixed(2)} pts`);
console.log(`\nIn-model only. It cannot pass a gate; it can only say whether there is anything here to take to the engine.`);
