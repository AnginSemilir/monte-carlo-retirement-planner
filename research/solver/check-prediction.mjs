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
 * THE DECISION TABLE AND THE MECHANISM (the process review, deep-review-log.md 4 Oct 13:52 UK; the maintainer's unlock of 4 Oct:
 * 'Agree, do all'): a test registered from DECISION_FROM on (its file first committed then or later, or not yet committed)
 * carries
 *   - "## Decision table": rows "| <outcome combination> | <action> | <credence> |", the credences summing to 1 (0.95 to
 *     1.05), two actions or more; the chance the action changes - one less the credence of the most likely action - is a
 *     quarter or more, or the section carries "- **Waiver:** <why the test is worth running anyway>" (7av's decision fed sent
 *     most of its mass to one action in every branch; a test that cannot change what is done is a diagnostic's job);
 *   - "- **Mechanism:**" naming code anchors, each "<path>:<line> \"<snippet>\"" with the snippet within five lines of that
 *     line in that file, and then a "derive:" line in the Derivation script (the arithmetic of how often the leading
 *     cause applies, per unit; "none:" not accepted), or "none: <why the test attributes nothing>" - refused when the
 *     Question or Prediction speaks of attribution, decomposition or a root cause (the top-cell copy sat in the code for
 *     nine days while 7ar, 7at and 7av decomposed its symptom: the review's grade-A finding).
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

export const DECISION_FROM = Date.parse('2026-10-04T14:30:00+01:00');
const REPO = fileURLToPath(new URL('../../', import.meta.url));
const ATTRIBUTION = /\b(attribut\w*|decompos\w*|root[- ]cause|which (?:part|piece|snap|term|cause)\b|split\w* the (?:blame|harm|gap))/i;
/* the decision table's problems (a test registered from DECISION_FROM on) */
export function decisionTableProblems(text) {
  const sec = section(text, 'Decision table', { note: true });
  if (sec === null) return ['missing section "## Decision table" (rows: outcome combination | action | credence; the process review, 4 Oct)'];
  const rows = sec.split('\n').filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l)).map(l => l.split('|').slice(1, -1).map(c => c.trim())).filter(c => c.length >= 3 && /^0?\.\d+$|^1(\.0+)?$/.test(c[c.length - 1]));
  if (rows.length < 2) return ['"## Decision table" needs two rows or more of "| outcomes | action | credence |" with the credence a number from 0 to 1'];
  const P = [], tot = rows.reduce((t, c) => t + Number(c[c.length - 1]), 0), mass = new Map();
  for (const c of rows) { const a = c[c.length - 2].toLowerCase().replace(/\s+/g, ' '); mass.set(a, (mass.get(a) || 0) + Number(c[c.length - 1])); }
  if (!(tot >= 0.95 && tot <= 1.05)) P.push(`"## Decision table": the credences sum to ${tot.toFixed(3)}, not 1`);
  if (mass.size < 2) P.push('"## Decision table" names one action only: no outcome changes what is done');
  const change = 1 - Math.max(...mass.values()) / (tot || 1);
  const waiver = /^\s*-?\s*\*\*Waiver:\*\*\s*(.{20,})$/m.test(sec);
  if (mass.size >= 2 && change < 0.25 && !waiver) P.push(`"## Decision table": the chance the action changes is ${change.toFixed(3)}, under a quarter - run a cheaper diagnostic, or add "- **Waiver:** <why>" to the section`);
  return P;
}
/* the mechanism field's problems: anchors checked against the files, a derive line after them */
export function mechanismProblems(text, { root = REPO } = {}) {
  const m = /^-\s+\*\*Mechanism:\*\*\s*(.+)$/mi.exec(text);
  if (!m) return ['missing "- **Mechanism:** <path>:<line> \"<snippet>\" ... (code anchors for the cause, with a derive line printing how often it applies per unit)" or "none: <why the test attributes nothing>" (the process review, 4 Oct)'];
  const f = m[1].trim(), asks = ATTRIBUTION.test(`${section(text, 'Question') || ''}\n${section(text, 'Prediction') || ''}`);
  if (/^none:/i.test(f)) {
    if (f.replace(/^none:\s*/i, '').length < 20) return ['"Mechanism: none:" needs a reason'];
    return asks ? ['"Mechanism: none:" is not accepted: the Question or Prediction attributes, decomposes or names a root cause - anchor the mechanism in the code and derive its incidence first'] : [];
  }
  const anchors = [...f.matchAll(/([\w./-]+\.(?:m?js|sh|cjs)):(\d+)\s+"([^"]{6,})"/g)];
  if (!anchors.length) return ['"Mechanism" names no anchor of the form <path>:<line> "<snippet>"'];
  const P = [];
  for (const [, path, line, snip] of anchors) {
    const file = [path, `src/solver/${path}`, `research/solver/${path}`].map(x => root + x).find(x => existsSync(x));
    if (!file) { P.push(`Mechanism anchor ${path}: no such file`); continue; }
    const L = readFileSync(file, 'utf8').split('\n'), n = Number(line);
    if (!L.slice(Math.max(0, n - 6), n + 5).join('\n').includes(snip)) P.push(`Mechanism anchor ${path}:${line}: "${snip.slice(0, 40)}" is not within five lines of line ${line}`);
  }
  const der = section(text, 'Derivation script', { note: true }) || '';
  if (![...der.matchAll(DERIVE)].length) P.push('a Mechanism with anchors needs a "derive:" line in the Derivation script (how often the cause applies, per unit; "none:" not accepted)');
  return P;
}
// every prediction's first-commit time, from one git call per process (a call per file took minutes under load)
let ADDED = null;
const addedMap = () => {
  if (ADDED) return ADDED;
  ADDED = new Map();
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--name-only', '--format=@%cI', '--', 'research/solver/predictions'], { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString();
    let at = null;
    for (const l of out.split('\n')) { if (l.startsWith('@')) at = Date.parse(l.slice(1)); else if (l.trim()) ADDED.set(basename(l.trim()), at); }
  } catch { /* not a git checkout: every file reads as uncommitted */ }
  return ADDED;
};
export const committedAt = name => (addedMap().has(basename(name)) ? addedMap().get(basename(name)) : null);
// held to the decision table and the mechanism: a file on disk first committed from DECISION_FROM on or not yet committed
// (fixtures checked by name only, and texts with no name, are not; `decision: true` forces it)
// a name is found as given or under research/solver (check-plan passes 'predictions/x.md'; the plan-auditor's MINOR 3 of 4 Oct)
const onDisk = name => !!name && (existsSync(name) || existsSync(REPO + 'research/solver/' + name));
// `at` stands in for the first-commit time in a test (no prediction is committed after DECISION_FROM yet)
export const heldToDecision = (name, opts = {}) => opts.decision === true || (onDisk(name) && (t => t === null || Number.isNaN(t) || t >= DECISION_FROM)('at' in opts ? opts.at : committedAt(name)));

