/*
 * A WIDER JOINT MOVE FOR COUPLES, READ (JOINT-WIDE.md, its rule committed before any launch; D111 (2); EXPLORATORY, seed
 * 7002). Reads audit-joint-wide.mjs's units once: the fair-test gate on the launch logs (fair-gate.mjs requireFairLogs: one
 * code and audit, launched through the launcher), then its own gate (every unit in every arm; one code and one audit stamp;
 * seed 7002, 4,000 paths and 45 points in every arm; the couples' candidate; each arm's options as named, read back from the
 * fields the chooser reads; the couples' default joint move; each person's tables the same before the first arm and after
 * the last; the arms' order as designed; the replays in), then the rule: K4 and K6 each against K2 on the same paths, by its
 * five parts and its gain, the outcome, and beside it, deciding nothing, K6 against K4 and the figures JOINT-WIDE.md lists.
 *   node research/solver/reduce-joint-wide.mjs [dir] [--smoke]      node research/solver/reduce-joint-wide.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
/* JOINT-WIDE.md's bars: survival pooled and by unit (points), spending (%, one-sided), the capped pot pooled and by unit (%) */
export const RULE = { pooled: -0.1, unit: -0.3, spend: -0.05, capped: -0.1, cappedUnit: -0.5 }, CANDIDATE = 'af001697ce1b';
/* the couples' default joint move (D99's share rule, D109's LOOKHOLD), and each arm's width */
export const JOINT = { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2 };
export const WIDTHS = { K2: 2, K4: 4, K6: 6 }, ARMS = Object.keys(WIDTHS), WIDER = ['K4', 'K6'];
export const wantOptions = arm => ({ ...JOINT, topK: WIDTHS[arm], meta: { tieJoint: JOINT.tieJoint, tieLook: JOINT.tieLook, holdPast: JOINT.holdPast } });
export const orderOf = k => ARMS.map((_, i) => ARMS[(k + i) % ARMS.length]);
const Z = 1.959963984540054;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const mean = a => { let s = 0, n = 0; for (const x of a) { s += x; n++; } return n ? s / n : NaN; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const sdOf = (a, m) => { let s = 0, n = 0; for (const x of a) { s += (x - m) ** 2; n++; } return n > 1 ? Math.sqrt(s / (n - 1)) : 0; };
const pct = (x, b) => 100 * (x / b - 1);
const median = a => { const s = [...a].sort((p, q) => p - q), k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; };
const js = x => JSON.stringify(x);

/* the gate over the units (each with its arms decoded), against the design's units: every problem */
export function gate(units, ids, audit, size = { N: 4000, seed: 7002, pts: 45 }) {
  const P = [], missing = ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate (${CANDIDATE}): ${[...new Set(units.map(u => u.candidate))].join(', ')}`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const k = ids.indexOf(U.id);
    if (k < 0) { P.push(`${U.id}: not in the design`); continue; }
    if (U.k !== k || js(U.order) !== js(orderOf(k))) P.push(`${U.id}: unit ${U.k} with the arms in the order ${js(U.order)}, not unit ${k}'s ${js(orderOf(k))}`);
    if (!U.digests || U.digests.before.self !== U.digests.after.self || U.digests.before.part !== U.digests.after.part) P.push(`${U.id}: a person's table changed between the first arm and the last`);
    if (!(U.cap > 0)) P.push(`${U.id}: no household cap recorded`);
    if (U.shareRule !== 'pots' || js(U.joint) !== js(JOINT)) P.push(`${U.id}: the joint move ${js(U.joint)} on the share rule ${U.shareRule}, not the couples' default ${js(JOINT)}`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const key of Object.keys(KEYS)) if (!x[key] || x[key].length !== U.N) P.push(`${U.id} ${a}: ${key} not one a path`);
      if (js(x.options) !== js(wantOptions(a))) P.push(`${U.id} ${a}: the options read back ${js(x.options)}, not ${js(wantOptions(a))}`);
      if (!(x.cpuUs > 0) || x.place !== U.order.indexOf(a)) P.push(`${U.id} ${a}: no time, or not timed in its place`);
    }
    if (!U.along || !(U.along.decisions > 0) || WIDER.some(a => !U.along[a]) || !U.own || WIDER.some(a => !U.own[a] || !(U.own[a].decisions > 0))) P.push(`${U.id}: no replays`);
  }
  return P;
}
/* the paired cells of B against A: a both survive, lost (A only), saved (B only), d neither */
export function cells(A, B) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = 0; i < A.survived.length; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; }
  return { a, lost, saved, d };
}
/* the pot left, two ways (as TIE-C2.md): the typical path, each path's own change in percent over the paths where both arms
   leave a pot, averaged; the average pound, the mean pots' change in percent with its paired standard error */
