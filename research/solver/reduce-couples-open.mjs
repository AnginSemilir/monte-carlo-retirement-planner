/*
 * THE GUARD'S OWN UNITS, THE READ (COUPLES-OPEN.md; the dress rehearsal: EXPLORATORY, the tuning seed 7002; read once, by its
 * rule, which is the registered test's to come). The stamps first (fair-gate.mjs requireFairLogs: every log stamped by the
 * launcher, PREDICTION none), then the gate: every unit of couples-open-panel.json there with both arms (APP, ROUTE); one code,
 * audit, seed, Node version, count of paths and points; each arm at its configuration (audit-couples-open.mjs configOf), every
 * array one a path; each unit's guard off for its class's reason and its route the panel's; each unit's own launch log with its
 * done line.
 * Then the rule, ROUTE against APP, for each class on its own route (couples-open-panel.mjs CLASSES: Y, E, S and G on the
 * household route, RY, RE, RS and RG on today's; until 22 Nov's amendment the rehearsal's R was RY), as step 8's
 * (reduce-household-hsp.mjs compare) with APP as the base:
 *   1. NO HARM: no unit of the class flagged by D34's harm rule (reduce-couples.mjs harmOf: the loss over the unit's paths
 *      against the threshold its realised discordance sets), compared in whole paths (reduce-share-rules.mjs harmExact);
 *   2. A GAIN: the class's pooled survival change with its 95% interval's lower end above nought, the interval by path
 *      (reduce-phase4.mjs survivalItem: every unit runs the same paths);
 *   3. SPENDING: the class's pooled spending delivered on the paths both keep, each unit's change in percent of APP's mean on
 *      those paths, the units weighted equally (reduce-household-hsp.mjs keptSpend), its point not lower than -0.05%.
 * A class passing all three OPENS (its part of the guard would come off, in a registered test); otherwise it STAYS, with its
 * parts and its units. Beside, deciding nothing: each unit's survival under both arms, its change and harm threshold, its
 * spending on the paths both keep, its spending over all paths (reduce-phase4.mjs spendingItem, since 22 Nov: the rehearsal
 * read's reviewer, MINOR 4) with the units below beyond noise named, the mean pot left (uncapped and capped at the route's
 * estate caps), lifetime tax in percent and in pounds a path, the route, each arm's MPAA ages and the times.
 * THE DRESS REHEARSAL'S ADDENDUM (COUPLES-OPEN.md amendment 1): the five units added to every couple after the rehearsal's read
 * (couples-open-panel.mjs ADDENDUM), read on their own by the same rule, the gate as the rehearsal's on their own units:
 *   node research/solver/reduce-couples-open.mjs --addendum [dir] > research/solver/results-couples-open-addendum.txt
 * THE REGISTERED TEST (registrations/couples-open.md; REG=1, the registered panel): the stamps against the registration's git
 * blob (fair-gate.mjs requireFairLogs), the gate at the held-out seed and couples-open-paths.json's paths, then the rule as
 * above, and M1 by unit (D116; as step 8's): a unit where ROUTE keeps more paths but spends less on the paths both keep beyond
 * noise is named with its pot and its spending over all paths; not a bar.
 *   node research/solver/reduce-couples-open.mjs [dir] > research/solver/results-couples-open-rehearsal.txt
 *   node research/solver/reduce-couples-open.mjs --smoke [dir]       a smoke's gate and the rule's run, no figure printed
 *   REG=1 node research/solver/reduce-couples-open.mjs --pilot [dir]  the registered test's pilot: its gate alone, no figure
 *   REG=1 node research/solver/reduce-couples-open.mjs --registered --part household [dir] > research/solver/results-couples-open-household.txt
 *   REG=1 node research/solver/reduce-couples-open.mjs --registered --part today [dir] > research/solver/results-couples-open-today.txt
 *     the registered read in its two parts (registrations/couples-open.md, The read): each part's units alone, the household
 *     route's (Y, E, S, G; run first) or today's (RY, RE, RS, RG), each read once when its units are in; a part's read opens
 *     no record of the other's
 *   node research/solver/reduce-couples-open.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalItem, spendingItem } from './reduce-phase4.mjs';
import { harmExact } from './reduce-share-rules.mjs';
import { cells } from './reduce-household.mjs';
import { keptSpend } from './reduce-household-hsp.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { ARMS, KEYS, SEED, W, N_DEFAULT, HELD, PILOT_N, REGISTRATION, PATHS_FILE, ROUTE_CTX, PARTS, configOf, stampFilesHash, unitsOf } from './audit-couples-open.mjs';
import { CLASSES, WANT, ROUTE_OF_CLASS } from './couples-open-panel.mjs';
import { APP_POINTS } from '../../src/solverSettings.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const POOL_BAR = 0, SPEND_BAR = -0.05;
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])) });
export function loadDir(dir, ids = null) {
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x) && (!ids || ids.has(x.replace(/\.json\.gz$/, '')))).map(x => { const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
}
/* the gate: refusals, each a line. `want` the units' ids and routes; `logs` file -> text (each unit's own case log), or null */
export function gate(units, want, { seed = SEED, n = N_DEFAULT, pts = APP_POINTS, audit = null, logs = null } = {}) {
  const P = [], byId = Object.fromEntries(units.map(u => [u.id, u])), wantIds = want.map(w => w.id);
  if (!units.length) P.push('no units');
  for (const w of want) if (!byId[w.id]) P.push(`${w.id}: missing`);
  for (const u of units) if (!wantIds.includes(u.id)) P.push(`${u.id}: not a unit of the read`);
  const one = (key, f) => { const s = new Set(units.map(f)); if (s.size > 1) P.push(`more than one ${key}: ${[...s].join(', ')}`); };
  one('code', u => u.stamp && u.stamp.code); one('audit', u => u.stamp && u.stamp.audit); one('Node version', u => u.stamp && u.stamp.node);
  if (audit !== null && units.some(u => u.stamp && u.stamp.audit !== audit)) P.push(`an audit stamp not this read's files' (${audit})`);
  for (const u of units) {
    const w = want.find(x => x.id === u.id);
    if (u.seed !== seed) P.push(`${u.id}: seed ${u.seed}, not ${seed}`);
    if (u.N !== n) P.push(`${u.id}: ${u.N} paths, not ${n}`);
    if (u.pts !== pts) P.push(`${u.id}: ${u.pts} points, not ${pts}`);
    if (u.W !== W) P.push(`${u.id}: estate weight ${u.W}, not ${W}`);
    if (!u.guard || u.guard.on || u.guard.why !== (WANT[u.variant] || {}).why) P.push(`${u.id}: the guard ${u.guard ? (u.guard.on ? 'on' : `off for '${u.guard.why}'`) : 'unrecorded'}, not off for its class's '${(WANT[u.variant] || {}).why}'`);
    if (w && u.route !== w.route) P.push(`${u.id}: the route '${u.route}', not the panel's '${w.route}'`);
    if (u.routeCtx !== ROUTE_CTX) P.push(`${u.id}: ROUTE's context '${u.routeCtx}', not the page's ('${ROUTE_CTX}')`);
    if (u.cls && ROUTE_OF_CLASS[u.cls] !== u.route) P.push(`${u.id}: class ${u.cls} on the route '${u.route}', not its class's '${ROUTE_OF_CLASS[u.cls]}'`);
    for (const arm of ARMS) {
      const A = u.arms && u.arms[arm];
      if (!A) { P.push(`${u.id} ${arm}: missing`); continue; }
      if (A.config !== configOf(arm)) P.push(`${u.id} ${arm}: configuration ${A.config}, not ${configOf(arm)}`);
      for (const key of Object.keys(KEYS)) if (!A[key] || A[key].length !== u.N) P.push(`${u.id} ${arm}: ${key} not one a path`);
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
/* the registered read's part: the ids of its route's units and their launch logs (case<k>, k the unit's place in the
   registered order, audit-couples-open.mjs unitsOf), so a part's read opens no record and no log of the other's */
export function partOf(regOrder, part) {
  const ids = new Set(), logs = new Set();
  regOrder.forEach((u, k) => { if (u.route === part) { ids.add(u.id); logs.add(`case${k}.txt`); } });
  return { ids, logs };
}
/* ROUTE against APP over a class's units: each unit's harm (D34, in whole paths) and change; the class's pooled change and
   spending on the paths both keep, both by path */
export function compareClass(units) {
  const ns = [...new Set(units.map(u => u.N))];
  if (ns.length !== 1) throw new Error(`reduce-couples-open: the units run ${ns.join(', ')} paths, not one count`);
  const n = ns[0], rows = units.map(u => ({ id: u.id, variant: u.variant, route: u.route, cells: cells(u.arms.APP, u.arms.ROUTE), ...harmExact(u.arms.ROUTE, u.arms.APP, u.N) }));
  return { rows, pooled: survivalItem(units.map(u => [u.arms.ROUTE, u.arms.APP]), n), kept: keptSpend(units, 'APP', 'ROUTE', n), all: spendingItem(units.map(u => [u.arms.ROUTE, u.arms.APP]), n) };
}
/* the rule, each class on its own */
export function rule(units) {
  return Object.fromEntries(CLASSES.filter(k => units.some(u => u.cls === k)).map(k => {
    const C = compareClass(units.filter(u => u.cls === k)), flagged = C.rows.filter(r => r.flag);
    const parts = { harm: flagged.length === 0, gain: C.pooled.lo > POOL_BAR, spend: C.kept.d >= SPEND_BAR };
    return [k, { C, flagged, parts, outcome: parts.harm && parts.gain && parts.spend ? 'OPENS' : 'STAYS' }];
  }));
}
const pct = (b, x) => { const sb = sum(b), sx = sum(x); return sb > 0 ? 100 * (sx / sb - 1) : 0; };
const capped = (cap, b, x) => { if (!(cap > 0)) return null; let sb = 0, sx = 0; for (let i = 0; i < b.length; i++) { sb += Math.min(b[i], cap); sx += Math.min(x[i], cap); } return { pct: sb > 0 ? 100 * (sx / sb - 1) : 0, gbp: (sx - sb) / b.length }; };
const surv = A => (100 * sum(A.survived)) / A.survived.length;
/* M1 by unit (D116, as step 8's m1ByUnit, APP the base): a unit where ROUTE keeps more paths, net, but spends less on the paths
   both keep beyond noise (its interval's upper end below nought), named with its pot and its spending over all paths */
export function m1ByUnit(units) {
  return units.map(u => {
    const c = cells(u.arms.APP, u.arms.ROUTE), kp = keptSpend([u], 'APP', 'ROUTE', u.N), cap = capped(sum(u.caps || []), u.arms.APP.pot, u.arms.ROUTE.pot);
    return { id: u.id, net: c.saved - c.lost, kept: kp, all: pct(u.arms.APP.delivered, u.arms.ROUTE.delivered), cap, named: c.saved - c.lost > 0 && kp.hi < 0 };
  });
}
export const CLASS_NAMES = Object.freeze({ Y: 'the younger partner holding most, the household route', E: 'the elder holding more than 90%, the household route', S: 'the two the same age, outside 40% to 60%, the household route', G: 'more than three years apart with other taxable income, the household route', RY: 'the younger partner holding most, today\'s route', RE: 'the elder holding more than 90%, today\'s route', RS: 'the two the same age, outside 40% to 60%, today\'s route', RG: 'more than three years apart with other taxable income, today\'s route' });
/* a unit's spending over all paths, ROUTE against APP, in percent of APP's mean, by path (beside the rule, deciding nothing) */
export const allSpendOf = u => spendingItem([[u.arms.ROUTE, u.arms.APP]], u.N);
export function report(units, { registered = false } = {}) {
  const R = rule(units), out = [];
  for (const [k, r] of Object.entries(R)) {
    const p = r.parts;
    out.push(`CLASS ${k}, ${CLASS_NAMES[k]} (${r.C.rows.length} units): ${r.outcome}`);
    out.push(`  1. no harm by D34: ${p.harm ? 'HOLDS' : `FAILS on ${r.flagged.map(x => x.id).join(', ')}`}`);
    out.push(`  2. a gain: pooled survival ${iv(r.C.pooled)} points, by path, its lower end above ${POOL_BAR}: ${p.gain ? 'HOLDS' : 'FAILS'}`);
    out.push(`  3. spending on the paths both keep ${iv(r.C.kept, f4)}%, the units weighted equally, not below ${SPEND_BAR}%: ${p.spend ? 'HOLDS' : 'FAILS'}`);
    out.push(`     beside, not a bar: spending over all paths ${iv(r.C.all, f4)}%, the units weighted equally`);
    for (const row of r.C.rows) {
      const u = units.find(x => x.id === row.id), A = u.arms.APP, X = u.arms.ROUTE, kp = keptSpend([u], 'APP', 'ROUTE', u.N), al = allSpendOf(u), cap = capped(sum(u.caps || []), A.pot, X.pot);
      out.push(`    ${row.id.padEnd(12)} ${row.route.padEnd(9)} APP ${surv(A).toFixed(2)}% ROUTE ${surv(X).toFixed(2)}%; ${row.lost} lost, ${row.saved} saved of ${row.n}, the threshold ${row.j} paths${row.flag ? ' FLAGGED' : ''}; spending on the paths both keep ${f4(kp.d)}%, over all paths ${iv(al, f4)}%; the mean pot ${f3(pct(A.pot, X.pot))}%${cap ? `, capped ${f3(cap.pct)}% (${gbp(cap.gbp)} a path)` : ''}; lifetime tax ${f3(pct(A.tax, X.tax))}% (APP ${gbp(sum(A.tax) / A.tax.length)}, ROUTE ${gbp(sum(X.tax) / X.tax.length)} a path)${u.mpaa ? `; MPAA ages APP ${u.mpaa.APP.join('/')}, ROUTE ${u.mpaa.ROUTE.join('/')}` : ''}`);
    }
  }
  const below = units.map(u => ({ id: u.id, al: allSpendOf(u) })).filter(x => x.al.hi < 0);
  out.push(`SPENDING OVER ALL PATHS (beside, not a bar): units where ROUTE delivers less lifetime spending than APP beyond noise: ${below.length ? below.map(x => `${x.id} ${iv(x.al, f4)}%`).join('; ') : 'none'}`);
  const m1 = m1ByUnit(units).filter(x => x.named);
  out.push(`M1 by unit (D116; named, not a bar): ${m1.length ? m1.map(x => `${x.id} (${x.net} paths kept net; spending on the paths both keep ${iv(x.kept, f4)}%, over all paths ${f3(x.all)}%; the pot capped ${x.cap ? `${f3(x.cap.pct)}% (${gbp(x.cap.gbp)} a path)` : 'no cap'})`).join('; ') : 'none: no unit keeps more paths and spends less on the paths both keep beyond noise'}`);
  const opens = Object.entries(R).filter(([, r]) => r.outcome === 'OPENS').map(([k]) => k), stays = Object.entries(R).filter(([, r]) => r.outcome !== 'OPENS').map(([k]) => k);
  out.push(registered
    ? `OUTCOME: ${opens.length ? `${opens.join(', ')} ${opens.length > 1 ? 'open their parts' : 'opens its part'} of the guard, by a change of default with the reviewer on it${m1.length ? ', the read going to the maintainer first with the units M1 names' : ''}` : 'no class opens'}${stays.length ? `; ${stays.join(', ')} ${stays.length > 1 ? 'keep' : 'keeps'} the app's rules and ${stays.length > 1 ? 'go' : 'goes'} to the maintainer with ${stays.length > 1 ? 'their' : 'its'} units` : ''}`
    : `OUTCOME: ${opens.length ? `${opens.join(', ')} ${opens.length > 1 ? 'pass' : 'passes'}` : 'no class passes'}${stays.length ? `; ${stays.join(', ')} ${stays.length > 1 ? 'do' : 'does'} not, and ${stays.length > 1 ? 'go' : 'goes'} to the maintainer with ${stays.length > 1 ? 'their' : 'its'} units` : ''} (EXPLORATORY: nothing opens on this read; the registered test reads by this rule)`);
  const t = u => (u.arms.ROUTE.cpuUs / u.N / 1e3), ta = u => (u.arms.APP.cpuUs / u.N / 1e3);
  out.push(`beside: a path's CPU, APP the median ${median(units.map(ta)).toFixed(1)} ms, ROUTE ${median(units.map(t)).toFixed(1)} ms; ROUTE's solve the median ${median(units.map(u => u.arms.ROUTE.solveSecs)).toFixed(0)} s`);
  return { R, out };
}
const median = a => { const s = [...a].sort((p, q) => p - q), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

/* planted units: each arm's survival as given, path by path */
const VAR_OF = { Y: 'Y75', E: 'E95', S: 'S75', G: 'G8', RY: 'RY75', RE: 'RE100', RS: 'RS75', RG: 'RG8' };
function unit(id, k, cls, app, route, { n = 2000, deliveredDrop = 0 } = {}) {
  const mk = (surv, drop) => ({ config: null, survived: Uint8Array.from({ length: n }, (_, i) => (surv(i) ? 1 : 0)), failYear: new Int16Array(n), pot: new Float64Array(n).fill(1e5), estate: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n).fill(100 - drop), unmet: new Float64Array(n), cpuUs: n * 1000, solveSecs: 1 });
  const variant = VAR_OF[cls];
  return { id, k, cls, variant, route: ROUTE_OF_CLASS[cls], N: n, seed: SEED, pts: APP_POINTS, W, stamp: { code: 'c', audit: 'a', node: 'v' }, guard: { on: false, why: WANT[variant].why }, routeCtx: ROUTE_CTX, caps: [5e4, 0], arms: { APP: mk(app, 0), ROUTE: mk(route, deliveredDrop) } };
}
function planted() {
  const cases = [], n = 2000;
  const base = i => i % 10 !== 0;                                     // APP survives 90%
  const gain = i => i % 10 !== 0 || i % 20 === 0;                       // ROUTE saves half the paths APP loses: +5 points
  const harm = i => i % 10 !== 0 && i % 7 !== 0;                        // ROUTE loses about 13 points more
  const same = i => i % 10 !== 0;
  const thin = i => (i % 10 !== 0 && i % 80 !== 1) || i % 60 === 0;   // ROUTE loses 25 paths APP keeps and saves 34: +0.45 points, within noise
  { const R = rule([unit('a', 0, 'Y', base, gain), unit('b', 1, 'Y', base, gain)]);
    cases.push(['a class gaining on every unit opens', `${R.Y.outcome} ${R.Y.parts.harm} ${R.Y.parts.gain} ${R.Y.parts.spend}`, 'OPENS true true true']); }
  { const R = rule([unit('a', 0, 'Y', base, gain), unit('b', 1, 'Y', base, harm)]);
    cases.push(['a class with one harmed unit stays, the unit named', `${R.Y.outcome} ${R.Y.flagged.map(x => x.id).join(',')}`, 'STAYS b']); }
  { const R = rule([unit('a', 0, 'E', base, same), unit('b', 1, 'E', base, same)]);
    cases.push(['a class with no gain stays on part 2 alone', `${R.E.outcome} ${R.E.parts.harm} ${R.E.parts.gain}`, 'STAYS true false']); }
  { const R = rule([unit('a', 0, 'S', base, gain, { deliveredDrop: 1 }), unit('b', 1, 'S', base, gain, { deliveredDrop: 1 })]);
    cases.push(['a class spending 1% less on the paths both keep stays on part 3', `${R.S.outcome} ${R.S.parts.spend}`, 'STAYS false']); }
  // part 2 reads the interval's lower end, not its point (the rehearsal read's reviewer, MINOR 5): a gain within noise stays
  { const R = rule([unit('a', 0, 'E', base, thin), unit('b', 1, 'E', base, thin)]), c = R.E.C.pooled;
    cases.push(['part 2: a pooled gain above nought whose interval reaches below it stays on part 2', `${R.E.outcome} ${c.d > 0} ${c.lo < 0} ${R.E.parts.harm} ${R.E.parts.gain} ${R.E.parts.spend}`, 'STAYS true true true false true']); }
  // part 3's bar at -0.05%: -0.06% fails, -0.04% holds (the bar, not ten or twenty times it)
  { const R6 = rule([unit('a', 0, 'S', base, gain, { deliveredDrop: 0.06 }), unit('b', 1, 'S', base, gain, { deliveredDrop: 0.06 })]), R4 = rule([unit('a', 0, 'S', base, gain, { deliveredDrop: 0.04 }), unit('b', 1, 'S', base, gain, { deliveredDrop: 0.04 })]);
    cases.push(['part 3 at its bar: -0.06% on the paths both keep stays, -0.04% opens', `${R6.S.C.kept.d.toFixed(3)} ${R6.S.outcome} ${R4.S.C.kept.d.toFixed(3)} ${R4.S.outcome}`, '-0.060 STAYS -0.040 OPENS']); }
  { const R = rule([unit('a', 0, 'Y', base, gain), unit('g', 1, 'G', base, harm), unit('r', 2, 'RY', base, gain), unit('rg', 3, 'RG', base, harm), unit('re', 4, 'RE', base, gain)]);
    cases.push(['each class read on its own units and route', `${R.Y.outcome} ${R.G.outcome} ${R.RY.outcome} ${R.RG.outcome} ${R.RE.outcome}`, 'OPENS STAYS OPENS STAYS OPENS']); }
  // the registered read's two parts: each its own route's units and logs, none of the other's
  { const order = [{ id: 'a', route: 'household' }, { id: 'b', route: 'today' }, { id: 'c', route: 'household' }], h = partOf(order, 'household'), t = partOf(order, 'today');
    cases.push(['the registered read\'s parts: each its own units and launch logs alone', `${[...h.ids]} ${[...h.logs]} | ${[...t.ids]} ${[...t.logs]}`, 'a,c case0.txt,case2.txt | b case1.txt']); }
  // spending over all paths, beside: a unit delivering 1% less on every path is named below beyond noise
  { const r = report([unit('a', 0, 'Y', base, gain, { deliveredDrop: 1 }), unit('b', 1, 'Y', base, gain)]).out.find(l => l.startsWith('SPENDING OVER ALL PATHS'));
    cases.push(['spending over all paths: a unit 1% below on every path named, one level not', /: a -1\.0000 /.test(r) && !/ b [-+]/.test(r) ? 'a' : r.slice(0, 120), 'a']); }
  { const M = m1ByUnit([unit('a', 0, 'Y', base, gain, { deliveredDrop: 1 }), unit('b', 1, 'Y', base, gain)]);
    cases.push(['M1 by unit: a unit keeping more paths but spending 1% less on the paths both keep is named, one spending the same is not', M.filter(x => x.named).map(x => x.id).join(','), 'a']); }
  // the gate: every refusal on its planted fault
  { const want = [{ id: 'a', route: 'household' }, { id: 'b', route: 'household' }];
    const ok = () => { const us = [unit('a', 0, 'Y', base, gain), unit('b', 1, 'Y', base, gain)]; for (const u of us) for (const a of ARMS) u.arms[a].config = configOf(a); return us; };
    const log = (u, done = true) => `stamp: code c audit a prediction NOT-LAUNCHED sha -\nTHE GUARD'S OWN UNITS: unit ${u.k}/2: ${u.id} (class Y)\n${done ? `        done unit ${u.k} secs 1\n` : ''}`;
    const clean = gate(ok(), want, { n, audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }), 'case1.txt': log({ id: 'b', k: 1 }) } });
    cases.push(['the gate: two clean units pass', clean.join('; '), '']);
    const faults = [
      ['a unit missing', us => us.slice(1), /a: missing/],
      ['another code', us => { us[1].stamp = { ...us[1].stamp, code: 'd' }; return us; }, /more than one code/],
      ['another seed', us => { us[0].seed = 7001; return us; }, /seed 7001/],
      ['another count of paths', us => { us[0].N = 1000; return us; }, /1000 paths/],
      ['the guard on', us => { us[0].guard = { on: true, why: null }; return us; }, /the guard on/],
      ['the guard off for another reason', us => { us[0].guard = { on: false, why: 'gapincome' }; return us; }, /off for 'gapincome'/],
      ['another route', us => { us[0].route = 'today'; return us; }, /the route 'today'/],
      ['another configuration', us => { us[0].arms.ROUTE.config = 'x'; return us; }, /configuration x/],
      ['an array not one a path', us => { us[0].arms.APP.tax = new Float64Array(3); return us; }, /tax not one a path/],
      // the refusals the rehearsal read's reviewer found unplanted (MINOR 5), and the two of 22 Nov's amendment
      ['another count of points', us => { us[0].pts = 30; return us; }, /a: 30 points/],
      ['another estate weight', us => { us[0].W = 0.01; return us; }, /estate weight 0\.01/],
      ['another Node version', us => { us[1].stamp = { ...us[1].stamp, node: 'w' }; return us; }, /more than one Node version/],
      ['a unit not of the read', us => [...us, { ...us[0], id: 'z', k: 2 }], /z: not a unit of the read/],
      ['an arm missing', us => { delete us[0].arms.ROUTE; return us; }, /a ROUTE: missing/],
      ['ROUTE run on another context than the page\'s', us => { us[0].routeCtx = 'armA'; return us; }, /ROUTE's context 'armA'/],
      ['a class on another route than its own', us => { us[0].route = 'today'; us[0].cls = 'Y'; return us; }, /class Y on the route 'today'/]
    ];
    const missed = faults.filter(([, f, re]) => !gate(f(ok()), want, { n, audit: 'a', logs: null }).some(x => re.test(x))).map(([nm]) => nm);
    const auditOther = gate(ok(), want, { n, audit: 'zz', logs: null }).some(x => /an audit stamp not this read's files' \(zz\)/.test(x));
    const logMiss = gate(ok(), want, { n, audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }) } }).some(x => /b: no launch log/.test(x));
    const logDone = gate(ok(), want, { n, audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }), 'case1.txt': log({ id: 'b', k: 1 }, false) } }).some(x => /b: its launch log does not name it or has no done line/.test(x));
    const logStamp = gate(ok(), want, { n, audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }).replace('audit a ', 'audit q '), 'case1.txt': log({ id: 'b', k: 1 }) } }).some(x => /a: its launch log's stamp is not its unit's/.test(x));
    cases.push([`the gate: every refusal on its planted fault (${faults.length + 4})`, missed.join(', ') + (auditOther ? '' : ' another audit stamp') + (logMiss ? '' : ' log missing') + (logDone ? '' : ' no done line') + (logStamp ? '' : ' a log\'s stamp') || 'all fire', 'all fire']); }
  let bad = 0;
  for (const [nm, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const PILOT = args.includes('--pilot'), REGISTERED = args.includes('--registered'), ADD = args.includes('--addendum');
  const pi = args.indexOf('--part'), PART = pi >= 0 ? args[pi + 1] : null;
  if (REGISTERED !== !!PART || (PART && !PARTS.includes(PART))) { console.error(`reduce-couples-open: the registered read takes --part ${PARTS.join(' or ')}, and only it`); process.exit(2); }
  // the pilot and the registered read take the registered panel (REG=1, so the stamp's data files are its)
  if ((PILOT || REGISTERED) !== (process.env.REG === '1')) { console.error(`reduce-couples-open: ${PILOT ? '--pilot' : REGISTERED ? '--registered' : 'the dress rehearsal'} reads ${PILOT || REGISTERED ? 'with' : 'without'} REG=1`); process.exit(2); }
  const seed = REGISTERED ? HELD : SEED;
  const DIR = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--part') || join(HERE, 'results', REGISTERED ? 'couples-open-run' : PILOT ? 'couples-open-pilot' : ADD ? `couples-open-${SEED}-add` : `couples-open-${SEED}`);
  if (!existsSync(DIR)) { console.error(`reduce-couples-open: no ${DIR}`); process.exit(2); }
  const { readOpenPanel } = await import('./couples-open-panel.mjs');
  // the registered read's part: its route's units alone, no record and no log of the other part opened
  const order = unitsOf(readOpenPanel(), ADD ? 'addendum' : REGISTERED ? 'registered' : ''), P0 = PART ? partOf(order, PART) : null;
  const panel = order.filter(u => !P0 || P0.ids.has(u.id)).map(u => ({ id: u.id, route: u.route }));
  const smoke = args.includes('--smoke'), units = loadDir(DIR, P0 ? P0.ids : null).sort((a, b) => a.k - b.k);
  const want = smoke ? panel.filter(w => units.some(u => u.id === w.id)) : panel;
  const logs = Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x) && (!P0 || P0.logs.has(x))).map(x => [x, readFileSync(join(DIR, x), 'utf8')]));
  const n = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')).N : PILOT ? PILOT_N : N_DEFAULT;
  console.log(`THE GUARD'S OWN UNITS, ${REGISTERED ? `THE REGISTERED TEST (${REGISTRATION}), ITS ${PART === 'household' ? 'HOUSEHOLD ROUTE\'S' : 'TODAY\'S ROUTE\'S'} PART` : PILOT ? 'THE REGISTERED TEST\'S PILOT (EXPLORATORY; its gate alone)' : ADD ? 'THE DRESS REHEARSAL\'S ADDENDUM (EXPLORATORY; COUPLES-OPEN.md amendment 1: the five units added to every couple after the rehearsal\'s read)' : 'THE DRESS REHEARSAL (EXPLORATORY; COUPLES-OPEN.md step 1)'}: ${units.length} units from ${DIR.replace(/.*research\/solver\//, '')}, seed ${seed}${smoke ? ', a smoke' : ''}`);
  if (smoke && units.some(u => u.N === n && u.pts === APP_POINTS)) { console.log('a smoke at the read\'s own count of paths and points: refused (read it without --smoke)'); process.exit(1); }
  // the fair-test gate on the launch logs (CHECKLIST 3): under the registration every log stamped by the launcher with the
  // registration's git blob; an exploratory run's with PREDICTION none; a smoke, not launched, has none; the pilot runs directly
  if (REGISTERED && !smoke) requireFairLogs(Object.values(logs), REGISTRATION);
  else if (!smoke && !PILOT) requireFairLogs(Object.values(logs), 'none', { blob: () => '-' });
  const P = gate(units, want, { seed, audit: stampFilesHash(), logs, n: smoke ? units[0] && units[0].N : n, pts: smoke ? units[0] && units[0].pts : APP_POINTS });
  if (P.length) { console.log(`THE GATE: REFUSED\n  ${P.join('\n  ')}`); process.exit(1); }
  if (smoke || PILOT) { const r = report(units, { registered: REGISTERED }); console.log(`THE GATE: fair on ${smoke ? 'the smoke\'s' : 'the pilot\'s'} ${units.length} units; the rule ran (${r.out.length} lines), no figure printed`); process.exit(0); }
  const u0 = units[0];
  console.log(`THE GATE: fair; one code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${seed}, ${u0.N} paths, ${u0.pts} points; both arms at their configurations; each unit off by the guard for its class's reason and on the panel's route; each unit's own log with its done line`);
  console.log(report(units, { registered: REGISTERED }).out.join('\n'));
}
