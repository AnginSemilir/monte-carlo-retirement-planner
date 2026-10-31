/*
 * THE THREE-ARM DRAW-PAUSE CONTRAST'S REDUCER (PLAN.md DPC; O71, O83; audit-dpc.mjs). A MEASUREMENT, not a test: it reads the
 * logs launched under predictions/measure-dpc.md (Kind: measurement) and settles nothing; the households are 7e's panel (25)
 * in three arms of the used-allowance axis: SNAP (DP's own unit), PCLSI (interpolated), SHIFT (buckets 0, 0.6, 1 snapped).
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/measure-dpc.md); every household in every arm once
 * and done; each ran line the shipping default's (no reader, the registered points, seed 7002 and path count, the estate
 * weight 0.02, the switch margin 0.001) with the arm's own axis (SNAP 0,0.5,1 snapped, PCLSI 0,0.5,1 interpolated, SHIFT
 * 0,0.6,1 snapped); DP's dp line consistent as reduce-dp.mjs holds it and the dwell line summing to reach; the access line
 * the same in a household's three arms; the dist line's bins counted and their pension shares within 0 and 1 (a '-' exactly
 * when a bin is empty), the cliff the arm's; the plateau paths no more than reach (and no more than reach less cross where
 * the cliff is DP's 0.75), their used share in [0.6, the cliff); the sp line's year the same in every arm and its counts whole;
 * SNAP's per-path trace (a trace line on SNAP and on no other arm; the file present, its stamp the logs', its paths and
 * years the unit's, and the reach and cross recomputed from its used shares equal to the dp line's).
 * THE IDENTITY (checklist 3: DP's files re-used, so fair-tested first): SNAP is DP's unit re-run, so each household's SNAP ran,
 * access, dp and dwell lines must equal DP's in results/diagdp (read under DP's own stamp gate, predictions/measure-dp.md) to
 * the character. A difference is not settled: the gate refuses.
 * THE READING (registered in predictions/measure-dpc.md): per household and arm, DP's reach, cross, dwell and pause; the share
 * of the after-access path-years in [c - 0.3, c) lying within one year's pre-wall pace of the arm's own cliff c (bins d0 and
 * d05) and their pension share; the plateau paths, where they sit and their pension; the State Pension's growth drop (its
 * year's mean growth less the year before's) under 0.6 and in [0.6, c). Then the two registered households: S130's dwell
 * SNAP against PCLSI; S128's class - SNAP-HOLD (its dwell falls by a quarter or more under PCLSI and its pension share
 * within one pace of the cliff under SNAP is 0.25 or more), RUN-DOWN (its dwell within 10% of SNAP's under PCLSI and its
 * plateau paths' pension share 0.05 or less), else MIXED; and the panel's near-cliff share in each arm.
 *   node research/solver/reduce-dpc.mjs [dir] [paths] [points] [dpdir] > research/solver/results-dpc.txt
 *   node research/solver/reduce-dpc.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { parse as parseDp } from './reduce-dp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-dpc.md', PRED_DP = 'research/solver/predictions/measure-dp.md';
export const PTS = '30', SEED = '7002', NPW = 2000, W = '0.02';
export const PANEL = ['share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S126', 'bridge 4', 'S360', 'S194',
  'S124', 'S128', 'S130', 'S366', 'S370', 'bridge 4+cost', 'S162', 'S172', 'S168'];
export const ARMS = { SNAP: { pcls: '0,0.5,1', interp: 'false', cliff: 0.75 }, PCLSI: { pcls: '0,0.5,1', interp: 'true', cliff: 0.75 }, SHIFT: { pcls: '0,0.6,1', interp: 'false', cliff: 0.8 } };
export const BINS = ['d0', 'd05', 'd1', 'd2', 'd4', 'nopace'];
const BASE = `OFF/PRODUCT/W${W}`, labelOf = a => (a === 'SNAP' ? BASE : `${BASE}/${a}`), armOf = l => (l === BASE ? 'SNAP' : l.slice(BASE.length + 1));
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`), LBL = `(${esc(BASE)}(?:\\/(?:PCLSI|SHIFT))?)`;
const CASEL = new RegExp(`^(\\S.*?)\\s+case \\| unit ${LBL} \\| lambda (\\S+)$`);
const LINE = new RegExp(`^\\s+(ran|access|dp|dwell|dist|plateau|sp|trace) ${LBL}: (.*)$`), DONEL = new RegExp(`^\\s+done ${LBL}$`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); };

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: armOf(m[2]), lambda: m[3], done: false, raw: {} }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = DONEL.exec(line))) { if (armOf(m[1]) === cur.arm) cur.done = true; continue; }
    if (!(m = LINE.exec(line)) || armOf(m[2]) !== cur.arm) continue;
    const [, kind, , s] = m;
    cur.raw[kind] = s;
    if (kind === 'ran') cur.ran = s;
    else if (kind === 'access') cur.access = s;
    else if (kind === 'trace') { const x = /^file (\S+) paths (\d+) years (\d+)$/.exec(s); cur.trace = x ? { file: x[1], paths: +x[2], years: +x[3] } : { bad: s }; }
    else if (kind === 'dp') cur.dp = Object.fromEntries(['paths', 'survived', 'reach', 'cross', 'dwell', 'pause'].map(k => [k, num(s, k)]));
    else if (kind === 'dwell') cur.dwell = s === '-' ? [] : s.split(' ').map(x => x.split(':').map(Number));
    else if (kind === 'dist') {
      const c = /^cliff (\S+) (.*)$/.exec(s);
      if (!c) continue;
      const t = c[2].split(' '), bins = {};
      for (let i = 0; i + 2 < t.length + 1; i += 3) bins[t[i]] = { n: Number(t[i + 1]), ps: t[i + 2] === '-' ? NaN : Number(t[i + 2]), dash: t[i + 2] === '-' };
      cur.dist = { cliff: Number(c[1]), bins };
    } else if (kind === 'plateau') cur.plateau = Object.fromEntries(['paths', 'u', 'pshare', 'pyears'].map(k => [k, num(s, k)]));
    else if (kind === 'sp') {
      const x = /^year (\d+) lo (\d+) (\S+) before (\d+) (\S+) band (\d+) (\S+) before (\d+) (\S+)$/.exec(s);
      if (x) { const v = q => (q === '-' ? NaN : Number(q)); cur.sp = { year: +x[1], lo: [+x[2], v(x[3]), +x[4], v(x[5])], band: [+x[6], v(x[7]), +x[8], v(x[9])] }; }
    }
  }
  return us;
}

/* DP's records for the identity: each household's ran, access, dp and dwell lines as DP printed them */
export function dpRecords(texts) {
  const rec = {};
  for (const t of texts) {
    let id = null;
    for (const line of t.split('\n')) {
      const c = new RegExp(`^(\\S.*?)\\s+case \\| unit ${esc(BASE)} \\| lambda`).exec(line);
      if (c) { id = c[1].trim(); rec[id] = {}; continue; }
      const m = new RegExp(`^\\s+(ran|access|dp|dwell) ${esc(BASE)}: (.*)$`).exec(line);
      if (id && m) rec[id][m[1]] = m[2];
    }
  }
  return rec;
}

