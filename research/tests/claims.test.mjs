/*
 * THE SITE SAYS IT DOES THESE THINGS. THIS PINS EACH SENTENCE TO THE CODE.
 *
 * Every section below is a claim the UI or the documentation makes in so many words. None of them had
 * a test, and each is the kind that drifts silently: the sentence stays, the code moves, and the page
 * describes a model that no longer runs. Where a claim is already pinned elsewhere (safe-spend
 * reproducibility in safespend B, band scaling in spendbands, the survival guard in priorities G) it
 * is not repeated here.
 *
 *   A  "seed ... reproducible"                         same seed, same trials -> identical statistics
 *   B  "every combination is scored on the same        two candidates with the same plan get the same
 *      market paths"                                   numbers, not merely close ones
 *   C  "Allowance harvesting ... never improves        harvest on/off differ by no more than the survival
 *      survival"                                       tolerance across the scenario library
 *   D  "Eighteen combinations"                         the candidate grid is 18 and stays 18
 *   E  each policy's blurb describes its steps         no policy is labelled one thing and runs another
 *   F  the simple page's "N of 18 tied" count          the worker's arithmetic matches the engine's own
 *                                                      survival tolerance
 *   G  "applied above"                                 a candidate differs from the plan in exactly the
 *                                                      three fields the Config tab shows changing
 */
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

const plan = {
  demographics: { planningMode: 'single', currentAgeSelf: 55, retireAgeSelf: 60, terminalAge: 95, statePensionSelf: 12000 },
  spending: { targetSpend: 32000, decumulationPolicy: 'Bracket Fill Basic', drawdownStrategy: 'Phased Drawdown' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 420000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'ISAs', balance: 120000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash', balance: 30000, contrib: 0, growth: 0, risk: 'Low Risk' }
  ],
  config: { valuationDate: '2026-01-01', harvestPersonalAllowance: false }
};
const ctxOf = (p) => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));

console.log('=========== A. SAME SEED, SAME ANSWER ===========');
{
  const ctx = ctxOf(plan);
  const a = E.monteCarlo(ctx, { trials: 400, seed: 4242 });
  const b = E.monteCarlo(ctx, { trials: 400, seed: 4242 });
  ok('survival rate is bit-identical on a repeat', a.successRate === b.successRate, `${a.successRate} vs ${b.successRate}`);
  ok('median pot is bit-identical', a.medianTerminal === b.medianTerminal);
  ok('10th percentile pot is bit-identical', a.p10Terminal === b.p10Terminal);
  const c = E.monteCarlo(ctx, { trials: 400, seed: 4243 });
  ok('and a different seed gives a different draw', c.medianTerminal !== a.medianTerminal);
}

console.log('\n=========== B. COMMON RANDOM NUMBERS ACROSS THE CANDIDATE FIELD ===========');
{
  // two candidates that happen to carry the same plan must land on the same paths, or the results
  // table's claim that "differences between rows are more reliable than each row" is false
  const cands = E.buildPolicyCandidates(plan);
  const twin = { ...cands[0], id: 'twin' };
  const [x, y] = [cands[0], twin].map(c => E.monteCarlo(E.buildContext(E.resolveMpaa(c.planState)), { trials: 400, seed: 7 }));
  ok('identical plans score identically under one seed', x.successRate === y.successRate && x.medianTerminal === y.medianTerminal);
  // and the paths themselves are a function of the seed alone: nothing about a policy can reach them
  const pa = E.pathsForSeed(99, 3, 40), pb = E.pathsForSeed(99, 3, 40);
  ok('pathsForSeed is deterministic in the seed', JSON.stringify(pa) === JSON.stringify(pb));
  ok('and differs across seeds', JSON.stringify(E.pathsForSeed(100, 3, 40)) !== JSON.stringify(pa));
}

console.log('\n=========== C. HARVESTING NEVER IMPROVES SURVIVAL ===========');
{
  const scs = buildScenarios().filter((_, i) => i % 10 === 0);
  let pairs = 0, worst = 0, worstAt = '';
  for (const sc of scs) {
    const cands = E.buildPolicyCandidates(sc.plan);
    const rate = new Map();
    for (const c of cands) {
      if (!c.harvestApplies) continue;
      const ctx = E.buildContext(E.resolveMpaa(c.planState));
      rate.set(c.id, E.monteCarlo(ctx, { trials: 500, seed: 777 }).successRate);
    }
    for (const c of cands) {
      if (!c.harvestPersonalAllowance) continue;
      const off = rate.get(c.id.replace('|h1', '|h0'));
      if (off === undefined) continue;
      pairs++;
      const gain = rate.get(c.id) - off;
      if (gain > worst) { worst = gain; worstAt = `${sc.name} ${c.id}`; }
    }
  }
  ok(`across ${pairs} harvest on/off pairs the largest survival gain from harvesting`, pairs > 50);
  ok(`is within the survival tolerance (${E.RATE_EPSILON_PTS}pt)`, worst <= E.RATE_EPSILON_PTS, `${worst.toFixed(2)}pt at ${worstAt}`);
}

