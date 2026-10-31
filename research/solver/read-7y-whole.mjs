/*
 * 7Y'S TRACES, READ FURTHER (for the deep review on both reads, the 00:38 row; reported, grade C, no test): on each case the
 * tier state against the product by the realised whole score (reduce-7t.mjs scorePaths, configured as read-7z-whole.mjs
 * configures it), split into survival, estate and the rest; the paths whose spend level or tier differs in any year; the
 * run lines' switches, years below the plan's tier and estate; the six legs' saved and lost pooled, with the exact two-sided
 * sign test (a pooling the registration did not name: reported, not read); on S126 and S194 the swaps by the whole score and
 * the tier codes held by year.
 * The logs and traces pass reduce-7y.mjs's own stamp gate, fair-test gate and trace check first.
 *   node research/solver/read-7y-whole.mjs > research/solver/results-7y-whole.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode, scorePaths, paired } from './reduce-7t.mjs';
import { cells, survivedShare } from './reduce-7v.mjs';
import { binomUpperHalf } from './stats.mjs';
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
// the scale and cap each case's objective uses, from its product solve's joint line
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
console.log('7Y\'S TRACES, READ FURTHER (results/diag7y through reduce-7y\'s gates; reported, grade C, no test)\n');
console.log('THE TIER STATE AGAINST THE PRODUCT, EACH CASE (whole score = survival + estate + the rest, paired, per 100 paths)');
let sv = 0, ls = 0, estateUp = 0, derisksLess = 0, switchesMore = 0;
for (const [id, arm] of Y.CASE_ARMS) {
  const P = trace(id, arm, 'PRODUCT'), u = unitOf(id, arm, 'PRODUCT'), ran = u.solves.PRODUCT.ran, sc = SC[`${id}|${arm}`];
  const cfg = { lambda: Number(Y.field(ran, 'lambda')), floor: Math.min(...Y.field(ran, 'levels').split(',').map(Number)), scale: sc.scale, cap: sc.cap };
  cfg.spendYears = Array.from({ length: P.Y }, (_, t) => { for (let i = 0; i < P.N; i++) if (P.level[i * P.Y + t] > 0) return true; return false; });
  const part = (T, which) => { const o = new Float64Array(T.N); for (let i = 0; i < T.N; i++) { const alive = T.survived[i] === 1; o[i] = which === 's' ? (alive ? 100 : 0) : (alive ? 100 * 0.02 * Math.min(T.wealth[i * T.Y + T.Y - 1], cfg.cap) / cfg.scale : 0); } return o; };
  const sP = scorePaths(P, cfg);
  const labels = id === 'S126' || id === 'S194' ? ['TS', 'TS-TIER', 'TS-REST'] : ['TS'];
  for (const label of labels) {
    const B = trace(id, arm, label), w = paired(sP, scorePaths(B, cfg)), ps = paired(part(P, 's'), part(B, 's')), pe = paired(part(P, 'e'), part(B, 'e'));
    let diff = 0; for (let i = 0; i < P.N; i++) for (let t = 0; t < P.Y; t++) if (P.level[i * P.Y + t] !== B.level[i * B.Y + t] || P.tier[i * P.Y + t] !== B.tier[i * B.Y + t]) { diff++; break; }
    const k = cells(P.survived, B.survived), rP = u.runs.PRODUCT, rB = unitOf(id, arm, label).runs[label];
    console.log(`  ${`${id} (${arm.toLowerCase()})`.padEnd(20)} ${label.padEnd(8)} whole ${f3(w.d)} +/- ${w.se.toFixed(3)} = survival ${f3(ps.d)}, estate ${f3(pe.d)}, the rest ${f3(w.d - ps.d - pe.d)} | saved/lost ${k.saved}/${k.lost} | paths differing ${diff} | switches ${rP.changes} -> ${rB.changes}, below the plan's tier ${rP.tier} -> ${rB.tier}, estate ${rP.estate} -> ${rB.estate}`);
    if (label !== 'TS') continue;
    sv += k.saved; ls += k.lost; if (rB.estate > rP.estate) estateUp++; if (rB.tier < rP.tier) derisksLess++; if (rB.changes > rP.changes) switchesMore++;
  }
}
const n = sv + ls, p = Math.min(1, 2 * binomUpperHalf(Math.max(sv, ls), n));
console.log(`\nTHE SIX TS LEGS POOLED (not registered; reported): saved ${sv}, lost ${ls}; exact two-sided sign test p ${p.toExponential(2)}`);
console.log(`  of the six cases the tier state has: a larger mean estate ${estateUp}; fewer path-years below the plan's tier ${derisksLess}; more switches a path ${switchesMore}`);
console.log('\nTHE TIER CODES HELD BY YEAR (pension x 4 + ISA; share of the 8,000 paths, per cent)');
for (const [id, arm] of [['S126', 'READER'], ['S194', 'OFF']]) {
  const P = trace(id, arm, 'PRODUCT'), T = trace(id, arm, 'TS');
  const tc = (X, t) => { const c = {}; for (let i = 0; i < X.N; i++) { const v = X.tier[i * X.Y + t]; c[v] = (c[v] || 0) + 1; } return Object.keys(c).sort((a, b) => a - b).map(k => `${k}:${(100 * c[k] / X.N).toFixed(1)}`).join(' '); };
  for (const t of [0, 1, 2, 5, 10, 20]) console.log(`  ${id.padEnd(5)} year ${String(t).padStart(2)}  PRODUCT ${tc(P, t).padEnd(34)} TS ${tc(T, t)}`);
}
