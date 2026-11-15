/*
 * A PAIRED SURVIVAL CHANGE AGAINST A BAR, EXACTLY (the class OTHER-ORDER's read met, results-other-order-beside.txt A: a
 * unit's change of -20 paths of 4,000, the bar's -0.5 points exactly, read as below the bar because stats.mjs
 * survivalChangeU forms the change as a difference of two rounded proportions, -0.50000000000000044).
 *
 * On N paired paths, an arm's survival change against another is k / N, k = c - b (paths saved less paths lost), so in
 * points it is 100 k / N: a whole number of paths over N. A bar in points (-0.5, -0.25, 0.1) is a decimal. A change formed
 * from two rounded proportions can misread one that sits on the bar, which on whole paths happens whenever 100 k / N meets
 * it (-20 of 4,000 at -0.5, -4 of 4,000 at -0.1). Here the comparison is made in whole numbers: the bar as an integer over
 * a power of ten, read from its decimal digits, and 100 k times that power against the bar's numerator times N.
 *
 * For reducers written from 15 Nov on (STATE.md section 6 action 3). stats.mjs is not changed: the reducers of earlier reads
 * import it and their stamps hold its bytes.
 *   import { cmpBar, cmpCells, pairedCounts, pointsOf } from './paired-exact.mjs';
 *   cmpBar(k, N, bar)        -1, 0 or +1: the sign of (100 k / N - bar), exactly; k and N whole numbers, N > 0, the bar a
 *                            finite number of at most 9 decimals, printed without an exponent (refused otherwise)
 *   cmpCells(cells, bar)     the same from the paired cells { a, b, c, d } (pairedCounts, or a reducer's own): k = c - b,
 *                            N = a + b + c + d
 *   pairedCounts(sA, sB)     { a, b, c, d, N, k } from two per-path survival arrays of 0 and 1: a both survive, b arm A
 *                            alone (lost under B), c arm B alone (saved), d neither; k = c - b
 *   pointsOf(k, N)           100 k / N, for printing; never compared with a bar
 * PLANT.rule (research/tests/paired-exact.test.mjs only): 'float' makes cmpCells compare as survivalChangeU forms the
 * change, the difference of the two arms' rounded proportions against the bar in floating point.
 */
export const PLANT = { rule: '' };
const MAX_DECIMALS = 9;

/* the bar as an integer numerator over 10^p, from its shortest decimal (Number's toString, which round-trips) */
function barRational(bar) {
  if (typeof bar !== 'number' || !Number.isFinite(bar)) throw new Error(`paired-exact: the bar ${bar} is not a finite number`);
  const t = String(bar);
  if (/e/i.test(t)) throw new Error(`paired-exact: the bar ${bar} prints with an exponent; give a plain decimal`);
  const neg = t.startsWith('-'), body = neg ? t.slice(1) : t, [int, frac = ''] = body.split('.');
  if (frac.length > MAX_DECIMALS) throw new Error(`paired-exact: the bar ${bar} has more than ${MAX_DECIMALS} decimals`);
  return { num: BigInt(int + frac) * (neg ? -1n : 1n), den: 10n ** BigInt(frac.length) };
}
const whole = (v, what) => { if (!Number.isInteger(v)) throw new Error(`paired-exact: ${what} ${v} is not a whole number`); return BigInt(v); };

export function cmpBar(k, N, bar) {
  const K = whole(k, 'the change in paths'), n = whole(N, 'the paths');
  if (n <= 0n) throw new Error(`paired-exact: ${N} paths`);
  if (K > n || K < -n) throw new Error(`paired-exact: a change of ${k} paths on ${N}`);
  const { num, den } = barRational(bar), lhs = 100n * K * den, rhs = num * n;
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}
export function cmpCells({ a, b, c, d }, bar) {
  for (const [v, w] of [[a, 'a'], [b, 'b'], [c, 'c'], [d, 'd']]) if (!Number.isInteger(v) || v < 0) throw new Error(`paired-exact: the cell ${w} is ${v}`);
  const N = a + b + c + d;
  if (PLANT.rule === 'float') {
    // the plant: survivalChangeU's change, 100 (pB - pA) with pB = (a + c) / N and pA = (a + b) / N, against the bar
    const dl = 100 * ((a + c) / N - (a + b) / N);
    return dl < bar ? -1 : dl > bar ? 1 : 0;
  }
  return cmpBar(c - b, N, bar);
}
export function pairedCounts(sA, sB) {
  if (!sA || !sB || sA.length !== sB.length) throw new Error('paired-exact: the two arms\' survival arrays differ in length');
  let a = 0, b = 0, c = 0, d = 0;
  for (let i = 0; i < sA.length; i++) {
    const x = sA[i], y = sB[i];
    if ((x !== 0 && x !== 1) || (y !== 0 && y !== 1)) throw new Error(`paired-exact: path ${i} survives as ${x} and ${y}, not 0 or 1`);
    if (x && y) a++; else if (x) b++; else if (y) c++; else d++;
  }
  return { a, b, c, d, N: sA.length, k: c - b };
}
export const pointsOf = (k, N) => (100 * k) / N;
