/*
 * STEP 8, THE SIZING FROM ITS PILOT (STEP8.md; registrations/household-hsp.md, Paths and Budget; D34 (2) and (4), as D61 and
 * D96 (2) applied them): the pilot's units (audit-household-hsp.mjs pilot: three couples of the panel, all five of their units,
 * seed 7002, 1,000 paths; EXPLORATORY) give each unit's discordance between HSP and K2 and its Clopper-Pearson upper 95%
 * bound; D34's size for each (size-phase4.mjs sizeFor: the smallest N from 16,000 at which a true 1-point loss is read as harm
 * at least 90% of the time with a quarter-point loss at most 5%). The run takes one N for every unit: the largest of those, at
 * most D61's 19,000; a comparison past it is read at 19,000 and named at the read with its rate (D34 (4)).
 * The budget (D21: measured from the pilot's units on this machine): each panel unit scaled from the pilot unit of the same
 * variant (a feature unit from the pilot's unit of that feature) on the pilot couple nearest in horizon, by the two horizons:
 * the two solves, each arm's CPU a path times N and its 200 paths held to E.runTrial, and the rollout beside K2; four cores,
 * longest first; and the longest unit once more, for a relaunch after an out-of-memory kill (the remedy's unit 1).
 * Before anything is written (the design review's requirements, reviews/2026-11-19-household-hsp-design.md): the pilot on
 * the panel's code, its read's gate passed (reduce-household-hsp.mjs --pilot's own gate), and what the pilot shows printed by
 * unit and by shape, each unit's change and D34's chance of flagging it at the registered N were its change the truth.
 *   node research/solver/size-household-hsp.mjs [pilot dir] > research/solver/results-household-hsp-sizing.txt   (writes household-hsp-paths.json)
 *   node research/solver/size-household-hsp.mjs --planted
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { sizeFor } from './size-phase4.mjs';
import { tpLimit } from './size-couples.mjs';
import { clopperPearson } from './stats.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { loadDir, gate } from './reduce-household-hsp.mjs';
import { ARMS, PILOT_N, PILOT_SEED, PATHS_FILE, CHECK, pilotUnits, stampFilesHash } from './audit-household-hsp.mjs';
import { readHspPanel, PANEL } from './household-hsp-panel.mjs';
import { harmRate, thresholdFor } from './size-phase4.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const RUN_MAX = 19000, CORES = 4;
/* a pilot comparison: discordant count, its upper bound and D34's size */
export function sizeOf(c, o) {
  let k = 0; const n = Math.min(c.length, o.length); for (let i = 0; i < n; i++) if (c[i] !== o[i]) k++;
  const dUp = clopperPearson(k, n)[1]; let N = null; try { N = sizeFor([dUp]).N; } catch { N = Infinity; }
  return { k, n, dHat: k / n, dUp, N };
}
export const runN = sizes => Math.min(RUN_MAX, Math.max(...sizes.map(s => s.N)));
/* a unit's core-seconds at N, from a pilot unit's record: the two solves, each arm's CPU a path at N and on its CHECK paths
   held to E.runTrial, the rollout beside K2 */
export function unitSecs(p, N, scale, check = CHECK) {
  const solve = ARMS.reduce((t, a) => t + (p.arms[a].solveSecs || 0), 0), paths = ARMS.reduce((t, a) => t + (p.arms[a].cpuUs / 1e6 / p.N) * (N + Math.min(check, N)), 0);
  return scale * (solve + paths + (p.beside ? p.beside.secs : 0));
}
/* D34's chance of flagging a unit at N were its pilot change (HSP less K2, points) its true change: the threshold at the
   pilot's discordance (its upper bound) and N, the rate at a true loss of the pilot's loss (none where the pilot gains) */
