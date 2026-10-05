/*
 * EDGE-SPLIT'S REDUCER (PLAN.md O101; audit-edge.mjs; predictions/diag-edge.md). A TEST on HYB's unit (ADOPT-PI's: no reader,
 * the product's settings, lambda held, the estate weight 0.02, 30 points, seed 7005, death tax 0), every arm of a household on
 * the same paths: which of the snapped read's two edges (0.25 and 0.75) carries PCLSI's gain over HYB on PCLSI's tables, and
 * SNAP's loss on SNAP's tables.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/diag-edge.md); every unit once and done (3 households
 *   x 7 arms); each ran line HYB's settings (no reader, 30 points, seed 7005, 6,000 paths, the estate weight 0.02, the switch
 *   margin 0.001, buckets 0,0.5,1) with its arm's tables, read and segment, tie margin 0 and death tax 0; a household's units
 *   on one access line and one pathsum; every per-path file present, stamped as the logs and holding its sum line; and THE
 *   IDENTITY: the SNAP and PCLSI arms equal HYB's per-path files path for path (survived, lifetime tax, terminal net), HYB's
 *   files first passing their own gate (reduce-hyb.mjs, with its stamp check: rule 3) - so HYB's own HYB arm (PCLSI's tables,
 *   the snap throughout) joins the reading on the same paths. Anything else differing between the arms is not settled.
 * THE READING (registered in predictions/diag-edge.md):
 *   ITEM 1 (primary; PCLSI's tables): per path y = P-LO - P-HI in survival (0/1): above 0, the low edge's interpolation does
 *     more for survival than the high edge's; Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000) of mean(y)
 *     above 0 and below, Holm over the 4 (S130 and S128 x 2); per household LO, HI or SPLIT. HELD when S130 reads LO;
 *     FALSIFIED when S130 reads HI; else INCONCLUSIVE. S128 a scored leg; S370 reported (raw p).
 *   ITEM 2 (SNAP's tables): per path y = S-HI - S-LO, the same test and Holm over its own 4; HI, LO or SPLIT. HELD when S130
 *     reads HI; FALSIFIED when S130 reads LO; else INCONCLUSIVE. S128 a scored leg; S370 reported.
 *   THE SHARE RULE (registered; the plan-auditor's BLOCKINGs of 5 Oct 12:22 and 12:29 UK: a direction alone cannot separate
 *     EDGE from WITHIN): on S130 only, the low edge's share of PCLSI's gain over HYB, (P-LO - HYB) / (PCLSI - HYB) in paths,
 *     at 0.7 or more with item 1 HELD settles O101-EDGE held (grade B), else UNSEPARATED; the high edge's share of the
 *     interpolated read's gain on SNAP's tables, (S-HI - SNAP) / (S-INT - SNAP), at 0.7 or more with item 2 HELD settles O83's
 *     survival cost (grade B), else UNSEPARATED; NOT APPLICABLE when its item is not HELD, or when the gain it shares is not
 *     shown on S130 (the plan-auditor's BLOCKING 1 of 5 Oct 12:46 UK): PCLSI over HYB (item 1) or S-INT over SNAP (item 2)
 *     above 0 by the same paired randomization test, one-sided, at 0.05 - so a negative or null gain never reads SETTLED.
 *   SECONDARY (declared, decides nothing): S-INT against PCLSI (the tables' own part, O101's third cause) and against SNAP;
 *     every pair's survival, tax and net change; the shares on S128 and S370.
 *   REPORTED: flat years with the pension live by the used share's band per arm (derive-hyb-edges.mjs flatYears).
 *   node research/solver/reduce-edge.mjs [dir] [paths] [points] > research/solver/results-edge.txt
 *   node research/solver/reduce-edge.mjs --planted   the planted checks alone, the outcomes they reach and the EDGES
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { paired, decode, stampOf, logsOf } from './reduce-adoptpi.mjs';
import { parse as parseH, gate as gateH, loadTraces as loadH, PRED as PREDH } from './reduce-hyb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-edge.md';
export const PTS = '30', SEED = '7005', NPW = 6000, W = '0.02', B = 20000, ALPHA = 0.05;
// audit-edge.mjs PANEL, ARMS and ARM, copied (its module runs its jobs on import)
export const PANEL = ['S130', 'S128', 'S370'], DECIDE = ['S130', 'S128'], ARMS = ['SNAP', 'S-LO', 'S-HI', 'S-INT', 'PCLSI', 'P-LO', 'P-HI'];
export const ARM = { SNAP: { tables: 'SNAP', read: 'false', seg: 'none' }, 'S-LO': { tables: 'SNAP', read: 'true', seg: 'lo' }, 'S-HI': { tables: 'SNAP', read: 'true', seg: 'hi' }, 'S-INT': { tables: 'SNAP', read: 'true', seg: 'none' },
  PCLSI: { tables: 'PCLSI', read: 'true', seg: 'none' }, 'P-LO': { tables: 'PCLSI', read: 'true', seg: 'lo' }, 'P-HI': { tables: 'PCLSI', read: 'true', seg: 'hi' } };
export const keyOf = u => `${u.id} ${u.arm}`;
export const UNIT_KEYS = PANEL.flatMap(id => ARMS.map(a => `${id} ${a}`));
const BASE = `OFF/PRODUCT/W${W}`, labelOf = a => `${BASE}/${a}`;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`), LBL = `(${esc(BASE)}\\/(?:${ARMS.map(esc).join('|')}))`;
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
    const A = ARM[u.arm], want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', mix: '3', tables: A.tables, read: A.read, seg: A.seg, deathTax: '0' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (num(u.ran, 'tieMargin') !== 0) bad.push(`${tag}: ran tieMargin ${field(u.ran, 'tieMargin')}, not 0`);
    if (!(num(u.access, 'open') > 0)) bad.push(`${tag}: access line without the opening balances`);
    const s = u.sum;
    if (s.paths !== npw || !(Number.isInteger(s.survived) && s.survived >= 0 && s.survived <= s.paths) || !Number.isFinite(s.tax) || !Number.isFinite(s.net) || !s.pathsum) bad.push(`${tag}: sum paths ${s.paths} survived ${s.survived} tax ${s.tax} net ${s.net} pathsum ${s.pathsum}`);
    if (u.trace.bad || u.trace.paths !== npw) bad.push(`${tag}: trace line ${u.trace.bad || `paths ${u.trace.paths}`}`);
  }
  for (const id of PANEL) {
    const us = units.filter(u => u.id === id && u.sum && u.access);
    if (new Set(us.map(u => u.access)).size > 1) bad.push(`${id}: its units' access lines differ`);
    if (new Set(us.map(u => u.sum.pathsum)).size > 1) bad.push(`${id}: its units ran different paths (pathsum ${[...new Set(us.map(u => u.sum.pathsum))].join(', ')})`);
  }
  return bad;
}

export function checkTrace(t, u, st) {
  const tag = `${keyOf(u)} file`, years = Number((/ years (\d+) /.exec(u.access) || [])[1]) + 1;
  if (!t) return [`${tag}: missing`];
  const bad = [], A = ARM[u.arm];
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.id !== u.id || t.arm !== u.arm || t.N !== u.sum.paths || t.Y !== years || t.tables !== A.tables || String(t.read) !== A.read || String(t.seg ?? 'none') !== A.seg) bad.push(`${tag}: id ${t.id} arm ${t.arm} tables ${t.tables} read ${t.read} seg ${t.seg} paths ${t.N} years ${t.Y}, not the unit's`);
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
    const raw = u.trace && u.trace.file ? read(join(dir, u.trace.file)) : null, t = raw ? { ...decode(raw), raw } : null;
    bad.push(...checkTrace(t, u, st));
    files[keyOf(u)] = t;
  }
  return { bad, files };
}
/* THE IDENTITY: the SNAP and PCLSI arms against HYB's files (`hyb`: key -> decoded file), path for path */
export function identity(files, hyb) {
  const bad = [];
  for (const id of PANEL) for (const a of ['SNAP', 'PCLSI']) {
    const t = files[`${id} ${a}`], o = hyb[`${id} ${a}`];
    if (!t || !o) { bad.push(`identity ${id} ${a}: ${!t ? 'this run\'s' : 'HYB\'s'} file missing`); continue; }
    if (t.N !== o.N) { bad.push(`identity ${id} ${a}: ${t.N} paths here, ${o.N} in HYB's`); continue; }
    let n = 0; for (let j = 0; j < t.N; j++) if (t.survived[j] !== o.survived[j] || t.tax[j] !== o.tax[j] || t.net[j] !== o.net[j]) n++;
    if (n) bad.push(`identity ${id} ${a}: ${n} of ${t.N} paths differ from HYB's (survived, tax or net)`);
  }
  return bad;
}

