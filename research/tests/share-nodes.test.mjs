/*
 * NODE-1'S EXPLICIT PENSION-SHARE NODES (grid.js `shareNodes`, research only; PLAN.md NODE-1, O152). Stated before it
 * ran (14 Oct): the search locate puts a value at an inner node on that node with weight 0 on the next, 1 at the top
 * cell's end, below 0 at 0 and above 1 at 1, as locateLin does; on the uniform list of six nodes every table of a solve is
 * the linear axis's to 1e-9 (the arithmetic differs by rounding only); with an explicit dense list the solve runs, the
 * grid holds the list's count of a nodes and six b nodes, and meta names the list (absent when unset); a list that is
 * short, unordered, not from 0 to 1, or set with coverage is refused.
 *   node research/tests/share-nodes.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { nodesAxis, locateNodes } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };

// A. the locate
{ const ax = nodesAxis([0, 0.5, 0.8, 0.9, 1]), L = v => { const r = locateNodes(ax, v); return `${r.i}:${+r.w.toFixed(12)}`; };
  ok([L(-0.1), L(0), L(0.25), L(0.5), L(0.65), L(0.8), L(0.85), L(0.9), L(0.95), L(1), L(1.2)].join(' ') === '0:0 0:0 0:0.5 1:0 1:0.5 2:0 2:0.5 3:0 3:0.5 3:1 3:1', 'A  the search locate: an inner node on itself with weight 0, mid-cell 0.5, 1 at the top cell\'s end, clamped below 0 and above 1'); }

// B. the uniform list of six nodes against the linear axis
const all = buildScenarios();
const prep = id => { const sc = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } })); };
const OPTS = { lambda: 0.0223606797749979, points: 4, riskAbove: true, bridgeRead: 'reader' };
const plan = prep('S360');
const lin = solvePlan(E, M, plan, OPTS), uni = solvePlan(E, M, plan, { ...OPTS, shareNodes: [0, 0.2, 0.4, 0.6, 0.8, 1] });
let worst = 0, cells = 0;
for (let k = 0; k < lin.worlds.length; k++) for (let t = 0; t < lin.worlds[k].lsurv.length; t++) { const a = lin.worlds[k].lsurv[t], b = uni.worlds[k].lsurv[t]; for (let i = 0; i < a.length; i++) { cells++; worst = Math.max(worst, Math.abs(a[i] - b[i])); } }
ok(cells > 0 && worst < 1e-9, `B  the uniform list's survival tables are the linear axis's to 1e-9 over ${cells} cells (worst ${worst.toExponential(2)})`);
ok(lin.meta.shareNodes === undefined && Array.isArray(uni.meta.shareNodes) && uni.meta.shareNodes.length === 6, 'B  meta names the list when set and nothing when unset');

// C. a dense list
{ const list = [0, 0.2, 0.4, 0.6, 0.7, 0.75, 0.8, 0.825, 0.85, 0.875, 0.9, 0.925, 0.95, 0.975, 1], r = solvePlan(E, M, plan, { ...OPTS, shareNodes: list });
  ok(r.g.ni === 15 && r.g.nt === 6 && r.meta.shareNodes.join(',') === list.join(',') && r.meta.points === `total ${r.g.np} x 15 x 6`, `C  a dense list: ${r.meta.points}, meta's list the given one`);
  const s0 = M.initialState(r.m), v = r.worlds.map(w => w.value(s0, 0).survival);
  ok(v.every(x => x > 0 && x < 1), `C  the dense solve reads the initial state in (0, 1) in every world (${v.map(x => x.toFixed(4)).join(', ')})`); }

// D. refusals
for (const [bad, why] of [[[0, 1], 'two nodes'], [[0, 0.6, 0.5, 1], 'unordered'], [[0.1, 0.5, 1], 'not from 0'], [[0, 0.5, 0.9], 'not to 1']]) {
  let threw = false; try { solvePlan(E, M, plan, { ...OPTS, shareNodes: bad }); } catch (e) { threw = /shareNodes/.test(e.message); }
  ok(threw, `D  refused: ${why}`);
}
{ let threw = false; try { solvePlan(E, M, plan, { ...OPTS, shareNodes: [0, 0.5, 1], coverage: true }); } catch (e) { threw = /shareNodes/.test(e.message); } ok(threw, 'D  refused: with coverage'); }

console.log(`share-nodes: ${n} checks passed`);
