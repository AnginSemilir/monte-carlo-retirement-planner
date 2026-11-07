/*
 * PART D, D4'S PATHS AND BUDGET, FROM THE TWO-COUPLE PILOT (the launch plan's section 6, D4: "a two-couple pilot sizes the
 * run (D21) before any date is promised"), by the maintainer's harm rule (STATE.md D34) with Phase 4's exact rates
 * (size-phase4.mjs: harmRate, thresholdFor, sizeFor, normalCheck).
 *   - Per pilot couple and estate weight, two comparisons, CANDC/W less APP and CANDC/W less SHIPC/W: the discordance (the
 *     share of paths one arm survives and the other does not) and its Clopper-Pearson upper 95% bound; the couple's paths by
 *     sizeFor over its four bounds (the smallest multiple of 1,000 from 16,000 at which every comparison reads a true 1-point
 *     loss as harm at least 90% of the time and a true quarter-point loss at most 5%).
 *   - The run's paths: every couple at the largest of the pilot couples' (two couples cannot size forty one by one); each
 *     couple's thresholds are then set at the read from its own realised discordance (its upper bound) at that N, by the same
 *     exact rates (reduce-couples.mjs), the rule fixed here before the run.
 *   - The budget (D21): each unit in core-seconds from the pilot's own units on this machine, the pilot couple of the unit's
 *     cohort scaled by the couple's horizon (the solve, the engine's milliseconds a path and the rollout beside it each in
 *     proportion to the years: the library's horizons run from 28 years to 52, S011's the shortest; the design review of 7 Nov,
 *     MINOR 5): the solve as timed, once in each of the unit's chunks (audit-couples.mjs CHUNKS_OF); the engine at the
 *     milliseconds a path times the run's paths; the rollout beside as timed, on the same 500 paths; arm A's pick as timed.
 *   - The schedule: the audit's units in its order, four at a time (batch-couples.sh), in windows of the harness's 12 hours,
 *     a unit not done when its window closes run again whole in the next (RESUME=1): the windows, the wall-clock, the
 *     core-hours lost to units cut off, and the longest unit (a chunk).
 *   node research/solver/size-couples.mjs [pilot dir] > research/solver/results-couples-sizing.txt   (writes couples-paths.json)
 *   D4_N=8000 node research/solver/size-couples.mjs ...   the same at the paths the maintainer rules, if not D34's size
 *   node research/solver/size-couples.mjs --planted
 */
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { tmpdir, cpus } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sizeFor, normalCheck, thresholdFor, harmRate } from './size-phase4.mjs';
import { clopperPearson } from './stats.mjs';
import { CHUNKS_OF, unitsOf } from './audit-couples.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PATHS_FILE = join(HERE, 'couples-paths.json'), PANEL_N = 40, WEIGHTS = ['0.02', '0.01'];
export const COMPS = WEIGHTS.flatMap(w => [[`APP/${w}`, `CANDC/${w}`, 'APP/-'], [`SHIPC/${w}`, `CANDC/${w}`, `SHIPC/${w}`]]);

export function unitsIn(dir) {
  const U = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) { const j = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()); ((U[j.id] ||= {})[`${j.arm}/${j.w}`] = j); }
  return U;
}
const bits = j => Buffer.from(j.main.survived, 'base64');
export function discordance(a, b) { const x = bits(a), y = bits(b), n = Math.min(x.length, y.length); let k = 0; for (let i = 0; i < n; i++) if (x[i] !== y[i]) k++; return { k, n }; }
/* each pilot couple's comparisons and the paths sizeFor gives it */
export function sizePilot(U) {
  const out = {};
  for (const [id, u] of Object.entries(U)) {
    const comps = COMPS.map(([cmp, a, b]) => { if (!u[a] || !u[b]) return { cmp, missing: true }; const { k, n } = discordance(u[a], u[b]); return { cmp, k, n, dHat: k / n, dUp: clopperPearson(k, n)[1] }; });
    if (comps.some(c => c.missing)) { out[id] = { missing: comps.filter(c => c.missing).map(c => c.cmp) }; continue; }
    out[id] = { comps, ...sizeFor(comps.map(c => c.dUp)) };
  }
  return out;
}
/* each chunk's core-seconds at N paths a unit: the panel couple of a cohort from the pilot couple of that cohort (pilotOf),
   scaled by the two horizons (years); each chunk solves afresh and runs its share of the paths, the first the rollout beside */
