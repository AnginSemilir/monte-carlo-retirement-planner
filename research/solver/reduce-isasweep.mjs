/*
 * WHERE THE SWEEP PUTS CASH ISA MONEY: THE READ (ISA-SWEEP.md; the review of 9 Nov, item 5; EXPLORATORY, deciding nothing).
 * The stamps first (fair-gate.mjs requireFairLogs), then the gate: every household in, one code, one audit, one seed and count
 * of paths; within a household both arms on the same plan (its inputs hash) and the same paths, their recorded settings the
 * same but `sweepCashIsaTo`; the ISA arm's first-year sweep live (cash ISA money to the ISA) wherever the household's
 * sheltered cash at the start is above £1,000. Then ISA-SWEEP.md's rule, d = survival under ISA less under GIA in points:
 *   1. the pooled mean of d over the households, its 95% interval from the households' paired variances: lower end above -0.2;
 *   2. no household's paired 95% interval (survivalChangeU) wholly below -0.5;
 *   3. the households' mean pot left under ISA, averaged over households, not lower than under GIA.
 *   node research/solver/reduce-isasweep.mjs [dir] > research/solver/results-isasweep.txt
 *   node research/solver/reduce-isasweep.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, zFor } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooledLo: -0.2, household: -0.5 };
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const arr = (b64, T) => (typeof b64 === 'string' ? new T(Buffer.from(b64, 'base64').buffer.slice(0)) : b64);
const armOf = a => ({ survived: arr(a.survived, Uint8Array), delivered: arr(a.delivered, Float64Array), target: arr(a.target, Float64Array), pot: arr(a.pot, Float64Array), tax: arr(a.tax, Float64Array) });
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
/* one household's paired survival: d (points), its interval, its variance (points squared), the discordant counts */
export function pairOf(G, I) {
  let a = 0, b = 0, c = 0, d = 0;
  for (let k = 0; k < G.length; k++) { if (G[k] && I[k]) a++; else if (G[k] && !I[k]) b++; else if (!G[k] && I[k]) c++; else d++; }
  const n = G.length, u = survivalChangeU(a, b, c, d), diff = (c - b) / n;
  const v = (1e4 * ((b + c) / n - diff * diff)) / n;   // the paired change's variance, in points squared
  return { ...u, v, saved: c, lost: b, sG: (100 * (a + b)) / n, sI: (100 * (a + c)) / n, n };
}
/* the rule over the units (each { id, G, I }: the arms' arrays) */
export function rule(units) {
  const H = units.map(u => {
    const p = pairOf(u.G.survived, u.I.survived);
    const potG = mean(Array.from(u.G.pot)), potI = mean(Array.from(u.I.pot));
    const del = x => (100 * x.delivered.reduce((s, y) => s + y, 0)) / Math.max(1e-9, x.target.reduce((s, y) => s + y, 0));
    return { id: u.id, p, potG, potI, delG: del(u.G), delI: del(u.I), taxG: mean(Array.from(u.G.tax)), taxI: mean(Array.from(u.I.tax)) };
  });
  const k = H.length, z = zFor(0.05);
  const pooled = H.reduce((s, h) => s + h.p.d, 0) / k, se = Math.sqrt(H.reduce((s, h) => s + h.p.v, 0)) / k;
  const lo = pooled - z * se, hi = pooled + z * se;
  const harmed = H.filter(h => h.p.hi < RULE.household);
  const potDiff = H.reduce((s, h) => s + (h.potI - h.potG), 0) / k;
  const part1 = lo > RULE.pooledLo, part2 = harmed.length === 0, part3 = potDiff >= 0;
  const outcome = part1 && part2 && part3 ? 'PASSES: to the maintainer, whose ruling naming this run would make \'isa\' the default'
    : !part1 || !part2 ? 'FAILS ON SURVIVAL: the default stays; the households and the ISA\'s tier below'
      : 'FAILS ON THE POT ONLY: the default stays';
  return { H, pooled, se, lo, hi, harmed, potDiff, part1, part2, part3, outcome };
}
/* the gate: refusals, each a line */
export function gate(units, ids, audit) {
  const P = [];
  const missing = ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`households missing: ${missing.join(', ')}`);
  const one = (what, f0) => { const vs = [...new Set(units.map(f0))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  for (const u of units) {
    const G = u.arms.GIA, I = u.arms.ISA;
    if (!G || !I) { P.push(`${u.id}: an arm missing`); continue; }
    if (G.inputs !== u.inputs || I.inputs !== u.inputs) P.push(`${u.id}: the arms ran on different plans`);
    const strip = s => s.replace(/^sweepCashIsaTo \S+( \(unset\))? \| /, '');
    if (!/^sweepCashIsaTo gia \(unset\) \| /.test(G.ran) || !/^sweepCashIsaTo isa \| /.test(I.ran)) P.push(`${u.id}: the arms' sweep settings are not GIA (unset) and ISA`);
    if (strip(G.ran) !== strip(I.ran)) P.push(`${u.id}: the arms' settings differ beyond sweepCashIsaTo`);
    for (const k of ['survived', 'pot', 'delivered', 'target', 'tax']) if (arr(G[k], k === 'survived' ? Uint8Array : Float64Array).length !== u.N || arr(I[k], k === 'survived' ? Uint8Array : Float64Array).length !== u.N) P.push(`${u.id}: ${k} not one a path`);
    if (u.cashIsa0 > 1000 && !(I.sweep && I.sweep.toIsa > 0) && !(I.sweep && I.sweep.toGia === 0 && G.sweep && G.sweep.toGia === 0)) P.push(`${u.id}: £${Math.round(u.cashIsa0)} sheltered, the ISA arm's first year moved none to the ISA though the GIA arm swept £${Math.round(G.sweep ? G.sweep.toGia : 0)}`);
  }
  return P;
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 1000;
  // a household with b lost and c saved of N, the pots given
  const unit = (id, b, c, potG = 100, potI = 100) => {
    const G = new Uint8Array(N).fill(1), I = new Uint8Array(N).fill(1);
    for (let k = 0; k < b; k++) I[k] = 0;
    for (let k = 0; k < c; k++) G[N - 1 - k] = 0;
    const flat = v => new Float64Array(N).fill(v);
    return { id, G: { survived: G, pot: flat(potG), delivered: flat(1), target: flat(1), tax: flat(1) }, I: { survived: I, pot: flat(potI), delivered: flat(1), target: flat(1), tax: flat(1) } };
  };
  const set = (xs) => xs.map(([id, b, c, pg, pi]) => unit(id, b, c, pg, pi));
  check('all three hold: no change anywhere', rule(set([['A', 0, 0], ['B', 0, 0]])).outcome.startsWith('PASSES'));
  // part 1: a pooled loss whose interval reaches below -0.2
  const r1 = rule(set([['A', 6, 0], ['B', 6, 0]]));
  check(`part 1 fails on a pooled loss of 0.6 points (its lower end ${r1.lo.toFixed(3)})`, !r1.part1 && r1.part2 && r1.outcome.startsWith('FAILS ON SURVIVAL'));
  // part 2: one household with 12 lost and none saved of 1,000: d -1.2, its upper end below -0.5
  const r2 = rule(set([['A', 12, 0], ['B', 0, 12], ['C', 0, 12], ['D', 0, 12]]));
  check(`part 2 fails on one household wholly below -0.5 (A: d ${r2.H[0].p.d.toFixed(2)}, upper end ${r2.H[0].p.hi.toFixed(3)}), the pooled change ${f(r2.pooled)} passing part 1`, r2.part1 && !r2.part2 && r2.harmed.map(h => h.id).join() === 'A');
  // part 2's edge: a household whose interval reaches -0.5 or above is not harmed
  const r2e = rule(set([['A', 6, 0], ['B', 0, 6], ['C', 0, 6]]));
  check(`part 2 at its edge: 6 lost of 1,000 (upper end ${r2e.H[0].p.hi.toFixed(3)}, not below -0.5) is not harmed`, r2e.part2);
  // part 3: the pot lower under ISA, survival unchanged
  const r3 = rule(set([['A', 0, 0, 100, 99], ['B', 0, 0, 100, 100]]));
  check('part 3 fails on a pot lower by 0.5 on average, survival the same', r3.part1 && r3.part2 && !r3.part3 && r3.outcome.startsWith('FAILS ON THE POT ONLY'));
  check('part 3 at its edge: the pot exactly the same holds', rule(set([['A', 0, 0, 100, 100]])).part3);
  // the gate
  const stamp = { code: 'c', audit: 'a' }, ok0 = (id, extra = {}) => ({ id, inputs: 'h', seed: 7002, N: 2, pts: 45, cashIsa0: 0, stamp, arms: {
    GIA: { inputs: 'h', ran: 'sweepCashIsaTo gia (unset) | pts 45', sweep: { toGia: 0, toIsa: 0 }, survived: new Uint8Array(2), pot: new Float64Array(2), delivered: new Float64Array(2), target: new Float64Array(2), tax: new Float64Array(2) },
    ISA: { inputs: 'h', ran: 'sweepCashIsaTo isa | pts 45', sweep: { toGia: 0, toIsa: 0 }, survived: new Uint8Array(2), pot: new Float64Array(2), delivered: new Float64Array(2), target: new Float64Array(2), tax: new Float64Array(2) } }, ...extra });
  check('the gate passes two fair units', gate([ok0('A'), ok0('B')], ['A', 'B'], 'a').length === 0);
  check('the gate refuses a missing household', gate([ok0('A')], ['A', 'B'], 'a').some(x => /missing: B/.test(x)));
  check('the gate refuses two codes', gate([ok0('A'), ok0('B', { stamp: { code: 'd', audit: 'a' } })], ['A', 'B'], 'a').some(x => /more than one code/.test(x)));
  const diff = ok0('A'); diff.arms.ISA = { ...diff.arms.ISA, ran: 'sweepCashIsaTo isa | pts 30' };
  check('the gate refuses arms whose settings differ beyond the option', gate([diff], ['A'], 'a').some(x => /differ beyond/.test(x)));
  const plans = ok0('A'); plans.arms.ISA = { ...plans.arms.ISA, inputs: 'other' };
  check('the gate refuses arms on different plans', gate([plans], ['A'], 'a').some(x => /different plans/.test(x)));
  const dead = ok0('A', { cashIsa0: 50000 }); dead.arms.GIA = { ...dead.arms.GIA, sweep: { toGia: 40000, toIsa: 0 } };
  check('the gate refuses an ISA arm that moved no cash ISA money though the household holds some above its buffer', gate([dead], ['A'], 'a').some(x => /moved none to the ISA/.test(x)));
  console.log('EDGES: a household losing 6 of 1,000 (its interval reaching above -0.5: not harmed) against 12 of 1,000 (wholly below: harmed), the pot exactly the same (holds), no change anywhere (passes), an ISA arm that moved nothing (refused)');
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(HERE, 'results', 'isasweep-7002');
  const { requireFairLogs } = await import('./fair-gate.mjs');
  requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  const { UNITS, stampFilesHash } = await import('./audit-isasweep.mjs');
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const P = gate(raw, UNITS, stampFilesHash());
  if (P.length) { console.log(`ISA-SWEEP GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const units = UNITS.map(id => { const u = raw.find(x => x.id === id); return { id, G: armOf(u.arms.GIA), I: armOf(u.arms.ISA), u }; });
  const R = rule(units), u0 = raw[0];
  console.log(`ISA-SWEEP (EXPLORATORY, D66; ISA-SWEEP.md): ${raw.length} households, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points; the gate: fair`);
  console.log(`\nEach household, GIA then ISA: survival (d, the paired 95% interval; saved, lost), spending delivered (% of the lifetime target), the mean pot left, the mean lifetime tax, the expected path's tax; the first year's sweep; the ISA's tier in year 1`);
  for (const h of R.H) {
    const u = units.find(x => x.id === h.id).u, g = u.arms.GIA, i = u.arms.ISA;
    console.log(`  ${h.id.padEnd(6)} survival ${h.p.sG.toFixed(2)}% / ${h.p.sI.toFixed(2)}%, d ${f(h.p.d)} (${f(h.p.lo)} to ${f(h.p.hi)}; ${h.p.saved} saved, ${h.p.lost} lost) | spending ${h.delG.toFixed(3)}% / ${h.delI.toFixed(3)}% | pot £${Math.round(h.potG).toLocaleString('en-GB')} / £${Math.round(h.potI).toLocaleString('en-GB')} (${f((100 * (h.potI - h.potG)) / Math.max(1, h.potG), 2)}%) | tax £${Math.round(h.taxG).toLocaleString('en-GB')} / £${Math.round(h.taxI).toLocaleString('en-GB')}; expected path £${Math.round(g.expTax).toLocaleString('en-GB')} / £${Math.round(i.expTax).toLocaleString('en-GB')} | sweep: GIA £${Math.round(g.sweep.toGia).toLocaleString('en-GB')} to taxable; ISA £${Math.round(i.sweep.toIsa).toLocaleString('en-GB')} to the ISA, £${Math.round(i.sweep.toGia).toLocaleString('en-GB')} to taxable (sheltered at the start £${Math.round(u.cashIsa0).toLocaleString('en-GB')}) | ISA tier year 1 ${g.isaTier1} / ${i.isaTier1}`);
  }
  console.log(`\nISA-SWEEP.md's rule:`);
  console.log(`  1. pooled survival, the mean of d over ${R.H.length} households: ${f(R.pooled)} (95% ${f(R.lo)} to ${f(R.hi)}, se ${R.se.toFixed(4)}); its lower end above ${RULE.pooledLo}: ${R.part1 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  2. no household's interval wholly below ${RULE.household}: ${R.harmed.length ? R.harmed.map(h => `${h.id} (${f(h.p.lo)} to ${f(h.p.hi)})`).join(', ') : 'none'}: ${R.part2 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  3. the mean pot left, ISA less GIA averaged over households: ${R.potDiff >= 0 ? '+' : '-'}£${Math.abs(Math.round(R.potDiff)).toLocaleString('en-GB')}; not lower: ${R.part3 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  beside: spending delivered, ISA less GIA averaged over households ${f(R.H.reduce((s, h) => s + h.delI - h.delG, 0) / R.H.length, 4)} points of the target; the expected path's tax £${Math.round(raw.reduce((s, u) => s + u.arms.ISA.expTax - u.arms.GIA.expTax, 0) / raw.length).toLocaleString('en-GB')} a household`);
  console.log(`OUTCOME: ${R.outcome}`);
  const secs = raw.flatMap(u => Object.values(u.arms).map(a => a.solveSecs + a.secs));
  console.log(`The run: ${(secs.reduce((a, b) => a + b, 0) / 3600).toFixed(1)} core-hours over the units' arms; the hosts: ${[...new Set(raw.map(u => u.cpu))].join('; ')}`);
}
