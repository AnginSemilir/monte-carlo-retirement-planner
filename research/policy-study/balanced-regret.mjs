/*
 * DOES pickBalanced CARRY A LOWER WORST-CASE REGRET THAN THE DEFAULT ORDER?
 *
 * default-order-cost.mjs established that the lexicographic default is within tolerance on every
 * priority for only 17.9% of households, with the shortfall concentrated in expected pot and lifetime
 * tax - the two it ranks last. A page with no priority control needs SOME rule, and pickBalanced exists
 * precisely to avoid ranking anything last. Whether that actually buys a lower worst case is not in
 * priority-effect.json, which stores the balanced winner's label without its per-metric scores.
 *
 * So this re-runs the sweep and records, per household and per metric, the score of three winners -
 * the default order's, the balanced pick's, and the best this metric can reach - which is everything
 * needed to compute either rule's regret without a third run.
 *
 * Same seed, same trial count and the same scenario set as priority-effect, so the two are directly
 * comparable rather than merely similar.
 *
 * Usage: node balanced-regret.mjs [everyNth] [trials]
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';
import fs from 'fs';
import path from 'path';

const EVERY = Number(process.argv[2] || 1);
const TRIALS = Number(process.argv[3] || 1200);
const SEED = 12345;
const OUT_DIR = path.join(import.meta.dirname, 'results');
const OUT = path.join(OUT_DIR, 'balanced-regret.json');
const PARTIAL = path.join(OUT_DIR, 'balanced-regret.partial.json');

const HEIR = [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 60000 }];
const KEYS = E.PRIORITY_KEYS;
const DEFAULT = E.DEFAULT_PRIORITIES;
const SHORT = { 'Bracket Fill Basic': 'TaxSmooth', 'Bracket Fill': 'BracketFill', 'Sequential': 'Sequential' };
const labelOf = (c) => `${SHORT[c.decumulationPolicy] || c.decumulationPolicy}/${
  c.drawdownStrategy === 'Full 25% Lump Sum' ? 'Lump' : 'Phased'}${
  c.harvestApplies ? (c.harvestPersonalAllowance ? '/harvest' : '/no-harvest') : ''}`;

const scenarios = buildScenarios().filter((_, i) => i % EVERY === 0);
console.error(`balanced-regret: ${scenarios.length} households, ${TRIALS} paths, seed ${SEED}`);
fs.mkdirSync(OUT_DIR, { recursive: true });

const records = [];
if (fs.existsSync(PARTIAL)) {
  try {
    const prev = JSON.parse(fs.readFileSync(PARTIAL, 'utf8'));
    if (prev.trials === TRIALS && prev.seed === SEED && Array.isArray(prev.records)) {
      records.push(...prev.records);
      console.error(`  resuming: ${records.length} already done`);
    } else console.error('  partial found but settings differ - starting over');
  } catch { console.error('  partial unreadable - starting over'); }
}
const done = new Set(records.map(r => r.id));
const t0 = Date.now();

for (let n = 0; n < scenarios.length; n++) {
  const sc = scenarios[n];
  if (done.has(sc.id)) continue;
  const plan = E.normalizePlan({ ...sc.plan,
    inheritance: { ...(sc.plan.inheritance || {}), beneficiaries: HEIR } });

  let cands;
  try {
    cands = E.buildPolicyCandidates(plan).map((c) => {
      const cctx = E.buildContext(E.resolveMpaa(c.planState));
      const stats = E.monteCarlo(cctx, { trials: TRIALS, seed: SEED });
      stats.postTaxInheritance = E.postTaxInheritanceFor(c.planState, cctx);
      return { ...c, label: labelOf(c), stats };
    });
  } catch (err) { console.error(`  ${sc.id}: skipped (${err && err.message})`); continue; }
  if (cands.length < 2) { console.error(`  ${sc.id}: skipped (${cands.length} candidate)`); continue; }

  const defWinner = E.explainPick(cands, { priorities: DEFAULT }).winner;
  const balWinner = E.pickBalanced(cands);

  const metrics = {};
  for (const key of KEYS) {
    const m = E.PRIORITY_METRICS[key];
    const vals = cands.map(c => m.get(c.stats));
    const best = m.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = m.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    const eps = E.toleranceFor(key, best);
    // regret, in this metric's own tolerance, signed so positive always means "short of the best"
    const regret = (w) => { const v = m.get(w.stats); return eps > 0 ? (m.higherIsBetter ? best - v : v - best) / eps : 0; };
    metrics[key] = { best, worst, eps, higherIsBetter: m.higherIsBetter,
      spread: eps > 0 ? Math.abs(best - worst) / eps : 0,
      defaultScore: m.get(defWinner.stats), balancedScore: m.get(balWinner.stats),
      defaultRegret: regret(defWinner), balancedRegret: regret(balWinner) };
  }

  records.push({ id: sc.id, name: sc.name, tags: sc.tags, candidates: cands.length,
    defaultWinner: defWinner.label, balancedWinner: balWinner.label,
    same: defWinner.label === balWinner.label, metrics });

  if ((n + 1) % 5 === 0 || n === scenarios.length - 1) {
    fs.writeFileSync(PARTIAL, JSON.stringify({ everyNth: EVERY, trials: TRIALS, seed: SEED, done: n + 1, total: scenarios.length, records }, null, 1));
    const rate = (Date.now() - t0) / (n + 1) / 1000;
    console.error(`  ${n + 1}/${scenarios.length}  (${rate.toFixed(1)}s each, ~${Math.round(rate * (scenarios.length - n - 1) / 60)} min left)`);
  }
}

fs.writeFileSync(OUT, JSON.stringify({ everyNth: EVERY, trials: TRIALS, seed: SEED, generated: new Date().toISOString(), records }, null, 1));
if (fs.existsSync(PARTIAL)) fs.unlinkSync(PARTIAL);
console.error(`balanced-regret: wrote ${records.length} records in ${Math.round((Date.now() - t0) / 60000)} min`);
