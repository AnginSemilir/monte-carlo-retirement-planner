/*
 * NODE-AX'S DERIVATION, RE-CUT (predictions/diag-nodeax.md; the escalation review's design,
 * escalations/14-Oct-bridge-under-read-report.md section 4.2): the records (NODE-1's BN and BO behind NODE-1's gate; the
 * per-path spread of the re-cut ledger's terms from the re-cut preflight's kept files, behind reduce-nodeax.mjs's own
 * gate in --preflight mode, at a fifteenth of the points and 40 paths a world), the power of items 1-3 by simulation
 * through reduce-nodeax.mjs's own items() at the record's spread times 0.5, 1, 2 and 4, the credences from the deep
 * review after NODE-1's cause credences (deep-review-log.md 14 Oct 06:33 UK, read from the receipt, not typed) through the
 * judged stories below, the decision table's rows (R1-R4 and else), the point and 80% interval, and the budget.
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

// THE JUDGED INPUTS (committed before this script's output; grade D throughout)
export const JUDGED = {
  // the receipt's N2-SHARE split by where in the bridge the share axis errs: the late band (years 4-6, the cliff narrower
  // than a dense cell) against the early split (years 1-3 and the de-risked layers), in the escalation review's ratio
  // of its LATE-BAND (0.45) to its EARLY-SPLIT (0.12)
  shareLate: 0.45 / (0.45 + 0.12),
  // gbs: BN's bridge-years grid residual GB as a share of its own-opening table less its runs (NODE-1's gap, by world),
  // by story. The grid stories put most of the gap in GB (a share past 1 where T or GA offsets it); QUAD puts it in T
  // (the one-step value and the table carry the same quadrature, so the runs see it, not the reads); MODEL after the
  // bridge or in REST; NOISE a structural part smaller than the gap shown
  gbs: {
    LATE: { 0.6: 0.2, 0.85: 0.5, 1.1: 0.3 }, EARLY: { 0.6: 0.2, 0.85: 0.5, 1.1: 0.3 },
    W: { 0.5: 0.25, 0.85: 0.5, 1.1: 0.25 }, B: { 0.5: 0.3, 0.85: 0.5, 1.1: 0.2 },
    MODEL: { 0: 0.4, 0.3: 0.35, 0.7: 0.25 }, QUAD: { 0: 0.5, 0.3: 0.3, 0.6: 0.2 },
    NOISE: { 0.2: 0.3, 0.45: 0.4, 0.7: 0.3 }, OTHER: { 0.2: 0.3, 0.5: 0.35, 0.85: 0.35 },
  },
  // F_L: years 4-6's part of GB, by story (three of the seven bridge years: about 0.43 if spread evenly)
  late: {
    LATE: { 0.4: 0.2, 0.6: 0.35, 0.8: 0.45 }, EARLY: { 0.1: 0.35, 0.25: 0.4, 0.4: 0.25 },
    W: { 0.4: 0.3, 0.6: 0.4, 0.8: 0.3 }, B: { 0.25: 0.3, 0.43: 0.4, 0.6: 0.3 },
    other: { 0.2: 0.3, 0.43: 0.4, 0.7: 0.3 },
  },
  // item 3: BO's GB less BN's in world 0 (points). NODE-1 lifted BN's table 2.98 over BO's (B) through the share axis
  // alone, a bridge-years grid effect whatever carries the remainder; a part may land in T through the moves chosen
  known: { '-3.5': 0.15, '-2.8': 0.45, '-2.0': 0.25, '-1.2': 0.15 },
  // item 0: the solver code is unchanged since NODE-1 (code d297b820d217 in both), so its solves and runs repeat bit for
  // bit; a miss only through the environment
  repro: 0.97,
  // the re-cut ledger's cost against NODE-1's runs (one table read and one move's one-step value a path-year, no
  // projections): about the runs' own
  ledgerCost: 1.0,
};

// 1. THE RECORDS: NODE-1, behind its gate; the re-cut preflight's per-path spread, behind the re-cut reducer's gate
const red = spawnSync('node', [join(HERE, 'reduce-node1.mjs'), DN], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!/^GATE: passed/m.test(red.stdout || '')) { console.log('NODE-1\'s files did not pass NODE-1\'s gate'); process.exit(1); }
const pre = spawnSync('node', [join(HERE, 'reduce-nodeax.mjs'), DP, '40', '15', '--preflight'], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!/^GATE: passed/m.test(pre.stdout || '')) { console.log(`the preflight's files did not pass the re-cut reducer's gate:\n${(pre.stdout || '').slice(-1500)}`); process.exit(1); }
const n1logs = readdirSync(DN).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DN, f), 'utf8'));
const nj = n1logs.flatMap(N1.parse), bn1 = nj.find(j => j.arm === 'BN'), bo1 = nj.find(j => j.arm === 'BO');
const gapOf = j => [0, 1, 2].map(k => j.tables[k].OWN - 100 * j.sims[`OWN${k}`].ok / j.sims[`OWN${k}`].n), gap = gapOf(bn1), gapO = gapOf(bo1);
console.log('1. THE RECORDS (NODE-1, seed 7002, behind NODE-1\'s gate: passed; the re-cut preflight\'s kept files, 4 wealth points, 40 paths a world, behind the re-cut reducer\'s gate: passed)');
console.log(`  BN's own-opening table less its runs by world: ${gap.map(f4).join(', ')} points; BO's: ${gapO.map(f4).join(', ')}; BO's less BN's: ${gapO.map((x, k) => f4(x - gap[k])).join(', ')}`);
const pf = Object.fromEntries(readdirSync(DP).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DP, f))).toString())]));
const arrOf = (f, x, k) => { const b = Buffer.from(f.per[`${x}${k}`], 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const fBN = Object.values(pf).find(f => /^BN\//.test(f.job)), fBO = Object.values(pf).find(f => /^BO\//.test(f.job));
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((t, x) => t + (x - m) ** 2, 0) / (a.length - 1)); };
const corr = (a, b) => { const ma = mean(a), mb = mean(b); let c = 0; for (let i = 0; i < a.length; i++) c += (a[i] - ma) * (b[i] - mb); return c / (a.length - 1) / (sd(a) * sd(b) || 1); };
for (const k of [0, 1]) {
  const g = arrOf(fBN, 'GB', k), l = arrOf(fBN, 'GL', k);
  console.log(`  BN world ${k} at the preflight: GB mean ${f4(mean(g))} sd ${f4(sd(g))}; GL mean ${f4(mean(l))} sd ${f4(sd(l))}; corr(GL, GB) ${f4(corr(l, g))}; F_L ${f4(mean(l) / mean(g))}; T sd ${f4(sd(arrOf(fBN, 'T', k)))}; GA mean ${f4(mean(arrOf(fBN, 'GA', k)))}`);
}
const W01 = [0, 1], avg = f => W01.reduce((t, k) => t + f(k), 0) / W01.length;
const dBO = arrOf(fBO, 'GB', 0).map((x, i) => x - arrOf(fBN, 'GB', 0)[i]);
// item 3's spread: the paired spread at 4 points is no record of the 60-point one (the arms all but coincide there, the
// reach under a hundredth of a point), so the unpaired bound from the same files is used, the larger (added after the
// first output, which used the paired spread; declared in the prediction)
const Dun = Math.sqrt(sd(arrOf(fBN, 'GB', 0)) ** 2 + sd(arrOf(fBO, 'GB', 0)) ** 2);
const SP = { GB: avg(k => sd(arrOf(fBN, 'GB', k))), GL: avg(k => sd(arrOf(fBN, 'GL', k))), rLG: avg(k => corr(arrOf(fBN, 'GL', k), arrOf(fBN, 'GB', k))), D: Math.max(sd(dBO), Dun) };
for (const x of Object.keys(SP)) if (!Number.isFinite(SP[x])) { console.log(`the preflight's spread ${x} did not read`); process.exit(1); }
console.log(`  the per-path spread used (points; worlds 0 and 1 averaged): GB ${f4(SP.GB)}, GL ${f4(SP.GL)}, corr(GL, GB) ${f4(SP.rLG)}; BO's GB less BN's, world 0: paired at the preflight mean ${f4(mean(dBO))} sd ${f4(sd(dBO))}, the unpaired bound ${f4(Dun)}, used ${f4(SP.D)}`);

// 2. THE POWER through items(): per-path arrays at a story's means and the record's spread (times x)
const n = NPW;
function setOf({ gbs, F, D }, x = 1) {
  const P = {}, r = Math.max(-1, Math.min(1, SP.rLG));
  for (const k of [0, 1, 2]) {
    const mG = gbs * gap[k], mL = F * mG, G = new Float64Array(n), L = new Float64Array(n), O = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const z1 = gauss(), z2 = gauss(), z3 = gauss();
      G[i] = mG + x * SP.GB * z1; L[i] = mL + x * SP.GL * (r * z1 + Math.sqrt(1 - r * r) * z2); O[i] = G[i] + D + x * SP.D * z3;
    }
    P[`BN GB ${k}`] = G; P[`BN GL ${k}`] = L; P[`BO GB ${k}`] = O;
  }
  return (arm, x2, k) => P[`${arm} ${x2} ${k}`] || new Float64Array(n);
}
const J = { [key('S360', 'BN/P60S15Q5')]: { tables: [0, 1, 2].map(() => ({ OWN: 1 })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { bits: `n${k}` }])) }, [key('S360', 'BO/P60S6Q5')]: { tables: [0, 1, 2].map(() => ({ OWN: 1 })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { bits: `o${k}` }])) } };
const n1 = { BN: { tables: [0, 1, 2].map(() => ({ OWN: 1 })), runs: ['n0', 'n1', 'n2'] }, BO: { tables: [0, 1, 2].map(() => ({ OWN: 1 })), runs: ['o0', 'o1', 'o2'] } };
const cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), DR = 40;
// item 2 is read only when item 1 is HELD, so its cells count the draws in which item 1 is HELD (c2h)
const cell = (story, x) => { const c = { 1: cnt(), 2: cnt(), 3: cnt(), c2h: cnt() }; for (let d = 0; d < DR; d++) { const it = items(setOf(story, x), J, n1); for (const i of [1, 2, 3]) c[i][it[i].outcome]++; if (it['1'].outcome === 'HELD') c.c2h[it['2'].outcome]++; } return c; };
const tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => (tot(c) ? ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ') + (tot(c) < DR ? ` (of ${tot(c)} draws with item 1 HELD)` : '') : 'no draw with item 1 HELD');
const XS = [0.5, 1, 2, 4], GBS = [0, 0.2, 0.3, 0.45, 0.6, 0.85, 1.1], G2 = [0.45, 0.6, 0.85, 1.1], FL = [0.1, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.6, 0.8], DS = [-3.5, -2.8, -2, -1.2, -0.5], PW = {};
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-nodeax.mjs's items(), ${n} paths a world; the record's spread times ${XS.join(', ')})`);
for (const x of XS) {
  for (const g of GBS) { const c = cell({ gbs: g, F: 0.6, D: -2.8 }, x); PW[`1|${g}|${x}`] = c[1]; console.log(`  x${x} item 1, GB ${g} of the gap (${f4(g * gap[0])}, ${f4(g * gap[1])}): ${row(c[1])}`); }
  for (const g of G2) for (const F of FL) { const c = cell({ gbs: g, F, D: -2.8 }, x); PW[`2|${g}|${F}|${x}`] = c.c2h; console.log(`  x${x} item 2, years 4-6 ${F} of GB (GB ${g} of the gap): ${row(c.c2h)}`); }
  for (const D of DS) { const c = cell({ gbs: 0.85, F: 0.6, D }, x); PW[`3|${D}|${x}`] = c[3]; console.log(`  x${x} item 3, BO's GB ${D} past BN's: ${row(c[3])}`); }
}

// 3. THE CREDENCES: the receipt's N2 cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 14 Oct 06:33 UK \|/.test(l));
const all = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(rec || '') || ['', ''])[1].matchAll(/([A-Z0-9]+-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const cN2 = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith('N2-'))), sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(cN2).length !== 7 || Math.abs(sum(cN2) - 1) > 0.02) { console.log(`the receipt's N2 CAUSE CREDENCES did not read (${JSON.stringify(all)})`); process.exit(1); }
const story = { ...Object.fromEntries(Object.entries(cN2).filter(([k]) => k !== 'N2-SHARE').map(([k, v]) => [k.slice(3), v])), LATE: cN2['N2-SHARE'] * JUDGED.shareLate, EARLY: cN2['N2-SHARE'] * (1 - JUDGED.shareLate) };
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const near = (v, keys) => keys.reduce((b, k) => (Math.abs(k - v) < Math.abs(b - v) ? k : b), keys[0]);
const outOf = c => { if (!tot(c)) return 'INCONCLUSIVE'; const u = rnd() * tot(c); return u < c.HELD ? 'HELD' : u < c.HELD + c.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const Mn = 40000;
function credences(x) {
  const C = { 0: cnt(), 1: cnt(), 2: cnt(), 3: cnt() }, rows = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, R1v = [];
  for (let d = 0; d < Mn; d++) {
    const s = pick(story), gbs = Number(pick(JUDGED.gbs[s])), F = Number(pick(JUDGED.late[s] || JUDGED.late.other)), D = Number(pick(JUDGED.known));
    const o0 = rnd() < JUDGED.repro ? 'HELD' : 'FALSIFIED', o1 = outOf(PW[`1|${near(gbs, GBS)}|${x}`]);
    const o2 = o1 === 'HELD' ? outOf(PW[`2|${near(gbs, G2)}|${near(F, FL)}|${x}`]) : 'INCONCLUSIVE', o3 = outOf(PW[`3|${near(D, DS)}|${x}`]);
    C[0][o0]++; C[1][o1]++; C[2][o2]++; C[3][o3]++; R1v.push(gbs * gap[0] + x * SP.GB / Math.sqrt(n) * gauss());
    const ok = o0 === 'HELD' && o3 === 'HELD';
    if (ok && o1 === 'HELD') rows[{ HELD: 'R1', FALSIFIED: 'R2', INCONCLUSIVE: 'R3' }[o2]]++; else if (ok && o1 === 'FALSIFIED') rows.R4++; else rows.else++;
  }
  return { C, rows, R1v };
}
const pct = (xs, qq) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(qq * s.length))]; };
console.log(`\n3. THE CREDENCES (the receipt of 14 Oct 06:33 UK: ${Object.entries(cN2).map(([k, v]) => `${k}=${v}`).join('; ')}; N2-SHARE split late ${f2(JUDGED.shareLate)} and early; the judged stories in this script's JUDGED; ${Mn} draws)`);
const main = credences(1);
for (const i of ['0', '1', '2', '3']) console.log(`CREDENCE item ${i}: point ${i === '1' ? f4(mean(main.R1v)) : '-'} HELD ${f2(main.C[i].HELD / Mn)} INCONCLUSIVE ${f2(main.C[i].INCONCLUSIVE / Mn)} FALSIFIED ${f2(main.C[i].FALSIFIED / Mn)}`);
console.log(`  POINT item 1: ${f4(mean(main.R1v))} (80% interval ${f4(pct(main.R1v, 0.1))} to ${f4(pct(main.R1v, 0.9))}; BN's bridge-years grid residual in world 0, points)`);
const rowsOf = r => `R1 (the bridge grid, late: 0, 1, 2, 3 HELD) ${f2(r.R1 / Mn)}; R2 (not late: 0, 1, 3 HELD, 2 FALSIFIED) ${f2(r.R2 / Mn)}; R3 (years mixed: 0, 1, 3 HELD, 2 INCONCLUSIVE) ${f2(r.R3 / Mn)}; R4 (not the bridge grid: 0, 3 HELD, 1 FALSIFIED) ${f2(r.R4 / Mn)}; else ${f2(r.else / Mn)}`;
console.log(`  DECISION ROWS: ${rowsOf(main.rows)}`);
for (const x of XS.filter(v => v !== 1)) console.log(`  SENSITIVITY, the spread x${x}: ${rowsOf(credences(x).rows)}`);

// 4. THE BUDGET: NODE-1's logs (solve, and its runs from the forceIdentity line) and the preflight's own ledger seconds
const secs = (re, txt) => { const m = re.exec(txt || ''); return m ? Number(m[1]) : NaN; };
const lg = arm => n1logs.find(t => new RegExp(`job ${arm}/P60S\\d+Q5`).test(t));
const plg = readdirSync(DP).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DP, f), 'utf8'));
const pled = arm => secs(new RegExp(`checks ${arm}/P60S\\d+Q5: ownTook \\d+/\\d+ identity \\d+/\\d+ secs (\\d+)`), plg.find(t => new RegExp(`job ${arm}/`).test(t)));
const job = arm => { const s = secs(new RegExp(`solve CAND ${arm}/P60S\\d+Q5: table \\S+ secs (\\d+)`), lg(arm)), r = JUDGED.ledgerCost * secs(/forceIdentity \d+\/\d+ secs (\d+)/, lg(arm)) * NPW / 4000, p = pled(arm) * NPW / 40; return { s, r, p, t: s + Math.max(r, p) }; };
console.log('\n4. THE BUDGET (NODE-1\'s logs: solve, and its runs times the ledger\'s judged cost; the preflight\'s own ledger seconds at 40 paths scaled to these paths, at 4 points; the larger ledger taken)');
for (const arm of ['BN', 'BO']) { const j = job(arm); console.log(`  ${arm}: solve ${j.s} s; ledger from NODE-1's runs ${Math.round(j.r)} s, from the preflight ${Math.round(j.p)} s; about ${f2(j.t / 3600)} h`); }
console.log(`  two jobs on two cores, about ${f2(Math.max(job('BN').t, job('BO').t) / 3600)} h wall, ${f2((job('BN').t + job('BO').t) / 3600)} core-hours`);
