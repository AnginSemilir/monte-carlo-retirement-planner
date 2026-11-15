/*
 * THE SHARE RULES' PILOT, WHAT IT SHOWS FOR THE REGISTERED RUN (registrations/share-rules.md; the reviewer of the registration,
 * MINOR 7; EXPLORATORY, seed 7002, deciding nothing). For each of the pilot's comparisons (FLAT and MEANS against TODAY, where
 * their shares differ) that loses survival on its 1,000 paths: the chance D34's harm rule flags it at the registered paths if
 * that loss were the true one (size-phase4.mjs harmRate at the threshold thresholdFor sets from the pilot's discordance, floored
 * as harmOf floors it). And MEANS against FLAT on the pilot's units with TODAY's run standing for FLAT's where FLAT's share is
 * TODAY's (reduce-share-rules.mjs withStandIn), beside the same read without it, as the read had it before the fix.
 *   node research/solver/share-rules-pilot-power.mjs > research/solver/results-share-rules-pilot-power.txt
 */
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { thresholdFor, harmRate } from './size-phase4.mjs';
import { compare, loadDir, withStandIn } from './reduce-share-rules.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { pilotUnits, PATHS_FILE } from './audit-share-rules.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const N = Math.max(...Object.values(JSON.parse(readFileSync(PATHS_FILE, 'utf8')).paths));
const panel = readSharePanel(), units = pilotUnits(panel), U = loadDir(join(HERE, 'results', 'share-rules-pilot'));
const f = (x, d = 2) => (x >= 0 ? '+' : '') + x.toFixed(d);
console.log(`THE SHARE RULES' PILOT, WHAT IT SHOWS FOR THE REGISTERED RUN (EXPLORATORY, seed 7002, 1,000 paths a unit, deciding nothing; the registered paths ${N})`);
console.log('Each comparison losing survival on the pilot: the chance D34\'s rule flags it at the registered paths were that loss true.');
for (const [X, B] of [['FLAT', 'TODAY'], ['MEANS', 'TODAY']]) {
  for (const r of compare(U, units, X, B).rows) {
    if (!(r.loss > 0)) continue;
    const d = Math.max(r.disc, 0.0101), t = thresholdFor(d, N);
    console.log(`  ${X.padEnd(5)} ${r.id.padEnd(12)} share ${r.shareB.toFixed(3)} to ${r.shareX.toFixed(3)}: a loss of ${f(r.loss)} points (${r.lost} lost, ${r.saved} saved); at ${N} paths and a discordance of ${(100 * d).toFixed(2)}%, the threshold ${t.toFixed(3)}, flagged with chance ${harmRate(d, N, t, r.loss).toFixed(3)}`);
  }
}
// the panel's spread of shares (every unit, from its plan): MEANS less TODAY, and FLAT's lowest
{ const { shareOfArm } = await import('./audit-share-rules.mjs');
  const dm = panel.map(u => shareOfArm('MEANS', u.plan) - shareOfArm('TODAY', u.plan)), dp = panel.map(u => shareOfArm('MEANS', u.plan) - shareOfArm('FLAT', u.plan)), fl = panel.map(u => shareOfArm('FLAT', u.plan));
  console.log(`The panel's ${panel.length} units: MEANS's share less the pots' own (FLAT's) from ${f(Math.min(...dp), 3)} to ${f(Math.max(...dp), 3)}; less TODAY's from ${f(Math.min(...dm), 3)} to ${f(Math.max(...dm), 3)}; FLAT's share from ${Math.min(...fl).toFixed(3)} to ${Math.max(...fl).toFixed(3)}`); }
const V = withStandIn(U, units), withIt = compare(V, units, 'MEANS', 'FLAT'), without = compare(U, units, 'MEANS', 'FLAT');
const iv = c => `${f(c.d, 3)} (${f(c.lo, 3)} to ${f(c.hi, 3)})`;
console.log(`MEANS against FLAT: on ${withIt.rows.length} units with TODAY's run standing for FLAT's at 90/10, the pooled survival change ${iv(withIt.pooled)}; without the stand-in (the read before the fix) on ${without.rows.length}, ${iv(without.pooled)}`);
