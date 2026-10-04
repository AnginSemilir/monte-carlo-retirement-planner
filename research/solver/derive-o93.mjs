// O93's like-for-like comparison (the plan-auditor's BLOCKING 2 of 4 Oct 22:0x UK on the 21:57 record): 7au's learner ended
// at S194's node with mean weights 0.481, 0.503, 0.015 after 40.0 updates a path (results-7au.txt); the derivation's 0.301 to
// 0.312 is the expected-evidence path at year 25 (results-derive-7au.txt section 5), not at 40 updates. This prints, by
// derive-7au.mjs's own method (learn.mjs's signal x = S z + V e, S/V 0.125 and 0.13, prior 1/6, 2/3, 1/6, nodes -sqrt3, 0,
// sqrt3): (a) the expected-evidence weight on world 0 at 25 and 40 updates; (b) the mean posterior after 40 updates over
// 100,000 unselected world-0 paths with noise (mulberry32 seed 9301, a derivation's own stream: no study seed). The gap
// rows 0.145 and 0.15: the deep review after 7au (deep-review-log.md 4 Oct 22:08 UK) found every node path carries world 0's
// shift (no selection) and that derive-7au.mjs used S126's S/V for S194; these rows show the S/V at which the unselected mean
// meets 7au's 0.481. S194's own S/V is NOT CHECKED. An end weight says nothing of the pace in years 6 to 25.
//   node research/solver/derive-o93.mjs > research/solver/results-derive-o93.txt
const z = [-Math.sqrt(3), 0, Math.sqrt(3)], prior = [1 / 6, 2 / 3, 1 / 6];
let seed = 9301; const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const normal = () => { let u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
const post = l => { const m = Math.max(...l), w = prior.map((p, k) => p * Math.exp(l[k] - m)), s = w.reduce((a, b) => a + b, 0); return w.map(x => x / s); };
console.log("O93: 7au's learner's weights at S194's node against derive-7au.mjs's method at matched updates (results-7au.txt: 0.481, 0.503, 0.015 after 40.0 updates a path)");
for (const sv of [0.125, 0.13, 0.145, 0.15]) {
  const expAt = t => post(z.map(zk => -t * sv * sv * (zk - z[0]) ** 2 / 2));
  const N = 100000, acc = [0, 0, 0];
  for (let i = 0; i < N; i++) { const l = [0, 0, 0]; for (let t = 0; t < 40; t++) { const x = sv * z[0] + normal(); for (let k = 0; k < 3; k++) l[k] -= (x - sv * z[k]) ** 2 / 2; } post(l).forEach((w, k) => (acc[k] += w / N)); }
  console.log(`  S/V ${sv}: expected-evidence weight on world 0 at 25 updates ${expAt(25)[0].toFixed(3)}, at 40 updates ${expAt(40)[0].toFixed(3)}; mean posterior after 40 updates over ${N} unselected world-0 paths ${acc.map(x => x.toFixed(3)).join(', ')}; 7au's node less that on world 0 ${(0.481 - acc[0]).toFixed(3)}`);
}
