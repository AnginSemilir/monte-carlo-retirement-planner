/*
 * L4'S READ (the launch plan's step L4; EXPLORATORY, seed 7002): audit-levers.mjs's units, the dial's positions 1, 3, 6 and 10
 * in both variants on the review's eight households, read once by the rules the maintainer fixed before the run (D52):
 *   R1  B3a ships at positions 3, 6 and 10 if, at every one of them, pooled over the eight households and paired by path,
 *       its years 1 to 5 spending is above B3b's (the paired 95% interval above 0) and its survival is not below B3b's by
 *       more than 0.25 points (the interval's lower end above -0.25); otherwise B3b ships at all three.
 *   R2  the direction check, on the variant R1 ships: on each household, survival should not rise and years 1 to 5 spending
 *       should not fall as the position goes up (paired exact tests, one-sided at 5%, Holm across the households and steps,
 *       each measure its own family). Where a step reverses on any household its higher position leaves the dial for the
 *       launch, and the positions that remain are checked again; position 1 always stays.
 * Reported beside them, per arm: survival, the retirees' first year, years 1 to 5, the retired years 1 to 5 at the floor,
 * the equity held at years 1, 5, 10 and 20, and the estate. Years 1 to 5 spending: a path's mean level over its first five
 * retired years before any failure, in % of target. The gate runs first: every unit in, one code, one audit, one seed, one
 * number of paths, each household's arms on the same inputs, and each unit having run its arm (lambda, the variant's age
 * weights, the lock on the base) with the floor's 0.8 on its menu.
 *   node research/solver/reduce-levers.mjs [folder]        (results/levers-7002 unless given)
 *   node research/solver/reduce-levers.mjs --planted       the rules on synthetic units, each outcome shown
 */
import { readdirSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathVals, lin, curveOf, Z } from './reduce-curve.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ARMS = ['CANDD', 'A3', 'A6', 'A10', 'B3', 'B6', 'B10'], POS = [1, 3, 6, 10], SURV_MARGIN = -0.25, ALPHA = 0.05;
export const LAMBDA = 0.0223606797749979, AW = { mode: 90, disp: 9 };
const armAt = (variant, pos) => (pos === 1 ? 'CANDD' : `${variant === 'B3a' ? 'A' : 'B'}${pos}`);
const TYPES = { survived: Uint8Array, delivered: Float32Array, unmet: Float32Array, estate: Float32Array, wealth: Float32Array, failYear: Int16Array, level: Uint8Array };
const decode = u => ({ ...u, main: Object.fromEntries(Object.entries(u.main).map(([k, v]) => { const b = Buffer.from(v, 'base64'); return [k, new TYPES[k](b.buffer, b.byteOffset, b.byteLength / TYPES[k].BYTES_PER_ELEMENT)]; })) });

/* per path, the mean level over the first five retired years before any failure (% of target), NaN where there is none */
export function years15(u) {
  if (u._y15) return u._y15;
  const { N, Y, retireT } = u, m = u.main, out = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const fy = m.failYear[k]; let s = 0, c = 0;
    for (let t = retireT; t < Math.min(Y, retireT + 5); t++) { const v = m.level[k * Y + t]; if (!v) continue; if (fy >= 0 && t >= fy) break; s += v; c++; }
    out[k] = c ? s / c : NaN;
  }
  return (u._y15 = out);
}
/* the share of each path's first five retired years at the floor */
function floor15(u) {
  const { N, Y, retireT } = u, m = u.main, fl = Math.round(100 * Math.min(...u.ran.levels));
  let s = 0, c = 0;
  for (let k = 0; k < N; k++) { const fy = m.failYear[k]; for (let t = retireT; t < Math.min(Y, retireT + 5); t++) { const v = m.level[k * Y + t]; if (!v) continue; if (fy >= 0 && t >= fy) break; c++; if (v <= fl) s++; } }
  return c ? 100 * s / c : NaN;
}
/* exact one-sided binomial tail: P(X >= x) for X ~ Bin(n, 1/2) */
export function tail(x, n) {
  if (n === 0) return 1;
  let lp = -n * Math.LN2, p = 0, lc = 0;
  for (let k = 0; k <= n; k++) { if (k > 0) lc += Math.log(n - k + 1) - Math.log(k); if (k >= x) p += Math.exp(lc + lp); }
  return Math.min(1, p);
}
export const holm = ps => { const o = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]), adj = Array(ps.length); let run = 0; o.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (ps.length - r) * p)); adj[i] = run; }); return adj; };

