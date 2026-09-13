/*
 * Does the 2027 change invert which policy is right?
 *
 * THE HYPOTHESIS. "Pension First" - empty the taxable wrapper early - won ZERO of 360 households when
 * ranked on survival. From 6 April 2027 an unused pension sits inside the estate and can be taxed twice,
 * so a household optimising for what its heirs receive should want the opposite of what a household
 * optimising for survival wants. If Pension First wins a large share here, the inheritance tab is a
 * feature. If it does not, the 2027 change matters less than the commentary says and the tab is smaller.
 *
 * WHY DETERMINISTIC RUNS. The question is which WRAPPER the money ends up in, which is a tax question,
 * not a sequence-risk one. Draw order controls the former and barely touches the latter. Running this on
 * the expected path isolates the effect being measured, exactly as the headroom study did, and lets the
 * whole grid finish in seconds instead of an hour.
 *
 * The beneficiary profiles matter as much as the policies: the same estate left to a non-earning
 * grandchild and to an additional-rate taxpayer are taxed completely differently, and the whole point
 * of the tab is that this changes the answer.
 */
import * as E from '../engine.mjs';
import { installChallengers } from './challengers.mjs';
import { installChallengers2 } from './challengers2.mjs';
import { buildScenarios } from './scenarios.mjs';
import fs from 'fs';

installChallengers(E);
installChallengers2(E);

const PROFILES = [
  { key: 'child-basic',   label: 'One child, basic-rate taxpayer',      bens: [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 30000 }] },
  { key: 'child-higher',  label: 'One child, higher-rate taxpayer',     bens: [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 70000 }] },
  { key: 'child-addl',    label: 'One child, additional-rate taxpayer', bens: [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 160000 }] },
  { key: 'grandchild',    label: 'A grandchild with no income',         bens: [{ id: 'g', relationship: 'descendant', sharePct: 100, income: 0 }] },
  { key: 'charity-10',    label: 'Children, with 10% to charity',       bens: [{ id: 'c', relationship: 'charity', sharePct: 10, income: 0 }, { id: 'k', relationship: 'descendant', sharePct: 90, income: 45000 }] }
];
const DEATH_AGES = [74, 80];          // either side of the cliff that makes inherited pension taxable
const HOME = 350000;                  // a typical home, passing to descendants, so the residence band is live

const scenarios = buildScenarios();
const policies = Object.keys(E.DECUMULATION_POLICIES);
const out = [];
const t0 = Date.now();

scenarios.forEach((sc, n) => {
  // one deterministic run per policy gives the wrapper split at death, which is what the tax turns on
  const perPolicy = policies.map(pol => {
    const plan = { ...sc.plan, spending: { ...sc.plan.spending, decumulationPolicy: pol } };
    const ctx = E.buildContext(E.resolveMpaa(plan));
    const rows = E.simulateDeterministic(ctx, 'expected');
    const ev = E.evaluateRows(ctx, rows);
    const last = rows[rows.length - 1];
    return { policy: pol, survived: ev.survived, wrappers: { pen: last.pensions, isa: last.isas, other: last.other, cash: last.cash }, gross: ev.terminalPot };
  });

  for (const prof of PROFILES) for (const deathAge of DEATH_AGES) {
    const scored = perPolicy.map(p => {
      const est = (sc.tags.household === 'couple' ? E.estateForCouple : E.estateAtDeath)(
        sc.plan.config, p.wrappers,
        { deathAge, deathYear: 2040, homeValue: HOME, homeToDescendants: true, beneficiaries: prof.bens });
      const net = sc.tags.household === 'couple' ? est.netToBeneficiaries : est.netToBeneficiaries;
      // a plan that ran dry leaves nothing regardless of how tax-efficient the order was
      return { policy: p.policy, survived: p.survived, gross: p.gross, net: p.survived ? net : 0 };
    });
    const best = scored.reduce((a, b) => (b.net > a.net ? b : a));
    const bestGross = scored.reduce((a, b) => (b.gross > a.gross ? b : a));
    /*
     * The spread must be measured among policies that SURVIVED. A policy that runs the plan dry leaves
     * nothing, so including it makes the spread equal to the whole estate and turns "this policy is less
     * tax-efficient" into "this policy is worth eight million pounds" - which is a statement about
     * running out of money, not about inheritance tax, and belongs in the survival study instead.
     */
    const alive = scored.filter(s => s.survived);
    const spreadNet = alive.length > 1 ? Math.max(...alive.map(s => s.net)) - Math.min(...alive.map(s => s.net)) : 0;
    out.push({
      id: sc.id, name: sc.name, tags: sc.tags, profile: prof.key, deathAge,
      winnerNet: best.policy, winnerGross: bestGross.policy,
      bestNet: best.net, spreadNet, survivingPolicies: alive.length, totalPolicies: scored.length,
      byPolicy: Object.fromEntries(scored.map(s => [s.policy, s.net]))
    });
  }
  if (n % 60 === 0) process.stderr.write(`${n}/${scenarios.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
});

const DIR = process.env.POLICY_RESULTS || new URL('./results/', import.meta.url).pathname;
fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(`${DIR}/inheritance-run.json`, JSON.stringify(out));
console.log(`${out.length} rows (${scenarios.length} households x ${PROFILES.length} profiles x ${DEATH_AGES.length} death ages) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
