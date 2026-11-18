/*
 * WHAT KEYS THE GUARD, THE READ (GUARD-KEY.md; D129 (4); EXPLORATORY): today's couples' default (K2) against the app's rules
 * (APP) on step 5's four couples 8 or 12 years apart without a DB pension, each given S147-db's DB pension (+db) or rent
 * (+rent), by the rule committed before any unit was landed or run. The gate first (fair-gate.mjs on the units' logs; one
 * code, audit, seed, size and candidate; every unit of guard-panel.json there, its two arms whole and in their order, K2's
 * tables the same before and after, the app's guard's answer recorded). Then, for each income, K2 less APP paired by path
 * (stats.mjs survivalChange, the exact interval) on each unit and pooled over the income's units (their cells summed), the
 * first that holds:
 *   HARM        the pooled K2 less APP lies wholly below nought;
 *   SOME HARM   a unit's K2 less APP lies wholly below -0.3 points;
 *   NO HARM     otherwise;
 * and fewer than three units of an income landed is a STOP. What +db decides: HARM or SOME HARM, THE GUARD STAYS; NO HARM,
 * THE GUARD IS KEYED ON THE WRONG THING (re-keying back to the maintainer as a change of default). +rent decides nothing;
 * it sizes the guard's reach past a DB pension. Beside, deciding nothing: each unit's survival, spending on the paths both
 * keep, the capped pot and lifetime tax; the landed targets; the app's guard's answer; and the same four couples without the
 * income, from step 5's stored arms (results/shapes-7002).
 *   node research/solver/reduce-guard.mjs [--smoke] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange } from './stats.mjs';
import { armOf, cells, spendOn } from './reduce-household.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ARMS = ['APP', 'K2'], INCOMES = ['db', 'rent'];
export const RULE = { unit: -0.3, least: 3 }, CANDIDATE = 'af001697ce1b';
export const JOINT = { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2 };
export const SHAPE_UNITS = ['S149@gap8', 'S149@gap12', 'S337F@gap8', 'S337F@gap12'];
export const orderOf = k => (k % 2 ? ['K2', 'APP'] : ['APP', 'K2']);
export const wantOptions = arm => (arm === 'K2' ? { ...JOINT, topK: 2 } : { app: 'armA' });
const KEYS = ['survived', 'failYear', 'pot', 'estate', 'tax', 'delivered', 'unmet'];
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const mean = a => (a.length ? sum(a) / a.length : NaN);
const js = x => JSON.stringify(x);

/* THE GATE: each unit against the panel (ids: guard-panel.json's units, in its order) */
export function gate(units, ids, audit, size = { N: 4000, seed: 7002, pts: 45 }, partial = false) {
  const P = [], missing = partial ? [] : ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate (${CANDIDATE})`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const k = ids.indexOf(U.id);
    if (k < 0) { P.push(`${U.id}: not in the panel`); continue; }
    if (U.k !== k || js(U.order) !== js(orderOf(k))) P.push(`${U.id}: unit ${U.k} with the arms in the order ${js(U.order)}, not unit ${k}'s ${js(orderOf(k))}`);
    if (!INCOMES.includes(U.kind) || !SHAPE_UNITS.includes(U.shapeId) || U.id !== `${U.shapeId}+${U.kind}`) P.push(`${U.id}: its couple ${U.shapeId} and income ${U.kind} not the design's`);
    const d = U.digests || {};
    if (!d.before || ['self', 'part'].some(w => !d.before[w] || d.before[w] !== d.after[w])) P.push(`${U.id}: K2's tables changed between the first arm and the last`);
    if (js(U.joint) !== js(JOINT) || U.shareRule !== 'pots') P.push(`${U.id}: the joint move ${js(U.joint)} on ${U.shareRule}`);
    if (!U.guard || typeof U.guard.why === 'undefined') P.push(`${U.id}: the app's guard's answer not recorded`);
    if (!(U.cap > 0) || !(U.T > 0)) P.push(`${U.id}: no cap or horizon recorded`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const key of KEYS) if (!x[key] || x[key].length !== U.N) P.push(`${U.id} ${a}: ${key} not one a path`);
      if (js(x.options) !== js(wantOptions(a))) P.push(`${U.id} ${a}: the options read back ${js(x.options)}, not ${js(wantOptions(a))}`);
      if (!(x.cpuUs > 0) || x.place !== U.order.indexOf(a)) P.push(`${U.id} ${a}: no time, or not run in its place`);
      const ch = x.chunks || [];
      if (!ch.length || ch[0].from !== 0 || ch[ch.length - 1].to !== U.N || ch.some((c, i) => i > 0 && c.from !== ch[i - 1].to) || ch.some(c => !c.proc || !c.cpu)) P.push(`${U.id} ${a}: its chunks do not cover its paths in order, each with its process and machine`);
    }
  }
  return P;
}
/* K2 less APP on one unit: its cells and the exact paired interval */
export const changeOf = U => { const c = cells(U.arms.APP, U.arms.K2); return { cells: c, ch: survivalChange(c.lost, c.saved, c.N) }; };
/* the rule for one income over its units */
export function incomeOutcome(us) {
  if (us.length < RULE.least) return { outcome: 'STOP', n: us.length, H: [], below: [] };
  const H = us.map(U => ({ id: U.id, U, ...changeOf(U) }));
  const pooled = survivalChange(sum(H.map(h => h.cells.lost)), sum(H.map(h => h.cells.saved)), sum(H.map(h => h.cells.N)));
  const below = H.filter(h => h.ch.hi < RULE.unit);
  const outcome = pooled.hi < 0 ? 'HARM' : below.length ? 'SOME HARM' : 'NO HARM';
  return { outcome, n: us.length, H, pooled, below };
}
export function rule(units) {
  const R = Object.fromEntries(INCOMES.map(k => [k, incomeOutcome(units.filter(U => U.kind === k))]));
  const db = R.db.outcome, verdict = db === 'STOP' ? 'STOP' : db === 'NO HARM' ? 'THE GUARD IS KEYED ON THE WRONG THING' : 'THE GUARD STAYS';
  return { R, verdict };
}
/* the pot counted up to the cap, K2's mean against APP's */
export function cappedOf(cap, b, x) {
  let sb = 0, sx = 0; const n = b.pot.length;
  for (let i = 0; i < n; i++) { sb += Math.min(b.pot[i], cap); sx += Math.min(x.pot[i], cap); }
  return { pct: sb > 0 ? 100 * (sx / sb - 1) : 0, gbp: (sx - sb) / n };
}

