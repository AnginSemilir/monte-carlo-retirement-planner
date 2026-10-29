/*
 * THE TIERS EACH ARM HOLDS, A QUICK LOOK (EXPLORATORY; SPENDING-CURVE.md section 6): the equity share of the pension and ISA
 * that each arm's policy holds, on one household at the light settings (8 wealth points, the light lattice), on 300 paths of
 * seed 7002. These are not the units' settings: it shows the mechanism, and its figures are not results.
 * Each arm is built as curve-audit3.mjs builds it, but for the lattice, on arm A's pick kept beside the units (aPol.json).
 *   node tier-read.mjs <household> <arm,arm,...> <unit dir>        (from the root of the failure-year code, curve2-wt)
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js'), C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const { solverPlanOf, LAMBDA } = await imp('research/solver/audit-phase4.mjs');
const [id, list, dir] = process.argv.slice(2);
const h = readPanel().find(x => x.id === id);
if (!h || !list || !dir) { console.error('usage: tier-read.mjs <household> <arm,arm,...> <unit dir>'); process.exit(2); }
const A0 = JSON.parse(readFileSync(resolve(dir, `${id}-aPol.json`), 'utf8'));
const W = 0.02, PHI = 0.25, MORT = { mode: 90, disp: 9 }, FD_ARMS = ['CANDD', 'HYBD', 'HYB10D', 'UTIL3D', 'UTIL5D'], GAMMA_OF = { UTIL3D: 3, UTIL5D: 5 };
const LIGHT = { points: 8, adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: A0.decumulationPolicy })), c0 = E.buildContext(plan);
const scale = Math.max(1, c0.accounts.reduce((x, a) => x + a.balance, 0)), target = c0.targetSpend;
console.log(`${id}: the pension and ISA's equity share each arm holds (light settings, 300 paths of seed 7002; a quick look, not a result)`);
for (const arm of list.split(',')) {
  const GAMMA = GAMMA_OF[arm] || 2;
  const FLOOR_U = GAMMA === 2 ? 1 / 0.8 - 1 : (Math.pow(0.8, 1 - GAMMA) - 1) / (GAMMA - 1), KCONV = FLOOR_U / (LAMBDA * 0.04);
  const hyb = arm.startsWith('HYB'), kappa = arm === 'HYB10D' ? 10 / KCONV : hyb ? 1 / KCONV : 1;
  const SU = { gamma: GAMMA, kappa, beta: 1, mortality: arm !== 'UTILNM' && (arm.startsWith('UTIL') || hyb) ? MORT : null, ruinMin: 0.1 };
  const extra = { lambda: LAMBDA, ...LIGHT, bequestWeight: W,
    ...(arm === 'ZERO' ? { failureShortfall: 'zero' } : {}), ...(arm === 'FLAT' ? { raiseWeight: 0 } : {}),
    ...(arm.startsWith('UTIL') || hyb ? { spendUtility: SU, bequestWeight: PHI * SU.kappa * scale / target } : {}),
    ...(arm.startsWith('UTIL') || arm === 'HYB10D' ? { switchCharge: C.CANDIDATE_OPTS.switchCharge * kappa * KCONV } : {}),
    ...(FD_ARMS.includes(arm) ? { failDelivered: true } : {}) };
  const r = C.solveCandidate(E, M, plan, extra), T = r.m.ctx.totalYears, paths = E.pathsForSeed(7002, 300, T);
  let surv = 0; const eq = new Float64Array(T + 1), n = new Float64Array(T + 1);
  for (const z of paths) {
    const o = S.runPolicy(r, Float64Array.from(z), { visit: (t, s, held) => { const e = r.c.tiers.pen[held.pen].equity * s[0] + r.c.tiers.isa[held.isa].equity * s[1], w = s[0] + s[1]; if (w > 0) { eq[t] += e / w; n[t]++; } } });
    surv += o.survived ? 1 : 0;
  }
  const at = t => (n[t] ? `${(100 * eq[t] / n[t]).toFixed(0)}%` : '-');
  console.log(`  ${arm.padEnd(7)} survival ${(100 * surv / 300).toFixed(1)}% on 300; equity at years 1, 5, 10, 20, 30: ${[1, 5, 10, 20, 30].map(at).join(', ')}`);
}
