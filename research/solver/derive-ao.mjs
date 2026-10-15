/*
 * AO'S DERIVATION (predictions/diag-ao.md; the deep review after AN, deep-review-log.md 15 Oct 21:05 UK): the records (NE-GRID
 * C's S364 ORDER and BASE at six shares and NE-EDGE's S364 RZ and RS, behind their gates: P's tables against its runs on the
 * same 4,000 paths; NODE-AX's BO and BN and AN's file, behind their gates: GB's per-path spread, BO's survival and the paths
 * a change of reference moved, AN against BN); the power of items 1-4 through reduce-ao.mjs's own items(); the credences
 * from the 21:05 receipt's CAUSE CREDENCES (read from the log, not typed) through the judged stories below; the decision
 * rows; the points and 80% intervals; the reported lines' known answers (reduce-ao.mjs's luck adjustment and QF by year on
 * AN's and BO's saved files, against the receipt's figures and the logs' totals); the budget (NE-GRID C's S364 ORDER log,
 * NODE-AX's BO log, AN's log, AO's preflight's tail check, results/ao-preflight).
 *   node research/solver/derive-ao.mjs > research/solver/results-derive-ao.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, parse, lnRead, luckT, qfByYear, NPW } from './reduce-ao.mjs';
import { pathsForSeed } from '../engine.mjs';

// THE JUDGED INPUTS (committed before this script's output; grade D throughout). Each cause in the 21:05 receipt's map (its
// CAUSE CREDENCES, read below) predicts AO's and ARS's ln(table / runs) at P in worlds 1 and 2, A6's GB in worlds 0 and 1
// and A6's runs against BO's, as distributions over values. The records (section 1): under the order reference S364's P
// reads at ln 1.58 and 0.54 in worlds 1 and 2 (NE-GRID C's ORDER); under the fixed-mix reference with the RS split at -2.47
// and -1.94 (NE-EDGE's RS: the over-read removed, an under-read made); BO's GB -4.15 and -5.32, AN's (fifteen nodes) 0.03
// and -0.12.
export const JUDGED = {
  // item 1, AO, per world [world 1, world 2] (ln). REF: the matched reference reads S364 within a factor near 1.5; COPY: the
  // copy rule's R at the copied corners keeps ORDER's over-read (every corner of S364 sits under the support line 0.5);
  // DENSITY: the matched read needs dense shares, so at six a part of ORDER's over-read is left; TAIL and MODEL: the
  // reference's p too low in S364's tail, an under-read, larger in world 1 (the lower survival); OTHER: anywhere
  ao: {
    REF: [{ '-0.5': 0.2, '-0.2': 0.3, 0.2: 0.3, 0.5: 0.2 }, 'same'],
    COPY: [{ 1.2: 0.3, 1.6: 0.4, 2.0: 0.3 }, { 0.3: 0.3, 0.55: 0.4, 0.9: 0.3 }],
    DENSITY: [{ 0.6: 0.3, 1.0: 0.4, 1.5: 0.3 }, { 0.2: 0.3, 0.5: 0.4, 0.8: 0.3 }],
    TAIL: [{ '-1.6': 0.3, '-1.1': 0.4, '-0.6': 0.3 }, { '-1.0': 0.3, '-0.6': 0.4, '-0.3': 0.3 }],
    MODEL: [{ '-1.4': 0.3, '-0.9': 0.4, '-0.5': 0.3 }, { '-0.9': 0.3, '-0.5': 0.4, '-0.2': 0.3 }],
    OTHER: [{ '-1.2': 0.2, '-0.5': 0.2, 0: 0.2, 0.5: 0.2, 1.2: 0.2 }, 'same'],
  },
  // item 4, ARS: the RS split scales the copied corners' R down to the query's chance, so it removes COPY's over-read and
  // lowers every story a little (NE-EDGE: under the fixed-mix reference it overshot to an under-read beyond ln 3)
  ars: {
    REF: [{ '-0.6': 0.25, '-0.3': 0.3, 0: 0.3, 0.3: 0.15 }, 'same'],
    COPY: [{ '-0.6': 0.3, '-0.2': 0.4, 0.2: 0.3 }, 'same'],
    DENSITY: [{ '-0.8': 0.3, '-0.3': 0.4, 0.2: 0.3 }, 'same'],
    TAIL: [{ '-2.0': 0.3, '-1.4': 0.4, '-0.8': 0.3 }, { '-1.3': 0.3, '-0.8': 0.4, '-0.4': 0.3 }],
    MODEL: [{ '-1.7': 0.3, '-1.2': 0.4, '-0.7': 0.3 }, { '-1.1': 0.3, '-0.7': 0.4, '-0.3': 0.3 }],
    OTHER: [{ '-1.2': 0.2, '-0.5': 0.2, 0: 0.2, 0.5: 0.2, 1.2: 0.2 }, 'same'],
  },
  // each world's own move about its story value, either way at random (ln)
  lnJitter: 0.2,
  // item 2, A6's GB (points), the same story value in worlds 0 and 1, each moved by `worldJitter`: REF, COPY and TAIL say
  // the reference's carry is share-invariant on S360 (AN's 0.03 and -0.12 at fifteen nodes); MODEL a little lower; DENSITY
  // leaves most of BO's (-4.15, -5.32); OTHER anywhere
  gb: {
    REF: { '-0.4': 0.25, '-0.1': 0.35, 0.2: 0.25, 0.5: 0.15 }, COPY: 'REF', TAIL: 'REF',
    MODEL: { '-0.7': 0.3, '-0.3': 0.4, 0.1: 0.3 },
    DENSITY: { '-3.5': 0.3, '-2.5': 0.4, '-1.5': 0.3 },
    OTHER: { '-2.0': 0.25, '-1.0': 0.25, 0: 0.25, 0.5: 0.25 },
  },
  worldJitter: 0.15,
  // item 3, A6's runs against BO's (points, worlds 0 and 1): AN against BN moved -0.15 and +0.275; a few openings either way
  runs: { '-0.3': 0.2, 0: 0.5, 0.3: 0.3 },
  // the paths A6's policy moves (lost plus saved, a world) as a multiple of AN's against BN's (the nearest record: the same
  // swap at fifteen nodes)
  churn: { 0.5: 0.3, 1: 0.5, 2: 0.2 },
  // A6's per-path spread of GB as a multiple of BO's
  spread: { 0.75: 0.3, 1: 0.5, 1.5: 0.2 },
  // P's survival on S364 in worlds 1 and 2 as a multiple of the record's (P's runs carry the same bits under ORDER, BASE, RZ
  // and RS in worlds 0 and 1, section 1: the reader barely moves them; a new reference may move later moves a little)
  rate: { 0.75: 0.2, 1: 0.6, 1.5: 0.2 },
  // the leading cause at the receipt's own 0.30: it sits at the record's rate for a deep review's cause (0.32, 9 of 29,
  // results-scorecard.txt), so no shading (AN's derivation shaded a lead of 0.62 down to 0.5)
  leadCause: null,
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const mean = a => a.reduce((t, x) => t + x, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(a.reduce((t, x) => t + (x - m) * (x - m), 0) / (a.length - 1)); };
const gated = (script, dir) => /^GATE: passed/m.test(spawnSync('node', [join(HERE, script), dir], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '');
const logsOf = d => readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(d, f), 'utf8'));

// 1. THE RECORDS, behind their gates
for (const [s, d] of [['reduce-negrid-c.mjs', R_('diagnegridc')], ['reduce-needge.mjs', R_('diagneedge')], ['reduce-nodeax.mjs', R_('diagnodeax')], ['reduce-an.mjs', R_('diagan')]]) if (!gated(s, d)) { console.log(`${s}'s gate did not pass on ${d}`); process.exit(1); }
console.log('AO\'S DERIVATION (predictions/diag-ao.md)\n\n1. THE RECORDS (NE-GRID C, NE-EDGE, NODE-AX and AN, each behind its own gate)');
const ng = logsOf(R_('diagnegridc')).flatMap(parse).filter(x => x.id === 'S364'), ORD = ng.find(x => x.label === 'ORDER/P60S6Q5'), BAS = ng.find(x => x.label === 'BASE/P60S6Q5');
// NE-EDGE's S364 jobs (its labels RZ and RS are not AO's; their tables and P lines read here)
const edge = {}; for (const t of logsOf(R_('diagneedge'))) { if (!/^S364 /m.test(t)) continue; for (const a of ['RZ', 'RS']) for (let k = 0; k < 3; k++) { const tb = new RegExp(`tables ${a}/P60S6Q5 ${k} z \\S+ weight \\S+: P (\\S+) `).exec(t), sm = new RegExp(`sim ${a}/P60S6Q5 ${k} P ai 12: (\\d+)/(\\d+) bits (\\S+)`).exec(t); if (tb && sm) (edge[a] = edge[a] || [])[k] = { P: Number(tb[1]), ok: Number(sm[1]), n: Number(sm[2]), bits: sm[3] }; } }
const REC = { ORDER: [0, 1, 2].map(k => ({ P: ORD.tables[k].P, ...ORD.sims[`P${k}`] })), BASE: [0, 1, 2].map(k => ({ P: BAS.tables[k].P, ...BAS.sims[`P${k}`] })), RZ: edge.RZ, RS: edge.RS };
for (const [a, r] of Object.entries(REC)) { if (!r || r.length !== 3) { console.log(`the record ${a} did not read`); process.exit(1); } console.log(`  S364 ${a} (six shares): ${r.map((x, k) => `world ${k} P table ${f4(x.P)} runs ${x.ok}/${x.n} ln ${f4(lnRead(x.P, x.ok, x.n, 0.05).m)}`).join('; ')}`); }
console.log(`  P's runs carry the same bits under ORDER, BASE, RZ and RS: world 0 ${new Set(Object.values(REC).map(r => r[0].bits)).size === 1}, world 1 ${new Set(Object.values(REC).map(r => r[1].bits)).size === 1}, world 2 ${new Set(Object.values(REC).map(r => r[2].bits)).size === 1}`);
const load = (d, f) => JSON.parse(gunzipSync(readFileSync(join(R_(d), f))).toString());
const fBO = load('diagnodeax', 'S360-BO-P60S6Q5.json.gz'), fBN = load('diagnodeax', 'S360-BN-P60S15Q5.json.gz'), fAN = load('diagan', 'S360-AN-P60S15Q5.json.gz');
const arrOf = (f, x, k) => { const b = Buffer.from(f.per[`${x}${k}`], 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const bitsOf = (f, k) => Buffer.from(f.bits[`OWN${k}`], 'base64');
const SD = [0, 1].map(k => sd(arrOf(fBO, 'GB', k)));
const CH = [0, 1].map(k => { const a = bitsOf(fBN, k), b = bitsOf(fAN, k); let lost = 0, saved = 0; for (let i = 0; i < a.length; i++) { if (a[i] && !b[i]) lost++; else if (b[i] && !a[i]) saved++; } return { lost, saved }; });
for (const k of [0, 1]) console.log(`  S360 world ${k}: BO's GB mean ${f4(mean(arrOf(fBO, 'GB', k)))} sd ${f4(SD[k])}, survival ${f4(mean(arrOf(fBO, 'X', k)))}; AN's GB ${f4(mean(arrOf(fAN, 'GB', k)))}; AN against BN on the same paths: lost ${CH[k].lost} saved ${CH[k].saved}`);

// a synthetic read: AO's and ARS's tables at a story's ln and the runs at a rate; A6's per-path GB at the story's values
// and BO's spread times x; A6's runs moved from BO's
const n = NPW, NP = 10 * NPW, BOb = [0, 1, 2].map(k => bitsOf(fBO, k)), RATE = [0, 1, 2].map(k => REC.ORDER[k].ok / REC.ORDER[k].n);
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
function setOf({ ao = [0, 0], ars = [0, 0], g0 = 0, g1 = 0, d0 = 0, d1 = 0, churn = 1, rate = 1 }, x = 1) {
  const rd = { AO: [], ARS: [] };
  for (const [arm, v] of [['AO', ao], ['ARS', ars]]) for (const k of [0, 1, 2]) { const r = RATE[k] * rate, c = pois(NP * r), lnv = k === 0 ? 0 : v[k - 1]; rd[arm][k] = [100 * r * Math.exp(lnv), c, NP]; }
  const P = {}; [[0, g0], [1, g1], [2, 0]].forEach(([k, m]) => { const a = new Float64Array(n), s = SD[Math.min(k, 1)]; for (let i = 0; i < n; i++) a[i] = m + x * s * gauss(); P[`GB${k}`] = a; });
  const S = [d0, d1, 0].map((d, k) => {
    const b = Uint8Array.from(BOb[k]), c = k < 2 ? churn * (CH[k].lost + CH[k].saved) : 0, net = d * n / 100;
    let lost = pois(Math.max(0, (c - net) / 2)), saved = pois(Math.max(0, (c + net) / 2));
    for (let i = 0; i < n && (lost > 0 || saved > 0); i++) { const j = Math.floor(rnd() * n); if (b[j] && lost > 0) { b[j] = 0; lost--; } else if (!b[j] && saved > 0) { b[j] = 1; saved--; } }
    return b;
  });
  return [(arm, k) => rd[arm][k], (arm, xx, k) => (arm === 'A6' ? P[`${xx}${k}`] : null), (arm, k) => (arm === 'A6' ? S[k] : BOb[k])];
}
const cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');

// 2. THE POWER through items()
const DR = 40;
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-ao.mjs's items(); P on ${NP} paths a world at the record's survival times 0.75, 1, 1.5; A6 on ${n} paths at BO's spread times 0.75, 1, 1.5)`);
for (const rate of [0.75, 1, 1.5]) for (const v of [-1.4, -1.1, -0.9, -0.7, -0.5, 0, 0.5, 0.7, 0.9, 1.1, 1.4]) { const c = cnt(); for (let d = 0; d < DR; d++) c[items(...setOf({ ao: [v, v], rate }))['1'].outcome]++; console.log(`  rate x${rate} item 1 (and 4), ln ${v} in both worlds: ${row(c)}`); }
for (const x of [0.75, 1, 1.5]) for (const g of [-1.8, -1.2, -1.0, -0.8, -0.5, -0.3, 0, 0.3, 0.5, 0.8, 1.0, 1.2]) { const c = cnt(); for (let d = 0; d < DR; d++) c[items(...setOf({ g0: g, g1: g }, x))['2'].outcome]++; console.log(`  x${x} item 2, GB ${g} in both worlds: ${row(c)}`); }
for (const ch of [0.5, 1, 2]) for (const d of [-0.6, -0.3, 0, 0.3]) { const c = cnt(); for (let k = 0; k < DR; k++) c[items(...setOf({ d0: d, d1: d, churn: ch }))['3'].outcome]++; console.log(`  churn x${ch} item 3, the runs ${d} points in both worlds: ${row(c)}`); }

// 3. THE CREDENCES: the receipt's cause credences through the judged stories, each draw read through items()
const logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 15 Oct 21:05 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(logT || '') || ['', ''])[1].matchAll(/AO-([A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const sum = Object.values(cc).reduce((a, b) => a + b, 0);
if (Object.keys(cc).length !== 6 || Math.abs(sum - 1) > 0.02 || Object.keys(cc).some(c => !JUDGED.ao[c] || !JUDGED.ars[c] || !JUDGED.gb[c]) || cc.REF !== Math.max(...Object.values(cc))) { console.log(`the receipt's CAUSE CREDENCES did not read, or REF does not lead (${JSON.stringify(cc)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return Number(k); } return Number(Object.keys(dist).pop()); };
const pickC = () => { let u = rnd() * sum, acc = 0; for (const [k, v] of Object.entries(cc)) { acc += v; if (u < acc) return k; } return Object.keys(cc).pop(); };
const lnStory = ([w1, w2]) => { const a = pick(w1), j = () => (rnd() * 2 - 1) * JUDGED.lnJitter; return [a + j(), (w2 === 'same' ? a : pick(w2)) + j()]; };
const ND = 2000, I = { 1: cnt(), 2: cnt(), 3: cnt(), 4: cnt() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = { 1: [], 2: [], 3: [], 4: [] };
for (let d = 0; d < ND; d++) {
  const c = pickC(), gd = typeof JUDGED.gb[c] === 'string' ? JUDGED.gb[JUDGED.gb[c]] : JUDGED.gb[c], g = pick(gd), j = () => (rnd() * 2 - 1) * JUDGED.worldJitter, dr = pick(JUDGED.runs);
  const story = { ao: lnStory(JUDGED.ao[c]), ars: lnStory(JUDGED.ars[c]), g0: g + j(), g1: g + j(), d0: dr, d1: dr, churn: pick(JUDGED.churn), rate: pick(JUDGED.rate) };
  const it = items(...setOf(story, pick(JUDGED.spread)));
  for (const i of ['1', '2', '3', '4']) I[i][it[i].outcome]++;
  pt[1].push(it['1'].cells[0].m); pt[2].push(it['2'].cells[0].m); pt[3].push(it['3'].cells[0].d); pt[4].push(it['4'].cells[0].m);
  const o = i => it[i].outcome;
  if (o('2') === 'FALSIFIED') R.R3++;
  else if (o('1') === 'FALSIFIED' && it['1'].side === 'under') R.R4++;
  else if (o('1') === 'FALSIFIED' && it['1'].side === 'over' && o('4') === 'HELD') R.R2++;
  else if (o('1') === 'HELD' && o('2') === 'HELD' && o('4') === 'HELD' && o('3') !== 'FALSIFIED') R.R1++;
  else R.else++;
}
console.log(`\n3. THE CREDENCES (the receipt of 15 Oct 21:05 UK: ${Object.entries(cc).map(([k, v]) => `AO-${k}=${v}`).join('; ')}, taken as stated; ${ND} draws through items())`);
for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}: ${row(I[i])}`);
console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
console.log(`  escalation trigger 3 (a run over 2 hours with the 'else' row at 0.6 or more): else ${f2(R.else / ND)}`);
const qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const WHAT = { 1: 'AO\'s ln(table / runs) at P in world 1', 2: 'A6\'s GB in world 0, points', 3: 'A6\'s runs less BO\'s in world 0, points', 4: 'ARS\'s ln(table / runs) at P in world 1' };
for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
for (const i of ['1', '2', '3', '4']) console.log(`CREDENCE item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);

// 4. THE REPORTED LINES' KNOWN ANSWERS: reduce-ao.mjs's luck adjustment and QF by year on AN's and BO's saved files
const paths = pathsForSeed(7002, n, 60), qfLog = (d, f, L) => [0, 1, 2].map(k => Number((new RegExp(`qf ${L} ${k}: paths \\d+ QF (\\S+)`).exec(readFileSync(join(R_(d), f), 'utf8')) || [])[1]));
console.log('\n4. THE REPORTED LINES\' KNOWN ANSWERS (reduce-ao.mjs luckT and qfByYear on the saved files)');
console.log(`  AN's T luck-adjusted (years 0 to 7's shocks): ${[0, 1, 2].map(k => { const x = luckT(fAN, k, paths); return `${f4(x.m)} (se ${f4(x.se)})`; }).join(', ')}; the receipt's -0.76, -0.16, -0.66 (se 0.47)`);
for (const [nm, f, d, lf, L] of [['AN', fAN, 'diagan', 'case0.txt', 'AN/P60S15Q5'], ['BO', fBO, 'diagnodeax', 'case1.txt', 'BO/P60S6Q5']]) { const lg = qfLog(d, lf, L); console.log(`  ${nm}'s QF by year summed: ${[0, 1, 2].map(k => f4(Object.values(qfByYear(f, k)).reduce((t, x) => t + x.m, 0))).join(', ')}; its log's QF ${lg.map(v => f4(v)).join(', ')}`); }

// 5. THE BUDGET
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const ng11 = logsOf(R_('diagnegridc')).find(t => /job ORDER\/P60S6Q5 /.test(t)), ax1 = readFileSync(join(R_('diagnodeax'), 'case1.txt'), 'utf8'), an0 = readFileSync(join(R_('diagan'), 'case0.txt'), 'utf8');
const pre = readFileSync(join(R_('ao-preflight'), 'ao', 'case0.txt'), 'utf8');
const sO = num(/solve CAND ORDER\/P60S6Q5: table \S+ secs (\d+)/, ng11), runO = num(/checks ORDER\/P60S6Q5: forceIdentity \d+\/\d+ secs (\d+)/, ng11);
const sB = num(/solve CAND BO\/P60S6Q5: table \S+ secs (\d+)/, ax1), lB = num(/checks BO\/P60S6Q5: ownTook .* secs (\d+)/, ax1);
const build = num(/adaptive AN\/P60S15Q5: .* secs (\S+)$/m, an0), refT = num(/refTook \d+\/\d+ \(.*, secs ([\d.]+)\)$/m, an0);
const tailS = num(/refTail AO\/P\d+S6Q5: .* secs (\d+)$/m, pre), tailN = [...pre.matchAll(/tail AO\/P\d+S6Q5 \d \d: records \d+ states (\d+)/g)].reduce((t, m) => t + Number(m[1]), 0);
if (![sO, runO, sB, lB, build, refT, tailS].every(Number.isFinite) || !(tailN > 0)) { console.log(`the budget's inputs did not read (${[sO, runO, sB, lB, build, refT, tailS, tailN].join(', ')})`); process.exit(1); }
const perRun = runO / (6 * NPW + 1000), runsAO = 3 * (NP + 2 * NPW) + 1000, tailFull = tailS * 300 / tailN;
const AO = sO + build + perRun * runsAO + tailFull, CO = sO + runO, A6 = sB + build + lB + refT;
console.log(`\n5. THE BUDGET: NE-GRID C's S364 ORDER solve ${sO} s and its runs ${runO} s for ${6 * NPW + 1000} runs (${f4(perRun)} s a run, grade C); AO and ARS each: solve ${sO} s, the reference's build ${f2(build)} s (AN's), ${runsAO} runs (P ${NP} a world, D and an own opening ${NPW}, forceIdentity 1,000) ${Math.round(perRun * runsAO)} s, the tail check and engine run ${Math.round(tailFull)} s (the preflight's ${tailS} s over ${tailN} states, scaled to 300: grade C) - about ${f2(AO / 3600)} h; CO about ${f2(CO / 3600)} h; A6: BO's solve ${sB} s and ledger ${lB} s, the build and refTook ${f2(build + refT)} s - about ${f2(A6 / 3600)} h; on four cores the wall about ${f2(Math.max(AO, CO, A6) / 3600)} h (O120's drift can triple it)`);
