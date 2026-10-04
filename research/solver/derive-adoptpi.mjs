// ADOPT-PI's power and point predictions, from DPC's records (results/diagdpc dp lines, seed 7002: the same households,
// settings and arms at another seed; DPC printed survivors per arm, not per path, so the lost-and-saved split is not on disk).
// Per household the net change PCLSI less SNAP (c - b) is DPC's; the discordant count is that net plus k lost-and-saved pairs
// on each side (b = k + max(0, -net), c = k + max(0, net)), read for k = 0, 5, 15 and 40 through reduce-adoptpi.mjs's own
// items() (stats.mjs outcome() at the household's margin, Holm over 25; the floor over the 23 outside the gain pair by
// stats.mjs pooledSummed against 0.1 points; the gain's exact one-sided p, Holm over 2), at
// DPC's figures as if seed 7005 repeated them; and at 2, 3 and 4 times the paths (4,000, 6,000 and 8,000), every count scaled with
// the paths (the net and the pairs alike: a share of the paths, not a count, is what the seed repeats). Also the hold's incidence per unit (the Mechanism's derive): DPC's pausing
// paths and plateau paths per arm (results-dpc.txt TOTALS), and the run's cost (results-derive-dpc-traces.txt).
//   node research/solver/derive-adoptpi.mjs > research/solver/results-derive-adoptpi.txt
import { readFileSync, readdirSync } from 'node:fs';
import { items, PANEL } from './reduce-adoptpi.mjs';
const D = new URL('./results/diagdpc/', import.meta.url);
const sv = {};
for (const f of readdirSync(D).filter(f => /^case\d+\.txt$/.test(f))) {
  const t = readFileSync(new URL(f, D), 'utf8'), id = t.split('\n')[2]?.slice(0, 16).trim();
  for (const m of t.matchAll(/^\s+dp OFF\/PRODUCT\/W0\.02(\/PCLSI|\/SHIFT)?: paths (\d+) survived (\d+)/gm)) {
    const arm = m[1] ? m[1].slice(1) : 'SNAP'; (sv[id] ||= {})[arm] = { N: +m[2], s: +m[3] };
  }
}
if (PANEL.some(id => !sv[id] || !sv[id].SNAP || !sv[id].PCLSI)) { console.error('derive-adoptpi: a household without both arms in results/diagdpc'); process.exit(1); }
console.log('DPC (seed 7002), survivors of 2000:  household        SNAP   PCLSI  net');
for (const id of PANEL) console.log(`  ${id.padEnd(16)} ${String(sv[id].SNAP.s).padStart(5)}  ${String(sv[id].PCLSI.s).padStart(5)}  ${String(sv[id].PCLSI.s - sv[id].SNAP.s).padStart(4)}`);
// a household as items() reads it, its paths built to DPC's survivors and the k pairs
const pairsAt = (k, x = 1) => Object.fromEntries(PANEL.map(id => {
  const N = x * sv[id].SNAP.N, S = x * sv[id].SNAP.s, net = x * (sv[id].PCLSI.s - sv[id].SNAP.s), b = x * k + Math.max(0, -net), c = x * k + Math.max(0, net), a = S - b;
  return [id, { a, b, c, d: N - a - b - c, N, snap: S / N }];
}));
console.log('\nthe items read at DPC\'s net changes with k lost-and-saved pairs a 2,000 paths on each side:');
for (const x of [1, 2, 3, 4]) for (const k of [0, 5, 15, 40]) {
  const r = items(pairsAt(k, x)), n = o => r.one.filter(x => x.outcome === o).length;
  console.log(`  paths ${2000 * x} k ${String(k).padStart(2)} a 2,000: item 1 ${r.v1} (no material harm ${n('no material harm')}, inconclusive ${n('inconclusive')} [${r.one.filter(x => x.outcome === 'inconclusive').map(x => x.id).join(', ')}], harm ${n('harm')}; the floor's lower end ${r.pool.lo.toFixed(3)}); item 2 ${r.v2} (${r.two.map(x => `${x.id} change ${x.d.toFixed(3)} p Holm ${x.pHolm.toExponential(2)} ${x.gain ? 'GAIN' : 'not shown'}`).join('; ')})`);
}
// the hold's incidence per unit (DPC's TOTALS) and the cost
const tot = readFileSync(new URL('./results-dpc.txt', import.meta.url), 'utf8').match(/^TOTALS (SNAP|PCLSI): .*$/gm);
console.log(`\nthe hold's incidence (results-dpc.txt): ${tot.join(' | ')}`);
const cost = readFileSync(new URL('./results-derive-dpc-traces.txt', import.meta.url), 'utf8').match(/^ADOPT-PI .*$/m)[0];
console.log(`the cost (results-derive-dpc-traces.txt): ${cost}`);
// the cost at more paths: DPC's mean solve and forward seconds a unit (its solve and dp lines, SNAP and PCLSI), the forward
// part scaling with the paths; 25 households x 2 arms and the death-tax arm's 3 x 2
let ss = 0, fs = 0, n = 0;
for (const f of readdirSync(D).filter(f => /^case\d+\.txt$/.test(f))) { const t = readFileSync(new URL(f, D), 'utf8'); for (const m of t.matchAll(/^\s+solve OFF\/PRODUCT\/W0\.02(?:\/PCLSI)?: secs (\d+)/gm)) ss += +m[1]; for (const m of t.matchAll(/^\s+dp OFF\/PRODUCT\/W0\.02(?:\/PCLSI)?: .* secs (\d+)/gm)) { fs += +m[1]; n++; } }
const sm = ss / n, fm = fs / n;
console.log(`DPC's mean unit (SNAP and PCLSI, ${n} units): solve ${sm.toFixed(0)} s, forward ${fm.toFixed(0)} s at 2,000 paths`);
for (const x of [1, 2, 3, 4]) console.log(`  at ${2000 * x} paths: ${((sm + x * fm) * 56 / 3600).toFixed(1)} core-hours for the 56 units, about ${((sm + x * fm) * 56 / 3600 / 4).toFixed(1)} hours on four cores`);
