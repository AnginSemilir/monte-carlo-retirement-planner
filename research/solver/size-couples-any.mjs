/*
 * EVERY COUPLE ON THE SOLVER, THE REGISTERED TEST'S SIZING FROM ITS PILOT (COUPLES-ANY.md, the test; registrations/couples-any.md,
 * Paths and Budget; D34 (2) and (4), as size-couples-open.mjs applied them to the guard's own units). The pilot runs every unit
 * of the registered panel (audit-couples-any.mjs pilot: seed 7002, 1,000 paths; EXPLORATORY): W, R, L and P on four couples no
 * run has used, N left out. Each unit is sized and timed from its own record:
 * its discordance between ROUTE and APP and that discordance's Clopper-Pearson upper 95% bound; D34's size for it
 * (size-household-hsp.mjs sizeOf: the smallest N from 16,000 at which a true 1-point loss is read as harm at least 90% of the
 * time with a quarter-point loss at most 5%). The run takes one N for every unit: the largest of those, uncapped, so every unit
 * reaches D34's rates at its pilot's discordance. COUPLES-ANY.md takes its paths "by D34 from the rehearsal's discordance": the
 * rehearsal's units are other couples, so each registered unit is sized on its own pilot, and the rehearsal's largest
 * discordance is printed beside it (results-couples-any-beside.txt: `14.97%`), deciding nothing.
 * Beside the sizes, what the pilot shows (EXPLORATORY, deciding nothing): each unit's change, D34's chance of flagging it at the
 * run's N at no true change (flagChance reads a gain as no change), its spending on the paths both keep, and the units M1 names
 * by the read's own rule (reduce-couples-open.mjs m1ByUnit).
 * The budget (D21: measured from the pilot on this machine): each unit's ROUTE solve, each arm's CPU a path times N and on its
 * 200 paths held to E.runTrial; four cores in the batch's own order, the panel's; and the longest unit once more, for a
 * relaunch; and W's identity after the run (couples-any-port-identity.mjs on the run's W units, every path: ROUTE's solve and
 * CPU a path again). Before anything is written: the pilot on the panel's code, its gate passed (reduce-couples-any.mjs's gate,
 * as --pilot runs it).
 *   REG=1 node research/solver/size-couples-any.mjs [pilot dir] > research/solver/results-couples-any-sizing.txt   (writes couples-any-paths.json)
 *   node research/solver/size-couples-any.mjs --planted
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sizeOf, flagChance, inOrderSpan, CORES } from './size-household-hsp.mjs';
import { tpLimit } from './size-couples.mjs';
import { loadDir, m1ByUnit } from './reduce-couples-open.mjs';
import { gate } from './reduce-couples-any.mjs';
import { keptSpend } from './reduce-household-hsp.mjs';
import { ARMS, PILOT_N, SEED, CHECK, PATHS_FILE, stampFilesHash } from './audit-couples-any.mjs';
import { APP_POINTS } from '../../src/solverSettings.js';

const HERE = dirname(fileURLToPath(import.meta.url));
/* the run's N: the largest of the units' D34 sizes, uncapped; a unit past any size refuses the sizing */
export const runNOf = sizes => { const ns = sizes.map(s => s.N); if (ns.some(n => !Number.isFinite(n))) throw new Error('size-couples-any: a unit past any size'); return Math.max(...ns); };
/* a unit's core-seconds at N from its own pilot record: the solves, and each arm's CPU a path at N and on its CHECK paths */
export function unitSecs(p, N, check = CHECK) {
  const solve = ARMS.reduce((t, a) => t + (p.arms[a].solveSecs || 0), 0), paths = ARMS.reduce((t, a) => t + (p.arms[a].cpuUs / 1e6 / p.N) * (N + Math.min(check, N)), 0);
  return solve + paths;
}
/* W's identity on one unit after the run: ROUTE solved again and its every path run again */
export const identitySecs = (p, N) => (p.arms.ROUTE.solveSecs || 0) + (p.arms.ROUTE.cpuUs / 1e6 / p.N) * N;

