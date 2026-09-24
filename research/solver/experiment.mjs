/*
 * THE PHASE 2 EXPERIMENT: ONE DESIGN, FIXED BEFORE IT RUNS.
 *
 * Everything measured before this was exploratory, and two of its habits would have fooled us if they
 * had continued: households chosen because the solver had already won on them, and a bequest weight
 * given to one arm but not the other. This file is the corrective. Its design is set here and not
 * adjusted to the result.
 *
 * WHO IS TESTED. Every single-person household in the library whose FIXED-arm survival, measured on the
 * search paths, lies in a band where a decision can matter (default 70 to 98). Households near 100%
 * have nothing to win; households near 0 have nothing to save. The rule looks only at the fixed arm,
 * never at the solver, so it cannot favour it.
 *
 * WHAT IS COMPARED. Three plans per household, all scored on the SAME held-out paths, which none of
 * them saw while being chosen or solved:
 *
 *   solver   backward induction at the given grid, moves chosen each year from the value function at
 *            the true position
 *   same     the best of the solver's own twenty-four moves held fixed for life, so that against the
 *            solver the only thing that differs is whether the move may change with the position
 *   app      the best of the app's named policies with the harvest both ways and the sweep off, which
 *            is the app as it stands today
 *
 * HOW THE FIXED ARMS ARE CHOSEN. By the app's own picker, `explainPick`, with its default priority
 * list (survive, downside, bequest, bridge, pot, tax) and tolerances, run over each menu's stats on
 * the search paths. Not by survival alone, which was the earlier simplification.
 *
 * HOW A WINNER IS DECLARED. Twice. Once by that same picker, handed the solver's held-out stats and
 * the fixed arm's, so the app's own judgement decides each household. And once on survival alone,
 * with the paired standard error from the discordant paths, so a difference can be called noise or
 * not. Across households the aggregate is a sign test, which assumes nothing about the size of the
 * differences.
 *
 * WHAT IS REPORTED, for every plan: survival, pre-access failures, the unlucky tenth's pot (net),
 * the median pot (net), the mean pot (net), median lifetime tax, and the mean age at which failing
 * paths fail. The last two have never been reported before and were the missing half of the picture.
 *
 * SEEDS. Fresh: neither is the 4242 family that everything exploratory used. A replication on a
 * second pair is one flag away.
 *
 * Usage:
 *   node experiment.mjs select   [lo=70] [hi=98]                 list the households in the band
 *   ONLY=<i> node experiment.mjs run <tag> [points=20] [held=3000] [seedSearch=7001] [seedHeld=7002]
 *   ONLY=<i> node experiment.mjs perturb <baseTag> <return-1|vol+25|left-tail> [points=40] [held=3000]   (phase 2c.1)
 *   node experiment.mjs reduce <tag>                             aggregate one tag's results
 *
 * One process per household, on purpose: memory resets between them and every line lands as it is
 * made. `research/solver/results/` is where they go and it is not committed.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, solveFlex, solveMixture, runPolicy, chooseAction, buildActions } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { RECORD, STOREPOL, makeTrace, mark, markFail, writeRecord, polToB64 } from './record.mjs';
import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS = join(HERE, 'results');
const mode = process.argv[2] || 'select';

const SEARCH_PATHS = 200;
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));

/* The app's menu as it stands: named policies, harvest both ways, sweep off. */
function appMenu(m) {
  const out = [];
  for (const key of Object.keys(E.DECUMULATION_POLICIES)) {
    const pol = E.DECUMULATION_POLICIES[key];
    for (const harvest of pol.harvest ? [false, true] : [false]) {
      for (const ceil of harvest ? ['pa', 'basic'] : ['pa']) {
        out.push({ steps: pol.steps, costSteps: m.ctx.costSteps, harvest, harvestCeil: ceil, sweepCash: false, lump: m.ctx.fullLumpSum, contrib: null,
          label: `${key}${harvest ? ` + harvest to ${ceil === 'pa' ? 'allowance' : 'basic'}` : ''}` });
      }
    }
  }
  return out;
}

/*
 * THE WORLD the evaluation runs in (plan Phase 2c.1). Both arms were solved and chosen under the model
 * as fitted; the world can differ from it, and neither arm is told. `base` is the model's own returns.
 *   return-1   every pot's expected real return one point lower
 *   vol+25     every pot's volatility a quarter higher
 *   left-tail  bad years worse than a normal says: a negative draw is scaled by 1.3
 */
function worldOf(kind) {
  // `act` is the compiled move the year was run with: since phase 6 it carries the tiers held, and so the rates
  const R = (c, act) => (act ? act.real : c.real), V = (c, act, t) => (act ? act.volEffAt[t] : c.volEffAt[t]), S = (c, act) => (act ? act.sigma : c.sigma);
  if (!kind || kind === 'base') return (c, z, out, act, t, zp = 0) => { const r = R(c, act), v = V(c, act, t), sg = S(c, act); for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + r[i]) + sg[i] * zp + v[i] * z) - 1; return out; };
  if (kind === 'return-1') return (c, z, out, act, t, zp = 0) => { const r = R(c, act), v = V(c, act, t), sg = S(c, act); for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + r[i] - 0.01) + sg[i] * zp + v[i] * z) - 1; return out; };
  if (kind === 'vol+25') return (c, z, out, act, t, zp = 0) => { const r = R(c, act), v = V(c, act, t), sg = S(c, act); for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + r[i]) + sg[i] * zp + 1.25 * v[i] * z) - 1; return out; };
  if (kind === 'left-tail') return (c, z, out, act, t, zp = 0) => { const r = R(c, act), v = V(c, act, t), sg = S(c, act); const zz = z < 0 ? 1.3 * z : z; for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + r[i]) + sg[i] * zp + v[i] * zz) - 1; return out; };
  throw new Error(`unknown world ${kind}`);
}

