/*
 * THE FAIR-TEST CHECK (PLAN.md, the headline rule: "Every test is a fair test").
 *
 *   node research/solver/fair-test.mjs <tagA>[:arm] <tagB>[:arm] [--tested=name,name] [--accept=name,name]
 *
 * Reads what ACTUALLY RAN - the settings each result file recorded, not the batch script's intent - and lays
 * the plan's list of variables side by side for two arms, household by household. Every variable is one of:
 *   SAME       equal on every household both sides share
 *   TESTED     differs, and is the thing the test is about (named with --tested)
 *   DESIGN     a setting only one of the two arms has (a rival arm has no trim penalty); fair by construction
 *   ASSUMED    not recorded, because the file predates the knob; taken at the default it had then (marked *).
 *              Passes only when the other side holds that same default
 *   DIFFERS    differs and is not the thing tested            -> the test is NOT fair
 *   UNKNOWN    not recorded and not inferable                  -> NOT fair until established (--accept, with
 *                                                                  the reason written in the plan)
 * Exit code 1 when anything is DIFFERS or UNKNOWN.
 *
 * The arm defaults to the solver where the file has one, otherwise the guardrails with the floor (gkFloor).
 * Examples:
 *   node research/solver/fair-test.mjs k5-c0.001-x2 flex-tiers:gkFloor     K5 as first planned (fails: 3 variables)
 *   node research/solver/fair-test.mjs k5-c0.001-x2 k5t-fold-cap:gkFloor   K5 as corrected
 *   node research/solver/fair-test.mjs s2-fnewex m17-floor --tested="failed-year price,raise credit x survival" --accept="code (hash of solver, engine, library)"
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const D = join(dirname(fileURLToPath(import.meta.url)), 'results');
const args = process.argv.slice(2);
const opt = name => { const a = args.find(x => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3).split(',').map(s => s.trim()).filter(Boolean) : []; };
const [specA, specB] = args.filter(a => !a.startsWith('--'));
if (!specA || !specB) { console.error('usage: fair-test.mjs <tagA>[:arm] <tagB>[:arm] [--tested=..] [--accept=..]'); process.exit(2); }
const TESTED = opt('tested'), ACCEPT = opt('accept');

function load(spec) {
  const [tag, armGiven] = spec.split(':');
  const dir = join(D, tag);
  if (!existsSync(dir)) { console.error(`no results/${tag}`); process.exit(2); }
  const files = readdirSync(dir).filter(f => /^S\d+\.json$/.test(f)).sort();
  const byId = {};
  let arm = armGiven;
  for (const f of files) {
    const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    if (!arm) arm = j.solver ? 'solver' : 'gkFloor';
    if (!j[arm]) { console.error(`results/${tag}/${f} has no arm '${arm}'`); process.exit(2); }
    byId[j.id] = j;
  }
  return { tag, arm, byId };
}

const NR = { unknown: true }, ASSUME = v => ({ assumed: v });
const has = (k, key) => Object.prototype.hasOwnProperty.call(k, key);
/* The plan's list, as far as a result file can speak to it. Group letters follow PLAN.md. Returns [group, name, value]. */
function variables(j, arm) {
  const k = j.knobs || {}, s = j[arm] || {};
  const solver = arm === 'solver', guard = arm === 'gk' || arm === 'gkFloor';
  const kv = (key, map = x => x, absent = NR) => (has(k, key) ? map(k[key]) : absent);
  const only = (cond, v) => (cond ? v : 'n/a');
  return [
    // A. who and what is tested
    ['A', 'target spend', j.target],
    ['A', 'spending floor honoured', arm === 'gk' || arm === 'fixed' ? 'none' : j.floorSpend],
    ['A', 'plan tier held (PLANTIER)', kv('planTier', x => x ?? "plan's own", ASSUME("plan's own"))],
    ['A', 'GIA opening gain (GIAGAIN)', kv('giaGain', x => x ?? 'none', ASSUME('none'))],
    ['A', 'held-out paths', `${j.held} @ seed ${j.seedHeld}`],
    ['A', 'search seed', j.seedSearch ?? (solver ? NR : 'n/a')],
    ['A', 'survival asked for', only(solver, j.confidence ?? NR)],
    // B. the market
    ['B', 'market world', kv('mixture', x => (x ? `${x}-world mixture` : 'single-table fold'))],
    ['B', 'return points a year', only(solver, kv('quadNodes', x => x, ASSUME(5)))],
    // C. the user's rules
    ['C', 'minimum pot', kv('minPotYears', x => (x == null ? "plan's own" : `${x} yr of target`), ASSUME("plan's own"))],
    ['C', 'raise cap', solver ? kv('raiseCap', x => (x == null ? 'none' : String(x)), ASSUME('none')) : guard ? kv('guardCap', x => (x ? String(x) : 'none'), ASSUME('none')) : 'n/a'],
    ['C', 'estate weight', only(solver, kv('bequestWeight', x => String(x), NR))],
    ['C', 'estate shape and cap', only(solver, kv('bequestShape', x => `${x} ${k.bequestCap ?? ''}${k.estateScale != null ? ` scale ${k.estateScale}` : ''}`, NR))],
    ['C', 'risk tiers allowed', only(solver, kv('tiers', x => JSON.stringify(x), NR))],
    ['C', 'GIA tier moves', only(solver, kv('giaTiers', x => !!x, ASSUME(false)))],
    ['C', 'lump sum rule (PCLSSTRICT)', only(solver, kv('pclsStrict', x => !!x, ASSUME(false)))],
    // D. the solver's own settings
    ['D', 'grid', only(solver, j.coords ?? NR)],
    ['D', 'gain buckets', only(solver, kv('gainBuckets', x => `${x ?? 'default'}${k.gainInterp ? ' interp' : ''}`, ASSUME('default')))],
    ['D', 'spending menu', only(solver, kv('levels', x => JSON.stringify(x), NR))],
    ['D', 'switch margin', only(solver, kv('margin', x => x, NR))],
    ['D', 'dislike of cuts (lambda)', only(solver, s.lambda != null ? Number(s.lambda).toPrecision(4) : NR)],
    ['D', 'lambda held or landed', only(solver, s.landed === undefined ? NR : /held/.test(String(s.landed)) ? 'held' : 'landed')],
    ['D', 'trim curve exponent', only(solver, kv('exponent', x => x, NR))],
    ['D', 'raise credit (mu)', only(solver, kv('raise', x => x, NR))],
    ['D', 'raise credit x survival', only(solver, kv('raiseSurvival', x => !!x, ASSUME(false)))],
    ['D', 'failed-year price', only(solver, kv('failureShortfall', x => String(x || false), ASSUME('false')))],
    ['D', 'resilience weight', only(solver, kv('resilienceWeight', x => x, NR))],
    ['D', 'drift weight', only(solver, kv('drift', x => x, ASSUME(0)))],
    ['D', 'final year exact', only(solver, kv('finalExact', x => !!x, ASSUME(false)))],
    ['D', 'dead-corner read', only(solver, kv('shareDead', x => x ?? 'off', ASSUME('off')))],
    ['D', 'bridge read (F1)', only(solver, kv('bridgeRead', x => !!x, ASSUME(false)))],
    ['D', 'block trim', only(solver, kv('blockTrim', x => !!x, ASSUME(false)))],
    ['D', 'level search', only(solver, kv('levelSearch', x => x, ASSUME('exhaustive')))],
    // E. the rival arm
    ['E', 'rival rule', guard ? (s.label ?? NR) : 'n/a'],
    // F. the code
    ['F', 'code (hash of solver, engine, library)', j.code && j.code.hash ? j.code.hash : NR],
    ['F', 'solver version tag (hand-set, not proof)', only(solver, s.solverVersion ?? NR)]
  ];
}

