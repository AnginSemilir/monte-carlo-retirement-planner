/*
 * THE SAVINGS SPLIT'S v2, THE READ (SAVE-V2.md; registrations/save-v2.md; D130 (7), D133; read once, by its rule).
 * The stamps first (fair-gate.mjs requireFairLogs: every log stamped by the launcher under the registration, its git blob the
 * registration's now), then the gate: every household of save-v2-panel.json there with its four arms (CANDD, CANDS on the
 * whole menu; CANDDA, CANDSA on anchors, beside); one code, audit, seed, prediction, estate weight, points and Node version;
 * each household at the registration's paths (save-v2-paths.json), its whole-menu arms on all of them and its anchors arms on
 * the first ANCHORS_N, every array one a path; each household at the panel's target, arm A's pick the landing's; each arm at
 * its configuration (audit-save-v2.mjs configOf), its settings line the candidate's on its menu (settingsProblems), the split
 * on where the arm says so, the candidate's tie-break above the estate cap; the household's arms on one plan, one horizon and
 * the same working years with a save to choose, at least one (sameProblems); each household's own launch log with its done
 * line.
 * Then the rule, CANDS against CANDD on the whole menu, over the households, paired on their paths (D133):
 *   1. NO HARM: no household flagged by D34's harm rule (reduce-couples.mjs harmOf: the loss over its paths against the
 *      threshold its realised discordance sets), the loss and the threshold compared in whole paths (reduce-share-rules.mjs
 *      harmExact);
 *   2. A GAIN: the pooled survival change, its 95% interval by path (reduce-phase4.mjs survivalItem: each path's change
 *      averaged over the households, every household running the same paths), its lower end above nought;
 *   3. SPENDING: no household whose lifetime spending delivered, over all its paths, is lower beyond noise (a seeded
 *      sign-flip test of the mean, reduce-gainbucket.mjs flipTest as b7-verdict.mjs seeds it, Holm over the households at 5%)
 *      by more than 0.1% of CANDD's (D133 (4)); and the pooled change (reduce-phase4.mjs spendingItem: each household in percent
 *      of its own CANDD mean, the households weighted equally) with its point estimate not below -0.05%.
 * PASS if all three hold, else FAIL with the parts that fail. Under a PASS, any household flagged by D34's rule on anchors
 * (CANDSA against CANDDA, on its first ANCHORS_N paths) is named in the outcome and goes to the maintainer before any change
 * of default (D133 (3)). Beside, deciding nothing: the pair on anchors (D34's flags, pooled survival, spending); each arm on
 * anchors against itself on the whole menu, on the same first paths; a comparison whose 1-point rate at its realised
 * discordance falls below 0.90 named with its rate (D34 (4)); spending on the paths both keep; the pot left and lifetime tax;
 * by household, the saves CANDS's moves take in the working years and their tier pairs, and the pots at the top of the first
 * retired year (runPolicy beside the engine); the rollout beside the engine; the times.
 *   node research/solver/reduce-save-v2.mjs [dir] > research/solver/results-save-v2.txt     the registered read
 *   node research/solver/reduce-save-v2.mjs --pilot [dir]                                   the pilot's gate, no outcome
 *   node research/solver/reduce-save-v2.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange, holm } from './stats.mjs';
import { survivalItem, spendingItem } from './reduce-phase4.mjs';
import { harmExact } from './reduce-share-rules.mjs';
import { cells, spendOn } from './reduce-household.mjs';
import { flipTest } from './reduce-gainbucket.mjs';
import { seedOf, spendDiffs } from './b7-verdict.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { ALL_ARMS, KEYS, SEED, PILOT_SEED, PTS, W, ANCHORS_N, REGISTRATION, PATHS_FILE, configOf, stampFilesHash, pilotUnits, settingsProblems, sameProblems, nOf, isSplit, onAnchors } from './audit-save-v2.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const POOL_BAR = 0, HH_SPEND_BAR = -0.1, POOL_SPEND_BAR = -0.05, LEVEL = 0.05, TP_BAR = 0.9;
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const mean = a => sum(a) / a.length, median = a => { const s = [...a].sort((p, q) => p - q), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])), level: typeof x.level === 'string' ? dec(x.level, Uint8Array) : x.level || null });
export function loadDir(dir) {
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).map(x => { const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()); for (const a of ALL_ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
}
/* an arm's first n paths, every array cut to them (an arm on anchors against the same arm on the whole menu) */
export const head = (A, n) => ({ ...A, ...Object.fromEntries(Object.keys(KEYS).map(k => [k, A[k].subarray(0, n)])) });

/* the gate: refusals, each a line. `want` the panel's households (id, target, label); `paths` id -> N, or null; `logs` the
   launch logs (file -> text), or null */