/* one step's two tests on one household: survival rising (saved > lost), years 1 to 5 falling (more paths below than above) */
export function stepTests(lo, hi) {
  let saved = 0, lost = 0, fall = 0, rise = 0;
  const a = lo.main.survived, b = hi.main.survived, ya = years15(lo), yb = years15(hi);
  for (let k = 0; k < a.length; k++) {
    if (b[k] && !a[k]) saved++; if (a[k] && !b[k]) lost++;
    if (Number.isFinite(ya[k]) && Number.isFinite(yb[k])) { if (yb[k] < ya[k]) fall++; if (yb[k] > ya[k]) rise++; }
  }
  return { saved, lost, pSurv: tail(saved, saved + lost), fall, rise, pSpend: tail(fall, fall + rise) };
}
/* R2 on a variant: the positions kept after each reversal's higher position leaves, with every test made */
export function directionCheck(by, ids, variant) {
  let keep = [...POS];
  const rounds = [];
  for (;;) {
    const steps = keep.slice(1).map((p, i) => [keep[i], p]);
    const tests = steps.flatMap(([lo, hi]) => ids.map(id => ({ id, lo, hi, ...stepTests(by[id][armAt(variant, lo)], by[id][armAt(variant, hi)]) })));
    const aS = holm(tests.map(t => t.pSurv)), aP = holm(tests.map(t => t.pSpend));
    tests.forEach((t, i) => { t.adjSurv = aS[i]; t.adjSpend = aP[i]; t.reversed = aS[i] < ALPHA || aP[i] < ALPHA; });
    rounds.push({ keep: [...keep], tests });
    const bad = steps.find(([lo, hi]) => tests.some(t => t.lo === lo && t.hi === hi && t.reversed));
    if (!bad) return { keep, rounds };
    keep = keep.filter(p => p !== bad[1]);
  }
}
/* R1: at each position, B3a against B3b pooled and paired */
export function variantRule(by, ids) {
  const at = POS.slice(1).map(p => {
    const A = armAt('B3a', p), B = armAt('B3b', p);
    const sp = linOf(by, ids, A, B, years15), sv = lin(by, ids, 'surv', [[A, 1], [B, -1]]);
    return { pos: p, spend: sp, surv: sv, holds: sp.lo > 0 && sv.lo > SURV_MARGIN };
  });
  return { at, ships: at.every(x => x.holds) ? 'B3a' : 'B3b' };
}
/* lin's pooled paired difference for a per-path function */
function linOf(by, ids, a, b, f) {
  let mu = 0, v = 0;
  for (const id of ids) {
    const x = f(by[id][a]), y = f(by[id][b]); let s1 = 0, s2 = 0, n = 0;
    for (let k = 0; k < x.length; k++) { if (!Number.isFinite(x[k]) || !Number.isFinite(y[k])) continue; const d = x[k] - y[k]; s1 += d; s2 += d * d; n++; }
    if (!n) continue; const md = s1 / n; mu += md; v += (s2 / n - md * md) / n;
  }
  const est = mu / ids.length, se = Math.sqrt(v) / ids.length;
  return { est, se, lo: est - Z * se, hi: est + Z * se };
}

/* the gate: the problems that stop the read */
export function gate(units, ids, filesAudit) {
  const P = [], by = {};
  for (const u of units) (by[u.id] ||= {})[u.arm] = u;
  for (const id of ids) for (const arm of ARMS) if (!by[id] || !by[id][arm]) P.push(`${id} ${arm}: missing`);
  if (!units.length) return ['no units'];
  const one = (k, f) => { const s = new Set(units.map(f)); if (s.size !== 1) P.push(`${k}: ${[...s].join(', ')} (one wanted)`); return [...s][0]; };
  one('code', u => u.stamp.code); const audit = one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('paths', u => u.N);
  if (filesAudit !== undefined && audit !== filesAudit) P.push(`the units' audit ${audit} is not the files' ${filesAudit}`);
  for (const id of ids) { const us = ARMS.map(a => by[id] && by[id][a]).filter(Boolean); for (const k of ['inputs', 'target', 'retireT', 'Y']) if (new Set(us.map(u => u[k])).size > 1) P.push(`${id}: its arms differ in ${k}`); }
  for (const u of units) {
    const pos = u.arm === 'CANDD' ? 1 : Number(u.arm.slice(1)), variant = u.arm === 'CANDD' ? null : u.arm[0] === 'A' ? 'B3a' : 'B3b', r = u.ran || {};
    if (Math.abs(r.lambda - LAMBDA * pos) > 1e-15 || r.failDelivered !== true) P.push(`${u.id} ${u.arm}: ran lambda ${r.lambda}, failDelivered ${r.failDelivered}`);
    if (pos > 1 && (!r.lockTiers || r.tsOnce !== false)) P.push(`${u.id} ${u.arm}: not locked to the base`);
    if ((variant === 'B3a') !== (JSON.stringify(r.ageWeight) === JSON.stringify(AW))) P.push(`${u.id} ${u.arm}: ageWeight ${JSON.stringify(r.ageWeight)}`);
    if (!(r.levels || []).some(l => Math.abs(l - 0.8) < 1e-6)) P.push(`${u.id} ${u.arm}: no floor at 0.8 on the menu (${JSON.stringify(r.levels)})`);
  }
  for (const k of ['pts', 'switchCharge', 'raiseWeight', 'failureShortfall', 'bequestWeight']) one(`what the units ran: ${k}`, u => JSON.stringify(u.ran && u.ran[k]));
  return P;
}

