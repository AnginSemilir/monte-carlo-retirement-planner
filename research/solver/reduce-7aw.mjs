/*
 * THE 7AW REDUCER: THE CANDIDATE AGAINST THE SHIPPING DEFAULT AT THE ESTATE WEIGHT 0.02 (predictions/diag-7aw.md; PLAN.md
 * 7aw; audit-7aw.mjs). Reads results/diag7aw/case*.txt (batch-7aw.sh; 7aa's line format, parsed by reduce-7aa.mjs parse)
 * and every unit's trace. 7aj's reducer with the estate weight 0.02 (7aj ran 0.01; no record has either arm at 0.02 on the
 * blend-median tiers), so there is no identity gate against earlier runs.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) under predictions/diag-7aw.md;
 *   - every registered unit once and done: CAND (CAND/CANDIDATE/W0.02) and SHIP (SHIP/PRODUCT/W0.02) on each of 7e's 25
 *     households; nothing unregistered;
 *   - each unit's settings the registered ones: 30 points, 8,000 paths of seed 7002, lambda held, 5 return points, the
 *     final year exact, the estate weight 0.02, the tiers O60's blend medians (candidate.mjs blendReals) in both arms;
 *     CAND the candidate's (the reader, the tier state and one move for every world, Q's step, margin 0 with the charge
 *     0.001, e3, the interpolated allowance axis), SHIP the product's (none of them, the stored margin 0.001); within a
 *     household the two ran lines equal once those arm settings are taken out, the scale and the cap equal; no pension
 *     death charge (O53: the whole score reads the pot as the estate);
 *   - every trace: its count, seed, arm, stamp and survival are the log's.
 * THE ITEMS, by the registered rule (7aj's items at 0.02, and the whole-score rule's second leg: the
 * maintainer, 29 Sep 09:08 and 22:12 UK), each household at its margin FIXED AT REGISTRATION (MARGIN below: 0.5 where the
 * shipping default's survival in 7aj's record, the same world at 0.01, is below 94%, more than a point under the
 * regimen's 95% line; else 0.25, the stricter):
 *   1. Survival: CAND against SHIP on each household, paired on the same 8,000 paths - the exact one-sided McNemar p, Holm
 *      across the 25, the exact 95% interval against the margin (stats.mjs outcome), AND the guarded unconditional
 *      interval's lower end above minus the margin. HELD when every household passes both; FALSIFIED when any reads harm
 *      by the exact rule; else INCONCLUSIVE.
 *   2. The whole score at 0.02 (reduce-7aa.mjs wholeLeg at 0.05, the estate weight 0.02): HELD when every household's
 *      lower end is above minus its margin; FALSIFIED when any upper end is below it; else INCONCLUSIVE.
 *   3. Spending while both spend (reduce-7af.mjs spendBoth, spendChange): HELD when every household's lower end is above
 *      -5% AND the 25's mean's lower end above -1%; FALSIFIED when any household's upper end is below -5% OR the mean's
 *      upper end below -1%; else INCONCLUSIVE.
 * Reported, not items: every unit's table, survival, year-0 gap and opening, the risk-above decision, estate, years
 * below target and tier changes; the pooled floor (stats.mjs pooledSummed over the 25 households' cells, the maintainer's
 * O28 decision of 29 Sep 22:12 UK; 7u's pooled gate, here reported only); the old spending measure (a failed path's years 0).
 *   node research/solver/reduce-7aw.mjs [dir] > research/solver/results-7aw.txt
 *   node research/solver/reduce-7aw.mjs --planted   the planted checks alone
 *   node research/solver/reduce-7aw.mjs <dir> <paths> <points> --preflight   preflight-7aw.sh's read: the gate and traces, no stamp check
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { survivalChangeU, mcnemarHarmP, holm, outcome, pooledSummed, zFor } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import { spendYears, spendPaths, spendBoth, spendChange } from './reduce-7af.mjs';
import { blendReals, TIERS } from './candidate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7aw.md';
export const { field, LAMBDA, LEVELS } = A;
export const N = 8000, SEED = '7002', PTS = '30', W = '0.02', ALPHA = 0.05, SIM_TOL = 5e-5 + 1e-9, SPEND_H = -0.05, SPEND_M = -0.01;
export const PANEL = ['share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S126', 'bridge 4', 'S360', 'S194',
  'S124', 'S128', 'S130', 'S366', 'S370', 'bridge 4+cost', 'S162', 'S172', 'S168'];
// SHIP's survival in 7aj's record (results-7aj.txt, the blend-median world at 0.01; not 7af's or 7ag's, another world: the deep
// review of 7 Oct 11:42 UK): below 94 on the same five, 37.17 to 86.15; the next, S124, at 95.92
export const MARGIN = Object.fromEntries(PANEL.map(id => [id, ['share 0.95', 'S360', 'S128', 'S130', 'S370'].includes(id) ? 0.5 : 0.25]));
export const CAND = ['CAND', `CANDIDATE/W${W}`], SHIP = ['SHIP', `PRODUCT/W${W}`];
export const UNITS = [CAND, SHIP].flatMap(([a, l]) => PANEL.map(id => [id, a, l]));
export const parse = A.parse;
// the arm's own settings, and tiersAbove: the 'auto' rule's decision is each arm's (a second solve with the tier above where
// it turns it on), so a household's two arms may differ there by design; both are reported
const ARM_FIELDS = ['tierState', 'bridgeStep', 'bridgeRead', 'switchMargin', 'switchCharge', 'e3', 'pclsInterp', 'tiersAbove'];
export const WANT_ARM = {
  CAND: { bridgeRead: 'reader', bridgeStep: 'exact', switchMargin: '0', switchCharge: '0.001', e3: 'true', pclsInterp: 'true' },
  SHIP: { bridgeRead: 'false', bridgeStep: null, tierState: null, switchMargin: '0.001', switchCharge: '0', e3: 'false', pclsInterp: 'false' } };
export const tiersOk = (s, reals) => { if (!s) return false; const m = Object.fromEntries(s.split(',').map(x => { const i = x.lastIndexOf(':'); return [x.slice(0, i).replace(/_/g, ' '), Number(x.slice(i + 1))]; }));
  return Object.keys(m).length === TIERS.length && TIERS.every(k => m[k] === reals[k]); };

/* 7aw's gate (7aj's) */
export function gate(units, reals, n = N, pts = PTS) {
  const bad = [];
  for (const [id, arm, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.label === l).length; if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }
  const strip = s => ARM_FIELDS.reduce((t, k) => t.replace(new RegExp(` ${k} \\S+`), ''), s || '');
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const isC = u.arm === 'CAND';
    if (u.table === undefined) bad.push(`${tag}: no solve line`);
    if (!u.ran) bad.push(`${tag}: no ran line`);
    else {
      const want = { mix: '3', pts, seed: SEED, paths: String(n), grid: `total${pts}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', quad: '5', finalIntegral: 'true', bequestWeight: W, ...WANT_ARM[u.arm] };
      for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
      if (isC && !field(u.ran, 'tierState')) bad.push(`${tag}: ran without the tier state`);
      for (const k of ['holdTier', 'readerRef', 'coverage', 'deathTax']) if (field(u.ran, k) !== null) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}`);
      if (!tiersOk(field(u.ran, 'tiers'), reals)) bad.push(`${tag}: its tiers ${field(u.ran, 'tiers')} are not O60's blend medians`);
    }
    if (!u.gap) bad.push(`${tag}: no year-0 gap line`);
    if (!u.joint) bad.push(`${tag}: no joint line`);
    else {
      if (u.joint.joint !== isC) bad.push(`${tag}: ran jointWorlds ${u.joint.joint}`);
      if (u.joint.margin !== (isC ? '0' : '0.001')) bad.push(`${tag}: solved with switch margin ${u.joint.margin}`);
      // the whole score reads the pot as the estate: a pension death charge would make it gross, not net (O53's guard)
      if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax}`);
      if (u.joint.tier !== 'own') bad.push(`${tag}: plan tier ${u.joint.tier}`);
    }
    if (u.worlds.length) bad.push(`${tag}: world lines, not registered`);
    if (!u.run) bad.push(`${tag}: no run line`);
    if (!u.done) bad.push(`${tag}: no done line`);
    // within a household: the same settings but the arm's own; the same scale and cap (the risk-above decision is the arm's, reported)
    const ref = units.find(v => v.id === u.id && v.ran), refJ = units.find(v => v.id === u.id && v.joint);
    if (u.ran && ref && strip(u.ran) !== strip(ref.ran)) bad.push(`${tag}: differs from the other arm of the household beyond the arm's settings`);
    if (u.joint && refJ && (u.joint.scale !== refJ.joint.scale || u.joint.cap !== refJ.joint.cap)) bad.push(`${tag}: scale or cap differs within the household`);
  }
  return bad;
}
export const traceName = A.traceName;
export const traceAgrees = (j, ST, arm, l, sim, n = N) => !!(j && ST && j.stamp && j.N === n && String(j.seed) === SEED && j.arm === `${arm}/${l}` && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);

