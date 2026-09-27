/*
 * 7v'S REDUCER (PLAN.md 7v; predictions/diag-7v.md): is the reader's harm the switch margin holding a near-tie? Reads
 * batch-7v.sh's logs (results/diag7v/case*.txt, audit-s126.mjs's diag7v mode) and every run's trace beside them.
 *
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs (one code version, launched under predictions/diag-7v.md at the blob each
 * log carries). THE RUN GATE (gate()): every registered case once, with its registered settings on the case line (arms,
 * margins, lambda, plan tier, the risk-above setting, the mixture); per arm a solve, a ran and a joint line; the ran lines
 * of a case equal once the bridge read is taken out, each naming the registered settings (30 points, seed 7002, 8,000
 * paths, the case's lambda, mixture and tier above, the product's menu, raiseSurv true, failShort floor, the final year
 * exact, quad 5) and its label's bridge read; the joint line saying jointWorlds exactly when the label carries +J, the solved
 * margin 0.001, no pension death charge, the plan tier and what the risk-above rule decided; a run line for every
 * registered run (each arm at the four margins, and one policy at margin 0 with the learner) and nothing else; on the
 * harmed cases three world lines per arm at margins 0.001 and 0; the done line's count; every run's trace with the log's
 * count, seed, arm and stamp, and its survival equal to the run line's. COMPLETENESS: all nine cases, or INCOMPLETE.
 *
 * THE RULE: the regimen's (stats.mjs outcome(): the exact McNemar test with Holm, the exact 95% interval against the margin
 * for the case's survival, marginFor(), three outcomes), each item's tests a Holm family of their own, read from the traces
 * (every pair counted path by path). The unconditional interval (read-o27-unconditional.mjs guarded(survivalChangeU)) is
 * printed beside every no-material read (with its count check, read-o27-unconditional.mjs guarded(), copied below: importing it
 * would pull an unstamped module into the batch's stamp), and each place the two readings disagree is marked; the registered reading
 * decides (the regimen's item 1 waits for the maintainer). The items are the prediction's; each prints HELD, FALSIFIED or
 * INCONCLUSIVE (item 7's pairs can also read NOT REPRODUCED), and the attribution line names the explanations HELD.
 * Reported, not items: every run's survival, switching, opening tier and realised whole score against the product
 * (reduce-7t.mjs scorePaths(), grade C: the whole-score rule waits for the maintainer), and the world lines.
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
import { switching } from './read-7t-deep.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7v.md';
export const N = 8000, WP = 1000, ALPHA = 0.05, TOL = 3;
const SEED = '7002', PTS = '30', LEVELS = '1,1.1,0.95,0.9,0.8', SOLVED_MARGIN = '0.001';
export const MARG = ['1e-3', '3e-4', '1e-4', '0'];
const NODES = [-Math.sqrt(3), 0, Math.sqrt(3)];
const CORE = { lambda: '0.025', tier: 'own', riskAbove: 'auto', decided: 'off:_no_tier_above_the_plan', mix: '3', tiersAbove: '0' };
const BR = ['OFF', 'READER', 'OFF+J', 'READER+J'], NB = ['OFF', 'OFF+J'];
// the registered cases: arms, settings, and whether the case runs its world lines (the harmed cases)
export const CASES = {
  'S126': { ...CORE, arms: BR, worlds: true }, 'bridge 4': { ...CORE, arms: BR, worlds: true },
  'S360': { ...CORE, arms: BR }, 'share 0.95': { ...CORE, arms: BR }, 'S194': { ...CORE, arms: NB },
  'S172 down': { lambda: '0.6503449126242364', tier: 'Medium Risk', riskAbove: 'false', decided: 'set_false', mix: '3', tiersAbove: '0', arms: NB },
  'S172 up': { lambda: '0.6503449126242364', tier: 'Medium Risk', riskAbove: 'true', decided: 'set_true', mix: '3', tiersAbove: '1', arms: NB },
  'S330 mix3': { lambda: '0.9457416090031758', tier: 'Medium Risk', riskAbove: 'true', decided: 'set_true', mix: '3', tiersAbove: '1', arms: NB },
  'S330 mix5': { lambda: '0.9457416090031758', tier: 'Medium Risk', riskAbove: 'true', decided: 'set_true', mix: '5', tiersAbove: '1', arms: NB }};
export const HARMED = ['S126', 'bridge 4'], GAINED = ['S360', 'share 0.95'], CORE_IDS = ['S126', 'bridge 4', 'S360', 'share 0.95', 'S194'];
// every run a case registers: each arm at the four margins, then one policy at margin 0 with the learner
export const learnArm = id => (CASES[id].arms.includes('READER') ? 'READER+J' : 'OFF+J');
export const runsOf = id => [...CASES[id].arms.flatMap(a => MARG.map(m => `${a}/${m}`)), `${learnArm(id)}/0+L`];
// on a non-bridge case the reader is off (it reads no bridge), so an arm named for the reader is read on off's run
export const armOn = (id, label) => (CASES[id].arms.includes('READER') ? label : label.replace('READER', 'OFF'));
export const PRODUCT = 'OFF/1e-3';
export const traceName = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };

const CASEL = /^(.{16}) case \| arms (\S+) \| margins (\S+) \| lambda (\S+) tier (.+) riskAbove (\S+) mix (\d+)$/;
const SOLVEL = /^\s+solve (\S+): table (-?[\d.]+|-) secs (\d+)$/;
const JOINTL = /^\s+joint (\S+): (true|false) switchMargin (\S+) scale (\d+) cap (\d+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
const RUNL = /^\s+run (\S+): sim (-?[\d.]+) below (\S+) tier-below (\S+) estate (-?\d+) secs (\d+)$/;
const WORLDL = /^\s+world (\S+) (\d) z (-?[\d.]+): table (-?[\d.]+) sim (-?[\d.]+) estate table (-?\d+) sim (-?\d+) tier-below (\S+) paths (\d+)$/;

// one log's cases
export function parse(text) {
  const cases = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) {
      cur = { id: m[1].trim(), arms: m[2].split(','), margins: m[3].split(','), lambda: m[4], tier: m[5], riskAbove: m[6], mix: m[7], solve: {}, ran: {}, joint: {}, runs: {}, worlds: {}, done: null };
      cases.push(cur); continue;
    }
    if (!cur) continue;
    if ((m = SOLVEL.exec(line))) { cur.solve[m[1]] = { table: +m[2], secs: +m[3] }; continue; }
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
const cpUpper = (k, n, level) => clopperPearson(k, n, level)[1];
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
 * THE ITEMS (the prediction's, in its order). `S(id, label)` is a run's survived array; the margin is the case's
 * (marginFor() of the product's survival on that case).
 */
