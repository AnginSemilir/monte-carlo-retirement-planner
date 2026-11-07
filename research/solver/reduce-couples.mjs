/*
 * PART D, D4'S READ (registrations/couples-d4.md; audit-couples.mjs; STATE.md D34 the harm rule), once, after its gate:
 *   - provenance (fair-gate.mjs requireFairLogs): every unit's log stamped by the launcher under the registration, the
 *     registration unedited since, one code across the logs;
 *   - the units: every couple of couples-panel.json in every arm (APP; CANDC and SHIPC at 0.02 and 0.01), one stamp, seed SEED
 *     on the registered paths (couples-paths.json), each arm's settings as the registration's (each person's run record), the
 *     couple's target and minimum pot the panel's, a couple's five units on one inputs hash (each engine context but the
 *     policy's own fields: the arms differ in the decumulation rule alone), and the couples' rollout beside the engine on the
 *     first 500 paths of each solver unit (the fidelity gaps are reported);
 *   - each unit's stamp under the registration, its code, audit and registration blob the logs' own, and its audit hash that
 *     of the files this read takes (audit-couples.mjs stampFilesHash: the audit's files, the panel, the paths and this reducer).
 * THE DECISION, at each estate weight (both must pass), on every couple's registered paths, each path's change averaged over
 * the 40 couples and the 95% interval taken from the spread across paths (Phase 4's rule, reduce-phase4.mjs byPath):
 *   A1 survival against the app's rules, CANDC less APP, in points: passes when the interval's lower end is above 0;
 *   A2 spending delivered over every year, CANDC less APP as a share of the couple's mean under APP, in %: passes when the
 *      lower end is above -1;
 *   S1 survival against the product's settings, CANDC less SHIPC, in points: passes when the lower end is above -0.1.
 *   PASS: all three at both weights: the candidate for couples goes to the maintainer, who decides whether couples run it under
 *   Part C's switch (D42 holds until then). NOT PASSED: the items that failed and by how much; couples keep the app's rules
 *   under the switch, and nothing is tuned until it passes.
 * FLAGS, for investigation whatever the outcome; none blocks on its own (D34 (3)):
 *   - harm against APP and against SHIPC, per couple and weight: the observed loss over the couple's paths above its
 *     threshold, set from its own realised discordance (the Clopper-Pearson upper 95% bound) at its paths by Phase 4's exact
 *     rates (size-phase4.mjs thresholdFor: a quarter-point loss read as harm at most 5% of the time; the rate at a 1-point
 *     loss printed beside it), the rule fixed in couples-paths.json before the run;
 *   - spending: a couple delivering more than 5% less over every year than under the app's rules.
 * REPORTED (no survival figure without the spending delivered beside it): spending delivered CANDC less SHIPC; the cost
 * years' spending delivered (each one-off cost's year) CANDC less APP and less SHIPC; A1 and A2 apart where arm A takes the
 * full lump sum; S1 over each cohort; the estate, unmet spending and tax; the fidelity gaps; the solve times and the hosts.
 *   node research/solver/reduce-couples.mjs [dir] > research/solver/results-couples-d4.txt
 *   node research/solver/reduce-couples.mjs --planted
 */
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalItem, spendingItem, lossOf, harmFlag, lumpGroups, kvOf } from './reduce-phase4.mjs';
import { thresholdFor, harmRate } from './size-phase4.mjs';
import { clopperPearson } from './stats.mjs';
import { LOG_STAMP } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REGISTRATION = 'research/solver/registrations/couples-d4.md', SEED = 7021, BESIDE_N = 500;
export const COHORTS = ['lib', 'young'], WEIGHTS = ['0.02', '0.01'], ARMS = ['APP/-', 'CANDC/0.02', 'CANDC/0.01', 'SHIPC/0.02', 'SHIPC/0.01'];
export const A1_BAR = 0, A2_BAR = -1, S1_BAR = -0.1, SPEND_FLAG = -5;
/* what each solver arm's run record must say (each person's), as audit-couples.mjs WANT */
export const WANT = { CANDC: ['pts 45', 'bridgeRead reader', 'readerRef adaptive', 'tiersBelow 3', 'tableDealing false', 'switchCharge 0.001', 'failDelivered true'], SHIPC: ['pts 30', 'bridgeRead false', 'tiersBelow 2', 'tableDealing true', 'failDelivered false'] };

