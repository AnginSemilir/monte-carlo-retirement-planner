/*
 * IS WHAT THE POLICY SEARCH APPLIES ACTUALLY THE BEST AVAILABLE?
 *
 * Fast, structural checks on the search the Config tab runs. The slow question - does the 1,500-path
 * pick agree with a much better estimate - is research/policy-study/optimality.mjs; this file pins the
 * properties that must hold whatever the noise:
 *
 *   A  the row the page shows for the winner IS the plan it applies: re-simulating the applied plan
 *      on the same seed reproduces the row's numbers exactly
 *   B  the winner is never dominated: no other candidate is at least as good on every priority and
 *      better on one by more than its tolerance
 *   C  a principle the model is built on holds where it should: a retiree with a pension and an ISA
 *      and nothing filling the personal allowance is not told to leave it unused
 *   D  a trade-off card's gain is real, not an artefact of the one seed the sweep used
 */
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

const sweep = (plan, trials, seed) => E.buildPolicyCandidates(plan).map(c => {
  const ctx = E.buildContext(E.resolveMpaa(c.planState));
  const stats = E.monteCarlo(ctx, { trials, seed });
  stats.postTaxInheritance = E.postTaxInheritanceFor(c.planState, ctx);
  return { ...c, stats };
});
const scs = buildScenarios();

console.log('=========== A. THE APPLIED PLAN IS THE ROW ON THE SCREEN ===========');
{
  const plan = E.normalizePlan(scs[120].plan);
  const rows = sweep(plan, 300, 5);
  const win = E.explainPick(rows, { priorities: E.DEFAULT_PRIORITIES }).winner;
  // exactly what applyCandidate writes, and nothing else
  const applied = { ...plan,
    spending: { ...plan.spending, decumulationPolicy: win.decumulationPolicy, drawdownStrategy: win.drawdownStrategy },
    config: { ...plan.config, harvestPersonalAllowance: win.harvestPersonalAllowance } };
  const again = E.monteCarlo(E.buildContext(E.resolveMpaa(applied)), { trials: 300, seed: 5 });
  ok('re-simulating the applied plan reproduces the winner\'s survival', again.successRate === win.stats.successRate, `${again.successRate} vs ${win.stats.successRate}`);
  ok('...and its median pot', again.medianTerminal === win.stats.medianTerminal);
  ok('...and its bad case', (again.p10TerminalAdj ?? again.p10Terminal) === (win.stats.p10TerminalAdj ?? win.stats.p10Terminal));
}

console.log('\n=========== B. THE WINNER IS NEVER DOMINATED ===========');
{
  const dominates = (y, x) => {
    let strict = false;
    for (const k of E.PRIORITY_KEYS) {
      const m = E.PRIORITY_METRICS[k];
      const gy = m.get(y.stats), gx = m.get(x.stats);
      const better = m.higherIsBetter ? gy - gx : gx - gy;
      if (better < 0) return false;
      if (better > E.toleranceFor(k, m.higherIsBetter ? gy : gy)) strict = true;
    }
    return strict;
  };
  let checked = 0, dominated = [];
  for (const i of [30, 150, 260, 380]) {
    const rows = sweep(E.normalizePlan(scs[i].plan), 300, 11);
    const win = E.explainPick(rows, { priorities: E.DEFAULT_PRIORITIES }).winner;
    checked++;
    const d = rows.find(r => r.id !== win.id && dominates(r, win));
    if (d) dominated.push(`${scs[i].id}: ${d.id} dominates ${win.id}`);
  }
  ok(`across ${checked} households no candidate dominates the winner`, dominated.length === 0, dominated.join('; '));
  // and the property is not vacuous: a dominated fixture IS rejected
  const mk = (id, s, p10, med) => ({ id, stats: { successRate: s, p10TerminalAdj: p10, medianTerminal: med, preNmpaFailRate: 0, medianLifetimeTax: 0 } });
  const w = E.explainPick([mk('worse', 96, 100000, 400000), mk('better', 96.5, 130000, 480000)], { priorities: E.DEFAULT_PRIORITIES }).winner;
  ok('a dominated candidate loses to the one that dominates it', w.id === 'better');
}

console.log('\n=========== C. THE PERSONAL ALLOWANCE IS NOT LEFT UNUSED ===========');
{
  // Retired at 60, no income until the State Pension at 68, a pension and an ISA. For eight years the
  // £12,570 allowance is empty: drawing that much pension costs nothing in tax, and any policy that
  // instead spends the ISA first pays for the same money with the wrapper that is tax-free forever.
  const plan = E.normalizePlan({
    demographics: { planningMode: 'single', currentAgeSelf: 60, retireAgeSelf: 60, terminalAge: 95, statePensionSelf: 11976, statePensionAge: 68, privatePensionAge: 57 },
    spending: { targetSpend: 30000 },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 400000, contrib: 0, growth: 0, risk: 'Medium Risk' },
      { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 250000, contrib: 0, growth: 0, risk: 'Medium Risk' }
    ],
    config: { valuationDate: '2026-01-01' }
  });
  const rows = sweep(plan, 600, 21);
  const win = E.explainPick(rows, { priorities: E.DEFAULT_PRIORITIES }).winner;
  const steps = E.DECUMULATION_POLICIES[win.decumulationPolicy].steps;
  ok(`the winner (${win.decumulationPolicy}) draws the allowance from the pension before anything else`, steps[0] === 'penPA', steps.join('>'));
  const seq = rows.filter(r => r.decumulationPolicy === 'Sequential');
  const bestSeq = seq.sort((a, b) => b.stats.successRate - a.stats.successRate)[0];
  ok('Sequential, which spends the ISA first, pays more lifetime tax', bestSeq.stats.medianLifetimeTax > win.stats.medianLifetimeTax, `${Math.round(bestSeq.stats.medianLifetimeTax)} vs ${Math.round(win.stats.medianLifetimeTax)}`);
  ok('...and is no better on survival', bestSeq.stats.successRate <= win.stats.successRate + E.RATE_EPSILON_PTS);
}

console.log('\n=========== D. A CARD\'S GAIN SURVIVES A CHANGE OF SEED ===========');
{
  let tested = 0, held = 0, detail = [];
  for (const i of [10, 200]) {
    const plan = E.normalizePlan(scs[i].plan);
    const a = sweep(plan, 800, 31);
    const t = E.buildTradeoffs(a);
    if (!t.cards.length) continue;
    const b = sweep(plan, 800, 32);
    const byId = (id) => b.find(r => r.id === id);
    for (const card of t.cards) {
      const alt = byId(card.candidate.id), rec = byId(t.recommended.id);
      for (const g of card.gains) {
        const m = E.PRIORITY_METRICS[g.key];
        const again = (m.higherIsBetter ? 1 : -1) * (m.get(alt.stats) - m.get(rec.stats));
        tested++; if (again > 0) held++; else detail.push(`${scs[i].id} ${card.candidate.id} ${g.key}: ${Math.round(g.delta)} then ${Math.round(again)}`);
      }
    }
  }
  ok(`every stated gain (${tested}) keeps its sign on a fresh seed`, tested > 0 && held === tested, detail.join('; '));
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
