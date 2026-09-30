/*
 * THE 7AM REDUCER: IS THE BUNDLE'S OPENING JITTER THE TIER STATE'S STORED MARGIN? (predictions/diag-7am.md; PLAN.md 7am;
 * O67; the deep review after 7ai, deep-review-log.md 30 Sep 18:03 UK, its decisive test). Reads results/diag7am/case*.txt
 * (batch-7am.sh: audit-7am.mjs; 7aa's line format plus an opening2 and a tiers line, and P's joint line with its switch
 * charge) beside P's records (results/diagP, reduce-P.mjs parse, the open job) and 7ai's (results/diag7ai, reduce-7aa.mjs
 * parse), each read through its own stamps.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7am, P and 7ai;
 *   - every registered unit once and done (audit-7am.mjs's UNITS: P's linear anchor on share 0.50; P = READER/TS+J/MP/30x5
 *     at '@logblend' and '@reversed' on the seven; the bundle = READER/TS+J at '@halfblend' and '@halfreversed' on the
 *     seven); nothing unregistered; an opening2 and a tiers line on every unit;
 *   - each unit's settings: lambda held, the plan's tier, 'auto' risk above, three worlds; 30 points, seed 7002, the estate
 *     weight 0.02, the final year exact, the reader, the tier state, one move for every world, no pension death charge;
 *     P's units the switch margin 0 and the charge 0.001 on the ran and joint lines, the bundle's the margin 0.001 and no
 *     charge;
 *   - IDENTITY: the anchor is P's own open-job solve on share 0.50 (its table, its ran line but the path count, its year-0
 *     gap and opening, its joint line's scale, cap and risk-above decision), so the code P ran is the code 7am runs;
 *   - WITHIN A PAIR: each of P's shifted units' ran and joint lines are P's record's for that household (but the path
 *     count), and each of the bundle's halves' are 7ai's linear bundle unit's: nothing but the tier returns differs;
 *   - THE TIERS: the reals each unit's menu carries are its set's (results-o60.txt: blend, 2 x linear - blend, and the halves
 *     linear +- (blend - linear)/2, printed to 0.01), and each named tier moved the registered way by 0.1 point or more at
 *     the full shift and 0.045 or more at the half (the override reached the solve).
 * THE ITEMS (the solves' own numbers, read exactly: no sampling enters a year-0 gap). A gap is the switch margin the held
 * tiers need to stay at year 0; '0' and '>1' are not numbers. For a household with three numeric gaps (linear L, shifted up
 * B, shifted down R): following F = (B - R)/2, blind C = (B + R)/2 - L, ratio |C|/|F| (look-7ai-split.mjs's split).
 *   1. P's gap answers the sign (the stored-margin cause): opposite = the two shifts move the gap opposite ways (up and
 *      down against L, neither tied). HELD when opposite on 6 or more of 7 and the ratio under 0.3 on 5 or more; FALSIFIED
 *      when the ratio is 0.55 or more (the bundle's own least under 7ai) on 5 or more; else INCONCLUSIVE.
 *   2. P's openings do not move but on its knife edge (share 0.50, gap 5.7824e-5): P's opening is the pension tier at its
 *      own margin 0 (the gap line's second figure); of the six other households, the number on which either shift changes
 *      it. HELD at 0; FALSIFIED at 2 or more; INCONCLUSIVE at 1.
 *   3. The bundle's sign-blind response at half the step (non-smooth or smooth and curved; the plan-auditor's MINOR 4 of
 *      30 Sep): q = |C at half| / |C at full| (the full shift is 7ai's). A response smooth to second order gives about 0.25,
 *      a kink about 0.5, a jump about 1. HELD (non-smooth) when q >= 0.4 on 5 or more of 7; FALSIFIED (smooth and curved)
 *      when q <= 0.33 on 5 or more; else INCONCLUSIVE.
 * Reported, not items: every household's gaps, openings and split for P and for the bundle at both step sizes, and the
 * tables.
 *   node research/solver/reduce-7am.mjs [dir] [dirP] [dir7ai] > research/solver/results-7am.txt
 *   node research/solver/reduce-7am.mjs --planted   the planted checks alone, and the outcomes they reach
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as A from './reduce-7aa.mjs';
import * as P from './reduce-P.mjs';
import * as I from './reduce-7ai.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7am.md';
export const { field, LAMBDA } = A;
export const PTS = '30', SEED = '7002', W = '0.02', CHARGE = '0.001';
export const OPP_MIN = 6, SMOOTH = 0.3, JITTERY = 0.55, K_OF = 5, Q_KINK = 0.4, Q_CURVED = 0.33;
export const HOUSEHOLDS = ['share 0.50', 'share 0.90', 'bridge 0', 'bridge 1', 'S126', 'S194', 'S162'];
export const KNIFE = 'share 0.50';
export const PTAG = 'TS+J/MP/30x5', BTAG = 'TS+J';
export const labelOf = (tag, set) => `${tag}/W${W}${set === 'linear' ? '' : '@' + set}`;
export const UNITS = [[KNIFE, 'READER', labelOf(PTAG, 'linear')],
  ...HOUSEHOLDS.flatMap(id => ['logblend', 'reversed'].map(set => [id, 'READER', labelOf(PTAG, set)])),
  ...HOUSEHOLDS.flatMap(id => ['halfblend', 'halfreversed'].map(set => [id, 'READER', labelOf(BTAG, set)]))];
export const TIERS = I.TIERS;
export const setOf = label => (/@(\w+)$/.exec(label) || [, 'linear'])[1];
const isP = label => label.startsWith(PTAG);

// the lines: 7aa's (reduce-7aa.mjs parse) with two changes - P's joint line carries its switch charge, which 7aa's pattern
// does not read, so the joint line is read here for every unit; and the opening2 and tiers lines (reduce-7ai.mjs's parsers)
const JOINTL = /^\s+joint (\S+?)\/(\S+): (true|false) switchMargin (\S+)(?: switchCharge (\S+))? scale (\S+) cap (\S+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
export function parse(text) {
  const units = A.parse(text); let cur = null;
  for (const line of text.split('\n')) {
    const c = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \|/.exec(line);
    if (c) { cur = units.find(u => u.id === c[1].trim() && u.arm === c[2] && u.label === c[3] && !u._j) || null; continue; }
    const m = JOINTL.exec(line);
    if (m && cur && m[1] === cur.arm && m[2] === cur.label) { cur.joint = { joint: m[3] === 'true', margin: m[4], charge: m[5] ?? null, scale: +m[6], cap: +m[7], deathTax: +m[8], tier: m[9], decided: m[10] }; cur._j = true; }
  }
  return units;
}
export const { parseTiers, parseOpen2, readO60, normRan } = I;
export const realOf = (o, k, set) => (set === 'logblend' ? o[k].blend : set === 'reversed' ? +(2 * o[k].linear - o[k].blend).toFixed(2) : set === 'halfblend' ? o[k].linear + (o[k].blend - o[k].linear) / 2 : set === 'halfreversed' ? o[k].linear - (o[k].blend - o[k].linear) / 2 : o[k].linear);
const UP = { logblend: 1, reversed: -1, halfblend: 1, halfreversed: -1 };

/* THE GATE. `pref(id)` P's parsed open job's tag 'P' (reduce-P.mjs parse) for the household; `bref(id, set)` 7ai's parsed
   bundle unit (READER/TS+J/W0.02 at 'linear', 'logblend' or 'reversed'); `tiers`, `open2` this run's; `o60` results-o60.txt */
