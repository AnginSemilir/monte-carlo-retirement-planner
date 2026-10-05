/*
 * XAS'S REDUCER (PLAN.md XAS; audit-xas.mjs; predictions/diag-xas.md). A TEST at COV-B-STEP's unit (READER/TS+J/W0.02/PCLSI,
 * 6 share points, 30 wealth points, seed 7002, 2,000 paths a world, e3 off) on S370, S130, bridge 4 and S126: at every reader
 * read along BASE's paths, each arm's read split as
 *     read - claim  =  (read - ex5)   +  (ex5 - exF)   +  (exF - claim)
 *                      representation   quadrature      the year's draw (mean 0 when the one-step value is right)
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/diag-xas.md); every household once and done with
 *   BASE and COV; the ran line COV-B-STEP's unit (30 points, seed 7002, 6,000 paths, 3 worlds, 41 fine points); the checks
 *   line all passed and run on something; every per-read file present, stamped as the logs, its counts the xas lines';
 *   THE IDENTITY: BASE's and COV's reads and claims equal COV-B-STEP's saved fixed reads read for read (the same years,
 *   worlds and kinds), COV-B-STEP's files first passing their own gate (reduce-covb.mjs, rule 3); and THE DRAW: on every
 *   household, arm and kind, mean(exF - claim) within 4 of its se (the one-step value is the forward run's expectation; a
 *   wider gap means the decomposition has a term it does not name). Anything else differing: NOT SETTLED.
 * THE READING (registered in predictions/diag-xas.md):
 *   ITEM 1 (primary; the relocation, O99): COV's reads in S370's years before each step (the step years less one), per path
 *     y = sum over those reads of (rep - quad); Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000) of
 *     mean(y) above 0 (REP: the table's representation carries more of the error) and below (QUAD: the quadrature), Holm
 *     over the 2; else SPLIT. The item: REP HELD, QUAD FALSIFIED, SPLIT INCONCLUSIVE.
 *   ITEM 2 (the step reads' optimism, O76's rank 1): BASE's step-year reads on S370 and S130, per path y as item 1; Holm
 *     over the 4; HELD when both read REP, FALSIFIED when either reads QUAD, else INCONCLUSIVE.
 *   REPORTED, not items: every household, arm, kind and year: reads, mean D, rep, quad and the draw, by world, top cell
 *     and straddle; BASE's quadrature against stepExpect (exS) beside exF; S126's opening (each arm's year-0 move, the
 *     gap between the two moves' scores in each arm) and the swap (survived per arm with its own and the other arm's
 *     opening, the McNemar cells).
 *   node research/solver/reduce-xas.mjs [dir] [paths a world] [points] > research/solver/results-xas.txt
 *   node research/solver/reduce-xas.mjs --planted   the planted checks alone, the outcomes they reach and the EDGES
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { parse as parseC, gate as gateC, loadFiles as loadC, stampOf as stampC, PRED as PREDC } from './reduce-covb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-xas.md';
export const PTS = '30', SEED = '7002', NPW = 2000, NF = '41', B = 20000, ALPHA = 0.05, DRAW_Z = 4;
export const UNITS = ['S370', 'S130', 'bridge 4', 'S126'], ARMS = ['BASE', 'COV'];
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const L = 'READER/TS+J/W0.02/PCLSI';
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`);
const CASEL = /^(\S.*?)\s+case \| unit (\S+) \| /;

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), unit: m[2], solve: {}, xas: {}, open: {}, swap: {}, done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = /^\s+solve (BASE|COV): (.*)$/.exec(line))) cur.solve[m[1]] = m[2];
    else if ((m = new RegExp(`^\\s+ran ${esc(L)}: (.*)$`).exec(line))) cur.ran = m[1];
    else if ((m = /^\s+xas (BASE|COV) (step|spread): reads (\d+) /.exec(line))) (cur.xas[m[1]] ||= {})[m[2]] = Number(m[3]);
    else if ((m = /^\s+checks: rates (\d+)\/(\d+) nodes (\d+)\/(\d+) mix (\d+)\/(\d+)$/.exec(line))) cur.checks = m.slice(1).map(Number);
    else if ((m = /^\s+open (BASE|COV): move (\d+) /.exec(line))) cur.open[m[1]] = Number(m[2]);
    else if ((m = /^\s+swap (BASE|COV): paths (\d+) survived (\d+) with \S+ opening (\d+)$/.exec(line))) cur.swap[m[1]] = { paths: +m[2], own: +m[3], swapped: +m[4] };
    else if (new RegExp(`^\\s+done ${esc(L)} `).test(line)) cur.done = true;
  }
  return us;
}

export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const id of UNITS) { const n = units.filter(u => u.id === id).length; if (n !== 1) bad.push(`${id}: ${n} unit lines, not 1`); }
  for (const u of units) {
    const tag = u.id;
    if (!UNITS.includes(u.id)) { bad.push(`${tag}: not a registered household`); continue; }
    if (u.unit !== L) bad.push(`${tag}: unit ${u.unit}, not ${L}`);
    if (!u.done) bad.push(`${tag}: not done`);
    for (const a of ARMS) if (!u.solve[a]) bad.push(`${tag}: no solve line for ${a}`);
    if (u.solve.BASE && (field(u.solve.BASE, 'readerTax') !== '-' || field(u.solve.BASE, 'coverage') !== '-')) bad.push(`${tag}: BASE ran with the reader's tax or coverage`);
    if (u.solve.COV && (field(u.solve.COV, 'readerTax') === '-' || field(u.solve.COV, 'coverage') === '-')) bad.push(`${tag}: COV ran without the reader's tax or coverage`);
    if (!u.ran) { bad.push(`${tag}: no ran line`); continue; }
    const want = { mix: '3', pts, seed: SEED, paths: String(3 * npw), worlds: '3', nf: NF };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (!u.checks) bad.push(`${tag}: no checks line`);
    else { const [r, R, n, N, x, X] = u.checks; if (!(R > 0 && N > 0 && X > 0)) bad.push(`${tag}: a self-check ran on nothing`); if (r !== R || n !== N || x !== X) bad.push(`${tag}: a self-check failed (${u.checks.join(',')})`); }
    for (const a of ARMS) if (!u.xas[a] || !(u.xas[a].step >= 0) || !(u.xas[a].spread >= 0)) bad.push(`${tag}: ${a}'s xas lines missing`);
    if (u.id === 'S126' && ARMS.some(a => !u.swap[a] || !(u.open[a] >= 0))) bad.push(`${tag}: the opening or swap lines missing`);
  }
  return bad;
}

export const stampOf = text => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
// a per-read file against its unit's lines, and THE IDENTITY against COV-B-STEP's file of the same household
export function checkFile(t, u, st, C, npw = NPW) {
  const tag = `${u.id} file`;
  if (!t) return [`${tag}: missing`];
  const bad = [];
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.id !== u.id || t.npw !== npw) bad.push(`${tag}: id ${t.id} paths a world ${t.npw}, not the unit's`);
  const n = t.t ? t.t.length : -1;
  if (![t.p, t.k, t.kind, t.top, t.strad, t.exS].every(x => Array.isArray(x) && x.length === n)) bad.push(`${tag}: its read columns are missing or of unequal length`);
  for (const a of ARMS) {
    const A = t.arms && t.arms[a];
    if (!A || ['read', 'ex5', 'exF', 'claim'].some(q => !Array.isArray(A[q]) || A[q].length !== n)) { bad.push(`${tag}: ${a}'s reads missing or of the wrong length`); continue; }
    const st1 = t.kind.filter(x => x === 1).length;
    if (u.xas[a] && (u.xas[a].step !== st1 || u.xas[a].spread !== n - st1)) bad.push(`${tag}: ${a}'s step and spread counts ${st1}/${n - st1}, the xas lines ${u.xas[a].step}/${u.xas[a].spread}`);
  }
  // THE IDENTITY: the same reads as COV-B-STEP's (read for read: year, world, kind, and BASE's and COV's read and claim)
  const F = C && C.fixed;
  if (!F || !Array.isArray(F.t)) bad.push(`${tag}: COV-B-STEP's file for ${u.id} missing`);
  else if (F.t.length !== n) bad.push(`${tag}: ${n} reads, COV-B-STEP's ${F.t.length}`);
  else {
    let off = 0;
    for (let j = 0; j < n; j++) {
      if (F.t[j] !== t.t[j] || F.k[j] !== t.k[j] || F.kind[j] !== t.kind[j]) { off++; continue; }
      for (const a of ARMS) if (Math.abs(F.arms[a].read[j] - t.arms[a].read[j]) > 2e-9 || Math.abs(F.arms[a].claim[j] - t.arms[a].claim[j]) > 2e-9) { off++; break; }
    }
    if (off) bad.push(`${tag}: ${off} reads differ from COV-B-STEP's (the identity)`);
  }
  return bad;
}
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const sdOf = xs => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1)) : NaN; };
// the reads a selection picks, as [j]; per path (world and path index) sums of f
const sel = (t, f) => t.t.map((_, j) => j).filter(j => f(j));
export function perPath(t, J, f) { const m = new Map(); for (const j of J) { const key = t.k[j] * 1e6 + t.p[j]; m.set(key, (m.get(key) || 0) + f(j)); } return [...m.values()]; }
// THE DRAW: mean(exF - claim) within DRAW_Z se, per household, arm and kind (a path's reads summed: reads within a path share it)
export function drawCheck(files) {
  const bad = [];
  for (const id of UNITS) {
    const t = files[id]; if (!t) continue;
    for (const a of ARMS) for (const kind of [1, 0]) {
      const J = sel(t, j => t.kind[j] === kind); if (!J.length) continue;
      const A = t.arms[a], y = perPath(t, J, j => A.exF[j] - A.claim[j]), m = mean(y), se = sdOf(y) / Math.sqrt(y.length);
      if (!(Math.abs(m) <= DRAW_Z * se + 1e-12)) bad.push(`${id} ${a} ${kind ? 'step' : 'spread'}: mean(exF - claim) ${m.toExponential(3)} a path, ${(m / se).toFixed(1)} se (the one-step value is not the forward run's expectation)`);
    }
  }
  return bad;
}
// the realised per-path sd of y and the |mean y| the item shows at 80% power after its Holm (normal approximation: z 1.96
// + 0.8416 over 2 tests one-sided, 2.2414 + 0.8416 over 4), so a SPLIT is read against the test's achieved power (the
// plan-auditor's BLOCKING 1 of 5 Oct 10:09 UK: sd(y) is not bounded by sd(D)). A SPLIT is CLOSE (the two terms within a
// fifth of the error they split) only where that detectable size is at most a fifth of |mean D| over the same paths;
// otherwise WEAK - the test could not have told a gap of that size (the plan-auditor's BLOCKING 1 of 5 Oct 10:17 UK)
const Z2 = 1.96 + 0.8416, Z4 = 2.2414 + 0.8416;
export const detect = (y, z) => { const s = sdOf(y); return { sd: s, mdd: z * s / Math.sqrt(y.length) }; };
export const splitKind = (y, d, z) => (detect(y, z).mdd <= Math.abs(mean(d)) / 5 ? 'CLOSE' : 'WEAK');
const stepYears = t => [...new Set(t.t.filter((_, j) => t.kind[j] === 1))];
export function items(files) {
  const rq = (t, a) => j => { const A = t.arms[a]; return (A.read[j] - A.ex5[j]) - (A.ex5[j] - A.exF[j]); };
  // ITEM 1: COV, S370, the years before each step
  const S = files.S370, before = new Set(stepYears(S).map(x => x - 1));
  const y1 = perPath(S, sel(S, j => before.has(S.t[j]) && S.kind[j] === 0), rq(S, 'COV'));
  const h1 = holm([flipP(y1, B, 7002), flipP(y1.map(x => -x), B, 7003)]);
  const r1 = h1[0] < ALPHA ? 'REP' : h1[1] < ALPHA ? 'QUAD' : 'SPLIT';
  const J1 = sel(S, j => before.has(S.t[j]) && S.kind[j] === 0), d1 = perPath(S, J1, j => S.arms.COV.read[j] - S.arms.COV.claim[j]);
  const one = { y: y1, d: d1, h: h1, read: r1, split: r1 === 'SPLIT' ? splitKind(y1, d1, Z2) : null, v: r1 === 'REP' ? 'HELD' : r1 === 'QUAD' ? 'FALSIFIED' : 'INCONCLUSIVE', years: [...before].sort((a, b) => a - b) };
  // ITEM 2: BASE, the step years, S370 and S130
  const ids = ['S370', 'S130'], ys = ids.map(id => { const t = files[id]; return perPath(t, sel(t, j => t.kind[j] === 1), rq(t, 'BASE')); });
  const h2 = holm(ys.flatMap(y => [flipP(y, B, 7002), flipP(y.map(x => -x), B, 7003)]));
  const r2 = ids.map((_, i) => (h2[2 * i] < ALPHA ? 'REP' : h2[2 * i + 1] < ALPHA ? 'QUAD' : 'SPLIT'));
  const ds = ids.map(id => { const t = files[id]; return perPath(t, sel(t, j => t.kind[j] === 1), j => t.arms.BASE.read[j] - t.arms.BASE.claim[j]); });
  const splits = r2.map((x, i) => (x === 'SPLIT' ? splitKind(ys[i], ds[i], Z4) : null));
  const two = { ys, ds, h: h2, reads: r2, splits, split: splits.includes('WEAK') ? 'WEAK' : splits.includes('CLOSE') ? 'CLOSE' : null, v: r2.every(x => x === 'REP') ? 'HELD' : r2.some(x => x === 'QUAD') ? 'FALSIFIED' : 'INCONCLUSIVE' };
  return { one, two };
}
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');
export function reading(files, units, out = console.log) {
  const R = items(files);
  out('\nTHE SPLIT: read - claim = rep (read - ex5) + quad (ex5 - exF) + draw (exF - claim), means over reads');
  for (const id of UNITS) {
    const t = files[id];
    for (const a of ARMS) for (const yr of [...new Set(t.t)].sort((p, q) => p - q)) {
      const J = sel(t, j => t.t[j] === yr), A = t.arms[a], m = f => mean(J.map(f));
      out(`  ${id.padEnd(9)} ${a.padEnd(4)} year ${yr} ${t.kind[J[0]] ? 'step  ' : 'spread'}: reads ${J.length} D ${f4(m(j => A.read[j] - A.claim[j]))} rep ${f4(m(j => A.read[j] - A.ex5[j]))} quad ${f4(m(j => A.ex5[j] - A.exF[j]))} draw ${f4(m(j => A.exF[j] - A.claim[j]))}${a === 'BASE' ? ` quadS ${f4(mean(J.filter(j => t.exS[j] !== null).map(j => A.ex5[j] - t.exS[j])))} (${J.filter(j => t.exS[j] !== null).length} with a step next year)` : ''}`);
    }
  }
  out('\nBY WORLD, TOP CELL AND STRADDLE (step and year-before reads; rep and quad means)');
  for (const id of UNITS) {
    const t = files[id], before = new Set(stepYears(t).map(x => x - 1));
    for (const a of ARMS) for (const [nm, f] of [['step', j => t.kind[j] === 1], ['before', j => before.has(t.t[j]) && t.kind[j] === 0]]) {
      const parts = [];
      for (const k of [0, 1, 2]) for (const [lab, g] of [['top', j => t.top[j] === 1], ['inner', j => t.top[j] === 0], ['straddle', j => t.strad[j] === 1]]) {
        const J = sel(t, j => f(j) && t.k[j] === k && g(j)); if (!J.length) continue;
        const A = t.arms[a]; parts.push(`w${k} ${lab} ${J.length}: rep ${f4(mean(J.map(j => A.read[j] - A.ex5[j])))} quad ${f4(mean(J.map(j => A.ex5[j] - A.exF[j])))}`);
      }
      if (parts.length) out(`  ${id.padEnd(9)} ${a.padEnd(4)} ${nm.padEnd(6)}: ${parts.join('; ')}`);
    }
  }
  const u126 = units.find(u => u.id === 'S126'), t126 = files.S126;
  if (u126 && t126 && t126.swap) {
    out('\nS126\'S OPENING (reported)');
    out(`  year-0 moves BASE ${u126.open.BASE} COV ${u126.open.COV}${u126.open.BASE === u126.open.COV ? ' (the same)' : ''}`);
    for (const a of ARMS) {
      const s = t126.swap[a]; let b = 0, c = 0; for (let j = 0; j < s.own.length; j++) { if (s.own[j] && !s.swapped[j]) b++; if (!s.own[j] && s.swapped[j]) c++; }
      out(`  ${a} with the other arm's opening: survived ${u126.swap[a].own} to ${u126.swap[a].swapped} of ${u126.swap[a].paths} (b ${b} lost, c ${c} saved)`);
    }
  }
  out(`\nITEM 1 (primary): COV on S370 in the years before each step (${R.one.years.join(', ')}), per path y = rep - quad: mean ${f4(mean(R.one.y))} over ${R.one.y.length} paths (sd ${f4(detect(R.one.y, Z2).sd)}, detectable ${f4(detect(R.one.y, Z2).mdd)} at 80% power); Holm p (REP, QUAD) ${R.one.h.map(x => x.toFixed(4)).join(', ')} -> ${R.one.read}${R.one.split ? ` (${R.one.split}: detectable ${f4(detect(R.one.y, Z2).mdd)} against a fifth of |mean D| ${f4(Math.abs(mean(R.one.d)) / 5)})` : ''} -> item 1 ${R.one.v}${R.one.split ? ` (${R.one.split})` : ''}`);
  out(`ITEM 2: BASE at the step years, per path y = rep - quad: ${['S370', 'S130'].map((id, i) => `${id} mean ${f4(mean(R.two.ys[i]))} over ${R.two.ys[i].length} paths (sd ${f4(detect(R.two.ys[i], Z4).sd)}, detectable ${f4(detect(R.two.ys[i], Z4).mdd)}), Holm p ${R.two.h[2 * i].toFixed(4)}/${R.two.h[2 * i + 1].toFixed(4)} ${R.two.reads[i]}${R.two.splits[i] ? ` ${R.two.splits[i]} (a fifth of |mean D| ${f4(Math.abs(mean(R.two.ds[i])) / 5)})` : ''}`).join('; ')} -> item 2 ${R.two.v}${R.two.v === 'INCONCLUSIVE' && R.two.split ? ` (${R.two.split})` : ''}`);
  return R;
}

// ---- planted checks: built logs and files ----
const NB = 4, WEAK = 0.012, ST = { code: 'c0', audit: 'a0', prediction: PRED, sha: 's0' };
function builtLog(o = {}) {
  const lines = [`stamp: code c0 audit a0 prediction ${PRED} sha s0`];
  for (const id of UNITS) {
    if (o.skip === id) continue;
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979 tier own riskAbove auto mix 3 | arms BASE,COV`);
    lines.push(`${''.padEnd(16)} solve BASE: secs 1 pts 30 shares 6 readerYears 2 readerTax ${o.taxInBase ? '1:5' : '-'} coverage -`);
    lines.push(`${''.padEnd(16)} solve COV: secs 1 pts 30 shares 7 readerYears 2 readerTax 1:5 coverage ${o.covOff ? '-' : '1/2'}`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed ${o.seedOff ? 7005 : SEED} paths ${3 * NB} worlds 3 steps 2,4 readerYears 1,2,3,4 nf ${NF} access 5 years 30`);
    const f = built(id, o), st = f.kind.filter(x => x === 1).length, n = f.t.length;
    for (const a of ARMS) { lines.push(`${''.padEnd(16)} xas ${a} step: reads ${st} rep 0 quad 0 D 0 D5 0 secs 1`); lines.push(`${''.padEnd(16)} xas ${a} spread: reads ${n - st} rep 0 quad 0 D 0 D5 0 secs 1`); }
    lines.push(`${''.padEnd(16)} checks: rates ${o.ratesBad ? '9/10' : '10/10'} nodes ${o.nodesNone ? '0/0' : o.nodesBad ? '9/10' : '10/10'} mix 5/5`);
    if (id === 'S126') { for (const a of ARMS) lines.push(`${''.padEnd(16)} open ${a}: move ${a === 'BASE' ? 3 : 4} scores x`); for (const a of ARMS) lines.push(`${''.padEnd(16)} swap ${a}: paths ${3 * NB} survived 10 with ${a === 'BASE' ? 'COV' : 'BASE'}'s opening 9`); }
    if (!(o.notDone && id === 'S130')) lines.push(`${''.padEnd(16)} done ${L} rss 1MB`);
  }
  return lines.join('\n');
}
// a built household: per world 4 paths; reads at years 1 (spread), 2 (step), 3 (spread), 4 (step) on every path; draws
// symmetric (+-0.01 alternately by path); o.c1 / o.c2: per-household [rep, quad] for COV's year-before reads (years 1 and 3)
// and BASE's step reads
function built(id, o = {}) {
  const t = { stamp: o.stOff && id === 'S370' ? { ...ST, audit: 'zz' } : ST, id, npw: NB, p: [], t: [], k: [], kind: [], top: [], strad: [], exS: [], arms: { BASE: { read: [], ex5: [], exF: [], claim: [] }, COV: { read: [], ex5: [], exF: [], claim: [] } } };
  const c1 = (o.c1 || {})[id] || [0.01, 0.001], c2 = (o.c2 || {})[id] || [0.02, 0.002];
  let row = 0;
  for (let k = 0; k < 3; k++) for (let p = 0; p < NB; p++) for (const yr of [1, 2, 3, 4]) {
    const step = yr % 2 === 0, draw = (p % 2 ? 0.01 : -0.01) + (o.drawOff && id === 'S130' ? 0.05 : 0);
    t.p.push(p); t.t.push(yr); t.k.push(k); t.kind.push(step ? 1 : 0); t.top.push(p % 2); t.strad.push(step ? 0 : 1); t.exS.push(step ? null : 0.5);
    for (const a of ARMS) {
      const [rep, quad] = a === 'COV' && !step ? c1 : a === 'BASE' && step ? c2 : [0, 0], noise = (o.noisy && a === 'COV' && !step && id === 'S370') ? ((p % 2) ? 0.03 : -0.03) : 0;
      const exF = 0.5, ex5 = exF + quad + noise, read = ex5 + rep;
      const A = t.arms[a]; A.read.push(read); A.ex5.push(ex5); A.exF.push(exF); A.claim.push(exF - draw);
    }
    row++;
  }
  if (o.lenOff && id === 'bridge 4') t.arms.COV.ex5.pop();
  return t;
}
const builtFiles = (o = {}) => Object.fromEntries(UNITS.map(id => [id, built(id, o)]));
const covbOf = (o = {}) => Object.fromEntries(UNITS.map(id => { const b = built(id, o); return [id, { fixed: { t: b.t.slice(), k: b.k.slice(), kind: b.kind.slice(), arms: Object.fromEntries(ARMS.map(a => [a, { read: b.arms[a].read.map((x, j) => x + (o.identOff && id === 'S126' && a === 'COV' && j === 0 ? 1e-6 : 0)), claim: b.arms[a].claim.slice() }])) } }]; }));
const EDGES = [], REACHED = { 1: new Set(), 2: new Set() };
function planted() {
  const cases = [];
  const G = o => { const us = parse(builtLog(o)); const g = gate(us, { npw: NB }); if (g.length) return g; const fs = builtFiles(o), C = covbOf(o); if (o.missing) fs.S126 = null; return [...us.flatMap(u => checkFile(fs[u.id], u, ST, C[u.id], NB)), ...drawCheck(Object.fromEntries(Object.entries(fs).filter(([, v]) => v)))]; };
  cases.push(['a built set gates clean', String(G({}).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'S126' }], ['a household not done', { notDone: true }], ['BASE with the reader\'s tax', { taxInBase: true }], ['COV without coverage', { covOff: true }],
    ['another seed', { seedOff: true }], ['a failed self-check', { ratesBad: true }], ['a failed 5-point self-check', { nodesBad: true }], ['a missing file', { missing: true }], ['a self-check run on nothing', { nodesNone: true }], ['a file with another stamp', { stOff: true }],
    ['a read column of the wrong length', { lenOff: true }], ['a read off COV-B-STEP\'s (the identity)', { identOff: true }], ['a draw off its expectation', { drawOff: true }]]) cases.push([`the gate refuses ${nm}`, String(G(o).length > 0), 'true']);
  EDGES.push('a self-check run on nothing'); EDGES.push('a read 1e-6 off COV-B-STEP\'s');
  const us = parse(builtLog({}));
  const Rd = o => { const r = reading(builtFiles(o), us, () => {}); REACHED[1].add(r.one.v); REACHED[2].add(r.two.v); return r; };
  // the defaults: rep 0.01 against quad 0.001 (COV, years before) and 0.02 against 0.002 (BASE, steps) on every path -> REP both
  { const r = Rd({}); cases.push(['rep above quad everywhere reads items 1 and 2 HELD', `${r.one.v} ${r.two.v}`, 'HELD HELD']); }
  cases.push(['quad above rep on S370\'s years before reads item 1 FALSIFIED', Rd({ c1: { S370: [0.001, 0.01] } }).one.v, 'FALSIFIED']);
  { const r = Rd({ c1: { S370: [0.005, 0.005] } }); cases.push(['rep equal to quad on S370\'s years before reads item 1 INCONCLUSIVE, CLOSE', `${r.one.v} ${r.one.split}`, 'INCONCLUSIVE CLOSE']); } EDGES.push('rep equal to quad on every path (y = 0)');
  { const r = Rd({ c1: { S370: [0.001, 0] }, noisy: true }); cases.push(['a noisy split on S370 reads item 1 INCONCLUSIVE, WEAK (detectable above a fifth of D)', `${r.one.v} ${r.one.split}`, 'INCONCLUSIVE WEAK']); } EDGES.push('a SPLIT whose detectable size exceeds a fifth of D (WEAK)');
  { const r = Rd({ c2: { S370: [0.01, 0.01] } }); cases.push(['rep equal to quad at S370\'s steps reads item 2 CLOSE on S370', `${r.two.splits[0]}`, 'CLOSE']); }
  cases.push(['a weak split on S370 (Holm p between 0.05 and 0.5) reads item 1 INCONCLUSIVE', Rd({ c1: { S370: [WEAK, 0] }, noisy: true }).one.v, 'INCONCLUSIVE']); EDGES.push('a split shown alone but not at the 0.05 line');
  cases.push(['quad above rep at S130\'s steps reads item 2 FALSIFIED', Rd({ c2: { S130: [0.002, 0.02] } }).two.v, 'FALSIFIED']);
  cases.push(['rep equal to quad at S370\'s steps reads item 2 INCONCLUSIVE', Rd({ c2: { S370: [0.01, 0.01] } }).two.v, 'INCONCLUSIVE']);
  cases.push(['the other households\' splits do not move item 1', Rd({ c1: { S130: [0.001, 0.01], 'bridge 4': [0.001, 0.01] } }).one.v, 'HELD']); EDGES.push('a split on a household the item does not read');
  // the detectable size: y of +-1 on 4 paths has sd 1.1547 and, over 2 tests, |mean y| 2.8016 x 1.1547 / 2 detectable
  { const d = detect([1, -1, 1, -1], Z2); cases.push(['the detectable size of y = +-1 on 4 paths', `${d.sd.toFixed(4)} ${d.mdd.toFixed(4)}`, '1.1547 1.6175']); } EDGES.push('the detectable size on a balanced y');
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export { builtLog, built, logsOf };
const readGz = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
// COV-B-STEP's files through their own gate first (rule 3)
export function covbFiles(dir = join(HERE, 'results', 'diagcovb')) {
  const logs = logsOf(dir), units = Object.values(logs).flatMap(parseC);
  requireFairLogs(logs, PREDC);
  const bad = gateC(units), tr = bad.length ? { bad: [], files: {} } : loadC(units, dir, stampC(Object.values(logs)[0]));
  return { bad: [...bad, ...tr.bad], files: tr.files };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2].map(k => `OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagxas'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (units.filter(u => u.done).length < UNITS.length) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} households done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw }), files = {};
  const C = bad.length ? null : covbFiles();
  if (C && C.bad.length) bad.push(...C.bad.map(x => `COV-B-STEP's own gate: ${x}`));
  if (!bad.length) {
    const st = stampOf(Object.values(logs)[0]);
    for (const u of units) { const t = readGz(join(DIR, fileOf(u.id))); bad.push(...checkFile(t, u, st, C.files[u.id], npw)); files[u.id] = t; }
    if (!bad.length) bad.push(...drawCheck(files));
  }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${UNITS.length} households, each once and done with BASE and COV at COV-B-STEP's unit (seed ${SEED}, ${pts} points, ${3 * npw} paths, ${NF} fine points); every self-check passed on something; every file stamped as the logs; the reads equal COV-B-STEP's read for read (its own gate passed first); the draw within ${DRAW_Z} se of 0 on every household, arm and kind`);
  reading(files, units);
}
