/*
 * THE LEAD TEST'S READ (HOUSEHOLD.md section 5 as amended for step 4, D118; PRESCRIPTIVE-PLAN.md step 4; EXPLORATORY): the
 * household's move from the single solver's own chooser at the best of five splits (HS5) against the couples' default (K2)
 * on audit-household.mjs's 28 units, by the rule committed before any unit ran. The gate first (fair-gate.mjs on the units'
 * logs; one code, audit, seed, size and candidate; each unit's four arms whole, in their order, timed and recorded), then
 * THE IDENTITY (each unit's K2 arrays JOINT-WIDE's K2 arrays byte for byte, or STOP), then the rule, HS5 less K2, paired by
 * path on stats.mjs survivalChange (the exact paired interval):
 *   1. pooled survival over the 28 units: holds when the interval's lower end is above 0;
 *   2. survival by unit: holds when no unit's interval lies wholly below -0.3 points;
 *   3. pooled spending delivered on the paths both arms keep, as a percentage of K2's: holds when not lower by more than
 *      0.05% (the pooled figure, as JOINT-WIDE's part 3 reads it);
 *   4. the pot counted up to the cap, pooled and by unit, as a percentage and in pounds a path, beside spending in pounds a
 *      path: recorded, not a bar (D116);
 *   5. pooled lifetime tax, HS5 against HOUSE: holds when HS5's is lower;
 *   6. by unit, the household table's opening forecast less HS5's survival: within 2 points, a unit outside named, the
 *      outcome unchanged.
 * Outcomes: STOP (K2 differs from JOINT-WIDE's on any path, or part 5 fails; nothing else is read); A LEAD (parts 1, 2 and
 * 3 hold); A LEAD, WITH A UNIT TO PLACE (parts 1 and 3 hold, part 2 failing only on units whose biases are not nil, each
 * printed with its biases and its failing years); NO LEAD (part 1 or part 3 fails, or part 2 fails on a unit whose biases
 * are nil). Then the split's search, HS1 less HS5: THE SEARCH GOES when pooled survival's interval reaches 0 or above, no
 * unit's interval lies wholly below -0.3, pooled spending on the paths both keep is not lower by more than 0.05% and pooled
 * lifetime tax is not higher by more than 1%; otherwise THE SEARCH STAYS. Beside, deciding nothing: spending over every
 * path; each pooled figure without its largest unit; lifetime tax and the pot above and below the cap; step 1's counts; the
 * spending level and the risk held, K2 beside HS5, by third; HOUSE less K2 on parts 1 to 4; the solve and CPU a path.
 *   node research/solver/reduce-household.mjs [--smoke] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));

export const RULE = { unit: -0.3, spend: -0.05, forecast: 2, searchTax: 1 }, CANDIDATE = 'af001697ce1b';
export const JOINT = { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2 };
export const ARMS = ['K2', 'HOUSE', 'HS5', 'HS1'];
const SPLIT_OF = { HS5: 'best5', HS1: 'even' };
export const wantOptions = arm => (arm === 'HOUSE' ? { household: 'A', topK: 3, tieJoint: 1e-4, holdPast: 2 }
  : SPLIT_OF[arm] ? { household: 'A', move: 'single', split: SPLIT_OF[arm], tieAboveCap: 1e-4 }
    : { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2, topK: 2 });
export const orderOf = k => [...ARMS.slice(k % ARMS.length), ...ARMS.slice(0, k % ARMS.length)];
/* a unit's biases are nil (PRESCRIPTIVE-PLAN.md step 3): no locked year, the first person's share of the pensions from 0.25
   to 0.75, under £100 a year of income tax left out, no one-off deposit owned by one person, the band two people's */