// the forward run's wall-clock seconds (the dp line's secs field) vary between runs and are not a result: the identity reads
// every other field (found by the preflight of 4 Oct: four households differed in secs alone)
export const noTime = x => (typeof x === 'string' ? x.replace(/ secs \d+(?= |$)/, '') : x);
export function gate(units, { pts = PTS, npw = NPW, dp = null } = {}) {
  const bad = [];
  for (const id of PANEL) for (const a of Object.keys(ARMS)) { const k = units.filter(u => u.id === id && u.arm === a).length; if (k !== 1) bad.push(`${id} ${a}: ${k} unit lines, not 1`); }
  for (const u of units) {
    const A = ARMS[u.arm], tag = `${u.id} ${u.arm}`;
    if (!PANEL.includes(u.id) || !A) { bad.push(`${tag}: not a panel household and arm`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (!u.ran || !u.access || !u.dp || !u.dwell || !u.dist || !u.plateau || !u.sp) { bad.push(`${tag}: a ran, access, dp, dwell, dist, plateau or sp line missing or malformed`); continue; }
    const want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: A.pcls, pclsInterp: A.interp, mix: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    const d = u.dp;
    if (d.paths !== npw) bad.push(`${tag}: ${d.paths} paths, not ${npw}`);
    if (!(d.cross <= d.reach && d.reach <= d.paths && d.pause <= d.reach && d.survived <= d.paths)) bad.push(`${tag}: reach ${d.reach}, cross ${d.cross}, pause ${d.pause} of ${d.paths} paths`);
    const n = u.dwell.reduce((t, [, k]) => t + k, 0);
    if (n !== d.reach) bad.push(`${tag}: the dwell line holds ${n} paths, reach ${d.reach}`);
    else if (d.reach > 0 && !(Math.abs(u.dwell.reduce((t, [y, k]) => t + y * k, 0) / d.reach - d.dwell) <= 1e-4)) bad.push(`${tag}: the dwell line's mean is not the dp line's ${d.dwell}`);
    // the dist line: the arm's cliff, every bin once, whole counts, shares in [0, 1], '-' exactly when empty
    if (u.dist.cliff !== A.cliff) bad.push(`${tag}: dist cliff ${u.dist.cliff}, not ${A.cliff}`);
    const ks = Object.keys(u.dist.bins);
    if (ks.join(',') !== BINS.join(',')) bad.push(`${tag}: dist bins ${ks.join(',')}, not ${BINS.join(',')}`);
    for (const [k, b] of Object.entries(u.dist.bins)) {
      if (!(Number.isInteger(b.n) && b.n >= 0)) bad.push(`${tag}: dist ${k} count ${b.n}`);
      else if ((b.n === 0) !== b.dash || (b.n > 0 && !(b.ps >= 0 && b.ps <= 1))) bad.push(`${tag}: dist ${k} ${b.n} with share ${b.dash ? '-' : b.ps}`);
    }
    // the plateau: within reach, within reach less cross at DP's cliff, sitting in [0.6, the cliff)
    const p = u.plateau;
    if (!(Number.isInteger(p.paths) && p.paths >= 0 && p.paths <= d.reach && (A.cliff !== 0.75 || p.paths <= d.reach - d.cross))) bad.push(`${tag}: ${p.paths} plateau paths, reach ${d.reach} cross ${d.cross}`);
    else if (p.paths > 0 ? !(p.u >= 0.6 && p.u < A.cliff && p.pshare >= 0 && p.pshare <= 1 && p.pyears >= 0) : [p.u, p.pshare, p.pyears].some(Number.isFinite)) bad.push(`${tag}: plateau u ${p.u} pshare ${p.pshare} pyears ${p.pyears} on ${p.paths} paths`);
    if (u.arm === 'SNAP' ? !(u.trace && u.trace.file && u.trace.paths === npw) : !!u.trace) bad.push(`${tag}: ${u.arm === 'SNAP' ? `trace line ${u.trace ? JSON.stringify(u.trace) : 'missing'} (one of ${npw} paths wanted)` : 'a trace line off SNAP'}`);
    for (const k of ['lo', 'band']) for (const at of [0, 2]) { const [c, g] = [u.sp[k][at], u.sp[k][at + 1]]; if (!(Number.isInteger(c) && c >= 0) || (c === 0) !== !Number.isFinite(g)) bad.push(`${tag}: sp ${k} ${at ? 'before' : 'year'} ${c} with growth ${g}`); }
  }
  // a household's arms share the access line and the State Pension's year
  for (const id of PANEL) {
    const us = units.filter(u => u.id === id && u.access && u.sp);
    if (us.length > 1 && (new Set(us.map(u => u.access)).size > 1 || new Set(us.map(u => u.sp.year)).size > 1)) bad.push(`${id}: the arms' access lines or State Pension years differ`);
  }
  // the identity: SNAP is DP's unit, line for line
  if (dp) for (const id of PANEL) {
    const u = units.find(x => x.id === id && x.arm === 'SNAP'), r = dp[id];
    if (!u) continue;
    if (!r) { bad.push(`${id} SNAP: no DP record to hold it to`); continue; }
    for (const k of ['ran', 'access', 'dp', 'dwell']) if (noTime(u.raw[k]) !== noTime(r[k])) bad.push(`${id} SNAP: its ${k} line is not DP's (${String(u.raw[k]).slice(0, 60)} against ${String(r[k]).slice(0, 60)})`);
  } else bad.push('no DP records: the SNAP identity was not checked (a check that ran on nothing is an error)');
  return bad;
}

/* SNAP's per-path trace against its unit: `t` the decoded trace, `u` the unit, `st` the logs' stamp */
// a small decoded Buffer sits inside Node's shared pool: copy its own bytes, not the pool (found by the DPC preflight, 4 Oct)
const f32 = b => { const x = Buffer.from(b, 'base64'); return new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)); };
export function checkTrace(t, u, st) {
  const tag = `${u.id} SNAP trace`, years = Number((/ years (\d+) /.exec(u.access) || [])[1]) + 1;
  if (!t) return [`${tag}: missing`];
  const bad = [];
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.id !== u.id || t.arm !== 'SNAP' || t.N !== u.dp.paths || t.Y !== years) bad.push(`${tag}: id ${t.id} arm ${t.arm} paths ${t.N} years ${t.Y}, not ${u.id} SNAP ${u.dp.paths} ${years}`);
  const U = t.u instanceof Float32Array ? t.u : f32(t.u), pen = t.pen instanceof Float32Array ? t.pen : f32(t.pen), non = t.non instanceof Float32Array ? t.non : f32(t.non);
  if (U.length !== t.N * t.Y || pen.length !== U.length || non.length !== U.length) { bad.push(`${tag}: arrays ${U.length}, ${pen.length}, ${non.length}, not ${t.N * t.Y}`); return bad; }
  let reach = 0, cross = 0;
  for (let j = 0; j < t.N; j++) { let r = false, c = false; for (let y = 0; y < t.Y; y++) { const x = U[j * t.Y + y]; if (x >= 0.6) r = true; if (x >= 0.75) c = true; } if (r) reach++; if (c) cross++; }
  if (reach !== u.dp.reach || cross !== u.dp.cross) bad.push(`${tag}: reach ${reach} cross ${cross} from its used shares, the dp line ${u.dp.reach} ${u.dp.cross}`);
  return bad;
}
export function loadTraces(units, dir, st) {
  const bad = [];
  for (const u of units.filter(x => x.arm === 'SNAP' && x.trace && x.trace.file)) {
    const f = join(dir, u.trace.file);
    bad.push(...checkTrace(existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null, u, st));
  }
  return bad;
}
export const stampOf = text => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };

