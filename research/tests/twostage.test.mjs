/*
 * THE TWO-STAGE RULE'S EXACT RATES (the review of 9 Nov, item 9; D66): size-phase4.mjs twoStageRate. After n1 paths a unit
 * stops, read as not harmed, when its observed change is +b1 points or more; every other unit runs to N and is read at N.
 * The rates are binomial sums (no simulation error); the review's twostage.py (400,000 runs a case,
 * research/reviews/2026-11-09/results/out-twostage.txt on review/external-2026-10-21) is the check on them, not the evidence.
 *   1. one stage: never stopping (b1 = Infinity), the two-stage rate is harmRate's at D34's lattice threshold, with the first
 *      stage at n1 = 5,000 and at n1 = N (the second stage's convolution adds nothing);
 *   2. D4's rule (the threshold at the realised discordance's upper bound, 'realised'): never stopping, the rate the same
 *      split at 5,000 paths and unsplit (the convolution under a threshold that moves with K);
 *   3. the review's figures: every flag rate, stop rate and mean of paths in out-twostage.txt within 0.002 of the exact one
 *      (the item's STOP), the largest difference printed with its multiple of the simulation's se;
 *   4. not vacuous: at a true gain of 1 point most units stop at 5,000 paths, at a true 1-point loss almost none do;
 *   5. what the rule is for: the 1-point rate under two stages (5,000 paths, +0.5) within 0.001 of one stage's at 9% and at
 *      12.45% discordance, under the normal rule and under D4's.
 * The plant (TWO_STAGE.plant 'bothways'): the stop applied to an observed loss as well as a gain. The 1-point rate falls:
 * checks 3, 4 (units stop at a loss) and 5 fail. --plants runs it and reads which checks fail.
 *   node research/tests/twostage.test.mjs [--plants]
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { twoStageRate, harmRate, thresholdFor, TWO_STAGE, TWO_STAGE_CASES } from '../solver/size-phase4.mjs';

const SELF = fileURLToPath(import.meta.url);
const PLANTS = { bothways: [3, 4, 5] };
if (process.argv.includes('--plants')) {
  let bad = 0;
  for (const [p, want] of Object.entries(PLANTS)) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, TWO_STAGE_PLANT: p }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^ {2}FAIL (\d+)\./gm)].map(m => Number(m[1])))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    if (!exact) bad++;
    console.log(`  plant ${p.padEnd(9)} fails ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) console.log(r.stdout + r.stderr);
  }
  console.log(bad ? `\n${bad} plant(s) not exact` : '\nall plants exact');
  process.exit(bad ? 1 : 0);
}
TWO_STAGE.plant = process.env.TWO_STAGE_PLANT || '';
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const N = TWO_STAGE_CASES.N;
console.log(`twostage: the two-stage rule's exact rates (size-phase4.mjs), N ${N}${TWO_STAGE.plant ? `; planted: ${TWO_STAGE.plant}` : ''}`);

// 1. one stage, D34's lattice threshold
{
  let worst = 0; const rows = [];
  for (const d of [0.09, 0.1245]) {
    const t = thresholdFor(d, N);
    for (const D of [0.25, 1]) {
      const h = harmRate(d, N, t, D), a = twoStageRate(d, N, t, D, 5000, Infinity).flag, b = twoStageRate(d, N, t, D, N, Infinity).flag;
      worst = Math.max(worst, Math.abs(a - h), Math.abs(b - h)); rows.push(`d ${(100 * d).toFixed(2)}% loss ${D}: ${h.toFixed(6)}`);
    }
  }
  ok(1, 'never stopping, the two-stage rate is harmRate\'s at D34\'s lattice threshold (first stage at 5,000 paths and at N)', worst < 1e-8, `the largest difference ${worst.toExponential(2)}; ${rows.join('; ')}`);
}
// 2. D4's rule, split and unsplit
{
  let worst = 0; const rows = [];
  for (const d of [0.09, 0.1245]) for (const D of [0.25, 1]) {
    const a = twoStageRate(d, N, 'realised', D, 5000, Infinity).flag, b = twoStageRate(d, N, 'realised', D, N, Infinity).flag;
    worst = Math.max(worst, Math.abs(a - b)); rows.push(`d ${(100 * d).toFixed(2)}% loss ${D}: ${b.toFixed(6)}`);
  }
  ok(2, 'D4\'s rule (the threshold at the realised discordance\'s upper bound), never stopping: the rate the same split at 5,000 paths and unsplit', worst < 1e-8, `the largest difference ${worst.toExponential(2)}; ${rows.join('; ')}`);
}
// 3. the review's simulated figures (twostage.py, 400,000 runs a case; out-twostage.txt as printed)
const SIM = {
  '5000/0.5': { loss: [[0.9648, 0.9647, 0.0002], [0.0497, 0.0497, 0.0409], [0.9010, 0.9005, 0.0014], [0.0503, 0.0502, 0.0685]], gain: [[0.137, 17088], [0.509, 11868], [0.873, 6776], [1.000, 5004], [1.000, 5000], [1.000, 5000]] },
  '5000/0': { loss: [[0.9641, 0.9572, 0.0100], [0.0508, 0.0492, 0.2859], [0.9014, 0.8887, 0.0238], [0.0506, 0.0485, 0.3139]], gain: [[0.509, 11873], [0.873, 6775], [0.988, 5165], [1.000, 5000], [1.000, 5000], [1.000, 5000]] },
  '4000/0.5': { loss: [[0.9649, 0.9644, 0.0008], [0.0498, 0.0497, 0.0599], [0.9015, 0.8999, 0.0037], [0.0502, 0.0500, 0.0934]], gain: [[0.165, 16531], [0.509, 11365], [0.847, 6291], [0.999, 4019], [1.000, 4000], [1.000, 4000]] }
};
const REPS = 400000;
let tbl = null;
{
  let worst = { diff: 0 }, n = 0;
  const seen = (diff, sim, what, digits) => {
    n++;
    const rounding = 0.5 * 10 ** -digits, se = Math.sqrt(Math.max(sim * (1 - sim), 1e-12) / REPS);
    if (diff > worst.diff) worst = { diff, what, z: Math.max(0, diff - rounding) / se };
  };
  tbl = [];
  for (const [n1, b1] of TWO_STAGE_CASES.stages) {
    const S = SIM[`${n1}/${b1}`];
    TWO_STAGE_CASES.losses.forEach(([d, D], i) => {
      const one = twoStageRate(d, N, 'normal', D, N, Infinity).flag, two = twoStageRate(d, N, 'normal', D, n1, b1);
      const [s1, s2, ss] = S.loss[i];
      seen(Math.abs(one - s1), s1, `${n1}/${b1} d ${(100 * d).toFixed(2)}% loss ${D}, one stage ${one.toFixed(4)} against ${s1}`, 4);
      seen(Math.abs(two.flag - s2), s2, `${n1}/${b1} d ${(100 * d).toFixed(2)}% loss ${D}, two stages ${two.flag.toFixed(4)} against ${s2}`, 4);
      seen(Math.abs(two.stop - ss), ss, `${n1}/${b1} d ${(100 * d).toFixed(2)}% loss ${D}, stopped ${two.stop.toFixed(4)} against ${ss}`, 4);
      tbl.push(`${n1}/${b1} d ${(100 * d).toFixed(2)}% loss ${D}: one ${one.toFixed(4)} (${s1}) two ${two.flag.toFixed(4)} (${s2}) stopped ${two.stop.toFixed(4)} (${ss})`);
    });
    TWO_STAGE_CASES.gains.forEach(([d, G], i) => {
      const r = twoStageRate(d, N, 'normal', -G, n1, b1), [ss, sp] = S.gain[i];
      seen(Math.abs(r.stop - ss), ss, `${n1}/${b1} d ${(100 * d).toFixed(1)}% gain ${G}, stopped ${r.stop.toFixed(4)} against ${ss}`, 3);
      seen(Math.abs(r.paths - sp) / (N - n1), ss, `${n1}/${b1} d ${(100 * d).toFixed(1)}% gain ${G}, ${r.paths.toFixed(0)} paths against ${sp} (as a share of the second stage)`, 0);
      tbl.push(`${n1}/${b1} d ${(100 * d).toFixed(1)}% gain ${G}: stopped ${r.stop.toFixed(4)} (${ss}) paths ${r.paths.toFixed(0)} (${sp})`);
    });
  }
  ok(3, 'the review\'s figures (twostage.py, 400,000 runs a case): every flag rate, stop rate and mean of paths within 0.002 of the exact one', worst.diff <= 0.002,
    `${n} figures; the largest difference ${worst.diff.toFixed(4)} (${worst.what}; ${worst.z.toFixed(1)} of the simulation's se past its rounding)`);
}
// 4. not vacuous
{
  const g = twoStageRate(0.10, N, 'normal', -1, 5000, 0.5), l = twoStageRate(0.09, N, 'normal', 1, 5000, 0.5);
  ok(4, 'not vacuous: at a true 1-point gain most units stop at 5,000 paths, at a true 1-point loss almost none do', g.stop > 0.5 && l.stop < 0.01, `stopped ${g.stop.toFixed(4)} at a gain (${g.paths.toFixed(0)} paths on average), ${l.stop.toFixed(4)} at a loss`);
}
// 5. the 1-point rate kept
{
  const rows = []; let worst = 0;
  for (const t of ['normal', 'realised']) for (const d of [0.09, 0.1245]) {
    const one = twoStageRate(d, N, t, 1, N, Infinity).flag, two = twoStageRate(d, N, t, 1, 5000, 0.5).flag;
    worst = Math.max(worst, one - two); rows.push(`${t} d ${(100 * d).toFixed(2)}%: ${one.toFixed(4)} one stage, ${two.toFixed(4)} two`);
  }
  ok(5, 'the 1-point rate under two stages (5,000 paths, +0.5) within 0.001 of one stage\'s, the normal rule and D4\'s', worst <= 0.001, `the largest fall ${worst.toFixed(4)}; ${rows.join('; ')}`);
}
console.log('\nthe table (exact, the review\'s simulated in brackets):\n' + tbl.map(s => '  ' + s).join('\n'));
console.log(`\ntwostage: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
