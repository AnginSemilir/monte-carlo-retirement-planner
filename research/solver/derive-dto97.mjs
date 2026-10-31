/*
 * DT-O97'S DERIVATION (predictions/diag-dto97.md, the Derivation, Power and Credence sections). From ADOPT-PI's files, through
 * their own gate (rule 3: a re-use of ADOPT-PI's files for a new question; reduce-dto97.mjs references()):
 *   1. THE LOSS AT 0 AND THE REVALUATION: per loss household the net change PCLSI less SNAP a path at death tax 0, and the deep
 *      review's revaluation at 0.4 with the policy held (each surviving path's net less 0.4 x its last pension;
 *      reduce-dto97.mjs lastPension), its kept share.
 *   2. THE CHECK (the deep review after FORCE-X's own): on S130, S370 and S128, which ADOPT-PI re-solved at 0.4, the
 *      revaluation's shift of the net change against the re-solved shift; rho = re-solved / revalued.
 *   2b. THE PER-ARM SPLIT (the deep review of 6 Oct 10:37 UK): on the check households, each arm's re-solved net less its own
 *      revaluation (reduce-dto97.mjs armSplit); the extra on d, PCLSI's less SNAP's, as a share of SNAP's mean net - the
 *      re-solve's own drift. The first registration carried rho over to the loss households as a multiplier on the
 *      revaluation; the review found S130's rho is PCLSI's own re-solve lowering its tail net (opposite in sign for the loss
 *      households), so the stories now carry a drift, not a carried rho.
 *   3. THE POWER: d4 = the revaluation's per-path pattern scaled to a kept share, plus a story's drift (a constant a path);
 *      the registered rule (reduce-dto97.mjs item2) over R_BOOT path resamples. Stories: DT (rho 1, S128's drift), DT-DRIFT
 *      (rho 1, S130's drift), TAIL (k 1), PHOLD (k 0.4), OTHER (k 0.5); reported beside them, a rho sweep 0.5 to 1.0 and DT
 *      with the per-path noise tripled. Item 1 by ADOPT-PI's rule (reduce-dto97.mjs item1) on the death-tax-0 pairs as they
 *      are (SAME), with a tenth of a point lost on every household (SMALL) and a quarter point (SHIFT).
 *   4. THE CREDENCES: item 2 rests on a deep review's ranked cause (O97-DT), so it starts from the frozen deep-review base
 *      rate (0.10, O115) with no likelihood ratio (the 08:08 receipt's, which the first registration used, was withdrawn
 *      by the 10:37 review); the rest shared in the 10:37 review's proportions; the review's own weights, normalised,
 *      printed as a sensitivity. Item 1: SAME at the NOHARM base rate, SMALL and SHIFT sharing the rest evenly (declared).
 *      The points: item 1 the floor's change in points, item 2 the kept share, each weighted as its credence.
 *   node research/solver/derive-dto97.mjs > research/solver/results-derive-dto97.txt
 */
import { references, item1, item2, lastPension, armSplit, meanSe, PANEL, DT } from './reduce-dto97.mjs';
import { paired } from './reduce-adoptpi.mjs';

const R_BOOT = 20, B_FLIP = 2000, CHECK = ['S130', 'S370', 'S128'], NOHARM_BASE = 0.80, DR_BASE = 0.10;
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const rng = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/* per path: the net change at 0 and the revalued one at the death tax, policy held */
export function diffs(S, P) {
  const d0 = [], dr = [];
  for (let j = 0; j < S.N; j++) {
    d0.push(P.net[j] - S.net[j]);
    dr.push((P.net[j] - DT * lastPension(P, j) * P.survived[j]) - (S.net[j] - DT * lastPension(S, j) * S.survived[j]));
  }
  return { d0, dr };
}
/* d4 keeping a share k of the household's mean loss, along the revaluation's per-path pattern */
export function scaled(d0, dr, k) {
  const m0 = mean(d0), mr = mean(dr), rho = Math.abs(mr - m0) > 1e-9 ? ((k - 1) * m0) / (mr - m0) : 0;
  return d0.map((x, j) => x + rho * (dr[j] - x));
}
// PLANTED (rule 6): the revaluation subtracts 0.4 x the last pension on surviving paths only; scaled() hits its kept share
{
  const mk = (net, pen, sv) => ({ N: 2, Y: 2, net: Float32Array.from(net), pen: Float32Array.from(pen), survived: Uint8Array.from(sv) });
  const S = mk([100, 100], [10, 10, 50, 50], [1, 0]), P = mk([90, 100], [0, 0, 0, 0], [1, 0]), d = diffs(S, P);
  const k = mean(scaled([-100, -300], [-20, -60], 0.25)) / -200;
  if (!(d.d0[0] === -10 && d.dr[0] === -6 && d.dr[1] === 0 && Math.abs(k - 0.25) < 1e-12)) { console.log(`PLANTED CHECK FAILED: ${JSON.stringify(d)} ${k}`); process.exit(1); }
}