const sg = (x, d = 3) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${x.toFixed(d)}` : '-'), f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-');
const iv = (c, d = 3) => `${sg(c.est, d)} (${sg(c.lo, d)} to ${sg(c.hi, d)}, se ${c.se.toFixed(d + 1)})`;
const mean = xs => xs.reduce((a, x) => a + x, 0) / xs.length;

export function report(by, ids) {
  const out = [], retirees = ids.filter(id => by[id].CANDD.retireT === 0);
  out.push(`Per arm (survival; the retirees' first year and years 1-5 (% of target); every household's years 1-5; the retired years 1-5 at the floor; the equity held at years 1, 5, 10, 20, the retirees; the estate, the households' mean):`);
  for (const arm of ARMS) {
    const c = curveOf(by, ids, arm, retirees), surv = mean(ids.map(id => mean(Array.from(pathVals(by[id][arm]).surv))));
    const y15 = mean(ids.map(id => mean(Array.from(years15(by[id][arm])).filter(Number.isFinite)))), fl = mean(ids.map(id => floor15(by[id][arm])));
    const est = mean(ids.map(id => mean(Array.from(by[id][arm].main.estate))));
    out.push(`  ${arm.padEnd(6)} ${surv.toFixed(2)}%; first ${f1(c.first)}, 1-5 ${f1(c.firstFive)}; all 1-5 ${f1(y15)}; at the floor ${f1(fl)}%; equity ${c.equityRetirees.map(f1).join(' / ')}; estate £${Math.round(est).toLocaleString('en-GB')}`);
  }
  const r1 = variantRule(by, ids);
  out.push(`R1, B3a less B3b pooled over ${ids.length} households, paired: ${r1.at.map(x => `position ${x.pos}: years 1-5 ${iv(x.spend, 2)} points of target, survival ${iv(x.surv)} points (${x.holds ? 'holds' : 'does not hold'})`).join('; ')}. R1: ${r1.ships} SHIPS at positions 3, 6 and 10.`);
  for (const v of ['B3a', 'B3b']) {
    const d = directionCheck(by, ids, v), first = d.rounds[0].tests, rev = d.rounds.flatMap(r => r.tests.filter(t => t.reversed));
    out.push(`The direction check on ${v}${v === r1.ships ? ' (R2 applies)' : ' (reported)'}: ${first.length} tests a measure in the first round; ${rev.length ? `reversed: ${rev.map(t => `${t.id} ${t.lo}->${t.hi} (${t.adjSurv < ALPHA ? `survival rises, ${t.saved} saved, ${t.lost} lost, Holm ${t.adjSurv.toExponential(2)}` : `years 1-5 fall on ${t.fall} paths, rise on ${t.rise}, Holm ${t.adjSpend.toExponential(2)}`})`).join('; ')}` : 'no reversal'}; the positions kept: ${d.keep.join(', ')}.`);
    if (v === r1.ships) out.push(`R2: THE DIAL AT LAUNCH: ${r1.ships} at ${d.keep.join(', ')}${d.keep.length < POS.length ? `; left off, to the maintainer as a report: ${POS.filter(p => !d.keep.includes(p)).join(', ')}` : ''}.`);
  }
  return out;
}

