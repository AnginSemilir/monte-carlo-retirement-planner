/*
 * TOP-CELL's TC-FORM CEILING (PLAN.md TOP-CELL; the design review of 20 Oct 17:04 UK, deep-review-log.md, its (3) and (7): "TC-FORM
 * AND TC-SHARE: RECORD READS, NOT ARMS"). The read inside a share cell is linear in share (grid.js locLinInto on the share axis;
 * the corner blend), so a copy form that sets only a copied node's c cannot represent a steep fall of c inside the top cell. Its
 * ceiling on S370, at COPY-X's settings: CX and SNRX solved at 30 points as audit-topcell.mjs solves them (the candidate, seed
 * 7002), and at each of CX's visited step-year reads (bridge years 3 and 7, every world, the tier layer held: COPY-X's saved
 * states and moves, results/diagcopyx, behind COPY-X's gate) CX's table read again with the top share cell's copied corners
 * (share 0.8 and 1, below the support line, in a share row with support) given c by each form, R following as S - p c
 * (buildReaderTable's rule), against SNRX's read at the same state (the fix's):
 *   linear   CX's own rule (reader.js extrapC); THE CALIBRATION: it must give back CX's read at every state (to 1e-12), so
 *            the corners, the rows and the replacement are the solver's own
 *   quad     a quadratic through the three supported nodes below along the row (Lagrange), clipped as extrapC clips
 *   logodds  linear in log-odds from the two supported nodes below, clipped as extrapC clips
 *   oracle   SNRX's own c at the node of the same share (SN's support's value: the most a node value can carry)
 * Printed by world and year: the reads, the reads with a copied top-cell corner, the gap sum(V_CX - V_SNRX) and each form's
 * share of it removed, sum(V_CX - V_form) / sum(V_CX - V_SNRX). THE READING (the review's): if even the oracle removes under
 * half of the gap at the step years (years 3 and 7 pooled, world 0), the records falsify TC-FORM, grade C (a node-value form
 * cannot carry the remainder); otherwise its ceiling is the oracle's share. A read only: no item, no arm.
 *   node research/solver/tcform-topcell.mjs > research/solver/results-tcform-topcell.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readValues, READER_PROBE } from '../../src/solver/grid.js';
import { solveCandidate } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url)), XDIR = join(HERE, 'results', 'diagcopyx');
const LAMBDA = 0.0223606797749979, W = 0.02, PTS = 30, NODES_SN = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1], YEARS = [3, 7], CL = 1e-6, TOPLO = 0.8, LINE = 0.5;
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
const clamp = v => (v < CL ? CL : v > 1 - CL ? 1 - CL : v);
const logit = c => { const q = Math.min(1 - 1e-12, Math.max(1e-12, c)); return Math.log(q / (1 - q)); }, expit = x => 1 / (1 + Math.exp(-x));
const decRaw = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };

// COPY-X's files behind COPY-X's gate
const gx = spawnSync('node', [join(HERE, 'reduce-copyx.mjs'), XDIR], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (gx.status !== 0 || !/^GATE: passed/m.test(gx.stdout || '')) { console.log('COPY-X\'s files did not pass its gate'); process.exit(1); }
const FX = JSON.parse(gunzipSync(readFileSync(join(XDIR, 'S370-CX-P30S6Q5.json.gz'))).toString());
const h = buildScenarios().find(s => s.id === 'S370');
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const t0 = Date.now();
const CX = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, readerCopy: 'extrap' });
const SN = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, shareNodes: NODES_SN, readerSplit: 'ru', readerCopy: 'extrap' });
console.log(`TC-FORM'S CEILING (S370, ${PTS} points, COPY-X's CX and SNRX re-solved on this code in ${Math.round((Date.now() - t0) / 1000)} s; CX's visited states from COPY-X's saved file, ${FX.NPW} paths a world, seed ${FX.seed})`);
const gC = CX.mix.tables[0].g, gS = SN.mix.tables[0].g;
const same = (a, b) => a.length === b.length && Array.from(a).every((x, i) => x === b[i]);
if (!same(gC.axes.W.pts, gS.axes.W.pts) || !same(gC.axes.b.pts, gS.axes.b.pts) || !same(gC.gain, gS.gain) || !same(gC.pcls, gS.pcls)) { console.log('CX\'s and SNRX\'s grids differ outside the share axis: the oracle cannot be read'); process.exit(1); }
const A = Array.from(gC.axes.a.pts), AS = Array.from(gS.axes.a.pts), ni = gC.ni, np = gC.np, nt = gC.nt, NG = gC.gain.length;
const snOf = ii => AS.findIndex(x => Math.abs(x - A[ii]) < 1e-12);
if (A.filter(x => x >= TOPLO).some(x => snOf(A.indexOf(x)) < 0)) { console.log('a top-cell share node of CX is not one of SN\'s'); process.exit(1); }
// a flat index's coordinates (grid.js index: ip + ii * isa + it * tax + ig * gain + ic * pcls)
const coords = (g, i) => { const s = g.stride, ic = Math.floor(i / s.pcls), r1 = i - ic * s.pcls, ig = Math.floor(r1 / s.gain), r2 = r1 - ig * s.gain, it = Math.floor(r2 / s.tax), r3 = r2 - it * s.tax, ii = Math.floor(r3 / s.isa), ip = r3 - ii * s.isa; return { ip, ii, it, ig, ic }; };
const supOf = (RD, i) => RD.p[i] >= LINE;
// the forms for a copied node at (ip, ii, it, ig, ic) in RD (CX's), from the supported nodes below along its row
function formC(form, RD, x, RDs) {
  const { ip, ii, it, ig, ic } = x, I = k => gC.index(ip, k, it, ig, ic), below = [];
  for (let k = ii - 1; k >= 0 && below.length < 3; k--) if (supOf(RD, I(k))) below.push(k);
  if (!below.length) return null;
  const src = RD.c[I(below[0])], clip = v => (v < 0 ? 0 : v > src ? src : v);
  if (form === 'oracle') { const i2 = gS.index(ip, snOf(ii), it, ig, ic); return RDs.c[i2]; }
  if (below.length < 2) return src;
  const [l1, l2, l3] = below, c1 = RD.c[I(l1)], c2 = RD.c[I(l2)];
  if (form === 'linear') return clip(c1 + (c1 - c2) * (A[ii] - A[l1]) / (A[l1] - A[l2]));
  if (form === 'logodds') return clip(expit(logit(c1) + (logit(c1) - logit(c2)) * (A[ii] - A[l1]) / (A[l1] - A[l2])));
  if (form === 'quad') { if (l3 === undefined) return clip(c1 + (c1 - c2) * (A[ii] - A[l1]) / (A[l1] - A[l2])); const c3 = RD.c[I(l3)], xs = [A[l1], A[l2], A[l3]], cs = [c1, c2, c3], xq = A[ii]; let v = 0; for (let a = 0; a < 3; a++) { let L = 1; for (let b = 0; b < 3; b++) if (b !== a) L *= (xq - xs[b]) / (xs[a] - xs[b]); v += cs[a] * L; } return clip(v); }
  throw new Error(form);
}
const FORMS = ['linear', 'quad', 'logodds', 'oracle'];
const T = CX.m.ctx.totalYears, nb = FX.bridge.length, D = FX.dim, rd = new Float64Array(4);
let cur = null; READER_PROBE.fn = (Wc, IDX, NC, RD, pr) => { cur = { W: Float64Array.from(Wc.subarray ? Wc.subarray(0, NC) : Wc.slice(0, NC)), IDX: Int32Array.from(IDX.subarray ? IDX.subarray(0, NC) : IDX.slice(0, NC)), NC, RD, pr }; };
const layerOf = (r, k, ai) => { const tab = r.mix.tables[k]; return tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[ai]] : tab; };
let calN = 0, calBad = 0, calMax = 0;
const ACC = {};
for (let k = 0; k < 3; k++) {
  const st = decRaw(FX.states[`S${k}`]), mv = dec16(FX.moves[`MV${k}`]), tabC = CX.mix.tables[k], tabS = SN.mix.tables[k];
  for (const t of YEARS) {
    const bi = FX.bridge.indexOf(t), a = (ACC[`${k}/${t}`] = { n: 0, top: 0, gap: 0, by: Object.fromEntries(FORMS.map(f => [f, 0])) });
    for (let i = 0; i < FX.NPW; i++) {
      const s = st.subarray((i * nb + bi) * D, (i * nb + bi + 1) * D);
      if (!Number.isFinite(s[0])) continue;
      const ai = mv[i * FX.years + t - 1]; if (ai === 65535) continue;
      const LyC = layerOf(CX, k, ai), LyS = layerOf(SN, k, ai), sv = Float64Array.from(s);
      cur = null; readValues(tabC.g, LyC.lsurv[t], LyC.beq[t], sv, rd, LyC.lresil[t], LyC.short[t], t); const vC = rd[0], pc = cur;
      cur = null; readValues(tabS.g, LyS.lsurv[t], LyS.beq[t], sv, rd, LyS.lresil[t], LyS.short[t], t); const vS = rd[0], ps = cur;
      if (!pc || !ps) continue;
      a.n++; a.gap += vC - vS;
      let hasTop = false;
      const vF = {};
      for (const form of FORMS) {
        let cc = 0, rr = 0;
        for (let q = 0; q < pc.NC; q++) {
          const w = pc.W[q]; if (w === 0) continue;
          const i2 = pc.IDX[q], RD = pc.RD, x = coords(gC, i2);
          let c = RD.c[i2], R = RD.R[i2];
          if (!supOf(RD, i2) && A[x.ii] >= TOPLO - 1e-12) {
            const anySup = (() => { for (let kk = 0; kk < ni; kk++) if (supOf(RD, gC.index(x.ip, kk, x.it, x.ig, x.ic))) return true; return false; })();
            if (anySup) { const cf = formC(form, RD, x, ps.RD); if (cf !== null) { hasTop = true; const S = RD.p[i2] * RD.c[i2] + RD.R[i2]; if (form === 'linear') { calN++; const d = Math.abs(cf - c); if (d > calMax) calMax = d; if (d > 1e-12) calBad++; } c = cf; R = S - RD.p[i2] * cf; } }
          }
          cc += w * c; rr += w * R;
        }
        vF[form] = clamp(pc.pr * cc + rr);
      }
      if (Math.abs(vF.linear - vC) > 1e-12) calBad++;
      if (hasTop) a.top++;
      for (const form of FORMS) a.by[form] += vC - vF[form];
    }
  }
}
READER_PROBE.fn = null;
console.log(`THE CALIBRATION: the linear form at ${calN} copied top-cell corners against CX's own c (largest gap ${calMax.toExponential(2)}), and CX's read given back at every state: ${calBad === 0 ? 'HELD' : `FAILED (${calBad})`}`);
if (calBad) process.exit(1);
for (let k = 0; k < 3; k++) for (const t of YEARS) {
  const a = ACC[`${k}/${t}`];
  console.log(`  world ${k} year ${t}: ${a.n} reads, ${a.top} with a copied top-cell corner; the gap CX less SNRX ${f4(100 * a.gap / FX.NPW)} points a path; removed by ${FORMS.map(f => `${f} ${f4(a.gap !== 0 ? a.by[f] / a.gap : NaN)}`).join(', ')}`);
}
const pool = ks => { let gap = 0; const by = Object.fromEntries(FORMS.map(f => [f, 0])); for (const k of ks) for (const t of YEARS) { const a = ACC[`${k}/${t}`]; gap += a.gap; for (const f of FORMS) by[f] += a.by[f]; } return { gap, by }; };
for (const [lab, ks] of [['world 0', [0]], ['world 1', [1]], ['world 2', [2]]]) { const p = pool(ks); console.log(`  ${lab}, years 3 and 7 pooled: the gap ${f4(100 * p.gap / FX.NPW)} points a path; removed by ${FORMS.map(f => `${f} ${f4(p.gap !== 0 ? p.by[f] / p.gap : NaN)}`).join(', ')}`); }
const p0 = pool([0]), orc = p0.gap !== 0 ? p0.by.oracle / p0.gap : NaN;
console.log(`VERDICT: TC-FORM's ceiling (the oracle's share of world 0's step-year gap) ${f4(orc)}: ${!Number.isFinite(orc) ? 'not read' : orc < 0.5 ? 'under a half: the records falsify TC-FORM (grade C)' : 'a half or more: TC-FORM stands, its ceiling the oracle\'s share (grade C)'}`);
