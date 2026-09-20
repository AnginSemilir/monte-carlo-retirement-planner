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
 *   node experiment.mjs reduce <tag>                             aggregate one tag's results
 *
 * One process per household, on purpose: memory resets between them and every line lands as it is
 * made. `research/solver/results/` is where they go and it is not committed.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, chooseAction, buildActions } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
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

/* Run one fixed move on one path in the fast flow. */
function runFixedPath(c, ai, zs) {
  const m = c.m;
  const s = vecOf(m, M.initialState(m));
  const real = new Float64Array(4);
  let tax = 0;
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    const unmet = F.flow(c, t, ai, s);
    tax += c.last.taxPaid + c.last.cgtPaid;
    if (unmet > 1 || c.last.preNmpaInsolvent) return { survived: false, preAccess: !!c.last.preNmpaInsolvent, failAge: m.ctx.ageSelf0 + t, terminalNet: 0, terminal: 0, lifetimeTax: tax };
    for (let i = 0; i < 4; i++) real[i] = Math.exp(Math.log(1 + c.real[i]) + c.volEff[i] * zs[t]) - 1;
    F.grow(c, t, s, real);
  }
  const total = s[0] + s[1] + s[2];
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, preAccess: false, failAge: m.ctx.ageSelf0 + m.ctx.totalYears, terminalNet: 0, terminal: 0, lifetimeTax: tax };
  return { survived: true, preAccess: false, failAge: null, terminalNet: Math.max(0, total - s[0] * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax: tax };
}

/* The solved plan on one path, choosing each year's move from the value function at the true position. */
function runSolvedPath(r, zs) {
  const { m, c } = r;
  const s = vecOf(m, M.initialState(m));
  const real = new Float64Array(4);
  let tax = 0;
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    const ai = chooseAction(r, s, t);
    const unmet = F.flow(c, t, ai, s);
    tax += c.last.taxPaid + c.last.cgtPaid;
    if (unmet > 1 || c.last.preNmpaInsolvent) return { survived: false, preAccess: !!c.last.preNmpaInsolvent, failAge: m.ctx.ageSelf0 + t, terminalNet: 0, terminal: 0, lifetimeTax: tax };
    for (let i = 0; i < 4; i++) real[i] = Math.exp(Math.log(1 + c.real[i]) + c.volEff[i] * zs[t]) - 1;
    F.grow(c, t, s, real);
  }
  const total = s[0] + s[1] + s[2];
  if (m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor) return { survived: false, preAccess: false, failAge: m.ctx.ageSelf0 + m.ctx.totalYears, terminalNet: 0, terminal: 0, lifetimeTax: tax };
  return { survived: true, preAccess: false, failAge: null, terminalNet: Math.max(0, total - s[0] * m.ctx.pensionDeathTaxRate), terminal: total, lifetimeTax: tax };
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
    failures: fails.length
  };
}

/* Which of a menu the app's own picker chooses, on the given paths. */
function pickFixed(c, menu, paths) {
  const cands = menu.map((a, ai) => ({ id: ai, label: a.label, stats: statsOf(paths.map(zs => runFixedPath(c, ai, zs))) }));
  const picked = E.explainPick(cands, { priorities: E.DEFAULT_PRIORITIES });
  return { ai: picked.winner.id, label: picked.winner.label, searchStats: picked.winner.stats };
}

/* Paired survival difference and its standard error, from the discordant paths. */
function paired(a, b) {
  let n10 = 0, n01 = 0;
  for (let i = 0; i < a.length; i++) { if (a[i].survived && !b[i].survived) n10++; if (!a[i].survived && b[i].survived) n01++; }
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
  const r = solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum, coords: COORDS, shares: SHARES });
  const solvedRs = held.map(zs => runSolvedPath(r, zs));
  const sameRs = held.map(zs => runFixedPath(cSame, same.ai, zs));
  const appRs = held.map(zs => runFixedPath(cApp, app.ai, zs));
  const S = statsOf(solvedRs), Fs = statsOf(sameRs), A = statsOf(appRs);

  const verdict = (fixedStats) => E.explainPick([{ id: 'solver', stats: S }, { id: 'fixed', stats: fixedStats }], { priorities: E.DEFAULT_PRIORITIES }).winner.id;
  const out = {
    tag, id: sc.id, name: sc.name, years: years + 1, points: POINTS, coords: r.meta.points, held: HELD, seedSearch, seedHeld, solveMs: r.meta.ms, ms: Date.now() - t0,
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
if (mode === 'reduce') {
  const tag = process.argv[3] || 'exp';
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
