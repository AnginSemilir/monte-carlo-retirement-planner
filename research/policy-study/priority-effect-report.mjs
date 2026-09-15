/*
 * The tables for priority-effect.mjs.
 *
 * Kept separate from the run so the findings can be re-cut without re-simulating: the run is twenty
 * minutes, the report is instant, and every question asked after the fact - "what about the pension-heavy
 * ones", "does it differ in drawdown" - is a slice of a file that already exists.
 *
 * Usage: node priority-effect-report.mjs [results/priority-effect.json]
 */
import fs from 'fs';
import path from 'path';
import * as E from '../engine.mjs';

const file = process.argv[2] || path.join(import.meta.dirname, 'results', 'priority-effect.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const recs = data.records;
const KEYS = E.PRIORITY_KEYS;
const NAME = Object.fromEntries(KEYS.map(k => [k, E.PRIORITY_METRICS[k].label]));

const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';
const bar = (f, w = 22) => '█'.repeat(Math.round(f * w)).padEnd(w, '·');
const hr = (s) => console.log(`\n${s}\n${'='.repeat(s.length)}`);

console.log(`priority-effect: ${recs.length} households, ${data.trials} paths, seed ${data.seed}`);
console.log(`generated ${data.generated || '(partial run)'}`);

// ---------------------------------------------------------------- 1. does it change the answer
hr('1. HOW OFTEN DOES RANKING A PRIORITY FIRST CHANGE THE RECOMMENDATION?');
console.log('priority'.padEnd(34), 'changed'.padStart(9), '  ', 'share');
for (const k of KEYS) {
  const n = recs.filter(r => r.byFirst[k].changed).length;
  console.log(NAME[k].padEnd(34), String(n).padStart(4) + '/' + String(recs.length).padStart(4), ' ', bar(n / recs.length), pct(n, recs.length));
}
const balN = recs.filter(r => r.balanced.changed).length;
console.log('(balance them all)'.padEnd(34), String(balN).padStart(4) + '/' + String(recs.length).padStart(4), ' ', bar(balN / recs.length), pct(balN, recs.length));

// ---------------------------------------------------------------- 2. is the change what they meant
hr('2. WHEN A HOUSEHOLD RANKS SOMETHING FIRST, DOES IT GET MORE OF IT?');
console.log('Measured against the default order, in multiples of that priority\'s own tolerance.');
console.log('"worse" means ranking it first produced LESS of the thing than not ranking it at all.\n');
console.log('priority'.padEnd(34), 'better'.padStart(7), 'same'.padStart(7), 'worse'.padStart(7), 'median gain'.padStart(12), 'worst'.padStart(8));
for (const k of KEYS) {
  const v = recs.map(r => r.byFirst[k]);
  const better = v.filter(x => x.intent === 'better'), worse = v.filter(x => x.intent === 'worse');
  const gains = better.map(x => x.gainEps).sort((a, b) => a - b);
  const med = gains.length ? gains[Math.floor(gains.length / 2)] : 0;
  const worstLoss = worse.length ? Math.min(...worse.map(x => x.gainEps)) : 0;
  console.log(NAME[k].padEnd(34), String(better.length).padStart(7), String(v.length - better.length - worse.length).padStart(7),
    String(worse.length).padStart(7), (med ? med.toFixed(2) + '×' : '—').padStart(12),
    (worstLoss ? worstLoss.toFixed(2) + '×' : '—').padStart(8));
}

// ---------------------------------------------------------------- 3. why it did not change
hr('3. WHEN IT DID NOT CHANGE, WAS THE FIELD EVEN DIFFERENT ON IT?');
console.log('Spread = best minus worst across all candidates, in multiples of the tolerance that would');
console.log('let that priority decide. Under 1× the priority CANNOT bite: every option counts as equal.\n');
console.log('priority'.padEnd(34), 'median spread'.padStart(14), 'inert (<1x)'.padStart(12), 'share');
for (const k of KEYS) {
  const sp = recs.map(r => r.metrics[k].spread).sort((a, b) => a - b);
  const med = sp[Math.floor(sp.length / 2)];
  const inert = sp.filter(x => x < 1).length;
  console.log(NAME[k].padEnd(34), (med.toFixed(2) + '×').padStart(14), String(inert).padStart(6) + '/' + String(recs.length).padStart(4), ' ', pct(inert, recs.length));
}

hr('   ... AND SO: OF THE CASES THAT DID NOT CHANGE, HOW MANY COULD NOT HAVE?');
console.log('priority'.padEnd(34), 'unchanged'.padStart(10), 'of those, tied'.padStart(15), 'genuinely differed'.padStart(19));
for (const k of KEYS) {
  const unchanged = recs.filter(r => !r.byFirst[k].changed);
  const tied = unchanged.filter(r => r.metrics[k].spread < 1).length;
  console.log(NAME[k].padEnd(34), String(unchanged.length).padStart(10),
    (String(tied) + ' (' + pct(tied, unchanged.length) + ')').padStart(15),
    (String(unchanged.length - tied) + ' (' + pct(unchanged.length - tied, unchanged.length) + ')').padStart(19));
}

// ---------------------------------------------------------------- 4. how live is the control
hr('4. HOW MANY DIFFERENT ANSWERS DO THE SEVEN SETTINGS PRODUCE?');
const dist = {};
recs.forEach(r => { dist[r.distinctAnswers] = (dist[r.distinctAnswers] || 0) + 1; });
Object.keys(dist).map(Number).sort((a, b) => a - b).forEach(n => {
  const label = n === 1 ? '1  (the control is inert for this household)' : `${n}`;
  console.log(String(label).padEnd(44), String(dist[n]).padStart(4), bar(dist[n] / recs.length), pct(dist[n], recs.length));
});
const inertAll = dist[1] || 0;
console.log(`\nThe priority control changes nothing at all for ${inertAll} of ${recs.length} households (${pct(inertAll, recs.length)}).`);

// ---------------------------------------------------------------- 5. by household type
hr('5. WHERE DOES THE CONTROL MATTER MOST?');
const axisOf = (r, i) => (r.id && r.name ? r.name.split('/')[i] : null);
for (const [i, axis] of [[0, 'stage'], [1, 'mix'], [2, 'wealth'], [3, 'spend']]) {
  const groups = {};
  recs.forEach(r => {
    const g = axisOf(r, i); if (!g) return;
    (groups[g] = groups[g] || []).push(r);
  });
  if (!Object.keys(groups).length) continue;
  console.log(`\nby ${axis}:`);
  Object.entries(groups).sort((a, b) => b[1].length - a[1].length).forEach(([g, rs]) => {
    const live = rs.filter(r => r.distinctAnswers > 1).length;
    const avg = rs.reduce((s, r) => s + r.distinctAnswers, 0) / rs.length;
    console.log('  ' + g.padEnd(20), String(rs.length).padStart(4), 'households', ' control does something in', pct(live, rs.length).padStart(6),
      ' avg distinct answers', avg.toFixed(2));
  });
}
