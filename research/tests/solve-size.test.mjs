/*
 * solve()'s BYTECODE UNDER V8's OPTIMISER LIMIT (STATE.md D48; the external review of 30 Oct, its ez/solve-size.mjs on
 * review/external-2026-10-21 at 7f492a7). V8 leaves a function whose bytecode is over --max-optimized-bytecode-size (61,440
 * bytes in Node 22) to its baseline tier: TurboFan never compiles it, so its loops run unoptimised, and solve() in
 * src/solver/solve.js holds the whole backward pass. Research options therefore live in helpers at the file's end
 * (ageWeighted, lockSetup, researchFinish, lockMask), and this check holds solve() under the limit:
 *   1. solve()'s bytecode, compiled by a call that stops at once (the model's prepare throws), is at most the limit;
 *   2. planted: a copy of src/solver with dead statements added inside solve() past the limit fails the same check.
 *   node research/tests/solve-size.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let passed = 0, failed = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (c) passed++; else failed++; };

const LIMIT = Number((execFileSync(process.execPath, ['--v8-options']).toString().match(/--max-optimized-bytecode-size=(\d+)/) || [])[1]);
const scratch = mkdtempSync(join(tmpdir(), 'solve-size-'));
writeFileSync(join(scratch, 'compile.mjs'), `import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL(resolve(process.argv[2], 'src/solver/solve.js')).href);
try { S.solve(null, { prepare: () => { throw new Error('stop'); } }, null, {}); } catch (e) {}\n`);
// solve()'s bytecode length on the code at `root` (its src/solver)
const bytecodeOf = root => {
  const out = execFileSync(process.execPath, ['--print-bytecode', '--print-bytecode-filter=solve', join(scratch, 'compile.mjs'), root], { maxBuffer: 1 << 30 }).toString();
  const m = out.match(/Bytecode length: (\d+)/);
  if (!m) throw new Error(`solve-size: no bytecode printed for solve() under ${root}`);
  return Number(m[1]);
};
const under = len => Number.isFinite(len) && len <= LIMIT;

try {
  ok(LIMIT > 0, `V8's --max-optimized-bytecode-size read: ${LIMIT} bytes (Node ${process.version})`);
  const len = bytecodeOf(ROOT);
  ok(under(len), `1. solve()'s bytecode ${len} bytes against the limit ${LIMIT}: ${under(len) ? `${LIMIT - len} under` : `${len - LIMIT} OVER (move the new code into a helper at the file's end)`}`);
  // 2. the plant: src/solver copied, solve() given dead statements worth more than its headroom
  const plantRoot = join(scratch, 'plant'), dir = join(plantRoot, 'src', 'solver');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(join(ROOT, 'src', 'solver')).filter(x => x.endsWith('.js'))) writeFileSync(join(dir, f), readFileSync(join(ROOT, 'src', 'solver', f)));
  const head = 'export function solve(E, M, plan, opts = {}) {\n', src = readFileSync(join(dir, 'solve.js'), 'utf8');
  if (!src.includes(head)) throw new Error('solve-size: solve()\'s first line is not where the plant expects it');
  const n = Math.max(200, Math.ceil((LIMIT - len) / 4) + 200);
  const dead = `  if (opts.__sizePlant) { let q = 0;\n${Array.from({ length: n }, (_, i) => `    q = q * 7 + ${i};`).join('\n')}\n    opts.__sizePlant = q; }\n`;
  writeFileSync(join(dir, 'solve.js'), src.replace(head, head + dead));
  const lenP = bytecodeOf(plantRoot);
  ok(!under(lenP), `2. planted: ${n} dead statements inside solve() take it to ${lenP} bytes, ${lenP - LIMIT} over the limit, and the check fails`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
console.log(failed ? `FAILED: ${failed} of ${passed + failed} checks` : `ALL PASS: ${passed} checks`);
process.exit(failed ? 1 : 0);
