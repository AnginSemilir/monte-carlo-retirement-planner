/*
 * PHASE 4'S READ (registrations/phase-4.md; audit-phase4.mjs; STATE.md D33 to D35, D34 the harm rule), once, after its gate:
 *   - provenance (fair-gate.mjs requireFairLogs): every unit's log stamped by the launcher under the registration, the
 *     registration unedited since, one code across the logs;
 *   - the units: every household of phase4-panel.json in every arm (APP; CAND and SHIP at 0.02 and 0.01), one code, one
 *     audit, the candidate fcd8096217b7 and one Node version on every unit, seed 7003 on each household's registered paths
 *     (phase4-paths.json), the replication on 4,000 paths of 7018 from its path 200 (a smoke run scored the first 200), the three worlds on 2,000 paths and history on APP and
 *     CAND/0.02, FIXBR on CAND/0.02 (the first 8,000 paths) exactly where the household has retired years before access, each arm's settings as
 *     Phase 4's, and the household's target (the engine's), minimum pot and horizon the same in every arm;
 *   - the plan (D36): a household's five units on one inputs hash (each engine context but the policy's own fields), so the
 *     arms differ in the decumulation rule alone;
 *   - each unit's stamp under the registration, its code, audit and registration blob the logs' own, and its audit hash that of
 *     the files this read takes (audit-phase4.mjs stampFilesHash: the audit's files, the panel, the paths and this reducer);
 *   - the fair-test diff of the settings each run recorded (CHECKLIST 3): a weight's CAND and SHIP share the plan, the inputs,
 *     the minimum pot, the levels, the mixture, the cost weight, the raise weight, the final year and the estate weight; an
 *     arm's two weights differ in the estate weight alone; APP's minimum pot the solver's;
 *   - runPolicy beside the engine on the first 2,000 paths of each solver unit (the fidelity gaps are reported).
 * THE DECISION, at each estate weight (both must pass), on the first 16,000 paths of every household, each path's change
 * averaged over the 40 households and the 95% interval taken from the spread across paths (path i draws the same shocks
 * for every household):
 *   A1 survival against the app's rules, CAND less APP, in points: passes when the interval's lower end is above 0;
 *   A2 spending delivered over every year, CAND less APP as a share of the household's mean under APP, in %: passes when
 *      the lower end is above -1;
 *   S1 survival against the shipping solver, CAND less SHIP, in points: passes when the lower end is above -0.1.
 *   PASS: all three at both weights: the candidate goes to the maintainer, who decides whether it ships behind Part C's
 *   switch (D12 holds until then). NOT PASSED: the items that failed and by how much; the app's defaults stay, and nothing
 *   is tuned until it passes.
 * FLAGS, for investigation by V4's measures whatever the outcome; none blocks the release on its own (D34 (3)):
 *   - harm against the app's rules and against SHIP, per household and weight: the observed loss over the household's
 *     paths above its registered threshold (phase4-paths.json, by D34);
 *   - spending: a household delivering more than 5% less over every year than under the app's rules (reported, not
 *     blocking: the maintainer's call of 27 Oct, D37).
 * REPORTED (no survival figure without the spending delivered beside it): the whole score on every path (the solver's
 *   objective at the weight, the app's rules scored the same way); spending delivered CAND less SHIP, pooled and per
 *   household; A1 and A2 apart where arm A takes the full lump sum; S1 over the library cohort, over the households whose reader
 *   reads no bridge year (spending beside each), and the count of
 *   households with an observed loss against SHIP; the estate, unmet spending, tax, the years below target, the end
 *   wealth's median and unlucky tenth; FIXBR less CAND (7q, D35); the three worlds and history (D35; the return a point
 *   lower carries D20 (9)'s sensitivity to the returns); the replication on 7018 (A1, A2 and S1 again); each household's
 *   discordance as realised and D34's rates at it; the fidelity gaps (runPolicy beside); the solve times and the hosts.
 *   node research/solver/reduce-phase4.mjs [dir] > research/solver/results-phase4.txt
 *   node research/solver/reduce-phase4.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { harmRate } from './size-phase4.mjs';
import { LOG_STAMP } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REGISTRATION = 'research/solver/registrations/phase-4.md';
export const COHORTS = ['lib', 'fire'];   // phase4-panel.mjs's labels: S1's library part reads 'lib'
export const WEIGHTS = ['0.02', '0.01'], ARMS = ['APP/-', 'CAND/0.02', 'CAND/0.01', 'SHIP/0.02', 'SHIP/0.01'];
export const POOL = 16000, A1_BAR = 0, A2_BAR = -1, S1_BAR = -0.1, SPEND_FLAG = -5, MU = 0.003, Z = 1.959963984540054;
export const SEED = 7003, REPL = { seed: 7018, skip: 200, N: 4000 }, ROB_N = 2000, FIXBR_N = 8000, BESIDE_N = 2000, CANDIDATE = 'fcd8096217b7', WORLDS = ['return-1', 'vol+25', 'left-tail'];
/* the settings a weight's CAND and SHIP share (CHECKLIST 3); the rest are the arm's own */
export const SHARED = ['mix', 'lambda', 'bequestWeight', 'levels', 'finalIntegral', 'raiseW', 'minPot', 'plan', 'inputs'];
export const kvOf = ran => Object.fromEntries((` ${ran}`.match(/ \S+ \S+/g) || []).map(x => x.trim().split(' ')));

