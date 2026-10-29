/*
 * N7's read-out: every device's solves (the page's record, exported, or the page's copied results; any number of files)
 * into one table a device, against gate 5's quiet-machine times. EXPLORATORY: a measurement; it changes no default, gate
 * or candidate (D41 (1): it informs Phase 7's worker and Phase 11's coarser grid).
 *   node research/solver/n7/reduce.mjs <rows.json> [...]   > research/solver/results-n7.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(HERE, 'data.json'), 'utf8'));
const median = xs => { const a = [...xs].sort((x, y) => x - y), n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : NaN; };
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');

/* the solves in a file, whatever its shape: the page's copied results ({ device, session, rows }) or the record's rows */
function rowsIn(x, ctx = {}) {
  if (Array.isArray(x)) return x.flatMap(y => rowsIn(y, ctx));
  if (!x || typeof x !== 'object') return [];
  if (x.caseId && x.arm) return [{ ...ctx, ...x }];
  const next = x.rows && x.device ? { device: x.device, session: x.session, code: x.code, codeOk: x.codeOk, mode: x.mode, build: x.build } : ctx;
  return Object.values(x).flatMap(y => rowsIn(y, next));
}
const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node research/solver/n7/reduce.mjs <rows.json> [...]'); process.exit(2); }
const rows = files.flatMap(f => rowsIn(JSON.parse(readFileSync(f, 'utf8'))));
const bySession = new Map();
for (const r of rows) { const k = r.session || '-'; if (!bySession.has(k)) bySession.set(k, []); bySession.get(k).push(r); }

console.log(`N7 (D20 (10), D41 (1)): the solve timed on each device, one core, EXPLORATORY (a measurement); ${rows.length} solves in ${bySession.size} device sessions from ${files.length} file(s)`);
console.log(`the page: built ${data.built}, code ${data.code.fingerprint}, candidate ${data.candidate}; the app's solve at ${data.cases[0].product.opts.points} points, the candidate's at ${data.cases[0].cand.opts.points}`);
console.log(`the reference: gate 5's times on the research machine (results-gate5.txt, code ${data.gate5.code}; Node, one core, nothing else running); the split's speed-up there x${data.gate5.speedup} on ${data.gate5.parts} cores`);
for (const [session, rs] of bySession) {
  const d = rs[0].device || {}, stale = rs.filter(r => r.code && r.code !== data.code.fingerprint).length;
  console.log('');
  console.log(`DEVICE ${d.name || '(unnamed)'} | ${d.brands || d.ua || '-'} | ${d.platform || '-'}${d.mobile ? ' (mobile)' : ''} | cores ${d.cores || '-'} | memory ${d.memoryGB ? `${d.memoryGB} GB` : '-'} | in ${rs[0].mode || '-'} | code ${rs[0].codeOk ? 'as built' : 'NOT checked as built'}${stale ? ` (${stale} solves on other code)` : ''} | session ${session}`);
  console.log(`  ${'household'.padEnd(12)} ${'solve'.padEnd(10)} runs  median s  gate 5 s   ratio  tables MB  same tables`);
  const cells = new Map();
  for (const r of rs) { const k = `${r.caseId}|${r.arm}|${r.points}`; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(r); }
  const ratios = { product: [], cand: [] }, secs = { product: [], cand: [] };
  for (const [k, cs] of cells) {
    const [caseId, arm, points] = k.split('|'), ok = cs.filter(r => r.ok), m = median(ok.map(r => r.secs)), g = cs[0].gate5;
    const same = cs.filter(r => r.same === true).length, checked = cs.filter(r => r.same !== null && r.same !== undefined).length;
    if (g && ok.length) { ratios[arm].push(m / g); secs[arm].push(m); }
    console.log(`  ${caseId.padEnd(12)} ${`${arm === 'product' ? 'app' : 'candidate'} ${points}`.padEnd(10)} ${String(ok.length).padStart(4)}${cs.length > ok.length ? ` (${cs.length - ok.length} failed: ${cs.filter(r => !r.ok).map(r => r.error).join('; ')})` : ''}  ${f1(m).padStart(8)}  ${(g ? f1(g) : '-').padStart(8)}  ${(g ? f2(m / g) : '-').padStart(6)}  ${f1(Math.max(...ok.map(r => r.bytes)) / 1048576).padStart(9)}  ${checked ? `${same} of ${checked}` : 'not checked'}`);
  }
  if (ratios.product.length || ratios.cand.length) {
    const mp = median(secs.product), mc = median(secs.cand), split = mc / data.gate5.speedup, limit = 1.25 * mp;
    console.log(`  against gate 5 (the median over households): the app x${f2(median(ratios.product))}, the candidate x${f2(median(ratios.cand))}; one core here: the app ${f1(mp)} s, the candidate ${f1(mc)} s`);
    if (Number.isFinite(split) && Number.isFinite(limit)) console.log(`  the candidate split across ${data.gate5.parts} cores, PROJECTED with gate 5's speed-up: ${f1(split)} s, against gate 5's limit here (1.25 x the app's ${f1(mp)} s) ${f1(limit)} s: ${split <= limit ? 'within' : 'OVER'}`);
  }
}
