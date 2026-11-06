/*
 * THE READINESS CHECKLIST READS ITS FILES RIGHT (Phase 12 item 5; research/solver/launch-ready.mjs). The full tier.
 *
 * launch-ready.mjs run on a directory of results files written here, stamped as HEAD's code (launch-stamp.mjs stampAt), its CI
 * file naming HEAD's commit:
 *   1. every file as a clean release writes it: all nine lines PASS, exit 0;
 *   2. each fault planted in one file fails exactly its own lines, exit 1:
 *        gatered    the new mode's gate with solver-planner failing      lines 1, 8 and 9
 *        cired      the Full tier failed on the release commit           line 2
 *        stale      the full-scale solve ran on other code               line 3
 *        sweepfail  the sweep's check 2 failed                           line 4
 *        nobrowser  no Safari and Firefox solve recorded                  line 6
 *        oldfail    the sweep's old exports check failed                 line 7
 *        isofail    the isolation harness failed in the new mode         lines 1 and 8
 *   node research/tests/launch-ready.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { stampAt } = await import('../solver/launch-stamp.mjs');
const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(), STAMP = stampAt(ROOT, HEAD);
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };

const HARN = ['restyle-regression', 'phone', 'phone-perf', 'desktop-reach', 'numbers', 'load-perf', 'sandbox-step', 'simple-extras', 'mc-reveal', 'crossover', 'production-build', 'tradeoffs', 'priorities', 'simple-closecall', 'tournament', 'solver-progress', 'solver-config', 'solver-strategy', 'solver-isolation', 'solver-projection', 'solver-planner'];
const NEW = ['solver-config', 'solver-strategy', 'solver-isolation', 'solver-projection', 'solver-planner'];
const gate = (mode, bad = null) => [`the code: ${STAMP}; the ${mode} planner's mode`, '', 'HARNESS                KIND      RESULT',
  ...HARN.map(h => `${h.padEnd(22)} required  ${h === bad ? 'FAIL (1)' : h === 'phone-perf' || (mode === 'new') === NEW.includes(h) ? 'pass' : `run in the ${mode === 'new' ? 'classic' : 'new'} mode: …`}`),
  '', bad ? 'SOMETHING REQUIRED FAILED' : 'ALL REQUIRED GREEN', ''].join('\n');
const sweep = (bad = 0) => [`the code: ${STAMP}; 210 single households`, ...[1, 2, 3].map(n => `  ${n === bad ? 'FAIL' : 'ok  '} ${n}. the check`), '', `${bad ? 2 : 3} passed, ${bad ? 1 : 0} failed`, ''].join('\n');
const CLEAN = {
  'results-gate-classic.txt': gate('classic'),
  'results-gate-new.txt': gate('new'),
  'results-ci.txt': `CI runs\nVerify run 300 on ${HEAD}: success\nFull run 120 on ${HEAD}: success\n`,
  'results-fullscale.txt': `the code: ${STAMP}; S116\n  the page: solved in 140.2 s, split 4 ways, cross-origin isolated\n  ok    the site as it ships solves S116 at 45 wealth points, its tables Node's bit for bit   x\n  ok    the times recorded\n\nall ok\n`,
  'results-library-sweep.txt': sweep(),
  'results-levers.txt': 'L4\n', 'results-costs.txt': 'L5\n',
  'results-browsers.txt': `the code: ${STAMP}\nSafari 18 on iOS: within the Chromium solve's sampling noise\nFirefox 144 on macOS: within the Chromium solve's sampling noise\n`
};
const PLANTS = {
  gatered: [{ 'results-gate-new.txt': gate('new', 'solver-planner') }, [1, 8, 9]],
  cired: [{ 'results-ci.txt': `CI runs\nVerify run 300 on ${HEAD}: success\nFull run 120 on ${HEAD}: failure\n` }, [2]],
  stale: [{ 'results-fullscale.txt': CLEAN['results-fullscale.txt'].replace(STAMP, 'code-stamp:0000000000000000') }, [3]],
  sweepfail: [{ 'results-library-sweep.txt': sweep(2) }, [4]],
  nobrowser: [{ 'results-browsers.txt': null }, [6]],
  oldfail: [{ 'results-library-sweep.txt': sweep(3) }, [7]],
  isofail: [{ 'results-gate-new.txt': gate('new', 'solver-isolation') }, [1, 8]]
};
const run = files => {
  const dir = mkdtempSync(join(tmpdir(), 'launch-ready-'));
  for (const [f, body] of Object.entries(files)) if (body !== null) writeFileSync(join(dir, f), body);
  let out = '', code = 0;
  try { out = execFileSync(process.execPath, [join(ROOT, 'research/solver/launch-ready.mjs'), '--dir', dir, '--stamp', STAMP], { encoding: 'utf8' }); } catch (e) { out = e.stdout || ''; code = e.status; }
  rmSync(dir, { recursive: true, force: true });
  return { code, fails: out.split('\n').filter(l => l.startsWith('FAIL  ')).map(l => Number(/^FAIL {2}(\d+)\./.exec(l)[1])), out };
};

const clean = run(CLEAN);
ok(1, 'a clean release\'s files: every line PASS, exit 0', clean.code === 0 && clean.fails.length === 0, clean.fails.length ? `failing ${clean.fails.join(', ')}: ${clean.out.split('\n').filter(l => l.startsWith('FAIL')).join(' | ').slice(0, 300)}` : 'all PASS');
for (const [name, [patch, want]] of Object.entries(PLANTS)) {
  const r = run({ ...CLEAN, ...patch });
  ok(2, `planted '${name}': exactly lines ${want.join(', ')} FAIL, exit 1`, r.code === 1 && JSON.stringify(r.fails) === JSON.stringify(want), `failing ${r.fails.join(', ') || 'none'}`);
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
