/*
 * ADOPT-PI'S REDUCER (PLAN.md ADOPT-PI; audit-adoptpi.mjs; predictions/adopt-pi.md). A TEST: the interpolated allowance axis
 * (PCLSI) against today's snap (SNAP) in the shipping default on DP's panel (25 households) at seed 7005, every path paired
 * (both arms of a household run the same paths), and PR5's death-tax arm (S130, S370 and S128 at a pension death tax of 40%,
 * both axes).
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/adopt-pi.md); every unit once and done (25
 * households x 2 arms, and the 3 death-tax households x 2 arms); each ran line the shipping default's (no reader, 30 points,
 * seed 7005, 6,000 paths, the estate weight 0.02, the switch margin 0.001, buckets 0,0.5,1) with its arm's interpolation and
 * its unit's death tax (0, or 0.4 in DT); a household's units with one access line and one pathsum (the pairing: the same
 * paths); the sum line's survived no more than its paths; every per-path file present, stamped as the logs, its paths and
 * years the unit's, and its survived count, mean tax and mean terminal net equal to the sum line's. Anything else differing
 * between the arms is not settled: the gate refuses.
 * THE READING (registered in predictions/adopt-pi.md):
 *   ITEM 1 (primary, the panel): the paired survival change PCLSI less SNAP per household, b paths lost (SNAP survives,
 *     PCLSI fails) and c saved; stats.mjs outcome() at the household's margin (0.25 points where SNAP survives 95% or
 *     more, else 0.5; stats.mjs marginFor), harm's exact McNemar p Holm-adjusted over the 25: no material harm / harm /
 *     inconclusive, printed for every household; and the pooled floor over the 23 households outside the gain pair (RULES.md
 *     section 8 item 4: a floor over the cases expected unchanged, so item 2's gains cannot pay for their losses): the paired
 *     cells summed over the 23, read by the unconditional interval (stats.mjs pooledSummed; the maintainer's decision of
 *     29 Sep 22:12 UK) against the pooled margin (MARGINS.pooled, 0.1 points), the exact conditional interval printed beside
 *     it, not read. HELD when no household reads harm and the floor's lower end is above minus the margin; FALSIFIED when any
 *     household reads harm or the floor's upper end is below minus the margin; else INCONCLUSIVE.
 *   ITEM 2 (primary, S130 and S370): the gain, the exact one-sided McNemar p of c saved in b + c, Holm over the 2: GAIN when
 *     the adjusted p is under 0.05 with c > b. HELD when both read GAIN; FALSIFIED when either household's point change is
 *     0 or below; else INCONCLUSIVE.
 *   SECONDARY (declared, decides nothing): per household the mean paired change in lifetime tax and in terminal net (each
 *     with its standard error over paths); the death-tax arm's survival, tax and terminal-net changes beside the same
 *     households' at death tax 0, and whether the terminal-net change keeps its sign (PR5).
 *   REPORTED: per arm the paths reaching 0.6 of the allowance, crossing 0.75, and the mean years in [0.6, 0.75) of the
 *     reaching paths (the hold, as DPC saw it, at a second seed).
 *   node research/solver/reduce-adoptpi.mjs [dir] [paths] [points] > research/solver/results-adoptpi.txt
 *   node research/solver/reduce-adoptpi.mjs --planted   the planted checks alone, and the outcomes they reach (OUTCOMES REACHED)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { outcome, mcnemarHarmP, binomUpperHalf, holm, marginFor, survivalChange, pooledSummed, MARGINS } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/adopt-pi.md';
export const PTS = '30', SEED = '7005', NPW = 6000, W = '0.02', DT_RATE = '0.4';
export const PANEL = ['share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S126', 'bridge 4', 'S360', 'S194',
  'S124', 'S128', 'S130', 'S366', 'S370', 'bridge 4+cost', 'S162', 'S172', 'S168'];
export const DT_PANEL = ['S130', 'S370', 'S128'], GAIN_PANEL = ['S130', 'S370'];
export const ARMS = { SNAP: 'false', PCLSI: 'true' };
const BASE = `OFF/PRODUCT/W${W}`, labelOf = (a, dt) => `${BASE}${dt ? '/DT' : ''}/${a}`;
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`), LBL = `(${esc(BASE)}(?:\\/DT)?\\/(?:SNAP|PCLSI))`;
const CASEL = new RegExp(`^(\\S.*?)\\s+case \\| unit ${LBL} \\| lambda (\\S+)$`);
const LINE = new RegExp(`^\\s+(ran|access|sum|trace) ${LBL}: (.*)$`), DONEL = new RegExp(`^\\s+done ${LBL}$`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); };
const split = l => ({ dt: l.includes('/DT/'), arm: l.slice(l.lastIndexOf('/') + 1) });
export const keyOf = u => `${u.id}${u.dt ? ' DT' : ''} ${u.arm}`;

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), ...split(m[2]), label: m[2], lambda: m[3], done: false }; us.push(cur); continue; }
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

export const UNIT_KEYS = [...PANEL.flatMap(id => Object.keys(ARMS).map(a => `${id} ${a}`)), ...DT_PANEL.flatMap(id => Object.keys(ARMS).map(a => `${id} DT ${a}`))];
export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const k of UNIT_KEYS) { const n = units.filter(u => keyOf(u) === k).length; if (n !== 1) bad.push(`${k}: ${n} unit lines, not 1`); }
  for (const u of units) {
    const tag = keyOf(u);
    if (!UNIT_KEYS.includes(tag)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (!u.ran || !u.access || !u.sum || !u.trace) { bad.push(`${tag}: a ran, access, sum or trace line missing`); continue; }
    const want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', pclsInterp: ARMS[u.arm], mix: '3', deathTax: u.dt ? DT_RATE : '0' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    const s = u.sum;
    if (s.paths !== npw || !(Number.isInteger(s.survived) && s.survived >= 0 && s.survived <= s.paths) || !Number.isFinite(s.tax) || !Number.isFinite(s.net) || !s.pathsum) bad.push(`${tag}: sum paths ${s.paths} survived ${s.survived} tax ${s.tax} net ${s.net} pathsum ${s.pathsum}`);
    if (u.trace.bad || u.trace.paths !== npw) bad.push(`${tag}: trace line ${u.trace.bad || `paths ${u.trace.paths}`}`);
  }
  // the pairing: one access line and one pathsum across a household's units
  for (const id of PANEL) {
    const us = units.filter(u => u.id === id && u.sum);
    if (new Set(us.map(u => u.access)).size > 1) bad.push(`${id}: its units' access lines differ`);
    if (new Set(us.map(u => u.sum.pathsum)).size > 1) bad.push(`${id}: its units ran different paths (pathsum ${[...new Set(us.map(u => u.sum.pathsum))].join(', ')})`);
  }
  return bad;
}

// a small decoded Buffer sits inside Node's shared pool: copy its own bytes (reduce-dpc.mjs, the DPC preflight)
const bytes = b => { const x = Buffer.from(b, 'base64'); return x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength); };
export const decode = t => ({ ...t, survived: t.survived instanceof Uint8Array ? t.survived : new Uint8Array(bytes(t.survived)), tax: t.tax instanceof Float32Array ? t.tax : new Float32Array(bytes(t.tax)), net: t.net instanceof Float32Array ? t.net : new Float32Array(bytes(t.net)), u: t.u instanceof Float32Array ? t.u : new Float32Array(bytes(t.u)) });
/* a unit's per-path file against its unit: `t` decoded, `u` the unit, `st` the logs' stamp */
export function checkTrace(t, u, st) {
  const tag = `${keyOf(u)} file`, years = Number((/ years (\d+) /.exec(u.access) || [])[1]) + 1;
  if (!t) return [`${tag}: missing`];
  const bad = [];
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.id !== u.id || t.arm !== u.arm || !!t.dt !== u.dt || t.N !== u.sum.paths || t.Y !== years) bad.push(`${tag}: id ${t.id} arm ${t.arm} dt ${t.dt} paths ${t.N} years ${t.Y}, not the unit's`);
  if (t.survived.length !== t.N || t.tax.length !== t.N || t.net.length !== t.N || t.u.length !== t.N * t.Y) { bad.push(`${tag}: arrays of the wrong length`); return bad; }
  let s = 0, tx = 0, nt = 0;
  for (let j = 0; j < t.N; j++) { s += t.survived[j]; tx += t.tax[j]; nt += t.net[j]; }
  if (s !== u.sum.survived) bad.push(`${tag}: ${s} survivors in the file, ${u.sum.survived} on the sum line`);
  // the sum line prints the means to 2 places from double sums; the file holds float32s: equal to a cent and float32's part
  if (Math.abs(tx / t.N - u.sum.tax) > 0.005 + 1e-6 * Math.abs(u.sum.tax) || Math.abs(nt / t.N - u.sum.net) > 0.005 + 1e-6 * Math.abs(u.sum.net)) bad.push(`${tag}: the file's mean tax ${(tx / t.N).toFixed(2)} or net ${(nt / t.N).toFixed(2)} is not the sum line's ${u.sum.tax} ${u.sum.net}`);
  return bad;
}
export const stampOf = text => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
export function loadTraces(units, dir, st, read = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null)) {
  const bad = [], files = {};
  for (const u of units) {
    const raw = u.trace && u.trace.file ? read(join(dir, u.trace.file)) : null, t = raw ? decode(raw) : null;
    bad.push(...checkTrace(t, u, st));
    files[keyOf(u)] = t;
  }
  return { bad, files };
}

