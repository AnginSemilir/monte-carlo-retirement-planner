/*
 * O97 OVER ADOPT-PI'S SAVED TRACES: where PCLSI's extra lifetime tax and smaller mean terminal net sit (the deep review
 * after ADOPT-PI, deep-review-log.md 5 Oct 05:46 UK: the loss is on the luckiest paths, where the score weighs nothing).
 * A reading of files already gated (reduce-adoptpi.mjs's gate is run first here, with the fair-gate stamp check; rule 3):
 * per household of DP's panel at death tax 0, paired by path, SNAP against PCLSI -
 *   - the mean change in lifetime tax and terminal net, the median of the per-path net change, the change in the median
 *     terminal net, and the change in the mean capped net min(net, cap) the score reads (cap = 4 x the opening account
 *     balances, solve.js beqCap);
 *   - the tail (paths whose net ends above the cap in either arm): its share of the paths, its signed share of the summed
 *     net and tax changes, and the body's mean tax change;
 *   - within the tail, the paths SNAP held 9 years or more in the band [0.6, 0.75) of the allowance: their count and mean
 *     tax and net change;
 *   - the five paths with the largest |net change| and their signed share of the summed net change (S370's outlier).
 * Planted: a built pair whose whole change sits on tail paths must read a tail share of 1 and a body tax change of 0.
 *   node research/solver/derive-o97.mjs > research/solver/results-derive-o97.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { parse, gate, loadTraces, stampOf, PANEL, PRED } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagadoptpi');
// the households' opening balances: audit-adoptpi.mjs l.48-78, copied (its module runs its units on import)
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant({ a0 = 0.85, scale = 1 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) }; return a; });
  return p;   // the bridge length and the one-off cost move no balance
}
const BUILT = { 'share 0.50': { a0: 0.5 }, 'share 0.70': { a0: 0.7 }, 'share 0.78': { a0: 0.78 }, 'share 0.90': { a0: 0.9 }, 'share 0.95': { a0: 0.95 }, 'bridge 0': {}, 'bridge 1': {}, 'bridge 4': {}, 'bridge 6': {}, 'wealth x0.5': { scale: 0.5 }, 'wealth x2': { scale: 2 }, 'bridge 4+cost': {} };
const opening = id => { const p = BUILT[id] ? variant(BUILT[id]) : all.find(s => s.id === id).plan; return p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0); };

const median = a => { const s = Float64Array.from(a).sort(), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const holdYears = (t, j) => { let y = 0; for (let k = 0; k < t.Y; k++) { const x = t.u[j * t.Y + k]; if (x === x && x >= 0.6 && x < 0.75) y++; } return y; };
export function split(S, P, cap) {
  const N = S.N, dT = new Float64Array(N), dN = new Float64Array(N); let sT = 0, sN = 0, tT = 0, tN = 0, nTail = 0, bT = 0, nBody = 0, cS = 0, cP = 0;
  const long = { n: 0, t: 0, net: 0 };
  for (let j = 0; j < N; j++) {
    dT[j] = P.tax[j] - S.tax[j]; dN[j] = P.net[j] - S.net[j]; sT += dT[j]; sN += dN[j];
    cS += Math.min(S.net[j], cap); cP += Math.min(P.net[j], cap);
    if (S.net[j] > cap || P.net[j] > cap) { nTail++; tT += dT[j]; tN += dN[j]; if (holdYears(S, j) >= 9) { long.n++; long.t += dT[j]; long.net += dN[j]; } } else { nBody++; bT += dT[j]; }
  }
  const order = Array.from({ length: N }, (_, j) => j).sort((a, b) => Math.abs(dN[b]) - Math.abs(dN[a])), top5 = order.slice(0, 5).reduce((x, j) => x + dN[j], 0);
  return { N, mT: sT / N, mN: sN / N, medDN: median(dN), dMed: median(P.net) - median(S.net), dCap: (cP - cS) / N, tailShare: nTail / N, tailNet: sN ? tN / sN : NaN, tailTax: sT ? tT / sT : NaN, bodyT: nBody ? bT / nBody : 0, long: { n: long.n, t: long.n ? long.t / long.n : 0, net: long.n ? long.net / long.n : 0 }, top5: sN ? top5 / sN : NaN };
}

// planted: the whole change on tail paths
{
  const N = 10, Y = 2, mk = (net, tax) => ({ N, Y, net: Float32Array.from(net), tax: Float32Array.from(tax), u: new Float32Array(N * Y) });
  const S = mk([1, 1, 1, 1, 1, 10, 10, 10, 10, 10], Array(10).fill(5)), P = mk([1, 1, 1, 1, 1, 8, 8, 8, 8, 8], [5, 5, 5, 5, 5, 7, 7, 7, 7, 7]);
  const r = split(S, P, 4);
  if (!(r.tailShare === 0.5 && r.tailNet === 1 && r.tailTax === 1 && r.bodyT === 0 && r.medDN === -1)) { console.log(`PLANTED CHECK FAILED: ${JSON.stringify(r)}`); process.exit(1); }
}

const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
const units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units);
const tr = bad.length ? { bad } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
if (bad.length || tr.bad.length) { console.log(`GATE: FAILED\n  ${[...bad, ...(tr.bad || [])].join('\n  ')}`); process.exit(1); }
const f0 = x => (Number.isFinite(x) ? x.toFixed(0) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
console.log('GATE: passed (reduce-adoptpi.mjs\'s gate and the fair-gate stamp check over results/diagadoptpi); planted: passed');
console.log('O97 OVER ADOPT-PI\'S TRACES: PCLSI less SNAP per path at death tax 0, paired; the cap = 4 x the opening account balances (solve.js beqCap); the tail = paths ending above the cap in either arm');
console.log('  household        cap        mean tax   mean net    median dnet  dmedian net  dcapped net | tail paths  tail share of dnet  of dtax | body mean dtax | tail & SNAP hold >= 9 y: paths  mean dtax  mean dnet | top 5 share of dnet');
for (const id of PANEL) {
  const f = tr.files, S = f[`${id} SNAP`], P = f[`${id} PCLSI`], cap = 4 * opening(id), r = split(S, P, cap);
  console.log(`  ${id.padEnd(16)} ${f0(cap).padStart(9)}  ${f0(r.mT).padStart(9)}  ${f0(r.mN).padStart(9)}  ${f0(r.medDN).padStart(11)}  ${f0(r.dMed).padStart(11)}  ${f0(r.dCap).padStart(11)} | ${f2(r.tailShare).padStart(10)}  ${f2(r.tailNet).padStart(17)}  ${f2(r.tailTax).padStart(7)} | ${f0(r.bodyT).padStart(14)} | ${String(r.long.n).padStart(30)}  ${f0(r.long.t).padStart(9)}  ${f0(r.long.net).padStart(9)} | ${f2(r.top5)}`);
}
