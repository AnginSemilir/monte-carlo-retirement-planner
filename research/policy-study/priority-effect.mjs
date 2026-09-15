/*
 * DOES THE PRIORITY ORDER CHANGE THE ANSWER, AND IN THE DIRECTION THE HOUSEHOLD MEANT?
 *
 * Three studies already ask nearby questions. `priority-sense` asks whether ranking a priority delivers
 * that priority; `priority-loss` asks what ranking one LAST costs; `priority-tradeoff` asks how far the
 * lexicographic order can push a lower priority down. None of them asks the plainest question of all:
 * how often does changing the order change the recommendation at all?
 *
 * It matters because the control looks decisive and may not be. On the reference household, four of the
 * six orderings returned the same policy - survival ran 99.60% to 100.00% across all eighteen
 * candidates, so ranking it first decided nothing. It declared a tie and handed the choice straight
 * down. If that is typical rather than peculiar, the tab is offering six equal-looking levers of which
 * two do anything, and saying nothing about which.
 *
 * WHAT IS MEASURED, per household:
 *
 *   1 CHANGE RATE      does ranking metric M FIRST return a different policy from ranking it LAST?
 *
 *                      First against the DEFAULT order looks like the natural test and is not one, and
 *                      the first run of this study fell for it. The default order already begins with
 *                      survival, so "rank survival first" IS the default: it returned a different
 *                      policy in 0 of 360 households, which reads as a damning finding about the
 *                      control and is in fact a tautology. Downside sits second and was nearly as
 *                      compromised. Moving a priority from the bottom of the list to the top is the
 *                      contrast that actually asks the question, and it asks it identically of all six.
 *   2 INTENT DELIVERED when it changes, is the chosen candidate BETTER on M than the default winner
 *                      was - measured in multiples of M's own tolerance, so points and pounds compare?
 *                      Worse is possible and is the interesting case: M only narrows to within an
 *                      epsilon of the best, and the priorities below it then choose inside that band,
 *                      so a household can rank tax first and land a fraction worse on tax than it
 *                      would have by accident.
 *   3 WHY NOT          when it does not change, was M tied across the candidates - spread under one
 *                      tolerance - or did it genuinely differ and the ranking still pick the same one?
 *   4 DISTINCT ANSWERS how many of the seven settings give different policies. One means the control
 *                      is inert for that household; seven means it is the dominant input.
 *
 * THE ONE EFFICIENCY THAT MAKES THIS AFFORDABLE: the Monte Carlo does not depend on the priority order.
 * Run the candidates ONCE per household and rank the same set seven ways, and seven orderings cost what
 * one costs. Everything below the simulation is arithmetic on numbers already in hand.
 *
 * Usage: node priority-effect.mjs [everyNth] [trials]
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';
import fs from 'fs';
import path from 'path';

const EVERY = Number(process.argv[2] || 3);
const TRIALS = Number(process.argv[3] || 1200);
const SEED = 12345;
const OUT_DIR = path.join(import.meta.dirname, 'results');
const OUT = path.join(OUT_DIR, 'priority-effect.json');
const PARTIAL = path.join(OUT_DIR, 'priority-effect.partial.json');

// the bequest metric needs somebody to inherit, or it silently falls back to the gross pot
const HEIR = [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 60000 }];
const KEYS = E.PRIORITY_KEYS;
const DEFAULT = E.DEFAULT_PRIORITIES;

const SHORT = { 'Bracket Fill Basic': 'TaxSmooth', 'Bracket Fill': 'BracketFill', 'Sequential': 'Sequential' };
const labelOf = (c) => `${SHORT[c.decumulationPolicy] || c.decumulationPolicy}/${
  c.drawdownStrategy === 'Full 25% Lump Sum' ? 'Lump' : 'Phased'}${
  c.harvestApplies ? (c.harvestPersonalAllowance ? '/harvest' : '/no-harvest') : ''}`;

const scenarios = buildScenarios().filter((_, i) => i % EVERY === 0);
console.error(`priority-effect: ${scenarios.length} households, ${TRIALS} paths, seed ${SEED}`);
fs.mkdirSync(OUT_DIR, { recursive: true });

/*
 * Resume from the partial rather than starting over. A twenty-minute run that dies at 105 households
 * has done real work, and the records are complete per household - there is no half-written one to
 * distrust. Delete the partial to force a clean run.
 */
const records = [];
if (fs.existsSync(PARTIAL)) {
  try {
    const prev = JSON.parse(fs.readFileSync(PARTIAL, 'utf8'));
    if (prev.trials === TRIALS && prev.seed === SEED && Array.isArray(prev.records)) {
      records.push(...prev.records);
      console.error(`  resuming: ${records.length} households already done`);
    } else {
      console.error('  partial found but run settings differ - starting over');
    }
  } catch { console.error('  partial unreadable - starting over'); }
}
const done = new Set(records.map(r => r.id));
const t0 = Date.now();

