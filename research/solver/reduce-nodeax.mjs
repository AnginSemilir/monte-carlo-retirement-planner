/*
 * NODE-AX's READ (predictions/diag-nodeax.md; audit-nodeax.mjs; PLAN.md NODE-AX, O152).
 *   node research/solver/reduce-nodeax.mjs [dir=results/diagnodeax] [paths a world=2000] [scale=1] [--preflight] [--planted]
 * THE GATE (before any figure): the two jobs once each and done, every log stamped by one code, audit, prediction and
 *   sha, at the registered settings (paths a world, scale, seed 7002), each job's reference, nodes, grid, floor and
 *   support line in its solve's meta; armTook, nodeTook, readTook, ownTook and identity passed in full; the bridge's
 *   years printed; three worlds' tables, runs and ledger lines; every file the log's bits and every per-path array whole.
 *   In --preflight: also THE ARM'S REACH (O153): BN's own-opening tables must differ from BO's in some world.
 * THE ITEMS (per world, the per-path ledger in points; a mean's interval normal at z = the (1 - ALPHA / 4) quantile, a
 *   ratio's by the delta method on the paths; every threshold read on the figure rounded to 1e-9):
 *   0 (control): both arms reproduce NODE-1's: their own-opening tables NODE-1's to the printed digit in every world and
 *     their runs NODE-1's on these paths (NODE-1's first paths, read behind NODE-1's gate). HELD when all do; FALSIFIED
 *     when a table differs; INCONCLUSIVE when the tables agree and some run does not.
 *   1 (N2-SHARE): BN, worlds 0 and 1: of the bridge's grid residual GB (shown at least a point under: its top at most
 *     -1), the pension share's term AA as a share F = AA / GB. HELD when F's bottom is at least 0.5 in both; FALSIFIED
 *     when GB is shown and F's top is at most 0.25 in both; INCONCLUSIVE otherwise.
 *   2 (LATE): BN, worlds 0 and 1: of the pension share's term AA (shown at least half a point under), the part in years 3
 *     to 6, FL = AL / AA. HELD when FL's bottom is at least 0.5 in both; FALSIFIED when AA is shown and FL's top is at
 *     most 0.25 in both; INCONCLUSIVE otherwise.
 *   3 (the known positive): world 0, paired by path: BO's share term less BN's, DA. HELD when its top is at most -2.5 (the
 *     six-node cell's known fault seen); FALSIFIED when its bottom is at least -1.0 (the split misses it); INCONCLUSIVE
 *     otherwise.
 * THE CAUSES: N2-SHARE held on 1 HELD and not on 1 FALSIFIED, LATE held on 2 HELD and not on 2 FALSIFIED, each only
 *   with 0 and 3 HELD (the split reproduces the run and sees the known fault) and the clearance (the one-axis terms add:
 *   REST's mean at most half of GB's in size in worlds 0 and 1, printed); open otherwise.
 * REPORTED: per world and arm, OWN less runs = T + GB + GA (the identity of the means), GB's split (CASH, W, A, B, REST)
 *   and the largest of its terms, T's interval (the quadrature row), the late years' grid residual GL.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-nodeax.md';
export const SEED = '7002', NPW = 2000, ALPHA = 0.05;
export const Z = 2.241402727604947;   // the (1 - ALPHA / 4) normal quantile
export const SHOWN_G = -1, SHOWN_A = -0.5, F_HELD = 0.5, F_FALS = 0.25, KNOWN = -2.5, KNOWN_F = -1.0;
export const NODES_A = '0,0.2,0.4,0.6,0.7,0.75,0.8,0.825,0.85,0.875,0.9,0.925,0.95,0.975,1';
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'CASH', 'WA', 'AA', 'BA', 'REST', 'AL'];
export const JOBS = [['S360', 'BN', 60, 15], ['S360', 'BO', 60, 6]];
export const jobLabel = ([, arm, pts, sh]) => `${arm}/P${pts}S${sh}Q5`;
export const key = (id, label) => `${id} ${label}`;
export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const CASEL = /^(S360)\s+case \| job ((BN|BO)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^NODE-AX: .*, (\d+) paths a world, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, ledger: [], years: [[], [], []], cliff: [[], [], []], bridge: null, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label;
    let m;
    if ((m = new RegExp(`^solve CAND ${esc(L)}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^openings ${esc(L)}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^bridge ${esc(L)}: reader years (\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^ledger ${esc(L)} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^year ${esc(L)} (\\d) (\\d+): paths (\\d+) (.*)$`).exec(l))) j.years[Number(m[1])].push({ t: Number(m[2]), ...Object.fromEntries([...m[4].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])])) });
    else if ((m = new RegExp(`^cliff ${esc(L)} (\\d) (\\d+): (.*)$`).exec(l))) j.cliff[Number(m[1])].push({ t: Number(m[2]), text: m[3] });
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerSplit: 'null', readerBlend: 'null', readerRef: 'order', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3', floor: '5000' };
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], byKey = {};
  for (const j of jobs) { const k = key(j.id, j.label); (byKey[k] = byKey[k] || []).push(j); }
  for (const jb of JOBS) { const k = key(jb[0], jobLabel(jb)), n = (byKey[k] || []).length; if (n !== 1) bad.push(`${k}: ${n ? 'run ' + n + ' times' : 'missing'}`); }
  const st0 = jobs[0] && jobs[0].stamp;
  for (const j of jobs) {
    const k = key(j.id, j.label), reg = JOBS.find(jb => jb[0] === j.id && jobLabel(jb) === j.label);
    if (!reg) { bad.push(`${k}: not a registered job`); continue; }
    const pts = Math.max(4, Math.round(reg[2] / scale));
    if (!j.done) bad.push(`${k}: no done line`);
    if (!j.stamp || !st0 || ['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])) bad.push(`${k}: its stamp is not the other log's`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${k}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${k}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, pts: String(pts), grid: `total${pts}x${reg[3]}x6`, shareNodes: j.arm === 'BN' ? NODES_A : 'none' })) if (field(ran, f) !== v) bad.push(`${k}: ${f} is ${field(ran, f)}, not ${v}`);
    for (const c of ['armTook', 'nodeTook', 'readTook', 'ownTook', 'identity']) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || (c === 'armTook' && x[1] !== 1)) bad.push(`${k}: ${c} did not pass in full`); }
    if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${k}: the identity was not held on every path of three worlds`);
    if (!j.own) bad.push(`${k}: no openings line`);
    if (!j.solve) bad.push(`${k}: no solve line`);
    if (!j.bridge || !j.bridge.length) bad.push(`${k}: no bridge years printed`);
    for (let w = 0; w < 3; w++) {
      if (!j.tables[w] || !Number.isFinite(j.tables[w].OWN) || !Number.isFinite(j.tables[w].READ)) bad.push(`${k}: world ${w}'s tables are missing`);
      const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(`${k}: no OWN run of ${npw} paths at its opening in world ${w}`);
      if (!j.ledger[w] || KEYS.some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`${k}: world ${w}'s ledger line is missing or short`);
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) bad.push(`${k}: its file ${j.file} is missing`);
      else {
        if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${k}: its file is stamped by other code`);
        for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${k}: its file's ${b} bits are not the log's`); }
        for (let w = 0; w < 3; w++) for (const x of KEYS) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${k}: its file's ${x}${w} paths are not ${npw}`); }
      }
    }
  }
  return bad;
}
/* O153: the worlds in which BN's own-opening table differs from BO's (the preflight refuses none) */
export function reach(J) { const bn = J[key('S360', 'BN/P60S15Q5')], bo = J[key('S360', 'BO/P60S6Q5')]; return [0, 1, 2].filter(k => bn.tables[k].OWN !== bo.tables[k].OWN).length; }

