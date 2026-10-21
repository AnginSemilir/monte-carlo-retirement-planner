/*
 * 7U-F'S AUDIT CHECKS, apart so a test can plant each fault (research/tests/audit-7uf-checks.test.mjs; the design review of
 * 21 Oct, MINORs 3 and 4). audit-7uf.mjs refuses a unit (exit 3) on any problem these return.
 *   WANT, armProblems    the settings each arm must have run, read from the solve's own record
 *   latticeProblem       a built adaptive lattice is the candidate's; a reader that reads bridge years built one
 *   ctxKey, ctxProblem   the engine's context against the solver's, every field but the policy's own, Maps and Sets
 *                        written out (JSON writes them as {}, which hid five fields)
 *   planHash             the plan an arm solved, as a hash the read compares across the arms of a household
 */
import { createHash } from 'node:crypto';

export const WANT = Object.freeze({
  CAND: { bridgeRead: 'reader', tierState: true, jointWorlds: true, bridgeStep: 'exact', switchMargin: 0, switchCharge: 0.001, e3: true, e3pcls: true, pclsInterp: true, readerRef: 'adaptive', readerSplit: 'rs' },
  DECOMP: { bridgeRead: 'reader', tierState: true, jointWorlds: true, bridgeStep: 'exact', switchMargin: 0, switchCharge: 0.001, e3: true, e3pcls: true, pclsInterp: true, readerRef: null, readerSplit: 'rs' },
  SHIP: { bridgeRead: false, tierState: false, jointWorlds: false, bridgeStep: null, switchMargin: 0.001, switchCharge: 0, e3: false, e3pcls: false, pclsInterp: false, readerRef: null, readerSplit: null }
});
export const gotOf = r => ({ bridgeRead: r.meta.bridgeRead, tierState: !!r.meta.tierState, jointWorlds: !!r.meta.jointWorlds, bridgeStep: r.meta.bridgeStep || null, switchMargin: r.switchMargin, switchCharge: r.switchCharge || 0, e3: !!r.meta.e3, e3pcls: !!r.meta.e3pcls, pclsInterp: !!r.g.pclsInterp, readerRef: r.meta.readerRef || null, readerSplit: r.meta.readerSplit || null });
export function armProblems(arm, got, weightRan, W) {
  const out = Object.entries(WANT[arm]).filter(([k, v]) => got[k] !== v).map(([k, v]) => `ran ${k} ${got[k]}, not ${v}`);
  if (!(Math.abs(weightRan - W) < 1e-12)) out.push(`ran the estate weight ${weightRan}, not ${W}`);
  return out;
}
export function latticeProblem(arm, want, la, readerYears) {
  if (arm !== 'CAND') return null;
  if (la && Object.keys(want).some(k => la[k] !== want[k])) return `built an adaptive lattice not the candidate's (${JSON.stringify(la)})`;
  if (!la && readerYears > 0) return `the reader reads ${readerYears} bridge years but the adaptive reference was never built`;
  return null;
}
const SKIP = new Set(['plan', 'warnings', 'policyOverride', 'policyKey']);
const replacer = (k, v) => (v instanceof Map ? { Map: [...v.entries()] } : v instanceof Set ? { Set: [...v] } : v);
export const ctxKey = ctx => JSON.stringify(Object.keys(ctx).filter(k => !SKIP.has(k)).sort().map(k => [k, ctx[k]]), replacer);
export function ctxProblem(ctxEngine, ctxSolver) {
  if (ctxKey(ctxEngine) === ctxKey(ctxSolver)) return null;
  const k = Object.keys(ctxSolver).find(x => !SKIP.has(x) && JSON.stringify(ctxEngine[x], replacer) !== JSON.stringify(ctxSolver[x], replacer)) || Object.keys(ctxEngine).find(x => !SKIP.has(x) && !(x in ctxSolver));
  return `the engine's context differs from the solver's (first: ${k})`;
}
export const planHash = ctx => createHash('sha256').update(ctxKey(ctx)).digest('hex').slice(0, 12);