export function gate(units, pref, bref, tiers, open2, o60, { pts = PTS } = {}) {
  const bad = [];
  for (const [id, a, l] of UNITS) {
    for (const [what, xs] of [['unit', units], ['opening2', open2], ['tiers', tiers]]) { const k = xs.filter(u => u.id === id && u.arm === a && u.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }
  }
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    if (u.table === undefined || !u.ran || !u.gap || !u.joint) { bad.push(`${tag}: a solve, ran, gap or joint line missing`); continue; }
    const mp = isP(u.label), set = setOf(u.label);
    const want = { pts, seed: SEED, bequestWeight: W, finalIntegral: 'true', bridgeRead: 'reader', mix: '3', ...(mp ? { switchMargin: '0', switchCharge: CHARGE } : {}) };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (!mp && (field(u.ran, 'switchMargin') !== null || field(u.ran, 'switchCharge') !== null)) bad.push(`${tag}: the bundle's ran line names a switch margin or charge`);
    if (field(u.ran, 'tierState') === null) bad.push(`${tag}: no tier state`);
    if (u.joint.joint !== true) bad.push(`${tag}: one move for every world ${u.joint.joint}`);
    if (u.joint.margin !== (mp ? '0' : '0.001') || u.joint.charge !== (mp ? CHARGE : null)) bad.push(`${tag}: switch margin ${u.joint.margin} charge ${u.joint.charge}`);
    if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax} (O53)`);
    const r = mp ? pref(u.id) : bref(u.id, 'linear');
    if (!r || !r.ran || !r.joint) { bad.push(`${tag}: no ${mp ? "P's" : "7ai's"} record for ${u.id}`); continue; }
    if (normRan(r.ran) !== normRan(u.ran)) bad.push(`${tag}: its ran line is not ${mp ? "P's record's" : "7ai's linear bundle unit's"} but for the path count`);
    if (['scale', 'cap', 'decided'].some(k => r.joint[k] !== u.joint[k])) bad.push(`${tag}: its joint line is not ${mp ? "P's record's" : "7ai's linear unit's"} (scale, cap, risk above)`);
    if (set === 'linear') {
      if (r.table !== u.table) bad.push(`${tag}: table ${u.table}, P's ${r.table}`);
      if (!r.gap || r.gap.gap !== u.gap.gap || r.gap.open1e3 !== u.gap.open1e3 || r.gap.open0 !== u.gap.open0) bad.push(`${tag}: gap ${u.gap.gap} opening ${u.gap.open1e3},${u.gap.open0}, P's ${r.gap && r.gap.gap} ${r.gap && `${r.gap.open1e3},${r.gap.open0}`}`);
    }
  }
  // the tiers: each unit's reals are its set's, moved the registered way
  if (TIERS.some(k => !o60[k])) bad.push('results-o60.txt: a tier row missing');
  else for (const t of tiers) {
    const set = setOf(t.label), tag = `${t.id} ${t.arm}/${t.label}`, half = set.startsWith('half');
    for (const menu of t.tiers) for (const [n, v] of menu) {
      if (!TIERS.includes(n)) continue;
      const want = realOf(o60, n, set);
      if (Math.abs(v - want) > (set === 'linear' ? 0.01 : 0.005) + 1e-9) bad.push(`${tag}: ${n} ${v}, not ${+want.toFixed(4)}`);
      if (set !== 'linear' && !(UP[set] * (v - o60[n].linear) >= (half ? 0.045 : 0.1) - 1e-9)) bad.push(`${tag}: ${n} moved ${(v - o60[n].linear).toFixed(3)} from linear, not the registered way by ${half ? 0.045 : 0.1} or more (the override short of the solve)`);
    }
  }
  return bad;
}

