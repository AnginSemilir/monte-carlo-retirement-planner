/*
 * NE-EDGE'S DERIVATION (predictions/diag-needge.md): NE-GRID C's S364 records (its 60-point over-read, behind C's gate), the
 * power of items 1-6 by simulation through reduce-needge.mjs's own items(), the credences from the deep review's cause
 * credences (deep-review-log.md 13 Oct 02:17 UK, read from the receipt, not typed) and the judged stories below, the decision
 * table's rows, the points and 80% intervals, and the budget from NE-GRID C's and B1's logs.
 *   node research/solver/derive-needge.mjs > research/solver/results-derive-needge.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as C from './reduce-negrid-c.mjs';
import { items, key, jobLabel, JOBS, PAIRS, NPW, WEIGHTS } from './reduce-needge.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DC = join(HERE, 'results', 'diagnegridc'), DB1 = join(HERE, 'results', 'diagnegrid');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const binom = (n, p) => Math.min(n, Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss())));
const DRAWS = 1000;

// THE JUDGED INPUTS (written before this script's output)
export const JUDGED = {
  // items 1 and 2: the share of S364's 60-point over-read each arm removes in worlds 0 and 1, by the deep review's S364 cause.
  // RUNSCALED (R added unscaled by the query's chance): RZ removes it, and RS too, since the query's chance is 75 and 17
  // times below the copied corners' in worlds 0 and 1 (C's probe), so RS scales most of R away; STORED (the corners' stored
  // survival over-reads from another source, which R carries): RZ removes most, RS most where the ratio is large; REF, COPY,
  // SHARE, OTHER: R carries little of it
  remove: {
    'S364-RUNSCALED': { RZ: { 0.9: 0.7, 0.6: 0.2, 0.3: 0.1 }, RS: { 0.9: 0.6, 0.6: 0.25, 0.3: 0.15 } },
    'S364-STORED': { RZ: { 0.9: 0.5, 0.6: 0.3, 0.3: 0.2 }, RS: { 0.9: 0.4, 0.6: 0.3, 0.3: 0.3 } },
    other: { RZ: { 0.6: 0.2, 0.3: 0.4, 0.1: 0.4 }, RS: { 0.6: 0.15, 0.3: 0.35, 0.1: 0.5 } },
  },
  // the two arms' removals drawn together (the plan-auditor's BLOCKING 2 of 13 Oct 02:54 UK, a declared change to this
  // block): one rank draw sets both, and RS removes at most what RZ does, since RS only scales R down where RZ zeroes it
  coupling: 'rank, RS at most RZ',
  // item 3: bridge 4 under each arm at its own opening (RZ kept bridge 4 at 30 points, NE-BLEND stage A): kept, half a point
  // off, two points off - per arm, independent
  b4: { kept: 0.85, small: 0.12, broken: 0.03 },
  // item 4: S380 (its corners all supported at P in NE-GRID C's probe, R zero there) under each arm: its 60-point tables
  // unmoved (within 0.1), moved 0.45, moved 1
  s380: { still: 0.9, some: 0.08, far: 0.02 },
  // items 5 and 6: given the arm removes most of the over-read (0.8 or more), the chance S364's own opening under it opens
  // at P (no loss) or loses nothing material; else it keeps BASE's de-risked opening and its loss (C: 2, 12, 55 of 4,000)
  openSafe: { removed: 0.6, notRemoved: 0.15 },
};

// 1. THE RECORDS: NE-GRID C's S364 BASE/P60S6Q5 (tables and runs), behind C's gate; the times from C's and B1's logs
const readDir = d => Object.fromEntries(readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(d, f), 'utf8')]));
const gz = d => Object.fromEntries(readdirSync(d).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(d, f))).toString())]));
const logsC = readDir(DC), logsB1 = readDir(DB1);
if (!requireFairLogs(logsC, C.PRED, { exit: false })) { console.log('NE-GRID C\'s files did not pass the fair-test gate'); process.exit(1); }
if (!requireFairLogs(logsB1, 'research/solver/predictions/diag-negrid-b1.md', { exit: false })) { console.log('NE-GRID B1\'s files did not pass the fair-test gate'); process.exit(1); }
const cJobs = Object.values(logsC).flatMap(C.parse), badC = C.gate(cJobs, { files: gz(DC) });
if (badC.length) { console.log(`NE-GRID C's gate refused: ${badC.join('; ')}`); process.exit(1); }
const c364 = cJobs.find(j => j.id === 'S364' && j.label === 'BASE/P60S6Q5');
const over = [0, 1, 2].map(k => c364.tables[k].P - 100 * c364.sims[`P${k}`].ok / c364.sims[`P${k}`].n);
const ownLoss = [0, 1, 2].map(k => { const o = c364.own.ai === c364.pair.D ? 'D' : 'OWN'; return c364.sims[`P${k}`].ok - c364.sims[`${o}${k}`].ok; });
console.log('1. THE RECORDS (NE-GRID C, seed 7002; results/diagnegridc behind C\'s gate: passed)');
console.log(`  S364 BASE at 60 points, P: table less its runs by world ${over.map(f4).join(', ')}; its own opening (ai ${c364.own.ai}) survives ${ownLoss.join(', ')} fewer paths than P by world`);

// 2. THE POWER through items(): a synthetic NE-EDGE set per draw, S364's BASE at C's records
const tab3 = v => [0, 1, 2].map(k => ({ k, weight: WEIGHTS[k], P: v[k], D: v[k], OWN: v[k] }));
function setOf({ fz = 0.9, fs = 0.9, b4z = 'kept', b4s = 'kept', s380 = 'still', safeZ = true, safeS = true } = {}) {
  const J = {}, bits = new Map();
  const sims = (okP, n = NPW) => Object.fromEntries([0, 1, 2].flatMap(k => [[`P${k}`, { ok: okP[k], n }], [`D${k}`, { ok: okP[k], n }], [`OWN${k}`, { ok: okP[k], n }]]));
  for (const jb of JOBS) { const [id, arm] = jb; J[key(id, jobLabel(jb))] = { id, arm, label: jobLabel(jb), own: { ai: PAIRS[id][0] }, pair: { P: PAIRS[id][0], D: PAIRS[id][1] }, tables: tab3([50, 50, 50]), sims: sims([2000, 2000, 2000]) }; }
  // S364: BASE at C's tables and runs; each arm's runs about the same truth, its table lowered by its removal of the over-read
  const truth = [0, 1, 2].map(k => c364.sims[`P${k}`].ok / NPW);
  J[key('S364', 'BASE/P60S6Q5')].tables = c364.tables.map(x => ({ k: x.k, weight: x.weight, P: x.P, D: x.D, OWN: x.OWN }));
  J[key('S364', 'BASE/P60S6Q5')].sims = sims(truth.map(p => Math.round(p * NPW)));
  for (const [arm, f, safe] of [['RZ', fz, safeZ], ['RS', fs, safeS]]) {
    const j = J[key('S364', `${arm}/P60S6Q5`)];
    j.sims = sims(truth.map(p => binom(NPW, p)));
    j.tables = tab3([0, 1, 2].map(k => Math.max(0, c364.tables[k].P - f * over[k])));
    if (!safe) { j.own.ai = 8; for (let k = 0; k < 3; k++) { const p = new Uint8Array(NPW), o = new Uint8Array(NPW), okP = j.sims[`P${k}`].ok, lost = Math.min(okP, ownLoss[k]); for (let i = 0; i < okP; i++) { p[i] = 1; o[i] = i >= lost ? 1 : 0; } bits.set(`${arm}P${k}`, p); bits.set(`${arm}OWN${k}`, o); j.sims[`OWN${k}`] = { ok: okP - lost, n: NPW }; } }
  }
  // bridge 4 under each arm: runs near 98.7 in world 0 (B1's), its own opening's table kept, half a point off, or 2 off
  for (const [arm, s] of [['RZ', b4z], ['RS', b4s]]) { const j = J[key('bridge 4', `${arm}/P60S6Q5`)], q0 = 0.987; j.sims = sims([binom(NPW, q0), binom(NPW, 0.9999), binom(NPW, 0.9999)]); j.tables = tab3([100 * j.sims.P0.ok / NPW + { kept: 0, small: 0.5, broken: 2 }[s], 99.99, 99.99]); }
  // S380: B1's tables at 50 (a stand-in: item 4 reads differences only), each arm moved by its story
  const B1S380 = [0, 1, 2].map(() => ({ P: 50, D: 50 }));
  for (const [arm, s] of [['RZ', s380], ['RS', s380]]) J[key('S380', `${arm}/P60S6Q5`)].tables = tab3([0, 1, 2].map(() => 50 + { still: 0.05, some: 0.45, far: 1 }[s]));
  const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
  return { J, B1S380, bitsOf: (j, nm) => bits.get(`${j.arm}${nm}`) || ones(j.sims[nm].n, j.sims[nm].ok) };
}
const P = {}, cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 });
const tally = (k, fn) => { const c = cnt(); for (let d = 0; d < DRAWS; d++) c[fn()]++; P[k] = Object.fromEntries(Object.entries(c).map(([x, v]) => [x, v / DRAWS])); };
const it = s => items(s.J, s.B1S380, s.bitsOf);
const FR = [0.1, 0.3, 0.6, 0.8, 0.9];
for (const f of FR) { tally(`rz|${f}`, () => it(setOf({ fz: f }))['1'].outcome); tally(`rs|${f}`, () => it(setOf({ fs: f }))['2'].outcome); }
for (const s of ['kept', 'small', 'broken']) tally(`b4|${s}`, () => it(setOf({ b4z: s, b4s: 'kept' }))['3'].outcome);
for (const s of ['still', 'some', 'far']) tally(`s380|${s}`, () => it(setOf({ s380: s }))['4'].outcome);
for (const safe of [true, false]) tally(`open|${safe}`, () => it(setOf({ safeZ: safe }))['5'].outcome);
const row = k => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f4(P[k][x])}`).join(' ');
console.log(`\n2. THE POWER (${DRAWS} draws a cell through reduce-needge.mjs's items(); S364's BASE at C's records)`);
for (const f of FR) console.log(`  items 1 and 2, an arm removing ${f} of S364's over-read: RZ ${row(`rz|${f}`)}; RS ${row(`rs|${f}`)}`);
for (const s of ['kept', 'small', 'broken']) console.log(`  item 3, bridge 4 ${s} under one arm (the other kept): ${row(`b4|${s}`)}`);
for (const s of ['still', 'some', 'far']) console.log(`  item 4, S380's tables ${s} under both arms: ${row(`s380|${s}`)}`);
console.log(`  items 5 and 6, the arm's own opening at P: ${row('open|true')}; keeping BASE's opening and its loss: ${row('open|false')}`);

// 3. THE CREDENCES: the receipt's S364 cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 13 Oct 02:17 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: ([^|]+)/.exec(rec || '') || ['', ''])[1].matchAll(/(S364-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(cc).length !== 6 || Math.abs(sum(cc) - 1) > 0.02) { console.log(`the receipt's S364 CAUSE CREDENCES did not read (${JSON.stringify(cc)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const pickAt = (dist, u) => { const ks = Object.keys(dist).sort((a, b) => Number(a) - Number(b)); let acc = 0; for (const k of ks) { acc += dist[k]; if (u < acc) return k; } return ks[ks.length - 1]; };
const outOf = p => { const u = rnd(); return u < p.HELD ? 'HELD' : u < p.HELD + p.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const near = (x, keys) => keys.reduce((b, k) => (Math.abs(k - x) < Math.abs(b - x) ? k : b), keys[0]);
const Cn = Object.fromEntries(['1', '2', '3', '4', '5', '6'].map(i => [i, cnt()])), rows = { A: 0, B: 0, C: 0, D: 0, E: 0 }, Mn = 40000, R1 = [], R2 = [];
for (let d = 0; d < Mn; d++) {
  const c = pick(cc), story = JUDGED.remove[c] || JUDGED.remove.other;
  const u = rnd(), fz = Number(pickAt(story.RZ, u)), fs = Math.min(Number(pickAt(story.RS, u)), fz);
  const b4z = pick(JUDGED.b4), b4s = pick(JUDGED.b4), s380 = pick(JUDGED.s380);
  const safeZ = rnd() < (fz >= 0.8 ? JUDGED.openSafe.removed : JUDGED.openSafe.notRemoved), safeS = rnd() < (fs >= 0.8 ? JUDGED.openSafe.removed : JUDGED.openSafe.notRemoved);
  const worst3 = ['broken', 'small', 'kept'].find(x => x === b4z || x === b4s);
  const o = { 1: outOf(P[`rz|${near(fz, FR)}`]), 2: outOf(P[`rs|${near(fs, FR)}`]), 3: outOf(P[`b4|${worst3}`]), 4: outOf(P[`s380|${s380}`]), 5: outOf(P[`open|${safeZ}`]), 6: outOf(P[`open|${safeS}`]) };
  for (const i of Object.keys(Cn)) Cn[i][o[i]]++;
  R1.push(fz + (rnd() - 0.5) * 0.1); R2.push(fs + (rnd() - 0.5) * 0.1);
  if (o[3] === 'FALSIFIED' || o[4] === 'FALSIFIED') rows.A++;
  else if (o[2] === 'HELD' && (o[6] === 'HELD' || o[5] === 'HELD')) rows.B++;
  else if (o[1] === 'HELD' && o[2] === 'FALSIFIED') rows.C++;
  else if (o[1] === 'FALSIFIED' && o[2] === 'FALSIFIED') rows.D++;
  else rows.E++;
}
const pct = (xs, qq) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(qq * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 13 Oct 02:17 UK: ${Object.entries(cc).map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${Mn} draws)`);
for (const [i, c] of Object.entries(Cn)) console.log(`CREDENCE item ${i}: point ${i === '1' ? f4(mean(R1)) : i === '2' ? f4(mean(R2)) : '-'} HELD ${f2(c.HELD / Mn)} INCONCLUSIVE ${f2(c.INCONCLUSIVE / Mn)} FALSIFIED ${f2(c.FALSIFIED / Mn)}`);
console.log(`  POINT item 1: ${f4(mean(R1))} (80% interval ${f4(pct(R1, 0.1))} to ${f4(pct(R1, 0.9))}; RZ's removal of S364's over-read, world 0)`);
console.log(`  POINT item 2: ${f4(mean(R2))} (80% interval ${f4(pct(R2, 0.1))} to ${f4(pct(R2, 0.9))}; RS's removal, world 0)`);
console.log(`  DECISION ROWS: item 3 or 4 FALSIFIED ${f2(rows.A / Mn)}; item 2 HELD with item 5 or 6 HELD ${f2(rows.B / Mn)}; item 1 HELD, item 2 FALSIFIED ${f2(rows.C / Mn)}; items 1 and 2 FALSIFIED ${f2(rows.D / Mn)}; else ${f2(rows.E / Mn)}`);

// 4. THE BUDGET: each job's solve and runs from NE-GRID C's S364 job and B1's 60-point S380 and bridge 4 jobs (the runs' time
// the forceIdentity line's, which times every run of the job)
const secs = (txt, re) => { const m = re.exec(txt); return m ? Number(m[1]) : NaN; };
const cLog = Object.values(logsC).find(x => /^S364\s+case \| job BASE\/P60S6Q5 \|/m.test(x));
const b1Log = id => Object.values(logsB1).find(x => new RegExp(`^${id.replace(' ', '\\s')}\\s+case \\| job BASE/P60 \\|`, 'm').test(x));
const T = { S364: cLog, S380: b1Log('S380'), 'bridge 4': b1Log('bridge 4') };
const jobT = id => { const x = T[id]; return secs(x, /solve CAND \S+: table \S+ secs (\d+)/) + secs(x, /forceIdentity \d+\/\d+ secs (\d+)/); };
console.log('\n4. THE BUDGET (NE-GRID C\'s S364 BASE/P60S6Q5 log; B1\'s S380 and bridge 4 BASE/P60 logs; each job solve plus runs)');
let total = 0; const per = [];
for (const jb of JOBS) { const t = jobT(jb[0]); total += t; per.push(t); console.log(`  ${jb[0]} ${jobLabel(jb)}: about ${f2(t / 3600)} h`); }
const sorted = [...per].sort((a, b) => b - a), wave = sorted.slice(0, 4).reduce((m, x) => Math.max(m, x), 0) + sorted.slice(4).reduce((m, x) => Math.max(m, x), 0);
console.log(`  total about ${f2(total / 3600)} core-hours; the seven jobs four at a time, about ${f2(wave / 3600)} h wall (two waves, the longest of each)`);
