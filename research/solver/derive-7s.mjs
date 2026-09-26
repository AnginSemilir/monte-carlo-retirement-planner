/*
 * 7S'S POWER (predictions/diag-7s.md, Power; its output hashed in the prediction and re-run by the launcher). The 5-point
 * arms are 7r's on 7r's paths (results-7r.txt: the reader lost 15 and 12 against off, none saved), so the counts that
 * vary are g (the reader at 15 against the reader at 5) and h (the reader at 15 against off at 15). Each scenario draws
 * them as Poisson counts, 20,000 draws from a fixed seed, and reads them by reduce-7s.mjs's own decide() (imported: the
 * reducer runs nothing on import, and its planted checks pin the rule).
 *   node research/solver/derive-7s.mjs > research/solver/results-derive-7s.txt
 */
import { decide, N, ALPHA, MARGIN } from './reduce-7s.mjs';
import { mcnemarHarmP, survivalChange } from './stats.mjs';

const DRAWS = 20000;
let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const HARM = { S126: 15, 'bridge 4': 12 };   // 7r's lost paths, the reader against off at 5 points
function scenario(name, rates) {
  const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 }, reads = [{}, {}];
  for (let d = 0; d < DRAWS; d++) {
    const rows = Object.keys(HARM).map(id => { const [gs, gl, hs, hl] = rates(HARM[id]); return { id, g: { saved: pois(gs), lost: pois(gl) }, h: { saved: pois(hs), lost: pois(hl) } }; });
    const o = decide(rows); tally[o.outcome]++; o.reads.forEach((r, j) => { reads[j][r.read] = (reads[j][r.read] || 0) + 1; });
  }
  const f = v => ((v || 0) / DRAWS).toFixed(3);
  console.log(`${name.padEnd(74)} HELD ${f(tally.HELD)}  FALSIFIED ${f(tally.FALSIFIED)}  INCONCLUSIVE ${f(tally.INCONCLUSIVE)}`);
  console.log(`${''.padEnd(74)} S126 cures ${f(reads[0].cures)}, does not cure ${f(reads[0]['does not cure'])}; bridge 4 cures ${f(reads[1].cures)}, does not cure ${f(reads[1]['does not cure'])}`);
}
console.log(`7S'S POWER: ${N} paths; the reader's harm at 5 points is 7r's (S126 15 lost, bridge 4 12 lost, none saved); g and h drawn as Poisson counts, ${DRAWS} draws a scenario (seed 7002); read by reduce-7s.mjs decide()\n`);
console.log('BY THE TRUE STORY (g saved/lost expected, h saved/lost expected, per case):');
// background discordance: half a path each way where the two arms play alike (7i: off at 5 and 15 on S126, 0 of 1,000 discordant)
scenario('15 points cures it all (g: the harm saved; h: 0.5/0.5)', H => [H, 0.5, 0.5, 0.5]);
scenario('15 points changes nothing (g: 0.5/0.5; h: the harm lost), as on S360 in 7e', H => [0.5, 0.5, 0.5, H]);
scenario('15 points cures half (g: half the harm saved; h: half lost)', H => [H / 2, 0.5, 0.5, H / 2]);
scenario('15 points cures a quarter', H => [H / 4, 0.5, 0.5, 3 * H / 4]);
scenario('15 points cures three quarters', H => [3 * H / 4, 0.5, 0.5, H / 4]);
console.log('\nTHE LEAST COUNTS, with none the other way:');
const least = (m) => { for (let b = 1; b < 60; b++) if (m * mcnemarHarmP(b, 0) < ALPHA) return b; return null; };
console.log(`  a gain (or a harm) on one case, the other far stronger (Holm's second step): ${least(1)}; both cases alike: ${least(2)} each`);
const maxWithin = sign => { let b = 0; while (sign > 0 ? survivalChange(0, b + 1, N, ALPHA).hi < MARGIN : survivalChange(b + 1, 0, N, ALPHA).lo > -MARGIN) b++; return b; };
console.log(`  "no material gain" holds up to ${maxWithin(1)} saved with none lost; "no material harm" up to ${maxWithin(-1)} lost with none saved (the exact 95% interval against ${MARGIN} points of ${N})`);
