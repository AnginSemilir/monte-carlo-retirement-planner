/*
 * THE FAIR-TEST GATE (RULES.md "Every test is a fair test", step 2: after a run, before any figure is read).
 *
 * Reads what ACTUALLY RAN - the settings each result file recorded, not the batch script's intent - and compares two
 * arms household by household on every variable a file can speak to (the numbers are RULES.md's list,
 * fair-variables.mjs). Each variable ends as:
 *   SAME       equal on every household both sides share
 *   TESTED     differs, and is the thing the test is about
 *   DESIGN     a setting only one of the two arms has (a rival rule has no trim penalty) - fair by construction
 *   ASSUMED    not recorded (the file predates the knob), taken at the default it had then (marked *). Passes only
 *              when the other side holds that same default
 *   ACCEPTED   differs or unknown, and accepted with a written reason (printed with every report)
 *   DIFFERS    differs and is not the thing tested            -> NOT FAIR
 *   UNKNOWN    not recorded and not inferable                  -> NOT FAIR
 * Two checks sit beside the variables: a tag whose files were made by more than one version of the code (MIXED CODE),
 * and a registered prediction whose file changed after the results were made (PREDICTION EDITED) - both NOT FAIR
 * unless accepted.
 *
 * Reducers call requireFair() before printing a single figure; it exits 1 when the test is not fair. An acceptance
 * is `FAIR_ACCEPT="28=why | 10=why"` (variable number or name = the reason; entries split by |), and the reason is printed in the output.
 *
 * The CLI is fair-test.mjs.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const RESULTS = join(HERE, 'results');
const REPO = join(HERE, '../..');

export function loadTag(spec, dir = RESULTS) {
  const [tag, armGiven] = spec.split(':');
  const d = join(dir, tag);
  if (!existsSync(d)) throw new Error(`no results/${tag}`);
  const byId = {};
  let arm = armGiven;
  for (const f of readdirSync(d).filter(x => /^S\d+\.json$/.test(x)).sort()) {
    const j = JSON.parse(readFileSync(join(d, f), 'utf8'));
    if (!arm) arm = j.solver ? 'solver' : 'gkFloor';
    if (!j[arm]) throw new Error(`results/${tag}/${f} has no arm '${arm}'`);
    byId[j.id] = j;
  }
  return { tag, arm, byId };
}

const NR = { unknown: true }, ASSUME = v => ({ assumed: v });
const has = (k, key) => Object.prototype.hasOwnProperty.call(k, key);

/* The variables a result file can speak to, each tagged with its number in RULES.md's list. [n, name, value] */
export function variablesOf(j, arm) {
  const k = j.knobs || {}, s = j[arm] || {};
  const solver = arm === 'solver', guard = arm === 'gk' || arm === 'gkFloor';
  const kv = (key, map = x => x, absent = NR) => (has(k, key) ? map(k[key]) : absent);
  const only = (cond, v) => (cond ? v : 'n/a');
  return [
    [3, 'target spend', j.target],
    [3, 'spending floor honoured', arm === 'gk' || arm === 'fixed' ? 'none' : j.floorSpend],
    [13, 'plan tier held (PLANTIER)', kv('planTier', x => x ?? "plan's own", ASSUME("plan's own"))],
    [2, 'GIA opening gain (GIAGAIN)', kv('giaGain', x => x ?? 'none', ASSUME('none'))],
    [5, 'held-out paths', `${j.held} @ seed ${j.seedHeld}`],
    [6, 'search seed', j.seedSearch ?? (solver ? NR : 'n/a')],
    [4, 'survival asked for', only(solver, j.confidence ?? NR)],
    [7, 'market world', kv('mixture', x => (x ? `${x}-world mixture` : 'single-table fold'))],
    [8, 'return points a year', only(solver, kv('quadNodes', x => x, ASSUME(5)))],
    [10, 'minimum pot', kv('minPotYears', x => (x == null ? "plan's own" : `${x} yr of target`), ASSUME("plan's own"))],
    [11, 'raise cap', solver ? kv('raiseCap', x => (x == null ? 'none' : String(x)), ASSUME('none')) : guard ? kv('guardCap', x => (x ? String(x) : 'none'), ASSUME('none')) : 'n/a'],
    [12, 'estate weight', only(solver, kv('bequestWeight', x => String(x), NR))],
    [12, 'estate shape and cap', only(solver, kv('bequestShape', x => `${x} ${k.bequestCap ?? ''}${k.estateScale != null ? ` scale ${k.estateScale}` : ''}`, NR))],
    [13, 'risk tiers allowed', only(solver, kv('tiers', x => JSON.stringify(x), NR))],
    [16, 'GIA tier moves', only(solver, kv('giaTiers', x => !!x, ASSUME(false)))],
    [15, 'lump sum rule (PCLSSTRICT)', only(solver, kv('pclsStrict', x => !!x, ASSUME(false)))],
    [17, 'grid', only(solver, j.coords ?? NR)],
    [17, 'gain buckets', only(solver, kv('gainBuckets', x => `${x ?? 'default'}${k.gainInterp ? ' interp' : ''}`, ASSUME('default')))],
    [18, 'spending menu', only(solver, kv('levels', x => JSON.stringify(x), NR))],
    [19, 'switch margin', only(solver, kv('margin', x => x, NR))],
    [20, 'dislike of cuts (lambda)', only(solver, s.lambda != null ? Number(s.lambda).toPrecision(4) : NR)],
    [20, 'lambda held or landed', only(solver, s.landed === undefined ? NR : /held/.test(String(s.landed)) ? 'held' : 'landed')],
    [20, 'trim curve exponent', only(solver, kv('exponent', x => x, NR))],
    [21, 'raise credit (mu)', only(solver, kv('raise', x => x, NR))],
    [21, 'raise credit x survival', only(solver, kv('raiseSurvival', x => !!x, ASSUME(false)))],
    [22, 'failed-year price', only(solver, kv('failureShortfall', x => String(x || false), ASSUME('false')))],
    [23, 'resilience weight', only(solver, kv('resilienceWeight', x => x, NR))],
    [23, 'drift weight', only(solver, kv('drift', x => x, ASSUME(0)))],
    [24, 'final year exact', only(solver, kv('finalExact', x => !!x, ASSUME(false)))],
    [24, 'dead-corner read', only(solver, kv('shareDead', x => x ?? 'off', ASSUME('off')))],
    // the version, not just on or off (maintainer's unlock, 24 Sep 13:44 UK): v1 files keep recording true, v2 records 2
    [24, 'bridge read (F1)', only(solver, kv('bridgeRead', x => (x === 2 ? 2 : !!x), ASSUME(false)))],
    [24, 'block trim', only(solver, kv('blockTrim', x => !!x, ASSUME(false)))],
    [25, 'level search', only(solver, kv('levelSearch', x => x, ASSUME('exhaustive')))],
    [26, 'rival rule', guard ? (s.label ?? NR) : 'n/a'],
    [28, 'code', j.code && j.code.hash ? j.code.hash : NR]
  ];
}

