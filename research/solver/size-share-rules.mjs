/*
 * THE SHARE RULES' TEST, THE SIZING FROM ITS PILOT (registrations/share-rules.md, Paths and Budget; D34 (2) and (4), as D61
 * applied them): the pilot's units (audit-share-rules.mjs pilot: three couples of the panel, all four of their units, seed
 * 7002, 1,000 paths) give each comparison's discordance (FLAT against TODAY and MEANS against TODAY, on the units where the
 * shares differ) and its Clopper-Pearson upper 95% bound; D34's size for each (size-phase4.mjs sizeFor: the smallest N from
 * 16,000 at which a true 1-point loss is read as harm at least 90% of the time with a quarter-point loss at most 5%). The run
 * takes one N for every unit: the largest of those, at most D61's 19,000; a comparison past it is read at 19,000 and named at
 * the read with its rate (D34 (4)).
 * The budget (D21: measured from the pilot's units on this machine): each panel unit's arms scaled from the pilot unit of the
 * same holding (or the feature unit) on the pilot couple nearest in horizon, by the two horizons; four cores, longest first.
 *   node research/solver/size-share-rules.mjs [pilot dir] > research/solver/results-share-rules-sizing.txt   (writes share-rules-paths.json)
 *   node research/solver/size-share-rules.mjs --planted
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { sizeFor } from './size-phase4.mjs';
import { tpLimit } from './size-couples.mjs';
import { clopperPearson } from './stats.mjs';
import { loadDir, armsOf } from './reduce-share-rules.mjs';
import { PILOT_N, BESIDE, PATHS_FILE, pilotUnits } from './audit-share-rules.mjs';
import { readSharePanel } from './share-rules-panel.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const RUN_MAX = 19000, CORES = 4;
/* a pilot comparison: discordant count, its upper bound and D34's size */
export function sizeOf(c, o) {
  let k = 0; const n = Math.min(c.length, o.length); for (let i = 0; i < n; i++) if (c[i] !== o[i]) k++;
  const dUp = clopperPearson(k, n)[1]; let N = null; try { N = sizeFor([dUp]).N; } catch { N = Infinity; }
  return { k, n, dHat: k / n, dUp, N };
}
/* the run's N: the largest pilot size, at most RUN_MAX */
export const runN = sizes => Math.min(RUN_MAX, Math.max(...sizes.map(s => s.N)));
/* a unit's core-seconds at N for each arm it runs, from a pilot unit's record of the same arm (the solve, ms a path, beside) */
export function unitSecs(pilot, arms, N, scale) {
  const out = {};
  for (const arm of arms) {
    const r = pilot[arm] || pilot.TODAY, perPath = r.engineSecs / r.N;
    out[arm] = scale * (r.solveSecs + perPath * N + (r.beside ? r.beside.secs * Math.min(N, BESIDE) / r.beside.N : 0));
  }
  return out;
}
/* longest first onto `cores` cores: the time until the last ends */
export function makespan(secs, cores = CORES) {
  const load = new Array(cores).fill(0);
  for (const s of [...secs].sort((a, b) => b - a)) { const i = load.indexOf(Math.min(...load)); load[i] += s; }
  return Math.max(...load);
}

