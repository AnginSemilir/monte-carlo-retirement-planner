/*
 * THE DRAW-PAUSE MEASUREMENT'S REDUCER (PLAN.md O71, O77; audit-dp.mjs). A MEASUREMENT, not a test: it reads the logs
 * launched under predictions/measure-dp.md (Kind: measurement) and settles nothing; its counts are
 * descriptive, the households the panel (7e's, 25). Registered as a measurement (predictions/measure-dp.md, Kind: measurement).
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs, against the measurement's registered file predictions/measure-dp.md); every panel household once and done; each ran line
 * the shipping default's (no bridge reader, 30 points, seed 7002, the registered path count, the estate weight 0.02, the
 * switch margin 0.001, the allowance axis snapped on 0,0.5,1) and an access line; the dp line's counts consistent (cross
 * no more than reach, reach no more than the paths, pause no more than reach, the stall count no more than the wall
 * path-years, the pausing paths' median and longest dwell 2 or more) and the dwell line's paths summing to reach.
 * THE READING: per household, the paths reaching the wall band and crossing it, the mean dwell, the yearly growth at the wall
 * against the pre-wall band after access, the paths that pause and how long, and the strict stall count; the totals: the
 * households with any pausing path, with 1% of paths or more pausing, and the pausing paths' dwell over the panel.
 *   node research/solver/reduce-dp.mjs [dir] > research/solver/results-dp.txt
 *   node research/solver/reduce-dp.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-dp.md';
export const PTS = '30', SEED = '7002', NPW = 2000, W = '0.02';
export const PANEL = ['share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S126', 'bridge 4', 'S360', 'S194',
  'S124', 'S128', 'S130', 'S366', 'S370', 'bridge 4+cost', 'S162', 'S172', 'S168'];
const L = `OFF/PRODUCT/W${W}`, esc = s => s.replace(/[/+.]/g, m => `\\${m}`);
const CASEL = new RegExp(`^(\\S.*?)\\s+case \\| unit ${esc(L)} \\| lambda (\\S+)$`);
const RANL = new RegExp(`^\\s+ran ${esc(L)}: (.*)$`), ACCL = new RegExp(`^\\s+access ${esc(L)}: year (\\d+) years (\\d+) lsa (\\S+)$`);
const DPL = new RegExp(`^\\s+dp ${esc(L)}: (.*)$`), DWL = new RegExp(`^\\s+dwell ${esc(L)}: (.*)$`), DONEL = new RegExp(`^\\s+done ${esc(L)}$`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), lambda: m[2], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = RANL.exec(line))) cur.ran = m[1];
    else if ((m = ACCL.exec(line))) cur.access = { year: +m[1], years: +m[2], lsa: +m[3] };
    else if ((m = DPL.exec(line))) { const s = m[1], n = k => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); }; cur.dp = Object.fromEntries(['paths', 'survived', 'reach', 'cross', 'dwell', 'wallpy', 'wallgrowth', 'prepy', 'pregrowth', 'pause', 'pausedwell', 'pausemedian', 'pausemax', 'stall'].map(k => [k, n(k)])); }
    else if ((m = DWL.exec(line))) cur.dwell = m[1] === '-' ? [] : m[1].split(' ').map(x => x.split(':').map(Number));
    else if (DONEL.test(line)) cur.done = true;
  }
  return us;
}
export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const id of PANEL) { const k = units.filter(u => u.id === id).length; if (k !== 1) bad.push(`${id}: ${k} unit lines, not 1`); }
  for (const u of units) {
    if (!PANEL.includes(u.id)) { bad.push(`${u.id}: not a panel household`); continue; }
    if (!u.done) bad.push(`${u.id}: not done`);
    if (!u.ran || !u.access || !u.dp || !u.dwell) { bad.push(`${u.id}: a ran, access, dp or dwell line missing`); continue; }
    const want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', pclsInterp: 'false', mix: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${u.id}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    const d = u.dp;
    if (d.paths !== npw) bad.push(`${u.id}: ${d.paths} paths, not ${npw}`);
    if (!(d.cross <= d.reach && d.reach <= d.paths && d.pause <= d.reach && d.survived <= d.paths)) bad.push(`${u.id}: reach ${d.reach}, cross ${d.cross}, pause ${d.pause} of ${d.paths} paths`);
    if (!(d.stall <= d.wallpy)) bad.push(`${u.id}: ${d.stall} stalls of ${d.wallpy} wall path-years`);
    if (d.pause > 0 && !(d.pausemedian >= 2 && d.pausemax >= d.pausemedian)) bad.push(`${u.id}: pausing paths' dwell median ${d.pausemedian} longest ${d.pausemax}`);
    if (d.pause === 0 && Number.isFinite(d.pausedwell)) bad.push(`${u.id}: a pausing dwell with no pausing path`);
    const n = u.dwell.reduce((t, [, k]) => t + k, 0);
    if (n !== d.reach) bad.push(`${u.id}: the dwell line holds ${n} paths, reach ${d.reach}`);
    else if (d.reach > 0 && !(Math.abs(u.dwell.reduce((t, [y, k]) => t + y * k, 0) / d.reach - d.dwell) <= 1e-4)) bad.push(`${u.id}: the dwell line's mean is not the dp line's ${d.dwell}`);
  }
  return bad;
}
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-');
export function reading(units, out = console.log) {
  const us = PANEL.map(id => units.find(u => u.id === id));
  out(`THE DRAW-PAUSE MEASUREMENT (O71, O77; a measurement, not a test): the shipping default (no reader, the product's settings, lambda held, the estate weight ${W}, ${PTS} points) on 7e's panel (25 households), ${NPW} paths each (seed ${SEED}); the wall band 0.6 to under 0.75 of the lump sum allowance used; a pause is a dwell of 2 years or more there with the path's own yearly growth at the wall under a quarter of its pre-wall growth (0.3 to under 0.6), after access`);
  out('  household        access  reach  cross  dwell | growth wall  pre-wall | pause  (share)  dwell mean/median/max | stall of wall path-years');
  for (const u of us) { const d = u.dp; out(`  ${u.id.padEnd(16)} ${String(u.access.year).padStart(5)}  ${String(d.reach).padStart(5)}  ${String(d.cross).padStart(5)}  ${f2(d.dwell).padStart(5)} | ${f4(d.wallgrowth).padStart(11)}  ${f4(d.pregrowth).padStart(8)} | ${String(d.pause).padStart(5)}  (${f2(100 * d.pause / d.paths)}%)  ${f2(d.pausedwell)}/${Number.isFinite(d.pausemedian) ? d.pausemedian : '-'}/${Number.isFinite(d.pausemax) ? d.pausemax : '-'} | ${d.stall} of ${d.wallpy}`); }
  const any = us.filter(u => u.dp.pause > 0), pct = us.filter(u => u.dp.pause >= 0.01 * u.dp.paths), reachAny = us.filter(u => u.dp.reach > 0);
  const pd = us.flatMap(u => (u.dp.pause > 0 ? [[u.dp.pause, u.dp.pausedwell]] : [])), np = pd.reduce((t, [n]) => t + n, 0);
  out(`\nTOTALS: households whose paths reach the wall band ${reachAny.length} of ${us.length}; with any pausing path ${any.length} (${any.map(u => u.id).join(', ') || 'none'}); with 1% of paths or more pausing ${pct.length} (${pct.map(u => u.id).join(', ') || 'none'}); pausing paths over the panel ${np}, their mean dwell ${np ? f2(pd.reduce((t, [n, d]) => t + n * d, 0) / np) : '-'} years`);
  return { any: any.length, pct: pct.length, reach: reachAny.length };
}

function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const id of PANEL) {
    if (o.skip === id) continue;
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed 7002 paths 2000 grid total30x6x6 lambda 0.0223606797749979 bequestWeight 0.02 finalIntegral true bridgeRead ${o.reader && id === 'S130' ? 'reader' : 'false'} switchMargin 0.001 pcls 0,0.5,1 pclsInterp ${o.interp && id === 'S370' ? 'true' : 'false'}`);
    lines.push(`${''.padEnd(16)} access ${L}: year 2 years 39 lsa 268275`);
    const reach = id === 'S130' ? 300 : 0, pause = id === 'S130' ? (o.pauseOver ? 301 : 40) : 0;
    lines.push(`${''.padEnd(16)} dp ${L}: paths 2000 survived 1900 reach ${reach} cross ${o.crossOver && id === 'S130' ? 301 : reach ? 200 : 0} dwell ${reach ? '3.0000' : '-'} wallpy ${reach ? 900 : 0} wallgrowth ${reach ? '0.0100' : '-'} prepy ${reach ? 2000 : 0} pregrowth ${reach ? '0.0500' : '-'} pause ${pause} pausedwell ${pause ? '4.0000' : '-'} pausemedian ${pause ? (o.shortPause ? 1 : 4) : '-'} pausemax ${pause ? 6 : '-'} stall ${o.stallOver && id === 'S130' ? 901 : reach ? 100 : 0} secs 100`);
    lines.push(`${''.padEnd(16)} dwell ${L}: ${reach ? `2:${o.dwellOff ? 149 : 150} 4:150` : '-'}`);
    if (!(o.notDone && id === 'S194')) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  if (o.extra) lines.push(`S999             case | unit ${L} | lambda 0.0223606797749979`);
  return lines.join('\n') + '\n';
}
function planted() {
  const cases = [], SZ = { pts: '30', npw: 2000 };
  const g = o => String(gate(parse(builtLog(o)), SZ).length > 0);
  cases.push(['a built set gates clean', String(gate(parse(builtLog()), SZ).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'S126' }], ['an extra household', { extra: true }], ['a household not done', { notDone: true }], ['a reader on the shipping default', { reader: true }],
    ['the interpolated axis', { interp: true }], ['more pausing than reaching paths', { pauseOver: true }], ['more crossing than reaching paths', { crossOver: true }], ['more stalls than wall path-years', { stallOver: true }],
    ['a pausing median under 2 years', { shortPause: true }], ['a dwell line off reach', { dwellOff: true }]]) cases.push([`the gate refuses ${nm}`, g(o), 'true']);
  { let rd = null; reading(parse(builtLog()), () => {}); rd = reading(parse(builtLog()), () => {}); cases.push(['the reading counts S130 as the one pausing household, at 2% of paths', `${rd.any} ${rd.pct} ${rd.reach}`, '1 1 1']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagdp'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (PANEL.some(id => !units.some(u => u.id === id && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${PANEL.length} households done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw });
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${PANEL.length} households, each once and done, the shipping default's settings on every ran line, the counts consistent`);
  reading(units);
}
