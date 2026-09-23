/*
 * STEP 2 REDUCER (PLAN.md step 2): reads results/s2-*, prints each comparison against the gates and
 * predictions written before the run (batch-step2.sh header and the predictions register).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const load = (arm, id) => { const f = join(R, `s2-${arm}`, `${id}.json`); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; };
const ids = existsSync(join(R, 's2-new')) ? readdirSync(join(R, 's2-new')).filter(f => /^S\d+\.json$/.test(f)).map(f => f.slice(0, -5)).sort() : [];
const k = (x) => x === null || x === undefined ? '   -  ' : x;
const f1 = (x, d = 1) => (x === null || x === undefined || Number.isNaN(x) ? '-' : x.toFixed(d));
const sg = (x, d = 2) => (x >= 0 ? '+' : '') + x.toFixed(d);

console.log('1. TODAY AGAINST THE NEW BASELINE (same lambda)');
console.log('   id     survival       years below     depth below    years above    spending     tax (k)       median pot (k)');
for (const id of ids) {
  const a = load('today', id)?.solver, b = load('new', id)?.solver; if (!a || !b) continue;
  console.log(`   ${id}  ${f1(a.floorRate)} -> ${f1(b.floorRate)}   ${f1(a.belowYearsMean)} -> ${f1(b.belowYearsMean)}     ${f1(a.levelWhenBelowMean, 2)} -> ${f1(b.levelWhenBelowMean, 2)}   ${f1(a.aboveTargetYearsMean)} -> ${f1(b.aboveTargetYearsMean)}   ${f1(a.meanLevelMedian, 3)} -> ${f1(b.meanLevelMedian, 3)}   ${f1(a.medianLifetimeTax / 1e3, 0)} -> ${f1(b.medianLifetimeTax / 1e3, 0)}   ${f1(a.medianTerminalNet / 1e3, 0)} -> ${f1(b.medianTerminalNet / 1e3, 0)}`);
}

const gate = (label, other, survTol, spendTol) => {
  console.log(`\n${label}`);
  let pass = true;
  for (const id of ids) {
    const n = load('new', id), o = load(other, id); if (!n || !o) continue;
    const ds = o.solver.floorRate - n.solver.floorRate, dl = 100 * (o.solver.meanLevelMedian - n.solver.meanLevelMedian) / n.solver.meanLevelMedian;
    const ok = Math.abs(ds) <= survTol && Math.abs(dl) <= spendTol; if (!ok) pass = false;
    const tn = n.knobs?.solveMs, to = o.knobs?.solveMs;
    console.log(`   ${id}  survival ${sg(ds)}   spending ${sg(dl)}%   solve ${tn ? (tn / 1000).toFixed(0) : '-'}s vs ${to ? (to / 1000).toFixed(0) : '-'}s   ${ok ? 'ok' : 'OUTSIDE'}`);
  }
  console.log(`   GATE: every household within ${survTol} of survival and ${spendTol}% of spending ... ${pass ? 'PASS' : 'FAIL'}`);
  return pass;
};
gate('2. TERNARY (new) AGAINST EXHAUSTIVE (newex); speed from solve times', 'newex', 0.5, 1);
{
  let tn = 0, te = 0; for (const id of ids) { const n = load('new', id), e = load('newex', id); if (n?.knobs?.solveMs && e?.knobs?.solveMs) { tn += n.knobs.solveMs; te += e.knobs.solveMs; } }
  if (te) console.log(`   total solve time: ternary ${(tn / 1000).toFixed(0)}s, exhaustive ${(te / 1000).toFixed(0)}s -> ${(100 * (1 - tn / te)).toFixed(1)}% faster (gate: at least 15%)`);
}
gate('3a. 15 QUADRATURE NODES AGAINST 5 (decision A)', 'newq15', 0.5, 1);
gate('3b. 56 WEALTH POINTS AGAINST 30 (decision A)', 'newp56', 0.5, 1);

console.log('\n4. THE #106 FIX (none / drop / linear)');
for (const id of ['S126', 'S184', 'S162']) {
  const n = load('new', id)?.solver, d = load('drop', id)?.solver, l = load('linear', id)?.solver; if (!n) continue;
  const row = (x) => x ? `surv ${f1(x.floorRate)} below ${f1(x.belowYearsMean)} full ${f1(x.fullyFundedRate)} spend ${f1(x.meanLevelMedian, 3)}` : '-';
  console.log(`   ${id}  none: ${row(n)}\n          drop: ${row(d)}\n          lin:  ${row(l)}`);
}
