/*
 * 7v'S REDUCER (PLAN.md 7v; predictions/diag-7v.md): is the reader's harm the switch margin holding a near-tie? Reads
 * batch-7v.sh's logs (results/diag7v/case*.txt, audit-s126.mjs's diag7v mode) and every run's trace beside them.
 *
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs (one code version, launched under predictions/diag-7v.md at the blob each
 * log carries). THE RUN GATE (gate()): every registered case once, with its registered settings on the case line (arms,
 * margins, lambda, plan tier, the risk-above setting, the mixture); per arm a solve, a gap, a ran and a joint line; the ran
 * lines of a case equal once the bridge read is taken out, each naming the registered settings (30 points, seed 7002,
 * 8,000 paths, the case's lambda, mixture and tier above, the product's menu, raiseSurv true, failShort floor, the final
 * year exact, quad 5) and its label's bridge read; the joint line saying jointWorlds exactly when the label carries +J, the
 * solved margin 0.001, no pension death charge, the plan tier and what the risk-above rule decided; a run line for every
 * registered run (each arm at the four margins, and one policy at margin 0 with the learner) and nothing else; on the
 * harmed cases and S194 three world lines per arm at margins 0.001 and 0; the done line's count; every run's trace with
 * the log's count, seed, arm and stamp, and its survival equal to the run line's. COMPLETENESS: all nine cases, or INCOMPLETE.
 *
 * THE RULE: the regimen's (stats.mjs outcome(): the exact McNemar test with Holm, the exact 95% interval against the margin
 * for the case's survival, marginFor(), three outcomes), each item's tests a Holm family of their own, read from the traces
 * (every pair counted path by path). The unconditional interval (with its count check: read-o27-unconditional.mjs
 * guarded(), copied below, since importing it would pull an unstamped module into the batch's stamp) is printed beside
 * every no-material read, and each place the two readings disagree is marked; the registered reading decides (the
 * regimen's item 1 waits for the maintainer). Items 11-13 are read on point figures, grade C (the whole score's per-path
 * standard error is the kind the eighty-fourth review found too kind, so it is printed, never read as an interval). The
 * attribution line names the explanations the items support.
 * Reported, not items: every run's survival, saved and lost against the product, switching, the realised whole score
 * against the product by its parts (read-7t-deep.mjs parts()), the year-0 gap and opening tiers, the world lines, survival
 * on the deep bad world's paths (a long-run shift below -sqrt 3) on the harmed cases, S172's share of years at the plan's
 * tier and above (O16's own measure), and items 1 and 2 re-read on paths 1,001 to 8,000 (the ninety-third review, BLOCKING
 * 3: the timing measurement ran S126 on the first 1,000).
 *   node research/solver/reduce-7v.mjs [dir]     the verdict
 *   node research/solver/reduce-7v.mjs --planted  the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { mcnemarHarmP, holm, survivalChange, survivalChangeU, clopperPearson, outcome, marginFor } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode, scorePaths, paired, riskStep } from './reduce-7t.mjs';
import { switching, parts } from './read-7t-deep.mjs';
import { pathsForSeed } from '../engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7v.md';
export const N = 8000, WP = 1000, ALPHA = 0.05, TOL = 3, WTOL = 0.05, HOLD = 1000;
const SEED = '7002', PTS = '30', LEVELS = '1,1.1,0.95,0.9,0.8', SOLVED_MARGIN = '0.001';
export const MARG = ['1e-3', '3e-4', '1e-4', '0'];
const NODES = [-Math.sqrt(3), 0, Math.sqrt(3)];
// 7t's switching at margin 0 on the harmed cases, off's (results-7t-deep.txt, section 2: OFF/M0), for item 13
export const T7_OFF_M0 = { S126: 10.52, 'bridge 4': 10.02 };
const CORE = { lambda: '0.0223606797749979', tier: 'own', riskAbove: 'auto', decided: 'off:_no_tier_above_the_plan', mix: '3', tiersAbove: '0' };
const BR = ['OFF', 'READER', 'OFF+J', 'READER+J'], NB = ['OFF', 'OFF+J'];
// the registered cases: arms, settings, and whether the case runs its world lines (the harmed cases and S194)
export const CASES = {
  'S126': { ...CORE, arms: BR, worlds: true }, 'bridge 4': { ...CORE, arms: BR, worlds: true },
  'S360': { ...CORE, arms: BR }, 'share 0.95': { ...CORE, arms: BR }, 'S194': { ...CORE, arms: NB, worlds: true },
  'S172 down': { lambda: '0.6503449126242364', tier: 'Medium Risk', riskAbove: 'false', decided: 'set_false', mix: '3', tiersAbove: '0', arms: NB },
  'S172 up': { lambda: '0.6503449126242364', tier: 'Medium Risk', riskAbove: 'true', decided: 'set_true', mix: '3', tiersAbove: '1', arms: NB },
  'S330 mix3': { lambda: '0.9457416090031758', tier: 'Medium Risk', riskAbove: 'true', decided: 'set_true', mix: '3', tiersAbove: '1', arms: NB },
  'S330 mix5': { lambda: '0.9457416090031758', tier: 'Medium Risk', riskAbove: 'true', decided: 'set_true', mix: '5', tiersAbove: '1', arms: NB }};
export const HARMED = ['S126', 'bridge 4'], GAINED = ['S360', 'share 0.95'], CORE_IDS = ['S126', 'bridge 4', 'S360', 'share 0.95', 'S194'];
// the fix alone (7u's unmasking arm) is read against the product where off's own table is not flat: the harmed cases and
// S194; on S360 and share 0.95 its legs are reported, not refusing (off's flat misread there, the third deep review)
export const FIX_IDS = ['S126', 'bridge 4', 'S194'];
// every run a case registers: each arm at the four margins, then one policy at margin 0 with the learner
export const learnArm = id => (CASES[id].arms.includes('READER') ? 'READER+J' : 'OFF+J');
export const runsOf = id => [...CASES[id].arms.flatMap(a => MARG.map(m => `${a}/${m}`)), `${learnArm(id)}/0+L`];
// on a non-bridge case the reader is off (it reads no bridge), so an arm named for the reader is read on off's run
export const armOn = (id, label) => (CASES[id].arms.includes('READER') ? label : label.replace('READER', 'OFF'));
export const PRODUCT = 'OFF/1e-3';
// the paths whose long-run shift is below -sqrt 3, for a case whose traces run Y years (the shift is path i's draw at index Y:
// pathsForSeed builds a horizon's draws and then the shift, so a case of another horizon reads another draw - the
// ninety-fourth review, BLOCKING 3: bridge 4 runs 42 years to S126's 40)
export const deepIdx = (seed, n, Y) => { const out = []; pathsForSeed(seed, n, Y - 1).forEach((zs, i) => { if (zs[Y] < -Math.sqrt(3)) out.push(i); }); return out; };
export const traceName = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };

const CASEL = /^(.{16}) case \| arms (\S+) \| margins (\S+) \| lambda (\S+) tier (.+) riskAbove (\S+) mix (\d+)$/;
const SOLVEL = /^\s+solve (\S+): table (-?[\d.]+|-) secs (\d+)$/;
const GAPL = /^\s+gap (\S+): (0|>1|[\d.]+e[-+]\d+) opening ([\d,]+)$/;
const JOINTL = /^\s+joint (\S+): (true|false) switchMargin (\S+) scale (\d+) cap (\d+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
const RUNL = /^\s+run (\S+): sim (-?[\d.]+) below (\S+) tier-below (\S+) estate (-?\d+) secs (\d+)$/;
const WORLDL = /^\s+world (\S+) (\d) z (-?[\d.]+): table (-?[\d.]+) sim (-?[\d.]+) estate table (-?\d+) sim (-?\d+) tier-below (\S+) paths (\d+)$/;

// one log's cases
export function parse(text) {
  const cases = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) {
      cur = { id: m[1].trim(), arms: m[2].split(','), margins: m[3].split(','), lambda: m[4], tier: m[5], riskAbove: m[6], mix: m[7], solve: {}, gap: {}, ran: {}, joint: {}, runs: {}, worlds: {}, done: null };
      cases.push(cur); continue;
    }
    if (!cur) continue;
    if ((m = SOLVEL.exec(line))) { cur.solve[m[1]] = { table: +m[2], secs: +m[3] }; continue; }
    if ((m = GAPL.exec(line))) { cur.gap[m[1]] = { gap: m[2], open: m[3].split(',').map(Number) }; continue; }
    if ((m = /^\s+ran (\S+): (.*)$/.exec(line))) { cur.ran[m[1]] = m[2]; continue; }
    if ((m = JOINTL.exec(line))) { cur.joint[m[1]] = { joint: m[2] === 'true', margin: m[3], scale: +m[4], cap: +m[5], deathTax: +m[6], tier: m[7], decided: m[8] }; continue; }
    if ((m = RUNL.exec(line))) { cur.runs[m[1]] = { sim: +m[2], below: +m[3], tier: +m[4], estate: +m[5], secs: +m[6] }; continue; }
    if ((m = WORLDL.exec(line))) { (cur.worlds[m[1]] = cur.worlds[m[1]] || [])[+m[2]] = { z: +m[3], table: +m[4], sim: +m[5], estTable: +m[6], estSim: +m[7], tier: +m[8], paths: +m[9] }; continue; }
    if ((m = /^\s+done (\d+) runs$/.exec(line))) { cur.done = +m[1]; continue; }
  }
  return cases;
}
export function gate(cases) {
  const bad = [];
  for (const id of Object.keys(CASES)) { const k = cases.filter(c => c.id === id).length; if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }
  for (const c of cases) {
    const R = CASES[c.id];
    if (!R) { bad.push(`${c.id}: not a registered case`); continue; }
    const want = { arms: R.arms.join(','), margins: MARG.join(','), lambda: R.lambda, tier: R.tier, riskAbove: R.riskAbove, mix: R.mix };
    const got = { arms: c.arms.join(','), margins: c.margins.join(','), lambda: c.lambda, tier: c.tier, riskAbove: c.riskAbove, mix: c.mix };
    for (const k of Object.keys(want)) if (got[k] !== want[k]) bad.push(`${c.id}: case line ${k} ${got[k]}, the prediction names ${want[k]}`);
    const strip = s => (s || '').replace(/ bridgeRead \S+/, '');
    for (const l of R.arms) {
      const ran = c.ran[l];
      if (!c.solve[l]) bad.push(`${c.id}: no solve line for ${l}`);
      if (!c.gap[l] || c.gap[l].open.length !== MARG.length) bad.push(`${c.id}: no year-0 gap line for ${l} with an opening tier at each margin`);
      if (!ran) { bad.push(`${c.id}: no ran line for ${l}`); continue; }
      if (strip(ran) !== strip(c.ran[R.arms[0]])) bad.push(`${c.id}: ${l} differs beyond the bridge read ("${ran}")`);
      const w = { mix: R.mix, pts: PTS, seed: SEED, paths: String(N), grid: `total${PTS}x6x6`, lambda: R.lambda, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', tiersAbove: R.tiersAbove, finalIntegral: 'true', quad: '5' };
      for (const [k, v] of Object.entries(w)) if (field(ran, k) !== v) bad.push(`${c.id}: ${l} ${k} is ${field(ran, k)}, the prediction names ${v}`);
      if (field(ran, 'bridgeRead') !== (l.startsWith('READER') ? 'reader' : 'false')) bad.push(`${c.id}: ${l} ran bridgeRead ${field(ran, 'bridgeRead')}`);
      const j = c.joint[l];
      if (!j) { bad.push(`${c.id}: no joint line for ${l}`); continue; }
      if (j.joint !== l.endsWith('+J')) bad.push(`${c.id}: ${l} ran jointWorlds ${j.joint}`);
      if (j.margin !== SOLVED_MARGIN) bad.push(`${c.id}: ${l} solved with switch margin ${j.margin}`);
      if (j.deathTax !== 0) bad.push(`${c.id}: ${l} has a pension death charge ${j.deathTax}; the estate needs the pension share`);
      if (j.tier !== R.tier.replace(/ /g, '_')) bad.push(`${c.id}: ${l} ran at plan tier ${j.tier}`);
      if (j.decided !== R.decided) bad.push(`${c.id}: ${l}'s risk above decided ${j.decided}, the prediction names ${R.decided}`);
      if (R.worlds) for (const m of ['1e-3', '0']) {
        const ws = c.worlds[`${l}/${m}`] || [];
        // each world by its index: some() would skip a missing world's hole
        if (ws.length !== 3 || [0, 1, 2].some(k => !ws[k] || Math.abs(ws[k].z - NODES[k]) > 1e-3 || ws[k].paths !== WP)) bad.push(`${c.id}: ${l}/${m} lacks its three world runs at ${WP} paths`);
      }
    }
    const runs = runsOf(c.id);
    if (Object.keys(c.runs).sort().join(',') !== [...runs].sort().join(',')) bad.push(`${c.id}: runs ${Object.keys(c.runs).join(',') || 'none'}, not ${runs.join(',')}`);
    if (!R.worlds && Object.keys(c.worlds).length) bad.push(`${c.id}: world lines on a case that registers none`);
    if (c.done !== runs.length) bad.push(`${c.id}: the done line says ${c.done} runs, not ${runs.length}`);
  }
  return bad;
}
// a trace agrees with the logs: its count, seed, arm, every field of the stamp, and its survival the run line's
export const traceAgrees = (j, ST, label, sim) => !!(j && ST && j.stamp && j.N === N && String(j.seed) === SEED && j.arm === label && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) < 5e-4);
export const survivedShare = S => { let k = 0; for (let i = 0; i < S.length; i++) k += S[i]; return 100 * k / S.length; };

// THE PAIRED CELLS of run B (changed) against run A (reference): lost (A survives, B fails), saved, both, neither
export function cells(A, B) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = 0; i < A.length; i++) { if (A[i] && B[i]) a++; else if (A[i]) lost++; else if (B[i]) saved++; else d++; }
  return { a, lost, saved, d, N: A.length };
}
// read-o27-unconditional.mjs guarded(), as it stands (O27): the unconditional interval, its end on a one-sided side held at
// least as far out as the exact bound on that count of N
const cpMemo = new Map();   // memoised, as read-o27-unconditional.mjs's is: the same counts recur on every leg and draw
const cpUpper = (k, n, level) => { const key = `${k}|${n}|${level}`; if (!cpMemo.has(key)) cpMemo.set(key, clopperPearson(k, n, level)[1]); return cpMemo.get(key); };
function guarded(u, lost, saved, n, level) {
  const bh = -100 * cpUpper(lost, n, level), bg = 100 * cpUpper(saved, n, level);
  return { ...u, lo: saved === 0 ? Math.min(u.lo, bh) : u.lo, hi: lost === 0 ? Math.max(u.hi, bg) : u.hi };
}
// the unconditional interval (read beside, never deciding) and whether its no-material read at the margin agrees
const uncond = (k, margin, kind) => { const u = guarded(survivalChangeU(k.a, k.lost, k.saved, k.d), k.lost, k.saved, k.N, ALPHA); return { u, read: kind === 'harm' ? u.lo > -margin : u.hi < margin }; };
// A HARM FAMILY: each leg's regimen outcome (harm / no material harm / inconclusive), Holm over the legs
export function harmFamily(legs) {
  const ps = holm(legs.map(x => mcnemarHarmP(x.k.lost, x.k.saved)));
  return legs.map((x, j) => { const o = outcome({ b: x.k.lost, c: x.k.saved, N: x.k.N, margin: x.margin, pHolm: ps[j], level: ALPHA }); const un = uncond(x.k, x.margin, 'harm'); return { ...x, o: o.outcome, iv: o, pHolm: ps[j], un: un.u, disagree: un.read !== (o.outcome === 'no material harm') }; });
}
// A GAIN FAMILY: each leg gains (saves more than it loses, exact p for a gain under Holm below 0.05), shows no material gain
// (the exact interval's upper end below the margin), or neither; Holm over the legs
export function gainFamily(legs) {
  const ps = holm(legs.map(x => mcnemarHarmP(x.k.saved, x.k.lost)));
  return legs.map((x, j) => {
    const iv = survivalChange(x.k.lost, x.k.saved, x.k.N, ALPHA), gains = x.k.saved > x.k.lost && ps[j] < ALPHA, noGain = iv.hi < x.margin;
    const un = uncond(x.k, x.margin, 'gain');
    return { ...x, o: gains ? 'gain' : noGain ? 'no material gain' : 'inconclusive', iv, pHolm: ps[j], un: un.u, disagree: un.read !== noGain };
  });
}
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const legText = x => `${x.label} ${x.k.saved} saved/${x.k.lost} lost ${f3(x.iv.d)} (exact ${x.iv.lo.toFixed(3)} to ${x.iv.hi.toFixed(3)}; unconditional ${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)}${x.disagree ? ' <-- the readings DISAGREE' : ''}) ${x.o}`;

/*
 * THE ITEMS (the prediction's, in its order). `S(id, label)` is a run's survived array and `S.trace(id, label)` its trace;
 * `W(id, label)` the run's realised whole score against the product on the same case (the paired mean, points); `G(id,
 * label)` a run's world gaps (table less realised survival, points, the bad world first). The margin is the case's
 * (marginFor() of the product's survival on that case).
 */
