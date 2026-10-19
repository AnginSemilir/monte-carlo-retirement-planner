/*
 * COPY-X's copy rule (`readerCopy: 'extrap'`; reader.js extrapC and the copy loop, solve.js; research only; PLAN.md COPY-X,
 * items/COPY-X.md, PR1): an unsupported node whose nearest supported neighbour along its share row lies below it takes c
 * extrapolated linearly from that node and the next supported node below, clipped to [0, the source's c]; with no second
 * supported node below, or the nearest supported node above, the flat copy. Checked on every reader table of S370 at 4 points
 * under the candidate's options: each copied node's c is the rule's, recomputed here from the table's own supported nodes
 * (S = R + p c at every node), under 'extrap', and the flat copy with the option off; R = S - p c holds at every node. The
 * check is shown failing on three planted faults - the flat copy kept, the extrapolation taken from above, and the clip left
 * off - and the rule is shown acting on some nodes (not a check over nothing).
 * e3pcls off (declared): the check is of the reader's copy, not e3's copy.
 *   node research/tests/reader-copy.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { candidatePlan, CANDIDATE_OPTS } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const TOL = 1e-12;
const h = buildScenarios().find(s => s.id === 'S370');
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const solve = extra => solvePlan(E, M, candidatePlan(E, plan), { ...CANDIDATE_OPTS, e3pcls: false, lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, ...extra });

// every copied node of every reader table: its c as stored, and the c each rule gives from the table's supported nodes
function nodes(r) {
  const g = r.mix.tables[0].g, line = g.reader.line, A = g.axes.a.pts, { np, ni, nt } = g, NG = g.gain.length, NCL = g.pcls.length, out = [];
  let rBad = 0, tables = 0;
  for (const RD of new Set(g.reader.of.values())) {
    tables++;
    const S = Float64Array.from(RD.p, (p, i) => RD.R[i] + p * RD.c[i]);
    for (let i = 0; i < S.length; i++) if (Math.abs(RD.R[i] - (S[i] - RD.p[i] * RD.c[i])) > TOL) rBad++;
    for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
      const I = ii => g.index(ip, ii, it, ig, ic), sup = ii => RD.p[I(ii)] >= line;
      if (![...Array(ni).keys()].some(sup)) continue;
      for (let ii = 0; ii < ni; ii++) {
        if (sup(ii)) continue;
        let near = -1, below = false;
        for (let d = 1; d < ni; d++) { if (ii - d >= 0 && sup(ii - d)) { near = ii - d; below = true; break; } if (ii + d < ni && sup(ii + d)) { near = ii + d; break; } }
        const src = RD.c[I(near)], flat = src;
        const ext = (from, clip) => { let k2 = -1; for (let k = from - 1; k >= 0; k--) if (sup(k)) { k2 = k; break; } if (k2 < 0) return src; const c2 = RD.c[I(k2)], x = src + (src - c2) * (A[ii] - A[from]) / (A[from] - A[k2]); return clip ? (x < 0 ? 0 : x > src ? src : x) : x; };
        const extrap = below ? ext(near, true) : flat, raw = below ? ext(near, false) : flat;
        // the planted direction fault: extrapolate from the two supported nodes above instead
        let above = flat; { let a1 = -1, a2 = -1; for (let k = ii + 1; k < ni; k++) if (sup(k)) { if (a1 < 0) a1 = k; else { a2 = k; break; } } if (a1 >= 0 && a2 >= 0) { const c1 = RD.c[I(a1)], c2 = RD.c[I(a2)], x = c1 + (c1 - c2) * (A[ii] - A[a1]) / (A[a1] - A[a2]); above = x < 0 ? 0 : x > c1 ? c1 : x; } }
        out.push({ c: RD.c[I(ii)], flat, extrap, raw, above });
      }
    }
  }
  return { out, rBad, tables };
}

const X = solve({ readerCopy: 'extrap' }), OFF = solve({});
ok(X.meta.readerCopy === 'extrap' && OFF.meta.readerCopy === null, "the solve's meta carries the rule ('extrap', and null with the option off)");
const nx = nodes(X), noff = nodes(OFF);
ok(nx.out.length > 100 && noff.out.length > 100, `the copied nodes: ${nx.out.length} under 'extrap' and ${noff.out.length} with the option off, over ${nx.tables} and ${noff.tables} reader tables`);
ok(nx.rBad === 0 && noff.rBad === 0, 'R = S - p c at every node of every table, under either setting');
const acts = nx.out.filter(x => Math.abs(x.extrap - x.flat) > 1e-9).length, clipped = nx.out.filter(x => Math.abs(x.raw - x.extrap) > 1e-9).length;
ok(acts > 0, `the rule acts: ${acts} copied nodes take a c other than the flat copy's`);
ok(nx.out.every(x => Math.abs(x.c - x.extrap) <= TOL), `under 'extrap' every copied node's c is the rule's (largest gap ${Math.max(...nx.out.map(x => Math.abs(x.c - x.extrap))).toExponential(2)})`);
ok(noff.out.every(x => Math.abs(x.c - x.flat) <= TOL), `with the option off every copied node's c is the flat copy's (largest gap ${Math.max(...noff.out.map(x => Math.abs(x.c - x.flat))).toExponential(2)})`);
// the planted faults: the same check against the flat copy, an extrapolation from above, and the clip left off must fail
const flatGap = nx.out.filter(x => Math.abs(x.c - x.flat) > TOL).length, aboveGap = nx.out.filter(x => Math.abs(x.c - x.above) > TOL).length, rawGap = nx.out.filter(x => Math.abs(x.c - x.raw) > TOL).length;
ok(flatGap > 0, `planted fault caught: the flat copy kept disagrees with the 'extrap' table on ${flatGap} nodes`);
ok(aboveGap > 0, `planted fault caught: the extrapolation taken from above disagrees on ${aboveGap} nodes`);
ok(clipped > 0 && rawGap > 0, `planted fault caught: the clip left off disagrees on ${rawGap} nodes (${clipped} extrapolations clipped)`);
assert.throws(() => solve({ readerCopy: 'linear' }), /only 'extrap'/);
assert.throws(() => solve({ readerCopy: 'extrap', readerSplit: 'r0' }), /set one/);
assert.throws(() => solve({ readerCopy: 'extrap', bridgeRead: false, bridgeStep: undefined }), /need the bridge reader/);
ok(true, "an unknown rule, the rule with readerSplit 'r0', and the rule without the reader are refused");
console.log(`reader-copy: ${n} checks passed`);
