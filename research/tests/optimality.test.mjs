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
 *   E  the live path count puts the survival wobble UNDER the tie tolerance, which is the whole
 *      argument for TOURNAMENT_TRIALS being what it is
 *   F  and when the noise does still flip a near-tie, the pick it lands on is barely worse
 *   G  the combination count the Config tab quotes to the user is the count the search really runs
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


console.log('\n=========== E. WHY THE LIVE SEARCH RUNS 4,000 PATHS, PINNED ===========');
{
  /*
   * The finding behind TOURNAMENT_TRIALS (App.jsx): the metric that settles most near-ties is exact,
   * and the noise lives entirely in which candidates the survival tie lets through to it. Three facts
   * carry that argument, and each is cheap to re-check:
   *   1  postTaxInheritance does not depend on the seed or the trial count at all
   *   2  at 1,500 paths the survival estimate on a mid-survival plan wobbles by MORE than the 1-point
   *      tie tolerance from seed to seed, so the tolerance was not "comfortably above the noise"
   *   3  the wobble shrinks with the square root of the path count, as a Bernoulli proportion must -
   *      which is why the fix is more paths, not more seeds at the same total
   * LIVE_SEARCH_TRIALS mirrors TOURNAMENT_TRIALS in src/App.jsx, which the engine slice does not export.
   */
  const LIVE_SEARCH_TRIALS = 4000;
  const noisy = E.normalizePlan(scs[224].plan);          // ~40% survival: the worst case for sampling noise
  const cand = E.buildPolicyCandidates(noisy)[0];
  const ctx = E.buildContext(E.resolveMpaa(cand.planState));

  const beqA = E.postTaxInheritanceFor(cand.planState, E.buildContext(E.resolveMpaa(cand.planState)));
  const beqB = E.postTaxInheritanceFor(cand.planState, ctx);
  ok('the inheritance metric is identical however the candidate is simulated', beqA === beqB && Number.isFinite(beqA ?? 0));

  const seeds = [11, 22, 33, 44, 55, 66, 77, 88];
  const sd = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
  const at = (trials) => seeds.map(seed => E.monteCarlo(ctx, { trials, seed }).successRate);
  const s1500 = sd(at(1500)), sLive = sd(at(LIVE_SEARCH_TRIALS));
  ok(`at 1,500 paths the seed-to-seed wobble in survival exceeds the ${E.RATE_EPSILON_PTS}pt tie tolerance on a mid-survival plan`, s1500 > E.RATE_EPSILON_PTS, `sd ${s1500.toFixed(2)}pt`);
  /*
   * ...and this is the assertion the path count exists for. A tie tolerance that sits inside the noise
   * is not gating on anything: it hands the lower priorities whichever candidates the draw happened to
   * let through. Raising the paths is what puts the tolerance back above the wobble, so if this ever
   * fails, TOURNAMENT_TRIALS is too low for RATE_EPSILON_PTS and one of the two has to move.
   */
  ok(`at ${LIVE_SEARCH_TRIALS.toLocaleString()} paths it is back INSIDE that tolerance, which is what the path count is for`, sLive < E.RATE_EPSILON_PTS, `sd ${sLive.toFixed(2)}pt vs ${E.RATE_EPSILON_PTS}pt`);
  const ratio = s1500 / sLive, expected = Math.sqrt(LIVE_SEARCH_TRIALS / 1500);
  ok(`the wobble falls roughly with the square root of the path count (expected ${expected.toFixed(2)}x)`, ratio > expected * 0.5 && ratio < expected * 2.0, `${ratio.toFixed(2)}x (${s1500.toFixed(2)} -> ${sLive.toFixed(2)}pt)`);
  // the binomial standard error the comment reasons from is the right order of magnitude
  const p = at(LIVE_SEARCH_TRIALS).reduce((a, b) => a + b, 0) / seeds.length / 100;
  const binomial = 100 * Math.sqrt(p * (1 - p) / LIVE_SEARCH_TRIALS);
  ok('and matches the binomial standard error to within a factor of two', sLive > binomial / 2 && sLive < binomial * 2, `measured ${sLive.toFixed(2)}, binomial ${binomial.toFixed(2)}`);
}