/* the split of a household's three gaps (look-7ai-split.mjs's): null when any is not a number */
export const num = g => (g === '0' || g === '>1' || g === undefined || g === null ? null : Number(g));
export function split(l, b, r) {
  const [L, B, R] = [l, b, r].map(num);
  if ([L, B, R].some(x => x === null || !Number.isFinite(x))) return null;
  const F = (B - R) / 2, C = (B + R) / 2 - L;
  return { F, C, ratio: F === 0 ? Infinity : Math.abs(C) / Math.abs(F), blindShare: L === 0 ? null : Math.abs(C) / L };
}
export const opposite = (l, b, r) => { const x = I.dirOf(l, b), y = I.dirOf(l, r); return x !== 0 && y !== 0 && x === -y; };
/* pairs: [{ id, p: { l, b, r, o: [openL, openB, openR] }, c: { l, b, r, hb, hr } }] (gaps as printed; P's opening at 0) */
export function items(pairs) {
  let opp = 0, smooth = 0, jit = 0, moved = [], kink = 0, curved = 0;
  for (const x of pairs) {
    if (opposite(x.p.l, x.p.b, x.p.r)) opp++;
    const s = split(x.p.l, x.p.b, x.p.r);
    if (s && s.ratio < SMOOTH) smooth++;
    if (s && s.ratio >= JITTERY) jit++;
    if (x.id !== KNIFE && (x.p.o[1] !== x.p.o[0] || x.p.o[2] !== x.p.o[0])) moved.push(x.id);
    const full = split(x.c.l, x.c.b, x.c.r), half = split(x.c.l, x.c.hb, x.c.hr);
    if (full && half && full.C !== 0) { const q = Math.abs(half.C) / Math.abs(full.C); if (q >= Q_KINK) kink++; if (q <= Q_CURVED) curved++; }
  }
  return [
    { n: 1, opp, smooth, jit, outcome: opp >= OPP_MIN && smooth >= K_OF ? 'HELD' : jit >= K_OF ? 'FALSIFIED' : 'INCONCLUSIVE' },
    { n: 2, moved, outcome: moved.length === 0 ? 'HELD' : moved.length >= 2 ? 'FALSIFIED' : 'INCONCLUSIVE' },
    { n: 3, kink, curved, outcome: kink >= K_OF ? 'HELD' : curved >= K_OF ? 'FALSIFIED' : 'INCONCLUSIVE' }];
}

