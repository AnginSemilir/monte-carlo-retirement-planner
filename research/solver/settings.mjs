/*
 * THE EXPERIMENT'S SETTINGS, CHECKED BEFORE ANYTHING RUNS. experiment.mjs reads its knobs from the environment, and
 * a value it did not know used to fall back silently: PLANTIER=Medium became the top tier (the engine maps an unknown
 * tier to 'High Risk'), FAILSHORT=true meant the M17 floor fix off, an unknown BEQSHAPE meant 'cap', an unknown RESIL
 * meant the shortfall term, an unknown SHAREDEAD meant none, and every on/off flag read anything but '1' as off - while
 * the result file recorded the value as typed, so fair-gate (which compares recorded values) could not notice
 * (24 Sep 12:16 UK, the plan-auditor's tenth review). Now an unknown word, flag or number stops the run - including the
 * settings the modules it loads read (grid.js SOLVER_INTERP and SOLVER_CLAMP, fast.js SOLVER_FOLD_K, record.mjs
 * RECORD and STOREPOL; the twelfth review, 12:37 UK).
 *
 *   checkSettings(env)  -> [] when every setting present is valid, else one message per bad setting
 */
import { DEFAULT_RISK_PROFILES } from '../engine.mjs';

export const WORDS = {
  PLANTIER: Object.keys(DEFAULT_RISK_PROFILES),
  FAILSHORT: ['0', '1', 'zero'],
  SHAREDEAD: ['none', 'drop', 'linear'],
  BEQSHAPE: ['cap', 'soft', 'logfloor'],
  RESIL: ['shortfall', 'indicator'],
  TIERS: ['1', 'joint'],   // not '0': experiment.mjs passes any other string through as the tier list
  COORDS: ['total', 'pots'],
  SOLVER_INTERP: ['linear', 'logodds'],   // read by grid.js: anything but 'linear' meant log-odds
  BRIDGEREAD: ['0', '1', '2'],   // F1: off, version 1, version 2
};
export const FLAGS = ['RAISESURV', 'FINALEXACT', 'TERNARY', 'GIATIERS', 'BLOCKTRIM', 'PCLSSTRICT', 'GAININT',
  'SOLVERONLY', 'ARMSONLY', 'RECORD', 'STOREPOL', 'BETAUDIT'];
export const NUMBERS = ['MIX', 'EXP', 'MARGIN', 'RAISE', 'WR', 'WB', 'SHARES', 'SWITCH', 'SEARCH', 'VERIFY', 'DRIFT', 'TIERSABOVE',
  'LAMBDA', 'FLOOR', 'ONLY', 'LO', 'HI', 'QUAD', 'MINPOTYEARS', 'RAISECAP', 'GIAGAIN', 'GUARDCAP', 'ESTATESCALE', 'BISECT',
  'SOLVER_CLAMP', 'SOLVER_FOLD_K', 'BETPOS', 'BETPATHS'];   // the last two read by grid.js and fast.js
export const LISTS = ['LEVELS', 'GAINB'];   // comma-separated numbers
// CONF: a survival level (0.9), a margin over the guardrails' own rate (+5), or 'gkFloor' (the guardrails-with-floor rate)
export const SPECIAL = { CONF: v => v === 'gkFloor' || (/^\+/.test(v) ? Number.isFinite(Number(v.slice(1))) : Number.isFinite(Number(v))) };

export function checkSettings(env = process.env) {
  const bad = [];
  const has = k => env[k] !== undefined && env[k] !== '';
  for (const [k, ok] of Object.entries(WORDS)) if (has(k) && !ok.includes(env[k])) bad.push(`${k}=${JSON.stringify(env[k])} is not one of: ${ok.join(', ')}`);
  for (const k of FLAGS) if (has(k) && !['0', '1'].includes(env[k])) bad.push(`${k}=${JSON.stringify(env[k])} must be 0 or 1`);
  for (const k of NUMBERS) if (has(k) && !Number.isFinite(Number(env[k]))) bad.push(`${k}=${JSON.stringify(env[k])} is not a number`);
  for (const [k, valid] of Object.entries(SPECIAL)) if (has(k) && !valid(env[k])) bad.push(`${k}=${JSON.stringify(env[k])} is not a level, +margin or gkFloor`);
  for (const k of LISTS) if (has(k) && !env[k].split(',').every(x => x.trim() !== '' && Number.isFinite(Number(x)))) bad.push(`${k}=${JSON.stringify(env[k])} is not a comma-separated list of numbers`);
  return bad;
}
