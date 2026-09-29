/*
 * 7AH: O36'S FIX, THE READER'S REFERENCE DRAWN POT BY POT IN THE MENU'S BETTER ORDER (PLAN.md 7ah; predictions/diag-7ah.md;
 * PLAN.md O36 "where it can move a choice"; solve.js readerRef 'order', reader.js orderChance). The bundle (READER/TS+J) and
 * the bundle with the order reference (ORDER/TS+J) on the six panel households whose bridge is three years or more, at the
 * product's default estate weight 0.02 and its lowest reachable 0.01 (the whole-score rule's two settings: the maintainer,
 * 29 Sep 09:08 UK), 8,000 paths of seed 7002 (audit-s126.mjs diag7ah).
 *
 * THE GATE, before anything is read: every unit once, done, at the registered settings; ORDER's ran line is READER's with
 * " readerRef order" and nothing else; the 0.01 solves are the 0.02 solves with the estate weight changed and nothing else;
 * READER/TS+J/W0.02 is 7af's CAND (bridge 4, bridge 6, S360) or 7ag's (S366, S370, bridge 4+cost) solved again on this
 * code - its ran line (the path count aside) and table theirs, and its trace's survival, tiers and spend levels theirs path
 * by path on the first 8,000 paths (7ag ran 16,000; the draws are prefix-consistent); every trace stamped as its log.
 *
 * THE ITEMS (the regimen's exact rule; single look):
 *   1. survival at 0.02: ORDER against READER, no material harm on every household - the exact rule with Holm across the
 *      six, each at its margin (0.25 where READER survives 95% or more at 0.02 in 7af's or 7ag's record, else 0.5), and the
 *      guarded unconditional interval's lower end above minus the margin. HELD if every household passes; FALSIFIED on harm
 *      on any; else INCONCLUSIVE.
 *   2. the whole score at 0.02 (reduce-7aa.mjs wholeLeg at 0.05): no material harm on every household, each at its margin
 *      (item 1's: the regimen's, as the adopted rule reads it). HELD if every lower end is above minus the margin;
 *      FALSIFIED if any upper end is below it; else INCONCLUSIVE.
 *   3. and 4. items 1 and 2 at 0.01.
 *   5. O36's pessimism on S360 (the only one of the six whose table misses its simulation by more than 5 points: 7af's
 *      32.67 against 45.94): at 0.02, ORDER's |table - simulated| at most half READER's (HELD); 0.9 of it or more
 *      (FALSIFIED); else INCONCLUSIVE.
 * Reported, not items: every unit's table, simulation, table error, year-0 gap and opening; S370's table error (7ag's
 * READER table sits 4.80 above its simulation: an optimistic table the fix may push further) beside the other five.
 *   node research/solver/reduce-7ah.mjs [dir] [dir7af] [dir7ag]        node research/solver/reduce-7ah.mjs --planted
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { survivalChangeU, mcnemarHarmP, holm, outcome } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import * as F from './reduce-7af.mjs';
import * as G from './reduce-7ag.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ah.md';
export const { field, LAMBDA, LEVELS } = A;
export const N = 8000, SEED = '7002', PTS = '30', ALPHA = 0.05, SIM_TOL = 5e-5 + 1e-9, R5 = { held: 0.5, falsified: 0.9 };
export const PANEL = [['bridge 4', 4], ['bridge 6', 6], ['S360', 8], ['S366', 8], ['S370', 8], ['bridge 4+cost', 4]];
export const FROM_AF = ['bridge 4', 'bridge 6', 'S360'];
// READER's survival at 0.02 in 7af's and 7ag's records (results-7af.txt, results-7ag.txt): 99.59, 99.40, 45.94, 99.17, 74.69, 99.25
export const MARGIN = { 'bridge 4': 0.25, 'bridge 6': 0.25, S360: 0.5, S366: 0.25, S370: 0.5, 'bridge 4+cost': 0.25 };
export const WS = ['0.02', '0.01'];
export const UNITS = WS.flatMap(w => ['ORDER', 'READER'].flatMap(arm => PANEL.map(([id]) => [id, arm, `TS+J/W${w}`])));
export const parse = A.parse;
export const traceName = A.traceName;
const withPaths = (ran, n) => ran.replace(/(^| )paths \d+(?= |$)/, `$1paths ${n}`);
const noRef = ran => ran.replace(/ readerRef order(?= |$)/, '');
const atW = (ran, w) => ran.replace(/(^| )bequestWeight \S+/, `$1bequestWeight ${w}`);
const wOf = label => label.split('/W')[1];

/* THE GATE. `ref(id)` the reference CAND unit (7af's or 7ag's parsed unit) */
export function gate(units, ref, { n = N, pts = PTS } = {}) {
  const bad = [];
  for (const [id, arm, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.label === l).length; if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }
  const get = (id, arm, w) => units.find(u => u.id === id && u.arm === arm && u.label === `TS+J/W${w}`);
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const w = wOf(u.label);
    if (u.table === undefined) bad.push(`${tag}: no solve line`);
    if (!u.ran) bad.push(`${tag}: no ran line`);
    else {
      const want = { mix: '3', pts, seed: SEED, paths: String(n), grid: `total${pts}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', quad: '5', finalIntegral: 'true', bequestWeight: w, bridgeRead: 'reader' };
      for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
      if (!field(u.ran, 'tierState')) bad.push(`${tag}: ran without the tier state`);
      if (field(u.ran, 'readerRef') !== (u.arm === 'ORDER' ? 'order' : null)) bad.push(`${tag}: ran readerRef ${field(u.ran, 'readerRef')}`);
      for (const k of ['holdTier', 'bridgeStep', 'switchMargin', 'switchCharge']) if (field(u.ran, k) !== null) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}`);
    }
    if (!u.gap) bad.push(`${tag}: no year-0 gap line`);
    if (!u.joint) bad.push(`${tag}: no joint line`);
    else {
      if (!u.joint.joint) bad.push(`${tag}: ran jointWorlds ${u.joint.joint}`);
      if (u.joint.margin !== '0.001') bad.push(`${tag}: solved with switch margin ${u.joint.margin}`);
      if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax}`);
      if (u.joint.tier !== 'own') bad.push(`${tag}: plan tier ${u.joint.tier}`);
    }
    if (u.worlds.length) bad.push(`${tag}: world lines, not registered`);
    if (!u.run) bad.push(`${tag}: no run line`);
    if (!u.done) bad.push(`${tag}: no done line`);
    // ORDER is READER with the order reference and nothing else; 0.01 is 0.02 with the estate weight and nothing else
    const R = get(u.id, 'READER', w);
    if (u.arm === 'ORDER' && u.ran && R && R.ran && noRef(u.ran) !== R.ran) bad.push(`${tag}: its ran line is not READER's with readerRef order`);
    if (w === '0.01') { const R2 = get(u.id, u.arm, '0.02'); if (u.ran && R2 && R2.ran && atW(u.ran, '0.02') !== R2.ran) bad.push(`${tag}: its ran line is not the 0.02 solve's with the estate weight`); }
    if (u.joint) for (const v of units.filter(v => v.id === u.id && v.joint)) if (u.joint.scale !== v.joint.scale || u.joint.decided !== v.joint.decided) bad.push(`${tag}: scale or risk-above decision differs within the household`);
    // READER at 0.02 is 7af's or 7ag's CAND
    if (u.arm === 'READER' && w === '0.02') {
      const c = ref(u.id);
      if (!c) bad.push(`${tag}: no 7af or 7ag CAND unit to hold it to`);
      else {
        if (u.ran && withPaths(c.ran, n) !== u.ran) bad.push(`${tag}: its ran line is not ${FROM_AF.includes(u.id) ? '7af' : '7ag'}'s CAND (the path count aside)`);
        if (u.table !== c.table) bad.push(`${tag}: its table ${u.table} is not ${FROM_AF.includes(u.id) ? '7af' : '7ag'}'s ${c.table}`);
      }
    }
  }
  return bad;
}