/* the paired change of one household: b lost, c saved; the tax and terminal-net changes per path (mean and se) */
export function paired(A, B) {
  let a = 0, b = 0, c = 0, d = 0, st = 0, st2 = 0, sn = 0, sn2 = 0;
  const N = A.survived.length;
  for (let j = 0; j < N; j++) {
    const x = A.survived[j], y = B.survived[j];
    if (x && y) a++; else if (x) b++; else if (y) c++; else d++;
    const dt = B.tax[j] - A.tax[j], dn = B.net[j] - A.net[j];
    st += dt; st2 += dt * dt; sn += dn; sn2 += dn * dn;
  }
  const mean = (s, s2) => ({ m: s / N, se: N > 1 ? Math.sqrt(Math.max(0, s2 / N - (s / N) ** 2) / (N - 1)) : NaN });
  return { a, b, c, d, N, snap: (a + b) / N, tax: mean(st, st2), net: mean(sn, sn2) };
}
/* ITEM 1 over the households (pairs: id -> paired()), ITEM 2 over GAIN_PANEL */
export function items(pairs) {
  const ids = PANEL.filter(id => pairs[id]);
  const ph = holm(ids.map(id => mcnemarHarmP(pairs[id].b, pairs[id].c)));
  const one = ids.map((id, i) => { const p = pairs[id], margin = marginFor(100 * p.snap); return { id, margin, pHolm: ph[i], ...outcome({ b: p.b, c: p.c, N: p.N, margin, pHolm: ph[i] }) }; });
  const fl = ids.filter(id => !GAIN_PANEL.includes(id)), ps = pooledSummed(fl.map(id => ({ a: pairs[id].a, lost: pairs[id].b, saved: pairs[id].c, d: pairs[id].d })));
  const pool = { b: ps.cells.lost, c: ps.cells.saved, N: ps.N, k: fl.length, margin: MARGINS.pooled, d: ps.d, lo: ps.lo, hi: ps.hi, x: survivalChange(ps.cells.lost, ps.cells.saved, ps.N) };
  const v1 = ids.length !== PANEL.length ? 'NOT READ' : one.some(r => r.outcome === 'harm') || pool.hi < -pool.margin ? 'FALSIFIED' : pool.lo > -pool.margin ? 'HELD' : 'INCONCLUSIVE';
  const pg = holm(GAIN_PANEL.map(id => binomUpperHalf(pairs[id].c, pairs[id].b + pairs[id].c)));
  const two = GAIN_PANEL.map((id, i) => { const p = pairs[id], n = p.b + p.c; return { id, b: p.b, c: p.c, d: 100 * (p.c - p.b) / p.N, p: binomUpperHalf(p.c, n), pHolm: pg[i], gain: p.c > p.b && pg[i] < 0.05 }; });
  const v2 = two.every(r => r.gain) ? 'HELD' : two.some(r => r.c <= r.b) ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { one, pool, v1, two, v2 };
}

