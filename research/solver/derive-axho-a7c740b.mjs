/*
 * AX-HO'S DERIVATION (predictions/diag-axho.md; the deep review after AOR, deep-review-log.md 17 Oct 18:22 UK; S366 in the
 * receipt's S380's place, the maintainer's choice of 17 Oct): the records (7u's S366 candidate unit, its table against its
 * runs and its solve and run times, behind 7u's gate; AOR's A6RS and NODE-AX's BO behind their gates: the paths a change of
 * reference moves on S360, A6RS's GB by world and its per-path spread; AX-HO's preflight steps, results-axho-preflight.txt
 * and results-axho-preflight-s366.txt: S366's 30-point J1 and J2, their openings, survival and the moves differing between
 * them, the ledger's cost against a plain run and the reference's build); the power of items 1-4 through reduce-axho.mjs's own items();
 * the credences from the receipt's judged starts through the judged stories below, the review's story (for S366) as the
 * receipt states it (section 3) and at the record's rate for a deep review's story (results-scorecard.txt, section 3b, the
 * registered ones); the decision rows; the points and 80% intervals; the budget.
 *   node research/solver/derive-axho.mjs > research/solver/results-derive-axho.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, NPW, XSPLIT } from './reduce-axho.mjs';

// THE JUDGED INPUTS (committed before this script's output; grade D throughout). The receipt judges each item's start
// (item 1 HELD 0.70; item 2 HELD 0.40, INCONCLUSIVE 0.45, FALSIFIED 0.15; item 3 HELD 0.50; item 4 HELD 0.65, read from the
// log below) for S380, the household S366 replaces, and names no story map; the stories here are mine, written for S366.
// The records (section 1): S366 under the candidate read 99.21 against 99.60 simulated (7u, the mixture at 30 points, its
// opening the de-risked 2,2); at 30 points here its two arms move apart on some paths (the S366 step); A6RS's GB on S360
// 0.10, 0.28 and 0.11 with a few dozen paths moved against BO's.
export const JUDGED = {
  // S366's survival by world (points), the mixture's 99.6 (7u) spread over the worlds: the bad world loses most
  surv: [98.0, 99.85, 100],
  // S366's read under the adaptive reference with the RS split. READ: the review's story, its tables within about half a
  // point of its runs and its GB under half a point; OVER: it over-reads S366's bad world; UNDER: it under-reads it (7u's
  // candidate 0.39 under on the mixture). The review's own credence for READ is its item 3 start (the story's most direct
  // item); OVER and UNDER share the rest
  shareOff: { OVER: 0.5, UNDER: 0.5 },
  // table less runs, points, per world [0, 1, 2] (world 2 at 100: a gap there only under)
  gap: {
    READ: [{ '-0.6': 0.25, '-0.2': 0.25, 0.2: 0.25, 0.6: 0.25 }, { '-0.3': 0.25, '-0.1': 0.25, 0.1: 0.25, 0.3: 0.25 }, { '-0.2': 0.4, 0: 0.6 }],
    OVER: [{ 0.8: 0.3, 1.6: 0.4, 2.5: 0.3 }, { 0.2: 0.3, 0.5: 0.4, 0.9: 0.3 }, { '-0.1': 0.5, 0: 0.5 }],
    UNDER: [{ '-2.5': 0.3, '-1.5': 0.4, '-0.7': 0.3 }, { '-0.9': 0.3, '-0.5': 0.4, '-0.2': 0.3 }, { '-0.3': 0.5, '-0.1': 0.5 }],
  },
  // J1's GB in worlds 0 and 1, points (one story value, each world moved by `gbJitter`)
  gb: {
    READ: { '-0.35': 0.2, '-0.1': 0.3, 0.1: 0.3, 0.35: 0.2 },
    OVER: { 0.3: 0.3, 0.7: 0.4, 1.3: 0.3 },
    UNDER: { '-1.3': 0.3, '-0.7': 0.4, '-0.3': 0.3 },
  },
  gbJitter: 0.1,
  // J1's per-path spread of GB on S366 as a multiple of A6RS's on S360
  spread: { 0.5: 0.3, 1: 0.4, 1.5: 0.3 },
  // item 1: J1's runs less J2's on S366 (points, worlds 0 and 1), a misread reference a little likelier to cost runs; and
  // the paths whose outcome the swap moves as a multiple of A6RS's against BO's on S360 (S366 loses a fiftieth of its
  // paths where S360 loses half or more, so far fewer outcomes can move though moves differ)
  runs1: { READ: { '-0.1': 0.2, 0: 0.6, 0.1: 0.2 }, OFF: { '-0.4': 0.15, '-0.15': 0.3, 0: 0.4, 0.1: 0.15 } },
  churn1: { 0.05: 0.3, 0.15: 0.35, 0.4: 0.25, 1: 0.1 },
  // item 4: J3's runs less J4's on S360 at seed 7004 (A6RS against BO on seed 7002: +0.075 and +0.45 points), the paths
  // moved as a multiple of A6RS's against BO's; J3's GB, A6RS's moved by a seed's draw (its standard error) and `gb4Shift`
  runs4: { '-0.3': 0.15, 0: 0.5, 0.3: 0.35 },
  churn4: { 0.75: 0.3, 1: 0.5, 1.5: 0.2 },
  gb4Shift: { '-0.1': 0.25, 0: 0.5, 0.1: 0.25 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 1; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return Number(k); } return Number(Object.keys(dist).pop()); };
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const binom = (n, p) => Math.max(0, Math.min(n, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss())));
const mean = a => a.reduce((t, x) => t + x, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(a.reduce((t, x) => t + (x - m) * (x - m), 0) / (a.length - 1)); };
const gated = (script, dir) => /^GATE: passed/m.test(spawnSync('node', [join(HERE, script), dir], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '');
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };

// 1. THE RECORDS, behind their gates
for (const [sc, d] of [['reduce-aor.mjs', R_('diagaor')], ['reduce-nodeax.mjs', R_('diagnodeax')]]) if (!gated(sc, d)) { console.log(`${sc}'s gate did not pass on ${d}`); process.exit(1); }
console.log('AX-HO\'S DERIVATION (predictions/diag-axho.md)\n\n1. THE RECORDS (7u, AOR and NODE-AX, each behind its own gate; AX-HO\'s preflight steps)');
// 7u's read prints its units only past its gate (its reducer exits otherwise): S366's candidate unit, its no-harm line, its log's times
const r7u = spawnSync('node', [join(HERE, 'reduce-7u.mjs')], { encoding: 'utf8', maxBuffer: 1 << 26 }), t7u = r7u.stdout || '';
const u366 = /^\s+S366 CAND\s+table (\S+) sim (\S+) error (\S+) .*\(opening (\S+)\)/m.exec(t7u), h366 = /^\s+S366\s+(\d+) saved\/(\d+) lost of (\d+) /m.exec(t7u);
const l7u = readdirSync(R_('diag7u')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('diag7u'), f), 'utf8')).find(t => /^S366 .*unit CAND\/CANDIDATE\/W0\.02 /m.test(t)) || '';
const s7u = num(/solve CAND\/CANDIDATE\/W0\.02: table \S+ secs (\d+)/, l7u), run7u = num(/run CAND\/CANDIDATE\/W0\.02: .* secs (\d+)$/m, l7u), n7u = num(/ran CAND\/CANDIDATE\/W0\.02: .* paths (\d+) /, l7u), p7u = num(/ran CAND\/CANDIDATE\/W0\.02: .* pts (\d+) /, l7u);
if (r7u.status !== 0 || !u366 || !h366 || ![s7u, run7u, n7u, p7u].every(Number.isFinite)) { console.log('7u\'s S366 lines did not read past its gate'); process.exit(1); }
console.log(`  7u S366 (the candidate at ${p7u} points, ${n7u} paths, the mixture): table ${u366[1]} against ${u366[2]} simulated (error ${u366[3]}), its opening ${u366[4]}; against the shipping default ${h366[1]} saved and ${h366[2]} lost of ${h366[3]} (a reader change, the nearest record of S366's outcomes moving); solve ${s7u} s, ${n7u} runs ${run7u} s`);
const pre366 = readFileSync(join(HERE, 'results-axho-preflight-s366.txt'), 'utf8'), q366 = pre366.split('\n').filter(l => l.startsWith('S366: ')).join('\n');
const sv = (arm, k) => num(new RegExp(`sim ${arm}/P60S6Q5 ${k} OWN ai \\d+: (\\d+)/`), q366), mvd = [0, 1, 2].map(k => num(new RegExp(`moves differing, J1 against J2: DIFFER world ${k}: paths (\\d+) `), pre366));
const own30 = num(/openings J1\/P60S6Q5: OWN ai (\d+)/, q366), led30 = num(/ownTook \d+\/(\d+) identity .* secs (?:\d+)/, q366), ledS = num(/checks J1\/P60S6Q5: ownTook \d+\/\d+ .* secs (\d+)/, q366), runS = num(/runs J1\/P60S6Q5: secs (\d+)/, q366), build30 = num(/adaptive J1\/P60S6Q5: .* secs (\S+)$/m, q366), solve30 = num(/solve CAND J1\/P60S6Q5: table \S+ secs (\d+)/, q366), solve30o = num(/solve CAND J2\/P60S6Q5: table \S+ secs (\d+)/, q366);
if (![own30, led30, ledS, runS, build30, solve30, solve30o, ...mvd, ...[0, 1, 2].map(k => sv('J1', k)), ...[0, 1, 2].map(k => sv('J2', k))].every(Number.isFinite)) { console.log('the S366 step\'s lines did not read (results-axho-preflight-s366.txt)'); process.exit(1); }
const n30 = led30 / 3, runs30 = 3 * (Math.round(XSPLIT * n30) - n30) + (own30 === 12 ? 0 : 3 * n30), ledgerFactor = Math.max(1, (ledS / led30) / (Math.max(1, runS) / runs30));
console.log(`  AX-HO's S366 step at 30 points on ${n30} paths a world: J1 alive ${[0, 1, 2].map(k => sv('J1', k)).join(', ')} and J2 ${[0, 1, 2].map(k => sv('J2', k)).join(', ')} by world; the moves differing on ${mvd.join(', ')} paths; J1's own opening ai ${own30}${own30 === 12 ? ' (P: the forced P runs are the ledger\'s)' : ''}; solve ${solve30} s (J2 ${solve30o} s), the reference's build ${build30} s; the ledger ${ledS} s over ${led30} paths, the plain runs ${runS} s over ${runs30}: the ledger ${f2(ledgerFactor)} times a plain run (floored at 1; grade C, seconds' resolution)`);
const SURVH = JUDGED.surv.map(x => x / 100);
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), fR = ld(join(R_('diagaor'), 'S360-A6RS-P60S6Q5.json.gz')), fB = ld(join(R_('diagnodeax'), 'S360-BO-P60S6Q5.json.gz'));
const bits = (f, nm) => Buffer.from(f.bits[nm], 'base64'), dec = x => { const b = Buffer.from(x, 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const CH = [0, 1].map(k => { const a = bits(fR, `OWN${k}`), b = bits(fB, `OWN${k}`); let lost = 0, saved = 0; for (let i = 0; i < a.length; i++) { if (b[i] && !a[i]) lost++; else if (a[i] && !b[i]) saved++; } return { lost, saved }; });
const BOB = [0, 1].map(k => bits(fB, `OWN${k}`)), GBR = [0, 1, 2].map(k => dec(fR.per[`GB${k}`])), GBM = GBR.map(mean), GBS = GBR.map(sd), GBSE = GBR.map(a => sd(a) / Math.sqrt(a.length));
for (const k of [0, 1]) console.log(`  A6RS against BO on S360 world ${k} (seed 7002): lost ${CH[k].lost} saved ${CH[k].saved} of ${NPW}; BO alive ${BOB[k].reduce((t, x) => t + x, 0)}`);
for (const k of [0, 1, 2]) console.log(`  A6RS's GB world ${k}: ${f4(GBM[k])} (se ${f4(GBSE[k])}, per-path sd ${f4(GBS[k])})`);

// a synthetic read at a story's values: J2's bits at S366's survival, J1's moved from them; J1's table S366's survival plus
// the gap and its runs drawn about that survival (the first 4,000 and the next 12,000 apart, so the review's 4,000-path
// read and the 16,000-path one stand on the same draws); GB per path at the story's mean and A6RS's spread; J4 BO's bits,
// J3 moved from them
const N = NPW, N16 = 4 * NPW;
const moved = (base, churn, d) => { const b = Uint8Array.from(base), n = b.length, net = d * n / 100; let lost = pois(Math.max(0, (churn - net) / 2)), saved = pois(Math.max(0, (churn + net) / 2)); for (let g = 0; g < 50 * n && (lost > 0 || saved > 0); g++) { const j = Math.floor(rnd() * n); if (b[j] && lost > 0) { b[j] = 0; lost--; } else if (!b[j] && saved > 0) { b[j] = 1; saved--; } } return b; };
function setOf({ gap, gb, spread = 1, d1 = [0, 0], c1 = 1, d4 = [0, 0], c4 = 1, gb4 = [0, 0, 0] }, n2 = N16) {
  const J2 = [0, 1].map(k => { const b = new Uint8Array(N); for (let i = 0; i < N; i++) b[i] = rnd() < SURVH[k] ? 1 : 0; return b; });
  const J1 = [0, 1].map(k => moved(J2[k], c1 * (CH[k].lost + CH[k].saved), d1[k])), J3 = [0, 1].map(k => moved(BOB[k], c4 * (CH[k].lost + CH[k].saved), d4[k]));
  const r4 = [0, 1, 2].map(k => binom(N, SURVH[k])), r12 = [0, 1, 2].map(k => binom(N16 - N, SURVH[k])), tab = [0, 1, 2].map(k => 100 * SURVH[k] + gap[k]);
  const runs = r4.map((c, k) => (n2 === N ? c : c + r12[k]));
  const sdS = GBS[1] * spread, G1 = [0, 1].map(k => Array.from({ length: N }, () => gb[k] + sdS * gauss())), G3 = [0, 1, 2].map(k => Array.from({ length: N }, () => gb4[k] + GBS[k] * gauss()));
  const S = (arm, k) => (arm === 'J1' ? J1[k] : arm === 'J2' ? J2[k] : arm === 'J3' ? J3[k] : BOB[k]);
  return [k => tab[k], k => ({ c: runs[k], N: n2 }), S, (arm, k) => (arm === 'J1' ? G1[k] : G3[k])];
}
const cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');

// 2. THE POWER through items()
const DR = 40, base = { gap: [0, 0, 0], gb: [0, 0], gb4: GBM };
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-axho.mjs's items(); S366 at the judged survival ${SURVH.map(x => f4(100 * x)).join(', ')} by world, J1's runs on ${N16} paths a world; S360 at BO's bits with A6RS's GB and spread; the paths moved as multiples of A6RS's against BO's)`);
for (const c1 of [1, 2, 4]) for (const d of [-0.6, -0.3, 0, 0.3]) { const c = cnt(); for (let q = 0; q < DR; q++) c[items(...setOf({ ...base, d1: [d, d], c1 }))['1'].outcome]++; console.log(`  churn x${c1} item 1, J1's runs ${d} points in worlds 0 and 1: ${row(c)}`); }
// item 2 as the review set it (4,000 paths a world) and as registered (16,000), on the same draws
for (const g of [-3.5, -2, -1, -0.6, -0.3, 0, 0.3, 0.6, 1, 2, 3.5]) { const c = cnt(), c4 = cnt(); for (let q = 0; q < DR; q++) { const s0 = st, a = items(...setOf({ ...base, gap: [g, g, g] }))['2'].outcome; st = s0; const b = items(...setOf({ ...base, gap: [g, g, g] }, N))['2'].outcome; c[a]++; c4[b]++; } console.log(`  item 2, table less runs ${g} points in every world: on ${N16} paths ${row(c)}; on ${N} (the review's) ${row(c4)}`); }
for (const g of [-0.3, 0.3]) { const c = cnt(); for (let q = 0; q < DR; q++) c[items(...setOf({ ...base, gap: [g, 0, 2 * g] }))['2'].outcome]++; console.log(`  item 2, table less runs ${g}, 0 and ${2 * g} by world: ${row(c)}`); }
for (const s of [1, 1.5]) for (const g of [-1.3, -0.6, -0.3, 0, 0.3, 0.45, 0.6, 1.3]) { const c = cnt(); for (let q = 0; q < DR; q++) c[items(...setOf({ ...base, gb: [g, g], spread: s }))['3'].outcome]++; console.log(`  spread x${s} item 3, J1's GB ${g} in worlds 0 and 1: ${row(c)}`); }
for (const c4 of [0.75, 1.5]) for (const d of [-0.6, -0.3, 0, 0.3]) { const c = cnt(); for (let q = 0; q < DR; q++) c[items(...setOf({ ...base, d4: [d, d], c4 }))['4'].outcome]++; console.log(`  churn x${c4} item 4, J3's runs ${d} points in worlds 0 and 1, its GB A6RS's: ${row(c)}`); }

// 3. THE CREDENCES: the review's story for S366 at the receipt's credence and at the record's rate, each draw read through items()
const logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 17 Oct 18:22 UK \|/.test(l)) || '';
const starts = (/Judged starts for the derivation: (.*?)\. STOP/.exec(logT) || ['', ''])[1], read = Number((/item 3 HELD ([0-9.]+)/.exec(starts) || [])[1]);
if (!(read > 0 && read < 1)) { console.log(`the receipt's judged starts did not read (${starts})`); process.exit(1); }
const ND = 2000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
function credences(cmap) {
  const t2 = Object.values(cmap).reduce((a, b) => a + b, 0), pickS = () => { let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
  const I = { 1: cnt(), 2: cnt(), 3: cnt(), 4: cnt() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = { 1: [], 2: [], 3: [], 4: [] };
  for (let q = 0; q < ND; q++) {
    const s = pickS(), g0 = pick(JUDGED.gb[s]), r1 = JUDGED.runs1[s === 'READ' ? 'READ' : 'OFF'], d1 = pick(r1), d4 = pick(JUDGED.runs4), sh = pick(JUDGED.gb4Shift);
    const story = { gap: JUDGED.gap[s].map(pick), gb: [0, 1].map(() => g0 + (rnd() * 2 - 1) * JUDGED.gbJitter), spread: pick(JUDGED.spread), d1: [d1, d1], c1: pick(JUDGED.churn1), d4: [d4, d4], c4: pick(JUDGED.churn4), gb4: GBM.map((m, k) => m + GBSE[k] * gauss() + sh) };
    const it = items(...setOf(story)), o = i => it[i].outcome;
    for (const i of ['1', '2', '3', '4']) I[i][o(i)]++;
    pt[1].push(it['1'].cells[0].d); pt[2].push(it['2'].cells[0].m); pt[3].push(it['3'].cells[0].m); pt[4].push(it['4'].harm.cells[0].d);
    if (o('1') === 'FALSIFIED' || o('4') === 'FALSIFIED') R.R2++;
    else if (['1', '2', '3', '4'].every(i => o(i) === 'HELD')) R.R1++;
    else if (o('1') === 'HELD' && o('4') === 'HELD' && (o('2') === 'FALSIFIED' || o('3') === 'FALSIFIED')) R.R3++;
    else if (o('1') === 'HELD' && o('4') === 'HELD') R.R4++;
    else R.else++;
  }
  return { I, R, pt };
}
const WHAT = { 1: 'J1\'s runs less J2\'s in world 0, points', 2: 'J1\'s table less its runs in world 0, points', 3: 'J1\'s GB in world 0, points', 4: 'J3\'s runs less J4\'s in world 0, points' };
const show = ({ I, R, pt }, tag) => {
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  console.log(`  escalation trigger 3 (a run over 2 hours with the 'else' row at 0.6 or more): else ${f2(R.else / ND)}`);
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
  for (const i of ['1', '2', '3', '4']) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);
};
const asStated = { READ: read, OVER: (1 - read) * JUDGED.shareOff.OVER, UNDER: (1 - read) * JUDGED.shareOff.UNDER };
console.log(`\n3. THE CREDENCES AS THE RECEIPT STATES THEM (the receipt of 17 Oct 18:22 UK, its judged starts: ${starts}; the story READ at its item 3 start, ${read}, OVER and UNDER sharing the rest: ${Object.entries(asStated).map(([k, v]) => `${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
show(credences(asStated), '  as stated, ');
const sc = /an item leaning on a deep review's cause or story ([0-9.]+) \((\d+) of (\d+)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!sc) { console.log('the scorecard\'s lead rate did not read (results-scorecard.txt)'); process.exit(1); }
const lead = Number(sc[1]), atRate = { READ: lead, OVER: (1 - lead) * JUDGED.shareOff.OVER, UNDER: (1 - lead) * JUDGED.shareOff.UNDER };
console.log(`\n3b. THE CREDENCES WITH THE REVIEW'S STORY AT THE RECORD'S RATE (results-scorecard.txt: ${sc[1]}, ${sc[2]} of ${sc[3]}; READ at ${lead}, the rest shared: ${Object.entries(atRate).map(([k, v]) => `${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
show(credences(atRate), 'CREDENCE ');

// 4. THE BUDGET: S366's 60-point solve as the S366 step's 30-point solve doubled (NE-GRID C's rule), the reference's build
// once (its lattice does not scale with the points), 7u's S366 runs for a run's cost, A6RS's and BO's logs (S360), the
// ledger factor; the engine leg at twice AOR's tail check on S360 (1.2 million engine runs against its 0.6 million) and none
// on S366 if its records miss the band as S380's did
const aorLog = readdirSync(R_('diagaor')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('diagaor'), f), 'utf8'));
const a6 = aorLog.find(t => /job A6RS\/P60S6Q5 /.test(t)), aop = aorLog.find(t => /job AOP\/P60S6Q5 /.test(t));
const boLog = readdirSync(R_('diagnodeax')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('diagnodeax'), f), 'utf8')).find(t => /job BO\/P60S6Q5 /.test(t));
const sA = num(/solve CAND A6RS\/P60S6Q5: table \S+ secs (\d+)/, a6), lA = num(/ownTook .* secs (\d+)/, a6), bA = num(/adaptive A6RS\/P60S6Q5: .* secs (\S+)$/m, a6), tl = num(/refTail AOP\/P60S6Q5: .* secs (\d+)$/m, aop);
const sB = num(/solve CAND BO\/P60S6Q5: table \S+ secs (\d+)/, boLog), lB = num(/ownTook .* secs (\d+)/, boLog);
if (![sA, lA, bA, tl, sB, lB].every(Number.isFinite)) { console.log('the budget\'s inputs did not read'); process.exit(1); }
const sO = 2 * solve30o, sA6 = 2 * (solve30 - build30) + build30, perRun = run7u / n7u, xs = Math.round(XSPLIT * NPW), eng = 2 * tl;
const J1 = sA6 + 3 * NPW * perRun * ledgerFactor + 3 * (xs - NPW) * perRun + (own30 === 12 ? 0 : 3 * NPW * perRun) + eng;
const J1X = sA6 + 3 * (4 * NPW - xs) * perRun + 3 * NPW * perRun + 100 * perRun;
const J2 = sO + 3 * NPW * perRun * ledgerFactor, J3 = sA + bA + lA + eng, J4 = sB + lB;
const sched = (() => { const free = [0, 0, 0, 0]; let end = 0; for (const d of [J1, J1X, J2, J3, J4]) { free.sort((a, b) => a - b); free[0] += d; end = Math.max(end, free[0]); } return end; })();
console.log(`\n4. THE BUDGET (grade C): S366's 60-point solve about ${sA6} s under the reference with its build (the S366 step's ${solve30} s at 30 points, ${build30} s of it the build) and ${sO} s under the order reference (${solve30o} s at 30), ${f4(perRun)} s a run (7u's S366: ${n7u} runs in ${run7u} s), the ledger ${f2(ledgerFactor)} times a plain run, the engine leg ${eng} s (twice AOR's tail check, ${tl} s): J1 about ${f2(J1 / 3600)} h (the ledger on ${3 * NPW} paths, ${3 * (xs - NPW)} plain runs${own30 === 12 ? ', P the ledger\'s runs' : `, P on ${3 * NPW}`}), J1X about ${f2(J1X / 3600)} h (${3 * (4 * NPW - xs)} plain runs, D on ${3 * NPW}), J2 about ${f2(J2 / 3600)} h; J3 as A6RS (solve ${sA} s, build ${f2(bA)} s, ledger ${lA} s) with the engine leg about ${f2(J3 / 3600)} h, J4 as BO (solve ${sB} s, ledger ${lB} s) about ${f2(J4 / 3600)} h; on four cores, J4 when the first job ends, the wall about ${f2(sched / 3600)} h`);
