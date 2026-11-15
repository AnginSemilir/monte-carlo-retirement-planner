/*
 * BESIDE THE COUPLES' TIE RULE'S READ (TIE-C.md; D97 (2); EXPLORATORY, seed 7002), written after the read and deciding nothing.
 * It reads the same units the reducer read (results/tie-couple-7002) through the reducer's own functions and prints the items
 * the rule names beside it that the reducer does not:
 *   A. by couple, the replay's decisions above both caps (the first 100 paths), and each arm's differing decisions;
 *   B. the pot left and lifetime tax by cohort (the younger four retiring at 52, the library's four);
 *   C. S311F, the couple part 5 names: how its pot's change spreads over its paths, each tie arm against CANDS, and lifetime
 *      tax by its direction;
 *   D. what decides part 5 on S311F: its largest-loss paths, the change without them, the paired standard errors;
 *   E. lifetime tax by couple with its paired standard error, and S311F's share of the pooled change;
 *   F. the paths surviving in both arms whose spending delivered differs, on the tie arms' own paths.
 * Sections C's tax line and D to F were added in answer to the reviewer at the read (reviews/2026-11-15-read-tie-couple.md).
 *   node research/solver/tie-couple-beside.mjs [dir]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, rule, TIES } from './reduce-tie-couple.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'tie-couple-7002');
const ORDER = ['S309F', 'S311F', 'S317F', 'S323F', 'S189', 'S293', 'S011', 'S083'];
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const units = ORDER.map(id => { const U = raw.find(u => u.id === id); if (!U) { console.error(`tie-couple-beside: ${id} missing`); process.exit(2); } return { ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }; });
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
const R = rule(units);
console.log(`BESIDE THE COUPLES' TIE RULE'S READ (EXPLORATORY, written after the read, deciding nothing): ${units.length} couples of ${DIR.split('/').slice(-1)[0]}, ${units[0].N} paths each; the reducer's outcome ${R.verdict}`);

console.log(`\nA. The replay by couple (the first ${units[0].nReplay} paths, along CANDS's own path): decisions, those above both caps, and those where each tie arm's move differs`);
for (const U of units) console.log(`  ${U.id.padEnd(6)} (${U.cohort}): ${U.replay.decisions} decisions, ${U.replay.above} above both caps (${(100 * U.replay.above / U.replay.decisions).toFixed(1)}%); ${TIES.map(a => `${a} differs at ${U.replay[a].differ}`).join(', ')}`);

console.log(`\nB. The pot left and lifetime tax by cohort (each couple's mean, X over CANDS in percent; the cohort's couples averaged):`);
for (const cohort of [...new Set(units.map(U => U.cohort))]) {
  const us = units.filter(U => U.cohort === cohort);
  for (const a of TIES) {
    const pot = mean(us.map(U => 100 * (mean(U.arms[a].pot) / mean(U.arms.CANDS.pot) - 1))), tax = mean(us.map(U => 100 * (mean(U.arms[a].tax) / mean(U.arms.CANDS.tax) - 1)));
    console.log(`  ${cohort} (${us.map(U => U.id).join(', ')}), ${a}: the pot ${f(pot)}%, lifetime tax ${f(tax, 2)}%`);
  }
}

console.log(`\nC. S311F, the couple part 5 names: its pot's change path by path, each tie arm against CANDS (the pot left on each path, X less CANDS)`);
{
  const U = units.find(u => u.id === 'S311F'), b = U.arms.CANDS, n = U.N;
  for (const a of TIES) {
    const x = U.arms[a], d = Array.from({ length: n }, (_, i) => x.pot[i] - b.pot[i]), s = [...d].sort((p, q) => p - q);
    const lower = d.filter(v => v < -0.5).length, higher = d.filter(v => v > 0.5).length, tot = d.reduce((t, v) => t + v, 0);
    const worst = s.slice(0, Math.ceil(n / 100)).reduce((t, v) => t + v, 0);
    console.log(`  ${a}: the pot lower on ${lower} of ${n} paths and higher on ${higher}; the median change ${gbp(s[n >> 1])}, the mean ${gbp(tot / n)} (CANDS's mean pot ${gbp(mean(b.pot))}); the worst 1% of paths (${Math.ceil(n / 100)}) carry ${gbp(worst / n)} of the mean change`);
    // lifetime tax by its direction, and the share of the pot's mean change each side carries (the reviewer at the read,
    // finding 1 (a) and (b): the first form of this line gave the mean over all paths as the mean over those paying less)
    const taxD = Array.from({ length: n }, (_, i) => x.tax[i] - b.tax[i]), down = [], up = [];
    taxD.forEach((v, i) => { if (v < -0.5) down.push(i); else if (v > 0.5) up.push(i); });
    const carry = is => is.reduce((t, i) => t + d[i], 0) / n, fewer = is => is.filter(i => d[i] < -0.5).length;
    console.log(`    lifetime tax lower on ${down.length} paths, by a mean ${gbp(-mean(down.map(i => taxD[i])))} over them, and higher on ${up.length}, by a mean ${gbp(mean(up.map(i => taxD[i])))} over them`);
    console.log(`    the paths paying more tax carry ${gbp(carry(up))} of the mean change in the pot (${fewer(up)} of them leaving less); those paying less carry ${gbp(carry(down))} (${fewer(down)} of them leaving less)`);
  }
}

console.log(`\nD. What decides part 5 on S311F (each tie arm against CANDS; the paths whose pot change carries most of the mean change):`);
{
  const U = units.find(u => u.id === 'S311F'), b = U.arms.CANDS, n = U.N, m0 = mean(b.pot);
  for (const a of TIES) {
    const x = U.arms[a], d = Array.from({ length: n }, (_, i) => x.pot[i] - b.pot[i]), order = d.map((v, i) => i).sort((p, q) => d[p] - d[q]);
    const rows = order.slice(0, 4).map(i => `path ${i}: CANDS ${gbp(b.pot[i])}, ${a} ${gbp(x.pot[i])} (${f(100 * (x.pot[i] / b.pot[i] - 1), 1)}%), lifetime tax ${x.tax[i] >= b.tax[i] ? '+' : ''}${gbp(x.tax[i] - b.tax[i])}, carrying ${gbp(d[i] / n)} of the mean change`);
    const without = k => { const keep = order.slice(k); return 100 * (keep.reduce((t, i) => t + x.pot[i], 0) / keep.reduce((t, i) => t + b.pot[i], 0) - 1); };
    // the paired standard error of the mean change, as a percent of CANDS's mean pot
    const md = mean(d), sd = Math.sqrt(d.reduce((t, v) => t + (v - md) ** 2, 0) / (n - 1)), se = 100 * sd / Math.sqrt(n) / m0;
    console.log(`  ${a}: the change ${f(100 * (mean(x.pot) / m0 - 1))}% (paired standard error ${se.toFixed(3)}% of CANDS's mean pot); without the largest-loss path ${f(without(1))}%, without the two ${f(without(2))}%, without the four ${f(without(4))}%`);
    for (const r of rows) console.log(`    ${r}`);
  }
  const big = [...b.pot].sort((p, q) => q - p), share = k => 100 * big.slice(0, k).reduce((t, v) => t + v, 0) / (m0 * n);
  console.log(`  CANDS's mean pot ${gbp(m0)}: its largest path ${gbp(big[0])}, ${share(1).toFixed(1)}% of the couple's summed pots; its ten largest ${share(10).toFixed(1)}%`);
  for (const a of TIES) {
    const rows = units.map(U2 => { const bb = U2.arms.CANDS, x = U2.arms[a], d = Array.from({ length: U2.N }, (_, i) => x.pot[i] - bb.pot[i]), md = mean(d), sd = Math.sqrt(d.reduce((t, v) => t + (v - md) ** 2, 0) / (U2.N - 1)); return { id: U2.id, z: md / (sd / Math.sqrt(U2.N)) }; });
    console.log(`  ${a}: the pot's change beyond two standard errors, higher on ${rows.filter(r => r.z > 2).map(r => r.id).join(', ') || 'none'}; lower on ${rows.filter(r => r.z < -2).map(r => r.id).join(', ') || 'none'}; within them on ${rows.filter(r => Math.abs(r.z) <= 2).map(r => r.id).join(', ') || 'none'}`);
  }
  for (const U2 of units.filter(u => u.id !== 'S311F')) {
    const bb = U2.arms.CANDS, se2 = TIES.map(a => { const x = U2.arms[a], d = Array.from({ length: U2.N }, (_, i) => x.pot[i] - bb.pot[i]), md = mean(d), sd = Math.sqrt(d.reduce((t, v) => t + (v - md) ** 2, 0) / (U2.N - 1)); return (100 * sd / Math.sqrt(U2.N) / mean(bb.pot)).toFixed(3); });
    console.log(`  ${U2.id}: the paired standard error of the pot's change ${se2.join('% and ')}% (TIE5 and TIE4)`);
  }
}

console.log(`\nE. Lifetime tax by couple, each tie arm against CANDS (the change in the couple's mean, with its paired standard error), and how much of the pooled change is S311F's:`);
for (const a of TIES) {
  const rows = units.map(U => { const b = U.arms.CANDS, x = U.arms[a], d = Array.from({ length: U.N }, (_, i) => x.tax[i] - b.tax[i]), md = mean(d), sd = Math.sqrt(d.reduce((t, v) => t + (v - md) ** 2, 0) / (U.N - 1)); return { id: U.id, d: md, se: sd / Math.sqrt(U.N), base: mean(b.tax) }; });
  const sumD = rows.reduce((t, r) => t + r.d, 0), s311 = rows.find(r => r.id === 'S311F');
  const pooled = rs => 100 * (rs.reduce((t, r) => t + r.base + r.d, 0) / rs.reduce((t, r) => t + r.base, 0) - 1);
  console.log(`  ${a}: ${rows.map(r => `${r.id} ${r.d >= 0 ? '+' : ''}${gbp(r.d)} (se ${gbp(r.se)})`).join(', ')}`);
  console.log(`    S311F's share of the couples' summed change ${(100 * s311.d / sumD).toFixed(1)}%; pooled lifetime tax ${f(pooled(rows), 2)}%, without S311F ${f(pooled(rows.filter(r => r.id !== 'S311F')), 2)}%; couples whose tax change is beyond two standard errors: ${rows.filter(r => Math.abs(r.d) > 2 * r.se).map(r => r.id).join(', ')}`);
}

console.log(`\nF. On the tie arms' own paths: paths surviving in both arms whose spending delivered differs (so a spending level differs in some year), by couple:`);
for (const a of TIES) {
  const parts = units.map(U => { const b = U.arms.CANDS, x = U.arms[a], is = []; for (let i = 0; i < U.N; i++) if (b.survived[i] && x.survived[i] && Math.abs(x.delivered[i] - b.delivered[i]) > 0.5) is.push(i); return is.length ? `${U.id} ${is.length} (${is.slice(0, 10).join(', ')}${is.length > 10 ? ', ...' : ''})` : null; }).filter(Boolean);
  console.log(`  ${a}: ${parts.join('; ') || 'none'}`);
}
