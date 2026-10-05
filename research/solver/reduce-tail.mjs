/*
 * TAIL'S REDUCER (PLAN.md O97, O89, PR5, PR7; audit-tail.mjs; predictions/diag-tail.md). A TEST of three things on ADOPT-PI's
 * unit at seed 7005, every arm of a household on the same paths:
 *   the tie margin (PCLSI-TIE: PCLSI's tables, among moves within m of the best the least tax this year) on the five
 *   households where O97's mean loss sits and the two controls; the death tax (DT: SNAP and PCLSI at a pension death tax of
 *   40%) on the five; the forward-only hybrid (HYB: PCLSI's tables read through the snap) on S130, S370 and S128.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/diag-tail.md); every unit once and done; each ran
 *   line ADOPT-PI's settings (no reader, 30 points, seed 7005, 6,000 paths, the estate weight 0.02, the switch margin 0.001,
 *   buckets 0,0.5,1) with its arm's tables, read and tie margin and its job's death tax; a household's units on one access
 *   line and one pathsum; every per-path file present, stamped as the logs and holding its sum line; and THE IDENTITY: the
 *   SNAP and PCLSI arms at death tax 0 equal ADOPT-PI's per-path files path for path (survived, lifetime tax, terminal net),
 *   ADOPT-PI's files first passing their own gate (reduce-adoptpi.mjs, with its stamp check: rule 3). Anything else differing
 *   between the arms is not settled: the gate refuses.
 * THE READING (registered in predictions/diag-tail.md):
 *   ITEM 1 (primary; the tie margin's safety, TAIL's 7 households): PCLSI-TIE against PCLSI, paired survival, b lost and c
 *     saved; the household passes when stats.mjs outcome() reads no material harm at its margin (0.25 points at PCLSI
 *     survival 95% or more, else 0.5) AND the guarded unconditional interval's lower end (reduce-7aa.mjs guarded, RULES.md
 *     section 8 item 1) is above minus the margin; harm when outcome() reads harm (harm's exact McNemar p, Holm over the 7).
 *     HELD when all 7 pass; FALSIFIED when any reads harm; else INCONCLUSIVE.
 *   ITEM 2 (primary; the extra tax closed, the 5 losers): per path g = tax(PCLSI) - tax(SNAP) (O97's gap) and x =
 *     tax(PCLSI) - tax(PCLSI-TIE) (what the margin removes); Fisher's paired randomization test (reduce-7ar.mjs flipP,
 *     B 20,000) of mean(x - g/2) above 0 (HELD side: at least half the gap closed) and of mean(g/2 - x) above 0 (FALSIFIED
 *     side), Holm over the 10 (5 households x 2 sides); a household whose mean g is not above 0 reads NO GAP. HELD when all 5
 *     read HELD; FALSIFIED when 3 or more read FALSIFIED; else INCONCLUSIVE.
 *   ITEM 3 (primary; the death tax, the 5 losers): per path n0 = net(PCLSI) - net(SNAP) at death tax 0 and n4 the same at
 *     0.4; the same test of mean(n4 - n0/2) above 0 (HELD side: at 0.4 PCLSI's estate loss is under half its loss at 0) and
 *     of mean(n0/2 - n4) above 0, Holm over the 10; a household whose mean n0 is not below 0 reads NO LOSS. HELD when all 5
 *     read HELD; FALSIFIED when 3 or more read FALSIFIED; else INCONCLUSIVE.
 *   ITEM 4 (primary; O89's split, decided on S130): per path y = (PCLSI - HYB) - (HYB - SNAP) in survival (0/1), so mean(y)
 *     above 0 means the read's part of PCLSI's gain (PCLSI over HYB) exceeds the tables' part (HYB over SNAP); the same
 *     randomization test of mean(y) above 0 and below, Holm over the 6 (3 households x 2); per household READ (the read
 *     carries more than half, shown), TABLES (the tables more than half, shown) or SPLIT. HELD when S130 reads READ;
 *     FALSIFIED when S130 reads TABLES; else INCONCLUSIVE. S370 and S128 reported; the parts' McNemar cells printed.
 *   SECONDARY (declared, decides nothing): every pair's mean tax and net change (se over paths); PCLSI-TIE against SNAP split
 *     at the estate cap (derive-o97.mjs split, copied); the paths whose tax the margin changed; the controls' items 2 figures.
 *   REPORTED: the hold per arm (reduce-adoptpi.mjs hold).
 *   node research/solver/reduce-tail.mjs [dir] [paths] [points] > research/solver/results-tail.txt
 *   node research/solver/reduce-tail.mjs --planted   the planted checks alone, the outcomes they reach and the EDGES
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { outcome, mcnemarHarmP, binomUpperHalf, holm, marginFor, survivalChangeU } from './stats.mjs';
import { guarded } from './reduce-7aa.mjs';
import { flipP } from './reduce-7ar.mjs';
import { paired, hold, decode, stampOf, parse as parseA, gate as gateA, loadTraces as loadA, PRED as PREDA, logsOf } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-tail.md';
export const PTS = '30', SEED = '7005', NPW = 6000, W = '0.02', DT_RATE = '0.4', TIE = 1e-6, B = 20000, ALPHA = 0.05;
export const LOSERS = ['share 0.90', 'share 0.95', 'bridge 1', 'bridge 4+cost', 'S366'], CONTROLS = ['S130', 'S370'], HYB_PANEL = ['S130', 'S370', 'S128'];
export const TAIL = [...LOSERS, ...CONTROLS];
// audit-tail.mjs JOBS and armsOf, copied (its module runs its jobs on import); the preflight parses every unit through both
export const JOBS = [...TAIL.map(id => [id, 'TAIL']), ['S128', 'HYB'], ...LOSERS.map(id => [id, 'DT'])];
export const armsOf = (id, group) => (group === 'DT' ? ['SNAP', 'PCLSI'] : group === 'HYB' ? ['SNAP', 'PCLSI', 'HYB'] : ['SNAP', 'PCLSI', 'PCLSI-TIE', ...(HYB_PANEL.includes(id) ? ['HYB'] : [])]);
export const ARM = { SNAP: { tables: 'SNAP', tie: 0, read: 'false' }, PCLSI: { tables: 'PCLSI', tie: 0, read: 'true' }, 'PCLSI-TIE': { tables: 'PCLSI', tie: TIE, read: 'true' }, HYB: { tables: 'PCLSI', tie: 0, read: 'false' } };
export const keyOf = u => `${u.id}${u.dt ? ' DT' : ''} ${u.arm}`;
export const UNIT_KEYS = JOBS.flatMap(([id, g]) => armsOf(id, g).map(a => `${id}${g === 'DT' ? ' DT' : ''} ${a}`));
const BASE = `OFF/PRODUCT/W${W}`, labelOf = (a, dt) => `${BASE}${dt ? '/DT' : ''}/${a}`;
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`), LBL = `(${esc(BASE)}(?:\\/DT)?\\/(?:SNAP|PCLSI|PCLSI-TIE|HYB))`;
const CASEL = new RegExp(`^(\\S.*?)\\s+case \\| unit ${LBL} \\| lambda (\\S+)$`);
const LINE = new RegExp(`^\\s+(ran|access|sum|trace) ${LBL}: (.*)$`), DONEL = new RegExp(`^\\s+done ${LBL}$`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); };
const splitL = l => ({ dt: l.includes('/DT/'), arm: l.slice(l.lastIndexOf('/') + 1) });

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), ...splitL(m[2]), label: m[2], lambda: m[3], done: false }; us.push(cur); continue; }
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
    const A = ARM[u.arm], want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', mix: '3', tables: A.tables, read: A.read, deathTax: u.dt ? DT_RATE : '0' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (num(u.ran, 'tieMargin') !== A.tie) bad.push(`${tag}: ran tieMargin ${field(u.ran, 'tieMargin')}, not ${A.tie}`);
    if (!(num(u.access, 'open') > 0)) bad.push(`${tag}: access line without the opening balances`);
    const s = u.sum;
    if (s.paths !== npw || !(Number.isInteger(s.survived) && s.survived >= 0 && s.survived <= s.paths) || !Number.isFinite(s.tax) || !Number.isFinite(s.net) || !s.pathsum) bad.push(`${tag}: sum paths ${s.paths} survived ${s.survived} tax ${s.tax} net ${s.net} pathsum ${s.pathsum}`);
    if (u.trace.bad || u.trace.paths !== npw) bad.push(`${tag}: trace line ${u.trace.bad || `paths ${u.trace.paths}`}`);
  }
  // the pairing: one access line (the death tax aside) and one pathsum across all of a household's units
  for (const id of [...new Set(JOBS.map(j => j[0]))]) {
    const us = units.filter(u => u.id === id && u.sum && u.access);
    if (new Set(us.map(u => u.access)).size > 1) bad.push(`${id}: its units' access lines differ`);
    if (new Set(us.map(u => u.sum.pathsum)).size > 1) bad.push(`${id}: its units ran different paths (pathsum ${[...new Set(us.map(u => u.sum.pathsum))].join(', ')})`);
  }
  return bad;
}

/* a unit's per-path file against its unit (reduce-adoptpi.mjs checkTrace, with the arm's tie and read) */
export function checkTrace(t, u, st) {
  const tag = `${keyOf(u)} file`, years = Number((/ years (\d+) /.exec(u.access) || [])[1]) + 1;
  if (!t) return [`${tag}: missing`];
  const bad = [];
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.id !== u.id || t.arm !== u.arm || !!t.dt !== u.dt || t.N !== u.sum.paths || t.Y !== years || t.tie !== ARM[u.arm].tie || String(t.read) !== ARM[u.arm].read) bad.push(`${tag}: id ${t.id} arm ${t.arm} dt ${t.dt} tie ${t.tie} read ${t.read} paths ${t.N} years ${t.Y}, not the unit's`);
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
/* THE IDENTITY: the SNAP and PCLSI arms at death tax 0 against ADOPT-PI's files (`adopt`: key -> decoded file), path for path */
export function identity(files, adopt) {
  const bad = [];
  for (const id of [...TAIL, 'S128']) for (const a of ['SNAP', 'PCLSI']) {
    const t = files[`${id} ${a}`], o = adopt[`${id} ${a}`];
    if (!t || !o) { bad.push(`identity ${id} ${a}: ${!t ? 'this run\'s' : 'ADOPT-PI\'s'} file missing`); continue; }
    if (t.N !== o.N) { bad.push(`identity ${id} ${a}: ${t.N} paths here, ${o.N} in ADOPT-PI's`); continue; }
    let n = 0; for (let j = 0; j < t.N; j++) if (t.survived[j] !== o.survived[j] || t.tax[j] !== o.tax[j] || t.net[j] !== o.net[j]) n++;
    if (n) bad.push(`identity ${id} ${a}: ${n} of ${t.N} paths differ from ADOPT-PI's (survived, tax or net)`);
  }
  return bad;
}

