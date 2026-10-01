/*
 * THE 7AQ REDUCER: P AT HALF THE STEP, WITH A SIGNED GAP (predictions/diag-7aq.md; PLAN.md 7aq; O67, O73, O74, O75; the deep
 * review after 7am, deep-review-log.md 1 Oct 02:00 UK, its decisive next step). Reads results/diag7aq/case*.txt
 * (batch-7aq.sh: audit-7aq.mjs; 7am's lines plus a signed line) beside 7am's records (results/diag7am, reduce-7am.mjs
 * parse: P's full-step units and the bundle's halves), P's (results/diagP, the open job: P's linear solves) and 7ai's
 * (results/diag7ai: the bundle's linear and full-step solves), each read through its own stamps.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7aq, 7am, P and 7ai; and 7am's records pass 7am's own gate (reduce-7am.mjs);
 *   - every registered unit once and done (audit-7aq.mjs's UNITS: P = READER/TS+J/MP/30x5 at '@logblend' and '@reversed' on
 *     the three 7am left unsplit - share 0.50, share 0.90, bridge 0 - and at '@halfblend' and '@halfreversed' on the seven);
 *     nothing unregistered; an opening2, a tiers and a signed line on every unit;
 *   - each unit's settings as 7am's P units': lambda held, the plan's tier, 'auto' risk above, three worlds; 30 points, seed
 *     7002, the estate weight 0.02, the final year exact, the reader, the tier state, one move for every world, no pension
 *     death charge, the switch margin 0 and the charge 0.001 on the ran and joint lines;
 *   - IDENTITY: each full-step unit is 7am's own solve of that unit - its table, ran line, bisected gap and opening, joint
 *     line's scale, cap and risk-above decision - so the code 7am ran is the code 7aq runs;
 *   - WITHIN A PAIR: each half-step unit's ran and joint lines are P's record's for the household (but the path count);
 *   - THE TIERS: each unit's menu carries its set's reals, moved the registered way (0.1 point at the full step, 0.045 at
 *     the half; reduce-7am.mjs's check);
 *   - THE SIGNED GAP: each unit's signed gap agrees with its own bisected gap (signed-gap.mjs crossCheck: a positive one
 *     equal to it, one at or below 0 where the bisected gap is '0'); the gaps the items read from the records - P's linear
 *     ones and 7am's full-step ones on bridge 1, S126, S194 and S162 - are positive numbers (a positive bisected gap is the
 *     signed one).
 * THE ITEMS (the solves' own numbers, read exactly: no sampling enters a year-0 gap). For a household with three signed
 * gaps (linear L, shifted up B, shifted down R): following F = (B - R)/2, blind C = (B + R)/2 - L (look-7ai-split.mjs's
 * split). Counted in O73's families: the S126 family (share 0.50, share 0.90, bridge 0, bridge 1, S126: S126 re-weighted or
 * re-aged), S194, S162; a family reads a way when a majority of its members do (3 of 5, 1 of 1).
 *   1. P smooth (the stored margin, O67's (A)): q = |C at half| / |C at full| for P, and r = F at half / F at full where
 *      |F at full| >= |C at full| (else r is not read). C is even in the step, so a response smooth to second order gives
 *      q about 0.25 and r about 0.5; a snap between the half and the full step leaves C at half near 0 (q near 0) and r
 *      off 0.5 (the plan-auditor's BLOCKING 1 of 1 Oct 07:22 UK). A member reads smooth at 0.15 <= q <= 0.33 with r, where
 *      read, in 0.35 to 0.65; non-smooth at q >= 0.4 (a kink or jump within the half step), q < 0.15 (a feature beyond
 *      it) or r, where read, outside 0.25 to 0.75. HELD when all three families read smooth; FALSIFIED when two or more
 *      read non-smooth; else INCONCLUSIVE.
 *   2. P's sign-blind part well under the bundle's at the half step: a member reads under when |C_P at half| <= |C_bundle
 *      at half| / 3 (7am's half units), not under when it is 2/3 of it or more. HELD when all three families read under;
 *      FALSIFIED when two or more read not under; else INCONCLUSIVE.
 * Reported, not items: every household's signed gaps and splits for P at both steps and the bundle's; q for the bundle
 * (7am's item 3) beside P's; F at half over F at full (a smooth response gives 0.5); the q above 1 count (grid snaps,
 * O67's (B), predict jumps); P's split grouped by whether the year-0 choice reads a reader year (O67's (C), 7am's
 * NOREADER: bridge 0 and bridge 1, both in the S126 family); bridge 0's full-step blind part against O75's bound
 * (|C| >= 1.159e-4, 0.68 of the bundle's 1.714e-4); and the |C| at full over the bundle's per household.
 *   node research/solver/reduce-7aq.mjs [dir] [dir7am] [dirP] [dir7ai] > research/solver/results-7aq.txt
 *   node research/solver/reduce-7aq.mjs --planted   the planted checks alone, and the outcomes they reach
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as A from './reduce-7aa.mjs';
import * as P from './reduce-P.mjs';
import * as I from './reduce-7ai.mjs';
import * as AM from './reduce-7am.mjs';
import { crossCheck } from './signed-gap.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7aq.md';
export const { field, LAMBDA } = A;
export const PTS = '30', SEED = '7002', W = '0.02', CHARGE = '0.001';
export const Q_SMOOTH = 0.33, Q_KINK = 0.4, Q_BEYOND = 0.15, F_IN = [0.35, 0.65], F_OUT = [0.25, 0.75], UNDER = 1 / 3, NOT_UNDER = 2 / 3;
export const HOUSEHOLDS = AM.HOUSEHOLDS, NOREADER = AM.NOREADER;
export const UNSPLIT = ['share 0.50', 'share 0.90', 'bridge 0'];
export const FAMILIES = [['the S126 family', ['share 0.50', 'share 0.90', 'bridge 0', 'bridge 1', 'S126']], ['S194', ['S194']], ['S162', ['S162']]];
export const O75 = { id: 'bridge 0', bound: 1.159e-4, bundle: 1.714e-4 };
export const PTAG = 'TS+J/MP/30x5', BTAG = 'TS+J';
export const labelOf = AM.labelOf, setOf = AM.setOf, split = AM.split;
export const UNITS = [...UNSPLIT.flatMap(id => ['logblend', 'reversed'].map(set => [id, 'READER', labelOf(PTAG, set)])),
  ...HOUSEHOLDS.flatMap(id => ['halfblend', 'halfreversed'].map(set => [id, 'READER', labelOf(PTAG, set)]))];

// the lines: 7am's (reduce-7am.mjs parse) and the signed line
const SIGNL = /^\s+signed (\S+?)\/(\S+): (\S+) stay (\S+) move (\S+)$/;
export function parse(text) {
  const units = AM.parse(text); let cur = null;
  for (const line of text.split('\n')) {
    const c = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \|/.exec(line);
    if (c) { cur = units.find(u => u.id === c[1].trim() && u.arm === c[2] && u.label === c[3] && !u._s) || null; continue; }
    const m = SIGNL.exec(line);
    if (m && cur && m[1] === cur.arm && m[2] === cur.label) { cur.signed = { gap: Number(m[3]), text: m[3] }; cur.nSigned = (cur.nSigned || 0) + 1; cur._s = true; }
  }
  return units;
}
export const { parseTiers, parseOpen2, readO60, normRan } = I;
const pos = g => { const x = AM.num(g); return x !== null && x > 0 ? x : null; };

/* THE GATE. `pref(id)` P's open-job record (tag 'P'); `mref(id, label)` 7am's parsed unit; `tiers`, `open2` this run's */
export function gate(units, pref, mref, tiers, open2, o60, { pts = PTS } = {}) {
  const bad = [];
  for (const [id, a, l] of UNITS) {
    for (const [what, xs] of [['unit', units], ['opening2', open2], ['tiers', tiers]]) { const k = xs.filter(u => u.id === id && u.arm === a && u.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }
  }
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`, set = setOf(u.label);
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    if (u.table === undefined || !u.ran || !u.gap || !u.joint) { bad.push(`${tag}: a solve, ran, gap or joint line missing`); continue; }
    if ((u.nSigned || 0) !== 1) bad.push(`${tag}: ${u.nSigned || 0} signed lines, not 1`);
    const want = { pts, seed: SEED, bequestWeight: W, finalIntegral: 'true', bridgeRead: 'reader', mix: '3', switchMargin: '0', switchCharge: CHARGE };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (field(u.ran, 'tierState') === null) bad.push(`${tag}: no tier state`);
    if (u.joint.joint !== true) bad.push(`${tag}: one move for every world ${u.joint.joint}`);
    if (u.joint.margin !== '0' || u.joint.charge !== CHARGE) bad.push(`${tag}: switch margin ${u.joint.margin} charge ${u.joint.charge}`);
    if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax} (O53)`);
    const e = u.signed ? crossCheck(u.signed.gap, u.gap.gap) : null;
    if (e) bad.push(`${tag}: ${e}`);
    if (set === 'logblend' || set === 'reversed') {
      const r = mref(u.id, u.label);
      if (!r || !r.ran || !r.joint || !r.gap) { bad.push(`${tag}: no 7am record of this unit`); continue; }
      if (r.table !== u.table) bad.push(`${tag}: table ${u.table}, 7am's ${r.table}`);
      if (normRan(r.ran) !== normRan(u.ran)) bad.push(`${tag}: its ran line is not 7am's for this unit`);
      if (r.gap.gap !== u.gap.gap || r.gap.open1e3 !== u.gap.open1e3 || r.gap.open0 !== u.gap.open0) bad.push(`${tag}: gap ${u.gap.gap} opening ${u.gap.open1e3},${u.gap.open0}, 7am's ${r.gap.gap} ${r.gap.open1e3},${r.gap.open0}`);
      if (['scale', 'cap', 'decided'].some(k => r.joint[k] !== u.joint[k])) bad.push(`${tag}: its joint line is not 7am's (scale, cap, risk above)`);
    } else {
      const r = pref(u.id);
      if (!r || !r.ran || !r.joint) { bad.push(`${tag}: no P record for ${u.id}`); continue; }
      if (normRan(r.ran) !== normRan(u.ran)) bad.push(`${tag}: its ran line is not P's record's but for the path count`);
      if (['scale', 'cap', 'decided'].some(k => r.joint[k] !== u.joint[k])) bad.push(`${tag}: its joint line is not P's record's (scale, cap, risk above)`);
    }
  }
  // the gaps read from the records are positive numbers (so each is its own signed gap)
  for (const id of HOUSEHOLDS) {
    const r = pref(id);
    if (!r || !pos(r.gap && r.gap.gap)) bad.push(`${id}: P's linear gap ${r && r.gap ? r.gap.gap : 'missing'} is not a positive number`);
    if (!UNSPLIT.includes(id)) for (const set of ['logblend', 'reversed']) { const m = mref(id, labelOf(PTAG, set)); if (!m || !pos(m.gap && m.gap.gap)) bad.push(`${id}: 7am's ${set} gap ${m && m.gap ? m.gap.gap : 'missing'} is not a positive number`); }
    for (const set of ['halfblend', 'halfreversed']) { const m = mref(id, labelOf(BTAG, set)); if (!m || !pos(m.gap && m.gap.gap)) bad.push(`${id}: 7am's bundle ${set} gap ${m && m.gap ? m.gap.gap : 'missing'} is not a positive number`); }
  }
  // the tiers: 7am's check, on this run's units
  if (AM.TIERS.some(k => !o60[k])) bad.push('results-o60.txt: a tier row missing');
  else for (const t of tiers) {
    const set = setOf(t.label), tag = `${t.id} ${t.arm}/${t.label}`, half = set.startsWith('half'), up = /blend/.test(set) ? 1 : -1;
    for (const menu of t.tiers) for (const [n, v] of menu) {
      if (!AM.TIERS.includes(n)) continue;
      const want = AM.realOf(o60, n, set);
      if (Math.abs(v - want) > 0.005 + 1e-9) bad.push(`${tag}: ${n} ${v}, not ${+want.toFixed(4)}`);
      if (!(up * (v - o60[n].linear) >= (half ? 0.045 : 0.1) - 1e-9)) bad.push(`${tag}: ${n} moved ${(v - o60[n].linear).toFixed(3)} from linear, not the registered way by ${half ? 0.045 : 0.1} or more`);
    }
  }
  return bad;
}