export function gate(units, want, { seed, prediction = null, audit = null, paths = null, code = null, logs = null, pts = PTS } = {}) {
  const P = [], byId = Object.fromEntries(units.map(u => [u.id, u]));
  for (const w of want) if (!byId[w.id]) P.push(`${w.id}: missing`);
  for (const u of units) if (!want.some(w => w.id === u.id)) P.push(`${u.id}: not a household of the panel`);
  if (logs !== null) {
    const texts = Object.values(logs);
    if (texts.length !== units.length) P.push(`${texts.length} launch logs for ${units.length} units`);
    for (const u of units) { const own = texts.filter(t => new RegExp(`unit ${u.k}/\\d+: ${u.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} `).test(t)); if (own.length !== 1 || !new RegExp(`^ +done unit ${u.k} secs `, 'm').test(own[0])) P.push(`${u.id}: ${own.length} launch logs name it${own.length === 1 ? ', without its done line' : ''}`); }
  }
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
    if (u.nAnchors !== nOf('CANDDA', u.N)) P.push(`${u.id}: ${u.nAnchors} paths on anchors, not ${nOf('CANDDA', u.N)}`);
    if (u.target !== w.target) P.push(`${u.id}: target ${u.target}, not the panel's ${w.target}`);
    if (u.label !== w.label) P.push(`${u.id}: arm A's pick ${u.label}, not the landing's ${w.label}`);
    const seen = {};
    for (const arm of ALL_ARMS) {
      const A = u.arms[arm];
      if (!A) { P.push(`${u.id} ${arm}: missing`); continue; }
      if (A.config !== configOf(arm)) P.push(`${u.id} ${arm}: configuration ${A.config}, not ${configOf(arm)}`);
      for (const k of Object.keys(KEYS)) if (!A[k] || A[k].length !== nOf(arm, u.N)) P.push(`${u.id} ${arm}: ${k} not one a path`);
      if ((A.saveSplit === 'on') !== isSplit(arm)) P.push(`${u.id} ${arm}: saveSplit ${A.saveSplit}`);
      if (!onAnchors(arm) && A.menu !== 'whole') P.push(`${u.id} ${arm}: on the menu ${A.menu}, not the whole menu`);
      const safe = f => { try { return f(); } catch (e) { return [`its settings line unreadable (${e.message})`]; } };
      for (const q of safe(() => settingsProblems(arm, A.settings, u.pts !== PTS))) P.push(`${u.id} ${arm}: ${q}`);
      // each year's level on every path, and the arm's estate cap (the design review's MINOR 7)
      if (!(A.Y > 0) || !A.level || A.level.length !== nOf(arm, u.N) * A.Y) P.push(`${u.id} ${arm}: its levels not ${A.Y} years a path`);
      if (!(A.estateCap > 0)) P.push(`${u.id} ${arm}: no estate cap`);
      seen[arm] = { inputs: A.inputs, T: A.T, retireT: A.retireT, workT: A.workT || [] };
    }
    for (const q of sameProblems(seen)) P.push(`${u.id}: ${q}`);
    // each paired arm's settings line its pair's, byte for byte: the fair test's diff of what each run recorded (CHECKLIST 3;
    // the design review's MINOR 9), the split itself checked apart (saveSplit above)
    for (const [x, y] of [['CANDD', 'CANDS'], ['CANDDA', 'CANDSA']]) if (u.arms[x] && u.arms[y] && u.arms[x].settings !== u.arms[y].settings) P.push(`${u.id}: ${y}'s settings line is not ${x}'s`);
    if (typeof u.selfEmployed !== 'boolean' || !(u.baseYear > 2000)) P.push(`${u.id}: no employment or base year recorded`);
  }
  return P;
}

/* each household's lifetime spending over all its paths, B against A: its change in percent of A's mean, the sign-flip test's
   one-sided p each way (seeded by its id), Holm over the households; part 3 fails a household lower beyond noise by more than
   the bar */
export function spendRows(units, a, b) {
  const rows = units.map(u => {
    const A = u.arms[a], B = u.arms[b], n = Math.min(A.delivered.length, B.delivered.length);
    const da = A.delivered.subarray(0, n), db = B.delivered.subarray(0, n), sa = sum(da), sb = sum(db), fl = flipTest(spendDiffs(da, db), seedOf(u.id));
    return { id: u.id, pct: sa > 0 ? 100 * (sb / sa - 1) : 0, pLoss: fl.loss, pGain: fl.gain };
  });
  const hl = holm(rows.map(r => r.pLoss)), hg = holm(rows.map(r => r.pGain));
  rows.forEach((r, i) => { r.holmLoss = hl[i]; r.holmGain = hg[i]; r.fails = r.holmLoss < LEVEL && r.pct < HH_SPEND_BAR; });
  return rows;
}
/* `arm` against `base` over the households, on their first n paths (n the paths both arms ran): each household's harm (D34,
   in whole paths) and change, the pooled change by path, spending by household and pooled */
