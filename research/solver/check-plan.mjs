/*
 * THE PLAN CHECKER (RULES.md: how each rule is enforced). Run by the git pre-commit hook, by GitHub CI on every push,
 * and by Claude Code's Stop hook before a turn may end. Everything it checks is mechanical; the judgement calls go to
 * the plan-auditor agent (.claude/agents/plan-auditor.md).
 *
 *   node research/solver/check-plan.mjs              the working tree; new lines against the upstream branch (or HEAD)
 *   node research/solver/check-plan.mjs --staged     what is staged; new lines against HEAD (the pre-commit hook)
 *   node research/solver/check-plan.mjs --range A..B commit B; new lines are those added between A and B (CI)
 *
 * WHOLE-FILE CHECKS
 *   checklist   PLAN.md's checklist block is word for word research/solver/CHECKLIST.md, which has at most 12 items
 *   variables   RULES.md's variable table is exactly fair-variables.mjs's list
 *   clock       PLAN.md declares its clock (UK time)
 *   ledger      every re-look ledger row has an evidence cell: results files that exist, the fair-test outcome and the
 *               prediction (or "decision:" for a maintainer decision); every decimal figure in the settled-result cell
 *               appears in a cited results file; a failed fair test is marked PROVISIONAL
 *   register    every open odd result has an owner and a gate to be resolved by; a row below materiality reads "noted,
 *               below materiality: <largest plausible effect on the panel mean, under 0.1 points> (evidence: ...)"
 *   bugs        every bug entry from 24 Sep on says "Same pattern searched:"
 *   schedule    every pending schedule row that names a batch script names its registered prediction
 *   predictions every prediction file the plan names exists and passes check-prediction.mjs
 *   finished    no "COMPLETED" section is left in PLAN.md (it moves to PLAN-HISTORY.md)
 *   defaults    the decided-defaults block parses (plan-defaults.test.mjs compares it with the code)
 * NEW-LINE CHECKS (lines this change adds to PLAN.md)
 *   no-effect   "unaffected", "does not change", "no effect" ... carry "evidence:" of grade A or B (RULES.md section 8), or
 *               "NOT CHECKED", on the same line
 *   claims      "settled", "shows", "causes", "costs nothing", used as a claim (not "not settled", "until settled" ...),
 *               carry a grade A or B citation, or NOT CHECKED or PROVISIONAL, on the same line (RULES.md section 8)
 *   grade       a new ledger row's evidence cell names its evidence grade, A to D (a maintainer's decision row excepted)
 *   clock       no new time is written in UTC
 */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownTable } from './fair-variables.mjs';
import { checkPredictionText } from './check-prediction.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../..');
export const MAX_CHECKLIST = 12;
export const BUG_SWEEP_FROM = 24;   // bug entries dated this day of Sep 2026 and later need the sweep line

const norm = s => s.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean).join('\n');
const between = (text, a, b) => { const i = text.indexOf(a); if (i < 0) return null; const j = text.indexOf(b, i + a.length); return j < 0 ? null : text.slice(i + a.length, j); };
const cellsOf = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim());

function tableAfter(text, marker) {
  const i = text.indexOf(marker);
  if (i < 0) return null;
  const lines = text.slice(i + marker.length).split('\n');
  let k = 0; while (k < lines.length && !lines[k].trim().startsWith('|')) { if (lines[k].trim() && k > 3) return null; k++; }
  const rows = [];
  for (; k < lines.length && lines[k].trim().startsWith('|'); k++) rows.push(lines[k]);
  return rows.length >= 2 ? { header: cellsOf(rows[0]), rows: rows.slice(2).map(r => ({ raw: r, cells: cellsOf(r) })) } : null;
}

