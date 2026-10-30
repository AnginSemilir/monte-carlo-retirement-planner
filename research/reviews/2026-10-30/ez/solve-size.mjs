/*
 * THE SOLVER FUNCTION'S SIZE AGAINST V8'S OPTIMISER LIMIT (EXPLORATORY; the external review, 30 Oct). V8 leaves a function
 * whose bytecode is over --max-optimized-bytecode-size (61,440 bytes in this Node) to its baseline tier: TurboFan never
 * compiles it, so its loops run unoptimised. solve() in src/solver/solve.js holds the whole backward pass, so the limit is
 * the solve's speed. For each code root given: solve()'s bytecode length, and with --time one light solve (S090, 4 wealth
 * points, a small reference lattice, e3pcls off) at the default limit and, beside it, with the limit raised.
 *   node solve-size.mjs [--time] <root>...      (prints its own output; results-solve-size.txt)
 */
import { execFileSync } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
const args = process.argv.slice(2), TIME = args.includes('--time'), roots = args.filter(x => !x.startsWith('--')).map(x => resolve(x));
const dir = mkdtempSync(join(tmpdir(), 'solve-size-'));
// a call that compiles solve()'s bytecode and stops at once (the model's prepare throws)
writeFileSync(join(dir, 'compile.mjs'), `import { resolve } from 'path'; import { pathToFileURL } from 'url';
const S = await import(pathToFileURL(resolve(process.cwd(), 'src/solver/solve.js')).href);
try { S.solve(null, { prepare: () => { throw new Error('stop'); } }, null, {}); } catch (e) {}\n`);
writeFileSync(join(dir, 'time.mjs'), `import { resolve } from 'path'; import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs'), { solverPlanOf, LAMBDA } = await imp('research/solver/audit-phase4.mjs');
const h = readPanel().find(x => x.id === 'S090');
const sp = solverPlanOf(h.plan, { decumulationPolicy: 'Bracket Fill Basic' }), plan = E.resolveMpaa(E.normalizePlan({ ...sp, config: { ...sp.config, guardrails: false, lookaheadYears: 0 } }));
const t0 = Date.now(); C.solveCandidate(E, M, plan, { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true }, e3pcls: false });
console.log(((Date.now() - t0) / 1000).toFixed(1));\n`);
const limit = (execFileSync(process.execPath, ['--v8-options']).toString().match(/--max-optimized-bytecode-size=(\d+)/) || [])[1];
console.log(`solve()'s bytecode against V8's --max-optimized-bytecode-size (${limit} bytes in Node ${process.version})`);
for (const root of roots) {
  const head = (() => { try { return execFileSync('git', ['log', '--oneline', '-1'], { cwd: root }).toString().trim().slice(0, 7); } catch (e) { return '?'; } })();
  const dirty = (() => { try { return execFileSync('git', ['status', '--short', 'src/solver'], { cwd: root }).toString().trim() ? ' with changes' : ''; } catch (e) { return ''; } })();
  const out = execFileSync(process.execPath, ['--print-bytecode', '--print-bytecode-filter=solve', join(dir, 'compile.mjs')], { cwd: root, maxBuffer: 1 << 30 }).toString();
  const len = Number((out.match(/Bytecode length: (\d+)/) || [])[1]);
  let line = `  ${root} (${head}${dirty}): ${len} bytes, ${len <= Number(limit) ? `${Number(limit) - len} under the limit` : `${len - Number(limit)} OVER the limit`}`;
  if (TIME) {
    const t = execFileSync(process.execPath, [join(dir, 'time.mjs')], { cwd: root }).toString().trim();
    const tUp = execFileSync(process.execPath, ['--max-optimized-bytecode-size=300000', join(dir, 'time.mjs')], { cwd: root }).toString().trim();
    line += `; one light solve ${t} s at the default limit, ${tUp} s with it raised to 300,000`;
  }
  console.log(line);
}