const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const arraysOf = x => x && { survived: dec(x.survived, Uint8Array), estate: dec(x.estate, Float32Array), wealth: dec(x.wealth, Float32Array), delivered: dec(x.delivered, Float32Array), unmet: dec(x.unmet, Float32Array), tax: dec(x.tax, Float32Array), failYear: dec(x.failYear, Int16Array), costDelivered: dec(x.costDelivered, Float32Array) };
export function loadDir(dir) {
  const U = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) {
    const j = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString());
    (U[j.id] ||= {})[`${j.arm}/${j.w}`] = { ...j, main: arraysOf(j.main), besideA: j.beside ? dec(j.beside.survived, Uint8Array) : null };
  }
  return U;
}
/* the gate over the units: every problem, so a refusal names them all */
export function gate(U, panel, paths, logs = null, files = null) {
  const P = [], stamps = new Set();
  for (const h of panel) {
    const u = U[h.id] || {};
    if (!COHORTS.includes(h.cohort)) P.push(`${h.id}: cohort ${h.cohort}`);
    for (const k of ARMS) if (!u[k]) P.push(`${h.id}: no ${k} unit`);
    const got = ARMS.map(k => u[k]).filter(Boolean);
    for (const x of got) {
      const k = `${x.arm}/${x.w}`;
      stamps.add(JSON.stringify(x.stamp));
      if (x.seed !== SEED) P.push(`${h.id} ${k}: seed ${x.seed}`);
      if (x.N !== paths[h.id] || x.main.survived.length !== x.N) P.push(`${h.id} ${k}: ${x.N} paths, registered ${paths[h.id]}`);
      if (x.target !== h.target) P.push(`${h.id} ${k}: target ${x.target}, the panel's ${h.target}`);
      if (x.stamp.prediction !== REGISTRATION) P.push(`${h.id} ${k}: stamped under ${x.stamp.prediction}, not ${REGISTRATION}`);
      if (files && x.stamp.audit !== files) P.push(`${h.id} ${k}: launched on files hashing ${x.stamp.audit}; the files this read takes hash ${files}`);
      if (logs && ['code', 'audit', 'sha'].some(f => x.stamp[f] !== logs[f])) P.push(`${h.id} ${k}: its stamp not the logs'`);
      if (!x.inputs) P.push(`${h.id} ${k}: no inputs hash`);
      if (x.arm !== 'APP') {
        if (!x.beside || x.beside.N !== Math.min(x.N, BESIDE_N)) P.push(`${h.id} ${k}: the rollout beside ${x.beside ? `on ${x.beside.N} paths` : 'missing'}, not on ${Math.min(x.N, BESIDE_N)}`);
        for (const who of ['self', 'part']) {
          const m = new RegExp(`${who}: (.*?)(?: \\| |$)`).exec(x.ran), line = m ? ` ${m[1]} ` : '';
          for (const s of [...WANT[x.arm], `bequestWeight ${Number(x.w)}`]) if (!line.includes(` ${s} `)) P.push(`${h.id} ${k} ${who}: ran without "${s}"`);
        }
      }
    }
    if (got.length && new Set(got.map(x => x.Y)).size > 1) P.push(`${h.id}: the arms' horizons differ`);
    if (got.length && new Set(got.map(x => x.inputs)).size > 1) P.push(`${h.id}: the arms' inputs differ (${got.map(x => `${x.arm}/${x.w} ${x.inputs}`).join(', ')})`);
    if (got.length && new Set(got.map(x => JSON.stringify(x.costYears))).size > 1) P.push(`${h.id}: the arms' cost years differ`);
    // an arm's two weights differ in the estate weight alone (CHECKLIST 3)
    // person by person: each person's settings at the two weights the same but for the estate weight
    const personOf = (ran, who) => { const m = new RegExp(`${who}: (.*?)(?: \\| |$)`).exec(ran); return kvOf((m ? m[1] : '').replace(/bequestWeight \S+/g, '')); };
    for (const arm of ['CANDC', 'SHIPC']) { const a = u[`${arm}/0.02`], b = u[`${arm}/0.01`]; if (!a || !b) continue; for (const who of ['self', 'part']) { const x = personOf(a.ran, who), y = personOf(b.ran, who); for (const f of new Set([...Object.keys(x), ...Object.keys(y)])) if (x[f] !== y[f]) P.push(`${h.id} ${arm} ${who}: its two weights differ in ${f} (${x[f]}, ${y[f]})`); } }
  }
  if (stamps.size > 1) P.push(`${stamps.size} stamps across the units (one code, audit, registration and Node version wanted)`);
  return P;
}
/* the outcome from the items (A1, A2, S1 at each weight) */
export function decide(items) {
  const failed = [];
  for (const w of WEIGHTS) {
    const it = items[w];
    if (!(it.A1.lo > A1_BAR)) failed.push(`A1 at W${w} (lower end ${it.A1.lo.toFixed(3)}, not above ${A1_BAR})`);
    if (!(it.A2.lo > A2_BAR)) failed.push(`A2 at W${w} (lower end ${it.A2.lo.toFixed(3)}%, not above ${A2_BAR}%)`);
    if (!(it.S1.lo > S1_BAR)) failed.push(`S1 at W${w} (lower end ${it.S1.lo.toFixed(3)}, not above ${S1_BAR})`);
  }
  return failed.length ? { outcome: 'NOT PASSED', decides: `couples keep the app's rules under the switch (D42) and nothing is tuned to pass; failed: ${failed.join('; ')}` }
    : { outcome: 'PASS', decides: 'the candidate for couples goes to the maintainer, who decides whether couples run it under Part C\'s switch' };
}
/* a couple's harm flag against an arm: the loss over its paths above the threshold its own discordance sets at its paths */
export function harmOf(c, o) {
  const L = lossOf(c, o), k = Math.round(L.disc * L.n), dUp = Math.max(clopperPearson(k, L.n)[1], 0.0101), t = thresholdFor(dUp, L.n);
  return { ...L, dUp, t, tp: harmRate(dUp, L.n, t, 1), flag: harmFlag(L, t) };
}
/* the items at a weight */
export function itemsAt(U, panel, w) {
  const n = Math.min(...panel.map(h => U[h.id]['APP/-'].main.survived.length));
  const C = h => U[h.id][`CANDC/${w}`].main, A = h => U[h.id]['APP/-'].main, S = h => U[h.id][`SHIPC/${w}`].main;
  return { n, A1: survivalItem(panel.map(h => [C(h), A(h)]), n), A2: spendingItem(panel.map(h => [C(h), A(h)]), n), S1: survivalItem(panel.map(h => [C(h), S(h)]), n), CS: spendingItem(panel.map(h => [C(h), S(h)]), n) };
}
const costItem = (pairs, n) => spendingItem(pairs.map(([c, o]) => [{ ...c, delivered: c.costDelivered }, { ...o, delivered: o.costDelivered }]), n);
const f3 = x => x.toFixed(3), sgn = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`, iv = r => `${sgn(r.d)} (${f3(r.lo)} to ${f3(r.hi)}, se ${r.se.toFixed(4)})`;

function report(U, panel) {
  const lines = [], items = {};
  for (const w of WEIGHTS) {
    const it = items[w] = itemsAt(U, panel, w);
    lines.push(`W${w}: A1 survival CANDC less APP ${iv(it.A1)} points: ${it.A1.lo > A1_BAR ? 'PASSES' : 'FAILS'}; A2 spending delivered ${iv(it.A2)}%: ${it.A2.lo > A2_BAR ? 'PASSES' : 'FAILS'}; S1 survival CANDC less SHIPC ${iv(it.S1)} points: ${it.S1.lo > S1_BAR ? 'PASSES' : 'FAILS'} (spending delivered CANDC less SHIPC ${iv(it.CS)}%)`);
  }
  const out = decide(items);
  lines.push(`OUTCOME: ${out.outcome}: ${out.decides}`);
  lines.push('', 'FLAGS (D34: for investigation, none blocking on its own)');
  const flags = [];
  for (const h of panel) for (const w of WEIGHTS) {
    const c = U[h.id][`CANDC/${w}`].main;
    for (const [nm, o] of [['APP', U[h.id]['APP/-'].main], ['SHIPC', U[h.id][`SHIPC/${w}`].main]]) { const r = harmOf(c, o); if (r.flag) flags.push(`${h.id} W${w} harm against ${nm}: loss ${r.loss.toFixed(3)} points over ${r.n} paths (${r.saved} saved, ${r.lost} lost), threshold ${r.t.toFixed(4)} at discordance up to ${(100 * r.dUp).toFixed(2)}% (a 1-point loss read ${r.tp.toFixed(3)})`); }
    const a = U[h.id]['APP/-'].main, m = a.delivered.reduce((s, x) => s + x, 0) / a.delivered.length, d = 100 * (c.delivered.reduce((s, x) => s + x, 0) / c.delivered.length - m) / (m || 1);
    if (d < SPEND_FLAG) flags.push(`${h.id} W${w} spending: ${d.toFixed(2)}% against APP`);
  }
  lines.push(flags.length ? flags.map(f => `  ${f}`).join('\n') : '  none');
  lines.push('', 'REPORTED');
  for (const w of WEIGHTS) {
    const n = items[w].n, withCost = panel.filter(h => (U[h.id]['APP/-'].costYears || []).length);
    if (withCost.length) lines.push(`W${w} the cost years (${withCost.length} couples): spending delivered in them CANDC less APP ${iv(costItem(withCost.map(h => [U[h.id][`CANDC/${w}`].main, U[h.id]['APP/-'].main]), n))}%, less SHIPC ${iv(costItem(withCost.map(h => [U[h.id][`CANDC/${w}`].main, U[h.id][`SHIPC/${w}`].main]), n))}%`);
    for (const [nm, hs] of lumpGroups(panel)) if (hs.length) lines.push(`W${w} where arm A ${nm} (${hs.length}): A1 ${iv(survivalItem(hs.map(h => [U[h.id][`CANDC/${w}`].main, U[h.id]['APP/-'].main]), n))} points, A2 ${iv(spendingItem(hs.map(h => [U[h.id][`CANDC/${w}`].main, U[h.id]['APP/-'].main]), n))}%`);
    for (const co of COHORTS) { const hs = panel.filter(h => h.cohort === co); if (hs.length) lines.push(`W${w} S1 over the ${co === 'lib' ? 'library' : 'younger'} cohort (${hs.length}): ${iv(survivalItem(hs.map(h => [U[h.id][`CANDC/${w}`].main, U[h.id][`SHIPC/${w}`].main]), n))} points (spending ${iv(spendingItem(hs.map(h => [U[h.id][`CANDC/${w}`].main, U[h.id][`SHIPC/${w}`].main]), n))}%)`); }
  }
  let eo = 0, mo = 0, nb = 0;
  for (const h of panel) for (const k of ARMS.slice(1)) { const x = U[h.id][k]; if (x.beside) { eo += x.beside.engineOnly; mo += x.beside.modelOnly; nb += x.beside.N; } }
  lines.push(`the couples' rollout in the model beside the engine: ${nb} paths, the engine alone surviving ${eo}, the model alone ${mo}`);
  const secs = Object.values(U).flatMap(Object.values), hosts = [...new Set(secs.map(x => x.cpu))];
  lines.push(`the units' core-hours ${(secs.reduce((s, x) => s + x.secs, 0) / 3600).toFixed(1)} (the solves ${(secs.reduce((s, x) => s + x.solveSecs, 0) / 3600).toFixed(1)}); the hosts: ${hosts.join('; ')}`);
  return { lines, out, items };
}

