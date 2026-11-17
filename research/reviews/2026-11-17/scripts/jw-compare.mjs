/*
 * THE PILOT BESIDE JOINT-WIDE'S READ (the review, 17 Nov; EXPLORATORY). For each unit the pilot ran: the household plan
 * less K2 (the pilot: seed 99003, 1,500 paths) beside each person's top six moves less K2 (JOINT-WIDE's read as committed at
 * a7aed0f6: seed 7002, 4,000 paths), with what each does to spending and the capped pot and what a path costs against K2's.
 * Other seeds and other counts of paths: only the larger gaps mean anything.
 *   node research/reviews/2026-11-17/scripts/jw-compare.mjs <results-joint-wide.txt> [the pilot's directory]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const JW = readFileSync(process.argv[2], 'utf8'), DIR = process.argv[3] || join(HERE, '..', 'units', 'pilot-99003-45');
const CAPS = existsSync(join(DIR, '..', 'caps.json')) ? JSON.parse(readFileSync(join(DIR, '..', 'caps.json'))) : {};
const k6 = JW.slice(JW.indexOf('K6 against K2:'), JW.indexOf('JOINT-WIDE OUTCOME')).split('\n').find(l => l.trim().startsWith('by unit:'));
const jw = {};
for (const part of k6.replace(/^\s*by unit:\s*/, '').split('; ')) {
  const m = part.match(/^(\S+) survival ([+-][\d.]+) .*?spending ([+-][\d.]+)%.*?capped ([+-][\d.]+)%.*?x([\d.]+) a path/);
  if (m) jw[m[1]] = { d: Number(m[2]), spend: Number(m[3]), capped: Number(m[4]), x: Number(m[5]) };
}
const units = readdirSync(DIR).filter(f => f.endsWith('.json') || f.endsWith('.json.gz')).map(f => JSON.parse(f.endsWith('.gz') ? gunzipSync(readFileSync(join(DIR, f))).toString() : readFileSync(join(DIR, f))));
const sum = xs => xs.reduce((a, b) => a + b, 0), mean = xs => sum(xs) / xs.length, f = (x, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
const ORDER = ['feature', 'library', 'younger', '90/10'];
units.sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group) || a.id.localeCompare(b.id));
console.log('THE PILOT BESIDE JOINT-WIDE\'S READ (the review, 17 Nov; EXPLORATORY): the household plan less K2 (seed 99003, 1,500 paths) and the top six moves less K2 (seed 7002, 4,000 paths; results-joint-wide.txt at a7aed0f6)');
console.log('| unit | group | the household plan: survival, points | spending | the capped pot | a path | the top six moves: survival, points | spending | the capped pot | a path |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
let n = 0, hs = 0, js = 0;
for (const u of units) {
  const k = u.arms.K2, h = u.arms.HOUSE, j = jw[u.id]; if (!k || !h || !j) continue;
  const d = 100 * (sum(h.survived) - sum(k.survived)) / u.n, sp = 100 * (sum(h.delivered) / sum(k.delivered) - 1), cap = CAPS[u.id] ? CAPS[u.id].cap : null;
  const cp = cap ? 100 * (mean(h.wealth.map(v => Math.min(v, cap))) / mean(k.wealth.map(v => Math.min(v, cap))) - 1) : NaN;
  console.log(`| ${u.id} | ${u.group} | \`${f(d)}\` | \`${f(sp)}%\` | \`${f(cp, 1)}%\` | \`x${(h.cpuMs / k.cpuMs).toFixed(2)}\` | \`${f(j.d, 3)}\` | \`${f(j.spend)}%\` | \`${f(j.capped, 1)}%\` | \`x${j.x.toFixed(2)}\` |`);
  n++; hs += d; js += j.d;
}
console.log(`the mean over these ${n} units: the household plan ${f(hs / n)} points, the top six moves ${f(js / n, 3)}; spending here is over every path, as JOINT-WIDE's rule takes it`);
