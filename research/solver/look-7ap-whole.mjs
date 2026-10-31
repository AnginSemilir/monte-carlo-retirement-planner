/*
 * 7AP'S WHOLE PLAN (the deep review after 7ap, deep-review-log.md 1 Oct 09:38 UK: its arithmetic, made a script so the plan's
 * figures come from an output). Over results/diag7ap's case files (stamps checked, fair-gate.mjs requireFairLogs): per unit
 * and world, the chooser's claim at year 0 (the bridge stage's start), the simulation at the world's node (sim), the bridge
 * and after stages' per-path means; then the mixture (weights 1/6, 2/3, 1/6, solve.js MIX3) of claim less sim, the table
 * (the solve line) less the mixture's sim, and the claim less the table. Descriptive, unpaired; no item.
 *   node research/solver/look-7ap-whole.mjs > research/solver/results-7ap-whole.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { PRED } from './reduce-7ap.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diag7ap');
const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
requireFairLogs(logs, PRED);
const W = [1 / 6, 2 / 3, 1 / 6], f2 = x => x.toFixed(2);
console.log("7AP'S WHOLE PLAN (results/diag7ap; claim = the bridge stage's start, sim = the world's node simulation; the mixture 1/6, 2/3, 1/6; points)");
for (const t of Object.values(logs)) {
  const id = /^(\S+)\s+case \| unit (\S+?)\/(\S+) \|/m.exec(t); if (!id) continue;
  const lab = `${id[2]}/${id[3]}`, esc = lab.replace(/[+/.]/g, c => '\\' + c);
  const table = +new RegExp(`solve ${esc}: table (\\S+)`).exec(t)[1];
  const w = [0, 1, 2].map(k => ({
    claim: +new RegExp(`stage ${esc} world ${k} bridge: paths \\d+ start (\\S+)`).exec(t)[1],
    sim: +new RegExp(`node ${esc} world ${k} z \\S+: sim (\\S+)`).exec(t)[1],
    bridge: +new RegExp(`stage ${esc} world ${k} bridge: .* mean (\\S+)`).exec(t)[1],
    after: +new RegExp(`stage ${esc} world ${k} after: .* mean (\\S+)`).exec(t)[1] }));
  const mix = f => w.reduce((s, x, k) => s + W[k] * f(x), 0);
  console.log(`  ${id[1].padEnd(5)} ${lab.padEnd(28)} ${w.map((x, k) => `world ${k}: claim - sim ${f2(x.claim - x.sim)} (bridge ${f2(x.bridge)}, after ${f2(x.after)})`).join('; ')}`);
  console.log(`  ${''.padEnd(5)} ${''.padEnd(28)} mixture: claim - sim ${f2(mix(x => x.claim - x.sim))}; table ${table.toFixed(4)} - sim ${f2(table - mix(x => x.sim))}; claim ${f2(mix(x => x.claim))} - table ${f2(mix(x => x.claim) - table)}; sim ${f2(mix(x => x.sim))}`);
}
