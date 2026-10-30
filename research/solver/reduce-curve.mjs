/*
 * THE SPENDING CURVE'S READ (audit-curve.mjs; STATE.md D43, D44). The measures are the external review's
 * (SPENDING-CURVE.md on review/external-2026-10-21 at 37fdbf7, curve/curve-reduce.mjs), each household counted once and a
 * pooled difference's interval by path (the households' paired variances summed). After the stamps (fair-gate.mjs
 * requireFairLogs) and its own gate (every household in every arm read, one code and one audit stamp across the units and
 * the stamp the files' own, one seed, one path count, a household's arms on one inputs hash, target and retirement year;
 * the registered seed only in the registered read, and no other held-out seed), two reads:
 *   --registered <dir>   registrations/fail-delivered.md, CAND against CANDD on its held-out seed, by its rule:
 *                        P1 the paths whose survival differs (predicted none), P2 the lifetime spending delivered, CANDD
 *                        less CAND in % of CAND's (predicted -0.007%; held within a tenth of a percent either way), P3 the
 *                        raise before ruin, the share of CANDD's paths that run out whose year before is at 110% (predicted
 *                        none), CAND's beside it (the review: 30.2%); HARM where the pooled survival change's interval lies
 *                        wholly below the decided pooled margin, -0.1 points; beside them, not deciding, P1's paths by kind
 *                        (running out, or meeting every year and ending below the minimum pot), a 110% year in any of the
 *                        three years before ruin, and each arm's equity;
 *   --dial <dir>         EXPLORATORY: CANDD, DIAL3 and DIAL10 (the dislike of cuts at one, three and ten times), what the
 *                        maintainer asked for (29 Oct): survival, lifetime spending and spending while alive, the retirees'
 *                        first year and when they are back at target, how often a path's level changes, and the equity
 *                        share the pension and ISA hold.
 *   --pay <dir> [<dir>]  EXPLORATORY (D46): CANDDP, the backward pass kept to paying moves where one pays, and DIAL6, the
 *                        dial at six times, each against CANDD re-run on the same code; the deep review's read of 30 Oct
 *                        (reviews/2026-10-30-deep-fail-delivered.md section 4): the run-out paths with a 110% year in the
 *                        three years before ruin against CANDD's, and where the latest falls; the year before ruin at the
 *                        floor; the paired survival change and its discordant paths; lifetime spending and while alive;
 *                        running out while alive; the failure year's shift; its rule's reading. With a second folder, CANDD's
 *                        units on this code against that folder's (the option unset, the same outcomes byte for byte).
 *   node research/solver/reduce-curve.mjs --registered|--dial|--pay [dir]
 *   node research/solver/reduce-curve.mjs --planted       the gate and both reads on synthetic units with known answers
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REG_SEED = 7019, HELD_OUT = [7003, 7011, 7012, 7013, 7014, 7018], Z = 1.959964, POOLED = 0.1;   // POOLED: the decided margins' pooled floor, in points (STATE.md's decided defaults)
export const READS = { registered: ['CAND', 'CANDD'], dial: ['CANDD', 'DIAL3', 'DIAL10'], pay: ['CANDD', 'CANDDP', 'DIAL6'] };
const TYPES = { survived: Uint8Array, delivered: Float32Array, unmet: Float32Array, estate: Float32Array, wealth: Float32Array, failYear: Int16Array, level: Uint8Array };
const decode = u => ({ ...u, main: Object.fromEntries(Object.entries(u.main).map(([k, v]) => { const b = Buffer.from(v, 'base64'); return [k, new TYPES[k](b.buffer, b.byteOffset, b.byteLength / TYPES[k].BYTES_PER_ELEMENT)]; })) });

/* the gate: the problems that stop the read */
export function gate(units, ids, arms, filesAudit, registered) {
  const P = [], by = {};
  for (const u of units) if (arms.includes(u.arm)) (by[u.id] ||= {})[u.arm] = u;
  const read = units.filter(u => arms.includes(u.arm) && ids.includes(u.id));
  for (const id of ids) for (const arm of arms) if (!by[id] || !by[id][arm]) P.push(`${id} ${arm}: missing`);
  if (!read.length) return P.length ? P : ['no units'];
  const one = (k, f) => { const s = new Set(read.map(f)); if (s.size !== 1) P.push(`${k}: ${[...s].join(', ')} (one wanted)`); return [...s][0]; };
  one('code', u => u.stamp.code); const audit = one('audit', u => u.stamp.audit); const seed = one('seed', u => u.seed); one('paths', u => u.N);
  if (filesAudit !== undefined && audit !== filesAudit) P.push(`the units' audit ${audit} is not the files' ${filesAudit}`);
  if (HELD_OUT.includes(seed)) P.push(`seed ${seed} is held out for another test`);
  if (registered && seed !== REG_SEED) P.push(`the registered read is on seed ${REG_SEED}, not ${seed}`);
  if (!registered && seed === REG_SEED) P.push(`seed ${REG_SEED} is read only by its registration`);
  for (const id of ids) {
    const us = arms.map(a => by[id] && by[id][a]).filter(Boolean);
    for (const k of ['inputs', 'target', 'retireT', 'Y']) if (new Set(us.map(u => u[k])).size > 1) P.push(`${id}: its arms differ in ${k} (${us.map(u => `${u.arm} ${u[k]}`).join(', ')})`);
  }
  // what each unit ran (the design review of 29 Oct, finding 6): the arm's own failDelivered and lambda, and one menu, grid,
  // switch charge, raise weight and failure price across every unit read
  for (const u of read) {
    const want = ranOf(u.arm);
    if (!u.ran || u.ran.failDelivered !== want.failDelivered || Math.abs(u.ran.lambda - want.lambda) > 1e-15 || !!u.ran.payWhereOnePays !== want.payWhereOnePays) P.push(`${u.id} ${u.arm}: ran failDelivered ${u.ran && u.ran.failDelivered}, lambda ${u.ran && u.ran.lambda}, payWhereOnePays ${!!(u.ran && u.ran.payWhereOnePays)} (the arm is ${want.failDelivered}, ${want.lambda}, ${want.payWhereOnePays})`);
  }
  for (const k of ['pts', 'levels', 'switchCharge', 'raiseWeight', 'failureShortfall']) one(`what the units ran: ${k}`, u => JSON.stringify(u.ran && u.ran[k]));
  return P;
}
/* each arm's settings as audit-curve.mjs sets them */
export const LAMBDA = 0.0223606797749979, DIAL = { DIAL3: 3, DIAL10: 10, DIAL6: 6 };
export const ranOf = arm => ({ failDelivered: arm !== 'CAND', lambda: LAMBDA * (DIAL[arm] || 1), payWhereOnePays: arm === 'CANDDP' });

