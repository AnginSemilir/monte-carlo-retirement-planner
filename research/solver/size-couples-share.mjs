/*
 * ITEM 6'S STAGE C, THE SIZING FROM ITS PILOT (registrations/couples-share.md, Paths and Budget; D34 (2) and (4), as D61
 * applied them to D4): the pilot's units (audit-couples-share.mjs pilot: three couples of the panel, all three of their
 * units, seed 7002, 1,000 paths) give each comparison's discordance, CANDS against APP, and its Clopper-Pearson upper 95%
 * bound; D34's size for each (size-phase4.mjs sizeFor: the smallest N from 16,000 at which a true 1-point loss is read as
 * harm at least 90% of the time with a quarter-point loss at most 5%). The run takes one N for every unit: the largest
 * of those, at most D61's 19,000; a unit past it is read at 19,000 and named at the read with its rate (D34 (4), as D61).
 * The budget (D21: measured from the pilot's units on this machine): each panel unit's arms scaled from the pilot unit of
 * the same variant on the pilot couple nearest in horizon, by the two horizons; scheduled on four cores, longest first.
 *   node research/solver/size-couples-share.mjs [pilot dir] > research/solver/results-couples-share-sizing.txt   (writes couples-share-paths.json)
 *   node research/solver/size-couples-share.mjs --planted
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { sizeFor, thresholdFor, harmRate } from './size-phase4.mjs';
import { tpLimit } from './size-couples.mjs';
import { clopperPearson } from './stats.mjs';
import { loadDir } from './reduce-couples-share.mjs';
import { ARMS, CANDH_N, PILOT_N, BESIDE, PATHS_FILE, pathsFor, pilotIds } from './audit-couples-share.mjs';
import { readSharePanel } from './couples-share-panel.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const RUN_MAX = 19000, CORES = 4, WINDOW = 12 * 3600;
/* a pilot unit's comparison: discordant count, its upper bound and D34's size */
export function sizeOf(c, o) {
  let k = 0; const n = Math.min(c.length, o.length); for (let i = 0; i < n; i++) if (c[i] !== o[i]) k++;
  const dUp = clopperPearson(k, n)[1]; let N = null; try { N = sizeFor([dUp]).N; } catch { N = Infinity; }
  return { k, n, dHat: k / n, dUp, N };
}
/* the run's N: the largest pilot size, at most RUN_MAX */
export const runN = sizes => Math.min(RUN_MAX, Math.max(...sizes.map(s => s.N)));
/* a unit's core-seconds at N, from a pilot unit's record of each arm (seconds to solve, ms a path, the rollout beside) */
export function unitSecs(pilot, N, scale) {
  const out = {};
  for (const arm of ARMS) {
    const r = pilot[arm], perPath = r.engineSecs / r.n, n = pathsFor(arm, N);
    out[arm] = scale * (r.solveSecs + perPath * n + (r.beside ? r.beside.secs * Math.min(n, BESIDE) / r.beside.N : 0));
  }
  return out;
}
/* longest first onto `cores` cores: the hours until the last ends */
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
  { const p = { CANDS: { solveSecs: 100, engineSecs: 200, n: 1000, beside: { N: 500, secs: 50 } }, CANDH: { solveSecs: 100, engineSecs: 200, n: 1000 }, APP: { solveSecs: 0, engineSecs: 1, n: 1000 } };
    const u = unitSecs(p, 19000, 1); cases.push(['a unit\'s seconds: CANDS a solve, 19,000 paths at 0.2 s and the rollout beside; CANDH its 1,000; APP its 19,000', `${u.CANDS} ${u.CANDH} ${u.APP}`, '3950 300 19']); }
  cases.push(['four cores, longest first: 10, 9, 8 and 7 hours, then 6 onto the 7: the last ends at 13', `${makespan([10, 9, 8, 7, 6])}`, '13']);
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const DIR = process.argv[2] || join(HERE, 'results', 'share-c-pilot');
  const panel = readSharePanel(), U = loadDir(DIR), pids = pilotIds(panel);
  const missing = pids.filter(id => ARMS.some(a => !(U[id] && U[id][a])));
  if (missing.length) { console.log(`size-couples-share: the pilot is missing ${missing.join(', ')}`); process.exit(1); }
  const codes = [...new Set(pids.flatMap(id => ARMS.map(a => U[id][a].stamp.code)))], seeds = [...new Set(pids.flatMap(id => ARMS.map(a => U[id][a].seed)))];
  if (codes.length !== 1 || seeds.length !== 1 || seeds[0] !== 7002) { console.log(`size-couples-share: the pilot is on codes ${codes.join(', ')} and seeds ${seeds.join(', ')}`); process.exit(1); }
  const yearsOf = u => E.buildContext(E.resolveMpaa(u.plan)).totalYears + 1, cpu = U[pids[0]].CANDS.cpu;
  console.log(`ITEM 6 STAGE C'S SIZING from its pilot (${DIR.replace(/.*research\/solver\//, '')}; ${pids.length} units of ${new Set(pids.map(id => id.split('-')[0])).size} couples, seed 7002, ${PILOT_N} paths a unit, code ${codes[0]}; ${cpu})`);
  const sizes = {};
  for (const id of pids) {
    const s = sizeOf(U[id].CANDS.main.survived, U[id].APP.main.survived); sizes[id] = s;
    const c = 100 * U[id].CANDS.main.survived.reduce((a, x) => a + x, 0) / U[id].CANDS.n, a = 100 * U[id].APP.main.survived.reduce((x, y) => x + y, 0) / U[id].APP.n;
    console.log(`  ${id.padEnd(11)} CANDS less APP ${(c - a >= 0 ? '+' : '') + (c - a).toFixed(2)} points on ${s.n}; discordant ${s.k} (${(100 * s.dHat).toFixed(2)}%, upper 95% ${(100 * s.dUp).toFixed(2)}%): D34's size ${Number.isFinite(s.N) ? s.N : 'past 200,000'}`);
  }
  const N = runN(Object.values(sizes)), lim = tpLimit(N);
  const past = Object.entries(sizes).filter(([, s]) => s.N > N);
  console.log(`the run: every unit at ${N} paths (the largest of the pilot's sizes, at most D61's ${RUN_MAX}); at ${N} a true 1-point loss reads as harm at least 90% of the time up to a discordance (its upper bound) of ${(100 * lim).toFixed(2)}%${past.length ? `; past it in the pilot: ${past.map(([id, s]) => `${id} (upper ${(100 * s.dUp).toFixed(2)}%, its 1-point rate at ${N} ${harmRate(s.dUp, N, thresholdFor(s.dUp, N), 1).toFixed(3)})`).join(', ')}, each read at ${N} and named at the read with its rate (D34 (4), as D61)` : ''}; CANDH on each unit's first ${CANDH_N}`);
  // the budget
  const pilotCouples = [...new Set(pids.map(id => U[id].CANDS.base))].map(b => ({ base: b, years: yearsOf(panel.find(u => u.base === b)) }));
  const unitRows = panel.map(u => {
    const y = yearsOf(u), near = pilotCouples.reduce((b, p) => (Math.abs(p.years - y) < Math.abs(b.years - y) ? p : b));
    const pid = `${near.base}-${u.kind === 'reheld' ? u.variant : panel.find(x => x.base === near.base && x.kind === 'feature').variant}`;
    return { id: u.id, years: y, from: pid, secs: unitSecs(U[pid], N, y / near.years) };
  });
  const all = unitRows.flatMap(r => ARMS.map(a => r.secs[a])), total = all.reduce((s, x) => s + x, 0), span = makespan(all), longest = Math.max(...all);
  const byArm = Object.fromEntries(ARMS.map(a => [a, unitRows.reduce((s, r) => s + r.secs[a], 0)]));
  console.log(`the budget (D21: measured from the pilot's units on this machine), over ${panel.length} units: ${(total / 3600).toFixed(1)} core-hours (${ARMS.map(a => `${a} ${(byArm[a] / 3600).toFixed(1)}`).join(', ')}); on ${CORES} cores, longest first, about ${(span / 3600).toFixed(1)} hours; the longest unit ${(longest / 3600).toFixed(2)} hours, at a fifth slower ${(1.2 * longest / 3600).toFixed(2)}, inside the 12-hour limit: ${1.2 * longest < WINDOW ? 'yes' : 'NO'}`);
  for (const p of pilotCouples) {
    const r = U[pids.find(id => U[id].CANDS.base === p.base)];
    console.log(`  pilot ${p.base} (${p.years} years): CANDS the solve ${Math.round(r.CANDS.solveSecs)} s, the engine ${(1000 * r.CANDS.engineSecs / r.CANDS.n).toFixed(1)} ms a path, beside ${Math.round(r.CANDS.beside.secs)} s; CANDH the solve ${Math.round(r.CANDH.solveSecs)} s; APP the engine ${(1000 * r.APP.engineSecs / r.APP.n).toFixed(1)} ms a path`);
  }
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), pilot: { seed: 7002, n: PILOT_N, code: codes[0], units: pids, sizes }, N, candhN: CANDH_N, coreHours: +(total / 3600).toFixed(1), hours: +(span / 3600).toFixed(1), paths: Object.fromEntries(panel.map(u => [u.id, N])) }, null, 1) + '\n');
  console.log(`written: couples-share-paths.json (${panel.length} units at ${N})`);
}
