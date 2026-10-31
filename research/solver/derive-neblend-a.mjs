/*
 * NE-BLEND STAGE A'S DERIVATION (predictions/diag-neblend-a.md): what NE-ROOT's records say about bridge 4 and S380 by
 * world, the power of items 1-4 by simulation through reduce-neblend-a.mjs's own items(), the credences from the deep
 * review's cause credences (deep-review-log.md 11 Oct 10:33 UK, read from the receipt, not typed) and the judged inputs
 * below, the decision table's rows, the points and 80% intervals, and the budget from NE-ROOT's own logs. Reads NE-ROOT's
 * files behind NE-ROOT's gate (requireFairLogs over results/diagneroot, its registered prediction, and its reducer's gate).
 *   node research/solver/derive-neblend-a.mjs > research/solver/results-derive-neblend-a.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { parse as parseNR, gate as gateNR } from './reduce-neroot.mjs';
import { items, NPW } from './reduce-neblend-a.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DNR = join(HERE, 'results', 'diagneroot');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const binom = (n, p) => { if (n * p > 30 && n * (1 - p) > 30) { const u = Math.max(1e-12, rnd()), v = rnd(); return Math.min(n, Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)))); } let k = 0; for (let i = 0; i < n; i++) if (rnd() < p) k++; return k; };
const DRAWS = 1500;

// THE JUDGED INPUTS (written before this script's output)
export const JUDGED = {
  // bridge 4 under the arm: kept (its table at BASE's calibration), off by half a point in world 0, or broken (R0's -48)
  b4: {
    RZ: { 'B4-COPY': { kept: 0.85, small: 0.1, broken: 0.05 }, 'B4-R': { kept: 0.1, small: 0.2, broken: 0.7 }, 'B4-OTHER': { kept: 0.4, small: 0.3, broken: 0.3 } },
    // LOR changes every bridge read; bridge 4 is well funded, so most of its corners sit near 1 in log-odds too
    LOR: { kept: 0.65, small: 0.2, broken: 0.15 },
  },
  // S380's spread ratio under LOR (BASE's 0.899 is NE-ROOT's), by the review's causes: unchanged, partway, restored, steepened
  // (1.1: over-corrected - read INCONCLUSIVE, never FALSIFIED, since the plan-auditor's BLOCKING 1 of 11 Oct 13:00 UK)
  spread: { 'PB-WIDE': { 0.899: 0.15, 0.95: 0.15, 1: 0.55, 1.1: 0.15 }, 'PB-EDGE': { 0.899: 0.7, 0.95: 0.15, 1: 0.1, 1.1: 0.05 },
    'PB-REF': { 0.899: 0.6, 0.95: 0.2, 1: 0.1, 1.1: 0.1 }, 'PB-OTHER': { 0.899: 0.4, 0.95: 0.2, 1: 0.25, 1.1: 0.15 } },
  // the change in S380's world-0 survival from BASE's own policy to LOR's, in points, by the spread story (-0.5: LOR costs
  // survival there; added with the plan-auditor's BLOCKING 2 of 11 Oct 13:00 UK, the weights moved from 0); the paths that
  // differ beyond the change (churn), as a share of the 4,000, split evenly between lost and saved, each drawn (BLOCKING 3)
  change: { 0.899: { '-0.5': 0.05, 0: 0.75, 0.5: 0.15, 1.5: 0.05 }, 0.95: { '-0.5': 0.1, 0: 0.5, 0.5: 0.3, 1.5: 0.1 }, 1: { '-0.5': 0.1, 0: 0.3, 0.5: 0.35, 1.5: 0.25 }, 1.1: { '-0.5': 0.1, 0: 0.3, 0.5: 0.35, 1.5: 0.25 } },
  churn: { 0.01: 0.5, 0.05: 0.5 },
};

// 1. THE RECORDS: NE-ROOT's bridge 4 and S380 world lines, behind its gate
const logs = Object.fromEntries(readdirSync(DNR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DNR, f), 'utf8')]));
if (!requireFairLogs(logs, 'research/solver/predictions/diag-neroot.md', { exit: false })) { console.log('NE-ROOT\'s files did not pass the fair-test gate'); process.exit(1); }
const jobs = Object.values(logs).flatMap(parseNR);
const files = Object.fromEntries(readdirSync(DNR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DNR, f))).toString())]));
const bad = gateNR(jobs, { files });
if (bad.length) { console.log(`NE-ROOT's gate refused: ${bad.join('; ')}`); process.exit(1); }
const find = (id, arm) => jobs.find(j => j.id === id && j.arm === arm && j.w === '0.02');
const b4 = find('bridge 4', 'BASE'), s380 = find('S380', 'BASE');
const B4 = b4.world.map(x => ({ weight: x.weight, table: x.by.SS.table, q: x.by.SS.ok / x.by.SS.n })), S = s380.world.map(x => ({ weight: x.weight, table: x.by.OWN.table, q: x.by.OWN.ok / x.by.OWN.n }));
console.log('1. THE RECORDS (NE-ROOT, seed 7002, 4,000 paths a world; results/diagneroot behind its gate: passed)');
B4.forEach((x, k) => console.log(`  bridge 4 BASE SS world ${k}: table ${f4(x.table)} simulated ${f4(100 * x.q)}`));
S.forEach((x, k) => console.log(`  S380 BASE own world ${k}: table ${f4(x.table)} simulated ${f4(100 * x.q)}`));
const ratio0 = (S[2].table - S[0].table) / (100 * (S[2].q - S[0].q));
console.log(`  S380's spread ratio under BASE (the table's spread over the simulated, worlds 0 to 2): ${f4(ratio0)}`);

// 2. THE POWER through items(): bridge 4 stories for items 1 and 2, spread stories for item 3, change stories for item 4
const job = (id, arm, rows, sims) => ({ id, arm, w: '0.02', own: { ai: 1, level: '1', tiers: '0,0' }, world: rows.map((x, k) => ({ k, weight: x.weight, table: x.table, ok: sims[k], n: NPW, bits: '-' })) });
const b4Rows = story => B4.map((x, k) => ({ weight: x.weight, table: story === 'kept' ? x.table : story === 'small' ? x.table + (k === 0 ? 0.5 : 0) : x.table - 48 }));
// flattened by moving both ends in; steepened by lowering world 0's table, so every table stays inside 0 to 100 (asserted:
// the NE-ROOT close's REPLACE rule; the plan-auditor's MINOR 7 of 11 Oct 13:00 UK)
const sRows = r => { const s0 = 100 * S[0].q, s2 = 100 * S[2].q, d = (1 - r) * (s2 - s0) / 2; const rows = S.map((x, k) => ({ weight: x.weight, table: r <= 1 ? (k === 0 ? s0 + d : k === 2 ? s2 - d : 100 * x.q) : (k === 0 ? s0 - (r - 1) * (s2 - s0) : 100 * x.q) })); if (rows.some(x => !(x.table >= 0 && x.table <= 100))) throw new Error(`a story's table out of range at ratio ${r}`); return rows; };
const drawB4 = () => B4.map(x => binom(NPW, x.q)), drawS = () => S.map(x => binom(NPW, x.q));
const pois = lam => { if (lam > 50) return Math.max(0, Math.round(lam + Math.sqrt(lam) * Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd()))); const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
// lost and saved each drawn: the churn split evenly, the change added to the side it falls on (BLOCKING 3)
const bitsFor = (delta, churn) => { const n0 = Math.round(NPW * S[0].q), half = NPW * churn / 2, dn = NPW * Math.abs(delta) / 100; const lost = Math.min(n0, pois(half + (delta < 0 ? dn : 0))), saved = pois(half + (delta > 0 ? dn : 0)); return (jb, k) => { const b = new Uint8Array(NPW); for (let i = 0; i < n0; i++) b[i] = 1; if (jb.arm === 'LOR' && k === 0) { for (let i = 0; i < lost; i++) b[i] = 0; for (let i = 0; i < saved; i++) b[n0 + i] = 1; } return b; }; };
const P = {};
const tally = (key, fn) => { const c = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0, over: 0, up: 0, down: 0 }; for (let d = 0; d < DRAWS; d++) { const r = fn(); c[r.outcome]++; if (r.over) c.over++; if (r.dir) c[r.dir]++; } P[key] = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v / DRAWS])); };
const setOf = ({ rz = 'kept', lor = 'kept', r = 1 } = {}) => ({
  'bridge 4 RZ/W0.02': job('bridge 4', 'RZ', b4Rows(rz), drawB4()), 'bridge 4 LOR/W0.02': job('bridge 4', 'LOR', b4Rows(lor), drawB4()),
  'S380 BASE/W0.02': job('S380', 'BASE', S, drawS()), 'S380 LOR/W0.02': job('S380', 'LOR', sRows(r), drawS()) });
for (const s of ['kept', 'small', 'broken']) tally(`b4|${s}`, () => items(setOf({ rz: s }), bitsFor(0, 0.01))[1]);
for (const r of [0.899, 0.95, 1, 1.1]) tally(`sp|${r}`, () => items(setOf({ r }), bitsFor(0, 0.01))[3]);
for (const dl of [-0.5, 0, 0.5, 1.5]) for (const ch of [0.01, 0.05]) tally(`ch|${dl}|${ch}`, () => items(setOf(), bitsFor(dl, ch))[4]);
const row = k => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f4(P[k][x])}`).join(' ') + (P[k].over ? ` (over-corrected ${f4(P[k].over)})` : '') + (P[k].up || P[k].down ? ` (HELD up ${f4(P[k].up)}, down ${f4(P[k].down)})` : '');
console.log(`\n2. THE POWER (${DRAWS} draws a cell at ${NPW} paths a world through reduce-neblend-a.mjs's items())`);
for (const s of ['kept', 'small', 'broken']) console.log(`  items 1 and 2, bridge 4 ${s.padEnd(6)}: ${row(`b4|${s}`)}`);
for (const r of [0.899, 0.95, 1, 1.1]) console.log(`  item 3, LOR's spread ratio ${String(r).padEnd(5)}: ${row(`sp|${r}`)}`);
for (const dl of [-0.5, 0, 0.5, 1.5]) for (const ch of [0.01, 0.05]) console.log(`  item 4, a world-0 change of ${dl} points, churn ${ch}: ${row(`ch|${dl}|${ch}`)}`);

// 3. THE CREDENCES: the receipt's cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 11 Oct 10:33 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: ([^|]+)/.exec(rec) || ['', ''])[1].matchAll(/((?:PB|B4)-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const pb = Object.fromEntries(Object.entries(cc).filter(([k]) => k.startsWith('PB-'))), b4c = Object.fromEntries(Object.entries(cc).filter(([k]) => k.startsWith('B4-')));
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(pb).length !== 4 || Object.keys(b4c).length !== 3 || Math.abs(sum(pb) - 1) > 0.02 || Math.abs(sum(b4c) - 1) > 0.02) { console.log(`the receipt's CAUSE CREDENCES did not read (${JSON.stringify(cc)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const outOf = p => { const u = rnd(); return u < p.HELD ? 'HELD' : u < p.HELD + p.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
// item 3's INCONCLUSIVE split into its over-corrected part, item 4's HELD into its directions, by the cell's own shares
const overOf = p => p.INCONCLUSIVE > 0 && rnd() < p.over / p.INCONCLUSIVE, upOf = p => p.HELD > 0 && rnd() < p.up / p.HELD;
const C = [1, 2, 3, 4].map(() => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 })), rows = { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 }, Mn = 40000, ratios = [], changes = [], extra = { over: 0, up: 0, down: 0, upWith3: 0 };
for (let d = 0; d < Mn; d++) {
  const o1 = outOf(P[`b4|${pick(JUDGED.b4.RZ[pick(b4c)])}`]), o2 = outOf(P[`b4|${pick(JUDGED.b4.LOR)}`]);
  const r = Number(pick(JUDGED.spread[pick(pb)])), p3 = P[`sp|${r}`], o3 = outOf(p3), ov = o3 === 'INCONCLUSIVE' && overOf(p3);
  const dl = Number(pick(JUDGED.change[r])), ch = Number(pick(JUDGED.churn)), p4 = P[`ch|${dl}|${ch}`], o4 = outOf(p4), up = o4 === 'HELD' && upOf(p4);
  if (ov) extra.over++; if (o4 === 'HELD') { if (up) extra.up++; else extra.down++; if (o3 === 'HELD') extra.upWith3++; }
  ratios.push(r + (rnd() - 0.5) * 0.03); changes.push(dl + (rnd() - 0.5) * 0.3);
  [o1, o2, o3, o4].forEach((x, i) => C[i][x]++);
  if (o2 === 'HELD' && o3 === 'HELD') rows.r1++; else if (o3 === 'FALSIFIED') rows.r2++; else if (ov) rows.r3++; else if (o2 === 'FALSIFIED') rows.r4++; else rows.r5++;
}
const pct = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 11 Oct 10:33 UK: ${Object.entries(cc).map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${Mn} draws)`);
C.forEach((c, i) => console.log(`CREDENCE item ${i + 1}: point ${i === 2 ? f4(mean(ratios)) : i === 3 ? f4(mean(changes)) : '-'} HELD ${f2(c.HELD / Mn)} INCONCLUSIVE ${f2(c.INCONCLUSIVE / Mn)} FALSIFIED ${f2(c.FALSIFIED / Mn)}`));
console.log(`  POINT item 3: ${f4(mean(ratios))} (80% interval ${f4(pct(ratios, 0.1))} to ${f4(pct(ratios, 0.9))}; LOR's spread ratio on S380 over the stories)`);
console.log(`  POINT item 4: ${f4(mean(changes))} (80% interval ${f4(pct(changes, 0.1))} to ${f4(pct(changes, 0.9))}; LOR's change in S380's world-0 survival, points)`);
console.log(`  item 3 over-corrected ${f2(extra.over / Mn)} (inside its INCONCLUSIVE); item 4 HELD up ${f2(extra.up / Mn)}, down ${f2(extra.down / Mn)}; item 4 HELD with item 3 HELD ${f2(extra.upWith3 / Mn)}`);
console.log(`  DECISION ROWS: items 2 and 3 HELD ${f2(rows.r1 / Mn)}; item 3 FALSIFIED ${f2(rows.r2 / Mn)}; item 3 over-corrected ${f2(rows.r3 / Mn)}; item 2 FALSIFIED, item 3 neither ${f2(rows.r4 / Mn)}; else ${f2(rows.r5 / Mn)}`);

// 4. THE BUDGET: NE-ROOT's own logs (each job's solve, and its forward pass's seconds a path)
const secs = (t, re) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const logOf = (id, arm) => Object.values(logs).find(t => new RegExp(`^${id.replace(' ', '\\s')}\\s+case \\| job ${arm}/W0\\.02`, 'm').test(t));
const tOf = (id, arm, paths) => { const t = logOf(id, arm); return { cand: secs(t, /solve CAND \S+: table \S+ secs (\d+)/), fwd: secs(t, /forceIdentity \d+\/\d+ secs (\d+)/) / paths }; };
const tb = tOf('bridge 4', 'BASE', 26000), ts = tOf('S380', 'BASE', 14000), pathsA = 3 * NPW + 2 * 1000;
const jb = tb.cand + pathsA * tb.fwd, js = ts.cand + pathsA * ts.fwd;
console.log('\n4. THE BUDGET (NE-ROOT\'s logs: each job\'s solve and its forward pass, results/diagneroot)');
console.log(`  bridge 4: CAND solve ${tb.cand} s, ${tb.fwd.toFixed(4)} s a path: a job about ${f2(jb / 3600)} core-hours (${pathsA} paths, no SHIP solve)`);
console.log(`  S380: CAND solve ${ts.cand} s, ${ts.fwd.toFixed(4)} s a path: a job about ${f2(js / 3600)} core-hours`);
console.log(`  total about ${f2((2 * jb + 2 * js) / 3600)} core-hours; the four jobs at once, about ${f2(Math.max(jb, js) / 3600)} h wall; the arms' own solves untimed until the preflight`);
