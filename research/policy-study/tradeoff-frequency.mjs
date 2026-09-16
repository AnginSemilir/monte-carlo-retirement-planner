/*
 * HOW OFTEN DOES A TRADE-OFF CARD APPEAR, AND WHAT DOES A STATED PREFERENCE COST IN SURVIVAL?
 *
 * A re-cut of priority-effect.json, which records every candidate's score on every metric, so neither
 * question needs another run. The first sizes the trade-off cards feature: a control that fires for
 * 5% of households is a footnote, one that fires for 90% is the page. The second is the number the
 * survival guard is sized against, and it used to be quoted from an older, smaller library.
 *
 * Usage: node tradeoff-frequency.mjs [results/priority-effect.json]
 */
import fs from 'fs';
import path from 'path';
import * as E from '../engine.mjs';

const file = process.argv[2] || path.join(import.meta.dirname, 'results', 'priority-effect.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const recs = data.records.filter(r => Array.isArray(r.cands));
const KEYS = E.PRIORITY_KEYS;
const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';

console.log(`tradeoff-frequency: ${recs.length} households with candidate scores, ${data.trials} paths, seed ${data.seed}`);

// rebuild a candidate the engine can rank from the recorded per-metric scores
const LONG = { TaxSmooth: 'Bracket Fill Basic', BracketFill: 'Bracket Fill' };
const asCandidate = (c) => {
  const [policy, strategy, harvest] = c.label.split('/');
  return {
    id: c.label, label: c.label,
    decumulationPolicy: LONG[policy] || policy, drawdownStrategy: strategy === 'Lump' ? 'Full 25% Lump Sum' : 'Phased Drawdown',
    harvestPersonalAllowance: harvest === 'harvest', harvestApplies: true,
    stats: { successRate: c.survive, postTaxInheritance: c.bequest, medianTerminal: c.pot, p10TerminalAdj: c.downside, preNmpaFailRate: c.bridge, medianLifetimeTax: c.tax }
  };
};

let any = 0, none = 0; const byKey = Object.fromEntries(KEYS.map(k => [k, 0]));
let free = 0, cardsTotal = 0; const costs = [];
for (const r of recs) {
  const t = E.buildTradeoffs(r.cands.map(asCandidate));
  if (t.cards.length) any++; else none++;
  cardsTotal += t.cards.length;
  const seen = new Set();
  for (const c of t.cards) { c.gains.forEach(g => seen.add(g.key)); if (c.survivePts < 0.05) free++; costs.push(c.survivePts); }
  seen.forEach(k => byKey[k]++);
}
console.log(`\nsome card appears for ${any}/${recs.length} households (${pct(any, recs.length)}); none for ${pct(none, recs.length)}`);
console.log(`cards per household: ${(cardsTotal / recs.length).toFixed(2)}; cards at no survival cost: ${pct(free, cardsTotal)} of ${cardsTotal}`);
console.log('\nhouseholds offered a gain on each priority:');
for (const k of KEYS) if (k !== 'survive') console.log(`  ${E.PRIORITY_METRICS[k].label.padEnd(34)} ${pct(byKey[k], recs.length)}`);
costs.sort((a, b) => a - b);
const q = (f) => costs.length ? costs[Math.min(costs.length - 1, Math.floor(f * costs.length))].toFixed(2) : '—';
console.log(`\nsurvival cost of a card, points: median ${q(0.5)}, 90th ${q(0.9)}, max ${q(1)}`);

/*
 * What ranking each priority FIRST costs in survival - the guard's sizing number. The run's own
 * `survivalCostPts` was measured WITH the guard in place, so it can never exceed the guard and says
 * nothing about whether the guard is needed. The unguarded figure is re-ranked here from the recorded
 * candidate scores with the cap removed, which is the number the guard has to be judged against.
 */
console.log('\nsurvival given up by ranking each priority first, points below the best available:');
console.log('  '.padEnd(36) + 'guarded (as shipped)      unguarded (what the guard prevents)');
let worstAll = 0, worstAt = '';
for (const k of KEYS) {
  const guarded = data.records.map(r => r.byFirst[k] && r.byFirst[k].survivalCostPts).filter(Number.isFinite);
  const order = [k, ...E.DEFAULT_PRIORITIES.filter(x => x !== k)];
  const raw = recs.map(r => {
    const cands = r.cands.map(asCandidate);
    const best = Math.max(...cands.map(c => c.stats.successRate));
    return best - E.explainPick(cands, { priorities: order, maxSurvivalSacrificePts: Infinity }).winner.stats.successRate;
  });
  const stat = (xs) => xs.length ? `mean ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2)}  max ${Math.max(...xs).toFixed(2)}` : '—';
  const over = raw.filter(x => x > E.MAX_SURVIVAL_SACRIFICE_PTS).length;
  const max = raw.length ? Math.max(...raw) : 0;
  if (max > worstAll) { worstAll = max; worstAt = E.PRIORITY_METRICS[k].label; }
  console.log(`  ${E.PRIORITY_METRICS[k].label.padEnd(34)} ${stat(guarded).padEnd(26)}${stat(raw)}  over ${E.MAX_SURVIVAL_SACRIFICE_PTS}pt: ${over}/${raw.length}`);
}
console.log(`\nworst unguarded case across every priority: ${worstAll.toFixed(2)} points (${worstAt}); the guard is ${E.MAX_SURVIVAL_SACRIFICE_PTS}`);
