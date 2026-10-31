/*
 * NE-ROOT's two reader arms (src/solver/reader.js simChance and r0Split; PLAN.md NE-ROOT): each checked against what it
 * claims, and each check shown failing on a planted fault first.
 *   node research/tests/reader-neroot.test.mjs
 */
import assert from 'node:assert/strict';
import { referenceChance, simChance, r0Split } from '../../src/solver/reader.js';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };

// SIMP: for one and two bills referenceChance is exact (its header), so the simulated chance of the same schedule meets
// it within the draws' error at every level; a schedule with the drift moved half a point is caught by the same check
const bills = [20000, 30000], rho = [0.03], vol = [0.12];
const ref = referenceChance(bills, rho, vol), sim = simChance(bills, rho, vol, { draws: 40000, points: 240 });
const levels = [21000, 35000, 45000, 50000, 55000, 65000, 80000];
const worst = f => Math.max(...levels.map(a => { const p = ref(a), q = f(a), se = Math.sqrt(Math.max(p * (1 - p), 1e-4) / 40000); return Math.abs(p - q) / (4 * se + 0.004); }));
ok(worst(sim) <= 1, `simChance meets the exact two-bill chance within four standard errors and the table's step (worst ratio ${worst(sim).toFixed(3)})`);
const shifted = simChance(bills, [0.08], vol, { draws: 40000, points: 240 });
ok(worst(shifted) > 1, `planted: a drift five points off is caught (worst ratio ${worst(shifted).toFixed(3)})`);
// no spread: the chance is a step at the exact need, money arriving later included
const flat = simChance([10000, 5000, -3000, 4000], [0, 0, 0], [0, 0, 0], { draws: 200, points: 400 });
ok(flat(15200) === 0 && flat(15800) === 0 && flat(16200) === 1, 'with no spread the simulated chance steps at the whole need, 16000 (the later bill outweighs the inflow), not at the prefix 15000');
ok(flat(9000) === 0 && simChance([10000], [], [])(10000) === 1, "one bill and today's bill unpaid read as referenceChance's step does");

// R0: c = S / p, R zero to rounding where p is at least 1e-12; below it, everything in R; S reproduced at every node
const S = Float64Array.from([0.9, 0.04, 0.5, 0.2, 0.3]), p = Float64Array.from([0.95, 0.01, 0.4, 1e-14, 0.1]);
const z = r0Split(S, p);
ok([0, 1, 2, 4].every(i => Math.abs(z.R[i]) < 1e-12) && z.R[3] === S[3] && z.c[3] === 0 && z.zeroP === 1, 'r0Split leaves nothing in R where p >= 1e-12 and everything below it (zeroP 1)');
ok(S.every((s, i) => Math.abs(p[i] * z.c[i] + z.R[i] - s) < 1e-12) && z.c[4] > 1, 'r0Split reproduces S at every node, c unclipped above 1 where S beats p');
const clipped = { c: Float64Array.from(S, (s, i) => (p[i] >= 0.5 ? Math.min(1, s / p[i]) : 0.9)), R: null };
clipped.R = Float64Array.from(S, (s, i) => s - p[i] * clipped.c[i]);
ok(![0, 1, 2, 4].every(i => Math.abs(clipped.R[i]) < 1e-12), 'planted: the clipped and copied split (the reader as built) is caught leaving survival in R');
console.log(`reader-neroot: ${n} checks passed`);