const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const arraysOf = x => x && { survived: dec(x.survived, Uint8Array), estate: dec(x.estate, Float32Array), wealth: dec(x.wealth, Float32Array), delivered: dec(x.delivered, Float32Array), unmet: dec(x.unmet, Float32Array), tax: dec(x.tax, Float32Array), failYear: dec(x.failYear, Int16Array), level: dec(x.level, Uint8Array) };
export function loadDir(dir) {
  const U = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) {
    const j = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString());
    (U[j.id] ||= {})[`${j.arm}/${j.w}`] = { ...j, main: arraysOf(j.main), replA: arraysOf(j.repl), fixbrA: arraysOf(j.fixbr),
      worldsA: j.worlds ? Object.fromEntries(WORLDS.map(w => [w, j.worlds[w] ? dec(j.worlds[w], Uint8Array) : null])) : null, histA: j.hist && j.hist.bits ? dec(j.hist.bits, Uint8Array) : null,
      worldsD: j.worlds ? Object.fromEntries(WORLDS.map(w => [w, j.worlds[`${w}:delivered`] ? dec(j.worlds[`${w}:delivered`], Float32Array) : null])) : null, histD: j.hist && j.hist.delivered ? dec(j.hist.delivered, Float32Array) : null };
  }
  return U;
}

/* the gate over the units: every problem, so a refusal names them all */
export function gate(U, panel, paths, logs = null, files = null) {
  const P = [], stamps = new Set();
  for (const h of panel) {
    const u = U[h.id] || {};
    if (!COHORTS.includes(h.cohort)) P.push(`${h.id}: cohort ${h.cohort}, not one of ${COHORTS.join(', ')}`);
    for (const k of ARMS) if (!u[k]) P.push(`${h.id}: no ${k} unit`);
    const got = ARMS.map(k => u[k]).filter(Boolean);
    for (const x of got) {
      const k = `${x.arm}/${x.w}`;
      stamps.add(JSON.stringify(x.stamp));
      if (x.seed !== SEED) P.push(`${h.id} ${k}: seed ${x.seed}`);
      if (x.N !== paths[h.id] || x.main.survived.length !== x.N) P.push(`${h.id} ${k}: ${x.N} paths, registered ${paths[h.id]}`);
      if (!x.repl || x.repl.seed !== REPL.seed || x.repl.skip !== REPL.skip || x.repl.N !== REPL.N) P.push(`${h.id} ${k}: the replication ${x.repl ? `${x.repl.N} paths of ${x.repl.seed} from its path ${x.repl.skip}` : 'missing'}`);
      if (x.target !== h.target) P.push(`${h.id} ${k}: target ${x.target}, the panel's ${h.target}`);
      if (x.stamp.candidate !== CANDIDATE) P.push(`${h.id} ${k}: candidate ${x.stamp.candidate}`);
      if (x.stamp.prediction !== REGISTRATION) P.push(`${h.id} ${k}: stamped under ${x.stamp.prediction}, not ${REGISTRATION}`);
      if (files && x.stamp.audit !== files) P.push(`${h.id} ${k}: launched on files hashing ${x.stamp.audit}; the files this read takes (the audit's STAMP_FILES, the panel, the paths and this reducer) hash ${files}`);
      if (logs && ['code', 'audit', 'sha'].some(f => x.stamp[f] !== logs[f])) P.push(`${h.id} ${k}: its stamp (code ${x.stamp.code} audit ${x.stamp.audit} sha ${x.stamp.sha}) not the logs' (code ${logs.code} audit ${logs.audit} sha ${logs.sha})`);
      if (!x.inputs) P.push(`${h.id} ${k}: no inputs hash`);
      if (x.arm !== 'APP' && (!x.beside || x.beside.N !== Math.min(x.N, BESIDE_N))) P.push(`${h.id} ${k}: runPolicy beside ${x.beside ? `on ${x.beside.N} paths` : 'missing'}, not on ${Math.min(x.N, BESIDE_N)}`);
      if (x.arm !== 'APP' && !(x.readerYears >= 0)) P.push(`${h.id} ${k}: no reader years`);
      const robust = k === 'APP/-' || k === 'CAND/0.02';
      if (robust && (!x.worlds || x.worlds.N !== ROB_N || WORLDS.some(w => !x.worldsA[w] || !x.worldsD[w]) || !x.histA || !x.histD)) P.push(`${h.id} ${k}: the worlds or history (or their spending) missing`);
      if (!robust && (x.worlds || x.hist)) P.push(`${h.id} ${k}: worlds or history where none belong`);
      if (k === 'CAND/0.02' && (x.bridge > 0) !== !!x.fixbr) P.push(`${h.id} ${k}: FIXBR ${x.fixbr ? 'present' : 'missing'} with ${x.bridge} retired years before access`);
      if (x.fixbr && x.fixbr.N !== Math.min(x.N, FIXBR_N)) P.push(`${h.id} ${k}: FIXBR on ${x.fixbr.N} paths, not ${Math.min(x.N, FIXBR_N)}`);
      if (k !== 'CAND/0.02' && x.fixbr) P.push(`${h.id} ${k}: FIXBR where none belongs`);
      const want = x.arm === 'CAND' ? ['pts 45', 'bridgeRead reader', 'readerRef adaptive', 'tiersBelow 3', 'tableDealing false', `bequestWeight ${x.w}`] : x.arm === 'SHIP' ? ['pts 30', 'bridgeRead false', 'tiersBelow 2', 'tableDealing true', `bequestWeight ${x.w}`] : ['guardrails true', 'lookahead 5', 'raiseCap 1.1'];
      for (const s of want) if (!` ${x.ran} `.includes(` ${s} `)) P.push(`${h.id} ${k}: ran without "${s}"`);
    }
    if (got.length && new Set(got.map(x => `${x.Y} ${x.bridge}`)).size > 1) P.push(`${h.id}: the arms' horizons or bridges differ`);
    if (got.length && new Set(got.map(x => x.inputs)).size > 1) P.push(`${h.id}: the arms' inputs differ (${got.map(x => `${x.arm}/${x.w} ${x.inputs}`).join(', ')})`);
    for (const w of WEIGHTS) { const c = u[`CAND/${w}`], s = u[`SHIP/${w}`]; if (!c || !s) continue; const a = kvOf(c.ran), b = kvOf(s.ran); for (const f of SHARED) if (a[f] === undefined || a[f] !== b[f]) P.push(`${h.id} W${w}: CAND's ${f} ${a[f]}, SHIP's ${b[f]}`); }
    for (const arm of ['CAND', 'SHIP']) { const a = u[`${arm}/0.02`], b = u[`${arm}/0.01`]; if (!a || !b) continue; const x = kvOf(a.ran), y = kvOf(b.ran); for (const f of new Set([...Object.keys(x), ...Object.keys(y)])) if (f !== 'bequestWeight' && x[f] !== y[f]) P.push(`${h.id} ${arm}: W0.02's ${f} ${x[f]}, W0.01's ${y[f]}`); }
    if (u['APP/-'] && u['CAND/0.02']) { const m = / minPot (\S+)/.exec(u['APP/-'].ran), c = kvOf(u['CAND/0.02'].ran).minPot; if (!m || m[1] !== c) P.push(`${h.id}: APP's minimum pot ${m ? m[1] : '-'}, CAND's ${c}`); }
  }
  if (stamps.size > 1) P.push(`${stamps.size} stamps across the units (one code, audit, candidate, registration and Node version wanted)`);
  return P;
}

