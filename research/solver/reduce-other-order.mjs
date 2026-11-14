/*
 * COUPLES IN THE OTHER ORDER, STAGE A, READ (OTHER-ORDER.md, its rule committed before launch; D100, Part D's D7; EXPLORATORY,
 * seed 7002). Reads audit-other-order.mjs's units once: the gate (every unit in every arm; one code, audit, seed, count of
 * paths and points; the couples' candidate stage C ran; ELDER on the plan as tested and YOUNG and YOUNGE on its other order,
 * the same horizon; each person's spending share the same in both orders; the option on YOUNGE alone), then the rule and the
 * figures beside it.
 *   node research/solver/reduce-other-order.mjs [dir] [--smoke]      node research/solver/reduce-other-order.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooled: -0.2, unit: -0.5, spend: -0.1 }, CANDIDATE = 'af001697ce1b', ARMS = ['APP', 'ELDER', 'APPY', 'YOUNG', 'YOUNGE'];
export const OTHERS = ['YOUNG', 'YOUNGE'];
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, minPot: Uint8Array };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : NaN; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };

/* the gate over the units (each with its arms decoded), against the design's unit ids: every problem */
export function gate(units, ids, audit, size = { N: 4000, pts: 45, seed: 7002 }) {
  const P = [], missing = ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate stage C ran (${CANDIDATE}): ${[...new Set(units.map(u => u.candidate))].join(', ')}`);
  if (size && units.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    if (!ids.includes(U.id)) { P.push(`${U.id}: not in the design`); continue; }
    const o = U.order || {}, e = o.ELDER, y = o.YOUNG;
    if (!e || !y || !(e.ageSelf0 > e.agePart0)) P.push(`${U.id}: ELDER's plan not the elder first (${e ? `${e.ageSelf0}/${e.agePart0}` : 'none'})`);
    else if (y.ageSelf0 !== e.agePart0 || y.agePart0 !== e.ageSelf0 || y.years !== e.years || y.terminalAge - y.ageSelf0 !== e.terminalAge - e.ageSelf0) P.push(`${U.id}: the other order not the plan as tested swapped, ending in the same year (${e.ageSelf0}/${e.agePart0} to ${e.terminalAge}; ${y.ageSelf0}/${y.agePart0} to ${y.terminalAge})`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const k of Object.keys(KEYS)) if (x[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
      if (x.order !== (a === 'APP' || a === 'ELDER' ? 'ELDER' : 'YOUNG')) P.push(`${U.id} ${a}: run on the order ${x.order}`);
      if ((a === 'APP' || a === 'APPY') && !/^armA /.test(x.ran || '')) P.push(`${U.id} ${a}: not arm A's pick (${x.ran})`);
    }
    const [E1, Y, YE] = ['ELDER', 'YOUNG', 'YOUNGE'].map(a => U.arms[a]);
    if (!E1 || !Y || !YE) continue;
    if (new Set(ARMS.map(a => U.arms[a] && U.arms[a].T)).size !== 1) P.push(`${U.id}: the arms' horizons differ`);
    if ([E1, Y, YE].some(x => x.shareRule !== 'pots')) P.push(`${U.id}: a candidate arm not on the pots' share`);
    if (Math.abs(Y.share - (1 - E1.share)) > 1e-12 || YE.share !== Y.share) P.push(`${U.id}: each person's share not the same in both orders (ELDER ${E1.share}, YOUNG ${Y.share}, YOUNGE ${YE.share})`);
    if (E1.estateWeight !== null || Y.estateWeight !== null || E1.wB !== E1.wSelf || Y.wB !== Y.wSelf) P.push(`${U.id}: ELDER or YOUNG not at the first person's estate weight, the option unset`);
    if (YE.estateWeight !== 'elder' || YE.estateFrom !== 'part' || YE.wB !== YE.wPart) P.push(`${U.id}: YOUNGE not at the elder's estate weight under the option (${YE.estateWeight}, from ${YE.estateFrom})`);
  }
  return P;
}
/* the paired cells of B against A: a both survive, lost (A only), saved (B only), d neither */
export function cells(A, B) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = 0; i < A.survived.length; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; }
  return { a, lost, saved, d };
}
export const change = (A, B) => { const c = cells(A, B); return { ...survivalChangeU(c.a, c.lost, c.saved, c.d), cells: c }; };
/* the rule over the units */
export function rule(units) {
  const H = units.map(U => {
    const sv = X => 100 * mean(X.survived), spend = X => mean(X.delivered), el = U.arms.ELDER;
    const vs = Object.fromEntries(OTHERS.map(k => [k, { ch: change(el, U.arms[k]), spend: 100 * (spend(U.arms[k]) / spend(el) - 1) }]));
    const same = U.digests && U.digests.ELDER && U.digests.YOUNG ? U.digests.ELDER.self === U.digests.YOUNG.part && U.digests.ELDER.part === U.digests.YOUNG.self : null;
    // the paths on which an arm's run parts from ELDER's at all: another survival, or an estate a pound or more apart
    const parted = Object.fromEntries(OTHERS.map(k => { const X = U.arms[k]; let n = 0; for (let i = 0; i < U.N; i++) if (X.survived[i] !== el.survived[i] || Math.abs(X.estate[i] - el.estate[i]) >= 1) n++; return [k, n]; }));
    return { id: U.id, variant: U.variant, vs, app: change(U.arms.APP, U.arms.APPY), same, parted, factor: U.arms.YOUNG.wB / el.wB,
      surv: Object.fromEntries(ARMS.map(a => [a, sv(U.arms[a])])), pot: Object.fromEntries(ARMS.map(a => [a, mean(U.arms[a].pot)])), tax: Object.fromEntries(ARMS.map(a => [a, mean(U.arms[a].tax)])),
      minPot: Object.fromEntries(ARMS.map(a => [a, sum(U.arms[a].minPot)])) };
  });
  const tot = a => sum(units.map(U => sum(U.arms[a].delivered))) / sum(units.map(U => U.N));
  const R = Object.fromEntries(OTHERS.map(k => {
    const pooled = pooledSummed(H.map(h => h.vs[k].ch.cells)), units_ = H.filter(h => h.vs[k].ch.d < RULE.unit && h.vs[k].ch.hi < 0).map(h => h.id);
    const spend = 100 * (tot(k) / tot('ELDER') - 1);
    const a = pooled.d > RULE.pooled, b = !units_.length, c = spend >= RULE.spend;
    return [k, { pooled, units: units_, spend, a, b, c, within: a && b && c }];
  }));
  const verdict = R.YOUNG.within ? 'AS IT IS' : R.YOUNGE.within ? 'THE OPTION' : 'NEITHER';
  return { H, R, verdict, app: pooledSummed(H.map(h => h.app.cells)) };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 4000, ids = Array.from({ length: 24 }, (_, k) => `U${k}`);
  // an arm losing paths: odd i < 2*lost (spread over the paths), its spending `sp` a path
  const arm = (lost, o = {}) => ({ ran: o.ran || 'x', order: o.order, share: o.share === undefined ? null : o.share, shareRule: o.share === undefined ? null : 'pots', wB: o.wB === undefined ? null : o.wB, wSelf: o.wSelf === undefined ? null : o.wSelf, wPart: o.wPart === undefined ? null : o.wPart,
    estateWeight: o.estateWeight || null, estateFrom: o.estateFrom || null, T: 30, survived: Uint8Array.from({ length: N }, (_, i) => (i % 2 === 1 && i < 2 * lost ? 0 : 1)), failYear: new Int16Array(N).fill(-1),
    pot: new Float64Array(N).fill(1), estate: new Float64Array(N).fill(1), tax: new Float64Array(N).fill(1), delivered: new Float64Array(N).fill(o.sp || 1000), minPot: new Uint8Array(N) });
  // a unit: ELDER loses 400; YOUNG `y` and YOUNGE `ye` paths lost, their spending `ys` and `yes` a path
  const unit = (id, y = 400, ye = 400, o = {}) => ({ id, variant: '90', N, pts: 45, seed: 7002, candidate: o.candidate || CANDIDATE, stamp: { code: 'c', audit: 'a' },
    order: { ELDER: { ageSelf0: 70, agePart0: 65, terminalAge: 100, years: 30 }, YOUNG: { ageSelf0: 65, agePart0: 70, terminalAge: 95, years: 30 } }, digests: { ELDER: { self: 'e', part: 'y' }, YOUNG: { self: 'y', part: 'e' } },
    arms: { APP: arm(800, { ran: 'armA X', order: 'ELDER' }), APPY: arm(800, { ran: 'armA X', order: 'YOUNG' }), ELDER: arm(400, { order: 'ELDER', share: 0.9, wB: 1, wSelf: 1, wPart: 9 }),
      YOUNG: arm(y, { order: 'YOUNG', share: 0.1, wB: 9, wSelf: 9, wPart: 1, sp: o.ys }), YOUNGE: arm(ye, { order: 'YOUNG', share: 0.1, wB: 1, wSelf: 9, wPart: 1, estateWeight: 'elder', estateFrom: 'part', sp: o.yes }) } });
  const set = (f = () => ({})) => ids.map((id, k) => { const o = f(k); return unit(id, o.y, o.ye, o); });
  const V = s => rule(s).verdict;
  check('a complete planted set passes the gate', gate(set(), ids, 'a').length === 0);
  check(`the other order the same as the tested on every path reads AS IT IS (${V(set())})`, V(set()) === 'AS IT IS');
  // YOUNG a point worse on one unit (40 more of 4,000 lost, beyond noise), YOUNGE level: THE OPTION
  check(`YOUNG a point worse on one unit beyond noise, YOUNGE level, reads THE OPTION (${V(set(k => (k === 0 ? { y: 440 } : {})))})`, V(set(k => (k === 0 ? { y: 440 } : {}))) === 'THE OPTION' && rule(set(k => (k === 0 ? { y: 440 } : {}))).R.YOUNG.units.join() === 'U0');
  check(`both a point worse on one unit reads NEITHER (${V(set(k => (k === 0 ? { y: 440, ye: 440 } : {})))})`, V(set(k => (k === 0 ? { y: 440, ye: 440 } : {}))) === 'NEITHER');
  // (a) pooled: YOUNG 11 paths worse on every unit (0.275 points, within noise on each): the pooled change below -0.2
  check('(a): YOUNG 0.275 points worse on every unit, none beyond noise alone, fails the pooled bar; 0.15 points (6 paths) holds it', (() => {
    const r1 = rule(set(() => ({ y: 411 }))).R.YOUNG, r2 = rule(set(() => ({ y: 406 }))).R.YOUNG;
    return !r1.a && r1.b && r1.c && r2.a && r2.within;
  })());
  // (c) spending: YOUNG 0.2% lower on every path fails; 0.05% lower holds
  check('(c): YOUNG\'s spending 0.2% lower pooled fails it; 0.05% lower holds it', (() => { const r1 = rule(set(() => ({ ys: 998 }))).R.YOUNG, r2 = rule(set(() => ({ ys: 999.5 }))).R.YOUNG; return !r1.c && !r1.within && r2.c && r2.within; })());
  check('the gate refuses a missing unit, another audit and another candidate', (() => { const s = set().slice(1); s[0] = { ...s[0], candidate: '17ff82379838' }; const P = gate(s, ids, 'b'); return P.some(x => /units missing: U0/.test(x)) && P.some(x => /audit is not these files/.test(x)) && P.some(x => /candidate is not/.test(x)); })());
  check('the gate refuses another share, YOUNGE without the option, ELDER with the younger first, another horizon and a missing arm', (() => {
    const s = set();
    s[0].arms.YOUNG.share = 0.2; s[1].arms.YOUNGE.estateWeight = null; s[2].order.ELDER = { ageSelf0: 60, agePart0: 65, terminalAge: 100, years: 40 }; s[3].arms.APPY.T = 31; delete s[4].arms.YOUNGE; s[5].arms.YOUNG.wB = 1;
    const P = gate(s, ids, 'a');
    return P.some(x => /U0: each person's share/.test(x)) && P.some(x => /U1: YOUNGE not at the elder's/.test(x)) && P.some(x => /U2: ELDER's plan not the elder first/.test(x)) && P.some(x => /U3: the arms' horizons differ/.test(x)) && P.some(x => /U4: no YOUNGE arm/.test(x)) && P.some(x => /U5: ELDER or YOUNG not at the first/.test(x));
  })());
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'other-order-7002');
  const { unitsOf, stampFilesHash } = await import('./audit-other-order.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const ids = unitsOf().map(u => u.id).filter(id => !smoke || units.some(u => u.id === id));
  const P = gate(units, ids, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`OTHER ORDER GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = ids.map(id => units.find(u => u.id === id)), u0 = ordered[0], R = rule(ordered);
  const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)})`;
  console.log(`COUPLES IN THE OTHER ORDER, STAGE A (EXPLORATORY; OTHER-ORDER.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.length} re-held units of stage C's panel, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, estate weight ${u0.W}, the couples' candidate ${u0.candidate}; the gate: fair (every unit in every arm; one code, audit, seed, count of paths and points; ELDER the plan as tested, YOUNG and YOUNGE its other order ending in the same year; each person's share the same in both orders; the option on YOUNGE alone)`);
  console.log(`\nBy unit (survival in each arm; YOUNG and YOUNGE less ELDER, paired, with the 95% interval; spending delivered against ELDER's; the joint estate weight in the other order over the tested, the option unset; each person's table the same in both orders):`);
  for (const h of R.H) console.log(`  ${h.id.padEnd(8)} APP ${h.surv.APP.toFixed(2)}%, APPY ${h.surv.APPY.toFixed(2)}%; ELDER ${h.surv.ELDER.toFixed(2)}%, YOUNG ${h.surv.YOUNG.toFixed(2)}% (${iv(h.vs.YOUNG.ch)}; spending ${f(h.vs.YOUNG.spend)}%), YOUNGE ${h.surv.YOUNGE.toFixed(2)}% (${iv(h.vs.YOUNGE.ch)}; spending ${f(h.vs.YOUNGE.spend)}%); the weight x${h.factor.toFixed(2)}; tables ${h.same === null ? 'not recorded' : h.same ? 'the same' : 'DIFFER'}`);
  console.log(`\nThe rule (each against ELDER: (a) the summed change above ${RULE.pooled}; (b) no unit below ${RULE.unit} with its interval wholly below nought; (c) the spending delivered, pooled, not lower by more than ${-RULE.spend}%):`);
  for (const k of OTHERS) { const r = R.R[k]; console.log(`  ${k.padEnd(6)} (a) ${iv(r.pooled)} points: ${r.a ? 'HOLDS' : 'FAILS'}; (b) ${r.units.join(', ') || 'none'}: ${r.b ? 'HOLDS' : 'FAILS'}; (c) ${f(r.spend)}%: ${r.c ? 'HOLDS' : 'FAILS'}: ${r.within ? 'WITHIN THE TARGETS' : 'NOT WITHIN THEM'}`); }
  console.log(`\nBeside the rule, deciding nothing:`);
  console.log(`  the app's own rules, APPY less APP, summed: ${iv(R.app)} points; by unit ${R.H.map(h => `${h.id} ${f(h.app.d)}`).join(', ')}`);
  console.log(`  the paths on which the other order's run parts from ELDER's at all (another survival, or an estate a pound apart): ${OTHERS.map(k => `${k} ${R.H.map(h => h.parted[k]).reduce((a, b) => a + b, 0)} of ${R.H.length * u0.N}`).join(', ')}; by unit ${R.H.map(h => `${h.id} ${h.parted.YOUNG}/${h.parted.YOUNGE}`).join(', ')}`);
  console.log(`  each person's table the same in both orders, by digest: ${R.H.filter(h => h.same === true).length} of ${R.H.length} units${R.H.some(h => h.same === false) ? `; differing ${R.H.filter(h => h.same === false).map(h => h.id).join(', ')}` : ''}`);
  for (const h of R.H) console.log(`  ${h.id.padEnd(8)} mean pot left ${['APP', 'ELDER', 'APPY', 'YOUNG', 'YOUNGE'].map(a => `${a} ${gbp(h.pot[a])}`).join(', ')}; lifetime tax ${['ELDER', 'YOUNG', 'YOUNGE'].map(a => `${a} ${gbp(h.tax[a])}`).join(', ')}; failing in the last year below the minimum pot ${['APP', 'ELDER', 'APPY', 'YOUNG', 'YOUNGE'].map(a => `${a} ${h.minPot[a]}`).join(', ')}`);
  // the guard's age cap in either order: a couple entered younger first whose elder, entered second, would pass 120 before the
  // plan ends is kept to the app's rules, with the guard as it stands and with the guard opened for the elder entered second
  {
    const S = await import('../../src/couplesSwitch.js'), { otherOrder } = await import('./couple-order.mjs'), E = await import('../engine.mjs');
    const base = unitsOf().find(u => u.id === ids[0]).plan, young = otherOrder(E, base);
    const wide = { ...young, demographics: { ...young.demographics, currentAgeSelf: 50, currentAgePart: 80, terminalAge: 95 } };
    const now = S.coupleSolverOn(wide, true).why, keep = S.PLANT.rule;
    S.PLANT.rule = 'eldereither'; const opened = S.coupleSolverOn(wide, true).why; S.PLANT.rule = keep;
    console.log(`  the guard's age cap: ${ids[0]} entered younger first at 50 and 80, its plan to 95 (the elder 125 at its end): kept to the app's rules for ${now} as the guard stands, and for ${opened} with the guard opened for the elder entered second`);
  }
  console.log(`\nOTHER ORDER OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${R.verdict}`);
}