function planted() {
  const cases = [];
  const arr = (n, flips) => { const a = new Uint8Array(n).fill(1); for (let i = 0; i < flips; i++) a[i] = 0; return a; };
  { const s = sizeOf(arr(1000, 40), arr(1000, 0)); cases.push(['4% discordant on 1,000 paths: its upper bound above 4%, D34\'s size 16,000 (the floor)', `${s.k} ${s.dUp > 0.04} ${s.N}`, '40 true 16000']); }
  { const s = sizeOf(arr(1000, 140), arr(1000, 0)); cases.push(['14% discordant: a size past 19,000', `${s.N > 19000}`, 'true']); }
  cases.push(['the run\'s N: the largest size, at most 19,000', `${runN([{ N: 16000 }, { N: 17000 }])} ${runN([{ N: 16000 }, { N: 25000 }])}`, '17000 19000']);
  { const p = { TODAY: { solveSecs: 100, engineSecs: 200, N: 1000, beside: { N: 500, secs: 50 } }, MEANS: { solveSecs: 100, engineSecs: 100, N: 1000, beside: { N: 500, secs: 50 } } };
    const u = unitSecs(p, ['TODAY', 'MEANS', 'FLAT'], 19000, 1); cases.push(['a unit\'s seconds: each arm a solve, 19,000 paths at its pilot\'s ms and the rollout beside; FLAT, with no pilot record, at TODAY\'s', `${u.TODAY} ${u.MEANS} ${u.FLAT}`, '3950 2050 3950']); }
  cases.push(['four cores, longest first: 10, 9, 8 and 7 hours, then 6 onto the 7: the last ends at 13', `${makespan([10, 9, 8, 7, 6])}`, '13']);
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const DIR = process.argv[2] || join(HERE, 'results', 'share-rules-pilot');
  const panel = readSharePanel(), U = loadDir(DIR), pu = pilotUnits(panel);
  const missing = pu.filter(u => armsOf(u).some(a => !(U[u.id] && U[u.id][a]))).map(u => u.id);
  if (missing.length) { console.log(`size-share-rules: the pilot is missing ${missing.join(', ')}`); process.exit(1); }
  const recs = pu.flatMap(u => armsOf(u).map(a => U[u.id][a])), codes = [...new Set(recs.map(r => r.stamp.code))], seeds = [...new Set(recs.map(r => r.seed))];
  if (codes.length !== 1 || seeds.length !== 1 || seeds[0] !== 7002) { console.log(`size-share-rules: the pilot is on codes ${codes.join(', ')} and seeds ${seeds.join(', ')}`); process.exit(1); }
  const yearsOf = u => E.buildContext(E.resolveMpaa(u.plan)).totalYears + 1, sv = a => 100 * a.survived.reduce((t, x) => t + x, 0) / a.survived.length;
  console.log(`THE SHARE RULES' SIZING from its pilot (${DIR.replace(/.*research\/solver\//, '')}; ${pu.length} units of ${new Set(pu.map(u => u.base)).size} couples, seed 7002, ${PILOT_N} paths a unit, code ${codes[0]}; EXPLORATORY, no outcome)`);
  const sizes = {};
  for (const u of pu) for (const X of ['FLAT', 'MEANS']) {
    const x = U[u.id][X]; if (!x || Math.abs(x.share - U[u.id].TODAY.share) <= 1e-12) continue;
    const s = sizeOf(x.main.survived, U[u.id].TODAY.main.survived); sizes[`${u.id}|${X}`] = s;
    console.log(`  ${u.id.padEnd(12)} ${X.padEnd(5)} against TODAY (share ${U[u.id].TODAY.share.toFixed(3)} to ${x.share.toFixed(3)}): ${(sv(x.main) - sv(U[u.id].TODAY.main) >= 0 ? '+' : '') + (sv(x.main) - sv(U[u.id].TODAY.main)).toFixed(2)} points on ${s.n}; discordant ${s.k} (${(100 * s.dHat).toFixed(2)}%, upper 95% ${(100 * s.dUp).toFixed(2)}%): D34's size ${Number.isFinite(s.N) ? s.N : 'past the search'}`);
  }
  const N = runN(Object.values(sizes)), lim = tpLimit(N), past = Object.entries(sizes).filter(([, s]) => s.N > N);
  console.log(`the run: every unit at ${N} paths (the largest of the pilot's sizes, at most D61's ${RUN_MAX}); at ${N} a true 1-point loss reads as harm at least 90% of the time up to a discordance (its upper bound) of ${(100 * lim).toFixed(2)}%${past.length ? `; past it in the pilot: ${past.map(([k]) => k).join(', ')} (read at ${N}, named at the read with its rate: D34 (4))` : ''}`);
  // the budget
  const pilotCouples = [...new Set(pu.map(u => u.base))].map(b => ({ base: b, years: yearsOf(pu.find(u => u.base === b)) }));
  const unitRows = panel.map(u => {
    const y = yearsOf(u), near = pilotCouples.reduce((b, p) => (Math.abs(p.years - y) < Math.abs(b.years - y) ? p : b));
    const from = pu.find(x => x.base === near.base && (u.kind === 'reheld' ? x.variant === u.variant : x.kind === 'feature'));
    return { id: u.id, years: y, from: from.id, secs: unitSecs(U[from.id], armsOf(u), N, y / near.years) };
  });
  const all = unitRows.flatMap(r => Object.values(r.secs)), total = all.reduce((s, x) => s + x, 0), span = makespan(all), longest = Math.max(...all);
  console.log(`the budget (D21: measured from the pilot's units on this machine), over ${panel.length} units and ${all.length} runs: ${(total / 3600).toFixed(1)} core-hours; on ${CORES} cores longest first ${(span / 3600).toFixed(1)} hours; the longest run ${(longest / 3600).toFixed(2)} hours`);
  for (const p of pilotCouples) {
    const r = U[pu.find(u => u.base === p.base).id];
    console.log(`  pilot ${p.base} (${p.years} years): TODAY the solve ${Math.round(r.TODAY.solveSecs)} s, the engine ${(1000 * r.TODAY.engineSecs / r.TODAY.N).toFixed(1)} ms a path, beside ${Math.round(r.TODAY.beside.secs)} s`);
  }
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), pilot: { seed: 7002, n: PILOT_N, code: codes[0], units: pu.map(u => u.id), sizes }, N, coreHours: +(total / 3600).toFixed(1), hours: +(span / 3600).toFixed(1), paths: Object.fromEntries(panel.map(u => [u.id, N])) }, null, 1) + '\n');
  console.log(`written: share-rules-paths.json (${panel.length} units at ${N})`);
}
