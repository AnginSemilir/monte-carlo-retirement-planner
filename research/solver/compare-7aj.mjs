/*
 * 7AJ'S ITEM 1 POINT AGAINST ITS DERIVATION, BY HOUSEHOLD (the 7 Oct read: the panel's mean survival change 2.107 points
 * against the derived 1.789, above its 80% interval 1.6 to 1.9). Reads results-derive-7aj.txt section 1 (7af's and 7ag's
 * records at the estate weight 0.02, which the derivation's SAME story carries to 0.01) and results-7aj.txt item 1 (the
 * run at 0.01), and prints each household's change at each weight, the difference, and the households that make the gap.
 *   node research/solver/compare-7aj.mjs > research/solver/results-compare-7aj.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const der = readFileSync(join(HERE, 'results-derive-7aj.txt'), 'utf8'), res = readFileSync(join(HERE, 'results-7aj.txt'), 'utf8');
const N = 8000;
const at02 = new Map(), at01 = new Map();
for (const m of der.matchAll(/^ {2}(\S.*?)\s+SHIP [\d.]+ margin [\d.]+\s+saved ([\d.]+) lost ([\d.]+)/gm)) at02.set(m[1].trim(), 100 * (Number(m[2]) - Number(m[3])) / N);
const item1 = res.slice(res.indexOf('1. survival at the estate weight 0.01'), res.indexOf('2. the whole score'));
for (const m of item1.matchAll(/^ {5}(\S.*?)\s+\d+ saved\/\d+ lost of \d+.*?change ([+-][\d.]+)/gm)) at01.set(m[1].trim(), Number(m[2]));
if (at02.size !== 25 || at01.size !== 25) throw new Error(`expected 25 households at each weight, read ${at02.size} and ${at01.size}`);
const rows = [...at01.keys()].map(h => ({ h, a: at02.get(h), b: at01.get(h) })).map(r => ({ ...r, d: r.b - r.a }));
if (rows.some(r => r.a === undefined)) throw new Error('a household of results-7aj.txt is missing from the derivation');
const mean = k => rows.reduce((t, r) => t + r[k], 0) / rows.length;
console.log('7AJ ITEM 1 BY HOUSEHOLD: the survival change CAND less SHIP (points) at 0.02 (results-derive-7aj.txt section 1, the');
console.log('derivation\'s SAME) and at 0.01 (results-7aj.txt item 1), and the difference\n');
for (const r of [...rows].sort((x, y) => Math.abs(y.d) - Math.abs(x.d))) console.log(`  ${r.h.padEnd(14)} at 0.02 ${r.a >= 0 ? '+' : ''}${r.a.toFixed(3)}  at 0.01 ${r.b >= 0 ? '+' : ''}${r.b.toFixed(3)}  difference ${r.d >= 0 ? '+' : ''}${r.d.toFixed(3)}`);
const gap = mean('d'), top = [...rows].sort((x, y) => y.d - x.d).slice(0, 4), share = top.reduce((t, r) => t + r.d, 0) / rows.length / gap;
console.log(`\nTHE MEANS: at 0.02 ${mean('a').toFixed(3)}, at 0.01 ${mean('b').toFixed(3)}, the gap ${gap >= 0 ? '+' : ''}${gap.toFixed(3)} points`);
console.log(`THE FOUR LARGEST: ${top.map(r => `${r.h} ${r.d >= 0 ? '+' : ''}${r.d.toFixed(2)}`).join(', ')}; together ${(100 * share).toFixed(0)}% of the gap`);
