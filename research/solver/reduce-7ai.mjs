/*
 * THE 7AI REDUCER: O60'S OPENINGS CHECK (predictions/diag-7ai.md; PLAN.md 7ai; O60). Reads results/diag7ai/case*.txt
 * (batch-7ai.sh: audit-7ai.mjs, one process a unit; 7aa's line format, parsed by reduce-7aa.mjs parse, plus an opening2 line
 * and a tiers line) beside 7af's (results/diag7af) and 7ag's (results/diag7ag) records, each read through its own stamps.
 * Redesigned before registration by the deep review after P (29 Sep 23:31 UK): a reversed reference arm, both tiers in the
 * opening, ties declared.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7ai, 7af and 7ag;
 *   - every registered unit once and done (CAND = READER/TS+J/W0.02 and SHIP = OFF/PRODUCT/W0.02 on the seven households,
 *     each with the linear tiers, label as 7af's, the blend medians, label + '@logblend', and the reversed shift, label +
 *     '@reversed'); nothing unregistered; an opening2 line on every unit;
 *   - each unit's settings: lambda held, the plan's tier, 'auto' risk above, three worlds; 30 points, seed 7002, the
 *     estate weight 0.02, the final year exact, the bridge read the arm's (reader on CAND, false on SHIP), the tier state on
 *     CAND alone; the switch margin 0.001, no pension death charge (O53);
 *   - IDENTITY: every linear unit is 7af's or 7ag's own unit (the same household, arm and label) - its table, its ran line
 *     but the path count, its year-0 gap and opening, and its joint line's scale, cap and risk-above decision - so the
 *     copied solve (audit-7ai.mjs) is the registered one and the linear tiers are the records';
 *   - WITHIN A PAIR (household and arm): each shifted unit's ran line and joint line are the linear unit's (nothing but the
 *     tier returns differs: they are not on the ran line, so equal ran lines say every other setting is the same);
 *   - THE TIERS: each tiers line names the same tiers in all three units; the linear reals are results-o60.txt's linear
 *     column to 0.01 (one rounding step, audit-7ai.mjs), the blend reals its blend column exactly, the reversed reals
 *     2 x linear - blend (O60's columns, to 0.01) exactly; every named tier moved 0.1 point or more, up in the blend and
 *     down in the reversed (the override reached the solve).
 * THE ITEMS, by the registered rule (the solves' own numbers, read exactly: no sampling enters a year-0 opening). The gap is
 * the switch margin the held tiers need to stay at year 0 (the de-risk's advantage), ordered '0' < a number < '>1'; a
 * change is up, down or tied (equal, '0' to '0' and '>1' to '>1' included).
 *   1. The response has the sign of the change: on each of the 14 pairs, the blend's gap change and the reversed arm's,
 *      each against linear; "opposite" when one is up and the other down, "same" when both up or both down; a pair with
 *      either tied is left out. With U = opposite + same: HELD when U >= 7 and opposite >= 0.8 U; FALSIFIED when U >= 7
 *      and same >= 0.4 U; else INCONCLUSIVE.
 *   2. Which way the blend moves it: of the pairs whose blend gap is not tied with linear (B of them), up and down. HELD
 *      (the blend favours the de-risk) when B >= 7 and up >= 0.7 B; FALSIFIED (it favours holding) when B >= 7 and down >=
 *      0.7 B; else INCONCLUSIVE.
 * Reported, not items: every pair's gaps and openings (the pension's and the ISA's tier, at 0.001 and at 0) with each tier
 * set; the openings at 0.001 the blend moves and the reversed moves (the plan row's rule: O60 goes to the maintainer before
 * 7u if the blend moves one); the gap's relative change; the table (the solve's survival reading).
 *   node research/solver/reduce-7ai.mjs [dir] [dir7af] [dir7ag] > research/solver/results-7ai.txt
 *   node research/solver/reduce-7ai.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as A from './reduce-7aa.mjs';
import * as F from './reduce-7af.mjs';
import * as G from './reduce-7ag.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ai.md';
export const { field, LAMBDA } = A;
export const PTS = '30', SEED = '7002', W = '0.02', UMIN = 7, OPP = 0.8, SAME = 0.4, DIR = 0.7;
export const HOUSEHOLDS = ['share 0.50', 'share 0.90', 'bridge 0', 'bridge 1', 'S126', 'S194', 'S162'];
export const FROM_AF = ['share 0.50', 'share 0.90', 'bridge 0', 'bridge 1', 'S126', 'S194'];
export const ARMS = [['READER', 'TS+J'], ['OFF', 'PRODUCT']];
export const SETS = ['linear', 'logblend', 'reversed'];
export const labelOf = (tag, set) => `${tag}/W${W}${set === 'linear' ? '' : '@' + set}`;
export const UNITS = ARMS.flatMap(([a, tag]) => HOUSEHOLDS.flatMap(id => SETS.map(set => [id, a, labelOf(tag, set)])));
export const TIERS = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk'];

export function readO60(text) {
  const o = {};
  for (const k of TIERS) { const m = new RegExp(`^  ${k.replace(/\//g, '\\/')}\\s+\\S+\\s+(\\S+)%\\s+(\\S+)%`, 'm').exec(text); if (m) o[k] = { linear: +m[1], blend: +m[2] }; }
  return o;
}
const TIERSL = /^\s+tiers (\S+?)\/(\S+): pen (\S+) isa (\S+)$/;
const OPEN2L = /^\s+opening2 (\S+?)\/(\S+): (\d+),(\d+) (\d+),(\d+)$/;
export function parseOpen2(text) {
  const out = []; let cur = null;
  for (const line of text.split('\n')) {
    const c = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \|/.exec(line);
    if (c) { cur = { id: c[1].trim(), arm: c[2], label: c[3] }; continue; }
    const m = OPEN2L.exec(line);
    if (m && cur && m[1] === cur.arm && m[2] === cur.label) out.push({ ...cur, at1e3: `${m[3]}/${m[4]}`, at0: `${m[5]}/${m[6]}` });
  }
  return out;
}
export const reversedOf = (o, k) => +(2 * o[k].linear - o[k].blend).toFixed(2);
export function parseTiers(text) {
  const out = []; let cur = null;
  for (const line of text.split('\n')) {
    const c = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \|/.exec(line);
    if (c) { cur = { id: c[1].trim(), arm: c[2], label: c[3] }; continue; }
    const m = TIERSL.exec(line);
    if (m && cur && m[1] === cur.arm && m[2] === cur.label) out.push({ ...cur, tiers: [m[3], m[4]].map(s => s.split(',').map(x => { const i = x.lastIndexOf(':'); return [x.slice(0, i).replace(/_/g, ' '), +x.slice(i + 1)]; })) });
  }
  return out;
}
export const normRan = ran => (ran || '').replace(/(^| )paths \d+/, '$1paths X');
const setOf = label => (label.endsWith('@logblend') ? 'logblend' : label.endsWith('@reversed') ? 'reversed' : 'linear');
const linearOf = label => label.replace(/@(logblend|reversed)$/, '');

/* THE GATE. `ref(id, arm, label)` 7af's or 7ag's parsed unit; `tiers` the parsed tiers lines; `o60` results-o60.txt read */
export function gate(units, ref, tiers, o60, { pts = PTS, open2 = null } = {}) {
  const bad = [];
  if (open2) for (const [id, a, l] of UNITS) { const k = open2.filter(x => x.id === id && x.arm === a && x.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} opening2 lines, not 1`); }
  for (const [id, a, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === a && u.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    if (u.table === undefined || !u.ran || !u.gap || !u.joint) { bad.push(`${tag}: a solve, ran, gap or joint line missing`); continue; }
    const TSJ = u.label.startsWith('TS+J');
    const want = { pts, seed: SEED, bequestWeight: W, finalIntegral: 'true', bridgeRead: u.arm === 'READER' ? 'reader' : 'false', mix: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (TSJ !== (field(u.ran, 'tierState') !== null)) bad.push(`${tag}: the tier state ${field(u.ran, 'tierState')} on ${TSJ ? 'CAND' : 'SHIP'}`);
    if (u.joint.joint !== TSJ) bad.push(`${tag}: one move for every world ${u.joint.joint} on ${TSJ ? 'CAND' : 'SHIP'}`);
    if (u.joint.margin !== '0.001') bad.push(`${tag}: switch margin ${u.joint.margin}`);
    if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax} (O53)`);
    if (setOf(u.label) === 'linear') {
      const r = ref(u.id, u.arm, u.label);
      if (!r) { bad.push(`${tag}: no reference unit in 7af's or 7ag's records`); continue; }
      if (r.table !== u.table) bad.push(`${tag}: table ${u.table}, the reference's ${r.table}`);
      if (normRan(r.ran) !== normRan(u.ran)) bad.push(`${tag}: its ran line is not the reference's but for the path count`);
      if (!r.gap || r.gap.gap !== u.gap.gap || r.gap.open1e3 !== u.gap.open1e3 || r.gap.open0 !== u.gap.open0) bad.push(`${tag}: gap ${u.gap.gap} opening ${u.gap.open1e3},${u.gap.open0}, the reference's ${r.gap && r.gap.gap} ${r.gap && r.gap.open1e3},${r.gap && r.gap.open0}`);
      if (!r.joint || r.joint.scale !== u.joint.scale || r.joint.cap !== u.joint.cap || r.joint.decided !== u.joint.decided) bad.push(`${tag}: its joint line is not the reference's`);
    } else {
      const L = get(u.id, u.arm, linearOf(u.label));
      if (L && L.ran && L.ran !== u.ran) bad.push(`${tag}: its ran line is not the linear unit's`);
      if (L && L.joint && ['joint', 'margin', 'scale', 'cap', 'deathTax', 'tier', 'decided'].some(k => L.joint[k] !== u.joint[k])) bad.push(`${tag}: its joint line is not the linear unit's`);
    }
  }
  // the tiers
  if (TIERS.some(k => !o60[k])) bad.push(`results-o60.txt: a tier row missing`);
  else for (const [id, a, l] of UNITS.filter(([, , l]) => setOf(l) === 'linear')) {
    const lt = tiers.filter(t => t.id === id && t.arm === a && t.label === l);
    const sh = ['logblend', 'reversed'].map(set => ({ set, t: tiers.filter(t => t.id === id && t.arm === a && t.label === `${l}@${set}`) }));
    if (lt.length !== 1 || sh.some(x => x.t.length !== 1)) { bad.push(`${id} ${a}/${l}: ${lt.length}, ${sh.map(x => x.t.length).join(' and ')} tiers lines (linear, blend, reversed), not 1 each`); continue; }
    for (let c = 0; c < 2; c++) {
      const x = lt[0].tiers[c];
      x.forEach(([n, v]) => { if (TIERS.includes(n) && Math.abs(v - o60[n].linear) > 0.01 + 1e-9) bad.push(`${id} ${a}/${l}: ${n} linear ${v}, not O60's ${o60[n].linear} to 0.01`); });
      for (const { set, t } of sh) {
        const y = t[0].tiers[c];
        if (x.length !== y.length || x.some(([n], i) => n !== y[i][0])) { bad.push(`${id} ${a}/${l}@${set}: the tier menus name different tiers`); continue; }
        x.forEach(([n, v], i) => {
          if (!TIERS.includes(n)) return;
          const b = y[i][1], want = set === 'logblend' ? o60[n].blend : reversedOf(o60, n), mv = set === 'logblend' ? b - v : v - b;
          if (Math.abs(b - want) > 1e-9) bad.push(`${id} ${a}/${l}@${set}: ${n} ${b}, not ${want}`);
          if (!(mv >= 0.1 - 1e-9)) bad.push(`${id} ${a}/${l}@${set}: ${n} moved ${mv.toFixed(2)} the registered way, under 0.1 point (the override did not reach the solve)`);
        });
      }
    }
  }
  return bad;
}

