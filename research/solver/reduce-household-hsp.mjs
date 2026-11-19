/*
 * STEP 8, THE READ (STEP8.md; registrations/household-hsp.md, DRAFT; D129 (3); read once, by its rule).
 * The stamps first (fair-gate.mjs requireFairLogs: every log stamped by the launcher under the registration, its git blob the
 * registration's now), then the gate: every unit of household-hsp-panel.json there with its three arms (APP, K2, HSPA); one
 * code, audit, seed, prediction, estate weight, points and Node version; each unit at the registration's paths
 * (household-hsp-paths.json), every array one a path; each unit at the panel's target, arm A's pick the landing's, the app's
 * guard on, each arm at its configuration (audit-household-hsp.mjs configOf), HSPA's k the pensions' split's.
 * Then the rule, HSPA against K2 over the units:
 *   1. NO HARM: no unit flagged by D34's harm rule (reduce-couples.mjs harmOf: the loss over the unit's paths against the
 *      threshold its realised discordance sets), the loss and the threshold compared in whole paths (reduce-share-rules.mjs
 *      harmExact);
 *   2. A GAIN: the pooled survival change with its 95% interval's lower end above nought, the interval by path
 *      (reduce-phase4.mjs survivalItem: each path's change averaged over the units, as the confirmatory reads take it; every
 *      unit runs the same paths, so cells summed over the units would read them as independent: the design review's
 *      BLOCKING 2);
 *   3. SPENDING: pooled spending delivered on the paths both keep, each unit's change in percent of K2's mean on those paths,
 *      the units weighted equally (keptSpend, its interval by path), its point estimate not lower than -0.05% (the design
 *      review's MINOR 8: weighted by pounds two units carried 55%).
 * PASS if all three hold, else FAIL with the parts that fail. The pot's ruling (D116, M1) is in the rule as given: a smaller
 * pot left is not a harm where HSPA keeps more paths and delivers no less spending; the pot is recorded, capped at the two
 * people's estate caps and in pounds a path, and is not a bar. M1 is read unit by unit as well (the remedy's reviewer,
 * MINOR 3): each unit's spending on the paths both keep and its capped pot are printed, and a unit where HSPA keeps more paths
 * but spends less on the paths both keep beyond noise is named with its pot, M1's condition not met there; not a bar. Beside, deciding nothing: HSPA and K2 against APP (pooled and by
 * unit, D34's flags against APP for investigation, D34 (3)); a comparison whose 1-point rate at its realised discordance falls
 * below 0.90 named with its rate (D34 (4)); the pot; lifetime tax; each table's forecast against its survival; the rollout
 * beside the engine on K2's first paths; the times.
 *   node research/solver/reduce-household-hsp.mjs [dir] > research/solver/results-household-hsp.txt     the registered read
 *   node research/solver/reduce-household-hsp.mjs --pilot [dir]                                          the pilot's gate, no outcome
 *   node research/solver/reduce-household-hsp.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange } from './stats.mjs';
import { survivalItem, byPath } from './reduce-phase4.mjs';
import { harmExact } from './reduce-share-rules.mjs';
import { cells, spendOn } from './reduce-household.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { wantProblems } from './audit-couples.mjs';
import { shapesLineProblems } from './audit-shapes.mjs';
import { DOUBLED, SCALED } from './household.mjs';
import { ARMS, KEYS, SEED, PILOT_SEED, PTS, W, REGISTRATION, PATHS_FILE, configOf, stampFilesHash, pilotUnits } from './audit-household-hsp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const POOL_BAR = 0, SPEND_BAR = -0.05, TP_BAR = 0.9;
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])) });
export function loadDir(dir) {
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).map(x => { const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
}
/* HSPA's plan entries from one person's, as its form prices them (HOUSEHOLD-ARM.md; household.mjs 'pensionsPA';
   audit-household-arm.mjs scalePAProblems): the allowance, each SCALED limit and the cap k times one person's, every other
   doubled entry design A's as built; and design A's own from one person's: each doubled, the no-earnings limit at least
   doubled (household.mjs raises it to the most a later retiree pays into a pension in a year; household.test.mjs check 1).
   The pilot's S273 units, whose later retiree pays more than the two limits, first showed the gate wanting twice one
   person's there. */
