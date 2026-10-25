/*
 * The purpose test's read on the latest candidate (EXPLORATORY; the external review, 25 Oct): audit-bestof-latest.mjs's
 * JSON files, a household whole or in chunks of its positions (POS_FROM, POS_TO). It throws unless every file has the
 * same settings (the candidate's hash, points, menuPlus, tiersBelow, the tier pairs, lambda, weight, paths and K), and
 * unless a household's chunks are disjoint; a household missing positions is named. Then, by household and over the
 * panel, D4's measure: the move
 * best on half A ahead of the chooser's pick on half B beyond 2 paired se (the script's own rule), at no more than 5% of
 * positions, in survival and in the whole score. The plant reads the same simulations with the last distinct rival
 * standing in for the pick: if the measure cannot see that, a pass says little.
 * usage: node purpose-read.mjs <file.json> ...
 */
import { readFileSync } from 'fs';
const BAR = 5, files = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')));
if (!files.length) throw new Error('no files');
const SAME = ['candidate', 'points', 'menuPlus', 'tiersBelow', 'tierState', 'lambda', 'weight', 'paths', 'K'];
for (const u of files) for (const k of SAME) if (JSON.stringify(u[k]) !== JSON.stringify(files[0][k])) throw new Error(`${u.id}: ${k} is ${JSON.stringify(u[k])}, not ${JSON.stringify(files[0][k])}: not one test`);
// a household's chunks merged; a whole run's file (no chunk) has its positions in order, 0 up
const byId = new Map();
for (const u of files) {
  const P = u.positions.map((x, i) => ({ ...x, pi: x.pi !== undefined ? x.pi : i }));
  if (!byId.has(u.id)) byId.set(u.id, { ...u, positions: [] });
  const h = byId.get(u.id), seen = new Set(h.positions.map(x => x.pi));
  for (const x of P) { if (seen.has(x.pi)) throw new Error(`${u.id}: position ${x.pi} in two files`); h.positions.push(x); }
}
const units = [...byId.values()];
for (const u of units) {
  u.positions.sort((a, b) => a.pi - b.pi);
  const want = u.positionsOf || 20, have = new Set(u.positions.map(x => x.pi));
  const missing = Array.from({ length: want }, (_, i) => i).filter(i => !have.has(i));
  if (missing.length) console.log(`NOTE ${u.id}: positions ${missing.join(',')} not in these files (or skipped by the script, a single distinct move)`);
}
const beyond = (x, se) => se > 0 && x > 2 * se;
const mean = a => a.reduce((p, q) => p + q, 0) / a.length, sem = a => { const m = mean(a); return Math.sqrt(a.reduce((p, x) => p + (x - m) ** 2, 0) / (a.length * (a.length - 1))); };
const f = (x, d = 2) => (x >= 0 ? '+' : '') + x.toFixed(d), pc = (k, n) => `${k}/${n} (${(100 * k / n).toFixed(1)}%)`;
const u0 = units[0];
console.log(`THE PURPOSE TEST ON THE LATEST CANDIDATE: ${units.length} households; the candidate ${u0.candidate} with menuPlus ${u0.menuPlus.join('+') || 'none'}, tiersBelow ${u0.tiersBelow} (tier pairs ${u0.tierState}), ${u0.points} wealth points, lambda ${u0.lambda}, weight ${u0.weight}; at each position the top ${u0.K} distinct moves on ${u0.paths} paths (half to pick, half to measure); every file on these settings`);
const all = [];
for (const u of units) {
  const P = u.positions, n = P.length;
  all.push(...P);
  const bs = P.filter(x => beyond(x.dSurv, x.seSurv)).length, bo = P.filter(x => beyond(x.dObj, x.seObj)).length;
  const ps = P.filter(x => beyond(x.plant.dSurv, x.plant.seSurv)).length, po = P.filter(x => beyond(x.plant.dObj, x.plant.seObj)).length;
  console.log(`  ${u.id}: ${n} positions (${P.filter(x => x.cliff).length} on the cliff), ${u.moves} moves; the rival best on A ahead on B: survival ${f(mean(P.map(x => x.dSurv)))} points, beyond 2 se at ${bs}; whole score ${f(mean(P.map(x => x.dObj)), 3)}, beyond 2 se at ${bo}; the pick itself best on A at ${P.filter(x => x.bestObj === 0).length} (whole score) | the plant: survival beyond 2 se at ${ps}, whole score at ${po}`);
}
const N = all.length;
const read = (key, label) => {
  const k = all.filter(x => beyond(x[key === 'surv' ? 'dSurv' : 'dObj'], x[key === 'surv' ? 'seSurv' : 'seObj'])).length;
  const d = all.map(x => (key === 'surv' ? x.dSurv : x.dObj));
  const kp = all.filter(x => beyond(key === 'surv' ? x.plant.dSurv : x.plant.dObj, key === 'surv' ? x.plant.seSurv : x.plant.seObj)).length;
  const dp = all.map(x => (key === 'surv' ? x.plant.dSurv : x.plant.dObj));
  console.log(`  ${label}: the rival best on A ahead on B by ${f(mean(d), 3)} on the mean (se ${sem(d).toFixed(3)}), beyond 2 se at ${pc(k, N)}: ${100 * k / N <= BAR ? 'WITHIN' : 'BEYOND'} D4's 5%`);
  const sizes = all.filter(x => beyond(key === 'surv' ? x.dSurv : x.dObj, key === 'surv' ? x.seSurv : x.seObj)).map(x => (key === 'surv' ? x.dSurv : x.dObj)).sort((a, b) => b - a);
  if (sizes.length) console.log(`    the advantages beyond 2 se, largest first: ${sizes.map(x => f(x, 3)).join(', ')}`);
  console.log(`  ${label}, the plant: ahead by ${f(mean(dp), 3)} on the mean (se ${sem(dp).toFixed(3)}), beyond 2 se at ${pc(kp, N)}: the measure ${100 * kp / N > BAR ? 'SEES' : 'does NOT see'} a pick as bad as the last distinct rival`);
  return { k, kp };
};
console.log(`OVER THE PANEL (${N} positions, ${all.filter(x => x.cliff).length} on the cliff):`);
const s = read('surv', 'survival'), o = read('obj', 'whole score');
const ok = k => 100 * k / N <= BAR, sees = 100 * s.kp / N > BAR || 100 * o.kp / N > BAR;
console.log(`VERDICT (exploratory: one weight, the latest candidate on the agent's code): by D4's measure, survival ${ok(s.k) ? 'PASS' : 'FAIL'}, the whole score ${ok(o.k) ? 'PASS' : 'FAIL'}; the plant ${sees ? 'is seen: the measure has power against a pick as bad as the last distinct rival' : 'is NOT seen: a pass says little'}`);
