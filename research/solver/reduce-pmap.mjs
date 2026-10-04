/*
 * THE POSITION MAP'S REDUCER (PLAN.md PMAP; audit-pmap.mjs; predictions/measure-pmap.md, Kind: measurement). It settles
 * nothing: it maps where the bridge step reads sit and what share of them would fall on unsupported nodes on other share grids,
 * so 7an's arms and replicates are set from positions, not from one placement draw (the deep review after 7av).
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs); every household once and done; a solve line with 6 share points;
 * THE ARITHMETIC'S CHECKS - every pmap line's largest difference between the measured and the arithmetic unsupported weight at
 * 6 share points under 1e-6, and its mean arithmetic weight at 6 the line's ua; every node check with no node off and, on the
 * four bridge households, tables above 0 (a check that ran on nothing is an error); the control (bridge 0) with no reader year
 * and no pmap line.
 * THE READING: per household and world, over the bridge step reads: the reads, the distinct positions, the mean unsupported
 * weight measured, and by arithmetic at 6 to 16 share points and with a coverage node, and the share of reads carrying any;
 * and over the panel, which share-point counts and the coverage node take the step reads off unsupported nodes.
 *   node research/solver/reduce-pmap.mjs [dir] > research/solver/results-pmap.txt
 *   node research/solver/reduce-pmap.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-pmap.md';
export const UNITS = ['S130', 'S370', 'bridge 4', 'S126', 'bridge 0'], CONTROL = 'bridge 0', NS = Array.from({ length: 11 }, (_, i) => 6 + i), TOL = 1e-6;
const L = 'READER/TS+J/W0.02/PCLSI', esc = s => s.replace(/[/+.]/g, m => `\\${m}`);
const CASEL = new RegExp(`^(\\S.*?)\\s+case \\| unit ${esc(L)} \\|`);
const SOLVEL = new RegExp(`^\\s+solve ${esc(L)}: secs (\\d+) pts (\\d+) shares (\\d+) access (\\d+) years (\\d+) worlds (\\d+) reader (yes|no) readerYears (\\d+)$`);
const PMAPL = new RegExp(`^\\s+pmap ${esc(L)} world (\\d+) year (\\d+) (step|all): reads (\\d+) positions (\\d+) um (\\S+) ua (\\S+) dmax (\\S+) un (\\S+) any (\\S+) cov (\\S+) anycov (\\S+)$`);
const NODEL = new RegExp(`^\\s+nodecheck ${esc(L)}: tables (\\d+) nodes (\\d+) off (\\d+)$`), DONEL = new RegExp(`^\\s+done ${esc(L)}$`);

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), rows: [], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = SOLVEL.exec(line))) cur.solve = { pts: +m[2], shares: +m[3], access: +m[4], years: +m[5], worlds: +m[6], reader: m[7] === 'yes', readerYears: +m[8] };
    else if ((m = PMAPL.exec(line))) cur.rows.push({ k: +m[1], t: +m[2], kind: m[3], n: +m[4], pos: +m[5], um: +m[6], ua: +m[7], dmax: +m[8], un: m[9].split(',').map(Number), any: m[10].split(',').map(Number), cov: +m[11], anycov: +m[12] });
    else if ((m = NODEL.exec(line))) cur.node = { tables: +m[1], nodes: +m[2], off: +m[3] };
    else if (DONEL.test(line)) cur.done = true;
  }
  return us;
}
export function gate(units) {
  const bad = [];
  for (const id of UNITS) { const k = units.filter(u => u.id === id).length; if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }
  for (const u of units) {
    if (!UNITS.includes(u.id)) { bad.push(`${u.id}: not a registered household`); continue; }
    if (!u.done) bad.push(`${u.id}: not done`);
    if (!u.solve || u.solve.shares !== 6) { bad.push(`${u.id}: ${u.solve ? `${u.solve.shares} share points` : 'no solve line'}, not 6`); continue; }
    if (!u.node) { bad.push(`${u.id}: no node check`); continue; }
    if (u.node.off !== 0) bad.push(`${u.id}: the threshold misclassifies ${u.node.off} of ${u.node.nodes} nodes`);
    if (u.id === CONTROL) { if (u.solve.readerYears !== 0 || u.rows.length || u.node.tables !== 0) bad.push(`${u.id}: the control has ${u.solve.readerYears} reader years, ${u.rows.length} pmap lines, ${u.node.tables} tables`); continue; }
    if (!(u.node.tables > 0) || !u.rows.some(r => r.kind === 'step' && r.n > 0)) bad.push(`${u.id}: no reader table or no step read checked (a check that ran on nothing)`);
    for (const r of u.rows) {
      const tag = `${u.id} world ${r.k} year ${r.t} ${r.kind}`;
      if (!(r.dmax <= TOL)) bad.push(`${tag}: the arithmetic differs from the measured weight by ${r.dmax}`);
      if (r.un.length !== NS.length || r.any.length !== NS.length) bad.push(`${tag}: ${r.un.length} share-point counts, not ${NS.length}`);
      else if (Math.abs(r.un[0] - r.ua) > 1e-4) bad.push(`${tag}: its weight at 6 points ${r.un[0]} is not ua ${r.ua}`);
      if (!(r.pos >= 1 && r.pos <= r.n)) bad.push(`${tag}: ${r.pos} positions for ${r.n} reads`);
    }
  }
  return bad;
}
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-');
/* the step reads pooled per household and world (each year's means weighted by its reads) */
export function pool(rows) {
  const n = rows.reduce((t, r) => t + r.n, 0), w = k => rows.reduce((t, r) => t + r[k] * r.n, 0) / (n || 1);
  return { n, pos: rows.reduce((t, r) => t + r.pos, 0), um: w('um'), un: NS.map((_, q) => rows.reduce((t, r) => t + r.un[q] * r.n, 0) / (n || 1)), any: NS.map((_, q) => rows.reduce((t, r) => t + r.any[q] * r.n, 0) / (n || 1)), cov: w('cov'), anycov: w('anycov') };
}
export function reading(units, out = console.log) {
  out(`THE POSITION MAP (a measurement): ${L} at 6 share points; the bridge step reads' unsupported weight measured, and by arithmetic at ${NS[0]} to ${NS[NS.length - 1]} share points and with a coverage node at each wealth row's edge; the arithmetic held to the measured weight read by read (under ${TOL}) and the threshold to every node`);
  out(`  household  world | step reads positions | measured | arithmetic weight at ${NS.join(', ')} share points | coverage node`);
  const panel = [];
  for (const id of UNITS.filter(x => x !== CONTROL)) {
    const u = units.find(x => x.id === id), worlds = [...new Set(u.rows.map(r => r.k))].sort();
    for (const k of worlds) {
      const P = pool(u.rows.filter(r => r.k === k && r.kind === 'step'));
      if (!P.n) continue;
      panel.push({ id, k, ...P });
      out(`  ${id.padEnd(10)} ${String(k).padStart(5)} | ${String(P.n).padStart(10)} ${String(P.pos).padStart(9)} | ${f4(P.um)} | ${P.un.map(f4).join(' ')} | ${f4(P.cov)}`);
      out(`  ${''.padEnd(10)} ${''.padStart(5)} | share carrying any         | ${P.any.map(f4).join(' ')} | ${f4(P.anycov)}`);
    }
  }
  const N = panel.reduce((t, p) => t + p.n, 0), mean = f => panel.reduce((t, p) => t + f(p) * p.n, 0) / (N || 1);
  out(`\nPANEL (the bridge households' step reads, ${N} reads, ${panel.reduce((t, p) => t + p.pos, 0)} distinct positions): mean unsupported weight by share points ${NS.map((n, q) => `${n}: ${f4(mean(p => p.un[q]))}`).join(', ')}; with the coverage node ${f4(mean(p => p.cov))}`);
  out(`  share of step reads carrying any: ${NS.map((n, q) => `${n}: ${f4(mean(p => p.any[q]))}`).join(', ')}; with the coverage node ${f4(mean(p => p.anycov))}`);
  out(`  nested with 6 (every 6-point node kept): ${NS.filter(n => (n - 1) % 5 === 0).join(', ')}`);
  return { panel, N };
}

