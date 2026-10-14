/*
 * NODE-AX'S DERIVATION (predictions/diag-nodeax.md): the records (NODE-1's BN and BO, behind NODE-1's gate; the per-path
 * spread of the ledger's terms from the preflight's kept files, the only record of it, at a fifteenth of the points and
 * 40 paths a world), the power of items 1-3 by simulation through reduce-nodeax.mjs's own items() at the record's spread
 * and at two and four times it (the sensitivity rows), the credences from the deep review after NODE-1's cause credences
 * (deep-review-log.md 14 Oct 06:33 UK, read from the receipt, not typed) and the judged stories below, the decision
 * table's rows, the point and 80% interval, and the budget from NODE-1's logs.
 *   node research/solver/derive-nodeax.mjs > research/solver/results-derive-nodeax.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as N1 from './reduce-node1.mjs';
import { items, key, NPW } from './reduce-nodeax.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DN = join(HERE, 'results', 'diagnode1'), DP = join(HERE, 'results', 'nodeax-preflight');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());

// THE JUDGED INPUTS (written before this script's output)
export const JUDGED = {
  // GB (the bridge's grid residual) as a share of BN's table less its runs (NODE-1's), by the review's N2 cause: the grid
  // causes put most of the gap in the bridge's grid residual; QUAD in T; MODEL and NOISE part of it
  gbShare: { 'N2-SHARE': 0.85, 'N2-B': 0.8, 'N2-W': 0.8, 'N2-MODEL': 0.35, 'N2-QUAD': 0.2, 'N2-NOISE': 0.5, other: 0.6 },
  // F = the pension share's term over GB, by cause (a share term past the whole is allowed where the others offset it)
  share: { 'N2-SHARE': { 0.5: 0.15, 0.7: 0.3, 0.9: 0.3, 1.1: 0.15, 1.3: 0.1 }, 'N2-B': { 0.1: 0.4, 0.25: 0.4, 0.45: 0.2 }, 'N2-W': { 0.1: 0.4, 0.25: 0.4, 0.45: 0.2 }, other: { 0: 0.25, 0.3: 0.25, 0.6: 0.25, 0.9: 0.25 } },
  // the late years' part of the share term: the review's finding (the cliff narrows below a cell from year 3) under SHARE
  late: { 'N2-SHARE': { 0.4: 0.2, 0.6: 0.4, 0.8: 0.4 }, other: { 0.2: 0.3, 0.45: 0.4, 0.7: 0.3 } },
  // BO's share term less BN's in world 0 (points): about NODE-1's lift of BN's table (2.98), the split catching most of it
  known: { '-3.0': 0.5, '-2.0': 0.3, '-4.0': 0.2 },
  // REST as a share of GB in size (the clearance needs at most a half): judged from the 4-point build check's large REST
  // shrinking with the cells, never typed from its figures
  rest: { 0.1: 0.45, 0.3: 0.25, 0.7: 0.3 },
  // item 0: the same code reproduces NODE-1's solves bit for bit (deterministic); a miss only through the environment
  repro: 0.97,
  // the ledger's cost against NODE-1's runs (each bridge year's six projections and the cash backup on every path)
  ledgerCost: 1.2,
};

// 1. THE RECORDS: NODE-1, behind its gate; the preflight's per-path spread
const red = spawnSync('node', [join(HERE, 'reduce-node1.mjs'), DN], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!/^GATE: passed/m.test(red.stdout || '')) { console.log('NODE-1\'s files did not pass NODE-1\'s gate'); process.exit(1); }
const n1logs = readdirSync(DN).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DN, f), 'utf8'));
const nj = n1logs.flatMap(N1.parse), bn1 = nj.find(j => j.arm === 'BN'), bo1 = nj.find(j => j.arm === 'BO');
const gap = [0, 1, 2].map(k => bn1.tables[k].OWN - 100 * bn1.sims[`OWN${k}`].ok / bn1.sims[`OWN${k}`].n);
console.log('1. THE RECORDS (NODE-1, seed 7002, behind NODE-1\'s gate: passed; the preflight\'s kept files, 4 wealth points, 40 paths a world)');
console.log(`  BN's own-opening table less its runs by world: ${gap.map(f4).join(', ')} points`);
const pf = Object.fromEntries(readdirSync(DP).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DP, f))).toString())]));
const arrOf = (f, x, k) => { const b = Buffer.from(f.per[`${x}${k}`], 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const fBN = Object.values(pf).find(f => /^BN\//.test(f.job)), fBO = Object.values(pf).find(f => /^BO\//.test(f.job));
const sd = a => { const m = a.reduce((t, x) => t + x, 0) / a.length; return Math.sqrt(a.reduce((t, x) => t + (x - m) ** 2, 0) / (a.length - 1)); };
const corr = (a, b) => { const ma = a.reduce((t, x) => t + x, 0) / a.length, mb = b.reduce((t, x) => t + x, 0) / b.length; let c = 0; for (let i = 0; i < a.length; i++) c += (a[i] - ma) * (b[i] - mb); return c / (a.length - 1) / (sd(a) * sd(b) || 1); };
const W01 = [0, 1], avg = f => W01.reduce((t, k) => t + f(k), 0) / W01.length;
const SP = { GB: avg(k => sd(arrOf(fBN, 'GB', k))), AA: avg(k => sd(arrOf(fBN, 'AA', k))), AL: avg(k => sd(arrOf(fBN, 'AL', k))), D: sd(arrOf(fBO, 'AA', 0).map((x, i) => x - arrOf(fBN, 'AA', 0)[i])),
  rAG: avg(k => corr(arrOf(fBN, 'AA', k), arrOf(fBN, 'GB', k))), rLA: avg(k => corr(arrOf(fBN, 'AL', k), arrOf(fBN, 'AA', k))) };
for (const x of Object.keys(SP)) if (!Number.isFinite(SP[x])) SP[x] = x.startsWith('r') ? 0 : 1;
console.log(`  the per-path spread at the preflight (points; worlds 0 and 1 averaged): GB ${f4(SP.GB)}, AA ${f4(SP.AA)}, AL ${f4(SP.AL)}, BO's AA less BN's in world 0 ${f4(SP.D)}; correlation AA with GB ${f4(SP.rAG)}, AL with AA ${f4(SP.rLA)}`);

// 2. THE POWER through items(): per-path arrays at the stories' means and the record's spread (times `x` for sensitivity)
const n = NPW;
function setOf({ F, late, D, rest, gbs }, x = 1) {
  const P = {};
  for (const k of [0, 1, 2]) {
    const mGB = gbs * gap[k], mAA = F * mGB, mAL = late * mAA, mR = rest * Math.abs(mGB), G = [], A = [], AL = [], R = [], BO = [];
    for (let i = 0; i < n; i++) {
      const z1 = gauss(), z2 = gauss(), z3 = gauss(), z4 = gauss();
      const g = mGB + x * SP.GB * z1, a = mAA + x * SP.AA * (SP.rAG * z1 + Math.sqrt(Math.max(0, 1 - SP.rAG ** 2)) * z2), l = mAL + x * SP.AL * (SP.rLA * (a - mAA) / (x * SP.AA || 1) + Math.sqrt(Math.max(0, 1 - SP.rLA ** 2)) * z3);
      G.push(g); A.push(a); AL.push(l); R.push(mR); BO.push(a + D + x * SP.D * z4);
    }
    P[`BN GB ${k}`] = G; P[`BN AA ${k}`] = A; P[`BN AL ${k}`] = AL; P[`BN REST ${k}`] = R; P[`BO AA ${k}`] = BO;
  }
  return (arm, x2, k) => P[`${arm} ${x2} ${k}`] || new Array(n).fill(0);
}
const J = { [key('S360', 'BN/P60S15Q5')]: { tables: [0, 1, 2].map(() => ({ OWN: 1 })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { bits: `n${k}` }])) }, [key('S360', 'BO/P60S6Q5')]: { tables: [0, 1, 2].map(() => ({ OWN: 1 })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { bits: `o${k}` }])) } };
const n1 = { BN: { tables: [0, 1, 2].map(() => ({ OWN: 1 })), runs: ['n0', 'n1', 'n2'] }, BO: { tables: [0, 1, 2].map(() => ({ OWN: 1 })), runs: ['o0', 'o1', 'o2'] } };
const cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), DR = 60;
const cell = (story, x) => { const c = { 1: cnt(), 2: cnt(), 3: cnt(), clear: 0 }; for (let d = 0; d < DR; d++) { const it = items(setOf(story, x), J, n1); for (const i of [1, 2, 3]) c[i][it[i].outcome]++; if (it.clear) c.clear++; } return c; };
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / DR)}`).join(' ');
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-nodeax.mjs's items(); the record's spread times 1, 2 and 4)`);
const SH = [0.1, 0.25, 0.45, 0.7, 0.9, 1.1], P = {};
for (const F of SH) for (const x of [1, 2, 4]) { const c = cell({ F, late: 0.6, D: -3, rest: 0.1, gbs: 0.85 }, x); P[`${F}|${x}`] = c; if (x === 1) P[`${F}`] = c; console.log(`  item 1, the share term ${F} of GB, spread x${x}: ${row(c[1])}; item 2 (late 0.6): ${row(c[2])}; item 3 (BO 3 points past): ${row(c[3])}`); }
for (const L2 of [0.2, 0.45, 0.8]) { const c = cell({ F: 0.9, late: L2, D: -3, rest: 0.1, gbs: 0.85 }, 1); P[`late|${L2}`] = c; console.log(`  item 2, years 3 to 6 ${L2} of the share term: ${row(c[2])}`); }
for (const D of [-2, -3, -4]) { const c = cell({ F: 0.9, late: 0.6, D, rest: 0.1, gbs: 0.85 }, 1); P[`D|${D}`] = c; console.log(`  item 3, BO's share term ${-D} points past BN's: ${row(c[3])}`); }
for (const g of [0.2, 0.35, 0.5]) { const c = cell({ F: 0.9, late: 0.6, D: -3, rest: 0.1, gbs: g }, 1); P[`gbs|${g}`] = c; console.log(`  item 1, GB only ${g} of the gap (the residual outside the bridge's grid): ${row(c[1])}`); }

// 3. THE CREDENCES: the receipt's N2 cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 14 Oct 06:33 UK \|/.test(l));
const all = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(rec || '') || ['', ''])[1].matchAll(/([A-Z0-9]+-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const cN2 = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith('N2-'))), sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(cN2).length !== 7 || Math.abs(sum(cN2) - 1) > 0.02) { console.log(`the receipt's N2 CAUSE CREDENCES did not read (${JSON.stringify(all)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const near = (x, keys) => keys.reduce((b, k) => (Math.abs(k - x) < Math.abs(b - x) ? k : b), keys[0]);
const outOf = c => { const u = rnd() * DR; return u < c.HELD ? 'HELD' : u < c.HELD + c.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const C = { 0: cnt(), 1: cnt(), 2: cnt(), 3: cnt() }, rows = { A: 0, B: 0, C: 0, D: 0 }, Mn = 40000, R1 = [];
for (let d = 0; d < Mn; d++) {
  const c = pick(cN2), F = Number(pick(JUDGED.share[c] || JUDGED.share.other)), late = Number(pick(JUDGED.late[c] || JUDGED.late.other)), D = Number(pick(JUDGED.known)), rest = Number(pick(JUDGED.rest)), gbs = JUDGED.gbShare[c] ?? JUDGED.gbShare.other;
  const o0 = rnd() < JUDGED.repro ? 'HELD' : 'FALSIFIED';
  let o1 = outOf(P[`${near(F, SH)}`][1]);
  if (gbs < 0.6) o1 = outOf(P[`gbs|${near(gbs, [0.2, 0.35, 0.5])}`][1]);
  const o2 = outOf(P[`late|${near(late, [0.2, 0.45, 0.8])}`][2]), o3 = outOf(P[`D|${near(D, [-2, -3, -4])}`][3]), clear = rest <= 0.5;
  C[0][o0]++; C[1][o1]++; C[2][o2]++; C[3][o3]++; R1.push(F + (rnd() - 0.5) * 0.2);
  const ok = o0 === 'HELD' && o3 === 'HELD' && clear;
  if (ok && o1 === 'HELD' && o2 === 'HELD') rows.A++; else if (ok && o1 === 'HELD') rows.B++; else if (ok && o1 === 'FALSIFIED') rows.C++; else rows.D++;
}
const pct = (xs, qq) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(qq * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 14 Oct 06:33 UK: ${Object.entries(cN2).map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${Mn} draws)`);
for (const i of ['0', '1', '2', '3']) console.log(`CREDENCE item ${i}: point ${i === '1' ? f4(mean(R1)) : '-'} HELD ${f2(C[i].HELD / Mn)} INCONCLUSIVE ${f2(C[i].INCONCLUSIVE / Mn)} FALSIFIED ${f2(C[i].FALSIFIED / Mn)}`);
console.log(`  POINT item 1: ${f4(mean(R1))} (80% interval ${f4(pct(R1, 0.1))} to ${f4(pct(R1, 0.9))}; the pension share's part of BN's bridge residual in world 0)`);
console.log(`  DECISION ROWS: the late share cells (0, 1, 2, 3 HELD, clear) ${f2(rows.A / Mn)}; the share cells across the bridge (0, 1, 3 HELD, clear, 2 not HELD) ${f2(rows.B / Mn)}; not the share axis (0, 3 HELD, clear, 1 FALSIFIED) ${f2(rows.C / Mn)}; else ${f2(rows.D / Mn)}`);

// 4. THE BUDGET: NODE-1's logs (solve, and runs from the forceIdentity line), the ledger judged dearer
const secs = (re, txt) => { const m = re.exec(txt); return m ? Number(m[1]) : NaN; };
const lg = arm => n1logs.find(t => new RegExp(`job ${arm}/P60S\\d+Q5`).test(t));
const job = arm => secs(new RegExp(`solve CAND ${arm}/P60S\\d+Q5: table \\S+ secs (\\d+)`), lg(arm)) + JUDGED.ledgerCost * secs(/forceIdentity \d+\/\d+ secs (\d+)/, lg(arm)) * NPW / 4000;
console.log('\n4. THE BUDGET (NODE-1\'s logs: solve, and its runs scaled to these paths and by the ledger\'s judged cost)');
console.log(`  BN about ${f2(job('BN') / 3600)} h; BO about ${f2(job('BO') / 3600)} h; two jobs on two cores, about ${f2(Math.max(job('BN'), job('BO')) / 3600)} h wall, ${f2((job('BN') + job('BO')) / 3600)} core-hours`);
