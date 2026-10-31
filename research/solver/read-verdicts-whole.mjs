/*
 * THE RECORDS CHECK: SURVIVAL AGAINST THE WHOLE SCORE ON EVERY PAST VERDICT (the maintainer's request, 28 Sep: a verdict read
 * by survival alone may blame a mechanism for survival the solver gave up, correctly, for the pot its objective weights at
 * 0.02). For each survival leg of 7t to 7z: the survival change and the realised whole score (reduce-7t.mjs
 * scorePaths: survival, the capped estate at 0.02, the dislike of cuts, the raise credit), paired on the same paths, and
 * whether they agree in sign. Reported, grade C, no test; the flag "whole clear" is descriptive (the whole score's
 * difference beyond twice its standard error), never a decision rule.
 *   7t: every leg of its paired survival table (results-7t.txt), computed here from the traces through reduce-7t.mjs's
 *     stamp gate, fair-test gate and trace check; the recomputed saved/lost must equal the table's and the recomputed whole
 *     score the 67 legs the reducer printed it for (a reproduction check), else the script stops. A first version parsed
 *     only those 67 and skipped the other 19 legs silently (the plan-auditor's review of 5a94973, MINOR 2).
 *   7v: its gated reducer printed both measures for every arm against OFF/1e-3 (results-7v.txt): parsed, all 104 counted.
 *   7y and 7z: read-7y-whole.mjs and read-7z-whole.mjs (each through its reducer's gates): parsed.
 *   7w and 7x: computed here from the traces, through each reducer's own INCOMPLETE check, stamp gate, fair-test gate,
 *     trace check and survival match.
 *   7r: not re-read (its logs print no scale for the estate); its reducer read the estate beside survival (results-7r.txt)
 *     and its question was re-measured with the whole score in 7t (READER-OFF on S126 and bridge 4). 7e and 7s: no traces
 *     were kept; not checkable from the records.
 *   node research/solver/read-verdicts-whole.mjs > research/solver/results-verdicts-whole.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode, scorePaths, paired, WB } from './reduce-7t.mjs';
import { cells, survivedShare } from './reduce-7v.mjs';
import * as W from './reduce-7w.mjs';
import * as X from './reduce-7x.mjs';
import * as T7 from './reduce-7t.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const sgn = x => (Math.abs(x) < 5e-4 ? 0 : Math.sign(x));
const rows = [];
const verdict = (ds, dw, se) => {
  if (sgn(ds) === 0 && sgn(dw) === 0) return 'both level';
  if (sgn(ds) === 0) return 'survival level';
  if (sgn(dw) === 0) return 'whole level';
  if (sgn(ds) === sgn(dw)) return 'agree';
  return se !== null && Math.abs(dw) > 2 * se ? 'DISAGREE (whole clear)' : 'disagree (whole within 2 se)';
};
// PLANTED, before any record is read (rule 6): the sign rule on known cases
{
  const want = [[[-0.1, 0.4, 0.02], 'DISAGREE (whole clear)'], [[-0.1, 0.04, 0.03], 'disagree (whole within 2 se)'], [[0.2, 0.1, 0.01], 'agree'], [[-0.2, -0.3, 0.01], 'agree'], [[0, 0.3, 0.01], 'survival level'], [[0.2, 0, 0], 'whole level'], [[0, 0, 0], 'both level']];
  const off = want.filter(([a, v]) => verdict(...a) !== v);
  if (off.length) { console.log(`PLANTED CHECK FAILED: ${off.map(([a, v]) => `${a} gave ${verdict(...a)}, want ${v}`).join('; ')}`); process.exit(1); }
}
const add = (test, cse, pair, ds, sl, dw, se, parts) => rows.push({ test, cse, pair, ds, sl, dw, se, parts, v: verdict(ds, dw, se) });

// --- 7t and 7v: both measures printed by the gated reducers ---
{
  const t = readFileSync(join(HERE, 'results-7t.txt'), 'utf8').split('\n');
  const surv = {}, whole = {};
  let inWhole = false, wholeLines = 0;
  for (const l of t) {
    if (/^THE REALISED WHOLE SCORE/.test(l)) { inWhole = true; continue; }
    if (inWhole && !l.trim()) inWhole = false;
    let m;
    if (!inWhole && (m = /^\s{2}(share 0\.95|bridge 4|S\d+)\s+(\S+)\s+(\d+)\/(\d+)\s+([+-]\d+\.\d+) \(/.exec(l))) surv[`${m[1]}|${m[2]}`] = { saved: +m[3], lost: +m[4] };
    if (inWhole && l.trim()) wholeLines++;
    if (inWhole && (m = /^\s{2}(share 0\.95|bridge 4|S\d+)\s+(\S+)\s+([+-]\d+\.\d+) \+\/- (\d+\.\d+)/.exec(l))) whole[`${m[1]}|${m[2]}`] = { d: Number(m[3]), se: Number(m[4]) };
  }
  if (Object.keys(whole).length !== wholeLines) { console.log(`PARSE FAILED: 7t has ${wholeLines} whole-score lines, ${Object.keys(whole).length} parsed`); process.exit(1); }
  const unmatched = Object.keys(whole).filter(k => !surv[k]);
  if (unmatched.length) { console.log(`PARSE FAILED: 7t whole-score pairs with no survival line: ${unmatched.join(', ')}`); process.exit(1); }
  // the traces, through reduce-7t.mjs's own gates (as its main)
  const D = join(HERE, 'results', 'diag7t');
  const files = readdirSync(D).filter(f => /^part\d+\.txt$/.test(f)).sort();
  if (files.length !== 5) { console.log(`INCOMPLETE - ${files.length} of 5 7t logs`); process.exit(1); }
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(D, f), 'utf8')]));
  requireFairLogs(logs, T7.PRED);
  const cases = Object.values(logs).flatMap(T7.parse), bad = T7.gate(cases);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED (diag7t)\n  ${bad.join('\n  ')}`); process.exit(1); }
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = { code: st[1], audit: st[2], prediction: st[3], sha: st[4] };
  const tr = {};
  const load = (id, label) => { const k = `${id}|${label}`; if (tr[k]) return tr[k]; const f = join(D, T7.traceName(id, label)); if (!existsSync(f)) { console.log(`no trace ${f}`); process.exit(1); } const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); if (!T7.traceAgrees(j, ST, label)) { console.log(`${f}: the trace is not the logs'`); process.exit(1); } return (tr[k] = T7.decode(j)); };
  let reproduced = 0;
  for (const key of Object.keys(surv)) {
    const [id, pair] = key.split('|'), [b, a] = pair.split('-'), c = cases.find(x => x.id === id);
    if (!c || !b || !a) { console.log(`PARSE FAILED: 7t leg ${key}`); process.exit(1); }
    const ran = c.ran[T7.PANEL[id][0]], jn = c.joint[T7.PANEL[id][0]], ref = load(id, T7.PANEL[id][0]);
    const cfg = { lambda: Number(W.field(ran, 'lambda')), floor: Math.min(...W.field(ran, 'levels').split(',').map(Number)), scale: jn.scale, cap: jn.cap };
    cfg.spendYears = Array.from({ length: ref.Y }, (_, t) => { for (let i = 0; i < ref.N; i++) if (ref.level[i * ref.Y + t] > 0) return true; return false; });
    const A = load(id, a), B = load(id, b), k = cells(A.survived, B.survived);
    if (k.saved !== surv[key].saved || k.lost !== surv[key].lost) { console.log(`REPRODUCTION FAILED: 7t ${key} saved/lost ${k.saved}/${k.lost}, the table ${surv[key].saved}/${surv[key].lost}`); process.exit(1); }
    const part = (T, which) => { const o = new Float64Array(T.N); for (let i = 0; i < T.N; i++) { const alive = T.survived[i] === 1; o[i] = which === 's' ? (alive ? 100 : 0) : (alive ? 100 * WB * Math.min(T.wealth[i * T.Y + T.Y - 1], cfg.cap) / cfg.scale : 0); } return o; };
    const w = paired(scorePaths(A, cfg), scorePaths(B, cfg)), ps = paired(part(A, 's'), part(B, 's')), pe = paired(part(A, 'e'), part(B, 'e'));
    if (whole[key]) { if (Math.abs(w.d - whole[key].d) > 5e-4 || Math.abs(w.se - whole[key].se) > 5e-4) { console.log(`REPRODUCTION FAILED: 7t ${key} whole ${w.d} +/- ${w.se}, printed ${whole[key].d} +/- ${whole[key].se}`); process.exit(1); } reproduced++; }
    add('7t', id, pair, ps.d, `${k.saved}/${k.lost}`, w.d, w.se, { s: ps.d, e: pe.d, r: w.d - ps.d - pe.d });
  }
  if (reproduced !== wholeLines) { console.log(`REPRODUCTION FAILED: ${reproduced} of 7t's ${wholeLines} printed whole-score legs checked`); process.exit(1); }
  console.log(`7t: ${Object.keys(surv).length} legs computed from the traces; the saved/lost of every leg and the whole score of the ${reproduced} the reducer printed reproduced`);
  const v = readFileSync(join(HERE, 'results-7v.txt'), 'utf8').split('\n');
  let cse = null;
  for (const l of v) {
    let m;
    if ((m = /^(S\d+(?: \w+)?|bridge 4|share 0\.95) \(margin/.exec(l))) { cse = m[1]; continue; }
    if (cse && (m = /^\s{2}(\S+)\s+[\d.]+\s+(\d+)\/(\d+)\s+switches.*whole score ([+-][\d.]+) \+\/- ([\d.]+) = survival ([+-][\d.]+) estate ([+-][\d.]+) cuts ([+-][\d.]+) raises ([+-][\d.]+)/.exec(l))) {
      if (/\/1e-3$/.test(m[1]) && /^OFF\//.test(m[1])) continue;   // the baseline itself
      add('7v', cse, `${m[1]} against OFF/1e-3`, Number(m[6]), `${m[2]}/${m[3]}`, Number(m[4]), Number(m[5]), { s: Number(m[6]), e: Number(m[7]), r: Number(m[8]) + Number(m[9]) });
    }
  }
  if (!Object.keys(surv).length || !rows.some(r => r.test === '7v')) { console.log('PARSE FAILED: 7t or 7v read nothing'); process.exit(1); }
}

// --- 7w and 7x: computed from the traces through each reducer's gates ---
function gated(R, dir, runsOf) {
  const D = join(HERE, 'results', dir);
  const logs = Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
  const units = Object.values(logs).flatMap(R.parse);
  requireFairLogs(logs, R.PRED);
  const bad = R.gate(units);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED (${dir})\n  ${bad.join('\n  ')}`); process.exit(1); }
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = { code: st[1], audit: st[2], prediction: st[3], sha: st[4] };
  const SC = {};
  for (const text of Object.values(logs)) { let cur = null; for (const line of text.split('\n')) { const c = /^(\S.*?)\s+case \| unit (\S+) \|/.exec(line); if (c) { cur = `${c[1].trim()}|${c[2]}`; continue; } const j = /^\s+joint (\S+): \S+ switchMargin \S+ scale (\S+) cap (\S+)/.exec(line); if (j && cur) SC[cur] = { scale: Number(j[2]), cap: Number(j[3]) }; } }
  const T = {};
  for (const u of units) for (const [label, sim] of runsOf(u)) {
    const f = join(D, R.traceName(u.id, label));
    if (!existsSync(f)) { console.log(`no trace ${f}`); process.exit(1); }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!R.traceAgrees(j, ST, label, sim)) { console.log(`${f}: the trace is not the log's`); process.exit(1); }
    const Xd = decode(j);
    if (Math.abs(survivedShare(Xd.survived) - sim) > R.SIM_TOL) { console.log(`${f}: survival differs from the run line`); process.exit(1); }
    T[`${u.id}|${label}`] = { X: Xd, u };
  }
  return { T, SC };
}
function leg(test, G, cse, A, B, pair) {
  const a = G.T[`${cse}|${A}`], b = G.T[`${cse}|${B}`];
  if (!a || !b) { console.log(`missing ${test} ${cse} ${A} or ${B}`); process.exit(1); }
  const sc = G.SC[`${cse}|${a.u.label}`], ran = a.u.ran;
  const cfg = { lambda: Number(W.field(ran, 'lambda')), floor: Math.min(...W.field(ran, 'levels').split(',').map(Number)), scale: sc.scale, cap: sc.cap };
  cfg.spendYears = Array.from({ length: a.X.Y }, (_, t) => { for (let i = 0; i < a.X.N; i++) if (a.X.level[i * a.X.Y + t] > 0) return true; return false; });
  const part = (T, which) => { const o = new Float64Array(T.N); for (let i = 0; i < T.N; i++) { const alive = T.survived[i] === 1; o[i] = which === 's' ? (alive ? 100 : 0) : (alive ? 100 * WB * Math.min(T.wealth[i * T.Y + T.Y - 1], cfg.cap) / cfg.scale : 0); } return o; };
  const w = paired(scorePaths(a.X, cfg), scorePaths(b.X, cfg)), ps = paired(part(a.X, 's'), part(b.X, 's')), pe = paired(part(a.X, 'e'), part(b.X, 'e')), k = cells(a.X.survived, b.X.survived);
  add(test, cse, pair || `${B} against ${A}`, ps.d, `${k.saved}/${k.lost}`, w.d, w.se, { s: ps.d, e: pe.d, r: w.d - ps.d - pe.d });
}
{
  const G = gated(W, 'diag7w', u => W.RUNS.map(run => [`${u.label}/${run}`, u.runs[run].sim]));
  leg('7w', G, 'share 0.95', 'READER@5/1e-3', 'READER@15/1e-3');
  leg('7w', G, 'share 0.95', 'READER+J@5/1e-3', 'READER+J@15/1e-3');
  leg('7w', G, 'S126', 'READER@5/0', 'READER@5/1e-3+open');
  leg('7w', G, 'S194', 'OFF@5/0', 'OFF@5/1e-3+open');
  leg('7w', G, 'S126', 'READER@5/0', 'READER@5/1e-3');
  leg('7w', G, 'S194', 'OFF@5/0', 'OFF@5/1e-3');
}
{
  const G = gated(X, 'diag7x', u => [[u.label, u.run.sim]]);
  for (const [cse, arm] of X.CASES) for (const mix of [3, 5]) leg('7x', G, cse, `${arm}/H00/M${mix}`, `${arm}/H22/M${mix}`);
}

// --- 7y and 7z: the read-further files, each through its reducer's gates ---
{
  for (const l of readFileSync(join(HERE, 'results-7y-whole.txt'), 'utf8').split('\n')) {
    const m = /^\s{2}(\S+(?: \S+)?) \((\w+)\)\s+(\S+)\s+whole ([+-][\d.]+) \+\/- ([\d.]+) = survival ([+-][\d.]+), estate ([+-][\d.]+), the rest ([+-][\d.]+) \| saved\/lost (\d+\/\d+)/.exec(l);
    if (m) add('7y', `${m[1]} (${m[2]})`, `${m[3]} against PRODUCT`, Number(m[6]), m[9], Number(m[4]), Number(m[5]), { s: Number(m[6]), e: Number(m[7]), r: Number(m[8]) });
  }
  for (const l of readFileSync(join(HERE, 'results-7z-whole.txt'), 'utf8').split('\n')) {
    const m = /^(\S+(?: \S+)?): whole score ([+-]?[\d.]+) \+\/- ([\d.]+) = survival ([+-]?[\d.]+), estate ([+-]?[\d.]+), the rest ([+-]?[\d.]+)/.exec(l);
    if (m) add('7z', m[1], 'READER+STEP against READER', Number(m[4]), '-', Number(m[2]), Number(m[3]), { s: Number(m[4]), e: Number(m[5]), r: Number(m[6]) });
  }
  if (!rows.some(r => r.test === '7y') || !rows.some(r => r.test === '7z')) { console.log('PARSE FAILED: 7y or 7z read nothing'); process.exit(1); }
}

console.log('THE RECORDS CHECK: SURVIVAL AGAINST THE WHOLE SCORE ON EVERY PAST VERDICT (reported, grade C, no test)');
console.log('each leg: survival change (points, saved/lost), the whole score change +/- its standard error, its parts where known (survival, estate, cuts and raises), and whether the two agree in sign\n');
for (const test of ['7t', '7v', '7w', '7x', '7y', '7z']) {
  const rs = rows.filter(r => r.test === test);
  console.log(`${test} (${rs.length} legs)`);
  for (const r of rs) console.log(`  ${r.cse.padEnd(18)} ${r.pair.padEnd(34)} survival ${f3(r.ds)} (${r.sl})  whole ${f3(r.dw)}${r.se !== null ? ` +/- ${r.se.toFixed(3)}` : ''}${r.parts ? `  [estate ${f3(r.parts.e)}, cuts and raises ${f3(r.parts.r)}]` : ''}  -> ${r.v}`);
}
const dis = rows.filter(r => /disagree/i.test(r.v));
console.log(`\nTHE LEGS WHERE THE TWO DISAGREE IN SIGN: ${dis.length} of ${rows.length} (${dis.filter(r => /clear/.test(r.v)).length} with the whole score beyond twice its standard error)`);
for (const r of dis) console.log(`  ${r.test} ${r.cse}: ${r.pair}: survival ${f3(r.ds)}, whole ${f3(r.dw)} +/- ${r.se.toFixed(3)} -> ${r.v}`);
console.log('\nNOT CHECKABLE FROM THE RECORDS: 7e and 7s (no traces kept); 7r read its estate beside survival (results-7r.txt: the reader "buys estate" on S126 and bridge 4 while losing 15 and 12 paths) and 7t re-measured that pair with the whole score (READER-OFF above).');
