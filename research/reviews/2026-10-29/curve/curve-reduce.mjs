/*
 * THE SPENDING CURVE'S READ (EXPLORATORY; research/reviews/2026-10-29/SPENDING-CURVE.md): every arm's units on the same
 * households and paths, reduced to what the brief asks for. Each household counts once; a pooled difference's se is by path
 * (the households' paired variances summed). No figure for an arm until every household has its unit.
 *   node curve-reduce.mjs <unit dir> <household list, comma-separated> > results-spending-curve.txt
 * Per arm: survival; the spending delivered (all retired years, as a share of the plan's own targets); the curve (mean level
 * as a share of target by retired year 0-4, 5-9, 10-19, 20 on, over paths not yet failed); the first retired year's level;
 * retired years a path at the floor and at 110%; the mean year-to-year change in level and the share of years it changes;
 * the share of failures whose year before is a raise; failures before pension access; the estate and the end wealth (mean,
 * median and the unlucky tenth, in years of target); unmet spending.
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';
const [dir, list] = process.argv.slice(2);
const IDS = list.split(','), ARMS = ['APP', 'CAND', 'ZERO', 'FLAT', 'HYB', 'UTIL', 'UTILNM'];
const TYPES = { survived: Uint8Array, delivered: Float32Array, unmet: Float32Array, estate: Float32Array, wealth: Float32Array, failYear: Int16Array, level: Uint8Array };
const dec = (b64, T) => { const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const U = {};
for (const f of readdirSync(dir).filter(x => x.endsWith('.json.gz'))) {
  const u = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString());
  u.m = Object.fromEntries(Object.entries(u.main).map(([k, v]) => [k, dec(v, TYPES[k])]));
  (U[u.id] = U[u.id] || {})[u.arm] = u;
}
const have = ARMS.filter(a => IDS.every(id => U[id] && U[id][a]));
const all = IDS.flatMap(id => Object.values(U[id] || {}));
const L = [];
L.push(`THE SPENDING CURVE (EXPLORATORY): ${IDS.length} households of Phase 4's panel (${IDS.join(', ')}); arms complete: ${have.join(', ') || 'none'}${ARMS.filter(a => !have.includes(a)).length ? `; not complete: ${ARMS.filter(a => !have.includes(a)).join(', ')}` : ''}`);
// the fair test: one code, candidate, seed and path count on every unit; each household's arms on one inputs hash
const one = k => new Set(all.map(u => JSON.stringify(u[k])));
const unfair = ['code', 'candidate', 'seed', 'N'].filter(k => one(k).size > 1);
const inputsOff = IDS.filter(id => U[id] && new Set(Object.values(U[id]).map(u => u.inputs)).size > 1);
L.push(unfair.length || inputsOff.length ? `NOT FAIR: the units differ in ${unfair.join(', ') || '-'}; households whose arms differ in inputs: ${inputsOff.join(', ') || 'none'}`
  : `fair: one code (${all[0].code}), candidate ${all[0].candidate}, seed ${all[0].seed}, ${all[0].N} paths a unit; each household's arms on one inputs hash`);
if (unfair.length || inputsOff.length) { console.log(L.join('\n')); process.exit(1); }
const beside = all.filter(u => u.beside), bOff = beside.reduce((a, u) => a + u.beside.engineOnly + u.beside.policyOnly, 0);
L.push(`runPolicy beside the engine: paths that differ ${bOff} of ${beside.reduce((a, u) => a + u.beside.N, 0)} (${beside.length} solver units)`);

const BUCKETS = [[0, 5], [5, 10], [10, 20], [20, 999]];
function perUnit(u) {
  const { N, Y, retireT, accessT, target } = u, m = u.m, floorLv = Math.round(100 * (u.ran.levels ? Math.min(...u.ran.levels) : 0.8));
  let sv = 0, delivered = 0, unmet = 0, spendYears = 0, atFloor = 0, atRaise = 0, first = 0, firstN = 0, dsum = 0, dn = 0, changes = 0, fails = 0, raiseBefore = 0, bridgeFails = 0, potMiss = 0;
  const bs = BUCKETS.map(() => [0, 0]), est = [], wl = [];
  for (let k = 0; k < N; k++) {
    sv += m.survived[k]; delivered += m.delivered[k]; unmet += m.unmet[k];
    const fy = m.failYear[k], lv = m.level.subarray(k * Y, (k + 1) * Y);
    let prev = -1;
    for (let t = retireT; t < Y; t++) {
      if (lv[t] === 0) continue;
      if (fy >= 0 && t >= fy) break;
      spendYears++;
      const rt = t - retireT, b = BUCKETS.findIndex(([a, z]) => rt >= a && rt < z);
      bs[b][0] += lv[t]; bs[b][1]++;
      if (lv[t] <= floorLv) atFloor++;
      if (lv[t] >= 110) atRaise++;
      if (rt === 0) { first += lv[t]; firstN++; }
      if (prev >= 0) { dsum += Math.abs(lv[t] - prev); dn++; if (lv[t] !== prev) changes++; }
      prev = lv[t];
    }
    // a failure is running out (a year's spending unmet) or, with every year met, ending below the minimum pot
    if (fy >= 0) { if (m.unmet[k] > 1) { fails++; if (fy - 1 >= retireT && lv[fy - 1] >= 110) raiseBefore++; if (fy < accessT) bridgeFails++; } else potMiss++; }
    est.push(m.estate[k] / target); wl.push(m.wealth[k] / target);
  }
  wl.sort((a, b) => a - b);
  // the plan's own lifetime target, the sum of each retired year's target the engine asked for at level 1, is not in the unit;
  // spending delivered is compared across arms in pounds, paired by path (the same target in every arm)
  return { surv: 100 * sv / N, deliveredMean: delivered / N, unmetYears: unmet / N / target, curve: bs.map(([s, c]) => (c ? s / c : NaN)), atFloor: atFloor / N, atRaise: atRaise / N,
    first: firstN ? first / firstN : NaN, meanChange: dn ? dsum / dn : 0, changeShare: dn ? changes / dn : 0, fails, raiseBefore, bridgeFails, potMiss, estate: est.reduce((a, x) => a + x, 0) / N,
    wealthMed: wl[Math.floor(N / 2)], wealthP10: wl[Math.floor(N / 10)], target };
}
const R = {};
for (const a of have) R[a] = IDS.map(id => perUnit(U[id][a]));
const mean = xs => xs.reduce((a, x) => a + x, 0) / xs.length;
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), sg = (x, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
// paired differences, arm less base, pooled over households (each counted once): survival in points, spending delivered in % of base
function paired(a, b) {
  let ds = 0, vs = 0, dd = 0, vd = 0;
  for (const id of IDS) {
    const x = U[id][a].m, y = U[id][b].m, N = x.survived.length;
    let s1 = 0, s2 = 0, q1 = 0, q2 = 0;
    const base = y.delivered.reduce((p, v) => p + v, 0) / N;
    for (let k = 0; k < N; k++) { const d = x.survived[k] - y.survived[k]; s1 += d; s2 += d * d; const e = (x.delivered[k] - y.delivered[k]) / base; q1 += e; q2 += e * e; }
    const md = s1 / N, me = q1 / N;
    ds += 100 * md; vs += 1e4 * (s2 / N - md * md) / N; dd += 100 * me; vd += 1e4 * (q2 / N - me * me) / N;
  }
  const H = IDS.length;
  return { surv: ds / H, survSe: Math.sqrt(vs) / H, spend: dd / H, spendSe: Math.sqrt(vd) / H };
}
L.push('');
L.push('Per arm, the households\' mean (each counted once):');
L.push('  arm     survival  curve 0-4 / 5-9 / 10-19 / 20+   first year  floor yrs  110% yrs  change/yr  years changing  raise before ruin  bridge fails  estate  wealth med / p10  unmet');
for (const a of have) {
  const X = R[a], fails = X.reduce((p, x) => p + x.fails, 0), rb = X.reduce((p, x) => p + x.raiseBefore, 0), bf = X.reduce((p, x) => p + x.bridgeFails, 0), pm = X.reduce((p, x) => p + x.potMiss, 0);
  const cv = [0, 1, 2, 3].map(i => mean(X.map(x => x.curve[i]).filter(Number.isFinite)));
  L.push(`  ${a.padEnd(7)} ${f2(mean(X.map(x => x.surv))).padStart(7)}%  ${cv.map(f1).join(' / ').padEnd(28)} ${f1(mean(X.map(x => x.first))).padStart(9)}   ${f2(mean(X.map(x => x.atFloor))).padStart(8)}  ${f2(mean(X.map(x => x.atRaise))).padStart(8)}  ${f2(mean(X.map(x => x.meanChange))).padStart(8)}  ${(100 * mean(X.map(x => x.changeShare))).toFixed(1).padStart(12)}%  ${(fails ? (100 * rb / fails).toFixed(1) : '-').padStart(14)}% of ${fails} (pot ${pm})  ${String(bf).padStart(10)}  ${f2(mean(X.map(x => x.estate))).padStart(6)}  ${f2(mean(X.map(x => x.wealthMed)))} / ${f2(mean(X.map(x => x.wealthP10)))}  ${f2(mean(X.map(x => x.unmetYears)))}`);
}
L.push('  (curve: the mean spend level, % of target, by retired year over paths not yet failed; first year: the first retired year; floor / 110% yrs: retired years a path at the floor / at 110%; change/yr: the mean absolute change in level, points, between retired years; raise before ruin: of the paths that ran out (a year unmet), those whose year before is at 110%, beside the count, and in brackets the paths that met every year but ended below the minimum pot; bridge fails: ran out before pension access; estate and wealth in years of the household\'s target; unmet: years of target not met)');
L.push('');
for (const b of ['CAND', 'APP']) {
  if (!have.includes(b)) continue;
  L.push(`Against ${b} (paired by path; survival in points, spending delivered in % of ${b}'s; se by path):`);
  for (const a of have) { if (a === b) continue; const p = paired(a, b); L.push(`  ${a.padEnd(7)} survival ${sg(p.surv, 3)} (se ${p.survSe.toFixed(3)})  spending delivered ${sg(p.spend, 3)}% (se ${p.spendSe.toFixed(3)})`); }
}
L.push('');
// the curve by cohort: retired at the start, still working, retiring at 52 (Phase 4's FIRE cohort)
const cohortOf = id => { const u = U[id][have[0]]; return u.retireT === 0 ? 'retired at the start' : id.endsWith('F') ? 'FIRE, retiring at 52' : 'still working'; };
const COH = [...new Set(IDS.map(cohortOf))];
L.push('The curve by cohort (mean level, % of target, by retired year 0-4 / 5-9 / 10-19 / 20 on; the first retired year; years at the floor):');
for (const co of COH) {
  const ix = IDS.map((id, i) => [id, i]).filter(([id]) => cohortOf(id) === co).map(([, i]) => i);
  L.push(`  ${co} (${ix.map(i => IDS[i]).join(', ')}):`);
  for (const a of have) { const X = ix.map(i => R[a][i]); L.push(`    ${a.padEnd(7)} ${[0, 1, 2, 3].map(j => f1(mean(X.map(x => x.curve[j]).filter(Number.isFinite)))).join(' / ')}; first year ${f1(mean(X.map(x => x.first)))}; at the floor ${f2(mean(X.map(x => x.atFloor)))}`); }
}
L.push('');
L.push('Per household: survival % by arm; the first retired year\'s level and the years at the floor:');
for (const [i, id] of IDS.entries()) L.push(`  ${id.padEnd(6)} ${have.map(a => `${a} ${f1(R[a][i].surv)} (${f1(R[a][i].first)}, ${f2(R[a][i].atFloor)})`).join('  ')}`);
console.log(L.join('\n'));
