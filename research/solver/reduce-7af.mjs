/*
 * THE 7AF REDUCER: THE CANDIDATE BUNDLE AGAINST THE SHIPPING DEFAULT (predictions/diag-7af.md; PLAN.md 7af). Reads
 * results/diag7af/case*.txt (batch-7af.sh: audit-s126.mjs diag7af, one process a unit; 7aa's line format, parsed by
 * reduce-7aa.mjs parse) beside 7aa's records (results/diag7aa, read only through 7aa's own gate).
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7af and 7aa, and 7aa's own gate;
 *   - every registered unit once and done: CAND (READER/TS+J/W0.02) and SHIP (OFF/PRODUCT/W0.02) on every household,
 *     PRODR (READER/PRODUCT/W0.02) on every household with a bridge; nothing unregistered;
 *   - each unit's settings the registered ones (the product's settings, the estate weight 0.02, 30 points, 8,000 paths of
 *     seed 7002, lambda held, 5 return points, the final year exact, margin 0.001); the tier state and one move for every
 *     world on CAND alone; the bridge read the arm's; within a household every solve's ran line equal once the tier state
 *     and the bridge read are taken out, the scale, the cap and the risk-above decision equal;
 *   - IDENTITY: every unit 7aa also ran (S126, bridge 4 and S360 with the reader; S194 and S360 under off; at W0.02) has
 *     7aa's table, ran line, year-0 gap and run survival, and its trace's survived bits equal 7aa's path by path;
 *   - every trace: its count, seed, arm, stamp and survival are the log's.
 * THE ITEMS, by the registered rule:
 *   1. No material harm: CAND against SHIP on each household, paired on the same 8,000 paths - the exact one-sided McNemar
 *      p, Holm across the 16 households, the exact 95% interval against the household's margin (0.25 points where SHIP
 *      simulates 95% or more, 0.5 below): stats.mjs outcome(). HELD when every household reads no material harm;
 *      FALSIFIED when any reads harm; else INCONCLUSIVE. The unconditional interval (survivalChangeU, guarded) beside.
 *   2. Spending while both spend (the plan-auditor's BLOCKING 1, 28 Sep 23:23 UK: a failed path's years counted as 0 made a
 *      survival gain read as spending): on each path, the years of the spending years (any path of either arm spends in)
 *      in which BOTH arms spend; each arm's mean spend level over them; paths with no such year left out. CAND against
 *      SHIP as a relative change with its paired 95% interval (spendBoth, spendChange). HELD when every household's lower
 *      end is above -5% AND the panel mean's lower end above -1%; FALSIFIED when any household's upper end is below -5% OR
 *      the panel mean's upper end below -1%; else INCONCLUSIVE. The conditioning leaves out the years one arm has failed,
 *      so it compares the spending of survivors: a policy that survives by trimming shows its trims here, and one that
 *      survives longer is not credited with the extra years (they are item 1's). The old measure (a failed path's years
 *      0: spending and survival together) is reported beside.
 * Reported, not items: every unit's table, survival, gap and opening (O44), estate, years below target, tier changes;
 * the reader's part (PRODR against SHIP) and the tier state's part (CAND against PRODR) on each bridge household, exact
 * intervals; the whole score (reduce-7aa.mjs wholeLeg at 0.05) of CAND against SHIP; and, where a household reads harm,
 * the registered split: the reader carries it where PRODR against SHIP loses the margin or more (point), the tier state
 * where CAND against PRODR does, both where both; on a household without a bridge the tier state by construction.
 *   node research/solver/reduce-7af.mjs [dir7af] [dir7aa] > research/solver/results-7af.txt
 *   node research/solver/reduce-7af.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { survivalChange, survivalChangeU, mcnemarHarmP, holm, outcome, marginFor, zFor } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7af.md';
export const { field, LAMBDA, LEVELS } = A;
export const N = 8000, SEED = '7002', PTS = '30', W = '0.02', ALPHA = 0.05, SIM_TOL = 5e-5 + 1e-9, SPEND_H = -0.05, SPEND_M = -0.01;
// the panel: 7e's households in its registered order, the first 12 not reused, then the four 7aa ran; each with its bridge years
export const PANEL = [['share 0.50', 2], ['share 0.70', 2], ['share 0.78', 2], ['share 0.90', 2], ['share 0.95', 2], ['bridge 0', 0], ['bridge 1', 1], ['bridge 6', 6],
  ['wealth x0.5', 2], ['wealth x2', 2], ['S120', 2], ['S122', 2], ['S126', 2], ['bridge 4', 4], ['S360', 8], ['S194', 0]];
export const CAND = ['READER', `TS+J/W${W}`], SHIP = ['OFF', `PRODUCT/W${W}`], PRODR = ['READER', `PRODUCT/W${W}`];
export const UNITS = [...PANEL.map(([id]) => [id, ...CAND]), ...PANEL.map(([id]) => [id, ...SHIP]), ...PANEL.filter(([, b]) => b > 0).map(([id]) => [id, ...PRODR])];
export const hasBridge = id => { const p = PANEL.find(x => x[0] === id); return !!p && p[1] > 0; };
export const parse = A.parse;

/* 7af's gate. `refA(id, arm, label)` is 7aa's parsed unit where 7aa ran it, else null. */
export function gate(units, refA, n = N, pts = PTS) {
  const bad = [];
  for (const [id, arm, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.label === l).length; if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }
  const strip = s => (s || '').replace(/ tierState \S+/, '').replace(/ bridgeRead \S+/, '');
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const ts = u.label.startsWith('TS+J');
    if (u.table === undefined) bad.push(`${tag}: no solve line`);
    if (!u.ran) bad.push(`${tag}: no ran line`);
    else {
      const want = { mix: '3', pts, seed: SEED, paths: String(n), grid: `total${pts}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', quad: '5', finalIntegral: 'true', bequestWeight: W, bridgeRead: u.arm === 'READER' ? 'reader' : 'false' };
      for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
      if (!!field(u.ran, 'tierState') !== ts) bad.push(`${tag}: ran tierState ${field(u.ran, 'tierState')}`);
      for (const k of ['holdTier', 'bridgeStep', 'readerRef', 'switchMargin']) if (field(u.ran, k) !== null) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}`);
    }
    if (!u.gap) bad.push(`${tag}: no year-0 gap line`);
    if (!u.joint) bad.push(`${tag}: no joint line`);
    else {
      if (u.joint.joint !== ts) bad.push(`${tag}: ran jointWorlds ${u.joint.joint}`);
      if (u.joint.margin !== '0.001') bad.push(`${tag}: solved with switch margin ${u.joint.margin}`);
      // the whole score reads the pot as the estate: a pension death charge would make it gross, not net (reduce-7aa.mjs's guard; the deep review of 29 Sep 08:56 UK)
      if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax}`);
      if (u.joint.tier !== 'own') bad.push(`${tag}: plan tier ${u.joint.tier}`);
    }
    if (u.worlds.length) bad.push(`${tag}: world lines, not registered`);
    if (!u.run) bad.push(`${tag}: no run line`);
    if (!u.done) bad.push(`${tag}: no done line`);
    // within a household: the same settings but the tier state and the bridge read; the same scale, cap and risk-above decision
    const ref = units.find(v => v.id === u.id && v.ran), refJ = units.find(v => v.id === u.id && v.joint);
    if (u.ran && ref && strip(u.ran) !== strip(ref.ran)) bad.push(`${tag}: differs from another solve of the household beyond the tier state and the bridge read`);
    if (u.joint && refJ && (u.joint.scale !== refJ.joint.scale || u.joint.cap !== refJ.joint.cap || u.joint.decided !== refJ.joint.decided)) bad.push(`${tag}: scale, cap or risk-above decision differs within the household`);
    // identity with 7aa where 7aa ran the unit
    const r = refA(u.id, u.arm, u.label);
    if (r) {
      if (u.table !== r.table) bad.push(`${tag}: its table ${u.table}, 7aa's ${r.table}`);
      if (u.ran !== r.ran) bad.push(`${tag}: its ran line is not 7aa's`);
      if (!u.gap || !r.gap || u.gap.gap !== r.gap.gap || u.gap.open1e3 !== r.gap.open1e3 || u.gap.open0 !== r.gap.open0) bad.push(`${tag}: its year-0 gap is not 7aa's`);
      if (!u.run || !r.run || Math.abs(u.run.sim - r.run.sim) > 1e-9) bad.push(`${tag}: its run's survival ${u.run && u.run.sim} is not 7aa's ${r.run && r.run.sim}`);
    }
  }
  return bad;
}
export const traceName = A.traceName;
export const traceAgrees = (j, ST, arm, l, sim, n = N) => !!(j && ST && j.stamp && j.N === n && String(j.seed) === SEED && j.arm === `${arm}/${l}` && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);
export const sameBits = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => x === b[i]);

