/*
 * NODE-1'S DERIVATION (predictions/diag-node1.md): REF-2's S360 BO record (behind REF-2's own gate), the power of item 1
 * by simulation through reduce-node1.mjs's own items(), and beside it the review's own lines (the table against BN's runs
 * within 2.5 points, at least 3.75 under) read on the same draws; the credences from the deep review after REF-2's cause
 * credences (deep-review-log.md 13 Oct 23:45 UK, read from the receipt, not typed) and the judged stories below; the
 * decision table's rows; the point and 80% interval; the budget from REF-2's logs.
 *   node research/solver/derive-node1.mjs > research/solver/results-derive-node1.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as R2 from './reduce-ref2.mjs';
import { items, key, NPW } from './reduce-node1.mjs';
import { clopperPearson } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DR = join(HERE, 'results', 'diagref2');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const binom = (n, p) => Math.min(n, Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss())));
const DRAWS = 400;

// THE JUDGED INPUTS (written before this script's output)
export const JUDGED = {
  // the share of the gap to BN's runs that the dense nodes lift BN's own-opening table by (worlds 0 and 1 alike), by the
  // review's O152 cause: NODE (the share cell holds the policy's gain): most of it, perhaps past the whole; MODEL (the
  // solve reads the base move's value even at a node): next to none; QUAD and OTHER: anywhere
  share: { 'O152-NODE': { 0.5: 0.15, 0.7: 0.25, 0.9: 0.3, 1.1: 0.2, 1.3: 0.1 }, 'O152-MODEL': { 0: 0.5, 0.1: 0.3, 0.2: 0.2 }, other: { 0: 0.25, 0.3: 0.25, 0.6: 0.25, 0.9: 0.25 } },
  // BN's runs against BO's (the dense nodes move the policy's later moves too): points, any sign
  runMove: { 0: 0.5, 0.5: 0.25, '-0.5': 0.25 },
  // item 2 (BO on this code is REF-2's BO): the option is inert off by construction and by the tree-against-HEAD table
  // hashes (the build's check); a miss only through a run's nondeterminism, never seen in these audits
  inert: 0.97,
  // the dense solve's cost against six shares: the review's two and a half times (grade D); the runs a fifth dearer
  cost: 2.5, runsCost: 1.2,
};

// 1. THE RECORDS: REF-2's S360 BO, behind REF-2's gate
const red = spawnSync('node', [join(HERE, 'reduce-ref2.mjs'), DR], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!/^GATE: passed/m.test(red.stdout || '')) { console.log('REF-2\'s files did not pass REF-2\'s gate'); process.exit(1); }
const logs = readdirSync(DR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DR, f), 'utf8'));
const bo = logs.flatMap(R2.parse).find(j => j.id === 'S360' && j.arm === 'BO');
const tO = [0, 1, 2].map(k => bo.tables[k].OWN), rO = [0, 1, 2].map(k => bo.sims[`OWN${k}`].ok / bo.sims[`OWN${k}`].n);
console.log('1. THE RECORDS (REF-2, seed 7002; results/diagref2 behind REF-2\'s gate: passed)');
console.log(`  S360 under ORDER at 60 points and six shares, own opening: tables ${tO.map(f4).join(', ')} against runs of ${rO.map(x => f4(100 * x)).join(', ')} by world (gaps ${tO.map((t, k) => f4(100 * rO[k] - t)).join(', ')})`);

// 2. THE POWER through items(): BN's table BO's plus `share` of the gap to BN's runs, BN's runs BO's moved by `move`
const mk = (arm, t, ok) => ({ id: 'S360', arm, tables: t.map((x, k) => ({ w: [1 / 6, 2 / 3, 1 / 6][k], OWN: x, READ: x })), sims: Object.fromEntries(ok.map((o, k) => [`OWN${k}`, { ai: 12, ok: o, n: NPW, bridge: o, bits: 'x', bitsB: 'y' }])), solve: { secs: 1 } });
const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
const okO = rO.map(p => Math.round(p * NPW));
function setOf(share, move) {
  const okN = rO.map(p => binom(NPW, Math.min(1, Math.max(0, p + move / 100))));
  const tN = tO.map((t, k) => t + share * (100 * (rO[k] + move / 100) - t));
  return { [key('S360', 'BN/P60S15Q5')]: mk('BN', tN, okN), [key('S360', 'BO/P60S6Q5')]: mk('BO', tO, okO) };
}
const ref2 = mk('BO', tO, okO), bitsOf = (j, nm) => ones(NPW, j.sims[nm].ok);
const cp = (ok, n, al) => clopperPearson(ok, n, al);
// the review's lines on the same draws: HELD when BN's table is within 2.5 points of its runs' interval in worlds 0 and 1,
// FALSIFIED when its runs' bottom is at least 3.75 above the table in both (the runs' interval at 2 x ALPHA / 4)
const review = J => { const bn = J[key('S360', 'BN/P60S15Q5')], c = [0, 1].map(k => { const s = bn.sims[`OWN${k}`], [l, h] = cp(s.ok, s.n, 0.025), t = bn.tables[k].OWN; return { lo: t - 100 * h, hi: t - 100 * l }; }); return c.every(x => x.lo >= -2.5) ? 'HELD' : c.every(x => x.hi <= -3.75) ? 'FALSIFIED' : 'INCONCLUSIVE'; };
const P = {}, Q = {}, cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 });
const SH = [0, 0.1, 0.2, 0.3, 0.5, 0.6, 0.7, 0.9, 1.1, 1.3], MV = [-0.5, 0, 0.5];
for (const s of SH) for (const m of MV) { const c = cnt(), r = cnt(); for (let d = 0; d < DRAWS; d++) { const J = setOf(s, m); c[items(J, ref2, bitsOf)['1'].outcome]++; r[review(J)]++; } P[`${s}|${m}`] = Object.fromEntries(Object.entries(c).map(([x, v]) => [x, v / DRAWS])); Q[`${s}|${m}`] = Object.fromEntries(Object.entries(r).map(([x, v]) => [x, v / DRAWS])); }
const row = (T, k) => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f4(T[k][x])}`).join(' ');
console.log(`\n2. THE POWER (${DRAWS} draws a cell through reduce-node1.mjs's items(); beside it the review's lines on the same draws)`);
for (const s of SH) console.log(`  the nodes lifting ${s} of the gap: ${MV.map(m => `runs moved ${m}: ${row(P, `${s}|${m}`)}`).join('; ')}\n      the review's lines: ${MV.map(m => `runs moved ${m}: ${row(Q, `${s}|${m}`)}`).join('; ')}`);

// 3. THE CREDENCES: the receipt's cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 13 Oct 23:45 UK \|/.test(l));
const all = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(rec || '') || ['', ''])[1].matchAll(/([A-Z0-9]+-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const c152 = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith('O152-'))), sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(c152).length !== 4 || Math.abs(sum(c152) - 1) > 0.02) { console.log(`the receipt's O152 CAUSE CREDENCES did not read (${JSON.stringify(all)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const outOf = p => { const u = rnd(); return u < p.HELD ? 'HELD' : u < p.HELD + p.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const near = (x, keys) => keys.reduce((b, k) => (Math.abs(k - x) < Math.abs(b - x) ? k : b), keys[0]);
const C1 = cnt(), C2 = cnt(), CR = cnt(), rows = { A: 0, B: 0, D: 0 }, Mn = 40000, R1 = [];
for (let d = 0; d < Mn; d++) {
  const c = pick(c152), s = Number(pick(JUDGED.share[c] || JUDGED.share.other)), m = Number(pick(JUDGED.runMove));
  const o1 = outOf(P[`${near(s, SH)}|${near(m, MV)}`]), o2 = rnd() < JUDGED.inert ? 'HELD' : 'FALSIFIED', orv = outOf(Q[`${near(s, SH)}|${near(m, MV)}`]);
  C1[o1]++; C2[o2]++; CR[orv]++; R1.push(s + (rnd() - 0.5) * 0.2);
  if (o2 === 'HELD' && o1 === 'HELD') rows.A++; else if (o2 === 'HELD' && o1 === 'FALSIFIED') rows.B++; else rows.D++;
}
const pct = (xs, qq) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(qq * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 13 Oct 23:45 UK: ${Object.entries(c152).map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${Mn} draws)`);
console.log(`CREDENCE item 1: point ${f4(mean(R1))} HELD ${f2(C1.HELD / Mn)} INCONCLUSIVE ${f2(C1.INCONCLUSIVE / Mn)} FALSIFIED ${f2(C1.FALSIFIED / Mn)}`);
console.log(`CREDENCE item 2: point - HELD ${f2(C2.HELD / Mn)} INCONCLUSIVE ${f2(C2.INCONCLUSIVE / Mn)} FALSIFIED ${f2(C2.FALSIFIED / Mn)}`);
console.log(`  the review's lines on the same stories: HELD ${f2(CR.HELD / Mn)} INCONCLUSIVE ${f2(CR.INCONCLUSIVE / Mn)} FALSIFIED ${f2(CR.FALSIFIED / Mn)}`);
console.log(`  POINT item 1: ${f4(mean(R1))} (80% interval ${f4(pct(R1, 0.1))} to ${f4(pct(R1, 0.9))}; the share of world 0's gap the nodes lift)`);
console.log(`  DECISION ROWS: items 1 and 2 HELD ${f2(rows.A / Mn)}; item 1 FALSIFIED, item 2 HELD ${f2(rows.B / Mn)}; else ${f2(rows.D / Mn)}`);

// 4. THE BUDGET: REF-2's S360 BO (solve plus runs, the forceIdentity line's time)
const lg = logs.find(t => /^S360\s+case \| job BO\/P60S6Q5 \|/m.test(t));
const sv = Number((/solve CAND BO\/P60S6Q5: table \S+ secs (\d+)/.exec(lg) || [])[1]), rn = Number((/forceIdentity \d+\/\d+ secs (\d+)/.exec(lg) || [])[1]);
const bn = JUDGED.cost * sv + JUDGED.runsCost * rn, b6 = sv + rn;
console.log('\n4. THE BUDGET (REF-2\'s S360 BO log: solve and runs; the dense solve and runs scaled by the judged factors)');
console.log(`  BO at six shares about ${f2(b6 / 3600)} h; BN about ${f2(bn / 3600)} h; two jobs on two cores, about ${f2(Math.max(bn, b6) / 3600)} h wall, ${f2((bn + b6) / 3600)} core-hours`);