export function compare(units, base, arm) {
  const ns = [...new Set(units.map(u => Math.min(nOf(base, u.N), nOf(arm, u.N))))];
  if (ns.length !== 1) throw new Error(`reduce-save-v2: the households run ${ns.join(', ')} paths, not one count`);
  const n = ns[0], cut = units.map(u => ({ ...u, arms: { ...u.arms, [base]: head(u.arms[base], n), [arm]: head(u.arms[arm], n) } }));
  const rows = cut.map(u => { const c = cells(u.arms[base], u.arms[arm]); return { id: u.id, cohort: u.cohort, status: u.status, cells: c, ch: survivalChange(c.lost, c.saved, c.N), ...harmExact(u.arms[arm], u.arms[base], n) }; });
  const pooled = survivalItem(cut.map(u => [u.arms[arm], u.arms[base]]), n);
  const spend = { rows: spendRows(cut, base, arm), pooled: spendingItem(cut.map(u => [u.arms[arm], u.arms[base]]), n), kept: spendOn(cut.map(u => [u.arms[base], u.arms[arm]]), true) };
  return { base, arm, n, rows, pooled, spend };
}
/* the rule (SAVE-V2.md; D133), CANDS against CANDD on the whole menu; and the pair on anchors beside it */
export function rule(units) {
  const C = compare(units, 'CANDD', 'CANDS'), flagged = C.rows.filter(r => r.flag), spendFail = C.spend.rows.filter(r => r.fails);
  const parts = { harm: flagged.length === 0, gain: C.pooled.lo > POOL_BAR, spend: spendFail.length === 0 && C.spend.pooled.d >= POOL_SPEND_BAR };
  const A = compare(units, 'CANDDA', 'CANDSA'), anchorsFlagged = A.rows.filter(r => r.flag);
  return { C, A, flagged, spendFail, anchorsFlagged, parts, outcome: parts.harm && parts.gain && parts.spend ? 'PASS' : 'FAIL' };
}

/* the read's report after its gate: the rule, its outcome and what is printed beside it (lines, so a planted case can read
   them) */