/* rows: [{ id, p: { l, b, r, hb, hr }, c: { l, b, r, hb, hr } }] - P's signed gaps and the bundle's, as numbers */
const splitN = (l, b, r) => ([l, b, r].every(Number.isFinite) ? { F: (b - r) / 2, C: (b + r) / 2 - l } : null);
export function readRow(x) {
  const full = splitN(x.p.l, x.p.b, x.p.r), half = splitN(x.p.l, x.p.hb, x.p.hr), bf = splitN(x.c.l, x.c.b, x.c.r), bh = splitN(x.c.l, x.c.hb, x.c.hr);
  const q = full && half && full.C !== 0 ? Math.abs(half.C) / Math.abs(full.C) : null;
  const vs = half && bh && bh.C !== 0 ? Math.abs(half.C) / Math.abs(bh.C) : null;
  const r = full && half && full.F !== 0 && Math.abs(full.F) >= Math.abs(full.C) ? half.F / full.F : null;
  const beyond = q !== null && q < Q_BEYOND - 1e-9, fOff = r !== null && (r < F_OUT[0] - 1e-9 || r > F_OUT[1] + 1e-9), fIn = r === null || (r >= F_IN[0] - 1e-9 && r <= F_IN[1] + 1e-9);
  return { id: x.id, full, half, bf, bh, q, r, beyond, fOff, qb: bf && bh && bf.C !== 0 ? Math.abs(bh.C) / Math.abs(bf.C) : null, vs,
    smooth: q !== null && q >= Q_BEYOND - 1e-9 && q <= Q_SMOOTH + 1e-9 && fIn, kink: (q !== null && q >= Q_KINK - 1e-9) || beyond || fOff, under: vs !== null && vs <= UNDER + 1e-9, notUnder: vs !== null && vs >= NOT_UNDER - 1e-9 };
}
export function items(rows) {
  const R = Object.fromEntries(rows.map(x => [x.id, readRow(x)]));
  const fam = key => FAMILIES.map(([name, ids]) => { const k = ids.filter(id => R[id] && R[id][key]).length; return { name, k, of: ids.length, maj: k > ids.length / 2 }; });
  const sm = fam('smooth'), kk = fam('kink'), un = fam('under'), nu = fam('notUnder');
  const o1 = sm.every(f => f.maj) ? 'HELD' : kk.filter(f => f.maj).length >= 2 ? 'FALSIFIED' : 'INCONCLUSIVE';
  const o2 = un.every(f => f.maj) ? 'HELD' : nu.filter(f => f.maj).length >= 2 ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { R, it: [{ n: 1, sm, kk, outcome: o1 }, { n: 2, un, nu, outcome: o2 }] };
}