const tri = (yes, no) => (yes ? 'HELD' : no ? 'FALSIFIED' : 'INCONCLUSIVE');
const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);
/*
 * THE ITEMS. `K(id)` CAND's paired cells against SHIP (cells(SHIP, CAND): saved = CAND survives where SHIP fails); `WL(id)`
 * the whole-score leg of CAND against SHIP; `SP(id)` CAND's spending change against SHIP (spendChange) and its per-path
 * relative differences; `margin(id)` the household's registered margin.
 */
export function items(K, WL, SP, margin = id => MARGIN[id]) {
  const out = [];
  { const legs = PANEL.map(id => { const k = K(id); return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });
    const adj = holm(legs.map(l => l.p));
    legs.forEach((l, i) => { l.pHolm = adj[i]; const o = outcome({ b: l.k.lost, c: l.k.saved, N: l.k.N, margin: l.margin, pHolm: l.pHolm, level: ALPHA }); l.iv = o; l.u = guardedU(l.k); l.o = o.outcome; l.pass = o.outcome === 'no material harm' && l.u.lo > -l.margin; });
    out.push({ n: 1, text: `survival at the estate weight ${W}: CAND against SHIP, no material harm on every household (the exact rule with Holm across ${PANEL.length}, each at its margin, and the guarded unconditional interval's lower end above minus it; FALSIFIED: harm on any by the exact rule)`, legs,
      outcome: tri(legs.every(l => l.pass), legs.some(l => l.o === 'harm')) }); }
  { const legs = PANEL.map(id => ({ id, ...WL(id), margin: margin(id) }));
    out.push({ n: 2, text: `the whole score at the estate weight ${W}: CAND against SHIP, no material harm on every household, each at its margin (FALSIFIED: an upper end below minus it)`, legs,
      outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.hi < -l.margin)) }); }
  { const legs = PANEL.map(id => ({ id, ...SP(id).change })), diffs = PANEL.map(id => SP(id));
    // the panel mean of the relative changes: the households share their paths, so its se is taken from the per-path mean
    // of the households' relative differences (reduce-7af.mjs's form)
    const nP = diffs[0].rel.length, m = new Float64Array(nP);
    for (const x of diffs) for (let i = 0; i < nP; i++) m[i] += x.rel[i] / diffs.length;
    let mu = 0; for (let i = 0; i < nP; i++) mu += m[i]; mu /= nP; let v = 0; for (let i = 0; i < nP; i++) v += (m[i] - mu) ** 2;
    const se = Math.sqrt(v / (nP - 1) / nP), z = zFor(ALPHA), mean = { d: mu, lo: mu - z * se, hi: mu + z * se };
    out.push({ n: 3, text: 'spending while both arms spend: no household\'s spending more than 5% lower and the panel mean not more than 1% lower, each by its 95% interval (FALSIFIED: a household\'s upper end below -5% or the mean\'s below -1%)', legs, mean,
      outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M, legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M) }); }
  return out;
}

