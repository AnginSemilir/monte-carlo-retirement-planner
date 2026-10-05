/*
 * E3: A RESEARCH DEFAULT ONLY (E3c, results-e3c.txt: EXACT; the 30 Sep 09:49 mechanism, PLAN.md's E3 paragraph). Rule 8:
 * a decision changes the code default in the same commit as PLAN.md's decided-defaults block, and a test pins the two
 * together. This is that test for `e3` (plan-defaults.test.mjs pins the others, as f1-default.test.mjs does `bridgeRead`):
 *   - the block's "e3" (the product's) and PRODUCT_BASELINE.e3 are both false, and solvePlan with nothing passed solves
 *     without the copy;
 *   - the block's "e3Research" and research-opts.mjs's RESEARCH_OPTS.e3 are both true;
 *   - every research script that calls the solver and was first committed from E3_FROM on (or is not committed yet)
 *     spreads RESEARCH_OPTS or carries a line "// e3 off: <why>".
 * Each comparison is shown to fail on a planted drift.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { RESEARCH_OPTS, E3_FROM } from '../solver/research-opts.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), SOLVER = join(HERE, '../solver');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const D = JSON.parse(/<!-- decided-defaults([\s\S]*?)-->/.exec(readFileSync(join(SOLVER, 'PLAN.md'), 'utf8'))[1]);

// 1. the product keeps e3 off
const product = (decided, code) => 'e3' in decided && decided.e3 === false && code.e3 === false;
ok(product(D, PRODUCT_BASELINE), `the product's e3: decided ${D.e3}, code ${PRODUCT_BASELINE.e3}`);
ok(!product({ ...D, e3: true }, PRODUCT_BASELINE), 'planted: a decided e3 on against the code\'s off fails the same comparison');
ok(!product(D, { ...PRODUCT_BASELINE, e3: true }), 'planted: the code\'s e3 on against the decided off fails it too');
const { e3: _e3, ...noE3 } = D;
ok(!product(noE3, PRODUCT_BASELINE), 'planted: a decided-defaults block without the key fails it');
const sc = buildScenarios().find(s => s.id === 'S130');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
const def = solvePlan(E, M, plan, { lambda: 0.5, points: 4 });
ok(!def.meta.e3, `solvePlan with nothing passed solves without the copy (meta.e3 ${JSON.stringify(def.meta.e3)})`);
const on = solvePlan(E, M, plan, { lambda: 0.5, points: 4, ...RESEARCH_OPTS });
ok(on.meta.e3 && on.meta.e3.copied > 0, `RESEARCH_OPTS turns the copy on (${on.meta.e3 && on.meta.e3.copied} cells copied)`);

// 2. the research default is on
const research = (decided, opts) => decided.e3Research === true && opts.e3 === true;
ok(research(D, RESEARCH_OPTS), `the research e3: decided ${D.e3Research}, research-opts.mjs ${RESEARCH_OPTS.e3}`);
ok(!research({ ...D, e3Research: false }, RESEARCH_OPTS), 'planted: a decided research e3 off against research-opts.mjs\'s on fails the same comparison');
ok(Object.isFrozen(RESEARCH_OPTS), 'RESEARCH_OPTS is frozen, so a script cannot change it for the next');

// 3. the research scripts: from E3_FROM on, RESEARCH_OPTS or a stated reason
const callsSolver = src => /\bsolvePlan\s*\(|\bsolve\s*\(\s*E\s*,/.test(src);
const complies = src => !callsSolver(src) || /\.\.\.RESEARCH_OPTS\b/.test(src) || /^\s*\/\/ e3 off: \S.{10,}$/m.test(src);
ok(!complies("import { solvePlan } from 'x';\nconst r = solvePlan(E, M, plan, { points: 6 });\n"), 'planted: a script that calls the solver with neither RESEARCH_OPTS nor a reason fails');
ok(complies("const r = solvePlan(E, M, plan, { points: 6, ...RESEARCH_OPTS });\n"), 'a script that spreads RESEARCH_OPTS passes');
ok(complies("  // e3 off: coverage refuses e3 until shown identical\nconst r = solvePlan(E, M, plan, { e3: false });\n"), 'a script with a stated reason passes');
ok(!complies("// e3 off:\nconst r = solvePlan(E, M, plan, {});\n"), 'planted: a reason line with no reason fails');
const added = f => { try { return execFileSync('git', ['log', '--diff-filter=A', '--format=%cI', '--', f], { cwd: SOLVER, encoding: 'utf8' }).trim().split('\n').pop(); } catch { return ''; } };
const from = Date.parse(E3_FROM);
ok(Number.isFinite(from), `E3_FROM parses (${E3_FROM})`);
const scripts = readdirSync(SOLVER).filter(f => /^(audit|derive|preflight-parse|probe|observe)-[\w-]+\.mjs$/.test(f));
ok(scripts.length > 20, `the scan finds the research scripts (${scripts.length}): a scan that ran on nothing is an error`);
const due = scripts.filter(f => { const t = added(f); return !t || Date.parse(t) >= from; });
const bad = due.filter(f => !complies(readFileSync(join(SOLVER, f), 'utf8')));
ok(!bad.length, `every research script first committed from ${E3_FROM} on spreads RESEARCH_OPTS or states why e3 is off (${due.length} due${bad.length ? `; failing: ${bad.join(', ')}` : ''})`);
console.log(`\n=========== ${n} passed, 0 failed ===========`);