/* the gap's order: '0' < a number < '>1' */
export const gapRank = g => (g === '0' ? 0 : g === '>1' ? Infinity : Number(g));
export const dirOf = (x, y) => Math.sign(gapRank(y) - gapRank(x)) || 0;
export function items(pairs) {
  // pairs: [{ id, arm, lin: { gap, ... }, bl: {...}, rv: {...} }]
  let opp = 0, same = 0, up = 0, dn = 0;
  for (const p of pairs) {
    const b = dirOf(p.lin.gap, p.bl.gap), r = dirOf(p.lin.gap, p.rv.gap);
    if (b && r) { if (b === -r) opp++; else same++; }
    if (b > 0) up++; else if (b < 0) dn++;
  }
  const U = opp + same, B = up + dn;
  return [
    { n: 1, opp, same, U, outcome: U >= UMIN && opp >= OPP * U ? 'HELD' : U >= UMIN && same >= SAME * U ? 'FALSIFIED' : 'INCONCLUSIVE' },
    { n: 2, up, dn, B, outcome: B >= UMIN && up >= DIR * B ? 'HELD' : B >= UMIN && dn >= DIR * B ? 'FALSIFIED' : 'INCONCLUSIVE' }];
}

export function reading(units, open2, out = console.log) {
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  const o2 = (id, a, l) => { const x = open2.find(y => y.id === id && y.arm === a && y.label === l); return x ? `${x.at1e3} ${x.at0}` : '?'; };
  const pairs = ARMS.flatMap(([a, tag]) => HOUSEHOLDS.map(id => {
    const x = set => { const u = get(id, a, labelOf(tag, set)); return { gap: u.gap.gap, open: o2(id, a, labelOf(tag, set)), at1e3: o2(id, a, labelOf(tag, set)).split(' ')[0], table: Number(u.table) }; };
    return { id, arm: `${a}/${tag}`, lin: x('linear'), bl: x('logblend'), rv: x('reversed') };
  }));
  out(`7AI: O60'S OPENINGS CHECK - the year-0 gap and opening (pension/ISA tiers at 0.001 and at 0) with the import's linear tier returns, the medians of their blends (results-o60.txt) and the same shift reversed, CAND (READER/TS+J/W${W}) and SHIP (OFF/PRODUCT/W${W}), 30 points; the linear solves held to 7af's and 7ag's records`);
  out('  household     arm               | linear: gap   opening      | blend: gap    opening      change | reversed: gap opening      change');
  const rel = (a, b) => (Number.isFinite(gapRank(a)) && Number.isFinite(gapRank(b)) && gapRank(a) > 0 ? `${(100 * (gapRank(b) / gapRank(a) - 1)).toFixed(1)}%` : 'n/a');
  for (const p of pairs) out(`  ${p.id.padEnd(12)}  ${p.arm.padEnd(16)}  | ${p.lin.gap.padStart(10)}  ${p.lin.open.padEnd(11)} | ${p.bl.gap.padStart(10)}  ${p.bl.open.padEnd(11)} ${rel(p.lin.gap, p.bl.gap).padStart(7)} | ${p.rv.gap.padStart(10)}  ${p.rv.open.padEnd(11)} ${rel(p.lin.gap, p.rv.gap).padStart(7)}${p.lin.at1e3 !== p.bl.at1e3 ? '   BLEND MOVES THE OPENING' : ''}${p.lin.at1e3 !== p.rv.at1e3 ? '   REVERSED MOVES IT' : ''}`);
  const IT = items(pairs);
  out(`\nITEM 1 (the response has the sign of the change): opposite ${IT[0].opp}, same ${IT[0].same}, of ${IT[0].U} untied pairs (HELD at ${UMIN} or more untied and opposite ${100 * OPP}% or more; FALSIFIED at same ${100 * SAME}% or more) -> ${IT[0].outcome}`);
  out(`ITEM 2 (which way the blend moves the gap): up ${IT[1].up}, down ${IT[1].dn}, of ${IT[1].B} untied pairs (HELD at ${UMIN} or more untied and up ${100 * DIR}% or more; FALSIFIED at down ${100 * DIR}% or more) -> ${IT[1].outcome}`);
  const mb = pairs.filter(p => p.lin.at1e3 !== p.bl.at1e3), mr = pairs.filter(p => p.lin.at1e3 !== p.rv.at1e3);
  out(`REPORTED: the blend moves ${mb.length} of ${pairs.length} openings at 0.001 (${mb.map(p => `${p.id} ${p.arm} ${p.lin.at1e3} to ${p.bl.at1e3}`).join('; ') || 'none'}); the reversed shift moves ${mr.length} (${mr.map(p => `${p.id} ${p.arm} ${p.lin.at1e3} to ${p.rv.at1e3}`).join('; ') || 'none'}); the table with the blend rises on ${pairs.filter(p => p.bl.table > p.lin.table).length} of ${pairs.length} (mean ${(pairs.reduce((t, p) => t + p.bl.table - p.lin.table, 0) / pairs.length).toFixed(4)} points)`);
  out(`\nOUTCOME: 1 ${IT[0].outcome}, 2 ${IT[1].outcome}`);
  return IT;
}

