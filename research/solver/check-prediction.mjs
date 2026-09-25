/*
 * THE PREDICTION FILE CHECK (RULES.md: "Before any run: a registered prediction"). run-from-snapshot.sh refuses to
 * launch on a prediction that fails this, and check-plan.mjs runs it on every prediction the plan names.
 *
 *   node research/solver/check-prediction.mjs research/solver/predictions/<name>.md [...]
 *
 * A prediction file must have: the title; Run, Kind (test | measurement) and Written fields; non-empty Question,
 * Prediction and Falsified if sections; the fair-test table with one row for every variable in fair-variables.mjs,
 * each marked SAME, TESTED, ONE ARM ONLY, N/A or ACCEPTED (the last three with a reason), no "?" left, and at least
 * one TESTED row for a test; and a "Changes after seeing results" section (rule 11: a change made after any result
 * is in is declared there, never made quietly).
 * THE REGIMEN'S FIELDS (RULES.md section 8; the maintainer adopted it 25 Sep 20:47 UK): a prediction not registered
 * before then also carries, non-empty, for a test: Decision rule, Decision fed (naming what held, falsified and
 * inconclusive each change), Provenance, Derivation script (at least one line "derive: <script> > <output> sha256 <16
 * hex>", which the launcher re-runs, or "none: <why>"), Point and interval, Credence (a probability), Power, Budget line
 * and Pre-mortem; for a measurement: Decision fed, Provenance, Point and interval and Budget line. The files registered
 * before the regimen are exempt by name (BEFORE_REGIMEN); every other file, and a text checked with no name, is held to
 * it. A section heading may carry a note after its name ("## Decision rule (registered before launch)").
 * THE SEED REGISTRY (RULES.md section 8 item 9; the maintainer's decision 3, taken by default 25 Sep, built under the
 * unlock of 25 Sep 22:14 UK): every seed a run uses has one registered use, and a reserved seed runs only under the
 * predictions it names. A prediction written after the registry carries "- **Seeds:** <each seed and its use>" (or
 * "none: <why>"), every seed registered and each reserved one its own. The launcher reads the seeds in the command and
 * in the scripts it names (lines that are not comments) and refuses a reserved seed under any other prediction or under
 * a measurement, and a seed the prediction's Seeds field does not declare:
 *   node research/solver/check-prediction.mjs --seeds <prediction.md | none> --text "<command>" [script ...]
 * Its limit: a seed a script takes by default (audit-s126.mjs and experiment.mjs default to 7002) is not in any text
 * the launcher reads; no reserved seed is anyone's default.
 */
import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VARIABLES } from './fair-variables.mjs';

export const PRED_STATUSES = ['SAME', 'TESTED', 'ONE ARM ONLY', 'N/A', 'ACCEPTED'];
// registered before the regimen (25 Sep 20:47 UK): not held to its fields
export const BEFORE_REGIMEN = ['bridge-quad.md', 'f1-test.md', 'f1v2-test.md', 'k5-stage1.md', 'm14b.md', 'm14c-bets.md', 'o19-final.md', 'o22-trace.md', 'quad-ref.md'];
export const REGIMEN_TEST = ['Decision rule', 'Decision fed', 'Provenance', 'Derivation script', 'Point and interval', 'Credence', 'Power', 'Budget line', 'Pre-mortem'];
export const REGIMEN_MEASUREMENT = ['Decision fed', 'Provenance', 'Point and interval', 'Budget line'];
export const DERIVE = /^\s*-?\s*`?derive: (\S+) > (\S+) sha256 ([0-9a-f]{16})`?\s*$/gm;
// the registry, as RULES.md section 8 item 9 lists it (plan-checker.test.mjs pins the two together). 7011's owners are
// the tests whose batches ran on it (batch-m14b.sh, batch-m14c.sh, batch-o19.sh, batch-quadref.sh) and 7e's.
export const SEED_REGISTRY = Object.freeze({
  7001: 'search', 7002: 'tuning', 7003: 'Phase 4 only', 7004: 'second seed (replication)', 7005: 'selection',
  7011: 'held out: M14b, M14c, O19, quad-ref and 7e', 7012: 'held out: K6', 7101: "the 'auto' rule" });
export const SEED_OWNERS = Object.freeze({
  7003: [/^phase-?4[\w.-]*\.md$/], 7012: [/^k6[\w.-]*\.md$/],
  7011: ['m14b.md', 'm14c-bets.md', 'o19-final.md', 'quad-ref.md', 'bridge-reader.md'] });
