/*
 * THE SURVIVAL RULE'S CALIBRATION (RULES.md section 8 Testing 1, decided by the maintainer 29 Sep 22:12 UK: every new test
 * reads survival by the exact rule AND the guarded unconditional interval; the plan-auditor's BLOCKING 2 of 29 Sep 22:33:
 * the rule's own calibration, not the whole score's). How often does a household PASS - stats.mjs outcome reads "no
 * material harm" (a single household, so its Holm-adjusted p is its own) AND the guarded unconditional interval's lower end
 * (reduce-7aa.mjs guarded over stats.mjs survivalChangeU) is above minus the margin - when the true loss is exactly the
 * margin? One-sided losses, the pattern of every harm in 7r, 7s and O23: arm A's failures drawn binomially (a normal draw
 * with the binomial's spread), B losing Poisson(N x margin / 100) more of A's survivors, saving none. The nominal rate is
 * level / 2 = 2.5%. 20,000 draws a row, mulberry32 seed 7002. Beside it, each part alone: the exact rule's pass, and the
 * guarded interval's.
 * Planted: at three times the margin the rule must pass under 1% on every row; at no loss it must pass above 50% on some row.
 *   node research/solver/sim-survival-rule.mjs > research/solver/results-sim-survival-rule.txt
 */
import { survivalChangeU, outcome, mcnemarHarmP } from './stats.mjs';
import { guarded } from './reduce-7aa.mjs';

let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const normal = () => { let u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
const pois = m => { if (m <= 0) return 0; if (m > 60) return Math.max(0, Math.round(m + Math.sqrt(m) * normal())); const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const binomFail = (N, q) => Math.min(N, Math.max(0, Math.round(N * q + Math.sqrt(N * q * (1 - q)) * normal())));
const R = 20000, LEVEL = 0.05;
const rate = (surv, N, margin, loss) => {
  let both = 0, exact = 0, guard = 0;
  for (let r = 0; r < R; r++) {
    const failA = binomFail(N, 1 - surv), survA = N - failA, b = Math.min(survA, pois(N * loss / 100));
    const o = outcome({ b, c: 0, N, margin, pHolm: mcnemarHarmP(b, 0), level: LEVEL });
    const g = guarded(survivalChangeU(survA - b, b, 0, failA, LEVEL), b, 0, N, LEVEL);
    const e = o.outcome === 'no material harm', u = g.lo > -margin;
    if (e) exact++; if (u) guard++; if (e && u) both++;
  }
  return { both: both / R, exact: exact / R, guard: guard / R };
};
const ROWS = [[0.998, 0.25], [0.99, 0.25], [0.95, 0.25], [0.9, 0.5], [0.75, 0.5], [0.46, 0.5]], PATHS = [8000, 16000];
console.log(`THE SURVIVAL RULE'S CALIBRATION: how often a true loss of exactly the margin PASSES (the exact rule AND the guarded unconditional interval; ${R} draws a row; nominal ${(100 * LEVEL / 2).toFixed(1)}%)`);
console.log('  survival  margin  paths | the rule (both)  the exact rule alone  the guarded interval alone');
let lo = 1, hi = 0;
for (const [surv, margin] of ROWS) for (const N of PATHS) {
  const x = rate(surv, N, margin, margin); lo = Math.min(lo, x.both); hi = Math.max(hi, x.both);
  console.log(`  ${(100 * surv).toFixed(1).padStart(6)}%  ${margin.toFixed(2)}  ${String(N).padStart(5)} | ${(100 * x.both).toFixed(2).padStart(14)}%  ${(100 * x.exact).toFixed(2).padStart(19)}%  ${(100 * x.guard).toFixed(2).padStart(26)}%`);
}
let blind = 0, shut = true;
for (const [surv, margin] of ROWS) { if (rate(surv, 8000, margin, 3 * margin).both >= 0.01) blind++; if (rate(surv, 16000, margin, 0).both > 0.5) shut = false; }
if (blind || shut) { console.log(`\nPLANTED CHECK FAILED: ${blind} rows pass a loss of three times the margin 1% of the time or more${shut ? '; no row passes a true change of 0' : ''}`); process.exit(1); }
console.log(`\nTHE RULE PASSES A TRUE LOSS AT THE MARGIN ${(100 * lo).toFixed(2)}% TO ${(100 * hi).toFixed(2)}% OF THE TIME, against the nominal ${(100 * LEVEL / 2).toFixed(1)}%`);
console.log('planted: a loss of three times the margin passes under 1% on every row (8,000 paths); a true change of 0 passes above 50% on some row (16,000 paths)');