/* PLANTED: built units and tiers that the gate must pass clean, and faults it must refuse; items over built pairs */
function built(o = {}) {
  const o60 = { 'High Risk': { linear: 4.79, blend: 4.97 }, 'Medium/High Risk': { linear: 4.24, blend: 4.65 }, 'Medium Risk': { linear: 3.69, blend: o.smallMove ? 3.74 : 4.18 }, 'Medium/Low Risk': { linear: 3.14, blend: 3.55 }, 'Low Risk': { linear: 2.59, blend: 2.76 } };
  const ranOf = (a, tsj, n) => `mix 3 pts 30 seed 7002 paths ${n} grid total30x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad 5${tsj ? ' tierState 0/0,1/1,2/2' : ''} bequestWeight 0.02 finalIntegral true bridgeRead ${a === 'READER' ? 'reader' : 'false'}`;
  const us = [], refs = [], tiers = [], open2 = [];
  const GAP = { linear: '1.0000e-3', logblend: '1.1000e-3', reversed: '9.0000e-4' };
  for (const [id, a, l] of UNITS) {
    const skip = o.skip === `${id}|${a}|${l}`;
    const tsj = l.startsWith('TS+J'), set = setOf(l);
    const u = { id, arm: a, label: l, lambda: o.lambda ? '0.03' : LAMBDA, tier: 'own', riskAbove: 'auto', mix: '3', done: !(o.noDone && id === 'S126'), table: set === 'logblend' ? '99.9000' : '99.8000',
      ran: ranOf(a, tsj, 8000), gap: { gap: GAP[set], open1e3: set === 'logblend' ? 2 : 0, open0: 2 }, joint: { joint: tsj, margin: o.margin && id === 'S194' ? '0' : '0.001', scale: 950000, cap: 3800000, deathTax: o.death && id === 'S194' ? 0.4 : 0, tier: 'own', decided: 'off:_no_tier_above_the_plan' } };
    if (o.blendRan && set === 'logblend' && id === 'bridge 0') u.ran = u.ran.replace('minPot 29000', 'minPot 30000');
    if (o.revRan && set === 'reversed' && id === 'bridge 0') u.ran = u.ran.replace('minPot 29000', 'minPot 30000');
    if (o.bridge && id === 'bridge 1' && a === 'OFF') u.ran = u.ran.replace('bridgeRead false', 'bridgeRead reader');
    if (!skip) us.push(u);
    if (set === 'linear') refs.push({ ...u, table: o.table && id === 'S162' ? '99.7000' : u.table, ran: u.ran.replace('paths 8000', `paths ${id === 'S162' ? 16000 : 8000}`), gap: { ...u.gap, gap: o.gap && id === 'share 0.90' ? '9.0000e-4' : u.gap.gap } });
    const val = (n, st) => (st === 'linear' ? +(o60[n].linear + (o.linOff && id === 'S194' ? 0.05 : 0)).toFixed(2) : st === 'logblend' ? o60[n].blend : +(reversedOf(o60, n) + (o.revOff && id === 'S126' ? 0.05 : 0)).toFixed(2));
    const menu = st => [['High Risk', 'Medium/High Risk', 'Medium Risk'], ['Medium/High Risk', 'Medium Risk', 'Medium/Low Risk']].map(c => c.map(n => [n, val(n, st)]));
    tiers.push({ id, arm: a, label: l, tiers: menu(set) });
    if (!(o.noOpen2 && id === 'S162' && set === 'reversed')) open2.push({ id, arm: a, label: l, at1e3: set === 'logblend' ? '2/2' : '0/0', at0: '2/2' });
  }
  if (o.twice) us.push({ ...us[0] });
  if (o.extra) us.push({ ...us[0], id: 'S999' });
  const ref = (id, a, l) => refs.find(r => r.id === id && r.arm === a && r.label === l) || null;
  return { us, ref, tiers, o60, open2 };
}
function planted() {
  const cases = [];
  const refused = o => { const b = built(o); return String(gate(b.us, b.ref, b.tiers, b.o60, { open2: b.open2 }).length > 0); };
  { const b = built(); const bad = gate(b.us, b.ref, b.tiers, b.o60, { open2: b.open2 }); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o] of [['a missing unit', { skip: 'S126|READER|TS+J/W0.02@reversed' }], ['a unit twice', { twice: true }], ['an unregistered unit', { extra: true }], ['other unit settings (lambda)', { lambda: true }],
    ['a unit not done', { noDone: true }], ['a linear table that is not the reference\'s', { table: true }], ['a linear gap that is not the reference\'s', { gap: true }],
    ['a blend ran line that is not the linear one\'s', { blendRan: true }], ['a reversed ran line that is not the linear one\'s', { revRan: true }], ['a switch margin of 0', { margin: true }], ['a pension death charge', { death: true }], ['the reader on SHIP', { bridge: true }],
    ['a blend tier moved under 0.1 point (the override short of the solve)', { smallMove: true }], ['linear tiers 0.05 off O60\'s', { linOff: true }], ['reversed tiers 0.05 off 2 x linear - blend', { revOff: true }], ['a missing opening2 line', { noOpen2: true }]])
    cases.push([`the gate refuses ${nm}`, refused(o), 'true']);
  const P = (lg, bg, rg) => ({ id: 'x', arm: 'y', lin: { gap: lg }, bl: { gap: bg }, rv: { gap: rg } });
  const rep = (k, p, q) => [...Array(k).fill(p), ...Array(14 - k).fill(q)];
  const OPP = P('1.0e-3', '1.2e-3', '8.0e-4'), SAM = P('1.0e-3', '1.2e-3', '1.1e-3'), TIE = P('0', '0', '0'), DN = P('1.0e-3', '8.0e-4', '1.2e-3');
  const out = ps => items(ps).map(i => i.outcome).join(' ');
  cases.push(['all 14 opposite and up: 1 HELD, 2 HELD', out(rep(14, OPP, null)), 'HELD HELD']);
  cases.push(['all 14 opposite and down: 1 HELD, 2 FALSIFIED', out(rep(14, DN, null)), 'HELD FALSIFIED']);
  cases.push(['11 opposite, 3 same: 1 INCONCLUSIVE (under 0.8), 2 HELD', out(rep(11, OPP, SAM)), 'INCONCLUSIVE HELD']);
  cases.push(['8 opposite, 6 same: 1 FALSIFIED (same 0.4 or more)', items(rep(8, OPP, SAM))[0].outcome, 'FALSIFIED']);
  cases.push(['8 ties, 6 opposite: fewer than 7 untied, both INCONCLUSIVE', out(rep(8, TIE, OPP)), 'INCONCLUSIVE INCONCLUSIVE']);
  cases.push(['7 ties, 7 opposite up: 1 HELD, 2 HELD (ties left out)', out(rep(7, TIE, OPP)), 'HELD HELD']);
  cases.push(['7 up, 7 down: 2 INCONCLUSIVE', items(rep(7, OPP, DN))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['the gap order: 0 below a number below >1', [gapRank('0') < gapRank('1.0e-9'), gapRank('9.9e-1') < gapRank('>1')].join(' '), 'true true']);
  cases.push(['a gap from 0 to a number is up; >1 to >1 is tied', [dirOf('0', '1.0e-4'), dirOf('>1', '>1')].join(' '), '1 0']);
  cases.push(['parseTiers reads a tiers line', JSON.stringify(parseTiers('S126             case | unit OFF/PRODUCT/W0.02@logblend | lambda x tier own riskAbove auto mix 3\n                 tiers OFF/PRODUCT/W0.02@logblend: pen High_Risk:4.97,Medium/High_Risk:4.65 isa Medium/High_Risk:4.65\n')[0].tiers), '[[["High Risk",4.97],["Medium/High Risk",4.65]],[["Medium/High Risk",4.65]]]']);
  cases.push(['parseOpen2 reads an opening2 line', JSON.stringify(parseOpen2('S126             case | unit READER/TS+J/W0.02@reversed | lambda x tier own riskAbove auto mix 3\n                 opening2 READER/TS+J/W0.02@reversed: 2,2 0,1\n').map(x => [x.at1e3, x.at0])), '[["2/2","0/1"]]']);
  cases.push(['readO60 reads results-o60.txt; the reversed Medium Risk is 3.20', `${JSON.stringify(readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8'))['Medium Risk'])} ${reversedOf(readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8')), 'Medium Risk')}`, '{"linear":3.69,"blend":4.18} 3.2']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
export const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const R_ = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = R_(0, 'diag7ai'), DIRF = R_(1, 'diag7af'), DIRG = R_(2, 'diag7ag');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(A.parse), tiers = Object.values(logs).flatMap(parseTiers), open2 = Object.values(logs).flatMap(parseOpen2);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  // the references through their own stamps
  const logsF = logsOf(DIRF), logsG = logsOf(DIRG), unitsF = Object.values(logsF).flatMap(F.parse), unitsG = Object.values(logsG).flatMap(G.parse);
  requireFairLogs(logsF, F.PRED); requireFairLogs(logsG, G.PRED);
  const ref = (id, a, l) => (FROM_AF.includes(id) ? unitsF : unitsG).find(u => u.id === id && u.arm === a && u.label === l && u.done) || null;
  const bad = gate(units, ref, tiers, readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8')), { open2 });
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; every linear solve 7af's or 7ag's own (table, ran line, gap, opening, joint line); each blend and reversed solve its linear pair's but for the tier returns, which moved by O60's figures (planted ${np})\n`);
  reading(units, open2);
}
