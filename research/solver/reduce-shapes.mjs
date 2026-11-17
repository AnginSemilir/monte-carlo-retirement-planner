/*
 * THE SHAPES THE LIBRARY LACKS, THE READ (SHAPES.md, its rule committed before this was built; PRESCRIPTIVE-PLAN.md step 5;
 * D120; EXPLORATORY): HS (the household's move from the single's chooser, at the split the lead test left) against K2 (the
 * couples' default) on audit-shapes.mjs's units. The gate first (fair-gate.mjs on the units' logs; one code, audit, seed,
 * size, candidate and split; each unit's four arms whole, in their order, timed and recorded), then the rule, HS less K2,
 * paired by path on stats.mjs survivalChange, the lead test's parts 1, 2, 3 and 6 (HOUSEHOLD.md section 5 as amended for
 * step 4), pooled over the units that ran and by shape:
 *   1. pooled survival: holds when the interval's lower end is above 0;
 *   2. survival by unit: a unit whose interval lies wholly below -0.3 points lies below the bar;
 *   3. pooled spending delivered on the paths both arms keep, as a percentage of K2's: holds when not lower by more than
 *      0.05% (the pooled figure);
 *   6. by unit, the household table's opening forecast less HS's survival: within 2 points, a unit outside named.
 * Beside them, for every unit: CEIL less HS in survival, paired by path; and HS less APP. Outcomes: HOLDS ON EVERY SHAPE
 * (parts 1 and 3 hold pooled; no unit lies below the bar; no shape's units average more than 1 point of CEIL less HS);
 * A SHAPE TO PLACE (parts 1 and 3 hold pooled; a unit lies below the bar, or a shape averages more than 1 point of CEIL
 * less HS); DOES NOT HOLD (part 1 or part 3 fails pooled).
 *   node research/solver/reduce-shapes.mjs [--smoke] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange } from './stats.mjs';
import { spendOn, cells, armOf, biasesNil } from './reduce-household.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));

export const RULE = { unit: -0.3, spend: -0.05, forecast: 2, ceil: 1 }, CANDIDATE = 'af001697ce1b';
/* SHAPES.md amendment 1 (17 Nov; D125, D126): the read takes exactly two audit stamps, the launch's for every unit not run
   again and the amended files' (stampFilesHash() now) for the units named here, run again on the amended settings check */
export const AMEND = Object.freeze({ launch: '260916d007cd', rerun: Object.freeze(['S147-db@penA100']) });
export const JOINT = { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2 };
export const ARMS = ['APP', 'K2', 'HS', 'CEIL'], SHAPES = ['even', 'gap8', 'gap12', 'elder2nd', 'part60', 'penB90', 'penA100'];
export const orderOf = k => [...ARMS.slice(k % ARMS.length), ...ARMS.slice(0, k % ARMS.length)];
export const wantOptions = (arm, split) => (arm === 'K2' ? { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2, topK: 2 }
  : arm === 'HS' ? { household: 'A', move: 'single', split, tieAboveCap: 1e-4 } : arm === 'CEIL' ? { household: 'A', ceiling: 'withTable', tieAboveCap: 1e-4 } : { app: 'armA' });
const KEYS = ['survived', 'failYear', 'pot', 'estate', 'tax', 'delivered', 'unmet'];
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const mean = a => (a.length ? sum(a) / a.length : NaN);
const js = x => JSON.stringify(x);

