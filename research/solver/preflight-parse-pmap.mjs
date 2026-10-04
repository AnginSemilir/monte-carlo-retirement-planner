// PMAP's preflight parse (moved out of preflight-pmap.sh's inline node -e, where an apostrophe in a message ended the
// quoted script on 4 Oct): the five household logs parsed and gated; four planted faults in the logs refused (an
// arithmetic off the measured weight, a coverage weight over the 6-point weight, a threshold off, a missing checks line);
// the audit's own planted faults (PMAP_PLANT acc and cov) refused by their own self-checks; the reading reaches its panel.
// No figure is read.
//   node research/solver/preflight-parse-pmap.mjs [dir=research/solver/results/diagpmap-preflight]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as R from './reduce-pmap.mjs';
const d = process.argv[2] || 'research/solver/results/diagpmap-preflight';
const fail = m => { console.log(`PREFLIGHT PARSE FAILED: ${m}`); process.exit(1); };
const ts = (existsSync(d) ? readdirSync(d) : []).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(d, f), 'utf8'));
if (!ts.length) fail('no logs (a check on nothing)');
const us = ts.flatMap(R.parse), bad = R.gate(us);
if (bad.length) fail('\n  ' + bad.join('\n  '));
const planted = [
  ['an arithmetic off the measured weight', t => t.replace(/dmax \S+/, 'dmax 5.00e-3')],
  ['a coverage weight above the 6-point weight', t => t.replace(/covbad 0$/m, 'covbad 3')],
  ['a threshold off', t => t.replace(/accbad 0 /, 'accbad 1 ')],
  ['a missing checks line', t => t.replace(/^.*checks .*$/m, '')]];
for (const [name, f] of planted) if (!R.gate(ts.map(f).flatMap(R.parse)).length) fail(`${name} not refused`);
for (const [P, re] of [['acc', /: [1-9][0-9]* thresholds off/], ['cov', /and [1-9][0-9]* reads with the coverage weight above/]]) {
  const file = join(d, `plant-${P}.txt`);
  if (!existsSync(file)) fail(`no log of the audit plant ${P}`);
  const pb = R.gate(R.parse(readFileSync(file, 'utf8')));
  if (!pb.some(x => re.test(x))) fail(`the audit plant ${P} was not refused by its own self-check:\n  ${pb.slice(0, 4).join('\n  ')}`);
}
let n = 0, p = false;
R.reading(us, l => { n++; if (/^PANEL/.test(l.trim())) p = true; });
if (!p) fail('the reading did not reach its panel line');
console.log(`PREFLIGHT PARSE PASSED: ${us.length} households gated (the arithmetic held to the measured weight on every read, the node check, the self-checks, the histograms, the control); ${planted.length} planted log faults refused; the faults planted in the audit (acc*, the coverage weight) refused by their own self-checks; the reading reached its panel line (${n} lines, not read)`);
