/*
 * NE-GRID B1'S DERIVATION (predictions/diag-negrid-b1.md): what stage A's and NE-ROOT's records say about S380, bridge 4
 * and S224 at the coarse grid, the power of items 1-4 by simulation through reduce-negrid-b1.mjs's own items(), the
 * credences from the deep review's cause credences (deep-review-log.md 11 Oct 15:49 UK, read from the receipt, not typed)
 * and the judged stories below, the decision table's rows, the points and 80% intervals, and the budget from stage A's and
 * NE-ROOT's own logs. Reads stage A's files behind stage A's gate and NE-ROOT's behind NE-ROOT's.
 *   node research/solver/derive-negrid-b1.mjs > research/solver/results-derive-negrid-b1.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { parse as parseA, gate as gateA, neRootS380 } from './reduce-neblend-a.mjs';
import { parse as parseNR, gate as gateNR } from './reduce-neroot.mjs';
import { items, key, PAIRS, NPW, WEIGHTS } from './reduce-negrid-b1.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DA = join(HERE, 'results', 'diagneblend'), DNR = join(HERE, 'results', 'diagneroot');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const binom = (n, p) => (n * p > 30 && n * (1 - p) > 30 ? Math.min(n, Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss()))) : (() => { let k = 0; for (let i = 0; i < n; i++) if (rnd() < p) k++; return k; })());
const pois = lam => { if (lam > 50) return Math.max(0, Math.round(lam + Math.sqrt(lam) * gauss())); const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const DRAWS = 1000;

// THE JUDGED INPUTS (written before this script's output)
export const JUDGED = {
  // item 1: |fine gap| / |coarse gap| on S380 (LOR less BASE at P and D, worlds 0 and 1), the story's typical ratio by the
  // review's causes; each cell spread about it by a uniform +-0.15. INTERP: the gap is the W cell's width, so doubling W
  // shrinks it (Jensen's gap goes with the width squared; the share axis, unchanged, holds some); SPACE: BASE moves to LOR,
  // so the gap shrinks too; SPLIT and REF: the gap is not the W axis's, so it stays; OTHER: between
  gap: { 'RB-INTERP': { 0.3: 0.45, 0.6: 0.35, 0.9: 0.2 }, 'RB-SPACE': { 0.3: 0.35, 0.6: 0.35, 0.9: 0.3 }, 'RB-SPLIT': { 0.3: 0.1, 0.6: 0.3, 0.9: 0.6 },
    'RB-REF': { 0.3: 0.1, 0.6: 0.3, 0.9: 0.6 }, 'RB-OTHER': { 0.3: 0.25, 0.6: 0.35, 0.9: 0.4 } },
  // the coarse gap by world is the records': LOR's coarse error at D less BASE's at P (stage A's tables; the two openings'
  // errors taken as the read's gap at each, judged), so no gap is typed here.
  // item 2: BASE's fine error at each world, its coarse error scaled by this, by cause (LOR's fine table is BASE's plus the
  // fine gap, so LOR's convergence follows from this and item 1's ratio). INTERP: the error shrinks partway (Phase V: not
  // converged at 56 points); SPACE: BASE moves toward LOR's read, its own error partway; SPLIT, REF: it stays; OTHER: between
  conv: { 'RB-INTERP': { 0.3: 0.4, 0.6: 0.4, 1: 0.2 }, 'RB-SPACE': { 0.3: 0.2, 0.6: 0.4, 1: 0.4 }, 'RB-SPLIT': { 0.3: 0.1, 0.6: 0.2, 1: 0.7 },
    'RB-REF': { 0.3: 0.1, 0.6: 0.2, 1: 0.7 }, 'RB-OTHER': { 0.3: 0.2, 0.6: 0.3, 1: 0.5 } },
  // item 3: the fine tables' price error for D against P (points; world 0 at this size, worlds 1 and 2 at a third of it,
  // its sign drawn), by cause; the true paired change by world is stage A's item 4 (-2.375, 0.225, 0.75: the closest
  // record of D against P on S380), the paths that differ beyond it 5% of the 4,000 (judged), lost and saved each drawn
  price: { 'RB-INTERP': { 0.5: 0.5, 1.5: 0.3, 3: 0.2 }, 'RB-SPACE': { 0.5: 0.3, 1.5: 0.4, 3: 0.3 }, 'RB-SPLIT': { 0.5: 0.2, 1.5: 0.3, 3: 0.5 },
    'RB-REF': { 0.5: 0.2, 1.5: 0.3, 3: 0.5 }, 'RB-OTHER': { 0.5: 0.3, 1.5: 0.35, 3: 0.35 } },
  trueChange: [-2.375, 0.225, 0.75], churn: 0.05,
  // item 4: bridge 4 at the fine grid: kept (BASE's coarse calibration under both arms), LOR's world-0 over-read kept at its
  // stage A size (0.4731), or broken (2 points off in world 0), by whether the cause is the W axis's
  b4: { 'RB-INTERP': { kept: 0.6, small: 0.35, broken: 0.05 }, other: { kept: 0.4, small: 0.5, broken: 0.1 } },
};

// 1. THE RECORDS: stage A's S380 and bridge 4 world lines behind its gate; NE-ROOT's S224 and bridge 4 BASE behind its gate
const readDir = d => Object.fromEntries(readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(d, f), 'utf8')]));
const gz = d => Object.fromEntries(readdirSync(d).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(d, f))).toString())]));
const logsA = readDir(DA), logsNR = readDir(DNR);
if (!requireFairLogs(logsA, 'research/solver/predictions/diag-neblend-a.md', { exit: false })) { console.log('stage A\'s files did not pass the fair-test gate'); process.exit(1); }
if (!requireFairLogs(logsNR, 'research/solver/predictions/diag-neroot.md', { exit: false })) { console.log('NE-ROOT\'s files did not pass the fair-test gate'); process.exit(1); }
const jobsA = Object.values(logsA).flatMap(parseA), jobsNR = Object.values(logsNR).flatMap(parseNR);
const badA = gateA(jobsA, { files: gz(DA), ref: neRootS380(readFileSync(join(HERE, 'results-neroot.txt'), 'utf8')) }), badNR = gateNR(jobsNR, { files: gz(DNR) });
if (badA.length || badNR.length) { console.log(`a gate refused: ${[...badA, ...badNR].join('; ')}`); process.exit(1); }
const wl = j => j.world.map(x => ({ table: x.table, q: x.ok / x.n }));
const SB = wl(jobsA.find(j => j.id === 'S380' && j.arm === 'BASE')), SL = wl(jobsA.find(j => j.id === 'S380' && j.arm === 'LOR')), B4L = wl(jobsA.find(j => j.id === 'bridge 4' && j.arm === 'LOR'));
const nrB4 = jobsNR.find(j => j.id === 'bridge 4' && j.arm === 'BASE' && j.w === '0.02'), B4B = nrB4.world.map(x => ({ table: x.by.SC.table, q: x.by.SC.ok / x.by.SC.n }));
const nrS224 = jobsNR.find(j => j.id === 'S224' && j.arm === 'BASE'), S224 = nrS224.world.map(x => ({ table: x.by.OWN.table, q: x.by.OWN.ok / x.by.OWN.n }));
const Aof = rows => rows.reduce((t, x, k) => t + WEIGHTS[k] * Math.abs(x.table - 100 * x.q), 0);
const A30 = { BASE: Aof(SB), LOR: Aof(SL) };
console.log('1. THE RECORDS (seed 7002, 4,000 paths a world; results/diagneblend behind stage A\'s gate, results/diagneroot behind NE-ROOT\'s: passed)');
SB.forEach((x, k) => console.log(`  S380 BASE at P (ai 12), coarse, world ${k}: table ${f4(x.table)} simulated ${f4(100 * x.q)} off ${f4(x.table - 100 * x.q)}`));
SL.forEach((x, k) => console.log(`  S380 LOR at D (ai 14), coarse, world ${k}: table ${f4(x.table)} simulated ${f4(100 * x.q)} off ${f4(x.table - 100 * x.q)}`));
console.log(`  coarse A (weight x |table less simulated|): BASE ${f4(A30.BASE)}, LOR ${f4(A30.LOR)}`);
B4B.forEach((x, k) => console.log(`  bridge 4 BASE at D (ai 59, NE-ROOT's SC), coarse, world ${k}: off ${f4(x.table - 100 * x.q)}; under LOR (stage A) ${f4(B4L[k].table - 100 * B4L[k].q)}`));
S224.forEach((x, k) => console.log(`  S224 BASE at its own opening (NE-ROOT), coarse, world ${k}: off ${f4(x.table - 100 * x.q)}`));

// 2. THE POWER through items(): a synthetic set per draw - the tables a story sets, the runs drawn at 4,000 paths a world
const tab3 = (Pt, Dt) => [0, 1, 2].map(k => ({ k, weight: WEIGHTS[k], P: Pt[k], D: Dt[k], OWN: Pt[k] }));
const job = (id, arm, grid, Pt, Dt, sims = null, own = PAIRS[id][0]) => ({ id, arm, grid, own: { ai: own }, pair: { P: PAIRS[id][0], D: PAIRS[id][1] }, tables: tab3(Pt, Dt), sims: sims || {} });
// S380's truths: P's runs at BASE's coarse simulated, D's at P's plus the true change
const qP = SB.map(x => x.q), qD = qP.map((q, k) => q + JUDGED.trueChange[k] / 100);
const eB = SB.map(x => x.table - 100 * x.q), gc = SL.map((x, k) => (x.table - 100 * x.q) - eB[k]);
console.log(`  the coarse gap by world (LOR's error at D less BASE's at P): ${gc.map(f4).join(', ')}`);
function setOf({ gapR = [0.5, 0.5, 0.5, 0.5], convB = 0.5, bias = [0, 0, 0], b4 = 'kept' } = {}) {
  // BASE's error at its coarse runs, at P and at D alike (judged); LOR's table is BASE's plus the read's gap gc (records)
  const at = (q, e, sc, add = [0, 0, 0]) => q.map((x, k) => 100 * x + sc * e[k] + add[k]);
  const rOf = (o, k) => (k < 2 ? gapR[(o === 'D' ? 2 : 0) + k] : (gapR[0] + gapR[1] + gapR[2] + gapR[3]) / 4);
  const cBP = at(qP, eB, 1), cBD = at(qD, eB, 1), fBP = at(qP, eB, convB), fBD = at(qD, eB, convB, bias);
  const cLP = cBP.map((x, k) => x + gc[k]), cLD = cBD.map((x, k) => x + gc[k]);
  const fLP = fBP.map((x, k) => x + gc[k] * rOf('P', k)), fLD = fBD.map((x, k) => x + gc[k] * rOf('D', k));
  const sims = (a, b) => Object.fromEntries([0, 1, 2].flatMap(k => [[`P${k}`, { ok: a[k], n: NPW }], [`D${k}`, { ok: b[k], n: NPW }]]));
  const drawPair = () => { const Pk = [], Dk = [], bits = []; for (let k = 0; k < 3; k++) { const okP = binom(NPW, qP[k]), half = NPW * JUDGED.churn / 2, dn = NPW * Math.abs(JUDGED.trueChange[k]) / 100; const lost = Math.min(okP, pois(half + (JUDGED.trueChange[k] < 0 ? dn : 0))), saved = Math.min(NPW - okP, pois(half + (JUDGED.trueChange[k] > 0 ? dn : 0))); Pk.push(okP); Dk.push(okP - lost + saved); bits.push([okP, lost, saved]); } return { P: Pk, D: Dk, bits }; };
  const dB = drawPair(), dL = drawPair();
  const b4q = B4B.map(x => x.q), b4Shift = { kept: 0, small: (B4L[0].table - 100 * B4L[0].q) - (B4B[0].table - 100 * B4B[0].q), broken: 2 }[b4];
  const b4t = sh => B4B.map((x, k) => x.table + (k === 0 ? sh : 0));
  const b4sims = () => Object.fromEntries([0, 1, 2].flatMap(k => { const ok = binom(NPW, b4q[k]); return [[`P${k}`, { ok, n: NPW }], [`D${k}`, { ok, n: NPW }]]; }));
  const J = {
    [key('S380', 'BASE', 'coarse')]: job('S380', 'BASE', 'coarse', cBP, cBD), [key('S380', 'LOR', 'coarse')]: job('S380', 'LOR', 'coarse', cLP, cLD),
    [key('S380', 'BASE', 'fine')]: job('S380', 'BASE', 'fine', fBP, fBD, sims(dB.P, dB.D)), [key('S380', 'LOR', 'fine')]: job('S380', 'LOR', 'fine', fLP, fLD, sims(dL.P, dL.D)),
    [key('bridge 4', 'BASE', 'fine')]: job('bridge 4', 'BASE', 'fine', b4t(0), b4t(0), b4sims()), [key('bridge 4', 'LOR', 'fine')]: job('bridge 4', 'LOR', 'fine', b4t(b4Shift), b4t(b4Shift), b4sims()),
  };
  const mk = ([ok, lost, saved], o) => { const b = new Uint8Array(NPW); for (let i = 0; i < ok; i++) b[i] = 1; if (o === 'D') { for (let i = 0; i < lost; i++) b[i] = 0; for (let i = 0; i < saved; i++) b[ok + i] = 1; } return b; };
  const bitsOf = (j, o, k) => mk((j.arm === 'BASE' ? dB : dL).bits[k], o);
  // every story's table clamped inside 0 to 100 (a table near 100 cannot over-read past it), then asserted (the NE-ROOT close's REPLACE rule)
  for (const j of Object.values(J)) for (const x of j.tables) for (const o of ['P', 'D', 'OWN']) x[o] = Math.min(100, Math.max(0, x[o]));
  for (const j of Object.values(J)) for (const x of j.tables) for (const o of ['P', 'D', 'OWN']) if (!(x[o] >= 0 && x[o] <= 100)) throw new Error(`a story's table left 0 to 100: ${j.id} ${j.arm} ${j.grid} world ${x.k} ${o} ${x[o]}`);
  return { J, bitsOf };
}
const P = {}, cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 });
const tally = (k, fn) => { const c = cnt(); for (let d = 0; d < DRAWS; d++) c[fn()]++; P[k] = Object.fromEntries(Object.entries(c).map(([x, v]) => [x, v / DRAWS])); };
const spread = r => [0, 1, 2, 3].map(() => Math.max(0, r + (rnd() - 0.5) * 0.3));
for (const r of [0.3, 0.6, 0.9]) tally(`gap|${r}`, () => { const { J, bitsOf } = setOf({ gapR: spread(r) }); return items(J, bitsOf, A30)[1].outcome; });
for (const cb of [0.3, 0.6, 1]) for (const r of [0.3, 0.6, 0.9]) tally(`conv|${cb}|${r}`, () => { const { J, bitsOf } = setOf({ convB: cb, gapR: spread(r) }); return items(J, bitsOf, A30)[2].outcome; });
for (const b of [0.5, 1.5, 3]) tally(`price|${b}`, () => { const s = rnd() < 0.5 ? -1 : 1, { J, bitsOf } = setOf({ bias: [s * b, s * b / 3, s * b / 3] }); return items(J, bitsOf, A30)[3].outcome; });
for (const s of ['kept', 'small', 'broken']) tally(`b4|${s}`, () => { const { J, bitsOf } = setOf({ b4: s }); return items(J, bitsOf, A30)[4].outcome; });
const row = k => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f4(P[k][x])}`).join(' ');
console.log(`\n2. THE POWER (${DRAWS} draws a cell at ${NPW} paths a world through reduce-negrid-b1.mjs's items())`);
for (const r of [0.3, 0.6, 0.9]) console.log(`  item 1, the gap's ratio about ${r} (each cell +-0.15): ${row(`gap|${r}`)}`);
for (const cb of [0.3, 0.6, 1]) for (const r of [0.3, 0.6, 0.9]) console.log(`  item 2, BASE's error at ${cb} of its coarse one, the gap's ratio about ${r}: ${row(`conv|${cb}|${r}`)}`);
for (const b of [0.5, 1.5, 3]) console.log(`  item 3, a price error of ${b} points in world 0 (a third of it in worlds 1 and 2): ${row(`price|${b}`)}`);
for (const s of ['kept', 'small', 'broken']) console.log(`  item 4, bridge 4 ${s}: ${row(`b4|${s}`)}`);

// 3. THE CREDENCES: the receipt's cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 11 Oct 15:49 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: ([^|]+)/.exec(rec || '') || ['', ''])[1].matchAll(/(RB-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(cc).length !== 5 || Math.abs(sum(cc) - 1) > 0.02) { console.log(`the receipt's CAUSE CREDENCES did not read (${JSON.stringify(cc)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const outOf = p => { const u = rnd(); return u < p.HELD ? 'HELD' : u < p.HELD + p.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const C = [1, 2, 3, 4].map(cnt), rows = { r1: 0, r2: 0, r3: 0, r4: 0 }, Mn = 40000, R1 = [], R2 = [];
for (let d = 0; d < Mn; d++) {
  const c = pick(cc);
  const g = Number(pick(JUDGED.gap[c])), cb = Number(pick(JUDGED.conv[c])), b = Number(pick(JUDGED.price[c])), s4 = pick(JUDGED.b4[c === 'RB-INTERP' ? 'RB-INTERP' : 'other']);
  const o = [outOf(P[`gap|${g}`]), outOf(P[`conv|${cb}|${g}`]), outOf(P[`price|${b}`]), outOf(P[`b4|${s4}`])];
  o.forEach((x, i) => C[i][x]++);
  R1.push(Math.max(0, g + 0.15 + (rnd() - 0.5) * 0.1)); R2.push(cb + (rnd() - 0.5) * 0.2);
  // the rows (restructured after this script's first output, its JUDGED unchanged: item 1 HELD, the most informative
  // reading, fed no row of its own - declared in the prediction): item 1 decides, item 4 guards it
  if (o[0] === 'HELD' && o[3] !== 'FALSIFIED') rows.r1++; else if (o[0] === 'FALSIFIED') rows.r2++; else if (o[3] === 'FALSIFIED') rows.r3++; else rows.r4++;
}
const pct = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 11 Oct 15:49 UK: ${Object.entries(cc).map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${Mn} draws)`);
C.forEach((c, i) => console.log(`CREDENCE item ${i + 1}: point ${i === 0 ? f4(mean(R1)) : i === 1 ? f4(mean(R2)) : '-'} HELD ${f2(c.HELD / Mn)} INCONCLUSIVE ${f2(c.INCONCLUSIVE / Mn)} FALSIFIED ${f2(c.FALSIFIED / Mn)}`));
console.log(`  POINT item 1: ${f4(mean(R1))} (80% interval ${f4(pct(R1, 0.1))} to ${f4(pct(R1, 0.9))}; the largest counted cell's |fine gap| / |coarse gap|)`);
console.log(`  POINT item 2: ${f4(mean(R2))} (80% interval ${f4(pct(R2, 0.1))} to ${f4(pct(R2, 0.9))}; BASE's fine A over its coarse A, the reducer's REALISED taking the larger arm's)`);
console.log(`  DECISION ROWS: item 1 HELD, item 4 not FALSIFIED ${f2(rows.r1 / Mn)}; item 1 FALSIFIED ${f2(rows.r2 / Mn)}; item 4 FALSIFIED, item 1 not FALSIFIED ${f2(rows.r3 / Mn)}; else ${f2(rows.r4 / Mn)}`);

// 4. THE BUDGET: stage A's and NE-ROOT's logs (each job's solve, and its forward pass's seconds a path); the fine solve
// taken as twice the coarse (the W axis doubled, the cells with it: linear, judged, NOT CHECKED until the preflight)
const secs = (t, re) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const logOf = (logs, id, arm, w = 'W0.02') => Object.values(logs).find(t => new RegExp(`^${id.replace(' ', '\\s')}\\s+case \\| job ${arm}/${w}`, 'm').test(t));
const tA = (id, arm) => { const t = logOf(logsA, id, arm); return { solve: secs(t, /solve CAND \S+: table \S+ secs (\d+)/), fwd: secs(t, /forceIdentity \d+\/\d+ secs (\d+)/) / (3 * NPW + 2 * 1000) }; };
const t224 = (() => { const t = logOf(logsNR, 'S224', 'BASE'); return { solve: secs(t, /solve CAND \S+: table \S+ secs (\d+)/), fwd: secs(t, /forceIdentity \d+\/\d+ secs (\d+)/) / (3 * NPW + 2 * 1000) }; })();
const T = { 'S380 BASE': tA('S380', 'BASE'), 'S380 LOR': tA('S380', 'LOR'), 'bridge 4 BASE': tA('bridge 4', 'LOR'), 'bridge 4 LOR': tA('bridge 4', 'LOR'), 'S224 BASE': t224, 'S224 LOR': t224 };
const simPaths = 2 * 3 * NPW + 2 * 1000;   // P and D in three worlds, forceIdentity's two runs on 1,000 paths
let total = 0, longest = 0;
console.log('\n4. THE BUDGET (stage A\'s logs, results/diagneblend; NE-ROOT\'s for S224, results/diagneroot; bridge 4 BASE taken at its LOR job\'s times)');
for (const [nm, t] of Object.entries(T)) {
  const coarse = t.solve, fine = 2 * t.solve + (nm === 'S224 LOR' ? 0 : simPaths * t.fwd);
  total += coarse + fine; longest = Math.max(longest, fine);
  console.log(`  ${nm}: coarse solve ${coarse} s; fine solve about ${2 * coarse} s${nm === 'S224 LOR' ? ' (no runs)' : ` and ${simPaths} runs at ${t.fwd.toFixed(4)} s`}: about ${f2(fine / 3600)} h fine`);
}
console.log(`  total about ${f2(total / 3600)} core-hours (an own opening that is neither P nor D adds about ${f2(3 * NPW * T['S380 LOR'].fwd / 3600)} h a job); the twelve jobs four at a time, about ${f2(Math.max(longest, total / 4) / 3600)} h wall at the least`);
