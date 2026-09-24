/*
 * THE BRIDGE READ'S DEFAULT: OFF until F2's test (schedule 7e) chooses between off, F1 v1, F1 v2 and F2. F1 v2 was the
 * provisional default from 18:21 UK on the maintainer's condition that it was genuinely better than v1; withdrawn 24 Sep
 * 19:25 UK (PLAN.md's ledger): the files do not show it, and the F1 v2 test's registered consequence is that v2 is not
 * carried forward. Rule 8: a decision changes the code default in the same commit as PLAN.md's decided-defaults block,
 * and a test pins the two together. This is that test for `bridgeRead` (plan-defaults.test.mjs pins the others): the
 * block and PRODUCT_BASELINE agree, solvePlan reads without F1 when nothing is passed, and an explicit `bridgeRead: 2`
 * still turns v2 on (7e's arms).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const D = JSON.parse(/<!-- decided-defaults([\s\S]*?)-->/.exec(readFileSync(join(HERE, '../solver/PLAN.md'), 'utf8'))[1]);
const agrees = (decided, code) => 'bridgeRead' in decided && decided.bridgeRead === code.bridgeRead;
ok(agrees(D, PRODUCT_BASELINE) && D.bridgeRead === false, `the bridge read: decided ${D.bridgeRead}, code ${PRODUCT_BASELINE.bridgeRead}`);
ok(!agrees({ ...D, bridgeRead: 2 }, PRODUCT_BASELINE), 'planted: a decided v2 against the code\'s off fails the same comparison');
const { bridgeRead: _, ...missing } = D;
ok(!agrees(missing, PRODUCT_BASELINE), 'planted: a decided-defaults block without the key fails it too');
// S126: the household the bridge read was built for (a retired bridge before the pension opens)
const sc = buildScenarios().find(s => s.id === 'S126');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
const def = solvePlan(E, M, plan, { lambda: 0.5, points: 6 });
const v2 = solvePlan(E, M, plan, { lambda: 0.5, points: 6, bridgeRead: 2 });
ok(def.meta.bridgeRead === false, `by default solvePlan reads without F1 (meta.bridgeRead ${def.meta.bridgeRead})`);
ok(v2.meta.bridgeRead === 2, `an explicit bridgeRead: 2 reads with v2 (meta.bridgeRead ${v2.meta.bridgeRead})`);
console.log(`\n${n} passed`);
