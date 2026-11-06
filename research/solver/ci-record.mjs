/*
 * CI'S RUNS AS A RESULTS FILE (Phase 12 item 5; research/solver/launch-ready.mjs line 2, "both CI tiers green on the release
 * commit"). GitHub's API cannot be reached from this container; the runs are read with the GitHub tools and their JSON saved as
 * it came (the list of workflow runs, each with its name, run_number, head_sha, status and conclusion). This prints one line a
 * finished run, as launch-ready reads them, newest first:
 *   Verify run 247 on 74e904fa590a4ac60d3dd15777eeabcf85719fff: success
 * A run still going is written "in_progress", so it never counts as green.
 *   node research/solver/ci-record.mjs <runs.json> [...]  > research/solver/results-ci.txt
 */
import { readFileSync } from 'node:fs';

const runs = [];
for (const f of process.argv.slice(2)) {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  for (const r of j.workflow_runs || j) runs.push(r);
}
const seen = new Set();
console.log('CI runs, as GitHub reports them (research/solver/ci-record.mjs)');
for (const r of runs.sort((a, b) => b.run_number - a.run_number || String(a.name).localeCompare(String(b.name)))) {
  if (!['Verify', 'Full'].includes(r.name) || !/^[0-9a-f]{40}$/.test(r.head_sha || '')) continue;
  const k = `${r.name} ${r.run_number} ${r.run_attempt || 1}`;
  if (seen.has(k)) continue;
  seen.add(k);
  console.log(`${r.name} run ${r.run_number} on ${r.head_sha}: ${r.status === 'completed' ? r.conclusion : r.status}`);
}