export function flagChance(s, change, N) { const t = thresholdFor(s.dUp, N); return { t, chance: harmRate(s.dUp, N, t, Math.max(0, -change)) }; }
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
  { const p = { N: 1000, arms: { APP: { solveSecs: 0, cpuUs: 5e6 }, K2: { solveSecs: 100, cpuUs: 200e6 }, HSP: { solveSecs: 60, cpuUs: 50e6 } }, beside: { secs: 40 } };
    cases.push(['a unit\'s seconds: the two solves, each arm\'s CPU a path at 16,000 and on its 200 checked paths, and the rollout beside', `${unitSecs(p, 16000, 1)}`, `${160 + 16.2 * 255 + 40}`]); }
  { const s = sizeOf(arr(1000, 30), arr(1000, 0)), a = flagChance(s, -1, 16000), b = flagChance(s, +0.5, 16000);
    cases.push(['D34\'s chance at 16,000 paths: a true loss of a point at 3% discordance flagged at least 90% of the time; a gain at most 5%', `${a.chance >= 0.9} ${b.chance <= 0.05}`, 'true true']); }
  cases.push(['four cores, longest first: 10, 9, 8 and 7 hours, then 6 onto the 7: the last ends at 13', `${makespan([10, 9, 8, 7, 6])}`, '13']);
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const DIR = process.argv[2] || join(HERE, 'results', 'household-hsp-pilot');
  const panel = readHspPanel(), pu = pilotUnits(panel), U = Object.fromEntries(loadDir(DIR).map(u => [u.id, u]));
  const missing = pu.filter(u => !U[u.id]).map(u => u.id);
  if (missing.length) { console.log(`size-household-hsp: the pilot is missing ${missing.join(', ')}`); process.exit(1); }
  const recs = pu.map(u => U[u.id]), codes = [...new Set(recs.map(r => r.stamp.code))], seeds = [...new Set(recs.map(r => r.seed))], panelCode = JSON.parse(readFileSync(PANEL, 'utf8')).code;
  if (codes.length !== 1 || seeds.length !== 1 || seeds[0] !== PILOT_SEED) { console.log(`size-household-hsp: the pilot is on codes ${codes.join(', ')} and seeds ${seeds.join(', ')}`); process.exit(1); }
  if (codes[0] !== panelCode) { console.log(`size-household-hsp: the pilot ran on code ${codes[0]}, not the panel's ${panelCode}`); process.exit(1); }
  // the pilot's own gate, as reduce-household-hsp.mjs --pilot runs it, before anything is written
  { const logs = readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)), P = gate(Object.values(U), pu, { seed: PILOT_SEED, audit: stampFilesHash(), code: panelCode, logs: Object.fromEntries(logs.map(x => [x, readFileSync(join(DIR, x), 'utf8')])) });
    if (P.length) { console.log(`size-household-hsp: the pilot's gate refuses it:\n  ${P.join('\n  ')}`); process.exit(1); } }
  const yearsOf = u => E.buildContext(E.resolveMpaa(u.plan)).totalYears + 1, sv = a => 100 * a.survived.reduce((t, x) => t + x, 0) / a.survived.length;
  console.log(`STEP 8, THE SIZING from its pilot (${DIR.replace(/.*research\/solver\//, '')}; ${pu.length} units of ${new Set(pu.map(u => u.couple)).size} couples, seed ${PILOT_SEED}, ${PILOT_N} paths a unit, code ${codes[0]}; EXPLORATORY)`);
  const sizes = {};
  for (const u of pu) {
    const r = U[u.id], s = sizeOf(r.arms.HSP.survived, r.arms.K2.survived); sizes[u.id] = s;
    console.log(`  ${u.id.padEnd(13)} HSP against K2: ${(sv(r.arms.HSP) - sv(r.arms.K2) >= 0 ? '+' : '') + (sv(r.arms.HSP) - sv(r.arms.K2)).toFixed(2)} points (APP ${sv(r.arms.APP).toFixed(1)}%); discordant ${s.k} of ${s.n} (${(100 * s.dHat).toFixed(2)}%, its upper bound ${(100 * s.dUp).toFixed(2)}%): D34's size ${Number.isFinite(s.N) ? s.N : 'past every size tried'}`);
  }
  const N = runN(Object.values(sizes)), lim = tpLimit(N), past = Object.entries(sizes).filter(([, s]) => s.N > N);
  console.log(`what the pilot shows, at the registered ${N} paths (each unit's pilot change were it the truth; EXPLORATORY, deciding nothing):`);
  const byShape = {};
  for (const u of pu) { const r = U[u.id], ch = sv(r.arms.HSP) - sv(r.arms.K2), fc = flagChance(sizes[u.id], ch, N); (byShape[u.variant] = byShape[u.variant] || []).push(ch); console.log(`  ${u.id.padEnd(13)} ${(ch >= 0 ? '+' : '') + ch.toFixed(2)} points; D34's threshold at ${N} ${fc.t.toFixed(3)}; the chance it is flagged ${fc.chance.toFixed(3)}`); }
  console.log(`  by shape, the mean change over the pilot's couples: ${Object.entries(byShape).map(([v, xs]) => `${v} ${(xs.reduce((t, x) => t + x, 0) / xs.length >= 0 ? '+' : '') + (xs.reduce((t, x) => t + x, 0) / xs.length).toFixed(2)}`).join(', ')}; the panel's 45 and gap8 units are shapes HSP has not run before (the pilot holds ${pu.filter(u => u.variant === '45' || u.variant === 'gap8').length} of the panel's ${panel.filter(u => u.variant === '45' || u.variant === 'gap8').length})`);
  console.log(`the run: every unit at ${N} paths (the largest of the pilot's sizes, at most D61's ${RUN_MAX}); at ${N} a true 1-point loss reads as harm at least 90% of the time up to a discordance (its upper bound) of ${(100 * lim).toFixed(2)}%${past.length ? `; past it: ${past.map(([id]) => id).join(', ')}, read at ${N} and named with their rate (D34 (4))` : ''}`);
  const pilotCouples = [...new Set(pu.map(u => u.couple))].map(c => ({ couple: c, years: yearsOf(pu.find(u => u.couple === c)) }));
  const unitRows = panel.map(u => {
    const y = yearsOf(u), near = pilotCouples.reduce((b, p) => (Math.abs(p.years - y) < Math.abs(b.years - y) ? p : b));
    const from = pu.find(x => x.couple === near.couple && x.variant === u.variant) || pu.find(x => x.variant === u.variant);
    return { id: u.id, years: y, from: from.id, secs: unitSecs(U[from.id], N, y / yearsOf(from)) };
  });
  const all0 = unitRows.map(r => r.secs), longest = Math.max(...all0), all = [...all0, longest], total = all.reduce((s, x) => s + x, 0), span = makespan(all);
  console.log(`the budget (D21: measured from the pilot's units on this machine), over ${panel.length} units and the longest once more for a relaunch: ${(total / 3600).toFixed(1)} core-hours; on ${CORES} cores longest first ${(span / 3600).toFixed(1)} hours; the longest unit ${(longest / 3600).toFixed(2)} hours`);
  for (const u of pu) { const r = U[u.id]; console.log(`  pilot ${u.id.padEnd(13)} the solves K2 ${Math.round(r.arms.K2.solveSecs)} s and HSP ${Math.round(r.arms.HSP.solveSecs)} s; a path APP ${(r.arms.APP.cpuUs / 1e3 / r.N).toFixed(1)} ms, K2 ${(r.arms.K2.cpuUs / 1e3 / r.N).toFixed(1)} ms, HSP ${(r.arms.HSP.cpuUs / 1e3 / r.N).toFixed(1)} ms; beside ${Math.round(r.beside.secs)} s; the load at its chunks ${r.arms.K2.chunks.map(c => c.load[0].toFixed(1)).join(', ')}`); }
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), pilot: { seed: PILOT_SEED, n: PILOT_N, code: codes[0], units: pu.map(u => u.id), sizes }, N, coreHours: +(total / 3600).toFixed(1), hours: +(span / 3600).toFixed(1), paths: Object.fromEntries(panel.map(u => [u.id, N])) }, null, 1) + '\n');
  console.log(`written: household-hsp-paths.json (${panel.length} units at ${N})`);
}