/* per path, one unit's values (the review's pathVals): survival, lifetime spending delivered, spending while alive (each
   retired year's spending weighted by a Gompertz chance of being alive, mode 90 and dispersion 9 from the plan's start age;
   in the years from a failure on, the path's unmet spread evenly over them), the first retired year's level, the retired
   years at the floor and at 110%, the level's changes, the first retired year back at target, and running out while alive */
export function pathVals(u) {
  if (u._pv) return u._pv;
  const { N, Y, retireT } = u, m = u.main, floorLv = Math.round(100 * Math.min(...u.ran.levels));
  const Sx = t => Math.exp(-Math.exp((u.ageSelf0 - 90) / 9) * (Math.exp(t / 9) - 1));
  const V = { surv: new Float64Array(N), deliv: new Float64Array(N), wdeliv: new Float64Array(N), first: new Float64Array(N).fill(NaN), floor: new Float64Array(N), raise: new Float64Array(N),
    changes: new Float64Array(N), steps: new Float64Array(N), stepSum: new Float64Array(N), back: new Float64Array(N).fill(Infinity), outAlive: new Float64Array(N) };
  for (let k = 0; k < N; k++) {
    V.surv[k] = 100 * m.survived[k]; V.deliv[k] = m.delivered[k];
    const fy = m.failYear[k], lv = m.level.subarray(k * Y, (k + 1) * Y);
    let prev = -1;
    for (let t = retireT; t < Y; t++) {
      if (lv[t] === 0) continue;
      if (fy >= 0 && t >= fy) break;
      if (lv[t] <= floorLv) V.floor[k]++;
      if (lv[t] >= 110) V.raise[k]++;
      if (t === retireT) V.first[k] = lv[t];
      if (lv[t] >= 100 && !Number.isFinite(V.back[k])) V.back[k] = t - retireT;
      if (prev >= 0) { V.steps[k]++; V.stepSum[k] += Math.abs(lv[t] - prev); if (lv[t] !== prev) V.changes[k]++; }
      prev = lv[t];
    }
    let w = 0, wr = 0, nr = 0, tot = 0;
    for (let t = 0; t < Y; t++) tot += lv[t] / 100;
    const f = tot > 0 ? (m.delivered[k] + m.unmet[k]) / u.target / tot : 1;
    for (let t = retireT; t < Y; t++) { if (lv[t] === 0) continue; if (fy >= 0 && t >= fy) { wr += Sx(t); nr++; } w += Sx(t) * f * lv[t] / 100; }
    V.wdeliv[k] = w - (nr ? (m.unmet[k] / u.target) * wr / nr : 0);
    if (fy >= 0 && m.unmet[k] > 1) V.outAlive[k] = 100 * Sx(fy);
  }
  return (u._pv = V);
}
/* a linear combination of arms' per-path values, paired by path within each household, averaged over households; with
   normArm, each household's difference in % of that arm's mean of normField */
export function lin(by, ids, field, terms, normArm = null, normField = 'deliv') {
  let mu = 0, v = 0;
  for (const id of ids) {
    const vals = terms.map(([a]) => pathVals(by[id][a])[field]), N = vals[0].length;
    const s = normArm ? 100 / (pathVals(by[id][normArm])[normField].reduce((p, x) => p + x, 0) / N) : 1;
    let s1 = 0, s2 = 0, n = 0;
    for (let k = 0; k < N; k++) {
      let d = 0, ok = true;
      for (let j = 0; j < terms.length; j++) { const x = vals[j][k]; if (!Number.isFinite(x)) { ok = false; break; } d += terms[j][1] * x; }
      if (!ok) continue;
      d *= s; s1 += d; s2 += d * d; n++;
    }
    if (!n) continue;
    const md = s1 / n; mu += md; v += (s2 / n - md * md) / n;
  }
  const est = mu / ids.length, se = Math.sqrt(v) / ids.length;
  return { est, se, lo: est - Z * se, hi: est + Z * se };
}
/* the raise before ruin: of the paths that run out (a year unmet), those whose year before is at 110%; Wilson's interval */
export function raiseBefore(by, ids, arm) {
  let x = 0, n = 0;
  for (const id of ids) {
    const u = by[id][arm], { N, Y, retireT } = u, m = u.main;
    for (let k = 0; k < N; k++) { const fy = m.failYear[k]; if (fy >= 0 && m.unmet[k] > 1) { n++; if (fy - 1 >= retireT && m.level[k * Y + fy - 1] >= 110) x++; } }
  }
  if (!n) return { x, n, est: NaN, lo: NaN, hi: NaN };
  const p = x / n, d = 1 + Z * Z / n, c = (p + Z * Z / (2 * n)) / d, h = Z * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n)) / d;
  return { x, n, est: 100 * p, lo: 100 * Math.max(0, c - h), hi: 100 * Math.min(1, c + h) };
}
/* of the paths that run out, those with a 110% year in any of the `w` years before (the design review's finding 3) */
export function raiseWithin(by, ids, arm, w = 3) {
  let x = 0, n = 0;
  for (const id of ids) {
    const u = by[id][arm], { N, Y, retireT } = u, m = u.main;
    for (let k = 0; k < N; k++) { const fy = m.failYear[k]; if (fy >= 0 && m.unmet[k] > 1) { n++; for (let t = Math.max(retireT, fy - w); t < fy; t++) if (m.level[k * Y + t] >= 110) { x++; break; } } }
  }
  return { x, n };
}
/* the paths whose survival differs between two arms, saved and lost, over the households; each lost or saved path's kind:
   it ran out (a year unmet) or met every year and ended below the minimum pot */
