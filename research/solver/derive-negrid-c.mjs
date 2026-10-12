/*
 * NE-GRID C'S DERIVATION (predictions/diag-negrid-c.md): what NE-GRID B1's records say about the wealth axis's move from 30
 * to 60 points and S224's 60-point under-read, the power of items 1-8 by simulation through reduce-negrid-c.mjs's own
 * items(), the credences from the deep review's cause credences (deep-review-log.md 11 Oct 23:09 UK, read from the
 * receipt, not typed) and the judged stories below, the decision table's rows, the points and 80% intervals, and the budget
 * from the 120-point measurement (results-negrid-c-measure.txt) and B1's and NE-ROOT's logs. Reads B1's files behind B1's
 * gate and NE-ROOT's behind NE-ROOT's.
 *   node research/solver/derive-negrid-c.mjs > research/solver/results-derive-negrid-c.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { parse as parseB1, gate as gateB1, records as recordsB1 } from './reduce-negrid-b1.mjs';
import { parse as parseNR, gate as gateNR } from './reduce-neroot.mjs';
import { items, key, jobLabel, JOBS, PAIRS, NPW, WEIGHTS } from './reduce-negrid-c.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DB1 = join(HERE, 'results', 'diagnegrid'), DNR = join(HERE, 'results', 'diagneroot');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const binom = (n, p) => Math.min(n, Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss())));
const DRAWS = 1000;

// THE JUDGED INPUTS (written before this script's output)
export const JUDGED = {
  // item 1: each counted cell's |move 60 to 120| / |move 30 to 60|, the story's typical ratio, each cell spread about it by
  // a uniform +-0.1: second order (the axis's error going with the cell's width squared) puts it near a quarter; RG-WSLOW
  // (slower than second order, as Phase V's S184 fell through its run) near a half or more
  conv: { 'RG-WSLOW': { 0.35: 0.2, 0.5: 0.4, 0.8: 0.4 }, other: { 0.25: 0.6, 0.35: 0.25, 0.5: 0.15 } },
  // item 2: S224's table at P less its runs at 120 points (points, worlds 0 and 1 alike), by cause: RG-UNMASK keeps the
  // under-read (another table error the over-read hid); RG-WSLOW shrinks it as the table keeps rising; RG-PATHS has the
  // runs on 16,000 paths come down to the table; RG-OTHER between
  under120: { 'RG-UNMASK': { '-1': 0.3, '-2': 0.5, '-3': 0.2 }, 'RG-WSLOW': { 0: 0.3, '-1': 0.5, '-2': 0.2 }, 'RG-PATHS': { 0: 0.7, '-1': 0.3 }, 'RG-OTHER': { 0: 0.3, '-1': 0.4, '-2': 0.3 } },
  // items 3 and 4: what carries S224's 60-point under-read, given RG-UNMASK: the quadrature (15 nodes raise the table by
  // most of it), the shares (12 shares do), or another part (neither); the share each carries otherwise, judged small
  unmasked: { quad: 0.35, shares: 0.35, other: 0.3 },
  carryWhen: { 0.8: 0.7, 0.5: 0.2, 0.3: 0.1 }, carryElse: { 0.1: 0.7, 0.35: 0.2, 0.6: 0.1 },
  // items 5-7: S364's 60-point over-read (table less runs, worlds 0 and 1) counted (at least half a point) in both worlds,
  // and the share each arm carries by the review's S364 causes (SHARE: 12 shares, W: 120 points, REF: ORDER; COPY and
  // OTHER: none of the three)
  s364Counted: 0.85, s364Over: 1.5,
  // item 8: bridge 4 at 120 points under BASE: kept, off by half a point in world 0, broken (2 points)
  b4: { kept: 0.9, small: 0.08, broken: 0.02 },
};

// 1. THE RECORDS: B1's 30- and 60-point tables and S224's 60-point runs, behind B1's gate; NE-ROOT's S364 timings behind its
const readDir = d => Object.fromEntries(readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(d, f), 'utf8')]));
const gz = d => Object.fromEntries(readdirSync(d).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(d, f))).toString())]));
const logsB1 = readDir(DB1), logsNR = readDir(DNR);
if (!requireFairLogs(logsB1, 'research/solver/predictions/diag-negrid-b1.md', { exit: false })) { console.log('B1\'s files did not pass the fair-test gate'); process.exit(1); }
if (!requireFairLogs(logsNR, 'research/solver/predictions/diag-neroot.md', { exit: false })) { console.log('NE-ROOT\'s files did not pass the fair-test gate'); process.exit(1); }
const rf = f => readFileSync(join(HERE, f), 'utf8');
const jB1 = Object.values(logsB1).flatMap(parseB1), jNR = Object.values(logsNR).flatMap(parseNR);
const badB1 = gateB1(jB1, { files: gz(DB1), rec: recordsB1(rf('results-neblend-a.txt'), rf('results-neroot.txt')) }), badNR = gateNR(jNR, { files: gz(DNR) });
if (badB1.length || badNR.length) { console.log(`a gate refused: ${[...badB1, ...badNR].join('; ')}`); process.exit(1); }
const t = (id, arm, g) => jB1.find(j => j.id === id && j.arm === arm && j.grid === g).tables.map(x => ({ P: x.P, D: x.D }));
const B1 = { S380: { BASE: { coarse: t('S380', 'BASE', 'coarse'), fine: t('S380', 'BASE', 'fine') }, LOR: { coarse: t('S380', 'LOR', 'coarse'), fine: t('S380', 'LOR', 'fine') } }, S224: { BASE: { coarse: t('S224', 'BASE', 'coarse'), fine: t('S224', 'BASE', 'fine') } } };
const j224 = jB1.find(j => j.id === 'S224' && j.arm === 'BASE' && j.grid === 'fine'), runs224 = [0, 1, 2].map(k => j224.sims[`P${k}`]);
console.log('1. THE RECORDS (NE-GRID B1, seed 7002; results/diagnegrid behind B1\'s gate, results/diagneroot behind NE-ROOT\'s: passed)');
const m1cells = [];
for (const [id, arm] of [['S380', 'BASE'], ['S380', 'LOR'], ['S224', 'BASE']]) for (const o of ['P', 'D']) for (const k of [0, 1]) { const m1 = B1[id][arm].fine[k][o] - B1[id][arm].coarse[k][o]; m1cells.push({ id, arm, o, k, m1 }); console.log(`  ${id} ${arm} ${o} world ${k}: 30 ${f4(B1[id][arm].coarse[k][o])} 60 ${f4(B1[id][arm].fine[k][o])} move ${f4(m1)}${Math.abs(m1) >= 0.5 ? '' : ' (not counted)'}`); }
const u60 = [0, 1].map(k => B1.S224.BASE.fine[k].P - 100 * runs224[k].ok / runs224[k].n);
const jr364 = jNR.find(j => j.id === 'S364' && j.arm === 'BASE' && j.w === '0.02'), over30 = [0, 1].map(k => jr364.world[k].by.SS.table - 100 * jr364.world[k].by.SS.ok / jr364.world[k].by.SS.n);
console.log(`  S364 BASE at SS (P), 30 points, table less its runs (NE-ROOT): world 0 ${f4(over30[0])}, world 1 ${f4(over30[1])}`);
console.log(`  S224 BASE at P, 60 points, table less its 4,000-path runs: world 0 ${f4(u60[0])}, world 1 ${f4(u60[1])}`);

// 2. THE POWER through items(): a synthetic C per draw from the stories, B1's records as they are
const tab3 = (P, D) => [0, 1, 2].map(k => ({ k, weight: WEIGHTS[k], P: P[k], D: D[k], OWN: P[k] }));
const clamp = x => Math.min(100, Math.max(0, x));
function setOf({ r = 0.25, u120 = 0, carry3 = 0.1, carry4 = 0.1, s364 = { counted: true, f5: 0.1, f6: 0.1, f7: 0.1 }, b4 = 'kept' } = {}) {
  const J = {};
  for (const jb of JOBS) { const [id, , , , , mult] = jb; J[key(id, jobLabel(jb))] = { id, label: jobLabel(jb), own: { ai: PAIRS[id][0] }, pair: { P: PAIRS[id][0], D: PAIRS[id][1] }, tables: tab3([50, 50, 50], [50, 50, 50]), sims: Object.fromEntries([0, 1, 2].flatMap(k => [[`P${k}`, { ok: binom(NPW * mult, 0.5), n: NPW * mult }], [`D${k}`, { ok: binom(NPW, 0.5), n: NPW }]])) }; }
  // item 1: the 120-point tables move on from 60 by r (spread +-0.1 a cell) of the 30-to-60 move
  for (const [id, arm, label] of [['S380', 'BASE', 'BASE/P120S6Q5'], ['S380', 'LOR', 'LOR/P120S6Q5'], ['S224', 'BASE', 'BASE/P120S6Q5']]) {
    const j = J[key(id, label)];
    j.tables = tab3([0, 1, 2].map(k => clamp(B1[id][arm].fine[k].P + (k < 2 ? (r + (rnd() - 0.5) * 0.2) * (B1[id][arm].fine[k].P - B1[id][arm].coarse[k].P) : 0))), [0, 1, 2].map(k => clamp(B1[id][arm].fine[k].D + (k < 2 ? (r + (rnd() - 0.5) * 0.2) * (B1[id][arm].fine[k].D - B1[id][arm].coarse[k].D) : 0))));
  }
  // item 2: S224's 120-point P runs drawn on 16,000 paths about a truth, its table u120 off it
  // its table stays the convergence story's (item 1 reads it too); its runs' truth sits u120 under the table (fixed after the
  // derivation's first output, which set the table by both stories at once; the JUDGED block unchanged)
  const f4k = [0, 0, 0];
  { const j = J[key('S224', 'BASE/P120S6Q5')]; for (let k = 0; k < 2; k++) { const q = Math.min(1, Math.max(0, (j.tables[k].P - u120) / 100)), ok = binom(4 * NPW, q); j.sims[`P${k}`] = { ok, n: 4 * NPW }; f4k[k] = binom(NPW, q); } }
  // items 3 and 4: the 60-point jobs raise S224's table at P by a share of B1's under-read
  for (const [label, c] of [['BASE/P60S6Q15', carry3], ['BASE/P60S12Q5', carry4]]) { const j = J[key('S224', label)]; for (let k = 0; k < 2; k++) j.tables[k].P = clamp(B1.S224.BASE.fine[k].P - c * u60[k]); }
  // items 5-7: S364's 60-point baseline over its runs (counted or not), each arm lowering it by its share
  { const base = J[key('S364', 'BASE/P60S6Q5')], over = s364.counted ? JUDGED.s364Over : 0.3; for (let k = 0; k < 2; k++) { const q = base.sims[`P${k}`].ok / base.sims[`P${k}`].n; base.tables[k].P = clamp(100 * q + over); for (const [label, f] of [['BASE/P60S12Q5', s364.f5], ['BASE/P120S6Q5', s364.f6], ['ORDER/P60S6Q5', s364.f7]]) J[key('S364', label)].tables[k].P = clamp(base.tables[k].P - f * over); } }
  // item 8: bridge 4 at 120 points, runs at 98.7 in world 0 (B1's), its table kept, half a point off, or 2 off
  { const j = J[key('bridge 4', 'BASE/P120S6Q5')], q0 = 0.987, ok = binom(NPW, q0); j.sims.P0 = { ok, n: NPW }; j.tables[0].P = clamp(100 * q0 + { kept: 0, small: 0.5, broken: 2 }[b4]); for (const k of [1, 2]) { j.sims[`P${k}`] = { ok: binom(NPW, 0.9999), n: NPW }; j.tables[k].P = 99.99; } }
  for (const j of Object.values(J)) for (const x of j.tables) for (const o of ['P', 'D', 'OWN']) if (!(x[o] >= 0 && x[o] <= 100)) throw new Error(`a story's table left 0 to 100: ${j.id} ${j.label} ${o}`);
  return { J, extra: { first4k: k => f4k[k], over30 } };
}
const P = {}, cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 });
const tally = (k, fn) => { const c = cnt(); for (let d = 0; d < DRAWS; d++) c[fn()]++; P[k] = Object.fromEntries(Object.entries(c).map(([x, v]) => [x, v / DRAWS])); };
const it = st => items(st.J, B1, runs224, st.extra);
for (const r of [0.25, 0.35, 0.5, 0.8]) tally(`conv|${r}`, () => it(setOf({ r }))[1].outcome);
for (const u of [0, -1, -2, -3]) tally(`under|${u}`, () => it(setOf({ u120: u }))[2].outcome);
for (const c of [0.1, 0.3, 0.35, 0.5, 0.6, 0.8]) tally(`carry|${c}`, () => it(setOf({ carry3: c }))['3'].outcome);
for (const f of [0.1, 0.35, 0.6, 0.8]) tally(`s364|${f}`, () => it(setOf({ s364: { counted: true, f5: f, f6: f, f7: f } }))['5'].outcome);
tally('s364|none', () => it(setOf({ s364: { counted: false, f5: 0.8, f6: 0.8, f7: 0.8 } }))['5'].outcome);
for (const s of ['kept', 'small', 'broken']) tally(`b4|${s}`, () => it(setOf({ b4: s }))[8].outcome);
const row = k => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f4(P[k][x])}`).join(' ');
console.log(`\n2. THE POWER (${DRAWS} draws a cell through reduce-negrid-c.mjs's items(); B1's records as they are)`);
for (const r of [0.25, 0.35, 0.5, 0.8]) console.log(`  item 1, each cell's ratio about ${r} (+-0.1): ${row(`conv|${r}`)}`);
for (const u of [0, -1, -2, -3]) console.log(`  item 2, S224's 120-point table ${u} points off its 16,000-path runs: ${row(`under|${u}`)}`);
for (const c of [0.1, 0.3, 0.35, 0.5, 0.6, 0.8]) console.log(`  items 3 and 4, a job carrying ${c} of S224's 60-point under-read: ${row(`carry|${c}`)}`);
for (const f of [0.1, 0.35, 0.6, 0.8]) console.log(`  items 5-7, an arm carrying ${f} of S364's 60-point over-read (counted): ${row(`s364|${f}`)}`);
console.log(`  items 5-7, S364's 60-point over-read under half a point (not counted): ${row('s364|none')}`);
for (const s of ['kept', 'small', 'broken']) console.log(`  item 8, bridge 4 ${s}: ${row(`b4|${s}`)}`);

// 3. THE CREDENCES: the receipt's cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 11 Oct 23:09 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: ([^|]+)/.exec(rec || '') || ['', ''])[1].matchAll(/((?:RG|S364)-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const rg = Object.fromEntries(Object.entries(cc).filter(([k]) => k.startsWith('RG-'))), s3 = Object.fromEntries(Object.entries(cc).filter(([k]) => k.startsWith('S364-')));
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(rg).length !== 4 || Object.keys(s3).length !== 5 || Math.abs(sum(rg) - 1) > 0.02 || Math.abs(sum(s3) - 1) > 0.02) { console.log(`the receipt's CAUSE CREDENCES did not read (${JSON.stringify(cc)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const outOf = p => { const u = rnd(); return u < p.HELD ? 'HELD' : u < p.HELD + p.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const near = (x, keys) => keys.reduce((b, k) => (Math.abs(k - x) < Math.abs(b - x) ? k : b), keys[0]);
const C = Object.fromEntries(['1', '2', '3', '4', '5', '6', '7', '8'].map(i => [i, cnt()])), rows = { A: 0, B: 0, C: 0, D: 0, E: 0 }, Mn = 40000, R1 = [], R2 = [];
for (let d = 0; d < Mn; d++) {
  const c = pick(rg), s = pick(s3);
  const r = Number(pick(JUDGED.conv[c === 'RG-WSLOW' ? 'RG-WSLOW' : 'other'])), u = Number(pick(JUDGED.under120[c]));
  const um = c === 'RG-UNMASK' ? pick(JUDGED.unmasked) : 'none';
  const c3 = Number(pick(um === 'quad' ? JUDGED.carryWhen : JUDGED.carryElse)), c4 = Number(pick(um === 'shares' ? JUDGED.carryWhen : JUDGED.carryElse));
  const counted = rnd() < JUDGED.s364Counted;
  const fs = ['S364-SHARE', 'S364-W', 'S364-REF'].map(x => Number(pick(s === x ? JUDGED.carryWhen : JUDGED.carryElse)));
  const o = {
    1: outOf(P[`conv|${near(r, [0.25, 0.35, 0.5, 0.8])}`]), 2: outOf(P[`under|${u}`]), 3: outOf(P[`carry|${near(c3, [0.1, 0.3, 0.35, 0.5, 0.6, 0.8])}`]), 4: outOf(P[`carry|${near(c4, [0.1, 0.3, 0.35, 0.5, 0.6, 0.8])}`]),
    5: outOf(counted ? P[`s364|${near(fs[0], [0.1, 0.35, 0.6, 0.8])}`] : P['s364|none']), 6: outOf(counted ? P[`s364|${near(fs[1], [0.1, 0.35, 0.6, 0.8])}`] : P['s364|none']), 7: outOf(counted ? P[`s364|${near(fs[2], [0.1, 0.35, 0.6, 0.8])}`] : P['s364|none']),
    8: outOf(P[`b4|${pick(JUDGED.b4)}`]),
  };
  for (const i of Object.keys(C)) C[i][o[i]]++;
  R1.push(Math.max(0, r + 0.05 + (rnd() - 0.5) * 0.1)); R2.push(u + (rnd() - 0.5) * 0.6);
  if (o[8] === 'FALSIFIED') rows.A++; else if (o[1] === 'FALSIFIED') rows.B++; else if (o[1] === 'HELD' && o[2] !== 'HELD') rows.C++; else if (o[1] === 'HELD' && o[2] === 'HELD') rows.D++; else rows.E++;
}
const pct = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 11 Oct 23:09 UK: ${Object.entries(cc).map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${Mn} draws)`);
for (const [i, c] of Object.entries(C)) console.log(`CREDENCE item ${i}: point ${i === '1' ? f4(mean(R1)) : i === '2' ? f4(mean(R2)) : '-'} HELD ${f2(c.HELD / Mn)} INCONCLUSIVE ${f2(c.INCONCLUSIVE / Mn)} FALSIFIED ${f2(c.FALSIFIED / Mn)}`);
console.log(`  POINT item 1: ${f4(mean(R1))} (80% interval ${f4(pct(R1, 0.1))} to ${f4(pct(R1, 0.9))}; the largest counted cell's |move 60 to 120| / |move 30 to 60|)`);
console.log(`  POINT item 2: ${f4(mean(R2))} (80% interval ${f4(pct(R2, 0.1))} to ${f4(pct(R2, 0.9))}; S224's 120-point table less its 16,000-path runs, the lower world)`);
console.log(`  DECISION ROWS: item 8 FALSIFIED ${f2(rows.A / Mn)}; item 1 FALSIFIED ${f2(rows.B / Mn)}; item 1 HELD, item 2 not HELD ${f2(rows.C / Mn)}; items 1 and 2 HELD ${f2(rows.D / Mn)}; else ${f2(rows.E / Mn)}`);

// 4. THE BUDGET: the 120-point measurement for S380's solve, B1's logs for the 60-point solves and paths, NE-ROOT's for S364;
// a 120-point solve taken as the measured S380 ratio of 120 to 60 points times each household's 60-point solve; 12 shares
// as four times the 6-share cells, 15 return nodes as three times the 5 (judged, NOT CHECKED until the preflight)
const secs = (txt, re) => { const m = re.exec(txt); return m ? Number(m[1]) : NaN; };
const meas = rf('results-negrid-c-measure.txt'), s120 = secs(meas, /solve CAND BASE\/P120\S*: table \S+ secs (\d+)/), peak = secs(meas, /peak memory \(VmHWM\) (\d+) kB/);
const logOf = (id, arm) => Object.values(logsB1).find(x => new RegExp(`^${id.replace(' ', '\\s')}\\s+case \\| job ${arm}/P60 \\|`, 'm').test(x));
const t60 = (id, arm) => { const x = logOf(id, arm); return { solve: secs(x, /solve CAND \S+: table \S+ secs (\d+)/), fwd: secs(x, /forceIdentity \d+\/\d+ secs (\d+)/) / (2 * 3 * NPW + 2 * 1000) }; };
const nr364 = Object.values(logsNR).find(x => /^S364\s+case \| job BASE\/W0\.02/m.test(x)), s364 = { solve: secs(nr364, /solve CAND \S+: table \S+ secs (\d+)/) * 2, fwd: secs(nr364, /forceIdentity \d+\/\d+ secs (\d+)/) / (3 * 3 * NPW + 2 * 1000) };
const T = { S380: t60('S380', 'BASE'), S380L: t60('S380', 'LOR'), S224: t60('S224', 'BASE'), b4: t60('bridge 4', 'BASE'), S364: s364 }, ratio = s120 / T.S380.solve;
const job = (name, solve, paths, fwd) => ({ name, solve, run: paths * fwd, total: solve + paths * fwd });
const base = mult => 3 * NPW * mult + 3 * NPW + 2 * 1000;   // P at mult times, D, forceIdentity's two runs on 1,000
const B = [job('S380 BASE 120', s120, base(4), T.S380.fwd), job('S224 BASE 120', ratio * T.S224.solve, base(4), T.S224.fwd), job('S364 BASE 60 12 shares', 4 * T.S364.solve, base(1), T.S364.fwd), job('S224 BASE 60 12 shares', 4 * T.S224.solve, base(1), T.S224.fwd),
  job('S380 LOR 120', ratio * T.S380L.solve, base(1), T.S380L.fwd), job('bridge 4 BASE 120', ratio * T.b4.solve, base(1), T.b4.fwd), job('S364 BASE 120', ratio * T.S364.solve, base(1), T.S364.fwd), job('S224 BASE 60 15 nodes', 3 * T.S224.solve, base(1), T.S224.fwd),
  job('S364 BASE 60', T.S364.solve, base(1), T.S364.fwd), job('S364 ORDER 60', T.S364.solve, base(1), T.S364.fwd)];
console.log(`\n4. THE BUDGET (results-negrid-c-measure.txt: S380's 120-point solve ${s120} s, peak memory ${peak} kB; B1's logs at 60 points; NE-ROOT's for S364, its 30-point solve doubled for 60)`);
for (const b of B) console.log(`  ${b.name}: solve about ${Math.round(b.solve)} s, runs about ${Math.round(b.run)} s: about ${f2(b.total / 3600)} h`);
const total = B.reduce((s, b) => s + b.total, 0), longest = Math.max(...B.map(b => b.total));
console.log(`  total about ${f2(total / 3600)} core-hours; the ten jobs four at a time, about ${f2(Math.max(longest, total / 4) / 3600)} h wall at the least; the 120-point solve ${f2(ratio)} times the 60-point`);
