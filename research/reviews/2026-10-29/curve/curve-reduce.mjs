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
const IDS = list.split(','), ARMS = ['APP', 'CAND', 'ZERO', 'FLAT', 'HYB', 'UTIL', 'UTILNM', 'CANDD', 'HYBD', 'HYB10D'];
// codes declared one (CURVE_EQUIV="a=b", with its evidence named in CURVE_EQUIV_WHY): the amendment's code is the registered
// code with an option added that, unset, leaves every table bit for bit as before
const EQ = Object.fromEntries((process.env.CURVE_EQUIV || '').split(',').filter(Boolean).map(x => x.split('=').reverse()));
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
const one = k => new Set(all.map(u => JSON.stringify(k === 'code' && EQ[u[k]] ? EQ[u[k]] : u[k])));
const unfair = ['code', 'candidate', 'seed', 'N'].filter(k => one(k).size > 1);
const inputsOff = IDS.filter(id => U[id] && new Set(Object.values(U[id]).map(u => u.inputs)).size > 1);
L.push(unfair.length || inputsOff.length ? `NOT FAIR: the units differ in ${unfair.join(', ') || '-'}; households whose arms differ in inputs: ${inputsOff.join(', ') || 'none'}`
  : `fair: one code (${[...new Set(all.map(u => u.code))].join(' and ')}${Object.keys(EQ).length ? `, declared one: ${process.env.CURVE_EQUIV_WHY || 'no evidence named'}` : ''}), candidate ${all[0].candidate}, seed ${all[0].seed}, ${all[0].N} paths a unit; each household's arms on one inputs hash`);
if (unfair.length || inputsOff.length) { console.log(L.join('\n')); process.exit(1); }
const beside = all.filter(u => u.beside), bOff = beside.reduce((a, u) => a + u.beside.engineOnly + u.beside.policyOnly, 0);
L.push(`runPolicy beside the engine: paths that differ ${bOff} of ${beside.reduce((a, u) => a + u.beside.N, 0)} (${beside.length} solver units)`);
// what each arm ran, from its units' records (every household's the same but the estate weight, which scales with the
// household under the spending utility)
L.push('What each arm ran (from the units; a year at the floor priced at the first year, and the same on every household unless said):');
for (const a of ARMS.filter(x => IDS.some(id => U[id] && U[id][x]))) {
  const us = IDS.map(id => U[id] && U[id][a]).filter(Boolean), r0 = us[0].ran;
  if (a === 'APP') { L.push(`  APP     the app's rules, guardrails ${r0.guardrails ? 'on' : 'off'}`); continue; }
  const strip = r => JSON.stringify({ ...r, bequestWeight: r.spendUtility ? 0 : r.bequestWeight, minPot: 0, pts: 0, actions: 0, tierState: 0 });
  const same = us.every(u => strip(u.ran) === strip(r0));
  const su = r0.spendUtility, fl = Math.min(...r0.levels);
  const uOf = l => (Math.abs(su ? su.gamma - 1 : 1) < 1e-12 ? Math.log(l) : (Math.pow(l, 1 - (su ? su.gamma : 2)) - 1) / (1 - (su ? su.gamma : 2)));
  const floorCost = su ? su.kappa * (uOf(1) - uOf(fl)) : r0.lambda * (1 - fl) ** 2;
  L.push(`  ${a.padEnd(7)} menu ${r0.levels.join(', ')}; ${su ? `spending utility gamma ${su.gamma}, kappa ${+su.kappa.toPrecision(6)}, mortality ${su.mortality ? `${su.mortality.mode}/${su.mortality.disp}` : 'none'}` : `lambda ${+r0.lambda.toPrecision(6)}, raise weight ${r0.raiseWeight}${r0.raiseSurvival ? ' (times survival)' : ''}`}; ${su ? `a year of ruin lived on the guaranteed income (at least ${su.ruinMin} of target)` : `a year of ruin priced as ${r0.failureShortfall === 'zero' ? 'a cut to nothing' : 'a year at the floor'}`}${r0.failDelivered ? ', the failure year at what it can pay' : ''}; switch charge ${+r0.switchCharge.toPrecision(6)}; a year at the floor ${su && su.kappa === 1 ? `${floorCost.toFixed(4)} in its own units (spending the currency)` : `${(100 * floorCost).toFixed(3)} points of survival`}; estate weight ${su ? 'by household' : r0.bequestWeight}${same ? '' : '; NOT THE SAME ON EVERY HOUSEHOLD'}`);
}

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

