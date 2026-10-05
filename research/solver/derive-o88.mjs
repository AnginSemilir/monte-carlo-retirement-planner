/*
 * O88 OVER ADOPT-PI'S SAVED TRACES (the plan-auditor's BLOCKING 1 of 5 Oct on O88's gate: ADOPT-PI saved the used share
 * u for every path-year in both arms for exactly this split, audit-adoptpi.mjs's header). reduce-adoptpi.mjs's gate and
 * the fair-gate stamp check run first (rule 3). Per household of DP's panel at death tax 0, per arm: DPC's band 'SP year
 * drop' and the same split by the year the path entered the band. Planted: one built path reads its known drop.
 *   node research/solver/derive-o88.mjs > research/solver/results-derive-o88.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { parse, gate, loadTraces, stampOf, PANEL, PRED } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagadoptpi');
// the households' opening balances: audit-adoptpi.mjs l.48-78, copied (its module runs its units on import)
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant({ a0 = 0.85, scale = 1 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) }; return a; });
  return p;   // the bridge length and the one-off cost move no balance
}
const BUILT = { 'share 0.50': { a0: 0.5 }, 'share 0.70': { a0: 0.7 }, 'share 0.78': { a0: 0.78 }, 'share 0.90': { a0: 0.9 }, 'share 0.95': { a0: 0.95 }, 'bridge 0': {}, 'bridge 1': {}, 'bridge 4': {}, 'bridge 6': {}, 'wealth x0.5': { scale: 0.5 }, 'wealth x2': { scale: 2 }, 'bridge 4+cost': {} };
const opening = id => { const p = BUILT[id] ? variant(BUILT[id]) : all.find(s => s.id === id).plan; return p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0); };


// O88's split (the 4 Oct 16:48 row; DPC's 'SP year drop', audit-dpc.mjs l.141-153): over the path-years in the band
// [0.6, 0.75) of the allowance, the mean growth of the used share in the State Pension's year less the year before, by the
// year the path entered the band (more than 4 years before the State Pension's year, or within 4), per arm at death tax 0
const planOf = id => (BUILT[id] ? (() => { const p = variant(BUILT[id]); const nm = { 'bridge 0': 0, 'bridge 1': 1, 'bridge 4': 4, 'bridge 6': 6, 'bridge 4+cost': 4 }[id]; if (nm !== undefined) { const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - nm; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) }; } else { const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - 2; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) }; } return p; })() : all.find(s => s.id === id).plan);
const spYearOf = id => { const c = E.buildContext(E.normalizePlan(planOf(id))); return Math.max(0, c.spa - c.ageSelf0); };
export function spSplit(t, spYear) {
  const acc = { early: [0, 0, 0, 0], late: [0, 0, 0, 0] };   // growth sum and count in the SP year, then the year before
  for (let j = 0; j < t.N; j++) {
    let entry = -1; for (let k = 0; k < t.Y; k++) { const x = t.u[j * t.Y + k]; if (x === x && x >= 0.6) { entry = k; break; } }
    if (entry < 0) continue;
    const bin = entry < spYear - 4 ? 'early' : 'late';
    for (const [k, at] of [[spYear, 0], [spYear - 1, 2]]) {
      if (k < 0 || k + 1 >= t.Y) continue;
      const u = t.u[j * t.Y + k], u1 = t.u[j * t.Y + k + 1];
      if (u === u && u1 === u1 && u >= 0.6 && u < 0.75) { acc[bin][at] += u1 - u; acc[bin][at + 1]++; }
    }
  }
  const drop = a => (a[1] && a[3] ? a[0] / a[1] - a[2] / a[3] : NaN);
  return { early: { drop: drop(acc.early), n: acc.early[1] + acc.early[3] }, late: { drop: drop(acc.late), n: acc.late[1] + acc.late[3] }, all: { drop: drop([acc.early[0] + acc.late[0], acc.early[1] + acc.late[1], acc.early[2] + acc.late[2], acc.early[3] + acc.late[3]]), n: acc.early[1] + acc.late[1] + acc.early[3] + acc.late[3] } };
}
/* the late bin split by the exact entry offset d = spYear - entry, 0 to 4 (the plan-auditor's MINOR 1 of 5 Oct on O88: the
   two bins cannot show composition; d 0 adds a State Pension year with no year before in the band) */
