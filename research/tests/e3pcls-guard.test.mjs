/*
 * THE e3pcls GUARD AND ITS DEFAULT, PINNED (research/solver/e3pcls-pin.mjs; the maintainer, 7 Oct 22:50 UK: e3pcls a
 * research default, 'with the e3pcls test run on every solver change as the guard'). Each check fails on a planted fault
 * first (RULES.md rule 6):
 *   - the fingerprint covers every file under src/solver and the candidate's research files, and moves on any edit to
 *     any of them: the plan-auditor's missed edit of 8 Oct (fast.js's dated deposit booked a year later), the drip
 *     source's test dropped, the deep review's three contribution-gate edits (8 Oct 05:58 UK), a comment, spacing, an
 *     edit to candidate.mjs or e2-worker.mjs, a file added or removed, and text moved across a file boundary; it is the
 *     same on a second read and in any key order;
 *   - pinProblem reads no pin, a stale pin and a matching pin correctly;
 *   - solveCandidate and solveSplit refuse e3pcls on a stale pin, before any solve, and name the way out;
 *   - the pinning flag (e3pclsPinning) appears in no file but the identity test; a research script or test first
 *     committed from E3PCLS_FROM (the decision, 7 Oct 22:50 UK) that calls solvePlan itself with the candidate's or the
 *     research options calls checkE3pclsPin, and so do the three older direct callers;
 *   - the default: RESEARCH_OPTS's e3pcls and PRODUCT_BASELINE's against PLAN.md's decided-defaults block (e3pclsResearch
 *     and e3pcls), each mismatch planted; and the committed pin matches the code.
 *   node research/tests/e3pcls-guard.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { fingerprintOf, readSources, codeFiles, RESEARCH_CODE, pinProblem, fingerprint, readPin, E3PCLS_FROM } from '../solver/e3pcls-pin.mjs';
import { RESEARCH_OPTS } from '../solver/research-opts.mjs';
import { PRODUCT_BASELINE } from '../../src/solver/solve.js';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../..');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const src = readSources(), base = fingerprintOf(src);
const edit = (f, from, to) => { assert.ok(src[f].includes(from), `the planted case's anchor is in ${f}: ${from}`); return { ...src, [f]: src[f].replace(from, to) }; };

// what it covers: every file under src/solver (listed independently here) and the research files, each read
{ const walk = rel => readdirSync(join(ROOT, rel)).flatMap(x => { const r = `${rel}/${x}`; return statSync(join(ROOT, r)).isDirectory() ? walk(r) : [r]; });
  const solver = walk('src/solver'), files = codeFiles();
  ok(solver.length >= 7 && solver.every(f => files.includes(f)) && RESEARCH_CODE.every(f => files.includes(f)) && files.length === solver.length + RESEARCH_CODE.length,
    `the fingerprint covers all ${solver.length} files under src/solver and the ${RESEARCH_CODE.length} research files (${files.length} in all)`);
  ok(Object.keys(src).length === files.length && Object.values(src).every(t => t.length > 0), 'every covered file is read, none empty'); }

ok(fingerprint() === base && fingerprintOf(Object.fromEntries(Object.entries(src).reverse())) === base, 'EDGE: the fingerprint is the same on a second read and in reversed key order');
ok(fingerprintOf(edit('src/solver/fast.js', 'if (c) yr.dep[CATS.indexOf(c)][t] += x.amount;', 'if (c) yr.dep[CATS.indexOf(c)][Math.min(T, t + 1)] += x.amount;')) !== base, "planted (the plan-auditor, 8 Oct): a dated deposit booked a year later moves the fingerprint (the narrower fingerprint missed it)");
ok(fingerprintOf(edit('src/solver/fast.js', 'if (c && x.fromId === idOf.other) yr.drip', 'if (c) yr.drip')) !== base, "planted (the plan-auditor): the drip source's test dropped moves the fingerprint");
ok(fingerprintOf(edit('src/solver/fast.js', '  if (working) {', '  if (working || a.contribute) {')) !== base, 'planted (the deep review): the contribution gate widened to an owner not working moves the fingerprint');
ok(fingerprintOf(edit('src/solver/fast.js', 'if (yr.working[t]) CATS.forEach', 'CATS.forEach')) !== base, "planted (the deep review): the schedule's working test removed moves the fingerprint");
ok(fingerprintOf(edit('src/solver/fast.js', 'yr.working[t] = age < o.retireAge ? 1 : 0;', 'yr.working[t] = age <= o.retireAge ? 1 : 0;')) !== base, 'planted (the deep review): the retirement test made <= moves the fingerprint');
ok(fingerprintOf(edit('src/solver/fast.js', 'const CATS = ', '// a comment\nconst CATS = ')) !== base, 'planted: a comment added moves the fingerprint (every solver change)');
ok(fingerprintOf(edit('src/solver/fast.js', 'addGia(co); cash += cc;', 'addGia(co);  cash += cc;')) !== base, 'planted: spacing changed moves the fingerprint');
ok(fingerprintOf(edit('research/solver/candidate.mjs', 'export function solveCandidate', '// x\nexport function solveCandidate')) !== base, "planted: an edit to candidate.mjs moves the fingerprint");
ok(fingerprintOf(edit('research/solver/e2-worker.mjs', 'import', '// x\nimport')) !== base, "planted: an edit to e2-worker.mjs moves the fingerprint");
ok(fingerprintOf({ ...src, 'src/solver/extra.js': 'export const pen = 1;' }) !== base, 'planted: a file added moves the fingerprint');
{ const { ['src/solver/reader.js']: _, ...rest } = src; ok(fingerprintOf(rest) !== base, 'planted: a file removed moves the fingerprint'); }
ok(fingerprintOf({ a: 'xy', b: 'z' }) !== fingerprintOf({ a: 'x', b: 'yz' }), 'EDGE: text moved across a file boundary moves the fingerprint');

{ const dir = mkdtempSync(join(tmpdir(), 'e3pin-')), f = join(dir, 'pin.json');
  try {
    ok(/no e3pcls pin/.test(pinProblem(undefined, f)), 'planted: no pin file reads as no pin');
    writeFileSync(f, JSON.stringify({ fingerprint: '0000000000000000', at: 'x' }));
    ok(/stale/.test(pinProblem(undefined, f)), 'planted: a pin of other code reads as stale');
    writeFileSync(f, JSON.stringify({ fingerprint: fingerprint(), at: 'x' }));
    ok(pinProblem(undefined, f) === null, 'a pin of this code reads as matching');
  } finally { rmSync(dir, { recursive: true, force: true }); } }

// solveCandidate's check, on a stale pin: it must refuse before solving (the plan is never touched)
{ const C = await import('../solver/candidate.mjs');
  let msg = '';
  try { C.solveCandidate(null, null, null, { e3pcls: true, e3pclsPinFile: join(tmpdir(), 'no-such-e3pcls-pin.json') }); } catch (e) { msg = String(e.message); }
  ok(/e3pcls pin/.test(msg), `planted: solveCandidate refuses e3pcls without a matching pin, before any solve (${msg.slice(0, 60)})`);
  const { solveSplit } = await import('../solver/e2.mjs');
  let m2 = ''; try { await solveSplit(null, null, null, { e3pcls: true, e3pclsPinFile: join(tmpdir(), 'no-such-e3pcls-pin.json') }, 4); } catch (e) { m2 = String(e.message); }
  ok(/e3pcls pin/.test(m2), `planted (the review): solveSplit refuses e3pcls without a matching pin, before any worker starts (${m2.slice(0, 60)})`);
  let m3 = ''; try { await solveSplit(null, null, null, { e3pcls: true, e3pclsPinFile: join(tmpdir(), 'no-such-e3pcls-pin.json') }, 1); } catch (e) { m3 = String(e.message); }
  ok(/e3pcls pin/.test(m3), `EDGE: solveSplit at one part (solvePlan directly) refuses too (${m3.slice(0, 40)})`); }

// the pinning flag's scope, and new scripts that solve directly
{ const SOL = join(HERE, '../solver'), files = [...readdirSync(SOL).filter(f => f.endsWith('.mjs')).map(f => join(SOL, f)), ...readdirSync(HERE).filter(f => f.endsWith('.mjs') && f !== 'e3pcls-guard.test.mjs').map(f => join(HERE, f))];
  const flagged = files.filter(f => !/(solver-e3pcls\.test|e3pcls-pin|candidate|e2)\.mjs$/.test(f) && readFileSync(f, 'utf8').includes('e3pclsPinning'));
  ok(flagged.length === 0, `the pinning flag appears only in the identity test and the guard's own code (${flagged.length} other files)`);
  const unguarded = text => /solvePlan\(/.test(text) && /\b(CANDIDATE_OPTS|RESEARCH_OPTS)\b/.test(text) && !/checkE3pclsPin/.test(text) && !/e3pcls: false/.test(text);
  ok(unguarded("import { CANDIDATE_OPTS } from './candidate.mjs';\nconst r = solvePlan(E, M, plan, { ...CANDIDATE_OPTS });"), 'planted: a script calling solvePlan with CANDIDATE_OPTS and no checkE3pclsPin is caught');
  ok(!unguarded("const o = { ...CANDIDATE_OPTS }; checkE3pclsPin(o); solvePlan(E, M, plan, o);"), 'EDGE: the same script with the check passes');
  // when each research/solver and research/tests script was first committed, from one git call (an uncommitted script
  // counts as new); both folders, since the three known direct callers are tests (the plan-auditor, 8 Oct, MINOR 2)
  const since = Date.parse(E3PCLS_FROM), addedAt = new Map();
  try { let at = null; for (const l of execFileSync('git', ['log', '--diff-filter=A', '--name-only', '--format=@%cI', '--', 'research/solver', 'research/tests'], { cwd: join(HERE, '../..'), maxBuffer: 1 << 26 }).toString().split('\n')) { if (l.startsWith('@')) at = Date.parse(l.slice(1)); else if (l.trim()) addedAt.set(l.trim(), at); } } catch { /* no git: every script counts as new */ }
  const added = f => { const k = (f.includes('/solver/') ? 'research/solver/' : 'research/tests/') + f.split('/').pop(); return addedAt.has(k) ? addedAt.get(k) : Date.now(); };
  ok(added(join(HERE, 'no-such-new.test.mjs')) >= since && added(join(HERE, 'e2.test.mjs')) < since, 'EDGE: an uncommitted test counts as new, an old test as old (the dates read for research/tests too)');
  const late = files.filter(f => added(f) >= since && unguarded(readFileSync(f, 'utf8')));
  ok(late.length === 0, `no research script or test first committed from ${E3PCLS_FROM} solves with the candidate's options unguarded (${late.map(f => f.split('/').pop()).join(', ') || 'none'})`);
  // the three older scripts that call solvePlan themselves with those options (the plan-auditor, 8 Oct, MINOR 3)
  const OLDER = ['solver-q-tsj.test.mjs', 'e3-default.test.mjs', 'e2.test.mjs'], text = f => readFileSync(join(HERE, f), 'utf8');
  ok(OLDER.every(f => /solvePlan\(/.test(text(f)) && /\b(CANDIDATE_OPTS|RESEARCH_OPTS)\b/.test(text(f))) && OLDER.every(f => /checkE3pclsPin\(/.test(text(f))), `the three older direct callers check the pin themselves (${OLDER.join(', ')})`); }

// the default and its record: the code's settings against PLAN.md's decided-defaults block, both ways
const defaultsProblems = (D, research, product) => [
  D.e3pclsResearch !== true && 'the block does not record e3pclsResearch: true (the 7 Oct 22:50 decision)',
  research.e3pcls !== D.e3pclsResearch && `RESEARCH_OPTS.e3pcls ${research.e3pcls} against the block's e3pclsResearch ${D.e3pclsResearch}`,
  (product.e3pcls === true) !== (D.e3pcls === true) && `PRODUCT_BASELINE.e3pcls ${product.e3pcls} against the block's e3pcls ${D.e3pcls}`,
  typeof D.e3pcls !== 'boolean' && "the block has no product key e3pcls"
].filter(Boolean);
{ const plan = readFileSync(join(HERE, '../solver/PLAN.md'), 'utf8'), m = /<!-- decided-defaults([\s\S]*?)-->/.exec(plan), D = JSON.parse(m[1]);
  const got = defaultsProblems(D, RESEARCH_OPTS, PRODUCT_BASELINE);
  ok(got.length === 0, `RESEARCH_OPTS (e3pcls ${RESEARCH_OPTS.e3pcls}) and PRODUCT_BASELINE (e3pcls ${PRODUCT_BASELINE.e3pcls}) agree with the decided-defaults block (e3pclsResearch ${D.e3pclsResearch}, e3pcls ${D.e3pcls})${got.length ? `: ${got.join('; ')}` : ''}`);
  ok(defaultsProblems({ ...D, e3pclsResearch: false }, { ...RESEARCH_OPTS, e3pcls: false }, PRODUCT_BASELINE).length > 0, 'planted: the block and RESEARCH_OPTS both off fails (the decision is on)');
  ok(defaultsProblems(D, { ...RESEARCH_OPTS, e3pcls: false }, PRODUCT_BASELINE).length > 0, 'planted: RESEARCH_OPTS without e3pcls against the block fails');
  ok(defaultsProblems(D, RESEARCH_OPTS, { ...PRODUCT_BASELINE, e3pcls: true }).length > 0, 'planted: PRODUCT_BASELINE carrying e3pcls against the block fails');
  ok(defaultsProblems({ ...D, e3pcls: true }, RESEARCH_OPTS, PRODUCT_BASELINE).length > 0, "planted: the block's product key on against the product's code fails");
  const { e3pcls: _, ...noKey } = D;
  ok(defaultsProblems(noKey, RESEARCH_OPTS, PRODUCT_BASELINE).length > 0, "planted: the block missing its product key fails"); }
{ const pin = readPin();
  ok(!!pin && pin.fingerprint === fingerprint(), `the committed pin matches the code (${pin ? pin.fingerprint : 'none'})`); }

console.log(`\n${n} passed`);
