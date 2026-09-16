/*
 * IS THE POLICY THE APP APPLIES ACTUALLY THE BEST ONE?
 *
 * The Config tab's search scores eighteen candidates on 1,500 paths of one seed and applies the
 * survival-first winner. Every earlier study asked whether the SET of policies is right (dominance,
 * challengers, headroom). None asked the plainer question: on the day, with the seed and path count the
 * button actually uses, does the pick agree with what a far better estimate would have picked - and
 * when it does not, what did the household lose?
 *
 * "Truth" here is the same eighteen candidates on three independent seeds at 4,000 paths each, every
 * metric averaged across the seeds. It is not the truth, but it is eight times the evidence, and a pick
 * that disagrees with it by more than a tolerance is a pick the app got wrong in a way it could have
 * measured.
 *
 * Reported per household:
 *   agree          the app's winner is the truth's winner
 *   survival regret  truth survival of the truth winner minus truth survival of the app's winner, points
 *   material         the first priority, in default order, on which the app's winner trails the truth
 *                    winner by more than that priority's own tolerance - or none
 *   seed flip        whether a second seed at the app's own 1,500 paths picks a different winner
 *   cards            for each trade-off card the app would show: does its gain still exist at truth,
 *                    and how far is its stated survival cost from the truth's
 *
 * Usage: node optimality.mjs [everyNth=14] [appTrials=1500] [truthTrials=4000]
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';
import fs from 'fs';
import path from 'path';

const EVERY = Number(process.argv[2] || 14);
const APP_TRIALS = Number(process.argv[3] || 1500);
const TRUTH_TRIALS = Number(process.argv[4] || 4000);
const APP_SEED = 12345, FLIP_SEED = 777, TRUTH_SEEDS = [1001, 2002, 3003];
const OUT = path.join(import.meta.dirname, 'results', 'optimality.json');
const HEIR = [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 60000 }];
const KEYS = E.PRIORITY_KEYS;
const SHORT = { 'Bracket Fill Basic': 'TaxSmooth', 'Bracket Fill': 'BracketFill' };
const labelOf = (c) => `${SHORT[c.decumulationPolicy] || c.decumulationPolicy}/${c.drawdownStrategy === 'Full 25% Lump Sum' ? 'Lump' : 'Phased'}${c.harvestApplies ? (c.harvestPersonalAllowance ? '/harvest' : '/no-harvest') : ''}`;

const score = (cands, trials, seed) => cands.map(c => {
  const ctx = E.buildContext(E.resolveMpaa(c.planState));
  const stats = E.monteCarlo(ctx, { trials, seed });
  stats.postTaxInheritance = E.postTaxInheritanceFor(c.planState, ctx);
  return { ...c, label: labelOf(c), stats };
});
// the same candidates under several seeds, every metric averaged
const FIELDS = ['successRate', 'medianTerminal', 'p10TerminalAdj', 'p10Terminal', 'preNmpaFailRate', 'medianLifetimeTax', 'postTaxInheritance'];
const averaged = (runs) => runs[0].map((c, i) => {
  const stats = {};
  for (const f of FIELDS) {
    const xs = runs.map(r => r[i].stats[f]).filter(Number.isFinite);
    stats[f] = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : (runs[0][i].stats[f] ?? null);
  }
  return { ...c, stats };
});

const scenarios = buildScenarios().filter((_, i) => i % EVERY === 0);
const records = [];
const t0 = Date.now();
scenarios.forEach((sc, n) => {
  const plan = E.normalizePlan({ ...sc.plan, inheritance: { ...(sc.plan.inheritance || {}), beneficiaries: HEIR } });
  const cands = E.buildPolicyCandidates(plan);
  const app = score(cands, APP_TRIALS, APP_SEED);
  const flip = score(cands, APP_TRIALS, FLIP_SEED);
  const truth = averaged(TRUTH_SEEDS.map(s => score(cands, TRUTH_TRIALS, s)));
  const byId = (rows, id) => rows.find(r => r.id === id);

  const appPick = E.explainPick(app, { priorities: E.DEFAULT_PRIORITIES }).winner;
  const flipPick = E.explainPick(flip, { priorities: E.DEFAULT_PRIORITIES }).winner;
  const truthPick = E.explainPick(truth, { priorities: E.DEFAULT_PRIORITIES }).winner;
  const appAtTruth = byId(truth, appPick.id);

  // where, in the order the ranking walks, does the app's pick first trail the truth's by a real margin
  let material = null; const gaps = {};
  for (const k of E.DEFAULT_PRIORITIES) {
    const m = E.PRIORITY_METRICS[k];
    const a = m.get(appAtTruth.stats), t = m.get(truthPick.stats);
    const eps = E.toleranceFor(k, m.higherIsBetter ? Math.max(a, t) : Math.min(a, t));
    const gap = (m.higherIsBetter ? t - a : a - t) / (eps || 1);   // positive: truth's pick is better
    gaps[k] = gap;
    if (!material && gap > 1) material = k;
  }

  const cardsApp = E.buildTradeoffs(app).cards;
  const cards = cardsApp.map(card => {
    const altT = byId(truth, card.candidate.id), recT = byId(truth, E.buildTradeoffs(app).recommended.id);
    const gains = card.gains.map(g => {
      const m = E.PRIORITY_METRICS[g.key];
      const truthGain = (m.higherIsBetter ? 1 : -1) * (m.get(altT.stats) - m.get(recT.stats));
      const eps = E.toleranceFor(g.key, m.get(altT.stats));
      return { key: g.key, stated: g.delta, truth: truthGain, real: truthGain > 0, material: truthGain > eps };
    });
    const truthCost = recT.stats.successRate - altT.stats.successRate;
    return { id: card.candidate.id, gains, statedCostPts: card.survivePts, truthCostPts: truthCost, costError: Math.abs(truthCost - card.survivePts) };
  });

  records.push({
    id: sc.id, name: sc.name, tags: sc.tags,
    app: appPick.label, flip: flipPick.label, truth: truthPick.label,
    agree: appPick.id === truthPick.id, seedFlip: appPick.id !== flipPick.id,
    survivalRegretPts: truthPick.stats.successRate - appAtTruth.stats.successRate,
    bestSurvival: Math.max(...truth.map(c => c.stats.successRate)),
    material, gaps, cards
  });
  const rate = (Date.now() - t0) / (n + 1) / 1000;
  console.error(`  ${n + 1}/${scenarios.length} ${sc.id} app=${appPick.label} truth=${truthPick.label}${appPick.id === truthPick.id ? '' : '  <-- differs'} (${rate.toFixed(0)}s each, ~${Math.round(rate * (scenarios.length - n - 1) / 60)} min left)`);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ everyNth: EVERY, appTrials: APP_TRIALS, truthTrials: TRUTH_TRIALS, appSeed: APP_SEED, truthSeeds: TRUTH_SEEDS, generated: new Date().toISOString(), records }, null, 1));
});

// ------------------------------------------------------------------ the report
const n = records.length;
const pct = (k) => `${(100 * k / n).toFixed(1)}%`;
console.log(`\noptimality: ${n} households, app ${APP_TRIALS} paths x1 seed, truth ${TRUTH_TRIALS} paths x${TRUTH_SEEDS.length} seeds`);
const agree = records.filter(r => r.agree).length;
console.log(`app's winner is the truth's winner:        ${agree}/${n} (${pct(agree)})`);
const flips = records.filter(r => r.seedFlip).length;
console.log(`a second seed at the app's own paths flips: ${flips}/${n} (${pct(flips)})`);
const regrets = records.map(r => r.survivalRegretPts).sort((a, b) => a - b);
const q = (f) => regrets[Math.min(n - 1, Math.floor(f * n))].toFixed(2);
console.log(`survival regret, points: median ${q(0.5)}  90th ${q(0.9)}  max ${q(1)}`);
const mat = records.filter(r => r.material);
console.log(`materially worse than the truth's pick on some priority: ${mat.length}/${n} (${pct(mat.length)})`);
const byKey = {}; mat.forEach(r => { byKey[r.material] = (byKey[r.material] || 0) + 1; });
Object.entries(byKey).forEach(([k, v]) => console.log(`    first on ${E.PRIORITY_METRICS[k].label}: ${v}`));
mat.forEach(r => console.log(`    ${r.id} ${r.name}: app ${r.app} vs truth ${r.truth}, regret ${r.survivalRegretPts.toFixed(2)}pt, ${r.material} gap ${r.gaps[r.material].toFixed(2)}x`));
const allCards = records.flatMap(r => r.cards);
const gains = allCards.flatMap(c => c.gains);
console.log(`\ntrade-off cards: ${allCards.length} across ${n} households`);
console.log(`  stated gains that still exist at truth:   ${gains.filter(g => g.real).length}/${gains.length}`);
console.log(`  ...and still clear the tolerance:          ${gains.filter(g => g.material).length}/${gains.length}`);
const errs = allCards.map(c => c.costError).sort((a, b) => a - b);
if (errs.length) console.log(`  survival-cost error, points: median ${errs[Math.floor(errs.length / 2)].toFixed(2)}  max ${errs[errs.length - 1].toFixed(2)}`);
