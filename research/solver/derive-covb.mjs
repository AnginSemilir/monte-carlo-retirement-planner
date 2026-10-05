// COV-B-STEP's power and cost (predictions/diag-covb.md), from PMAP's records (results-pmap.txt and results/diagpmap: the same
// unit, households, seed 7002 and 2,000 paths a world) and the reducer's own items() (reduce-covb.mjs):
//   1. item 3's reads: PMAP's supported step reads per household (its stepsup lines, every world) and their measured weight on
//      unsupported nodes at 6 share points against the coverage node's (the change COV makes is where that weight sits); and,
//      from PMAP's logs (results/diagpmap), each household's step reads by year (stepsup and stepuns), the last step year's
//      count being item 3's reads before the same-move filter (amended before launch: item 3 reads the last step year);
//   2. items 1 and 2: the outcome per household through items() for k lost-and-saved pairs a household (0, 5, 15, 40, 80 of
//      6,000) at a net change of 0, at BASE survival 90% (the 0.5 margin) and 97% (the 0.25 margin);
//   3. item 3: the exact sign test's Holm-adjusted p at PMAP's read counts when a share q of the changed reads moves down
//      (q 0.5, 0.52, 0.55, 0.6, 0.8), and the share of reads COV changes taken as PMAP's share carrying unsupported weight;
//   4. the cost: PMAP's solve and forward seconds per household (its solve and world lines), a solve and a forward run an arm,
//      the fixed-policy run as one more forward run, ORDER and CORD on S370 as a fourth and fifth arm, the controls as S126;
//      each with no other job on the cores (the light lane quiet: the deep review of 5 Oct 01:49 UK measured a light job
//      roughly halving the main batch).
//   node research/solver/derive-covb.mjs > research/solver/results-derive-covb.txt
import { readFileSync, readdirSync } from 'node:fs';
import { items, PANEL, UNITS, armsOf } from './reduce-covb.mjs';
import { signTest, holm } from './stats.mjs';

const pm = readFileSync(new URL('./results-pmap.txt', import.meta.url), 'utf8');
// 1. the step reads: rows "  <id> <world> stepsup | <reads> <clusters> | ... | <measured> | ..."
const reads = {}, weight = {};
for (const m of pm.matchAll(/^ {2}(\S.*?)\s+(\d) stepsup \|\s+(\d+)\s+(\d+) \| [\d.]+ [\d.]+ \| ([\d.]+) \| .*\| ([\d.]+) [-\d.]+ [\d.]+$/gm)) {
  const id = m[1].trim(); reads[id] = (reads[id] || 0) + Number(m[3]); (weight[id] ||= []).push([Number(m[5]), Number(m[6])]);
}
if (PANEL.some(id => !reads[id])) { console.error(`derive-covb: no stepsup rows for ${PANEL.filter(id => !reads[id]).join(', ')} in results-pmap.txt`); process.exit(1); }
console.log('1. ITEM 3\'S READS (results-pmap.txt, every world): supported step reads; mean unsupported weight at 6 share points and with the coverage node');
for (const id of PANEL) console.log(`  ${id.padEnd(10)} reads ${reads[id]} | weight at 6 ${weight[id].map(x => x[0].toFixed(4)).join(', ')} | with the node ${weight[id].map(x => x[1].toFixed(4)).join(', ')}`);

// 1b. step reads by year from PMAP's logs ("pmap <unit> world <k> year <t> stepsup|stepuns: reads <n>")
const DP = new URL('./results/diagpmap/', import.meta.url), byYear = {};
for (const f of readdirSync(DP).filter(f => /^case\d+\.txt$/.test(f))) {
  let id = null;
  for (const l of readFileSync(new URL(f, DP), 'utf8').split('\n')) {
    const c = /^(\S.*?)\s+case \| unit /.exec(l); if (c) { id = c[1].trim(); continue; }
    const y = /^\s+pmap \S+ world \d+ year (\d+) step(?:sup|uns): reads (\d+)/.exec(l); if (y && id) { const o = (byYear[id] ||= {}); o[y[1]] = (o[y[1]] || 0) + Number(y[2]); }
  }
}
export const LAST_READS = {};
console.log('\n1b. STEP READS BY YEAR (results/diagpmap, every world, stepsup and stepuns): item 3 reads the last step year');
for (const id of PANEL) {
  const o = byYear[id]; if (!o) { console.error(`derive-covb: no step reads by year for ${id} in results/diagpmap`); process.exit(1); }
  const ys = Object.keys(o).map(Number).sort((a, b) => a - b), last = ys[ys.length - 1]; LAST_READS[id] = o[last];
  console.log(`  ${id.padEnd(10)} ${ys.map(y => `year ${y}: ${o[y]}`).join(', ')} | last step year ${last}: ${o[last]} reads`);
}