/* Run one fixed move on one path in the fast flow. */
function runFixedPath(c, ai, zs, world = worldOf(), tr = null) {
  const m = c.m;
  const s = c.rule ? F.withRuleSlots(vecOf(m, M.initialState(m))) : vecOf(m, M.initialState(m));
  const real = new Float64Array(4);
  let tax = 0, spendYears = 0, atTarget = 0, aboveTarget = 0, belowSum = 0, aboveSum = 0, minLevel = 1, shortfall = 0, changes = 0, lastLevel = null, levelSum = 0;
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    const unmet = F.flow(c, t, ai, s);
    tax += c.last.taxPaid + c.last.cgtPaid;
    // the year's spend as a fraction of the plan's target: 1 for a fixed rule, the rails' multiplier with guardrails on
    if (c.yr.spend[t] > 0) {
      spendYears++; const lv = c.last.level; levelSum += lv;
      if (lv >= 1 - 1e-9) atTarget++; else belowSum += lv;
      if (lv > 1 + 1e-9) { aboveTarget++; aboveSum += lv; }
      if (lv < minLevel) minLevel = lv;
      shortfall += (1 - Math.min(1, lv)) * (1 - Math.min(1, lv));
      if (lastLevel !== null && Math.abs(lv - lastLevel) > 1e-6) changes++;
      lastLevel = lv;
    }
    if (unmet > 1 || c.last.preNmpaInsolvent) { if (tr) markFail(tr, t); return { survived: false, preAccess: !!c.last.preNmpaInsolvent, failAge: m.ctx.ageSelf0 + t, terminalNet: 0, terminal: 0, lifetimeTax: tax, spendYears, atTarget, aboveTarget, belowSum, aboveSum, minLevel: 0, shortfall, changes, levelSum, fullyFunded: false }; }
    world(c, zs[t], real, act, t, zs.length > m.ctx.totalYears + 1 ? zs[m.ctx.totalYears + 1] : 0);
    F.grow(c, t, s, real);
    if (tr) mark(tr, t, c.yr.spend[t] > 0, c.last.level, s, c.last.taxPaid + c.last.cgtPaid, 0);
  }
  const total = s[0] + s[1] + s[2];
  const spendStats = { spendYears, atTarget, aboveTarget, belowSum, aboveSum, minLevel, shortfall, changes, levelSum, fullyFunded: atTarget === spendYears };
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, preAccess: false, failAge: m.ctx.ageSelf0 + m.ctx.totalYears, terminalNet: 0, terminal: 0, lifetimeTax: tax, ...spendStats, fullyFunded: false };
  return { survived: true, preAccess: false, failAge: null, terminalNet: Math.max(0, total - s[0] * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax: tax, ...spendStats };
}

/* The reporting rule's figures (plan Part D), on top of the stats the app's picker reads. */
function statsFlex(rs) {
  const q = (arr, p) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const frac = rs.map(r => r.atTarget / Math.max(1, r.spendYears));
  return {
    ...statsOf(rs),
    floorRate: 100 * rs.filter(r => r.survived).length / rs.length,           // never below the floor (never unmet)
    fullyFundedRate: 100 * rs.filter(r => r.fullyFunded).length / rs.length,  // never below the target
    yearsAtTargetMedian: q(frac, 0.5), yearsAtTargetP10: q(frac, 0.1),
    aboveTargetYearsMean: mean(rs.map(r => r.aboveTarget)),
    // pooled over every retired year of every path, so a household with more years weighs more in its own figure
    spendYearsMean: mean(rs.map(r => r.spendYears)),
    belowYearsMean: mean(rs.map(r => r.spendYears - r.atTarget)),
    levelWhenBelowMean: (() => { const n = rs.reduce((x, r) => x + (r.spendYears - r.atTarget), 0); return n ? rs.reduce((x, r) => x + (r.belowSum || 0), 0) / n : null; })(),
    levelWhenAboveMean: (() => { const n = rs.reduce((x, r) => x + r.aboveTarget, 0); return n ? rs.reduce((x, r) => x + (r.aboveSum || 0), 0) / n : null; })(),
    minLevelP10: q(rs.map(r => r.minLevel), 0.1),
    changesMean: mean(rs.map(r => r.changes)),
    // total spending delivered over retirement as a fraction of the target years: the guardrails' raises count here
    meanLevelMedian: q(rs.map(r => r.levelSum / Math.max(1, r.spendYears)), 0.5), meanLevelP10: q(rs.map(r => r.levelSum / Math.max(1, r.spendYears)), 0.1),
    // phase 6: years a wrapper sat below its plan tier, and how often the tiers changed
    tierPenYearsMean: mean(rs.map(r => r.tierPenYears || 0)), tierIsaYearsMean: mean(rs.map(r => r.tierIsaYears || 0)), tierChangesMean: mean(rs.map(r => r.tierChanges || 0)), ...(rs.some(r => r.giaYears !== undefined) ? { giaYearsMean: mean(rs.map(r => r.giaYears || 0)), giaChangesMean: mean(rs.map(r => r.giaChanges || 0)) } : {})
  };
}

/* The solved plan on one path, choosing each year's move from the value function at the true position. */
function runSolvedPath(r, zs, world = worldOf()) {
  const { m, c } = r;
  const s = vecOf(m, M.initialState(m));
  const real = new Float64Array(4);
  let tax = 0, tierYears = 0, tierChanges = 0, switchPaid = 0, lastTier = null;
  const held = { pen: 0, isa: 0, gia: 0 };
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    const ai = chooseAction(r, s, t, held);
    const act = c.tiers.gia && r.giaHold >= 0 ? c.actWithGia(ai, r.giaHold) : c.acts[ai];   // M15
    const unmet = F.flow(c, t, ai, s);
    tax += c.last.taxPaid + c.last.cgtPaid;
    { const a = act; switchPaid += F.chargeSwitch(c, s, held, a, t); held.pen = a.tierPen; held.isa = a.tierIsa; held.gia = a.tierGia; if (a.tierPen > 0 || a.tierIsa > 0) tierYears++; const k = a.tierPen * 4 + a.tierIsa; if (lastTier !== null && k !== lastTier) tierChanges++; lastTier = k; }
    if (unmet > 1 || c.last.preNmpaInsolvent) return { survived: false, preAccess: !!c.last.preNmpaInsolvent, failAge: m.ctx.ageSelf0 + t, terminalNet: 0, terminal: 0, lifetimeTax: tax, tierYears, tierChanges, switchPaid };
    world(c, zs[t], real, act, t, zs.length > m.ctx.totalYears + 1 ? zs[m.ctx.totalYears + 1] : 0);
    F.grow(c, t, s, real);
  }
  const total = s[0] + s[1] + s[2];
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, preAccess: false, failAge: m.ctx.ageSelf0 + m.ctx.totalYears, terminalNet: 0, terminal: 0, lifetimeTax: tax, tierYears, tierChanges, switchPaid };
  return { survived: true, preAccess: false, failAge: null, terminalNet: Math.max(0, total - s[0] * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax: tax, tierYears, tierChanges, switchPaid };
}

/* The stats the app's picker reads, plus the two figures never reported before. */
function statsOf(rs) {
  const q = (arr, p) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
  const fails = rs.filter(r => !r.survived);
  return {
    successRate: 100 * rs.filter(r => r.survived).length / rs.length,
    preNmpaFailRate: 100 * rs.filter(r => r.preAccess).length / rs.length,
    medianTerminal: q(rs.map(r => r.terminal), 0.5),
    medianTerminalNet: q(rs.map(r => r.terminalNet), 0.5),
    p10Terminal: q(rs.map(r => r.terminal), 0.1),
    p10TerminalNet: q(rs.map(r => r.terminalNet), 0.1),
    meanTerminalNet: rs.reduce((x, r) => x + r.terminalNet, 0) / rs.length,
    medianLifetimeTax: q(rs.map(r => r.lifetimeTax), 0.5),
    meanFailAge: fails.length ? fails.reduce((x, r) => x + r.failAge, 0) / fails.length : null,
    failures: fails.length,
    // phase 6, when the run carried tiers: years below the plan tier, tier changes and the switching cost paid, per path
    ...(rs[0] && rs[0].tierYears !== undefined ? { tierYearsMean: rs.reduce((x, r) => x + r.tierYears, 0) / rs.length, tierChangesMean: rs.reduce((x, r) => x + r.tierChanges, 0) / rs.length, switchPaidMean: rs.reduce((x, r) => x + r.switchPaid, 0) / rs.length } : {})
  };
}

