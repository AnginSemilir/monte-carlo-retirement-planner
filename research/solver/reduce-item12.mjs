/*
 * ITEM 12, STAGE A, ON THE PORT: THE READ (ITEM12-A.md; the review of 9 Nov, item 12; D84; EXPLORATORY). The stamps first
 * (fair-gate.mjs requireFairLogs), then the gate: every unit in; one code, one audit, one seed, one count of paths, one
 * count of points; each unit's two identities held (the path as it was against the flat path, the whole menu with the
 * tie-break against the comparison: nought paths differing); each arm's switches, as the unit read them back from the
 * tables and the modules, the ones its name stands for; the comparison ranked nothing from a shortlist and each arm did;
 * each unit's tables the same after its arms as before them; at least four couples with years before pension access in
 * their tables. Then the rule, as ITEM12-A.md writes it, each arm against the flat path on the whole menu, the eight:
 *   1 pooled survival's lower end above -0.1; 2 no couple wholly below -0.3; 3 pooled spending delivered not lower by
 *   more than 0.1 points of target; 4 the pooled mean pot not lower by more than 0.5% nor a couple's by more than 1%;
 *   5 each person's mean equity weight held in pension and in ISA within one point of the whole menu's, on every couple.
 *   node research/solver/reduce-item12.mjs [dir] > research/solver/results-item12-a.txt
 *   node research/solver/reduce-item12.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zFor } from './stats.mjs';
import { pairOf } from './reduce-speed.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooledLo: -0.1, couple: -0.3, spend: 0.1, potPooled: 0.5, potCouple: 1, equity: 1, bridgeCouples: 4 };
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const arr = (b64, T) => { if (typeof b64 !== 'string') return b64; const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };   // a small Buffer sits in Node's shared pool: its own bytes, not the pool's
export const armOf = a => ({ survived: arr(a.survived, Uint8Array), delivered: arr(a.delivered, Float64Array), pot: arr(a.pot, Float64Array), tax: arr(a.tax, Float64Array), ms: a.ms, eq: a.eq, short: a.short, far: a.far, sw: a.sw });
const mean = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
const EPS = 1e-9;   // each edge inclusive, past a sum's rounding
/* a person's mean equity weight held, in points, slot by slot (null where the person has not the wrapper): plain, and
   weighted by the wrapper's pot */
const eqOf = e => e.sum.map((s, j) => (e.pot[j] > 0 || s > 0 ? 100 * s / e.n : null));
const eqwOf = e => e.wsum.map((s, j) => (e.pot[j] > 0 ? 100 * s / e.pot[j] : null));
/* what the rule reads, X against B over pairs { id, lifeTarget, slots, B, X } (the arms' arrays) */
export function readOf(pairs) {
  const H = pairs.map(q => {
    const p = pairOf(q.B.survived, q.X.survived), delB = 100 * mean(q.B.delivered) / q.lifeTarget, delX = 100 * mean(q.X.delivered) / q.lifeTarget;
    const potB = mean(q.B.pot), potX = mean(q.X.pot), taxB = mean(q.B.tax), taxX = mean(q.X.tax);
    const eB = eqOf(q.B.eq), eX = eqOf(q.X.eq), wB = eqwOf(q.B.eq), wX = eqwOf(q.X.eq);
    const eq = eB.map((b, j) => (b === null || eX[j] === null ? null : eX[j] - b)), eqw = wB.map((b, j) => (b === null || wX[j] === null ? null : wX[j] - b));
    return { id: q.id, p, delB, delX, spend: delX - delB, potB, potX, pot: 100 * (potX / potB - 1), taxB, taxX, tax: taxB > 0 ? 100 * (taxX / taxB - 1) : 0, eB, eX, eq, eqw, eqMax: Math.max(0, ...eq.filter(x => x !== null).map(Math.abs)), msB: q.B.ms, msX: q.X.ms, slots: q.slots };
  });
  const k = H.length, z = zFor(0.05), avg = g => H.reduce((s, h) => s + g(h), 0) / k;
  const pooled = avg(h => h.p.d), se = Math.sqrt(H.reduce((s, h) => s + h.p.v, 0)) / k;
  return { H, pooled, se, lo: pooled - z * se, hi: pooled + z * se, saved: H.reduce((s, h) => s + h.p.saved, 0), lost: H.reduce((s, h) => s + h.p.lost, 0), harmed: H.filter(h => h.p.hi < RULE.couple),
    spend: avg(h => h.spend), pot: avg(h => h.pot), potRatio: 100 * (avg(h => h.potX) / avg(h => h.potB) - 1), tax: 100 * (avg(h => h.taxX) / avg(h => h.taxB) - 1), taxB: avg(h => h.taxB), taxX: avg(h => h.taxX),
    eqMax: Math.max(...H.map(h => h.eqMax)), speed: H.map(h => h.msB / h.msX) };
}
export function rule12(r) {
  const part1 = r.lo > RULE.pooledLo, part2 = r.harmed.length === 0, part3 = r.spend >= -RULE.spend - EPS;
  const potBad = r.H.filter(h => h.pot < -RULE.potCouple - EPS), part4 = r.pot >= -RULE.potPooled - EPS && potBad.length === 0;
  const eqBad = r.H.filter(h => h.eqMax > RULE.equity + EPS), part5 = eqBad.length === 0;
  const parts = { 1: part1, 2: part2, 3: part3, 4: part4, 5: part5 }, failed = Object.keys(parts).filter(k => !parts[k]).map(Number);
  return { ...r, parts, failed, potBad, eqBad, pass: failed.length === 0 };
}
/* the outcome from arm (a)'s read and arm (b)'s (ITEM12-A.md) */
export function take12(a, b) {
  if (b.pass) return { build: 'b', why: `(b) PASSES${a.pass ? ' (and (a))' : ` ((a) fails ${a.failed.join(', ')})`}: item 12's stage B is built for the shortlist in a couple's ranking with the joint options, off in code (D84)` };
  if (a.pass) return { build: 'a', why: `ONLY (a) PASSES ((b) fails ${b.failed.join(', ')}): stage B is built for the shortlist in a couple's ranking alone, off in code (D84)` };
  return { build: null, why: `NEITHER PASSES ((a) fails ${a.failed.join(', ')}; (b) fails ${b.failed.join(', ')}): item 12 is closed and nothing is built (D84)` };
}
/* the gate: refusals, each a line. raw: the unit files; ids: the couples; ARMS and wantOf: audit-item12.mjs's; audit:
   these files' hash; size: the paths and points the run is (null in a smoke read) */
