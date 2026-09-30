/*
 * THE PREDICTION FILE CHECK (RULES.md: "Before any run: a registered prediction"). run-from-snapshot.sh refuses to
 * launch on a prediction that fails this, and check-plan.mjs runs it on every prediction the plan names.
 *
 *   node research/solver/check-prediction.mjs research/solver/predictions/<name>.md [...]
 *
 * A prediction file must have: the title; Run, Kind (test | measurement) and Written fields; non-empty Question,
 * Prediction and Falsified if sections; the fair-test table with one row for every variable in fair-variables.mjs (or every
 * row that is not SAME, with the line "- **All other rows: SAME**": the maintainer, 26 Sep 18:02 UK),
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
 * OUTCOME COVERAGE (RULES.md section 10, the feedback loop's amendment 7; the maintainer's unlock of 30 Sep): a test first
 * committed from OUTCOMES_FROM on names its reducer on the Run line (reduce-<name>.mjs), and that reducer's --planted run
 * prints "OUTCOMES REACHED: item <n>: <outcome>, ..." for each item: each item reaches 3 outcomes or more by a plant, and
 * every one of HELD, FALSIFIED and INCONCLUSIVE its Decision fed names is reached (7al's first design could never read
 * FALSIFIED, and nothing noticed). The launcher runs it:
 *   node research/solver/check-prediction.mjs --outcomes <prediction.md>
 * Its limit: a seed a script takes by default (audit-s126.mjs and experiment.mjs default to 7002) is not in any text
 * the launcher reads; no reserved seed is anyone's default.
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
  7011: 'held out: M14b, M14c, O19, quad-ref and 7e', 7012: 'held out: K6', 7013: 'held out: 7u', 7101: "the 'auto' rule" });
export const SEED_OWNERS = Object.freeze({
  7003: [/^phase-?4[\w.-]*\.md$/], 7012: [/^k6[\w.-]*\.md$/], 7013: [/^confirm-7u[\w.-]*\.md$/],
  7011: ['m14b.md', 'm14c-bets.md', 'o19-final.md', 'quad-ref.md', 'bridge-reader.md'] });
// written before the Seeds field existed: the launcher's owner check still covers their reserved seeds
export const BEFORE_SEEDS = [...BEFORE_REGIMEN, 'bridge-reader.md'];
// written before the Unmasking field existed (RULES.md section 9, the maintainer's unlock of 26 Sep 16:47 UK); diag-7t.md is the test built
// around the question the field asks (its arms decompose the reader's harm)
export const BEFORE_UNMASKING = [...BEFORE_SEEDS, 'diag-7r.md', 'diag-7s.md', 'diag-7t.md', 'o22-trace.md', 'k5-stage1.md', 'f1v2-test.md', 'f1-test.md', 'bridge-quad.md', 'm14b.md', 'm14c-bets.md', 'o19-final.md', 'quad-ref.md'];
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
  // the unmasking check (RULES.md section 9 rule 2), for every test written after it: the known error the tested arm removes,
  // the baseline behaviour that error drives, and the arm or item that tells 'harmful' from 'unmasks another error'
  if (!(name && BEFORE_UNMASKING.includes(basename(name))) && (!kind || /^test/i.test(kind))) {
    const uf = field('Unmasking');
    if (uf === null) errs.push('missing "- **Unmasking:** <the known error the tested arm removes; the baseline behaviour it drives; the arm or item that tells a harmful change from one that unmasks another error>" or "none: <why the thing tested removes no known error>" (RULES.md section 9)');
    else if (/^none:?\s*$/i.test(uf)) errs.push('"Unmasking: none:" needs a reason');
    else if (!/^none:\s*\S/i.test(uf) && uf.length < 80) errs.push('"Unmasking" must name the known error the arm removes, the baseline behaviour it drives, and the arm or item that separates the two readings (RULES.md section 9)');
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
  // THE SAME ROWS MAY GO (the maintainer, 26 Sep 18:02 UK: "Do all"): a table that says "- **All other rows: SAME**" may leave out
  // the variables that are the same in both arms; every row that is TESTED, ONE ARM ONLY, N/A or ACCEPTED is still written,
  // with its reason, and the reducers' gates still check the settings the runs print
  const allSame = /^\s*-?\s*\**\s*All other rows:?\s*\**\s*SAME\b/im.test(table);
  if (!allSame) for (const v of VARIABLES) if (!seen.has(v.n)) errs.push(`fair-test table has no row for variable ${v.n} (${v.name.slice(0, 40)}) - write it, or leave out only rows that are SAME and add the line "- **All other rows: SAME**"`);
  if (kind && /^test/i.test(kind) && ![...seen.values()].some(c => (c[4] || '').toUpperCase().startsWith('TESTED'))) errs.push('a test needs at least one TESTED row - the thing it is about');
  return errs;
}

export const OUTCOMES_FROM = Date.parse('2026-09-30T19:30:00+01:00');
export const OUTCOME_WORDS = ['HELD', 'FALSIFIED', 'INCONCLUSIVE'];
/* the reducer's plants against the prediction's outcomes; returns the problems */
export function outcomeProblems(predText, plantedOutput) {
  const items = [...String(plantedOutput).matchAll(/^OUTCOMES REACHED: item (\S+): (.+)$/gm)].map(m => ({ item: m[1], outcomes: new Set(m[2].split(',').map(x => x.trim()).filter(Boolean)) }));
  if (!items.length) return ['the reducer\'s --planted run prints no "OUTCOMES REACHED: item <n>: ..." line'];
  const P = [];
  // the prediction's own items (its Credence section's "N (OUTCOME)", else "Item N" in its Decision rule or Prediction):
  // each needs its line, so a reducer cannot pass by printing only the items it covers (the plan-auditor's MINOR 2, 30 Sep)
  const sec = h => (new RegExp(`^## ${h}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(String(predText)) || [])[1] || '';
  let want = [...sec('Credence').matchAll(/(?:^|[:;]\s*)(\d+)\s*\((?:HELD|FALSIFIED|INCONCLUSIVE)\)/gm)].map(m => m[1]);
  if (!want.length) want = [...`${sec('Decision rule')}\n${sec('Prediction')}`.matchAll(/\bItem (\d+)\b/g)].map(m => m[1]);
  for (const n of new Set(want)) if (!items.some(it => it.item === n)) P.push(`item ${n}: the reducer prints no OUTCOMES REACHED line for it`);
  for (const it of items) if (it.outcomes.size < 3) P.push(`item ${it.item}: its plants reach ${[...it.outcomes].join(', ') || 'nothing'}, fewer than 3 outcomes`);
  const fed = (/^## Decision fed[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(String(predText)) || [])[1] || '';
  const all = new Set(items.flatMap(it => [...it.outcomes]));
  for (const w of OUTCOME_WORDS) if (new RegExp(`\\b${w}\\b`).test(fed) && !all.has(w)) P.push(`the Decision fed names ${w}, which no plant reaches`);
  return P;
}
export const reducerOf = predText => (/^- \*\*Run:\*\*.*?\b(reduce-[\w-]+\.mjs)/m.exec(String(predText)) || [])[1] || null;

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
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv[2] === '--outcomes') {
  const pred = process.argv[3];
  if (!pred || !existsSync(pred)) { console.error('usage: check-prediction.mjs --outcomes <prediction.md>'); process.exit(2); }
  const text = readFileSync(pred, 'utf8');
  let first = null; try { first = Date.parse(execFileSync('git', ['log', '--diff-filter=A', '--format=%cI', '--', pred]).toString().trim().split('\n').pop()); } catch { first = null; }
  if (first !== null && !Number.isNaN(first) && first < OUTCOMES_FROM) { console.log(`outcomes: ${basename(pred)} was registered before outcome coverage (exempt)`); process.exit(0); }
  if (!/^- \*\*Kind:\*\*\s*test/mi.test(text)) { console.log('outcomes: a measurement has no outcomes to reach'); process.exit(0); }
  const red = reducerOf(text);
  if (!red || !existsSync(`research/solver/${red}`)) { console.log(`outcome coverage refuses this launch: the Run line names no reducer (reduce-<name>.mjs) that exists${red ? ` (${red})` : ''}`); process.exit(1); }
  let out = ''; try { out = execFileSync('node', [`research/solver/${red}`, '--planted']).toString(); } catch (e) { console.log(`outcome coverage refuses this launch: ${red} --planted failed\n${String(e.stdout || '')}`); process.exit(1); }
  const P = outcomeProblems(text, out);
  if (P.length) { console.log(`outcome coverage refuses this launch (${red}):\n${P.map(e => `  - ${e}`).join('\n')}`); process.exit(1); }
  console.log(`outcomes: ${red} reaches every registered outcome (${out.split('\n').filter(l => l.startsWith('OUTCOMES REACHED')).join('; ')})`);
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
