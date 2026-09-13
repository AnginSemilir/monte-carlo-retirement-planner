import { buildPolicyCandidates, pickBest, DECUMULATION_POLICIES } from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) { pass++; console.log(`  PASS  ${n}`); } else { fail++; console.log(`  FAIL  ${n} ${extra}`); } };

const plan = {
  demographics: { planningMode: 'single', currentAgeSelf: 55, retireAgeSelf: 60, terminalAge: 90 },
  spending: { targetSpend: 30000, decumulationPolicy: 'Sequential', drawdownStrategy: 'Full 25% Lump Sum' },
  accounts: [{ id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 300000, contrib: 0, growth: 0, risk: 'High Risk' }],
  config: { valuationDate: '2026-01-01', harvestPersonalAllowance: false }
};

console.log('\nA. Candidate enumeration');
{
  const c = buildPolicyCandidates(plan);
  const nHarvest = Object.values(DECUMULATION_POLICIES).filter(p => p.harvest).length;
  const nPlain = Object.values(DECUMULATION_POLICIES).length - nHarvest;
  const expected = nHarvest * 2 * 2 + nPlain * 2 * 1;
  ok('emits the expected combination count', c.length === expected, `got ${c.length}, expected ${expected}`);
  ok('every id is unique', new Set(c.map(x => x.id)).size === c.length);
  ok('covers both drawdown strategies', new Set(c.map(x => x.drawdownStrategy)).size === 2);
  ok('covers every policy', new Set(c.map(x => x.decumulationPolicy)).size === Object.keys(DECUMULATION_POLICIES).length);
}

console.log('\nB. Harvest de-duplication');
{
  const c = buildPolicyCandidates(plan);
  const seq = c.filter(x => x.decumulationPolicy === 'Sequential');
  ok('Sequential emits one variant per drawdown (harvest is a no-op)', seq.length === 2, `got ${seq.length}`);
  ok('Sequential variants are all harvest-off', seq.every(x => x.harvestPersonalAllowance === false));
  ok('Sequential flagged as harvest-not-applicable', seq.every(x => x.harvestApplies === false));

  const bf = c.filter(x => x.decumulationPolicy === 'Bracket Fill Basic');
  ok('bracket-fill emits both harvest states per drawdown', bf.length === 4, `got ${bf.length}`);
  ok('bracket-fill flagged as harvest-applicable', bf.every(x => x.harvestApplies === true));
  ok('bracket-fill covers harvest on and off', new Set(bf.map(x => x.harvestPersonalAllowance)).size === 2);
}

console.log('\nC. planState wiring');
{
  const c = buildPolicyCandidates(plan);
  ok('each planState carries its own policy', c.every(x => x.planState.spending.decumulationPolicy === x.decumulationPolicy));
  ok('each planState carries its own drawdown strategy', c.every(x => x.planState.spending.drawdownStrategy === x.drawdownStrategy));
  ok('each planState carries its own harvest flag', c.every(x => x.planState.config.harvestPersonalAllowance === x.harvestPersonalAllowance));
  ok('source plan is not mutated', plan.spending.decumulationPolicy === 'Sequential' && plan.config.harvestPersonalAllowance === false);
  ok('unrelated plan data is preserved', c.every(x => x.planState.accounts.find(a => a.id === 'pen_self').balance === 300000));
}

console.log('\nD. pickBest ranking over policy candidates');
{
  const mk = (id, successRate, p10Terminal, medianTerminal, preNmpaFailRate = 0) =>
    ({ id, stats: { successRate, p10Terminal, medianTerminal, preNmpaFailRate } });
  ok('picks the clear survival winner', pickBest([mk('a', 80, 10, 10), mk('b', 92, 5, 5), mk('c', 85, 99, 99)]).id === 'b');
  ok('breaks near-ties on the 10th-percentile pot', pickBest([mk('a', 92.0, 10, 10), mk('b', 91.7, 900, 10)]).id === 'b');
  ok('does not break a real gap on p10', pickBest([mk('a', 92.0, 10, 10), mk('b', 88.0, 900, 900)]).id === 'a');
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
