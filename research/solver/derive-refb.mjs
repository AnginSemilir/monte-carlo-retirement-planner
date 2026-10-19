/*
 * REF-B'S DERIVATION (predictions/diag-refb.md; the deep review after COPY-B, deep-review-log.md 19 Oct 20:19 UK, adopted in
 * PLAN.md's 19 Oct 20:30 row): the records (the plan reference's C and CX on S362 and S130, COPY-B's, behind COPY-B's gate; on
 * S370, COPY-X's, behind COPY-X's; HO-DEP's adaptive and order references on S362 and S370 at seed 7004, behind HO-DEP's, the
 * cross-seed priors); the judged stories below for the three new arms (grade D); the power of items 1 to 5 through
 * reduce-refb.mjs's own items() and pOf(), with C and CX as the files hold them and AN, AR and ARX drawn from them path by path,
 * item 1 read on S362's years-1-2 increments with the review's own line on the net GB (item1Review) beside it on the same draws;
 * the credences from the receipt's O188 and Y12R CAUSE CREDENCES as stated (section 3), at the lead rate's lower bound
 * (section 3b, the registered ones) and at the settled-since rate (section 3c), read from results-scorecard.txt's LEAD RATE BY
 * POPULATION; the decision rows; the points and 80% intervals; the budget, from the records' timings.
 *   node research/solver/derive-refb.mjs [--records] > research/solver/results-derive-refb.txt
 * THE DESIGN MAP (DESIGN-MAP: written and committed with the JUDGED block, before this script's first output): each line, arm
 * and condition of the adopted design (the receipt's answer 5 and UNMASKING FLAGS; PLAN.md's REF-B row; the plan-auditor's
 * MINOR 4 of 19 Oct 20:41 UK) to the item that reads it, a reported line, or a declared departure:
 *   - the adaptive reference with its fix and RS (K1F's package) against the plan reference: the arm AR; items 3, 4 and 5;
 *   - "AR changes the reference and the RS split together ... a separating arm (the adaptive reference without RS)": the arm
 *     AN; items 1 and 2 read the reference by AN against C. DEPARTURE from the receipt's "AR against C" for items 1 and 2,
 *     declared: the plan row's own condition (MINOR 4), so the reference's attribution is not graded C; AR less AN (the RS
 *     split's own part) is a reported line;
 *   - crossed with the copy rule (AR, ARX against C, CX): the arm ARX; item 3 (the interaction per household and world);
 *   - on S362 and S370 at 30 points, seed 7002's first 4,000 paths a world: the audit's jobs, held by the reducer's gate;
 *   - C and CX reused from COPY-B and COPY-X behind their gates: the reducer's reuse gate (CHECKLIST item 3);
 *   - S130 AR the control, "predicted to move GB under 0.25 in every world": item 4, its line a quarter of a point;
 *   - S362's GB removed at least three quarters in every world with years 1 to 3's tail sums each within a point (O188-REF),
 *     under a quarter (NOTREF): item 1, by AN. DEPARTURE, declared after the first output (the prediction's order of events):
 *     item 1's removal reads S362's years-1-2 increments Y1 + Y2, where the receipt places the under-read, not the net GB,
 *     which nets them against year 3's over-read (-11.14 against +7.86 in world 0 under C), so a reference removing most of
 *     both read kept on GB (section 2's first output: six tenths at years 1-2 and all from year 3 on, FALSIFIED 1.00); the
 *     review's GB line is printed beside on the same draws (section 2 and each credence section), not registered;
 *   - S370's G_1 + G_2 (Y12R): item 2, by AN, in the worlds where C's Y1 + Y2 is a point or more (C's records: worlds 0 and 1);
 *   - the interaction with QC's change printed (O190's reach): item 3 and a reported line (QC's change by bridge year under
 *     each reference);
 *   - no material harm per world, AR and ARX against C: item 5, with AN against C added (its own arm's leg, CONTROL);
 *   - UNMASK-REG: S370's world-0 net bridge part is expected to rise as AR removes years 1-2's offset (C 8.15, CX 1.72, each up
 *     about 1.5 to 2.3), unmasking the copy rule's step-year remainder, not harm: the prediction's Unmasking field; GB by arm
 *     and world reported;
 *   - S362's world-0 survival read by the band of the year moves first differ: a reported line (each leg's saved and lost
 *     paths by band); "the tail sums at the first differing states in both arms": DEPARTURE, declared: the reducer reports
 *     the tail sums by arm and world, not at the first differing states (that read needs the saved states read against both
 *     arms' tables, a follow-up script; NOT CHECKED);
 *   - "five jobs, about an hour and a half's wall": seven jobs (AN added on both households), the budget below (section 4).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, item1Review, rowOf, pOf, POINT, EXPECT, NPW } from './reduce-refb.mjs';

// THE JUDGED INPUTS (committed before this script's output and before any REF-B run; grade D throughout).
export const JUDGED = {
  // O188 (item 1): AN's removal of C's residual on S362 by bridge year, r12 at years 1 and 2 and r3 at year 3 on (the year
  // before the inflow and after), per cause, and the level the reference leaves (d12, d3 below). REF from K1F's seed-7004 record
  // (Y1 + Y2 0.18, -0.03, -0.14 by world against C's -11.14, -9.60, -6.39: removals 1.02, 1.00, 0.98; Y3 0.22 against 8.49 in
  // world 0), shaded for the seed and the RS split K1F carries; PART a second carrier at years 1 and 2 the reference does not
  // reach (the top cell's R near the cliff, or year 2's increment not echo), the inflow bound at year 3 the plan reference's own
  // (PR27) and so mostly removed; NOTREF, COPY and CLAMP nil or little at years 1-2; OTHER part of both
  s362: {
    REF: { r12: { 0.95: 0.25, 1: 0.5, 1.05: 0.25 }, r3: { 0.95: 0.25, 1: 0.5, 1.05: 0.25 } },
    PART: { r12: { 0.4: 0.3, 0.55: 0.4, 0.7: 0.3 }, r3: { 0.6: 0.5, 1: 0.5 } },
    NOTREF: { r12: { 0: 0.5, 0.15: 0.5 }, r3: { 0: 0.5, 0.5: 0.5 } },
    COPY: { r12: { 0: 0.5, 0.15: 0.5 }, r3: { 0: 0.5, 0.5: 0.5 } },
    CLAMP: { r12: { 0: 0.5, 0.15: 0.5 }, r3: { 0: 0.5, 0.5: 0.5 } },
    OTHER: { r12: { 0.2: 0.5, 0.4: 0.5 }, r3: { 0.3: 0.5, 0.7: 0.5 } },
  },
  // a world's own removal about the draw's (K1F's removals at years 1-2 by world 1.02, 1.00 and 0.98)
  wj: { '-0.02': 0.25, 0: 0.5, 0.02: 0.25 },
  // the level the adaptive reference leaves, points, added at years 1-2 (d12) and from year 3 on (d3): K1F's read error from
  // year 3 on 0.39, 0.57 and 0.29 by world and from year 1 0.57, 0.54 and 0.15, shaded for the seed and RS
  d12: { '-0.3': 0.25, 0: 0.5, 0.3: 0.25 },
  d3: { 0.2: 0.3, 0.5: 0.4, 0.8: 0.3 },
  // the per-path spread of AN's residual about (1 - r) x C's, points: years 1 and 2 together and year 3 on (K1F's sd of Y1 + Y2
  // 0.61 to 1.48 and of its tail from year 3 4.57 to 5.21 by world)
  e12: 1.2, e3: 4.8,
  // Y12R (item 2): AN's removal of C's Y1 + Y2 on S370 per world, per cause; REF from A against C cross-seed (0.84 in world 0,
  // 0.65 in world 1; A carries RS), PART a part the reference does not reach
  s370: { REF: { 0.8: 0.3, 0.9: 0.4, 1: 0.3 }, PART: { 0.45: 0.3, 0.6: 0.4, 0.7: 0.3 }, NOT: { 0: 0.5, 0.15: 0.5 }, OTHER: { 0.3: 0.5, 0.5: 0.5 } },
  // the per-path spread of AN's Y1 + Y2 about (1 - r) x C's on S370, points (A's sd 0.37 to 1.09)
  e370: 0.9,
  // S370's residual from year 3 on under AN against C (WHOLE: the whole moves as well as the slice), points (C's tail from year
  // 3 12.55, 3.91 and -0.09 by world against A's 12.60, 3.76 and -0.02 cross-seed)
  s370rest: { '-0.5': 0.25, 0: 0.5, 0.5: 0.25 },
  // the RS split's own part, AR less AN on G per world, points (no record: K1F and A carry the reference and RS together; the
  // receipt finds R nil at S362's year-1 and year-2 reads under C)
  rs: { S362: { '-0.3': 0.25, 0: 0.5, 0.3: 0.25 }, S370: { '-0.5': 0.25, 0: 0.5, 0.5: 0.25 } },
  // item 3: the copy rule's move on G under the adaptive reference as a multiple of its move under the plan reference on S370
  // (c = S / p changes with p, so the two interact by construction: the receipt); on S362, where the rule is inert under C by
  // its clip, the move it gains under AR, points
  ci370: { 0.7: 0.1, 0.9: 0.15, 0.95: 0.15, 1: 0.3, 1.05: 0.15, 1.1: 0.15 },
  ci362: { 0: 0.6, '-0.5': 0.25, '-1.5': 0.15 },
  // item 4: S130's GB moved by AR per world, points, its sign either way (one bridge year: the step exact under either reference;
  // the lattice's smear of the step and RS)
  s130: { 0: 0.55, 0.1: 0.25, 0.3: 0.12, 0.6: 0.08 },
  // item 5: AN's discordant paths against C as a multiple of the record's (S362: HO-DEP's K1F against K2, 42, 29 and 23 by
  // world; S370: A against O, 3, 5 and 0; scaled by 4p(1 - p) at C's survival against the record's control's: DISCORD), the
  // net share the record's by world; more than the record's, since the plan reference sits further from the adaptive than the
  // order does (year 1's increment in world 0: S362 plan -3.34, order -1.77, adaptive 0.11; S370 -1.86, -1.09, -0.21); AR adds
  // a few of RS's own each way; ARX adds the copy rule's own flips (CX against C, the same paths)
  flips: { S362: { 0.75: 0.3, 1.25: 0.4, 2: 0.3 }, S370: { 1: 0.3, 2: 0.4, 4: 0.3 } },
  rsFlips: { 0: 0.5, 2: 0.3, 6: 0.2 },
  // S130's paths flipping under AR, each way (CX moved none there)
  s130flips: { 0: 0.5, 3: 0.3, 10: 0.2 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 13; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const pickN = dist => Number(pick(dist));
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
const dec = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; }, sdOf = a => { const m = mean(a); let v = 0; for (const x of a) v += (x - m) ** 2; return Math.sqrt(v / (a.length - 1)); };
const K = [0, 1, 2], HS = ['S362', 'S370', 'S130'];

// 1. THE RECORDS: the plan reference's C and CX (COPY-B's on S362 and S130, COPY-X's on S370) behind their own gates; HO-DEP's
// adaptive (K1F, A) and order (K2, O) references at seed 7004 behind HO-DEP's
const gateOf = (script, dir) => /^GATE: passed/m.test(spawnSync('node', [join(HERE, script), R_(dir)], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '');
for (const [s, d] of [['reduce-copyb.mjs', 'diagcopyb'], ['reduce-copyx.mjs', 'diagcopyx'], ['reduce-hodep.mjs', 'diaghodep']]) if (!gateOf(s, d)) { console.log(`${d}'s files did not pass ${s}'s gate`); process.exit(1); }
const F = { S362: { C: ld(join(R_('diagcopyb'), 'S362-C-P30S6Q5.json.gz')), CX: ld(join(R_('diagcopyb'), 'S362-CX-P30S6Q5.json.gz')) }, S130: { C: ld(join(R_('diagcopyb'), 'S130-C-P30S6Q5.json.gz')) },
  S370: { C: ld(join(R_('diagcopyx'), 'S370-C-P30S6Q5.json.gz')), CX: ld(join(R_('diagcopyx'), 'S370-CX-P30S6Q5.json.gz')) } };
const HD = { S362: { ADP: ld(join(R_('diaghodep'), 'S362-K1F-P30S6Q5.json.gz')), ORD: ld(join(R_('diaghodep'), 'S362-K2-P30S6Q5.json.gz')) }, S370: { ADP: ld(join(R_('diaghodep'), 'S370-A-P30S6Q5.json.gz')), ORD: ld(join(R_('diaghodep'), 'S370-O-P30S6Q5.json.gz')) } };
const N = F.S362.C.NPW;
if (N !== NPW || HS.some(h => F[h].C.NPW !== N || F[h].C.seed !== 7002)) { console.log('the records did not read'); process.exit(1); }
const BR = Object.fromEntries(HS.map(h => [h, F[h].C.bridge]));
const P100 = (f, x, k) => Float64Array.from(dec(f.per[`${x}${k}`]), v => 100 * v), BITS = (f, k) => dec8(f.bits[`OWN${k}`]);
const tailOf = (f, k, t) => { const ga = P100(f, 'GA', k), y = f.bridge.filter(u => u >= t).map(u => P100(f, `Y${u}`, k)); return Float64Array.from(ga, (g, i) => y.reduce((s, a) => s + a[i], g)); };
const y12Of = (f, k) => { const a = P100(f, 'Y1', k), b = P100(f, 'Y2', k); return Float64Array.from(a, (v, i) => v + b[i]); };
const flipsOf = (c, x) => { let lost = 0, saved = 0; for (let i = 0; i < c.length; i++) { if (c[i] && !x[i]) lost++; else if (!c[i] && x[i]) saved++; } return { lost, saved }; };
const TAB = (h, a, k) => { const t = readdirSync(R_(h === 'S370' ? 'diagcopyx' : 'diagcopyb')).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_(h === 'S370' ? 'diagcopyx' : 'diagcopyb'), f), 'utf8')).find(x => new RegExp(`^${h}\\s+case \\| job ${a}/P30S6Q5`, 'm').test(x)) || ''; const m = new RegExp(`tables ${a}/P30S6Q5 ${k} z \\S+ weight \\S+: OWN (\\S+)`).exec(t); return m ? Number(m[1]) : NaN; };
const REC = {};
console.log('REF-B\'S DERIVATION (predictions/diag-refb.md)\n\n1. THE RECORDS');
console.log(`  seed 7002, ${N} paths a world: S362's C and CX and S130's C behind COPY-B's gate, S370's C and CX behind COPY-X's; HO-DEP's K1F and K2 on S362 and A and O on S370 (seed 7004, the adaptive reference with RS and the order reference) behind HO-DEP's`);
for (const h of HS) {
  REC[h] = [];
  for (const k of K) {
    const C = F[h].C, CX = F[h].CX, bc = BITS(C, k), p = cnt(bc) / N, gb = P100(C, 'GB', k), r = { p, gb: mean(gb), sdgb: sdOf(gb), tab: { C: TAB(h, 'C', k), CX: CX ? TAB(h, 'CX', k) : NaN } };
    const ws = dec(C.per[`WS${k}`]); let wa = 0, na = 0, wd = 0, nd = 0; for (let i = 0; i < N; i++) { if (bc[i]) { wa += ws[i]; na++; } else { wd += ws[i]; nd++; } } r.gap = (na ? wa / na : 0) - (nd ? wd / nd : 0);
    let line = `  ${h} world ${k}: C's survival ${f4(100 * p)}, table ${f4(r.tab.C)}; GB ${f4(r.gb)} (sd ${f4(r.sdgb)})`;
    if (BR[h].length >= 3) { r.tails = [1, 2, 3].map(t => mean(tailOf(C, k, t))); line += `; the read error from years 1, 2 and 3 on ${r.tails.map(f4).join(', ')}`; }
    if (BR[h].includes(2)) { r.y12 = mean(y12Of(C, k)); r.sdy12 = sdOf(y12Of(C, k)); line += `; Y1 + Y2 ${f4(r.y12)} (sd ${f4(r.sdy12)})`; }
    if (CX) { const bx = BITS(CX, k); r.fx = flipsOf(bc, bx); r.dG = mean(P100(CX, 'GB', k)) + mean(P100(CX, 'GA', k)) - mean(gb) - mean(P100(C, 'GA', k)); line += `; CX against C: G ${f4(r.dG)}, ${r.fx.lost} lost, ${r.fx.saved} saved, table ${f4(r.tab.CX)}`; }
    if (HD[h]) {
      const A = HD[h].ADP, O = HD[h].ORD, ba = BITS(A, k), bo = BITS(O, k), q = cnt(bo) / N; r.fa = flipsOf(bo, ba); r.q = q;
      line += `; HO-DEP (7004): the adaptive arm's GB ${f4(mean(P100(A, 'GB', k)))}, its read error from years 1, 2 and 3 on ${[1, 2, 3].map(t => f4(mean(tailOf(A, k, t)))).join(', ')}, Y1 + Y2 ${f4(mean(y12Of(A, k)))} (sd ${f4(sdOf(y12Of(A, k)))}), the order arm's survival ${f4(100 * q)}, the adaptive against the order ${r.fa.lost} lost, ${r.fa.saved} saved`;
    }
    console.log(`${line}; the whole score's alive less dead ${f4(r.gap)}`);
    REC[h][k] = r;
  }
}
console.log(`  item 1 reads S362's worlds where C's Y1 + Y2 is a point or more in size: ${K.filter(k => Math.abs(REC.S362[k].y12) >= 1).join(', ') || 'none'} (the review's GB line: ${K.filter(k => Math.abs(REC.S362[k].gb) >= 1).join(', ') || 'none'}); item 2 reads S370's where C's Y1 + Y2 is: ${K.filter(k => Math.abs(REC.S370[k].y12) >= 1).join(', ') || 'none'}`);
if (process.argv.includes('--records')) process.exit(0);

// a synthetic draw of the three arms from C and CX path by path, in reduce-refb.mjs pOf()'s shape
const pickIdx = (bits, want, m) => { const ix = []; for (let i = 0; i < N; i++) if (bits[i] === want) ix.push(i); m = Math.min(m, ix.length); for (let j = 0; j < m; j++) { const r = j + Math.floor(rnd() * (ix.length - j)); [ix[j], ix[r]] = [ix[r], ix[j]]; } return ix.slice(0, m); };
const flipBits = (b0, lost, saved) => { const b = Uint8Array.from(b0); for (const j of pickIdx(b0, 1, lost)) b[j] = 0; for (const j of pickIdx(b0, 0, saved)) b[j] = 1; return b; };
const disc = (h, k) => { const r = REC[h][k], q = r.q ?? r.p; return Math.max(1e-4, r.p * (1 - r.p)) / Math.max(1e-4, q * (1 - q)); };
const realY = {}; for (const h of HS) realY[h] = K.map(k => Object.fromEntries([...F[h].C.bridge.map(t => [`Y${t}`, P100(F[h].C, `Y${t}`, k)]), ['GA', P100(F[h].C, 'GA', k)], ['GB', P100(F[h].C, 'GB', k)]]));
function drawSet(s) {
  const syn = { S362: { AN: [], AR: [] }, S370: { AN: [], AR: [] }, S130: { AR: [] } }, bits = { S362: { AN: [], AR: [], ARX: [] }, S370: { AN: [], AR: [], ARX: [] }, S130: { AR: [] } }, tabs = {};
  for (const h of ['S362', 'S370']) {
    tabs[h] = { C: K.map(k => REC[h][k].tab.C), CX: K.map(k => REC[h][k].tab.CX), AR: [], ARX: [] };
    for (const k of K) {
      const Y = realY[h][k], an = { GA: Y.GA };
      if (h === 'S362') {
        const j = s.wj[k];
        for (const t of BR[h]) { const r = (t <= 2 ? s.r12 : s.r3) + j, e = t <= 2 ? JUDGED.e12 / Math.SQRT2 : t === 3 ? JUDGED.e3 : 0, d = t <= 2 ? s.d12 / 2 : t === 3 ? s.d3 : 0; an[`Y${t}`] = Float64Array.from(Y[`Y${t}`], v => (1 - r) * v + d + e * gauss()); }
      } else {
        const r = s.r370[k];
        for (const t of BR[h]) { const e = t <= 2 ? JUDGED.e370 / Math.SQRT2 : 0, sh = t === 3 ? s.rest[k] : 0; an[`Y${t}`] = Float64Array.from(Y[`Y${t}`], v => (t <= 2 ? (1 - r) * v : v + sh) + e * gauss()); }
      }
      an.GB = Float64Array.from(Y.GB, (_, i) => BR[h].reduce((a, t) => a + an[`Y${t}`][i], 0));
      const ar = { ...an }, last = BR[h][BR[h].length - 1], rsp = s.rs[h][k];
      ar[`Y${last}`] = Float64Array.from(an[`Y${last}`], v => v + rsp); ar.GB = Float64Array.from(an.GB, v => v + rsp);
      syn[h].AN[k] = an; syn[h].AR[k] = ar;
      const bC = BITS(F[h].C, k), bX = BITS(F[h].CX, k), D = s.flips[h] * (REC[h][k].fa.lost + REC[h][k].fa.saved) * disc(h, k), e = (REC[h][k].fa.saved - REC[h][k].fa.lost) / Math.max(1, REC[h][k].fa.saved + REC[h][k].fa.lost);
      const bAN = flipBits(bC, pois(D * (1 - e) / 2), pois(D * (1 + e) / 2)), bAR = flipBits(bAN, pois(s.rsF), pois(s.rsF)), bARX = Uint8Array.from(bAR, (v, i) => Math.min(1, Math.max(0, v + bX[i] - bC[i])));
      bits[h].AN[k] = bAN; bits[h].AR[k] = bAR; bits[h].ARX[k] = bARX;
      // the copy rule's own move on table less runs under C (CX's table less C's, less CX's own survival change), carried to AR
      // as (1 + ci370) times it on S370, and as it is plus the move it gains (ci362) on S362: item 3 reads the excess
      const gC = mean(Y.GB) + mean(Y.GA), gAR = mean(ar.GB) + mean(ar.GA), dT = REC[h][k].tab.CX - REC[h][k].tab.C - 100 * (cnt(bX) - cnt(bC)) / N;
      const copy = h === 'S370' ? (1 + s.ci370) * dT : dT + s.ci362;
      tabs[h].AR[k] = REC[h][k].tab.C + (gAR - gC) + 100 * (cnt(bAR) - cnt(bC)) / N;
      tabs[h].ARX[k] = tabs[h].AR[k] + copy + 100 * (cnt(bARX) - cnt(bAR)) / N;
    }
  }
  for (const k of K) {
    const Y = realY.S130[k], m = s.s130[k] * (rnd() < 0.5 ? -1 : 1), ar = { GA: Y.GA, GB: Float64Array.from(Y.GB, v => v + m + 0.05 * gauss()) }; ar.Y1 = ar.GB; syn.S130.AR[k] = ar;
    const f = s.f130; bits.S130.AR[k] = flipBits(BITS(F.S130.C, k), pois(f), pois(f));
  }
  const perP = (h, a, k, x) => (a === 'C' || a === 'CX' ? (a === 'C' ? realY[h][k][x] : P100(F[h].CX, x, k)) : syn[h][a][k][x]);
  const bitsF = (h, a, k) => (a === 'C' || a === 'CX' ? BITS(F[h][a], k) : bits[h][a][k]);
  const wsF = (h, a, k) => { const w = dec(F[h].C.per[`WS${k}`]); if (a === 'C') return w; const b = bitsF(h, a, k), c = BITS(F[h].C, k), g = REC[h][k].gap; return Float64Array.from(w, (v, i) => v + (b[i] - c[i]) * g); };
  return pOf(perP, bitsF, wsF, tabs, BR);
}
const drawOf = (c188, cy) => {
  const a = JUDGED.s362[c188];
  return { r12: pickN(a.r12), r3: pickN(a.r3), wj: K.map(() => pickN(JUDGED.wj)), d12: pickN(JUDGED.d12), d3: pickN(JUDGED.d3), r370: K.map(() => pickN(JUDGED.s370[cy])), rest: K.map(() => pickN(JUDGED.s370rest)),
    rs: { S362: K.map(() => pickN(JUDGED.rs.S362)), S370: K.map(() => pickN(JUDGED.rs.S370)) }, ci370: pickN(JUDGED.ci370) - 1, ci362: pickN(JUDGED.ci362), s130: K.map(() => pickN(JUDGED.s130)),
    flips: { S362: pickN(JUDGED.flips.S362), S370: pickN(JUDGED.flips.S370) }, rsF: pickN(JUDGED.rsFlips), f130: pickN(JUDGED.s130flips) };
};
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f2(c[x] / tot(c))}`).join(' ');
const IT = ['1', '2', '3', '4', '5'];

// 2. THE POWER through items(): one input moved, the rest drawn from the JUDGED stories at each question's leading cause
const DR = 40, at = over => { const d = { ...drawOf('REF', 'REF'), ...over }; return items(drawSet(d)); };
const at1 = over => { const P = drawSet({ ...drawOf('REF', 'REF'), ...over }); return [items(P)['1'].outcome, item1Review(P).outcome]; };
const both = (lab, over) => { const c = cnt3(), v = cnt3(); for (let q = 0; q < DR; q++) { const [a, b] = at1(over); c[a]++; v[b]++; } console.log(`  item 1, ${lab}: ${row(c)}; the review's GB line on the same draws: ${row(v)}`); };
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-refb.mjs's items() and pOf(); C and CX as the files hold them, every other input drawn from the JUDGED stories at O188-REF and Y12R-REF)`);
for (const r of [0, 0.2, 0.5, 0.7, 0.8, 0.9, 1, 1.1]) both(`AN removes ${r} of C's residual at every bridge year`, { r12: r, r3: r });
for (const [r12, r3] of [[1, 0], [1, 0.6], [0.6, 1], [0.4, 1], [0, 1]]) both(`AN removes ${r12} at years 1 and 2 and ${r3} from year 3 on`, { r12, r3 });
for (const r of [0, 0.2, 0.5, 0.7, 0.8, 0.9]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[at({ r370: [r, r, r] })['2'].outcome]++; console.log(`  item 2, AN removes ${r} of S370's Y1 + Y2 in every world: ${row(c)}`); }
for (const m of [0, 0.03, 0.08, 0.15]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[at({ ci370: m, ci362: 0 })['3'].outcome]++; console.log(`  item 3, the copy rule's move on S370 under AR ${f2(1 + m)} times its move under C, nil on S362: ${row(c)}`); }
for (const m of [0, 0.15, 0.3, 0.6]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[at({ s130: [m, m, m] })['4'].outcome]++; console.log(`  item 4, AR moves S130's GB by ${m} in every world: ${row(c)}`); }
for (const fl of [0.75, 1.25, 2, 4]) { const c = cnt3(); for (let q = 0; q < DR; q++) c[at({ flips: { S362: fl, S370: fl } })['5'].outcome]++; console.log(`  item 5, AN's discordance ${fl} times the record's on S362 and S370 with its net share: ${row(c)}`); }

// 3. THE CREDENCES
const RECEIPT = '19 Oct 20:19 UK', logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => l.startsWith(`- ${RECEIPT} |`)) || '';
const credLine = (/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1];
const setFrom = pre => Object.fromEntries([...credLine.matchAll(new RegExp(`${pre}-([A-Z]+)=([0-9.]+)`, 'g'))].map(m => [m[1], Number(m[2])]));
const c188 = setFrom('O188'), cy = setFrom('Y12R'), sumOf = c => Object.values(c).reduce((a, x) => a + x, 0);
if (Object.keys(c188).length !== 6 || Object.keys(cy).length !== 4 || Math.abs(sumOf(c188) - 1) > 0.02 || Math.abs(sumOf(cy) - 1) > 0.02 || Object.keys(c188).some(k => !JUDGED.s362[k]) || Object.keys(cy).some(k => !JUDGED.s370[k])) { console.log(`the receipt's CAUSE CREDENCES did not read (${credLine.slice(0, 200)})`); process.exit(1); }
const LEAD = { o188: 'REF', y12r: 'REF' };
const ND = 1000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
const WHAT = { 1: 'the least share of S362\'s Y1 + Y2 under C that AN removes across the worlds read', 2: 'the least share of S370\'s Y1 + Y2 under C that AN removes across the worlds read', 3: 'the largest interaction in size across households and worlds, points', 4: 'the largest move of S130\'s GB in size across the worlds, points', 5: 'the least survival change of any leg and world, points' };
function credences(m188, my) {
  const I = Object.fromEntries(IT.map(i => [i, cnt3()])), R = { R1: 0, R2: 0, R3: 0, R5: 0, else: 0 }, pt = Object.fromEntries(IT.map(i => [i, []])), V = cnt3(), RV = { R1: 0, R2: 0, R3: 0, R5: 0, else: 0 };
  for (let q = 0; q < ND; q++) {
    const P = drawSet(drawOf(pickC(m188), pickC(my))), it = items(P), rv = item1Review(P);
    for (const i of IT) { I[i][it[i].outcome]++; const v = POINT[i](it); if (Number.isFinite(v)) pt[i].push(v); }
    R[rowOf(it)]++; V[rv.outcome]++; RV[rowOf({ ...it, 1: rv })]++;
  }
  return { I, R, pt, V, RV };
}
const show = ({ I, R, pt, V, RV }, tag) => {
  for (const i of IT) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the review's GB line in item 1's place, on the same draws (printed, not registered): item 1 ${row(V)}; rows ${Object.entries(RV).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  for (const i of IT) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))} (${pt[i].length} of ${ND} draws read)`);
  if (tag) { for (const i of IT) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`); console.log(`${tag}else ${f2(R.else / ND)}`); }
};
console.log(`\n3. THE CREDENCES AS STATED (the receipt of ${RECEIPT}: ${Object.entries(c188).map(([k, v]) => `O188-${k}=${v}`).join('; ')}; ${Object.entries(cy).map(([k, v]) => `Y12R-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(c188, cy), '');
const lp = /LEAD RATE BY POPULATION: .*?settled since (\d+) of (\d+) \(Laplace ([0-9.]+)\);.*? counted not held, (\d+) of (\d+) \(Laplace ([0-9.]+)\)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!lp) { console.log('the scorecard\'s LEAD RATE BY POPULATION did not read (results-scorecard.txt)'); process.exit(1); }
const atRate = (c, top, rate) => { const rest = sumOf(c) - c[top]; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === top ? rate : v * (1 - rate) / rest])); };
const lower = Number(lp[6]), since = Number(lp[3]);
console.log(`\n3b. THE CREDENCES WITH EACH QUESTION'S LEADING CAUSE AT THE LEAD RATE'S LOWER BOUND (results-scorecard.txt: ${lp[4]} of ${lp[5]}, Laplace ${lp[6]}; the registered ones; ${ND} draws through items())`);
show(credences(atRate(c188, LEAD.o188, lower), atRate(cy, LEAD.y12r, lower)), 'CREDENCE ');
console.log(`\n3c. THE SAME AT THE SETTLED-SINCE RATE (results-scorecard.txt: ${lp[1]} of ${lp[2]}, Laplace ${lp[3]}; printed beside)`);
show(credences(atRate(c188, LEAD.o188, since), atRate(cy, LEAD.y12r, since)), '');

// 4. THE BUDGET (grade C: the records' timings under a four-job load: HO-DEP's adaptive arms K1F on S362 and A on S370 for AR,
// ARX and AN on those households; S130's AR takes its C's solve times the ratio K1F's solve shows against S362's C, and C's ledger)
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const logIn = (d, re) => { try { return readdirSync(R_(d)).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_(d), f), 'utf8')).find(t => re.test(t)) || ''; } catch { return ''; } };
const tK = logIn('diaghodep', /^S362\s+case \| job K1F\/P30S6Q5/m), tA = logIn('diaghodep', /^S370\s+case \| job A\/P30S6Q5/m), t362 = logIn('diagcopyb', /^S362\s+case \| job C\/P30S6Q5/m), t130 = logIn('diagcopyb', /^S130\s+case \| job C\/P30S6Q5/m);
const sK = num(/solve CAND K1F\/P30S6Q5: table \S+ secs (\d+)/, tK), lK = num(/checks K1F\/P30S6Q5: ownTook .* secs (\d+)/, tK), sA = num(/solve CAND A\/P30S6Q5: table \S+ secs (\d+)/, tA), lA = num(/checks A\/P30S6Q5: ownTook .* secs (\d+)/, tA);
const s362 = num(/solve CAND C\/P30S6Q5: table \S+ secs (\d+)/, t362), s130 = num(/solve CAND C\/P30S6Q5: table \S+ secs (\d+)/, t130), l130 = num(/checks C\/P30S6Q5: ownTook .* secs (\d+)/, t130);
if (![sK, lK, sA, lA, s362, s130, l130].every(Number.isFinite)) { console.log(`the budget's inputs did not read (${[sK, lK, sA, lA, s362, s130, l130].join(', ')})`); process.exit(1); }
const jobSecs = ([h]) => (h === 'S362' ? sK + lK : h === 'S370' ? sA + lA : s130 * sK / s362 + l130);
const secs = EXPECT.map(jobSecs), cores = [0, 0, 0, 0];
for (const s of secs) { const c = cores.indexOf(Math.min(...cores)); cores[c] += s; }
console.log(`\n4. THE BUDGET (grade C: HO-DEP's K1F on S362 solve ${sK} s and ledger ${lK} s, A on S370 ${sA} s and ${lA} s; S130's C ${s130} s and ${l130} s, its AR's solve scaled by K1F's against S362's C (${s362} s))`);
console.log(`  the jobs in the batch's order: ${EXPECT.map((j, i) => `${j[0]} ${j[1]} ${f2(secs[i] / 3600)} h`).join('; ')}`);
console.log(`  ${f2(secs.reduce((a, x) => a + x, 0) / 3600)} job-hours; four at a time in that order, the wall about ${f2(Math.max(...cores) / 3600)} h`);
