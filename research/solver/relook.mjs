// THE RE-LOOK LIST (research/solver/drafts/framework-feedback-review.md, A1; the most common FAIL: a result or decision
// that moves an item, and the live rows naming that item left as they were). Takes the item ids on the lines PLAN.md's
// change adds - a new ledger row's bold headline and the keys of the live rows it edits (O12, 7al, P, Q, E3, ...) - or
// ids given on the command line, and prints every OPEN row that names one and that the change did not touch: the
// register's open rows (| O.. |) and the schedule's rows not yet read, done or dropped. The ledger is history. Read each row it prints and say, in the change, whether it moves.
//   node research/solver/relook.mjs                 ids from `git diff @{u}` of PLAN.md (the unpushed change, working tree)
//   node research/solver/relook.mjs --base <rev>    ids from `git diff <rev>` of PLAN.md (<a>..<b>: that range alone)
//   node research/solver/relook.mjs --since-review  ids from the change since the plan's last receipt (review-log.md), the
//                                                   plan-auditor's step 1: exits 2 on an empty diff while the plan is
//                                                   NOT REVIEWED (a re-look that ran on nothing is an error, not a pass)
//   node research/solver/relook.mjs O60 7u          these ids
//   node research/solver/relook.mjs --staged --msg <commit message file>   THE COMMIT CHECK (.githooks/commit-msg; the process
//     review, deep-review-log.md 4 Oct 13:52 UK, and the maintainer's unlock of 4 Oct): ids from the staged change; every row
//     listed must be answered in the message on a line "relook: <id>[, <id> ...] unchanged: <reason>" (or touched by the
//     change); exits 1 naming the rows unanswered. Relook findings were 9 BLOCKINGs and 27 MINORs in 20 closes, and 7ar's
//     REPLACE asked for this; --msg also works with given ids or --base, for a test
//     A row whose only edit is a declared label, 'relook-label: <id>[, ...]: "<old>" -> "<new>"' in the message and checked
//     exactly by relook-label.mjs, does not name its dependants (the maintainer's unlock of 5 Oct, the third)
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLabels, labelProblem } from './relook-label.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), PLAN = join(HERE, 'PLAN.md');
export const ID = /\b(O\d{1,3}|[78][a-z]{1,2}|E[1-4]|P|Q|M\d{1,2}|K\d)\b/g;
const argv = process.argv.slice(2), bi = argv.indexOf('--base');
const SINCE = argv.includes('--since-review'), STAGED = argv.includes('--staged'), mi = argv.indexOf('--msg'), MSG = mi >= 0 ? argv[mi + 1] : null;
const base = bi >= 0 ? argv[bi + 1] : '@{u}', given = argv.filter((x, i) => !x.startsWith('--') && (bi < 0 || i !== bi + 1) && (mi < 0 || i !== mi + 1));
const lines = readFileSync(PLAN, 'utf8').split('\n');
// the change's added lines, and the rows they sit in (a table row is one line)
let added = [], removed = [];
if (!given.length) {
  let diff;
  if (SINCE) {
    // the last receipt's plan blob against the working tree's, as record-review.mjs --diff does
    const { receipts, planBlob } = await import('./record-review.mjs');
    const last = receipts().slice(-1)[0], now = planBlob(true);
    if (!last) { console.error('relook: no receipt in review-log.md to diff from'); process.exit(2); }
    if (last.blob === now) { console.log(`relook: PLAN.md is unchanged since its last receipt (${last.verdict}, ${last.when}): nothing to re-look`); process.exit(0); }
    try { diff = execFileSync('git', ['diff', '-U0', last.blob, now], { cwd: HERE, encoding: 'utf8', maxBuffer: 64 << 20 }); }
    catch (e) { console.error(`relook: git diff of the last receipt's plan failed: ${e.message.split('\n')[0]}`); process.exit(2); }
    if (!diff.trim()) { console.error('relook: the plan is not reviewed but the diff from its last receipt is empty: a re-look on nothing is an error'); process.exit(2); }
  } else if (STAGED) {
    try { diff = execFileSync('git', ['diff', '--cached', '-U0', '--', PLAN], { cwd: HERE, encoding: 'utf8', maxBuffer: 64 << 20 }); }
    catch (e) { console.error(`relook: git diff --cached failed: ${e.message.split('\n')[0]}`); process.exit(2); }
  } else {
    try { diff = execFileSync('git', ['diff', '-U0', ...base.split('..'), '--', PLAN], { cwd: HERE, encoding: 'utf8', maxBuffer: 64 << 20 }); }
    catch (e) { console.error(`relook: git diff ${base} failed: ${e.message.split('\n')[0]}`); process.exit(2); }
  }
  added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1));
  removed = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---')).map(l => l.slice(1));
  if (!added.length) { console.log(`relook: PLAN.md has no change against ${STAGED ? 'HEAD (staged)' : base}: nothing to re-look`); process.exit(0); }
}
const touched = new Set(added);
// the items a change is about: the ids in a new ledger row's bold headline (its settled result or decision) and the
// live rows it edits - not every id a long row mentions in passing (that listed 94 rows for one decision row)
const bold = l => [...l.matchAll(/\*\*([^*]+)\*\*/g)].map(m => m[1]).join(' ');
const key = l => (/^\| ([^|]+?) \|/.exec(l) || [])[1];
const isItem = k => !!k && (/^O\d{1,3}$/.test(k) || /^([78][a-z]{1,2}|E[1-4]|P|Q|M\d{1,2}|K\d)$/.test(k));
const isLedger = k => !!k && /^\d{1,2} [A-Z][a-z]{2} \d{2}:\d{2}$/.test(k.trim());
// ids: a new ledger row's bold headline, and the key of each live row the change edits
const ids = new Set(given.length ? given : added.flatMap(l => (isLedger(key(l)) ? [...bold(l).matchAll(ID)].map(m => m[1]) : isItem(key(l)) ? [key(l)] : [])));
// declared labels (--msg only): a row whose whole edit is the declared substitution is dropped from the ids, unless a new
// ledger row's headline names it too; a declaration its row's change does not match stops the commit
const headIds = new Set(added.flatMap(l => (isLedger(key(l)) ? [...bold(l).matchAll(ID)].map(m => m[1]) : [])));
const labelled = [], labelErrs = [];
if (MSG && !given.length) {
  for (const d of parseLabels(readFileSync(MSG, 'utf8'))) for (const id of d.ids) {
    const p = labelProblem(removed.find(l => key(l) === id), added.find(l => key(l) === id), d.from, d.to);
    if (p) labelErrs.push(`${id}: ${p}`); else if (!headIds.has(id)) { ids.delete(id); labelled.push(id); }
  }
}
if (labelErrs.length) { console.log(`RELOOK LABEL REFUSED: ${labelErrs.join('; ')}`); process.exit(1); }
if (labelled.length) console.log(`relook: label-only edits declared and checked, their dependants not listed: ${labelled.join(', ')}`);
// an open row: a register row whose status (its last cell) is open; a schedule row not yet read, done or dropped
const lastCell = l => { const c = l.split(' | '); return (c[c.length - 1] || '').replace(/\|\s*$/, '').replace(/\*\*/g, '').trim(); };
const open = l => { const k = key(l), st = lastCell(l); if (/^O\d/.test(k)) return /^open/i.test(st); return !/^(READ|DONE|CANCELLED|SUPERSEDED|EXPIRED|RESOLVED|SETTLED|CLOSED|DROPPED)\b/.test(st); };
const live = k => isItem(k);
const out = [];
lines.forEach((l, i) => {
  const k = key(l);
  if (!live(k) || touched.has(l)) return;
  // an item's own row is listed even when it reads DONE or READ: a change to the item's reading must reach its own
  // status too (30 Sep 20:14: 7ak's row still read item 4 INCONCLUSIVE after the correction; lessons.md, 7al)
  const own = ids.has(k);
  if (!own && !open(l)) return;
  const named = [...new Set([...l.matchAll(ID)].map(m => m[1]))].filter(x => ids.has(x));
  if (named.length) out.push({ n: i + 1, k, named: own && !named.includes(k) ? [k, ...named] : named, own });
});
console.log(`RE-LOOK: ${ids.size} item(s) named by the change (${[...ids].sort().join(', ') || 'none'}); ${out.length} live row(s) name one and were not touched:`);
for (const r of out) console.log(`  PLAN.md:${r.n}  ${r.k.padEnd(6)}  names ${r.named.join(", ")}${r.own ? "  (its own row, DONE or READ)" : ""}`);
// the commit check: each listed row answered in the message, "relook: <id>[, <id> ...] unchanged: <reason>"
if (MSG) {
  const msg = readFileSync(MSG, 'utf8').split('\n').filter(l => !l.startsWith('#'));
  const answered = new Set(msg.flatMap(l => { const m = /^relook:\s*(.+?)\s+unchanged:\s*(\S.{9,})$/i.exec(l.trim()); return m ? m[1].split(/[,\s]+/).filter(Boolean) : []; }));
  const missing = [...new Set(out.map(r => r.k))].filter(k => !answered.has(k));
  if (missing.length) { console.log(`RELOOK UNANSWERED (${missing.length}): ${missing.join(', ')} - move each row in the change, or add to the commit message a line "relook: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ', ...' : ''} unchanged: <reason, ten characters or more>"`); process.exit(1); }
  console.log(`relook: every listed row answered (${out.length})`);
}
