/*
 * STEP-O182'S CLAMP READ (a reported line for results-o182.txt's item 1; read-only, from the batch's own logs). The split gives
 * each bridge-year read back exactly where the read is inside the reader's clamp (splitTook); at the clamp its parts sum past
 * the read, so the copied corners' I[R] there overstates what enters the read. Per arm, world and bridge year this prints the
 * mean read V_t, recovered from the ledger's chain (V_1 = B0 - T_0, B_t = V_t - G_t, V_t+1 = B_t - T_t, every path reaching
 * every bridge year), beside the split's mean sum PC + RS + RC: their difference is the clamp's overshoot, in points over all
 * paths. It runs the reducer's gate first (reduce-o182.mjs's gate, in its full mode) and refuses if it fails.
 *   node research/solver/read-o182-clamp.mjs [dir] > research/solver/results-o182-clamp.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse, LABELS, ARMS } from './reduce-o182.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = process.argv[2] || join(HERE, 'results', 'diago182');
const g = spawnSync('node', [join(HERE, 'reduce-o182.mjs'), DIR], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!/^GATE: passed/m.test(g)) { console.log('the reducer\'s gate did not pass on these files'); process.exit(1); }
const logs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
const jobs = logs.flatMap(parse), f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
console.log('STEP-O182: the split\'s mean sum against the mean read by bridge year (points; the difference is the clamp\'s overshoot)\n');
for (const a of ARMS) {
  const L = LABELS[a], j = jobs.find(x => x.label === L), text = logs.find(t => t.includes(`job ${L} `));
  for (let k = 0; k < 3; k++) {
    const yr = {}; for (const m of text.matchAll(new RegExp(`year ${L.replace(/[/]/g, '\\/')} ${k} (\\d+): paths (\\d+) G (\\S+) T (\\S+)`, 'g'))) yr[+m[1]] = { n: +m[2], G: +m[3], T: +m[4] };
    const led = j.ledger[k], sp = j.split[k], bridge = j.bridge;
    const sT = Object.values(yr).reduce((t, x) => t + x.T, 0), T0 = led.T - sT;
    let V = led.B0 - T0; const out = [];
    for (let t = 1; t <= Math.max(...bridge); t++) {
      if (!yr[t] || yr[t].n !== j.sims[`OWN${k}`].n) { out.push(`${t}: not every path reached it`); break; }
      const sum = sp[`PC${t}`] + sp[`RS${t}`] + sp[`RC${t}`];
      out.push(`${t}: V ${f4(V)} split ${f4(sum)} overshoot ${f4(sum - V)} (RC ${f4(sp[`RC${t}`])})`);
      const B = V - yr[t].G; V = B - yr[t].T;
    }
    console.log(`${a} world ${k}: ${out.join(' | ')}`);
  }
}
