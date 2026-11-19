/*
 * THE PATTERN SEARCH FOR A POOLED INTERVAL OVER UNITS THAT SHARE THEIR PATHS (EXPLORATORY; step 8's design review,
 * reviews/2026-11-19-household-hsp-design.md BLOCKING 2; CHECKLIST 7): a read that pools a paired survival change over units
 * run on the same paths of one seed, and takes its interval as if the units were independent (the cells summed, stats.mjs
 * survivalChange or pooledSummed; or the units' own paired variances summed), gives too narrow an interval when the units'
 * changes move together path by path. This recomputes each read's pooled survival part from its stored arrays both ways:
 *   as the read did (its own form, reproduced here and printed beside the read's own figure where its results file has it);
 *   by path (reduce-phase4.mjs survivalItem: each path's change averaged over the units, its interval over the paths, the
 *   form the confirmatory reads use);
 * and says, for each part with a bar, whether the by-path interval would carry its verdict across the bar. The reads stand
 * as printed, by their rules as committed (D112's pattern search took the same course). Reads whose arrays are no longer
 * stored are named.
 *   node research/solver/pooled-bypath.mjs > research/solver/results-pooled-bypath.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange, pooledSummed } from './stats.mjs';
import { survivalItem } from './reduce-phase4.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), Z = 1.959963984540054;
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), iv = r => `${f3(r.d)} (${f3(r.lo)} to ${f3(r.hi)})`;
const dec = s => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return c; };
function load(dir) {
  if (!existsSync(dir)) return null;
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).sort().map(x => JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()));
}
const cellsOf = (b, x) => { let a = 0, lost = 0, saved = 0, d = 0; for (let i = 0; i < b.length; i++) { if (b[i] && x[i]) a++; else if (b[i]) lost++; else if (x[i]) saved++; else d++; } return { a, lost, saved, d, N: b.length }; };
/* the three independent forms the reads used */
const FORMS = {
  cells: cs => survivalChange(cs.reduce((t, c) => t + c.lost, 0), cs.reduce((t, c) => t + c.saved, 0), cs.reduce((t, c) => t + c.N, 0)),
  cellsU: cs => pooledSummed(cs),
  variances: cs => { const k = cs.length, ds = cs.map(c => 100 * (c.saved - c.lost) / c.N), vs = cs.map(c => { const n = c.N, ps = c.saved / n, pl = c.lost / n; return 1e4 * (ps + pl - (ps - pl) ** 2) / n; }); const d = ds.reduce((t, x) => t + x, 0) / k, se = Math.sqrt(vs.reduce((t, x) => t + x, 0)) / k; return { d, lo: d - Z * se, hi: d + Z * se }; }
};
const R = join(HERE, '..', '..', '..'), MAIN = join(HERE, 'results');   // R: the repository's parent, where the scratch worktrees that ran some reads sit
/* each read: where its units are, its form, and each part: the arms compared, the bar, the side ('lo>' passes when the lower
   end is above the bar; 'hi<' reads harm when the upper end is below it), and what the part decided */