// written before the Seeds field existed: the launcher's owner check still covers their reserved seeds
export const BEFORE_SEEDS = [...BEFORE_REGIMEN, 'bridge-reader.md'];
export const ownsSeed = (seed, name) => !!name && (SEED_OWNERS[seed] || []).some(o => typeof o === 'string' ? o === basename(name) : o.test(basename(name)));
// the registered seeds a text names, comment lines left out
export const seedsIn = text => [...new Set((String(text).split('\n').filter(l => !/^\s*#/.test(l)).join('\n').match(/\b\d{4}\b/g) || []).map(Number))].filter(n => n in SEED_REGISTRY).sort();
const seedsField = text => { const m = /^-\s+\*\*Seeds:\*\*\s*(.+)$/mi.exec(text); return m ? m[1].trim() : null; };

// the launcher's check: `name` is the prediction file (null for a measurement), `predText` its text
export function seedLaunchProblems({ name = null, predText = '', texts = [] }) {
  const used = seedsIn(texts.join('\n')), errs = [];
  for (const s of used.filter(s => s in SEED_OWNERS)) {
    if (!ownsSeed(s, name)) errs.push(`seed ${s} is reserved (${SEED_REGISTRY[s]}) and this launch is under ${name ? basename(name) : 'a measurement'}`);
  }
  const field = name ? seedsField(predText) : null;
  if (field !== null && !/^none:/i.test(field)) {
    const declared = seedsIn(field);
    for (const s of used) if (!declared.includes(s)) errs.push(`the run uses seed ${s} (${SEED_REGISTRY[s]}), which the prediction's Seeds field does not declare`);
  }
  return errs;
}

function section(text, name, { note = false } = {}) {
  const re = new RegExp(`^##\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${note ? '(?:\\s+\\([^\\n]*\\))?' : ''}\\s*$`, 'im');
  const m = re.exec(text);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/^##\s+/m);
  return (next < 0 ? rest : rest.slice(0, next)).trim();
}

export function checkPredictionText(text, { name } = {}) {
  const errs = [];
  if (!/^#\s+Prediction:\s+\S/m.test(text)) errs.push('the first heading must be "# Prediction: <name>"');
  const field = f => { const m = new RegExp(`^-\\s+\\*\\*${f}:\\*\\*\\s*(.+)$`, 'mi').exec(text); return m ? m[1].trim() : null; };
  const run = field('Run'), kind = field('Kind'), written = field('Written');
  if (!run) errs.push('missing "- **Run:** <batch script and result tags>"');
  if (!kind || !/^(test|measurement)\b/i.test(kind)) errs.push('missing "- **Kind:** test | measurement"');
  if (!written) errs.push('missing "- **Written:** <date, time> UK, before the run"');
  for (const s of ['Question', 'Prediction', 'Falsified if', 'Changes after seeing results']) {
    const body = section(text, s);
    if (body === null) errs.push(`missing section "## ${s}"`);
    else if (!body) errs.push(`section "## ${s}" is empty`);
  }
  // the regimen's fields, for every prediction not registered before it
  if (!(name && BEFORE_REGIMEN.includes(basename(name)))) {
    const isTest = !kind || /^test/i.test(kind);
    for (const s of isTest ? REGIMEN_TEST : REGIMEN_MEASUREMENT) {
      const body = section(text, s, { note: true });
      if (body === null) errs.push(`missing section "## ${s}" (the regimen, RULES.md section 8)`);
      else if (!body) errs.push(`section "## ${s}" is empty (the regimen, RULES.md section 8)`);
    }
    const fed = section(text, 'Decision fed', { note: true });
    if (isTest && fed && !(/\bheld\b/i.test(fed) && /\bfalsified\b/i.test(fed) && /\binconclusive\b/i.test(fed))) errs.push('"## Decision fed" must say what each outcome changes: held, falsified and inconclusive');
    const cred = section(text, 'Credence', { note: true });
    if (isTest && cred && !/\b0?\.\d+\b|\b\d{1,3}%/.test(cred)) errs.push('"## Credence" must give a probability for each item');
    const der = section(text, 'Derivation script', { note: true });
    if (isTest && der && ![...der.matchAll(DERIVE)].length && !/^\s*-?\s*none:\s*\S/m.test(der)) errs.push('"## Derivation script" needs a line "derive: <script> > <output> sha256 <16 hex>" (the launcher re-runs it) or "none: <why>"');
  }
  // the seed registry, for every prediction written after it
  if (!(name && BEFORE_SEEDS.includes(basename(name)))) {
    const sf = seedsField(text);
    if (sf === null) errs.push('missing "- **Seeds:** <each seed and its use>" or "none: <why>" (the seed registry, RULES.md section 8 item 9)');
    else if (!/^none:\s*\S/i.test(sf)) {
      const nums = [...new Set((sf.match(/\b\d{4}\b/g) || []).map(Number))];
      if (!nums.length) errs.push('"Seeds" names no seed: list each seed, or write "none: <why>"');
      for (const s of nums) {
        if (!(s in SEED_REGISTRY)) errs.push(`seed ${s} is not in the seed registry (RULES.md section 8 item 9; check-prediction.mjs SEED_REGISTRY)`);
        else if (s in SEED_OWNERS && !ownsSeed(s, name)) errs.push(`seed ${s} is reserved (${SEED_REGISTRY[s]}); ${name ? basename(name) : 'this prediction'} is not one of its owners`);
      }
    }
  }
  const table = section(text, 'Fair-test table');
  if (table === null) { errs.push('missing section "## Fair-test table"'); return errs; }
  const rows = table.split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l));
  const seen = new Map();
  for (const l of rows) {
    const cells = l.split('|').slice(1, -1).map(c => c.trim());
    const n = Number(cells[0]);
    if (seen.has(n)) errs.push(`fair-test row ${n} appears twice`);
    seen.set(n, cells);
    if (cells.length < 5) { errs.push(`fair-test row ${n} needs 5 cells (#, variable, arm A, arm B, status)`); continue; }
    if (cells.slice(2).some(c => c === '?' || c === '')) errs.push(`fair-test row ${n} still has "?" or an empty cell`);
    const st = PRED_STATUSES.find(s => cells[4].toUpperCase().startsWith(s));
    if (!st) errs.push(`fair-test row ${n}: status must start with one of ${PRED_STATUSES.join(' / ')}`);
    else if (st !== 'SAME' && st !== 'TESTED' && cells[4].replace(/^[A-Z/ ]+/, '').replace(/^[\s:,-]+/, '').length < 8) errs.push(`fair-test row ${n}: ${st} needs a reason after it`);
  }
  for (const v of VARIABLES) if (!seen.has(v.n)) errs.push(`fair-test table has no row for variable ${v.n} (${v.name.slice(0, 40)})`);
  if (kind && /^test/i.test(kind) && ![...seen.values()].some(c => (c[4] || '').toUpperCase().startsWith('TESTED'))) errs.push('a test needs at least one TESTED row - the thing it is about');
  return errs;
}

export function checkPredictionFile(file) {
  if (!existsSync(file)) return [`no such file: ${file}`];
  return checkPredictionText(readFileSync(file, 'utf8'), { name: file });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv[2] === '--seeds') {
  const [pred, ...rest] = process.argv.slice(3);
  if (!pred) { console.error('usage: check-prediction.mjs --seeds <prediction.md | none> [--text "<command>"] [script ...]'); process.exit(2); }
  const texts = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--text') { texts.push(rest[++i] || ''); continue; }
    if (!existsSync(rest[i])) { console.error(`check-prediction --seeds: no such script ${rest[i]}`); process.exit(2); }
    texts.push(readFileSync(rest[i], 'utf8'));
  }
  const name = pred === 'none' ? null : pred;
  const errs = seedLaunchProblems({ name, predText: name ? readFileSync(name, 'utf8') : '', texts });
  if (errs.length) { console.log(`the seed registry refuses this launch:\n${errs.map(e => `  - ${e}`).join('\n')}`); process.exit(1); }
  console.log(`seeds: ${seedsIn(texts.join('\n')).map(s => `${s} (${SEED_REGISTRY[s]})`).join(', ') || 'none registered in the command or its scripts'}`);
  process.exit(0);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const files = process.argv.slice(2);
  if (!files.length) { console.error('usage: check-prediction.mjs <file> [...]'); process.exit(2); }
  let bad = 0;
  for (const f of files) {
    const errs = checkPredictionFile(f);
    if (errs.length) { bad++; console.log(`${f}: NOT VALID\n${errs.map(e => `  - ${e}`).join('\n')}`); } else console.log(`${f}: valid`);
  }
  process.exit(bad ? 1 : 0);
}