export const biasesNil = b => b.lockedYears === 0 && b.penShareSelf >= 0.25 && b.penShareSelf <= 0.75 && b.incomeTaxLeftOut.aYear < 100 && b.oneOffOwned.length === 0 && b.cgtBand.household === b.cgtBand.twoPeople;
const Z = 1.959963984540054;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
export const armOf = x => ({ ...x, raw: x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const mean = a => { let s = 0, n = 0; for (const x of a) { s += x; n++; } return n ? s / n : NaN; };
const median = a => { const s = [...a].sort((p, q) => p - q), k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; };
const js = x => JSON.stringify(x);
const isCount = c => !!c && ['decisions', 'far', 'down'].every(k => Number.isInteger(c[k]) && c[k] >= 0);
const isWhy = w => !!w && Array.isArray(w.years) && ['K2', 'HS5'].every(a => w[a] && ['all', 'first', 'middle', 'last'].every(p => w[a][p] && Number.isFinite(w[a][p].n)));
const isBias = b => !!b && Number.isInteger(b.lockedYears) && Array.isArray(b.lockedAt) && b.penShareSelf >= 0 && b.penShareSelf <= 1 && b.incomeTaxLeftOut && Number.isFinite(b.incomeTaxLeftOut.aYear)
  && Number.isFinite(b.incomeTaxLeftOut.overPlan) && Array.isArray(b.oneOffOwned) && b.cgtBand && Number.isFinite(b.cgtBand.household) && Number.isFinite(b.cgtBand.twoPeople);

/* the gate over the units (each with its arms decoded), against the design's units: every problem */
export function gate(units, ids, audit, size = { N: 4000, seed: 7002, pts: 45 }, partial = false) {
  const P = [], missing = partial ? [] : ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate (${CANDIDATE})`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const k = ids.indexOf(U.id);
    if (k < 0) { P.push(`${U.id}: not in the design`); continue; }
    if (U.k !== k || js(U.order) !== js(orderOf(k))) P.push(`${U.id}: unit ${U.k} with the arms in the order ${js(U.order)}, not unit ${k}'s ${js(orderOf(k))}`);
    const d = U.digests || {};
    if (!d.before || ['self', 'part', 'household'].some(w => !d.before[w] || d.before[w] !== d.after[w])) P.push(`${U.id}: a table changed between the first arm and the last`);
    if (!(U.cap > 0) || !(U.houseCap > 0)) P.push(`${U.id}: no cap recorded`);
    if (U.shareRule !== 'pots' || js(U.joint) !== js(JOINT) || U.topK !== 3) P.push(`${U.id}: the joint move ${js(U.joint)} on ${U.shareRule}, the household's top ${U.topK}`);
    if (!isBias(U.bias)) P.push(`${U.id}: its biases not recorded in full`);
    if (!isWhy(U.why)) P.push(`${U.id}: no record of the level and the risk`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const key of Object.keys(KEYS)) if (!x[key] || x[key].length !== U.N) P.push(`${U.id} ${a}: ${key} not one a path`);
      if (js(x.options) !== js(wantOptions(a))) P.push(`${U.id} ${a}: the options read back ${js(x.options)}, not ${js(wantOptions(a))}`);
      if (!(x.cpuUs > 0) || x.place !== U.order.indexOf(a) || !(x.solveSecs > 0) || !(x.forecast >= 0 && x.forecast <= 1)) P.push(`${U.id} ${a}: no time, no solve time or no forecast, or not timed in its place`);
      if (SPLIT_OF[a] && !isCount(x.counts)) P.push(`${U.id} ${a}: step 1's counts not recorded`);
      const ch = x.chunks || [];
      if (!ch.length || ch[0].from !== 0 || ch[ch.length - 1].to !== U.N || ch.some((c, i) => i > 0 && c.from !== ch[i - 1].to) || ch.some(c => !c.proc || !c.cpu)) P.push(`${U.id} ${a}: its chunks do not cover its paths in order, each with its process and CPU`);
      else if (Math.abs(ch.reduce((t, c) => t + c.cpuUs, 0) - x.cpuUs) > 0.5) P.push(`${U.id} ${a}: its time is not its chunks' sum`);
    }
    if (U.arms.HOUSE && U.arms.HS5 && U.arms.HS1 && !(U.arms.HOUSE.forecast === U.arms.HS5.forecast && U.arms.HS5.forecast === U.arms.HS1.forecast)) P.push(`${U.id}: the household arms do not read one table's forecast`);
    if (!U.along || !(U.along.decisions > 0)) P.push(`${U.id}: no replay`);
  }
  return P;
}
/* THE IDENTITY: each unit's K2 against JOINT-WIDE's K2 (its unit file's arms.K2), every array byte for byte */
export function identity(units, jwOf) {
  const P = [];
  for (const U of units) {
    const J = jwOf(U.id);
    if (!J) { P.push(`${U.id}: no JOINT-WIDE unit to hold K2 to`); continue; }
    if (J.seed !== U.seed || J.N !== U.N || J.pts !== U.pts) { P.push(`${U.id}: JOINT-WIDE's unit is another size`); continue; }
    const differ = Object.keys(KEYS).filter(k => J.arms.K2[k] !== U.arms.K2.raw[k]);
    if (differ.length) P.push(`${U.id}: K2's ${differ.join(', ')} differ from JOINT-WIDE's`);
  }
  return P;
}
export function cells(A, B) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = 0; i < A.survived.length; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; }
  return { a, lost, saved, d, N: A.survived.length };
}
const pooledCells = cs => survivalChange(sum(cs.map(c => c.lost)), sum(cs.map(c => c.saved)), sum(cs.map(c => c.N)));
/* spending delivered, the arm's against the base's, as a percentage of the base's, over the paths keep(i) picks, with its
   paired standard error by path, pooled over the pairs and by pair */
