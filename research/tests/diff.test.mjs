import { diffStrategyPlans } from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name} ${extra}`); } };

const acct = (id, contrib, balance = 0) => ({ id, contrib, balance });
const plan = (accounts) => ({ accounts });

console.log('\nA. Contribution reshuffle');
{
  const base = plan([acct('pen_self', 2000), acct('isa_self', 10000), acct('other_self', 0), acct('cash_self', 0)]);
  const next = plan([acct('pen_self', 10000), acct('isa_self', 5000), acct('other_self', 0), acct('cash_self', 0)]);
  const d = diffStrategyPlans(base, next);
  ok('pension rise captured', d.byCat.pen.contrib === 8000, `got ${d.byCat.pen.contrib}`);
  ok('ISA fall captured', d.byCat.isa.contrib === -5000, `got ${d.byCat.isa.contrib}`);
  ok('unchanged wrappers contribute nothing', d.byCat.other.contrib === 0 && d.byCat.cash.contrib === 0);
  ok('two contrib deltas only', d.contribDeltas.length === 2, `got ${d.contribDeltas.length}`);
  ok('hasChange true', d.hasChange === true);
  ok('from/to recorded', d.contribDeltas.find(x => x.cat === 'pen').from === 2000 && d.contribDeltas.find(x => x.cat === 'pen').to === 10000);
}

console.log('\nB. No change / threshold');
{
  const base = plan([acct('pen_self', 2000), acct('isa_self', 10000)]);
  const same = diffStrategyPlans(base, plan([acct('pen_self', 2000), acct('isa_self', 10000)]));
  ok('identical plans report no change', same.hasChange === false);
  ok('no deltas emitted', same.contribDeltas.length === 0);

  const noise = diffStrategyPlans(base, plan([acct('pen_self', 2020), acct('isa_self', 9980)]));
  ok('sub-threshold noise filtered', noise.hasChange === false, JSON.stringify(noise.contribDeltas));

  const edge = diffStrategyPlans(base, plan([acct('pen_self', 2050), acct('isa_self', 10000)]));
  ok('exactly-threshold delta counts', edge.contribDeltas.length === 1 && edge.byCat.pen.contrib === 50);
}

console.log('\nC. Bed & SIPP capital transfer');
{
  const base = plan([acct('isa_self', 0, 60000), acct('pen_self', 0, 100000), acct('cash_self', 0, 20000)]);
  const next = plan([acct('isa_self', 0, 40000), acct('pen_self', 0, 125000), acct('cash_self', 0, 25000)]);
  const d = diffStrategyPlans(base, next);
  ok('three balance deltas', d.balanceDeltas.length === 3, `got ${d.balanceDeltas.length}`);
  ok('ISA source negative', d.balanceDeltas.find(x => x.cat === 'isa').delta === -20000);
  ok('pension destination positive', d.balanceDeltas.find(x => x.cat === 'pen').delta === 25000);
  ok('cash refund positive', d.balanceDeltas.find(x => x.cat === 'cash').delta === 5000);
  ok('hasChange true on balance-only move', d.hasChange === true);
  ok('no contribution deltas', d.contribDeltas.length === 0);
}

console.log('\nD. Couples — owner attribution');
{
  const base = plan([acct('pen_self', 5000), acct('pen_part', 5000), acct('isa_self', 5000), acct('isa_part', 5000)]);
  const oneOwner = diffStrategyPlans(base, plan([acct('pen_self', 12000), acct('pen_part', 5000), acct('isa_self', 0), acct('isa_part', 5000)]));
  ok('single-owner pension change lists one owner', oneOwner.byCat.pen.owners.length === 1 && oneOwner.byCat.pen.owners[0] === 'self', JSON.stringify(oneOwner.byCat.pen.owners));

  const bothOwners = diffStrategyPlans(base, plan([acct('pen_self', 12000), acct('pen_part', 12000), acct('isa_self', 0), acct('isa_part', 0)]));
  ok('both-owner change lists two owners', bothOwners.byCat.pen.owners.length === 2);
  ok('both-owner totals aggregate', bothOwners.byCat.pen.contrib === 14000, `got ${bothOwners.byCat.pen.contrib}`);
  ok('both-owner ISA aggregates negative', bothOwners.byCat.isa.contrib === -10000);
}

console.log('\nE. Robustness');
{
  ok('missing accounts survive', diffStrategyPlans(plan([acct('pen_self', 100)]), plan([acct('isa_self', 100)])).hasChange === false);
  ok('null-ish plans survive', diffStrategyPlans(null, null).hasChange === false);
  ok('blank contrib treated as zero', diffStrategyPlans(plan([acct('pen_self', '')]), plan([acct('pen_self', 9000)])).byCat.pen.contrib === 9000);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
