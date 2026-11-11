/*
 * THE RE-RUN (registrations/couples-d4b.md; the review of 9 Nov, items 1 and 9): the same pilot couples on the code the couples
 * are landed on, the paths at D61's 19,000 in item 9's two stages (every unit's first STAGE1, then the rest for each couple and
 * weight whose CANDC survival there is below APP's plus STAGE_BAR points), the exact two-stage rates of each comparison against
 * APP (size-phase4.mjs twoStageRate), and the budget: the first stage
 * whole, the second for every couple and weight (the ceiling), for none (the floor), and as the pilot couples' own changes
 * against APP would stop them (each couple taking its cohort's pilot couple's chance of stopping); written to
 * couples-paths-d4b.json. D4's own sizing (one stage, couples-paths.json) as it was is in git.
 * THE REVISION OF 11 NOV (the external review's ANSWERS-2026-11-11.md, section 3; D78): SHIPC is reported, not deciding, on the
 * first SHIP_N paths of each unit, in one chunk, in the first stage alone. So a SHIPC unit costs one solve, its engine on
 * SHIP_N paths and the rollout beside, and nothing in the second stage; no comparison against SHIPC sizes the run or is given
 * rates (its per-couple flags are dropped); S1's pooled standard error at SHIP_N paths over the 40 couples is printed in
 * their place. A pilot unit's times are read on the paths it ran (its `n`), which for SHIPC are no more than SHIP_N whatever
 * the pilot's paths.
 *
 * PART D, D4'S PATHS AND BUDGET, FROM THE TWO-COUPLE PILOT (the launch plan's section 6, D4: "a two-couple pilot sizes the
 * run (D21) before any date is promised"), by the maintainer's harm rule (STATE.md D34) with Phase 4's exact rates
 * (size-phase4.mjs: harmRate, thresholdFor, sizeFor, normalCheck).
 *   - Per pilot couple and estate weight, the comparison CANDC/W less APP (D4 sized on CANDC/W less SHIPC/W too; not since
 *     11 Nov): the discordance (the
 *     share of paths one arm survives and the other does not) and its Clopper-Pearson upper 95% bound; the couple's paths by
 *     sizeFor over its two bounds (the smallest multiple of 1,000 from 16,000 at which every comparison reads a true 1-point
 *     loss as harm at least 90% of the time and a true quarter-point loss at most 5%).
 *   - The run's paths: every couple at the largest of the pilot couples' (two couples cannot size forty one by one); each
 *     couple's thresholds are then set at the read from its own realised discordance (its upper bound) at that N, by the same
 *     exact rates (reduce-couples.mjs), the rule fixed here before the run.
 *   - The budget (D21): each unit in core-seconds from the pilot's own units on this machine, the pilot couple of the unit's
 *     cohort scaled by the couple's horizon (the solve, the engine's milliseconds a path and the rollout beside it each in
 *     proportion to the years: the library's horizons run from 28 years to 52, S011's the shortest; the design review of 7 Nov,
 *     MINOR 5): the solve as timed, once in each of the unit's chunks (audit-couples.mjs chunksOf); the engine at the
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
import { sizeFor, normalCheck, thresholdFor, harmRate, twoStageRate } from './size-phase4.mjs';
import { clopperPearson } from './stats.mjs';
import { chunksOf, rangeOf, unitsOf, STAGE1, STAGE_BAR, SHIP_N } from './audit-couples.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PATHS_FILE = join(HERE, 'couples-paths-d4b.json'), PANEL_N = 40, WEIGHTS = ['0.02', '0.01'], RUN_N = 19000;
/* the comparisons that size a couple and carry D34's rates: CANDC against APP at each weight. None against SHIPC since 11 Nov
   (D78: reported, its per-couple flags dropped) */
export const COMPS = WEIGHTS.map(w => [`APP/${w}`, `CANDC/${w}`, 'APP/-']);
/* the units a pilot couple must have: SHIPC's too, for the budget */
export const NEED = ['APP/-', ...WEIGHTS.flatMap(w => [`CANDC/${w}`, `SHIPC/${w}`])];

