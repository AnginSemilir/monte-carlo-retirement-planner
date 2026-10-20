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
 * literally: both flags set (rs and ru) with rsu off runs RS alone through the read's else-if, and must disagree.
 *   node research/tests/reader-ru.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { readValues, READER_PROBE, ruScale } from '../../src/solver/grid.js';
import { candidatePlan, CANDIDATE_OPTS } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const NODES_SN = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1], CL = 1e-6, TOL = 1e-12, PATHS = 60;
const clamp = v => (v < CL ? CL : v > 1 - CL ? 1 - CL : v);

// the factor itself, at chosen chances
ok(Math.abs(ruScale(0.9, 0.5) - 0.2) < 1e-15 && ruScale(1, 0.3) === 0, 'ruScale scales where the query\'s chance is the higher: (1 - 0.9) / (1 - 0.5) = 0.2, and nothing left at a certain query');
ok(ruScale(0.5, 0.9) === 1 && ruScale(0.7, 0.7) === 1 && ruScale(0, 0) === 1, 'ruScale is 1 where the corner\'s chance is the higher or equal');

const h = buildScenarios().find(s => s.id === 'S370');
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const solve = extra => solvePlan(E, M, candidatePlan(E, plan), { ...CANDIDATE_OPTS, e3pcls: false, lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, shareNodes: NODES_SN, ...extra });

// every bridge-year read at the visited states of PATHS paths, in every world: the read's value and three formulas over the
// corners the probe hands over (the option off, 'ru', and 'ru' turned the other way)
function reads(r, flags = null) {
  const out = [], rd = new Float64Array(4), T = r.m.ctx.totalYears, g = r.mix.tables[0].g;
  const bridge = new Set(); for (let t = 1; t <= T; t++) if (g.reader && g.reader.years[t]) bridge.add(t);
  let cur = null;
  const probe = (W, IDX, NC, RD, pr) => {
    let cc = 0, r0 = 0, ru = 0, rw = 0, rs = 0, rsu = 0, acts = false, actsS = false;
    for (let k = 0; k < NC; k++) { const w = W[k]; if (w === 0) continue; const i = IDX[k], pk = RD.p[i], R = RD.R[i]; cc += w * RD.c[i]; r0 += w * R; ru += w * R * ruScale(pr, pk); rw += w * R * ruScale(pk, pr); rs += w * R * (pk > pr ? pr / pk : 1); rsu += w * R * (pk > pr ? pr / pk : ruScale(pr, pk)); if (pr > pk && R !== 0) acts = true; if (pk > pr && R !== 0) actsS = true; }
    cur = { off: clamp(pr * cc + r0), ru: clamp(pr * cc + ru), wrong: clamp(pr * cc + rw), rs: clamp(pr * cc + rs), rsu: clamp(pr * cc + rsu), acts, actsS };
  };
  const paths = E.pathsForSeed(7002, PATHS, T);
  for (let k = 0; k < r.mix.tables.length; k++) {
    const tab = r.mix.tables[k], Ly = tab.tsLayers ? tab.tsLayers[0] : tab;
    for (let i = 0; i < PATHS; i++) {
      const cz = Float64Array.from(paths[i]); cz[cz.length - 1] = r.mix.nodes[k];
      const vis = [];
      runPolicy(r, cz, { choose: (t, st, held) => chooseAction(r, st, t, held), visit: (t, s) => { if (bridge.has(t)) vis.push({ t, s: Float64Array.from(s) }); } });
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
assert.throws(() => solve({ readerSplit: 'rsu', readerBlend: 'logodds' }), /not defined for readerBlend/);
ok(true, "'rsu' with the log-odds blend is refused");
console.log(`reader-ru: ${n} checks passed`);