// CREDENCES DERIVED (the maintainer's 'unlock enforcement' of 5 Oct, on the deep review of the prediction record,
// deep-review-log.md 5 Oct 10:16 UK: every credence so far judged, none computed from the Power section's stories, and one
// contradicting its own point). A test first committed from CREDENCE_FROM on gives each item its full distribution
// ("- **Item N:** HELD p, INCONCLUSIVE q, FALSIFIED r"), summing to 1, and the author's judged one beside it ("- **Judged,
// item N:** ..."); its derivation script's output (a "derive:" line's file) prints "CREDENCE item N: point X HELD p
// INCONCLUSIVE q FALSIFIED r" (X "-" for an item with no numeric point), each stated probability within CREDENCE_TOL of the
// derived one, and the Point and interval section's line for the item names the derive's point
export const CREDENCE_FROM = Date.parse('2026-10-05T11:20:00+01:00');
export const CREDENCE_TOL = 0.05;
const NUM = String.raw`(\d+(?:\.\d+)?|\.\d+)`;
// a repeated outcome on one line is marked (the plan-auditor's MINOR 1 of 5 Oct 11:37 UK: checked at its last value, scored at its first)
const distOf = s => { const d = {}; for (const m of String(s).matchAll(new RegExp(String.raw`\b(HELD|INCONCLUSIVE|FALSIFIED)\s+` + NUM, 'g'))) { if (m[1] in d) Object.defineProperty(d, 'twice', { value: m[1], enumerable: false }); else d[m[1]] = Number(m[2]); } return d; };
const fullDist = d => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].every(k => k in d);
// the point is the first standalone number on the item's line (a number inside a name, S130, is not one), not any number on it
const firstNum = s => { const m = /(?<![\w.])(-?(?:\d+(?:\.\d+)?|\.\d+))(?![\w])/.exec(String(s)); return m ? Number(m[1]) : NaN; };   // a minus sign kept (the plan-auditor's MINOR 3 after 5b7a773)
export function credenceProblems(text, { root = REPO, readOut = null } = {}) {
  const cred = section(text, 'Credence', { note: true });
  if (cred === null) return ['missing section "## Credence"'];
  const items = new Map(), judged = new Map();
  for (const m of cred.matchAll(/^\s*-\s*\*\*Item (\d+):\*\*\s*([^\n]*)$/gm)) items.set(m[1], distOf(m[2]));
  for (const m of cred.matchAll(/^\s*-\s*\*\*Judged, item (\d+):\*\*\s*([^\n]*)$/gm)) judged.set(m[1], distOf(m[2]));
  if (!items.size) return ['"## Credence" gives no "- **Item N:** HELD p, INCONCLUSIVE q, FALSIFIED r" line (credences derived, the maintainer\'s unlock of 5 Oct)'];
  const P = [];
  // every item the Decision rule names has a credence line (an item with none went unchecked)
  for (const m of (section(text, 'Decision rule', { note: true }) || '').matchAll(/\*\*Item (\d+)\b/g)) if (!items.has(m[1])) P.push(`item ${m[1]}: the Decision rule names it but "## Credence" gives no "- **Item ${m[1]}:**" line`);
  for (const [k, d] of items) {
    if (d.twice) P.push(`item ${k}: ${d.twice} named twice on its credence line (it would be checked at one value and scored at another)`);
    if (!fullDist(d)) { P.push(`item ${k}: its credence names ${Object.keys(d).join(', ') || 'no outcome'}, not all three outcomes`); continue; }
    const s = d.HELD + d.INCONCLUSIVE + d.FALSIFIED;
    if (Math.abs(s - 1) > 0.011) P.push(`item ${k}: its three outcomes sum to ${s.toFixed(3)}, not 1`);
    if (!judged.has(k) || !fullDist(judged.get(k))) P.push(`item ${k}: no "- **Judged, item ${k}:** HELD p, INCONCLUSIVE q, FALSIFIED r" line (the author's judgement, written before the derivation, scored beside it)`);
  }
  // the derivation's CREDENCE lines
  const der = section(text, 'Derivation script', { note: true }) || '';
  const outs = [...der.matchAll(DERIVE)].map(m => m[2]);
  const read = readOut || (f => { const x = [f, `research/solver/${f.replace(/^research\/solver\//, '')}`].map(y => root + y).find(y => existsSync(y)); return x ? readFileSync(x, 'utf8') : null; });
  const derived = new Map();
  for (const o of outs) { const txt = read(o); if (txt) for (const m of txt.matchAll(new RegExp(String.raw`^\s*CREDENCE item (\d+): point (\S+) HELD ` + NUM + String.raw` INCONCLUSIVE ` + NUM + String.raw` FALSIFIED ` + NUM, 'gm'))) derived.set(m[1], { point: m[2], HELD: Number(m[3]), INCONCLUSIVE: Number(m[4]), FALSIFIED: Number(m[5]) }); }
  if (!outs.length) P.push('credences derived: no "derive:" line names the derivation\'s output');
  const pt = section(text, 'Point and interval', { note: true }) || '';
  for (const [k, d] of items) {
    const g = derived.get(k);
    if (!g) { P.push(`item ${k}: the derivation's output prints no "CREDENCE item ${k}: point X HELD p INCONCLUSIVE q FALSIFIED r" line`); continue; }
    if (fullDist(d)) for (const o of ['HELD', 'INCONCLUSIVE', 'FALSIFIED']) if (Math.abs(d[o] - g[o]) > CREDENCE_TOL + 1e-9) P.push(`item ${k}: ${o} stated ${d[o]}, derived ${g[o]} (more than ${CREDENCE_TOL} apart)`);
    if (g.point !== '-') {
      const line = (new RegExp(String.raw`^\s*-\s*\*\*Item ${k}:\*\*([^\n]*)$`, 'm').exec(pt) || [])[1];
      if (!line) P.push(`item ${k}: "## Point and interval" has no "- **Item ${k}:**" line for the derivation's point ${g.point}`);
      else if (firstNum(line) !== Number(g.point)) P.push(`item ${k}: the point stated in "## Point and interval" (its first number, ${firstNum(line)}) is not the derivation's ${g.point} (a credence contradicting its own point)`);
    }
  }
  return P;
}
/* THE BOUNDARY BY ANCESTRY (the maintainer's 'unlock enforcement' of 5 Oct, the second; the plan-auditor's MINOR 1 of 11:37 UK:
   a back-dated commit or a reused file name exempted a prediction from the date rule). A prediction is exempt only if the
   commit that last added its exact path is an ancestor of the boundary commit - the unlock's own (d4487bd) for the credence
   rule, the second unlock's base (ed5db5c) for the judged-order and base-rate rules; a file re-added after the boundary is
   held, whatever its commit date. `at` stands in for the commit time in the date-based planted cases. */
