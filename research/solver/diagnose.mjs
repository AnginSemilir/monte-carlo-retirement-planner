/*
 * LOSS LEDGER: why did the solver lose one household? (plan Phase 2c.4)
 *
 *   node research/solver/diagnose.mjs <bandIndex> [points] [held] [seedSearch] [seedHeld]
 *
 * Re-solves one household exactly as experiment.mjs did, runs solver and the same-menu fixed winner on
 * the same held-out paths, and prints: the moves the solver took by year, mean tax and pots by year for
 * both arms, the score the value function gave each move at the opening position, and the year-by-year
 * story of the first discordant paths (solver failed, fixed survived).
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, chooseAction, buildActions } from '../../src/solver/solve.js';
import { vecOf, readValues } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const k = Number(process.argv[2]);
const POINTS = Number(process.argv[3] || 20), HELD = Number(process.argv[4] || 3000);
const seedSearch = Number(process.argv[5] || 7001), seedHeld = Number(process.argv[6] || 7002);
const SEARCH_PATHS = 200;
const WEIGHTS = [0.011257, 0.222076, 0.533333, 0.222076, 0.011257];

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync(join(HERE, 'results', `band-70-98-${seedSearch}.json`), 'utf8'));
const sc = singles[band[k].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(sc.plan)), config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const T = m.ctx.totalYears;
const menu = buildActions();
const c = F.compile(m, menu);
const fmt = (x) => (Math.round(x / 1000) + 'k').padStart(7);

console.log(`${sc.id} ${sc.name}  age ${m.ctx.ageSelf0}, ${T + 1} years, spend ${plan.spending.targetSpend}, lump ${m.ctx.fullLumpSum}`);
console.log(`opening: pen ${fmt(m.ctx.accounts.find(a => a.type === 'pension')?.balance || 0)} isa ${fmt(m.ctx.accounts.find(a => a.type === 'isa')?.balance || 0)} gia ${fmt(m.ctx.accounts.find(a => a.type === 'other')?.balance || 0)} cash ${fmt(m.ctx.accounts.find(a => a.type === 'cash')?.balance || 0)}`);

// the fixed winner, chosen as the experiment chose it
const search = E.pathsForSeed(seedSearch, SEARCH_PATHS, T);
const held = E.pathsForSeed(seedHeld, HELD, T);
function runFixed(ai, zs, rec) {
  const s = vecOf(m, M.initialState(m)); const real = new Float64Array(4); let tax = 0;
  for (let t = 0; t <= T; t++) {
    const unmet = F.flow(c, t, ai, s); tax += c.last.taxPaid + c.last.cgtPaid;
    if (rec) rec(t, ai, s, c.last);
    if (unmet > 1 || c.last.preNmpaInsolvent) return { survived: false, failT: t, tax };
    for (let i = 0; i < 4; i++) real[i] = Math.exp(Math.log(1 + c.real[i]) + c.volEffAt[t][i] * zs[t]) - 1;
    F.grow(c, t, s, real);
  }
  return { survived: true, failT: null, tax, terminal: s[0] + s[1] + s[2] };
}
const cands = menu.map((a, ai) => { const rs = search.map(zs => runFixed(ai, zs)); return { id: ai, label: a.label, stats: statsOf(rs) }; });
function statsOf(rs) {
  const n = rs.length, ok = rs.filter(r => r.survived);
  const q = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : 0; };
  const term = rs.map(r => r.survived ? r.terminal : 0);
  return { successRate: 100 * ok.length / n, preNmpaFailRate: 0, medianTerminal: q(term, 0.5), medianTerminalNet: q(term, 0.5), p10Terminal: q(term, 0.1), p10TerminalNet: q(term, 0.1), medianLifetimeTax: q(rs.map(r => r.tax), 0.5) };
}
const picked = E.explainPick(cands, { priorities: E.DEFAULT_PRIORITIES });
const fixedAi = picked.winner.id;
console.log(`fixed winner (same menu, app's picker): [${fixedAi}] ${menu[fixedAi].label}\n`);

// the solve
const t0 = Date.now();
const r = solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum });
console.log(`solved: ${POINTS} points in ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);

// every move scored at the opening position
{
  const s0 = vecOf(m, M.initialState(m));
  const post = new Float64Array(7), grown = new Float64Array(7), rd = new Float64Array(3);
  const rows = [];
  for (let ai = 0; ai < menu.length; ai++) {
    post.set(s0); const unmet = F.flow(c, 0, ai, post);
    let sv = 0, bq = 0, rs = 0;
    if (!(unmet > 1 || c.last.preNmpaInsolvent)) for (let zi = 0; zi < 5; zi++) { grown.set(post); F.grow(c, 0, grown, r.nodeReal[zi]); readValues(r.g, r.lsurv[1], r.beq[1], grown, rd, r.lresil[1]); sv += WEIGHTS[zi] * rd[0]; bq += WEIGHTS[zi] * rd[1]; rs += WEIGHTS[zi] * rd[2]; }
    rows.push({ ai, sv, rs, bq, score: sv + r.wR * rs + r.wB * bq, tax: c.last.taxPaid });
  }
  rows.sort((a, b) => b.score - a.score);
  console.log('the value function at the opening position, best first (survival / resilience / bequest / score / year-0 tax):');
  for (const x of rows.slice(0, 6).concat(rows.filter(x => x.ai === fixedAi)))
    console.log(`  [${String(x.ai).padStart(2)}] ${x.sv.toFixed(4)} / ${x.rs.toFixed(4)} / ${fmt(x.bq)} / ${x.score.toFixed(4)} / ${fmt(x.tax)}  ${menu[x.ai].label}${x.ai === fixedAi ? '   <- fixed winner' : ''}`);
  console.log();
}

// both arms on the held-out paths, with per-year records
const yrs = T + 1;
const mk = () => ({ n: new Float64Array(yrs), tax: new Float64Array(yrs), draw: new Float64Array(yrs), pen: new Float64Array(yrs), isa: new Float64Array(yrs), txb: new Float64Array(yrs) });
const S = mk(), X = mk();
const moveCount = Array.from({ length: yrs }, () => new Map());
const acc = (A, t, s, last) => { A.n[t]++; A.tax[t] += last.taxPaid + last.cgtPaid; A.draw[t] += last.drawdown || 0; A.pen[t] += s[0]; A.isa[t] += s[1]; A.txb[t] += s[2]; };
function runSolved(zs, rec) {
  const s = vecOf(m, M.initialState(m)); const real = new Float64Array(4); let tax = 0;
  for (let t = 0; t <= T; t++) {
    const ai = chooseAction(r, s, t); const unmet = F.flow(c, t, ai, s); tax += c.last.taxPaid + c.last.cgtPaid;
    if (rec) rec(t, ai, s, c.last);
    if (unmet > 1 || c.last.preNmpaInsolvent) return { survived: false, failT: t, tax };
    for (let i = 0; i < 4; i++) real[i] = Math.exp(Math.log(1 + c.real[i]) + c.volEffAt[t][i] * zs[t]) - 1;
    F.grow(c, t, s, real);
  }
  return { survived: true, failT: null, tax, terminal: s[0] + s[1] + s[2] };
}
const solvedRs = held.map(zs => runSolved(zs, (t, ai, s, last) => { acc(S, t, s, last); moveCount[t].set(ai, (moveCount[t].get(ai) || 0) + 1); }));
const fixedRs = held.map(zs => runFixed(fixedAi, zs, (t, s2, s, last) => acc(X, t, s, last)));
const sS = solvedRs.filter(x => x.survived).length, sX = fixedRs.filter(x => x.survived).length;
const n10 = held.filter((_, i) => solvedRs[i].survived && !fixedRs[i].survived).length;
const n01 = held.filter((_, i) => !solvedRs[i].survived && fixedRs[i].survived).length;
console.log(`held-out: solver ${(100 * sS / HELD).toFixed(1)}  fixed ${(100 * sX / HELD).toFixed(1)}  solver-only survives ${n10}, fixed-only survives ${n01}`);
console.log(`median lifetime tax: solver ${fmt(median(solvedRs.map(x => x.tax)))}  fixed ${fmt(median(fixedRs.map(x => x.tax)))}\n`);
function median(a) { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; }

console.log('by year (means over paths still alive that year): solver move mix | tax S/F | pension draw S/F | pension S/F | ISA S/F | taxable S/F');
for (let t = 0; t <= T; t++) {
  const top = [...moveCount[t].entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([ai, n]) => `${ai}:${Math.round(100 * n / S.n[t])}%`).join(' ');
  const mS = (A, f) => A.n[t] ? A[f][t] / A.n[t] : 0;
  console.log(`  ${String(m.ctx.ageSelf0 + t).padStart(3)}  ${top.padEnd(22)} | ${fmt(mS(S, 'tax'))}/${fmt(mS(X, 'tax'))} | ${fmt(mS(S, 'draw'))}/${fmt(mS(X, 'draw'))} | ${fmt(mS(S, 'pen'))}/${fmt(mS(X, 'pen'))} | ${fmt(mS(S, 'isa'))}/${fmt(mS(X, 'isa'))} | ${fmt(mS(S, 'txb'))}/${fmt(mS(X, 'txb'))}`);
}
console.log('\nmoves by index:'); menu.forEach((a, i) => console.log(`  [${String(i).padStart(2)}] ${a.label}`));

// the first two discordant paths, year by year
const disc = held.map((zs, i) => i).filter(i => !solvedRs[i].survived && fixedRs[i].survived).slice(0, 2);
for (const i of disc) {
  console.log(`\ndiscordant path #${i}: solver fails at ${m.ctx.ageSelf0 + solvedRs[i].failT}, fixed survives. age | z | solver move, tax, pen/isa/txb | fixed tax, pen/isa/txb`);
  const rowsS = [], rowsX = [];
  runSolved(held[i], (t, ai, s, last) => rowsS.push({ ai, tax: last.taxPaid + last.cgtPaid, pen: s[0], isa: s[1], txb: s[2] }));
  runFixed(fixedAi, held[i], (t, ai, s, last) => rowsX.push({ tax: last.taxPaid + last.cgtPaid, pen: s[0], isa: s[1], txb: s[2] }));
  for (let t = 0; t < rowsS.length; t++) {
    const a = rowsS[t], b = rowsX[t] || {};
    console.log(`  ${String(m.ctx.ageSelf0 + t).padStart(3)} | ${held[i][t].toFixed(2).padStart(5)} | [${String(a.ai).padStart(2)}] ${fmt(a.tax)} ${fmt(a.pen)}/${fmt(a.isa)}/${fmt(a.txb)} | ${fmt(b.tax || 0)} ${fmt(b.pen || 0)}/${fmt(b.isa || 0)}/${fmt(b.txb || 0)}`);
  }
}