export function reading(units, pref, mref, bref, out = console.log) {
  const get = (id, l) => units.find(u => u.id === id && u.arm === 'READER' && u.label === l);
  const sg = (id, set) => (UNSPLIT.includes(id) || set.startsWith('half') ? get(id, labelOf(PTAG, set)).signed.gap : Number(mref(id, labelOf(PTAG, set)).gap.gap));
  const rows = HOUSEHOLDS.map(id => ({ id,
    p: { l: Number(pref(id).gap.gap), b: sg(id, 'logblend'), r: sg(id, 'reversed'), hb: sg(id, 'halfblend'), hr: sg(id, 'halfreversed') },
    c: { l: Number(bref(id, 'linear').gap.gap), b: Number(bref(id, 'logblend').gap.gap), r: Number(bref(id, 'reversed').gap.gap), hb: Number(mref(id, labelOf(BTAG, 'halfblend')).gap.gap), hr: Number(mref(id, labelOf(BTAG, 'halfreversed')).gap.gap) } }));
  const { R, it } = items(rows);
  const e = x => (x === null || x === undefined ? '-' : x.toExponential(4)), f2 = x => (x === null ? 'n/a' : x.toFixed(2));
  out(`7AQ: P AT HALF THE STEP - P (READER/TS+J, switchCharge ${CHARGE}, switchMargin 0) under half of 7ai's tier shift each way on 7am's seven households, and the full shift re-solved on the three 7am left unsplit, 30 points, every gap signed (negative: the held pair wins at margin 0 by that much); P's linear gaps are P's records, its other full-step gaps 7am's; the bundle's 7ai's (full) and 7am's (half)`);
  out('  P (signed gaps linear / blend / reversed / half blend / half reversed; the split at the full and half step; q; F at half over F at full)');
  for (const x of rows) { const r = R[x.id]; out(`    ${x.id.padEnd(11)} ${[x.p.l, x.p.b, x.p.r, x.p.hb, x.p.hr].map(g => e(g).padStart(11)).join(' ')}  full F ${e(r.full.F)} C ${e(r.full.C)}; half F ${e(r.half.F)} C ${e(r.half.C)}; q ${f2(r.q)}; F half/full ${r.full.F !== 0 ? f2(r.half.F / r.full.F) : 'n/a'}${r.r === null ? ' (not read: |F| under |C|)' : ''}; ${r.smooth ? 'smooth' : r.kink ? `non-smooth (${[r.q !== null && r.q >= Q_KINK - 1e-9 ? 'q within the half step' : '', r.beyond ? 'q beyond the half step' : '', r.fOff ? 'F off one half' : ''].filter(Boolean).join(', ')})` : 'neither'}`); }
  out("  the bundle's blind part (full, half; q) against P's (the share P's |C| is of the bundle's at each step)");
  for (const x of rows) { const r = R[x.id]; out(`    ${x.id.padEnd(11)} bundle C ${e(r.bf.C)} / ${e(r.bh.C)}  q ${f2(r.qb)}   P/bundle full ${f2(Math.abs(r.full.C) / Math.abs(r.bf.C))} half ${f2(r.vs)}`); }
  const fl = fs => fs.map(f => `${f.name} ${f.k} of ${f.of}`).join(', ');
  const [I1, I2] = it;
  out(`\nITEM 1 (P smooth: ${Q_BEYOND} <= q <= ${Q_SMOOTH} and F half/full in ${F_IN.join(' to ')} where read; non-smooth at q >= ${Q_KINK}, q < ${Q_BEYOND} or F half/full outside ${F_OUT.join(' to ')}; a family by its majority): smooth ${fl(I1.sm)}; non-smooth ${fl(I1.kk)} (HELD when all three families read smooth, FALSIFIED when two or more read non-smooth) -> ${I1.outcome}`);
  out(`ITEM 2 (P's blind part at half the step a third of the bundle's or less; not under at two thirds or more): under ${fl(I2.un)}; not under ${fl(I2.nu)} (HELD when all three read under, FALSIFIED when two or more read not under) -> ${I2.outcome}`);
  const g = ids => { const xs = ids.map(id => R[id]); return `${xs.filter(r => r.smooth).length} smooth, ${xs.filter(r => r.kink).length} non-smooth, of ${xs.length}`; };
  out(`REPORTED: P's q by whether the year-0 choice reads a reader year (O67's (C)): none read (${NOREADER.join(', ')}) ${g(NOREADER)}; reader years read (the rest) ${g(HOUSEHOLDS.filter(id => !NOREADER.includes(id)))}`);
  out(`REPORTED: P's q above 1 (a jump, O67's (B)) on ${HOUSEHOLDS.filter(id => R[id].q !== null && R[id].q > 1).join(', ') || 'none'}`);
  { const r = R[O75.id]; out(`REPORTED: O75 - ${O75.id}'s P blind part at the full step |C| ${e(Math.abs(r.full.C))} (the bound ${O75.bound.toExponential(3)}: ${Math.abs(r.full.C) >= O75.bound - 1e-9 ? 'met' : 'NOT MET'}), ${f2(Math.abs(r.full.C) / O75.bundle)} of the bundle's ${O75.bundle.toExponential(3)}`); }
  out(`\nOUTCOME: 1 ${I1.outcome}, 2 ${I2.outcome}`);
  return it;
}

