/* Finish any scenarios missing from the checkpoints, and merge into the final per-slice files. */
import * as E from '../engine.mjs';
import { installChallengers } from './challengers.mjs';
import { installChallengers2 } from './challengers2.mjs';
import { buildScenarios } from './scenarios.mjs';
import fs from 'fs';
installChallengers(E); installChallengers2(E);

const DIR = process.argv[2] || new URL('./results/', import.meta.url).pathname;
const TRIALS = Number(process.argv[3] ?? 2000), SEED = 12345;
const all = buildScenarios();

for (const slice of [0, 1, 2, 3]) {
  const done = fs.existsSync(`${DIR}/policy-run3-${slice}.json`) ? JSON.parse(fs.readFileSync(`${DIR}/policy-run3-${slice}.json`))
    : fs.existsSync(`${DIR}/policy-run3-${slice}.partial.json`) ? JSON.parse(fs.readFileSync(`${DIR}/policy-run3-${slice}.partial.json`)) : [];
  const have = new Set(done.map(r => r.id));
  const mine = all.filter((_, i) => i % 4 === slice);
  const todo = mine.filter(s => !have.has(s.id));
  if (!todo.length) { fs.writeFileSync(`${DIR}/policy-run3-${slice}.json`, JSON.stringify(done)); console.log(`slice ${slice}: complete (${done.length})`); continue; }
  console.log(`slice ${slice}: ${done.length} done, running ${todo.length} more`);
  todo.forEach((sc, n) => {
    const cands = E.buildPolicyCandidates(sc.plan).map(c => {
      const stats = E.monteCarlo(E.buildContext(E.resolveMpaa(c.planState)), { trials: TRIALS, seed: SEED });
      return { id: c.id, policy: c.decumulationPolicy, drawdown: c.drawdownStrategy, harvest: c.harvestPersonalAllowance,
        successRate: stats.successRate, preNmpaFailRate: stats.preNmpaFailRate,
        p10: stats.p10TerminalNet ?? stats.p10Terminal, median: stats.medianTerminalNet ?? stats.medianTerminal };
    });
    const rates = cands.map(c => c.successRate);
    const byPolicy = {}; cands.forEach(c => { byPolicy[c.policy] = Math.max(byPolicy[c.policy] ?? -1, c.successRate); });
    done.push({ id: sc.id, name: sc.name, tags: sc.tags, targetSpend: sc.targetSpend, potAtRetire: sc.potAtRetire,
      spreadPts: Math.max(...rates) - Math.min(...rates), policyBestRate: byPolicy, cands });
    console.log(`  ${sc.id} (${n + 1}/${todo.length})`);
  });
  done.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(`${DIR}/policy-run3-${slice}.json`, JSON.stringify(done));
  console.log(`slice ${slice}: written ${done.length}`);
}
