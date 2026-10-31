/*
 * HO-DEP'S DERIVATION (predictions/diag-hodep.md; the deep review after FOOT-S366, deep-review-log.md 18 Oct 09:43 UK, and its
 * design consult of 11:27 UK): the records (FOOT-S366's saved K1F on S362 behind FOOT-S366's gate: its tables, runs and its
 * discordance against K1, which HO-DEP's K1F reproduces; the reach step's A and O on HOUSE2 at 30 points, 400 paths a world
 * from path 4,000, behind select-hodep.mjs's choice: their tables, which are the batch's, O's runs, the moves differing); the
 * power of items 1-4 through reduce-hodep.mjs's own items(); the credences from the receipt's CAUSE CREDENCES (its two sets,
 * O179-* and DEP-*, read from the log, not typed) through the judged stories below, as stated (section 3) and with each set's
 * leading cause at the record's rate (results-scorecard.txt, section 3b, the registered ones); the decision rows; the points and
 * 80% intervals; the budget.
 *   node research/solver/derive-hodep.mjs > research/solver/results-derive-hodep.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, rowOf, HOUSE2, NPW } from './reduce-hodep.mjs';
import { MIX3W } from './stats.mjs';

// THE JUDGED INPUTS (committed before this script's output and before the reach step's output; grade D throughout). Two cause
// sets, drawn apart: DEP (what the fixed reference adds over the order reference on a deposit household) for HOUSE2's A against
// O and for S362's order side; O179 (S362's carrier) for S362's K1F against K2.
export const JUDGED = {
  // HOUSE2: A's survival less O's by the mixture (points, every world alike)
  d1: {
    ADVCAL: { 0: 0.4, 0.15: 0.4, 0.4: 0.2 },
    NONE: { 0: 1 },
    WORSE: { '-0.3': 0.5, '-0.7': 0.5 },
    OTHER: { '-0.4': 0.25, 0: 0.5, 0.4: 0.25 },
  },
  // HOUSE2: the whole score's change less the survival change (points: estate, cuts and raises)
  wx1: {
    ADVCAL: { 0: 0.5, 0.05: 0.5 },
    NONE: { 0: 1 },
    WORSE: { '-0.1': 0.5, 0: 0.5 },
    OTHER: { '-0.2': 0.3, 0: 0.4, 0.2: 0.3 },
  },
  // S362: K2's table less its runs by the mixture (points; the order reference's cliff under-read on S360 sat at -3.7 to -6.6
  // by world, results-axho.txt; K1F's own read -0.80, FOOT-S366)
  gapO2: {
    ADVCAL: { '-2': 0.3, '-3.5': 0.4, '-5': 0.3 },
    NONE: { '-0.8': 0.5, '-1.2': 0.5 },
    WORSE: { 0: 0.5, 1: 0.5 },
    OTHER: { '-3': 0.3, 0: 0.4, 2: 0.3 },
  },
  // S362: K1F's survival less K2's by the mixture (points), by O179's cause
  d2: {
    TRADE: { '-0.1': 0.25, 0: 0.5, 0.1: 0.25 },
    SECOND: { '-0.4': 0.5, '-0.2': 0.5 },
    FIXOWN: { '-0.3': 0.5, 0: 0.5 },
    SEED: { 0: 1 },
    OTHER: { '-0.5': 0.25, 0: 0.5, 0.5: 0.25 },
  },
  // S362: the whole score's change less the survival change (points), by O179's cause (SECOND: a second reader error costs the
  // whole score more than survival)
  wx2: {
    TRADE: { 0: 1 },
    SECOND: { '-0.2': 0.5, '-0.4': 0.5 },
    FIXOWN: { 0: 1 },
    SEED: { 0: 1 },
    OTHER: { '-0.2': 0.3, 0: 0.4, 0.2: 0.3 },
  },
  // HOUSE2: discordant outcomes per path whose moves differ (FOOT-S366's S362 read 31 of 541 in world 0, 0.057)
  ratio: { 0.03: 0.3, 0.06: 0.4, 0.12: 0.3 },
  // S362: K1F against K2's discordance as a multiple of K1F against K1's (31, 23 and 28 of 4,000 by world, FOOT-S366)
  churn2: { 1: 0.3, 2: 0.4, 4: 0.3 },
  // the whole score's continuous part a path (points: estate, cuts, raises), beside the survival part's +-100 on a discordant path
  wsd: { 0.2: 0.3, 0.3: 0.4, 0.5: 0.3 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 1; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return Number(k); } return Number(Object.keys(dist).pop()); };
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const binom = (n, p) => Math.max(0, Math.min(n, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss())));
// a beta draw by two gammas (Marsaglia-Tsang), for a survival from a count
const gamma = a => { if (a < 1) return gamma(a + 1) * Math.pow(rnd(), 1 / a); const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = gauss(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = rnd(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } };
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), cnt = b => { let c = 0; for (const x of b) c += x; return c; }, bitsOf = (f, k) => new Uint8Array(Buffer.from(f.bits[`OWN${k}`], 'base64'));
const tablesFromLog = (text, label) => [0, 1, 2].map(k => { const m = new RegExp(`tables ${label.replace(/[/]/g, '\\/')} ${k} z \\S+ weight \\S+: OWN (\\S+) READ`).exec(text); return m ? Number(m[1]) : NaN; });

// 1. THE RECORDS
if (!HOUSE2) { console.log('HOUSE2 is not set in reduce-hodep.mjs (the reach step chooses it before registration)'); process.exit(1); }
if (!/^GATE: passed/m.test(spawnSync('node', [join(HERE, 'reduce-foot.mjs'), R_('diagfoot')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '')) { console.log('FOOT-S366\'s files did not pass FOOT-S366\'s gate'); process.exit(1); }
const footLogs = readdirSync(R_('diagfoot')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('diagfoot'), f), 'utf8'));
const fK1F = ld(join(R_('diagfoot'), 'S362-K1F-P30S6Q5.json.gz')), fK1 = ld(join(R_('diagfoot'), 'S362-K1-P30S6Q5.json.gz'));
const tK1F = tablesFromLog(footLogs.find(t => /job K1F\/P30S6Q5 /.test(t)) || '', 'K1F/P30S6Q5'), runK1F = [0, 1, 2].map(k => cnt(bitsOf(fK1F, k)));
const disc1 = [0, 1, 2].map(k => { const a = bitsOf(fK1, k), b = bitsOf(fK1F, k); let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; });
const sel = spawnSync('node', [join(HERE, 'select-hodep.mjs'), '--reach', R_('hodep-reach')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!new RegExp(`^CHOSEN: ${HOUSE2}$`, 'm').test(sel)) { console.log(`the reach step did not choose ${HOUSE2} (select-hodep.mjs --reach: ${sel.split('\n').filter(Boolean).pop()})`); process.exit(1); }
const reachLogs = readdirSync(R_('hodep-reach')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('hodep-reach'), f), 'utf8'));
const reachFiles = readdirSync(R_('hodep-reach')).filter(f => f.endsWith('.json.gz')).map(f => ld(join(R_('hodep-reach'), f)));
const rA = reachFiles.find(j => j.id === HOUSE2 && j.job.startsWith('A/')), rO = reachFiles.find(j => j.id === HOUSE2 && j.job.startsWith('O/'));
const logA = reachLogs.find(t => new RegExp(`^${HOUSE2}\\s+case \\| job A/`, 'm').test(t)) || '', logO = reachLogs.find(t => new RegExp(`^${HOUSE2}\\s+case \\| job O/`, 'm').test(t)) || '';
const tA = tablesFromLog(logA, 'A/P30S6Q5'), tO = tablesFromLog(logO, 'O/P30S6Q5'), nR = rO ? rO.NPW : 0, runO = [0, 1, 2].map(k => cnt(bitsOf(rO, k)));
const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const diffPaths = [0, 1, 2].map(k => { const a = dec16(rA.moves[`MV${k}`]), o = dec16(rO.moves[`MV${k}`]), Y = rA.years; let n = 0; for (let i = 0; i < a.length / Y; i++) { for (let t = 0; t < Y; t++) { const x = a[i * Y + t], y = o[i * Y + t]; if (x !== 65535 && y !== 65535 && x !== y) { n++; break; } } } return n; });
if (![...tK1F, ...tA, ...tO].every(Number.isFinite) || !(nR > 0)) { console.log('the records did not read'); process.exit(1); }
console.log('HO-DEP\'S DERIVATION (predictions/diag-hodep.md)\n\n1. THE RECORDS');
console.log(`  S362, FOOT-S366's K1F (behind FOOT-S366's gate; HO-DEP's K1F reproduces it): tables ${tK1F.map(f4).join(', ')}; runs ${runK1F.join(', ')} of ${NPW} by world; discordant against K1 ${disc1.join(', ')}`);
console.log(`  ${HOUSE2}, the reach step (30 points, ${nR} paths a world from path 4,000): A's tables ${tA.map(f4).join(', ')}; O's tables ${tO.map(f4).join(', ')}; O's runs ${runO.join(', ')} of ${nR}; paths whose moves differ ${diffPaths.join(', ')} of ${nR}`);

// a synthetic read at a story's values, in reduce-hodep.mjs items()'s shape
const N = NPW, cellsFrom = (cCtrl, lost, saved) => ({ a: cCtrl - lost, b: lost, c: saved, d: N - cCtrl - saved });
function setOf({ d1, wx1, gapO2, d2, wx2, ratio, churn2, wsd }) {
  const pO = [0, 1, 2].map(k => beta(runO[k] + 0.5, nR - runO[k] + 0.5)), h2c = [], h2w = [], accA = [], accO = [];
  for (let k = 0; k < 3; k++) {
    const cO = binom(N, pO[k]), n = ratio * diffPaths[k] * N / nR, net = d1 / 100 * N;
    let lost = pois(Math.max(0, (n - net) / 2)), saved = pois(Math.max(0, (n + net) / 2)); lost = Math.min(lost, cO); saved = Math.min(saved, N - cO);
    h2c.push(cellsFrom(cO, lost, saved)); const dd = (saved - lost) / N; h2w.push({ d: 100 * dd + wx1, se: Math.sqrt(Math.max(1e-12, ((lost + saved) / N - dd * dd) * 1e4 + wsd * wsd) / N) });
    accA.push({ table: tA[k], c: cO - lost + saved, N }); accO.push({ table: tO[k], c: cO, N });
  }
  const s3c = [], s3w = [], accK1F = [], accK2 = [];
  for (let k = 0; k < 3; k++) {
    // paired, as item 1's: K1F's runs are FOOT-S366's (seen), K2's follow from the lost and saved paths drawn around the story's
    // net change (the deep-reviewer's consult of 18 Oct 15:09 UK, Q4a: the first draft drew K2's count apart, an unpaired noise)
    const n = churn2 * disc1[k], net = d2 / 100 * N;
    let lost = pois(Math.max(0, (n - net) / 2)), saved = pois(Math.max(0, (n + net) / 2)); lost = Math.min(lost, runK1F[k]); saved = Math.min(saved, N - runK1F[k]);
    const cK2 = runK1F[k] - saved + lost;
    s3c.push(cellsFrom(cK2, lost, saved));
    const dd = (saved - lost) / N; s3w.push({ d: 100 * dd + wx2, se: Math.sqrt(Math.max(1e-12, ((lost + saved) / N - dd * dd) * 1e4 + wsd * wsd) / N) });
    accK1F.push({ table: tK1F[k], c: runK1F[k], N }); accK2.push({ table: 100 * cK2 / N + gapO2, c: cK2, N });
  }
  return { h2: { cells: h2c, ws: h2w }, s362: { cells: s3c, ws: s3w }, acc: { h2: { A: accA, O: accO }, s362: { A: accK1F, O: accK2 } } };
}
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');
const BASE = { d1: 0, wx1: 0, gapO2: -3.5, d2: 0, wx2: 0, ratio: 0.06, churn2: 2, wsd: 0.3 };

// 2. THE POWER through items()
const DR = 40;
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-hodep.mjs's items(); ${HOUSE2}'s O at the reach's survival, ${N} paths a world)`);
for (const v of [-0.7, -0.5, -0.3, 0, 0.15, 0.4]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, d1: v }))['1'].outcome]++; console.log(`  item 1, A's survival less O's by the mixture ${v}: ${row(c)}`); }
for (const r of [0.03, 0.12]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, ratio: r }))['1'].outcome]++; console.log(`  item 1 at no change, discordance ${r} a differing path: ${row(c)}`); }
for (const v of [-0.5, -0.3, 0, 0.1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, d2: v }))['2'].outcome]++; console.log(`  item 2, K1F's survival less K2's by the mixture ${v}: ${row(c)}`); }
for (const w of [-0.4, -0.2]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, wx2: w }))['2'].outcome]++; console.log(`  item 2 at no survival change, the whole score ${w} beside: ${row(c)}`); }
for (const g of [-5, -3.5, -2, -0.8, -0.3, 1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...BASE, gapO2: g }))['3'].outcome]++; console.log(`  item 3, K2's table less runs on S362 ${g} (K1F's as FOOT-S366 read it): ${row(c)}`); }

// 3. THE CREDENCES: the receipt's two sets through the judged stories, each draw read through items()
const RECEIPT = '18 Oct 15:09 UK', logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => l.startsWith(`- ${RECEIPT} |`)) || '';
const credLine = (/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1];
const setFrom = pre => Object.fromEntries([...credLine.matchAll(new RegExp(`${pre}-([A-Z]+)=([0-9.]+)`, 'g'))].map(m => [m[1], Number(m[2])]));
const cO179 = setFrom('O179'), cDEP = setFrom('DEP'), sumOf = c => Object.values(c).reduce((a, b) => a + b, 0);
if (Object.keys(cO179).length !== 5 || Object.keys(cDEP).length !== 4 || Math.abs(sumOf(cO179) - 1) > 0.02 || Math.abs(sumOf(cDEP) - 1) > 0.02 || Object.keys(cO179).some(c => !JUDGED.d2[c]) || Object.keys(cDEP).some(c => !JUDGED.d1[c])) { console.log(`the receipt's CAUSE CREDENCES did not read (${credLine.slice(0, 200)})`); process.exit(1); }
const ND = 2000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
function credences(cD, cO) {
  const I = { 1: cnt3(), 2: cnt3(), 3: cnt3() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = { 1: [], 2: [], 3: [] };
  for (let q = 0; q < ND; q++) {
    const dc = pickC(cD), oc = pickC(cO);
    const story = { d1: pick(JUDGED.d1[dc]), wx1: pick(JUDGED.wx1[dc]), gapO2: pick(JUDGED.gapO2[dc]), d2: pick(JUDGED.d2[oc]), wx2: pick(JUDGED.wx2[oc]), ratio: pick(JUDGED.ratio), churn2: pick(JUDGED.churn2), wsd: pick(JUDGED.wsd) };
    const it = items(setOf(story));
    for (const i of ['1', '2', '3']) I[i][it[i].outcome]++;
    R[rowOf(it)]++;
    pt[1].push(it['1'].s.d); pt[2].push(it['2'].s.d); pt[3].push(it['3'].gain);
  }
  return { I, R, pt };
}
const WHAT = { 1: `A's survival less O's on ${HOUSE2} by the mixture, points`, 2: 'K1F\'s survival less K2\'s on S362 by the mixture, points', 3: 'K2\'s table error less K1F\'s on S362 by the mixture, each in absolute points (above zero: the fixed reads truer)' };
const show = ({ I, R, pt }, tag) => {
  for (const i of ['1', '2', '3']) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  console.log(`  escalation trigger 3 (a run over 2 hours with the 'else' row at 0.6 or more): else ${f2(R.else / ND)}`);
  for (const i of ['1', '2', '3']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
  for (const i of ['1', '2', '3']) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);
};
console.log(`\n3. THE CREDENCES AS THE RECEIPT STATES THEM (the receipt of ${RECEIPT}: ${Object.entries(cO179).map(([k, v]) => `O179-${k}=${v}`).join('; ')}; ${Object.entries(cDEP).map(([k, v]) => `DEP-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(cDEP, cO179), '  as stated, ');
const sc = /an item leaning on a deep review's cause or story ([0-9.]+) \((\d+) of (\d+)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!sc) { console.log('the scorecard\'s lead rate did not read (results-scorecard.txt)'); process.exit(1); }
const lead = Number(sc[1]), shade = c => { const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0], s = sumOf(c), rest = s - c[top]; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === top ? lead * s : v * (1 - lead) * s / rest])); };
const sD = shade(cDEP), sO = shade(cO179);
console.log(`\n3b. THE CREDENCES WITH EACH SET'S LEADING CAUSE AT THE RECORD'S RATE (results-scorecard.txt: ${sc[1]}, ${sc[2]} of ${sc[3]}; ${Object.entries(sD).map(([k, v]) => `DEP-${k} ${f2(v)}`).join(', ')}; ${Object.entries(sO).map(([k, v]) => `O179-${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
show(credences(sD, sO), 'CREDENCE ');

// 4. THE BUDGET: FOOT-S366's K1F (S362 at 30 points under the adaptive reference: solve and ledger) for K1F and A; its K1's
// ledger with the reach step's O solve scaled for K2 and O (the order reference builds no lattice)
const kf = footLogs.find(t => /job K1F\/P30S6Q5 /.test(t)) || '', num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const sK = num(/solve CAND K1F\/P30S6Q5: table \S+ secs (\d+)/, kf), lK = num(/checks K1F\/P30S6Q5: ownTook .* secs (\d+)/, kf), sOr = num(/solve CAND O\/P30S6Q5: table \S+ secs (\d+)/, logO);
if (![sK, lK, sOr].every(Number.isFinite)) { console.log('the budget\'s inputs did not read'); process.exit(1); }
console.log(`\n4. THE BUDGET (grade C): FOOT-S366's K1F on S362 at 30 points, solve ${sK} s and its ledger on 12,000 paths ${lK} s - K1F and A about ${f2((sK + lK) / 3600)} h each; the reach's O solve ${sOr} s with the same ledger - K2 and O about ${f2((sOr + lK) / 3600)} h each; four jobs on four cores, the wall about ${f2(Math.max(sK, sOr) / 3600 + lK / 3600)} h`);
