/*
 * SPEED-H, BESIDE THE RULE (EXPLORATORY; written after the read, deciding nothing; the reviewer at the read,
 * reviews/2026-11-20-read-speed-h.md, MINORs 1 to 4). From audit-speed-h.mjs's units, the figures the rule's "beside" asked
 * for that the read did not print, and those the reviewer named:
 *   A. each unit in both arms: survival, spending delivered, the mean and the capped pot, lifetime tax; and SPEED against
 *      WHOLE with the change's interval and the capped pot by unit;
 *   B. the cohorts apart (the library's, the younger), item 7's figures for each;
 *   C. the pooled figures without S047, the unit that carries the pooled spending and capped pot;
 *   D. the time: a path's (as the read), and with the solve counted (the measure SPEED-B's beside file gave the warning's
 *      speed by), each SPEED over WHOLE; and the order of timing: WHOLE solved and timed first in every unit, its table the
 *      same as SPEED's, so the second solve's time over the first is the order's own effect;
 *   E. the units' shape, from the panel they were landed in: each person's age, the first person's share of the pots, the
 *      minimum pot the plan sets.
 *   node research/solver/speed-h-beside.mjs [dir] > research/solver/results-speed-h-beside.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, rule } from './reduce-speed-b.mjs';
import { UNITS } from './audit-speed-h.mjs';
import { readPanel as readCouples } from './couple-panel.mjs';
import { PANEL_FILE as COUPLES_FILE } from './audit-couples.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'speed-h-7002');
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const units = UNITS.map(d => raw.find(u => u.id === d.id)).map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : NaN; };
const f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)})`;
const med = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const u0 = units[0];
console.log(`SPEED-H, BESIDE THE RULE (EXPLORATORY; written after the read, deciding nothing): ${units.length} households, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points`);

// A. each unit in both arms
console.log('\nA. Each unit in both arms (survival; spending delivered a path; the mean pot; the capped pot, at the unit\'s cap; lifetime tax a path), then SPEED against WHOLE:');
const r = rule(units);
for (const U of units) {
  const h = r.H.find(x => x.id === U.id), arm = x => ({ surv: 100 * mean(x.survived), sp: mean(x.delivered), pot: mean(x.pot), cap: mean(Array.from(x.pot, v => Math.min(v, U.cap))), tax: mean(x.tax) });
  const w = arm(U.arms.WHOLE), s = arm(U.arms.SPEED), row = (n, a) => `${n} ${a.surv.toFixed(3)}%, spending £${Math.round(a.sp)}, pot £${Math.round(a.pot)}, capped £${Math.round(a.cap)}, tax £${Math.round(a.tax)}`;
  console.log(`  ${U.id} (${U.cohort}, its cap £${Math.round(U.cap)}): ${row('WHOLE', w)}; ${row('SPEED', s)}; SPEED against WHOLE ${iv(h.ch)} points (${h.cells.saved} saved, ${h.cells.lost} lost), spending ${f(h.spend, 4)}%, pot ${f(h.pot, 3)}%, capped pot ${f(h.capped, 3)}%, tax ${f(h.tax, 2)}%`);
}

// B. the cohorts apart
console.log('\nB. The cohorts apart, SPEED against WHOLE (item 7\'s figures for each):');
for (const c of [...new Set(units.map(U => U.cohort))]) {
  const rc = rule(units.filter(U => U.cohort === c));
  console.log(`  ${c} (${rc.H.length}: ${rc.H.map(h => h.id).join(', ')}): pooled survival ${iv(rc.pooled)} points; spending ${f(rc.spend, 4)}%; the pot ${f(rc.potP, 3)}%, the capped pot ${f(rc.cappedP, 3)}%; no unit wholly below -0.3: ${rc.H.some(h => h.ch.hi < -0.3) ? 'NO' : 'none'}`);
}

// C. without S047
{ const rw = rule(units.filter(U => U.id !== 'S047'));
  console.log(`\nC. Without S047 (11 households): pooled survival ${iv(rw.pooled)} points; spending ${f(rw.spend, 4)}%; the pot ${f(rw.potP, 3)}%, the capped pot ${f(rw.cappedP, 3)}%. With it, as the read: spending ${f(r.spend, 4)}%, the capped pot ${f(r.cappedP, 3)}%.`); }

// D. the time
{ const perPath = r.H.map(h => h.time), withSolve = units.map(U => { const w = U.arms.WHOLE, s = U.arms.SPEED; return (s.solveSecs + s.ms * U.N / 1000) / (w.solveSecs + w.ms * U.N / 1000); });
  const order = units.map(U => U.arms.SPEED.solveSecs / U.arms.WHOLE.solveSecs);
  console.log(`\nD. The time, SPEED over WHOLE (one unit at a time, beside the registered run; a guide):`);
  console.log(`  a path's (the read): the median x${med(perPath).toFixed(2)} (x${Math.min(...perPath).toFixed(2)} to x${Math.max(...perPath).toFixed(2)})`);
  console.log(`  the solve and ${u0.N} paths together (SPEED-B's beside measure for the warning's speed): the median x${med(withSolve).toFixed(2)} (x${Math.min(...withSolve).toFixed(2)} to x${Math.max(...withSolve).toFixed(2)})`);
  console.log(`  the order: WHOLE solved and timed first in every unit; its table the same as SPEED's (the gate), so SPEED's solve over WHOLE's is the order's own effect: the median x${med(order).toFixed(3)} (x${Math.min(...order).toFixed(3)} to x${Math.max(...order).toFixed(3)}), below 1 on ${order.filter(x => x < 1).length} of ${order.length} units`);
  console.log(`  by unit (a path; with the solve; the solve alone): ${units.map((U, k) => `${U.id} x${perPath[k].toFixed(2)}, x${withSolve[k].toFixed(2)}, x${order[k].toFixed(3)}`).join('; ')}`); }

// E. the units' shape
{ const panel = readCouples(COUPLES_FILE), rows = units.map(U => { const h = panel.find(x => x.id === U.id), d = h.plan.demographics, of = w => h.plan.accounts.filter(a => a.id.endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
    return { id: U.id, a: Number(d.currentAgeSelf), b: Number(d.currentAgePart), share: of('self') / (of('self') + of('part')), floor: Number(h.plan.config && h.plan.config.solvencyFloor) || 0, k: U.arms.WHOLE.k }; });
  console.log(`\nE. The units' shape (the couples' re-run panel, at their landed targets): ${rows.map(x => `${x.id} ${x.a} and ${x.b}, the first person holding ${(100 * x.share).toFixed(1)}%, minimum pot £${x.floor}, k ${x.k.toFixed(4)}`).join('; ')}`);
  const gaps = [...new Set(rows.map(x => x.a - x.b))], shares = [...new Set(rows.map(x => x.share.toFixed(3)))];
  console.log(`  every unit ${gaps.length === 1 ? `${gaps[0]} years apart` : `apart by ${gaps.join(', ')} years`}, the first person holding ${shares.length === 1 ? `${(100 * Number(shares[0])).toFixed(1)}%` : shares.join(', ')} of the pots; a minimum pot set on ${rows.filter(x => x.floor > 0).length} of ${rows.length}`); }
