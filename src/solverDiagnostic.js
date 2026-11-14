/*
 * THE DIAGNOSTIC (Phase 12 item 4; the launch plan's F17: "the obvious diagnostic would leak amounts"). The text a visitor can
 * copy into a bug report from the new planner (the failure card, and Details' solver settings). The feedback link opens a public,
 * permanent issue (src/Shell.jsx FEEDBACK_URL), and the solve's record holds amounts (its meta.resilienceAt is the opening
 * wealth), so the text is built from a whitelist of fields, never from the record or the plan whole:
 *   the code that solved (the solver worker's module-graph key, vite-plugin-solver-code.js), the key's hash (its first 16 of 64
 *   hex digits: it names the solve, and an amount cannot be read back from it), the levers' positions (the dial, the aims'
 *   words, the limits' words and ages, the floor as a share of the target), the grid (wealth points and paths), the times
 *   (seconds, and whether restored from the store), whether it completed, the error's text with every number of 100 or more
 *   taken out, the browser's name and version, whether the page was cross-origin isolated, and the parts the solve was split into.
 * Each field's value is checked against the form it may take; anything else is written as "other".
 * research/tests/solver-diagnostic.test.mjs plants amounts in the record, the plan and the error, and finds none in the text.
 */
import { PLANNER_PLANT } from './plannerPlant.js';

const DIAL = [1, 3, 6, 10];
const WORD = /^[a-z][a-zA-Z]{0,19}$/;
const TIERS = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
const word = v => (v === undefined || v === null ? 'default' : typeof v === 'string' && WORD.test(v) ? v : 'other');
const age = v => (v === undefined || v === null ? 'none' : Number.isInteger(v) && v >= 0 && v <= 120 ? String(v) : 'other');
const tier = v => (v === undefined || v === null ? 'none' : TIERS.includes(v) ? v : 'other');
// a couple's partner's own ceilings (Part D, D5: the limits per person), where the plan carries them
const partCeilings = locks => (locks.tierCeilingPart && typeof locks.tierCeilingPart === 'object' ? `, partner's pension ceiling ${tier(locks.tierCeilingPart.pen)}, partner's ISA ceiling ${tier(locks.tierCeilingPart.isa)}` : '');
const secs = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e5 ? `${v.toFixed(1)}s` : 'none');
// a number of 100 or more, written any way (1234, 1,234, 1234.56, 1.2e5), is taken out of the error's text: an amount never
// reaches it, while a year, an age or a count under 100 that says what failed is kept
export const redact = s => String(s).slice(0, 300).replace(/\d+(?:[,_]\d{3})*(?:\.\d+)?(?:e[+-]?\d+)?/gi, m => {
  const n = Number(m.replace(/[,_]/g, ''));
  return Number.isFinite(n) && Math.abs(n) < 100 && !/[,_]/.test(m) ? m : '#';
});
const BROWSERS = [['Edg', 'Edge'], ['OPR', 'Opera'], ['FxiOS', 'Firefox (iOS)'], ['CriOS', 'Chrome (iOS)'], ['Firefox', 'Firefox'], ['Chrome', 'Chrome']];
const browserOf = ua => {
  const s = String(ua || '');
  const os = /iPhone|iPad/.test(s) ? 'iOS' : /Android/.test(s) ? 'Android' : /Mac OS X/.test(s) ? 'macOS' : /Windows/.test(s) ? 'Windows' : /Linux/.test(s) ? 'Linux' : 'other';
  for (const [tok, name] of BROWSERS) { const m = new RegExp(`${tok}/(\\d+)`).exec(s); if (m) return `${name} ${m[1]} on ${os}`; }
  const v = /Version\/(\d+)[^ ]* .*Safari\//.exec(s);
  return v ? `Safari ${v[1]} on ${os}` : `other on ${os}`;
};

/*
 * the diagnostic's fields, in order, from what the page holds: solve (useSolver's state: solveState, key, solveMeta), plan (for
 * its levers only), points and paths (the grid), ua (navigator.userAgent), isolated (crossOriginIsolated)
 */
export function diagnosticFields({ solve = null, plan = null, points = null, paths = null, ua = '', isolated = false } = {}) {
  const m = (solve && solve.solveMeta) || {};
  const aims = (plan && plan.solver && plan.solver.aims) || {}, locks = (plan && plan.solver && plan.solver.locks) || {};
  const sp = (plan && plan.spending) || {}, target = Number(sp.targetSpend), floor = Number(sp.floorSpend);
  const ceil = locks.tierCeiling || {};
  return [
    ['code', typeof m.code === 'string' && /^solver-code:[0-9a-f]{16}$/.test(m.code) ? m.code : 'unknown'],
    ['key', solve && typeof solve.key === 'string' && /^[0-9a-f]{64}$/.test(solve.key) ? solve.key.slice(0, 16) : 'none'],
    ['state', word(solve && solve.solveState)],
    ['completed', solve && solve.solveState === 'solved' && !m.error ? 'yes' : 'no'],
    ['dial', DIAL.includes(aims.cuts) ? String(aims.cuts) : aims.cuts === undefined ? '1 (default)' : 'other'],
    ['aims', `estate ${word(aims.estate)}, raises ${word(aims.raises)}, risk consent ${aims.riskConsent === false ? 'no' : 'yes'}`],
    ['limits', `pension before ${age(locks.pensionBefore)}, pension ceiling ${tier(ceil.pen)}, ISA ceiling ${tier(ceil.isa)}${partCeilings(locks)}, lump sum ${word(locks.lumpSum)}`],
    ['floor', target > 0 && floor > 0 ? `${Math.round(100 * floor / target)}% of the target` : 'the default'],
    ['grid', `${Number.isInteger(points) && points > 0 && points < 1000 ? points : 'other'} wealth points, ${Number.isInteger(paths) && paths > 0 && paths < 1e6 ? paths : 'other'} paths`],
    ['times', `solve ${secs(m.secs)}${m.restored === true ? ', restored from the store' : m.restored === 'held' ? ', held' : ''}`],
    ['parts', Number.isInteger(m.parts) && m.parts > 0 && m.parts < 100 ? String(m.parts) : 'none'],
    ['isolated', isolated ? 'yes' : 'no'],
    ['browser', browserOf(ua)],
    ['error', m.error ? redact(m.error) : 'none'],
  ];
}

/* the text to copy: one field a line; the plant 'diagwhole' (solver-diagnostic.test.mjs only) appends the record whole */
export function diagnosticText(input = {}) {
  const lines = diagnosticFields(input).map(([k, v]) => `${k}: ${v}`);
  if (PLANNER_PLANT.has('diagwhole') || DIAG_PLANT.rule === 'whole') lines.push(`record: ${JSON.stringify(input.solve)}`);
  return ['The new planner (beta): details for a bug report. No amounts are included.', ...lines].join('\n');
}
export const DIAG_PLANT = { rule: '' };   // research/tests/solver-diagnostic.test.mjs only: 'whole' appends the record whole
