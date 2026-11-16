/*
 * TIE-C2, BESIDE THE READ (TIE-C2.md; D105; EXPLORATORY, seed 7001, deciding nothing). From the units in results/tie-c2-7001:
 * A. THE SPEED EXCEPTION AND THE ARMS' ORDER. Each arm's engine time is a wall clock (audit-tie-c2.mjs: Date.now() around the
 *    arm's 8,000 paths), four units at a time, each process running the arms in the order CANDS, HOLD, LOOKHOLD, TIE4. Units 0
 *    to 3 ran first, from the batch's start (its log: 15 Nov 19:33 UK), while the session worked on the machine (git log: four
 *    commits from 19:58 to 20:23 UK); units 4 to 11 ran on a quiet machine. Printed: by unit in the order run, each arm's
 *    seconds and its times against the others', and units 0 to 3's arm windows; HOLD's stored outcomes against CANDS's, byte
 *    for byte (HOLD makes CANDS's moves, so its time against CANDS's measures the order, not work); the first arm's effect as
 *    the quiet units show it (HOLD and TIE4 against CANDS); and the rule's median (LOOKHOLD against CANDS over the twelve) beside
 *    readings that undo that effect or the load on units 0 to 3: rescaled by the quiet units' HOLD and TIE4 against CANDS,
 *    LOOKHOLD against TIE4 (both run after the first arm), units 0 to 3 set above every other couple against CANDS, HOLD and
 *    TIE4, and by cohort, with the decisions at which the look changed the pick in the replays (each arm's own path, the
 *    first 100 paths of each couple).
 * B. THE PATHS A TENTH LOWER OR HIGHER, WITH THEIR LIFETIME TAX (TIE-C2.md, beside the rule): for LOOKHOLD and TIE4 against
 *    CANDS, each path whose pot ends more than a tenth lower, with its pot and lifetime tax in both arms and whether it ends
 *    below the household's cap (the sum of the two people's caps) in both; the paths a tenth higher by couple; and over all
 *    paths, the capped pot (each path's pot up to the household's cap) lower and higher by more than a pound, and the pounds.
 * C. THE POOLED TYPICAL-PATH CHANGE TAKEN BY PATH (the reviewer at the read, finding 4): the young eight share a horizon on
 *    seed 7001, so the same paths. Beside the reducer's pooled interval (the couples taken as independent), each path's mean
 *    change over the twelve, on the paths where all twelve leave a pot in both arms, and its standard error over the paths.
 *   node research/solver/tie-c2-beside.mjs > research/solver/results-tie-c2-beside.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULE, armOf, potWays } from './reduce-tie-c2.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'tie-c2-7001');
const ARMS = ['CANDS', 'HOLD', 'LOOKHOLD', 'TIE4'], START = { h: 19, m: 33 }; // the batch's log: "from 15 Nov 19:33 UK"
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString())).sort((a, b) => a.k - b.k);
const units = raw.map(u => ({ ...u, dec: Object.fromEntries(ARMS.map(a => [a, armOf(u.arms[a])])) }));
const median = a => { const s = [...a].sort((p, q) => p - q), k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; };
const r = (u, x, b) => u.arms[x].engineSecs / u.arms[b].engineSecs, x3 = v => `x${v.toFixed(3)}`, f = (v, d = 3) => (v >= 0 ? '+' : '') + v.toFixed(d);
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, m1 = v => `£${(v / 1e6).toFixed(2)}m`;
const at = s => { const t = START.h * 60 + START.m + s / 60; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`; };

console.log(`TIE-C2, BESIDE THE READ (EXPLORATORY, seed 7001, deciding nothing): ${units.length} units`);
console.log(`\nA. THE SPEED EXCEPTION AND THE ARMS' ORDER: the engine's wall clock, four units at a time, each unit's arms in the order ${ARMS.join(', ')}; the bar x${RULE.slower} on the median over the couples of LOOKHOLD's time a path against CANDS's`);
for (const u of units) {
  let s = u.solveSecs; const win = ARMS.map(a => { const w = `${a} ${at(s)} to ${at(s + u.arms[a].engineSecs)}`; s += u.arms[a].engineSecs; return w; });
  console.log(`  unit ${u.k} ${u.id.padEnd(6)} ${ARMS.map(a => `${a} ${u.arms[a].engineSecs.toFixed(0)} s`).join(', ')}; against CANDS: HOLD ${x3(r(u, 'HOLD', 'CANDS'))}, LOOKHOLD ${x3(r(u, 'LOOKHOLD', 'CANDS'))}, TIE4 ${x3(r(u, 'TIE4', 'CANDS'))}; LOOKHOLD against HOLD ${x3(r(u, 'LOOKHOLD', 'HOLD'))}, against TIE4 ${x3(r(u, 'LOOKHOLD', 'TIE4'))}${u.k < 4 ? `; the arms, from the batch's start (UK, to the minute): ${win.join(', ')}` : ''}`);
}
// HOLD's stored outcomes against CANDS's, path by path: survival, the failure year, the pot, lifetime tax, spending delivered
{ const KEYS = ['survived', 'failYear', 'pot', 'tax', 'delivered']; let paths = 0, differ = 0;
  for (const u of units) {
    const b = KEYS.map(k => Buffer.from(u.arms.CANDS[k], 'base64')), h = KEYS.map(k => Buffer.from(u.arms.HOLD[k], 'base64'));
    const size = KEYS.map((k, i) => b[i].length / u.N);
    for (let p = 0; p < u.N; p++) { paths++; if (KEYS.some((k, i) => b[i].compare(h[i], p * size[i], (p + 1) * size[i], p * size[i], (p + 1) * size[i]) !== 0)) differ++; }
  }
  console.log(`  HOLD's stored outcomes (${KEYS.join(', ')}) against CANDS's, byte for byte: ${differ} of ${paths} paths differ`); }
const first = units.filter(u => u.k < 4), quiet = units.filter(u => u.k >= 4), young = units.filter(u => u.cohort === 'young'), lib = units.filter(u => u.cohort !== 'young');
const below1 = (us, x, b) => us.filter(u => r(u, x, b) < 1).length;
const fH = median(quiet.map(u => r(u, 'HOLD', 'CANDS'))), fT = median(quiet.map(u => r(u, 'TIE4', 'CANDS')));
console.log(`  the first arm's effect: on units 0 to 3 (the session working) HOLD against CANDS the median ${x3(median(first.map(u => r(u, 'HOLD', 'CANDS'))))}; on the quiet units 4 to 11, HOLD against CANDS ${x3(fH)} (${below1(quiet, 'HOLD', 'CANDS')} of ${quiet.length} below one) and TIE4 against CANDS ${x3(fT)} (${below1(quiet, 'TIE4', 'CANDS')} of ${quiet.length} below one): CANDS, run first, reads slow on a quiet machine though HOLD makes its every move`);
const L = units.map(u => r(u, 'LOOKHOLD', 'CANDS')), asRead = median(L), inf = (us, x, b) => median([...us.map(u => r(u, x, b)), ...first.map(() => Infinity)]);
console.log(`  the rule's median, LOOKHOLD against CANDS over the twelve: ${x3(asRead)} as read; rescaled by the quiet units' HOLD against CANDS ${x3(asRead / fH)}, by their TIE4 against CANDS ${x3(asRead / fT)}`);
console.log(`  LOOKHOLD against the arms run after the first, over the twelve: against HOLD ${x3(median(units.map(u => r(u, 'LOOKHOLD', 'HOLD'))))} (units 0 to 3's HOLD run while the session worked), against TIE4 ${x3(median(units.map(u => r(u, 'LOOKHOLD', 'TIE4'))))}`);
console.log(`  units 0 to 3 set above every other couple (whatever load they carried): against CANDS ${x3(inf(quiet, 'LOOKHOLD', 'CANDS'))}, against HOLD ${x3(inf(quiet, 'LOOKHOLD', 'HOLD'))}, against TIE4 ${x3(inf(quiet, 'LOOKHOLD', 'TIE4'))}`);
const looks = us => us.map(u => u.own.LOOKHOLD.lookChanged), rng = a => `${Math.min(...a)} to ${Math.max(...a)}`;
console.log(`  by cohort, LOOKHOLD against CANDS: the young ${young.length} the median ${x3(median(young.map(u => r(u, 'LOOKHOLD', 'CANDS'))))} (against TIE4 ${x3(median(young.map(u => r(u, 'LOOKHOLD', 'TIE4'))))}), the look changing the pick at ${rng(looks(young))} decisions a couple; the library's ${lib.length} ${x3(Math.min(...lib.map(u => r(u, 'LOOKHOLD', 'CANDS'))))} to ${x3(Math.max(...lib.map(u => r(u, 'LOOKHOLD', 'CANDS'))))}, at ${rng(looks(lib))} decisions a couple`);
const readings = [asRead / fH, asRead / fT, median(units.map(u => r(u, 'LOOKHOLD', 'TIE4')))];
console.log(`  so: the rule's reading ${x3(asRead)} is ${asRead > RULE.slower ? 'above' : 'below'} the bar; with the first arm's effect undone the readings run from ${x3(Math.min(...readings))} to ${x3(Math.max(...readings))}, ${readings.filter(v => v > RULE.slower).length} of ${readings.length} above it: the bar x${RULE.slower} lies within the timing's own order effect, and the median over the twelve sits below it through the library's four`);

console.log(`\nB. THE PATHS A TENTH LOWER OR HIGHER, WITH THEIR LIFETIME TAX (against CANDS; below the cap: the path's pot under the household's cap, the two people's caps together, in both arms)`);
for (const X of ['LOOKHOLD', 'TIE4']) {
  const low = [], high = {}; let n = 0, cl = 0, ch = 0, lost = 0, gained = 0, lowBelow = 0, highBelow = 0;
  for (const u of units) {
    const b = u.dec.CANDS, x = u.dec[X];
    for (let i = 0; i < u.N; i++) {
      n++;
      const cb = Math.min(b.pot[i], u.cap), cx = Math.min(x.pot[i], u.cap);
      if (cx < cb - 1) { cl++; lost += cb - cx; } else if (cx > cb + 1) { ch++; gained += cx - cb; }
      if (!(b.pot[i] > 0)) continue;
      const below = b.pot[i] < u.cap && x.pot[i] < u.cap;
      if (x.pot[i] < 0.9 * b.pot[i]) { low.push(`${u.id} path ${i}: the pot ${m1(b.pot[i])} to ${m1(x.pot[i])} (${f(100 * (x.pot[i] / b.pot[i] - 1), 1)}%), lifetime tax ${gbp(b.tax[i])} to ${gbp(x.tax[i])}, the cap ${m1(u.cap)}${below ? ', below it in both' : ''}`); if (below) lowBelow++; }
      else if (x.pot[i] > 1.1 * b.pot[i]) { const h = high[u.id] || (high[u.id] = { n: 0, below: 0, tb: 0, tx: 0 }); h.n++; h.tb += b.tax[i]; h.tx += x.tax[i]; if (below) { h.below++; highBelow++; } }
    }
  }
  console.log(`  ${X}: ${low.length} paths a tenth lower, ${lowBelow} of them below the cap in both arms${low.length ? ':' : ''}`);
  for (const l of low) console.log(`    ${l}`);
  const hs = Object.entries(high);
  console.log(`  ${X}: ${hs.reduce((s, [, h]) => s + h.n, 0)} paths a tenth higher, ${highBelow} of them below the cap in both arms${hs.length ? `: ${hs.map(([id, h]) => `${id} ${h.n} (${h.below} below the cap; their lifetime tax ${gbp(h.tb)} to ${gbp(h.tx)} together)`).join('; ')}` : ''}`);
  console.log(`  ${X}: over all ${n} paths, the capped pot lower by more than a pound on ${cl} and higher on ${ch}; ${gbp(lost)} lost and ${gbp(gained)} gained`);
}

console.log(`\nC. THE POOLED TYPICAL-PATH CHANGE TAKEN BY PATH (LOOKHOLD against CANDS; the young ${young.length} share a horizon, ${[...new Set(young.map(u => u.dec.CANDS.pot.length && u.arms.CANDS.T))].join(', ')} years, on seed 7001, so the same paths)`);
{ const H = units.map(u => potWays(u.dec.CANDS, u.dec.LOOKHOLD).typical), Z = 1.959963984540054;
  const tp = H.reduce((s, h) => s + h.d, 0) / H.length, tse = Math.sqrt(H.reduce((s, h) => s + h.se ** 2, 0)) / H.length;
  const N = Math.min(...units.map(u => u.N)), per = [];
  for (let i = 0; i < N; i++) {
    let s = 0, ok = true;
    for (const u of units) { const b = u.dec.CANDS.pot[i], x = u.dec.LOOKHOLD.pot[i]; if (!(b > 0 && x > 0)) { ok = false; break; } s += 100 * (x / b - 1); }
    if (ok) per.push(s / units.length);
  }
  const pm = per.reduce((s, v) => s + v, 0) / per.length, psd = Math.sqrt(per.reduce((s, v) => s + (v - pm) ** 2, 0) / (per.length - 1)), pse = psd / Math.sqrt(per.length);
  console.log(`  as the reducer pools it (the couples independent): ${f(tp)}% (${f(tp - Z * tse)} to ${f(tp + Z * tse)}), its standard error ${tse.toFixed(4)}`);
  console.log(`  taken by path, on the ${per.length} paths of ${N} where all ${units.length} couples leave a pot in both arms: ${f(pm)}% (${f(pm - Z * pse)} to ${f(pm + Z * pse)}), its standard error ${pse.toFixed(4)}`); }
