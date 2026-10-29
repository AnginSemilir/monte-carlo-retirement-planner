/*
 * THE SPENDING CURVE'S ARMS (EXPLORATORY, seed 7002; research/reviews/2026-10-29/SPENDING-CURVE.md). The tier test's harness
 * (research/solver/audit-tiers.mjs) with arms for the objective's spending side, on households of Phase 4's panel
 * (phase4-panel.json: the plans, the landed targets, the minimum pot, arm A's pick), each unit executed by the engine on the
 * same paths of the seed with Phase 4's runPath, held to E.runTrial on the first CHECK paths, runPolicy beside the engine on
 * the first BESIDE. The arms:
 *   APP     arm A, the app's rules, as Phase 4 ran it (guardrails on);
 *   CAND    the candidate (fcd8096217b7) at 45 points, estate weight 0.02;
 *   ZERO    CAND with a year of ruin priced as a cut to nothing (failureShortfall 'zero', the option the code keeps);
 *   FLAT    CAND with no raises on the menu (raiseWeight 0: the raise credit and the 110% level gone);
 *   UTIL    CAND's solver with the spending-utility objective (solve.js spendUtility, the review's patch): u the CRRA curve at
 *           gamma 2 on the spend level, each year weighted by a Gompertz chance of being alive (mode 90, dispersion 9: the
 *           ONS 2024-based cohort life expectancy at 65, about 21.7 years) and no further time preference, ruin lived on the
 *           guaranteed income (at least 10% of target) on the same curve, the estate a quarter of a pound spent at target
 *           (bequestWeight = 0.25 x the opening wealth / the target), the survival term kept at weight one;
 *   UTILNM  UTIL without the mortality weights;
 *   HYB     UTIL's curve, ruin price and mortality with survival still the currency: kappa set so a year at the floor costs
 *           what it costs the candidate (lambda x 0.2^2), the estate by the same exchange, the switch charge the candidate's.
 * UTIL and UTILNM price in their own units (a year at the floor 0.25); their switch charge is the candidate's 0.001 in those
 * units (x 0.25 / (lambda x 0.04)), so a tier change costs what it costs the candidate against a year at the floor.
 * arm A's pick is searched once a household and kept beside the units (aPol.json), as audit-tiers.mjs searches it per unit.
 *   node curve-audit.mjs <paths> <unit dir> <id> <arm>        (from the root of the code under test)
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { gzipSync } from 'zlib';
import { cpus } from 'os';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS, CANDIDATE } = await imp('research/solver/audit-phase4.mjs');
const { withTable } = await imp('src/solver/bridge.js');

export const ARMS = ['APP', 'CAND', 'ZERO', 'FLAT', 'UTIL', 'UTILNM', 'HYB'];
export const SEED = 7002, W = 0.02, CHECK = 100, BESIDE = 500, PHI = 0.25;
export const MORT = { mode: 90, disp: 9 };
const [nArg, OUT, id, arm] = process.argv.slice(2);
const N = Number(nArg);
if (!(N >= 1) || !OUT || !id || !ARMS.includes(arm)) { console.error('usage: curve-audit.mjs <paths> <unit dir> <id> <arm>'); process.exit(2); }
if (C.CANDIDATE_HASH !== CANDIDATE) { console.error(`curve-audit: the candidate is ${C.CANDIDATE_HASH}, not ${CANDIDATE}`); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const codeHash = (() => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/engine.mjs')); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); })();
const PANEL = Object.fromEntries(readPanel().map(h => [h.id, h])), h = PANEL[id];
if (!h) { console.error(`curve-audit: ${id} is not in Phase 4's panel`); process.exit(2); }
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));

// arm A's pick, searched once a household (select-phase4.mjs armA without the tournament, as Phase 4 and the tier test)
const aFile = join(OUT, `${id}-aPol.json`);
let A0 = existsSync(aFile) ? JSON.parse(readFileSync(aFile, 'utf8')) : null;
let aPlan = null;
if (!A0 || arm === 'APP') {
  const a = armA(appPlan(h.plan), { tournament: false });
  if (a.label !== h.label) { console.error(`curve-audit: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
  A0 = { label: a.label, decumulationPolicy: a.planState.spending.decumulationPolicy };
  writeFileSync(aFile, JSON.stringify(A0));
  aPlan = a.planState;
}
const t0 = Date.now();
let ctx, r = null, solveSecs = 0, ran;
if (arm === 'APP') {
  ctx = E.buildContext(E.resolveMpaa(aPlan));
  ran = { arm, label: A0.label, guardrails: !!ctx.guardrails, minPot: ctx.solvencyFloor };
} else {
  const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: A0.decumulationPolicy })), c0 = E.buildContext(plan);
  const scale = Math.max(1, c0.accounts.reduce((x, a) => x + a.balance, 0)), target = c0.targetSpend;
  // the exchange between the candidate's units and the utility curve's: a year at the floor, lambda (1 - 0.8)^2 against u(1) - u(0.8)
  const FLOOR_U = 1 - 1 / 0.8, FLOOR_C = LAMBDA * 0.04, KCONV = FLOOR_U / FLOOR_C;
  const kappa = arm === 'HYB' ? 1 / KCONV : 1;
  const SU = { gamma: 2, kappa, beta: 1, mortality: arm === 'UTIL' || arm === 'HYB' ? MORT : null, ruinMin: 0.1 };
  const extra = { lambda: LAMBDA, points: Number(process.env.CURVE_PTS) || CAND_PTS, bequestWeight: W,
    ...(arm === 'ZERO' ? { failureShortfall: 'zero' } : {}),
    ...(arm === 'FLAT' ? { raiseWeight: 0 } : {}),
    ...(arm.startsWith('UTIL') || arm === 'HYB' ? { spendUtility: SU, bequestWeight: PHI * SU.kappa * scale / target } : {}),
    ...(arm.startsWith('UTIL') ? { switchCharge: C.CANDIDATE_OPTS.switchCharge * KCONV } : {}) };
  r = C.solveCandidate(E, M, plan, extra);
  solveSecs = (Date.now() - t0) / 1000;
  const levels = [...new Set(r.levelOf)].sort((x, y) => x - y);
  // what each arm must have run
  const bad = [];
  if (arm === 'ZERO' && r.failureShortfall !== 'zero') bad.push(`failureShortfall ${r.failureShortfall}`);
  if (arm === 'FLAT' && levels.some(l => l > 1)) bad.push(`levels above the target: ${levels}`);
  if (arm !== 'FLAT' && !levels.some(l => l > 1)) bad.push(`no raise on the menu: ${levels}`);
  const uArm = arm.startsWith('UTIL') || arm === 'HYB';
  if (uArm && !(r.meta.spendUtility && (arm !== 'UTILNM') === !!r.meta.spendUtility.mortality && Math.abs(r.meta.spendUtility.kappa - kappa) < 1e-12)) bad.push(`spendUtility ${JSON.stringify(r.meta.spendUtility)}`);
  if (!uArm && r.meta.spendUtility) bad.push('spendUtility set');
  if (Math.abs(r.switchCharge - (arm.startsWith('UTIL') ? C.CANDIDATE_OPTS.switchCharge * KCONV : C.CANDIDATE_OPTS.switchCharge)) > 1e-12) bad.push(`switchCharge ${r.switchCharge}`);
  if (!r.meta.tierState) bad.push('no tier state');
  if (bad.length) { console.error(`curve-audit: ${id} ${arm}: ${bad.join('; ')}`); process.exit(3); }
  ctx = E.buildContext(withTable(r.m.ctx.plan, r));
  ran = { arm, pts: r.g.np, actions: r.actions.length, levels, lambda: r.lambda, raiseWeight: r.meta.raiseWeight, failureShortfall: r.failureShortfall, raiseSurvival: r.raiseSurvival,
    bequestWeight: +Number(r.meta.bequestWeight).toPrecision(10), spendUtility: r.meta.spendUtility || null, switchCharge: r.switchCharge, tierState: r.meta.tierState, minPot: E.num(r.m.ctx.solvencyFloor, 0) };
}
const T = ctx.totalYears, Y = T + 1, self = ctx.owners.find(o => o.key === 'self');
const retireT = Math.max(0, Math.min(Y, self.retireAge - ctx.ageSelf0)), accessT = Math.max(0, ctx.nmpa - ctx.ageSelf0);
const paths = E.pathsForSeed(SEED, N, T);
const out = { survived: new Uint8Array(N), delivered: new Float32Array(N), unmet: new Float32Array(N), estate: new Float32Array(N), wealth: new Float32Array(N), failYear: new Int16Array(N), level: new Uint8Array(N * Y) };
let badCheck = 0;
const e0 = Date.now();
paths.forEach((zs0, k) => {
  const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
  out.survived[k] = o.survived ? 1 : 0; out.delivered[k] = o.delivered; out.unmet[k] = o.unmet; out.estate[k] = o.estate; out.wealth[k] = o.wealth; out.failYear[k] = o.failYear; out.level.set(o.level, k * Y);
  if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.unmetTotal !== o.unmet) badCheck++; }
});
if (badCheck) { console.error(`curve-audit: ${id} ${arm}: runPath differs from E.runTrial on ${badCheck} of the first ${CHECK} paths`); process.exit(3); }
const engineSecs = (Date.now() - e0) / 1000;
let beside = null;
if (r) {
  const NB = Math.min(N, BESIDE);
  let engineOnly = 0, policyOnly = 0;
  for (let k = 0; k < NB; k++) { const p = S.runPolicy(r, Float64Array.from(paths[k])).survived ? 1 : 0; if (out.survived[k] && !p) engineOnly++; if (p && !out.survived[k]) policyOnly++; }
  beside = { N: NB, engineOnly, policyOnly };
}
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const surv = 100 * out.survived.reduce((a, x) => a + x, 0) / N;
writeFileSync(join(OUT, `${id}-${arm.toLowerCase()}.json.gz`), gzipSync(JSON.stringify({ id, arm, cohort: h.cohort, target: ctx.targetSpend, inputs: inputsHash(ctx), retireT, accessT, ageSelf0: ctx.ageSelf0, Y, seed: SEED, N,
  code: codeHash, candidate: C.CANDIDATE_HASH, ran, solveSecs, engineSecs, cpu: cpus()[0].model, beside, main: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, b64(v)])) })));
console.log(`${id} ${arm}: survival ${surv.toFixed(2)}% on ${N}; solve ${Math.round(solveSecs)} s, engine ${Math.round(engineSecs)} s${beside ? `; beside: the engine alone ${beside.engineOnly}, runPolicy alone ${beside.policyOnly} of ${beside.N}` : ''}; code ${codeHash}`);
