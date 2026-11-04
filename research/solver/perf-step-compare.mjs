/*
 * STEP P'S ACCEPTANCE, BEFORE AGAINST AFTER (the launch plan's step P: results-perf-step.txt). EXPLORATORY: a measurement,
 * deciding nothing. Reads two outputs of research/solver/perf-step.mjs, one run in a tree before step P's cuts and one
 * after, each on a machine running nothing else, and prints, household by household, each figure before and after with
 * their ratio, and whether the cuts were exact: the base's tables, the dial position's tables and the solved plan's 5,000
 * outcomes the same bit for bit (their digests). Then each output whole, so the file holds every figure it compares.
 *   node research/solver/perf-step-compare.mjs <before.txt> <after.txt>
 */
import { readFileSync } from 'node:fs';

const [fb, fa] = process.argv.slice(2);
if (!fb || !fa) throw new Error('usage: perf-step-compare.mjs <before.txt> <after.txt>');
const num = (s, re) => { const m = re.exec(s); return m ? Number(m[1]) : NaN; };
const str = (s, re) => { const m = re.exec(s); return m ? m[1] : null; };

function parse(file) {
  const text = readFileSync(file, 'utf8'), lines = text.split('\n');
  const head = lines.find(l => l.startsWith("STEP P'S ACCEPTANCE")) || '';
  const out = { text, code: str(head, /code (\w+)/), load: str(head, /load ([\d. ]+) at the start/), rows: {} };
  for (let i = 0; i < lines.length; i++) {
    const m = /^== (.+?): one worker: (.*)$/.exec(lines[i]);
    if (!m) continue;
    const [one, split, dial, mem] = [m[2], lines[i + 1] || '', lines[i + 2] || '', lines[i + 3] || ''];
    out.rows[m[1]] = {
      solve: num(one, /the solve ([\d.]+) s/), cpu: num(one, /\(([\d.]+) s of CPU\)/), msPath: num(one, /paths ([\d.]+) ms a path/),
      edit1: num(one, /at that rate\) ([\d.]+) min/), tablesMB: num(one, /the tables (\d+) MB/), digest: str(one, /digest (\w+)/),
      splitSolve: num(split, /split \d+ ways: the solve ([\d.]+) s/), p2000: num(split, /2,000 paths ([\d.]+) s/), p5000: num(split, /5,000 ([\d.]+) s;/),
      editSplit: num(split, /simulated plan ([\d.]+) min/), firstSplit: num(split, /first figures ([\d.]+) min/),
      surv2000: num(split, /survival ([\d.]+)% on 2,000/), surv5000: num(split, /([\d.]+)% on 5,000/), outcomes: str(split, /5,000 outcomes (\w+)/),
      dialSolve: num(dial, /one worker: the solve ([\d.]+) s/), dialMs: num(dial, /the paths ([\d.]+) ms a path/), dialFromBase: num(dial, /from its base ([\d.]+) min/),
      dialDigest: str(dial, /digest (\w+)/), bothMB: num(mem, /the position's (\d+) MB/), peakMB: num(mem, /so far (\d+) MB/)
    };
  }
  return out;
}

const B = parse(fb), A = parse(fa);
const ids = Object.keys(A.rows).filter(id => B.rows[id]);
const missing = [...new Set([...Object.keys(A.rows), ...Object.keys(B.rows)])].filter(id => !ids.includes(id));
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');
const ratio = (b, a) => (Number.isFinite(a) && Number.isFinite(b) && b > 0 ? `x${(a / b).toFixed(2)}` : 'n/a');
const pair = (b, a, unit, d = 1) => `${f(b, d)} to ${f(a, d)}${unit} (${ratio(b, a)})`;
const same = (b, a) => (b && a ? (b === a ? 'the same' : 'DIFFERENT') : 'not printed');

console.log(`STEP P'S ACCEPTANCE, BEFORE AGAINST AFTER (EXPLORATORY): before code ${B.code} (load ${B.load} at its start), after code ${A.code} (load ${A.load}); ${ids.length} households${missing.length ? `; in one run only: ${missing.join(', ')}` : ''}`);
let exact = true;
for (const id of ids) {
  const b = B.rows[id], a = A.rows[id];
  const t = same(b.digest, a.digest), d = same(b.dialDigest, a.dialDigest), o = same(b.outcomes, a.outcomes);
  if (t !== 'the same' || d !== 'the same' || o !== 'the same') exact = false;
  console.log(`\n== ${id}`);
  console.log(`   one worker: the solve ${pair(b.solve, a.solve, ' s')}; the Strategy tab's paths ${pair(b.msPath, a.msPath, ' ms a path')}; an edit to a solved and simulated plan ${pair(b.edit1, a.edit1, ' min')}`);
  console.log(`   split ${4} ways: the solve ${pair(b.splitSolve, a.splitSolve, ' s')}; 2,000 paths ${pair(b.p2000, a.p2000, ' s')}; 5,000 ${pair(b.p5000, a.p5000, ' s')}; an edit to a solved and simulated plan ${pair(b.editSplit, a.editSplit, ' min')}, to the first figures ${pair(b.firstSplit, a.firstSplit, ' min')}`);
  console.log(`   the dial at 10 on the base's tiers, one worker: the solve ${pair(b.dialSolve, a.dialSolve, ' s')}; its paths ${pair(b.dialMs, a.dialMs, ' ms a path')}; the position from its base ${pair(b.dialFromBase, a.dialFromBase, ' min')}`);
  console.log(`   the memory: the base's tables ${f(b.tablesMB, 0)} to ${f(a.tablesMB, 0)} MB, with the position's ${f(b.bothMB, 0)} to ${f(a.bothMB, 0)} MB; the peak resident set so far ${f(b.peakMB, 0)} to ${f(a.peakMB, 0)} MB`);
  console.log(`   bit for bit: the base's tables ${t}, the position's ${d}, the solved plan's 5,000 outcomes ${o}; survival ${f(b.surv5000, 2)}% to ${f(a.surv5000, 2)}% on 5,000`);
}
const med = xs => { const s = xs.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
const medRatio = k => med(ids.map(id => A.rows[id][k] / B.rows[id][k]));
console.log(`\nThe median ratio, after over before, over the ${ids.length} households: one worker's solve x${f(medRatio('solve'), 2)}, its paths x${f(medRatio('msPath'), 2)}, its edit x${f(medRatio('edit1'), 2)}; split, the solve x${f(medRatio('splitSolve'), 2)}, 2,000 paths x${f(medRatio('p2000'), 2)}, 5,000 x${f(medRatio('p5000'), 2)}, the edit x${f(medRatio('editSplit'), 2)}; the dial's solve x${f(medRatio('dialSolve'), 2)}, its paths x${f(medRatio('dialMs'), 2)}, from its base x${f(medRatio('dialFromBase'), 2)}`);
console.log(`VERDICT (the exact cuts): ${ids.length && !missing.length ? (exact ? 'EXACT: every table, position and outcome the same bit for bit' : 'NOT EXACT: a digest differs (above)') : 'not read (a household missing)'}`);
console.log('EXPLORATORY: a measurement for step P, deciding nothing.');
console.log(`\n---------- before (${fb.split('/').pop()}) ----------\n${B.text.trim()}\n\n---------- after (${fa.split('/').pop()}) ----------\n${A.text.trim()}`);
