/*
 * O27: 7T'S POWER UNDER THE UNCONDITIONAL READING (PLAN.md's register O27: the power of derive-7t.mjs, "7t's partial-cure
 * HELD rates among them", may read too kindly). derive-7t.mjs draws each story's paired counts and reads them by
 * reduce-7t.mjs decide(), whose "no material gain" and "no material harm" ends are the registered, conditional interval.
 * This draws the same counts, by the same generator, seed and order, and reads each draw twice:
 *   registered: reduce-7t.mjs decide() itself; the tallies must reproduce results-derive-7t.txt line for line, else it stops;
 *   unconditional: the same rule (read-o27-unconditional.mjs decide7s, checked there against reduce-7s.mjs's decide, and
 *     here against reduce-7t.mjs's on every draw with the registered interval) with the unconditional interval and the
 *     count check (read-o27-unconditional.mjs guarded). The cells need each reference arm's survivors: g's (the reader as
 *     solved) at 7r's reader survival, h's (off under the same change) at 7r's off survival (results-7s.txt's 5-point arms,
 *     which reproduce 7r: S126 99.3 and 99.8, bridge 4 99.0 and 99.4); 7t's own arms will differ a little (declared).
 * The other derivations O27 names (derive-7e, 7r, 7s.mjs) were for experiments now finished and re-read directly by
 * read-o27-unconditional.mjs, so their design-time power is superseded, not re-derived.
 *   node research/solver/sim-o27-power.mjs > research/solver/results-o27-power.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide, N, CAUSES } from './reduce-7t.mjs';
import { survivalChange, survivalChangeU } from './stats.mjs';
import { decide7s, guarded } from './read-o27-unconditional.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DRAWS = 20000, ALPHA = 0.05;
let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const HARM = { S126: 15 * N / 3000, 'bridge 4': 12 * N / 3000 };
// the reference arms' survival (%): g against the reader as solved, h against off under the same change
const SURV = { S126: { g: 99.3, h: 99.8 }, 'bridge 4': { g: 99.0, h: 99.4 } };
const memo = new Map();
const U = (surv, x) => {
  const SA = Math.round(N * surv / 100), key = `${SA}|${x.lost}|${x.saved}`;
  if (!memo.has(key)) memo.set(key, guarded(survivalChangeU(SA - x.lost, x.lost, x.saved, N - SA - x.saved, ALPHA), x.lost, x.saved, N, ALPHA));
  return memo.get(key);
};
const caseOf = r => r.id.split('|')[1];
const REG = new Map(), reg = x => { const k = `${x.lost}|${x.saved}`; if (!REG.has(k)) REG.set(k, survivalChange(x.lost, x.saved, N, ALPHA)); return REG.get(k); };
const lines = [];
function story(name, share, bg) {
  const tR = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 }, tU = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  let moved = 0;
  for (let d = 0; d < DRAWS; d++) {
    const rows = CAUSES.flatMap((cz, c) => Object.keys(HARM).map(id => { const sh = c === 0 ? share : 0; return { id: `${c}|${id}`, g: { saved: pois(sh * HARM[id] + bg), lost: pois(bg) }, h: { saved: pois(bg), lost: pois((1 - sh) * HARM[id] + bg) } }; }));
    const R = decide(rows), C = decide7s(rows, r => reg(r.g), r => reg(r.h));
    if (R.reads.map(x => x.read).join() !== C.reads.map(x => x.read).join()) { console.log(`STOP: the copy of the rule reads ${C.reads.map(x => x.read).join()} where reduce-7t.mjs reads ${R.reads.map(x => x.read).join()}`); process.exit(1); }
    const Uc = decide7s(rows, r => U(SURV[caseOf(r)].g, r.g), r => U(SURV[caseOf(r)].h, r.h));
    const out = D => { const reads = D.reads.filter(r => r.id.startsWith('0|')); return reads.every(x => x.read === 'cures') ? 'HELD' : reads.every(x => x.read === 'does not cure') ? 'FALSIFIED' : 'INCONCLUSIVE'; };
    const a = out(R), b = out(Uc);
    tR[a]++; tU[b]++; if (a !== b) moved++;
  }
  const f = v => (v / DRAWS).toFixed(3);
  lines.push(`${name.padEnd(44)} background ${bg.toFixed(2).padEnd(5)}  HELD ${f(tR.HELD)}  FALSIFIED ${f(tR.FALSIFIED)}  INCONCLUSIVE ${f(tR.INCONCLUSIVE)}`);
  console.log(`${name.padEnd(34)} background ${bg.toFixed(2).padEnd(5)} | registered HELD ${f(tR.HELD)} FALSIFIED ${f(tR.FALSIFIED)} INCONCLUSIVE ${f(tR.INCONCLUSIVE)} | unconditional HELD ${f(tU.HELD)} FALSIFIED ${f(tU.FALSIFIED)} INCONCLUSIVE ${f(tU.INCONCLUSIVE)} | draws read differently ${f(moved)}`);
}
console.log(`O27: 7T'S POWER, EACH CAUSE, THE REGISTERED READING BESIDE THE UNCONDITIONAL ONE (derive-7t.mjs's stories and draws: ${N} paths, S126 ${HARM.S126} and bridge 4 ${HARM['bridge 4']} lost, ${DRAWS} draws a story, seed 7002; the reference arms at ${Object.entries(SURV).map(([id, s]) => `${id} ${s.g}% (g) and ${s.h}% (h)`).join(', ')})\n`);
for (const bg of [0.5 * N / 3000, 5 * N / 3000]) {
  story('the cause removes all the harm', 1, bg);
  story('removes three quarters', 0.75, bg);
  story('removes half', 0.5, bg);
  story('removes a quarter', 0.25, bg);
  story('removes none', 0, bg);
}
// the registered tallies must be derive-7t.mjs's own
const want = readFileSync(join(HERE, 'results-derive-7t.txt'), 'utf8').split('\n').filter(l => / background /.test(l));
const bad = lines.filter((l, i) => l !== want[i]);
if (bad.length || want.length !== lines.length) { console.log(`\nSTOP: the registered tallies do not reproduce results-derive-7t.txt (${bad.length} of ${lines.length} lines differ; it has ${want.length})`); process.exit(1); }
console.log(`\nthe registered tallies reproduce results-derive-7t.txt's ${want.length} lines exactly, and the copy of the rule read every draw as reduce-7t.mjs's decide() does`);
