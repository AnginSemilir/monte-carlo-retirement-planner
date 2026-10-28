/*
 * THE TEST RUNNER (the external review of 21 Oct, Part B Step 3: "the test runner fails unless every test file ran"; the
 * suite once stopped at file 41 of 82 for eleven days unseen). Runs each test file of a tier as its own process, records
 * every exit, prints one line a file and a summary, and exits 1 unless every file it found ran to exit 0.
 *   node research/tests/run-all.mjs fast [-j N]   the verification suite: the pre-commit hook (on a code change) and CI
 *   node research/tests/run-all.mjs all [-j N]    every *.test.mjs in research/tests (some take half an hour)
 *   node research/tests/run-all.mjs --list        the fast tier's files
 * Run from the repository root after `python3 research/build-engine.py`. A file in FAST that does not exist is a failure,
 * not a skip. Adding a test here protects it: the pre-tool hook refuses edits to every file FAST names.
 */
import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// the verification suite: V1 and V2 (Part B Step 5), the product-path defects' tests (Step 1), the checks' own tests and
// the engine's quick unit tests; about ten minutes on four cores (24 Oct), most of it solver-invariants, V2's state check and
// N4's lockstep (n4-menu.test.mjs, its quick form; added on the maintainer's unlock of 24 Oct); the third tier step's and the
// speed port's (tier-steps.test.mjs, speed-port.test.mjs, their quick forms; added on the maintainer's unlock of 26 Oct);
// the engine's Bed & SIPP relief and Phase 4's audit guards (bed-sipp.test.mjs, phase4-audit.test.mjs; added on the
// maintainer's unlock of 28 Oct, once Phase 4's units were in)
export const FAST = [
  'solver-invariants.test.mjs', 'known-answer.test.mjs', 'engine-fidelity.test.mjs', 'solver-carry.test.mjs', 'tier-above.test.mjs', 'tax-2026.test.mjs', 'table-guards.test.mjs',
  'final-integral.test.mjs', 'check-state.test.mjs', 'hooks.test.mjs', 'fair-gate.test.mjs', 'plan-defaults.test.mjs',
  'e3pcls-guard.test.mjs', 'scottax.test.mjs', 'savings-tax.test.mjs', 'bridge.test.mjs', 'cf.test.mjs', 'diff.test.mjs',
  'entrants.test.mjs', 'guardrails.test.mjs', 'inheritance.test.mjs', 'lookahead.test.mjs', 'pctband.test.mjs',
  'policy.test.mjs', 'priorities.test.mjs', 'salarygrowth.test.mjs', 'settings.test.mjs', 'reader.test.mjs', 'hygiene.test.mjs', 'reduce-7uf.test.mjs', 'check-prediction.test.mjs', 'solver-cash.test.mjs', 'audit-7uf-checks.test.mjs', 'solver-guards.test.mjs', 'state-check.test.mjs', 'solver-scratch.test.mjs', 'solver-memo.test.mjs', 'adaptive-dup.test.mjs', 'chooser-share.test.mjs', 'n4-menu.test.mjs', 'tier-steps.test.mjs', 'speed-port.test.mjs',
  'bed-sipp.test.mjs', 'phase4-audit.test.mjs'
];

// run only as the script, never on import (hygiene.test.mjs imports FAST: unguarded, the import ran the suite, which ran
// hygiene.test.mjs, which imported it again)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--list') { FAST.forEach(f => console.log(f)); process.exit(0); }
  const tier = args[0] || 'fast', jAt = args.indexOf('-j'), J = jAt >= 0 ? Math.max(1, Number(args[jAt + 1]) || 1) : 1;
  const files = tier === 'all' ? readdirSync(HERE).filter(f => f.endsWith('.test.mjs')).sort() : tier === 'fast' ? FAST : null;
  if (!files) { console.error(`run-all: unknown tier ${tier} (fast, all)`); process.exit(2); }

  const results = [];
  const runOne = f => new Promise(res => {
    const t0 = Date.now();
    if (!existsSync(join(HERE, f))) { results.push({ f, code: 'missing', secs: 0, tail: '' }); return res(); }
    const p = spawn(process.execPath, [join(HERE, f)], { cwd: join(HERE, '../..'), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', d => { out = (out + d).slice(-4000); }); p.stderr.on('data', d => { out = (out + d).slice(-4000); });
    p.on('close', code => {
      const r = { f, code, secs: Math.round((Date.now() - t0) / 1000), tail: out.trim().split('\n').slice(-3).join(' | ') };
      results.push(r);
      console.log(`${code === 0 ? 'ok  ' : 'FAIL'} ${f} (${r.secs} s)${code === 0 ? '' : `: ${r.tail.slice(0, 300)}`}`);
      res();
    });
  });
  const queue = [...files];
  await Promise.all(Array.from({ length: Math.min(J, queue.length) }, async () => { while (queue.length) await runOne(queue.shift()); }));
  const bad = results.filter(r => r.code !== 0);
  console.log(`run-all ${tier}: ${files.length} files found, ${results.length} run, ${results.length - bad.length} passed${bad.length ? `, FAILED: ${bad.map(r => `${r.f} (${r.code})`).join(', ')}` : ''}`);
  process.exit(bad.length === 0 && results.length === files.length ? 0 : 1);
}