/* the planted checks: units built by hand, each outcome and each gate refusal shown on a case made to give it */
function planted() {
  const N = 4000, T = 40;
  const arm = surv => ({ survived: Uint8Array.from(surv), failYear: Int16Array.from(surv.map(s => (s ? -1 : T))), pot: Float64Array.from(surv.map(s => (s ? 5e5 : 0))), estate: new Float64Array(N), tax: new Float64Array(N), delivered: Float64Array.from(surv.map(() => 1e6)), unmet: new Float64Array(N) });
  // APP keeps the first 3,400 paths; K2 keeps `keep` of APP's and `extra` of APP's lost
  const unit = (id, kind, k, keep, extra) => {
    const app = Array.from({ length: N }, (_, i) => (i < 3400 ? 1 : 0)), k2 = Array.from({ length: N }, (_, i) => (i < 3400 ? (i < keep ? 1 : 0) : (i < 3400 + extra ? 1 : 0)));
    const raw = x => Object.fromEntries(KEYS.map(key => [key, Buffer.from(x[key].buffer).toString('base64')]));
    const A = { APP: arm(app), K2: arm(k2) }, order = orderOf(k);
    return { k, id, shapeId: id.split('+')[0], kind, seed: 7002, N, pts: 45, candidate: CANDIDATE, stamp: { code: 'c', audit: 'a' }, joint: JOINT, shareRule: 'pots', order, cap: 1e6, T, guard: { on: false, why: 'gapincome' },
      digests: { before: { self: 's', part: 'p' }, after: { self: 's', part: 'p' } },
      arms: Object.fromEntries(ARMS.map(a => [a, { ...A[a], raw: raw(A[a]), options: wantOptions(a), cpuUs: 1, place: order.indexOf(a), chunks: [{ from: 0, to: N, cpuUs: 1, proc: 'p', cpu: 'c' }] }])) };
  };
  const ids = SHAPE_UNITS.flatMap(s => INCOMES.map(i => `${s}+${i}`));
  const panel = (db, rent) => ids.map((id, k) => { const [s, kind] = id.split('+'), j = SHAPE_UNITS.indexOf(s), [keep, extra] = (kind === 'db' ? db : rent)[j]; return unit(id, kind, k, keep, extra); });
  const gain = [3400, 200], loss = [3000, 0], small = [3392, 0];
  const checks = [], t = (label, got, want) => checks.push([label, got, want]);
  { const r = rule(panel([loss, loss, loss, loss], [gain, gain, gain, gain])); t('every +db unit losing 10 points: HARM, the guard stays; +rent gaining: NO HARM', `${r.R.db.outcome} | ${r.verdict} | ${r.R.rent.outcome}`, 'HARM | THE GUARD STAYS | NO HARM'); }
  { const r = rule(panel([loss, gain, gain, gain], [gain, gain, gain, gain])); t('one +db unit losing 10 points, three gaining 5: SOME HARM (the pooled not wholly below nought), the guard stays', `${r.R.db.outcome} ${r.R.db.pooled.hi >= 0} | ${r.verdict} | ${r.R.db.below.map(h => h.id).join(',')}`, 'SOME HARM true | THE GUARD STAYS | S149@gap8+db'); }
  { const r = rule(panel([gain, gain, gain, gain], [loss, loss, loss, loss])); t('every +db unit gaining: NO HARM, the guard keyed on the wrong thing; +rent losing: HARM', `${r.R.db.outcome} | ${r.verdict} | ${r.R.rent.outcome}`, 'NO HARM | THE GUARD IS KEYED ON THE WRONG THING | HARM'); }
  { const r = rule(panel([small, gain, gain, gain], [gain, gain, gain, gain])); t('a unit losing 0.2 points, within -0.3 of nought: not harm', `${r.R.db.outcome} ${r.R.db.H[0].ch.d.toFixed(2)}`, 'NO HARM -0.20'); }
  { const us = panel([loss, loss, loss, loss], [gain, gain, gain, gain]).filter(U => !(U.kind === 'db' && U.shapeId !== 'S149@gap8')); const r = rule(us); t('one +db unit landed: STOP', `${r.R.db.outcome} | ${r.verdict}`, 'STOP | STOP'); }
  // the gate
  const clean = panel([gain, gain, gain, gain], [gain, gain, gain, gain]);
  t('the gate passes the eight clean units', gate(clean, ids, 'a').length, 0);
  { const us = clean.slice(0, 7); t('a unit missing: refused', gate(us, ids, 'a').some(p => /units missing: S337F@gap12\+rent/.test(p)), true); }
  { const us = panel([gain, gain, gain, gain], [gain, gain, gain, gain]); us[3].stamp = { code: 'c', audit: 'b' }; t('two audit stamps: refused', gate(us, ids, 'a').some(p => /more than one audit/.test(p)), true); }
  { const us = panel([gain, gain, gain, gain], [gain, gain, gain, gain]); us[2].digests.after = { self: 'x', part: 'p' }; t('K2\'s tables changed during the unit: refused', gate(us, ids, 'a').some(p => /S149@gap12\+db: K2's tables changed/.test(p)), true); }
  { const us = panel([gain, gain, gain, gain], [gain, gain, gain, gain]); us[5].order = ['APP', 'K2']; t('a unit\'s arms in another order: refused', gate(us, ids, 'a').some(p => /S337F@gap8\+rent: unit 5 with the arms in the order/.test(p)), true); }
  { const us = panel([gain, gain, gain, gain], [gain, gain, gain, gain]); delete us[0].guard; t('the app\'s guard\'s answer not recorded: refused', gate(us, ids, 'a').some(p => /guard's answer not recorded/.test(p)), true); }
  let bad = 0;
  for (const [label, got, want] of checks) { const ok = String(got) === String(want); if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${checks.length} FAILED` : `PLANTED: ALL PASS (${checks.length})`);
  return bad;
}

const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const pct = x => `${(100 * x).toFixed(2)}%`, gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const { stampFilesHash } = await import('./audit-guard.mjs');
  const { PANEL } = await import('./guard-panel.mjs');
  const DIR = process.env.GD_OUT || join(HERE, 'results', 'guard-7002'), smoke = args.includes('--smoke');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)) : [];
  if (!files.length) { console.error(`reduce-guard: no units in ${DIR}`); process.exit(2); }
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    const logs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
    requireFairLogs(logs, 'none', { blob: () => '-' });
  }
  const units = files.map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
  const panel = JSON.parse(readFileSync(PANEL, 'utf8')), ids = panel.units.map(u => u.id);
  const problems = gate(units, ids, stampFilesHash(), smoke ? null : undefined, smoke);
  console.log(`WHAT KEYS THE GUARD (EXPLORATORY; GUARD-KEY.md, D129 (4)): ${units.length} units, seed ${units[0].seed}, ${units[0].N} paths, ${units[0].pts} points; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}; landed ${ids.length} of 8${panel.out.length ? ` (not landed: ${panel.out.join(', ')})` : ''}`);
  if (problems.length) { console.log(`THE GATE: REFUSED\n  ${problems.join('\n  ')}`); process.exit(3); }
  console.log('THE GATE: fair');
  if (smoke) { console.log('a smoke: the gate read, no figure printed'); process.exit(0); }
  units.sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
  const X = rule(units);
  console.log('\nTHE RULE, K2 less APP, paired by path (stats.mjs survivalChange):');
  for (const kind of INCOMES) {
    const r = X.R[kind];
    if (r.outcome === 'STOP') { console.log(`  +${kind}: ${r.n} units landed, fewer than ${RULE.least}: STOP`); continue; }
    console.log(`  +${kind}: pooled over ${r.n} units ${iv(r.pooled)} points; units wholly below ${RULE.unit}: ${r.below.map(h => `${h.id} ${iv(h.ch)}`).join('; ') || 'none'}: ${r.outcome}`);
    for (const h of r.H) console.log(`    ${h.id.padEnd(20)} K2 less APP ${iv(h.ch)} (${h.cells.saved} saved, ${h.cells.lost} lost)`);
  }
  console.log(`OUTCOME: ${X.verdict}${X.R.rent.outcome !== 'STOP' ? `; the guard's reach past a DB pension (+rent): ${X.R.rent.outcome}` : ''}`);
  console.log('\nBESIDE THE RULE, deciding nothing:');
  for (const U of units) {
    const A = U.arms, sp = spendOn([[A.APP, A.K2]], true).pooled, cp = cappedOf(U.cap, A.APP, A.K2);
    console.log(`  ${U.id.padEnd(20)} target ${U.target} (step 5 ${U.step5}); APP ${pct(sum(A.APP.survived) / U.N)}, K2 ${pct(sum(A.K2.survived) / U.N)}; spending on the paths both keep, K2 against APP ${iv(sp, f4)}%; the capped pot ${f3(cp.pct)}% (${gbp(cp.gbp)} a path); lifetime tax APP ${gbp(mean(A.APP.tax))}, K2 ${gbp(mean(A.K2.tax))}; the app's guard: ${U.guard.on ? 'on' : `off (${U.guard.why})`}`);
  }
  const offGap = units.filter(U => U.guard.on || U.guard.why !== 'gapincome');
  console.log(`  the app's guard as built: ${offGap.length ? `NOT 'gapincome' on ${offGap.map(U => `${U.id} (${U.guard.on ? 'on' : U.guard.why})`).join(', ')}` : `'gapincome' on all ${units.length}`}`);
  // the same four couples without the income: step 5's stored arms, at their own landings
  const S5 = join(HERE, 'results', 'shapes-7002'), without = SHAPE_UNITS.map(id => { const f = join(S5, `${id.replace('@', '_')}.json.gz`); if (!existsSync(f)) return null; const U = JSON.parse(gunzipSync(readFileSync(f)).toString()); return { id, U: { ...U, arms: { APP: armOf(U.arms.APP), K2: armOf(U.arms.K2) } } }; }).filter(Boolean);
  if (without.length) {
    const H = without.map(w => ({ id: w.id, ...changeOf(w.U) }));
    const pooled = survivalChange(sum(H.map(h => h.cells.lost)), sum(H.map(h => h.cells.saved)), sum(H.map(h => h.cells.N)));
    console.log(`  without the income (step 5, results/shapes-7002, their own landings): pooled K2 less APP ${iv(pooled)}; ${H.map(h => `${h.id} ${iv(h.ch)}`).join('; ')}`);
  }
  console.log(`  the paths: ${units.map(U => `${U.id} K2 ${(U.arms.K2.cpuUs / 1e3 / U.N).toFixed(1)} ms`).join(', ')}`);
}
