/*
 * TWO MORE OF THE LAYOUT'S FIGURES (LAYOUT.md sections 3.1 and 3.4), for one household, from the same solve and paths as
 * figures.mjs (the app's solve, seed 7002):
 *   - the typical run: the path the next ten years follow (src/solverStrategy.js aheadOf: the median of the pot at the end
 *     over the headline's runs), its spending level every year, for the outlook's line (finding L12). Picked, as the app
 *     picks it, over the first 2,000 paths (--ahead): the Strategy tab asks for 'ahead' after its first step of 2,000
 *     (src/SolverStrategy.jsx) and does not ask again at 5,000. Its ten years are printed as figures.mjs prints them
 *     ("ahead:" lines), for ahead-words.mjs;
 *   - the household's current approach, from the library's plan (the policy, the drawdown strategy, the guardrails);
 *   - the year-by-year ledger on the expected returns (rowsOf(E, solved, 'expected'), the audit table's solved ledger), with
 *     the action column's words (src/solverWords.js ledgerWords), for the Details page.
 * EXPLORATORY, deciding nothing. Run from the root of the agent's code with the engine built:
 *   node <this file> S116 [--ahead 2000]
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const imp = p => import(pathToFileURL(resolve(ROOT, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const { solveForApp } = await imp('src/solverApp.js');
const S = await imp('src/solverStrategy.js');
const W = await imp('src/solverWords.js');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');

const args = process.argv.slice(2);
const id = args.find(a => /^S\d+F?$/.test(a)) || 'S116';
const i = args.indexOf('--ahead'), PATHS = i >= 0 ? Number(args[i + 1]) : 2000, SEED = 7002;
const h0 = buildScenarios().find(s => s.id === id);
if (!h0) throw new Error(`extra: no household ${id}`);
const plan = E.normalizePlan(h0.plan);
const code = execSync('git rev-parse --short=12 HEAD', { cwd: ROOT }).toString().trim();
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const fmt = v => gbp.format(Number.isFinite(v) ? v : 0);
console.log(`# node extra.mjs ${args.join(' ')} (the agent's code at ${code}; seed ${SEED}; EXPLORATORY, deciding nothing)`);
console.log(`current approach: the policy ${plan.spending.decumulationPolicy}, ${plan.spending.drawdownStrategy}, guardrails ${plan.config.guardrails ? 'on' : 'off'}, the lookahead ${E.num(plan.config.lookaheadYears, 0)} years`);

let t = Date.now();
const solved = solveForApp(E, M, plan);
console.log(`solve: ${((Date.now() - t) / 1000).toFixed(0)} s`);
t = Date.now();
const runs = S.strategyRuns(E, solved, plan, { seed: SEED, from: 0, to: PATHS });
const ahead = S.aheadOf(E, solved, plan, runs, { years: 10 });
const age0 = Number(plan.demographics.currentAgeSelf), k = ahead.path, lv = runs.solved[k].level;
console.log(`runs: ${((Date.now() - t) / 1000).toFixed(0)} s; the typical run is path ${k} (the median of the pot at the end over ${PATHS} paths); it ${runs.solved[k].survived ? 'lasts' : `runs out in year ${runs.solved[k].failT}`}`);
console.log(`typical run levels: ${JSON.stringify([...lv].map((x, y) => [age0 + y, x]).filter(([, x]) => x > 0))}`);
const firstBack = [...lv].findIndex(x => x >= 100);
console.log(`typical run back at target: ${firstBack >= 0 ? `age ${age0 + firstBack} (${plan.config.valuationDate ? Number(String(plan.config.valuationDate).slice(0, 4)) + firstBack : `year ${firstBack}`})` : 'never'}`);
const ctxW = { target: E.num(plan.spending.targetSpend, 0), fmt };
for (const r of ahead.rows) { const a = W.aheadWords(r, ctxW); console.log(`ahead: ${a.when} | ${a.spend} | ${a.notes} | ledger: ${W.ledgerWords(r.parts, r.spend > 0)}`); }

// the year-by-year ledger on the expected returns, as the audit table shows the solved plan
const led = S.rowsOf(E, solved, 'expected');
console.log(`ledger verdict: ${JSON.stringify(led.verdict)}`);
for (let y = 0; y < Math.min(led.rows.length, 12); y++) {
  const r = led.rows[y], p = led.parts[y];
  const pick = key => (Number.isFinite(r[key]) ? fmt(r[key]) : '-');
  console.log(`ledger: ${r.year ?? ''} | age ${r.ageSelf} | target ${pick('targetSpend')} | ${W.ledgerWords(p, r.targetSpend > 0) || 'no move'} | net drawdown ${pick('netDrawdown')} | pension draw ${pick('drawdownPensions')} | tax ${pick('taxPaid')} | CGT ${pick('cgtPaid')} | pensions ${pick('pensions')} | ISAs ${pick('isas')} | other ${pick('other')} | cash ${pick('cash')} | total ${pick('totalCombined')}`);
}
console.log(`ledger row keys: ${Object.keys(led.rows[0]).join(' ')}`);
console.log('# done');
