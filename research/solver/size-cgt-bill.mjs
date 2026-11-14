/*
 * THE COUPLE'S CAPITAL GAINS BILL, SIZED (13 Nov 2026; EXPLORATORY, seed 7002, deciding nothing; the deep review of the
 * couples' read, section 2 (a); research/tests/couple-cgt-bill.test.mjs). The engine before the fix (BEFORE, a tree at the
 * commit before it, its engine built) against this tree's, on the same paths: every couple of the library, the plan as
 * entered on its own rules. For each: survival before and after, the paths saved and lost, and before the fix the paths
 * that fail while the household still holds more than it opened with (the class the fix is for).
 *   BEFORE=<a tree at the commit before the fix> node research/solver/size-cgt-bill.mjs [paths 1000] > research/solver/results-cgt-bill.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../..'), SEED = 7002, N = Number(process.argv[2]) || 1000;
if (!process.env.BEFORE) { console.error('size-cgt-bill: BEFORE=<a tree at the commit before the fix, its engine built>'); process.exit(2); }
const load = async R => ({ E: await import(pathToFileURL(join(R, 'research/engine.mjs')).href), S: await import(pathToFileURL(join(R, 'research/policy-study/scenarios.mjs')).href) });
const commit = R => { try { return execFileSync('git', ['-C', R, 'rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return '?'; } };
const B = await load(process.env.BEFORE), A = await load(ROOT);
const couples = A.S.buildScenarios().filter(s => A.E.normalizePlan(s.plan).demographics.planningMode === 'couple');
console.log(`THE COUPLE'S CAPITAL GAINS BILL, SIZED (EXPLORATORY, seed ${SEED}, ${N} paths, deciding nothing): the engine before the fix (the tree at ${commit(process.env.BEFORE)}) against this tree's; ${couples.length} couples of the library, each plan as entered on its own rules`);
let moved = 0, sumB = 0, sumA = 0, saved = 0, lost = 0, richB = 0, richA = 0, worst = null, best = null;
for (const s of couples) {
  const run = V => { const ctx = V.E.buildContext(V.E.resolveMpaa(V.E.normalizePlan(s.plan))), open = ctx.accounts.reduce((t, a) => t + a.balance, 0); return V.E.pathsForSeed(SEED, N, ctx.totalYears).map(zs => { const q = V.E.runTrial(ctx, Float64Array.from(zs)); return { ok: q.survived, rich: !q.survived && q.terminalPot > open }; }); };
  const b = run(B), a = run(A);
  let sv = 0, ls = 0; for (let i = 0; i < N; i++) { if (a[i].ok && !b[i].ok) sv++; if (!a[i].ok && b[i].ok) ls++; }
  const sb = 100 * b.filter(x => x.ok).length / N, sa = 100 * a.filter(x => x.ok).length / N, rb = b.filter(x => x.rich).length, ra = a.filter(x => x.rich).length;
  sumB += sb; sumA += sa; saved += sv; lost += ls; richB += rb; richA += ra;
  const d = sa - sb; if (!worst || d < worst.d) worst = { id: s.id, d }; if (!best || d > best.d) best = { id: s.id, d };
  if (sv || ls || rb || ra) { moved++; console.log(`  ${s.id.padEnd(6)} survival ${sb.toFixed(1)}% to ${sa.toFixed(1)}% (${sv} saved, ${ls} lost); failing with more than it opened with: ${rb} before, ${ra} after`); }
}
const n = couples.length;
console.log(`${n - moved} of ${n} couples: no path's survival differs and none fails rich under either engine`);
console.log(`pooled: mean survival ${(sumB / n).toFixed(3)}% to ${(sumA / n).toFixed(3)}% (${(sumA / n - sumB / n >= 0 ? '+' : '') + (sumA / n - sumB / n).toFixed(3)} points); ${saved} paths saved, ${lost} lost of ${n * N}; the largest gain ${best.id} ${best.d >= 0 ? '+' : ''}${best.d.toFixed(1)}, the largest loss ${worst.id} ${worst.d >= 0 ? '+' : ''}${worst.d.toFixed(1)}; paths failing with more than the household opened with: ${richB} before, ${richA} after`);
