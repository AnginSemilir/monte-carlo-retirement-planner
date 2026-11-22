/*
 * THE GUARD'S OWN UNITS, THE REGISTERED TEST'S SIZING FROM ITS PILOT (COUPLES-OPEN.md step 2; registrations/couples-open.md,
 * Paths and Budget; D34 (2) and (4), as D61 and step 8 applied them). The pilot runs every unit of the registered panel
 * (audit-couples-open.mjs pilot: seed 7002, 1,000 paths; EXPLORATORY), so each unit is sized and timed from its own record:
 * its discordance between ROUTE and APP and that discordance's Clopper-Pearson upper 95% bound; D34's size for it
 * (size-household-hsp.mjs sizeOf: the smallest N from 16,000 at which a true 1-point loss is read as harm at least 90% of the
 * time with a quarter-point loss at most 5%). The run takes one N for every unit: the largest of those, at most D61's 19,000;
 * a comparison past it is read at 19,000 and named at the read with its rate (D34 (4)).
 * The budget (D21: measured from the pilot on this machine): each unit's ROUTE solve, each arm's CPU a path times N and on its
 * 200 paths held to E.runTrial; four cores in the batch's own order, the panel's; and the longest unit once more, for a
 * relaunch. Before anything is written: the pilot on the panel's code, its gate passed (reduce-couples-open.mjs's gate, as
 * --pilot runs it), and what the pilot shows printed by unit and by class, each unit's change and D34's chance of flagging it
 * at the registered N were its change the truth.
 *   REG=1 node research/solver/size-couples-open.mjs [pilot dir] > research/solver/results-couples-open-sizing.txt   (writes couples-open-paths.json)
 *   node research/solver/size-couples-open.mjs --planted
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sizeOf, runN, flagChance, inOrderSpan, RUN_MAX, CORES } from './size-household-hsp.mjs';
import { tpLimit } from './size-couples.mjs';
import { loadDir, gate } from './reduce-couples-open.mjs';
import { ARMS, PILOT_N, SEED, CHECK, PATHS_FILE, stampFilesHash, unitsOf } from './audit-couples-open.mjs';
import { APP_POINTS } from '../../src/solverSettings.js';

const HERE = dirname(fileURLToPath(import.meta.url));
/* a unit's core-seconds at N from its own pilot record: the solves, and each arm's CPU a path at N and on its CHECK paths */
export function unitSecs(p, N, check = CHECK) {
  const solve = ARMS.reduce((t, a) => t + (p.arms[a].solveSecs || 0), 0), paths = ARMS.reduce((t, a) => t + (p.arms[a].cpuUs / 1e6 / p.N) * (N + Math.min(check, N)), 0);
  return solve + paths;
}

