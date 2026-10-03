/*
 * 7AT: THE ALLOWANCE AXIS WITH A BUCKET AT THE WALL, AND O76'S DECISIVE READ (PLAN.md 7at; O71, O76; the maintainer's
 * go-ahead of 3 Oct 20:04 UK, scoped 20:41 UK to the allowance part; redesigned by the deep review after 7ar, deep-review-log.md
 * 3 Oct 21:52 UK). audit-7ar.mjs's audit, every line it printed kept (so the S130 DEFAULT and PCLSI units are held to 7ar's
 * records, and the S370 ones to 7ap's, line for line), on six READER units under TS+J at the estate weight 0.02 and the
 * switch margin (7ar's setting, so the arms stay comparable with 7ap's and 7ar's records):
 *   S370 and S130, each under the used-allowance axis snapped on 0, 0.5, 1 (DEFAULT, today's), interpolated on 0, 0.5, 1
 *   (PCLSI, 7ap's) and interpolated with a bucket at the wall on 0, 0.5, 0.75, 1 (WALL: the maintainer's grid point at the
 *   cliff the inputs locate - the used allowance crossing 0.75, O71).
 * Beside 7ar's lines, per unit and world:
 *   bdec:    per year, the read-(b) term (the read of the year-(t + 1) table with the reader's continuation extrapolated along
 *            the share row in place of its flat copy, extrap-7at.mjs, less the claim at t + 1), and over the reads the
 *            stencil's weighted flat copy (the sum of w_i c_i over unsupported nodes), its extrapolated value (the same with
 *            read (b)'s c_i) and the unsupported corners' own survival (the sum of w_i S_i over unsupported nodes), in points;
 *            and the reads where (b) moved the read by more than 1e-9 (the read's responsiveness, O79's root-cause step); and
 *            the stencil's weight on unsupported nodes read (b) left as the reader had them (a row with one supported node on the
 *            near side, or none: 'left'), so a read (b) that acts on only part of the copied weight is seen (the plan-auditor's
 *            BLOCKING 1 of 3 Oct 22:45 UK);
 *   pbstage: each path's bridge-stage read-(b) term (4 decimals), in path order, so arms and reads pair;
 *   pafter:  each path's after-access residual (the claim at access less the outcome; '-' for a path with no claim at access),
 *            in path order (item 2's paired comparison).
 * Read (c) of the deep review (the claim at the path's position with its share moved to the last supported node) is not
 * built (the prediction says why); read (b)'s FALSIFIED side is guarded by the weight it left flat instead.
 *   node research/solver/audit-7at.mjs [points=30] [paths per world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { locateVec, readValues } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';
import { extrapolate } from './extrap-7at.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

const POINTS = Number(process.argv[2] || 30), NPW = Number(process.argv[3] || 2000);
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-7at: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7at: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1)) { console.error(`audit-7at: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02, MID = [0.25, 0.75];

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
// [household, reader, setting, the allowance axis]; the setting is TS+J on every unit
export const UNITS = [['S370', 'READER', 'TS+J', 'DEFAULT'], ['S370', 'READER', 'TS+J', 'PCLSI'], ['S370', 'READER', 'TS+J', 'WALL'], ['S130', 'READER', 'TS+J', 'DEFAULT'], ['S130', 'READER', 'TS+J', 'PCLSI'], ['S130', 'READER', 'TS+J', 'WALL']];
// the DEFAULT and PCLSI units are 7ap's units 0 to 3 (S130's also 7ar's units 0 and 1), held to those records line for line
// by reduce-7at.mjs's gate (audit-7ap.mjs and audit-7ar.mjs are not imported: they run their units on load)
export const WALLB = [0, 0.5, 0.75, 1];
const WALL = [0.6, 0.75], PCLS = [0, 0.5, 1];
const snapOf = f => { let b = 0, d = Infinity; PCLS.forEach((x, k) => { const e = Math.abs(x - f); if (e < d) { d = e; b = k; } }); return b; };   // grid.js nearest(), the default read
export const labelOf = (S, X = 'DEFAULT') => `${S}/W${W}${X === 'DEFAULT' ? '' : `/${X}`}`;
const BANDS = [[0, 50, 'lt50'], [50, 90, '50-90'], [90, 99, '90-99'], [99, Infinity, 'ge99']];
const bandOf = c => BANDS.find(([lo, hi]) => c >= lo && c < hi)[2];
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
console.log(`7AT, THE ALLOWANCE AXIS WITH A BUCKET AT THE WALL AND O76'S READ (b) (7ar's audit, the reader's continuation also read extrapolated along the share row): TS+J on S370 and S130 with the reader, the allowance axis snapped, interpolated and interpolated with a bucket at 0.75, at the estate weight ${W}, ${POINTS} points, ${NPW} paths a world at each world's node (seed ${SEED}): the reader's year-0 reference against its own draw and the engine's bridge payment by world, and each world's table claim against its next along the policy's own paths, by year, stage, share and wealth position and claim band; ${UNITS.length} units; part ${pk}/${pn}`);

// the reference's own draw on the node paths (reading 1 above, reported): the schedule chanceOf kept (bills from year 0, the linear
// reference's rho and vol, or 'order''s per-pot rates and draw orders), the path's own yearly shock; paths paying every
// bill to within 1 (orderChance's tol), counted; for 'order' the best order's count
export const ownDraw = (sc, wt, v0, zpaths, tol = 1) => {
  const h = sc.bills.length;
  if (sc.orders) {
    let best = 0;
    for (const order of sc.orders) {
      let n = 0;
      for (const zs of zpaths) {
        const pot = { isa: v0 * wt.isa, gia: v0 * wt.gia, cash: v0 * wt.cash };
        let okp = true;
        for (let j = 0; j < h && okp; j++) {
          if (j > 0) { const q = sc.rate[j - 1], z = zs[sc.t + j - 1]; for (const x of ['isa', 'gia', 'cash']) pot[x] *= q[x][1] ? Math.exp(Math.log(1 + q[x][0]) + q[x][1] * z) : 1 + q[x][0]; }
          let need = sc.bills[j];
          if (need < 0) { pot.cash -= need; continue; }
          for (const x of order) { const take = Math.min(pot[x], need); pot[x] -= take; need -= take; if (need <= 0) break; }
          if (need > tol) okp = false;
        }
        if (okp) n++;
      }
      if (n > best) best = n;
    }
    return best;
  }
  let n = 0;
  for (const zs of zpaths) {
    let acc = v0, okp = true;
    for (let j = 0; j < h; j++) {
      if (j > 0) acc *= Math.exp(sc.rho[j - 1] + sc.vol[j - 1] * zs[sc.t + j - 1]);
      acc -= sc.bills[j];
      if (acc < -tol) { okp = false; break; }
      if (acc < 0) acc = 0;   // within the tolerance: nothing left, as referenceChance takes max(x, 0)
    }
    if (okp) n++;
  }
  return n;
};
const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };
const openGap = (r, zs) => {
  let s0 = null, h0 = null;
  runPolicy(r, zs, { choose: (t, st, held) => { if (t === 0 && !s0) { s0 = Float64Array.from(st); h0 = { ...held }; } return chooseAction(r, st, t, held); } });
  const acts = r.c.acts, at = sm => acts[chooseAt(r, s0, 0, h0, sm)];
  const stays = sm => { const a = at(sm); return a.tierPen === h0.pen && a.tierIsa === h0.isa; };
  let gap;
  if (stays(0)) gap = '0';
  else if (!stays(1)) gap = '>1';
  else { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (stays(mid)) hi = mid; else lo = mid; } gap = hi.toExponential(4); }
  return { gap, open: [0.001, 0].map(sm => at(sm).tierPen).join(',') };
};

// 7ar: the read of world k's year-t table, from the layer of the tier pair move `ai` (taken at t - 1) goes to, at the path's
// position `st` at t: solve.js scoreMoves's own read (readValues with the layer's survival, bequest, resilience and
// shortfall tables and the year, so the reader runs where scoreMoves runs it), in points; and the same stencil read through
// indicator tables in place of the reader's c (R 0, the chance 1): the weight on nodes whose reader chance is under 0.5
// (unsupported, reader.js) and on nodes whose whole share row is unsupported (c copied from another wealth row)
const RDB = new Float64Array(4), IND = new Map();
const indicatorsOf = (g, RD) => {
  if (IND.has(RD)) return IND.get(RD);
  const n = g.size, un = new Float64Array(n), rc = new Float64Array(n), z = new Float64Array(n), { np, ni, nt } = g, NG = g.gain.length, NCL = g.pcls.length;
  for (let i = 0; i < n; i++) un[i] = RD.p[i] < 0.5 ? 1 : 0;
  for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
    let any = false;
    for (let ii = 0; ii < ni; ii++) if (!un[g.index(ip, ii, it, ig, ic)]) { any = true; break; }
    if (!any) for (let ii = 0; ii < ni; ii++) rc[g.index(ip, ii, it, ig, ic)] = 1;
  }
  const one = () => 1, mk = c => ({ ...g, readerAcc: null, reader: { ...g.reader, of: { get: () => ({ chance: one, c, R: z }) } } });
  const x = { gu: mk(un), gr: mk(rc) };
  IND.set(RD, x);
  return x;
};
// 7at: read (b) - the same stencil with the reader's c extrapolated along the share row (extrap-7at.mjs) and R to match,
// read through the reader's own chance at the path's accessible money - and three stencil sums over the unsupported nodes:
// the flat copy's c, read (b)'s c and the node's own survival S (indicator-weighted tables, chance 1, R 0), in points
const XB = new Map();
export const XCOUNT = { extrapolated: 0, flat: 0, tables: 0 };
const extrapOf = (g, RD) => {
  if (XB.has(RD)) return XB.get(RD);
  const x = extrapolate(g, RD), n = g.size, uc = new Float64Array(n), ub = new Float64Array(n), us = new Float64Array(n), ul = new Float64Array(n), z = new Float64Array(n);
  XCOUNT.extrapolated += x.extrapolated; XCOUNT.flat += x.flat; XCOUNT.tables++;
  for (let i = 0; i < n; i++) if (RD.p[i] < 0.5) { uc[i] = RD.c[i]; ub[i] = x.c[i]; us[i] = x.S[i]; ul[i] = x.ex[i] ? 0 : 1; }
  const one = () => 1, mk = c => ({ ...g, readerAcc: null, reader: { ...g.reader, of: { get: () => ({ chance: one, c, R: z }) } } });
  const y = { gb: { ...g, reader: { ...g.reader, of: { get: () => ({ ...RD, c: x.c, R: x.R }) } } }, gc: mk(uc), gx: mk(ub), gs: mk(us), gl: mk(ul) };
  XB.set(RD, y);
  return y;
};
const readAt = (tab, ai, st, t) => {
  const Ln = tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[ai]] : tab;
  const g = tab.g, ls = Ln.lsurv[t];
  readValues(g, ls, Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t);
  const v = 100 * RDB[0];
  const RD = g.reader && g.reader.years[t] ? g.reader.of.get(ls) : null;
  if (!RD) return { v, u: 0, rc: 0, vb: v, fc: 0, xc: 0, su: 0, lf: 0 };
  const { gu, gr } = indicatorsOf(g, RD), cl = x => (x <= 2e-6 ? 0 : x >= 1 - 2e-6 ? 1 : x);
  const u = cl(readValues(gu, ls, Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t)[0]);
  const rc = cl(readValues(gr, ls, Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t)[0]);
  const X = extrapOf(g, RD), rd = gg => 100 * readValues(gg, ls, Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t)[0];
  const vb = rd(X.gb), fc = u > 0 ? rd(X.gc) : 0, xc = u > 0 ? rd(X.gx) : 0, su = u > 0 ? rd(X.gs) : 0, lf = u > 0 ? cl(readValues(X.gl, ls, Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t)[0]) : 0;
  return { v, u, rc, vb, fc, xc, su, lf };
};
export const UBINS = [[0, 1e-9, 'u0'], [1e-9, 0.25, 'ulo'], [0.25, Infinity, 'uhi']];
const ubinOf = u => UBINS.find(([lo, hi]) => u >= lo && u < hi)[2];

UNITS.forEach(([id, A, SET, X], i) => {
  if (i % pn !== pk) return;
  const TSJ = SET === 'TS+J', h = all.find(s => s.id === id), label = labelOf(SET, X), L = `${A}/${label}`;
  if (!h) { console.error(`audit-7at: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  // measureV2's plan and solve (audit-s126.mjs, as audit-7ai.mjs copies it), forward: false; readerRef 'order' as diag7ah
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: A === 'OFF' ? false : 'reader', bequestWeight: W, ...(TSJ ? { tierState: true, jointWorlds: true } : {}), ...(A === 'ORDER' ? { readerRef: 'order' } : {}), ...(X === 'PCLSI' ? { pclsInterp: true } : X === 'WALL' ? { pclsInterp: true, pclsBuckets: WALLB } : {}) });
  const m = r.m, s0 = M.initialState(m), T = m.ctx.totalYears, K = r.worlds.length;
  const table = 100 * r.worlds.reduce((t, w, k) => t + r.mix.weights[k] * w.value(s0, 0).survival, 0);
  const secs = (Date.now() - t0) / 1000;
  if (!r.meta.tierState !== !TSJ || !r.meta.jointWorlds !== !TSJ) { console.error(`audit-7at: ${L} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
  if (!(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-7at: ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
  if ((A === 'ORDER') !== (r.meta.readerRef === 'order')) { console.error(`audit-7at: ${L} ran the reference ${r.meta.readerRef}`); process.exit(2); }
  if ((X !== 'DEFAULT') !== (r.g.pclsInterp === true) || r.g.pcls.join(',') !== (X === 'WALL' ? WALLB : PCLS).join(',')) { console.error(`audit-7at: ${L} ran pclsInterp ${r.g.pclsInterp} pcls ${r.g.pcls.join(',')}`); process.exit(2); }
  if ((A === 'OFF') !== !r.g.reader) { console.error(`audit-7at: ${L} has ${r.g.reader ? 'a' : 'no'} reader`); process.exit(2); }
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NPW} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5}${r.meta.tierState ? ` tierState ${r.meta.tierState}` : ''}${A === 'ORDER' ? ` readerRef ${r.meta.readerRef}` : ''} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead}`;
  const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
  console.log(`${''.padEnd(16)} solve ${L}: table ${table.toFixed(4)} secs ${Math.round(secs)}`);
  console.log(`${''.padEnd(16)} ran ${L}: ${ran}`);
  const paths = E.pathsForSeed(SEED, NPW, T);
  { const g = openGap(r, paths[0]); console.log(`${''.padEnd(16)} gap ${L}: ${g.gap} opening ${g.open}`); }
  console.log(`${''.padEnd(16)} joint ${L}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} scale ${Math.round(Math.max(1, m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
  const access = Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0);
  console.log(`${''.padEnd(16)} access ${L}: year ${access} years ${T} worlds ${K}`);
  console.log(`${''.padEnd(16)} axis ${L}: pclsInterp ${r.g.pclsInterp} pcls ${r.g.pcls.join(',')} pclsStrict ${r.g.pclsStrict}`);   // 7ap: the allowance axis as solved
  // the opening's accessible money: the ISA, the taxable account and cash (grid.js vecOf's slots 1 and 2)
  const v0 = (() => { const o = m.ctx.owners[0]; return (s0.pots[o.ids.isa] || 0) + (s0.pots[o.ids.other] || 0) + (s0.pots[o.ids.cash] || 0); })();
  const n = r.c.acts.length, S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n), V2 = new Float64Array(n);
  for (let k = 0; k < K; k++) {
    const z = r.mix.nodes[k], tab = r.mix.tables[k];
    const zpaths = paths.map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
    const t1 = Date.now(), N = zpaths.length, ok = new Uint8Array(N), tr = makeTrace(N, T + 1);
    const used = new Float32Array(N * (T + 2)).fill(NaN), claim = new Float32Array(N * (T + 2)).fill(NaN), mid = new Int8Array(N * (T + 2)).fill(-1), wmid = new Int8Array(N * (T + 2)).fill(-1);
    // 7ar: the read of the year-(t + 1) table at the path's position at t + 1 (stored at t + 1), its unsupported and row-copy
    // weights, and the move at t
    const rdAt = new Float32Array(N * (T + 2)).fill(NaN), uw = new Float32Array(N * (T + 2)).fill(NaN), rw = new Float32Array(N * (T + 2)).fill(NaN), mv = new Int16Array(N * (T + 2)).fill(-1);
    // 7at: read (b) and the three unsupported-node sums, stored as the read is
    const rbAt = new Float64Array(N * (T + 2)).fill(NaN), fcAt = new Float32Array(N * (T + 2)).fill(NaN), xcAt = new Float32Array(N * (T + 2)).fill(NaN), suAt = new Float32Array(N * (T + 2)).fill(NaN), raAt = new Float64Array(N * (T + 2)).fill(NaN), lfAt = new Float32Array(N * (T + 2)).fill(NaN);
    let row = 0;
    const choose = (t, st, held) => {
      const ai = chooseAction(r, st, t, held);
      if (held && t <= T) {
        if (t >= 1 && mv[row * (T + 2) + t - 1] >= 0) {
          const x = readAt(tab, mv[row * (T + 2) + t - 1], st, t);
          rdAt[row * (T + 2) + t] = x.v; uw[row * (T + 2) + t] = x.u; rw[row * (T + 2) + t] = x.rc;
          raAt[row * (T + 2) + t] = x.v; rbAt[row * (T + 2) + t] = x.vb; fcAt[row * (T + 2) + t] = x.fc; xcAt[row * (T + 2) + t] = x.xc; suAt[row * (T + 2) + t] = x.su; lfAt[row * (T + 2) + t] = x.lf;
        }
        mv[row * (T + 2) + t] = ai;
        scoreMoves(tab, st, t, S2, T2, B2, held, null, V2);
        claim[row * (T + 2) + t] = 100 * V2[ai];
        used[row * (T + 2) + t] = Math.min(1, st[4] / m.P.lsa);   // the used share of the allowance (grid.js vecOf's slot 4)
        const loc = locateVec(r.g, st), w = loc.i.w, ww = loc.p.w;   // the chooser's state is the vector (grid.js vecOf's slots)
        mid[row * (T + 2) + t] = w >= MID[0] && w <= MID[1] ? 1 : 0;
        wmid[row * (T + 2) + t] = ww >= MID[0] && ww <= MID[1] ? 1 : 0;
      }
      return ai;
    };
    zpaths.forEach((zs, j) => { row = j; tr.row = j; const o = runPolicy(r, zs, { trace: tr, choose }); if (o.survived) ok[j] = 1; });
    let paid = 0; for (let j = 0; j < N; j++) { const fy = tr.failYear[j]; if (!(fy >= 0 && fy < access)) paid++; }
    const sim = 100 * ok.reduce((t, x) => t + x, 0) / N;
    if (r.g.reader) {
      const f = r.g.reader.chanceOf(k, 0), own = ownDraw(f.schedule, r.g.reader.weights, v0, zpaths);
      console.log(`${''.padEnd(16)} bridgeref ${L} world ${k}: reference ${(100 * f(v0)).toFixed(4)} at ${Math.round(v0)} own ${(100 * own / N).toFixed(4)} drawn ${own} of ${N} engine ${(100 * paid / N).toFixed(4)} paid ${paid} of ${N}`);
    } else console.log(`${''.padEnd(16)} bridgeref ${L} world ${k}: reference - engine ${(100 * paid / N).toFixed(4)} paid ${paid} of ${N}`);
    console.log(`${''.padEnd(16)} node ${L} world ${k} z ${z.toFixed(4)}: sim ${sim.toFixed(4)} paths ${N} secs ${Math.round((Date.now() - t1) / 1000)}`);
    // the residual: the claim at t less the claim at t + 1, or the realised outcome when t + 1 has none
    const byYear = Array.from({ length: T + 1 }, () => ({ n: 0, c: 0, nx: 0 }));
    const cells = {}, wcells = {}, bands = {};
    for (const st of ['bridge', 'after']) { for (const p of ['mid', 'near']) { cells[`${st} ${p}`] = { n: 0, c: 0, nx: 0 }; wcells[`${st} ${p}`] = { n: 0, c: 0, nx: 0 }; } for (const b of BANDS) bands[`${st} ${b[2]}`] = { n: 0, c: 0, nx: 0 }; }
    for (let j = 0; j < N; j++) for (let t = 0; t <= T; t++) {
      const c = claim[j * (T + 2) + t];
      if (c !== c) continue;
      const c1 = claim[j * (T + 2) + t + 1], next = c1 === c1 ? c1 : 100 * ok[j];
      const y = byYear[t]; y.n++; y.c += c; y.nx += next;
      const stg = t < access ? 'bridge' : 'after';
      for (const q of [cells[`${stg} ${mid[j * (T + 2) + t] === 1 ? 'mid' : 'near'}`], wcells[`${stg} ${wmid[j * (T + 2) + t] === 1 ? 'mid' : 'near'}`], bands[`${stg} ${bandOf(c)}`]]) { q.n++; q.c += c; q.nx += next; }
    }
    // 7ap: the used allowance by year, and the residual by bucket change and share position, and by the wall
    const lsa = Array.from({ length: T + 1 }, () => ({ n: 0, u: 0, wall: 0, over: 0, chg: 0, stall: 0 })), pcell = {}, wall = {};
    for (const st of ['bridge', 'after']) { for (const cg of ['chg', 'same']) for (const p of ['mid', 'near']) pcell[`${st} ${cg} ${p}`] = { n: 0, c: 0, nx: 0 }; for (const w of ['wall', 'off']) wall[`${st} ${w}`] = { n: 0, c: 0, nx: 0 }; }
    for (let j = 0; j < N; j++) for (let t = 0; t <= T; t++) {
      const c = claim[j * (T + 2) + t];
      if (c !== c) continue;
      const u = used[j * (T + 2) + t], u1 = used[j * (T + 2) + t + 1];
      const c1 = claim[j * (T + 2) + t + 1], next = c1 === c1 ? c1 : 100 * ok[j];
      const chg = u1 === u1 && snapOf(u1) !== snapOf(u), atWall = u >= WALL[0] && u < WALL[1];
      const y = lsa[t]; y.n++; y.u += u; if (atWall) y.wall++; if (u >= WALL[1]) y.over++; if (chg) y.chg++;
      if (atWall && u1 === u1 && u1 <= u + 1e-9) y.stall++;   // the draw stall: at the wall, the used allowance not growing to t + 1 (the deep review after 7am)
      const stg = t < access ? 'bridge' : 'after';
      for (const q of [pcell[`${stg} ${chg ? 'chg' : 'same'} ${mid[j * (T + 2) + t] === 1 ? 'mid' : 'near'}`], wall[`${stg} ${atWall ? 'wall' : 'off'}`]]) { q.n++; q.c += c; q.nx += next; }
    }
    for (let t = 0; t <= T; t++) { const y = lsa[t]; console.log(`${''.padEnd(16)} lsa ${L} world ${k} year ${t}: paths ${y.n} used ${y.n ? (y.u / y.n).toFixed(4) : '-'} wall ${y.wall} over ${y.over} chg ${y.chg} stall ${y.stall}`); }
    for (let t = 0; t <= T; t++) { const y = byYear[t]; console.log(`${''.padEnd(16)} resid ${L} world ${k} year ${t}: paths ${y.n} table ${y.n ? (y.c / y.n).toFixed(4) : '-'} next ${y.n ? (y.nx / y.n).toFixed(4) : '-'}`); }
    // the per-path stage residual (item 3 above)
    for (const stg of ['bridge', 'after']) {
      const v = []; let c0 = 0, c1 = 0, thru = 0;
      for (let j = 0; j < N; j++) {
        const at = t => claim[j * (T + 2) + t];
        if (stg === 'bridge') {
          if (!(access > 0) || at(0) !== at(0)) continue;
          const e = access <= T && at(access) === at(access) ? at(access) : (access > T ? 100 * ok[j] : 0);
          v.push(at(0) - e); c0 += at(0); c1 += e; if (access > T ? ok[j] : at(access) === at(access)) thru++;
        } else {
          if (!(access <= T) || at(access) !== at(access)) continue;
          v.push(at(access) - 100 * ok[j]); c0 += at(access); c1 += 100 * ok[j]; if (ok[j]) thru++;
        }
      }
      const mean = v.length ? v.reduce((t, x) => t + x, 0) / v.length : NaN;
      const sd = v.length > 1 ? Math.sqrt(v.reduce((t, x) => t + (x - mean) * (x - mean), 0) / (v.length - 1)) : NaN;
      console.log(`${''.padEnd(16)} stage ${L} world ${k} ${stg}: paths ${v.length} start ${v.length ? (c0 / v.length).toFixed(4) : '-'} end ${v.length ? (c1 / v.length).toFixed(4) : '-'} through ${thru} mean ${v.length ? mean.toFixed(4) : '-'} sd ${v.length > 1 ? sd.toFixed(4) : '-'}`);
    }
    for (const [tag, set] of [['cell', cells], ['wcell', wcells], ['band', bands], ['pcell', pcell], ['wall', wall]]) for (const [key, q] of Object.entries(set)) console.log(`${''.padEnd(16)} ${tag} ${L} world ${k} ${key}: pathyears ${q.n} table ${q.n ? (q.c / q.n).toFixed(4) : '-'} next ${q.n ? (q.nx / q.n).toFixed(4) : '-'}`);
    // 7ar: the three terms by year and by stage and unsupported weight, the moves to access, and each path's bridge-stage terms
    const dec = Array.from({ length: T + 1 }, () => ({ n: 0, q: 0, d: 0, e: 0, nr: 0, u: 0, rc: 0 })), dbin = {};
    for (const st of ['bridge', 'after']) for (const b of [...UBINS.map(x => x[2]), 'end']) dbin[`${st} ${b}`] = { n: 0, q: 0, d: 0, e: 0 };
    const pq = new Float64Array(N), pd = new Float64Array(N), pe = new Float64Array(N);
    for (let j = 0; j < N; j++) for (let t = 0; t <= T; t++) {
      const c = claim[j * (T + 2) + t];
      if (c !== c) continue;
      const c1 = claim[j * (T + 2) + t + 1], rd = rdAt[j * (T + 2) + t + 1];
      let q = 0, d = 0, e = 0, b = 'end';
      if (c1 === c1) {
        if (rd !== rd) { console.error(`audit-7at: ${L} world ${k} path ${j} year ${t + 1}: a claim without a read`); process.exit(2); }
        q = c - rd; d = rd - c1;
        const u = uw[j * (T + 2) + t + 1]; b = ubinOf(u);
        const y = dec[t]; y.nr++; y.u += u; y.rc += rw[j * (T + 2) + t + 1];
      } else e = c - 100 * ok[j];
      const y = dec[t]; y.n++; y.q += q; y.d += d; y.e += e;
      const stg = t < access ? 'bridge' : 'after', z = dbin[`${stg} ${b}`]; z.n++; z.q += q; z.d += d; z.e += e;
      if (stg === 'bridge') { pq[j] += q; pd[j] += d; pe[j] += e; }
    }
    const f4 = (x, n) => (n ? (x / n).toFixed(4) : '-');
    for (let t = 0; t <= T; t++) { const y = dec[t]; console.log(`${''.padEnd(16)} dec ${L} world ${k} year ${t}: paths ${y.n} quad ${f4(y.q, y.n)} read ${f4(y.d, y.n)} end ${f4(y.e, y.n)} reads ${y.nr} unsup ${f4(y.u, y.nr)} rowcopy ${f4(y.rc, y.nr)}`); }
    for (const [key, z] of Object.entries(dbin)) console.log(`${''.padEnd(16)} dbin ${L} world ${k} ${key}: pathyears ${z.n} quad ${f4(z.q, z.n)} read ${f4(z.d, z.n)} end ${f4(z.e, z.n)}`);
    for (let t = 0; t <= Math.min(access, T); t++) {
      const cnt = new Map();
      for (let j = 0; j < N; j++) { const a = mv[j * (T + 2) + t]; if (a >= 0) cnt.set(a, (cnt.get(a) || 0) + 1); }
      const mvs = [...cnt].sort((x, y) => y[1] - x[1] || x[0] - y[0]).map(([a, n]) => `${a}:p${r.c.acts[a].tierPen || 0}i${r.c.acts[a].tierIsa || 0}l${r.actions[a].spendLevel !== undefined ? r.actions[a].spendLevel : 1}x${n}`);
      console.log(`${''.padEnd(16)} moves ${L} world ${k} year ${t}: ${mvs.join(' ') || '-'}`);
    }
    if (access > 0) console.log(`${''.padEnd(16)} pstage ${L} world ${k}: ${Array.from({ length: N }, (_, j) => `${pq[j].toFixed(4)},${pd[j].toFixed(4)},${pe[j].toFixed(4)}`).join(';')}`);
    // 7at: the read-(b) term by year, the unsupported-node sums and the responsiveness count; each path's bridge-stage
    // read-(b) term; each path's after-access residual
    const bd = Array.from({ length: T + 1 }, () => ({ nr: 0, db: 0, fc: 0, xc: 0, su: 0, lf: 0, moved: 0 })), pdb = new Float64Array(N);
    for (let j = 0; j < N; j++) for (let t = 0; t <= T; t++) {
      const c = claim[j * (T + 2) + t], c1 = claim[j * (T + 2) + t + 1];
      if (c !== c || c1 !== c1) continue;
      const o = j * (T + 2) + t + 1, rb = rbAt[o];
      if (rb !== rb) { console.error(`audit-7at: ${L} world ${k} path ${j} year ${t + 1}: a read without a read (b)`); process.exit(2); }
      const y = bd[t]; y.nr++; y.db += rb - c1; y.fc += fcAt[o]; y.xc += xcAt[o]; y.su += suAt[o]; y.lf += lfAt[o]; if (Math.abs(rb - raAt[o]) > 1e-9) y.moved++;
      if (t < access) pdb[j] += rb - c1;
    }
    for (let t = 0; t <= T; t++) { const y = bd[t]; console.log(`${''.padEnd(16)} bdec ${L} world ${k} year ${t}: reads ${y.nr} readb ${f4(y.db, y.nr)} flat ${f4(y.fc, y.nr)} extra ${f4(y.xc, y.nr)} unsS ${f4(y.su, y.nr)} left ${f4(y.lf, y.nr)} moved ${y.moved}`); }
    if (access > 0) console.log(`${''.padEnd(16)} pbstage ${L} world ${k}: ${Array.from({ length: N }, (_, j) => pdb[j].toFixed(4)).join(';')}`);
    if (access <= T) console.log(`${''.padEnd(16)} pafter ${L} world ${k}: ${Array.from({ length: N }, (_, j) => { const c = claim[j * (T + 2) + access]; return c === c ? (c - 100 * ok[j]).toFixed(4) : '-'; }).join(';')}`);
  }
  console.log(`${''.padEnd(16)} xcount ${L}: tables ${XCOUNT.tables} extrapolated ${XCOUNT.extrapolated} flat ${XCOUNT.flat}`);
  XCOUNT.tables = 0; XCOUNT.extrapolated = 0; XCOUNT.flat = 0; XB.clear();
  console.log(`${''.padEnd(16)} done ${L}`);
});
