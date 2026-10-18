/*
 * STEP-O182'S DERIVATION (predictions/diag-o182.md; the deep review after STEP-S370, deep-review-log.md 18 Oct 22:45 UK): the
 * records (STEP-S370's saved C and SN on seed 7002 behind STEP-S370's gate: C's tables and runs by world, SN's per-path Y1 + Y5,
 * C against SN's discordance by world; C and SN on the new code with the option off reproduce these bit for bit, the reducer's
 * inert gate, so SN's residual and C's runs enter the draws as they are, not resampled); the earlier measurement of the
 * mechanism (the receipt's copied corners' I[R] against SN's Y1 at judged year-1 states, read from the log, not typed: PRIOR);
 * the power of items 1-4 through reduce-o182.mjs's own items(); the credences from the receipt's O182 CAUSE CREDENCES (read from
 * the log) through the judged stories below, as stated (section 3) and with the leading cause at the record's rate
 * (results-scorecard.txt, section 3b, the registered ones); the decision rows; the points and 80% intervals; the budget.
 *   node research/solver/derive-o182.mjs > research/solver/results-derive-o182.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, rowOf, NPW } from './reduce-o182.mjs';

// THE JUDGED INPUTS (committed before this script's output and before any STEP-O182 run; grade D throughout), by the receipt's
// O182 causes: RESID (a copied interior node's residual R carried unscaled into queries of higher chance), YB (the top-cell copy
// at the year before each step), TOP (the step reads' top node, still copied), GRID (the wealth axis at 30 points), OTHER.
export const JUDGED = {
  // the share of SN's world-0 Y1 + Y5 the copied corners' I[R] carries (RESID's from the PRIOR: the receipt's year-1 I[R]
  // against SN's Y1 at judged states, shaded for the states judged and year 5 unread)
  sRC: {
    RESID: { 0.6: 0.25, 0.8: 0.45, 0.95: 0.3 },
    YB: { 0.1: 0.3, 0.25: 0.4, 0.4: 0.3 },
    TOP: { 0: 0.5, 0.05: 0.5 },
    GRID: { 0: 0.3, 0.1: 0.4, 0.2: 0.3 },
    OTHER: { 0: 0.3, 0.25: 0.4, 0.5: 0.3 },
  },
  // the share of SN's world-0 Y1 + Y5 SNR removes (the policy re-solved under the scaled read)
  rSNR: {
    RESID: { 0.5: 0.25, 0.75: 0.4, 0.95: 0.35 },
    YB: { 0: 0.4, 0.15: 0.4, 0.3: 0.2 },
    TOP: { 0: 0.6, 0.05: 0.4 },
    GRID: { 0: 0.5, 0.1: 0.5 },
    OTHER: { 0: 0.3, 0.2: 0.4, 0.4: 0.3 },
  },
  // SNR's survival change against C by world (points, every world alike)
  d4: {
    RESID: { '-0.25': 0.25, 0: 0.5, 0.25: 0.25 },
    YB: { '-0.1': 0.3, 0: 0.7 },
    TOP: { '-0.1': 0.3, 0: 0.7 },
    GRID: { '-0.1': 0.3, 0: 0.7 },
    OTHER: { '-0.4': 0.25, 0: 0.5, 0.4: 0.25 },
  },
  // the per-path spread of the copied part and of SNR's residual beyond their proportional parts, as a multiple of SN's
  // per-path spread
  noise: { 0.25: 0.3, 0.5: 0.4, 1: 0.3 },
  // SNR's discordant paths against C a world, as a share of 4p(1 - p) of the paths at C's survival p (STEP-S370's SN against C
  // read 0.016 to 0.037 of it by world: the records, section 1)
  disc4: { 0.015: 0.3, 0.03: 0.4, 0.06: 0.3 },
  // the whole score's change less the survival change (points)
  wx4: { '-0.1': 0.2, 0: 0.6, 0.1: 0.2 },
  // the change in world 0's table less runs beyond the Y1 + Y5 SNR removes (the other years and the after-access part; points)
  gapEps: { '-1': 0.25, 0: 0.5, 1: 0.25 },
  // ADDED AFTER THE FIRST OUTPUT WAS SEEN (2b5b198, declared in the prediction): the share of the Y1 + Y5 SNR removes that
  // reappears elsewhere in world 0's table less runs (the over-read moved, not removed: STEP-S370's item 4 and its WHOLE
  // lesson, on record before that output; the first draw tied the gap to the slice one for one, so R2 could not be drawn)
  move: {
    RESID: { 0: 0.45, 0.4: 0.35, 0.8: 0.2 },
    YB: { 0: 0.6, 0.5: 0.4 },
    TOP: { 0: 0.6, 0.5: 0.4 },
    GRID: { 0: 0.6, 0.5: 0.4 },
    OTHER: { 0: 0.5, 0.5: 0.3, 1: 0.2 },
  },
};

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

// 1. THE RECORDS: STEP-S370's saved C and SN behind STEP-S370's gate
const gateOut = spawnSync('node', [join(HERE, 'reduce-steps370.mjs'), R_('diagsteps370')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!/^GATE: passed/m.test(gateOut)) { console.log('STEP-S370\'s files did not pass STEP-S370\'s gate'); process.exit(1); }
const slogs = readdirSync(R_('diagsteps370')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('diagsteps370'), f), 'utf8'));
const fC = ld(join(R_('diagsteps370'), 'S370-C-P30S6Q5.json.gz')), fS = ld(join(R_('diagsteps370'), 'S370-SN-P30S6Q5.json.gz'));
const logC = slogs.find(t => /^S370\s+case \| job C\//m.test(t)) || '', logS = slogs.find(t => /^S370\s+case \| job SN\//m.test(t)) || '';
const tC = tablesFromLog(logC, 'C/P30S6Q5'), tS = tablesFromLog(logS, 'SN/P30S6Q5'), N = fC.NPW;
const bC = [0, 1, 2].map(k => dec8(fC.bits[`OWN${k}`])), bS = [0, 1, 2].map(k => dec8(fS.bits[`OWN${k}`])), runC = bC.map(cnt), runS = bS.map(cnt);
const ySN = (() => { const u = dec(fS.per.Y10), v = dec(fS.per.Y50); return Float64Array.from(u, (x, i) => 100 * (x + v[i])); })();
const mY = mean(ySN), sY = sdOf(ySN), gapC = tC[0] - 100 * runC[0] / N, gapS = tS[0] - 100 * runS[0] / N;
const discCS = [0, 1, 2].map(k => { let n = 0; for (let i = 0; i < N; i++) if (bC[k][i] !== bS[k][i]) n++; const p = runC[k] / N; return { n, share: n / (N * 4 * p * (1 - p)) }; });
if (![...tC, ...tS, mY, sY, gapC, gapS].every(Number.isFinite) || N !== NPW) { console.log('the records did not read'); process.exit(1); }
console.log('STEP-O182\'S DERIVATION (predictions/diag-o182.md)\n\n1. THE RECORDS');
console.log(`  S370, STEP-S370's C and SN (the candidate as it stands, seed 7002, ${N} paths a world, behind STEP-S370's gate): C's tables ${tC.map(f4).join(', ')}, runs ${runC.join(', ')} of ${N}; world 0's table less runs C ${f4(gapC)}, SN ${f4(gapS)}`);
console.log(`  SN's world-0 Y1 + Y5 per path: mean ${f4(mY)} points, sd ${f4(sY)}`);
console.log(`  C against SN, discordant runs by world: ${discCS.map(x => `${x.n} (${f4(x.share)} of 4p(1 - p) of the paths)`).join(', ')}`);
console.log('  stated (grade A by the reducer\'s inert gate once read): C and SN on the new code with the option off reproduce these bit for bit, so they enter the draws as they are');

// THE PRIOR: the receipt's copied corners' I[R] against SN's Y1 at judged year-1 states (read from the log)
const RECEIPT = '18 Oct 22:45 UK', logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => l.startsWith(`- ${RECEIPT} |`)) || '';
const pm = /the copied corners' I\[R\] is ([0-9.]+), ([0-9.]+) and ([0-9.]+) against SN's Y1 of ([0-9.]+), ([0-9.]+) and ([0-9.]+)/.exec(logT);
if (!pm) { console.log('the receipt\'s I[R] figures did not read'); process.exit(1); }
const ir = [1, 2, 3].map(i => Number(pm[i])), y1r = [4, 5, 6].map(i => Number(pm[i]));
console.log(`  the PRIOR (the receipt of ${RECEIPT}, grade C: judged year-1 states, year 5 unread): the copied corners' I[R] ${ir.join(', ')} against SN's Y1 ${y1r.join(', ')} by world, shares ${ir.map((x, k) => f2(x / y1r[k])).join(', ')}; RESID's judged share centred below world 0's ${f2(ir[0] / y1r[0])} for year 5 unread`);

// a synthetic read at a story's values, in reduce-o182.mjs items()'s shape (SN's residual and C's runs as recorded)
const cellsFrom = (cCtrl, lost, saved) => ({ a: cCtrl - lost, b: lost, c: saved, d: N - cCtrl - saved });
function setOf({ sRC, rSNR, d4, noise, disc4, wx4, gapEps, move = 0 }) {
  const rc = ySN.map(v => sRC * v + noise * sY * gauss()), ySNR = ySN.map(v => (1 - rSNR) * v + noise * sY * gauss());
  const cells = [], ws = [];
  for (let k = 0; k < 3; k++) {
    // the discordance scales with the paths that can flip, 4p(1 - p) at C's survival p (DISCORD)
    const cC = runC[k], pC = cC / N, n = disc4 * N * 4 * pC * (1 - pC), net = d4 / 100 * N;
    let lost = pois(Math.max(0, (n - net) / 2)), saved = pois(Math.max(0, (n + net) / 2)); lost = Math.min(lost, cC); saved = Math.min(saved, N - cC);
    cells.push(cellsFrom(cC, lost, saved)); const dd = (saved - lost) / N; ws.push({ d: 100 * dd + wx4, se: Math.sqrt(Math.max(1e-12, ((lost + saved) / N - dd * dd) * 1e4 + 0.09) / N) });
  }
  // SNR's world-0 table less runs: SN's, less the Y1 + Y5 it removes and does not move elsewhere, plus the other years' change;
  // its table set from its runs
  const gapSNR = gapS - rSNR * mY * (1 - move) + gapEps, c0 = cells[0], runsSNR = 100 * (c0.a + c0.c) / N;
  return { y: { SN: ySN, SNR: ySNR }, rc, cells, ws, tab: { C: tC[0], SNR: runsSNR + gapSNR } };
}
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');
const BASE = { sRC: 0.8, rSNR: 0.75, d4: 0, noise: 0.5, disc4: 0.03, wx4: 0, gapEps: 0, move: 0 };

// 2. THE POWER through items()
const DR = 40;
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-o182.mjs's items(); SN's world-0 Y1 + Y5 and C's runs as recorded, ${N} paths a world)`);
for (const s of [0.1, 0.25, 0.4, 0.5, 0.6, 0.8]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, sRC: s }))['1'].outcome]++; console.log(`  item 1, the copied corners carry ${s} of SN's Y1 + Y5 (noise x0.5): ${row(c)}`); }
for (const nz of [0.25, 1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, noise: nz, sRC: 0.6 }))['1'].outcome]++; console.log(`  item 1, a share of 0.6, noise x${nz}: ${row(c)}`); }
for (const r of [0, 0.25, 0.4, 0.5, 0.75]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, rSNR: r }))['2'].outcome]++; console.log(`  item 2, SNR removes ${r} of SN's Y1 + Y5: ${row(c)}`); }
for (const r of [0.25, 0.5, 0.75, 0.95]) for (const e of [-1, 0, 1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, rSNR: r, gapEps: e }))['3'].outcome]++; console.log(`  item 3, SNR removes ${r}, the other years ${e >= 0 ? '+' : ''}${e} point: ${row(c)}`); }
for (const r of [0.75, 0.95]) for (const mv of [0.4, 0.8]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, rSNR: r, move: mv }))['3'].outcome]++; console.log(`  item 3, SNR removes ${r} and ${mv} of it reappears elsewhere: ${row(c)}`); }
for (const v of [-0.6, -0.25, 0, 0.25]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, d4: v }))['4'].outcome]++; console.log(`  item 4, SNR's survival change ${v} a world (discordance 0.03 of 4p(1 - p)): ${row(c)}`); }

// 3. THE CREDENCES: the receipt's O182 set through the judged stories, each draw read through items()
const credLine = (/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1];
const cS = Object.fromEntries([...credLine.matchAll(/O182-([A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])])), sumOf = c => Object.values(c).reduce((a, b) => a + b, 0);
if (Object.keys(cS).length !== 5 || Math.abs(sumOf(cS) - 1) > 0.02 || Object.keys(cS).some(c => !JUDGED.sRC[c])) { console.log(`the receipt's CAUSE CREDENCES did not read (${credLine.slice(0, 200)})`); process.exit(1); }
const ND = 2000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
function credences(cmap) {
  const I = { 1: cnt3(), 2: cnt3(), 3: cnt3(), 4: cnt3() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = { 1: [], 2: [], 3: [], 4: [] };
  for (let q = 0; q < ND; q++) {
    const c = pickC(cmap), story = { sRC: pick(JUDGED.sRC[c]), rSNR: pick(JUDGED.rSNR[c]), d4: pick(JUDGED.d4[c]), noise: pick(JUDGED.noise), disc4: pick(JUDGED.disc4), wx4: pick(JUDGED.wx4), gapEps: pick(JUDGED.gapEps), move: pick(JUDGED.move[c]) };
    const it = items(setOf(story));
    for (const i of ['1', '2', '3', '4']) I[i][it[i].outcome]++;
    R[rowOf(it)]++;
    pt[1].push(it['1'].r.R); pt[2].push(it['2'].r.R); pt[3].push(it['3'].dr.d); pt[4].push(it['4'].per[0].ex.d);
  }
  return { I, R, pt };
}
const WHAT = { 1: 'the share of SN\'s world-0 Y1 + Y5 the copied corners\' I[R] carries', 2: 'the share of SN\'s world-0 Y1 + Y5 SNR removes', 3: 'the drop in world 0\'s table less runs, SNR against C, points', 4: 'SNR\'s survival change against C in world 0, points' };
const show = ({ I, R, pt }, tag) => {
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  console.log(`  escalation trigger 3 (a run over 2 hours with the 'else' row at 0.6 or more): else ${f2(R.else / ND)}`);
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
  for (const i of ['1', '2', '3', '4']) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);
};
console.log(`\n3. THE CREDENCES AS THE RECEIPT STATES THEM (the receipt of ${RECEIPT}: ${Object.entries(cS).map(([k, v]) => `O182-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(cS), '  as stated, ');
const sc = /an item leaning on a deep review's cause or story ([0-9.]+) \((\d+) of (\d+)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!sc) { console.log('the scorecard\'s lead rate did not read (results-scorecard.txt)'); process.exit(1); }
const lead = Number(sc[1]), top = Object.entries(cS).sort((a, b) => b[1] - a[1])[0][0], rest = sumOf(cS) - cS[top];
const sS = Object.fromEntries(Object.entries(cS).map(([k, v]) => [k, k === top ? lead : v * (1 - lead) / rest]));
console.log(`\n3b. THE CREDENCES WITH THE LEADING CAUSE AT THE RECORD'S RATE (results-scorecard.txt: ${sc[1]}, ${sc[2]} of ${sc[3]}; ${Object.entries(sS).map(([k, v]) => `O182-${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
show(credences(sS), 'CREDENCE ');

// 4. THE BUDGET: STEP-S370's C and SN on S370 at 30 points (solve and ledger seconds from their logs); SNR solves as SN does;
// the split's probe adds a tenth to the ledger (judged)
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const sCs = num(/solve CAND C\/P30S6Q5: table \S+ secs (\d+)/, logC), lCs = num(/checks C\/P30S6Q5: ownTook .* secs (\d+)/, logC);
const sSs = num(/solve CAND SN\/P30S6Q5: table \S+ secs (\d+)/, logS), lSs = num(/checks SN\/P30S6Q5: ownTook .* secs (\d+)/, logS);
if (![sCs, lCs, sSs, lSs].every(Number.isFinite)) { console.log('the budget\'s inputs did not read'); process.exit(1); }
console.log(`\n4. THE BUDGET (grade C: STEP-S370's C, solve ${sCs} s and ledger ${lCs} s, and SN, solve ${sSs} s and ledger ${lSs} s, on 12,000 paths): C about ${f2((sCs + 1.1 * lCs) / 3600)} h, SN and SNR about ${f2((sSs + 1.1 * lSs) / 3600)} h each (the split a tenth on the ledger, judged); three jobs on three cores, the wall about ${f2((Math.max(sCs + 1.1 * lCs, sSs + 1.1 * lSs)) / 3600)} h`);
