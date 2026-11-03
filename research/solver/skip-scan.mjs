/*
 * THE SKIP COSTS' FIXTURE, FOUND (Phase 9's harness; the launch plan's Phase 9, "the skip costs, on a fixture with a known
 * costly action (the pension drawn to the basic-rate limit in a bridge year)"; EXPLORATORY). On the library's single
 * households retired in their bridge (the pension open, the state pension not yet paid), at the harness's light settings
 * (run-all.sh LIGHT: 4 wealth points and the small lattice), each solved as the app solves it (solveForApp): the first
 * year's move taken apart (partsOf), and where it draws the pension to the basic-rate limit, every part's skip cost on
 * 1,000 paired paths of the app's seed (actionsOf). It prints, for each household it solves, the move and each skip's
 * cost, lost and saved; the fixture is the household whose draw skip loses the most paths beyond those it saves.
 *   node research/solver/skip-scan.mjs [part k/n]
 * With --all (and SCAN_N paths, 300 unless set, as the harness's preview runs them): every part's skip on every household
 * named (SCAN_IDS, the bridge households and the harness's five cases unless set), whatever the first move draws.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveForApp } from '../../src/solverApp.js';
import { firstMove, partsOf, actionsOf } from '../../src/solverStrategy.js';

const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const [pk, pn] = (process.argv[2] === 'part' ? process.argv[3] : '0/1').split('/').map(Number), ALL = process.argv.includes('--all');
const SCAN_N = Number(process.env.SCAN_N) || (ALL ? 300 : 1000);
const bridge = s => {
  const p = E.normalizePlan(s.plan), ctx = E.buildContext(E.resolveMpaa(p)), o = ctx.owners[0];
  if (ctx.owners.length !== 1) return null;
  const age = ctx.ageSelf0, spa = p.demographics.statePensionAge, nmpa = ctx.nmpa || p.demographics.privatePensionAge;
  return o.retireAge <= age && age >= nmpa && age < spa ? { age, spa, nmpa } : null;
};
const lib = buildScenarios(), named = process.env.SCAN_IDS ? new Set(process.env.SCAN_IDS.split(',')) : null;
const all = ALL ? lib.filter(s => (named ? named.has(s.id) : bridge(s) || ['S126', 'S000', 'S162', 'S054', 'S364'].includes(s.id))) : lib.filter(s => bridge(s));
console.log(`skip-scan: ${all.length} households${ALL ? ', every part' : ' retired in their bridge'}; ${SCAN_N} paths; part ${pk}/${pn}`);
all.forEach((s, i) => {
  if (i % pn !== pk) return;
  const t0 = Date.now(), b = bridge(s) || { age: E.buildContext(E.resolveMpaa(E.normalizePlan(s.plan))).ageSelf0, spa: s.plan.demographics.statePensionAge, nmpa: '-' };
  let r;
  try { r = solveForApp(E, M, s.plan, LIGHT); } catch (e) { console.log(`${s.id} age ${b.age} (access ${b.nmpa}, state pension ${b.spa}): the solve threw: ${e.message}`); return; }
  const f = firstMove(E, r), p0 = partsOf(r.actions[f.mv.index], r.c.acts[f.mv.index]);
  if (!ALL && p0.draw !== 'basic') { console.log(`${s.id} age ${b.age}: the first move draws ${p0.draw} (level ${p0.level}), not to the basic-rate limit; ${Math.round((Date.now() - t0) / 1000)} s`); return; }
  const a = actionsOf(E, r, s.plan, { n: SCAN_N });
  console.log(`${s.id} age ${b.age} (access ${b.nmpa}, state pension ${b.spa}): ${a.move.label}; ${a.actions.map(x => `${x.part} ${x.value}${x.skip ? ` -> ${x.part === 'draw' ? x.skip.parts.draw : x.skip.parts[x.part]}: cost ${x.cost.toFixed(2)} (lost ${x.lost}, saved ${x.saved})` : ': no skip'}`).join('; ')}; ${Math.round((Date.now() - t0) / 1000)} s`);
});
