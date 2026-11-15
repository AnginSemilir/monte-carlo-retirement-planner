/*
 * BESIDE THE SPEED MODE'S WIDER READ (SPEED-B.md; D97 (3); EXPLORATORY, seed 7002), written after the read and deciding
 * nothing. It reads the same units the reducer read (results/speed-b-7002) through the reducer's own functions and prints the
 * items the rule names beside it, and what bears on reading part 2 and part 3:
 *   A. each unit's survival change with its 95% interval (part 2's bar is the interval's upper end against -0.3);
 *   B. each group's cohorts apart (survival pooled, spending pooled, the pot and the capped pot, the time);
 *   C. each unit's lifetime tax in pounds, both arms, and the engine's milliseconds a path, both arms;
 *   D. for the couples, part 3 without each one couple in turn (which couples carry the pooled spending change).
 *   node research/solver/speed-b-beside.mjs [dir]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, rule, GROUPS } from './reduce-speed-b.mjs';
import { pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'speed-b-7002');
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
const byKind = k => units.filter(U => U.kind === k).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
console.log(`BESIDE THE SPEED MODE'S WIDER READ (EXPLORATORY, written after the read, deciding nothing): ${units.length} units of ${DIR.split('/').slice(-1)[0]}, ${units[0].N} paths each`);

console.log(`\nA. Each unit's survival change, SPEED less WHOLE, with its 95% interval (part 2: no interval wholly below -0.3):`);
for (const k of GROUPS) {
  const R = rule(byKind(k)), near = [...R.H].sort((a, b) => a.ch.hi - b.ch.hi).slice(0, 3);
  console.log(`  ${k}s: ${R.H.map(h => `${h.id} ${f(h.ch.d)} (${f(h.ch.lo)} to ${f(h.ch.hi)})`).join('; ')}`);
  console.log(`    the three intervals whose upper end is lowest: ${near.map(h => `${h.id} ${f(h.ch.hi)}`).join(', ')}`);
}

console.log(`\nB. Each group's cohorts apart (SPEED against WHOLE):`);
for (const k of GROUPS) {
  for (const cohort of [...new Set(byKind(k).map(U => U.cohort))]) {
    const us = byKind(k).filter(U => U.cohort === cohort), R = rule(us);
    console.log(`  ${k}s, ${cohort} (${us.length}: ${us.map(U => U.id).join(', ')}): survival ${f(R.pooled.d)} (${f(R.pooled.lo)} to ${f(R.pooled.hi)}), spending ${f(R.spend, 4)}%, the pot ${f(R.potP)}%, the capped pot ${f(R.cappedP)}%, a path's time the median x${R.time[R.time.length >> 1].toFixed(2)}`);
  }
}

console.log(`\nC. Each unit's lifetime tax (the mean a path) and the engine's milliseconds a path, WHOLE and SPEED (the units ran four at a time: the times are a guide):`);
for (const k of GROUPS) console.log(`  ${k}s: ${byKind(k).map(U => `${U.id} ${gbp(mean(U.arms.WHOLE.tax))} to ${gbp(mean(U.arms.SPEED.tax))}, ${U.arms.WHOLE.ms.toFixed(1)} to ${U.arms.SPEED.ms.toFixed(1)} ms`).join('; ')}`);

console.log(`\nD. The couples' part 3 (pooled spending delivered within 0.05%) without each couple in turn:`);
{
  const cs = byKind('couple'), spend = us => 100 * (sum(us.map(U => sum(U.arms.SPEED.delivered))) / sum(us.map(U => sum(U.arms.WHOLE.delivered))) - 1);
  console.log(`  all ${cs.length}: ${f(spend(cs), 4)}%`);
  console.log(`  without one: ${cs.map(U => `${U.id} ${f(spend(cs.filter(x => x !== U)), 4)}%`).join(', ')}`);
  const within = cs.filter(U => Math.abs(spend(cs.filter(x => x !== U))) <= 0.05).map(U => U.id);
  console.log(`  the couples without whom part 3 would hold: ${within.join(', ') || 'none'}`);
  const pooled = pooledSummed(cs.map(U => { const R = rule([U]); return R.H[0].cells; }));
  console.log(`  pooled survival again, from the couples' cells: ${f(pooled.d)} (${f(pooled.lo)} to ${f(pooled.hi)})`);
}

// sections E to I, added in answer to the reviewer at the read (reviews/2026-11-15-read-speed-b.md, findings 1 to 4 and 7)
console.log(`\nE. What the singles can show: this read's panel, and a loss of the size item 7 measured on S370 (results-tie-a.txt: the speed mode on S370, 83.94% and 83.76%, 46 saved and 74 lost of 16,000 paths, -0.175 (-0.310 to -0.040); the singles' warning's "at most about 2 in 1,000")`);
{
  const ss = byKind('single'), surv = ss.map(U => 100 * mean(U.arms.WHOLE.survived)), R = rule(ss);
  const disc = R.H.reduce((t, h) => t + h.cells.lost + h.cells.saved, 0);
  console.log(`  this read's ${ss.length} singles: survival under WHOLE from ${Math.min(...surv).toFixed(2)}% to ${Math.max(...surv).toFixed(2)}%; ${disc} paths of ${ss.length * ss[0].N} part between the arms`);
  // a seeded simulation: paired cells drawn at S370's probabilities, how often the change reads beyond noise, and how often
  // part 2 (the interval wholly below -0.3) fails, at 4,000 and 16,000 paths; and a true half-point loss at S370's discordance
  const { survivalChangeU } = await import('./stats.mjs');
  let seed = 20261115; const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const sim = (p, n, reps = 2000) => { let beyond = 0, part2 = 0; for (let r = 0; r < reps; r++) { let a = 0, b = 0, c = 0, d = 0; for (let i = 0; i < n; i++) { const u = rnd(); if (u < p.a) a++; else if (u < p.a + p.b) b++; else if (u < p.a + p.b + p.c) c++; else d++; } const ch = survivalChangeU(a, b, c, d); if (ch.hi < 0) beyond++; if (ch.hi < -0.3) part2++; } return { beyond: 100 * beyond / reps, part2: 100 * part2 / reps }; };
  const S370 = { a: 13356 / 16000, b: 74 / 16000, c: 46 / 16000 }, half = { a: 13356 / 16000, b: 0.00625, c: 0.00125 };
  for (const [name, p] of [["S370's measured loss (-0.175 points)", S370], ['a true half-point loss at the same discordance', half]]) {
    const r4 = sim(p, 4000), r16 = sim(p, 16000);
    console.log(`  ${name}: read beyond noise in ${r4.beyond.toFixed(1)}% of 2,000 simulated runs at 4,000 paths and ${r16.beyond.toFixed(1)}% at 16,000; part 2 failing in ${r4.part2.toFixed(1)}% and ${r16.part2.toFixed(1)}%`);
  }
}

console.log(`\nF. The couples one by one: an exact two-sided McNemar test of each couple's change, Holm-adjusted over the twelve`);
{
  const cs = byKind('couple'), R = rule(cs);
  const lchoose = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log((n - k + i) / i); return s; };
  const p2 = (b, c) => { const n = b + c, k = Math.min(b, c); if (n === 0) return 1; let t = 0; for (let i = 0; i <= k; i++) t += Math.exp(lchoose(n, i) - n * Math.LN2); return Math.min(1, 2 * t); };
  const ps = R.H.map(h => p2(h.cells.lost, h.cells.saved)), m = ps.length, order = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]), adj = new Array(m);
  let run = 0; order.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (m - r) * p)); adj[i] = run; });
  console.log(`  ${R.H.map((h, i) => `${h.id} ${f(h.ch.d)} (${h.cells.saved} saved, ${h.cells.lost} lost; p ${ps[i].toExponential(1)}, Holm ${adj[i].toExponential(1)})`).join('; ')}`);
  console.log(`  beyond noise after Holm at 0.05: ${R.H.filter((h, i) => adj[i] < 0.05).map(h => h.id).join(', ') || 'none'}`);
  const without = (cohort, out) => { const us = cs.filter(U => U.cohort === cohort && !out.includes(U.id)), Q = rule(us); return `${f(Q.pooled.d)} (${f(Q.pooled.lo)} to ${f(Q.pooled.hi)})`; };
  console.log(`  the library's couples without S031 and S063: ${without('lib', ['S031', 'S063'])}; the younger couples without S301F and S325F: ${without('young', ['S301F', 'S325F'])}`);
}

console.log(`\nG. The couples' spending couple by couple (SPEED against WHOLE), and whose pounds part 3 pools:`);
{
  const cs = byKind('couple'), per = cs.map(U => ({ id: U.id, cohort: U.cohort, sp: 100 * (sum(U.arms.SPEED.delivered) / sum(U.arms.WHOLE.delivered) - 1), w: sum(U.arms.WHOLE.delivered), lower: U.arms.SPEED.delivered.filter((v, i) => v < U.arms.WHOLE.delivered[i] - 0.5).length }));
  const all = sum(per.map(p => p.w));
  console.log(`  each couple equally weighted: ${f(mean(per.map(p => p.sp)), 4)}%; pooled by pounds (part 3): ${f(100 * (sum(cs.map(U => sum(U.arms.SPEED.delivered))) / all - 1), 4)}%`);
  console.log(`  the share of WHOLE's pounds: ${[...new Set(per.map(p => p.cohort))].map(c => `${c} ${(100 * sum(per.filter(p => p.cohort === c).map(p => p.w)) / all).toFixed(1)}%`).join(', ')}; the largest one couple's ${[...per].sort((a, b) => b.w - a.w).slice(0, 1).map(p => `${p.id} ${(100 * p.w / all).toFixed(1)}%`)}`);
  console.log(`  by couple: ${[...per].sort((a, b) => a.sp - b.sp).map(p => `${p.id} ${f(p.sp, 3)}% (lower on ${p.lower} of ${cs[0].N} paths)`).join('; ')}`);
}

console.log(`\nH. S063, the couple whose tax doubles: its pot with and without the cap, and its tax at the median and the mean`);
{
  const U = byKind('couple').find(u => u.id === 'S063'), w = U.arms.WHOLE, s = U.arms.SPEED;
  const capped = X => mean(Array.from(X.pot, v => Math.min(v, U.cap))), med = a => { const t = [...a].sort((x, y) => x - y); return t[t.length >> 1]; };
  console.log(`  the pot ${f(100 * (mean(s.pot) / mean(w.pot) - 1), 2)}%, capped at ${gbp(U.cap)} ${f(100 * (capped(s) / capped(w) - 1), 2)}%; lifetime tax at the median ${gbp(med(w.tax))} to ${gbp(med(s.tax))} (${f(100 * (med(s.tax) / med(w.tax) - 1), 1)}%), at the mean ${gbp(mean(w.tax))} to ${gbp(mean(s.tax))} (${f(100 * (mean(s.tax) / mean(w.tax) - 1), 1)}%)`);
  const cs = byKind('couple').filter(u => u.id !== 'S063'), R = rule(cs);
  console.log(`  the couples' pooled pot without S063: ${f(R.potP)}% (all twelve ${f(rule(byKind('couple')).potP)}%)`);
}
