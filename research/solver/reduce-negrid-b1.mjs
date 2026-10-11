/*
 * NE-GRID B1's reducer (predictions/diag-negrid-b1.md; PLAN.md NE-GRID; audit-negrid.mjs). The gate runs first and refuses
 * any log it cannot vouch for; the items are read only by their registered rules.
 * THE GATE: the twelve jobs once and done, one stamp (code, audit, prediction) across the logs and in every file; the
 *   registered settings (the coarse and fine grids, paths a world, seed); each arm in its solve's meta and the candidate's
 *   others intact (armTook, the ran line); the forced pair at the registered actions and tiers (pairTook); one action list
 *   per household across its four jobs; three world tables a job; no corner counted past the clamp under BASE, nor under
 *   LOR on S224 (no bridge year), and S224's tables and own opening the same under both arms at each grid; on the five
 *   simulating jobs, P's and D's runs (and the own opening's where it is neither) of the registered paths in every world,
 *   their bits the file's, and forceIdentity on world 0's first 1,000 paths; and the coarse grid reproducing the records it
 *   is read against to the printed digits - S380 under BASE at P and under LOR at D, bridge 4 under LOR at D
 *   (results-neblend-a.txt) and S224 under BASE at its own opening (results-neroot.txt): the code moved by a counter only.
 * THE ITEMS (ALPHA 0.05; every threshold read on the figure rounded to 1e-9, so a boundary planted exactly reads exactly):
 *   1. The read space's gap is resolution's: on S380 the gap g = LOR's table less BASE's at each forced opening (P, D) in
 *      worlds 0 and 1, a cell counted where the coarse gap is at least half a point; HELD when every counted cell's
 *      |fine gap| / |coarse gap| is at most 0.5; FALSIFIED when every counted cell's is at least 0.8; INCONCLUSIVE
 *      otherwise, or with no cell counted. Deterministic: no interval.
 *   2. The tables converge toward their runs: on S380 at the fine grid, each arm at stage A's opening for it (BASE at P, LOR
 *      at D), A = sum over worlds of weight x |table less simulated|, against stage A's coarse A (BASE 2.5434 from
 *      4.2477, -2.1391, -2.4565; LOR 3.2377 from 2.0235, 4.2065, 0.5768: results-neblend-a.txt); HELD when both arms' A is at
 *      most half their coarse A at the point; FALSIFIED when both arms' lower bound (each world's distance from 0 of its
 *      exact interval, one-sided at ALPHA / 6, weighted) is above half their coarse A; INCONCLUSIVE otherwise.
 *   3. The tables price the de-risk at the fine grid (O142's step): on S380 under each arm, per world, the table's D less P
 *      against the simulated paired change of forcing D for P on the same paths (survivalChangeU at ALPHA / 3, guarded),
 *      err = table change less simulated change; HELD when every arm's and world's err is within a point at the point;
 *      FALSIFIED when some arm's and world's err interval lies wholly outside [-1, 1]; INCONCLUSIVE otherwise.
 *   4. Bridge 4 at the fine grid (the control): each arm's own opening, every world's table less simulated within 0.3
 *      points at the point (HELD); FALSIFIED when a world's interval lies wholly outside [-0.3, 0.3]; INCONCLUSIVE
 *      otherwise (NE-ROOT item 5's rule), over both arms.
 * REPORTED: every job's tables and own opening, the clamp counts, the coarse tables' D less P against the fine runs' change,
 *   S224's fine world line beside NE-ROOT's coarse one, bridge 4's read-space gaps.
 *   node research/solver/reduce-negrid-b1.mjs [dir] [paths a world] [coarse] [fine] > research/solver/results-negrid-b1.txt   (--preflight, --planted)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson, survivalChangeU } from './stats.mjs';
import { guarded } from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-negrid-b1.md';
export const COARSE = '30', FINE = '60', SEED = '7002', NPW = 4000, ALPHA = 0.05;
export const GMIN = 0.5, SHRINK = 0.5, STAY = 0.8, PRICE = 1, CTRL = 0.3;
export const WEIGHTS = [1 / 6, 2 / 3, 1 / 6];
export const PAIRS = Object.freeze({ S380: [12, 14], 'bridge 4': [57, 59], S224: [0, 2] });
export const HOUSEHOLDS = ['S380', 'bridge 4', 'S224'], ARMS = ['BASE', 'LOR'], GRIDS = ['coarse', 'fine'];
export const JOBS = HOUSEHOLDS.flatMap(id => ARMS.flatMap(arm => GRIDS.map(g => [id, arm, g])));
export const simulates = (id, arm, grid) => grid === 'fine' && !(id === 'S224' && arm === 'LOR');
export const key = (id, arm, grid) => `${id} ${arm} ${grid}`;
export const q = x => Math.round(x * 1e9) / 1e9;
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const CASEL = /^(bridge 4|S380|S224)\s+case \| job (BASE|LOR)\/P(\d+) \| grid (coarse|fine) \| lambda (\S+)$/;
const HEAD = /^NE-GRID B1: .* at (\d+) and (\d+) points, (\d+) paths a world on the fine grid \(seed (\d+)\)/;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) { j = { id: c[1], arm: c[2], pts: c[3], grid: c[4], stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null, head: hd ? { coarse: hd[1], fine: hd[2], npw: Number(hd[3]), seed: hd[4] } : null, tables: [], sims: {}, checks: {}, done: false }; jobs.push(j); continue; }
    if (!j) continue;
    const l = raw.trim(), L = `${j.arm}/P${j.pts}`;
    let m;
    if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if ((m = new RegExp(`^clamps ${esc(L)}: n (\\d+) lo (\\d+) hi (\\d+)$`).exec(l))) j.clamps = { n: Number(m[1]), lo: Number(m[2]), hi: Number(m[3]) };
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^actions ${esc(L)}: n (\\d+) hash (\\S+)$`).exec(l))) j.actions = { n: Number(m[1]), hash: m[2] };
    else if ((m = new RegExp(`^pair ${esc(L)}: P ai (\\d+) level (\\S+) tiers (\\S+); D ai (\\d+) level (\\S+) tiers (\\S+)$`).exec(l))) j.pair = { P: Number(m[1]), D: Number(m[4]), tP: m[3], tD: m[6], lP: m[2], lD: m[5] };
    else if ((m = /OWN ai (\d+) level (\S+) tiers (\S+)/.exec(l)) && l.startsWith(`openings ${L}:`)) j.own = { ai: Number(m[1]), level: m[2], tiers: m[3] };
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): P (\\S+) D (\\S+) OWN (\\S+)$`).exec(l))) j.tables.push({ k: Number(m[1]), weight: Number(m[3]), P: Number(m[4]), D: Number(m[5]), OWN: Number(m[6]) });
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) (P|D|OWN) ai (\\d+): (\\d+)/(\\d+) bits (\\S+)$`).exec(l))) j.sims[`${m[2]}${m[1]}`] = { ai: Number(m[3]), ok: Number(m[4]), n: Number(m[5]), bits: m[6] };
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const WANT = { BASE: { readerSplit: 'null', readerBlend: 'null' }, LOR: { readerSplit: 'null', readerBlend: 'logodds' } };
const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001' };
/* the coarse records the reads are set against, to the digits they printed: stage A's S380 BASE (at P) and LOR (at D) and
   bridge 4 LOR (at D) world tables (results-neblend-a.txt), NE-ROOT's S224 BASE at its own opening (results-neroot.txt) */