/* Which of a menu the app's own picker chooses, on the given paths. */
function pickFixed(c, menu, paths) {
  const cands = menu.map((a, ai) => ({ id: ai, label: a.label, stats: statsOf(paths.map(zs => runFixedPath(c, ai, zs))) }));
  const picked = E.explainPick(cands, { priorities: E.DEFAULT_PRIORITIES });
  return { ai: picked.winner.id, label: picked.winner.label, searchStats: picked.winner.stats };
}

/* Paired difference on a yes/no outcome (survival by default) and its standard error, from the discordant paths. */
function paired(a, b, field = 'survived') {
  let n10 = 0, n01 = 0;
  for (let i = 0; i < a.length; i++) { if (a[i][field] && !b[i][field]) n10++; if (!a[i][field] && b[i][field]) n01++; }
  const N = a.length;
  return { diff: 100 * (n10 - n01) / N, se: 100 * Math.sqrt(n10 + n01) / N, n10, n01 };
}

// ---------------------------------------------------------------------------------------------------
if (mode === 'select') {
  const lo = Number(process.argv[3] || 70), hi = Number(process.argv[4] || 98);
  const seedSearch = Number(process.argv[5] || 7001);
  console.log(`single-person households whose same-menu fixed arm scores ${lo}..${hi} survival on ${SEARCH_PATHS} search paths (seed ${seedSearch})`);
  const chosen = [];
  singles.forEach((sc, i) => {
    const m = M.prepare(E, prep(sc.plan));
    const c = F.compile(m, buildActions());
    const paths = E.pathsForSeed(seedSearch, SEARCH_PATHS, m.ctx.totalYears);
    const f = pickFixed(c, buildActions(), paths);
    const s = f.searchStats.successRate;
    if (s >= lo && s <= hi) { chosen.push({ i, id: sc.id, name: sc.name, s }); console.log(`  ${String(chosen.length - 1).padStart(2)}  ${sc.id} ${sc.name.slice(0, 40).padEnd(41)} fixed ${s.toFixed(1)}  years ${m.ctx.totalYears + 1}`); }
  });
  console.log(`${chosen.length} of ${singles.length} in the band`);
  mkdirSync(RESULTS, { recursive: true });
  writeFileSync(join(RESULTS, `band-${lo}-${hi}-${seedSearch}.json`), JSON.stringify(chosen));
}

// ---------------------------------------------------------------------------------------------------
if (mode === 'run') {
  const tag = process.argv[3] || 'exp';
  const POINTS = Number(process.argv[4] || 20), HELD = Number(process.argv[5] || 3000);
  const seedSearch = Number(process.argv[6] || 7001), seedHeld = Number(process.argv[7] || 7002);
  const lo = Number(process.env.LO || 70), hi = Number(process.env.HI || 98);
  const bandFile = join(RESULTS, `band-${lo}-${hi}-${seedSearch}.json`);
  if (!existsSync(bandFile)) { console.error(`run select first: ${bandFile} is missing`); process.exit(2); }
  const band = JSON.parse(readFileSync(bandFile, 'utf8'));
  const k = Number(process.env.ONLY);
  if (!Number.isFinite(k) || k < 0 || k >= band.length) { console.error(`ONLY must be 0..${band.length - 1}`); process.exit(2); }
  const sc = singles[band[k].i];
  const plan = prep(sc.plan);
  const m = M.prepare(E, plan);
  // under the mixture every arm lives in the engine's world: the per-path shift applied on the forward run, the
  // yearly spread the plain volatility (shift mode with a zero held shift); without it, all arms use the fold
  const MIX = process.env.MIX !== undefined ? Number(process.env.MIX) : 3;   // the scenario mixture over the per-path shift (gate 3): three tables by default (five matched it to the hundredth at nearly twice the cost), MIX=0 for the single folded table
  if (MIX) m.shiftZ = 0;
  const years = m.ctx.totalYears;
  const search = E.pathsForSeed(seedSearch, SEARCH_PATHS, years);
  const held = E.pathsForSeed(seedHeld, HELD, years);
  const t0 = Date.now();

  const sameMenu = buildActions();
  const cSame = F.compile(m, sameMenu);
  const same = pickFixed(cSame, sameMenu, search);
  const appM = appMenu(m);
  const cApp = F.compile(m, appM);
  const app = pickFixed(cApp, appM, search);

  // grid coordinates from the environment, so a re-run of the whole experiment on the total-wealth grid is one flag
  const COORDS = process.env.COORDS || undefined, SHARES = process.env.SHARES ? Number(process.env.SHARES) : undefined;
  // the objective's weights and risk term from the environment too, for the tuning on the odd households (plan 2c.3)
  const WR = process.env.WR ? Number(process.env.WR) : undefined, WB = process.env.WB ? Number(process.env.WB) : undefined, RESIL = process.env.RESIL || undefined;
  // phase 6: TIERS=1 lets every move also pick the pension's and the ISA's tier (the plan's or up to two below); TIERS=joint moves both together
  const TIERS = process.env.TIERS === '1' ? true : (process.env.TIERS || undefined);
  const SWITCH = process.env.SWITCH !== undefined ? Number(process.env.SWITCH) : undefined;   // the round-trip cost of a tier change, on the slice traded
  const solveOpts = { points: POINTS, lump: m.ctx.fullLumpSum, coords: COORDS, shares: SHARES, resilienceWeight: WR, bequestWeight: WB, resilience: RESIL, tiers: TIERS, switchCost: SWITCH, bequestShape: process.env.BEQSHAPE || undefined };
  const r = MIX ? solveMixture(E, M, plan, { ...solveOpts, mix: MIX }) : solve(E, M, plan, solveOpts);
  const solvedRs = held.map(zs => runSolvedPath(r, zs));
  const sameRs = held.map(zs => runFixedPath(cSame, same.ai, zs));
  const appRs = held.map(zs => runFixedPath(cApp, app.ai, zs));
  const S = statsOf(solvedRs), Fs = statsOf(sameRs), A = statsOf(appRs);

  const verdict = (fixedStats) => E.explainPick([{ id: 'solver', stats: S }, { id: 'fixed', stats: fixedStats }], { priorities: E.DEFAULT_PRIORITIES }).winner.id;
  const out = {
    tag, id: sc.id, name: sc.name, years: years + 1, points: POINTS, coords: r.meta.points, objective: { wR: r.meta.wR, wB: r.meta.bequestWeight, resilience: r.meta.resilience }, tiers: r.meta.tiers, switchCost: r.meta.switchCost, mixture: r.meta.mixture || 0, held: HELD, seedSearch, seedHeld, solveMs: r.meta.ms, ms: Date.now() - t0,
    solver: S, same: { ...Fs, label: same.label }, app: { ...A, label: app.label },
    pairedSame: paired(solvedRs, sameRs), pairedApp: paired(solvedRs, appRs),
    verdictSame: verdict(Fs), verdictApp: verdict(A)
  };
  mkdirSync(join(RESULTS, tag), { recursive: true });
  writeFileSync(join(RESULTS, tag, `${sc.id}.json`), JSON.stringify(out, null, 1));
  const ps = out.pairedSame, pa = out.pairedApp;
  console.log(`${sc.id} ${sc.name.slice(0, 34).padEnd(35)} solver ${S.successRate.toFixed(1)}  same ${Fs.successRate.toFixed(1)} (${ps.diff >= 0 ? '+' : ''}${ps.diff.toFixed(1)}±${ps.se.toFixed(1)}, picker: ${out.verdictSame})  app ${A.successRate.toFixed(1)} (${pa.diff >= 0 ? '+' : ''}${pa.diff.toFixed(1)}±${pa.se.toFixed(1)}, picker: ${out.verdictApp})  p10 ${Math.round(S.p10TerminalNet / 1000)}k/${Math.round(Fs.p10TerminalNet / 1000)}k  median ${Math.round(S.medianTerminalNet / 1000)}k/${Math.round(Fs.medianTerminalNet / 1000)}k  failAge ${S.meanFailAge ? S.meanFailAge.toFixed(1) : '-'}/${Fs.meanFailAge ? Fs.meanFailAge.toFixed(1) : '-'}  ${(out.ms / 1000).toFixed(0)}s`);
}

