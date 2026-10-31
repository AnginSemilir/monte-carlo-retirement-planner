/*
 * COPY-X'S DERIVATION (predictions/diag-copyx.md; the deep review after STEP-O182, deep-review-log.md 19 Oct 03:55 UK): the
 * records (STEP-O182's saved C and SNR on seed 7002 behind STEP-O182's gate: C's tables and runs by world, C's per-path GB and
 * SNR's per-path Y5 in world 0, C against SNR's discordance by world; C and SNR on the new code with the copy rule off
 * reproduce these bit for bit, the reducer's inert gate, so they enter the draws as recorded); the earlier measurement of the
 * mechanism (the receipt's one-year counterfactuals, backups held, read from the log, not typed: PRIOR); the power of items
 * 1-4 through reduce-copyx.mjs's own items(), each copy-rule arm's paths drawn from its control's saved paths (CX from C's,
 * SNRX from SNR's) with the copy rule's own flips, so item 4's legs (CX against C, SNRX against SNR) and the review's (SNRX
 * against C, carrying SNR's own discordance with C) read the same paths; the credences from the receipt's O186 and S370 CAUSE CREDENCES (read from the
 * log) through the judged stories below, as stated (section 3) and with each question's leading cause at the record's rate
 * (results-scorecard.txt, section 3b, the registered ones); the decision rows; the points and 80% intervals; the budget.
 *   node research/solver/derive-copyx.mjs > research/solver/results-derive-copyx.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, rowOf, item3Review, harmWorlds, cellsOf, wsOf, NPW } from './reduce-copyx.mjs';

// THE JUDGED INPUTS (committed before this script's output and before any COPY-X run; grade D throughout). Item 1 by the
// receipt's O186 causes (CFLAT: the copied corners' flat c; BLEND: the reader's probability blend along wealth; CHOOSER;
// OTHER); item 2 by its S370 causes (COPY: the copy at the top node, here its c; GRID; CLIP; OTHER). The two questions are
// drawn independently (the review reads them as one error, so the draws understate their correlation: declared).
export const JUDGED = {
  // the share of SNR's world-0 Y5 SNRX removes (CFLAT's from the PRIOR, the in-row extrapolation's one-year counterfactual,
  // shaded for the backups the full solve moves and for the arm's clip, [0, the source's c], against the review's [0, 1])
  r1: {
    CFLAT: { 0.35: 0.25, 0.55: 0.45, 0.75: 0.3 },
    BLEND: { 0: 0.5, 0.1: 0.5 },
    CHOOSER: { 0: 0.6, 0.1: 0.4 },
    OTHER: { 0: 0.3, 0.2: 0.4, 0.4: 0.3 },
  },
  // the share of C's world-0 GB CX removes (COPY's from the PRIOR, C's step years' counterfactual, which would take more than
  // the whole of GB with the other years held: shaded)
  r2: {
    COPY: { 0.6: 0.25, 0.9: 0.4, 1.1: 0.35 },
    GRID: { 0: 0.5, 0.1: 0.5 },
    CLIP: { 0: 0.6, 0.1: 0.4 },
    OTHER: { 0: 0.3, 0.3: 0.4, 0.6: 0.3 },
  },
  // the share of the removed residual that reappears elsewhere in world 0's table less runs, by the question's cause (the
  // leading cause's own, and one for the rest)
  move: { lead: { 0: 0.45, 0.4: 0.35, 0.8: 0.2 }, rest: { 0: 0.6, 0.5: 0.4 } },
  // an arm's survival change against C by world (points, every world alike), by the question's cause
  d4: { lead: { '-0.25': 0.25, 0: 0.5, 0.25: 0.25 }, rest: { '-0.1': 0.3, 0: 0.7 } },
  // the per-path spread of an arm's residual beyond its proportional part, as a multiple of the control's per-path spread
  noise: { 0.25: 0.3, 0.5: 0.4, 1: 0.3 },
  // an arm's discordant paths against C a world, as a share of 4p(1 - p) of the paths at C's survival p
  disc4: { 0.015: 0.3, 0.03: 0.4, 0.06: 0.3 },
  // the whole score's change less the survival change (points)
  wx4: { '-0.1': 0.2, 0: 0.6, 0.1: 0.2 },
  // the change in world 0's table less runs beyond the residual an arm removes (the other years and GA; points)
  gapEps: { '-1': 0.25, 0: 0.5, 1: 0.25 },
};
const LEAD = { 1: 'CFLAT', 2: 'COPY' };

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 1; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return Number(k); } return Number(Object.keys(dist).pop()); };
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
const dec = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const tablesFromLog = (text, label) => [0, 1, 2].map(k => { const m = new RegExp(`tables ${label.replace(/[/]/g, '\\/')} ${k} z \\S+ weight \\S+: OWN (\\S+) READ`).exec(text); return m ? Number(m[1]) : NaN; });
const mean = a => a.reduce((t, x) => t + x, 0) / a.length, sdOf = a => { const m = mean(a); return Math.sqrt(a.reduce((t, x) => t + (x - m) ** 2, 0) / (a.length - 1)); };

// 1. THE RECORDS: STEP-O182's saved C and SNR behind STEP-O182's gate
const gateOut = spawnSync('node', [join(HERE, 'reduce-o182.mjs'), R_('diago182')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!/^GATE: passed/m.test(gateOut)) { console.log('STEP-O182\'s files did not pass STEP-O182\'s gate'); process.exit(1); }
const slogs = readdirSync(R_('diago182')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('diago182'), f), 'utf8'));
const fC = ld(join(R_('diago182'), 'S370-C-P30S6Q5.json.gz')), fS = ld(join(R_('diago182'), 'S370-SNR-P30S6Q5.json.gz'));
const logC = slogs.find(t => /^S370\s+case \| job C\//m.test(t)) || '', logS = slogs.find(t => /^S370\s+case \| job SNR\//m.test(t)) || '';
const tC = tablesFromLog(logC, 'C/P30S6Q5'), tS = tablesFromLog(logS, 'SNR/P30S6Q5'), N = fC.NPW;
const bC = [0, 1, 2].map(k => dec8(fC.bits[`OWN${k}`])), bS = [0, 1, 2].map(k => dec8(fS.bits[`OWN${k}`])), runC = bC.map(cnt), runS = bS.map(cnt);
const wC = [0, 1, 2].map(k => dec(fC.per[`WS${k}`])), wS = [0, 1, 2].map(k => dec(fS.per[`WS${k}`]));
const discCSdir = [0, 1, 2].map(k => { let lost = 0, saved = 0; for (let i = 0; i < N; i++) { if (bC[k][i] && !bS[k][i]) lost++; else if (!bC[k][i] && bS[k][i]) saved++; } return { lost, saved }; });
const gbC = Float64Array.from(dec(fC.per.GB0), v => 100 * v), y5S = Float64Array.from(dec(fS.per.Y50), v => 100 * v);
const mGB = mean(gbC), sGB = sdOf(gbC), mY5 = mean(y5S), sY5 = sdOf(y5S), gapC = tC[0] - 100 * runC[0] / N, gapS = tS[0] - 100 * runS[0] / N;
const discCS = [0, 1, 2].map(k => { let n = 0; for (let i = 0; i < N; i++) if (bC[k][i] !== bS[k][i]) n++; const p = runC[k] / N; return { n, share: n / (N * 4 * p * (1 - p)) }; });
if (![...tC, ...tS, mGB, sGB, mY5, sY5, gapC, gapS].every(Number.isFinite) || N !== NPW) { console.log('the records did not read'); process.exit(1); }
console.log('COPY-X\'S DERIVATION (predictions/diag-copyx.md)\n\n1. THE RECORDS');
console.log(`  S370, STEP-O182's C and SNR (the candidate as it stands, seed 7002, ${N} paths a world, behind STEP-O182's gate): C's tables ${tC.map(f4).join(', ')}, runs ${runC.join(', ')} of ${N}; world 0's table less runs C ${f4(gapC)}, SNR ${f4(gapS)}`);
console.log(`  C's world-0 GB per path: mean ${f4(mGB)} points, sd ${f4(sGB)}; SNR's world-0 Y5 per path: mean ${f4(mY5)} points, sd ${f4(sY5)}`);
console.log(`  C against SNR, discordant runs by world: ${discCS.map(x => `${x.n} (${f4(x.share)} of 4p(1 - p) of the paths)`).join(', ')}; SNR's lost and saved against C by world: ${discCSdir.map(x => `${x.lost} lost, ${x.saved} saved`).join('; ')}`);
console.log(`  SNR's runs by world ${runS.join(', ')} of ${N}; SNR less C, the whole score by world: ${[0, 1, 2].map(k => f4(wsOf(wC[k], wS[k]).d)).join(', ')} points`);
console.log('  stated (grade A by the reducer\'s inert gate once read): C and SNR on the new code with the copy rule off reproduce these bit for bit, so they enter the draws as they are');

// THE PRIOR: the receipt's one-year counterfactuals, backups held (read from the log)
const RECEIPT = '19 Oct 03:55 UK', logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => l.startsWith(`- ${RECEIPT} |`)) || '';
const p1 = /takes SNR's Y5 from ([0-9.]+) to ([0-9.]+), an in-row linear extrapolation to ([0-9.]+)/.exec(logT), p2 = /Y3 ([0-9.-]+) to ([0-9.-]+), Y7 ([0-9.-]+) to ([0-9.-]+)/.exec(logT);
if (!p1 || !p2) { console.log('the receipt\'s counterfactual figures did not read'); process.exit(1); }
const y5a = Number(p1[1]), y5x = Number(p1[3]), y3a = Number(p2[1]), y3x = Number(p2[2]), y7a = Number(p2[3]), y7x = Number(p2[4]);
console.log(`  the PRIOR (the receipt of ${RECEIPT}, grade C, one-year counterfactuals with the backups held, its clip [0, 1]): the in-row extrapolation takes SNR's world-0 Y5 from ${y5a} to ${y5x} (a removal of ${f2((y5a - y5x) / y5a)}), and C's Y3 from ${y3a} to ${y3x} and Y7 from ${y7a} to ${y7x} (${f2(y3a + y7a - y3x - y7x)} points of C's world-0 GB of ${f2(mGB)}, ${f2((y3a + y7a - y3x - y7x) / mGB)} of it with the other years held)`);

// a synthetic read at a story's values, in reduce-copyx.mjs items()'s shape (C's GB, SNR's Y5 and C's runs as recorded)
const cellsFrom = (cCtrl, lost, saved) => ({ a: cCtrl - lost, b: lost, c: saved, d: N - cCtrl - saved });
// the second output's draw, kept for comparison: an arm's cells against C from C's runs with fresh flips (SNRX's too)
function armCells(d4, disc4, wx4) {
  const cells = [], ws = [];
  for (let k = 0; k < 3; k++) {
    const cC = runC[k], pC = cC / N, n = disc4 * N * 4 * pC * (1 - pC), net = d4 / 100 * N;
    let lost = pois(Math.max(0, (n - net) / 2)), saved = pois(Math.max(0, (n + net) / 2)); lost = Math.min(lost, cC); saved = Math.min(saved, N - cC);
    cells.push(cellsFrom(cC, lost, saved)); const dd = (saved - lost) / N; ws.push({ d: 100 * dd + wx4, se: Math.sqrt(Math.max(1e-12, ((lost + saved) / N - dd * dd) * 1e4 + 0.09) / N) });
  }
  return { cells, ws };
}
// a copy-rule arm's paths from its control's saved paths: the judged d4 and disc4 read as the copy rule's own change against
// the arm's control (for CX its control is C, as judged); lost paths drawn among the control's survivors and saved ones among
// its failures, each flip 100 points of the whole score, plus wx4 and a 0.3-point spread a path
const pickIdx = (bits, want, m) => { const ix = []; for (let i = 0; i < N; i++) if (bits[i] === want) ix.push(i); m = Math.min(m, ix.length); for (let j = 0; j < m; j++) { const r = j + Math.floor(rnd() * (ix.length - j)); [ix[j], ix[r]] = [ix[r], ix[j]]; } return ix.slice(0, m); };
function armPaths(bCtl, wCtl, d4, disc4, wx4) {
  const bits = [], ws = [];
  for (let k = 0; k < 3; k++) {
    const cC = cnt(bCtl[k]), pC = cC / N, n = disc4 * N * 4 * pC * (1 - pC), net = d4 / 100 * N;
    const lost = pois(Math.max(0, (n - net) / 2)), saved = pois(Math.max(0, (n + net) / 2)), b = Uint8Array.from(bCtl[k]), w = Float64Array.from(wCtl[k], v => v + wx4 + 0.3 * gauss());
    for (const i of pickIdx(bCtl[k], 1, lost)) { b[i] = 0; w[i] -= 100; }
    for (const i of pickIdx(bCtl[k], 0, saved)) { b[i] = 1; w[i] += 100; }
    bits.push(b); ws.push(w);
  }
  return { bits, ws };
}
function setOf({ r1, r2, moveX, moveS, d4X, d4S, noise, disc4, wx4, epsX, epsS }) {
  const y5X = y5S.map(v => (1 - r1) * v + noise * sY5 * gauss()), gbX = gbC.map(v => (1 - r2) * v + noise * sGB * gauss());
  const ax = armPaths(bC, wC, d4X, disc4, wx4), as = armPaths(bS, wS, d4S, disc4, wx4);
  // an arm's world-0 table less runs: its control's, less the residual it removes and does not move elsewhere, plus the other
  // years' change; its table set from its runs
  const gapX = gapC - r2 * mGB * (1 - moveX) + epsX, gapSX = gapS - r1 * mY5 * (1 - moveS) + epsS;
  const tabOf = (gap, bits) => 100 * cnt(bits) / N + gap, K = [0, 1, 2];
  return { y5: { SNR: y5S, SNRX: y5X }, gb: { C: gbC, CX: gbX }, cells: { CX: K.map(k => cellsOf(bC[k], ax.bits[k])), SNRX: K.map(k => cellsOf(bS[k], as.bits[k])) }, ws: { CX: K.map(k => wsOf(wC[k], ax.ws[k])), SNRX: K.map(k => wsOf(wS[k], as.ws[k])) }, tab: { C: tC[0], CX: tabOf(gapX, ax.bits[0]), SNRX: tabOf(gapSX, as.bits[0]) }, vsC: { cells: K.map(k => cellsOf(bC[k], as.bits[k])), ws: K.map(k => wsOf(wC[k], as.ws[k])) }, story: { d4S, disc4, wx4 } };
}
// item 4 as the review set it (CX and SNRX each against C) on the same paths, and the second output's draw (SNRX's cells
// against C from C's runs, not SNR's) beside
const item4Of = (hx, hs) => (hx.outcome === 'FALSIFIED' || hs.outcome === 'FALSIFIED' ? 'FALSIFIED' : hx.outcome === 'HELD' && hs.outcome === 'HELD' ? 'HELD' : 'INCONCLUSIVE');
const item4Review = (P, it) => item4Of(it['4'].hx, harmWorlds(P.vsC.cells, P.vsC.ws));
const item4Second = (P, it) => { const o = armCells(P.story.d4S, P.story.disc4, P.story.wx4); return item4Of(it['4'].hx, harmWorlds(o.cells, o.ws)); };
const rowWith = (it, o4) => rowOf({ ...it, 4: { ...it['4'], outcome: o4 } });
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');
const BASE = { r1: 0.55, r2: 0.9, moveX: 0, moveS: 0, d4X: 0, d4S: 0, noise: 0.5, disc4: 0.03, wx4: 0, epsX: 0, epsS: 0 };

// 2. THE POWER through items()
const DR = 40;
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-copyx.mjs's items(); C's GB, SNR's Y5 and C's runs as recorded, ${N} paths a world)`);
for (const r of [0, 0.25, 0.4, 0.55, 0.75]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, r1: r }))['1'].outcome]++; console.log(`  item 1, SNRX removes ${r} of SNR's Y5 (noise x0.5): ${row(c)}`); }
for (const nz of [0.25, 1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, noise: nz, r1: 0.6 }))['1'].outcome]++; console.log(`  item 1, a removal of 0.6, noise x${nz}: ${row(c)}`); }
for (const r of [0, 0.25, 0.4, 0.6, 0.9]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, r2: r }))['2'].outcome]++; console.log(`  item 2, CX removes ${r} of C's GB: ${row(c)}`); }
// item 3 as registered (CX against C) beside the review's reading (the better arm's), on the same draws
for (const [r2, r1, mv] of [[0.3, 0.2, 0], [0.5, 0.3, 0], [0.9, 0.55, 0], [0.9, 0.55, 0.4], [0.9, 0.55, 0.8], [0, 0.55, 0]]) { const c = cnt3(), cr = cnt3(); for (let q = 0; q < DR; q++) { const P = setOf({ ...BASE, r1, r2, moveX: mv, moveS: mv }); c[items(P)['3'].outcome]++; cr[item3Review(P)]++; } console.log(`  item 3, CX removes ${r2} of GB and SNRX ${r1} of Y5, ${mv} of each moving elsewhere: ${row(c)} | the review's reading: ${row(cr)}`); }
for (const v of [-0.6, -0.25, 0, 0.25]) { const c = cnt3(), cr = cnt3(), co = cnt3(); for (let q = 0; q < DR; q++) { const P = setOf({ ...BASE, d4X: v, d4S: v }), it = items(P); c[it['4'].outcome]++; cr[item4Review(P, it)]++; co[item4Second(P, it)]++; } console.log(`  item 4, the copy rule's survival change ${v} a world against each arm's control (discordance 0.03 of 4p(1 - p)): ${row(c)} | the review's legs (SNRX against C, from SNR's saved paths): ${row(cr)} | the second output's draw (SNRX against C from C's runs): ${row(co)}`); }

// 3. THE CREDENCES: the receipt's O186 and S370 sets through the judged stories, each draw read through items()
const credLine = (/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1];
const setFrom = pre => Object.fromEntries([...credLine.matchAll(new RegExp(`${pre}-([A-Z]+)=([0-9.]+)`, 'g'))].map(m => [m[1], Number(m[2])]));
const c1 = setFrom('O186'), c2 = setFrom('S370'), sumOf = c => Object.values(c).reduce((a, b) => a + b, 0);
for (const [c, J] of [[c1, JUDGED.r1], [c2, JUDGED.r2]]) if (Object.keys(c).length !== 4 || Math.abs(sumOf(c) - 1) > 0.02 || Object.keys(c).some(k => !J[k])) { console.log(`the receipt's CAUSE CREDENCES did not read (${credLine.slice(0, 200)})`); process.exit(1); }
const ND = 2000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
function credences(m1, m2) {
  const I = { 1: cnt3(), 2: cnt3(), 3: cnt3(), 4: cnt3() }, I3r = cnt3(), I4r = cnt3(), I4o = cnt3(), R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, Rr = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = { 1: [], 2: [], 3: [], 4: [] }, ptS = [];
  for (let q = 0; q < ND; q++) {
    const k1 = pickC(m1), k2 = pickC(m2), l1 = k1 === LEAD[1] ? 'lead' : 'rest', l2 = k2 === LEAD[2] ? 'lead' : 'rest';
    const story = { r1: pick(JUDGED.r1[k1]), r2: pick(JUDGED.r2[k2]), moveS: pick(JUDGED.move[l1]), moveX: pick(JUDGED.move[l2]), d4S: pick(JUDGED.d4[l1]), d4X: pick(JUDGED.d4[l2]), noise: pick(JUDGED.noise), disc4: pick(JUDGED.disc4), wx4: pick(JUDGED.wx4), epsX: pick(JUDGED.gapEps), epsS: pick(JUDGED.gapEps) };
    const P = setOf(story), it = items(P);
    for (const i of ['1', '2', '3', '4']) I[i][it[i].outcome]++;
    I3r[item3Review(P)]++;
    const o4r = item4Review(P, it); I4r[o4r]++; I4o[item4Second(P, it)]++; Rr[rowWith(it, o4r)]++; ptS.push(it['4'].hs.per[2].ex.d);
    R[rowOf(it)]++;
    pt[1].push(it['1'].r.R); pt[2].push(it['2'].r.R); pt[3].push(it['3'].dr.d); pt[4].push(it['4'].hx.per[0].ex.d);
  }
  return { I, I3r, I4r, I4o, R, Rr, pt, ptS };
}
const WHAT = { 1: 'the share of SNR\'s world-0 Y5 SNRX removes', 2: 'the share of C\'s world-0 GB CX removes', 3: 'CX\'s drop in world 0\'s table less runs against C, points', 4: 'CX\'s survival change against C in world 0, points' };
const show = ({ I, I3r, I4r, I4o, R, Rr, pt, ptS }, tag) => {
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  item 3 as the review set it (the better arm's, 97.5% intervals), on the same draws: ${row(I3r)}`);
  console.log(`  item 4 as the review set it (SNRX against C, its paths from SNR's saved ones), on the same draws: ${row(I4r)}; the second output's draw (SNRX against C from C's runs): ${row(I4o)}`);
  console.log(`  the SNRX leg's world-2 survival change against SNR, points: median ${f4(qa(ptS, 0.5))}, 80% interval ${f4(qa(ptS, 0.1))} to ${f4(qa(ptS, 0.9))}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}; with item 4 as the review set it: ${Object.entries(Rr).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  console.log(`  escalation trigger 3 (a run over 2 hours with the 'else' row at 0.6 or more): else ${f2(R.else / ND)}`);
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
  for (const i of ['1', '2', '3', '4']) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);
};
console.log(`\n3. THE CREDENCES AS THE RECEIPT STATES THEM (the receipt of ${RECEIPT}: ${Object.entries(c1).map(([k, v]) => `O186-${k}=${v}`).join('; ')}; ${Object.entries(c2).map(([k, v]) => `S370-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(c1, c2), '  as stated, ');
const sc = /an item leaning on a deep review's cause or story ([0-9.]+) \((\d+) of (\d+)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!sc) { console.log('the scorecard\'s lead rate did not read (results-scorecard.txt)'); process.exit(1); }
const lead = Number(sc[1]), atRate = (c, top) => { const rest = sumOf(c) - c[top]; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === top ? lead : v * (1 - lead) / rest])); };
const s1 = atRate(c1, LEAD[1]), s2 = atRate(c2, LEAD[2]);
console.log(`\n3b. THE CREDENCES WITH EACH QUESTION'S LEADING CAUSE AT THE RECORD'S RATE (results-scorecard.txt: ${sc[1]}, ${sc[2]} of ${sc[3]}; ${Object.entries(s1).map(([k, v]) => `O186-${k} ${f2(v)}`).join(', ')}; ${Object.entries(s2).map(([k, v]) => `S370-${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
show(credences(s1, s2), 'CREDENCE ');

// 4. THE BUDGET: STEP-O182's C and SNR on S370 at 30 points (solve and ledger seconds from their logs); CX solves as C does,
// SNRX as SNR; the four-way split as the three-way (judged)
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const sCs = num(/solve CAND C\/P30S6Q5: table \S+ secs (\d+)/, logC), lCs = num(/checks C\/P30S6Q5: ownTook .* secs (\d+)/, logC);
const sSs = num(/solve CAND SNR\/P30S6Q5: table \S+ secs (\d+)/, logS), lSs = num(/checks SNR\/P30S6Q5: ownTook .* secs (\d+)/, logS);
if (![sCs, lCs, sSs, lSs].every(Number.isFinite)) { console.log('the budget\'s inputs did not read'); process.exit(1); }
console.log(`\n4. THE BUDGET (grade C: STEP-O182's C, solve ${sCs} s and ledger ${lCs} s, and SNR, solve ${sSs} s and ledger ${lSs} s, on 12,000 paths): C and CX about ${f2((sCs + lCs) / 3600)} h each, SNR and SNRX about ${f2((sSs + lSs) / 3600)} h each; four jobs on four cores, the wall about ${f2(Math.max(sCs + lCs, sSs + lSs) / 3600)} h`);
