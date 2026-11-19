/*
 * STEP 8'S ARM, THE READ (HOUSEHOLD-ARM.md, its rule committed before any unit ran; D130 (2); EXPLORATORY, seed 7002).
 * The gate first; then step 8's own rule (reduce-household-hsp.mjs compare, its three parts as its rule reads them) for HSP
 * and for HSPA against K2 over the 56 units, and the arm taken: HSP if it passes, else HSPA if it passes, else neither.
 * Beside, deciding nothing: each arm against APP; M1 by unit; each unit's k and change; each table's forecast against its
 * survival; the pooled survival without its largest unit.
 *   node research/solver/reduce-household-arm.mjs [dir]
 *   node research/solver/reduce-household-arm.mjs --smoke [dir]   the gate on a smoke's units (its own count of paths and
 *                                                                  points), the rule run, no figure printed
 *   node research/solver/reduce-household-arm.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compare, m1ByUnit, armOf, POOL_BAR, SPEND_BAR } from './reduce-household-hsp.mjs';
import { harmExact } from './reduce-share-rules.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { ARMS, SEED, N, PTS, configOf, unitsAll, stampFilesHash } from './audit-household-arm.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ORDER = ['HSP', 'HSPA'];
export function loadDir(dir) {
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).map(x => { const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
}
/* the gate: refusals, each a line. `want` the units' ids; `logs` file -> text (each unit's own case log), or null */
export function gate(units, want, { seed = SEED, n = N, pts = PTS, audit = null, logs = null } = {}) {
  const P = [], byId = Object.fromEntries(units.map(u => [u.id, u]));
  if (!units.length) P.push('no units');
  for (const id of want) if (!byId[id]) P.push(`${id}: missing`);
  for (const u of units) if (!want.includes(u.id)) P.push(`${u.id}: not a unit of the read`);
  const codes = new Set(units.map(u => u.stamp && u.stamp.code)), audits = new Set(units.map(u => u.stamp && u.stamp.audit)), nodes = new Set(units.map(u => u.stamp && u.stamp.node));
  if (codes.size > 1) P.push(`more than one code: ${[...codes].join(', ')}`);
  if (audits.size > 1) P.push(`more than one audit: ${[...audits].join(', ')}`);
  if (nodes.size > 1) P.push(`more than one Node version: ${[...nodes].join(', ')}`);
  if (audit !== null && units.some(u => u.stamp && u.stamp.audit !== audit)) P.push(`an audit stamp not this read's files' (${audit})`);
  for (const u of units) {
    if (u.seed !== seed) P.push(`${u.id}: seed ${u.seed}, not ${seed}`);
    if (u.N !== n) P.push(`${u.id}: ${u.N} paths, not ${n}`);
    if (u.pts !== pts) P.push(`${u.id}: ${u.pts} points, not ${pts}`);
    if (!(u.split && u.split.s >= 0.5 - 1e-12 && u.split.s <= 1 + 1e-12 && Math.abs(u.split.k - 1 / u.split.s) < 1e-12)) P.push(`${u.id}: k ${u.split && u.split.k}, not 1 / s for s in 0.5 to 1`);
    for (const arm of ARMS) {
      const A = u.arms && u.arms[arm];
      if (!A) { P.push(`${u.id} ${arm}: missing`); continue; }
      if (A.config !== configOf(arm)) P.push(`${u.id} ${arm}: configuration ${A.config}, not ${configOf(arm)}`);
      for (const key of ['survived', 'failYear', 'pot', 'estate', 'tax', 'delivered', 'unmet']) if (!A[key] || A[key].length !== u.N) P.push(`${u.id} ${arm}: ${key} not one a path`);
    }
  }
  if (logs !== null) {
    for (const u of units) {
      const text = logs[`case${u.k}.txt`];
      if (!text) { P.push(`${u.id}: no launch log (case${u.k}.txt)`); continue; }
      if (!text.includes(`: ${u.id} (`) || !new RegExp(`^ +done unit ${u.k} secs `, 'm').test(text)) P.push(`${u.id}: its launch log does not name it or has no done line`);
      if (u.stamp && !text.startsWith(`stamp: code ${u.stamp.code} audit ${u.stamp.audit} `)) P.push(`${u.id}: its launch log's stamp is not its unit's`);
    }
  }
  return P;
}
/* step 8's rule for one arm against K2 (reduce-household-hsp.mjs rule, its parts as written, the arm named) */
export function armRule(units, arm) {
  const C = compare(units, 'K2', arm), flagged = C.rows.filter(r => r.flag);
  const parts = { harm: flagged.length === 0, gain: C.pooled.lo > POOL_BAR, spend: C.kept.pooled.d >= SPEND_BAR };
  return { C, flagged, parts, outcome: parts.harm && parts.gain && parts.spend ? 'PASS' : 'FAIL' };
}
export const armTaken = R => (R.HSP.outcome === 'PASS' ? 'HSP' : R.HSPA.outcome === 'PASS' ? 'HSPA' : 'NEITHER');

