/*
 * BESIDE THE WINDFALL FACTORIAL'S READ (B7-FACTORIALS.md; EXPLORATORY, written after the read, deciding nothing): the figures
 * the reviewer at the read asked for (reviews/2026-11-18-read-windfall.md, findings 2, 3, 5 and 6), from the run's unit
 * files (results/windfall-7002):
 *   1. each household's survival and spending tests (b7-verdict.mjs: the exact one-sided tests and the seeded sign-flip test,
 *      Holm over the households), the adjusted p of each;
 *   2. the panel's spending, each household counted once, with and without S026; and pooled in pounds (GAIN-BUCKET's form);
 *   3. the run's core-hours (the solves and the engine), the cost amendment 2 of B7-FACTORIALS.md estimated.
 *   node research/solver/windfall-beside.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, verdictOf } from './reduce-windfall.mjs';
import { windfallIds } from './audit-windfall.mjs';
import { readPanel } from './phase4-panel.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'windfall-7002');
const units = readdirSync(DIR).filter(x => x.endsWith('.json.gz')).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const ids = windfallIds(readPanel()), R = read(units, ids), V = verdictOf(R);
const e = x => x.toExponential(2), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
console.log(`BESIDE THE WINDFALL FACTORIAL'S READ (EXPLORATORY, after the read, deciding nothing; the reviewer's findings 2, 3, 5 and 6): ${units.length} units from ${DIR}, seed ${units[0].seed}, ${units[0].N} paths; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}; the verdict ${V.outcome}`);
console.log('\n1. Each household, CANDW against CANDD (one-sided p, then Holm over the households):');
for (const r of V.rows) console.log(`  ${r.id.padEnd(6)} survival: harm p ${e(r.pHarm)} (Holm ${e(r.holmHarm)}), gain p ${e(r.pGain)} (Holm ${e(r.holmGain)}); spending: loss p ${e(r.pSpendLoss)} (Holm ${e(r.holmSpendLoss)}), gain p ${e(r.pSpendGain)} (Holm ${e(r.holmSpendGain)})`);
const pool = rows => { const ms = rows.map(r => r.p.spend); return { m: ms.reduce((x, v) => x + v.m, 0) / ms.length, se: Math.sqrt(ms.reduce((x, v) => x + v.se * v.se, 0)) / ms.length }; };
const iv = x => `${f4(x.m)}% (${f4(x.m - 1.96 * x.se)} to ${f4(x.m + 1.96 * x.se)})`;
console.log('\n2. The panel\'s spending delivered, CANDW against CANDD:');
console.log(`  each household counted once: ${iv(pool(R.rows))}; without S026: ${iv(pool(R.rows.filter(r => r.id !== 'S026')))}`);
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
console.log(`\n3. The run's cost: the solves CANDD ${solve('CANDD').toFixed(2)} and CANDW ${solve('CANDW').toFixed(2)} core-hours, the engine ${eng.toFixed(2)}; the units whole (the checks and runPolicy beside included) ${whole.toFixed(2)} core-hours at ${units[0].N} paths; at ${2 * units[0].N} paths the engine twice, about ${(whole + eng).toFixed(2)} (the units ran arm by arm, CANDD's first, so the two arms' solve times were taken under different loads)`);
