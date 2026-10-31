/*
 * 7T'S POWER (predictions/diag-7t.md, Power; its output hashed in the prediction and re-run by the launcher). The rule is
 * 7s's, as reduce-7t.mjs decide() carries it with 7t's 8,000 paths (imported: the reducer runs nothing on import), with g the reader under one policy for every world
 * against the reader as the product solves it, and h the reader under one policy against off under one policy. The
 * reader's harm is 7r's rate scaled to 8,000 paths (S126 15 and bridge 4 12 lost of 3,000, none saved: 40 and 32). One
 * policy for every world changes the reader's tables at every cell, not only the tier, so paths may move both ways at
 * once: each story is drawn with a background of b paths each way on g and on h (b = 1.33, 7s's half a path a 3,000 scaled,
 * and b = 13.3, five a 3,000). Poisson counts, 20,000 draws a story.
 * SIX CAUSES, HOLM OVER TWELVE (26 Sep, the maintainer's "Test all": learning, five worlds, both, and margin 0 beside one
 * policy; the oracle added after the seventy-eighth review): each cause is read by the same rule with Holm over all twelve
 * cause-and-case tests (reduce-7t.mjs decideCauses). The power of one cause is drawn with the other five removing none of
 * the harm - its two p-values then take Holm's first two steps, x12 and x11, the least power it can have; a cause that
 * shares the cure with another only gains.
 *   node research/solver/derive-7t.mjs > research/solver/results-derive-7t.txt
 */
import { decide, N, CAUSES } from './reduce-7t.mjs';

const DRAWS = 20000;
let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const HARM = { S126: 15 * N / 3000, 'bridge 4': 12 * N / 3000 };
function story(name, share, bg) {
  const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let d = 0; d < DRAWS; d++) {
    // one policy removes `share` of the harm: g saves that share, h keeps the rest
    // the cause under study first, then the other five causes removing none of the harm; Holm over all twelve
    const rows = CAUSES.flatMap((cz, c) => Object.keys(HARM).map(id => { const sh = c === 0 ? share : 0; return { id: `${c}|${id}`, g: { saved: pois(sh * HARM[id] + bg), lost: pois(bg) }, h: { saved: pois(bg), lost: pois((1 - sh) * HARM[id] + bg) } }; }));
    const reads = decide(rows).reads.filter(r => r.id.startsWith('0|'));
    tally[reads.every(x => x.read === 'cures') ? 'HELD' : reads.every(x => x.read === 'does not cure') ? 'FALSIFIED' : 'INCONCLUSIVE']++;
  }
  const f = v => (v / DRAWS).toFixed(3);
  console.log(`${name.padEnd(44)} background ${bg.toFixed(2).padEnd(5)}  HELD ${f(tally.HELD)}  FALSIFIED ${f(tally.FALSIFIED)}  INCONCLUSIVE ${f(tally.INCONCLUSIVE)}`);
}
console.log(`7T'S POWER, EACH CAUSE: ${N} paths; the reader's harm is 7r's rate (S126 ${HARM.S126} lost, bridge 4 ${HARM['bridge 4']}, none saved); ${DRAWS} draws a story (seed 7002); read by reduce-7t.mjs decide() with Holm over ${CAUSES.length * 2} tests, the other ${CAUSES.length - 1} causes removing none of the harm\n`);
for (const bg of [0.5 * N / 3000, 5 * N / 3000]) {
  story('the cause removes all the harm', 1, bg);
  story('removes three quarters', 0.75, bg);
  story('removes half', 0.5, bg);
  story('removes a quarter', 0.25, bg);
  story('removes none', 0, bg);
}