function planted() {
  const cases = [];
  const p = { N: 1000, arms: { APP: { solveSecs: 0, cpuUs: 1e6 }, ROUTE: { solveSecs: 80, cpuUs: 60e6 } } };
  cases.push(['a unit\'s seconds: the solve, and each arm\'s CPU a path at 19,000 and on its 200 checked paths', `${unitSecs(p, 19000)}`, `${80 + 0.061 * 19200}`]);
  cases.push(['W\'s identity on a unit: ROUTE\'s solve and its every path again', `${identitySecs(p, 19000)}`, `${80 + 0.06 * 19000}`]);
  cases.push(['the run\'s N: the largest size, uncapped', `${runNOf([{ N: 17000 }, { N: 25000 }, { N: 21000 }])}`, '25000']);
  { let got; try { runNOf([{ N: 17000 }, { N: Infinity }]); got = 'took it'; } catch { got = 'refused'; } cases.push(['a unit past any size refuses the sizing', got, 'refused']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want || Math.abs(Number(got) - Number(want)) < 1e-9; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  if (process.env.REG !== '1') { console.error('size-couples-any: run with REG=1 (the registered panel)'); process.exit(2); }
  const { readAnyPanel, PANEL } = await import('./couples-any-panel.mjs');
  const DIR = process.argv[2] || join(HERE, 'results', 'couples-any-pilot');
  const panel = readAnyPanel(), U = Object.fromEntries(loadDir(DIR, new Set(panel.map(u => u.id))).map(u => [u.id, u]));
  const missing = panel.filter(u => !U[u.id]).map(u => u.id);
  if (missing.length) { console.log(`size-couples-any: the pilot is missing ${missing.join(', ')}`); process.exit(1); }
  const recs = panel.map(u => U[u.id]), codes = [...new Set(recs.map(r => r.stamp.code))], seeds = [...new Set(recs.map(r => r.seed))], panelCode = JSON.parse(readFileSync(PANEL, 'utf8')).code;
  if (codes.length !== 1 || seeds.length !== 1 || seeds[0] !== SEED) { console.log(`size-couples-any: the pilot is on codes ${codes.join(', ')} and seeds ${seeds.join(', ')}`); process.exit(1); }
  if (codes[0] !== panelCode) { console.log(`size-couples-any: the pilot ran on code ${codes[0]}, not the panel's ${panelCode}`); process.exit(1); }
  // the pilot's own gate, as reduce-couples-any.mjs --pilot runs it, before anything is written
  { const logs = Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')]));
    const P = gate(Object.values(U), panel.map(u => ({ id: u.id, cls: u.cls, variant: u.variant, kind: u.kind, hold: u.hold })), { seed: SEED, audit: stampFilesHash(), logs, n: PILOT_N, pts: APP_POINTS });
    if (P.length) { console.log(`size-couples-any: the pilot's gate refuses it:\n  ${P.join('\n  ')}`); process.exit(1); } }
  const sv = a => 100 * a.survived.reduce((t, x) => t + x, 0) / a.survived.length, f2 = x => (x >= 0 ? '+' : '') + x.toFixed(2);
  console.log(`EVERY COUPLE ON THE SOLVER, THE SIZING from the registered test's pilot (${DIR.replace(/.*research\/solver\//, '')}; the ${panel.length} units of ${new Set(panel.map(u => u.couple)).size} couples the registered test runs, seed ${SEED}, ${PILOT_N} paths a unit, code ${codes[0]}, audit ${recs[0].stamp.audit}; EXPLORATORY)`);
  const sizes = {};
  for (const u of panel) { const r = U[u.id], s = sizeOf(r.arms.ROUTE.survived, r.arms.APP.survived); sizes[u.id] = s; }
  const N = runNOf(Object.values(sizes)), lim = tpLimit(N), past = Object.entries(sizes).filter(([, s]) => s.N > N);
  const f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4), m1 = m1ByUnit(panel.map(u => U[u.id])).filter(x => x.named);
  console.log(`each unit's discordance and D34's size; what the pilot shows: its change, D34's chance of flagging it at the registered ${N} paths at no true change (a gain read as none), its spending on the paths both keep:`);
  const byClass = {};
  for (const u of panel) {
    const r = U[u.id], s = sizes[u.id], ch = sv(r.arms.ROUTE) - sv(r.arms.APP), fc = flagChance(s, ch, N), kp = keptSpend([r], 'APP', 'ROUTE', r.N);
    (byClass[u.cls] = byClass[u.cls] || []).push(ch);
    console.log(`  ${u.id.padEnd(16)} class ${u.cls} ROUTE against APP ${f2(ch)} points (APP ${sv(r.arms.APP).toFixed(1)}%); discordant ${s.k} of ${s.n} (upper bound ${(100 * s.dUp).toFixed(2)}%), D34's size ${Number.isFinite(s.N) ? s.N : 'past any'}; flagged at ${N} at no true change with chance ${fc.toFixed(3)}; spending on the paths both keep ${f4(kp.d)}%`);
  }
  console.log(`  by class, the mean change over its units: ${Object.entries(byClass).map(([k, xs]) => `${k} ${f2(xs.reduce((t, x) => t + x, 0) / xs.length)}`).join(', ')}`);
  console.log(`M1 by the read's own rule on the pilot (EXPLORATORY): ${m1.length ? `${m1.length} units named (${m1.map(x => `${x.id} ${f4(x.kept.d)}%`).join(', ')}), so the registered read most likely goes to the maintainer first with the units it names` : 'none named'}`);
  console.log(`the run: every unit at ${N} paths (the largest of the units' D34 sizes, uncapped); at ${N} a true 1-point loss reads as harm at least 90% of the time up to a discordance (its upper bound) of ${(100 * lim).toFixed(2)}%; ${past.length ? `past it: ${past.map(([id, s]) => `${id} (${(100 * s.dUp).toFixed(2)}%)`).join(', ')}` : 'no unit past it'}; beside, deciding nothing, the dress rehearsal's largest discordance 14.97% (results-couples-any-beside.txt)`);
  // the batch's own order for the registered run: the panel's; then W's identity on the run's W units, in four parts
  const rows = panel.map(u => ({ id: u.id, secs: unitSecs(U[u.id], N) })), all = [...rows.map(r => r.secs), Math.max(...rows.map(r => r.secs))], total = all.reduce((t, x) => t + x, 0), span = inOrderSpan(all);
  const ws = panel.filter(u => u.cls === 'W').map(u => identitySecs(U[u.id], N)), idTotal = ws.reduce((t, x) => t + x, 0), idSpan = Math.max(...[0, 1, 2, 3].map(k => ws.filter((_, i) => i % 4 === k).reduce((t, x) => t + x, 0)));
  console.log(`the budget (D21: measured from the pilot on this machine), over the ${panel.length} units and the longest once more for a relaunch: ${(total / 3600).toFixed(1)} core-hours; on ${CORES} cores in the batch's own order, the panel's, ${(span / 3600).toFixed(1)} hours; the longest unit ${(Math.max(...rows.map(r => r.secs)) / 3600).toFixed(2)} hours; then W's identity on the run's ${ws.length} W units, every path, in four parts: ${(idTotal / 3600).toFixed(1)} core-hours, ${(idSpan / 3600).toFixed(1)} hours`);
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), pilot: { seed: SEED, n: PILOT_N, code: codes[0], sizes }, N, coreHours: +(total / 3600).toFixed(1), hours: +(span / 3600).toFixed(1), identityHours: +(idSpan / 3600).toFixed(1) }, null, 1) + '\n');
  console.log(`written: couples-any-paths.json (${panel.length} units at ${N})`);
}
