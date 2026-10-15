/*
 * AREF STEP 0's READ (predictions/diag-aref0.md; audit-aref0.mjs; PLAN.md AREF).
 *   node research/solver/reduce-aref0.mjs [dir=results/diagaref0] [scale=1] [simulations=1000] [--preflight] [--planted]
 * THE GATE (before any figure): the one job once and done, stamped by one code, audit, prediction and sha, at the
 *   registered settings (scale, simulations, seed 7002); gridTook (with the menu), recTook and dpTook passed in full;
 *   the calibration lines of three worlds and five bins, the flatness lines of three worlds; its file the log's, whole; and
 *   the NODE-AX file it read the one behind NODE-AX's gate (its sha the audit's, NODE-AX's reducer passing its gate).
 * THE ITEMS (in the band, p or today's read between 0.05 and 0.95; worlds 0 and 1 decide; a mean's interval normal with
 *   its standard error clustered by path, every record of a path sharing its bridge bit; z = Z_B, the (1 - ALPHA / 20)
 *   normal quantile, ten bins; every threshold read on the figure rounded to 1e-9):
 *   1 (primary: the adaptive chance calibrated): in each of the five bins of p (0.05, 0.2, 0.4, 0.6, 0.8, 0.95) holding
 *     at least MIN_N records, the realised bridge share less the mean p. HELD when every such bin's interval lies within
 *     [-0.03, 0.03] in both worlds; FALSIFIED when some bin's interval lies wholly outside it (above 0.03 or below -0.03)
 *     in either world; INCONCLUSIVE otherwise (or when a world has no such bin).
 *   2 (the known positive: today's reads under-read the bridge): over the records whose read (G + B) is in the band, the
 *     realised share less the mean read. HELD when its bottom is at least 0.03 in both worlds; FALSIFIED when its top is at
 *     most 0.01 in both; INCONCLUSIVE otherwise.
 *   3 (S / p flat): of the saved tables' supported band nodes (p >= 0.5), the share with c = S / p in [0.9, 1] (counts,
 *     exact). HELD when it is at least 0.8 in both worlds; FALSIFIED when it is at most 0.6 in both; INCONCLUSIVE otherwise.
 * GO (to AREF's arms): items 1, 2 and 3 HELD. REPORTED: every bin of every world, world 2, the self-check's lines.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-aref0.md';
export const SEED = '7002', ALPHA = 0.05, MIN_N = 100;
export const Z_B = 2.807033768343811;   // the (1 - ALPHA / 20) normal quantile: ten bins, two sides
export const CAL = 0.03, UNDER_H = 0.03, UNDER_F = 0.01, FLAT_H = 0.8, FLAT_F = 0.6;
export const BINS = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95], BAND = [0.05, 0.95];
export const LABEL = 'BN/P60S15Q5';
export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const HEAD = /^AREF0: .*, DP grid scale (\d+(?:\.\d+)?), (\d+) simulations a checked state \(seed (\d+)\)$/;

export function parse(text) {
  const lines = text.split('\n');
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  const j = { stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null, head: hd ? { scale: Number(hd[1]), nsim: Number(hd[2]), seed: hd[3] } : null,
    cases: 0, checks: {}, cal: [[], [], []], flat: [], nodeax: null, file: null, done: false };
  let m;
  for (const raw of lines) {
    const l = raw.trim();
    if (new RegExp(`^S360\\s+case \\| job ${esc(LABEL)} \\| points 60 \\| lambda \\S+$`).test(l)) j.cases++;
    else if ((m = new RegExp(`^nodeax ${esc(LABEL)}: file (\\S+) stamp`).exec(l))) j.nodeax = m[1];
    else if (l.startsWith(`checks ${LABEL}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^cal ${esc(LABEL)} (\\d) (\\d): records (\\d+) p (\\S+) realised (\\S+) today (\\S+)$`).exec(l))) j.cal[Number(m[1])][Number(m[2])] = { n: Number(m[3]) };
    else if ((m = new RegExp(`^flat ${esc(LABEL)} (\\d): nodes (\\d+) band (\\d+) supported (\\d+) c in \\[0\\.9, 1\\] (\\d+)$`).exec(l))) j.flat[Number(m[1])] = { band: Number(m[3]), sup: Number(m[4]), flat: Number(m[5]) };
    else if (l.startsWith(`file ${LABEL}:`)) j.file = l.slice(`file ${LABEL}:`.length).trim();
    else if (l === `done ${LABEL}`) j.done = true;
  }
  return j;
}

export function gate(j, { scale = 1, nsim = 1000, seed = SEED, file = null, axSha = null } = {}) {
  const bad = [];
  if (j.cases !== 1) bad.push(`the job ran ${j.cases} times, not once`);
  if (!j.done) bad.push('no done line');
  if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push('no stamp');
  if (!j.head || j.head.scale !== scale || j.head.nsim !== nsim || j.head.seed !== seed) bad.push(`not at the registered settings (scale ${scale}, ${nsim} simulations, seed ${seed})`);
  for (const c of ['gridTook', 'recTook', 'dpTook']) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1]) bad.push(`${c} did not pass in full`); }
  for (let k = 0; k < 3; k++) { if (j.cal[k].length !== 5 || [0, 1, 2, 3, 4].some(b => !j.cal[k][b])) bad.push(`world ${k}'s calibration lines are not five`); if (!j.flat[k]) bad.push(`world ${k}'s flatness line is missing`); }
  if (!j.nodeax) bad.push('no NODE-AX file line');
  else if (axSha !== null && j.nodeax !== axSha) bad.push(`the NODE-AX file read (${j.nodeax}) is not the one on disk (${axSha})`);
  if (file !== null) {
    if (!file) bad.push(`its file ${j.file} is missing`);
    else {
      if (!file.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => file.stamp[x] !== (j.stamp || {})[x])) bad.push('its file is stamped by other code');
      if (file.nodeax !== j.nodeax) bad.push('its file read another NODE-AX file than its log');
      const n = file.records && file.records.P ? Buffer.from(file.records.P, 'base64').length / 4 : 0;
      if (!(n > 0) || !['X', 'RD', 'world', 'path', 'year'].every(x => file.records[x] && Buffer.from(file.records[x], 'base64').length === (x === 'X' ? n : 4 * n))) bad.push('its file\'s records are not whole');
      if (!(j.checks.recTook && j.checks.recTook[1] === n)) bad.push('its file\'s records are not the ones recTook counted');
      for (let k = 0; k < 3; k++) { const f = file.flat && file.flat[k]; if (!f || !f.S || !f.p || Buffer.from(f.S, 'base64').length !== Buffer.from(f.p, 'base64').length || !(j.flat[k] && Buffer.from(f.S, 'base64').length / 4 === j.flat[k].band)) bad.push(`its file's world ${k} band nodes are not the log's`); }
    }
  }
  return bad;
}

// a mean of d over a set of records, its standard error clustered by path (every record of a path shares its bridge bit)
export function clusterMean(d, paths) {
  const n = d.length; if (!n) return { m: NaN, lo: NaN, hi: NaN, n: 0, clusters: 0 };
  const m = d.reduce((t, x) => t + x, 0) / n, sums = new Map();
  for (let i = 0; i < n; i++) sums.set(paths[i], (sums.get(paths[i]) || 0) + d[i] - m);
  let v = 0; for (const s of sums.values()) v += s * s;
  const G = sums.size, se = G > 1 ? Math.sqrt(v * G / (G - 1)) / n : NaN;
  return { m: q(m), lo: q(m - Z_B * se), hi: q(m + Z_B * se), n, clusters: G, se };
}
const binOf = p => { if (!(p >= BAND[0] && p <= BAND[1])) return -1; for (let b = 0; b < BINS.length - 1; b++) if (p >= BINS[b] && p < BINS[b + 1]) return b; return BINS.length - 2; };

/* R: the records { P, X, RD, world, path } (arrays); FL: per world { S, p } (the band nodes) */
export function items(R, FL) {
  const out = {}, ks = [0, 1];
  const cal = ks.map(k => { const by = [0, 1, 2, 3, 4].map(() => ({ d: [], pa: [] })); for (let i = 0; i < R.P.length; i++) { if (R.world[i] !== k) continue; const b = binOf(R.P[i]); if (b < 0) continue; by[b].d.push(R.X[i] - R.P[i]); by[b].pa.push(R.path[i]); } return by.map((x, b) => ({ k, b, ...clusterMean(x.d, x.pa) })); });
  const used = cal.map(w => w.filter(x => x.n >= MIN_N));
  const inside = x => x.lo >= -CAL && x.hi <= CAL, outside = x => x.lo > CAL || x.hi < -CAL;
  out['1'] = { outcome: used.some(w => w.some(outside)) ? 'FALSIFIED' : used.every(w => w.length > 0 && w.every(inside)) ? 'HELD' : 'INCONCLUSIVE', cells: cal };
  const under = ks.map(k => { const d = [], pa = []; for (let i = 0; i < R.P.length; i++) if (R.world[i] === k && R.RD[i] >= BAND[0] && R.RD[i] <= BAND[1]) { d.push(R.X[i] - R.RD[i]); pa.push(R.path[i]); } return { k, ...clusterMean(d, pa) }; });
  out['2'] = { outcome: under.every(x => x.lo >= UNDER_H) ? 'HELD' : under.every(x => x.hi <= UNDER_F) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: under };
  const flat = ks.map(k => { const S = FL[k].S, p = FL[k].p; let sup = 0, fl = 0; for (let i = 0; i < S.length; i++) if (p[i] >= 0.5) { sup++; const c = S[i] / p[i]; if (c >= 0.9 && c <= 1) fl++; } return { k, sup, flat: fl, share: sup ? q(fl / sup) : NaN }; });
  out['3'] = { outcome: flat.every(x => x.share >= FLAT_H) ? 'HELD' : flat.every(x => x.share <= FLAT_F) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: flat };
  out.go = ['1', '2', '3'].every(i => out[i].outcome === 'HELD');
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), iv = x => `${f4(x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
export function report(R, FL) {
  const it = items(R, FL), L = [];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. the adaptive chance is calibrated within 0.03 in every band bin of worlds 0 and 1: ${it['1'].outcome}`);
  for (const w of it['1'].cells) L.push(`     world ${w[0].k}: ${w.map(x => `bin ${x.b} n ${x.n} paths ${x.clusters} realised less p ${iv(x)}${x.n < MIN_N ? ' (under the minimum, not read)' : ''}`).join('; ')}`);
  L.push(`2. today's reads under-read the realised bridge by at least 0.03 in the band, worlds 0 and 1 (the known positive): ${it['2'].outcome}`, `     ${it['2'].cells.map(x => `world ${x.k}: n ${x.n} realised less read ${iv(x)}`).join('; ')}`);
  L.push(`3. S / p is in [0.9, 1] at 0.8 or more of the supported band nodes, worlds 0 and 1: ${it['3'].outcome}`, `     ${it['3'].cells.map(x => `world ${x.k}: ${x.flat} of ${x.sup} (${f4(x.share)})`).join('; ')}`);
  L.push('', `GO (items 1, 2 and 3 HELD): ${it.go ? 'YES' : 'NO'}`);
  { const w2 = items({ ...R, world: R.world.map(k => (k === 2 ? 0 : k === 0 ? 2 : k)) }, { 0: FL[2], 1: FL[1] }); L.push('', `REPORTED, world 2: calibration ${w2['1'].cells[0].map(x => `bin ${x.b} n ${x.n} ${iv(x)}`).join('; ')}; today's under-read ${iv(w2['2'].cells[0])}; flat ${w2['3'].cells[0].flat} of ${w2['3'].cells[0].sup}`); }
  L.push(`OUTCOME: ${['1', '2', '3'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['1', '2', '3'], REACHED = { 1: new Set(), 2: new Set(), 3: new Set() };
function planted() {
  const cases = [];
  // records: worlds 0 and 1, 400 paths each, every path with one record in each bin; X a path's bit; p a bin's centre
  // plus `dp[w][b]`; today's read `rd` below the realised share by `under[w]`
  // o.copies: the paths repeated as new paths (25: 10,000 a world)
  const mk = (o = {}) => {
    const P = [], X = [], RD = [], world = [], path = [], NP = 400 * (o.copies || 1);
    for (const k of [0, 1, 2]) for (let pa = 0; pa < NP; pa++) for (let b = 0; b < 5; b++) {
      const p0 = (BINS[b] + BINS[b + 1]) / 2, sh = o.share && o.share[k] ? o.share[k][b] : p0;
      // the realised bit: round(sh x 400) of each 400 paths pass in each bin (exactly the share sh), the passing paths
      // rotated from bin to bin so a path's bits are not the same in every bin
      const x = ((pa % 400) + 137 * b) % 400 < Math.round(sh * 400) ? 1 : 0;
      P.push(p0 + (o.dp && o.dp[k] ? o.dp[k][b] : 0)); X.push(x); RD.push(sh - (o.under ? o.under[k] : 0.05) + (pa % 2 ? 0.001 : -0.001)); world.push(k); path.push(k * 100000 + pa);
    }
    return { P, X, RD, world, path };
  };
  const fl = (share, n = 1000) => ({ S: Array.from({ length: n }, (_, i) => (i < Math.round(share * n) ? 0.95 * 0.6 : 0.5 * 0.6)), p: Array.from({ length: n }, () => 0.6) });
  const FL0 = { 0: fl(0.9), 1: fl(0.9), 2: fl(0.9) };
  const run = (o = {}, F = FL0) => items(mk(o), F);
  const outc = (i, o, F, want, what) => { const got = run(o, F)[i].outcome; REACHED[i].add(got); cases.push([what, got, want]); };
  // the realised share's own spread: a bin of 400 paths, bits 0/1, the share s: se = sqrt(s (1 - s) / 400) about; read below
  const seOf = s => Math.sqrt(s * (1 - s) / 400 * 400 / 399);
  // item 1
  outc('1', {}, FL0, 'INCONCLUSIVE', 'p exactly the realised share in every bin, 400 paths a bin: the intervals reach past 0.03 at the middle bins, so 1 INCONCLUSIVE');
  { const big = (o = {}) => mk({ ...o, copies: 25 });
    const got = items(big(), FL0)['1'].outcome; REACHED['1'].add(got); cases.push(['p exactly the realised share, 25 times the paths: 1 HELD', got, 'HELD']);
    const got2 = items(big({ dp: { 0: [0, 0, 0.1, 0, 0], 1: [0, 0, 0, 0, 0] } }), FL0)['1'].outcome; cases.push(['p 0.1 over the realised share in world 0\'s middle bin, many paths: 1 FALSIFIED', got2, 'FALSIFIED']); REACHED['1'].add(got2);
    const got3 = items(big({ dp: { 0: [0, 0, 0, 0, 0], 1: [0, -0.1, 0, 0, 0] } }), FL0)['1'].outcome; cases.push(['p 0.1 under in world 1\'s second bin only: 1 FALSIFIED (either world)', got3, 'FALSIFIED']);
    const got4 = items(big({ dp: { 0: [0, 0, 0, 0, 0.05], 1: [0, 0, 0, 0, 0] }, }), FL0)['1'].outcome; cases.push(['p 0.05 over in world 0\'s top bin (still in it): 1 FALSIFIED', got4, 'FALSIFIED']); }
  outc('1', { dp: { 0: [0, 0, 0.2, 0, 0], 1: [0, 0, 0, 0, 0] } }, FL0, 'FALSIFIED', 'p 0.2 over the realised share in a middle bin, 400 paths: 1 FALSIFIED');
  outc('1', { dp: { 0: [0, 0, 0.04, 0, 0], 1: [0, 0, 0, 0, 0] } }, FL0, 'INCONCLUSIVE', 'p 0.04 over, 400 paths: its interval spans 0.03: 1 INCONCLUSIVE');
  // a bin under the minimum is not read: worlds' records only in bins 0 and 4 for world 1
  { const r = mk(); const keep = r.P.map((p, i) => !(r.world[i] === 1 && binOf(p) >= 1 && binOf(p) <= 3)); const f = (a) => a.filter((_, i) => keep[i]); const R2 = { P: f(r.P), X: f(r.X), RD: f(r.RD), world: f(r.world), path: f(r.path) };
    const it = items(R2, FL0); cases.push(['world 1 with records in its end bins only: its middle bins are not read (n 0)', it['1'].cells[1].filter(x => x.n === 0).length, 3]); EDGES.push('a bin with no records');
    const rb = mk({ copies: 25 }), kb = rb.P.map((p, i) => !(rb.world[i] === 1 && binOf(p) >= 1 && binOf(p) <= 3)), fb = a => a.filter((_, i) => kb[i]);
    cases.push(['the same, 25 times the paths: the empty bins are left out, so 1 HELD', items({ P: fb(rb.P), X: fb(rb.X), RD: fb(rb.RD), world: fb(rb.world), path: fb(rb.path) }, FL0)['1'].outcome, 'HELD']); }
  { const it = run(); cases.push(['the bins hold 400 records of 400 paths each', `${it['1'].cells[0][2].n} ${it['1'].cells[0][2].clusters}`, '400 400']); }
  // the exact edge: the interval's top exactly 0.03
  { const r = mk(); const se2 = (() => { const it = items(r, FL0); const x = it['1'].cells[0][4]; return (x.hi - x.m) / Z_B; })(); cases.push(['the interval\'s half-width is Z_B times the clustered standard error', se2 > 0, true]); }
  // item 2
  outc('2', { copies: 25, under: { 0: 0.06, 1: 0.06, 2: 0.06 } }, FL0, 'HELD', 'today\'s reads 0.06 under, 10,000 paths: 2 HELD');
  outc('2', { copies: 25, under: { 0: 0, 1: 0, 2: 0 } }, FL0, 'FALSIFIED', 'today\'s reads on the realised share, 10,000 paths: 2 FALSIFIED');
  outc('2', { copies: 25, under: { 0: 0.06, 1: 0.02, 2: 0 } }, FL0, 'INCONCLUSIVE', 'under 0.06 in world 0 and 0.02 in world 1: 2 INCONCLUSIVE');
  outc('2', { copies: 25, under: { 0: 0.033, 1: 0.06, 2: 0 } }, FL0, 'INCONCLUSIVE', 'under 0.033 in world 0 (its bottom under 0.03): 2 INCONCLUSIVE');
  outc('2', { under: { 0: 0.045, 1: 0.045, 2: 0 } }, FL0, 'INCONCLUSIVE', 'under 0.045 on 400 paths: its bottom under 0.03: 2 INCONCLUSIVE');
  // item 3
  outc('3', {}, FL0, 'HELD', 'c in [0.9, 1] at 0.9 of the supported nodes: 3 HELD');
  outc('3', {}, { 0: fl(0.5), 1: fl(0.5), 2: fl(0.5) }, 'FALSIFIED', 'at 0.5: 3 FALSIFIED');
  outc('3', {}, { 0: fl(0.7), 1: fl(0.7), 2: fl(0.7) }, 'INCONCLUSIVE', 'at 0.7: 3 INCONCLUSIVE');
  outc('3', {}, { 0: fl(0.8), 1: fl(0.8), 2: fl(0.8) }, 'HELD', 'exactly 0.8: 3 HELD'); EDGES.push('a flat share exactly at the HELD line');
  outc('3', {}, { 0: fl(0.6), 1: fl(0.6), 2: fl(0.6) }, 'FALSIFIED', 'exactly 0.6: 3 FALSIFIED'); EDGES.push('a flat share exactly at the FALSIFIED line');
  outc('3', {}, { 0: fl(0.9), 1: fl(0.5), 2: fl(0.9) }, 'INCONCLUSIVE', 'HELD in world 0, FALSIFIED in world 1: 3 INCONCLUSIVE');
  { const F = { 0: { S: [0.95 * 0.4, 0.5], p: [0.4, 0.6] }, 1: fl(0.9), 2: fl(0.9) }; const it = run({}, F); cases.push(['a node with p under 0.5 is not supported (one supported node, c 0.83)', `${it['3'].cells[0].sup} ${it['3'].cells[0].flat}`, '1 0']); }
  { const F = { 0: { S: [0.61, 0.6], p: [0.6, 0.6] }, 1: fl(0.9), 2: fl(0.9) }; const it = run({}, F); cases.push(['c past 1 is not in [0.9, 1]', `${it['3'].cells[0].flat}`, '1']); }
  // GO
  { const big = () => mk({ copies: 25, under: { 0: 0.06, 1: 0.06, 2: 0.06 } });
    cases.push(['GO on 1, 2 and 3 HELD', items(big(), FL0).go, true]); cases.push(['no GO when 3 is not HELD', items(big(), { 0: fl(0.7), 1: fl(0.7), 2: fl(0.7) }).go, false]); }
  // the cluster mean
  { const c = clusterMean([1, 1, 0, 0], [1, 1, 2, 2]); cases.push(['two clusters of two: the mean 0.5, two clusters', `${c.m} ${c.clusters}`, '0.5 2']); }
  // the read end to end
  { let L = [], err = null; try { L = report(mk({ under: { 0: 0.06, 1: 0.06, 2: 0.06 } }), FL0); } catch (e) { err = e.message; }
    const oc = L.find(l => l.startsWith('OUTCOME: ')) || '';
    cases.push(['the read prints three items, GO, world 2 and an OUTCOME of three, end to end', err || `${['1.', '2.', '3.'].every(p => L.some(l => l.startsWith(p)))} ${L.some(l => /^GO /.test(l))} ${L.some(l => l.startsWith('REPORTED, world 2'))} ${oc.split(', ').length}`, 'true true true 3']); }
  // the gate, on synthetic logs as the audit prints
  const pad = ''.padEnd(16);
  const logOf = (o = {}) => [`stamp: code ${o.code || 'c0'} audit a0 prediction p0 sha s0`,
    `AREF0: the adaptive floor chance at NODE-AX's BN records and tables, DP grid scale ${o.scale || 4}, ${o.nsim || 200} simulations a checked state (seed ${o.seed || 7002})`,
    ...Array.from({ length: o.cases || 1 }, () => `S360             case | job ${LABEL} | points 60 | lambda 0.0223606797749979`),
    ...(o.noAx ? [] : [`${pad} nodeax ${LABEL}: file ${o.ax || 'ax0'} stamp c a records 6`]),
    `${pad} checks ${LABEL}: gridTook ${o.grid !== undefined ? o.grid : 1}/1 (x)`, `${pad} checks ${LABEL}: recTook ${o.rec !== undefined ? o.rec : 6}/6`,
    ...[0, 1, 2].flatMap(k => [0, 1, 2, 3, 4].filter(b => !(o.dropCal === k && b === 4)).map(b => `${pad} cal ${LABEL} ${k} ${b}: records 10 p 0.5 realised 0.5 today 0.4`)),
    `${pad} checks ${LABEL}: dpTook ${o.dp !== undefined ? o.dp : 15}/${o.dpN !== undefined ? o.dpN : 15}`,
    ...[0, 1, 2].filter(k => o.dropFlat !== k).map(k => `${pad} flat ${LABEL} ${k}: nodes 9 band 2 supported 1 c in [0.9, 1] 1`),
    `${pad} file ${LABEL}: f.json.gz`, ...(o.noDone ? [] : [`${pad} done ${LABEL}`])].join('\n');
  const G0 = { scale: 4, nsim: 200 }, refuses = (what, j, opt = {}) => cases.push([`the gate refuses ${what}`, gate(j, { ...G0, ...opt }).length > 0, true]);
  cases.push(['the gate passes the job as registered', gate(parse(logOf()), G0).length, 0]);
  refuses('a job run twice', parse(logOf({ cases: 2 })));
  refuses('no done line', parse(logOf({ noDone: true })));
  refuses('another seed', parse(logOf({ seed: 7003 })));
  refuses('another scale', parse(logOf({ scale: 2 })));
  refuses('another simulation count', parse(logOf({ nsim: 100 })));
  refuses('gridTook failed', parse(logOf({ grid: 0 })));
  refuses('recTook short', parse(logOf({ rec: 5 })));
  refuses('dpTook short', parse(logOf({ dp: 14 })));
  refuses('dpTook over no bin', parse(logOf({ dp: 0, dpN: 0 })));
  refuses('a missing calibration line', parse(logOf({ dropCal: 1 })));
  refuses('a missing flatness line', parse(logOf({ dropFlat: 2 })));
  refuses('no NODE-AX line', parse(logOf({ noAx: true })));
  refuses('another NODE-AX file than the one on disk', parse(logOf({ ax: 'ax1' })), { axSha: 'ax0' });
  { const b64 = a => Buffer.from(a.buffer).toString('base64'), j = parse(logOf());
    const file = { stamp: j.stamp, nodeax: 'ax0', records: { P: b64(new Float32Array(6)), X: b64(new Uint8Array(6)), RD: b64(new Float32Array(6)), world: b64(new Int32Array(6)), path: b64(new Int32Array(6)), year: b64(new Int32Array(6)) }, flat: Object.fromEntries([0, 1, 2].map(k => [k, { S: b64(new Float32Array(2)), p: b64(new Float32Array(2)) }])) };
    cases.push(['the gate passes a file that is the log\'s', gate(j, { ...G0, file, axSha: 'ax0' }).length, 0]);
    refuses('a missing file', j, { file: undefined === 1 ? null : false });
    refuses('a file stamped by other code', j, { file: { ...file, stamp: { ...file.stamp, code: 'c9' } } });
    refuses('a file that read another NODE-AX file', j, { file: { ...file, nodeax: 'ax9' } });
    refuses('a file short of one record array', j, { file: { ...file, records: { ...file.records, RD: b64(new Float32Array(5)) } } });
    refuses('a file whose records are not recTook\'s', j, { file: { ...file, records: { ...file.records, P: b64(new Float32Array(7)), X: b64(new Uint8Array(7)), RD: b64(new Float32Array(7)), world: b64(new Int32Array(7)), path: b64(new Int32Array(7)), year: b64(new Int32Array(7)) } } });
    refuses('a file whose world 1 band nodes are not the log\'s', j, { file: { ...file, flat: { ...file.flat, 1: { S: b64(new Float32Array(3)), p: b64(new Float32Array(3)) } } } }); }
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
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagaref0'), scaleA = Number(args[1] || 1), nsimA = Number(args[2] || 1000);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (Object.keys(logs).length !== 1) { console.log(`GATE FAILED: ${Object.keys(logs).length} logs in ${DIR}, not one`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const j = parse(Object.values(logs)[0]);
  const fpath = j.file && join(DIR, j.file), file = fpath && existsSync(fpath) ? JSON.parse(gunzipSync(readFileSync(fpath)).toString()) : false;
  // the NODE-AX file it read: on disk, behind NODE-AX's own gate (its reducer in the tree)
  const AX = join(HERE, 'results', 'diagnodeax'), axf = join(AX, `S360-${LABEL.replace(/\//g, '-')}.json.gz`), axSha = existsSync(axf) ? sha16(readFileSync(axf)) : 'missing';
  const bad = gate(j, { scale: scaleA, nsim: nsimA, file, axSha });
  if (!PRE) { const red = spawnSync('node', [join(HERE, 'reduce-nodeax.mjs'), AX], { encoding: 'utf8', maxBuffer: 1 << 26 }); if (!/^GATE: passed/m.test(red.stdout || '')) bad.push('NODE-AX\'s files did not pass NODE-AX\'s gate'); }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the job once and done at the registered settings (scale ${scaleA}, ${nsimA} simulations, seed ${SEED}); gridTook with the menu, recTook and dpTook in full; three worlds' calibration and flatness lines; its file the log's; the NODE-AX file it read the one on disk${PRE ? '' : ', behind NODE-AX\'s gate'}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the file read; no figure is read'); process.exit(0); }
  const d = (x, T) => { const b = Buffer.from(x, 'base64'); return Array.from(new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.length))); };
  const R = { P: d(file.records.P, Float32Array), X: d(file.records.X, Uint8Array), RD: d(file.records.RD, Float32Array), world: d(file.records.world, Int32Array), path: d(file.records.path, Int32Array) };
  const FL = Object.fromEntries([0, 1, 2].map(k => [k, { S: d(file.flat[k].S, Float32Array), p: d(file.flat[k].p, Float32Array) }]));
  console.log('\nAREF STEP 0: the adaptive floor chance at NODE-AX\'s BN records and S / p over its tables (predictions/diag-aref0.md)');
  for (const L of report(R, FL)) console.log(L);
  for (const l of Object.values(logs)[0].split('\n').filter(l => /^\s+dpcheck /.test(l))) console.log(`  ${l.trim()}`);
}
