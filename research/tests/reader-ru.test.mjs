/*
 * STEP-O182's SNR arm (`readerSplit: 'ru'`; grid.js ruScale and the read, solve.js; research only; PLAN.md STEP-O182,
 * items/STEP-O182.md, PR25): each corner's residual R is scaled by (1 - pq) / (1 - pk) where the query's chance pq exceeds
 * the corner's pk, and carried whole elsewhere. Checked at the read: on S370 at 4 points with SN's share nodes
 * (NODES_SN, eight: the uniform six with 0.9 and 0.95 added in the top cell), every bridge-year read at the states a policy
 * visits gives back the arm's own formula over the corners READER_PROBE hands it, under 'ru' and with the option off. The
 * check is shown failing on two planted faults - the scaling left off, and the scaling applied the other way (where the
 * corner's chance is the higher, RS's direction) - and the scaling is shown acting on some reads (not a check over nothing).
 * e3pcls off (declared): the check is of the reader's arm, not e3's copy.
 * TOP-CELL's RSU (`readerSplit: 'rsu'`; the design review of 20 Oct 17:04 UK, deep-review-log.md): RS's scale (the query's
 * chance over the corner's, where the corner's is the higher) and RU's (where the query's is the higher) in one loop, so the
 * top-cell fix (SN's nodes and RU) can be added under the adaptive package, which carries RS. Checked the same way: every
 * read under 'rsu' gives back the RSU formula, each side's scaling is counted, and the fault the review named is planted
 * literally: both flags set (rs and ru) with rsu off runs RS alone through the read's else-if, and must disagree. Under the
 * plan reference no corner's chance sits above a visited query's (RS's side acts on none), so RSU is read again under the
 * package (the adaptive reference, its fix, stepAll) with SN's nodes, where both sides must act (a check over nothing is
 * an error: CHECKLIST 6). On S370 RS's side acts on no read even under the package at every grid state (no corner above
 * the query carries a residual: RS is inert there, as REF-B found), so RSU's RS half is read on S364 under the package,
 * where RS acts (AOR: the RS split reads S364 at its runs), with RU alone planted against it; RU's half is read on S370.
 *   node research/tests/reader-ru.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { readValues, READER_PROBE, ruScale, toVec } from '../../src/solver/grid.js';
import { candidatePlan, FROZEN_OPTS } from '../solver/candidate.mjs';   // the candidate before 7u-F's assembly: this test's arms add the package themselves
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const NODES_SN = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1], CL = 1e-6, TOL = 1e-12, PATHS = 60;
const clamp = v => (v < CL ? CL : v > 1 - CL ? 1 - CL : v);

// the factor itself, at chosen chances
ok(Math.abs(ruScale(0.9, 0.5) - 0.2) < 1e-15 && ruScale(1, 0.3) === 0, 'ruScale scales where the query\'s chance is the higher: (1 - 0.9) / (1 - 0.5) = 0.2, and nothing left at a certain query');
ok(ruScale(0.5, 0.9) === 1 && ruScale(0.7, 0.7) === 1 && ruScale(0, 0) === 1, 'ruScale is 1 where the corner\'s chance is the higher or equal');

const h = buildScenarios().find(s => s.id === 'S370');
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const solve = extra => solvePlan(E, M, candidatePlan(E, plan), { ...FROZEN_OPTS, e3pcls: false, lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, shareNodes: NODES_SN, ...extra });

// every bridge-year read at the visited states of PATHS paths, in every world: the read's value and three formulas over the
// corners the probe hands over (the option off, 'ru', and 'ru' turned the other way)
function reads(r, flags = null, grid = false) {
  const out = [], rd = new Float64Array(4), T = r.m.ctx.totalYears, g = r.mix.tables[0].g;
  const bridge = new Set(); for (let t = 1; t <= T; t++) if (g.reader && g.reader.years[t]) bridge.add(t);
  let cur = null;
  const probe = (W, IDX, NC, RD, pr) => {
    let cc = 0, r0 = 0, ru = 0, rw = 0, rs = 0, rsu = 0, acts = false, actsS = false, fin = Number.isFinite(pr);
    for (let k = 0; k < NC; k++) { const w = W[k]; if (w === 0) continue; const i = IDX[k], pk = RD.p[i], R = RD.R[i]; if (!Number.isFinite(pk) || !Number.isFinite(R) || !Number.isFinite(RD.c[i])) fin = false; cc += w * RD.c[i]; r0 += w * R; ru += w * R * ruScale(pr, pk); rw += w * R * ruScale(pk, pr); rs += w * R * (pk > pr ? pr / pk : 1); rsu += w * R * (pk > pr ? pr / pk : ruScale(pr, pk)); if (pr > pk && R !== 0) acts = true; if (pk > pr && R !== 0) actsS = true; }
    cur = { off: clamp(pr * cc + r0), ru: clamp(pr * cc + ru), wrong: clamp(pr * cc + rw), rs: clamp(pr * cc + rs), rsu: clamp(pr * cc + rsu), acts, actsS, fin };
  };
  const paths = E.pathsForSeed(7002, PATHS, T);
  for (let k = 0; k < r.mix.tables.length; k++) {
    const tab = r.mix.tables[k], Ly = tab.tsLayers ? tab.tsLayers[0] : tab;
    for (let i = 0; i < PATHS; i++) {
      const cz = Float64Array.from(paths[i]); cz[cz.length - 1] = r.mix.nodes[k];
      const vis = [];
      runPolicy(r, cz, { choose: (t, st, held) => chooseAction(r, st, t, held), visit: (t, s) => { if (bridge.has(t)) vis.push({ t, s: Float64Array.from(s) }); } });
      if (grid && i === 0) for (const t of bridge) for (let ip = 0; ip < tab.g.np; ip++) for (let ii = 0; ii < tab.g.ni; ii++) for (let it = 0; it < tab.g.nt; it++) for (let ig = 0; ig < tab.g.gain.length; ig++) vis.push({ t, s: toVec(tab.g, ip, ii, it, ig, 0, new Float64Array(7), t) });
      for (const { t, s } of vis) {
        cur = null; READER_PROBE.fn = probe;
        readValues(flags ? { ...tab.g, reader: { ...tab.g.reader, ...flags } } : tab.g, Ly.lsurv[t], Ly.beq[t], s, rd, Ly.lresil[t], Ly.short[t], t);
        READER_PROBE.fn = null;
        if (cur) out.push({ v: rd[0], ...cur });
      }
    }
  }
  return out;
}

const RU = solve({ readerSplit: 'ru' }), OFF = solve({});
ok(RU.meta.readerSplit === 'ru' && OFF.meta.readerSplit === null, `the solve's meta carries the arm ('ru', and null with the option off)`);
const ru = reads(RU), off = reads(OFF);
ok(ru.length > 100 && off.length > 100, `the reads: ${ru.length} bridge-year reads under 'ru' and ${off.length} with the option off, at the visited states of ${PATHS} paths a world`);
const actsN = ru.filter(x => x.acts).length, moved = ru.filter(x => Math.abs(x.ru - x.off) > 1e-6).length;
ok(actsN > 0 && moved > 0, `the scaling acts: ${actsN} reads have a corner of lower chance than the query with a residual, ${moved} move by more than 1e-6`);
ok(ru.every(x => Math.abs(x.v - x.ru) <= TOL), `under 'ru' every read gives back the 'ru' formula (largest gap ${Math.max(...ru.map(x => Math.abs(x.v - x.ru))).toExponential(2)})`);
ok(off.every(x => Math.abs(x.v - x.off) <= TOL), `with the option off every read gives back the unscaled formula (largest gap ${Math.max(...off.map(x => Math.abs(x.v - x.off))).toExponential(2)})`);
// the planted faults: the same check, run against a formula with the scaling left off or turned the other way, must fail
const offGap = ru.filter(x => Math.abs(x.v - x.off) > TOL).length, wrongGap = ru.filter(x => Math.abs(x.v - x.wrong) > TOL).length;
ok(offGap > 0, `planted fault caught: the scaling left off disagrees with the 'ru' reads on ${offGap} reads`);
ok(wrongGap > 0, `planted fault caught: the scaling turned the other way (RS's direction) disagrees on ${wrongGap} reads`);
assert.throws(() => solve({ readerSplit: 'ru', readerBlend: 'logodds' }), /not defined for readerBlend/);
assert.throws(() => solve({ readerSplit: 'rx' }), /only 'r0', 'rz', 'rs', 'ru' or 'rsu'/);
ok(true, "'ru' with the log-odds blend, and an unknown split, are refused");

// RSU (TOP-CELL): the same check under 'rsu', each side's scaling counted, and the else-if fault planted literally
const RSU = solve({ readerSplit: 'rsu' });
ok(RSU.meta.readerSplit === 'rsu' && RSU.mix.tables[0].g.reader.rsu === true && !RSU.mix.tables[0].g.reader.rs && !RSU.mix.tables[0].g.reader.ru, `the solve's meta carries 'rsu', and the reader its own flag (rs and ru off)`);
const rsu = reads(RSU);
const sideU = rsu.filter(x => x.acts).length, sideS = rsu.filter(x => x.actsS).length;
ok(rsu.length > 100 && sideU > 0, `the reads: ${rsu.length} under 'rsu'; RU's side acts on ${sideU} (a corner below the query with a residual), RS's on ${sideS} (a corner above it)`);
ok(rsu.every(x => Math.abs(x.v - x.rsu) <= TOL), `under 'rsu' every read gives back the RSU formula (largest gap ${Math.max(...rsu.map(x => Math.abs(x.v - x.rsu))).toExponential(2)})`);
const rsuMovedFromRu = rsu.filter(x => Math.abs(x.rsu - x.ru) > TOL).length, rsuMovedFromRs = rsu.filter(x => Math.abs(x.rsu - x.rs) > TOL).length;
ok(rsuMovedFromRs > 0, `RSU is not RS alone: the formulas differ on ${rsuMovedFromRs} reads (and from RU alone on ${rsuMovedFromRu})`);
// the planted fault: both flags set, rsu off, on the same tables - the read runs RS alone (the else-if) and must disagree
const both = reads(RSU, { rs: true, ru: true, rsu: false });
const bothGap = both.filter(x => Math.abs(x.v - x.rsu) > TOL).length, bothIsRs = both.every(x => Math.abs(x.v - x.rs) <= TOL);
ok(bothGap > 0 && bothIsRs, `planted fault caught: both flags set with rsu off reads RS alone (every read gives back the RS formula: ${bothIsRs}) and disagrees with RSU on ${bothGap} reads`);
// under the package (PSNX's reference and split, without the copy rule): both sides must act
const PSN = solve({ readerRef: 'adaptive', adaptiveLattice: { na: 160, nb: 41, nz: 128, foot: true, stepAll: true }, readerSplit: 'rsu' });
const psnAll = reads(PSN, null, true), psn = psnAll.filter(x => x.fin), pU = psn.filter(x => x.acts).length, pS = psn.filter(x => x.actsS).length;
// a read touching a non-finite corner (the package's reader tables hold some, at least at grid states: PLAN.md O199) is
// counted apart: its value is not the split's to give back
console.log(`NOTE  under the package on S370, ${psnAll.length - psn.length} of ${psnAll.length} reads touch a non-finite corner or chance (O199), excluded from the formula checks`);
ok(PSN.meta.readerSplit === 'rsu' && psn.length > 100 && pU > 0, `under the package with SN's nodes on S370, at the visited and grid states: ${psn.length} reads under 'rsu'; RU's side acts on ${pU}, RS's on ${pS}`);
ok(psn.every(x => Math.abs(x.v - x.rsu) <= TOL), `under the package every read gives back the RSU formula (largest gap ${Math.max(...psn.map(x => Math.abs(x.v - x.rsu))).toExponential(2)})`);
const pBoth = reads(PSN, { rs: true, ru: true, rsu: false }, true).filter(x => x.fin), pGapS = pBoth.filter(x => x.actsS && Math.abs(x.v - x.rsu) > TOL).length, pGapU = pBoth.filter(x => x.acts && Math.abs(x.v - x.rsu) > TOL).length;
const pRu = reads(PSN, { rs: false, ru: true, rsu: false }, true).filter(x => x.fin), pGapRu = pRu.filter(x => Math.abs(x.v - x.rsu) > TOL).length;
ok(pGapU > 0, `planted fault caught under the package on S370: both flags with rsu off (RS alone) disagree with RSU on ${pGapU} reads where RU acts (RU alone on ${pGapRu})`);
// RS's half: S364 under the package with 'rsu' (no share nodes), where RS acts; RU alone planted against it
const h364 = buildScenarios().find(x => x.id === 'S364');
const plan364 = E.resolveMpaa(E.normalizePlan({ ...h364.plan, config: { ...h364.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h364.plan.spending, floorSpend: Math.round(0.8 * E.num(h364.plan.spending.targetSpend, 0)) } }));
const P364 = solvePlan(E, M, candidatePlan(E, plan364), { ...FROZEN_OPTS, e3pcls: false, lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, readerRef: 'adaptive', adaptiveLattice: { na: 160, nb: 41, nz: 128, foot: true, stepAll: true }, readerSplit: 'rsu' });
const r364All = reads(P364, null, true), r364 = r364All.filter(x => x.fin), sS = r364.filter(x => x.actsS).length, sU = r364.filter(x => x.acts).length;
console.log(`NOTE  on S364 under the package, ${r364All.length - r364.length} of ${r364All.length} reads touch a non-finite corner or chance (O199), excluded from the formula checks`);
ok(P364.meta.readerSplit === 'rsu' && r364.length > 100 && sS > 0, `S364 under the package with 'rsu', at the visited and grid states: ${r364.length} reads; RS's side acts on ${sS}, RU's on ${sU}`);
ok(r364.every(x => Math.abs(x.v - x.rsu) <= TOL), `on S364 every read gives back the RSU formula (largest gap ${Math.max(...r364.map(x => Math.abs(x.v - x.rsu))).toExponential(2)})`);
const ru364 = reads(P364, { rs: false, ru: true, rsu: false }, true).filter(x => x.fin), gap364 = ru364.filter(x => x.actsS && Math.abs(x.v - x.rsu) > TOL).length;
// RS's corners here carry residuals that leave the read under the reader's clamp (1e-6) either way, so RU alone reads them the
// same (a plant that cannot act there: CHECKLIST 6); RS's half is shown instead on a planted residual: at reads inside the grid's
// cells (midway between nodes in wealth and share: at a node the corners above the query carry no weight) in every world, on
// S370 and S364 under the package, with a corner above the query (weight over 1e-3, its chance above the query's),
// that corner's R raised by 0.3, the read
// under 'rsu' must give back the RSU formula on the planted table and differ from RU alone (RS's factor lost) by w x 0.3 x
// (1 - pr / pk); the corner restored after each read
console.log(`NOTE  on S364, RU alone against RSU where RS's side acts: ${gap364} reads differ (RS's corners there hold residuals under the clamp)`);
function plantAbove(r, maxN = 300) {
  const T = r.m.ctx.totalYears, g0 = r.mix.tables[0].g, rd = new Float64Array(4), out = [], K = r.mix.tables.length;
  const bridge = []; for (let t = 1; t <= T; t++) if (g0.reader && g0.reader.years[t]) bridge.push(t);
  let cap = null;
  for (let kw = 0; kw < K; kw++) for (const t of bridge) for (let ip = 0; ip < g0.np - 1; ip++) for (let ii = 0; ii < g0.ni - 1; ii++) for (let it = 0; it < g0.nt; it++) for (let ig = 0; ig < g0.gain.length; ig++) {
    if (out.length >= maxN) return out;
    const tab = r.mix.tables[kw], Ly = tab.tsLayers ? tab.tsLayers[0] : tab, a0 = toVec(tab.g, ip, ii, it, ig, 0, new Float64Array(7), t), a1 = toVec(tab.g, ip + 1, ii + 1, it, ig, 0, new Float64Array(7), t);
    const s = Float64Array.from(a0, (v, j) => (j < 3 ? 0.5 * (v + a1[j]) : v));
    const rdOf = gx => { readValues(gx, Ly.lsurv[t], Ly.beq[t], s, rd, Ly.lresil[t], Ly.short[t], t); return rd[0]; };
    cap = null; READER_PROBE.fn = (W, IDX, NC, RD, pr) => { cap = { W: Float64Array.from(W.slice(0, NC)), IDX: Int32Array.from(IDX.slice(0, NC)), NC, RD, pr }; };
    rdOf(tab.g); READER_PROBE.fn = null;
    if (!cap || !Number.isFinite(cap.pr)) continue;
    let q = -1; for (let k = 0; k < cap.NC; k++) { const i = cap.IDX[k], pk = cap.RD.p[i]; if (cap.W[k] > 1e-3 && pk > cap.pr && Number.isFinite(cap.RD.R[i]) && Number.isFinite(cap.RD.c[i])) { q = k; break; } }
    if (q < 0 || ![...cap.IDX].every(i => Number.isFinite(cap.RD.p[i]) && Number.isFinite(cap.RD.R[i]) && Number.isFinite(cap.RD.c[i]))) continue;
    const i = cap.IDX[q], R0 = cap.RD.R[i];
    cap.RD.R[i] = R0 + 0.3;
    let cc = 0, rr = 0; for (let k = 0; k < cap.NC; k++) { const w = cap.W[k]; if (w === 0) continue; const j = cap.IDX[k], pk = cap.RD.p[j]; cc += w * cap.RD.c[j]; rr += w * cap.RD.R[j] * (pk > cap.pr ? cap.pr / pk : ruScale(cap.pr, pk)); }
    const vRsu = rdOf(tab.g), vRu = rdOf({ ...tab.g, reader: { ...tab.g.reader, rs: false, ru: true, rsu: false } });
    cap.RD.R[i] = R0;
    out.push({ v: vRsu, f: clamp(cap.pr * cc + rr), ru: vRu, want: cap.W[q] * 0.3 * (1 - cap.pr / cap.RD.p[i]) });
  }
  return out;
}
const pl = [...plantAbove(PSN), ...plantAbove(P364)], plAct = pl.filter(x => x.want >= 1e-6 && x.v > CL && x.v < 1 - CL && x.ru > CL && x.ru < 1 - CL), plCaught = plAct.filter(x => Math.abs(x.v - x.ru) > TOL).length;
ok(pl.length > 0 && pl.every(x => Math.abs(x.v - x.f) <= TOL), `RS's half on a planted residual (S370 and S364 under the package, ${pl.length} mid-cell reads with a corner above the query): every read under 'rsu' gives back the RSU formula on the planted table (largest gap ${pl.length ? Math.max(...pl.map(x => Math.abs(x.v - x.f))).toExponential(2) : 'none'})`);
// the plant's slice: the reads where RS's factor moves the planted residual by 1e-6 or more, both reads inside the reader's clamp
// (where the corner's chance sits barely above the query's, w x 0.3 x (1 - pr / pk) is far under any tolerance; at the clamp the
// two reads are equal by construction: no check can see the fault there)
ok(plAct.length > 0 && plCaught === plAct.length, `planted fault caught: RU alone (RS's factor lost) differs from RSU on ${plCaught} of the ${plAct.length} planted reads where it moves the read by 1e-6 or more inside the clamp (of ${pl.length}), the smallest expected move ${plAct.length ? Math.min(...plAct.map(x => x.want)).toExponential(2) : 'none'}`);
const plMiss = plAct.length ? Math.max(...plAct.map(x => Math.abs(Math.abs(x.ru - x.v) - x.want))) : NaN;
ok(plMiss <= 1e-9, `each caught read moves by w x 0.3 x (1 - pr / pk), RS's factor on the planted residual (the largest miss ${plMiss.toExponential(2)})`);
assert.throws(() => solve({ readerSplit: 'rsu', readerBlend: 'logodds' }), /not defined for readerBlend/);
ok(true, "'rsu' with the log-odds blend is refused");
console.log(`reader-ru: ${n} checks passed`);
