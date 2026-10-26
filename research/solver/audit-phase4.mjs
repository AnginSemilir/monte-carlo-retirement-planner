/*
 * PHASE 4: THE CANDIDATE AGAINST THE APP'S RULES, AND AGAINST THE SHIPPING SOLVER, ONCE, ON SEED 7003, SCORED BY THE ENGINE
 * (registrations/phase-4.md; phase4-panel.mjs, phase4-panel.json; STATE.md D33 to D35, D34 the harm rule).
 * Per household of the panel, its plan (phase4-panel.mjs planOf: the landed target, the floor at 80%, the minimum pot written
 * in, the candidate's return assumptions on every arm), and per unit:
 *   APP      arm A, the app's rules: its policy search then its tournament (searched on seed 7001), guardrails on, the
 *            lookahead at 5 years, raises capped at 110% (phase4-panel.mjs appPlan, select-phase4.mjs armA);
 *   CAND/W   the candidate (fcd8096217b7) at 45 wealth points (D26) and the estate weight W, its table executed by the engine;
 *            at W 0.02, on a household with retired years before pension access, also FIXBR (7q, D35): the same table, but in
 *            each of those years the engine takes arm A's withdrawal policy at the household's own tiers and its target;
 *   SHIP/W   the product's settings (PRODUCT_BASELINE) at 30 points and the weight W, executed by the engine.
 * The plan each solver arm solves is the household's with guardrails and the lookahead off (a table chooses the spend and the
 * draw itself); the engine runs every arm on the plan its solver solved, or arm A's own. Each is run on:
 *   - N paths of the seed (the household's registered paths, phase4-paths.json; the pilot's own count): every path's survival,
 *     estate (net, as the engine nets it), wealth at the end, spending delivered over every year (what was spent less what
 *     could not be met), unmet spending, lifetime tax, the year it failed, and each year's spend as a share of the year's
 *     target (the whole score's inputs);
 *   - REPL paths of seed 7018 (the replication, D35), the same arrays; FIXBR on the first FIXBR_PATHS paths of the seed;
 *   - on APP and CAND/0.02: the three perturbed worlds on the first ROB paths of the seed (returns a point lower on every
 *     tier; each year's shock a quarter larger; a negative shock 30% larger: experiment.mjs worldOf's three), and every
 *     historical start year from 1928 to 1995 (the engine's real returns, its expected return after 2025): survival only.
 * Every path is the engine's own stepYear, year by year (runPath), held to E.runTrial on the first CHECK paths of every run
 * (survival, net estate, unmet spending and tax the same). Each unit's arrays go to results/diagp4 (P4_OUT), stamped with the
 * code, this file, the panel, the paths file, the registration and the Node version.
 *   node research/solver/audit-phase4.mjs registered part k/n         the registered run (seed 7003, each household's paths)
 *   node research/solver/audit-phase4.mjs <paths> part k/n <seed>     the pilot (P4_PILOT=1: no replication, worlds or history)
 *   node research/solver/audit-phase4.mjs --units                     the unit count
 *   P4_ONLY=<id>,<id> limits the households, P4_W=<w> the estate weight, P4_ARMS=<arm>,<arm> the arms, P4_PTS the solves'
 *   wealth points, P4_PANEL another panel file and P4_REPL, P4_ROB the replication's and the worlds' paths (the pilot and
 *   smoke tests only: the registered run refuses or ignores them)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { withTable, tablePolicy } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan, CANDIDATE_HASH } from './candidate.mjs';
import { readPanel, appPlan, PANEL_FILE } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { ctxProblem, planHash } from './audit-7uf-checks.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: CAND solves through solveCandidate (the pin checked there); solvePlan here is SHIP's, the product's settings

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7003, REPL_SEED = 7018, PILOT_SEED = 7002, CAND_PTS = 45, SHIP_PTS = 30, LAMBDA = 0.0223606797749979;
export const WEIGHTS = ['0.02', '0.01'], REPL_PATHS = 4000, ROB_PATHS = 2000, FIXBR_PATHS = 8000, CHECK = 200, HIST = [1928, 1995];
export const WORLDS = ['return-1', 'vol+25', 'left-tail'], CANDIDATE = 'fcd8096217b7';
export const PATHS_FILE = join(HERE, 'phase4-paths.json');
/* the units, the longest first: CAND at both weights, then SHIP, then APP */
export const unitsOf = ids => [...ids.flatMap(id => WEIGHTS.map(w => [id, 'CAND', w])), ...ids.flatMap(id => WEIGHTS.map(w => [id, 'SHIP', w])), ...ids.map(id => [id, 'APP', '-'])];
export const fileOf = (id, arm, w) => `${id}-${arm.toLowerCase()}-w${w}.json.gz`;