function planted() {
  const cases = [];
  const p = { N: 1000, arms: { APP: { solveSecs: 0, cpuUs: 1e6 }, ROUTE: { solveSecs: 80, cpuUs: 60e6 } } };
  cases.push(['a unit\'s seconds: the solve, and each arm\'s CPU a path at 19,000 and on its 200 checked paths', `${unitSecs(p, 19000)}`, `${80 + 0.061 * 19200}`]);
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = Math.abs(Number(got) - Number(want)) < 1e-9; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  if (process.env.REG !== '1') { console.error('size-couples-open: run with REG=1 (the registered panel)'); process.exit(2); }
  const { readOpenPanel, PANEL } = await import('./couples-open-panel.mjs');
  const DIR = process.argv[2] || join(HERE, 'results', 'couples-open-pilot');
  const panel = readOpenPanel(), U = Object.fromEntries(loadDir(DIR).map(u => [u.id, u]));
  const missing = panel.filter(u => !U[u.id]).map(u => u.id);
  if (missing.length) { console.log(`size-couples-open: the pilot is missing ${missing.join(', ')}`); process.exit(1); }
  const recs = panel.map(u => U[u.id]), codes = [...new Set(recs.map(r => r.stamp.code))], seeds = [...new Set(recs.map(r => r.seed))], panelCode = JSON.parse(readFileSync(PANEL, 'utf8')).code;
  if (codes.length !== 1 || seeds.length !== 1 || seeds[0] !== SEED) { console.log(`size-couples-open: the pilot is on codes ${codes.join(', ')} and seeds ${seeds.join(', ')}`); process.exit(1); }
  if (codes[0] !== panelCode) { console.log(`size-couples-open: the pilot ran on code ${codes[0]}, not the panel's ${panelCode}`); process.exit(1); }
  // the pilot's own gate, as reduce-couples-open.mjs --pilot runs it, before anything is written
  { const logs = Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')]));
    const P = gate(Object.values(U), panel.map(u => ({ id: u.id, route: u.route })), { seed: SEED, audit: stampFilesHash(), logs, n: PILOT_N, pts: APP_POINTS });
    if (P.length) { console.log(`size-couples-open: the pilot's gate refuses it:\n  ${P.join('\n  ')}`); process.exit(1); } }
  const sv = a => 100 * a.survived.reduce((t, x) => t + x, 0) / a.survived.length, f2 = x => (x >= 0 ? '+' : '') + x.toFixed(2);
  console.log(`THE GUARD'S OWN UNITS, THE SIZING from the registered test's pilot (${DIR.replace(/.*research\/solver\//, '')}; ${panel.length} units of ${new Set(panel.map(u => u.couple)).size} couples, seed ${SEED}, ${PILOT_N} paths a unit, code ${codes[0]}; EXPLORATORY, deciding nothing)`);
  const sizes = {};
  for (const u of panel) { const r = U[u.id], s = sizeOf(r.arms.ROUTE.survived, r.arms.APP.survived); sizes[u.id] = s; }
  const N = runN(Object.values(sizes)), lim = tpLimit(N), past = Object.entries(sizes).filter(([, s]) => s.N > N);
  console.log(`each unit's discordance and D34's size, and what the pilot shows at the registered ${N} paths (each unit's pilot change were it the truth):`);
  const byClass = {};
  for (const u of panel) {
    const r = U[u.id], s = sizes[u.id], ch = sv(r.arms.ROUTE) - sv(r.arms.APP), fc = flagChance(s, ch, N);
    (byClass[u.cls] = byClass[u.cls] || []).push(ch);
    console.log(`  ${u.id.padEnd(12)} ${u.route.padEnd(9)} ROUTE against APP ${f2(ch)} points (APP ${sv(r.arms.APP).toFixed(1)}%); discordant ${s.k} of ${s.n} (upper bound ${(100 * s.dUp).toFixed(2)}%), D34's size ${Number.isFinite(s.N) ? s.N : 'past any'}; flagged at ${N} with chance ${fc.chance.toFixed(3)}`);
  }
  console.log(`  by class, the mean change over its units: ${Object.entries(byClass).map(([k, xs]) => `${k} ${f2(xs.reduce((t, x) => t + x, 0) / xs.length)}`).join(', ')}`);
  console.log(`the run: every unit at ${N} paths (the largest of the units' sizes, at most D61's ${RUN_MAX}); at ${N} a true 1-point loss reads as harm at least 90% of the time up to a discordance (its upper bound) of ${(100 * lim).toFixed(2)}%; ${past.length ? `past it, read at ${N} and named at the read with its rate (D34 (4)): ${past.map(([id, s]) => `${id} (${(100 * s.dUp).toFixed(2)}%)`).join(', ')}` : 'no unit past it'}`);
  // the batch's own order for the registered run: the household route's units first, then today's (audit-couples-open.mjs
  // unitsOf 'registered'), so the household part is in after its own span and today's after the whole
  const regOrder = unitsOf(panel, 'registered'), rows = regOrder.map(u => ({ id: u.id, route: u.route, secs: unitSecs(U[u.id], N) }));
  const hh = rows.filter(r => r.route === 'household').map(r => r.secs), all = [...rows.map(r => r.secs), Math.max(...rows.map(r => r.secs))], total = all.reduce((t, x) => t + x, 0), span = inOrderSpan(all);
  console.log(`the budget (D21: measured from the pilot on this machine), over ${panel.length} units and the longest once more for a relaunch: ${(total / 3600).toFixed(1)} core-hours; on ${CORES} cores in the batch's own order (the household route's ${hh.length} units first), the household part in after about ${(inOrderSpan(hh) / 3600).toFixed(1)} hours and the whole after ${(span / 3600).toFixed(1)} hours; the longest unit ${(Math.max(...rows.map(r => r.secs)) / 3600).toFixed(2)} hours`);
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), pilot: { seed: SEED, n: PILOT_N, code: codes[0], sizes }, N, coreHours: +(total / 3600).toFixed(1), hours: +(span / 3600).toFixed(1) }, null, 1) + '\n');
  console.log(`written: couples-open-paths.json (${panel.length} units at ${N})`);
}