// 2. items 1 and 2 through items(): built files with k lost and k saved a household (net 0) at 6,000 paths
const N = 6000;
const fileWith = (k, surv) => {
  const S = Math.round(surv * N), base = Array.from({ length: N }, (_, j) => (j < S ? 1 : 0)), out = base.slice();
  for (let j = 0; j < k; j++) out[j] = 0; for (let j = 0; j < k; j++) out[S + j] = 1;
  return { base, out };
};
console.log('\n2. ITEMS 1 AND 2 at 6,000 paths: k lost and k saved a household (net 0), through reduce-covb.mjs items()');
for (const surv of [0.9, 0.97]) for (const k of [0, 5, 15, 40, 80]) {
  const files = {};
  const one = { read: [1], claim: [0], same: [1] };
  for (const id of PANEL) { const f = fileWith(k, surv); files[id] = { arms: { BASE: { survived: f.base }, TAX: { survived: f.out }, COV: { survived: f.out } }, fixed: { t: [1], k: [0], kind: [1], sup: [1], last: 1, arms: { BASE: one, TAX: one, COV: { read: [0], claim: [0], same: [1] } } } }; }
  const r = items(files);
  console.log(`  BASE ${(100 * surv).toFixed(0)}% k ${String(k).padStart(2)}: item 1 ${r.one.v} (${r.one.rows.map(x => `${x.id} [${x.lo.toFixed(3)}, ${x.hi.toFixed(3)}] ${x.outcome}`).join('; ')})`);
}

// 3. item 3: the sign test at the last step year's read counts (1b), a share of the reads changed (PMAP's share carrying
// unsupported weight at 6 points, results-pmap.txt: 1.0000 on every supported step read of these four), q of them down; the
// same-move filter removes the reads where COV's chooser moves differently (its share NOT CHECKED: the preflight prints it)
console.log('\n3. ITEM 3: the exact sign test, Holm over the 4, at the last step year\'s read counts with every read changed and a share q down');
for (const q of [0.5, 0.51, 0.52, 0.55, 0.6, 0.8]) {
  const ps = PANEL.map(id => { const n = LAST_READS[id], pos = Math.round(q * n); return signTest([...Array(pos).fill(1), ...Array(n - pos).fill(-1)]).p; });
  const ph = holm(ps);
  console.log(`  q ${q.toFixed(2)}: Holm p ${PANEL.map((id, i) => `${id} ${ph[i].toExponential(2)}`).join(', ')} -> ${ph.every(p => p < 0.05) && q > 0.5 ? 'every household shown' : 'not every household shown'}`);
}

// 4. the cost from PMAP's own seconds
const D = new URL('./results/diagpmap/', import.meta.url), cost = {};
for (const f of readdirSync(D).filter(f => /^case\d+\.txt$/.test(f))) {
  let id = null;
  for (const l of readFileSync(new URL(f, D), 'utf8').split('\n')) {
    const c = /^(\S.*?)\s+case \| unit /.exec(l); if (c) { id = c[1].trim(); cost[id] = { solve: 0, fwd: 0 }; continue; }
    const s = /^\s+solve \S+: secs (\d+)/.exec(l); if (s && id) cost[id].solve += Number(s[1]);
    const w = /^\s+world \S+ \d z \S+: paths \d+ secs (\d+)/.exec(l); if (w && id) cost[id].fwd += Number(w[1]);
  }
}
console.log('\n4. THE COST (PMAP\'s solve and forward seconds a household; an arm a solve and a forward run, the fixed-policy run one more forward run; the light lane quiet)');
let tot = 0, longest = 0; const jobs = [];
for (const id of UNITS) {
  const c = cost[id === 'S126 all-ISA' ? 'S126' : id]; if (!c) { console.error(`derive-covb: no PMAP seconds for ${id}`); process.exit(1); }
  const arms = armsOf(id).length, secs = arms * (c.solve + c.fwd) + c.fwd;
  tot += secs; longest = Math.max(longest, secs); jobs.push(secs);
  console.log(`  ${id.padEnd(14)} solve ${c.solve} s, forward ${c.fwd} s; ${arms} arms and the fixed run: ${(secs / 3600).toFixed(2)} core-hours`);
}
// the batch runs the jobs longest first on four cores (batch-covb.sh): each job starts on the first core free
const ends = [0, 0, 0, 0];
for (const j of jobs.slice().sort((a, b) => b - a)) { const c = ends.indexOf(Math.min(...ends)); ends[c] += j; }
console.log(`  total ${(tot / 3600).toFixed(1)} core-hours; the longest job ${(longest / 3600).toFixed(2)} hours; on four cores, longest first, ${(Math.max(...ends) / 3600).toFixed(1)} hours (NOT CHECKED: readerTax's and coverage's own cost and the fixed run's extra chooser calls at every reader year, measured in the preflight; a light job beside it roughly doubles the wall time)`);
