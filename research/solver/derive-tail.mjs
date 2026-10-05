// TAIL's power and cost (predictions/diag-tail.md), from ADOPT-PI's records (results/diagadoptpi: the same unit, seed 7005 and
// 6,000 paths; through reduce-adoptpi.mjs's gate and stamp check first, rule 3) and reduce-tail.mjs's own tests:
//   1. item 1: on each TAIL household at PCLSI's ADOPT-PI survival, the most paths the margin may lose with none saved, and
//      with as many saved as lost less that, and still pass (the exact rule and the guarded interval);
//   2. item 2: PCLSI's per-path extra tax g over SNAP on each loser (ADOPT-PI's files); the margin modelled as closing each
//      path's whole gap with chance c and none of it otherwise (x = g B, B ~ Bernoulli(c), seeded); the read through
//      reduce-tail.mjs's own closure test (flipP, Holm over the 10) for c in 0.3, 0.4, 0.5, 0.6, 0.7, 1;
//   3. item 3: on S130, S370 and S128, ADOPT-PI's per-path survival in SNAP and PCLSI, HYB built to take PCLSI's outcome on
//      a share s of the discordant paths (every s-th, so the split is exact) and SNAP's on the rest, for s in 0, 0.1, 0.25,
//      0.4, 0.5, 0.6, 0.75, 1; y = (PCLSI - HYB) - (HYB - SNAP) a path, reduce-tail.mjs's randomization test, Holm over the 6;
//   4. the cost: ADOPT-PI's solve and forward seconds per unit (its solve and sum lines), a job's solves and forward runs as
//      audit-tail.mjs's armsOf, four cores longest first (batch-tail.sh).
//   node research/solver/derive-tail.mjs > research/solver/results-derive-tail.txt
// e3 off: no solve is run here
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { outcome, survivalChangeU, marginFor, holm } from './stats.mjs';
import { guarded } from './reduce-7aa.mjs';
import { flipP } from './reduce-7ar.mjs';
import { parse, gate, loadTraces, stampOf, logsOf, paired, PRED } from './reduce-adoptpi.mjs';
import { LOSERS, TAIL, HYB_PANEL, JOBS, armsOf, ALPHA } from './reduce-tail.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagadoptpi');
const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units), tr = bad.length ? { bad } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
if (bad.length || tr.bad.length) { console.log(`GATE: FAILED\n  ${[...bad, ...(tr.bad || [])].join('\n  ')}`); process.exit(1); }
const F = tr.files, B = 20000;
console.log('GATE: passed (reduce-adoptpi.mjs\'s gate and the fair-gate stamp check over results/diagadoptpi)');
const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mean = xs => xs.reduce((t, x) => t + x, 0) / xs.length;

// 1. item 1
console.log('\n1. ITEM 1: the most paths PCLSI-TIE may lose against PCLSI and still pass (exact no material harm AND the guarded lower end above minus the margin), with 0 saved, and with saved = lost - 5');
const passes = (a, b, c, d, N, margin) => outcome({ b, c, N, margin, pHolm: 1 }).outcome === 'no material harm' && guarded(survivalChangeU(a, b, c, d, ALPHA), b, c, N, ALPHA).lo > -margin;
for (const id of TAIL) {
  const P = F[`${id} PCLSI`], N = P.N, S = P.survived.reduce((t, x) => t + x, 0), margin = marginFor(100 * S / N);
  const most = save => { let k = 0; while (k < S && passes(S - k - 1, k + 1, save(k + 1), N - S - save(k + 1), N, margin)) k++; return k; };
  console.log(`  ${id.padEnd(16)} PCLSI ${(100 * S / N).toFixed(2)}% margin ${margin} | lost with none saved: up to ${most(() => 0)} | lost with lost - 5 saved: up to ${most(k => Math.max(0, Math.min(N - S, k - 5)))}`);
}

