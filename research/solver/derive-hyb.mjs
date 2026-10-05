// HYB's power and cost (predictions/diag-hyb.md), from ADOPT-PI's records (results/diagadoptpi: the same unit, seed 7005 and
// 6,000 paths; through reduce-adoptpi.mjs's gate and stamp check first, rule 3) and reduce-hyb.mjs's own test:
//   1. item 1: on S130, S370 and S128, ADOPT-PI's per-path survival in SNAP and PCLSI, HYB built to take PCLSI's outcome on a
//      share s of the discordant paths (every s-th, so the split is exact) and SNAP's on the rest, for s in 0, 0.1, 0.25,
//      0.4, 0.5, 0.6, 0.75, 1; y = (PCLSI - HYB) - (HYB - SNAP) a path, the randomization test above and below 0, Holm over
//      the 6, read as reduce-hyb.mjs reads it;
//   1b. item 1 with a flip floor: HYB also flips f paths each way where SNAP and PCLSI agree (f 25, 75, 150);
//   2. the cost: ADOPT-PI's solve and forward seconds per unit (its solve and sum lines): a household's two solves, SNAP's
//      forward run and two on PCLSI's tables (PCLSI and HYB); three households on three cores.
//   node research/solver/derive-hyb.mjs > research/solver/results-derive-hyb.txt
// e3 off: no solve is run here
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { parse, gate, loadTraces, stampOf, logsOf, paired, PRED } from './reduce-adoptpi.mjs';
import { PANEL, ALPHA } from './reduce-hyb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagadoptpi');
const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units), tr = bad.length ? { bad } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
if (bad.length || tr.bad.length) { console.log(`GATE: FAILED\n  ${[...bad, ...(tr.bad || [])].join('\n  ')}`); process.exit(1); }
const F = tr.files, B = 20000;
console.log('GATE: passed (reduce-adoptpi.mjs\'s gate and the fair-gate stamp check over results/diagadoptpi)');