/* the gate over the units (each with its arms decoded), against the panel's units: every problem */
export function gate(units, ids, audit, size = { N: 4000, seed: 7002, pts: 45 }, partial = false) {
  const P = [], missing = partial ? [] : ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts); one('split', u => u.split);
  // the audit: one stamp, these files' (as launched); or, given { launch, amended, rerun } (SHAPES.md amendment 1), the
  // launch's on every unit not run again and the amended files' on each unit run again, and no other
  if (audit && typeof audit === 'object') {
    for (const U of units) { const again = audit.rerun.includes(U.id), want = again ? audit.amended : audit.launch; if (U.stamp.audit !== want) P.push(`${U.id}: audit ${U.stamp.audit}, not ${again ? "the amended files'" : "the launch's"} ${want}`); }
  } else {
    one('audit', u => u.stamp.audit);
    if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  }
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate (${CANDIDATE})`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const k = ids.indexOf(U.id);
    if (k < 0) { P.push(`${U.id}: not in the panel`); continue; }
    if (U.k !== k || js(U.order) !== js(orderOf(k))) P.push(`${U.id}: unit ${U.k} with the arms in the order ${js(U.order)}, not unit ${k}'s ${js(orderOf(k))}`);
    if (U.mirrored !== (U.shape === 'elder2nd')) P.push(`${U.id}: ${U.mirrored ? 'mirrored' : 'not mirrored'} as a ${U.shape} unit`);
    const d = U.digests || {};
    if (!d.before || ['self', 'part', 'household'].some(w => !d.before[w] || d.before[w] !== d.after[w])) P.push(`${U.id}: a table changed between the first arm and the last`);
    if (!(U.cap > 0) || !(U.houseCap > 0)) P.push(`${U.id}: no cap recorded`);
    if (U.shareRule !== 'pots' || js(U.joint) !== js(JOINT)) P.push(`${U.id}: the joint move ${js(U.joint)} on ${U.shareRule}`);
    if (!U.bias || !U.bias.incomeTaxLeftOut || !U.bias.cgtBand) P.push(`${U.id}: its biases not recorded in full`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const key of KEYS) if (!x[key] || x[key].length !== U.N) P.push(`${U.id} ${a}: ${key} not one a path`);
      if (js(x.options) !== js(wantOptions(a, U.split))) P.push(`${U.id} ${a}: the options read back ${js(x.options)}, not ${js(wantOptions(a, U.split))}`);
      if (!(x.cpuUs > 0) || x.place !== U.order.indexOf(a) || (a !== 'APP' && !(x.forecast >= 0 && x.forecast <= 1))) P.push(`${U.id} ${a}: no time or no forecast, or not timed in its place`);
      const ch = x.chunks || [];
      if (!ch.length || ch[0].from !== 0 || ch[ch.length - 1].to !== U.N || ch.some((c, i) => i > 0 && c.from !== ch[i - 1].to) || ch.some(c => !c.proc || !c.cpu)) P.push(`${U.id} ${a}: its chunks do not cover its paths in order, each with its process and CPU`);
    }
    if (U.arms.HS && U.arms.CEIL && U.arms.HS.forecast !== U.arms.CEIL.forecast) P.push(`${U.id}: HS and CEIL do not read one table's forecast`);
    if (U.arms.HS && !U.arms.HS.counts) P.push(`${U.id} HS: step 1's counts not recorded`);
  }
  return P;
}
const change = (U, base, arm) => { const c = cells(U.arms[base], U.arms[arm]); return { c, ch: survivalChange(c.lost, c.saved, c.N) }; };
const pooled = cs => survivalChange(sum(cs.map(c => c.lost)), sum(cs.map(c => c.saved)), sum(cs.map(c => c.N)));
/* the rule over a set of units: parts 1, 2, 3 and 6, HS less K2, and CEIL less HS by unit */
export function ruleOf(units) {
  const H = units.map(U => {
    const hk = change(U, 'K2', 'HS'), ce = change(U, 'HS', 'CEIL'), ap = change(U, 'APP', 'HS'), s = 100 * sum(U.arms.HS.survived) / U.N, f = 100 * U.arms.HS.forecast;
    return { id: U.id, shape: U.shape, base: U.base, U, cells: hk.c, ch: hk.ch, ceil: ce.ch, app: ap.ch, forecast: f, survival: s, gap: f - s };
  });
  const pool = pooled(H.map(h => h.cells)), kept = spendOn(units.map(U => [U.arms.K2, U.arms.HS]), true).pooled;
  const below = H.filter(h => h.ch.hi < RULE.unit), fcOut = H.filter(h => Math.abs(h.gap) > RULE.forecast);
  return { H, pool, kept, part1: pool.lo > 0, part3: kept.d >= RULE.spend, below, fcOut };
}
export function rule(units) {
  const R = ruleOf(units);
  const byShape = SHAPES.map(s => { const us = units.filter(U => U.shape === s); if (!us.length) return null; const r = ruleOf(us); return { shape: s, n: us.length, r, ceilMean: mean(r.H.map(h => h.ceil.d)) }; }).filter(Boolean);
  const ceilOver = byShape.filter(b => b.ceilMean > RULE.ceil);
  const outcome = !R.part1 || !R.part3 ? 'DOES NOT HOLD' : R.below.length || ceilOver.length ? 'A SHAPE TO PLACE' : 'HOLDS ON EVERY SHAPE';
  return { R, byShape, ceilOver, outcome };
}

