/*
 * 7R: WHY THE READER HARMS S126 AND BRIDGE 4 - the reducer (PLAN.md 7r; predictions/diag-7r.md registers what it reads).
 *   node research/solver/reduce-7r.mjs [dir=results/diag7r]            the diagnosis (save as results-7r.txt)
 *   node research/solver/reduce-7r.mjs --planted                        the planted checks alone
 * Reads the batch's logs (part*.txt: 7e's line format, the stamps and ran lines) and each arm's trace
 * (<case>-<arm>.json.gz, audit-s126.mjs diag7r). The fair-test gate first (the stamps, then every case's arms the same
 * but the bridge read, at the registered settings; every trace stamped as the logs are); anything short prints INCOMPLETE
 * and scores nothing. Then, per case,
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
 * On S126 and bridge 4, two swap arms from the same two tables (audit-s126.mjs diag7r, swap.mjs): RTIER, the reader's tiers
 * with off's order, harvest and spending level in the bridge years, and RREST, the reverse. THE PRIMARY READ: which of them
 * reproduces the reader's harm (decide()). The tier-lift paths and the other trace figures are reported, not scored.
 * The prediction's items and its three outcomes are scored below (items(), decide()); a miss is recorded, never re-read.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { mcnemarHarmP, binomUpperHalf, holm, survivalChange } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7r');
const PRED = 'research/solver/predictions/diag-7r.md';
const LAMBDA = '0.0223606797749979', SEED = '7002', PATHS = 3000, PTS = 16;
export const PANEL = [['S126', ['OFF', 'READER', 'RTIER', 'RREST']], ['bridge 4', ['OFF', 'READER', 'RTIER', 'RREST']], ['S120', ['OFF', 'READER']], ['wealth x2', ['OFF', 'READER']], ['S366', ['OFF', 'V1']]];
// the bridge: years from the case's current age to private pension access at 58 (the households' own privatePensionAge;
// audit-s126.mjs variant() sets the variants' ages to 58 minus their bridge; S120 is 56 and S366 50 in the library)
export const BRIDGE = { 'S126': 2, 'bridge 4': 4, 'S120': 2, 'wealth x2': 2, 'S366': 8 };
const BR = { OFF: 'false', V1: 'true', READER: 'reader', RTIER: 'swap-tier', RREST: 'swap-rest' };
// MARGIN: off survives 99% or more on S126, bridge 4 and S366 (results-7e.txt), so the regimen's 0.25 points (stats.mjs MARGINS)
export const ESTATE_MARGIN = 0.05, ALPHA = 0.05, ESTATE_ALPHA = 0.025, MARGIN = 0.25;
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };

// the logs: case lines and ran lines (7e's format)
export function parseLog(text) {
  const cases = []; let cur = null;
  for (const line of text.split('\n')) {
    const r = /^\s+ran (\S+): (.*)$/.exec(line);
    if (r && cur) { cur.ran[r[1]] = r[2]; continue; }
    const w = /^\s+swap (\S+): moves swapped (\d+), differing in the last bridge year or at access (\d+), access at year (\d+)$/.exec(line);
    if (w && cur) { cur.swap[w[1]] = { swapped: +w[2], late: +w[3], access: +w[4] }; continue; }
    if (!/ \| \S+ table /.test(line)) continue;
    const parts = line.split(' | ');
    cur = { id: parts[0].slice(0, 16).trim(), labels: parts.slice(1).map(p => p.split(' ')[0]), ran: {}, swap: {} };
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
      if (l === 'RTIER' || l === 'RREST') {
        const w = (c.swap || {})[l];
        if (!w) bad.push(`${id}: no swap line for ${l}`);
        else if (w.late !== 0 || w.access !== BRIDGE[id]) bad.push(`${id}: ${l} differs from off in the last bridge year or after on ${w.late} path-years, access at year ${w.access} (the bridge is ${BRIDGE[id]} years): the swap does not isolate what the prediction says`);
      }
      const ran = c.ran[l];
      if (!ran) { bad.push(`${id}: no ran line for ${l}`); continue; }
      if (strip(ran) !== strip(c.ran[labels[0]])) bad.push(`${id}: ${l} differs beyond the bridge read`);
      const want = { mix: '3', pts: String(PTS), seed: SEED, paths: String(PATHS), grid: `total${PTS}x6x6`, lambda: LAMBDA, raiseSurv: 'true', failShort: 'floor', tiersAbove: '1', quad: '5', finalIntegral: 'true', bridgeRead: BR[l] };
      for (const [k, v] of Object.entries(want)) if (field(ran, k) !== v) bad.push(`${id}: ${l} ${k} is ${field(ran, k)}, the prediction names ${v}`);
    }
  }
  return bad;
}

// the logs' stamp line (audit-s126.mjs), and whether a trace carries the same one: a trace is from the batch whose logs
// passed the gate only if its stamp agrees (the batch clears the folder first; this catches a file from another run)
export function logStamp(text) {
  const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text || '');
  return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null;
}
export const stampAgrees = (j, st) => !!(st && j && j.stamp && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === st[k]));

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
// against off; res[id].swaps (S126, bridge 4) holds RTIER's and RREST's against off
export const HARMED = ['S126', 'bridge 4'];
// one swap arm against off: carries the harm (more lost than saved, Holm-adjusted p below 0.05), carries none (the exact
// interval's lower end above minus the margin), or neither
export const carries = (x, pH) => x.lost > x.saved && pH < ALPHA;
export const carriesNone = x => survivalChange(x.lost, x.saved, x.N, ALPHA).lo > -MARGIN;
export function readCase(T, R, pT, pR) {
  const t = carries(T, pT), r = carries(R, pR), tn = carriesNone(T), rn = carriesNone(R);
  return t && r ? 'both' : t && rn ? 'tier' : r && tn ? 'method' : tn && rn ? 'neither' : 'unresolved';
}
export function decide({ reproduced, swaps }) {
  const ps = holm(HARMED.flatMap(id => [mcnemarHarmP(swaps[id].RTIER.lost, swaps[id].RTIER.saved), mcnemarHarmP(swaps[id].RREST.lost, swaps[id].RREST.saved)]));
  const reads = HARMED.map((id, j) => readCase(swaps[id].RTIER, swaps[id].RREST, ps[2 * j], ps[2 * j + 1]));
  const counted = HARMED.map((id, j) => reproduced[j] ? reads[j] : null).filter(Boolean);
  const said = HARMED.map((id, j) => `${id} ${reproduced[j] ? reads[j] : `not read (the reader's harm did not show; ${reads[j]})`}`).join('; ');
  if (!counted.length) return { outcome: 'INCONCLUSIVE', reads, ps, why: `the reader's harm showed on neither case, so there is nothing to split (${said})` };
  if (counted.includes('tier') && !counted.some(x => x === 'method' || x === 'both')) return { outcome: 'HELD', reads, ps, why: `the tier carries the harm (${said})` };
  if (counted.includes('method') && !counted.some(x => x === 'tier' || x === 'both')) return { outcome: 'FALSIFIED', reads, ps, why: `the reader's order, harvest or spending level carries the harm, not its tier (${said}) -> the reader's method; F2 is built, after the early 8h read is put to the maintainer (the 08:17 row)` };
  return { outcome: 'INCONCLUSIVE', reads, ps, why: `no clean split (${said}): to the maintainer` };
}
export function o23(x) {
  const iv = survivalChange(x.lost, x.saved, x.N, ALPHA);
  return { ...iv, reading: x.lost > x.saved && x.p < ALPHA ? 'replicated' : iv.lo > -MARGIN ? 'closes: no material harm' : 'stays open with its bound' };
}
export function items(res) {
  const hp = holm(HARMED.map(id => res[id].p));
  const reproduced = HARMED.map((id, j) => res[id].lost > res[id].saved && hp[j] < ALPHA);
  const swaps = Object.fromEntries(HARMED.map(id => [id, res[id].swaps]));
  const d = decide({ reproduced, swaps }), q = o23(res['S366']);
  const estates = HARMED.map(id => res[id].estate);
  const trade = estates.every(e => e === 'buys estate') ? 'the reader\'s arm buys estate on both: to the maintainer, whether survival alone judges households at 99.5% and over'
    : estates.some(e => e === 'buys nothing') ? 'it buys no estate on at least one case: the solver\'s risk weighing is examined before any bridge fix'
    : 'the trade is inconclusive on at least one case: to the maintainer with the intervals';
  const it = [
    ['1. the reader harms S126 and bridge 4 on seed 7002 (exact one-sided p, Holm over the two, below 0.05)', reproduced.every(Boolean), HARMED.map((id, j) => `${id} ${res[id].lost} lost ${res[id].saved} saved, Holm p ${hp[j].toExponential(1)}`).join('; ')],
    ['2. S120 and wealth x2: the reader loses and saves no path', ['S120', 'wealth x2'].every(id => res[id].lost === 0 && res[id].saved === 0), ['S120', 'wealth x2'].map(id => `${id} ${res[id].lost}/${res[id].saved}`).join('; ')],
    ['3. S366: v1 loses more than it saves (exact one-sided p below 0.05)', q.reading === 'replicated', `${res['S366'].lost} lost ${res['S366'].saved} saved, p ${res['S366'].p.toExponential(1)}, change ${q.d.toFixed(2)} (${q.lo.toFixed(2)} to ${q.hi.toFixed(2)}): O23 ${q.reading}`],
    ['4. the tier carries the harm: RTIER reproduces it and RREST does not, on a case where the reader harms, and on no such case the reverse or both', d.outcome === 'HELD', d.why],
    ['5. the reader\'s end wealth buys estate on S126 and on bridge 4', estates.every(e => e === 'buys estate'), HARMED.map(id => `${id} ${res[id].estate}`).join('; ')],
  ];
  return { it, reproduced, decision: d, o23: q, trade: d.outcome === 'HELD' ? trade : null };
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
  // the scoring's fixtures: x(lost, saved) one comparison of 3,000 paths; a case's reader result and its two swap arms
  const x = (lost, saved) => ({ lost, saved, N: 3000, p: mcnemarHarmP(lost, saved) });
  const rc = (rd, T, R, estate = 'buys estate') => ({ ...rd, estate, swaps: { RTIER: T, RREST: R } });
  const world = (s126, b4, s366 = x(7, 0)) => ({ 'S126': s126, 'bridge 4': b4, 'S120': x(0, 0), 'wealth x2': x(0, 0), 'S366': s366 });
  const tierW = world(rc(x(14, 0), x(14, 0), x(0, 0)), rc(x(10, 0), x(9, 0), x(1, 1)));
  const out = w => items(w).decision.outcome;
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
    ['the tier carries it on both cases: HELD', out(tierW), 'HELD'],
    ['the rest carries it on both cases: FALSIFIED', out(world(rc(x(14, 0), x(0, 0), x(14, 0)), rc(x(10, 0), x(1, 1), x(9, 0)))), 'FALSIFIED'],
    ['both carry it on one case: INCONCLUSIVE', out(world(rc(x(14, 0), x(14, 0), x(12, 0)), rc(x(10, 0), x(9, 0), x(0, 0)))), 'INCONCLUSIVE'],
    ['tier on S126, method on bridge 4: INCONCLUSIVE', out(world(rc(x(14, 0), x(14, 0), x(0, 0)), rc(x(10, 0), x(0, 0), x(9, 0)))), 'INCONCLUSIVE'],
    ['neither arm alone on either case (an interaction): INCONCLUSIVE', out(world(rc(x(14, 0), x(2, 0), x(2, 0)), rc(x(10, 0), x(1, 0), x(1, 0)))), 'INCONCLUSIVE'],
    ['the reader harms neither case on these paths: INCONCLUSIVE, whatever the swaps show', out(world(rc(x(3, 1), x(14, 0), x(0, 0)), rc(x(2, 2), x(9, 0), x(0, 0)))), 'INCONCLUSIVE'],
    ['a case where the reader shows no harm is not read: tier on S126 counts, bridge 4 (no harm) reading method does not', out(world(rc(x(14, 0), x(14, 0), x(0, 0)), rc(x(2, 2), x(0, 0), x(9, 0)))), 'HELD'],
    ['Holm over the four swap comparisons: 6 lost, 0 saved (raw 0.016, 0.062 after Holm) does not carry it', readCase(x(6, 0), x(0, 0), holm([mcnemarHarmP(6, 0), 1, 1, 1])[0], 1), 'neither'],
    ['decide adjusts over the four swap comparisons: S126\'s RTIER at 6 lost, 0 saved (0.016 raw) carries nothing after Holm, so no case reads tier', out(world(rc(x(14, 0), x(6, 0), x(0, 0)), rc(x(10, 0), x(0, 0), x(0, 0)))), 'INCONCLUSIVE'],
    ['carrying none is read by the interval: 12 lost, 6 saved (p 0.12) is not "none" (its lower end is below -0.25)', `${carriesNone(x(12, 6))} ${carriesNone(x(1, 1))}`, 'false true'],
    ['the tier and the rest are not swapped in the reading', readCase(x(14, 0), x(0, 0), 1e-4, 1), 'tier'],
    ['item 1 reads Holm over the two: 5 lost, 0 saved on each (0.031 raw, 0.062 after Holm) is harm on neither', String(items(world(rc(x(5, 0), x(14, 0), x(0, 0)), rc(x(5, 0), x(9, 0), x(0, 0)))).reproduced), 'false,false'],
    ['O23 read three ways: replicated; closes (1 lost, 1 saved: inside the margin); stays open (10 lost, 5 saved: p 0.15, lower end -0.38)', `${o23(x(10, 0)).reading}|${o23(x(1, 1)).reading}|${o23(x(10, 5)).reading}`, 'replicated|closes: no material harm|stays open with its bound'],
    ['the trade: one case buying nothing sends HELD to the risk weighing', /risk weighing/.test(items(world(rc(x(14, 0), x(14, 0), x(0, 0)), rc(x(10, 0), x(9, 0), x(1, 1), 'buys nothing'))).trade || '') ? 'yes' : 'no', 'yes'],
    ['a swap arm with a difference in the last bridge year or after fails the gate', String(gate([{ id: 'S126', labels: ['OFF', 'READER', 'RTIER', 'RREST'], ran: {}, swap: { RTIER: { swapped: 3, late: 1, access: 2 }, RREST: { swapped: 3, late: 0, access: 2 } } }]).some(b => /S126: RTIER differs from off in the last bridge year/.test(b))), 'true'],
    ['a swap arm whose access year is not the case\'s bridge fails the gate', String(gate([{ id: 'S126', labels: ['OFF', 'READER', 'RTIER', 'RREST'], ran: {}, swap: { RTIER: { swapped: 3, late: 0, access: 2 }, RREST: { swapped: 3, late: 0, access: 4 } } }]).some(b => /S126: RREST .*access at year 4/.test(b))), 'true'],
    ['the swap line is read from the log', JSON.stringify(parseLog('S126             a0 0.85 B 2 class YES | OFF table 1 | RTIER table - \n                 swap RTIER: moves swapped 3000, differing in the last bridge year or at access 0, access at year 2\n')[0].swap), '{"RTIER":{"swapped":3000,"late":0,"access":2}}'],
    ['a log with the wrong seed fails the gate', String(gate([{ id: 'S126', labels: ['OFF', 'READER'], ran: { OFF: 'mix 3 pts 16 seed 7011 paths 3000 grid total16x6x6 lambda 0.0223606797749979 raiseSurv true failShort floor tiersAbove 1 quad 5 finalIntegral true bridgeRead false', READER: 'mix 3 pts 16 seed 7011 paths 3000 grid total16x6x6 lambda 0.0223606797749979 raiseSurv true failShort floor tiersAbove 1 quad 5 finalIntegral true bridgeRead reader' } }]).some(b => /seed is 7011/.test(b))), 'true'],
    ['S366 under v1 must read bridgeRead true in its ran line', String(gate([{ id: 'S366', labels: ['OFF', 'V1'], ran: { OFF: 'bridgeRead false', V1: 'bridgeRead 1' } }]).some(b => /S366: V1 bridgeRead is 1/.test(b))), 'true'],
    ['a missing case fails the gate', String(gate([]).length >= 5), 'true'],
    ['the stamp line read; a trace stamped as the logs are agrees; one from other code, another prediction version, or with no stamp, does not', (() => { const st = logStamp('x\nstamp: code 100f24824a97 audit 08477342e8c5 prediction research/solver/predictions/diag-7r.md sha abc123\ny'); return `${st.prediction} ${stampAgrees({ stamp: { ...st } }, st)} ${stampAgrees({ stamp: { ...st, code: '0000' } }, st)} ${stampAgrees({ stamp: { ...st, sha: 'fff999' } }, st)} ${stampAgrees({}, st)} ${stampAgrees({ stamp: { ...st } }, null)}`; })(), 'research/solver/predictions/diag-7r.md true false false false false'],
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
const stamps = Object.entries(logs).map(([f, t]) => [f, logStamp(t)]);
const STAMP = stamps[0][1];
const bad = gate(cases).concat(stamps.filter(([, st]) => !st || JSON.stringify(st) !== JSON.stringify(STAMP)).map(([f]) => `${f}: its stamp line is missing or differs from ${stamps[0][0]}'s`));
if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
const traces = {};
for (const [id, labels] of PANEL) for (const l of labels) {
  const f = join(DIR, `${id.replace(/ /g, '_')}-${l.toLowerCase()}.json.gz`);
  if (!existsSync(f)) { console.log(`INCOMPLETE - no trace ${f}`); process.exit(1); }
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (j.N !== PATHS || String(j.seed) !== SEED || j.arm !== l) { console.log(`INCOMPLETE - ${f}: N ${j.N}, seed ${j.seed}, arm ${j.arm}`); process.exit(1); }
  if (!stampAgrees(j, STAMP)) { console.log(`FAIR-TEST GATE: FAILED\n  ${f}: its stamp ${JSON.stringify(j.stamp || null)} is not the logs' ${JSON.stringify(STAMP)}`); process.exit(1); }
  traces[`${id}|${l}`] = decode(j);
}
console.log(`FAIR-TEST GATE: passed - ${cases.length} cases, each case's arms the same but the bridge read, at the registered settings; ${Object.keys(traces).length} traces of ${PATHS} paths, each stamped as the logs are\n`);
console.log('7R: THE SECOND ARM AGAINST OFF, PER CASE, ON THE SAME 3,000 PATHS OF SEED 7002 (predictions/diag-7r.md)\n');
const k = x => (Number.isFinite(x) ? `${x >= 0 ? '' : '-'}${(Math.abs(x) / 1000).toFixed(0)}k` : String(x));
const res = {};
for (const [id, labels] of PANEL) {
  const c = compare(traces[`${id}|${labels[0]}`], traces[`${id}|${labels[1]}`], BRIDGE[id]);
  res[id] = c;
  if (labels.includes('RTIER')) c.swaps = Object.fromEntries(['RTIER', 'RREST'].map(l => [l, compare(traces[`${id}|OFF`], traces[`${id}|${l}`], BRIDGE[id])]));
  console.log(`${id} (${labels[1]} against OFF; bridge ${BRIDGE[id]} years): saved ${c.saved}, lost ${c.lost}, the exact p for harm ${c.p.toExponential(1)}`);
  console.log(`   end wealth median ${k(c.medA)} -> ${k(c.medB)}, unlucky tenth ${k(c.p10A)} -> ${k(c.p10B)}; paired over the ${c.nBoth} paths both survive: median ${k(c.ci.med)} (97.5% ${k(c.ci.lo)} to ${k(c.ci.hi)}), margin ${k(c.margin)} -> ${c.estate}`);
  console.log(`   lifetime spending paired ${c.dSpend >= 0 ? '+' : ''}${c.dSpend.toFixed(2)} years of target; ${c.bothLifted} of ${c.nBoth} paths both survive held a riskier pension tier than off in at least half their years`);
  console.log(`   years a path: below target ${c.a.below.toFixed(2)} -> ${c.b.below.toFixed(2)}; pension below its tier ${c.a.penBelow.toFixed(1)} -> ${c.b.penBelow.toFixed(1)}, above ${c.a.penAbove.toFixed(1)} -> ${c.b.penAbove.toFixed(1)}; ISA below ${c.a.isaBelow.toFixed(1)} -> ${c.b.isaBelow.toFixed(1)}, above ${c.a.isaAbove.toFixed(1)} -> ${c.b.isaAbove.toFixed(1)}; lifetime tax ${k(c.a.tax)} -> ${k(c.b.tax)}`);
  if (c.swaps) {
    const cs = cases.find(z => z.id === id);
    for (const l of ['RTIER', 'RREST']) { const w = c.swaps[l], iv = survivalChange(w.lost, w.saved, w.N, ALPHA);
      console.log(`   ${l} (${l === 'RTIER' ? "the reader's tiers, off's order, harvest and level" : "off's tiers, the reader's order, harvest and level"}) against OFF: saved ${w.saved}, lost ${w.lost}, p ${w.p.toExponential(1)}, change ${iv.d.toFixed(2)} (${iv.lo.toFixed(2)} to ${iv.hi.toFixed(2)}); moves swapped ${cs.swap[l].swapped}`); }
    const vs = compare(traces[`${id}|READER`], traces[`${id}|RTIER`], BRIDGE[id]);
    console.log(`   RTIER against READER: saved ${vs.saved}, lost ${vs.lost} (how far the tiers alone reproduce the reader's arm)`);
  }
  if (c.lost) console.log(`   the ${c.lost} lost paths: median failure year ${c.medFail}, ${c.afterBridge} at or after the bridge's end; first difference median year ${c.medFirst} (tier ${c.kinds.tier}, level ${c.kinds.level}, both ${c.kinds.both}); tier-lift paths ${c.liftPaths}`);
}
const sc = items(res);
console.log(`\nTHE PREDICTION'S ITEMS:`);
for (const [name, ok, detail] of sc.it) console.log(`${name}: ${detail} -> ${ok ? 'held' : 'MISSED'}`);
console.log(`\nOUTCOME: ${sc.decision.outcome} - ${sc.decision.why}${sc.trade ? `; ${sc.trade}` : ''}`);
console.log(`O23: ${sc.o23.reading}`);
export { res };
