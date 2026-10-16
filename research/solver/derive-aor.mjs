/*
 * AOR'S DERIVATION (predictions/diag-aor.md; the deep review after AO, deep-review-log.md 16 Oct 05:36 UK): the records (AO's
 * results behind AO's gate: P's tables and runs on S364 by world, AO's world-0 table 1.8395 against 37 runs of 40,000; A6's
 * runs against BO's, the paths a change of reference moved on S360); the power of items 1-4 through reduce-aor.mjs's own
 * items(); the credences from the 05:36 receipt's CAUSE CREDENCES for O169's carrier (read from the log, not typed) through
 * the judged stories below, as the receipt states them and with the leading cause at the record's rate (results-scorecard.txt,
 * the registered ones); the decision rows; the points and 80% intervals; the budget (AO's and A6's case logs).
 *   node research/solver/derive-aor.mjs > research/solver/results-derive-aor.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, NPW, NP_AO } from './reduce-aor.mjs';
import { parse as parseAO } from './reduce-ao.mjs';

// THE JUDGED INPUTS (committed before this script's output; grade D throughout). Each of O169's carriers in the 05:36
// receipt's map predicts the deletion term at P in world 0 (item 1, ln(deletion / runs) against AO's 37 runs of 40,000), and
// through it ARS's reads (items 2 and 3); A6RS's runs against A6's (item 4). The records: AO's world-0 table reads ln 2.99
// over its runs; the review's bound (if the state's own chance rises with the return node, judged 0.9) puts the read without
// R at most ln 2.31 over them; AO's worlds 1 and 2 read ln 0.48 and 0.02, R at least 0.12 and 0.010 of the read there.
export const JUDGED = {
  // item 1, ln(deletion / runs) in world 0. COPY: R carries the over-read, so the deletion term sits near the runs (the
  // receipt predicts item 1 HELD); CONT: the copied continuation c over-reads, so the deletion term stays near the bound;
  // POST: the corners' solved survival over-reads after access, the same side; PTAIL: the state's own chance over-reads;
  // QUAD: the five nodes, a part of it; OTHER: anywhere under the bound
  del: {
    COPY: { '-0.7': 0.15, '-0.2': 0.25, 0.3: 0.3, 0.8: 0.2, 1.4: 0.1 },
    CONT: { 1.6: 0.3, 2.0: 0.4, 2.3: 0.3 },
    POST: { 1.4: 0.4, 2.0: 0.6 },
    PTAIL: { 1.2: 0.5, 1.9: 0.5 },
    QUAD: { 0.4: 0.5, 1.0: 0.5 },
    OTHER: { '-0.5': 0.25, 0.5: 0.25, 1.5: 0.25, 2.3: 0.25 },
  },
  // item 2: ARS's world-0 table as the deletion term plus the share s of R the RS split keeps (R = AO's table less the
  // deletion term; s about the state's chance over the copied corners' p, near 0.15 at world 0's year-1 reads by AO's probe
  // lines, 0.0073 against 0.049), moved by `arsShift` (the re-solve moves every bridge year's tables; COPY's under side is
  // O165's pessimistic tail p unmasked, the receipt's warning)
  keep: { 0.05: 0.3, 0.15: 0.4, 0.3: 0.3 },
  arsShift: { '-0.4': 0.25, 0: 0.5, 0.3: 0.25 },
  arsShiftCopy: { '-1.2': 0.1, '-0.4': 0.25, 0: 0.45, 0.3: 0.2 },
  // item 3: ARS's worlds 1 and 2 as AO's read with R's share r scaled down by the kept share s; r by world (R at least 0.12
  // and 0.010 of the read, the review's bound)
  rShare: [{ 0.12: 0.3, 0.3: 0.4, 0.5: 0.3 }, { 0.01: 0.4, 0.05: 0.4, 0.15: 0.2 }],
  lnJitter: 0.1,
  // the chance ARS's first 4,000 P runs are AO's bit for bit in a world (P's runs carried the same bits under four readers
  // in AO's record), so its items read AO's 40,000 runs
  bitsMatch: 0.9,
  // item 4: A6RS's runs against A6's (points, worlds 0 and 1) and the paths it moves as a multiple of A6's against BO's (the
  // RS split a smaller change than a reference swap)
  runs: { '-0.3': 0.15, 0: 0.6, 0.3: 0.25 },
  churn: { 0.2: 0.3, 0.5: 0.5, 1: 0.2 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), AOD = join(HERE, 'results', 'diagao');
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return Number(k); } return Number(Object.keys(dist).pop()); };
const pois = m => { if (m <= 0) return 0; if (m > 50) { const g = Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd()); return Math.max(0, Math.round(m + Math.sqrt(m) * g)); } let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };

// 1. THE RECORDS, behind AO's gate
if (!/^GATE: passed/m.test(spawnSync('node', [join(HERE, 'reduce-ao.mjs'), AOD], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '')) { console.log('AO\'s files did not pass AO\'s gate'); process.exit(1); }
const load = f => JSON.parse(gunzipSync(readFileSync(join(AOD, f))).toString()), fAO = load('S364-AO-P60S6Q5.json.gz'), fA6 = load('S360-A6-P60S6Q5.json.gz');
const fBO = JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', 'diagnodeax', 'S360-BO-P60S6Q5.json.gz'))).toString());
const cnt1 = b => { let c = 0; for (const x of b) c += x; return c; }, bits = (f, nm) => Buffer.from(f.bits[nm], 'base64');
const aoJob = readdirSync(AOD).filter(f => /^case\d+\.txt$/.test(f)).flatMap(f => parseAO(readFileSync(join(AOD, f), 'utf8'))).find(x => x.label === 'AO/P60S6Q5');
const RUNS = [0, 1, 2].map(k => cnt1(bits(fAO, `P${k}`))), TABLE = [0, 1, 2].map(k => aoJob.tables[k].P), LNAO = TABLE.map((t, k) => Math.log(t / (100 * RUNS[k] / NP_AO)));
console.log('AOR\'S DERIVATION (predictions/diag-aor.md)\n\n1. THE RECORDS (AO\'s files behind AO\'s gate; NODE-AX\'s BO)');
for (const k of [0, 1, 2]) console.log(`  AO world ${k}: P table ${f4(TABLE[k])} runs ${RUNS[k]}/${NP_AO} ln ${f4(LNAO[k])}`);
const CH = [0, 1].map(k => { const a = bits(fA6, `OWN${k}`), b = bits(fBO, `OWN${k}`); let lost = 0, saved = 0, alive = 0; for (let i = 0; i < a.length; i++) { if (a[i]) alive++; if (b[i] && !a[i]) lost++; else if (a[i] && !b[i]) saved++; } return { lost, saved, alive }; });
for (const k of [0, 1]) console.log(`  A6 world ${k}: survival ${f4(100 * CH[k].alive / NPW)}; against BO on the same paths lost ${CH[k].lost} saved ${CH[k].saved}`);

// a synthetic read: the deletion term and ARS's tables at a story's values, the runs AO's (or ARS's own 4,000 where its bits
// would differ), A6RS's runs moved from A6's
const A6b = [0, 1].map(k => bits(fA6, `OWN${k}`)), n = NPW;
function setOf({ del, s, shift, r = [0.3, 0.05], match = [true, true, true], d = [0, 0], churn = 0.5 }) {
  const runsP = RUNS.map(c => 100 * c / NP_AO), D0 = runsP[0] * Math.exp(del), R0 = Math.max(0, TABLE[0] - D0);
  const tab = [(D0 + s * R0) * Math.exp(shift), ...[1, 2].map(k => TABLE[k] * (1 - r[k - 1] * (1 - s)) * Math.exp((rnd() * 2 - 1) * JUDGED.lnJitter))];
  const RUN = k => (match[k] ? { c: RUNS[k], N: NP_AO, match: true } : { c: pois(NPW * RUNS[k] / NP_AO), N: NPW, match: false });
  const RS = d.map((dd, k) => { const b = Uint8Array.from(A6b[k]), c = churn * (CH[k].lost + CH[k].saved), net = dd * n / 100; let lost = pois(Math.max(0, (c - net) / 2)), saved = pois(Math.max(0, (c + net) / 2)); for (let i = 0; i < n && (lost > 0 || saved > 0); i++) { const j = Math.floor(rnd() * n); if (b[j] && lost > 0) { b[j] = 0; lost--; } else if (!b[j] && saved > 0) { b[j] = 1; saved--; } } return b; });
  return [D0, { c: RUNS[0], N: NP_AO }, RUN, k => tab[k], (arm, k) => (arm === 'A6RS' ? RS[k] : A6b[k])];
}
const cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');

// 2. THE POWER through items()
const DR = 40;
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-aor.mjs's items(); the runs AO's, ${NP_AO} paths a world)`);
for (const v of [-1.2, -0.7, -0.4, 0, 0.4, 0.7, 1.1, 1.5, 2.0]) { const c = cnt(); for (let q = 0; q < DR; q++) c[items(...setOf({ del: v, s: 0, shift: 0 }))['1'].outcome]++; console.log(`  item 1, ln(deletion / runs) ${v}: ${row(c)}`); }
for (const s of [0.05, 0.15, 0.3]) for (const v of [-0.5, 0, 0.5]) { const c = cnt(); for (let q = 0; q < DR; q++) c[items(...setOf({ del: v, s, shift: 0 }))['2'].outcome]++; console.log(`  item 2, the deletion term at ln ${v} and the kept share ${s}: ${row(c)}`); }
for (const ch of [0.2, 0.5, 1]) for (const dd of [-0.6, -0.3, 0, 0.3]) { const c = cnt(); for (let q = 0; q < DR; q++) c[items(...setOf({ del: 0, s: 0.15, shift: 0, d: [dd, dd], churn: ch }))['4'].outcome]++; console.log(`  churn x${ch} item 4, the runs ${dd} points in both worlds: ${row(c)}`); }

// 3. THE CREDENCES: the receipt's credences for O169's carrier through the judged stories, each draw read through items()
const logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 16 Oct 05:36 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(logT || '') || ['', ''])[1].matchAll(/O169-([A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const sum = Object.values(cc).reduce((a, b) => a + b, 0);
if (Object.keys(cc).length !== 6 || Math.abs(sum - 1) > 0.02 || Object.keys(cc).some(c => !JUDGED.del[c]) || cc.COPY !== Math.max(...Object.values(cc))) { console.log(`the receipt's CAUSE CREDENCES for O169 did not read, or COPY does not lead (${JSON.stringify(cc)})`); process.exit(1); }
const ND = 2000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
function credences(cmap) {
  const t2 = Object.values(cmap).reduce((a, b) => a + b, 0), pickM = () => { let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
  const I = { 1: cnt(), 2: cnt(), 3: cnt(), 4: cnt() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = { 1: [], 2: [], 3: [], 4: [] };
  for (let q = 0; q < ND; q++) {
    const c = pickM(), dr = pick(JUDGED.runs);
    const story = { del: pick(JUDGED.del[c]), s: pick(JUDGED.keep), shift: pick(c === 'COPY' ? JUDGED.arsShiftCopy : JUDGED.arsShift), r: JUDGED.rShare.map(pick), match: [0, 1, 2].map(() => rnd() < JUDGED.bitsMatch), d: [dr, dr], churn: pick(JUDGED.churn) };
    const it = items(...setOf(story));
    for (const i of ['1', '2', '3', '4']) I[i][it[i].outcome]++;
    pt[1].push(it['1'].cell.m); pt[2].push(it['2'].cell.m); pt[3].push(it['3'].cells[0].m); pt[4].push(it['4'].cells[0].d);
    const o = i => it[i].outcome;
    if (o('4') === 'FALSIFIED') R.R4++;
    else if (o('1') === 'FALSIFIED' && it['1'].side === 'over') R.R3++;
    else if (['1', '2', '3', '4'].every(i => o(i) === 'HELD')) R.R1++;
    else if (o('1') === 'HELD') R.R2++;
    else R.else++;
  }
  return { I, R, pt };
}
const WHAT = { 1: 'ln(deletion / runs) in world 0', 2: 'ARS\'s ln(table / runs) in world 0', 3: 'ARS\'s ln(table / runs) in world 1', 4: 'A6RS\'s runs less A6\'s in world 0, points' };
const show = ({ I, R, pt }, tag) => {
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  console.log(`  escalation trigger 3 (a run over 2 hours with the 'else' row at 0.6 or more): else ${f2(R.else / ND)}`);
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
  for (const i of ['1', '2', '3', '4']) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);
};
console.log(`\n3. THE CREDENCES AS THE RECEIPT STATES THEM (the receipt of 16 Oct 05:36 UK: ${Object.entries(cc).map(([k, v]) => `O169-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(cc), '  as stated, ');
const sc = /an item leaning on a deep review's cause or story ([0-9.]+) \((\d+) of (\d+)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!sc) { console.log('the scorecard\'s lead rate did not read (results-scorecard.txt)'); process.exit(1); }
const lead = Number(sc[1]), rest = sum - cc.COPY, cr = Object.fromEntries(Object.entries(cc).map(([k, v]) => [k, k === 'COPY' ? lead * sum : v * (1 - lead) * sum / rest]));
console.log(`\n3b. THE CREDENCES WITH THE LEADING CAUSE AT THE RECORD'S RATE (results-scorecard.txt: ${sc[1]}, ${sc[2]} of ${sc[3]}; O169-COPY at ${lead}, the rest scaled: ${Object.entries(cr).map(([k, v]) => `${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
show(credences(cr), 'CREDENCE ');

// 4. THE BUDGET: AO's and A6's case logs (the same code; AOP and ARS run P on 4,000 a world, a tenth of AO's)
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const lg = readdirSync(AOD).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(AOD, f), 'utf8')), ao = lg.find(t => /job AO\/P60S6Q5 /.test(t)), a6 = lg.find(t => /job A6\/P60S6Q5 /.test(t));
const sO = num(/solve CAND AO\/P60S6Q5: table \S+ secs (\d+)/, ao), bO = num(/adaptive AO\/P60S6Q5: .* secs (\S+)$/m, ao), rO = num(/runs AO\/P60S6Q5: secs (\d+)/, ao), tO = num(/refTail AO\/P60S6Q5: .* secs (\d+)$/m, ao), fO = num(/forceIdentity \d+\/\d+ secs (\d+)/, ao);
const s6 = num(/solve CAND A6\/P60S6Q5: table \S+ secs (\d+)/, a6), l6 = num(/ownTook .* secs (\d+)/, a6), b6 = num(/adaptive A6\/P60S6Q5: .* secs (\S+)$/m, a6);
if (![sO, bO, rO, tO, fO, s6, l6, b6].every(Number.isFinite)) { console.log('the budget\'s inputs did not read'); process.exit(1); }
const perRun = rO / (3 * (NP_AO + NPW)), runs = 3 * 2 * NPW, AOP = sO + bO + perRun * runs + fO + 2 * tO, ARS = sO + bO + perRun * runs + fO, A6RS = s6 + l6 + b6;
console.log(`\n4. THE BUDGET: AO's solve ${sO} s and build ${f2(bO)} s, its runs ${rO} s for ${3 * (NP_AO + NPW)} runs (${f4(perRun)} s a run), its tail check ${tO} s and forceIdentity ${fO} s (grade C); AOP: ${runs} runs and the engine run twice - about ${f2(AOP / 3600)} h; ARS about ${f2(ARS / 3600)} h; A6RS as A6 (solve ${s6} s, ledger ${l6} s, build ${f2(b6)} s) about ${f2(A6RS / 3600)} h; on three cores the wall about ${f2(Math.max(AOP, ARS, A6RS) / 3600)} h`);