const f = (x, d = 3) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
export function report(units) {
  const out = [], R = Object.fromEntries(ORDER.map(arm => [arm, armRule(units, arm)]));
  for (const arm of ORDER) {
    const r = R[arm], C = r.C;
    out.push(`${arm} against K2 (step 8's rule, ${units.length} units, ${units[0].N} paths each):`);
    out.push(`  1. no harm by D34 in whole paths: ${r.flagged.length ? `flagged ${r.flagged.map(x => `${x.id} (net ${x.lost - x.saved} paths lost against a threshold of ${x.j})`).join(', ')}: FAILS` : 'no unit flagged: HOLDS'}`);
    out.push(`  2. pooled survival by path ${f(C.pooled.d)} points (${f(C.pooled.lo)} to ${f(C.pooled.hi)}), its lower end above ${POOL_BAR}: ${r.parts.gain ? 'HOLDS' : 'FAILS'}`);
    out.push(`  3. spending on the paths both keep ${f(C.kept.pooled.d, 4)}% (${f(C.kept.pooled.lo, 4)} to ${f(C.kept.pooled.hi, 4)}), not below ${SPEND_BAR}%: ${r.parts.spend ? 'HOLDS' : 'FAILS'}`);
    out.push(`  ${arm}: ${r.outcome}`);
  }
  out.push(`THE ARM TAKEN: ${armTaken(R)}`);
  out.push('Beside, deciding nothing:');
  for (const arm of ORDER) {
    const A = compare(units, 'APP', arm), K = compare(units, 'APP', 'K2');
    const big = R[arm].C.rows.reduce((b, x) => (!b || Math.abs(x.ch.d) > Math.abs(b.ch.d) ? x : b), null), rest = units.filter(u => u.id !== big.id), C2 = compare(rest, 'K2', arm);
    const m1 = m1ByUnit(units.map(u => ({ ...u, arms: { ...u.arms, HSP: u.arms[arm] } }))).filter(x => x.unmet);
    out.push(`  ${arm}: against APP ${f(A.pooled.d)} (${f(A.pooled.lo)} to ${f(A.pooled.hi)}), K2 against APP ${f(K.pooled.d)}; without its largest unit (${big.id}) against K2 ${f(C2.pooled.d)} (${f(C2.pooled.lo)} to ${f(C2.pooled.hi)}); M1 not met on ${m1.length ? m1.map(x => `${x.id} (${x.net > 0 ? '+' : ''}${x.net} paths, spending ${f(x.spend.d, 3)}%)`).join(', ') : 'no unit'}`);
  }
  out.push('  by unit (k; survival against K2 in points, saved and lost paths, a flag; the forecast less the survival):');
  const surv = A => 100 * A.survived.reduce((t, v) => t + v, 0) / A.survived.length;
  for (const u of units) {
    const parts = ORDER.map(arm => { const x = R[arm].C.rows.find(r => r.id === u.id); return `${arm} ${f(x.ch.d)} (${x.cells.saved}/${x.cells.lost}${x.flag ? ', FLAGGED' : ''}; forecast ${f(100 * u.arms[arm].forecast - surv(u.arms[arm]), 2)})`; });
    out.push(`    ${u.id.padEnd(20)} k ${u.split.k.toFixed(3)}: APP ${surv(u.arms.APP).toFixed(2)}%, K2 ${surv(u.arms.K2).toFixed(2)}%; ${parts.join('; ')}`);
  }
  return { out, R };
}

