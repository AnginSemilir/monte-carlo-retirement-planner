/*
 * STEP 2'S READ (the external review's Part B, Step 2): per household, CAND against SHIP at estate weight 0.02, paired on
 * the 8,000 paths of the tuning seed 7002, on the code with all of Step 1 (batch-recheck.sh's traces), beside 7u's own
 * figure for that household (results-7u.txt, item 1, seed 7013, the code before Step 1) and its exact interval: does the
 * change sit inside 7u's interval? Exploratory; the review's rule: "If nothing moves by more than its 7u interval, record
 * that in one line and move on."
 *   node research/solver/recheck-7u.mjs [traceDir=research/solver/results/recheck7u] > research/solver/results-recheck-7u.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { survivalChange, survivalChangeU } from './stats.mjs';
import { decode } from './reduce-7t.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'recheck7u');
const text = readFileSync(join(HERE, 'results-7u.txt'), 'utf8');
// 7u's item 1 (the estate weight 0.02): its block runs from "1. survival at the estate weight 0.02" to the next numbered item
const from = text.indexOf('1. survival at the estate weight 0.02'), to = text.indexOf('\n2. ', from);
if (from < 0 || to < 0) throw new Error('recheck-7u: results-7u.txt has no item 1 at the estate weight 0.02');
const sevenU = {};
for (const m of text.slice(from, to).matchAll(/^ {5}(\S+(?: \S+)?)\s+(\d+) saved\/(\d+) lost of (\d+).*?change ([+-]?[\d.]+) \(exact ([+-]?[\d.]+) to ([+-]?[\d.]+);/gm)) {
  sevenU[m[1].trim()] = { saved: +m[2], lost: +m[3], N: +m[4], d: +m[5], lo: +m[6], hi: +m[7] };
}
const files = readdirSync(DIR).filter(f => f.endsWith('.json.gz'));
const load = f => { const j = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); return { j, ...decode(j) }; };
const byId = {};
for (const f of files) {
  const x = load(f);
  if (!/W0\.02$/.test(x.j.arm)) continue;
  (byId[x.j.id] = byId[x.j.id] || {})[x.j.arm.startsWith('CAND') ? 'cand' : 'ship'] = x;
}
console.log(`STEP 2'S RE-CHECK: CAND against SHIP at the estate weight 0.02, ${DIR}; paired on each household's paths, beside 7u's item 1`);
let outside = 0, n = 0;
for (const [id, u] of Object.entries(byId).sort()) {
  if (!u.cand || !u.ship) { console.log(`  ${id.padEnd(14)} incomplete: ${u.cand ? '' : 'no CAND '}${u.ship ? '' : 'no SHIP'}`); continue; }
  const N = u.cand.N;
  if (u.ship.N !== N || u.cand.j.seed !== u.ship.j.seed) throw new Error(`recheck-7u: ${id}'s arms ran different paths`);
  let a = 0, b = 0, c = 0, d = 0;   // a both survive, b SHIP only (lost), c CAND only (saved), d neither
  for (let i = 0; i < N; i++) { const s = u.ship.survived[i], k = u.cand.survived[i]; if (s && k) a++; else if (s) b++; else if (k) c++; else d++; }
  const ex = survivalChange(b, c, N), un = survivalChangeU(a, b, c, d), was = sevenU[id];
  const inside = was ? ex.d >= was.lo && ex.d <= was.hi : null;
  n++; if (inside === false) outside++;
  console.log(`  ${id.padEnd(14)} seed ${u.cand.j.seed}, code ${u.cand.j.stamp.code}: CAND ${(100 * (a + c) / N).toFixed(2)}% SHIP ${(100 * (a + b) / N).toFixed(2)}%; ${c} saved/${b} lost of ${N}: change ${ex.d >= 0 ? '+' : ''}${ex.d.toFixed(3)} (exact ${ex.lo.toFixed(3)} to ${ex.hi.toFixed(3)}; unconditional ${un.lo.toFixed(3)} to ${un.hi.toFixed(3)})` +
    (was ? ` | 7u: ${was.d >= 0 ? '+' : ''}${was.d.toFixed(3)} (exact ${was.lo.toFixed(3)} to ${was.hi.toFixed(3)}); ${inside ? 'inside' : 'OUTSIDE'} 7u's interval` : ' | not in 7u\'s item 1'));
}
console.log(`VERDICT: ${n} households read; ${outside} moved outside 7u's interval`);