/* synthetic units: per household and arm, survival and the five-year level chosen by the rule under test */
function synth({ ids = ['H1', 'H2'], n = 400, surv, y15 }) {
  let x = 12345; const rnd = () => { x = (x + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };   // mulberry32
  const by = {};
  for (const id of ids) {
    by[id] = {};
    const base = Array.from({ length: n }, () => rnd());
    for (const arm of ARMS) {
      const s = surv(id, arm), lv = y15(id, arm), Y = 6, level = new Uint8Array(n * Y), survived = new Uint8Array(n);
      for (let k = 0; k < n; k++) { survived[k] = base[k] < s ? 1 : 0; for (let t = 0; t < Y; t++) level[k * Y + t] = Math.max(80, Math.min(110, Math.round(lv + (base[k] < 0.5 ? 1 : -1)))); }
      by[id][arm] = { id, arm, N: n, Y, retireT: 0, ageSelf0: 65, target: 1, ran: { levels: [0.8, 1, 1.1] }, equity: [], main: { survived, failYear: new Int16Array(n).fill(-1), level, delivered: new Float32Array(n), unmet: new Float32Array(n), estate: new Float32Array(n) } };
    }
  }
  return by;
}
function planted() {
  const P = a => (a === 'CANDD' ? 1 : Number(a.slice(1)));
  const steady = { surv: (id, a) => 0.96 - 0.004 * P(a), y15: (id, a) => 80 + P(a) + (a[0] === 'A' ? 2 : 0) };
  const cases = [
    ['B3a beats B3b on spending at every position, survival within the margin, no reversal', steady, r => r.ships === 'B3a', d => d.keep.join() === '1,3,6,10'],
    ['B3a no better on spending: B3b ships', { ...steady, y15: (id, a) => 80 + P(a) }, r => r.ships === 'B3b', () => true],
    ['B3a\'s survival 1 point below B3b\'s at position 10: B3b ships', { ...steady, surv: (id, a) => 0.96 - 0.004 * P(a) - (a === 'A10' ? 0.01 : 0) }, r => r.ships === 'B3b', () => true],
    ['survival rises from 3 to 6 on H2 under B3a: 6 leaves, 3 to 10 checked again and kept', { ...steady, surv: (id, a) => (id === 'H2' && a === 'A6' ? 0.99 : 0.96 - 0.004 * P(a)) }, r => r.ships === 'B3a', d => d.keep.join() === '1,3,10'],
    ['years 1-5 fall from 6 to 10 on H1 in both variants, B3a still above B3b: B3a ships, 10 leaves', { ...steady, y15: (id, a) => (id === 'H1' && P(a) === 10 ? (a[0] === 'A' ? 72 : 70) : 80 + P(a) + (a[0] === 'A' ? 2 : 0)) }, r => r.ships === 'B3a', d => d.keep.join() === '1,3,6']
  ];
  let bad = 0;
  for (const [name, f, want1, want2] of cases) {
    const by = synth(f), ids = Object.keys(by), r = variantRule(by, ids), d = directionCheck(by, ids, r.ships), good = want1(r) && want2(d);
    if (!good) bad++;
    console.log(`${good ? 'ok  ' : 'FAIL'} ${name}: R1 ${r.ships}, R2 keeps ${d.keep.join(', ')}`);
  }
  console.log(`EDGES: a survival loss exactly at the margin's side (position 10, -1 point), a reversal on one household of two, a reversal at the top step, a re-check after a position leaves`);
  console.log(bad ? `reduce-levers --planted: ${bad} FAILED` : 'reduce-levers --planted: every rule reads as planted');
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) planted();
  const DIR = process.argv[2] || join(HERE, 'results', 'levers-7002');
  // the stamps first (CHECKLIST 3; fair-gate.mjs requireFairLogs): every log stamped, one code and one audit across them,
  // launched through run-from-snapshot.sh as EXPLORATORY (PREDICTION="none:..."); then the reducer's own gate
  const { requireFairLogs } = await import('./fair-gate.mjs');
  requireFairLogs(Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => [f, readFileSync(join(DIR, f), 'utf8')])), 'none', { blob: () => '-' });
  const units = readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => decode(JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())));
  const ids = [...new Set(units.map(u => u.id))].sort(), { stampFilesHash } = await import('./audit-levers.mjs');
  const P = gate(units, ids, stampFilesHash());
  const u0 = units[0] || {};
  console.log(`L4, THE DIAL'S POSITIONS IN BOTH VARIANTS (EXPLORATORY; read by D52's R1 and R2): ${ids.length} households, ${units.length} units; seed ${u0.seed}, ${u0.N} paths, code ${u0.stamp && u0.stamp.code}, audit ${u0.stamp && u0.stamp.audit}`);
  if (P.length) { console.log(`THE GATE REFUSES:\n${P.map(p => `  - ${p}`).join('\n')}`); process.exit(1); }
  const by = {}; for (const u of units) (by[u.id] ||= {})[u.arm] = u;
  console.log('The gate: fair.');
  for (const l of report(by, ids)) console.log(l);
}
