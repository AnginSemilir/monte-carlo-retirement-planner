/*
 * THE 7AI REDUCER: O60'S OPENINGS CHECK (predictions/diag-7ai.md; PLAN.md 7ai; O60). Reads results/diag7ai/case*.txt
 * (batch-7ai.sh: audit-7ai.mjs, one process a unit; 7aa's line format, parsed by reduce-7aa.mjs parse, plus a tiers line)
 * beside 7af's (results/diag7af) and 7ag's (results/diag7ag) records, each read through its own stamps.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7ai, 7af and 7ag;
 *   - every registered unit once and done (CAND = READER/TS+J/W0.02 and SHIP = OFF/PRODUCT/W0.02 on the seven households,
 *     each with the linear tiers, label as 7af's, and with the blend medians, label + '@logblend'); nothing unregistered;
 *   - each unit's settings: lambda held, the plan's tier, 'auto' risk above, three worlds; 30 points, seed 7002, the
 *     estate weight 0.02, the final year exact, the bridge read the arm's (reader on CAND, false on SHIP), the tier state on
 *     CAND alone; the switch margin 0.001, no pension death charge (O53);
 *   - IDENTITY: every linear unit is 7af's or 7ag's own unit (the same household, arm and label) - its table, its ran line
 *     but the path count, its year-0 gap and opening, and its joint line's scale, cap and risk-above decision - so the
 *     copied solve (audit-7ai.mjs) is the registered one and the linear tiers are the records';
 *   - WITHIN A PAIR (household and arm): the blend unit's ran line and joint line are the linear unit's (nothing but the
 *     tier returns differs: they are not on the ran line, so equal ran lines say every other setting is the same);
 *   - THE TIERS: each tiers line names the same tiers in the linear and blend units; the linear reals are results-o60.txt's
 *     linear column to 0.01 (one rounding step, audit-7ai.mjs), the blend reals its blend column exactly, and every named
 *     tier's blend real is above its linear real by 0.1 point or more (the override reached the solve).
 * THE ITEMS, by the registered rule (the solves' own numbers, read exactly: no sampling enters a year-0 opening):
 *   1. Do the openings move? On each of the 14 pairs, the opening at the product's margin (0.001; the first number of the
 *      gap line's opening) with the linear tiers against the blend. HELD when at least one of the 14 differs; FALSIFIED
 *      when none does.
 *   2. Which way? On each pair the year-0 gap (the switch margin the plan's tier needs to hold: the de-risk's advantage
 *      at year 0, ordered '0' < a number < '>1'), blend against linear. HELD (the blend favours the de-risk) when it rises
 *      on 10 or more of the 14; FALSIFIED when it falls on 10 or more; else INCONCLUSIVE.
 * Reported, not items: every pair's gaps, the gap's relative change, the openings at margin 0 and the table (the solve's
 * survival reading) with each tier set.
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
export const PTS = '30', SEED = '7002', W = '0.02', HOLD = 10;
export const HOUSEHOLDS = ['share 0.50', 'share 0.90', 'bridge 0', 'bridge 1', 'S126', 'S194', 'S162'];
export const FROM_AF = ['share 0.50', 'share 0.90', 'bridge 0', 'bridge 1', 'S126', 'S194'];
export const ARMS = [['READER', 'TS+J'], ['OFF', 'PRODUCT']];
export const SETS = ['linear', 'logblend'];
export const labelOf = (tag, set) => `${tag}/W${W}${set === 'linear' ? '' : '@' + set}`;
export const UNITS = ARMS.flatMap(([a, tag]) => HOUSEHOLDS.flatMap(id => SETS.map(set => [id, a, labelOf(tag, set)])));
export const TIERS = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk'];

export function readO60(text) {
  const o = {};
  for (const k of TIERS) { const m = new RegExp(`^  ${k.replace(/\//g, '\\/')}\\s+\\S+\\s+(\\S+)%\\s+(\\S+)%`, 'm').exec(text); if (m) o[k] = { linear: +m[1], blend: +m[2] }; }
  return o;
}
const TIERSL = /^\s+tiers (\S+?)\/(\S+): pen (\S+) isa (\S+)$/;
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
const setOf = label => (label.endsWith('@logblend') ? 'logblend' : 'linear');
const linearOf = label => label.replace(/@logblend$/, '');

/* THE GATE. `ref(id, arm, label)` 7af's or 7ag's parsed unit; `tiers` the parsed tiers lines; `o60` results-o60.txt read */
export function gate(units, ref, tiers, o60, { pts = PTS } = {}) {
  const bad = [];
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
    const lt = tiers.filter(t => t.id === id && t.arm === a && t.label === l), bt = tiers.filter(t => t.id === id && t.arm === a && t.label === `${l}@logblend`);
    if (lt.length !== 1 || bt.length !== 1) { bad.push(`${id} ${a}/${l}: ${lt.length} and ${bt.length} tiers lines (linear, blend), not 1 each`); continue; }
    for (let c = 0; c < 2; c++) {
      const x = lt[0].tiers[c], y = bt[0].tiers[c];
      if (x.length !== y.length || x.some(([n], i) => n !== y[i][0])) { bad.push(`${id} ${a}/${l}: the tier menus name different tiers`); continue; }
      x.forEach(([n, v], i) => {
        if (!TIERS.includes(n)) return;
        const b = y[i][1];
        if (Math.abs(v - o60[n].linear) > 0.01 + 1e-9) bad.push(`${id} ${a}/${l}: ${n} linear ${v}, not O60's ${o60[n].linear} to 0.01`);
        if (Math.abs(b - o60[n].blend) > 1e-9) bad.push(`${id} ${a}/${l}@logblend: ${n} ${b}, not O60's blend ${o60[n].blend}`);
        if (!(b - v >= 0.1 - 1e-9)) bad.push(`${id} ${a}/${l}: ${n} moved ${(b - v).toFixed(2)}, under 0.1 point (the override did not reach the solve)`);
      });
    }
  }
  return bad;
}