// ---------------------------------------------------------------------------------------------------
/*
 * PERTURBED-MODEL EVALUATION (plan Phase 2c.1).
 *   ONLY=<i> node experiment.mjs perturb <baseTag> <kind> [points] [held] [seedSearch] [seedHeld]
 * Re-solves the household exactly as the base run did and takes the fixed arms' choices FROM the base
 * run's result file, so nothing is re-chosen under the perturbed world; then scores all three arms on
 * the same held-out paths with the world of `kind`. Writes results/<baseTag>-<kind>/<id>.json in the
 * shape `reduce` reads.
 */
if (mode === 'perturb') {
  const baseTag = process.argv[3] || 'p2-total40', kind = process.argv[4] || 'return-1';
  const POINTS = Number(process.argv[5] || 40), HELD = Number(process.argv[6] || 3000);
  const seedSearch = Number(process.argv[7] || 7001), seedHeld = Number(process.argv[8] || 7002);
  const lo = Number(process.env.LO || 70), hi = Number(process.env.HI || 98);
  const band = JSON.parse(readFileSync(join(RESULTS, `band-${lo}-${hi}-${seedSearch}.json`), 'utf8'));
  const k = Number(process.env.ONLY);
  if (!Number.isFinite(k) || k < 0 || k >= band.length) { console.error(`ONLY must be 0..${band.length - 1}`); process.exit(2); }
  const sc = singles[band[k].i];
  const base = JSON.parse(readFileSync(join(RESULTS, baseTag, `${sc.id}.json`), 'utf8'));
  const plan = prep(sc.plan);
  const m = M.prepare(E, plan);
  const years = m.ctx.totalYears;
  const held = E.pathsForSeed(seedHeld, HELD, years);
  const world = worldOf(kind);
  const t0 = Date.now();
  const sameMenu = buildActions(), cSame = F.compile(m, sameMenu);
  const sameAi = sameMenu.findIndex(a => a.label === base.same.label);
  const appM = appMenu(m), cApp = F.compile(m, appM);
  const appAi = appM.findIndex(a => a.label === base.app.label);
  if (sameAi < 0 || appAi < 0) { console.error(`${sc.id}: could not find the base run's fixed choices`); process.exit(2); }
  const r = solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum });
  const solvedRs = held.map(zs => runSolvedPath(r, zs, world));
  const sameRs = held.map(zs => runFixedPath(cSame, sameAi, zs, world));
  const appRs = held.map(zs => runFixedPath(cApp, appAi, zs, world));
  const S = statsOf(solvedRs), Fs = statsOf(sameRs), A = statsOf(appRs);
  const verdict = (fixedStats) => E.explainPick([{ id: 'solver', stats: S }, { id: 'fixed', stats: fixedStats }], { priorities: E.DEFAULT_PRIORITIES }).winner.id;
  const tag = `${baseTag}-${kind}`;
  const out = {
    tag, world: kind, baseTag, id: sc.id, name: sc.name, years: years + 1, points: POINTS, coords: r.meta.points, held: HELD, seedSearch, seedHeld, solveMs: r.meta.ms, ms: Date.now() - t0,
    solver: S, same: { ...Fs, label: base.same.label }, app: { ...A, label: base.app.label },
    pairedSame: paired(solvedRs, sameRs), pairedApp: paired(solvedRs, appRs),
    verdictSame: verdict(Fs), verdictApp: verdict(A)
  };
  mkdirSync(join(RESULTS, tag), { recursive: true });
  writeFileSync(join(RESULTS, tag, `${sc.id}.json`), JSON.stringify(out, null, 1));
  const ps = out.pairedSame;
  console.log(`${sc.id} ${kind.padEnd(10)} solver ${S.successRate.toFixed(1)}  same ${Fs.successRate.toFixed(1)} (${ps.diff >= 0 ? '+' : ''}${ps.diff.toFixed(1)}±${ps.se.toFixed(1)}, picker: ${out.verdictSame})  base Δ ${base.pairedSame.diff >= 0 ? '+' : ''}${base.pairedSame.diff.toFixed(1)}  ${(out.ms / 1000).toFixed(0)}s`);
}

// ---------------------------------------------------------------------------------------------------
/*
 * THE SPENDING PILOT (plan Phase 2d). Three arms against the flexible solver on the same held-out paths:
 *   gk       the app with Guyton-Klinger on, exactly as it ships (no floor of its own)
 *   gkFloor  Guyton-Klinger whose cuts stop at the person's floor: the like-for-like opponent
 *   fixed    spending at the target, the phase 2 fixed arm
 *   vanguard Vanguard's dynamic spending (+5% / -2.5% of last year's), with the person's floor (2d.2)
 *   arva     ARVA, the pot as a level real annuity over the years left, with the person's floor (2d.2)
 * Each fixed arm's withdrawal order is chosen by the app's own picker on the search paths, with that
 * arm's rules on. The solver is landed on the confidence by `solveFlex`. Every arm reports the
 * reporting rule's figures: the floor rate and the fully-funded rate, never one without the other.
 *   ONLY=<i> FLOOR=0.8 CONF=0.9 node experiment.mjs flex <tag> [points=40] [held=3000] [seedSearch=7001] [seedHeld=7002]
 */