const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());
export const traceAgrees = (j, ST, arm, l, sim, n = N) => !!(j && ST && j.stamp && j.N === n && String(j.seed) === SEED && j.arm === `${arm}/${l}` && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);
const prefixSame = (a, b, len) => { if (a.length < len || b.length < len) return false; for (let i = 0; i < len; i++) if (a[i] !== b[i]) return false; return true; };
/* the traces, and READER/W0.02's held to the reference CAND trace (`refT(id)`, decoded) on the first n paths */
export function loadTraces(units, DIR, ST, bad, refT, n = N) {
  const TR = {};
  for (const u of units) {
    const f = join(DIR, traceName(u.id, u.arm, u.label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = readTrace(f);
    if (!traceAgrees(j, ST, u.arm, u.label, u.run.sim, n)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const T = decode(j);
    if (u.arm === 'READER' && wOf(u.label) === '0.02') {
      const R = refT(u.id);
      if (!R) bad.push(`${u.id}: no reference CAND trace`);
      else if (R.Y !== T.Y || !prefixSame(T.survived, R.survived, n) || !prefixSame(T.tier, R.tier, n * T.Y) || !prefixSame(T.level, R.level, n * T.Y)) bad.push(`${u.id} READER/${u.label}: not ${FROM_AF.includes(u.id) ? '7af' : '7ag'}'s CAND path by path on the first ${n} paths`);
    }
    TR[`${u.id}|${u.arm}|${u.label}`] = T;
  }
  return TR;
}

const tri = (yes, no) => (yes ? 'HELD' : no ? 'FALSIFIED' : 'INCONCLUSIVE');
const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);
/* THE ITEMS. `K(id, w)` ORDER's paired cells against READER at w; `WL(id, w)` the whole-score leg; `err(id, arm, w)` a
   unit's |table - simulated|; `margin(id)` the household's registered margin */
export function items(K, WL, err, margin = id => MARGIN[id]) {
  const out = [];
  const surv = (n, w) => {
    const legs = PANEL.map(([id]) => { const k = K(id, w); return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });
    const adj = holm(legs.map(l => l.p));
    legs.forEach((l, i) => { l.pHolm = adj[i]; const o = outcome({ b: l.k.lost, c: l.k.saved, N: l.k.N, margin: l.margin, pHolm: l.pHolm, level: ALPHA }); l.iv = o; l.u = guardedU(l.k); l.o = o.outcome; l.pass = o.outcome === 'no material harm' && l.u.lo > -l.margin; });
    out.push({ n, text: `survival at the estate weight ${w}: ORDER against READER, no material harm on every household (the exact rule with Holm across ${PANEL.length}, each at its margin, and the guarded unconditional interval's lower end above minus it; FALSIFIED: harm on any)`, legs, outcome: tri(legs.every(l => l.pass), legs.some(l => l.o === 'harm')) });
  };
  const whole = (n, w) => {
    const legs = PANEL.map(([id]) => ({ id, ...WL(id, w), margin: margin(id) }));
    out.push({ n, text: `the whole score at the estate weight ${w}: no material harm on every household, each at its margin (FALSIFIED: an upper end below minus it)`, legs, outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.hi < -l.margin)) });
  };
  surv(1, '0.02'); whole(2, '0.02'); surv(3, '0.01'); whole(4, '0.01');
  { const eR = err('S360', 'READER', '0.02'), eO = err('S360', 'ORDER', '0.02'), ratio = eR > 0 ? eO / eR : Infinity;
    out.push({ n: 5, text: `O36's pessimism on S360 at 0.02: ORDER's |table - simulated| at most ${R5.held} of READER's (FALSIFIED: ${R5.falsified} of it or more)`, eR, eO, ratio, outcome: tri(ratio <= R5.held, ratio >= R5.falsified) }); }
  return out;
}