const R = references();
if (R.bad.length) { console.log(`GATE (ADOPT-PI's files): FAILED\n  ${R.bad.join('\n  ')}`); process.exit(1); }
console.log('GATE (ADOPT-PI\'s files, through their own gate): passed; planted: passed\n');
const F = R.files, D = Object.fromEntries(PANEL.map(id => [id, diffs(F[`${id} SNAP`], F[`${id} PCLSI`])]));

console.log(`1. THE LOSS AT 0 AND THE REVALUATION AT ${DT} (the policy held), the net change PCLSI less SNAP a path`);
for (const id of PANEL) if (![mean(D[id].d0), mean(D[id].dr)].every(Number.isFinite)) { console.log(`NOT FINITE: ${id}'s net change or its revaluation - the derivation refuses`); process.exit(1); }
for (const id of PANEL) { const m0 = mean(D[id].d0), mr = mean(D[id].dr); console.log(`  ${id.padEnd(16)} at 0 ${f2(m0).padStart(11)}   revalued ${f2(mr).padStart(11)}   kept ${f3(mr / m0)}`); }

console.log(`\n2. THE CHECK on the households ADOPT-PI re-solved at ${DT}: the shift of the net change, revalued against re-solved; rho = re-solved / revalued`);
const RHO = [];
for (const id of CHECK) {
  const d = diffs(F[`${id} SNAP`], F[`${id} PCLSI`]), m0 = mean(d.d0), mr = mean(d.dr);
  const S4 = F[`${id} DT SNAP`], P4 = F[`${id} DT PCLSI`], m4 = mean(Array.from(P4.net).map((v, j) => v - S4.net[j]));
  const rho = (m4 - m0) / (mr - m0); RHO.push(rho);
  console.log(`  ${id.padEnd(6)} at 0 ${f2(m0).padStart(11)}   revalued ${f2(mr).padStart(11)}   re-solved ${f2(m4).padStart(11)}   rho ${f3(rho)}`);
}
if (!RHO.every(Number.isFinite)) { console.log('NOT FINITE: a check household\'s rho - the derivation refuses'); process.exit(1); }
const rs = [...RHO].sort((a, b) => a - b), RMED = rs[1];
console.log(`  rho: median ${f3(RMED)}, range ${f3(rs[0])} to ${f3(rs[2])}`);
const keptAt = (id, rho) => { const m0 = mean(D[id].d0), mr = mean(D[id].dr); return (m0 + rho * (mr - m0)) / m0; };
console.log(`  the kept share each loss household would show at the check's rho (median, low, high): ${PANEL.map(id => `${id} ${f3(keptAt(id, RMED))} (${f3(keptAt(id, rs[0]))}, ${f3(keptAt(id, rs[2]))})`).join('; ')}`);

// 2b. THE PER-ARM SPLIT on the check households (the deep review of 6 Oct 10:37 UK): each arm's re-solved net less its own
// revaluation (reduce-dto97.mjs armSplit); the extra on d, PCLSI's less SNAP's, as a share of SNAP's mean net at 0 - the
// re-solve's own drift, which a scaled revaluation cannot carry (S130's rho is PCLSI's re-solve lowering its own tail net)
console.log(`\n2b. THE PER-ARM SPLIT on the check households: each arm's re-solved net at ${DT} less its own revaluation, mean a path; the extra on d (PCLSI's less SNAP's) and its share of SNAP's mean net at 0`);
const DRIFT = {};
for (const id of CHECK) {
  const sS = armSplit(F[`${id} SNAP`], F[`${id} DT SNAP`]), sP = armSplit(F[`${id} PCLSI`], F[`${id} DT PCLSI`]), e = meanSe(sP.map((v, j) => v - sS[j]));
  DRIFT[id] = e.m / mean(Array.from(F[`${id} SNAP`].net));
  console.log(`  ${id.padEnd(6)} SNAP ${f2(meanSe(sS).m).padStart(11)}   PCLSI ${f2(meanSe(sP).m).padStart(11)}   extra on d ${f2(e.m).padStart(11)} (se ${f2(e.se)})   share of SNAP's net ${(100 * DRIFT[id]).toFixed(3)}%`);
}
if (!Object.values(DRIFT).every(Number.isFinite)) { console.log('NOT FINITE: a check household\'s drift - the derivation refuses'); process.exit(1); }
// the stories' drifts: DT carries S128's (the one check household with SNAP holding more pension, the loss households' sign), DT-DRIFT S130's
const DRIFT_DT = DRIFT.S128, DRIFT_DRIFT = DRIFT.S130, netS0 = id => mean(Array.from(F[`${id} SNAP`].net));
const keptD = (id, rel) => (mean(D[id].dr) + rel * netS0(id)) / mean(D[id].d0);
console.log(`  the kept share each loss household would show at rho 1 with S128's drift (DT) and with S130's (DT-DRIFT): ${PANEL.map(id => `${id} ${f3(keptD(id, DRIFT_DT))} / ${f3(keptD(id, DRIFT_DRIFT))}`).join('; ')}`);

