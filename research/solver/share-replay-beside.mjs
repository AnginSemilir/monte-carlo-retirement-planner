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
 *      short) and CGT-BILL (paths running short by under £1,000 in all, and those paying tax in the failing year);
 * and, for the reviewer's second round (reviews/2026-11-16-read-share-replay-2.md):
 *   A2. each comparison's sampling error at each variant's pooled control-loss rate (a comparison with no control lost has
 *       a plug-in sd of nought, finding 3);
 *   H. the first year the rule's move is apart from TODAY's at the same state on the lost, the saved and the control paths
 *      (finding 2: whether the parting says anything of the lost paths);
 *   I. the paths both arms lose by comparison, a control path's weight, L's distance from half in sds, and the eight
 *      comparisons other than S061-dbpart's two: their lost paths that run short and TODAY's tiers' keeping of them;
 *   J. the floor levels each arm's moves take at the same states (the levels under 0.81 in the rule's record, the rule's and
 *      TODAY's), by comparison (finding 5: the rounding the first print's mechanism read as a step).
 * The sampling error: each category replayed short of its whole count read as a sample of it, without replacement (a
 * category replayed whole carries none); the first paths in path order stand for the rest.
 *   node research/solver/share-replay-beside.mjs [dir] > research/solver/results-share-replay-beside.txt
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPARISONS, REC_FIELDS } from './share-replay.mjs';
import { load, gate, gainOf, mechanismOf, equityOf, VARIANTS, LEVEL_TOL, stepApart } from './reduce-share-replay.mjs';

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

console.log('\nA2. Each comparison\'s sampling error at each variant\'s pooled control-loss rate over the ten (the lost and saved categories at their own rates)');
{ const rate = Object.fromEntries(VARIANTS.map(v => { let n = 0, lost = 0; for (const c of flags) { const g = gainOf(c, v); n += g.n.ctrl; lost += g.n.ctrl - g.k.ctrl; } return [v, { r: lost / n, lost, n }]; }));
  console.log(`  the pooled control-loss rates: ${VARIANTS.map(v => `${v} ${rate[v].lost} of ${rate[v].n}`).join(', ')}`);
  const V = (N, n, p) => (n > 0 && N > n ? N * N * p * (1 - p) / n * (N - n) / (N - 1) : 0);
  for (const c of flags) console.log(`  ${name(c).padEnd(18)} ${VARIANTS.map(v => { const g = gainOf(c, v), pl = g.n.lost ? g.k.lost / g.n.lost : 0, ps = g.n.saved ? (g.n.saved - g.k.saved) / g.n.saved : 0;
    const sd = Math.sqrt(V(c.pop.lost, g.n.lost, pl) + V(c.pop.saved, g.n.saved, ps) + V(c.pop.ctrl, g.n.ctrl, rate[v].r)) / c.pop.lost; return `${v} ${f(g.gain / c.pop.lost)} (sd ${sd.toFixed(2)})`; }).join(', ')}`); }

console.log('\nH. The first year the rule\'s move is apart from TODAY\'s at the same state (a level a step of the menu apart, the split or a tier), before the failure where the rule fails, by category');
{ const firstAll = (c, i) => { const fy = c.runs.X.failYear[i], end = fy >= 0 ? fy : c.Y;
    for (let t = 0; t < end; t++) { if (stepApart(at(c, 'X', i, t, 'level'), at(c, 'X', i, t, 'oLevel'))) return t; if (['split', 'penA', 'isaA', 'penB', 'isaB'].some((k, j) => at(c, 'X', i, t, k) !== at(c, 'X', i, t, ['oSplit', 'oPenA', 'oIsaA', 'oPenB', 'oIsaB'][j]))) return t; } return -1; };
  for (const cat of ['lost', 'saved', 'ctrl']) { let n = 0, y0 = 0; for (const c of flags) c.order.forEach(([k], i) => { if (k !== cat) return; n++; if (firstAll(c, i) === 0) y0++; });
    console.log(`  ${cat === 'ctrl' ? 'controls' : cat}: apart in year 0 on ${y0} of ${n} (${(100 * y0 / n).toFixed(1)}%)`); } }

console.log('\nI. The paths both arms lose, a control path\'s weight, L\'s distance from half, and the other eight comparisons\' paths that run short');
{ console.log(`  the paths both arms lose (not replayed), by comparison: ${flags.map(c => `${name(c)} ${c.pop.neither}`).join(', ')}`);
  const w = flags.map(c => c.pop.ctrl / gainOf(c, 'L').n.ctrl);
  console.log(`  a lost control path counts ${Math.min(...w).toFixed(1)} to ${Math.max(...w).toFixed(1)} paths (the both-keep count over the 200 replayed)`);
  const lost = flags.reduce((x, c) => x + c.pop.lost, 0), gs = flags.map(c => gainVar(c, 'L')), g = gs.reduce((x, y) => x + y.gain, 0), sd = Math.sqrt(gs.reduce((x, y) => x + y.var, 0)) / lost;
  console.log(`  L recovers ${f(g / lost, 4)} (sd ${sd.toFixed(3)}): half is ${((0.5 - g / lost) / sd).toFixed(1)} sds away`);
  const rest = flags.filter(c => c.unit !== 'S061-dbpart'); let n = 0, kr = 0;
  for (const c of rest) c.order.forEach(([cat], i) => { if (cat === 'lost' && kindOf(c, i) === 'short') { n++; if (c.runs.R.survived[i]) kr++; } });
  console.log(`  the eight comparisons other than S061-dbpart's two: ${n} lost paths replayed that run short, TODAY's tiers keeping ${kr}`); }

console.log('\nJ. The levels under 0.81 each arm\'s moves take at the same states on the replayed paths (the rule\'s record): the rule\'s, then TODAY\'s');
for (const c of flags) {
  const lv = { x: new Set(), o: new Set() };
  c.order.forEach((_, i) => { for (let t = 0; t < c.Y; t++) { const a = at(c, 'X', i, t, 'level'), b = at(c, 'X', i, t, 'oLevel'); if (a < 0.81) lv.x.add(a.toFixed(6)); if (b < 0.81) lv.o.add(b.toFixed(6)); } });
  console.log(`  ${name(c).padEnd(18)} the rule ${[...lv.x].sort().join(', ') || 'none'}; TODAY ${[...lv.o].sort().join(', ') || 'none'}`);
}
