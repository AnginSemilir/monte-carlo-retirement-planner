/*
 * STEP-S370'S DERIVATION (predictions/diag-steps370.md; the deep review after HO-DEP, deep-review-log.md 18 Oct 18:40 UK): the
 * records (HO-DEP's S370 A and O on seed 7004 behind HO-DEP's gate: world 0's step-year residual Y3 + Y7 per path, the tables
 * and runs by world; the candidate's plan reference reads S370's step years as the same 0/1 step as O, so O's per-path residual
 * stands for C's, grade C, stated); the power of items 1-4 through reduce-steps370.mjs's own items(); the credences from the
 * receipt's S370 CAUSE CREDENCES (read from the log, not typed) through the judged stories below, as stated (section 3) and with
 * the leading cause at the record's rate (results-scorecard.txt, section 3b, the registered ones); the decision rows; the points
 * and 80% intervals; the budget.
 *   node research/solver/derive-steps370.mjs > research/solver/results-derive-steps370.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, rowOf, NPW } from './reduce-steps370.mjs';

// THE JUDGED INPUTS (committed before this script's output and before any STEP-S370 run; grade D throughout), by the receipt's
// S370 causes: COPY (the step read's copy across the unsupported top share node), GRID (the wealth axis at 30 points), CLIP
// (PR19), OTHER.
export const JUDGED = {
  // the share of C's world-0 step-year residual SN removes
  rSN: {
    COPY: { 0.6: 0.3, 0.75: 0.4, 0.9: 0.3 },
    GRID: { 0: 0.3, 0.1: 0.4, 0.2: 0.3 },
    CLIP: { 0: 0.5, 0.05: 0.5 },
    OTHER: { 0: 0.3, 0.25: 0.4, 0.5: 0.3 },
  },
  // the share W60 removes
  rW60: {
    COPY: { 0: 0.3, 0.1: 0.4, 0.2: 0.3 },
    GRID: { 0.5: 0.3, 0.7: 0.4, 0.9: 0.3 },
    CLIP: { 0: 0.5, 0.05: 0.5 },
    OTHER: { 0: 0.3, 0.25: 0.4, 0.5: 0.3 },
  },
  // SN's survival change against C by world (points, every world alike)
  d3: {
    COPY: { '-0.25': 0.2, 0: 0.5, 0.25: 0.3 },
    GRID: { '-0.1': 0.3, 0: 0.7 },
    CLIP: { 0: 1 },
    OTHER: { '-0.4': 0.25, 0: 0.5, 0.4: 0.25 },
  },
  // the per-path spread of an arm's residual beyond its proportional part, as a multiple of C's per-path spread
  noise: { 0.25: 0.3, 0.5: 0.4, 1: 0.3 },
  // SN's discordant paths a world, as a share of the paths (HO-DEP's A against O on S370 moved about 3% of them)
  disc3: { 0.01: 0.3, 0.03: 0.4, 0.06: 0.3 },
  // the whole score's change less the survival change (points)
  wx3: { '-0.1': 0.2, 0: 0.6, 0.1: 0.2 },
  // the world-0 table's drop as a multiple of the step-year residual SN removes
  tabRatio: { 0.7: 0.3, 1: 0.4, 1.2: 0.3 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 1; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return Number(k); } return Number(Object.keys(dist).pop()); };
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
const dec = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const tablesFromLog = (text, label) => [0, 1, 2].map(k => { const m = new RegExp(`tables ${label.replace(/[/]/g, '\\/')} ${k} z \\S+ weight \\S+: OWN (\\S+) READ`).exec(text); return m ? Number(m[1]) : NaN; });

// 1. THE RECORDS: HO-DEP's S370 jobs behind HO-DEP's gate
const gateOut = spawnSync('node', [join(HERE, 'reduce-hodep.mjs'), R_('diaghodep')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!/^GATE: passed/m.test(gateOut)) { console.log('HO-DEP\'s files did not pass HO-DEP\'s gate'); process.exit(1); }
const hlogs = readdirSync(R_('diaghodep')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('diaghodep'), f), 'utf8'));
const fO = ld(join(R_('diaghodep'), 'S370-O-P30S6Q5.json.gz')), fA = ld(join(R_('diaghodep'), 'S370-A-P30S6Q5.json.gz'));
const logO = hlogs.find(t => /^S370\s+case \| job O\//m.test(t)) || '';
const tO = tablesFromLog(logO, 'O/P30S6Q5'), N = fO.NPW, runO = [0, 1, 2].map(k => cnt(dec8(fO.bits[`OWN${k}`])));
const yO = (() => { const y3 = dec(fO.per.Y30), y7 = dec(fO.per.Y70); return Float64Array.from(y3, (v, i) => 100 * (v + y7[i])); })();
const mean = a => a.reduce((t, x) => t + x, 0) / a.length, sdOf = a => { const m = mean(a); return Math.sqrt(a.reduce((t, x) => t + (x - m) ** 2, 0) / (a.length - 1)); };
const mY = mean(yO), sY = sdOf(yO);
const discAO = [0, 1, 2].map(k => { const a = dec8(fA.bits[`OWN${k}`]), o = dec8(fO.bits[`OWN${k}`]); let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== o[i]) n++; return n; });
if (![...tO, mY, sY].every(Number.isFinite) || N !== NPW) { console.log('the records did not read'); process.exit(1); }
console.log('STEP-S370\'S DERIVATION (predictions/diag-steps370.md)\n\n1. THE RECORDS');
console.log(`  S370, HO-DEP's O (the order reference; seed 7004, ${N} paths a world, behind HO-DEP's gate): tables ${tO.map(f4).join(', ')}; runs ${runO.join(', ')} of ${N}; world 0's step-year residual Y3 + Y7 per path: mean ${f4(mY)} points, sd ${f4(sY)}`);
console.log(`  HO-DEP's A against O on S370: discordant runs ${discAO.join(', ')} of ${N} by world (the scale for SN's discordance)`);
console.log('  stated (grade C): the candidate\'s plan reference reads S370\'s step years as the same 0/1 step as O, so O\'s per-path residual and tables stand for C\'s');

// a synthetic read at a story's values, in reduce-steps370.mjs items()'s shape (C's draws resampled from O's)
const cellsFrom = (cCtrl, lost, saved) => ({ a: cCtrl - lost, b: lost, c: saved, d: N - cCtrl - saved });
function setOf({ rSN, rW60, d3, noise, disc3, wx3, tabRatio }) {
  const C = Float64Array.from({ length: N }, () => yO[Math.floor(rnd() * N)]);
  const arm = r => C.map(v => (1 - r) * v + noise * sY * gauss());
  const cells = [], ws = [];
  for (let k = 0; k < 3; k++) {
    // the discordance scales with the paths that can flip, 4p(1 - p) at C's survival p (the first output held it at the judged
    // share in every world, so at world 2's 99% the saved paths capped under the lost ones and a no-change story read harm)
    const cC = Math.max(0, Math.min(N, Math.round(runO[k] + Math.sqrt(runO[k] * (1 - runO[k] / N)) * gauss()))), pC = cC / N, n = disc3 * N * 4 * pC * (1 - pC), net = d3 / 100 * N;
    let lost = pois(Math.max(0, (n - net) / 2)), saved = pois(Math.max(0, (n + net) / 2)); lost = Math.min(lost, cC); saved = Math.min(saved, N - cC);
    cells.push(cellsFrom(cC, lost, saved)); const dd = (saved - lost) / N; ws.push({ d: 100 * dd + wx3, se: Math.sqrt(Math.max(1e-12, ((lost + saved) / N - dd * dd) * 1e4 + 0.09) / N) });
  }
  const tabC = tO[0];   // O's world-0 table stands for C's (the step years read the same step under both)
  return { y: { C, SN: arm(rSN), W60: arm(rW60) }, cells, ws, tab: { C: tabC, SN: tabC - tabRatio * rSN * mY } };
}
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');
const BASE = { rSN: 0.75, rW60: 0.1, d3: 0, noise: 0.5, disc3: 0.03, wx3: 0, tabRatio: 1 };

// 2. THE POWER through items()
const DR = 40;
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-steps370.mjs's items(); C's world-0 residual resampled from HO-DEP's O, ${N} paths a world)`);
for (const r of [0, 0.25, 0.4, 0.5, 0.6, 0.75]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, rSN: r }))['1'].outcome]++; console.log(`  item 1, SN removes ${r} of the residual (noise x0.5): ${row(c)}`); }
for (const nz of [0.25, 1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, noise: nz, rSN: 0.6 }))['1'].outcome]++; console.log(`  item 1, SN removes 0.6, noise x${nz}: ${row(c)}`); }
for (const r of [0.1, 0.4, 0.7]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, rW60: r }))['2'].outcome]++; console.log(`  item 2, W60 removes ${r}: ${row(c)}`); }
for (const v of [-0.6, -0.25, 0, 0.25]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, d3: v }))['3'].outcome]++; console.log(`  item 3, SN's survival change ${v} a world (discordance 3%): ${row(c)}`); }
for (const r of [0.2, 0.5, 0.75]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, rSN: r }))['4'].outcome]++; console.log(`  item 4, SN removes ${r} with its table falling as much: ${row(c)}`); }

// 3. THE CREDENCES: the receipt's S370 set through the judged stories, each draw read through items()
const RECEIPT = '18 Oct 18:40 UK', logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => l.startsWith(`- ${RECEIPT} |`)) || '';
const credLine = (/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1];
const cS = Object.fromEntries([...credLine.matchAll(/S370-([A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])])), sumOf = c => Object.values(c).reduce((a, b) => a + b, 0);
if (Object.keys(cS).length !== 4 || Math.abs(sumOf(cS) - 1) > 0.02 || Object.keys(cS).some(c => !JUDGED.rSN[c])) { console.log(`the receipt's CAUSE CREDENCES did not read (${credLine.slice(0, 200)})`); process.exit(1); }
const ND = 2000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
function credences(cmap) {
  const I = { 1: cnt3(), 2: cnt3(), 3: cnt3(), 4: cnt3() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = { 1: [], 2: [], 3: [], 4: [] };
  for (let q = 0; q < ND; q++) {
    const c = pickC(cmap), story = { rSN: pick(JUDGED.rSN[c]), rW60: pick(JUDGED.rW60[c]), d3: pick(JUDGED.d3[c]), noise: pick(JUDGED.noise), disc3: pick(JUDGED.disc3), wx3: pick(JUDGED.wx3), tabRatio: pick(JUDGED.tabRatio) };
    const it = items(setOf(story));
    for (const i of ['1', '2', '3', '4']) I[i][it[i].outcome]++;
    R[rowOf(it)]++;
    pt[1].push(it['1'].r.R); pt[2].push(it['2'].r.R); pt[3].push(it['3'].per[0].ex.d); pt[4].push(it['4'].dr.d);
  }
  return { I, R, pt };
}
const WHAT = { 1: 'the share of C\'s world-0 step-year residual SN removes', 2: 'the share W60 removes', 3: 'SN\'s survival change against C in world 0, points', 4: 'the drop in world 0\'s table less runs, SN against C, points' };
const show = ({ I, R, pt }, tag) => {
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  console.log(`  escalation trigger 3 (a run over 2 hours with the 'else' row at 0.6 or more): else ${f2(R.else / ND)}`);
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
  for (const i of ['1', '2', '3', '4']) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);
};
console.log(`\n3. THE CREDENCES AS THE RECEIPT STATES THEM (the receipt of ${RECEIPT}: ${Object.entries(cS).map(([k, v]) => `S370-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(cS), '  as stated, ');
const sc = /an item leaning on a deep review's cause or story ([0-9.]+) \((\d+) of (\d+)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!sc) { console.log('the scorecard\'s lead rate did not read (results-scorecard.txt)'); process.exit(1); }
const lead = Number(sc[1]), top = Object.entries(cS).sort((a, b) => b[1] - a[1])[0][0], rest = sumOf(cS) - cS[top];
const sS = Object.fromEntries(Object.entries(cS).map(([k, v]) => [k, k === top ? lead : v * (1 - lead) / rest]));
console.log(`\n3b. THE CREDENCES WITH THE LEADING CAUSE AT THE RECORD'S RATE (results-scorecard.txt: ${sc[1]}, ${sc[2]} of ${sc[3]}; ${Object.entries(sS).map(([k, v]) => `S370-${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
show(credences(sS), 'CREDENCE ');

// 4. THE BUDGET: HO-DEP's O on S370 at 30 points (the order reference's solve, near the plan reference's) and its ledger; W60
// solves at twice the wealth points (the solve scales near linearly in points: NE-GRID B1's 30 against 60 points)
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const sO = num(/solve CAND O\/P30S6Q5: table \S+ secs (\d+)/, logO), lO = num(/checks O\/P30S6Q5: ownTook .* secs (\d+)/, logO);
if (![sO, lO].every(Number.isFinite)) { console.log('the budget\'s inputs did not read'); process.exit(1); }
console.log(`\n4. THE BUDGET (grade C: HO-DEP's O on S370 at 30 points, solve ${sO} s and its ledger on 12,000 paths ${lO} s): C and SN about ${f2((sO + lO) / 3600)} h each; W60 about ${f2((2 * sO + 1.5 * lO) / 3600)} h (twice the solve, half again the ledger, judged); three jobs on three cores, the wall about ${f2((2 * sO + 1.5 * lO) / 3600)} h`);