const mean = xs => xs.reduce((t, x) => t + x, 0) / xs.length;
const diff = (X, Z) => { let s = 0; for (let j = 0; j < X.N; j++) s += X.survived[j] - Z.survived[j]; return s; };
/* one item: per path y = A - B in survival over the deciding households, Holm over their 2 x 2; S370 reported at raw p */
function splitItem(files, a, b, up, dn, { b: nb = B } = {}) {
  const ys = PANEL.map(id => { const X = files[`${id} ${a}`], Z = files[`${id} ${b}`]; return Array.from({ length: X.N }, (_, j) => X.survived[j] - Z.survived[j]); });
  const p = ys.map((y, i) => [flipP(y, nb, 7002 + 2 * i), flipP(y.map(x => -x), nb, 7003 + 2 * i)]);
  const h = holm(DECIDE.flatMap(id => p[PANEL.indexOf(id)]));
  const rows = PANEL.map((id, i) => {
    const P2 = paired(files[`${id} ${b}`], files[`${id} ${a}`]), d = DECIDE.indexOf(id), hU = d >= 0 ? h[2 * d] : NaN, hD = d >= 0 ? h[2 * d + 1] : NaN;
    const read = d < 0 ? 'REPORTED' : hU < ALPHA ? up : hD < ALPHA ? dn : 'SPLIT';
    return { id, b: P2.b, c: P2.c, N: P2.N, my: mean(ys[i]), pU: p[i][0], pD: p[i][1], hU, hD, read };
  });
  const s = rows.find(r => r.id === 'S130').read, v = s === up ? 'HELD' : s === dn ? 'FALSIFIED' : 'INCONCLUSIVE';
  const legs = rows.filter(r => r.id !== 'S130' && DECIDE.includes(r.id)).map(r => ({ id: r.id, v: r.read === up ? 'HELD' : r.read === dn ? 'FALSIFIED' : 'INCONCLUSIVE' }));
  return { rows, v, legs };
}
export function items(files, opts = {}) {
  return { one: splitItem(files, 'P-LO', 'P-HI', 'LO', 'HI', opts), two: splitItem(files, 'S-HI', 'S-LO', 'HI', 'LO', opts) };
}
export const share = (num, den) => (den ? num / den : NaN);
export const SHARE_BAR = 0.7;
/* the share rule on S130: each share, and SETTLED / UNSEPARATED / NOT APPLICABLE by its item's outcome */
export function shareRule(files, r, { b: nb = B } = {}) {
  const F = k => files[`S130 ${k}`];
  const lo = share(diff(F('P-LO'), F('HYB')), diff(F('PCLSI'), F('HYB'))), hi = share(diff(F('S-HI'), F('SNAP')), diff(F('S-INT'), F('SNAP')));
  // the gain each share divides is shown first: the paired one-sided test of its arm over the snapped parent at 0.05
  const shown = (X, Z, seed) => flipP(Array.from({ length: X.N }, (_, j) => X.survived[j] - Z.survived[j]), nb, seed) < ALPHA;
  const gLo = shown(F('PCLSI'), F('HYB'), 7101), gHi = shown(F('S-INT'), F('SNAP'), 7102);
  const rule = (v, g, s) => (v !== 'HELD' || !g ? 'NOT APPLICABLE' : s >= SHARE_BAR ? 'SETTLED' : 'UNSEPARATED');
  return { lo, hi, gLo, gHi, edge: rule(r.one.v, gLo, lo), o83: rule(r.two.v, gHi, hi) };
}

