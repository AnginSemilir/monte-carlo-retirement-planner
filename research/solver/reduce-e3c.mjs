/*
 * E3C'S REDUCER (PLAN.md E3c; audit-e3c.mjs; predictions/measure-e3c.md, Kind: measurement): E3's gain half against its
 * identity bar on the whole panel. A measurement of an identity: it reads EXACT or NOT EXACT, never a margin.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/measure-e3c.md); every panel household once and
 * done, with one e3c line in each mode (SHIP, PRODUCT, TSJ) at the registered points; each mode's line running what it names
 * (SHIP no reader, TSJ tier state with the reader); arrays and values above 0 (a comparison that ran on nothing is an error);
 * S126's planted line present.
 * THE READING: EXACT when every household in every mode differs in 0 values, copies exactly the empty-pot cells of the
 * non-zero gain buckets, and the planted wrong twin breaks identity (differ above 0); NOT EXACT when any household differs or
 * copies another count (each named); PLANT NOT CAUGHT (the check proves nothing) when the planted line differs in 0 values.
 * Beside it, the solve times off and on per mode (the saving, read beside other work: not a quiet-machine timing).
 *   node research/solver/reduce-e3c.mjs [dir] [points] > research/solver/results-e3c.txt
 *   node research/solver/reduce-e3c.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-e3c.md', PTS = 8;
export const PANEL = ['share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S126', 'bridge 4', 'S360', 'S194',
  'S124', 'S128', 'S130', 'S366', 'S370', 'bridge 4+cost', 'S162', 'S172', 'S168'];
export const MODES = ['SHIP', 'PRODUCT', 'TSJ'];
const CASEL = /^(\S.*?)\s+case \| points (\d+) \| lambda (\S+) \| estate weight (\S+)$/;
const E3L = /^\s+e3c (SHIP|PRODUCT|TSJ): arrays (\d+) values (\d+) differ (-?\d+) copied (\d+) want (\d+) secs off (\S+) on (\S+) tierState (true|false) bridgeRead (\S+)$/;
const PLL = /^\s+planted PRODUCT: the wrong twin differ (-?\d+)$/;

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), points: +m[2], lambda: m[3], w: m[4], modes: {}, dup: [], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = E3L.exec(line))) { if (cur.modes[m[1]]) cur.dup.push(m[1]); cur.modes[m[1]] = { arrays: +m[2], values: +m[3], differ: +m[4], copied: +m[5], want: +m[6], off: +m[7], on: +m[8], tierState: m[9] === 'true', bridgeRead: m[10] }; continue; }
    if ((m = PLL.exec(line))) { if (cur.planted !== undefined) cur.dup.push('planted'); cur.planted = +m[1]; continue; }
    if (line.trim() === 'done') cur.done = true;
  }
  return us;
}
export function gate(units, { pts = PTS } = {}) {
  const bad = [];
  for (const id of PANEL) { const k = units.filter(u => u.id === id).length; if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }
  for (const u of units) {
    if (!PANEL.includes(u.id)) { bad.push(`${u.id}: not a panel household`); continue; }
    if (!u.done) bad.push(`${u.id}: not done`);
    if (u.dup.length) bad.push(`${u.id}: lines twice (${u.dup.join(', ')})`);
    if (u.points !== pts || u.w !== '0.02') bad.push(`${u.id}: points ${u.points}, estate weight ${u.w}`);
    for (const md of MODES) {
      const x = u.modes[md];
      if (!x) { bad.push(`${u.id}: no ${md} line`); continue; }
      if (!(x.arrays > 0 && x.values > 0)) bad.push(`${u.id} ${md}: ${x.arrays} arrays, ${x.values} values (a comparison on nothing)`);
      if (md === 'SHIP' && (x.tierState || x.bridgeRead !== 'false')) bad.push(`${u.id} SHIP: ran tierState ${x.tierState} bridgeRead ${x.bridgeRead}`);
      if (md === 'TSJ' && (!x.tierState || x.bridgeRead !== 'reader')) bad.push(`${u.id} TSJ: ran tierState ${x.tierState} bridgeRead ${x.bridgeRead}`);
      if (md === 'PRODUCT' && x.tierState) bad.push(`${u.id} PRODUCT: ran the tier state`);
    }
    if (u.id === 'S126' && u.planted === undefined) bad.push('S126: no planted line');
    if (u.id !== 'S126' && u.planted !== undefined) bad.push(`${u.id}: a planted line off S126`);
  }
  return bad;
}
export function verdict(units) {
  const off = [];
  for (const u of units) for (const md of MODES) { const x = u.modes[md]; if (x.differ !== 0) off.push(`${u.id} ${md}: ${x.differ < 0 ? 'array shapes differ' : `${x.differ} of ${x.values} values differ`}`); if (x.copied !== x.want) off.push(`${u.id} ${md}: copied ${x.copied}, not ${x.want}`); }
  const pl = units.find(u => u.id === 'S126').planted;
  if (!(pl > 0 || pl < 0)) return { read: 'PLANT NOT CAUGHT', off };
  return { read: off.length ? 'NOT EXACT' : 'EXACT', off };
}
const f1 = x => x.toFixed(1);
export function reading(units, out = console.log) {
  const us = PANEL.map(id => units.find(u => u.id === id)), v = verdict(us);
  out(`E3C, E3'S PANEL-WIDE EXACTNESS CHECK (a measurement of an identity): 7e's panel (25 households) at ${PTS} points, every table with e3 off and on, in SHIP (no reader), PRODUCT (solvePlan's defaults) and TSJ (TS+J with the reader), the estate weight 0.02`);
  out('  household        ' + MODES.map(m => `${m}: differ copied/want  secs off/on`.padEnd(40)).join(''));
  for (const u of us) out(`  ${u.id.padEnd(16)} ${MODES.map(m => { const x = u.modes[m]; return `${m} ${x.differ} ${x.copied}/${x.want} ${f1(x.off)}/${f1(x.on)}`.padEnd(40); }).join('')}`);
  const tot = m => us.reduce((t, u) => [t[0] + u.modes[m].off, t[1] + u.modes[m].on], [0, 0]);
  out(`\nTIME (read beside other work, not a quiet-machine timing): ${MODES.map(m => { const [a, b] = tot(m); return `${m} ${f1(a)} s off, ${f1(b)} s on (${(100 * (1 - b / a)).toFixed(1)}% less)`; }).join('; ')}`);
  out(`PLANTED: the wrong twin on S126 differs in ${us.find(u => u.id === 'S126').planted} values`);
  out(`\nVERDICT: ${v.read}${v.off.length ? `\n  ${v.off.join('\n  ')}` : ''}`);
  return v;
}

function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const id of PANEL) {
    if (o.skip === id) continue;
    lines.push(`${id.padEnd(16)} case | points ${o.pts && id === 'S194' ? 6 : 8} | lambda 0.0223606797749979 | estate weight 0.02`);
    for (const md of MODES) {
      if (o.noMode && id === 'S130' && md === 'TSJ') continue;
      const ts = md === 'TSJ' ? !(o.tsOff && id === 'S128') : false, br = md === 'SHIP' ? (o.shipReader && id === 'S122' ? 'reader' : 'false') : md === 'TSJ' ? 'reader' : 'false';
      const d = o.differ && id === 'S360' && md === 'PRODUCT' ? 7 : 0, c = o.copy && id === 'S172' && md === 'SHIP' ? 99 : 100;
      lines.push(`${''.padEnd(16)} e3c ${md}: arrays ${o.empty && id === 'S124' && md === 'SHIP' ? 0 : 120} values 50000 differ ${d} copied ${c} want 100 secs off 10.0 on 8.0 tierState ${ts} bridgeRead ${br}`);
    }
    if (id === 'S126' && !o.noPlant) lines.push(`${''.padEnd(16)} planted PRODUCT: the wrong twin differ ${o.plantZero ? 0 : 345}`);
    if (o.plantElsewhere && id === 'S120') lines.push(`${''.padEnd(16)} planted PRODUCT: the wrong twin differ 345`);
    if (!(o.notDone && id === 'S168')) lines.push(`${''.padEnd(16)} done`);
  }
  if (o.extra) lines.push('S999             case | points 8 | lambda 0.0223606797749979 | estate weight 0.02');
  return lines.join('\n') + '\n';
}
function planted() {
  const cases = [], g = o => String(gate(parse(builtLog(o))).length > 0);
  cases.push(['a built set gates clean', String(gate(parse(builtLog())).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'S126' }], ['an extra household', { extra: true }], ['a household not done', { notDone: true }], ['another grid', { pts: true }], ['a missing mode', { noMode: true }],
    ['TSJ without the tier state', { tsOff: true }], ['SHIP with the reader', { shipReader: true }], ['a comparison on no arrays', { empty: true }], ['no planted line', { noPlant: true }], ['a planted line off S126', { plantElsewhere: true }]]) cases.push([`the gate refuses ${nm}`, g(o), 'true']);
  const v = o => verdict(parse(builtLog(o)).filter(u => PANEL.includes(u.id)));
  cases.push(['every household exact, the plant caught: EXACT', v({}).read, 'EXACT']);
  cases.push(['7 values differ on S360 PRODUCT: NOT EXACT, named', `${v({ differ: true }).read} ${v({ differ: true }).off[0]}`, 'NOT EXACT S360 PRODUCT: 7 of 50000 values differ']);
  cases.push(['99 cells copied against 100 on S172 SHIP: NOT EXACT', v({ copy: true }).read, 'NOT EXACT']);
  cases.push(['the plant not caught (0 values differ): PLANT NOT CAUGHT, whatever the rest reads', v({ plantZero: true }).read, 'PLANT NOT CAUGHT']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export { logsOf };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: a plant that differs in 0 values, a comparison on no arrays, one copied cell short`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diage3c'), pts = Number(args[1] || PTS);
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (PANEL.some(id => !units.some(u => u.id === id && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${PANEL.length} households done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts });
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${PANEL.length} households, each once and done, three modes each at ${pts} points, every comparison on its arrays, the plant on S126`);
  reading(units);
}
