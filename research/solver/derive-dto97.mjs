/*
 * DT-O97'S DERIVATION (predictions/diag-dto97.md, the Derivation, Power and Credence sections). From ADOPT-PI's files, through
 * their own gate (rule 3: a re-use of ADOPT-PI's files for a new question; reduce-dto97.mjs references()):
 *   1. THE LOSS AT 0 AND THE REVALUATION: per loss household the net change PCLSI less SNAP a path at death tax 0, and the deep
 *      review's revaluation at 0.4 with the policy held (each surviving path's net less 0.4 x its last pension;
 *      reduce-dto97.mjs lastPension), its kept share.
 *   2. THE CHECK (the deep review after FORCE-X's own): on S130, S370 and S128, which ADOPT-PI re-solved at 0.4, the
 *      revaluation's shift of the net change against the re-solved shift; rho = re-solved / revalued.
 *   3. THE POWER: for a kept share k per household, each path's d4 = d0 + rho (drev - d0) with rho set so the household's
 *      mean keeps k (the revaluation's per-path pattern scaled), the registered rule (reduce-dto97.mjs item2: flipP, Holm over
 *      14, 5 of 7) over R_BOOT path resamples; item 1 by ADOPT-PI's rule (reduce-dto97.mjs item1) on the death-tax-0 pairs,
 *      as they are (SAME) and with a quarter-point loss added on every household (SHIFT).
 *   4. THE CREDENCES: item 2 rests on a deep review's ranked cause (O97-DT), so it starts from the deep-review base rate
 *      (0.10, frozen: results-scorecard.txt, O115), not the review's own 0.60, which it derived from a judged prior of 0.30
 *      (deep-review-log.md 6 Oct 08:08 UK): the review's likelihood ratio (0.60 against 0.30 in odds) applied to 0.10 gives
 *      O97-DT, the rest shared as the review's O97-TAIL 0.20, O97-PHOLD 0.10, O97-OTHER and the unassigned 0.10; O97-DT at the
 *      kept share the check's median rho predicts, TAIL at k 1, PHOLD at k 0.4, OTHER at k 0.5. The review's unshaded weights
 *      printed beside it as a sensitivity. Item 1 from the NOHARM base rate (results-scorecard.txt KIND BASE RATES): SAME at
 *      its share, SHIFT at the rest.
 *   node research/solver/derive-dto97.mjs > research/solver/results-derive-dto97.txt
 */
import { references, item1, item2, lastPension, PANEL, DT } from './reduce-dto97.mjs';
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

console.log(`\n3. THE POWER: the registered rules over ${R_BOOT} path resamples (flipP B ${B_FLIP})`);
const resample = (n, rand) => Array.from({ length: n }, () => Math.floor(rand() * n));
function power2(kOf, seed) {
  const rand = rng(seed), n = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let b = 0; b < R_BOOT; b++) {
    const rows = PANEL.map(id => { const N = D[id].d0.length, ix = resample(N, rand), d0 = ix.map(j => D[id].d0[j]), dr = ix.map(j => D[id].dr[j]); return { id, d0, d4: scaled(d0, dr, kOf(id)) }; });
    n[item2(rows, { b: B_FLIP }).v]++;
  }
  return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / R_BOOT]));
}
function power1(shift, seed) {
  const rand = rng(seed), n = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let b = 0; b < R_BOOT; b++) {
    const pairs = Object.fromEntries(PANEL.map(id => {
      const S = F[`${id} SNAP`], P = F[`${id} PCLSI`], N = S.N, ix = resample(N, rand), sv = ix.map(j => S.survived[j]), pv = ix.map(j => P.survived[j]);
      if (shift) { let k = Math.round(0.0025 * N); for (let j = 0; j < N && k > 0; j++) if (sv[j] && pv[j]) { pv[j] = 0; k--; } }
      const z = new Float32Array(N); return [id, paired({ survived: sv, tax: z, net: z }, { survived: pv, tax: z, net: z })];
    }));
    n[item1(pairs).v]++;
  }
  return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / R_BOOT]));
}
const show = p => `HELD ${f2(p.HELD)} INCONCLUSIVE ${f2(p.INCONCLUSIVE)} FALSIFIED ${f2(p.FALSIFIED)}`;
const P2 = {
  DT: power2(id => keptAt(id, RMED), 9701), DTLO: power2(id => keptAt(id, rs[0]), 9702), DTHI: power2(id => keptAt(id, rs[2]), 9703),
  TAIL: power2(() => 1, 9704), PHOLD: power2(() => 0.4, 9705), OTHER: power2(() => 0.5, 9706),
};
for (const [k, p] of Object.entries(P2)) console.log(`  item 2, ${k.padEnd(5)}: ${show(p)}`);
const P1 = { SAME: power1(false, 9711), SHIFT: power1(true, 9712) };
for (const [k, p] of Object.entries(P1)) console.log(`  item 1, ${k.padEnd(5)}: ${show(p)}`);

console.log('\n4. THE CREDENCES');
const mix = (w, P) => { const c = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }; for (const [k, wk] of Object.entries(w)) for (const o of Object.keys(c)) c[o] += wk * P[k][o]; return c; };
const W2 = { DT: 0.60, TAIL: 0.20, PHOLD: 0.10, OTHER: 0.10 }, c2 = mix(W2, P2);
const odds = (DR_BASE / (1 - DR_BASE)) * ((0.60 / 0.40) / (0.30 / 0.70)), dtShaded = odds / (1 + odds), rest = 1 - dtShaded;
const W2s = { DT: dtShaded, TAIL: rest * 0.20 / 0.40, PHOLD: rest * 0.10 / 0.40, OTHER: rest * 0.10 / 0.40 }, c2s = mix(W2s, P2);
const W1 = { SAME: NOHARM_BASE, SHIFT: 1 - NOHARM_BASE }, c1 = mix(W1, P1);
console.log(`  item 1 (SAME ${NOHARM_BASE}, the NOHARM base rate; SHIFT ${f2(1 - NOHARM_BASE)}): ${show(c1)}`);
console.log(`  item 2 (from the deep-review base rate ${DR_BASE} times the review's likelihood ratio, 0.60 against its prior 0.30: ${Object.entries(W2s).map(([k, v]) => `${k} ${f3(v)}`).join(', ')}): ${show(c2s)}`);
console.log(`  item 2, sensitivity: the review's own weights, unshaded (${Object.entries(W2).map(([k, v]) => `${k} ${f2(v)}`).join(', ')}): ${show(c2)}`);
console.log(`CREDENCE item 1: point ${f2(c1.HELD)} HELD ${f2(c1.HELD)} INCONCLUSIVE ${f2(c1.INCONCLUSIVE)} FALSIFIED ${f2(c1.FALSIFIED)}`);
console.log(`CREDENCE item 2: point ${f2(mean(PANEL.map(id => W2s.DT * keptAt(id, RMED) + W2s.TAIL + W2s.PHOLD * 0.4 + W2s.OTHER * 0.5)))} HELD ${f2(c2s.HELD)} INCONCLUSIVE ${f2(c2s.INCONCLUSIVE)} FALSIFIED ${f2(c2s.FALSIFIED)}`);
