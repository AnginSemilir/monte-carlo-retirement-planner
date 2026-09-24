/*
 * THE FAIR-TEST GATE, SHOWN TO FAIL ON PLANTED FAULTS (RULES.md rule 2), and every new reducer shown to use it.
 * Synthetic result files only: no solve, no results directory needed.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareData, parseAccept, formatReport } from '../solver/fair-gate.mjs';

const S = join(dirname(fileURLToPath(import.meta.url)), '../solver');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };

const knobs = { levels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], exponent: 2, margin: 0.005, raise: 0.003, drift: 0, bequestShape: 'cap', bequestCap: 1e6, gainBuckets: null, gainInterp: false, pclsStrict: false, bequestWeight: 0.02, resilienceWeight: 0, tiers: ['0/0', '1/1', '2/2'], mixture: 0, levelSearch: 'exhaustive', shareDead: null, quadNodes: 5, raiseCap: '1.1', blockTrim: false, raiseSurvival: true, failureShortfall: '1', estateScale: null, minPotYears: '1', finalExact: true, giaTiers: false, giaGain: null, planTier: null, bridgeRead: false };
const file = (id, over = {}) => ({ id, target: 30000, floorSpend: 24000, held: 3000, seedHeld: 7002, seedSearch: 7001, confidence: 0.9, coords: 'total 30 x 6 x 6', code: { hash: 'aaaa' }, prediction: { file: 'research/solver/predictions/x.md', sha: 'p1' }, knobs: { ...knobs, ...(over.knobs || {}) }, solver: { lambda: 0.02, landed: 'lambda held', successRate: 90 }, ...Object.fromEntries(Object.entries(over).filter(([k]) => k !== 'knobs')) });
const tag = (name, files, arm = 'solver') => ({ tag: name, arm, byId: Object.fromEntries(files.map(f => [f.id, f])) });
const blob = () => 'p1';
const cmp = (A, B, o = {}) => compareData(A, B, { blob, ...o });
const two = over => [tag('a', [file('S001'), file('S002')]), tag('b', [file('S001', over), file('S002', over)])];

let r = cmp(...two({}));
ok(r.bad === 0, 'identical arms are fair');
r = cmp(...two({ knobs: { mixture: 3 } }));
ok(r.bad === 1 && r.rows.find(x => x.n === 7).status === 'DIFFERS', 'planted: a different market world is caught (7)');
r = cmp(...two({ knobs: { minPotYears: null } }));
ok(r.rows.find(x => x.n === 10).status === 'DIFFERS', 'planted: a different minimum pot is caught (10)');
r = cmp(...two({ seedHeld: 7005 }));
ok(r.rows.find(x => x.n === 5).status === 'DIFFERS', 'planted: different held-out paths are caught (5)');
r = cmp(...two({ knobs: { failureShortfall: false } }), { tested: [22] });
ok(r.bad === 0 && r.rows.find(x => x.n === 22).status === 'TESTED', 'the thing under test is TESTED, not a failure');
r = cmp(...two({}), { tested: [22] });
ok(r.rows.find(x => x.n === 22).status === 'TESTED, BUT EQUAL', 'a "tested" variable that does not differ is flagged');
r = cmp(...two({ code: { hash: 'bbbb' } }));
ok(r.rows.find(x => x.n === 28).status === 'DIFFERS', 'planted: arms made by different code are caught (28)');
r = cmp(...two({ code: undefined }));
ok(r.rows.find(x => x.n === 28).status === 'UNKNOWN' && r.bad === 1, 'planted: an arm with no code stamp is UNKNOWN, not a pass');
r = cmp(...two({ code: undefined }), { accept: parseAccept('28=predates the code stamp; checked in git') });
ok(r.bad === 0 && r.rows.find(x => x.n === 28).status === 'ACCEPTED' && /predates/.test(formatReport(r)), 'an accepted difference passes and its reason is printed');
assert.throws(() => parseAccept('28'), /needs/); n++; console.log('PASS  an acceptance with no reason is refused');
r = cmp(tag('a', [file('S001'), file('S002', { code: { hash: 'cccc' } })]), tag('b', [file('S001'), file('S002')]));
ok(r.checks.some(c => c.status === 'MIXED CODE') && r.bad >= 1, 'planted: a tag made by two versions of the code is caught (the 21 Sep flex-mix split)');
r = cmp(...two({}), { blob: () => 'p2' });
ok(r.checks.some(c => c.status === 'PREDICTION EDITED') && r.bad >= 1, 'planted: a prediction edited after the results is caught');
r = cmp(...two({ prediction: { none: 'a measurement' } }));
ok(r.checks.some(c => c.status === 'NO PREDICTION') && r.bad >= 1, 'planted: a test arm run as a measurement cannot settle a test');
r = cmp(...two({ prediction: null }));
ok(r.checks.some(c => c.status === 'NO PREDICTION'), 'planted: an arm launched outside the launcher is caught');
const legacy = f => { const g = { ...f }; delete g.prediction; delete g.code; return g; };
r = cmp(tag('a', [legacy(file('S001'))]), tag('b', [legacy(file('S001'))]), { accept: parseAccept('28=legacy') });
ok(r.bad === 0 && r.checks.every(c => c.status === 'NOT RECORDED'), 'files from before the gate are noted, not failed, on the prediction');
r = cmp(tag('a', [file('S001')]), tag('g', [{ ...file('S001'), gkFloor: { successRate: 88, label: 'rule' }, solver: undefined, knobs: { mixture: 0, guardCap: 1.1, minPotYears: '1', armsOnly: true } }], 'gkFloor'));
ok(r.bad === 0 && r.rows.filter(x => x.status === 'DESIGN').length > 10, 'solver against guardrails: the solver-only settings are DESIGN, and the user\'s rules are compared');
r = cmp(tag('a', [file('S001')]), tag('g', [{ ...file('S001'), gkFloor: { successRate: 88, label: 'rule' }, solver: undefined, knobs: { mixture: 0, guardCap: 0, minPotYears: '1', armsOnly: true } }], 'gkFloor'));
ok(r.rows.find(x => x.n === 11).status === 'DIFFERS', "planted: the guardrails without the user's raise cap are caught (K5's first target)");
r = cmp(tag('a', [file('S001')]), tag('b', [file('S009')]));
ok(r.empty && r.bad, 'two arms with no household in common are not a fair test');

// every reducer written from 24 Sep must call the gate; the older ones are listed and frozen
const LEGACY = ['reduce-108.mjs', 'reduce-6e.mjs', 'reduce-bestof.mjs', 'reduce-calibration.mjs', 'reduce-k.mjs', 'reduce-m17.mjs', 'reduce-step2.mjs'];
const reducers = readdirSync(S).filter(f => /^reduce-.*\.mjs$/.test(f));
const missing = reducers.filter(f => !LEGACY.includes(f) && !/requireFair\(/.test(readFileSync(join(S, f), 'utf8')));
ok(missing.length === 0, `every reducer outside the legacy list calls requireFair (missing: ${missing.join(', ') || 'none'})`);
ok(LEGACY.every(f => reducers.includes(f)), 'the legacy list names only reducers that exist');

console.log(`\n${n} passed`);