/* THE PLANTED CHECKS (rule 6): the gate over built units, one fault at a time; the items over built cells */
const RAN = (id, w, extra = '') => `mix 3 pts 30 seed 7002 paths ${N} grid total30x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad 5 tierState 0/0,1/1,2/2${extra} bequestWeight ${w} finalIntegral true bridgeRead reader`;
function builtUnits(o = {}) {
  const us = [], refs = {};
  for (const [id, arm, l] of UNITS) {
    if (o.skip && o.skip === `${id}|${arm}|${l}`) continue;
    const w = wOf(l), ran = RAN(id, w, arm === 'ORDER' ? ' readerRef order' : '');
    const u = { id, arm, label: l, lambda: o.lambda && arm === 'ORDER' ? '0.05' : LAMBDA, tier: 'own', riskAbove: 'auto', mix: '3', table: '99.5000', ran, gap: { gap: '1e-3' },
      joint: { joint: true, margin: o.margin && arm === 'ORDER' ? '0' : '0.001', deathTax: o.death && arm === 'ORDER' ? 0.4 : 0, tier: 'own', scale: 1000, cap: 4000, decided: 'd' }, worlds: [], run: { sim: 99 }, done: true };
    // each plant isolated to the one check it tests: refMiss alters ORDER at both weights (so only ORDER against READER
    // can see it), wMiss both arms at 0.01 (so only 0.01 against 0.02 can), in a field no other check reads
    if (o.refMiss && arm === 'ORDER' && id === 'S360') u.ran = u.ran.replace('tiersAbove 0', 'tiersAbove 1');
    if (o.wMiss && w === '0.01' && id === 'S370') u.ran = u.ran.replace('tiersAbove 0', 'tiersAbove 1');
    if (o.noRef && arm === 'ORDER') u.ran = RAN(id, w);
    if (o.refOnReader && arm === 'READER' && w === '0.01') u.ran = RAN(id, w, ' readerRef order');
    if (o.table && arm === 'READER' && w === '0.02' && id === 'bridge 6') u.table = '99.4000';
    if (o.noDone && arm === 'ORDER') u.done = false;
    us.push(u);
    if (arm === 'READER' && w === '0.02') refs[id] = { ran: withPaths(o.refRan && id === 'S366' ? RAN(id, w) + ' x' : RAN(id, w), 16000), table: '99.5000' };
  }
  if (o.twice) us.push({ ...us[0] });
  if (o.extra) us.push({ ...us[0], id: 'S999' });
  return { us, ref: id => refs[id] || null };
}
function planted() {
  const cases = [];
  const refused = o => { const b = builtUnits(o); return String(gate(b.us, b.ref).length > 0); };
  { const b = builtUnits(); const bad = gate(b.us, b.ref); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o] of [['a missing unit', { skip: 'S360|ORDER|TS+J/W0.02' }], ['a unit twice', { twice: true }], ['an unregistered unit', { extra: true }], ['other unit settings (lambda)', { lambda: true }],
    ['ORDER differing from READER beyond readerRef', { refMiss: true }], ['a 0.01 solve differing from its 0.02 beyond the weight', { wMiss: true }], ['ORDER without readerRef order', { noRef: true }],
    ['READER with readerRef order', { refOnReader: true }], ['READER/0.02 whose table is not the reference\'s', { table: true }], ['READER/0.02 whose ran line is not the reference\'s', { refRan: true }],
    ['a switch margin of 0', { margin: true }], ['a pension death charge', { death: true }], ['a unit not done', { noDone: true }]])
    cases.push([`the gate refuses ${nm}`, refused(o), 'true']);
  // the items over built cells
  const K0 = (lost, saved, n = N) => ({ a: n - lost - saved - 100, lost, saved, d: 100, N: n });
  const WL0 = (d, lo, hi) => ({ d, lo, hi });
  const run = ({ K = () => K0(0, 0), WL = () => WL0(0, -0.1, 0.1), e = (id, arm) => (arm === 'READER' ? 13.27 : 2) } = {}) => items(K, WL, e).map(i => i.outcome).join(' ');
  cases.push(['items: nothing changes, S360\'s error falls to 2 - all HELD', run(), 'HELD HELD HELD HELD HELD']);
  cases.push(['item 1: 60 lost paths on S366 at 0.02 is harm', run({ K: (id, w) => (id === 'S366' && w === '0.02' ? K0(60, 0) : K0(0, 0)) }).split(' ')[0], 'FALSIFIED']);
  cases.push(['item 3: 60 lost on S366 at 0.01 reads at item 3, not item 1', run({ K: (id, w) => (id === 'S366' && w === '0.01' ? K0(60, 0) : K0(0, 0)) }).split(' ').slice(0, 3).join(' '), 'HELD HELD FALSIFIED']);
  cases.push(['item 1: S360 uses its 0.5 margin (30 lost is not harm there, 30 lost on bridge 4 at 0.25 is)', [run({ K: (id, w) => (id === 'S360' && w === '0.02' ? K0(30, 0) : K0(0, 0)) }).split(' ')[0], run({ K: (id, w) => (id === 'bridge 4' && w === '0.02' ? K0(30, 0) : K0(0, 0)) }).split(' ')[0]].join(' '), 'INCONCLUSIVE FALSIFIED']);
  cases.push(['item 2: a whole-score upper end below -0.25 is harm', run({ WL: (id, w) => (id === 'bridge 4' && w === '0.02' ? WL0(-0.5, -0.8, -0.3) : WL0(0, -0.1, 0.1)) }).split(' ')[1], 'FALSIFIED']);
  cases.push(['item 2: S360 and S370 read the whole score at their 0.5 margin (an interval -0.4 to -0.3 is no harm there, harm on bridge 4 at 0.25)', ['S360', 'S370', 'bridge 4'].map(x => run({ WL: (id, w) => (id === x && w === '0.02' ? WL0(-0.35, -0.4, -0.3) : WL0(0, -0.1, 0.1)) }).split(' ')[1]).join(' '), 'HELD HELD FALSIFIED']);
  cases.push(['item 4: a lower end at -0.3 at 0.01 is INCONCLUSIVE', run({ WL: (id, w) => (w === '0.01' && id === 'S366' ? WL0(0, -0.3, 0.2) : WL0(0, -0.1, 0.1)) }).split(' ')[3], 'INCONCLUSIVE']);
  cases.push(['item 5: half the error HELD, 0.9 of it FALSIFIED, between INCONCLUSIVE', [[13.27, 6.6], [13.27, 12], [13.27, 9]].map(([r, o]) => run({ e: (id, arm) => (arm === 'READER' ? r : o) }).split(' ')[4]).join(' '), 'HELD FALSIFIED INCONCLUSIVE']);
  cases.push(['item 5 reads S360 alone', run({ e: (id, arm) => (id === 'S360' ? (arm === 'READER' ? 13.27 : 2) : (arm === 'READER' ? 1 : 50)) }).split(' ')[4], 'HELD']);
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}