const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-');
const near = u => { const b = u.dist.bins, n = BINS.reduce((t, k) => t + b[k].n, 0), k = b.d0.n + b.d05.n; return { n, k, share: n ? k / n : NaN, ps: k ? ((b.d0.n ? b.d0.n * b.d0.ps : 0) + (b.d05.n ? b.d05.n * b.d05.ps : 0)) / k : NaN }; };
const drop = a => (a[0] && a[2] ? a[1] - a[3] : NaN);
export function classS128(snap, pclsi) {
  const ns = near(snap), fall = snap.dp.dwell > 0 ? (snap.dp.dwell - pclsi.dp.dwell) / snap.dp.dwell : NaN;
  if (fall >= 0.25 && ns.ps >= 0.25) return 'SNAP-HOLD';
  if (Math.abs(fall) <= 0.1 && pclsi.plateau.paths > 0 && pclsi.plateau.pshare <= 0.05 && snap.plateau.paths > 0 && snap.plateau.pshare <= 0.05) return 'RUN-DOWN';
  return 'MIXED';
}
export function reading(units, out = console.log) {
  const at = (id, a) => units.find(u => u.id === id && u.arm === a);
  out(`THE THREE-ARM DRAW-PAUSE CONTRAST (O71, O83; a measurement, not a test): the shipping default (no reader, the product's settings, lambda held, the estate weight ${W}, ${PTS} points) on 7e's panel (25 households), ${NPW} paths each (seed ${SEED}), in three arms of the used-allowance axis: SNAP (0, 0.5, 1 snapped; cliff 0.75; DP's unit, held to DP's lines), PCLSI (0, 0.5, 1 interpolated; DP's cliff 0.75 as the reference), SHIFT (0, 0.6, 1 snapped; cliff 0.8). 'near' is the share of the after-access path-years in [c - 0.3, c) within one year of the path's pre-wall pace below the arm's cliff c, 'ps' their pension share; 'plat' the paths that reach 0.6, never reach c and live to the plan's end (their used share at the end and pension share); 'SP drop' the mean growth of the used share in the State Pension's year less the year before, under 0.6 and in [0.6, c).`);
  out('  household        arm   | reach  cross  dwell  pause | near   (of)    ps     | plat   u      ps     | SP year drop<0.6  drop band');
  for (const id of PANEL) for (const a of Object.keys(ARMS)) {
    const u = at(id, a), d = u.dp, nr = near(u), p = u.plateau;
    out(`  ${(a === 'SNAP' ? id : '').padEnd(16)} ${a.padEnd(5)} | ${String(d.reach).padStart(5)}  ${String(d.cross).padStart(5)}  ${f2(d.dwell).padStart(5)}  ${String(d.pause).padStart(5)} | ${f4(nr.share)} (${String(nr.n).padStart(5)}) ${f4(nr.ps)} | ${String(p.paths).padStart(5)}  ${f4(p.u)} ${f4(p.pshare)} | ${String(u.sp.year).padStart(2)}   ${f4(drop(u.sp.lo)).padStart(8)}  ${f4(drop(u.sp.band)).padStart(8)}`);
  }
  const s130 = [at('S130', 'SNAP'), at('S130', 'PCLSI')], s128 = [at('S128', 'SNAP'), at('S128', 'PCLSI')], cls = classS128(...s128);
  out(`\nREGISTERED (predictions/measure-dpc.md): S130's dwell SNAP ${f2(s130[0].dp.dwell)}, PCLSI ${f2(s130[1].dp.dwell)} (registered: about 10 to about 3). S128: dwell SNAP ${f2(s128[0].dp.dwell)}, PCLSI ${f2(s128[1].dp.dwell)}; pension share within one pace of the cliff under SNAP ${f4(near(s128[0]).ps)}; plateau pension share SNAP ${f4(s128[0].plateau.pshare)}, PCLSI ${f4(s128[1].plateau.pshare)}: ${cls}.`);
  const tot = {};
  for (const a of Object.keys(ARMS)) {
    const us = PANEL.map(id => at(id, a)), n = us.reduce((t, u) => t + near(u).n, 0), k = us.reduce((t, u) => t + near(u).k, 0);
    const pl = us.reduce((t, u) => t + u.plateau.paths, 0), pause = us.reduce((t, u) => t + u.dp.pause, 0);
    tot[a] = { near: n ? k / n : NaN, pause, pl };
    out(`TOTALS ${a}: near ${f4(tot[a].near)} (${k} of ${n} path-years); pausing paths (DP's definition, DP's band) ${pause}; plateau paths ${pl}`);
  }
  return { cls, tot, s130: [s130[0].dp.dwell, s130[1].dp.dwell] };
}

