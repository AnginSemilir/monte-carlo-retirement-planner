/*
 * FORCE-X'S DERIVATION, as amended before launch by the deep review after PAUSE-S128 (deep-review-log.md 6 Oct 04:34 UK, its
 * DECISIVE TEST item 6; predictions/diag-forcex.md, the Derivation, Power and Credence sections). From EDGE-SPLIT's S130
 * files and HYB's, each through its own gate (rule 3: a re-use of their files for a new question; reduce-forcex.mjs
 * references()):
 *   1. THE GAPS: for each deciding arm (P-LO, HYB: PCLSI's tables), per path, P = PCLSI - a in survival: the paths PCLSI saves
 *      that the arm loses (+1), the reverse (-1), and the sum, the denominator of R; SNAP's beside them, reported.
 *   1b. THE REACH (FLAG 3's counts): on the paths PCLSI saves, how many have a would-be hold in the arm's own unforced file
 *      (pension live, u in [p - 0.10, p), next u under p, u growing by under 0.02: audit-forcex.mjs forcePoint), the median
 *      first such year, the median year the arm first leaves PCLSI, and the share whose first would-be hold comes at or before
 *      that year.
 *   2. ITEM 1's POWER: for true rescue shares (r P-LO, r HYB), the forced arm rescues each +1 path with its arm's chance r and
 *      keeps the arm's outcome elsewhere, with a symmetric flip on a share f of the other paths: each flipped path changes
 *      state with chance one half, so a survivor dies with chance f/2. f per arm from the files: the nearest record of a
 *      policy change killing paths that survived is PCLSI against the arm itself - the paths PCLSI loses that the arm keeps -
 *      so f = 2 x loses / the arm's survivors (grade C: PCLSI differs from the arm far more than one forced draw does, so an
 *      upper analogue). The deep review's premise (g) quoted 0.027 to 0.035 of 6,000 as the arms' decided paths against
 *      PCLSI; those count the gap paths themselves, so they bound nothing about the other paths. A first run of this script
 *      used 0.03 from that figure (declared in the prediction); it is kept as a sensitivity row beside 0.01, the first
 *      design's assumption. Read by the registered rule (reduce-forcex.mjs item1: flipP, Holm over four, LO 0.3, HI 0.7)
 *      over R_BOOT draws.
 *   3. THE CREDENCES: the deep review's own cause credences (CAUSE CREDENCES, 6 Oct 04:34 UK), already shaded by the base rate
 *      in its receipt, so not shaded again (the deep review after XAS-R2, FLAG 2): LOSS-HOLD 0.55, LOSS-READ 0.15, LOSS-OPT
 *      0.08, LOSS-NOISE 0.02; LOSS-TABLES (0.10, SNAP only: not a cause of P-LO's or HYB's gap) folded into the unassigned
 *      0.10, so OTHER 0.20 (declared). Each story's r per arm: LOSS-HOLD 0.9 times the arm's reach (section 1b: a path the
 *      force never reaches cannot be rescued by it), LOSS-READ 0.1, LOSS-OPT 0.5, LOSS-NOISE 0, OTHER 0.5.
 *   node research/solver/derive-forcex.mjs > research/solver/results-derive-forcexc.txt
 */
import { recovery, item1, references, DECIDE, LIVE, CELL, FLAT, ARM } from './reduce-forcex.mjs';

