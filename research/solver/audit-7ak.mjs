/*
 * 7AK: THE ATTRIBUTION TEST (PLAN.md 7ak; predictions/diag-7ak.md; the deep review after P, deep-review-log.md 29 Sep 23:31
 * UK: the families' root-cause step after P). Which part of the table makes the forward run and the table's own cell
 * disagree, and does the table misprice on switching boundaries?
 * On bridge 4 (the reader, estate weight 0) and S194 (off, 0.02) under P (TS+J, switchCharge 0.001, switchMargin 0, 30x5,
 * P's own solve, copied from audit-s126.mjs diagP and held to P's records by the reducer), at world 0's node on the first
 * NP of P's node paths (seed 7002):
 *   1. OPEN0 (the year-0 move held in the plan's tiers, then the chooser) with P's decision log, years 1 to 7: on each
 *      path-year holding the plan's tiers where the forward move and the nearest cell's stored move disagree (one leaves,
 *      the other holds), the chooser re-run with ONE thing snapped to that nearest cell - total wealth W, the pension
 *      share a, the ISA share b, the gain bucket, the lump-allowance bucket, the reader's chance read at the nearest
 *      cell's accessible money (grid.js g.readerAcc, research only) - and with ALL of the state snapped (the cell's own
 *      state, toVec); a snap "agrees" when its re-run move leaves or holds as the cell does. A disagreement at a dead cell
 *      (the cell's stored survival for the layer under 0.02: every move fails there, so its stored tie is arbitrary -
 *      research/tests/snap-7ak.test.mjs) is counted apart and not snapped.
 *   2. OPEN0 and TS+J at year 1: every path's year-1 cell classed as on a switching boundary (a neighbour along W, a or b
 *      holding the layer where the cell leaves, or the other way) or interior, with world 0's table survival of the
 *      chosen move there (scoreMoves) against the path's realised survival.
 *   3. OPEN0 and TS+J at every year from 1 (the deep review after 7ah, 30 Sep 14:39 UK: so a level error, O66, can be
 *      located by year - in the bridge or after access): world 0's table survival of the chosen move (scoreMoves) on
 *      every path alive and holding a tier state that year, against those paths' realised survival; the access year
 *      (the first year the pension can be drawn, ctx.nmpa less the opening age) printed beside.
 * Prints per unit P's lines (solve, ran, joint) and: snap lines per year, level lines per rule and class, a node line;
 * resid lines per rule and year, an access line; each run's trace to results/diag7ak (DIAG7AK_OUT).
 *   node research/solver/audit-7ak.mjs [points=30] [paths=8000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves, nearestIndex } from '../../src/solver/solve.js';
import { SNAPS, nearestOf, snapState, withReaderSnap } from './snap.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 8000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error('audit-7ak: bad grid size or path count'); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7ak: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
const LAMBDA = 0.0223606797749979, CHARGE = 0.001, YEARS = 7;
export const UNITS = [['bridge 4', 'READER', 0], ['S194', 'OFF', 0.02]];

// the households: audit-s126.mjs's variant() (copied; the reducer holds each solve to P's) and the library's
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2, scale = 1 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) }; return a; });
  const age = E.num(p.demographics.privatePensionAge, 58) - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}
const byId = id => (id === 'bridge 4' ? variant(id, { bridge: 4 }) : all.find(s => s.id === id));
const OUT = process.env.DIAG7AK_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7ak');
mkdirSync(OUT, { recursive: true });
console.log(`7AK, THE ATTRIBUTION TEST: under P (switchCharge ${CHARGE}, switchMargin 0), TS+J at ${POINTS} points, world 0's node on ${NP} paths (seed ${SEED}): OPEN0's forward-against-cell disagreements re-scored with one thing snapped (${SNAPS.join(', ')}), and the year-1 table level against realised survival by boundary and interior cells; ${UNITS.length} units; part ${pk}/${pn}`);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const chooseAt = (r, st, t, held, sm) => { const keep = r.switchMargin; r.switchMargin = sm; try { return chooseAction(r, st, t, held); } finally { r.switchMargin = keep; } };

UNITS.forEach(([id, A, w], i) => {
  if (i % pn !== pk) return;
  const h = byId(id);
  if (!h) { console.error(`audit-7ak: no case ${id}`); process.exit(2); }
  const L = `${A}/TS+J/MP/30x5/W${w}`;   // the registered grid's label, as P's (its preflight's too); the points it ran at are on the ran line
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3 points ${POINTS} quad 5`);
  // audit-s126.mjs measureV2's plan and solve at P's settings (diagP's core:P job), forward: false
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, switchMargin: 0, switchCharge: CHARGE, bridgeRead: A === 'READER' ? 'reader' : false, tierState: true, jointWorlds: true, bequestWeight: w });
  const m = r.m, s0 = M.initialState(m), T = m.ctx.totalYears;
  const table = 100 * r.worlds.reduce((t, x, k) => t + r.mix.weights[k] * x.value(s0, 0).survival, 0);
  if (!r.meta.tierState || !r.meta.jointWorlds || r.switchMargin !== 0 || r.switchCharge !== CHARGE) { console.error(`audit-7ak: ${L} ran tierState ${r.meta.tierState} joint ${r.meta.jointWorlds} margin ${r.switchMargin} charge ${r.switchCharge}`); process.exit(2); }
  console.log(`${''.padEnd(16)} solve ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran ${L}: mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5} tierState ${r.meta.tierState} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} switchMargin ${r.switchMargin} switchCharge ${r.switchCharge}`);
  const ra = r.meta.riskAbove ? r.meta.riskAbove.decision.replace(/ /g, '_') : 'unset';
  console.log(`${''.padEnd(16)} joint ${L}: ${!!r.meta.jointWorlds} switchMargin ${r.switchMargin} switchCharge ${r.switchCharge || 0} scale ${Math.round(Math.max(1, m.ctx.accounts.reduce((t, x) => t + x.balance, 0)))} cap ${Math.round(r.meta.bequestCap)} deathTax ${m.ctx.pensionDeathTaxRate} tier own riskAbove ${ra}`);
  const paths = E.pathsForSeed(SEED, NP, T);
  let h0 = null; runPolicy(r, paths[0], { choose: (t, st, held) => { if (t === 0 && !h0) h0 = { ...held }; return chooseAction(r, st, t, held); } });
  const z = r.mix.nodes[0], npaths = paths.map(zs => { const c = Float64Array.from(zs); c[c.length - 1] = z; return c; });
  const acts = r.c.acts, tab = r.mix.tables[0], g = r.g;
  const layerOf = new Map(); acts.forEach((a, ai) => { const key = `${a.tierPen || 0}/${a.tierIsa || 0}`; if (!layerOf.has(key)) layerOf.set(key, tab.tsLayerOf[ai]); });
  const leaves = (ai, held) => acts[ai].tierPen !== held.pen || acts[ai].tierIsa !== held.isa;
  const n = acts.length, S2 = new Float64Array(n), T2 = new Float64Array(n), B2 = new Float64Array(n), V2 = new Float64Array(n);
  const run = rule => {
    const t1 = Date.now(), N = npaths.length, okArr = new Uint8Array(N), tr = makeTrace(N, T + 1);
    const snap = Array.from({ length: YEARS + 1 }, () => ({ held: 0, dis: 0, oneWay: 0, reverse: 0, deadCell: 0, agree: Object.fromEntries(SNAPS.map(k => [k, 0])) }));
    const lvl = { boundary: { n: 0, table: 0, ok: 0 }, interior: { n: 0, table: 0, ok: 0 } }, klass = new Int8Array(N).fill(-1), predicted = new Float64Array(N);
    const pred = new Float32Array(N * (T + 1)).fill(NaN);   // world 0's table survival of the chosen move, by path and year
    let row = 0;
    const choose = (t, st, held) => {
      const ai = t === 0 && rule === 'OPEN0' ? chooseAt(r, st, 0, held, Infinity) : chooseAction(r, st, t, held);
      if (t >= 1 && held) {
        const j = layerOf.get(`${held.pen}/${held.isa}`), pol = tab.tsLayers[j].pol[Math.min(t, T)], nc = nearestOf(g, st), cell = pol[g.index(nc.ip, nc.ii, nc.it, nc.ig, nc.ic)];
        if (cell !== pol[nearestIndex(g, st)]) { console.error('audit-7ak: nearestOf is not nearestIndex'); process.exit(2); }
        scoreMoves(tab, st, t, S2, T2, B2, held, null, V2);
        if (t <= T) pred[row * (T + 1) + t] = 100 * V2[ai];
        if (t === 1) {
          // a switching boundary: a neighbour along W, a or b whose stored move leaves the layer where this cell's holds, or the other way
          const c = leaves(cell, held); let bnd = false;
          for (const [dp, di, dt] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
            const p2 = nc.ip + dp, i2 = nc.ii + di, t2 = nc.it + dt;
            if (p2 < 0 || i2 < 0 || t2 < 0 || p2 >= g.np || i2 >= g.ni || t2 >= g.nt) continue;
            if (leaves(pol[g.index(p2, i2, t2, nc.ig, nc.ic)], held) !== c) { bnd = true; break; }
          }
          klass[row] = bnd ? 1 : 0; predicted[row] = 100 * V2[ai];
        }
        if (rule === 'OPEN0' && t <= YEARS && held.pen === h0.pen && held.isa === h0.isa) {
          const S = snap[t], f = leaves(ai, held), c = leaves(cell, held);
          S.held++;
          if (f !== c) {
            S.dis++; if (!f) S.oneWay++; else S.reverse++;
            // a dead cell (stored survival under 0.02): every move fails there and its stored tie is arbitrary (snap-7ak.test.mjs);
            // counted and not snapped, so every snap's count is over the live-cell disagreements
            if (tab.tsLayers[j].surv[Math.min(t, T)][g.index(nc.ip, nc.ii, nc.it, nc.ig, nc.ic)] < 0.02) { S.deadCell++; return ai; }
            for (const k of SNAPS) { const a2 = k === 'reader' ? withReaderSnap(r, () => chooseAction(r, st, t, held)) : chooseAction(r, snapState(g, st, k, nc), t, held); if (leaves(a2, held) === c) S.agree[k]++; }
          }
        }
      }
      return ai;
    };
    npaths.forEach((zs, k) => { row = k; tr.row = k; const o = runPolicy(r, zs, { trace: tr, choose }); if (o.survived) okArr[k] = 1; });
    for (let k = 0; k < N; k++) { if (klass[k] < 0) continue; const c = klass[k] ? lvl.boundary : lvl.interior; c.n++; c.table += predicted[k]; c.ok += okArr[k]; }
    const resid = [];   // by year from 1: paths with a table read, their mean table survival and realised survival
    for (let t = 1; t <= T; t++) { let n = 0, tb = 0, ok = 0; for (let k = 0; k < N; k++) { const v = pred[k * (T + 1) + t]; if (v === v) { n++; tb += v; ok += okArr[k]; } } resid.push({ t, n, table: n ? tb / n : NaN, realised: n ? 100 * ok / n : NaN }); }
    return { sim: 100 * okArr.reduce((t, x) => t + x, 0) / N, okArr, tr, snap, lvl, resid, secs: (Date.now() - t1) / 1000 };
  };
  const F = { OPEN0: run('OPEN0'), 'TS+J': run('TS+J') };
  console.log(`${''.padEnd(16)} node ${L} 0 z ${z.toFixed(4)}: OPEN0 ${F.OPEN0.sim.toFixed(4)} TS+J ${F['TS+J'].sim.toFixed(4)} paths ${npaths.length} secs ${Math.round(F.OPEN0.secs + F['TS+J'].secs)}`);
  for (let t = 1; t <= YEARS; t++) { const S = F.OPEN0.snap[t]; console.log(`${''.padEnd(16)} snap ${L} OPEN0 year ${t}: held ${S.held} disagree ${S.dis} oneWay ${S.oneWay} reverse ${S.reverse} deadCell ${S.deadCell} | ${SNAPS.map(k => `${k} ${S.agree[k]}`).join(' ')}`); }
  for (const rule of ['OPEN0', 'TS+J']) for (const cls of ['boundary', 'interior']) { const c = F[rule].lvl[cls]; console.log(`${''.padEnd(16)} level ${L} ${rule} year 1 ${cls}: paths ${c.n} table ${c.n ? (c.table / c.n).toFixed(4) : '-'} realised ${c.n ? (100 * c.ok / c.n).toFixed(4) : '-'}`); }
  console.log(`${''.padEnd(16)} access ${L}: year ${Math.max(0, m.ctx.nmpa - m.ctx.ageSelf0)} years ${T}`);
  for (const rule of ['OPEN0', 'TS+J']) for (const x of F[rule].resid) console.log(`${''.padEnd(16)} resid ${L} ${rule} year ${x.t}: paths ${x.n} table ${x.n ? x.table.toFixed(4) : '-'} realised ${x.n ? x.realised.toFixed(4) : '-'}`);
  for (const rule of ['OPEN0', 'TS+J']) {
    const f = F[rule];
    writeFileSync(join(OUT, `${id.replace(/ /g, '_')}-${A.toLowerCase()}-${rule.toLowerCase().replace(/\+/g, '_')}-world0@w${w}.json.gz`), gzipSync(JSON.stringify({ id, arm: `${A}/${rule}/MP/W${w}/world0`, stamp: STAMP, N: npaths.length, Y: f.tr.Y, seed: SEED, node: z, sim: f.sim,
      survived: b64(f.okArr), level: b64(f.tr.level), tier: b64(f.tr.tier), wealth: b64(f.tr.wealth), taxPaid: b64(f.tr.taxPaid), failYear: b64(f.tr.failYear) })));
  }
  console.log(`${''.padEnd(16)} done ${L}`);
});