export const CREDENCE_BOUNDARY = 'd4487bd', JUDGED_BOUNDARY = 'ed5db5c';
const PRED_DIR = 'research/solver/predictions/';
let LATEST = null; const ANC = new Map();
const latestAdd = () => {
  if (LATEST) return LATEST;
  LATEST = new Map();
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--name-only', '--format=@%H', '--', PRED_DIR], { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString();
    let c = null;   // newest first: the first commit seen for a path is its latest add
    for (const l of out.split('\n')) { if (l.startsWith('@')) c = l.slice(1); else if (l.trim() && !LATEST.has(l.trim())) LATEST.set(l.trim(), c); }
  } catch { /* not a git checkout: every file reads as uncommitted */ }
  return LATEST;
};
const ancestorsOf = b => {
  if (!ANC.has(b)) { let s = new Set(); try { s = new Set(execFileSync('git', ['rev-list', b], { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString().split('\n').filter(Boolean)); } catch { /* no such commit: nothing is exempt */ } ANC.set(b, s); }
  return ANC.get(b);
};
export const exemptBy = (commit, ancestors) => !!commit && ancestors.has(commit);
const pathOf = name => PRED_DIR + basename(String(name));
const heldBy = (name, boundary) => !exemptBy(latestAdd().get(pathOf(name)), ancestorsOf(boundary));
export const heldToCredence = (name, opts = {}) => opts.credence === true || (onDisk(name) && ('at' in opts ? (t => t === null || Number.isNaN(t) || t >= CREDENCE_FROM)(opts.at) : heldBy(name, CREDENCE_BOUNDARY)));
export const heldToJudged = (name, opts = {}) => opts.judged === true || (onDisk(name) && heldBy(name, JUDGED_BOUNDARY));

/* JUDGED BEFORE DERIVED (the second unlock): the commit that first carries the prediction's "- **Judged, item" lines is a
   strict ancestor of the commit that first adds its derivation's output file; judged lines arriving with or after the
   derivation are refused, and lines not yet committed are refused once the derivation's output is committed (commit the
   judgement alone first). "Judged: none" declines to judge; the decisive check (O29) then leaves the test out. `git` is the
   runner (a stand-in in the planted cases). */
const gitRun = args => { try { return execFileSync('git', args, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return null; } };
export function judgedOrderProblems(name, text, { git = gitRun } = {}) {
  if (/^\s*-\s*\*\*Judged:\*\*\s*none\b/mi.test(text)) return [];
  const outs = [...(section(text, 'Derivation script', { note: true }) || '').matchAll(DERIVE)].map(m => m[2]);
  if (!outs.length) return [];   // credenceProblems names the missing derive line
  const first = args => { const o = git(args); return o === null ? null : (o.trim().split('\n').filter(Boolean)[0] || null); };
  const J = first(['log', '--reverse', '--format=%H', '-S', '**Judged, item', '--', pathOf(name)]);
  const out = outs[0].startsWith('research/') ? outs[0] : `research/solver/${outs[0]}`;
  const D = first(['log', '--diff-filter=A', '--reverse', '--format=%H', '--', out]);
  if (!J && !D) return [`the judged credences and the derivation's output (${out}) are both uncommitted: commit the "Judged, item" lines alone first, then run the derivation (judged before derived, the second unlock of 5 Oct)`];
  if (!J) return [`the derivation's output (${out}) is committed but the "Judged, item" lines are not: a judgement written after the derivation tells the decisive check nothing (or write "- **Judged:** none")`];
  if (!D) return [];
  if (J === D) return [`the "Judged, item" lines and the derivation's output arrive in one commit (${J.slice(0, 7)}): commit the judgement first`];
  if (git(['merge-base', '--is-ancestor', J, D]) === null) return [`the "Judged, item" lines (${J.slice(0, 7)}) were committed after the derivation's output (${D.slice(0, 7)}): judged before derived`];
  // and not edited since: the judged lines as they stood when the derivation's output was added are the ones here (the
  // plan-auditor's MINOR 1 after 5b7a773: git log -S sees only a change in how often the string occurs, not in the numbers)
  const judgedOf = s => String(s).split('\n').filter(l => /^\s*-\s*\*\*Judged, item/.test(l)).map(l => l.trim()).join('\n');
  const then = git(['show', `${D}:${pathOf(name)}`]);
  if (then === null) return [`the prediction does not exist at the derivation's commit (${D.slice(0, 7)}): its judged lines there cannot be read`];
  if (judgedOf(then) !== judgedOf(text)) return [`the "Judged, item" lines differ from those at the derivation's commit (${D.slice(0, 7)}): a judgement edited after the derivation tells the decisive check nothing`];
  return [];
}
/* A BASE RATE ON EVERY ITEM (the second unlock): each item carries "- **Base rate, item N:** p", p within 0.01 of a rate on
   results-scorecard.txt's KIND BASE RATES line (a kind's, or the deep-review record's) - the derivation starts there */
// the rates are read from results-scorecard.txt as committed with the prediction's own latest add (the plan-auditor's MINOR 2
// after 5b7a773: the live scorecard moves with every scored test, and a registered prediction must not start failing), the
// working copy for a prediction not yet committed
export function baseRateProblems(text, { scorecard = null, name = null, git = gitRun } = {}) {
  const cred = section(text, 'Credence', { note: true }) || '';
  const added = name ? latestAdd().get(pathOf(name)) : null, atAdd = added ? git(['show', `${added}:research/solver/results-scorecard.txt`]) : null;
  const sc = scorecard ?? atAdd ?? (existsSync(REPO + 'research/solver/results-scorecard.txt') ? readFileSync(REPO + 'research/solver/results-scorecard.txt', 'utf8') : '');
  const line = (/^KIND BASE RATES[^:]*: (.*)$/m.exec(sc) || [])[1];
  if (!line) return ['results-scorecard.txt has no KIND BASE RATES line to take a base rate from'];
  const rates = [...line.matchAll(/\b(\d\.\d\d) \(\d+ of \d+/g)].map(m => Number(m[1]));
  const P = [];
  for (const m of cred.matchAll(/^\s*-\s*\*\*Item (\d+):\*\*/gm)) {
    const b = new RegExp(String.raw`^\s*-\s*\*\*Base rate, item ${m[1]}:\*\*\s*` + NUM, 'm').exec(cred);
    if (!b) P.push(`item ${m[1]}: no "- **Base rate, item ${m[1]}:** p" line (its kind's rate from results-scorecard.txt's KIND BASE RATES)`);
    else if (!rates.some(r => Math.abs(r - Number(b[1])) <= 0.01 + 1e-9)) P.push(`item ${m[1]}: its base rate ${b[1]} is no rate on the KIND BASE RATES line (${rates.join(', ')})`);
  }
  return P;
}

export function checkPredictionText(text, { name, decision, credence, judged } = {}) {
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
  if ((!kind || /^test/i.test(kind)) && heldToDecision(name, { decision })) errs.push(...decisionTableProblems(text), ...mechanismProblems(text));
  if ((!kind || /^test/i.test(kind)) && heldToCredence(name, { credence })) errs.push(...credenceProblems(text));
  if ((!kind || /^test/i.test(kind)) && heldToJudged(name, { judged })) errs.push(...baseRateProblems(text, { name }), ...judgedOrderProblems(name, text));
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
// EDGES (the deep review's first retirement pass, 3 Oct 18:09 UK: design in 5 of 5 closes - a gap clipped at 0, an empty class
// read as data, a band a snap falls past): a test first committed from EDGES_FROM on has a reducer whose --planted run prints
// "EDGES: <case>, <case>, ..." naming at least two planted boundary cases it reads correctly (a missing or zero value, an empty
// class, a value at or past a threshold); what they are is the reviewer's to judge, that they exist is checked here
export const EDGES_FROM = Date.parse('2026-10-03T19:00:00+01:00');
export function edgeProblems(plantedOutput) {
  const m = /^EDGES: (.+)$/m.exec(String(plantedOutput));
  if (!m) return ['the reducer\'s --planted run prints no "EDGES: <case>, <case>, ..." line (planted boundary cases)'];
  const cases = m[1].split(',').map(x => x.trim()).filter(Boolean);
  return cases.length >= 2 ? [] : [`the EDGES line names ${cases.length} planted boundary case, fewer than 2`];
}
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
  const P = [...outcomeProblems(text, out), ...(first === null || Number.isNaN(first) || first >= EDGES_FROM ? edgeProblems(out) : [])];
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