export function potWays(b, x) {
  const v = [];
  for (let i = 0; i < b.pot.length; i++) if (b.pot[i] > 0 && x.pot[i] > 0) v.push(100 * (x.pot[i] / b.pot[i] - 1));
  const tm = v.length ? mean(v) : 0, tse = v.length > 1 ? sdOf(v, tm) / Math.sqrt(v.length) : 0;
  const d = Array.from(b.pot, (y, i) => x.pot[i] - y), mb = mean(b.pot), dm = mean(d), ase = mb > 0 ? 100 * sdOf(d, dm) / Math.sqrt(d.length) / mb : 0, ad = mb > 0 ? 100 * dm / mb : 0;
  return { typical: { d: tm, se: tse, lo: tm - Z * tse, hi: tm + Z * tse, n: v.length }, pound: { d: ad, se: ase, lo: ad - Z * ase, hi: ad + Z * ase } };
}
/* spending delivered, x against b on the same paths: the sum's change in percent with its paired standard error (each path's
   difference; the units independent): by unit, and pooled over the units' sums */
export function spendOf(pairs) {
  let D = 0, B = 0, V = 0;
  const by = pairs.map(([b, x]) => {
    const n = b.delivered.length, d = Array.from(b.delivered, (y, i) => x.delivered[i] - y), dm = mean(d), s = sdOf(d, dm), Bu = sum(b.delivered), Du = dm * n, Vu = n * s * s;
    D += Du; B += Bu; V += Vu;
    const p = 100 * Du / Bu, se = 100 * Math.sqrt(Vu) / Bu;
    return { d: p, se, lo: p - Z * se, hi: p + Z * se };
  });
  const p = 100 * D / B, se = 100 * Math.sqrt(V) / B;
  return { pooled: { d: p, se, lo: p - Z * se, hi: p + Z * se }, by };
}
/* one arm against another over the units, by JOINT-WIDE.md's parts and its gain */
export function against(units, arm, base = 'K2') {
  const sp = spendOf(units.map(U => [U.arms[base], U.arms[arm]]));
  const H = units.map((U, i) => {
    const b = U.arms[base], x = U.arms[arm], c = cells(b, x), ch = survivalChangeU(c.a, c.lost, c.saved, c.d);
    const capped = X => mean(Array.from(X.pot, v => Math.min(v, U.cap)));
    const tenth = { lower: 0, higher: 0 };
    for (let k = 0; k < b.pot.length; k++) { if (!(b.pot[k] > 0)) continue; if (x.pot[k] < 0.9 * b.pot[k]) tenth.lower++; else if (x.pot[k] > 1.1 * b.pot[k]) tenth.higher++; }
    return { id: U.id, group: U.group, cells: c, ch, spend: sp.by[i], capped: pct(capped(x), capped(b)), ...potWays(b, x), tax: [mean(b.tax), mean(x.tax)], slower: x.cpuUs / b.cpuUs, tenth,
      along: base === 'K2' && U.along[arm] ? U.along[arm] : null, own: base === 'K2' ? U.own[arm] : null };
  });
  const pooled = pooledSummed(H.map(h => h.cells)), spend = sp.pooled;
  const cappedP = mean(H.map(h => h.capped)), taxB = mean(H.map(h => h.tax[0])), taxX = mean(H.map(h => h.tax[1]));
  const tp = mean(H.map(h => h.typical.d)), tpse = Math.sqrt(sum(H.map(h => h.typical.se ** 2))) / H.length, typicalP = { d: tp, se: tpse, lo: tp - Z * tpse, hi: tp + Z * tpse };
  const lower = sum(H.map(h => (h.along ? h.along.lower + h.along.unfunded : 0)));
  const parts = [
    pooled.lo > RULE.pooled,
    !H.some(h => h.ch.hi < RULE.unit),
    spend.d >= RULE.spend,
    cappedP >= RULE.capped && !H.some(h => h.capped < RULE.cappedUnit),
    lower === 0
  ];
  // the gain, in the product's order: survival; then spending, survival not lower beyond noise; then the pot, neither lower
  const gain = pooled.lo > 0 ? 'SURVIVAL' : pooled.hi >= 0 && spend.lo > 0 ? 'SPENDING' : pooled.hi >= 0 && spend.hi >= 0 && typicalP.lo > 0 ? 'THE POT' : null;
  return { arm, base, H, pooled, spend, cappedP, taxB, taxX, typicalP, lower, parts, holds: parts.slice(0, 4).every(Boolean), stop: !parts[4], gain, slowerMedian: median(H.map(h => h.slower)) };
}
/* the rule: K4 and K6 against K2, and the outcome */
export function rule(units) {
  const R = Object.fromEntries(WIDER.map(a => [a, against(units, a)]));
  let verdict;
  const gains = WIDER.filter(a => R[a].holds && R[a].gain);
  if (WIDER.some(a => R[a].stop)) verdict = 'STOP';
  else if (gains.length) verdict = `A GAIN (${gains.map(a => `${a} in ${R[a].gain}, its path x${R[a].slowerMedian.toFixed(2)}`).join('; ')}): THE TRADE GOES TO THE MAINTAINER`;
  else verdict = WIDER.some(a => R[a].holds) ? 'NO GAIN' : 'FAILS';
  return { R, verdict, gains };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 4000, ids = Array.from({ length: 12 }, (_, k) => `U${k}`);
  // an arm: `lost` paths failing (the odd ones first); each path's pot `pot` times a small spread, or `potAt`; spending `sp`
  // times a small spread (`spAt` instead)
  const arm = (name, lost, o = {}, place = 0) => ({ options: wantOptions(name), cpuUs: o.cpu || 1e8, wallMs: 1e5, load: [0, 0], place, T: 30,
    survived: Uint8Array.from({ length: N }, (_, i) => (i % 2 === 1 && i < 2 * lost ? 0 : 1)), failYear: new Int16Array(N),
    pot: Float64Array.from({ length: N }, (_, i) => (o.potAt ? o.potAt(i) : (o.pot || 1e6) * (1 + 0.02 * Math.sin(i)))), estate: new Float64Array(N).fill(1e6),
    tax: new Float64Array(N).fill(o.tax || 1e5), delivered: Float64Array.from({ length: N }, (_, i) => (o.spAt ? o.spAt(i) : (o.sp || 1e6) * (1 + 0.01 * Math.sin(3 * i)))), unmet: new Float64Array(N) });
  const along = (o = {}) => ({ decisions: 100, K4: { lower: 0, worst: 0, higher: 5, funds: 0, unfunded: 0, differ: 3, level: 0, split: 1, tiers: 1, first: null, ...(o.K4 || {}) }, K6: { lower: 0, worst: 0, higher: 6, funds: 0, unfunded: 0, differ: 4, level: 0, split: 1, tiers: 1, first: null, ...(o.K6 || {}) } });
  // a unit: K2 400 lost; K4 and K6 each with their own figures (`k4`, `k6`); the order rotated as designed
  const unit = (id, k, o = {}) => {
    const order = o.order || orderOf(k);
    return { k, id, group: 'x', N, pts: 45, seed: 7002, candidate: o.candidate || CANDIDATE, stamp: { code: 'c', audit: 'a' }, cap: o.cap || 2e6, shareRule: 'pots', joint: o.joint || { ...JOINT }, order,
      digests: { before: { self: 'a', part: 'b' }, after: { self: 'a', part: o.changed ? 'z' : 'b' } }, along: along(o.along), own: { K4: { decisions: 100, differ: 3, level: 0 }, K6: { decisions: 100, differ: 4, level: 0 } },
      arms: { K2: arm('K2', 400, o.k2 || {}, order.indexOf('K2')), K4: arm('K4', o.k4Lost === undefined ? 400 : o.k4Lost, o.k4 || {}, order.indexOf('K4')), K6: arm('K6', o.k6Lost === undefined ? 400 : o.k6Lost, o.k6 || {}, order.indexOf('K6')) } };
  };
  const set = (f = () => ({})) => ids.map((id, k) => unit(id, k, f(k)));
  const V = s => rule(s).verdict;
  check('a complete planted set passes the gate', gate(set(), ids, 'a').length === 0);
  check(`no change anywhere: NO GAIN (${V(set())})`, V(set()) === 'NO GAIN');
  check(`K6 saving 40 paths on every unit: a gain in survival, the trade (${V(set(() => ({ k6Lost: 360, k6: { cpu: 2.6e8 } })))})`, (() => { const r = rule(set(() => ({ k6Lost: 360, k6: { cpu: 2.6e8 } }))); return r.R.K6.gain === 'SURVIVAL' && r.gains.join() === 'K6' && /A GAIN \(K6 in SURVIVAL, its path x2\.60\)/.test(r.verdict); })());
  check(`K4 spending 0.2% more on every unit, survival the same: a gain in spending (${rule(set(() => ({ k4: { sp: 1.002e6 } }))).R.K4.gain})`, rule(set(() => ({ k4: { sp: 1.002e6 } }))).R.K4.gain === 'SPENDING');
  check('K4 spending 0.2% more but survival lower beyond noise (2 paths a unit, inside the margin): no gain', (() => { const r = rule(set(() => ({ k4Lost: 402, k4: { sp: 1.002e6 } }))).R.K4; return r.pooled.hi < 0 && r.parts[0] && r.gain === null; })());
  check(`K4's pot 1% higher on every path, survival and spending the same: a gain in the pot (${rule(set(() => ({ k4: { pot: 1.01e6 } }))).R.K4.gain})`, rule(set(() => ({ k4: { pot: 1.01e6 } }))).R.K4.gain === 'THE POT');
  check('K4 two points worse on one unit, beyond noise: fails part 2, and with K6 unchanged NO GAIN', (() => { const r = rule(set(k => (k === 0 ? { k4Lost: 560 } : {}))); return !r.R.K4.parts[1] && !r.R.K4.holds && r.verdict === 'NO GAIN'; })());
  check('K4 losing 0.3 points pooled fails part 1', (() => { const r = rule(set(() => ({ k4Lost: 412 }))).R.K4; return !r.parts[0] && r.pooled.lo <= RULE.pooled; })());
  check('K6 spending 0.1% lower pooled fails part 3', (() => { const r = rule(set(() => ({ k6: { sp: 0.999e6 } }))).R.K6; return !r.parts[2]; })());
  check('a capped pot 2% lower on one unit fails part 4', (() => { const r = rule(set(k => (k === 0 ? { k4: { pot: 0.98e6 } } : {}))).R.K4; return !r.parts[3] && r.H[0].capped < -0.5; })());
  check('both failing a part: FAILS', V(set(() => ({ k4: { sp: 0.999e6 }, k6: { sp: 0.999e6 } }))) === 'FAILS');
  check('a wider best below K2\'s at K2\'s state is a STOP, whatever else holds', V(set(k => (k === 3 ? { along: { K6: { lower: 1, worst: 1e-6 } }, k6Lost: 360 } : {}))) === 'STOP');
  check('nothing funding a year where K2\'s move does is a STOP', V(set(k => (k === 5 ? { along: { K4: { unfunded: 1 } } } : {}))) === 'STOP');
  check('a gain on one arm and a failed part on the other: the gain goes to the maintainer', (() => { const r = rule(set(() => ({ k6Lost: 360, k4: { sp: 0.999e6 } }))); return r.gains.join() === 'K6' && /THE TRADE/.test(r.verdict); })());
  check('the spending interval: a difference of 1% a path times a sine gives a pooled standard error near 100 x 0.01 / sqrt(2 x 12 x 4000), 0.00323%', (() => { const s = spendOf(set().map(U => [U.arms.K2, { ...U.arms.K2, delivered: Float64Array.from(U.arms.K2.delivered, (v, i) => v * (1 + 0.01 * Math.sin(7 * i + 1))) }])); return s.pooled.se > 0.0030 && s.pooled.se < 0.0035 && Math.abs(s.pooled.d) < 0.01; })());
  check('the gate refuses a changed table, another width, a missing arm, another seed, a missing unit, another joint move and another order', (() => {
    const s = set(); s[0] = unit('U0', 0, { changed: true }); s[1].arms.K4.options.topK = 3; delete s[2].arms.K6; s[3].seed = 7001; s[4] = unit('U4', 4, { joint: { ...JOINT, tieLook: null } }); s[5] = unit('U5', 5, { order: ['K2', 'K4', 'K6'] }); const t = s.slice(0, 11);
    const P = gate(t, ids, 'a');
    return P.some(x => /U0: a person's table changed/.test(x)) && P.some(x => /U1 K4: the options/.test(x)) && P.some(x => /U2: no K6 arm/.test(x)) && P.some(x => /more than one seed/.test(x)) && P.some(x => /units missing: U11/.test(x)) && P.some(x => /U4: the joint move/.test(x)) && P.some(x => /U5: unit 5 with the arms in the order/.test(x));
  })());
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'joint-wide-7002');
  const { UNITS, stampFilesHash } = await import('./audit-joint-wide.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const all = UNITS.map(u => u.id), ids = smoke ? all.filter(id => units.some(u => u.id === id)) : all;
  const P = gate(units, smoke ? all : ids, smoke ? null : stampFilesHash(), smoke ? null : undefined).filter(x => !(smoke && /^units missing/.test(x)));
  if (!ids.length) P.push(`no units in ${DIR}`);
  if (P.length) { console.log(`JOINT-WIDE GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = ids.map(id => units.find(u => u.id === id)), u0 = ordered[0], R = rule(ordered);
  const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = (c, d = 3) => `${f(c.d, d)} (${f(c.lo, d)} to ${f(c.hi, d)})`;
  console.log(`A WIDER JOINT MOVE FOR COUPLES (EXPLORATORY; JOINT-WIDE.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.length} units, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, the couples' candidate ${u0.candidate}, the joint move ${js(u0.joint)}; the gate fair`);
  const show = (r, label) => {
    const say = k => (r.parts[k] ? 'HOLDS' : 'FAILS');
    console.log(`\n${label}:`);
    console.log(`  1. pooled survival ${iv(r.pooled)} points; its lower end above ${RULE.pooled}: ${say(0)}`);
    console.log(`  2. no unit wholly below ${RULE.unit}: ${r.H.filter(h => h.ch.hi < RULE.unit).map(h => `${h.id} (${f(h.ch.lo)} to ${f(h.ch.hi)})`).join(', ') || 'none'}: ${say(1)}`);
    console.log(`  3. pooled spending delivered ${iv(r.spend, 4)}%; not lower by more than ${-RULE.spend}%: ${say(2)}`);
    console.log(`  4. the capped pot ${f(r.cappedP)}% pooled (not lower by more than ${-RULE.capped}%); a unit lower by more than ${-RULE.cappedUnit}%: ${r.H.filter(h => h.capped < RULE.cappedUnit).map(h => `${h.id} ${f(h.capped)}%`).join(', ') || 'none'}: ${say(3)}`);
    console.log(`  5. the replays: a best scoring below ${r.base}'s at its state, or nothing funding a year its move funds, at ${r.lower} decisions: ${say(4)}`);
    console.log(`  the gain (survival beyond noise; else spending, survival not lower beyond noise; else the typical-path pot ${iv(r.typicalP)}%, neither lower beyond noise): ${r.gain || 'none'}`);
    console.log(`  ${r.stop ? 'STOP' : r.holds ? (r.gain ? `HOLDS 1 to 4, A GAIN IN ${r.gain}` : 'HOLDS 1 to 4, NO GAIN') : `FAILS ${r.parts.slice(0, 4).map((p, k) => (p ? null : k + 1)).filter(Boolean).join(', ')}`}; its CPU time a path against ${r.base}'s, the median over the units x${r.slowerMedian.toFixed(3)}`);
    console.log(`  by unit: ${r.H.map(h => `${h.id} survival ${f(h.ch.d)} (${h.cells.lost} lost, ${h.cells.saved} saved), spending ${f(h.spend.d, 4)}%, the typical path ${f(h.typical.d)}%, the average pound ${iv(h.pound)}%, capped ${f(h.capped)}%, tax ${gbp(h.tax[0])} to ${gbp(h.tax[1])}, x${h.slower.toFixed(2)} a path`).join('; ')}`);
  };
  for (const a of WIDER) show(R.R[a], `${a} against K2`);
  console.log(`\nJOINT-WIDE OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${R.verdict}`);
  // beside the rule, deciding nothing
  console.log('\nBESIDE THE RULE, DECIDING NOTHING:');
  show(against(ordered, 'K6', 'K4'), 'K6 against K4');
  for (const g of [...new Set(ordered.map(u => u.group))]) {
    const sub = ordered.filter(u => u.group === g);
    console.log(`  the ${g} units (${sub.length}): ${WIDER.map(a => { const r = against(sub, a); return `${a} survival ${iv(r.pooled)}, spending ${iv(r.spend, 4)}%, the typical path ${iv(r.typicalP)}%, tax ${f(pct(r.taxX, r.taxB), 2)}%, x${r.slowerMedian.toFixed(2)} a path`; }).join('; ')}`);
  }
  for (const a of WIDER) { const r = R.R[a]; console.log(`  ${a}: pooled lifetime tax ${gbp(r.taxB)} to ${gbp(r.taxX)} (${f(pct(r.taxX, r.taxB), 2)}%); paths a tenth lower ${sum(r.H.map(h => h.tenth.lower))} and higher ${sum(r.H.map(h => h.tenth.higher))} of ${sum(r.H.map(h => h.cells.a + h.cells.lost + h.cells.saved + h.cells.d))}`); }
  console.log(`  the replays: ${ordered.map(u => `${u.id} ${u.along.decisions} decisions along K2's path, ${WIDER.map(a => `${a} best above K2's ${u.along[a].higher}, below ${u.along[a].lower}, funding a year K2's cannot ${u.along[a].funds}, its pick differing ${u.along[a].differ} (level ${u.along[a].level}, split ${u.along[a].split}, tiers ${u.along[a].tiers}), on its own path ${u.own[a].differ} of ${u.own[a].decisions}`).join(', ')}`).join(' | ')}`);
  console.log(`  each arm's CPU time a path: ${ARMS.map(a => `${a} ${(mean(ordered.map(u => u.arms[a].cpuUs / u.N)) / 1e3).toFixed(1)} ms`).join(', ')}; the order effect, each wider arm's time against K2's, the median over the units that ran the arms from each start (K2, K4, K6 first): ${WIDER.map(a => `${a} ${ARMS.map(first => { const s = ordered.filter(u => u.order[0] === first).map(u => u.arms[a].cpuUs / u.arms.K2.cpuUs); return s.length ? `x${median(s).toFixed(3)} (${s.length})` : '-'; }).join(' / ')}`).join(', ')}; the solve ${mean(ordered.map(u => u.solveSecs)).toFixed(0)} s a couple (one for every arm)`);
  // the page's wait, AN INFERENCE: the paths' share of a first solve's wait in the browser, measured on one couple (TIE-C2's beside)
  const tb = existsSync(join(HERE, 'results-tie-c2-beside.txt')) ? readFileSync(join(HERE, 'results-tie-c2-beside.txt'), 'utf8').match(/paths ([\d.]+) of ([\d.]+) s \(/) : null;
  if (tb) { const share = Number(tb[1]) / Number(tb[2]); console.log(`  AN INFERENCE, the page's wait on a first solve: on one couple in the browser the paths were ${tb[1]} of ${tb[2]} s (results-tie-c2-beside.txt); on that split ${WIDER.map(a => `${a}'s median path x${R.R[a].slowerMedian.toFixed(2)} would make the wait x${(1 + share * (R.R[a].slowerMedian - 1)).toFixed(2)}`).join(', ')}`); }
}
