/*
 * STEP 8, THE READ (STEP8.md; registrations/household-hsp.md, DRAFT; D129 (3); read once, by its rule).
 * The stamps first (fair-gate.mjs requireFairLogs: every log stamped by the launcher under the registration, its git blob the
 * registration's now), then the gate: every unit of household-hsp-panel.json there with its three arms (APP, K2, HSP); one
 * code, audit, seed, prediction, estate weight, points and Node version; each unit at the registration's paths
 * (household-hsp-paths.json), every array one a path; each unit at the panel's target, arm A's pick the landing's, the app's
 * guard on, each arm at its configuration (audit-household-hsp.mjs configOf), HSP's k the pensions' split's.
 * Then the rule, HSP against K2 over the units:
 *   1. NO HARM: no unit flagged by D34's harm rule (reduce-couples.mjs harmOf: the loss over the unit's paths against the
 *      threshold its realised discordance sets), the loss and the threshold compared in whole paths (reduce-share-rules.mjs
 *      harmExact);
 *   2. A GAIN: the pooled survival change (stats.mjs survivalChange on the units' cells summed) with its 95% interval's lower
 *      end above nought;
 *   3. SPENDING: pooled spending delivered on the paths both keep (reduce-household.mjs spendOn) not lower than K2's by more
 *      than 0.05%.
 * PASS if all three hold, else FAIL with the parts that fail. The pot's ruling (D116, M1) is in the rule as given: a smaller
 * pot left is not a harm where HSP keeps more paths and delivers no less spending; the pot is recorded, capped at the two
 * people's estate caps and in pounds a path, and is not a bar. M1 is read unit by unit as well (the remedy's reviewer,
 * MINOR 3): each unit's spending on the paths both keep and its capped pot are printed, and a unit where HSP keeps more paths
 * but spends less on the paths both keep beyond noise is named with its pot, M1's condition not met there; not a bar. Beside, deciding nothing: HSP and K2 against APP (pooled and by
 * unit, D34's flags against APP for investigation, D34 (3)); a comparison whose 1-point rate at its realised discordance falls
 * below 0.90 named with its rate (D34 (4)); the pot; lifetime tax; each table's forecast against its survival; the rollout
 * beside the engine on K2's first paths; the times.
 *   node research/solver/reduce-household-hsp.mjs [dir] > research/solver/results-household-hsp.txt     the registered read
 *   node research/solver/reduce-household-hsp.mjs --pilot [dir]                                          the pilot's gate, no outcome
 *   node research/solver/reduce-household-hsp.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange } from './stats.mjs';
import { harmExact } from './reduce-share-rules.mjs';
import { cells, spendOn } from './reduce-household.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { ARMS, KEYS, SEED, PILOT_SEED, PTS, W, REGISTRATION, PATHS_FILE, configOf, stampFilesHash, pilotUnits } from './audit-household-hsp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const POOL_BAR = 0, SPEND_BAR = -0.05, TP_BAR = 0.9;
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])) });
export function loadDir(dir) {
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).map(x => { const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
}
/* the gate: refusals, each a line. `want` the panel's units (id, target, label, cohort, variant); `paths` id -> N, or null */
export function gate(units, want, { seed, prediction = null, audit = null, paths = null, code = null, logs = null, pts = PTS } = {}) {
  const P = [], byId = Object.fromEntries(units.map(u => [u.id, u]));
  for (const w of want) if (!byId[w.id]) P.push(`${w.id}: missing`);
  for (const u of units) if (!want.some(w => w.id === u.id)) P.push(`${u.id}: not a unit of the panel`);
  if (logs !== null && logs !== units.length) P.push(`${logs} launch logs for ${units.length} units`);
  const one = (what, g) => { const vs = [...new Set(units.map(g))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('prediction', u => u.stamp.prediction); one('Node version', u => u.stamp.node); one('seed', u => u.seed); one('estate weight', u => u.W); one('points', u => u.pts);
  if (units.some(u => u.seed !== seed)) P.push(`a unit is not on seed ${seed}`);
  if (units.some(u => u.W !== W)) P.push(`a unit is not at estate weight ${W}`);
  if (units.some(u => u.pts !== pts)) P.push(`a unit is not at ${pts} points`);
  if (prediction && units.some(u => u.stamp.prediction !== prediction)) P.push(`a unit was not run under ${prediction}`);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (code && units.some(u => u.stamp.code !== code)) P.push(`a unit's code is not the code the panel was landed on (${code})`);
  for (const u of units) {
    const w = want.find(x => x.id === u.id); if (!w) continue;
    const N = paths ? paths[u.id] : u.N;
    if (!(N > 0)) P.push(`${u.id}: no paths for it`);
    if (u.N !== N) P.push(`${u.id}: ${u.N} paths, not ${N}`);
    if (u.target !== w.target) P.push(`${u.id}: target ${u.target}, not the panel's ${w.target}`);
    if (u.label !== w.label) P.push(`${u.id}: arm A's pick ${u.label}, not the landing's ${w.label}`);
    if (!u.guard || !u.guard.on) P.push(`${u.id}: the app's guard off (${u.guard && u.guard.why})`);
    if (!(u.split && u.split.s >= 0.5 - 1e-12 && u.split.s <= 1 + 1e-12 && Math.abs(u.split.k - 1 / u.split.s) < 1e-12)) P.push(`${u.id}: HSP's k ${u.split && u.split.k}, not 1 / s for s in 0.5 to 1`);
    for (const arm of ARMS) {
      const A = u.arms[arm];
      if (!A) { P.push(`${u.id} ${arm}: missing`); continue; }
      if (A.config !== configOf(arm)) P.push(`${u.id} ${arm}: configuration ${A.config}, not ${configOf(arm)}`);
      for (const k of Object.keys(KEYS)) if (!A[k] || A[k].length !== u.N) P.push(`${u.id} ${arm}: ${k} not one a path`);
    }
  }
  return P;
}
/* HSP against a base over the units: each unit's harm (D34, in whole paths) and change, the pooled change and spending */
export function compare(units, base, arm = 'HSP') {
  const rows = units.map(u => { const c = cells(u.arms[base], u.arms[arm]); return { id: u.id, cohort: u.cohort, variant: u.variant, k: u.split.k, cells: c, ch: survivalChange(c.lost, c.saved, c.N), ...harmExact(u.arms[arm], u.arms[base], u.N) }; });
  const pooled = survivalChange(sum(rows.map(r => r.cells.lost)), sum(rows.map(r => r.cells.saved)), sum(rows.map(r => r.cells.N)));
  return { base, arm, rows, pooled, kept: spendOn(units.map(u => [u.arms[base], u.arms[arm]]), true) };
}
/* the rule (STEP8.md), HSP against K2 */
/* M1 by unit: HSP against K2, the units that keep more paths but spend less on the paths both keep beyond noise */
export function m1ByUnit(units) {
  return units.map(u => {
    const c = cells(u.arms.K2, u.arms.HSP), sp = spendOn([[u.arms.K2, u.arms.HSP]], true).by[0], cap = cappedOf(u.caps[0] + u.caps[1], u.arms.K2, u.arms.HSP);
    return { id: u.id, net: c.saved - c.lost, spend: sp, cap, unmet: c.saved - c.lost > 0 && sp.hi < 0 };
  });
}
export function rule(units) {
  const C = compare(units, 'K2'), flagged = C.rows.filter(r => r.flag);
  const parts = { harm: flagged.length === 0, gain: C.pooled.lo > POOL_BAR, spend: C.kept.pooled.d >= SPEND_BAR };
  return { C, flagged, parts, outcome: parts.harm && parts.gain && parts.spend ? 'PASS' : 'FAIL' };
}
const mean = a => sum(a) / a.length, median = a => { const s = [...a].sort((p, q) => p - q), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
function cappedOf(cap, b, x) { let sb = 0, sx = 0; for (let i = 0; i < b.pot.length; i++) { sb += Math.min(b.pot[i], cap); sx += Math.min(x.pot[i], cap); } return { pct: sb > 0 ? 100 * (sx / sb - 1) : 0, gbp: (sx - sb) / b.pot.length }; }

function planted() {
  const cases = [], arr = (n, f) => { const a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = f(i) ? 1 : 0; return a; };
  const unit = (id, sK2, sHSP, o = {}) => {
    const n = 4000, fl = (x, i) => Float64Array.from({ length: n }, () => x);
    const A = s => ({ config: '', survived: arr(n, s), failYear: new Int16Array(n), pot: fl(100), estate: fl(100), tax: fl(1), delivered: fl(o.spend || 1000), unmet: fl(0) });
    const K = A(sK2), H = A(sHSP); H.delivered = Float64Array.from({ length: n }, () => (o.spendH || 1000));
    return { id, cohort: 'lib', variant: 'own', N: n, split: { s: 0.6, k: 1 / 0.6 }, caps: [1e9, 1e9], arms: { APP: A(sK2), K2: K, HSP: H } };
  };
  // HSP keeps more on every unit: PASS; a unit losing 2% of paths: flagged, FAIL; no pooled gain: FAIL; spending lower: FAIL
  const gainU = id => unit(id, i => i % 10 !== 0, i => i % 20 !== 0);
  { const R = rule([gainU('a'), gainU('b')]);
    cases.push(['HSP saving 5% of paths on each unit: no flag, a gain, spending held: PASS', `${R.outcome} ${R.parts.harm} ${R.parts.gain} ${R.parts.spend}`, 'PASS true true true']); }
  { const R = rule([gainU('a'), unit('b', i => i % 10 !== 0, i => i % 10 !== 0 && i % 50 !== 1)]);
    cases.push(['a unit losing 2% of its paths under HSP: flagged, FAIL', `${R.outcome} ${R.flagged.map(r => r.id).join(',')}`, 'FAIL b']); }
  { const R = rule([unit('a', i => i % 10 !== 0, i => i % 10 !== 0), unit('b', i => i % 10 !== 0, i => i % 10 !== 0)]);
    cases.push(['HSP the same as K2 on every path: no gain, FAIL', `${R.outcome} ${R.parts.gain}`, 'FAIL false']); }
  { const g = id => { const u = gainU(id); u.arms.HSP.delivered = Float64Array.from({ length: u.N }, () => 999); return u; }, R = rule([g('a'), g('b')]);
    cases.push(['HSP spending 0.1% less on the paths both keep: FAIL on spending alone', `${R.outcome} ${R.parts.harm} ${R.parts.gain} ${R.parts.spend}`, 'FAIL true true false']); }
  // the bar either side by one path, through the rule's own wiring (the remedy's reviewer, MINOR 1): K2 keeps every path of
  // unit b and HSP loses its first m; m found as the first loss D34 flags at b's own discordance; a unit that gains carries the
  // pooled part
  { const lose = m => unit('b', () => true, i => i >= m), big = unit('a', i => i % 10 !== 0, () => true);
    let m = 1; while (m < 400 && !harmExact(lose(m).arms.HSP, lose(m).arms.K2, 4000).flag) m++;
    const below = rule([big, lose(m - 1)]), over = rule([big, lose(m)]);
    cases.push([`a unit one path under its D34 bar (net loss ${m - 1}) is not flagged, one path over (${m}) is, the rest of the rule the same`, `${below.parts.harm} ${over.parts.harm} ${below.parts.gain && over.parts.gain} ${below.outcome} ${over.outcome}`, 'true false true PASS FAIL']); }
  // M1 by unit: more paths kept but less spent on the paths both keep is named; more paths and no less spent is not
  { const keepsLessSpend = (() => { const u = gainU('a'); u.arms.HSP.delivered = Float64Array.from({ length: u.N }, (_, i) => 990 + (i % 3)); return u; })();
    const M = m1ByUnit([keepsLessSpend, gainU('b')]);
    cases.push(['M1 by unit: a unit keeping more paths but spending less beyond noise is named, one spending no less is not', M.filter(x => x.unmet).map(x => x.id).join(','), 'a']); }
  // the gate on built units
  { const want = [{ id: 'a', target: 1, label: 'x' }, { id: 'b', target: 1, label: 'x' }];
    const mk = id => { const u = gainU(id); return { ...u, target: 1, label: 'x', seed: 9, W, pts: PTS, guard: { on: true }, stamp: { code: 'c', audit: 'a', prediction: 'p', node: 'n' }, arms: Object.fromEntries(ARMS.map(x => [x, { ...u.arms[x], config: configOf(x) }])) }; };
    const G = (mod, o = {}) => { const us = [mk('a'), mk('b')]; if (mod) mod(us); return gate(us, want, { seed: 9, ...o }); };
    cases.push(['the gate: the built units fair', String(G().length), '0']);
    const faults = [
      ['a unit missing', us => us.pop(), {}, /b: missing/],
      ['an arm missing', us => { delete us[0].arms.HSP; }, {}, /a HSP: missing/],
      ['another seed', us => { us[1].seed = 8; }, {}, /seed/],
      ['another code', us => { us[1].stamp = { ...us[1].stamp, code: 'd' }; }, {}, /more than one code/],
      ['another audit', us => { us[1].stamp = { ...us[1].stamp, audit: 'z' }; }, {}, /more than one audit/],
      ['another estate weight', us => { us[1].W = 0.01; }, {}, /estate weight/],
      ['another count of points', us => { us[1].pts = 30; }, {}, /points/],
      ['the guard off', us => { us[0].guard = { on: false, why: 'gapincome' }; }, {}, /guard off/],
      ["HSP's k not 1 / s", us => { us[0].split = { s: 0.6, k: 2 }; }, {}, /HSP's k 2/],
      ['a pensions\' share below a half', us => { us[0].split = { s: 0.4, k: 2.5 }; }, {}, /HSP's k 2.5/],
      ['another configuration', us => { us[0].arms.K2.config = 'z'; }, {}, /K2: configuration z/],
      ['an array not one a path', us => { us[0].arms.APP.tax = new Float64Array(3); }, {}, /APP: tax not one a path/],
      ['another target', us => { us[0].target = 2; }, {}, /target 2/],
      ["another of arm A's picks", us => { us[0].label = 'y'; }, {}, /arm A's pick y/],
      ['the registration\'s paths not run', null, { paths: { a: 5, b: 5 } }, /4000 paths, not 5/],
      ['a unit with no registered paths', null, { paths: { a: 4000 } }, /b: no paths for it/],
      ['run under another prediction', null, { prediction: 'r' }, /not run under r/],
      ["a code not the panel's", null, { code: 'k' }, /not the code the panel was landed on/],
      ['a launch log short of the units', null, { logs: 1 }, /1 launch logs for 2 units/]
    ];
    const missed = faults.filter(([, mod, o, re]) => !G(mod, o).some(x => re.test(x))).map(([n]) => n);
    cases.push([`the gate: every refusal on its planted fault (${faults.length})`, missed.join(', ') || 'all fire', 'all fire']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const PILOT = args.includes('--pilot'), dirArg = args.find(a => !a.startsWith('--'));
  const DIR = dirArg || join(HERE, 'results', PILOT ? 'household-hsp-pilot' : 'household-hsp-run');
  if (!existsSync(DIR)) { console.error(`reduce-household-hsp: no ${DIR}`); process.exit(2); }
  const { readHspPanel, PANEL } = await import('./household-hsp-panel.mjs');
  const panel = readHspPanel(), want = PILOT ? pilotUnits(panel) : panel;
  const logs = readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x));
  if (!PILOT) requireFairLogs(Object.fromEntries(logs.map(x => [x, readFileSync(join(DIR, x), 'utf8')])), REGISTRATION);
  const units = loadDir(DIR), paths = PILOT ? null : JSON.parse(readFileSync(PATHS_FILE, 'utf8')).paths;
  const P = gate(units, want, { seed: PILOT ? PILOT_SEED : SEED, prediction: PILOT ? null : REGISTRATION, audit: stampFilesHash(), paths, code: JSON.parse(readFileSync(PANEL, 'utf8')).code, logs: logs.length });
  console.log(`STEP 8${PILOT ? ', THE PILOT (EXPLORATORY)' : ''}: THE READ (STEP8.md; ${PILOT ? 'no outcome' : REGISTRATION}): ${units.length} units from ${DIR}`);
  if (P.length) { console.log(`THE GATE: REFUSED\n  ${P.join('\n  ')}`); process.exit(3); }
  console.log(`THE GATE: fair; one code ${units[0].stamp.code}, audit ${units[0].stamp.audit}, seed ${units[0].seed}, ${units[0].pts} points; every unit's three arms at their configurations, the guard on, at its registered paths`);
  if (PILOT) process.exit(0);
  const R = rule(units), C = R.C;
  console.log('\nTHE RULE, HSP against K2 (paired by path):');
  console.log(`  1. no unit flagged by D34's harm rule: ${R.flagged.length ? R.flagged.map(r => `${r.id} (${r.lost - r.saved} paths net against a threshold of ${r.j})`).join('; ') : 'none'}: ${R.parts.harm ? 'HOLDS' : 'FAILS'}`);
  console.log(`  2. pooled survival ${iv(C.pooled)} over ${units.length} units, its lower end above 0: ${R.parts.gain ? 'HOLDS' : 'FAILS'}`);
  console.log(`  3. pooled spending on the paths both keep ${iv(C.kept.pooled, f4)}% of K2's, not lower by more than 0.05%: ${R.parts.spend ? 'HOLDS' : 'FAILS'}`);
  console.log(`OUTCOME: ${R.outcome}${R.outcome === 'PASS' ? ': HSP becomes the couples\' default, in the commit of the D-line naming this run, with the reviewer on the change of default (STEP8.md)' : ': today\'s default stays; to the maintainer'}`);
  console.log('\nBESIDE THE RULE, deciding nothing:');
  const low = C.rows.filter(r => r.tp < TP_BAR);
  console.log(`  comparisons whose 1-point rate at their realised discordance falls below ${TP_BAR} (D34 (4)): ${low.length ? low.map(r => `${r.id} ${r.tp.toFixed(3)}`).join(', ') : 'none'}`);
  for (const base of ['APP']) for (const arm of ['HSP', 'K2']) {
    const X = compare(units, base, arm), fl = X.rows.filter(r => r.flag);
    console.log(`  ${arm} against ${base}: pooled survival ${iv(X.pooled)}; spending on the paths both keep ${iv(X.kept.pooled, f4)}%; flagged by D34 (for investigation, D34 (3)): ${fl.length ? fl.map(r => r.id).join(', ') : 'none'}`);
  }
  const capOf = u => u.caps[0] + u.caps[1], cap = units.map(u => cappedOf(capOf(u), u.arms.K2, u.arms.HSP));
  console.log(`  the pot capped at the two people's estate caps, HSP against K2: ${f3(mean(cap.map(c => c.pct)))}% the mean of the units' (${gbp(mean(cap.map(c => c.gbp)))} a path); the pot left, the mean a unit: APP ${gbp(mean(units.map(u => mean(u.arms.APP.pot))))}, K2 ${gbp(mean(units.map(u => mean(u.arms.K2.pot))))}, HSP ${gbp(mean(units.map(u => mean(u.arms.HSP.pot))))}`);
  const m1 = m1ByUnit(units), unmetM1 = m1.filter(x => x.unmet);
  console.log(`  M1 by unit (D116): the units where HSP keeps more paths but spends less on the paths both keep beyond noise: ${unmetM1.length ? unmetM1.map(x => `${x.id} (net ${x.net >= 0 ? '+' : ''}${x.net} paths, spending ${f4(x.spend.d)}% se ${x.spend.se.toFixed(4)}, the capped pot ${f3(x.cap.pct)}% ${gbp(x.cap.gbp)} a path)`).join('; ') : 'none'}`);
  console.log(`  lifetime tax, the mean a unit: APP ${gbp(mean(units.map(u => mean(u.arms.APP.tax))))}, K2 ${gbp(mean(units.map(u => mean(u.arms.K2.tax))))}, HSP ${gbp(mean(units.map(u => mean(u.arms.HSP.tax))))}`);
  console.log(`  the rollout beside the engine on K2's first paths: ${sum(units.map(u => u.beside.engineOnly + u.beside.modelOnly))} paths differ of ${sum(units.map(u => u.beside.N))}`);
  console.log('  by unit (k; survival APP / K2 / HSP; HSP less K2; D34 against K2: net loss in paths and threshold; spending on the paths both keep and the capped pot, HSP against K2; the forecasts K2 / HSP):');
  const sv = A => 100 * sum(A.survived) / A.survived.length;
  for (const u of units) {
    const r = C.rows.find(x => x.id === u.id);
    const x = m1.find(y => y.id === u.id);
    console.log(`    ${u.id.padEnd(13)} k ${u.split.k.toFixed(3)}; ${sv(u.arms.APP).toFixed(2)}% / ${sv(u.arms.K2).toFixed(2)}% / ${sv(u.arms.HSP).toFixed(2)}%; ${iv(r.ch)} (${r.cells.saved} saved, ${r.cells.lost} lost); net ${r.lost - r.saved} against ${r.j}${r.flag ? ' FLAGGED' : ''}; spending ${f4(x.spend.d)}% (se ${x.spend.se.toFixed(4)}), the capped pot ${f3(x.cap.pct)}%; ${(100 * u.arms.K2.forecast).toFixed(2)}% / ${(100 * u.arms.HSP.forecast).toFixed(2)}%`);
  }
  console.log(`  the time a path (CPU, the mean a unit): APP ${(mean(units.map(u => u.arms.APP.cpuUs / u.N)) / 1e3).toFixed(1)} ms, K2 ${(mean(units.map(u => u.arms.K2.cpuUs / u.N)) / 1e3).toFixed(1)} ms, HSP ${(mean(units.map(u => u.arms.HSP.cpuUs / u.N)) / 1e3).toFixed(1)} ms; the solve, the median a unit: K2 ${median(units.map(u => u.arms.K2.solveSecs)).toFixed(0)} s, HSP ${median(units.map(u => u.arms.HSP.solveSecs)).toFixed(0)} s`);
}