console.log('\n1. ITEM 1: HYB built from ADOPT-PI\'s SNAP and PCLSI paths, taking PCLSI\'s outcome on a share s of the discordant paths (the tables\' share); y = (PCLSI - HYB) - (HYB - SNAP), the randomization test above and below 0, Holm over 6');
console.log(`  ${PANEL.map(id => { const p = paired(F[`${id} SNAP`], F[`${id} PCLSI`]); return `${id} b ${p.b} c ${p.c}`; }).join(', ')}`);
for (const s of [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 1]) {
  const ys = PANEL.map(id => {
    const S = F[`${id} SNAP`].survived, P = F[`${id} PCLSI`].survived; let acc = 0;
    return Array.from({ length: S.length }, (_, j) => { let H = S[j]; if (S[j] !== P[j]) { acc += s; if (acc >= 1 - 1e-9) { acc -= 1; H = P[j]; } } return P[j] - 2 * H + S[j]; });
  });
  const h = holm(ys.flatMap(y => [flipP(y, B, 7002), flipP(y.map(x => -x), B, 7003)]));
  const reads = PANEL.map((id, i) => (h[2 * i] < ALPHA ? 'READ' : h[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT'));
  console.log(`  s ${s.toFixed(2)}: ${PANEL.map((id, i) => `${id} ${reads[i]}`).join(', ')} -> ${reads[0] === 'READ' ? 'HELD' : reads[0] === 'TABLES' ? 'FALSIFIED' : 'INCONCLUSIVE'}`);
}

// 1b. the same with a flip floor (the deep review after COV-B-STEP, 5 Oct 09:27 UK: a null perturbation also flips paths - S130
// lost 25 under PCLSI in ADOPT-PI, and 14 of 500 moved under a 1e-10 tie margin): HYB additionally takes the other outcome on f
// paths each way among those where SNAP and PCLSI agree, so its own noise is in both of its comparisons. The two ways are
// symmetric (the plan-auditor's BLOCKING 1 of 5 Oct): f lost from the paths both arms survive and f saved from the paths both
// lose, each spread evenly over its class by index; where a class holds fewer than f, both ways are capped at the smaller, and
// the counts are printed
const spread = (idx, f) => { const out = new Set(); for (let q = 0; q < f; q++) out.add(idx[Math.floor((q + 0.5) * idx.length / f)]); return out; };
console.log('\n1b. ITEM 1 WITH A FLIP FLOOR: as 1, and HYB also flips f paths each way (lost and saved, the same count) among the paths SNAP and PCLSI agree on');
for (const f of [25, 75, 150]) {
  const flips = PANEL.map(id => {
    const S = F[`${id} SNAP`].survived, P = F[`${id} PCLSI`].survived, both1 = [], both0 = [];
    for (let j = 0; j < S.length; j++) if (S[j] === P[j]) (S[j] === 1 ? both1 : both0).push(j);
    const n = Math.min(f, both1.length, both0.length);
    return { dn: spread(both1, n), up: spread(both0, n), n, c1: both1.length, c0: both0.length };
  });
  console.log(`  f ${f}: flipped each way ${PANEL.map((id, i) => `${id} ${flips[i].n} (of ${flips[i].c1} both survived, ${flips[i].c0} both lost)`).join(', ')}`);
  for (const s of [0, 0.1, 0.25, 0.4, 0.5]) {
    const ys = PANEL.map((id, i) => {
      const S = F[`${id} SNAP`].survived, P = F[`${id} PCLSI`].survived, { dn, up } = flips[i]; let acc = 0;
      return Array.from({ length: S.length }, (_, j) => {
        let H = S[j];
        if (S[j] !== P[j]) { acc += s; if (acc >= 1 - 1e-9) { acc -= 1; H = P[j]; } }
        else if (dn.has(j)) H = 0; else if (up.has(j)) H = 1;
        return P[j] - 2 * H + S[j];
      });
    });
    const h = holm(ys.flatMap(y => [flipP(y, B, 7002), flipP(y.map(x => -x), B, 7003)]));
    const reads = PANEL.map((id, i) => (h[2 * i] < ALPHA ? 'READ' : h[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT'));
    console.log(`  f ${String(f).padStart(3)} s ${s.toFixed(2)}: ${PANEL.map((id, i) => `${id} ${reads[i]}`).join(', ')} -> ${reads[0] === 'READ' ? 'HELD' : reads[0] === 'TABLES' ? 'FALSIFIED' : 'INCONCLUSIVE'}`);
  }
}

console.log('\n2. THE COST (ADOPT-PI\'s solve and forward seconds a unit at 6,000 paths)');
const secs = {};
for (const t of Object.values(logs)) {
  let id = null, arm = null;
  for (const l of t.split('\n')) {
    const c = /^(\S.*?)\s+case \| unit OFF\/PRODUCT\/W0\.02\/(SNAP|PCLSI) /.exec(l); if (c) { id = c[1].trim(); arm = c[2]; (secs[id] ||= {})[arm] = { solve: 0, fwd: 0 }; continue; }
    if (/ case \| unit /.test(l)) { id = null; continue; }
    const s = /^\s+solve \S+: secs (\d+)/.exec(l); if (s && id) secs[id][arm].solve = Number(s[1]);
    const w = /^\s+sum \S+: .* secs (\d+)$/.exec(l); if (w && id) secs[id][arm].fwd = Number(w[1]);
  }
}
let tot = 0, longest = 0;
for (const id of PANEL) {
  const s = secs[id]; if (!s) { console.error(`derive-hyb: no ADOPT-PI seconds for ${id}`); process.exit(1); }
  const t = s.SNAP.solve + s.PCLSI.solve + s.SNAP.fwd + 2 * s.PCLSI.fwd; tot += t; longest = Math.max(longest, t);
  console.log(`  ${id.padEnd(8)} solves ${s.SNAP.solve} + ${s.PCLSI.solve} s; forward SNAP ${s.SNAP.fwd} s, 2 on PCLSI's tables at ${s.PCLSI.fwd} s: ${(t / 3600).toFixed(2)} core-hours`);
}
console.log(`  total ${(tot / 3600).toFixed(1)} core-hours; one process a household on three cores: ${(longest / 3600).toFixed(2)} hours (ADOPT-PI's seconds, measured under its own load)`);
