/*
 * EZ'S CALIBRATION (EXPLORATORY; EZ.md section 6): gamma chosen so that the retirees' first retired year's move holds the
 * candidate's equity share in the pension and ISA (24.6% over the four retirees in the levers units, read as the run reads
 * it: the tiers of the first year's move). Only the opening decision is read, so no path is run and no survival is seen
 * before the run's prediction is written. For each household and gamma: EZ solved as ez-run.mjs solves it (the candidate's
 * settings at its points, the estate weight 0.02, rho as given, the layer loop), then the chooser's move at the plan's
 * opening, holding the plan's own tiers: its spending level, its tiers and their equity share at the opening's pension and ISA.
 *   node ez-calib.mjs <levers unit dir> --rho R --gammas G1,G2,... <id>...      (from the root of the patched code)
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs'), S = await imp('src/solver/solve.js'), G = await imp('src/solver/grid.js');
const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA, CAND_PTS } = await imp('research/solver/audit-phase4.mjs');
const argv = process.argv.slice(2), flag = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const RHO = Number(flag('--rho')), GAMMAS = (flag('--gammas') || '').split(',').map(Number).filter(x => x > 0);
const pos = argv.filter((x, i) => !x.startsWith('--') && !['--rho', '--gammas'].includes(argv[i - 1]));
const [dir, ...ids] = pos;
if (!dir || !ids.length || !(RHO > 0) || !GAMMAS.length) { console.error('usage: ez-calib.mjs <levers unit dir> --rho R --gammas G1,G2,... <id>...'); process.exit(2); }
const P = Object.fromEntries(readPanel().map(x => [x.id, x]));
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
console.log(`EZ's calibration (EXPLORATORY): the opening move, rho ${RHO}, gamma ${GAMMAS.join(', ')}; the candidate's settings at ${CAND_PTS} points`);
for (const id of ids) {
  const pk = JSON.parse(readFileSync(join(dir, `${id}-pick-app.json`), 'utf8'));
  if (armA(appPlan(P[id].plan), { tournament: false }).planState.spending.decumulationPolicy !== pk.decumulationPolicy) throw new Error(`${id}: APP's pick differs from the unit's`);
  const plan = prep(solverPlanOf(P[id].plan, { decumulationPolicy: pk.decumulationPolicy }));
  const cand = JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-cand.json.gz`))));
  const candEq = cand.tierYears && cand.tierYears[cand.retireT + 1];
  for (const gamma of GAMMAS) {
    const t0 = Date.now();
    const r = C.solveCandidate(E, M, structuredClone(plan), { lambda: LAMBDA, points: CAND_PTS, bequestWeight: 0.02, tsOnce: false, ez: { gamma, rho: RHO } });
    if (!r.meta.ez || r.meta.ez.gamma !== gamma || r.meta.ez.rho !== RHO) throw new Error(`${id}: EZ not as asked`);
    const s0 = G.vecOf(r.m, M.initialState(r.m)), held = { pen: 0, isa: 0, gia: 0 };
    const ai = S.chooseAction(r, Float64Array.from(s0), 0, held), a = r.c.acts[ai];
    const w = s0[0] + s0[1], eq = w > 0 ? (r.c.tiers.pen[a.tierPen].equity * s0[0] + r.c.tiers.isa[a.tierIsa].equity * s0[1]) / w : NaN;
    const v = r.value(Float64Array.from(s0), 0);
    console.log(`  ${id.padEnd(6)} gamma ${String(gamma).padEnd(4)} the opening move ${r.actions[ai].label || ai}: level ${r.levelOf[ai]}, tiers ${a.tierPen}/${a.tierIsa} (${r.c.tiers.pen[a.tierPen].name} / ${r.c.tiers.isa[a.tierIsa].name}), equity ${(100 * eq).toFixed(1)}% (CAND's first retired year ${candEq === null || candEq === undefined ? '-' : (100 * candEq).toFixed(1)}%); the table's value at the opening ${v.resilience.toPrecision(5)}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