// THE RULES AND THE PREDICTIONS, READ (SPENDING-CURVE.md sections 4 and 7). Each criterion: its estimate (each household
// counted once), its 95% interval by path (the households' variances summed; a share of failures, Wilson's on the pooled
// count), the verdict on the estimate as registered, and whether the paths settle it: met (the interval clears the margin),
// not met (the interval is past it), unsettled (the margin is inside the interval).
const Z = 1.96;
const PV = {};
function pathVals(id, a) {
  const key = `${id} ${a}`;
  if (PV[key]) return PV[key];
  const u = U[id][a], { N, Y, retireT } = u, m = u.m, floorLv = Math.round(100 * (u.ran.levels ? Math.min(...u.ran.levels) : 0.8));
  const surv = new Float64Array(N), deliv = new Float64Array(N), first = new Float64Array(N).fill(NaN), floor = new Float64Array(N), raise = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    surv[k] = 100 * m.survived[k]; deliv[k] = m.delivered[k];
    const fy = m.failYear[k], lv = m.level.subarray(k * Y, (k + 1) * Y);
    for (let t = retireT; t < Y; t++) {
      if (lv[t] === 0) continue;
      if (fy >= 0 && t >= fy) break;
      if (lv[t] <= floorLv) floor[k]++;
      if (lv[t] >= 110) raise[k]++;
      if (t === retireT) first[k] = lv[t];
    }
  }
  return (PV[key] = { surv, deliv, first, floor, raise });
}
// a linear combination of arms' per-path values, paired by path within each household, averaged over households
function lin(field, terms, ids = IDS, normArm = null) {
  let mu = 0, v = 0;
  for (const id of ids) {
    const vals = terms.map(([a]) => pathVals(id, a)[field]), N = vals[0].length;
    const s = normArm ? 100 / (pathVals(id, normArm).deliv.reduce((p, x) => p + x, 0) / N) : 1;
    let s1 = 0, s2 = 0, n = 0;
    for (let k = 0; k < N; k++) {
      let d = 0, okk = true;
      for (let j = 0; j < terms.length; j++) { const x = vals[j][k]; if (!Number.isFinite(x)) { okk = false; break; } d += terms[j][1] * x; }
      if (!okk) continue;
      d *= s; s1 += d; s2 += d * d; n++;
    }
    const md = s1 / n; mu += md; v += (s2 / n - md * md) / n;
  }
  return { est: mu / ids.length, se: Math.sqrt(v) / ids.length };
}
const shareRaise = (a, ids = IDS) => { let x = 0, n = 0; for (const id of ids) { const r = R[a][IDS.indexOf(id)]; x += r.raiseBefore; n += r.fails; } if (!n) return { est: NaN, lo: NaN, hi: NaN, n }; const p = x / n, d = 1 + Z * Z / n, c = (p + Z * Z / (2 * n)) / d, h = Z * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n)) / d; return { est: 100 * p, lo: 100 * (c - h), hi: 100 * (c + h), n, x }; };
const iv = ({ est, se }) => ({ est, lo: est - Z * se, hi: est + Z * se });
// op: '>=' or '<=' a margin, 'within' x of zero, 'in' [a, b]
function judge(c, op, m) {
  const { est, lo, hi } = c;
  if (!Number.isFinite(est)) return { pass: false, settled: 'no data' };
  if (op === '>=') return { pass: est >= m, settled: lo >= m ? 'met' : hi < m ? 'not met' : 'unsettled' };
  if (op === '<=') return { pass: est <= m, settled: hi <= m ? 'met' : lo > m ? 'not met' : 'unsettled' };
  const [a, b] = op === 'within' ? [-m, m] : m;
  return { pass: est >= a && est <= b, settled: lo >= a && hi <= b ? 'met' : hi < a || lo > b ? 'not met' : 'unsettled' };
}
const crit = (label, c, op, m, unit = '') => { const j = judge(c, op, m), q = c.abs ? f2 : sg; L.push(`    ${j.pass ? 'yes' : 'NO '}  ${label}: ${q(c.est)}${unit} (95% ${q(c.lo)} to ${q(c.hi)}${unit}${c.n !== undefined ? `; ${c.x} of ${c.n} failures` : ''}); ${j.settled}`); return j.pass; };
const RETIRED = IDS.filter(id => U[id][have[0]].retireT === 0);
const H = a => have.includes(a);
L.push('');
L.push('THE RULES, READ (yes / NO on the estimate, as registered; then whether the 95% interval settles it):');
if (H('APP') && H('CAND')) for (const a of ['UTIL', 'UTILNM'].filter(H)) {
  L.push(`  ${a}, the section 4 rule for a utility arm:`);
  const q = [
    crit(`keeps at least half of CAND's survival gain over APP (${a} - APP/2 - CAND/2, points)`, iv(lin('surv', [[a, 1], ['APP', -0.5], ['CAND', -0.5]])), '>=', 0),
    crit(`delivers at least CAND's lifetime spending less 1% (% of CAND's)`, iv(lin('deliv', [[a, 1], ['CAND', -1]], IDS, 'CAND')), '>=', -1, '%'),
    crit('starts retirement at 95% of target or more (the first retired year, %)', { ...iv(lin('first', [[a, 1]])), abs: true }, '>=', 95),
    crit('spends fewer years at the floor than CAND (years a path)', iv(lin('floor', [[a, 1], ['CAND', -1]])), '<=', 0)];
  L.push(`    => ${a} ${q.every(Boolean) ? 'QUALIFIES' : 'does not qualify'}`);
}
const twoTests = (a, base, label) => {
  L.push(`  ${a} against ${base}, ${label}:`);
  const q = [crit(`survival within 0.25 of ${base}'s (points)`, iv(lin('surv', [[a, 1], [base, -1]])), '>=', -0.25),
    crit('a raise before ruin under 5% of the paths that run out (%)', shareRaise(a), '<=', 5, '%')];
  L.push(`    => ${q.every(Boolean) ? 'passes both' : 'fails'}`);
};
if (H('CAND')) for (const a of ['HYB', 'ZERO', 'FLAT'].filter(H)) twoTests(a, 'CAND', a === 'HYB' ? 'the section 4 rule for HYB' : 'the same two measures (section 4: the best of ZERO and FLAT)');
for (const [a, b] of [['CANDD', 'CAND'], ['HYBD', 'HYB']]) if (H(a) && H(b)) twoTests(a, b, 'the section 7 rule for failDelivered');
L.push('');
L.push('THE PREDICTIONS, READ (held / FAILED on the estimate; the interval as above):');
const pred = (arm, items) => {
  if (!H(arm)) return;
  L.push(`  ${arm}:`);
  for (const [label, c, op, m, need, unit] of items) {
    if (need && !need.every(H)) { L.push(`    (not yet)  ${label}: needs ${need.filter(x => !H(x)).join(', ')}`); continue; }
    const v = c(), j = judge(v, op, m), q = v.abs ? f2 : sg;
    L.push(`    ${j.pass ? 'held  ' : 'FAILED'}  ${label}: ${q(v.est)}${unit || ''} (95% ${q(v.lo)} to ${q(v.hi)}${unit || ''}${v.n !== undefined ? `; ${v.x} of ${v.n} failures` : ''}); ${j.settled}`);
  }
};
const dS = (a, b, ids) => () => iv(lin('surv', [[a, 1], [b, -1]], ids)), dP = (a, b) => () => iv(lin('deliv', [[a, 1], [b, -1]], IDS, b));
const fY = (a, ids) => () => ({ ...iv(lin('first', [[a, 1]], ids)), abs: true }), dF = (a, b, ids) => () => iv(lin('first', [[a, 1], [b, -1]], ids));
const flR = (a, b, r, ids) => () => iv(lin('floor', [[a, 1], [b, -r]], ids)), rs = (a, ids) => () => shareRaise(a, ids);
const rz = (a, b, r) => () => iv(lin('raise', [[a, 1], [b, -r]]));
pred('UTIL', [
  ['the first retired year at 95% or more (%)', fY('UTIL'), '>=', 95],
  ['at most half CAND\'s years at the floor (UTIL - CAND/2, years)', flR('UTIL', 'CAND', 0.5), '<=', 0, ['CAND']],
  ['a raise before under 5% of failures', rs('UTIL'), '<=', 5, null, '%'],
  ['survival 1 to 4 points below CAND\'s (points)', dS('UTIL', 'CAND'), 'in', [-4, -1], ['CAND']],
  ['lifetime spending within 2% of CAND\'s (%)', dP('UTIL', 'CAND'), 'within', 2, ['CAND'], '%']]);
