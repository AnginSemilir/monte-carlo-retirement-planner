/*
 * THE GUARD'S OWN UNITS, THE READ (COUPLES-OPEN.md; the dress rehearsal: EXPLORATORY, the tuning seed 7002; read once, by its
 * rule, which is the registered test's to come). The stamps first (fair-gate.mjs requireFairLogs: every log stamped by the
 * launcher, PREDICTION none), then the gate: every unit of couples-open-panel.json there with both arms (APP, ROUTE); one code,
 * audit, seed, Node version, count of paths and points; each arm at its configuration (audit-couples-open.mjs configOf), every
 * array one a path; each unit's guard off for its class's reason and its route the panel's; each unit's own launch log with its
 * done line.
 * Then the rule, ROUTE against APP, for each class (Y, E, S, G, R; couples-open-panel.mjs), as step 8's (reduce-household-hsp.mjs
 * compare) with APP as the base:
 *   1. NO HARM: no unit of the class flagged by D34's harm rule (reduce-couples.mjs harmOf: the loss over the unit's paths
 *      against the threshold its realised discordance sets), compared in whole paths (reduce-share-rules.mjs harmExact);
 *   2. A GAIN: the class's pooled survival change with its 95% interval's lower end above nought, the interval by path
 *      (reduce-phase4.mjs survivalItem: every unit runs the same paths);
 *   3. SPENDING: the class's pooled spending delivered on the paths both keep, each unit's change in percent of APP's mean on
 *      those paths, the units weighted equally (reduce-household-hsp.mjs keptSpend), its point not lower than -0.05%.
 * A class passing all three OPENS (its part of the guard would come off, in a registered test); otherwise it STAYS, with its
 * parts and its units. Beside, deciding nothing: each unit's survival under both arms, its change and harm threshold, its
 * spending on the paths both keep, the mean pot left (uncapped and capped at the route's estate caps), lifetime tax, the route
 * and the times.
 * THE REGISTERED TEST (registrations/couples-open.md; REG=1, the registered panel): the stamps against the registration's git
 * blob (fair-gate.mjs requireFairLogs), the gate at the held-out seed and couples-open-paths.json's paths, then the rule as
 * above, and M1 by unit (D116; as step 8's): a unit where ROUTE keeps more paths but spends less on the paths both keep beyond
 * noise is named with its pot and its spending over all paths; not a bar.
 *   node research/solver/reduce-couples-open.mjs [dir] > research/solver/results-couples-open-rehearsal.txt
 *   node research/solver/reduce-couples-open.mjs --smoke [dir]       a smoke's gate and the rule's run, no figure printed
 *   REG=1 node research/solver/reduce-couples-open.mjs --pilot [dir]  the registered test's pilot: its gate alone, no figure
 *   REG=1 node research/solver/reduce-couples-open.mjs --registered [dir] > research/solver/results-couples-open.txt
 *   node research/solver/reduce-couples-open.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalItem } from './reduce-phase4.mjs';
import { harmExact } from './reduce-share-rules.mjs';
import { cells } from './reduce-household.mjs';
import { keptSpend } from './reduce-household-hsp.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { ARMS, KEYS, SEED, W, N_DEFAULT, HELD, PILOT_N, REGISTRATION, PATHS_FILE, configOf, stampFilesHash } from './audit-couples-open.mjs';
import { CLASSES, WANT } from './couples-open-panel.mjs';
import { APP_POINTS } from '../../src/solverSettings.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const POOL_BAR = 0, SPEND_BAR = -0.05;
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])) });
export function loadDir(dir) {
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).map(x => { const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
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
/* ROUTE against APP over a class's units: each unit's harm (D34, in whole paths) and change; the class's pooled change and
   spending on the paths both keep, both by path */