export function items(S) {
  const margin = id => marginFor(survivedShare(S(id, PRODUCT)));
  const leg = (id, A, B, label) => ({ id, label: label || `${id}: ${B} against ${A}`, k: cells(S(id, A), S(id, B)), margin: margin(id) });
  const out = [];
  // 1. the reader's harm at the product's settings
  const i1 = harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER/1e-3')));
  out.push({ n: 1, text: 'the reader harms against the product at the product\'s own settings (READER/1e-3 against OFF/1e-3), on both harmed cases', legs: i1, outcome: tri(i1, x => x.o === 'harm', x => x.o === 'no material harm') });
  // 2. the margin carries the reader's own harm: at margin 0 the reader does no material harm against off at margin 0
  const i2 = harmFamily(HARMED.map(id => leg(id, 'OFF/0', 'READER/0')));
  out.push({ n: 2, text: 'at switch margin 0 the reader does no material harm against off at margin 0 (the reader\'s own harm is the margin\'s), on both harmed cases', legs: i2, outcome: tri(i2, x => x.o === 'no material harm', x => x.o === 'harm') });
  // 3. the dose-response against the product: one policy's net paths rise (within TOL) as the margin falls, and at 0 no
  // material harm, on both harmed cases
  const net = (id, l) => { const k = cells(S(id, PRODUCT), S(id, l)); return k.saved - k.lost; };
  const i3h = harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER+J/0')));
  const i3 = HARMED.map((id, j) => {
    const ns = MARG.map(m => net(id, `READER+J/${m}`)), mono = ns.every((v, q) => q === 0 || v >= ns[q - 1] - TOL) && ns[3] > ns[0];
    return { id, ns, mono, h: i3h[j], rises: mono && i3h[j].o === 'no material harm', falls: ns[3] < ns[0] || i3h[j].o === 'harm' };
  });
  out.push({ n: 3, text: `against the product, one policy's net paths (saved less lost) rise as the margin falls (each step within ${TOL} paths, and more at 0 than at 0.001) and at margin 0 it does no material harm, on both harmed cases`, legs: i3h, extra: i3.map(x => `${x.id} READER+J net at ${MARG.join(', ')}: ${x.ns.join(', ')}${x.mono ? '' : ' (not rising)'}`), outcome: tri(i3, x => x.rises, x => x.falls) });
  // 4. table noise: on any core case one policy's best net sits at a small positive margin and margin 0 harms against it
  const i4 = CORE_IDS.map(id => { const X = armOn(id, 'READER+J'), ns = ['3e-4', '1e-4'].map(m => net(id, `${X}/${m}`)), pk = ns[0] >= ns[1] ? '3e-4' : '1e-4'; return { id, X, pk, at: `${X}/${pk}` }; });
  const i4h = harmFamily(i4.map(x => leg(x.id, x.at, `${x.X}/0`)));
  out.push({ n: 4, text: 'table noise: margin 0 harms against one policy\'s better small positive margin (3e-4 or 1e-4) on at least one core case', legs: i4h, outcome: i4h.some(x => x.o === 'harm') ? 'HELD' : i4h.every(x => x.o === 'no material harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 5. a separate clairvoyance error: one policy gains against the reader at margins 1e-4 and 0, on both harmed cases
  const i5 = gainFamily(HARMED.flatMap(id => ['1e-4', '0'].map(m => leg(id, `READER/${m}`, `READER+J/${m}`))));
  out.push({ n: 5, text: 'one policy for every world gains against the reader at switch margins 1e-4 and 0, on both harmed cases (a clairvoyance error the margin does not carry)', legs: i5, outcome: tri(i5, x => x.o === 'gain', x => x.o === 'no material gain') });
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
  // 8. a small margin keeps switching rare: one policy's pension switches a path at 1e-4 at most half of those at 0, on both
  const sw = (id, l) => switching(S.trace(id, l)).perPath;
  const i8 = HARMED.map(id => ({ id, a: sw(id, 'READER+J/1e-4'), z: sw(id, 'READER+J/0') }));
  out.push({ n: 8, text: 'a small margin keeps switching rare: one policy\'s pension switches a path at margin 1e-4 are at most half those at margin 0, on both harmed cases', legs: [], extra: i8.map(x => `${x.id} ${x.a.toFixed(2)} at 1e-4, ${x.z.toFixed(2)} at 0`), outcome: i8.every(x => x.a <= x.z / 2) ? 'HELD' : 'FALSIFIED' });
  return out;
}
/*
 * THE CANDIDATES FOR 7u (item 9, a list, not a verdict): each arm at a margin below the product's - the fix alone (OFF/m,
 * OFF+J/m) and the reader with it (READER/m, READER+J/m; on S194 read on off's run) - that does no material harm against the
 * product on every core case (a harm family per arm over the five cases); a reader arm must also gain on S360 and share 0.95
 * (a gain family per arm over the two). The regimen's reading; the unconditional one marked where it disagrees.
 */
export function candidates(S) {
  const margin = id => marginFor(survivedShare(S(id, PRODUCT)));
  const out = [];
  for (const X of ['OFF', 'OFF+J', 'READER', 'READER+J']) for (const m of MARG) {
    if (X === 'OFF' && m === '1e-3') continue;   // the product itself
    const l = `${X}/${m}`;
    const h = harmFamily(CORE_IDS.map(id => ({ id, label: `${id}`, k: cells(S(id, PRODUCT), S(id, armOn(id, l))), margin: margin(id) })));
    const g = X.startsWith('READER') ? gainFamily(GAINED.map(id => ({ id, label: `${id}`, k: cells(S(id, PRODUCT), S(id, l)), margin: margin(id) }))) : [];
    const ok = h.every(x => x.o === 'no material harm') && g.every(x => x.o === 'gain');
    out.push({ l, ok, h, g, uncondOk: h.every(x => !x.disagree) && g.every(x => !x.disagree) });
  }
  return out;
}
export function attribution(it) {
  const o = n => it.find(x => x.n === n).outcome;
  const held = [];
  if (o(2) === 'HELD' && o(3) === 'HELD') held.push('P, the margin holding a near-tie (items 2 and 3)');
  if (o(4) === 'HELD') held.push('N, table noise at margin 0 (item 4)');
  if (o(5) === 'HELD') held.push('C, a clairvoyance error the margin does not carry (item 5)');
  if (o(6) === 'HELD') held.push('L, a learning error the margin does not carry (item 6)');
  const pre = o(1) === 'FALSIFIED' ? 'the reader does no material harm at the product\'s settings (item 1 FALSIFIED): the harm was 7e\'s and 7t\'s settings\'; ' : o(1) === 'INCONCLUSIVE' ? 'the harm at the product\'s settings is not settled (item 1 INCONCLUSIVE); ' : '';
  return `${pre}${held.length ? `HELD: ${held.join('; ')}` : 'no explanation HELD'}`;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const ranOf = (id, br) => { const R = CASES[id]; return `mix ${R.mix} pts 30 seed 7002 paths 8000 grid total30x6x6 lambda ${R.lambda} levels ${LEVELS} raiseSurv true failShort floor tiersAbove ${R.tiersAbove} minPot 29000 quad 5 finalIntegral true bridgeRead ${br}`; };
  const log = (id, { ran = {}, joint = {}, drop = '', runs = null, done = null, caseLine = null, worlds = null } = {}) => {
    const R = CASES[id], L = [caseLine || `${id.padEnd(16)} case | arms ${R.arms.join(',')} | margins ${MARG.join(',')} | lambda ${R.lambda} tier ${R.tier} riskAbove ${R.riskAbove} mix ${R.mix}`];
    for (const a of R.arms) {
      L.push(`${''.padEnd(16)} solve ${a}: table 99.50 secs 400`, `${''.padEnd(16)} ran ${a}: ${ran[a] || ranOf(id, a.startsWith('READER') ? 'reader' : 'false')}`,
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
  // in both; the product fails its first 400 paths (95% survival), so a run saves among those and loses among the rest
  const mkS = (spec, sw = {}, fail = {}) => {
    const cache = {};
    const S = (id, label) => {
      const key = `${id}|${label}`;
      if (cache[key]) return cache[key];
      const out = new Uint8Array(N).fill(1);
      for (let i = 0; i < (fail[id] || 400); i++) out[i] = 0;
      // a case's own product is moved only when the story names it (the family pairs: S172 up's and S330 mix5's)
      if (label !== PRODUCT || (spec[id] || {})[label]) { const [sv, ls] = (spec[id] || {})[label] || [0, 0]; for (let i = 0; i < sv; i++) out[i] = 1; for (let i = 0; i < ls; i++) out[(fail[id] || 400) + i] = 0; }
      return (cache[key] = out);
    };
    // a one-path trace with exactly k pension switches (the plan's tier and two below, alternating, then held)
    S.trace = (id, label) => { const k = (sw[id] || {})[label] || 0, Y = 8, T = { N: 1, Y, tier: new Uint8Array(Y), failYear: Int16Array.from([-1]) }; for (let t = 1; t < Y; t++) T.tier[t] = t <= k ? (t % 2 ? 8 : 0) : T.tier[t - 1]; return T; };
    return S;
  };
  // the story in which everything reads as the prediction says: the reader harms at 0.001 (0 saved, 40 lost), is gone at 0
  // against off at 0, one policy rises to no harm at 0, no noise, no clairvoyance or learning gain, the pairs meet
  const good = {};
  for (const id of HARMED) good[id] = { 'READER/1e-3': [0, 40], 'OFF/0': [0, 5], 'READER/0': [0, 5], 'READER+J/1e-3': [0, 40], 'READER+J/3e-4': [0, 20], 'READER+J/1e-4': [0, 8], 'READER+J/0': [0, 2], 'READER/1e-4': [0, 8], 'READER+J/0+L': [0, 2] };
  good['S172 up'] = { 'OFF/1e-3': [0, 60] }; good['S330 mix5'] = { 'OFF/1e-3': [40, 0] };
  const it0 = items(mkS(good, { S126: { 'READER+J/1e-4': 1, 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/1e-4': 1, 'READER+J/0': 3 } }));
  const o = (it, n) => it.find(x => x.n === n).outcome;
  const cases = [
    ['a log parsed: nine cases; S126 four arms, 17 runs, worlds at 1e-3 and 0, a joint line\'s decision', `${c0.length} ${c0[0].arms.length} ${Object.keys(c0[0].runs).length} ${Object.keys(c0[0].worlds).length} ${c0[0].joint['READER+J'].decided}`, '9 4 17 8 off:_no_tier_above_the_plan'],
    ['the gate passes a log at the registered settings', String(gate(c0).length), '0'],
    ['the gate refuses a second setting changed between arms', String(g({ S126: { ran: { 'READER+J': ranOf('S126', 'reader').replace('minPot 29000', 'minPot 30000') } } })), 'true'],
    ['the gate refuses the wrong seed (on every arm, so only the seed check sees it)', String(g({ S126: { ran: Object.fromEntries(BR.map(a => [a, ranOf('S126', a.startsWith('READER') ? 'reader' : 'false').replace('seed 7002', 'seed 7004')])) } })), 'true'],
    ['the gate refuses 16 points on every arm (the grid line left at 30)', String(g({ S360: { ran: Object.fromEntries(BR.map(a => [a, ranOf('S360', a.startsWith('READER') ? 'reader' : 'false').replace('pts 30', 'pts 16')])) } })), 'true'],
    ['the gate refuses a 16-point grid on every arm (the points left at 30)', String(g({ S360: { ran: Object.fromEntries(BR.map(a => [a, ranOf('S360', a.startsWith('READER') ? 'reader' : 'false').replace('total30x6x6', 'total16x6x6')])) } })), 'true'],
    ['the gate refuses the reference lambda on every arm of S172 (its own is registered)', String(g({ 'S172 up': { ran: Object.fromEntries(NB.map(a => [a, ranOf('S172 up', 'false').replace('0.6503449126242364', '0.025')])) } })), 'true'],
    ['the gate refuses a case line that names another lambda', String(g({ 'S172 up': { caseLine: `${'S172 up'.padEnd(16)} case | arms OFF,OFF+J | margins ${MARG.join(',')} | lambda 0.025 tier Medium Risk riskAbove true mix 3` } })), 'true'],
    ['the gate refuses a tier above that did not open on S172 up', String(g({ 'S172 up': { ran: Object.fromEntries(NB.map(a => [a, ranOf('S172 up', 'false').replace('tiersAbove 1', 'tiersAbove 0')])) } })), 'true'],
    ['the gate refuses five worlds run as three', String(g({ 'S330 mix5': { ran: Object.fromEntries(NB.map(a => [a, ranOf('S330 mix5', 'false').replace('mix 5', 'mix 3')])) } })), 'true'],
    ['the gate refuses an arm whose joint line does not match its label', String(g({ S126: { joint: { 'READER+J': false } } })), 'true'],
    ['the gate refuses a risk-above decision the prediction does not name', String(gate(parse(all9().replace('deathTax 0 tier own riskAbove off:_no_tier_above_the_plan', 'deathTax 0 tier own riskAbove on:_thin'))).length > 0), 'true'],
    ['the gate refuses a missing run', String(g({ S126: { drop: 'run READER+J/1e-4:' } })), 'true'],
    ['the gate refuses a missing learner run', String(g({ 'bridge 4': { drop: '/0+L:' } })), 'true'],
    ['the gate refuses a missing world line (the middle world, so the count stays three)', String(g({ S126: { drop: 'world READER/0 1 ' } })), 'true'],
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
    ['the story as predicted reads items 1-8 as HELD, HELD, HELD, FALSIFIED, FALSIFIED, FALSIFIED, HELD, HELD', [1, 2, 3, 4, 5, 6, 7, 8].map(n => o(it0, n)).join(','), 'HELD,HELD,HELD,FALSIFIED,FALSIFIED,FALSIFIED,HELD,HELD'],
    ['the attribution of that story names P alone', attribution(it0), 'HELD: P, the margin holding a near-tie (items 2 and 3)'],
  ];
  // the opposite story: no harm at 0.001; the reader keeps harming at 0; one policy falls; noise at 0; clairvoyance and
  // learning gain; the pairs stay
  const bad = {};
  for (const id of HARMED) bad[id] = { 'READER/1e-3': [0, 1], 'OFF/0': [0, 0], 'READER/0': [0, 40], 'READER+J/1e-3': [0, 5], 'READER+J/3e-4': [0, 5], 'READER+J/1e-4': [0, 5], 'READER+J/0': [0, 40], 'READER/1e-4': [0, 40], 'READER+J/0+L': [40, 0] };
  for (const id of HARMED) { bad[id]['READER+J/1e-4'] = [40, 5]; bad[id]['READER+J/0'] = [40, 0]; bad[id]['READER/0'] = [0, 40]; bad[id]['READER+J/0+L'] = [80, 0]; }
  bad.S360 = { 'READER+J/3e-4': [30, 0], 'READER+J/0': [0, 60] };
  bad['S172 up'] = { 'OFF/1e-3': [0, 60], 'OFF/0': [0, 60] }; bad['S330 mix5'] = { 'OFF/1e-3': [40, 0], 'OFF/0': [40, 0] };
  const it1 = items(mkS(bad, { S126: { 'READER+J/1e-4': 3, 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/1e-4': 3, 'READER+J/0': 3 } }));
  cases.push(['the opposite story reads item 1 FALSIFIED, 2 FALSIFIED, 4 HELD, 5 HELD, 6 HELD, 7 FALSIFIED, 8 FALSIFIED', [1, 2, 4, 5, 6, 7, 8].map(n => o(it1, n)).join(','), 'FALSIFIED,FALSIFIED,HELD,HELD,HELD,FALSIFIED,FALSIFIED']);
  cases.push(['item 3 reads FALSIFIED when one policy harms at 0 on both', (() => { const s = JSON.parse(JSON.stringify(good)); for (const id of HARMED) s[id]['READER+J/0'] = [0, 60]; return o(items(mkS(s, { S126: { 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/0': 3 } })), 3); })(), 'FALSIFIED']);
  cases.push(['item 3 reads INCONCLUSIVE when it rises on one case and falls on the other', (() => { const s = JSON.parse(JSON.stringify(good)); s['bridge 4']['READER+J/0'] = [0, 60]; return o(items(mkS(s, { S126: { 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/0': 3 } })), 3); })(), 'INCONCLUSIVE']);
  cases.push(['item 3 does not rise when a step falls by more than the tolerance (net -40, -20, -25, -2)', (() => { const s = JSON.parse(JSON.stringify(good)); for (const id of HARMED) s[id]['READER+J/1e-4'] = [0, 25]; return o(items(mkS(s, { S126: { 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/0': 3 } })), 3); })(), 'INCONCLUSIVE']);
  cases.push(['item 7 reads NOT REPRODUCED when neither pair differs at 0.001', (() => { const s = JSON.parse(JSON.stringify(good)); s['S172 up'] = {}; s['S330 mix5'] = {}; return o(items(mkS(s, { S126: { 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/0': 3 } })), 7); })(), 'NOT REPRODUCED']);
  cases.push(['item 7 reads HELD on one reproduced pair that meets, the other not reproduced', (() => { const s = JSON.parse(JSON.stringify(good)); s['S330 mix5'] = {}; return o(items(mkS(s, { S126: { 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/0': 3 } })), 7); })(), 'HELD']);
  cases.push(['item 7 reads S330\'s pair by its gain (mix5 against mix3), not S172\'s harm', items(mkS(good, { S126: { 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/0': 3 } })).find(x => x.n === 7).extra.join('; '), 'S172 (O16): MEETS; S330 (O21): MEETS']);
  const SW = { S126: { 'READER+J/0': 3 }, 'bridge 4': { 'READER+J/0': 3 } };
  const cp = x => JSON.parse(JSON.stringify(x));
  cases.push(['the margin follows the product\'s survival: at 94% a loss of 30 paths (0.375) is not harm by the 0.5 margin, so item 1 reads FALSIFIED', o(items(mkS((() => { const s = cp(good); for (const id of HARMED) s[id]['READER/1e-3'] = [0, 30]; return s; })(), SW, { S126: 480, 'bridge 4': 480 })), 1), 'FALSIFIED']);
  cases.push(['item 2 reads the reader against off at margin 0, not against the product (both lose the same 40 paths)', o(items(mkS((() => { const s = cp(good); for (const id of HARMED) { s[id]['OFF/0'] = [0, 40]; s[id]['READER/0'] = [0, 40]; } return s; })(), SW)), 2), 'HELD']);
  cases.push(['item 3 rises through a step that falls within the tolerance (net -40, -20, -22, -2)', o(items(mkS((() => { const s = cp(good); for (const id of HARMED) s[id]['READER+J/1e-4'] = [0, 22]; return s; })(), SW)), 3), 'HELD']);
  cases.push(['item 3 reads FALSIFIED when it rises but still harms at 0 (net -80, -60, -40, -30)', o(items(mkS((() => { const s = cp(good); for (const id of HARMED) { s[id]['READER+J/1e-3'] = [0, 80]; s[id]['READER+J/3e-4'] = [0, 60]; s[id]['READER+J/1e-4'] = [0, 40]; s[id]['READER+J/0'] = [0, 30]; } return s; })(), SW)), 3), 'FALSIFIED']);
  cases.push(['item 7 names an unreproduced pair NOT REPRODUCED', (() => { const s = cp(good); s['S330 mix5'] = {}; return items(mkS(s, SW)).find(x => x.n === 7).extra.join('; '); })(), 'S172 (O16): MEETS; S330 (O21): NOT REPRODUCED']);
  cases.push(['item 3 does not rise when it is flat (net -5 at every margin, no harm at 0)', o(items(mkS((() => { const s = cp(good); for (const id of HARMED) for (const m of MARG) s[id][`READER+J/${m}`] = [0, 5]; return s; })(), SW)), 3), 'INCONCLUSIVE']);
  cases.push(['item 4 reads margin 0 against the better small margin, 3e-4 here (60 saved there, none at 1e-4 or 0)', o(items(mkS((() => { const s = cp(good); s.S360 = { 'READER+J/3e-4': [60, 0] }; return s; })(), SW)), 4), 'HELD']);
  cases.push(['item 5 needs a gain at 1e-4 as well as at 0 (a gain at 0 alone is INCONCLUSIVE)', o(items(mkS((() => { const s = cp(good); for (const id of HARMED) { s[id]['READER/0'] = [0, 40]; s[id]['READER+J/0'] = [40, 0]; } return s; })(), SW)), 5), 'INCONCLUSIVE']);
  cases.push(['the attribution names P only with item 3 as well as item 2', attribution([1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ n, outcome: n === 1 || n === 2 ? 'HELD' : n === 3 ? 'INCONCLUSIVE' : 'FALSIFIED' }))), 'no explanation HELD']);
  // the candidates: in `good`, READER+J/0 does no harm on the harmed cases and the rest are untouched (no harm), but no reader
  // arm gains on S360 and share 0.95, so none is a candidate; give READER+J/0 its gains there and it is
  const cz = candidates(mkS(good)), wg = JSON.parse(JSON.stringify(good)); for (const id of GAINED) wg[id] = { 'READER+J/0': [40, 0] };
  const cz2 = candidates(mkS(wg));
  cases.push(['the candidates: no reader arm without its gains; READER+J/0 with them; the fix alone at 1e-4 (no harm anywhere)', `${cz.filter(x => x.ok && x.l.startsWith('READER')).length} ${cz2.filter(x => x.ok && x.l.startsWith('READER')).map(x => x.l).join(',')} ${cz.find(x => x.l === 'OFF+J/1e-4').ok}`, '0 READER+J/0 true']);
  cases.push(['a candidate refused for harm on one core case (S194 read on off\'s run for a reader arm)', (() => { const s = JSON.parse(JSON.stringify(wg)); s.S194 = { 'OFF+J/0': [0, 60] }; return String(candidates(mkS(s)).find(x => x.l === 'READER+J/0').ok); })(), 'false']);
  cases.push(['the reader is off on a non-bridge case', `${armOn('S194', 'READER+J/0')} ${armOn('S126', 'READER+J/0')}`, 'OFF+J/0 READER+J/0']);
  cases.push(['the product is never a candidate of its own', String(candidates(mkS(good)).some(x => x.l === PRODUCT)), 'false']);
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
  console.log(`7V: IS THE READER'S HARM THE SWITCH MARGIN HOLDING A NEAR-TIE? (predictions/diag-7v.md; ${N} paths of seed ${SEED}; the fair-test gate passed: the stamps, every case's settings, every run and trace)\n`);
  console.log('EVERY RUN: survival; against the product (OFF/1e-3 on the same case) saved/lost; pension switches a path (reversed within three years); opening pension tier (share of paths below the plan\'s tier in year 0); the realised whole score against the product, points (grade C: reported, not a verdict)');
  for (const c of cases) {
    const ran = c.ran[CASES[c.id].arms[0]], jn = c.joint[CASES[c.id].arms[0]], ref = S.trace(c.id, PRODUCT);
    const cfg = { lambda: Number(field(ran, 'lambda')), floor: Math.min(...field(ran, 'levels').split(',').map(Number)), scale: jn.scale, cap: jn.cap };
    cfg.spendYears = Array.from({ length: ref.Y }, (_, t) => { for (let i = 0; i < ref.N; i++) if (ref.level[i * ref.Y + t] > 0) return true; return false; });
    const s0 = scorePaths(ref, cfg);
    console.log(`${c.id} (margin ${marginFor(survivedShare(ref.survived))}; solves ${CASES[c.id].arms.map(a => `${a} ${c.solve[a].secs} s`).join(', ')})`);
    for (const l of runsOf(c.id)) {
      const X = S.trace(c.id, l), k = cells(ref.survived, X.survived), sw = switching(X), w = paired(s0, scorePaths(X, cfg));
      let open = 0; for (let i = 0; i < X.N; i++) if (riskStep(X.tier[i * X.Y] >> 2) < 0) open++;
      console.log(`  ${l.padEnd(16)} ${survivedShare(X.survived).toFixed(3)}  ${String(k.saved).padStart(4)}/${String(k.lost).padEnd(4)} switches ${sw.perPath.toFixed(2)} (${(100 * sw.rev3).toFixed(0)}%)  opening below ${(100 * open / X.N).toFixed(1)}%  whole score ${f3(w.d)} +/- ${w.se.toFixed(3)}  (${c.runs[l].secs} s)`);
    }
    for (const [l, ws] of Object.entries(c.worlds)) console.log(`  world ${l.padEnd(14)} ${ws.map((w, k) => `z ${w.z.toFixed(2)}: table ${w.table.toFixed(2)} realised ${w.sim.toFixed(2)} (gap ${(w.table - w.sim).toFixed(2)})`).join('; ')}`);
  }
  const it = items(S);
  console.log('\nTHE ITEMS (each a Holm family of its own; the regimen\'s reading decides, the unconditional one beside it)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs) console.log(`     ${legText(l)}`);
    for (const e of x.extra || []) console.log(`     ${e}`);
  }
  const cz = candidates(S);
  console.log('\n9. THE CANDIDATES FOR 7u (a list, not a verdict): no material harm against the product on every core case, and for a reader arm a gain on S360 and share 0.95');
  for (const x of cz) console.log(`  ${x.l.padEnd(12)} ${x.ok ? 'CANDIDATE' : 'no       '}${x.uncondOk ? '' : ' (the unconditional reading disagrees on a leg)'} | ${x.h.map(h => `${h.label} ${h.k.saved}/${h.k.lost} ${h.o}`).join('; ')}${x.g.length ? ` | ${x.g.map(q => `${q.label} ${q.k.saved}/${q.k.lost} ${q.o}`).join('; ')}` : ''}`);
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
  console.log(`ATTRIBUTION (the prediction's Decision rule): ${attribution(it)}`);
}
