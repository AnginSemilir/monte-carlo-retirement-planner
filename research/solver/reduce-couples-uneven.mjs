/*
 * THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS, THE READ (COUPLES-UNEVEN.md; the deep review of the registered read, section 3;
 * EXPLORATORY, seed 7002): read once when all 28 units are in, by the rule committed before any unit ran:
 *   an arm's tax rise at 25/75: for each kind, on each path, the Y75 unit's lifetime tax less the 'own' unit's, over the plan's
 *     years from the first retirement (T + 1 - tR, as the deep review counts them); averaged over the 14 kinds on that path; the
 *     mean over the paths, its 95% interval by path (reduce-phase4.mjs byPath: each path one market in all 28 units). D is
 *     ROUTE's rise.
 *   0. the premise: D's interval's lower end above nought; else NO LOSS TO EXPLAIN, and nothing else is read;
 *   1. PA2, and SPLIT, explains the loss if its own rise is at most half of D and its interval's upper end lies below D's point.
 * Outcomes: PA2 EXPLAINS IT, SPLIT EXPLAINS IT, BOTH EXPLAIN IT (the smaller rise first), NEITHER, NO LOSS TO EXPLAIN.
 * Beside, deciding nothing: FIX's rise and APP's (over the 14 kinds, and over the kinds where arm A picks the same rule at both
 * holdings); each arm's spending at 25/75 less 60/40 (lifetime spending delivered as a share of the unit's target, in points, on
 * the paths the arm and APP keep at both holdings, the kinds weighted equally) and its end pot; each arm against APP at 25/75
 * (the pooled survival change by path, spending on the paths both keep); D34 against ROUTE, unit by unit (harmExact).
 *   REG=1 node research/solver/reduce-couples-uneven.mjs [dir]     (dir results/couples-uneven-7002 unless given; SMOKE=1 for a smoke)
 *   REG=1 node research/solver/reduce-couples-uneven.mjs --planted  the rule's parts on planted figures, each side of each bar
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { harmExact } from './reduce-share-rules.mjs';
import { keptSpend } from './reduce-household-hsp.mjs';
import { byPath, survivalItem } from './reduce-phase4.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { KEYS } from './audit-couples-any.mjs';
import { readAnyPanel } from './couples-any-panel.mjs';
import { SEED, N_DEFAULT, ARMS, configOf, OUT_DEFAULT, stampFilesHash, unitsOf } from './audit-couples-uneven.mjs';
import { APP_POINTS } from '../../src/solverSettings.js';

export const EXPLAIN_BAR = 0.5, READ_ARMS = Object.freeze(['PA2', 'SPLIT']);
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])) });
export function loadDir(dir) {
  return readdirSync(dir).filter(f => f.endsWith('.json.gz')).map(f => { const u = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()); return { ...u, arms: Object.fromEntries(Object.entries(u.arms).map(([k, v]) => [k, armOf(v)])) }; });
}
/* the plan's years from the first retirement, as the deep review counts them (dr-kindacct.mjs): T + 1 - tR */
export function yearsOf(plan) {
  const d = plan.demographics, T = Number(d.terminalAge) - Number(d.currentAgeSelf);
  const tR = Math.max(0, Math.min(Number(d.retireAgeSelf) - Number(d.currentAgeSelf), Number(d.retireAgePart) - Number(d.currentAgePart)));
  return T + 1 - tR;
}
/* each kind's two units, 'own' and 'Y75', with its years */
export function kindsOf(units, yearsById) {
  const byId = Object.fromEntries(units.map(u => [u.id, u])), kinds = [...new Set(units.map(u => u.kind))].sort();
  return kinds.map(k => {
    const o = units.find(u => u.kind === k && u.hold === 'own'), y = units.find(u => u.kind === k && u.hold === 'Y75');
    if (!o || !y) throw new Error(`reduce-couples-uneven: kind ${k} lacks a holding`);
    if (o.N !== y.N) throw new Error(`reduce-couples-uneven: kind ${k}'s holdings on ${o.N} and ${y.N} paths`);
    const yrs = yearsById[o.id];
    if (!(yrs > 0) || yearsById[y.id] !== yrs) throw new Error(`reduce-couples-uneven: kind ${k}'s years ${yrs} and ${yearsById[y.id]}`);
    return { kind: k, o: byId[o.id], y: byId[y.id], yrs, same: o.label === y.label };
  });
}
/* an arm's tax rise at 25/75 over 60/40, a year, pooled over the kinds by path */
export const riseOf = (kinds, arm, n) => byPath(kinds.map(k => i => (k.y.arms[arm].tax[i] - k.o.arms[arm].tax[i]) / k.yrs), n);
export const explains = (X, D) => X.d <= EXPLAIN_BAR * D.d && X.hi < D.d;
export function rule(kinds, n) {
  const D = riseOf(kinds, 'ROUTE', n), premise = D.lo > 0;
  const each = Object.fromEntries(READ_ARMS.map(arm => [arm, riseOf(kinds, arm, n)]));
  if (!premise) return { D, premise, each, ok: [], outcome: 'NO LOSS TO EXPLAIN' };
  const ok = READ_ARMS.filter(arm => explains(each[arm], D)).sort((a, b) => each[a].d - each[b].d);
  const outcome = ok.length === 2 ? `BOTH EXPLAIN IT (${ok.join(' first, then ')})` : ok.length === 1 ? `${ok[0]} EXPLAINS IT` : 'NEITHER';
  return { D, premise, each, ok, outcome };
}
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : 'n/a'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : 'n/a'), f4 = x => (Number.isFinite(x) ? x.toFixed(4) : 'n/a');
const sg = (x, f) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${f(x)}` : 'n/a');
const gbp = x => (Number.isFinite(x) ? `${x < 0 ? '-' : '+'}£${Math.round(Math.abs(x)).toLocaleString('en-GB')}` : 'n/a');
const ivg = r => `${gbp(r.d)} (${gbp(r.lo)} to ${gbp(r.hi)})`;
const iv = (r, f = f3) => `${sg(r.d, f)} (${sg(r.lo, f)} to ${sg(r.hi, f)})`;
const surv = X => 100 * sum(X.survived) / X.survived.length;
/* an arm's spending at 25/75 less 60/40, in points of the unit's target, on the paths the arm and APP keep at both holdings, the
   kinds weighted equally; and its end pot, a path over all paths */
export function holdingDiff(kinds, arm) {
  const sp = [], pot = [];
  for (const k of kinds) {
    const O = k.o.arms, Y = k.y.arms, n = k.o.N, share = (u, X, i) => 100 * X.delivered[i] / (u.target * k.yrs);
    let s = 0, c = 0, p = 0;
    for (let i = 0; i < n; i++) {
      p += Y[arm].pot[i] - O[arm].pot[i];
      if (O[arm].survived[i] && Y[arm].survived[i] && O.APP.survived[i] && Y.APP.survived[i]) { s += share(k.y, Y[arm], i) - share(k.o, O[arm], i); c++; }
    }
    sp.push(c ? s / c : NaN); pot.push(p / n);
  }
  return { spend: sum(sp) / sp.length, pot: sum(pot) / pot.length };
}
export function report(units, yearsById) {
  const n = units[0].N, kinds = kindsOf(units, yearsById), R = rule(kinds, n), out = [];
  out.push(`ROUTE'S TAX RISE AT 25/75 (D): the Y75 unit's lifetime tax less the 'own' unit's, a year, over ${kinds.length} kinds by path: ${ivg(R.D)}`);
  out.push(`  0. the premise, D's lower end above nought: ${R.premise ? 'HOLDS' : 'FAILS: NO LOSS TO EXPLAIN, nothing else is read'}`);
  if (R.premise) for (const arm of READ_ARMS) {
    const X = R.each[arm];
    out.push(`  1. ${arm}'s rise ${ivg(X)}: at most half of D (${gbp(EXPLAIN_BAR * R.D.d)}) ${X.d <= EXPLAIN_BAR * R.D.d ? 'yes' : 'no'}, its upper end below D's point ${X.hi < R.D.d ? 'yes' : 'no'}: ${explains(X, R.D) ? 'EXPLAINS IT' : 'does not'}`);
  }
  out.push(`OUTCOME: ${R.outcome}`);
  out.push('');
  out.push('Beside, deciding nothing.');
  out.push(`  FIX's rise ${ivg(riseOf(kinds, 'FIX', n))}; APP's ${ivg(riseOf(kinds, 'APP', n))} over the ${kinds.length} kinds, ${(() => { const s = kinds.filter(k => k.same); return s.length ? `${ivg(riseOf(s, 'APP', n))} over the ${s.length} where arm A picks the same rule at both holdings (${s.map(k => k.kind).join(', ')})` : 'no kind where arm A picks the same rule at both holdings'; })()}`);
  out.push('  Each kind, the rise a year by arm (APP / ROUTE / PA2 / SPLIT / FIX), arm A\'s pick at 60/40 and at 25/75:');
  for (const k of kinds) out.push(`    ${k.kind.padEnd(5)} ${ARMS.map(arm => gbp(riseOf([k], arm, n).d)).join(' / ')}; ${k.o.label}${k.same ? ' at both' : ` -> ${k.y.label}`}`);
  out.push('  Each arm at 25/75 less 60/40: spending in points of target (on the paths it and APP keep at both holdings), and the end pot a path:');
  for (const arm of ARMS) { const h = holdingDiff(kinds, arm); out.push(`    ${arm.padEnd(5)} spending ${sg(h.spend, f2)} points; the end pot ${gbp(h.pot)}`); }
  const y75 = kinds.map(k => k.y);
  out.push(`  Each arm against APP at 25/75, over the ${y75.length} Y75 units: the pooled survival change by path, points; spending on the paths both keep, %:`);
  for (const arm of ARMS.filter(a => a !== 'APP')) out.push(`    ${arm.padEnd(5)} survival ${iv(survivalItem(y75.map(u => [u.arms[arm], u.arms.APP]), n))}; spending ${iv(keptSpend(y75, 'APP', arm, n), f4)}`);
  out.push('  Each unit\'s survival (APP / ROUTE / PA2 / SPLIT / FIX), and D34 against ROUTE in whole paths (lost, saved, the threshold) for PA2, SPLIT and FIX:');
  for (const u of [...units].sort((a, b) => a.k - b.k)) {
    const h = arm => { const x = harmExact(u.arms[arm], u.arms.ROUTE, u.N); return `${arm} ${x.lost}/${x.saved}/${x.j}${x.flag ? ' FLAGGED' : ''}`; };
    out.push(`    ${u.id.padEnd(15)} ${ARMS.map(arm => `${f2(surv(u.arms[arm]))}%`).join(' / ')}; ${['PA2', 'SPLIT', 'FIX'].map(h).join(', ')}`);
  }
  return out.join('\n');
}
/* the gate: every unit in, one stamp and Node, one seed, one size, the app's points, each arm's configuration, every check */
export function gate(units, ids, { smoke = false } = {}) {
  const bad = [], have = new Set(units.map(u => u.id));
  for (const id of ids) if (!have.has(id)) bad.push(`${id} missing`);
  if (units.length !== ids.length) bad.push(`${units.length} unit files, not ${ids.length}`);
  const stamps = new Set(units.map(u => `code ${u.stamp.code} audit ${u.stamp.audit} node ${u.stamp.node}`));
  if (stamps.size !== 1) bad.push(`${stamps.size} stamps: ${[...stamps].join(' | ')}`);
  if (!smoke && units.length && units[0].stamp.audit !== stampFilesHash()) bad.push(`the audit stamp ${units[0].stamp.audit}, the files now ${stampFilesHash()}`);
  if (new Set(units.map(u => u.N)).size > 1) bad.push(`units on ${[...new Set(units.map(u => u.N))].join(' and ')} paths`);
  for (const u of units) {
    if (u.seed !== SEED) bad.push(`${u.id} seed ${u.seed}`);
    if (!smoke && (u.N !== N_DEFAULT || u.pts !== APP_POINTS)) bad.push(`${u.id} ${u.N} paths at ${u.pts} points`);
    for (const arm of ARMS) if (!u.arms[arm] || u.arms[arm].config !== configOf(arm)) bad.push(`${u.id} ${arm} config ${u.arms[arm] ? u.arms[arm].config : 'missing'}`);
    const want = smoke ? ['3 ', '4 ', '5 '] : ['1 ', '2 ', '3 ', '4 ', '5 '];
    if (!want.every(p => (u.checks || []).some(c => c.startsWith(p) && !c.includes('not checked')))) bad.push(`${u.id}: not every check recorded`);
  }
  return bad;
}

