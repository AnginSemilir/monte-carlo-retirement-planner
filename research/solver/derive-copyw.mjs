/*
 * COPY-W'S DERIVATION, STAGE A (predictions/diag-copyw.md; the deep review after COPY-X, deep-review-log.md 19 Oct 09:44 UK):
 * the records (COPY-X's C and CX behind COPY-X's gate, results/diagcopyx; STEP-S370's W60 behind STEP-S370's gate,
 * results/diagsteps370, which CW must reproduce bit for bit, so CW enters as recorded: its tables, runs, residuals by path and
 * its harm read against C, reported, not an item); the additive prediction for CXW path by path (CX's residual plus W60's change on C); the
 * judged stories below for what the additive prediction leaves (the interaction and the spread); the power of items 1 to 5
 * through reduce-copyw.mjs's own items(); the credences from the receipt's CXW1 and CXG0 CAUSE CREDENCES (read from the
 * log) through the stories, as stated (section 3), at the lead rate's lower bound (section 3b, the registered ones) and at the
 * settled-since rate (section 3c), both read from results-scorecard.txt's LEAD RATE BY POPULATION; the decision rows; the
 * points and 80% intervals; the budget.
 *   node research/solver/derive-copyw.mjs [--records] > research/solver/results-derive-copyw.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, rowOf, NPW } from './reduce-copyw.mjs';
import { cellsOf, wsOf, share, harmWorlds } from './reduce-copyx.mjs';

// THE JUDGED INPUTS (committed before this script's output and before any COPY-W run; grade D throughout). Item 1 by the
// receipt's CXW1 causes (AXIS: the 30-point wealth axis carries CX's world-1 under-read; SPACE: the blend's probability space;
// COPY: the copy rule's own; OTHER); the world-0 interaction by its CXG0 causes (WAXIS: the wealth axis takes CX's world-0 gap
// down, as the review's counterfactual has it; FORM: the copy rule's step-year remainder survives 60 points; OTHER).
export const JUDGED = {
  // the share of CX's world-1 years-4-6 residual CXW removes: under AXIS, the additive prediction's share (W60's change on C
  // carried to CX, read from the records) times a factor; under the others, a share of its own
  r1: {
    AXIS: { 'x0.75': 0.25, x1: 0.5, 'x1.15': 0.25 },
    SPACE: { 0: 0.5, 0.15: 0.5 },
    COPY: { 0: 0.5, 0.2: 0.5 },
    OTHER: { 0: 0.3, 0.3: 0.4, 0.6: 0.3 },
  },
  // the interaction (CXW - CW) - (CX - C) in the grid residual GB + GA and in the table less runs, world 0, points: under WAXIS
  // about the review's counterfactual (-0.94, backups held, grade C); under the others near nil
  i0: { WAXIS: { '-1.4': 0.25, '-0.94': 0.5, '-0.5': 0.25 }, FORM: { '-0.3': 0.5, 0: 0.5 }, OTHER: { '-0.6': 0.3, 0: 0.4, 0.6: 0.3 } },
  // the same in worlds 1 and 2 (the review's counterfactual +0.16 and +0.23), every cause alike
  i1: { 0: 0.5, 0.16: 0.5 },
  i2: { 0: 0.5, 0.23: 0.5 },
  // under FORM, the step-year remainder the wealth fix leaves beyond the additive prediction in world 0 (points)
  form0: { 0.5: 0.5, 1: 0.5 },
  // the per-path spread of CXW's residuals beyond the additive prediction, as a multiple of the per-path sd of W60's change on C
  noise: { 0.5: 0.3, 1: 0.4, 1.5: 0.3 },
  // CXW's paths flipped against CW, as a multiple of CX's flips against C by world (lost and saved alike)
  flips: { 0.75: 0.25, 1: 0.5, 1.5: 0.25 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 7; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const pickN = dist => Number(pick(dist));
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
const dec = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; }, sdOf = a => { const m = mean(a); let v = 0; for (const x of a) v += (x - m) ** 2; return Math.sqrt(v / (a.length - 1)); };
const tablesFromLog = (text, label) => [0, 1, 2].map(k => { const m = new RegExp(`tables ${label.replace(/[/]/g, '\\/')} ${k} z \\S+ weight \\S+: OWN (\\S+) READ`).exec(text); return m ? Number(m[1]) : NaN; });
const K = [0, 1, 2];

// 1. THE RECORDS
const gx = spawnSync('node', [join(HERE, 'reduce-copyx.mjs'), R_('diagcopyx')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!/^GATE: passed/m.test(gx)) { console.log('COPY-X\'s files did not pass COPY-X\'s gate'); process.exit(1); }
const gs = spawnSync('node', [join(HERE, 'reduce-steps370.mjs'), R_('diagsteps370')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!/^GATE: passed/m.test(gs)) { console.log('STEP-S370\'s files did not pass STEP-S370\'s gate'); process.exit(1); }
const logsOf = d => readdirSync(R_(d)).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_(d), f), 'utf8'));
const xl = logsOf('diagcopyx'), sl = logsOf('diagsteps370');
const logOf = (logs, lab) => logs.find(t => new RegExp(`^S370\\s+case \\| job ${lab.replace(/[/]/g, '\\/')} \\|`, 'm').test(t)) || '';
const SRC = { C: ['diagcopyx', 'S370-C-P30S6Q5.json.gz', logOf(xl, 'C/P30S6Q5'), 'C/P30S6Q5'], CX: ['diagcopyx', 'S370-CX-P30S6Q5.json.gz', logOf(xl, 'CX/P30S6Q5'), 'CX/P30S6Q5'], CW: ['diagsteps370', 'S370-W60-P60S6Q5.json.gz', logOf(sl, 'W60/P60S6Q5'), 'W60/P60S6Q5'] };
const F = Object.fromEntries(Object.entries(SRC).map(([a, [d, f]]) => [a, ld(join(R_(d), f))]));
const TAB = Object.fromEntries(Object.entries(SRC).map(([a, [, , log, lab]]) => [a, tablesFromLog(log, lab)]));
const N = F.C.NPW;
const P100 = (a, x, k) => Float64Array.from(dec(F[a].per[`${x}${k}`]), v => 100 * v);
const G = a => K.map(k => { const gb = P100(a, 'GB', k), ga = P100(a, 'GA', k); return Float64Array.from(gb, (v, i) => v + ga[i]); });
const Y456 = a => { const y4 = P100(a, 'Y4', 1), y5 = P100(a, 'Y5', 1), y6 = P100(a, 'Y6', 1); return Float64Array.from(y4, (v, i) => v + y5[i] + y6[i]); };
const BITS = a => K.map(k => dec8(F[a].bits[`OWN${k}`])), WS = a => K.map(k => dec(F[a].per[`WS${k}`]));
const g = { C: G('C'), CX: G('CX'), CW: G('CW') }, y = { C: Y456('C'), CX: Y456('CX'), CW: Y456('CW') }, b = { C: BITS('C'), CX: BITS('CX'), CW: BITS('CW') }, w = { C: WS('C'), CX: WS('CX'), CW: WS('CW') };
if (N !== NPW || F.CX.NPW !== N || F.CW.NPW !== N || F.C.seed !== F.CW.seed || ![...TAB.C, ...TAB.CX, ...TAB.CW].every(Number.isFinite)) { console.log('the records did not read'); process.exit(1); }
console.log('COPY-W\'S DERIVATION, STAGE A (predictions/diag-copyw.md)\n\n1. THE RECORDS');
console.log(`  S370, seed ${F.C.seed}, ${N} paths a world: COPY-X's C and CX behind COPY-X's gate; STEP-S370's W60 behind STEP-S370's gate, which CW must reproduce bit for bit (it enters as CW)`);
for (const a of ['C', 'CX', 'CW']) console.log(`  ${a}: tables ${TAB[a].map(f4).join(', ')}; runs ${b[a].map(cnt).join(', ')} of ${N}; grid residual GB + GA by world ${g[a].map(x => f4(mean(x))).join(', ')}; world-1 years 4-6 ${f4(mean(y[a]))}`);
// CW's leg of item 5, known from the records
const hCW = harmWorlds(K.map(k => cellsOf(b.C[k], b.CW[k])), K.map(k => wsOf(w.C[k], w.CW[k])));
console.log(`  CW against C by world, lost and saved: ${K.map(k => { let l = 0, s2 = 0; for (let j = 0; j < N; j++) { if (b.C[k][j] && !b.CW[k][j]) l++; else if (!b.C[k][j] && b.CW[k][j]) s2++; } return `${l} lost, ${s2} saved`; }).join('; ')}; the guarded unconditional survival interval by world ${hCW.per.map(x => `(${f4(x.u.lo)} to ${f4(x.u.hi)})`).join(', ')}`);
console.log(`  CW against C (reported, not an item: CW is W60, so this leg is known before the run): ${hCW.outcome}; ${hCW.per.map(x => `world ${x.k} survival ${f4(x.ex.d)} (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, whole score ${f4(x.w.d)} (${f4(x.w.lo)} to ${f4(x.w.hi)}), margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`).join('; ')}`);
// the additive prediction for CXW, path by path: CX plus W60's change on C
const gAdd = K.map(k => Float64Array.from(g.CX[k], (v, i) => v + g.CW[k][i] - g.C[k][i])), yAdd = Float64Array.from(y.CX, (v, i) => v + y.CW[i] - y.C[i]);
const rC = share(y.C, Float64Array.from(y.C, (v, i) => v - y.CW[i])), rAdd = share(y.CX, Float64Array.from(y.CX, (v, i) => v - yAdd[i]));
const sdW = K.map(k => sdOf(Float64Array.from(g.CW[k], (v, i) => v - g.C[k][i]))), sdY = sdOf(Float64Array.from(y.CW, (v, i) => v - y.C[i]));
console.log(`  the PRIOR (records, grade B for S370): W60 removes ${f4(rC.R)} (${f4(rC.lo)} to ${f4(rC.hi)}) of C's world-1 years-4-6 residual (${f4(mean(y.C))} points); carried to CX additively it removes ${f4(rAdd.R)} of CX's (${f4(mean(y.CX))})`);
console.log(`  the additive prediction for CXW's grid residual GB + GA by world: ${gAdd.map(x => f4(mean(x))).join(', ')} (CX's plus W60's change on C, path by path); the per-path sd of W60's change on C ${sdW.map(f4).join(', ')}, at years 4-6 in world 1 ${f4(sdY)}`);
const disc = K.map(k => { let lost = 0, saved = 0; for (let i = 0; i < N; i++) { if (b.C[k][i] && !b.CX[k][i]) lost++; else if (!b.C[k][i] && b.CX[k][i]) saved++; } return { lost, saved }; });
console.log(`  CX against C, lost and saved by world: ${disc.map(x => `${x.lost} lost, ${x.saved} saved`).join('; ')}`);
if (process.argv.includes('--records')) process.exit(0);

// a synthetic read at a story's values in reduce-copyw.mjs items()'s shape
const pickIdx = (bits, want, m) => { const ix = []; for (let i = 0; i < N; i++) if (bits[i] === want) ix.push(i); m = Math.min(m, ix.length); for (let j = 0; j < m; j++) { const r = j + Math.floor(rnd() * (ix.length - j)); [ix[j], ix[r]] = [ix[r], ix[j]]; } return ix.slice(0, m); };
function setOf({ r1, i, form0, noise, flips }) {
  const y456CXW = Float64Array.from(y.CX, (v, j) => (1 - r1) * v + noise * sdY * gauss());
  // the slice is part of world 1's whole (the plan-auditor's BLOCKING 1 of 19 Oct 11:20 UK): CXW's years 4-6 apart from the
  // additive prediction carry into world 1's grid residual path by path and into its table
  const dY = Float64Array.from(y456CXW, (v, j) => v - yAdd[j]), mdY = mean(dY);
  const gCXW = K.map(k => Float64Array.from(gAdd[k], (v, j) => v + i[k] + (k === 0 ? form0 : 0) + (k === 1 ? dY[j] : 0) + noise * sdW[k] * gauss()));
  const bCXW = [], wCXW = [];
  for (const k of K) {
    const bb = Uint8Array.from(b.CW[k]), ww = Float64Array.from(w.CW[k], v => v + 0.3 * gauss());
    for (const j of pickIdx(b.CW[k], 1, pois(flips * disc[k].lost))) { bb[j] = 0; ww[j] -= 100; }
    for (const j of pickIdx(b.CW[k], 0, pois(flips * disc[k].saved))) { bb[j] = 1; ww[j] += 100; }
    bCXW.push(bb); wCXW.push(ww);
  }
  // CXW's tables: additive, plus the story's interaction in table less runs (i), plus the runs' own interaction, so that
  // item 4 reads the story's interaction with the runs' noise of its paired paths
  const tCXW = K.map(k => { const m = (cnt(bCXW[k]) - cnt(b.CW[k]) - cnt(b.CX[k]) + cnt(b.C[k])) / N; return TAB.CX[k] + TAB.CW[k] - TAB.C[k] + i[k] + (k === 0 ? form0 : 0) + (k === 1 ? mdY : 0) + 100 * m; });
  return { y456: { CX: y.CX, CXW: y456CXW }, g: { CXW: gCXW }, tab: { C: TAB.C, CX: TAB.CX, CW: TAB.CW, CXW: tCXW }, bits: { C: b.C, CX: b.CX, CW: b.CW, CXW: bCXW },
    cells: { CW: K.map(k => cellsOf(b.C[k], b.CW[k])), CXW: K.map(k => cellsOf(b.CX[k], bCXW[k])) }, ws: { CW: K.map(k => wsOf(w.C[k], w.CW[k])), CXW: K.map(k => wsOf(w.CX[k], wCXW[k])) } };
}
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f2(c[x] / tot(c))}`).join(' ');
const BASE = { r1: rAdd.R, i: [0, 0, 0], form0: 0, noise: 1, flips: 1 };

// 2. THE POWER through items()
const DR = 40;
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-copyw.mjs's items(); C, CX and CW as recorded, ${N} paths a world)`);
for (const r of [0, 0.25, 0.4, 0.6, 0.8, 1.3, 2]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, r1: r }))['1'].outcome]++; console.log(`  item 1, CXW removes ${r} of CX's world-1 years-4-6 residual (world 1's whole moving with it): ${row(c)}`); }
{ const R = { R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, else: 0 }; for (const r of [1.3, 2]) for (let q = 0; q < DR; q++) R[rowOf(items(setOf({ ...BASE, r1: r })))]++; console.log(`  the rows at removals of 1.3 and 2 (an over-correction past the whole; no JUDGED story reaches it, the largest 0.868): ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / (2 * DR))}`).join(', ')}`); }
for (const d of [-1.5, -0.6, 0, 0.6]) { const c2 = cnt3(), c3 = cnt3(); for (let q = 0; q < DR; q++) { const it = items(setOf({ ...BASE, i: [d, d, 0] })); c2[it['2'].outcome]++; c3[it['3'].outcome]++; } console.log(`  items 2 and 3, the interaction ${d} in worlds 0 and 1 on the additive prediction: item 2 ${row(c2)} | item 3 ${row(c3)}`); }
for (const d of [-1, -0.5, -0.25, 0, 0.3]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, i: [d, 0, 0] }))['4'].outcome]++; console.log(`  item 4, the interaction ${d} in world 0 (nil in worlds 1 and 2): ${row(c)}`); }
for (const fl of [0.75, 1, 1.5]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, flips: fl }))['5'].outcome]++; console.log(`  item 5, CXW's flips against CW ${fl} times CX's against C: ${row(c)}`); }

// 3. THE CREDENCES
const RECEIPT = '19 Oct 09:44 UK', logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => l.startsWith(`- ${RECEIPT} |`)) || '';
const credLine = (/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1];
const setFrom = pre => Object.fromEntries([...credLine.matchAll(new RegExp(`${pre}-([A-Z]+)=([0-9.]+)`, 'g'))].map(m => [m[1], Number(m[2])]));
const c1 = setFrom('CXW1'), c0 = setFrom('CXG0'), sumOf = c => Object.values(c).reduce((a, x) => a + x, 0);
if (Object.keys(c1).length !== 4 || Object.keys(c0).length !== 3 || Math.abs(sumOf(c1) - 1) > 0.02 || Math.abs(sumOf(c0) - 1) > 0.02 || Object.keys(c1).some(k => !JUDGED.r1[k]) || Object.keys(c0).some(k => !JUDGED.i0[k])) { console.log(`the receipt's CAUSE CREDENCES did not read (${credLine.slice(0, 200)})`); process.exit(1); }
const LEAD = { 1: 'AXIS', 0: 'WAXIS' };
const ND = 2000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
function credences(m1, m0) {
  const I = { 1: cnt3(), 2: cnt3(), 3: cnt3(), 4: cnt3(), 5: cnt3() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, else: 0 }, pt = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (let q = 0; q < ND; q++) {
    const k1 = pickC(m1), k0 = pickC(m0), r1s = pick(JUDGED.r1[k1]);
    const r1 = r1s.startsWith('x') ? rAdd.R * Number(r1s.slice(1)) : Number(r1s);
    const story = { r1, i: [pickN(JUDGED.i0[k0]), pickN(JUDGED.i1), pickN(JUDGED.i2)], form0: k0 === 'FORM' ? pickN(JUDGED.form0) : 0, noise: pickN(JUDGED.noise), flips: pickN(JUDGED.flips) };
    const it = items(setOf(story));
    for (const i of ['1', '2', '3', '4', '5']) I[i][it[i].outcome]++;
    R[rowOf(it)]++;
    pt[1].push(it['1'].r.R); pt[2].push(it['2'].c.d); pt[3].push(it['3'].c.d); pt[4].push(it['4'].per[0].d); pt[5].push(it['5'].hx.per[0].ex.d);
  }
  return { I, R, pt };
}
const WHAT = { 1: 'the share of CX\'s world-1 years-4-6 residual CXW removes', 2: 'CXW\'s world-1 grid residual GB + GA, points', 3: 'CXW\'s world-0 grid residual GB + GA, points', 4: 'the interaction in world 0\'s table less runs, points', 5: 'CXW\'s survival change against CX in world 0, points' };
const show = ({ I, R, pt }, tag) => {
  for (const i of ['1', '2', '3', '4', '5']) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  for (const i of ['1', '2', '3', '4', '5']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
  if (tag) for (const i of ['1', '2', '3', '4', '5']) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);
};
console.log(`\n3. THE CREDENCES AS THE RECEIPT STATES THEM (the receipt of ${RECEIPT}: ${Object.entries(c1).map(([k, v]) => `CXW1-${k}=${v}`).join('; ')}; ${Object.entries(c0).map(([k, v]) => `CXG0-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(c1, c0), '');
const lp = /LEAD RATE BY POPULATION: .*?settled since (\d+) of (\d+) \(Laplace ([0-9.]+)\);.*? counted not held, (\d+) of (\d+) \(Laplace ([0-9.]+)\)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!lp) { console.log('the scorecard\'s LEAD RATE BY POPULATION did not read (results-scorecard.txt)'); process.exit(1); }
const atRate = (c, top, rate) => { const rest = sumOf(c) - c[top]; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === top ? rate : v * (1 - rate) / rest])); };
const lower = Number(lp[6]), since = Number(lp[3]);
console.log(`\n3b. THE CREDENCES WITH EACH QUESTION'S LEADING CAUSE AT THE LEAD RATE'S LOWER BOUND (results-scorecard.txt: ${lp[4]} of ${lp[5]}, Laplace ${lp[6]}; the registered ones; ${ND} draws through items())`);
show(credences(atRate(c1, LEAD[1], lower), atRate(c0, LEAD[0], lower)), 'CREDENCE ');
console.log(`\n3c. THE SAME AT THE SETTLED-SINCE RATE (results-scorecard.txt: ${lp[1]} of ${lp[2]}, Laplace ${lp[3]}; printed beside)`);
show(credences(atRate(c1, LEAD[1], since), atRate(c0, LEAD[0], since)), '');

// 4. THE BUDGET: STEP-S370's W60 on S370 at 60 points (solve and ledger seconds from its log); CXW solves as CW does
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const sW = num(/solve CAND W60\/P60S6Q5: table \S+ secs (\d+)/, SRC.CW[2]), lW = num(/checks W60\/P60S6Q5: ownTook .* secs (\d+)/, SRC.CW[2]);
if (![sW, lW].every(Number.isFinite)) { console.log('the budget\'s inputs did not read'); process.exit(1); }
console.log(`\n4. THE BUDGET (grade C: STEP-S370's W60, solve ${sW} s and ledger ${lW} s on 12,000 paths): CW and CXW about ${f2((sW + lW) / 3600)} h each, two jobs on two cores, the wall about ${f2((sW + lW) / 3600)} h, plus the split's share of the ledger (COPY-X's audit)`);
