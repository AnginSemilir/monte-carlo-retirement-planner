/*
 * WHY DOES HOLDING THE PLAN'S TIER DIFFER FROM THE PRODUCT? (PLAN.md O39; the plan-auditor's re-review of 7x's read,
 * BLOCKING 1). Pairs each 7x held-at-the-plan's-tier run (H00/M3) with the product's own arm at margin 1e-3 in 7v, on
 * the same 8,000 paths of seed 7002 (the reader for S126 and share 0.95, off for S194 and S360), each trace through its
 * own reducer's gate. Prints, per case: the paths each saves that the other loses; how often each opens away from tier 0
 * and how many path-years it holds a tier other than the plan's; and the spend level (percent of the target) the two take,
 * averaged over the paths still solvent, at years 0, 1, 2, 5, 10 and 20, with the share of solvent path-years each spends
 * below its target. Grade C: descriptive, one seed.
 *   node research/solver/pair-7x-held.mjs > research/solver/results-7x-pair.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import * as V from './reduce-7v.mjs';
import * as X from './reduce-7x.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const load = (dir, mod, pick) => {
  const D = join(HERE, 'results', dir);
  const logs = Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
  requireFairLogs(logs, mod.PRED);
  const units = Object.values(logs).flatMap(mod.parse), bad = mod.gate(units);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  if (bad.length) { console.log(`FAIR-TEST GATE (${dir}): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  return (id, label) => {
    const j = JSON.parse(gunzipSync(readFileSync(join(D, mod.traceName(id, label)))).toString());
    if (!mod.traceAgrees(j, ST, label, pick(units, id, label))) { console.log(`${dir}: the trace ${id} ${label} is not the log's`); process.exit(1); }
    return decode(j);
  };
};
const T7v = load('diag7v', V, (units, id, label) => units.find(u => u.id === id).runs[label].sim);
const T7x = load('diag7x', X, (units, id, label) => units.find(u => u.id === id && u.label === label).run.sim);
const N = X.N, YEARS = [0, 1, 2, 5, 10, 20];
console.log(`7X'S HELD PLAN TIER AGAINST THE PRODUCT, PAIRED (${N} paths of seed 7002; both gates passed; grade C)\n`);
for (const [id, arm] of [['S126', 'READER'], ['S194', 'OFF'], ['share 0.95', 'READER'], ['S360', 'OFF']]) {
  const P = T7v(id, `${arm}/1e-3`), H = T7x(id, `${arm}/H00/M3`);
  if (P.Y !== H.Y || P.N < N || H.N < N) { console.log(`ERROR: ${id} traces differ in shape`); process.exit(1); }
  const Y = P.Y;
  let hOnly = 0, pOnly = 0; for (let i = 0; i < N; i++) { if (H.survived[i] && !P.survived[i]) hOnly++; if (P.survived[i] && !H.survived[i]) pOnly++; }
  const tiers = T => { let open = 0, off = 0, yrs = 0; for (let i = 0; i < N; i++) { const last = T.failYear[i] >= 0 ? T.failYear[i] - 1 : Y - 1; if (T.tier[i * Y] !== 0) open++; for (let t = 0; t <= last; t++) { yrs++; if (T.tier[i * Y + t] !== 0) off++; } } return { open, off, yrs }; };
  const alive = (T, i, t) => T.failYear[i] < 0 || t < T.failYear[i];
  const lvl = (T, t) => { let s = 0, n = 0; for (let i = 0; i < N; i++) if (alive(T, i, t) && T.level[i * Y + t] > 0) { s += T.level[i * Y + t]; n++; } return n ? (s / n).toFixed(1) : '-'; };
  const cut = T => { let c = 0, n = 0; for (let i = 0; i < N; i++) for (let t = 0; t < Y; t++) if (alive(T, i, t) && T.level[i * Y + t] > 0) { n++; if (T.level[i * Y + t] < 100) c++; } return (100 * c / n).toFixed(1); };
  const tp = tiers(P), th = tiers(H);
  console.log(`${id} (${arm})`);
  console.log(`  paths the held run survives and the product does not: ${hOnly}; the other way: ${pOnly}`);
  console.log(`  opens away from tier 0: product ${tp.open}, held ${th.open}; solvent path-years away from tier 0: product ${tp.off} of ${tp.yrs}, held ${th.off} of ${th.yrs}`);
  console.log(`  spend level while solvent (percent of target), years ${YEARS.join(', ')}: product ${YEARS.map(t => lvl(P, t)).join(', ')}; held ${YEARS.map(t => lvl(H, t)).join(', ')}`);
  console.log(`  solvent path-years spent below target: product ${cut(P)}%, held ${cut(H)}%\n`);
}