const show = v => (v && v.unknown ? 'NOT RECORDED' : v && v.assumed !== undefined ? `${v.assumed}*` : String(v));
const val = v => (v && v.assumed !== undefined ? String(v.assumed) : v && v.unknown ? null : String(v));

/* git's blob hash of a file as it stands, for the prediction lock */
function blobOf(file) {
  try { return execSync(`git hash-object "${file}"`, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; }
}

export function parseAccept(text = process.env.FAIR_ACCEPT || '') {
  const out = {};
  for (const part of text.split('|').map(s => s.trim()).filter(Boolean)) {
    const i = part.indexOf('=');
    if (i < 1 || !part.slice(i + 1).trim()) throw new Error(`FAIR_ACCEPT entry "${part}" needs "<variable>=<reason>"`);
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

/* Compare two loaded arms. tested: variable numbers or names that are the thing under test. */
export function compareData(A, B, { tested = [], accept = {}, blob = blobOf } = {}) {
  const T = new Set(tested.map(String)), acc = k => accept[String(k.n)] ?? accept[k.name];
  const shared = Object.keys(A.byId).filter(id => B.byId[id]).sort();
  const onlyA = Object.keys(A.byId).filter(id => !B.byId[id]), onlyB = Object.keys(B.byId).filter(id => !A.byId[id]);
  const rows = [], checks = [];
  if (!shared.length) return { A, B, shared, onlyA, onlyB, rows, checks, bad: 1, empty: true };
  const table = shared.map(id => [variablesOf(A.byId[id], A.arm), variablesOf(B.byId[id], B.arm)]);
  for (let r = 0; r < table[0][0].length; r++) {
    const [n, name] = table[0][0][r];
    const pairs = table.map(([a, b], i) => ({ id: shared[i], a: a[r][2], b: b[r][2] }));
    if (pairs.every(p => p.a === 'n/a' && p.b === 'n/a')) continue;
    const differ = pairs.filter(p => val(p.a) !== val(p.b));
    const unknown = pairs.some(p => (p.a && p.a.unknown) || (p.b && p.b.unknown));
    const assumed = pairs.some(p => (p.a && p.a.assumed !== undefined) || (p.b && p.b.assumed !== undefined));
    const design = pairs.every(p => (p.a === 'n/a') !== (p.b === 'n/a'));
    const reason = acc({ n, name });
    let status;
    if (T.has(String(n)) || T.has(name)) status = differ.length ? 'TESTED' : 'TESTED, BUT EQUAL';
    else if (design) status = 'DESIGN';
    else if (unknown || differ.length) status = reason ? 'ACCEPTED' : unknown ? 'UNKNOWN' : 'DIFFERS';
    else status = assumed ? 'SAME*' : 'SAME';
    rows.push({ n, name, differs: differ.length > 0, valsA: [...new Set(pairs.map(p => show(p.a)))], valsB: [...new Set(pairs.map(p => show(p.b)))], status, reason, where: status === 'DIFFERS' && differ.length < pairs.length ? differ.map(p => p.id) : null });
  }
  // a tested number can cover several rows (21: mu and its survival weighting): the rows that did not move are SAME
  for (const t of T) {
    const group = rows.filter(r => String(r.n) === t || r.name === t);
    if (group.some(r => r.differs)) for (const r of group) if (!r.differs) r.status = 'SAME';
  }
  // beside the variables: one version of the code per tag, and the prediction lock
  for (const X of [A, B]) {
    const hashes = [...new Set(Object.values(X.byId).map(j => (j.code && j.code.hash) || 'none'))];
    if (hashes.length > 1) {
      const reason = accept['mixed-code'];
      checks.push({ name: `one version of the code in ${X.tag}`, status: reason ? 'ACCEPTED' : 'MIXED CODE', detail: hashes.join(', '), reason });
    }
    // the prediction lock. No 'prediction' key: a file from before the launcher gate (legacy, noted). null: launched
    // outside the launcher. { none }: launched as a measurement. Either of those cannot settle a test unless accepted.
    const files = Object.values(X.byId);
    if (files.every(j => !has(j, 'prediction'))) { checks.push({ name: `prediction registered for ${X.tag}`, status: 'NOT RECORDED', detail: 'the files predate the launcher gate (24 Sep)' }); continue; }
    const loose = files.filter(j => !j.prediction || j.prediction.none);
    if (loose.length) {
      const reason = accept.prediction;
      checks.push({ name: `prediction registered for ${X.tag}`, status: reason ? 'ACCEPTED' : 'NO PREDICTION', detail: loose[0].prediction ? `launched as a measurement: ${loose[0].prediction.none}` : 'launched outside run-from-snapshot.sh', reason });
    }
    const preds = [...new Set(files.filter(j => j.prediction && j.prediction.file).map(j => `${j.prediction.file}@${j.prediction.sha}`))];
    for (const p of preds) {
      const [file, sha] = p.split('@');
      const now = blob(file);
      if (now && sha && now !== sha) {
        const reason = accept['prediction-edited'];
        checks.push({ name: `prediction ${file} unchanged since ${X.tag} ran`, status: reason ? 'ACCEPTED' : 'PREDICTION EDITED', detail: `${sha.slice(0, 8)} at launch, ${now.slice(0, 8)} now`, reason });
      } else checks.push({ name: `prediction ${file} unchanged since ${X.tag} ran`, status: now ? 'SAME' : 'NOT FOUND', detail: file });
    }
  }
  const bad = rows.filter(r => r.status === 'DIFFERS' || r.status === 'UNKNOWN').length + checks.filter(c => ['MIXED CODE', 'PREDICTION EDITED', 'NO PREDICTION'].includes(c.status)).length;
  return { A, B, shared, onlyA, onlyB, rows, checks, bad };
}

export function compareTags(specA, specB, opts = {}) { return compareData(loadTag(specA, opts.dir), loadTag(specB, opts.dir), opts); }

/* Diff-first: what differs is the signal, the rest is context (--all prints every row). */
export function formatReport(res, { all = false } = {}) {
  const L = [];
  const { A, B } = res;
  L.push(`FAIR-TEST CHECK: ${A.tag}:${A.arm}  against  ${B.tag}:${B.arm}`);
  if (res.empty) { L.push('  no household in common: NOT A FAIR TEST'); return L.join('\n'); }
  L.push(`  households: ${res.shared.length} shared${res.onlyA.length ? `; only in ${A.tag}: ${res.onlyA.join(' ')}` : ''}${res.onlyB.length ? `; only in ${B.tag}: ${res.onlyB.join(' ')}` : ''}`);
  const fmt = vs => (vs.length <= 2 ? vs.join(' / ') : `${vs.length} values, per household`);
  const quiet = new Set(['SAME', 'SAME*', 'DESIGN']);
  for (const r of res.rows) {
    if (!all && quiet.has(r.status)) continue;
    L.push(`  [${String(r.n).padStart(2)}] ${r.name.padEnd(28)} ${fmt(r.valsA).slice(0, 30).padEnd(30)} | ${fmt(r.valsB).slice(0, 30).padEnd(30)} ${r.status}${r.where ? ` on ${r.where.join(' ')}` : ''}${r.reason ? `  - ${r.reason}` : ''}`);
  }
  for (const c of res.checks) if (all || c.status !== 'SAME') L.push(`  [--] ${c.name}: ${c.status} (${c.detail})${c.reason ? `  - ${c.reason}` : ''}`);
  const same = res.rows.filter(r => r.status === 'SAME' || r.status === 'SAME*').length, design = res.rows.filter(r => r.status === 'DESIGN').length;
  const assumed = res.rows.filter(r => r.status === 'SAME*').map(r => r.name);
  L.push(`  ${same} recorded variables SAME${assumed.length ? ` (${assumed.length} by an assumed default: ${assumed.join(', ')})` : ''}; ${design} belong to one arm only`);
  L.push('  checked by hand, never in a file: the engine\'s return assumptions (9), the reducer\'s definitions (29-32), machine load (33)');
  L.push(res.bad ? `  NOT A FAIR TEST: ${res.bad} item(s) DIFFERS / UNKNOWN / MIXED CODE / PREDICTION EDITED / NO PREDICTION` : '  FAIR on everything the files record');
  return L.join('\n');
}

/* For reducers: each pair is [specA, specB, { tested }]. Prints the reports; exits 1 unless every pair is fair. */
export function requireFair(pairs, { accept = parseAccept(), all = false, exit = true, compact = false } = {}) {
  let bad = 0, shown = false;
  for (const [a, b, o = {}] of pairs) {
    let res;
    try { res = compareTags(a, b, { ...o, accept }); } catch (e) { console.log(`FAIR-TEST CHECK: ${a} against ${b}: ${e.message}`); bad++; continue; }
    // compact: the first report in full, then one line per pair unless it fails
    if (!compact || !shown || res.bad) { console.log(formatReport(res, { all })); shown = true; }
    else console.log(`FAIR-TEST CHECK: ${a} against ${b}: ${res.bad ? 'NOT FAIR' : 'FAIR'}${res.rows.some(r => r.status === 'ACCEPTED') ? ` (accepted: ${res.rows.filter(r => r.status === 'ACCEPTED').map(r => r.n).join(', ')})` : ''}`);
    bad += res.bad;
  }
  if (bad && exit) {
    console.log('\nREFUSED: not a fair test, so no figure is printed. Fix the runs, or accept a named variable with a reason:');
    console.log('  FAIR_ACCEPT="<number>=<why this difference does not bias the comparison>" node <reducer>');
    process.exit(1);
  }
  return bad === 0;
}