/* the hold as DPC saw it: paths reaching 0.6, crossing 0.75, the mean years in [0.6, 0.75) of the reaching paths */
export function hold(t) {
  let reach = 0, cross = 0, yrs = 0;
  for (let j = 0; j < t.N; j++) {
    let r = false, c = false, y = 0;
    for (let k = 0; k < t.Y; k++) { const x = t.u[j * t.Y + k]; if (x !== x) continue; if (x >= 0.6) r = true; if (x >= 0.75) c = true; if (x >= 0.6 && x < 0.75) y++; }
    if (r) { reach++; yrs += y; } if (c) cross++;
  }
  return { reach, cross, dwell: reach ? yrs / reach : NaN };
}

const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), pv = x => (Number.isFinite(x) ? x.toExponential(2) : '-');
export function reading(files, out = console.log) {
  const P = id => paired(files[`${id} SNAP`], files[`${id} PCLSI`]), pairs = Object.fromEntries(PANEL.map(id => [id, P(id)]));
  const r = items(pairs);
  out(`ADOPT-PI: the interpolated allowance axis (PCLSI) against today's snap (SNAP) in the shipping default (no reader, the product's settings, lambda held, the estate weight ${W}, ${PTS} points), DP's panel, ${NPW} paired paths (seed ${SEED}); PR5's death-tax arm (${DT_PANEL.join(', ')}, the pension death tax ${DT_RATE}).`);
  out(`\nITEM 1 (primary): the paired survival change PCLSI less SNAP per household, b lost and c saved; the household's margin (0.25 points at SNAP survival of 95% or more, else 0.5); harm's exact McNemar p, Holm over ${PANEL.length}; no material harm when the exact interval's lower end is above minus the margin, harm when the adjusted p is under 0.05 and the point loss at least the margin, else inconclusive`);
  out('  household        SNAP %   b     c     change   [95% interval]     margin  p Holm     outcome');
  for (const x of r.one) { const p = pairs[x.id]; out(`  ${x.id.padEnd(16)} ${f2(100 * p.snap).padStart(6)}  ${String(p.b).padStart(4)}  ${String(p.c).padStart(4)}  ${f3(x.d).padStart(7)}  [${f3(x.lo)}, ${f3(x.hi)}]`.padEnd(77) + `${x.margin.toFixed(2)}    ${pv(x.pHolm)}  ${x.outcome}`); }
  out(`  the floor (the ${r.pool.k} outside ${GAIN_PANEL.join(' and ')}): b ${r.pool.b} c ${r.pool.c} of ${r.pool.N}: change ${f3(r.pool.d)} points, unconditional [${f3(r.pool.lo)}, ${f3(r.pool.hi)}] against minus ${r.pool.margin} (exact conditional [${f3(r.pool.x.lo)}, ${f3(r.pool.x.hi)}], reported)`);
  out(`  -> ${r.v1} (HELD when no household reads harm and the floor's lower end is above minus ${r.pool.margin}; FALSIFIED when any household reads harm or the floor's upper end is below minus ${r.pool.margin}; else INCONCLUSIVE)`);
  out(`\nITEM 2 (primary): the gain on ${GAIN_PANEL.join(' and ')}, the exact one-sided McNemar p of c saved in b + c, Holm over ${GAIN_PANEL.length}; GAIN when the adjusted p is under 0.05 with c > b`);
  for (const x of r.two) out(`  ${x.id.padEnd(16)} b ${x.b} c ${x.c} change ${f3(x.d)} points | p ${pv(x.p)} Holm ${pv(x.pHolm)} | ${x.gain ? 'GAIN' : 'NOT SHOWN'}`);
  out(`  -> ${r.v2} (HELD when both read GAIN; FALSIFIED when either change is 0 or below; else INCONCLUSIVE)`);
  out('\nSECONDARY (declared; decides nothing): the mean paired change PCLSI less SNAP per path in lifetime tax and in terminal net (se over paths), at death tax 0');
  for (const id of PANEL) { const p = pairs[id]; out(`  ${id.padEnd(16)} tax ${f2(p.tax.m).padStart(10)} (${f2(p.tax.se)})   net ${f2(p.net.m).padStart(11)} (${f2(p.net.se)})`); }
  out(`\nSECONDARY (PR5): the death-tax arm, PCLSI less SNAP at the pension death tax ${DT_RATE}, beside the same household at 0`);
  const sign = x => (x > 0 ? '+' : x < 0 ? '-' : '0');
  for (const id of DT_PANEL) {
    const z = pairs[id], q = paired(files[`${id} DT SNAP`], files[`${id} DT PCLSI`]);
    out(`  ${id.padEnd(16)} survival ${f3(100 * (z.c - z.b) / z.N)} at 0, ${f3(100 * (q.c - q.b) / q.N)} at ${DT_RATE} (b ${q.b} c ${q.c}) | tax ${f2(z.tax.m)} at 0, ${f2(q.tax.m)} at ${DT_RATE} | net ${f2(z.net.m)} (${f2(z.net.se)}) at 0, ${f2(q.net.m)} (${f2(q.net.se)}) at ${DT_RATE} | the net change's sign ${sign(z.net.m)} to ${sign(q.net.m)}${sign(z.net.m) !== sign(q.net.m) ? ' FLIPS' : ''}`);
  }
  out('\nREPORTED: the hold as DPC saw it (paths reaching 0.6 of the allowance, crossing 0.75, the mean years in [0.6, 0.75) of the reaching paths)');
  const tot = { SNAP: [0, 0], PCLSI: [0, 0] };
  for (const id of PANEL) {
    const h = Object.fromEntries(Object.keys(ARMS).map(a => [a, hold(files[`${id} ${a}`])]));
    for (const a of Object.keys(ARMS)) { tot[a][0] += h[a].reach; tot[a][1] += h[a].reach * (Number.isFinite(h[a].dwell) ? h[a].dwell : 0); }
    out(`  ${id.padEnd(16)} SNAP reach ${String(h.SNAP.reach).padStart(4)} cross ${String(h.SNAP.cross).padStart(4)} dwell ${f2(h.SNAP.dwell).padStart(5)} | PCLSI reach ${String(h.PCLSI.reach).padStart(4)} cross ${String(h.PCLSI.cross).padStart(4)} dwell ${f2(h.PCLSI.dwell).padStart(5)}`);
  }
  out(`  panel: mean dwell of the reaching paths SNAP ${f2(tot.SNAP[1] / tot.SNAP[0])}, PCLSI ${f2(tot.PCLSI[1] / tot.PCLSI[0])}`);
  out(`\nOUTCOME: 1 ${r.v1}; 2 ${r.v2}`);
  return r;
}

