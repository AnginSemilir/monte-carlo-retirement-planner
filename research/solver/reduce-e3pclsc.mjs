/*
 * E3-PCLS-C'S REDUCER (audit-e3pclsc.mjs; predictions/measure-e3pclsc.md, Kind: measurement): E3's lump-sum half against its
 * identity bar on the panel under the research candidate. A measurement: it reads EXACT, NOT EXACT or PLANT NOT CAUGHT.
 * THE GATE: the stamps (requireFairLogs against predictions/measure-e3pclsc.md); every unit once and done at the registered
 * points; on each household ran lines showing OFF and ON as the candidate (the reader, TS+J, Q's step, the charge,
 * pclsInterp, e3) with e3pcls off and on and nothing else different; an e3pclsc line on arrays and values above 0 with
 * cells copied above 0 and the clause that set lastPenIn the one the household was chosen for (a household that does not
 * test its clause is an error, not a pass); a meta line and a forward line on paths above 0; every registered plant line
 * and no other; the split unit's lines at 4 and 2 parts.
 * THE READING: EXACT when on every household the tables differ in 0 values, the metadata and the reader's counters are the
 * same, the forward run differs on 0 paths and e3pcls evaluates fewer moves, the split equals the unsplit at 4 and 2
 * parts (tables, cells copied, moves evaluated), and every plant breaks identity; NOT EXACT when any household or split
 * differs (each named); PLANT NOT CAUGHT (the check proves nothing for that clause) when any plant differs in 0 values.
 * Beside it: the moves evaluated with e3pcls against without, per household and at the median (the deep review of 7 Oct
 * 00:01 UK predicted 10 to 16% fewer at 30 points; the unit test's 18 to 26% are a 4-point grid effect).
 *   node research/solver/reduce-e3pclsc.mjs [dir] [points] > research/solver/results-e3pclsc.txt
 *   node research/solver/reduce-e3pclsc.mjs --planted          the planted checks alone
 *   node research/solver/reduce-e3pclsc.mjs <dir> <points> --preflight   a preflight's logs, stamps not checked
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-e3pclsc.md', PTS = 30;
export const PANEL = [['S124', 'none', []], ['S360', 'none', []], ['S180', 'work', ['boundary', 'work']], ['S194', 'deposit', []],
  ['S126', 'deposit', ['boundary', 'deposit']], ['share 0.95', 'deposit', ['wrongtwin']], ['S130', 'deposit', []], ['bridge 6', 'deposit', []],
  ['S126+transfer', 'transfer', ['boundary', 'transfer']]];
export const SPLIT = 'S180 split', PARTS = [4, 2];
const CASEL = /^(\S.*?)\s+case \| points (\d+) \| lambda (\S+)$/;
const TIMEL = /^\s+time (ON|OFF): secs (\S+)$/;
const RANL = /^\s+ran (ON|OFF): (.*)$/;
const CL = /^\s+e3pclsc: arrays (\d+) values (\d+) differ (-?\d+) evaluated (\d+) (\d+) copied (\d+) lastPenIn (-?\d+) setBy (\S+) expected (\S+)$/;
const ML = /^\s+meta: same (true|false) reader (true|false)$/;
const FL = /^\s+forward: paths (\d+) differ (-?\d+)$/;
const PLL = /^\s+planted (\S+): at (\d+) points differ (-?\d+)$/;
const SPL = /^\s+split (\d+): differ (-?\d+) values (\d+) copied (-?\d+) (-?\d+) evaluated (\d+) (\d+) parts (\d+)$/;

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), points: +m[2], time: {}, ran: {}, plants: {}, splits: {}, dup: [], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = TIMEL.exec(line))) { cur.time[m[1]] = +m[2]; continue; }
    if ((m = RANL.exec(line))) { if (cur.ran[m[1]]) cur.dup.push(`ran ${m[1]}`); cur.ran[m[1]] = m[2]; continue; }
    if ((m = CL.exec(line))) { if (cur.c) cur.dup.push('e3pclsc'); cur.c = { arrays: +m[1], values: +m[2], differ: +m[3], evOff: +m[4], evOn: +m[5], copied: +m[6], lastPenIn: +m[7], setBy: m[8], expected: m[9] }; continue; }
    if ((m = ML.exec(line))) { cur.meta = { same: m[1] === 'true', reader: m[2] === 'true' }; continue; }
    if ((m = FL.exec(line))) { cur.fwd = { paths: +m[1], differ: +m[2] }; continue; }
    if ((m = PLL.exec(line))) { if (m[1] in cur.plants) cur.dup.push(`planted ${m[1]}`); cur.plants[m[1]] = +m[3]; continue; }
    if ((m = SPL.exec(line))) { cur.splits[m[1]] = { differ: +m[2], values: +m[3], cp1: +m[4], cpS: +m[5], ev1: +m[6], evS: +m[7], parts: +m[8] }; continue; }
    if (line.trim() === 'done') cur.done = true;
  }
  return us;
}
const field = (s, k) => { const m = new RegExp(`(?:^|\\s)${k} (\\S+)`).exec(s || ''); return m ? m[1] : null; };
const CAND = { bridgeRead: 'reader', tierState: 'true', jointWorlds: 'true', bridgeStep: 'exact', switchCharge: '0.001', pclsInterp: 'true', e3: 'true' };
export function gate(units, { pts = PTS } = {}) {
  const bad = [], ids = [...PANEL.map(p => p[0]), SPLIT];
  for (const id of ids) { const k = units.filter(u => u.id === id).length; if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }
  for (const u of units) {
    if (!ids.includes(u.id)) { bad.push(`${u.id}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${u.id}: not done`);
    if (u.dup.length) bad.push(`${u.id}: lines twice (${u.dup.join(', ')})`);
    if (u.points !== pts) bad.push(`${u.id}: points ${u.points}, not ${pts}`);
    if (u.id === SPLIT) { for (const p of PARTS) { const s = u.splits[p]; if (!s || s.parts !== p || !(s.values > 0)) bad.push(`${u.id}: no split ${p} line on its values`); } continue; }
    const [, expected, plants] = PANEL.find(p => p[0] === u.id);
    for (const a of ['OFF', 'ON']) {
      if (!u.ran[a]) { bad.push(`${u.id}: no ran ${a} line`); continue; }
      for (const [k, v] of Object.entries(CAND)) if (field(u.ran[a], k) !== v) bad.push(`${u.id}: ${a} ran ${k} ${field(u.ran[a], k)}, not the candidate's ${v}`);
      if (field(u.ran[a], 'e3pcls') !== (a === 'ON' ? 'true' : 'false')) bad.push(`${u.id}: ${a} ran e3pcls ${field(u.ran[a], 'e3pcls')}`);
    }
    if (u.ran.ON && u.ran.OFF && u.ran.ON.replace(/ e3pcls \S+/, '') !== u.ran.OFF.replace(/ e3pcls \S+/, '')) bad.push(`${u.id}: OFF and ON differ beyond e3pcls`);
    if (!u.c) bad.push(`${u.id}: no e3pclsc line`);
    else {
      if (!(u.c.arrays > 0 && u.c.values > 0)) bad.push(`${u.id}: a comparison on nothing (${u.c.arrays} arrays)`);
      if (!(u.c.copied > 0)) bad.push(`${u.id}: e3pcls copied ${u.c.copied} cells (an identity on nothing copied proves nothing)`);
      if (u.c.expected !== expected) bad.push(`${u.id}: printed expected ${u.c.expected}, registered ${expected}`);
      if (u.c.setBy !== expected) bad.push(`${u.id}: lastPenIn set by ${u.c.setBy}, chosen for ${expected} (it does not test its clause)`);
    }
    if (!u.meta) bad.push(`${u.id}: no meta line`);
    if (!u.fwd || !(u.fwd.paths > 0)) bad.push(`${u.id}: no forward line on its paths`);
    for (const p of plants) if (!(p in u.plants)) bad.push(`${u.id}: no planted ${p} line`);
    for (const p of Object.keys(u.plants)) if (!plants.includes(p)) bad.push(`${u.id}: an unregistered plant ${p}`);
  }
  return bad;
}
export function verdict(units) {
  const off = [], uncaught = [], save = [];
  for (const [id, , plants] of PANEL) {
    const u = units.find(x => x.id === id), c = u.c;
    if (c.differ !== 0) off.push(`${id}: ${c.differ < 0 ? 'array shapes differ' : `${c.differ} of ${c.values} values differ`}`);
    if (!u.meta.same) off.push(`${id}: the metadata differ`);
    if (!u.meta.reader) off.push(`${id}: the reader's counters differ`);
    if (u.fwd.differ !== 0) off.push(`${id}: the forward run differs on ${u.fwd.differ} of ${u.fwd.paths} paths`);
    if (!(c.evOn < c.evOff)) off.push(`${id}: e3pcls evaluated ${c.evOn} moves against ${c.evOff} without (copied cells yet skipped nothing)`);
    for (const p of plants) if (!(u.plants[p] > 0 || u.plants[p] < 0)) uncaught.push(`${id}: the ${p} plant differs in 0 values`);
    save.push({ id, pct: 100 * (1 - c.evOn / c.evOff) });
  }
  const sp = units.find(x => x.id === SPLIT);
  for (const p of PARTS) { const s = sp.splits[p]; if (s.differ !== 0 || s.cp1 !== s.cpS || s.ev1 !== s.evS) off.push(`${SPLIT} ${p}: ${s.differ} values differ, copied ${s.cpS} against ${s.cp1}, evaluated ${s.evS} against ${s.ev1}`); }
  const v = uncaught.length ? 'PLANT NOT CAUGHT' : off.length ? 'NOT EXACT' : 'EXACT';
  const sorted = save.map(x => x.pct).sort((a, b) => a - b), med = sorted.length % 2 ? sorted[sorted.length >> 1] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return { v, off, uncaught, save, med };
}
export function reading(units, out = console.log) {
  const r = verdict(units);
  out(`E3-PCLS-C, THE LUMP-SUM HALF'S PANEL IDENTITY CHECK (a measurement): ${PANEL.length} households at ${PTS} points under the candidate with e3, e3pcls off against on; and S180 split 4 and 2 ways`);
  out('  household        set by          lastPenIn  differ/values           meta  reader  forward differ  copied   evaluated OFF/ON         fewer');
  for (const [id] of PANEL) { const u = units.find(x => x.id === id), c = u.c, s = r.save.find(x => x.id === id);
    out(`  ${id.padEnd(16)} ${c.setBy.padEnd(14)}  ${String(c.lastPenIn).padStart(9)}  ${`${c.differ}/${c.values}`.padEnd(22)}  ${u.meta.same ? 'same' : 'DIFF'}  ${u.meta.reader ? 'same  ' : 'DIFF  '}  ${`${u.fwd.differ}/${u.fwd.paths}`.padStart(14)}  ${String(c.copied).padStart(7)}  ${`${c.evOff}/${c.evOn}`.padEnd(22)}  ${s.pct.toFixed(1)}%`); }
  const sp = units.find(x => x.id === SPLIT);
  for (const p of PARTS) { const s = sp.splits[p]; out(`  ${SPLIT} ${p} ways: ${s.differ} of ${s.values} values differ; copied ${s.cpS} against ${s.cp1}; evaluated ${s.evS} against ${s.ev1}`); }
  for (const [id, , plants] of PANEL) { const u = units.find(x => x.id === id); for (const p of plants) out(`PLANTED: ${p} on ${id} differs in ${u.plants[p]} values`); }
  out(`  the moves evaluated with e3pcls, fewer than without: median ${r.med.toFixed(1)}% (the deep review's prediction: 10 to 16%)`);
  out(`\nVERDICT E3-PCLS UNDER THE CANDIDATE: ${r.v}${r.off.length ? `\n  ${r.off.join('\n  ')}` : ''}${r.uncaught.length ? `\n  ${r.uncaught.join('\n  ')}` : ''}`);
  return r;
}

function builtLog(o = {}) {
  const L = ['stamp: code abc audit def prediction none sha -'], P = ''.padEnd(16), ranOf = on => `bridgeRead reader tierState true jointWorlds true bridgeStep exact switchCharge 0.001 pclsInterp true e3 true e3pcls ${on} points total30x6x6`;
  for (const [id, setBy, plants] of PANEL) {
    if (o.skip === id) continue;
    L.push(`${id.padEnd(16)} case | points ${o.pts && id === 'S130' ? 20 : 30} | lambda 0.0223606797749979`, `${P} time OFF: secs 1000.0`, `${P} time ON: secs 900.0`);
    L.push(`${P} ran OFF: ${o.offDrift && id === 'S124' ? ranOf('false').replace('pclsInterp true', 'pclsInterp false') : ranOf('false')}`, `${P} ran ON: ${ranOf('true')}`);
    const d = o.differ && id === 'S130' ? 9 : 0, ev = o.evSame && id === 'S194' ? 1000 : 880, sb = o.wrongClause && id === 'S126' ? 'work' : setBy;
    L.push(`${P} e3pclsc: arrays ${o.empty && id === 'S360' ? 0 : 240} values 900000 differ ${d} evaluated 1000 ${ev} copied ${o.noCopy && id === 'S124' ? 0 : 500} lastPenIn ${setBy === 'none' ? -1 : 4} setBy ${sb} expected ${setBy}`);
    L.push(`${P} meta: same ${!(o.metaDiff && id === 'S180')} reader ${!(o.readerDiff && id === 'bridge 6')}`, `${P} forward: paths 2000 differ ${o.fwdDiff && id === 'S360' ? 3 : 0}`);
    for (const p of plants) if (!(o.noPlant && id === 'S126' && p === 'deposit')) L.push(`${P} planted ${p}: at 8 points differ ${o.plantZero && id === 'S126+transfer' && p === 'transfer' ? 0 : 777}`);
    if (o.extraPlant && id === 'S130') L.push(`${P} planted boundary: at 8 points differ 777`);
    if (!(o.notDone && id === 'S194')) L.push(`${P} done`);
  }
  L.push(`${SPLIT.padEnd(16)} case | points 30 | lambda 0.0223606797749979`);
  for (const p of PARTS) if (!(o.noSplit2 && p === 2)) L.push(`${P} split ${p}: differ ${o.splitDiff && p === 2 ? 4 : 0} values 900000 copied 500 500 evaluated 880 880 parts ${p}`);
  L.push(`${P} done`);
  return L.join('\n') + '\n';
}
const EDGES = [];
function planted() {
  const cases = [], g = o => String(gate(parse(builtLog(o))).length > 0);
  cases.push(['a built set gates clean', String(gate(parse(builtLog())).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'S180' }], ['a household not done', { notDone: true }], ['another grid', { pts: true }], ['OFF differing beyond e3pcls', { offDrift: true }],
    ['a comparison on no arrays', { empty: true }], ['an e3pcls that copied no cell', { noCopy: true }], ['a household whose lastPenIn another clause set', { wrongClause: true }],
    ['a missing plant line', { noPlant: true }], ['an unregistered plant', { extraPlant: true }], ['a missing split line', { noSplit2: true }]])
    cases.push([`the gate refuses ${nm}`, g(o), 'true']);
  EDGES.push('an e3pcls that copied no cell', 'a household whose lastPenIn another clause set');
  const v = o => verdict(parse(builtLog(o)));
  cases.push(['every household exact, every plant caught: EXACT', v({}).v, 'EXACT']);
  cases.push(['9 values differ on S130: NOT EXACT, named', `${v({ differ: true }).v} ${v({ differ: true }).off[0]}`, 'NOT EXACT S130: 9 of 900000 values differ']);
  cases.push(['the forward run differs on 3 paths of S360: NOT EXACT', v({ fwdDiff: true }).v, 'NOT EXACT']);
  cases.push(['the metadata differ on S180: NOT EXACT', v({ metaDiff: true }).v, 'NOT EXACT']);
  cases.push(['the reader\'s counters differ on bridge 6: NOT EXACT', v({ readerDiff: true }).v, 'NOT EXACT']);
  cases.push(['e3pcls evaluating as many moves as without on S194: NOT EXACT', v({ evSame: true }).v, 'NOT EXACT']); EDGES.push('e3pcls evaluating exactly as many moves as without');
  cases.push(['the split 2 ways differs: NOT EXACT', v({ splitDiff: true }).v, 'NOT EXACT']);
  cases.push(['the transfer plant not caught: PLANT NOT CAUGHT', v({ plantZero: true }).v, 'PLANT NOT CAUGHT']); EDGES.push('a plant that differs in 0 values');
  cases.push(['the saving: 12.0% fewer moves on every household reads a median of 12.0%', v({}).med.toFixed(1), '12.0']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diage3pclsc'), pts = Number(args[1] || PTS);
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  const ids = [...PANEL.map(p => p[0]), SPLIT];
  if (ids.some(id => !units.some(u => u.id === id && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${ids.length} units done in ${DIR}`); process.exit(1); }
  if (!process.argv.includes('--preflight')) requireFairLogs(logs, PRED);
  else console.log('PREFLIGHT: the stamps not checked; no figure here is read');
  const bad = gate(units, { pts });
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${ids.length} units once and done at ${pts} points, OFF and ON the candidate with e3 and only e3pcls between them, every household testing its clause, every plant and split line present`);
  reading(units);
}
