/*
 * THE SIZING PASS BEFORE PHASE 4 (the maintainer, 6 Oct: 'go ahead with the sizing pass once DT-O97 reads'): every step
 * Phase 4 still waits for, its compute from MEASURED unit times, and Phase 4's own.
 *
 *   node research/solver/derive-sizing.mjs > research/solver/results-sizing.txt
 *
 * The unit times: SIZE's probe (results/size, size-probe.mjs: the whole research candidate and today's product solve,
 * 30 points, 3,000 paths, four at once - the load a batch runs at), with the older partial-candidate records beside it
 * as a cross-check (7af, 7ag: READER/TS+J and OFF/PRODUCT, 30 points, 8,000 and 16,000 paths). The unit COUNTS are each
 * step's registered design where it has one and an assumption where it does not; every assumed count is marked
 * 'assumed' and is grade D. Builds and the per-test work around a run (prediction, preflight, reviews, the read) take
 * no cores and are not timed here; the per-test overhead line reads it from one test's own records.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), RES = join(HERE, 'results');
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-');

// one directory's case logs: per unit label, the solve seconds, and the forward seconds per 1,000 paths
export function readCases(dir) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f))) {
    let hh = null, paths = null;
    for (const L of readFileSync(join(dir, f), 'utf8').split('\n')) {
      let m = /^(\S.*?)\s+case \| unit (\S+)/.exec(L); if (m) { hh = m[1].trim(); continue; }
      m = /^\s+ran (\S+?): .*?paths (\d+)/.exec(L); if (m) { paths = +m[2]; continue; }
      m = /^\s+solve (\S+?): .*secs (\d+)/.exec(L); if (m) { (out[m[1]] ||= { solve: [], fwdK: [], hh: [] }).solve.push(+m[2]); out[m[1]].hh.push(hh); continue; }
      m = /^\s+(?:run|sum) (\S+?): .*secs (\d+)/.exec(L); if (m && paths) (out[m[1]] ||= { solve: [], fwdK: [], hh: [] }).fwdK.push(+m[2] / paths * 1000);
    }
  }
  return out;
}

const probe = readCases(join(RES, 'size'));
if (!probe.CAND || !probe.PRODUCT || probe.CAND.solve.length < 4 || probe.PRODUCT.solve.length < 4) {
  console.error('derive-sizing: SIZE\'s probe has not landed four candidate and four product units (results/size): a sizing over nothing is an error');
  process.exit(2);
}
const U = {
  cand: med(probe.CAND.solve), candMax: Math.max(...probe.CAND.solve), candFwdK: med(probe.CAND.fwdK),
  prod: med(probe.PRODUCT.solve), prodMax: Math.max(...probe.PRODUCT.solve), prodFwdK: med(probe.PRODUCT.fwdK),
};
console.log('SIZING BEFORE PHASE 4 (derive-sizing.mjs)');
console.log('\n1. UNIT TIMES, measured (seconds; four at once, the load a batch runs at)');
console.log('  SIZE probe (results/size; 30 points, 3,000 paths, seed 7002):');
for (const k of ['CAND', 'PRODUCT']) probe[k].solve.forEach((s, i) => console.log(`    ${k.padEnd(8)} ${String(probe[k].hh[i]).padEnd(12)} solve ${s} s, forward ${f1(probe[k].fwdK[i])} s per 1,000 paths`));
console.log(`  medians: the candidate's solve ${U.cand} s (largest ${U.candMax}), forward ${f1(U.candFwdK)} s per 1,000 paths; the product's solve ${U.prod} s (largest ${U.prodMax}), forward ${f1(U.prodFwdK)} s per 1,000 paths`);
console.log(`  the candidate's solve against the product's, same households and load: x${(U.cand / U.prod).toFixed(2)} (median of the ratios ${med(probe.CAND.hh.map((h, i) => probe.CAND.solve[i] / probe.PRODUCT.solve[probe.PRODUCT.hh.indexOf(h)])).toFixed(2)})`);
const xc = [['diag7af', 'READER/TS+J/W0.02', 'OFF/PRODUCT/W0.02'], ['diag7ag', 'READER/TS+J/W0.02', 'OFF/PRODUCT/W0.02']];
console.log('  cross-check, the partial candidate (no Q step, no charge, no e3, no PCLSI) against the product, older batches:');
for (const [d, a, b] of xc) { const r = readCases(join(RES, d)); if (r[a] && r[b]) console.log(`    ${d}: ${a} solve median ${med(r[a].solve)} s, ${b} ${med(r[b].solve)} s (x${(med(r[a].solve) / med(r[b].solve)).toFixed(2)}); forward ${f1(med(r[a].fwdK))} and ${f1(med(r[b].fwdK))} s per 1,000 paths`); }

// arm A (the app's own search then tournament, select-phase4.mjs): 158 households in the span of results/p4-select's files
const sel = readdirSync(join(RES, 'p4-select')).map(f => JSON.parse(readFileSync(join(RES, 'p4-select', f), 'utf8')));
const inBand = sel.filter(s => s.inBand).length;
console.log(`\n  arm A's selection (results/p4-select, 24 Sep): ${sel.length} households, ${inBand} in the 75-95% band (FIRE ${sel.filter(s => s.cohort === 'fire' && s.inBand).length} of ${sel.filter(s => s.cohort === 'fire').length}); 1,000 paths each; arm A costs seconds a household against the solver's minutes`);

// 2. THE STEPS. cand/prod: solves; candP/prodP: forward paths in thousands (each arm's run); extra: core-seconds measured
// elsewhere (named); design: 'registered' (its prediction or row fixes the count) or 'assumed' (grade D)
const S = [
  { id: 'E2-EXACT', what: 'E2 shown exact: every table the same split and unsplit (as E3c), 4 households', cand: 8, candP: 0, design: 'assumed (E3c\'s shape)', gate: 'gate 5; before 7u (the 12:51 row)' },
  { id: 'GATE5', what: 'gate 5 timed: the candidate on 4 cores (E2) against the product on 1, same households and load, 4 households', cand: 4, prod: 4, design: 'assumed', gate: 'before 7u' },
  { id: 'O118-DERIVE', what: 'derive-o118.mjs over DT-O97\'s and ADOPT-PI\'s gated files (no runs)', design: 'registered (the O118 row)', gate: 'before a death-tax arm is quoted' },
  { id: 'P4-LAND', what: 'Phase 4\'s panel landed at ~85% (the maintainer, 24 Sep, step 6: not built - select-phase4.mjs has no landing): arm A bisected on spending, about 10 steps on up to 158 candidates', extra: 158 * 10 * 4 * 223 / 158, design: 'assumed (10 steps; each step one arm A run of the selection\'s cost)', gate: 'before Phase 4' },
  { id: '7aj', what: 'CAND and SHIP at the estate weight 0.01 on 7e\'s 25, 8,000 paths (as 7af)', cand: 25, prod: 25, candP: 25 * 8, prodP: 25 * 8, design: 'registered count (the 7aj row: about 50 solves and runs); 8,000 paths assumed (as 7af)', gate: 'before 7u registers' },
  { id: 'NSB', what: 'the dead node\'s non-survival values, read-only', extra: 5 * 3600, design: 'the deep review\'s estimate, NOT CHECKED', gate: 'before 7an (STOP)' },
  { id: 'TABLE-FIX', what: 'the table\'s fix in the year before each step (XAS\'s Decision fed; family 3), designed and tested', design: 'NOT DESIGNED: unsized', gate: 'before 7an registers', unsized: true },
  { id: '7an', what: 'the share axes at 6 and 11 points on bridge 4, S126, S370 and S130 (results-derive-7an-cost.txt: S370 2195 + 7457 s, S130 1584 + 6385 s; the other two at their mean)', extra: 2 * (2195 + 7457 + 1584 + 6385), design: 'registered (the 7an row)', gate: 'before 7u (the maintainer, 30 Sep 20:54 UK)' },
  { id: 'O67-STEP', what: 'O67\'s own step: the reader at 5 against 9 share points on the S126 members, S194 under PCLSI and at 9 or 13 points', cand: 8 * 2, design: 'assumed (8 solves at about twice the candidate\'s 30x6 cost)', gate: 'before 7u registers' },
  { id: '7u', what: 'the confirmation: SHIP and CAND on 7e\'s 25 plus a broad panel of 30, at the estate weights 0.02 and 0.01, 8,000 paths (seed 7013)', cand: 110, prod: 110, candP: 110 * 8, prodP: 110 * 8, design: 'assumed (broad panel 30; 7af\'s path count, the harm-side calibration\'s)', gate: 'before 7q, 8d, 8f, Phase 4' },
  { id: '7o', what: 'the replication on seed 7004 (the reader is carried forward): SHIP and CAND on 7e\'s 25 at 0.02, 3,000 paths', cand: 25, prod: 25, candP: 25 * 3, prodP: 25 * 3, design: 'paths registered (the 7o row: 3,000 paths of seed 7004); arms and panel assumed', gate: 'grade B -> A for the reader default, or the maintainer accepts grade B' },
  { id: 'O21', what: 'five worlds against three under the candidate on S330 and five more', cand: 6 + 6 * 5 / 3, candP: 12 * 3, design: 'assumed (five worlds at 5/3 the solve)', gate: 'before 8f' },
  { id: '7q', what: 'the candidate against the candidate with a fixed bridge policy, on the bridge households and S124, S128, S130 (11), 8,000 paths', cand: 22, candP: 22 * 8, design: 'assumed', gate: 'before 8d, Phase 4' },
  { id: '7p', what: 'the year-0 rollout: one year forward from Phase 4\'s solves', design: 'assumed: no solves of its own', gate: 'before Phase 4' },
  { id: '8', what: 'K6: the dislike-of-cuts c from 0.0001 to 0.01 (7 values) on 6 households, own tier and Medium, 3,000 paths', cand: 84, candP: 84 * 3, design: 'assumed', gate: 'before 8f, 8h' },
  { id: '8d', what: 'the pitfall sweep re-tested on the candidate: 12 households, two arms, 3,000 paths', cand: 24, candP: 24 * 3, design: 'assumed (its ~4-6 h was the old product\'s)', gate: 'before 8f' },
  { id: '8e', what: 'the retro audit: records re-read (no cores, about 1 h); its re-runs not listed', design: 'the re-run list not drawn: unsized', gate: 'before Phase 4', unsized: true },
  { id: '8f', what: 'the combined no-harm run: every new default against the previous baseline on a broad panel of 30, 3,000 paths', cand: 30, prod: 30, candP: 30 * 3, prodP: 30 * 3, design: 'assumed (panel 30)', gate: 'before 8h, Phase 4' },
  { id: '8g', what: 'the perturbed engines: the 12 step-2 households under 2c.1\'s three engines, forward only (the three new engines are builds)', candP: 12 * 3 * 3, prodP: 12 * 3 * 3, cand: 12, prod: 12, design: 'assumed', gate: 'Phase 4 condition 4' },
  { id: '8h', what: 'the optimality ceiling on Phase 4\'s configuration', design: 'NOT DESIGNED: unsized', gate: 'the last step before Phase 4', unsized: true },
  { id: 'PHASE 4', what: 'Panel H (40) and Panel T (41): arm S a candidate solve and 3,000 paths, arm A seconds; condition 4 forward under 7 engines (history, 3 perturbed, 3 new) for both arms; the two diagnostics - arm S without tier changes (81 solves and runs) and the equal-survival check (12 households landed with BISECT=8: 96 solves and runs); 8i\'s risk-based arm (forward only)', cand: 81 + 81 + 96, candP: 81 * 3 * 7 + 81 * 3 + 96 * 3, prodP: 81 * 3 * 7 + 81 * 3, design: 'registered panels, paths and diagnostics (the Phase 4 section); assumed: arm A\'s forward at the product\'s per-path cost, the no-tier solve at the candidate\'s', gate: '-' },
];

console.log('\n2. THE STEPS: compute from the unit times (core-hours; wall-hours one batch at a time on 4 cores, never less than its longest unit)');
console.log('  step         core-h  wall-h  design / gate');
let tot = 0;
const rows = {};
for (const s of S) {
  const core = s.unsized ? NaN : ((s.cand || 0) * U.cand + (s.prod || 0) * U.prod + (s.candP || 0) * U.candFwdK + (s.prodP || 0) * U.prodFwdK + (s.extra || 0)) / 3600;
  const longest = Math.max(s.cand ? U.candMax : 0, s.prod ? U.prodMax : 0) / 3600;
  const wall = s.unsized ? NaN : Math.max(core / 4, longest);
  rows[s.id] = { core, wall };
  if (Number.isFinite(core)) tot += core;
  console.log(`  ${s.id.padEnd(12)} ${f1(core).padStart(6)}  ${f1(wall).padStart(6)}  ${s.what}; ${s.design}; gate: ${s.gate}`);
}
console.log(`  sized steps in all: ${f1(tot)} core-hours, ${f1(tot / 4)} wall-hours on 4 cores at least; unsized: ${S.filter(s => s.unsized).map(s => s.id).join(', ')}`);

// 3. the critical path: 7u's registered gates (items/7u.md) put it after 7an, which is after NSB and the table fix
const W = id => rows[id].wall;
const before7u = ['E2-EXACT', 'GATE5', '7aj', 'NSB', '7an', 'O67-STEP'], after7u = ['7o', 'O21', '7q', '8', '8d', '8f', '8g', 'P4-LAND'];
const wallSum = ids => ids.reduce((t, id) => t + (Number.isFinite(W(id)) ? W(id) : 0), 0);
console.log('\n3. THE PATH TO PHASE 4 (wall-hours of compute, one batch at a time; builds, reviews and the maintainer\'s answers not counted)');
console.log(`  before 7u registers (${before7u.join(', ')}): ${f1(wallSum(before7u))} h, plus TABLE-FIX (undesigned) - 7u is undatable while its gate holds 7an (the maintainer, 30 Sep 20:54 UK) and 7an holds the table fix`);
console.log(`  7u: ${f1(W('7u'))} h`);
console.log(`  after 7u (${after7u.join(', ')}): ${f1(wallSum(after7u))} h, plus 8e's re-runs and 8h (unsized)`);
console.log(`  Phase 4: ${f1(W('PHASE 4'))} h`);
console.log(`  in all, the sized part: ${f1(wallSum([...before7u, '7u', ...after7u, 'PHASE 4']))} wall-hours of compute`);

// 4. the work around each run, from two tests' own records (proposal to read, the ledger and runs.log)
const AROUND = 3.8;
console.log(`\n4. THE WORK AROUND A RUN (no cores), from the records: DT-O97 proposed 6 Oct 08:08 UK (the deep review after FORCE-X), launched 11:58 UK (runs.log), its batch done 13:38 UK (the ledger's 13:40 row; results/diagdto97's last file 12:38 UTC), read 13:40 UK: 5.5 h from proposal to read, its batch 1.7 h of it, so about ${AROUND} h a test beside its compute. One test, grade C`);

// 5. gate 5's arithmetic (Phase 4 condition 5: the candidate's wall-clock solve at most 1.25x today's product solve)
const need = U.cand / (1.25 * U.prod);
console.log(`\n5. GATE 5 FROM THE PROBE: the budget is 1.25 x ${U.prod} s = ${f1(1.25 * U.prod)} s; the candidate's one-core solve is ${U.cand} s, so E2 must speed it up x${need.toFixed(2)} or more on four cores (E2's own estimate is near x4, NOT CHECKED until built and timed). On a two-core device E2 gives at most x2: ${f1(U.cand / 2)} s, ${f1(U.cand / 2 / U.prod)} x the product's - over the budget (the grade-D premise in condition 5). The probe ran four at once, not on a quiet machine: gate 5's own timing is GATE5's. The forward run is not in gate 5: the candidate's is x${(U.candFwdK / U.prodFwdK).toFixed(2)} the product's per path`);

// 6. the calendar, judged (grade D): builds in hours of work, the work around a run from section 4, both overlapping the
// batches where the order allows; the compute from section 3. Two cases: 7u as gated (undatable) and 7u released from 7an
const BUILD_HOURS = { E2: 8, 'P4-LAND': 3, '7q option': 6, '8g engines': 16, '8h design and build': 12, '8i': 3 };
const tests = ['E2-EXACT', 'GATE5', '7aj', '7u', '7o', 'O21', '7q', '8', '8d', '8f', '8g', '8h', 'PHASE 4'];
const buildH = Object.values(BUILD_HOURS).reduce((t, h) => t + h, 0), aroundH = tests.length * AROUND;
const releasedWall = wallSum(['E2-EXACT', 'GATE5', '7aj', 'NSB', '7an', 'O67-STEP', '7u', ...after7u, 'PHASE 4']);
console.log(`\n6. THE CALENDAR, JUDGED (grade D; inputs: builds ${JSON.stringify(BUILD_HOURS)} hours of work, the work around a run ${AROUND} h a test from section 4, ${tests.length} tests)`);
console.log(`  as gated: undatable - 7u waits for 7an, 7an for NSB and the undesigned table fix`);
console.log(`  7u released from 7an (NSB, 7an and O67's step still run, on the same four cores, but not before it): compute ${f1(releasedWall)} wall-hours, builds ${f1(buildH)} h, the work around the runs ${f1(aroundH)} h; with builds and reviews overlapping the batches, about ${f1((releasedWall + 0.5 * (buildH + aroundH)) / 24)} to ${f1((releasedWall + buildH + aroundH) / 24)} days of continuous work before Phase 4 reads, if every step reads as expected (a result that redirects the plan stops the queue there)`);
