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
 *      own standard error): the pattern search's class (results-pooled-bypath.txt); and, added after the reviewer at the read
 *      (reviews/2026-11-19-read-save.md), its spending by path (spendingItem);
 * Added after the reviewer at the read, its findings 2 and 3:
 *   6. the panel without S310F, the one household the engine's ISA defect reaches (results-save-isa-deposits.txt), by the
 *      read's own read(), beside S310F's own adjusted p from section 1;
 *   7. S308F, the harm, beside it the effects the units show, and the other four households whose saves went ISA first:
 *      lifetime spending delivered in pounds a path; the estate's mean, its median and the paths where it is higher or lower
 *      by more than a pound; the levels the policy set (audit-phase4.mjs runPath's level: 100 times the year's living target
 *      as the move sets it, over the plan's target at that age; set, not paid), CANDS less CANDD a path-year, over three bands
 *      of retired years, in every year (the years after a path runs out included) and before each path's first failure year
 *      in either arm; the lifetime spending change split at that year (before it the levels set times the plan's target,
 *      flat on these households, the largest residual on a path printed; from it on the levels set less the unmet), each
 *      part with its se by path, and the unmet change; the failures in the bridge (the reader's years, as results-save-skip.txt
 *      prints them) and after it, and the paths each arm keeps or loses by when the other fails; the first year the two
 *      arms' levels part; the pots at the top of the first retired year (runPolicy's first 1,000 paths, as the read prints
 *      them). The levels set, the split and the failures' move added after the reviewer's second round
 *      (reviews/2026-11-19-read-save-2.md).
 *   node research/solver/save-beside.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, verdictOf } from './reduce-save.mjs';
import { saveIds } from './audit-save.mjs';
import { readPanel } from './phase4-panel.mjs';
import { survivalItem, spendingItem } from './reduce-phase4.mjs';

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
  console.log(`  by path ${bp.d >= 0 ? '+' : ''}${bp.d.toFixed(3)} (${bp.lo.toFixed(3)} to ${bp.hi.toFixed(3)}), se ${bp.se.toFixed(4)}, on ${n} paths of ${pairs.length} households`);
  const decF = (u, k) => { const b = Buffer.from(u.main[k], 'base64'), c = new Uint8Array(b.length); c.set(b); return new Float32Array(c.buffer); };
  const sp = spendingItem(R.rows.map(r => [{ delivered: decF(r.b, 'delivered') }, { delivered: decF(r.a, 'delivered') }]), n);
  console.log(`  the spending delivered by path (each path's change in percent of the household's CANDD mean, averaged over the households): ${f4(sp.d)}% (${f4(sp.lo)} to ${f4(sp.hi)}), se ${sp.se.toFixed(4)}; the read's, each household counted once: ${f4(R.spend.m)}% (se ${R.spend.se.toFixed(4)})`); }
console.log('\n6. The panel without S310F, the one household the engine\'s ISA defect reaches (results-save-isa-deposits.txt), by the read\'s own read():');
{ const R6 = read(units, ids.filter(id => id !== 'S310F')), v = V.rows.find(r => r.id === 'S310F');
  console.log(`  ${R6.rows.length} households: survival ${R6.surv.m >= 0 ? '+' : ''}${R6.surv.m.toFixed(3)} points (se ${R6.surv.se.toFixed(4)}); spending delivered ${f4(R6.spend.m)}% (se ${R6.spend.se.toFixed(4)}); the read's on all ${R.rows.length}: ${R.surv.m >= 0 ? '+' : ''}${R.surv.m.toFixed(3)} (se ${R.surv.se.toFixed(4)}) and ${f4(R.spend.m)}% (se ${R.spend.se.toFixed(4)})`);
  console.log(`  S310F's own: survival gain Holm ${e(v.holmGain)}, spending gain Holm ${e(v.holmSpendGain)} (section 1): not among the households the verdict names`); }
