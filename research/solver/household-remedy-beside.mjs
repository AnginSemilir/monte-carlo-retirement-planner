/*
 * BESIDE THE REMEDY'S READ (HOUSEHOLD-REMEDY-READ.md as amended; D129 (3); EXPLORATORY, written after the read, deciding
 * nothing): the figures the write-up gives that the read does not print, from the run's unit files
 * (results/household-remedy-7002) and the decomposition's (results/household-decomp-7002), on the same 4,000 paths of seed
 * 7002 (each unit's K2 and HS arrays checked the same in both):
 *   1. on each of the three couples, each arm against K2 in whole paths (saved, lost, net), the share of HS's net loss it
 *      recovers, and its interval's upper end less the rule's bar (-0.3 points), in points and in paths;
 *   2. on the three, the decomposition's arms beside the remedy's (survival on the same paths): HSB (the bands single, the
 *      personal allowance with them), HSC (the cap single), HSBC (both); HSPB (the bands above two allowances at k), HSP
 *      (those and the cap at k);
 *   3. over the 28 units, each remedy table's forecast at the start less its survival (mean, and the widest each way);
 *   4. (the reviewer at the read, MINOR 3) by unit, HSP against K2: survival in whole paths, spending on the paths both keep
 *      and the pot capped at the unit's cap (the rule's "the capped pot, pooled and by unit", which the read printed pooled
 *      only), and the units where HSP keeps more paths but spends less on the paths both keep beyond noise, so that M1's
 *      condition (D116: "keeps more paths and delivers no less spending") does not hold there;
 *   5. (MINOR 2) on the three, the plan entries in which the decomposition's HSB and the remedy's HSPB differ, and their cap.
 *   node research/solver/household-remedy-beside.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange } from './stats.mjs';
import { armOf, cells, spendOn } from './reduce-household.mjs';
import { ARMS, NEW, THREE, RULE } from './reduce-household-remedy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const load = (dir, f) => JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', dir, f))).toString());
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), pct = x => `${(100 * x).toFixed(2)}%`;
const files = readdirSync(join(HERE, 'results', 'household-remedy-7002')).filter(f => /\.json\.gz$/.test(f));
const units = files.map(f => { const U = load('household-remedy-7002', f); for (const a of ARMS) U.arms[a] = armOf(U.arms[a]); return U; });
const byId = Object.fromEntries(units.map(U => [U.id, U]));
console.log(`BESIDE THE REMEDY'S READ (EXPLORATORY, after the read, deciding nothing): ${units.length} units, seed ${units[0].seed}, ${units[0].N} paths; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);

console.log(`\n1. The three couples, each arm against K2 in whole paths of ${units[0].N} (saved / lost / net), the share of HS's net loss recovered, and the interval's upper end less the bar (${RULE.unit} points):`);
for (const id of THREE) {
  const U = byId[id], N = U.N, net = a => { const c = cells(U.arms.K2, U.arms[a]); return { c, net: c.saved - c.lost, ch: survivalChange(c.lost, c.saved, c.N) }; };
  const hs = net('HS');
  console.log(`  ${id}: HS ${hs.c.saved} / ${hs.c.lost} / ${hs.net}`);
  for (const a of NEW) {
    const r = net(a), share = hs.net < 0 ? (r.net - hs.net) / -hs.net : NaN, m = r.ch.hi - RULE.unit;
    console.log(`    ${a.padEnd(5)} ${r.c.saved} / ${r.c.lost} / ${r.net}; recovers ${(100 * share).toFixed(1)}% of HS's net loss; upper end ${f3(r.ch.hi)}, ${m >= 0 ? 'above' : 'below'} the bar by ${Math.abs(m).toFixed(3)} points (${(Math.abs(m) * N / 100).toFixed(2)} paths)`);
  }
}

console.log('\n2. The decomposition\'s arms beside the remedy\'s on the three, survival on the same paths (each unit\'s K2 and HS arrays the same in both runs):');
for (const id of THREE) {
  const D = load('household-decomp-7002', `${id}.json.gz`), R = load('household-remedy-7002', `${id}.json.gz`);
  const same = D.arms.K2.survived === R.arms.K2.survived && D.arms.HS.survived === R.arms.HS.survived;
  const s = (A) => { const x = armOf(A).survived; let k = 0; for (let i = 0; i < x.length; i++) k += x[i] ? 1 : 0; return pct(k / x.length); };
  console.log(`  ${id} (K2 and HS the same in both: ${same ? 'yes' : 'NO'}): K2 ${s(R.arms.K2)}, HS ${s(R.arms.HS)}; the decomposition HSB ${s(D.arms.HSB)}, HSC ${s(D.arms.HSC)}, HSBC ${s(D.arms.HSBC)}; the remedy HSPB ${s(R.arms.HSPB)}, HSP ${s(R.arms.HSP)}, HSPS ${s(R.arms.HSPS)} (k ${R.split.k.toFixed(3)})`);
}

console.log('\n3. Each remedy table\'s forecast at the start less its survival, over the 28 units (points):');
for (const a of NEW) {
  const d = units.map(U => { const A = U.arms[a]; let k = 0; for (let i = 0; i < A.survived.length; i++) k += A.survived[i] ? 1 : 0; return { id: U.id, d: 100 * (A.forecast - k / A.survived.length) }; });
  const mean = d.reduce((t, x) => t + x.d, 0) / d.length, hi = d.reduce((p, x) => (x.d > p.d ? x : p)), lo = d.reduce((p, x) => (x.d < p.d ? x : p));
  console.log(`  ${a.padEnd(5)} mean ${f3(mean)}; the widest above ${hi.id} ${f3(hi.d)}, below ${lo.id} ${f3(lo.d)}`);
}

console.log('\n4. By unit, HSP against K2: survival net in whole paths; spending on the paths both keep (se); the pot capped at the unit\'s cap; M1\'s condition (D116):');
const Z = 1.96, named = [];
for (const U of units) {
  const c = cells(U.arms.K2, U.arms.HSP), net = c.saved - c.lost, sp = spendOn([[U.arms.K2, U.arms.HSP]], true).by[0];
  let sb = 0, sx = 0; for (let i = 0; i < U.arms.K2.pot.length; i++) { sb += Math.min(U.arms.K2.pot[i], U.cap); sx += Math.min(U.arms.HSP.pot[i], U.cap); }
  const capPct = 100 * (sx / sb - 1), capGbp = (sx - sb) / U.arms.K2.pot.length, lower = sp.hi < 0;
  if (net > 0 && lower) named.push(U.id);
  console.log(`  ${U.id.padEnd(12)} net ${net >= 0 ? '+' : ''}${net} paths; spending ${f3(sp.d)}% (se ${sp.se.toFixed(3)})${lower ? ', lower beyond noise' : ''}; the capped pot ${f3(capPct)}% (${capGbp < 0 ? '-' : ''}£${Math.abs(Math.round(capGbp)).toLocaleString('en-GB')} a path)`);
}
console.log(`  the units where HSP keeps more paths but spends less on the paths both keep beyond noise (M1's condition not met): ${named.join(', ') || 'none'}`);

console.log('\n5. On the three, the plan entries in which the decomposition\'s HSB and the remedy\'s HSPB differ (each unit\'s recorded plans), and the band for gains and the cap:');
for (const id of THREE) {
  const D = load('household-decomp-7002', `${id}.json.gz`), R = load('household-remedy-7002', `${id}.json.gz`);
  const a = D.plans.HSB, b = R.plans.bands, keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  const n = x => (typeof x === 'number' ? Math.round(x).toLocaleString('en-GB') : JSON.stringify(x));
  console.log(`  ${id} (k ${R.split.k.toFixed(3)}): ${keys.map(k => `${k} ${n(a[k])} against ${n(b[k])}`).join('; ')}; the band for gains ${n(D.bands.HSB)} against ${n(R.bands.bands)}; the cap ${n(a.pclsMaxCap)} against ${n(b.pclsMaxCap)}`);
}