if (mode === 'flex') {
  const tag = process.argv[3] || 'flex';
  const POINTS = Number(process.argv[4] || 40), HELD = Number(process.argv[5] || 3000);
  const seedSearch = Number(process.argv[6] || 7001), seedHeld = Number(process.argv[7] || 7002);
  // CONF is a fraction (0.9) or, as "+5", the fixed-target arm's own floor rate plus that many points: "make me
  // five points safer than the plan as written", which every household in the band can be asked
  const FLOOR = Number(process.env.FLOOR || 0.8), CONF_RAW = process.env.CONF || '+5';
  const CONF_REL = CONF_RAW.startsWith('+') ? Number(CONF_RAW.slice(1)) : null;
  let CONF = CONF_REL === null && CONF_RAW !== 'gkFloor' ? Number(CONF_RAW) : 0.9;
  const lo = Number(process.env.LO || 70), hi = Number(process.env.HI || 98);
  const band = JSON.parse(readFileSync(join(RESULTS, `band-${lo}-${hi}-${seedSearch}.json`), 'utf8'));
  const k = Number(process.env.ONLY);
  if (!Number.isFinite(k) || k < 0 || k >= band.length) { console.error(`ONLY must be 0..${band.length - 1}`); process.exit(2); }
  const sc = singles[band[k].i];
  const raw = JSON.parse(JSON.stringify(sc.plan));
  // PLANTIER (M14, research only): hold the pension and the ISA at this tier in the plan, so the library - where every
  // household holds its pension at the top tier - can test a user who chose less risk
  if (process.env.PLANTIER) raw.accounts = raw.accounts.map(a => (/^Pensions|^S&S ISA/.test(a.category) ? { ...a, risk: process.env.PLANTIER } : a));
  // GIAGAIN (M15, research only): the taxable account opens with this fraction of its balance as unrealised gain -
  // every library GIA opens with none, which makes a tier switch there free of tax
  if (process.env.GIAGAIN) raw.accounts = raw.accounts.map(a => (/^Other Investments/.test(a.category) && E.num(a.balance, 0) > 0 ? { ...a, unrealisedGain: Math.round(Number(process.env.GIAGAIN) * E.num(a.balance, 0)) } : a));
  const target = E.num(raw.spending.targetSpend, 0);
  const floorSpend = Math.round(target * FLOOR);
  // MINPOTYEARS: the minimum end-of-life pot, in years of target spending, set on EVERY arm's plan so the
  // rivals are held to the same rule the solver is (PLAN.md step 3, K2)
  const minPot = process.env.MINPOTYEARS !== undefined ? Number(process.env.MINPOTYEARS) * target : undefined;
  const variant = (guardrails, floor) => E.resolveMpaa(E.normalizePlan({ ...raw, config: { ...raw.config, guardrails, lookaheadYears: 0, ...(minPot !== undefined ? { solvencyFloor: minPot } : {}) }, spending: { ...raw.spending, floorSpend: floor, floorConfidence: CONF * 100 } }));
  const plans = { solver: variant(false, floorSpend), gk: variant(true, 0), gkFloor: variant(true, floorSpend), fixed: variant(false, 0), vanguard: variant(false, floorSpend), arva: variant(false, floorSpend) };
  const EXTRA = (process.env.ARMS || 'vanguard,arva').split(',').filter(Boolean);
  const t0 = Date.now();
  const years = M.prepare(E, plans.fixed).ctx.totalYears;
  const search = E.pathsForSeed(seedSearch, SEARCH_PATHS, years);
  const held = E.pathsForSeed(seedHeld, HELD, years);
  // the mixture (gate 3): the solver lands its floor on K tables and every arm runs in the engine's world
  const MIX = process.env.MIX !== undefined ? Number(process.env.MIX) : 3;
  const arms = {};
  /*
   * SOLVERONLY=1: skip the rival arms entirely. For a SCREEN that compares the solver against ITSELF
   * across arms - 6e's grid fidelity, 6c-screen's curve, 6d's lever - the five rivals are identical in
   * every cell, so scoring them is work computed and thrown away.
   *
   * Measured before this existed: one cell at 12 points and 400 held paths took 15.1 MINUTES, for a
   * single solve. The solve is not the cost. The cost is forward passes, and most of them are not read:
   * five rival arms scored over the held draw, plus 10,800 policy runs whose only output is the search
   * floor rate, which a held-lambda run does not use for anything.
   *
   * ONE requirement, checked rather than assumed: CONF must be a NUMBER. `CONF=gkFloor` and `CONF=+n`
   * both derive the solver's ask FROM an arm, so dropping the arms would silently change what the
   * solver was asked for rather than only making the run cheaper.
   *
   * It first also demanded LAMBDA be held, on the reasoning that without the rivals there is nothing
   * to calibrate an ask against. **That was too strict and the reasoning was wrong.** With CONF given
   * as a number the ask is explicit and owes the rivals nothing, so a real landing is perfectly
   * well defined without them - which is exactly what the search-path sweep needs, since it must
   * LAND at each path count and cannot hold lambda. The guard was written for screens and mistook the
   * first use for the only one.
   */
  const SOLVER_ONLY = process.env.SOLVERONLY === '1';
  if (SOLVER_ONLY && (CONF_RAW === 'gkFloor' || CONF_REL !== null)) {
    console.error('SOLVERONLY needs CONF as a number: gkFloor and +n both derive the ask from an arm that is not being run');
    process.exit(2);
  }
  for (const key of (SOLVER_ONLY ? [] : ['gk', 'gkFloor', 'fixed', ...EXTRA])) {
    const m = M.prepare(E, plans[key]);
    if (MIX) m.shiftZ = 0;
    const menu = buildActions();
    const c = F.compile(m, menu);
    if (key === 'vanguard') c.rule = { kind: 'vanguard', up: 0.05, down: 0.025 };
    // the pension after the tax its draw will pay: a quarter tax-free, the rest at the basic rate
    if (key === 'arva') c.rule = { kind: 'arva', rate: F.arvaRate(c, vecOf(m, M.initialState(m))), pensionHaircut: 0.75 * m.P.basicRate };
    const pick = pickFixed(c, menu, search);
    const trK = RECORD ? makeTrace(held.length, m.ctx.totalYears + 1) : null;
    const rs = held.map((zs, i) => { if (trK) trK.row = i; return runFixedPath(c, pick.ai, zs, worldOf(), trK); });
    arms[key] = { stats: { ...statsFlex(rs), label: pick.label, ...(c.rule ? { rule: c.rule } : {}) }, rs, trace: trK, spendYears: Array.from(c.yr.spend, v => (v > 0 ? 1 : 0)) };
  }
  if (CONF_REL !== null) CONF = Math.min(0.97, Math.round((arms.fixed.stats.successRate + CONF_REL)) / 100);
  // CONF=gkFloor: the solver is asked for exactly the floor rate the guardrails-with-floor arm achieved, so the two
  // are compared at equal downside (Pfau's calibration) on how many years at the target each delivers
  if (CONF_RAW === 'gkFloor') CONF = Math.min(0.99, Math.round(arms.gkFloor.stats.floorRate * 10) / 1000);
  const mS = M.prepare(E, plans.solver);
  const LEVELS = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number) : undefined;
  const EXP = process.env.EXP ? Number(process.env.EXP) : undefined;
  const MARGIN = process.env.MARGIN ? Number(process.env.MARGIN) : 0;
  const RAISE = process.env.RAISE ? Number(process.env.RAISE) : 0;   // 2d.4: the credit weight for spending above the target
  const TIERS = process.env.TIERS === '1' ? true : (process.env.TIERS || undefined);
  const r = solveFlex(E, M, plans.solver, { points: POINTS, lump: mS.ctx.fullLumpSum, searchPaths: Number(process.env.SEARCH || 5400), verifyPaths: process.env.VERIFY ? Number(process.env.VERIFY) : undefined, seed: seedSearch, confidence: CONF, bisectSteps: process.env.BISECT ? Number(process.env.BISECT) : 5, spendLevels: LEVELS, shortfallExponent: EXP, margin: MARGIN, raiseWeight: RAISE, tiers: TIERS, driftWeight: process.env.DRIFT ? Number(process.env.DRIFT) : undefined, bequestShape: process.env.BEQSHAPE || undefined, lambdaFixed: process.env.LAMBDA ? Number(process.env.LAMBDA) : undefined, gainBuckets: process.env.GAINB ? process.env.GAINB.split(',').map(Number) : undefined, gainInterp: process.env.GAININT === '1' || undefined, pclsStrict: process.env.PCLSSTRICT === '1' || undefined, bequestWeight: process.env.WB !== undefined ? Number(process.env.WB) : undefined, resilienceWeight: process.env.WR !== undefined ? Number(process.env.WR) : undefined, mix: MIX || undefined, levelSearch: process.env.TERNARY === '1' ? 'ternary' : undefined, shareDead: process.env.SHAREDEAD || undefined, quadNodes: process.env.QUAD ? Number(process.env.QUAD) : undefined, raiseCap: process.env.RAISECAP !== undefined ? Number(process.env.RAISECAP) : undefined, blockTrim: process.env.BLOCKTRIM === '1' || undefined, raiseSurvival: process.env.RAISESURV === '1' || undefined, tiersAbove: process.env.TIERSABOVE ? Number(process.env.TIERSABOVE) : undefined, giaTiers: process.env.GIATIERS === '1' || undefined, bridgeRead: process.env.BRIDGEREAD === '1' || undefined, failureShortfall: process.env.FAILSHORT === 'zero' ? 'zero' : (process.env.FAILSHORT === '1' || undefined), estateScale: process.env.ESTATESCALE !== undefined ? Number(process.env.ESTATESCALE) : undefined, finalExact: process.env.FINALEXACT === '1' || undefined });
  const trS = RECORD ? makeTrace(held.length, mS.ctx.totalYears + 1) : null;
  const solvedRs = held.map((zs, i) => { if (trS) trS.row = i; return runPolicy(r, zs, trS ? { trace: trS } : {}); });
  arms.solver = { stats: { ...statsFlex(solvedRs), landed: r.meta.landed, lambda: r.lambda, solves: r.meta.solves, levels: r.meta.spendLevels, verifiedFloorRate: 100 * r.floorRate, searchFloorRate: 100 * (r.searchFloorRate ?? r.floorRate), searchPaths: r.meta.searchPaths, verifyPaths: r.meta.verifyPaths, verifySteps: r.meta.verifySteps, solverVersion: r.meta.solverVersion, driftWeight: r.meta.driftWeight }, rs: solvedRs };
  const out = {
    tag, id: sc.id, name: sc.name, years: years + 1, points: POINTS, coords: r.meta.points, held: HELD, seedSearch, seedHeld, floor: FLOOR, confidence: CONF, target, floorSpend, ms: Date.now() - t0,
    knobs: { levels: LEVELS || null, exponent: EXP === undefined ? 2 : EXP, margin: MARGIN, raise: RAISE, drift: r.meta.driftWeight || 0, bequestShape: r.meta.bequestShape, bequestCap: r.meta.bequestCap, gainBuckets: process.env.GAINB || null, gainInterp: process.env.GAININT === '1', pclsStrict: process.env.PCLSSTRICT === '1', bequestWeight: r.meta.bequestWeight, resilienceWeight: r.meta.wR, tiers: r.meta.tiers || null, mixture: r.meta.mixture || 0, levelSearch: process.env.TERNARY === '1' ? 'ternary' : 'exhaustive', shareDead: process.env.SHAREDEAD || null, quadNodes: process.env.QUAD ? Number(process.env.QUAD) : 5, solveMs: r.meta.ms, raiseCap: process.env.RAISECAP ?? null, blockTrim: process.env.BLOCKTRIM === '1', raiseSurvival: process.env.RAISESURV === '1', failureShortfall: process.env.FAILSHORT || false, estateScale: process.env.ESTATESCALE ?? null, minPotYears: process.env.MINPOTYEARS ?? null, finalExact: process.env.FINALEXACT === '1', giaTiers: process.env.GIATIERS === '1', bridgeRead: process.env.BRIDGEREAD === '1', giaGain: process.env.GIAGAIN ?? null, planTier: process.env.PLANTIER ?? null },
    solver: arms.solver.stats, solverOnly: SOLVER_ONLY || undefined,
    ...(SOLVER_ONLY ? {} : {
      gk: arms.gk.stats, gkFloor: arms.gkFloor.stats, fixed: arms.fixed.stats,
      pairedFloor: { gk: paired(solvedRs, arms.gk.rs), gkFloor: paired(solvedRs, arms.gkFloor.rs), fixed: paired(solvedRs, arms.fixed.rs) },
      pairedFull: { gk: paired(solvedRs, arms.gk.rs, 'fullyFunded'), gkFloor: paired(solvedRs, arms.gkFloor.rs, 'fullyFunded'), fixed: paired(solvedRs, arms.fixed.rs, 'fullyFunded') }
    })
  };
  if (!SOLVER_ONLY) for (const key of EXTRA) { out[key] = arms[key].stats; out.pairedFloor[key] = paired(solvedRs, arms[key].rs); out.pairedFull[key] = paired(solvedRs, arms[key].rs, 'fullyFunded'); }
  mkdirSync(join(RESULTS, tag), { recursive: true });
  writeFileSync(join(RESULTS, tag, `${sc.id}.json`), JSON.stringify(out, null, 1));
  if (RECORD) {
    // one record per arm run, beside the results JSON (record.mjs); the solver's also carries its moves with STOREPOL=1
    const meta = { tag, id: sc.id, knobs: out.knobs, held: HELD, seedHeld, points: POINTS, lambda: r.lambda, solveMs: r.meta.ms, target, floorSpend, ageSelf0: mS.ctx.ageSelf0, nmpa: mS.ctx.nmpa, arms: Object.keys(arms) };
    for (const key of Object.keys(arms)) {
      const arm = arms[key], tr = key === 'solver' ? trS : arm.trace; if (!tr) continue;
      const spend = key === 'solver' ? Array.from(r.c.yr.spend, v => (v > 0 ? 1 : 0)) : arm.spendYears;
      const extra = key === 'solver' && STOREPOL ? { pol: polToB64(r.pol), grid: { np: r.g.np, ni: r.g.ni, nt: r.g.nt, gain: r.g.gain, pcls: r.g.pcls, W: Array.from(r.g.axes.W.pts) }, actions: r.actions.map(a => a.label) } : {};
      writeRecord(join(RESULTS, tag, `${sc.id}.${key}.record.json.gz`), tr, arm.rs, { ...meta, arm: key, spendYears: spend }, extra);
    }
  }
  const f = (x) => x.toFixed(1);
  /*
   * The progress line, which must survive SOLVERONLY. It did not: it read out.gkFloor, out.gk,
   * out.fixed and the EXTRA arms, none of which exist when the rivals are skipped, so every cell of
   * 6e stage 1 wrote its record and THEN died on the console line. The records were complete - the
   * write happens first - so the run was salvageable, but the progress output was a stack trace and
   * the exit codes were wrong. A summary line should never be able to lose a run.
   */
  if (SOLVER_ONLY) {
    console.log(`${sc.id} ${sc.name.slice(0, 30).padEnd(31)} solver only: floor/full ${f(out.solver.floorRate)}/${f(out.solver.fullyFundedRate)} (${out.solver.landed}, ${out.solver.solves} solves)  years at/above target med ${out.solver.yearsAtTargetMedian.toFixed(2)}  median net ${Math.round(out.solver.medianTerminalNet / 1000)}k  changes ${out.solver.changesMean.toFixed(1)}  ${(out.ms / 1000).toFixed(0)}s`);
  } else {
  const extra = EXTRA.map(k => `  ${k} ${f(out[k].floorRate)}/${f(out[k].fullyFundedRate)} lv ${out[k].meanLevelMedian.toFixed(2)}`).join('');
  console.log(`${sc.id} ${sc.name.slice(0, 30).padEnd(31)} floor/full: solver ${f(out.solver.floorRate)}/${f(out.solver.fullyFundedRate)} (${out.solver.landed}, ${out.solver.solves} solves)  gkFloor ${f(out.gkFloor.floorRate)}/${f(out.gkFloor.fullyFundedRate)}  gk ${f(out.gk.floorRate)}/${f(out.gk.fullyFundedRate)}  fixed ${f(out.fixed.floorRate)}/${f(out.fixed.fullyFundedRate)}${extra}  years at/above target med solver ${out.solver.yearsAtTargetMedian.toFixed(2)} gkFloor ${out.gkFloor.yearsAtTargetMedian.toFixed(2)}  changes ${out.solver.changesMean.toFixed(1)}/${out.gkFloor.changesMean.toFixed(1)}  ${(out.ms / 1000).toFixed(0)}s`);
  }
}