console.log('\n7. S308F, the harm, and beside it the other four households whose saves went ISA first (CANDS less CANDD on each, from the unit files):');
{ const by = {}; for (const u of units) (by[u.id] ||= {})[u.arm] = u;
  const decF = (u, k) => { const b = Buffer.from(u.main[k], 'base64'), c = new Uint8Array(b.length); c.set(b); return new Float32Array(c.buffer); };
  const decU = (u, k) => { const b = Buffer.from(u.main[k], 'base64'), c = new Uint8Array(b.length); c.set(b); return c; };
  const decI = (u, k) => { const b = Buffer.from(u.main[k], 'base64'), c = new Uint8Array(b.length); c.set(b); return new Int16Array(c.buffer); };
  // the bridge reader's years of each household, as the probe after the read printed them (results-save-skip.txt)
  const skip = readFileSync(join(HERE, 'results-save-skip.txt'), 'utf8').split(/\n(?=S\d)/).map(blk => { const m = /^(S\w+): /.exec(blk), r = /the reader's tables in years (\d+)-(\d+):/.exec(blk); return m ? { id: m[1], reader: r ? [Number(r[1]), Number(r[2])] : null } : null; }).filter(Boolean);
  const med = a => { const s = Float64Array.from(a).sort(), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const gbp = x => `${x < 0 ? '-' : '+'}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
  for (const id of ['S308F', 'S304F', 'S306F', 'S310F', 'S340F']) {
    const a = by[id].CANDD, b = by[id].CANDS, n = a.N, Y = a.Y, R0 = a.retireT;
    const da = decF(a, 'delivered'), db = decF(b, 'delivered'), ea = decF(a, 'estate'), eb = decF(b, 'estate'), la = decU(a, 'level'), lb = decU(b, 'level');
    let DA = 0, DB = 0; for (let k = 0; k < n; k++) { DA += da[k]; DB += db[k]; }
    const de = Array.from(eb, (v, k) => v - ea[k]); let up = 0, dn = 0; for (const x of de) { if (x > 1) up++; else if (x < -1) dn++; }
    const mE = de.reduce((x, v) => x + v, 0) / n, sE = Math.sqrt(Math.max(0, de.reduce((x, v) => x + v * v, 0) / n - mE * mE) / n);
    // the levels the policy set (runPath's level: 100 x the year's living target as the move sets it, over the plan's target
    // at that age; set, not paid, so the years after a path runs out are in it), a path-year: in every retired year, and before
    // each path's first failure year in either arm (the years both arms still pay)
    const fa = decI(a, 'failYear'), fb = decI(b, 'failYear'), ua = decF(a, 'unmet'), ub = decF(b, 'unmet'), firstFail = k => Math.min(fa[k] < 0 ? Y : fa[k], fb[k] < 0 ? Y : fb[k]);
    const BANDS = [[R0, Math.min(R0 + 6, Y)], [R0 + 6, Math.min(R0 + 16, Y)], [R0 + 16, Y]];
    const bandOf = before => BANDS.map(([x, y]) => { let s = 0, c = 0; for (let k = 0; k < n; k++) { const f = before ? firstFail(k) : Y; for (let t = x; t < Math.min(y, f); t++) { s += lb[k * Y + t] - la[k * Y + t]; c++; } } return `years ${x}-${y - 1} ${c ? `${s / c >= 0 ? '+' : ''}${(s / c).toFixed(3)}` : '-'} (${c} path-years)`; });
    // the lifetime spending change split at each path's first failure year in either arm: before it the levels set times the
    // plan's target (flat on these households: the residual checks it), from it on the levels set less the unmet; each with
    // its se by path; and the unmet change
    const msd = xs => { const m = xs.reduce((x, v) => x + v, 0) / xs.length, v = xs.reduce((x, y) => x + (y - m) ** 2, 0) / (xs.length - 1); return [m, Math.sqrt(v / xs.length)]; };
    const pre = [], post = [], tot = [], du = []; let nf = 0, resid = 0;
    for (let k = 0; k < n; k++) { const f = firstFail(k); if (f < Y) nf++; let p = 0, q = 0; for (let t = 0; t < Y; t++) { const d = (lb[k * Y + t] - la[k * Y + t]) / 100 * a.target; if (t < f) p += d; else q += d; }
      pre.push(p); post.push(q - (ub[k] - ua[k])); tot.push(db[k] - da[k]); du.push(ub[k] - ua[k]); resid = Math.max(resid, Math.abs(db[k] - da[k] - p - (q - (ub[k] - ua[k])))); }
    const [mT, sT] = msd(tot), [mP, sP] = msd(pre), [mQ, sQ] = msd(post), [mU, sU] = msd(du);
    // the failures by when: in the bridge (the reader's years, results-save-skip.txt) or after it
    const rd = (skip.find(x => x.id === id) || {}).reader, inB = f => rd && f >= rd[0] && f <= rd[1], when = f => (f < 0 ? 'kept' : inB(f) ? 'bridge' : 'after');
    const cnt = (f, w) => { let c = 0; for (let k = 0; k < n; k++) if (when(f[k]) === w) c++; return c; };
    const cross = (wa, wb) => { let c = 0, xa = 0, xb = 0; for (let k = 0; k < n; k++) if (when(fa[k]) === wa && when(fb[k]) === wb) { c++; xa += ua[k]; xb += ub[k]; } return { c, xa, xb }; };
    const kB = cross('bridge', 'kept'), lB = cross('bridge', 'after'), bB = cross('bridge', 'bridge'), lostA = cross('kept', 'after'), lostB = cross('kept', 'bridge'), bothA = cross('after', 'after');
    let never = 0; const first = {}; for (let k = 0; k < n; k++) { let t0 = -1; for (let t = 0; t < Y; t++) if (la[k * Y + t] !== lb[k * Y + t]) { t0 = t; break; } if (t0 < 0) never++; else first[t0] = (first[t0] || 0) + 1; }
    const firstTxt = Object.entries(first).sort((x, y) => y[1] - x[1] || x[0] - y[0]).slice(0, 4).map(([t, c]) => `year ${t} on ${c}`).join(', ');
    const pa = (a.after || [])[0] || {}, pb = (b.after || [])[0] || {};
    console.log(`  ${id} (retired from year ${R0}; ${n} paths): lifetime spending delivered CANDD £${Math.round(DA / n).toLocaleString('en-GB')} a path, CANDS ${gbp((DB - DA) / n)} a path (${f4(100 * (DB - DA) / DA)}%)`);
    console.log(`    the estate: the mean ${gbp(mE)} a path (se ${Math.round(sE).toLocaleString('en-GB')}), the median ${gbp(med(de))}; higher by more than £1 on ${up} paths, lower on ${dn}; CANDD's own median estate £${Math.round(med(Array.from(ea))).toLocaleString('en-GB')}`);
    console.log(`    the levels the policy set, CANDS less CANDD, in points of the year's target a path-year: in every retired year, the years after a path runs out included: ${bandOf(false).join('; ')}; before each path's first failure year in either arm: ${bandOf(true).join('; ')}`);
    console.log(`    the lifetime spending change split at each path's first failure year in either arm (one fails on ${nf} paths): ${gbp(mT)} a path (se ${Math.round(sT).toLocaleString('en-GB')}) = before it ${gbp(mP)} (se ${Math.round(sP).toLocaleString('en-GB')}) + from it on ${gbp(mQ)} (se ${Math.round(sQ).toLocaleString('en-GB')}); the largest residual on a path £${resid.toFixed(2)}; the unmet spending ${gbp(mU)} a path (se ${Math.round(sU).toLocaleString('en-GB')})`);
    if (rd) console.log(`    the failures, in the bridge (years ${rd[0]}-${rd[1]}, the reader's) and after it: CANDD ${cnt(fa, 'bridge') + cnt(fa, 'after')} (${cnt(fa, 'bridge')} and ${cnt(fa, 'after')}), CANDS ${cnt(fb, 'bridge') + cnt(fb, 'after')} (${cnt(fb, 'bridge')} and ${cnt(fb, 'after')}); of CANDD's in the bridge CANDS keeps ${kB.c}, fails after it on ${lB.c} and in it on ${bB.c}; the paths CANDS loses that CANDD keeps ${lostA.c + lostB.c} (after the bridge ${lostA.c}${lostA.c ? `, unmet ${gbp(lostA.xb / lostA.c).slice(1)} each, ${gbp(lostA.xb / n)} a path over the ${n}` : ''}); the paths both lose after the bridge ${bothA.c}${bothA.c ? `, unmet CANDD ${gbp(bothA.xa / bothA.c).slice(1)} and CANDS ${gbp(bothA.xb / bothA.c).slice(1)} each, ${gbp((bothA.xb - bothA.xa) / n)} a path over the ${n}` : ''}`);
    console.log(`    the first year the two arms' levels part: never on ${never} paths; else most often ${firstTxt}`);
    console.log(`    the pots at the top of the first retired year (runPolicy's first ${pa.n || 0} paths), CANDS less CANDD: pension ${gbp((pb.pen || 0) - (pa.pen || 0))}, ISA ${gbp((pb.isa || 0) - (pa.isa || 0))}, taxable ${gbp((pb.tax || 0) - (pa.tax || 0))}`);
  } }