export function report(units) {
  const out = [], log = x => out.push(x), R = rule(units), C = R.C, A = R.A;
  log('\nTHE RULE, CANDS against CANDD on the whole menu (paired by path; D133):');
  log(`  1. no household flagged by D34's harm rule: ${R.flagged.length ? R.flagged.map(r => `${r.id} (${r.lost - r.saved} paths net against a threshold of ${r.j})`).join('; ') : 'none'}: ${R.parts.harm ? 'HOLDS' : 'FAILS'}`);
  log(`  2. pooled survival ${iv(C.pooled)} over ${units.length} households, by path, its lower end above 0: ${R.parts.gain ? 'HOLDS' : 'FAILS'}`);
  log(`  3. no household's lifetime spending lower beyond noise (Holm at 5%) by more than 0.1%: ${R.spendFail.length ? R.spendFail.map(r => `${r.id} ${f4(r.pct)}% (Holm ${r.holmLoss.toExponential(2)})`).join('; ') : 'none'}; the pooled change ${iv(C.spend.pooled, f4)}%, the households weighted equally, its point not lower than -0.05%: ${R.parts.spend ? 'HOLDS' : 'FAILS'}`);
  log(`OUTCOME: ${R.outcome}${R.outcome === 'PASS' ? `: saveSplit joins the candidate for singles who work and save, in the commit of the D-line naming this run, with the reviewer on the change of default (SAVE-V2.md)${R.anchorsFlagged.length ? `; first, the ${R.anchorsFlagged.length} household${R.anchorsFlagged.length > 1 ? 's' : ''} flagged on anchors (${R.anchorsFlagged.map(r => r.id).join(', ')}) go to the maintainer with this read (D133 (3))` : ''}` : `: the split stays off and is closed as measured${R.flagged.length ? `; ${R.flagged.map(r => r.id).join(', ')} to investigation (D34 (3))` : ''}; to the maintainer`}`);
  log('\nBESIDE THE RULE, deciding nothing:');
  log(`  the pair on anchors, CANDSA against CANDDA on the first ${A.n} paths: pooled survival ${iv(A.pooled)}; flagged by D34: ${R.anchorsFlagged.length ? R.anchorsFlagged.map(r => `${r.id} (${r.lost - r.saved} net against ${r.j})`).join('; ') : 'none'}; lifetime spending pooled ${iv(A.spend.pooled, f4)}%, lower beyond noise by more than 0.1%: ${A.spend.rows.filter(r => r.fails).map(r => `${r.id} ${f4(r.pct)}%`).join(', ') || 'none'}`);
  for (const [b, x] of [['CANDD', 'CANDDA'], ['CANDS', 'CANDSA']]) { const X = compare(units, b, x); log(`  ${x} against ${b}, the menu on anchors against the whole, on the first ${X.n} paths: pooled survival ${iv(X.pooled)}; lifetime spending ${iv(X.spend.pooled, f4)}%; D34 flags ${X.rows.filter(r => r.flag).map(r => r.id).join(', ') || 'none'}`); }
  const low = [...C.rows.map(r => ['whole', r]), ...A.rows.map(r => ['anchors', r])].filter(([, r]) => r.tp < TP_BAR);
  log(`  comparisons whose 1-point rate at their realised discordance falls below ${TP_BAR} (D34 (4)): ${low.length ? low.map(([m, r]) => `${r.id} ${m} ${r.tp.toFixed(3)}`).join(', ') : 'none'}`);
  log(`  spending on the paths both keep, CANDS against CANDD: ${iv(C.spend.kept.pooled, f4)}%, weighted by pounds`);
  const pot = a => mean(units.map(u => mean(u.arms[a].pot))), tax = a => mean(units.map(u => mean(u.arms[a].tax)));
  log(`  the pot left, the mean a household: CANDD ${gbp(pot('CANDD'))}, CANDS ${gbp(pot('CANDS'))}; lifetime tax: CANDD ${gbp(tax('CANDD'))}, CANDS ${gbp(tax('CANDS'))}`);
  // the cohorts apart (the design review's MINOR 7)
  for (const [c, name] of [['fire', 'the younger cohort'], ['lib', "the library's cohort"]]) {
    const us = units.filter(u => u.cohort === c); if (!us.length) continue;
    const X = compare(us, 'CANDD', 'CANDS'); log(`  ${name} (${us.length}), CANDS against CANDD: pooled survival ${iv(X.pooled)}; lifetime spending ${iv(X.spend.pooled, f4)}%`);
  }
  // the employees' working-year decisions from 2029, when the cap on salary sacrifice's NIC relief starts, which the engine
  // does not model (D112 (M6); the design review's MINOR 3), on runPolicy's first paths beside the engine
  { let tot = 0, pen = 0, hh = 0;
    for (const u of units) {
      if (u.selfEmployed) continue; hh++;
      const b = u.arms.CANDS.beside, saves = dec(b.save, Uint8Array), workT = u.arms.CANDS.workT || [], nw = b.years;
      for (let k = 0; k < b.N; k++) for (let d = 0; d < nw; d++) if (u.baseYear + workT[d] >= 2029) { tot++; if (saves[k * nw + d] === 1) pen++; }
    }
    log(`  the employees' working-year decisions from 2029 (the NIC relief on salary sacrifice not capped there, D112 (M6)): CANDS takes the pension first in ${tot ? (100 * pen / tot).toFixed(1) : '-'}% of ${tot}, over ${hh} households`); }
  log(`  runPolicy beside the engine on each arm's first paths: ${sum(units.flatMap(u => ALL_ARMS.map(a => u.arms[a].beside.engineOnly + u.arms[a].beside.policyOnly)))} paths differ in survival of ${sum(units.flatMap(u => ALL_ARMS.map(a => u.arms[a].beside.N)))}`);
  log('  by household (cohort, status; survival CANDD / CANDS; CANDS less CANDD; D34: net loss in paths and threshold; lifetime spending and Holm; on anchors CANDSA less CANDDA; the saves CANDS takes in the working years, the plan\'s / the pension first / the ISA first; its mean tier pair there; the pots at the top of the first retired year, CANDS less CANDD):');
  const sv = X => 100 * sum(X.survived) / X.survived.length;
  for (const u of units) {
    const r = C.rows.find(x => x.id === u.id), s = C.spend.rows.find(x => x.id === u.id), ra = A.rows.find(x => x.id === u.id), bS = u.arms.CANDS.beside, bD = u.arms.CANDD.beside;
    const saves = dec(bS.save, Uint8Array), tp = dec(bS.tierPen, Uint8Array), ti = dec(bS.tierIsa, Uint8Array), share = j => (saves.length ? (100 * saves.filter(x => x === j).length / saves.length).toFixed(0) : '-');
    const potOf = (b, k) => mean(dec(b.pots[k], Float64Array));
    log(`    ${u.id.padEnd(6)} ${u.cohort.padEnd(4)} ${u.status.padEnd(9)} ${sv(u.arms.CANDD).toFixed(2)}% / ${sv(u.arms.CANDS).toFixed(2)}%; ${iv(r.ch)} (${r.cells.saved} saved, ${r.cells.lost} lost); net ${r.lost - r.saved} against ${r.j}${r.flag ? ' FLAGGED' : ''}; spending ${f4(s.pct)}% (Holm loss ${s.holmLoss.toExponential(2)})${s.fails ? ' FAILS PART 3' : ''}; anchors ${f3(ra.ch.d)}${ra.flag ? ' FLAGGED' : ''}; saves ${share(0)} / ${share(1)} / ${share(2)}%; tiers ${saves.length ? (sum(tp) / tp.length).toFixed(2) : '-'}/${saves.length ? (sum(ti) / ti.length).toFixed(2) : '-'}; pots pension ${gbp(potOf(bS, 'pen') - potOf(bD, 'pen'))}, ISA ${gbp(potOf(bS, 'isa') - potOf(bD, 'isa'))}, taxable ${gbp(potOf(bS, 'gia') - potOf(bD, 'gia'))}`);
  }
  // the pot left by household (the design review's MINOR 7): the mean and the median a path, and capped at the arm's estate cap
  log('  the pot left by household, CANDS against CANDD (the mean a path; the median a path; capped at the estate cap):');
  for (const u of units) {
    const d = u.arms.CANDD, x = u.arms.CANDS, cap = d.estateCap, pc = (a, b) => (a > 0 ? `${f3(100 * (b / a - 1))}%` : '-');
    const capm = A => mean(Array.from(A.pot, v => Math.min(v, cap)));
    log(`    ${u.id.padEnd(6)} the mean ${pc(mean(d.pot), mean(x.pot))} (${gbp(mean(x.pot) - mean(d.pot))} a path); the median ${pc(median(Array.from(d.pot)), median(Array.from(x.pot)))}; capped ${pc(capm(d), capm(x))}`);
  }
  // the spending level by retired year of each household part 1 flags or part 3 fails (the design review's MINOR 7)
  for (const id of [...new Set([...R.flagged.map(r => r.id), ...R.spendFail.map(r => r.id)])]) {
    const u = units.find(x => x.id === id), band = (A, lo, hi) => { let t = 0, c = 0; for (let k = 0; k < A.n; k++) for (let y = A.retireT + lo; y < Math.min(A.Y, A.retireT + hi); y++) { t += A.level[k * A.Y + y]; c++; } return c ? (t / c).toFixed(1) : '-'; };
    log(`  ${id}'s spending level by retired year, in percent of its target, the mean over its paths (years 0-4 / 5-9 / 10 on): CANDD ${band(u.arms.CANDD, 0, 5)} / ${band(u.arms.CANDD, 5, 10)} / ${band(u.arms.CANDD, 10, 1e9)}, CANDS ${band(u.arms.CANDS, 0, 5)} / ${band(u.arms.CANDS, 5, 10)} / ${band(u.arms.CANDS, 10, 1e9)}`);
  }
  log(`  the time a path (CPU, the mean a household): ${ALL_ARMS.map(a => `${a} ${(mean(units.map(u => u.arms[a].cpuUs / u.arms[a].n)) / 1e3).toFixed(1)} ms`).join(', ')}; the solve, the median a household: ${ALL_ARMS.map(a => `${a} ${median(units.map(u => u.arms[a].solveSecs)).toFixed(0)} s`).join(', ')}`);
  return { R, out };
}