function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const id of UNITS) {
    if (o.skip === id) continue;
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979 tier own riskAbove auto mix 3`);
    const ctl = id === CONTROL;
    lines.push(`${''.padEnd(16)} solve ${L}: secs 100 pts 30 shares ${o.shares && id === 'S130' ? 12 : 6} access 2 years 40 worlds 3 reader ${ctl ? 'no' : 'yes'} readerYears ${ctl ? (o.ctlReader ? 1 : 0) : 2}`);
    if (!ctl) for (let k = 0; k < 3; k++) {
      const u6 = 0.4, un = NS.map(n => (n === 6 ? u6 : n === 11 ? 0 : 0.2)), any = NS.map(n => (n === 11 ? 0 : 1));
      const ua = o.uaOff && id === 'S370' && k === 0 ? 0.3 : u6;
      lines.push(`${''.padEnd(16)} pmap ${L} world ${k} year 0 step: reads 2000 positions ${o.pos && id === 'S126' ? 2001 : 1} um 0.4000 ua ${ua.toFixed(4)} dmax ${o.dmax && id === 'S130' && k === 1 ? '2.00e-3' : '0.00e+00'} un ${un.map(x => x.toFixed(4)).join(',')} any ${any.map(x => x.toFixed(4)).join(',')} cov 0.0000 anycov 0.0000`);
      lines.push(`${''.padEnd(16)} pmap ${L} world ${k} year 0 all: reads 2000 positions 1 um 0.4000 ua 0.4000 dmax 0.00e+00 un ${un.map(x => x.toFixed(4)).join(',')} any ${any.map(x => x.toFixed(4)).join(',')} cov 0.0000 anycov 0.0000`);
    }
    if (ctl && o.ctlRows) lines.push(`${''.padEnd(16)} pmap ${L} world 0 year 0 step: reads 5 positions 1 um 0.0000 ua 0.0000 dmax 0.00e+00 un ${NS.map(() => '0.0000').join(',')} any ${NS.map(() => '0.0000').join(',')} cov 0.0000 anycov 0.0000`);
    if (!(o.noNode && id === 'S370')) lines.push(`${''.padEnd(16)} nodecheck ${L}: tables ${ctl ? 0 : o.noTables && id === 'bridge 4' ? 0 : 6} nodes ${ctl ? 0 : 97200} off ${o.off && id === 'S126' ? 3 : 0}`);
    if (!(o.notDone && id === 'S130')) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  if (o.extra) lines.push(`S999             case | unit ${L} | lambda 0.0223606797749979 tier own riskAbove auto mix 3`);
  return lines.join('\n') + '\n';
}
function planted() {
  const cases = [], g = o => String(gate(parse(builtLog(o))).length > 0);
  cases.push(['a built set gates clean', String(gate(parse(builtLog())).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'S126' }], ['an extra household', { extra: true }], ['a household not done', { notDone: true }], ['12 share points', { shares: true }],
    ['the arithmetic off the measured weight', { dmax: true }], ['a weight at 6 off ua', { uaOff: true }], ['a node misclassified', { off: true }], ['no node check', { noNode: true }],
    ['a bridge household with no table checked', { noTables: true }], ['the control with a reader year', { ctlReader: true }], ['the control with a pmap line', { ctlRows: true }], ['more positions than reads', { pos: true }]]) cases.push([`the gate refuses ${nm}`, g(o), 'true']);
  { const R = reading(parse(builtLog()), () => {}); cases.push(['the reading pools 4 bridge households x 3 worlds at 2,000 step reads each', `${R.panel.length} ${R.N}`, '12 24000']); }
  { const P = pool([{ n: 100, pos: 1, um: 0.5, un: NS.map(() => 0.5), any: NS.map(() => 1), cov: 0, anycov: 0 }, { n: 300, pos: 2, um: 0.1, un: NS.map(() => 0.1), any: NS.map(() => 0), cov: 0.2, anycov: 1 }]);
    cases.push(['pool weights each year by its reads (0.5 on 100, 0.1 on 300: 0.2)', `${P.um.toFixed(4)} ${P.any[0].toFixed(4)} ${P.cov.toFixed(4)} ${P.pos}`, '0.2000 0.2500 0.1500 3']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export { logsOf };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: the control with no reader, a node check on no table, the arithmetic off by 2e-3, more positions than reads`); process.exit(0); }
  const DIR = process.argv.slice(2).filter(x => !x.startsWith('--'))[0] || join(HERE, 'results', 'diagpmap');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(id => !units.some(u => u.id === id && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} households done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units);
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${UNITS.length} households, each once and done at 6 share points; the arithmetic within ${TOL} of the measured weight on every read; the threshold classifying every node as the reader tables do; the control with no reader`);
  reading(units);
}