export function byEntry(t, spYear) {
  const acc = Array.from({ length: 5 }, () => [0, 0, 0, 0]);
  for (let j = 0; j < t.N; j++) {
    let entry = -1; for (let k = 0; k < t.Y; k++) { const x = t.u[j * t.Y + k]; if (x === x && x >= 0.6) { entry = k; break; } }
    const d = spYear - entry; if (entry < 0 || d < 0 || d > 4) continue;
    for (const [k, at] of [[spYear, 0], [spYear - 1, 2]]) {
      if (k < 0 || k + 1 >= t.Y) continue;
      const u = t.u[j * t.Y + k], u1 = t.u[j * t.Y + k + 1];
      if (u === u && u1 === u1 && u >= 0.6 && u < 0.75) { acc[d][at] += u1 - u; acc[d][at + 1]++; }
    }
  }
  return acc.map(a => ({ drop: a[1] && a[3] ? a[0] / a[1] - a[2] / a[3] : NaN, sp: a[1], before: a[3] }));
}
// planted: a path entering the band 2 years before the SP year (late: within 4) with growth 0.02 in the SP year and 0.05 the
// year before reads a late drop of -0.03 and no early path-year; a path entering 7 years before (early) with growth 0.01 and
// 0.02 reads an early drop of -0.01 and no late path-year (the plan-auditor's MINOR 4 of 5 Oct: the early bin was never planted)
{
  const Y = 5, u = new Float32Array(Y).fill(NaN); u[0] = 0.61; u[1] = 0.62; u[2] = 0.67; u[3] = 0.69;
  const r = spSplit({ N: 1, Y, u }, 2);
  if (!(Math.abs(r.late.drop - (0.02 - 0.05)) < 1e-6 && r.early.n === 0)) { console.log(`PLANTED CHECK FAILED: ${JSON.stringify(r)}`); process.exit(1); }
  const Y2 = 10, v = new Float32Array(Y2).fill(NaN); [0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.69, 0.70].forEach((x, k) => { v[k] = x; });
  const e = spSplit({ N: 1, Y: Y2, u: v }, 7);
  if (!(Math.abs(e.early.drop - (0.01 - 0.02)) < 1e-6 && e.late.n === 0 && e.early.n === 2)) { console.log(`PLANTED CHECK FAILED (early): ${JSON.stringify(e)}`); process.exit(1); }
  // the late path at offset 2 reads its drop there and nothing at any other offset
  const b = byEntry({ N: 1, Y, u }, 2);
  if (!(Math.abs(b[2].drop - (0.02 - 0.05)) < 1e-6 && b[2].sp === 1 && b[2].before === 1 && [0, 1, 3, 4].every(d => b[d].sp === 0 && b[d].before === 0))) { console.log(`PLANTED CHECK FAILED (by entry): ${JSON.stringify(b)}`); process.exit(1); }
}
const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
const units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units);
const tr = bad.length ? { bad } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
if (bad.length || tr.bad.length) { console.log(`GATE: FAILED\n  ${[...bad, ...(tr.bad || [])].join('\n  ')}`); process.exit(1); }
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-');
console.log('GATE: passed (reduce-adoptpi.mjs\'s gate and the fair-gate stamp check over results/diagadoptpi); planted: passed');
console.log('O88 OVER ADOPT-PI\'S TRACES: the band [0.6, 0.75) State Pension drop (mean growth of the used share in the SP year less the year before), by the year the path entered the band (early: more than 4 years before the SP year; late: within 4), death tax 0');
console.log('  household        SP year | SNAP all (path-years)  early (n)        late (n)        | PCLSI all (path-years)  early (n)        late (n)');
for (const id of PANEL) {
  const sp = spYearOf(id), S = spSplit(tr.files[`${id} SNAP`], sp), P = spSplit(tr.files[`${id} PCLSI`], sp);
  const c = x => `${f4(x.drop)} (${x.n})`;
  console.log(`  ${id.padEnd(16)} ${String(sp).padStart(7)} | ${c(S.all).padEnd(22)} ${c(S.early).padEnd(16)} ${c(S.late).padEnd(16)}| ${c(P.all).padEnd(23)} ${c(P.early).padEnd(16)} ${c(P.late)}`);
}
console.log('\nTHE LATE BIN BY EXACT ENTRY OFFSET d = SP year - entry year (the households with late path-years): drop (State Pension year path-years / year-before path-years)');
console.log('  household        arm   ' + [0, 1, 2, 3, 4].map(d => `d ${d}`.padEnd(26)).join(''));
for (const id of PANEL) {
  const sp = spYearOf(id), rows = ['SNAP', 'PCLSI'].map(a => [a, byEntry(tr.files[`${id} ${a}`], sp)]);
  if (rows.every(([, b]) => b.every(x => !x.sp && !x.before))) continue;
  for (const [a, b] of rows) console.log(`  ${id.padEnd(16)} ${a.padEnd(5)} ${b.map(x => `${f4(x.drop)} (${x.sp}/${x.before})`.padEnd(26)).join('')}`);
}
