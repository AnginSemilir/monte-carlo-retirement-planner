/*
 * THE SAVINGS SPLIT'S v2, THE SIZING FROM ITS PILOT (SAVE-V2.md; registrations/save-v2.md, Paths and Budget; D34 (2) and
 * (4), as D61 and step 8 applied them): the pilot's households (audit-save-v2.mjs pilot: the younger cohort's places 0 and 5
 * and the library's 0 and 15, seed 7002, 1,000 paths, all four arms; EXPLORATORY) give each household's discordance between
 * CANDS and CANDD and its Clopper-Pearson upper 95% bound; D34's size for each (size-household-hsp.mjs sizeOf: the smallest N
 * from 16,000 at which a true 1-point loss is read as harm at least 90% of the time with a quarter-point loss at most 5%). The
 * run takes one N for every household: the largest of those, at most D61's 19,000; a comparison past it is read at 19,000
 * and named at the read with its rate (D34 (4)). The pair on anchors runs on each household's first 4,000 paths (D133 (3)),
 * its rate at 4,000 printed beside.
 * The budget (D21: measured from the pilot's households on this machine): each panel household scaled from the pilot
 * household of its cohort nearest in horizon, by the two horizons: each arm's solve, its CPU a path times its paths and its
 * 200 paths held to E.runTrial, and runPolicy beside it; four cores, in the batch's order and longest first; and the longest
 * household once more, for a relaunch.
 * Before anything is written: the pilot on the panel's code, its read's gate passed (reduce-save-v2.mjs gate, as --pilot runs
 * it), and what the pilot shows printed by household: each one's change and D34's chance of flagging it at the registered N
 * were its change the truth, and its lifetime spending's change.
 *   node research/solver/size-save-v2.mjs [pilot dir] > research/solver/results-save-v2-sizing.txt   (writes save-v2-paths.json)
 *   node research/solver/size-save-v2.mjs --planted
 */
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { sizeOf, runN, flagChance, makespan, inOrderSpan, RUN_MAX, CORES } from './size-household-hsp.mjs';
import { tpLimit } from './size-couples.mjs';
import { harmRate, thresholdFor, D_MIN } from './size-phase4.mjs';
import { normUpper, zFor } from './stats.mjs';
import { gunzipSync } from 'node:zlib';
import { loadDir, gate, spendRows, HH_SPEND_BAR, LEVEL } from './reduce-save-v2.mjs';
import { ALL_ARMS, PILOT_N, PILOT_SEED, PATHS_FILE, CHECK, ANCHORS_N, pilotUnits, stampFilesHash, nOf } from './audit-save-v2.mjs';
import { readSaveV2Panel, PANEL } from './save-v2-panel.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
/* a household's core-seconds at N, from a pilot household's record: each arm's solve, its CPU a path at its paths (the
   whole menu's N, the anchors' first ANCHORS_N) and on its CHECK paths held to E.runTrial, and runPolicy beside it */
export function householdSecs(p, N, scale, check = CHECK) {
  return scale * ALL_ARMS.reduce((t, a) => { const A = p.arms[a], n = nOf(a, N); return t + (A.solveSecs || 0) + (A.cpuUs / 1e6 / A.n) * (n + Math.min(check, n)) + (A.beside ? A.beside.secs : 0); }, 0);
}
/* the pilot discordance's upper bound as D34's read takes it: never below D_MIN (size-phase4.mjs sizeFor, reduce-couples.mjs
   harmOf). A true 1-point loss needs a discordance of at least 1%, below which harmRate has no rate (NaN), and thresholdFor
   stops at its first lattice step. SIZE_SV2_PLANT=nofloor (a planted fault) takes the bound as it is. */
export const dOf = dUp => (process.env.SIZE_SV2_PLANT === 'nofloor' ? dUp : Math.max(dUp, D_MIN));
/* the 1-point rate of a comparison at n paths, from its pilot discordance's upper bound (D34 (4)) */
export const rateAt = (dUp, n) => { const d = dOf(dUp); return harmRate(d, n, thresholdFor(d, n), 1); };
/* D34's threshold and the chance a household is flagged at N were its pilot change the truth, the bound floored as above */
export const flagAt = (s, change, N) => flagChance({ ...s, dUp: dOf(s.dUp) }, change, N);
/* part 3's operating characteristic (the design review's MINOR 4): the chance a household whose true lifetime spending loss
   is L (in percent) fails part 3, where its observed change, normal about -L with the household's paired se at the run's
   paths, falls below the bar and its one-sided p below LEVEL over `households` (Holm's worst rank, so the rate is a lower
   bound where that rank is not reached). SIZE_SV2_PLANT=noholm (a planted fault) drops the Holm bound. */