function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const id of PANEL) for (const a of Object.keys(ARMS)) {
    if (o.skip === `${id} ${a}`) continue;
    const L = labelOf(a), A = ARMS[a], s128 = id === 'S128', s130 = id === 'S130';
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed 7002 paths 2000 grid total30x6x6 lambda 0.0223606797749979 bequestWeight 0.02 finalIntegral true bridgeRead ${o.reader && s130 && a === 'PCLSI' ? 'reader' : 'false'} switchMargin 0.001 pcls ${o.wrongAxis && a === 'SHIFT' ? '0,0.5,1' : A.pcls} pclsInterp ${A.interp}`);
    lines.push(`${''.padEnd(16)} access ${L}: year ${o.accessOff && s130 && a === 'SHIFT' ? 3 : 2} years 39 lsa 268275`);
    const dw = s130 ? (a === 'PCLSI' ? 3 : 10) : s128 ? (a === 'PCLSI' ? (o.s128 === 'rundown' ? 9.5 : o.s128 === 'mixed' ? 8 : 5) : 10) : 4;
    const reach = 300, cross = s128 && o.plateauOver && a === 'SNAP' ? 0 : 200;
    lines.push(`${''.padEnd(16)} dp ${L}: paths 2000 survived 1900 reach ${o.crossOver && s130 && a === 'PCLSI' ? 199 : reach} cross ${cross} dwell ${dw.toFixed(4)} wallpy 900 wallgrowth 0.0100 prepy 800 pregrowth 0.0300 pause ${s130 && a === 'SNAP' ? 40 : 10} pausedwell 5.0000 pausemedian 5 pausemax 9 stall 20 secs 200`);
    lines.push(`${''.padEnd(16)} dwell ${L}: ${o.dwellOff && s130 && a === 'SHIFT' ? `${dw}:299` : `${dw}:300`}`);
    const ps0 = s128 ? (o.s128 === 'rundown' ? '0.0300' : '0.6000') : '0.4000';
    const bins = { d0: [o.emptyDash && s130 && a === 'SNAP' ? 0 : 50, ps0], d05: [40, ps0], d1: [30, '0.3000'], d2: [20, '0.2000'], d4: [10, '0.1000'], nopace: [0, '-'] };
    if (o.shareOver && s130 && a === 'PCLSI') bins.d1[1] = '1.2000';
    const binTxt = Object.entries(bins).filter(([k]) => !(o.binMissing && s130 && a === 'SNAP' && k === 'd4')).map(([k, [n, p]]) => `${k} ${n} ${n ? p : '-'}`).join(' ');
    lines.push(`${''.padEnd(16)} dist ${L}: cliff ${o.cliffOff && s130 && a === 'SHIFT' ? 0.75 : A.cliff} ${o.emptyDash && s130 && a === 'SNAP' ? binTxt.replace('d0 0 -', 'd0 0 0.5000') : binTxt}`);
    const pls = s128 ? (o.s128 === 'rundown' ? '0.0200' : '0.5000') : '0.1000';
    lines.push(`${''.padEnd(16)} plateau ${L}: paths ${o.plateauOver && s128 && a === 'SNAP' ? 301 : 50} u ${o.plateauU && s130 && a === 'SHIFT' ? '0.8100' : '0.6800'} pshare ${pls} pyears 2.0000`);
    lines.push(`${''.padEnd(16)} sp ${L}: year ${o.spOff && s130 && a === 'PCLSI' ? 13 : 12} lo 100 0.0100 before 90 0.0200 band ${o.spDash && s130 && a === 'SNAP' ? '0 0.0100' : '50 0.0050'} before 40 0.0090`);
    if ((a === 'SNAP' && !(o.noTrace && s130)) || (o.traceOff && s130 && a === 'PCLSI')) lines.push(`${''.padEnd(16)} trace ${L}: file ${id.replace(/[ +]/g, '_')}-snap.json.gz paths 2000 years 40`);
    if (!(o.notDone && id === 'S194' && a === 'PCLSI')) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  if (o.extra) lines.push(`S999             case | unit ${BASE} | lambda 0.0223606797749979`);
  return lines.join('\n') + '\n';
}
/* DP's records as built: SNAP's lines of a built log, optionally with one character changed */
const builtDp = (o = {}) => { const r = dpRecords([builtLog()]); if (o.dpOff) r.S130.dp = r.S130.dp.replace('survived 1900', 'survived 1901'); if (o.dpSecs) r.S130.dp = r.S130.dp.replace(/ secs \d+/, ' secs 99'); if (o.dpMissing) delete r.S126; return r; };
const EDGES2 = [];
function planted() {
  const cases = [], SZ = { pts: '30', npw: 2000 };
  const g = (o, d = {}) => String(gate(parse(builtLog(o)), { ...SZ, dp: builtDp(d) }).length > 0);
  cases.push(['a built set gates clean', String(gate(parse(builtLog()), { ...SZ, dp: builtDp() }).length), '0']);
  for (const [nm, o] of [['a missing unit', { skip: 'S126 SHIFT' }], ['an extra household', { extra: true }], ['a unit not done', { notDone: true }], ['a reader in an arm', { reader: true }],
    ['SHIFT on the default buckets', { wrongAxis: true }], ['an arm\'s access line off the others', { accessOff: true }], ['more crossing than reaching paths', { crossOver: true }], ['a dwell line off reach', { dwellOff: true }],
    ['a dist cliff not the arm\'s', { cliffOff: true }], ['a dist bin missing', { binMissing: true }], ['a pension share above 1', { shareOver: true }], ['an empty bin with a share', { emptyDash: true }],
    ['more plateau paths than reach less cross', { plateauOver: true }], ['a plateau sitting at or past its cliff', { plateauU: true }], ['an arm\'s State Pension year off the others', { spOff: true }], ['an empty sp count with a growth', { spDash: true }], ['SNAP without its trace line', { noTrace: true }], ['a trace line off SNAP', { traceOff: true }]]) cases.push([`the gate refuses ${nm}`, g(o), 'true']);
  cases.push(['the gate refuses SNAP off DP by one character', g({}, { dpOff: true }), 'true']);
  cases.push(['the gate accepts SNAP off DP in its forward seconds alone', g({}, { dpSecs: true }), 'false']);
  cases.push(['noTime strips the secs field only', noTime('reach 4 secs 3 pause 1'), 'reach 4 pause 1']);
  cases.push(['the gate refuses a household with no DP record', g({}, { dpMissing: true }), 'true']);
  cases.push(['the gate refuses a run with no DP records at all', String(gate(parse(builtLog()), SZ).length > 0), 'true']);
  { // the trace against its unit: a built trace whose reach and cross are the dp line's (300, 200 on 2,000 paths, 40 years)
    const u = parse(builtLog()).find(x => x.id === 'S130' && x.arm === 'SNAP'), st = { code: 'abc', audit: 'def', prediction: 'none', sha: '-' };
    const mk = (reach, cross, o = {}) => { const N = o.N || 2000, Y = 40, U = new Float32Array(N * Y).fill(NaN); for (let j = 0; j < N; j++) for (let y = 0; y < 10; y++) U[j * Y + y] = j < cross ? 0.8 : j < reach ? 0.65 : 0.3; return { id: 'S130', arm: 'SNAP', stamp: o.st || st, N, Y, u: U, pen: new Float32Array(N * Y), non: new Float32Array(N * Y) }; };
    cases.push(['a trace whose reach and cross are its dp line\'s is accepted', String(checkTrace(mk(300, 200), u, st).length), '0']);
    cases.push(['a trace one reaching path short is refused', String(checkTrace(mk(299, 200), u, st).length > 0), 'true']);
    cases.push(['a trace with another stamp is refused', String(checkTrace(mk(300, 200, { st: { ...st, audit: 'zzz' } }), u, st).length > 0), 'true']);
    cases.push(['a trace on 1,999 paths is refused', String(checkTrace(mk(300, 200, { N: 1999 }), u, st).length > 0), 'true']);
    cases.push(['a missing trace is refused', String(checkTrace(null, u, st).length > 0), 'true']); EDGES2.push('a trace one reaching path short'); }
  const rd = o => reading(parse(builtLog(o)), () => {});
  { const r = rd({}); cases.push(['the reading gives S130 dwell 10 to 3 and S128 SNAP-HOLD (dwell 10 to 5, pension share 0.6 near the cliff)', `${r.s130.join(' ')} ${r.cls}`, '10 3 SNAP-HOLD']); }
  cases.push(['S128 RUN-DOWN (dwell 10 to 9.5, plateau pension share 0.02)', rd({ s128: 'rundown' }).cls, 'RUN-DOWN']);
  cases.push(['S128 MIXED (dwell 10 to 8: a fall of 0.2, between the bounds)', rd({ s128: 'mixed' }).cls, 'MIXED']);
  // the edges: a fall of exactly a quarter, exactly 10%, and a plateau share at exactly 0.05
  const mk = (sd, pd, nps, plsS, plsP) => ({ dp: { dwell: sd }, dist: { bins: { d0: { n: 10, ps: nps }, d05: { n: 0, ps: NaN }, d1: { n: 0 }, d2: { n: 0 }, d4: { n: 0 }, nopace: { n: 0 } } }, plateau: { paths: 5, pshare: plsS } , _p: { dp: { dwell: pd }, plateau: { paths: 5, pshare: plsP } } });
  const cl = (...a) => { const x = mk(...a); return classS128(x, x._p); };
  cases.push(['edge: a fall of exactly 0.25 with a near-cliff pension share of exactly 0.25 is SNAP-HOLD', cl(8, 6, 0.25, 0.5, 0.5), 'SNAP-HOLD']);
  cases.push(['edge: a fall of exactly 0.1 with plateau shares of exactly 0.05 is RUN-DOWN', cl(10, 9, 0.5, 0.05, 0.05), 'RUN-DOWN']);
  cases.push(['edge: a zero SNAP dwell is MIXED, not a class', cl(0, 0, 0.5, 0.01, 0.01), 'MIXED']);
  cases.push(['edge: no plateau paths cannot be RUN-DOWN', (() => { const x = mk(10, 10, 0.1, NaN, NaN); x.plateau.paths = 0; x._p.plateau.paths = 0; return classS128(x, x._p); })(), 'MIXED']);
  { const r = rd({}); cases.push(['the panel totals: near 0.6 of path-years in every arm (90 of 150 a unit)', ['SNAP', 'PCLSI', 'SHIFT'].map(a => f4(r.tot[a].near)).join(' '), '0.6000 0.6000 0.6000']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export { builtLog, logsOf };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: a fall of exactly 0.25, a fall of exactly 0.1 with plateau shares of exactly 0.05, a zero SNAP dwell, no plateau paths, an empty bin with a share, a plateau at its cliff, ${EDGES2.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagdpc'), npw = Number(args[1] || NPW), pts = args[2] || PTS, DPDIR = args[3] || join(HERE, 'results', 'diagdp');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse), want = PANEL.length * Object.keys(ARMS).length;
  if (units.filter(u => u.done).length < want) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${want} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  // checklist 3: DP's files re-used for the identity, so held to DP's own stamps and DP's own parse first
  const dpLogs = logsOf(DPDIR);
  if (Object.keys(dpLogs).length !== PANEL.length) { console.log(`DP RECORDS: ${Object.keys(dpLogs).length} logs in ${DPDIR}, not ${PANEL.length}`); process.exit(1); }
  requireFairLogs(dpLogs, PRED_DP);
  if (PANEL.some(id => !Object.values(dpLogs).flatMap(parseDp).some(u => u.id === id && u.done))) { console.log('DP RECORDS: a household not done in DP\'s logs'); process.exit(1); }
  const bad = gate(units, { pts, npw, dp: dpRecords(Object.values(dpLogs)) });
  if (!bad.length) bad.push(...loadTraces(units, DIR, stampOf(Object.values(logs)[0])));
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${PANEL.length} households in ${Object.keys(ARMS).length} arms, each once and done, the arm's axis and the shipping default's settings on every ran line, the counts consistent; SNAP equal to DP's ran, access, dp and dwell lines on every household (DP's logs under DP's stamp gate); every SNAP trace present, stamped and holding its dp line's reach and cross`);
  reading(units);
}
