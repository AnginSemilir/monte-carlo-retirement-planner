// THE RE-LOOK LIST (research/solver/drafts/framework-feedback-review.md, A1; the most common FAIL: a result or decision
// that moves an item, and the live rows naming that item left as they were). Takes the item ids on the lines PLAN.md's
// change adds - a new ledger row's bold headline and the keys of the live rows it edits (O12, 7al, P, Q, E3, ...) - or
// ids given on the command line, and prints every OPEN row that names one and that the change did not touch: the
// register's open rows (| O.. |) and the schedule's rows not yet read, done or dropped. The ledger is history. Read each row it prints and say, in the change, whether it moves.
//   node research/solver/relook.mjs                 ids from `git diff @{u}` of PLAN.md (the unpushed change, working tree)
//   node research/solver/relook.mjs --base <rev>    ids from `git diff <rev>` of PLAN.md (<a>..<b>: that range alone)
//   node research/solver/relook.mjs O60 7u          these ids
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), PLAN = join(HERE, 'PLAN.md');
export const ID = /\b(O\d{1,3}|[78][a-z]{1,2}|E[1-4]|P|Q|M\d{1,2}|K\d)\b/g;
const argv = process.argv.slice(2), bi = argv.indexOf('--base');
const base = bi >= 0 ? argv[bi + 1] : '@{u}', given = argv.filter((x, i) => !x.startsWith('--') && (bi < 0 || i !== bi + 1));
const lines = readFileSync(PLAN, 'utf8').split('\n');
// the change's added lines, and the rows they sit in (a table row is one line)
let added = [];
if (!given.length) {
  let diff;
  try { diff = execFileSync('git', ['diff', '-U0', ...base.split('..'), '--', PLAN], { cwd: HERE, encoding: 'utf8', maxBuffer: 64 << 20 }); }
  catch (e) { console.error(`relook: git diff ${base} failed: ${e.message.split('\n')[0]}`); process.exit(2); }
  added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1));
  if (!added.length) { console.log(`relook: PLAN.md has no change against ${base}: nothing to re-look`); process.exit(0); }
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
// an open row: a register row whose status (its last cell) is open; a schedule row not yet read, done or dropped
const lastCell = l => { const c = l.split(' | '); return (c[c.length - 1] || '').replace(/\|\s*$/, '').replace(/\*\*/g, '').trim(); };
const open = l => { const k = key(l), st = lastCell(l); if (/^O\d/.test(k)) return /^open/i.test(st); return !/^(READ|DONE|CANCELLED|SUPERSEDED|EXPIRED|RESOLVED|SETTLED|CLOSED|DROPPED)\b/.test(st); };
const live = k => isItem(k);
const out = [];
lines.forEach((l, i) => {
  const k = key(l);
  if (!live(k) || touched.has(l) || !open(l)) return;
  const named = [...new Set([...l.matchAll(ID)].map(m => m[1]))].filter(x => ids.has(x));
  if (named.length) out.push({ n: i + 1, k, named });
});
console.log(`RE-LOOK: ${ids.size} item(s) named by the change (${[...ids].sort().join(', ') || 'none'}); ${out.length} live row(s) name one and were not touched:`);
for (const r of out) console.log(`  PLAN.md:${r.n}  ${r.k.padEnd(6)}  names ${r.named.join(', ')}`);
