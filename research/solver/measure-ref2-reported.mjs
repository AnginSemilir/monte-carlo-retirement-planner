/*
 * REF-2's REPORTED FIGURES (not items; each from the files): S360's 2 x 2 (results-ref2.txt's item 1 lines): per world
 * each arm's table less its runs, ORDER's effect (BO less BASE) and RS's deepening under BASE and under ORDER; the 95%
 * share household's year-0 read (case3 and case4's 'solve CAND' tables, the reader read at the initial state) against
 * its own opening's runs weighted by the mix's weights, and its own opening's tables under BASE and BO.
 *   node research/solver/measure-ref2-reported.mjs > research/solver/results-ref2-reported.txt
 */
import { readFileSync } from 'node:fs';
const R = readFileSync('research/solver/results-ref2.txt', 'utf8'), D = 'research/solver/results/diagref2/';
const f4 = x => x.toFixed(4);
const tw = R.split('\n').find(l => l.includes('the 2 x 2 (own opening'));
for (const m of tw.matchAll(/world (\d): BASE ([\d.]+)\/([\d.]+), RS ([\d.]+)\/([\d.]+), BO ([\d.]+)\/([\d.]+), RSO ([\d.]+)\/([\d.]+)/g)) {
  const [k, bt, br, rt, rr, ot, or, st, sr] = [m[1], ...m.slice(2).map(Number)];
  console.log(`S360 world ${k}: table less runs BASE ${f4(bt - br)} RS ${f4(rt - rr)} BO ${f4(ot - or)} RSO ${f4(st - sr)}; ORDER's effect on the table ${f4(ot - bt)}, on the runs ${f4(or - br)}; RS's deepening under BASE ${f4((rt - rr) - (bt - br))}, under ORDER ${f4((st - sr) - (ot - or))}, ORDER's share of it removed ${f4(1 - ((st - sr) - (ot - or)) / ((rt - rr) - (bt - br)))}`);
}
for (const [arm, c] of [['BASE', 'case3'], ['BO', 'case4']]) {
  const t = readFileSync(D + c + '.txt', 'utf8');
  const solve = Number(t.match(/solve CAND [^:]+: table ([\d.]+)/)[1]);
  const w = [...t.matchAll(/tables \S+ (\d) z \S+ weight ([\d.]+): OWN ([\d.]+)/g)].map(m => ({ k: +m[1], w: +m[2], own: +m[3] }));
  const sims = [...t.matchAll(/sim \S+ (\d) OWN ai \d+: (\d+)\/(\d+)/g)].map(m => 100 * m[2] / m[3]);
  const own = w.reduce((s, x) => s + x.w * x.own, 0), runs = w.reduce((s, x) => s + x.w * sims[x.k], 0);
  console.log(`share 0.95 ${arm}: the year-0 read at the initial state ${f4(solve)}; the own opening's tables ${w.map(x => f4(x.own)).join(', ')} (mixed ${f4(own)}); its runs mixed ${f4(runs)}; the year-0 read less the runs ${f4(solve - runs)}`);
}
