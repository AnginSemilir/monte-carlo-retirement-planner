/*
 * REDUCER FOR PROBE M15 (PLAN.md finding M15): the taxable account takes the joint tier step, against the GIA held at
 * the plan's tier, paired on the same 3,000 paths. No gain: m15-gia against s2-fnewex. With a 40% unrealised gain:
 * m15-gia-gain40 against m15-off-gain40. Reports survival (paired, the standard error from the paths where the two
 * disagree), years the GIA sat below its plan tier and GIA switches per path, the median lifetime tax, the median
 * estate, and the solve time.
 *
 *   node research/solver/reduce-m15.mjs
 */
import { readRecord } from './record.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFair } from './fair-gate.mjs';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const IDS = [['S206', 'GIA 45%'], ['S330', 'GIA 45%'], ['S390', 'GIA 45%'], ['S054', 'control'], ['S112', 'control'], ['S184', 'control']];
const PAIRS = [['no gain', 's2-fnewex', 'm15-gia'], ['40% gain', 'm15-off-gain40', 'm15-gia-gain40']];
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const load = (tag, id) => {
  const j = join(R, tag, `${id}.json`), rec = join(R, tag, `${id}.solver.record.json.gz`);
  if (!existsSync(j) || !existsSync(rec)) return null;
  return { j: JSON.parse(readFileSync(j, 'utf8')), ok: readRecord(rec).paths.survived };
};
// the fair-test gate (RULES.md): each pair may differ only in the GIA's tier moves (16), which also show in the tier labels (13: "1/1" becomes "1/1/1")
requireFair(PAIRS.filter(([, o, n]) => existsSync(join(R, o)) && existsSync(join(R, n))).map(([, offTag, onTag]) => [offTag, onTag, { tested: [16, 13] }]));
console.log('PROBE M15 - the taxable account takes the tier step, paired against it held at the plan tier (same 3,000 paths)');
console.log('  id    kind      gain       survival off -> on   (paired diff +/- se)   GIA yrs below / switches   lifetime tax (median)   estate net (median)    solve s off/on');
const rows = [];
for (const [id, kind] of IDS) for (const [gain, offTag, onTag] of PAIRS) {
  const a = load(offTag, id), b = load(onTag, id);
  if (!a || !b) continue;
  const N = a.ok.length; let disc = 0; for (let i = 0; i < N; i++) if (a.ok[i] !== b.ok[i]) disc++;
  const d = b.j.solver.successRate - a.j.solver.successRate, se = 100 * Math.sqrt(disc) / N;
  rows.push({ id, kind, gain, d, se });
  console.log(`  ${id}  ${kind.padEnd(8)}  ${gain.padEnd(9)}  ${f(a.j.solver.successRate, 2).padStart(6)} -> ${f(b.j.solver.successRate, 2).padStart(6)}   ${((d >= 0 ? '+' : '') + f(d, 2) + ' +/- ' + f(se, 2)).padEnd(20)}   ${f(b.j.solver.giaYearsMean, 1).padStart(5)} / ${f(b.j.solver.giaChangesMean, 2).padStart(5)}             ` +
    `${f(a.j.solver.medianLifetimeTax / 1000, 1).padStart(6)}k -> ${f(b.j.solver.medianLifetimeTax / 1000, 1).padStart(6)}k     ${f(a.j.solver.medianTerminalNet / 1000, 0).padStart(6)}k -> ${f(b.j.solver.medianTerminalNet / 1000, 0).padStart(6)}k   ${f(a.j.knobs.solveMs / 1000, 0)}/${f(b.j.knobs.solveMs / 1000, 0)}`);
}
const worse = rows.filter(r => r.d < -2 * r.se), better = rows.filter(r => r.d > 2 * r.se);
console.log(`\n  beyond two paired se: better ${better.map(r => `${r.id} (${r.gain})`).join(', ') || 'none'}; worse ${worse.map(r => `${r.id} (${r.gain})`).join(', ') || 'none'}`);