export function chunkSecs(U, panel, N, pilotOf, years) {
  const out = [];
  for (const [id, arm, w, j] of unitsOf(panel.map(h => h.id))) {
    const h = panel.find(x => x.id === id), p = pilotOf[h.cohort], u = U[p][`${arm}/${w}`], f = years[id] / years[p], J = CHUNKS_OF[arm];
    const solve = u.solveSecs * f, beside = j === 0 && u.beside ? u.beside.secs * f : 0, rest = Math.max(0, u.secs - u.solveSecs - u.engineSecs - (u.beside ? u.beside.secs : 0));
    const lo = Math.floor((j * N) / J), hi = Math.floor(((j + 1) * N) / J), engine = (u.engineSecs / u.N) * f * (hi - lo);
    out.push({ id, arm, w, j, solve, engine, beside, rest, secs: solve + engine + beside + rest, msPath: 1000 * (u.engineSecs / u.N) * f });
  }
  return out;
}
/* the run's core-seconds, by part */
export function budgetOf(chunks) {
  const B = { total: 0, solve: 0, engine: 0, beside: 0, arms: {} };
  for (const c of chunks) { B.total += c.secs; B.solve += c.solve; B.engine += c.engine; B.beside += c.beside; const a = (B.arms[c.arm] ||= { secs: 0, longest: 0 }); a.secs += c.secs; a.longest = Math.max(a.longest, c.secs); }
  return B;
}
/* the batch under the harness's limit: the units in order, `slots` at a time, each window `win` seconds; a unit running when its
   window closes is cut off and run again whole in the next window, with every unit not yet done, in the same order */
export function scheduleOf(chunks, slots = 4, win = 12 * 3600) {
  let todo = chunks.map(c => c.secs), windows = 0, lost = 0, last = 0;
  while (todo.length) {
    windows++;
    const free = Array(slots).fill(0), left = [];
    let q = 0, open = slots;
    while (q < todo.length) {
      let s = -1; for (let k = 0; k < slots; k++) if (free[k] !== null && (s < 0 || free[k] < free[s])) s = k;
      if (s < 0) { left.push(...todo.slice(q)); break; }
      const d = todo[q];
      if (free[s] + d <= win) { free[s] += d; q++; } else { lost += win - free[s]; left.push(d); free[s] = null; open--; q++; if (!open) { left.push(...todo.slice(q)); break; } }
    }
    if (windows > 1000) throw new Error('size-couples: a unit longer than a window never finishes');
    last = Math.max(...free.map(x => (x === null ? win : x)));
    if (left.length === todo.length && left.every((d, k) => d === todo[k])) throw new Error('size-couples: a unit longer than a window never finishes');
    todo = left;
  }
  return { windows, lost, hours: (windows - 1) * 12 + last / 3600 };
}
/* the largest discordance at which a 1-point loss still reads as harm 90% of the time at N paths (the threshold at that
   discordance by thresholdFor), to a hundredth of a point */
export function tpLimit(N, bar = 0.9) {
  let d = 0.0101;
  while (d < 0.5 && harmRate(d + 0.0001, N, thresholdFor(d + 0.0001, N), 1) >= bar) d += 0.0001;
  return d;
}

