/*
 * K2-K4 REDUCER (PLAN.md Phase K). Reads results/k2-*, k3-*, k4-* and prints, per screen, every household's
 * outcomes beside the baseline cell, then the medians, and for K4 the SPREAD: each outcome at each estate
 * weight as a fraction of the household's own swing from weight 0 to the largest weight.
 *
 *   node research/solver/reduce-k.mjs [k2|k3|k4]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const only = process.argv[2] || null;
const load = (tag) => { const d = join(R, tag); if (!existsSync(d)) return {}; const o = {}; for (const f of readdirSync(d).filter(f => /^S\d+\.json$/.test(f))) { const r = JSON.parse(readFileSync(join(d, f), 'utf8')); o[r.id] = r; } return o; };
const med = (a) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const years = (r, v) => v / r.target;                       // pounds to years of target spending

/* the figures reported for a cell: survival, fully funded, years below, depth, total cut, years above,
   spending delivered, lifetime tax (k), median and unlucky-tenth end pot in years of spending */
function row(r) {
  const S = r.solver, cut = S.belowYearsMean * (1 - (S.levelWhenBelowMean || 1));
  return { surv: S.floorRate, full: S.fullyFundedRate, below: S.belowYearsMean, depth: S.levelWhenBelowMean, cut, above: S.aboveTargetYearsMean, spend: S.meanLevelMedian, tax: S.medianLifetimeTax / 1e3, pot: years(r, S.medianTerminalNet), p10: years(r, S.p10TerminalNet) };
}
const HEAD = '     survival  full   below  depth  cut   above  spend   tax(k)  pot(yrs) p10(yrs)';
const line = (label, x) => `  ${label.padEnd(12)} ${f(x.surv).padStart(6)} ${f(x.full).padStart(6)} ${f(x.below).padStart(6)} ${f(x.depth, 2).padStart(6)} ${f(x.cut, 2).padStart(5)} ${f(x.above).padStart(6)} ${f(x.spend, 3).padStart(6)} ${f(x.tax, 0).padStart(7)} ${f(x.pot).padStart(8)} ${f(x.p10).padStart(8)}`;

function screen(title, cells) {
  const data = cells.map(([label, tag]) => [label, load(tag)]);
  const ids = [...new Set(data.flatMap(([, d]) => Object.keys(d)))].sort();
  if (!ids.length) { console.log(`\n${title}: no results yet`); return; }
  console.log(`\n${title}\n${HEAD}`);
  for (const id of ids) {
    console.log(` ${id}`);
    for (const [label, d] of data) if (d[id]) console.log(line(label, row(d[id])));
  }
  console.log(' MEDIAN over households');
  for (const [label, d] of data) {
    const rs = ids.filter(id => d[id]).map(id => row(d[id]));
    const m = {}; for (const k of Object.keys(rs[0] || {})) m[k] = med(rs.map(x => x[k]));
    if (rs.length) console.log(line(`${label} (${rs.length})`, m));
  }
}

if (!only || only === 'k2') screen('K2  MINIMUM END POT (years of target spending) - prediction: trimming stays near 1.6-4 years below at every P; the cost lands on two or three households', [['P = 0', 'k2-pot0'], ['P = 1', 'k2-pot1'], ['P = 3', 'k2-pot3'], ['P = 5', 'k2-pot5']]);
if (!only || only === 'k3') screen('K3  RAISE CAP - prediction: a cap of 1.1 roughly halves the extra spending; blocking lifts end pots by more than the 5-8 years spent', [['cap 1.2', 'k3-cap1.2'], ['cap 1.1', 'k3-cap1.1'], ['cap 1.0', 'k3-cap1']]);
if (!only || only === 'k4') {
  const W = ['0', '0.01', '0.03', '0.1', '0.3'];
  for (const sc of ['1', '4']) {
    const cells = W.map(w => [`w ${w}`, w === '0' ? 'k4-w0' : `k4-w${w}-s${sc}`]);
    screen(`K4  ESTATE CREDIT above the minimum pot, scale s = ${sc} x opening wealth`, cells);
    // the spread: each outcome as a fraction of the household's own swing from w = 0 to w = 0.3
    const data = cells.map(([, tag]) => load(tag));
    const ids = Object.keys(data[0]).filter(id => data.every(d => d[id]));
    if (!ids.length) continue;
    console.log(`  SPREAD (fraction of each household's 0-to-0.3 swing reached at each weight; gate: equal steps ~ equal steps)`);
    for (const key of ['pot', 'surv', 'spend']) {
      const fr = W.map((_, j) => med(ids.map(id => { const a = row(data[0][id])[key], b = row(data[W.length - 1][id])[key], x = row(data[j][id])[key]; return Math.abs(b - a) > 1e-9 ? (x - a) / (b - a) : NaN; })));
      console.log(`    ${key.padEnd(6)} ${fr.map((x, j) => `w ${W[j]}: ${f(x, 2)}`).join('   ')}`);
    }
  }
}
