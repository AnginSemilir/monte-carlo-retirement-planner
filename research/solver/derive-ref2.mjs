/*
 * REF-2'S DERIVATION (predictions/diag-ref2.md): NE-REF's S360 BASE and RS records (behind NE-REF's own gate), the power of
 * items 1-3 by simulation through reduce-ref2.mjs's own items(), the credences from the deep review after NE-REF's cause
 * credences (deep-review-log.md 13 Oct 18:36 UK, read from the receipt, not typed) and the judged stories below, the
 * decision table's rows, the points and 80% intervals, and the budget from NE-REF's logs.
 *   node research/solver/derive-ref2.mjs > research/solver/results-derive-ref2.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as NR from './reduce-neref.mjs';
import { items, key, NPW } from './reduce-ref2.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DN = join(HERE, 'results', 'diagneref');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const binom = (n, p) => Math.min(n, Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss())));
const DRAWS = 300, N = 1000000, FN = 40000;

// THE JUDGED INPUTS (written before this script's output)
export const JUDGED = {
  // item 1: RSO's deepening of S360's read against BO in world 0 (points), by the review's O151 cause; worlds 1 and 2 take
  // the share NE-REF's RS showed against BASE (0.3281 and 0.0535 of 1.2587: a quarter and a twentieth). O151-REF (the
  // reference's shortfall, which RS scales away; under ORDER the shortfall is smaller): little; O151-RS (RS's own form):
  // about NE-REF's; OTHER (ORDER moves S360's choices, the runs may not pair): spread
  deepen: { 'O151-REF': { 0: 0.45, '-0.3': 0.3, '-0.6': 0.15, '-0.9': 0.1 }, 'O151-RS': { '-1.3': 0.5, '-0.9': 0.3, '-0.5': 0.2 }, other: { 0: 0.3, '-0.5': 0.3, '-1.1': 0.4 } },
  // the discordant paths between RSO and BO a world (NE-REF's RS and BASE moved none): none, or a few each way
  discord: { 0: 0.6, 10: 0.3, 40: 0.1 },
  // item 2: the share of S360's gap beyond ORDER (GAP = ln FB - ln OW) that the state's own pots carry, by the review's
  // RR cause; the gap itself judged at 0.4 and 0.25 in worlds 0 and 1 (7ah: ORDER cut S360's error by two thirds, so a
  // third remains), and absent (ORDER at or above the engine's payment) with chance 0.15 whatever the cause
  share: { 'RR-MIXS': { 0.9: 0.3, 0.7: 0.4, 0.5: 0.2, 0.3: 0.1 }, other: { 0.1: 0.3, 0.3: 0.4, 0.5: 0.3 } },
  gap: [0.4, 0.25], noGap: 0.15,
  // item 3: BO's own-opening table less its runs on the 95% share household, points, in its worst world: the review's
  // warning that ORDER's best-order envelope is optimistic when the money just covers the bills (O36's record: 4.62%
  // unpaid against the engine's 6.46%); a shown over-read, a small one, none, or still under
  over: { 2: 0.3, 0.8: 0.2, 0: 0.3, '-3': 0.2 },
};

// 1. THE RECORDS: NE-REF's S360 BASE and RS, behind NE-REF's gate
const red = spawnSync('node', [join(HERE, 'reduce-neref.mjs'), DN], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!/^GATE: passed/m.test(red.stdout || '')) { console.log('NE-REF\'s files did not pass NE-REF\'s gate'); process.exit(1); }
const logs = readdirSync(DN).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DN, f), 'utf8'));
const jobs = logs.flatMap(NR.parse), jb = jobs.find(j => j.id === 'S360' && j.arm === 'BASE'), jr = jobs.find(j => j.id === 'S360' && j.arm === 'RS');
const tB = [0, 1, 2].map(k => jb.tables[k].OWN), tR = [0, 1, 2].map(k => jr.tables[k].OWN), rB = [0, 1, 2].map(k => jb.sims[`OWN${k}`].ok / jb.sims[`OWN${k}`].n);
console.log('1. THE RECORDS (NE-REF, seed 7002; results/diagneref behind NE-REF\'s gate: passed)');
console.log(`  S360 at 60 points, own opening: BASE's table ${tB.map(f4).join(', ')}, RS's ${tR.map(f4).join(', ')}, against runs of ${rB.map(x => f4(100 * x)).join(', ')} by world`);

// 2. THE POWER through items()
const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
const tabs = v => [0, 1, 2].map(k => ({ OWN: v[k] }));
function setOf({ deep = 0, disc = 0, share = 0.7, noGap = false, over = 0 } = {}) {
  const J = {}, bits = new Map();
  // S360: BASE and RS NE-REF's; BO at BASE's tables, RSO at BO's less the deepening (world 0 whole, 1 and 2 a quarter and a twentieth)
  const ok = rB.map(p => Math.round(p * NPW)), sims = o => Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { ok: o[k], n: NPW }]));
  J[key('S360', 'BASE/P60S6Q5')] = { id: 'S360', arm: 'BASE', tables: tabs(tB), sims: sims(ok), bits: {} };
  J[key('S360', 'RS/P60S6Q5')] = { id: 'S360', arm: 'RS', tables: tabs(tR), sims: sims(ok), bits: {} };
  J[key('S360', 'BO/P60S6Q5')] = { id: 'S360', arm: 'BO', tables: tabs(tB), sims: sims(ok), bits: {} };
  const rso = { id: 'S360', arm: 'RSO', tables: tabs(tB.map((t, k) => t + deep * [1, 0.25, 0.05][k])), sims: sims(ok), bits: {} };
  if (disc) for (let k = 0; k < 3; k++) { const b = ones(NPW, ok[k]), r = ones(NPW, ok[k]); for (let i = 0; i < disc; i++) { r[i] = 0; r[ok[k] + i] = 1; } bits.set(`BO${k}`, b); bits.set(`RSO${k}`, r); }
  J[key('S360', 'RSO/P60S6Q5')] = rso;
  // the ledger at S360's states: OW 0.3, FB at OW e^GAP (or at OW, no gap), OS at OW e^(share GAP)
  const ledger = [], flow = [];
  for (let k = 0; k < 3; k++) {
    const g = noGap ? 0 : (JUDGED.gap[k] ?? JUDGED.gap[1]), ow = 0.3, os = ow * Math.exp(share * g), fb = ow * Math.exp(g), c = p => binom(N, Math.min(1, p));
    ledger.push([0, 1, 2, 3, 4].map(() => ({ w: 0.2, pr: 0.2, form: c(0.2), N, ow: [c(ow), 0], owN: N, os: [c(os), 0], osN: N, osw: [c(os), 0], oswN: N })));
    const nb = binom(FN, Math.min(1, fb)); flow.push([{ ai: 0, bridge: nb, N: FN, survived: nb, N2: FN }, { ai: 1, bridge: 0, N: FN, survived: 0, N2: FN }]);
  }
  J[key('S360', 'L/P4S6Q5')] = { id: 'S360', arm: 'L', ledger, flow, quad: [] };
  // the 95% share household: runs about 95.36% (O36's held-out record) a world; BASE twelve points under, BO `over` from its runs
  const ok95 = [0, 1, 2].map(() => binom(NPW, 0.9536)), r95 = ok95.map(o => 100 * o / NPW);
  J[key('share 0.95', 'BASE/P60S6Q5')] = { id: 'share 0.95', arm: 'BASE', tables: tabs(r95.map(r => r - 12)), sims: sims(ok95), bits: {} };
  J[key('share 0.95', 'BO/P60S6Q5')] = { id: 'share 0.95', arm: 'BO', tables: tabs(r95.map(r => r + over)), sims: sims(ok95), bits: {} };
  return { J, bitsOf: (j, nm) => bits.get(`${j.arm}${nm.replace('OWN', '')}`) || ones(j.sims[nm].n, j.sims[nm].ok) };
}
const P = {}, cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 });
const tally = (k, fn) => { const c = cnt(); for (let d = 0; d < DRAWS; d++) c[fn()]++; P[k] = Object.fromEntries(Object.entries(c).map(([x, v]) => [x, v / DRAWS])); };
const it = s => items(s.J, s.bitsOf);
const DP = [0, -0.3, -0.5, -0.6, -0.9, -1.1, -1.3], DC = [0, 10, 40], SH = [0.1, 0.3, 0.5, 0.7, 0.9], OV = [-3, 0, 0.8, 2];
for (const d of DP) for (const c of DC) tally(`deep|${d}|${c}`, () => it(setOf({ deep: d, disc: c }))['1'].outcome);
for (const f of SH) tally(`share|${f}`, () => it(setOf({ share: f }))['2'].outcome);
tally('share|nogap', () => it(setOf({ noGap: true }))['2'].outcome);
for (const o of OV) tally(`over|${o}`, () => it(setOf({ over: o }))['3'].outcome);
const row = k => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f4(P[k][x])}`).join(' ');
console.log(`\n2. THE POWER (${DRAWS} draws a cell through reduce-ref2.mjs's items(); NE-REF's S360 BASE and RS records)`);
for (const d of DP) console.log(`  item 1, RSO deepening world 0 by ${d}: ${DC.map(c => `${c} discordant ${row(`deep|${d}|${c}`)}`).join('; ')}`);
for (const f of SH) console.log(`  item 2, the state's pots carrying ${f} of the gap beyond ORDER: ${row(`share|${f}`)}`);
console.log(`  item 2, no gap beyond ORDER: ${row('share|nogap')}`);
for (const o of OV) console.log(`  item 3, BO ${o} points from the 95% share household's runs: ${row(`over|${o}`)}`);

// 3. THE CREDENCES: the receipt's cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 13 Oct 18:36 UK \|/.test(l));
const all = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(rec || '') || ['', ''])[1].matchAll(/([A-Z0-9]+-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const of = pre => Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(pre)));
const c151 = of('O151-'), cRR = of('RR-'), sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(c151).length !== 3 || Math.abs(sum(c151) - 1) > 0.02 || Object.keys(cRR).length !== 6 || Math.abs(sum(cRR) - 1) > 0.02) { console.log(`the receipt's O151 and RR CAUSE CREDENCES did not read (${JSON.stringify(all)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const outOf = p => { const u = rnd(); return u < p.HELD ? 'HELD' : u < p.HELD + p.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const near = (x, keys) => keys.reduce((b, k) => (Math.abs(k - x) < Math.abs(b - x) ? k : b), keys[0]);
const Cn = Object.fromEntries(['1', '2', '3'].map(i => [i, cnt()])), rows = { A: 0, B: 0, C: 0, D: 0 }, Mn = 40000, R1 = [], R3 = [];
for (let d = 0; d < Mn; d++) {
  const c1 = pick(c151), cr = pick(cRR);
  const deep = Number(pick(JUDGED.deepen[c1] || JUDGED.deepen.other)), disc = Number(pick(JUDGED.discord));
  const noGap = rnd() < JUDGED.noGap, share = Number(pick(JUDGED.share[cr] || JUDGED.share.other)), over = Number(pick(JUDGED.over));
  const o = { 1: outOf(P[`deep|${near(deep, DP)}|${near(disc, DC)}`]), 2: outOf(P[noGap ? 'share|nogap' : `share|${near(share, SH)}`]), 3: outOf(P[`over|${near(over, OV)}`]) };
  for (const i of Object.keys(Cn)) Cn[i][o[i]]++;
  R1.push(deep + (rnd() - 0.5) * 0.2); R3.push(over + (rnd() - 0.5) * 0.6);
  if (o[1] === 'HELD' && o[3] === 'HELD') rows.A++;
  else if (o[1] === 'HELD' && o[3] === 'FALSIFIED') rows.B++;
  else if (o[1] === 'FALSIFIED') rows.C++;
  else rows.D++;
}
const pct = (xs, qq) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(qq * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 13 Oct 18:36 UK: ${[...Object.entries(c151), ...Object.entries(cRR)].map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${Mn} draws)`);
for (const [i, c] of Object.entries(Cn)) console.log(`CREDENCE item ${i}: point ${i === '1' ? f4(mean(R1)) : i === '3' ? f4(mean(R3)) : '-'} HELD ${f2(c.HELD / Mn)} INCONCLUSIVE ${f2(c.INCONCLUSIVE / Mn)} FALSIFIED ${f2(c.FALSIFIED / Mn)}`);
console.log(`  POINT item 1: ${f4(mean(R1))} (80% interval ${f4(pct(R1, 0.1))} to ${f4(pct(R1, 0.9))}; RSO less BO in world 0, points)`);
console.log(`  POINT item 3: ${f4(mean(R3))} (80% interval ${f4(pct(R3, 0.1))} to ${f4(pct(R3, 0.9))}; BO's table less its runs on the 95% share household, its worst world, points)`);
console.log(`  DECISION ROWS: items 1 and 3 HELD ${f2(rows.A / Mn)}; item 1 HELD, item 3 FALSIFIED ${f2(rows.B / Mn)}; item 1 FALSIFIED ${f2(rows.C / Mn)}; else ${f2(rows.D / Mn)}`);

// 4. THE BUDGET: NE-REF's S360 jobs (solve plus runs, the forceIdentity line's time) and its ledger's solve
const secs = (re, txt) => { const m = re.exec(txt); return m ? Number(m[1]) : NaN; };
const lg = arm => logs.find(t => new RegExp(`^S360\\s+case \\| job ${arm}/P60S6Q5 \\|`, 'm').test(t));
const job = arm => secs(new RegExp(`solve CAND ${arm}/P60S6Q5: table \\S+ secs (\\d+)`), lg(arm)) + secs(new RegExp(`forceIdentity \\d+/\\d+ secs (\\d+)`), lg(arm));
const s360 = Math.max(job('BASE'), job('RS')), ledgerL = secs(/solve CAND L\/P4S6Q5: table \S+ secs (\d+)/, logs.find(t => /job L\/P4S6Q5/.test(t))) + 1800;
console.log('\n4. THE BUDGET (NE-REF\'s S360 BASE and RS logs: solve plus runs; its ledger\'s solve, the ledger\'s simulations and flow judged at half an hour)');
console.log(`  S360 BO and RSO, the 95% share household's BASE and BO: about ${f2(s360 / 3600)} h each (S360's; the household judged alike); the ledger about ${f2(ledgerL / 3600)} h`);
console.log(`  total about ${f2((4 * s360 + ledgerL) / 3600)} core-hours; five jobs on four cores, the ledger first, about ${f2((ledgerL + s360) / 3600)} h wall`);