/* flat years with the pension live by the used share's band (derive-hyb-edges.mjs flatYears, copied: it runs on import) */
const buf = s => { const x = Buffer.from(s, 'base64'); return x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength); };
const BANDS = [['[0.15, 0.25)', 0.15, 0.25], ['[0.25, 0.6)', 0.25, 0.6], ['[0.6, 0.75)', 0.6, 0.75]];
export function flatYears(T) {
  const pen = T.raw && typeof T.raw.pen === 'string' ? new Float32Array(buf(T.raw.pen)) : T.pen;
  if (!pen) return null;
  const n = BANDS.map(() => 0);
  for (let j = 0; j < T.N; j++) for (let k = 0; k + 1 < T.Y; k++) {
    const o = j * T.Y + k, x = T.u[o];
    if (!(pen[o] > 1e4) || !(T.u[o + 1] - x < 0.01)) continue;
    BANDS.forEach(([, lo, hi], b) => { if (x >= lo && x < hi) n[b]++; });
  }
  return n.map(v => v / T.N);
}

const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), pv = x => (Number.isFinite(x) ? x.toExponential(2) : '-');
export function reading(files, out = console.log, opts = {}) {
  const r = items(files, opts), nb = opts.b || B;
  out(`EDGE-SPLIT: HYB's unit (no reader, the product's settings, lambda held, the estate weight ${W}, ${PTS} points), seed ${SEED}, death tax 0, every arm of a household on the same paths; ${ARMS.join(', ')} and HYB's own HYB arm (by the identity) on ${PANEL.join(', ')}.`);
  for (const [nm, it, a, b, up, dn, what] of [['ITEM 1 (primary; PCLSI\'s tables)', r.one, 'P-LO', 'P-HI', 'LO', 'HI', 'the low edge interpolated against the high'], ['ITEM 2 (SNAP\'s tables)', r.two, 'S-HI', 'S-LO', 'HI', 'LO', 'the high edge interpolated against the low']]) {
    out(`\n${nm}: y = ${a} - ${b} a path in survival (${what}); the randomization test (B ${nb}) of mean(y) above 0 (${up}) and below (${dn}), Holm over ${2 * DECIDE.length} (${DECIDE.join(', ')}); ${PANEL.filter(x => !DECIDE.includes(x)).join(', ')} reported at raw p`);
    for (const x of it.rows) out(`  ${x.id.padEnd(8)} ${a} over ${b}: b ${x.b} c ${x.c} change ${f3(100 * (x.c - x.b) / x.N)} | mean y ${(1e4 * x.my).toFixed(1)}e-4, p ${pv(x.pU)} / ${pv(x.pD)}, Holm ${pv(x.hU)} / ${pv(x.hD)} | ${x.read}`);
    out(`  -> ${it.v} (HELD when S130 reads ${up}; FALSIFIED when S130 reads ${dn}; else INCONCLUSIVE)`);
  }
  const S = shareRule(files, r, opts);
  out(`\nTHE SHARE RULE (registered; S130 only; the bar ${SHARE_BAR}): the low edge's share of PCLSI over HYB ${f3(S.lo)} (the gain ${S.gLo ? 'shown' : 'NOT shown'}) -> O101-EDGE ${S.edge}; the high edge's share of S-INT over SNAP ${f3(S.hi)} (the gain ${S.gHi ? 'shown' : 'NOT shown'}) -> O83's survival cost ${S.o83}`);
  out('\nSECONDARY (declared; decides nothing): the edges\' shares on every household, the tables\' own part, every pair\'s change a path (survival in points, tax and net, se over paths)');
  for (const id of PANEL) {
    const F = k => files[`${id} ${k}`], H = files[`${id} HYB`];
    out(`  ${id.padEnd(8)} the low edge's share of PCLSI over HYB ${f3(share(diff(F('P-LO'), H), diff(F('PCLSI'), H)))} (P-LO over HYB ${diff(F('P-LO'), H)}, P-HI over HYB ${diff(F('P-HI'), H)}, PCLSI over HYB ${diff(F('PCLSI'), H)} paths); the high edge's share of S-INT over SNAP ${f3(share(diff(F('S-HI'), F('SNAP')), diff(F('S-INT'), F('SNAP'))))} (S-HI ${diff(F('S-HI'), F('SNAP'))}, S-LO ${diff(F('S-LO'), F('SNAP'))}, S-INT ${diff(F('S-INT'), F('SNAP'))} paths over SNAP)`);
    for (const [a, c] of [['PCLSI', 'S-INT'], ['SNAP', 'S-INT'], ['HYB', 'P-LO'], ['HYB', 'P-HI'], ['SNAP', 'S-HI'], ['SNAP', 'S-LO']]) { const p = paired(a === 'HYB' ? H : F(a), F(c)); out(`  ${id.padEnd(8)} ${c} less ${a}`.padEnd(30) + `survival ${f3(100 * (p.c - p.b) / p.N).padStart(7)}  tax ${f2(p.tax.m).padStart(11)} (${f2(p.tax.se)})  net ${f2(p.net.m).padStart(12)} (${f2(p.net.se)})`); }
  }
  out('\nREPORTED: flat years with the pension live (pension over 10,000, the used share growing under 0.01), a path\'s mean, by the used share\'s band: [0.15, 0.25) / [0.25, 0.6) / [0.6, 0.75)');
  for (const id of PANEL) for (const a of [...ARMS, 'HYB']) { const fy = flatYears(a === 'HYB' ? files[`${id} HYB`] : files[`${id} ${a}`]); out(`  ${`${id} ${a}`.padEnd(14)} ${fy ? fy.map(f2).join(' / ') : 'no pension trace'}`); }
  out(`\nOUTCOME: 1 ${r.one.v}; 2 ${r.two.v}`);
  out(`SHARES: O101-EDGE ${S.edge}; O83 ${S.o83}`);
  out(`LEGS: ${[['1', r.one], ['2', r.two]].flatMap(([k, it]) => it.legs.map(l => `item ${k} ${l.id} ${l.v}`)).join('; ')}`);
  return { ...r, shares: S };
}