/* spending (item 2 reads it while both arms spend): the mean over paths of each path's mean spend level (0 to 1.1) over the spending years `sy` */
export function spendPaths(T, sy) {
  const n = sy.reduce((t, x) => t + (x ? 1 : 0), 0), out = new Float64Array(T.N);
  if (!n) return out;
  for (let i = 0; i < T.N; i++) { let s = 0; for (let t = 0; t < T.Y; t++) if (sy[t]) s += T.level[i * T.Y + t] / 100; out[i] = s / n; }
  return out;
}
export const spendYears = (X, Y) => Array.from({ length: X.Y }, (_, t) => { for (const T of [X, Y]) for (let i = 0; i < T.N; i++) if (T.level[i * T.Y + t] > 0) return true; return false; });
/* spending while both spend: on each path, the spending years `sy` in which both A and B spend (level above 0); each arm's
   mean level over them; the paths with none left out. Returns the kept paths' two arrays and their indices. */
export function spendBoth(X, Y, sy) {
  const a = [], b = [], idx = [];
  for (let i = 0; i < X.N; i++) {
    let sa = 0, sb = 0, n = 0;
    for (let t = 0; t < X.Y; t++) { if (!sy[t]) continue; const la = X.level[i * X.Y + t], lb = Y.level[i * Y.Y + t]; if (la > 0 && lb > 0) { sa += la / 100; sb += lb / 100; n++; } }
    if (n) { a.push(sa / n); b.push(sb / n); idx.push(i); }
  }
  return { a: Float64Array.from(a), b: Float64Array.from(b), idx };
}
/* the relative change in spending of B against A on the same paths, with its paired 95% interval (delta method: the mean
   difference over A's mean) */