/* strip what should not trigger the no-effect check: quotations, code, struck-through text */
function unquoted(line, strike = { open: false, paired: false }) {
  // a strikethrough can span lines: start struck if the paragraph opened one above, and drop one that runs off the end -
  // but only in a paragraph whose ~~ pair up, so a stray ~~ strikes nothing (a claim after it is still read)
  let l = (strike.open ? '~~' : '') + line;
  l = l.replace(/~~[^~]*~~/g, ' ');
  if (strike.paired) l = l.replace(/~~.*$/, ' ');
  return l.replace(/`[^`]*`/g, ' ').replace(/"[^"]*"/g, ' ').replace(/“[^”]*”/g, ' ');
}
/* where this line sits in its paragraph's strikethroughs: open = it starts inside one opened above; paired = the
   paragraph's ~~ come in pairs (an odd count means a stray, and then nothing spans lines) */
function strikeAt(planLines, line) {
  const i = planLines.indexOf(line);
  if (i < 0) return { open: false, paired: false };
  let a = i, b = i, above = 0, total = 0;
  while (a > 0 && planLines[a - 1].trim()) a--;
  while (b + 1 < planLines.length && planLines[b + 1].trim()) b++;
  for (let k = a; k <= b; k++) { const n = (planLines[k].match(/~~/g) || []).length; total += n; if (k < i) above += n; }
  const paired = total % 2 === 0;
  return { open: paired && above % 2 === 1, paired };
}
export const NO_EFFECT = /\b(unaffected|not affected|does not (change|affect|matter)|doesn't (change|affect|matter)|do not (change|affect)|don't (change|affect)|no effect|cannot (change|affect)|can't (change|affect)|makes no difference|never changes)\b/i;
const EVIDENCED = /(evidence:|not checked|proof:)/i;
// the regimen's claim linting (RULES.md section 8, evidence item 1): a claim word needs a grade A or B citation
// the claim forms only: "is settled", "settled by / that / :", "shows that", "shows no", "causes", "costs nothing" - not
// "a settled result", "the table shows" or "until it is settled"
export const CLAIM = /\b(?:is|are|was|were|now|thus|so|hence)\s+(settled)\b|\b(settled)\s*(?::|\bby\b|\bthat\b)|\b(shows)\s+(?:that|no)\b|(?<!\bthe\s)\b(causes)\b|\b(costs nothing)\b/i;
const NOT_A_CLAIM = /\b(?:not|never|nothing|until|once|when|if|before|whether|is it|was it)\s+(?:yet\s+|been\s+|be\s+|is\s+|was\s+)?settled\b|\bsettles nothing\b|\bunsettled\b/gi;
const GRADE_AB = /\bgrade [AB]\b/i;

export function checkPlan({ plan, rules, checklist, added = [], readSolverFile, solverFileExists }) {
  const E = [];
  const err = (check, msg) => E.push(`[${check}] ${msg}`);

  // checklist
  const items = checklist.split('\n').filter(l => /^\s*\d+\.\s/.test(l));
  if (!items.length) err('checklist', 'CHECKLIST.md has no numbered items');
  if (items.length > MAX_CHECKLIST) err('checklist', `CHECKLIST.md has ${items.length} items; at most ${MAX_CHECKLIST} (long rule lists are followed less - RULES.md)`);
  const block = between(plan, '<!-- checklist:start -->', '<!-- checklist:end -->');
  if (block === null) err('checklist', 'PLAN.md has no <!-- checklist:start --> ... <!-- checklist:end --> block');
  else if (norm(block) !== norm(checklist)) err('checklist', "PLAN.md's checklist block differs from research/solver/CHECKLIST.md (copy it across word for word)");

  // variables
  const vt = between(rules, '<!-- variables:start -->', '<!-- variables:end -->');
  if (vt === null) err('variables', 'RULES.md has no <!-- variables:start --> ... <!-- variables:end --> block');
  else if (norm(vt) !== norm(markdownTable())) err('variables', "RULES.md's variable table differs from fair-variables.mjs (regenerate: node research/solver/fair-variables.mjs --markdown)");

  // clock
  if (!/\*\*Clock\.\*\*\s+Times in this file are UK time/.test(plan)) err('clock', 'PLAN.md must declare "**Clock.** Times in this file are UK time ..."');

  // ledger
  const L = tableAfter(plan, '**The re-look ledger**');
  if (!L) err('ledger', 'no table under "**The re-look ledger**"');
  else {
    const h = L.header.map(x => x.toLowerCase());
    if (h.length !== 4 || h[3] !== 'evidence') err('ledger', `the ledger header must be | date | the settled result | what it changed | evidence | (found ${L.header.length} columns)`);
    for (const { cells } of L.rows) {
      const tag = `row "${(cells[0] || '').slice(0, 20)}"`;
      if (cells.length !== 4) { err('ledger', `${tag}: ${cells.length} cells, need 4`); continue; }
      const ev = cells[3];
      if (/\bdecision:/i.test(ev) && !/results:/i.test(ev)) continue;
      for (const k of ['results:', 'fair-test:', 'prediction:']) if (!ev.toLowerCase().includes(k)) err('ledger', `${tag}: the evidence cell needs "${k}"`);
      const files = [...ev.matchAll(/results-[\w.-]+\.txt/g)].map(m => m[0]);
      for (const f of files) if (!solverFileExists(f)) err('ledger', `${tag}: cites ${f}, which does not exist`);
      const preds = [...ev.matchAll(/predictions\/[\w.-]+\.md/g)].map(m => m[0]);
      for (const p of preds) if (!solverFileExists(p)) err('ledger', `${tag}: cites ${p}, which does not exist`);
      const ft = /fair-test:\s*([^;|]*)/i.exec(ev);
      if (ft) {
        const v = ft[1].trim().toLowerCase();
        if (!/^(pass|fail|n\/a|accepted)/.test(v)) err('ledger', `${tag}: fair-test must be pass, fail, n/a or accepted (found "${ft[1].trim().slice(0, 20)}")`);
        else if (/^(n\/a|accepted)/.test(v) && v.replace(/^(n\/a|accepted)/, '').replace(/[\s:,()-]/g, '').length < 6) err('ledger', `${tag}: fair-test ${v.split(/\s/)[0]} needs a reason`);
        if (/^fail/.test(v) && !/(provisional|not settled)/i.test(cells.join(' '))) err('ledger', `${tag}: a failed fair test must be marked PROVISIONAL`);
      }
      const pr = /prediction:\s*([^;|]*)/i.exec(ev);
      if (pr && !/predictions\/[\w.-]+\.md/.test(pr[1]) && pr[1].replace(/^\s*none\b/i, '').replace(/[\s:,()-]/g, '').length < 6) err('ledger', `${tag}: prediction "none" needs a reason`);
      // every decimal figure in the settled result must be in a cited results file
      const figs = [...cells[1].replace(/−/g, '-').matchAll(/[-+]?\d+\.\d+/g)].map(m => m[0]);
      if (figs.length) {
        if (!files.length) err('ledger', `${tag}: quotes figures (${figs.slice(0, 3).join(', ')}) but cites no results file`);
        else {
          const text = files.filter(f => solverFileExists(f)).map(f => readSolverFile(f)).join('\n').replace(/−/g, '-');
          for (const x of figs) if (!text.includes(x) && !text.includes(x.replace(/^[-+]/, ''))) err('ledger', `${tag}: the figure ${x} is not in ${files.join(', ')} (figures come from a script's output)`);
        }
      }
    }
  }

  // register
  const R = tableAfter(plan, '## Odd results register');
  if (!R) err('register', 'no table under "## Odd results register"');
  else {
    const want = ['id', 'what', 'found', 'owner', 'resolve by', 'status'];
    if (R.header.map(x => x.toLowerCase()).join('|') !== want.join('|')) err('register', `the register header must be | ${want.join(' | ')} |`);
    const seen = new Set();
    for (const { cells } of R.rows) {
      const [id, what, , owner, by, status = ''] = cells;
      if (seen.has(id)) err('register', `${id}: duplicate id`); seen.add(id);
      if (!what) err('register', `${id}: says nothing`);
      const st = status.toLowerCase();
      if (!/^(open|resolved|closed|noted)\b/.test(st)) err('register', `${id}: status must start with open, resolved, closed or noted`);
      if (/^noted/.test(st)) {
        const est = /([\d.]+)\s*points?\b/.exec(st);
        if (!/^noted, below materiality\b/.test(st) || !est || !(Number(est[1]) < 0.1) || !/evidence:/.test(st)) err('register', `${id}: a noted row reads "noted, below materiality: <the largest plausible effect on the panel mean, under 0.1 points> (evidence: ...)" (RULES.md section 8)`);
      }
      if (/^open/.test(st) && (!owner || owner === '-' || owner === '?' || !by || by === '-' || by === '?')) err('register', `${id}: an open odd result needs an owner and a gate to be resolved by`);
      if (/^(resolved|closed)/.test(st) && st.replace(/^(resolved|closed)/, '').replace(/[\s:,()-]/g, '').length < 6) err('register', `${id}: say how it was resolved or why it was closed`);
    }
  }

  // bugs
  const lines = plan.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^###\s+Bugs found and fixed on (\d+) Sep/.exec(lines[i]);
    if (!m || Number(m[1]) < BUG_SWEEP_FROM) continue;
    let k = i + 1, cur = null;
    const bullets = [];
    for (; k < lines.length && !/^#{1,3}\s/.test(lines[k]); k++) {
      if (/^- /.test(lines[k])) { cur = [lines[k]]; bullets.push(cur); } else if (cur && /^\s+\S/.test(lines[k])) cur.push(lines[k]); else if (!lines[k].trim()) cur = null;
    }
    for (const b of bullets) if (!/Same pattern searched:/i.test(b.join(' '))) err('bugs', `${m[1]} Sep: "${b[0].slice(2, 60)}..." has no "Same pattern searched:" line`);
  }

  // schedule
  const S = between(plan, '## The schedule', '\n## ') ?? '';
  for (const row of S.split('\n').filter(l => l.startsWith('|'))) {
    const c = cellsOf(row);
    if (!/batch-[\w.-]+\.sh/.test(row)) continue;
    if (/~~/.test(c[0] || '') || /\b(done|cancelled|expired)\b/i.test(c[c.length - 1] || '')) continue;
    if (!/predictions\/[\w.-]+\.md/.test(row)) err('schedule', `pending row "${(c[0] || '').slice(0, 10)} ${(c[1] || '').slice(0, 40)}" names a batch but no registered prediction (predictions/<name>.md)`);
  }

  // predictions named anywhere in the plan
  for (const p of new Set([...plan.matchAll(/predictions\/[\w.-]+\.md/g)].map(m => m[0]))) {
    if (!solverFileExists(p)) { err('predictions', `${p} is named in the plan but does not exist`); continue; }
    const errs = checkPredictionText(readSolverFile(p), { name: p });
    if (errs.length) err('predictions', `${p}: ${errs[0]}${errs.length > 1 ? ` (+${errs.length - 1} more)` : ''}`);
  }

  // finished sections belong in the history
  for (const l of lines) if (/^#{2,3}\s.*\bCOMPLETED\b/.test(l)) err('finished', `"${l.slice(0, 60)}" is finished: move it to PLAN-HISTORY.md`);

  // decided defaults
  const dd = between(plan, '<!-- decided-defaults', '-->');
  if (dd === null) err('defaults', 'PLAN.md has no <!-- decided-defaults {json} --> block');
  else { try { JSON.parse(dd); } catch (e) { err('defaults', `the decided-defaults block is not JSON: ${e.message}`); } }

  // new lines
  const planLines = plan.split('\n');
  const LR = tableAfter(plan, '**The re-look ledger**'), ledgerRow = new Map((LR ? LR.rows : []).map(r => [r.raw.trim(), r.cells]));
  for (const raw of added) {
    const line = unquoted(raw, strikeAt(planLines, raw));
    if (NO_EFFECT.test(line) && !EVIDENCED.test(raw)) err('no-effect', `"${raw.trim().slice(0, 90)}": a claim of no effect needs "evidence: <file or proof>" or "NOT CHECKED" on the same line`);
    else if (NO_EFFECT.test(line) && !/not checked/i.test(raw) && !GRADE_AB.test(raw)) err('no-effect', `"${raw.trim().slice(0, 90)}": a claim of no effect needs evidence of grade A or B, named on the same line ("grade A" or "grade B"; RULES.md section 8)`);
    if (CLAIM.test(line.replace(NOT_A_CLAIM, ' ')) && !GRADE_AB.test(raw) && !/not checked|provisional/i.test(raw)) err('claims', `"${raw.trim().slice(0, 90)}": "${CLAIM.exec(line.replace(NOT_A_CLAIM, ' ')).slice(1).find(Boolean)}" is a claim: name its grade A or B evidence on the same line, or write NOT CHECKED or PROVISIONAL (RULES.md section 8)`);
    const lc = ledgerRow.get(raw.trim());
    if (lc && lc.length === 4 && !(/\bdecision:/i.test(lc[3]) && !/results:/i.test(lc[3])) && !/\bgrade [ABCD]\b/i.test(lc[3])) err('grade', `row "${(lc[0] || '').slice(0, 20)}": a new ledger row names its evidence grade in the evidence cell ("grade A" to "grade D"; RULES.md section 8)`);
    if (/\b\d{1,2}:\d{2}\b/.test(raw) && /\bUTC\b/.test(raw) && !/\bUK\b/.test(raw)) err('clock', `"${raw.trim().slice(0, 70)}": write times in UK time, not UTC`);
  }
  return E;
}