export function unitsIn(dir) {
  const U = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) { const j = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()); ((U[j.id] ||= {})[`${j.arm}/${j.w}`] = j); }
  return U;
}
const bits = j => Buffer.from(j.main.survived, 'base64');
/* the paths a pilot unit ran: its `n` (SHIPC's are its first SHIP_N at most, whatever the pilot's N); a unit written before
   the audit recorded it ran its N */
export const ranOf = u => (u.n !== undefined ? u.n : u.N);
export function discordance(a, b) { const x = bits(a), y = bits(b), n = Math.min(x.length, y.length); let k = 0; for (let i = 0; i < n; i++) if (x[i] !== y[i]) k++; return { k, n }; }
/* each pilot couple's comparisons and the paths sizeFor gives it */
export function sizePilot(U) {
  const out = {};
  for (const [id, u] of Object.entries(U)) {
    const missing = NEED.filter(k => !u[k]);
    if (missing.length) { out[id] = { missing }; continue; }
    const comps = COMPS.map(([cmp, a, b]) => { const { k, n } = discordance(u[a], u[b]); return { cmp, k, n, dHat: k / n, dUp: clopperPearson(k, n)[1] }; });
    out[id] = { comps, ...sizeFor(comps.map(c => c.dUp)) };
  }
  return out;
}
/* each chunk's core-seconds at N paths a unit: the panel couple of a cohort from the pilot couple of that cohort (pilotOf),
   scaled by the two horizons (years); each chunk solves afresh and runs its share of the paths, the first the rollout beside.
   The chunks and their paths are the audit's (unitsOf, rangeOf): a SHIPC unit is one chunk of its first SHIP_N paths, so it
   costs one solve, its engine on those paths and the rollout beside, in the first stage, and nothing after */
export function chunkSecs(U, panel, N, pilotOf, years) {
  const out = [];
  for (const [id, arm, w, j] of unitsOf(panel.map(h => h.id))) {
    const [lo, hi] = rangeOf(N, arm, j);
    if (hi <= lo) continue;
    const h = panel.find(x => x.id === id), p = pilotOf[h.cohort], u = U[p][`${arm}/${w}`], f = years[id] / years[p];
    const solve = u.solveSecs * f, beside = j === 0 && u.beside ? u.beside.secs * f : 0, rest = Math.max(0, u.secs - u.solveSecs - u.engineSecs - (u.beside ? u.beside.secs : 0));
    const engine = (u.engineSecs / ranOf(u)) * f * (hi - lo);
    out.push({ id, arm, w, j, stage: j === 0 ? 1 : 2, solve, engine, beside, rest, secs: solve + engine + beside + rest, msPath: 1000 * (u.engineSecs / ranOf(u)) * f });
  }
  return out;
}
/* the run's core-seconds, by part */
export function budgetOf(chunks) {
  const B = { total: 0, solve: 0, engine: 0, beside: 0, arms: {} };
  for (const c of chunks) { B.total += c.secs; B.solve += c.solve; B.engine += c.engine; B.beside += c.beside; const a = (B.arms[c.arm] ||= { secs: 0, longest: 0 }); a.secs += c.secs; a.longest = Math.max(a.longest, c.secs); }
  return B;
}
export const armHours = B => Object.entries(B.arms).map(([a, x]) => `${a} ${(x.secs / 3600).toFixed(1)}`).join(', ');
/* the code the pilot's units ran on against the code the couples were landed on: the registration's budget is the pilot's on
   the landing's code, so a pilot on any other code is said plainly, in the sizing's own output */