function planted() {
  const cases = [];
  const dir = mkdtempSync(join(tmpdir(), 'd4read-')), n = 400, Y = 30;
  const b64 = (T, f) => Buffer.from(T.from({ length: n }, (_, i) => f(i)).buffer).toString('base64');
  const stamp = { code: 'c', audit: 'a', prediction: REGISTRATION, sha: 's', node: 'v' };
  const ranOf = (arm, w) => (arm === 'APP' ? 'arm A x' : ['self', 'part'].map(who => `${who}: ${WANT[arm].join(' ')} bequestWeight ${Number(w)} minPot 1`).join(' | '));
  const unit = (id, cohort, arm, w, lostIdx, extra = {}) => writeFileSync(join(dir, `${id}-${arm}-w${w}.json.gz`), gzipSync(JSON.stringify({ id, arm, w, cohort, target: 1000, inputs: 'I', stamp, ran: ranOf(arm, w), seed: SEED, N: n, Y, costYears: [3], solveSecs: 1, engineSecs: 1, secs: 3, label: 'x', cpu: 'cpu',
    beside: arm === 'APP' ? null : { N: Math.min(n, BESIDE_N), engineOnly: 0, modelOnly: 0, secs: 1, survived: b64(Uint8Array, () => 1) },
    main: { survived: b64(Uint8Array, i => (lostIdx(i) ? 0 : 1)), estate: b64(Float32Array, () => 1), wealth: b64(Float32Array, () => 1), delivered: b64(Float32Array, () => 100), unmet: b64(Float32Array, () => 0), tax: b64(Float32Array, () => 0), failYear: b64(Int16Array, () => -1), costDelivered: b64(Float32Array, () => 10) }, ...extra })));
  // two couples: CANDC survives every path, APP loses paths 0-39, SHIPC paths 0-9
  const panel = [{ id: 'C1', cohort: 'lib', target: 1000, label: 'Bracket Fill Basic, lump sum' }, { id: 'C2', cohort: 'young', target: 1000, label: 'ISA First' }];
  for (const h of panel) { unit(h.id, h.cohort, 'APP', '-', i => i < 40); for (const w of WEIGHTS) { unit(h.id, h.cohort, 'CANDC', w, () => false); unit(h.id, h.cohort, 'SHIPC', w, i => i < 10); } }
  const paths = { C1: n, C2: n };
  let U = loadDir(dir), P = gate(U, panel, paths);
  cases.push(['a fair run passes the gate', `${P.length}`, '0']);
  const R = report(U, panel);
  cases.push(['A1 is CANDC less APP, path by path over the couples: +10 points (40 of 400 lost by APP)', `${R.items['0.02'].A1.d.toFixed(3)}`, '10.000']);
  cases.push(['S1 is CANDC less SHIPC: +2.5 points', `${R.items['0.02'].S1.d.toFixed(3)}`, '2.500']);
  cases.push(['the outcome PASS when every item clears at both weights', R.out.outcome, 'PASS']);
  // a CANDC unit that loses: S1 below its bar
  for (const w of WEIGHTS) unit('C1', 'lib', 'CANDC', w, i => i < 60);
  U = loadDir(dir);
  const R2 = report(U, panel);
  cases.push(['a losing CANDC fails S1 and A1 at both weights (NOT PASSED), and its harm flag fires', `${R2.out.outcome} ${R2.lines.some(l => /C1 W0.02 harm against SHIPC/.test(l))}`, 'NOT PASSED true']);
  // the gate's refusals: a wrong seed, another inputs hash, a run without its settings, a missing unit, the estate weight not the only difference
  unit('C1', 'lib', 'CANDC', '0.02', () => false, { seed: 7002 });
  unit('C1', 'lib', 'SHIPC', '0.01', i => i < 10, { inputs: 'J' });
  unit('C2', 'young', 'CANDC', '0.01', () => false, { ran: ranOf('CANDC', '0.01').replace('tiersBelow 3', 'tiersBelow 2') });
  rmSync(join(dir, 'C2-APP-w-.json.gz'));
  U = loadDir(dir); P = gate(U, panel, paths);
  cases.push(['the gate names a wrong seed, another inputs hash, a run without its settings, a missing unit, the weights differing beyond the estate weight', ['seed 7002', 'inputs differ', 'ran without "tiersBelow 3"', 'no APP/- unit', 'two weights differ in tiersBelow'].map(s => (P.some(p => p.includes(s)) ? 'y' : 'n')).join(''), 'yyyyy']);
  rmSync(dir, { recursive: true, force: true });
  // a couple's threshold from its own discordance: 40 of 400 discordant, all lost: a 10-point loss, flagged
  { const c = { survived: Uint8Array.from({ length: 400 }, (_, i) => (i < 40 ? 0 : 1)) }, o = { survived: Uint8Array.from({ length: 400 }, () => 1) }, h = harmOf(c, o);
    cases.push(['a couple\'s threshold from its own discordance at its paths; a 10-point loss flagged', `${h.flag} ${h.t > 0.25}`, 'true true']);
    const z = harmOf(o, o); cases.push(['no discordance: priced at the 1.01% a 1-point loss needs, no flag', `${z.flag} ${z.dUp.toFixed(4)}`, 'false 0.0101']); }
  let bad = 0;
  for (const [nm, got, w] of cases) { const ok = got === w; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${w})`}`); }
  console.log('EDGES: no discordance, a missing unit, a wrong seed, the weights differing beyond the estate weight, a losing candidate');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