export function reading(units, pref, bref, out = console.log) {
  const get = (id, l) => units.find(u => u.id === id && u.arm === 'READER' && u.label === l);
  const pairs = HOUSEHOLDS.map(id => {
    const pr = pref(id), pb = get(id, labelOf(PTAG, 'logblend')), pv = get(id, labelOf(PTAG, 'reversed'));
    const bl = bref(id, 'linear'), bb = bref(id, 'logblend'), bv = bref(id, 'reversed'), hb = get(id, labelOf(BTAG, 'halfblend')), hv = get(id, labelOf(BTAG, 'halfreversed'));
    return { id, p: { l: pr.gap.gap, b: pb.gap.gap, r: pv.gap.gap, o: [pr.gap.open0, pb.gap.open0, pv.gap.open0], t: [pr.table, pb.table, pv.table] },
      c: { l: bl.gap.gap, b: bb.gap.gap, r: bv.gap.gap, hb: hb.gap.gap, hr: hv.gap.gap } };
  });
  const f = s => (s ? `following ${s.F.toExponential(3)} blind ${s.C.toExponential(3)} ratio ${Number.isFinite(s.ratio) ? s.ratio.toFixed(2) : 'inf'}` : 'not split (a gap 0 or >1)');
  out(`7AM: THE STORED MARGIN - P (READER/TS+J, switchCharge ${CHARGE}, switchMargin 0) under 7ai's tier shift each way, and the bundle (READER/TS+J/W${W}) at half that shift each way, 30 points; P's linear gaps are P's records (the anchor on ${KNIFE} re-solved and held to its record), the bundle's full shift 7ai's`);
  out('  P (gaps linear / blend / reversed; the pension tier at margin 0 in each; the split)');
  for (const x of pairs) out(`    ${x.id.padEnd(11)} ${x.p.l.padStart(10)} ${x.p.b.padStart(10)} ${x.p.r.padStart(10)}  open ${x.p.o.join('/')}  ${opposite(x.p.l, x.p.b, x.p.r) ? 'opposite' : 'not opposite'}  ${f(split(x.p.l, x.p.b, x.p.r))}`);
  out('  the bundle (gaps linear / blend / reversed / half blend / half reversed; the sign-blind part at the full and half step, and q)');
  for (const x of pairs) {
    const a = split(x.c.l, x.c.b, x.c.r), h = split(x.c.l, x.c.hb, x.c.hr);
    out(`    ${x.id.padEnd(11)} ${[x.c.l, x.c.b, x.c.r, x.c.hb, x.c.hr].map(g => g.padStart(10)).join(' ')}  full ${f(a)}; half ${f(h)}; q ${a && h && a.C !== 0 ? (Math.abs(h.C) / Math.abs(a.C)).toFixed(2) : 'n/a'}`);
  }
  const IT = items(pairs);
  out(`\nITEM 1 (P's gap answers the sign): opposite on ${IT[0].opp} of 7 (HELD at ${OPP_MIN} with the ratio under ${SMOOTH} on ${K_OF} or more: ${IT[0].smooth}); the ratio ${JITTERY} or more on ${IT[0].jit} (FALSIFIED at ${K_OF} or more) -> ${IT[0].outcome}`);
  out(`ITEM 2 (P's openings move only on its knife edge, ${KNIFE}): moved on ${IT[1].moved.length} of 6 (${IT[1].moved.join(', ') || 'none'}; HELD at 0, FALSIFIED at 2 or more) -> ${IT[1].outcome}`);
  out(`ITEM 3 (the bundle at half the step: non-smooth or curved): q ${Q_KINK} or more on ${IT[2].kink} of 7 (HELD at ${K_OF}); q ${Q_CURVED} or less on ${IT[2].curved} (FALSIFIED at ${K_OF}) -> ${IT[2].outcome}`);
  out(`REPORTED: P's tables linear / blend / reversed: ${pairs.map(x => `${x.id} ${x.p.t.join('/')}`).join('; ')}`);
  out(`\nOUTCOME: 1 ${IT[0].outcome}, 2 ${IT[1].outcome}, 3 ${IT[2].outcome}`);
  return IT;
}