export const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

/* THE READING, after every gate has passed */
export function reading(units, TR, out = console.log) {
  const get = (id, arm, w) => units.find(u => u.id === id && u.arm === arm && u.label === `TS+J/W${w}`);
  const tr = (id, arm, w) => TR[`${id}|${arm}|TS+J/W${w}`];
  const K = (id, w) => cells(tr(id, 'READER', w).survived, tr(id, 'ORDER', w).survived);
  const cfgOf = (id, w) => { const u = get(id, 'READER', w); return { lambda: Number(field(u.ran, 'lambda')), floor: Math.min(...field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(w), spendYears: F.spendYears(tr(id, 'READER', w), tr(id, 'ORDER', w)) }; };
  const WL = (id, w) => A.wholeLeg(tr(id, 'READER', w), tr(id, 'ORDER', w), cfgOf(id, w), ALPHA);
  const err = (id, arm, w) => { const u = get(id, arm, w); return Math.abs(Number(u.table) - u.run.sim); };
  out('7AH: O36\'S FIX - THE READER\'S REFERENCE DRAWN IN THE MENU\'S ORDER, ON THE SIX LONGER BRIDGES (the fair-test gate passed)');
  out('\nEVERY UNIT: table, simulated survival, table error, year-0 gap and opening');
  for (const w of WS) for (const [id] of PANEL) for (const arm of ['READER', 'ORDER']) { const u = get(id, arm, w); out(`  ${id.padEnd(14)} ${arm.padEnd(6)} W${w}  table ${u.table} sim ${u.run.sim.toFixed(2)} error ${(Number(u.table) - u.run.sim).toFixed(2)} gap ${u.gap.gap} (opening ${u.gap.open1e3},${u.gap.open0})`); }
  const IT = items(K, WL, err);
  for (const it of IT) {
    out(`\nITEM ${it.n}: ${it.text}`);
    if (it.legs) for (const l of it.legs) out(l.pHolm !== undefined ? `     ${l.id.padEnd(14)} ${l.k.saved} saved/${l.k.lost} lost  p ${l.pHolm.toExponential(1)}  change ${(100 * (l.k.saved - l.k.lost) / l.k.N).toFixed(3)} (exact ${l.iv.lo.toFixed(3)} to ${l.iv.hi.toFixed(3)}; unconditional, guarded, ${l.u.lo.toFixed(3)} to ${l.u.hi.toFixed(3)}) margin ${l.margin}: ${l.o}` : `     ${l.id.padEnd(14)} ${l.d >= 0 ? '+' : ''}${l.d.toFixed(3)} (${l.lo.toFixed(3)} to ${l.hi.toFixed(3)})`);
    else out(`     S360: READER's error ${it.eR.toFixed(2)}, ORDER's ${it.eO.toFixed(2)}, ratio ${it.ratio.toFixed(3)}`);
    out(`   -> ${it.outcome}`);
  }
  out(`\nREPORTED: S370's table error, READER ${(Number(get('S370', 'READER', '0.02').table) - get('S370', 'READER', '0.02').run.sim).toFixed(2)}, ORDER ${(Number(get('S370', 'ORDER', '0.02').table) - get('S370', 'ORDER', '0.02').run.sim).toFixed(2)} (an optimistic table the fix may push further)`);
  out(`\nOUTCOME: ${IT.map(i => `${i.n} ${i.outcome}`).join(', ')}`);
  return IT;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const R_ = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = R_(0, 'diag7ah'), DIRF = R_(1, 'diag7af'), DIRG = R_(2, 'diag7ag');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  // the references through their own gates
  const logsF = logsOf(DIRF), logsG = logsOf(DIRG), unitsF = Object.values(logsF).flatMap(F.parse), unitsG = Object.values(logsG).flatMap(G.parse);
  requireFairLogs(logsF, F.PRED); requireFairLogs(logsG, G.PRED);
  const refUnit = id => (FROM_AF.includes(id) ? unitsF.find(u => u.id === id && u.arm === F.CAND[0] && u.label === F.CAND[1]) : unitsG.find(u => u.id === id && u.arm === G.CAND[0] && u.label === G.CAND[1])) || null;
  const refT = id => { const d = FROM_AF.includes(id) ? DIRF : DIRG, f = join(d, traceName(id, 'READER', 'TS+J/W0.02')); return existsSync(f) ? decode(readTrace(f)) : null; };
  const bad = gate(units, refUnit);
  const TR = bad.length ? {} : loadTraces(units, DIR, stampOf(logs), bad, refT);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  reading(units, TR);
}
