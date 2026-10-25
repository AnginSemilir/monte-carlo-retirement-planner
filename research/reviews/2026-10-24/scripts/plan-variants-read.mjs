/*
 * The plan variants' read (EXPLORATORY): plan-variants.mjs's files, each variant paired against the plan as it stands on
 * the same paths. It throws unless every file of a household has the same settings, horizon and paths (their hash), so
 * the variant is the only thing that differs, and unless each household has the plan as it stands. Then, by household:
 * survival to the plan's end, no shortfall by 85 and by 90, the whole score and the end median, and the paired changes
 * with their se, against N4's household bar (0.5 points beyond noise: the paired 95% interval clear of nothing).
 * One weight and 3,000 paths: exploratory, not N4's read.
 * usage: node plan-variants-read.mjs <file> ...
 */
import { readFileSync } from 'fs';
const HH = 0.5, f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, seOf = a => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) / a.length); };
const read = (x, se) => (x - 1.96 * se > 0 ? (x > HH ? 'a GAIN beyond 0.5 and beyond noise' : 'a gain beyond noise, under 0.5')
  : x + 1.96 * se < 0 ? (x < -HH ? 'a LOSS beyond 0.5 and beyond noise' : 'a loss beyond noise, under 0.5') : 'within noise');
const groups = {};
for (const f of process.argv.slice(2)) { const v = JSON.parse(readFileSync(f, 'utf8')); (groups[`${v.id} ${v.set} W${v.w}`] = groups[`${v.id} ${v.set} W${v.w}`] || []).push(v); }
const SAME = ['points', 'paths', 'seed', 'tiersBelow', 'menuPlus', 'T', 'pathsHash'];
for (const [g, list] of Object.entries(groups)) {
  list.sort((a, b) => a.index - b.index);
  const b = list.find(v => v.index === 0);
  if (!b) throw new Error(`${g}: no file for the plan as it stands`);
  for (const v of list) for (const k of SAME) if (JSON.stringify(v[k]) !== JSON.stringify(b[k])) throw new Error(`${g}: ${v.label} differs from the plan as it stands in ${k}: not a fair test`);
  console.log(`${g}: ${b.points} wealth points, ${b.paths} paths of seed ${b.seed} (hash ${b.pathsHash}), tiersBelow ${b.tiersBelow}, menuPlus ${b.menuPlus.join('+') || 'none'}; every variant on the same settings and paths`);
  for (const v of list) {
    console.log(`  ${v.label} (State Pension ${v.statePension}; GIA ${v.gia}; solved and run in ${v.secs.toFixed(0)} s): survival to ${v.endAge} ${v.survival.toFixed(2)}%; no shortfall by 85 ${v.lasts85.toFixed(2)}%, by 90 ${v.lasts90.toFixed(2)}%; whole score ${v.whole.toFixed(3)}; median wealth at the end GBP ${Math.round(v.endMedian)}`);
    if (v.index === 0) continue;
    const dS = v.surv.map((x, k) => 100 * (x - b.surv[k])), dW = v.ws.map((x, k) => x - b.ws[k]);
    const saved = v.surv.filter((x, k) => x && !b.surv[k]).length, lost = v.surv.filter((x, k) => !x && b.surv[k]).length;
    const [s, ss, w, sw] = [mean(dS), seOf(dS), mean(dW), seOf(dW)];
    console.log(`    less the plan as it stands, paired: survival ${f3(s)} (se ${ss.toFixed(3)}; ${saved} saved, ${lost} lost): ${read(s, ss)}; whole score ${f3(w)} (se ${sw.toFixed(3)}): ${read(w, sw)}`);
  }
}