function planted() {
  const cases = [], n = 4000, arr = (f) => { const a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = f(i) ? 1 : 0; return a; };
  const A = (s, cfg, spend = 1000) => ({ config: cfg, survived: arr(s), failYear: new Int16Array(n), pot: new Float64Array(n).fill(100), estate: new Float64Array(n).fill(100), tax: new Float64Array(n).fill(1), delivered: new Float64Array(n).fill(spend), unmet: new Float64Array(n), forecast: 0.9 });
  const unit = (id, k, sHSP, sHSPA, o = {}) => ({ id, k, N: n, seed: SEED, pts: PTS, cohort: 'x', variant: 'own', split: { s: 0.6, k: 1 / 0.6 }, caps: [1e9, 1e9], stamp: { code: 'c', audit: 'a', node: 'v' },
    arms: { APP: A(i => i % 5 !== 0, configOf('APP')), K2: A(i => i % 10 !== 0, configOf('K2')), HSP: A(sHSP, configOf('HSP'), o.spendHSP), HSPA: A(sHSPA, configOf('HSPA')) } });
  const gain = i => i % 20 !== 0, same = i => i % 10 !== 0, loseTwo = i => i % 10 !== 0 && i % 50 !== 1;
  // the arm taken: HSP passing is taken whatever HSPA does; HSP failing (a unit flagged), HSPA passing: HSPA; neither: NEITHER
  { const R = Object.fromEntries(ORDER.map(arm => [arm, armRule([unit('a', 0, gain, gain), unit('b', 1, gain, gain)], arm)]));
    cases.push(['both arms gaining on every unit: HSP taken', `${R.HSP.outcome} ${R.HSPA.outcome} ${armTaken(R)}`, 'PASS PASS HSP']); }
  { const us = [unit('a', 0, gain, gain), unit('b', 1, loseTwo, gain)], R = Object.fromEntries(ORDER.map(arm => [arm, armRule(us, arm)]));
    cases.push(['HSP losing 2% of a unit\'s paths (flagged), HSPA gaining: HSPA taken', `${R.HSP.outcome} ${R.HSP.flagged.map(x => x.id).join(',')} ${R.HSPA.outcome} ${armTaken(R)}`, 'FAIL b PASS HSPA']); }
  { const us = [unit('a', 0, loseTwo, same), unit('b', 1, gain, same)], R = Object.fromEntries(ORDER.map(arm => [arm, armRule(us, arm)]));
    cases.push(['HSP flagged, HSPA no gain: NEITHER', `${R.HSP.outcome} ${R.HSPA.outcome} ${R.HSPA.parts.gain} ${armTaken(R)}`, 'FAIL FAIL false NEITHER']); }
  { const us = [unit('a', 0, gain, gain, { spendHSP: 999 }), unit('b', 1, gain, gain, { spendHSP: 999 })], R = Object.fromEntries(ORDER.map(arm => [arm, armRule(us, arm)]));
    cases.push(['HSP spending 0.1% less on the paths both keep: HSP fails on spending alone, HSPA taken', `${R.HSP.parts.harm} ${R.HSP.parts.gain} ${R.HSP.parts.spend} ${armTaken(R)}`, 'true true false HSPA']); }
  // the report, beside included, runs on built units and prints the arm the rule takes
  { const us = [unit('a', 0, gain, gain), unit('b', 1, loseTwo, gain)], rep = report(us), line = rep.out.find(x => x.startsWith('THE ARM TAKEN'));
    const flagged = rep.out.filter(x => /FLAGGED/.test(x)).length, m1 = rep.out.some(x => /M1 not met on/.test(x));
    cases.push(['the report on built units: the arm taken, one unit flagged by unit, M1 printed for each arm', `${line} ${flagged} ${m1}`, 'THE ARM TAKEN: HSPA 1 true']); }
  // the bar either side by one path, through this read's own wiring
  { const lose = m => unit('b', 1, i => i % 10 !== 0 && !(i % 10 === 1 && i < 10 * m), gain);
    let m = 1; while (m < 300 && !harmExact(lose(m).arms.HSP, lose(m).arms.K2, n).flag) m++;
    const below = armRule([unit('a', 0, gain, gain), lose(m - 1)], 'HSP'), over = armRule([unit('a', 0, gain, gain), lose(m)], 'HSP');
    cases.push([`a unit one path under its D34 bar (net loss ${m - 1}) is not flagged, one over (${m}) is`, `${below.parts.harm} ${over.parts.harm}`, 'true false']); }
  // the gate on built units with their logs
  { const want = ['a', 'b'], log = (u, done = true) => `stamp: code c audit a prediction p sha -\nSTEP 8'S ARM (EXPLORATORY): unit ${u.k}/2: ${u.id} (lead, own)\n${done ? `         done unit ${u.k} secs 5\n` : ''}`;
    const G = (mod, o = {}) => { const us = [unit('a', 0, gain, gain), unit('b', 1, gain, gain)]; if (mod) mod(us); const logs = o.logs || Object.fromEntries(us.map(u => [`case${u.k}.txt`, log(u)])); return gate(us, want, { audit: 'a', logs }); };
    { const g0 = G(); cases.push(['the gate: the built units fair', g0.length ? g0.join(' | ') : '0', '0']); }
    const faults = [
      ['a unit missing', us => us.pop(), /b: missing/],
      ['an arm missing', us => { delete us[0].arms.HSPA; }, /a HSPA: missing/],
      ['another seed', us => { us[1].seed = 8; }, /seed 8/],
      ['another count of paths', us => { us[1].N = 3000; }, /3000 paths/],
      ['another count of points', us => { us[1].pts = 30; }, /30 points/],
      ['another code', us => { us[1].stamp = { ...us[1].stamp, code: 'd' }; }, /more than one code/],
      ['another audit', us => { us[1].stamp = { ...us[1].stamp, audit: 'z' }; }, /more than one audit/],
      ['another Node version', us => { us[1].stamp = { ...us[1].stamp, node: 'w' }; }, /more than one Node/],
      ['another configuration', us => { us[0].arms.HSPA.config = 'z'; }, /a HSPA: configuration z/],
      ['an array not one a path', us => { us[0].arms.K2.tax = new Float64Array(3); }, /a K2: tax not one a path/],
      ['k not 1 / s', us => { us[0].split = { s: 0.6, k: 2 }; }, /a: k 2/],
      ['a unit not of the read', us => { us.push({ ...us[0], id: 'z' }); }, /z: not a unit of the read/]
    ];
    const missed = faults.filter(([, mod, re]) => !G(mod).some(x => re.test(x))).map(([nm]) => nm);
    if (!gate([], [], { audit: 'a', logs: {} }).includes('no units')) missed.push('no units');
    const logMiss = gate([unit('a', 0, gain, gain), unit('b', 1, gain, gain)], want, { audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }) } }).some(x => /b: no launch log/.test(x));
    const logDone = gate([unit('a', 0, gain, gain), unit('b', 1, gain, gain)], want, { audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }), 'case1.txt': log({ id: 'b', k: 1 }, false) } }).some(x => /b: its launch log does not name it or has no done line/.test(x));
    cases.push([`the gate: every refusal on its planted fault (${faults.length + 3})`, missed.join(', ') + (logMiss ? '' : ' log missing') + (logDone ? '' : ' no done line') || 'all fire', 'all fire']); }
  let bad = 0;
  for (const [nm, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const DIR = args.find(a => !a.startsWith('--')) || join(HERE, 'results', `household-arm-${SEED}`);
  if (!existsSync(DIR)) { console.error(`reduce-household-arm: no ${DIR}`); process.exit(2); }
  const smoke = args.includes('--smoke'), units = loadDir(DIR).sort((a, b) => a.k - b.k), all = unitsAll().map(u => u.id);
  const want = smoke ? units.map(u => u.id).filter(id => all.includes(id)) : all;
  const logs = Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')]));
  console.log(`STEP 8'S ARM (EXPLORATORY; HOUSEHOLD-ARM.md; D130 (2)): ${units.length} units from ${DIR.replace(/.*research\/solver\//, '')}, seed ${SEED}${smoke ? ', a smoke' : ''}`);
  if (smoke && units.some(u => u.N === N && u.pts === PTS)) { console.log('a smoke at the read\'s own count of paths and points: refused (read it without --smoke)'); process.exit(1); }
  // the fair-test gate on the launch logs (CHECKLIST 3): every log stamped by the launcher (PREDICTION none: an exploratory
  // run), one code and one audit; a smoke, not launched, has none
  if (!smoke) requireFairLogs(Object.values(logs), 'none', { blob: () => '-' });
  const P = gate(units, want, smoke ? { audit: stampFilesHash(), logs, n: units[0] && units[0].N, pts: units[0] && units[0].pts } : { audit: stampFilesHash(), logs });
  if (P.length) { console.log(`THE GATE: REFUSED\n  ${P.join('\n  ')}`); process.exit(1); }
  if (smoke) { const r = report(units); console.log(`THE GATE: fair on the smoke's ${units.length} units; the rule and the beside run (${r.out.length} lines), no figure printed`); process.exit(0); }
  const u0 = units[0];
  console.log(`THE GATE: fair; one code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${SEED}, ${u0.N} paths, ${u0.pts} points; every unit's four arms at their configurations; each unit's own log with its done line`);
  console.log(report(units).out.join('\n'));
}
