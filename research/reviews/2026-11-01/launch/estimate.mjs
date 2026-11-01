/*
 * THE LAUNCH PLAN'S TIME ESTIMATES (LAUNCH-PLAN.md sections 1, 2 and 4): arithmetic on launch/results-app-timing.txt
 * (app-timing.mjs's lines), nothing else. One worker, one core, as measured; the split is not estimated here (gate 5's
 * measured speed-up is in results-facts.txt).
 *   node estimate.mjs results-app-timing.txt
 */
import { readFileSync } from 'node:fs';

const txt = readFileSync(process.argv[2] || 'results-app-timing.txt', 'utf8');
const need = (m, what) => { if (!m) throw new Error(`estimate: not found: ${what}`); return m; };
const rows = {};
for (const m of txt.matchAll(/^(S\d+) \((the floor at 0\.8 of the target|the plan's own floor: none)\) the app's solve[^:]*: (\d+) s; the spending levels on its menu (\[[^\]]*\]); tables (\d+) MB;[^;]*; the simulation ([\d.]+) ms a path over (\d+) paths \(survival ([\d.]+)%\)/gm)) {
  rows[`${m[1]}|${m[2].startsWith('the floor') ? 'floor' : 'none'}`] = { id: m[1], floor: m[2].startsWith('the floor'), solve: +m[3], levels: m[4], mb: +m[5], ms: +m[6], paths: +m[7], surv: +m[8] };
}
for (const m of txt.matchAll(/^(S\d+) \((the floor at 0\.8 of the target|the plan's own floor: none)\) the dial at ten[^:]*: (\d+) s \(([\d.]+) x the base's\); tables (\d+) MB beside the base's; the simulation ([\d.]+) ms a path \(([\d.]+) x the base's; survival ([\d.]+)%\)/gm)) {
  const r = need(rows[`${m[1]}|${m[2].startsWith('the floor') ? 'floor' : 'none'}`], `${m[1]}'s base line`);
  Object.assign(r, { lockSolve: +m[3], lockMb: +m[5], lockMs: +m[6], lockSurv: +m[8] });
}
const all = Object.values(rows);
need(all.length && all.every(r => r.lockSolve), 'every household with both lines');
const min = s => (s / 60).toFixed(1);
console.log('# node estimate.mjs results-app-timing.txt (one worker, one core, as measured; 5,000 paths is the engine\'s monteCarlo default)\n');
for (const r of all.sort((a, b) => a.id.localeCompare(b.id) || (a.floor ? -1 : 1))) {
  const tag = `${r.id}, ${r.floor ? 'the floor at 80%' : 'no floor (the app as wired)'}`;
  console.log(`- ${tag}: the menu's spending levels ${r.levels}; the solve ${r.solve} s and 5,000 paths ${(5 * r.ms).toFixed(0)} s, so an edit to a solved and simulated plan ${min(r.solve + 5 * r.ms)} min; the dial at ten from cold (the base, then the position, then 5,000 of its paths) ${min(r.solve + r.lockSolve + 5 * r.lockMs)} min; the two solves' tables ${r.mb + r.lockMb} MB; survival on ${r.paths} paths ${r.surv}% (the dial at ten ${r.lockSurv}%).`);
}
const ids = [...new Set(all.map(r => r.id))];
for (const id of ids) {
  const f = rows[`${id}|floor`], n = rows[`${id}|none`];
  if (f && n) console.log(`- ${id}, the floor's cost: the solve x${(f.solve / n.solve).toFixed(2)}, a simulated path x${(f.ms / n.ms).toFixed(2)}; survival ${n.surv}% with no floor against ${f.surv}% with it, on the same ${f.paths} paths.`);
}
// step L4: positions 1, 3, 6 and 10 on a household at 4,000 paths: the base solve and three locked solves (each taken at the
// dial at ten's measured time), the base's 4,000 paths and three positions' 4,000 each (at the dial at ten's measured rate)
const fl = all.filter(r => r.floor);
const l4 = fl.map(r => (r.solve + 3 * r.lockSolve + 4 * (r.ms + 3 * r.lockMs)) / 60);
// step L4 with both of B3's variants (the age weights and the lock, B3a; the lock alone, B3b): six locked solves and six positions'
// paths, each at the dial at ten's measured times (the age weights do not change a solve's work)
const l4b = fl.map(r => (r.solve + 6 * r.lockSolve + 4 * (r.ms + 6 * r.lockMs)) / 60);
// step L5, the one-off cost probe (M12's design): the eight households, four cost cells each, the candidate's solve and 3,000 of
// its paths a cell, at the base's measured times; the app's rules' paths are left out (a fraction of a second a path less)
const l5 = fl.map(r => 4 * (r.solve + 3 * r.ms) / 60);
console.log(`- Step L4 at 4,000 paths, a household: ${fl.map((r, i) => `${r.id} ${l4[i].toFixed(0)} core-minutes`).join(', ')}; the eight households at their mean, about ${(8 * l4.reduce((a, b) => a + b, 0) / l4.length / 60).toFixed(1)} core-hours.`);
console.log(`- Step L4 with both variants of B3 (six locked positions a household): ${fl.map((r, i) => `${r.id} ${l4b[i].toFixed(0)} core-minutes`).join(', ')}; the eight households at their mean, about ${(8 * l4b.reduce((a, b) => a + b, 0) / l4b.length / 60).toFixed(1)} core-hours.`);
console.log(`- Step L5 (the one-off cost probe: four cells a household, a solve and 3,000 paths each): ${fl.map((r, i) => `${r.id} ${l5[i].toFixed(0)} core-minutes`).join(', ')}; the eight households at their mean, about ${(8 * l5.reduce((a, b) => a + b, 0) / l5.length / 60).toFixed(1)} core-hours.`);