function planted() {
  const cases = [], N = 400;
  // a unit: every arm keeps every path; its tax a path the given figure plus a wobble by path (so an interval has a width)
  const arm = (tax, wob = 0) => { const z = new Float64Array(N); return { survived: new Uint8Array(N).fill(1), failYear: new Int16Array(N), pot: Float64Array.from(z), estate: z, tax: Float64Array.from({ length: N }, (_, i) => tax + wob * ((i % 2) ? 1 : -1)), delivered: new Float64Array(N).fill(1e6), unmet: z }; };
  // 14 kinds, 20 years each: at 60/40 every arm pays 0; at 25/75 ROUTE pays 20 x d a path (a rise of d a year), PA2 20 x q,
  // SPLIT 20 x s, each 25/75 arm with its own wobble a year by path (w.D, w.Q, w.S) so that its interval has a width
  const kinds = (d, q, s, w = {}) => Array.from({ length: 14 }, (_, j) => {
    const mk = (hold, rD, rQ, rS, wD, wQ, wS) => ({ id: `K${j}-${hold}`, kind: `K${j}`, hold, N, target: 50000, label: 'a', arms: { APP: arm(0), ROUTE: arm(20 * rD, 20 * wD), PA2: arm(20 * rQ, 20 * wQ), SPLIT: arm(20 * rS, 20 * wS), FIX: arm(0) } });
    return { kind: `K${j}`, o: mk('own', 0, 0, 0, 0, 0, 0), y: mk('Y75', d, q, s, w.D || 0, w.Q || 0, w.S || 0), yrs: 20, same: true };
  });
  const out = (...a) => rule(kinds(...a), N);
  cases.push(['D at £440, PA2 at £100, SPLIT at £400: PA2 explains it', out(440, 100, 400).outcome, 'PA2 EXPLAINS IT']);
  cases.push(['PA2 at £400, SPLIT at £200: SPLIT explains it', out(440, 400, 200).outcome, 'SPLIT EXPLAINS IT']);
  cases.push(['both at or under half: both, the smaller first', out(440, 200, 100).outcome, 'BOTH EXPLAIN IT (SPLIT first, then PA2)']);
  cases.push(['PA2 just over half (£221 against £220): neither', out(440, 221, 300).outcome, 'NEITHER']);
  cases.push(['PA2 at half exactly with no width: explains it', out(440, 220, 300).outcome, 'PA2 EXPLAINS IT']);
  { const R = rule(kinds(440, 100, 400, { Q: 6000 }), N); cases.push(['PA2 under half but its interval reaching past D\'s point: does not', `${R.outcome} ${R.each.PA2.d <= 220} ${R.each.PA2.hi > R.D.d}`, 'NEITHER true true']); }
  { const R = rule(kinds(440, 100, 400, { Q: 2000 }), N); cases.push(['PA2 under half, its interval wide but its upper end below D\'s point: explains it', `${R.outcome} ${R.each.PA2.hi > 220} ${R.each.PA2.hi < R.D.d}`, 'PA2 EXPLAINS IT true true']); }
  cases.push(['D at nought: no loss to explain, nothing read', out(0, -100, -100).outcome, 'NO LOSS TO EXPLAIN']);
  { const R = rule(kinds(50, 0, 0, { D: 60000 }), N); cases.push(['D at £50 with its interval across nought: no loss to explain', `${R.outcome} ${R.D.lo < 0}`, 'NO LOSS TO EXPLAIN true']); }
  { const k = kinds(440, 100, 400); k[3].yrs = 40; k[3].y.arms.ROUTE = arm(40 * 440); cases.push(['a kind with 40 years is counted a year: the rise the same', f2(rule(k, N).D.d), '440.00']); }
  // the gate
  { const ids = ['A', 'B'], u = id => ({ id, k: 0, seed: SEED, N: N_DEFAULT, pts: APP_POINTS, stamp: { code: 'c', audit: stampFilesHash(), node: 'v' }, checks: ['1 a', '2 b', '3 c', '4 d', '5 e'], arms: Object.fromEntries(ARMS.map(a => [a, { config: configOf(a) }])) });
    const good = gate([u('A'), u('B')], ids).length, miss = gate([u('A')], ids).length > 0, cfg = gate([u('A'), { ...u('B'), arms: { ...u('B').arms, SPLIT: { config: 'x' } } }], ids).length > 0;
    const chk = gate([u('A'), { ...u('B'), checks: ['1 a', '2 not checked at a smoke\'s points', '3 c', '4 d', '5 e'] }], ids).length > 0, seed = gate([u('A'), { ...u('B'), seed: 7027 }], ids).length > 0;
    cases.push(['the gate passes two clean units, and refuses one missing, a wrong configuration, a check not made and another seed', `${good} ${miss} ${cfg} ${chk} ${seed}`, '0 true true true true']); }
  let fails = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(fails ? `FAILED: ${fails} of ${cases.length}` : `ALL PASS: ${cases.length} planted checks`);
  process.exit(fails ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.env.REG !== '1') { console.error('reduce-couples-uneven: reads the registered panel, REG=1'); process.exit(2); }
  if (process.argv.includes('--planted')) planted();
  const smoke = process.env.SMOKE === '1', dir = process.argv[2] || OUT_DEFAULT;
  if (!existsSync(dir)) { console.error(`reduce-couples-uneven: no ${dir}`); process.exit(2); }
  const panelUnits = unitsOf(readAnyPanel()), ids = smoke ? null : panelUnits.map(u => u.id);
  const units = loadDir(dir), bad = gate(units, ids || units.map(u => u.id), { smoke });
  if (bad.length) { console.log(`THE GATE: REFUSED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const logs = readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(dir, f), 'utf8'));
  if (!smoke) requireFairLogs(logs, 'none', { blob: () => '-' });
  const yearsById = Object.fromEntries(panelUnits.map(u => [u.id, yearsOf(u.plan)])), u0 = units[0];
  console.log(`THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS, EXPLORATORY (COUPLES-UNEVEN.md; the deep review of the registered read, section 3): ${units.length} units, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, code ${u0.stamp.code}, audit ${u0.stamp.audit}${smoke ? ', A SMOKE' : ''}`);
  console.log(`THE GATE: fair (every unit, one stamp, each arm's configuration, every check recorded${smoke ? '' : ', the logs\' stamps'})`);
  console.log(report(units, yearsById));
}