/* a paired item, path by path: each path's value averaged over the households, the mean and its 95% interval */
export function byPath(rows, n) {
  const x = new Float64Array(n);
  for (const f of rows) for (let i = 0; i < n; i++) x[i] += f(i) / rows.length;
  let m = 0; for (let i = 0; i < n; i++) m += x[i]; m /= n;
  let v = 0; for (let i = 0; i < n; i++) v += (x[i] - m) ** 2;
  const se = Math.sqrt(v / (n - 1) / n);
  return { d: m, se, lo: m - Z * se, hi: m + Z * se };
}
const meanOf = (a, n = a.length) => { let s = 0; for (let i = 0; i < n; i++) s += a[i]; return s / n; };
export const survivalItem = (pairs, n) => byPath(pairs.map(([c, o]) => i => 100 * (c.survived[i] - o.survived[i])), n);
export const spendingItem = (pairs, n) => byPath(pairs.map(([c, o]) => { const m = meanOf(o.delivered, n) || 1; return i => 100 * (c.delivered[i] - o.delivered[i]) / m; }), n);
/* a household's paired loss over all its paths, and its flag against a threshold */
export function lossOf(c, o) { let lost = 0, saved = 0; const n = c.survived.length; for (let i = 0; i < n; i++) { if (o.survived[i] && !c.survived[i]) lost++; else if (c.survived[i] && !o.survived[i]) saved++; } return { lost, saved, n, loss: 100 * (lost - saved) / n, disc: (lost + saved) / n }; }
export const harmFlag = (L, t) => L.loss > t + 1e-12;
/* the households where arm A's pick takes the full lump sum (its label, as the landing wrote it), and the rest */
export const lumpGroups = panel => [['takes the lump sum', panel.filter(h => /lump sum/.test(h.label || ''))], ['does not', panel.filter(h => !/lump sum/.test(h.label || ''))]];
/* S1 beside its parts (the review of 27 Oct, finding 7): over the library cohort, over the households whose reader reads no
   bridge year, and the households with an observed loss against SHIP over all their paths */
export function s1Parts(U, panel, w, n) {
  const pairs = hs => hs.map(h => [U[h.id][`CAND/${w}`].main, U[h.id][`SHIP/${w}`].main]), lib = panel.filter(h => h.cohort === 'lib'), none = panel.filter(h => U[h.id][`CAND/${w}`].readerYears === 0);
  return { library: lib.length ? survivalItem(pairs(lib), n) : null, libSpend: lib.length ? spendingItem(pairs(lib), n) : null, nLibrary: lib.length,
    noReader: none.length ? survivalItem(pairs(none), n) : null, noReaderSpend: none.length ? spendingItem(pairs(none), n) : null, nNoReader: none.length,
    losers: panel.filter(h => lossOf(U[h.id][`CAND/${w}`].main, U[h.id][`SHIP/${w}`].main).loss > 0).map(h => h.id) };
}

/* the whole score per path (reduce-7uf.mjs wholeScore's arithmetic, from the engine's own years): survival, the estate at the
   weight (capped, on the household's scale), less the cost of each year below target, plus the raise credit in futures that
   survive; a failed year costs what a year at the floor costs */