export function records(neblendText, nerootText) {
  const blk = (text, head) => { const i = text.indexOf(`\n${head}`); if (i < 0) return null; const b = text.slice(i + 1, text.indexOf('\n\n', i + 1)); const own = /own ai (\d+)/.exec(b); const t = [...b.matchAll(/world (\d) .*?OWN table (\S+) sim (\S+) \((\d+)\/(\d+)\)/g)].map(m => ({ table: Number(m[2]), ok: Number(m[4]), n: Number(m[5]) })); return t.length === 3 && own ? { own: Number(own[1]), worlds: t } : null; };
  const nr = (() => { const i = nerootText ? nerootText.indexOf('\nS224 BASE/W0.02:') : -1; if (i < 0) return null; const b = nerootText.slice(i + 1, nerootText.indexOf('\n\n', i + 1)); const t = [...b.matchAll(/world (\d) .*?OWN table (\S+) sim (\S+) \((\d+)\/(\d+)\)/g)].map(m => ({ table: Number(m[2]), ok: Number(m[4]), n: Number(m[5]) })); return t.length === 3 ? { worlds: t } : null; })();
  const out = { s380BASE: neblendText && blk(neblendText, 'S380 BASE/W0.02:'), s380LOR: neblendText && blk(neblendText, 'S380 LOR/W0.02:'), b4LOR: neblendText && blk(neblendText, 'bridge 4 LOR/W0.02:'), s224BASE: nr };
  return Object.values(out).every(Boolean) ? out : null;
}
/* each arm's coarse A, from the records: sum over worlds of weight x |table less simulated| */
export const coarseA = rec => ({ BASE: rec.s380BASE.worlds.reduce((t, x, k) => t + WEIGHTS[k] * Math.abs(x.table - 100 * x.ok / x.n), 0), LOR: rec.s380LOR.worlds.reduce((t, x, k) => t + WEIGHTS[k] * Math.abs(x.table - 100 * x.ok / x.n), 0) });

export function gate(jobs, { coarse = COARSE, fine = FINE, npw = NPW, seed = SEED, files = null, rec = null } = {}) {
  const bad = [], byKey = {};
  for (const j of jobs) { const k = key(j.id, j.arm, j.grid); (byKey[k] = byKey[k] || []).push(j); }
  for (const [id, arm, g] of JOBS) { const n = (byKey[key(id, arm, g)] || []).length; if (n !== 1) bad.push(`${key(id, arm, g)}: ${n ? 'run ' + n + ' times' : 'missing'}`); }
  const st0 = jobs[0] && jobs[0].stamp, fi = Math.min(npw, 1000);
  for (const j of jobs) {
    const k = key(j.id, j.arm, j.grid), pts = j.grid === 'fine' ? fine : coarse;
    if (!JOBS.some(([id, arm, g]) => id === j.id && arm === j.arm && g === j.grid)) { bad.push(`${k}: not a registered job`); continue; }
    if (!j.done) bad.push(`${k}: no done line`);
    if (!j.stamp || !st0 || ['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])) bad.push(`${k}: its stamp is not the other logs'`);
    if (!j.head || j.head.coarse !== coarse || j.head.fine !== fine || j.head.npw !== npw || j.head.seed !== seed) bad.push(`${k}: not at the registered settings (${coarse} and ${fine} points, ${npw} a world, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${k}: its job is at ${j.pts} points, not ${pts}`);
    if (!j.checks.armTook || j.checks.armTook[0] !== 1) bad.push(`${k}: armTook did not pass`);
    if (!j.checks.pairTook || j.checks.pairTook[0] !== 1) bad.push(`${k}: pairTook did not pass`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...WANT[j.arm], ...COMMON })) if (field(ran, f) !== v) bad.push(`${k}: ${f} is ${field(ran, f)}, not ${v}`);
    if (field(ran, 'pts') !== pts) bad.push(`${k}: not solved at ${pts} points`);
    if (!j.pair || j.pair.P !== PAIRS[j.id][0] || j.pair.D !== PAIRS[j.id][1] || j.pair.tP !== '0,0' || j.pair.tD !== '2,2' || j.pair.lP !== j.pair.lD) bad.push(`${k}: the forced pair is not the registered one`);
    if (!j.own) bad.push(`${k}: the openings line is missing or unread`);
    if (!j.actions) bad.push(`${k}: the actions line is missing`);
    if (j.tables.length !== 3 || j.tables.some((x, i) => x.k !== i)) bad.push(`${k}: not three world tables`);
    if (!j.clamps) bad.push(`${k}: the clamp count is missing`);
    else if (j.arm === 'BASE' && j.clamps.n !== 0) bad.push(`${k}: BASE counted ${j.clamps.n} LOR reads (the counter counts off the LOR arm)`);
    else if (j.arm === 'LOR' && j.id === 'S224' && j.clamps.n !== 0) bad.push(`${k}: S224 under LOR counted ${j.clamps.n} LOR reads (it has no bridge year)`);
    else if (j.arm === 'LOR' && j.id !== 'S224' && !(j.clamps.n > 0)) bad.push(`${k}: LOR counted no LOR read on a household with bridge years`);
    if (simulates(j.id, j.arm, j.grid)) {
      const need = ['P', 'D', ...(j.own && j.pair && j.own.ai !== j.pair.P && j.own.ai !== j.pair.D ? ['OWN'] : [])];
      for (let w = 0; w < 3; w++) for (const nm of need) { const s = j.sims[`${nm}${w}`]; if (!s || s.n !== npw) bad.push(`${k}: no ${nm} run of ${npw} paths in world ${w}`); }
      if (!j.checks.forceIdentity || j.checks.forceIdentity[0] !== fi || j.checks.forceIdentity[1] !== fi) bad.push(`${k}: forceIdentity did not pass on world 0's first ${fi} paths`);
      if (files) {
        const f = j.file && files[j.file];
        if (!f) bad.push(`${k}: its file ${j.file} is missing`);
        else {
          if (!f.stamp || !j.stamp || ['code', 'audit', 'prediction'].some(x => f.stamp[x] !== j.stamp[x])) bad.push(`${k}: its file is stamped by other code`);
          for (const [nm, s] of Object.entries(j.sims)) if (typeof f.bits[nm] !== 'string' || sha16(Buffer.from(f.bits[nm], 'base64')) !== s.bits) bad.push(`${k}: ${nm}'s bits are not the log's`);
        }
      }
    }
  }
  for (const id of HOUSEHOLDS) { const hs = new Set(jobs.filter(j => j.id === id && j.actions).map(j => j.actions.hash)); if (hs.size > 1) bad.push(`${id}: its jobs solved different action lists`); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.arm, j.grid), j]));
  for (const g of GRIDS) {
    const b = J[key('S224', 'BASE', g)], l = J[key('S224', 'LOR', g)];
    if (b && l && (b.tables.length !== l.tables.length || b.tables.some((x, i) => ['P', 'D', 'OWN'].some(o => !l.tables[i] || x[o].toFixed(6) !== l.tables[i][o].toFixed(6))) || !b.own || !l.own || b.own.ai !== l.own.ai)) bad.push(`S224 ${g}: LOR's tables or own opening are not BASE's (no bridge year: the arms must agree)`);
  }
  if (rec !== false) {
    if (!rec) bad.push('the coarse records (results-neblend-a.txt, results-neroot.txt) could not be read');
    else {
      const chk = (j, o, r, what) => { if (j && j.tables.length === 3 && (j.tables.some((x, i) => x[o].toFixed(4) !== r.worlds[i].table.toFixed(4)) || (r.own !== undefined && j.own && j.own.ai !== r.own))) bad.push(`${what}: its coarse tables ${j.tables.map(x => x[o].toFixed(4)).join(', ')} (own ai ${j.own && j.own.ai}) are not the record's ${r.worlds.map(x => x.table.toFixed(4)).join(', ')}${r.own !== undefined ? ` (own ai ${r.own})` : ''}`); };
      chk(J[key('S380', 'BASE', 'coarse')], 'P', rec.s380BASE, 'S380 BASE at P');
      chk(J[key('S380', 'LOR', 'coarse')], 'D', rec.s380LOR, 'S380 LOR at D');
      chk(J[key('bridge 4', 'LOR', 'coarse')], 'D', rec.b4LOR, 'bridge 4 LOR at D');
      chk(J[key('S224', 'BASE', 'coarse')], 'OWN', rec.s224BASE, 'S224 BASE at its own opening');
    }
  }
  return bad;
}

