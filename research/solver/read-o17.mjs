/*
 * O17'S NARROWING AT 7E'S READ (the register's O17: "narrowed at 7e's read to bridge 4, the other three re-read exactly
 * there as noise-sized or not"; the sixty-third review, BLOCKING 1(d)). Reads the pairs lines of 7e's wave-1 logs, which
 * passed 7e's fair-test gate (results-7e.txt), and prints each fix against off on the same 1,000 held-out paths: paths
 * saved and lost, and the exact one-sided McNemar p for harm (stats.mjs). Reported, not a test: no margin, no Holm.
 *   node research/solver/read-o17.mjs [dir]   > research/solver/results-o17-7e.txt
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mcnemarHarmP } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'bridge7e');

// a case line starts with the case id, then its pairs line: "pairs V1-OFF s/l V2-OFF s/l ... READER-OFF s/l ..."
export function parse(text) {
  const out = [];
  let id = null;
  for (const line of text.split('\n')) {
    const c = /^(\S.*?)\s+a0 [\d.]+ B \d+ class/.exec(line);
    if (c) { id = c[1].trim(); continue; }
    const p = /^\s+pairs (.*)$/.exec(line);
    if (p && id) {
      const pairs = {};
      for (const m of p[1].matchAll(/([A-Z0-9]+-[A-Z0-9]+) (\d+)\/(\d+)/g)) pairs[m[1]] = { saved: +m[2], lost: +m[3] };
      out.push({ id, pairs });
      id = null;
    }
  }
  return out;
}

// PLANTED, before any real file (rule 6)
{
  const fake = 'S999             a0 0.85 B 2 class YES | OFF table 1\n                 pairs V1-OFF 0/2 V2-OFF 13/28 READER-OFF 1/0\n';
  const got = JSON.stringify(parse(fake));
  const want = '[{"id":"S999","pairs":{"V1-OFF":{"saved":0,"lost":2},"V2-OFF":{"saved":13,"lost":28},"READER-OFF":{"saved":1,"lost":0}}}]';
  if (got !== want) { console.log(`PLANTED CHECK FAILED: parse read ${got}`); process.exit(1); }
  if (parse('no case lines here').length !== 0) { console.log('PLANTED CHECK FAILED: parse invented a case'); process.exit(1); }
  if (!(Math.abs(mcnemarHarmP(8, 0) - 0.00390625) < 1e-12)) { console.log('PLANTED CHECK FAILED: 8 lost, 0 saved should give p = 0.5^8'); process.exit(1); }
}

const rows = [];
for (const k of [0, 1, 2, 3]) {
  const f = join(DIR, `part${k}.txt`);
  if (!existsSync(f)) { console.log(`INCOMPLETE - no ${f}`); process.exit(1); }
  rows.push(...parse(readFileSync(f, 'utf8')));
}
if (rows.length !== 24) { console.log(`INCOMPLETE - ${rows.length} wave-1 cases, not 24`); process.exit(1); }

console.log("O17 AT 7E'S READ: each fix against off, wave 1, 1,000 held-out paths of seed 7011 per case (7e's logs, which passed");
console.log("its fair-test gate: results-7e.txt). Reported, not a test: the exact one-sided p for harm, no margin, no Holm.\n");
console.log('case             ' + ['V1-OFF', 'V2-OFF', 'READER-OFF'].map(a => `${a.padEnd(10)} saved/lost  p harm`).join('   '));
for (const r of rows) {
  const cells = ['V1-OFF', 'V2-OFF', 'READER-OFF'].map(a => {
    const q = r.pairs[a];
    return q ? `${`${q.saved}/${q.lost}`.padStart(19)}  ${mcnemarHarmP(q.lost, q.saved).toFixed(4)}` : '                     -     ';
  });
  console.log(`${r.id.padEnd(16)} ${cells.join('   ')}`);
}
