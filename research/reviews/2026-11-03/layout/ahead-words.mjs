/*
 * THE NEXT TEN YEARS IN THE PROPOSED WORDS (LAYOUT.md section 8, finding L9): reads the "ahead:" lines figures.mjs printed
 * (each year's spending and its ledger words, src/solverWords.js ledgerWords) and prints each year as the proposed aheadWords
 * would say it. Nothing is computed beyond the words: the spending and every part are the lines' own.
 *   node ahead-words.mjs results-figures-S116.txt
 *
 * Today aheadWords says a wrapper's tier ("Move your pension 3 steps lower in risk") in every year it is below the plan's
 * own, so a tier held for nine years reads as nine moves, and a step back up reads as a further step down. The proposal says
 * a tier only in the year it changes, against the year before (the first year against the plan's own tier), and merges the
 * pension and the ISA where they move alike. The other parts (the draw, the re-wrap) are each year's own acts and stay. A year
 * with nothing to say reads "nothing to change" (today "as the year before", which the first year, and a working year, read
 * oddly).
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('ahead-words: name a results file');
const rows = readFileSync(file, 'utf8').split('\n').filter(l => l.startsWith('ahead: ')).map(l => {
  const [when, spend, notes, ledger] = l.slice('ahead: '.length).split(' | ');
  const tier = w => { const m = ledger.match(new RegExp(`${w} (\\d+) steps? safer`)); return m ? Number(m[1]) : 0; };
  const own = notes.split('; ').filter(n => n !== 'as the year before' && !/^Move your (pension|ISA) \d+ steps? lower in risk$/.test(n));
  return { when, spend, own, pen: tier('pension'), isa: tier('ISA') };
});
if (!rows.length) throw new Error(`ahead-words: no "ahead:" lines in ${file}`);
const steps = k => `${k} step${k === 1 ? '' : 's'}`;
const tierWords = (what, was, now) => (now === was ? null
  : was === 0 ? `Move your ${what} ${steps(now)} lower in risk`
    : now === 0 ? `Move your ${what} back to the risk you chose`
      : now < was ? `Move your ${what} ${steps(was - now)} back up in risk (${now} below the risk you chose)`
        : `Move your ${what} ${steps(now - was)} further down in risk (${now} below the risk you chose)`);
console.log(`# node ahead-words.mjs ${file.split('/').pop()}: the next ten years in the proposed words (LAYOUT.md section 8)`);
let pen = 0, isa = 0;
for (const r of rows) {
  const t = [];
  if (r.pen === r.isa && pen === isa) { const w = tierWords('pension and ISA', pen, r.pen); if (w) t.push(w); }
  else { for (const w of [tierWords('pension', pen, r.pen), tierWords('ISA', isa, r.isa)]) if (w) t.push(w); }
  [pen, isa] = [r.pen, r.isa];
  console.log(`proposed: ${r.when} | ${r.spend} | ${[...r.own, ...t].join('; ') || 'nothing to change'}`);
}