export function discordant(by, ids, a, b) {
  let saved = 0, lost = 0, n = 0;
  const kind = { lostOut: 0, lostPot: 0, savedOut: 0, savedPot: 0 };
  for (const id of ids) {
    const x = by[id][a].main, y = by[id][b].main; n += x.survived.length;
    for (let k = 0; k < x.survived.length; k++) {
      if (x.survived[k] && !y.survived[k]) { saved++; kind[y.unmet[k] > 1 ? 'savedOut' : 'savedPot']++; }
      if (!x.survived[k] && y.survived[k]) { lost++; kind[x.unmet[k] > 1 ? 'lostOut' : 'lostPot']++; }
    }
  }
  return { saved, lost, n, ...kind };
}
/* the curve's facts per arm: the mean level by retired year over the paths not yet failed (the households' mean), the
   retirees' first year and years 1 to 5, the year their average is back at target, the median path's return, the share
   of years a path's level changes, and the equity the pension and ISA hold */
export function curveOf(by, ids, arm, retirees) {
  const mean = xs => xs.reduce((a, x) => a + x, 0) / xs.length, YMAX = 40;
  const byYear = id => { const u = by[id][arm], { N, Y, retireT } = u, m = u.main, s = new Float64Array(YMAX), c = new Float64Array(YMAX);
    for (let k = 0; k < N; k++) { const fy = m.failYear[k]; for (let t = retireT; t < Y && t - retireT < YMAX; t++) { const v = m.level[k * Y + t]; if (!v) continue; if (fy >= 0 && t >= fy) break; s[t - retireT] += v; c[t - retireT]++; } }
    return Array.from(s, (x, i) => (c[i] ? x / c[i] : NaN)); };
  const avg = hs => Array.from({ length: YMAX }, (_, t) => { const v = hs.map(byYear).map(r => r[t]).filter(Number.isFinite); return v.length ? mean(v) : NaN; });
  const R = avg(retirees), A = avg(ids), backAvg = R.findIndex(x => x >= 100 - 1e-9);
  const pool = (hs, f) => mean(hs.map(id => { const v = Array.from(pathVals(by[id][arm])[f]).filter(Number.isFinite); return v.length ? mean(v) : NaN; }).filter(Number.isFinite));
  const medBack = hs => { const v = hs.flatMap(id => Array.from(pathVals(by[id][arm]).back)).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : NaN; };
  const eqAt = (hs, t) => { const v = hs.map(id => by[id][arm].equity && by[id][arm].equity[t]).filter(x => x !== null && x !== undefined); return v.length ? 100 * mean(v) : NaN; };
  const steps = hs => hs.reduce((a, id) => a + pathVals(by[id][arm]).steps.reduce((p, x) => p + x, 0), 0);
  const changes = hs => hs.reduce((a, id) => a + pathVals(by[id][arm]).changes.reduce((p, x) => p + x, 0), 0);
  const stepSum = hs => hs.reduce((a, id) => a + pathVals(by[id][arm]).stepSum.reduce((p, x) => p + x, 0), 0);
  return { first: mean(retirees.map(id => pool([id], 'first'))), firstFive: mean(R.slice(0, 5)), backAvg: backAvg < 0 ? Infinity : backAvg + 1, medBack: medBack(retirees) + 1,
    from21: mean(A.slice(20).filter(Number.isFinite)), floor: pool(ids, 'floor'), raise: pool(ids, 'raise'), changeShare: 100 * changes(ids) / steps(ids), meanStep: stepSum(ids) / steps(ids),
    equityRetirees: [0, 4, 9, 19].map(t => eqAt(retirees, t)), equityAll: [0, 4, 9, 19].map(t => eqAt(ids, t)), byYearRetirees: R };
}
const sg = (x, d = 3) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${x.toFixed(d)}` : '-'), f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-');
const iv = (c, d = 3, unit = '') => `${sg(c.est, d)}${unit} (${sg(c.lo, d)} to ${sg(c.hi, d)}${unit}, se ${c.se.toFixed(d + 1)})`;
const survMean = (by, ids, a) => ids.reduce((p, id) => p + pathVals(by[id][a]).surv.reduce((q, x) => q + x, 0) / by[id][a].N, 0) / ids.length;

/* the registered read (registrations/fail-delivered.md) */
export function readRegistered(by, ids) {
  const L = [], d = discordant(by, ids, 'CANDD', 'CAND'), sp = lin(by, ids, 'deliv', [['CANDD', 1], ['CAND', -1]], 'CAND');
  const sw = lin(by, ids, 'wdeliv', [['CANDD', 1], ['CAND', -1]], 'CAND', 'wdeliv'), sv = lin(by, ids, 'surv', [['CANDD', 1], ['CAND', -1]]);
  const rD = raiseBefore(by, ids, 'CANDD'), rC = raiseBefore(by, ids, 'CAND');
  const p1 = d.saved + d.lost === 0, p2 = sp.est >= -0.1 && sp.est <= 0.1, p3 = rD.n > 0 ? rD.x === 0 : true;
  L.push(`survival: CAND ${survMean(by, ids, 'CAND').toFixed(3)}%, CANDD ${survMean(by, ids, 'CANDD').toFixed(3)}%; CANDD less CAND ${iv(sv)} points`);
  L.push(`P1 the paths whose survival differs: ${d.saved + d.lost} of ${d.n} (${d.saved} saved, ${d.lost} lost): ${p1 ? 'HELD' : 'MISSED'} (predicted none); by kind, lost ${d.lostOut} running out and ${d.lostPot} below the minimum pot, saved ${d.savedOut} and ${d.savedPot}`);
  L.push(`P2 the lifetime spending delivered, CANDD less CAND: ${iv(sp, 4, '%')} of CAND's: ${p2 ? 'HELD' : 'MISSED'} (predicted -0.007%; held within 0.1% either way); while alive ${iv(sw, 4, '%')}`);
  L.push(`P3 the raise before ruin, of the paths that run out: CANDD ${rD.x} of ${rD.n}${rD.n ? ` (${rD.est.toFixed(1)}%, 95% ${rD.lo.toFixed(1)} to ${rD.hi.toFixed(1)})` : ''}: ${p3 ? 'HELD' : 'MISSED'} (predicted none); CAND ${rC.x} of ${rC.n}${rC.n ? ` (${rC.est.toFixed(1)}%, 95% ${rC.lo.toFixed(1)} to ${rC.hi.toFixed(1)})` : ''} (the review: 30.2%)`);
  const harm = sv.hi < -POOLED;
  const outcome = p1 && p2 && p3 ? 'HELD: the review\'s finding stands on a held-out seed; the default (D43) stands'
    : harm ? `HARM: survival lower under CANDD beyond the pooled margin (-${POOLED} points); to the maintainer before Part C takes the default`
    : 'MISSED: to the maintainer, with the figures above; the default (D43) stands unless the maintainer reverses it';
  const w3 = a => { const r = raiseWithin(by, ids, a); return `${r.x} of ${r.n}`; };
  L.push(`beside (not deciding): a 110% year in any of the three years before ruin, CANDD ${w3('CANDD')}, CAND ${w3('CAND')}; the pension and ISA's equity share at years 1, 5, 10, 20, the retirees and all: ${['CAND', 'CANDD'].map(a => { const c = curveOf(by, ids, a, ids.filter(id => by[id][a].retireT === 0)); return `${a} ${c.equityRetirees.map(f1).join(' / ')}; ${c.equityAll.map(f1).join(' / ')}`; }).join(' | ')}`);
  // per household (the re-review of 29 Oct, finding 1): survival under each arm, the paths saved and lost by kind, and a flag,
  // not deciding, where the household's loss passes D34's threshold for a harm flag, 0.25 + 1.645 x its se by path
  L.push('per household (beside, not deciding): survival CAND / CANDD, the paths saved and lost by kind; FLAG where the loss passes D34\'s 0.25 + 1.645 se:');
  for (const id of ids) {
    const h = discordant(by, [id], 'CANDD', 'CAND'), c = lin(by, [id], 'surv', [['CANDD', 1], ['CAND', -1]]), thr = 0.25 + 1.645 * c.se;
    L.push(`  ${id.padEnd(6)} ${survMean(by, [id], 'CAND').toFixed(3)}% / ${survMean(by, [id], 'CANDD').toFixed(3)}%; change ${iv(c)}; saved ${h.saved} (${h.savedOut} out, ${h.savedPot} pot), lost ${h.lost} (${h.lostOut} out, ${h.lostPot} pot)${-c.est > thr ? `; FLAG: a loss of ${(-c.est).toFixed(3)} past ${thr.toFixed(3)}` : ''}`);
  }
  L.push(`OUTCOME: ${outcome}`);
  return { L, p1, p2, p3, harm, outcome };
}
/* the dial's read (EXPLORATORY) */
export function readDial(by, ids, retirees, arms = READS.dial) {
  const L = [];
  L.push(`retired at the start: ${retirees.join(', ')}; years counted from 1, the first retired year`);
  L.push('per arm: survival; the retirees\' first year and years 1-5 (% of target); their average back at target (year), the median path back (year); from the 21st year (all); retired years at the floor / at 110%; the share of years a path\'s level changes, and the mean step (points); the pension and ISA\'s equity share at years 1, 5, 10, 20 (retirees; all)');
  for (const a of arms) {
    const c = curveOf(by, ids, a, retirees);
    L.push(`  ${a.padEnd(6)} ${survMean(by, ids, a).toFixed(2)}%; first ${f1(c.first)}, 1-5 ${f1(c.firstFive)}; back at target ${Number.isFinite(c.backAvg) ? `year ${c.backAvg}` : 'never'}, median path ${Number.isFinite(c.medBack) ? `year ${c.medBack}` : 'never'}; from the 21st ${f1(c.from21)}; floor ${c.floor.toFixed(2)} / 110% ${c.raise.toFixed(2)}; changes ${c.changeShare.toFixed(1)}% of years, step ${c.meanStep.toFixed(2)}; equity ${c.equityRetirees.map(f1).join(' / ')}; ${c.equityAll.map(f1).join(' / ')}`);
  }
  L.push('against CANDD (paired by path; survival in points, spending in % of CANDD\'s, running out while alive in points):');
  for (const a of arms.slice(1)) {
    const sv = lin(by, ids, 'surv', [[a, 1], ['CANDD', -1]]), sp = lin(by, ids, 'deliv', [[a, 1], ['CANDD', -1]], 'CANDD'), sw = lin(by, ids, 'wdeliv', [[a, 1], ['CANDD', -1]], 'CANDD', 'wdeliv');
    const oa = lin(by, ids, 'outAlive', [[a, 1], ['CANDD', -1]]), r = raiseBefore(by, ids, a);
    const r3 = raiseWithin(by, ids, a);
    L.push(`  ${a.padEnd(6)} survival ${iv(sv)}; lifetime spending ${iv(sp, 3, '%')}; while alive ${iv(sw, 3, '%')}; running out while alive ${iv(oa)}; the raise before ruin ${r.x} of ${r.n} (a 110% year in the three before, ${r3.x})`);
  }
  L.push('per household: survival, the first retired year\'s level and the equity held in year 1, by arm:');
  for (const id of ids) L.push(`  ${id.padEnd(6)} ${arms.map(a => { const v = pathVals(by[id][a]), first = Array.from(v.first).filter(Number.isFinite); const e = by[id][a].equity && by[id][a].equity[0]; return `${a} ${(v.surv.reduce((p, x) => p + x, 0) / by[id][a].N).toFixed(2)}% (${first.length ? f1(first.reduce((p, x) => p + x, 0) / first.length) : '-'}, ${e === null || e === undefined ? '-' : `${Math.round(100 * e)}%`})`; }).join('  ')}`);
  return { L };
}