async function read(dir) {
  const { requireFairLogs } = await import('./fair-gate.mjs');
  const logs = Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => [f, readFileSync(join(dir, f), 'utf8')]));
  requireFairLogs(logs, REGISTRATION);
  const ls = [...Object.values(logs).join('\n').matchAll(LOG_STAMP)].map(([, code, audit, , sha]) => ({ code, audit, sha })), logStamp = ls[0] || null;
  if (new Set(ls.map(x => JSON.stringify(x))).size > 1) { console.log('THE GATE: REFUSED (the logs carry more than one stamp)'); process.exit(1); }
  const panel = JSON.parse(readFileSync(join(HERE, 'couples-panel.json'), 'utf8')).panel, reg = JSON.parse(readFileSync(join(HERE, 'couples-paths.json'), 'utf8'));
  const { stampFilesHash } = await import('./audit-couples.mjs');
  const U = loadDir(dir), problems = gate(U, panel, reg.paths, logStamp, stampFilesHash());
  console.log(`D4 READ: ${dir}; ${Object.keys(U).length} couples`);
  if (problems.length) { console.log(`THE GATE: REFUSED (${problems.length})\n  ${problems.join('\n  ')}`); process.exit(1); }
  console.log(`the gate: fair - ${panel.length} couples in every arm, seed ${SEED} on their registered paths (${reg.N}), one stamp`);
  console.log(report(U, panel).lines.join('\n'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  // the pilot's figures through this read's items (EXPLORATORY: the pilot's seed, no registration, no gate but the units' own)
  if (process.argv[2] === '--pilot') {
    const dir = process.argv[3] || join(HERE, 'results', 'd4-pilot'), U = loadDir(dir), panelAll = JSON.parse(readFileSync(join(HERE, 'couples-panel.json'), 'utf8')).panel;
    const panel = panelAll.filter(h => U[h.id] && ARMS.every(k => U[h.id][k]));
    const any = Object.values(U).flatMap(Object.values)[0];
    console.log(`D4'S PILOT, EXPLORATORY (${dir.replace(/.*research\/solver\//, '')}): ${panel.map(h => h.id).join(', ')}; seed ${any.seed}, ${any.N} paths a unit; not the registered read`);
    const inputs = panel.filter(h => new Set(ARMS.map(k => U[h.id][k].inputs)).size > 1);
    console.log(`each couple's five units on one inputs hash: ${inputs.length ? `NO (${inputs.map(h => h.id).join(', ')})` : 'yes'}`);
    console.log(report(U, panel).lines.join('\n'));
    process.exit(0);
  }
  await read(process.argv[2] || join(HERE, 'results', 'd4-run'));
}