/* derive-o97.mjs split(), copied (that script reads ADOPT-PI's files on import): the change P less S split at the estate cap */
export function tailSplit(S, P, cap) {
  const N = S.N; let sT = 0, sN = 0, tT = 0, tN = 0, nTail = 0, bT = 0, nBody = 0;
  for (let j = 0; j < N; j++) {
    const dT = P.tax[j] - S.tax[j], dN = P.net[j] - S.net[j]; sT += dT; sN += dN;
    if (S.net[j] > cap || P.net[j] > cap) { nTail++; tT += dT; tN += dN; } else { nBody++; bT += dT; }
  }
  return { mT: sT / N, mN: sN / N, tailShare: nTail / N, tailNet: sN ? tN / sN : NaN, tailTax: sT ? tT / sT : NaN, bodyT: nBody ? bT / nBody : 0 };
}
const mean = xs => xs.reduce((t, x) => t + x, 0) / xs.length;
/* items 2 and 3: per household the per-path values `up` (HELD side; `down` is its negative) and the precondition */
function closure(rows, b) {
  const ps = rows.flatMap(r => (r.pre ? [flipP(r.up, b, 7002), flipP(r.up.map(x => -x), b, 7003)] : [1, 1])), ph = holm(ps);
  const out = rows.map((r, i) => ({ ...r, mU: mean(r.up), pU: ps[2 * i], pD: ps[2 * i + 1], hU: ph[2 * i], hD: ph[2 * i + 1], read: !r.pre ? r.noPre : ph[2 * i] < ALPHA ? 'HELD' : ph[2 * i + 1] < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE' }));
  const v = out.every(r => r.read === 'HELD') ? 'HELD' : out.filter(r => r.read === 'FALSIFIED').length >= 3 ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { rows: out, v };
}
export function items(files, { b = B } = {}) {
  const F = k => files[k];
  // ITEM 1
  const pr = TAIL.map(id => paired(F(`${id} PCLSI`), F(`${id} PCLSI-TIE`)));
  const ph = holm(pr.map(p => mcnemarHarmP(p.b, p.c)));
  const one = TAIL.map((id, i) => {
    const p = pr[i], margin = marginFor(100 * p.snap), ex = outcome({ b: p.b, c: p.c, N: p.N, margin, pHolm: ph[i] });
    const u = guarded(survivalChangeU(p.a, p.b, p.c, p.d, ALPHA), p.b, p.c, p.N, ALPHA);
    const pass = ex.outcome === 'no material harm' && u.lo > -margin;
    return { id, b: p.b, c: p.c, N: p.N, surv: 100 * p.snap, margin, pHolm: ph[i], d: ex.d, lo: ex.lo, hi: ex.hi, ulo: u.lo, read: ex.outcome === 'harm' ? 'harm' : pass ? 'pass' : 'inconclusive' };
  });
  const v1 = one.some(r => r.read === 'harm') ? 'FALSIFIED' : one.every(r => r.read === 'pass') ? 'HELD' : 'INCONCLUSIVE';
  // ITEM 2
  const two = closure(LOSERS.map(id => {
    const S = F(`${id} SNAP`), P = F(`${id} PCLSI`), T = F(`${id} PCLSI-TIE`), g = [], up = [];
    for (let j = 0; j < S.N; j++) { const gj = P.tax[j] - S.tax[j], xj = P.tax[j] - T.tax[j]; g.push(gj); up.push(xj - gj / 2); }
    const mg = mean(g); return { id, mg, closed: mg ? (mean(up) + mg / 2) / mg : NaN, up, pre: mg > 0, noPre: 'NO GAP' };
  }), b);
  // ITEM 3
  const three = closure(LOSERS.map(id => {
    const S = F(`${id} SNAP`), P = F(`${id} PCLSI`), SD = F(`${id} DT SNAP`), PD = F(`${id} DT PCLSI`), n0 = [], up = [];
    for (let j = 0; j < S.N; j++) { const a = P.net[j] - S.net[j], c = PD.net[j] - SD.net[j]; n0.push(a); up.push(c - a / 2); }
    const m0 = mean(n0), m4 = mean(up) + m0 / 2; return { id, m0, m4, kept: m0 ? m4 / m0 : NaN, up, pre: m0 < 0, noPre: 'NO LOSS' };
  }), b);
  // ITEM 4: per path y = (PCLSI - HYB) - (HYB - SNAP) in survival; the McNemar parts reported beside it
  const ys = HYB_PANEL.map(id => { const S = F(`${id} SNAP`), H = F(`${id} HYB`), P = F(`${id} PCLSI`); return Array.from({ length: S.N }, (_, j) => P.survived[j] - 2 * H.survived[j] + S.survived[j]); });
  const p4 = ys.flatMap(y => [flipP(y, b, 7002), flipP(y.map(x => -x), b, 7003)]), h4 = holm(p4);
  const four = HYB_PANEL.map((id, i) => {
    const t = paired(F(`${id} SNAP`), F(`${id} HYB`)), r = paired(F(`${id} HYB`), F(`${id} PCLSI`)), tot = (t.c - t.b) + (r.c - r.b);
    return { id, tb: t.b, tc: t.c, rb: r.b, rc: r.c, N: t.N, readShare: tot ? (r.c - r.b) / tot : NaN, my: mean(ys[i]), pU: p4[2 * i], pD: p4[2 * i + 1], hU: h4[2 * i], hD: h4[2 * i + 1], read: h4[2 * i] < ALPHA ? 'READ' : h4[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT' };
  });
  const s130 = four.find(r => r.id === 'S130').read, v4 = s130 === 'READ' ? 'HELD' : s130 === 'TABLES' ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { one, v1, two: two.rows, v2: two.v, three: three.rows, v3: three.v, four, v4 };
}

const f0 = x => (Number.isFinite(x) ? x.toFixed(0) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), pv = x => (Number.isFinite(x) ? x.toExponential(2) : '-');
export function reading(files, units, out = console.log, opts = {}) {
  const r = items(files, opts), openOf = id => num((units.find(u => u.id === id && u.access) || {}).access || '', 'open');
  out(`TAIL: ADOPT-PI's unit (no reader, the product's settings, lambda held, the estate weight ${W}, ${PTS} points), seed ${SEED}, every arm of a household on the same paths; the tie margin ${TIE}; the pension death tax ${DT_RATE} in DT.`);
  out(`\nITEM 1 (primary): PCLSI-TIE against PCLSI, paired survival on ${TAIL.join(', ')}; pass = outcome() no material harm AND the guarded unconditional lower end above minus the margin; harm = outcome() harm (Holm over ${TAIL.length})`);
  out('  household        PCLSI %   b     c     change   [exact 95%]          guarded lo  margin  p Holm     read');
  for (const x of r.one) out(`  ${x.id.padEnd(16)} ${f2(x.surv).padStart(6)}  ${String(x.b).padStart(4)}  ${String(x.c).padStart(4)}  ${f3(x.d).padStart(7)}  [${f3(x.lo)}, ${f3(x.hi)}]`.padEnd(78) + `${f3(x.ulo).padStart(7)}     ${x.margin.toFixed(2)}    ${pv(x.pHolm)}  ${x.read}`);
  out(`  -> ${r.v1} (HELD when all ${TAIL.length} pass; FALSIFIED when any reads harm; else INCONCLUSIVE)`);
  out(`\nITEM 2 (primary): the extra tax closed on ${LOSERS.join(', ')}: g = tax(PCLSI) - tax(SNAP), x = tax(PCLSI) - tax(PCLSI-TIE) a path; Fisher's paired randomization test (B ${opts.b || B}) of mean(x - g/2) above 0 (HELD side) and below (FALSIFIED side), Holm over ${2 * LOSERS.length}`);
  for (const x of r.two) out(`  ${x.id.padEnd(16)} mean g ${f2(x.mg).padStart(10)}  closed ${f3(x.closed).padStart(7)} of it | mean(x - g/2) ${f2(x.mU).padStart(10)} | p ${pv(x.pU)} / ${pv(x.pD)}, Holm ${pv(x.hU)} / ${pv(x.hD)} | ${x.read}`);
  out(`  -> ${r.v2} (HELD when all ${LOSERS.length} read HELD; FALSIFIED when 3 or more read FALSIFIED; else INCONCLUSIVE)`);
  out(`\nITEM 3 (primary): the estate loss at the death tax ${DT_RATE} on ${LOSERS.join(', ')}: n0 = net(PCLSI) - net(SNAP) at 0, n4 the same at ${DT_RATE}, a path; the same test of mean(n4 - n0/2) above 0 (HELD side) and below, Holm over ${2 * LOSERS.length}`);
  for (const x of r.three) out(`  ${x.id.padEnd(16)} mean n0 ${f2(x.m0).padStart(11)}  mean n4 ${f2(x.m4).padStart(11)}  kept ${f3(x.kept).padStart(7)} of it | mean(n4 - n0/2) ${f2(x.mU).padStart(10)} | p ${pv(x.pU)} / ${pv(x.pD)}, Holm ${pv(x.hU)} / ${pv(x.hD)} | ${x.read}`);
  out(`  -> ${r.v3} (HELD when all ${LOSERS.length} read HELD; FALSIFIED when 3 or more read FALSIFIED; else INCONCLUSIVE)`);
  out(`\nITEM 4 (primary): O89's split on ${HYB_PANEL.join(', ')}: y = (PCLSI - HYB) - (HYB - SNAP) a path in survival; the randomization test of mean(y) above 0 (READ) and below (TABLES), Holm over ${2 * HYB_PANEL.length}; the parts' cells beside it`);
  for (const x of r.four) out(`  ${x.id.padEnd(16)} tables (HYB over SNAP): b ${x.tb} c ${x.tc} change ${f3(100 * (x.tc - x.tb) / x.N)} | read (PCLSI over HYB): b ${x.rb} c ${x.rc} change ${f3(100 * (x.rc - x.rb) / x.N)} | the read's share ${f3(x.readShare)} | mean y ${(1e4 * x.my).toFixed(1)}e-4, p ${pv(x.pU)} / ${pv(x.pD)}, Holm ${pv(x.hU)} / ${pv(x.hD)} | ${x.read}`);
  out(`  -> ${r.v4} (HELD when S130 reads READ; FALSIFIED when S130 reads TABLES; else INCONCLUSIVE)`);
  out('\nSECONDARY (declared; decides nothing): mean paired changes a path, tax and net (se over paths)');
  const pairs = [...TAIL.flatMap(id => [[id, 'SNAP', 'PCLSI'], [id, 'PCLSI', 'PCLSI-TIE'], [id, 'SNAP', 'PCLSI-TIE']]), ...HYB_PANEL.flatMap(id => [[id, 'SNAP', 'HYB']]), ['S128', 'SNAP', 'PCLSI'], ...LOSERS.map(id => [`${id} DT`, 'SNAP', 'PCLSI'])];
  for (const [id, a, c] of pairs) { const p = paired(files[`${id} ${a}`], files[`${id} ${c}`]); out(`  ${id.padEnd(19)} ${c} less ${a}`.padEnd(48) + `survival ${f3(100 * (p.c - p.b) / p.N).padStart(7)}  tax ${f2(p.tax.m).padStart(11)} (${f2(p.tax.se)})  net ${f2(p.net.m).padStart(12)} (${f2(p.net.se)})`); }
  out('\nSECONDARY: PCLSI-TIE and PCLSI against SNAP split at the estate cap (4 x the opening balances; derive-o97.mjs split): mean tax, mean net, tail share of the paths, the tail\'s share of the net and tax changes, the body\'s mean tax change; and the paths whose tax the margin changed');
  for (const id of TAIL) {
    const cap = 4 * openOf(id), S = files[`${id} SNAP`], P = files[`${id} PCLSI`], T = files[`${id} PCLSI-TIE`];
    let ch = 0; for (let j = 0; j < P.N; j++) if (P.tax[j] !== T.tax[j]) ch++;
    for (const [nm, X] of [['PCLSI', P], ['PCLSI-TIE', T]]) { const s = tailSplit(S, X, cap); out(`  ${id.padEnd(16)} ${nm.padEnd(10)} cap ${f0(cap).padStart(8)} | tax ${f0(s.mT).padStart(8)} net ${f0(s.mN).padStart(9)} | tail ${f2(s.tailShare)} of paths, ${f2(s.tailNet)} of dnet, ${f2(s.tailTax)} of dtax | body dtax ${f0(s.bodyT)}${nm === 'PCLSI-TIE' ? ` | tax changed by the margin on ${ch} of ${P.N}` : ''}`); }
  }
  out('\nREPORTED: the hold per arm (paths reaching 0.6 of the allowance, crossing 0.75, the mean years in [0.6, 0.75) of the reaching paths)');
  for (const k of UNIT_KEYS) { const h = hold(files[k]); out(`  ${k.padEnd(28)} reach ${String(h.reach).padStart(5)} cross ${String(h.cross).padStart(5)} dwell ${f2(h.dwell)}`); }
  out(`\nOUTCOME: 1 ${r.v1}; 2 ${r.v2}; 3 ${r.v3}; 4 ${r.v4}`);
  return r;
}

/* ---- planted checks: built logs and files, faults planted in them ---- */
const ST = { code: 'abc', audit: 'def', prediction: 'none', sha: '-' };
const NB = 2000, YB = 40, splitK = k => { const dt = k.includes(' DT '), arm = k.slice(k.lastIndexOf(' ') + 1), id = k.slice(0, k.length - arm.length - 1).replace(/ DT$/, ''); return { id, arm, dt }; };
const fileName = (id, arm, dt) => `${id.replace(/[ +]/g, '_')}-${dt ? 'dt-' : ''}${arm.toLowerCase()}.json.gz`;
/* a built file: SNAP survives paths 0-1899; tax 100 a path, and on the losers PCLSI pays g_j more (1000 + 400 sin j) on the
   even paths, PCLSI-TIE removes o.close of it; net 1000 (600 at DT), PCLSI's L_j = 2000 + 800 cos j less on the even paths at
   0 and o.keep of it at DT; o.tie: id -> [b, c] PCLSI-TIE against PCLSI; PCLSI saves paths 1900-1999 on the hybrid panel and
   HYB saves the first o.hyb[id] of them */
function builtFile(id, arm, dt, o = {}) {
  const N = NB, sv = new Uint8Array(N), tax = new Float32Array(N), net = new Float32Array(N), u = new Float32Array(N * YB).fill(0.3);
  const loser = LOSERS.includes(id), close = (o.close || {})[id] ?? 1, keep = (o.keep || {})[id] ?? 0;
  for (let j = 0; j < N; j++) {
    sv[j] = j < 1900 ? 1 : 0;
    const g = loser && j % 2 === 0 ? 1000 + 400 * Math.sin(j) : 0, L = loser && j % 2 === 0 ? 2000 + 800 * Math.cos(j) : 0;
    tax[j] = 100 + (arm === 'PCLSI' ? g : arm === 'PCLSI-TIE' ? (1 - close) * g + ((o.noise || {})[id] || 0) * Math.sin(7 * j + 1) : 0);
    net[j] = (dt ? 600 : 1000) - (arm === 'SNAP' ? 0 : dt ? keep * L : L);
  }
  if (HYB_PANEL.includes(id) && !dt) { const k = (o.hyb || {})[id] ?? 0; if (arm === 'PCLSI' || arm === 'PCLSI-TIE') for (let j = 1900; j < 2000; j++) sv[j] = 1; if (arm === 'HYB') for (let j = 1900; j < 1900 + k; j++) sv[j] = 1; }
  if (arm === 'PCLSI-TIE') { const [b, c] = (o.tie || {})[id] || [0, 0]; for (let j = 0; j < b; j++) sv[j] = 0; if (!HYB_PANEL.includes(id)) for (let j = 0; j < c; j++) sv[1900 + j] = 1; }   // saved paths on a household PCLSI does not already save
  if (o.idOff && id === 'share 0.95' && arm === 'PCLSI' && !dt && o.adoptSide) tax[7] += 1;
  return { id, arm, dt, tie: ARM[arm].tie, read: ARM[arm].read === 'true', tables: ARM[arm].tables, stamp: o.stOff && id === 'S366' && arm === 'PCLSI-TIE' ? { ...ST, audit: 'zzz' } : ST, N, Y: YB, survived: sv, tax, net, u };
}
const builtFiles = (o = {}) => Object.fromEntries(UNIT_KEYS.map(k => { const { id, arm, dt } = splitK(k); return [k, builtFile(id, arm, dt, o)]; }));
function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const k of UNIT_KEYS) {
    if (o.skip === k) continue;
    const { id, arm, dt } = splitK(k), L = labelOf(arm, dt), A = ARM[arm];
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed ${SEED} paths ${NB} grid total30x6x6 lambda 0.0223606797749979 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 tables ${o.tablesOff && k === 'S130 HYB' ? 'SNAP' : A.tables} read ${o.readOff && k === 'S370 HYB' ? 'true' : A.read} tieMargin ${o.tieOff && k === 'bridge 1 PCLSI-TIE' ? 0.0001 : A.tie} deathTax ${dt && !o.dtOff ? DT_RATE : '0'}`);
    lines.push(`${''.padEnd(16)} access ${L}: year 2 years ${YB - 1} lsa 268275 open 950000`);
    const f = builtFile(id, arm, dt, o);
    let s = 0, tx = 0, nt = 0; for (let j = 0; j < f.N; j++) { s += f.survived[j]; tx += f.tax[j]; nt += f.net[j]; }
    lines.push(`${''.padEnd(16)} sum ${L}: paths ${NB} survived ${o.sumOff && k === 'S128 HYB' ? s + 1 : s} tax ${(tx / f.N).toFixed(2)} net ${(nt / f.N).toFixed(2)} pathsum ${o.pathsOff && k === 'S366 DT PCLSI' ? 12345 : 999} secs 10`);
    lines.push(`${''.padEnd(16)} trace ${L}: file ${fileName(id, arm, dt)} paths ${NB} years ${YB}`);
    if (!(o.notDone && k === 'S370 PCLSI-TIE')) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  return lines.join('\n') + '\n';
}
function builtRead(o) { const fs = builtFiles(o); return f => { const k = UNIT_KEYS.find(x => { const { id, arm, dt } = splitK(x); return f.endsWith(fileName(id, arm, dt)); }); return o.missing && k === 'S130 HYB' ? null : fs[k] || null; }; }
const builtAdopt = o => Object.fromEntries([...TAIL, 'S128'].flatMap(id => ['SNAP', 'PCLSI'].map(a => [`${id} ${a}`, builtFile(id, a, false, { ...o, adoptSide: true })])));
const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
function planted() {
  const cases = [], PB = 2000;
  const G = o => { const us = parse(builtLog(o)); const g = gate(us, { npw: NB }); if (g.length) return g; const tr = loadTraces(us, '/x', ST, builtRead(o)); return tr.bad.length ? tr.bad : identity(tr.files, builtAdopt(o)); };
  cases.push(['a built set gates clean, the identity included', String(G({}).length), '0']);
  for (const [nm, o] of [['a missing unit', { skip: 'S128 PCLSI' }], ['a unit not done', { notDone: true }], ['HYB on SNAP\'s tables', { tablesOff: true }], ['HYB read interpolated', { readOff: true }],
    ['PCLSI-TIE at another margin', { tieOff: true }], ['a DT unit at death tax 0', { dtOff: true }], ['a household\'s units on different paths', { pathsOff: true }], ['a sum line off its file', { sumOff: true }],
    ['a file with another stamp', { stOff: true }], ['a missing file', { missing: true }], ['an arm off ADOPT-PI\'s file on one path (the identity)', { idOff: true }]]) cases.push([`the gate refuses ${nm}`, String(G(o).length > 0), 'true']);
  const R = o => { const r = items(builtFiles(o), { b: PB }); REACHED[1].add(r.v1); REACHED[2].add(r.v2); REACHED[3].add(r.v3); REACHED[4].add(r.v4); return r; };
  const all = (v, ids = LOSERS) => Object.fromEntries(ids.map(id => [id, v]));
  { const g = gate(parse(builtLog({ skip: 'S128 PCLSI' })), { npw: NB }); cases.push(['the gate alone names a missing unit', String(g.some(x => /^S128 PCLSI: 0 unit lines, not 1$/.test(x))), 'true']); }
  // ITEM 1
  { const r = R({}); cases.push(['no discordant path anywhere: every household passes, item 1 HELD', `${r.one.filter(x => x.read === 'pass').length} ${r.v1}`, `${TAIL.length} HELD`]); } EDGES.push('0 of 0 discordant paths (passes)');
  cases.push(['60 lost, none saved on S366 reads item 1 FALSIFIED', R({ tie: { S366: [60, 0] } }).v1, 'FALSIFIED']);
  { const r = R({ tie: { S366: [6, 0] } }); cases.push(['6 lost, none saved (0.3 points against 0.25 at 95%) reads inconclusive, item 1 INCONCLUSIVE', `${r.one.find(x => x.id === 'S366').read} ${r.v1}`, 'inconclusive INCONCLUSIVE']); }
  // 3 lost, none saved at 95% (margin 0.25): the exact interval's end is -0.15 (no material harm), the guarded end about -0.44
  { const r = R({ tie: { S366: [3, 0] } }), x = r.one.find(y => y.id === 'S366'); cases.push(['3 lost, none saved: the exact rule passes, the guarded interval does not: inconclusive, item 1 INCONCLUSIVE', `${x.lo > -0.25} ${x.ulo < -0.25} ${x.read} ${r.v1}`, 'true true inconclusive INCONCLUSIVE']); } EDGES.push('a one-sided count where the guarded end and the exact end differ');
  // 7 lost, 11 saved at 95%: the exact interval's end -0.257 fails the 0.25 margin, the guarded end -0.243 would pass: both must
  { const r = R({ tie: { S366: [7, 11] } }), x = r.one.find(y => y.id === 'S366'); cases.push(['7 lost, 11 saved: the guarded interval passes, the exact rule does not: inconclusive', `${x.lo < -0.25} ${x.ulo > -0.25} ${x.read} ${r.v1}`, 'true true inconclusive INCONCLUSIVE']); }
  // ITEM 2
  cases.push(['the margin closing all the gap on the 5 reads item 2 HELD', R({}).v2, 'HELD']);
  cases.push(['the margin closing none of it on the 5 reads item 2 FALSIFIED', R({ close: all(0) }).v2, 'FALSIFIED']);
  { const r = R({ close: all(0.5) }); cases.push(['exactly half closed (mean(x - g/2) = 0) reads INCONCLUSIVE on every household', `${r.two.filter(x => x.read === 'INCONCLUSIVE').length} ${r.v2}`, '5 INCONCLUSIVE']); } EDGES.push('exactly half the gap closed (the threshold)');
  cases.push(['2 households closing none, 3 all: item 2 INCONCLUSIVE (mixed)', R({ close: { 'share 0.90': 0, 'share 0.95': 0 } }).v2, 'INCONCLUSIVE']);
  cases.push(['3 households closing none: item 2 FALSIFIED', R({ close: { 'share 0.90': 0, 'share 0.95': 0, 'bridge 1': 0 } }).v2, 'FALSIFIED']);
  // 0.3 closed under noise (3,000 a path): the FALSIFIED side's Holm p 0.087, between 0.05 and 0.5: INCONCLUSIVE
  { const r = R({ close: { S366: 0.3 }, noise: { S366: 3000 } }), x = r.two.find(y => y.id === 'S366'); cases.push(['0.3 closed under noise reads the FALSIFIED side at Holm p between 0.05 and 0.5: INCONCLUSIVE', `${x.hD > 0.05 && x.hD < 0.5} ${x.read}`, 'true INCONCLUSIVE']); } EDGES.push('a FALSIFIED side between 0.05 and 0.5 after Holm');
  { const r = R({ close: all(0.8) }); cases.push(['0.8 closed reads closed 0.800 and HELD', `${r.two[0].closed.toFixed(3)} ${r.v2}`, '0.800 HELD']); }
  // ITEM 3
  cases.push(['no estate loss at the death tax on the 5 reads item 3 HELD', R({}).v3, 'HELD']);
  cases.push(['the whole loss kept at the death tax reads item 3 FALSIFIED', R({ keep: all(1) }).v3, 'FALSIFIED']);
  { const r = R({ keep: all(0.5) }); cases.push(['exactly half kept reads INCONCLUSIVE', r.v3, 'INCONCLUSIVE']); } EDGES.push('exactly half the estate loss kept (the threshold)');
  { const r = R({ keep: all(0.3) }); cases.push(['0.3 kept reads kept 0.300 and HELD', `${r.three[0].kept.toFixed(3)} ${r.v3}`, '0.300 HELD']); }
  // ITEM 4 (PCLSI saves 100 over SNAP on the hybrid panel; HYB saves the first k of them)
  { const r = R({}); cases.push(['HYB saving none of PCLSI\'s 100 on S130 reads READ, item 4 HELD', `${r.four[0].read} ${r.v4}`, 'READ HELD']); }
  { const r = R({ hyb: { S130: 100 } }); cases.push(['HYB saving all 100 on S130 reads TABLES, item 4 FALSIFIED', `${r.four[0].read} ${r.v4}`, 'TABLES FALSIFIED']); }
  { const r = R({ hyb: { S130: 50 } }); cases.push(['HYB saving exactly 50 of 100 on S130 (mean y 0) reads SPLIT, item 4 INCONCLUSIVE', `${r.four[0].read} ${r.four[0].readShare} ${r.v4}`, 'SPLIT 0.5 INCONCLUSIVE']); } EDGES.push('the read and the tables carrying exactly half each (mean y 0)');
  { const r = R({ hyb: { S130: 25 } }); cases.push(['HYB saving 25 of 100 on S130 (the read three quarters) reads READ', `${r.four[0].read} ${r.four[0].readShare}`, 'READ 0.75']); }
  cases.push(['HYB saving 90 on S370 alone moves nothing on S130', R({ hyb: { S370: 90 } }).v4, 'HELD']);
  { const fs = builtFiles({}); for (const k of ['S130 PCLSI', 'S130 PCLSI-TIE']) for (let j = 1900; j < 2000; j++) fs[k].survived[j] = 0; const r = items(fs, { b: PB }); REACHED[4].add(r.v4); cases.push(['no discordant path between SNAP, HYB and PCLSI on S130 reads SPLIT, item 4 INCONCLUSIVE', `${r.four[0].read} ${r.v4}`, 'SPLIT INCONCLUSIVE']); } EDGES.push('no discordant path on the deciding household');
  // the preconditions: a loser with no gap reads NO GAP; the split and the reading run
  { const fs = builtFiles({}); fs['S366 PCLSI'].tax = Float32Array.from(fs['S366 SNAP'].tax); const r = items(fs, { b: PB }); cases.push(['a loser whose PCLSI pays no extra tax reads NO GAP and item 2 INCONCLUSIVE', `${r.two.find(x => x.id === 'S366').read} ${r.v2}`, 'NO GAP INCONCLUSIVE']); } EDGES.push('a loser with no gap (NO GAP)');
  { const s = tailSplit({ N: 4, tax: [1, 1, 1, 1], net: [1, 1, 10, 10] }, { N: 4, tax: [1, 1, 3, 3], net: [1, 1, 3, 3] }, 4); cases.push(['the split counts a path above the cap in either arm as the tail, and puts the whole change there', `${s.tailShare} ${s.tailNet} ${s.tailTax} ${s.bodyT}`, '0.5 1 1 0']); }
  { const lines = []; const us = parse(builtLog({})); reading(builtFiles({}), us, l => lines.push(l), { b: PB }); cases.push(['the reading runs to its outcome', String(lines.some(l => /^\nOUTCOME: 1 HELD; 2 HELD; 3 HELD; 4 HELD$/.test(l))), 'true']); }
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
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3, 4].map(k => `OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagtail'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (units.filter(u => u.done).length < UNIT_KEYS.length) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNIT_KEYS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw });
  const tr = bad.length ? { bad: [], files: {} } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
  bad.push(...tr.bad);
  if (!bad.length && !process.argv.includes('--no-identity')) { const ad = adoptFiles(); bad.push(...ad.bad); if (!ad.bad.length) bad.push(...identity(tr.files, ad.files)); }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${UNIT_KEYS.length} units, each once and done, ADOPT-PI's settings and the arm's tables, read, tie margin and death tax on every ran line; each household's units on one access line and one set of paths; every per-path file present, stamped and holding its sum line; ${process.argv.includes('--no-identity') ? 'THE IDENTITY NOT RUN (--no-identity: a preflight only)' : 'the SNAP and PCLSI arms equal to ADOPT-PI\'s per-path files on every path (ADOPT-PI\'s files through their own gate)'}\n`);
  reading(tr.files, units);
}
