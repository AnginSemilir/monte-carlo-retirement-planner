/*
 * XAS-R2'S REDUCER (PLAN.md XAS-R2; predictions/diag-xasr2.md; the deep review after XAS-R, deep-review-log.md 5 Oct 23:18
 * UK). Reads results/diagxasr2 (audit-xasr2.mjs: S370, bridge 4 and S126) and, behind the gate, decides:
 *   ITEM 1 (primary; YB-TOPCELL against YB-REF / YB-NODEQ): COV's reads on S370 in each year before a step (years 2 and 6),
 *     per path D = the sum over the year's reads of (read - vb) (what the midpoint node, built on COV's own tables, removes)
 *     and P = the sum of (read - ex5); the share s = sum D / sum P. Two one-sided paired sign-flip tests a year (reduce-7ar.mjs
 *     flipP, B 20,000 from fixed seeds): LO, mean(D - LO1 P) above 0 (s above LO1), HI, mean(HI1 P - D) above 0 (s below
 *     HI1); Holm over the four. A year reads CONSTRUCT when s lies outside [S_MIN, S_MAX] (XAS-R's registered bounds); else
 *     TOPCELL when LO shows and s >= HI1, REF when HI shows and s <= LO1, else MID. HELD when both years read TOPCELL,
 *     FALSIFIED when both read REF, else INCONCLUSIVE.
 *   ITEM 2 (VA-QUANT against VA-REF): over the (v-a) nodes BASE built on S370 in the years before a step, the ratio
 *     mean |S*5 - S*41| / mean |S*5 - p* cL| (how much of the node's departure from the copied continuation the 5-point
 *     quadrature alone moves). Exact arithmetic over the nodes the paths reach: HELD (QUANT) at Q2_HELD or more, FALSIFIED
 *     (REF) at Q2_FALS or less, else INCONCLUSIVE. Reported: the same on COV and bridge 4; (v-a) rebuilt on S*41 (va41)
 *     against the guard's terms.
 *   ITEM 3 (S126-BLEND): S126's step-year reads in BASE's top share cell, per path, e = the mean of (read - one-step) of
 *     the bequest table (eb) and of the shortfall table (eh). BASE's signs: eb below 0 and eh above 0, each by a one-sided
 *     paired sign-flip test, Holm over the two. HELD when both signs show and COV's mean error is at most REMOVE of BASE's
 *     on each (COV removes half or more of each); FALSIFIED when COV's mean error is at least BASE's on both; else
 *     INCONCLUSIVE.
 *   THE GATE (NOT SETTLED if any fails): the stamps; a plant line; a household missing, repeated or not done; an arm's
 *     settings not taking; a ran line off XAS's unit; a self-check failed or run on nothing - the replica and top checks,
 *     and per arm the nodes, cross (every cached row used by the solve that built it: O109's fault), fine and cr checks
 *     (cr on some arm); a per-read file missing, unstamped or short; XAS's files failing their own gate; a read or ex5 off
 *     XAS's at the same path, world and year (reduce-xasr.mjs checkFile, the identity); S126's openings off XAS's; item 3's
 *     reads missing or unclassed; and THE BASE GUARD on the construct item 1 reads, vb (XAS-R's registered guard, on S370
 *     and bridge 4): under BASE, mean (vb - ex5) in a year above GUARD, or more than GUARD further from the one-step value
 *     than the reader's own mean (read - ex5).
 *   node research/solver/reduce-xasr2.mjs [dir] [paths a world] [points] > research/solver/results-xasr2.txt
 *   node research/solver/reduce-xasr2.mjs --planted   the planted checks alone, the outcomes they reach and the EDGES
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { logsOf } from './reduce-xas.mjs';
import { checkFile as checkR, openCheck, xasFiles, perPath, stampOf, GUARD, S_MIN, S_MAX } from './reduce-xasr.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-xasr2.md';
export const PTS = '30', SEED = '7002', NPW = 2000, B = 20000, ALPHA = 0.05;
export const LO1 = 0.2, HI1 = 0.5, Q2_HELD = 0.5, Q2_FALS = 0.25, REMOVE = 0.5;
export const UNITS = ['S370', 'bridge 4', 'S126'], READ_UNITS = ['S370', 'bridge 4'], ARMS = ['BASE', 'COV'];
export { GUARD, S_MIN, S_MAX };
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const L = 'READER/TS+J/W0.02/PCLSI';
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`);
const CASEL = /^(\S.*?)\s+case \| unit (\S+) \| /;
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');
const f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');
const frac = s => { const m = /^(\d+)\/(\d+)$/.exec(s || ''); return m ? [Number(m[1]), Number(m[2])] : null; };

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if (/^plant: /.test(line)) us.push({ plant: line });
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), unit: m[2], solve: {}, xasr: {}, per: {}, blend: {}, terms: {}, open: {}, done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = /^\s+solve (BASE|COV): (.*)$/.exec(line))) cur.solve[m[1]] = m[2];
    else if ((m = new RegExp(`^\\s+ran ${esc(L)}: (.*)$`).exec(line))) cur.ran = m[1];
    else if ((m = /^\s+xasr (BASE|COV): reads (\d+) top (\d+) /.exec(line))) cur.xasr[m[1]] = { reads: Number(m[2]), top: Number(m[3]) };
    else if ((m = /^\s+checks: replica (\S+) top (\S+) nodes (\d+)$/.exec(line))) cur.checks = { replica: frac(m[1]), top: frac(m[2]), nodes: Number(m[3]) };
    else if ((m = /^\s+checks (BASE|COV): nodes (\S+) cr (\S+) cross (\S+) fine (\S+)$/.exec(line))) cur.per[m[1]] = { nodes: frac(m[2]), cr: frac(m[3]), cross: frac(m[4]), fine: frac(m[5]) };
    else if ((m = /^\s+blend (BASE|COV): reads (\d+) top (\d+) /.exec(line))) cur.blend[m[1]] = { reads: Number(m[2]), top: Number(m[3]) };
    else if ((m = /^\s+checks: terms (\d+)\/4$/.exec(line))) cur.termsOk = Number(m[1]);
    else if ((m = /^\s+terms (BASE|COV) (BASE-move|COV-move) (\d+): score (\S+) surv (\S+) resil (\S+) beq (\S+) short (\S+)$/.exec(line))) cur.terms[`${m[1]} ${m[2]}`] = { ai: Number(m[3]), score: Number(m[4]), surv: Number(m[5]), resil: Number(m[6]), beq: Number(m[7]), short: Number(m[8]) };
    else if ((m = /^\s+open (BASE|COV): move (\d+)$/.exec(line))) cur.open[m[1]] = Number(m[2]);
    else if (new RegExp(`^\\s+done ${esc(L)} `).test(line)) cur.done = true;
  }
  return us;
}
const okFrac = f => f && f[0] === f[1];
export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const u of units) if (u.plant) bad.push(`a planted fault in the logs (${u.plant})`);
  const real = units.filter(u => !u.plant);
  for (const id of UNITS) { const n = real.filter(u => u.id === id).length; if (n !== 1) bad.push(`${id}: ${n} unit lines, not 1`); }
  for (const u of real) {
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
      const c = u.checks;
      if (!c || !c.replica || !c.top) bad.push(`${tag}: no checks line`);
      else {
        if (!(c.replica[1] > 0 && c.top[1] > 0 && c.nodes > 0)) bad.push(`${tag}: the replica, top or node count ran on nothing`);
        if (!okFrac(c.replica) || !okFrac(c.top)) bad.push(`${tag}: the replica or top check failed`);
      }
      for (const a of ARMS) {
        const P = u.per[a];
        if (!P || !P.nodes || !P.cr || !P.cross || !P.fine) { bad.push(`${tag}: no checks line for ${a}`); continue; }
        if (!(P.nodes[1] > 0 && P.cross[1] > 0 && P.fine[1] > 0)) bad.push(`${tag}: ${a}'s nodes, cross or fine check ran on nothing`);
        if (!okFrac(P.nodes) || !okFrac(P.cr) || !okFrac(P.fine)) bad.push(`${tag}: ${a}'s nodes, cr or fine check failed`);
        if (!okFrac(P.cross)) bad.push(`${tag}: ${a}'s cross check failed - ${P.cross[1] - P.cross[0]} cached rows used by another arm's solve (O109)`);
      }
      if (ARMS.every(a => u.per[a] && u.per[a].cr && !(u.per[a].cr[1] > 0))) bad.push(`${tag}: the cr check ran on nothing in both arms`);
      for (const a of ARMS) if (!u.xasr[a] || !(u.xasr[a].reads > 0)) bad.push(`${tag}: ${a}'s xasr line missing or on no reads`);
    } else {
      if (u.termsOk !== 4) bad.push(`${tag}: the terms check missing or failed`);
      if (Object.keys(u.terms).length !== 4 || ARMS.some(a => !(u.open[a] >= 0))) bad.push(`${tag}: the terms or open lines missing`);
      for (const a of ARMS) if (!u.blend[a] || !(u.blend[a].top > 0)) bad.push(`${tag}: ${a}'s blend line missing or no top-cell step read`);
    }
  }
  return bad;
}
// one household's file: reduce-xasr.mjs's checks and identity against XAS's file, then XAS-R2's own columns
export function checkFile(t, u, st, X, npw = NPW) {
  const bad = checkR(t, u, st, X, npw);
  if (!t || bad.length) return bad;
  const tag = `${u.id} file`;
  if (READ_UNITS.includes(u.id)) {
    const n = t.t.length;
    for (const a of ARMS) if (!Array.isArray(t.arms[a].va41) || t.arms[a].va41.length !== n) bad.push(`${tag}: ${a}'s va41 missing or of the wrong length`);
    const N = t.nodes, k = N && Array.isArray(N.s5) ? N.s5.length : -1;
    if (!N || !(k > 0) || ['arm', 'k', 't', 's41', 'p', 'cL'].some(q => !Array.isArray(N[q]) || N[q].length !== k)) bad.push(`${tag}: the (v-a) nodes missing, empty or of unequal length`);
    else if (u.checks && u.checks.nodes !== k) bad.push(`${tag}: ${k} nodes in the file, ${u.checks.nodes} on the checks line`);
  } else {
    const b = t.blend, n = b && Array.isArray(b.t) ? b.t.length : -1;
    if (!b || !(n > 0) || ['k', 'p', 'top'].some(q => !Array.isArray(b[q]) || b[q].length !== n)) { bad.push(`${tag}: item 3's reads missing, empty or of unequal length`); return bad; }
    if (b.top.some(x => x !== 0 && x !== 1)) bad.push(`${tag}: an item 3 read unclassed for the top cell`);
    for (const a of ARMS) {
      const A = b.arms && b.arms[a];
      if (!A || ['bR', 'bE', 'hR', 'hE', 'bE0', 'hE0', 'agree'].some(q => !Array.isArray(A[q]) || A[q].length !== n)) bad.push(`${tag}: ${a}'s item 3 columns missing or of the wrong length`);
      else if (A.bR.some(x => !Number.isFinite(x)) || A.hR.some(x => !Number.isFinite(x))) bad.push(`${tag}: ${a}'s item 3 table reads not all finite (a read never fails: only a failing move's one-step value may be missing)`);
      else if (u.blend[a] && (u.blend[a].reads !== n || u.blend[a].top !== b.top.filter(x => x === 1).length)) bad.push(`${tag}: ${a}'s blend line off the file`);
    }
  }
  return bad;
}
// THE BASE GUARD (XAS-R's registered guard) on the construct item 1 reads: vb
export function guard(files, x = 'vb') {
  const bad = [];
  for (const id of READ_UNITS) {
    const t = files[id]; if (!t) continue;
    for (const y of [...new Set(t.t)].sort((a, b) => a - b)) {
      const J = t.t.map((_, j) => j).filter(j => t.t[j] === y), A = t.arms.BASE, m = mean(J.map(j => A[x][j] - A.ex5[j])), r = mean(J.map(j => A.read[j] - A.ex5[j]));
      if (!(m <= GUARD + 1e-12)) bad.push(`the BASE guard: ${id} year ${y} BASE's mean (${x} - ex5) ${f4(m)} above ${GUARD} (optimism added)`);
      if (!(Math.abs(m) <= Math.abs(r) + GUARD + 1e-12)) bad.push(`the BASE guard: ${id} year ${y} BASE's mean (${x} - ex5) ${f4(m)} against the reader's (read - ex5) ${f4(r)}: more than ${GUARD} further from the one-step value`);
    }
  }
  return bad;
}
const sel = (t, f) => t.t.map((_, j) => j).filter(f);
const shareOf = (t, J, a, x) => { const A = t.arms[a]; let d = 0, p = 0; for (const j of J) { d += A.read[j] - A[x][j]; p += A.read[j] - A.ex5[j]; } return p !== 0 ? d / p : NaN; };
// item 2's ratio over a household's nodes of one arm: mean |S5 - S41| / mean |S5 - p cL|
export function quantRatio(N, arm) {
  const J = N.s5.map((_, j) => j).filter(j => N.arm[j] === arm);
  const q = mean(J.map(j => Math.abs(N.s5[j] - N.s41[j]))), d = mean(J.map(j => Math.abs(N.s5[j] - N.p[j] * N.cL[j])));
  return { n: J.length, q, d, ratio: d > 0 ? q / d : NaN };
}
export function items(files, units) {
  // item 1
  const S = files.S370, A = S.arms.COV, years = [...new Set(S.t)].sort((a, b) => a - b);
  const per = years.map(y => {
    const J = sel(S, j => S.t[j] === y);
    const D = perPath(S, J, j => A.read[j] - A.vb[j]), P = perPath(S, J, j => A.read[j] - A.ex5[j]);
    const s = D.reduce((q, x) => q + x, 0) / P.reduce((q, x) => q + x, 0);
    return { y, n: D.length, s, lo: D.map((d, i) => d - LO1 * P[i]), hi: D.map((d, i) => HI1 * P[i] - d) };
  });
  const h = holm(per.flatMap((r, i) => [flipP(r.lo, B, 7002 + 2 * i), flipP(r.hi, B, 7003 + 2 * i)]));
  per.forEach((r, i) => { r.pLo = h[2 * i]; r.pHi = h[2 * i + 1]; r.read = !(r.s >= S_MIN && r.s <= S_MAX) ? 'CONSTRUCT' : r.pLo < ALPHA && r.s >= HI1 ? 'TOPCELL' : r.pHi < ALPHA && r.s <= LO1 ? 'REF' : 'MID'; });
  const one = { per, v: per.length && per.every(r => r.read === 'TOPCELL') ? 'HELD' : per.length && per.every(r => r.read === 'REF') ? 'FALSIFIED' : 'INCONCLUSIVE' };
  // item 2
  const qr = quantRatio(S.nodes, 'BASE');
  const two = { ...qr, v: !(qr.n > 0) || !Number.isFinite(qr.ratio) ? 'INCONCLUSIVE' : qr.ratio >= Q2_HELD - 1e-12 ? 'HELD' : qr.ratio <= Q2_FALS + 1e-12 ? 'FALSIFIED' : 'INCONCLUSIVE' };
  // item 3
  // the top-cell step reads where both arms' own moves have one-step values (a failing move's are NaN, null in the file:
  // counted and left out - the plan-auditor's MINOR 4 of 6 Oct on 3584a41)
  const b = files.S126.blend, fin = (a, j) => Number.isFinite(b.arms[a].bE[j]) && Number.isFinite(b.arms[a].hE[j]);
  const Jtop = b.top.map((x, j) => (x === 1 ? j : -1)).filter(j => j >= 0), J = Jtop.filter(j => ARMS.every(a => fin(a, j)));
  const per3 = q => perPath({ k: b.k, p: b.p }, J, q), cnt = per3(() => 1);
  const err = (a, r, e) => mean(J.map(j => b.arms[a][r][j] - b.arms[a][e][j]));
  const eB = { b: err('BASE', 'bR', 'bE'), h: err('BASE', 'hR', 'hE') }, eC = { b: err('COV', 'bR', 'bE'), h: err('COV', 'hR', 'hE') };
  const lowB = per3(j => -(b.arms.BASE.bR[j] - b.arms.BASE.bE[j])).map((x, i) => x / cnt[i]), highH = per3(j => b.arms.BASE.hR[j] - b.arms.BASE.hE[j]).map((x, i) => x / cnt[i]);
  const [pB, pH] = holm([flipP(lowB, B, 7101), flipP(highH, B, 7102)]);
  const signs = pB < ALPHA && pH < ALPHA && eB.b < 0 && eB.h > 0;
  const removes = Math.abs(eC.b) <= REMOVE * Math.abs(eB.b) + 1e-15 && Math.abs(eC.h) <= REMOVE * Math.abs(eB.h) + 1e-15;
  const noSmaller = Math.abs(eC.b) >= Math.abs(eB.b) && Math.abs(eC.h) >= Math.abs(eB.h);
  const agree = J.filter(j => b.arms.COV.agree[j] === 1).length, e0 = (a, r, e) => mean(J.map(j => b.arms[a][r][j] - b.arms[a][e][j]).filter(Number.isFinite));
  const three = { n: J.length, dropped: Jtop.length - J.length, agree, paths: cnt.length, eB, eC, eC0: { b: e0('COV', 'bR', 'bE0'), h: e0('COV', 'hR', 'hE0') }, pB, pH, v: signs && removes ? 'HELD' : noSmaller ? 'FALSIFIED' : 'INCONCLUSIVE' };
  return { one, two, three };
}
export function reading(files, units, out = console.log) {
  const R = items(files, units);
  out('\nTHE YEAR-BEFORE READS (means over reads: rep = read - ex5; each construct\'s own error and the share of rep it removes; every construct on its own arm\'s tables)');
  for (const id of READ_UNITS) {
    const t = files[id];
    for (const a of ARMS) for (const y of [...new Set(t.t)].sort((p, q) => p - q)) {
      const J = sel(t, j => t.t[j] === y), A = t.arms[a], m = f => mean(J.map(f));
      out(`  ${id.padEnd(9)} ${a.padEnd(4)} year ${y}: reads ${J.length} rep ${f4(m(j => A.read[j] - A.ex5[j]))}; vb ${f4(m(j => A.vb[j] - A.ex5[j]))} removes ${f3(shareOf(t, J, a, 'vb'))}; va ${f4(m(j => A.va[j] - A.ex5[j]))} removes ${f3(shareOf(t, J, a, 'va'))}; va41 ${f4(m(j => A.va41[j] - A.ex5[j]))} removes ${f3(shareOf(t, J, a, 'va41'))}`);
    }
  }
  out('\n(v-a) ON THE FINE POINTS AGAINST THE GUARD\'S TERMS (reported: BASE\'s mean va41 - ex5 per year, and against the reader\'s own)');
  for (const g of guard(files, 'va41')) out(`  ${g.replace('the BASE guard: ', '')}`);
  if (!guard(files, 'va41').length) out('  va41 within the guard\'s terms on both households, every year');
  out('\nTHE (v-a) NODES: mean |S*5 - S*41| over mean |S*5 - p* cL| per household and arm');
  for (const id of READ_UNITS) for (const a of ARMS) { const q = quantRatio(files[id].nodes, a); out(`  ${id.padEnd(9)} ${a.padEnd(4)} nodes ${q.n}: ${f4(q.q)} over ${f4(q.d)} = ${f3(q.ratio)}`); }
  out('\nS126\'S STEP-YEAR READS IN BASE\'S TOP CELL (read - one-step, mean over reads): bequest | shortfall');
  for (const a of ARMS) out(`  ${a.padEnd(4)} ${f4(a === 'BASE' ? R.three.eB.b : R.three.eC.b)} | ${f4(a === 'BASE' ? R.three.eB.h : R.three.eC.h)}  (each arm at its own move)`);
  out(`  COV at BASE's move (reported): ${f4(R.three.eC0.b)} | ${f4(R.three.eC0.h)}; COV's move agrees with BASE's on ${R.three.agree} of ${R.three.n} reads; ${R.three.dropped} top-cell reads left out for a failing move`);
  out(`\nITEM 1 (primary): COV on S370, the share of rep the midpoint node removes, per year: ${R.one.per.map(r => `year ${r.y} s ${f3(r.s)} over ${r.n} paths, Holm p LO ${r.pLo.toFixed(4)} HI ${r.pHi.toFixed(4)} -> ${r.read}`).join('; ')} -> item 1 ${R.one.v}`);
  out(`ITEM 2: BASE's (v-a) nodes on S370 (${R.two.n}): mean |S*5 - S*41| ${f4(R.two.q)} over mean |S*5 - p* cL| ${f4(R.two.d)} = ${f3(R.two.ratio)} -> item 2 ${R.two.v}`);
  out(`ITEM 3: S126, ${R.three.n} top-cell step reads on ${R.three.paths} paths (each arm at its own move; ${R.three.dropped} left out for a failing move): BASE bequest ${f4(R.three.eB.b)} (Holm p low ${R.three.pB.toFixed(4)}), shortfall ${f4(R.three.eB.h)} (Holm p high ${R.three.pH.toFixed(4)}); COV bequest ${f4(R.three.eC.b)}, shortfall ${f4(R.three.eC.h)} -> item 3 ${R.three.v}`);
  out(`\nOUTCOME: 1 ${R.one.v}; 2 ${R.two.v}; 3 ${R.three.v}`);
  return R;
}

// ---- planted checks: built logs and files ----
const NB = 4, ST = { code: 'c0', audit: 'a0', prediction: PRED, sha: 's0' };
const TERMS0 = { 'BASE BASE-move': [59, 1.0367, 0.9, 0.05, 0.2, 0.1133], 'BASE COV-move': [5, 1.0333, 0.9, 0.05, 0.2, 0.1167], 'COV BASE-move': [59, 1.0772, 0.9, 0.05, 0.24, 0.1128], 'COV COV-move': [5, 1.0784, 0.9, 0.05, 0.245, 0.1166] };
const NODES = 6;
function builtLog(o = {}) {
  const lines = [`stamp: code c0 audit a0 prediction ${PRED} sha s0`];
  if (o.plant) lines.push('plant: crossarm');
  for (const id of UNITS) {
    if (o.skip === id) continue;
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979 tier own riskAbove auto mix 3 | arms BASE,COV`);
    lines.push(`${''.padEnd(16)} solve BASE: secs 1 pts 30 shares 6 readerYears 2 readerTax - coverage -`);
    lines.push(`${''.padEnd(16)} solve COV: secs 1 pts 30 shares 7 readerYears 2 readerTax 1:5 coverage 1/2`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed 7002 paths ${3 * NB} worlds 3 steps 3,7 before 2,6 readerYears 1,2,3`);
    if (READ_UNITS.includes(id)) {
      for (const a of ARMS) lines.push(`${''.padEnd(16)} xasr ${a}: reads ${3 * NB * 2} top 24 rep x va x va41 x vb x plain x vaw x vbs x secs 1`);
      lines.push(`${''.padEnd(16)} checks: replica 24/24 top 24/24 nodes ${NODES}`);
      for (const a of ARMS) {
        const cross = o.crossBad && a === 'COV' ? '7/10' : o.crossNone && a === 'COV' ? '0/0' : '10/10', fine = o.fineBad && a === 'BASE' ? '2/3' : '3/3', cr = o.crNone ? '0/0' : '5/5';
        lines.push(`${''.padEnd(16)} checks ${a}: nodes ${o.nodesNone && a === 'COV' ? '0/0' : '10/10'} cr ${cr} cross ${cross} fine ${fine}`);
      }
    } else {
      for (const [k, v] of Object.entries(TERMS0)) lines.push(`${''.padEnd(16)} terms ${k} ${v[0]}: score ${v[1]} surv ${v[2]} resil ${v[3]} beq ${v[4]} short ${v[5]}`);
      lines.push(`${''.padEnd(16)} open BASE: move 59`); lines.push(`${''.padEnd(16)} open COV: move 5`);
      lines.push(`${''.padEnd(16)} checks: terms 4/4`);
      for (const a of ARMS) lines.push(`${''.padEnd(16)} blend ${a}: reads ${3 * NB} top ${o.blendNone ? 0 : o.unclassed3 ? 3 * NB - 1 : o.mixTop3 ? 3 * NB / 2 : 3 * NB} beq x short x secs 1`);
    }
    lines.push(`${''.padEnd(16)} done ${L} rss 1MB`);
  }
  return lines.join('\n');
}
// a built household. COV: read - ex5 = 0.02, read - vb = sh[y] x 0.02 (+ noise); BASE: read = ex5, vb = ex5 + baseVb. Nodes:
// BASE's |S5 - S41| = o.q x 0.1 and |S5 - p cL| = 0.1. S126: BASE's bequest error -0.01 and shortfall +0.01 (+-noise by
// path), COV's those times o.keep
function built(id, o = {}) {
  const COLS = ['read', 'ex5', 'rr', 'plain', 'va', 'va41', 'vb', 'vaw', 'vbs'];
  const t = { stamp: ST, id, npw: NB, p: [], t: [], k: [], top: [], arms: Object.fromEntries(ARMS.map(a => [a, Object.fromEntries(COLS.map(q => [q, []]))])) };
  if (!READ_UNITS.includes(id)) {
    const b = { k: [], p: [], t: [], top: [], arms: Object.fromEntries(ARMS.map(a => [a, { bR: [], bE: [], hR: [], hE: [], bE0: [], hE0: [], agree: [] }])) }, keep = o.keep ?? 0.2;
    for (let k = 0; k < 3; k++) for (let p = 0; p < NB; p++) {
      const inTop = !(o.mixTop3 && p % 2);
      b.k.push(k); b.p.push(p); b.t.push(1); b.top.push(o.unclassed3 && k === 0 && p === 0 ? -1 : o.blendNone ? 0 : inTop ? 1 : 0);
      const nz = o.noisy3 ? (p % 2 ? 0.05 : -0.05) : 0;
      for (const a of ARMS) {
        const f = a === 'COV' ? keep : 1, fh = a === 'COV' && o.keepH !== undefined ? o.keepH : f;
        b.arms[a].bE.push(0.3); b.arms[a].bR.push(0.3 + (inTop ? f * ((o.baseB ?? -0.01) + nz) : 0.05)); b.arms[a].hE.push(0.1); b.arms[a].hR.push(0.1 + fh * (0.01 + nz));
        // BASE's move's values for COV: o.policyGap moves them (a policy gap the own-move read must not take in)
        b.arms[a].bE0.push(0.3 + (a === 'COV' ? (o.policyGap || 0) : 0)); b.arms[a].hE0.push(0.1); b.arms[a].agree.push(a === 'COV' && o.policyGap ? 0 : 1);
      }
    }
    if (o.lenOff3) b.arms.COV.hR.pop();
    // a failing move on the first read: its one-step values missing (null in the file), with a wrong-sign read that would
    // turn item 3 if it were read
    if (o.failMove) { b.arms.COV.bE[0] = null; b.arms.COV.hE[0] = null; b.arms.BASE.bR[0] = 0.3 + 0.5; }
    if (o.nullRead) b.arms.BASE.hR[1] = null;
    t.blend = b;
    return t;
  }
  const sh = o.sh || { 2: 0.9, 6: 0.9 };
  for (let k = 0; k < 3; k++) for (let p = 0; p < NB; p++) for (const yr of [2, 6]) {
    t.p.push(p); t.t.push(yr); t.k.push(k); t.top.push(1);
    for (const a of ARMS) {
      const A = t.arms[a], ex5 = 0.5, noise = o.noisy ? (p % 2 ? 0.03 : -0.03) : 0;
      const read = a === 'COV' ? ex5 + 0.02 : ex5 + (o.baseRep || 0), vb = a === 'COV' ? read - sh[yr] * 0.02 + noise : ex5 + (o.baseVb || 0) + (id === 'bridge 4' ? (o.baseVbB4 || 0) : 0);
      A.read.push(read); A.ex5.push(ex5); A.rr.push(read); A.plain.push(read); A.va.push(read); A.va41.push(a === 'BASE' ? ex5 + (o.baseVa41 || 0) : read); A.vb.push(vb); A.vaw.push(0.5); A.vbs.push(1);
    }
  }
  const q = o.q ?? 0.8;
  t.nodes = { arm: [], k: [], t: [], s5: [], s41: [], p: [], cL: [] };
  for (let i = 0; i < NODES; i++) { const a = i < NODES / 2 ? 'BASE' : 'COV', aq = a === 'BASE' ? q : 0.05; t.nodes.arm.push(a); t.nodes.k.push(i % 3); t.nodes.t.push(2); t.nodes.p.push(0.5); t.nodes.cL.push(1); t.nodes.s5.push(0.6); t.nodes.s41.push(0.6 - aq * 0.1); }
  if (o.nodesShort && id === 'S370') t.nodes.cL.pop();
  return t;
}
const builtFiles = (o = {}) => Object.fromEntries(UNITS.map(id => [id, built(id, o)]));
const xasOf = (o = {}) => Object.fromEntries(READ_UNITS.map(id => {
  const b = built(id, { baseRep: o.baseRep }), X = { t: [], k: [], p: [], arms: { BASE: { read: [], ex5: [] }, COV: { read: [], ex5: [] } } };
  b.t.forEach((y, j) => { X.t.push(y); X.k.push(b.k[j]); X.p.push(b.p[j]); for (const a of ARMS) { X.arms[a].read.push(b.arms[a].read[j]); X.arms[a].ex5.push(b.arms[a].ex5[j]); } });
  return [id, X];
}));
const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set() };
function planted() {
  const cases = [];
  const G = o => {
    const us = parse(builtLog(o)), g = gate(us, { npw: NB });
    if (g.length) return g;
    const fs = builtFiles(o), X = xasOf(o);
    const bad = us.filter(u => !u.plant).flatMap(u => checkFile(fs[u.id], u, ST, X[u.id], NB));
    bad.push(...openCheck(us.find(u => u.id === 'S126'), { open: { BASE: 59, COV: 5 }, scoreBase: 1.0367 }));
    if (!bad.length) bad.push(...guard(fs));
    return bad;
  };
  cases.push(['a built set gates clean', String(G({}).length), '0']);
  for (const [nm, o] of [['a plant line', { plant: true }], ['a missing household', { skip: 'S126' }], ['a missing read household', { skip: 'bridge 4' }], ['COV\'s cached rows used by BASE\'s solve (O109, the cross check)', { crossBad: true }], ['a cross check run on nothing in one arm', { crossNone: true }],
    ['a node check run on nothing in one arm (COV\'s, as XAS-R\'s was)', { nodesNone: true }], ['a failed fine check', { fineBad: true }], ['the cr check on nothing in both arms', { crNone: true }],
    ['no top-cell step read for item 3', { blendNone: true }], ['an item 3 read unclassed', { unclassed3: true }], ['an item 3 column short', { lenOff3: true }], ['a node column short', { nodesShort: true }],
    ['vb adding optimism under BASE (the guard on vb)', { baseVb: 6e-3 }], ['vb moving BASE\'s reads pessimistic past the margin', { baseVb: -6e-3 }], ['vb moving bridge 4\'s BASE reads alone', { baseVbB4: 6e-3 }]]) cases.push([`the gate refuses ${nm}`, String(G(o).length > 0), 'true']);
  cases.push(['the guard on vb passes at its margin', String(G({ baseVb: 5e-3 }).length), '0']);
  cases.push(['planted: optimism past 5e-3 refused where BASE\'s rep is large (rep -6e-3, vb - ex5 +6e-3)', String(G({ baseRep: -6e-3, baseVb: 6e-3 }).length > 0), 'true']);
  cases.push(['a pessimistic vb within |rep| + 5e-3 passes (rep -6e-3, vb - ex5 -9e-3)', String(G({ baseRep: -6e-3, baseVb: -9e-3 }).length), '0']);
  EDGES.push('BASE\'s own rep not 0, the guard\'s two terms each binding');
  cases.push(['va41 past the guard is reported, never gating', String(G({ baseVa41: 9e-3 }).length), '0']);
  EDGES.push('a cross-arm cache use (O109\'s fault)', 'a check run on nothing in one arm only', 'the guard on vb at its margin');
  const Rd = o => { const r = reading(builtFiles(o), parse(builtLog(o)), () => {}); REACHED[1].add(r.one.v); REACHED[2].add(r.two.v); REACHED[3].add(r.three.v); return r; };
  // item 1
  cases.push(['vb removing 0.9 in both years reads item 1 HELD', Rd({}).one.v, 'HELD']);
  cases.push(['vb removing 0.1 in both years reads item 1 FALSIFIED', Rd({ sh: { 2: 0.1, 6: 0.1 } }).one.v, 'FALSIFIED']);
  cases.push(['vb removing 0.35 reads item 1 INCONCLUSIVE (MID)', Rd({ sh: { 2: 0.35, 6: 0.35 } }).one.v, 'INCONCLUSIVE']);
  cases.push(['the years disagreeing read item 1 INCONCLUSIVE', Rd({ sh: { 2: 0.9, 6: 0.1 } }).one.v, 'INCONCLUSIVE']); EDGES.push('the two years reading opposite ways');
  { const r = Rd({ sh: { 2: 0.5, 6: 0.5 } }); cases.push(['a share exactly at 0.5 reads TOPCELL', r.one.per.map(x => x.read).join(','), 'TOPCELL,TOPCELL']); } EDGES.push('a share exactly at the 0.5 threshold');
  { const r = Rd({ sh: { 2: 0.2, 6: 0.2 } }); cases.push(['a share exactly at 0.2 reads REF', r.one.per.map(x => x.read).join(','), 'REF,REF']); } EDGES.push('a share exactly at the 0.2 threshold');
  cases.push(['a noisy 0.55 share (LO not shown) reads INCONCLUSIVE', Rd({ sh: { 2: 0.55, 6: 0.55 }, noisy: true }).one.v, 'INCONCLUSIVE']); EDGES.push('a share past its threshold that the test does not show');
  cases.push(['a noisy 0.15 share (HI not shown) reads INCONCLUSIVE, never REF', Rd({ sh: { 2: 0.15, 6: 0.15 }, noisy: true }).one.v, 'INCONCLUSIVE']);
  { const r = Rd({ sh: { 2: 1.5, 6: 1.5 } }); cases.push(['an overshoot (s 1.5) reads CONSTRUCT, item 1 INCONCLUSIVE', `${r.one.per.map(x => x.read).join(',')} ${r.one.v}`, 'CONSTRUCT,CONSTRUCT INCONCLUSIVE']); }
  { const r = Rd({ sh: { 2: -0.5, 6: -0.5 } }); cases.push(['vb adding to the error (s -0.5) reads CONSTRUCT, never REF', `${r.one.per.map(x => x.read).join(',')} ${r.one.v}`, 'CONSTRUCT,CONSTRUCT INCONCLUSIVE']); }
  // item 2
  cases.push(['nodes moved 0.8 of their departure by the fine points read item 2 HELD (QUANT)', Rd({}).two.v, 'HELD']);
  cases.push(['nodes moved 0.1 read item 2 FALSIFIED (REF)', Rd({ q: 0.1 }).two.v, 'FALSIFIED']);
  cases.push(['nodes moved 0.35 read item 2 INCONCLUSIVE', Rd({ q: 0.35 }).two.v, 'INCONCLUSIVE']);
  cases.push(['a ratio exactly at 0.5 reads HELD, at 0.25 FALSIFIED', `${Rd({ q: 0.5 }).two.v} ${Rd({ q: 0.25 }).two.v}`, 'HELD FALSIFIED']); EDGES.push('the item 2 ratio exactly at 0.5 and at 0.25');
  cases.push(['item 2 reads BASE\'s nodes, not COV\'s (COV\'s ratio 0.05 beside BASE\'s 0.8)', String(Rd({}).two.ratio.toFixed(3)), '0.800']);
  // item 3
  cases.push(['COV keeping 0.2 of BASE\'s errors reads item 3 HELD', Rd({}).three.v, 'HELD']);
  cases.push(['COV keeping all of them reads item 3 FALSIFIED', Rd({ keep: 1 }).three.v, 'FALSIFIED']);
  cases.push(['COV keeping 0.7 reads item 3 INCONCLUSIVE', Rd({ keep: 0.7 }).three.v, 'INCONCLUSIVE']);
  cases.push(['COV keeping exactly half reads HELD', Rd({ keep: 0.5 }).three.v, 'HELD']); EDGES.push('COV keeping exactly half of BASE\'s error');
  cases.push(['COV removing the bequest error but keeping the shortfall\'s reads INCONCLUSIVE', Rd({ keepH: 1 }).three.v, 'INCONCLUSIVE']); EDGES.push('COV removing one term\'s error and not the other\'s');
  cases.push(['BASE reading bequest HIGH (the wrong sign) never reads HELD', Rd({ baseB: 0.01 }).three.v === 'HELD' ? 'HELD' : 'not HELD', 'not HELD']); EDGES.push('BASE\'s bequest error of the wrong sign');
  cases.push(['item 3 reads the top-cell reads alone (half the reads outside it, of the wrong sign)', Rd({ mixTop3: true }).three.v, 'HELD']); EDGES.push('step reads outside the top cell beside those in it');
  cases.push(['a failing move\'s read is left out, not read (item 3 still HELD)', Rd({ failMove: true }).three.v + ' ' + Rd({ failMove: true }).three.dropped, 'HELD 1']); EDGES.push('a failing move at an item 3 read (its one-step value missing)');
  cases.push(['item 3 reads COV at its own move: a policy gap at BASE\'s move does not enter (HELD)', Rd({ policyGap: 0.5 }).three.v, 'HELD']); EDGES.push('COV\'s own move differing from BASE\'s');
  cases.push(['the gate refuses a missing table read in item 3', String(G({ nullRead: true }).length > 0), 'true']);
  cases.push(['BASE\'s signs not shown on noise (+-0.05) never reads HELD', Rd({ noisy3: true }).three.v === 'HELD' ? 'HELD' : 'not HELD', 'not HELD']);
  { const lines = []; reading(builtFiles({ keep: 1, q: 0.1 }), parse(builtLog({})), l => lines.push(l)); const o = lines.find(l => /^\nOUTCOME:/.test(l)); cases.push(['the OUTCOME line the scorecard reads', o && o.trim(), 'OUTCOME: 1 HELD; 2 FALSIFIED; 3 FALSIFIED']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
export { builtLog, built };
const readGz = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3].map(k => `OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagxasr2'), npw = Number(args[1] || NPW), pts = args[2] || PTS, PRE = process.argv.includes('--preflight');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (units.filter(u => u.done).length < UNITS.length) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} households done in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw }), files = {};
  const X = bad.length || PRE ? null : xasFiles();
  if (X && X.bad.length) bad.push(...X.bad.map(x => `XAS's own gate: ${x}`));
  if (!bad.length) {
    const st = stampOf(Object.values(logs)[0]);
    // the preflight (another grid and path count) cannot meet XAS's reads: its files are checked without the identity
    for (const u of units.filter(x => !x.plant)) { const t = readGz(join(DIR, fileOf(u.id))); bad.push(...(PRE ? checkFile(t, u, st, { t: t ? t.t : [], k: t ? t.k : [], p: t ? t.p : [], arms: t ? t.arms : {} }, npw) : checkFile(t, u, st, X.files[u.id], npw))); files[u.id] = t; }
    if (!PRE) bad.push(...openCheck(units.find(u => u.id === 'S126'), X.s126));
    if (!bad.length && !PRE) bad.push(...guard(files));
  }
  if (bad.length) { console.log(`GATE: FAILED - NOT SETTLED\n  ${bad.join('\n  ')}`); process.exit(1); }
  if (PRE) { console.log(`PREFLIGHT: the gate and the files passed (the identity, S126's openings and the guard are the full run's); planted checks ${np}; no figure is read`); process.exit(0); }
  console.log(`GATE: passed - ${UNITS.length} households once and done at XAS's unit; every self-check passed on something, per arm; every read and ex5 is XAS's at the same path, world and year (XAS's files through their own gate); S126's openings are XAS's; the BASE guard on vb holds`);
  console.log(`planted checks: ${np}`);
  reading(files, units);
}