const R_BOOT = 40, B_FLIP = 2000, SENS = [0.01, 0.03];
const ARMS = ['P-LO+X', 'HYB+X'], SHOWN = ['SNAP+X', ...ARMS];
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');
const rng = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const med = a => { if (!a.length) return NaN; const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
/* one simulated forced arm: rescue each +1 path with chance r, flip a share f of the rest either way */
export function simulate(A, P, r, rand, f) {
  return A.map((a, j) => { const g = P[j] - a; if (g > 0) return rand() < r ? 1 : a; if (rand() < f) return rand() < 0.5 ? 1 - a : a; return a; });
}
/* the first year a path would be forced (audit-forcex.mjs forcePoint on the unforced file, pension live), or -1 */
export function firstHold(ref, j, prices) {
  for (let y = 0; y + 1 < ref.Y; y++) {
    const i = j * ref.Y + y, u = ref.u[i], u1 = ref.u[i + 1];
    if (!(ref.pen[i] > LIVE) || !(u < 0.99) || !(u1 - u < FLAT)) continue;
    if (prices.some(p => u >= p - CELL - 1e-6 && u < p && u1 < p)) return y;   // 1e-6: the files store u in Float32
  }
  return -1;
}
/* on the paths PCLSI saves: reached (a would-be hold exists), the median first hold and leave years, the share held by leaving */
export function reach(ref, pc, prices) {
  const fy = [], lv = []; let saved = 0, reached = 0, early = 0;
  for (let j = 0; j < ref.N; j++) {
    if (!(pc.survived[j] === 1 && ref.survived[j] === 0)) continue;
    saved++;
    let d = -1; for (let y = 0; y < ref.Y; y++) { const i = j * ref.Y + y; if (ref.u[i] !== pc.u[i] || ref.pen[i] !== pc.pen[i] || ref.non[i] !== pc.non[i]) { d = y; break; } }
    if (d >= 0) lv.push(d);
    const f = firstHold(ref, j, prices);
    if (f >= 0) { reached++; fy.push(f); if (d >= 0 && f <= d) early++; }
  }
  return { saved, reached, share: saved ? reached / saved : NaN, hold: med(fy), leaves: med(lv), early: reached ? early / reached : NaN };
}
// PLANTED (rule 6): r 1 without flips recovers the whole gap, r 0 none; firstHold finds an allowance-only hold (u 0.70 to
// 0.7156) and not a year past the point or one growing by 0.03; reach counts only the saved paths
{
  const A = [0, 0, 1, 1, 0], P = [1, 1, 1, 1, 0], x1 = A.map((a, j) => (P[j] - a > 0 ? 1 : a)), r1 = recovery(x1, A, P).R, r0 = recovery(A, A, P).R;
  const mk = us => ({ N: 1, Y: us.length, u: Float32Array.from(us), pen: Float32Array.from(us.map(() => 5e4)), non: Float32Array.from(us.map(() => 0)), survived: [0] });
  const h1 = firstHold(mk([0.5, 0.6, 0.70, 0.7156, 0.9]), 0, [0.75]), h2 = firstHold(mk([0.5, 0.6, 0.76, 0.765]), 0, [0.75]), h3 = firstHold(mk([0.5, 0.68, 0.71, 0.74]), 0, [0.75]);
  const pc = { ...mk([0.5, 0.6, 0.6, 0.6, 0.6]), survived: [1] }, rc = reach(mk([0.5, 0.6, 0.70, 0.7156, 0.9]), pc, [0.75]), rn = reach(mk([0.5, 0.6, 0.70, 0.7156, 0.9]), { ...pc, survived: [0] }, [0.75]);
  if (!(r1 === 1 && r0 === 0 && h1 === 2 && h2 === -1 && h3 === -1 && rc.saved === 1 && rc.reached === 1 && rc.hold === 2 && rc.leaves === 2 && rn.saved === 0 && simulate(A, P, 1, rng(1), 0).length === 5 && simulate(A, P, 0, rng(2), 1).filter((x, j) => x !== A[j]).length > 0)) { console.log(`PLANTED CHECK FAILED: ${r1} ${r0} ${h1} ${h2} ${h3} ${JSON.stringify(rc)} ${rn.saved}`); process.exit(1); }
}

const { bad, refs } = await references();
if (bad.length) { console.log(`GATE (EDGE-SPLIT's and HYB's files): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log('GATE (EDGE-SPLIT\'s and HYB\'s files, each through its own gate): passed; planted: passed\n');
const pc = refs[`${DECIDE} PCLSI`], PC = Array.from(pc.survived), refOf = a => refs[`${DECIDE} ${ARM[a].partner}`], AR = Object.fromEntries(SHOWN.map(a => [a, Array.from(refOf(a).survived)]));

console.log(`1. THE GAPS (${DECIDE}, per path, P = PCLSI - a in survival; SNAP reported, not deciding)`);
for (const a of SHOWN) { const A = AR[a], g = A.map((x, j) => PC[j] - x); console.log(`  ${ARM[a].partner.padEnd(6)} survivors ${A.reduce((s, x) => s + x, 0)} (PCLSI ${PC.reduce((s, x) => s + x, 0)}): PCLSI saves ${g.filter(x => x > 0).length}, loses ${g.filter(x => x < 0).length}, the gap ${g.reduce((s, x) => s + x, 0)} paths`); }

console.log(`\n1b. THE REACH (${DECIDE}'s saved paths: PCLSI survives, the arm does not; a would-be hold in the arm's unforced file: pension live, u in [p - ${CELL}, p), next u under p, growth under ${FLAT})`);
const RCH = {};
for (const a of SHOWN) { const q = reach(refOf(a), pc, ARM[a].price.split(',').map(Number)); RCH[a] = q; console.log(`  ${ARM[a].partner.padEnd(6)} price ${ARM[a].price.padEnd(9)} saved ${q.saved}, reached ${q.reached} (${f3(q.share)})   first would-be hold at year ${q.hold}   leaves PCLSI at year ${q.leaves}   held at or before leaving ${f3(q.early)}`); }

const FL = Object.fromEntries(ARMS.map(a => { const A = AR[a], s = A.reduce((x, y) => x + y, 0), loses = A.filter((x, j) => PC[j] - x < 0).length; return [a, 2 * loses / s]; }));
console.log(`\n2. ITEM 1'S POWER: true rescue shares (r P-LO, r HYB), the registered rule (Holm over four), ${R_BOOT} draws (flipP B ${B_FLIP}); the flip share on the other paths from the files, f = 2 x (paths PCLSI loses that the arm keeps) / the arm's survivors: ${ARMS.map(a => `${ARM[a].partner} ${f3(FL[a])}`).join(', ')} (grade C, an upper analogue); then the sensitivity rows at f ${SENS.join(' and ')} on both arms`);
const powerAt = (rs, fs, seed) => { const rand = rng(seed), n = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 }; for (let b = 0; b < R_BOOT; b++) n[item1(ARMS.map((a, i) => recovery(simulate(AR[a], PC, rs[i], rand, fs[i]), AR[a], PC)), { b: B_FLIP }).v]++; return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / R_BOOT])); };
const POW = new Map(), key = (rs, fs) => [...rs, ...fs].map(x => x.toFixed(4)).join(',');
const power = (rs, fs = ARMS.map(a => FL[a])) => { const k = key(rs, fs); if (!POW.has(k)) POW.set(k, powerAt(rs, fs, 7005 + Math.round(1000 * rs[0]) + 7 * Math.round(1000 * rs[1]))); return POW.get(k); };
const row = (rs, fs) => { const p = power(rs, fs); return `HELD ${f2(p.HELD)} FALSIFIED ${f2(p.FALSIFIED)} INCONCLUSIVE ${f2(p.INCONCLUSIVE)}`; };
for (const rs of [[0, 0], [0.1, 0.1], [0.3, 0.3], [0.5, 0.5], [0.7, 0.7], [0.8, 0.8], [0.9, 0.9], [1, 1], [0.9, 0.5], [0.5, 0.9]]) console.log(`  r ${f2(rs[0])}, ${f2(rs[1])}: ${row(rs)}`);
for (const f of SENS) for (const rs of [[0.3, 0.3], [0.7, 0.7], [0.9, 0.9], [1, 1]]) console.log(`  sensitivity, f ${f2(f)} on both: r ${f2(rs[0])}, ${f2(rs[1])}: ${row(rs, [f, f])}`);

console.log('\n3. THE CREDENCES (the deep review\'s cause credences of 6 Oct 04:34 UK, already shaded by the base rate in its receipt, not shaded again; LOSS-TABLES folded into the unassigned mass; LOSS-HOLD\'s r scaled by each arm\'s reach)');
const w = { HOLD: 0.55, READ: 0.15, OPT: 0.08, NOISE: 0.02, OTHER: 0.20 };
const rOf = { HOLD: ARMS.map(a => 0.9 * RCH[a].share), READ: [0.1, 0.1], OPT: [0.5, 0.5], NOISE: [0, 0], OTHER: [0.5, 0.5] }, c = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
for (const [k, wk] of Object.entries(w)) { const p = power(rOf[k]); console.log(`  ${k.padEnd(5)} ${f2(wk)} at r ${rOf[k].map(f3).join(', ')}: HELD ${f2(p.HELD)} FALSIFIED ${f2(p.FALSIFIED)} INCONCLUSIVE ${f2(p.INCONCLUSIVE)}`); for (const o of Object.keys(c)) c[o] += wk * p[o]; }
const pt = i => Object.entries(w).reduce((s, [k, v]) => s + v * rOf[k][i], 0);
console.log(`  the stories' mean r: P-LO ${f2(pt(0))}, HYB ${f2(pt(1))}`);
console.log(`CREDENCE item 1: point ${f2((pt(0) + pt(1)) / 2)} HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