/* PLANTED: a built set the gate must pass clean, faults it must refuse, and items over built rows */
function built(o = {}) {
  const o60 = { 'High Risk': { linear: 4.79, blend: 4.97 }, 'Medium/High Risk': { linear: 4.24, blend: 4.65 }, 'Medium Risk': { linear: 3.69, blend: o.smallBlend ? 3.77 : 4.18 }, 'Medium/Low Risk': { linear: 3.14, blend: 3.55 }, 'Low Risk': { linear: 2.59, blend: 2.76 } };
  const ranOf = n => `mix 3 pts 30 seed 7002 paths ${n} grid total30x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad 5 tierState 0/0,1/1,2/2 bequestWeight 0.02 finalIntegral true bridgeRead reader switchMargin 0 switchCharge ${o.ranCharge ? '0.002' : '0.001'}`;
  const jointOf = () => ({ joint: true, margin: '0', charge: '0.001', scale: 949999, cap: 3799996, deathTax: 0, tier: 'own', decided: 'off:_no_tier_above_the_plan' });
  const us = [], tiers = [], open2 = [], rec = {};
  for (const [id, a, l] of UNITS) {
    const set = setOf(l);
    const gap = set === 'reversed' && id !== 'share 0.90' ? '0' : '2.0000e-4';
    const signed = gap === '0' ? -1.5e-4 : 2e-4;
    rec[`${id}|${l}`] = { id, arm: a, label: l, table: '99.5', ran: ranOf(8000), gap: { gap, open1e3: 0, open0: 2 }, joint: jointOf() };
    if (o.skip === `${id}|${l}`) continue;
    const u = { id, arm: a, label: l, lambda: o.lambda ? '0.03' : LAMBDA, tier: 'own', riskAbove: 'auto', mix: '3', done: !(o.noDone && id === 'S126'), table: '99.5', ran: ranOf(8000), gap: { gap, open1e3: 0, open0: 2 }, joint: jointOf(), signed: { gap: signed }, nSigned: o.twoSigned && id === 'S194' ? 2 : 1 };
    if (o.noSigned && id === 'S162') { delete u.signed; delete u.nSigned; }
    if (o.signPos && id === 'bridge 0' && set === 'reversed') u.signed = { gap: 1.5e-4 };
    if (o.signOff && id === 'S126' && set === 'halfblend') u.signed = { gap: 2.1e-4 };
    if (o.jointCharge && id === 'S194') u.joint = { ...u.joint, charge: '0.002' };
    if (o.charge && id === 'S194') { u.ran = u.ran.replace('switchCharge 0.001', 'switchCharge 0.002'); u.joint = { ...u.joint, charge: '0.002' }; }
    if (o.margin && id === 'S194') u.joint = { ...u.joint, margin: '0.001' };
    if (o.fullTable && id === 'share 0.90' && set === 'logblend') u.table = '99.6';
    if (o.fullGap && id === 'share 0.90' && set === 'reversed') u.gap = { ...u.gap, gap: '2.0001e-4' };
    if (o.fullOpen && id === 'bridge 0' && set === 'logblend') u.gap = { ...u.gap, open0: 1 };
    if (o.halfRan && id === 'bridge 1' && set === 'halfreversed') u.ran = u.ran.replace('minPot 29000', 'minPot 30000');
    if (o.fullRan && id === 'share 0.50' && set === 'logblend') u.ran = u.ran.replace('minPot 29000', 'minPot 30000');
    if (o.death && id === 'S162') u.joint = { ...u.joint, deathTax: 0.4 };
    if (o.noReader && id === 'S162') u.ran = u.ran.replace('bridgeRead reader', 'bridgeRead false');
    us.push(u);
    const val = n => AM.realOf(o60, n, set) + (o.halfOff && set === 'halfblend' && id === 'S126' ? 0.01 : 0);
    tiers.push({ id, arm: a, label: l, tiers: [['High Risk', 'Medium/High Risk', 'Medium Risk'], ['Medium/High Risk', 'Medium Risk', 'Medium/Low Risk']].map(c => c.map(n => [n, +val(n).toFixed(4)])) });
    if (!(o.noOpen2 && id === 'S162' && set === 'halfreversed')) open2.push({ id, arm: a, label: l, at1e3: '0/0', at0: '2/2' });
  }
  if (o.twice) us.push({ ...us[3] });
  if (o.extra) us.push({ ...us[3], id: 'S999' });
  const pref = id => (o.noRecord && id === 'S162' ? { gap: { gap: '1.0000e-4', open1e3: 0, open0: 2 } } : { table: '99.7', ran: o.noReader && id === 'S162' ? ranOf(16000).replace('bridgeRead reader', 'bridgeRead false') : ranOf(16000), gap: { gap: o.linZero && id === 'S194' ? '0' : '1.0000e-4', open1e3: 0, open0: 2 }, joint: jointOf() });
  const mref = (id, l) => {
    if (o.noAm && id === 'bridge 0' && setOf(l) === 'logblend') return null;
    if (l.startsWith(PTAG)) return rec[`${id}|${l}`] || { id, label: l, table: '99.5', ran: ranOf(8000), gap: { gap: o.amZero && id === 'S194' && setOf(l) === 'reversed' ? '0' : '2.0000e-4', open1e3: 0, open0: 2 }, joint: jointOf() };
    return { gap: { gap: o.bZero && id === 'S162' ? '0' : '1.0e-3' } };
  };
  return { us, pref, mref, tiers, open2, o60 };
}
const REACHED = { 1: new Set(), 2: new Set() };
export function planted() {
  const cases = [];
  const refused = o => { const b = built(o); return String(gate(b.us, b.pref, b.mref, b.tiers, b.open2, b.o60).length > 0); };
  { const b = built(); const bad = gate(b.us, b.pref, b.mref, b.tiers, b.open2, b.o60); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o] of [['a missing unit', { skip: 'S126|TS+J/MP/30x5/W0.02@halfreversed' }], ['a unit twice', { twice: true }], ['an unregistered unit', { extra: true }], ['other unit settings (lambda)', { lambda: true }], ['a unit not done', { noDone: true }],
    ['a missing signed line', { noSigned: true }], ['two signed lines', { twoSigned: true }], ["a positive signed gap where the bisected gap is '0'", { signPos: true }], ['a signed gap off its bisected one', { signOff: true }],
    ['the charge 0.002', { charge: true }], ['the switch margin 0.001', { margin: true }], ["a full-step table not 7am's", { fullTable: true }], ["a full-step gap not 7am's (the last digit)", { fullGap: true }], ["a full-step opening not 7am's", { fullOpen: true }],
    ["a full-step ran line not 7am's", { fullRan: true }], ["a half ran line not P's record's", { halfRan: true }], ['a pension death charge', { death: true }], ['the reader off', { noReader: true }],
    ['a household whose P record has a gap but no ran or joint line', { noRecord: true }], ["a full-step unit with no 7am record", { noAm: true }], ["P's linear gap '0' in its record", { linZero: true }], ["7am's full-step gap '0' on a household read from the records", { amZero: true }],
    ["the bundle's half gap '0' in 7am's records", { bZero: true }], ["P's ran line with charge 0.002 (its records' too)", { ranCharge: true }], ['a half tier 0.01 off its set', { halfOff: true }], ['a tier moved 0.04 at the half step, at its set\'s figure (the move short of 0.045)', { smallBlend: true }], ['the joint line\'s charge 0.002 alone', { jointCharge: true }], ['a missing opening2 line', { noOpen2: true }]])
    cases.push([`the gate refuses ${nm}`, refused(o), 'true']);
  // items over built rows: P's five signed gaps and the bundle's five
  const B = { l: 1.0e-3, b: 1.2e-3, r: 1.0e-3, hb: 1.1e-3, hr: 1.0e-3 };     // the bundle: C full 1e-4, C half 5e-5
  const Pq = q => { const Cf = 4e-5, Ch = q * Cf; return { l: 5e-4, b: 6e-4 + Cf, r: 4e-4 + Cf, hb: 5.5e-4 + Ch, hr: 4.5e-4 + Ch }; };
  const Pv = vs => { const Ch = vs * 5e-5, Cf = Ch / 0.25; return { l: 5e-4, b: 6e-4 + Cf, r: 4e-4 + Cf, hb: 5.5e-4 + Ch, hr: 4.5e-4 + Ch }; };
  const rows = f => HOUSEHOLDS.map(id => ({ id, p: f(id), c: B }));
  const out = rs => items(rs).it.map(i => { REACHED[i.n].add(i.outcome); return i.outcome; }).join(' ');
  const one = (rs, k) => { const o = items(rs).it[k - 1].outcome; REACHED[k].add(o); return o; };
  cases.push(['P smooth (q 0.25) and its half blind a tenth of the bundle\'s everywhere: HELD HELD', out(rows(() => Pq(0.25))), 'HELD HELD']);
  cases.push(['P jumps (q 1) with its half blind equal to the bundle\'s: FALSIFIED FALSIFIED', out(rows(() => { const Cf = 5e-5, Ch = 5e-5; return { l: 5e-4, b: 6e-4 + Cf, r: 4e-4 + Cf, hb: 5.5e-4 + Ch, hr: 4.5e-4 + Ch }; })), 'FALSIFIED FALSIFIED']);
  cases.push(['smooth on 3 of the S126 family, S194, S162: 1 HELD', one(rows(id => (['share 0.50', 'share 0.90'].includes(id) ? Pq(1) : Pq(0.25))), 1), 'HELD']);
  cases.push(['non-smooth on 3 of the S126 family, smooth in S194 and S162: 1 INCONCLUSIVE (one family non-smooth; FALSIFIED needs two)', one(rows(id => (['share 0.50', 'share 0.90', 'bridge 0'].includes(id) ? Pq(1) : Pq(0.25))), 1), 'INCONCLUSIVE']);
  cases.push(['non-smooth in S194 and S162 only: 1 FALSIFIED (two families)', one(rows(id => (['S194', 'S162'].includes(id) ? Pq(0.5) : Pq(0.25))), 1), 'FALSIFIED']);
  cases.push(['q 0.36 everywhere (neither bound): 1 INCONCLUSIVE', one(rows(() => Pq(0.36)), 1), 'INCONCLUSIVE']);
  cases.push(['q exactly 0.33 reads smooth, 0.4 non-smooth, 0.15 smooth', `${readRow({ id: 'x', p: Pq(0.33), c: B }).smooth} ${readRow({ id: 'x', p: Pq(0.4), c: B }).kink} ${readRow({ id: 'x', p: Pq(0.15), c: B }).smooth}`, 'true true true']);
  cases.push(['q 0.05 (a snap beyond the half step) reads non-smooth, not smooth', `${readRow({ id: 'x', p: Pq(0.05), c: B }).smooth} ${readRow({ id: 'x', p: Pq(0.05), c: B }).kink}`, 'false true']);
  cases.push(['snaps beyond the half step in all families: 1 FALSIFIED', one(rows(() => Pq(0.05)), 1), 'FALSIFIED']);
  const Fr = (fr, Cf = 4e-5, Ff = 1e-4) => ({ l: 5e-4, b: 5e-4 + Ff + Cf, r: 5e-4 - Ff + Cf, hb: 5e-4 + fr * Ff + Cf / 4, hr: 5e-4 - fr * Ff + Cf / 4 });
  cases.push(['q 0.25 with F half/full 0.2 (|F| over |C|) reads non-smooth; 0.3 neither; 0.5 smooth', ['kink', 'smooth'].map(k => [0.2, 0.3, 0.5].map(f => readRow({ id: 'x', p: Fr(f), c: B })[k] ? 1 : 0).join('')).join(' '), '100 001']);
  cases.push(['F half/full 0.2 where |F| is under |C| is not read: smooth', String(readRow({ id: 'x', p: Fr(0.2, 4e-5, 2e-5), c: B }).smooth), 'true']);
  cases.push(['P\'s half blind half the bundle\'s everywhere: 2 INCONCLUSIVE', one(rows(() => Pv(0.5)), 2), 'INCONCLUSIVE']);
  cases.push(['P\'s half blind 0.8 of the bundle\'s in S194 and S162 only: 2 FALSIFIED', one(rows(id => (['S194', 'S162'].includes(id) ? Pv(0.8) : Pv(0.2))), 2), 'FALSIFIED']);
  cases.push(['not under in S194 only: 2 INCONCLUSIVE (FALSIFIED needs two families)', one(rows(id => (id === 'S194' ? Pv(0.8) : Pv(0.5))), 2), 'INCONCLUSIVE']);
  cases.push(['under in S194 and S162, not in the S126 family: 2 INCONCLUSIVE', one(rows(id => (['S194', 'S162'].includes(id) ? Pv(0.2) : Pv(0.5))), 2), 'INCONCLUSIVE']);
  cases.push(['a negative signed gap enters the split as a number: C of (1e-4, 2e-4, -1e-4) is -5e-5', splitN(1e-4, 2e-4, -1e-4).C.toExponential(1), '-5.0e-5']);
  cases.push(['a full-step C of 0 gives no q (counts neither way)', `${readRow({ id: 'x', p: { l: 0.25, b: 0.5, r: 0, hb: 0.3, hr: 0.25 }, c: B }).q}`, 'null']);
  cases.push(['7am\'s split of bridge 1 under P reproduced from its gaps: blind -4.234e-5', (() => { const t = readFileSync(join(HERE, 'results-7am.txt'), 'utf8'); const m = /^\s+bridge 1\s+(\S+)\s+(\S+)\s+(\S+)\s+open/m.exec(t); return m ? splitN(+m[1], +m[2], +m[3]).C.toExponential(3) : 'no row'; })(), '-4.234e-5']);
  cases.push(['parse reads the signed line', JSON.stringify(parse('S126             case | unit READER/TS+J/MP/30x5/W0.02@halfblend | lambda x tier own riskAbove auto mix 3\n                 signed READER/TS+J/MP/30x5/W0.02@halfblend: -1.234500e-4 stay 0.990000000 move 0.989876550\n').map(u => (u.signed ? [u.signed.gap, u.nSigned] : null))), '[[-0.00012345,1]]']);
  cases.push(['the units are audit-7aq.mjs\'s (20)', String(UNITS.length), '20']);
  cases.push(['the families cover the seven households once each', JSON.stringify(FAMILIES.flatMap(f => f[1]).sort()), JSON.stringify([...HOUSEHOLDS].sort())]);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2].map(k => `OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`).join('\n')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const R_ = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = R_(0, 'diag7aq'), DIRM = R_(1, 'diag7am'), DIRP = R_(2, 'diagP'), DIRI = R_(3, 'diag7ai');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse), tiers = Object.values(logs).flatMap(parseTiers), open2 = Object.values(logs).flatMap(parseOpen2);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const logsM = logsOf(DIRM), logsP = logsOf(DIRP), logsI = logsOf(DIRI);
  requireFairLogs(logsM, AM.PRED); requireFairLogs(logsP, P.PRED); requireFairLogs(logsI, I.PRED);
  const unitsM = Object.values(logsM).flatMap(AM.parse), jobsP = Object.values(logsP).flatMap(P.parse), unitsI = Object.values(logsI).flatMap(A.parse);
  const pref = id => { const j = jobsP.find(x => x.kind === 'open' && x.id === id && x.arm === 'READER' && x.grid === '30x5' && x.w === W && x.done); return j && j.tags.P ? { ...j.tags.P } : null; };
  const bref = (id, set) => unitsI.find(u => u.id === id && u.arm === 'READER' && u.label === I.labelOf('TS+J', set) && u.done) || null;
  const mref = (id, l) => unitsM.find(u => u.id === id && u.arm === 'READER' && u.label === l && u.done) || null;
  const o60 = readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8'));
  const badM = AM.gate(unitsM, pref, bref, Object.values(logsM).flatMap(parseTiers), Object.values(logsM).flatMap(parseOpen2), o60);
  if (badM.length) { console.log(`FAIR-TEST GATE: FAILED - 7am's records do not pass 7am's own gate\n  ${badM.join('\n  ')}`); process.exit(1); }
  const bad = gate(units, pref, mref, tiers, open2, o60);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; 7am's records pass 7am's gate; each full-step unit is 7am's own solve (table, ran line, gap, opening, joint line); each half unit P's record but for the tier returns; every signed gap agrees with its bisected gap; the gaps read from the records positive; the tiers moved by O60's figures (planted ${np})\n`);
  reading(units, pref, mref, bref);
}