export function hspaPlanProblems(person, hspa, k, asBuilt) {
  const near = (x, y) => Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(y));
  const want = key => (key === 'personalAllowance' || SCALED.includes(key) || key === 'pclsMaxCap' ? k * person[key] : asBuilt[key]);
  const P = DOUBLED.filter(key => !near(hspa[key], want(key))).map(key => `${key} ${hspa[key]}, not ${want(key)}`);
  for (const key of DOUBLED) {
    const two = 2 * person[key], ok = key === 'pensionNoEarningsLimit' ? asBuilt[key] >= two - 1e-6 * Math.max(1, two) : near(asBuilt[key], two);
    if (!ok) P.push(`design A's ${key} ${asBuilt[key]}, not ${key === 'pensionNoEarningsLimit' ? 'at least ' : ''}${two}`);
  }
  return P;
}
/* the gate: refusals, each a line. `want` the panel's units (id, target, label, cohort, variant); `paths` id -> N, or null;
   `logs` the launch logs (file -> text), or null */
export function gate(units, want, { seed, prediction = null, audit = null, paths = null, code = null, logs = null, pts = PTS } = {}) {
  const P = [], byId = Object.fromEntries(units.map(u => [u.id, u]));
  for (const w of want) if (!byId[w.id]) P.push(`${w.id}: missing`);
  for (const u of units) if (!want.some(w => w.id === u.id)) P.push(`${u.id}: not a unit of the panel`);
  if (logs !== null) {
    const texts = Object.values(logs);
    if (texts.length !== units.length) P.push(`${texts.length} launch logs for ${units.length} units`);
    // each unit's own log: its number and id on its first line after the stamp, its done line (MINOR 6: not a count alone)
    for (const u of units) { const own = texts.filter(t => new RegExp(`unit ${u.k}/\\d+: ${u.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} `).test(t)); if (own.length !== 1 || !new RegExp(`^ +done unit ${u.k} secs `, 'm').test(own[0])) P.push(`${u.id}: ${own.length} launch logs name it${own.length === 1 ? ', without its done line' : ''}`); }
  }
  const one = (what, g) => { const vs = [...new Set(units.map(g))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('prediction', u => u.stamp.prediction); one('Node version', u => u.stamp.node); one('seed', u => u.seed); one('estate weight', u => u.W); one('points', u => u.pts);
  if (units.some(u => u.seed !== seed)) P.push(`a unit is not on seed ${seed}`);
  if (units.some(u => u.W !== W)) P.push(`a unit is not at estate weight ${W}`);
  if (units.some(u => u.pts !== pts)) P.push(`a unit is not at ${pts} points`);
  if (prediction && units.some(u => u.stamp.prediction !== prediction)) P.push(`a unit was not run under ${prediction}`);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (code && units.some(u => u.stamp.code !== code)) P.push(`a unit's code is not the code the panel was landed on (${code})`);
  for (const u of units) {
    const w = want.find(x => x.id === u.id); if (!w) continue;
    const N = paths ? paths[u.id] : u.N;
    if (!(N > 0)) P.push(`${u.id}: no paths for it`);
    if (u.N !== N) P.push(`${u.id}: ${u.N} paths, not ${N}`);
    if (u.target !== w.target) P.push(`${u.id}: target ${u.target}, not the panel's ${w.target}`);
    if (u.label !== w.label) P.push(`${u.id}: arm A's pick ${u.label}, not the landing's ${w.label}`);
    if (!u.guard || !u.guard.on) P.push(`${u.id}: the app's guard off (${u.guard && u.guard.why})`);
    if (!(u.split && u.split.s >= 0.5 - 1e-12 && u.split.s <= 1 + 1e-12 && Math.abs(u.split.k - 1 / u.split.s) < 1e-12)) P.push(`${u.id}: HSPA's k ${u.split && u.split.k}, not 1 / s for s in 0.5 to 1`);
    // the record checked again (MINOR 6): each table's settings, the household line against the first person's, HSPA's plan,
    // its band for gains
    const rec = u.record;
    if (!rec) P.push(`${u.id}: no record of the solves`);
    else {
      const safe = (f, what) => { try { return f(); } catch (e) { return [`${what} unreadable (${e.message})`]; } };
      for (const w of ['self', 'part', 'household']) for (const q of safe(() => wantProblems('CANDC', rec.settings[w], W, u.pts !== PTS), 'its settings line')) P.push(`${u.id} ${w}: ${q}`);
      for (const q of safe(() => shapesLineProblems(rec.lines.self, rec.lines.household, rec.lines.floor, rec.lines.houseFloorFrac, rec.lines.selfFloorFrac), 'household: its line against the first person\'s')) P.push(`${u.id}: ${q}`);
      if (!rec.plan || !rec.plan.asBuilt) P.push(`${u.id}: no record of design A's plan`);
      else for (const q of safe(() => hspaPlanProblems(rec.plan.person, rec.plan.hspa, u.split.k, rec.plan.asBuilt), 'its plan')) P.push(`${u.id} HSPA's plan: ${q}`);
      if (!(Math.abs(rec.band.hspa - u.split.k * rec.band.person) < 1e-6)) P.push(`${u.id}: HSPA's band for gains ${rec.band.hspa}, not k x ${rec.band.person}`);
    }
    for (const arm of ARMS) {
      const A = u.arms[arm];
      if (!A) { P.push(`${u.id} ${arm}: missing`); continue; }
      if (A.config !== configOf(arm)) P.push(`${u.id} ${arm}: configuration ${A.config}, not ${configOf(arm)}`);
      for (const k of Object.keys(KEYS)) if (!A[k] || A[k].length !== u.N) P.push(`${u.id} ${arm}: ${k} not one a path`);
    }
  }
  return P;
}
/* spending on the paths both keep, each unit's change in percent of the base's mean on those paths, the units weighted
   equally, its interval by path: a unit's change on path i scaled by n over its kept count, so that its mean over every path
   is its own figure, then averaged over the units path by path (reduce-phase4.mjs byPath) */
export function keptSpend(units, base, arm, n) {
  return byPath(units.map(u => {
    const b = u.arms[base], x = u.arms[arm], kept = []; for (let i = 0; i < n; i++) if (b.survived[i] && x.survived[i]) kept.push(i);
    const mb = kept.reduce((t, i) => t + b.delivered[i], 0) / (kept.length || 1), z = new Float64Array(n);
    for (const i of kept) z[i] = (n / kept.length) * 100 * (x.delivered[i] - b.delivered[i]) / (mb || 1);
    return i => z[i];
  }), n);
}
/* the pooled survival change as cells summed over the units would read it (each unit independent): printed beside, never
   decided on */
export const summedCells = rows => survivalChange(sum(rows.map(r => r.cells.lost)), sum(rows.map(r => r.cells.saved)), sum(rows.map(r => r.cells.N)));
/* HSPA against a base over the units: each unit's harm (D34, in whole paths) and change, the pooled change and spending, both
   by path over the units' common paths */
export function compare(units, base, arm = 'HSPA') {
  const ns = [...new Set(units.map(u => u.N))];
  if (ns.length !== 1) throw new Error(`reduce-household-hsp: the units run ${ns.join(', ')} paths, not one count`);
  const n = ns[0], rows = units.map(u => { const c = cells(u.arms[base], u.arms[arm]); return { id: u.id, cohort: u.cohort, variant: u.variant, k: u.split.k, cells: c, ch: survivalChange(c.lost, c.saved, c.N), ...harmExact(u.arms[arm], u.arms[base], u.N) }; });
  const pooled = survivalItem(units.map(u => [u.arms[arm], u.arms[base]]), n);
  return { base, arm, rows, pooled, summed: summedCells(rows), kept: { pooled: keptSpend(units, base, arm, n) } };
}
/* the rule (STEP8.md), HSPA against K2 */
/* M1 by unit: HSPA against K2, the units that keep more paths but spend less on the paths both keep beyond noise */
export function m1ByUnit(units, arm = 'HSPA') {
  return units.map(u => {
    const c = cells(u.arms.K2, u.arms[arm]), sp = spendOn([[u.arms.K2, u.arms[arm]]], true).by[0], cap = cappedOf(u.caps[0] + u.caps[1], u.arms.K2, u.arms[arm]);
    return { id: u.id, net: c.saved - c.lost, spend: sp, cap, unmet: c.saved - c.lost > 0 && sp.hi < 0 };
  });
}
export function rule(units) {
  const C = compare(units, 'K2'), flagged = C.rows.filter(r => r.flag);
  const parts = { harm: flagged.length === 0, gain: C.pooled.lo > POOL_BAR, spend: C.kept.pooled.d >= SPEND_BAR };
  return { C, flagged, parts, outcome: parts.harm && parts.gain && parts.spend ? 'PASS' : 'FAIL' };
}
const mean = a => sum(a) / a.length, median = a => { const s = [...a].sort((p, q) => p - q), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
function cappedOf(cap, b, x) { let sb = 0, sx = 0; for (let i = 0; i < b.pot.length; i++) { sb += Math.min(b.pot[i], cap); sx += Math.min(x.pot[i], cap); } return { pct: sb > 0 ? 100 * (sx / sb - 1) : 0, gbp: (sx - sb) / b.pot.length }; }

function planted() {
  const cases = [], arr = (n, f) => { const a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = f(i) ? 1 : 0; return a; };
  const unit = (id, sK2, sHSP, o = {}) => {
    const n = 4000, fl = (x, i) => Float64Array.from({ length: n }, () => x);
    const A = s => ({ config: '', survived: arr(n, s), failYear: new Int16Array(n), pot: fl(100), estate: fl(100), tax: fl(1), delivered: fl(o.spend || 1000), unmet: fl(0) });
    const K = A(sK2), H = A(sHSP); H.delivered = Float64Array.from({ length: n }, () => (o.spendH || 1000));
    return { id, cohort: 'lib', variant: 'own', N: n, split: { s: 0.6, k: 1 / 0.6 }, caps: [1e9, 1e9], arms: { APP: A(sK2), K2: K, HSPA: H } };
  };
  // HSPA keeps more on every unit: PASS; a unit losing 2% of paths: flagged, FAIL; no pooled gain: FAIL; spending lower: FAIL
  const gainU = id => unit(id, i => i % 10 !== 0, i => i % 20 !== 0);
  { const R = rule([gainU('a'), gainU('b')]);
    cases.push(['HSPA saving 5% of paths on each unit: no flag, a gain, spending held: PASS', `${R.outcome} ${R.parts.harm} ${R.parts.gain} ${R.parts.spend}`, 'PASS true true true']); }
  { const R = rule([gainU('a'), unit('b', i => i % 10 !== 0, i => i % 10 !== 0 && i % 50 !== 1)]);
    cases.push(['a unit losing 2% of its paths under HSPA: flagged, FAIL', `${R.outcome} ${R.flagged.map(r => r.id).join(',')}`, 'FAIL b']); }
  { const R = rule([unit('a', i => i % 10 !== 0, i => i % 10 !== 0), unit('b', i => i % 10 !== 0, i => i % 10 !== 0)]);
    cases.push(['HSPA the same as K2 on every path: no gain, FAIL', `${R.outcome} ${R.parts.gain}`, 'FAIL false']); }
  { const g = id => { const u = gainU(id); u.arms.HSPA.delivered = Float64Array.from({ length: u.N }, () => 999); return u; }, R = rule([g('a'), g('b')]);
    cases.push(['HSPA spending 0.1% less on the paths both keep: FAIL on spending alone', `${R.outcome} ${R.parts.harm} ${R.parts.gain} ${R.parts.spend}`, 'FAIL true true false']); }
  // the pooled gain by path, where cells summed over the units would read the units as independent (the design review's
  // BLOCKING 2): ten units sharing their paths, HSPA saving the first 300 paths of each and losing the next 260, so each gains a
  // point; summed, the interval clears nought; by path, the shared swing makes it straddle nought, and part 2 FAILS (the point
  // above nought too: a mutant reading the point or the upper end would pass it; MINOR 5)
  { const sw = id => unit(id, i => !(i < 300), i => !(i >= 300 && i < 560)), us = Array.from({ length: 10 }, (_, j) => sw(`s${j}`)), R = rule(us);
    cases.push(['units sharing a swing: summed cells clear nought, by path the interval straddles it, part 2 FAILS though the point is above nought', `${R.C.summed.lo > 0} ${R.C.pooled.lo < 0} ${R.C.pooled.d > 0} ${R.parts.gain} ${R.outcome}`, 'true true true false FAIL']); }
  // part 3 reads its point (MINOR 5): spending -0.04% on noisy paths, its lower end past -0.05: holds; -0.06% with its upper
  // end above -0.05: FAILS
  { const noisy = (id, m) => { const u = gainU(id); u.arms.HSPA.delivered = Float64Array.from({ length: u.N }, (_, i) => 1000 * (1 + m / 100) + (Math.floor(i / 10) % 2 ? 30 : -30)); return u; };   // the noise alternating by blocks of ten, so it averages to nought over the kept paths (every tenth is lost)
    const a = rule([noisy('a', -0.04), noisy('b', -0.04)]), b = rule([noisy('a', -0.06), noisy('b', -0.06)]);
    cases.push(['part 3 reads its point: -0.04% with its lower end past -0.05 holds; -0.06% with its upper end above -0.05 fails', `${a.C.kept.pooled.lo < -0.05} ${a.parts.spend} ${b.C.kept.pooled.hi > -0.05} ${b.parts.spend}`, 'true true true false']); }
  // the bar either side by one path, through the rule's own wiring (the remedy's reviewer, MINOR 1): K2 keeps every path of
  // unit b and HSPA loses its first m; m found as the first loss D34 flags at b's own discordance; a unit that gains carries the
  // pooled part
  { const lose = m => unit('b', () => true, i => i >= m), big = unit('a', i => i % 10 !== 0, () => true);
    let m = 1; while (m < 400 && !harmExact(lose(m).arms.HSPA, lose(m).arms.K2, 4000).flag) m++;
    const below = rule([big, lose(m - 1)]), over = rule([big, lose(m)]);
    cases.push([`a unit one path under its D34 bar (net loss ${m - 1}) is not flagged, one path over (${m}) is, the rest of the rule the same`, `${below.parts.harm} ${over.parts.harm} ${below.parts.gain && over.parts.gain} ${below.outcome} ${over.outcome}`, 'true false true PASS FAIL']); }
  // M1 by unit: more paths kept but less spent on the paths both keep is named; more paths and no less spent is not
  { const keepsLessSpend = (() => { const u = gainU('a'); u.arms.HSPA.delivered = Float64Array.from({ length: u.N }, (_, i) => 990 + (i % 3)); return u; })();
    const M = m1ByUnit([keepsLessSpend, gainU('b')]);
    cases.push(['M1 by unit: a unit keeping more paths but spending less beyond noise is named, one spending no less is not', M.filter(x => x.unmet).map(x => x.id).join(','), 'a']); }
  // the gate on built units, each with its record and its own launch log; the settings lines are left to the run (hand-made
  // lines cannot pass wantProblems), as the share rules' planted gate leaves them
  { const want = [{ id: 'a', target: 1, label: 'x' }, { id: 'b', target: 1, label: 'x' }], k = 1 / 0.6;
    const person = Object.fromEntries(DOUBLED.map(key => [key, key === 'personalAllowance' ? 12570 : 50000]));
    const hspa = Object.fromEntries(DOUBLED.map(key => [key, key === 'personalAllowance' ? k * 12570 : SCALED.includes(key) || key === 'pclsMaxCap' ? k * 50000 : 100000]));
    const asBuilt = Object.fromEntries(DOUBLED.map(key => [key, 2 * person[key]]));
    const mk = (id, n) => { const u = gainU(id); return { ...u, k: n, target: 1, label: 'x', seed: 9, W, pts: PTS, guard: { on: true }, stamp: { code: 'c', audit: 'a', prediction: 'p', node: 'n' }, record: { settings: { self: 'pts 45', part: 'pts 45', household: 'pts 45' }, lines: { self: 'pts 45 levels 1,0.8 minPot 0 tieAboveCap 0', household: 'pts 45 levels 1,0.8 minPot 0 tieAboveCap 0.0001', floor: 0, houseFloorFrac: 0.8, selfFloorFrac: 0.8 }, plan: { person: { ...person }, hspa: { ...hspa }, asBuilt: { ...asBuilt } }, band: { person: 37700, hspa: k * 37700 } }, arms: Object.fromEntries(ARMS.map(x => [x, { ...u.arms[x], config: configOf(x) }])) }; };
    const log = (id, n, done = true) => `stamp: code c audit a prediction p sha -\nSTEP 8: unit ${n}/2: ${id} (lib, own), target 1\n${done ? `         done unit ${n} secs 5\n` : ''}`;
    const logsOf = (o = {}) => ({ 'case0.txt': log('a', 0, o.aDone !== false), ...(o.short ? {} : { 'case1.txt': log('b', 1) }) });
    const G = (mod, o = {}) => { const us = [mk('a', 0), mk('b', 1)]; if (mod) mod(us); return gate(us, want, { seed: 9, logs: logsOf(), ...o }).filter(x => !/^\S+ (self|part|household): |^\S+: (self|household): /.test(x)); };
    { const g0 = G(); cases.push(['the gate: the built units fair', g0.length ? `${g0.length}: ${g0.slice(0, 3).join(' | ')}` : '0', '0']); }
    { const raised = us => { us[0].record.plan.asBuilt.pensionNoEarningsLimit = 120000; us[0].record.plan.hspa.pensionNoEarningsLimit = 120000; }, g1 = G(raised);
      cases.push(["the gate: a unit whose later retiree pays more into a pension than the two no-earnings limits (design A's limit raised, HSPA's the same) fair", g1.length ? `${g1.length}: ${g1.slice(0, 3).join(' | ')}` : '0', '0']); }
    const faults = [
      ['a unit missing', us => us.pop(), { logs: logsOf({ short: true }) }, /b: missing/],
      ['an arm missing', us => { delete us[0].arms.HSPA; }, {}, /a HSPA: missing/],
      ['another seed', us => { us[1].seed = 8; }, {}, /seed/],
      ['another code', us => { us[1].stamp = { ...us[1].stamp, code: 'd' }; }, {}, /more than one code/],
      ['another audit', us => { us[1].stamp = { ...us[1].stamp, audit: 'z' }; }, {}, /more than one audit/],
      ['another estate weight', us => { us[1].W = 0.01; }, {}, /estate weight/],
      ['another count of points', us => { us[1].pts = 30; }, {}, /points/],
      ['the guard off', us => { us[0].guard = { on: false, why: 'gapincome' }; }, {}, /guard off/],
      ["HSPA's k not 1 / s", us => { us[0].split = { s: 0.6, k: 2 }; }, {}, /HSPA's k 2/],
      ['a pensions\' share below a half', us => { us[0].split = { s: 0.4, k: 2.5 }; }, {}, /HSPA's k 2.5/],
      ['another configuration', us => { us[0].arms.K2.config = 'z'; }, {}, /K2: configuration z/],
      ['an array not one a path', us => { us[0].arms.APP.tax = new Float64Array(3); }, {}, /APP: tax not one a path/],
      ['another target', us => { us[0].target = 2; }, {}, /target 2/],
      ["another of arm A's picks", us => { us[0].label = 'y'; }, {}, /arm A's pick y/],
      ['the registration\'s paths not run', null, { paths: { a: 5, b: 5 } }, /4000 paths, not 5/],
      ['a unit with no registered paths', null, { paths: { a: 4000 } }, /b: no paths for it/],
      ['run under another prediction', null, { prediction: 'r' }, /not run under r/],
      ["a code not the panel's", null, { code: 'k' }, /not the code the panel was landed on/],
      ['no record of the solves', us => { delete us[0].record; }, {}, /a: no record of the solves/],
      ["HSPA's plan not its form's", us => { us[0].record.plan.hspa.basicBandLimit += 1; }, {}, /a HSPA's plan: basicBandLimit/],
      ["HSPA's no-earnings limit not design A's raised one", us => { us[0].record.plan.asBuilt.pensionNoEarningsLimit = 120000; }, {}, /a HSPA's plan: pensionNoEarningsLimit 100000, not 120000/],
      ["design A's no-earnings limit below twice one person's", us => { us[1].record.plan.asBuilt.pensionNoEarningsLimit = 90000; us[1].record.plan.hspa.pensionNoEarningsLimit = 90000; }, {}, /b HSPA's plan: design A's pensionNoEarningsLimit 90000, not at least 100000/],
      ["design A's entry not twice one person's", us => { us[0].record.plan.asBuilt.pensionAnnualAllowance = 120000; us[0].record.plan.hspa.pensionAnnualAllowance = 120000; }, {}, /a HSPA's plan: design A's pensionAnnualAllowance 120000, not 100000/],
      ["no record of design A's plan", us => { delete us[0].record.plan.asBuilt; }, {}, /a: no record of design A's plan/],
      ["HSPA's band for gains not k times one person's", us => { us[1].record.band.hspa = 37700; }, {}, /b: HSPA's band for gains 37700/],
      ['a launch log short of the units', null, { logs: logsOf({ short: true }) }, /1 launch logs for 2 units/],
      ["a unit's log without its done line", null, { logs: logsOf({ aDone: false }) }, /a: 1 launch logs name it, without its done line/]
    ];
    const missed = faults.filter(([, mod, o, re]) => !G(mod, o).some(x => re.test(x))).map(([n]) => n);
    cases.push([`the gate: every refusal on its planted fault (${faults.length})`, missed.join(', ') || 'all fire', 'all fire']);
    cases.push(['HSPA\'s plan from one person\'s: none for its form\'s entries; the cap at twice one person\'s refused; the allowance doubled (HSP\'s form) refused', `${hspaPlanProblems(person, hspa, k, asBuilt).length} ${hspaPlanProblems(person, { ...hspa, pclsMaxCap: 100000 }, k, asBuilt).map(x => x.split(' ')[0]).join(',')} ${hspaPlanProblems(person, { ...hspa, personalAllowance: 2 * 12570 }, k, asBuilt).map(x => x.split(' ')[0]).join(',')}`, '0 pclsMaxCap personalAllowance']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const PILOT = args.includes('--pilot'), dirArg = args.find(a => !a.startsWith('--'));
  const DIR = dirArg || join(HERE, 'results', PILOT ? 'household-hsp-pilot' : 'household-hsp-run');
  if (!existsSync(DIR)) { console.error(`reduce-household-hsp: no ${DIR}`); process.exit(2); }
  const { readHspPanel, PANEL } = await import('./household-hsp-panel.mjs');
  const panel = readHspPanel(), want = PILOT ? pilotUnits(panel) : panel;
  const logs = readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x));
  if (!PILOT) requireFairLogs(Object.fromEntries(logs.map(x => [x, readFileSync(join(DIR, x), 'utf8')])), REGISTRATION);
  const units = loadDir(DIR), paths = PILOT ? null : JSON.parse(readFileSync(PATHS_FILE, 'utf8')).paths;
  const P = gate(units, want, { seed: PILOT ? PILOT_SEED : SEED, prediction: PILOT ? null : REGISTRATION, audit: stampFilesHash(), paths, code: JSON.parse(readFileSync(PANEL, 'utf8')).code, logs: Object.fromEntries(logs.map(x => [x, readFileSync(join(DIR, x), 'utf8')])) });
  console.log(`STEP 8${PILOT ? ', THE PILOT (EXPLORATORY)' : ''}: THE READ (STEP8.md; ${PILOT ? 'no outcome' : REGISTRATION}): ${units.length} units from ${DIR}`);
  if (P.length) { console.log(`THE GATE: REFUSED\n  ${P.join('\n  ')}`); process.exit(3); }
  console.log(`THE GATE: fair; one code ${units[0].stamp.code}, audit ${units[0].stamp.audit}, seed ${units[0].seed}, ${units[0].pts} points; every unit's three arms at their configurations, the guard on, at its registered paths`);
  if (PILOT) process.exit(0);
  const R = rule(units), C = R.C;
  console.log('\nTHE RULE, HSPA against K2 (paired by path):');
  console.log(`  1. no unit flagged by D34's harm rule: ${R.flagged.length ? R.flagged.map(r => `${r.id} (${r.lost - r.saved} paths net against a threshold of ${r.j})`).join('; ') : 'none'}: ${R.parts.harm ? 'HOLDS' : 'FAILS'}`);
  console.log(`  2. pooled survival ${iv(C.pooled)} over ${units.length} units, by path, its lower end above 0: ${R.parts.gain ? 'HOLDS' : 'FAILS'} (beside, cells summed as if independent: ${iv(C.summed)})`);
  console.log(`  3. pooled spending on the paths both keep ${iv(C.kept.pooled, f4)}% of K2's, the units weighted equally, by path; its point not lower than -0.05%: ${R.parts.spend ? 'HOLDS' : 'FAILS'}`);
  console.log(`OUTCOME: ${R.outcome}${R.outcome === 'PASS' ? ': HSPA becomes the couples\' default, in the commit of the D-line naming this run, with the reviewer on the change of default (STEP8.md)' : ': today\'s default stays; to the maintainer'}`);
  console.log('\nBESIDE THE RULE, deciding nothing:');
  const low = C.rows.filter(r => r.tp < TP_BAR);
  console.log(`  comparisons whose 1-point rate at their realised discordance falls below ${TP_BAR} (D34 (4)): ${low.length ? low.map(r => `${r.id} ${r.tp.toFixed(3)}`).join(', ') : 'none'}`);
  for (const base of ['APP']) for (const arm of ['HSPA', 'K2']) {
    const X = compare(units, base, arm), fl = X.rows.filter(r => r.flag);
    console.log(`  ${arm} against ${base}: pooled survival ${iv(X.pooled)}; spending on the paths both keep ${iv(X.kept.pooled, f4)}%; flagged by D34 (for investigation, D34 (3)): ${fl.length ? fl.map(r => r.id).join(', ') : 'none'}`);
  }
  const capOf = u => u.caps[0] + u.caps[1], cap = units.map(u => cappedOf(capOf(u), u.arms.K2, u.arms.HSPA));
  console.log(`  the pot capped at the two people's estate caps, HSPA against K2: ${f3(mean(cap.map(c => c.pct)))}% the mean of the units' (${gbp(mean(cap.map(c => c.gbp)))} a path); the pot left, the mean a unit: APP ${gbp(mean(units.map(u => mean(u.arms.APP.pot))))}, K2 ${gbp(mean(units.map(u => mean(u.arms.K2.pot))))}, HSPA ${gbp(mean(units.map(u => mean(u.arms.HSPA.pot))))}`);
  const m1 = m1ByUnit(units), unmetM1 = m1.filter(x => x.unmet);
  console.log(`  M1 by unit (D116): the units where HSPA keeps more paths but spends less on the paths both keep beyond noise: ${unmetM1.length ? unmetM1.map(x => `${x.id} (net ${x.net >= 0 ? '+' : ''}${x.net} paths, spending ${f4(x.spend.d)}% se ${x.spend.se.toFixed(4)}, the capped pot ${f3(x.cap.pct)}% ${gbp(x.cap.gbp)} a path)`).join('; ') : 'none'}`);
  console.log(`  lifetime tax, the mean a unit: APP ${gbp(mean(units.map(u => mean(u.arms.APP.tax))))}, K2 ${gbp(mean(units.map(u => mean(u.arms.K2.tax))))}, HSPA ${gbp(mean(units.map(u => mean(u.arms.HSPA.tax))))}`);
  console.log(`  the rollout beside the engine on K2's first paths: ${sum(units.map(u => u.beside.engineOnly + u.beside.modelOnly))} paths differ of ${sum(units.map(u => u.beside.N))}`);
  console.log('  by unit (k; survival APP / K2 / HSPA; HSPA less K2; D34 against K2: net loss in paths and threshold; spending on the paths both keep and the capped pot, HSPA against K2; the forecasts K2 / HSPA):');
  const sv = A => 100 * sum(A.survived) / A.survived.length;
  for (const u of units) {
    const r = C.rows.find(x => x.id === u.id);
    const x = m1.find(y => y.id === u.id);
    console.log(`    ${u.id.padEnd(13)} k ${u.split.k.toFixed(3)}; ${sv(u.arms.APP).toFixed(2)}% / ${sv(u.arms.K2).toFixed(2)}% / ${sv(u.arms.HSPA).toFixed(2)}%; ${iv(r.ch)} (${r.cells.saved} saved, ${r.cells.lost} lost); net ${r.lost - r.saved} against ${r.j}${r.flag ? ' FLAGGED' : ''}; spending ${f4(x.spend.d)}% (se ${x.spend.se.toFixed(4)}), the capped pot ${f3(x.cap.pct)}%; ${(100 * u.arms.K2.forecast).toFixed(2)}% / ${(100 * u.arms.HSPA.forecast).toFixed(2)}%`);
  }
  console.log(`  the time a path (CPU, the mean a unit): APP ${(mean(units.map(u => u.arms.APP.cpuUs / u.N)) / 1e3).toFixed(1)} ms, K2 ${(mean(units.map(u => u.arms.K2.cpuUs / u.N)) / 1e3).toFixed(1)} ms, HSPA ${(mean(units.map(u => u.arms.HSPA.cpuUs / u.N)) / 1e3).toFixed(1)} ms; the solve, the median a unit: K2 ${median(units.map(u => u.arms.K2.solveSecs)).toFixed(0)} s, HSPA ${median(units.map(u => u.arms.HSPA.solveSecs)).toFixed(0)} s`);
}
