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
 *   - The budget (D21): each arm's unit in core-seconds from the pilot's own units on this machine (the solve as timed; the
 *     engine at the pilot's milliseconds a path times the run's paths; the rollout beside the engine as timed, on the same 500
 *     paths; arm A's pick and the rest as timed), averaged over the pilot couples and times forty.
 *   node research/solver/size-couples.mjs [pilot dir] > research/solver/results-couples-sizing.txt   (writes couples-paths.json)
 *   node research/solver/size-couples.mjs --planted
 */
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { tmpdir, cpus } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sizeFor, normalCheck, thresholdFor, harmRate } from './size-phase4.mjs';
import { clopperPearson } from './stats.mjs';

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
/* the run's core-seconds from the pilot's units at N paths a unit */
export function budgetOf(U, N, nCouples = PANEL_N) {
  const per = {}, ids = Object.keys(U);
  for (const id of ids) for (const [k, u] of Object.entries(U[id])) {
    const ms = u.engineSecs / u.N, beside = u.beside ? u.beside.secs : 0, rest = Math.max(0, u.secs - u.solveSecs - u.engineSecs - beside);
    (per[k] ||= []).push({ solve: u.solveSecs, engine: ms * N, beside, rest, msPath: 1000 * ms });
  }
  const B = { arms: {}, total: 0, solve: 0, engine: 0, beside: 0 };
  for (const [k, rows] of Object.entries(per)) {
    const avg = f => rows.reduce((s, r) => s + r[f], 0) / rows.length, unit = avg('solve') + avg('engine') + avg('beside') + avg('rest');
    B.arms[k] = { unit, msPath: avg('msPath'), solve: avg('solve') };
    B.total += unit * nCouples; B.solve += avg('solve') * nCouples; B.engine += avg('engine') * nCouples; B.beside += avg('beside') * nCouples;
  }
  return B;
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
  const B = budgetOf(U, 16000, 40);
  const want = 40 * (2 * (600 + 0.9 * 16000 + 450 + 1) + 2 * (200 + 0.45 * 16000 + 220 + 1) + (0.0005 * 16000 + 1));
  cases.push(['the budget: each arm\'s unit scaled to the run\'s paths, times forty', `${Math.abs(B.total - want) < 1e-6}`, 'true']);
  writeFileSync(join(dir, 'H3-APP-w-.json.gz'), gzipSync(JSON.stringify({ id: 'H3', arm: 'APP', w: '-', N: n, solveSecs: 0, engineSecs: 1, secs: 2, main: { survived: b64(0) } })));
  const S3 = sizePilot(unitsIn(dir));
  cases.push(['a pilot couple missing a unit is named, not sized', `${(S3.H3.missing || []).length}`, '4']);
  rmSync(dir, { recursive: true, force: true });
  let bad = 0;
  for (const [nm, got, w] of cases) { const ok = got === w; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${w})`}`); }
  console.log('EDGES: a couple missing a unit, the run sized by the wider couple, the budget at the run\'s paths');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  const dir = process.argv[2] || join(HERE, 'results', 'd4-pilot'), U = unitsIn(dir), S = sizePilot(U);
  const missing = Object.entries(S).filter(([, s]) => s.missing);
  if (missing.length) { console.log(`size-couples: units missing: ${missing.map(([id, s]) => `${id} ${s.missing.join(',')}`).join('; ')}`); process.exit(1); }
  const N = Math.max(...Object.values(S).map(s => s.N)), panel = JSON.parse(readFileSync(join(HERE, 'couples-panel.json'), 'utf8')).panel;
  console.log(`D4's sizing from the pilot (${dir.replace(/.*research\/solver\//, '')}; ${Object.keys(U).length} couples, seed ${Object.values(Object.values(U)[0])[0].seed}, ${Object.values(Object.values(U)[0])[0].N} paths a unit; ${cpus()[0].model})`);
  for (const [id, s] of Object.entries(S)) {
    console.log(`  ${id}: sized at ${s.N} paths`);
    for (const [i, c] of s.comps.entries()) { const r = s.rows[i], nc = normalCheck(r.d, s.N); console.log(`    CANDC less ${c.cmp.padEnd(10)} discordant ${c.k} of ${c.n} (${(100 * c.dHat).toFixed(2)}%, upper 95% ${(100 * c.dUp).toFixed(2)}%): threshold ${r.t.toFixed(4)} points at ${s.N}, false alarm at a quarter-point loss ${r.fp.toFixed(4)}, a 1-point loss read ${r.tp.toFixed(4)}; the normal check's threshold ${nc.t.toFixed(4)}, paths ${nc.nNeeded}`); }
  }
  console.log(`  the run: every couple at ${N} paths (the larger of the pilot couples'); each couple's thresholds at the read from its own realised discordance at ${N}, by the same exact rates`);
  const B = budgetOf(U, N);
  for (const [k, a] of Object.entries(B.arms).sort()) console.log(`  ${k.padEnd(11)} a unit ${(a.unit / 3600).toFixed(2)} core-hours (the solve ${Math.round(a.solve)} s, the engine ${a.msPath.toFixed(1)} ms a path)`);
  console.log(`  the budget at ${N} paths over ${PANEL_N} couples: ${(B.total / 3600).toFixed(1)} core-hours, about ${(B.total / 3600 / 4).toFixed(1)} hours on four cores (the solves ${(B.solve / 3600).toFixed(1)}, the engine ${(B.engine / 3600).toFixed(1)}, the rollout beside it ${(B.beside / 3600).toFixed(1)})`);
  for (const n of [4000, 8000, 16000]) {
    const b = budgetOf(U, n);
    // D34's rates at this size, each pilot comparison at its upper bound: the threshold, and how often a true 1-point loss reads as harm
    const rates = Object.entries(S).flatMap(([id, s]) => s.comps.map(c => { const d = Math.max(c.dUp, 0.0101), th = thresholdFor(d, n); return `${id} ${c.cmp} ${harmRate(d, n, th, 1).toFixed(2)}`; }));
    console.log(`    at ${n} paths a unit: ${(b.total / 3600).toFixed(1)} core-hours, about ${(b.total / 3600 / 4).toFixed(1)} hours on four cores; a true 1-point loss read as harm: ${rates.join(', ')}`);
  }
  writeFileSync(PATHS_FILE, JSON.stringify({ built: new Date().toISOString(), N, rule: 'every couple at N; thresholds at the read from each couple\'s realised discordance (Clopper-Pearson upper 95%) by size-phase4.mjs thresholdFor', paths: Object.fromEntries(panel.map(h => [h.id, N])) }, null, 1) + '\n');
  console.log(`  written: couples-paths.json (${panel.length} couples at ${N})`);
}
