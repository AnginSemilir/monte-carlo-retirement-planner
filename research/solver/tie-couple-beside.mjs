/*
 * BESIDE THE COUPLES' TIE RULE'S READ (TIE-C.md; D97 (2); EXPLORATORY, seed 7002), written after the read and deciding nothing.
 * It reads the same units the reducer read (results/tie-couple-7002) through the reducer's own functions and prints the items
 * the rule names beside it that the reducer does not:
 *   A. by couple, the replay's decisions above both caps (the first 100 paths), and each arm's differing decisions;
 *   B. the pot left and lifetime tax by cohort (the younger four retiring at 52, the library's four);
 *   C. S311F, the couple part 5 names: how its pot's change spreads over its paths, each tie arm against CANDS.
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
    const taxD = Array.from({ length: n }, (_, i) => x.tax[i] - b.tax[i]), taxLower = taxD.filter(v => v < -0.5).length;
    console.log(`  ${a}: the pot lower on ${lower} of ${n} paths and higher on ${higher}; the median change ${gbp(s[n >> 1])}, the mean ${gbp(tot / n)} (CANDS's mean pot ${gbp(mean(b.pot))}); the worst 1% of paths (${Math.ceil(n / 100)}) carry ${gbp(worst / n)} of the mean change; lifetime tax lower on ${taxLower} paths, by a mean ${gbp(-mean(taxD))}`);
  }
}