export function part3Rate(L, se, households = 40) {
  const holmBar = process.env.SIZE_SV2_PLANT === 'noholm' ? 0 : zFor(2 * LEVEL / households) * se, bar = Math.max(-HH_SPEND_BAR, holmBar);
  return 1 - normUpper((L - bar) / se);
}
/* a household's paired spending se, in percent of the base arm's mean, from per-path delivered arrays */
export function spendSe(base, arm) {
  const n = Math.min(base.length, arm.length); let m = 0; for (let i = 0; i < n; i++) m += base[i]; m /= n;
  const d = Array.from({ length: n }, (_, i) => 100 * (arm[i] - base[i]) / m), mu = d.reduce((t, x) => t + x, 0) / n;
  return Math.sqrt(d.reduce((t, x) => t + (x - mu) ** 2, 0) / (n - 1) / n);
}
export const RATE_LOSSES = [0.05, 0.08, 0.1, 0.12, 0.25];

function planted() {
  const cases = [];
  { const A = (s, ms, b) => ({ solveSecs: s, cpuUs: ms * 1e3 * 1000, n: 1000, beside: { secs: b } }), p = { arms: { CANDD: A(100, 50, 10), CANDS: A(200, 100, 20), CANDDA: A(50, 50, 10), CANDSA: A(80, 100, 20) } };
    const want = 100 + 0.05 * 16200 + 10 + 200 + 0.1 * 16200 + 20 + 50 + 0.05 * 4200 + 10 + 80 + 0.1 * 4200 + 20;
    cases.push(['a household\'s seconds at 16,000: each arm\'s solve, its CPU a path at its own paths (the anchors\' 4,000) and its 200 checked, and runPolicy beside', `${Math.round(householdSecs(p, 16000, 1))}`, `${Math.round(want)}`]);
    cases.push(['scaled by the horizons', `${Math.round(householdSecs(p, 16000, 1.5))}`, `${Math.round(1.5 * want)}`]); }
  { const flips = (n, k) => { const a = new Uint8Array(n).fill(1); for (let i = 0; i < k; i++) a[i] = 0; return a; }, s = sizeOf(flips(1000, 30), flips(1000, 0));
    cases.push(['the anchors pair\'s 1-point rate at 4,000 paths below the rate at 16,000, at 3% discordance', `${rateAt(s.dUp, 4000) < rateAt(s.dUp, 16000)} ${rateAt(s.dUp, 16000) >= 0.9}`, 'true true']); }
  // below a 1% discordance (3 of 1,000 differ, its upper bound under 1%): the rate and the threshold are D_MIN's, as the read's
  { const flips = (n, k) => { const a = new Uint8Array(n).fill(1); for (let i = 0; i < k; i++) a[i] = 0; return a; }, s = sizeOf(flips(1000, 3), flips(1000, 0)), r = rateAt(s.dUp, 4000), f = flagAt(s, 0, 16000);
    cases.push(['below a 1% discordance the rate and the threshold are taken at D_MIN, as the read takes them: a number, not NaN', `${s.dUp < 0.01} ${Number.isFinite(r) && r === rateAt(D_MIN, 4000)} ${f.t === thresholdFor(D_MIN, 16000)}`, 'true true true']); }
  // part 3's operating characteristic: a tiny se, the bar alone (a true loss at the bar fails half the time); a large se, the
  // Holm bound over forty (the one-sided z at 0.05 / 40 times the se) the bar
  { const z = zFor(2 * LEVEL / 40), a = part3Rate(0.1, 0.001), b = part3Rate(z * 0.05, 0.05), c = part3Rate(0.12, 0.001), d = part3Rate(0.08, 0.001);
    cases.push(['part 3\'s rate: at the bar half; past it nearly always; inside it nearly never; at a large se the Holm bound the bar', `${a.toFixed(2)} ${c > 0.999} ${d < 0.001} ${b.toFixed(2)}`, '0.50 true true 0.50']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const DIR = process.argv[2] || join(HERE, 'results', 'save-v2-pilot');
  const panel = readSaveV2Panel(), pu = pilotUnits(panel), U = Object.fromEntries(loadDir(DIR).map(u => [u.id, u]));
  const missing = pu.filter(u => !U[u.id]).map(u => u.id);
  if (missing.length) { console.log(`size-save-v2: the pilot is missing ${missing.join(', ')}`); process.exit(1); }
  const recs = pu.map(u => U[u.id]), codes = [...new Set(recs.map(r => r.stamp.code))], seeds = [...new Set(recs.map(r => r.seed))], panelCode = JSON.parse(readFileSync(PANEL, 'utf8')).code;
  if (codes.length !== 1 || seeds.length !== 1 || seeds[0] !== PILOT_SEED) { console.log(`size-save-v2: the pilot is on codes ${codes.join(', ')} and seeds ${seeds.join(', ')}`); process.exit(1); }
  if (codes[0] !== panelCode) { console.log(`size-save-v2: the pilot ran on code ${codes[0]}, not the panel's ${panelCode}`); process.exit(1); }
  // the pilot's own gate, as reduce-save-v2.mjs --pilot runs it, before anything is written
  { const logs = readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)), P = gate(Object.values(U), pu, { seed: PILOT_SEED, audit: stampFilesHash(), code: panelCode, logs: Object.fromEntries(logs.map(x => [x, readFileSync(join(DIR, x), 'utf8')])) });
    if (P.length) { console.log(`size-save-v2: the pilot's gate refuses it:\n  ${P.join('\n  ')}`); process.exit(1); } }
  const yearsOf = u => E.buildContext(E.resolveMpaa(u.plan)).totalYears + 1, sv = a => 100 * a.survived.reduce((t, x) => t + x, 0) / a.survived.length, sg = x => (x >= 0 ? '+' : '') + x.toFixed(2);
  console.log(`THE SAVINGS SPLIT'S v2, THE SIZING from its pilot (${DIR.replace(/.*research\/solver\//, '')}; ${pu.length} households, seed ${PILOT_SEED}, ${PILOT_N} paths each arm, code ${codes[0]}; EXPLORATORY)`);
  const sizes = {}, spend = Object.fromEntries(spendRows(recs, 'CANDD', 'CANDS').map(r => [r.id, r]));
  for (const u of pu) {
    const r = U[u.id], s = sizeOf(r.arms.CANDS.survived, r.arms.CANDD.survived), sa = sizeOf(r.arms.CANDSA.survived, r.arms.CANDDA.survived); sizes[u.id] = s;
    console.log(`  ${u.id.padEnd(6)} ${u.cohort.padEnd(4)} CANDS against CANDD ${sg(sv(r.arms.CANDS) - sv(r.arms.CANDD))} points (CANDD ${sv(r.arms.CANDD).toFixed(1)}%); discordant ${s.k} of ${s.n} (${(100 * s.dHat).toFixed(2)}%, its upper bound ${(100 * s.dUp).toFixed(2)}%): D34's size ${Number.isFinite(s.N) ? s.N : 'past every size tried'}; on anchors ${sg(sv(r.arms.CANDSA) - sv(r.arms.CANDDA))} points, discordant ${sa.k} of ${sa.n}, its 1-point rate at ${ANCHORS_N} ${rateAt(sa.dUp, ANCHORS_N).toFixed(3)}; lifetime spending ${(spend[u.id].pct >= 0 ? '+' : '') + spend[u.id].pct.toFixed(4)}%`);
  }
  const N = runN(Object.values(sizes)), lim = tpLimit(N), past = Object.entries(sizes).filter(([, s]) => s.N > N);
  console.log(`what the pilot shows, at the registered ${N} paths (each household's pilot change were it the truth; EXPLORATORY, deciding nothing):`);
  for (const u of pu) { const r = U[u.id], ch = sv(r.arms.CANDS) - sv(r.arms.CANDD), fc = flagAt(sizes[u.id], ch, N); console.log(`  ${u.id.padEnd(6)} ${sg(ch)} points; D34's threshold at ${N} ${fc.t.toFixed(3)}; the chance it is flagged ${fc.chance.toFixed(3)}`); }
  // part 3's operating characteristic at the run's N (the design review's MINOR 4), at each pilot household's paired spending
  // noise, and at the factorial's S308F (seed 7002, 4,000 paths, on anchors: the household of the harm part 3 guards against)
  { const seRows = pu.map(u => { const r = U[u.id]; return [u.id, spendSe(r.arms.CANDD.delivered, r.arms.CANDS.delivered) * Math.sqrt(r.arms.CANDD.delivered.length / N)]; });
    const fac = join(HERE, 'results', 'save-7002'), facOf = arm => { const j = JSON.parse(gunzipSync(readFileSync(join(fac, `S308F-${arm}.json.gz`))).toString()); const b = Buffer.from(j.main.delivered, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Float32Array(c.buffer); };
    try { const d = facOf('candd'), x = facOf('cands'); seRows.push(['S308F (the factorial)', spendSe(d, x) * Math.sqrt(d.length / N)]); } catch { console.log('  (the factorial\'s S308F not found: its row left out)'); }
    console.log(`part 3's operating characteristic at ${N} paths (EXPLORATORY): the chance a household with a true lifetime spending loss of ${RATE_LOSSES.map(l => `${l}%`).join(', ')} fails part 3 (its change below -0.1% and its one-sided p below 0.05 over forty, Holm's worst rank), by the normal approximation at its paired se:`);
    for (const [id, se] of seRows) console.log(`  ${id.padEnd(22)} se ${se.toFixed(4)}%: ${RATE_LOSSES.map(l => part3Rate(l, se).toFixed(3)).join(' / ')}`); }
  console.log(`the run: every household at ${N} paths on the whole menu (the largest of the pilot's sizes, at most D61's ${RUN_MAX}), its anchors pair on the first ${ANCHORS_N}; at ${N} a true 1-point loss reads as harm at least 90% of the time up to a discordance (its upper bound) of ${(100 * lim).toFixed(2)}%${past.length ? `; past it: ${past.map(([id]) => id).join(', ')}, read at ${N} and named with their rate (D34 (4))` : ''}`);
  const rows = panel.map(u => {
    const y = yearsOf(u), mine = pu.filter(p => p.cohort === u.cohort), pool = mine.length ? mine : pu, from = pool.reduce((b, p) => (Math.abs(yearsOf(p) - y) < Math.abs(yearsOf(b) - y) ? p : b));
    return { id: u.id, years: y, from: from.id, secs: householdSecs(U[from.id], N, y / yearsOf(from)) };
  });
  const all0 = rows.map(r => r.secs), longest = Math.max(...all0), all = [...all0, longest], total = all.reduce((s, x) => s + x, 0), span = makespan(all), ordered = inOrderSpan(all);
  console.log(`the budget (D21: measured from the pilot's households on this machine), over ${panel.length} households and the longest once more for a relaunch: ${(total / 3600).toFixed(1)} core-hours; on ${CORES} cores in the batch's own order (the panel's) ${(ordered / 3600).toFixed(1)} hours, longest first ${(span / 3600).toFixed(1)}; the longest household ${(longest / 3600).toFixed(2)} hours`);
  for (const u of pu) { const r = U[u.id]; console.log(`  pilot ${u.id.padEnd(6)} the solves ${ALL_ARMS.map(a => `${a} ${Math.round(r.arms[a].solveSecs)} s`).join(', ')}; a path ${ALL_ARMS.map(a => `${a} ${(r.arms[a].cpuUs / 1e3 / r.arms[a].n).toFixed(1)} ms`).join(', ')}; beside ${ALL_ARMS.map(a => Math.round(r.arms[a].beside.secs)).join(' / ')} s; the load at its chunks ${r.arms.CANDD.chunks.map(c => c.load[0].toFixed(1)).join(', ')}`); }
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), pilot: { seed: PILOT_SEED, n: PILOT_N, code: codes[0], units: pu.map(u => u.id), sizes }, N, nAnchors: Math.min(ANCHORS_N, N), coreHours: +(total / 3600).toFixed(1), hours: +(ordered / 3600).toFixed(1), hoursLongestFirst: +(span / 3600).toFixed(1), paths: Object.fromEntries(panel.map(u => [u.id, N])) }, null, 1) + '\n');
  console.log(`written: save-v2-paths.json (${panel.length} households at ${N})`);
}
