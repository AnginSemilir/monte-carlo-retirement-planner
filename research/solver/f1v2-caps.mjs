/*
 * F1 V2'S CAP ON EACH CASE OF ITS TEST, FROM THE SOLVER'S OWN CODE (inputs only, no solve; 24 Sep, the sixteenth review:
 * the prediction's caps came from diagnose-f1.mjs's rough model - S126's original mix for every case, cash counted as
 * uninvested, its own return and spread - which agrees with the code on bridge 6 and share 0.95 and not on the cost case
 * or S360). For each of the twenty-one cases of `audit-s126.mjs f1v2`, built exactly as that mode builds them, it prints
 * what `bridgeTable` (version 2) and `bridgeChanceV2` give at the opening position:
 *   acc   the accessible money (ISA + taxable account + cash) at the start
 *   req   what the bridge still needs now, the inflows due by each year counted (v2); need, the whole bridge's (v1)
 *   cap   v2's chance the money lasts - the ceiling on the opening read wherever the table's own read is above it;
 *         "none" when the inflows cover every year; also without growth, and v1's cap (acc >= need only)
 * The cases and their plans come from audit-s126.mjs itself (its `variant` and `facts` are read from its source), so the
 * two cannot drift apart.
 *
 *   node research/solver/f1v2-caps.mjs        prints the table (kept in results-f1v2-caps.txt)
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

const Phi = z => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
const k = x => (x / 1000).toFixed(1) + 'k', pc = x => (x === null ? 'none' : (100 * x).toFixed(1));
console.log('F1 V2 CAPS FROM THE CODE (bridgeTable v2 + bridgeChanceV2, and v1 for comparison), at the opening position, floor 0.8');
console.log('case          | B  acc      req (v2)  need (v1) | cap v2  no growth | cap v1 | cash buffer  spread  growth');
for (const [id, h] of cases) {
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const m = M.prepare(E, plan);
  const c = F.compile(m, buildActions({ spendLevels: [1, 0.8] }));
  const B2 = bridgeTable(E, m, c, 0.8, 2), B1 = bridgeTable(E, m, c, 0.8, 1);
  const s = vecOf(m, M.initialState(m)), acc = s[1] + s[2];
  if (!(B2.need[0] > 0)) { console.log(`${id.padEnd(13)} | no retired bridge at the start: no cap`); continue; }
  const cap = bridgeChanceV2(acc, B2.req[0], B2.cash[0], B2.years[0], B2.sigma, B2.mu, B2.cashReal);
  const cap0 = bridgeChanceV2(acc, B2.req[0], B2.cash[0], B2.years[0], B2.sigma, 0, 0);
  // v1's cap exactly as bridgeAdjust computes it (only when the money covers the whole bridge's need)
  let cap1 = null;
  if (acc >= B1.need[0]) { const cash = Math.min(acc, B1.cash[0]); const sd = B1.sigma * ((acc - cash) / acc) * Math.sqrt(B1.years[0]); cap1 = sd > 0 ? Phi(Math.log(acc / B1.need[0]) / sd) : 1; }
  console.log(`${id.padEnd(13)} | ${String(B2.years[0]).padStart(2)} ${k(acc).padStart(8)} ${k(B2.req[0]).padStart(9)} ${k(B1.need[0]).padStart(9)} | ${pc(cap).padStart(6)} ${pc(cap0).padStart(9)} | ${(cap1 === null ? 'off' : pc(cap1)).padStart(6)} | ${k(B2.cash[0]).padStart(8)} ${(100 * B2.sigma).toFixed(1).padStart(6)}% ${(100 * B2.mu).toFixed(2).padStart(5)}%`);
}
