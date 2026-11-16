/*
 * BESIDE THE SHARE REPLAY'S READ (D110; results-share-replay.txt, MIXED). EXPLORATORY, written after the read for the
 * reviewer at the read (reviews/2026-11-16-read-share-replay.md), deciding nothing. From the replay's own files:
 *   A. each comparison's recovery by each variant, over its own lost paths, with its sampling error;
 *   B. the pooled recoveries with each comparison left out in turn;
 *   C. the pooled gains' three terms (the lost paths kept, the saved and the both-keep paths lost) and their sampling error;
 *   D. each comparison's lost paths by kind (running short, below the minimum pot), and each variant's keeping of each;
 *   E. each comparison's equity (the rule's tiers against TODAY's at the same states, on the lost paths' windows, as the read
 *      takes it) and its level against TODAY's at the same states, on every year before the failure, by kind;
 *   F. each comparison's mechanism (as the read takes it, a step of the menu), beside L's recovery;
 *   G. two open items' questions the record answers, as leads: FD-RAISE (a 110% year in the three years before a path runs
 *      short) and CGT-BILL (paths running short by under £1,000 in all, and those paying tax in the failing year).
 * The sampling error: each category replayed short of its whole count read as a sample of it, without replacement (a
 * category replayed whole carries none); the first paths in path order stand for the rest.
 *   node research/solver/share-replay-beside.mjs [dir] > research/solver/results-share-replay-beside.txt
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPARISONS, REC_FIELDS } from './share-replay.mjs';
import { load, gate, gainOf, mechanismOf, equityOf, VARIANTS, LEVEL_TOL } from './reduce-share-replay.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const D = load(process.argv[2] || join(HERE, 'results', 'share-replay')), P = gate(D);
if (P.length) { console.error(`share-replay-beside: the gate refuses: ${P.join('; ')}`); process.exit(1); }
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const flags = COMPARISONS.filter(c => !c[2]).map(([r, u]) => D[`${r} ${u}`]), name = c => `${c.rule} ${c.unit}`;
const at = (c, run, i, t, field) => c.rec[run][(i * c.Y + t) * REC_FIELDS.length + REC_FIELDS.indexOf(field)];
// a variant's gain on one comparison and its variance from sampling the categories replayed short of their whole count
function gainVar(c, v) {
  const g = gainOf(c, v), V = (N, n, p) => (n > 0 && N > n ? N * N * p * (1 - p) / n * (N - n) / (N - 1) : 0);
  const pl = g.n.lost ? g.k.lost / g.n.lost : 0, ps = g.n.saved ? (g.n.saved - g.k.saved) / g.n.saved : 0, pc = g.n.ctrl ? (g.n.ctrl - g.k.ctrl) / g.n.ctrl : 0;
  const terms = { lost: g.n.lost ? c.pop.lost * pl : 0, saved: g.n.saved ? -c.pop.saved * ps : 0, ctrl: g.n.ctrl ? -c.pop.ctrl * pc : 0 };
  return { gain: g.gain, terms, var: V(c.pop.lost, g.n.lost, pl) + V(c.pop.saved, g.n.saved, ps) + V(c.pop.ctrl, g.n.ctrl, pc) };
}
console.log(`BESIDE THE SHARE REPLAY'S READ (EXPLORATORY, written after the read, deciding nothing): ${flags.length} flagged comparisons and the mirror`);

console.log('\nA. Each comparison\'s recovery by each variant over its own lost paths (its gain over its lost count), with its sampling error (sd)');
for (const c of flags) console.log(`  ${name(c).padEnd(18)} lost ${String(c.pop.lost).padStart(4)}: ${VARIANTS.map(v => { const g = gainVar(c, v); return `${v} ${f(g.gain / c.pop.lost)} (sd ${(Math.sqrt(g.var) / c.pop.lost).toFixed(3)})`; }).join(', ')}`);
{ const tk = flags.map(c => gainVar(c, 'TK').gain / c.pop.lost);
  console.log(`  TK at 0.35 or more on ${tk.filter(x => x >= 0.35).length} of ${tk.length}; under a quarter on ${flags.filter((c, i) => tk[i] < 0.25).map(name).join(', ') || 'none'}`);
  console.log('  an sd of nought: no path of a category replayed short of its whole count was lost (or, of the lost, missed), so the binomial estimate is nought; a lower bound, not a certainty'); }

console.log('\nB. The pooled recoveries with each comparison left out in turn');
for (const c of flags) {
  const rest = flags.filter(x => x !== c), lost = rest.reduce((s, x) => s + x.pop.lost, 0);
  console.log(`  without ${name(c).padEnd(18)} ${VARIANTS.map(v => `${v} ${f(rest.reduce((s, x) => s + gainOf(x, v).gain, 0) / lost, 4)}`).join(', ')}`);
}

console.log('\nC. The pooled gains (paths) and their three terms: the lost paths kept, the saved paths lost, the both-keep paths lost; the sampling error');
{ const lost = flags.reduce((s, c) => s + c.pop.lost, 0);
  for (const v of VARIANTS) {
    const gs = flags.map(c => gainVar(c, v)), sum = k => gs.reduce((s, g) => s + g.terms[k], 0), gain = gs.reduce((s, g) => s + g.gain, 0), sd = Math.sqrt(gs.reduce((s, g) => s + g.var, 0));
    const ctrlLost = flags.reduce((s, c) => { const g = gainOf(c, v); return s + g.n.ctrl - g.k.ctrl; }, 0);
    console.log(`  ${v.padEnd(2)} ${f(gain, 1)} paths (sd ${sd.toFixed(1)}): kept ${f(sum('lost'), 1)}, the saved ${f(sum('saved'), 1)}, the both-keep ${f(sum('ctrl'), 1)} (${ctrlLost} control paths lost of ${flags.reduce((s, c) => s + gainOf(c, v).n.ctrl, 0)}); recovers ${f(gain / lost, 4)} (sd ${(sd / lost).toFixed(3)})`);
  } }

console.log('\nD. Each comparison\'s lost paths replayed by kind, and each variant\'s keeping of each: running short / below the minimum pot');
const kindOf = (c, i) => (c.runs.X.unmet[i] > 1 ? 'short' : 'pot');
for (const c of flags) {
  const n = { short: 0, pot: 0 }, k = Object.fromEntries(VARIANTS.map(v => [v, { short: 0, pot: 0 }]));
  c.order.forEach(([cat], i) => { if (cat !== 'lost') return; const kd = kindOf(c, i); n[kd]++; for (const v of VARIANTS) if (c.runs[v].survived[i]) k[v][kd]++; });
  console.log(`  ${name(c).padEnd(18)} ${n.short} / ${n.pot}: ${VARIANTS.map(v => `${v} ${k[v].short} / ${k[v].pot}`).join(', ')}`);
}

console.log('\nE. Each comparison: the equity on the lost paths\' windows (the read\'s measure: places of TIER_ORDER a slot, above nought the rule holds more), and the rule\'s level less TODAY\'s at the same states over every year before the failure (of target), by kind');
for (const c of flags) {
  const e = equityOf(c), lv = { short: [0, 0], pot: [0, 0] };
  c.order.forEach(([cat], i) => { if (cat !== 'lost') return; const kd = kindOf(c, i), fy = c.runs.X.failYear[i]; for (let t = 0; t < fy; t++) { lv[kd][0] += at(c, 'X', i, t, 'level') - at(c, 'X', i, t, 'oLevel'); lv[kd][1]++; } });
  const m = x => (x[1] ? `${f(x[0] / x[1], 4)} over ${x[1]} years` : 'none');
  console.log(`  ${name(c).padEnd(18)} equity ${e.n ? f(e.sum / e.n, 3) : '-'} over ${e.n} slot-years; the level, running short ${m(lv.short)}, below the minimum pot ${m(lv.pot)}`);
}
{ const rest = flags.filter(c => c.unit !== 'S061-dbpart'), e = rest.reduce((a, c) => { const x = equityOf(c); return { n: a.n + x.n, sum: a.sum + x.sum }; }, { n: 0, sum: 0 });
  console.log(`  the eight comparisons other than S061-dbpart's two: equity ${f(e.sum / e.n, 3)} a slot over ${e.n} slot-years; negative on ${rest.filter(c => { const x = equityOf(c); return x.sum < 0; }).length} of ${rest.length}`); }

console.log(`\nF. Each comparison's mechanism (as the read takes it: TODAY a step of the menu lower, levels within ${LEVEL_TOL} one step), beside L's recovery`);
for (const c of flags) { const m = mechanismOf(c); console.log(`  ${name(c).padEnd(18)} on ${m.shown} of ${m.paths} lost paths (${(100 * m.shown / m.paths).toFixed(1)}%); L ${f(gainOf(c, 'L').gain / c.pop.lost)}, TK ${f(gainOf(c, 'TK').gain / c.pop.lost)}`); }

console.log('\nG. Two open items\' questions, as leads, from the rule\'s record on the lost paths that run short (X)');
{ let n = 0, raise3 = 0, raise1 = 0, small = 0, smallTax = 0;
  for (const c of flags) c.order.forEach(([cat], i) => {
    if (cat !== 'lost' || kindOf(c, i) !== 'short') return;
    n++; const fy = c.runs.X.failYear[i];
    const hi = t => t >= 0 && at(c, 'X', i, t, 'level') >= 1.1 - LEVEL_TOL;
    if ([fy - 1, fy - 2, fy - 3].some(hi)) raise3++;
    if (hi(fy - 1)) raise1++;
    if (c.runs.X.unmet[i] < 1000) { small++; if (at(c, 'X', i, fy, 'tax') > 0) smallTax++; }
  });
  console.log(`  FD-RAISE: of ${n} lost paths that run short, ${raise3} have a year at 110% of target in the three before the failing year, ${raise1} in the year just before`);
  console.log(`  CGT-BILL: ${small} run short by under £1,000 in all; ${smallTax} of them pay tax (income and gains together) in the failing year`); }
