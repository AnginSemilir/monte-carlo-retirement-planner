/*
 * O36 FROM 7X'S PER-WORLD LINES (PLAN.md O36's gate; the ledger 27 Sep 21:29, step (b)): each held table's year-0 survival
 * against its own forward run, world by world, from results-7x.txt (the reducer's output, through its fair-test gate). The
 * gap is table less simulated, in points; 1,000 paths a world, so a world's simulated figure carries about 0.3 to 1.3 points
 * of path noise (binomial) - a descriptive read, grade C, no test.
 *   node research/solver/read-7x-o36.mjs > research/solver/results-7x-o36.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const lines = readFileSync(join(HERE, 'results-7x.txt'), 'utf8').split('\n');
let cs = null, unit = null, n = 0;
console.log('O36 FROM 7X: each held table against its own run, per world (table less simulated, points); from results-7x.txt\n');
const worst = new Map();
for (const l of lines) {
  const c = /^(\S.*?) \((reader|off); \d+ paths below/.exec(l); if (c) { cs = c[1]; console.log(`${cs} (${c[2]})`); continue; }
  const u = /^  (\S+)\s+table\s+(\S+) sim\s+(\S+)/.exec(l); if (u && cs) { unit = u[1]; continue; }
  const w = /^\s+worlds (.*)$/.exec(l); if (!w || !unit) continue;
  const ws = [...w[1].matchAll(/z (\S+): (\S+)\/(\S+)/g)].map(m => ({ z: m[1], gap: Number(m[2]) - Number(m[3]) }));
  console.log(`  ${unit.padEnd(14)} ${ws.map(x => `z ${x.z} ${(x.gap >= 0 ? '+' : '') + x.gap.toFixed(2)}`).join('  ')}`);
  const lo = Math.min(...ws.map(x => x.gap)), hi = Math.max(...ws.map(x => x.gap));
  const k = cs, o = worst.get(k) || { lo: Infinity, hi: -Infinity, neg: 0, all: 0 };
  o.lo = Math.min(o.lo, lo); o.hi = Math.max(o.hi, hi); o.neg += ws.filter(x => x.gap < -2).length; o.all += ws.length; worst.set(k, o); n++;
}
if (n !== 20) { console.log(`ERROR: ${n} units read, 20 expected`); process.exit(1); }
console.log('\nPER CASE: the gap\'s range over its units and worlds, and the worlds more than 2 points pessimistic');
for (const [k, o] of worst) console.log(`  ${k.padEnd(11)} ${o.lo.toFixed(2)} to ${(o.hi >= 0 ? '+' : '') + o.hi.toFixed(2)}; ${o.neg} of ${o.all} worlds below -2`);