pred('UTILNM', [
  ['survival within a point of CAND\'s (points)', dS('UTILNM', 'CAND'), 'within', 1, ['CAND']],
  ['fewer years at the floor than CAND (years)', flR('UTILNM', 'CAND', 1), '<=', 0, ['CAND']]]);
pred('HYB', [
  ['survival within 0.5 of CAND\'s (points)', dS('HYB', 'CAND'), 'within', 0.5, ['CAND']],
  ['a raise before under 5% of failures', rs('HYB'), '<=', 5, null, '%'],
  ['fewer years at 110% than CAND (years)', rz('HYB', 'CAND', 1), '<=', 0, ['CAND']],
  ['the first retired year within 5 points of CAND\'s (points)', dF('HYB', 'CAND'), 'within', 5, ['CAND']],
  ['years at the floor within a fifth of CAND\'s (HYB - 1.2 CAND, years: at most 0)', flR('HYB', 'CAND', 1.2), '<=', 0, ['CAND']],
  ['  and (HYB - 0.8 CAND, years: at least 0)', flR('HYB', 'CAND', 0.8), '>=', 0, ['CAND']]]);
pred('ZERO', [
  ['a raise before under 10% of failures', rs('ZERO'), '<=', 10, null, '%'],
  ['survival +0.1 to +0.5 against CAND (points)', dS('ZERO', 'CAND'), 'in', [0.1, 0.5], ['CAND']],
  ['spending 0.5 to 1.5% lower (%)', dP('ZERO', 'CAND'), 'in', [-1.5, -0.5], ['CAND'], '%'],
  ['the early cut stays: the first retired year within 5 points of CAND\'s (points)', dF('ZERO', 'CAND'), 'within', 5, ['CAND']]]);
