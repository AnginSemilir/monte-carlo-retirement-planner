/*
 * 7R: WHY THE READER HARMS S126 AND BRIDGE 4 - the reducer (PLAN.md 7r; predictions/diag-7r.md registers what it reads).
 *   node research/solver/reduce-7r.mjs [dir=results/diag7r]            the diagnosis (save as results-7r.txt)
 *   node research/solver/reduce-7r.mjs --planted                        the planted checks alone
 * Reads the batch's logs (part*.txt: 7e's line format, the stamps and ran lines) and each arm's trace
 * (<case>-<arm>.json.gz, audit-s126.mjs diag7r). The fair-test gate first (the stamps, then every case's arms the same
 * but the bridge read, at the registered settings); anything short prints INCOMPLETE and scores nothing. Then, per case,
 * the second arm against the first (off) on the same paths:
 *   - survival: paths saved and lost, the exact one-sided p for harm (stats.mjs);
 *   - end wealth (the last year's; a failed path counts 0), a stand-in for estate, which the trace does not carry: median
 *     and unlucky tenth per arm, and over the paths both arms survive the paired difference's median with its exact
 *     order-statistic interval, against a margin of 5% of off's median;
 *   - per-path means: years below the spending target, years with the pension and the ISA below and above the plan's tier,
 *     lifetime tax; lifetime spending (in years of target) paired over the paths both survive;
 *   - the paths the second arm loses: failure year, whether it falls at or after the bridge's end (private pension access),
 *     the first year the arms' moves differ and whether that is a tier or a spending level, and the years before failing
 *     with a riskier pension tier than off's. A TIER-LIFT PATH fails at or after the bridge's end having held a riskier
 *     pension tier than off in at least half its years before failing.
 * The prediction's items and its three outcomes are scored below (items(), decide()); a miss is recorded, never re-read.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { mcnemarHarmP, binomUpperHalf, holm } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7r');
const PRED = 'research/solver/predictions/diag-7r.md';
const LAMBDA = '0.0223606797749979', SEED = '7002', PATHS = 3000, PTS = 16;
export const PANEL = [['S126', ['OFF', 'READER']], ['bridge 4', ['OFF', 'READER']], ['S120', ['OFF', 'READER']], ['wealth x2', ['OFF', 'READER']], ['S366', ['OFF', 'V1']]];
// the bridge: years from the case's current age to private pension access at 58 (the households' own privatePensionAge;
// audit-s126.mjs variant() sets the variants' ages to 58 minus their bridge; S120 is 56 and S366 50 in the library)
export const BRIDGE = { 'S126': 2, 'bridge 4': 4, 'S120': 2, 'wealth x2': 2, 'S366': 8 };
const BR = { OFF: 'false', V1: 'true', READER: 'reader' };
export const MIN_LOST = 6, LIFT_HELD = 2 / 3, LIFT_FALSIFIED = 1 / 2, ESTATE_MARGIN = 0.05, ALPHA = 0.05, ESTATE_ALPHA = 0.025;
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };

// the logs: case lines and ran lines (7e's format)
export function parseLog(text) {
  const cases = []; let cur = null;
  for (const line of text.split('\n')) {
    const r = /^\s+ran (\S+): (.*)$/.exec(line);
    if (r && cur) { cur.ran[r[1]] = r[2]; continue; }
    if (!/ \| \S+ table /.test(line)) continue;
    const parts = line.split(' | ');
    cur = { id: parts[0].slice(0, 16).trim(), labels: parts.slice(1).map(p => p.split(' ')[0]), ran: {} };
    cases.push(cur);
  }
  return cases;
}
export function gate(cases) {
  const bad = [];
  for (const [id, labels] of PANEL) {
    const c = cases.find(x => x.id === id);
    if (!c) { bad.push(`${id}: no case line`); continue; }
    if (c.labels.join(',') !== labels.join(',')) bad.push(`${id}: arms ${c.labels.join(',')}, the prediction names ${labels.join(',')}`);
    const strip = s => (s || '').replace(/ bridgeRead \S+/, '');
    for (const l of labels) {
      const ran = c.ran[l];
      if (!ran) { bad.push(`${id}: no ran line for ${l}`); continue; }
      if (strip(ran) !== strip(c.ran[labels[0]])) bad.push(`${id}: ${l} differs beyond the bridge read`);
      const want = { mix: '3', pts: String(PTS), seed: SEED, paths: String(PATHS), grid: `total${PTS}x6x6`, lambda: LAMBDA, raiseSurv: 'true', failShort: 'floor', tiersAbove: '1', quad: '5', finalIntegral: 'true', bridgeRead: BR[l] };
      for (const [k, v] of Object.entries(want)) if (field(ran, k) !== v) bad.push(`${id}: ${l} ${k} is ${field(ran, k)}, the prediction names ${v}`);
    }
  }
  return bad;
}

// one arm's trace, decoded
const u8 = s => new Uint8Array(Buffer.from(s, 'base64'));
const f32 = s => { const b = Buffer.from(s, 'base64'); return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4); };
const i16 = s => { const b = Buffer.from(s, 'base64'); return new Int16Array(b.buffer, b.byteOffset, b.byteLength / 2); };
export function decode(j) { return { N: j.N, Y: j.Y, survived: u8(j.survived), level: u8(j.level), tier: u8(j.tier), wealth: f32(j.wealth), taxPaid: f32(j.taxPaid), failYear: i16(j.failYear) }; }
// the trace stores tierPen * 4 + tierIsa (solve.js runPolicy). Each is an index into its wrapper's list (fast.js tiersFor):
// 0 the plan's tier, 1 and 2 the tiers below it (less risky), 3 the tier above (only with the tier above allowed and a
// full list below; the panel's pension is at the top tier, so it has none). riskRank orders them, riskier higher.
export const tierOf = code => ({ pen: code >> 2, isa: code & 3 });
export const riskRank = idx => (idx === 3 ? 1 : -idx);
const endWealth = (T, i) => (T.survived[i] ? T.wealth[i * T.Y + T.Y - 1] : 0);
const quant = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN; };
// the exact interval for a median from the order statistics: [x(k), x(n+1-k)], k the largest with P(Bin(n, 1/2) <= k-1) <= alpha/2
export function medianCI(xs, alpha) {
  const s = Float64Array.from(xs).sort(), n = s.length;
  if (!n) return { n, med: NaN, lo: NaN, hi: NaN };
  let k = 0;
  while (k < n && 1 - binomUpperHalf(k + 1, n) <= alpha / 2) k++;
  const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  return k ? { n, med, lo: s[k - 1], hi: s[n - k] } : { n, med, lo: -Infinity, hi: Infinity };
}
// does the second arm's end wealth buy estate: the paired median's interval above 0 and the point at least the margin
export const estateOutcome = (ci, margin) => (ci.lo > 0 && ci.med >= margin ? 'buys estate' : ci.hi < margin ? 'buys nothing' : 'inconclusive');

export function compare(A, B, bridge) {
  const N = A.N, Y = A.Y;
  let saved = 0, lost = 0, liftPaths = 0, afterBridge = 0, bothLifted = 0;
  const lostRows = [], dW = [], dS = [];
  const spend = (T, i) => { let x = 0; for (let t = 0; t < Y; t++) x += T.level[i * Y + t]; return x / 100; };
  const penRiskier = (a, b) => riskRank(tierOf(b).pen) > riskRank(tierOf(a).pen);
  const per = T => {
    let below = 0, penBelow = 0, penAbove = 0, isaBelow = 0, isaAbove = 0, tax = 0;
    for (let i = 0; i < N; i++) for (let t = 0; t < Y; t++) {
      const k = i * Y + t, lv = T.level[k];
      if (lv > 0 && lv < 100) below++;
      if (lv > 0) { const r = tierOf(T.tier[k]); if (riskRank(r.pen) < 0) penBelow++; if (riskRank(r.pen) > 0) penAbove++; if (riskRank(r.isa) < 0) isaBelow++; if (riskRank(r.isa) > 0) isaAbove++; }
      tax += T.taxPaid[k];
    }
    return { below: below / N, penBelow: penBelow / N, penAbove: penAbove / N, isaBelow: isaBelow / N, isaAbove: isaAbove / N, tax: tax / N };
  };
  for (let i = 0; i < N; i++) {
    if (!A.survived[i] && B.survived[i]) saved++;
    if (A.survived[i] && !B.survived[i]) {
      lost++;
      const fy = B.failYear[i], end = fy < 0 ? Y : fy;   // a failure with no year marked is taken as at the end
      let first = -1, firstKind = '', penRisk = 0;
      for (let t = 0; t < end; t++) {
        const k = i * Y + t, dT = A.tier[k] !== B.tier[k], dL = A.level[k] !== B.level[k];
        if (first < 0 && (dT || dL)) { first = t; firstKind = dT && dL ? 'both' : dT ? 'tier' : 'level'; }
        if (penRiskier(A.tier[k], B.tier[k])) penRisk++;
      }
      const after = end >= bridge, lift = after && end > 0 && 2 * penRisk >= end;
      if (after) afterBridge++;
      if (lift) liftPaths++;
      lostRows.push({ path: i, failYear: fy, firstDiff: first, firstKind, penRisk, years: end, after, lift });
    }
    if (A.survived[i] && B.survived[i]) {
      dW.push(endWealth(B, i) - endWealth(A, i)); dS.push(spend(B, i) - spend(A, i));
      let r = 0; for (let t = 0; t < Y; t++) if (penRiskier(A.tier[i * Y + t], B.tier[i * Y + t])) r++;
      if (2 * r >= Y) bothLifted++;
    }
  }
  const wa = Array.from({ length: N }, (_, i) => endWealth(A, i)), wb = Array.from({ length: N }, (_, i) => endWealth(B, i));
  const medA = quant(wa, 0.5), ci = medianCI(dW, ESTATE_ALPHA), margin = ESTATE_MARGIN * medA;
  const kinds = { tier: 0, level: 0, both: 0 }; for (const r of lostRows) if (r.firstKind) kinds[r.firstKind]++;
  return { N, saved, lost, p: mcnemarHarmP(lost, saved), medA, medB: quant(wb, 0.5), p10A: quant(wa, 0.1), p10B: quant(wb, 0.1),
    nBoth: dW.length, ci, margin, estate: estateOutcome(ci, margin), dSpend: dW.length ? dS.reduce((x, y) => x + y, 0) / dS.length : NaN,
    bothLifted, a: per(A), b: per(B), lostRows, afterBridge, liftPaths, kinds,
    medFail: quant(lostRows.map(r => r.failYear), 0.5), medFirst: quant(lostRows.map(r => r.firstDiff), 0.5) };
}

// the prediction's items and outcome (predictions/diag-7r.md, Decision rule): res maps each case id to compare()'s result
export function items(res) {
  const harmed = ['S126', 'bridge 4'], hp = holm(harmed.map(id => res[id].p));
  const reproduced = harmed.map((id, j) => res[id].lost > res[id].saved && hp[j] < ALPHA);
  const pooledLost = harmed.reduce((t, id) => t + res[id].lost, 0), pooledLift = harmed.reduce((t, id) => t + res[id].liftPaths, 0);
  const share = pooledLost ? pooledLift / pooledLost : NaN;
  const it = [
    ['1. the reader harms S126 and bridge 4 on seed 7002 (exact one-sided p, Holm over the two, below 0.05)', reproduced.every(Boolean), harmed.map((id, j) => `${id} ${res[id].lost} lost ${res[id].saved} saved, Holm p ${hp[j].toExponential(1)}`).join('; ')],
    ['2. S120 and wealth x2: the reader loses and saves no path', ['S120', 'wealth x2'].every(id => res[id].lost === 0 && res[id].saved === 0), ['S120', 'wealth x2'].map(id => `${id} ${res[id].lost}/${res[id].saved}`).join('; ')],
    ['3. S366: v1 loses more than it saves (exact one-sided p below 0.05)', res['S366'].lost > res['S366'].saved && res['S366'].p < ALPHA, `${res['S366'].lost} lost ${res['S366'].saved} saved, p ${res['S366'].p.toExponential(1)}`],
    [`4. at least two-thirds of S126's and bridge 4's lost paths (at least ${MIN_LOST}) are tier-lift paths`, pooledLost >= MIN_LOST && share >= LIFT_HELD, `${pooledLift} of ${pooledLost}${pooledLost ? ` (${share.toFixed(2)})` : ''}`],
    ['5. the reader\'s end wealth buys estate on S126 and on bridge 4', harmed.every(id => res[id].estate === 'buys estate'), harmed.map(id => `${id} ${res[id].estate}`).join('; ')],
  ];
  return { it, reproduced, pooledLost, pooledLift, share, decision: decide({ pooledLost, share, reproduced, estates: harmed.map(id => res[id].estate) }) };
}
export function decide({ pooledLost, share, reproduced, estates }) {
  if (!reproduced.some(Boolean) || pooledLost < MIN_LOST) return { outcome: 'INCONCLUSIVE', why: `too few lost paths to read (${pooledLost}; the harm reproduced on ${reproduced.filter(Boolean).length} of 2 cases)` };
  if (share < LIFT_FALSIFIED) return { outcome: 'FALSIFIED', why: 'fewer than half the lost paths are tier-lift paths: the harm lands in the bridge or with no riskier pension tier, where the reader acts -> the reader\'s method; F2 is built, after the early 8h read is put to the maintainer (the 08:17 row)' };
  if (share < LIFT_HELD) return { outcome: 'INCONCLUSIVE', why: 'between half and two-thirds of the lost paths are tier-lift paths' };
  const trade = estates.every(e => e === 'buys estate') ? 'the lift buys estate on both: to the maintainer, whether survival alone judges households at 99.5% and over'
    : estates.some(e => e === 'buys nothing') ? 'the lift buys no estate on at least one: the solver\'s risk weighing is examined before any bridge fix'
    : 'the trade is inconclusive on at least one case: to the maintainer with the intervals';
  return { outcome: 'HELD', why: `the harm is the tier the accurate read lets the solver hold after the bridge; ${trade}` };
}

// PLANTED, before any real file (rule 6: a check is trusted only after it has failed on a planted fault)
{
  const mk = (surv, levels, tiers, wealth, fails) => {
    const N = surv.length, Y = levels[0].length;
    return { N, Y, survived: Uint8Array.from(surv), level: Uint8Array.from(levels.flat()), tier: Uint8Array.from(tiers.flat()), wealth: Float32Array.from(wealth.flat()), taxPaid: new Float32Array(N * Y).fill(10), failYear: Int16Array.from(fails) };
  };
  // path 0 both survive; path 1 off survives, the arm fails in year 2 after holding a riskier pension tier in year 1
  // (off one below, code 5; the arm at the plan's, code 0); path 2 off fails (below the floor in year 1, with 3 left at
  // the end, which counts 0), the arm survives
  const A = mk([1, 1, 0], [[100, 100, 100], [100, 100, 100], [100, 90, 0]], [[5, 5, 5], [5, 5, 5], [5, 5, 5]], [[10, 20, 30], [10, 20, 30], [5, 1, 3]], [-1, -1, 2]);
  const B = mk([1, 0, 1], [[100, 100, 100], [100, 100, 0], [100, 100, 100]], [[5, 5, 5], [5, 0, 0], [5, 5, 5]], [[10, 20, 40], [10, 5, 0], [5, 9, 12]], [-1, 2, -1]);
  const c = compare(A, B, 1), c3 = compare(A, B, 3);
  const ci10 = medianCI([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.05);
  const big = medianCI(Array.from({ length: 3000 }, (_, i) => i), 0.025);
  const res = id => ({ lost: 12, saved: 0, p: mcnemarHarmP(12, 0), liftPaths: 10, estate: 'buys estate', ...id });
  const good = { 'S126': res({}), 'bridge 4': res({}), 'S120': res({ lost: 0, liftPaths: 0 }), 'wealth x2': res({ lost: 0, liftPaths: 0 }), 'S366': res({ lost: 7, p: mcnemarHarmP(7, 0) }) };
  const cases = [
    ['saved and lost', `${c.saved}/${c.lost}`, '1/1'],
    ['the lost path fails in year 2', String(c.lostRows[0]?.failYear), '2'],
    ['the arms first differ in year 1, by the tier', `${c.lostRows[0]?.firstDiff} ${c.lostRows[0]?.firstKind}`, '1 tier'],
    ['the lost path held a riskier pension tier for 1 of its 2 years', `${c.lostRows[0]?.penRisk}/${c.lostRows[0]?.years}`, '1/2'],
    ['a bridge of 1 year: the path fails after it, a tier-lift path', `${c.afterBridge} ${c.liftPaths}`, '1 1'],
    ['a bridge of 3 years: the path fails inside it, not a tier-lift path', `${c3.afterBridge} ${c3.liftPaths}`, '0 0'],
    ['a bridge of 2 years: the path fails in the first year of access, after the bridge', `${compare(A, B, 2).afterBridge} ${compare(A, B, 2).liftPaths}`, '1 1'],
    ['end wealth paired over the one path both survive: 40 - 30', `${c.nBoth} ${c.ci.med}`, '1 10'],
    ['a failed path counts 0 end wealth: median off of [30, 30, 0]', String(c.medA), '30'],
    ['a failed path counts 0 end wealth: unlucky tenth off of [30, 30, 0]', String(c.p10A), '0'],
    ['code 13 is the pension one above and the ISA one below', JSON.stringify(tierOf(13)), '{"pen":3,"isa":1}'],
    ['the tier above ranks riskier than the plan\'s, the plan\'s than two below', String(riskRank(3) > riskRank(0) && riskRank(0) > riskRank(1) && riskRank(1) > riskRank(2)), 'true'],
    ['years below target: one year at 90 on path 2 of off, over 3 paths', c.a.below.toFixed(4), (1 / 3).toFixed(4)],
    ['off\'s pension below its tier in every spending year: 8 of 9 path-years at level > 0, over 3 paths', c.a.penBelow.toFixed(4), (8 / 3).toFixed(4)],
    ['the median\'s exact 95% interval over 1..10 is x(2) to x(9)', `${ci10.lo} ${ci10.hi} ${ci10.med}`, '2 9 5.5'],
    ['the median\'s exact 97.5% interval over 0..2999 is about the middle 2.24 sd (1438 to 1561)', `${big.lo} ${big.hi}`, '1438 1561'],
    ['estate: interval above 0 and median at the margin buys estate; upper end under the margin buys nothing; above 0 with the point under the margin is inconclusive', `${estateOutcome({ lo: 1, hi: 9, med: 5 }, 5)}|${estateOutcome({ lo: -1, hi: 4, med: 1 }, 5)}|${estateOutcome({ lo: -1, hi: 9, med: 5 }, 5)}|${estateOutcome({ lo: 1, hi: 9, med: 4 }, 5)}`, 'buys estate|buys nothing|inconclusive|inconclusive'],
    ['20 of 24 lost paths tier-lift, both buy estate: HELD', items(good).decision.outcome, 'HELD'],
    ['4 of 24 tier-lift: FALSIFIED', items({ ...good, 'S126': res({ liftPaths: 2 }), 'bridge 4': res({ liftPaths: 2 }) }).decision.outcome, 'FALSIFIED'],
    ['14 of 24 tier-lift: INCONCLUSIVE', items({ ...good, 'S126': res({ liftPaths: 7 }), 'bridge 4': res({ liftPaths: 7 }) }).decision.outcome, 'INCONCLUSIVE'],
    ['5 lost paths in all: INCONCLUSIVE, too few', items({ ...good, 'S126': res({ lost: 3, liftPaths: 3, p: mcnemarHarmP(3, 0) }), 'bridge 4': res({ lost: 2, liftPaths: 2, p: mcnemarHarmP(2, 0) }) }).decision.outcome, 'INCONCLUSIVE'],
    ['decide: 5 lost paths in all is too few even with the harm read on one case (items() cannot reach this under Holm over two: one case harmed needs 6 lost there)', decide({ pooledLost: 5, share: 1, reproduced: [true, false], estates: ['buys estate', 'buys estate'] }).outcome, 'INCONCLUSIVE'],
    ['one case buys nothing: the risk weighing is examined', /risk weighing/.test(items({ ...good, 'bridge 4': res({ estate: 'buys nothing' }) }).decision.why) ? 'yes' : 'no', 'yes'],
    ['item 1 needs both cases harmed after Holm', String(items({ ...good, 'bridge 4': res({ lost: 3, p: mcnemarHarmP(3, 0) }) }).it[0][1]), 'false'],
    ['item 1 reads Holm: 5 lost, 0 saved on each (p 0.031 raw, 0.062 after Holm) is not harm', String(items({ ...good, 'S126': res({ lost: 5, p: mcnemarHarmP(5, 0) }), 'bridge 4': res({ lost: 5, p: mcnemarHarmP(5, 0) }) }).it[0][1]), 'false'],
    ['a log with the wrong seed fails the gate', String(gate([{ id: 'S126', labels: ['OFF', 'READER'], ran: { OFF: 'mix 3 pts 16 seed 7011 paths 3000 grid total16x6x6 lambda 0.0223606797749979 raiseSurv true failShort floor tiersAbove 1 quad 5 finalIntegral true bridgeRead false', READER: 'mix 3 pts 16 seed 7011 paths 3000 grid total16x6x6 lambda 0.0223606797749979 raiseSurv true failShort floor tiersAbove 1 quad 5 finalIntegral true bridgeRead reader' } }]).some(b => /seed is 7011/.test(b))), 'true'],
    ['S366 under v1 must read bridgeRead true in its ran line', String(gate([{ id: 'S366', labels: ['OFF', 'V1'], ran: { OFF: 'bridgeRead false', V1: 'bridgeRead 1' } }]).some(b => /S366: V1 bridgeRead is 1/.test(b))), 'true'],
    ['a missing case fails the gate', String(gate([]).length >= 5), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  if (process.argv.includes('--planted')) { console.log(`planted (${cases.length}): all read as they should`); process.exit(0); }
}

// the real files
const logs = {};
for (let k = 0; k < 5; k++) { const f = join(DIR, `part${k}.txt`); if (existsSync(f)) logs[`part${k}.txt`] = readFileSync(f, 'utf8'); }
if (!Object.keys(logs).length) { console.log(`INCOMPLETE - no logs in ${DIR}`); process.exit(1); }
requireFairLogs(logs, PRED);
const cases = Object.values(logs).flatMap(parseLog);
const bad = gate(cases);
if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
const traces = {};
for (const [id, labels] of PANEL) for (const l of labels) {
  const f = join(DIR, `${id.replace(/ /g, '_')}-${l.toLowerCase()}.json.gz`);
  if (!existsSync(f)) { console.log(`INCOMPLETE - no trace ${f}`); process.exit(1); }
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (j.N !== PATHS || String(j.seed) !== SEED || j.arm !== l) { console.log(`INCOMPLETE - ${f}: N ${j.N}, seed ${j.seed}, arm ${j.arm}`); process.exit(1); }
  traces[`${id}|${l}`] = decode(j);
}
console.log(`FAIR-TEST GATE: passed - ${cases.length} cases, each case's arms the same but the bridge read, at the registered settings; ${Object.keys(traces).length} traces of ${PATHS} paths\n`);
console.log('7R: THE SECOND ARM AGAINST OFF, PER CASE, ON THE SAME 3,000 PATHS OF SEED 7002 (predictions/diag-7r.md)\n');
const k = x => (Number.isFinite(x) ? `${x >= 0 ? '' : '-'}${(Math.abs(x) / 1000).toFixed(0)}k` : String(x));
const res = {};
for (const [id, labels] of PANEL) {
  const c = compare(traces[`${id}|${labels[0]}`], traces[`${id}|${labels[1]}`], BRIDGE[id]);
  res[id] = c;
  console.log(`${id} (${labels[1]} against OFF; bridge ${BRIDGE[id]} years): saved ${c.saved}, lost ${c.lost}, the exact p for harm ${c.p.toExponential(1)}`);
  console.log(`   end wealth median ${k(c.medA)} -> ${k(c.medB)}, unlucky tenth ${k(c.p10A)} -> ${k(c.p10B)}; paired over the ${c.nBoth} paths both survive: median ${k(c.ci.med)} (97.5% ${k(c.ci.lo)} to ${k(c.ci.hi)}), margin ${k(c.margin)} -> ${c.estate}`);
  console.log(`   lifetime spending paired ${c.dSpend >= 0 ? '+' : ''}${c.dSpend.toFixed(2)} years of target; ${c.bothLifted} of ${c.nBoth} paths both survive held a riskier pension tier than off in at least half their years`);
  console.log(`   years a path: below target ${c.a.below.toFixed(2)} -> ${c.b.below.toFixed(2)}; pension below its tier ${c.a.penBelow.toFixed(1)} -> ${c.b.penBelow.toFixed(1)}, above ${c.a.penAbove.toFixed(1)} -> ${c.b.penAbove.toFixed(1)}; ISA below ${c.a.isaBelow.toFixed(1)} -> ${c.b.isaBelow.toFixed(1)}, above ${c.a.isaAbove.toFixed(1)} -> ${c.b.isaAbove.toFixed(1)}; lifetime tax ${k(c.a.tax)} -> ${k(c.b.tax)}`);
  if (c.lost) console.log(`   the ${c.lost} lost paths: median failure year ${c.medFail}, ${c.afterBridge} at or after the bridge's end; first difference median year ${c.medFirst} (tier ${c.kinds.tier}, level ${c.kinds.level}, both ${c.kinds.both}); tier-lift paths ${c.liftPaths}`);
}
const sc = items(res);
console.log(`\nTHE PREDICTION'S ITEMS:`);
for (const [name, ok, detail] of sc.it) console.log(`${name}: ${detail} -> ${ok ? 'held' : 'MISSED'}`);
console.log(`\nOUTCOME: ${sc.decision.outcome} - ${sc.decision.why}`);
export { res };
