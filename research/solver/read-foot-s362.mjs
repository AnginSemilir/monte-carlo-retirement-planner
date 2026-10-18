/*
 * FOOT-S366'S S362 LINES READ BY THE HARM RULE, POST HOC (grade C; not an item: predictions/diag-foot.md reports S362 only):
 * K1F against K1 (the fix alone, the same reference, split, code and paths) in each world, from results-foot.txt's reported
 * "K1F against K1 world k: ... runs lost b saved c of N" lines and K1's survival there, through stats.mjs's exact conditional
 * McNemar outcome at the relative margin marginRel(K1's survival), Holm across worlds 0 and 1 as the registered item 4 reads
 * S366 (world 2 unadjusted, beside).
 *   node research/solver/read-foot-s362.mjs > research/solver/results-foot-s362.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mcnemarHarmP, holm, outcome, marginRel } from './stats.mjs';

const txt = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'results-foot.txt'), 'utf8');
const cells = [0, 1, 2].map(k => {
  const r = new RegExp(`K1F against K1 world ${k}: .*runs lost (\\d+) saved (\\d+) of (\\d+)`).exec(txt), s = new RegExp(`K1 world ${k}: table at its own opening [0-9.]+ runs \\d+/\\d+ \\(([0-9.]+)\\)`).exec(txt);
  return r && s ? { k, b: +r[1], c: +r[2], N: +r[3], surv: +s[1] } : null;
});
if (cells.some(c => !c)) { console.log('results-foot.txt did not read'); process.exit(1); }
const ph = holm(cells.slice(0, 2).map(c => mcnemarHarmP(c.b, c.c)));
console.log('FOOT-S366: S362, K1F against K1 by the harm rule (post hoc, grade C; results-foot.txt)');
cells.forEach((c, i) => { const m = marginRel(c.surv), o = outcome({ b: c.b, c: c.c, N: c.N, margin: m, pHolm: i < 2 ? ph[i] : mcnemarHarmP(c.b, c.c) }); console.log(`  world ${c.k}: K1's survival ${c.surv}, lost ${c.b} saved ${c.c} of ${c.N}, change ${o.d.toFixed(4)} (${o.lo.toFixed(4)} to ${o.hi.toFixed(4)}) at margin ${m.toFixed(4)}${i < 2 ? ' (Holm across worlds 0 and 1)' : ' (unadjusted)'}: ${o.outcome}`); });
