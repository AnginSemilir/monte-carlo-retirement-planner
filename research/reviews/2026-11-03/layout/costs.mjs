/*
 * THE "WHAT ASKING COSTS" LINES ON THE CANVAS (LAYOUT.md section 3.3's rule), printed from the figures files' own timings:
 * N solves take about N x (one solve, plus its first 2,000 paths), each as this machine measured it, with the paths' time
 * twice over for a dial position above Low, whose simulation runs 1.80 to 1.99 times the base's
 * (2026-11-01/launch/results-app-timing.txt). Arithmetic only.
 *   node costs.mjs results-figures-S116.txt results-figures-S224.txt
 */
import { readFileSync } from 'node:fs';

const LOCKED = 2;   // a locked position's paths against the base's, rounded up from 1.80 to 1.99
const min = s => Math.round(s / 60);
const say = s => (s >= 100 * 60 ? `about ${Math.round(s / 3600)} hours` : `about ${min(s)} minutes`);
console.log(`# node costs.mjs ${process.argv.slice(2).map(f => f.split('/').pop()).join(' ')}: what asking costs, by LAYOUT.md section 3.3's rule`);
for (const file of process.argv.slice(2)) {
  const txt = readFileSync(file, 'utf8');
  const id = (txt.match(/^household: (S\d+F?):/m) || [])[1];
  const solve = Number((txt.match(/^solve: (\d+) s;/m) || [])[1]);
  const m = txt.match(/^simulate: (\d+) s for (\d+) paths/m);
  if (!id || !solve || !m) throw new Error(`costs: ${file} lacks the household, solve or simulate line`);
  const paths2000 = (Number(m[1]) * 2000) / Number(m[2]);
  const one = solve + paths2000, locked = solve + LOCKED * paths2000;
  console.log(`${id}: one solve ${solve} s; its first 2,000 paths ${Math.round(paths2000)} s (from ${m[1]} s for ${m[2]}); a setting ${Math.round(one)} s, a dial position above Low ${Math.round(locked)} s`);
  console.log(`${id}: the dial's other three settings: ${say(3 * locked)}; the target card's four: ${say(4 * one)}; the limits' fourteen at most: ${say(14 * one)}; one scenario: ${say(one)}; the age card's six: ${say(6 * one)}`);
}
