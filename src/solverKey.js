/*
 * WHAT A SOLVE DEPENDS ON, AS ONE KEY (Part C Phase 7b, research/solver/PHASE-7.md). The tables are a function of three
 * things: the plan as the solver takes it (prepareForSolve: normalised, the MPAA resolved, guardrails and the lookahead off),
 * the settings (the candidate, lambda, the wealth points), and the code that solves (the engine and the solver). The key is
 * the SHA-256 of the three, the plan and settings written with their keys sorted, so the same plan always gives the same key
 * however its fields arrived. The same key, the same tables; any other edit, a new solve. There is no "balance-only" edit
 * that keeps them: the objective weighs the estate against the opening wealth (solve.js, `scale`), and the bridge reader
 * and the cash buffer read the opening balances too, so every balance moves the tables (solver-cache.test.mjs shows it).
 */
import { prepareForSolve, APP_CANDIDATE, APP_LAMBDA, APP_POINTS } from './solverSettings.js';

const canonical = v => {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
};
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/* the key of a solve: `code` names the code that solves it (the worker chunk's fingerprinted URL in a build) */
export async function solveKey(E, plan, { lambda = APP_LAMBDA, points = APP_POINTS, research = null } = {}, code = '') {
  const body = canonical({ plan: prepareForSolve(E, plan), settings: { candidate: APP_CANDIDATE, lambda, points, research }, code });
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)));
}
export { canonical };
