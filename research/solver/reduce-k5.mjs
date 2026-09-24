/*
 * REDUCER FOR K5 (PLAN.md "K5. Guardrail matching"): the guardrails-with-floor targets, and the grid against them.
 *
 *   node research/solver/reduce-k5.mjs targets             the targets under each world / cap / minimum-pot setting
 *   TARGET=k5t-fold-cap node research/solver/reduce-k5.mjs  the stage-1 grid (results/k5-c<c>-x<exp>) against a target
 *   TARGET=k5t-fold-cap node research/solver/reduce-k5.mjs records   the same, the solver's figures recomputed from its
 *     per-path records (see RECORDS below: the JSON's cut, depth and raise are wrong wherever paths fail)
 *   (the grid is refused unless every cell passes the fair-test gate against the target; FAIR_ACCEPT names any accepted difference)
 *
 * The target must be measured under the SAME settings as the solver cells it is compared with: the market world
 * (MIX), the raise cap (the guardrails honour the user's cap, M23) and the minimum pot. Stage 1's cells are MIX=0,
 * RAISECAP=1.1, MINPOTYEARS=1, so their target is k5t-fold-cap. Found 24 Sep ~08:45: the first target used,
 * results/flex-tiers, was the mixture world, uncapped, with each plan's own pot - three mismatches.
 *
 * total cut = years below target x (1 - level when below), in years of target spending (per household, means over
 * the 3,000 held paths, seed 7002); raise total = years above x (level when above - 1). Medians over households.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFair } from './fair-gate.mjs';
import { readRecord } from './record.mjs';
const D = join(dirname(fileURLToPath(import.meta.url)), 'results');
const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const load = (tag, id, arm) => { const p = join(D, tag, `${id}.json`); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))[arm] : null; };
const cut = g => g.belowYearsMean * (1 - g.levelWhenBelowMean);
const raise = g => g.aboveTargetYearsMean * (g.levelWhenAboveMean - 1);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const IDS = readdirSync(join(D, 'k5t-fold-cap')).filter(x => /^S\d+\.json$/.test(x)).map(x => x.slice(0, -5)).sort();

if (process.argv[2] === 'targets') {
  const SETS = [
    ['flex-tiers', 'mixture, no cap, own pot (the target first used)'],
    ['k5t-mix-nocap-ownpot', 'mixture, no cap, own pot (re-run: must reproduce flex-tiers)'],
    ['k5t-mix-nocap', 'mixture, no cap, 1-year pot'],
    ['k5t-mix-cap', 'mixture, cap 1.1, 1-year pot (stage 3 and Phase 4)'],
    ['k5t-fold-nocap', 'fold, no cap, 1-year pot'],
    ['k5t-fold-cap', 'fold, cap 1.1, 1-year pot (stage 1)']
  ].filter(([t]) => existsSync(join(D, t)));
  console.log(`K5 TARGETS: the guardrails with the floor (gkFloor), ${IDS.length} households, 3,000 held paths (seed 7002)`);
  console.log('  per household: years below @ level when below / total cut / raise total / survival');
  for (const id of IDS) console.log(`  ${id}  ${SETS.map(([t]) => { const g = load(t, id, 'gkFloor'); return g ? `${f(g.belowYearsMean, 1).padStart(4)}@${f(g.levelWhenBelowMean, 3)} ${f(cut(g))} ${f(raise(g))} ${f(g.successRate, 1).padStart(5)}` : '-'; }).join(' | ')}`);
  console.log('  medians over the households:');
  for (const [t, what] of SETS) {
    const gs = IDS.map(id => load(t, id, 'gkFloor')).filter(Boolean);
    console.log(`  ${t.padEnd(22)} total cut ${f(med(gs.map(cut)))} (${f(Math.min(...gs.map(cut)))}-${f(Math.max(...gs.map(cut)))})  depth ${f(med(gs.map(g => g.levelWhenBelowMean)), 3)}  years below ${f(med(gs.map(g => g.belowYearsMean)), 1)}  raise total ${f(med(gs.map(raise)))}  survival ${f(med(gs.map(g => g.successRate)), 1)}   ${what}`);
  }
  process.exit(0);
}

const TARGET = process.env.TARGET || 'k5t-fold-cap';
const RECORDS = process.argv[2] === 'records';
// the fair-test gate (RULES.md): every cell against the target, before any figure is printed
requireFair(readdirSync(D).filter(t => /^k5-c[\d.]+-x[\d.]+$/.test(t)).sort().map(t => [t, `${TARGET}:gkFloor`, {}]), { compact: true });
const tg = IDS.map(id => load(TARGET, id, 'gkFloor'));
/*
 * RECORDS (the eighteenth review, 24 Sep 15:06 UK): `runPolicy` returned early on a failed path WITHOUT `belowSum` and
 * `aboveSum` (src/solver/solve.js, fixed 24 Sep), and experiment.mjs's statsFlex read them as 0 - so every below- and
 * above-target year of a failed path counted at level 0 in the solver's levelWhenBelowMean / levelWhenAboveMean: its depth
 * too low, its total cut too high and its raise total too low, wherever paths fail. The guardrails' arm (runFixedPath)
 * returns both sums and is unaffected. This mode rebuilds each solver file's figures from its per-path record: every
 * spend year's level from the trace, and a failed path's last year from its level sum (the trace stops before it).
 * It first shows that zeroing the failed paths' sums reproduces the JSON - the bug, reproduced from the records.
 */