function planted() {
  const cases = [];
  const dir = mkdtempSync(join(tmpdir(), 'd4size-')), n = 2000, b64 = lost => Buffer.from(Uint8Array.from({ length: n }, (_, i) => (i < lost ? 0 : 1))).toString('base64');
  const unit = (id, arm, w, lost, secs) => writeFileSync(join(dir, `${id}-${arm}-w${w}.json.gz`), gzipSync(JSON.stringify({ id, arm, w, N: n, solveSecs: secs.s, engineSecs: secs.e, secs: secs.s + secs.e + (secs.b || 0) + 1, beside: secs.b ? { N: 500, secs: secs.b } : null, main: { survived: b64(lost) } })));
  // H1: CANDC survives every path, APP loses 180, SHIPC 40; H2 the same but APP loses 400 (a wider discordance sizes the run)
  for (const [id, a] of [['H1', 180], ['H2', 400]]) {
    unit(id, 'APP', '-', a, { s: 0, e: 1 });
    for (const w of WEIGHTS) { unit(id, 'CANDC', w, 0, { s: 600, e: 1800, b: 450 }); unit(id, 'SHIPC', w, 40, { s: 200, e: 900, b: 220 }); }
  }
  const U = unitsIn(dir), S = sizePilot(U), N = Math.max(...Object.values(S).map(s => s.N));
  cases.push(['each couple sized at its comparisons\' upper bounds; the run at the larger', `${S.H1.N === sizeFor([clopperPearson(180, n)[1], clopperPearson(40, n)[1], clopperPearson(180, n)[1], clopperPearson(40, n)[1]]).N} ${N === S.H2.N} ${S.H2.N >= S.H1.N}`, 'true true true']);
  // the budget: each unit from its cohort's pilot couple, scaled by the years, a solve in each chunk, the rollout in the first
  const panelP = [{ id: 'P1', cohort: 'lib' }, { id: 'P2', cohort: 'young' }], years = { H1: 28, H2: 61, P1: 56, P2: 61 }, C = chunkSecs(U, panelP, 16000, { lib: 'H1', young: 'H2' }, years);
  const want = [2, 1].reduce((s, f) => s + 2 * (CHUNKS_OF.CANDC * (600 * f + 1) + 0.9 * f * 16000 + 450 * f) + 2 * (CHUNKS_OF.SHIPC * (200 * f + 1) + 0.45 * f * 16000 + 220 * f) + (1 + 0.0005 * f * 16000), 0);
  cases.push(['the budget: each unit scaled by its years from its cohort\'s pilot couple, a solve in every chunk, the rollout in the first', `${C.length} ${Math.abs(budgetOf(C).total - want) < 1e-6}`, `${2 * (2 * CHUNKS_OF.CANDC + 2 * CHUNKS_OF.SHIPC + 1)} true`]);
  const h7 = 7 * 3600, S7 = scheduleOf(Array(5).fill({ secs: h7 }));
  cases.push(['the schedule: five 7-hour units on four cores, the fifth cut off at 12 hours and run again in a second window', `${S7.windows} ${S7.hours} ${S7.lost / 3600}`, '2 19 5']);
  let threw = false; try { scheduleOf([{ secs: 13 * 3600 }]); } catch { threw = true; }
  cases.push(['a unit longer than a window is refused, never scheduled', `${threw}`, 'true']);
  const L = tpLimit(19000);
  cases.push(['the discordance up to which a 1-point loss reads as harm 90% of the time at 19,000 paths (the review: about 12.4%)', `${L > 0.12 && L < 0.13} ${harmRate(L, 19000, thresholdFor(L, 19000), 1) >= 0.9} ${harmRate(L + 0.0001, 19000, thresholdFor(L + 0.0001, 19000), 1) < 0.9}`, 'true true true']);
  writeFileSync(join(dir, 'H3-APP-w-.json.gz'), gzipSync(JSON.stringify({ id: 'H3', arm: 'APP', w: '-', N: n, solveSecs: 0, engineSecs: 1, secs: 2, main: { survived: b64(0) } })));
  const S3 = sizePilot(unitsIn(dir));
  cases.push(['a pilot couple missing a unit is named, not sized', `${(S3.H3.missing || []).length}`, '4']);
  rmSync(dir, { recursive: true, force: true });
  let bad = 0;
  for (const [nm, got, w] of cases) { const ok = got === w; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${w})`}`); }
  console.log('EDGES: a couple missing a unit, the run sized by the wider couple, a unit cut off at a window\'s end, a unit longer than a window');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  const dir = process.argv[2] || join(HERE, 'results', 'd4-pilot'), U = unitsIn(dir), S = sizePilot(U);
  const missing = Object.entries(S).filter(([, s]) => s.missing);
  if (missing.length) { console.log(`size-couples: units missing: ${missing.map(([id, s]) => `${id} ${s.missing.join(',')}`).join('; ')}`); process.exit(1); }
  const N = Number(process.env.D4_N) || Math.max(...Object.values(S).map(s => s.N)), panel = JSON.parse(readFileSync(join(HERE, 'couples-panel.json'), 'utf8')).panel;
  console.log(`D4's sizing from the pilot (${dir.replace(/.*research\/solver\//, '')}; ${Object.keys(U).length} couples, seed ${Object.values(Object.values(U)[0])[0].seed}, ${Object.values(Object.values(U)[0])[0].N} paths a unit; ${cpus()[0].model})`);
  for (const [id, s] of Object.entries(S)) {
    console.log(`  ${id}: sized at ${s.N} paths`);
    for (const [i, c] of s.comps.entries()) { const r = s.rows[i], nc = normalCheck(r.d, s.N); console.log(`    CANDC less ${c.cmp.padEnd(10)} discordant ${c.k} of ${c.n} (${(100 * c.dHat).toFixed(2)}%, upper 95% ${(100 * c.dUp).toFixed(2)}%): threshold ${r.t.toFixed(4)} points at ${s.N}, false alarm at a quarter-point loss ${r.fp.toFixed(4)}, a 1-point loss read ${r.tp.toFixed(4)}; the normal check's threshold ${nc.t.toFixed(4)}, paths ${nc.nNeeded}`); }
  }
  console.log(`  the run: every couple at ${N} paths (${process.env.D4_N ? 'the maintainer\'s ruling; D34\'s size the larger of the pilot couples\', ' + Math.max(...Object.values(S).map(s => s.N)) : 'the larger of the pilot couples\''}); each couple's thresholds at the read from its own realised discordance at ${N}, by the same exact rates`);
  for (const n of [N, 8000]) console.log(`  at ${n} paths a true 1-point loss reads as harm at least 90% of the time up to a discordance (its upper bound) of ${(100 * tpLimit(n)).toFixed(2)}%; above it the rate falls (at 15%: ${harmRate(0.15, n, thresholdFor(0.15, n), 1).toFixed(3)}, at 20%: ${harmRate(0.2, n, thresholdFor(0.2, n), 1).toFixed(3)})`);
  // the pilot couples' own times, each arm, and the horizons that scale them
  const { readPanel } = await import('./couple-panel.mjs'), E = await import('../engine.mjs');
  const full = readPanel(), years = Object.fromEntries(full.map(h => [h.id, E.buildContext(E.resolveMpaa(E.normalizePlan(h.plan))).totalYears + 1]));
  const pilotOf = Object.fromEntries(['lib', 'young'].map(co => [co, Object.keys(U).find(id => panel.find(h => h.id === id).cohort === co)]));
  for (const id of Object.keys(U)) console.log(`  pilot ${id} (${years[id]} years): ${Object.entries(U[id]).sort().map(([k, u]) => `${k} the solve ${Math.round(u.solveSecs)} s, the engine ${(1000 * u.engineSecs / u.N).toFixed(1)} ms a path${u.beside ? `, beside ${Math.round(u.beside.secs)} s` : ''}`).join('; ')}`);
  { const a = U[pilotOf.young]['CANDC/0.02'], b = U[pilotOf.lib]['CANDC/0.02']; console.log(`  the younger pilot couple's candidate engine ${(a.engineSecs / a.N / (b.engineSecs / b.N)).toFixed(2)} times the library one's a path (${years[pilotOf.young]} years against ${years[pilotOf.lib]}: ${(years[pilotOf.young] / years[pilotOf.lib]).toFixed(2)} times the years)`); }
  const ys = co => full.filter(h => h.cohort === co).map(h => years[h.id]);
  console.log(`  the horizons: library ${Math.min(...ys('lib'))} to ${Math.max(...ys('lib'))} years (mean ${(ys('lib').reduce((s, x) => s + x, 0) / 20).toFixed(1)}; the pilot's ${years[pilotOf.lib]}), younger ${Math.min(...ys('young'))} to ${Math.max(...ys('young'))} (the pilot's ${years[pilotOf.young]}); each unit scaled from its cohort's pilot couple by its years`);
  for (const n of [N, 8000]) {
    const C = chunkSecs(U, full, n, pilotOf, years), B = budgetOf(C), S = scheduleOf(C), long = C.reduce((m, c) => (c.secs > m.secs ? c : m));
    console.log(`  the budget at ${n} paths over ${PANEL_N} couples, ${C.length} units (CANDC in ${CHUNKS_OF.CANDC} chunks, SHIPC in ${CHUNKS_OF.SHIPC}, APP whole): ${(B.total / 3600).toFixed(1)} core-hours (the solves ${(B.solve / 3600).toFixed(1)}, a solve in each chunk; the engine ${(B.engine / 3600).toFixed(1)}; the rollout beside it ${(B.beside / 3600).toFixed(1)}); ${Object.entries(B.arms).map(([k, a]) => `${k} ${(a.secs / 3600).toFixed(1)}`).join(', ')}`);
    // the budget's spread: every couple at the younger pilot couple's rate a year (the library pilot couple reads no bridge
    // year, the younger one six a person), and the pilot's engine time with E.runTrial's check on its first 200 paths in it
    { const Cy = chunkSecs(U, full, n, { lib: pilotOf.young, young: pilotOf.young }, years), By = budgetOf(Cy), Sy = scheduleOf(Cy), u0 = U[pilotOf.lib]['CANDC/0.02'], chk = (Math.min(200, u0.N) + u0.N) / u0.N;
      console.log(`    its spread: at the younger pilot couple's rate a year for every couple ${(By.total / 3600).toFixed(1)} core-hours, ${Sy.windows} windows, about ${Sy.hours.toFixed(0)} hours; the pilot's engine times include E.runTrial on ${Math.min(200, u0.N)} of its ${u0.N} paths, up to ${chk.toFixed(2)} times the engine's alone if the check costs a path's run (the engine's part then ${(B.engine / chk / 3600).toFixed(1)} core-hours)`); }
    console.log(`    the longest unit ${(long.secs / 3600).toFixed(2)} hours (${long.id} ${long.arm}/${long.w} chunk ${long.j}); at a fifth slower ${(1.2 * long.secs / 3600).toFixed(2)}, inside the 12-hour limit; on four cores in 12-hour windows: ${S.windows} windows, about ${S.hours.toFixed(0)} hours (${(S.hours / 24).toFixed(1)} days), ${(S.lost / 3600).toFixed(1)} core-hours cut off at a window's end and run again`);
  }
  // the pooled items' se at the run's size, from the pilot's (its two couples, its paths): between the couples' paths moving
  // independently (the se falls with the square root of the couples as well) and moving together (with the paths alone)
  { const R = await import('./reduce-couples.mjs'), PU = R.loadDir(dir), pp = panel.filter(h => PU[h.id]), n0 = Object.values(Object.values(PU)[0])[0].N;
    for (const w of ['0.02', '0.01']) { const it = R.itemsAt(PU, pp, w); console.log(`  W${w} the pilot's se (${pp.length} couples, ${n0} paths): S1 ${it.S1.se.toFixed(4)}, A1 ${it.A1.se.toFixed(4)} points, A2 ${it.A2.se.toFixed(4)}%; over ${PANEL_N} couples, S1's ${[N, 8000].map(n => `at ${n} paths from ${(it.S1.se * Math.sqrt(pp.length / PANEL_N) * Math.sqrt(n0 / n)).toFixed(3)} to ${(it.S1.se * Math.sqrt(n0 / n)).toFixed(3)}`).join(', ')} (against its bar of -0.1)`); } }
  for (const n of [4000, 8000, 16000]) {
    // D34's rates at this size, each pilot comparison at its upper bound: the threshold, and how often a true 1-point loss reads as harm
    const rates = Object.entries(S).flatMap(([id, s]) => s.comps.map(c => { const d = Math.max(c.dUp, 0.0101), th = thresholdFor(d, n); return `${id} ${c.cmp} ${harmRate(d, n, th, 1).toFixed(2)}`; }));
    console.log(`    at ${n} paths a unit, a true 1-point loss read as harm: ${rates.join(', ')}`);
  }
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), N, rule: 'every couple at N; thresholds at the read from each couple\'s realised discordance (Clopper-Pearson upper 95%) by size-phase4.mjs thresholdFor', paths: Object.fromEntries(panel.map(h => [h.id, N])) }, null, 1) + '\n');
  console.log(`  written: couples-paths.json (${panel.length} couples at ${N})`);
}
