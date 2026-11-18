/*
 * D112's FIX AGAINST EACH READ'S OWN RULE (EXPLORATORY, deciding nothing; D112: "the reads made before stand as printed, each
 * checked for an interval end the fix would carry across its bar"; D128 (3)). stats-newcombe-scan.mjs finds every crossing of
 * a few bars by any interval, a lead; this runs each stored run's own reducer's rule, whose reducer reads survivalChangeU or
 * pooledSummed (the two the fix changes), on that run's units twice, before the fix (STATS.plant 'nocorrect', Newcombe's
 * method 8 as the code before D112 had it) and after it (method 10), and compares every decision the rule returns: each
 * verdict, each part's holding, each unit it names. Printed: by run, the decisions compared and every one that differs, with
 * the interval behind it where the rule names one. The reducers whose rule reads only survivalChange (the exact interval:
 * reduce-household.mjs, reduce-shapes.mjs and the registered runs' reducers but reduce-7uf.mjs) are untouched by the fix; the
 * runs whose units are not stored here (7u-F's among them) cannot be checked, and are listed.
 *   node research/solver/stats-newcombe-rules.mjs > research/solver/results-stats-newcombe-rules.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATS } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), RES = join(HERE, 'results');
// each run whose reducer's rule reads survivalChangeU or pooledSummed, and how its reducer hands the units to its rule
const RUNS = [
  ['share-choose-7002', 'reduce-share-choose.mjs', us => ({ all: us })],
  ['joint-wide-7002', 'reduce-joint-wide.mjs', us => ({ all: us })],
  ['other-order-7002', 'reduce-other-order.mjs', us => ({ all: us })],
  ['speed-b-7002', 'reduce-speed-b.mjs', us => ({ single: us.filter(u => u.kind === 'single'), couple: us.filter(u => u.kind === 'couple') })],
  ['share-ensemble-7002', 'reduce-share-ensemble.mjs', us => ({ all: us })],
  ['tie-c2-7001', 'reduce-tie-c2.mjs', us => ({ all: us })],
  ['tie-couple-7002', 'reduce-tie-couple.mjs', us => ({ all: us })]
];
// every decision in what a rule returns: each boolean and string, and each list of strings (the units it names), by its path;
// typed arrays, the units themselves and number lists left out
const decisions = (x, path = '', out = {}, depth = 0) => {
  if (depth > 8 || x === null || x === undefined) return out;
  if (typeof x === 'boolean' || typeof x === 'string') { out[path] = x; return out; }
  if (ArrayBuffer.isView(x)) return out;
  if (Array.isArray(x)) {
    if (x.length && x.every(v => typeof v === 'string')) { out[path] = x.join(','); return out; }
    if (x.length && x.every(v => typeof v === 'number')) return out;
    x.forEach((v, i) => decisions(v, `${path}[${v && typeof v === 'object' && typeof v.id === 'string' ? v.id : i}]`, out, depth + 1));
    return out;
  }
  if (typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) if (k !== 'U' && k !== 'arms') decisions(v, path ? `${path}.${k}` : k, out, depth + 1);
  }
  return out;
};
console.log('D112\'s FIX AGAINST EACH READ\'S OWN RULE (EXPLORATORY, deciding nothing; stats-newcombe-rules.mjs): each stored run whose reducer reads survivalChangeU or pooledSummed, its rule run on its units before the fix (method 8) and after it (method 10), every decision compared');
let runs = 0, compared = 0, differ = 0;
for (const [run, reducer, groupsOf] of RUNS) {
  const dir = join(RES, run);
  if (!existsSync(dir)) { console.log(`\n${run}: not stored here, not checked`); continue; }
  const M = await import(join(HERE, reducer));
  const raw = readdirSync(dir).filter(f => /\.json\.gz$/.test(f)).sort().map(f => JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, M.armOf(x)])) }));
  const groups = groupsOf(units), at = plant => { STATS.plant = plant; try { return Object.fromEntries(Object.entries(groups).map(([g, us]) => [g, us.length ? M.rule(us) : null])); } finally { STATS.plant = ''; } };
  const before = decisions(at('nocorrect')), after = decisions(at(''));
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort(), apart = keys.filter(k => before[k] !== after[k]);
  runs++; compared += keys.length; differ += apart.length;
  console.log(`\n${run} (${reducer}): ${units.length} units; ${keys.length} decisions compared; ${apart.length ? `${apart.length} differ` : 'none differs'}`);
  for (const k of apart) console.log(`  ${k}: before ${JSON.stringify(before[k])}, after ${JSON.stringify(after[k])}`);
  const verdicts = keys.filter(k => /(^|\.)(verdict|outcome|holds)$/i.test(k));
  console.log(`  its verdicts and parts: ${verdicts.map(k => `${k} ${JSON.stringify(after[k])}`).join('; ') || '(none named so)'}`);
}
// every other reducer here that reads the interval the fix changes: its run's units are not stored in results/, so it is not checked
const checked = new Set(RUNS.map(r => r[1]));
const others = readdirSync(HERE).filter(f => /^reduce-.*\.mjs$/.test(f) && !checked.has(f) && /\b(survivalChangeU|pooledSummed)\b/.test(readFileSync(join(HERE, f), 'utf8'))).sort();
console.log(`\nNot checked, their runs' units not stored here (each read stands as printed, D112): ${others.join(', ') || 'none'}`);
console.log(`\n${runs} runs, ${compared} decisions compared, ${differ} differing`);