export function spendChange(A0, B0) {
  const n = A0.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += A0[i]; mb += B0[i]; } ma /= n; mb /= n;
  let v = 0; for (let i = 0; i < n; i++) v += (B0[i] - A0[i] - (mb - ma)) ** 2; const se = Math.sqrt(v / (n - 1) / n) / ma;
  const d = (mb - ma) / ma, z = zFor(ALPHA);
  return { a: ma, b: mb, d, se, lo: d - z * se, hi: d + z * se };
}

/*
 * THE ITEMS. `K(id, b, a)` the paired cells of arm b against arm a (cells(a, b): saved = b survives where a fails); `SIM(id,
 * arm)` a run's survival; `SP(id)` CAND's spending change against SHIP (spendChange) and its per-path differences.
 */
const tri = (yes, no) => (yes ? 'HELD' : no ? 'FALSIFIED' : 'INCONCLUSIVE');
export function items(K, SIM, SP) {
  const out = [];
  // 1. no material harm, Holm across the panel
  { const legs = PANEL.map(([id]) => { const k = K(id, 'CAND', 'SHIP'); return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: marginFor(SIM(id, 'SHIP')) }; });
    const adj = holm(legs.map(l => l.p));
    legs.forEach((l, i) => { l.pHolm = adj[i]; const o = outcome({ b: l.k.lost, c: l.k.saved, N: l.k.N, margin: l.margin, pHolm: l.pHolm, level: ALPHA }); l.iv = o; l.o = o.outcome; });
    out.push({ n: 1, text: 'no material harm: the candidate (READER/TS+J) against the shipping default (OFF/PRODUCT) on every household, the exact rule with Holm across the 16 (FALSIFIED: harm on any)', legs,
      outcome: tri(legs.every(l => l.o === 'no material harm'), legs.some(l => l.o === 'harm')) }); }
  // 2. spending while both arms spend
  { const legs = PANEL.map(([id]) => ({ id, ...SP(id).change })), diffs = PANEL.map(([id]) => SP(id));
    // the panel mean of the relative changes: the households share their paths, so its se is taken from the per-path mean
    // of the households' relative differences (each household's rel scaled so its mean over all paths is its change)
    const nP = diffs[0].rel.length; const m = new Float64Array(nP);
    for (const x of diffs) for (let i = 0; i < nP; i++) m[i] += x.rel[i] / diffs.length;
    let mu = 0; for (let i = 0; i < nP; i++) mu += m[i]; mu /= nP; let v = 0; for (let i = 0; i < nP; i++) v += (m[i] - mu) ** 2;
    const se = Math.sqrt(v / (nP - 1) / nP), z = zFor(ALPHA), mean = { d: mu, lo: mu - z * se, hi: mu + z * se };
    out.push({ n: 2, text: 'spending while both arms spend: no household\'s spending more than 5% lower and the panel mean not more than 1% lower, each by its 95% interval (FALSIFIED: a household\'s upper end below -5% or the mean\'s below -1%)', legs, mean,
      outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M, legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M) }); }
  return out;
}
/* the registered split of a household's harm: the reader carries it where PRODR against SHIP loses the margin or more
   (point), the tier state where CAND against PRODR does; without a bridge, the tier state by construction */