/* the engine's year, path by path, with what the reducer needs kept (E.runTrial's loop, its failure rule and its nets) */
export function runPath(ctx, zs, keep = true) {
  const state = E.freshState(ctx), T = ctx.totalYears, Y = T + 1, zPath = zs.length > Y ? zs[Y] : 0;
  const level = keep ? new Uint8Array(Y) : null;
  let failed = false, failYear = -1, unmet = 0, tax = 0, delivered = 0, last = null;
  for (let t = 0; t <= T; t++) {
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    tax += row.taxPaid + (row.cgtPaid || 0);
    const u = Math.max(0, row.unmetDemand || 0); unmet += u;
    if (row.targetSpend > 0) { delivered += Math.max(0, row.targetSpend - u); if (keep) { const sched = E.spendTargetAtAge(ctx, row.ageSelf); level[t] = sched > 0 ? Math.min(255, Math.round(100 * row.targetSpend / sched)) : 0; } }
    if (!failed && (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent)) { failed = true; failYear = t; }
    last = row;
  }
  const wealth = Math.max(0, last.totalCombined);
  if (!failed && ctx.solvencyFloor > 0 && wealth < ctx.solvencyFloor) { failed = true; failYear = T; }
  const estate = Math.max(0, wealth - Math.max(0, last.pensions) * ctx.pensionDeathTaxRate);
  return { survived: !failed, failYear, wealth, estate, unmet, tax, delivered, level };
}
/* survival on a historical sequence (E.simulateHistorical, the same failure rule) */
export function historicalSurvives(ctx, startYear) {
  const rows = E.simulateHistorical(ctx, startYear);
  let failed = false;
  for (const row of rows) if (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent) { failed = true; break; }
  const last = rows[rows.length - 1];
  return !failed && !(ctx.solvencyFloor > 0 && Math.max(0, last.totalCombined) < ctx.solvencyFloor);
}
/* the perturbed worlds: the plan's returns a point lower, or each year's shock transformed (the path's own shift kept) */
export const perturbPlan = (plan, world) => (world !== 'return-1' ? plan : { ...plan, riskProfiles: Object.fromEntries(Object.entries(plan.riskProfiles).map(([k, p]) => [k, { ...p, real: E.num(p.real, 0) - 1 }])) });
export function perturbPath(zs, Y, world) {
  if (world === 'return-1') return zs;
  const out = Float64Array.from(zs);
  for (let t = 0; t < Y; t++) out[t] = world === 'vol+25' ? 1.25 * zs[t] : zs[t] < 0 ? 1.3 * zs[t] : zs[t];
  return out;
}
/* 7q's arm (D35): the table, but in each retired year before pension access arm A's withdrawal policy at the own tiers */
export function fixedBridgePolicy(r, fixedCtx) {
  const base = tablePolicy(r), c = r.c, self = fixedCtx.owners.find(o => o.key === 'self'), years = new Set();
  for (let t = 0; t <= fixedCtx.totalYears; t++) { const age = fixedCtx.ageSelf0 + t; if (age >= self.retireAge && age < fixedCtx.nmpa) years.add(t); }
  const fixed = { steps: fixedCtx.policySteps, costSteps: fixedCtx.costSteps, harvest: !!fixedCtx.harvestPA, harvestCeil: fixedCtx.harvestCeiling, lump: !!fixedCtx.fullLumpSum,
    sweepCash: false, spendLevel: 1, tierPen: 0, tierIsa: 0, index: -1, code: 'fixed', tierPenName: c.tiers.pen[0].name, tierIsaName: c.tiers.isa[0].name };
  return { policy: { ...base, choose: (s, t, held) => (years.has(t) ? fixed : base.choose(s, t, held)) }, years: [...years] };
}
export const retiredBridgeYears = ctx => { const self = ctx.owners.find(o => o.key === 'self'); let n = 0; for (let t = 0; t <= ctx.totalYears; t++) { const a = ctx.ageSelf0 + t; if (a >= self.retireAge && a < ctx.nmpa) n++; } return n; };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const PANEL = readPanel(), byId = Object.fromEntries(PANEL.map(h => [h.id, h]));
  const ONLY = process.env.P4_ONLY ? new Set(process.env.P4_ONLY.split(',')) : null, ONLY_W = process.env.P4_W || null, ONLY_ARMS = process.env.P4_ARMS ? new Set(process.env.P4_ARMS.split(',')) : null;
  const UNITS = unitsOf(PANEL.map(h => h.id)).filter(([id, arm, w]) => (!ONLY || ONLY.has(id)) && (!ONLY_ARMS || ONLY_ARMS.has(arm)) && (!ONLY_W || w === '-' || w === ONLY_W));
  if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
  const REGISTERED = process.argv[2] === 'registered', PILOT = process.env.P4_PILOT === '1';
  const part = process.argv[3] === 'part' ? process.argv[4] : '0/1', [pk, pn] = part.split('/').map(Number);
  const SEED_RUN = REGISTERED ? SEED : Number(process.argv[5] || PILOT_SEED);
  if (REGISTERED && (PILOT || ONLY || ONLY_W || ONLY_ARMS || process.env.P4_PANEL || process.env.P4_PTS)) { console.error('audit-phase4: the registered run takes no P4_PILOT, P4_ONLY, P4_W, P4_ARMS, P4_PANEL or P4_PTS'); process.exit(2); }
  if (!REGISTERED && SEED_RUN === SEED) { console.error('audit-phase4: seed 7003 runs only as the registered run'); process.exit(2); }
  const PATHS = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')).paths : null;
  const nOf = id => (REGISTERED ? PATHS[id] : Number(process.argv[2]));
  if (!(pn >= 1 && pk >= 0 && pk < pn) || UNITS.some(([id]) => !(nOf(id) >= 1))) { console.error(`audit-phase4: bad paths or part (${process.argv.slice(2, 6).join(' ')})`); process.exit(2); }
  if (CANDIDATE_HASH !== CANDIDATE) { console.error(`audit-phase4: the candidate is ${CANDIDATE_HASH}, not Phase 4's ${CANDIDATE}`); process.exit(2); }
  const small = k => (REGISTERED || process.env[k] === undefined ? null : Number(process.env[k]));   // a smoke test's counts (P4_REPL, P4_ROB)
  const NR = PILOT ? 0 : small('P4_REPL') ?? REPL_PATHS, NROB = PILOT ? 0 : small('P4_ROB') ?? ROB_PATHS, HISTY = PILOT ? [] : Array.from({ length: HIST[1] - HIST[0] + 1 }, (_, i) => HIST[0] + i);
  const OUT = process.env.P4_OUT || join(HERE, 'results', REGISTERED ? 'diagp4' : 'p4-pilot');
  mkdirSync(OUT, { recursive: true });

  const STAMP = (() => {
    const h = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).update(readFileSync(join(HERE, 'phase4-panel.mjs'))).update(readFileSync(PANEL_FILE));
    if (existsSync(PATHS_FILE)) h.update(readFileSync(PATHS_FILE));
    const cid = codeId();
    return { code: cid ? cid.hash : 'unknown', audit: h.digest('hex').slice(0, 12), candidate: CANDIDATE_HASH, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  })();
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  console.log(`candidate: ${STAMP.candidate} node ${STAMP.node}`);
  console.log(`PHASE 4${REGISTERED ? '' : PILOT ? ' (THE PILOT)' : ' (A PREFLIGHT)'}: APP (the app's rules), CAND (${CANDIDATE_HASH}, ${CAND_PTS} points) and SHIP (the product's settings, ${SHIP_PTS} points) at the estate weights ${WEIGHTS.join(' and ')}, FIXBR beside CAND/0.02; seed ${SEED_RUN}${NR ? `, the replication ${NR} paths of ${REPL_SEED}` : ''}${NROB ? `, the worlds on ${NROB}, history ${HIST.join(' to ')}` : ''}; ${UNITS.length} units; part ${part}`);

  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  /* run a context on paths, keeping the arrays; the first CHECK paths held to E.runTrial */
  function runAll(ctx, paths, Y, label) {
    const n = paths.length, A = { survived: new Uint8Array(n), estate: new Float32Array(n), wealth: new Float32Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), tax: new Float32Array(n), failYear: new Int16Array(n), level: new Uint8Array(n * Y) };
    let bad = 0;
    paths.forEach((zs0, k) => {
      const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
      A.survived[k] = o.survived ? 1 : 0; A.estate[k] = o.estate; A.wealth[k] = o.wealth; A.delivered[k] = o.delivered; A.unmet[k] = o.unmet; A.tax[k] = o.tax; A.failYear[k] = o.failYear; A.level.set(o.level, k * Y);
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-phase4: ${label}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    return A;
  }
  const pack = A => Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)]));
  const surv = A => (100 * A.survived.reduce((a, x) => a + x, 0) / A.survived.length);
  const settingsOf = r => `pts ${r.g.np} grid ${String(r.meta.points).replace(/ /g, '')} mix ${r.meta.mixture} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} levels ${r.meta.spendLevels.join(',')} bridgeRead ${r.meta.bridgeRead} readerRef ${r.meta.readerRef} readerSplit ${String(r.meta.readerSplit)} tierState ${r.meta.tierState} tiersBelow ${r.meta.tiersBelow} tableDealing ${r.meta.tableDealing} tsOnce ${r.meta.tsOnce} switchCharge ${r.switchCharge || 0} switchMargin ${r.switchMargin} e3 ${!!r.meta.e3} pclsInterp ${r.g.pclsInterp} finalIntegral ${r.meta.finalIntegral === true} bridgeStep ${r.meta.bridgeStep} raiseW ${r.meta.raiseWeight} actions ${r.actions.length} minPot ${E.num(r.m.ctx.solvencyFloor, 0)} plan ${planHash(r.m.ctx)}`;
  const WANT = {
    CAND: { pts: String(CAND_PTS), bridgeRead: 'reader', readerRef: 'adaptive', readerSplit: 'rs', tiersBelow: '3', tableDealing: 'false', switchCharge: '0.001', switchMargin: '0', e3: 'true', pclsInterp: 'true', bridgeStep: 'exact', lambda: String(LAMBDA) },
    SHIP: { pts: String(SHIP_PTS), bridgeRead: 'false', tierState: 'null', tiersBelow: '2', tableDealing: 'true', e3: 'false', lambda: String(LAMBDA) }
  };
  const wantProblems = (arm, line, W) => { const got = Object.fromEntries(line.match(/(\S+) (\S+)/g).map(x => x.split(' '))); const bad = Object.entries(WANT[arm]).filter(([k, v]) => got[k] !== v).map(([k, v]) => `${k} ${got[k]} (want ${v})`); if (Number(got.bequestWeight) !== W) bad.push(`bequestWeight ${got.bequestWeight} (want ${W})`); return bad; };

  UNITS.forEach(([id, arm, w], i) => {
    if (i % pn !== pk) return;
    const h = byId[id], N = nOf(id), L = `${arm}${w === '-' ? '' : `/W${w}`}`, base = h.plan, t0 = Date.now();
    console.log(`${id.padEnd(8)} case | unit ${L} | cohort ${h.cohort} target ${h.target} paths ${N}`);
    // arm A runs on every unit: APP's own plan, and FIXBR's policy on CAND/0.02 (deterministic: its search seed is fixed)
    const a = armA(appPlan(base)), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy, harvest: !!a.planState.config.harvestPersonalAllowance };
    if (a.label !== h.label) { console.error(`audit-phase4: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
    let ctx, r = null, solveSecs = 0, ran;
    if (arm === 'APP') {
      ctx = E.buildContext(E.resolveMpaa(a.planState));
      const reals = ctx.accounts.map(x => `${x.risk}:${(100 * x.real).toFixed(4)}`).join(','), want = ctx.accounts.map(x => `${x.risk}:${E.num(base.riskProfiles[x.risk].real, 0).toFixed(4)}`).join(',');
      if (reals !== want) { console.error(`audit-phase4: ${id} APP: its returns ${reals}, not the candidate's ${want}`); process.exit(3); }
      if (!ctx.guardrails || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0)) { console.error(`audit-phase4: ${id} APP: guardrails ${ctx.guardrails}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}`); process.exit(3); }
      ran = `arm A ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} lookahead ${ctx.lookaheadYears} raiseCap ${ctx.raiseCapFrac} minPot ${ctx.solvencyFloor} target ${ctx.targetSpend} floor ${base.spending.floorSpend}`;
    } else {
      const W = Number(w), plan = prep(base), opts = { lambda: LAMBDA, points: Number(process.env.P4_PTS) || (arm === 'CAND' ? CAND_PTS : SHIP_PTS), bequestWeight: W };
      r = arm === 'CAND' ? solveCandidate(E, M, plan, opts) : solvePlan(E, M, candidatePlan(E, plan), opts);
      solveSecs = (Date.now() - t0) / 1000;
      ran = settingsOf(r);
      const bad = wantProblems(arm, ran, W).filter(x => !(process.env.P4_PTS && /^pts /.test(x)));
      if (bad.length) { console.error(`audit-phase4: ${id} ${L}: ${bad.join('; ')}`); process.exit(3); }
      if (r.m.ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0)) { console.error(`audit-phase4: ${id} ${L}: the solver's minimum pot ${r.m.ctx.solvencyFloor}, not the panel's ${base.config.solvencyFloor}`); process.exit(3); }
      ctx = E.buildContext(withTable(r.m.ctx.plan, r));
      // the engine's context held to the solver's, but for the tier lists: under the third step (D28) the engine builds the
      // person's pension and ISA lists to the table's (tiersBelow 3), which the solver's own context (built without the
      // table) does not; the engine's lists begin with the table's own, index for index (the tiers above follow in the
      // engine's list, unread by a table that has none: F2a)
      { const strip = x => { const { tierProfiles, ...rest } = x; return rest; }, cp = ctxProblem(strip(ctx), strip(r.m.ctx));
        const tp = ['pen', 'isa'].filter(k => r.c.tiers[k] && ctx.tierProfiles[`${k}_self`] && r.c.tiers[k].some((p, j) => !ctx.tierProfiles[`${k}_self`][j] || ctx.tierProfiles[`${k}_self`][j].name !== p.name));
        if (cp || tp.length) { console.error(`audit-phase4: ${id} ${L}: ${cp || `the engine's ${tp.join(' and ')} tiers do not begin with the table's`}`); process.exit(3); } }
    }
    const T = ctx.totalYears, Y = T + 1, bridge = retiredBridgeYears(ctx);
    console.log(`${''.padEnd(8)} ran ${L}: ${ran}${solveSecs ? ` | solve secs ${Math.round(solveSecs)}` : ''}`);
    const e0 = Date.now(), main = runAll(ctx, E.pathsForSeed(SEED_RUN, N, T), Y, `${id} ${L}`), eSecs = (Date.now() - e0) / 1000;
    const repl = NR ? runAll(ctx, E.pathsForSeed(REPL_SEED, NR, T), Y, `${id} ${L} replication`) : null;
    console.log(`${''.padEnd(8)} run ${L}: engine ${surv(main).toFixed(4)} on ${N}${repl ? `, replication ${surv(repl).toFixed(4)} on ${NR}` : ''}; engine secs ${Math.round(eSecs)} (${(1000 * eSecs / N).toFixed(1)} ms a path)`);
    // FIXBR beside CAND/0.02 on a household with retired years before access
    let fixbr = null;
    if (arm === 'CAND' && w === '0.02' && bridge > 0) {
      const tplan = r.m.ctx.plan, fplan = { ...tplan, spending: { ...tplan.spending, decumulationPolicy: aPol.decumulationPolicy, drawdownStrategy: aPol.drawdownStrategy }, config: { ...tplan.config, harvestPersonalAllowance: aPol.harvest, guardrails: false, lookaheadYears: 0 } };
      const fb = fixedBridgePolicy(r, E.buildContext(fplan)), fctx = E.buildContext({ ...tplan, config: { ...tplan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...tplan.spending, policyOverride: fb.policy } });
      const NF = Math.min(N, FIXBR_PATHS), fm = runAll(fctx, E.pathsForSeed(SEED_RUN, NF, T), Y, `${id} FIXBR`);
      fixbr = { years: fb.years, policy: aPol, N: NF, ...pack(fm) };
      console.log(`${''.padEnd(8)} fixbr ${L}: the fixed policy in years ${fb.years.join(',')} (${aPol.decumulationPolicy}, ${aPol.drawdownStrategy}${aPol.harvest ? ', harvesting' : ''}); engine ${surv(fm).toFixed(4)} on ${NF}`);
    }
    // the perturbed worlds and history, on APP and CAND/0.02
    const worlds = {}, hist = {};
    if ((arm === 'APP' || (arm === 'CAND' && w === '0.02')) && (NROB || HISTY.length)) {
      const planOf = world => (arm === 'APP' ? E.resolveMpaa(perturbPlan(a.planState, world)) : withTable(perturbPlan(r.m.ctx.plan, world), r));
      const rp = E.pathsForSeed(SEED_RUN, NROB, T);
      for (const world of WORLDS) {
        const wctx = E.buildContext(planOf(world)), bits = new Uint8Array(NROB);
        rp.forEach((zs, k) => { bits[k] = runPath(wctx, perturbPath(Float64Array.from(zs), Y, world), false).survived ? 1 : 0; });
        worlds[world] = b64(bits);
        console.log(`${''.padEnd(8)} world ${L} ${world}: engine ${(100 * bits.reduce((x, y) => x + y, 0) / NROB).toFixed(4)} on ${NROB}`);
      }
      const hb = new Uint8Array(HISTY.length); HISTY.forEach((y, k) => { hb[k] = historicalSurvives(ctx, y) ? 1 : 0; });
      hist.first = HISTY[0]; hist.bits = b64(hb);
      console.log(`${''.padEnd(8)} history ${L}: ${hb.reduce((x, y) => x + y, 0)} of ${HISTY.length} start years survive`);
    }
    const scale = Math.round(Math.max(1, (r ? r.m.ctx.accounts : ctx.accounts).reduce((t, x) => t + x.balance, 0)));
    writeFileSync(join(OUT, fileOf(id, arm, w)), gzipSync(JSON.stringify({ id, arm, w, cohort: h.cohort, target: h.target, stamp: STAMP, ran, seed: SEED_RUN, N, Y, bridge,
      solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, label: a.label,
      score: { lambda: LAMBDA, floor: r ? Math.min(...r.levelOf) : 0.8, scale, cap: r ? r.meta.bequestCap : null, death: ctx.pensionDeathTaxRate },
      main: pack(main), repl: repl ? { seed: REPL_SEED, N: NR, ...pack(repl) } : null, fixbr, worlds: Object.keys(worlds).length ? { N: NROB, ...worlds } : null, hist: hist.bits ? hist : null })));
    console.log(`${''.padEnd(8)} done ${L} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
