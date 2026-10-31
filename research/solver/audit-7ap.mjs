/*
 * 7AP: THE ALLOWANCE TEST (PLAN.md 7ap; O71, O66, O69; the deep review after 7al, deep-review-log.md 30 Sep 22:51 UK, its
 * decisive test). Is the post-access optimism the used-allowance axis's absorbing snap - three buckets (0, 0.5, 1) read by
 * nearest snap (src/solver/grid.js), so a year using under a quarter of the allowance reads back on its bucket, until a
 * path's use crosses 0.75 and its read jumps to the last - and does interpolating that axis remove it?
 * A separate script, so the registered audit scripts stay byte for byte as they ran. The solve and every printed line are
 * audit-7al.mjs's (measureV2's plan, TS+J, the estate weight 0.02, the reader on the READER units), so the DEFAULT units
 * are held line for line to 7al's records; the PCLSI units add one option, `pclsInterp: true` (grid.js: the allowance axis
 * bracketed between its buckets as `gainInterp` brackets the gain; research only, default off).
 * The units: S370 and S130 READER (the households whose use crosses 0.75 of the allowance), and S194 OFF (the control that
 * cannot cross, under TS+J: its tables value the policy its paths run; O70), each DEFAULT and PCLSI.
 * Beside 7al's lines (case, solve, ran, gap, joint, access, bridgeref, node, resid, stage, cell, wcell, band): per unit,
 *   axis: the allowance axis as solved (pclsInterp, its buckets, pclsStrict); and per unit and world:
 *   lsa: per year, the paths alive with a claim, the mean used share of the allowance (the state's slot 4 over the
 *        allowance), the paths at the wall (0.6 to under 0.75) and over it (0.75 or more), and the paths whose SNAPPED
 *        bucket changes between t and t + 1 (the default grid's reading, in both arms, so the split is one definition),
 *        and the stalls - paths at the wall whose used allowance does not grow to t + 1 (the deep review after 7am, 1 Oct 02:00 UK);
 *   pcell: the one-step residual's path-years by stage, bucket change (chg: the snapped bucket at t + 1 differs from t's;
 *        same: it does not, or t + 1 has no state) and the share axis's cell position (mid or near, 7al's split): the
 *        concentration split by the share axis (the plan-auditor's MINOR 3 of 30 Sep 23:04 UK);
 *   wall: the same residual by stage and whether the path is at the wall at t.
 *   node research/solver/audit-7ap.mjs [points=30] [paths per world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { locateVec } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

const POINTS = Number(process.argv[2] || 30), NPW = Number(process.argv[3] || 2000);
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-7ap: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7ap: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1)) { console.error(`audit-7ap: bad seed ${process.argv[6]}`); process.exit(2); }
const LAMBDA = 0.0223606797749979, W = 0.02, MID = [0.25, 0.75];

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
// [household, reader, setting, the allowance axis]; the setting is TS+J on every unit
export const UNITS = [['S370', 'READER', 'TS+J', 'DEFAULT'], ['S370', 'READER', 'TS+J', 'PCLSI'], ['S130', 'READER', 'TS+J', 'DEFAULT'], ['S130', 'READER', 'TS+J', 'PCLSI'], ['S194', 'OFF', 'TS+J', 'DEFAULT'], ['S194', 'OFF', 'TS+J', 'PCLSI']];
// the DEFAULT units are 7al's units, held to its records line for line by reduce-7ap.mjs's gate (audit-7al.mjs is not
// imported: it runs its units on load)
const WALL = [0.6, 0.75], PCLS = [0, 0.5, 1];
const snapOf = f => { let b = 0, d = Infinity; PCLS.forEach((x, k) => { const e = Math.abs(x - f); if (e < d) { d = e; b = k; } }); return b; };   // grid.js nearest(), the default read
export const labelOf = (S, X = 'DEFAULT') => `${S}/W${W}${X === 'PCLSI' ? '/PCLSI' : ''}`;
const BANDS = [[0, 50, 'lt50'], [50, 90, '50-90'], [90, 99, '90-99'], [99, Infinity, 'ge99']];
const bandOf = c => BANDS.find(([lo, hi]) => c >= lo && c < hi)[2];
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
console.log(`7AP, THE ALLOWANCE TEST (7al's audit, the allowance axis snapped and interpolated): TS+J (and the shipping default on S194) at the estate weight ${W}, ${POINTS} points, ${NPW} paths a world at each world's node (seed ${SEED}): the reader's year-0 reference against its own draw and the engine's bridge payment by world, and each world's table claim against its next along the policy's own paths, by year, stage, share and wealth position and claim band; ${UNITS.length} units; part ${pk}/${pn}`);

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

UNITS.forEach(([id, A, SET, X], i) => {
  if (i % pn !== pk) return;
  const TSJ = SET === 'TS+J', h = all.find(s => s.id === id), label = labelOf(SET, X), L = `${A}/${label}`;
  if (!h) { console.error(`audit-7ap: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  // measureV2's plan and solve (audit-s126.mjs, as audit-7ai.mjs copies it), forward: false; readerRef 'order' as diag7ah
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: A === 'OFF' ? false : 'reader', bequestWeight: W, ...(TSJ ? { tierState: true, jointWorlds: true } : {}), ...(A === 'ORDER' ? { readerRef: 'order' } : {}), ...(X === 'PCLSI' ? { pclsInterp: true } : {}) });
  const m = r.m, s0 = M.initialState(m), T = m.ctx.totalYears, K = r.worlds.length;
  const table = 100 * r.worlds.reduce((t, w, k) => t + r.mix.weights[k] * w.value(s0, 0).survival, 0);
  const secs = (Date.now() - t0) / 1000;
  if (!r.meta.tierState !== !TSJ || !r.meta.jointWorlds !== !TSJ) { console.error(`audit-7ap: ${L} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds}`); process.exit(2); }
  if (!(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-7ap: ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(2); }
  if ((A === 'ORDER') !== (r.meta.readerRef === 'order')) { console.error(`audit-7ap: ${L} ran the reference ${r.meta.readerRef}`); process.exit(2); }
  if ((X === 'PCLSI') !== (r.g.pclsInterp === true)) { console.error(`audit-7ap: ${L} ran pclsInterp ${r.g.pclsInterp}`); process.exit(2); }
  if ((A === 'OFF') !== !r.g.reader) { console.error(`audit-7ap: ${L} has ${r.g.reader ? 'a' : 'no'} reader`); process.exit(2); }
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
    let row = 0;
    const choose = (t, st, held) => {
      const ai = chooseAction(r, st, t, held);
      if (held && t <= T) {
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
  }
  console.log(`${''.padEnd(16)} done ${L}`);
});
