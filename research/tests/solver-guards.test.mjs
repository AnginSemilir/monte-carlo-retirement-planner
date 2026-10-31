/*
 * THE REMAINING ARGMAX LOOPS FAIL LOUDLY, AND THE GUARDRAILS' LOST-YEAR FLAG (the follow-up review of 22 Oct, answer 6;
 * STATE.md D20 (6)). Step 1 made every argmax loop of solve() and the chooser throw on a non-finite score; the adaptive
 * reference's two loops (adaptive.js) and a couple's joint move (couple.js) still let a NaN lose in silence, the move 0 or
 * the fallback kept with nothing said (O199's pattern). And fast.js grow set the guardrails' "lost money last year" flag
 * from the pension and ISA grown a second time.
 *   1. the adaptive reference on S362 (its reader reads bridge years), a small lattice: builds as before; planted, a NaN in
 *      the backward step (plant 'nanQ') and in the foot node (plant 'nanQfoot') each throws, naming its loop;
 *   2. a couple's joint move (chooseJoint) chooses as before; planted, a table whose value is NaN throws;
 *   3. grow's flag is the engine's (App.jsx l.2526 and l.2541: the pots after growth below the pots before it): a year where
 *      the pension falls 20% and the taxable account rises 18% lost money (200,000 to 198,000), one where all rise did
 *      not, one where all fall did; planted, the old rule reads the first as not lost.
 * e3pcls is off in part 1, as in adaptive-step.test.mjs: the test reads the reference's argmax, not the lump sum's.
 *   node research/tests/solver-guards.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { grow } from '../../src/solver/fast.js';
import { solveCouple, chooseJoint } from '../../src/solver/couple.js';
import { solveCandidate, FROZEN_OPTS } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const thrown = f => { try { f(); return null; } catch (e) { return e.message; } };
const all = buildScenarios();

// 1. the adaptive reference's two loops
{
  const h = JSON.parse(JSON.stringify(all.find(s => s.id === 'S362').plan));
  const plan = () => E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } }));
  // one solve builds the reference (the tier state and its switch charge off: the reference does not read them, and the
  // solve takes a minute rather than three); the plants rebuild it from the same inputs (adaptive.js rebuild)
  let built = null; const e0 = thrown(() => { built = solveCandidate(E, M, plan(), { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, e3: false, e3pcls: false, pclsInterp: false, tierState: false, switchCharge: 0, readerRef: 'adaptive', adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: false } }, FROZEN_OPTS); });
  const ad = built && built.mix.tables[0].g.reader && built.mix.tables[0].g.reader.adaptive;
  ok(!e0 && ad && ad.ref && ad.ref.bridge.length > 0, `S362: the adaptive reference builds with no plant (${e0 || `bridge years ${ad && ad.ref ? ad.ref.bridge.join(',') : '-'}`})`);
  const again = ad && ad.ref ? thrown(() => ad.ref.rebuild({})) : 'not built';
  ok(again === null, `EDGE: rebuilt from the same inputs with no plant, it builds again (${again || 'no throw'})`);
  const eQ = ad && ad.ref ? thrown(() => ad.ref.rebuild({ plant: 'nanQ' })) : null, eF = ad && ad.ref ? thrown(() => ad.ref.rebuild({ plant: 'nanQfoot' })) : null;
  ok(/adaptive reference: non-finite value in the backward step, year \d+, cell a 0, b 0, gain 0, move 0, world 0: NaN/.test(eQ || ''), `planted: a NaN in the backward step throws (${eQ || 'no throw'})`);
  ok(/adaptive reference: non-finite value in the foot node, year \d+, cell b 0, gain 0, move 0, world 0: NaN/.test(eF || ''), `planted: a NaN at the foot node throws (${eF || 'no throw'})`);
}

// 2. a couple's joint move
{
  const sc = all.filter(s => s.plan.demographics.planningMode !== 'single')[3];
  const plan = E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(sc.plan)), config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
  const cp = solveCouple(E, M, plan, { points: 4 }), st = M.initialState(cp.m);
  let j = null; const e0 = thrown(() => { j = chooseJoint(cp, st, 0); });
  ok(!e0 && j && typeof j.split === 'number', `${sc.id}: the joint move is chosen as before (${e0 || `split ${j && j.split}, moves ${j && j.ia} and ${j && j.ib}`})`);
  const nanTable = { ...cp.tables.self, value: () => ({ survival: NaN, resilience: 0, bequest: 0 }) };
  const eN = thrown(() => chooseJoint({ ...cp, tables: { ...cp.tables, self: nanTable } }, M.initialState(cp.m), 0));
  ok(/couple: non-finite score in the joint move, year 0/.test(eN || ''), `planted: a table whose value is NaN throws (${eN || 'no throw: the fallback taken in silence'})`);
}

// 3. grow's lost-year flag against the engine's rule; the state as a forward run carries it (13 slots, cash in slot 12)
{
  const c = { yr: { frac: [1], buffer: [0] } };
  const at = (pen, isa, gia, real) => { const s = new Float64Array(13); s[0] = pen; s[1] = isa; s[2] = gia; s[3] = 0; s[6] = -1; s[7] = -1; s[8] = 1; s[12] = 0; const before = pen + isa + gia; grow(c, 0, s, real); return { flag: s[9], engine: (s[0] + s[1] + s[2]) < before ? 1 : 0, after: s[0] + s[1] + s[2], before }; };
  const oldRule = (pen, isa, gia, real) => { const p = pen * (1 + real[0]), q = isa * (1 + real[1]), g2 = gia * (1 + real[2]); return (p * (1 + real[0]) + q * (1 + real[1]) + g2) < (p + q + gia) ? 1 : 0; };   // the line before 23 Oct, cash 0
  const A = at(100000, 0, 100000, [-0.20, 0, 0.18, 0]), B = at(100000, 50000, 100000, [0.05, 0.05, 0.05, 0]), C = at(100000, 50000, 100000, [-0.10, -0.10, -0.10, 0]);
  ok(A.flag === 1 && A.engine === 1, `the pension down 20%, the taxable account up 18%: lost money (${A.before} to ${A.after}), flag ${A.flag}, the engine's rule ${A.engine}`);
  ok(B.flag === 0 && B.engine === 0 && C.flag === 1 && C.engine === 1, `all up 5%: not lost (flag ${B.flag}); all down 10%: lost (flag ${C.flag}), as the engine's rule`);
  ok(oldRule(100000, 0, 100000, [-0.20, 0, 0.18, 0]) === 0, 'planted: the old rule (the pension and ISA grown a second time) reads the first year as not lost');
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} guard checks failed`);