export function wholeScore(A, Y, w, s) {
  const n = A.survived.length, out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let cut = 0, raise = 0; const fy = A.failYear[i];
    for (let t = 0; t < Y; t++) {
      const l = A.level[i * Y + t] / 100; if (l <= 0) continue;
      if (fy >= 0 && t >= fy) { cut += s.lambda * (1 - s.floor) ** 2; continue; }
      if (l < 1) cut += s.lambda * (1 - l) ** 2; else if (l > 1) raise += MU * Math.sqrt(Math.min(0.2, l - 1));
    }
    const alive = A.survived[i] === 1, est = alive ? Math.min(A.estate[i], s.cap) : 0;
    out[i] = 100 * ((alive ? 1 : 0) + w * est / s.scale - cut + (alive ? raise : 0));
  }
  return out;
}
const yearsBelow = (A, Y) => { const n = A.survived.length; let s = 0; for (let i = 0; i < n; i++) for (let t = 0; t < Y; t++) { const l = A.level[i * Y + t]; if (l > 0 && l < 100) s++; } return s / n; };
const quant = (a, q) => { const s = Float64Array.from(a).sort(); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

/* the outcome from the items (A1, A2, S1 at each weight) */
export function decide(items) {
  const failed = [];
  for (const w of WEIGHTS) {
    const it = items[w];
    if (!(it.A1.lo > A1_BAR)) failed.push(`A1 at W${w} (lower end ${it.A1.lo.toFixed(3)}, not above ${A1_BAR})`);
    if (!(it.A2.lo > A2_BAR)) failed.push(`A2 at W${w} (lower end ${it.A2.lo.toFixed(3)}%, not above ${A2_BAR}%)`);
    if (!(it.S1.lo > S1_BAR)) failed.push(`S1 at W${w} (lower end ${it.S1.lo.toFixed(3)}, not above ${S1_BAR})`);
  }
  return failed.length ? { outcome: 'NOT PASSED', decides: `the app's defaults stay (D12) and nothing is tuned to pass; failed: ${failed.join('; ')}` }
    : { outcome: 'PASS', decides: 'the candidate goes to the maintainer, who decides whether it ships behind Part C\'s switch' };
}

const f3 = x => x.toFixed(3), sgn = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`, iv = r => `${sgn(r.d)} (${f3(r.lo)} to ${f3(r.hi)}, se ${r.se.toFixed(4)})`;

async function read(dir) {
  const { requireFairLogs } = await import('./fair-gate.mjs');
  const logs = Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => [f, readFileSync(join(dir, f), 'utf8')]));
  requireFairLogs(logs, REGISTRATION);
  const ls = [...Object.values(logs).join('\n').matchAll(LOG_STAMP)].map(([, code, audit, , sha]) => ({ code, audit, sha })), logStamp = ls[0] || null;
  if (new Set(ls.map(x => JSON.stringify(x))).size > 1) { console.log('THE GATE: REFUSED (the logs carry more than one stamp)'); process.exit(1); }
  const panel = JSON.parse(readFileSync(join(HERE, 'phase4-panel.json'), 'utf8')).panel, reg = JSON.parse(readFileSync(join(HERE, 'phase4-paths.json'), 'utf8'));
  const { stampFilesHash } = await import('./audit-phase4.mjs');
  const U = loadDir(dir), problems = gate(U, panel, reg.paths, logStamp, stampFilesHash());
  const any = Object.values(U).flatMap(Object.values)[0];
  console.log(`PHASE 4 READ: ${dir}; ${Object.keys(U).length} households; stamp ${any ? JSON.stringify(any.stamp) : '-'}`);
  if (problems.length) { console.log(`THE GATE: REFUSED (${problems.length})\n  ${problems.join('\n  ')}`); process.exit(1); }
  console.log(`the gate: fair - ${panel.length} households in every arm, seed ${SEED} on their registered paths (${Math.min(...Object.values(reg.paths))} to ${Math.max(...Object.values(reg.paths))}), the replication ${REPL.N} paths of ${REPL.seed} from its path ${REPL.skip}, one stamp`);
  const items = {}, replItems = {};
  for (const w of WEIGHTS) {
    const C = h => U[h.id][`CAND/${w}`], A = h => U[h.id]['APP/-'], S = h => U[h.id][`SHIP/${w}`];
    items[w] = { A1: survivalItem(panel.map(h => [C(h).main, A(h).main]), POOL), A2: spendingItem(panel.map(h => [C(h).main, A(h).main]), POOL), S1: survivalItem(panel.map(h => [C(h).main, S(h).main]), POOL) };
    replItems[w] = { A1: survivalItem(panel.map(h => [C(h).replA, A(h).replA]), REPL.N), A2: spendingItem(panel.map(h => [C(h).replA, A(h).replA]), REPL.N), S1: survivalItem(panel.map(h => [C(h).replA, S(h).replA]), REPL.N), S1spend: spendingItem(panel.map(h => [C(h).replA, S(h).replA]), REPL.N) };
    console.log(`W${w}: A1 survival CAND less APP ${iv(items[w].A1)} points: ${items[w].A1.lo > A1_BAR ? 'PASSES' : 'FAILS'}; A2 spending delivered ${iv(items[w].A2)}%: ${items[w].A2.lo > A2_BAR ? 'PASSES' : 'FAILS'}; S1 survival CAND less SHIP ${iv(items[w].S1)} points: ${items[w].S1.lo > S1_BAR ? 'PASSES' : 'FAILS'}`);
  }
  const out = decide(items);
  console.log(`OUTCOME: ${out.outcome}: ${out.decides}`);
  // the flags, per household and weight (D34)
  console.log('\nFLAGS (D34: for investigation, none blocking on its own)');
  const flags = [];
  for (const h of panel) for (const w of WEIGHTS) {
    const c = U[h.id][`CAND/${w}`].main;
    for (const arm of ['APP', 'SHIP']) {
      const o = (arm === 'APP' ? U[h.id]['APP/-'] : U[h.id][`SHIP/${w}`]).main, L = lossOf(c, o), th = reg.thresholds[h.id][`${arm}/${w}`];
      const flag = harmFlag(L, th.t), d = Math.max(L.disc, 0.0101);
      console.log(`  ${h.id.padEnd(6)} W${w} vs ${arm.padEnd(4)}: loss ${sgn(L.loss)} (${L.lost} lost, ${L.saved} saved of ${L.n}); threshold ${th.t.toFixed(4)}: ${flag ? 'HARM' : 'no harm'}; discordance ${(100 * L.disc).toFixed(2)}% (sized at ${(100 * th.d).toFixed(2)}%), the rule's rates at it: ${harmRate(d, L.n, th.t, 0.25).toFixed(3)} at 0.25, ${harmRate(d, L.n, th.t, 1).toFixed(3)} at 1`);
      if (flag) flags.push(`${h.id} W${w} harm against ${arm}`);
    }
    const a = U[h.id]['APP/-'].main, rel = 100 * (meanOf(c.delivered) - meanOf(a.delivered)) / (meanOf(a.delivered) || 1);
    if (rel < SPEND_FLAG) flags.push(`${h.id} W${w} spending ${rel.toFixed(2)}% against APP`);
  }
  console.log(`FLAGGED: ${flags.length ? flags.join('; ') : 'none'}`);
  // reported
  console.log('\nREPORTED, NOT GATED');
  for (const w of WEIGHTS) {
    console.log(`  W${w} the replication on ${REPL.N} paths of ${REPL.seed} from its path ${REPL.skip}: A1 ${iv(replItems[w].A1)}, A2 ${iv(replItems[w].A2)}%, S1 ${iv(replItems[w].S1)} (spending delivered CAND less SHIP ${iv(replItems[w].S1spend)}%); ${['A1', 'A2', 'S1'].every(k => (replItems[w][k].lo > { A1: A1_BAR, A2: A2_BAR, S1: S1_BAR }[k]) === (items[w][k].lo > { A1: A1_BAR, A2: A2_BAR, S1: S1_BAR }[k])) ? 'each reads as on 7003' : 'NOT each as on 7003'}`);
    const ws = panel.map(h => { const c = U[h.id][`CAND/${w}`], s = { ...c.score }; return [wholeScore(c.main, c.Y, Number(w), s), wholeScore(U[h.id]['APP/-'].main, c.Y, Number(w), { ...s, floor: 0.8 }), wholeScore(U[h.id][`SHIP/${w}`].main, c.Y, Number(w), { ...s, floor: U[h.id][`SHIP/${w}`].score.floor })]; });
    console.log(`  W${w} the whole score: CAND less APP ${iv(byPath(ws.map(([c, a]) => i => c[i] - a[i]), POOL))}; CAND less SHIP ${iv(byPath(ws.map(([c, , s]) => i => c[i] - s[i]), POOL))}`);
    console.log(`  W${w} spending delivered over every year, CAND less SHIP: ${iv(spendingItem(panel.map(h => [U[h.id][`CAND/${w}`].main, U[h.id][`SHIP/${w}`].main]), POOL))}% (beside S1 ${iv(items[w].S1)} points)`);
    const sp = s1Parts(U, panel, w, POOL);
    // the review of 27 Oct (2, minor 1): arm A's search may take the full 25% lump sum, which the solver arms take from the plan
    // (every panel plan phased): A1 and A2 apart for the households where arm A takes it
    for (const [nm, hs] of lumpGroups(panel)) if (hs.length) console.log(`  W${w} A1 and A2 where arm A ${nm} (${hs.length}): survival ${iv(survivalItem(hs.map(h => [U[h.id][`CAND/${w}`].main, U[h.id]['APP/-'].main]), POOL))} points, spending delivered ${iv(spendingItem(hs.map(h => [U[h.id][`CAND/${w}`].main, U[h.id]['APP/-'].main]), POOL))}%`);
    console.log(`  W${w} S1's parts, survival (spending delivered CAND less SHIP beside): the library cohort (${sp.nLibrary}) ${sp.library ? `${iv(sp.library)} (${iv(sp.libSpend)}%)` : '-'}; the households whose reader reads no bridge year (${sp.nNoReader}) ${sp.noReader ? `${iv(sp.noReader)} (${iv(sp.noReaderSpend)}%)` : '-'}; an observed loss against SHIP over all their paths on ${sp.losers.length} of ${panel.length}${sp.losers.length ? ` (${sp.losers.join(', ')})` : ''}`);
  }
  console.log('  per household (W0.02 | W0.01): survival APP, SHIP, CAND; spending delivered CAND against APP and against SHIP; the estate CAND against APP; years below target; tax; end wealth median and unlucky tenth');
  for (const h of panel) {
    const a = U[h.id]['APP/-'], parts = WEIGHTS.map(w => { const c = U[h.id][`CAND/${w}`], s = U[h.id][`SHIP/${w}`]; return `SHIP ${(100 * meanOf(s.main.survived)).toFixed(2)} CAND ${(100 * meanOf(c.main.survived)).toFixed(2)} spend ${sgn(100 * (meanOf(c.main.delivered) / meanOf(a.main.delivered) - 1))}% vs SHIP ${sgn(100 * (meanOf(c.main.delivered) / meanOf(s.main.delivered) - 1))}% estate ${Math.round(meanOf(c.main.estate) - meanOf(a.main.estate))} below ${yearsBelow(c.main, c.Y).toFixed(2)} tax ${Math.round(meanOf(c.main.tax) - meanOf(a.main.tax))} end ${Math.round(quant(c.main.wealth, 0.5))}/${Math.round(quant(c.main.wealth, 0.1))}`; });
    console.log(`  ${h.id.padEnd(6)} ${h.cohort.padEnd(4)} APP ${(100 * meanOf(a.main.survived)).toFixed(2)} below ${yearsBelow(a.main, a.Y).toFixed(2)} end ${Math.round(quant(a.main.wealth, 0.5))}/${Math.round(quant(a.main.wealth, 0.1))} | ${parts.join(' | ')}`);
  }
  // FIXBR (7q)
  const fb = panel.filter(h => U[h.id]['CAND/0.02'].fixbrA);
  if (fb.length) {
    const nf = Math.min(...fb.map(h => U[h.id]['CAND/0.02'].fixbr.N)), fp = fb.map(h => [U[h.id]['CAND/0.02'].fixbrA, U[h.id]['CAND/0.02'].main]);
    console.log(`  FIXBR (7q, D35): the candidate following arm A's policy in the retired years before access, less the candidate, on ${fb.length} households, the first ${nf} paths: survival ${iv(survivalItem(fp, nf))} points, spending delivered ${iv(spendingItem(fp, nf))}%`);
    for (const h of fb) { const u = U[h.id]['CAND/0.02'], m = u.fixbr.N, cut = { survived: u.main.survived.subarray(0, m) }, L = lossOf(u.fixbrA, cut); console.log(`    ${h.id.padEnd(6)} ${u.fixbr.years.length} fixed years: ${sgn(-L.loss)} (${L.saved} saved, ${L.lost} lost of ${L.n}); spending ${sgn(100 * (meanOf(u.fixbrA.delivered) / meanOf(u.main.delivered, m) - 1))}%`); }
  }
  // the worlds and history (D35)
  for (const world of WORLDS) {
    const ws = panel.map(h => [{ survived: U[h.id]['CAND/0.02'].worldsA[world], delivered: U[h.id]['CAND/0.02'].worldsD[world] }, { survived: U[h.id]['APP/-'].worldsA[world], delivered: U[h.id]['APP/-'].worldsD[world] }]);
    console.log(`  the world ${world}${world === 'return-1' ? ' (D20 (9): the sensitivity to the returns)' : ''}: CAND/0.02 less APP, survival ${iv(survivalItem(ws, ROB_N))} points, spending delivered ${iv(spendingItem(ws, ROB_N))}% on ${ROB_N} paths`);
  }
  { const rows = panel.map(h => [U[h.id]['CAND/0.02'].histA, U[h.id]['APP/-'].histA]), n = rows[0][0].length;
    const hs = 100 * meanOf(panel.map(h => meanOf(U[h.id]['CAND/0.02'].histD) / (meanOf(U[h.id]['APP/-'].histD) || 1) - 1));
    console.log(`  history (${n} start years from ${U[panel[0].id]['APP/-'].hist.first}): survival CAND/0.02 ${(100 * meanOf(rows.map(([c]) => meanOf(c)))).toFixed(2)}%, APP ${(100 * meanOf(rows.map(([, a]) => meanOf(a)))).toFixed(2)}%; a household better under CAND ${rows.filter(([c, a]) => meanOf(c) > meanOf(a)).length}, worse ${rows.filter(([c, a]) => meanOf(c) < meanOf(a)).length}; spending delivered CAND against APP, the households' mean ${sgn(hs)}%`); }
  // the fidelity gaps: runPolicy beside the engine (7u-F's check)
  { const sol = panel.flatMap(h => ARMS.filter(k => k !== 'APP/-').map(k => [h.id, k, U[h.id][k].beside])), gaps = sol.filter(([, , b]) => b.engineOnly + b.policyOnly > 0);
    console.log(`  runPolicy beside the engine on the first ${BESIDE_N} paths of the ${sol.length} solver units: paths on which the two differ ${gaps.reduce((t, [, , b]) => t + b.engineOnly + b.policyOnly, 0)}${gaps.length ? ` (${gaps.map(([id, k, b]) => `${id} ${k} engine alone ${b.engineOnly}, runPolicy alone ${b.policyOnly}`).join('; ')})` : ''}`); }
  // the solve times
  const ratio = panel.map(h => U[h.id]['CAND/0.02'].solveSecs / U[h.id]['SHIP/0.02'].solveSecs).sort((x, y) => x - y);
  const hosts = [...new Set(Object.values(U).flatMap(Object.values).map(x => x.cpu || 'unrecorded'))];
  console.log(`  the solve, CAND/0.02 against SHIP/0.02 on one core under the run's load: the median x${ratio[Math.floor(ratio.length / 2)].toFixed(2)} (x${ratio[0].toFixed(2)} to x${ratio[ratio.length - 1].toFixed(2)}); gate 5 is MET on the split candidate (results-gate5.txt); the hosts: ${hosts.join('; ')}`);
}

