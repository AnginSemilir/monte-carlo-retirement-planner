/*
 * MENU GAP's read (EXPLORATORY): every figure the note quotes, printed from menu-gap.mjs's JSON summaries.
 * usage: node menu-gap-read.mjs <summary.json> ...
 */
import { readFileSync } from 'fs';
const f2 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => x.toFixed(4);
const HH = 0.5;   // N4's bar on a household (D4's target), in points of the whole score or of survival
const rows = [];
for (const file of process.argv.slice(2)) {
  const s = JSON.parse(readFileSync(file, 'utf8'));
  const g = s.tableGain, im = s.improved;
  console.log(`${s.id} at estate weight ${s.w}, ${s.points} wealth points, seed 7002 (the tuning seed): the candidate survives ${s.survival0.toFixed(2)}%, whole score ${s.whole0.toFixed(3)}; solve ${Math.round(s.solveS)} s`);
  console.log(`  N4's ceilings for this household: ${s.n4Ceilings.map(Math.round).join(', ')}; the menu's corners ${s.corners.map(Math.round).join(', ')}`);
  console.log(`  1. the tables' gap, ${s.decisions} decisions on the first ${s.paths} paths, summed along each path (points of the whole score a path, mean and se):`);
  console.log(`     the finer menu ${f4(g.all[0])} (se ${f4(g.all[1])}): N4's ceilings at the menu's levels ${f4(g.n4[0])} (se ${f4(g.n4[1])}), beyond them ${f4(g.beyondN4[0])} (se ${f4(g.beyondN4[1])})`);
  console.log(`     one dimension at a time from the 3 best menu moves: the level ${f4(g.levelOnly[0])}, the draw-first ceiling ${f4(g.ceilingOnly[0])}, the re-wrap ${f4(g.rewrapOnly[0])}`);
  const pd = s.perDecision;
  console.log(`     a decision's gap: median ${pd.median.toExponential(1)}, 95th percentile ${pd.p95.toExponential(1)}, 99th ${pd.p99.toExponential(1)}, the largest ${pd.max.toFixed(3)} points; above 0.001 points at ${pd.above001} decisions, above 0.01 at ${pd.above01}`);
  console.log(`     where the finer best differs (L level, C draw-first ceiling, H re-wrap, base another menu move), points a path: ${Object.entries(s.dimPoints).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v.toFixed(4)} (${s.dims[k]} decisions)`).join('; ')}`);
  if (s.hole) console.log(`  2. the planted hole (the basic-rate corner out of the menu), ${s.hole.decisions} decisions on ${s.hole.paths} paths: it costs ${f4(s.hole.holePoints)} points a path in the tables, the search finds ${f4(s.hole.foundPoints)}; of the ${s.hole.decisionsHoleAbove001} decisions where it costs over 0.001 points, half or more found at ${s.hole.foundHalf}: ${s.hole.decisionsHoleAbove001 > 0 && s.hole.foundHalf >= 0.9 * s.hole.decisionsHoleAbove001 ? 'CAUGHT' : 'NOT CAUGHT'}`);
  if (im) {
    console.log(`  3. simulated, paired on the first ${im.finer.paths} paths (the same paths as the candidate's run; points, se):`);
    for (const [k, label] of [['finer', 'the finer menu\'s greedy policy less the candidate'], ['n4', 'N4\'s menu\'s greedy policy less the candidate'], ['finerLessN4', 'the finer menu\'s less N4\'s']]) {
      const x = im[k], beyond = (v, se) => (v > HH && v - 1.96 * se > 0 ? ' BEYOND N4\'S HOUSEHOLD BAR' : v - 1.96 * se > 0 ? ' (above nothing beyond noise)' : '');
      console.log(`     ${label}: whole score ${f2(x.whole[0])} (se ${x.whole[1].toFixed(3)})${beyond(x.whole[0], x.whole[1])}, survival ${f2(x.survival[0])} (se ${x.survival[1].toFixed(3)}; ${x.saved} saved, ${x.lost} lost)${beyond(x.survival[0], x.survival[1])}${x.changed !== undefined ? `; ${x.changed} of ${x.decisions} decisions off the menu` : ''}`);
    }
  }
  if (s.top) { console.log('  the largest single gaps:'); for (const x of s.top.slice(0, 5)) console.log(`     path ${x.p}, age ${x.age}, ${(100 * x.gap).toFixed(3)} points (wealth ${x.wealth}, pension ${x.pen}): the menu's ${x.menu}; the finer ${x.finer}`); }
  rows.push(s);
}
