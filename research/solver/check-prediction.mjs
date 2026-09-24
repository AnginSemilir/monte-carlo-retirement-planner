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
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { VARIABLES } from './fair-variables.mjs';

export const PRED_STATUSES = ['SAME', 'TESTED', 'ONE ARM ONLY', 'N/A', 'ACCEPTED'];

function section(text, name) {
  const re = new RegExp(`^##\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
  const m = re.exec(text);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/^##\s+/m);
  return (next < 0 ? rest : rest.slice(0, next)).trim();
}

export function checkPredictionText(text) {
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
  return checkPredictionText(readFileSync(file, 'utf8'));
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
