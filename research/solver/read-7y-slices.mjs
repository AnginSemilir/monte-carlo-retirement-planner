/*
 * 7Y BY SLICE (the deep review on both reads, deep-review-log.md 28 Sep 02:38 UK; its read-only script made a committed
 * one; reported, grade C, no test): the tier state against the product on each case by long-run shift slice (saved and
 * lost, the whole score and the estate per 100 of all paths, the path-years in which the tier state holds a riskier or a
 * safer tier than the product - a lower tier code is riskier, the plan's tier being 0); the lost paths (their shift, the
 * year each failed, -1 the end pot, and whether the tier state held a riskier tier first); on S194 the paths holding the
 * middle pair 1/1 in year 1; on S126 and S194 each solve's table less its simulated survival.
 * The logs and traces pass reduce-7y.mjs's own stamp gate, fair-test gate and trace check first.
 *   node research/solver/read-7y-slices.mjs > research/solver/results-7y-slices.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode, scorePaths, Z_BINS, binOf } from './reduce-7t.mjs';
import { survivedShare } from './reduce-7v.mjs';
import { pathsForSeed } from '../engine.mjs';
import * as Y from './reduce-7y.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), D = join(HERE, 'results', 'diag7y');
const logs = Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
const units = Object.values(logs).flatMap(Y.parse);
if (Y.UNITS.some(([id, a, k]) => !units.some(u => u.id === id && u.arm === a && u.kind === k && u.done))) { console.log('INCOMPLETE'); process.exit(1); }
requireFairLogs(logs, Y.PRED);
const bad = Y.gate(units);
if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
const ST = { code: st[1], audit: st[2], prediction: st[3], sha: st[4] };
const SC = {};
for (const text of Object.values(logs)) {
  let cur = null;
  for (const line of text.split('\n')) {
    const c = /^(\S.*?)\s+case \| unit (\S+)\/[PTS] \|/.exec(line); if (c) { cur = `${c[1].trim()}|${c[2]}`; continue; }
    const j = /^\s+joint (\S+)\/PRODUCT: \S+ switchMargin \S+ scale (\S+) cap (\S+)/.exec(line); if (j && cur) SC[cur] = { scale: Number(j[2]), cap: Number(j[3]) };
  }
}
const unitOf = (id, arm, label) => units.find(u => u.id === id && u.arm === arm && u.runs[label]);
const trace = (id, arm, label) => {
  const u = unitOf(id, arm, label), j = JSON.parse(gunzipSync(readFileSync(join(D, Y.traceName(id, arm, label)))).toString());
  if (!Y.traceAgrees(j, ST, arm, label, u.runs[label].sim)) { console.log(`the trace ${id} ${arm} ${label} is not the log's`); process.exit(1); }
  const X = decode(j);
  if (Math.abs(survivedShare(X.survived) - u.runs[label].sim) > Y.SIM_TOL) { console.log(`the trace ${id} ${arm} ${label}: survived paths differ from the run line`); process.exit(1); }
  return X;
};
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
let shifts = null, draws0 = null;
const tot = { lost: 0, neg: 0, deep: 0, endPot: 0, riskierFirst: 0, netRiskier: 0, netSafer: 0, same: 0 };
console.log('7Y BY SLICE (results/diag7y through reduce-7y\'s gates; reported, grade C, no test)\n');
for (const [id, arm] of Y.CASE_ARMS) {
  const P = trace(id, arm, 'PRODUCT'), T = trace(id, arm, 'TS'), u = unitOf(id, arm, 'PRODUCT'), ran = u.solves.PRODUCT.ran, sc = SC[`${id}|${arm}`];
  // each case's own paths: pathsForSeed's draws depend on the horizon, so they are drawn per case (a first version drew them
  // once, from S126's horizon, and mis-sliced every other case: found checking the deep review's figures, 28 Sep)
  { const zs = pathsForSeed(7002, P.N, P.Y - 1); shifts = zs.map(z => z[P.Y]); draws0 = zs.map(z => z[0]); }
  const cfg = { lambda: Number(Y.field(ran, 'lambda')), floor: Math.min(...Y.field(ran, 'levels').split(',').map(Number)), scale: sc.scale, cap: sc.cap };
  cfg.spendYears = Array.from({ length: P.Y }, (_, t) => { for (let i = 0; i < P.N; i++) if (P.level[i * P.Y + t] > 0) return true; return false; });
  const sP = scorePaths(P, cfg), sT = scorePaths(T, cfg);
  console.log(`${id} (${arm.toLowerCase()}): the tier state against the product, by long-run shift`);
  for (let k = 0; k < Z_BINS.length; k++) {
    let n = 0, sv = 0, ls = 0, dw = 0, de = 0, riskier = 0, safer = 0;
    for (let i = 0; i < P.N; i++) {
      if (binOf(shifts[i]) !== k) continue;
      n++; if (T.survived[i] && !P.survived[i]) sv++; if (!T.survived[i] && P.survived[i]) ls++;
      dw += sT[i] - sP[i];
      const eP = P.survived[i] ? Math.min(P.wealth[i * P.Y + P.Y - 1], cfg.cap) : 0, eT = T.survived[i] ? Math.min(T.wealth[i * T.Y + T.Y - 1], cfg.cap) : 0;
      de += 100 * 0.02 * (eT - eP) / cfg.scale;
      for (let t = 0; t < P.Y; t++) { const a = P.tier[i * P.Y + t], b = T.tier[i * T.Y + t]; if (b < a) riskier++; else if (b > a) safer++; }
    }
    console.log(`   ${Z_BINS[k][0].padEnd(15)} n ${String(n).padStart(5)}  saved/lost ${sv}/${ls}  whole ${f3(dw / P.N)}  estate ${f3(de / P.N)}  path-years the tier state riskier ${riskier}, safer ${safer}`);
  }
  const lost = { n: 0, neg: 0, deep: 0, endPot: 0, riskierFirst: 0, netRiskier: 0, netSafer: 0, same: 0, years: {} };
  for (let i = 0; i < P.N; i++) {
    if (!(!T.survived[i] && P.survived[i])) continue;
    lost.n++; if (shifts[i] < 0) lost.neg++; if (shifts[i] < -Math.sqrt(3)) lost.deep++; if (T.failYear[i] === -1) lost.endPot++;
    lost.years[T.failYear[i]] = (lost.years[T.failYear[i]] || 0) + 1;
    const fy = T.failYear[i] >= 0 ? T.failYear[i] : T.Y; let r = 0, s = 0;
    for (let t = 0; t < fy; t++) { const a = P.tier[i * P.Y + t], b = T.tier[i * T.Y + t]; if (b < a) r++; else if (b > a) s++; }
    if (r > 0) lost.riskierFirst++; if (r > s) lost.netRiskier++; else if (s > r) lost.netSafer++; else if (r === 0 && s === 0) lost.same++;
  }
  console.log(`   the ${lost.n} paths lost: shift below 0 ${lost.neg}, below -sqrt 3 ${lost.deep}; failed at the end pot ${lost.endPot}; the tier state riskier in some year before failing ${lost.riskierFirst}; net riskier ${lost.netRiskier}, net safer ${lost.netSafer}, the same tiers ${lost.same}; fail year (-1 the end pot) ${JSON.stringify(lost.years)}`);
  if (!(id === 'S360')) for (const k of Object.keys(tot)) tot[k] += k === 'lost' ? lost.n : lost[k];
  if (id === 'S194') {
    const idx = [...Array(T.N).keys()].filter(i => T.tier[i * T.Y + 1] === 5);
    const pc = {}; for (const i of idx) { const v = P.tier[i * P.Y + 1]; pc[v] = (pc[v] || 0) + 1; }
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    let dw = 0; for (const i of idx) dw += sT[i] - sP[i];
    console.log(`   S194: ${idx.length} paths hold 1/1 in year 1 under the tier state; the product's tier code on them in year 1 ${JSON.stringify(pc)}; survived: the tier state ${idx.filter(i => T.survived[i]).length}, the product ${idx.filter(i => P.survived[i]).length}; the whole score on them ${f3(dw / idx.length)} a path (x100); the year-0 draw's mean on them ${mean(idx.map(i => draws0[i])).toFixed(3)}, on the rest ${mean([...Array(T.N).keys()].filter(i => T.tier[i * T.Y + 1] !== 5).map(i => draws0[i])).toFixed(3)}`);
  }
}
console.log(`\nS126, S194, SHARE 0.95 AND BRIDGE 4 TOGETHER: lost ${tot.lost}; shift below 0 ${tot.neg}, below -sqrt 3 ${tot.deep}; at the end pot ${tot.endPot}; the tier state riskier in some year first ${tot.riskierFirst}; net riskier ${tot.netRiskier}, net safer ${tot.netSafer}, the same tiers ${tot.same}`);
console.log('\nTHE TABLE LESS ITS SIMULATED SURVIVAL (points; the solve and run lines)');
for (const [id, arm] of [['S126', 'READER'], ['S194', 'OFF']]) {
  const row = ['PRODUCT', 'TS', 'H0'].map(tag => { const u = units.find(v => v.id === id && v.arm === arm && v.solves[tag] && v.solves[tag].table && v.runs[tag]); return `${tag} ${f3(Number(u.solves[tag].table) - u.runs[tag].sim)}`; });
  console.log(`   ${id} (${arm.toLowerCase()}): ${row.join('  ')}`);
}
