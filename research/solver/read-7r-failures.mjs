/*
 * 7R'S LOST PATHS, BY THE KIND OF FAILURE (the sixty-ninth review's BLOCKING 2). Reported, not a test: reduce-7r.mjs is
 * registered and 7r is read, and its printed "median failure year" took a raw -1 as a year. runPolicy marks the year of an
 * in-life failure (a year it could not pay the floor) in the trace, but a path that pays every year and ends below the
 * minimum pot fails at the end with its trace's failure year left at -1 (solve.js runPolicy, the solvency-floor return;
 * record.mjs makeTrace). This script reads the same logs and traces through two of reduce-7r.mjs's gates (requireFairLogs
 * over the logs' stamps, and each trace's count, seed, arm and stamp against the logs'); it does not repeat reduce-7r's
 * per-case ran-line gate, whose logs the stamps tie these traces to (the seventieth review, MINOR 5). It splits each arm's
 * lost paths into the two kinds:
 *   - in life: the year it failed;
 *   - at the end, below the minimum pot: the arm's last-year wealth and off's on the same path.
 * The median failure year counts an end-of-plan failure as the plan's last year; each end-of-plan failure's shortfall under
 * the pot is printed (added after the seventieth review, BLOCKING 2).
 * THE ESTATE CREDIT (the seventieth review, BLOCKING 1): the solver scores a move by survival plus 0.02 of the opening
 * wealth's reciprocal times E[min(net estate, four times the opening wealth)] (solve.js: wB, beqCap; PRODUCT_BASELINE and
 * diag7r leave it at its default). Per path, paired against off: the survival change in points, and the capped estate change
 * priced in points by that weight (100 x 0.02 x change / opening wealth); a failed path's estate is 0 (runPolicy). The net
 * estate is the end wealth less the pension death charge, whose rate the script reads from the model and requires to be 0
 * for every case (it is: the households carry none), so the net estate is the trace's last-year wealth. The opening wealth
 * is the model's own (the sum of the accounts, as solve.js scales it), from each case rebuilt as audit-s126.mjs builds it
 * (its variant() is mirrored below: that script runs a mode when imported), each rebuilt case's bridge checked against the
 * log's. The dislike-of-cuts and raise terms of the score are not included.
 *   node research/solver/read-7r-failures.mjs [dir=results/diag7r]   > research/solver/results-7r-failures.txt
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7r');
const PRED = 'research/solver/predictions/diag-7r.md';
const PATHS = 3000, SEED = '7002';
const PANEL = [['S126', ['READER', 'RTIER', 'RREST']], ['bridge 4', ['READER', 'RTIER', 'RREST']], ['wealth x2', ['READER']], ['S366', ['V1']]];

const b = s => Buffer.from(s, 'base64');
export const decode = j => ({ N: j.N, Y: j.Y, survived: new Uint8Array(b(j.survived)), wealth: (x => new Float32Array(x.buffer, x.byteOffset, x.byteLength / 4))(b(j.wealth)), failYear: (x => new Int16Array(x.buffer, x.byteOffset, x.byteLength / 2))(b(j.failYear)) });
export function logStamp(text) {
  const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text || '');
  return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null;
}
export const stampAgrees = (j, st) => !!(st && j && j.stamp && ['code', 'audit', 'prediction', 'sha'].every(x => j.stamp[x] === st[x]));
const lastWealth = (T, i) => T.wealth[i * T.Y + T.Y - 1];
const median = xs => { const s = [...xs].sort((a, c) => a - c), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
// the arm's lost paths against off, by kind; an end-of-plan failure's year is the plan's last (Y - 1)
export function lostKinds(A, B) {
  const inLife = [], atEnd = [];
  for (let i = 0; i < A.N; i++) {
    if (!(A.survived[i] && !B.survived[i])) continue;
    const fy = B.failYear[i];
    if (fy >= 0) inLife.push({ path: i, year: fy });
    else atEnd.push({ path: i, end: lastWealth(B, i), offEnd: lastWealth(A, i) });
  }
  const years = [...inLife.map(x => x.year), ...atEnd.map(() => A.Y - 1)];
  return { lost: inLife.length + atEnd.length, inLife, atEnd, medYear: median(years) };
}
// the estate credit: per path, the survival change in points and the capped estate change priced in points
export const WB = 0.02, CAP = 4;
export function estateCredit(A, B, scale) {
  const cap = CAP * scale, est = (T, i) => (T.survived[i] ? Math.min(lastWealth(T, i), cap) : 0);
  const dS = [], dE = [], dW = [];
  for (let i = 0; i < A.N; i++) {
    dS.push(100 * (B.survived[i] - A.survived[i]));
    const w = est(B, i) - est(A, i); dW.push(w); dE.push(100 * WB * w / scale);
  }
  const mean = xs => xs.reduce((a, c) => a + c, 0) / xs.length;
  const se = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((a, c) => a + (c - m) ** 2, 0) / (xs.length - 1) / xs.length); };
  const tot = dS.map((x, i) => x + dE[i]);
  return { dW: mean(dW), dS: mean(dS), dE: mean(dE), dEse: se(dE), tot: mean(tot), totSe: se(tot) };
}
// the share of the survival lost that the estate credit makes up, in per cent
export const covers = e => Math.round(-100 * e.dE / e.dS);
// the end-of-plan failures' shortfalls under the pot: the median, the median pot left in years of it, how many within 5k
export function shortfalls(atEnd, pot) {
  const sh = atEnd.map(x => Number(pot) - x.end);
  return { med: median(sh), left: median(atEnd.map(x => x.end)) / Number(pot), within: sh.filter(x => x <= 5000).length, n: sh.length, largest: Math.max(...sh) };
}
const k = x => `${Math.round(x / 1000)}k`;
const range = xs => (xs.length ? `${k(Math.min(...xs))} to ${k(Math.max(...xs))}` : '-');

// PLANTED, before any real file (rule 6)
{
  const mk = (surv, fails, last) => ({ N: surv.length, Y: 3, survived: Uint8Array.from(surv), failYear: Int16Array.from(fails), wealth: Float32Array.from(last.flatMap(w => [1, 1, w])) });
  // off survives all four; the arm fails path 1 in year 1 (in life) and path 2 at the end (-1), path 3 survives
  const A = mk([1, 1, 1, 1], [-1, -1, -1, -1], [50000, 40000, 35000, 60000]);
  const B = mk([1, 0, 0, 1], [-1, 1, -1, -1], [70000, 0, 20000, 80000]);
  const c = lostKinds(A, B);
  const cases = [
    ['two lost: one in life, one at the end', `${c.lost} ${c.inLife.length} ${c.atEnd.length}`, '2 1 1'],
    ['the in-life failure keeps its year', String(c.inLife[0]?.year), '1'],
    ['the end-of-plan failure: its end wealth and off\'s', `${c.atEnd[0]?.end} ${c.atEnd[0]?.offEnd}`, '20000 35000'],
    ['the median failure year counts an end-of-plan failure as the last year (years 1 and 2)', String(c.medYear), '1.5'],
    ['the estate credit: path 0 both survive (70k against 50k), path 1 the arm fails at the end with 15k left (its estate 0, against 40k), path 2 the arm ends above the cap (capped at 400k)', (() => { const A2 = mk([1, 1, 1], [-1, -1, -1], [50000, 40000, 60000]), B2 = mk([1, 0, 1], [-1, -1, -1], [70000, 15000, 900000]); const e = estateCredit(A2, B2, 100000); return `${Math.round(e.dW)} ${e.dS.toFixed(4)} ${e.dE.toFixed(4)}`; })(), `${Math.round((20000 - 40000 + 340000) / 3)} ${(-100 / 3).toFixed(4)} ${((100 * 0.02 * (20000 - 40000 + 340000) / 100000) / 3).toFixed(4)}`],
    ['the shortfall under the pot: ending 20000 under 29000 is 9000', String(29000 - c.atEnd[0]?.end), '9000'],
    ['the shortfalls: ending 20k, 27k and 5k (off 35k, 30k, 31k) under 29k: median 9000, 0.69 of the pot left, 1 within 5k, largest 24000', (() => { const f = shortfalls([{ end: 20000, offEnd: 35000 }, { end: 27000, offEnd: 30000 }, { end: 5000, offEnd: 31000 }], '29000'); return `${f.med} ${f.left.toFixed(2)} ${f.within} of ${f.n} ${f.largest}`; })(), '9000 0.69 1 of 3 24000'],
    ['the estate credit covers 70% when +0.35 points of estate meet 0.50 points of survival lost', String(covers({ dE: 0.35, dS: -0.5 })), '70'],
    ['the stamp line read field by field (code, audit, prediction, sha); a trace stamped as the logs agrees, one with another prediction version or no stamp does not', (() => { const st = logStamp('x\nstamp: code a audit b prediction c sha d\n'); return `${st.code} ${st.audit} ${st.prediction} ${st.sha} ${stampAgrees({ stamp: { ...st } }, st)} ${stampAgrees({ stamp: { ...st, sha: 'e' } }, st)} ${stampAgrees({}, st)}`; })(), 'a b c d true false false'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  if (process.argv.includes('--planted')) { console.log(`planted (${cases.length}): all read as they should`); process.exit(0); }
}

// the real files, through reduce-7r.mjs's stamp gate and its trace checks (not its per-case ran-line gate: the header)
const logs = {};
for (let i = 0; i < 5; i++) { const f = join(DIR, `part${i}.txt`); if (existsSync(f)) logs[`part${i}.txt`] = readFileSync(f, 'utf8'); }
if (Object.keys(logs).length !== 5) { console.log(`INCOMPLETE - ${Object.keys(logs).length} of 5 logs in ${DIR}`); process.exit(1); }
requireFairLogs(logs, PRED);
const stamps = Object.values(logs).map(logStamp), ST = stamps[0];
if (!ST || stamps.some(x => JSON.stringify(x) !== JSON.stringify(ST))) { console.log('FAIR-TEST GATE: FAILED\n  the logs\' stamp lines are missing or differ'); process.exit(1); }
const minPot = (/ minPot (\d+) /.exec(Object.values(logs).join('\n')) || [])[1];
const load = (id, arm) => {
  const f = join(DIR, `${id.replace(/ /g, '_')}-${arm.toLowerCase()}.json.gz`);
  if (!existsSync(f)) { console.log(`INCOMPLETE - no trace ${f}`); process.exit(1); }
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (j.N !== PATHS || String(j.seed) !== SEED || j.arm !== arm || !stampAgrees(j, ST)) { console.log(`FAIR-TEST GATE: FAILED\n  ${f}: count, seed, arm or stamp is not the logs'`); process.exit(1); }
  return decode(j);
};
console.log(`7R'S LOST PATHS BY THE KIND OF FAILURE (reported, not a test; the logs' gate and every trace's stamp checked). Against off on`);
console.log(`the same ${PATHS} paths of seed ${SEED}; the minimum pot ${minPot}. An end-of-plan failure paid every year and ended below it.\n`);
for (const [id, arms] of PANEL) {
  const off = load(id, 'OFF');
  for (const arm of arms) {
    const c = lostKinds(off, load(id, arm));
    if (!c.lost) { console.log(`${id.padEnd(9)} ${arm.padEnd(6)} lost 0`); continue; }
    console.log(`${id.padEnd(9)} ${arm.padEnd(6)} lost ${c.lost}: in life ${c.inLife.length}${c.inLife.length ? ` (years ${c.inLife.map(x => x.year).sort((a, z) => a - z).join(', ')})` : ''}; at the end, below the minimum pot ${c.atEnd.length}${c.atEnd.length ? ` (ending ${range(c.atEnd.map(x => x.end))}; off on the same paths ${range(c.atEnd.map(x => x.offEnd))})` : ''}; median failure year ${c.medYear} of ${off.Y - 1}`);
    if (c.atEnd.length) { const f = shortfalls(c.atEnd, minPot); console.log(`${''.padEnd(17)}shortfalls under the pot at the end: median ${(f.med / 1000).toFixed(1)}k (${f.left.toFixed(2)} years of the pot left), within 5k ${f.within} of ${f.n}, largest ${(f.largest / 1000).toFixed(1)}k`); }
  }
}

// THE ESTATE CREDIT - each case rebuilt as audit-s126.mjs builds it (variant() mirrored), its opening wealth and death-charge
// rate from the model, its bridge checked against the log's case line
const all = buildScenarios().filter(x => x.plan.demographics.planningMode === 'single');
const s126 = all.find(x => x.id === 'S126'), LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant({ a0 = 0.85, bridge = 2, scale = 1 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => { const b0 = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b0 > 0) return { ...a, balance: Math.round(a0 * W) }; if (LIQ.test(a.category) && b0 > 0) return { ...a, balance: Math.round(b0 / liq0 * (1 - a0) * W) }; return a; });
  const age = E.num(p.demographics.privatePensionAge, 58) - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return p;
}
const PLANS = { 'S126': variant(), 'bridge 4': variant({ bridge: 4 }), 'S120': all.find(x => x.id === 'S120').plan, 'wealth x2': variant({ scale: 2 }), 'S366': all.find(x => x.id === 'S366').plan };
const logText = Object.values(logs).join('\n');
console.log(`\nTHE ESTATE CREDIT, in the solver's own units (reported, not a test): per path against off, the survival change in points and the`);
console.log(`capped estate change priced in points (100 x ${WB} x change / opening wealth; cap ${CAP} x opening wealth; a failed path's estate 0).`);
console.log(`The dislike-of-cuts and raise terms are not included. Means over the ${PATHS} paths, with their standard errors.\n`);
for (const [id, arms] of [['S126', ['READER', 'RTIER']], ['bridge 4', ['READER', 'RTIER']], ['S120', ['READER']], ['wealth x2', ['READER']], ['S366', ['V1']]]) {
  const h = PLANS[id];
  const plan = E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } }));
  const m = M.prepare(E, plan), scale = Math.max(1, m.ctx.accounts.reduce((x, a) => x + a.balance, 0));
  if (m.ctx.pensionDeathTaxRate !== 0) { console.log(`STOPPED - ${id}: a pension death charge of ${m.ctx.pensionDeathTaxRate}; the net estate needs the pension share, which the trace does not carry`); process.exit(1); }
  const B = E.num(plan.demographics.privatePensionAge, 58) - E.num(plan.demographics.currentAgeSelf, 0);
  const line = new RegExp(`^${id.replace(/ /g, ' ')}\\s+a0 [\\d.]+ B (\\d+) `, 'm').exec(logText);
  if (!line || Number(line[1]) !== B) { console.log(`STOPPED - ${id}: the rebuilt case's bridge (${B}) is not the log's (${line ? line[1] : 'none'})`); process.exit(1); }
  const off = load(id, 'OFF');
  for (const arm of arms) {
    const e = estateCredit(off, load(id, arm), scale);
    console.log(`${id.padEnd(9)} ${arm.padEnd(6)} opening wealth ${k(scale)}: capped estate ${e.dW >= 0 ? '+' : ''}${k(e.dW)}, worth ${e.dE >= 0 ? '+' : ''}${e.dE.toFixed(3)} +/- ${e.dEse.toFixed(3)} points; survival ${e.dS >= 0 ? '+' : ''}${e.dS.toFixed(3)} points; together ${e.tot >= 0 ? '+' : ''}${e.tot.toFixed(3)} +/- ${e.totSe.toFixed(3)}${e.dS < 0 ? `; the estate credit covers ${covers(e)}% of the survival lost` : ''}`);
  }
}