export function items(S, W, G) {
  const margin = id => marginFor(survivedShare(S(id, PRODUCT)));
  const leg = (id, A, B, label) => ({ id, label: label || `${id}: ${B} against ${A}`, k: cells(S(id, A), S(id, B)), margin: margin(id) });
  const net = (id, l) => { const k = cells(S(id, PRODUCT), S(id, l)); return k.saved - k.lost; };
  const out = [];
  // 1. the reader's harm at the product's settings
  const i1 = harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER/1e-3')));
  out.push({ n: 1, text: 'the reader harms against the product at the product\'s own settings (READER/1e-3 against OFF/1e-3), on both harmed cases', legs: i1, outcome: tri(i1, x => x.o === 'harm', x => x.o === 'no material harm') });
  // 2. the margin carries the reader's own harm: at margin 0 the reader does no material harm against off at margin 0
  const i2 = harmFamily(HARMED.map(id => leg(id, 'OFF/0', 'READER/0')));
  out.push({ n: 2, text: 'at switch margin 0 the reader does no material harm against off at margin 0 (the reader\'s own harm is the margin\'s), on both harmed cases', legs: i2, outcome: tri(i2, x => x.o === 'no material harm', x => x.o === 'harm') });
  // 3. the dose-response against the product: one policy's net paths rise (within TOL) as the margin falls, and at 0 no
  // material harm, on both harmed cases
  // a FALL is read only through a harm: one policy harming at 0, or ending more than TOL paths below its 0.001 result while
  // one policy at 0.001 itself harms (the ninety-fourth review, BLOCKING 4: a few paths down where one policy has already
  // removed the harm is noise, or the objective's own trade, not the harm surviving the margin)
  const i3h = harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER+J/0')));
  const i3a = harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER+J/1e-3')));
  const i3 = HARMED.map((id, j) => {
    const ns = MARG.map(m => net(id, `READER+J/${m}`)), mono = ns.every((v, q) => q === 0 || v >= ns[q - 1] - TOL) && ns[3] > ns[0];
    return { id, ns, mono, h: i3h[j], rises: mono && i3h[j].o === 'no material harm', falls: i3h[j].o === 'harm' || (ns[3] < ns[0] - TOL && i3a[j].o === 'harm') };
  });
  out.push({ n: 3, text: `against the product, one policy's net paths (saved less lost) rise as the margin falls (each step within ${TOL} paths, and more at 0 than at 0.001) and at margin 0 it does no material harm, on both harmed cases (FALSIFIED: it harms at 0, or ends more than ${TOL} paths below 0.001 where it harms at 0.001)`, legs: [...i3h, ...i3a], extra: i3.map(x => `${x.id} READER+J net at ${MARG.join(', ')}: ${x.ns.join(', ')}${x.mono ? '' : ' (not rising)'}`), outcome: tri(i3, x => x.rises, x => x.falls) });
  // 4. table noise, in every arm's tables (the fix alone's too: 7t's noise was off's flat table on S360): margin 0 harms
  // against the arm's better small positive margin on at least one core case
  const i4 = CORE_IDS.flatMap(id => (CASES[id].arms.includes('READER') ? ['OFF', 'OFF+J', 'READER+J'] : ['OFF', 'OFF+J']).map(X => {
    const ns = ['3e-4', '1e-4'].map(m => net(id, `${X}/${m}`)), pk = ns[0] >= ns[1] ? '3e-4' : '1e-4';
    return { id, X, pk };
  }));
  const i4h = harmFamily(i4.map(x => leg(x.id, `${x.X}/${x.pk}`, `${x.X}/0`)));
  out.push({ n: 4, text: 'table noise: margin 0 harms against the same arm\'s better small positive margin (3e-4 or 1e-4) on at least one core case, in OFF\'s, OFF+J\'s or READER+J\'s tables (READER\'s own are not read; FALSIFIED does not clear margin 0 for 7u)', legs: i4h, outcome: i4h.some(x => x.o === 'harm') ? 'HELD' : i4h.every(x => x.o === 'no material harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 5. a separate clairvoyance error, at margin 0 alone (at a positive margin one policy's table change can flip a held tier,
  // which is P's own mechanism: the third deep review): one policy gains against the reader at margin 0, on both harmed cases
  const i5 = gainFamily(HARMED.map(id => leg(id, 'READER/0', 'READER+J/0')));
  out.push({ n: 5, text: 'one policy for every world gains against the reader at switch margin 0, on both harmed cases (a clairvoyance error the margin does not carry)', legs: i5, outcome: tri(i5, x => x.o === 'gain', x => x.o === 'no material gain') });
  // 6. a separate learning error: the learner gains at one policy and margin 0, on both harmed cases
  const i6 = gainFamily(HARMED.map(id => leg(id, 'READER+J/0', 'READER+J/0+L')));
  out.push({ n: 6, text: 'the learner gains at one policy and margin 0 (READER+J/0+L against READER+J/0), on both harmed cases (a learning error the margin does not carry)', legs: i6, outcome: tri(i6, x => x.o === 'gain', x => x.o === 'no material gain') });
  // 7. the family pairs meet at 0: S172 (the tier above off, on: O16's loss) and S330 (three worlds, five: O21's gain)
  const pairLeg = (a, b, m) => ({ id: b, label: `${b} against ${a} at ${m}`, k: cells(S(a, `OFF/${m}`), S(b, `OFF/${m}`)), margin: margin(a) });
  const h7 = harmFamily([pairLeg('S172 down', 'S172 up', '1e-3'), pairLeg('S172 down', 'S172 up', '0')]);
  const g7 = gainFamily([pairLeg('S330 mix3', 'S330 mix5', '1e-3'), pairLeg('S330 mix3', 'S330 mix5', '0')]);
  const pr = [
    { name: 'S172 (O16)', at: h7[0], zero: h7[1], shows: h7[0].o === 'harm', meets: h7[1].o === 'no material harm', stays: h7[1].o === 'harm' },
    { name: 'S330 (O21)', at: g7[0], zero: g7[1], shows: g7[0].o === 'gain', meets: g7[1].o === 'no material gain', stays: g7[1].o === 'gain' }];
  pr.forEach(p => { p.read = !p.shows ? 'NOT REPRODUCED' : p.meets ? 'MEETS' : p.stays ? 'STAYS' : 'INCONCLUSIVE'; });
  const rep = pr.filter(p => p.shows);
  out.push({ n: 7, text: 'the family pairs meet at 0: each pair\'s difference at margin 0.001 (O16\'s loss, O21\'s gain) is gone at margin 0', legs: [...h7, ...g7], extra: pr.map(p => `${p.name}: ${p.read}`), outcome: !rep.length ? 'NOT REPRODUCED' : rep.every(p => p.read === 'MEETS') ? 'HELD' : rep.every(p => p.read === 'STAYS') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 8. a small margin keeps switching rare: one policy's pension switches a path at 1e-4 at most half of those at 0 (HELD),
  // or at least 0.8 of them - nearly as much as 0 (FALSIFIED), on both harmed cases
  const sw = (id, l) => switching(S.trace(id, l)).perPath;
  const i8 = HARMED.map(id => ({ id, a: sw(id, 'READER+J/1e-4'), z: sw(id, 'READER+J/0') }));
  out.push({ n: 8, text: 'a small margin keeps switching rare: one policy\'s pension switches a path at margin 1e-4 are at most half those at margin 0 (FALSIFIED: at least 0.8 of them), on both harmed cases', legs: [], extra: i8.map(x => `${x.id} ${x.a.toFixed(2)} at 1e-4, ${x.z.toFixed(2)} at 0`), outcome: tri(i8, x => x.a <= x.z / 2, x => x.a >= 0.8 * x.z) });
  // 10. P alone, or P with C: the reader without one policy does no material harm against the product at margin 0
  const i10 = harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER/0')));   // item 10
  out.push({ n: 10, text: 'the reader alone at margin 0 does no material harm against the product, on both harmed cases (item 3\'s cure is the margin\'s, not one policy\'s)', legs: i10, outcome: tri(i10, x => x.o === 'no material harm', x => x.o === 'harm') });
  // 11. the whole score (grade C, point figures): one policy's realised whole score against the product rises as the margin
  // falls (each step no more than WTOL down, and more at 0 than at 0.001), on both harmed cases
  const i11 = HARMED.map(id => { const ws = MARG.map(m => W(id, `READER+J/${m}`)); return { id, ws, rises: ws.every((v, q) => q === 0 || v >= ws[q - 1] - WTOL) && ws[3] > ws[0], falls: ws[3] < ws[0] }; });
  out.push({ n: 11, text: `by the realised whole score (grade C, point figures), one policy's result against the product rises as the margin falls (each step no more than ${WTOL} down, and more at 0 than at 0.001), on both harmed cases`, legs: [], extra: i11.map(x => `${x.id} READER+J whole score at ${MARG.join(', ')}: ${x.ws.map(f3).join(', ')}`), outcome: tri(i11, x => x.rises, x => x.falls) });
  // 12. the tables value the policy the chooser follows: on S194, one policy at margin 0 halves the bad world's overrating
  const g12 = { a: G('S194', 'OFF/1e-3')[0], b: G('S194', 'OFF+J/0')[0] };
  out.push({ n: 12, text: 'on S194, one policy at margin 0 at least halves the bad world\'s overrating (table less realised survival) of off as the product runs it', legs: [], extra: [`S194 bad world: OFF/1e-3 ${g12.a.toFixed(2)}, OFF+J/0 ${g12.b.toFixed(2)}`], outcome: Math.abs(g12.b) <= Math.abs(g12.a) / 2 ? 'HELD' : 'FALSIFIED' });
  // 13. the grid (7t to 7v, the same paths, 16 points to 30): off's switching at margin 0 holds within 30% of 7t's (HELD: the
  // churn is the margin's, P) or falls below half of it (FALSIFIED: the churn was the grid's noise, N), on both harmed cases
  const i13 = HARMED.map(id => ({ id, v: sw(id, 'OFF/0'), t: T7_OFF_M0[id] }));
  out.push({ n: 13, text: 'off\'s switching at margin 0 holds within 30% of 7t\'s at 16 points (FALSIFIED: below half of it, the churn a coarse grid\'s noise), on both harmed cases', legs: [], extra: i13.map(x => `${x.id} ${x.v.toFixed(2)} a path at 30 points, 7t's ${x.t} at 16`), outcome: tri(i13, x => Math.abs(x.v - x.t) <= 0.3 * x.t, x => x.v < x.t / 2) });
  return out;
}
/*
 * THE CANDIDATES FOR 7u (item 9, a list, not a verdict), under two readings. Each arm but the product itself, at every
 * margin: the fix alone (OFF/m below the product's margin, OFF+J/m) and the reader with or without it (READER/m, READER+J/m;
 * on S194 read on off's runs). SURVIVAL (the regimen's): no material harm against the product on each case of its set (a
 * harm family per arm) - the fix alone on FIX_IDS, a reader arm on all five core cases and also a gain on S360 and share
 * 0.95 (a gain family per arm). THE WHOLE SCORE (grade C, point figures): its realised whole score against the product at
 * least 0 on each case of the same set. The fix alone's legs on S360 and share 0.95 are reported beside.
 */
export function candidates(S, W) {
  const margin = id => marginFor(survivedShare(S(id, PRODUCT)));
  const out = [];
  for (const X of ['OFF', 'OFF+J', 'READER', 'READER+J']) for (const m of MARG) {
    const l = `${X}/${m}`;
    if (l === PRODUCT) continue;
    const reader = X.startsWith('READER'), ids = reader ? CORE_IDS : FIX_IDS;
    const h = harmFamily(ids.map(id => ({ id, label: `${id}`, k: cells(S(id, PRODUCT), S(id, armOn(id, l))), margin: margin(id) })));
    const g = reader ? gainFamily(GAINED.map(id => ({ id, label: `${id}`, k: cells(S(id, PRODUCT), S(id, l)), margin: margin(id) }))) : [];
    const beside = reader ? [] : GAINED.map(id => ({ id, k: cells(S(id, PRODUCT), S(id, l)) }));
    const ws = ids.map(id => ({ id, w: W(id, armOn(id, l)) }));
    out.push({ l, ok: h.every(x => x.o === 'no material harm') && g.every(x => x.o === 'gain'), okW: ws.every(x => x.w >= 0), h, g, ws, beside, uncondOk: h.every(x => !x.disagree) && g.every(x => !x.disagree) });
  }
  return out;
}
export function attribution(it) {
  const o = n => it.find(x => x.n === n).outcome;
  const held = [];
  // item 10 three ways (the ninety-fourth review, BLOCKING 1: INCONCLUSIVE is never read as a negative); C is named only
  // from item 5
  if (o(2) === 'HELD' && o(3) === 'HELD') held.push(o(10) === 'HELD' ? 'P, the margin holding a near-tie; the reader alone is cured at margin 0 (items 2, 3 and 10)'
    : o(10) === 'FALSIFIED' ? 'P, the margin holding a near-tie, but the reader alone still harms at margin 0: the cure there needs one policy for every world as well (items 2 and 3; item 10 FALSIFIED)'
    : 'P, the margin holding a near-tie (items 2 and 3); whether the reader alone is cured at margin 0 is not settled (item 10 INCONCLUSIVE)');
  if (o(4) === 'HELD' || o(13) === 'FALSIFIED') held.push(`N, table noise (${[o(4) === 'HELD' ? 'item 4' : '', o(13) === 'FALSIFIED' ? 'item 13' : ''].filter(Boolean).join(' and ')})`);
  if (o(5) === 'HELD') held.push('C, a clairvoyance error the margin does not carry (item 5)');
  if (o(6) === 'HELD') held.push('L, a learning error the margin does not carry (item 6)');
  const pre = o(1) === 'FALSIFIED' ? 'the reader does no material harm at the product\'s settings (item 1 FALSIFIED: the harm at 0.001 is fragile to the settings, as P allows); ' : o(1) === 'INCONCLUSIVE' ? 'the harm at the product\'s settings is not settled (item 1 INCONCLUSIVE); ' : '';
  return `${pre}${held.length ? `HELD: ${held.join('; ')}` : 'no explanation HELD'}`;
}
// items 1, 2 and 10 re-read on paths HOLD+1 to N (the timing measurement ran S126's first HOLD paths before registration;
// item 10 reads the same S126 runs: the ninety-fourth review, BLOCKING 2)
export function heldOut(S) {
  const cut = (id, l) => S(id, l).subarray(HOLD);
  const margin = id => marginFor(survivedShare(cut(id, PRODUCT)));
  const leg = (id, A, B) => ({ id, label: `${id}: ${B} against ${A} on paths ${HOLD + 1}-${N}`, k: cells(cut(id, A), cut(id, B)), margin: margin(id) });
  return [...harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER/1e-3'))), ...harmFamily(HARMED.map(id => leg(id, 'OFF/0', 'READER/0'))), ...harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER/0')))];
}
// item 4 re-read on paths HOLD+1 to N (the maintainer, 27 Sep, after the ninety-fifth review's MINOR 4: its S126 OFF legs
// come from OFF run lines read in full before registration). The whole item on the held-out paths: each arm's better small
// margin picked there, Holm over its legs, the same three outcomes as item 4
export function heldOut4(S) {
  const cut = (id, l) => S(id, l).subarray(HOLD);
  const margin = id => marginFor(survivedShare(cut(id, PRODUCT)));
  const net = (id, l) => { const k = cells(cut(id, PRODUCT), cut(id, l)); return k.saved - k.lost; };
  const legs = harmFamily(CORE_IDS.flatMap(id => (CASES[id].arms.includes('READER') ? ['OFF', 'OFF+J', 'READER+J'] : ['OFF', 'OFF+J']).map(X => {
    const pk = net(id, `${X}/3e-4`) >= net(id, `${X}/1e-4`) ? '3e-4' : '1e-4';
    return { id, label: `${id}: ${X}/0 against ${X}/${pk} on paths ${HOLD + 1}-${N}`, k: cells(cut(id, `${X}/${pk}`), cut(id, `${X}/0`)), margin: margin(id) };
  })));
  return { legs, outcome: legs.some(x => x.o === 'harm') ? 'HELD' : legs.every(x => x.o === 'no material harm') ? 'FALSIFIED' : 'INCONCLUSIVE' };
}

// PLANTED, before any real file (rule 6)
function planted() {
  const ranOf = (id, br) => { const R = CASES[id]; return `mix ${R.mix} pts 30 seed 7002 paths 8000 grid total30x6x6 lambda ${R.lambda} levels ${LEVELS} raiseSurv true failShort floor tiersAbove ${R.tiersAbove} minPot 29000 quad 5 finalIntegral true bridgeRead ${br}`; };
  const log = (id, { ran = {}, joint = {}, drop = '', done = null, caseLine = null, worlds = null } = {}) => {
    const R = CASES[id], L = [caseLine || `${id.padEnd(16)} case | arms ${R.arms.join(',')} | margins ${MARG.join(',')} | lambda ${R.lambda} tier ${R.tier} riskAbove ${R.riskAbove} mix ${R.mix}`];
    for (const a of R.arms) {
      L.push(`${''.padEnd(16)} solve ${a}: table 99.50 secs 400`, `${''.padEnd(16)} gap ${a}: 4.2100e-4 opening 1,1,0,0`, `${''.padEnd(16)} ran ${a}: ${ran[a] || ranOf(id, a.startsWith('READER') ? 'reader' : 'false')}`,
        `${''.padEnd(16)} joint ${a}: ${joint[a] !== undefined ? joint[a] : a.endsWith('+J')} switchMargin 0.001 scale 950000 cap 3800000 deathTax 0 tier ${R.tier.replace(/ /g, '_')} riskAbove ${R.decided}`);
      for (const m of MARG) {
        L.push(`${''.padEnd(16)} run ${a}/${m}: sim 99.500 below 2.00 tier-below 8.00 estate 900000 secs 800`);
        if ((worlds !== null ? worlds : R.worlds) && (m === '1e-3' || m === '0')) NODES.forEach((z, k) => L.push(`${''.padEnd(16)} world ${a}/${m} ${k} z ${z.toFixed(4)}: table 95.00 sim 94.00 estate table 900000 sim 880000 tier-below 8.00 paths 1000`));
      }
    }
    L.push(`${''.padEnd(16)} run ${learnArm(id)}/0+L: sim 99.500 below 2.00 tier-below 8.00 estate 900000 secs 800`);
    L.push(`${''.padEnd(16)} done ${done !== null ? done : runsOf(id).length} runs`);
    return L.filter(x => !drop || !x.includes(drop)).join('\n');
  };
  const all9 = (over = {}) => Object.keys(CASES).map(id => log(id, over[id] || {})).join('\n');
  const c0 = parse(all9());
  const g = over => gate(parse(all9(over))).length > 0;
  // survival arrays from planted counts: `spec[id][label] = [saved, lost]` against the product; every other path survives
  // in both; the product fails its first `fail[id]` paths (400: 95% survival), so a run saves among those and loses among
  // the rest; a case's own product is moved only when the story names it (the family pairs)
  const mkS = (spec, sw = {}, fail = {}) => {
    const cache = {};
    const S = (id, label) => {
      const key = `${id}|${label}`;
      if (cache[key]) return cache[key];
      const F = fail[id] || 400, out = new Uint8Array(N).fill(1);
      for (let i = 0; i < F; i++) out[i] = 0;
      if (label !== PRODUCT || (spec[id] || {})[label]) { const [sv, ls] = (spec[id] || {})[label] || [0, 0]; for (let i = 0; i < sv; i++) out[i] = 1; for (let i = 0; i < ls; i++) out[F + i] = 0; }
      return (cache[key] = out);
    };
    // a one-path trace with exactly k pension switches (the plan's tier and two below, alternating, then held)
    S.trace = (id, label) => { const k = (sw[id] || {})[label] || 0, Y = 16, T = { N: 1, Y, tier: new Uint8Array(Y), failYear: Int16Array.from([-1]) }; for (let t = 1; t < Y; t++) T.tier[t] = t <= k ? (t % 2 ? 8 : 0) : T.tier[t - 1]; return T; };
    return S;
  };
  // the whole score and the world gaps, planted: `w[id][label]` (default 0) and `gp[id][label]` (default [1, 0, 0])
  const mkW = (w = {}) => (id, l) => ((w[id] || {})[l] !== undefined ? w[id][l] : 0);
  const mkG = (gp = {}) => (id, l) => ((gp[id] || {})[l] || [1, 0, 0]);
  const WUP = { S126: { 'READER+J/1e-3': -0.4, 'READER+J/3e-4': -0.2, 'READER+J/1e-4': -0.1, 'READER+J/0': 0.05 }, 'bridge 4': { 'READER+J/1e-3': -0.3, 'READER+J/3e-4': -0.2, 'READER+J/1e-4': -0.1, 'READER+J/0': 0.02 } };
  const GUP = { S194: { 'OFF/1e-3': [8, 0, 0], 'OFF+J/0': [3, 0, 0] } };
  const SW = { S126: { 'READER+J/1e-4': 1, 'READER+J/0': 3, 'OFF/0': 10 }, 'bridge 4': { 'READER+J/1e-4': 1, 'READER+J/0': 3, 'OFF/0': 10 } };
  // the story in which everything reads as the prediction says: the reader harms at 0.001 (0 saved, 40 lost), is gone at 0
  // against off at 0 and against the product, one policy rises to no harm at 0, no noise, no clairvoyance or learning gain,
  // the pairs meet, switching rare at 1e-4, the whole score rising, S194's gap halved, off's churn as 7t's
  const good = {};
  for (const id of HARMED) good[id] = { 'READER/1e-3': [0, 40], 'OFF/0': [0, 5], 'READER/0': [0, 5], 'READER+J/1e-3': [0, 40], 'READER+J/3e-4': [0, 20], 'READER+J/1e-4': [0, 8], 'READER+J/0': [0, 2], 'READER/1e-4': [0, 8], 'READER+J/0+L': [0, 2] };
  good['S172 up'] = { 'OFF/1e-3': [0, 60] }; good['S330 mix5'] = { 'OFF/1e-3': [40, 0] };
  const it0 = items(mkS(good, SW), mkW(WUP), mkG(GUP));
  const o = (it, n) => it.find(x => x.n === n).outcome;
  const run = (spec, { sw = SW, w = WUP, gp = GUP, fail = {} } = {}) => items(mkS(spec, sw, fail), mkW(w), mkG(gp));
  const cp = x => JSON.parse(JSON.stringify(x));
  const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13];
  const cases = [
    ['a log parsed: nine cases; S126 four arms, 17 runs, worlds at 1e-3 and 0, a joint line\'s decision, a gap line', `${c0.length} ${c0[0].arms.length} ${Object.keys(c0[0].runs).length} ${Object.keys(c0[0].worlds).length} ${c0[0].joint['READER+J'].decided} ${c0[0].gap.OFF.gap} ${c0[0].gap.OFF.open.join('')}`, '9 4 17 8 off:_no_tier_above_the_plan 4.2100e-4 1100'],
    ['the gate passes a log at the registered settings', String(gate(c0).length), '0'],
    ['the gate refuses a second setting changed between arms', String(g({ S126: { ran: { 'READER+J': ranOf('S126', 'reader').replace('minPot 29000', 'minPot 30000') } } })), 'true'],
    ['the gate refuses the wrong seed (on every arm, so only the seed check sees it)', String(g({ S126: { ran: Object.fromEntries(BR.map(a => [a, ranOf('S126', a.startsWith('READER') ? 'reader' : 'false').replace('seed 7002', 'seed 7004')])) } })), 'true'],
    ['the gate refuses 16 points on every arm (the grid line left at 30)', String(g({ S360: { ran: Object.fromEntries(BR.map(a => [a, ranOf('S360', a.startsWith('READER') ? 'reader' : 'false').replace('pts 30', 'pts 16')])) } })), 'true'],
    ['the gate refuses a 16-point grid on every arm (the points left at 30)', String(g({ S360: { ran: Object.fromEntries(BR.map(a => [a, ranOf('S360', a.startsWith('READER') ? 'reader' : 'false').replace('total30x6x6', 'total16x6x6')])) } })), 'true'],
    ['the gate refuses the reference lambda 0.025 on every arm of S126 (7t\'s 0.0224 is registered)', String(g({ S126: { ran: Object.fromEntries(BR.map(a => [a, ranOf('S126', a.startsWith('READER') ? 'reader' : 'false').replace('0.0223606797749979', '0.025')])) } })), 'true'],
    ['the gate refuses a case line that names another lambda', String(g({ 'S172 up': { caseLine: `${'S172 up'.padEnd(16)} case | arms OFF,OFF+J | margins ${MARG.join(',')} | lambda 0.025 tier Medium Risk riskAbove true mix 3` } })), 'true'],
    ['the gate refuses a tier above that did not open on S172 up', String(g({ 'S172 up': { ran: Object.fromEntries(NB.map(a => [a, ranOf('S172 up', 'false').replace('tiersAbove 1', 'tiersAbove 0')])) } })), 'true'],
    ['the gate refuses five worlds run as three', String(g({ 'S330 mix5': { ran: Object.fromEntries(NB.map(a => [a, ranOf('S330 mix5', 'false').replace('mix 5', 'mix 3')])) } })), 'true'],
    ['the gate refuses an arm whose joint line does not match its label', String(g({ S126: { joint: { 'READER+J': false } } })), 'true'],
    ['the gate refuses a risk-above decision the prediction does not name', String(gate(parse(all9().replace('deathTax 0 tier own riskAbove off:_no_tier_above_the_plan', 'deathTax 0 tier own riskAbove on:_thin'))).length > 0), 'true'],
    ['the gate refuses a missing year-0 gap line', String(g({ S360: { drop: 'gap OFF+J:' } })), 'true'],
    ['the gate refuses a missing run', String(g({ S126: { drop: 'run READER+J/1e-4:' } })), 'true'],
    ['the gate refuses a missing learner run', String(g({ 'bridge 4': { drop: '/0+L:' } })), 'true'],
    ['the gate refuses a missing world line (the middle world, so the count stays three)', String(g({ S126: { drop: 'world READER/0 1 ' } })), 'true'],
    ['the gate refuses S194 without its world lines', String(g({ S194: { worlds: false } })), 'true'],
    ['the gate refuses world lines on a case that registers none', String(g({ S360: { worlds: true } })), 'true'],
    ['the gate refuses a missing case', String(gate(parse(Object.keys(CASES).filter(id => id !== 'S330 mix5').map(id => log(id)).join('\n'))).length > 0), 'true'],
    ['the gate refuses a short done line', String(g({ S194: { done: 8 } })), 'true'],
    ['a trace agrees only with the log\'s count, seed, arm, stamp and survival', (() => {
      const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, j = { N, seed: 7002, arm: 'OFF/0', sim: 99.5, stamp: { ...ST } };
      return [traceAgrees(j, ST, 'OFF/0', 99.5), traceAgrees({ ...j, seed: 7004 }, ST, 'OFF/0', 99.5), traceAgrees({ ...j, stamp: { ...ST, sha: 'x' } }, ST, 'OFF/0', 99.5), traceAgrees(j, ST, 'OFF/1e-3', 99.5), traceAgrees(j, ST, 'OFF/0', 99.4)].join(','); })(), 'true,false,false,false,false'],
    ['trace names: case, run, + and / replaced', traceName('bridge 4', 'READER+J/0+L'), 'bridge_4-reader_j@0_l.json.gz'],
    ['cells: lost, saved, both, neither', (() => { const k = cells(Uint8Array.from([1, 1, 0, 0]), Uint8Array.from([1, 0, 1, 0])); return `${k.a} ${k.lost} ${k.saved} ${k.d}`; })(), '1 1 1 1'],
    ['the margin is the case\'s: 0.25 at 95% survival or more, 0.5 below', `${marginFor(95)} ${marginFor(94.9)}`, '0.25 0.5'],
    ['harm needs Holm: two legs of 48 saved, 70 lost (raw 0.026, Holm 0.053) are not harm', harmFamily([0, 1].map(() => ({ label: 'x', k: { a: 7882, lost: 70, saved: 48, d: 0, N }, margin: 0.25 }))).map(x => x.o).join(','), 'inconclusive,inconclusive'],
    ['harm needs the point loss at the margin: 19 lost of 8,000 (0.2375) is not harm (the exact interval reads it no material harm), 21 is', `${harmFamily([{ label: 'x', k: { a: 7981, lost: 19, saved: 0, d: 0, N }, margin: 0.25 }])[0].o} ${harmFamily([{ label: 'x', k: { a: 7979, lost: 21, saved: 0, d: 0, N }, margin: 0.25 }])[0].o}`, 'no material harm harm'],
    ['no material harm by the exact interval, the unconditional one marked where it disagrees (7 of 3,000 lost, none saved; 7 of 8,000 agree)', (() => { const x = harmFamily([{ label: 'x', k: { a: 2993, lost: 7, saved: 0, d: 0, N: 3000 }, margin: 0.25 }])[0], y = harmFamily([{ label: 'x', k: { a: 7593, lost: 7, saved: 0, d: 400, N }, margin: 0.25 }])[0]; return `${x.o} ${x.disagree} ${y.disagree}`; })(), 'no material harm true false'],
    ['the count guard, as read-o27-unconditional.mjs guarded() gives it (3 lost, none saved, 400 failing in both, of 8,000: raw -0.099217, guarded -0.109551)', harmFamily([{ label: 'x', k: { a: 7597, lost: 3, saved: 0, d: 400, N }, margin: 0.25 }])[0].un.lo.toFixed(6), '-0.109551'],
    ['a gain needs Holm: 6 and 0 on two legs (Holm 0.031) gains, 5 and 0 (0.062) does not', `${gainFamily([0, 1].map(() => ({ label: 'x', k: { a: 7594, lost: 0, saved: 6, d: 400, N }, margin: 0.25 }))).map(x => x.o).join(',')} ${gainFamily([0, 1].map(() => ({ label: 'x', k: { a: 7595, lost: 0, saved: 5, d: 400, N }, margin: 0.25 }))).map(x => x.o).join(',')}`, 'gain,gain no material gain,no material gain'],
    ['no material gain needs the interval\'s upper end below the margin: 30 saved, 20 lost of 8,000 (upper end 0.30) is inconclusive', gainFamily([{ label: 'x', k: { a: 7550, lost: 20, saved: 30, d: 400, N }, margin: 0.25 }])[0].o, 'inconclusive'],
    ['the planted \'good\' story (P alone; no noise, no C, no L) reads items 1-8 and 10-13 as HELD but 4, 5 and 6 FALSIFIED', ALL.map(n => o(it0, n)).join(','), 'HELD,HELD,HELD,FALSIFIED,FALSIFIED,FALSIFIED,HELD,HELD,HELD,HELD,HELD,HELD'],
    ['the attribution of that story names P alone', attribution(it0), 'HELD: P, the margin holding a near-tie; the reader alone is cured at margin 0 (items 2, 3 and 10)'],
  ];
  // the opposite story: no harm at 0.001; the reader keeps harming at 0; one policy falls; noise at 0; clairvoyance and
  // learning gain; the pairs stay; churn at 1e-4 as at 0; the whole score falling; S194's gap kept; off's churn gone at 30
  const bad = {};
  for (const id of HARMED) bad[id] = { 'READER/1e-3': [0, 1], 'OFF/0': [0, 0], 'READER/0': [0, 40], 'READER+J/1e-3': [0, 5], 'READER+J/3e-4': [0, 5], 'READER+J/1e-4': [40, 5], 'READER+J/0': [40, 0], 'READER/1e-4': [0, 40], 'READER+J/0+L': [80, 0] };
  bad.S360 = { 'READER+J/3e-4': [30, 0], 'READER+J/0': [0, 60] };
  bad['S172 up'] = { 'OFF/1e-3': [0, 60], 'OFF/0': [0, 60] }; bad['S330 mix5'] = { 'OFF/1e-3': [40, 0], 'OFF/0': [40, 0] };
  const WDN = { S126: { 'READER+J/1e-3': 0.2, 'READER+J/0': -0.1 }, 'bridge 4': { 'READER+J/1e-3': 0.2, 'READER+J/0': -0.1 } };
  const it1 = run(bad, { sw: { S126: { 'READER+J/1e-4': 3, 'READER+J/0': 3, 'OFF/0': 3 }, 'bridge 4': { 'READER+J/1e-4': 3, 'READER+J/0': 3, 'OFF/0': 3 } }, w: WDN, gp: { S194: { 'OFF/1e-3': [8, 0, 0], 'OFF+J/0': [5, 0, 0] } } });
  cases.push(['the opposite story reads items 1, 2 FALSIFIED, 4, 5, 6 HELD, 7, 8, 10, 11, 12, 13 FALSIFIED', [1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13].map(n => o(it1, n)).join(','), 'FALSIFIED,FALSIFIED,HELD,HELD,HELD,FALSIFIED,FALSIFIED,FALSIFIED,FALSIFIED,FALSIFIED,FALSIFIED']);
  cases.push(['the attribution of the opposite story names N (items 4 and 13), C and L, and says the harm is fragile', attribution(it1), 'the reader does no material harm at the product\'s settings (item 1 FALSIFIED: the harm at 0.001 is fragile to the settings, as P allows); HELD: N, table noise (item 4 and item 13); C, a clairvoyance error the margin does not carry (item 5); L, a learning error the margin does not carry (item 6)']);
  cases.push(['item 3 reads FALSIFIED when one policy harms at 0 on both', (() => { const s = cp(good); for (const id of HARMED) s[id]['READER+J/0'] = [0, 60]; return o(run(s), 3); })(), 'FALSIFIED']);
  cases.push(['item 3 reads INCONCLUSIVE when it rises on one case and falls on the other', (() => { const s = cp(good); s['bridge 4']['READER+J/0'] = [0, 60]; return o(run(s), 3); })(), 'INCONCLUSIVE']);
  cases.push(['item 3 does not rise when a step falls by more than the tolerance (net -40, -20, -25, -2)', (() => { const s = cp(good); for (const id of HARMED) s[id]['READER+J/1e-4'] = [0, 25]; return o(run(s), 3); })(), 'INCONCLUSIVE']);
  cases.push(['item 3 rises through a step that falls within the tolerance (net -40, -20, -22, -2)', (() => { const s = cp(good); for (const id of HARMED) s[id]['READER+J/1e-4'] = [0, 22]; return o(run(s), 3); })(), 'HELD']);
  cases.push(['item 3 reads FALSIFIED when it rises but still harms at 0 (net -80, -60, -40, -30)', (() => { const s = cp(good); for (const id of HARMED) { s[id]['READER+J/1e-3'] = [0, 80]; s[id]['READER+J/3e-4'] = [0, 60]; s[id]['READER+J/1e-4'] = [0, 40]; s[id]['READER+J/0'] = [0, 30]; } return o(run(s), 3); })(), 'FALSIFIED']);
  cases.push(['item 3 does not rise when it is flat (net -5 at every margin, no harm at 0)', (() => { const s = cp(good); for (const id of HARMED) for (const m of MARG) s[id][`READER+J/${m}`] = [0, 5]; return o(run(s), 3); })(), 'INCONCLUSIVE']);
  cases.push(['the margin follows the product\'s survival: at 94% a loss of 30 paths (0.375) is not harm by the 0.5 margin, so item 1 reads FALSIFIED', o(run((() => { const s = cp(good); for (const id of HARMED) s[id]['READER/1e-3'] = [0, 30]; return s; })(), { fail: { S126: 480, 'bridge 4': 480 } }), 1), 'FALSIFIED']);
  cases.push(['item 2 reads the reader against off at margin 0, not against the product (both lose the same 40 paths)', o(run((() => { const s = cp(good); for (const id of HARMED) { s[id]['OFF/0'] = [0, 40]; s[id]['READER/0'] = [0, 40]; } return s; })()), 2), 'HELD']);
  cases.push(['item 4 reads margin 0 against the better small margin, 3e-4 here (60 saved there, none at 1e-4 or 0)', o(run((() => { const s = cp(good); s.S360 = { 'READER+J/3e-4': [60, 0] }; return s; })()), 4), 'HELD']);
  cases.push(['item 4 reads the fix alone\'s own tables too: off at 0 losing 60 on S360 against its better small margin is noise', o(run((() => { const s = cp(good); s.S360 = { 'OFF/0': [0, 60] }; return s; })()), 4), 'HELD']);
  cases.push(['item 4 reads off+J on S194 (a non-bridge case)', o(run((() => { const s = cp(good); s.S194 = { 'OFF+J/0': [0, 60] }; return s; })()), 4), 'HELD']);
  cases.push(['item 5 is read at margin 0 alone: a gain there, none at 1e-4, reads HELD', o(run((() => { const s = cp(good); for (const id of HARMED) { s[id]['READER/0'] = [0, 40]; s[id]['READER+J/0'] = [40, 0]; } return s; })()), 5), 'HELD']);
  cases.push(['item 7 reads NOT REPRODUCED when neither pair differs at 0.001', (() => { const s = cp(good); s['S172 up'] = {}; s['S330 mix5'] = {}; return o(run(s), 7); })(), 'NOT REPRODUCED']);
  cases.push(['item 7 reads HELD on one reproduced pair that meets, the other not reproduced', (() => { const s = cp(good); s['S330 mix5'] = {}; return o(run(s), 7); })(), 'HELD']);
  cases.push(['item 7 names an unreproduced pair NOT REPRODUCED', (() => { const s = cp(good); s['S330 mix5'] = {}; return run(s).find(x => x.n === 7).extra.join('; '); })(), 'S172 (O16): MEETS; S330 (O21): NOT REPRODUCED']);
  cases.push(['item 7 reads S330\'s pair by its gain (mix5 against mix3), not S172\'s harm', run(good).find(x => x.n === 7).extra.join('; '), 'S172 (O16): MEETS; S330 (O21): MEETS']);
  cases.push(['item 8 is INCONCLUSIVE between a half and 0.8 (2 switches at 1e-4 against 3 at 0)', o(run(good, { sw: { S126: { 'READER+J/1e-4': 2, 'READER+J/0': 3, 'OFF/0': 10 }, 'bridge 4': { 'READER+J/1e-4': 2, 'READER+J/0': 3, 'OFF/0': 10 } } }), 8), 'INCONCLUSIVE']);
  cases.push(['item 10 reads the reader alone at 0 against the product: 40 lost there reads FALSIFIED', o(run((() => { const s = cp(good); for (const id of HARMED) { s[id]['READER/0'] = [0, 40]; s[id]['OFF/0'] = [0, 40]; } return s; })()), 10), 'FALSIFIED']);
  cases.push(['item 10 INCONCLUSIVE is not read as a negative, and C is not named without item 5', attribution(ALL.map(n => ({ n, outcome: [1, 2, 3, 13].includes(n) ? 'HELD' : n === 10 ? 'INCONCLUSIVE' : 'FALSIFIED' }))), 'HELD: P, the margin holding a near-tie (items 2 and 3); whether the reader alone is cured at margin 0 is not settled (item 10 INCONCLUSIVE)']);
  cases.push(['item 10 FALSIFIED says the cure at 0 needs one policy; C is still named only from item 5', attribution(ALL.map(n => ({ n, outcome: [1, 2, 3, 5, 13].includes(n) ? 'HELD' : 'FALSIFIED' }))), 'HELD: P, the margin holding a near-tie, but the reader alone still harms at margin 0: the cure there needs one policy for every world as well (items 2 and 3; item 10 FALSIFIED); C, a clairvoyance error the margin does not carry (item 5)']);
  cases.push(['item 3 does not fall on a few paths where one policy has already removed the harm (net -2 at 0.001, -4 at 0, no harm)', (() => { const s = cp(good); for (const id of HARMED) { s[id]['READER+J/1e-3'] = [0, 2]; s[id]['READER+J/3e-4'] = [0, 2]; s[id]['READER+J/1e-4'] = [0, 3]; s[id]['READER+J/0'] = [0, 4]; } return o(run(s), 3); })(), 'INCONCLUSIVE']);
  cases.push(['item 3 does not fall past the tolerance where one policy does no harm at 0.001 (net +10 at 0.001, -4 at 0)', (() => { const s = cp(good); for (const id of HARMED) { s[id]['READER+J/1e-3'] = [10, 0]; s[id]['READER+J/3e-4'] = [10, 0]; s[id]['READER+J/1e-4'] = [5, 0]; s[id]['READER+J/0'] = [0, 4]; } return o(run(s), 3); })(), 'INCONCLUSIVE']);
  cases.push(['item 3 falls past the tolerance where one policy harms at 0.001 (net -40 at 0.001, -50 at 0; harm at both)', (() => { const s = cp(good); for (const id of HARMED) { s[id]['READER+J/1e-3'] = [0, 40]; s[id]['READER+J/0'] = [0, 50]; } return o(run(s), 3); })(), 'FALSIFIED']);
  cases.push(['the deep bad world is picked from each case\'s own horizon: 41 and 43 years pick different paths, each its own shift\'s', (() => { const a = deepIdx(7002, 400, 41), b = deepIdx(7002, 400, 43), zb = pathsForSeed(7002, 400, 42).map(zs => zs[43]); return `${a.join(',') !== b.join(',')} ${b.every(i => zb[i] < -Math.sqrt(3)) && zb.filter(z => z < -Math.sqrt(3)).length === b.length}`; })(), 'true true']);
  cases.push(['the attribution names N from item 13 alone (off\'s churn gone at 30 points, item 4 FALSIFIED)', attribution(ALL.map(n => ({ n, outcome: [1, 2, 3, 10].includes(n) ? 'HELD' : 'FALSIFIED' }))), 'HELD: P, the margin holding a near-tie; the reader alone is cured at margin 0 (items 2, 3 and 10); N, table noise (item 13)']);
  cases.push(['the attribution names P only with item 3 as well as item 2', attribution(ALL.map(n => ({ n, outcome: [1, 2, 10, 13].includes(n) ? 'HELD' : n === 3 ? 'INCONCLUSIVE' : 'FALSIFIED' }))), 'no explanation HELD']);
  cases.push(['item 11 does not rise when a step falls by more than 0.05 (-0.4, -0.2, -0.3, +0.05)', o(run(good, { w: { S126: { ...WUP.S126, 'READER+J/1e-4': -0.3 }, 'bridge 4': WUP['bridge 4'] } }), 11), 'INCONCLUSIVE']);
  cases.push(['item 12 reads the bad world\'s gap by its size (-8 halved to 3 holds; 5 does not)', `${o(run(good, { gp: { S194: { 'OFF/1e-3': [-8, 0, 0], 'OFF+J/0': [3, 0, 0] } } }), 12)} ${o(run(good, { gp: { S194: { 'OFF/1e-3': [8, 0, 0], 'OFF+J/0': [5, 0, 0] } } }), 12)}`, 'HELD FALSIFIED']);
  cases.push(['item 13 is INCONCLUSIVE between half and 70% of 7t\'s churn (6 a path)', o(run(good, { sw: { S126: { ...SW.S126, 'OFF/0': 6 }, 'bridge 4': { ...SW['bridge 4'], 'OFF/0': 6 } } }), 13), 'INCONCLUSIVE']);
  // the candidates: in `good`, READER+J/0 does no harm on the harmed cases and the rest are untouched (no harm), but no reader
  // arm gains on S360 and share 0.95, so none is a candidate; give READER+J/0 its gains there and it is
  const cz = candidates(mkS(good), mkW()), wg = cp(good); for (const id of GAINED) wg[id] = { 'READER+J/0': [40, 0] };
  const cz2 = candidates(mkS(wg), mkW());
  cases.push(['the candidates: no reader arm without its gains; READER+J/0 with them; the fix alone at 1e-4 (no harm anywhere)', `${cz.filter(x => x.ok && x.l.startsWith('READER')).length} ${cz2.filter(x => x.ok && x.l.startsWith('READER')).map(x => x.l).join(',')} ${cz.find(x => x.l === 'OFF+J/1e-4').ok}`, '0 READER+J/0 true']);
  cases.push(['a candidate refused for harm on one core case (S194 read on off\'s run for a reader arm)', (() => { const s = cp(wg); s.S194 = { 'OFF+J/0': [0, 60] }; return String(candidates(mkS(s), mkW()).find(x => x.l === 'READER+J/0').ok); })(), 'false']);
  cases.push(['the fix alone is not refused for off\'s flat misread on S360 (reported beside), and is for harm on bridge 4', (() => { const s = cp(good); s.S360 = { 'OFF+J/0': [0, 60] }; const a = candidates(mkS(s), mkW()).find(x => x.l === 'OFF+J/0'); s['bridge 4']['OFF+J/0'] = [0, 60]; const b = candidates(mkS(s), mkW()).find(x => x.l === 'OFF+J/0'); return `${a.ok} ${a.beside.find(x => x.id === 'S360').k.lost} ${b.ok}`; })(), 'true 60 false']);
  cases.push(['by the whole score a candidate needs at least 0 on every case of its set', (() => { const a = candidates(mkS(wg), mkW()).find(x => x.l === 'READER+J/0').okW; const b = candidates(mkS(wg), mkW({ S194: { 'OFF+J/0': -0.1 } })).find(x => x.l === 'READER+J/0').okW; return `${a} ${b}`; })(), 'true false']);
  cases.push(['the reader is off on a non-bridge case', `${armOn('S194', 'READER+J/0')} ${armOn('S126', 'READER+J/0')}`, 'OFF+J/0 READER+J/0']);
  cases.push(['the product is never a candidate of its own; the reader and one policy at 0.001 are', `${candidates(mkS(good), mkW()).some(x => x.l === PRODUCT)} ${['READER/1e-3', 'OFF+J/1e-3', 'READER+J/1e-3'].every(l => candidates(mkS(good), mkW()).some(x => x.l === l))}`, 'false true']);
  cases.push(['items 1, 2 and 10 re-read on paths 1,001-8,000: the harm on paths 1-1,000 is left out, and item 10 is among them', (() => { const S = mkS(good); const S2 = (id, l) => { const a = Uint8Array.from(S(id, l)); if (HARMED.includes(id) && l === 'READER/1e-3') { for (let i = 0; i < 400; i++) a[i] = 0; for (let i = 400; i < 440; i++) a[i] = 1; for (let i = 400; i < 430; i++) a[i] = 0; } return a; }; const h = heldOut(S2); return `${h.slice(0, 2).map(x => `${x.k.saved}/${x.k.lost}`).join(',')} ${h.length} ${!!h[4] && h[4].label.includes('READER/0 against OFF/1e-3')}`; })(), '0/0,0/0 6 true']);
  cases.push(['item 4 re-read on paths 1,001-8,000: a noise harm on S126 OFF/0 in paths 1-1,000 is left out, one past them is read, on its own leg', (() => {
    const S = mkS(good), at = from => (id, l) => { const a = Uint8Array.from(S(id, l)); if (id === 'S126' && ['OFF/3e-4', 'OFF/1e-4', 'OFF/0'].includes(l)) for (let i = from; i < from + 60; i++) a[i] = l === 'OFF/0' ? 0 : 1; return a; };
    const early = heldOut4(at(0)), late = heldOut4(at(3000)), leg = late.legs.find(x => x.o === 'harm');
    return `${heldOut4(S).outcome} ${early.outcome} ${late.outcome} ${late.legs.length} ${!!leg && leg.label.startsWith('S126: OFF/0 against OFF/')}`; })(), 'FALSIFIED FALSIFIED HELD 14 true']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(HERE, 'results', 'diag7v');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  const cases = Object.values(logs).flatMap(parse);
  if (Object.keys(CASES).some(id => !cases.some(c => c.id === id && c.done !== null))) { console.log(`INCOMPLETE - ${cases.filter(c => c.done !== null).length} of ${Object.keys(CASES).length} cases done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(cases);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const T = {};
  if (!bad.length) for (const c of cases) for (const l of runsOf(c.id)) {
    const f = join(DIR, traceName(c.id, l));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, l, c.runs[l].sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const X = decode(j);
    if (Math.abs(survivedShare(X.survived) - c.runs[l].sim) >= 5e-4) bad.push(`${f}: its survived paths give ${survivedShare(X.survived)}, the run line ${c.runs[l].sim}`);
    T[`${c.id}|${l}`] = X;
  }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const S = (id, l) => T[`${id}|${l}`].survived;
  S.trace = (id, l) => T[`${id}|${l}`];
  // the whole score, per case: reduce-7t.mjs scorePaths() configured from the case's own ran and joint lines, against the product
  const cfgs = {}, s0 = {};
  for (const c of cases) {
    const ran = c.ran[CASES[c.id].arms[0]], jn = c.joint[CASES[c.id].arms[0]], ref = S.trace(c.id, PRODUCT);
    const cfg = { lambda: Number(field(ran, 'lambda')), floor: Math.min(...field(ran, 'levels').split(',').map(Number)), scale: jn.scale, cap: jn.cap };
    cfg.spendYears = Array.from({ length: ref.Y }, (_, t) => { for (let i = 0; i < ref.N; i++) if (ref.level[i * ref.Y + t] > 0) return true; return false; });
    cfgs[c.id] = cfg; s0[c.id] = scorePaths(ref, cfg);
  }
  const Wmemo = {};
  const W = (id, l) => (Wmemo[`${id}|${l}`] !== undefined ? Wmemo[`${id}|${l}`] : (Wmemo[`${id}|${l}`] = paired(s0[id], scorePaths(S.trace(id, l), cfgs[id])).d));
  const G = (id, l) => cases.find(c => c.id === id).worlds[l].map(w => w.table - w.sim);
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  console.log(`7V: IS THE READER'S HARM THE SWITCH MARGIN HOLDING A NEAR-TIE? (predictions/diag-7v.md; ${N} paths of seed ${SEED}; the fair-test gate passed: the stamps, every case's settings, every run and trace)\n`);
  console.log('EVERY RUN: survival; against the product (OFF/1e-3 on the same case) saved/lost; pension switches a path (reversed within three years); the realised whole score against the product, points, and its parts - survival, estate, cuts, raises (grade C: reported; its standard error is printed, not read as an interval)');
  for (const c of cases) {
    const ref = S.trace(c.id, PRODUCT), P0 = parts(ref, cfgs[c.id]);
    console.log(`${c.id} (margin ${marginFor(survivedShare(ref.survived))}; solves ${CASES[c.id].arms.map(a => `${a} ${c.solve[a].secs} s`).join(', ')})`);
    for (const a of CASES[c.id].arms) console.log(`  year-0 gap ${a.padEnd(9)} ${c.gap[a].gap} (the pension tier it opens in at ${MARG.join(', ')}: ${c.gap[a].open.join(', ')})`);
    for (const l of runsOf(c.id)) {
      const X = S.trace(c.id, l), k = cells(ref.survived, X.survived), sw = switching(X), w = paired(s0[c.id], scorePaths(X, cfgs[c.id])), P = parts(X, cfgs[c.id]);
      const d = key => f3(mean(P[key]) - mean(P0[key]));
      console.log(`  ${l.padEnd(16)} ${survivedShare(X.survived).toFixed(3)}  ${String(k.saved).padStart(4)}/${String(k.lost).padEnd(4)} switches ${sw.perPath.toFixed(2)} (${(100 * sw.rev3).toFixed(0)}%)  whole score ${f3(w.d)} +/- ${w.se.toFixed(3)} = survival ${d('s')} estate ${d('e')} cuts ${d('cu')} raises ${d('ra')}  (${c.runs[l].secs} s)`);
    }
    for (const [l, ws] of Object.entries(c.worlds)) console.log(`  world ${l.padEnd(14)} ${ws.map(wd => `z ${wd.z.toFixed(2)}: table ${wd.table.toFixed(2)} realised ${wd.sim.toFixed(2)} (gap ${(wd.table - wd.sim).toFixed(2)})`).join('; ')}`);
    if (HARMED.includes(c.id)) {
      const deep = deepIdx(Number(SEED), N, ref.Y);
      console.log(`  the deep bad world (${deep.length} paths with a long-run shift below -sqrt 3), survival: ${runsOf(c.id).map(l => `${l} ${(100 * deep.filter(i => S(c.id, l)[i]).length / deep.length).toFixed(1)}%`).join(', ')}`);
    }
    if (c.id.startsWith('S172')) {
      const share = (X, f) => { let n = 0, y = 0; for (let i = 0; i < X.N; i++) { const last = X.failYear[i] >= 0 ? X.failYear[i] - 1 : X.Y - 1; for (let t = 0; t <= last; t++) { n++; if (f(riskStep(X.tier[i * X.Y + t] >> 2))) y++; } } return (100 * y / n).toFixed(1); };
      console.log(`  O16's measure, the share of years at the plan's tier / above it: ${runsOf(c.id).map(l => `${l} ${share(S.trace(c.id, l), s => s === 0)}% / ${share(S.trace(c.id, l), s => s > 0)}%`).join(', ')}`);
    }
  }
  const it = items(S, W, G);
  console.log('\nTHE ITEMS (1-8 and 10 each a Holm family of its own, the regimen\'s reading deciding, the unconditional one beside it; 11-13 on point figures, grade C)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs) console.log(`     ${legText(l)}`);
    for (const e of x.extra || []) console.log(`     ${e}`);
  }
  console.log(`\nITEMS 1, 2 AND 10 ON PATHS ${HOLD + 1}-${N} (reported: the timing measurement ran S126 on paths 1-${HOLD} before registration; the ninety-third review, BLOCKING 3, and the ninety-fourth, BLOCKING 2)`);
  for (const l of heldOut(S)) console.log(`     ${legText(l)}`);
  { const h4 = heldOut4(S); console.log(`\nITEM 4 ON PATHS ${HOLD + 1}-${N} (reported: its S126 OFF legs come from OFF run lines read before registration; the maintainer, 27 Sep): ${h4.outcome}`); for (const l of h4.legs) console.log(`     ${legText(l)}`); }
  const cz = candidates(S, W);
  console.log('\n9. THE CANDIDATES FOR 7u (a list, not a verdict), by survival (the regimen\'s) and by the realised whole score (grade C): the fix alone read on S126, bridge 4 and S194 (its S360 and share 0.95 legs beside); a reader arm on all five core cases, and by survival it must also gain on S360 and share 0.95');
  for (const x of cz) console.log(`  ${x.l.padEnd(12)} survival ${x.ok ? 'CANDIDATE' : 'no       '} whole score ${x.okW ? 'CANDIDATE' : 'no       '}${x.uncondOk ? '' : ' (the unconditional reading disagrees on a leg)'} | ${x.h.map(h => `${h.label} ${h.k.saved}/${h.k.lost} ${h.o}`).join('; ')}${x.g.length ? ` | ${x.g.map(q => `${q.label} ${q.k.saved}/${q.k.lost} ${q.o}`).join('; ')}` : ''}${x.beside.length ? ` | beside: ${x.beside.map(b => `${b.id} ${b.k.saved}/${b.k.lost}`).join('; ')}` : ''} | whole score ${x.ws.map(q => `${q.id} ${f3(q.w)}`).join('; ')}`);
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
  console.log(`ATTRIBUTION (the prediction's Decision rule): ${attribution(it)}`);
}