/* ---- planted checks: a built set of logs and files, and faults planted in it ---- */
const ST = { code: 'abc', audit: 'def', prediction: 'none', sha: '-' };
function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const k of UNIT_KEYS) {
    if (o.skip === k) continue;
    const dt = k.includes(' DT '), arm = k.slice(k.lastIndexOf(' ') + 1), id = k.slice(0, k.length - arm.length - 1).replace(/ DT$/, ''), L = labelOf(arm, dt);
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed ${o.seedOff && id === 'S130' && arm === 'PCLSI' && !dt ? 7002 : SEED} paths 2000 grid total30x6x6 lambda 0.0223606797749979 bequestWeight 0.02 finalIntegral true bridgeRead ${o.reader && id === 'S370' && arm === 'PCLSI' ? 'reader' : 'false'} switchMargin 0.001 pcls 0,0.5,1 pclsInterp ${o.wrongInterp && id === 'S128' && arm === 'SNAP' ? 'true' : ARMS[arm]} deathTax ${dt && !o.dtOff ? '0.4' : '0'}`);
    lines.push(`${''.padEnd(16)} access ${L}: year ${o.accessOff && id === 'S126' && arm === 'PCLSI' ? 3 : 2} years 39 lsa 268275`);
    const f = builtFile(id, arm, dt, o);
    let s = 0, tx = 0, nt = 0; for (let j = 0; j < f.N; j++) { s += f.survived[j]; tx += f.tax[j]; nt += f.net[j]; }
    lines.push(`${''.padEnd(16)} sum ${L}: paths 2000 survived ${o.sumOff && id === 'S194' && arm === 'SNAP' ? s + 1 : s} tax ${(tx / f.N).toFixed(2)} net ${(nt / f.N).toFixed(2)} pathsum ${o.pathsOff && id === 'S370' && arm === 'PCLSI' && !dt ? 12345 : 999} secs 10`);
    lines.push(`${''.padEnd(16)} trace ${L}: file ${id.replace(/[ +]/g, '_')}-${dt ? 'dt-' : ''}${arm.toLowerCase()}.json.gz paths 2000 years 40`);
    if (!(o.notDone && id === 'S168' && arm === 'PCLSI')) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  if (o.extra) { const L = labelOf('SNAP', false); lines.push(`S999             case | unit ${L} | lambda 0.0223606797749979`, `${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed ${SEED} paths 2000 grid total30x6x6 lambda 0.0223606797749979 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 pclsInterp false deathTax 0`, `${''.padEnd(16)} access ${L}: year 2 years 39 lsa 268275`, `${''.padEnd(16)} sum ${L}: paths 2000 survived 1900 tax 100.00 net 1000.00 pathsum 999 secs 10`, `${''.padEnd(16)} trace ${L}: file S999-snap.json.gz paths 2000 years 40`, `${''.padEnd(16)} done ${L}`); }
  return lines.join('\n') + '\n';
}
/* a built per-path file: 2,000 paths, 40 years; survival from a scenario (o.scen: id -> [b, c] lost and saved under PCLSI,
   with 1,900 survivors under SNAP); tax 100 a path, net 1000 a path, PCLSI's net 1 higher; used shares under 0.6 */
function builtFile(id, arm, dt, o = {}) {
  const N = 2000, Y = 40, sv = new Uint8Array(N), tax = new Float32Array(N).fill(100), net = new Float32Array(N).fill(arm === 'PCLSI' ? (dt && o.flip ? 999 : 1001) : 1000), u = new Float32Array(N * Y).fill(0.3);
  const [b, c] = (o.scen || {})[id] || [0, 0];
  for (let j = 0; j < N; j++) sv[j] = j < 1900 ? 1 : 0;
  if (arm === 'PCLSI') { for (let j = 0; j < b; j++) sv[j] = 0; for (let j = 0; j < c; j++) sv[1900 + j] = 1; }
  return { id, arm, dt, stamp: o.stOff && id === 'S162' && arm === 'PCLSI' ? { ...ST, audit: 'zzz' } : ST, N, Y, survived: sv, tax, net, u };
}
const builtFiles = (o = {}) => Object.fromEntries(UNIT_KEYS.map(k => { const dt = k.includes(' DT '), arm = k.slice(k.lastIndexOf(' ') + 1), id = k.slice(0, k.length - arm.length - 1).replace(/ DT$/, ''); return [k, builtFile(id, arm, dt, o)]; }));
function builtRead(o) { const fs = builtFiles(o); return f => { const k = UNIT_KEYS.find(x => { const dt = x.includes(' DT '), arm = x.slice(x.lastIndexOf(' ') + 1), id = x.slice(0, x.length - arm.length - 1).replace(/ DT$/, ''); return f.endsWith(`${id.replace(/[ +]/g, '_')}-${dt ? 'dt-' : ''}${arm.toLowerCase()}.json.gz`); }); if (f.endsWith('S999-snap.json.gz')) return builtFile('S999', 'SNAP', false, o); return o.missing && k === 'bridge 4 PCLSI' ? null : fs[k] || null; }; }
const EDGES = [], REACHED = { 1: new Set(), 2: new Set() };
function planted() {
  const cases = [];
  const G = o => { const us = parse(builtLog(o)); const g = gate(us, { npw: 2000 }); return g.length ? g : loadTraces(us, '/x', ST, builtRead(o)).bad; };
  cases.push(['a built set gates clean', String(G({}).length), '0']);
  for (const [nm, o] of [['a missing unit', { skip: 'S126 SNAP' }], ['an extra household', { extra: true }], ['a unit not done', { notDone: true }], ['a reader in an arm', { reader: true }],
    ['another seed in an arm', { seedOff: true }], ['SNAP interpolated', { wrongInterp: true }], ['a death-tax unit at death tax 0', { dtOff: true }], ['a household\'s access lines differing', { accessOff: true }],
    ['a household\'s arms on different paths', { pathsOff: true }], ['a sum line off its file\'s survivors', { sumOff: true }], ['a file with another stamp', { stOff: true }], ['a missing file', { missing: true }]]) cases.push([`the gate refuses ${nm}`, String(G(o).length > 0), 'true']);
  // every reading a plant makes records the outcomes it reached (OUTCOMES REACHED, check-prediction.mjs --outcomes)
  const R = o => { const r = reading(builtFiles(o), () => {}); REACHED[1].add(r.v1); REACHED[2].add(r.v2); return r; };
  // ITEM 1: none differ -> 0 discordant everywhere: no material harm (the EDGE: 0 of 0 is no material harm, never 'at the line')
  { const r = R({ scen: { S130: [0, 40], S370: [0, 40] } }); cases.push(['0 discordant paths on 23 households reads them no material harm and item 1 HELD', `${r.one.filter(x => x.outcome === 'no material harm').length} ${r.v1}`, '25 HELD']); } EDGES.push('0 of 0 discordant paths (no material harm)');
  // a clear harm: 60 lost and none saved on 2,000 paths (3 points at a 0.5 margin, survival 95%: 0.25) -> harm
  cases.push(['60 lost, none saved on one household reads item 1 FALSIFIED', R({ scen: { S168: [60, 0], S130: [0, 40], S370: [0, 40] } }).v1, 'FALSIFIED']);
  // a loss too small to be harm and too wide to be no harm: 8 lost, 2 saved -> inconclusive
  { const r = R({ scen: { S168: [8, 2], S130: [0, 40], S370: [0, 40] } }); cases.push(['8 lost, 2 saved reads that household inconclusive, the panel positive, item 1 HELD', `${r.one.find(x => x.id === 'S168').outcome} ${r.v1}`, 'inconclusive HELD']); }
  // the floor over the 23 outside the gain pair (46,000 paths): 23 households losing 2 each (no household harm) -> its
  // interval straddles -0.1 (point -0.1); the gain pair's 80 saved paths are outside the floor and cannot pay for it
  const lose = n => Object.fromEntries(PANEL.filter(id => !GAIN_PANEL.includes(id)).map(id => [id, [n, 0]]));
  { const r = R({ scen: { ...lose(2), S130: [0, 40], S370: [0, 40] } }); cases.push(['23 households losing 2 paths each reads no harm and the floor INCONCLUSIVE', `${r.one.filter(x => x.outcome === 'harm').length} ${r.v1}`, '0 INCONCLUSIVE']); }
  { const r = R({ scen: { ...lose(2), S130: [0, 100], S370: [0, 100] } }); cases.push(['the gain pair saving 200 paths (every SNAP failure) does not move the floor (still INCONCLUSIVE)', `${r.pool.k} ${r.v1}`, '23 INCONCLUSIVE']); }
  // 22 losing 2 and one losing 1: the floor's point -0.098 is inside the margin but its lower end is not -> INCONCLUSIVE
  { const r = R({ scen: { ...lose(2), S168: [1, 0], S130: [0, 40], S370: [0, 40] } }); cases.push(['a panel point inside the margin with its lower end outside reads INCONCLUSIVE', `${r.pool.d > -0.1 && r.pool.lo < -0.1} ${r.v1}`, 'true INCONCLUSIVE']); }
  // 23 losing 4 each (raw p 0.0625: no household harm) -> the floor's point -0.2, its upper end below -0.1: FALSIFIED
  { const r = R({ scen: { ...lose(4), S130: [0, 40], S370: [0, 40] } }); cases.push(['23 households losing 4 paths each reads no household harm but the floor FALSIFIED', `${r.one.filter(x => x.outcome === 'harm').length} ${r.v1}`, '0 FALSIFIED']); } EDGES.push('a panel interval straddling minus the pooled margin');
  // Holm: 12 lost, 2 saved (raw harm p 0.0065, a 0.5-point loss at a 0.25 margin) is harm alone but not over 25 households
  { const r = R({ scen: { S168: [12, 2], S130: [0, 40], S370: [0, 40] } }); cases.push(['12 lost, 2 saved reads inconclusive after Holm over 25, not harm (item 1 HELD)', `${r.one.find(x => x.id === 'S168').outcome} ${r.v1}`, 'inconclusive HELD']); }
  // ITEM 2: 40 saved and none lost on both -> GAIN; equal lost and saved on one -> FALSIFIED (the EDGE: a change of exactly 0)
  cases.push(['40 saved on S130 and S370 reads item 2 HELD', R({ scen: { S130: [0, 40], S370: [0, 40] } }).v2, 'HELD']);
  cases.push(['5 lost and 5 saved on S370 reads item 2 FALSIFIED', R({ scen: { S130: [0, 40], S370: [5, 5] } }).v2, 'FALSIFIED']); EDGES.push('a gain household with a change of exactly 0');
  cases.push(['3 saved, none lost on S370 (p 0.125) reads item 2 INCONCLUSIVE', R({ scen: { S130: [0, 40], S370: [0, 3] } }).v2, 'INCONCLUSIVE']);
  cases.push(['no discordant path on S130 reads item 2 FALSIFIED (no gain at all)', R({ scen: { S130: [0, 0], S370: [0, 40] } }).v2, 'FALSIFIED']); EDGES.push('a gain household with no discordant path');
  // the secondary: the paired net change is +1 a path; the death-tax flip planted reads FLIPS
  { const lines = []; reading(builtFiles({ flip: true, scen: { S130: [0, 40], S370: [0, 40] } }), l => lines.push(l)); cases.push(['a death-tax arm whose net change turns negative reads FLIPS', String(lines.some(l => /^\s+S130 .*FLIPS$/.test(l))), 'true']); }
  { const p = paired(builtFile('S1', 'SNAP', false), builtFile('S1', 'PCLSI', false)); cases.push(['the paired net change is +1 a path with se 0', `${p.net.m} ${p.net.se}`, '1 0']); }
  { const t = builtFile('S1', 'SNAP', false); t.u[5] = 0.65; t.u[6] = 0.76; t.u[40 + 3] = 0.7; const h = hold(t); cases.push(['the hold counts 2 reaching, 1 crossing, a mean of 1 year in the band', `${h.reach} ${h.cross} ${h.dwell}`, '2 1 1']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export { builtLog, logsOf };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2].map(k => `OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagadoptpi'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (units.filter(u => u.done).length < UNIT_KEYS.length) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNIT_KEYS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw });
  const tr = bad.length ? { bad: [], files: {} } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
  bad.push(...tr.bad);
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${UNIT_KEYS.length} units (${PANEL.length} households x 2 arms, ${DT_PANEL.length} death-tax households x 2), each once and done, the shipping default's settings and the arm's axis and death tax on every ran line; each household's units on one access line and one set of paths; every per-path file present, stamped and holding its sum line\n`);
  reading(tr.files);
}
