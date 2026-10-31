/*
 * AN'S DERIVATION (predictions/diag-an.md; the deep review after AREF Step 0, deep-review-log.md 15 Oct 10:13 UK): the
 * records (NODE-AX's BN and BO behind NODE-AX's gate, 4,000 paths a world: the per-path spread of GB in worlds 0 and 1 and
 * of world 2's year-1 term, BN's survival, and the paths a change of reference moved, BO against BN, as the record of how
 * many runs AN's policy may move); the power of items 1-3 through reduce-an.mjs's own items() at the record's spread
 * (times 0.75, 1 and 1.5); the credences from the 10:13 receipt's CAUSE CREDENCES (read from the log, not typed) through the
 * judged stories below; the decision table's rows; the point and 80% interval; the budget (NODE-AX's BN solve and ledger
 * from its log, the reference's build and refTook from AN's preflight job, results-an-preflight-an.txt).
 *   node research/solver/derive-an.mjs > research/solver/results-derive-an.txt
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, NPW } from './reduce-an.mjs';

// THE JUDGED INPUTS (committed before this script's output; grade D throughout). Each cause in the 10:13 receipt's map
// (its CAUSE CREDENCES, read below) predicts AN's bridge-years grid residual GB in worlds 0 and 1, world 2's year-1 term and
// the runs' change against BN's, as distributions over values (points). BN's own: GB -1.7654 and -2.0679, world 2's year 1
// -0.7929 (results-nodeax.txt).
export const JUDGED = {
  // GB, the same story value in worlds 0 and 1, each world then moved by `worldJitter` either way at random. REF: the matched
  // reference removes the residual, the review's own range [-0.5, +1.0] with an overshoot at a quarter (its static read
  // overshot to about +0.9 but carried the smeared last year, O157, which pushed p up a year early); SHARE, B, W, LAYER and
  // QUAD: the residual is not the reference's, so it stays near BN's; MODEL and CPART: a partial lift; OTHER: anywhere;
  // NOISE: a structural part smaller than shown
  gb: {
    REF: { '-0.4': 0.2, 0: 0.3, 0.4: 0.25, 0.8: 0.25 },
    OTHER: { '-1.6': 0.25, '-0.8': 0.25, 0: 0.25, 0.8: 0.25 },
    MODEL: { '-1.2': 0.4, '-0.7': 0.4, '-0.3': 0.2 },
    SHARE: { '-1.8': 0.5, '-1.3': 0.5 },
    CPART: { '-1.0': 0.4, '-0.5': 0.4, 0: 0.2 },
    B: { '-1.8': 0.5, '-1.2': 0.5 }, W: { '-1.8': 0.5, '-1.2': 0.5 }, LAYER: { '-1.5': 0.5, '-0.9': 0.5 }, QUAD: { '-1.8': 0.5, '-1.2': 0.5 },
    NOISE: { '-0.3': 0.5, 0.3: 0.5 },
  },
  worldJitter: 0.15,
  // world 2's year-1 term (BN -0.7929): REF removes most of it (the review's static read -0.29, carrying O157's bias);
  // the others leave it near BN's; NOISE a smaller structural part
  y1: { REF: { '-0.5': 0.3, '-0.25': 0.4, 0: 0.3 }, NOISE: { '-0.3': 0.5, 0: 0.5 }, other: { '-0.8': 0.5, '-0.5': 0.5 } },
  // the runs' net change against BN's in worlds 0 and 1 (points, AN less BN): a better-read bridge moves a few openings
  // either way; CPART's departures from the floor rule cost runs
  runs: { CPART: { '-0.6': 0.4, '-0.2': 0.6 }, other: { '-0.3': 0.2, 0: 0.5, 0.3: 0.3 } },
  // the paths AN's policy moves (lost plus saved, a world), as a multiple of the record's (BO against BN: a change of the
  // reader's share axis alone, the nearest record of a change to the bridge read)
  churn: { 0.5: 0.3, 1: 0.5, 2: 0.2 },
  // AN's per-path spread of GB and of the year terms, as a multiple of BN's (a reference nearer the policy's chance may
  // narrow it; a new over-read may widen it)
  spread: { 0.75: 0.3, 1: 0.5, 1.5: 0.2 },
  // the budget: AN's ledger and runs as BN's (the same paths, the same ledger code)
  ledgerCost: 1,
  // the receipt's leading cause (REF) is taken at this credence, not its own 0.62: an item resting on a deep review's ranked
  // cause starts from the record's rate (results-scorecard.txt: 0.32, 9 of 29) and moves on stated grounds - the leading
  // causes settled since the hand record held 8 of 10, and the review read the saved files at the corners the read weighs
  // (grade C) - so half way; the other causes scaled to fill the rest in their receipt's proportions
  leadCause: 0.5,
};

const HERE = dirname(fileURLToPath(import.meta.url)), AX = join(HERE, 'results', 'diagnodeax');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const mean = a => a.reduce((t, x) => t + x, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(a.reduce((t, x) => t + (x - m) * (x - m), 0) / (a.length - 1)); };

// 1. THE RECORDS, behind NODE-AX's gate
const red = spawnSync('node', [join(HERE, 'reduce-nodeax.mjs'), AX], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!/^GATE: passed/m.test(red.stdout || '')) { console.log('NODE-AX\'s files did not pass NODE-AX\'s gate'); process.exit(1); }
const load = f => JSON.parse(gunzipSync(readFileSync(join(AX, f))).toString()), fBN = load('S360-BN-P60S15Q5.json.gz'), fBO = load('S360-BO-P60S6Q5.json.gz');
const arrOf = (f, x, k) => { const b = Buffer.from(f.per[`${x}${k}`], 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const bitsOf = (f, k) => Buffer.from(f.bits[`OWN${k}`], 'base64');
console.log(`AN'S DERIVATION (predictions/diag-an.md)\n\n1. THE RECORDS: NODE-AX's BN and BO behind NODE-AX's gate (${fBN.NPW} paths a world, seed ${fBN.seed})`);
const SD = { GB: [0, 1].map(k => sd(arrOf(fBN, 'GB', k))), Y1: sd(arrOf(fBN, 'Y1', 2)) };
const CH = [0, 1].map(k => { const a = bitsOf(fBN, k), b = bitsOf(fBO, k); let lost = 0, saved = 0, alive = 0; for (let i = 0; i < a.length; i++) { if (a[i]) alive++; if (a[i] && !b[i]) lost++; else if (b[i] && !a[i]) saved++; } return { lost, saved, alive }; });
for (const k of [0, 1]) console.log(`  BN world ${k}: GB mean ${f4(mean(arrOf(fBN, 'GB', k)))} sd ${f4(SD.GB[k])}; survival ${f4(100 * CH[k].alive / fBN.NPW)}; BO against BN on the same paths: lost ${CH[k].lost} saved ${CH[k].saved}`);
console.log(`  BN world 2: Y1 mean ${f4(mean(arrOf(fBN, 'Y1', 2)))} sd ${f4(SD.Y1)}`);
// the mechanism's incidence: the reference is read at every bridge path-year a path visits (NB, a count saved per path)
for (const k of [0, 1, 2]) { const nb = arrOf(fBN, 'NB', k).map(v => v / 100); console.log(`  the incidence, world ${k}: the reference read at ${f2(mean(nb))} bridge path-years a path (BN's ledger), on ${nb.filter(v => v > 0).length} of ${nb.length} paths`); }

// a synthetic read: AN's per-path arrays at a story's values and the record's spread times x, AN's runs moved from BN's
const n = NPW, BNb = [0, 1, 2].map(k => bitsOf(fBN, k));
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
function setOf({ g0, g1, y1, d0 = 0, d1 = 0, churn = 1 }, x = 1) {
  const P = { AN: {} }, S = { BN: BNb, AN: [] };
  [[0, g0], [1, g1], [2, 0]].forEach(([k, m]) => { const a = new Float64Array(n), s = k < 2 ? SD.GB[k] : SD.GB[1]; for (let i = 0; i < n; i++) a[i] = m + x * s * gauss(); P.AN[`GB${k}`] = a; });
  for (const k of [0, 1, 2]) { const a = new Float64Array(n), m = k === 2 ? y1 : 0; for (let i = 0; i < n; i++) a[i] = m + x * SD.Y1 * gauss(); P.AN[`Y1${k}`] = a; }
  [d0, d1, 0].forEach((d, k) => {
    const b = Uint8Array.from(BNb[k]), c = k < 2 ? churn * (CH[k].lost + CH[k].saved) : 0, net = d * n / 100;
    let lost = pois(Math.max(0, (c - net) / 2)), saved = pois(Math.max(0, (c + net) / 2));
    for (let i = 0; i < n && (lost > 0 || saved > 0); i++) { const j = Math.floor(rnd() * n); if (b[j] && lost > 0) { b[j] = 0; lost--; } else if (!b[j] && saved > 0) { b[j] = 1; saved--; } }
    S.AN[k] = b;
  });
  return { P: (arm, xx, k) => (arm === 'AN' ? P.AN[`${xx}${k}`] : null), S: (arm, k) => S[arm][k] };
}
const cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');

// 2. THE POWER through items()
const DR = 40, XS = [0.75, 1, 1.5];
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-an.mjs's items(), ${n} paths a world; the record's spread times ${XS.join(', ')})`);
for (const x of XS) {
  for (const g of [-1.8, -1.2, -1.0, -0.8, -0.5, -0.3, 0, 0.3, 0.5, 0.8, 1.0, 1.2]) { const c = cnt(); for (let d = 0; d < DR; d++) c[items(...Object.values(setOf({ g0: g, g1: g, y1: 0 }, x)))['1'].outcome]++; console.log(`  x${x} item 1, GB ${g} in both worlds: ${row(c)}`); }
  for (const y of [-0.8, -0.6, -0.5, -0.4, -0.25, 0]) { const c = cnt(); for (let d = 0; d < DR; d++) c[items(...Object.values(setOf({ g0: 0, g1: 0, y1: y }, x)))['3'].outcome]++; console.log(`  x${x} item 3, world 2's Y1 ${y}: ${row(c)}`); }
}
for (const ch of [0.5, 1, 2]) for (const d of [-0.6, -0.3, 0, 0.3]) { const c = cnt(); for (let k = 0; k < DR; k++) c[items(...Object.values(setOf({ g0: 0, g1: 0, y1: 0, d0: d, d1: d, churn: ch })))['2'].outcome]++; console.log(`  churn x${ch} item 2, the runs ${d} points in both worlds: ${row(c)}`); }

// 3. THE CREDENCES: the receipt's cause credences through the judged stories, each draw read through items()
const logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 15 Oct 10:13 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(logT || '') || ['', ''])[1].matchAll(/N2-([A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const sum = Object.values(cc).reduce((a, b) => a + b, 0);
if (Object.keys(cc).length !== 10 || Math.abs(sum - 1) > 0.02 || Object.keys(cc).some(c => !JUDGED.gb[c]) || cc.REF !== Math.max(...Object.values(cc))) { console.log(`the receipt's CAUSE CREDENCES did not read, or REF does not lead (${JSON.stringify(cc)})`); process.exit(1); }
const rec = { ...cc };   // the receipt's, printed; cc below is shaded
{ const rest = sum - cc.REF; for (const k of Object.keys(cc)) cc[k] = k === 'REF' ? JUDGED.leadCause * sum : cc[k] * (1 - JUDGED.leadCause) * sum / rest; }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return Number(k); } return Number(Object.keys(dist).pop()); };
const pickC = () => { let u = rnd() * sum, acc = 0; for (const [k, v] of Object.entries(cc)) { acc += v; if (u < acc) return k; } return Object.keys(cc).pop(); };
const ND = 2000, I = { 1: cnt(), 2: cnt(), 3: cnt() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = [], pt2 = [], pt3 = [];
for (let d = 0; d < ND; d++) {
  const c = pickC(), g = pick(JUDGED.gb[c]), j = () => (rnd() * 2 - 1) * JUDGED.worldJitter;
  const story = { g0: g + j(), g1: g + j(), y1: pick(JUDGED.y1[c] || JUDGED.y1.other), churn: pick(JUDGED.churn) }, dr = pick(JUDGED.runs[c] || JUDGED.runs.other);
  story.d0 = dr; story.d1 = dr;
  const it = items(...Object.values(setOf(story, pick(JUDGED.spread))));
  for (const i of ['1', '2', '3']) I[i][it[i].outcome]++;
  pt.push(it['1'].cells[0].m); pt2.push(it['2'].cells[0].d); pt3.push(it['3'].cell.m);
  const o1 = it['1'].outcome;
  if (o1 === 'HELD') R[it['2'].outcome === 'HELD' ? 'R1' : 'R2']++;
  else if (o1 === 'FALSIFIED') R[it['1'].side === 'under' ? 'R3' : 'R4']++;
  else R.else++;
}
console.log(`\n3. THE CREDENCES (the receipt of 15 Oct 10:13 UK: ${Object.entries(rec).map(([k, v]) => `N2-${k}=${v}`).join('; ')}; REF taken at ${JUDGED.leadCause}, the rest scaled: ${Object.entries(cc).map(([k, v]) => `${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
for (const i of ['1', '2', '3']) console.log(`  item ${i}: ${row(I[i])}`);
console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
const s = [...pt].sort((a, b) => a - b), qq = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
console.log(`  item 1's point (AN's GB in world 0, the reducer's own mean): median ${f4(qq(0.5))}, 80% interval ${f4(qq(0.1))} to ${f4(qq(0.9))}`);
const med = a => { const x = [...a].sort((p, q) => p - q); return x[Math.floor(x.length / 2)]; }, pts = { 1: qq(0.5), 2: med(pt2), 3: med(pt3) };
{ const qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
  console.log(`  item 2's point (AN's runs less BN's in world 0, points): median ${f4(qa(pt2, 0.5))}, 80% interval ${f4(qa(pt2, 0.1))} to ${f4(qa(pt2, 0.9))}`);
  console.log(`  item 3's point (world 2's year-1 term under AN, points): median ${f4(qa(pt3, 0.5))}, 80% interval ${f4(qa(pt3, 0.1))} to ${f4(qa(pt3, 0.9))}`); }
for (const i of ['1', '2', '3']) console.log(`CREDENCE item ${i}: point ${f4(pts[i])} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);

// 4. THE BUDGET: NODE-AX's BN solve and ledger, the reference's build and refTook from AN's build check
const lg = readFileSync(join(AX, 'case0.txt'), 'utf8'), bc = readFileSync(join(HERE, 'results-an-preflight-an.txt'), 'utf8');   // AN's preflight job's log, kept
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const solve = num(/solve CAND BN\/P60S15Q5: table \S+ secs (\d+)/, lg), ledger = num(/checks BN\/P60S15Q5: ownTook .* secs (\d+)/, lg);
const build = num(/adaptive AN\/P60S15Q5: .* secs (\S+)$/m, bc), refT = num(/checks AN\/P60S15Q5: refTook \d+\/\d+ \(.*, secs ([\d.]+)\)$/m, bc);
const refFull = refT;   // refTook runs its registered sample at every scale (the plan-auditor's FAIL of 15 Oct 15:37 UK), so the preflight's time is the run's
if (![solve, ledger, build, refFull].every(Number.isFinite)) { console.log(`the budget's inputs did not read (solve ${solve}, ledger ${ledger}, build ${build}, refTook ${refT})`); process.exit(1); }
const total = solve + build + JUDGED.ledgerCost * ledger + refFull;
console.log(`\n4. THE BUDGET: BN's solve ${solve} s and ledger ${ledger} s (NODE-AX's log, grade C); the reference's build ${f2(build)} s (AN's preflight job: its lattice does not depend on the grid's points, grade B); refTook ${f2(refFull)} s (the preflight's, at its registered sample, grade C: fewer records to sample there); AN about ${f2(total / 3600)} h on one core`);