export function split(id, K, margin) {
  if (!hasBridge(id)) return 'the tier state (no bridge: the reader reads as off)';
  const r = K(id, 'PRODR', 'SHIP'), t = K(id, 'CAND', 'PRODR'), lr = 100 * (r.lost - r.saved) / r.N, lt = 100 * (t.lost - t.saved) / t.N;
  const who = [lr >= margin ? 'the reader' : null, lt >= margin ? 'the tier state' : null].filter(Boolean);
  return who.length ? who.join(' and ') : 'neither alone (each part below the margin)';
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, arm, l, o = {}) => `mix 3 pts ${o.pts || 30} seed ${SEED} paths ${o.n || N} grid total${o.pts || 30}x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad 5${l.startsWith('TS+J') ? ' tierState 0/0,1/1,2/2' : ''} bequestWeight ${o.w || W} finalIntegral true bridgeRead ${arm === 'READER' ? 'reader' : 'false'}`;
  const unitText = (id, arm, l, o = {}) => {
    const p = ''.padEnd(16), L = `${arm}/${l}`, ts = l.startsWith('TS+J');
    const lines = [`${id.padEnd(16)} case | unit ${L} | lambda ${o.lambda || LAMBDA} tier own riskAbove auto mix 3`,
      `${p} solve ${L}: table ${o.table || '99.5000'} secs 1`, `${p} ran ${L}: ${o.ran || ranOf(id, arm, l, o)}`, `${p} gap ${L}: ${o.gap || '1.0000e-3'} opening 2,2`,
      `${p} joint ${L}: ${o.joint !== undefined ? o.joint : ts} switchMargin ${o.margin || '0.001'} scale ${o.scale || 950000} cap 3800000 deathTax ${o.deathTax || 0} tier own riskAbove ${o.decided || 'off:_no_tier_above_the_plan'}`,
      ...(o.world ? [`${p} world ${L} 0 z -1.7321 weight 0.1667: table 99.0 sim 98.0 paths 1000`] : []),
      `${p} run ${L}: sim ${o.sim || '99.5000'} below 0.10 tier-below 1.00 changes 0.500 estate 100000 secs 1`];
    if (!o.noDone) lines.push(`${p} done ${L}`);
    return lines.join('\n');
  };
  const all = (o = {}, who = () => true) => UNITS.map(([id, a, l]) => unitText(id, a, l, who(id, a, l) ? o : {})).join('\n');
  const noRef = () => null;
  const refused = t => String(gate(parse(t), noRef).length > 0);
  const bent = (id, arm, l, o) => refused(all(o, (i, a, lb) => i === id && a === arm && lb === l));
  cases.push(['a log parsed and gated: every registered unit, the gate passes', `${parse(all()).length} ${gate(parse(all()), noRef).length}`, `${UNITS.length} 0`]);
  cases.push(['the registered units: 16 candidates, 16 shipping defaults, 14 products with the reader', `${UNITS.filter(u => u[2].startsWith('TS+J')).length} ${UNITS.filter(u => u[1] === 'OFF').length} ${UNITS.filter(u => u[1] === 'READER' && u[2].startsWith('PRODUCT')).length}`, '16 16 14']);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, a, l]) => unitText(id, a, l)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(all() + '\n' + unitText('S122', ...SHIP)), 'true']);
  cases.push(['the gate refuses an unregistered unit (PRODR on bridge 0, no bridge)', refused(all() + '\n' + unitText('bridge 0', ...PRODR)), 'true']);
  cases.push(['the gate refuses another lambda on the unit line', bent('S120', ...CAND, { lambda: '0.03' }), 'true']);
  // a fault every unit of a household carries (the within-household comparison cannot see it): the ran line's own fields must
  const hh = (id, o) => refused(all(o, i => i === id));
  cases.push(['the gate refuses another estate weight (on every unit of a household)', hh('share 0.70', { w: '0' }), 'true']);
  cases.push(['the gate refuses other paths (on every unit of a household)', hh('S360', { n: 4000 }), 'true']);
  cases.push(['the gate refuses other points (on every unit of a household)', hh('wealth x2', { pts: 16 }), 'true']);
  cases.push(['the gate refuses a points field alone off the registered one (the grid name unchanged)', refused(UNITS.map(([id, a, l]) => unitText(id, a, l, id === 'S120' ? { ran: ranOf(id, a, l).replace('pts 30 ', 'pts 16 ') } : {})).join('\n')), 'true']);
  cases.push(['the gate refuses a switchMargin on every unit of a household', refused(UNITS.map(([id, a, l]) => unitText(id, a, l, id === 'S122' ? { ran: `${ranOf(id, a, l)} switchMargin 0.001` } : {})).join('\n')), 'true']);
  cases.push(['the gate refuses a missing solve line', refused(all().replace(`solve READER/TS+J/W0.02: table 99.5000 secs 1`, `slve READER/TS+J/W0.02: table 99.5000 secs 1`)), 'true']);
  cases.push(['the gate refuses the tier state on SHIP', bent('bridge 6', ...SHIP, { ran: ranOf('bridge 6', 'OFF', 'TS+J/W0.02') }), 'true']);
  cases.push(['the gate refuses the reader on SHIP', bent('bridge 1', ...SHIP, { ran: ranOf('bridge 1', 'READER', 'PRODUCT/W0.02') }), 'true']);
  cases.push(['the gate refuses CAND solved per world', bent('S126', ...CAND, { joint: false }), 'true']);
  cases.push(['the gate refuses a solve at margin 0', bent('S194', ...CAND, { margin: '0' }), 'true']);
  cases.push(['the gate refuses a switchMargin on the ran line', bent('S194', ...SHIP, { ran: `${ranOf('S194', 'OFF', 'PRODUCT/W0.02')} switchMargin 0` }), 'true']);
  cases.push(['the gate refuses a settings difference within a household (minPot)', bent('share 0.90', ...PRODR, { ran: ranOf('share 0.90', 'READER', 'PRODUCT/W0.02').replace('minPot 29000', 'minPot 30000') }), 'true']);
  cases.push(['the gate refuses a pension death charge (on every unit of a household)', refused(all({ deathTax: 0.45 }, i => i === 'S122')), 'true']);
  cases.push(['the gate refuses another scale within a household', bent('S120', ...SHIP, { scale: 950001 }), 'true']);
  cases.push(['the gate refuses another risk-above decision within a household', bent('S122', ...CAND, { decided: 'on:_tier_above' }), 'true']);
  cases.push(['the gate takes a risk-above decision that differs between households', refused(all({ decided: 'on:_tier_above' }, i => i === 'S122')), 'false']);
  cases.push(['the gate refuses a world line (not registered)', bent('bridge 4', ...CAND, { world: true }), 'true']);
  cases.push(['the gate refuses a missing done line', bent('share 0.50', ...SHIP, { noDone: true }), 'true']);
  // identity with 7aa
  { const U = parse(all()), ref = (id, arm, l) => (id === 'S126' && arm === 'READER' && l === CAND[1] ? { table: '99.5000', ran: ranOf('S126', 'READER', CAND[1]), gap: { gap: '1.0000e-3', open1e3: 2, open0: 2 }, run: { sim: 99.5 } } : null);
    cases.push(['the gate takes a unit equal to 7aa\'s', String(gate(U, ref).length), '0']);
    cases.push(['the gate refuses a unit whose table is not 7aa\'s', String(gate(U, (i, a, l) => { const r = ref(i, a, l); return r ? { ...r, table: '99.5001' } : null; }).length > 0), 'true']);
    cases.push(['the gate refuses a unit whose run is not 7aa\'s', String(gate(U, (i, a, l) => { const r = ref(i, a, l); return r ? { ...r, run: { sim: 99.4 } } : null; }).length > 0), 'true']);
    cases.push(['the gate refuses a unit whose gap is not 7aa\'s', String(gate(U, (i, a, l) => { const r = ref(i, a, l); return r ? { ...r, gap: { gap: '1.0001e-3', open1e3: 2, open0: 2 } } : null; }).length > 0), 'true']);
    cases.push(['the gate refuses a unit whose ran line is not 7aa\'s', String(gate(U, (i, a, l) => { const r = ref(i, a, l); return r ? { ...r, ran: r.ran.replace('quad 5', 'quad 5 x') } : null; }).length > 0), 'true']); }
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, t = sim => ({ stamp: ST, N, seed: 7002, arm: 'READER/TS+J/W0.02', sim });
    cases.push(['a trace agrees with the log to four decimals, and not beyond', `${traceAgrees(t(99.30004), ST, 'READER', 'TS+J/W0.02', 99.3)} ${traceAgrees(t(99.3001), ST, 'READER', 'TS+J/W0.02', 99.3)} ${traceAgrees(t(99.3), ST, 'OFF', 'TS+J/W0.02', 99.3)}`, 'true false false']); }
  // the identity against 7aa's trace, on files: one unit's 7af and 7aa traces written to a scratch folder, equal then one bit
  // flipped (rule 6: the check must fail on a planted fault)
  { const dir7af = mkdtempSync(join(tmpdir(), 'p7af-')), dir7aa = mkdtempSync(join(tmpdir(), 'p7aa-')), ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, STA = { code: 'c0', audit: 'a0', prediction: 'p0', sha: 's0' };
    const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64'), surv = Uint8Array.from({ length: N }, (_, i) => (i % 3 ? 1 : 0)), sim = 100 * surv.reduce((t, x) => t + x, 0) / N;
    const tr = (st, sv) => ({ id: 'S126', arm: 'READER/TS+J/W0.02', stamp: st, N, Y: 1, seed: 7002, sim, survived: b64(sv), level: b64(new Uint8Array(N)), tier: b64(new Uint8Array(N)), wealth: b64(new Float32Array(N)), taxPaid: b64(new Float32Array(N)), failYear: b64(new Int16Array(N).fill(-1)) });
    const write = (d, st, sv) => writeFileSync(join(d, traceName('S126', 'READER', 'TS+J/W0.02')), gzipSync(JSON.stringify(tr(st, sv))));
    const u = [{ id: 'S126', arm: 'READER', label: 'TS+J/W0.02', run: { sim } }], ref = () => ({ run: { sim } });
    const run1 = () => { const bad = []; loadTraces(u, dir7af, ST, bad, dir7aa, STA, ref); return bad.length; };
    write(dir7af, ST, surv); write(dir7aa, STA, surv);
    const same = run1();
    const flip = Uint8Array.from(surv); flip[0] = 1 - flip[0]; flip[1] = 1 - flip[1]; write(dir7aa, STA, flip);
    const off = run1();
    rmSync(dir7af, { recursive: true, force: true }); rmSync(dir7aa, { recursive: true, force: true });
    cases.push(['the identity with 7aa\'s trace, on files: equal bits pass, two bits swapped (the survival unchanged) refused', `${same} ${off > 0}`, '0 true']); }
  cases.push(['bits compared path by path', `${sameBits(Uint8Array.from([1, 0, 1]), Uint8Array.from([1, 0, 1]))} ${sameBits(Uint8Array.from([1, 0, 1]), Uint8Array.from([1, 1, 1]))} ${sameBits(Uint8Array.from([1, 0]), Uint8Array.from([1, 0, 1]))}`, 'true false false']);
  // spending
  { const T = { N: 2, Y: 4, level: Uint8Array.from([100, 100, 0, 0, 100, 50, 0, 0]) }, T2 = { N: 2, Y: 4, level: Uint8Array.from([100, 110, 50, 0, 0, 0, 0, 0]) };
    const sy = spendYears(T, T2);
    cases.push(['spending years: those any path of either arm spends in (year 2 the second arm\'s alone)', sy.join(','), 'true,true,true,false']);
    cases.push(['spending per path: the mean level over the spending years, a failed path\'s years 0', Array.from(spendPaths(T, sy)).map(x => x.toFixed(3)).join(','), '0.667,0.500']);
    const c = spendChange(Float64Array.from([1, 1, 1, 1]), Float64Array.from([0.9, 1.0, 0.9, 1.0]));
    { const X = { N: 3, Y: 3, level: Uint8Array.from([100, 0, 0, 100, 100, 100, 0, 0, 0]) }, Y = { N: 3, Y: 3, level: Uint8Array.from([100, 100, 100, 98, 98, 98, 100, 100, 100]) }, sy3 = spendYears(X, Y);
      const old = spendChange(spendPaths(X, sy3), spendPaths(Y, sy3)), nb = spendBoth(X, Y, sy3), neu = spendChange(nb.a, nb.b);
      cases.push(['survival is not spending: paths SHIP loses (after year 0; from the start) read +123.5% on the old measure, -1.0% while both spend, the path with no year both spend left out', `${(100 * old.d).toFixed(1)} ${(100 * neu.d).toFixed(1)} ${nb.idx.join(',')}`, '123.5 -1.0 0,1']); }
    cases.push(['a relative spending change with its paired se', `${c.d.toFixed(3)} ${c.se.toFixed(3)}`, '-0.050 0.029']); }
  // the items on planted stories
  const mkK = spec => (id, b, a) => { const [saved, lost] = spec[`${id}|${b}|${a}`] || [0, 0]; return { saved, lost, a: N - saved - lost, d: 0, N }; };
  const SIM = () => 99;
  const mkSP = (spec, noise = {}) => id => { const d = spec[id] !== undefined ? spec[id] : 0, e = noise[id] || 0.002, n = 400, rel = Float64Array.from({ length: n }, (_, i) => d + (i % 2 ? e : -e)); const ch = spendChange(Float64Array.from({ length: n }, () => 1), Float64Array.from({ length: n }, (_, i) => 1 + rel[i])); return { change: ch, rel }; };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  cases.push(['nothing differs: 1 HELD, 2 HELD', outs(items(mkK({}), SIM, mkSP({}))), '1 HELD, 2 HELD']);
  cases.push(['a clear loss on one household (0 saved, 60 lost of 8000, margin 0.25): 1 FALSIFIED', items(mkK({ 'S122|CAND|SHIP': [0, 60] }), SIM, mkSP({}))[0].outcome, 'FALSIFIED']);
  cases.push(['a loss inside the margin whose interval reaches past it (5 saved, 22 lost: -0.21 points, to -0.29): 1 INCONCLUSIVE', items(mkK({ 'S122|CAND|SHIP': [5, 22] }), SIM, mkSP({}))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['all differing paths lost inside the margin (0 saved, 15 lost): the exact interval ends at the point, no material harm (the conditional form\'s known limit; the unconditional interval reported beside)', items(mkK({ 'S122|CAND|SHIP': [0, 15] }), SIM, mkSP({}))[0].outcome, 'HELD']);
  cases.push(['a gain everywhere is no harm: 1 HELD', items(mkK(Object.fromEntries(PANEL.map(([id]) => [`${id}|CAND|SHIP`, [40, 0]]))), SIM, mkSP({}))[0].outcome, 'HELD']);
  cases.push(['the margin is the household\'s: 0 saved, 30 lost (-0.375) reads harm at 0.25 (SHIP at 99%) and no material harm at 0.5 (SHIP at 90%)', `${items(mkK({ 'S122|CAND|SHIP': [0, 30] }), () => 99, mkSP({}))[0].legs.find(l => l.id === 'S122').o} ${items(mkK({ 'S122|CAND|SHIP': [0, 30] }), () => 90, mkSP({}))[0].legs.find(l => l.id === 'S122').o}`, 'harm no material harm']);
  cases.push(['Holm across 16: a p that clears 0.05 alone but not 0.05/16 (0 saved, 7 lost of 8000 at 0.25) is not harm', items(mkK({ 'S122|CAND|SHIP': [0, 7] }), SIM, mkSP({}))[0].legs.find(l => l.id === 'S122').o === 'harm' ? 'harm' : 'not harm', 'not harm']);
  cases.push(['Holm matters: 60 saved, 82 lost (-0.275, p 0.039 alone) is harm alone but not after Holm across 16: 1 INCONCLUSIVE', items(mkK({ 'S122|CAND|SHIP': [60, 82] }), SIM, mkSP({}))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 reads CAND against SHIP, not PRODR: a loss against PRODR alone is HELD', items(mkK({ 'S122|CAND|PRODR': [0, 80] }), SIM, mkSP({}))[0].outcome, 'HELD']);
  cases.push(['spending 6% lower on one household: 2 FALSIFIED', items(mkK({}), SIM, mkSP({ S120: -0.06 }))[1].outcome, 'FALSIFIED']);
  cases.push(['spending 4% lower on one household (the mean -0.25%): 2 HELD', items(mkK({}), SIM, mkSP({ S120: -0.04 }))[1].outcome, 'HELD']);
  cases.push(['spending 1.5% lower on every household: 2 FALSIFIED by the mean', items(mkK({}), SIM, mkSP(Object.fromEntries(PANEL.map(([id]) => [id, -0.015]))))[1].outcome, 'FALSIFIED']);
  cases.push(['spending 1% lower on every household (the mean at the line): 2 INCONCLUSIVE', items(mkK({}), SIM, mkSP(Object.fromEntries(PANEL.map(([id]) => [id, -0.01]))))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 reads the interval, not the point: 4.9% lower with a wide interval (to about -6.9%) is INCONCLUSIVE', items(mkK({}), SIM, mkSP({ S120: -0.049 }, { S120: 0.2 }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['one household\'s survival gain cannot carry the mean: S360 unchanged while both spend and 2% lower elsewhere: 2 FALSIFIED', items(mkK({}), SIM, mkSP(Object.fromEntries(PANEL.map(([id]) => [id, id === 'S360' ? 0 : -0.02]))))[1].outcome, 'FALSIFIED']);
  cases.push(['spending higher is never a fault: +6% on one household: 2 HELD', items(mkK({}), SIM, mkSP({ S120: 0.06 }))[1].outcome, 'HELD']);
  // the split
  cases.push(['the split: a loss of the margin in PRODR against SHIP is the reader\'s', split('S126', mkK({ 'S126|PRODR|SHIP': [0, 30], 'S126|CAND|PRODR': [0, 0] }), 0.25), 'the reader']);
  cases.push(['the split: a loss of the margin in CAND against PRODR is the tier state\'s', split('S126', mkK({ 'S126|PRODR|SHIP': [0, 0], 'S126|CAND|PRODR': [0, 30] }), 0.25), 'the tier state']);
  cases.push(['the split: both', split('bridge 4', mkK({ 'bridge 4|PRODR|SHIP': [0, 30], 'bridge 4|CAND|PRODR': [0, 30] }), 0.25), 'the reader and the tier state']);
  cases.push(['the split: without a bridge, the tier state', split('S194', mkK({}), 0.25), 'the tier state (no bridge: the reader reads as off)']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());

/* THE TRACES: every unit's trace, checked against the log, and against 7aa's where 7aa ran the unit (the survived bits);
   `bad` gains every refusal. Returns the decoded traces by `${id}|${arm}|${label}`. */
export function loadTraces(units, DIR, ST, bad, DIRA, STA, refA, n = N) {
  const TR = {};
  for (const u of units) {
    const f = join(DIR, traceName(u.id, u.arm, u.label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const t = readTrace(f);
    if (!traceAgrees(t, ST, u.arm, u.label, u.run.sim, n)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const T = decode(t);
    if (refA(u.id, u.arm, u.label)) {
      const fa = join(DIRA, A.traceName(u.id, u.arm, u.label));
      if (!existsSync(fa)) bad.push(`no 7aa trace ${fa}`);
      // 7aa's trace as 7aa's reducer reads it (traceAgrees), at this run's path count: 7aa's helper holds 8,000 fixed, so the
      // same checks are made here with n (the preflight's 20)
      else { const ta = readTrace(fa), ra = refA(u.id, u.arm, u.label); if (!traceAgrees(ta, STA, u.arm, u.label, ra && ra.run ? ra.run.sim : NaN, n)) bad.push(`${fa}: 7aa's trace not as 7aa's reducer reads it`); else if (!sameBits(T.survived, decode(ta).survived)) bad.push(`${f}: its survival is not 7aa's, path by path`); }
    }
    TR[`${u.id}|${u.arm}|${u.label}`] = T;
  }
  return TR;
}
const ARMS = { CAND, SHIP, PRODR };
/* THE READING, after every gate has passed (the preflight runs it over its own tiny logs) */
export function reading(units, TR, out = console.log, n = N) {
  const U = (id, k) => units.find(u => u.id === id && u.arm === ARMS[k][0] && u.label === ARMS[k][1]);
  const T = (id, k) => TR[`${id}|${ARMS[k][0]}|${ARMS[k][1]}`];
  const K = (id, b, a) => cells(T(id, a).survived, T(id, b).survived);
  const SIM = (id, k) => U(id, k).run.sim;
  // item 2's measure (spending while both spend) and, reported beside, the old one (a failed path's years 0)
  const SP = id => { const X = T(id, 'SHIP'), Y = T(id, 'CAND'), sy = spendYears(X, Y), sb = spendBoth(X, Y, sy), change = spendChange(sb.a, sb.b), N0 = X.N, rel = new Float64Array(N0), k = sb.a.length; let ma = 0; for (const x of sb.a) ma += x; ma /= k; sb.idx.forEach((pi, j) => { rel[pi] = (sb.b[j] - sb.a[j]) / ma * N0 / k; }); return { change, rel, kept: k, old: spendChange(spendPaths(X, sy), spendPaths(Y, sy)) }; };
  out(`7AF: THE CANDIDATE BUNDLE (THE BRIDGE READER WITH THE JOINT TIER STATE) AGAINST THE SHIPPING DEFAULT (NO BRIDGE READ, THE PRODUCT'S TABLES) (predictions/diag-7af.md; ${n} paths of seed ${SEED}, the estate weight ${W}; the fair-test gates passed: the stamps, 7aa's gate, 7af's gate - every unit 7aa also ran equal to 7aa's, its trace path by path - and every trace)\n`);
  out('EVERY UNIT: the table, the simulated survival, the year-0 gap and opening (O44), years below target, tier changes and estate');
  for (const [id] of PANEL) for (const k of ['SHIP', 'PRODR', 'CAND']) { const u = U(id, k); if (!u) continue; out(`  ${`${id} ${k}`.padEnd(20)} table ${u.table} sim ${u.run.sim.toFixed(2)} gap ${u.gap.gap} (opening ${u.gap.open1e3},${u.gap.open0}) below ${u.run.below.toFixed(2)} changes ${u.run.changes.toFixed(3)} estate ${u.run.estate} | risk above ${u.joint.decided}`); }
  out('\nTHE PARTS on each bridge household (exact 95% intervals, paired): the reader (PRODR against SHIP) and the tier state (CAND against PRODR)');
  for (const [id] of PANEL) { if (!hasBridge(id)) continue; const r = K(id, 'PRODR', 'SHIP'), t = K(id, 'CAND', 'PRODR'), ir = survivalChange(r.lost, r.saved, r.N, ALPHA), it = survivalChange(t.lost, t.saved, t.N, ALPHA); out(`  ${id.padEnd(14)} reader ${r.saved}/${r.lost} ${f3(ir.d)} (${ir.lo.toFixed(3)} to ${ir.hi.toFixed(3)}) | tier state ${t.saved}/${t.lost} ${f3(it.d)} (${it.lo.toFixed(3)} to ${it.hi.toFixed(3)})`); }
  out('\nTHE WHOLE SCORE, CAND against SHIP (reduce-7aa.mjs wholeLeg at 0.05; the estate weight the runs\')');
  for (const [id] of PANEL) { const u = U(id, 'CAND'), X = T(id, 'SHIP'), Y = T(id, 'CAND'); const cfg = { lambda: Number(field(u.ran, 'lambda')), floor: Math.min(...field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(W), spendYears: spendYears(X, Y) }; const w = A.wholeLeg(X, Y, cfg, ALPHA); out(`  ${id.padEnd(14)} ${f3(w.d)} (${w.lo.toFixed(3)} to ${w.hi.toFixed(3)}; survival part ${f3(w.sd)}, the rest ${f3(w.rest)})`); }
  const it = items(K, SIM, SP);
  out('\nTHE ITEMS (each read by its registered rule)');
  for (const x of it) {
    out(`${x.n}. ${x.text}: ${x.outcome}`);
    if (x.n === 1) for (const l of x.legs) { const u = guardedU(l.k); out(`     ${l.id.padEnd(14)} ${l.k.saved} saved/${l.k.lost} lost of ${l.k.N}  p ${l.p.toExponential(1)}  Holm ${l.pHolm.toExponential(1)}  change ${f3(l.iv.d)} (${l.iv.lo.toFixed(3)} to ${l.iv.hi.toFixed(3)}; unconditional ${u.lo.toFixed(3)} to ${u.hi.toFixed(3)})  margin ${l.margin}  -> ${l.o}${l.o === 'harm' ? `; carried by ${split(l.id, K, l.margin)}` : ''}`); }
    if (x.n === 2) { for (const l of x.legs) { const o = SP(l.id); out(`     ${l.id.padEnd(14)} while both spend (${o.kept} paths) ${l.a.toFixed(4)} -> ${l.b.toFixed(4)}: ${f3(100 * l.d)}% (${(100 * l.lo).toFixed(3)} to ${(100 * l.hi).toFixed(3)}) | reported, a failed path's years 0: ${f3(100 * o.old.d)}%`); } out(`     the panel mean ${f3(100 * x.mean.d)}% (${(100 * x.mean.lo).toFixed(3)} to ${(100 * x.mean.hi).toFixed(3)})`); }
  }
  out(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
  return it;
}
const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7af'), DIRA = args[1] || join(HERE, 'results', 'diag7aa');
  const logsA = logsOf(DIRA), unitsA = Object.values(logsA).flatMap(A.parse);
  requireFairLogs(logsA, A.PRED);
  { const badA = A.gate(unitsA); if (badA.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${badA.join('\n  ')}`); process.exit(1); } }
  const refA = (id, arm, l) => unitsA.find(u => u.id === id && u.arm === arm && u.label === l) || null;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, refA), ST = stampOf(logs);
  const TR = bad.length ? {} : loadTraces(units, DIR, ST, bad, DIRA, stampOf(logsA), refA);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  reading(units, TR);
}
