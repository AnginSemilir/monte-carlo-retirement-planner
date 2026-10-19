/*
 * COPY-B'S DERIVATION (COPY-W's stage B; predictions/diag-copyb.md; the deep review after COPY-W, deep-review-log.md 19 Oct
 * 13:32 UK, adopted in PLAN.md's 19 Oct 13:38 row): the records (S370's C, CX and CW behind COPY-W's gate, which runs COPY-X's:
 * their per-path spreads and flips by world, the scale every household borrows, and COPY-W's CW's after-access part GA by path,
 * item 6's control); the judged stories below for the four households with no record under C (grade D throughout, informed by
 * 7u's residual by year, results/diag7u, seed 7013, the mixture only); the power of items 1 to 6 through reduce-copyb.mjs's own
 * items(); the credences from the judged cause sets and the receipt's GA0 and CXINT CAUSE CREDENCES (read from the log), as
 * stated (section 3), at the lead rate's lower bound (section 3b, the registered ones) and at the settled-since rate (section
 * 3c), both read from results-scorecard.txt's LEAD RATE BY POPULATION; the decision rows; the points and 80% intervals; the
 * budget, from the records' timings. The households' bridge years are the preflight's (results-copyb-preflight.txt), not read here.
 *   node research/solver/derive-copyb.mjs [--records] > research/solver/results-derive-copyb.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, rowOf, FACT, WH, EXPECT, NPW } from './reduce-copyb.mjs';

// THE JUDGED INPUTS (committed before this script's output and before any COPY-B run; grade D throughout).
export const JUDGED = {
  // C's grid residual by part, household x world (0, 1, 2), the mean in points: the bridge part GB and the after-access part GA
  // (7u's residual by year, the mixture: S130 a bridge-year read about -0.3 and an after-access over-read about +1.9, S128 about
  // -0.2 and +3.1; S126 within 0.02 of its runs; S362 no record under the plan reference)
  gb: {
    S130: [{ '-1': 0.3, 0: 0.4, 1.5: 0.3 }, { '-0.5': 0.5, 0: 0.5 }, { 0: 1 }],
    S126: [{ 0: 0.6, 0.5: 0.4 }, { 0: 1 }, { 0: 1 }],
    S362: [{ '-3': 0.25, 0: 0.25, 3: 0.25, 8: 0.25 }, { '-2': 0.3, 0: 0.4, 1.5: 0.3 }, { '-1': 0.5, 0: 0.5 }],
    S128: [{ '-0.5': 0.5, 0.5: 0.5 }, { '-0.2': 1 }, { 0: 1 }],
  },
  ga: {
    S130: [{ 2: 0.3, 4: 0.4, 6: 0.3 }, { 1: 0.4, 1.6: 0.6 }, { 0.1: 1 }],
    S126: [{ 0.2: 0.5, 0.6: 0.5 }, { 0.05: 1 }, { 0: 1 }],
    S362: [{ 0: 0.5, 1: 0.5 }, { 0.5: 0.5, 1.5: 0.5 }, { 0.5: 1 }],
    S128: [{ 3: 0.3, 6: 0.4, 9: 0.3 }, { 2: 0.5, 3: 0.5 }, { 0.3: 1 }],
  },
  // survival under C, household x world (the runs' share)
  surv: { S130: [0.6, 0.92, 0.99], S126: [0.97, 0.999, 1], S362: [0.3, 0.5, 0.68], S128: [0.4, 0.75, 0.95] },
  // BC, the copy rule's breadth: the share of C's GB that CX removes; GEN: the flat copy carries the bridge part wherever it
  // shows (S370's world 0: 0.79, grade B); LOCAL: S370's own, elsewhere another error
  bc: { GEN: { 0.6: 0.3, 0.8: 0.4, 1: 0.3 }, LOCAL: { 0: 0.5, 0.2: 0.5 } },
  bcCred: { GEN: 0.6, LOCAL: 0.4 },
  // BW, the wealth fix's breadth: the share of C's GA that 60 points removes; AXIS: as S370's world 1 (0.96); MIX: as S370's
  // world 0 (0.47); AFTER: apart from the axis (family AA)
  bw: { AXIS: { 0.75: 0.4, 0.96: 0.6 }, MIX: { 0.4: 0.5, 0.55: 0.5 }, AFTER: { 0: 0.5, 0.2: 0.5 } },
  bwCred: { AXIS: 0.4, MIX: 0.35, AFTER: 0.25 },
  // 60 points' own move on the bridge part (S370's world 1: GB -0.07 to 2.93, O183), points, worlds 0 and 1
  wgb: { '-0.5': 0.25, 0: 0.5, 0.5: 0.25 },
  // GA0 (item 6, the receipt's question): the share of CW at 60's world-0 GA on S370 that 120 points removes; AXIS: the
  // remainder is the axis, read at first to second order; AFTER: apart from the axis
  ga0: { AXIS: { 0.5: 0.5, 0.75: 0.5 }, AFTER: { 0: 0.5, 0.2: 0.5 } },
  // CXINT (item 2, the receipt's question): the interaction as a share of the copy rule's own move on the table; NODES: the
  // extrapolation amplifying the axis's node errors (S370's world 0: -0.7611 against the copy rule's -6.47, about 0.12);
  // READ, POLICY and OTHER: nil
  ci: { NODES: { 0.06: 0.3, 0.12: 0.4, 0.2: 0.3 }, READ: { 0: 1 }, POLICY: { 0: 1 }, OTHER: { 0: 1 } },
  // each fix's discordant paths against C, as a multiple of S370's (CX's for CX, CW's for CW) in the world, scaled by the
  // household's 4p(1 - p) against S370's (DISCORD; the first output scaled by its square root and took S370's lost and saved
  // apart as their expectations, so S370's world-2 record under 60 points, 6 lost and 1 saved on 7 paths, read as a sure harm
  // wherever more paths can flip: fixed after the first output, declared)
  flips: { 0.5: 0.3, 1: 0.4, 1.5: 0.3 },
  // each fix's net share of its discordant paths by world, (saved - lost) / (saved + lost): the copy rule nil (S370's 10 and 8,
  // 5 and 5, 1 and 1); 60 points its world-0 gain after access (S370's 75 against 36, 0.35, grade B), world 1 nil or S370's
  // (34 against 30), world 2 nil or paid there (O179's pattern: S370's 1 against 6 on 7 paths, the deep review after COPY-W's
  // reading (4), grade C)
  net: { CX: [{ 0: 1 }, { 0: 1 }, { 0: 1 }], CW: [{ 0.35: 1 }, { 0: 0.5, 0.06: 0.5 }, { 0: 0.65, '-0.7': 0.35 }] },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 11; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const pickN = dist => Number(pick(dist));
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
const dec = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; }, sdOf = a => { const m = mean(a); let v = 0; for (const x of a) v += (x - m) ** 2; return Math.sqrt(v / (a.length - 1)); };
const K = [0, 1, 2];

// 1. THE RECORDS: S370's C (COPY-X's), CX (COPY-X's) and CW (COPY-W's), behind COPY-W's gate (which runs COPY-X's)
const gw = spawnSync('node', [join(HERE, 'reduce-copyw.mjs'), R_('diagcopyw')], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!/^GATE: passed/m.test(gw)) { console.log('COPY-W\'s files did not pass COPY-W\'s gate'); process.exit(1); }
const F = { C: ld(join(R_('diagcopyx'), 'S370-C-P30S6Q5.json.gz')), CX: ld(join(R_('diagcopyx'), 'S370-CX-P30S6Q5.json.gz')), CW: ld(join(R_('diagcopyw'), 'S370-CW-P60S6Q5.json.gz')) };
const N = F.C.NPW;
if (N !== NPW || F.CX.NPW !== N || F.CW.NPW !== N || F.C.seed !== F.CW.seed) { console.log('the records did not read'); process.exit(1); }
const P100 = (a, x, k) => Float64Array.from(dec(F[a].per[`${x}${k}`]), v => 100 * v), BITS = (a, k) => dec8(F[a].bits[`OWN${k}`]);
const SD = K.map(k => ({ gb: sdOf(P100('C', 'GB', k)), ga: sdOf(P100('C', 'GA', k)), dgb: sdOf(Float64Array.from(P100('CX', 'GB', k), (v, i) => v - P100('C', 'GB', k)[i])), dga: sdOf(Float64Array.from(P100('CW', 'GA', k), (v, i) => v - P100('C', 'GA', k)[i])) }));
const flipsOf = (a, k) => { const c = BITS('C', k), x = BITS(a, k); let lost = 0, saved = 0; for (let i = 0; i < N; i++) { if (c[i] && !x[i]) lost++; else if (!c[i] && x[i]) saved++; } return { lost, saved }; };
const FL = { CX: K.map(k => flipsOf('CX', k)), CW: K.map(k => flipsOf('CW', k)) }, P370 = K.map(k => cnt(BITS('C', k)) / N);
const GA60 = K.map(k => P100('CW', 'GA', k)), SD60 = K.map(k => sdOf(GA60[k]));
console.log('COPY-B\'S DERIVATION, COPY-W\'S STAGE B (predictions/diag-copyb.md)\n\n1. THE RECORDS');
console.log(`  S370, seed ${F.C.seed}, ${N} paths a world, behind COPY-W's gate (and COPY-X's): C and CX at 30 points, CW at 60`);
for (const k of K) console.log(`  world ${k}: C's survival ${f4(100 * P370[k])}; the per-path sd of C's GB ${f4(SD[k].gb)} and GA ${f4(SD[k].ga)}, of CX's change on GB ${f4(SD[k].dgb)}, of CW's change on GA ${f4(SD[k].dga)}; CX against C ${FL.CX[k].lost} lost, ${FL.CX[k].saved} saved; CW against C ${FL.CW[k].lost} lost, ${FL.CW[k].saved} saved; CW's GA ${f4(mean(GA60[k]))} (sd ${f4(SD60[k])})`);
console.log(`  item 6 reads S370's worlds where CW at 60's GA is half a point or more in size: ${K.filter(k => Math.abs(mean(GA60[k])) >= 0.5).join(', ') || 'none'}`);
if (process.argv.includes('--records')) process.exit(0);

// a synthetic read at a story's values in reduce-copyb.mjs items()'s shape
const scaleOf = (h, k) => { const p = JUDGED.surv[h][k], q = P370[k]; return Math.sqrt(Math.max(1e-4, p * (1 - p)) / Math.max(1e-4, q * (1 - q))); };
const pickIdx = (bits, want, m) => { const ix = []; for (let i = 0; i < N; i++) if (bits[i] === want) ix.push(i); m = Math.min(m, ix.length); for (let j = 0; j < m; j++) { const r = j + Math.floor(rnd() * (ix.length - j)); [ix[j], ix[r]] = [ix[r], ix[j]]; } return ix.slice(0, m); };
function houseSet(h, s) {
  const fact = FACT.includes(h), arms = fact ? ['C', 'CX', 'CW', 'CXW'] : ['C', 'CW'];
  const gb = Object.fromEntries(arms.map(a => [a, []])), ga = Object.fromEntries(arms.map(a => [a, []])), bits = Object.fromEntries(arms.map(a => [a, []])), ws = Object.fromEntries(arms.map(a => [a, []])), tab = Object.fromEntries(arms.map(a => [a, []]));
  for (const k of K) {
    const sc = scaleOf(h, k), mb = s.gb[h][k], ma = s.ga[h][k], dW = k < 2 ? s.wgb[h][k] : 0;
    const gC = Float64Array.from({ length: N }, () => mb + sc * SD[k].gb * gauss()), aC = Float64Array.from({ length: N }, () => ma + sc * SD[k].ga * gauss());
    const eX = Float64Array.from({ length: N }, () => sc * SD[k].dgb * gauss()), eW = Float64Array.from({ length: N }, () => sc * SD[k].dga * gauss());
    const gX = Float64Array.from(gC, (v, i) => (1 - s.rc) * v + eX[i]), aW = Float64Array.from(aC, (v, i) => (1 - s.rw) * v + eW[i]);
    const inter = s.ci * (-s.rc * mb);
    gb.C[k] = gC; ga.C[k] = aC; gb.CW[k] = Float64Array.from(gC, v => v + dW); ga.CW[k] = aW;
    if (fact) { gb.CX[k] = gX; ga.CX[k] = aC; gb.CXW[k] = Float64Array.from(gX, v => v + dW + inter); ga.CXW[k] = aW; }
    const ok = Math.round(JUDGED.surv[h][k] * N), bC = Uint8Array.from({ length: N }, (_, i) => (i < ok ? 1 : 0));
    const rf = Math.max(1e-4, JUDGED.surv[h][k] * (1 - JUDGED.surv[h][k])) / Math.max(1e-4, P370[k] * (1 - P370[k]));
    const flip = a => { const D = s.flips * (FL[a][k].lost + FL[a][k].saved) * rf, e = s.net[a][k]; return { lost: pickIdx(bC, 1, pois(D * (1 - e) / 2)), saved: pickIdx(bC, 0, pois(D * (1 + e) / 2)) }; };
    const fX = flip('CX'), fW = flip('CW'), apply = fs => { const b = Uint8Array.from(bC); for (const f of fs) { for (const j of f.lost) b[j] = 0; for (const j of f.saved) b[j] = 1; } return b; };
    bits.C[k] = bC; bits.CW[k] = apply([fW]); if (fact) { bits.CX[k] = apply([fX]); bits.CXW[k] = apply([fX, fW]); }
    const base = Float64Array.from({ length: N }, () => 0.3 * gauss());
    for (const a of arms) { ws[a][k] = Float64Array.from(bits[a][k], (v, i) => 100 * v + base[i]); tab[a][k] = 100 * cnt(bits[a][k]) / N + mean(gb[a][k]) + mean(ga[a][k]); }
  }
  return { gb, ga, tab, bits, ws };
}
function setOf(s) {
  const house = Object.fromEntries(WH.map(h => [h, houseSet(h, s)]));
  return { house, s370: { ga60: GA60, ga120: K.map(k => Float64Array.from(GA60[k], v => (1 - s.r6) * v + 0.5 * SD60[k] * gauss())) } };
}
const drawOf = (cb, cw, c6, cn) => {
  const g = {}, a = {}, w = {};
  for (const h of WH) { g[h] = K.map(k => pickN(JUDGED.gb[h][k])); a[h] = K.map(k => pickN(JUDGED.ga[h][k])); w[h] = K.map(() => pickN(JUDGED.wgb)); }
  return { gb: g, ga: a, wgb: w, rc: pickN(JUDGED.bc[cb]), rw: pickN(JUDGED.bw[cw]), r6: pickN(JUDGED.ga0[c6]), ci: pickN(JUDGED.ci[cn]), flips: pickN(JUDGED.flips), net: { CX: K.map(k => pickN(JUDGED.net.CX[k])), CW: K.map(k => pickN(JUDGED.net.CW[k])) } };
};
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f2(c[x] / tot(c))}`).join(' ');
const IT = ['1', '2', '3', '4', '5', '6'];

// 2. THE POWER through items(): one input moved, the rest drawn from the JUDGED stories at each cause set's lead
const DR = 40;
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-copyb.mjs's items(); every other input drawn from the JUDGED stories, ${N} paths a world)`);
for (const r of [0, 0.2, 0.4, 0.6, 0.8, 1]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...drawOf('GEN', 'AXIS', 'AXIS', 'NODES'), rc: r }))['1'].outcome]++; console.log(`  item 1, CX removes ${r} of C's GB: ${row(c)}`); }
for (const r of [0, 0.2, 0.4, 0.55, 0.75, 0.96]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...drawOf('GEN', 'AXIS', 'AXIS', 'NODES'), rw: r }))['3'].outcome]++; console.log(`  item 3, 60 points removes ${r} of C's GA: ${row(c)}`); }
for (const ci of [0, 0.06, 0.12, 0.2]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...drawOf('GEN', 'AXIS', 'AXIS', 'NODES'), ci }))['2'].outcome]++; console.log(`  item 2, the interaction ${ci} of the copy rule's move on the table: ${row(c)}`); }
for (const r of [0, 0.2, 0.375, 0.5, 0.75]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...drawOf('GEN', 'AXIS', 'AXIS', 'NODES'), r6: r }))['6'].outcome]++; console.log(`  item 6, 120 points removes ${r} of S370's world-0 GA at 60: ${row(c)}`); }
for (const fl of [0.5, 1, 1.5]) for (const e2 of [0, -0.7]) { const c = cnt3(); for (let q = 0; q < DR; q++) { const d = drawOf('GEN', 'AXIS', 'AXIS', 'NODES'); c[items(setOf({ ...d, flips: fl, net: { CX: [0, 0, 0], CW: [0.35, 0, e2] } }))['5'].outcome]++; } console.log(`  item 5, each fix's discordance ${fl} times S370's, 60 points' world-2 net share ${e2}: ${row(c)}`); }
{ const c = cnt3(); for (let q = 0; q < DR; q++) c[items(setOf({ ...drawOf('GEN', 'AXIS', 'AXIS', 'NODES'), rc: 1, rw: 0.96 }))['4'].outcome]++; console.log(`  item 4, at the strongest stories (CX removes all of GB, 60 points 0.96 of GA): ${row(c)}`); }

// 3. THE CREDENCES
const RECEIPT = '19 Oct 13:32 UK', logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => l.startsWith(`- ${RECEIPT} |`)) || '';
const credLine = (/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1];
const setFrom = pre => Object.fromEntries([...credLine.matchAll(new RegExp(`${pre}-([A-Z]+)=([0-9.]+)`, 'g'))].map(m => [m[1], Number(m[2])]));
const c6 = setFrom('GA0'), cn = setFrom('CXINT'), sumOf = c => Object.values(c).reduce((a, x) => a + x, 0);
if (Object.keys(c6).length !== 2 || Object.keys(cn).length !== 4 || Math.abs(sumOf(c6) - 1) > 0.02 || Math.abs(sumOf(cn) - 1) > 0.02 || Object.keys(c6).some(k => !JUDGED.ga0[k]) || Object.keys(cn).some(k => !JUDGED.ci[k])) { console.log(`the receipt's CAUSE CREDENCES did not read (${credLine.slice(0, 200)})`); process.exit(1); }
const LEAD = { bc: 'GEN', bw: 'AXIS', ga0: 'AFTER', ci: 'NODES' };
const ND = 1000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
const POINT = { 1: it => (it['1'].per.length ? Math.min(...it['1'].per.map(x => x.r.R)) : NaN), 2: it => Math.max(...it['2'].per.map(x => Math.abs(x.d))), 3: it => (it['3'].per.length ? Math.min(...it['3'].per.map(x => x.r.R)) : NaN), 4: it => Math.max(...it['4'].per.map(x => Math.max(Math.abs(x.gb.d), Math.abs(x.ga.d)))), 5: it => Math.min(...it['5'].legs.flatMap(l => l.per.flatMap(x => x.per.map(y => y.ex.d)))), 6: it => (it['6'].per.length ? it['6'].per[0].r.R : NaN) };
const WHAT = { 1: 'the least share of C\'s GB CX removes across the cells read', 2: 'the largest interaction in size across the cells, points', 3: 'the least share of C\'s GA 60 points removes across the cells read', 4: 'the largest part in size across the better cells, points', 5: 'the least survival change of any leg and world, points', 6: 'the share of S370\'s world-0 GA at 60 that 120 points removes' };
function credences(mb, mw, m6, mn) {
  const I = Object.fromEntries(IT.map(i => [i, cnt3()])), R = { R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, else: 0 }, pt = Object.fromEntries(IT.map(i => [i, []]));
  let nothing1 = 0, nothing3 = 0;
  for (let q = 0; q < ND; q++) {
    const it = items(setOf(drawOf(pickC(mb), pickC(mw), pickC(m6), pickC(mn))));
    for (const i of IT) { I[i][it[i].outcome]++; const v = POINT[i](it); if (Number.isFinite(v)) pt[i].push(v); }
    if (it['1'].nothing) nothing1++; if (it['3'].nothing) nothing3++;
    R[rowOf(it)]++;
  }
  return { I, R, pt, nothing1, nothing3 };
}
const show = ({ I, R, pt, nothing1, nothing3 }, tag) => {
  for (const i of IT) console.log(`  item ${i}: ${row(I[i])}${i === '1' ? ` (nothing to remove ${f2(nothing1 / ND)})` : i === '3' ? ` (nothing to remove ${f2(nothing3 / ND)})` : ''}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  for (const i of IT) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))} (${pt[i].length} of ${ND} draws read)`);
  if (tag) { for (const i of IT) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`); console.log(`${tag}else ${f2(R.else / ND)}`); }
};
console.log(`\n3. THE CREDENCES AS STATED (the judged BC ${Object.entries(JUDGED.bcCred).map(([k, v]) => `${k}=${v}`).join(', ')} and BW ${Object.entries(JUDGED.bwCred).map(([k, v]) => `${k}=${v}`).join(', ')}; the receipt of ${RECEIPT}: ${Object.entries(c6).map(([k, v]) => `GA0-${k}=${v}`).join('; ')}; ${Object.entries(cn).map(([k, v]) => `CXINT-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(JUDGED.bcCred, JUDGED.bwCred, c6, cn), '');
const lp = /LEAD RATE BY POPULATION: .*?settled since (\d+) of (\d+) \(Laplace ([0-9.]+)\);.*? counted not held, (\d+) of (\d+) \(Laplace ([0-9.]+)\)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!lp) { console.log('the scorecard\'s LEAD RATE BY POPULATION did not read (results-scorecard.txt)'); process.exit(1); }
const atRate = (c, top, rate) => { const rest = sumOf(c) - c[top]; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === top ? rate : v * (1 - rate) / rest])); };
const lower = Number(lp[6]), since = Number(lp[3]);
console.log(`\n3b. THE CREDENCES WITH EACH QUESTION'S LEADING CAUSE AT THE LEAD RATE'S LOWER BOUND (results-scorecard.txt: ${lp[4]} of ${lp[5]}, Laplace ${lp[6]}; the registered ones; ${ND} draws through items())`);
show(credences(atRate(JUDGED.bcCred, LEAD.bc, lower), atRate(JUDGED.bwCred, LEAD.bw, lower), atRate(c6, LEAD.ga0, lower), atRate(cn, LEAD.ci, lower)), 'CREDENCE ');
console.log(`\n3c. THE SAME AT THE SETTLED-SINCE RATE (results-scorecard.txt: ${lp[1]} of ${lp[2]}, Laplace ${lp[3]}; printed beside)`);
show(credences(atRate(JUDGED.bcCred, LEAD.bc, since), atRate(JUDGED.bwCred, LEAD.bw, since), atRate(c6, LEAD.ga0, since), atRate(cn, LEAD.ci, since)), '');

// 4. THE BUDGET (grade C: the records' timings, each household's solve and ledger seconds under a four-job load; a household
// with no record of its own at 60 or 120 points takes its 30-point solve times the ratio S370's records show)
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const logIn = (d, re) => { try { return readdirSync(R_(d)).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_(d), f), 'utf8')).find(t => re.test(t)) || ''; } catch { return ''; } };
const tC = logIn('diagcopyx', /^S370\s+case \| job C\/P30S6Q5/m), tW = logIn('diagcopyw', /^S370\s+case \| job CW\/P60S6Q5/m), tK = logIn('diaghodep', /^S362\s+case \| job K1F\/P30S6Q5/m);
const s30 = num(/solve CAND C\/P30S6Q5: table \S+ secs (\d+)/, tC), l30 = num(/checks C\/P30S6Q5: ownTook .* secs (\d+)/, tC), s60 = num(/solve CAND CW\/P60S6Q5: table \S+ secs (\d+)/, tW), l60 = num(/checks CW\/P60S6Q5: ownTook .* secs (\d+)/, tW);
const s362 = num(/solve CAND K1F\/P30S6Q5: table \S+ secs (\d+)/, tK), l362 = num(/checks K1F\/P30S6Q5: ownTook .* secs (\d+)/, tK);
const t7u = h => { const t = logIn('diag7u', new RegExp(`^${h}\\s+case \\| unit CAND\\/CANDIDATE`, 'm')); const m = new RegExp(`^${h}\\s+case \\| unit CAND\\/CANDIDATE[\\s\\S]*?solve CAND\\/CANDIDATE\\/W0\\.02: table \\S+ secs (\\d+)`, 'm').exec(t); return m ? Number(m[1]) : NaN; };
const s7u = { S130: t7u('S130'), S126: t7u('S126'), S128: t7u('S128'), S370: t7u('S370') };
if (![s30, l30, s60, l60, s362, l362, ...Object.values(s7u)].every(Number.isFinite)) { console.log(`the budget's inputs did not read (${[s30, l30, s60, l60, s362, l362, ...Object.values(s7u)].join(', ')})`); process.exit(1); }
const ratio60 = s60 / s30, solve30 = h => (h === 'S362' ? s362 : h === 'S370' ? s30 : s30 * s7u[h] / s7u.S370), ledger = h => (h === 'S362' ? l362 : (l30 + l60) / 2);
const jobSecs = ([h, , pts]) => solve30(h) * (pts === 30 ? 1 : pts === 60 ? ratio60 : 2 * ratio60) + ledger(h);
const secs = EXPECT.map(jobSecs), cores = [0, 0, 0, 0];
for (const s of secs) { const c = cores.indexOf(Math.min(...cores)); cores[c] += s; }
console.log(`\n4. THE BUDGET (grade C: S370's C solve ${s30} s and ledger ${l30} s, CW at 60 ${s60} s and ${l60} s (the ratio ${f2(ratio60)}); S362's K1F (HO-DEP) ${s362} s and ${l362} s; 7u's candidate solves S130 ${s7u.S130}, S126 ${s7u.S126}, S128 ${s7u.S128} against S370's ${s7u.S370} s; 120 points taken as twice 60's)`);
console.log(`  the jobs in the batch's order: ${EXPECT.map((j, i) => `${j[0]} ${j[1]}/${j[2]} ${f2(secs[i] / 3600)} h`).join('; ')}`);
console.log(`  ${f2(secs.reduce((a, x) => a + x, 0) / 3600)} job-hours; four at a time in that order, the wall about ${f2(Math.max(...cores) / 3600)} h`);
