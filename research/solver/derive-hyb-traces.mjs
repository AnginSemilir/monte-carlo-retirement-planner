/*
 * TWO READS OVER HYB'S GATED TRACES (the plan-auditor's FAIL of 5 Oct 11:46 UK on HYB's close: BLOCKING 1, O88's gate
 * names HYB as its vehicle; MINOR 2, the hold claim rested on the mean dwell of every reaching path, not of the paths the
 * read moves). reduce-hyb.mjs's gate (the fair-gate stamp check, the units, the traces' stamps and sums) runs first: reusing
 * a result's files for a new question is a new test (rule 3); the identity against ADOPT-PI's files is reduce-hyb's own,
 * its PASS in results-hyb.txt.
 *   1. O88's split by exact entry offset (derive-o88.mjs byEntry, copied: that module runs on import) per arm, S130 and S370.
 *   2. The band dwell (years with the used share in [0.6, 0.75) of a path that reaches 0.6) per arm, over the paths each
 *      discordant group holds: the read saves (HYB lost, PCLSI survived), the read loses, the tables lose (SNAP survived,
 *      HYB lost), the tables save, and all paths.
 *   node research/solver/derive-hyb-traces.mjs > research/solver/results-derive-hyb-traces.txt
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { parse, gate, loadTraces, PANEL, PRED, UNIT_KEYS } from './reduce-hyb.mjs';
import { stampOf } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diaghyb');
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const spYearOf = id => { const c = E.buildContext(E.normalizePlan(all.find(s => s.id === id).plan)); return Math.max(0, c.spa - c.ageSelf0); };

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
// a path's years in the band, or null if it never reaches 0.6
export const dwell = (t, j) => { let r = false, y = 0; for (let k = 0; k < t.Y; k++) { const x = t.u[j * t.Y + k]; if (x !== x) continue; if (x >= 0.6) r = true; if (x >= 0.6 && x < 0.75) y++; } return r ? y : null; };
export const GROUPS = {
  'the read saves (HYB lost, PCLSI survived)': (S, P, H, j) => !H.survived[j] && P.survived[j],
  'the read loses (HYB survived, PCLSI lost)': (S, P, H, j) => H.survived[j] && !P.survived[j],
  'the tables lose (SNAP survived, HYB lost)': (S, P, H, j) => S.survived[j] && !H.survived[j],
  'the tables save (SNAP lost, HYB survived)': (S, P, H, j) => !S.survived[j] && H.survived[j],
  'all paths': () => true,
};
export function dwellByGroup(S, P, H) {
  const out = {};
  for (const [g, f] of Object.entries(GROUPS)) {
    let n = 0; const s = { SNAP: [0, 0], PCLSI: [0, 0], HYB: [0, 0] };
    for (let j = 0; j < S.N; j++) if (f(S, P, H, j)) { n++; for (const [k, t] of [['SNAP', S], ['PCLSI', P], ['HYB', H]]) { const d = dwell(t, j); if (d !== null) { s[k][0] += d; s[k][1]++; } } }
    out[g] = { n, ...Object.fromEntries(Object.entries(s).map(([k, [a, c]]) => [k, { mean: c ? a / c : NaN, reach: c }])) };
  }
  return out;
}

// PLANTED (rule 6): known paths read their known values
{
  const Y = 5, u = new Float32Array(Y).fill(NaN); u[0] = 0.61; u[1] = 0.62; u[2] = 0.67; u[3] = 0.69;
  const b = byEntry({ N: 1, Y, u }, 2);
  if (!(Math.abs(b[2].drop - (0.02 - 0.05)) < 1e-6 && b[2].sp === 1 && b[2].before === 1 && [0, 1, 3, 4].every(d => b[d].sp === 0 && b[d].before === 0))) { console.log(`PLANTED CHECK FAILED (by entry): ${JSON.stringify(b)}`); process.exit(1); }
  // two paths: path 0 in the band 3 years then above (dwell 3), path 1 never reaching 0.6 (no dwell); path 0 lost under HYB
  // and saved by the read; path 1 survives everywhere
  const mk = (rows, surv) => ({ N: 2, Y: 4, u: Float32Array.from(rows.flat()), survived: surv });
  const S = mk([[0.61, 0.62, 0.7, 0.8], [0.1, 0.2, 0.3, 0.4]], [1, 1]), P = mk([[0.61, 0.62, 0.7, 0.8], [0.1, 0.2, 0.3, 0.4]], [1, 1]), H = mk([[0.61, 0.8, 0.9, 0.9], [0.1, 0.2, 0.3, 0.4]], [0, 1]);
  const g = dwellByGroup(S, P, H), rs = g['the read saves (HYB lost, PCLSI survived)'], al = g['all paths'];
  if (!(rs.n === 1 && rs.SNAP.mean === 3 && rs.HYB.mean === 1 && al.n === 2 && al.SNAP.reach === 1 && g['the read loses (HYB survived, PCLSI lost)'].n === 0)) { console.log(`PLANTED CHECK FAILED (dwell): ${JSON.stringify(g)}`); process.exit(1); }
}

const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
const units = Object.values(logs).flatMap(parse);
if (units.filter(x => x.done).length < UNIT_KEYS.length) { console.log(`INCOMPLETE - ${units.filter(x => x.done).length} of ${UNIT_KEYS.length} units`); process.exit(1); }
requireFairLogs(logs, PRED);
const bad = gate(units);
const tr = bad.length ? { bad: [], files: {} } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
if (bad.length || tr.bad.length) { console.log(`GATE: FAILED\n  ${[...bad, ...tr.bad].join('\n  ')}`); process.exit(1); }
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
console.log('GATE: passed (reduce-hyb.mjs\'s gate and the fair-gate stamp check over results/diaghyb; the identity against ADOPT-PI\'s files is results-hyb.txt\'s); planted: passed\n');
console.log('1. O88\'S SPLIT OVER HYB\'S TRACES: the band [0.6, 0.75) State Pension drop by exact entry offset d = SP year - entry year: drop (SP-year path-years / year-before path-years)');
console.log('  household  SP year  arm    ' + [0, 1, 2, 3, 4].map(d => `d ${d}`.padEnd(26)).join(''));
for (const id of ['S130', 'S370']) {
  const sp = spYearOf(id);
  for (const a of ['SNAP', 'PCLSI', 'HYB']) console.log(`  ${id.padEnd(10)} ${String(sp).padStart(7)}  ${a.padEnd(6)} ${byEntry(tr.files[`${id} ${a}`], sp).map(x => `${f4(x.drop)} (${x.sp}/${x.before})`.padEnd(26)).join('')}`);
}
console.log('\n2. THE BAND DWELL OVER THE DISCORDANT PATHS: per group, its paths (n), then per arm the mean years in [0.6, 0.75) of those of its paths that reach 0.6 (and how many reach)');
for (const id of PANEL) {
  const g = dwellByGroup(tr.files[`${id} SNAP`], tr.files[`${id} PCLSI`], tr.files[`${id} HYB`]);
  for (const [name, r] of Object.entries(g)) console.log(`  ${id.padEnd(6)} ${name.padEnd(44)} n ${String(r.n).padStart(5)} | SNAP ${f2(r.SNAP.mean)} (${r.SNAP.reach})  PCLSI ${f2(r.PCLSI.mean)} (${r.PCLSI.reach})  HYB ${f2(r.HYB.mean)} (${r.HYB.reach})`);
}