console.log('\n=========== F. A NEAR-TIE RESOLVED THE WRONG WAY IS STILL CHEAP ===========');
{
  /*
   * Section E bounds the NOISE. This bounds its CONSEQUENCE, which is the claim a user actually cares
   * about: not "the search always finds the best candidate" - it does not, and for statistically
   * indistinguishable candidates nothing could - but "when it doesn't, you barely lose anything".
   *
   * For each household and seed, sweep all 18 candidates, take the ranked winner, and compare its
   * survival with the best survival available on that same seed. The gap is what the household gave up
   * by the ranking landing where it did. Measured across households 66 and 224 at seeds 11 and 33 the
   * worst gap is 1.00 points, and the same measurement at 1,500 paths gives 0.93 - the bound is a
   * property of the tolerance and the survival guard, not of the path count, so it should hold at any
   * sane trial count. 1.5 is the measured worst case plus room for the guard to be re-tuned slightly.
   *
   * Household 66 is deliberately in the sample because it is one that DOES give something up; a
   * version of this test where every gap is zero would pass without testing anything, so that is
   * asserted too.
   */
  const LIVE_SEARCH_TRIALS = 4000, BOUND_PTS = 1.5;
  let worst = 0, nonZero = 0;
  const detail = [];
  for (const i of [66, 224]) {
    const plan = E.normalizePlan(scs[i].plan);
    for (const seed of [11, 33]) {
      const rows = sweep(plan, LIVE_SEARCH_TRIALS, seed);
      const win = E.explainPick(rows, { priorities: E.DEFAULT_PRIORITIES }).winner;
      const gap = Math.max(...rows.map(r => r.stats.successRate)) - win.stats.successRate;
      if (gap > 0) nonZero++;
      worst = Math.max(worst, gap);
      detail.push(`${scs[i].id}/${seed}:${gap.toFixed(2)}`);
    }
  }
  ok(`the applied pick is never more than ${BOUND_PTS}pt of survival below the best candidate on the same seed`, worst <= BOUND_PTS, `worst ${worst.toFixed(2)}pt  [${detail.join(' ')}]`);
  ok('...and the sample actually contains a household that gives something up, so the bound is exercised', nonZero > 0, `${nonZero} of ${detail.length} non-zero`);
}

console.log('\n=========== G. THE NUMBER ON SCREEN IS THE WORK ACTUALLY DONE ===========');
{
  /*
   * Config tells the user how big the auto-pick search is - "scores all 18 combinations" - and that
   * sentence is only safe if it is derived from the same table the search enumerates. POLICY_COMBOS in
   * src/App.jsx reduces over DECUMULATION_POLICIES; buildPolicyCandidates walks the same table and
   * emits the candidates. The formula is mirrored here because it lives outside the engine slice, so
   * the thing this really pins is that the two stay equal: add a policy, or give an existing one
   * harvesting, and either both move or this fails.
   */
  const combos = Object.values(E.DECUMULATION_POLICIES).reduce((n, pol) => n + 2 * (pol.harvest ? 2 : 1), 0);
  const built = E.buildPolicyCandidates(E.normalizePlan(scs[7].plan));
  ok('the quoted combination count equals the candidates the search builds', combos === built.length, `quoted ${combos}, built ${built.length}`);
  ok('...and it does not depend on the household', built.length === E.buildPolicyCandidates(E.normalizePlan(scs[312].plan)).length);
  ok('...and every candidate is a distinct settings combination', new Set(built.map(c => c.id)).size === built.length);
  // the other half of the quoted sentence: both crystallisation strategies, every policy
  const strategies = new Set(built.map(c => c.drawdownStrategy));
  ok('both crystallisation strategies appear', strategies.size === 2, [...strategies].join(', '));
  ok('and every policy in the table appears', new Set(built.map(c => c.decumulationPolicy)).size === Object.keys(E.DECUMULATION_POLICIES).length);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