const a1 = ALPHA / 6;
/* a table less its runs, with the runs' exact interval one-sided at a1 */
export function offOf(table, ok, n) { const [l, h] = clopperPearson(ok, n, 2 * a1); return { d: table - 100 * ok / n, lo: table - 100 * h, hi: table - 100 * l }; }
const dist0 = (lo, hi) => (lo > 0 ? lo : hi < 0 ? -hi : 0);
export function pairCells(bA, bB) { let a = 0, b = 0, c = 0, d = 0; for (let i = 0; i < bA.length; i++) { const x = bA[i], y = bB[i]; if (x && y) a++; else if (x && !y) b++; else if (!x && y) c++; else d++; } return { a, b, c, d }; }
export function items(J, bitsOf, A30) {
  const out = {};
  // item 1: the read space's gap, coarse against fine, S380 at P and D in worlds 0 and 1
  const cells = [];
  for (const o of ['P', 'D']) for (const k of [0, 1]) {
    const gc = J[key('S380', 'LOR', 'coarse')].tables[k][o] - J[key('S380', 'BASE', 'coarse')].tables[k][o];
    const gf = J[key('S380', 'LOR', 'fine')].tables[k][o] - J[key('S380', 'BASE', 'fine')].tables[k][o];
    const counted = q(Math.abs(gc)) >= GMIN;
    cells.push({ o, k, gc, gf, counted, r: counted ? q(Math.abs(gf) / Math.abs(gc)) : null });
  }
  const cc = cells.filter(c => c.counted);
  out[1] = { outcome: cc.length && cc.every(c => c.r <= SHRINK) ? 'HELD' : cc.length && cc.every(c => c.r >= STAY) ? 'FALSIFIED' : 'INCONCLUSIVE', cells };
  // item 2: the tables against their runs at the fine grid, each arm at stage A's opening for it, against stage A's coarse A
  const conv = {};
  for (const [arm, o] of [['BASE', 'P'], ['LOR', 'D']]) {
    const j = J[key('S380', arm, 'fine')];
    const w = [0, 1, 2].map(k => { const s = j.sims[`${o}${k}`]; return offOf(j.tables[k][o], s.ok, s.n); });
    const A = w.reduce((t, x, k) => t + WEIGHTS[k] * Math.abs(x.d), 0), Alo = w.reduce((t, x, k) => t + WEIGHTS[k] * dist0(x.lo, x.hi), 0);
    conv[arm] = { o, w, A, Alo, A30: A30[arm], half: q(A) <= q(A30[arm] * SHRINK), surelyNot: q(Alo) > q(A30[arm] * SHRINK) };
  }
  out[2] = { outcome: conv.BASE.half && conv.LOR.half ? 'HELD' : conv.BASE.surelyNot && conv.LOR.surelyNot ? 'FALSIFIED' : 'INCONCLUSIVE', conv };
  // item 3: the risk price at the fine grid, D less P, table against the paired runs
  const price = {};
  for (const arm of ARMS) {
    const j = J[key('S380', arm, 'fine')];
    price[arm] = [0, 1, 2].map(k => {
      const c = pairCells(bitsOf(j, 'P', k), bitsOf(j, 'D', k)), N = c.a + c.b + c.c + c.d;
      const u = guarded(survivalChangeU(c.a, c.b, c.c, c.d, ALPHA / 3), c.b, c.c, N, ALPHA / 3);
      const dt = j.tables[k].D - j.tables[k].P;
      return { k, dt, ds: u.d, err: dt - u.d, lo: dt - u.hi, hi: dt - u.lo, cells: c };
    });
  }
  const pr = [...price.BASE, ...price.LOR];
  out[3] = { outcome: pr.every(x => q(Math.abs(x.err)) <= PRICE) ? 'HELD' : pr.some(x => q(x.lo) > PRICE || q(x.hi) < -PRICE) ? 'FALSIFIED' : 'INCONCLUSIVE', price };
  // item 4: bridge 4 at the fine grid, each arm's own opening
  const b4 = {};
  for (const arm of ARMS) {
    const j = J[key('bridge 4', arm, 'fine')], o = j.own.ai === j.pair.P ? 'P' : j.own.ai === j.pair.D ? 'D' : 'OWN';
    b4[arm] = { o, w: [0, 1, 2].map(k => { const s = j.sims[`${o}${k}`]; return { k, ...offOf(j.tables[k][o === 'OWN' ? 'OWN' : o], s.ok, s.n) }; }) };
  }
  const bw = [...b4.BASE.w, ...b4.LOR.w];
  out[4] = { outcome: bw.every(x => q(Math.abs(x.d)) <= CTRL) ? 'HELD' : bw.some(x => q(x.lo) > CTRL || q(x.hi) < -CTRL) ? 'FALSIFIED' : 'INCONCLUSIVE', b4 };
  return out;
}

