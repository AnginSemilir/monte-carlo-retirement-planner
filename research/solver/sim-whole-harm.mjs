/*
 * THE WHOLE SCORE'S HARM-SIDE CALIBRATION (the whole-score rule's committed check, part (a): PLAN.md ledger 29 Sep 09:08,
 * "a harm-side calibration at 7u's paths"; drafts/whole-score-rule.md, "the combined whole-score form is shown the same way").
 * How often does the whole-score interval (reduce-7aa.mjs wholeFrom: the survival part's guarded unconditional interval plus
 * the rest's normal interval, each at a / 2, added) read "no material harm" - its lower end above minus the margin - when the
 * true whole-score loss is exactly the margin? The nominal rate is a / 2 (2.5% at a = 0.05, the one-sided error of the
 * lower end). Counted over 20,000 simulated draws a row:
 *   - arm A's failures drawn binomially (a normal draw with the binomial's spread), as sim-unconditional.mjs's lower rows;
 *   - the loss split between the survival part (B loses Poisson(N x share x margin / 100) of A's survivors, saving none: the
 *     pattern of every harm in 7r, 7s and O23) and the rest (its mean drawn normally about -(1 - share) x margin with the
 *     standard error restSe, taken as known);
 *   - shares 1 (all survival), 0.5 and 0 (all the rest); restSe 0.02, 0.05 and 0.10 points at 8,000 paths (7af's and 7ag's
 *     whole-score half-widths on the 7ah households run 0.10 to 0.93, results-derive-7ah.txt section 3, about 1.96 times the
 *     combined se), scaled by the square root of the path ratio at 16,000.
 * 7u is not sized yet: its paths are taken as 8,000 (7af's) and 16,000 (7ag's) - an assumption, to be re-run at 7u's
 * registered count if it differs. Declared simplification: the rest is drawn independently of the survival part (in a run
 * the paths B loses also lose their estate term, which the rest does not see: the rest excludes the survival indicator, not
 * the estate of a lost path - so a real loss moves both parts together; the share rows bracket it).
 * Beside it, the price: how often a true change of 0 passes (the rule's power at no effect).
 * Planted: the same draws at a true loss of three times the margin must read "no material harm" under 1% on every row, or
 * the simulation cannot see harm; and at no loss at all it must read it above 50% at the widest row, or it cannot pass.
 *   node research/solver/sim-whole-harm.mjs > research/solver/results-sim-whole-harm.txt
 */
import { wholeFrom } from './reduce-7aa.mjs';

let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const normal = () => { let u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
const pois = m => { if (m <= 0) return 0; if (m > 60) return Math.max(0, Math.round(m + Math.sqrt(m) * normal())); const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const binomFail = (N, q) => Math.min(N, Math.max(0, Math.round(N * q + Math.sqrt(N * q * (1 - q)) * normal())));
const R = 20000, A = 0.05;
const rate = (surv, N, margin, share, restSe8, loss) => {
  const se = restSe8 * Math.sqrt(8000 / N); let pass = 0;
  for (let r = 0; r < R; r++) {
    const failA = binomFail(N, 1 - surv), survA = N - failA, b = Math.min(survA, pois(N * share * loss / 100));
    const rest = -(1 - share) * loss + se * normal();
    if (wholeFrom({ a: survA - b, lost: b, saved: 0, d: failA, N }, rest, se, A).lo > -margin) pass++;
  }
  return pass / R;
};
const ROWS = [[0.998, 0.25], [0.99, 0.25], [0.95, 0.25], [0.9, 0.5], [0.7, 0.5]], PATHS = [8000, 16000], SHARES = [1, 0.5, 0], SES = [0.02, 0.05, 0.1];
console.log(`THE WHOLE SCORE'S HARM-SIDE CALIBRATION: how often a true whole-score loss of exactly the margin reads "no material harm" (reduce-7aa.mjs wholeFrom at a = ${A}; ${R} draws a row; nominal ${(100 * A / 2).toFixed(1)}%)`);
console.log('  survival  margin  paths  share in survival | the rest\'s se at 8,000 paths: 0.02 / 0.05 / 0.10');
let worst = 0, worstAt = '';
for (const [surv, margin] of ROWS) for (const N of PATHS) for (const share of SHARES) {
  const rs = SES.map(se => rate(surv, N, margin, share, se, margin));
  rs.forEach((x, k) => { if (x > worst) { worst = x; worstAt = `${(100 * surv).toFixed(1)}% ${N} paths, share ${share}, se ${SES[k]}`; } });
  console.log(`  ${(100 * surv).toFixed(1).padStart(6)}%  ${margin.toFixed(2)}  ${String(N).padStart(5)}  ${share.toFixed(1).padStart(4)}             | ${rs.map(x => `${(100 * x).toFixed(1).padStart(5)}%`).join('  ')}`);
}
// planted: harm the simulation must see, and a pass it must allow
let blind = 0, shut = true;
for (const [surv, margin] of ROWS) for (const share of SHARES) { if (rate(surv, 8000, margin, share, 0.1, 3 * margin) >= 0.01) blind++; }
for (const [surv, margin] of ROWS) if (rate(surv, 16000, margin, 0.5, 0.02, 0) > 0.5) shut = false;
if (blind || shut) { console.log(`\nPLANTED CHECK FAILED: ${blind} rows read a loss of three times the margin as no material harm 1% of the time or more; ${shut ? 'no row passes a true change of 0' : ''}`); process.exit(1); }
console.log(`\nLARGEST RATE: ${(100 * worst).toFixed(1)}% (${worstAt}), against the nominal ${(100 * A / 2).toFixed(1)}%`);
console.log('planted: a loss of three times the margin reads no material harm under 1% on every row (8,000 paths, se 0.10); a true change of 0 passes above 50% on some row (16,000 paths, se 0.02)');
// THE PRICE: how often a true change of 0 reads "no material harm" (the rule's power at no effect), the survival part
// changing nothing (share irrelevant at no loss), per path count and the rest's se
console.log('\nTHE PRICE, a true change of 0: how often it reads "no material harm"');
console.log('  survival  margin  paths | the rest\'s se at 8,000 paths: 0.02 / 0.05 / 0.10');
for (const [surv, margin] of ROWS) for (const N of PATHS) console.log(`  ${(100 * surv).toFixed(1).padStart(6)}%  ${margin.toFixed(2)}  ${String(N).padStart(5)} | ${SES.map(se => `${(100 * rate(surv, N, margin, 1, se, 0)).toFixed(1).padStart(5)}%`).join('  ')}`);
