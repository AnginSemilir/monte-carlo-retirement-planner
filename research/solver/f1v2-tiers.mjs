/*
 * DOES THE RISK-ABOVE DEFAULT REACH THE F1 v2 TEST'S CASES? (24 Sep; the schedule made 7c wait for M14b "since M14b may
 * change the risk-above default this test runs on"). For each of the twenty-one cases of `audit-s126.mjs f1v2`, built
 * exactly as f1v2-caps.mjs builds them (from audit-s126.mjs's own source), it counts the tier combinations with and
 * without one tier above the plan. Equal counts mean no tier above exists, so risk above - on, 'auto' or off - cannot
 * change that case (solvePlan: "no tier above the plan"). Planted: S126 with its pension and ISA held at Medium must
 * show one more combination, or the check is not trusted.
 *
 *   node research/solver/f1v2-tiers.mjs        (kept in results-f1v2-tiers.txt)
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions } from '../../src/solver/solve.js';
import { bridgeTable, bridgeChanceV2, vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, 'audit-s126.mjs'), 'utf8');
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error(`f1v2-caps: cannot find ${a} in audit-s126.mjs`); return src.slice(i, j); };
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
// audit-s126.mjs's own definitions: variant(), and the list of the twelve variants
const variant = new Function('E', 's126', 'LIQ', between('function variant(', '\n/* the inputs') + '\nreturn variant;')(E, s126, LIQ);
const F1_VARIANTS = new Function(between('const F1_VARIANTS = ', ';\n') + ';\nreturn F1_VARIANTS;')();
if (!src.includes("['bridge 4+cost', () => variant('bridge 4+cost', { bridge: 4, cost: [2, 30000] })]")) throw new Error('f1v2-caps: the cost case in audit-s126.mjs is not the one this script builds');
const cases = [...F1_VARIANTS.map(([id, o]) => [id, variant(id, o)]),
  ...['S120', 'S122', 'S124', 'S128', 'S130', 'S360', 'S366', 'S370'].map(id => [id, all.find(s => s.id === id)]),
  ['bridge 4+cost', variant('bridge 4+cost', { bridge: 4, cost: [2, 30000] })]];

import { tierCombos } from '../../src/solver/solve.js';
const combos = h => {
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 } }));
  const a = M.prepare(E, plan), b = M.prepare(E, plan); b.tiersAbove = 1;
  return [tierCombos(a).length, tierCombos(b).length];
};
const med = { ...s126, plan: { ...s126.plan, accounts: s126.plan.accounts.map(a => (/^Pensions|^S&S ISA/.test(a.category) ? { ...a, risk: 'Medium Risk' } : a)) } };
const [p0, p1] = combos(med);
if (!(p1 === p0 + 1)) throw new Error(`f1v2-tiers: the planted Medium case shows ${p0} -> ${p1} combinations, not one more - the check is not trusted`);
console.log(`planted: S126 held at Medium, combinations ${p0} -> ${p1} (one tier above exists) - the check can see a tier above`);
let above = 0;
for (const [id, h] of cases) {
  const [n0, n1] = combos(h); if (n1 > n0) above++;
  console.log(`${id.padEnd(14)} combinations ${n0} -> ${n1}${n1 > n0 ? '  A TIER ABOVE EXISTS' : ''}`);
}
console.log(`${cases.length} cases, ${above} with a tier above the plan`);
