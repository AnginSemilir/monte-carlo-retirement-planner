/*
 * THE READINESS CHECKLIST READS ITS FILES RIGHT (Phase 12 item 5; research/solver/launch-ready.mjs). The full tier.
 *
 * launch-ready.mjs run on a directory of results files written here, stamped as HEAD's code (launch-stamp.mjs stampAt), its CI
 * file naming HEAD's commit:
 *   1. every file as a clean release writes it: all seven lines PASS, exit 0 (line 8, the switch between the two planners,
 *      retired with the classic planner, D155);
 *   2. each fault planted in one file fails exactly its own lines, exit 1:
 *        gatered    the gate with solver-planner failing                 lines 1 and 7
 *        onepass    the gate's light pass run alone (--new), not the gate  line 1
 *        cired      the Full tier failed on the release commit           line 2
 *        stale      the full-scale solve ran on other code               line 3
 *        sweepfail  the sweep's check 2 failed                           line 4
 *        oldfail    the sweep's old exports check failed                 line 6
 *        isofail    the isolation harness failed                         lines 1 and 7
 *   (Safari and Firefox are not a line since D60.)
 *   3. line 5's record read from STATE.md and its history files (HISTORY-*.md), each case in a directory of its own (--state):
 *        moved      the record in the history file alone, as STATE.md's finished work was moved on 21 Nov   every line PASS
 *                   (on the code before 22 Nov's fix line 5 failed: it read STATE.md alone; CI's full tier on a6b34b2d)
 *        norecord   the record in neither                                                       line 5 FAIL, exit 1
 *   node research/tests/launch-ready.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { stampAt } = await import('../solver/launch-stamp.mjs');
const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(), STAMP = stampAt(ROOT, HEAD);
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };

// the gate's one run (D155): its two passes, each harness's row naming the pass that ran it
const SHIPPED = ['production-build', 'load-perf', 'solver-progress'];
const LIGHT = ['restyle-regression', 'numbers', 'phone', 'desktop-reach', 'phone-perf', 'solver-config', 'solver-strategy', 'solver-isolation', 'solver-projection', 'solver-planner'];
const gate = (bad = null, only = null) => [`the code: ${STAMP}; ${only ? `the ${only} pass alone, not the gate` : 'the gate, both passes'}`, '', 'HARNESS                KIND      PASS     RESULT',
  ...[...SHIPPED.map(h => [h, 'shipped']), ...LIGHT.map(h => [h, 'light'])].map(([h, ps]) => `${h.padEnd(22)} required  ${(only && only !== ps ? '-' : ps).padEnd(8)} ${only && only !== ps ? 'not run: the other pass' : h === bad ? 'FAIL (1)' : 'pass'}`),
  '', bad ? 'SOMETHING REQUIRED FAILED' : only ? `the ${only} pass green: not the gate, which is both passes` : 'ALL REQUIRED GREEN', ''].join('\n');
const sweep = (bad = 0) => [`the code: ${STAMP}; 210 single households`, ...[1, 2, 3].map(n => `  ${n === bad ? 'FAIL' : 'ok  '} ${n}. the check`), '', `${bad ? 2 : 3} passed, ${bad ? 1 : 0} failed`, ''].join('\n');
const CLEAN = {
  'results-gate.txt': gate(),
  'results-ci.txt': `CI runs\nVerify run 300 on ${HEAD}: success\nFull run 120 on ${HEAD}: success\n`,
  'results-fullscale.txt': `the code: ${STAMP}; S116\n  the page: solved in 140.2 s, split 4 ways, cross-origin isolated\n  ok    the site as it ships solves S116 at 45 wealth points, its tables Node's bit for bit   x\n  ok    the times recorded\n\nall ok\n`,
  'results-library-sweep.txt': sweep(),
  'results-levers.txt': 'L4\n', 'results-costs.txt': 'L5\n'
};
const PLANTS = {
  gatered: [{ 'results-gate.txt': gate('solver-planner') }, [1, 7]],
  onepass: [{ 'results-gate.txt': gate(null, 'light') }, [1]],
  cired: [{ 'results-ci.txt': `CI runs\nVerify run 300 on ${HEAD}: success\nFull run 120 on ${HEAD}: failure\n` }, [2]],
  stale: [{ 'results-fullscale.txt': CLEAN['results-fullscale.txt'].replace(STAMP, 'code-stamp:0000000000000000') }, [3]],
  sweepfail: [{ 'results-library-sweep.txt': sweep(2) }, [4]],
  oldfail: [{ 'results-library-sweep.txt': sweep(3) }, [6]],
  isofail: [{ 'results-gate.txt': gate('solver-isolation') }, [1, 7]]
};
const run = (files, records = null) => {
  const dir = mkdtempSync(join(tmpdir(), 'launch-ready-'));
  for (const [f, body] of Object.entries(files)) if (body !== null) writeFileSync(join(dir, f), body);
  // records: line 5's STATE.md and history files, in a directory of their own (unset: the repository's own)
  const sdir = join(dir, 'state'), extra = records ? ['--state', sdir] : [];
  if (records) { mkdirSync(sdir); for (const [f, body] of Object.entries(records)) writeFileSync(join(sdir, f), body); }
  let out = '', code = 0;
  try { out = execFileSync(process.execPath, [join(ROOT, 'research/solver/launch-ready.mjs'), '--dir', dir, '--stamp', STAMP, ...extra], { encoding: 'utf8' }); } catch (e) { out = e.stdout || ''; code = e.status; }
  rmSync(dir, { recursive: true, force: true });
  return { code, fails: out.split('\n').filter(l => l.startsWith('FAIL  ')).map(l => Number(/^FAIL {2}(\d+)\./.exec(l)[1])), out };
};

const clean = run(CLEAN);
ok(1, 'a clean release\'s files: every line PASS, exit 0', clean.code === 0 && clean.fails.length === 0, clean.fails.length ? `failing ${clean.fails.join(', ')}: ${clean.out.split('\n').filter(l => l.startsWith('FAIL')).join(' | ').slice(0, 300)}` : 'all PASS');
for (const [name, [patch, want]] of Object.entries(PLANTS)) {
  const r = run({ ...CLEAN, ...patch });
  ok(2, `planted '${name}': exactly lines ${want.join(', ')} FAIL, exit 1`, r.code === 1 && JSON.stringify(r.fails) === JSON.stringify(want), `failing ${r.fails.join(', ') || 'none'}`);
}
// 3. line 5's record, STATE.md and its history files
{ const rec = '- L4 read (the levers), L5 read (the costs): by R1 B3a ships at 3, 6 and 10; by R3 no cell loses survival.\n';
  const moved = run(CLEAN, { 'STATE.md': '# The solver research: where it stands\n', 'HISTORY-2026-11.md': `# Moved verbatim\n${rec}` });
  ok(3, 'moved: the record in the history file alone, every line PASS, exit 0', moved.code === 0 && moved.fails.length === 0, `failing ${moved.fails.join(', ') || 'none'}`);
  const none = run(CLEAN, { 'STATE.md': '# The solver research: where it stands\n', 'HISTORY-2026-11.md': '# Moved verbatim\n' });
  ok(3, 'planted \'norecord\': the record in neither, exactly line 5 FAIL, exit 1', none.code === 1 && JSON.stringify(none.fails) === '[5]', `failing ${none.fails.join(', ') || 'none'}`); }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