console.log('\n=========== D. EIGHTEEN COMBINATIONS ===========');
{
  const cands = E.buildPolicyCandidates(plan);
  ok('the candidate grid is 18, as the documentation says', cands.length === 18, String(cands.length));
  ok('five policies', Object.keys(E.DECUMULATION_POLICIES).length === 5);
  ok('every policy appears with both drawdown strategies',
    Object.keys(E.DECUMULATION_POLICIES).every(k => ['Phased Drawdown', 'Full 25% Lump Sum'].every(s => cands.some(c => c.decumulationPolicy === k && c.drawdownStrategy === s))));
  ok('harvest variants exist only where the policy can harvest',
    cands.every(c => c.harvestApplies || !c.harvestPersonalAllowance));
}

console.log('\n=========== E. A POLICY IS DESCRIBED AS IT RUNS ===========');
{
  const params = E.taxParams(E.normalizePlan(plan).config);
  const WORD = { cash: /cash/i, other: /GIA|general investment/i, isa: /ISA/i, penPA: /allowance|pension/i, penBasic: /pension/i, penAny: /pension/i };
  for (const [k, p] of Object.entries(E.DECUMULATION_POLICIES)) {
    const text = `${p.label} ${p.blurb(params)}`;
    const generic = /each wrapper/i.test(text);
    // "draws like Tax Smoothing" is a description by reference, honest only while the steps really match
    const twin = E.DECUMULATION_POLICIES['Bracket Fill Basic'];
    const byRef = /like Tax Smoothing/i.test(text) && JSON.stringify(p.steps) === JSON.stringify(twin.steps);
    const missing = p.steps.filter(s => !generic && !byRef && !WORD[s].test(text));
    ok(`${k}: every wrapper in its steps is named in its description`, missing.length === 0, missing.join(','));
    // the first step is what the policy leads with, and the description must lead with the same thing
    const first = p.steps[0];
    const leadsWithPension = /^(fills|draws)/i.test(p.blurb(params));
    ok(`${k}: description leads with what the steps lead with`, first.startsWith('pen') ? leadsWithPension : !leadsWithPension || generic);
  }
  const wf = E.DECUMULATION_POLICIES['Windfall to ISA'];
  ok('Windfall deposits into the ISA before the GIA, as its description says', wf && wf.depositOrder[0] === 'isa' && wf.depositOrder.indexOf('other') > 0);
  ok('and the default deposit order leads with the pension', E.DEFAULT_DEPOSIT_ORDER[0] === 'pen');
}

console.log('\n=========== F. THE SIMPLE PAGE\'S TIE COUNT ===========');
{
  // simWorker.js counts candidates within 1 point of the best survival. That "1" is meant to be the
  // engine's own survival tolerance; if RATE_EPSILON_PTS ever moves, the page would silently disagree
  // with the ranking it sits on.
  ok('the worker\'s hard-coded 1pt is the engine\'s survival tolerance', E.RATE_EPSILON_PTS === 1);
  const mk = (id, r) => ({ id, stats: { successRate: r, p10Terminal: 1, medianTerminal: 1, preNmpaFailRate: 0, medianLifetimeTax: 0 } });
  const field = [mk('a', 97.2), mk('b', 96.4), mk('c', 96.3), mk('d', 94.9)];
  const bestRate = Math.max(...field.map(c => c.stats.successRate));
  const workerTied = field.filter(c => bestRate - c.stats.successRate <= 1).length;
  const engineTied = field.filter(c => c.stats.successRate >= bestRate - E.toleranceFor('survive', bestRate)).length;
  ok('the worker\'s count matches what explainPick would leave in the pool', workerTied === engineTied && workerTied === 3);
  ok('...and explainPick agrees', E.explainPick(field, { priorities: ['survive'] }).consulted[0].left === 3);
}

console.log('\n=========== G. APPLYING A CANDIDATE CHANGES ONLY WHAT THE PAGE SAYS IT CHANGES ===========');
{
  const base = E.normalizePlan(plan);
  const cands = E.buildPolicyCandidates(plan);
  const diffKeys = (a, b) => Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  let clean = true; const seen = new Set();
  for (const c of cands) {
    const s = diffKeys(base.spending, c.planState.spending);
    const cf = diffKeys(base.config, c.planState.config);
    s.forEach(k => seen.add('spending.' + k)); cf.forEach(k => seen.add('config.' + k));
    if (s.some(k => !['decumulationPolicy', 'drawdownStrategy'].includes(k)) || cf.some(k => k !== 'harvestPersonalAllowance')) clean = false;
    if (diffKeys({ ...base, spending: 0, config: 0 }, { ...c.planState, spending: 0, config: 0 }).length) clean = false;
  }
  ok('no candidate touches anything but policy, strategy and harvest', clean, [...seen].join(','));
  ok('and between them the three fields do all change', ['spending.decumulationPolicy', 'spending.drawdownStrategy', 'config.harvestPersonalAllowance'].every(k => seen.has(k)));
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
