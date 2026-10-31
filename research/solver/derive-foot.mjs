/*
 * FOOT-S366'S DERIVATION (predictions/diag-foot.md; the deep review after AX-HO, deep-review-log.md 18 Oct 01:41 UK; O177): the
 * records (AX-HO's saved J1 and J2 on S366 behind AX-HO's gate: J1's year-4 residual path by path and its spread, J2's
 * survival by world, the paths J1 moved against J2; AX-HO's logs for the budget; AX-HO's S366 step for S362's 30-point cost);
 * the power of items 1-4 through reduce-foot.mjs's own items(); the credences from the receipt's CAUSE CREDENCES for O177
 * (read from the log, not typed) through the judged stories below, as stated (section 3) and with the leading cause at the
 * record's rate (results-scorecard.txt, section 3b, the registered ones); the decision rows; the points and 80% intervals;
 * the budget.
 *   node research/solver/derive-foot.mjs > research/solver/results-derive-foot.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, NPW } from './reduce-foot.mjs';

// THE JUDGED INPUTS (committed before this script's output and before FOOT-S366's preflight; grade D throughout). Each cause
// in the 18 Oct 01:41 receipt's map for O177 (its CAUSE CREDENCES, read below) predicts J1F's world-0 year-4 residual (item 1,
// points; AX-HO's J1 read 2.1823), J1F's table less its runs by world (item 2), J1D less J1 in that residual path by path
// (item 3) and J1F's runs against J2's (item 4). FOOT: the reference's floor at no accessible money in the inflow year, the
// copy amplifying it - the fix removes the residual and J1D reads J1's; COPYAMP: a material over-read left after the foot is
// fixed (the copy rule's own); SPLIT: the split carries it (the code says not: RS scales R only where the corner's p exceeds
// the query's) - the fix leaves it and J1D reads less; LAYER: a tier layer's read at year 4 (the saved tables equal at every
// layer read) - the fix leaves it, J1D reads J1's; OTHER: anywhere.
export const JUDGED = {
  y4: {
    FOOT: { '-0.2': 0.2, 0: 0.35, 0.2: 0.3, 0.4: 0.15 },
    COPYAMP: { 0.6: 0.3, 1.0: 0.4, 1.5: 0.3 },
    SPLIT: { 1.6: 0.4, 2.1: 0.6 },
    LAYER: { 1.6: 0.4, 2.1: 0.6 },
    OTHER: { '-0.5': 0.25, 0.3: 0.25, 1.0: 0.25, 2.0: 0.25 },
  },
  // J1D less J1 in world 0's year-4 residual (points)
  d3: {
    FOOT: { '-0.1': 0.25, 0: 0.5, 0.1: 0.25 },
    COPYAMP: { '-0.1': 0.25, 0: 0.5, 0.1: 0.25 },
    SPLIT: { '-2.0': 0.5, '-1.4': 0.5 },
    LAYER: { '-0.1': 0.25, 0: 0.5, 0.1: 0.25 },
    OTHER: { '-1.0': 0.3, 0: 0.4, 0.6: 0.3 },
  },
  // the rest of J1F's world-0 table less runs beyond the year-4 residual (the other years' and the quadrature's, points),
  // and worlds 1 and 2's table less runs (J1's read 0.0433 and -0.0004)
  rest0: { '-0.4': 0.25, 0: 0.5, 0.4: 0.25 },
  rest12: { '-0.15': 0.25, 0: 0.5, 0.15: 0.25 },
  // item 4: J1F's runs less J2's (points, worlds 0 and 1) and the paths moved as a multiple of J1's against J2's (5 in world
  // 0: lost 4, saved 1), the fix moving moves near year 4 but few outcomes at S366's survival
  runs4: { '-0.1': 0.2, 0: 0.6, 0.1: 0.2 },
  churn4: { 0.5: 0.2, 1: 0.4, 3: 0.3, 8: 0.1 },
  // J1F's per-path spread of the year-4 residual as a multiple of J1's (the fix shrinks the over-read and its spread)
  spread: { 0.25: 0.3, 0.5: 0.4, 1: 0.3 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 1; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return Number(k); } return Number(Object.keys(dist).pop()); };
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const binom = (n, p) => Math.max(0, Math.min(n, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss())));
const mean = a => a.reduce((t, x) => t + x, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(a.reduce((t, x) => t + (x - m) * (x - m), 0) / (a.length - 1)); };
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };

// 1. THE RECORDS, behind AX-HO's gate
if (!/^GATE: passed/m.test(spawnSync('node', [join(HERE, 'reduce-axho.mjs'), R_('diagaxho')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '')) { console.log('AX-HO\'s files did not pass AX-HO\'s gate'); process.exit(1); }
const ld = f => JSON.parse(gunzipSync(readFileSync(join(R_('diagaxho'), f))).toString()), fJ1 = ld('S366-J1-P60S6Q5.json.gz'), fJ2 = ld('S366-J2-P60S6Q5.json.gz');
const dec = x => { const b = Buffer.from(x, 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const bits = (f, nm) => Buffer.from(f.bits[nm], 'base64'), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
const Y4J1 = dec(fJ1.per.Y40), SURV = [0, 1, 2].map(k => cnt(bits(fJ2, `OWN${k}`)) / NPW), J1S = [0, 1, 2].map(k => cnt(bits(fJ1, `OWN${k}`)) / NPW);
const CH = [0, 1].map(k => { const a = bits(fJ1, `OWN${k}`), b = bits(fJ2, `OWN${k}`); let lost = 0, saved = 0; for (let i = 0; i < a.length; i++) { if (b[i] && !a[i]) lost++; else if (a[i] && !b[i]) saved++; } return lost + saved; });
console.log('FOOT-S366\'S DERIVATION (predictions/diag-foot.md)\n\n1. THE RECORDS (AX-HO\'s saved S366 jobs behind AX-HO\'s gate)');
console.log(`  AX-HO's J1 on S366: world 0's year-4 residual ${f4(mean(Y4J1))} (per-path sd ${f4(sd(Y4J1))}); its own opening alive on ${J1S.map(x => f4(100 * x)).join(', ')} of 4,000 by world; J2 alive on ${SURV.map(x => f4(100 * x)).join(', ')}; J1 against J2 moved ${CH.join(' and ')} paths in worlds 0 and 1`);

// a synthetic read at a story's values: J1F's year-4 residual per path at the story's mean and a share of J1's spread; J1D's
// as J1's moved by the story's difference; J1F's table its survival plus the gap and its runs drawn about that survival; J1F's
// runs J2's bits moved
const N = NPW, moved = (base, churn0, d) => { const b = Uint8Array.from(base), n = b.length, net = d * n / 100, dead = n - b.reduce((t, x) => t + x, 0), churn = Math.min(churn0, 2 * dead + Math.abs(net)); let lost = pois(Math.max(0, (churn - net) / 2)), saved = pois(Math.max(0, (churn + net) / 2)); for (let g = 0; g < 50 * n && (lost > 0 || saved > 0); g++) { const j = Math.floor(rnd() * n); if (b[j] && lost > 0) { b[j] = 0; lost--; } else if (!b[j] && saved > 0) { b[j] = 1; saved--; } } return b; };
const J2b = [0, 1].map(k => bits(fJ2, `OWN${k}`)), sJ1 = sd(Y4J1);
function setOf({ y4, d3, gap, spread = 0.5, d4 = [0, 0], c4 = 1 }) {
  const y1f = Array.from({ length: N }, () => y4 + spread * sJ1 * gauss()), y1d = Y4J1.map(v => v + d3 + 0.05 * gauss());
  const Y = (arm, k, t) => (arm === 'J1F' ? y1f : arm === 'J1D' ? y1d : Y4J1);
  const runs = [0, 1, 2].map(k => binom(N, SURV[k])), tab = [0, 1, 2].map(k => Math.min(100, 100 * SURV[k] + gap[k]));
  const S1 = [0, 1].map(k => moved(J2b[k], c4 * CH[k], d4[k]));
  return [Y, k => tab[k], k => ({ c: runs[k], N }), (arm, k) => (arm === 'J1F' ? S1[k] : J2b[k])];
}
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(y => `${y} ${f2(c[y] / tot(c))}`).join(' ');

// 2. THE POWER through items()
const DR = 40, base = { y4: 0, d3: 0, gap: [0, 0, 0] };
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-foot.mjs's items(); J1F's runs at J2's survival, ${N} paths a world)`);
for (const s of [0.25, 1]) for (const v of [-1.2, -0.5, 0, 0.3, 0.45, 0.6, 1.2, 2.1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(...setOf({ ...base, y4: v, spread: s }))['1'].outcome]++; console.log(`  spread x${s} item 1, J1F's year-4 residual ${v}: ${row(c)}`); }
for (const g of [-3.5, -1.2, 0, 1.2, 2.1, 3.5]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(...setOf({ ...base, gap: [g, 0, 0] }))['2'].outcome]++; console.log(`  item 2, world 0's table less runs ${g}: ${row(c)}`); }
for (const v of [-2.0, -1.0, -0.45, 0, 0.45, 1.0]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(...setOf({ ...base, d3: v }))['3'].outcome]++; console.log(`  item 3, J1D less J1 ${v}: ${row(c)}`); }
for (const c4 of [1, 3, 8]) for (const d of [-0.3, 0, 0.1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(...setOf({ ...base, d4: [d, d], c4 }))['4'].outcome]++; console.log(`  churn x${c4} item 4, J1F's runs ${d} points in worlds 0 and 1: ${row(c)}`); }

// 3. THE CREDENCES: the receipt's credences for O177's cause through the judged stories, each draw read through items()
const logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 18 Oct 01:41 UK \|/.test(l)) || '';
const cc = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1].matchAll(/O177-([A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const sum = Object.values(cc).reduce((a, b) => a + b, 0);
if (Object.keys(cc).length !== 5 || Math.abs(sum - 1) > 0.02 || Object.keys(cc).some(c => !JUDGED.y4[c]) || cc.FOOT !== Math.max(...Object.values(cc))) { console.log(`the receipt's CAUSE CREDENCES for O177 did not read, or FOOT does not lead (${JSON.stringify(cc)})`); process.exit(1); }
const ND = 2000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
function credences(cmap) {
  const t2 = Object.values(cmap).reduce((a, b) => a + b, 0), pickC = () => { let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
  const I = { 1: cnt3(), 2: cnt3(), 3: cnt3(), 4: cnt3() }, R = { R1: 0, R2: 0, R3: 0, R4: 0, else: 0 }, pt = { 1: [], 2: [], 3: [], 4: [] };
  for (let q = 0; q < ND; q++) {
    const c = pickC(), y4 = pick(JUDGED.y4[c]), d4 = pick(JUDGED.runs4);
    const story = { y4, d3: pick(JUDGED.d3[c]), gap: [y4 + pick(JUDGED.rest0), pick(JUDGED.rest12), pick(JUDGED.rest12)], spread: pick(JUDGED.spread), d4: [d4, d4], c4: pick(JUDGED.churn4) };
    const it = items(...setOf(story)), o = i => it[i].outcome;
    for (const i of ['1', '2', '3', '4']) I[i][o(i)]++;
    pt[1].push(it['1'].cell.m); pt[2].push(it['2'].cells[0].m); pt[3].push(it['3'].cell.m); pt[4].push(it['4'].cells[0].d);
    // R2 first: harm; R1 the fix removes the over-read with the split no part; R3 the fix leaves it (COPYAMP, SPLIT or LAYER's
    // side); R4 the split a part (item 3 FALSIFIED) with the fix acting
    if (o('4') === 'FALSIFIED') R.R2++;
    else if (o('1') === 'HELD' && o('2') === 'HELD' && o('3') === 'HELD' && o('4') === 'HELD') R.R1++;
    else if (o('1') === 'FALSIFIED' && it['1'].side === 'over') R.R3++;
    else if (o('3') === 'FALSIFIED') R.R4++;
    else R.else++;
  }
  return { I, R, pt };
}
const WHAT = { 1: 'J1F\'s world-0 year-4 residual, points', 2: 'J1F\'s table less its runs in world 0, points', 3: 'J1D less J1 in world 0\'s year-4 residual, points', 4: 'J1F\'s runs less J2\'s in world 0, points' };
const show = ({ I, R, pt }, tag) => {
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  console.log(`  escalation trigger 3 (a run over 2 hours with the 'else' row at 0.6 or more): else ${f2(R.else / ND)}`);
  for (const i of ['1', '2', '3', '4']) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))}`);
  for (const i of ['1', '2', '3', '4']) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`);
};
console.log(`\n3. THE CREDENCES AS THE RECEIPT STATES THEM (the receipt of 18 Oct 01:41 UK: ${Object.entries(cc).map(([k, v]) => `O177-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(cc), '  as stated, ');
const sc = /an item leaning on a deep review's cause or story ([0-9.]+) \((\d+) of (\d+)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!sc) { console.log('the scorecard\'s lead rate did not read (results-scorecard.txt)'); process.exit(1); }
const lead = Number(sc[1]), rest = sum - cc.FOOT, cr = Object.fromEntries(Object.entries(cc).map(([k, v]) => [k, k === 'FOOT' ? lead * sum : v * (1 - lead) * sum / rest]));
console.log(`\n3b. THE CREDENCES WITH THE LEADING CAUSE AT THE RECORD'S RATE (results-scorecard.txt: ${sc[1]}, ${sc[2]} of ${sc[3]}; O177-FOOT at ${lead}, the rest scaled: ${Object.entries(cr).map(([k, v]) => `${k} ${f2(v)}`).join(', ')}; ${ND} draws through items())`);
show(credences(cr), 'CREDENCE ');

// 4. THE BUDGET: AX-HO's logs (J1's and J2's 60-point solves and ledgers on S366) and its S366 step (S366 at 30 points, for
// S362's two 30-point jobs: their ledgers on 12,000 paths at J1's 60-point rate a path)
const ax = readdirSync(R_('diagaxho')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_('diagaxho'), f), 'utf8')), j1 = ax.find(t => /job J1\/P60S6Q5 /.test(t));
const s30 = readFileSync(join(HERE, 'results-axho-preflight-s366.txt'), 'utf8');
const sJ = num(/solve CAND J1\/P60S6Q5: table \S+ secs (\d+)/, j1), lJ = num(/ownTook .* secs (\d+)/, j1), s3 = num(/S366: solve CAND J1\/P60S6Q5: table \S+ secs (\d+)/, s30);
if (![sJ, lJ, s3].every(Number.isFinite)) { console.log('the budget\'s inputs did not read'); process.exit(1); }
const J60 = sJ + lJ, K30 = s3 + lJ;
console.log(`\n4. THE BUDGET (grade C): AX-HO's J1 on S366 at 60 points, solve ${sJ} s and its ledger on 12,000 paths ${lJ} s - J1F and J1D about ${f2(J60 / 3600)} h each (the fix's A = 0 nodes a small part of the build); S366's 30-point solve ${s3} s (AX-HO's S366 step) with the same ledger for S362's K1 and K1F - about ${f2(K30 / 3600)} h each; on four cores the wall about ${f2(Math.max(J60, K30) / 3600)} h`);