// 2: the closure test as reduce-tail.mjs runs it (closure() is internal: flipP of up and of -up, Holm over the 10)
const read = rowsUp => { const ps = rowsUp.flatMap(up => [flipP(up, B, 7002), flipP(up.map(x => -x), B, 7003)]), ph = holm(ps); return rowsUp.map((_, i) => (ph[2 * i] < ALPHA ? 'HELD' : ph[2 * i + 1] < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE')); };
const verdict = rs => (rs.every(r => r === 'HELD') ? 'HELD' : rs.filter(r => r === 'FALSIFIED').length >= 3 ? 'FALSIFIED' : 'INCONCLUSIVE');
console.log('\n2. ITEM 2: g = tax(PCLSI) - tax(SNAP) a path (ADOPT-PI\'s files); the margin closes each path\'s whole gap with chance c (x = g B); reduce-tail.mjs\'s test of mean(x - g/2), Holm over 10');
const G = Object.fromEntries(LOSERS.map(id => { const S = F[`${id} SNAP`], P = F[`${id} PCLSI`]; return [id, Array.from({ length: S.N }, (_, j) => P.tax[j] - S.tax[j])]; }));
console.log(`  mean g: ${LOSERS.map(id => `${id} ${mean(G[id]).toFixed(0)}`).join(', ')}; paths with g not 0: ${LOSERS.map(id => `${id} ${G[id].filter(x => x !== 0).length}`).join(', ')}`);
for (const c of [0.3, 0.4, 0.5, 0.6, 0.7, 1]) {
  const r = rng(Math.round(9000 + 100 * c)), rs = read(LOSERS.map(id => G[id].map(g => (r() < c ? g : 0) - g / 2)));
  console.log(`  c ${c.toFixed(1)}: ${LOSERS.map((id, i) => `${id} ${rs[i]}`).join(', ')} -> ${verdict(rs)}`);
}
// 3. item 3
console.log('\n3. ITEM 3: HYB built from ADOPT-PI\'s SNAP and PCLSI paths, taking PCLSI\'s outcome on a share s of the discordant paths (the tables\' share); y = (PCLSI - HYB) - (HYB - SNAP), the randomization test above and below 0, Holm over 6');
const cells = Object.fromEntries(HYB_PANEL.map(id => [id, paired(F[`${id} SNAP`], F[`${id} PCLSI`])]));
console.log(`  ${HYB_PANEL.map(id => `${id} b ${cells[id].b} c ${cells[id].c}`).join(', ')}`);
for (const s of [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 1]) {
  const ys = HYB_PANEL.map(id => {
    const S = F[`${id} SNAP`].survived, P = F[`${id} PCLSI`].survived; let k = 0, acc = 0;
    return Array.from({ length: S.length }, (_, j) => { let H = S[j]; if (S[j] !== P[j]) { k++; acc += s; if (acc >= 1 - 1e-9) { acc -= 1; H = P[j]; } } return P[j] - 2 * H + S[j]; });
  });
  const h = holm(ys.flatMap(y => [flipP(y, B, 7002), flipP(y.map(x => -x), B, 7003)]));
  const reads = HYB_PANEL.map((id, i) => (h[2 * i] < ALPHA ? 'READ' : h[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT'));
  console.log(`  s ${s.toFixed(2)}: ${HYB_PANEL.map((id, i) => `${id} ${reads[i]}`).join(', ')} -> ${reads[0] === 'READ' ? 'HELD' : reads[0] === 'TABLES' ? 'FALSIFIED' : 'INCONCLUSIVE'}`);
}

// 4. the cost from ADOPT-PI's own seconds
console.log('\n4. THE COST (ADOPT-PI\'s solve and forward seconds a unit at 6,000 paths)');
const secs = {};
for (const t of Object.values(logs)) {
  let id = null, arm = null;
  for (const l of t.split('\n')) {
    const c = /^(\S.*?)\s+case \| unit OFF\/PRODUCT\/W0\.02(\/DT)?\/(SNAP|PCLSI) /.exec(l); if (c) { id = c[1].trim() + (c[2] ? ' DT' : ''); arm = c[3]; (secs[id] ||= {})[arm] = { solve: 0, fwd: 0 }; continue; }
    const s = /^\s+solve \S+: secs (\d+)/.exec(l); if (s && id) secs[id][arm].solve = Number(s[1]);
    const w = /^\s+sum \S+: .* secs (\d+)$/.exec(l); if (w && id) secs[id][arm].fwd = Number(w[1]);
  }
}
let tot = 0; const jobs = [];
for (const [id, g] of JOBS) {
  const s = secs[id]; if (!s) { console.error(`derive-tail: no ADOPT-PI seconds for ${id}`); process.exit(1); }
  const arms = armsOf(id, g), pf = arms.filter(a => a !== 'SNAP').length, t = s.SNAP.solve + s.PCLSI.solve + s.SNAP.fwd + pf * s.PCLSI.fwd;
  tot += t; jobs.push(t);
  console.log(`  ${(id + ' ' + g).padEnd(20)} solves ${s.SNAP.solve} + ${s.PCLSI.solve} s; forward SNAP ${s.SNAP.fwd} s, ${pf} on PCLSI's tables at ${s.PCLSI.fwd} s: ${(t / 3600).toFixed(2)} core-hours`);
}
const ends = [0, 0, 0, 0];
for (const j of jobs.slice().sort((a, b) => b - a)) { const c = ends.indexOf(Math.min(...ends)); ends[c] += j; }
console.log(`  total ${(tot / 3600).toFixed(1)} core-hours; the longest job ${(Math.max(...jobs) / 3600).toFixed(2)} hours; on four cores, longest first, ${(Math.max(...ends) / 3600).toFixed(1)} hours (ADOPT-PI's seconds were measured under its own load; the per-path trace record's own cost NOT CHECKED, measured in the preflight's seconds only at 20 paths)`);