/* ---- reading the tree, the index or a commit ---- */
const git = (cmd, opts = {}) => execSync(`git ${cmd}`, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20, ...opts }).toString();
function source(mode, rev) {
  const rel = p => `research/solver/${p}`;
  if (mode === 'staged') return p => { try { return git(`show :${rel(p)}`); } catch { return readFileSync(join(HERE, p), 'utf8'); } };
  if (mode === 'rev') return p => git(`show ${rev}:${rel(p)}`);
  return p => readFileSync(join(HERE, p), 'utf8');
}
function exists(mode, rev) {
  if (mode === 'rev') return p => { try { git(`cat-file -e ${rev}:research/solver/${p}`); return true; } catch { return false; } };
  return p => existsSync(join(HERE, p));
}
function addedLines(diffText) { return diffText.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1)); }

export function runCli(argv = process.argv.slice(2)) {
  let mode = 'tree', rev = null, added = [], base = null;
  const PLAN = 'research/solver/PLAN.md';
  try {
    if (argv.includes('--staged')) { mode = 'staged'; added = addedLines(git(`diff --cached -U0 -- ${PLAN}`)); base = 'HEAD'; }
    else if (argv.find(a => a.startsWith('--range'))) {
      const r = (argv.find(a => a.startsWith('--range=')) || '').slice(8) || argv[argv.indexOf('--range') + 1];
      const [a, b] = r.split('..');
      mode = 'rev'; rev = b || 'HEAD';
      if (a && !/^0+$/.test(a)) { try { git(`cat-file -e ${a}^{commit}`); base = a; } catch { base = null; } }
      if (!base) { try { base = git(`merge-base origin/main ${rev}`).trim(); } catch { base = null; } }
      added = base ? addedLines(git(`diff -U0 ${base} ${rev} -- ${PLAN}`)) : [];
    } else {
      try { base = git('rev-parse --abbrev-ref --symbolic-full-name @{upstream}').trim(); } catch { base = 'HEAD'; }
      added = addedLines(git(`diff -U0 ${base} -- ${PLAN}`));
    }
  } catch (e) { console.error(`check-plan: git failed (${e.message.split('\n')[0]})`); return 2; }
  const read = source(mode, rev), has = exists(mode, rev);
  const errs = checkPlan({ plan: read('PLAN.md'), rules: read('RULES.md'), checklist: read('CHECKLIST.md'), added, readSolverFile: read, solverFileExists: has });
  if (errs.length) {
    console.log(`PLAN CHECK FAILED (${errs.length}) - ${mode === 'rev' ? `commit ${rev}` : mode}${base ? `, new lines against ${/^[0-9a-f]{40}$/.test(base) ? base.slice(0, 12) : base}` : ''}:`);
    for (const e of errs) console.log(`  ${e}`);
    console.log('Fix the plan; do not bypass the check (RULES.md). The rules: research/solver/RULES.md.');
    return 1;
  }
  console.log(`plan check passed (${mode}${base ? `, ${added.length} new line(s) against ${/^[0-9a-f]{40}$/.test(base) ? base.slice(0, 12) : base}` : ''})`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(runCli());