export function codeLine(U, landed) {
  const codes = [...new Set(Object.values(U).flatMap(Object.values).map(u => (u.stamp && u.stamp.code) || 'unrecorded'))];
  return codes.length === 1 && codes[0] === landed ? `the pilot's units on the code the couples were landed on (${landed})` : `THE PILOT'S UNITS ARE NOT ALL ON THE CODE THE COUPLES WERE LANDED ON (${landed}): theirs ${codes.join(', ')}; this sizing is not the registration's`;
}
/* the second stage's chunks a couple and weight runs if it goes on (CANDC's at that weight: SHIPC has none), and APP's (run
   where either weight goes on); each couple and weight's chance of going on, pOn[id|w]: the expected core-seconds of the
   second stage */
export function stage2Expected(chunks, pOn) {
  let e = 0;
  for (const c of chunks.filter(c => c.stage === 2)) {
    if (c.arm === 'APP') { const a = pOn[`${c.id}|0.02`], b = pOn[`${c.id}|0.01`]; e += c.secs * (1 - (1 - a) * (1 - b)); }
    else e += c.secs * pOn[`${c.id}|${c.w}`];
  }
  return e;
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
  const dir = mkdtempSync(join(tmpdir(), 'd4size-')), n = 2000, b64 = (lost, len = n) => Buffer.from(Uint8Array.from({ length: len }, (_, i) => (i < lost ? 0 : 1))).toString('base64');
  // a pilot unit: N the pilot's paths, `ran` the paths the unit ran where fewer (SHIPC at a pilot of more than SHIP_N paths)
  const unit = (id, arm, w, lost, secs, ran = null) => writeFileSync(join(dir, `${id}-${arm}-w${w}.json.gz`), gzipSync(JSON.stringify({ id, arm, w, N: n, ...(ran ? { n: ran } : {}), solveSecs: secs.s, engineSecs: secs.e, secs: secs.s + secs.e + (secs.b || 0) + 1, beside: secs.b ? { N: 500, secs: secs.b } : null, main: { survived: b64(lost, ran || n) } })));
  // H1: CANDC survives every path, APP loses 180, SHIPC 40; H2 the same but APP loses 400 (a wider discordance sizes the run)
  for (const [id, a] of [['H1', 180], ['H2', 400]]) {
    unit(id, 'APP', '-', a, { s: 0, e: 1 });
    for (const w of WEIGHTS) { unit(id, 'CANDC', w, 0, { s: 600, e: 1800, b: 450 }); unit(id, 'SHIPC', w, 40, { s: 200, e: 900, b: 220 }); }
  }
  const U = unitsIn(dir), S = sizePilot(U), N = Math.max(...Object.values(S).map(s => s.N));
  // this case sized on SHIPC's two bounds as well before 11 Nov (D78: its per-couple flags dropped, so it sizes nothing)
  cases.push(['each couple sized at its two comparisons\' upper bounds, both against APP (none against SHIPC); the run at the larger', `${S.H1.N === sizeFor([clopperPearson(180, n)[1], clopperPearson(180, n)[1]]).N} ${N === S.H2.N} ${S.H2.N >= S.H1.N} ${S.H1.comps.length} ${S.H1.comps.every(c => c.cmp.startsWith('APP'))}`, 'true true true 2 true']);
  // the budget: each unit from its cohort's pilot couple, scaled by the years, a solve in each chunk, the rollout in the first;
  // SHIPC one chunk of its first SHIP_N paths (before 11 Nov: two chunks, its engine on all 16,000)
  const panelP = [{ id: 'P1', cohort: 'lib' }, { id: 'P2', cohort: 'young' }], years = { H1: 28, H2: 61, P1: 56, P2: 61 }, C = chunkSecs(U, panelP, 16000, { lib: 'H1', young: 'H2' }, years);
  const want = [2, 1].reduce((s, f) => s + 2 * (chunksOf('CANDC') * (600 * f + 1) + 0.9 * f * 16000 + 450 * f) + 2 * ((200 * f + 1) + 0.45 * f * SHIP_N + 220 * f) + (chunksOf('APP') * 1 + 0.0005 * f * 16000), 0);
  cases.push(['the budget: each unit scaled by its years from its cohort\'s pilot couple, a solve in every chunk, the rollout in the first; SHIPC one solve, its engine on its first 1,000 paths, the rollout beside', `${C.length} ${Math.abs(budgetOf(C).total - want) < 1e-6}`, `${2 * (2 * chunksOf('CANDC') + 2 * 1 + chunksOf('APP'))} true`]);
  { const sh = C.filter(c => c.arm === 'SHIPC'), p1 = sh.find(c => c.id === 'P1' && c.w === '0.02');
    cases.push(['SHIPC\'s cost: one chunk a unit, in the first stage alone; P1\'s (twice H1\'s years) a solve of 400 s, the engine 0.9 s a path on 1,000 paths, the rollout 440 s', `${sh.length} ${sh.every(c => c.stage === 1 && c.j === 0)} ${C.some(c => c.arm === 'SHIPC' && c.stage === 2)} ${p1.solve} ${Math.round(p1.engine)} ${p1.beside} ${chunksOf('SHIPC')}`, '4 true false 400 900 440 1']); }
  // a pilot of more paths than SHIPC runs: its SHIPC unit's engine time is over the 1,000 it ran, not the pilot's 2,000
  { unit('H1', 'SHIPC', '0.02', 40, { s: 200, e: 900, b: 220 }, 1000);
    const U2 = unitsIn(dir), c2 = chunkSecs(U2, panelP, 16000, { lib: 'H1', young: 'H2' }, years).find(c => c.arm === 'SHIPC' && c.id === 'P1' && c.w === '0.02');
    cases.push(['a pilot SHIPC unit that ran 1,000 of the pilot\'s 2,000 paths is timed on the 1,000 it ran: 1.8 s a path for P1, not 0.9', `${ranOf(U2.H1['SHIPC/0.02'])} ${ranOf(U2.H1['CANDC/0.02'])} ${Math.round(c2.msPath)} ${Math.round(c2.engine)}`, '1000 2000 1800 1800']);
    unit('H1', 'SHIPC', '0.02', 40, { s: 200, e: 900, b: 220 }); }
  { const all = Object.fromEntries(['P1', 'P2'].flatMap(id => WEIGHTS.map(w => [`${id}|${w}`, 1]))), none = Object.fromEntries(Object.keys(all).map(k => [k, 0])), half = { ...none, 'P1|0.02': 1 };
    const s2 = C.filter(c => c.stage === 2).reduce((a, c) => a + c.secs, 0), app = C.filter(c => c.stage === 2 && c.id === 'P1' && c.arm === 'APP').reduce((a, c) => a + c.secs, 0), p1c = C.filter(c => c.stage === 2 && c.id === 'P1' && c.w === '0.02' && c.arm === 'CANDC').reduce((a, c) => a + c.secs, 0);
    cases.push(['the second stage expected: all of it when every couple and weight goes on, none when none does, and one weight going on runs CANDC at that weight and APP (no SHIPC chunk)', `${Math.abs(stage2Expected(C, all) - s2) < 1e-6} ${stage2Expected(C, none)} ${Math.abs(stage2Expected(C, half) - (p1c + app)) < 1e-6} ${p1c > 0}`, 'true 0 true true']); }
  { const B1 = budgetOf(C.filter(c => c.stage === 1)), B2 = budgetOf(C.filter(c => c.stage === 2));
    cases.push(['the first stage by arm, SHIPC\'s part named; the second stage has none of SHIPC\'s', `${armHours(B1)} | ${Object.keys(B2.arms).join(',')}`, `CANDC ${((2 * (601 + 0.9 * 5000 + 450) + 2 * (1201 + 1.8 * 5000 + 900)) / 3600).toFixed(1)}, SHIPC ${((2 * (201 + 0.45 * 1000 + 220) + 2 * (401 + 0.9 * 1000 + 440)) / 3600).toFixed(1)}, APP ${((1 + 0.0005 * 5000 + 1 + 0.001 * 5000) / 3600).toFixed(1)} | CANDC,APP`]); }
  { const st = code => ({ stamp: { code } });
    cases.push(['the pilot\'s code against the landing\'s: the same is said; another, or a unit with none recorded, is said plainly', `${/^the pilot's units on the code the couples were landed on \(abc\)$/.test(codeLine({ H: { a: st('abc'), b: st('abc') } }, 'abc'))} ${/NOT ALL ON THE CODE .*\(abc\): theirs abd/.test(codeLine({ H: { a: st('abd') } }, 'abc'))} ${/NOT ALL ON THE CODE .*: theirs abc, unrecorded/.test(codeLine({ H: { a: st('abc'), b: {} } }, 'abc'))}`, 'true true true']); }
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
  console.log('EDGES: a couple missing a unit, the run sized by the wider couple, a unit cut off at a window\'s end, a unit longer than a window, a pilot of more paths than SHIPC runs, a pilot on another code than the landing\'s');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  const dir = process.argv[2] || join(HERE, 'results', 'd4-pilot'), U = unitsIn(dir), S = sizePilot(U);
  const missing = Object.entries(S).filter(([, s]) => s.missing);
  if (missing.length) { console.log(`size-couples: units missing: ${missing.map(([id, s]) => `${id} ${s.missing.join(',')}`).join('; ')}`); process.exit(1); }
  const N = RUN_N, n1 = Math.min(STAGE1, N), nS = Math.min(SHIP_N, N), landed = JSON.parse(readFileSync(join(HERE, 'couples-panel-d4b.json'), 'utf8')), panel = landed.panel;
  const any = Object.values(Object.values(U)[0])[0];
  console.log(`THE RE-RUN'S SIZING from its pilot (${dir.replace(/.*research\/solver\//, '')}; ${Object.keys(U).length} couples, seed ${any.seed}, ${any.N} paths a unit; ${cpus()[0].model}); the paths at D61's ${N} in item 9's two stages, the first ${n1}, the bar +${STAGE_BAR} points against APP; SHIPC on the first ${nS} paths of each unit, in one chunk, in the first stage alone (D78: reported, not deciding)`);
  console.log(`  ${codeLine(U, landed.code)}`);
  for (const [id, s] of Object.entries(S)) {
    console.log(`  ${id}: D34's one-stage size ${s.N} paths (beside; the run is at D61's ${N})`);
    // against APP alone: no comparison against SHIPC carries a threshold or rates (its per-couple flags are dropped, D78)
    for (const c of s.comps) {
      const d = Math.max(c.dUp, 0.0101), t = thresholdFor(d, N), two = D => twoStageRate(d, N, t, D, n1, STAGE_BAR), one = D => harmRate(d, N, t, D);
      console.log(`    CANDC less ${c.cmp.padEnd(10)} discordant ${c.k} of ${c.n} (${(100 * c.dHat).toFixed(2)}%, upper 95% ${(100 * c.dUp).toFixed(2)}%): the threshold at ${N} ${t.toFixed(4)} points; two stages: a quarter-point loss read as harm ${two(0.25).flag.toFixed(4)}, a 1-point loss ${two(1).flag.toFixed(4)} (one stage at ${N}: ${one(0.25).toFixed(4)}, ${one(1).toFixed(4)})`);
    }
  }
  console.log(`  the run: every couple at ${N} paths (D61), in two stages (item 9): after ${n1} paths a couple and weight whose CANDC survival is ${STAGE_BAR} points or more above APP's stops and is read as not harmed against APP; every other runs CANDC at that weight and APP to ${N} and is read by D34's rule at ${N}, its rates the exact two-stage rates above; each couple's thresholds at the read from its own realised discordance; SHIPC stops at its first ${nS} paths whatever is decided`);
  console.log(`  at ${N} paths a true 1-point loss reads as harm at least 90% of the time (one stage) up to a discordance (its upper bound) of ${(100 * tpLimit(N)).toFixed(2)}%`);
  // the two stages at the pilot's own changes against APP: how often a couple and weight stops, and the paths it uses
  const pStop = {};
  for (const [id, u] of Object.entries(U)) for (const w of WEIGHTS) {
    const c = u[`CANDC/${w}`], a = u['APP/-'], x = bits(c), y = bits(a), n = Math.min(x.length, y.length);
    let sc = 0, sa = 0, k = 0; for (let i = 0; i < n; i++) { sc += x[i]; sa += y[i]; if (x[i] !== y[i]) k++; }
    const G = (100 * (sc - sa)) / n, dd = Math.max(k / n, 0.0101), r = twoStageRate(dd, N, thresholdFor(Math.max(clopperPearson(k, n)[1], 0.0101), N), -G, n1, STAGE_BAR);
    pStop[`${id}|${w}`] = r.stop;
    console.log(`  pilot ${id} W${w}: CANDC less APP ${G >= 0 ? '+' : ''}${G.toFixed(2)} points on ${n} paths (discordant ${(100 * k / n).toFixed(2)}%): were that its true change, it stops at the first stage ${(100 * r.stop).toFixed(1)}% of the time, ${Math.round(r.paths)} paths on average`);
  }
  // the pilot couples' own times, each arm, and the horizons that scale them
  const { readPanel } = await import('./couple-panel.mjs'), E = await import('../engine.mjs'), { PANEL_FILE } = await import('./audit-couples.mjs');
  const full = readPanel(PANEL_FILE), years = Object.fromEntries(full.map(h => [h.id, E.buildContext(E.resolveMpaa(E.normalizePlan(h.plan))).totalYears + 1]));
  const pilotOf = Object.fromEntries(['lib', 'young'].map(co => [co, Object.keys(U).find(id => panel.find(h => h.id === id).cohort === co)]));
  for (const id of Object.keys(U)) console.log(`  pilot ${id} (${years[id]} years): ${Object.entries(U[id]).sort().map(([k, u]) => `${k} the solve ${Math.round(u.solveSecs)} s, the engine ${(1000 * u.engineSecs / ranOf(u)).toFixed(1)} ms a path${ranOf(u) !== u.N ? ` (on the ${ranOf(u)} paths it ran)` : ''}${u.beside ? `, beside ${Math.round(u.beside.secs)} s` : ''}`).join('; ')}`);
  { const a = U[pilotOf.young]['CANDC/0.02'], b = U[pilotOf.lib]['CANDC/0.02']; console.log(`  the younger pilot couple's candidate engine ${(a.engineSecs / ranOf(a) / (b.engineSecs / ranOf(b))).toFixed(2)} times the library one's a path (${years[pilotOf.young]} years against ${years[pilotOf.lib]}: ${(years[pilotOf.young] / years[pilotOf.lib]).toFixed(2)} times the years)`); }
  const ys = co => full.filter(h => h.cohort === co).map(h => years[h.id]);
  console.log(`  the horizons: library ${Math.min(...ys('lib'))} to ${Math.max(...ys('lib'))} years (mean ${(ys('lib').reduce((s, x) => s + x, 0) / 20).toFixed(1)}; the pilot's ${years[pilotOf.lib]}), younger ${Math.min(...ys('young'))} to ${Math.max(...ys('young'))} (the pilot's ${years[pilotOf.young]}); each unit scaled from its cohort's pilot couple by its years`);
  // the budget: the first stage whole; the second for every couple and weight (the ceiling), none (the floor), and expected at
  // each couple taking its cohort pilot couple's chance of stopping at each weight
  const C = chunkSecs(U, full, N, pilotOf, years), B1 = budgetOf(C.filter(c => c.stage === 1)), B2 = budgetOf(C.filter(c => c.stage === 2));
  const pOn = Object.fromEntries(full.flatMap(h => WEIGHTS.map(w => [`${h.id}|${w}`, 1 - pStop[`${pilotOf[h.cohort]}|${w}`]])));
  const e2 = stage2Expected(C, pOn), long = C.reduce((m, c) => (c.secs > m.secs ? c : m));
  const sch = cs => scheduleOf(cs), S1s = sch(C.filter(c => c.stage === 1)), S2s = sch(C.filter(c => c.stage === 2));
  console.log(`  the budget (D21: measured from the pilot's units on this machine, nothing else running), over ${PANEL_N} couples: the first stage ${(B1.total / 3600).toFixed(1)} core-hours (${C.filter(c => c.stage === 1).length} chunks; the solves ${(B1.solve / 3600).toFixed(1)}, the engine ${(B1.engine / 3600).toFixed(1)}, the rollout beside ${(B1.beside / 3600).toFixed(1)}; by arm ${armHours(B1)}, SHIPC's each unit's first ${nS} paths in one chunk), on four cores ${S1s.windows} windows, about ${S1s.hours.toFixed(0)} hours`);
  console.log(`    the second stage (CANDC's and APP's chunks: SHIPC has none): every couple and weight going on (the ceiling) ${(B2.total / 3600).toFixed(1)} core-hours (${C.filter(c => c.stage === 2).length} chunks, about ${S2s.hours.toFixed(0)} hours on four cores); none (the floor) 0; expected at the pilot couples' own changes against APP ${(e2 / 3600).toFixed(1)}`);
  console.log(`    in all: from ${(B1.total / 3600).toFixed(1)} to ${((B1.total + B2.total) / 3600).toFixed(1)} core-hours, expected ${((B1.total + e2) / 3600).toFixed(1)}; the longest chunk ${(long.secs / 3600).toFixed(2)} hours (${long.id} ${long.arm}/${long.w} chunk ${long.j}), at a fifth slower ${(1.2 * long.secs / 3600).toFixed(2)}, inside the 12-hour limit`);
  // the pooled items' se from the pilot's, scaled to the run's 40 couples (their paths moving independently, or together): A1
  // (deciding) on the first stage's paths; S1 (reported, not deciding: D78) on SHIPC's own
  { const R = await import('./reduce-couples.mjs'), PU = R.loadDir(dir), pp = panel.filter(h => PU[h.id]);
    for (const w of ['0.02', '0.01']) { const it = R.itemsAt(PU, pp, w), over = (se, n0, n) => `${(se * Math.sqrt(n0 / n) / Math.sqrt(40 / pp.length)).toFixed(3)} to ${(se * Math.sqrt(n0 / n)).toFixed(3)}`; console.log(`  W${w} the pilot's se (${pp.length} couples; A1 and A2 on ${it.n} paths, S1 on ${it.nS}): A1 ${it.A1.se.toFixed(4)} points, A2 ${it.A2.se.toFixed(4)}%, S1 ${it.S1.se.toFixed(4)} points; over 40 couples, A1's on the first stage's ${n1} paths from ${over(it.A1.se, it.n, n1)} (its bar: the lower end above 0); S1's on SHIPC's ${nS} paths from ${over(it.S1.se, it.nS, nS)} (reported, not deciding: logged in the register where its interval lies wholly below ${R.S1_NOTE} points)`); } }
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), N, n1, bar: STAGE_BAR, shipN: SHIP_N, rule: `every couple at N in two stages: after n1 paths a couple and weight whose CANDC survival is bar points or more above APP's stops (read as not harmed against APP); every other runs CANDC at that weight and APP to N; thresholds at the read from each couple's realised discordance (Clopper-Pearson upper 95%) by size-phase4.mjs thresholdFor, at N against APP (the exact two-stage rates); SHIPC on the first shipN paths of each unit, in one chunk, reported, with no threshold`, paths: Object.fromEntries(panel.map(h => [h.id, N])) }, null, 1) + '\n');
  console.log(`  written: couples-paths-d4b.json (${panel.length} couples at ${N}, the first stage ${n1}, SHIPC's paths ${SHIP_N})`);
}
