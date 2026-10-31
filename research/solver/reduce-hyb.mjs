/*
 * HYB'S REDUCER (PLAN.md O89; audit-hyb.mjs; predictions/diag-hyb.md). A TEST on ADOPT-PI's unit at seed 7005 and death tax 0,
 * every arm of a household on the same paths: the forward-only hybrid (HYB: PCLSI's tables read through the snap) beside
 * SNAP and PCLSI on S130, S370 and S128 - whether ADOPT-PI's survival gain is the read's or the tables'. (The tie-margin items
 * and the death-tax group were dropped by the maintainer before registration, the 5 Oct 08:00 and 08:58 rows.)
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/diag-hyb.md); every unit once and done (3 households
 *   x 3 arms); each ran line ADOPT-PI's settings (no reader, 30 points, seed 7005, 6,000 paths, the estate weight 0.02, the
 *   switch margin 0.001, buckets 0,0.5,1) with its arm's tables and read, tie margin 0 and death tax 0; a household's units on
 *   one access line and one pathsum; every per-path file present, stamped as the logs and holding its sum line; and THE
 *   IDENTITY: the SNAP and PCLSI arms equal ADOPT-PI's per-path files path for path (survived, lifetime tax, terminal net),
 *   ADOPT-PI's files first passing their own gate (reduce-adoptpi.mjs, with its stamp check: rule 3). Anything else differing
 *   between the arms is not settled: the gate refuses.
 * THE READING (registered in predictions/diag-hyb.md):
 *   ITEM 1 (primary; O89's split, decided on S130): per path y = (PCLSI - HYB) - (HYB - SNAP) in survival (0/1), so mean(y)
 *     above 0 means the read's part of PCLSI's gain (PCLSI over HYB, the same tables) exceeds the tables' part (HYB over SNAP,
 *     the same snapped read); Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000) of mean(y) above 0 and
 *     below, Holm over the 6 (3 households x 2); per household READ (the read carries more than half, shown), TABLES (the
 *     tables more than half, shown) or SPLIT. HELD when S130 reads READ; FALSIFIED when S130 reads TABLES; else INCONCLUSIVE.
 *     S370 and S128 reported; the parts' McNemar cells printed.
 *   SECONDARY (declared, decides nothing): every pair's survival, mean tax and net change (se over paths).
 *   REPORTED: the hold per arm (reduce-adoptpi.mjs hold).
 *   node research/solver/reduce-hyb.mjs [dir] [paths] [points] > research/solver/results-hyb.txt
 *   node research/solver/reduce-hyb.mjs --planted   the planted checks alone, the outcomes they reach and the EDGES
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { paired, hold, decode, stampOf, parse as parseA, gate as gateA, loadTraces as loadA, PRED as PREDA, logsOf } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-hyb.md';
export const PTS = '30', SEED = '7005', NPW = 6000, W = '0.02', B = 20000, ALPHA = 0.05;
// audit-hyb.mjs PANEL and ARMS, copied (its module runs its jobs on import); the preflight parses every unit through both
export const PANEL = ['S130', 'S370', 'S128'], ARMS = ['SNAP', 'PCLSI', 'HYB'];
export const ARM = { SNAP: { tables: 'SNAP', read: 'false' }, PCLSI: { tables: 'PCLSI', read: 'true' }, HYB: { tables: 'PCLSI', read: 'false' } };
export const keyOf = u => `${u.id} ${u.arm}`;
export const UNIT_KEYS = PANEL.flatMap(id => ARMS.map(a => `${id} ${a}`));
const BASE = `OFF/PRODUCT/W${W}`, labelOf = a => `${BASE}/${a}`;
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`), LBL = `(${esc(BASE)}\\/(?:SNAP|PCLSI|HYB))`;
const CASEL = new RegExp(`^(\\S.*?)\\s+case \\| unit ${LBL} \\| lambda (\\S+)$`);
const LINE = new RegExp(`^\\s+(ran|access|sum|trace) ${LBL}: (.*)$`), DONEL = new RegExp(`^\\s+done ${LBL}$`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); };

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: m[2].slice(m[2].lastIndexOf('/') + 1), label: m[2], lambda: m[3], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = DONEL.exec(line))) { if (m[1] === cur.label) cur.done = true; continue; }
    if (!(m = LINE.exec(line)) || m[2] !== cur.label) continue;
    const [, kind, , s] = m;
    if (kind === 'ran') cur.ran = s;
    else if (kind === 'access') cur.access = s;
    else if (kind === 'sum') cur.sum = { paths: num(s, 'paths'), survived: num(s, 'survived'), tax: num(s, 'tax'), net: num(s, 'net'), pathsum: field(s, 'pathsum') };
    else if (kind === 'trace') { const x = /^file (\S+) paths (\d+) years (\d+)$/.exec(s); cur.trace = x ? { file: x[1], paths: +x[2], years: +x[3] } : { bad: s }; }
  }
  return us;
}

export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const k of UNIT_KEYS) { const n = units.filter(u => keyOf(u) === k).length; if (n !== 1) bad.push(`${k}: ${n} unit lines, not 1`); }
  for (const u of units) {
    const tag = keyOf(u);
    if (!UNIT_KEYS.includes(tag)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (!u.ran || !u.access || !u.sum || !u.trace) { bad.push(`${tag}: a ran, access, sum or trace line missing`); continue; }
    const A = ARM[u.arm], want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', mix: '3', tables: A.tables, read: A.read, deathTax: '0' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (num(u.ran, 'tieMargin') !== 0) bad.push(`${tag}: ran tieMargin ${field(u.ran, 'tieMargin')}, not 0`);
    if (!(num(u.access, 'open') > 0)) bad.push(`${tag}: access line without the opening balances`);
    const s = u.sum;
    if (s.paths !== npw || !(Number.isInteger(s.survived) && s.survived >= 0 && s.survived <= s.paths) || !Number.isFinite(s.tax) || !Number.isFinite(s.net) || !s.pathsum) bad.push(`${tag}: sum paths ${s.paths} survived ${s.survived} tax ${s.tax} net ${s.net} pathsum ${s.pathsum}`);
    if (u.trace.bad || u.trace.paths !== npw) bad.push(`${tag}: trace line ${u.trace.bad || `paths ${u.trace.paths}`}`);
  }
  // the pairing: one access line and one pathsum across a household's units
  for (const id of PANEL) {
    const us = units.filter(u => u.id === id && u.sum && u.access);
    if (new Set(us.map(u => u.access)).size > 1) bad.push(`${id}: its units' access lines differ`);
    if (new Set(us.map(u => u.sum.pathsum)).size > 1) bad.push(`${id}: its units ran different paths (pathsum ${[...new Set(us.map(u => u.sum.pathsum))].join(', ')})`);
  }
  return bad;
}

/* a unit's per-path file against its unit (reduce-adoptpi.mjs checkTrace, with the arm's tables and read) */
export function checkTrace(t, u, st) {
  const tag = `${keyOf(u)} file`, years = Number((/ years (\d+) /.exec(u.access) || [])[1]) + 1;
  if (!t) return [`${tag}: missing`];
  const bad = [];
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.id !== u.id || t.arm !== u.arm || t.N !== u.sum.paths || t.Y !== years || t.tables !== ARM[u.arm].tables || String(t.read) !== ARM[u.arm].read) bad.push(`${tag}: id ${t.id} arm ${t.arm} tables ${t.tables} read ${t.read} paths ${t.N} years ${t.Y}, not the unit's`);
  if (t.survived.length !== t.N || t.tax.length !== t.N || t.net.length !== t.N || t.u.length !== t.N * t.Y) { bad.push(`${tag}: arrays of the wrong length`); return bad; }
  let s = 0, tx = 0, nt = 0;
  for (let j = 0; j < t.N; j++) { s += t.survived[j]; tx += t.tax[j]; nt += t.net[j]; }
  if (s !== u.sum.survived) bad.push(`${tag}: ${s} survivors in the file, ${u.sum.survived} on the sum line`);
  if (Math.abs(tx / t.N - u.sum.tax) > 0.005 + 1e-6 * Math.abs(u.sum.tax) || Math.abs(nt / t.N - u.sum.net) > 0.005 + 1e-6 * Math.abs(u.sum.net)) bad.push(`${tag}: the file's mean tax ${(tx / t.N).toFixed(2)} or net ${(nt / t.N).toFixed(2)} is not the sum line's ${u.sum.tax} ${u.sum.net}`);
  return bad;
}
const readGz = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
export function loadTraces(units, dir, st, read = readGz) {
  const bad = [], files = {};
  for (const u of units) {
    const raw = u.trace && u.trace.file ? read(join(dir, u.trace.file)) : null, t = raw ? decode(raw) : null;
    bad.push(...checkTrace(t, u, st));
    files[keyOf(u)] = t;
  }
  return { bad, files };
}
/* THE IDENTITY: the SNAP and PCLSI arms against ADOPT-PI's files (`adopt`: key -> decoded file), path for path */
export function identity(files, adopt) {
  const bad = [];
  for (const id of PANEL) for (const a of ['SNAP', 'PCLSI']) {
    const t = files[`${id} ${a}`], o = adopt[`${id} ${a}`];
    if (!t || !o) { bad.push(`identity ${id} ${a}: ${!t ? 'this run\'s' : 'ADOPT-PI\'s'} file missing`); continue; }
    if (t.N !== o.N) { bad.push(`identity ${id} ${a}: ${t.N} paths here, ${o.N} in ADOPT-PI's`); continue; }
    let n = 0; for (let j = 0; j < t.N; j++) if (t.survived[j] !== o.survived[j] || t.tax[j] !== o.tax[j] || t.net[j] !== o.net[j]) n++;
    if (n) bad.push(`identity ${id} ${a}: ${n} of ${t.N} paths differ from ADOPT-PI's (survived, tax or net)`);
  }
  return bad;
}