// ---------------------------------------------------------------------------------------------------
if (mode === 'reduceFlex') {
  // runs made before these fields existed print n/a rather than NaN
  const fmtN = (a) => { const v = a.filter(x => x !== null && x !== undefined && !Number.isNaN(x)); return v.length ? (v.reduce((x, y) => x + y, 0) / v.length).toFixed(1) : 'n/a'; };
  const fmtLvl = (a) => { const v = a.filter(x => x !== null && x !== undefined && !Number.isNaN(x)); return v.length ? (v.reduce((x, y) => x + y, 0) / v.length).toFixed(3) : 'n/a'; };
  const tag = process.argv[3] || 'flex';
  const dir = join(RESULTS, tag);
  const rows = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(dir, f), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const binom = (w, l) => { const n = w + l; if (!n) return 1; const k = Math.min(w, l); let p = 0; const C = (n, r) => { let v = 1; for (let i = 1; i <= r; i++) v = v * (n - r + i) / i; return v; }; for (let i = 0; i <= k; i++) p += C(n, i) / Math.pow(2, n); return Math.min(1, 2 * p); };
  console.log(`${rows.length} households, tag ${tag}, floor ${rows[0]?.floor} of target, confidence ${rows[0]?.confidence}, ${rows[0]?.held} held-out paths
`);
  console.log('id    floor rate: solver/gkFloor/gk/fixed   fully funded: solver/gkFloor/gk/fixed   years at/above target med: S/gkF/gk   above-target yrs gk   changes S/gkF   landed');
  for (const r of rows) {
    const f = (x) => x.toFixed(1).padStart(5);
    console.log(`${r.id}  ${f(r.solver.floorRate)}/${f(r.gkFloor.floorRate)}/${f(r.gk.floorRate)}/${f(r.fixed.floorRate)}   ${f(r.solver.fullyFundedRate)}/${f(r.gkFloor.fullyFundedRate)}/${f(r.gk.fullyFundedRate)}/${f(r.fixed.fullyFundedRate)}   ${r.solver.yearsAtTargetMedian.toFixed(2)}/${r.gkFloor.yearsAtTargetMedian.toFixed(2)}/${r.gk.yearsAtTargetMedian.toFixed(2)}   ${r.gk.aboveTargetYearsMean.toFixed(1).padStart(5)}   ${r.solver.changesMean.toFixed(1)}/${r.gkFloor.changesMean.toFixed(1)}   ${r.solver.landed}`);
  }
  const armsHere = ['gkFloor', 'gk', 'fixed', ...['vanguard', 'arva'].filter(k => rows.every(r => r[k]))];
  if (armsHere.length > 3) {
    console.log('\nid    floor rate: vanguard/arva   fully funded: vanguard/arva   years at/above target med: vanguard/arva   spending delivered (mean level, median run): S/gkF/gk/vanguard/arva   changes vanguard/arva');
    for (const r of rows) { const f = (x) => x.toFixed(1).padStart(5); const lv = (a) => (r[a].meanLevelMedian || 0).toFixed(2);
      console.log(`${r.id}  ${f(r.vanguard.floorRate)}/${f(r.arva.floorRate)}   ${f(r.vanguard.fullyFundedRate)}/${f(r.arva.fullyFundedRate)}   ${r.vanguard.yearsAtTargetMedian.toFixed(2)}/${r.arva.yearsAtTargetMedian.toFixed(2)}   ${lv('solver')}/${lv('gkFloor')}/${lv('gk')}/${lv('vanguard')}/${lv('arva')}   ${r.vanguard.changesMean.toFixed(1)}/${r.arva.changesMean.toFixed(1)}`); }
  }
  for (const arm of armsHere) {
    const dFloor = rows.map(r => r.pairedFloor[arm].diff), dFull = rows.map(r => r.pairedFull[arm].diff);
    const up = rows.filter(r => r.pairedFull[arm].diff > 2 * r.pairedFull[arm].se).length, down = rows.filter(r => r.pairedFull[arm].diff < -2 * r.pairedFull[arm].se).length;
    console.log(`\nsolver against ${arm}:`);
    console.log(`  floor rate: mean ${dFloor.length ? (mean(dFloor) >= 0 ? '+' : '') + mean(dFloor).toFixed(2) : '-'} pts;  fully-funded rate: mean ${(mean(dFull) >= 0 ? '+' : '') + mean(dFull).toFixed(2)} pts, ${up} up / ${down} down beyond two standard errors, sign test p = ${binom(up, down).toFixed(3)}`);
    console.log(` years below target: solver ${fmtN(rows.map(r => r.solver.belowYearsMean))} vs ${fmtN(rows.map(r => r[arm].belowYearsMean))};  average level when below: solver ${fmtLvl(rows.map(r => r.solver.levelWhenBelowMean))} vs ${fmtLvl(rows.map(r => r[arm].levelWhenBelowMean))};  average level when above: solver ${fmtLvl(rows.map(r => r.solver.levelWhenAboveMean))} vs ${fmtLvl(rows.map(r => r[arm].levelWhenAboveMean))};  retired years: ${fmtN(rows.map(r => r.solver.spendYearsMean))};\n   years at or above target (median run): solver ${mean(rows.map(r => r.solver.yearsAtTargetMedian)).toFixed(3)} vs ${mean(rows.map(r => r[arm].yearsAtTargetMedian)).toFixed(3)};  years above target (mean): ${mean(rows.map(r => r.solver.aboveTargetYearsMean)).toFixed(1)} vs ${mean(rows.map(r => r[arm].aboveTargetYearsMean)).toFixed(1)};  spending delivered (mean level, median run): ${mean(rows.map(r => r.solver.meanLevelMedian || 0)).toFixed(3)} vs ${mean(rows.map(r => r[arm].meanLevelMedian || 0)).toFixed(3)};  changes per path: ${mean(rows.map(r => r.solver.changesMean)).toFixed(2)} vs ${mean(rows.map(r => r[arm].changesMean)).toFixed(2)};  median pot: ${Math.round(mean(rows.map(r => r.solver.medianTerminalNet - r[arm].medianTerminalNet)) / 1000)}k`);
  }
  // each household's ask can differ (CONF=gkFloor), so the landing is judged against its own
  const meets = (arm) => rows.filter(r => r[arm].floorRate >= 100 * r.confidence - 0.5).length;
  console.log(`\nsolver landed on the confidence (floor rate >= each household's ask - 0.5) in ${meets('solver')} of ${rows.length}; gkFloor meets it in ${meets('gkFloor')}; gk in ${meets('gk')}; fixed in ${meets('fixed')}${armsHere.length > 3 ? `; vanguard in ${meets('vanguard')}; arva in ${meets('arva')}` : ''}`);
}

