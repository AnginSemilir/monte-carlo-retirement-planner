/*
 * THE SAVINGS SPLIT'S v2, BESIDE THE RULE (written after the read, deciding nothing; the reviewer at the read,
 * reviews/2026-11-21-read-save-v2.md, MINORs 1 to 4). From the run's units (audit-save-v2.mjs, read by reduce-save-v2.mjs's
 * own loader), the figures the reviewer named that the read does not print:
 *   A. the time: each household's CPU a path, CANDSA over CANDDA (on anchors, the menu the app solves a working single on) and
 *      CANDS over CANDD (the whole menu), by its working years; the solve the same way (a guide: four units ran at a time);
 *   B. where the gain sits: the paths saved and lost by kind (the path ran out in some year, or met every year's spending and
 *      ended below the minimum pot), by cohort; the failure year of the paths saved (the first six retired years, the plan's
 *      last three); the spending level by retired year band; by employment, pooled by path, with each group's share of the
 *      pooled gain, and the employees' working-year decisions from 2029 (the cap on salary sacrifice's NIC relief from April
 *      2029 not modelled, D112 (M6), D134 (3));
 *   C. the pot by household (the mean, the median and capped at the household's estate cap, CANDS against CANDD), where the
 *      split puts the saving ISA first, and lifetime tax by household (what it counts: below);
 *   D. the panel's shape, from its plans: employment, salary and its growth, region, the employer NIC pass-through, the MPAA,
 *      each pot's yearly saving as a share of the salary and its yearly increase, the working years.
 *   node research/solver/save-v2-beside.mjs [dir] > research/solver/results-save-v2-beside.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDir, compare } from './reduce-save-v2.mjs';
import { readSaveV2Panel } from './save-v2-panel.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'save-v2-run');
const units = loadDir(DIR).sort((a, b) => a.k - b.k);
const f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = (c, d = 3) => `${f(c.d, d)} (${f(c.lo, d)} to ${f(c.hi, d)})`;
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const sum = a => { let s = 0; for (const x of a) s += x; return s; }, mean = a => sum(a) / a.length;
const median = a => { const s = [...a].sort((p, q) => p - q), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const range = xs => `the median x${median(xs).toFixed(2)} (x${Math.min(...xs).toFixed(2)} to x${Math.max(...xs).toFixed(2)})`;
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const u0 = units[0];
console.log(`THE SAVINGS SPLIT'S v2, BESIDE THE RULE (written after the read, deciding nothing): ${units.length} households from ${DIR}; code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}`);

// A. the time
{
  const perPath = (U, a) => U.arms[a].cpuUs / U.arms[a].n;
  const rows = units.map(U => ({ id: U.id, wy: U.arms.CANDS.workT.length, anchors: perPath(U, 'CANDSA') / perPath(U, 'CANDDA'), whole: perPath(U, 'CANDS') / perPath(U, 'CANDD'),
    solveA: U.arms.CANDSA.solveSecs / U.arms.CANDDA.solveSecs, solveW: U.arms.CANDS.solveSecs / U.arms.CANDD.solveSecs }));
  console.log('\nA. The time, the split over the candidate as it stands (each arm\'s CPU a path, its microseconds over its paths; a guide, four units at a time):');
  console.log(`  a path on anchors, CANDSA over CANDDA: ${range(rows.map(r => r.anchors))}; on the whole menu, CANDS over CANDD: ${range(rows.map(r => r.whole))}`);
  for (const wy of [...new Set(rows.map(r => r.wy))].sort((a, b) => a - b)) { const g = rows.filter(r => r.wy === wy); console.log(`    with ${wy} working years to choose (${g.length} households): on anchors ${range(g.map(r => r.anchors))}`); }
  console.log(`  the solve on anchors, CANDSA over CANDDA: ${range(rows.map(r => r.solveA))}; on the whole menu: ${range(rows.map(r => r.solveW))}`);
  console.log('  why, from the code (src/solver/solve.js): a menu carrying the split\'s copies sets r.nAt (the solve\'s finish), and with r.nAt set the chooser');
  console.log('  drops P1\'s once-a-decision memo (decisionRepeats) and the shortlist (chooseAction\'s shortMask) in every year of a path, the working years');
  console.log('  and the rest alike; outside the working years the copies are left out of the moves scored (splitCounts, movesAt). So the speed mode');
  console.log('  (chooserShortlist \'order\', the shortlist alone) acts nowhere on a working saver\'s path once the split is on.');
}

// B. where the gain sits
{
  console.log('\nB. Where the gain sits, CANDS against CANDD on the whole menu (every registered path):');
  const kindOf = (A, i) => (A.unmet[i] > 0.5 ? 'out' : 'pot');   // a failed path that ran short in some year, or met every year and ended below the minimum pot
  for (const [name, us] of [['all', units], ...[...new Set(units.map(u => u.cohort))].map(c => [c === 'fire' ? 'the younger cohort' : 'the library cohort', units.filter(u => u.cohort === c)])]) {
    const t = { saved: { out: 0, pot: 0 }, lost: { out: 0, pot: 0 } };
    let first6 = 0, last3 = 0, savedN = 0;
    for (const U of us) {
      const D = U.arms.CANDD, S = U.arms.CANDS;
      for (let i = 0; i < U.N; i++) {
        if (S.survived[i] && !D.survived[i]) { t.saved[kindOf(D, i)]++; savedN++; const fy = D.failYear[i]; if (fy - D.retireT < 6) first6++; if (fy >= D.T - 2) last3++; }
        else if (D.survived[i] && !S.survived[i]) t.lost[kindOf(S, i)]++;
      }
    }
    const net = t.saved.out + t.saved.pot - t.lost.out - t.lost.pot;
    console.log(`  ${name} (${us.length}): saved ${t.saved.out + t.saved.pot} (CANDD's path ran out ${t.saved.out}, ended below the minimum pot having met every year ${t.saved.pot}); lost ${t.lost.out + t.lost.pot} (CANDS's ran out ${t.lost.out}, below the pot ${t.lost.pot}); net ${net}, of it the minimum pot's ${t.saved.pot - t.lost.pot} (${(100 * (t.saved.pot - t.lost.pot) / net).toFixed(1)}%)`);
    console.log(`    the paths saved by the year CANDD's failed: in the first six retired years ${first6}, in the plan's last three ${last3}, of ${savedN}`);
  }
  console.log('  the spending level by retired year band, percent of target, the mean over every path and year (a year after a path fails as recorded):');
  for (const c of [...new Set(units.map(u => u.cohort))]) for (const a of ['CANDD', 'CANDS']) {
    const bands = [[0, 5], [5, 10], [10, 20], [20, 1e9]].map(([lo, hi]) => { let t = 0, k = 0; for (const U of units.filter(u => u.cohort === c)) { const A = U.arms[a], Y = A.Y, n = A.n; for (let i = 0; i < n; i++) for (let y = A.retireT + lo; y < Math.min(Y, A.retireT + hi); y++) { t += A.level[i * Y + y]; k++; } } return k ? (t / k).toFixed(2) : '-'; });
    console.log(`    ${c === 'fire' ? 'the younger cohort' : 'the library cohort'} ${a}: retired years 0-4 ${bands[0]}, 5-9 ${bands[1]}, 10-19 ${bands[2]}, 20 on ${bands[3]}`);
  }
  const all = compare(units, 'CANDD', 'CANDS'), byId = Object.fromEntries(all.rows.map(r => [r.id, r.ch.d])), tot = sum(all.rows.map(r => r.ch.d));
  for (const [name, p] of [['the employees', u => !u.selfEmployed], ['the self-employed', u => u.selfEmployed]]) {
    const us = units.filter(p), c = compare(us, 'CANDD', 'CANDS');
    console.log(`  ${name} (${us.length}): pooled survival ${iv(c.pooled)} by path; spending ${f(c.spend.pooled.d, 4)}%; its households' share of the pooled gain ${(100 * sum(us.map(u => byId[u.id])) / tot).toFixed(1)}%; a household below nought: ${c.rows.filter(r => r.ch.d < 0).map(r => r.id).join(', ') || 'none'}`);
  }
  let dec2029 = 0, decAll = 0, pen2029 = 0;
  for (const U of units.filter(u => !u.selfEmployed)) {
    const b = U.arms.CANDS.beside, save = dec(b.save, Uint8Array), wt = U.arms.CANDS.workT, base = U.arms.CANDS.baseYear;
    wt.forEach((t, d) => { for (let i = 0; i < b.N; i++) { decAll++; if (base + t >= 2029) { dec2029++; if (save[i * wt.length + d] === 1) pen2029++; } } });
  }
  console.log(`  the employees' working-year decisions on the paths recorded beside (runPolicy's): ${decAll}, from 2029 ${dec2029} (${(100 * dec2029 / decAll).toFixed(1)}%); the pension first in ${(100 * pen2029 / dec2029).toFixed(1)}% of those (the read: 77.5%)`);
}

// C. the pot by household, where the split puts the saving ISA first, and lifetime tax
{
  console.log('\nC. The pot left and lifetime tax by household, CANDS against CANDD on the whole menu (the mean a path; the median; capped at the estate cap; the share of working-year decisions CANDS puts the saving ISA first, on the paths recorded beside):');
  const lower = { mean: [], median: [], capped: [] }; let taxUp = 0;
  for (const U of units) {
    const D = U.arms.CANDD, S = U.arms.CANDS, cap = D.estateCap, capm = A => mean(Array.from(A.pot, v => Math.min(v, cap))), pc = (a, b) => 100 * (b / a - 1);
    const m = pc(mean(D.pot), mean(S.pot)), md = pc(median(Array.from(D.pot)), median(Array.from(S.pot))), cp = pc(capm(D), capm(S)), tx = mean(S.tax) - mean(D.tax);
    const b = S.beside, sv = dec(b.save, Uint8Array), isaFirst = sv.length ? 100 * Array.from(sv).filter(x => x === 2).length / sv.length : 0;
    if (m < 0) lower.mean.push(U.id); if (md < 0) lower.median.push(U.id); if (cp < 0) lower.capped.push(`${U.id} ${f(cp)}%`); if (tx > 0) taxUp++;
    console.log(`  ${U.id.padEnd(6)} ${U.cohort === 'fire' ? 'younger' : 'library'} ${U.selfEmployed ? 'self-employed' : 'employee'}: the mean ${f(m)}% (${gbp(mean(S.pot) - mean(D.pot))}); the median ${f(md)}%; capped ${f(cp)}%; ISA first ${isaFirst.toFixed(1)}%; lifetime tax ${gbp(tx)} (${f(100 * tx / mean(D.tax), 1)}%)`);
  }
  console.log(`  the mean pot lower on ${lower.mean.length} of ${units.length} (${lower.mean.join(', ')}); the median on ${lower.median.length}; the capped pot on ${lower.capped.length}: ${lower.capped.join(', ') || 'none'}; lifetime tax higher on ${taxUp}`);
  console.log('  what lifetime tax counts (audit-phase4.mjs runPath: taxPaid and cgtPaid summed over the years; src/App.jsx stepYear\'s note on the');
  console.log('  taxable pay): taxPaid is the person\'s bill less the tax on their pay alone, so a working year\'s relief on a pension saving never');
  console.log('  shows in it, while the tax on a larger pension\'s later draws does: a rise is not shown to be a cost.');
}

// D. the panel's shape
{
  const panel = readSaveV2Panel(), byId = Object.fromEntries(panel.map(u => [u.id, u]));
  console.log('\nD. The panel\'s shape, from its plans (save-v2-panel.json):');
  const rows = units.map(U => {
    const p = byId[U.id].plan, d = p.demographics, c = p.config, A = Object.fromEntries(p.accounts.map(a => [a.id, a])), sal = Number(d.salarySelf) || 0;
    const share = id => (sal > 0 && A[id] ? `${(100 * (Number(A[id].contrib) || 0) / sal).toFixed(1)}%` : (A[id] && A[id].contrib ? `£${A[id].contrib}` : '0'));
    return { id: U.id, emp: d.employmentSelf, sal, growth: d.salaryGrowthSelf === '' ? 'none' : d.salaryGrowthSelf, region: c.taxRegion, pass: c.employerNicPassThrough, mpaa: d.mpaaAgeSelf === '' ? 'none' : d.mpaaAgeSelf,
      pen: share('pen_self'), isa: share('isa_self'), other: share('other_self'), cash: share('cash_self'), up: [...new Set(['pen_self', 'isa_self'].map(id => `${A[id] ? Number(A[id].growth) || 0 : 0}% a year`))].join(' / '), wy: (Number(d.retireAgeSelf) || 0) - (Number(d.currentAgeSelf) || 0) };
  });
  const tally = k => Object.entries(rows.reduce((t, r) => { t[r[k]] = (t[r[k]] || 0) + 1; return t; }, {})).map(([v, n]) => `${v} ${n}`).join(', ');
  console.log(`  employment: ${tally('emp')}; salary growth: ${tally('growth')}; region: ${tally('region')}; the employer NIC pass-through: ${tally('pass')}; the MPAA: ${tally('mpaa')}`);
  console.log(`  the yearly saving as a share of salary: the pension ${tally('pen')}; the ISA ${tally('isa')}; the taxable account ${tally('other')}; cash ${tally('cash')}; the saving's yearly increase (pension/ISA): ${tally('up')}`);
  const emp = rows.filter(r => r.emp !== 'self-employed').map(r => r.sal), se = rows.filter(r => r.emp === 'self-employed').map(r => r.sal);
  console.log(`  the employees' salaries ${gbp(Math.min(...emp))} to ${gbp(Math.max(...emp))}; the self-employed's ${se.length ? `${gbp(Math.min(...se))} to ${gbp(Math.max(...se))}` : 'none'}; the working years: ${tally('wy')}`);
}