/* the planted checks: synthetic units the read must read as the rule says */
function planted() {
  const n = 4000, checks = [], ids = SHAPES.flatMap(s => [`X@${s}`, `Y@${s}`]);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const T = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
  const armWith = (surv, deliv = () => 1000) => { const A = Object.fromEntries(Object.entries(T).map(([k, Ty]) => [k, new Ty(n)])); for (let i = 0; i < n; i++) { const s = surv(i); A.survived[i] = s ? 1 : 0; A.failYear[i] = s ? -1 : 5; A.pot[i] = 100; A.estate[i] = 100; A.tax[i] = 10; A.delivered[i] = deliv(i, s); A.unmet[i] = 0; } return Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])); };
  const NIL = { lockedYears: 0, lockedAt: [], penShareSelf: 0.6, incomeTaxLeftOut: { aYear: 0, overPlan: 0, shareOfSpending: 0 }, oneOffOwned: [], cgtBand: { household: 75400, twoPeople: 75400 } };
  const unitOf = (id, k, arms, fc = 0.9) => {
    const order = orderOf(k), shape = id.split('@')[1];
    const mk = (A, a) => armOf({ options: wantOptions(a, 'best5'), cpuUs: 1e6, chunks: [{ from: 0, to: n, cpuUs: 1e6, wallMs: 1, cpu: 'x', proc: 'p' }], place: order.indexOf(a), solveSecs: 1, forecast: a === 'APP' ? null : fc, ...(a === 'HS' ? { counts: { decisions: 1, far: 0, down: 0 } } : {}), ...A });
    return { id, k, base: id.split('@')[0], shape, mirrored: shape === 'elder2nd', order, N: n, seed: 7002, pts: 45, candidate: CANDIDATE, split: 'best5', stamp: { code: 'c', audit: 'a' }, digests: { before: { self: 's', part: 'p', household: 'h' }, after: { self: 's', part: 'p', household: 'h' } }, cap: 100, houseCap: 100, shareRule: 'pots', joint: JOINT, bias: NIL,
      arms: Object.fromEntries(ARMS.map(a => [a, mk(arms[a], a)])) };
  };
  const base = armWith(i => i % 10 !== 0), gain = armWith(i => i % 10 !== 0 || i % 80 === 0), app = armWith(i => i % 5 !== 0);
  const arms = (o = {}) => ({ APP: app, K2: base, HS: gain, CEIL: gain, ...o });
  const all = (o = {}, fix = null) => ids.map((id, k) => unitOf(id, k, fix && fix.id === id ? arms(fix.o) : arms(o)));
  const r0 = rule(all());
  checks.push(['a gain on every unit, CEIL level with HS, reads HOLDS ON EVERY SHAPE', r0.outcome === 'HOLDS ON EVERY SHAPE', r0.outcome]);
  const fewer = armWith(i => i % 10 !== 0 && i % 100 !== 1), r1 = rule(all({}, { id: 'X@gap8', o: { HS: fewer } }));
  checks.push(['a unit a point below K2, the pool gaining, reads A SHAPE TO PLACE', r1.outcome === 'A SHAPE TO PLACE' && r1.R.below.map(h => h.id).join() === 'X@gap8' && r1.R.part1, `${r1.outcome}; ${r1.R.below.map(h => h.id).join()}`]);
  const ceilHi = armWith(i => i % 10 !== 0 || i % 20 === 0), r2 = rule(ids.map((id, k) => unitOf(id, k, id.endsWith('@penB90') ? arms({ CEIL: ceilHi }) : arms())));
  checks.push(['a shape whose units average more than a point of CEIL less HS reads A SHAPE TO PLACE', r2.outcome === 'A SHAPE TO PLACE' && r2.ceilOver.map(b => b.shape).join() === 'penB90', `${r2.outcome}; ${r2.ceilOver.map(b => `${b.shape} ${b.ceilMean.toFixed(3)}`).join()}`]);
  const r3 = rule(all({ HS: base }));
  checks.push(['nothing gained pooled reads DOES NOT HOLD', r3.outcome === 'DOES NOT HOLD' && !r3.R.part1, r3.outcome]);
  const lowKept = armWith(i => i % 10 !== 0 || i % 80 === 0, (i, s) => (i % 10 !== 0 ? 999.4 : 1000)), r4 = rule(all({ HS: lowKept }));
  checks.push(['spending on the kept paths 0.06% lower reads DOES NOT HOLD (part 3)', r4.outcome === 'DOES NOT HOLD' && !r4.R.part3 && Math.abs(r4.R.kept.d + 0.06) < 1e-9, `${r4.outcome}; ${r4.R.kept.d.toFixed(4)}%`]);
  const r5 = rule(ids.map((id, k) => unitOf(id, k, arms(), id === 'Y@even' ? (100 * (n - 350) / n + 3) / 100 : 0.9)));
  checks.push(['a forecast 3 points from HS names the unit and leaves the outcome', r5.outcome === r0.outcome && r5.R.fcOut.some(h => h.id === 'Y@even'), r5.R.fcOut.map(h => `${h.id} ${h.gap.toFixed(2)}`).join()]);
  const U0 = all();
  checks.push(['the gate takes the planted units, refuses one missing and an elder2nd unit not mirrored', gate(U0, ids, 'a', null).length === 0 && gate(U0.slice(1), ids, 'a', null).some(p => /missing/.test(p))
    && gate(U0.map(U => (U.shape === 'elder2nd' && U.id.startsWith('X') ? { ...U, mirrored: false } : U)), ids, 'a', null).some(p => /mirrored/.test(p))]);
  // SHAPES.md amendment 1: the gate on two stamps
  const two = { launch: 'L', amended: 'A', rerun: ['X@gap8'] }, stamped = (f) => U0.map(U => ({ ...U, stamp: { code: 'c', audit: f(U) } }));
  const asNamed = stamped(U => (U.id === 'X@gap8' ? 'A' : 'L'));
  checks.push(['amendment 1: the units on their two stamps as named pass the gate', gate(asNamed, ids, two, null).length === 0, gate(asNamed, ids, two, null).join('; ')]);
  checks.push(['amendment 1: a unit not run again on the amended stamp is refused', gate(stamped(U => (U.id === 'X@gap8' || U.id === 'Y@even' ? 'A' : 'L')), ids, two, null).some(p => /Y@even: audit A, not the launch's/.test(p))]);
  checks.push(['amendment 1: the unit run again on the launch stamp is refused', gate(stamped(() => 'L'), ids, two, null).some(p => /X@gap8: audit L, not the amended files'/.test(p))]);
  checks.push(['amendment 1: a third stamp is refused', gate(stamped(U => (U.id === 'X@gap8' ? 'A' : U.id === 'Y@even' ? 'Z' : 'L')), ids, two, null).some(p => /Y@even: audit Z/.test(p))]);
  let bad = 0;
  for (const [label, ok, detail] of checks) { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`); }
  console.log(bad ? `PLANTED: ${bad} of ${checks.length} FAILED` : `PLANTED: ALL PASS (${checks.length})`);
  return bad;
}

const f2 = x => (x >= 0 ? '+' : '') + x.toFixed(2), f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const { stampFilesHash } = await import('./audit-shapes.mjs'), { readShapesPanel } = await import('./shapes-panel.mjs');
  const DIR = process.env.SH_OUT || join(HERE, 'results', 'shapes-7002'), smoke = args.includes('--smoke');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)) : [];
  if (!files.length) { console.error(`reduce-shapes: no units in ${DIR}`); process.exit(2); }
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    const logs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
    // SHAPES.md amendment 1 (D126): the fair-test gate takes exactly the two versions, on the one code the units ran on
    const { codeId } = await import('./code-id.mjs'), code = codeId().hash;
    requireFairLogs(logs, 'none', { blob: () => '-', allowed: [`code ${code} audit ${AMEND.launch}`, `code ${code} audit ${stampFilesHash()}`] });
  }
  const units = files.map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
  const ids = readShapesPanel().map(u => u.id), problems = gate(units, ids, smoke ? stampFilesHash() : { launch: AMEND.launch, amended: stampFilesHash(), rerun: AMEND.rerun }, smoke ? null : undefined, smoke);
  console.log(`THE SHAPES THE LIBRARY LACKS (EXPLORATORY; SHAPES.md): ${units.length} units, seed ${units[0].seed}, ${units[0].N} paths, ${units[0].pts} points; HS at the split '${units[0].split}'; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);
  if (problems.length) { console.log(`THE GATE: REFUSED\n  ${problems.join('\n  ')}`); process.exit(3); }
  console.log('THE GATE: fair');
  if (smoke) { console.log('a smoke: the gate read, no figure printed'); process.exit(0); }
  units.sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
  const X = rule(units), R = X.R, say = ok => (ok ? 'HOLDS' : 'FAILS');
  console.log('\nTHE RULE, HS less K2, paired by path (stats.mjs survivalChange), pooled over the units that ran:');
  console.log(`  1. pooled survival ${iv(R.pool)} points over ${units.length} units; its lower end above 0: ${say(R.part1)}`);
  console.log(`  2. units whose interval lies wholly below ${RULE.unit}: ${R.below.map(h => `${h.id} ${iv(h.ch)} (${h.cells.saved} saved, ${h.cells.lost} lost; biases ${biasesNil(h.U.bias) ? 'nil' : 'not nil'})`).join('; ') || 'none'}`);
  console.log(`  3. pooled spending delivered on the paths both keep ${iv(R.kept, f4)}% of K2's; not lower by more than ${-RULE.spend}%: ${say(R.part3)}`);
  console.log(`  6. the household table's opening forecast less HS's survival, beyond ${RULE.forecast} points: ${R.fcOut.map(h => `${h.id} ${f2(h.gap)}`).join('; ') || 'none'} (named; the outcome unchanged)`);
  console.log(`  by shape: ${X.byShape.map(b => `${b.shape} (${b.n}): survival ${iv(b.r.pool)}, spending kept ${f4(b.r.kept.d)}%, below the bar ${b.r.below.length}, CEIL less HS ${f3(b.ceilMean)} on average`).join('; ')}`);
  console.log(`  shapes whose units average more than ${RULE.ceil} point of CEIL less HS: ${X.ceilOver.map(b => `${b.shape} ${f3(b.ceilMean)}`).join('; ') || 'none'}`);
  console.log(`OUTCOME: ${X.outcome}`);
  console.log('\nBESIDE THE RULE, deciding nothing; by unit: survival APP / K2 / HS / CEIL (%), HS less K2 (interval; saved / lost), CEIL less HS, HS less APP, the forecast less HS, the biases');
  for (const h of R.H) {
    const U = h.U, sv = a => (100 * sum(U.arms[a].survived) / U.N).toFixed(2);
    console.log(`  ${U.id.padEnd(20)} ${sv('APP')} / ${sv('K2')} / ${sv('HS')} / ${sv('CEIL')}; ${iv(h.ch)} (${h.cells.saved} / ${h.cells.lost}); ${iv(h.ceil)}; ${iv(h.app)}; ${f2(h.gap)}; ${biasesNil(U.bias) ? 'nil' : `locked ${U.bias.lockedYears}, share ${U.bias.penShareSelf.toFixed(2)}, tax left out ${Math.round(U.bias.incomeTaxLeftOut.aYear)} a year, deposits ${U.bias.oneOffOwned.length}`}${U.mirrored ? '; handed to the solvers as its mirror' : ''}`);
  }
}