/* PLANTED: a built set the gate must pass clean, faults it must refuse, and items over built pairs */
function built(o = {}) {
  const o60 = { 'High Risk': { linear: 4.79, blend: 4.97 }, 'Medium/High Risk': { linear: 4.24, blend: 4.65 }, 'Medium Risk': { linear: 3.69, blend: o.smallBlend ? 3.77 : 4.18 }, 'Medium/Low Risk': { linear: 3.14, blend: 3.55 }, 'Low Risk': { linear: 2.59, blend: 2.76 } };
  const ranOf = (mp, n) => `mix 3 pts 30 seed 7002 paths ${n} grid total30x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad 5${o.noTierState ? '' : ' tierState 0/0,1/1,2/2'} bequestWeight 0.02 finalIntegral true bridgeRead reader${mp ? ` switchMargin 0 switchCharge ${o.ranCharge ? '0.002' : '0.001'}` : o.bundleCharge ? ' switchMargin 0.001 switchCharge 0.001' : ''}`;
  const jointOf = mp => ({ joint: true, margin: mp ? '0' : '0.001', charge: mp ? '0.001' : null, scale: 949999, cap: 3799996, deathTax: 0, tier: 'own', decided: 'off:_no_tier_above_the_plan' });
  const us = [], tiers = [], open2 = [];
  for (const [id, a, l] of UNITS) {
    const mp = isP(l), set = setOf(l);
    if (o.skip === `${id}|${l}`) continue;
    const u = { id, arm: a, label: l, lambda: o.lambda ? '0.03' : LAMBDA, tier: 'own', riskAbove: 'auto', mix: '3', done: !(o.noDone && id === 'S126'), table: '99.7585', ran: ranOf(mp, 8000), gap: { gap: '5.7824e-5', open1e3: 0, open0: 2 }, joint: jointOf(mp) };
    if (o.charge && mp && id === 'S194') { u.ran = u.ran.replace('switchCharge 0.001', 'switchCharge 0.002'); u.joint = { ...u.joint, charge: '0.002' }; }
    if (o.bundleMargin && !mp && id === 'S194') u.joint = { ...u.joint, margin: '0' };
    if (o.ranP && mp && set === 'reversed' && id === 'bridge 0') u.ran = u.ran.replace('minPot 29000', 'minPot 30000');
    if (o.ranB && !mp && id === 'bridge 1') u.ran = u.ran.replace('minPot 29000', 'minPot 30000');
    if (o.anchorTable && set === 'linear') u.table = '99.7586';
    if (o.anchorGap && set === 'linear') u.gap = { ...u.gap, gap: '5.7825e-5' };
    if (o.death && id === 'S162') u.joint = { ...u.joint, deathTax: 0.4 };
    if (o.noReader && id === 'S162') u.ran = u.ran.replace('bridgeRead reader', 'bridgeRead false');
    us.push(u);
    const val = n => realOf(o60, n, set) + (o.halfOff && set === 'halfblend' && id === 'S126' ? 0.01 : 0) + (o.small && set === 'logblend' && id === 'S126' ? -(o60[n].blend - o60[n].linear) + 0.05 : 0);
    tiers.push({ id, arm: a, label: l, tiers: [['High Risk', 'Medium/High Risk', 'Medium Risk'], ['Medium/High Risk', 'Medium Risk', 'Medium/Low Risk']].map(c => c.map(n => [n, +val(n).toFixed(2)])) });
    if (!(o.noOpen2 && id === 'S162' && set === 'halfreversed')) open2.push({ id, arm: a, label: l, at1e3: '0/0', at0: '2/2' });
  }
  if (o.twice) us.push({ ...us[3] });
  if (o.extra) us.push({ ...us[3], id: 'S999' });
  const pref = id => (o.noRecord && id === 'S162' ? null : { table: '99.7585', ran: ranOf(true, 16000), gap: { gap: '5.7824e-5', open1e3: 0, open0: 2 }, joint: jointOf(true) });
  const bref = () => ({ table: '99.8', ran: ranOf(false, 8000), gap: { gap: '1.0e-3', open1e3: 2, open0: 2 }, joint: jointOf(false) });
  return { us, pref, bref, tiers, open2, o60 };
}
const REACHED = { 1: new Set(), 2: new Set(), 3: new Set() };
export function planted() {
  const cases = [];
  const refused = o => { const b = built(o); return String(gate(b.us, b.pref, b.bref, b.tiers, b.open2, b.o60).length > 0); };
  { const b = built(); const bad = gate(b.us, b.pref, b.bref, b.tiers, b.open2, b.o60); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o] of [['a missing unit', { skip: 'S126|TS+J/W0.02@halfreversed' }], ['a unit twice', { twice: true }], ['an unregistered unit', { extra: true }], ['other unit settings (lambda)', { lambda: true }], ['a unit not done', { noDone: true }],
    ["P's charge 0.002", { charge: true }], ["the bundle's margin 0", { bundleMargin: true }], ["a P ran line that is not P's record's", { ranP: true }], ["a half ran line that is not 7ai's linear unit's", { ranB: true }],
    ["the anchor's table not P's", { anchorTable: true }], ["the anchor's gap not P's (the last digit)", { anchorGap: true }], ['a pension death charge', { death: true }], ['the reader off', { noReader: true }],
    ["a household with no P record", { noRecord: true }], ["P's ran line with charge 0.002 (its record's too)", { ranCharge: true }], ["the bundle's ran line naming a margin and charge (7ai's too)", { bundleCharge: true }],
    ['no tier state on any ran line (the records\' neither)', { noTierState: true }], ['a tier moved 0.08 by the blend and 0.04 at the half (each at its set\'s figure)', { smallBlend: true }], ['a half tier 0.01 off its set', { halfOff: true }], ['a blend tier moved 0.05 (the override short of the solve)', { small: true }], ['a missing opening2 line', { noOpen2: true }]])
    cases.push([`the gate refuses ${nm}`, refused(o), 'true']);
  // items over built pairs: P's gaps (l, b, r), its openings, the bundle's five gaps
  const X = (id, p, o, c) => ({ id, p: { l: p[0], b: p[1], r: p[2], o }, c: { l: c[0], b: c[1], r: c[2], hb: c[3], hr: c[4] } });
  const SM = ['1.0e-4', '1.2e-4', '0.8e-4'], JT = ['1.0e-4', '1.2e-4', '1.1e-4'], KINK = ['1.0e-3', '1.2e-3', '1.0e-3', '1.1e-3', '1.0e-3'], CURV = ['1.0e-3', '1.3e-3', '0.9e-3', '1.125e-3', '0.925e-3'];
  const rep = (fn, n) => HOUSEHOLDS.map((id, i) => fn(id, i < n));
  const out = ps => items(ps).map(i => { REACHED[i.n].add(i.outcome); return i.outcome; }).join(' ');
  const one = (ps, k) => { const o = items(ps)[k - 1].outcome; REACHED[k].add(o); return o; };
  cases.push(['P smooth and opposite on 7, no opening moves, the bundle kinked: HELD HELD HELD', out(rep(id => X(id, SM, [2, 2, 2], KINK), 7)), 'HELD HELD HELD']);
  cases.push(['P jittery on 7, openings move on 2, the bundle curved: FALSIFIED FALSIFIED FALSIFIED', out(rep((id, k) => X(id, JT, ['S126', 'S194'].includes(id) ? [2, 0, 2] : [2, 2, 2], CURV), 7)), 'FALSIFIED FALSIFIED FALSIFIED']);
  cases.push(['P smooth on 4, jittery on 3: 1 INCONCLUSIVE', one(rep((id, k) => X(id, k ? SM : JT, [2, 2, 2], KINK), 4), 1), 'INCONCLUSIVE']);
  cases.push(['P smooth on 5 but opposite on 5: 1 INCONCLUSIVE (opposite under 6)', one(rep((id, k) => X(id, k ? SM : ['1.0e-4', '1.2e-4', '1.3e-4'], [2, 2, 2], KINK), 5), 1), 'INCONCLUSIVE']);
  cases.push(['5 smooth and opposite, 2 tied: opposite 5, 1 INCONCLUSIVE (a tie is not opposite)', one(rep((id, k) => X(id, k ? SM : ['1.0e-4', '1.0e-4', '1.0e-4'], [2, 2, 2], KINK), 5), 1), 'INCONCLUSIVE']);
  cases.push(['opposite on 7 with the ratio 0.45: neither smooth nor jittery, 1 INCONCLUSIVE', one(rep(id => X(id, ['1.0e-4', '1.29e-4', '0.89e-4'], [2, 2, 2], KINK), 7), 1), 'INCONCLUSIVE']);
  cases.push(['jittery on 4, the ratio 0.45 on 3: 1 INCONCLUSIVE (FALSIFIED needs 5)', one(rep((id, k) => X(id, k ? JT : ['1.0e-4', '1.29e-4', '0.89e-4'], [2, 2, 2], KINK), 4), 1), 'INCONCLUSIVE']);
  cases.push(['one opening moves (S194): 2 INCONCLUSIVE', one(rep(id => X(id, SM, id === 'S194' ? [2, 2, 0] : [2, 2, 2], KINK), 7), 2), 'INCONCLUSIVE']);
  cases.push(["the knife edge's opening moving is not counted: 2 HELD", one(rep(id => X(id, SM, id === KNIFE ? [2, 0, 0] : [2, 2, 2], KINK), 7), 2), 'HELD']);
  cases.push(['the bundle kinked on 4, curved on 3: 3 INCONCLUSIVE', one(rep((id, k) => X(id, SM, [2, 2, 2], k ? KINK : CURV), 4), 3), 'INCONCLUSIVE']);
  { const IT = items(rep(id => X(id, ['0', '1.0e-4', '0'], [2, 2, 2], ['>1', '1e-3', '1e-3', '1e-3', '1e-3']), 7));
    cases.push(['gaps of 0 or >1 are not split and count as neither smooth, jittery, kinked nor curved', `${IT[0].smooth} ${IT[0].jit} ${IT[2].kink} ${IT[2].curved} ${IT[0].outcome} ${IT[2].outcome}`, '0 0 0 0 INCONCLUSIVE INCONCLUSIVE']); }
  cases.push(['split: 1.0e-4, 1.2e-4, 0.8e-4 is following 2e-5, blind 0, ratio 0', JSON.stringify(split('1.0e-4', '1.2e-4', '0.8e-4')), JSON.stringify({ F: (1.2e-4 - 0.8e-4) / 2, C: (1.2e-4 + 0.8e-4) / 2 - 1.0e-4, ratio: Math.abs((1.2e-4 + 0.8e-4) / 2 - 1.0e-4) / Math.abs((1.2e-4 - 0.8e-4) / 2), blindShare: Math.abs((1.2e-4 + 0.8e-4) / 2 - 1.0e-4) / 1.0e-4 })]);
  cases.push(["7ai's bundle split reproduces look-7ai-split's share 0.50 ratio (0.99)", (() => { const t = readFileSync(join(HERE, 'results-7ai.txt'), 'utf8'); const m = /^\s+share 0\.50\s+READER\/TS\+J\s+\|\s+(\S+)\s.*?\|\s+(\S+)\s.*?\|\s+(\S+)\s/m.exec(t); return m ? split(m[1], m[2], m[3]).ratio.toFixed(2) : 'no row'; })(), '0.99']);
  cases.push(['parse reads P\'s joint line with its charge, and the bundle\'s without', JSON.stringify(parse('S126             case | unit READER/TS+J/MP/30x5/W0.02@reversed | lambda x tier own riskAbove auto mix 3\n                 joint READER/TS+J/MP/30x5/W0.02@reversed: true switchMargin 0 switchCharge 0.001 scale 9 cap 36 deathTax 0 tier own riskAbove off:_x\nS126             case | unit READER/TS+J/W0.02@halfblend | lambda x tier own riskAbove auto mix 3\n                 joint READER/TS+J/W0.02@halfblend: true switchMargin 0.001 scale 9 cap 36 deathTax 0 tier own riskAbove off:_x\n').map(u => [u.joint.margin, u.joint.charge])), '[["0","0.001"],["0.001",null]]']);
  cases.push(['the half sets: Medium Risk halfblend 3.935, halfreversed 3.445', `${realOf(built().o60, 'Medium Risk', 'halfblend').toFixed(3)} ${realOf(built().o60, 'Medium Risk', 'halfreversed').toFixed(3)}`, '3.935 3.445']);
  cases.push(['the units are audit-7am.mjs\'s (29)', String(UNITS.length), '29']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3].map(k => `OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`).join('\n')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const R_ = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = R_(0, 'diag7am'), DIRP = R_(1, 'diagP'), DIRI = R_(2, 'diag7ai');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse), tiers = Object.values(logs).flatMap(parseTiers), open2 = Object.values(logs).flatMap(parseOpen2);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const logsP = logsOf(DIRP), logsI = logsOf(DIRI);
  requireFairLogs(logsP, P.PRED); requireFairLogs(logsI, I.PRED);
  const jobsP = Object.values(logsP).flatMap(P.parse), unitsI = Object.values(logsI).flatMap(A.parse);
  const pref = id => { const j = jobsP.find(x => x.kind === 'open' && x.id === id && x.arm === 'READER' && x.grid === '30x5' && x.w === W && x.done); return j && j.tags.P ? { ...j.tags.P } : null; };
  const bref = (id, set) => unitsI.find(u => u.id === id && u.arm === 'READER' && u.label === I.labelOf('TS+J', set) && u.done) || null;
  const bad = gate(units, pref, bref, tiers, open2, readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8')));
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; the anchor is P's own solve (table, ran line, gap, opening, joint line); each P unit P's record but for the tier returns, each half 7ai's linear bundle unit but for them; the tiers moved by O60's figures (planted ${np})\n`);
  reading(units, pref, bref);
}