const A = load(specA), B = load(specB);
const shared = Object.keys(A.byId).filter(id => B.byId[id]).sort();
const onlyA = Object.keys(A.byId).filter(id => !B.byId[id]), onlyB = Object.keys(B.byId).filter(id => !A.byId[id]);
const show = v => (v && v.unknown ? 'NOT RECORDED' : v && v.assumed !== undefined ? `${v.assumed}*` : String(v));
const val = v => (v && v.assumed !== undefined ? String(v.assumed) : v && v.unknown ? null : String(v));

console.log(`FAIR-TEST CHECK: ${A.tag}:${A.arm}  against  ${B.tag}:${B.arm}${TESTED.length ? `   (tested: ${TESTED.join(', ')})` : ''}`);
let bad = 0; const designOnly = [];
const sampleOk = !onlyA.length && !onlyB.length;
console.log(`  [A] households                    ${shared.length} shared${onlyA.length ? `; only in ${A.tag}: ${onlyA.join(' ')}` : ''}${onlyB.length ? `; only in ${B.tag}: ${onlyB.join(' ')}` : ''}   ${sampleOk ? 'SAME' : 'SUBSET (compare the shared ones only)'}`);
const rows = shared.map(id => [variables(A.byId[id], A.arm), variables(B.byId[id], B.arm)]);
for (let r = 0; r < rows[0][0].length; r++) {
  const [g, name] = rows[0][0][r];
  const pairs = rows.map(([a, b], i) => ({ id: shared[i], a: a[r][2], b: b[r][2] }));
  const valsA = [...new Set(pairs.map(p => show(p.a)))], valsB = [...new Set(pairs.map(p => show(p.b)))];
  const differ = pairs.filter(p => val(p.a) !== val(p.b));
  const unknown = pairs.some(p => (p.a && p.a.unknown) || (p.b && p.b.unknown));
  const assumed = pairs.some(p => (p.a && p.a.assumed !== undefined) || (p.b && p.b.assumed !== undefined));
  const design = pairs.every(p => (p.a === 'n/a') !== (p.b === 'n/a'));
  let status;
  if (pairs.every(p => p.a === 'n/a' && p.b === 'n/a')) continue;
  if (TESTED.includes(name)) status = differ.length ? 'TESTED' : 'TESTED, BUT EQUAL (the test changes nothing?)';
  else if (design) status = 'DESIGN (one arm only)';
  else if (unknown && !differ.length) status = ACCEPT.includes(name) ? 'UNKNOWN, accepted' : 'UNKNOWN';
  else if (unknown) status = ACCEPT.includes(name) ? 'UNKNOWN, accepted' : 'UNKNOWN';
  else if (differ.length) status = 'DIFFERS';
  else status = assumed ? 'SAME (assumed*)' : 'SAME';
  if (status === 'DIFFERS' || status === 'UNKNOWN') bad++;
  if (status.startsWith('DESIGN')) { designOnly.push(name); continue; }
  const fmt = vs => (vs.length <= 2 ? vs.join(' / ') : `${vs.length} values, per household`);
  const where = status === 'DIFFERS' && differ.length < pairs.length ? `  on ${differ.map(p => p.id).join(' ')}` : '';
  console.log(`  [${g}] ${name.padEnd(32)} ${fmt(valsA).slice(0, 34).padEnd(34)} | ${fmt(valsB).slice(0, 34).padEnd(34)} ${status}${where}`);
}
if (designOnly.length) console.log(`  DESIGN (a setting of one arm only, fair by construction): ${designOnly.join(', ')}`);
console.log('  * not recorded: the file predates the knob, taken at the default it had then');
console.log('  Not in any file, so checked by hand from the batch script and the plan: the engine\'s return assumptions, whether');
console.log('  the arms were scored on the same paths (paired), the reducer and its statistic definitions, machine load (timings).');
console.log(bad ? `NOT A FAIR TEST: ${bad} variable(s) DIFFERS or UNKNOWN` : 'FAIR on everything the files record');
process.exit(bad ? 1 : 0);