let maxRepro = 0; const seenRepro = new Set();
function fromRecord(tag, id, s) {
  const R = readRecord(join(D, tag, `${id}.solver.record.json.gz`));
  const { N, Y } = R, flags = R.meta.spendYears;
  let belowY = 0, belowL = 0, aboveY = 0, aboveL = 0, spendY = 0, belowLbug = 0, aboveLbug = 0;
  for (let i = 0; i < N; i++) {
    const f = R.trace.failYear[i];
    let n = 0, traced = 0, bl = 0, al = 0;
    for (let t = 0; t < Y; t++) if (flags[t] && (f < 0 || t <= f)) n++;
    for (let t = 0; t < Y; t++) {
      if (!flags[t] || (f >= 0 && t >= f)) continue;
      const l = R.trace.level[i * Y + t] / 100; traced += l;
      if (l < 1 - 1e-9) { belowY++; bl += l; } else if (l > 1 + 1e-9) { aboveY++; al += l; }
    }
    if (f >= 0 && flags[f]) { const lf = R.paths.meanLevel[i] * n - traced; if (lf < 1 - 1e-6) { belowY++; bl += lf; } else if (lf > 1 + 1e-6) { aboveY++; al += lf; } }
    belowL += bl; aboveL += al; spendY += n;
    if (f < 0) { belowLbug += bl; aboveLbug += al; }   // what statsFlex saw: nothing from a failed path
  }
  const fixed = { ...s, belowYearsMean: belowY / N, aboveTargetYearsMean: aboveY / N, levelWhenBelowMean: belowY ? belowL / belowY : null, levelWhenAboveMean: aboveY ? aboveL / aboveY : null, spendYearsMean: spendY / N };
  if (belowY && Number.isFinite(s.levelWhenBelowMean)) { maxRepro = Math.max(maxRepro, Math.abs(belowLbug / belowY - s.levelWhenBelowMean)); seenRepro.add(`${tag}/${id}`); }
  return fixed;
}
const solverOf = (tag, id) => { const s = load(tag, id, 'solver'); return s && RECORDS ? fromRecord(tag, id, s) : s; };
const tCut = med(tg.map(cut)), tDepth = med(tg.map(g => g.levelWhenBelowMean)), tRaise = med(tg.map(raise));
console.log(`K5 STAGE 1${RECORDS ? ' (the solver\'s figures from its per-path records)' : ''} against ${TARGET}: guardrails' median total cut ${f(tCut)}, depth ${f(tDepth, 3)}, raise total ${f(tRaise)}`);
console.log('  match (i) median total cut within 10%; (ii) median depth within 0.03; R4: stage 2 runs if the median raise total is outside +/-10% of the target');
const cells = readdirSync(D).map(t => /^k5-c([\d.]+)-x([\d.]+)$/.exec(t)).filter(Boolean).map(m => ({ tag: m[0], c: Number(m[1]), x: Number(m[2]) })).sort((a, b) => a.x - b.x || a.c - b.c);
for (const { tag, c, x } of cells) {
  const sv = IDS.map(id => solverOf(tag, id));
  const n = sv.filter(Boolean).length;
  if (!n) continue;
  const have = IDS.map((id, i) => [sv[i], tg[i]]).filter(([s]) => s);
  const sCut = med(have.map(([s]) => cut(s))), sDepth = med(have.map(([s]) => s.levelWhenBelowMean).filter(Number.isFinite)), sRaise = med(have.map(([s]) => raise(s)));
  const ahead = have.filter(([s, g]) => s.successRate >= g.successRate).length;
  const ok1 = Math.abs(sCut / tCut - 1) <= 0.1, ok2 = Math.abs(sDepth - tDepth) <= 0.03;
  console.log(`  c ${String(c).padEnd(6)} exp ${x}  n ${String(n).padStart(2)}  total cut ${f(sCut)} (${f(100 * (sCut / tCut - 1), 0).padStart(4)}%)${ok1 ? ' OK' : '   '}  depth ${f(sDepth, 3)}${ok2 ? ' OK' : '   '}  raise total ${f(sRaise)} (${f(100 * (sRaise / tRaise - 1), 0)}%)  survival at/above the guardrails' on ${ahead}/${n}`);
}

