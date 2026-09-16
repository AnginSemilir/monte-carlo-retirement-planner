/*
 * HOW MANY PATHS DOES THE LIVE SEARCH NEED?
 *
 * optimality.mjs establishes a "truth" per household - the eighteen candidates on three independent
 * seeds at 4,000 paths - and reports how often the app's own pick agrees with it. This asks the
 * follow-up: at what path count does the agreement stop improving enough to be worth the wait?
 *
 * For each trial count, every household in optimality.json is searched twice at that count - once on
 * the app's own seed, once on a second seed - and two things are counted: agreement with the recorded
 * truth, and whether the two seeds agreed with each other. The second is the one a user would notice:
 * it is the same plan, searched twice, giving two answers.
 *
 * The run that set TOURNAMENT_TRIALS (30 households):
 *     1,500 paths  agrees with truth 70%   second seed flips 27%
 *     2,500 paths  agrees with truth 80%   second seed flips 20%
 *     4,000 paths  agrees with truth 90%   second seed flips 20%
 * The flip rate flattening at 20% is not a defect in the search: on 4 of the 30 households the three
 * truth seeds disagreed with each other, so those candidates are indistinguishable at any budget.
 *
 * Usage: node trials-vs-truth.mjs [results/optimality.json] [trialCounts=1500,2500,4000]
 */
import fs from 'fs';
import path from 'path';
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';

const file = process.argv[2] || path.join(import.meta.dirname, 'results', 'optimality.json');
const COUNTS = (process.argv[3] || '1500,2500,4000').split(',').map(Number);
const opt = JSON.parse(fs.readFileSync(file, 'utf8'));
const scs = buildScenarios();
const HEIR = [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 60000 }];
const SHORT = { 'Bracket Fill Basic': 'TaxSmooth', 'Bracket Fill': 'BracketFill' };
const labelOf = (c) => `${SHORT[c.decumulationPolicy] || c.decumulationPolicy}/${c.drawdownStrategy === 'Full 25% Lump Sum' ? 'Lump' : 'Phased'}${c.harvestApplies ? (c.harvestPersonalAllowance ? '/harvest' : '/no-harvest') : ''}`;
const score = (cands, trials, seed) => cands.map(c => {
  const ctx = E.buildContext(E.resolveMpaa(c.planState));
  const stats = E.monteCarlo(ctx, { trials, seed });
  stats.postTaxInheritance = E.postTaxInheritanceFor(c.planState, ctx);
  return { ...c, label: labelOf(c), stats };
});

console.log(`trials-vs-truth: ${opt.records.length} households, truth = ${opt.truthTrials} paths x ${opt.truthSeeds.length} seeds`);
for (const trials of COUNTS) {
  let agree = 0, flip = 0;
  for (const r of opt.records) {
    const sc = scs[Number(r.id.slice(1))];
    const plan = E.normalizePlan({ ...sc.plan, inheritance: { ...(sc.plan.inheritance || {}), beneficiaries: HEIR } });
    const cands = E.buildPolicyCandidates(plan);
    const a = E.explainPick(score(cands, trials, opt.appSeed), { priorities: E.DEFAULT_PRIORITIES }).winner.label;
    const b = E.explainPick(score(cands, trials, 777), { priorities: E.DEFAULT_PRIORITIES }).winner.label;
    if (a === r.truth) agree++;
    if (a !== b) flip++;
  }
  const n = opt.records.length;
  console.log(`  ${String(trials).padStart(6)} paths  agrees with truth ${agree}/${n} (${(100 * agree / n).toFixed(0)}%)   second seed flips ${flip}/${n} (${(100 * flip / n).toFixed(0)}%)`);
}