const mean = xs => xs.reduce((t, x) => t + x, 0) / xs.length;
export function items(files, { b = B } = {}) {
  const F = k => files[k];
  // ITEM 1: per path y = (PCLSI - HYB) - (HYB - SNAP) in survival; the McNemar parts reported beside it
  const ys = PANEL.map(id => { const S = F(`${id} SNAP`), H = F(`${id} HYB`), P = F(`${id} PCLSI`); return Array.from({ length: S.N }, (_, j) => P.survived[j] - 2 * H.survived[j] + S.survived[j]); });
  const p1 = ys.flatMap(y => [flipP(y, b, 7002), flipP(y.map(x => -x), b, 7003)]), h1 = holm(p1);
  const one = PANEL.map((id, i) => {
    const t = paired(F(`${id} SNAP`), F(`${id} HYB`)), r = paired(F(`${id} HYB`), F(`${id} PCLSI`)), tot = (t.c - t.b) + (r.c - r.b);
    return { id, tb: t.b, tc: t.c, rb: r.b, rc: r.c, N: t.N, readShare: tot ? (r.c - r.b) / tot : NaN, my: mean(ys[i]), pU: p1[2 * i], pD: p1[2 * i + 1], hU: h1[2 * i], hD: h1[2 * i + 1], read: h1[2 * i] < ALPHA ? 'READ' : h1[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT' };
  });
  const s130 = one.find(r => r.id === 'S130').read, v1 = s130 === 'READ' ? 'HELD' : s130 === 'TABLES' ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { one, v1 };
}

/* the traces' spend level and tiers per path-year (audit-hyb.mjs saves record.mjs's trace; null in a built file without them) */
const raw8 = v => (v instanceof Uint8Array ? v : typeof v === 'string' ? new Uint8Array(Buffer.from(v, 'base64')) : null);
/* REPORTED (the deep review after COV-B-STEP, 5 Oct 09:27 UK; O95's root-cause step): for two arms of a household, the year each
   discordant path first differs in its tier or spend level, as counts by year; and each arm's year-0 move (tier code, level) */
export function divergence(A, B) {
  const la = raw8(A.level), lb = raw8(B.level), ta = raw8(A.tier), tb = raw8(B.tier);
  if (!la || !lb || !ta || !tb) return null;
  const Y = A.Y, by = new Map(); let none = 0;
  for (let j = 0; j < A.N; j++) {
    if (A.survived[j] === B.survived[j]) continue;
    let t = -1; for (let k = 0; k < Y; k++) { const o = j * Y + k; if (la[o] !== lb[o] || ta[o] !== tb[o]) { t = k; break; } }
    if (t < 0) none++; else by.set(t, (by.get(t) || 0) + 1);
  }
  return { by: [...by.entries()].sort((x, y) => x[0] - y[0]), none };
}
export function opening(T) {
  const l = raw8(T.level), t = raw8(T.tier); if (!l || !t) return null;
  const m = new Map(); for (let j = 0; j < T.N; j++) { const k = `tier ${t[j * T.Y]} level ${l[j * T.Y]}`; m.set(k, (m.get(k) || 0) + 1); }
  return [...m.entries()].sort((x, y) => y[1] - x[1]);
}
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), pv = x => (Number.isFinite(x) ? x.toExponential(2) : '-');
export function reading(files, out = console.log, opts = {}) {
  const r = items(files, opts);
  out(`HYB: ADOPT-PI's unit (no reader, the product's settings, lambda held, the estate weight ${W}, ${PTS} points), seed ${SEED}, death tax 0, every arm of a household on the same paths; SNAP, PCLSI and HYB (PCLSI's tables read through the snap) on ${PANEL.join(', ')}.`);
  out(`\nITEM 1 (primary): O89's split: y = (PCLSI - HYB) - (HYB - SNAP) a path in survival; the randomization test (B ${opts.b || B}) of mean(y) above 0 (READ) and below (TABLES), Holm over ${2 * PANEL.length}; the parts' cells beside it`);
  for (const x of r.one) out(`  ${x.id.padEnd(16)} tables (HYB over SNAP): b ${x.tb} c ${x.tc} change ${f3(100 * (x.tc - x.tb) / x.N)} | read (PCLSI over HYB): b ${x.rb} c ${x.rc} change ${f3(100 * (x.rc - x.rb) / x.N)} | the read's share ${f3(x.readShare)} | mean y ${(1e4 * x.my).toFixed(1)}e-4, p ${pv(x.pU)} / ${pv(x.pD)}, Holm ${pv(x.hU)} / ${pv(x.hD)} | ${x.read}`);
  out(`  -> ${r.v1} (HELD when S130 reads READ; FALSIFIED when S130 reads TABLES; else INCONCLUSIVE)`);
  out('\nSECONDARY (declared; decides nothing): paired changes a path, survival in points, tax and net (se over paths)');
  for (const id of PANEL) for (const [a, c] of [['SNAP', 'PCLSI'], ['SNAP', 'HYB'], ['HYB', 'PCLSI']]) { const p = paired(files[`${id} ${a}`], files[`${id} ${c}`]); out(`  ${id.padEnd(8)} ${c} less ${a}`.padEnd(28) + `survival ${f3(100 * (p.c - p.b) / p.N).padStart(7)}  tax ${f2(p.tax.m).padStart(11)} (${f2(p.tax.se)})  net ${f2(p.net.m).padStart(12)} (${f2(p.net.se)})`); }
  out('\nREPORTED (the deep review after COV-B-STEP): the first year a discordant path differs in tier or spend level (year: paths), and each arm\'s year-0 move');
  for (const id of PANEL) {
    for (const [a, c] of [['SNAP', 'HYB'], ['HYB', 'PCLSI'], ['SNAP', 'PCLSI']]) { const d = divergence(files[`${id} ${a}`], files[`${id} ${c}`]); out(`  ${id.padEnd(8)} ${c} against ${a}: ${d ? `${d.by.map(([t, n]) => `${t}:${n}`).join(' ') || 'no discordant path'}${d.none ? ` | no difference in tier or level on ${d.none}` : ''}` : 'no traces'}`); }
    out(`  ${id.padEnd(8)} year-0 move: ${ARMS.map(a => { const o = opening(files[`${id} ${a}`]); return `${a} ${o ? o.map(([k, n]) => `${k} (${n})`).join(', ') : 'no traces'}`; }).join(' | ')}`);
  }
  out('\nREPORTED: the hold per arm (paths reaching 0.6 of the allowance, crossing 0.75, the mean years in [0.6, 0.75) of the reaching paths)');
  for (const k of UNIT_KEYS) { const h = hold(files[k]); out(`  ${k.padEnd(14)} reach ${String(h.reach).padStart(5)} cross ${String(h.cross).padStart(5)} dwell ${f2(h.dwell)}`); }
  out(`\nOUTCOME: 1 ${r.v1}`);
  return r;
}

/* ---- planted checks: built logs and files, faults planted in them ---- */
const ST = { code: 'abc', audit: 'def', prediction: 'none', sha: '-' };
const NB = 2000, YB = 40, splitK = k => { const arm = k.slice(k.lastIndexOf(' ') + 1); return { id: k.slice(0, k.length - arm.length - 1), arm }; };
const fileName = (id, arm) => `${id}-${arm.toLowerCase()}.json.gz`;
/* a built file: SNAP survives paths 0-1899, PCLSI saves paths 1900-1999 as well; HYB survives as SNAP plus the first o.hyb[id]
   of PCLSI's saved paths; tax 100 and net 1000 a path; used shares 0.3 */
function builtFile(id, arm, o = {}) {
  const N = NB, sv = new Uint8Array(N), tax = new Float32Array(N).fill(100), net = new Float32Array(N).fill(1000), u = new Float32Array(N * YB).fill(0.3);
  for (let j = 0; j < N; j++) sv[j] = j < 1900 ? 1 : 0;
  const k = (o.hyb || {})[id] ?? 0, none = (o.noGain || []).includes(id);
  if (arm === 'PCLSI' && !none) for (let j = 1900; j < 2000; j++) sv[j] = 1;
  if (arm === 'HYB') for (let j = 1900; j < 1900 + k; j++) sv[j] = 1;
  if (o.idOff && id === 'S370' && arm === 'PCLSI' && o.adoptSide) tax[7] += 1;
  return { id, arm, dt: false, read: ARM[arm].read === 'true', tables: ARM[arm].tables, stamp: o.stOff && id === 'S128' && arm === 'HYB' ? { ...ST, audit: 'zzz' } : ST, N, Y: YB, survived: sv, tax, net, u };
}
const builtFiles = (o = {}) => Object.fromEntries(UNIT_KEYS.map(k => { const { id, arm } = splitK(k); return [k, builtFile(id, arm, o)]; }));
function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const k of UNIT_KEYS) {
    if (o.skip === k) continue;
    const { id, arm } = splitK(k), L = labelOf(arm), A = ARM[arm];
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed ${SEED} paths ${NB} grid total30x6x6 lambda 0.0223606797749979 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 tables ${o.tablesOff && k === 'S130 HYB' ? 'SNAP' : A.tables} read ${o.readOff && k === 'S370 HYB' ? 'true' : A.read} tieMargin ${o.tieOff && k === 'S128 PCLSI' ? 0.000001 : 0} deathTax ${o.dtOff && k === 'S130 SNAP' ? '0.4' : '0'}`);
    lines.push(`${''.padEnd(16)} access ${L}: year 2 years ${YB - 1} lsa 268275 open 950000`);
    const f = builtFile(id, arm, o);
    let s = 0, tx = 0, nt = 0; for (let j = 0; j < f.N; j++) { s += f.survived[j]; tx += f.tax[j]; nt += f.net[j]; }
    lines.push(`${''.padEnd(16)} sum ${L}: paths ${NB} survived ${o.sumOff && k === 'S128 HYB' ? s + 1 : s} tax ${(tx / f.N).toFixed(2)} net ${(nt / f.N).toFixed(2)} pathsum ${o.pathsOff && k === 'S370 HYB' ? 12345 : 999} secs 10`);
    lines.push(`${''.padEnd(16)} trace ${L}: file ${fileName(id, arm)} paths ${NB} years ${YB}`);
    if (!(o.notDone && k === 'S370 PCLSI')) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  return lines.join('\n') + '\n';
}
function builtRead(o) { const fs = builtFiles(o); return f => { const k = UNIT_KEYS.find(x => { const { id, arm } = splitK(x); return f.endsWith(fileName(id, arm)); }); return o.missing && k === 'S130 HYB' ? null : fs[k] || null; }; }
const builtAdopt = o => Object.fromEntries(PANEL.flatMap(id => ['SNAP', 'PCLSI'].map(a => [`${id} ${a}`, builtFile(id, a, { ...o, adoptSide: true })])));
const EDGES = [], REACHED = { 1: new Set() };
function planted() {
  const cases = [], PB = 2000;
  const G = o => { const us = parse(builtLog(o)); const g = gate(us, { npw: NB }); if (g.length) return g; const tr = loadTraces(us, '/x', ST, builtRead(o)); return tr.bad.length ? tr.bad : identity(tr.files, builtAdopt(o)); };
  cases.push(['a built set gates clean, the identity included', String(G({}).length), '0']);
  { const g = gate(parse(builtLog({ skip: 'S128 PCLSI' })), { npw: NB }); cases.push(['the gate alone names a missing unit', String(g.some(x => /^S128 PCLSI: 0 unit lines, not 1$/.test(x))), 'true']); }
  for (const [nm, o] of [['a unit not done', { notDone: true }], ['HYB on SNAP\'s tables', { tablesOff: true }], ['HYB read interpolated', { readOff: true }], ['a unit at a tie margin', { tieOff: true }],
    ['a unit at a death tax of 0.4', { dtOff: true }], ['a household\'s units on different paths', { pathsOff: true }], ['a sum line off its file', { sumOff: true }],
    ['a file with another stamp', { stOff: true }], ['a missing file', { missing: true }], ['an arm off ADOPT-PI\'s file on one path (the identity)', { idOff: true }]]) cases.push([`the gate refuses ${nm}`, String(G(o).length > 0), 'true']);
  const R = (o, fs = builtFiles(o)) => { const r = items(fs, { b: PB }); REACHED[1].add(r.v1); return r; };
  // PCLSI saves 100 over SNAP on every household; HYB saves the first k of them
  { const r = R({}); cases.push(['HYB saving none of PCLSI\'s 100 on S130 reads READ, item 1 HELD', `${r.one[0].read} ${r.v1}`, 'READ HELD']); }
  { const r = R({ hyb: { S130: 100 } }); cases.push(['HYB saving all 100 on S130 reads TABLES, item 1 FALSIFIED', `${r.one[0].read} ${r.v1}`, 'TABLES FALSIFIED']); }
  { const r = R({ hyb: { S130: 50 } }); cases.push(['HYB saving exactly 50 of 100 on S130 (mean y 0) reads SPLIT, item 1 INCONCLUSIVE', `${r.one[0].read} ${r.one[0].readShare} ${r.v1}`, 'SPLIT 0.5 INCONCLUSIVE']); } EDGES.push('the read and the tables carrying exactly half each (mean y 0)');
  { const r = R({ hyb: { S130: 25 } }); cases.push(['HYB saving 25 of 100 on S130 (the read three quarters) reads READ', `${r.one[0].read} ${r.one[0].readShare}`, 'READ 0.75']); }
  { const r = R({ hyb: { S130: 75 } }); cases.push(['HYB saving 75 of 100 on S130 (the tables three quarters) reads TABLES', `${r.one[0].read} ${r.one[0].readShare}`, 'TABLES 0.25']); }
  // HYB saving 42 of 100 on S130: the read's side at Holm p 0.254, between 0.05 and 0.5: SPLIT
  { const r = R({ hyb: { S130: 42 } }); cases.push(['HYB saving 42 of 100 on S130 reads the READ side at Holm p between 0.05 and 0.5: SPLIT, item 1 INCONCLUSIVE', `${r.one[0].hU > 0.05 && r.one[0].hU < 0.5} ${r.one[0].read} ${r.v1}`, 'true SPLIT INCONCLUSIVE']); } EDGES.push('a READ side between 0.05 and 0.5 after Holm');
  cases.push(['HYB saving 90 on S370 alone moves nothing on S130', R({ hyb: { S370: 90 } }).v1, 'HELD']);
  { const r = R({ noGain: ['S130'] }); cases.push(['no discordant path between SNAP, HYB and PCLSI on S130 reads SPLIT, item 1 INCONCLUSIVE', `${r.one[0].read} ${r.v1}`, 'SPLIT INCONCLUSIVE']); } EDGES.push('no discordant path on the deciding household');
  { const r = R({ noGain: ['S130'], hyb: { S130: 30 } }); cases.push(['HYB saving 30 where PCLSI saves none (the read costing what the tables give) reads TABLES', `${r.one[0].read} ${r.one[0].readShare}`, 'TABLES NaN']); } EDGES.push('a hybrid above PCLSI (the read\'s part negative; no total gain)');
  { const N = 4, Y = 3, mk = (sv, lv, tr) => ({ N, Y, survived: Uint8Array.from(sv), level: Uint8Array.from(lv), tier: Uint8Array.from(tr) });
    const A = mk([1, 1, 0, 1], [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const Bb = mk([1, 0, 1, 0], [100, 100, 100, 100, 90, 100, 100, 100, 100, 100, 100, 100], [0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0]);
    const d = divergence(A, Bb), o = opening(Bb);
    cases.push(['the divergence counts path 1 at year 1 (level), path 2 at year 0 (tier), path 3 with no difference', `${JSON.stringify(d.by)} ${d.none} ${o[0][0]} ${o[0][1]}`, '[[0,1],[1,1]] 1 tier 0 level 100 3']); } EDGES.push('a discordant path with no difference in tier or level');
  { const lines = []; reading(builtFiles({}), l => lines.push(l), { b: PB }); cases.push(['the reading runs to its outcome', String(lines.some(l => /^\nOUTCOME: 1 HELD$/.test(l))), 'true']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
export { builtLog, builtFiles, stampOf };

/* ADOPT-PI's files for the identity, through their own gate and stamp check (rule 3) */
export function adoptFiles(dir = join(HERE, 'results', 'diagadoptpi')) {
  const logs = logsOf(dir), units = Object.values(logs).flatMap(parseA);
  requireFairLogs(logs, PREDA);
  const bad = gateA(units);
  if (bad.length) return { bad: bad.map(x => `ADOPT-PI's files: ${x}`), files: {} };
  const tr = loadA(units, dir, stampOf(Object.values(logs)[0]));
  return { bad: tr.bad.map(x => `ADOPT-PI's files: ${x}`), files: tr.files };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nOUTCOMES REACHED: item 1: ${[...REACHED[1]].sort().join(', ')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diaghyb'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (units.filter(u => u.done).length < UNIT_KEYS.length) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNIT_KEYS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw });
  const tr = bad.length ? { bad: [], files: {} } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
  bad.push(...tr.bad);
  if (!bad.length && !process.argv.includes('--no-identity')) { const ad = adoptFiles(); bad.push(...ad.bad); if (!ad.bad.length) bad.push(...identity(tr.files, ad.files)); }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${UNIT_KEYS.length} units, each once and done, ADOPT-PI's settings and the arm's tables and read, tie margin 0 and death tax 0 on every ran line; each household's units on one access line and one set of paths; every per-path file present, stamped and holding its sum line; ${process.argv.includes('--no-identity') ? 'THE IDENTITY NOT RUN (--no-identity: a preflight only)' : 'the SNAP and PCLSI arms equal to ADOPT-PI\'s per-path files on every path (ADOPT-PI\'s files through their own gate)'}\n`);
  reading(tr.files);
}
