/*
 * THE SOLVER CHOOSING A COUPLE'S SHARE, STAGE A, READ (SHARE-CHOOSE.md, its rule committed before launch; D102; EXPLORATORY,
 * seed 7002). Reads audit-share-choose.mjs's units once: the gate (every unit in every arm; one code, audit, seed, count of
 * paths and points; the couples' candidate stage C ran; the grid, the pots' share and the means' share each as defined from
 * the unit's plan; each arm on its share; every forecast finite), then the rule and the figures beside it.
 *   node research/solver/reduce-share-choose.mjs [dir] [--smoke]      node research/solver/reduce-share-choose.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { unit: 0.5, pooled: 0.2, floor: -0.1, light: -0.5, lightPooled: -0.2, means: 0.2 }, CANDIDATE = 'af001697ce1b';
export const LIGHTS = ['light15', 'light6'], SIM = 1000;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, minPot: Uint8Array };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : NaN; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
export const armName = x => `s${x}`;
const same = (x, y) => Math.abs(x - y) < 1e-9;

/* the gate over the units (each with its arms decoded), against the design: [{ id, shares, pots, means }] as the audit
   defines them from each unit's plan (audit-share-choose.mjs sharesOf, shareFor, meansOf); every problem */
export function gate(units, design, audit, size = { N: 4000, pts: 45, seed: 7002 }) {
  const P = [], missing = design.filter(d => !units.some(u => u.id === d.id)).map(d => d.id);
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate stage C ran (${CANDIDATE}): ${[...new Set(units.map(u => u.candidate))].join(', ')}`);
  if (size && units.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const d = design.find(x => x.id === U.id);
    if (!d) { P.push(`${U.id}: not in the design`); continue; }
    if (JSON.stringify(U.shares) !== JSON.stringify(d.shares)) P.push(`${U.id}: the grid ${U.shares.join(', ')}, not the design's ${d.shares.join(', ')}`);
    if (U.pots !== d.pots || !U.shares.some(x => same(x, U.pots))) P.push(`${U.id}: the pots' share ${U.pots}, not the plan's ${d.pots} on the grid`);
    if (!U.means || U.means.share !== d.means) P.push(`${U.id}: the means' share ${U.means && U.means.share}, not the plan's ${d.means}`);
    else {
      const r = Math.round(100 * d.means) / 100, on = U.shares.find(x => same(x, r));
      if (U.means.rounded !== r || U.means.arm !== (on !== undefined ? armName(on) : 'means')) P.push(`${U.id}: the means' arm ${U.means.arm} at ${U.means.rounded}, not ${on !== undefined ? armName(on) : 'means'} at ${r}`);
    }
    const arms = ['APP', ...U.shares.map(armName), ...(U.means && U.means.arm === 'means' ? ['means'] : [])];
    for (const a of arms) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const k of Object.keys(KEYS)) if (x[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
      if (a === 'APP') { if (!/^armA /.test(x.ran || '')) P.push(`${U.id} APP: not arm A's pick (${x.ran})`); continue; }
      const want = a === 'means' ? U.means.rounded : Number(a.slice(1));
      if (!same(x.share, want)) P.push(`${U.id} ${a}: solved on the share ${x.share}, not ${want}`);
      if (!Number.isFinite(x.forecast)) P.push(`${U.id} ${a}: its forecast is not finite (${x.forecast})`);
      if (a !== 'means' && x.forecast !== U.forecasts.full[want]) P.push(`${U.id} ${a}: its forecast ${x.forecast} is not the grid's ${U.forecasts.full[want]}`);
    }
    for (const k of ['full', ...LIGHTS]) for (const x of U.shares) if (!Number.isFinite(U.forecasts[k] && U.forecasts[k][x])) P.push(`${U.id}: the ${k} forecast at ${x} is not finite`);
  }
  return P;
}
/* the paired cells of B against A on the paths in [from, to): a both survive, lost (A only), saved (B only), d neither */
export function cells(A, B, from = 0, to = A.survived.length) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = from; i < to; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; }
  return { a, lost, saved, d };
}
/* the paired change in survival, B less A, in points with its 95% interval (stats.mjs survivalChangeU) */
export const change = (A, B) => { const c = cells(A, B); return { ...survivalChangeU(c.a, c.lost, c.saved, c.d), cells: c }; };
const survOn = (A, from, to) => { let s = 0; for (let i = from; i < to; i++) s += A.survived[i]; return s; };
/* the share a set of forecasts rates best; a tie (to the bit) to the pots' share, then the lowest */
export function pickOf(fc, shares, pots) {
  let best = null;
  for (const x of shares) if (best === null || fc[x] > fc[best] || (fc[x] === fc[best] && same(x, pots) && !same(best, pots))) best = x;
  return best;
}
/* the share the simulation rates best on the paths in [from, to); a tie to the pick, then the pots' share, then the lowest */
export function bestOn(U, from, to, pick) {
  const rank = x => (same(x, pick) ? 2 : same(x, U.pots) ? 1 : 0);
  let best = null, bs = -1;
  for (const x of U.shares) { const s = survOn(U.arms[armName(x)], from, to); if (s > bs || (s === bs && rank(x) > rank(best))) { best = x; bs = s; } }
  return best;
}
/* Kendall's tau between two lists, pairs tied in either not counted */
function kendall(xs, ys) {
  let c = 0, d = 0;
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) { const s = Math.sign(xs[i] - xs[j]) * Math.sign(ys[i] - ys[j]); if (s > 0) c++; else if (s < 0) d++; }
  return c + d ? (c - d) / (c + d) : NaN;
}
/* the rule over the units */
export function rule(units) {
  const H = units.map(U => {
    const A = x => U.arms[armName(x)], N = U.N, half = Math.floor(N / 2);
    const pick = pickOf(U.forecasts.full, U.shares, U.pots), P = A(pick), sv = X => 100 * mean(X.survived);
    const at = U.shares.map(x => ({ share: x, surv: sv(A(x)), forecast: U.forecasts.full[x], ch: change(P, A(x)), minPot: sum(A(x).minPot), tax: mean(A(x).tax), pot: mean(A(x).pot), delivered: mean(A(x).delivered) }));
    // (i): any share of the grid beating the pick by more than the bar beyond noise; the best in sample beside
    const beat = at.filter(s => s.ch.lo > RULE.unit);
    let best = at[0]; for (const s of at) if (s.surv > best.surv + 1e-12 || (Math.abs(s.surv - best.surv) <= 1e-12 && same(s.share, U.pots) && !same(best.share, pick))) best = s;
    // (i) pooled: the best chosen on one half of the paths, its change against the pick scored on the other, both ways
    const b1 = bestOn(U, 0, half, pick), b2 = bestOn(U, half, N, pick);
    const cross = [cells(P, A(b1), half, N), cells(P, A(b2), 0, half)];
    // (ii) the pick against the pots' share; (iii) against the means' share
    const pots = change(U.arms[armName(U.pots)], P), means = change(U.arms[U.means.arm], P);
    // (iv) each light pass's pick, solved in full, against the full pick
    const light = Object.fromEntries(LIGHTS.map(k => { const lp = pickOf(U.forecasts[k], U.shares, U.pots); return [k, { pick: lp, ch: change(P, A(lp)) }]; }));
    const app = U.arms.APP;
    const times = { full: sum(U.shares.map(x => U.times.full[x])), one: U.times.full[U.pots], light: Object.fromEntries(LIGHTS.map(k => [k, sum(U.shares.map(x => U.times[k][x])) + U.times.full[light[k].pick]])) };
    const tau = kendall(U.shares.map(x => U.forecasts.full[x]), at.map(s => s.surv));
    // beside: a pick by simulation, the share best on the first SIM paths (a tie to the pots' share), scored on the rest
    const sim = bestOn(U, 0, Math.min(SIM, half), U.pots), simAt = Math.min(SIM, half);
    const simCells = { pots: cells(U.arms[armName(U.pots)], A(sim), simAt, N), pick: cells(P, A(sim), simAt, N) };
    return { id: U.id, group: U.group, pick, at, beat, best, cross, picks: [b1, b2], pots, means, light, tau, times, meansShare: U.means, sim, simCells,
      app: { surv: sv(app), minPot: sum(app.minPot), tax: mean(app.tax), pot: mean(app.pot), delivered: mean(app.delivered) } };
  });
  const flat = f => H.flatMap(f);
  const cross = pooledSummed(flat(h => h.cross));
  const potsP = pooledSummed(H.map(h => h.pots.cells)), meansP = pooledSummed(H.map(h => h.means.cells));
  const lightP = Object.fromEntries(LIGHTS.map(k => [k, pooledSummed(H.map(h => h.light[k].ch.cells))]));
  const i = { units: H.filter(h => h.beat.length).map(h => h.id), cross, holds: !H.some(h => h.beat.length) && cross.d < RULE.pooled };
  const ii = { pooled: potsP, units: H.filter(h => h.pots.d < -RULE.unit && h.pots.hi < 0).map(h => h.id) };
  ii.holds = potsP.lo > RULE.floor && !ii.units.length;
  const iv = Object.fromEntries(LIGHTS.map(k => { const u = H.filter(h => h.light[k].ch.hi < RULE.light).map(h => h.id); return [k, { pooled: lightP[k], units: u, holds: !u.length && lightP[k].d > RULE.lightPooled }]; }));
  const simP = { pots: pooledSummed(H.map(h => h.simCells.pots)), pick: pooledSummed(H.map(h => h.simCells.pick)) };
  const meansFirst = meansP.d < -RULE.means && meansP.hi < 0;   // the pick less MEANS: MEANS better by more than the bar, beyond noise
  const verdict = !i.holds ? 'THE FORECAST MISSES' : ii.holds ? 'THE SOLVER CHOOSES' : "BEHIND TODAY'S SHARE";
  return { H, i, ii, iii: { pooled: meansP }, iv, meansFirst, verdict, simP };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 4000, GRID = [0.5, 0.6, 0.7, 0.8, 0.9];
  // an arm losing paths [0, lost); `odd` loses every path i < 2*odd with i odd instead (the same count, spread over both halves)
  const arm = (lost, share, fc, o = {}) => ({ ran: 'x', share, forecast: fc, survived: Uint8Array.from({ length: N }, (_, i) => (o.spread ? (i % 2 === 1 && i < 2 * lost ? 0 : 1) : i < lost ? 0 : 1)), failYear: new Int16Array(N).fill(-1), pot: new Float64Array(N).fill(1), estate: new Float64Array(N).fill(1), tax: new Float64Array(N).fill(1), delivered: new Float64Array(N).fill(1), minPot: new Uint8Array(N) });
  // a unit: `lost[x]` paths lost at each share x, `fc[x]` its forecast; the light forecasts the full's unless given
  const unit = (id, lost, fc, o = {}) => {
    const shares = o.shares || GRID, pots = o.pots === undefined ? 0.5 : o.pots, mr = o.meansAt === undefined ? 0.65 : o.meansAt, on = shares.find(x => same(x, mr));
    const forecasts = { full: { ...fc }, light15: { ...(o.l15 || fc) }, light6: { ...(o.l6 || fc) } }, times = { full: Object.fromEntries(shares.map(x => [x, 100])), light15: Object.fromEntries(shares.map(x => [x, 30])), light6: Object.fromEntries(shares.map(x => [x, 10])) };
    const arms = { APP: arm(800, null, null, {}), ...Object.fromEntries(shares.map(x => [armName(x), arm(lost[x], x, fc[x], { spread: o.spread })])) };
    arms.APP.ran = 'armA X';
    if (on === undefined) arms.means = arm(o.meansLost === undefined ? 400 : o.meansLost, mr, 0, { spread: o.spread });
    return { id, group: 'g', shares, pots, means: { self: 1, part: 1, share: mr + 0.001, rounded: mr, arm: on === undefined ? 'means' : armName(on) }, forecasts, times, N, pts: 45, seed: 7002, candidate: o.candidate || CANDIDATE, stamp: { code: 'c', audit: 'a' }, arms };
  };
  const flatLost = v => Object.fromEntries(GRID.map(x => [x, v]));
  const rising = Object.fromEntries(GRID.map((x, k) => [x, 1 - k * 0.01]));   // forecasts falling with the share: the pick 0.5
  // every share loses 400; the pick 0.5 (the pots'): the forecast as good as the best, and the same as today's
  const level = () => Array.from({ length: 14 }, (_, k) => unit(`U${k}`, flatLost(400), rising, { spread: true }));
  const V = s => rule(s).verdict;
  const design = s => s.map(u => ({ id: u.id, shares: u.shares, pots: u.pots, means: u.means.share }));
  check('a complete planted set passes the gate', (() => { const s = level(); return gate(s, design(s), 'a').length === 0; })());
  check(`every share level, the pick the pots' share, reads THE SOLVER CHOOSES (${V(level())})`, V(level()) === 'THE SOLVER CHOOSES');
  // the forecast picks 0.5 where 0.8 keeps 100 more of 4,000 (2.5 points) on every unit: (i) fails
  const miss = () => Array.from({ length: 14 }, (_, k) => unit(`U${k}`, { ...flatLost(400), 0.8: 300 }, rising, { spread: true }));
  check(`a share 2.5 points better than the pick on every unit reads THE FORECAST MISSES (${V(miss())})`, V(miss()) === 'THE FORECAST MISSES');
  // the forecast picks 0.8, the best by 2.5 points, on every unit: the solver chooses, and gains over the pots' share
  const hit = () => Array.from({ length: 14 }, (_, k) => unit(`U${k}`, { ...flatLost(400), 0.8: 300 }, { ...rising, 0.8: 2 }, { spread: true }));
  check(`the pick the best share on every unit reads THE SOLVER CHOOSES (${V(hit())})`, V(hit()) === 'THE SOLVER CHOOSES' && Math.abs(rule(hit()).ii.pooled.d - 2.5) < 1e-9);
  // BEHIND TODAY'S SHARE needs (i) to hold, and the pots' share is a share of the grid: so on one unit the pick 0.8 (and every
  // share but the pots') loses 45 paths the pots' share keeps and keeps 15 it loses, 0.75 points net, its interval wide enough
  // that (i) holds there (lower end under 0.5) and wholly below nought for (ii); the other thirteen level, the pick 0.8
  const behind = () => Array.from({ length: 14 }, (_, k) => {
    const u = unit(`U${k}`, flatLost(400), { ...rising, 0.8: 2 }, { spread: true });
    if (k === 0) for (const x of GRID) { const sv = u.arms[armName(x)].survived; for (let i = 0; i < 30; i += 2) if (x === 0.5) sv[i] = 0; for (let i = 1000; i < 1090; i += 2) if (x !== 0.5) sv[i] = 0; }
    return u;
  });
  check(`the pick 0.75 points behind the pots' share on one unit, beyond noise, reads BEHIND TODAY'S SHARE (${V(behind())})`, V(behind()) === "BEHIND TODAY'S SHARE" && rule(behind()).ii.units.join() === 'U0' && rule(behind()).i.holds);
  // (i)'s unit bar: a share 19 paths (0.475 points) better than the pick is not beyond it; 60 paths (1.5 points) is
  check('(i) by unit: a share 0.475 points better than the pick is within the bar, 1.5 points beyond it', (() => {
    const at = paths => rule([unit('U0', { ...flatLost(400), 0.8: 400 - paths }, rising, { spread: true })]).H[0].beat.length;
    return at(19) === 0 && at(60) === 1;
  })());
  // (i) pooled, chosen on one half and scored on the other: every share level with the pick on the paths, noise alone,
  // reads within the bar; the in-sample best beside it may not. Each share loses 400 but on paths of its own
  check('(i) pooled: shares level in truth, each losing its own 400 paths, read within the bar (cross-fitted), where the in-sample best is flattered', (() => {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const s = Array.from({ length: 14 }, (_, k) => { const u = unit(`U${k}`, flatLost(0), rising); for (const x of GRID) { const sv = u.arms[armName(x)].survived; for (let i = 0; i < N; i++) sv[i] = rnd() < 0.9 ? 1 : 0; } return u; });
    const R = rule(s), inSample = mean(R.H.map(h => h.best.surv - h.at.find(a => same(a.share, h.pick)).surv));
    return Math.abs(R.i.cross.d) < RULE.pooled && inSample > RULE.pooled;
  })());
  // (iv): a light pass picking 0.9 where 0.9 loses 80 more (2 points) on every unit fails it; the full pick unaffected
  const lightMiss = () => Array.from({ length: 14 }, (_, k) => unit(`U${k}`, { ...flatLost(400), 0.9: 480 }, rising, { spread: true, l6: { ...rising, 0.9: 5 } }));
  check('(iv): a light pass picking a share 2 points worse fails it, the other light pass holding', (() => { const R = rule(lightMiss()); return !R.iv.light6.holds && R.iv.light15.holds && R.iv.light6.units.length === 14 && R.verdict === 'THE SOLVER CHOOSES'; })());
  // (iii): MEANS 100 paths better than the pick on every unit is said first
  check('MEANS better than the pick by 2.5 points pooled, beyond noise, is said first', (() => { const s = Array.from({ length: 14 }, (_, k) => unit(`U${k}`, flatLost(400), rising, { spread: true, meansLost: 300 })); return rule(s).meansFirst === true && rule(level()).meansFirst === false; })());
  check('the means\' share on the grid is read from the grid\'s arm', (() => { const u = unit('U0', { ...flatLost(400), 0.7: 300 }, rising, { meansAt: 0.7, spread: true }); return u.means.arm === 's0.7' && Math.abs(rule([u]).H[0].means.d + 2.5) < 1e-9; })());
  check('a tie in the forecasts goes to the pots\' share', pickOf({ 0.5: 1, 0.6: 2, 0.7: 2 }, [0.5, 0.6, 0.7], 0.7) === 0.7 && pickOf({ 0.5: 1, 0.6: 2, 0.7: 2 }, [0.5, 0.6, 0.7], 0.5) === 0.6);
  check('the gate refuses a missing unit, another audit and a unit on another candidate', (() => { const s = level(), d = design(s), t = s.slice(1); t[0] = { ...t[0], candidate: '17ff82379838' }; const P = gate(t, d, 'b'); return P.some(x => /units missing: U0/.test(x)) && P.some(x => /audit is not these files/.test(x)) && P.some(x => /candidate is not/.test(x)); })());
  check('the gate refuses an arm on another share, another grid, a pots\' share off the plan\'s, a missing arm and a forecast not finite', (() => {
    const s = level(), d = design(s);
    s[0].arms['s0.6'].share = 0.65; s[1].shares = [0.5, 0.6, 0.7, 0.8]; s[2].pots = 0.6; delete s[3].arms['s0.7']; s[4].forecasts.light6[0.9] = NaN; s[5].arms.means.share = 0.7;
    const P = gate(s, d, 'a');
    return P.some(x => /U0 s0\.6: solved on the share 0\.65/.test(x)) && P.some(x => /U1: the grid/.test(x)) && P.some(x => /U2: the pots' share 0\.6/.test(x)) && P.some(x => /U3: no s0\.7 arm/.test(x)) && P.some(x => /U4: the light6 forecast at 0\.9/.test(x)) && P.some(x => /U5 means: solved on the share 0\.7/.test(x));
  })());
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'share-choose-7002');
  const { UNITS, stampFilesHash, sharesOf, meansOf } = await import('./audit-share-choose.mjs');
  const { planOfUnit } = await import('./audit-share-ensemble.mjs');
  const { shareFor } = await import('../../src/solver/couple.js');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  // the design from each unit's plan, as the audit defines it (the smoke's grid its own)
  const design = UNITS.filter(d => !smoke || units.some(u => u.id === d.id)).map(d => {
    const { plan } = planOfUnit(d), U = units.find(u => u.id === d.id);
    return { id: d.id, shares: smoke && U ? U.shares : sharesOf(plan), pots: shareFor(plan), means: meansOf(plan).share };
  });
  const P = gate(units, design, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`SHARE CHOOSE GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = design.map(d => units.find(u => u.id === d.id)), u0 = ordered[0], R = rule(ordered);
  const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)})`;
  const say = (c, ok) => (ok ? 'HOLDS' : 'FAILS');
  console.log(`THE SOLVER CHOOSING A COUPLE'S SHARE, STAGE A (EXPLORATORY; SHARE-CHOOSE.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.length} units of stage C's panel, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, estate weight ${u0.W}, the couples' candidate ${u0.candidate}; the gate: fair (every unit in every arm; one code, audit, seed, count of paths and points; the grid, the pots' share and the means' share as each plan gives them; each arm on its share; every forecast finite)`);
  if (R.meansFirst) console.log(`\nSAID FIRST: the means' share beats the forecast's pick pooled by more than ${RULE.means} points beyond noise: the pick less MEANS ${iv(R.iii.pooled)} points`);
  console.log(`\nBy unit (survival at each share of the grid, the solver's own forecast at the start beside it; the pick (P), the pots' share (T); each share less the pick, paired, with its 95% interval):`);
  for (const h of R.H) {
    console.log(`  ${h.id.padEnd(11)} ${h.group.padEnd(9)} pick ${h.pick}, the pots' ${h.at.find(s => same(s.share, ordered.find(u => u.id === h.id).pots)).share}, the means' ${h.meansShare.share.toFixed(4)} (arm ${h.meansShare.arm}); Kendall's tau, the forecast against survival ${Number.isFinite(h.tau) ? f(h.tau, 2) : 'n/a'}; APP ${h.app.surv.toFixed(2)}%`);
    for (const s of h.at) console.log(`      ${String(s.share).padEnd(5)} ${s.surv.toFixed(2)}%  forecast ${s.forecast.toFixed(6)}${same(s.share, h.pick) ? ' P' : ''}${same(s.share, ordered.find(u => u.id === h.id).pots) ? ' T' : ''}${same(s.share, h.pick) ? '' : `  less the pick ${iv(s.ch)}`}`);
  }
  console.log(`\nThe rule:`);
  console.log(`  (i) the forecast's pick: no share of the grid more than ${RULE.unit} points better beyond noise (its interval's lower end above ${RULE.unit}) on any unit: ${R.i.units.length ? `FAILS on ${R.i.units.join(', ')}` : 'none'}; the best share chosen on one half of the paths, less the pick on the other, both ways, summed over the ${R.H.length}: ${iv(R.i.cross)} points (under ${RULE.pooled}); (i) ${say(null, R.i.holds)}`);
  console.log(`      beside: the best in sample less the pick, by unit: ${R.H.map(h => `${h.id} ${f(h.best.surv - h.at.find(s => same(s.share, h.pick)).surv)} (${h.best.share})`).join('; ')}; the halves' bests: ${R.H.map(h => `${h.id} ${h.picks.join('/')}`).join('; ')}`);
  console.log(`  (ii) the pick less the pots' share, summed over the ${R.H.length}: ${iv(R.ii.pooled)} points (its lower end above ${RULE.floor}); a unit below -${RULE.unit} with its interval wholly below nought: ${R.ii.units.join(', ') || 'none'}; (ii) ${say(null, R.ii.holds)}`);
  console.log(`      by unit: ${R.H.map(h => `${h.id} ${iv(h.pots)}`).join('; ')}`);
  console.log(`  (iii) beside the pick, the means' share: the pick less MEANS, summed: ${iv(R.iii.pooled)} points; by unit: ${R.H.map(h => `${h.id} ${iv(h.means)}`).join('; ')}`);
  for (const k of LIGHTS) console.log(`  (iv) ${k}: its pick solved in full less the full pick, summed: ${iv(R.iv[k].pooled)} points (above ${RULE.lightPooled}); a unit below ${RULE.light} beyond noise: ${R.iv[k].units.join(', ') || 'none'}: ${say(null, R.iv[k].holds)}; its picks ${R.H.map(h => `${h.id} ${h.light[k].pick}${same(h.light[k].pick, h.pick) ? '' : ` (${iv(h.light[k].ch)})`}`).join('; ')}`);
  console.log(`\nBeside the rule, deciding nothing:`);
  const taus = R.H.map(h => h.tau).filter(Number.isFinite);
  console.log(`  Kendall's tau, the forecast's order against the simulation's, the mean over ${taus.length} units: ${f(mean(taus), 2)}`);
  console.log(`  a pick by simulation instead (the share best on the first ${Math.min(SIM, Math.floor(u0.N / 2))} paths, a tie to the pots' share), scored on the other ${u0.N - Math.min(SIM, Math.floor(u0.N / 2))}, summed: less the pots' share ${iv(R.simP.pots)} points, less the forecast's pick ${iv(R.simP.pick)}; its picks ${R.H.map(h => `${h.id} ${h.sim}`).join('; ')}`);
  const ratio = (a, b) => a / b, med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
  console.log(`  solve time (the units ran ${4} at a time: a guide), against one full solve at the pots' share: the whole grid in full x${med(R.H.map(h => ratio(h.times.full, h.times.one))).toFixed(2)} (median over units); ${LIGHTS.map(k => `${k} over the grid and its pick in full x${med(R.H.map(h => ratio(h.times.light[k], h.times.one))).toFixed(2)}`).join('; ')}`);
  for (const h of R.H) {
    const p = h.at.find(s => same(s.share, h.pick)), t = h.at.find(s => same(s.share, ordered.find(u => u.id === h.id).pots));
    console.log(`  ${h.id.padEnd(11)} the pick against the pots' share: mean spending delivered ${gbp(p.delivered)} and ${gbp(t.delivered)}, mean pot left ${gbp(p.pot)} and ${gbp(t.pot)}, mean lifetime tax ${gbp(p.tax)} and ${gbp(t.tax)}; failing in the last year below the minimum pot: APP ${h.app.minPot}, ${h.at.map(s => `${s.share} ${s.minPot}`).join(', ')}`);
  }
  // the arms the share ensemble ran on this code (results/share-ensemble-7002, outside git), path for path
  const ens = join(HERE, 'results', 'share-ensemble-7002');
  if (!smoke && existsSync(ens)) {
    let n = 0, sameN = 0; const diff = [];
    for (const x of readdirSync(ens).filter(x => /\.json\.gz$/.test(x))) {
      const E = JSON.parse(gunzipSync(readFileSync(join(ens, x))).toString()), U = ordered.find(u => u.id === E.id);
      if (!U || E.stamp.code !== u0.stamp.code) continue;
      for (const [a, e] of Object.entries(E.arms)) {
        if (a === 'APP' || !U.arms[a]) continue;
        n++; const s = dec(e.survived, Uint8Array), t = U.arms[a].survived, est = dec(e.estate, Float64Array), tE = U.arms[a].estate;
        if (s.every((v, i) => v === t[i]) && est.every((v, i) => Object.is(v, tE[i]))) sameN++; else diff.push(`${E.id} ${a}`);
      }
    }
    console.log(`  the share ensemble's arms on this code, path for path (survival and estate): the same on ${sameN} of ${n}${diff.length ? `; differing ${diff.join(', ')}` : ''}`);
  }
  console.log(`\nSHARE CHOOSE OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${R.verdict}${R.verdict === 'THE SOLVER CHOOSES' ? `; the light passes for D103: ${LIGHTS.map(k => `${k} ${R.iv[k].holds ? 'holds' : 'fails'}`).join(', ')}` : ''}`);
}