console.log(`\n3. THE POWER: the registered rules over ${R_BOOT} path resamples (flipP B ${B_FLIP}); d4 is the revaluation's per-path pattern scaled to a kept share (rho), plus a story's drift (a constant a path, its share of the household's SNAP mean net at 0), plus for NOISY extra per-path noise tripling the se of mean(d4 - 0.25 d0) (the review: the scaled model understates it 1.2 to 3.1 times)`);
const resample = (n, rand) => Array.from({ length: n }, () => Math.floor(rand() * n));
const gauss = rand => { let u = 0; while (u === 0) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); };
function power2(kOf, seed, { drift = 0, noise = 1 } = {}) {
  const rand = rng(seed), n = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let b = 0; b < R_BOOT; b++) {
    const rows = PANEL.map(id => {
      const N = D[id].d0.length, ix = resample(N, rand), d0 = ix.map(j => D[id].d0[j]), dr = ix.map(j => D[id].dr[j]), add = drift * netS0(id);
      let d4 = scaled(d0, dr, kOf(id)).map(x => x + add);
      if (noise > 1) { const w = d4.map((x, j) => x - 0.25 * d0[j]), mw = mean(w), sd = Math.sqrt(w.reduce((a, v) => a + (v - mw) * (v - mw), 0) / (N - 1)), ex = sd * Math.sqrt(noise * noise - 1); d4 = d4.map(x => x + ex * gauss(rand)); }
      return { id, d0, d4 };
    });
    n[item2(rows, { b: B_FLIP }).v]++;
  }
  return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / R_BOOT]));
}
function power1(shift, seed) {
  const rand = rng(seed), n = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let b = 0; b < R_BOOT; b++) {
    const pairs = Object.fromEntries(PANEL.map(id => {
      const S = F[`${id} SNAP`], P = F[`${id} PCLSI`], N = S.N, ix = resample(N, rand), sv = ix.map(j => S.survived[j]), pv = ix.map(j => P.survived[j]);
      if (shift) { let k = Math.round(shift * N); for (let j = 0; j < N && k > 0; j++) if (sv[j] && pv[j]) { pv[j] = 0; k--; } }
      const z = new Float32Array(N); return [id, paired({ survived: sv, tax: z, net: z }, { survived: pv, tax: z, net: z })];
    }));
    n[item1(pairs).v]++;
  }
  return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / R_BOOT]));
}
const show = p => `HELD ${f2(p.HELD)} INCONCLUSIVE ${f2(p.INCONCLUSIVE)} FALSIFIED ${f2(p.FALSIFIED)}`;
const P2 = {
  DT: power2(id => keptAt(id, 1), 9701, { drift: DRIFT_DT }), DRIFT: power2(id => keptAt(id, 1), 9707, { drift: DRIFT_DRIFT }),
  TAIL: power2(() => 1, 9704), PHOLD: power2(() => 0.4, 9705), OTHER: power2(() => 0.5, 9706),
};
for (const [k, p] of Object.entries(P2)) console.log(`  item 2, ${k.padEnd(5)}: ${show(p)}`);
console.log('  item 2, the rho sweep (no drift; reported, no story): ');
for (const [i, r] of [0.5, 0.6, 0.7, 0.8, 0.9, 1.0].entries()) console.log(`    rho ${r.toFixed(1)}: ${show(power2(id => keptAt(id, r), 9720 + i))}`);
console.log(`  item 2, DT with the noise tripled (reported, no story): ${show(power2(id => keptAt(id, 1), 9730, { drift: DRIFT_DT, noise: 3 }))}`);
const P1 = { SAME: power1(0, 9711), SMALL: power1(0.001, 9713), SHIFT: power1(0.0025, 9712) };
for (const [k, p] of Object.entries(P1)) console.log(`  item 1, ${k.padEnd(5)}: ${show(p)}`);