export function compareClass(units) {
  const ns = [...new Set(units.map(u => u.N))];
  if (ns.length !== 1) throw new Error(`reduce-couples-open: the units run ${ns.join(', ')} paths, not one count`);
  const n = ns[0], rows = units.map(u => ({ id: u.id, variant: u.variant, route: u.route, cells: cells(u.arms.APP, u.arms.ROUTE), ...harmExact(u.arms.ROUTE, u.arms.APP, u.N) }));
  return { rows, pooled: survivalItem(units.map(u => [u.arms.ROUTE, u.arms.APP]), n), kept: keptSpend(units, 'APP', 'ROUTE', n) };
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
export const CLASS_NAMES = Object.freeze({ Y: 'the younger partner holding most', E: 'the elder holding more than 90%', S: 'the two the same age, outside 40% to 60%', G: 'more than three years apart with other taxable income', R: 'a shape the household plan refuses (today\'s route)' });
export function report(units, { registered = false } = {}) {
  const R = rule(units), out = [];
  for (const [k, r] of Object.entries(R)) {
    const p = r.parts;
    out.push(`CLASS ${k}, ${CLASS_NAMES[k]} (${r.C.rows.length} units): ${r.outcome}`);
    out.push(`  1. no harm by D34: ${p.harm ? 'HOLDS' : `FAILS on ${r.flagged.map(x => x.id).join(', ')}`}`);
    out.push(`  2. a gain: pooled survival ${iv(r.C.pooled)} points, by path, its lower end above ${POOL_BAR}: ${p.gain ? 'HOLDS' : 'FAILS'}`);
    out.push(`  3. spending on the paths both keep ${iv(r.C.kept, f4)}%, the units weighted equally, not below ${SPEND_BAR}%: ${p.spend ? 'HOLDS' : 'FAILS'}`);
    for (const row of r.C.rows) {
      const u = units.find(x => x.id === row.id), A = u.arms.APP, X = u.arms.ROUTE, kp = keptSpend([u], 'APP', 'ROUTE', u.N), cap = capped(sum(u.caps || []), A.pot, X.pot);
      out.push(`    ${row.id.padEnd(12)} ${row.route.padEnd(9)} APP ${surv(A).toFixed(2)}% ROUTE ${surv(X).toFixed(2)}%; ${row.lost} lost, ${row.saved} saved of ${row.n}, the threshold ${row.j} paths${row.flag ? ' FLAGGED' : ''}; spending on the paths both keep ${f4(kp.d)}%; the mean pot ${f3(pct(A.pot, X.pot))}%${cap ? `, capped ${f3(cap.pct)}% (${gbp(cap.gbp)} a path)` : ''}; lifetime tax ${f3(pct(A.tax, X.tax))}%`);
    }
  }
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
function unit(id, k, cls, app, route, { n = 2000, deliveredDrop = 0 } = {}) {
  const mk = (surv, drop) => ({ config: null, survived: Uint8Array.from({ length: n }, (_, i) => (surv(i) ? 1 : 0)), failYear: new Int16Array(n), pot: new Float64Array(n).fill(1e5), estate: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n).fill(100 - drop), unmet: new Float64Array(n), cpuUs: n * 1000, solveSecs: 1 });
  return { id, k, cls, variant: cls === 'G' ? 'G8' : 'Y75', route: cls === 'R' ? 'today' : 'household', N: n, seed: SEED, pts: APP_POINTS, W, stamp: { code: 'c', audit: 'a', node: 'v' }, guard: { on: false, why: cls === 'G' ? 'gapincome' : 'uneven' }, caps: [5e4, 0], arms: { APP: mk(app, 0), ROUTE: mk(route, deliveredDrop) } };
}
function planted() {
  const cases = [], n = 2000;
  const base = i => i % 10 !== 0;                                     // APP survives 90%
  const gain = i => i % 10 !== 0 || i % 20 === 0;                       // ROUTE saves half the paths APP loses: +5 points
  const harm = i => i % 10 !== 0 && i % 7 !== 0;                        // ROUTE loses about 13 points more
  const same = i => i % 10 !== 0;
  { const R = rule([unit('a', 0, 'Y', base, gain), unit('b', 1, 'Y', base, gain)]);
    cases.push(['a class gaining on every unit opens', `${R.Y.outcome} ${R.Y.parts.harm} ${R.Y.parts.gain} ${R.Y.parts.spend}`, 'OPENS true true true']); }
  { const R = rule([unit('a', 0, 'Y', base, gain), unit('b', 1, 'Y', base, harm)]);
    cases.push(['a class with one harmed unit stays, the unit named', `${R.Y.outcome} ${R.Y.flagged.map(x => x.id).join(',')}`, 'STAYS b']); }
  { const R = rule([unit('a', 0, 'E', base, same), unit('b', 1, 'E', base, same)]);
    cases.push(['a class with no gain stays on part 2 alone', `${R.E.outcome} ${R.E.parts.harm} ${R.E.parts.gain}`, 'STAYS true false']); }
  { const R = rule([unit('a', 0, 'S', base, gain, { deliveredDrop: 1 }), unit('b', 1, 'S', base, gain, { deliveredDrop: 1 })]);
    cases.push(['a class spending 1% less on the paths both keep stays on part 3', `${R.S.outcome} ${R.S.parts.spend}`, 'STAYS false']); }
  { const R = rule([unit('a', 0, 'Y', base, gain), unit('g', 1, 'G', base, harm), unit('r', 2, 'R', base, gain)]);
    cases.push(['each class read on its own units', `${R.Y.outcome} ${R.G.outcome} ${R.R.outcome}`, 'OPENS STAYS OPENS']); }
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
      ['an array not one a path', us => { us[0].arms.APP.tax = new Float64Array(3); return us; }, /tax not one a path/]
    ];
    const missed = faults.filter(([, f, re]) => !gate(f(ok()), want, { n, audit: 'a', logs: null }).some(x => re.test(x))).map(([nm]) => nm);
    const logMiss = gate(ok(), want, { n, audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }) } }).some(x => /b: no launch log/.test(x));
    const logDone = gate(ok(), want, { n, audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }), 'case1.txt': log({ id: 'b', k: 1 }, false) } }).some(x => /b: its launch log does not name it or has no done line/.test(x));
    cases.push([`the gate: every refusal on its planted fault (${faults.length + 2})`, missed.join(', ') + (logMiss ? '' : ' log missing') + (logDone ? '' : ' no done line') || 'all fire', 'all fire']); }
  let bad = 0;
  for (const [nm, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const PILOT = args.includes('--pilot'), REGISTERED = args.includes('--registered');
  // the pilot and the registered read take the registered panel (REG=1, so the stamp's data files are its)
  if ((PILOT || REGISTERED) !== (process.env.REG === '1')) { console.error(`reduce-couples-open: ${PILOT ? '--pilot' : REGISTERED ? '--registered' : 'the dress rehearsal'} reads ${PILOT || REGISTERED ? 'with' : 'without'} REG=1`); process.exit(2); }
  const seed = REGISTERED ? HELD : SEED;
  const DIR = args.find(a => !a.startsWith('--')) || join(HERE, 'results', REGISTERED ? 'couples-open-run' : PILOT ? 'couples-open-pilot' : `couples-open-${SEED}`);
  if (!existsSync(DIR)) { console.error(`reduce-couples-open: no ${DIR}`); process.exit(2); }
  const { readOpenPanel } = await import('./couples-open-panel.mjs');
  const smoke = args.includes('--smoke'), units = loadDir(DIR).sort((a, b) => a.k - b.k), panel = readOpenPanel().map(u => ({ id: u.id, route: u.route }));
  const want = smoke ? panel.filter(w => units.some(u => u.id === w.id)) : panel;
  const logs = Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')]));
  const n = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')).N : PILOT ? PILOT_N : N_DEFAULT;
  console.log(`THE GUARD'S OWN UNITS, ${REGISTERED ? `THE REGISTERED TEST (${REGISTRATION})` : PILOT ? 'THE REGISTERED TEST\'S PILOT (EXPLORATORY; its gate alone)' : 'THE DRESS REHEARSAL (EXPLORATORY; COUPLES-OPEN.md step 1)'}: ${units.length} units from ${DIR.replace(/.*research\/solver\//, '')}, seed ${seed}${smoke ? ', a smoke' : ''}`);
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
