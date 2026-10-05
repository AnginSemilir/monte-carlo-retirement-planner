/*
 * XAS-R'S REDUCER (PLAN.md XAS-R; predictions/diag-xasr.md). Reads results/diagxasr (audit-xasr.mjs: S370, bridge 4 and
 * S126) and, behind the gate, decides:
 *   ITEM 1 (primary; YB-COPY against YB-GRID): COV's reads on S370 in each year before a step (years 2 and 6), per path
 *     D = the sum over the year's reads of (read - va) (what the supported edge node removes) and P = the sum of
 *     (read - ex5) (the representation error XAS measured); the share s = sum D / sum P. Two one-sided paired sign-flip
 *     tests a year (reduce-7ar.mjs flipP, B 20,000 from fixed seeds): LO, mean(D - 0.3 P) above 0 (s above 0.3), and HI,
 *     mean(0.6 P - D) above 0 (s below 0.6); Holm over the four. A year reads COPY when LO shows and s >= 0.6, GRID when
 *     HI shows and s <= 0.3, else MID. HELD (YB-COPY) when both years read COPY, FALSIFIED (YB-GRID) when both read GRID,
 *     else INCONCLUSIVE.
 *   ITEM 2 (S126-BLEND): S126's opening scores, each arm's mixture score of BASE's and COV's opening moves split into
 *     survival, resilience, bequest and shortfall; per move the rise COV less BASE and q = the part of the score's rise the
 *     three reads without a reader construct carry, (resilience rise + bequest rise - shortfall rise) over the score's rise. Exact arithmetic at one state, no sampling: HELD when q >= 0.8 on both moves,
 *     FALSIFIED when q <= 0.5 on both, else INCONCLUSIVE.
 *   THE GATE (NOT SETTLED if any fails): the stamps; a household missing, repeated or not done; an arm's settings not
 *     taking; a ran line off XAS's unit; a self-check failed or run on nothing; a per-read file missing, unstamped or short;
 *     a read unclassed for the top cell; XAS's files failing their own gate (reduce-xas.mjs, with COV-B-STEP's under it);
 *     a read or ex5 off XAS's at the same path, world and year, or a different count of reads; S126's opening moves or
 *     BASE's opening score off XAS's; and THE BASE GUARD: under BASE, (v-a)'s mean (va - ex5) in either year above
 *     GUARD (the construct adding optimism where there is none to remove).
 *   REPORTED, deciding nothing: (v-b)'s share overall and by the 0.9 node's support (the review's corroboration: under
 *     YB-GRID within 0.15 of (v-a)'s whatever the support); the plain read's share; each read's pass-through slope of
 *     COV's step-year correction (COV less BASE, the read on ex5) and the share of the gap to 0.93 it closes; bridge 4 the
 *     same; the share of the read weight (v-a) applied to.
 *   node research/solver/reduce-xasr.mjs [dir] [paths a world] [points] > research/solver/results-xasr.txt
 *   node research/solver/reduce-xasr.mjs --planted   the planted checks alone, the outcomes they reach and the EDGES
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { parse as parseX, gate as gateX, checkFile as checkX, drawCheck as drawX, covbFiles, logsOf, stampOf as stampX, PRED as PREDX } from './reduce-xas.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-xasr.md';
export const PTS = '30', SEED = '7002', NPW = 2000, B = 20000, ALPHA = 0.05;
export const LO = 0.3, HI = 0.6, Q_HELD = 0.8, Q_FALS = 0.5, GUARD = 5e-3, VB_NEAR = 0.15, SLOPE_REF = 0.93;
export const UNITS = ['S370', 'bridge 4', 'S126'], READ_UNITS = ['S370', 'bridge 4'], ARMS = ['BASE', 'COV'];
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const L = 'READER/TS+J/W0.02/PCLSI';
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`);
const CASEL = /^(\S.*?)\s+case \| unit (\S+) \| /;
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');
const f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), unit: m[2], solve: {}, xasr: {}, terms: {}, open: {}, done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = /^\s+solve (BASE|COV): (.*)$/.exec(line))) cur.solve[m[1]] = m[2];
    else if ((m = new RegExp(`^\\s+ran ${esc(L)}: (.*)$`).exec(line))) cur.ran = m[1];
    else if ((m = /^\s+xasr (BASE|COV): reads (\d+) top (\d+) /.exec(line))) cur.xasr[m[1]] = { reads: Number(m[2]), top: Number(m[3]) };
    else if ((m = /^\s+checks: replica (\d+)\/(\d+) nodes (\d+)\/(\d+) cr (\d+)\/(\d+) top (\d+)\/(\d+)$/.exec(line))) cur.checks = m.slice(1).map(Number);
    else if ((m = /^\s+checks: terms (\d+)\/4$/.exec(line))) cur.termsOk = Number(m[1]);
    else if ((m = /^\s+terms (BASE|COV) (BASE-move|COV-move) (\d+): score (\S+) surv (\S+) resil (\S+) beq (\S+) short (\S+)$/.exec(line))) cur.terms[`${m[1]} ${m[2]}`] = { ai: Number(m[3]), score: Number(m[4]), surv: Number(m[5]), resil: Number(m[6]), beq: Number(m[7]), short: Number(m[8]) };
    else if ((m = /^\s+open (BASE|COV): move (\d+)$/.exec(line))) cur.open[m[1]] = Number(m[2]);
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
    const want = { mix: '3', pts, seed: SEED, paths: String(3 * npw), worlds: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (READ_UNITS.includes(u.id)) {
      if (!u.checks) bad.push(`${tag}: no checks line`);
      else { const c = u.checks; if (!(c[1] > 0 && c[3] > 0 && c[5] > 0 && c[7] > 0)) bad.push(`${tag}: a self-check ran on nothing`); if (c[0] !== c[1] || c[2] !== c[3] || c[4] !== c[5] || c[6] !== c[7]) bad.push(`${tag}: a self-check failed (${c.join(',')})`); }
      for (const a of ARMS) if (!u.xasr[a] || !(u.xasr[a].reads > 0)) bad.push(`${tag}: ${a}'s xasr line missing or on no reads`);
    } else {
      if (u.termsOk !== 4) bad.push(`${tag}: the terms check missing or failed`);
      if (Object.keys(u.terms).length !== 4 || ARMS.some(a => !(u.open[a] >= 0))) bad.push(`${tag}: the terms or open lines missing`);
    }
  }
  return bad;
}
export const stampOf = text => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
const COLS = ['read', 'ex5', 'rr', 'plain', 'va', 'vb', 'vaw', 'vbs'];
// one household's file against its log lines and against XAS's file for the same household (the identity)
export function checkFile(t, u, st, X, npw = NPW) {
  const tag = `${u.id} file`;
  if (!t) return [`${tag}: missing`];
  const bad = [];
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.id !== u.id || t.npw !== npw) bad.push(`${tag}: id ${t.id} paths a world ${t.npw}, not the unit's`);
  if (!READ_UNITS.includes(u.id)) return bad;
  const n = t.t ? t.t.length : -1;
  if (![t.p, t.k, t.top].every(x => Array.isArray(x) && x.length === n) || !(n > 0)) { bad.push(`${tag}: its read columns are missing, empty or of unequal length`); return bad; }
  if (t.top.some(x => x !== 0 && x !== 1)) bad.push(`${tag}: ${t.top.filter(x => x !== 0 && x !== 1).length} reads unclassed for the top cell`);
  for (const a of ARMS) {
    const A = t.arms && t.arms[a];
    if (!A || COLS.some(q => !Array.isArray(A[q]) || A[q].length !== n)) { bad.push(`${tag}: ${a}'s reads missing or of the wrong length`); continue; }
    if (u.xasr[a] && u.xasr[a].reads !== n) bad.push(`${tag}: ${a}'s ${n} reads, the xasr line ${u.xasr[a].reads}`);
  }
  if (bad.length) return bad;
  // THE IDENTITY: every read and ex5 is XAS's at the same path, world and year, and XAS has no other read in those years
  if (!X || !Array.isArray(X.t)) { bad.push(`${tag}: XAS's file for ${u.id} missing`); return bad; }
  const key = (k, p, y) => (k * 1e6 + p) * 100 + y, at = new Map(), years = new Set(t.t);
  X.t.forEach((y, j) => { if (years.has(y)) at.set(key(X.k[j], X.p[j], y), j); });
  if (at.size !== n) bad.push(`${tag}: ${n} reads, XAS's ${at.size} in years ${[...years].join(', ')}`);
  let off = 0;
  for (let j = 0; j < n; j++) {
    const i = at.get(key(t.k[j], t.p[j], t.t[j]));
    if (i === undefined) { off++; continue; }
    for (const a of ARMS) if (Math.abs(X.arms[a].read[i] - t.arms[a].read[j]) > 2e-9 || Math.abs(X.arms[a].ex5[i] - t.arms[a].ex5[j]) > 2e-9) { off++; break; }
  }
  if (off) bad.push(`${tag}: ${off} reads differ from XAS's (the identity)`);
  return bad;
}
// S126: the opening moves and BASE's score of its own move as XAS printed them
export function openCheck(u, xu) {
  if (!u || !xu) return ['S126: XAS\'s or XAS-R\'s S126 unit missing'];
  const bad = [];
  for (const a of ARMS) if (u.open[a] !== xu.open[a]) bad.push(`S126: ${a}'s opening move ${u.open[a]}, XAS's ${xu.open[a]}`);
  const tb = u.terms['BASE BASE-move'];
  if (!tb || !(Math.abs(tb.score - xu.scoreBase) <= 1e-4)) bad.push(`S126: BASE's score of its own opening ${tb ? tb.score : '-'}, XAS's ${xu.scoreBase}`);
  return bad;
}
// THE BASE GUARD: (v-a) adds no optimism under BASE (mean va - ex5 per year at most GUARD)
export function guard(files) {
  const t = files.S370, bad = [];
  for (const y of [...new Set(t.t)].sort((a, b) => a - b)) {
    const J = t.t.map((_, j) => j).filter(j => t.t[j] === y), A = t.arms.BASE, m = mean(J.map(j => A.va[j] - A.ex5[j]));
    if (!(m <= GUARD + 1e-12)) bad.push(`the BASE guard: S370 year ${y} BASE's mean (va - ex5) ${f4(m)} above ${GUARD}`);
  }
  return bad;
}
export function perPath(t, J, f) { const m = new Map(); for (const j of J) { const key = t.k[j] * 1e6 + t.p[j]; m.set(key, (m.get(key) || 0) + f(j)); } return [...m.values()]; }
const sel = (t, f) => t.t.map((_, j) => j).filter(f);
// a share of the representation error a read removes: sum(read - x) / sum(read - ex5) over the reads J, arm a
const shareOf = (t, J, a, x) => { const A = t.arms[a]; let d = 0, p = 0; for (const j of J) { d += A.read[j] - A[x][j]; p += A.read[j] - A.ex5[j]; } return p !== 0 ? d / p : NaN; };
export function items(files, units) {
  const S = files.S370, A = S.arms.COV, years = [...new Set(S.t)].sort((a, b) => a - b);
  const per = years.map(y => {
    const J = sel(S, j => S.t[j] === y);
    const D = perPath(S, J, j => A.read[j] - A.va[j]), P = perPath(S, J, j => A.read[j] - A.ex5[j]);
    const s = D.reduce((q, x) => q + x, 0) / P.reduce((q, x) => q + x, 0);
    return { y, n: D.length, s, lo: D.map((d, i) => d - LO * P[i]), hi: D.map((d, i) => HI * P[i] - d) };
  });
  const h = holm(per.flatMap((r, i) => [flipP(r.lo, B, 7002 + 2 * i), flipP(r.hi, B, 7003 + 2 * i)]));
  per.forEach((r, i) => { r.pLo = h[2 * i]; r.pHi = h[2 * i + 1]; r.read = r.pLo < ALPHA && r.s >= HI ? 'COPY' : r.pHi < ALPHA && r.s <= LO ? 'GRID' : 'MID'; });
  const one = { per, v: per.length && per.every(r => r.read === 'COPY') ? 'HELD' : per.length && per.every(r => r.read === 'GRID') ? 'FALSIFIED' : 'INCONCLUSIVE' };
  const u = units.find(x => x.id === 'S126'), mv = ['BASE-move', 'COV-move'].map(lab => {
    const b = u.terms[`BASE ${lab}`], c = u.terms[`COV ${lab}`], d = k => c[k] - b[k];
    return { lab, dScore: d('score'), dSurv: d('surv'), dResil: d('resil'), dBeq: d('beq'), dShort: d('short'), q: (d('resil') + d('beq') - d('short')) / d('score') };
  });
  const two = { mv, v: mv.every(x => x.q >= Q_HELD) ? 'HELD' : mv.every(x => x.q <= Q_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE' };
  return { one, two };
}
// the pass-through slope of COV's correction over the reads J: (COV less BASE) of read x on (COV less BASE) of ex5
function slope(t, J, x) {
  const B_ = t.arms.BASE, C = t.arms.COV, xs = J.map(j => C.ex5[j] - B_.ex5[j]), ys = J.map(j => C[x][j] - B_[x][j]), mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0; for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  return sxx > 0 ? sxy / sxx : NaN;
}
export function reading(files, units, out = console.log) {
  const R = items(files, units);
  out('\nTHE YEAR-BEFORE READS (means over reads: rep = read - ex5; each construct\'s own error and the share of rep it removes)');
  for (const id of READ_UNITS) {
    const t = files[id];
    for (const a of ARMS) for (const y of [...new Set(t.t)].sort((p, q) => p - q)) {
      const J = sel(t, j => t.t[j] === y), T = J.filter(j => t.top[j] === 1), A = t.arms[a], m = (f, K = J) => mean(K.map(f));
      out(`  ${id.padEnd(9)} ${a.padEnd(4)} year ${y}: reads ${J.length} (top cell ${T.length}) rep ${f4(m(j => A.read[j] - A.ex5[j]))}; va ${f4(m(j => A.va[j] - A.ex5[j]))} removes ${f3(shareOf(t, J, a, 'va'))} (applied on ${f3(m(j => A.vaw[j], T))} of the top reads' weight); vb ${f4(m(j => A.vb[j] - A.ex5[j]))} removes ${f3(shareOf(t, J, a, 'vb'))}; plain ${f4(m(j => A.plain[j] - A.ex5[j]))}`);
    }
  }
  out('\n(v-b) BY THE 0.9 NODE\'S SUPPORT (COV; reported: under YB-GRID it removes about what (v-a) does whatever the support, under YB-COPY mainly where the node is supported)');
  for (const id of READ_UNITS) {
    const t = files[id];
    for (const y of [...new Set(t.t)].sort((p, q) => p - q)) {
      const J = sel(t, j => t.t[j] === y && t.top[j] === 1), sup = J.filter(j => t.arms.COV.vbs[j] >= 0.5), uns = J.filter(j => t.arms.COV.vbs[j] < 0.5);
      const sa = shareOf(t, J, 'COV', 'va'), sb = shareOf(t, J, 'COV', 'vb');
      out(`  ${id.padEnd(9)} year ${y} top reads ${J.length}: va removes ${f3(sa)}, vb ${f3(sb)} (${Math.abs(sa - sb) <= VB_NEAR ? 'within' : 'not within'} ${VB_NEAR}); vb on supported ${sup.length} ${f3(shareOf(t, sup, 'COV', 'vb'))}, on unsupported ${uns.length} ${f3(shareOf(t, uns, 'COV', 'vb'))}`);
    }
  }
  out(`\nPASS-THROUGH (COV less BASE: each read on ex5; the share of the gap to ${SLOPE_REF} closed = (slope - the reader's) / (${SLOPE_REF} - the reader's))`);
  for (const id of READ_UNITS) {
    const t = files[id];
    for (const y of [...new Set(t.t)].sort((p, q) => p - q)) {
      const J = sel(t, j => t.t[j] === y), r0 = slope(t, J, 'read'), g = x => (Number.isFinite(x) ? ((x - r0) / (SLOPE_REF - r0)).toFixed(2) : '-');
      out(`  ${id.padEnd(9)} year ${y}: reader ${f3(r0)}; va ${f3(slope(t, J, 'va'))} (closes ${g(slope(t, J, 'va'))}); vb ${f3(slope(t, J, 'vb'))} (closes ${g(slope(t, J, 'vb'))}); plain ${f3(slope(t, J, 'plain'))}`);
    }
  }
  out('\nS126\'S OPENING SCORES BY TERM (each arm\'s mixture score of each opening move; score = surv + resil + beq - short)');
  const u = units.find(x => x.id === 'S126');
  for (const [k, o] of Object.entries(u.terms)) out(`  ${k.padEnd(18)} move ${o.ai}: score ${f4(o.score)} surv ${f4(o.surv)} resil ${f4(o.resil)} beq ${f4(o.beq)} short ${f4(o.short)}`);
  out(`\nITEM 1 (primary): COV on S370, the share of rep (v-a) removes, per year: ${R.one.per.map(r => `year ${r.y} s ${f3(r.s)} over ${r.n} paths, Holm p LO ${r.pLo.toFixed(4)} HI ${r.pHi.toFixed(4)} -> ${r.read}`).join('; ')} -> item 1 ${R.one.v}`);
  out(`ITEM 2: S126's opening, the rise COV less BASE and q = (resil rise + beq rise - short rise) / score rise: ${R.two.mv.map(x => `${x.lab} score ${f4(x.dScore)} surv ${f4(x.dSurv)} resil ${f4(x.dResil)} beq ${f4(x.dBeq)} short ${f4(x.dShort)} q ${f3(x.q)}`).join('; ')} -> item 2 ${R.two.v}`);
  out(`\nOUTCOME: 1 ${R.one.v}; 2 ${R.two.v}`);
  return R;
}

// ---- planted checks: built logs and files ----
const NB = 4, ST = { code: 'c0', audit: 'a0', prediction: PRED, sha: 's0' };
const TERMS0 = { 'BASE BASE-move': [59, 1.0367, 0.9, 0.05, 0.2, 0.1133], 'BASE COV-move': [5, 1.0333, 0.9, 0.05, 0.2, 0.1167], 'COV BASE-move': [59, 1.0772, 0.9, 0.05, 0.24, 0.1128], 'COV COV-move': [5, 1.0784, 0.9, 0.05, 0.245, 0.1166] };
function builtLog(o = {}) {
  const lines = [`stamp: code c0 audit a0 prediction ${PRED} sha s0`];
  for (const id of UNITS) {
    if (o.skip === id) continue;
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979 tier own riskAbove auto mix 3 | arms BASE,COV`);
    lines.push(`${''.padEnd(16)} solve BASE: secs 1 pts 30 shares 6 readerYears 2 readerTax ${o.taxInBase ? '1:5' : '-'} coverage -`);
    lines.push(`${''.padEnd(16)} solve COV: secs 1 pts 30 shares 7 readerYears 2 readerTax 1:5 coverage ${o.covOff ? '-' : '1/2'}`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed ${o.seedOff ? 7005 : 7002} paths ${3 * NB} worlds 3 steps 3,7 before 2,6 readerYears 1,2,3`);
    if (READ_UNITS.includes(id)) {
      for (const a of ARMS) lines.push(`${''.padEnd(16)} xasr ${a}: reads ${o.readsOff && id === 'S370' ? 7 : 3 * NB * 2} top 12 rep x va x vb x plain x vaw x vbs x secs 1`);
      const c = o.nodesNone ? [0, 0] : o.nodesBad ? [9, 10] : [10, 10];
      lines.push(`${''.padEnd(16)} checks: replica ${o.replicaBad ? '23/24' : '24/24'} nodes ${c[0]}/${c[1]} cr 5/5 top 24/24`);
    } else {
      const T = o.terms || TERMS0;
      for (const [k, v] of Object.entries(T)) lines.push(`${''.padEnd(16)} terms ${k} ${v[0]}: score ${v[1]} surv ${v[2]} resil ${v[3]} beq ${v[4]} short ${v[5]}`);
      lines.push(`${''.padEnd(16)} open BASE: move 59`); lines.push(`${''.padEnd(16)} open COV: move ${o.openOff ? 20 : 5}`);
      lines.push(`${''.padEnd(16)} checks: terms ${o.termsBad ? 3 : 4}/4`);
    }
    if (!(o.notDone && id === 'bridge 4')) lines.push(`${''.padEnd(16)} done ${L} rss 1MB`);
  }
  return lines.join('\n');
}
// a built household: per world NB paths, reads at years 2 and 6 on every path; under COV read - ex5 = 0.02, read - va =
// sh[y] x 0.02 + noise and read - vb half that (o.sh: per-year shares; o.noisy: +-0.03 by path); under BASE read = ex5,
// va = ex5 + o.baseVa
function built(id, o = {}) {
  const t = { stamp: o.stOff && id === 'S370' ? { ...ST, audit: 'zz' } : ST, id, npw: NB, p: [], t: [], k: [], top: [], arms: Object.fromEntries(ARMS.map(a => [a, Object.fromEntries(COLS.map(q => [q, []]))])) };
  if (!READ_UNITS.includes(id)) return t;
  const sh = o.sh || { 2: 0.9, 6: 0.9 };
  for (let k = 0; k < 3; k++) for (let p = 0; p < NB; p++) for (const yr of [2, 6]) {
    t.p.push(p); t.t.push(yr); t.k.push(k); t.top.push(o.unclassed && id === 'S370' ? -1 : 1);
    for (const a of ARMS) {
      const A = t.arms[a], ex5 = 0.5, noise = o.noisy ? (p % 2 ? 0.03 : -0.03) : 0;
      const read = a === 'COV' ? ex5 + 0.02 : ex5, va = a === 'COV' ? read - sh[yr] * 0.02 + noise : ex5 + (o.baseVa || 0);
      A.read.push(read); A.ex5.push(ex5); A.rr.push(read); A.plain.push(read - 0.01); A.va.push(va); A.vb.push(a === 'COV' ? read - sh[yr] * 0.01 + noise : va); A.vaw.push(0.5); A.vbs.push(p % 2);
    }
  }
  if (o.lenOff && id === 'bridge 4') t.arms.COV.va.pop();
  return t;
}
const builtFiles = (o = {}) => Object.fromEntries(UNITS.map(id => [id, built(id, o)]));
// XAS's files as the identity reads them: the same reads, plus a year XAS-R does not read
const xasOf = (o = {}) => Object.fromEntries(READ_UNITS.map(id => {
  const b = built(id, {}), X = { t: [], k: [], p: [], arms: { BASE: { read: [], ex5: [] }, COV: { read: [], ex5: [] } } };
  b.t.forEach((y, j) => { X.t.push(y); X.k.push(b.k[j]); X.p.push(b.p[j]); for (const a of ARMS) { X.arms[a].read.push(b.arms[a].read[j] + (o.identOff && id === 'S370' && a === 'COV' && j === 0 ? 1e-6 : 0)); X.arms[a].ex5.push(b.arms[a].ex5[j]); } });
  if (!o.missingYear) { X.t.push(3); X.k.push(0); X.p.push(0); for (const a of ARMS) { X.arms[a].read.push(0.4); X.arms[a].ex5.push(0.4); } }
  if (o.extraRead && id === 'S370') { X.t.push(2); X.k.push(0); X.p.push(NB); for (const a of ARMS) { X.arms[a].read.push(0.5); X.arms[a].ex5.push(0.5); } }
  return [id, X];
}));
const EDGES = [], REACHED = { 1: new Set(), 2: new Set() };
function planted() {
  const cases = [];
  const G = o => {
    const us = parse(builtLog(o)), g = gate(us, { npw: NB });
    if (g.length) return g;
    const fs = builtFiles(o), X = xasOf(o);
    if (o.missing) fs['bridge 4'] = null;
    const bad = us.flatMap(u => checkFile(fs[u.id], u, ST, X[u.id], NB));
    bad.push(...openCheck(us.find(u => u.id === 'S126'), { open: { BASE: 59, COV: 5 }, scoreBase: o.scoreOff ? 1.04 : 1.0367 }));
    if (!bad.length) bad.push(...guard(fs));
    return bad;
  };
  cases.push(['a built set gates clean', String(G({}).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'bridge 4' }], ['a missing S126', { skip: 'S126' }], ['a household not done', { notDone: true }], ['BASE with the reader\'s tax', { taxInBase: true }], ['COV without coverage', { covOff: true }],
    ['another seed', { seedOff: true }], ['a failed node check', { nodesBad: true }], ['a node check run on nothing', { nodesNone: true }], ['a failed replica check', { replicaBad: true }], ['a missing file', { missing: true }],
    ['a file with another stamp', { stOff: true }], ['a read column of the wrong length', { lenOff: true }], ['an xasr line off the file', { readsOff: true }], ['a read unclassed for the top cell', { unclassed: true }],
    ['a read off XAS\'s (the identity)', { identOff: true }], ['a read XAS has that XAS-R lacks', { extraRead: true }], ['an S126 opening off XAS\'s', { openOff: true }], ['BASE\'s opening score off XAS\'s', { scoreOff: true }],
    ['a failed terms check', { termsBad: true }], ['(v-a) adding optimism under BASE (the guard)', { baseVa: 6e-3 }]]) cases.push([`the gate refuses ${nm}`, String(G(o).length > 0), 'true']);
  cases.push(['the guard passes at its margin', String(G({ baseVa: 5e-3 }).length), '0']);
  EDGES.push('a node check run on nothing', 'a read 1e-6 off XAS\'s', 'the BASE guard at its margin (5e-3) and just past it');
  const us = parse(builtLog({}));
  const Rd = (o, uo = {}) => { const r = reading(builtFiles(o), parse(builtLog(uo)), () => {}); REACHED[1].add(r.one.v); REACHED[2].add(r.two.v); return r; };
  cases.push(['(v-a) removing 0.9 in both years reads item 1 HELD', Rd({}).one.v, 'HELD']);
  cases.push(['(v-a) removing 0.1 in both years reads item 1 FALSIFIED', Rd({ sh: { 2: 0.1, 6: 0.1 } }).one.v, 'FALSIFIED']);
  cases.push(['(v-a) removing 0.45 reads item 1 INCONCLUSIVE (MID)', Rd({ sh: { 2: 0.45, 6: 0.45 } }).one.v, 'INCONCLUSIVE']);
  cases.push(['the years disagreeing (0.9 and 0.1) read item 1 INCONCLUSIVE', Rd({ sh: { 2: 0.9, 6: 0.1 } }).one.v, 'INCONCLUSIVE']); EDGES.push('the two years reading opposite ways');
  { const r = Rd({ sh: { 2: 0.6, 6: 0.6 } }); cases.push(['a share exactly at 0.6 reads COPY', r.one.per.map(x => x.read).join(','), 'COPY,COPY']); } EDGES.push('a share exactly at the 0.6 threshold');
  { const r = Rd({ sh: { 2: 0.3, 6: 0.3 } }); cases.push(['a share exactly at 0.3 reads GRID', r.one.per.map(x => x.read).join(','), 'GRID,GRID']); } EDGES.push('a share exactly at the 0.3 threshold');
  cases.push(['a noisy 0.65 share (LO not shown) reads item 1 INCONCLUSIVE', Rd({ sh: { 2: 0.65, 6: 0.65 }, noisy: true }).one.v, 'INCONCLUSIVE']); EDGES.push('a share past its threshold that the test does not show');
  // item 2: built terms (the defaults: beq carries the rise, 0.04 and 0.045 of 0.0405 and 0.0451)
  cases.push(['the bequest term carrying the rise reads item 2 HELD', Rd({}).two.v, 'HELD']);
  const T2 = { 'BASE BASE-move': [59, 1.0, 0.9, 0.05, 0.2, 0.15], 'BASE COV-move': [5, 1.0, 0.9, 0.05, 0.2, 0.15], 'COV BASE-move': [59, 1.04, 0.94, 0.05, 0.2, 0.15], 'COV COV-move': [5, 1.04, 0.94, 0.05, 0.2, 0.15] };
  cases.push(['the survival term carrying the rise reads item 2 FALSIFIED', Rd({}, { terms: T2 }).two.v, 'FALSIFIED']);
  const T3 = { ...T2, 'COV COV-move': [5, 1.04, 0.9, 0.05, 0.24, 0.15] };
  cases.push(['the moves disagreeing reads item 2 INCONCLUSIVE', Rd({}, { terms: T3 }).two.v, 'INCONCLUSIVE']); EDGES.push('the two opening moves split by different terms');
  const T4 = { ...T2, 'COV BASE-move': [59, 1.04, 0.932, 0.05, 0.2, 0.142], 'COV COV-move': [5, 1.04, 0.932, 0.05, 0.2, 0.142] };
  cases.push(['a shortfall fall carrying 0.2 of the rise (q 0.2) reads item 2 FALSIFIED', Rd({}, { terms: T4 }).two.v, 'FALSIFIED']); EDGES.push('the rise carried by a fall in the shortfall term');
  const T5 = { ...T2, 'COV BASE-move': [59, 1.04, 0.9, 0.05, 0.2, 0.11], 'COV COV-move': [5, 1.04, 0.9, 0.05, 0.2, 0.11] };
  cases.push(['a shortfall fall carrying the whole rise reads item 2 HELD', Rd({}, { terms: T5 }).two.v, 'HELD']);
  const T8 = { ...T2, 'COV BASE-move': [59, 1.04, 0.9, 0.09, 0.2, 0.15], 'COV COV-move': [5, 1.04, 0.9, 0.09, 0.2, 0.15] };
  cases.push(['the resilience term carrying the rise reads item 2 HELD', Rd({}, { terms: T8 }).two.v, 'HELD']); EDGES.push('the rise carried by the resilience term alone');
  const T7 = { 'BASE BASE-move': [59, 1.0, 0.9, 0.05, 0.2, 0.15], 'BASE COV-move': [5, 1.04, 0.94, 0.05, 0.2, 0.15], 'COV BASE-move': [59, 1.04, 0.9, 0.05, 0.24, 0.15], 'COV COV-move': [5, 1.08, 0.94, 0.05, 0.24, 0.15] };
  cases.push(['each move\'s rise taken against its own BASE score reads item 2 HELD', Rd({}, { terms: T7 }).two.v, 'HELD']); EDGES.push('the two moves at different BASE scores');
  { const lines = []; reading(builtFiles({}), parse(builtLog({ terms: T2 })), l => lines.push(l)); const o = lines.find(l => /^\nOUTCOME:/.test(l)); cases.push(['the OUTCOME line the scorecard reads', o && o.trim(), 'OUTCOME: 1 HELD; 2 FALSIFIED']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
export { builtLog, built };
const readGz = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
// XAS's files through XAS's own gate first (rule 3), with COV-B-STEP's under it
export function xasFiles(dir = join(HERE, 'results', 'diagxas')) {
  const logs = logsOf(dir), units = Object.values(logs).flatMap(parseX);
  requireFairLogs(logs, PREDX);
  const bad = gateX(units), files = {};
  const C = bad.length ? null : covbFiles();
  if (C && C.bad.length) bad.push(...C.bad.map(x => `COV-B-STEP's own gate: ${x}`));
  if (!bad.length) {
    const st = stampX(Object.values(logs)[0]);
    for (const u of units) { const t = readGz(join(dir, fileOf(u.id))); bad.push(...checkX(t, u, st, C.files[u.id])); files[u.id] = t; }
    if (!bad.length) bad.push(...drawX(files));
  }
  const s = units.find(u => u.id === 'S126'), sc = Object.values(logs).map(v => / open BASE: move \d+ scores BASE-move (\S+)/.exec(v)).find(Boolean);
  return { bad, files, s126: s ? { open: s.open, scoreBase: sc ? Number(sc[1]) : NaN } : null };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2].map(k => `OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagxasr'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (units.filter(u => u.done).length < UNITS.length) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} households done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw }), files = {};
  const X = bad.length ? null : xasFiles();
  if (X && X.bad.length) bad.push(...X.bad.map(x => `XAS's own gate: ${x}`));
  if (!bad.length) {
    const st = stampOf(Object.values(logs)[0]);
    for (const u of units) { const t = readGz(join(DIR, fileOf(u.id))); bad.push(...checkFile(t, u, st, X.files[u.id], npw)); files[u.id] = t; }
    bad.push(...openCheck(units.find(u => u.id === 'S126'), X.s126));
    if (!bad.length) bad.push(...guard(files));
  }
  if (bad.length) { console.log(`GATE: FAILED - NOT SETTLED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${UNITS.length} households once and done at XAS's unit; every self-check passed on something; every read and ex5 is XAS's at the same path, world and year (XAS's files through their own gate); S126's openings are XAS's; the BASE guard holds`);
  console.log(`planted checks: ${np}`);
  reading(files, units);
}
