/*
 * THE HEADLINE'S BACK LINE IN THE PROPOSED WORDS (LAYOUT.md section 8, finding L12): reads the headline figures.mjs printed
 * ("headline (all N)") and prints today's back line (src/solverWords.js WORDS.back and WORDS.never) beside the proposed one.
 * Nothing is computed: the year, the years in and the case are the headline's own.
 *   node headline-words.mjs results-figures-S116.txt [results-extra-S116.txt]
 *
 * The headline's back year is the median over the paths of each path's first year at the target (headlineOf), so "on a
 * typical run of the markets" names a different thing from the next ten years' "typical run" (one path, aheadOf's). The
 * proposal says what the figure is: "in half the markets". With extra.mjs's file it prints the typical run's own first year
 * back beside it, to show the two differ.
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('headline-words: name a results file');
const txt = readFileSync(file, 'utf8');
const m = txt.match(/^headline \(all (\d+)\): (\{.*\})$/m);
if (!m) throw new Error(`headline-words: no "headline (all N)" line in ${file}`);
const h = JSON.parse(m[2]);
const years = n => (n === 1 ? 'year' : 'years');
const today = h.case === 'atTarget' ? '(none: the plan starts at its target)'
  : h.case === 'never' ? 'On a typical run of the markets you stay below your target; see why below.'
    : `On a typical run of the markets you are back at your full target by ${h.backYear} (${h.backIn} ${years(h.backIn)} in).`;
const proposed = h.case === 'atTarget' ? '(none)'
  : h.case === 'never' ? 'In more than half the markets you stay below your target; see why below.'
    : `In half the markets you are back at your full target by ${h.backYear} (${h.backIn} ${years(h.backIn)} in).`;
console.log(`# node headline-words.mjs ${process.argv.slice(2).map(f => f.split('/').pop()).join(' ')}: the headline's back line, today and proposed (LAYOUT.md section 8)`);
console.log(`case: ${h.case}; the headline on ${m[1]} paths`);
console.log(`today: ${today}`);
console.log(`proposed: ${proposed}`);
if (process.argv[3]) {
  const x = readFileSync(process.argv[3], 'utf8').match(/^typical run back at target: (.*)$/m);
  if (!x) throw new Error('headline-words: no "typical run back at target" line in the extra file');
  console.log(`the typical run (the next ten years' path) is back at target first at: ${x[1]}`);
}
