/*
 * THE PLAN-AUDITOR'S RECEIPTS (RULES.md, layer 4). The plan-auditor agent reviews each change to PLAN.md against the
 * judgement rules and records its verdict here; the Stop hook will not let a turn end while PLAN.md, as it stands, has
 * no receipt or a failed one. Each receipt names the exact version of the plan (its git blob hash).
 *
 *   node research/solver/record-review.mjs --status                         does the plan as it stands have a receipt?
 *   node research/solver/record-review.mjs --start [--reviewer plan-auditor] the reviewer's first step: a review of this
 *                                                                           version is under way (the Stop hook lets turns
 *                                                                           end for 30 minutes while it runs)
 *   node research/solver/record-review.mjs --diff                           what changed since the last reviewed version
 *   node research/solver/record-review.mjs --verdict pass|fail --findings "..." [--reviewer plan-auditor]
 *                                         [--check-only: check the findings' tags and write nothing]
 *   node research/solver/record-review.mjs --moved                          an archive-plan.mjs move, verified: against the
 *                                         last PASS, every removed line is in PLAN-HISTORY.md verbatim and every added line
 *                                         is a pointer line; recorded as a PASS by "archive-plan (verified)" (RULES.md
 *                                         section 10: a move is not a change for a reviewer to judge)
 *   node research/solver/record-review.mjs --withdraw-move <blob> --reason "..."  a verified move that was then withdrawn
 *                                         (its plan reverted before it was committed): recorded as WITHDRAWN, so no base
 *                                         lookup (--status, --diff, --moved, relook --since-review) takes the withdrawn move's
 *                                         blob as the last reviewed plan (RULES.md known limit 25, closed by the maintainer's
 *                                         unlock of 1 Oct 06:45 UK)
 * Every graded finding (BLOCKING n., MINOR n., MINOR (carried k) n., BACKLOG n.) carries a trigger code, [T:<code>], from
 * triggers.mjs's CODES (RULES.md section 10, the feedback loop): the record is then countable (triggers.mjs).
 */
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODES, findingsOf } from './triggers.mjs';
import { POINTER } from './archive-plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../..');
const LOG = join(HERE, 'review-log.md');
const git = cmd => execSync(`git ${cmd}`, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString();

export function planBlob(write = false) { return git(`hash-object ${write ? '-w ' : ''}research/solver/PLAN.md`).trim(); }
/* every line of the log: receipts (PASS, FAIL), starts (STARTED, with the moment as an ISO time) and withdrawals of a move
   (WITHDRAWN, naming the moved blob) */
export function entries() {
  if (!existsSync(LOG)) return [];
  return readFileSync(LOG, 'utf8').split('\n').map(l => /^- (.+?) \| plan ([0-9a-f]{40}) \| (PASS|FAIL|STARTED|WITHDRAWN) \| ([^|]+) \| (.*)$/.exec(l)).filter(Boolean)
    .map(m => ({ when: m[1], blob: m[2], verdict: m[3], reviewer: m[4].trim(), findings: m[5] }));
}
/* the problems with a receipt's findings: a graded finding (BLOCKING n., MINOR n., BACKLOG n., "n:" as well; "(carried k)"
   after the grade) with no trigger code or an unknown one; findings that are not "none" but have no graded finding; and a
   PASS carrying a finding carried by 3 receipts or more, which is BLOCKING by rule (the deep review of the loop, amendment 4) */
export function tagProblems(findings, verdict = 'PASS') {
  const f = String(findings || '').trim(), parts = findingsOf(f), bad = [];
  if (!parts.length) return /^none\b/i.test(f) ? [] : ['no graded finding (BLOCKING n., MINOR n. or BACKLOG n.), and not "none"'];
  for (const p of parts) {
    const head = p.text.slice(0, 40);
    if (p.unknown.length) bad.push(`"${head}...": unknown code ${p.unknown.join(', ')}`);
    else if (!p.tags.length) bad.push(`"${head}...": no trigger code [T:<code>]`);
    if (verdict === 'PASS' && p.carried >= 3) bad.push(`"${head}...": carried by ${p.carried} receipts, so BLOCKING: the verdict cannot be PASS`);
  }
  return bad;
}
/* a pure move: what the plan lost is in the history verbatim, and what it gained is only pointer lines (and blanks) */
export function movedProblems(before, after, history) {
  const count = t => { const m = new Map(); for (const l of t.split('\n')) m.set(l, (m.get(l) || 0) + 1); return m; };
  const A = count(before), B = count(after), P = [];
  let removed = 0;
  for (const [l, k] of A) if (k > (B.get(l) || 0)) { removed++; if (l.trim() && !history.includes(l)) P.push(`removed but not in PLAN-HISTORY.md: "${l.slice(0, 70)}"`); }
  for (const [l, k] of B) if (k > (A.get(l) || 0) && l.trim() && !POINTER.test(l)) P.push(`added and not a pointer line: "${l.slice(0, 70)}"`);
  if (!removed) P.push('nothing was removed: not a move');
  return P;
}
/* the blob a reviewer's latest start names, when no receipt of its own followed it */
export function startedBlob(list, reviewer) {
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (e.reviewer !== reviewer) continue;
    return e.verdict === 'STARTED' ? e.blob : null;
  }
  return null;
}
/* the receipts that stand: no starts, no withdrawal lines, and no verified move a later WITHDRAWN line names (pure, for tests) */
export function liveReceipts(list) {
  const gone = new Set(list.filter(e => e.verdict === 'WITHDRAWN').map(e => e.blob));
  return list.filter(e => e.verdict !== 'STARTED' && e.verdict !== 'WITHDRAWN' && !(gone.has(e.blob) && /^archive-plan/.test(e.reviewer)));
}
export function receipts() { return liveReceipts(entries()); }
export function status() {
  const blob = planBlob();
  const mine = entries().filter(r => r.blob === blob);
  const done = liveReceipts(entries()).filter(r => r.blob === blob);
  const latest = mine[mine.length - 1];
  // a review of this version started after its last receipt, still to report
  const pending = latest && latest.verdict === 'STARTED' ? { at: (/started (\S+)/.exec(latest.findings) || [])[1] || null, reviewer: latest.reviewer } : null;
  return { blob, receipt: done.length ? done[done.length - 1] : null, pending, last: receipts().slice(-1)[0] || null };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2);
  const opt = k => { const i = a.indexOf(`--${k}`); return i >= 0 ? a[i + 1] : undefined; };
  if (a.includes('--status')) {
    const st = status();
    console.log(st.receipt ? `PLAN.md ${st.blob.slice(0, 10)}: ${st.receipt.verdict} (${st.receipt.when}, ${st.receipt.reviewer})${st.receipt.verdict === 'FAIL' ? `\n  findings: ${st.receipt.findings}` : ''}` : `PLAN.md ${st.blob.slice(0, 10)}: NOT REVIEWED (last receipt: ${st.last ? `${st.last.blob.slice(0, 10)} ${st.last.verdict}` : 'none'})`);
    process.exit(st.receipt && st.receipt.verdict === 'PASS' ? 0 : 1);
  } else if (a.includes('--start')) {
    const blob = planBlob(true);
    const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UK';
    appendFileSync(LOG, `- ${when} | plan ${blob} | STARTED | ${opt('reviewer') || 'plan-auditor'} | started ${new Date().toISOString()}\n`);
    console.log(`review of PLAN.md ${blob.slice(0, 10)} started`);
  } else if (a.includes('--moved')) {
    const now = planBlob(true), last = receipts().slice(-1)[0];
    if (!last || last.verdict !== 'PASS') { console.error('--moved: the last receipt is not a PASS; a move is verified against a passed plan'); process.exit(2); }
    let before; try { before = git(`cat-file -p ${last.blob}`); } catch { console.error(`--moved: no stored copy of ${last.blob.slice(0, 10)}`); process.exit(2); }
    const P = movedProblems(before, readFileSync(join(HERE, 'PLAN.md'), 'utf8'), readFileSync(join(HERE, 'PLAN-HISTORY.md'), 'utf8'));
    if (P.length) { console.error(`--moved: not a pure move (${P.length}):\n  ${P.slice(0, 10).join('\n  ')}`); process.exit(1); }
    const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UK';
    appendFileSync(LOG, `- ${when} | plan ${now} | PASS | archive-plan (verified) | none. A move from ${last.blob.slice(0, 10)} (${last.verdict}, ${last.when}): every removed line is in PLAN-HISTORY.md verbatim and every added line is a pointer line.\n`);
    console.log(`recorded the verified move for PLAN.md ${now.slice(0, 10)}`);
  } else if (a.includes('--withdraw-move')) {
    const target = opt('withdraw-move') || '', reason = (opt('reason') || '').replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
    const e = entries().find(x => x.blob.startsWith(target) && target.length >= 10 && x.verdict === 'PASS' && /^archive-plan/.test(x.reviewer));
    if (!e || !reason) { console.error('usage: --withdraw-move <blob, 10 hex or more, of a verified move> --reason "<why>"'); process.exit(2); }
    if (planBlob() === e.blob) { console.error(`--withdraw-move: PLAN.md is still the moved version ${e.blob.slice(0, 10)}; revert it first`); process.exit(2); }
    const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UK';
    appendFileSync(LOG, `- ${when} | plan ${e.blob} | WITHDRAWN | archive-plan | the verified move of ${e.when} withdrawn: ${reason}\n`);
    console.log(`recorded the withdrawal of the move ${e.blob.slice(0, 10)}`);
  } else if (a.includes('--diff')) {
    // the change since the last REVIEWED version, pass or fail: each review judges the change, and checks that the
    // previous receipt's findings are fixed (maintainer, 24 Sep 12:05 UK)
    const now = planBlob(true), last = receipts().slice(-1)[0];
    let out = null;
    if (last && last.blob !== now) { try { out = git(`diff ${last.blob} ${now}`); } catch { out = null; } }
    if (last && last.blob === now) { console.log(`PLAN.md is unchanged since its last review (${last.verdict}, ${last.when}).`); process.exit(0); }
    if (out === null) { console.log(`(no stored copy of the last reviewed plan${last ? ` ${last.blob.slice(0, 10)}` : ''}: showing the changes since the last commit, then review the headline and ledger in full)`); out = git('diff HEAD -- research/solver/PLAN.md'); }
    console.log(out || '(no textual change)');
  } else {
    const v = (opt('verdict') || '').toUpperCase(), f = (opt('findings') || '').replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
    if (!/^(PASS|FAIL)$/.test(v) || !f) { console.error('usage: --verdict pass|fail --findings "<numbered findings, or none>" [--reviewer <name>]'); process.exit(2); }
    const tp = tagProblems(f, v);
    if (tp.length) { console.error(`every graded finding carries a trigger code [T:<code>] (triggers.mjs CODES):\n  ${tp.join('\n  ')}\ncodes: ${Object.keys(CODES).join(', ')}`); process.exit(2); }
    if (a.includes('--check-only')) { console.log('findings tagged: ok (nothing written)'); process.exit(0); }
    // the receipt names the version the review STARTED on (its --start hashed and stored it), not the file as it stands
    // when the review ends: a plan edited during a review is not the plan reviewed (30 Sep 19:36: a PASS bound to a blob
    // carrying a row nobody had reviewed; lessons.md, 7ak)
    const now = planBlob(true), started = startedBlob(entries(), opt('reviewer') || 'plan-auditor');
    const blob = started || now;
    if (started && started !== now) console.error(`note: PLAN.md changed during the review; the receipt names the version reviewed, ${started.slice(0, 10)}, not ${now.slice(0, 10)}`);
    const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UK';
    if (!existsSync(LOG)) appendFileSync(LOG, '# Plan reviews\n\nOne line per review of research/solver/PLAN.md by the plan-auditor agent (RULES.md, layer 4), written by\n`record-review.mjs`. The Stop hook requires a PASS for the plan as it stands (its git blob hash).\n\n');
    appendFileSync(LOG, `- ${when} | plan ${blob} | ${v} | ${opt('reviewer') || 'plan-auditor'} | ${f}\n`);
    console.log(`recorded ${v} for PLAN.md ${blob.slice(0, 10)}`);
  }
}
