/*
 * E2X'S REDUCER (PLAN.md E2X; audit-e2x.mjs; predictions/measure-e2x.md, Kind: measurement): E2 against its identity bar on
 * the research candidate, and gate 5 (Phase 4 condition 5) timed. A measurement: it reads EXACT or NOT EXACT, and gate 5
 * MET or NOT MET, never a margin.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/measure-e2x.md); every household of the four once
 * and done, at the registered points, with one time line each for PRODUCT, CAND and SPLIT, ran lines showing CAND and SPLIT
 * running the candidate (the reader, TS+J, e3, pclsInterp, the charge) on 1 and 4 parts, and an e2x line on arrays and
 * values above 0 (a comparison that ran on nothing is an error); S126's planted line present, and only there.
 * THE READING:
 *   E2: EXACT when every household differs in 0 values with the same moves evaluated and cells copied, and the planted
 *       dropping part breaks identity; NOT EXACT when any household differs (each named); PLANT NOT CAUGHT (the check
 *       proves nothing) when the planted line differs in 0 values.
 *   GATE 5: on each household the split candidate's wall-clock at most 1.25 times today's product solve's (the same
 *       household, settings and machine, one at a time); MET when all four are, NOT MET when any is not (each named, with its
 *       ratio). Read only when E2 reads EXACT: an inexact split does not count (the maintainer, 6 Oct).
 *   Beside it: the candidate on one core against the product, and the split's speed-up, per household and at the median.
 *   node research/solver/reduce-e2x.mjs [dir] [points] > research/solver/results-e2x.txt
 *   node research/solver/reduce-e2x.mjs --planted   the planted checks alone
 *   node research/solver/reduce-e2x.mjs <dir> <points> --preflight   a preflight's logs, stamps not checked
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-e2x.md', PTS = 30, PARTS = 4, BUDGET = 1.25;
export const PANEL = ['bridge 4', 'S126', 'S370', 'share 0.50'];
export const ARMS = ['PRODUCT', 'CAND', 'SPLIT'];
const CASEL = /^(\S.*?)\s+case \| points (\d+) \| lambda (\S+) \| parts (\d+)$/;
const TIMEL = /^\s+time (PRODUCT|CAND|SPLIT): secs (\S+) load (\S+) (\S+) (\S+)$/;
const RANL = /^\s+ran (CAND|SPLIT): bridgeRead (\S+) tierState (true|false) jointWorlds (true|false) e3 (true|false) pclsInterp (true|false) switchCharge (\S+) parts (\d+)$/;
const E2L = /^\s+e2x: arrays (\d+) values (\d+) differ (-?\d+) evaluated (\d+) (\d+) e3copied (\d+) (\d+)$/;
const PLL = /^\s+planted SPLIT: a dropping part at (\d+) points differ (-?\d+)$/;

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), points: +m[2], lambda: m[3], parts: +m[4], time: {}, ran: {}, dup: [], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = TIMEL.exec(line))) { if (cur.time[m[1]]) cur.dup.push(m[1]); cur.time[m[1]] = { secs: +m[2], load: +m[3] }; continue; }
    if ((m = RANL.exec(line))) { if (cur.ran[m[1]]) cur.dup.push(`ran ${m[1]}`); cur.ran[m[1]] = { bridgeRead: m[2], tierState: m[3] === 'true', jointWorlds: m[4] === 'true', e3: m[5] === 'true', pclsInterp: m[6] === 'true', switchCharge: m[7], parts: +m[8] }; continue; }
    if ((m = E2L.exec(line))) { if (cur.e2x) cur.dup.push('e2x'); cur.e2x = { arrays: +m[1], values: +m[2], differ: +m[3], ev1: +m[4], ev4: +m[5], cp1: +m[6], cp4: +m[7] }; continue; }
    if ((m = PLL.exec(line))) { if (cur.planted !== undefined) cur.dup.push('planted'); cur.planted = +m[2]; continue; }
    if (line.trim() === 'done') cur.done = true;
  }
  return us;
}
const isCand = r => r && r.bridgeRead === 'reader' && r.tierState && r.jointWorlds && r.e3 && r.pclsInterp && r.switchCharge === '0.001';
export function gate(units, { pts = PTS } = {}) {
  const bad = [];
  for (const id of PANEL) { const k = units.filter(u => u.id === id).length; if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }
  for (const u of units) {
    if (!PANEL.includes(u.id)) { bad.push(`${u.id}: not a household of the four`); continue; }
    if (!u.done) bad.push(`${u.id}: not done`);
    if (u.dup.length) bad.push(`${u.id}: lines twice (${u.dup.join(', ')})`);
    if (u.points !== pts || u.parts !== PARTS) bad.push(`${u.id}: points ${u.points}, parts ${u.parts}`);
    for (const a of ARMS) if (!(u.time[a] && u.time[a].secs > 0)) bad.push(`${u.id}: no ${a} time`);
    if (!isCand(u.ran.CAND) || u.ran.CAND.parts !== 1) bad.push(`${u.id}: CAND did not run the candidate on one part`);
    if (!isCand(u.ran.SPLIT) || u.ran.SPLIT.parts !== PARTS) bad.push(`${u.id}: SPLIT did not run the candidate on ${PARTS} parts`);
    if (!u.e2x) bad.push(`${u.id}: no e2x line`);
    else if (!(u.e2x.arrays > 0 && u.e2x.values > 0)) bad.push(`${u.id}: ${u.e2x.arrays} arrays, ${u.e2x.values} values (a comparison on nothing)`);
    if (u.id === 'S126' && u.planted === undefined) bad.push('S126: no planted line');
    if (u.id !== 'S126' && u.planted !== undefined) bad.push(`${u.id}: a planted line off S126`);
  }
  return bad;
}
export function verdict(units) {
  const off = [];
  for (const u of units) {
    const x = u.e2x;
    if (x.differ !== 0) off.push(`${u.id}: ${x.differ < 0 ? 'array shapes differ' : `${x.differ} of ${x.values} values differ`}`);
    if (x.ev1 !== x.ev4) off.push(`${u.id}: ${x.ev4} moves evaluated split against ${x.ev1}`);
    if (x.cp1 !== x.cp4) off.push(`${u.id}: ${x.cp4} cells copied split against ${x.cp1}`);
  }
  const pl = units.find(u => u.id === 'S126').planted;
  const e2 = !(pl > 0 || pl < 0) ? 'PLANT NOT CAUGHT' : off.length ? 'NOT EXACT' : 'EXACT';
  const over = units.filter(u => u.time.SPLIT.secs > BUDGET * u.time.PRODUCT.secs).map(u => `${u.id}: x${(u.time.SPLIT.secs / u.time.PRODUCT.secs).toFixed(3)} the product's`);
  const g5 = e2 !== 'EXACT' ? 'NOT READ (E2 not exact)' : over.length ? 'NOT MET' : 'MET';
  return { e2, off, g5, over };
}
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
export function reading(units, out = console.log) {
  const us = PANEL.map(id => units.find(u => u.id === id)), v = verdict(us);
  out(`E2X, E2 SHOWN EXACT ON THE RESEARCH CANDIDATE, AND GATE 5 TIMED (a measurement): ${PANEL.join(', ')}, one at a time, ${PTS} points; today's product solve on one core (PRODUCT), the candidate on one core (CAND) and split across ${PARTS} cores (SPLIT); every table of CAND and SPLIT compared bit for bit`);
  out('  household        differ/values         PRODUCT s  CAND s  SPLIT s  CAND/PRODUCT  SPLIT/PRODUCT  speed-up');
  for (const u of us) {
    const P = u.time.PRODUCT.secs, C = u.time.CAND.secs, S = u.time.SPLIT.secs;
    out(`  ${u.id.padEnd(16)} ${`${u.e2x.differ}/${u.e2x.values}`.padEnd(20)}  ${P.toFixed(1).padStart(9)}  ${C.toFixed(1).padStart(6)}  ${S.toFixed(1).padStart(7)}  ${(C / P).toFixed(3).padStart(12)}  ${(S / P).toFixed(3).padStart(13)}  ${(C / S).toFixed(2).padStart(8)}`);
  }
  out(`  median: CAND/PRODUCT x${med(us.map(u => u.time.CAND.secs / u.time.PRODUCT.secs)).toFixed(3)}, SPLIT/PRODUCT x${med(us.map(u => u.time.SPLIT.secs / u.time.PRODUCT.secs)).toFixed(3)}, the split's speed-up x${med(us.map(u => u.time.CAND.secs / u.time.SPLIT.secs)).toFixed(2)}`);
  out(`  load (1-minute average) at each timing's start: ${us.map(u => `${u.id} ${ARMS.map(a => u.time[a].load.toFixed(2)).join('/')}`).join('; ')}`);
  out(`PLANTED: a dropping part on S126 differs in ${us.find(u => u.id === 'S126').planted} values`);
  out(`\nVERDICT E2: ${v.e2}${v.off.length ? `\n  ${v.off.join('\n  ')}` : ''}`);
  out(`VERDICT GATE 5 (the split candidate at most x${BUDGET} today's product solve, on each household): ${v.g5}${v.over.length ? `\n  ${v.over.join('\n  ')}` : ''}`);
  return v;
}

function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const id of PANEL) {
    if (o.skip === id) continue;
    lines.push(`${id.padEnd(16)} case | points ${o.pts && id === 'S370' ? 20 : 30} | lambda 0.0223606797749979 | parts 4`);
    const slow = o.slow && id === 'bridge 4' ? 460 : o.edge && id === 'S370' ? 437.5 : 300;
    if (!(o.noTime && id === 'S126')) lines.push(`${''.padEnd(16)} time PRODUCT: secs 350.0 load 0.10 0.20 0.30`);
    lines.push(`${''.padEnd(16)} time CAND: secs 1050.0 load 1.00 0.90 0.80`);
    lines.push(`${''.padEnd(16)} time SPLIT: secs ${slow.toFixed(1)} load 1.00 1.00 0.90`);
    lines.push(`${''.padEnd(16)} ran CAND: bridgeRead reader tierState true jointWorlds true e3 true pclsInterp true switchCharge 0.001 parts 1`);
    lines.push(`${''.padEnd(16)} ran SPLIT: bridgeRead reader tierState ${o.notCand && id === 'share 0.50' ? 'false' : 'true'} jointWorlds true e3 true pclsInterp true switchCharge 0.001 parts ${o.oneSplit && id === 'S126' ? 1 : 4}`);
    const d = o.differ && id === 'S370' ? 12 : 0, ev = o.evaluated && id === 'bridge 4' ? 999 : 1000;
    lines.push(`${''.padEnd(16)} e2x: arrays ${o.empty && id === 'S370' ? 0 : 240} values 900000 differ ${d} evaluated 1000 ${ev} e3copied 50 50`);
    if (id === 'S126' && !o.noPlant) lines.push(`${''.padEnd(16)} planted SPLIT: a dropping part at 4 points differ ${o.plantZero ? 0 : 4321}`);
    if (o.plantElsewhere && id === 'S370') lines.push(`${''.padEnd(16)} planted SPLIT: a dropping part at 4 points differ 4321`);
    if (!(o.notDone && id === 'share 0.50')) lines.push(`${''.padEnd(16)} done`);
  }
  if (o.extra) lines.push('S999             case | points 30 | lambda 0.0223606797749979 | parts 4');
  return lines.join('\n') + '\n';
}
function planted() {
  const cases = [], g = o => String(gate(parse(builtLog(o))).length > 0);
  cases.push(['a built set gates clean', String(gate(parse(builtLog())).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'S126' }], ['an extra household', { extra: true }], ['a household not done', { notDone: true }], ['another grid', { pts: true }], ['a missing time', { noTime: true }],
    ['SPLIT not the candidate', { notCand: true }], ['SPLIT on one part', { oneSplit: true }], ['a comparison on no arrays', { empty: true }], ['no planted line', { noPlant: true }], ['a planted line off S126', { plantElsewhere: true }]])
    cases.push([`the gate refuses ${nm}`, g(o), 'true']);
  const v = o => verdict(parse(builtLog(o)).filter(u => PANEL.includes(u.id)));
  cases.push(['every household exact, the plant caught: EXACT', v({}).e2, 'EXACT']);
  cases.push(['12 values differ on S370: NOT EXACT, named', `${v({ differ: true }).e2} ${v({ differ: true }).off[0]}`, 'NOT EXACT S370: 12 of 900000 values differ']);
  cases.push(['one move fewer evaluated split on bridge 4: NOT EXACT', v({ evaluated: true }).e2, 'NOT EXACT']);
  cases.push(['the plant not caught (0 values differ): PLANT NOT CAUGHT', v({ plantZero: true }).e2, 'PLANT NOT CAUGHT']);
  cases.push(['every split under x1.25 the product: gate 5 MET', v({}).g5, 'MET']);
  cases.push(['bridge 4 split at x1.314: gate 5 NOT MET, named', `${v({ slow: true }).g5} ${v({ slow: true }).over[0]}`, "NOT MET bridge 4: x1.314 the product's"]);
  cases.push(['S370 split at exactly x1.25: MET (at most, not under)', v({ edge: true }).g5, 'MET']);
  cases.push(['E2 not exact: gate 5 not read', v({ differ: true }).g5, 'NOT READ (E2 not exact)']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export { logsOf };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: a split at exactly x1.25 the product, a plant that differs in 0 values, a comparison on no arrays`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diage2x'), pts = Number(args[1] || PTS);
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (PANEL.some(id => !units.some(u => u.id === id && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${PANEL.length} households done in ${DIR}`); process.exit(1); }
  // --preflight: the parse, gate and reading on a preflight's own logs (stamped 'none'), never read as the result
  if (!process.argv.includes('--preflight')) requireFairLogs(logs, PRED);
  else console.log('PREFLIGHT: the stamps not checked; no figure here is read');
  const bad = gate(units, { pts });
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${PANEL.length} households, each once and done at ${pts} points, PRODUCT, CAND and SPLIT timed, CAND and SPLIT the candidate on 1 and ${PARTS} parts, every comparison on its arrays, the plant on S126`);
  reading(units);
}
