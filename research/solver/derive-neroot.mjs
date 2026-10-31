/*
 * NE-ROOT'S DERIVATION (predictions/diag-neroot.md): what NE-SPLIT's records say about S364's and bridge 4's survival by
 * world, the power of items 1-3 and 5 by simulation through reduce-neroot.mjs's own items(), the credences from the deep
 * review's cause credences (deep-review-log.md 11 Oct 02:37 UK, read from the receipt, not typed) and the judged inputs
 * below, the decision table's rows, the points and 80% intervals, and the budget from NE-SPLIT's own logs. Reads NE-SPLIT's
 * files behind NE-SPLIT's gate (requireFairLogs over results/diagnesplit, its registered prediction, and its reducer's gate).
 *   node research/solver/derive-neroot.mjs > research/solver/results-derive-neroot.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { parse as parseNS, gate as gateNS } from './reduce-nesplit.mjs';
import { items, NPW } from './reduce-neroot.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DNS = join(HERE, 'results', 'diagnesplit');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = lam => { if (lam > 50) { const u = Math.max(1e-12, rnd()), v = rnd(); return Math.max(0, Math.round(lam + Math.sqrt(lam) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); } const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const DRAWS = 2000;

// THE JUDGED INPUTS (written before this script's output; the prediction's per-item judged lines are these)
export const JUDGED = {
  // the share of SS's over-read in worlds 0 and 1 an arm removes, by cause: 0, 0.3, 0.6, 0.8 or all of it, or 'over' (an
  // over-correction: the table driven to zero in worlds 0 and 1, so the arm's part drives the table's level); an arm's table
  // moves toward its own simulated survival by that share in every world, never below zero, its simulated survival held at
  // NE-SPLIT's (its continuation's own change judged second-order). 'over' was 'flip' (an under-read as large, built on
  // tables below zero) until the plan-auditor's BLOCKING 1 of 11 Oct 05:18 UK; its weights are unchanged
  removes: {
    R0: { 'OW-RSPLIT': { 0: 0.1, 0.3: 0.1, 0.6: 0.15, 0.8: 0.25, 1: 0.3, over: 0.1 }, 'OW-PREF': { 0: 0.6, 0.3: 0.2, 0.6: 0.1, 0.8: 0.05, 1: 0.05, over: 0 },
      'OW-BUNDLE': { 0: 0.7, 0.3: 0.15, 0.6: 0.1, 0.8: 0.05, 1: 0, over: 0 }, 'OW-OTHER': { 0: 0.4, 0.3: 0.25, 0.6: 0.15, 0.8: 0.1, 1: 0.05, over: 0.05 } },
    SIMP: { 'OW-RSPLIT': { 0: 0.6, 0.3: 0.25, 0.6: 0.1, 0.8: 0.05, 1: 0, over: 0 }, 'OW-PREF': { 0: 0.1, 0.3: 0.1, 0.6: 0.2, 0.8: 0.25, 1: 0.3, over: 0.05 },
      'OW-BUNDLE': { 0: 0.8, 0.3: 0.15, 0.6: 0.05, 0.8: 0, 1: 0, over: 0 }, 'OW-OTHER': { 0: 0.5, 0.3: 0.25, 0.6: 0.15, 0.8: 0.05, 1: 0.05, over: 0 } },
    READEROFF: { 'OW-RSPLIT': { 0: 0.05, 0.3: 0.1, 0.6: 0.15, 0.8: 0.2, 1: 0.2, over: 0.3 }, 'OW-PREF': { 0: 0.05, 0.3: 0.1, 0.6: 0.15, 0.8: 0.2, 1: 0.2, over: 0.3 },
      'OW-BUNDLE': { 0: 0.7, 0.3: 0.2, 0.6: 0.1, 0.8: 0, 1: 0, over: 0 }, 'OW-OTHER': { 0: 0.3, 0.3: 0.2, 0.6: 0.2, 0.8: 0.1, 1: 0.1, over: 0.1 } },
  },
  // P(bridge 4 under the arm moves off its table by half a point in world 0): READEROFF brings back the no-reader dead-corner
  // pessimism (SHIP's bridge 4 table 13.3493 against 7980 of 8000 simulated, results-nesplit.txt); R0 and SIMP change the
  // reader everywhere, bridge 4 included
  ctrlOff: { R0: 0.3, SIMP: 0.15, READEROFF: 0.95 },
  // how far off, in points, in world 0 (R0, SIMP: half a point, the table above its simulated survival) or in every world
  // (READEROFF: SHIP's no-reader table, 13.3493 against 99.7500 simulated, below it by about 86)
  ctrlSize: { R0: 0.5, SIMP: 0.5, READEROFF: -86 },
  // item 4 (the residual's share of SS's year-1 read), by cause: HELD, INCONCLUSIVE, FALSIFIED
  item4: { 'OW-RSPLIT': [0.6, 0.3, 0.1], 'OW-PREF': [0.1, 0.3, 0.6], 'OW-BUNDLE': [0.3, 0.4, 0.3], 'OW-OTHER': [0.3, 0.4, 0.3] },
};
const BINS = [0, 0.3, 0.6, 0.8, 1, 'over'], ARMS = ['R0', 'SIMP', 'READEROFF'];

// 1. THE RECORDS: NE-SPLIT's world lines, behind its gate
const logs = Object.fromEntries(readdirSync(DNS).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DNS, f), 'utf8')]));
if (!requireFairLogs(logs, 'research/solver/predictions/diag-nesplit.md', { exit: false })) { console.log('NE-SPLIT\'s files did not pass the fair-test gate'); process.exit(1); }
const units = Object.values(logs).flatMap(t => { const s = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t); return parseNS(t).map(u => (u.plant ? u : { ...u, stamp: s ? { code: s[1], audit: s[2], prediction: s[3], sha: s[4] } : null })); });
const files = Object.fromEntries(readdirSync(DNS).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DNS, f))).toString())]));
const bad = gateNS(units, { files });
if (bad.length) { console.log(`NE-SPLIT's gate refused: ${bad.join('; ')}`); process.exit(1); }
const U = k => units.find(u => !u.plant && `${u.id} W${u.w}` === k);
const s364 = U('S364 W0.02'), b4 = U('bridge 4 W0.02');
const worldOf = (u, o) => u.world.map(x => ({ k: x.k, weight: Number(x.weight), table: x.by[o].table, q: x.by[o].ok / x.by[o].n, ok: x.by[o].ok, n: x.by[o].n }));
const SW = worldOf(s364, 'SS'), BW = worldOf(b4, 'SS');
console.log('1. THE RECORDS (NE-SPLIT, seed 7002, 2,000 paths a world; results/diagnesplit behind its gate: passed)');
for (const x of SW) console.log(`  S364 W0.02 SS world ${x.k} (weight ${f4(x.weight)}): table ${f4(x.table)} simulated ${x.ok}/${x.n} (${f4(100 * x.q)})`);
for (const x of BW) console.log(`  bridge 4 W0.02 SS world ${x.k}: table ${f4(x.table)} simulated ${x.ok}/${x.n} (${f4(100 * x.q)}); table less simulated ${f4(x.table - 100 * x.q)}`);
const Gb0 = (SW[0].weight * (SW[0].table - 100 * SW[0].q) + SW[1].weight * (SW[1].table - 100 * SW[1].q)) / (SW[0].weight + SW[1].weight);
console.log(`  SS's gap over worlds 0 and 1 (NE-SPLIT's point, the BASE arm's expected Gb): ${f4(Gb0)} points`);

// 2. THE POWER: each arm's story (the share removed, bridge 4 kept or off) drawn at 4,000 paths a world through items()
const mkJob = (id, arm, worlds, sims) => ({ id, arm, w: '0.02', world: worlds.map((x, k) => ({ k, z: 0, weight: x.weight, by: { SS: { table: x.table, ok: sims[k], n: NPW } } })), split: [{ k: 0, o: 'SS', sv: 1, r: 0 }, { k: 1, o: 'SS', sv: 1, r: 0 }, { k: 2, o: 'SS', sv: 1, r: 0 }] });
const armTable = (f) => SW.map((x, k) => { const g = x.table - 100 * x.q, keep = f === 'over' ? (k < 2 ? -1 : 0) : 1 - f; return { weight: x.weight, table: Math.max(0, 100 * x.q + keep * g) }; });
const b4Table = (off, size = 0.5) => BW.map((x, k) => ({ weight: x.weight, table: Math.max(0, x.table + (off && (k === 0 || size < 0) ? size : 0)) }));
const drawS = () => SW.map(x => pois(NPW * x.q)), drawB = () => BW.map(x => NPW - pois(NPW * (1 - x.q)));
const power = {}, removedDraws = {};
for (const f of BINS) for (const [off, size] of [[false, 0], [true, 0.5], [true, -86]]) {
  const cnt = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }, rem = [];
  for (let d = 0; d < DRAWS; d++) {
    const J = {};
    J['S364 BASE/W0.02'] = mkJob('S364', 'BASE', SW.map(x => ({ weight: x.weight, table: x.table })), drawS());
    for (const a of ARMS) J[`S364 ${a}/W0.02`] = mkJob('S364', a, armTable(f), drawS());
    J['bridge 4 BASE/W0.02'] = mkJob('bridge 4', 'BASE', b4Table(false), drawB());
    for (const a of ARMS) J[`bridge 4 ${a}/W0.02`] = mkJob('bridge 4', a, b4Table(off, size), drawB());
    const o = items(J)[1]; cnt[o.outcome]++; rem.push(o.removed);
  }
  power[`${f}|${off ? size : 0}`] = Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, v / DRAWS]));
  removedDraws[`${f}|${off ? size : 0}`] = rem;
}
console.log(`\n2. THE POWER (${DRAWS} draws a cell at ${NPW} paths a world through reduce-neroot.mjs's items(); an arm's table moves toward its simulated survival by the share it removes; bridge 4 kept, off by half a point in world 0, or off by -86 in every world)`);
const row3 = k => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f4(power[k][x])}`).join(' ');
for (const f of BINS) console.log(`  removes ${String(f).padEnd(4)}: kept ${row3(`${f}|0`)} | off 0.5 ${row3(`${f}|0.5`)} | off -86 ${row3(`${f}|-86`)}`);
// item 5 under BASE: bridge 4's NE-SPLIT tables and simulated survival at 4,000 paths
const c5 = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 };
for (let d = 0; d < DRAWS; d++) {
  const J = { 'S364 BASE/W0.02': mkJob('S364', 'BASE', SW.map(x => ({ weight: x.weight, table: x.table })), drawS()), 'bridge 4 BASE/W0.02': mkJob('bridge 4', 'BASE', b4Table(false), drawB()) };
  for (const a of ARMS) { J[`S364 ${a}/W0.02`] = J['S364 BASE/W0.02']; J[`bridge 4 ${a}/W0.02`] = J['bridge 4 BASE/W0.02']; }
  c5[items(J)[5].outcome]++;
}
const P5 = Object.fromEntries(Object.entries(c5).map(([k, v]) => [k, v / DRAWS]));
console.log(`  item 5 (bridge 4 under BASE at NE-SPLIT's tables and rates): ${['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(k => `${k} ${f4(P5[k])}`).join(' ')}`);

// 3. THE CREDENCES: the receipt's cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 11 Oct 02:37 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: ([^|]+)/.exec(rec) || ['', ''])[1].matchAll(/(OW-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const tot = Object.values(cc).reduce((a, b) => a + b, 0);
if (!(Object.keys(cc).length === 4 && Math.abs(tot - 1) < 0.02)) { console.log(`the receipt's CAUSE CREDENCES did not read (${JSON.stringify(cc)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const outOf = p => { const u = rnd(); return u < p.HELD ? 'HELD' : u < p.HELD + p.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const cred = { 1: { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }, 2: { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }, 3: { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }, 4: { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 } };
const rows = { r1: 0, r2: 0, r3: 0, r4: 0 }, rem = { 1: [], 2: [], 3: [] }, M = 40000;
for (let d = 0; d < M; d++) {
  const cause = pick(cc), out = {};
  ARMS.forEach((a, i) => {
    const f = pick(JUDGED.removes[a][cause]), off = rnd() < JUDGED.ctrlOff[a], key = `${f === 'over' ? 'over' : Number(f)}|${off ? JUDGED.ctrlSize[a] : 0}`;
    out[i + 1] = outOf(power[key]); cred[i + 1][out[i + 1]]++;
    const rd = removedDraws[key]; rem[i + 1].push(rd[Math.floor(rnd() * rd.length)]);
  });
  const p4 = JUDGED.item4[cause], o4 = outOf({ HELD: p4[0], INCONCLUSIVE: p4[1], FALSIFIED: p4[2] }); cred[4][o4]++;
  if (out[1] === 'HELD' && out[2] !== 'HELD') rows.r1++;
  else if (out[2] === 'HELD' && out[1] !== 'HELD') rows.r2++;
  else if (out[1] === 'FALSIFIED' && out[2] === 'FALSIFIED' && out[3] === 'FALSIFIED') rows.r3++;
  else rows.r4++;
}
const pct = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 11 Oct 02:37 UK: ${Object.entries(cc).map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${M} draws)`);
for (const i of [1, 2, 3, 4]) { const c = cred[i]; console.log(`CREDENCE item ${i}: point ${i < 4 ? f4(mean(rem[i])) : '-'} HELD ${f2(c.HELD / M)} INCONCLUSIVE ${f2(c.INCONCLUSIVE / M)} FALSIFIED ${f2(c.FALSIFIED / M)}`); }
console.log(`CREDENCE item 5: point - HELD ${f2(P5.HELD)} INCONCLUSIVE ${f2(P5.INCONCLUSIVE)} FALSIFIED ${f2(P5.FALSIFIED)}`);
for (const i of [1, 2, 3]) console.log(`  POINT item ${i}: ${f4(mean(rem[i]))} (80% interval ${f4(pct(rem[i], 0.1))} to ${f4(pct(rem[i], 0.9))}; the share of SS's gap the ${ARMS[i - 1]} arm removes, over the causes and stories)`);
console.log(`  DECISION ROWS: item 1 HELD, item 2 not HELD ${f2(rows.r1 / M)}; item 2 HELD, item 1 not HELD ${f2(rows.r2 / M)}; items 1, 2 and 3 FALSIFIED ${f2(rows.r3 / M)}; else ${f2(rows.r4 / M)}`);

// 4. THE BUDGET: NE-SPLIT's own logs (the solve, and the forward pass's seconds a path)
console.log('\n4. THE BUDGET (NE-SPLIT\'s logs: each unit\'s solves and its forward pass of 48,000 paths, results/diagnesplit)');
const sec = (t, re) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const T = Object.values(logs);
const tOf = id => { const t = T.find(x => x.includes(`${id}`) && x.includes('NE/W0.02')); return { cand: sec(t, /solve CAND NE\/W0\.02: table \S+ secs (\d+)/), ship: sec(t, /solve SHIP NE\/W0\.02: table \S+ secs (\d+)/), fwd: sec(t, /forceIdentity \d+\/\d+ secs (\d+)/) / 48000 }; };
const tS = tOf('S364         '), tB = tOf('bridge 4');
const paths = 3 * 2 * NPW + 1000 * 2, pathsOwn = 3 * NPW + 1000 * 2;
const job = (t, paired) => t.cand + (paired ? t.ship : 0) + (paired ? paths : pathsOwn) * t.fwd;
const jS = job(tS, true), jB = job(tB, true), jO = job(tB, false);
console.log(`  S364: CAND solve ${tS.cand} s, SHIP ${tS.ship} s, ${tS.fwd.toFixed(4)} s a path: a job about ${f2(jS / 3600)} core-hours (${paths} paths)`);
console.log(`  bridge 4: CAND solve ${tB.cand} s, SHIP ${tB.ship} s, ${tB.fwd.toFixed(4)} s a path: a job about ${f2(jB / 3600)} core-hours`);
console.log(`  S224 and S380 (no record of their own: bridge 4's solve and pace, grade D): a job about ${f2(jO / 3600)} core-hours (${pathsOwn} paths)`);
const total = 5 * jS + 4 * jB + 2 * jO;
console.log(`  total about ${f2(total / 3600)} core-hours (5 S364 jobs, 4 bridge 4, 2 others); four at once, the long jobs first: about ${f2(Math.max(jB, (total) / 4) / 3600)} h wall at the least; SIMP's chance tables and the arms' own solves not timed (the preflight times them)`);
