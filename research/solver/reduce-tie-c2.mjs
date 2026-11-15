/*
 * A BETTER TIE RULE FOR COUPLES ABOVE THEIR ESTATE CAPS, READ (TIE-C2.md, its rule committed before any build; D105;
 * EXPLORATORY, seed 7001). Reads audit-tie-c2.mjs's units once: the gate (every unit in every arm; one code and one audit
 * stamp; seed 7001 and 8,000 paths in every arm; the couples' candidate stage C ran; each arm's options as named, read back
 * from the fields the chooser reads; each person's tables the same before the first arm and after the last), then the rule:
 * HOLD and LOOKHOLD each against CANDS on the same paths, by its eight parts, which is taken, the outcome, and beside it,
 * deciding nothing, TIE4 by the same parts, LOOKHOLD against HOLD and the figures TIE-C2.md lists.
 *   node research/solver/reduce-tie-c2.mjs [dir] [--smoke]      node research/solver/reduce-tie-c2.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
/* TIE-C2.md's bars: survival pooled and by couple (points), spending (%), the capped pot pooled and by couple (%), the pot's
   typical path and average pound (%), the standard error under which the average pound is read at the point bar (%), and the
   speed exception (the median over the couples of an arm's engine time a path against CANDS's) */
export const RULE = { pooled: -0.1, unit: -0.3, spend: 0.05, capped: -0.1, cappedUnit: -0.5, pot: -0.1, seRead: 0.05, slower: 1.25 }, CANDIDATE = 'af001697ce1b';
export const WANT = { CANDS: { tieJoint: null, tieLook: null, holdPast: null }, HOLD: { tieJoint: null, tieLook: null, holdPast: 2 }, LOOKHOLD: { tieJoint: 1e-4, tieLook: true, holdPast: 2 }, TIE4: { tieJoint: 1e-4, tieLook: null, holdPast: null } };
export const ARMS = Object.keys(WANT), RULED = ['HOLD', 'LOOKHOLD'];
const Z = 1.959963984540054;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, tax: Float64Array, delivered: Float64Array };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const mean = a => { let s = 0, n = 0; for (const x of a) { s += x; n++; } return n ? s / n : NaN; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const sdOf = (a, m) => { let s = 0, n = 0; for (const x of a) { s += (x - m) ** 2; n++; } return n > 1 ? Math.sqrt(s / (n - 1)) : 0; };
const pct = (x, b) => 100 * (x / b - 1);
const js = x => JSON.stringify(x);

/* the gate over the units (each with its arms decoded), against the design's couples: every problem */
export function gate(units, ids, audit, size = { N: 8000, seed: 7001, pts: 45 }) {
  const P = [], missing = ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate stage C ran (${CANDIDATE}): ${[...new Set(units.map(u => u.candidate))].join(', ')}`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    if (!ids.includes(U.id)) { P.push(`${U.id}: not in the design`); continue; }
    if (!U.digests || U.digests.before.self !== U.digests.after.self || U.digests.before.part !== U.digests.after.part) P.push(`${U.id}: a person's table changed between the first arm and the last`);
    if (!(U.cap > 0) || !(U.tops && U.tops.every(v => v > 0))) P.push(`${U.id}: no household cap or table tops recorded`);
    if (U.shareRule !== 'pots') P.push(`${U.id}: not on the pots' share`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const k of Object.keys(KEYS)) if (!x[k] || x[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
      const o = x.options || {}, read = { tieJoint: o.tieJoint ?? null, tieLook: o.tieLook ?? null, holdPast: o.holdPast ?? null };
      if (js(read) !== js(WANT[a]) || js(o.meta) !== js(WANT[a])) P.push(`${U.id} ${a}: the options read back ${js(read)} (recorded ${js(o.meta)}), not ${js(WANT[a])}`);
    }
    if (!U.along || !(U.along.decisions > 0) || ARMS.slice(1).some(a => !U.along[a]) || !U.own || ARMS.some(a => !U.own[a])) P.push(`${U.id}: no replays`);
  }
  return P;
}
/* the paired cells of B against A: a both survive, lost (A only), saved (B only), d neither */
export function cells(A, B) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = 0; i < A.survived.length; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; }
  return { a, lost, saved, d };
}
/* the pot left, two ways (TIE-C2.md): the typical path, each path's own change in percent over the paths where both arms leave
   a pot, averaged; the average pound, the mean pots' change in percent with its paired standard error */
