/*
 * 7W: HOW MUCH OF THE YEAR-1 STEP THE 15-POINT TABLE SEES (O35; the review of 27 Sep 20:09 UK, BLOCKING 2: the ratio must
 * come from a script). Reads Q's arithmetic (results-derive-7w.txt: the year-1 excess fifteen points see, and the continuous
 * chance) and 7w's year-0 gaps (results-7w.txt) and prints their ratios: the arithmetic against the 15-point gap, and the
 * continuous chance against it, for the reader with and without one policy. Grade C (the arithmetic rests on the sixth deep
 * review's thresholds, and a gap is read as a chance at about one score unit a unit of chance).
 *   node research/solver/read-7w-q.mjs > research/solver/results-7w-q.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const seen15 = t => { const m = /^\s+15 points\s+([\d.]+)/m.exec(t); return m ? +m[1] : NaN; };
export const cont = t => { const m = /^\s+the continuous chance\s+([\d.]+)/m.exec(t); return m ? +m[1] : NaN; };
export const gapOf = (t, id, label) => { const i = t.indexOf(`\n${id}\n`); if (i < 0) return NaN; const m = new RegExp(`^\\s+${label.replace(/\+/g, '\\+')}\\s+gap (\\S+)`, 'm').exec(t.slice(i)); return m ? +m[1] : NaN; };
// PLANTED (rule 6)
{ const d = "Q'S\n  5 points (the product)   0.0000  (x)\n  15 points                0.0596  (y)\n  the continuous chance     0.0208 (166)\n";
  const r = 'x\nshare 0.95\n  READER@15    gap 3.1576e-3   opens\n  READER+J@15  gap 3.1917e-3   opens\nS126\n  READER@15    gap 6.5248e-4   opens\n';
  const got = `${seen15(d)} ${cont(d)} ${gapOf(r, 'share 0.95', 'READER@15')} ${gapOf(r, 'share 0.95', 'READER+J@15')} ${gapOf(r, 'S126', 'READER@15')} ${gapOf(r, 'S194', 'OFF@5')}`;
  if (got !== '0.0596 0.0208 0.0031576 0.0031917 0.00065248 NaN') { console.log(`PLANTED CHECK FAILED: ${got}`); process.exit(1); } }
const D = readFileSync(join(HERE, 'results-derive-7w.txt'), 'utf8'), R = readFileSync(join(HERE, 'results-7w.txt'), 'utf8');
const s15 = seen15(D), c = cont(D);
console.log('7W: THE 15-POINT TABLE\'S YEAR-0 GAP ON SHARE 0.95 AGAINST Q\'S ARITHMETIC (results-derive-7w.txt) AND THE CONTINUOUS CHANCE (grade C)');
console.log(`  Q's arithmetic at 15 points ${s15}; the continuous chance ${c}`);
for (const l of ['READER', 'READER+J']) {
  const g15 = gapOf(R, 'share 0.95', `${l}@15`), g5 = gapOf(R, 'share 0.95', `${l}@5`);
  if (![g15, g5].every(Number.isFinite)) { console.log(`  ${l}: gap not found`); process.exit(1); }
  console.log(`  ${l.padEnd(9)} gap ${g5} at 5, ${g15} at 15 (rise ${(g15 - g5).toExponential(4)}): arithmetic / gap ${(s15 / g15).toFixed(1)}, arithmetic / rise ${(s15 / (g15 - g5)).toFixed(1)}; continuous / gap ${(c / g15).toFixed(1)}`);
}
