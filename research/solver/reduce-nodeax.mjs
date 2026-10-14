/*
 * NODE-AX's READ (predictions/diag-nodeax.md; audit-nodeax.mjs; PLAN.md NODE-AX, O152).
 *   node research/solver/reduce-nodeax.mjs [dir=results/diagnodeax] [paths a world=2000] [scale=1] [--preflight] [--planted]
 * THE GATE (before any figure): the two jobs once each and done, every log stamped by one code, audit, prediction and
 *   sha, at the registered settings (paths a world, scale, seed 7002), each job's reference, nodes, grid, floor and
 *   support line in its solve's meta; armTook, ownTook, identity, qfTook and layerTook passed in full (the identity on every path of
 *   three worlds, qfTook on some visit); the bridge's years printed; three worlds' tables, runs, ledger, de-risk, QF and
 *   tier-layer lines; every file the log's bits, every per-path array whole (the seven sums, one per bridge year, the
 *   path-year counts, QF on its paths) and its bridge path records with their G, B and QF columns.
 *   In --preflight: also THE ARM'S REACH (O153): BN's own-opening tables must differ from BO's in some world.
 * THE ITEMS (re-cut after the escalation review, escalations/14-Oct-bridge-under-read-report.md; per world, the per-path
 *   ledger in points; a mean's interval normal at z = the (1 - ALPHA / 4) quantile, a ratio's by the delta method on the
 *   paths; every threshold read on the figure rounded to 1e-9):
 *   0 (control): both arms reproduce NODE-1's: their own-opening tables NODE-1's to the printed digit in every world and
 *     their runs NODE-1's (NODE-1's files behind NODE-1's gate). HELD when all do; FALSIFIED when a table differs;
 *     INCONCLUSIVE when the tables agree and some run does not.
 *   1 (the bridge grid): BN's bridge-years grid residual GB in worlds 0 and 1. HELD when its top is at most -1 in both;
 *     FALSIFIED when its bottom is at least -0.5 in both; INCONCLUSIVE otherwise.
 *   2 (the late years): BN's F_L = GL / GB (GL the residual in years 4 to 6), worlds 0 and 1, read only when item 1 is
 *     HELD (otherwise INCONCLUSIVE, not read). HELD when its bottom is at least 0.5 in both; FALSIFIED when its top is at
 *     most 0.25 in both; INCONCLUSIVE otherwise.
 *   3 (the known positive, exact): world 0, paired by path: BO's GB less BN's. HELD when its top is at most -1.5 (half of
 *     NODE-1's lift); FALSIFIED when its bottom is at least -0.5; INCONCLUSIVE otherwise.
 *   4 (the de-risked layers; added before launch on the deep review of 14 Oct 18:51 UK, year-matched on its review of
 *     21:00 UK): BN's year-matched excess E = GD - sum_t s_t Y_t per path (s_t the de-risked layers' share of year t's
 *     bridge path-years, from the bridge path records, read as constants), over GB: mean(E) / mean(GB) by the delta
 *     method, worlds 0 and 1, read only when item 1 is HELD (otherwise INCONCLUSIVE, not read). HELD when its bottom is at
 *     least 0.25 in both; FALSIFIED when its top is at most 0.05 in both; INCONCLUSIVE otherwise.
 *   R5's condition (not an item): item 1 INCONCLUSIVE with GB's top at most -0.5 in worlds 0 and 1 (a partial grid term).
 *   R0's state-matched condition (not an item): per world 0 and 1, the de-risked records' mean G less the plan layer's
 *     within cells of year and B_t decile (ranks within the year), weighted by the de-risked records, over the cells
 *     holding at least two of each (points a path-year); YES when its interval's top is under 0 in both.
 * THE CAUSES: N2-GRID (the bridge grid carries BN's remainder) held on 1 HELD and not on 1 FALSIFIED, with 0 and 3 HELD;
 *   N2-LATE held on 2 HELD and not on 2 FALSIFIED, with 0, 1 and 3 HELD; N2-LAYER held on 4 HELD with R0's state-matched
 *   condition YES, and not on 4 FALSIFIED, with 0, 1 and 3 HELD; open otherwise.
 * REPORTED: per arm and world, OWN less runs = T + GB + GA (the identity of the means); the residual by bridge year with
 *   its interval, year 7 (the step year) on its own line; QF (the bridge years' quadrature term, first 1,000 paths) with
 *   its interval; by tier layer held; the cliff lines.
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
export const SEED = '7002', NPW = 4000, ALPHA = 0.05;
export const Z = 2.241402727604947;   // the (1 - ALPHA / 4) normal quantile
export const G_HELD = -1, G_FALS = -0.5, F_HELD = 0.5, F_FALS = 0.25, KNOWN = -1.5, KNOWN_F = -0.5, D_HELD = 0.25, D_FALS = 0.05, G_PART = -0.5, NQF = 1000;
export const NODES_A = '0,0.2,0.4,0.6,0.7,0.75,0.8,0.825,0.85,0.875,0.9,0.925,0.95,0.975,1';
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
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
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, ledger: [], years: [[], [], []], cliff: [[], [], []], layers: [[], [], []], derisk: [], qf: [], bridge: null, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label;
    let m;
    if ((m = new RegExp(`^solve CAND ${esc(L)}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^openings ${esc(L)}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^bridge ${esc(L)}: reader years ?(\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^ledger ${esc(L)} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^year ${esc(L)} (\\d) (\\d+): paths (\\d+) (.*)$`).exec(l))) j.years[Number(m[1])].push({ t: Number(m[2]), ...Object.fromEntries([...m[4].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])])) });
    else if ((m = new RegExp(`^cliff ${esc(L)} (\\d) (\\d+): (.*)$`).exec(l))) j.cliff[Number(m[1])].push({ t: Number(m[2]), text: m[3] });
    else if ((m = new RegExp(`^layer ${esc(L)} (\\d) (\\d+): bridge path-years (\\S+) G (\\S+)$`).exec(l))) j.layers[Number(m[1])][Number(m[2])] = { n: Number(m[3]), G: Number(m[4]) };
    else if ((m = new RegExp(`^derisk ${esc(L)} (\\d): plan layer (\\d+) bridge path-years (\\S+) de-risked (\\S+) GD (\\S+)$`).exec(l))) j.derisk[Number(m[1])] = { li0: Number(m[2]), NB: Number(m[3]), ND: Number(m[4]), GD: Number(m[5]) };
    else if ((m = new RegExp(`^qf ${esc(L)} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
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
    for (const c of ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook']) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || (c === 'armTook' && x[1] !== 1)) bad.push(`${k}: ${c} did not pass in full`); }
    if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${k}: the identity was not held on every path of three worlds`);
    if (!j.own) bad.push(`${k}: no openings line`);
    if (!j.solve) bad.push(`${k}: no solve line`);
    if (!j.bridge || !j.bridge.length) bad.push(`${k}: no bridge years printed`);
    for (let w = 0; w < 3; w++) {
      if (!j.tables[w] || !Number.isFinite(j.tables[w].OWN) || !Number.isFinite(j.tables[w].READ)) bad.push(`${k}: world ${w}'s tables are missing`);
      const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(`${k}: no OWN run of ${npw} paths at its opening in world ${w}`);
      const YK = (j.bridge || []).map(t => `Y${t}`);
      if (!j.ledger[w] || [...KEYS, ...YK].some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`${k}: world ${w}'s ledger line is missing or short`);
      if (j.layers[w].length !== 3 || [0, 1, 2].some(li => !j.layers[w][li])) bad.push(`${k}: world ${w}'s tier-layer lines are not three`);
      if (!j.derisk[w] || !(j.derisk[w].NB > 0) || !Number.isFinite(j.derisk[w].ND)) bad.push(`${k}: world ${w}'s de-risk line is missing or over no path-year`);
      if (!j.qf[w] || j.qf[w].n !== Math.min(npw, NQF) || !Number.isFinite(j.qf[w].QF)) bad.push(`${k}: world ${w}'s QF line is missing or not on ${Math.min(npw, NQF)} paths`);
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) bad.push(`${k}: its file ${j.file} is missing`);
      else {
        if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${k}: its file is stamped by other code`);
        for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${k}: its file's ${b} bits are not the log's`); }
        for (let w = 0; w < 3; w++) for (const x of [...KEYS, ...(j.bridge || []).map(t => `Y${t}`), 'NB', 'ND']) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${k}: its file's ${x}${w} paths are not ${npw}`); }
        for (let w = 0; w < 3; w++) { const a = f.per && f.per[`QF${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * Math.min(npw, NQF)) bad.push(`${k}: its file's QF${w} paths are not ${Math.min(npw, NQF)}`); }
        const pr = f.paths, nm = pr && pr.meta ? Buffer.from(pr.meta, 'base64').length / 4 : 0, ns = pr && pr.states ? Buffer.from(pr.states, 'base64').length / 4 : 0;
        if (!pr || !(nm > 0) || !(pr.dim > 0) || ns !== pr.dim * nm / 7) bad.push(`${k}: its file's bridge path records are missing or not whole`);
        else for (const col of ['G', 'B', 'Q']) if (!pr[col] || Buffer.from(pr[col], 'base64').length !== 4 * nm / 7) bad.push(`${k}: its bridge path records' ${col} column is missing or not one a record`);
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
/* P(arm, name, world): the per-path array in points; years: the bridge years (one list, or one an arm) */
/* R(arm, world): the bridge path records { year, layer, G, B, li0 } (G and B in probability units) */
export function items(P, J, n1, years = [1, 2, 3, 4, 5, 6, 7], R = null) {
  const out = {}, bn = J[key('S360', 'BN/P60S15Q5')], bo = J[key('S360', 'BO/P60S6Q5')];
  // item 0: NODE-1's tables and runs
  const t0 = n1 ? ['BN', 'BO'].every(arm => { const a = arm === 'BN' ? bn : bo, b = n1[arm]; return !!b && [0, 1, 2].every(k => !!b.tables[k] && a.tables[k].OWN === b.tables[k].OWN); }) : false;
  const r0 = n1 ? ['BN', 'BO'].every(arm => { const a = arm === 'BN' ? bn : bo, b = n1[arm]; return !!b && [0, 1, 2].every(k => b.runs && b.runs[k] === a.sims[`OWN${k}`].bits); }) : false;
  out['0'] = { outcome: !n1 ? 'INCONCLUSIVE' : !t0 ? 'FALSIFIED' : r0 ? 'HELD' : 'INCONCLUSIVE', tables: t0, runs: r0 };
  // item 1: BN's bridge-years grid residual, worlds 0 and 1
  const c1 = [0, 1].map(k => ({ k, G: meanOf(P('BN', 'GB', k)) }));
  out['1'] = { outcome: c1.every(x => x.G.hi <= G_HELD) ? 'HELD' : c1.every(x => x.G.lo >= G_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c1 };
  // item 2: the late years' part of it, read only when item 1 is HELD
  const c2 = [0, 1].map(k => ({ k, F: ratioOf(P('BN', 'GL', k), P('BN', 'GB', k)) })), read2 = out['1'].outcome === 'HELD';
  out['2'] = { outcome: !read2 ? 'INCONCLUSIVE' : c2.every(x => x.F.lo >= F_HELD) ? 'HELD' : c2.every(x => x.F.hi <= F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c2, read: read2 };
  // item 3: BO's bridge residual less BN's, world 0, paired by path
  const go = P('BO', 'GB', 0), gn = P('BN', 'GB', 0), D = meanOf(go.map((x, i) => x - gn[i]));
  out['3'] = { outcome: D.hi <= KNOWN ? 'HELD' : D.lo >= KNOWN_F ? 'FALSIFIED' : 'INCONCLUSIVE', D };
  // item 4: the de-risked layers' year-matched excess over GB, read only when item 1 is HELD
  const yrsBN = Array.isArray(years) ? years : years.BN;
  const c4 = [0, 1].map(k => {
    const r = R('BN', k), st = {}, nt = {};
    for (let x = 0; x < r.year.length; x++) { const t = r.year[x]; nt[t] = (nt[t] || 0) + 1; if (r.layer[x] !== r.li0) st[t] = (st[t] || 0) + 1; }
    const sOf = t => (nt[t] ? (st[t] || 0) / nt[t] : 0), GD = P('BN', 'GD', k), Ys = yrsBN.map(t => [sOf(t), P('BN', `Y${t}`, k)]);
    const E = GD.map((g, i) => Ys.reduce((a, [sv, Y]) => a - sv * Y[i], g)), F = ratioOf(E, P('BN', 'GB', k));
    return { k, F, Sw: q(Ys.reduce((a, [sv, Y]) => a + sv * Y.reduce((u, v) => u + v, 0), 0) / P('BN', 'GB', k).reduce((u, v) => u + v, 0)), lo: F.lo, hi: F.hi };
  });
  out['4'] = { outcome: !read2 ? 'INCONCLUSIVE' : c4.every(x => x.lo >= D_HELD) ? 'HELD' : c4.every(x => x.hi <= D_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c4, read: read2 };
  // R0's state-matched condition: de-risked less plan-layer G within year x B-decile cells (points a path-year)
  const smOf = k => {
    const r = R('BN', k), byT = {};
    for (let x = 0; x < r.year.length; x++) (byT[r.year[x]] = byT[r.year[x]] || []).push(x);
    let wsum = 0, D = 0, V = 0, nc = 0;
    for (const xs of Object.values(byT)) {
      const ord = [...xs].sort((u, v) => r.B[u] - r.B[v]), cells = {};
      ord.forEach((x, rk) => { const c = Math.floor(rk * 10 / ord.length); (cells[c] = cells[c] || { d: [], p: [] })[r.layer[x] !== r.li0 ? 'd' : 'p'].push(100 * r.G[x]); });
      for (const c of Object.values(cells)) {
        if (c.d.length < 2 || c.p.length < 2) continue;
        const m = a => a.reduce((u, v) => u + v, 0) / a.length, vr = a => { const mm = m(a); return a.reduce((u, v) => u + (v - mm) * (v - mm), 0) / (a.length - 1); };
        const w = c.d.length; D += w * (m(c.d) - m(c.p)); V += w * w * (vr(c.d) / c.d.length + vr(c.p) / c.p.length); wsum += w; nc++;
      }
    }
    if (!nc) return { k, D: NaN, lo: NaN, hi: NaN, cells: 0 };
    const d = D / wsum, se = Math.sqrt(V) / wsum;
    return { k, D: q(d), lo: q(d - Z * se), hi: q(d + Z * se), cells: nc };
  };
  out.sm = { cells: [0, 1].map(smOf) }; out.sm.yes = out.sm.cells.every(c => c.cells > 0 && c.hi < 0);
  // R5's condition: a partial grid term
  out['1'].partial = out['1'].outcome === 'INCONCLUSIVE' && c1.every(x => x.G.hi <= G_PART);
  const ok03 = out['0'].outcome === 'HELD' && out['3'].outcome === 'HELD';
  out.causes = { 'N2-GRID': ok03 ? ({ HELD: 'held', FALSIFIED: 'not' }[out['1'].outcome] || 'open') : 'open', 'N2-LATE': ok03 ? ({ HELD: 'held', FALSIFIED: 'not' }[out['2'].outcome] || 'open') : 'open', 'N2-LAYER': ok03 ? (out['4'].outcome === 'HELD' ? (out.sm.yes ? 'held' : 'open') : out['4'].outcome === 'FALSIFIED' ? 'not' : 'open') : 'open' };   // item 2 is read only when item 1 is HELD
  // reported: the identity of the means, and the residual by bridge year
  out.split = ['BN', 'BO'].flatMap(arm => [0, 1, 2].map(k => { const m = x => meanOf(P(arm, x, k)); const r = Object.fromEntries(['B0', 'X', 'T', 'GB', 'GA', 'GL'].map(x => [x, m(x)]));
    const qf = meanOf(P(arm, 'QF', k));
    return { arm, k, ...r, qf, gap: q(r.B0.m - r.X.m), closes: q(r.B0.m - r.X.m - r.T.m - r.GB.m - r.GA.m), years: (Array.isArray(years) ? years : years[arm]).map(t => ({ t, ...m(`Y${t}`) })) }; }));
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), iv = x => `${f4(x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
export function report(P, J, n1, years = [1, 2, 3, 4, 5, 6, 7], R = null) {
  const it = items(P, J, n1, years, R), L = [];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`0. both arms reproduce NODE-1's tables and runs: ${it['0'].outcome}`, `     tables ${it['0'].tables ? 'SAME' : 'DIFFERENT'}; runs ${it['0'].runs ? 'SAME' : 'DIFFERENT'}`);
  L.push(`1. BN's bridge-years grid residual is at least a point under in worlds 0 and 1 (the bridge grid): ${it['1'].outcome}`, `     ${it['1'].cells.map(c => `world ${c.k}: GB ${iv(c.G)}`).join('; ')}`);
  L.push(`2. years 4 to 6 carry at least half of it, worlds 0 and 1 (the late years): ${it['2'].outcome}${it['2'].read ? '' : ' (not read: item 1 not HELD)'}`, `     ${it['2'].cells.map(c => `world ${c.k}: years 4 to 6 ${f4(c.F.F)} (${f4(c.F.lo)} to ${f4(c.F.hi)})`).join('; ')}`);
  L.push(`3. BO's bridge residual exceeds BN's by at least 1.5 points in world 0 (the known positive): ${it['3'].outcome}`, `     BO less BN ${iv(it['3'].D)}`);
  L.push(`4. the de-risked layers carry at least a quarter of BN's bridge residual past their year-matched share, worlds 0 and 1: ${it['4'].outcome}${it['4'].read ? '' : ' (not read: item 1 not HELD)'}`, `     ${it['4'].cells.map(c => `world ${c.k}: the year-matched excess ${f4(c.F.F)} (${f4(c.lo)} to ${f4(c.hi)}) over GB, the year-matched share ${f4(c.Sw)}`).join('; ')}`);
  L.push(`R0 STATE-MATCHED CONDITION (de-risked less plan-layer G within year and B decile, points a path-year, top under 0 in worlds 0 and 1): ${it.sm.yes ? 'YES' : 'NO'}`, `     ${it.sm.cells.map(c => `world ${c.k}: ${f4(c.D)} (${f4(c.lo)} to ${f4(c.hi)}) over ${c.cells} cells`).join('; ')}`);
  L.push(`R5 CONDITION (item 1 INCONCLUSIVE with GB's top at most -0.5 in worlds 0 and 1): ${it['1'].partial ? 'YES' : 'NO'}`);
  L.push('', 'THE CAUSES (the registered map)');
  for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);
  L.push('', 'REPORTED (points; OWN less runs = T + GB + GA, the means)');
  for (const s of it.split) { const y7 = s.years.find(y => y.t === 7); L.push(`  ${s.arm} world ${s.k}: QF ${iv(s.qf)} (the bridge years' quadrature term, first ${Math.min(NQF, P(s.arm, 'QF', s.k).length)} paths); year 7 apart: ${y7 ? iv(y7) : 'not a bridge year'}`); }
  for (const s of it.split) L.push(`  ${s.arm} world ${s.k}: OWN less runs ${f4(s.gap)} = T ${iv(s.T)} + GB ${iv(s.GB)} + GA ${iv(s.GA)} (closes to ${f4(s.closes)}); by bridge year ${s.years.map(y => `${y.t} ${f4(y.m)}`).join(', ')}`);
  L.push(`REALISED item 1: ${f4(it['1'].cells[0].G.m)}`);
  L.push(`OUTCOME: ${['0', '1', '2', '3', '4'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['0', '1', '2', '3', '4'], REACHED = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
function planted() {
  const cases = [], N = 400;
  // a path array of mean m (points) and spread sd: half the paths at m + sd, half at m - sd, so the mean is m exactly
  const arr = (m, sd = 2) => Float64Array.from({ length: N }, (_, i) => (i % 2 ? m + sd : m - sd) / 100);
  const mkJ = (o = {}) => ({ [key('S360', 'BN/P60S15Q5')]: { arm: 'BN', tables: [0, 1, 2].map(k => ({ OWN: (o.bnT || [26.6, 47.0, 69.0])[k] })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { bits: `n${k}` }])) },
    [key('S360', 'BO/P60S6Q5')]: { arm: 'BO', tables: [0, 1, 2].map(k => ({ OWN: (o.boT || [23.6, 43.7, 66.2])[k] })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { bits: `o${k}` }])) } });
  const n1Of = (o = {}) => ({ BN: { tables: [0, 1, 2].map(k => ({ OWN: (o.bnT || [26.6, 47.0, 69.0])[k] })), runs: o.bnRuns || ['n0', 'n1', 'n2'] }, BO: { tables: [0, 1, 2].map(k => ({ OWN: (o.boT || [23.6, 43.7, 66.2])[k] })), runs: ['o0', 'o1', 'o2'] } });
  // the per-path ledger: BN's GB -2.0 (GL -1.4, 0.7 of it), BO's GB -4.5
  const base = { BN: { GB: [-2.0, -1.8, -0.8], GL: [-1.4, -1.26, -0.5], NB: [7, 7, 7], ND: [2, 2, 2] }, BO: { GB: [-4.5, -4.2, -3.0], GL: [-3, -3, -2] } };
  // the year profile: GB's part in each bridge year (late-heavy) and the de-risked layers' share of each year's path-years
  // (rising), so the year-matched share of GB is SW = sum SS_t WY_t; GD is (SW + ex) of GB, its excess ex (0.4 unless set)
  const WY = [0.02, 0.03, 0.05, 0.1, 0.15, 0.25, 0.4], SS = [0, 0.1, 0.2, 0.4, 0.6, 0.8, 0.9], SW = SS.reduce((a, v, t) => a + v * WY[t], 0);
  const gbOf = (o, k) => (o.BN && o.BN.GB && o.BN.GB[k] !== undefined ? o.BN.GB[k] : base.BN.GB[k]), sdOf = (o, x) => (o.sd && o.sd[x] !== undefined ? o.sd[x] : 2);
  const Pof = (o = {}) => (arm, x, k) => {
    if (arm === 'BN' && /^Y\d$/.test(x) && !(o.BN && o.BN[x])) { const w = WY[Number(x[1]) - 1]; return pts(arr(w * gbOf(o, k), w * sdOf(o, 'BNGB'))); }
    if (arm === 'BN' && x === 'GD' && !(o.BN && o.BN.GD)) { const sh = SW + (o.ex && o.ex[k] !== undefined ? o.ex[k] : k < 2 ? 0.4 : 0); return pts(arr(sh * gbOf(o, k), o.sd && o.sd.BNGD !== undefined ? o.sd.BNGD : sh * sdOf(o, 'BNGB'))); }
    const v = (o[arm] && o[arm][x] && o[arm][x][k] !== undefined) ? o[arm][x][k] : (base[arm][x] ? base[arm][x][k] : 0); return pts(arr(v, sdOf(o, `${arm}${x}`)));
  };
  // the bridge path records: each year ten B levels of ten records, round(s_t x 10) of each level de-risked (layer 2, the
  // plan layer 0); G -3 points de-risked and -1 plan (o.sm 'equal': -2 both; 'world0': equal in world 1 only; 'cliff': G
  // a function of B alone, the de-risked records at low B; 'nomatch': years 1-3 plan only, 4-7 de-risked only), each group
  // +-0.2 points alternately in each cell
  const Rof = (o = {}) => (arm, k) => {
    // o.li0: the plan layer's index (2: the layers numbered the other way); o.delta: de-risked G = plan + delta (probability)
    const pl = o.li0 !== undefined ? o.li0 : 0, dl0 = pl === 0 ? 2 : 0;
    const r = { year: [], layer: [], G: [], B: [], li0: pl }, ss = (o.s && o.s[k]) || SS, mode = o.sm === 'world0' ? (k === 1 ? 'equal' : 'base') : (o.sm || 'base');
    // pushed level by level within each record index, so the records are not in B order (the read sorts them)
    for (let t = 1; t <= 7; t++) for (let x = 0; x < 10; x++) for (let l = 9; l >= 0; l--) {
      const dl = mode === 'cliff' ? [6, 6, 6, 4, 4, 2, 2, 2, 2, 2][l] : mode === 'nomatch' ? (t >= 4 ? 10 : 0) : Math.round(ss[t - 1] * 10), B = (l + 0.5) / 10;
      {
        const der = x < dl, idx = der ? x : x - dl, nz = (idx % 2 ? 1 : -1) * (o.noise || 0.002);
        const g = mode === 'cliff' ? -0.05 * (1 - B) : mode === 'equal' ? -0.02 : o.delta !== undefined ? -0.01 + (der ? o.delta : 0) : mode === 'weights' && der && t === 3 ? -0.05 : der ? -0.03 : -0.01;
        r.year.push(t); r.layer.push(der ? dl0 : pl); r.G.push(g + nz); r.B.push(B);
      }
    }
    return r;
  };
  const run = (o = {}, jo = {}, n1o = {}, n1 = true) => items(Pof(o), mkJ(jo), n1 ? n1Of(n1o) : null, [1, 2, 3, 4, 5, 6, 7], Rof(o));
  const outc = (i, o, jo, n1o, want, what, n1 = true) => { const got = run(o, jo, n1o, n1)[i].outcome; REACHED[i].add(got); cases.push([what, got, want]); };
  const se = 2 * Math.sqrt(N / (N - 1)) / Math.sqrt(N);
  // item 0
  outc('0', {}, {}, {}, 'HELD', 'tables and runs NODE-1\'s: 0 HELD');
  outc('0', {}, {}, { bnT: [26.6, 47.0, 69.000001] }, 'FALSIFIED', 'BN\'s world 2 table a printed digit off NODE-1\'s: 0 FALSIFIED');
  outc('0', {}, {}, { bnRuns: ['n0', 'n1', 'x2'] }, 'INCONCLUSIVE', 'the tables alike, BN\'s world 2 runs not: 0 INCONCLUSIVE');
  outc('0', {}, {}, {}, 'INCONCLUSIVE', 'NODE-1 not read: 0 INCONCLUSIVE', false);
  // item 1
  outc('1', {}, {}, {}, 'HELD', 'GB -2.0 and -1.8, tops under -1: 1 HELD');
  outc('1', { BN: { GB: [-0.1, 0.1, 0] } }, {}, {}, 'FALSIFIED', 'GB near zero in worlds 0 and 1: 1 FALSIFIED');
  outc('1', { BN: { GB: [-0.8, -0.8, 0] } }, {}, {}, 'INCONCLUSIVE', 'GB -0.8: 1 INCONCLUSIVE');
  outc('1', { BN: { GB: [-2.0, -0.1, 0] } }, {}, {}, 'INCONCLUSIVE', 'GB shown in world 0 only, near zero in world 1: 1 INCONCLUSIVE');
  outc('1', { BN: { GB: [-2.0, -1.8, 0.5] } }, {}, {}, 'HELD', 'world 2 positive: 1 reads worlds 0 and 1, HELD');
  outc('1', { BN: { GB: [-1 - Z * se, -1 - Z * se, 0] } }, {}, {}, 'HELD', 'GB\'s top exactly -1: 1 HELD'); EDGES.push('a residual\'s top exactly a point under');
  outc('1', { BN: { GB: [-1 - Z * se + 1e-6, -1 - Z * se, 0] } }, {}, {}, 'INCONCLUSIVE', 'GB\'s top a millionth over -1 in world 0: 1 INCONCLUSIVE');
  outc('1', { BN: { GB: [-0.5 + Z * se, -0.5 + Z * se, 0] } }, {}, {}, 'FALSIFIED', 'GB\'s bottom exactly -0.5: 1 FALSIFIED'); EDGES.push('a residual\'s bottom exactly half a point under');
  outc('1', { BN: { GB: [-0.5 + Z * se - 1e-6, -0.5 + Z * se, 0] } }, {}, {}, 'INCONCLUSIVE', 'GB\'s bottom a millionth under -0.5 in world 0: 1 INCONCLUSIVE');
  outc('1', { BN: { GB: [-2.0, 0.1, 0] } }, {}, {}, 'INCONCLUSIVE', 'GB FALSIFIED in world 1 only: 1 INCONCLUSIVE');
  // item 2
  outc('2', {}, {}, {}, 'HELD', 'years 4 to 6 0.7 of GB: 2 HELD');
  outc('2', { BN: { GL: [-0.2, -0.2, 0] } }, {}, {}, 'FALSIFIED', 'years 4 to 6 0.1 of GB: 2 FALSIFIED');
  outc('2', { BN: { GL: [-0.8, -0.72, 0] } }, {}, {}, 'INCONCLUSIVE', 'years 4 to 6 0.4 of GB: 2 INCONCLUSIVE');
  outc('2', { BN: { GL: [-1.4, -0.2, 0] } }, {}, {}, 'INCONCLUSIVE', 'years 4 to 6 HELD in world 0 only: 2 INCONCLUSIVE');
  outc('2', { BN: { GL: [-0.2, -1.26, 0] } }, {}, {}, 'INCONCLUSIVE', 'years 4 to 6 FALSIFIED in world 0 only: 2 INCONCLUSIVE');
  outc('2', { BN: { GB: [-0.8, -0.8, 0], GL: [-0.7, -0.7, 0] } }, {}, {}, 'INCONCLUSIVE', 'item 1 not HELD: 2 not read'); EDGES.push('a late share not read');
  outc('2', { BN: { GB: [-2, -2, -1], GL: [-1, -1, -0.5] }, sd: { BNGB: 1e-9, BNGL: 1e-9 } }, {}, {}, 'HELD', 'the late share exactly 0.5 with no spread: 2 HELD'); EDGES.push('a share exactly at the HELD line');
  outc('2', { BN: { GB: [-2, -2, -1], GL: [-0.9999999, -1, -0.5] }, sd: { BNGB: 1e-9, BNGL: 1e-9 } }, {}, {}, 'INCONCLUSIVE', 'the late share a whisker under 0.5 in world 0: 2 INCONCLUSIVE');
  outc('2', { BN: { GB: [-2, -2, -1], GL: [-0.5, -0.5, -0.5] }, sd: { BNGB: 1e-9, BNGL: 1e-9 } }, {}, {}, 'FALSIFIED', 'the late share exactly 0.25 with no spread: 2 FALSIFIED'); EDGES.push('a share exactly at the FALSIFIED line');
  outc('2', { BN: { GB: [-2, -2, -1], GL: [-0.5000001, -0.5, -0.5] }, sd: { BNGB: 1e-9, BNGL: 1e-9 } }, {}, {}, 'INCONCLUSIVE', 'the late share a whisker over 0.25 in world 0: 2 INCONCLUSIVE');
  outc('2', { BN: { GL: [-2.6, -2.3, 0] } }, {}, {}, 'HELD', 'the late years past the whole (1.3 of GB): 2 HELD');
  // item 3
  outc('3', {}, {}, {}, 'HELD', 'BO\'s GB 2.5 under BN\'s in world 0: 3 HELD');
  outc('3', { BO: { GB: [-2.2, -4.2, -3] } }, {}, {}, 'FALSIFIED', 'BO\'s GB 0.2 under BN\'s: 3 FALSIFIED');
  outc('3', { BO: { GB: [-3.0, -4.2, -3] } }, {}, {}, 'INCONCLUSIVE', 'BO\'s GB 1.0 under BN\'s: 3 INCONCLUSIVE');
  outc('3', { BO: { GB: [-3.5, -4.2, -3] }, sd: { BOGB: 1e-9, BNGB: 1e-9 } }, {}, {}, 'HELD', 'BO less BN exactly -1.5 with no spread: 3 HELD'); EDGES.push('a difference exactly at the known line');
  outc('3', { BO: { GB: [-2.5, -4.2, -3] }, sd: { BOGB: 1e-9, BNGB: 1e-9 } }, {}, {}, 'FALSIFIED', 'BO less BN exactly -0.5 with no spread: 3 FALSIFIED');
  outc('3', { BO: { GB: [-3.4999999, -4.2, -3] }, sd: { BOGB: 1e-9, BNGB: 1e-9 } }, {}, {}, 'INCONCLUSIVE', 'BO less BN a whisker over -1.5 with no spread: 3 INCONCLUSIVE');
  outc('3', { BO: { GB: [-2.3, -4.2, -3] }, sd: { BOGB: 4 } }, {}, {}, 'INCONCLUSIVE', 'BO less BN 0.3 at the point, its bottom under -0.5: 3 INCONCLUSIVE');
  outc('3', { BO: { GB: [-3.6, -4.2, -3] }, sd: { BOGB: 4 } }, {}, {}, 'INCONCLUSIVE', 'BO less BN 1.6 at the point, its top over -1.5: 3 INCONCLUSIVE');
  outc('3', { BO: { GB: [-4.5, -1, -1] } }, {}, {}, 'HELD', 'worlds 1 and 2 alike: 3 reads world 0, HELD');
  // the causes
  // item 4 (year-matched)
  outc('4', {}, {}, {}, 'HELD', 'GD 0.4 of GB past its year-matched share: 4 HELD');
  outc('4', { ex: [0, 0] }, {}, {}, 'FALSIFIED', 'GD at its year-matched share, late-heavy years (the old statistic read 0.27 past the path-years\' share): 4 FALSIFIED'); EDGES.push('a layer share that is year composition alone');
  { const it = run({ ex: [0, 0] }); const old = q(SW - SS.reduce((a, v) => a + v, 0) / 7); cases.push(['the composition case: the old statistic past its HELD line, the year-matched excess 0', `${old >= D_HELD} ${it['4'].cells[0].F.F}`, 'true 0']); }
  outc('4', { ex: [0.15, 0.15] }, {}, {}, 'INCONCLUSIVE', 'GD 0.15 past: 4 INCONCLUSIVE');
  outc('4', { ex: [0.25, 0.25] }, {}, {}, 'HELD', 'GD exactly 0.25 past: 4 HELD'); EDGES.push('a layer share exactly at the HELD line');
  outc('4', { ex: [0.05, 0.05] }, {}, {}, 'FALSIFIED', 'GD exactly 0.05 past: 4 FALSIFIED');
  outc('4', { ex: [0.2499, 0.25] }, {}, {}, 'INCONCLUSIVE', 'GD a whisker under 0.25 past in world 0: 4 INCONCLUSIVE');
  outc('4', { ex: [0.05, 0.0501] }, {}, {}, 'INCONCLUSIVE', 'GD a whisker over 0.05 past in world 1: 4 INCONCLUSIVE');
  outc('4', { ex: [0.4, 0.15] }, {}, {}, 'INCONCLUSIVE', 'GD HELD in world 0 only: 4 INCONCLUSIVE');
  outc('4', { ex: [0, 0.15] }, {}, {}, 'INCONCLUSIVE', 'GD FALSIFIED in world 0 only: 4 INCONCLUSIVE');
  outc('4', { ex: [0.27, 0.27], sd: { BNGD: 4 } }, {}, {}, 'INCONCLUSIVE', 'GD 0.27 past at the point, its bottom under 0.25 (a wide spread): 4 INCONCLUSIVE');
  outc('4', { BN: { GB: [-0.8, -0.8, 0] } }, {}, {}, 'INCONCLUSIVE', 'item 1 not HELD: 4 not read'); EDGES.push('a layer share not read');
  outc('4', { s: [SS.map(v => Math.min(1, v + 0.2)), SS] }, {}, {}, 'INCONCLUSIVE', 'world 0\'s records de-risked 0.2 more a year (GD as before): 4 INCONCLUSIVE where the base reads HELD, so s_t is read from the records');
  { const it = run({}); cases.push(['item 4\'s year-matched share is the records\' s_t over the year profile', `${it['4'].cells[0].Sw} ${it['4'].cells[1].Sw}`, `${q(SW)} ${q(SW)}`]); }
  // R0's state-matched condition
  const smy = o => run(o).sm.yes;
  cases.push(['de-risked G 2 points under the plan layer\'s in every matched cell: R0\'s condition YES', smy({}), true]);
  cases.push(['de-risked and plan G equal: R0\'s condition NO', smy({ sm: 'equal' }), false]);
  cases.push(['under in world 0 only: R0\'s condition NO', smy({ sm: 'world0' }), false]);
  cases.push(['G a function of B alone, the de-risked records at low B (nearer the cliff): R0\'s condition NO', smy({ sm: 'cliff' }), false]); EDGES.push('a layer gap that is state alone');
  { const it = run({ sm: 'cliff' }), c = it.sm.cells[0]; cases.push(['the cliff case\'s matched difference is 0 over its cells', `${c.D} ${c.cells > 0}`, '0 true']); }
  cases.push(['no cell holds two of each: R0\'s condition NO', smy({ sm: 'nomatch' }), false]);
  { const it = run({ sm: 'nomatch' }); cases.push(['no matched cell: none counted', it.sm.cells[0].cells, 0]); }
  { const it = run({}), c = it.sm.cells[0]; cases.push(['the base\'s matched difference: -2 points a path-year', c.D, -2]); }
  { const it = run({ sm: 'weights' }); cases.push(['year 3\'s cells 4 under, the others 2, weighted by the de-risked records: -2.2', it.sm.cells[0].D, -2.2]); }
  { const se0 = (() => { const c = run({ delta: -0.01 }).sm.cells[0]; return (c.hi - c.D) / Z; })();
    cases.push(['the matched difference\'s top exactly 0: R0\'s condition NO', smy({ delta: -Z * se0 / 100 }), false]); EDGES.push('a state-matched top exactly at 0');
    cases.push(['its top a whisker under 0: R0\'s condition YES', smy({ delta: -Z * se0 / 100 - 1e-7 }), true]); }
  outc('4', { li0: 2 }, {}, {}, 'HELD', 'the plan layer numbered 2, the de-risked 0: 4 HELD as the base');
  cases.push(['the plan layer numbered 2: R0\'s condition YES as the base', smy({ li0: 2 }), true]);
  outc('4', { li0: 2, ex: [0, 0] }, {}, {}, 'FALSIFIED', 'the plan layer numbered 2, GD at its year-matched share: 4 FALSIFIED');
  outc('4', { s: [SS, SS.map(v => Math.min(1, v + 0.2))] }, {}, {}, 'INCONCLUSIVE', 'world 1\'s records de-risked 0.2 more a year: 4 INCONCLUSIVE, each world read on its own records');
  cases.push(['de-risked G a tenth of a point under, each record +-2 points: R0\'s condition NO (its interval crosses 0)', smy({ delta: -0.001, noise: 0.02 }), false]);
  { const lines = report(Pof({}), mkJ(), n1Of(), [1, 2, 3, 4, 5, 6, 7], Rof({ sm: 'equal' })); cases.push(['the read prints R0\'s condition NO when de-risked and plan G are equal', lines.some(l => /^R0 STATE-MATCHED CONDITION .*: NO$/.test(l)), true]); }
  // R5's condition
  const part = o => run(o)['1'].partial;
  cases.push(['GB -0.8 in both worlds, tops -0.58: R5 YES', part({ BN: { GB: [-0.8, -0.8, 0] } }), true]);
  cases.push(['GB -0.6 in world 0, its top -0.38: R5 NO', part({ BN: { GB: [-0.6, -0.8, 0] } }), false]);
  cases.push(['GB\'s top exactly -0.5 in both: R5 YES', part({ BN: { GB: [-0.5 - Z * se, -0.5 - Z * se, 0] } }), true]); EDGES.push('a partial grid term exactly at its line');
  cases.push(['GB\'s top a millionth over -0.5 in world 1: R5 NO', part({ BN: { GB: [-0.5 - Z * se, -0.5 - Z * se + 1e-6, 0] } }), false]);
  cases.push(['item 1 HELD: R5 NO', part({}), false]);
  cases.push(['item 1 FALSIFIED: R5 NO', part({ BN: { GB: [0, 0, 0] } }), false]);
  const cz = (o, n1o, c) => run(o, {}, n1o)['causes'][c];
  cases.push(['1 and 2 HELD with 0 and 3: N2-GRID held, N2-LATE held', `${cz({}, {}, 'N2-GRID')} ${cz({}, {}, 'N2-LATE')}`, 'held held']);
  cases.push(['1 FALSIFIED with 0 and 3: N2-GRID not, N2-LATE open', `${cz({ BN: { GB: [-0.1, 0.1, 0] } }, {}, 'N2-GRID')} ${cz({ BN: { GB: [-0.1, 0.1, 0] } }, {}, 'N2-LATE')}`, 'not open']);
  cases.push(['2 FALSIFIED with 0, 1 and 3: N2-GRID held, N2-LATE not', `${cz({ BN: { GL: [-0.2, -0.2, 0] } }, {}, 'N2-GRID')} ${cz({ BN: { GL: [-0.2, -0.2, 0] } }, {}, 'N2-LATE')}`, 'held not']);
  cases.push(['3 FALSIFIED: both open', `${cz({ BO: { GB: [-2.2, -4.2, -3] } }, {}, 'N2-GRID')} ${cz({ BO: { GB: [-2.2, -4.2, -3] } }, {}, 'N2-LATE')}`, 'open open']);
  cases.push(['0 FALSIFIED (not NODE-1\'s): both open', `${cz({}, { bnT: [26.6, 47.0, 69.000001] }, 'N2-GRID')} ${cz({}, { bnT: [26.6, 47.0, 69.000001] }, 'N2-LATE')}`, 'open open']);
  cases.push(['1 INCONCLUSIVE: N2-GRID open', cz({ BN: { GB: [-0.8, -0.8, 0] } }, {}, 'N2-GRID'), 'open']);
  cases.push(['4 HELD and R0\'s condition YES, with 0, 1 and 3: N2-LAYER held', cz({}, {}, 'N2-LAYER'), 'held']);
  cases.push(['4 HELD and R0\'s condition NO: N2-LAYER open', cz({ sm: 'cliff' }, {}, 'N2-LAYER'), 'open']);
  cases.push(['4 FALSIFIED with 0, 1 and 3: N2-LAYER not', cz({ ex: [0, 0] }, {}, 'N2-LAYER'), 'not']);
  cases.push(['4 INCONCLUSIVE: N2-LAYER open', cz({ ex: [0.15, 0.15] }, {}, 'N2-LAYER'), 'open']);
  cases.push(['3 FALSIFIED: N2-LAYER open', cz({ BO: { GB: [-2.2, -4.2, -3] } }, {}, 'N2-LAYER'), 'open']);
  cases.push(['0 FALSIFIED: N2-LAYER open', cz({}, { bnT: [26.6, 47.0, 69.000001] }, 'N2-LAYER'), 'open']);
  // the ratio and the split
  { const r = ratioOf(Float64Array.from([1, 3, 1, 3]), Float64Array.from([2, 6, 2, 6])); cases.push(['a ratio of proportional paths: its point and a zero-width interval', `${r.F} ${r.lo} ${r.hi}`, '0.5 0.5 0.5']); }
  { const it = run({ BN: { B0: [26.6, 47, 69], X: [28.8, 48.9, 69.9], T: [0, 0.1, 0.1], GB: [-2.2, -2.2, -1], GA: [-0.5, 0, 0.0], Y5: [-0.7, 0, 0] } }); const s = it.split[0]; cases.push(['the split: OWN less runs, the closing with GA, year 5\'s residual', `${s.gap} ${s.closes} ${s.years[4].t} ${s.years[4].m}`, `${q(26.6 - 28.8)} ${q(26.6 - 28.8 - 0 + 2.2 + 0.5)} 5 -0.7`]); }
  // the arm's reach (O153)
  cases.push(['BN\'s tables BO\'s in every world: reach 0', reach(mkJ({ bnT: [23.6, 43.7, 66.2] })), 0]);
  cases.push(['BN\'s tables moved in world 2 only: reach 1', reach(mkJ({ bnT: [23.6, 43.7, 69] })), 1]); EDGES.push('an arm equal to its control everywhere');
  // the read end to end
  { let lines = [], err = null; try { lines = report(Pof({}), mkJ(), n1Of(), [1, 2, 3, 4, 5, 6, 7], Rof({})); } catch (e) { err = e.message; }
    const oc = lines.find(l => l.startsWith('OUTCOME: ')) || '';
    cases.push(['the read prints five items, R5\'s condition, three causes, six split and six QF lines, REALISED and an OUTCOME of five items, end to end', err || `${['0.', '1.', '2.', '3.', '4.'].every(p => lines.some(l => l.startsWith(p)))} ${lines.some(l => /^R5 CONDITION .*: NO$/.test(l)) && lines.some(l => /^R0 STATE-MATCHED CONDITION .*: YES$/.test(l))} ${lines.filter(l => l.startsWith('=> ')).length} ${lines.filter(l => /^  B[NO] world \d: OWN less runs/.test(l)).length} ${lines.filter(l => /^  B[NO] world \d: QF .* year 7 apart: /.test(l)).length} ${lines.some(l => l.startsWith('REALISED item 1: '))} ${oc.split(', ').length}`, 'true true 3 6 6 true 5']); }
  { const rd = lines => (lines.find(l => l.startsWith('4. ')) || ''); cases.push(['the read says item 4 was not read when item 1 is not HELD', / \(not read: item 1 not HELD\)$/.test(rd(report(Pof({ BN: { GB: [-0.8, -0.8, 0] } }), mkJ(), n1Of(), [1, 2, 3, 4, 5, 6, 7], Rof({})))), true]); }
  { const lines = report(Pof({ BN: { GB: [-0.8, -0.8, 0] } }), mkJ(), n1Of(), [1, 2, 3, 4, 5, 6, 7], Rof({})); cases.push(['the read prints R5 YES on a partial grid term', lines.some(l => /^R5 CONDITION .*: YES$/.test(l)), true]); }
  { const rd = lines => (lines.find(l => l.startsWith('2. ')) || ''); cases.push(['the read says item 2 was not read when item 1 is not HELD', / \(not read: item 1 not HELD\)$/.test(rd(report(Pof({ BN: { GB: [-0.8, -0.8, 0] } }), mkJ(), n1Of(), [1, 2, 3, 4, 5, 6, 7], Rof({})))), true]); }
  // the gate, on synthetic logs built as the audit prints
  const pad = ''.padEnd(16), G0 = { npw: 4, scale: 15 };
  const jobText = (jb, o = {}) => {
    const [id, arm, pts0, sh] = jb, L = jobLabel(jb), pts = o.pts || Math.max(4, Math.round(pts0 / 15));
    const ran = `bridgeRead reader bridgeStep exact readerSplit null readerBlend null readerRef ${o.ref || 'order'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls ${o.e3 || 'true'} switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${pts} grid ${o.grid || `total${pts}x${sh}x6`} shareNodes ${o.nodes || (arm === 'BN' ? NODES_A : 'none')} floor ${o.floor || 5000} line 0.5`;
    const out = [`${id.padEnd(16)} case | job ${L} | points ${o.casePts || pts} | lambda 0.0223606797749979`, ...(o.dropSolve ? [] : [`${pad} solve CAND ${L}: table 40.0000 secs 10`]), `${pad} ran CAND ${L}: ${ran}`, `${pad} checks ${L}: armTook ${o.armTook !== undefined ? o.armTook : 1}/1`, `${pad} openings ${L}: OWN ai 12 level 0.8 tiers 0,0`];
    if (!o.noBridge) out.push(`${pad} bridge ${L}: reader years ${o.emptyBridge ? '' : '1,2,3,4,5,6,7'}`);
    for (let k = 0; k < 3; k++) {
      if (o.dropTable !== k) out.push(`${pad} tables ${L} ${k} z 0.000000 weight 0.333333: OWN 40.000000 READ 39.000000`);
      if (o.dropLedger !== k) out.push(`${pad} ledger ${L} ${k}: ${[...KEYS, ...(o.emptyBridge ? [] : [1, 2, 3, 4, 5, 6, 7].map(t => `Y${t}`))].filter(x => x !== o.dropKey).map(x => `${x} 0.100000`).join(' ')}`);
      for (let li = 0; li < 3; li++) if (!(o.dropLayer === k && li === 2)) out.push(`${pad} layer ${L} ${k} ${li}: bridge path-years 10 G 0.100000`);
      if (o.dropDerisk !== k) out.push(`${pad} derisk ${L} ${k}: plan layer 0 bridge path-years ${o.nb !== undefined ? o.nb : 28} de-risked 8 GD 0.050000`);
      if (o.dropQf !== k) out.push(`${pad} qf ${L} ${k}: paths ${o.qfPaths || 4} QF 0.000000`);
      if (o.dropRun !== k) out.push(`${pad} sim ${L} ${k} OWN ai 12: 2/${o.runN || 4} bridge ${o.bridge || 2} bits aa bb`);
    }
    out.push(`${pad} checks ${L}: ownTook ${o.own !== undefined ? o.own : 12}/${o.ownN !== undefined ? o.ownN : 12} identity ${o.ident || 12}/${o.identN || 12} qfTook ${o.qf !== undefined ? o.qf : 9}/${o.qfN !== undefined ? o.qfN : 9} layerTook ${o.ly !== undefined ? o.ly : 9}/9 secs 1`, `${pad} file ${L}: ${id}-${L.replace(/\//g, '-')}.json.gz`);
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
  refuses('ownTook short', all({ [KN]: { own: 11 } }));
  refuses('ownTook over no path', all({ [KB]: { own: 0, ownN: 0 } }));
  refuses('qfTook short', all({ [KN]: { qf: 8 } }));
  refuses('layerTook short', all({ [KB]: { ly: 8 } }));
  refuses('qfTook over no visit', all({ [KB]: { qf: 0, qfN: 0 } }));
  refuses('a missing de-risk line in world 1', all({ [KN]: { dropDerisk: 1 } }));
  refuses('a de-risk line over no path-year', all({ [KB]: { nb: 0 } }));
  refuses('a missing QF line in world 2', all({ [KB]: { dropQf: 2 } }));
  refuses('a QF line on other paths than registered', all({ [KN]: { qfPaths: 3 } }));
  refuses('a ledger line short of GD', all({ [KN]: { dropKey: 'GD' } }));
  refuses('the identity short', all({ [KB]: { ident: 11 } }));
  refuses('the identity over fewer paths than three worlds\'', all({ [KB]: { ident: 9, identN: 9 } }));
  refuses('no bridge years', all({ [KN]: { noBridge: true } }));
  refuses('an empty bridge line', all({ [KN]: { emptyBridge: true } }));
  refuses('no solve line', all({ [KB]: { dropSolve: true } }));
  refuses('a missing table in world 1', all({ [KN]: { dropTable: 1 } }));
  refuses('a missing ledger line in world 2', all({ [KB]: { dropLedger: 2 } }));
  refuses('a ledger line short of one bridge year', all({ [KN]: { dropKey: 'Y5' } }));
  refuses('a ledger line short of GL', all({ [KB]: { dropKey: 'GL' } }));
  refuses('a missing tier-layer line in world 1', all({ [KN]: { dropLayer: 1 } }));
  refuses('a missing run in world 2', all({ [KB]: { dropRun: 2 } }));
  refuses('runs on other paths than registered', all({ [KB]: { runN: 5 } }));
  refuses('fewer paying the bridge than surviving', all({ [KB]: { bridge: 1 } }));
  { const b64i = a => Buffer.from(a.buffer).toString('base64'), PR = { meta: b64i(new Int32Array(14)), dim: 7, states: b64i(new Float32Array(14)), G: b64i(new Float32Array(2)), B: b64i(new Float32Array(2)), Q: b64i(new Float32Array(2)) };
    const jobs = all(), files = {}, shOf = s => sha16(Buffer.from(s, 'base64')), per = Object.fromEntries([0, 1, 2].flatMap(w => [...KEYS, ...[1, 2, 3, 4, 5, 6, 7].map(t => `Y${t}`), 'NB', 'ND', 'QF'].map(x => [`${x}${w}`, Buffer.from(new Float64Array(4).buffer).toString('base64')])));
    for (const j of jobs) { const bits = {}; Object.keys(j.sims).forEach(nm => { bits[nm] = 'AAAA'; bits[`${nm}b`] = 'AQAA'; }); files[j.file] = { stamp: j.stamp, bits, per, paths: PR }; Object.values(j.sims).forEach(s => { s.bits = shOf('AAAA'); s.bitsB = shOf('AQAA'); }); }
    cases.push(['the gate passes files whose bits and paths are the log\'s', gate(jobs, { ...G0, files }).length, 0]);
    refuses('a missing file', jobs, { files: { ...files, [jobs[1].file]: undefined } });
    refuses('a file stamped by other code', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], stamp: { ...jobs[0].stamp, code: 'c9' } } } });
    refuses('a file whose bits are not the log\'s', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], bits: { ...files[jobs[0].file].bits, OWN1b: 'AgAA' } } } });
    refuses('a file short of one path array', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], per: { ...per, GB1: Buffer.from(new Float64Array(3).buffer).toString('base64') } } } });
    refuses('a file without one bridge year\'s paths', jobs, { files: { ...files, [jobs[1].file]: { ...files[jobs[1].file], per: { ...per, Y42: undefined } } } });
    refuses('a file short of QF\'s paths', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], per: { ...per, QF1: Buffer.from(new Float64Array(3).buffer).toString('base64') } } } });
    refuses('a file without ND', jobs, { files: { ...files, [jobs[1].file]: { ...files[jobs[1].file], per: { ...per, ND0: undefined } } } });
    refuses('a file without its bridge path records', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], paths: undefined } } });
    refuses('bridge path records whose states are short', jobs, { files: { ...files, [jobs[1].file]: { ...files[jobs[1].file], paths: { ...PR, states: b64i(new Float32Array(13)) } } } });
    refuses('bridge path records of a broken row', jobs, { files: { ...files, [jobs[1].file]: { ...files[jobs[1].file], paths: { ...PR, meta: b64i(new Int32Array(13)), states: b64i(new Float32Array(13)) } } } });
    refuses('bridge path records without their G column', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], paths: { ...PR, G: undefined } } } });
    refuses('bridge path records whose B column is short', jobs, { files: { ...files, [jobs[1].file]: { ...files[jobs[1].file], paths: { ...PR, B: b64i(new Float32Array(1)) } } } });
    refuses('bridge path records without their QF column', jobs, { files: { ...files, [jobs[1].file]: { ...files[jobs[1].file], paths: { ...PR, Q: undefined } } } }); }
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
  console.log(`GATE: passed - the two jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); each job's reference, nodes and grid in its solve's meta; every self-check passed in full (armTook, ownTook, identity on every path of three worlds, qfTook); three worlds' ledger, de-risk, QF and tier-layer lines; the bridge path records; every file the log's${PRE ? '' : '; NODE-1\'s files behind NODE-1\'s gate'}`);
  const rc = reach(J);
  console.log(`ARM'S REACH (O153): BN's own-opening tables differ from BO's in ${rc} of 3 worlds`);
  if (rc === 0) { console.log('REFUSED: the arm equals its control in every world, so it cannot reach the mechanism (O153)'); process.exit(1); }
  if (PRE) { console.log('PREFLIGHT: the gate, the files and the arm\'s reach read; no figure is read'); process.exit(0); }
  const P = (arm, x, k) => { const j = J[key('S360', arm === 'BN' ? 'BN/P60S15Q5' : 'BO/P60S6Q5')], b = Buffer.from(files[j.file].per[`${x}${k}`], 'base64'); return pts(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length))); };
  console.log('\nNODE-AX: S360\'s grid residual under the dense share nodes (BN) and six shares (BO), split by year and axis (predictions/diag-nodeax.md)');
  const Rc = {};
  const R = (arm, k) => {
    const kk = `${arm}${k}`; if (Rc[kk]) return Rc[kk];
    const j = J[key('S360', arm === 'BN' ? 'BN/P60S15Q5' : 'BO/P60S6Q5')], pr = files[j.file].paths, dec = (x, T) => { const b = Buffer.from(x, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
    const meta = dec(pr.meta, Int32Array), G = dec(pr.G, Float32Array), B = dec(pr.B, Float32Array), out = { year: [], layer: [], G: [], B: [], li0: j.derisk[k].li0 };
    for (let x = 0; x < G.length; x++) if (meta[7 * x] === k) { out.year.push(meta[7 * x + 2]); out.layer.push(meta[7 * x + 6]); out.G.push(G[x]); out.B.push(B[x]); }
    return (Rc[kk] = out);
  };
  for (const L of report(P, J, n1, { BN: J[key('S360', 'BN/P60S15Q5')].bridge, BO: J[key('S360', 'BO/P60S6Q5')].bridge }, R)) console.log(L);
  for (const j of jobs) for (let k = 0; k < 3; k++) console.log(`  layers ${j.arm} world ${k}: ${j.layers[k].map((x, li) => `${li} path-years ${x.n} G ${x.G.toFixed(4)}`).join('; ')}`);
  for (const j of jobs) for (let k = 0; k < 3; k++) for (const c of j.cliff[k]) console.log(`  cliff ${j.arm} world ${k} year ${c.t}: ${c.text}`);
}