// PLANTED, before any real file (rule 6)
const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set() };
function planted() {
  const cases = [], reals = blendReals();
  const tiersStr = TIERS.map(k => `${k.replace(/ /g, '_')}:${reals[k]}`).join(',');
  const ranOf = (id, arm, o = {}) => {
    const c = arm === 'CAND';
    return `mix 3 pts ${o.pts || 30} seed ${SEED} paths ${o.n || N} grid total${o.pts || 30}x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot ${o.minPot || 29000} quad 5${c ? ' bridgeStep exact tierState 0/0,2/2' : ''} bequestWeight ${o.w || W} finalIntegral true bridgeRead ${c ? 'reader' : 'false'} switchMargin ${c ? 0 : 0.001} switchCharge ${c ? 0.001 : 0} e3 ${c} pclsInterp ${c} tiers ${o.tiers || tiersStr}`;
  };
  const unitText = (id, arm, l, o = {}) => {
    const p = ''.padEnd(16), L = `${arm}/${l}`, c = arm === 'CAND';
    const lines = [`${id.padEnd(16)} case | unit ${L} | lambda ${o.lambda || LAMBDA} tier own riskAbove auto mix 3`,
      `${p} solve ${L}: table ${o.table || '99.5000'} secs 1`, `${p} ran ${L}: ${o.ran || ranOf(id, arm, o)}`, `${p} gap ${L}: ${o.gap || '1.0000e-3'} opening 2,2`,
      `${p} joint ${L}: ${o.joint !== undefined ? o.joint : c} switchMargin ${o.margin || (c ? '0' : '0.001')} scale ${o.scale || 950000} cap 3800000 deathTax ${o.deathTax || 0} tier own riskAbove ${o.decided || 'off:_no_tier_above_the_plan'}`,
      ...(o.world ? [`${p} world ${L} 0 z -1.7321 weight 0.1667: table 99.0 sim 98.0 paths 1000`] : []),
      `${p} run ${L}: sim ${o.sim || '99.5000'} below 0.10 tier-below 1.00 changes 0.500 estate 100000 secs 1`];
    if (!o.noDone) lines.push(`${p} done ${L}`);
    return lines.join('\n');
  };
  const all = (o = {}, who = () => true) => UNITS.map(([id, a, l]) => unitText(id, a, l, who(id, a, l) ? o : {})).join('\n');
  const refused = t => String(gate(parse(t), reals).length > 0);
  const bent = (id, [arm, l], o) => refused(all(o, (i, a, lb) => i === id && a === arm && lb === l));
  const hh = (id, o) => refused(all(o, i => i === id));
  cases.push(['a log parsed and gated: every registered unit, the gate passes', `${parse(all()).length} ${gate(parse(all()), reals).length}`, `${UNITS.length} 0`]);
  cases.push(['the registered units: 25 candidates and 25 shipping defaults', `${UNITS.filter(u => u[1] === 'CAND').length} ${UNITS.filter(u => u[1] === 'SHIP').length}`, '25 25']);
  cases.push(['the margins: five households at 0.5, twenty at 0.25', `${PANEL.filter(id => MARGIN[id] === 0.5).length} ${PANEL.filter(id => MARGIN[id] === 0.25).length}`, '5 20']);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, a, l]) => unitText(id, a, l)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(all() + '\n' + unitText('S122', ...SHIP)), 'true']);
  cases.push(['the gate refuses an unregistered unit', refused(all() + '\n' + unitText('S999', ...SHIP)), 'true']);
  cases.push(['the gate refuses another lambda on the unit line', bent('S120', CAND, { lambda: '0.03' }), 'true']);
  cases.push(['the gate refuses the estate weight 0.01 (on every unit of a household)', hh('share 0.70', { w: '0.01' }), 'true']);
  cases.push(['the gate refuses other paths (on every unit of a household)', hh('S360', { n: 4000 }), 'true']);
  cases.push(['the gate refuses other points (on every unit of a household)', hh('wealth x2', { pts: 16 }), 'true']);
  cases.push(['the gate refuses the linear tiers (on every unit of a household)', hh('S130', { tiers: tiersStr.replace(`High_Risk:${reals['High Risk']}`, 'High_Risk:4.79') }), 'true']);
  cases.push(['the gate refuses a tier set with a sixth tier', hh('S130', { tiers: `${tiersStr},Very_High_Risk:5.5` }), 'true']);
  cases.push(['the gate refuses a missing solve line', refused(all().replace(`solve CAND/CANDIDATE/W0.02: table 99.5000 secs 1`, `slve CAND/CANDIDATE/W0.02: table 99.5000 secs 1`)), 'true']);
  cases.push(['the gate refuses SHIP with the tier state', bent('bridge 6', SHIP, { ran: ranOf('bridge 6', 'SHIP').replace(' bequestWeight', ' tierState 0/0,2/2 bequestWeight') }), 'true']);
  cases.push(['the gate refuses SHIP with the reader', bent('bridge 1', SHIP, { ran: ranOf('bridge 1', 'SHIP').replace('bridgeRead false', 'bridgeRead reader') }), 'true']);
  cases.push(['the gate refuses SHIP with the interpolated allowance axis', bent('S126', SHIP, { ran: ranOf('S126', 'SHIP').replace('pclsInterp false', 'pclsInterp true') }), 'true']);
  cases.push(['the gate refuses CAND without Q\'s step', bent('S126', CAND, { ran: ranOf('S126', 'CAND').replace(' bridgeStep exact', '') }), 'true']);
  cases.push(['the gate refuses CAND without the charge', bent('S126', CAND, { ran: ranOf('S126', 'CAND').replace('switchCharge 0.001', 'switchCharge 0') }), 'true']);
  cases.push(['the gate refuses CAND without e3', bent('S126', CAND, { ran: ranOf('S126', 'CAND').replace('e3 true', 'e3 false') }), 'true']);
  cases.push(['the gate refuses CAND without the tier state', bent('S126', CAND, { ran: ranOf('S126', 'CAND').replace(' tierState 0/0,2/2', '') }), 'true']);
  cases.push(['the gate refuses CAND solved per world', bent('S126', CAND, { joint: false }), 'true']);
  cases.push(['the gate refuses CAND at the stored margin', bent('S194', CAND, { margin: '0.001' }), 'true']);
  cases.push(['the gate refuses a settings difference within a household (minPot)', bent('share 0.90', SHIP, { minPot: 30000 }), 'true']);
  cases.push(['the gate refuses a pension death charge (on every unit of a household)', hh('S122', { deathTax: 0.45 }), 'true']);
  cases.push(['the gate refuses another scale within a household', bent('S120', SHIP, { scale: 950001 }), 'true']);
  cases.push(['the gate takes a risk-above decision that differs between the arms (the arm\'s own, reported)', bent('S122', CAND, { decided: 'on:_tier_above' }), 'false']);
  cases.push(['the gate takes a tier above in one arm only (the \'auto\' rule\'s second solve)', bent('S122', CAND, { ran: ranOf('S122', 'CAND').replace('tiersAbove 0', 'tiersAbove 1') }), 'false']); EDGES.push('a tier above in one arm only');
  cases.push(['the gate refuses a world line (not registered)', bent('bridge 4', CAND, { world: true }), 'true']);
  cases.push(['the gate refuses a missing done line', bent('share 0.50', SHIP, { noDone: true }), 'true']);
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, t = sim => ({ stamp: ST, N, seed: 7002, arm: 'CAND/CANDIDATE/W0.02', sim });
    cases.push(['a trace agrees with the log to four decimals, and not beyond, and only under its own arm', `${traceAgrees(t(99.30004), ST, 'CAND', 'CANDIDATE/W0.02', 99.3)} ${traceAgrees(t(99.3001), ST, 'CAND', 'CANDIDATE/W0.02', 99.3)} ${traceAgrees(t(99.3), ST, 'SHIP', 'CANDIDATE/W0.02', 99.3)}`, 'true false false']); }
  // the traces on files: one unit written to a scratch folder, read back; then its stamp changed (rule 6)
  { const dir = mkdtempSync(join(tmpdir(), 'p7aw-')), ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' };
    const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64'), surv = Uint8Array.from({ length: N }, (_, i) => (i % 3 ? 1 : 0)), sim = 100 * surv.reduce((t, x) => t + x, 0) / N;
    const write = st => writeFileSync(join(dir, traceName('S126', ...CAND)), gzipSync(JSON.stringify({ id: 'S126', arm: CAND.join('/'), stamp: st, N, Y: 1, seed: 7002, sim, survived: b64(surv), level: b64(new Uint8Array(N)), tier: b64(new Uint8Array(N)), wealth: b64(new Float32Array(N)), taxPaid: b64(new Float32Array(N)), failYear: b64(new Int16Array(N).fill(-1)) })));
    const u = [{ id: 'S126', arm: CAND[0], label: CAND[1], run: { sim } }];
    const run1 = () => { const bad = []; loadTraces(u, dir, ST, bad); return bad.length; };
    write(ST); const same = run1(); write({ ...ST, code: 'other' }); const off = run1();
    rmSync(dir, { recursive: true, force: true });
    cases.push(['a trace on file: its own stamp passes, another code refused', `${same} ${off > 0}`, '0 true']); }
  // the items on planted stories
  const mkK = spec => id => { const [saved, lost] = spec[id] || [0, 0]; return { saved, lost, a: N - 200 - saved - lost, d: 200, N }; };
  const mkW = spec => id => spec[id] || { d: 0.05, lo: -0.1, hi: 0.2 };
  const mkSP = (spec, noise = {}) => id => { const d = spec[id] !== undefined ? spec[id] : 0, e = noise[id] || 0.002, n = 400, rel = Float64Array.from({ length: n }, (_, i) => d + (i % 2 ? e : -e)); const ch = spendChange(Float64Array.from({ length: n }, () => 1), Float64Array.from({ length: n }, (_, i) => 1 + d + (i % 2 ? e : -e))); return { change: ch, rel, kept: n }; };
  const run = (k = {}, w = {}, sp = {}, noise = {}) => { const it = items(mkK(k), mkW(w), mkSP(sp, noise)); it.forEach(x => REACHED[x.n].add(x.outcome)); return it; };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  cases.push(['nothing differs: 1 HELD, 2 HELD, 3 HELD', outs(run()), '1 HELD, 2 HELD, 3 HELD']);
  cases.push(['a household with no discordant path reads no material harm (the interval the point 0)', run({ S122: [0, 0] })[0].legs.find(l => l.id === 'S122').o, 'no material harm']); EDGES.push('a household with no discordant path');
  cases.push(['a clear loss on one household (0 saved, 60 lost of 8000, margin 0.25): 1 FALSIFIED', run({ S122: [0, 60] })[0].outcome, 'FALSIFIED']);
  cases.push(['a loss inside the margin whose interval reaches past it (5 saved, 22 lost): 1 INCONCLUSIVE', run({ S122: [5, 22] })[0].outcome, 'INCONCLUSIVE']);
  cases.push(['all differing paths lost inside the margin (0 saved, 15 lost): the exact rule reads no material harm, the guarded unconditional interval does not pass it: 1 INCONCLUSIVE', run({ S122: [0, 15] })[0].outcome, 'INCONCLUSIVE']);
  EDGES.push('every discordant path lost and none saved (the exact interval ending at its point)');
  cases.push(['a gain everywhere is no harm: 1 HELD', run(Object.fromEntries(PANEL.map(id => [id, [40, 0]])))[0].outcome, 'HELD']);
  cases.push(['the margin is the household\'s: 0 saved, 30 lost (-0.375) reads harm at 0.25 (S122) and not harm at 0.5 (S130)', `${run({ S122: [0, 30] })[0].legs.find(l => l.id === 'S122').o} ${run({ S130: [0, 30] })[0].legs.find(l => l.id === 'S130').o === 'harm' ? 'harm' : 'not harm'}`, 'harm not harm']);
  cases.push(['Holm across 25: 60 saved, 82 lost (-0.275, p 0.039 alone) is not harm after Holm: 1 INCONCLUSIVE', run({ S122: [60, 82] })[0].outcome, 'INCONCLUSIVE']);
  cases.push(['the whole score within the margin everywhere: 2 HELD', run({}, {})[1].outcome, 'HELD']);
  cases.push(['the whole score\'s upper end below minus the margin on one household: 2 FALSIFIED', run({}, { S126: { d: -0.5, lo: -0.7, hi: -0.3 } })[1].outcome, 'FALSIFIED']);
  cases.push(['the whole score\'s interval straddling minus the margin: 2 INCONCLUSIVE', run({}, { S126: { d: -0.2, lo: -0.4, hi: 0 } })[1].outcome, 'INCONCLUSIVE']);
  cases.push(['the whole score\'s lower end exactly at minus the margin is not a pass: 2 INCONCLUSIVE', run({}, { S126: { d: 0, lo: -0.25, hi: 0.25 } })[1].outcome, 'INCONCLUSIVE']); EDGES.push('a whole-score lower end exactly at minus the margin');
  cases.push(['the whole score at -0.4 to -0.3 is no harm on S370 (margin 0.5), harm on bridge 4 (0.25)', `${run({}, { S370: { d: -0.35, lo: -0.4, hi: -0.3 } })[1].outcome} ${run({}, { 'bridge 4': { d: -0.35, lo: -0.4, hi: -0.3 } })[1].outcome}`, 'HELD FALSIFIED']);
  cases.push(['spending 6% lower on one household: 3 FALSIFIED', run({}, {}, { S120: -0.06 })[2].outcome, 'FALSIFIED']);
  cases.push(['spending 4% lower on one household: 3 HELD', run({}, {}, { S120: -0.04 })[2].outcome, 'HELD']);
  cases.push(['spending 1.5% lower on every household: 3 FALSIFIED by the mean', run({}, {}, Object.fromEntries(PANEL.map(id => [id, -0.015])))[2].outcome, 'FALSIFIED']);
  cases.push(['spending 1% lower on every household (the mean at the line): 3 INCONCLUSIVE', run({}, {}, Object.fromEntries(PANEL.map(id => [id, -0.01])))[2].outcome, 'INCONCLUSIVE']); EDGES.push('the spending mean exactly at -1%');
  cases.push(['spending 4.9% lower with a wide interval (to about -6.9%): 3 INCONCLUSIVE', run({}, {}, { S120: -0.049 }, { S120: 0.2 })[2].outcome, 'INCONCLUSIVE']);
  cases.push(['spending higher is never a fault: +6% on one household: 3 HELD', run({}, {}, { S120: 0.06 })[2].outcome, 'HELD']);
  // the spending measure on a tiny pair of traces
  { const X = { N: 3, Y: 3, level: Uint8Array.from([100, 0, 0, 100, 100, 100, 0, 0, 0]) }, Y = { N: 3, Y: 3, level: Uint8Array.from([100, 100, 100, 98, 98, 98, 100, 100, 100]) }, sy = spendYears(X, Y);
    const nb = spendBoth(X, Y, sy), ch = spendChange(nb.a, nb.b);
    cases.push(['survival is not spending: while both spend -1.0%, the path with no year both spend left out', `${(100 * ch.d).toFixed(1)} ${nb.idx.join(',')}`, '-1.0 0,1']); EDGES.push('a path with no year both arms spend'); }
  // the pooled floor (reported): the cells summed
  { const p = pooledSummed(PANEL.map(id => mkK({ S122: [0, 60] })(id)));
    cases.push(['the pooled floor sums the 25 households\' cells', `${p.k} ${p.cells.lost} ${p.N}`, `25 60 ${25 * N}`]); }
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should`);
  console.log(`EDGES: ${EDGES.join(', ')}`);
  for (const k of [1, 2, 3]) console.log(`OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`);
  console.log('');
}

const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());

/* THE TRACES: every unit's trace, checked against the log; `bad` gains every refusal */
export function loadTraces(units, DIR, ST, bad, n = N) {
  const TR = {};
  for (const u of units) {
    const f = join(DIR, traceName(u.id, u.arm, u.label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const t = readTrace(f);
    if (!traceAgrees(t, ST, u.arm, u.label, u.run.sim, n)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    TR[`${u.id}|${u.arm}|${u.label}`] = decode(t);
  }
  return TR;
}
const ARMS = { CAND, SHIP };
/* THE READING, after every gate has passed (the preflight runs it over its own tiny logs) */
export function reading(units, TR, out = console.log, n = N) {
  const U = (id, k) => units.find(u => u.id === id && u.arm === ARMS[k][0] && u.label === ARMS[k][1]);
  const T = (id, k) => TR[`${id}|${ARMS[k][0]}|${ARMS[k][1]}`];
  const K = id => cells(T(id, 'SHIP').survived, T(id, 'CAND').survived);
  const WL = id => { const u = U(id, 'CAND'), X = T(id, 'SHIP'), Y = T(id, 'CAND'); const cfg = { lambda: Number(field(u.ran, 'lambda')), floor: Math.min(...field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(W), spendYears: spendYears(X, Y) }; return A.wholeLeg(X, Y, cfg, ALPHA); };
  const spMemo = {};
  const SP = id => spMemo[id] || (spMemo[id] = (() => { const X = T(id, 'SHIP'), Y = T(id, 'CAND'), sy = spendYears(X, Y), sb = spendBoth(X, Y, sy), change = spendChange(sb.a, sb.b), N0 = X.N, rel = new Float64Array(N0), k = sb.a.length; let ma = 0; for (const x of sb.a) ma += x; ma /= k; sb.idx.forEach((pi, j) => { rel[pi] = (sb.b[j] - sb.a[j]) / ma * N0 / k; }); return { change, rel, kept: k, old: spendChange(spendPaths(X, sy), spendPaths(Y, sy)) }; })());
  out(`7AW: THE RESEARCH CANDIDATE AGAINST THE SHIPPING DEFAULT AT THE ESTATE WEIGHT ${W} (predictions/diag-7aw.md; ${n} paths of seed ${SEED}, both arms on O60's blend-median tiers; the fair-test gate passed: the stamps, every unit once and done at the registered settings, the arms' settings, every trace the log's)\n`);
  out('EVERY UNIT: the table, the simulated survival, the table error (table less simulated: the misread 7af and 7ai saw on SHIP), the year-0 gap and opening, the risk-above decision, years below target, tier changes and estate');
  for (const id of PANEL) for (const k of ['SHIP', 'CAND']) { const u = U(id, k); out(`  ${`${id} ${k}`.padEnd(20)} table ${u.table} sim ${u.run.sim.toFixed(2)} error ${(Number(u.table) - u.run.sim).toFixed(2)} gap ${u.gap.gap} (opening ${u.gap.open1e3},${u.gap.open0}) riskAbove ${u.joint.decided} below ${u.run.below.toFixed(2)} changes ${u.run.changes.toFixed(3)} estate ${u.run.estate}`); }
  const it = items(K, WL, SP);
  out('\nTHE ITEMS (each read by its registered rule)');
  for (const x of it) {
    out(`${x.n}. ${x.text}: ${x.outcome}`);
    if (x.n === 1) for (const l of x.legs) out(`     ${l.id.padEnd(14)} ${l.k.saved} saved/${l.k.lost} lost of ${l.k.N}  p ${l.p.toExponential(1)}  Holm ${l.pHolm.toExponential(1)}  change ${f3(l.iv.d)} (exact ${l.iv.lo.toFixed(3)} to ${l.iv.hi.toFixed(3)}; unconditional ${l.u.lo.toFixed(3)} to ${l.u.hi.toFixed(3)})  margin ${l.margin}  ${l.o}${l.pass ? '' : l.o === 'no material harm' ? ' (the unconditional interval does not pass)' : ''}`);
    if (x.n === 2) for (const l of x.legs) out(`     ${l.id.padEnd(14)} whole ${f3(l.d)} (unconditional ${l.lo.toFixed(3)} to ${l.hi.toFixed(3)}; exact ${l.exLo.toFixed(3)} to ${l.exHi.toFixed(3)}; survival part ${f3(l.sd)}, the rest ${f3(l.rest)} +/- ${l.restSe.toFixed(3)})  margin ${l.margin}`);
    if (x.n === 3) { for (const l of x.legs) { const o = SP(l.id); out(`     ${l.id.padEnd(14)} while both spend (${o.kept} paths) ${l.a.toFixed(4)} -> ${l.b.toFixed(4)}: ${f3(100 * l.d)}% (${(100 * l.lo).toFixed(3)} to ${(100 * l.hi).toFixed(3)}) | reported, a failed path's years 0: ${f3(100 * o.old.d)}%`); } out(`     the panel mean ${f3(100 * x.mean.d)}% (${(100 * x.mean.lo).toFixed(3)} to ${(100 * x.mean.hi).toFixed(3)})`); }
  }
  { const p = pooledSummed(PANEL.map(id => K(id)));
    out(`\nREPORTED: the pooled floor (stats.mjs pooledSummed over the 25 households' cells; 7u's pooled gate, not an item here): ${p.cells.saved} saved/${p.cells.lost} lost of ${p.N}, change ${f3(p.d)} (${p.lo.toFixed(3)} to ${p.hi.toFixed(3)})`); }
  out(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
  return it;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7aw'), n = Number(args[1] || N), pts = args[2] || PTS;
  const PRE = process.argv.includes('--preflight');   // preflight-7aw.sh: the gate and the traces on a preflight's logs, stamped none; its reading exercised, no figure read
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const bad = gate(units, blendReals(), n, pts), ST = stampOf(logs);
  const TR = bad.length ? {} : loadTraces(units, DIR, ST, bad, n);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  if (PRE) { console.log(`PREFLIGHT: the gate passed on ${units.length} units at ${pts} points and ${n} paths (the stamp check skipped: NOT-LAUNCHED); the reading below exercises the code, no figure is read\n`); }
  reading(units, TR, console.log, n);
}