pred('FLAT', [
  ['the early cut stays: the first retired year within 5 points of CAND\'s (points)', dF('FLAT', 'CAND'), 'within', 5, ['CAND']],
  ['no year at 110% (years a path)', () => ({ ...iv(lin('raise', [['FLAT', 1]])), abs: true }), 'within', 0],
  ['spending 2 to 4% lower (%)', dP('FLAT', 'CAND'), 'in', [-4, -2], ['CAND'], '%'],
  ['survival within 0.3 of CAND\'s (points)', dS('FLAT', 'CAND'), 'within', 0.3, ['CAND']]]);
for (const [a, b] of [['CANDD', 'CAND'], ['HYBD', 'HYB']]) pred(a, [
  ['a raise before under 5% of the paths that run out', rs(a), '<=', 5, null, '%'],
  [`survival within 0.3 of ${b}'s (points)`, dS(a, b), 'within', 0.3, [b]],
  [`spending within 1% of ${b}'s (%)`, dP(a, b), 'within', 1, [b], '%']]);
pred('HYB10D', [
  [`retired at the start (${RETIRED.join(', ')}): the first retired year at 90% or more (%)`, fY('HYB10D', RETIRED), '>=', 90],
  ['  a third fewer years at the floor than HYB (HYB10D - 2/3 HYB, years)', flR('HYB10D', 'HYB', 2 / 3, RETIRED), '<=', 0, ['HYB']],
  ['  survival 0.5 to 2 points below HYB\'s (points)', dS('HYB10D', 'HYB', RETIRED), 'in', [-2, -0.5], ['HYB']]]);
console.log(L.join('\n'));