function planted() {
  const cases = [], arr = (n, f) => { const a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = f(i) ? 1 : 0; return a; };
  const fl = (n, f) => Float64Array.from({ length: n }, (_, i) => f(i));
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const beside = () => ({ N: 10, years: 1, engineOnly: 0, policyOnly: 0, save: b64(new Uint8Array(10)), tierPen: b64(new Uint8Array(10)), tierIsa: b64(new Uint8Array(10)), pots: { pen: b64(new Float64Array(10)), isa: b64(new Float64Array(10)), gia: b64(new Float64Array(10)) } });
  // a household: CANDD keeping sD(i), CANDS sS(i), each spending 1000 a path unless set; the anchors pair the same as the whole
  // unless set; N paths (4,000 unless set, so the sign-flip tests stay light), its anchors arms on the first 4,000
  const unit = (id, sD, sS, o = {}) => {
    const N = o.N || 4000, nA = Math.min(ANCHORS_N, N);
    const A = (n, s, sp) => ({ config: '', n, survived: arr(n, s), failYear: new Int16Array(n), pot: fl(n, () => 100), estate: fl(n, () => 100), tax: fl(n, () => 1), delivered: fl(n, sp || (() => 1000)), unmet: fl(n, () => 0), cpuUs: 1e6, solveSecs: 1, beside: beside(), Y: 10, level: new Uint8Array(n * 10).fill(100), estateCap: 500 });
    return { id, cohort: o.cohort || 'lib', status: 'touched', selfEmployed: false, baseYear: 2026, N, arms: { CANDD: A(N, sD), CANDS: A(N, sS, o.spendS), CANDDA: A(nA, o.sDA || sD), CANDSA: A(nA, o.sSA || sS, o.spendSA || o.spendS) } };
  };
  const gainU = (id, o) => unit(id, i => i % 10 !== 0, i => i % 20 !== 0, o);
  { const R = rule([gainU('a'), gainU('b')]); cases.push(['CANDS saving 5% of paths on each household, spending held: PASS', `${R.outcome} ${R.parts.harm} ${R.parts.gain} ${R.parts.spend}`, 'PASS true true true']); }
  { const us = [gainU('a'), unit('b', i => i % 10 !== 0, i => i % 10 !== 0 && i % 50 !== 1)], R = rule(us), line = report(us).out.find(x => /^OUTCOME/.test(x));
    cases.push(['a household losing 2% of its paths: flagged, FAIL, and the outcome sends it to investigation', `${R.outcome} ${R.flagged.map(r => r.id).join(',')} ${/; b to investigation \(D34 \(3\)\)/.test(line)}`, 'FAIL b true']); }
  { const R = rule([unit('a', i => i % 10 !== 0, i => i % 10 !== 0), unit('b', i => i % 10 !== 0, i => i % 10 !== 0)]); cases.push(['CANDS the same as CANDD on every path: no gain, FAIL', `${R.outcome} ${R.parts.gain}`, 'FAIL false']); }
  // the pooled gain by path: ten households sharing a swing (CANDS saving the first 300 paths and losing the next 260 of each)
  // straddles nought by path though each gains a point
  { const us = Array.from({ length: 10 }, (_, j) => unit(`s${j}`, i => !(i < 300), i => !(i >= 300 && i < 560))), R = rule(us);
    cases.push(['households sharing a swing: by path the interval straddles nought, part 2 FAILS though the point is above it', `${R.C.pooled.lo < 0} ${R.C.pooled.d > 0} ${R.parts.gain}`, 'true true false']); }
  // part 3 by household: one household spending 0.2% less on every path (beyond noise, past the bar) FAILS; 0.05% less on
  // every path (beyond noise, inside the bar) holds; 0.2% less on half its paths and 0.2% more on the other half (no change
  // beyond noise) holds
  { const less = (id, m) => gainU(id, { spendS: () => 1000 * (1 - m / 100) });
    const a = rule([gainU('g1'), gainU('g2'), less('h', 0.2)]), b = rule([gainU('g1'), gainU('g2'), less('h', 0.05)]), c = rule([gainU('g1'), gainU('g2'), gainU('h', { spendS: i => (i % 2 ? 1002 : 998) })]);
    cases.push(['part 3: 0.2% less beyond noise fails the household; 0.05% less beyond noise holds (inside the bar); a swing with no change holds', `${a.parts.spend} ${a.spendFail.map(r => r.id).join(',')} | ${b.parts.spend} ${b.C.spend.rows.find(r => r.id === 'h').holmLoss < LEVEL} | ${c.parts.spend}`, 'false h | true true | true']); }
  // part 3, the pooled clause: every household 0.06% less (inside the household bar, beyond noise): the pooled point -0.06 FAILS;
  // 0.04% less holds
  { const all = m => rule(['a', 'b', 'c'].map(id => gainU(id, { spendS: () => 1000 * (1 - m / 100) }))), x = all(0.06), y = all(0.04);
    cases.push(['part 3 pooled: every household 0.06% less fails on the pooled point alone; 0.04% less holds', `${x.parts.spend} ${x.spendFail.length} ${x.C.spend.pooled.d.toFixed(3)} | ${y.parts.spend}`, 'false 0 -0.060 | true']); }
  // Holm over the households: a household 0.12% lower on noisy paths (its own p about 0.0025) fails part 3 alone, and holds
  // among forty, where Holm takes its p to about 0.1
  { const noisy = () => gainU('n', { spendS: i => 1000 - 1.2 + (i % 2 ? 27 : -27) }), alone = rule([noisy()]), among = rule([noisy(), ...Array.from({ length: 39 }, (_, j) => gainU(`z${j}`))]);
    const ra = alone.C.spend.rows[0], rb = among.C.spend.rows.find(x => x.id === 'n');
    cases.push(['Holm over the households: 0.12% lower on noisy paths fails part 3 alone (p under 0.05), holds among forty (Holm over 0.05)', `${ra.pct.toFixed(2)} ${ra.pLoss < LEVEL} ${alone.spendFail.length} | ${rb.holmLoss >= LEVEL} ${among.spendFail.length} ${among.parts.spend}`, '-0.12 true 1 | true 0 true']); }
  // an S308F-sized harm among forty (the design review's MINOR 4): a household 0.25% lower on noisy paths fails part 3 with
  // Holm over the forty
  { const s308 = gainU('s', { spendS: i => 1000 - 2.5 + (i % 2 ? 27 : -27) }), R = rule([s308, ...Array.from({ length: 39 }, (_, j) => gainU(`z${j}`))]), r = R.C.spend.rows.find(x => x.id === 's');
    cases.push(['an S308F-sized harm among forty: 0.25% lower on noisy paths fails part 3 with Holm over the forty', `${r.pct.toFixed(2)} ${r.holmLoss < LEVEL} ${R.spendFail.map(x => x.id).join(',')} ${R.parts.spend} ${R.outcome}`, '-0.25 true s false FAIL']); }
  // the bar either side by one path, through the rule's own wiring: CANDD keeps every path of b and CANDS loses its first m
  { const lose = m => unit('b', () => true, i => i >= m), big = gainU('a');
    let m = 1; while (m < 400 && !harmExact(lose(m).arms.CANDS, lose(m).arms.CANDD, 4000).flag) m++;
    const below = rule([big, lose(m - 1)]), over = rule([big, lose(m)]);
    cases.push([`a household one path under its D34 bar (net loss ${m - 1}) is not flagged, one over (${m}) is`, `${below.parts.harm} ${over.parts.harm} ${below.outcome} ${over.outcome}`, 'true false PASS FAIL']); }
  // the anchors pair decides nothing in the rule, and under a PASS its flagged household is named for the maintainer
  // f runs 16,000 paths on the whole menu, so its anchors arms are cut to their first 4,000 and the anchors' own effect reads
  // the whole menu's first 4,000; on anchors CANDSA loses the first 200 paths CANDDA keeps (180 net)
  { const flaggedOnAnchors = gainU('f', { N: 16000, sSA: i => i % 10 !== 0 && i >= 200 }), us = [gainU('a', { N: 16000 }), flaggedOnAnchors], R = rule(us), { out } = report(us), line = out.find(x => /^OUTCOME/.test(x));
    cases.push(['a household flagged on anchors alone: the rule PASSES and the outcome sends it to the maintainer first; the anchors pair read on 4,000 paths', `${R.outcome} ${R.anchorsFlagged.map(r => r.id).join(',')} ${/first, the 1 household flagged on anchors \(f\) go to the maintainer/.test(line)} ${R.C.n} ${R.A.n}`, 'PASS f true 16000 4000']);
    const clean = report([gainU('a'), gainU('b')]).out.find(x => /^OUTCOME/.test(x));
    cases.push(['no household flagged on anchors: no such clause', `${/flagged on anchors/.test(clean)}`, 'false']); }
  // the gate on built units, each with its own launch log; real settings lines of the candidate on each menu
  { const real = 'pts 45 mix 3 lambda 0.0223606797749979 bequestWeight 0.02 levels 1,1.1,0.95,0.9,0.8 raiseW 0.003 finalIntegral true bridgeRead reader readerRef adaptive readerSplit rs tierState 0/0,1/1,2/2,3/3 tiersBelow 3 tableDealing false switchCharge 0.001 e3 true e3pcls true hr yes jointWorlds true bridgeStep exact switchMargin 0 pclsInterp true lattice unbuilt failDelivered true minPot 22500 readerYears 0 sweepCashIsaTo isa coarse w2a3b3g2c2-NT-LRVOH-h3';
    const want = [{ id: 'a', target: 1, label: 'x' }, { id: 'b', target: 1, label: 'x' }];
    const mk = (id, k) => { const u = gainU(id); return { ...u, k, target: 1, label: 'x', seed: 9, W, pts: PTS, nAnchors: 4000, stamp: { code: 'c', audit: 'a', prediction: 'p', node: 'n' }, arms: Object.fromEntries(ALL_ARMS.map(x => [x, { ...u.arms[x], config: configOf(x), saveSplit: isSplit(x) ? 'on' : 'off', menu: onAnchors(x) ? 'anchors' : 'whole', settings: onAnchors(x) ? real : real.replace(/coarse \S+$/, 'coarse none'), inputs: 'i', T: 40, retireT: 10, workT: [0, 1, 2] }])) }; };
    const log = (id, n, done = true) => `stamp: code c audit a prediction p sha -\nTHE SAVINGS SPLIT'S v2: unit ${n}/2: ${id} (lib, place 0, touched), target 1\n${done ? `         done unit ${n} secs 5\n` : ''}`;
    const logsOf = (o = {}) => ({ 'case0.txt': log('a', 0, o.aDone !== false), ...(o.short ? {} : { 'case1.txt': log('b', 1) }) });
    const G = (mod, o = {}) => { const us = [mk('a', 0), mk('b', 1)]; if (mod) mod(us); return gate(us, want, { seed: 9, logs: logsOf(), ...o }); };
    { const g0 = G(); cases.push(['the gate: the built units fair', g0.length ? `${g0.length}: ${g0.slice(0, 3).join(' | ')}` : '0', '0']); }
    const faults = [
      ['a household missing', us => us.pop(), { logs: logsOf({ short: true }) }, /b: missing/],
      ['an arm missing', us => { delete us[0].arms.CANDSA; }, {}, /a CANDSA: missing/],
      ['another seed', us => { us[1].seed = 8; }, {}, /seed/],
      ['another code', us => { us[1].stamp = { ...us[1].stamp, code: 'd' }; }, {}, /more than one code/],
      ['another audit', us => { us[1].stamp = { ...us[1].stamp, audit: 'z' }; }, {}, /more than one audit/],
      ['another estate weight', us => { us[1].W = 0.01; }, {}, /estate weight/],
      ['another count of points', us => { us[1].pts = 30; }, {}, /points/],
      ['another configuration', us => { us[0].arms.CANDS.config = 'z'; }, {}, /a CANDS: configuration z/],
      ['an array not one a path', us => { us[0].arms.CANDD.tax = new Float64Array(3); }, {}, /a CANDD: tax not one a path/],
      ['an anchors arm not on its first 4,000 paths', us => { us[1].nAnchors = 3000; }, {}, /b: 3000 paths on anchors, not 4000/],
      ['the split off on CANDS', us => { us[0].arms.CANDS.saveSplit = 'off'; }, {}, /a CANDS: saveSplit off/],
      ['the split on CANDDA', us => { us[0].arms.CANDDA.saveSplit = 'on'; }, {}, /a CANDDA: saveSplit on/],
      ['a whole-menu arm on anchors', us => { us[1].arms.CANDD.menu = 'anchors'; us[1].arms.CANDD.settings = real; }, {}, /b CANDD: on the menu anchors, not the whole menu/],
      ['an anchors arm solved on the whole menu', us => { us[0].arms.CANDSA.settings = real.replace(/coarse \S+$/, 'coarse none'); }, {}, /a CANDSA: coarse none \(want/],
      ['a settings line not the candidate\'s (two tier steps)', us => { us[0].arms.CANDD.settings = us[0].arms.CANDD.settings.replace('tiersBelow 3', 'tiersBelow 2'); }, {}, /a CANDD: tiersBelow 2 \(want 3\)/],
      ['the arms on two plans', us => { us[1].arms.CANDS.inputs = 'j'; }, {}, /b: its arms differ in inputs/],
      ['the arms on other working years', us => { us[0].arms.CANDSA.workT = [0, 1]; }, {}, /a: its arms differ in the working years/],
      ['no working year to choose', us => { for (const x of ALL_ARMS) us[1].arms[x].workT = []; }, {}, /b: no working year with a save to choose/],
      ['another target', us => { us[0].target = 2; }, {}, /target 2/],
      ["another of arm A's picks", us => { us[0].label = 'y'; }, {}, /arm A's pick y/],
      ['the registration\'s paths not run', null, { paths: { a: 5, b: 5 } }, /4000 paths, not 5/],
      ['a household with no registered paths', null, { paths: { a: 4000 } }, /b: no paths for it/],
      ['run under another prediction', null, { prediction: 'r' }, /not run under r/],
      ["a code not the panel's", null, { code: 'k' }, /not the code the panel was landed on/],
      ['a launch log short of the units', null, { logs: logsOf({ short: true }) }, /1 launch logs for 2 units/],
      ["a unit's log without its done line", null, { logs: logsOf({ aDone: false }) }, /a: 1 launch logs name it, without its done line/],
      ["a paired arm's settings line not its pair's (a field the wanted list leaves out)", us => { us[0].arms.CANDS.settings = us[0].arms.CANDS.settings.replace('mix 3', 'mix 4'); }, {}, /a: CANDS's settings line is not CANDD's/],
      ["an anchors arm's settings line not its pair's", us => { us[1].arms.CANDDA.settings = us[1].arms.CANDDA.settings.replace('raiseW 0.003', 'raiseW 0.004'); }, {}, /b: CANDSA's settings line is not CANDDA's/],
      ['the levels not one a year of every path', us => { us[0].arms.CANDD.level = new Uint8Array(5); }, {}, /a CANDD: its levels not 10 years a path/],
      ['no estate cap', us => { us[1].arms.CANDSA.estateCap = 0; }, {}, /b CANDSA: no estate cap/],
      ['no employment recorded', us => { delete us[0].selfEmployed; }, {}, /a: no employment or base year recorded/]
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
  const DIR = dirArg || join(HERE, 'results', PILOT ? 'save-v2-pilot' : 'save-v2-run');
  if (!existsSync(DIR)) { console.error(`reduce-save-v2: no ${DIR}`); process.exit(2); }
  const { readSaveV2Panel, PANEL } = await import('./save-v2-panel.mjs');
  const panel = readSaveV2Panel(), want = PILOT ? pilotUnits(panel) : panel;
  const logs = readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x));
  if (!PILOT) requireFairLogs(Object.fromEntries(logs.map(x => [x, readFileSync(join(DIR, x), 'utf8')])), REGISTRATION);
  const units = loadDir(DIR), paths = PILOT ? null : JSON.parse(readFileSync(PATHS_FILE, 'utf8')).paths;
  const P = gate(units, want, { seed: PILOT ? PILOT_SEED : SEED, prediction: PILOT ? null : REGISTRATION, audit: stampFilesHash(), paths, code: JSON.parse(readFileSync(PANEL, 'utf8')).code, logs: Object.fromEntries(logs.map(x => [x, readFileSync(join(DIR, x), 'utf8')])) });
  console.log(`THE SAVINGS SPLIT'S v2${PILOT ? ', THE PILOT (EXPLORATORY)' : ''}: THE READ (SAVE-V2.md; ${PILOT ? 'no outcome' : REGISTRATION}): ${units.length} households from ${DIR}`);
  if (P.length) { console.log(`THE GATE: REFUSED\n  ${P.join('\n  ')}`); process.exit(3); }
  console.log(`THE GATE: fair; one code ${units[0].stamp.code}, audit ${units[0].stamp.audit}, seed ${units[0].seed}, ${units[0].pts} points; every household's four arms at their configurations and menus, at its registered paths`);
  if (PILOT) process.exit(0);
  console.log(report(units).out.join('\n'));
}
