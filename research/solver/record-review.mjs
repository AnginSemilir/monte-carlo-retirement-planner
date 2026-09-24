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
 */
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '../..');
const LOG = join(HERE, 'review-log.md');
const git = cmd => execSync(`git ${cmd}`, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString();

export function planBlob(write = false) { return git(`hash-object ${write ? '-w ' : ''}research/solver/PLAN.md`).trim(); }
/* every line of the log: receipts (PASS, FAIL) and starts (STARTED, with the moment as an ISO time) */
export function entries() {
  if (!existsSync(LOG)) return [];
  return readFileSync(LOG, 'utf8').split('\n').map(l => /^- (.+?) \| plan ([0-9a-f]{40}) \| (PASS|FAIL|STARTED) \| ([^|]+) \| (.*)$/.exec(l)).filter(Boolean)
    .map(m => ({ when: m[1], blob: m[2], verdict: m[3], reviewer: m[4].trim(), findings: m[5] }));
}
export function receipts() { return entries().filter(e => e.verdict !== 'STARTED'); }
export function status() {
  const blob = planBlob();
  const mine = entries().filter(r => r.blob === blob);
  const done = mine.filter(r => r.verdict !== 'STARTED');
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
    const blob = planBlob(true);
    const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UK';
    if (!existsSync(LOG)) appendFileSync(LOG, '# Plan reviews\n\nOne line per review of research/solver/PLAN.md by the plan-auditor agent (RULES.md, layer 4), written by\n`record-review.mjs`. The Stop hook requires a PASS for the plan as it stands (its git blob hash).\n\n');
    appendFileSync(LOG, `- ${when} | plan ${blob} | ${v} | ${opt('reviewer') || 'plan-auditor'} | ${f}\n`);
    console.log(`recorded ${v} for PLAN.md ${blob.slice(0, 10)}`);
  }
}