/* PLANTED: every boundary the items and the gate turn on, read as it should; each boundary planted at a value the double
   holds exactly, so a comparison moved by one (<= for <) reads otherwise (the escapes of results-reduce-neblend-a-mutations.txt) */
const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
function planted() {
  const N = 4000, cases = [];
  // a synthetic set: tables per job and world, simulated counts per job, opening and world, and bits from the counts
  const tab = (P, D, OWN = P) => [0, 1, 2].map(k => ({ k, weight: WEIGHTS[k], P: P[k], D: D[k], OWN: OWN[k] }));
  const base = () => {
    const J = {};
    for (const [id, arm, g] of JOBS) J[key(id, arm, g)] = { id, arm, grid: g, own: { ai: PAIRS[id][0] }, pair: { P: PAIRS[id][0], D: PAIRS[id][1] }, tables: tab([50, 50, 50], [50, 50, 50]), sims: {} };
    for (const j of Object.values(J)) if (simulates(j.id, j.arm, j.grid)) for (let k = 0; k < 3; k++) for (const o of ['P', 'D']) j.sims[`${o}${k}`] = { ok: 2000, n: N };
    return J;
  };
  // bits: P's ok paths first; D shares them, then loses `lost` of them and saves `saved` more
  const mk = (ok, lost = 0, saved = 0) => { const b = new Uint8Array(N); for (let i = 0; i < ok; i++) b[i] = 1; for (let i = 0; i < lost; i++) b[i] = 0; for (let i = 0; i < saved; i++) b[ok + i] = 1; return b; };
  const bitsOf = (sw = {}) => (j, o, k) => { const okP = j.sims[`P${k}`].ok; const s = sw[`${j.id} ${j.arm} ${k}`] || [0, 0]; return o === 'P' ? mk(okP) : mk(okP, s[0], s[1]); };
  const A30 = { BASE: 2, LOR: 2 };
  const run = (mut, sw, a30 = A30) => { const J = base(); mut(J); for (const j of Object.values(J)) if (j.sims.D0) for (let k = 0; k < 3; k++) { const s = (sw || {})[`${j.id} ${j.arm} ${k}`]; if (s) j.sims[`D${k}`] = { ok: j.sims[`P${k}`].ok - s[0] + s[1], n: N }; } return items(J, bitsOf(sw), a30); };
  const setT = (J, id, arm, g, P, D) => { J[key(id, arm, g)].tables = tab(P, D); };
  // item 1: coarse gap 2 (LOR 52 against BASE 50) at P and D in worlds 0 and 1; the fine gap sets r
  const gaps = (fine, coarse = 2) => J => { setT(J, 'S380', 'LOR', 'coarse', [50 + coarse, 50 + coarse, 50], [50 + coarse, 50 + coarse, 50]); setT(J, 'S380', 'LOR', 'fine', [50 + fine, 50 + fine, 50], [50 + fine, 50 + fine, 50]); };
  cases.push(['the gap halves exactly (2 to 1) in every counted cell: 1 HELD', run(gaps(1))[1].outcome, 'HELD']); EDGES.push('a gap ratio exactly at 0.5');
  cases.push(['the gap to 1.0000001 of 2: 1 INCONCLUSIVE', run(gaps(1.0000001))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['the gap to 1.6 of 2 (ratio exactly 0.8): 1 FALSIFIED', run(gaps(1.6))[1].outcome, 'FALSIFIED']); EDGES.push('a gap ratio exactly at 0.8');
  cases.push(['the gap to 1.5999 of 2: 1 INCONCLUSIVE', run(gaps(1.5999))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['the gap grows (2 to 3): 1 FALSIFIED', run(gaps(3))[1].outcome, 'FALSIFIED']);
  cases.push(['the gap flips sign at the same size (2 to -2): 1 FALSIFIED', run(gaps(-2))[1].outcome, 'FALSIFIED']);
  cases.push(['no coarse gap of half a point (0.25 everywhere): 1 INCONCLUSIVE', run(gaps(0, 0.25))[1].outcome, 'INCONCLUSIVE']); EDGES.push('no cell counted');
  cases.push(['a coarse gap exactly 0.5 is counted (and halves): 1 HELD', run(gaps(0.25, 0.5))[1].outcome, 'HELD']); EDGES.push('a coarse gap exactly at half a point');
  cases.push(['one cell halves, one stays: 1 INCONCLUSIVE', run(J => { gaps(1)(J); J[key('S380', 'LOR', 'fine')].tables[1].D = 52; })[1].outcome, 'INCONCLUSIVE']);
  cases.push(['world 2\'s gap is not read (it stays at 2): 1 HELD', run(J => { gaps(1)(J); for (const g of GRIDS) { J[key('S380', 'LOR', g)].tables[2].P = 52; J[key('S380', 'LOR', g)].tables[2].D = 52; } })[1].outcome, 'HELD']);
  cases.push(['a gap in BASE\'s table read the same as LOR\'s (BASE 48 coarse, 49 fine): 1 HELD', run(J => { setT(J, 'S380', 'BASE', 'coarse', [48, 48, 50], [48, 48, 50]); setT(J, 'S380', 'BASE', 'fine', [49, 49, 50], [49, 49, 50]); })[1].outcome, 'HELD']);
  cases.push(['bridge 4\'s gaps do not count (bridge 4 off, S380 halved): 1 HELD', run(J => { gaps(1)(J); setT(J, 'bridge 4', 'LOR', 'fine', [55, 55, 55], [55, 55, 55]); })[1].outcome, 'HELD']);
  // item 2: A30 2 for both; world 0's table set off its runs by e (the weight 1/6 x 6 = 1 exactly)
  const off = (eB, eL, w = [0, 0, 0]) => J => { const jb = J[key('S380', 'BASE', 'fine')], jl = J[key('S380', 'LOR', 'fine')]; for (let k = 0; k < 3; k++) { jb.tables[k].P = 50 + (k === 0 ? eB : w[k]); jl.tables[k].D = 50 + (k === 0 ? eL : w[k]); } };
  cases.push(['both arms at their runs: 2 HELD', run(off(0, 0))[2].outcome, 'HELD']);
  cases.push(['both arms\' A exactly half their coarse A (world 0 off by 6, weight 1/6): 2 HELD', run(off(6, 6))[2].outcome, 'HELD']); EDGES.push('an A exactly at half the coarse A');
  cases.push(['LOR\'s A just past half (world 0 off by 6.00001): 2 INCONCLUSIVE', run(off(6, 6.00001))[2].outcome, 'INCONCLUSIVE']);
  cases.push(['both arms off by 12 in world 0 (its bound well past half): 2 FALSIFIED', run(off(12, 12))[2].outcome, 'FALSIFIED']);
  cases.push(['BASE off by 12, LOR at its runs: 2 INCONCLUSIVE', run(off(12, 0))[2].outcome, 'INCONCLUSIVE']); EDGES.push('one arm converged, the other not');
  cases.push(['both off by 7 in world 0 (A past half, its bound not): 2 INCONCLUSIVE', run(off(7, 7))[2].outcome, 'INCONCLUSIVE']);
  cases.push(['both off by -12 (under-read): 2 FALSIFIED', run(off(-12, -12))[2].outcome, 'FALSIFIED']);
  { const lo = (offOf(62, 2000, N).lo) / 6; cases.push(['both off by 12, the coarse A set so half of it is exactly the bound: 2 INCONCLUSIVE', run(off(12, 12), undefined, { BASE: 2 * lo, LOR: 2 * lo })[2].outcome, 'INCONCLUSIVE']); EDGES.push('a bound exactly at half the coarse A'); }
  cases.push(['item 2 reads BASE at P and LOR at D (BASE\'s D and LOR\'s P off by 12, not read): 2 HELD', run(J => { J[key('S380', 'BASE', 'fine')].tables[0].D = 62; J[key('S380', 'LOR', 'fine')].tables[0].P = 62; })[2].outcome, 'HELD']);
  cases.push(['item 2 against a coarse A of 4 (both off by 12 in world 0, A exactly half): 2 HELD', run(off(12, 12), undefined, { BASE: 4, LOR: 4 })[2].outcome, 'HELD']);
  // item 3: tables D less P against the paired runs
  const price = (dt, sw, arm = 'BASE') => J => { const j = J[key('S380', arm, 'fine')]; for (let k = 0; k < 3; k++) j.tables[k].D = 50 + dt[k]; };
  cases.push(['tables and runs agree D = P: 3 HELD', run(price([0, 0, 0]))[3].outcome, 'HELD']);
  cases.push(['the table prices D a point above P, the runs the same: 3 HELD', run(price([1, 0, 0]))[3].outcome, 'HELD']); EDGES.push('a price error exactly at a point');
  cases.push(['the table prices D 1.0000001 above P: 3 INCONCLUSIVE', run(price([1.0000001, 0, 0]))[3].outcome, 'INCONCLUSIVE']);
  cases.push(['the table prices D 5 above P, the runs no change: 3 FALSIFIED', run(price([5, 0, 0]))[3].outcome, 'FALSIFIED']);
  cases.push(['D loses 100 world-0 paths (2.5 points), the table prices it: 3 HELD', run(price([-2.5, 0, 0]), { 'S380 BASE 0': [100, 0] })[3].outcome, 'HELD']);
  cases.push(['D loses 100 world-0 paths, the table prices no change: 3 FALSIFIED', run(price([0, 0, 0]), { 'S380 BASE 0': [100, 0] })[3].outcome, 'FALSIFIED']);
  cases.push(['D saves 100 under LOR, LOR\'s table prices no change: 3 FALSIFIED', run(J => {}, { 'S380 LOR 1': [0, 100] })[3].outcome, 'FALSIFIED']); EDGES.push('a price error under one arm only');
  cases.push(['D loses 70 and saves 20 in world 0 (1.25 points), the table prices none, its interval reaching inside: 3 INCONCLUSIVE', run(price([0, 0, 0]), { 'S380 BASE 0': [70, 20] })[3].outcome, 'INCONCLUSIVE']);
  cases.push(['D saves 30 paths in world 2, loses none, the table prices 2.1 (FALSIFIED unguarded; the one-sided guard holds the interval out): 3 INCONCLUSIVE', run(price([0, 0, 2.1]), { 'S380 BASE 2': [0, 30] })[3].outcome, 'INCONCLUSIVE']); EDGES.push('a one-sided count the guard holds out');
  // item 4: bridge 4 at the fine grid, its own opening (P here)
  const b4 = (d, arm = 'LOR') => J => { const j = J[key('bridge 4', arm, 'fine')]; j.sims.P0 = { ok: 3900, n: N }; j.tables[0].P = 97.8 - 0.3 + d; };
  cases.push(['bridge 4 at its runs: 4 HELD', run(J => { for (const a of ARMS) { const j = J[key('bridge 4', a, 'fine')]; for (let k = 0; k < 3; k++) { j.sims[`P${k}`] = { ok: 3990, n: N }; j.tables[k].P = 99.75; } } })[4].outcome, 'HELD']);
  cases.push(['bridge 4 off by exactly 0.3 in world 0: 4 HELD', run(b4(0.3))[4].outcome, 'HELD']); EDGES.push('a control point exactly at 0.3');
  cases.push(['bridge 4 off by 0.3000001: 4 INCONCLUSIVE', run(b4(0.3000001))[4].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 off by 0.3 computed as 0.30000000000000004 (1.3 against 1): read rounded: 4 HELD', run(J => { const j = J[key('bridge 4', 'LOR', 'fine')]; j.sims.P0 = { ok: 40, n: N }; j.tables[0].P = 1.3; })[4].outcome, 'HELD']); EDGES.push('a boundary the double overshoots');
  cases.push(['bridge 4 off by 0.8 (its interval at ALPHA / 6 reaching inside 0.3, at ALPHA / 2 not): 4 INCONCLUSIVE', run(b4(0.8))[4].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 off by -0.5 at its point (its interval reaching inside): 4 INCONCLUSIVE', run(b4(-0.5))[4].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 off by 2 (BASE): 4 FALSIFIED', run(b4(2, 'BASE'))[4].outcome, 'FALSIFIED']);
  cases.push(['bridge 4 under by 2 (LOR): 4 FALSIFIED', run(b4(-2))[4].outcome, 'FALSIFIED']);
  cases.push(['bridge 4\'s own opening is D, its D runs read (D off by 5, P at its runs): 4 FALSIFIED', run(J => { const j = J[key('bridge 4', 'LOR', 'fine')]; j.own.ai = PAIRS['bridge 4'][1]; j.tables[0].D = 55; })[4].outcome, 'FALSIFIED']);
  cases.push(['bridge 4\'s own opening is P, its D off by 5 not read: 4 HELD', run(J => { J[key('bridge 4', 'LOR', 'fine')].tables[0].D = 55; })[4].outcome, 'HELD']);
  // the gate, on a synthetic log built as the audit prints
  const st = 'stamp: code C audit A prediction P sha S';
  const jobText = (id, arm, g, o = {}) => {
    const pts = o.pts || (g === 'fine' ? '6' : '4'), L = `${arm}/P${pts}`, pad = ''.padEnd(16), [P, D] = PAIRS[id], own = o.own !== undefined ? o.own : P;
    const ran = o.ran || `bridgeRead reader bridgeStep exact readerSplit null readerBlend ${arm === 'LOR' ? 'logodds' : 'null'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls ${o.e3 || 'true'} switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${o.ranPts || pts}`;
    const tabs = o.tabs || [[35.0977, 30.4985], [76.2609, 82.8315], [94.5685, 98.3518]];
    const out = [`${id.padEnd(16)} case | job ${arm}/P${pts} | grid ${g} | lambda 0.0223606797749979`, `${pad} solve CAND ${L}: table 3.0 secs 1`, `${pad} ran CAND ${L}: ${ran}`,
      `${pad} clamps ${L}: n ${o.clampN !== undefined ? o.clampN : arm === 'LOR' && id !== 'S224' ? 9 : 0} lo 0 hi 0`, `${pad} checks ${L}: armTook ${o.armTook !== undefined ? o.armTook : 1}/1`, `${pad} actions ${L}: n 60 hash ${o.hash || 'H' + id.length}`,
      `${pad} pair ${L}: P ai ${o.P !== undefined ? o.P : P} level 0.8 tiers 0,0; D ai ${D} level ${o.lD || '0.8'} tiers ${o.tD || '2,2'}`, `${pad} checks ${L}: pairTook ${o.pairTook !== undefined ? o.pairTook : 1}/1`, `${pad} openings ${L}: OWN ai ${own} level 0.8 tiers 0,0`];
    if (!o.dropTable) for (let k = 0; k < 3; k++) out.push(`${pad} tables ${L} ${k} z 0 weight ${WEIGHTS[k].toFixed(6)}: P ${(id === 'S380' && arm === 'BASE' ? tabs[k][0] : id === 'bridge 4' && arm === 'LOR' ? [99.1231, 99.9862, 99.9956][k] : id === 'S224' ? [25.7906, 77.0081, 97.4863][k] + (o.s224 || 0) : 50).toFixed(6)} D ${(id === 'S380' && arm === 'LOR' ? tabs[k][1] : id === 'bridge 4' && arm === 'LOR' ? [99.1231, 99.9862, 99.9956][k] + (o.b4 || 0) : 50).toFixed(6)} OWN ${(id === 'S224' ? [25.7906, 77.0081, 97.4863][k] + (o.s224 || 0) + (o.s224own || 0) : 50).toFixed(6)}`);
    if (simulates(id, arm, g)) {
      for (let k = 0; k < 3; k++) for (const nm of ['P', 'D', ...(own !== P && own !== D ? ['OWN'] : [])]) if (!(o.dropSim === `${nm}${k}`)) out.push(`${pad} sim ${L} ${k} ${nm} ai 1: 2/${o.simN || 4} bits ${o.bitsHash || 'B' + nm + k}`);
      out.push(`${pad} checks ${L}: forceIdentity ${o.force !== undefined ? o.force : 4}/${o.forceOf || 4} secs 1`, `${pad} file ${L}: ${id.replace(/ /g, '_')}-${arm}.json.gz`);
    }
    if (o.done !== false) out.push(`${pad} done ${L}`);
    return [st.replace('code C', `code ${o.code || 'C'}`), `NE-GRID B1: x at 4 and 6 points, ${o.npw || 4} paths a world on the fine grid (seed ${o.seed || '7002'}); 12 jobs; part 0/1`, ...out].join('\n');
  };
  const all = (mod = {}) => JOBS.map(([id, arm, g]) => parse(jobText(id, arm, g, mod[key(id, arm, g)] || {}))).flat();
  const rec = { s380BASE: { own: 12, worlds: [35.0977, 76.2609, 94.5685].map(t => ({ table: t })) }, s380LOR: { own: 14, worlds: [30.4985, 82.8315, 98.3518].map(t => ({ table: t })) }, b4LOR: { own: 59, worlds: [99.1231, 99.9862, 99.9956].map(t => ({ table: t })) }, s224BASE: { worlds: [25.7906, 77.0081, 97.4863].map(t => ({ table: t })) } };
  const G = (js, o2 = {}) => gate(js, { coarse: '4', fine: '6', npw: 4, seed: '7002', rec, ...o2 });
  const good = all({ [key('S380', 'BASE', 'coarse')]: { own: 12 }, [key('S380', 'LOR', 'coarse')]: { own: 14 }, [key('bridge 4', 'LOR', 'coarse')]: { own: 59 } });
  const mod = m => all({ [key('S380', 'BASE', 'coarse')]: { own: 12 }, [key('S380', 'LOR', 'coarse')]: { own: 14 }, [key('bridge 4', 'LOR', 'coarse')]: { own: 59 }, ...m });
  const refuses = (what, js, o2) => cases.push([`the gate refuses ${what}`, G(js, o2).length > 0, true]);
  cases.push(['the gate passes twelve good jobs', G(good).join(' / '), '']);
  refuses('a missing job', good.slice(1));
  refuses('a job run twice', [...good, good[0]]);
  refuses('a job with no done line', mod({ [key('S380', 'LOR', 'fine')]: { done: false } }));
  refuses('a stamp from other code', mod({ [key('S224', 'BASE', 'fine')]: { code: 'X' } }));
  refuses('another seed', mod({ [key('S380', 'BASE', 'fine')]: { seed: '7013' } }));
  refuses('another path count in the head', mod({ [key('S380', 'BASE', 'fine')]: { npw: 5 } }));
  refuses('a job at the other grid\'s points', mod({ [key('S380', 'BASE', 'fine')]: { pts: '4', ranPts: '6' } }));
  refuses('a solve at other points than its job', mod({ [key('S380', 'BASE', 'fine')]: { ranPts: '4' } }));
  refuses('armTook 0', mod({ [key('bridge 4', 'LOR', 'fine')]: { armTook: 0 } }));
  refuses('LOR whose solve carries no blend', mod({ [key('S380', 'LOR', 'fine')]: { ran: 'bridgeRead reader bridgeStep exact readerSplit null readerBlend null readerChance null jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 pts 6' } })); EDGES.push('an arm named but not in the meta');
  refuses('the candidate without e3pcls', mod({ [key('S380', 'BASE', 'coarse')]: { e3: 'false' } }));
  refuses('pairTook 0', mod({ [key('bridge 4', 'LOR', 'fine')]: { pairTook: 0 } }));
  refuses('a forced pair at other tiers', mod({ [key('S380', 'BASE', 'fine')]: { tD: '1,1' } }));
  refuses('a forced pair at two levels', mod({ [key('S380', 'BASE', 'fine')]: { lD: '0.9' } }));
  refuses('a forced pair at another action', mod({ [key('S380', 'BASE', 'fine')]: { P: 11, own: 11 } }));
  refuses('a household solved on two action lists', mod({ [key('S380', 'LOR', 'coarse')]: { own: 14, hash: 'other' } }));
  refuses('a missing world table', mod({ [key('S380', 'BASE', 'fine')]: { dropTable: true } }));
  refuses('BASE counting LOR reads', mod({ [key('S380', 'BASE', 'fine')]: { clampN: 1 } })); EDGES.push('a clamp count of one');
  refuses('S224 under LOR counting LOR reads', mod({ [key('S224', 'LOR', 'fine')]: { clampN: 1 } }));
  refuses('LOR counting no LOR read on S380', mod({ [key('S380', 'LOR', 'coarse')]: { own: 14, clampN: 0 } })); EDGES.push('a LOR job with no LOR read');
  refuses('S224 under LOR off BASE\'s tables by a millionth', mod({ [key('S224', 'LOR', 'coarse')]: { s224: 1e-6 } })); EDGES.push('S224\'s arms a millionth apart');
  refuses('S224 under LOR at another own opening', mod({ [key('S224', 'LOR', 'fine')]: { own: 2 } }));
  refuses('S224 under LOR off BASE\'s own-opening table alone', mod({ [key('S224', 'LOR', 'fine')]: { s224own: 1e-6 } }));
  refuses('a missing D run in world 2', mod({ [key('S380', 'LOR', 'fine')]: { dropSim: 'D2' } }));
  refuses('a run of other paths', mod({ [key('bridge 4', 'BASE', 'fine')]: { simN: 5 } }));
  refuses('an own opening that is neither P nor D, unrun', all({ [key('S380', 'BASE', 'coarse')]: { own: 12 }, [key('S380', 'LOR', 'coarse')]: { own: 14 }, [key('bridge 4', 'LOR', 'coarse')]: { own: 59 } }).map(j => (j.id === 'S380' && j.arm === 'BASE' && j.grid === 'fine' ? { ...j, own: { ai: 13 } } : j)));
  refuses('a forceIdentity one path short', mod({ [key('bridge 4', 'LOR', 'fine')]: { force: 3 } }));
  refuses('a forceIdentity over too few paths', mod({ [key('bridge 4', 'LOR', 'fine')]: { force: 3, forceOf: 3 } }));
  refuses('a forceIdentity over other paths than the first 1,000 of the runs', mod({ [key('bridge 4', 'LOR', 'fine')]: { force: 4, forceOf: 5 } }));
  refuses('S380 BASE off stage A\'s tables by a ten-thousandth', mod({ [key('S380', 'BASE', 'coarse')]: { own: 12, tabs: [[35.0978, 30.4985], [76.2609, 82.8315], [94.5685, 98.3518]] } })); EDGES.push('a default moved by a ten-thousandth');
  refuses('S380 LOR at another own opening than stage A\'s', mod({ [key('S380', 'LOR', 'coarse')]: { own: 12 } }));
  refuses('bridge 4 LOR off stage A\'s tables', mod({ [key('bridge 4', 'LOR', 'coarse')]: { own: 59, b4: 0.0001 } }));
  refuses('S224 BASE off NE-ROOT\'s tables', mod({ [key('S224', 'BASE', 'coarse')]: { s224: 0.0001 }, [key('S224', 'LOR', 'coarse')]: { s224: 0.0001 } }));
  refuses('a missing record', good, { rec: null });
  // files: the empty bits hash to E, so logs printing E against files holding '' agree
  const E = sha16(Buffer.alloc(0)), withE = m => { const o = {}; for (const [id, arm, g] of JOBS) o[key(id, arm, g)] = { bitsHash: E, ...(m[key(id, arm, g)] || {}) }; return all(o); };
  const goodF = withE({ [key('S380', 'BASE', 'coarse')]: { own: 12 }, [key('S380', 'LOR', 'coarse')]: { own: 14 }, [key('bridge 4', 'LOR', 'coarse')]: { own: 59 } });
  const filesOf = (js, code = 'C', drop = null) => Object.fromEntries(js.filter(j => j.file).map(j => [j.file, { stamp: { code, audit: 'A', prediction: 'P' }, bits: Object.fromEntries(Object.keys(j.sims).filter(nm => nm !== drop).map(nm => [nm, ''])) }]));
  cases.push(['the gate passes twelve good jobs with their files', G(goodF, { files: filesOf(goodF) }).join(' / '), '']);
  refuses('a missing file', goodF, { files: {} });
  refuses('a file whose bits are not the log\'s', good, { files: filesOf(good) });
  refuses('a file missing one run\'s bits', goodF, { files: filesOf(goodF, 'C', 'D1') });
  refuses('a file stamped by other code', goodF, { files: filesOf(goodF, 'X') });
  let failed = 0;
  for (const [what, got, want] of cases) {
    const okc = String(got) === String(want); if (!okc) failed++; console.log(`${okc ? 'ok  ' : 'FAIL'} ${what}: ${JSON.stringify(got)}`);
    const m = /: (\d) (HELD|INCONCLUSIVE|FALSIFIED)$/.exec(what); if (okc && m) REACHED[Number(m[1])].add(m[2]);
  }
  if (failed) { console.log(`PLANTED CHECK FAILED: ${failed} of ${cases.length}`); process.exit(1); }
  return cases.length;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (let i = 1; i <= 4; i++) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagnegrid'), npwA = Number(args[1] || NPW), coarseA_ = args[2] || COARSE, fineA = args[3] || FINE;
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const rf = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : null);
  const rec = PRE ? false : records(rf('results-neblend-a.txt'), rf('results-neroot.txt'));
  const bad = gate(jobs, { coarse: coarseA_, fine: fineA, npw: npwA, files, rec });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the twelve jobs once and done at the registered settings (${coarseA_} and ${fineA} points, ${npwA} paths a world, seed ${SEED}); every arm in its solve's meta; every self-check passed (armTook, pairTook, forceIdentity on world 0's first 1,000 paths); one action list a household; no LOR read counted under BASE or on S224, S224's arms the same; every file the log's${PRE ? '' : '; the coarse grid reproduces stage A\'s and NE-ROOT\'s records to the printed digits'}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.arm, j.grid), j]));
  const bitsOf = (j, o, k) => Buffer.from(files[j.file].bits[`${o}${k}`], 'base64');
  const A30 = coarseA(rec);
  const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
  console.log('\nNE-GRID B1: BASE and LOR at the coarse and fine grids on S380, bridge 4 and S224, the tuning seed (predictions/diag-negrid-b1.md)');
  for (const j of jobs) {
    console.log(`\n${key(j.id, j.arm, j.grid)} (${j.pts} points): own ai ${j.own.ai} level ${j.own.level} tiers ${j.own.tiers}; clamps n ${j.clamps.n} lo ${j.clamps.lo} hi ${j.clamps.hi}`);
    for (const x of j.tables) {
      const sim = o => { const s = j.sims[`${o}${x.k}`]; return s ? ` sim ${f4(100 * s.ok / s.n)} (${s.ok}/${s.n})` : ''; };
      console.log(`  world ${x.k} (weight ${x.weight}): P ${f4(x.P)}${sim('P')}; D ${f4(x.D)}${sim('D')}; OWN ${f4(x.OWN)}${sim('OWN')}`);
    }
  }
  const it = items(J, bitsOf, A30);
  console.log('\nTHE ITEMS (each read by its registered rule)');
  console.log(`1. S380's read-space gap (LOR less BASE) shrinks by half from ${coarseA_} to ${fineA} points: ${it[1].outcome}\n     ${it[1].cells.map(c => `${c.o} world ${c.k}: coarse ${f4(c.gc)} fine ${f4(c.gf)}${c.counted ? ` ratio ${f4(c.r)}` : ' (not counted)'}`).join('; ')}`);
  console.log(`2. S380's tables converge toward their runs at ${fineA} points: ${it[2].outcome}\n     ${['BASE', 'LOR'].map(a => { const c = it[2].conv[a]; return `${a} at ${c.o}: A ${f4(c.A)} (lower bound ${f4(c.Alo)}) against coarse ${f4(c.A30)}, half ${f4(c.A30 * SHRINK)}; by world ${c.w.map(x => `${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)})`).join(', ')}`; }).join('; ')}`);
  console.log(`3. S380's tables price D against P at ${fineA} points: ${it[3].outcome}\n     ${['BASE', 'LOR'].map(a => `${a}: ${it[3].price[a].map(x => `world ${x.k} table ${f4(x.dt)} runs ${f4(x.ds)} (${x.cells.c} saved/${x.cells.b} lost) err ${f4(x.err)} (${f4(x.lo)} to ${f4(x.hi)})`).join('; ')}`).join('\n     ')}`);
  console.log(`4. bridge 4 within 0.3 points at ${fineA} points: ${it[4].outcome}\n     ${['BASE', 'LOR'].map(a => `${a} at ${it[4].b4[a].o}: ${it[4].b4[a].w.map(x => `world ${x.k} ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)})`).join('; ')}`).join('\n     ')}`);
  console.log('\nREPORTED');
  for (const a of ARMS) { const jc = J[key('S380', a, 'coarse')], jf = J[key('S380', a, 'fine')]; console.log(`  S380 ${a}: the coarse tables' D less P by world ${jc.tables.map(x => f4(x.D - x.P)).join(', ')} against the fine runs' ${it[3].price[a].map(x => f4(x.ds)).join(', ')}; own opening coarse ai ${jc.own.ai}, fine ai ${jf.own.ai}`); }
  { const jf = J[key('S224', 'BASE', 'fine')], o = jf.own.ai === jf.pair.P ? 'P' : jf.own.ai === jf.pair.D ? 'D' : 'OWN'; console.log(`  S224 BASE at its fine own opening (ai ${jf.own.ai}): table less simulated by world ${jf.tables.map(x => { const s = jf.sims[`${o}${x.k}`]; return f4(x[o] - 100 * s.ok / s.n); }).join(', ')}; NE-ROOT's coarse ${rec.s224BASE.worlds.map(x => f4(x.table - 100 * x.ok / x.n)).join(', ')}`); }
  for (const g of GRIDS) { const b = J[key('bridge 4', 'BASE', g)], l = J[key('bridge 4', 'LOR', g)]; console.log(`  bridge 4 ${g}: LOR less BASE at P ${l.tables.map((x, k) => f4(x.P - b.tables[k].P)).join(', ')}; at D ${l.tables.map((x, k) => f4(x.D - b.tables[k].D)).join(', ')}`); }
  console.log(`REALISED item 1: ${f4(Math.max(...it[1].cells.filter(c => c.counted).map(c => c.r)))}`);
  console.log(`REALISED item 2: ${f4(Math.max(it[2].conv.BASE.A / it[2].conv.BASE.A30, it[2].conv.LOR.A / it[2].conv.LOR.A30))}`);
  console.log(`OUTCOME: ${[1, 2, 3, 4].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
}
