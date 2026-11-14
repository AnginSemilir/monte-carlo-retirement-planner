/*
 * THE DIAGNOSTIC LEAKS NO AMOUNT (Phase 12 item 4; the launch plan's F17: "a diagnostic built from a whitelist of fields, tested
 * with a planted amount"). src/solverDiagnostic.js builds the text a visitor copies into a public bug report from a whitelist; the
 * solve's record and the plan hold amounts (meta.resilienceAt is the opening wealth). The full tier.
 *
 * On S116 solved at light settings (solveForApp), its record as the page holds it (useSolver: solveState, key, solveMeta with the
 * worker's meta, secs, parts, restored and code), with amounts planted where they could leak: a distinctive amount in the meta
 * (resilienceAt), in the plan (its target, its floor, a balance), and in an error's text, each in the ways a figure is written:
 *   1. none of the plan's amounts (every number of 100 or more in it) nor a planted one appears in the text, written as digits,
 *      with commas, to two places, or as thousands ("988k"), on the solved record and on a failed one;
 *   2. every whitelisted field is there, once, in order, and nothing else: code, key, state, completed, dial, aims, limits,
 *      floor, grid, times, parts, isolated, browser, error;
 *   3. the error's text keeps what says what failed (a year, an age, a count under 100) and loses every number of 100 or more,
 *      however it is written (1234, 1,234, 1234.56, 1.2e5);
 *   4. a field whose value is not of its form is written "other": a lever word carrying an amount, an age out of range, a tier
 *      that is not a tier, a key that is not a key's hash, a code that is not the solver's;
 *   5. the floor is a share of the target, the key its first 16 hex digits, the code the solver's module-graph key;
 *   6. a partner's ceilings (Part D, D5: the limits per person) named for a couple's plan, and not for a single's plan carrying
 *      them, which the solver reads as without them (src/solverSettings.js lockedPlan).
 * The plants (DIAG_PLANT): 'whole' (the record appended whole, the obvious diagnostic) fails check 1 and check 2; 'partany' (the
 * partner's ceilings named on any plan) fails check 6.
 *   node research/tests/solver-diagnostic.test.mjs [--plant whole]
 *   node research/tests/solver-diagnostic.test.mjs --plants
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), self = fileURLToPath(import.meta.url);
const PLANTS = { whole: [1, 2], partany: [6] };
if (args[0] === '--plants') {
  let bad = 0;
  for (const [name, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [self, '--plant', name], { encoding: 'utf8' }); } catch (e) { out = e.stdout || ''; }
    const failed = [...new Set(out.split('\n').filter(l => l.startsWith('  FAIL ')).map(l => Number(/^ {2}FAIL (\d+)\./.exec(l)?.[1])))].sort((a, b) => a - b);
    const right = JSON.stringify(failed) === JSON.stringify(want);
    if (!right) bad++;
    console.log(`plant '${name}': checks failing ${failed.join(', ') || 'none'} (its own: ${want.join(', ')}) ${right ? 'ok' : 'WRONG'}`);
  }
  console.log(bad ? `PLANTS: ${bad} of ${Object.keys(PLANTS).length} did not fail exactly their own checks` : `PLANTS: all ${Object.keys(PLANTS).length} fail exactly their own checks`);
  process.exit(bad ? 1 : 0);
}
const PLANT_NAME = args[0] === '--plant' ? args[1] : null;
if (PLANT_NAME && !PLANTS[PLANT_NAME]) { console.log(`no plant '${PLANT_NAME}'`); process.exit(2); }

const E = await import('../engine.mjs');
const M = await import('../../src/solver/model.js');
const { solveForApp } = await import('../../src/solverApp.js');
const { withAims } = await import('../../src/solverSettings.js');
const D = await import('../../src/solverDiagnostic.js');
const { buildScenarios } = await import('../policy-study/scenarios.mjs');
if (PLANT_NAME) D.DIAG_PLANT.rule = PLANT_NAME;

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const PLANTED = 987654.32;   // the planted amount: in the meta, the plan and an error
const base = E.normalizePlan(buildScenarios().find(s => s.id === 'S116').plan);
const plan = withAims({ ...base, spending: { ...base.spending, targetSpend: 52345, floorSpend: 41876 }, solver: { ...(base.solver || {}), aims: { cuts: 3, estate: 'standard' }, locks: { pensionBefore: 60, tierCeiling: { pen: 'Medium Risk', isa: null }, lumpSum: 'never' } } });
const r = solveForApp(E, M, plan, LIGHT);
const meta = JSON.parse(JSON.stringify(r.meta));
meta.resilienceAt = PLANTED;
const KEY = 'a3f9c2e1b7d4058e6c1f2a9b3d7e4c0518f6a2b9c3d7e1f0a4b8c2d6e9f1a3b5';
const solved = { solveState: 'solved', key: KEY, solveMeta: { meta, secs: 153.27, parts: 4, restored: false, code: 'solver-code:0123456789abcdef', key: KEY } };
const failedRec = { solveState: 'idle', key: KEY, solveMeta: { error: `wealth ${PLANTED} below the floor of ${(41876).toLocaleString('en-GB')} in year 12 at age 73` } };
const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const textOf = solve => D.diagnosticText({ solve, plan, points: 45, paths: 5000, ua, isolated: true });
const tSolved = textOf(solved), tFailed = textOf(failedRec);

// 1. every amount, written each way, absent
const amounts = new Set([PLANTED]);
const walk = v => { if (typeof v === 'number' && Math.abs(v) >= 100 && Number.isFinite(v)) amounts.add(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
walk(plan); walk({ resilienceAt: meta.resilienceAt });
const forms = v => [String(v), String(Math.round(v)), Math.round(v).toLocaleString('en-GB'), v.toFixed(2), `${Math.round(v / 1000)}k`].filter(s => s.replace(/\D/g, '').length >= 3);
// the grid's and the times' lines carry the counts and seconds they are given, and the key's and the code's hex digits are checked
// for their form in check 5; every other line, and anything beyond the whitelist, is searched
const searched = t => t.split('\n').filter(l => !/^(grid|times|key|code): /.test(l)).join('\n');
const leaks = t => [...amounts].flatMap(v => forms(v).filter(f => searched(t).includes(f)));
const L1 = leaks(tSolved), L2 = leaks(tFailed);
ok(1, `no amount in the text, on a solved record and a failed one (${amounts.size} amounts from the plan and the planted ${PLANTED}, each in five forms)`, L1.length === 0 && L2.length === 0, `leaked: ${[...L1, ...L2].slice(0, 5).join(', ') || 'none'}`);

// 2. the whitelist, in order, and nothing else
const WANT = ['code', 'key', 'state', 'completed', 'dial', 'aims', 'limits', 'floor', 'grid', 'times', 'parts', 'isolated', 'browser', 'error'];
const keysOf = t => t.split('\n').slice(1).map(l => l.split(':')[0]);
ok(2, 'every whitelisted field once, in order, and nothing else', JSON.stringify(keysOf(tSolved)) === JSON.stringify(WANT) && JSON.stringify(keysOf(tFailed)) === JSON.stringify(WANT), keysOf(tSolved).join(', '));

// 3. the error's text
const red = D.redact('failed in year 12 at age 73 after 40 tries: 1234, 1,234, 1234.56, 1.2e5, 98765 and 100');
ok(3, 'the error keeps a year, an age and a count under 100, and loses every number of 100 or more however written', red === 'failed in year 12 at age 73 after 40 tries: #, #, #, #, # and #', red);

// 4. a value not of its form
const odd = D.diagnosticFields({ solve: { solveState: 'solved', key: 'not-a-key', solveMeta: { code: 'https://example.org/w.js', secs: 5 } }, plan: { solver: { aims: { cuts: 7, estate: '£500000', raises: 'capped' }, locks: { pensionBefore: 250000, tierCeiling: { pen: 'All my money', isa: 'Low Risk' }, lumpSum: 123456 } }, spending: {} }, points: 45, paths: 5000, ua: 'curl/8' });
const f = Object.fromEntries(odd);
ok(4, 'a value not of its form is written "other" (a word with an amount, an age out of range, a tier that is not one, a key, a code)',
  f.key === 'none' && f.code === 'unknown' && f.dial === 'other' && /estate other/.test(f.aims) && /pension before other/.test(f.limits) && /pension ceiling other/.test(f.limits) && /ISA ceiling Low Risk/.test(f.limits) && /lump sum other/.test(f.limits) && !/250000|123456|500000/.test(odd.map(x => x[1]).join(' ')),
  JSON.stringify(f).slice(0, 220));

// 5. the forms of the fields that are kept
const s = Object.fromEntries(tSolved.split('\n').slice(1).map(l => [l.split(':')[0], l.slice(l.indexOf(':') + 2)]));
ok(5, 'the floor a share of the target, the key its first 16 hex digits, the code the solver\'s, the grid and times as given, the browser named',
  s.floor === `${Math.round(100 * 41876 / 52345)}% of the target` && s.key === KEY.slice(0, 16) && s.code === 'solver-code:0123456789abcdef' && s.grid === '45 wealth points, 5000 paths' && s.times === 'solve 153.3s' && s.parts === '4' && s.dial === '3' && /^Safari 18 on iOS$/.test(s.browser) && s.completed === 'yes',
  JSON.stringify(s).slice(0, 260));

// 6. a partner's ceilings: named for a couple's plan, not for a single's plan carrying them
const partLocks = { pensionBefore: null, tierCeiling: { pen: null, isa: null }, tierCeilingPart: { pen: 'Low Risk', isa: null }, lumpSum: 'free' };
const limitsOf = mode => Object.fromEntries(D.diagnosticFields({ solve: solved, plan: { demographics: { planningMode: mode }, solver: { locks: partLocks } } })).limits;
const lc = limitsOf('couple'), ls = limitsOf('single');
ok(6, 'a partner\'s ceilings named for a couple\'s plan, not for a single\'s plan carrying them', /partner's pension ceiling Low Risk/.test(lc) && !/partner/.test(ls), `a couple: "${lc}"; a single: "${ls}"`);

console.log(`\n${passed} passed, ${failed} failed${PLANT_NAME ? ` (planted: ${PLANT_NAME})` : ''}`);
process.exit(failed ? 1 : 0);