// PER HOUSEHOLD (the seventeenth review, 24 Sep: the medians hid that S070 cuts MORE than the guardrails at every point
// and delivers less spending). Spending delivered = years spent - total cut + raise total, in years of target spending
// (means over the held paths), against the guardrails' own figure.
console.log('\n  per household across the grid points: cuts more than the guardrails at | spending delivered against the guardrails\' (mean over paths; and gate 4\'s measure, the mean level on the median path and the unlucky tenth) | survival difference (points)');
const grid = cells.map(({ tag }) => tag);
const delivered = g => g.spendYearsMean - cut(g) + raise(g);
for (const [i, id] of IDS.entries()) {
  const g = tg[i];
  const pts = grid.map(t => solverOf(t, id)).filter(Boolean);
  if (!pts.length || !g) continue;
  const more = pts.filter(s => cut(s) > cut(g)).length;
  const dSpend = pts.map(s => 100 * (delivered(s) / delivered(g) - 1)), dSurv = pts.map(s => s.successRate - g.successRate);
  // gate 4's own measure (Phase 4 reports it): the mean spending level over a path's retired years, on the median path
  // and the unlucky tenth - from the level sum, which the failed-path bug did not touch
  const dMed = pts.map(s => 100 * (s.meanLevelMedian / g.meanLevelMedian - 1)), dP10 = pts.map(s => 100 * (s.meanLevelP10 / g.meanLevelP10 - 1));
  console.log(`  ${id}  guardrails cut ${f(cut(g))}, solver ${f(Math.min(...pts.map(cut)))}-${f(Math.max(...pts.map(cut)))}  |  cuts more at ${String(more).padStart(2)}/${pts.length}  |  spending ${f(Math.min(...dSpend), 1)}% to ${f(Math.max(...dSpend), 1)}% (median path ${f(Math.min(...dMed), 1)} to ${f(Math.max(...dMed), 1)}, unlucky tenth ${f(Math.min(...dP10), 1)} to ${f(Math.max(...dP10), 1)})  |  survival ${f(Math.min(...dSurv), 1)} to ${f(Math.max(...dSurv), 1)}`);
}
if (RECORDS) console.log(`\n  the bug reproduced from the records: zeroing the failed paths' below-target sums gives the JSON's depth to within ${maxRepro.toExponential(1)} on all ${seenRepro.size} solver files (the trace stores each level to 0.01)`);