/* the year before ruin and the three before it, over the paths that run out: the latest 110% year's distance from ruin
   (1, 2 or 3 years before) and the year before at the floor */
export function beforeRuin(by, ids, arm) {
  const at = [0, 0, 0, 0]; let n = 0, floor = 0;
  for (const id of ids) {
    const u = by[id][arm], { N, Y, retireT } = u, m = u.main, fl = Math.round(100 * Math.min(...u.ran.levels));
    for (let k = 0; k < N; k++) {
      const fy = m.failYear[k]; if (!(fy >= 0 && m.unmet[k] > 1)) continue;
      n++;
      if (fy - 1 >= retireT && m.level[k * Y + fy - 1] > 0 && m.level[k * Y + fy - 1] <= fl) floor++;
      for (let d = 1; d <= 3; d++) { const t = fy - d; if (t >= retireT && m.level[k * Y + t] >= 110) { at[d]++; break; } }
    }
  }
  return { n, floor, at, within: at[1] + at[2] + at[3] };
}
/* the failure year's shift between two arms, over the paths that run out in both: earlier, the same year, later */
export function failShift(by, ids, a, b) {
  let earlier = 0, same = 0, later = 0, sum = 0;
  for (const id of ids) {
    const x = by[id][a].main, y = by[id][b].main;
    for (let k = 0; k < x.failYear.length; k++) {
      if (!(x.failYear[k] >= 0 && x.unmet[k] > 1 && y.failYear[k] >= 0 && y.unmet[k] > 1)) continue;
      const d = x.failYear[k] - y.failYear[k]; sum += d;
      if (d < 0) earlier++; else if (d > 0) later++; else same++;
    }
  }
  const n = earlier + same + later;
  return { earlier, same, later, n, mean: n ? sum / n : NaN };
}
/* CANDDP's and DIAL6's read (EXPLORATORY, D46), against CANDD on the same code, by the deep review's rule for CANDDP */
export function readPay(by, ids, retirees) {
  const L = [...readDial(by, ids, retirees, READS.pay).L];
  const c = beforeRuin(by, ids, 'CANDD'), p = beforeRuin(by, ids, 'CANDDP');
  const pct = (x, n) => (n ? `${(100 * x / n).toFixed(1)}%` : '-');
  L.push('CANDDP against CANDD, the deep review\'s read (reviews/2026-10-30-deep-fail-delivered.md section 4):');
  for (const [a, r] of [['CANDD', c], ['CANDDP', p]]) L.push(`  ${a.padEnd(6)} of ${r.n} paths that run out: a 110% year in the three years before ruin ${r.within} (${pct(r.within, r.n)}), the latest 1 / 2 / 3 years before ${r.at[1]} / ${r.at[2]} / ${r.at[3]}; the year before ruin at the floor ${r.floor} (${pct(r.floor, r.n)})`);
  const sv = lin(by, ids, 'surv', [['CANDDP', 1], ['CANDD', -1]]), sp = lin(by, ids, 'deliv', [['CANDDP', 1], ['CANDD', -1]], 'CANDD');
  const d = discordant(by, ids, 'CANDDP', 'CANDD'), sh = failShift(by, ids, 'CANDDP', 'CANDD');
  L.push(`  survival ${iv(sv)} points; ${d.saved + d.lost} of ${d.n} paths differ (${d.saved} saved: ${d.savedOut} out, ${d.savedPot} pot; ${d.lost} lost: ${d.lostOut} out, ${d.lostPot} pot); lifetime spending ${iv(sp, 4, '%')}`);
  L.push(`  the failure year, of ${sh.n} paths that run out under both: earlier ${sh.earlier}, the same ${sh.same}, later ${sh.later} (mean ${sg(sh.mean, 2)} years)`);
  // the review's rule: near none (under 2% of run-out paths) with survival not below -0.1 pooled and spending within 0.1%: the
  // failing cells are the cause; three-quarters of CANDD's count or more: they are not; between: both
  const near = p.n > 0 && p.within / p.n < 0.02, kept = p.within >= 0.75 * c.within, price = sv.est < -POOLED || Math.abs(sp.est) > 0.1;
  const verdict = near && !price ? 'the count falls to near none, survival and spending within their margins: THE FAILING CELLS ARE THE CAUSE (to the maintainer as D43\'s completion; joins the candidate only by a ruling naming this run or a registered held-out read)'
    : near ? 'the count falls to near none, but survival or spending moves past its margin: the cause, at the price above (to the maintainer)'
    : kept ? 'the count stays at three-quarters of CANDD\'s or more: THE FAILING CELLS ARE NOT THE CAUSE (Part C keeps the presentation rule)'
    : 'the count falls, but not to near none: BOTH (to the maintainer)';
  L.push(`  by the review's rule: ${verdict}`);
  return { L, near, kept, price, verdict, c, p };
}
/* CANDD's outcomes on this code against another folder's CANDD units (the option unset: the same, byte for byte) */
export function sameAs(units, old, ids) {
  const key = u => JSON.stringify({ main: Object.fromEntries(Object.entries(u.main).map(([k, v]) => [k, Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('base64')])), beside: u.beside, equity: u.equity });
  const pick = (us, id) => us.find(u => u.id === id && u.arm === 'CANDD');
  const same = ids.filter(id => pick(units, id) && pick(old, id) && key(pick(units, id)) === key(pick(old, id)));
  return { same: same.length, of: ids.length, differ: ids.filter(id => !same.includes(id)) };
}

