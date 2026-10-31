/*
 * 7R'S SWAP CHOOSER (audit-s126.mjs diag7r's RTIER and RREST arms; checked by research/tests/solver-choose-hook.test.mjs).
 * Given off's solve and the reader's, a chooser for runPolicy's `choose` hook: in each year before pension access both pick a
 * move from the arm's own state and tiers held, and the arm takes the tiers from one and the order, harvest and spending
 * level from the other - RTIER the reader's tiers with off's rest, RREST off's tiers with the reader's rest. The move list
 * holds every tier pair under each base (solve.js buildActions, tierBase), so the swap is the base of one move plus the
 * other's offset into the tier pairs; swapIndex checks it landed. From the last bridge year on both pick off's move, which
 * the reader's move equals there (it reads only tables of years before access; the test pins that). n.late counts the
 * path-years where the two differ in the last bridge year or the first year of access, the only years it compares both;
 * after that it takes off's move without asking the reader (the hook test compares every later year on S126).
 */
import { chooseAction } from '../../src/solver/solve.js';

export const stripTiers = l => l.replace(/, (pension|ISA) \d tiers? down/g, '');
export function swapIndex(A, tierFrom, restFrom) {
  const ai = A[restFrom].tierBase + (tierFrom - A[tierFrom].tierBase);
  if (!(ai >= 0 && ai < A.length) || A[ai].tierPen !== A[tierFrom].tierPen || A[ai].tierIsa !== A[tierFrom].tierIsa
    || A[ai].spendLevel !== A[restFrom].spendLevel || stripTiers(A[ai].label) !== stripTiers(A[restFrom].label))
    throw new Error(`swap: the tiers of move ${tierFrom} and the rest of move ${restFrom} did not land on one move (${ai})`);
  return ai;
}
export function accessYear(r) { const T = r.m.ctx.totalYears; for (let t = 0; t <= T; t++) if (r.c.yr.access[t]) return t; return T + 1; }
export function swapChooser(rO, rR, which) {
  if (which !== 'rtier' && which !== 'rrest') throw new Error(`swap: no arm ${which}`);
  const A = rO.actions;
  if (A.length !== rR.actions.length || A.some((a, i) => a.label !== rR.actions[i].label)) throw new Error('swap: the two solves have different move lists');
  const accessAt = accessYear(rO), n = { swapped: 0, late: 0 };
  const choose = (t, s, held) => {
    if (t > accessAt) return chooseAction(rO, s, t, held);
    const aO = chooseAction(rO, s, t, held), aR = chooseAction(rR, s, t, held);
    if (t >= accessAt - 1) { if (aO !== aR) n.late++; return aO; }
    if (aO === aR) return aO;
    n.swapped++;
    return which === 'rtier' ? swapIndex(A, aR, aO) : swapIndex(A, aO, aR);
  };
  return { choose, n, accessAt };
}

/*
 * 7Y'S SWAP CHOOSER (audit-s126.mjs diag7y's TS-TIER and TS-REST arms; the deep review after 7x, deep-review-log.md 27 Sep
 * 22:32 UK; PLAN.md O39's gate). Given the product's solve (rP) and the tier-state solve (rT, solve.js tierState) of one
 * case with the same move list, a chooser for runPolicy's `choose` hook: in EVERY year both pick a move from the arm's own
 * state and tier held, and the arm takes the tiers from one and the order, harvest and spending level from the other -
 * 'tier' the tier state's tiers with the product's rest, 'rest' the product's tiers with the tier state's rest. Unlike
 * swapChooser (7r, whose reader read only the bridge years) the tier state's tables differ in every year, so no year is
 * left to one chooser. n.swapped counts the path-years where the two picked different moves.
 */
export function tsSwapChooser(rP, rT, which) {
  if (which !== 'tier' && which !== 'rest') throw new Error(`tsSwap: no arm ${which}`);
  const A = rP.actions;
  if (A.length !== rT.actions.length || A.some((a, i) => a.label !== rT.actions[i].label)) throw new Error('tsSwap: the two solves have different move lists');
  const n = { swapped: 0, same: 0 };
  const choose = (t, s, held) => {
    const aP = chooseAction(rP, s, t, held), aT = chooseAction(rT, s, t, held);
    if (aP === aT) { n.same++; return aP; }
    n.swapped++;
    return which === 'tier' ? swapIndex(A, aT, aP) : swapIndex(A, aP, aT);
  };
  return { choose, n };
}
