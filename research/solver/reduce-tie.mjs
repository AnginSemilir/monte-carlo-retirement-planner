/*
 * THE TIE-BREAK ABOVE THE ESTATE CAP AND ITEM 7'S SECOND READ: THE READ (TIE-A.md; the review of 11 Nov, item 13; D76, D81;
 * EXPLORATORY). The stamps first (fair-gate.mjs requireFairLogs), then the gate: every unit in; one code, one audit, one
 * seed, one count of paths, one count of points; every arm of a household on its plan (the inputs hash), its recorded
 * settings the same but the tie-break, where it begins and the chooser's width; each unit's tables the same after its arms
 * as before them; a remedy unit's tables its main unit's. Then the rules, each as TIE-A.md writes it:
 *   item 13, arm 3 (then arm 2) against arm 1, the twelve: 1 pooled survival's lower end above -0.1; 2 no household wholly
 *   below -0.3; 3 pooled spending within 0.05 points; 4 the capped pot not lower by more than 0.1% pooled nor 0.5% on a
 *   household; 5 no household's mean pot lower by more than 0.1%; 6 pooled lifetime tax not higher; 7 the replay: no
 *   differing decision at another level, at another tier pair, or at or below the cap;
 *   item 7, a width against the whole-menu arm item 13 takes: 1 to 3 as above; 4 the pooled mean pot not lower by more
 *   than 0.5% and the capped pot not lower by more than 0.1%; 5 the replay's tier pair differing at under 1% of decisions.
 *   node research/solver/reduce-tie.mjs [dir] > research/solver/results-tie-a.txt
 *   node research/solver/reduce-tie.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zFor } from './stats.mjs';
import { pairOf } from './reduce-speed.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooledLo: -0.1, household: -0.3, spend: 0.05, cappedPooled: 0.1, cappedHousehold: 0.5, potHousehold: 0.1, samePot: 0.5, potPooled7: 0.5, capped7: 0.1, pair7: 1 };
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const arr = (b64, T) => { if (typeof b64 !== 'string') return b64; const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };   // a small Buffer sits in Node's shared pool: its own bytes, not the pool's
export const armOf = a => ({ survived: arr(a.survived, Uint8Array), delivered: arr(a.delivered, Float64Array), target: arr(a.target, Float64Array), pot: arr(a.pot, Float64Array), tax: arr(a.tax, Float64Array), ms: a.ms, tally: a.tally, sliced: a.sliced, slicedMoves: a.slicedMoves });
const mean = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
const sum = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
const cappedMean = (pot, cap) => { let s = 0; for (let i = 0; i < pot.length; i++) s += Math.min(pot[i], cap); return s / pot.length; };
const EPS = 1e-9;   // each edge inclusive, past a sum's rounding
/* what both rules read, X against B over pairs { id, cap, B, X } (the arms' arrays) */
export function readOf(pairs) {
  const H = pairs.map(q => {
    const p = pairOf(q.B.survived, q.X.survived), del = x => (100 * sum(x.delivered)) / Math.max(1e-9, sum(x.target));
    const potB = mean(q.B.pot), potX = mean(q.X.pot), capB = cappedMean(q.B.pot, q.cap), capX = cappedMean(q.X.pot, q.cap), taxB = mean(q.B.tax), taxX = mean(q.X.tax);
    let fell = 0, fellSum = 0, above = 0;   // the base's paths ending above the cap, and of them X's that end at or below it
    for (let i = 0; i < q.B.pot.length; i++) if (q.B.pot[i] > q.cap) { above++; if (!(q.X.pot[i] > q.cap)) { fell++; fellSum += q.B.pot[i] - q.X.pot[i]; } }
    return { id: q.id, p, delB: del(q.B), delX: del(q.X), potB, potX, pot: 100 * (potX / potB - 1), capB, capX, capped: 100 * (capX / capB - 1), taxB, taxX, tax: taxB > 0 ? 100 * (taxX / taxB - 1) : 0, above, fell, fellMean: fell ? fellSum / fell : 0, msB: q.B.ms, msX: q.X.ms };
  });
  const k = H.length, z = zFor(0.05);
  const pooled = H.reduce((s, h) => s + h.p.d, 0) / k, se = Math.sqrt(H.reduce((s, h) => s + h.p.v, 0)) / k;
  const avg = g => H.reduce((s, h) => s + g(h), 0) / k;
  return { H, pooled, se, lo: pooled - z * se, hi: pooled + z * se, harmed: H.filter(h => h.p.hi < RULE.household), spend: avg(h => h.delX - h.delB),
    potB: avg(h => h.potB), potX: avg(h => h.potX), pot: 100 * (avg(h => h.potX) / avg(h => h.potB) - 1), capped: 100 * (avg(h => h.capX) / avg(h => h.capB) - 1),
    taxB: avg(h => h.taxB), taxX: avg(h => h.taxX), tax: 100 * (avg(h => h.taxX) / avg(h => h.taxB) - 1), ms: avg(h => h.msX), msB: avg(h => h.msB) };
}
/* item 13's rule on a read and its replay counts (summed over the households) */
export function rule13(r, replay) {
  const part1 = r.lo > RULE.pooledLo, part2 = r.harmed.length === 0, part3 = Math.abs(r.spend) <= RULE.spend + EPS;
  const cappedBad = r.H.filter(h => h.capped < -RULE.cappedHousehold - EPS), part4 = r.capped >= -RULE.cappedPooled - EPS && cappedBad.length === 0;
  const potBad = r.H.filter(h => h.pot < -RULE.potHousehold - EPS), part5 = potBad.length === 0;
  const part6 = r.taxX <= r.taxB * (1 + 1e-12);
  const part7 = !!replay && replay.decisions > 0 && replay.level === 0 && replay.pair === 0 && replay.atOrBelow === 0;
  const parts = { 1: part1, 2: part2, 3: part3, 4: part4, 5: part5, 6: part6, 7: part7 }, failed = Object.keys(parts).filter(k => !parts[k]).map(Number);
  return { ...r, replay, parts, failed, cappedBad, potBad, pass: failed.length === 0, only45: failed.length > 0 && failed.every(k => k === 4 || k === 5) };
}
/* which arm the rule takes from arm 3's read and arm 2's */
export function take13(r3, r2) {
  if (r3.pass && r2.pass) {
    const gap = 100 * Math.abs(r3.potX / r2.potX - 1);
    return gap <= RULE.samePot + EPS ? { arm: 2, why: `BOTH PASS; the two pooled mean pots are within ${RULE.samePot}% of each other (${gap.toFixed(3)}%): arm 2, the smaller margin` } : { arm: 3, why: `BOTH PASS; arm 3's pooled mean pot is ${gap.toFixed(3)}% from arm 2's, more than ${RULE.samePot}%: arm 3, the larger pot` };
  }
  if (r3.pass) return { arm: 3, why: 'ARM 3 PASSES, arm 2 does not: arm 3' };
  if (r2.pass) return { arm: 2, why: 'ARM 2 PASSES, arm 3 does not: arm 2' };
  const stop = [r3, r2].some(r => r.failed.some(k => k !== 4 && k !== 5));
  if (!stop && r3.only45) return { arm: null, remedy: 3, why: 'NEITHER PASSES; arm 3 fails part 4 or 5 and no other: the remedy once, at arm 3\'s margin (wealth above 1.25 times the cap), by this rule' };
  if (!r3.failed.some(k => k !== 4 && k !== 5) && r2.only45 && !r3.only45) return { arm: null, remedy: 2, why: 'NEITHER PASSES; arm 2 fails part 4 or 5 and no other: the remedy once, at arm 2\'s margin' };
  return { arm: null, why: `NEITHER PASSES (arm 3 fails ${r3.failed.join(', ')}; arm 2 fails ${r2.failed.join(', ')}): STOP and report` };
}
/* item 7's rule on a width's read against its whole-menu arm, and its replay counts */
export function rule7(r, replay) {
  const part1 = r.lo > RULE.pooledLo, part2 = r.harmed.length === 0, part3 = Math.abs(r.spend) <= RULE.spend + EPS;
  const part4 = r.pot >= -RULE.potPooled7 - EPS && r.capped >= -RULE.capped7 - EPS;
  const share = replay && replay.decisions > 0 ? (100 * replay.pair) / replay.decisions : NaN, part5 = share < RULE.pair7;
  const parts = { 1: part1, 2: part2, 3: part3, 4: part4, 5: part5 }, failed = Object.keys(parts).filter(k => !parts[k]).map(Number);
  return { ...r, replay, pairShare: share, parts, failed, pass: failed.length === 0 };
}
export function take7(structure, order) {
  if (structure.pass) return { build: 'structure', why: 'STRUCTURE WITH THE SLICE PASSES: item 7\'s stage B is built with the slice, off in code (D81)' };
  if (order.pass) return { build: 'order', why: `STRUCTURE WITH THE SLICE FAILS (${structure.failed.join(', ')}) AND ORDER WITH THE SLICE PASSES: order is built, off in code (D81)` };
  return { build: null, why: `NEITHER PASSES (structure fails ${structure.failed.join(', ')}; order fails ${order.failed.join(', ')}): item 7 is closed and the whole menu stays (D81)` };
}
const sumReplay = (units, name) => { const t = { decisions: 0, differ: 0, level: 0, pair: 0, atOrBelow: 0, moreTax: 0, above: 0 }; for (const u of units) { const q = u.replay && u.replay[name]; if (!q) return null; for (const k of Object.keys(t)) t[k] += q[k]; } return t; };
const fields = ran => { const p = ran.split(' | '); return { tie: p[0], from: p[1], chooser: p[2], rest: p.slice(3).join(' | ') }; };
/* what an arm should have recorded, from its name (audit-tie.mjs ranOf) */
export const wantOf = (arm, times) => {
  const tie = /tieC@([^+]+)/.exec(arm), w = arm.split('+')[0];
  return { tie: `tie ${tie ? `above the cap, the best move's level and tier pair, within ${tie[1]}` : 'off'}`, from: `from ${times} times the cap`, chooser: `chooser ${w}${/\+slice/.test(arm) ? ' with the slice' : ''}` };
};
/* the gate: refusals, each a line. raw: the unit files; ids: the households; ARMS: audit-tie.mjs's; audit: these files' hash */
export function gate(raw, ids, ARMS, audit, remedyArms = null) {
  const P = [], main = raw.filter(u => u.mode === 'main'), rem = raw.filter(u => u.mode === 'remedy');
  const missing = ids.filter(id => !main.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  if (rem.length && ids.some(id => !rem.some(u => u.id === id))) P.push(`remedy units missing: ${ids.filter(id => !rem.some(u => u.id === id)).join(', ')}`);
  const one = (what, f0) => { const vs = [...new Set(raw.map(f0))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts); one('remedy margin', u => u.remedyMargin || '-');
  if (audit && raw.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  for (const U of raw) {
    const tag = `${U.id}${U.mode === 'remedy' ? ' (remedy)' : ''}`, want = U.mode === 'main' ? ARMS : { 1: ARMS[1], ...(remedyArms ? remedyArms(U.remedyMargin) : {}) };
    const got = Object.keys(U.arms || {}).sort().join(), w = Object.keys(want).map(String).sort().join();
    if (got !== w) { P.push(`${tag}: the arms ${got || 'none'}, not ${w}`); continue; }
    if (U.digest0 !== U.digest1) P.push(`${tag}: its tables changed while its arms ran`);
    if (!(Math.abs(U.capTerm - U.cap) <= 1e-6 * U.cap)) P.push(`${tag}: the estate term's cap (${U.capTerm}) is not four times the opening wealth (${U.cap})`);
    const base = fields(U.arms[1].ran);
    for (const [name, x] of Object.entries(U.arms)) {
      const g = fields(x.ran), wa = wantOf(want[name], String(name).startsWith('R') ? 1.25 : 1);
      if (x.arm !== want[name]) P.push(`${tag} arm ${name}: ran ${x.arm}, not ${want[name]}`);
      if (x.inputs !== U.inputs) P.push(`${tag} arm ${name}: not on the household's plan`);
      if (g.rest !== base.rest) P.push(`${tag} arm ${name}: its settings differ from arm 1's beyond the options it tests`);
      for (const k of ['tie', 'from', 'chooser']) if (g[k] !== wa[k]) P.push(`${tag} arm ${name}: ${g[k]}, not ${wa[k]}`);
      for (const k of ['survived', 'pot', 'delivered', 'target', 'tax']) if (arr(x[k], k === 'survived' ? Uint8Array : Float64Array).length !== U.N) P.push(`${tag} arm ${name}: ${k} not one a path`);
    }
  }
  for (const R of rem) { const A = main.find(u => u.id === R.id); if (A && (A.digest0 !== R.digest0 || A.inputs !== R.inputs)) P.push(`${R.id}: the remedy's tables or plan are not its main unit's`); }
  return P;
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 10000, CAP = 400;
  // a household: b lost and c saved of N; X's spending delivered, pot (half its paths at potHi above the cap, half at potLo below) and tax; the base's 100, 600 / 200, 100
  const pair = (id, { b = 0, c = 0, del = 100, hi = 600, lo = 200, tax = 100, ms = 1 } = {}) => {
    const B = new Uint8Array(N).fill(1), X = new Uint8Array(N).fill(1);
    for (let k = 0; k < b; k++) X[k] = 0;
    for (let k = 0; k < c; k++) B[N - 1 - k] = 0;
    const flat = v => new Float64Array(N).fill(v), split = (h, l) => Float64Array.from({ length: N }, (_, i) => (i % 2 ? h : l));
    return { id, cap: CAP, B: { survived: B, delivered: flat(100), target: flat(100), pot: split(600, 200), tax: flat(100), ms: 10 }, X: { survived: X, delivered: flat(del), target: flat(100), pot: split(hi, lo), tax: flat(tax), ms } };
  };
  const rep = (o = {}) => ({ decisions: 1000, differ: 100, level: 0, pair: 0, atOrBelow: 0, moreTax: 0, above: 500, ...o });
  const R = (xs, r = rep()) => rule13(readOf(xs.map(([id, o]) => pair(id, o))), r);
  check('item 13: all seven hold with the pot above the cap a fifth higher and the tax a third lower', R([['A', { hi: 720, tax: 67 }], ['B', { hi: 720, tax: 67 }]]).pass);
  const r1 = R([['A', { b: 20 }], ['B', { b: 20 }]]);
  check(`item 13 part 1 fails on a pooled loss of 0.2 points (its lower end ${r1.lo.toFixed(3)})`, !r1.parts[1] && r1.parts[2] && r1.failed.join() === '1');
  const r2 = R([['A', { b: 60 }], ['B', { c: 60 }], ['C', { c: 60 }]]);
  check('item 13 part 2 fails on one household wholly below -0.3, the pooled change passing part 1', r2.parts[1] && !r2.parts[2] && r2.harmed.map(h => h.id).join() === 'A');
  check('item 13 part 3 fails on spending 0.06 points higher (either way), and holds at 0.05', !R([['A', { del: 100.06 }]]).parts[3] && R([['A', { del: 100.05 }]]).parts[3]);
  const r4 = R([['A', { lo: 198 }], ['B', {}], ['C', {}], ['D', {}], ['E', {}], ['F', {}]]);   // A's capped pot 1/300 lower (0.33%): inside 0.5% on a household; pooled 0.056% lower
  check(`item 13 part 4 holds with one household's capped pot ${r4.H[0].capped.toFixed(3)}% lower (pooled ${r4.capped.toFixed(3)}%)`, r4.parts[4] && !r4.parts[5]);
  const r4b = R([['A', { lo: 196 }]]);
  check(`item 13 part 4 fails on a household's capped pot ${r4b.H[0].capped.toFixed(3)}% lower, and that alone with part 5 sends it to the remedy`, !r4b.parts[4] && !r4b.parts[5] && r4b.only45);
  const r4c = R([['A', { lo: 199.2 }], ['B', { lo: 199.2 }]]);
  check(`item 13 part 4 fails pooled at ${r4c.capped.toFixed(3)}% lower with no household past 0.5%`, !r4c.parts[4] && r4c.cappedBad.length === 0);
  const r5 = R([['A', { hi: 599 }]]);
  check(`item 13 part 5 fails on a household's mean pot ${r5.H[0].pot.toFixed(3)}% lower (the capped pot unchanged: part 4 holds)`, !r5.parts[5] && r5.parts[4] && r5.only45);
  check('item 13 part 5 at its edge: the mean pot 0.1% lower holds', R([['A', { hi: 599.2 }]]).parts[5]);
  check('item 13 part 6 fails on lifetime tax a hundredth of a percent higher, and holds on the same tax', !R([['A', { tax: 100.01 }]]).parts[6] && R([['A', {}]]).parts[6]);
  check('item 13 part 7 fails on one differing decision at another level, at another tier pair, or at or below the cap, and with no replay', !R([['A', {}]], rep({ level: 1 })).parts[7] && !R([['A', {}]], rep({ pair: 1 })).parts[7] && !R([['A', {}]], rep({ atOrBelow: 1 })).parts[7] && !R([['A', {}]], null).parts[7]);
  const P3 = R([['A', { hi: 720 }]]), P2 = R([['A', { hi: 718 }]]), P2far = R([['A', { hi: 660 }]]), F1 = R([['A', { b: 60 }]]), F5 = R([['A', { hi: 599 }]]);
  check('the take: both pass and the pooled pots within 0.5% of each other: arm 2', take13(P3, P2).arm === 2);
  check('the take: both pass and arm 3\'s pot further ahead: arm 3', take13(P3, P2far).arm === 3);
  check('the take: one passes, that one', take13(P3, F1).arm === 3 && take13(F1, P2).arm === 2);
  check('the take: arm 3 fails part 5 alone and arm 2 part 5 alone: the remedy at arm 3\'s margin', take13(F5, F5).arm === null && take13(F5, F5).remedy === 3);
  check('the take: a failure of part 1 is a STOP, no remedy', take13(F1, F5).arm === null && take13(F1, F5).remedy === undefined);
  const S = (xs, r = rep()) => rule7(readOf(xs.map(([id, o]) => pair(id, o))), r);
  check('item 7: a width with more pot than its base passes', S([['A', { hi: 640 }]]).pass);
  check('item 7 part 4 fails on the pooled mean pot 0.6% lower, and on the capped pot 0.2% lower with the mean pot level', !S([['A', { hi: 595.2 }]]).parts[4] && !S([['A', { lo: 198.8 }]]).parts[4]);
  check('item 7 part 4 at its edge: the pooled mean pot 0.5% lower holds', S([['A', { hi: 596 }]]).parts[4]);
  check('item 7 part 5 fails on the tier pair differing at 1% of decisions, holds at 0.9%, and fails with no replay', !S([['A', {}]], rep({ pair: 10 })).parts[5] && S([['A', {}]], rep({ pair: 9 })).parts[5] && !S([['A', {}]], null).parts[5]);
  const ok7 = S([['A', {}]]), no7 = S([['A', { b: 60 }]]);
  check('item 7\'s outcome: structure passes: structure; it fails and order passes: order; neither: closed', take7(ok7, no7).build === 'structure' && take7(no7, ok7).build === 'order' && take7(no7, no7).build === null);
  // the gate
  const ARMS = { 1: 'whole', 3: 'whole+tieC@1e-4', 4: 'structure+slice+tieC@1e-4' }, b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const ran = (arm, times = 1, rest = 'pts 45') => { const w = wantOf(arm, times); return `${w.tie} | ${w.from} | ${w.chooser} | ${rest}`; };
  const armX = (arm, o = {}) => ({ arm, ran: ran(arm), inputs: 'h', ms: 1, survived: b64(new Uint8Array(2)), pot: b64(new Float64Array(2)), delivered: b64(new Float64Array(2)), target: b64(new Float64Array(2)), tax: b64(new Float64Array(2)), ...o });
  const unit = (id, o = {}) => ({ id, mode: 'main', seed: 7002, N: 2, pts: 45, inputs: 'h', stamp: { code: 'c', audit: 'a' }, cap: 400, capTerm: 400, digest0: 'd', digest1: 'd', remedyMargin: null, arms: Object.fromEntries(Object.entries(ARMS).map(([k, a]) => [k, armX(a)])), ...o });
  { const g0 = gate([unit('E'), unit('F')], ['E', 'F'], ARMS, 'a'); check(`the gate passes two whole households${g0.length ? `: ${g0[0]}` : ''}`, g0.length === 0); }
  check('the gate refuses a missing unit', gate([unit('E')], ['E', 'F'], ARMS, 'a').some(x => /units missing: F/.test(x)));
  check('the gate refuses units of two codes', gate([unit('E'), unit('F', { stamp: { code: 'x', audit: 'a' } })], ['E', 'F'], ARMS, 'a').some(x => /more than one code/.test(x)));
  check('the gate refuses a unit whose tables changed under its arms', gate([unit('E', { digest1: 'z' })], ['E'], ARMS, 'a').some(x => /tables changed/.test(x)));
  check('the gate refuses an arm whose settings differ beyond its options', gate([unit('E', { arms: { ...unit('E').arms, 3: armX(ARMS[3], { ran: ran(ARMS[3], 1, 'pts 30') }) } })], ['E'], ARMS, 'a').some(x => /beyond the options/.test(x)));
  check('the gate refuses a tie-break arm that ran with it off, and one that began at another multiple of the cap', gate([unit('E', { arms: { ...unit('E').arms, 3: armX(ARMS[3], { ran: ran('whole') }) } })], ['E'], ARMS, 'a').some(x => /arm 3: tie off/.test(x)) && gate([unit('E', { arms: { ...unit('E').arms, 3: armX(ARMS[3], { ran: ran(ARMS[3], 1.25) }) } })], ['E'], ARMS, 'a').some(x => /arm 3: from 1.25 times/.test(x)));
  check('the gate refuses a cap that is not the estate term\'s (another estate shape)', gate([unit('E', { capTerm: 11200 })], ['E'], ARMS, 'a').some(x => /estate term's cap/.test(x)));
  check('the gate refuses a remedy unit on other tables than its main unit\'s', gate([unit('E'), unit('E', { mode: 'remedy', remedyMargin: '1e-4', digest0: 'q', digest1: 'q', arms: { 1: armX('whole'), R1: armX('whole+tieC@1e-4', { ran: ran('whole+tieC@1e-4', 1.25) }) } })], ['E'], ARMS, 'a', m => ({ R1: `whole+tieC@${m}` })).some(x => /remedy's tables/.test(x)));
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2);
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'tie-7002');
  const { requireFairLogs } = await import('./fair-gate.mjs');
  requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^(case|remedy)\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  const { HOUSEHOLDS, ARMS, remedyArms, stampFilesHash } = await import('./audit-tie.mjs');
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const P = gate(raw, HOUSEHOLDS, ARMS, stampFilesHash(), remedyArms);
  if (P.length) { console.log(`TIE-A GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const main = HOUSEHOLDS.map(id => raw.find(u => u.id === id && u.mode === 'main')), rem = raw.some(u => u.mode === 'remedy') ? HOUSEHOLDS.map(id => raw.find(u => u.id === id && u.mode === 'remedy')) : null, u0 = main[0];
  const A = Object.fromEntries(main.map(u => [u.id, Object.fromEntries(Object.entries(u.arms).map(([k, a]) => [k, armOf(a)]))]));
  const pairs = (b, x, src = A) => main.map(u => ({ id: u.id, cap: u.cap, B: A[u.id][b], X: src[u.id][x] }));
  console.log(`TIE-A (EXPLORATORY; D76, D81; TIE-A.md): ${raw.length} units, ${HOUSEHOLDS.length} households, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points; the gate: fair (one code, audit, seed, count of paths and points; every arm on its household's plan, its settings arm 1's but the tie-break, where it begins and the chooser's width; each unit's tables the same after its arms as before; the cap four times the opening wealth and the estate term's own)`);
  console.log(`\nArm 1, the whole menu, by household (the solve's seconds; coarse; survival; spending delivered; mean pot, capped; paths ending above the cap; lifetime tax; the tiers held on average, a re-wrap's share of decisions; a path):`);
  for (const u of main) { const a = A[u.id][1], t = a.tally, above = Array.from(a.pot).filter(x => x > u.cap).length;
    console.log(`  ${u.id.padEnd(6)} solve ${u.solveSecs.toFixed(0)} s, coarse ${u.coarse} | ${(100 * mean(a.survived)).toFixed(2)}% | ${(100 * sum(a.delivered) / sum(a.target)).toFixed(3)}% | £${Math.round(mean(a.pot)).toLocaleString('en-GB')}, capped £${Math.round(cappedMean(a.pot, u.cap)).toLocaleString('en-GB')} (the cap £${Math.round(u.cap).toLocaleString('en-GB')}) | ${above} (${(100 * above / u.N).toFixed(1)}%) | £${Math.round(mean(a.tax)).toLocaleString('en-GB')} | ${(t.pen / t.n).toFixed(3)} and ${(t.isa / t.n).toFixed(3)}, ${(100 * t.harvest / t.n).toFixed(1)}% | ${a.ms.toFixed(1)} ms`); }
  const show = (title, r, kind) => {
    console.log(`\n${title}`);
    for (const h of r.H) console.log(`  ${h.id.padEnd(6)} survival ${h.p.sB.toFixed(2)}% / ${h.p.sX.toFixed(2)}%, d ${f(h.p.d)} (${f(h.p.lo)} to ${f(h.p.hi)}; ${h.p.saved} saved, ${h.p.lost} lost) | spending ${f(h.delX - h.delB, 4)} | mean pot ${f(h.pot, 3)}%, capped ${f(h.capped, 3)}% | lifetime tax ${f(h.tax, 2)}% | of ${h.above} paths ending above the cap ${h.fell} end at or below it${h.fell ? ` (£${Math.round(h.fellMean).toLocaleString('en-GB')} lower on average)` : ''} | a path ${h.msX.toFixed(1)} ms`);
    const q = r.replay;
    console.log(`  1. pooled survival ${f(r.pooled)} (95% ${f(r.lo)} to ${f(r.hi)}, se ${r.se.toFixed(4)}); its lower end above ${RULE.pooledLo}: ${r.parts[1] ? 'HOLDS' : 'FAILS'}`);
    console.log(`  2. no household wholly below ${RULE.household}: ${r.harmed.length ? r.harmed.map(h => `${h.id} (${f(h.p.lo)} to ${f(h.p.hi)})`).join(', ') : 'none'}: ${r.parts[2] ? 'HOLDS' : 'FAILS'}`);
    console.log(`  3. pooled spending delivered ${f(r.spend, 4)} points of target; within ${RULE.spend} either way: ${r.parts[3] ? 'HOLDS' : 'FAILS'}`);
    if (kind === 13) {
      console.log(`  4. the capped pot ${f(r.capped, 3)}% pooled (not lower by more than ${RULE.cappedPooled}%); a household lower by more than ${RULE.cappedHousehold}%: ${r.cappedBad.length ? r.cappedBad.map(h => `${h.id} ${f(h.capped, 3)}%`).join(', ') : 'none'}: ${r.parts[4] ? 'HOLDS' : 'FAILS'}`);
      console.log(`  5. a household's mean pot left lower by more than ${RULE.potHousehold}%: ${r.potBad.length ? r.potBad.map(h => `${h.id} ${f(h.pot, 3)}%`).join(', ') : 'none'} (pooled ${f(r.pot, 3)}%): ${r.parts[5] ? 'HOLDS' : 'FAILS'}`);
      console.log(`  6. pooled lifetime tax £${Math.round(r.taxB).toLocaleString('en-GB')} to £${Math.round(r.taxX).toLocaleString('en-GB')} (${f(r.tax, 2)}%); not higher: ${r.parts[6] ? 'HOLDS' : 'FAILS'}`);
      console.log(`  7. the replay: ${q ? `${q.decisions} decisions (${q.above} above the cap), a different move at ${q.differ}; at another level ${q.level}, at another tier pair ${q.pair}, at or below the cap ${q.atOrBelow} (beside the rule: with more tax that year ${q.moreTax})` : 'none'}: ${r.parts[7] ? 'HOLDS' : 'FAILS'}`);
    } else {
      console.log(`  4. pooled mean pot left ${f(r.pot, 3)}% (not lower by more than ${RULE.potPooled7}%), the capped pot ${f(r.capped, 3)}% (not lower by more than ${RULE.capped7}%): ${r.parts[4] ? 'HOLDS' : 'FAILS'}`);
      console.log(`  5. the replay: ${q ? `${q.decisions} decisions, a different move at ${q.differ}, at another tier pair ${q.pair} (${r.pairShare.toFixed(3)}%), at another level ${q.level}` : 'none'}; under ${RULE.pair7}%: ${r.parts[5] ? 'HOLDS' : 'FAILS'}`);
      console.log(`  beside the rule: pooled lifetime tax ${f(r.tax, 2)}%; a path ${r.msB.toFixed(1)} ms to ${r.ms.toFixed(1)} ms pooled (${(r.msB / r.ms).toFixed(2)} times)`);
    }
    console.log(`  ${r.pass ? `PASSES 1 to ${kind === 13 ? 7 : 5}` : `FAILS ${r.failed.join(', ')}`}`);
  };
  console.log('\n==== ITEM 13: THE TIE-BREAK ABOVE THE ESTATE CAP (each arm against arm 1, the whole menu; the twelve) ====');
  const r3 = rule13(readOf(pairs(1, 3)), sumReplay(main, 3)), r2 = rule13(readOf(pairs(1, 2)), sumReplay(main, 2));
  show(`Arm 3, ${ARMS[3]} (within 0.01 points), against arm 1:`, r3, 13);
  show(`Arm 2, ${ARMS[2]} (within 0.001 points), against arm 1:`, r2, 13);
  let t13 = take13(r3, r2), base7 = t13.arm, w7 = null, src7 = A, replays = main;
  console.log(`\nITEM 13 OUTCOME: ${t13.why}.`);
  if (t13.remedy && rem) {
    const RA = Object.fromEntries(rem.map(u => [u.id, Object.fromEntries(Object.entries(u.arms).map(([k, a]) => [k, armOf(a)]))]));
    const rr = rule13(readOf(pairs(1, 'R1', RA)), sumReplay(rem, 'R1'));
    show(`The remedy, ${rem[0].arms.R1.arm} where wealth is above 1.25 times the cap, against arm 1 (the same paths and tables):`, rr, 13);
    console.log(`\nITEM 13, THE REMEDY'S OUTCOME: ${rr.pass ? `PASSES: the tie-break from 1.25 times the cap, within ${rem[0].remedyMargin}, is what stage B builds (D81)` : `FAILS ${rr.failed.join(', ')}: STOP and report`}.`);
    if (rr.pass) { base7 = 'R1'; w7 = ['R4', 'R5']; src7 = RA; replays = rem; t13 = { ...t13, arm: 'R1' }; }
  } else if (t13.remedy) console.log('The remedy has not been run: MODE=remedy bash research/solver/batch-tie.sh (TIE-A.md).');
  console.log('\n==== ITEM 7, READ AGAIN: THE SHORTLISTS WITH THE TIE-BREAK (each against the whole menu with the same tie-break) ====');
  const widths = w7 || (base7 === 2 ? [7, 8] : [4, 5]), bArm = base7 || 3, name = k => (src7 === A ? ARMS[k] : rem[0].arms[k].arm);
  const read7 = (x, b = bArm, s = src7, reps = replays) => rule7(readOf(main.map(u => ({ id: u.id, cap: u.cap, B: s[u.id][b], X: s[u.id][x] }))), sumReplay(reps, x));
  const st = read7(widths[0]), or = read7(widths[1]);
  show(`${name(widths[0])} against ${name(bArm)}:`, st, 7);
  show(`${name(widths[1])} against ${name(bArm)}:`, or, 7);
  if (src7 === A) {
    show(`Beside, to show the slice's part: arm 6, ${ARMS[6]}, against arm 3:`, read7(6, 3, A, main), 7);
    if (base7 === 2) { show(`Beside, at arm 3's margin: arm 4, ${ARMS[4]}, against arm 3:`, read7(4, 3, A, main), 7); show(`Beside, at arm 3's margin: arm 5, ${ARMS[5]}, against arm 3:`, read7(5, 3, A, main), 7); }
    for (const k of widths) { const s = main.reduce((x, u) => x + (A[u.id][k].sliced || 0), 0), n = main.reduce((x, u) => x + A[u.id][k].tally.n, 0), mv = main.reduce((x, u) => x + (A[u.id][k].slicedMoves || 0), 0); console.log(`  the slice under ${ARMS[k]}: at ${s} of ${n} decisions (${(100 * s / n).toFixed(1)}%), ${(mv / Math.max(1, s)).toFixed(1)} moves added`); }
  }
  const t7 = take7(st, or);
  console.log(`\nITEM 7 OUTCOME: ${t13.arm ? t7.why : `item 13's rule takes no arm: the widths read against arm 3 and reported; nothing is built (structure with the slice ${st.pass ? 'passes' : `fails ${st.failed.join(', ')}`}; order with the slice ${or.pass ? 'passes' : `fails ${or.failed.join(', ')}`})`}.`);
  console.log(`\nThe run: the solves ${(sum(raw.map(u => u.solveSecs)) / 3600).toFixed(1)} core-hours; the paths ${(sum(raw.flatMap(u => Object.values(u.arms).map(a => a.ms * u.N / 1000))) / 3600).toFixed(1)}; the hosts: ${[...new Set(raw.map(u => u.cpu))].join('; ')}.`);
}