// ---------------------------------------------------------------------------------------------------
if (mode === 'reduce') {
  const tag = process.argv[3] || 'exp';
  { const dir0 = join(RESULTS, tag); const files0 = readdirSync(dir0).filter(f => f.endsWith('.json')); const first = files0[0]; if (first) { const r0 = JSON.parse(readFileSync(join(dir0, first), 'utf8')); if (r0.tiers) { const all = files0.map(f => JSON.parse(readFileSync(join(dir0, f), 'utf8'))); const mean0 = (k) => all.reduce((x, r) => x + (r.solver[k] || 0), 0) / all.length; console.log(`tiers on: ${r0.tiers.join(' ')}; switching cost ${r0.switchCost}; years below the plan tier ${mean0('tierYearsMean').toFixed(1)} a run, tier changes ${mean0('tierChangesMean').toFixed(1)} a run, switching cost paid £${Math.round(mean0('switchPaidMean'))} a run\n`); } } }
  const dir = join(RESULTS, tag);
  const rows = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(dir, f), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const binom = (w, l) => { // two-sided sign test p-value
    const n = w + l; if (!n) return 1;
    const k = Math.min(w, l); let p = 0;
    const C = (n, r) => { let v = 1; for (let i = 1; i <= r; i++) v = v * (n - r + i) / i; return v; };
    for (let i = 0; i <= k; i++) p += C(n, i) / Math.pow(2, n);
    return Math.min(1, 2 * p);
  };
  console.log(`${rows.length} households, tag ${tag}, ${rows[0]?.points} points, ${rows[0]?.held} held-out paths, seeds ${rows[0]?.seedSearch}/${rows[0]?.seedHeld}\n`);
  console.log('id    survival: solver / same / app     Δsame±se   Δapp±se    picker(same,app)   p10 net s/f    median net s/f    tax s/f    failAge s/f');
  for (const r of rows) {
    const S = r.solver, Fs = r.same, A = r.app;
    console.log(`${r.id}  ${S.successRate.toFixed(1).padStart(5)} / ${Fs.successRate.toFixed(1).padStart(5)} / ${A.successRate.toFixed(1).padStart(5)}      ${(r.pairedSame.diff >= 0 ? '+' : '') + r.pairedSame.diff.toFixed(1)}±${r.pairedSame.se.toFixed(1)}   ${(r.pairedApp.diff >= 0 ? '+' : '') + r.pairedApp.diff.toFixed(1)}±${r.pairedApp.se.toFixed(1)}    ${r.verdictSame.padEnd(6)},${r.verdictApp.padEnd(6)}   ${String(Math.round(S.p10TerminalNet / 1000)).padStart(5)}k/${String(Math.round(Fs.p10TerminalNet / 1000)).padStart(5)}k   ${String(Math.round(S.medianTerminalNet / 1000)).padStart(6)}k/${String(Math.round(Fs.medianTerminalNet / 1000)).padStart(6)}k   ${Math.round(S.medianLifetimeTax / 1000)}k/${Math.round(Fs.medianLifetimeTax / 1000)}k   ${S.meanFailAge ? S.meanFailAge.toFixed(1) : '  -  '}/${Fs.meanFailAge ? Fs.meanFailAge.toFixed(1) : '  -  '}`);
  }
  for (const [label, key, vkey] of [['same menu, held fixed', 'pairedSame', 'verdictSame'], ['the app as it stands', 'pairedApp', 'verdictApp']]) {
    const d = rows.map(r => r[key].diff);
    const sig = rows.filter(r => Math.abs(r[key].diff) > 2 * r[key].se);
    const wins = rows.filter(r => r[key].diff > 0 && Math.abs(r[key].diff) > 2 * r[key].se).length;
    const losses = rows.filter(r => r[key].diff < 0 && Math.abs(r[key].diff) > 2 * r[key].se).length;
    const pw = rows.filter(r => r[vkey] === 'solver').length, pl = rows.filter(r => r[vkey] === 'fixed').length;
    console.log(`\nsolver against ${label}:`);
    console.log(`  survival: mean ${mean(d) >= 0 ? '+' : ''}${mean(d).toFixed(2)} pts; beyond two standard errors in ${sig.length} of ${rows.length} (${wins} up, ${losses} down); sign test p = ${binom(wins, losses).toFixed(3)}`);
    console.log(`  the app's own picker prefers the solver in ${pw}, the fixed plan in ${pl}, ties ${rows.length - pw - pl}; sign test p = ${binom(pw, pl).toFixed(3)}`);
    const fk = key === 'pairedSame' ? 'same' : 'app';
    console.log(`  unlucky tenth (net): ${mean(rows.map(r => r.solver.p10TerminalNet - r[fk].p10TerminalNet)) >= 0 ? '+' : ''}£${Math.round(mean(rows.map(r => r.solver.p10TerminalNet - r[fk].p10TerminalNet)) / 1000)}k mean;  median pot (net): ${mean(rows.map(r => r.solver.medianTerminalNet - r[fk].medianTerminalNet)) >= 0 ? '+' : ''}£${Math.round(mean(rows.map(r => r.solver.medianTerminalNet - r[fk].medianTerminalNet)) / 1000)}k;  tax: ${mean(rows.map(r => r.solver.medianLifetimeTax - r[fk].medianLifetimeTax)) >= 0 ? '+' : ''}£${Math.round(mean(rows.map(r => r.solver.medianLifetimeTax - r[fk].medianLifetimeTax)) / 1000)}k`);
    const fa = rows.filter(r => r.solver.meanFailAge && r[fk].meanFailAge);
    if (fa.length) console.log(`  mean failure age on failing paths: ${mean(fa.map(r => r.solver.meanFailAge - r[fk].meanFailAge)) >= 0 ? '+' : ''}${mean(fa.map(r => r.solver.meanFailAge - r[fk].meanFailAge)).toFixed(2)} years (${fa.length} households with failures on both)`);
  }
}