const READS = [
  { name: 'the lead test (HOUSEHOLD.md section 5 as amended; A LEAD, WITH A UNIT TO PLACE)', dir: join(MAIN, 'household-7002'), form: 'cells', parts: [{ base: 'K2', arm: 'HS5', bar: 0, side: 'lo>', what: 'part 1, the pooled gain (A LEAD needs it)' }] },
  { name: 'step 5, the shapes (SHAPES.md; A SHAPE TO PLACE)', dir: join(MAIN, 'shapes-7002'), form: 'cells', parts: [{ base: 'K2', arm: 'HS', bar: 0, side: 'lo>', what: 'part 1, the pooled gain (DOES NOT HOLD without it)' }] },
  { name: 'the remedy (HOUSEHOLD-REMEDY-READ.md; HSP MENDS)', dir: join(MAIN, 'household-remedy-7002'), form: 'cells', parts: ['HSPB', 'HSP', 'HSPS'].map(a => ({ base: 'K2', arm: a, bar: 0, side: 'lo>', what: `part 2, ${a}'s pooled gain (MENDS needs it)` })) },
  { name: 'what keys the guard (GUARD-KEY.md; +db NO HARM, +rent HARM)', dir: join(MAIN, 'guard-7002'), form: 'cells', groupBy: U => U.kind, parts: [{ group: 'db', base: 'APP', arm: 'K2', bar: 0, side: 'hi<', what: '+db: HARM if the pooled K2 less APP lies wholly below nought' }, { group: 'rent', base: 'APP', arm: 'K2', bar: 0, side: 'hi<', what: '+rent: HARM if the pooled K2 less APP lies wholly below nought' }] },
  { name: 'TIE-C2 (D108, D109: LOOKHOLD the couples\' default)', dir: join(MAIN, 'tie-c2-7001'), form: 'cellsU', parts: ['HOLD', 'LOOKHOLD', 'TIE4'].map(a => ({ base: 'CANDS', arm: a, bar: -0.1, side: 'lo>', what: `part 1, ${a}'s pooled survival` })) },
  { name: 'the shortlist\'s wider read (SPEED-B.md; singles HOLDS, couples LOSES)', dir: join(MAIN, 'speed-b-7002'), form: 'cellsU', groupBy: U => U.kind, parts: [{ group: 'single', base: 'WHOLE', arm: 'SPEED', bar: -0.1, side: 'lo>', what: 'singles, part 1' }, { group: 'couple', base: 'WHOLE', arm: 'SPEED', bar: -0.1, side: 'lo>', what: 'couples, part 1' }] },
  { name: 'TIE-C, a couple\'s tie rule (TIE-C.md; FAILS on part 5)', dir: join(MAIN, 'tie-couple-7002'), form: 'cellsU', parts: ['TIE5', 'TIE4'].map(a => ({ base: 'CANDS', arm: a, bar: -0.1, side: 'lo>', what: `part 1, ${a}'s pooled survival` })) },
  { name: 'JOINT-WIDE (FAILS on the pot)', dir: join(MAIN, 'joint-wide-7002'), form: 'variances', parts: ['K4', 'K6'].map(a => ({ base: 'K2', arm: a, bar: -0.1, side: 'lo>', what: `part 1, ${a}'s pooled survival` })) },
  { name: 'the allowance step at both places (ALLOWANCE-BOTH.md; FAILS on part 4)', dir: join(MAIN, 'allowance-both-7002'), form: 'variances', parts: [{ base: 'NOW', arm: 'BOTH', bar: -0.1, side: 'lo>', what: 'part 1' }] },
  { name: 'the ceiling\'s lead test, beside its rule (CEILING-LEAD.md: the ceiling\'s rule again with the tie-break)', dir: join(MAIN, 'ceiling-lead-7002'), form: 'variances', parts: [{ base: 'OFF', arm: 'NOW', bar: -0.1, side: 'lo>', what: 'HARVEST-CEILING.md part 1, again' }] },
  { name: 'item 12\'s stage A (ITEM12-A.md; NEITHER, on parts 3 and 5)', dir: join(R, 'scratch-i12/research/solver/results/item12-7002'), form: 'variances', parts: ['a', 'b'].map(a => ({ base: 'base', arm: a, bar: -0.1, side: 'lo>', what: `arm (${a}), part 1` })) },
  { name: 'the couples\' sweep check (COUPLE-SWEEP.md; D89: passes, the re-run launched)', dir: join(R, 'scratch-sweep/research/solver/results/couple-sweep-7002'), form: 'variances', parts: [{ base: 'GIA', arm: 'ISA', bar: -0.2, side: 'lo>', what: 'part 1' }] },
  { name: 'item 13 and item 7\'s stage A (TIE-A.md; D85, D86)', dir: join(R, 'scratch-tie/research/solver/results/tie-7002'), form: 'variances', parts: [{ base: '1', arm: '3', bar: -0.1, side: 'lo>', what: 'item 13, arm 3 (taken), part 1' }, { base: '1', arm: '2', bar: -0.1, side: 'lo>', what: 'item 13, arm 2, part 1' }, { base: '3', arm: '4', bar: -0.1, side: 'lo>', what: 'item 7, structure with the slice, part 1' }, { base: '3', arm: '5', bar: -0.1, side: 'lo>', what: 'item 7, order with the slice (built), part 1' }] },
  { name: 'the harvest ceiling, step 4 (HARVEST-CEILING.md; PASSES, to main)', dir: join(R, 'wt-ceiling/research/solver/results/ceiling-7002'), form: 'variances', parts: [{ base: 'BEFORE', arm: 'AFTER', bar: -0.1, side: 'lo>', what: 'part 1' }] }
];
const verdict = (r, p) => (p.side === 'lo>' ? (r.lo > p.bar ? 'holds' : 'FAILS') : (r.hi < p.bar ? 'HARM' : 'no harm'));
console.log('THE PATTERN SEARCH: POOLED SURVIVAL OVER UNITS THAT SHARE THEIR PATHS, AS THE READ TOOK IT AND BY PATH (EXPLORATORY; the reads stand as printed)');
let changed = 0, parts = 0;
for (const r of READS) {
  const units = load(r.dir);
  console.log(`\n${r.name}: ${units ? `${units.length} units from ${r.dir.replace(R + '/', '')}` : `NOT STORED (${r.dir})`}`);
  if (!units) continue;
  for (const p of r.parts) {
    const us = units.filter(U => !p.group || r.groupBy(U) === p.group && U.arms[p.base] && U.arms[p.arm]).filter(U => U.arms[p.base] && U.arms[p.arm]);
    const ns = [...new Set(us.map(U => dec(U.arms[p.base].survived).length))];
    if (ns.length !== 1) { console.log(`  ${p.what}: units of ${ns.join(', ')} paths: not one count, skipped`); continue; }
    const pairs = us.map(U => [{ survived: dec(U.arms[p.arm].survived) }, { survived: dec(U.arms[p.base].survived) }]);
    const cs = pairs.map(([x, b]) => cellsOf(b.survived, x.survived)), own = FORMS[r.form](cs), byPath = survivalItem(pairs, ns[0]);
    const v0 = verdict(own, p), v1 = verdict(byPath, p); parts++; if (v0 !== v1) changed++;
    console.log(`  ${p.what} (${p.arm} less ${p.base}, ${us.length} units of ${ns[0]} paths; bar ${p.side === 'lo>' ? 'the lower end above' : 'the upper end below'} ${p.bar}):`);
    console.log(`    as the read took it (${r.form}): ${iv(own)}, ${v0}; by path: ${iv(byPath)}, ${v1}; the by-path interval ${(byPath.hi - byPath.lo) / (own.hi - own.lo) >= 1 ? `${((byPath.hi - byPath.lo) / (own.hi - own.lo)).toFixed(2)} times as wide` : `${((own.hi - own.lo) / (byPath.hi - byPath.lo)).toFixed(2)} times narrower`}${v0 !== v1 ? ' — THE VERDICT WOULD CHANGE' : ''}`);
  }
}
// TIE-C2's part 8 (D108, D109: the choice of LOOKHOLD over HOLD rested on it): the typical path's pot, each couple's mean over
// the paths where both arms leave a pot of each path's change in percent (reduce-tie-c2.mjs potWays), pooled as the read took
// it (the couples' means averaged, their standard errors combined as if independent) and by path (each path's change scaled
// so that a couple's mean over every path is its own typical figure, then averaged over the couples path by path)
{
  const units = load(join(MAIN, 'tie-c2-7001'));
  const f64 = s => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Float64Array(c.buffer, 0, b.length / 8); };
  console.log(`\nTIE-C2's part 8, the typical path's pot (D109's choice of LOOKHOLD rested on its lower end above nought): ${units ? `${units.length} couples` : 'NOT STORED'}`);
  if (units) for (const arm of ['LOOKHOLD', 'HOLD']) {
    const rows = units.map(U => { const b = f64(U.arms.CANDS.pot), x = f64(U.arms[arm].pot), n = b.length, keep = []; for (let i = 0; i < n; i++) if (b[i] > 0 && x[i] > 0) keep.push(i); const z = new Float64Array(n); for (const i of keep) z[i] = (n / keep.length) * 100 * (x[i] / b[i] - 1); const v = keep.map(i => 100 * (x[i] / b[i] - 1)), m = v.reduce((t, y) => t + y, 0) / v.length, se = Math.sqrt(v.reduce((t, y) => t + (y - m) ** 2, 0) / (v.length - 1) / v.length); return { z, m, se, n }; });
    const k = rows.length, d = rows.reduce((t, r) => t + r.m, 0) / k, se = Math.sqrt(rows.reduce((t, r) => t + r.se ** 2, 0)) / k, own = { d, lo: d - Z * se, hi: d + Z * se };
    const n = rows[0].n, w = new Float64Array(n); for (const r of rows) for (let i = 0; i < n; i++) w[i] += r.z[i] / k;
    let mm = 0; for (let i = 0; i < n; i++) mm += w[i]; mm /= n; let vv = 0; for (let i = 0; i < n; i++) vv += (w[i] - mm) ** 2; const se2 = Math.sqrt(vv / (n - 1) / n), byPath = { d: mm, lo: mm - Z * se2, hi: mm + Z * se2 };
    const v0 = own.lo > 0 ? 'holds' : 'FAILS', v1 = byPath.lo > 0 ? 'holds' : 'FAILS'; parts++; if (v0 !== v1) changed++;
    console.log(`  ${arm} less CANDS (bar: the lower end above 0): as the read took it ${f3(own.d)}% (${f3(own.lo)} to ${f3(own.hi)}), ${v0}; by path ${f3(byPath.d)}% (${f3(byPath.lo)} to ${f3(byPath.hi)}), ${v1}${v0 !== v1 ? ' — THE VERDICT WOULD CHANGE' : ''}`);
  }
}
console.log(`\nTHE ISA SWEEP's experiment (ISA-SWEEP.md; D73's default): its arrays are no longer stored, so it is not rechecked here.`);
console.log(`\n${parts} parts read both ways; the by-path interval would change the verdict of ${changed}.`);
