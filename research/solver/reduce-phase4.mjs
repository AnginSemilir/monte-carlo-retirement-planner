/*
 * PHASE 4'S READ (registrations/phase-4.md; audit-phase4.mjs; STATE.md D33 to D35, D34 the harm rule), once, after its gate:
 *   - provenance (fair-gate.mjs requireFairLogs): every unit's log stamped by the launcher under the registration, the
 *     registration unedited since, one code across the logs;
 *   - the units: every household of phase4-panel.json in every arm (APP; CAND and SHIP at 0.02 and 0.01), one code, one
 *     audit, the candidate fcd8096217b7 and one Node version on every unit, seed 7003 on each household's registered paths
 *     (phase4-paths.json), the replication on 4,000 paths of 7018, the three worlds on 2,000 paths and history on APP and
 *     CAND/0.02, FIXBR on CAND/0.02 (the first 8,000 paths) exactly where the household has retired years before access, each arm's settings as
 *     Phase 4's, and the household's target, minimum pot and horizon the same in every arm.
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
 *   - spending: a household delivering more than 5% less over every year than under the app's rules.
 * REPORTED: the whole score on every path (the solver's objective at the weight, the app's rules scored the same way),
 *   the estate, unmet spending, tax, the years below target, the end wealth's median and unlucky tenth; FIXBR less CAND
 *   (7q, D35); the three worlds and history (D35); the replication on 7018 (A1, A2 and S1 again); each household's
 *   discordance as realised and D34's rates at it; the solve times (under the run's load).
 *   node research/solver/reduce-phase4.mjs [dir] > research/solver/results-phase4.txt
 *   node research/solver/reduce-phase4.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { harmRate } from './size-phase4.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REGISTRATION = 'research/solver/registrations/phase-4.md';
export const WEIGHTS = ['0.02', '0.01'], ARMS = ['APP/-', 'CAND/0.02', 'CAND/0.01', 'SHIP/0.02', 'SHIP/0.01'];
export const POOL = 16000, A1_BAR = 0, A2_BAR = -1, S1_BAR = -0.1, SPEND_FLAG = -5, MU = 0.003, Z = 1.959963984540054;
export const SEED = 7003, REPL = { seed: 7018, N: 4000 }, ROB_N = 2000, FIXBR_N = 8000, CANDIDATE = 'fcd8096217b7', WORLDS = ['return-1', 'vol+25', 'left-tail'];

const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const arraysOf = x => x && { survived: dec(x.survived, Uint8Array), estate: dec(x.estate, Float32Array), wealth: dec(x.wealth, Float32Array), delivered: dec(x.delivered, Float32Array), unmet: dec(x.unmet, Float32Array), tax: dec(x.tax, Float32Array), failYear: dec(x.failYear, Int16Array), level: dec(x.level, Uint8Array) };
export function loadDir(dir) {
  const U = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) {
    const j = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString());
    (U[j.id] ||= {})[`${j.arm}/${j.w}`] = { ...j, main: arraysOf(j.main), replA: arraysOf(j.repl), fixbrA: arraysOf(j.fixbr),
      worldsA: j.worlds ? Object.fromEntries(WORLDS.map(w => [w, j.worlds[w] ? dec(j.worlds[w], Uint8Array) : null])) : null, histA: j.hist && j.hist.bits ? dec(j.hist.bits, Uint8Array) : null };
  }
  return U;
}

/* the gate over the units: every problem, so a refusal names them all */
export function gate(U, panel, paths) {
  const P = [], stamps = new Set();
  for (const h of panel) {
    const u = U[h.id] || {};
    for (const k of ARMS) if (!u[k]) P.push(`${h.id}: no ${k} unit`);
    const got = ARMS.map(k => u[k]).filter(Boolean);
    for (const x of got) {
      const k = `${x.arm}/${x.w}`;
      stamps.add(JSON.stringify(x.stamp));
      if (x.seed !== SEED) P.push(`${h.id} ${k}: seed ${x.seed}`);
      if (x.N !== paths[h.id] || x.main.survived.length !== x.N) P.push(`${h.id} ${k}: ${x.N} paths, registered ${paths[h.id]}`);
      if (!x.repl || x.repl.seed !== REPL.seed || x.repl.N !== REPL.N) P.push(`${h.id} ${k}: the replication ${x.repl ? `${x.repl.N} paths of ${x.repl.seed}` : 'missing'}`);
      if (x.target !== h.target) P.push(`${h.id} ${k}: target ${x.target}, the panel's ${h.target}`);
      if (x.stamp.candidate !== CANDIDATE) P.push(`${h.id} ${k}: candidate ${x.stamp.candidate}`);
      const robust = k === 'APP/-' || k === 'CAND/0.02';
      if (robust && (!x.worlds || x.worlds.N !== ROB_N || WORLDS.some(w => !x.worldsA[w]) || !x.histA)) P.push(`${h.id} ${k}: the worlds or history missing`);
      if (!robust && (x.worlds || x.hist)) P.push(`${h.id} ${k}: worlds or history where none belong`);
      if (k === 'CAND/0.02' && (x.bridge > 0) !== !!x.fixbr) P.push(`${h.id} ${k}: FIXBR ${x.fixbr ? 'present' : 'missing'} with ${x.bridge} retired years before access`);
      if (x.fixbr && x.fixbr.N !== Math.min(x.N, FIXBR_N)) P.push(`${h.id} ${k}: FIXBR on ${x.fixbr.N} paths, not ${Math.min(x.N, FIXBR_N)}`);
      if (k !== 'CAND/0.02' && x.fixbr) P.push(`${h.id} ${k}: FIXBR where none belongs`);
      const want = x.arm === 'CAND' ? ['pts 45', 'bridgeRead reader', 'readerRef adaptive', 'tiersBelow 3', 'tableDealing false', `bequestWeight ${x.w}`] : x.arm === 'SHIP' ? ['pts 30', 'bridgeRead false', 'tiersBelow 2', 'tableDealing true', `bequestWeight ${x.w}`] : ['guardrails true', 'lookahead 5', 'raiseCap 1.1'];
      for (const s of want) if (!` ${x.ran} `.includes(` ${s} `)) P.push(`${h.id} ${k}: ran without "${s}"`);
    }
    if (got.length && new Set(got.map(x => `${x.Y} ${x.bridge}`)).size > 1) P.push(`${h.id}: the arms' horizons or bridges differ`);
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
  const panel = JSON.parse(readFileSync(join(HERE, 'phase4-panel.json'), 'utf8')).panel, reg = JSON.parse(readFileSync(join(HERE, 'phase4-paths.json'), 'utf8'));
  const U = loadDir(dir), problems = gate(U, panel, reg.paths);
  const any = Object.values(U).flatMap(Object.values)[0];
  console.log(`PHASE 4 READ: ${dir}; ${Object.keys(U).length} households; stamp ${any ? JSON.stringify(any.stamp) : '-'}`);
  if (problems.length) { console.log(`THE GATE: REFUSED (${problems.length})\n  ${problems.join('\n  ')}`); process.exit(1); }
  console.log(`the gate: fair - ${panel.length} households in every arm, seed ${SEED} on their registered paths (${Math.min(...Object.values(reg.paths))} to ${Math.max(...Object.values(reg.paths))}), the replication ${REPL.N} paths of ${REPL.seed}, one stamp`);
  const items = {}, replItems = {};
  for (const w of WEIGHTS) {
    const C = h => U[h.id][`CAND/${w}`], A = h => U[h.id]['APP/-'], S = h => U[h.id][`SHIP/${w}`];
    items[w] = { A1: survivalItem(panel.map(h => [C(h).main, A(h).main]), POOL), A2: spendingItem(panel.map(h => [C(h).main, A(h).main]), POOL), S1: survivalItem(panel.map(h => [C(h).main, S(h).main]), POOL) };
    replItems[w] = { A1: survivalItem(panel.map(h => [C(h).replA, A(h).replA]), REPL.N), A2: spendingItem(panel.map(h => [C(h).replA, A(h).replA]), REPL.N), S1: survivalItem(panel.map(h => [C(h).replA, S(h).replA]), REPL.N) };
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
    console.log(`  W${w} the replication on ${REPL.N} paths of ${REPL.seed}: A1 ${iv(replItems[w].A1)}, A2 ${iv(replItems[w].A2)}%, S1 ${iv(replItems[w].S1)}; ${['A1', 'A2', 'S1'].every(k => (replItems[w][k].lo > { A1: A1_BAR, A2: A2_BAR, S1: S1_BAR }[k]) === (items[w][k].lo > { A1: A1_BAR, A2: A2_BAR, S1: S1_BAR }[k])) ? 'each reads as on 7003' : 'NOT each as on 7003'}`);
    const ws = panel.map(h => { const c = U[h.id][`CAND/${w}`], s = { ...c.score }; return [wholeScore(c.main, c.Y, Number(w), s), wholeScore(U[h.id]['APP/-'].main, c.Y, Number(w), { ...s, floor: 0.8 }), wholeScore(U[h.id][`SHIP/${w}`].main, c.Y, Number(w), { ...s, floor: U[h.id][`SHIP/${w}`].score.floor })]; });
    console.log(`  W${w} the whole score: CAND less APP ${iv(byPath(ws.map(([c, a]) => i => c[i] - a[i]), POOL))}; CAND less SHIP ${iv(byPath(ws.map(([c, , s]) => i => c[i] - s[i]), POOL))}`);
  }
  console.log('  per household (W0.02 | W0.01): survival APP, SHIP, CAND; spending delivered and the estate CAND against APP; years below target; tax; end wealth median and unlucky tenth');
  for (const h of panel) {
    const a = U[h.id]['APP/-'], parts = WEIGHTS.map(w => { const c = U[h.id][`CAND/${w}`], s = U[h.id][`SHIP/${w}`]; return `SHIP ${(100 * meanOf(s.main.survived)).toFixed(2)} CAND ${(100 * meanOf(c.main.survived)).toFixed(2)} spend ${sgn(100 * (meanOf(c.main.delivered) / meanOf(a.main.delivered) - 1))}% estate ${Math.round(meanOf(c.main.estate) - meanOf(a.main.estate))} below ${yearsBelow(c.main, c.Y).toFixed(2)} tax ${Math.round(meanOf(c.main.tax) - meanOf(a.main.tax))} end ${Math.round(quant(c.main.wealth, 0.5))}/${Math.round(quant(c.main.wealth, 0.1))}`; });
    console.log(`  ${h.id.padEnd(6)} ${h.cohort.padEnd(4)} APP ${(100 * meanOf(a.main.survived)).toFixed(2)} below ${yearsBelow(a.main, a.Y).toFixed(2)} end ${Math.round(quant(a.main.wealth, 0.5))}/${Math.round(quant(a.main.wealth, 0.1))} | ${parts.join(' | ')}`);
  }
  // FIXBR (7q)
  const fb = panel.filter(h => U[h.id]['CAND/0.02'].fixbrA);
  if (fb.length) {
    console.log(`  FIXBR (7q, D35): the candidate following arm A's policy in the retired years before access, less the candidate, on ${fb.length} households, the first ${FIXBR_N} paths: ${iv(survivalItem(fb.map(h => [U[h.id]['CAND/0.02'].fixbrA, U[h.id]['CAND/0.02'].main]), FIXBR_N))} points`);
    for (const h of fb) { const L = lossOf(U[h.id]['CAND/0.02'].fixbrA, U[h.id]['CAND/0.02'].main); console.log(`    ${h.id.padEnd(6)} ${U[h.id]['CAND/0.02'].fixbr.years.length} fixed years: ${sgn(-L.loss)} (${L.saved} saved, ${L.lost} lost of ${L.n})`); }
  }
  // the worlds and history (D35)
  for (const world of WORLDS) console.log(`  the world ${world}: CAND/0.02 less APP ${iv(byPath(panel.map(h => i => 100 * (U[h.id]['CAND/0.02'].worldsA[world][i] - U[h.id]['APP/-'].worldsA[world][i])), ROB_N))} points on ${ROB_N} paths`);
  { const rows = panel.map(h => [U[h.id]['CAND/0.02'].histA, U[h.id]['APP/-'].histA]), n = rows[0][0].length;
    console.log(`  history (${n} start years from ${U[panel[0].id]['APP/-'].hist.first}): survival CAND/0.02 ${(100 * meanOf(rows.map(([c]) => meanOf(c)))).toFixed(2)}%, APP ${(100 * meanOf(rows.map(([, a]) => meanOf(a)))).toFixed(2)}%; a household better under CAND ${rows.filter(([c, a]) => meanOf(c) > meanOf(a)).length}, worse ${rows.filter(([c, a]) => meanOf(c) < meanOf(a)).length}`); }
  // the solve times
  const ratio = panel.map(h => U[h.id]['CAND/0.02'].solveSecs / U[h.id]['SHIP/0.02'].solveSecs).sort((x, y) => x - y);
  console.log(`  the solve, CAND/0.02 against SHIP/0.02 on one core under the run's load: the median x${ratio[Math.floor(ratio.length / 2)].toFixed(2)} (x${ratio[0].toFixed(2)} to x${ratio[ratio.length - 1].toFixed(2)}); gate 5 is MET on the split candidate (results-gate5.txt)`);
}

/* planted cases: synthetic units, the gate's refusals, the items' and flags' edges, the outcome */
function planted() {
  const cases = [], n = 400, Y = 3;
  const mk = (bits, deliv = 100) => ({ survived: Uint8Array.from(bits), delivered: Float32Array.from(bits, () => deliv), estate: new Float32Array(bits.length), wealth: new Float32Array(bits.length), unmet: new Float32Array(bits.length), tax: new Float32Array(bits.length), failYear: new Int16Array(bits.length).fill(-1), level: new Uint8Array(bits.length * Y).fill(100) });
  const ones = Array(n).fill(1), stamp = { code: 'c', audit: 'a', candidate: CANDIDATE, node: 'v22', prediction: REGISTRATION, sha: 's' };
  const unit = (id, arm, w, extra = {}) => { const robust = `${arm}/${w}` === 'APP/-' || `${arm}/${w}` === 'CAND/0.02';
    return { id, arm, w, seed: SEED, N: n, Y, bridge: 0, target: 1000, stamp, main: mk(ones), repl: { seed: REPL.seed, N: REPL.N }, replA: mk(ones), fixbr: null,
      worlds: robust ? { N: ROB_N } : null, worldsA: robust ? Object.fromEntries(WORLDS.map(x => [x, new Uint8Array(1)])) : null, hist: robust ? { first: 1928 } : null, histA: robust ? new Uint8Array(1) : null,
      ran: arm === 'CAND' ? `pts 45 bridgeRead reader readerRef adaptive tiersBelow 3 tableDealing false bequestWeight ${w}` : arm === 'SHIP' ? `pts 30 bridgeRead false tiersBelow 2 tableDealing true bequestWeight ${w}` : 'arm A x guardrails true lookahead 5 raiseCap 1.1', ...extra }; };
  const full = () => ({ H1: Object.fromEntries(ARMS.map(k => { const [a, w] = k.split('/'); return [k, unit('H1', a, w)]; })) });
  const panel = [{ id: 'H1', target: 1000 }], paths = { H1: n };
  cases.push(['a complete synthetic panel passes the gate', `${gate(full(), panel, paths).length}`, '0']);
  { const U = full(); delete U.H1['SHIP/0.01']; cases.push(['a missing unit is refused', `${gate(U, panel, paths).some(p => /no SHIP\/0.01/.test(p))}`, 'true']); }
  { const U = full(); U.H1['CAND/0.01'].N = 300; cases.push(['paths other than registered are refused', `${gate(U, panel, paths).some(p => /300 paths/.test(p))}`, 'true']); }
  { const U = full(); U.H1['APP/-'].stamp = { ...stamp, code: 'other' }; cases.push(['two codes are refused', `${gate(U, panel, paths).some(p => /2 stamps/.test(p))}`, 'true']); }
  { const U = full(); U.H1['CAND/0.02'].bridge = 3; U.H1['APP/-'].bridge = 3; cases.push(['FIXBR missing on a household with bridge years is refused', `${gate(U, panel, paths).some(p => /FIXBR missing/.test(p))}`, 'true']); }
  { const U = full(); U.H1['CAND/0.01'].ran = U.H1['CAND/0.01'].ran.replace('tiersBelow 3', 'tiersBelow 2'); cases.push(['a candidate unit run without the third step is refused', `${gate(U, panel, paths).some(p => /tiersBelow 3/.test(p))}`, 'true']); }
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
  console.log('EDGES: a lower end of exactly 0 (A1) and exactly -0.1 (S1), spending 0.9% and 1.1% lower (A2), a loss exactly at the threshold, a missing unit, a failed path\'s years');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  if (planted()) process.exit(1);
  await read(process.argv[2] || join(HERE, 'results', 'diagp4'));
}