for (let n = 0; n < scenarios.length; n++) {
  const sc = scenarios[n];
  if (done.has(sc.id)) continue;
  // an heir is added so the bequest priority ranks on what heirs receive rather than on the gross pot
  const plan = E.normalizePlan({
    ...sc.plan,
    inheritance: { ...(sc.plan.inheritance || {}), beneficiaries: HEIR }
  });

  let cands;
  try {
    cands = E.buildPolicyCandidates(plan).map((c) => {
      const cctx = E.buildContext(E.resolveMpaa(c.planState));
      const stats = E.monteCarlo(cctx, { trials: TRIALS, seed: SEED });
      stats.postTaxInheritance = E.postTaxInheritanceFor(c.planState, cctx);
      return { ...c, label: labelOf(c), stats };
    });
  } catch (err) {
    console.error(`  ${sc.id}: skipped (${err && err.message})`);
    continue;
  }
  if (cands.length < 2) { console.error(`  ${sc.id}: skipped (only ${cands.length} candidate)`); continue; }

  const rankBy = (priorities) => E.explainPick(cands, { priorities });
  const base = rankBy(DEFAULT);

  const rec = {
    id: sc.id, name: sc.name, tags: sc.tags,
    candidates: cands.length,
    baseline: base.winner.label,
    // what the whole field looks like on each metric, which is what decides whether a priority CAN bite
    metrics: {},
    byFirst: {},
    balanced: null
  };

  for (const key of KEYS) {
    const m = E.PRIORITY_METRICS[key];
    const vals = cands.map(c => m.get(c.stats));
    const best = m.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = m.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    const eps = E.toleranceFor(key, best);
    rec.metrics[key] = { best, worst, eps, spread: eps > 0 ? Math.abs(best - worst) / eps : 0 };
  }

  for (const key of KEYS) {
    const m = E.PRIORITY_METRICS[key];
    const eps = rec.metrics[key].eps;
    const score = (w) => m.get(w.stats);
    // in multiples of this priority's own tolerance, signed so positive always means "more of it"
    const gap = (a, b) => (eps > 0 ? ((m.higherIsBetter ? score(a) - score(b) : score(b) - score(a)) / eps) : 0);

    const first = rankBy([key, ...DEFAULT.filter(k => k !== key)]);
    const last = rankBy([...DEFAULT.filter(k => k !== key), key]);
    const gainEps = gap(first.winner, last.winner);

    rec.byFirst[key] = {
      winner: first.winner.label,
      // the honest contrast: bottom of the list against top of it
      lastWinner: last.winner.label,
      changed: first.winner.label !== last.winner.label,
      gainEps,
      intent: Math.abs(gainEps) < 1e-9 ? 'same' : gainEps > 0 ? 'better' : 'worse',
      // kept alongside, clearly labelled, because "what the app would have done" is still worth knowing
      changedVsDefault: first.winner.label !== base.winner.label,
      gainVsDefaultEps: gap(first.winner, base.winner),
      decidedIt: (first.consulted[0] && first.consulted[0].decided) || false,
      tiedOnIt: !!(first.consulted[0] && !first.consulted[0].decided),
      consulted: first.consulted.map(c => ({ key: c.key, decided: c.decided, ruledOut: c.ruledOut, spread: c.spread })),
      settledAfter: first.settledAfter
    };
  }

  const bal = E.pickBalanced(cands);
  rec.balanced = { winner: bal.label, changed: bal.label !== base.winner.label };

  const answers = new Set([base.winner.label, ...KEYS.map(k => rec.byFirst[k].winner), bal.label]);
  rec.distinctAnswers = answers.size;

  records.push(rec);
  if ((n + 1) % 5 === 0 || n === scenarios.length - 1) {
    fs.writeFileSync(PARTIAL, JSON.stringify({ everyNth: EVERY, trials: TRIALS, seed: SEED, done: n + 1, total: scenarios.length, records }, null, 1));
    const rate = (Date.now() - t0) / (n + 1) / 1000;
    console.error(`  ${n + 1}/${scenarios.length}  (${rate.toFixed(1)}s each, ~${Math.round(rate * (scenarios.length - n - 1) / 60)} min left)`);
  }
}

fs.writeFileSync(OUT, JSON.stringify({ everyNth: EVERY, trials: TRIALS, seed: SEED, generated: new Date().toISOString(), records }, null, 1));
if (fs.existsSync(PARTIAL)) fs.unlinkSync(PARTIAL);
console.error(`priority-effect: wrote ${records.length} records to ${OUT} in ${Math.round((Date.now() - t0) / 60000)} min`);
