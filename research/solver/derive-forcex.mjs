/*
 * FORCE-X'S DERIVATION (predictions/diag-forcex.md, the Derivation, Power and Credence sections). From EDGE-SPLIT's S130 files
 * and HYB's, each through its own gate (rule 3: a re-use of their files for a new question):
 *   1. THE GAPS: for each deciding arm (SNAP, P-LO, HYB), per path, P = PCLSI - a in survival: the paths PCLSI saves that the
 *      arm loses (+1), the reverse (-1), and the sum, the denominator of R.
 *   2. ITEM 1's POWER: for a true recovery r, the forced arm X rescues each +1 path with chance r and keeps the arm's outcome
 *      elsewhere, with a symmetric flip on a share FLIP of the other paths (the force moves later years on paths it does not
 *      rescue; FLIP 0.01 assumed, NOT CHECKED - EDGE-SPLIT's S-INT against S-HI, which share every move, flip none); read by
 *      the registered rule (reduce-forcex.mjs item1: flipP, Holm over six, LO 0.3, HI 0.7), the same r on all three arms, over
 *      R_BOOT draws; the chance of HELD, FALSIFIED and INCONCLUSIVE at each r.
 *   3. THE CREDENCES: the deep review's own (deep-review-log.md 6 Oct 01:52 UK, CAUSE CREDENCES), which it already shaded by
 *      the base rate ("Base rate (ranked 1 of 19) shades LOSS-PAUSE"), so they are not shaded again (the deep review after
 *      XAS-R2, 6 Oct 03:10 UK, FLAG 2: XAS-R2's derivation shaded twice): LOSS-PAUSE 0.50, LOSS-TABLES 0.25, LOSS-OPT 0.10,
 *      LOSS-NOISE 0.02, the unassigned 0.13; each story's r: LOSS-PAUSE 0.9, LOSS-TABLES 0.1, LOSS-OPT 0.5 (survival rises,
 *      partly), LOSS-NOISE 0, the unassigned 0.5.
 *   node research/solver/derive-forcex.mjs > research/solver/results-derive-forcex.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { stampOf } from './reduce-adoptpi.mjs';
import { recovery, item1, DECIDING, ARM } from './reduce-forcex.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const R_BOOT = 40, B_FLIP = 2000, FLIP = 0.01, BASE_RATE = 0.10;
const f2 = x => x.toFixed(2), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');
const rng = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function shade(o, lead) {
  const w = { [lead]: (o[lead] + BASE_RATE) / 2 }, rest = Object.keys(o).filter(k => k !== lead), rs = rest.reduce((s, k) => s + o[k], 0);
  for (const k of rest) w[k] = (1 - w[lead]) * o[k] / rs;
  return w;
}
/* one simulated forced arm: rescue each +1 path with chance r, flip a share FLIP of the rest either way */
export function simulate(A, P, r, rand) {
  return A.map((a, j) => { const g = P[j] - a; if (g > 0) return rand() < r ? 1 : a; if (rand() < FLIP) return rand() < 0.5 ? 1 - a : a; return a; });
}
// PLANTED (rule 6): r 1 without flips recovers the whole gap; r 0 none; shade keeps the weights summing to 1
{
  const A = [0, 0, 1, 1, 0], P = [1, 1, 1, 1, 0], one = rng(1), x1 = A.map((a, j) => (P[j] - a > 0 ? 1 : a)), r1 = recovery(x1, A, P).R, r0 = recovery(A, A, P).R;
  const w = shade({ A: 0.5, B: 0.3, C: 0.2 }, 'A'), sw = Object.values(w).reduce((s, x) => s + x, 0);
  if (!(r1 === 1 && r0 === 0 && Math.abs(w.A - 0.3) < 1e-12 && Math.abs(sw - 1) < 1e-12 && simulate(A, P, 1, one).length === 5)) { console.log(`PLANTED CHECK FAILED: ${r1} ${r0} ${JSON.stringify(w)}`); process.exit(1); }
}

const logsIn = dir => Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')]));
const RE = await import('./reduce-edge.mjs'), dir = join(HERE, 'results', 'diagedge'), logs = logsIn(dir), units = Object.values(logs).flatMap(RE.parse);
requireFairLogs(logs, RE.PRED);
const bad = RE.gate(units);
const tr = bad.length ? null : RE.loadTraces(units, dir, stampOf(Object.values(logs)[0]));
if (tr) bad.push(...tr.bad);
const H = bad.length ? null : RE.hybFiles();
if (H) bad.push(...H.bad);
if (bad.length) { console.log(`GATE (EDGE-SPLIT's and HYB's files): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log('GATE (EDGE-SPLIT\'s and HYB\'s files, each through its own gate): passed; planted: passed\n');
const surv = k => Array.from((k === 'S130 HYB' ? H.files[k] : tr.files[k]).survived);
const PC = surv('S130 PCLSI'), AR = Object.fromEntries(DECIDING.map(a => [a, surv(`S130 ${ARM[a].partner}`)]));

console.log('1. THE GAPS (S130, per path, P = PCLSI - a in survival)');
for (const a of DECIDING) { const A = AR[a], g = A.map((x, j) => PC[j] - x); console.log(`  ${ARM[a].partner.padEnd(6)} survivors ${A.reduce((s, x) => s + x, 0)} (PCLSI ${PC.reduce((s, x) => s + x, 0)}): PCLSI saves ${g.filter(x => x > 0).length}, loses ${g.filter(x => x < 0).length}, the gap ${g.reduce((s, x) => s + x, 0)} paths`); }

console.log(`\n2. ITEM 1'S POWER: the same true recovery r on all three arms, a flip share ${FLIP} on the other paths (assumed), the registered rule, ${R_BOOT} draws (flipP B ${B_FLIP})`);
const R_GRID = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1], POW = {};
for (const r of R_GRID) {
  const rand = rng(7005 + Math.round(1000 * r)), n = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let b = 0; b < R_BOOT; b++) n[item1(DECIDING.map(a => recovery(simulate(AR[a], PC, r, rand), AR[a], PC)), { b: B_FLIP }).v]++;
  POW[r] = Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / R_BOOT]));
  console.log(`  r ${f2(r)}: HELD ${f2(POW[r].HELD)} FALSIFIED ${f2(POW[r].FALSIFIED)} INCONCLUSIVE ${f2(POW[r].INCONCLUSIVE)}`);
}
const near = r => POW[R_GRID.reduce((b, x) => (Math.abs(x - r) < Math.abs(b - r) ? x : b), R_GRID[0])];

console.log('\n3. THE CREDENCES (the deep review\'s own, already shaded by the base rate in its receipt, not shaded again; the unassigned mass kept)');
const w = { PAUSE: 0.50, TABLES: 0.25, OPT: 0.10, NOISE: 0.02, OTHER: 0.13 }, rOf = { PAUSE: 0.9, TABLES: 0.1, OPT: 0.5, NOISE: 0, OTHER: 0.5 }, c = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
for (const [k, wk] of Object.entries(w)) { const p = near(rOf[k]); for (const o of Object.keys(c)) c[o] += wk * p[o]; }
console.log(`  item 1 (stories ${Object.entries(w).map(([k, v]) => `${k} ${f3(v)} at r ${rOf[k]}`).join(', ')}): HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
console.log(`CREDENCE item 1: point ${f2(Object.entries(w).reduce((s, [k, v]) => s + v * rOf[k], 0))} HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