/* planted cases: synthetic units, the gate's refusals, the items' and flags' edges, the outcome */
function planted() {
  const cases = [], n = 400, Y = 3;
  const mk = (bits, deliv = 100) => ({ survived: Uint8Array.from(bits), delivered: Float32Array.from(bits, () => deliv), estate: new Float32Array(bits.length), wealth: new Float32Array(bits.length), unmet: new Float32Array(bits.length), tax: new Float32Array(bits.length), failYear: new Int16Array(bits.length).fill(-1), level: new Uint8Array(bits.length * Y).fill(100) });
  const ones = Array(n).fill(1), stamp = { code: 'c', audit: 'a', candidate: CANDIDATE, node: 'v22', prediction: REGISTRATION, sha: 's' }, logs = { code: 'c', audit: 'a', sha: 's' };
  const shared = w => `mix 3 lambda 0.02 bequestWeight ${w} levels 1,0.8 finalIntegral true raiseW 0.003 minPot 0 plan p1 inputs i1`;
  const unit = (id, arm, w, extra = {}) => { const robust = `${arm}/${w}` === 'APP/-' || `${arm}/${w}` === 'CAND/0.02';
    return { id, arm, w, seed: SEED, N: n, Y, bridge: 0, target: 1000, inputs: 'i1', readerYears: arm === 'APP' ? null : 0, stamp, main: mk(ones), repl: { seed: REPL.seed, skip: REPL.skip, N: REPL.N }, replA: mk(ones), fixbr: null,
      beside: arm === 'APP' ? null : { N: Math.min(n, BESIDE_N), engineOnly: 0, policyOnly: 0 },
      worlds: robust ? { N: ROB_N } : null, worldsA: robust ? Object.fromEntries(WORLDS.map(x => [x, new Uint8Array(1)])) : null, worldsD: robust ? Object.fromEntries(WORLDS.map(x => [x, new Float32Array(1)])) : null,
      hist: robust ? { first: 1928 } : null, histA: robust ? new Uint8Array(1) : null, histD: robust ? new Float32Array(1) : null,
      ran: arm === 'CAND' ? `pts 45 grid total45 bridgeRead reader readerRef adaptive tiersBelow 3 tableDealing false actions 800 ${shared(w)} readerYears 0` : arm === 'SHIP' ? `pts 30 grid total30 bridgeRead false tiersBelow 2 tableDealing true actions 360 ${shared(w)} readerYears 0` : 'arm A x guardrails true lookahead 5 raiseCap 1.1 minPot 0 target 1000 floor 800 inputs i1', ...extra }; };
  const full = (id = 'H1') => ({ [id]: Object.fromEntries(ARMS.map(k => { const [a, w] = k.split('/'); return [k, unit(id, a, w)]; })) });
  const panel = [{ id: 'H1', target: 1000, cohort: 'lib' }], paths = { H1: n };
  cases.push(['a complete synthetic panel passes the gate', `${gate(full(), panel, paths, logs).length}`, '0']);
  { const U = full(); delete U.H1['SHIP/0.01']; cases.push(['a missing unit is refused', `${gate(U, panel, paths).some(p => /no SHIP\/0.01/.test(p))}`, 'true']); }
  { const U = full(); U.H1['APP/-'].repl = { ...U.H1['APP/-'].repl, skip: 0 }; cases.push(["a replication on 7018's first paths (a smoke run scored them) is refused", `${gate(U, panel, paths, logs).some(p => /from its path 0/.test(p))}`, 'true']); }
  { const U = full(); U.H1['CAND/0.01'].N = 300; cases.push(['paths other than registered are refused', `${gate(U, panel, paths).some(p => /300 paths/.test(p))}`, 'true']); }
  { const U = full(); U.H1['APP/-'].stamp = { ...stamp, code: 'other' }; cases.push(['two codes are refused', `${gate(U, panel, paths).some(p => /2 stamps/.test(p))}`, 'true']); }
  { const U = full(); U.H1['CAND/0.02'].bridge = 3; U.H1['APP/-'].bridge = 3; cases.push(['FIXBR missing on a household with bridge years is refused', `${gate(U, panel, paths).some(p => /FIXBR missing/.test(p))}`, 'true']); }
  { const U = full(); U.H1['CAND/0.01'].ran = U.H1['CAND/0.01'].ran.replace('tiersBelow 3', 'tiersBelow 2'); cases.push(['a candidate unit run without the third step is refused', `${gate(U, panel, paths).some(p => /tiersBelow 3/.test(p))}`, 'true']); }
  cases.push(["a panel whose cohort label is not phase4-panel.mjs's ('library' for 'lib') is refused", `${gate(full(), [{ ...panel[0], cohort: 'library' }], paths, logs).some(p => /cohort library/.test(p))}`, 'true']);
  // the review of 27 Oct (findings 1, 4, 9): the plan, the target, the stamps, the settings diff, runPolicy beside
  { const U = full(); U.H1['APP/-'].inputs = 'i2'; cases.push(["APP's inputs (balances, contributions) other than CAND's are refused", `${gate(U, panel, paths, logs).some(p => /the arms' inputs differ/.test(p))}`, 'true']); }
  { const U = full(); U.H1['SHIP/0.02'].target = 990; cases.push(["a unit whose engine ran another target than the panel's is refused", `${gate(U, panel, paths, logs).some(p => /target 990/.test(p))}`, 'true']); }
  { const U = full(); for (const k of ARMS) U.H1[k].stamp = { ...stamp, prediction: 'NOT-LAUNCHED' }; cases.push(['units stamped outside the registration are refused (one stamp across them)', `${gate(U, panel, paths, logs).some(p => /stamped under NOT-LAUNCHED/.test(p))}`, 'true']); }
  { const U = full(); for (const k of ARMS) U.H1[k].stamp = { ...stamp, sha: 'other' }; cases.push(["units whose registration blob is not the logs' are refused", `${gate(U, panel, paths, logs).some(p => /not the logs'/.test(p))}`, 'true']); }
  { const U = full(); U.H1['SHIP/0.01'].ran = U.H1['SHIP/0.01'].ran.replace('plan p1', 'plan p2'); cases.push(["CAND and SHIP on different plans at a weight are refused", `${gate(U, panel, paths, logs).some(p => /W0.01: CAND's plan p1, SHIP's p2/.test(p))}`, 'true']); }
  { const U = full(); U.H1['CAND/0.01'].ran = U.H1['CAND/0.01'].ran.replace('actions 800', 'actions 720'); cases.push(["the candidate's two weights differing in more than the weight are refused", `${gate(U, panel, paths, logs).some(p => /CAND: W0.02's actions 800, W0.01's 720/.test(p))}`, 'true']); }
  { const U = full(); U.H1['APP/-'].ran = U.H1['APP/-'].ran.replace('minPot 0', 'minPot 5'); cases.push(["APP's minimum pot other than the solver's is refused", `${gate(U, panel, paths, logs).some(p => /APP's minimum pot 5/.test(p))}`, 'true']); }
  { const U = full(); U.H1['SHIP/0.02'].beside = null; cases.push(['a solver unit without runPolicy beside is refused', `${gate(U, panel, paths, logs).some(p => /runPolicy beside missing/.test(p))}`, 'true']); }
  { const U = full(); U.H1['CAND/0.02'].worldsD['vol+25'] = null; cases.push(["a world's spending missing is refused", `${gate(U, panel, paths, logs).some(p => /their spending\) missing/.test(p))}`, 'true']); }
  { const U = full(); cases.push(["units launched on other files than the read takes (the stamp's audit hash) are refused", `${gate(U, panel, paths, logs, 'zz').some(p => /launched on files hashing a; the files this read takes/.test(p))} ${gate(U, panel, paths, logs, 'a').length}`, 'true 0']); }
  { const g = lumpGroups([{ id: 'A', label: 'ISA First, lump sum' }, { id: 'B', label: 'Bracket Fill Basic' }, { id: 'C' }]); cases.push(['the lump-sum split: by arm A\'s label, every household in one group', `${g[0][1].map(h => h.id)} ${g[1][1].map(h => h.id).join('')}`, 'A BC']); }
  // S1's parts (finding 7): gains on a FIRE household with bridge years masking a loss on a library household the reader never reads
  { const U = { ...full('L1'), ...full('F1') }, pn = [{ id: 'L1', cohort: 'lib' }, { id: 'F1', cohort: 'fire' }];
    U.L1['CAND/0.02'].main = mk(ones.map((_, i) => (i < 4 ? 0 : 1)));
    U.F1['SHIP/0.02'].main = mk(ones.map((_, i) => (i < 40 ? 0 : 1))); U.F1['CAND/0.02'].readerYears = 6;
    const all = survivalItem(pn.map(h => [U[h.id]['CAND/0.02'].main, U[h.id]['SHIP/0.02'].main]), n), sp = s1Parts(U, pn, '0.02', n);
    cases.push(["S1's parts: pooled +4.5 passes, the library cohort and the households the reader never reads -1.0 each, one household with an observed loss; a panel with no library household has no library part", `${all.d.toFixed(1)} ${sp.library.d.toFixed(1)} ${sp.nNoReader} ${sp.noReader.d.toFixed(1)} ${sp.losers.join(',')} ${s1Parts(U, [pn[1]], '0.02', n).library}`, '4.5 -1.0 1 -1.0 L1 null']); }
  // the items' edges: a survival change of exactly 0 everywhere has lower end 0, which does not pass A1 (it must be above)
  { const z = survivalItem([[mk(ones), mk(ones)]], n); cases.push(['no change: A1\'s lower end 0 does not pass', `${z.lo > A1_BAR}`, 'false']); }
  { const c = ones.map((_, i) => (i % 10 === 0 ? 1 : 1)), o = ones.map((_, i) => (i % 10 === 0 ? 0 : 1)); const r = survivalItem([[mk(c), mk(o)]], n); cases.push(['10% saved and none lost: A1 passes', `${r.lo > A1_BAR} ${r.d.toFixed(1)}`, 'true 10.0']); }
  { const r = spendingItem([[mk(ones, 98.9), mk(ones, 100)]], n); cases.push(['spending 1.1% lower on every path: A2 fails (lower end below -1)', `${r.lo > A2_BAR}`, 'false']); }
  { const r = spendingItem([[mk(ones, 99.1), mk(ones, 100)]], n); cases.push(['spending 0.9% lower on every path: A2 passes', `${r.lo > A2_BAR}`, 'true']); }
  // the harm flag at its threshold: 3 more lost than saved of 400 is a loss of 0.75 points
  { const c = ones.map((_, i) => (i < 3 ? 0 : 1)), L = lossOf(mk(c), mk(ones)); cases.push(['a loss exactly at the threshold is not harm; one path more is', `${harmFlag(L, 0.75)} ${harmFlag(L, 0.749)}`, 'false true']); }
  // the outcome
  { const ok = { A1: { lo: 0.01 }, A2: { lo: -0.5 }, S1: { lo: -0.05 } }, bad = { ...ok, S1: { lo: -0.1 } };
    cases.push(['all three at both weights: PASS; S1 at exactly -0.1 at one weight: NOT PASSED', `${decide({ '0.02': ok, '0.01': ok }).outcome} | ${decide({ '0.02': ok, '0.01': bad }).outcome}`, 'PASS | NOT PASSED']); }
  // the whole score: a failed path's years after failure cost the floor's, not their own level
  { const A = mk([0, 1]); A.failYear[0] = 1; A.level.set([100, 120, 120, 100, 100, 100]); const s = wholeScore(A, Y, 0.02, { lambda: 0.1, floor: 0.8, cap: 1, scale: 1 });
    cases.push(['the whole score: a path failed in year 1 pays the floor\'s cost for years 1 and 2; one alive scores 100 plus its estate', `${s[0].toFixed(4)} ${s[1].toFixed(4)}`, `${(-100 * 2 * 0.1 * 0.04).toFixed(4)} 100.0000`]); }
  let bad = 0;
  for (const [nm, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log('EDGES: a lower end of exactly 0 (A1) and exactly -0.1 (S1), spending 0.9% and 1.1% lower (A2), a loss exactly at the threshold, a missing unit, a failed path\'s years, a missing world\'s spending, an empty cohort part');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  if (planted()) process.exit(1);
  await read(process.argv[2] || join(HERE, 'results', 'diagp4'));
}
