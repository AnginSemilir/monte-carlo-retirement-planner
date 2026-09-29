/*
 * THE ORDER REFERENCE IN THE SOLVER (solve.js readerRef 'order'; reader.js orderChance; PLAN.md O36 "where it can move a
 * choice"). Stated before it ran (29 Sep): the plan says, from the code (grade B), that on a 2-year bridge the draw-order
 * reference cannot move a choice - the chooser reads year t + 1's table and year 1's reference is a one-bill step, the
 * same in any order. So on S126 (a 2-year bridge) every world's survival and bequest table in every year must be bit for
 * bit the default reader's, and only year 0's reader split (its p, and so its c and R) may differ; planted: that split
 * must differ, or the comparison is a solve against itself. On S360 (an 8-year bridge) year 1's reference has several
 * bills, so the option must change some table before the bridge ends. And meta names the reference.
 *   node research/tests/reader-order-solve.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const all = buildScenarios();
const prep = id => { const sc = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } })); };
const OPTS = { lambda: 0.0223606797749979, points: 4, riskAbove: true, bridgeRead: 'reader' };
const same = (a, b) => a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
const splits = g => { const by = new Map(); for (const T of g.reader.of.values()) { const list = by.get(T.t) || []; list.push(T); by.set(T.t, list); } return by; };

// S126: a 2-year bridge
{
  const plan = prep('S126');
  const base = solvePlan(E, M, plan, OPTS), ord = solvePlan(E, M, plan, { ...OPTS, readerRef: 'order' });
  const years = ord.g.reader.years; let bridge = 0; for (let t = 0; t < years.length; t++) if (years[t]) bridge++;
  ok(base.meta.readerRef === null && ord.meta.readerRef === 'order', `meta names the reference: default ${base.meta.readerRef}, option ${ord.meta.readerRef}`);
  ok(bridge === 2, `S126's bridge is ${bridge} years`);
  let allSame = true;
  for (let k = 0; k < base.worlds.length; k++) for (let t = 0; t < base.worlds[k].lsurv.length; t++) if (!same(base.worlds[k].lsurv[t], ord.worlds[k].lsurv[t]) || !same(base.worlds[k].beq[t], ord.worlds[k].beq[t])) allSame = false;
  ok(allSame, 'S126: every world\'s survival and bequest table in every year is bit for bit the default reader\'s (a 2-year bridge: no choice moves)');
  const sb = splits(base.g), so = splits(ord.g);
  const differs = t => (sb.get(t) || []).some((T, i) => { const U = (so.get(t) || [])[i]; return U && !same(Array.from(T.p), Array.from(U.p)); });
  ok(differs(0), 'planted: year 0\'s reader split differs (its reference has two bills), so the comparison is not a solve against itself');
  ok(!differs(1), 'year 1\'s reader split is the same (one bill: a step in any order)');
}

// S360: an 8-year bridge
{
  const plan = prep('S360');
  const base = solvePlan(E, M, plan, OPTS), ord = solvePlan(E, M, plan, { ...OPTS, readerRef: 'order' });
  const years = ord.g.reader.years; let last = -1; for (let t = 0; t < years.length; t++) if (years[t]) last = t;
  let moved = false;
  for (let k = 0; k < base.worlds.length; k++) for (let t = 0; t < last; t++) if (!same(base.worlds[k].lsurv[t], ord.worlds[k].lsurv[t])) moved = true;
  ok(last >= 2 && moved, `S360 (bridge years 0 to ${last}): the option changes some survival table before the bridge ends`);
}
console.log(`\nreader-order-solve: ${n} passed`);
