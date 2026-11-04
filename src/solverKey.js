/*
 * WHAT A SOLVE DEPENDS ON, AS ONE KEY (Part C Phase 7b, research/solver/PHASE-7.md). The tables are a function of three
 * things: the plan as the solver takes it (prepareForSolve: normalised, the MPAA resolved, guardrails and the lookahead off),
 * the settings (the candidate, lambda, the wealth points), and the code that solves (the engine and the solver). The key is
 * the SHA-256 of the three, the plan and settings written with their keys sorted, so the same plan always gives the same key
 * however its fields arrived. The same key, the same tables; any other edit, a new solve. There is no "balance-only" edit
 * that keeps them: the objective weighs the estate against the opening wealth (solve.js, `scale`), and the bridge reader
 * and the cash buffer read the opening balances too, so every balance moves the tables (solver-cache.test.mjs shows it).
 */
import { prepareForSolve, aimsOptions, dialSettings, APP_CANDIDATE, APP_POINTS, APP_DIAL_VARIANT } from './solverSettings.js';
import { PLANNER_PLANT } from './plannerPlant.js';

const canonical = v => {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
};
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/* the key of a solve: `code` names the code that solves it (the worker chunk's fingerprinted URL in a build). The plan carries
 * what the solver aims for (Phase 8); lambda is the dial's unless given, as solveForApp takes it. */
export async function solveKey(E, plan, { lambda = undefined, points = APP_POINTS, research = null, variant = APP_DIAL_VARIANT } = {}, code = '') {
  const p = prepareForSolve(E, plan);
  // a dial position above 1 adds its variant and its lock to the base (step L2); position 1's key is as before
  // step U's plant 'keyguard' (research/ui-harnesses/solver-planner-ui.cjs, check 7): the key made to read the guardrails
  const body = canonical({ plan: p, ...(PLANNER_PLANT.has('keyguard') ? { guardrails: !!(plan && plan.config && plan.config.guardrails) } : {}), settings: { candidate: APP_CANDIDATE, lambda: lambda !== undefined ? lambda : aimsOptions(p, variant).lambda, points, research, ...dialSettings(p, variant) }, code });
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)));
}
export { canonical };