/* synthetic units with known answers */
function synth({ arms, ids = ['A', 'B'], n = 200, seed = 7002, Y = 4, change = {}, drop = null, inputsOf = () => 'x', ranAs = {} }) {
  const units = [];
  for (const id of ids) for (const arm of arms) {
    if (drop && drop[0] === id && drop[1] === arm) continue;
    const ch = change[arm] || {}, survived = new Uint8Array(n).fill(1), delivered = new Float32Array(n).fill(400), unmet = new Float32Array(n), failYear = new Int16Array(n).fill(-1);
    const level = new Uint8Array(n * Y);
    for (let k = 0; k < n; k++) for (let t = 0; t < Y; t++) level[k * Y + t] = t === 0 ? 80 : 100;
    for (let k = 0; k < (ch.fail || 0); k++) { survived[k] = 0; failYear[k] = Y - 1; unmet[k] = 50; delivered[k] = 350; if (ch.raise) level[k * Y + Y - 2] = 110; }
    for (let k = n - (ch.potMiss || 0); k < n; k++) { survived[k] = 0; failYear[k] = Y - 1; }   // every year met, the end below the minimum pot
    if (ch.spend) for (let k = 0; k < n; k++) delivered[k] *= 1 + ch.spend;
    units.push({ id, arm, cohort: 'lib', target: 100, inputs: inputsOf(id, arm), retireT: 0, accessT: 0, ageSelf0: 65, Y, seed, N: n, stamp: { code: 'c', audit: 'a' }, ran: { levels: [0.8, 0.9, 1, 1.1], pts: 4, switchCharge: 0.001, raiseWeight: 0.003, failureShortfall: 'floor', ...ranOf(arm), ...(ranAs[`${id} ${arm}`] || {}) },
      equity: [0.25, 0.25, 0.25, 0.25], beside: null, main: { survived, delivered, unmet, estate: new Float32Array(n), wealth: new Float32Array(n), failYear, level } });
  }
  return units;
}
const byOf = units => { const by = {}; for (const u of units) (by[u.id] ||= {})[u.arm] = u; return by; };
function planted() {
  const res = [], ok = (c, m) => res.push([c, m]), R = READS.registered, ids = ['A', 'B'];
  { const U = synth({ arms: R, seed: REG_SEED, change: { CAND: { fail: 10, raise: true }, CANDD: { fail: 10 } } });
    ok(gate(U, ids, R, 'a', true).length === 0, 'a complete registered set passes the gate');
    const o = readRegistered(byOf(U), ids); ok(o.p1 && o.p2 && o.p3 && /^HELD/.test(o.outcome), `the same survival, the same spending, no raise before ruin under CANDD (CAND's 20 of 20): HELD (${o.outcome.slice(0, 4)})`); }
  { const o = readRegistered(byOf(synth({ arms: R, seed: REG_SEED, change: { CAND: { fail: 10 }, CANDD: { fail: 11 } } })), ids); ok(!o.p1 && /lost/.test(o.L[1]), 'one path lost on each household: P1 MISSED (EDGE: a single discordant path)'); }
  { const o = readRegistered(byOf(synth({ arms: R, seed: REG_SEED, change: { CANDD: { spend: -0.0011 } } })), ids); ok(!o.p2, `spending 0.11% lower: P2 MISSED (EDGE: just past the tenth of a percent)`); }
  { const o = readRegistered(byOf(synth({ arms: R, seed: REG_SEED, change: { CANDD: { spend: -0.0009 } } })), ids); ok(o.p2, 'spending 0.09% lower: P2 HELD (EDGE: just inside the tenth of a percent)'); }
  { const o = readRegistered(byOf(synth({ arms: R, seed: REG_SEED, change: { CAND: { fail: 10 }, CANDD: { fail: 10, raise: true } } })), ids); ok(!o.p3, 'a raise before ruin under CANDD: P3 MISSED'); }
  { const o = readRegistered(byOf(synth({ arms: R, seed: REG_SEED, change: { CANDD: { fail: 60 } } })), ids); ok(/^HARM/.test(o.outcome), `survival 30 points lower under CANDD: ${o.outcome.slice(0, 4)}`); }
  { const o = readRegistered(byOf(synth({ arms: R, seed: REG_SEED, n: 4000, change: { CANDD: { potMiss: 2 } } })), ids); ok(!o.p1 && !o.harm && /lost 0 running out and 4 below the minimum pot/.test(o.L[1]), `two paths a household lost below the minimum pot: P1 MISSED, not HARM (EDGE: the pooled margin, -0.05 points; ${o.outcome.slice(0, 6)})`); }
  { const o = readRegistered(byOf(synth({ arms: R, seed: REG_SEED, n: 1000, change: { CANDD: { potMiss: 8 } } })), ids); ok(o.harm, `eight paths a household lost of 1,000: HARM (-0.8 points, past the margin)`); }
  { const H8 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], U = synth({ arms: R, ids: H8, seed: REG_SEED, n: 4000 }), d = U.find(u => u.id === 'A' && u.arm === 'CANDD').main;
    for (let k = 0; k < 40; k++) { d.survived[k] = 0; d.failYear[k] = 3; }
    const o = readRegistered(byOf(U), H8), a = o.L.find(l => /^ {2}A /.test(l)), b = o.L.find(l => /^ {2}B /.test(l));
    ok(!o.harm && /FLAG: a loss of 1\.000/.test(a) && !/FLAG/.test(b), `one of eight households losing 40 of 4,000 paths (a point): MISSED pooled (-0.125), its line FLAGGED, the others' not (EDGE: a loss on one household; the re-review's finding 1)`); }
  ok(gate(synth({ arms: R, seed: REG_SEED, ranAs: { 'A CANDD': { failDelivered: false } } }), ids, R, 'a', true).some(p => /A CANDD: ran failDelivered false/.test(p)), 'a unit that ran without the option it names is refused');
  ok(gate(synth({ arms: READS.dial, ranAs: { 'B DIAL10': { lambda: LAMBDA * 3 } } }), ids, READS.dial, 'a', false).some(p => /B DIAL10: ran .*lambda/.test(p)), 'a dial unit at the wrong lambda is refused');
  ok(gate(synth({ arms: R, seed: REG_SEED, ranAs: { 'B CAND': { pts: 30 } } }), ids, R, 'a', true).some(p => /what the units ran: pts/.test(p)), 'units at different grids are refused');
  { const o = readRegistered(byOf(synth({ arms: R, seed: REG_SEED })), ids); ok(o.p3 && /0 of 0/.test(o.L[3]), 'no path runs out in either arm: P3 has nothing to miss (EDGE: an empty class)'); }
  ok(gate(synth({ arms: R, seed: REG_SEED, drop: ['B', 'CANDD'] }), ids, R, 'a', true).some(p => /B CANDD: missing/.test(p)), 'a missing unit is refused');
  ok(gate(synth({ arms: R, seed: 7002 }), ids, R, 'a', true).some(p => /registered read is on seed/.test(p)), 'the registered read on another seed is refused');
  ok(gate(synth({ arms: READS.dial, seed: REG_SEED }), ids, READS.dial, 'a', false).some(p => /read only by its registration/.test(p)), 'the registered seed in the dial\'s read is refused');
  ok(gate(synth({ arms: READS.dial, seed: 7014 }), ids, READS.dial, 'a', false).some(p => /held out/.test(p)), 'another test\'s held-out seed is refused');
  ok(gate(synth({ arms: R, seed: REG_SEED, inputsOf: (id, arm) => (id === 'A' && arm === 'CANDD' ? 'y' : 'x') }), ids, R, 'a', true).some(p => /A: its arms differ in inputs/.test(p)), 'a household whose arms ran on other inputs is refused');
  ok(gate(synth({ arms: R, seed: REG_SEED }), ids, R, 'b', true).some(p => /not the files'/.test(p)), 'units stamped on other files are refused');
  { const P8 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const o = readPay(byOf(synth({ arms: READS.pay, ids: P8, change: { CANDD: { fail: 20, raise: true }, CANDDP: { fail: 20 }, DIAL6: { fail: 20 } } })), P8, P8);
    ok(o.near && !o.price && /THE FAILING CELLS ARE THE CAUSE/.test(o.verdict), `CANDDP with no raise before ruin where CANDD has it on every run-out path: the cause (${o.p.within} of ${o.p.n} against ${o.c.within})`);
    const o2 = readPay(byOf(synth({ arms: READS.pay, ids: P8, change: { CANDD: { fail: 20, raise: true }, CANDDP: { fail: 20, raise: true }, DIAL6: { fail: 20 } } })), P8, P8);
    ok(o2.kept && /ARE NOT THE CAUSE/.test(o2.verdict), 'CANDDP raising as often as CANDD: not the cause');
    const o3 = readPay(byOf(synth({ arms: READS.pay, ids: P8 })), P8, P8);
    ok(!o3.near && o3.kept && o3.p.n === 0, 'no path runs out under either: nothing falls, so not near none (EDGE: an empty class)');
    ok(gate(synth({ arms: READS.pay, ranAs: { 'A CANDDP': { payWhereOnePays: false } } }), ids, READS.pay, 'a', false).some(p => /A CANDDP: ran .*payWhereOnePays false/.test(p)), 'a CANDDP unit that ran without the option is refused');
    const U = synth({ arms: READS.pay }), V = synth({ arms: READS.pay }); V.find(u => u.id === 'B' && u.arm === 'CANDD').main.level[5] = 90;
    const s1 = sameAs(U, synth({ arms: READS.pay }), ids), s2 = sameAs(U, V, ids);
    ok(s1.same === 2 && s2.same === 1 && s2.differ[0] === 'B', 'CANDD against another folder: the same where every value is, not where one level differs'); }
  { const by = byOf(synth({ arms: READS.dial })), c = curveOf(by, ids, 'DIAL3', ids); ok(c.first === 80 && c.backAvg === 2 && c.medBack === 2 && Math.abs(c.changeShare - 100 / 3) < 1e-9, `the curve's facts: first year 80, back at target in year 2 (average and median path), a third of the steps change (${f1(c.first)}, ${c.backAvg}, ${c.medBack}, ${c.changeShare.toFixed(2)}%)`); }
  for (const [c, m] of res) console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`);
  const bad = res.filter(([c]) => !c).length;
  console.log('EDGES: a single discordant path, just past the tenth of a percent, just inside it, an empty class of paths that run out, a loss inside the pooled margin, a loss on one household');
  console.log(bad ? `planted (${res.length}): ${bad} misread` : `planted (${res.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const bad = planted();
  if (bad) process.exit(1);
  if (process.argv[2] === '--planted') process.exit(0);
  const mode = { '--registered': 'registered', '--dial': 'dial', '--pay': 'pay' }[process.argv[2]] || null;
  if (!mode) { console.error('usage: reduce-curve.mjs --registered|--dial|--pay [dir] [old dir] | --planted'); process.exit(2); }
  const dir = process.argv[3] || join(HERE, 'results', mode === 'pay' ? 'curve-pay-7002' : `curve-${mode === 'registered' ? REG_SEED : 7002}`);
  const { requireFairLogs } = await import('./fair-gate.mjs');
  const logs = Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => [f, readFileSync(join(dir, f), 'utf8')]));
  requireFairLogs(logs, mode === 'registered' ? 'research/solver/registrations/fail-delivered.md' : 'none', mode === 'registered' ? {} : { blob: () => '-' });
  const units = readdirSync(dir).filter(f => f.endsWith('.json.gz')).map(f => decode(JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString())));
  const { HOUSEHOLDS: ALL, stampFilesHash } = await import('./audit-curve.mjs');
  // CURVE_ONLY (a smoke read of the harness only): fewer households; never the registered read
  if (process.env.CURVE_ONLY && mode === 'registered') { console.error('reduce-curve: the registered read takes every household'); process.exit(2); }
  const HOUSEHOLDS = process.env.CURVE_ONLY ? ALL.filter(id => process.env.CURVE_ONLY.split(',').includes(id)) : ALL;
  const arms = READS[mode], P = gate(units, HOUSEHOLDS, arms, stampFilesHash(), mode === 'registered');
  if (P.length) { console.log(`THE GATE: NOT FAIR\n${P.map(p => `  - ${p}`).join('\n')}`); process.exit(2); }
  const read = units.filter(u => arms.includes(u.arm)), by = byOf(read), u0 = read[0];
  console.log(`THE GATE: fair - ${HOUSEHOLDS.length} households in ${arms.join(', ')}, seed ${u0.seed}, ${u0.N} paths, one stamp (code ${u0.stamp.code}, audit ${u0.stamp.audit}), candidate ${u0.stamp.candidate}`);
  const beside = read.reduce((a, u) => a + u.beside.engineOnly + u.beside.policyOnly, 0);
  console.log(`runPolicy beside the engine: paths that differ ${beside} of ${read.reduce((a, u) => a + u.beside.N, 0)}`);
  if (mode === 'registered') console.log(`THE FAILURE YEAR AT WHAT IT CAN PAY (registrations/fail-delivered.md, read once):\n${readRegistered(by, HOUSEHOLDS).L.join('\n')}`);
  else if (mode === 'dial') console.log(`THE DISLIKE OF CUTS ON THE CANDIDATE (EXPLORATORY, seed ${u0.seed}):\n${readDial(by, HOUSEHOLDS, HOUSEHOLDS.filter(id => by[id].CANDD.retireT === 0)).L.join('\n')}`);
  else {
    console.log(`PAYING WHERE ONE PAYS, AND THE DIAL AT SIX TIMES (EXPLORATORY, D46, seed ${u0.seed}):\n${readPay(by, HOUSEHOLDS, HOUSEHOLDS.filter(id => by[id].CANDD.retireT === 0)).L.join('\n')}`);
    if (process.argv[4]) {
      const old = readdirSync(process.argv[4]).filter(f => f.endsWith('.json.gz')).map(f => decode(JSON.parse(gunzipSync(readFileSync(join(process.argv[4], f))).toString())));
      const s = sameAs(read, old, HOUSEHOLDS);
      console.log(`CANDD on this code (the option unset) against ${process.argv[4].replace(/.*research\/solver\//, '')}: the same outcomes byte for byte on ${s.same} of ${s.of} households${s.differ.length ? `; DIFFER: ${s.differ.join(', ')}` : ''}`);
    }
  }
}
