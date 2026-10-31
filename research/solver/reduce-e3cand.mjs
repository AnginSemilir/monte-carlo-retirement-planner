/*
 * E3-CAND'S REDUCER (audit-e3cand.mjs; predictions/measure-e3cand.md, Kind: measurement): e3 against its identity bar under
 * the full research candidate. A measurement: it reads EXACT, NOT EXACT or PLANT NOT CAUGHT, never a margin.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/measure-e3cand.md); both households once and done,
 * at the registered points; ran lines showing ON as the candidate (the reader, TS+J, Q's step, the charge 0.001 at margin 0,
 * pclsInterp, e3 on) and OFF the same with e3 off and nothing else changed; an e3cand line on arrays and values above 0 with
 * cells copied above 0 (a comparison that ran on nothing, or an e3 that copied nothing, is an error, not a pass); share 0.95's
 * planted line present, and only there.
 * THE READING: EXACT when both households differ in 0 values, e3 evaluating fewer moves than the solve without it (a copied
 * cell is skipped before any move is evaluated, solve.js l.894-900: that is e3's saving, so the counts cannot be equal, as
 * they must be in E2X where both arms have e3 on - the plan-auditor's BLOCKING 1 on 743ca2cb1d), and the planted wrong-twin
 * copy breaks identity; NOT EXACT when either differs, or e3 evaluates as many moves or more (each named); PLANT NOT CAUGHT
 * (the check proves nothing) when the planted line differs in 0 values.
 *   node research/solver/reduce-e3cand.mjs [dir] [points] > research/solver/results-e3cand.txt
 *   node research/solver/reduce-e3cand.mjs --planted   the planted checks alone
 *   node research/solver/reduce-e3cand.mjs <dir> <points> --preflight   a preflight's logs, stamps not checked
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-e3cand.md', PTS = 30;
export const PANEL = ['share 0.95', 'S130'], PLANTED_ON = 'share 0.95';
const CASEL = /^(\S.*?)\s+case \| points (\d+) \| lambda (\S+)$/;
const TIMEL = /^\s+time (ON|OFF): secs (\S+)$/;
const RANL = /^\s+ran (ON|OFF): bridgeRead (\S+) tierState (true|false) jointWorlds (true|false) bridgeStep (\S+) switchCharge (\S+) switchMargin (\S+) pclsInterp (true|false) e3 (true|false) points (\S+)$/;
const CL = /^\s+e3cand: arrays (\d+) values (\d+) differ (-?\d+) evaluated (\d+) (\d+) copied (\d+)$/;
const PLL = /^\s+planted ON: the wrong twin at (\d+) points differ (-?\d+)$/;

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), points: +m[2], time: {}, ran: {}, dup: [], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = TIMEL.exec(line))) { if (cur.time[m[1]]) cur.dup.push(m[1]); cur.time[m[1]] = +m[2]; continue; }
    if ((m = RANL.exec(line))) { if (cur.ran[m[1]]) cur.dup.push(`ran ${m[1]}`); cur.ran[m[1]] = { bridgeRead: m[2], tierState: m[3] === 'true', jointWorlds: m[4] === 'true', bridgeStep: m[5], switchCharge: m[6], switchMargin: m[7], pclsInterp: m[8] === 'true', e3: m[9] === 'true', grid: m[10] }; continue; }
    if ((m = CL.exec(line))) { if (cur.c) cur.dup.push('e3cand'); cur.c = { arrays: +m[1], values: +m[2], differ: +m[3], evOff: +m[4], evOn: +m[5], copied: +m[6] }; continue; }
    if ((m = PLL.exec(line))) { if (cur.planted !== undefined) cur.dup.push('planted'); cur.planted = +m[2]; continue; }
    if (line.trim() === 'done') cur.done = true;
  }
  return us;
}
const isCand = r => !!r && r.bridgeRead === 'reader' && r.tierState && r.jointWorlds && r.bridgeStep === 'exact' && r.switchCharge === '0.001' && r.switchMargin === '0' && r.pclsInterp;
const sameBut = (a, b) => !!a && !!b && ['bridgeRead', 'tierState', 'jointWorlds', 'bridgeStep', 'switchCharge', 'switchMargin', 'pclsInterp', 'grid'].every(k => a[k] === b[k]);
export function gate(units, { pts = PTS } = {}) {
  const bad = [];
  for (const id of PANEL) { const k = units.filter(u => u.id === id).length; if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }
  for (const u of units) {
    if (!PANEL.includes(u.id)) { bad.push(`${u.id}: not a household of the two`); continue; }
    if (!u.done) bad.push(`${u.id}: not done`);
    if (u.dup.length) bad.push(`${u.id}: lines twice (${u.dup.join(', ')})`);
    if (u.points !== pts) bad.push(`${u.id}: points ${u.points}, not ${pts}`);
    for (const a of ['ON', 'OFF']) if (!(u.time[a] > 0)) bad.push(`${u.id}: no ${a} time`);
    if (!isCand(u.ran.ON) || !u.ran.ON.e3) bad.push(`${u.id}: ON did not run the candidate with e3 on`);
    if (!u.ran.OFF || u.ran.OFF.e3 || !sameBut(u.ran.ON, u.ran.OFF)) bad.push(`${u.id}: OFF is not the candidate with e3 off and nothing else changed`);
    if (!u.c) bad.push(`${u.id}: no e3cand line`);
    else {
      if (!(u.c.arrays > 0 && u.c.values > 0)) bad.push(`${u.id}: ${u.c.arrays} arrays, ${u.c.values} values (a comparison on nothing)`);
      if (!(u.c.copied > 0)) bad.push(`${u.id}: e3 copied ${u.c.copied} cells (an identity on nothing copied proves nothing)`);
    }
    if (u.id === PLANTED_ON && u.planted === undefined) bad.push(`${PLANTED_ON}: no planted line`);
    if (u.id !== PLANTED_ON && u.planted !== undefined) bad.push(`${u.id}: a planted line off ${PLANTED_ON}`);
  }
  return bad;
}
export function verdict(units) {
  const off = [];
  for (const u of units) {
    if (u.c.differ !== 0) off.push(`${u.id}: ${u.c.differ < 0 ? 'array shapes differ' : `${u.c.differ} of ${u.c.values} values differ`}`);
    if (!(u.c.evOn < u.c.evOff)) off.push(`${u.id}: ${u.c.evOn} moves evaluated with e3 against ${u.c.evOff} without (e3 copied ${u.c.copied} cells yet skipped no evaluation)`);
  }
  const pl = units.find(u => u.id === PLANTED_ON).planted;
  return { e3: !(pl > 0 || pl < 0) ? 'PLANT NOT CAUGHT' : off.length ? 'NOT EXACT' : 'EXACT', off };
}
export function reading(units, out = console.log) {
  const us = PANEL.map(id => units.find(u => u.id === id)), v = verdict(us);
  out(`E3-CAND, E3'S EXACTNESS UNDER THE FULL RESEARCH CANDIDATE (a measurement): ${PANEL.join(', ')}, ${PTS} points; ON the candidate (e3 on), OFF the same with e3 off`);
  out('  household        differ/values           evaluated OFF/ON         copied   OFF s   ON s');
  for (const u of us) out(`  ${u.id.padEnd(16)} ${`${u.c.differ}/${u.c.values}`.padEnd(22)}  ${`${u.c.evOff}/${u.c.evOn}`.padEnd(22)}  ${String(u.c.copied).padStart(7)}  ${u.time.OFF.toFixed(1).padStart(6)}  ${u.time.ON.toFixed(1).padStart(6)}`);
  out(`PLANTED: the wrong-twin copy on ${PLANTED_ON} differs in ${us.find(u => u.id === PLANTED_ON).planted} values`);
  out(`\nVERDICT E3 UNDER THE CANDIDATE: ${v.e3}${v.off.length ? `\n  ${v.off.join('\n  ')}` : ''}`);
  return v;
}

function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const id of PANEL) {
    if (o.skip === id) continue;
    lines.push(`${id.padEnd(16)} case | points ${o.pts && id === 'S130' ? 20 : 30} | lambda 0.0223606797749979`);
    lines.push(`${''.padEnd(16)} time ON: secs 900.0`);
    lines.push(`${''.padEnd(16)} time OFF: secs 1100.0`);
    const ranOf = (e3, x = {}) => `bridgeRead reader tierState true jointWorlds true bridgeStep ${x.step || 'exact'} switchCharge 0.001 switchMargin 0 pclsInterp ${x.pi || 'true'} e3 ${e3} points total30x6x6`;
    lines.push(`${''.padEnd(16)} ran ON: ${ranOf(o.onE3Off && id === 'S130' ? 'false' : 'true')}`);
    lines.push(`${''.padEnd(16)} ran OFF: ${ranOf('false', o.offDrift && id === 'share 0.95' ? { pi: 'false' } : o.noQ && id === 'S130' ? { step: 'null' } : {})}`);
    const d = o.differ && id === 'S130' ? 7 : 0, ev = o.evaluated && id === 'share 0.95' ? 1000 : 900;
    lines.push(`${''.padEnd(16)} e3cand: arrays ${o.empty && id === 'S130' ? 0 : 240} values 900000 differ ${d} evaluated 1000 ${ev} copied ${o.noCopy && id === 'S130' ? 0 : 5000}`);
    if (id === PLANTED_ON && !o.noPlant) lines.push(`${''.padEnd(16)} planted ON: the wrong twin at 8 points differ ${o.plantZero ? 0 : 4321}`);
    if (o.plantElsewhere && id === 'S130') lines.push(`${''.padEnd(16)} planted ON: the wrong twin at 8 points differ 4321`);
    if (!(o.notDone && id === 'S130')) lines.push(`${''.padEnd(16)} done`);
  }
  if (o.extra) lines.push('S999             case | points 30 | lambda 0.0223606797749979');
  return lines.join('\n') + '\n';
}
const EDGES = [];
function planted() {
  const cases = [], g = o => String(gate(parse(builtLog(o))).length > 0);
  cases.push(['a built set gates clean', String(gate(parse(builtLog())).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'S130' }], ['an extra household', { extra: true }], ['a household not done', { notDone: true }], ['another grid', { pts: true }],
    ['ON with e3 off', { onE3Off: true }], ['OFF differing beyond e3 (pclsInterp off)', { offDrift: true }], ['OFF and ON without Q\'s step', { noQ: true }], ['a comparison on no arrays', { empty: true }],
    ['an e3 that copied no cell', { noCopy: true }], ['no planted line', { noPlant: true }], ['a planted line off share 0.95', { plantElsewhere: true }]])
    cases.push([`the gate refuses ${nm}`, g(o), 'true']);
  EDGES.push('an e3 that copied no cell', 'a comparison on no arrays');
  const v = o => verdict(parse(builtLog(o)).filter(u => PANEL.includes(u.id)));
  cases.push(['both households exact, the plant caught: EXACT', v({}).e3, 'EXACT']);
  cases.push(['7 values differ on S130: NOT EXACT, named', `${v({ differ: true }).e3} ${v({ differ: true }).off[0]}`, 'NOT EXACT S130: 7 of 900000 values differ']);
  cases.push(['e3 evaluating as many moves as without it on share 0.95 (it copied cells yet skipped nothing): NOT EXACT', v({ evaluated: true }).e3, 'NOT EXACT']); EDGES.push('e3 evaluating exactly as many moves as without it');
  cases.push(['the plant not caught (0 values differ): PLANT NOT CAUGHT', v({ plantZero: true }).e3, 'PLANT NOT CAUGHT']); EDGES.push('a plant that differs in 0 values');
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diage3cand'), pts = Number(args[1] || PTS);
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (PANEL.some(id => !units.some(u => u.id === id && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${PANEL.length} households done in ${DIR}`); process.exit(1); }
  if (!process.argv.includes('--preflight')) requireFairLogs(logs, PRED);
  else console.log('PREFLIGHT: the stamps not checked; no figure here is read');
  const bad = gate(units, { pts });
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${PANEL.length} households, each once and done at ${pts} points, ON the candidate with e3, OFF the same without, every comparison on its arrays with cells copied, the plant on ${PLANTED_ON}`);
  reading(units);
}
