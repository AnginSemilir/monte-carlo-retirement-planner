/*
 * 7T'S POWER (predictions/diag-7t.md, Power; its output hashed in the prediction and re-run by the launcher). The rule is
 * 7s's, as reduce-7t.mjs decide() carries it with 7t's 8,000 paths (imported: the reducer runs nothing on import), with g the reader under one policy for every world
 * against the reader as the product solves it, and h the reader under one policy against off under one policy. The
 * reader's harm is 7r's rate scaled to 8,000 paths (S126 15 and bridge 4 12 lost of 3,000, none saved: 40 and 32). One
 * policy for every world changes the reader's tables at every cell, not only the tier, so paths may move both ways at
 * once: each story is drawn with a background of b paths each way on g and on h (b = 1.33, 7s's half a path a 3,000 scaled,
 * and b = 13.3, five a 3,000). Poisson counts, 20,000 draws a story.
 *   node research/solver/derive-7t.mjs > research/solver/results-derive-7t.txt
 */
import { decide, N } from './reduce-7t.mjs';

const DRAWS = 20000;
let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const HARM = { S126: 15 * N / 3000, 'bridge 4': 12 * N / 3000 };
function story(name, share, bg) {
  const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let d = 0; d < DRAWS; d++) {
    // one policy removes `share` of the harm: g saves that share, h keeps the rest
    const rows = Object.keys(HARM).map(id => ({ id, g: { saved: pois(share * HARM[id] + bg), lost: pois(bg) }, h: { saved: pois(bg), lost: pois((1 - share) * HARM[id] + bg) } }));
    tally[decide(rows).outcome]++;
  }
  const f = v => (v / DRAWS).toFixed(3);
  console.log(`${name.padEnd(44)} background ${bg.toFixed(2).padEnd(5)}  HELD ${f(tally.HELD)}  FALSIFIED ${f(tally.FALSIFIED)}  INCONCLUSIVE ${f(tally.INCONCLUSIVE)}`);
}
console.log(`7T'S POWER: ${N} paths; the reader's harm is 7r's rate (S126 ${HARM.S126} lost, bridge 4 ${HARM['bridge 4']}, none saved); ${DRAWS} draws a story (seed 7002); read by reduce-7t.mjs decide()\n`);
for (const bg of [0.5 * N / 3000, 5 * N / 3000]) {
  story('one policy removes all the harm', 1, bg);
  story('removes three quarters', 0.75, bg);
  story('removes half', 0.5, bg);
  story('removes a quarter', 0.25, bg);
  story('removes none', 0, bg);
}