export function spendOn(pairs, kept) {
  let D = 0, B = 0, V = 0;
  const by = pairs.map(([b, x]) => {
    const I = []; for (let i = 0; i < b.delivered.length; i++) if (!kept || (b.survived[i] && x.survived[i])) I.push(i);
    const d = I.map(i => x.delivered[i] - b.delivered[i]), dm = mean(d), s = d.length > 1 ? Math.sqrt(sum(d.map(v => (v - dm) ** 2)) / (d.length - 1)) : 0, Bu = sum(I.map(i => b.delivered[i]));
    const Du = dm * I.length, Vu = I.length * s * s; D += Du; B += Bu; V += Vu;
    const p = Bu > 0 ? 100 * Du / Bu : 0, se = Bu > 0 ? 100 * Math.sqrt(Vu) / Bu : 0;
    return { d: p, se, lo: p - Z * se, hi: p + Z * se, D: Du, B: Bu, V: Vu, n: I.length };
  });
  const p = B > 0 ? 100 * D / B : 0, se = B > 0 ? 100 * Math.sqrt(V) / B : 0;
  return { pooled: { d: p, se, lo: p - Z * se, hi: p + Z * se }, by };
}
const spendWithout = (sp, skip) => { let D = 0, B = 0, V = 0; sp.by.forEach((h, i) => { if (i !== skip) { D += h.D; B += h.B; V += h.V; } }); const p = 100 * D / B, se = 100 * Math.sqrt(V) / B; return { d: p, se, lo: p - Z * se, hi: p + Z * se }; };
/* the pot counted up to a unit's cap: the arm's mean against the base's, in percent and in pounds a path */
function cappedOf(U, b, x) {
  let sb = 0, sx = 0; const n = b.pot.length;
  for (let i = 0; i < n; i++) { sb += Math.min(b.pot[i], U.cap); sx += Math.min(x.pot[i], U.cap); }
  return { pct: sb > 0 ? 100 * (sx / sb - 1) : 0, gbp: (sx - sb) / n, sb, sx, n };
}
/* lifetime tax and the pot left above the cap (both arms ending above it) and below it (both at or below it, both kept) */
function aboveCap(U, b, x) {
  const hi = [], lo = [];
  for (let i = 0; i < b.pot.length; i++) {
    if (b.pot[i] > U.cap && x.pot[i] > U.cap) hi.push(i);
    else if (b.pot[i] <= U.cap && x.pot[i] <= U.cap && b.survived[i] && x.survived[i]) lo.push(i);
  }
  const m = (I, A, k) => (I.length ? mean(I.map(i => A[k][i])) : NaN);
  return { hi: { n: hi.length, taxB: m(hi, b, 'tax'), taxX: m(hi, x, 'tax'), potB: m(hi, b, 'pot'), potX: m(hi, x, 'pot') }, lo: { n: lo.length, taxB: m(lo, b, 'tax'), taxX: m(lo, x, 'tax'), potB: m(lo, b, 'pot'), potX: m(lo, x, 'pot') } };
}
/* where a unit's paths lost (the base keeps, the arm fails) fail, plan year by plan year */
function failingYears(b, x) { const y = {}; for (let i = 0; i < b.survived.length; i++) if (b.survived[i] && !x.survived[i]) y[x.failYear[i]] = (y[x.failYear[i]] || 0) + 1; return y; }
/* one arm against a base over the units: parts 1 to 4's figures */
function compare(units, base, arm) {
  const H = units.map(U => { const b = U.arms[base], x = U.arms[arm], c = cells(b, x); return { id: U.id, U, cells: c, ch: survivalChange(c.lost, c.saved, c.N), capped: cappedOf(U, b, x), spendGbp: (sum(x.delivered) - sum(b.delivered)) / c.N, tax: [sum(b.tax), sum(x.tax)] }; });
  const pairs = units.map(U => [U.arms[base], U.arms[arm]]);
  const kept = spendOn(pairs, true), every = spendOn(pairs, false);
  const sb = sum(H.map(h => h.capped.sb)), sx = sum(H.map(h => h.capped.sx)), n = sum(H.map(h => h.capped.n));
  return { H, pooled: pooledCells(H.map(h => h.cells)), kept, every, capped: { pct: 100 * (sx / sb - 1), gbp: (sx - sb) / n }, spendGbp: sum(H.map(h => h.spendGbp * h.cells.N)) / n, tax: [sum(H.map(h => h.tax[0])), sum(H.map(h => h.tax[1]))] };
}
/* the rule, the outcome, the split's search, and what is printed beside them */
export function rule(units) {
  const R = compare(units, 'K2', 'HS5'), Hs = R.H;
  const part1 = R.pooled.lo > 0;
  const below = Hs.filter(h => h.ch.hi < RULE.unit), part2 = below.length === 0;
  const part3 = R.kept.pooled.d >= RULE.spend;
  const taxHS5 = sum(units.map(U => sum(U.arms.HS5.tax))), taxHOUSE = sum(units.map(U => sum(U.arms.HOUSE.tax))), part5 = taxHS5 < taxHOUSE;
  const fc = units.map(U => { const s = 100 * sum(U.arms.HS5.survived) / U.N, f = 100 * U.arms.HS5.forecast; return { id: U.id, forecast: f, survival: s, gap: f - s, out: Math.abs(f - s) > RULE.forecast }; });
  const belowNil = below.filter(h => biasesNil(h.U.bias));
  const outcome = !part5 ? 'STOP' : !part1 || !part3 || belowNil.length ? 'NO LEAD' : part2 ? 'A LEAD' : 'A LEAD, WITH A UNIT TO PLACE';
  // the split's search, HS1 less HS5
  const S = compare(units, 'HS5', 'HS1');
  const search = { pooled: S.pooled, below: S.H.filter(h => h.ch.hi < RULE.unit), kept: S.kept.pooled, taxPct: 100 * (S.tax[1] / S.tax[0] - 1) };
  search.goes = search.pooled.hi >= 0 && !search.below.length && search.kept.d >= RULE.spend && search.taxPct <= RULE.searchTax;
  return { R, parts: [part1, part2, part3, true, part5], below, belowNil, fc, taxHS5, taxHOUSE, outcome, search, H: compare(units, 'K2', 'HOUSE') };
}
/* a pooled figure without the unit that contributes most to it */
export function withoutLargest(R) {
  const net = R.H.map(h => h.cells.saved - h.cells.lost), iS = net.indexOf(Math.max(...net));
  const surv = pooledCells(R.H.filter((h, i) => i !== iS).map(h => h.cells));
  const spK = R.kept.by.map(b => Math.abs(b.D)), iK = spK.indexOf(Math.max(...spK));
  const potD = R.H.map(h => Math.abs(h.capped.sx - h.capped.sb)), iP = potD.indexOf(Math.max(...potD));
  const rest = R.H.filter((h, i) => i !== iP), sb = sum(rest.map(h => h.capped.sb)), sx = sum(rest.map(h => h.capped.sx)), n = sum(rest.map(h => h.capped.n));
  return { survival: { id: R.H[iS].id, ...surv }, kept: { id: R.H[iK].id, ...spendWithout(R.kept, iK) }, capped: { id: R.H[iP].id, pct: 100 * (sx / sb - 1), gbp: (sx - sb) / n } };
}