console.log('\n4. THE CREDENCES');
const mix = (w, P) => { const c = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }; for (const [k, wk] of Object.entries(w)) for (const o of Object.keys(c)) c[o] += wk * P[k][o]; return c; };
// item 2 rests on the deep review's ranked causes, so O97-DT starts from the frozen deep-review base rate (O115) with no
// likelihood ratio: the ratio the first registration used rested on the 08:08 receipt's "overstated twofold", which the
// 10:37 review withdrew; the rest shared in the 10:37 review's proportions (DT-DRIFT 0.35, TAIL 0.10, PHOLD 0.07, OTHER 0.05)
const RV = { DT: 0.40, DRIFT: 0.35, TAIL: 0.10, PHOLD: 0.07, OTHER: 0.05 }, rvSum = Object.values(RV).reduce((a, b) => a + b, 0), restSum = rvSum - RV.DT;
const W2s = Object.fromEntries(Object.entries(RV).map(([k, v]) => [k, k === 'DT' ? DR_BASE : (1 - DR_BASE) * v / restSum])), c2s = mix(W2s, P2);
const W2 = Object.fromEntries(Object.entries(RV).map(([k, v]) => [k, v / rvSum])), c2 = mix(W2, P2);
// item 1: SAME at the NOHARM base rate; the rest split evenly between a tenth of a point lost on every household (SMALL)
// and a quarter point (SHIFT) - a declared split (the review: two stories made INCONCLUSIVE 0.00 an artefact)
const W1 = { SAME: NOHARM_BASE, SMALL: (1 - NOHARM_BASE) / 2, SHIFT: (1 - NOHARM_BASE) / 2 }, c1 = mix(W1, P1);
console.log(`  item 1 (SAME ${NOHARM_BASE}, the NOHARM base rate; SMALL and SHIFT ${f2((1 - NOHARM_BASE) / 2)} each): ${show(c1)}`);
console.log(`  item 2 (O97-DT at the deep-review base rate ${DR_BASE}, the rest in the review's proportions: ${Object.entries(W2s).map(([k, v]) => `${k} ${f3(v)}`).join(', ')}): ${show(c2s)}`);
console.log(`  item 2, sensitivity: the review's own weights, normalised (${Object.entries(W2).map(([k, v]) => `${k} ${f3(v)}`).join(', ')}): ${show(c2)}`);
// item 1's point is a quantity, the floor's change in points (pooledSummed d): the death-tax-0 pairs' own under SAME, a
// tenth and a quarter point lower under SMALL and SHIFT, weighted as the credence
const d0pool = item1(Object.fromEntries(PANEL.map(id => [id, paired(F[`${id} SNAP`], F[`${id} PCLSI`])]))).pool.d;
if (!Number.isFinite(d0pool)) { console.log('NOT DERIVED: the death-tax-0 floor change is not finite'); process.exit(1); }
console.log(`  item 1's point: the floor's change at death tax 0, ${f3(d0pool)} points; under SMALL ${f3(d0pool - 0.1)}, under SHIFT ${f3(d0pool - 0.25)}`);
// item 2's point: the kept share weighted as the credence (DT and DT-DRIFT at rho 1 with their drifts, TAIL 1, PHOLD 0.4, OTHER 0.5)
const kStory = { DT: id => keptD(id, DRIFT_DT), DRIFT: id => keptD(id, DRIFT_DRIFT), TAIL: () => 1, PHOLD: () => 0.4, OTHER: () => 0.5 };
const pt2 = mean(PANEL.map(id => Object.entries(W2s).reduce((a, [k, w]) => a + w * kStory[k](id), 0)));
if (!Number.isFinite(pt2)) { console.log('NOT DERIVED: item 2\'s point is not finite'); process.exit(1); }
console.log(`CREDENCE item 1: point ${f2(W1.SAME * d0pool + W1.SMALL * (d0pool - 0.1) + W1.SHIFT * (d0pool - 0.25))} HELD ${f2(c1.HELD)} INCONCLUSIVE ${f2(c1.INCONCLUSIVE)} FALSIFIED ${f2(c1.FALSIFIED)}`);
console.log(`CREDENCE item 2: point ${f2(pt2)} HELD ${f2(c2s.HELD)} INCONCLUSIVE ${f2(c2s.INCONCLUSIVE)} FALSIFIED ${f2(c2s.FALSIFIED)}`);
