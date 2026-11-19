/*
 * BESIDE THE SAVINGS FACTORIAL'S READ (B7-FACTORIALS.md; EXPLORATORY, written after the read, deciding nothing): the figures
 * the windfall read's reviewer asked of that read (reviews/2026-11-18-read-windfall.md, findings 2, 3, 5 and 6), here for the savings
 * factorial, from the run's unit files (results/save-7002):
 *   1. each household's survival and spending tests (b7-verdict.mjs: the exact one-sided tests and the seeded sign-flip test,
 *      Holm over the households), the adjusted p of each;
 *   2. the panel's spending, each household counted once, with and without S308F (its spending down beyond noise); and pooled in
 *      pounds (GAIN-BUCKET's form);
 *   3. the run's core-hours (the solves and the engine);
 *   4. where CANDS's policy put the year's saving over the working years (runPolicy beside the engine, as the read prints each
 *      household's), counted over the panel: the households whose saves went pension first on 90% or more of their
 *      decisions, and the rest with their shares;
 *   5. the panel's survival by path (reduce-phase4.mjs survivalItem), beside the read's (each household counted once with its
 *      own standard error): the pattern search's class (results-pooled-bypath.txt).
 *   node research/solver/save-beside.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, verdictOf } from './reduce-save.mjs';
import { saveIds } from './audit-save.mjs';
import { readPanel } from './phase4-panel.mjs';
import { survivalItem } from './reduce-phase4.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'save-7002');
const units = readdirSync(DIR).filter(x => x.endsWith('.json.gz')).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const ids = saveIds(readPanel()), R = read(units, ids), V = verdictOf(R);
const e = x => x.toExponential(2), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
console.log(`BESIDE THE SAVINGS FACTORIAL'S READ (EXPLORATORY, after the read, deciding nothing; as the windfall read's reviewer asked of that read): ${units.length} units from ${DIR}, seed ${units[0].seed}, ${units[0].N} paths; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}; the verdict ${V.outcome}`);
console.log('\n1. Each household, CANDS against CANDD (one-sided p, then Holm over the households):');
for (const r of V.rows) console.log(`  ${r.id.padEnd(6)} survival: harm p ${e(r.pHarm)} (Holm ${e(r.holmHarm)}), gain p ${e(r.pGain)} (Holm ${e(r.holmGain)}); spending: loss p ${e(r.pSpendLoss)} (Holm ${e(r.holmSpendLoss)}), gain p ${e(r.pSpendGain)} (Holm ${e(r.holmSpendGain)})`);
const pool = rows => { const ms = rows.map(r => r.p.spend); return { m: ms.reduce((x, v) => x + v.m, 0) / ms.length, se: Math.sqrt(ms.reduce((x, v) => x + v.se * v.se, 0)) / ms.length }; };
const iv = x => `${f4(x.m)}% (${f4(x.m - 1.96 * x.se)} to ${f4(x.m + 1.96 * x.se)})`;
console.log('\n2. The panel\'s spending delivered, CANDS against CANDD:');
console.log(`  each household counted once: ${iv(pool(R.rows))}; without S308F (its spending down beyond noise): ${iv(pool(R.rows.filter(r => r.id !== 'S308F')))}`);
{ // pooled in pounds: the change in the panel's total spending over its total (GAIN-BUCKET's form), its se from the households' own
  let DA = 0, DB = 0, V2 = 0;
  const dec = (u, k, T) => { const b = Buffer.from(u.main[k], 'base64'); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };
  for (const r of R.rows) {
    const a = dec(r.a, 'delivered', Float32Array), b = dec(r.b, 'delivered', Float32Array), n = a.length;
    let s = 0, s2 = 0; for (let k = 0; k < n; k++) { const d = b[k] - a[k]; s += d; s2 += d * d; DA += a[k]; DB += b[k]; }
    const m = s / n; V2 += n * n * Math.max(0, s2 / n - m * m) / n;
  }
  const m = 100 * (DB - DA) / DA, se = 100 * Math.sqrt(V2) / DA;
  console.log(`  pooled in pounds: ${iv({ m, se })}`);
}
const solve = arm => units.filter(u => u.arm === arm).reduce((x, u) => x + u.solveSecs, 0) / 3600, eng = units.reduce((x, u) => x + u.engineSecs, 0) / 3600;
const whole = units.reduce((x, u) => x + u.secs, 0) / 3600;
console.log(`\n3. The run's cost: the solves CANDD ${solve('CANDD').toFixed(2)} and CANDS ${solve('CANDS').toFixed(2)} core-hours, the engine ${eng.toFixed(2)}; the units whole (the checks and runPolicy beside included) ${whole.toFixed(2)} core-hours at ${units[0].N} paths; at ${2 * units[0].N} paths the engine twice, about ${(whole + eng).toFixed(2)} (the units ran arm by arm, CANDD's first, so the two arms' solve times were taken under different loads)`);
console.log('\n4. Where CANDS put the year\'s saving over the working years (runPolicy beside the engine; the plan / pension first / ISA first):');
{ const shares = R.rows.map(r => { const ch = (r.b.chosen || []).reduce((x, c) => x.map((v, i) => v + c[i]), [0, 0, 0]), tot = ch.reduce((x, v) => x + v, 0) || 1; return { id: r.id, s: ch.map(v => 100 * v / tot), n: tot }; });
  const pen = shares.filter(x => x.s[1] >= 90);
  console.log(`  pension first on 90% or more of the decisions: ${pen.length} of ${shares.length} households (${pen.map(x => x.id).join(', ')})`);
  for (const x of shares.filter(y => y.s[1] < 90)) console.log(`  ${x.id.padEnd(6)} the plan ${x.s[0].toFixed(0)}%, pension first ${x.s[1].toFixed(0)}%, ISA first ${x.s[2].toFixed(0)}% of ${x.n}`); }
console.log('\n5. The panel\'s survival, CANDS against CANDD, by path (each path\'s change averaged over the households):');
{ const dec8 = (u, k) => { const b = Buffer.from(u.main[k], 'base64'), c = new Uint8Array(b.length); c.set(b); return c; };
  const pairs = R.rows.map(r => [{ survived: dec8(r.b, 'survived') }, { survived: dec8(r.a, 'survived') }]), n = Math.min(...pairs.map(([x]) => x.survived.length)), bp = survivalItem(pairs, n);
  console.log(`  by path ${bp.d >= 0 ? '+' : ''}${bp.d.toFixed(3)} (${bp.lo.toFixed(3)} to ${bp.hi.toFixed(3)}), se ${bp.se.toFixed(4)}, on ${n} paths of ${pairs.length} households`); }
