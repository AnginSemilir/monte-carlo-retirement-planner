/*
 * REDUCER FOR THE CALIBRATION CHECK (PLAN.md finding M16). Reads results/calibration/<id>.json.gz, pools
 * the (forecast, outcome) pairs of every household, and prints the calibration curve with a standard error
 * clustered by path (visits on one path share its outcome, so a plain binomial error would be too small).
 * Also writes results/calibration/curve.json for the chart.
 *
 *   node research/solver/reduce-calibration.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'results/calibration');
const edges = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99, 0.995, 0.999, 1.0000001];
const binOf = f => { for (let i = 0; i < edges.length - 1; i++) if (f < edges[i + 1]) return i; return edges.length - 2; };
const files = readdirSync(DIR).filter(f => /^S\d+\.json\.gz$/.test(f)).sort();

function curve(recs) {
  const B = edges.slice(0, -1).map((lo, i) => ({ lo, hi: Math.min(1, edges[i + 1]), n: 0, f: 0, ok: 0, paths: new Map() }));
  let pathKey = 0;
  for (const rec of recs) {
    const { t, forecast, ok } = rec.visits;
    let prevT = Infinity;
    for (let k = 0; k < t.length; k++) {
      if (t[k] <= prevT) pathKey++;            // a path's visits run t, t+1, ...: a reset starts the next path
      prevT = t[k];
      const f = Math.min(1, Math.max(0, forecast[k])), b = B[binOf(f)];
      b.n++; b.f += f; b.ok += ok[k];
      const e = b.paths.get(pathKey) || { n: 0, ok: 0 }; e.n++; e.ok += ok[k]; b.paths.set(pathKey, e);
    }
  }
  return B.filter(b => b.n).map(b => {
    const p = b.ok / b.n;
    let v = 0; for (const e of b.paths.values()) v += (e.ok - p * e.n) ** 2;   // cluster-robust variance of the mean
    return { lo: b.lo, hi: b.hi, n: b.n, paths: b.paths.size, forecast: b.f / b.n, realised: p, se: Math.sqrt(v) / b.n };
  });
}

const recs = files.map(f => JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()));
const pct = x => (100 * x).toFixed(2).padStart(7);
const print = (label, rows) => {
  console.log(label);
  console.log('  forecast bin         visits   paths   forecast   realised   gap (realised - forecast)');
  for (const r of rows) console.log(`  ${pct(r.lo)}-${pct(r.hi)}  ${String(r.n).padStart(7)} ${String(r.paths).padStart(7)}  ${pct(r.forecast)}    ${pct(r.realised)}   ${(100 * (r.realised - r.forecast)).toFixed(2).padStart(6)} +/- ${(100 * r.se).toFixed(2)}`);
};
const pooled = curve(recs);
let nv = 0, sf = 0, so = 0; recs.forEach(r => { r.visits.forecast.forEach((f, k) => { nv++; sf += Math.min(1, Math.max(0, f)); so += r.visits.ok[k]; }); });
print(`ALL ${recs.length} HOUSEHOLDS POOLED - ${nv.toLocaleString()} visits`, pooled);
console.log(`  visit-weighted: mean forecast ${pct(sf / nv)}   realised ${pct(so / nv)}   gap ${(100 * (so - sf) / nv).toFixed(2)}`);
console.log('\nYEAR 0 - the headline number each household would be shown');
for (const r of recs) {
  const y0 = r.visits.forecast.filter((_, k) => r.visits.t[k] === 0);
  const f = y0.reduce((a, b) => a + b, 0) / y0.length;
  console.log(`  ${r.id}  table ${pct(f)}   simulated ${pct(r.survived)}   gap ${(100 * (r.survived - f)).toFixed(2)}`);
}
console.log('\nPER HOUSEHOLD (bins with 200+ visits)');
const per = recs.map(r => ({ id: r.id, rows: curve([r]) }));
for (const h of per) print(h.id, h.rows.filter(x => x.n >= 200));

// monotonicity among well-filled pooled bins: a later bin realising less than an earlier one beyond 2 se
const wf = pooled.filter(r => r.n >= 1000);
const breaks = [];
for (let i = 1; i < wf.length; i++) if (wf[i].realised < wf[i - 1].realised - 2 * Math.hypot(wf[i].se, wf[i - 1].se)) breaks.push(`${pct(wf[i - 1].lo)} -> ${pct(wf[i].lo)}`);
console.log(`\nMONOTONE in well-filled bins: ${breaks.length ? 'NO - ' + breaks.join(', ') : 'yes'}`);
writeFileSync(join(DIR, 'curve.json'), JSON.stringify({ pooled, per, visits: nv, meanForecast: sf / nv, meanRealised: so / nv,
  year0: recs.map(r => { const y0 = r.visits.forecast.filter((_, k) => r.visits.t[k] === 0); return { id: r.id, table: y0.reduce((a, b) => a + b, 0) / y0.length, simulated: r.survived }; }) }));
