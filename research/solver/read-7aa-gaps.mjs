/*
 * 7AA'S YEAR-0 GAPS, READ FROM ITS SAVED OUTPUT (results-7aa.txt; a reading, not a new test): for every case and arm, the
 * year-0 gap at the estate weight 0 and 0.02 as printed, how far each sits above or below the product's switch margin
 * (0.001) in per cent, the pension tier each opens in at 1e-3, and whether the gap at W0 is at least the gap at W0.02 (the
 * prediction's grade-D premise, predictions/diag-7aa.md: with the pot's weight off a de-risk costs nothing in the objective,
 * so the tables should favour it at least as much as at 0.02), and TS+J's gap against TS's (the deep review after 7y predicted
 * at least 2 on S126 and S194). Then, for 7ab's registered legs (predictions/diag-7ab.md),
 * where the freed opening (margin 0 in year 0) must make the product's own year-0 pension move: the product already opens
 * the tier margin 0 opens (the chooser keeps the best move when it beats staying by more than the margin), or the gap is 0.
 * The gate: all ten case/weight blocks and all thirty arm lines must be found once, or the script refuses.
 *   node research/solver/read-7aa-gaps.mjs > research/solver/results-7aa-gaps.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = 'results-7aa.txt', text = readFileSync(join(HERE, SRC), 'utf8'), MARGIN = 0.001;
const rows = [];
let cur = null;
for (const l of text.split('\n')) {
  const h = /^(S126 \(reader\)|S194 \(off\)|bridge 4 \(reader\)|S360 \(reader\)|S360 \(off\)) at W(0|0\.02)$/.exec(l);
  if (h) { cur = { id: h[1], w: h[2] }; continue; }
  const m = cur && /^\s{2}(PRODUCT|TS\+J|TS)\s+.* gap (\S+) opens (\d) at 1e-3, (\d) at 0$/.exec(l);
  if (m) rows.push({ ...cur, arm: m[1], gap: Number(m[2]), open3: Number(m[3]), open0: Number(m[4]) });
  if (!l.trim()) cur = null;
}
const key = r => `${r.id}|${r.w}|${r.arm}`;
if (rows.length !== 30 || new Set(rows.map(key)).size !== 30) { console.log(`REFUSED: ${rows.length} arm lines, ${new Set(rows.map(key)).size} distinct, in ${SRC}; 7aa printed 30`); process.exit(1); }
const get = (id, w, arm) => rows.find(r => r.id === id && r.w === w && r.arm === arm);
const pct = g => (g === 0 ? 'gap 0' : `${g >= MARGIN ? '+' : ''}${(100 * (g / MARGIN - 1)).toFixed(2)}%`);
console.log(`source: ${SRC} sha256 ${createHash('sha256').update(text).digest('hex').slice(0, 16)}, its EVERY RUN lines (the year-0 gap and the opening pension tier at 1e-3 and at 0)`);
console.log(`percent = how far the gap sits from the switch margin ${MARGIN} (positive: above it, so the chooser opens the tier margin 0 opens)\n`);
console.log('THE GAPS BY WEIGHT, and the premise "W0 at least W0.02":');
const cases = [...new Set(rows.map(r => r.id))];
let holds = 0, fails = 0;
for (const id of cases) for (const arm of ['PRODUCT', 'TS', 'TS+J']) {
  const a = get(id, '0', arm), b = get(id, '0.02', arm);
  const verdict = a.gap === 0 && b.gap === 0 ? 'both 0' : a.gap >= b.gap ? 'holds' : 'FAILS';
  if (verdict === 'holds') holds++; if (verdict === 'FAILS') fails++;
  console.log(`   ${id.padEnd(18)} ${arm.padEnd(8)} W0 ${a.gap.toExponential(4).padStart(10)} (${pct(a.gap).padStart(8)}, opens ${a.open3})   W0.02 ${b.gap.toExponential(4).padStart(10)} (${pct(b.gap).padStart(8)}, opens ${b.open3})   premise ${verdict}`);
}
console.log(`   the premise holds on ${holds} and fails on ${fails} of the ${holds + fails} arm/case pairs with a gap\n`);
console.log("TS+J'S GAP AGAINST TS'S (the 02:38 deep review predicted at least 2 on S126 and S194):");
for (const id of ['S126 (reader)', 'S194 (off)', 'bridge 4 (reader)']) for (const w of ['0', '0.02']) {
  const j = get(id, w, 'TS+J'), t = get(id, w, 'TS');
  console.log(`   ${id.padEnd(18)} W${w.padEnd(5)} TS+J ${j.gap.toExponential(4)} / TS ${t.gap.toExponential(4)} = ${(j.gap / t.gap).toFixed(2)}`);
}
console.log('');
console.log("7AB'S LEGS WHERE THE FREED OPENING MUST MAKE THE PRODUCT'S YEAR-0 PENSION MOVE (the product already opens margin 0's tier, or the gap is 0):");
for (const id of cases) for (const w of ['0', '0.02']) {
  const p = get(id, w, 'PRODUCT'), same = p.gap === 0 || p.open3 === p.open0;
  console.log(`   ${id.padEnd(18)} W${w.padEnd(5)} product gap ${p.gap.toExponential(4).padStart(10)} opens ${p.open3} at 1e-3, ${p.open0} at 0  -> ${same ? 'FREED = PRODUCT in year 0' : 'the freed opening differs'}`);
}