// a mean's interval and a ratio's, in points
export function meanOf(a) { const n = a.length, m = a.reduce((t, x) => t + x, 0) / n, v = a.reduce((t, x) => t + (x - m) * (x - m), 0) / (n - 1); const se = Math.sqrt(v / n); return { m: q(m), lo: q(m - Z * se), hi: q(m + Z * se), se }; }
export function ratioOf(num, den) {
  const n = num.length, mn = num.reduce((t, x) => t + x, 0) / n, md = den.reduce((t, x) => t + x, 0) / n, F = mn / md;
  const r = num.map((x, i) => x - F * den[i]), mr = r.reduce((t, x) => t + x, 0) / n, v = r.reduce((t, x) => t + (x - mr) * (x - mr), 0) / (n - 1), se = Math.sqrt(v / n) / Math.abs(md);
  return { F: q(F), lo: q(F - Z * se), hi: q(F + Z * se) };
}
const pts = a => Array.from(a, x => 100 * x);
/* P(arm, name, world): the per-path array in points */
export function items(P, J, n1) {
  const out = {}, bn = J[key('S360', 'BN/P60S15Q5')], bo = J[key('S360', 'BO/P60S6Q5')];
  // item 0: NODE-1's tables and runs
  const t0 = n1 ? ['BN', 'BO'].every(arm => { const a = arm === 'BN' ? bn : bo, b = n1[arm]; return !!b && [0, 1, 2].every(k => !!b.tables[k] && a.tables[k].OWN === b.tables[k].OWN); }) : false;
  const r0 = n1 ? ['BN', 'BO'].every(arm => { const a = arm === 'BN' ? bn : bo, b = n1[arm]; return !!b && [0, 1, 2].every(k => b.runs && b.runs[k] === a.sims[`OWN${k}`].bits); }) : false;
  out['0'] = { outcome: !n1 ? 'INCONCLUSIVE' : !t0 ? 'FALSIFIED' : r0 ? 'HELD' : 'INCONCLUSIVE', tables: t0, runs: r0 };
  // item 1: the pension share's term in the bridge's grid residual, BN, worlds 0 and 1
  const c1 = [0, 1].map(k => { const G = meanOf(P('BN', 'GB', k)), F = ratioOf(P('BN', 'AA', k), P('BN', 'GB', k)), shown = G.hi <= SHOWN_G; return { k, G, F, shown }; });
  out['1'] = { outcome: c1.every(x => x.shown && x.F.lo >= F_HELD) ? 'HELD' : c1.every(x => x.shown && x.F.hi <= F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c1 };
  // item 2: the share term's late years, BN, worlds 0 and 1
  const c2 = [0, 1].map(k => { const A = meanOf(P('BN', 'AA', k)), F = ratioOf(P('BN', 'AL', k), P('BN', 'AA', k)), shown = A.hi <= SHOWN_A; return { k, A, F, shown }; });
  out['2'] = { outcome: c2.every(x => x.shown && x.F.lo >= F_HELD) ? 'HELD' : c2.every(x => x.shown && x.F.hi <= F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c2 };
  // item 3: BO's share term less BN's, world 0, paired by path
  const ao = P('BO', 'AA', 0), an = P('BN', 'AA', 0), D = meanOf(ao.map((x, i) => x - an[i]));
  out['3'] = { outcome: D.hi <= KNOWN ? 'HELD' : D.lo >= KNOWN_F ? 'FALSIFIED' : 'INCONCLUSIVE', D };
  out.clear = [0, 1].every(k => { const r = meanOf(P('BN', 'REST', k)).m, g = meanOf(P('BN', 'GB', k)).m; return Math.abs(r) <= q(0.5 * Math.abs(g)); });
  const ok = out['0'].outcome === 'HELD' && out['3'].outcome === 'HELD' && out.clear;
  out.causes = { 'N2-SHARE': ok ? ({ HELD: 'held', FALSIFIED: 'not' }[out['1'].outcome] || 'open') : 'open', LATE: ok ? ({ HELD: 'held', FALSIFIED: 'not' }[out['2'].outcome] || 'open') : 'open' };
  // reported: the identity of the means and the split, per arm and world
  out.split = ['BN', 'BO'].flatMap(arm => [0, 1, 2].map(k => { const m = x => meanOf(P(arm, x, k)); const r = Object.fromEntries(['B0', 'X', 'T', 'GB', 'GA', 'GL', 'CASH', 'WA', 'AA', 'BA', 'REST'].map(x => [x, m(x)]));
    const terms = { CASH: r.CASH.m, W: r.WA.m, A: r.AA.m, B: r.BA.m, REST: r.REST.m }, largest = Object.entries(terms).sort((p, s) => Math.abs(s[1]) - Math.abs(p[1]))[0][0];
    return { arm, k, ...r, gap: q(r.B0.m - r.X.m), closes: q(r.B0.m - r.X.m - r.T.m - r.GB.m - r.GA.m), largest }; }));
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), iv = x => `${f4(x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
export function report(P, J, n1) {
  const it = items(P, J, n1), L = [];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`0. both arms reproduce NODE-1's tables and runs: ${it['0'].outcome}`, `     tables ${it['0'].tables ? 'SAME' : 'DIFFERENT'}; runs ${it['0'].runs ? 'SAME' : 'DIFFERENT'}`);
  L.push(`1. the pension share carries at least half of BN's grid residual in the bridge, worlds 0 and 1 (N2-SHARE): ${it['1'].outcome}`, `     ${it['1'].cells.map(c => `world ${c.k}: GB ${iv(c.G)}, the share's part ${f4(c.F.F)} (${f4(c.F.lo)} to ${f4(c.F.hi)})`).join('; ')}`);
  L.push(`2. years 3 to 6 carry at least half of BN's share term, worlds 0 and 1 (LATE): ${it['2'].outcome}`, `     ${it['2'].cells.map(c => `world ${c.k}: AA ${iv(c.A)}, years 3 to 6 ${f4(c.F.F)} (${f4(c.F.lo)} to ${f4(c.F.hi)})`).join('; ')}`);
  L.push(`3. BO's share term exceeds BN's by at least 2.5 points in world 0 (the known positive): ${it['3'].outcome}`, `     BO less BN ${iv(it['3'].D)}`);
  L.push('', 'THE CAUSES (the registered map)', `   the one-axis terms add (BN's REST at most half of GB in size, worlds 0 and 1): ${it.clear ? 'YES' : 'NO'}`);
  for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);
  L.push('', 'REPORTED (points; OWN less runs = T + GB + GA, the means)');
  for (const s of it.split) L.push(`  ${s.arm} world ${s.k}: OWN less runs ${f4(s.gap)} = T ${iv(s.T)} + GB ${iv(s.GB)} + GA ${iv(s.GA)} (closes to ${f4(s.closes)}); GB = CASH ${f4(s.CASH.m)} + W ${f4(s.WA.m)} + A ${f4(s.AA.m)} + B ${f4(s.BA.m)} + REST ${f4(s.REST.m)}, the largest ${s.largest}; GL (years 3 to 6) ${f4(s.GL.m)}`);
  L.push(`REALISED item 1: ${f4(it['1'].cells[0].F.F)}`);
  L.push(`OUTCOME: ${['0', '1', '2', '3'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['0', '1', '2', '3'], REACHED = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() };
function planted() {
  const cases = [], N = 400;
  // a path array of mean m (points) and spread sd: half the paths at m + sd, half at m - sd, so the mean is m exactly
  const arr = (m, sd = 2) => Float64Array.from({ length: N }, (_, i) => (i % 2 ? m + sd : m - sd) / 100);
  const mkJ = (o = {}) => ({ [key('S360', 'BN/P60S15Q5')]: { arm: 'BN', tables: [0, 1, 2].map(k => ({ OWN: (o.bnT || [26.6, 47.0, 69.0])[k] })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { bits: `n${k}` }])) },
    [key('S360', 'BO/P60S6Q5')]: { arm: 'BO', tables: [0, 1, 2].map(k => ({ OWN: (o.boT || [23.6, 43.7, 66.2])[k] })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { bits: `o${k}` }])) } });
  const n1Of = (o = {}) => ({ BN: { tables: [0, 1, 2].map(k => ({ OWN: (o.bnT || [26.6, 47.0, 69.0])[k] })), runs: o.bnRuns || ['n0', 'n1', 'n2'] }, BO: { tables: [0, 1, 2].map(k => ({ OWN: (o.boT || [23.6, 43.7, 66.2])[k] })), runs: ['o0', 'o1', 'o2'] } });
  // the per-path ledger: BN's GB -2.2, AA -1.6 (0.73 of it), AL -1.2 (0.75 of AA); BO's AA -5.0
  const base = { BN: { GB: [-2.2, -2.2, -1], AA: [-1.6, -1.6, -0.6], AL: [-1.2, -1.2, -0.4], REST: [-0.3, -0.3, -0.1] }, BO: { GB: [-5, -5, -3.5], AA: [-5, -4.6, -3], AL: [-3, -3, -2] } };
  const Pof = (o = {}) => (arm, x, k) => { const v = (o[arm] && o[arm][x] && o[arm][x][k] !== undefined) ? o[arm][x][k] : (base[arm][x] ? base[arm][x][k] : 0); const sd = (o.sd && o.sd[`${arm}${x}`]) || 2; return pts(arr(v, sd)); };
  const run = (o = {}, jo = {}, n1o = {}, n1 = true) => items(Pof(o), mkJ(jo), n1 ? n1Of(n1o) : null);
  const outc = (i, o, jo, n1o, want, what, n1 = true) => { const got = run(o, jo, n1o, n1)[i].outcome; REACHED[i].add(got); cases.push([what, got, want]); };
  // item 0
  outc('0', {}, {}, {}, 'HELD', 'tables and runs NODE-1\'s: 0 HELD');
  outc('0', {}, {}, { bnT: [26.6, 47.0, 69.000001] }, 'FALSIFIED', 'BN\'s world 2 table a printed digit off NODE-1\'s: 0 FALSIFIED');
  outc('0', {}, {}, { bnRuns: ['n0', 'n1', 'x2'] }, 'INCONCLUSIVE', 'the tables alike, BN\'s world 2 runs not: 0 INCONCLUSIVE');
  outc('0', {}, {}, {}, 'INCONCLUSIVE', 'NODE-1 not read: 0 INCONCLUSIVE', false);
  // item 1
  outc('1', {}, {}, {}, 'HELD', 'the share term 0.73 of GB, its interval above 0.5: 1 HELD');
  outc('1', { BN: { AA: [-0.2, -0.2, -0.1] } }, {}, {}, 'FALSIFIED', 'the share term 0.09 of GB: 1 FALSIFIED');
  outc('1', { BN: { AA: [-1.0, -1.0, -0.5] } }, {}, {}, 'INCONCLUSIVE', 'the share term 0.45 of GB: 1 INCONCLUSIVE');
  outc('1', { BN: { AA: [-1.6, -0.2, -0.5] } }, {}, {}, 'INCONCLUSIVE', 'the share term half of GB in world 0 only: 1 INCONCLUSIVE');
  outc('1', { BN: { GB: [-0.8, -0.8, -1], AA: [-0.7, -0.7, -0.5] } }, {}, {}, 'INCONCLUSIVE', 'GB not shown a point under: 1 INCONCLUSIVE'); EDGES.push('a residual not shown');
  outc('1', { BN: { AA: [-1.6, -1.6, 0] } }, {}, {}, 'HELD', 'world 2\'s share term at zero: 1 reads worlds 0 and 1, HELD');
  { // the edges: GB's top exactly -1; F's bottom exactly 0.5; F's top exactly 0.25 (zero spread: the ratio's interval is its point)
    const se = 2 * Math.sqrt(N / (N - 1)) / Math.sqrt(N);
    outc('1', { BN: { GB: [-1 - Z * se, -1 - Z * se, -1], AA: [-1, -1, -0.5] } }, {}, {}, 'HELD', 'GB\'s top exactly -1 point, the share term all of it: 1 HELD'); EDGES.push('a residual\'s top exactly a point under');
    outc('1', { BN: { GB: [-1 - Z * se + 1e-6, -1 - Z * se, -1], AA: [-1, -1, -0.5] } }, {}, {}, 'INCONCLUSIVE', 'GB\'s top a millionth of a point over -1: 1 INCONCLUSIVE');
    outc('1', { BN: { GB: [-2, -2, -1], AA: [-1, -1, -0.5] }, sd: { BNGB: 1e-9, BNAA: 1e-9 } }, {}, {}, 'HELD', 'the share\'s part exactly 0.5 with no spread: 1 HELD'); EDGES.push('a share exactly at the HELD line');
    outc('1', { BN: { GB: [-2, -2, -1], AA: [-0.5, -0.5, -0.5] }, sd: { BNGB: 1e-9, BNAA: 1e-9 } }, {}, {}, 'FALSIFIED', 'the share\'s part exactly 0.25 with no spread: 1 FALSIFIED'); EDGES.push('a share exactly at the FALSIFIED line');
    outc('1', { BN: { GB: [-2, -2, -1], AA: [-0.5000001, -0.5, -0.5] }, sd: { BNGB: 1e-9, BNAA: 1e-9 } }, {}, {}, 'INCONCLUSIVE', 'the share\'s part a whisker over 0.25 in world 0: 1 INCONCLUSIVE'); }
  outc('1', { BN: { AA: [-3, -3, -1] } }, {}, {}, 'HELD', 'the share term past the whole (1.36 of GB): 1 HELD');
  // item 2
  outc('2', {}, {}, {}, 'HELD', 'years 3 to 6 0.75 of the share term: 2 HELD');
  outc('2', { BN: { AL: [-0.2, -0.2, 0] } }, {}, {}, 'FALSIFIED', 'years 3 to 6 0.13 of the share term: 2 FALSIFIED');
  outc('2', { BN: { AL: [-0.6, -0.6, 0] } }, {}, {}, 'INCONCLUSIVE', 'years 3 to 6 0.38 of the share term: 2 INCONCLUSIVE');
  outc('2', { BN: { AA: [-0.3, -0.3, 0], AL: [-0.3, -0.3, 0] } }, {}, {}, 'INCONCLUSIVE', 'the share term not shown half a point under: 2 INCONCLUSIVE');
  { const se = 2 * Math.sqrt(N / (N - 1)) / Math.sqrt(N); outc('2', { BN: { AA: [-0.5 - Z * se, -0.5 - Z * se, 0], AL: [-0.5 - Z * se, -0.5 - Z * se, 0] } }, {}, {}, 'HELD', 'the share term\'s top exactly half a point under, all in years 3 to 6: 2 HELD'); EDGES.push('a share term\'s top exactly half a point under'); }
  // item 3
  outc('3', {}, {}, {}, 'HELD', 'BO\'s share term 3.4 under BN\'s in world 0: 3 HELD');
  outc('3', { BO: { AA: [-1.9, -4.6, -3] } }, {}, {}, 'FALSIFIED', 'BO\'s share term 0.3 under BN\'s: 3 FALSIFIED');
  outc('3', { BO: { AA: [-3.6, -4.6, -3] } }, {}, {}, 'INCONCLUSIVE', 'BO\'s share term 2.0 under BN\'s: 3 INCONCLUSIVE');
  outc('3', { BO: { AA: [-4.1, -4.6, -3] }, sd: { BOAA: 1e-9, BNAA: 1e-9 } }, {}, {}, 'HELD', 'BO less BN exactly -2.5 with no spread: 3 HELD'); EDGES.push('a difference exactly at the known line');
  outc('3', { BO: { AA: [-2.6, -4.6, -3] }, sd: { BOAA: 1e-9, BNAA: 1e-9 } }, {}, {}, 'FALSIFIED', 'BO less BN exactly -1.0 with no spread: 3 FALSIFIED');
  outc('3', { BO: { AA: [-5, -1, -1] } }, {}, {}, 'HELD', 'worlds 1 and 2 alike: 3 reads world 0, HELD');
  // the causes
  const cz = (o, n1o, c) => run(o, {}, n1o)['causes'][c];
  cases.push(['1 and 2 HELD with 0 and 3: N2-SHARE held, LATE held', `${cz({}, {}, 'N2-SHARE')} ${cz({}, {}, 'LATE')}`, 'held held']);
  cases.push(['1 FALSIFIED, 2 FALSIFIED with 0 and 3: both not', `${cz({ BN: { AA: [-0.2, -0.2, 0], AL: [-0.02, -0.02, 0] } }, {}, 'N2-SHARE')} ${cz({ BN: { AA: [-1.6, -1.6, 0], AL: [-0.2, -0.2, 0] } }, {}, 'LATE')}`, 'not not']);
  cases.push(['3 FALSIFIED (the split misses the known fault): both open', `${cz({ BO: { AA: [-1.9, -4.6, -3] } }, {}, 'N2-SHARE')} ${cz({ BO: { AA: [-1.9, -4.6, -3] } }, {}, 'LATE')}`, 'open open']);
  cases.push(['0 FALSIFIED (not NODE-1\'s): both open', `${cz({}, { bnT: [26.6, 47.0, 69.000001] }, 'N2-SHARE')} ${cz({}, { bnT: [26.6, 47.0, 69.000001] }, 'LATE')}`, 'open open']);
  cases.push(['1 INCONCLUSIVE: N2-SHARE open', cz({ BN: { AA: [-1.0, -1.0, -0.5] } }, {}, 'N2-SHARE'), 'open']);
  cases.push(['1 HELD, REST over half of GB in world 1: both open (the terms do not add)', `${cz({ BN: { REST: [-0.3, -1.2, 0] } }, {}, 'N2-SHARE')} ${cz({ BN: { REST: [-0.3, -1.2, 0] } }, {}, 'LATE')}`, 'open open']);
  cases.push(['REST exactly half of GB in size: the clearance holds', run({ BN: { REST: [1.1, -1.1, 0] } }).clear, true]); EDGES.push('a cross term exactly half the residual');
  cases.push(['REST a whisker over half of GB: the clearance fails', run({ BN: { REST: [-1.1000001, -0.3, 0] } }).clear, false]);
  { const rd = o => (report(Pof(o), mkJ(), n1Of()).find(l => l.includes('the one-axis terms add')) || '').trim().split(': ').pop(); cases.push(['the read prints the clearance: YES, then NO with REST over half', `${rd({})} ${rd({ BN: { REST: [-2, -2, 0] } })}`, 'YES NO']); }
  // the ratio and the split
  { const r = ratioOf(Float64Array.from([1, 3, 1, 3]), Float64Array.from([2, 6, 2, 6])); cases.push(['a ratio of proportional paths: its point and a zero-width interval', `${r.F} ${r.lo} ${r.hi}`, '0.5 0.5 0.5']); }
  { const it = run({ BN: { B0: [26.6, 47, 69], X: [28.8, 48.9, 69.9], T: [0, 0.1, 0.1], GB: [-2.2, -2.2, -1], GA: [0, 0, 0.0] } }); const s = it.split[0]; cases.push(['the split: OWN less runs, the closing, the largest term (A when CASH, W, B, REST are 0)', `${s.gap} ${s.closes} ${s.largest}`, `${q(26.6 - 28.8)} ${q(26.6 - 28.8 - 0 + 2.2)} A`]); }
  // the arm's reach (O153)
  cases.push(['BN\'s tables BO\'s in every world: reach 0', reach(mkJ({ bnT: [23.6, 43.7, 66.2] })), 0]);
  cases.push(['BN\'s tables moved in world 2 only: reach 1', reach(mkJ({ bnT: [23.6, 43.7, 69] })), 1]); EDGES.push('an arm equal to its control everywhere');
  // the read end to end
  { let lines = [], err = null; try { lines = report(Pof({}), mkJ(), n1Of()); } catch (e) { err = e.message; }
    const oc = lines.find(l => l.startsWith('OUTCOME: ')) || '';
    cases.push(['the read prints four items, two causes, six split lines, REALISED and an OUTCOME of four items, end to end', err || `${['0.', '1.', '2.', '3.'].every(p => lines.some(l => l.startsWith(p)))} ${lines.filter(l => l.startsWith('=> ')).length} ${lines.filter(l => /^  B[NO] world \d: OWN less runs/.test(l)).length} ${lines.some(l => l.startsWith('REALISED item 1: '))} ${oc.split(', ').length}`, 'true 2 6 true 4']); }
  // the gate, on synthetic logs built as the audit prints
  const pad = ''.padEnd(16), G0 = { npw: 4, scale: 15 };
  const jobText = (jb, o = {}) => {
    const [id, arm, pts0, sh] = jb, L = jobLabel(jb), pts = o.pts || Math.max(4, Math.round(pts0 / 15));
    const ran = `bridgeRead reader bridgeStep exact readerSplit null readerBlend null readerRef ${o.ref || 'order'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls ${o.e3 || 'true'} switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${pts} grid ${o.grid || `total${pts}x${sh}x6`} shareNodes ${o.nodes || (arm === 'BN' ? NODES_A : 'none')} floor ${o.floor || 5000} line 0.5`;
    const out = [`${id.padEnd(16)} case | job ${L} | points ${o.casePts || pts} | lambda 0.0223606797749979`, `${pad} solve CAND ${L}: table 40.0000 secs 10`, `${pad} ran CAND ${L}: ${ran}`, `${pad} checks ${L}: armTook ${o.armTook !== undefined ? o.armTook : 1}/1`, `${pad} openings ${L}: OWN ai 12 level 0.8 tiers 0,0`];
    if (!o.noBridge) out.push(`${pad} bridge ${L}: reader years 1,2,3,4,5,6,7`);
    out.push(`${pad} checks ${L}: nodeTook ${o.node || 30}/30 readTook ${o.read || 20}/${o.readN !== undefined ? o.readN : 20}`);
    for (let k = 0; k < 3; k++) {
      if (o.dropTable !== k) out.push(`${pad} tables ${L} ${k} z 0.000000 weight 0.333333: OWN 40.000000 READ 39.000000`);
      if (o.dropLedger !== k) out.push(`${pad} ledger ${L} ${k}: ${KEYS.map(x => `${x} 0.100000`).join(' ')}`);
      if (o.dropRun !== k) out.push(`${pad} sim ${L} ${k} OWN ai 12: 2/${o.runN || 4} bridge ${o.bridge || 2} bits aa bb`);
    }
    out.push(`${pad} checks ${L}: ownTook ${o.own || 12}/12 identity ${o.ident || 12}/${o.identN || 12} secs 1`, `${pad} file ${L}: ${id}-${L.replace(/\//g, '-')}.json.gz`);
    if (!o.noDone) out.push(`${pad} done ${L}`);
    return out.join('\n');
  };
  const logOf = (jb, o = {}) => `stamp: code ${o.code || 'c0'} audit a0 prediction p0 sha s0\nNODE-AX: the candidate's own unit, ${o.headN || 4} paths a world, wealth points divided by ${o.headScale || 15} (seed ${o.seed || 7002}); 2 jobs; part 0/2\n${jobText(jb, o)}\n`;
  const all = (ov = {}) => JOBS.flatMap(jb => parse(logOf(jb, ov[jobLabel(jb)] || {}))).concat(ov.extra ? parse(logOf(JOBS[0])) : []);
  const refuses = (what, jobs, opt = {}) => cases.push([`the gate refuses ${what}`, gate(jobs, { ...G0, ...opt }).length > 0, true]);
  const KN = jobLabel(JOBS[0]), KB = jobLabel(JOBS[1]);
  cases.push(['the gate passes the two jobs as registered', gate(all(), G0).length, 0]);
  cases.push(['the gate refuses a missing job', gate(all().slice(1), G0).length > 0, true]);
  refuses('a job run twice', all({ extra: true }));
  refuses('a job with no done line', all({ [KB]: { noDone: true } }));
  refuses('a stamp from other code', all({ [KB]: { code: 'c9' } }));
  refuses('another seed', all({ [KN]: { seed: 7003 }, [KB]: { seed: 7003 } }));
  refuses('another path count in the head', all({ [KN]: { headN: 5 } }));
  refuses('another scale in the head', all({ [KN]: { headScale: 20 } }));
  refuses('a case line at other points than its solve', all({ [KB]: { casePts: 5 } }));
  refuses('BN without its nodes in the meta', all({ [KN]: { nodes: 'none' } }));
  refuses('BO with nodes in the meta', all({ [KB]: { nodes: NODES_A } }));
  refuses('BN on six shares', all({ [KN]: { grid: 'total4x6x6' } }));
  refuses('another reference', all({ [KB]: { ref: 'null' } }));
  refuses('e3pcls off', all({ [KN]: { e3: 'false' } }));
  refuses('another floor', all({ [KB]: { floor: 6000 } }));
  refuses('armTook failed', all({ [KN]: { armTook: 0 } }));
  refuses('nodeTook short', all({ [KN]: { node: 29 } }));
  refuses('readTook short', all({ [KB]: { read: 19 } }));
  refuses('readTook over no case', all({ [KB]: { read: 0, readN: 0 } }));
  refuses('ownTook short', all({ [KN]: { own: 11 } }));
  refuses('the identity short', all({ [KB]: { ident: 11 } }));
  refuses('the identity over fewer paths than three worlds\'', all({ [KB]: { ident: 9, identN: 9 } }));
  refuses('no bridge years', all({ [KN]: { noBridge: true } }));
  refuses('a missing table in world 1', all({ [KN]: { dropTable: 1 } }));
  refuses('a missing ledger line in world 2', all({ [KB]: { dropLedger: 2 } }));
  refuses('a missing run in world 2', all({ [KB]: { dropRun: 2 } }));
  refuses('runs on other paths than registered', all({ [KB]: { runN: 5 } }));
  refuses('fewer paying the bridge than surviving', all({ [KB]: { bridge: 1 } }));
  { const jobs = all(), files = {}, shOf = s => sha16(Buffer.from(s, 'base64')), per = Object.fromEntries([0, 1, 2].flatMap(w => KEYS.map(x => [`${x}${w}`, Buffer.from(new Float64Array(4).buffer).toString('base64')])));
    for (const j of jobs) { const bits = {}; Object.keys(j.sims).forEach(nm => { bits[nm] = 'AAAA'; bits[`${nm}b`] = 'AQAA'; }); files[j.file] = { stamp: j.stamp, bits, per }; Object.values(j.sims).forEach(s => { s.bits = shOf('AAAA'); s.bitsB = shOf('AQAA'); }); }
    cases.push(['the gate passes files whose bits and paths are the log\'s', gate(jobs, { ...G0, files }).length, 0]);
    refuses('a missing file', jobs, { files: { ...files, [jobs[1].file]: undefined } });
    refuses('a file stamped by other code', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], stamp: { ...jobs[0].stamp, code: 'c9' } } } });
    refuses('a file whose bits are not the log\'s', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], bits: { ...files[jobs[0].file].bits, OWN1b: 'AgAA' } } } });
    refuses('a file short of one path array', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], per: { ...per, AA1: Buffer.from(new Float64Array(3).buffer).toString('base64') } } } }); }
  const bad = cases.filter(([, got, want]) => got !== want);
  for (const [what, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'BAD '} ${what}: ${JSON.stringify(got)}`);
  if (bad.length) { console.log(`PLANTED CHECK FAILED (${bad.length})`); process.exit(1); }
  const short = ITEMS.filter(i => REACHED[i].size < 3);
  if (short.length) { console.log(`PLANTED CHECK FAILED: items not planted to all three outcomes: ${short.map(i => `${i} (${[...REACHED[i]].join(', ')})`).join('; ')}`); process.exit(1); }
  if (EDGES.length < 2) { console.log('PLANTED CHECK FAILED: fewer than two edges'); process.exit(1); }
  return cases.length;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (const i of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagnodeax'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  let n1 = null;
  if (!PRE) {
    // NODE-1's tables and runs, behind NODE-1's own reducer gate (its main, over its folder); its runs cut to these paths
    const DN = join(HERE, 'results', 'diagnode1'), red = spawnSync('node', [join(HERE, 'reduce-node1.mjs'), DN], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) bad.push('NODE-1\'s files did not pass NODE-1\'s gate');
    else {
      const N1 = await import('./reduce-node1.mjs'), nj = readdirSync(DN).filter(f => /^case\d+\.txt$/.test(f)).flatMap(f => N1.parse(readFileSync(join(DN, f), 'utf8')));
      const nf = Object.fromEntries(readdirSync(DN).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DN, f))).toString())]));
      n1 = Object.fromEntries(['BN', 'BO'].map(arm => { const j = nj.find(x => x.arm === arm); return [arm, j ? { tables: j.tables, runs: [0, 1, 2].map(k => sha16(Buffer.from(nf[j.file].bits[`OWN${k}`], 'base64').subarray(0, npwA))) } : null]; }));
    }
  }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.label), j]));
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the two jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); each job's reference, nodes and grid in its solve's meta; every self-check passed in full (armTook, nodeTook, readTook, ownTook, identity); every file the log's${PRE ? '' : '; NODE-1\'s files behind NODE-1\'s gate'}`);
  const rc = reach(J);
  console.log(`ARM'S REACH (O153): BN's own-opening tables differ from BO's in ${rc} of 3 worlds`);
  if (rc === 0) { console.log('REFUSED: the arm equals its control in every world, so it cannot reach the mechanism (O153)'); process.exit(1); }
  if (PRE) { console.log('PREFLIGHT: the gate, the files and the arm\'s reach read; no figure is read'); process.exit(0); }
  const P = (arm, x, k) => { const j = J[key('S360', arm === 'BN' ? 'BN/P60S15Q5' : 'BO/P60S6Q5')], b = Buffer.from(files[j.file].per[`${x}${k}`], 'base64'); return pts(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length))); };
  console.log('\nNODE-AX: S360\'s grid residual under the dense share nodes (BN) and six shares (BO), split by year and axis (predictions/diag-nodeax.md)');
  for (const L of report(P, J, n1)) console.log(L);
  for (const j of jobs) for (let k = 0; k < 3; k++) for (const c of j.cliff[k]) console.log(`  cliff ${j.arm} world ${k} year ${c.t}: ${c.text}`);
}
