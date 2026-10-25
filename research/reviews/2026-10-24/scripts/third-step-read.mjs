/*
 * The tier steps' read (EXPLORATORY): third-step.mjs's JSON summaries, by household and on the panel mean, against N4's bar
 * as n4-menu.mjs reads it (D4's targets: 0.5 points on a household and 0.2 on the panel mean, in survival or the whole
 * score, beyond noise: the paired 95% interval above nothing; and no household losing more than 0.5 beyond noise). The
 * panel mean's se is from the households' own paired se, each household's paths its own draw, as n4-menu.mjs takes it.
 * usage: node third-step-read.mjs <summary.json> ...
 */
import { readFileSync } from 'fs';
const HH = 0.5, MEAN = 0.2, f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
const rows = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')));
const byBelow = {};
for (const r of rows) (byBelow[r.below] = byBelow[r.below] || []).push(r);
for (const [below, list] of Object.entries(byBelow)) {
  console.log(`THE JOINT STEP'S LOWEST RUNG ${below} BELOW THE PLAN'S TIER (2 today): ${list.length} households, estate weight ${[...new Set(list.map(r => r.w))].join(' ')}, ${[...new Set(list.map(r => r.points))].join(' ')} wealth points, ${[...new Set(list.map(r => r.paths))].join(' ')} paths each, paired against the candidate`);
  const beats = [], loses = [];
  for (const r of list) {
    const p = r.paired, bottom = r.third.tierShare ? r.third.tierShare[`${below}/${below}`] || 0 : 0;
    console.log(`  ${r.id}: the candidate ${r.base.survival.toFixed(2)}%, with the step ${r.third.survival.toFixed(2)}%: survival ${f3(p.survival[0])} (se ${p.survival[1].toFixed(3)}; ${p.saved} saved, ${p.lost} lost), whole score ${f3(p.whole[0])} (se ${p.whole[1].toFixed(3)}); the new bottom rung in ${(100 * bottom).toFixed(1)}% of spending years`);
    for (const [x, se, what] of [[p.survival[0], p.survival[1], 'survival'], [p.whole[0], p.whole[1], 'whole score']]) {
      if (x > HH && x - 1.96 * se > 0) beats.push(`${r.id} ${what} ${f3(x)}`);
      if (x < -HH && x + 1.96 * se < 0) loses.push(`${r.id} ${what} ${f3(x)}`);
    }
  }
  if (list.length > 1) for (const [k, what] of [['survival', 'survival'], ['whole', 'whole score']]) {
    const m = list.reduce((t, r) => t + r.paired[k][0], 0) / list.length, se = Math.sqrt(list.reduce((t, r) => t + r.paired[k][1] ** 2, 0)) / list.length;
    console.log(`  the panel mean, ${what}: ${f3(m)} (se ${se.toFixed(3)}; its 95% interval ${f3(m - 1.96 * se)} to ${f3(m + 1.96 * se)})`);
    if (m > MEAN && m - 1.96 * se > 0) beats.push(`panel mean ${what} ${f3(m)}`);
  }
  if (list.length === 1) console.log('  one household: no panel mean');
  console.log(`  by N4's bar: beyond the targets ${beats.length ? beats.join('; ') : 'nowhere'}; a household loss beyond 0.5 ${loses.length ? loses.join('; ') : 'nowhere'}: ${beats.length && !loses.length ? 'WOULD PASS' : 'would not pass'} (exploratory, one weight, ${[...new Set(list.map(r => r.paths))].join(' ')} paths: not N4's read)`);
}