/* the gap's order: '0' < a number < '>1' */
export const gapRank = g => (g === '0' ? 0 : g === '>1' ? Infinity : Number(g));
export function items(pairs) {
  // pairs: [{ id, arm, lin: { gap, open1e3, open0, table }, bl: {...} }]
  const moved = pairs.filter(p => p.lin.open1e3 !== p.bl.open1e3);
  const up = pairs.filter(p => gapRank(p.bl.gap) > gapRank(p.lin.gap)).length, dn = pairs.filter(p => gapRank(p.bl.gap) < gapRank(p.lin.gap)).length;
  return [
    { n: 1, moved, outcome: moved.length >= 1 ? 'HELD' : 'FALSIFIED' },
    { n: 2, up, dn, outcome: up >= HOLD ? 'HELD' : dn >= HOLD ? 'FALSIFIED' : 'INCONCLUSIVE' }];
}

export function reading(units, out = console.log) {
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  const pairs = ARMS.flatMap(([a, tag]) => HOUSEHOLDS.map(id => {
    const L = get(id, a, labelOf(tag, 'linear')), B = get(id, a, labelOf(tag, 'logblend'));
    const x = u => ({ gap: u.gap.gap, open1e3: u.gap.open1e3, open0: u.gap.open0, table: Number(u.table) });
    return { id, arm: `${a}/${tag}`, lin: x(L), bl: x(B) };
  }));
  out(`7AI: O60'S OPENINGS CHECK - the year-0 opening and gap with the import's linear tier returns against the medians of their blends (results-o60.txt), CAND (READER/TS+J/W${W}) and SHIP (OFF/PRODUCT/W${W}), 30 points; the linear solves held to 7af's and 7ag's records`);
  out('  household     arm               | linear: gap       open (0.001, 0)  table    | blend: gap        open (0.001, 0)  table    | gap change');
  for (const p of pairs) {
    const rel = Number.isFinite(gapRank(p.lin.gap)) && Number.isFinite(gapRank(p.bl.gap)) && gapRank(p.lin.gap) > 0 ? `${(100 * (gapRank(p.bl.gap) / gapRank(p.lin.gap) - 1)).toFixed(1)}%` : 'n/a';
    out(`  ${p.id.padEnd(12)}  ${p.arm.padEnd(16)}  | ${p.lin.gap.padStart(10)}  ${`${p.lin.open1e3}, ${p.lin.open0}`.padStart(10)}      ${p.lin.table.toFixed(4).padStart(8)} | ${p.bl.gap.padStart(10)}  ${`${p.bl.open1e3}, ${p.bl.open0}`.padStart(10)}      ${p.bl.table.toFixed(4).padStart(8)} | ${rel.padStart(8)}${p.lin.open1e3 !== p.bl.open1e3 ? '   OPENING MOVES' : ''}`);
  }
  const IT = items(pairs);
  out(`\nITEM 1 (do the openings move at the product's margin?): ${IT[0].moved.length} of ${pairs.length} pairs move${IT[0].moved.length ? ` (${IT[0].moved.map(p => `${p.id} ${p.arm} ${p.lin.open1e3} to ${p.bl.open1e3}`).join('; ')})` : ''} -> ${IT[0].outcome}`);
  out(`ITEM 2 (which way does the gap move?): rises on ${IT[1].up}, falls on ${IT[1].dn}, of ${pairs.length} (HELD at ${HOLD} rises, FALSIFIED at ${HOLD} falls) -> ${IT[1].outcome}`);
  out(`REPORTED: the opening at margin 0 moves on ${pairs.filter(p => p.lin.open0 !== p.bl.open0).length} of ${pairs.length}; the table rises on ${pairs.filter(p => p.bl.table > p.lin.table).length} of ${pairs.length} (mean ${(pairs.reduce((t, p) => t + p.bl.table - p.lin.table, 0) / pairs.length).toFixed(4)} points)`);
  out(`\nOUTCOME: 1 ${IT[0].outcome}, 2 ${IT[1].outcome}`);
  return IT;
}

