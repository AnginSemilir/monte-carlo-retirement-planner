/*
 * 7AK'S DERIVATION (predictions/diag-7ak.md; PLAN.md 7ak). From P's records (results/diagP, gated by reduce-P.mjs,
 * results-P.txt), before any 7ak run:
 *   1. how many OPEN0 path-years under P disagree with their cell on bridge 4 and S194, years 1 to 7, on P's 16,000 node
 *      paths, and so about how many on 7ak's first 8,000 (half, P's paths being independent draws);
 *   2. the items' power: a share's binomial standard error at its thresholds (0.2 and 0.5) for that many disagreements, and
 *      how many standard errors apart the thresholds sit;
 *   3. item 4's resolution: the 95% half-width of the boundary's excess mispricing at year 1 for the paths the two units
 *      and two rules give (8,000 a run), split evenly and at one boundary path in ten, at the node's survival.
 *   node research/solver/derive-7ak.mjs > research/solver/results-derive-7ak.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagP');
const LOG = /^\s+log (\S+) OPEN0 year (\d+): held (\d+) fwdLeave \d+ cellLeave \d+ fwdHoldCellLeave (\d+) fwdLeaveCellHold (\d+)/;
const NODE = /^\s+node \S+ 0 z \S+: TS\+J (\S+) held0 \d+ OPEN0 (\S+)/;
const files = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
console.log("7AK'S DERIVATION (P's records, results/diagP): the disagreements 7ak re-scores, and its power");
const Z = 1.959963984540054, se = (p, n) => Math.sqrt(p * (1 - p) / n);
let surv = [];
for (const [id, job] of [['bridge 4', 'core:P READER'], ['S194', 'core:P OFF']]) {
  const t = files.find(x => new RegExp(`^${id}\\s+case \\| job ${job}/`, 'm').test(x));
  if (!t) { console.log(`DERIVATION FAILED: no ${id} ${job} log`); process.exit(1); }
  let held = 0, dis = 0; for (const l of t.split('\n')) { const m = LOG.exec(l); if (m && +m[2] <= 7) { held += +m[3]; dis += +m[4] + +m[5]; } }
  const nd = t.split('\n').map(l => NODE.exec(l)).find(Boolean); surv.push(+nd[1], +nd[2]);
  const n8 = Math.round(dis / 2);
  console.log(`  ${id.padEnd(9)} P's 16,000 node paths, years 1 to 7: held ${held}, disagreements ${dis}; about ${n8} on 7ak's 8,000`);
  if (n8 > 0) console.log(`  ${''.padEnd(9)} a share's standard error at ${n8} disagreements: ${(100 * se(0.2, n8)).toFixed(2)} points at 0.2, ${(100 * se(0.5, n8)).toFixed(2)} at 0.5 - the thresholds ${((0.5 - 0.2) / se(0.35, n8)).toFixed(0)} standard errors apart (if every one were live)`);
}
const s = surv.reduce((t, x) => t + x, 0) / surv.length / 100, N = 4 * 8000;
for (const [f, name] of [[0.5, 'evenly'], [0.1, 'one path in ten on a boundary']]) {
  const nb = N * f, ni = N - nb, hw = Z * 100 * Math.sqrt(s * (1 - s) / nb + s * (1 - s) / ni);
  console.log(`  item 4 at ${N} year-1 paths split ${name}: the boundary's excess mispricing resolved to +/- ${hw.toFixed(2)} points (node survival about ${(100 * s).toFixed(1)}%)`);
}