/* ---- planted checks: built logs and files, faults planted in them ---- */
const ST = { code: 'abc', audit: 'def', prediction: 'none', sha: '-' };
const NB = 2000, YB = 40, splitK = k => { const arm = k.slice(k.lastIndexOf(' ') + 1); return { id: k.slice(0, k.length - arm.length - 1), arm }; };
const fileName = (id, arm) => `${id}-${arm.toLowerCase()}.json.gz`;
/* a built file: every arm survives paths 0-1799 and, on paths 1800-1999, the first o.save[id][arm] of them - or, given a
   negative count, loses that many of paths 0-1799 (default:
   PCLSI and S-INT 200, P-LO, S-HI 150, P-HI, S-LO 50, SNAP and HYB 0); tax 100 and net 1000 a path; used shares 0.3 */
const SAVE = { SNAP: 0, HYB: 0, PCLSI: 200, 'P-LO': 150, 'P-HI': 50, 'S-INT': 200, 'S-HI': 150, 'S-LO': 50 };
function builtFile(id, arm, o = {}) {
  const N = NB, sv = new Uint8Array(N), tax = new Float32Array(N).fill(100), net = new Float32Array(N).fill(1000), u = new Float32Array(N * YB).fill(0.3);
  const k = ((o.save || {})[id] || {})[arm] ?? SAVE[arm];
  for (let j = 0; j < N; j++) sv[j] = j < 1800 + k ? 1 : 0;   // k below 0: the arm loses paths every other arm saves
  if (o.idOff && id === 'S128' && arm === 'PCLSI' && o.hybSide) tax[7] += 1;
  const A = ARM[arm] || { tables: 'PCLSI', read: 'false', seg: 'none' };
  return { id, arm, dt: false, read: A.read === 'true', seg: A.seg === 'none' ? null : A.seg, tables: A.tables, stamp: o.stOff && id === 'S128' && arm === 'P-HI' ? { ...ST, audit: 'zzz' } : ST, N, Y: YB, survived: sv, tax, net, u };
}
const builtFiles = (o = {}) => Object.fromEntries([...UNIT_KEYS, ...PANEL.map(id => `${id} HYB`)].map(k => { const { id, arm } = splitK(k); return [k, builtFile(id, arm, o)]; }));
function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const k of UNIT_KEYS) {
    if (o.skip === k) continue;
    const { id, arm } = splitK(k), L = labelOf(arm), A = ARM[arm];
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed ${SEED} paths ${NB} grid total30x6x6 lambda 0.0223606797749979 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 tables ${o.tablesOff && k === 'S130 P-LO' ? 'SNAP' : A.tables} read ${A.read} seg ${o.segOff && k === 'S128 S-HI' ? 'lo' : A.seg} tieMargin ${o.tieOff && k === 'S128 PCLSI' ? 0.000001 : 0} deathTax ${o.dtOff && k === 'S130 SNAP' ? '0.4' : '0'}`);
    lines.push(`${''.padEnd(16)} access ${L}: year 2 years ${YB - 1} lsa 268275 open 950000`);
    const f = builtFile(id, arm, o);
    let s = 0, tx = 0, nt = 0; for (let j = 0; j < f.N; j++) { s += f.survived[j]; tx += f.tax[j]; nt += f.net[j]; }
    lines.push(`${''.padEnd(16)} sum ${L}: paths ${NB} survived ${o.sumOff && k === 'S130 S-LO' ? s + 1 : s} tax ${(tx / f.N).toFixed(2)} net ${(nt / f.N).toFixed(2)} pathsum ${o.pathsOff && k === 'S370 P-HI' ? 12345 : 999} secs 10`);
    lines.push(`${''.padEnd(16)} trace ${L}: file ${fileName(id, arm)} paths ${NB} years ${YB}`);
    if (!(o.notDone && k === 'S130 S-INT')) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  return lines.join('\n') + '\n';
}
function builtRead(o) { const fs = builtFiles(o); return f => { const k = UNIT_KEYS.find(x => { const { id, arm } = splitK(x); return f.endsWith(fileName(id, arm)); }); return o.missing && k === 'S130 P-LO' ? null : fs[k] || null; }; }
const builtHyb = o => Object.fromEntries(PANEL.flatMap(id => ['SNAP', 'PCLSI', 'HYB'].map(a => [`${id} ${a}`, builtFile(id, a, { ...o, hybSide: true })])));
const EDGES = [], REACHED = { 1: new Set(), 2: new Set() };
function planted() {
  const cases = [], PB = 2000;
  const G = o => { const us = parse(builtLog(o)); const g = gate(us, { npw: NB }); if (g.length) return g; const tr = loadTraces(us, '/x', ST, builtRead(o)); return tr.bad.length ? tr.bad : identity(tr.files, builtHyb(o)); };
  cases.push(['a built set gates clean, the identity included', String(G({}).length), '0']);
  { const g = gate(parse(builtLog({ skip: 'S128 P-HI' })), { npw: NB }); cases.push(['the gate alone names a missing unit', String(g.some(x => /^S128 P-HI: 0 unit lines, not 1$/.test(x))), 'true']); }
  for (const [nm, o] of [['a unit not done', { notDone: true }], ['P-LO on SNAP\'s tables', { tablesOff: true }], ['S-HI read on the low segment', { segOff: true }], ['a unit at a tie margin', { tieOff: true }],
    ['a unit at a death tax of 0.4', { dtOff: true }], ['a household\'s units on different paths', { pathsOff: true }], ['a sum line off its file', { sumOff: true }],
    ['a file with another stamp', { stOff: true }], ['a missing file', { missing: true }], ['an arm off HYB\'s file on one path (the identity)', { idOff: true }]]) cases.push([`the gate refuses ${nm}`, String(G(o).length > 0), 'true']);
  const R = o => { const fs = builtFiles(o), hy = builtHyb(o); for (const id of PANEL) fs[`${id} HYB`] = hy[`${id} HYB`]; const r = items(fs, { b: PB }); REACHED[1].add(r.one.v); REACHED[2].add(r.two.v); return r; };
  { const r = R({}); cases.push(['P-LO saving 150 against P-HI\'s 50 reads LO (item 1 HELD); S-HI 150 against S-LO 50 reads HI (item 2 HELD)', `${r.one.rows[0].read} ${r.one.v} ${r.two.rows[0].read} ${r.two.v}`, 'LO HELD HI HELD']); }
  { const r = R({ save: { S130: { 'P-LO': 50, 'P-HI': 150, 'S-HI': 50, 'S-LO': 150 } } }); cases.push(['reversed on S130: HI (item 1 FALSIFIED), LO (item 2 FALSIFIED)', `${r.one.rows[0].read} ${r.one.v} ${r.two.rows[0].read} ${r.two.v}`, 'HI FALSIFIED LO FALSIFIED']); }
  { const r = R({ save: { S130: { 'P-LO': 100, 'P-HI': 100 } } }); cases.push(['the two edges equal on S130 (mean y 0) read SPLIT, item 1 INCONCLUSIVE', `${r.one.rows[0].read} ${r.one.v}`, 'SPLIT INCONCLUSIVE']); } EDGES.push('the two edges equal (mean y 0)');
  { const r = R({ save: { S130: { 'P-LO': 103, 'P-HI': 100 } } }); cases.push(['P-LO 3 paths over P-HI on S130 (raw p 1/8): Holm p above 0.05, SPLIT', `${r.one.rows[0].hU > 0.05} ${r.one.rows[0].read} ${r.one.v}`, 'true SPLIT INCONCLUSIVE']); } EDGES.push('a LO side short of 0.05 after Holm');
  { const r = R({ save: { S130: { 'P-LO': 105, 'P-HI': 100 } } }); cases.push(['P-LO 5 paths over P-HI on S130: raw p 1/32 under 0.05, Holm over 4 above it - SPLIT (the Holm step pinned)', `${r.one.rows[0].pU < 0.05} ${r.one.rows[0].hU > 0.05} ${r.one.rows[0].read}`, 'true true SPLIT']); } EDGES.push('a raw p under 0.05 that Holm lifts above it');
  { const r = R({ save: { S130: { 'P-LO': 0, 'P-HI': 0, PCLSI: 0 } } }); cases.push(['no discordant path between the split arms on S130 reads SPLIT, the share undefined', `${r.one.rows[0].read} ${r.one.v} ${share(0, 0)}`, 'SPLIT INCONCLUSIVE NaN']); } EDGES.push('no discordant path on the deciding household');
  { const r = R({ save: { S130: { 'S-HI': 100, 'S-LO': 100 } } }); cases.push(['the two edges equal on SNAP\'s tables on S130 read SPLIT, item 2 INCONCLUSIVE', `${r.two.rows[0].read} ${r.two.v}`, 'SPLIT INCONCLUSIVE']); }
  { const r = R({ save: { S128: { 'P-LO': 50, 'P-HI': 150 } } }); cases.push(['S128 reversed alone leaves item 1 HELD and scores its leg FALSIFIED', `${r.one.v} ${JSON.stringify(r.one.legs)}`, 'HELD [{"id":"S128","v":"FALSIFIED"}]']); }
  { const r = R({ save: { S370: { 'P-LO': 50, 'P-HI': 150 } } }); cases.push(['S370 reversed is reported only: no leg, item 1 HELD', `${r.one.v} ${r.one.rows[2].read} ${r.one.legs.length}`, 'HELD REPORTED 1']); } EDGES.push('a reported household reading the other way');
  const SR = o => { const fs = builtFiles(o), hy = builtHyb(o); for (const id of PANEL) fs[`${id} HYB`] = hy[`${id} HYB`]; return shareRule(fs, items(fs, { b: PB }), { b: PB }); };
  { const s = SR({}); cases.push(['the share rule: P-LO 150 of PCLSI 200 over HYB (0.75) and S-HI 150 of S-INT 200 (0.75) settle both', `${s.lo} ${s.edge} ${s.hi} ${s.o83}`, '0.75 SETTLED 0.75 SETTLED']); }
  { const s = SR({ save: { S130: { 'P-LO': 140, 'S-HI': 140 } } }); cases.push(['EDGE: a share of exactly 0.7 settles', `${s.lo} ${s.edge} ${s.o83}`, '0.7 SETTLED SETTLED']); } EDGES.push('a share exactly at the bar');
  { const s = SR({ save: { S130: { 'P-LO': 120, 'S-HI': 120 } } }); cases.push(['a share of 0.6 with the item HELD leaves EDGE and WITHIN unseparated', `${s.edge} ${s.o83}`, 'UNSEPARATED UNSEPARATED']); }
  { const s = SR({ save: { S130: { 'P-LO': 100, 'P-HI': 100, 'S-HI': 100, 'S-LO': 100 } } }); cases.push(['an item not HELD makes its share rule not applicable, whatever the share', `${s.edge} ${s.o83}`, 'NOT APPLICABLE NOT APPLICABLE']); }
  { const s = SR({ save: { S130: { 'S-HI': 130, 'S-INT': 150 } } }); cases.push(['the high edge\'s share is over S-INT\'s gain, not PCLSI\'s (130 of 150, not of 200)', `${s.hi.toFixed(3)} ${s.o83}`, '0.867 SETTLED']); }
  { const s = SR({ save: { S130: { 'S-INT': -20, 'S-HI': -15, 'S-LO': -100, SNAP: 0 } } }); cases.push(['planted: S-INT below SNAP (a negative gain) with item 2 HELD reads NOT APPLICABLE, though -15 / -20 is 0.75', `${s.hi} ${s.gHi} ${s.o83}`, '0.75 false NOT APPLICABLE']); } EDGES.push('a negative gain under the share');
  { const s = SR({ save: { S130: { 'P-LO': 50, 'P-HI': -50, PCLSI: 2 } } }); cases.push(['item 1 HELD over a gain not shown (PCLSI 2 over HYB, P-LO 50, P-HI 50 below) reads NOT APPLICABLE, though the share is 25', `${s.lo} ${s.gLo} ${s.edge}`, '25 false NOT APPLICABLE']); }
  { const s = SR({ save: { S130: { 'S-INT': 2, 'S-HI': 2, 'S-LO': 0 } } }); cases.push(['a gain of 2 paths (not shown at 0.05) makes the rule not applicable', `${s.gHi} ${s.o83}`, 'false NOT APPLICABLE']); }
  { const s = SR({ save: { S130: { 'P-LO': 150 }, S128: { 'P-LO': 10 } } }); cases.push(['the rule reads S130 only (S128\'s share does not move it)', s.edge, 'SETTLED']); }
  { const lines = []; const fs = builtFiles({}), hy = builtHyb({}); for (const id of PANEL) fs[`${id} HYB`] = hy[`${id} HYB`]; reading(fs, l => lines.push(l), { b: PB }); cases.push(['the reading runs to its outcome, shares and legs lines', `${lines.some(l => l === '\nOUTCOME: 1 HELD; 2 HELD')} ${lines.some(l => l === 'SHARES: O101-EDGE SETTLED; O83 SETTLED')} ${lines.some(l => /^LEGS: item 1 S128 HELD; item 2 S128 HELD$/.test(l))}`, 'true true true']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
export { builtLog, builtFiles, stampOf };

/* HYB's files for the identity and its HYB arm, through their own gate and stamp check (rule 3) */
export function hybFiles(dir = join(HERE, 'results', 'diaghyb')) {
  const logs = Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')])), units = Object.values(logs).flatMap(parseH);
  requireFairLogs(logs, PREDH);
  const bad = gateH(units);
  if (bad.length) return { bad: bad.map(x => `HYB's files: ${x}`), files: {} };
  const tr = loadH(units, dir, stampOf(Object.values(logs)[0]));
  return { bad: tr.bad.map(x => `HYB's files: ${x}`), files: tr.files };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nOUTCOMES REACHED: item 1: ${[...REACHED[1]].sort().join(', ')}; item 2: ${[...REACHED[2]].sort().join(', ')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagedge'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (units.filter(u => u.done).length < UNIT_KEYS.length) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNIT_KEYS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw });
  const tr = bad.length ? { bad: [], files: {} } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
  bad.push(...tr.bad);
  const noId = process.argv.includes('--no-identity');
  if (!bad.length && !noId) { const hy = hybFiles(); bad.push(...hy.bad); if (!hy.bad.length) { bad.push(...identity(tr.files, hy.files)); for (const id of PANEL) tr.files[`${id} HYB`] = hy.files[`${id} HYB`]; } }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  if (noId) { console.log('GATE: passed at the preflight\'s size - THE IDENTITY NOT RUN (--no-identity: a preflight only; no HYB arm, so no reading)'); process.exit(0); }
  console.log(`GATE: passed - ${UNIT_KEYS.length} units, each once and done, HYB's settings and the arm's tables, read and segment, tie margin 0 and death tax 0 on every ran line; each household's units on one access line and one set of paths; every per-path file present, stamped and holding its sum line; the SNAP and PCLSI arms equal to HYB's per-path files on every path (HYB's files through their own gate), HYB's HYB arm joining the reading\n`);
  reading(tr.files);
}