/* PLANTED: built units and tiers that the gate must pass clean, and faults it must refuse; items over built pairs */
function built(o = {}) {
  const o60 = { 'High Risk': { linear: 4.79, blend: 4.97 }, 'Medium/High Risk': { linear: 4.24, blend: 4.65 }, 'Medium Risk': { linear: 3.69, blend: 4.18 }, 'Medium/Low Risk': { linear: 3.14, blend: 3.55 }, 'Low Risk': { linear: 2.59, blend: 2.76 } };
  const ranOf = (a, tsj, n) => `mix 3 pts 30 seed 7002 paths ${n} grid total30x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad 5${tsj ? ' tierState 0/0,1/1,2/2' : ''} bequestWeight 0.02 finalIntegral true bridgeRead ${a === 'READER' ? 'reader' : 'false'}`;
  const us = [], refs = [], tiers = [];
  for (const [id, a, l] of UNITS) {
    if (o.skip === `${id}|${a}|${l}`) continue;
    const tsj = l.startsWith('TS+J'), bl = setOf(l) === 'logblend';
    const u = { id, arm: a, label: l, lambda: o.lambda ? '0.03' : LAMBDA, tier: 'own', riskAbove: 'auto', mix: '3', done: !(o.noDone && id === 'S126'), table: bl ? '99.9000' : '99.8000',
      ran: ranOf(a, tsj, 8000), gap: { gap: bl ? '1.1000e-3' : '1.0000e-3', open1e3: bl ? 2 : 0, open0: 2 }, joint: { joint: tsj, margin: o.margin && id === 'S194' ? '0' : '0.001', scale: 950000, cap: 3800000, deathTax: o.death && id === 'S194' ? 0.4 : 0, tier: 'own', decided: 'off:_no_tier_above_the_plan' } };
    if (o.blendRan && bl && id === 'bridge 0') u.ran = u.ran.replace('minPot 29000', 'minPot 30000');
    if (o.bridge && id === 'bridge 1' && a === 'OFF') u.ran = u.ran.replace('bridgeRead false', 'bridgeRead reader');
    us.push(u);
    if (!bl) refs.push({ ...u, table: o.table && id === 'S162' ? '99.7000' : u.table, ran: ranOf(a, tsj, id === 'S162' ? 16000 : 8000), gap: { ...u.gap, gap: o.gap && id === 'share 0.90' ? '9.0000e-4' : u.gap.gap } });
    const menu = set => [['High Risk', 'Medium/High Risk', 'Medium Risk'], ['Medium/High Risk', 'Medium Risk', 'Medium/Low Risk']].map(c => c.map(n => [n, set === 'linear' ? (n === 'Low Risk' ? 2.6 : o60[n].linear) : o60[n].blend]));
    const t = { id, arm: a, label: l, tiers: menu(bl ? (o.notMoved && id === 'S126' ? 'linear' : 'logblend') : (o.linAtBlend && id === 'S194' ? 'logblend' : 'linear')) };
    tiers.push(t);
  }
  if (o.twice) us.push({ ...us[0] });
  if (o.extra) us.push({ ...us[0], id: 'S999' });
  const ref = (id, a, l) => refs.find(r => r.id === id && r.arm === a && r.label === l) || null;
  return { us, ref, tiers, o60 };
}
function planted() {
  const cases = [];
  { const b = built(); const bad = gate(b.us, b.ref, b.tiers, b.o60); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o] of [['a missing unit', { skip: 'S126|READER|TS+J/W0.02@logblend' }], ['a unit twice', { twice: true }], ['an unregistered unit', { extra: true }], ['other unit settings (lambda)', { lambda: true }],
    ['a unit not done', { noDone: true }], ['a linear table that is not the reference\'s', { table: true }], ['a linear gap that is not the reference\'s', { gap: true }],
    ['a blend ran line that is not the linear one\'s', { blendRan: true }], ['a switch margin of 0', { margin: true }], ['a pension death charge', { death: true }], ['the reader on SHIP', { bridge: true }],
    ['blend tiers that did not move', { notMoved: true }], ['linear tiers at the blend\'s figures', { linAtBlend: true }]]) {
    const b = built(o); cases.push([`the gate refuses ${nm}`, String(gate(b.us, b.ref, b.tiers, b.o60).length > 0), 'true']);
  }
  const P = (lg, lo, bg, bo) => ({ id: 'x', arm: 'y', lin: { gap: lg, open1e3: lo, open0: 2, table: 99 }, bl: { gap: bg, open1e3: bo, open0: 2, table: 99 } });
  const rep = (k, p, q) => [...Array(k).fill(p), ...Array(14 - k).fill(q)];
  cases.push(['no opening moves: item 1 FALSIFIED', items(rep(14, P('1.0e-3', 2, '1.0e-3', 2), null)).map(i => i.outcome).join(' '), 'FALSIFIED INCONCLUSIVE']);
  cases.push(['one opening moves: item 1 HELD', items(rep(1, P('9.0e-4', 0, '1.1e-3', 2), P('1.0e-3', 2, '1.0e-3', 2)))[0].outcome, 'HELD']);
  cases.push(['ten gaps rise: item 2 HELD', items(rep(10, P('1.0e-3', 2, '1.2e-3', 2), P('1.0e-3', 2, '9.0e-4', 2)))[1].outcome, 'HELD']);
  cases.push(['nine gaps rise, five fall: item 2 INCONCLUSIVE', items([...rep(9, P('1.0e-3', 2, '1.2e-3', 2), P('1.0e-3', 2, '9.0e-4', 2))])[1].outcome, 'INCONCLUSIVE']);
  cases.push(['ten gaps fall: item 2 FALSIFIED', items(rep(10, P('1.0e-3', 2, '9.0e-4', 2), P('1.0e-3', 2, '1.2e-3', 2)))[1].outcome, 'FALSIFIED']);
  cases.push(['the gap order: 0 below a number below >1', [gapRank('0') < gapRank('1.0e-9'), gapRank('9.9e-1') < gapRank('>1')].join(' '), 'true true']);
  cases.push(['a gap from 0 to a number rises', String(items(rep(14, P('0', 0, '1.0e-4', 0), null))[1].up), '14']);
  cases.push(['parseTiers reads a tiers line', JSON.stringify(parseTiers('S126             case | unit OFF/PRODUCT/W0.02@logblend | lambda x tier own riskAbove auto mix 3\n                 tiers OFF/PRODUCT/W0.02@logblend: pen High_Risk:4.97,Medium/High_Risk:4.65 isa Medium/High_Risk:4.65\n')[0].tiers), '[[["High Risk",4.97],["Medium/High Risk",4.65]],[["Medium/High Risk",4.65]]]']);
  cases.push(['readO60 reads results-o60.txt', JSON.stringify(readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8'))['Medium Risk']), '{"linear":3.69,"blend":4.18}']);
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
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(A.parse), tiers = Object.values(logs).flatMap(parseTiers);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  // the references through their own stamps
  const logsF = logsOf(DIRF), logsG = logsOf(DIRG), unitsF = Object.values(logsF).flatMap(F.parse), unitsG = Object.values(logsG).flatMap(G.parse);
  requireFairLogs(logsF, F.PRED); requireFairLogs(logsG, G.PRED);
  const ref = (id, a, l) => (FROM_AF.includes(id) ? unitsF : unitsG).find(u => u.id === id && u.arm === a && u.label === l && u.done) || null;
  const bad = gate(units, ref, tiers, readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8')));
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; every linear solve 7af's or 7ag's own (table, ran line, gap, opening, joint line); each blend solve its linear pair's but for the tier returns, which moved by O60's figures (planted ${np})\n`);
  reading(units);
}