/* the planted checks: synthetic units the read must read as the rule says (PRESCRIPTIVE-PLAN.md step 4's seven, and one
   for each rule part) */
function planted() {
  const n = 4000, ids = ['A1', 'A2', 'A3', 'A4'], checks = [];
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const NIL = { lockedYears: 0, lockedAt: [], penShareSelf: 0.6, incomeTaxLeftOut: { aYear: 0, overPlan: 0, shareOfSpending: 0 }, oneOffOwned: [], cgtBand: { household: 75400, twoPeople: 75400 } };
  const zeroWhy = () => ({ n: 0, level: 0, raise: 0, cut: 0, riskN: 0, risk: 0 }), WHYR = { n: 10, years: [1], thirds: [[1], [], []], K2: { all: zeroWhy(), first: zeroWhy(), middle: zeroWhy(), last: zeroWhy() }, HS5: { all: zeroWhy(), first: zeroWhy(), middle: zeroWhy(), last: zeroWhy() } };
  const armWith = (surv, o = {}) => {
    const A = Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, new T(n)]));
    for (let i = 0; i < n; i++) { const s = surv(i); A.survived[i] = s ? 1 : 0; A.failYear[i] = s ? -1 : 5; A.pot[i] = o.pot ? o.pot(i) : 100; A.estate[i] = A.pot[i]; A.tax[i] = o.tax || 10; A.delivered[i] = o.deliv ? o.deliv(i, s) : 1000; A.unmet[i] = 0; }
    return A;
  };
  const enc = A => Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)]));
  const unitOf = (id, k, arms, bias = NIL, fcast = null) => {
    const order = orderOf(k), mk = (A, a, f) => { const x = { options: wantOptions(a), cpuUs: f * 1e6, chunks: [{ from: 0, to: n, cpuUs: f * 1e6, wallMs: 1, cpu: 'x', proc: 'p' }], place: order.indexOf(a), solveSecs: 10, forecast: a === 'K2' ? 0.9 : fcast !== null ? fcast : 0.9, ...(SPLIT_OF[a] ? { counts: { decisions: 1, far: 0, down: 0 } } : {}), ...enc(A) }; return armOf(x); };
    return { id, k, order, group: 'g', N: n, seed: 7002, pts: 45, candidate: CANDIDATE, stamp: { code: 'c', audit: 'a' }, digests: { before: { self: 's', part: 'p', household: 'h' }, after: { self: 's', part: 'p', household: 'h' } }, cap: 100, houseCap: 100, shareRule: 'pots', joint: JOINT, topK: 3, bias, why: WHYR, along: { decisions: 1 },
      arms: Object.fromEntries(ARMS.map(a => [a, mk(arms[a], a, a === 'K2' ? 1 : 0.5)])) };
  };
  // the base survives 90%; the arms saving 1.25 points (50 of 4,000) on each unit, HOUSE paying more tax than HS5
  const base = armWith(i => i % 10 !== 0), gain = armWith(i => i % 10 !== 0 || i % 80 === 0), gainHouse = armWith(i => i % 10 !== 0 || i % 80 === 0, { tax: 20 });
  const arms = (over = {}) => ({ K2: base, HOUSE: gainHouse, HS5: gain, HS1: gain, ...over });
  // fewer: 40 paths of 4,000 lost (1 point, its interval wholly below the bar), against three units each saving 50
  const fewer = armWith(i => i % 10 !== 0 && i % 100 !== 1);
  const gainUnits = ids.map((id, k) => unitOf(id, k, arms()));
  const rd = us => rule(us);
  const r0 = rd(gainUnits);
  checks.push(['a gain on every unit, spending and tax as K2, reads A LEAD, THE SEARCH GOES', r0.outcome === 'A LEAD' && r0.search.goes, `${r0.outcome}; ${r0.search.goes ? 'goes' : 'stays'}`]);
  const r1p = rd(ids.map((id, k) => unitOf(id, k, arms({ HS5: base, HS1: base }))));
  checks.push(['part 1: nothing gained reads NO LEAD', r1p.outcome === 'NO LEAD' && !r1p.parts[0], r1p.outcome]);
  // 1. a unit with nil biases put a point below K2: NO LEAD (part 2, the pool still gaining)
  const lostNil = [...gainUnits.slice(0, 3), unitOf('A4', 3, arms({ HS5: fewer }))], r1 = rd(lostNil);
  checks.push(['(1) a nil-bias unit a point below K2 reads NO LEAD, the pool still gaining', r1.outcome === 'NO LEAD' && r1.parts[0] && !r1.parts[1] && r1.belowNil.length === 1, `${r1.outcome}; pooled from ${r1.R.pooled.lo.toFixed(3)}; below ${r1.below.map(h => h.id).join(',')}`]);
  // 2. the same unit given a one-off deposit owned by one person: A LEAD, WITH A UNIT TO PLACE
  const r2 = rd([...gainUnits.slice(0, 3), unitOf('A4', 3, arms({ HS5: fewer }), { ...NIL, oneOffOwned: [{ owner: 'Myself', amount: 1000, year: 2030 }] })]);
  checks.push(['(2) the same unit with a one-off deposit owned by one person reads A LEAD, WITH A UNIT TO PLACE', r2.outcome === 'A LEAD, WITH A UNIT TO PLACE' && r2.below.length === 1 && !r2.belowNil.length, r2.outcome]);
  // 3. spending on the kept paths 0.06% lower, over every path higher: part 3 fails
  const lowKept = armWith(i => i % 10 !== 0 || i % 80 === 0, { deliv: (i, s) => (i % 10 !== 0 ? 999.4 : 1000) }), baseLow = armWith(i => i % 10 !== 0, { deliv: (i, s) => (s ? 1000 : 500) });
  const r3 = rd(ids.map((id, k) => unitOf(id, k, arms({ K2: baseLow, HS5: lowKept }))));
  checks.push(['(3) spending on the kept paths 0.06% lower and over every path higher: part 3 fails', !r3.parts[2] && r3.R.every.pooled.d > 0 && Math.abs(r3.R.kept.pooled.d + 0.06) < 1e-9 && r3.outcome === 'NO LEAD', `kept ${r3.R.kept.pooled.d.toFixed(4)}%, every path ${r3.R.every.pooled.d.toFixed(4)}%; ${r3.outcome}`]);
  // part 4: the capped pot 10% lower, survival and spending gaining: recorded, the outcome unchanged
  const lowPot = armWith(i => i % 10 !== 0 || i % 80 === 0, { pot: () => 90 }), r4p = rd(ids.map((id, k) => unitOf(id, k, arms({ HS5: lowPot }))));
  checks.push(['part 4: the capped pot 10% lower is recorded and the outcome stays A LEAD', r4p.outcome === 'A LEAD' && Math.abs(r4p.R.capped.pct + 10) < 1e-9 && Math.abs(r4p.R.capped.gbp + 10) < 1e-9, `${r4p.outcome}; ${r4p.R.capped.pct.toFixed(3)}%, ${r4p.R.capped.gbp.toFixed(2)} a path`]);
  // 4. HS5's tax made higher than HOUSE's: STOP
  const r4 = rd(ids.map((id, k) => unitOf(id, k, arms({ HS5: armWith(i => i % 10 !== 0 || i % 80 === 0, { tax: 30 }) }))));
  checks.push(['(4) HS5\'s lifetime tax above HOUSE\'s reads STOP', r4.outcome === 'STOP' && !r4.parts[4], r4.outcome]);
  // 5. a forecast 3 points from its arm: the unit named, the outcome unchanged
  const r5 = rd([...gainUnits.slice(0, 3), unitOf('A4', 3, arms(), NIL, (100 * (n - 350) / n + 3) / 100)]);
  checks.push(['(5) a forecast 3 points from its arm names the unit and leaves the outcome', r5.outcome === 'A LEAD' && r5.fc.filter(f => f.out).map(f => f.id).join(',') === 'A4', `${r5.outcome}; named ${r5.fc.filter(f => f.out).map(f => `${f.id} ${f.gap.toFixed(2)}`).join(',')}`]);
  // 6. HS1 put a point below HS5 on one unit: THE SEARCH STAYS
  const hs1Low = armWith(i => (i % 10 !== 0 || i % 80 === 0) && i % 100 !== 1), r6 = rd([...gainUnits.slice(0, 3), unitOf('A4', 3, arms({ HS1: hs1Low }))]);
  checks.push(['(6) HS1 a point below HS5 on one unit reads THE SEARCH STAYS', !r6.search.goes && r6.search.below.length === 1, r6.search.goes ? 'goes' : 'stays']);
  // 7. one path of K2 changed: STOP (the identity)
  const jw = () => ({ seed: 7002, N: n, pts: 45, arms: { K2: enc(base) } });
  const off = armWith(i => i % 10 !== 0); off.survived[7] = 0;
  const jwOff = id => (id === 'A3' ? { seed: 7002, N: n, pts: 45, arms: { K2: enc(off) } } : jw());
  checks.push(['(7) one path of K2 changed reads STOP at the identity, and none changed passes it', identity(gainUnits, jw).length === 0 && identity(gainUnits, jwOff).length === 1, identity(gainUnits, jwOff).join('; ')]);
  checks.push(['the gate takes the planted units and refuses one missing, and a household arm read off another table', gate(gainUnits, ids, 'a', null).length === 0 && gate(gainUnits.slice(1), ids, 'a', null).some(p => /missing/.test(p))
    && gate([...gainUnits.slice(0, 3), (U => { U.arms.HS1 = { ...U.arms.HS1, forecast: 0.8 }; return U; })(unitOf('A4', 3, arms()))], ids, 'a', null).some(p => /one table/.test(p))]);
  const wl = withoutLargest(r1.R);
  checks.push(['without its largest unit: the unit saving most is the one left out', ['A1', 'A2', 'A3'].includes(wl.survival.id) && wl.survival.d < r1.R.pooled.d + 1e-9, `${wl.survival.id} ${wl.survival.d.toFixed(3)}`]);
  let bad = 0;
  for (const [label, ok, detail] of checks) { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`); }
  console.log(bad ? `PLANTED: ${bad} of ${checks.length} FAILED` : `PLANTED: ALL PASS (${checks.length})`);
  return bad;
}

const f2 = x => (x >= 0 ? '+' : '') + x.toFixed(2), f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const { UNITS, stampFilesHash } = await import('./audit-household.mjs');
  const DIR = process.env.HH_OUT || join(HERE, 'results', 'household-7002'), JW = join(HERE, 'results', 'joint-wide-7002'), smoke = args.includes('--smoke');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)) : [];
  if (!files.length) { console.error(`reduce-household: no units in ${DIR}`); process.exit(2); }
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    const logs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
    requireFairLogs(logs, 'none', { blob: () => '-' });
  }
  const units = files.map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
  // a smoke reads the units it ran, each against its place in the design
  const ids = UNITS.map(u => u.id), problems = gate(units, ids, stampFilesHash(), smoke ? null : undefined, smoke);
  console.log(`ONE PLAN FOR THE WHOLE HOUSEHOLD, THE LEAD TEST (EXPLORATORY; HOUSEHOLD.md section 5 as amended for step 4, D118): ${units.length} units, seed ${units[0].seed}, ${units[0].N} paths, ${units[0].pts} points; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);
  if (problems.length) { console.log(`THE GATE: REFUSED\n  ${problems.join('\n  ')}`); process.exit(3); }
  console.log('THE GATE: fair');
  if (smoke) { console.log('a smoke: the gate read, no figure printed'); process.exit(0); }
  const jwOf = id => { const f = join(JW, `${id}.json.gz`); return existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; };
  const idp = identity(units, jwOf);
  if (idp.length) { console.log(`THE IDENTITY: K2 differs from JOINT-WIDE's\n  ${idp.join('\n  ')}\nOUTCOME: STOP`); process.exit(4); }
  console.log(`THE IDENTITY: each unit's K2 equals JOINT-WIDE's K2, all seven arrays byte for byte, on ${units.length} units`);
  units.sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
  const X = rule(units), R = X.R, say = ok => (ok ? 'HOLDS' : 'FAILS');
  console.log('\nTHE RULE, HS5 less K2, paired by path (stats.mjs survivalChange):');
  console.log(`  1. pooled survival ${iv(R.pooled)} points over ${units.length} units; its lower end above 0: ${say(X.parts[0])}`);
  console.log(`  2. units whose interval lies wholly below ${RULE.unit}: ${X.below.map(h => `${h.id} ${iv(h.ch)} (${h.cells.saved} saved, ${h.cells.lost} lost; biases ${biasesNil(h.U.bias) ? 'nil' : 'not nil'})`).join('; ') || 'none'}: ${say(X.parts[1])}`);
  console.log(`  3. pooled spending delivered on the paths both keep ${iv(R.kept.pooled, f4)}% of K2's; not lower by more than ${-RULE.spend}%: ${say(X.parts[2])}`);
  console.log(`  4. the pot counted up to the cap, pooled ${f3(R.capped.pct)}% (${gbp(R.capped.gbp)} a path), beside spending ${gbp(R.spendGbp)} a path over every path: recorded, not a bar (D116)`);
  console.log(`  5. pooled lifetime tax, HS5 ${gbp(X.taxHS5)} against HOUSE ${gbp(X.taxHOUSE)} (${f3(100 * (X.taxHS5 / X.taxHOUSE - 1))}%); HS5's lower: ${say(X.parts[4])}`);
  console.log(`  6. the household table's opening forecast less HS5's survival, beyond ${RULE.forecast} points: ${X.fc.filter(f => f.out).map(f => `${f.id} ${f2(f.gap)} (${f.forecast.toFixed(2)} against ${f.survival.toFixed(2)})`).join('; ') || 'none'} (named; the outcome unchanged)`);
  console.log(`OUTCOME: ${X.outcome}`);
  if (X.outcome === 'A LEAD, WITH A UNIT TO PLACE') for (const h of X.below) console.log(`  to place: ${h.id}: locked years ${h.U.bias.lockedYears} (${h.U.bias.lockedAt.join(', ')}); the first person's share of the pensions ${h.U.bias.penShareSelf.toFixed(3)}; income tax left out ${gbp(h.U.bias.incomeTaxLeftOut.aYear)} a year; one-off deposits ${h.U.bias.oneOffOwned.map(d => `${gbp(d.amount)} (${d.owner}, ${d.year})`).join(', ') || 'none'}; its lost paths fail in plan years ${Object.entries(failingYears(h.U.arms.K2, h.U.arms.HS5)).map(([y, c]) => `${y} (${c})`).join(', ')}`);
  if (X.outcome === 'STOP') process.exit(0);
  const s = X.search;
  console.log(`\nTHE SPLIT'S SEARCH, HS1 less HS5: pooled survival ${iv(s.pooled)}; units wholly below ${RULE.unit}: ${s.below.map(h => `${h.id} ${iv(h.ch)}`).join('; ') || 'none'}; pooled spending on the paths both keep ${iv(s.kept, f4)}%; pooled lifetime tax ${f3(s.taxPct)}%: ${s.goes ? 'THE SEARCH GOES' : 'THE SEARCH STAYS'}`);
  console.log('\nBESIDE THE RULE, deciding nothing:');
  const wl = withoutLargest(R);
  console.log(`  without its largest unit: pooled survival ${iv(wl.survival)} (without ${wl.survival.id}); spending on the kept paths ${iv(wl.kept, f4)}% (without ${wl.kept.id}); the capped pot ${f3(wl.capped.pct)}% (${gbp(wl.capped.gbp)} a path; without ${wl.capped.id})`);
  console.log(`  spending delivered over every path ${iv(R.every.pooled, f4)}%`);
  const H = X.H;
  console.log(`  HOUSE less K2: pooled survival ${iv(H.pooled)}; units wholly below ${RULE.unit}: ${H.H.filter(h => h.ch.hi < RULE.unit).map(h => `${h.id} ${iv(h.ch)}`).join('; ') || 'none'}; spending on the kept paths ${iv(H.kept.pooled, f4)}%; the capped pot ${f3(H.capped.pct)}% (${gbp(H.capped.gbp)} a path)`);
  const ac = (base, arm) => { const S = { hi: { n: 0, tb: 0, tx: 0, pb: 0, px: 0 }, lo: { n: 0, tb: 0, tx: 0, pb: 0, px: 0 } }; for (const U of units) { const a = aboveCap(U, U.arms[base], U.arms[arm]); for (const w of ['hi', 'lo']) if (a[w].n) { S[w].n += a[w].n; S[w].tb += a[w].taxB * a[w].n; S[w].tx += a[w].taxX * a[w].n; S[w].pb += a[w].potB * a[w].n; S[w].px += a[w].potX * a[w].n; } } return S; };
  for (const arm of ['HOUSE', 'HS5', 'HS1']) { const S = ac('K2', arm), q = (w, k) => S[w][k] / S[w].n; console.log(`  ${arm} against K2, above the cap (both end above it; ${S.hi.n} paths): lifetime tax ${gbp(q('hi', 'tb'))} and ${gbp(q('hi', 'tx'))}, the pot left ${gbp(q('hi', 'pb'))} and ${gbp(q('hi', 'px'))}; below it (both at or below, both kept; ${S.lo.n} paths): tax ${gbp(q('lo', 'tb'))} and ${gbp(q('lo', 'tx'))}, the pot ${gbp(q('lo', 'pb'))} and ${gbp(q('lo', 'px'))}`); }
  const cnt = a => units.reduce((t, U) => ({ decisions: t.decisions + U.arms[a].counts.decisions, far: t.far + U.arms[a].counts.far, down: t.down + U.arms[a].counts.down }), { decisions: 0, far: 0, down: 0 });
  for (const a of ['HS5', 'HS1']) { const c = cnt(a); console.log(`  step 1's counts, ${a}: ${c.decisions} decisions, past twice the table's wealth top ${c.far}, of those to a less risky tier ${c.down}; by unit where past it: ${units.filter(U => U.arms[a].counts.far).map(U => `${U.id} ${U.arms[a].counts.far}/${U.arms[a].counts.down}`).join(', ') || 'none'}`); }
  const why = (a, p) => { const z = units.reduce((t, U) => { const w = U.why[a][p]; return { n: t.n + w.n, level: t.level + w.level, raise: t.raise + w.raise, cut: t.cut + w.cut, riskN: t.riskN + w.riskN, risk: t.risk + w.risk }; }, { n: 0, level: 0, raise: 0, cut: 0, riskN: 0, risk: 0 }); return `the level ${(z.level / z.n).toFixed(4)} (a raise at ${(100 * z.raise / z.n).toFixed(1)}%, a cut at ${(100 * z.cut / z.n).toFixed(1)}% of decisions), the risk held ${(z.risk / z.riskN).toFixed(3)}% a year`; };
  console.log(`  the spending level and the risk held, on each unit's first ${units[0].why.n} paths, pooled over the units (the review's why-pot.mjs measures):`);
  for (const p of ['all', 'first', 'middle', 'last']) console.log(`    ${p === 'all' ? 'every spending year' : `the ${p} third`}: K2 ${why('K2', p)}; HS5 ${why('HS5', p)}`);
  const ratio = (a, f) => units.map(U => f(U.arms[a]) / f(U.arms.K2)), one = units.filter(U => new Set(ARMS.flatMap(a => U.arms[a].chunks.map(c => c.proc))).size === 1);
  console.log(`  the time against K2's, the median over the units (over the ${one.length} whose four arms ran in one process): ${['HOUSE', 'HS5', 'HS1'].map(a => `${a} the solve x${median(ratio(a, x => x.solveSecs)).toFixed(2)}, CPU a path x${median(ratio(a, x => x.cpuUs)).toFixed(3)} (x${one.length ? median(one.map(U => U.arms[a].cpuUs / U.arms.K2.cpuUs)).toFixed(3) : '-'})`).join('; ')}; K2 ${(median(units.map(U => U.arms.K2.cpuUs / 1e3 / U.N))).toFixed(1)} ms a path`);
  console.log('  by unit: survival K2 / HOUSE / HS5 / HS1 (%); HS5 less K2 (interval; saved / lost); spending on the kept paths %; the capped pot % and a path; lifetime tax K2 / HS5; the forecast less HS5; HS1 less HS5; biases; step 1\'s counts on HS5');
  for (const h of R.H) {
    const U = h.U, sv = a => (100 * sum(U.arms[a].survived) / U.N).toFixed(2), sp = R.kept.by[R.H.indexOf(h)], f = X.fc.find(x => x.id === U.id), s1 = X.search.pooled && compare([U], 'HS5', 'HS1').H[0];
    console.log(`    ${U.id.padEnd(12)} ${U.group.padEnd(8)} ${sv('K2')} / ${sv('HOUSE')} / ${sv('HS5')} / ${sv('HS1')}; ${iv(h.ch)} (${h.cells.saved} / ${h.cells.lost}); ${f4(sp.d)}%; ${f3(h.capped.pct)}% ${gbp(h.capped.gbp)}; ${gbp(h.tax[0] / U.N)} / ${gbp(h.tax[1] / U.N)}; ${f2(f.gap)}; ${iv(s1.ch)}; ${biasesNil(U.bias) ? 'nil' : `locked ${U.bias.lockedYears}, share ${U.bias.penShareSelf.toFixed(2)}, tax left out ${gbp(U.bias.incomeTaxLeftOut.aYear)} a year, deposits ${U.bias.oneOffOwned.length}`}; ${U.arms.HS5.counts.far}/${U.arms.HS5.counts.down}`);
  }
}