export function potWays(b, x) {
  const v = [];
  for (let i = 0; i < b.pot.length; i++) if (b.pot[i] > 0 && x.pot[i] > 0) v.push(100 * (x.pot[i] / b.pot[i] - 1));
  const tm = mean(v), tse = v.length > 1 ? sdOf(v, tm) / Math.sqrt(v.length) : 0;
  const d = Array.from(b.pot, (y, i) => x.pot[i] - y), mb = mean(b.pot), dm = mean(d), ase = 100 * sdOf(d, dm) / Math.sqrt(d.length) / mb;
  return { typical: { d: tm, se: tse, lo: tm - Z * tse, hi: tm + Z * tse, n: v.length }, pound: { d: 100 * dm / mb, se: ase, lo: 100 * dm / mb - Z * ase, hi: 100 * dm / mb + Z * ase } };
}
/* one arm against another over the units, by TIE-C2.md's eight parts */
export function against(units, arm, base = 'CANDS') {
  const H = units.map(U => {
    const b = U.arms[base], x = U.arms[arm], c = cells(b, x), ch = survivalChangeU(c.a, c.lost, c.saved, c.d);
    const capped = X => mean(Array.from(X.pot, v => Math.min(v, U.cap)));
    const w = potWays(b, x), tb = mean(b.tax), tx = mean(x.tax);
    const tenth = { lower: 0, higher: 0 };
    for (let i = 0; i < b.pot.length; i++) { if (!(b.pot[i] > 0)) continue; if (x.pot[i] < 0.9 * b.pot[i]) tenth.lower++; else if (x.pot[i] > 1.1 * b.pot[i]) tenth.higher++; }
    return { id: U.id, cohort: U.cohort, cells: c, ch, capped: pct(capped(x), capped(b)), ...w, tax: [tb, tx], slower: x.engineSecs / b.engineSecs, tenth,
      along: base === 'CANDS' && U.along[arm] ? U.along[arm] : null, own: U.own[arm] };
  });
  const pooled = pooledSummed(H.map(h => h.cells));
  const spend = pct(sum(units.map(U => sum(U.arms[arm].delivered))), sum(units.map(U => sum(U.arms[base].delivered))));
  const cappedP = mean(H.map(h => h.capped)), taxB = mean(H.map(h => h.tax[0])), taxX = mean(H.map(h => h.tax[1]));
  const tp = mean(H.map(h => h.typical.d)), tpse = Math.sqrt(sum(H.map(h => h.typical.se ** 2))) / H.length, typicalP = { d: tp, se: tpse, lo: tp - Z * tpse, hi: tp + Z * tpse };
  const outside = sum(H.map(h => (h.along ? h.along.outside : 0))), stepDown = RULED.includes(arm) ? sum(H.map(h => h.own.stepDownPast)) : 0;
  const parts = [
    pooled.lo > RULE.pooled,
    !H.some(h => h.ch.hi < RULE.unit),
    Math.abs(spend) <= RULE.spend,
    cappedP >= RULE.capped && !H.some(h => h.capped < RULE.cappedUnit),
    H.every(h => h.typical.d >= RULE.pot && !(h.pound.hi < RULE.pot) && !(h.pound.se <= RULE.seRead && h.pound.d < RULE.pot)),
    taxX <= taxB,
    outside === 0 && stepDown === 0,
    typicalP.lo > 0
  ];
  const s = H.map(h => h.slower).sort((p, q) => p - q), k = s.length, slowerMedian = k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2;
  return { arm, base, H, pooled, spend, cappedP, taxB, taxX, typicalP, outside, stepDown, parts, holds7: parts.slice(0, 7).every(Boolean), passes: parts.every(Boolean), stop: !parts[6], slowerMedian };
}
/* the rule: HOLD and LOOKHOLD against CANDS, which is taken, and the outcome */
export function rule(units) {
  const R = Object.fromEntries(RULED.map(a => [a, against(units, a)]));
  let verdict = null, taken = null, trade = false;
  if (RULED.some(a => R[a].stop)) verdict = 'STOP';
  else if (R.HOLD.passes && R.LOOKHOLD.passes) {
    const LH = against(units, 'LOOKHOLD', 'HOLD');
    taken = LH.typicalP.lo > 0 && !LH.H.some(h => h.pound.hi < 0) ? 'LOOKHOLD' : 'HOLD';
    R.LOOKHOLD_HOLD = LH;
  } else if (R.HOLD.passes || R.LOOKHOLD.passes) taken = R.HOLD.passes ? 'HOLD' : 'LOOKHOLD';
  if (!verdict) {
    if (taken) { trade = R[taken].slowerMedian > RULE.slower; verdict = trade ? `PASSES (${taken}), SLOWER BY MORE THAN A QUARTER: THE TRADE GOES TO THE MAINTAINER` : `PASSES (${taken})`; }
    else verdict = RULED.some(a => R[a].holds7) ? 'NO GAIN' : 'FAILS';
  }
  return { R, verdict, taken, trade };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 8000, ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  // an arm: `lost` paths failing; each path's pot `pot` times a small spread (so the standard errors are not nought), or `potAt`
  const arm = (name, lost, o = {}) => ({ options: { ...WANT[name], meta: { ...WANT[name] } }, engineSecs: o.secs || 100, T: 30,
    survived: Uint8Array.from({ length: N }, (_, i) => (i % 2 === 1 && i < 2 * lost ? 0 : 1)), failYear: new Int16Array(N),
    pot: Float64Array.from({ length: N }, (_, i) => (o.potAt ? o.potAt(i) : (o.pot || 1e6) * (1 + 0.02 * Math.sin(i)))), tax: new Float64Array(N).fill(o.tax || 1e5), delivered: new Float64Array(N).fill(o.sp || 1e6) });
  const along = (o = {}) => ({ decisions: 100, above: 50, past: [5, 5], HOLD: { differ: 3, level: 0, outside: 0, ...(o.HOLD || {}) }, LOOKHOLD: { differ: 5, level: 0, outside: 0, ...(o.LOOKHOLD || {}) }, TIE4: { differ: 4, level: 0, outside: 0 } });
  const own = (o = {}) => Object.fromEntries(ARMS.map(a => [a, { decisions: 100, stepDownPast: a === 'CANDS' || a === 'TIE4' ? 2 : (o[a] || 0), pastYears: [5, 5], holdActs: 1, lookChanged: 1, otherLevel: 0, otherTiers: 0 }]));
  // a unit: CANDS 400 lost; HOLD and LOOKHOLD each with their own figures (`h` and `l`) over a gain, TIE4 as CANDS
  const unit = (id, o = {}) => ({ id, cohort: 'x', N, pts: 45, seed: 7001, candidate: o.candidate || CANDIDATE, stamp: { code: 'c', audit: 'a' }, cap: o.cap || 2e6, tops: [3e6, 3e6], shareRule: 'pots',
    digests: { before: { self: 'a', part: 'b' }, after: { self: 'a', part: o.changed ? 'z' : 'b' } }, along: along(o.along), own: own(o.own),
    arms: { CANDS: arm('CANDS', 400, o.c || {}), HOLD: arm('HOLD', o.hLost === undefined ? 400 : o.hLost, { pot: 1.005e6, tax: 0.99e5, ...(o.h || {}) }), LOOKHOLD: arm('LOOKHOLD', 400, { pot: 1.005e6, tax: 0.98e5, ...(o.l || {}) }), TIE4: arm('TIE4', 400) } });
  const set = (f = () => ({})) => ids.map((id, k) => unit(id, f(k)));
  const V = s => rule(s).verdict;
  check('a complete planted set passes the gate', gate(set(), ids, 'a').length === 0);
  check(`both pass, the look no better than the hold beyond noise: PASSES (HOLD) (${V(set())})`, V(set()) === 'PASSES (HOLD)');
  check(`both pass, the look's pot 1% above the hold's on every couple: PASSES (LOOKHOLD) (${V(set(() => ({ l: { pot: 1.015e6 } })))})`, V(set(() => ({ l: { pot: 1.015e6 } }))) === 'PASSES (LOOKHOLD)');
  check(`the look taken but 30% slower a path on every couple: the trade (${V(set(() => ({ l: { pot: 1.015e6, secs: 130 } })))})`, rule(set(() => ({ l: { pot: 1.015e6, secs: 130 } }))).trade === true);
  check('the hold two points worse on one couple, beyond noise, fails part 2', (() => { const r = rule(set(k => (k === 0 ? { hLost: 560 } : {}))).R.HOLD; return !r.parts[1] && !r.passes; })());
  check('the hold with more tax pooled fails part 6, and the look passing is taken', (() => { const r = rule(set(() => ({ h: { tax: 1.1e5 } }))); return !r.R.HOLD.parts[5] && r.verdict === 'PASSES (LOOKHOLD)'; })());
  check('spending 0.1% lower pooled fails part 3', (() => { const r = rule(set(() => ({ h: { sp: 0.999e6 } }))).R.HOLD; return !r.parts[2]; })());
  check('a capped pot 2% lower on one couple fails part 4', (() => { const r = rule(set(k => (k === 0 ? { h: { pot: 0.98e6 } } : {}))).R.HOLD; return !r.parts[3] && r.H[0].capped < -0.5; })());
  check('the typical path 0.2% lower on one couple fails part 5 (a)', (() => { const r = rule(set(k => (k === 0 ? { h: { pot: 0.998e6 } } : {}))).R.HOLD; return !r.parts[4] && r.H[0].typical.d < -0.1; })());
  check('ten paths a hundred times as large halved, the rest 0.1% higher, on one couple: the typical path up, the average pound\'s interval wholly below -0.1%: part 5 (b) fails', (() => {
    const r = rule(set(k => (k === 0 ? { c: { potAt: i => (i < 10 ? 100e6 : 1e6) * (1 + 0.02 * Math.sin(i)) }, h: { potAt: i => (i < 10 ? 50e6 : 1.001e6) * (1 + 0.02 * Math.sin(i)) } } : {}))).R.HOLD, h = r.H[0];
    return !r.parts[4] && h.typical.d >= -0.1 && h.pound.hi < -0.1; })());
  check('the larger half of the paths 0.18% lower with noise on one couple: the typical path and the average pound\'s interval above -0.1%, the average pound itself below it with a standard error under 0.05%: part 5 (c) fails', (() => {
    const r = rule(set(k => (k === 0 ? { c: { potAt: i => (i < 4000 ? 3e6 : 1e6) * (1 + 0.02 * Math.sin(i)) }, h: { potAt: i => (i < 4000 ? 3e6 * (1 - 0.0018 + 0.02 * Math.sin(7 * i)) : 1e6 * (1 + 0.02 * Math.sin(7 * i))) } } : {}))).R.HOLD, h = r.H[0];
    return !r.parts[4] && h.typical.d >= -0.1 && h.pound.hi >= -0.1 && h.pound.se <= 0.05 && h.pound.d < -0.1; })());
  check('no gain beyond noise (the pots as CANDS\'s) with both holding 1 to 7: NO GAIN', V(set(() => ({ h: { pot: 1e6 }, l: { pot: 1e6 } }))) === 'NO GAIN');
  check('neither holding 1 to 7: FAILS', V(set(() => ({ h: { tax: 1.1e5 }, l: { tax: 1.1e5 } }))) === 'FAILS');
  check('a replay decision outside what the hold allows is a STOP', V(set(k => (k === 0 ? { along: { HOLD: { outside: 1 } } } : {}))) === 'STOP');
  check('a step down past the limit on the look\'s own path is a STOP', V(set(k => (k === 0 ? { own: { LOOKHOLD: 1 } } : {}))) === 'STOP');
  check('the gate refuses a changed table, another option, a missing arm, another seed and a missing unit', (() => {
    const s = set(); s[0] = unit('A', { changed: true }); s[1].arms.HOLD.options.holdPast = 3; delete s[2].arms.TIE4; s[3].seed = 7002; const t = s.slice(0, 11);
    const P = gate(t, ids, 'a'); return P.some(x => /A: a person's table changed/.test(x)) && P.some(x => /B HOLD: the options/.test(x)) && P.some(x => /C: no TIE4 arm/.test(x)) && P.some(x => /more than one seed/.test(x)) && P.some(x => /units missing: L/.test(x));
  })());
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'tie-c2-7001');
  const { COUPLES, stampFilesHash } = await import('./audit-tie-c2.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const ids = COUPLES.filter(id => !smoke || units.some(u => u.id === id));
  const P = gate(units, ids, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`TIE-C2 GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = ids.map(id => units.find(u => u.id === id)), u0 = ordered[0], R = rule(ordered);
  const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = (c, d = 3) => `${f(c.d, d)} (${f(c.lo, d)} to ${f(c.hi, d)})`;
  console.log(`A BETTER TIE RULE FOR COUPLES ABOVE THEIR ESTATE CAPS (EXPLORATORY; TIE-C2.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.length} couples of the couples' re-run panel, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, the couples' candidate ${u0.candidate}; the gate fair`);
  const show = (r, label) => {
    const say = k => (r.parts[k] ? 'HOLDS' : 'FAILS');
    console.log(`\n${label}:`);
    console.log(`  1. pooled survival ${iv(r.pooled)} points; its lower end above ${RULE.pooled}: ${say(0)}`);
    console.log(`  2. no couple wholly below ${RULE.unit}: ${r.H.filter(h => h.ch.hi < RULE.unit).map(h => `${h.id} (${f(h.ch.lo)} to ${f(h.ch.hi)})`).join(', ') || 'none'}: ${say(1)}`);
    console.log(`  3. pooled spending delivered ${f(r.spend, 4)}%; within ${RULE.spend}% either way: ${say(2)}`);
    console.log(`  4. the capped pot ${f(r.cappedP)}% pooled (not lower by more than ${-RULE.capped}%); a couple lower by more than ${-RULE.cappedUnit}%: ${r.H.filter(h => h.capped < RULE.cappedUnit).map(h => `${h.id} ${f(h.capped)}%`).join(', ') || 'none'}: ${say(3)}`);
    const a5 = r.H.filter(h => h.typical.d < RULE.pot), b5 = r.H.filter(h => h.pound.hi < RULE.pot), c5 = r.H.filter(h => h.pound.se <= RULE.seRead && h.pound.d < RULE.pot);
    console.log(`  5. the pot left on every couple: (a) the typical path lower by more than ${-RULE.pot}%: ${a5.map(h => `${h.id} ${f(h.typical.d)}%`).join(', ') || 'none'}; (b) the average pound's interval wholly below ${RULE.pot}%: ${b5.map(h => `${h.id} ${iv(h.pound)}%`).join(', ') || 'none'}; (c) where its standard error is ${RULE.seRead}% or less, below ${RULE.pot}%: ${c5.map(h => `${h.id} ${f(h.pound.d)}% (se ${h.pound.se.toFixed(3)})`).join(', ') || 'none'}: ${say(4)}`);
    console.log(`  6. pooled lifetime tax ${gbp(r.taxB)} to ${gbp(r.taxX)} (${f(pct(r.taxX, r.taxB), 2)}%); not higher: ${say(5)}`);
    console.log(`  7. the replays: along ${r.base}'s path, decisions outside what the arm allows ${r.outside}; on its own paths a person past the limit stepping down ${r.stepDown}: ${say(6)}`);
    console.log(`  8. a gain: the pooled typical-path pot ${iv(r.typicalP)}%; its lower end above nought: ${say(7)}`);
    console.log(`  ${r.passes ? 'PASSES 1 to 8' : `FAILS ${r.parts.map((p, k) => (p ? null : k + 1)).filter(Boolean).join(', ')}`}; its engine time a path against ${r.base}'s, the median over the couples x${r.slowerMedian.toFixed(3)}`);
    console.log(`  by couple: ${r.H.map(h => `${h.id} survival ${f(h.ch.d)}, the typical path ${f(h.typical.d)}%, the average pound ${iv(h.pound)}% (se ${h.pound.se.toFixed(3)}), capped ${f(h.capped)}%, tax ${gbp(h.tax[0])} to ${gbp(h.tax[1])}, paths a tenth lower ${h.tenth.lower} and higher ${h.tenth.higher}, x${h.slower.toFixed(2)} a path`).join('; ')}`);
  };
  for (const a of RULED) show(R.R[a], `${a} against CANDS`);
  console.log(`\nTIE-C2 OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${R.verdict}`);
  // beside the rule, deciding nothing
  console.log('\nBESIDE THE RULE, DECIDING NOTHING:');
  show(against(ordered, 'TIE4'), 'TIE4 (the first rule at 1e-4) against CANDS');
  show(R.R.LOOKHOLD_HOLD || against(ordered, 'LOOKHOLD', 'HOLD'), 'LOOKHOLD against HOLD (the look\'s own effect)');
  for (const a of RULED) {
    const r = R.R[a], top = r.H.reduce((m, h) => (Math.abs(h.tax[1] - h.tax[0]) > Math.abs(m.tax[1] - m.tax[0]) ? h : m)), rest = r.H.filter(h => h !== top);
    console.log(`  ${a}: the pooled tax without ${top.id}, the couple carrying most of its change: ${gbp(mean(rest.map(h => h.tax[0])))} to ${gbp(mean(rest.map(h => h.tax[1])))}`);
  }
  for (const c of [...new Set(ordered.map(u => u.cohort))]) {
    const sub = ordered.filter(u => u.cohort === c);
    console.log(`  the ${c} cohort (${sub.length}): ${RULED.map(a => { const r = against(sub, a); return `${a} survival ${iv(r.pooled)}, the typical path ${iv(r.typicalP)}%, tax ${f(pct(r.taxX, r.taxB), 2)}%`; }).join('; ')}`);
  }
  console.log(`  the replays: ${ordered.map(u => `${u.id} past the limit ${u.along.past.join('/')} of ${u.along.decisions} along CANDS's path; ${ARMS.map(a => `${a} hold ${u.own[a].holdActs}, look ${u.own[a].lookChanged}, a step down past the limit ${u.own[a].stepDownPast}, years past ${u.own[a].pastYears.join('/')}`).join(', ')}`).join(' | ')}`);
  console.log(`  each arm's engine time a path: ${ARMS.map(a => `${a} ${(1000 * mean(ordered.map(u => u.arms[a].engineSecs / u.N))).toFixed(1)} ms`).join(', ')}`);
}
