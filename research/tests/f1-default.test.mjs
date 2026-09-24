/*
 * F1 V2 IS THE PRODUCT'S BRIDGE READ, PROVISIONALLY (maintainer 24 Sep ~18:25 UK, until F2's test). Rule 8: the decision
 * changes the code default in the same commit as PLAN.md's decided-defaults block, and a test pins the two together.
 * This is that test for `bridgeRead` (plan-defaults.test.mjs pins the others): the block and PRODUCT_BASELINE agree,
 * solvePlan reads the bridge with v2 when nothing is passed, and an explicit `bridgeRead: false` still turns it off (the
 * F1 tests' OFF arm, audit-s126.mjs).
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
ok(D.bridgeRead === 2 && PRODUCT_BASELINE.bridgeRead === 2, `the bridge read: decided ${D.bridgeRead}, code ${PRODUCT_BASELINE.bridgeRead}`);
ok({ ...D, bridgeRead: 1 }.bridgeRead !== PRODUCT_BASELINE.bridgeRead, 'planted: a decided v1 against the code\'s v2 would fail the line above');
// S126: the household the bridge read was built for (a retired bridge before the pension opens)
const sc = buildScenarios().find(s => s.id === 'S126');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
const on = solvePlan(E, M, plan, { lambda: 0.5, points: 6 });
const off = solvePlan(E, M, plan, { lambda: 0.5, points: 6, bridgeRead: false });
ok(on.meta.bridgeRead === 2, `by default solvePlan reads the bridge with v2 (meta.bridgeRead ${on.meta.bridgeRead})`);
ok(off.meta.bridgeRead === false, `an explicit bridgeRead: false turns it off (meta.bridgeRead ${off.meta.bridgeRead})`);
console.log(`\n${n} passed`);
