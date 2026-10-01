/*
 * THE SIGNED YEAR-0 GAP (O74; PLAN.md 7aq; the deep review after 7am, deep-review-log.md 1 Oct 02:00 UK). openGap in the
 * audits (audit-7ai.mjs, audit-7am.mjs) finds, by bisection over the switch margin, the smallest margin at which the held
 * pair is kept, and prints '0' when the held pair wins at margin 0 - so a shift that moves the opening leaves the gap
 * clipped at 0 and the shift's split unreadable (7am: 3 of 7 unsplit). The signed gap is the best score among the moves
 * that leave the held tiers less the best among those that keep them, the scores as chooseAction compares them at margin
 * 0: the mixture's weighted score per move (a move that fails in any table fails), less the switch charge on every move
 * that leaves the held tiers. Positive: the bisected gap (the held pair needs that margin); 0 or below: the held pair wins
 * at margin 0 by that much.
 * Computed here from the exported scoreMoves, not read from chooseAction's buffers, so the two are independent;
 * crossCheck() holds them together on every unit: a positive signed gap equals the bisected gap (to 1e-9), a negative one
 * means the held pair is chosen at margin 0. The mixture without an extrapolated score only (the audits' solves); any
 * other refuses. Tested on planted faults by research/tests/solver-signedgap.test.mjs.
 */
import { scoreMoves, chooseAction } from '../../src/solver/solve.js';

export function signedGap(r, s, t, held) {
  if (!r.mix || r.rich || !held) throw new Error('signedGap: the mixture, no extrapolated score and a held pair only');
  const n = r.actions.length, acts = r.c.acts, sc = r.switchCharge || 0;
  const SC = new Float64Array(n), S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n);
  r.mix.tables.forEach((tab, k) => {
    scoreMoves(tab, s, t, S2, T2, B2, held);
    const w = r.mix.weights[k];
    for (let ai = 0; ai < n; ai++) SC[ai] = S2[ai] === -Infinity || SC[ai] === -Infinity ? -Infinity : SC[ai] + w * S2[ai];
  });
  let stay = -Infinity, move = -Infinity;
  for (let ai = 0; ai < n; ai++) {
    if (SC[ai] === -Infinity) continue;
    const keeps = acts[ai].tierPen === held.pen && acts[ai].tierIsa === held.isa;
    if (keeps) stay = Math.max(stay, SC[ai]); else move = Math.max(move, SC[ai] - sc);
  }
  return { gap: move - stay, stay, move };
}

// the bisected gap, as openGap prints it ('0', '>1' or the margin to 1e-12), against the signed one
const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
export function bisectedGap(r, s, t, held) {
  const acts = r.c.acts, stays = sm => { const a = acts[chooseAt(r, s, t, held, sm)]; return a.tierPen === held.pen && a.tierIsa === held.isa; };
  if (stays(0)) return '0';
  if (!stays(1)) return '>1';
  let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; }
  return hi.toExponential(4);
}
export function crossCheck(signed, bisected, eps = 1e-9) {
  if (!Number.isFinite(signed)) return `the signed gap is not finite (${signed})`;
  if (bisected === '0') return signed <= eps ? null : `the held pair wins at margin 0 but the signed gap is ${signed}`;
  if (bisected === '>1') return signed > 1 - eps ? null : `the held pair loses at margin 1 but the signed gap is ${signed}`;
  const b = +bisected;
  return Math.abs(b - signed) <= Math.max(eps, 5e-5 * b) ? null : `the bisected gap ${bisected} is not the signed gap ${signed.toExponential(4)}`;
}