export function gate(raw, ids, ARMS, wantOf, audit, size = { N: 16000, pts: 45, seed: 7002 }, IDENT = { asIs: 20, wholeTie: 200 }) {
  const P = [], missing = ids.filter(id => !raw.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f0) => { const vs = [...new Set(raw.map(f0))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && raw.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (size && raw.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of raw) {
    const got = Object.keys(U.arms || {}).sort().join(), w = Object.keys(ARMS).sort().join();
    if (got !== w) { P.push(`${U.id}: the arms ${got || 'none'}, not ${w}`); continue; }
    if (U.digest0 !== U.digest1) P.push(`${U.id}: its tables changed while its arms ran`);
    const I = U.identities || {};
    for (const k of ['asIs', 'wholeTie']) if (!I[k] || I[k].differ !== 0 || I[k].n < Math.min(IDENT[k], U.N)) P.push(`${U.id}: the identity ${k} is not held (${I[k] ? `${I[k].differ} of ${I[k].n} paths differ` : 'not recorded'})`);
    for (const [name, x] of Object.entries(U.arms)) {
      if (x.sw !== wantOf(ARMS[name])) P.push(`${U.id} arm ${name}: ran "${x.sw}", not "${wantOf(ARMS[name])}"`);
      for (const k of ['survived', 'pot', 'delivered', 'tax']) if (arr(x[k], k === 'survived' ? Uint8Array : Float64Array).length !== U.N) P.push(`${U.id} arm ${name}: ${k} not one a path`);
      const listed = x.short ? x.short.decisions : NaN;
      if (ARMS[name].short ? !(listed > 0) : listed !== 0) P.push(`${U.id} arm ${name}: ${listed} rankings from a shortlist`);
      if (!(x.eq && x.eq.n > 0)) P.push(`${U.id} arm ${name}: no decision tallied`);
    }
  }
  const withBridge = raw.filter(u => (u.bridge || []).some(b => b > 0)).length;
  if (!missing.length && withBridge < RULE.bridgeCouples) P.push(`${withBridge} couples with years before pension access in their tables, not ${RULE.bridgeCouples}`);
  return P;
}

function planted() {
  let bad = 0;
  const check = (what, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) bad++; };
  const n = 1000;
  // a couple's two arms: the base survives on its first 900 paths; X loses `lost` of them and saves `saved` of the rest;
  // its pot and spending scaled, its equity weight shifted on one slot
  const mk = (o = {}) => {
    const B = { survived: new Uint8Array(n), delivered: new Float64Array(n).fill(1000), pot: new Float64Array(n).fill(500), tax: new Float64Array(n).fill(50), ms: 10, eq: { n: 100, sum: [60, 40, 60, 0], wsum: [600, 400, 600, 0], pot: [1000, 1000, 1000, 0] } };
    for (let i = 0; i < 900; i++) B.survived[i] = 1;
    const X = { survived: Uint8Array.from(B.survived), delivered: new Float64Array(n).fill(1000 + (o.spend || 0) * 10), pot: new Float64Array(n).fill(500 * (1 + (o.pot || 0) / 100)), tax: new Float64Array(n).fill(50), ms: 5,
      eq: { n: 100, sum: [60 + (o.eq || 0), 40, 60, 0], wsum: [600, 400, 600, 0], pot: [1000, 1000, 1000, 0] } };
    for (let i = 0; i < (o.lost || 0); i++) X.survived[i] = 0;
    for (let i = 0; i < (o.saved || 0); i++) X.survived[900 + i] = 1;
    return { id: o.id || 'E', lifeTarget: 1000, slots: ['self pen', 'self isa', 'part pen', 'part isa (none)'], B, X };
  };
  const R = specs => rule12(readOf(specs.map((o, i) => mk({ id: `C${i}`, ...o }))));
  const eight = o => Array.from({ length: 8 }, () => ({ ...o }));
  check('eight couples with nothing moved pass every part', R(eight({})).pass);
  check('part 1 fails on a pooled loss of 0.2 points, and holds on one path lost and one saved a couple', !R(eight({ lost: 2 })).parts[1] && R(eight({ lost: 1, saved: 1 })).parts[1]);
  { const r = R([{ lost: 12 }, ...eight({}).slice(1)]); check('part 2 fails on one couple wholly below -0.3 (12 lost of 1,000), with the pooled loss inside part 1', !r.parts[2] && r.harmed.length === 1 && r.harmed[0].id === 'C0'); }
  check('part 3 fails on spending 0.11 points lower, holds at 0.1 lower and on any amount higher', !R(eight({ spend: -0.11 })).parts[3] && R(eight({ spend: -0.1 })).parts[3] && R(eight({ spend: 2 })).parts[3]);
  check('part 4 fails on the pooled pot 0.6% lower, holds at 0.5% lower, and more pot passes', !R(eight({ pot: -0.6 })).parts[4] && R(eight({ pot: -0.5 })).parts[4] && R(eight({ pot: 9 })).parts[4]);
  { const r = R([{ pot: -1.2 }, ...eight({}).slice(1)]); check('part 4 fails on one couple\'s pot 1.2% lower with the pooled pot inside 0.5%', !r.parts[4] && r.pot > -0.5 && r.potBad.length === 1); }
  { const r = R([{ eq: 1.1 }, ...eight({}).slice(1)]), e = R([{ eq: -1 }, ...eight({}).slice(1)]); check('part 5 fails on one person\'s equity weight 1.1 points from the whole menu\'s, holds at one point, and a wrapper the person has not got is left out', !r.parts[5] && r.eqBad.length === 1 && e.parts[5] && r.H[0].eq[3] === null); }
  const ok = R(eight({})), no = R(eight({ lost: 2 }));
  check('the outcome: (b) passes: b; only (a): a; neither: nothing built', take12(ok, ok).build === 'b' && take12(no, ok).build === 'b' && take12(ok, no).build === 'a' && take12(no, no).build === null);
  // the gate
  const ARMS = { base: { short: null }, a: { short: 'order' } }, wantOf = A => `ranking ${A.short || 'whole'}`, b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const armX = (name, o = {}) => ({ sw: wantOf(ARMS[name]), ms: 1, eq: { n: 4, sum: [1, 1, 1, 1], wsum: [1, 1, 1, 1], pot: [1, 1, 1, 1] }, short: { decisions: ARMS[name].short ? 7 : 0 }, far: 0, survived: b64(new Uint8Array(2)), pot: b64(new Float64Array(2)), delivered: b64(new Float64Array(2)), tax: b64(new Float64Array(2)), ...o });
  const unit = (id, o = {}) => ({ id, seed: 7002, N: 2, pts: 45, stamp: { code: 'c', audit: 'a' }, digest0: 'd', digest1: 'd', bridge: [1, 0], identities: { asIs: { n: 2, differ: 0 }, wholeTie: { n: 2, differ: 0 } }, arms: { base: armX('base'), a: armX('a') }, ...o });
  const size = { N: 2, pts: 45, seed: 7002 }, ids = ['E', 'F', 'G', 'H'], all = (o = {}) => ids.map(id => unit(id, id === 'E' ? o : {}));
  const G = (units, i = ids) => gate(units, i, ARMS, wantOf, 'a', size);
  { const g0 = G(all()); check(`the gate passes four whole couples${g0.length ? `: ${g0[0]}` : ''}`, g0.length === 0); }
  check('the gate refuses a missing unit', G(all().slice(1)).some(x => /units missing: E/.test(x)));
  check('the gate refuses units of two codes', G(all({ stamp: { code: 'x', audit: 'a' } })).some(x => /more than one code/.test(x)));
  check('the gate refuses a unit of another size', G(all(), ids).length === 0 && gate(all(), ids, ARMS, wantOf, 'a').some(x => /not 16000 paths/.test(x)));
  check('the gate refuses a unit whose tables changed under its arms', G(all({ digest1: 'z' })).some(x => /tables changed/.test(x)));
  check('the gate refuses a unit whose identity is not held, or was run on too few paths', G(all({ identities: { asIs: { n: 2, differ: 1 }, wholeTie: { n: 2, differ: 0 } } })).some(x => /identity asIs/.test(x)) && G(all({ identities: { asIs: { n: 2, differ: 0 }, wholeTie: { n: 1, differ: 0 } } })).some(x => /identity wholeTie/.test(x)));
  check('the gate refuses an arm whose switches, read back, are not its name\'s', G(all({ arms: { base: armX('base'), a: armX('a', { sw: 'ranking whole' }) } })).some(x => /arm a: ran "ranking whole"/.test(x)));
  check('the gate refuses a shortlist arm that ranked nothing from a shortlist, and a comparison that did', G(all({ arms: { base: armX('base'), a: armX('a', { short: { decisions: 0 } }) } })).some(x => /arm a: 0 rankings/.test(x)) && G(all({ arms: { base: armX('base', { short: { decisions: 3 } }), a: armX('a') } })).some(x => /arm base: 3 rankings/.test(x)));
  check('the gate refuses fewer than four couples with years before pension access', G(all({ bridge: [0, 0] })).some(x => /3 couples with years before pension access/.test(x)));
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'item12-7002');
  const { COUPLES, ARMS, wantOf, stampFilesHash, ASIS, TIE_SAME } = await import('./audit-item12.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const ids = smoke ? raw.map(u => u.id) : COUPLES;
  const P = gate(raw, ids, ARMS, wantOf, smoke ? null : stampFilesHash(), smoke ? null : undefined, { asIs: ASIS, wholeTie: TIE_SAME }).filter(x => !(smoke && /couples with years before/.test(x)));
  if (P.length) { console.log(`ITEM12-A GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const units = ids.map(id => raw.find(u => u.id === id)), u0 = units[0];
  const A = Object.fromEntries(units.map(u => [u.id, Object.fromEntries(Object.entries(u.arms).map(([k, a]) => [k, armOf(a)]))]));
  const pairs = x => units.map(u => ({ id: u.id, lifeTarget: u.lifeTarget, slots: u.slots, B: A[u.id].base, X: A[u.id][x] }));
  console.log(`ITEM12-A (EXPLORATORY; D84; ITEM12-A.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${raw.length} units, ${ids.length} couples, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points; the gate: fair (one code, audit, seed, count of paths and points; each unit's two identities held; each arm's switches, read back, its own; the comparison ranked nothing from a shortlist and each arm did; each unit's tables the same after its arms as before; ${units.filter(u => u.bridge.some(b => b > 0)).length} couples with years before pension access)`);
  console.log(`\nThe comparison, the flat path on the whole menu, by couple (years; the solve's seconds; the solve on anchors, each person; years before pension access in each person's table; the identities; survival; spending delivered; mean pot; lifetime tax; each person's equity weight held, pension/ISA, plain and by pot; a path):`);
  const e2 = v => v.map(x => (x === null ? '-' : x.toFixed(1)));
  for (const u of units) { const a = A[u.id].base, e = e2(eqOf(a.eq)), w = e2(eqwOf(a.eq));
    console.log(`  ${u.id.padEnd(5)} ${u.years} years | solve ${u.solveSecs.toFixed(0)} s, anchors ${u.coarse.join(' and ')} | ${u.bridge.join(' and ')} | as it was ${u.identities.asIs.differ} of ${u.identities.asIs.n} differ (${u.identities.asIs.ms.toFixed(0)} ms a path), with the tie-break ${u.identities.wholeTie.differ} of ${u.identities.wholeTie.n} | ${(100 * mean(a.survived)).toFixed(2)}% | ${(100 * mean(a.delivered) / u.lifeTarget).toFixed(3)}% | £${Math.round(mean(a.pot)).toLocaleString('en-GB')} | £${Math.round(mean(a.tax)).toLocaleString('en-GB')} | ${e[0]}/${e[1]} and ${e[2]}/${e[3]} (by pot ${w[0]}/${w[1]} and ${w[2]}/${w[3]}) | ${a.ms.toFixed(1)} ms`); }
  const show = (title, r) => {
    console.log(`\n${title}`);
    for (const h of r.H) { const u = units.find(x => x.id === h.id), a = A[h.id][r.name];
      console.log(`  ${h.id.padEnd(5)} survival ${h.p.sB.toFixed(2)}% / ${h.p.sX.toFixed(2)}%, d ${f(h.p.d)} (${f(h.p.lo)} to ${f(h.p.hi)}; ${h.p.saved} saved, ${h.p.lost} lost) | spending ${f(h.spend, 4)} | pot ${f(h.pot, 3)}% | tax ${f(h.tax, 2)}% | equity held, pension/ISA: ${e2(h.eq).map((x, j) => (x === '-' ? x : f(h.eq[j], 2))).slice(0, 2).join('/')} and ${e2(h.eq).map((x, j) => (x === '-' ? x : f(h.eq[j], 2))).slice(2).join('/')} (by pot ${h.eqw.map(x => (x === null ? '-' : f(x, 2))).join(' ')}) | ${(h.msB / h.msX).toFixed(2)} times as fast | rankings from a shortlist ${a.short.decisions}, the whole menu after all ${a.short.fallback}, sliced ${a.short.sliced}${u && a.far ? `, pairs not tried at a far split ${a.far}` : ''}`); }
    const L = [
      `1. pooled survival ${f(r.pooled)} (95% ${f(r.lo)} to ${f(r.hi)}, se ${r.se.toFixed(4)}; ${r.saved} saved, ${r.lost} lost); its lower end above ${RULE.pooledLo}: ${r.parts[1] ? 'HOLDS' : 'FAILS'}`,
      `2. no couple wholly below ${RULE.couple}: ${r.harmed.length ? r.harmed.map(h => `${h.id} (${f(h.p.lo)} to ${f(h.p.hi)})`).join(', ') : 'none'}: ${r.parts[2] ? 'HOLDS' : 'FAILS'}`,
      `3. pooled spending delivered ${f(r.spend, 4)} points of target; not lower by more than ${RULE.spend}: ${r.parts[3] ? 'HOLDS' : 'FAILS'}`,
      `4. the pooled mean pot left ${f(r.pot, 3)}% (the mean of the couples' changes; the ratio of the summed pots ${f(r.potRatio, 3)}%), not lower by more than ${RULE.potPooled}%; a couple lower by more than ${RULE.potCouple}%: ${r.potBad.length ? r.potBad.map(h => `${h.id} ${f(h.pot, 3)}%`).join(', ') : 'none'}: ${r.parts[4] ? 'HOLDS' : 'FAILS'}`,
      `5. each person's equity weight held within ${RULE.equity} point of the whole menu's: the largest difference ${r.eqMax.toFixed(3)} points; a couple beyond it: ${r.eqBad.length ? r.eqBad.map(h => `${h.id} ${h.eqMax.toFixed(3)}`).join(', ') : 'none'}: ${r.parts[5] ? 'HOLDS' : 'FAILS'}`,
      `beside the rule: pooled lifetime tax £${Math.round(r.taxB).toLocaleString('en-GB')} to £${Math.round(r.taxX).toLocaleString('en-GB')} (${f(r.tax, 2)}%); a path ${Math.min(...r.speed).toFixed(2)} to ${Math.max(...r.speed).toFixed(2)} times as fast as the flat path (other work on the machine: a guide)`
    ];
    for (const l of L) console.log(`  ${l}`);
    console.log(`  ${r.pass ? 'PASSES 1 to 5' : `FAILS ${r.failed.join(', ')}`}`);
  };
  const ra = { ...rule12(readOf(pairs('a'))), name: 'a' }, rb = { ...rule12(readOf(pairs('b'))), name: 'b' };
  show('Arm (a), the shortlist that passed item 7 in each person\'s ranking, against the flat path on the whole menu:', ra);
  show('Arm (b), the same with item 12\'s joint options (one read, the bridge search on 5 points and 3 steps, near):', rb);
  const t = take12(ra, rb);
  console.log(`\nITEM 12 OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${t.why}`);
}
