/*
 * EVERY COUPLE ON THE SOLVER, THE DRESS REHEARSAL'S READ (COUPLES-ANY.md amendment 2; EXPLORATORY, the tuning seed 7002; read
 * once, by its rule, which is the registered test's to come). The stamps first (fair-gate.mjs requireFairLogs: every log stamped
 * by the launcher, PREDICTION none), then the gate: every unit of couples-any-panel.json there with both arms (APP, ROUTE); one
 * code, audit, seed, Node version, count of paths and points; each arm at its configuration (audit-couples-any.mjs configOf),
 * every array one a path; each record's class, variant, kind and holding the panel's, its shape as the panel requires
 * (couples-any-panel.mjs unitProblems on the shape the unit recorded as it ran); ROUTE on the page's own context; each unit's
 * own launch log with its done line.
 * Then the rule, ROUTE against APP, for each class W, R, L and P on its own (D141's rule, as COUPLES-OPEN's read:
 * reduce-couples-open.mjs compareClass, APP the base):
 *   1. NO HARM: no unit of the class flagged by D34's harm rule, compared in whole paths;
 *   2. A GAIN: the class's pooled survival change with its 95% interval's lower end above nought, the interval by path;
 *   3. SPENDING: the class's pooled spending delivered on the paths both keep, the units weighted equally, its point not lower
 *      than -0.05%.
 * A class passing all three PASSES and goes to the registered test; otherwise it goes to the maintainer with its units, W at
 * once (it is on by default since D146). W is read only once the page's route is held to the audit's on W's units path for
 * path (COUPLES-ANY.md, the test's class W; couples-any-port-identity.mjs, its results file naming this run's stamp).
 * N (nobody retiring) is reported, not read (amendment 2): both arms survive every path by construction, so its units are
 * given with their survival, pot, tax and spending, and whether C opens goes to the maintainer with the read.
 * Beside, deciding nothing: each unit's survival under both arms, its change and harm threshold, its spending on the paths both
 * keep and over all paths, the mean pot left (uncapped and capped at the route's estate cap), lifetime tax, each arm's MPAA
 * ages; R by its parts (the wrapper, the profiles apart, who is the safer); spending over all paths below beyond noise; M1 by
 * unit; the times.
 *   node research/solver/reduce-couples-any.mjs [dir] > research/solver/results-couples-any-rehearsal.txt
 *   node research/solver/reduce-couples-any.mjs --smoke [dir]     a smoke's gate and the rule's run, no figure printed
 *   node research/solver/reduce-couples-any.mjs --planted
 * THE REGISTERED TEST (registrations/couples-any.md; REG=1, the registered panel: W, R, L and P on four couples no run has
 * used): the stamps against the registration's git blob (requireFairLogs), the same gate at seed HELD and couples-any-paths.json's
 * paths, the same rule, W read only with its identity on the registered run (results-couples-any-registered-port-identity.txt,
 * naming the run's stamp); its outcomes the registration's: a class passing opens by its own change of default (the reviewer and
 * B1's gate), W passing stays on by default (D146); a class failing keeps today's handling and goes to the maintainer with its
 * units, W at once:
 *   REG=1 node research/solver/reduce-couples-any.mjs --pilot [dir]       the pilot's gate alone (EXPLORATORY), no figure printed
 *   REG=1 node research/solver/reduce-couples-any.mjs --registered [dir] > research/solver/results-couples-any-registered.txt
 *     read once, by its rule, after the identity
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalItem } from './reduce-phase4.mjs';
import { keptSpend } from './reduce-household-hsp.mjs';
import { cells } from './reduce-household.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { loadDir, compareClass, m1ByUnit, allSpendOf } from './reduce-couples-open.mjs';
import { ARMS, KEYS, SEED, W, N_DEFAULT, ROUTE_CTX, configOf, stampFilesHash, HELD, PILOT_N, REGISTRATION, PATHS_FILE } from './audit-couples-any.mjs';
import { READ_CLASSES, VARIANTS, R_KINDS, APART, unitProblems as panelProblems } from './couples-any-panel.mjs';
import { APP_POINTS } from '../../src/solverSettings.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const POOL_BAR = 0, SPEND_BAR = -0.05;
export const IDENTITY_FILE = join(HERE, process.env.REG === '1' ? 'results-couples-any-registered-port-identity.txt' : 'results-couples-any-port-identity.txt');
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const pct = (b, x) => { const sb = sum(b), sx = sum(x); return sb > 0 ? 100 * (sx / sb - 1) : 0; };
const capped = (cap, b, x) => { if (!(cap > 0)) return null; let sb = 0, sx = 0; for (let i = 0; i < b.length; i++) { sb += Math.min(b[i], cap); sx += Math.min(x[i], cap); } return { pct: sb > 0 ? 100 * (sx / sb - 1) : 0, gbp: (sx - sb) / b.length }; };
const surv = A => (100 * sum(A.survived)) / A.survived.length;
const median = a => { const s = [...a].sort((p, q) => p - q), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

/* the gate: refusals, each a line. `want` the panel's units ({ id, cls, variant, kind, hold }); `logs` file -> text, or null */
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
    if (w && (u.cls !== w.cls || u.variant !== w.variant || u.kind !== w.kind || u.hold !== w.hold)) P.push(`${u.id}: class ${u.cls}, variant ${u.variant}, kind ${u.kind} and holding ${u.hold}, not the panel's ${w.cls}, ${w.variant}, ${w.kind} and ${w.hold}`);
    if (!VARIANTS[u.variant]) P.push(`${u.id}: no variant '${u.variant}'`);
    else if (!u.shape) P.push(`${u.id}: its shape unrecorded`);
    else { const bad = panelProblems(u.variant, { landed: u.cls !== 'N', shape: u.shape }); if (bad.length) P.push(`${u.id}: its shape as it ran not the panel's: ${bad.join('; ')}`); }
    if (u.routeCtx !== ROUTE_CTX) P.push(`${u.id}: ROUTE's context '${u.routeCtx}', not the page's ('${ROUTE_CTX}')`);
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
/* W's identity (COUPLES-ANY.md, the test's class W): the page's route held to the audit's on every W unit, path for path, on this
   run (its results file's header naming the units' code and audit, each W unit IDENTICAL and the count whole), or why not */
export function identityOf(text, units) {
  const ws = units.filter(u => u.cls === 'W');
  if (!ws.length) return { ok: true, why: null };
  if (text === null) return { ok: false, why: 'no identity file' };
  const u0 = ws[0], head = text.split('\n')[0] || '', run = `code ${u0.stamp.code} audit ${u0.stamp.audit}`;
  if (!head.includes(`stamp ${run},`)) return { ok: false, why: `the identity file names another run (${head.slice(0, 140)})` };
  // the identity script is under the run's stamp (audit-couples-any.mjs STAMP_ROOTS), and its header names the tree it ran on:
  // that tree's code and audit stamp the run's, so it ran on the launch tree (the design review's finding 4)
  if (!head.includes(`; this tree: ${run};`)) return { ok: false, why: `the identity ran on another tree than the run's (${(head.match(/this tree: [^;]*/) || ['no tree named'])[0]})` };
  const missing = ws.filter(u => !new RegExp(`^${u.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} +IDENTICAL;`, 'm').test(text)).map(u => u.id);
  if (missing.length) return { ok: false, why: `not IDENTICAL on ${missing.join(', ')}` };
  if (!new RegExp(`^${ws.length} of ${ws.length} units IDENTICAL$`, 'm').test(text)) return { ok: false, why: `its count is not ${ws.length} of ${ws.length}` };
  return { ok: true, why: null };
}
/* the rule, each class read on its own (N never read); W unread without its identity */
export function rule(units, identity = { ok: true, why: null }) {
  return Object.fromEntries(READ_CLASSES.filter(k => units.some(u => u.cls === k)).map(k => {
    const C = compareClass(units.filter(u => u.cls === k)), flagged = C.rows.filter(r => r.flag);
    const parts = { harm: flagged.length === 0, gain: C.pooled.lo > POOL_BAR, spend: C.kept.d >= SPEND_BAR };
    const outcome = k === 'W' && !identity.ok ? 'NOT READ' : parts.harm && parts.gain && parts.spend ? 'PASSES' : 'FAILS';
    return [k, { C, flagged, parts, outcome }];
  }));
}
export const CLASS_NAMES = Object.freeze({
  W: 'step 4\'s shapes (contributions to one wrapper growing at different rates, a cash ISA paid into, a later retiree paid and saving in plan year 0), taken by default since D146',
  R: APART ? 'the pension or the ISA held by the two at different risks, four and five profiles apart on the six levels, each way (COUPLES-APART.md)'
    : 'the pension or the ISA held by the two at different risks, one to three profiles apart, each way (A\'s \'risks\')',
  L: 'the partner\'s own limits differing from the first person\'s (A\'s \'limits\')',
  P: 'two salaries growing at different rates (B\'s \'salaries\')',
  N: 'nobody retiring within the plan (C\'s \'noretire\')'
});
const unitLine = u => {
  const A = u.arms.APP, X = u.arms.ROUTE, c = cells(A, X), kp = keptSpend([u], 'APP', 'ROUTE', u.N), al = allSpendOf(u), cap = capped(sum(u.caps || []), A.pot, X.pot);
  return `${u.id.padEnd(16)} APP ${surv(A).toFixed(2)}% ROUTE ${surv(X).toFixed(2)}%; ${c.lost} lost, ${c.saved} saved of ${u.N}; spending on the paths both keep ${f4(kp.d)}%, over all paths ${iv(al, f4)}%; the mean pot ${f3(pct(A.pot, X.pot))}%${cap ? `, capped ${f3(cap.pct)}% (${gbp(cap.gbp)} a path)` : ''}; lifetime tax ${f3(pct(A.tax, X.tax))}% (APP ${gbp(sum(A.tax) / A.tax.length)}, ROUTE ${gbp(sum(X.tax) / X.tax.length)} a path)${u.tierMap ? '; the tier map' : ''}${u.mpaa ? `; MPAA ages APP ${u.mpaa.APP.join('/')}, ROUTE ${u.mpaa.ROUTE.join('/')}` : ''}`;
};
/* R by its parts (beside, deciding nothing): pooled survival and spending on the paths both keep, by path */
export function rParts(units) {
  const rs = units.filter(u => u.cls === 'R'), out = [];
  if (!rs.length) return out;
  const kindOf = u => R_KINDS[u.kind];
  const groups = [
    ...['pen', 'isa'].map(w => [`the ${w === 'pen' ? 'pension' : 'ISA'} apart`, u => kindOf(u).wrap === w]),
    ...(APART ? [4, 5] : [1, 2, 3]).map(n => [`${n} profile${n > 1 ? 's' : ''} apart`, u => kindOf(u).apart === n]),
    ['the first person the safer', u => kindOf(u).safer === 'self'], ['the partner the safer', u => kindOf(u).safer === 'part'],
    ['the elder holding 60%', u => u.hold === 'own'], ['the younger holding 75%', u => u.hold === 'Y75']
  ];
  for (const [name, f] of groups) {
    const g = rs.filter(f);
    if (!g.length) { out.push(`    ${name}: no units`); continue; }
    const n = g[0].N;
    out.push(`    ${name} (${g.length} units): pooled survival ${iv(survivalItem(g.map(u => [u.arms.ROUTE, u.arms.APP]), n))} points; spending on the paths both keep ${iv(keptSpend(g, 'APP', 'ROUTE', n), f4)}%`);
  }
  return out;
}
export function report(units, { identity = { ok: true, why: null }, registered = false } = {}) {
  const R = rule(units, identity), out = [];
  for (const [k, r] of Object.entries(R)) {
    const p = r.parts;
    out.push(`CLASS ${k}, ${CLASS_NAMES[k]} (${r.C.rows.length} units): ${r.outcome}${r.outcome === 'NOT READ' ? ` (the page's route not held to the audit's on its units: ${identity.why})` : ''}`);
    if (r.outcome !== 'NOT READ') {
      out.push(`  1. no harm by D34: ${p.harm ? 'HOLDS' : `FAILS on ${r.flagged.map(x => x.id).join(', ')}`}`);
      out.push(`  2. a gain: pooled survival ${iv(r.C.pooled)} points, by path, its lower end above ${POOL_BAR}: ${p.gain ? 'HOLDS' : 'FAILS'}`);
      out.push(`  3. spending on the paths both keep ${iv(r.C.kept, f4)}%, the units weighted equally, not below ${SPEND_BAR}%: ${p.spend ? 'HOLDS' : 'FAILS'}`);
      out.push(`     beside, not a bar: spending over all paths ${iv(r.C.all, f4)}%, the units weighted equally`);
      if (k === 'W') out.push(`     the page's route held to the audit's on its ${r.C.rows.length} units path for path (${IDENTITY_FILE.replace(/.*\//, '')})`);
    }
    for (const row of r.C.rows) out.push(`    ${unitLine(units.find(x => x.id === row.id))}; the threshold ${row.j} paths${row.flag ? ' FLAGGED' : ''}`);
    if (k === 'R') { out.push('  beside, not a bar: R by its parts'); out.push(...rParts(units)); }
  }
  const ns = units.filter(u => u.cls === 'N');
  if (ns.length) {
    out.push(`CLASS N, ${CLASS_NAMES.N} (${ns.length} units): REPORTED, NOT READ (amendment 2: nothing is spent from the pots before the first retirement, so both arms survive every path; whether C opens by inference from its exactness, or not at all, goes to the maintainer with the read)`);
    for (const u of ns) out.push(`    ${unitLine(u)}`);
  }
  const below = units.map(u => ({ id: u.id, al: allSpendOf(u) })).filter(x => x.al.hi < 0);
  out.push(`SPENDING OVER ALL PATHS (beside, not a bar): units where ROUTE delivers less lifetime spending than APP beyond noise: ${below.length ? below.map(x => `${x.id} ${iv(x.al, f4)}%`).join('; ') : 'none'}`);
  const m1 = m1ByUnit(units.filter(u => u.cls !== 'N')).filter(x => x.named);
  out.push(`M1 by unit (D116; named, not a bar): ${m1.length ? m1.map(x => `${x.id} (${x.net} paths kept net; spending on the paths both keep ${iv(x.kept, f4)}%, over all paths ${f3(x.all)}%; the pot capped ${x.cap ? `${f3(x.cap.pct)}% (${gbp(x.cap.gbp)} a path)` : 'no cap'})`).join('; ') : 'none: no unit keeps more paths and spends less on the paths both keep beyond noise'}`);
  const pass = Object.entries(R).filter(([, r]) => r.outcome === 'PASSES').map(([k]) => k), fail = Object.entries(R).filter(([, r]) => r.outcome === 'FAILS').map(([k]) => k), unread = Object.entries(R).filter(([, r]) => r.outcome === 'NOT READ').map(([k]) => k);
  const and = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0]);
  // the registered read's outcomes (registrations/couples-any.md): a class passing opens by its own change of default, but L only
  // with R (its units take R's way for the pension their limits hold apart); W passing stays on (D146); a class failing keeps
  // today's handling and goes to the maintainer with its units; W failing, its handling today the household route (D146), goes
  // to the maintainer at once; W not read goes to the maintainer. The rehearsal's wording (registered false) as it was
  const lHeld = registered && pass.includes('L') && !pass.includes('R');
  const opens = pass.filter(k => k !== 'W' && !(k === 'L' && lHeld));
  const passTxt = !pass.length ? 'no class passes' : !registered ? `${and(pass)} ${pass.length > 1 ? 'pass and go' : 'passes and goes'} to the registered test`
    : [opens.length ? `${and(opens)} ${opens.length > 1 ? 'pass, each opening by its own' : 'passes, opening by its own'} change of default (the reviewer and B1's gate)` : null,
      lHeld ? 'L passes but opens only with R, which does not pass, so L goes to the maintainer with its units and R\'s' : null,
      pass.includes('W') ? 'W passes and stays on by default (D146)' : null].filter(Boolean).join('; ');
  const failOthers = fail.filter(k => k !== 'W');
  const failTxt = !fail.length ? '' : !registered ? `; ${and(fail)} ${fail.length > 1 ? 'do' : 'does'} not, and ${fail.length > 1 ? 'go' : 'goes'} to the maintainer with ${fail.length > 1 ? 'their' : 'its'} units${fail.includes('W') ? ', W at once (on by default since D146)' : ''}`
    : `${failOthers.length ? `; ${and(failOthers)} ${failOthers.length > 1 ? 'do not, keep' : 'does not, keeps'} today's handling (today's route inside the guard before D143, the app's rules outside it) and ${failOthers.length > 1 ? 'go' : 'goes'} to the maintainer with ${failOthers.length > 1 ? 'their' : 'its'} units` : ''}${fail.includes('W') ? '; W does not, and goes to the maintainer at once with its units (on by default since D146, its handling today the household route)' : ''}`;
  const unreadTxt = !unread.length ? '' : `; ${and(unread)} not read (its identity not shown)${registered ? ` and ${unread.length > 1 ? 'go' : 'goes'} to the maintainer` : ''}`;
  // under a pass, each unit M1 names goes to the maintainer with the read before any default changes (the registration's M1)
  const clsOf = Object.fromEntries(units.map(u => [u.id, u.cls])), m1Pass = registered ? m1.filter(x => pass.includes(clsOf[x.id])).map(x => x.id) : [];
  const m1Txt = m1Pass.length ? `; the read going to the maintainer first with the units M1 names (${m1Pass.join(', ')}), before any default changes` : '';
  out.push(`OUTCOME: ${passTxt}${m1Txt}${failTxt}${unreadTxt}${ns.length ? '; N reported, not read' : ''}${registered ? ` (the registered read: ${REGISTRATION})` : ' (EXPLORATORY: nothing opens on this read; the registered test reads by this rule)'}`);
  const t = u => (u.arms.ROUTE.cpuUs / u.N / 1e3), ta = u => (u.arms.APP.cpuUs / u.N / 1e3);
  out.push(`beside: a path's CPU, APP the median ${median(units.map(ta)).toFixed(1)} ms, ROUTE ${median(units.map(t)).toFixed(1)} ms; ROUTE's solve the median ${median(units.map(u => u.arms.ROUTE.solveSecs)).toFixed(0)} s`);
  return { R, out };
}

/* planted units: each arm's survival as given, path by path */
const VAR_OF = { W: 'Wg-own', R: 'Rp2t-own', L: 'L-own', P: 'P-own', N: 'N-own' };
const WITHOUT_OF = { W: 'householdPlanFor: the contributions grow at different rates', R: 'householdPlanFor: the two hold one wrapper at different risks', L: 'householdPlanFor: the partner\'s own limits differ', P: 'householdPlanFor: the two salaries grow at different rates', N: 'householdPlanFor: nobody retires within the plan' };
const shapeFor = cls => ({ withAll: null, without: WITHOUT_OF[cls], guard: cls === 'W' ? { on: true, why: null, route: 'household' } : { on: false, why: 'shape', route: null } });
function unit(id, k, cls, app, route, { n = 2000, deliveredDrop = 0 } = {}) {
  const mk = (surv, drop) => ({ config: null, survived: Uint8Array.from({ length: n }, (_, i) => (surv(i) ? 1 : 0)), failYear: new Int16Array(n), pot: new Float64Array(n).fill(1e5), estate: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n).fill(100 - drop), unmet: new Float64Array(n), cpuUs: n * 1000, solveSecs: 1 });
  const variant = VAR_OF[cls], V = VARIANTS[variant];
  return { id, k, cls, variant, kind: V.kind, hold: V.hold, N: n, seed: SEED, pts: APP_POINTS, W, stamp: { code: 'c', audit: 'a', node: 'v' }, shape: shapeFor(cls), routeCtx: ROUTE_CTX, caps: [5e4, 0], arms: { APP: mk(app, 0), ROUTE: mk(route, deliveredDrop) } };
}
function planted() {
  const cases = [], n = 2000;
  const base = i => i % 10 !== 0;                                     // APP survives 90%
  const gain = i => i % 10 !== 0 || i % 20 === 0;                       // ROUTE saves half the paths APP loses: +5 points
  const harm = i => i % 10 !== 0 && i % 7 !== 0;                        // ROUTE loses about 13 points more
  const same = i => i % 10 !== 0;
  const thin = i => (i % 10 !== 0 && i % 80 !== 1) || i % 60 === 0;   // +0.45 points, within noise
  { const R = rule([unit('a', 0, 'R', base, gain), unit('b', 1, 'R', base, gain)]);
    cases.push(['a class gaining on every unit passes', `${R.R.outcome} ${R.R.parts.harm} ${R.R.parts.gain} ${R.R.parts.spend}`, 'PASSES true true true']); }
  { const R = rule([unit('a', 0, 'R', base, gain), unit('b', 1, 'R', base, harm)]);
    cases.push(['a class with one harmed unit fails, the unit named', `${R.R.outcome} ${R.R.flagged.map(x => x.id).join(',')}`, 'FAILS b']); }
  { const R = rule([unit('a', 0, 'L', base, same), unit('b', 1, 'L', base, same)]);
    cases.push(['a class with no gain fails on part 2 alone', `${R.L.outcome} ${R.L.parts.harm} ${R.L.parts.gain} ${R.L.parts.spend}`, 'FAILS true false true']); }
  { const R = rule([unit('a', 0, 'P', base, gain, { deliveredDrop: 1 }), unit('b', 1, 'P', base, gain, { deliveredDrop: 1 })]);
    cases.push(['a class spending 1% less on the paths both keep fails on part 3', `${R.P.outcome} ${R.P.parts.spend}`, 'FAILS false']); }
  { const R = rule([unit('a', 0, 'L', base, thin), unit('b', 1, 'L', base, thin)]), c = R.L.C.pooled;
    cases.push(['part 2: a pooled gain above nought whose interval reaches below it fails on part 2', `${R.L.outcome} ${c.d > 0} ${c.lo < 0} ${R.L.parts.gain}`, 'FAILS true true false']); }
  { const R6 = rule([unit('a', 0, 'P', base, gain, { deliveredDrop: 0.06 }), unit('b', 1, 'P', base, gain, { deliveredDrop: 0.06 })]), R4 = rule([unit('a', 0, 'P', base, gain, { deliveredDrop: 0.04 }), unit('b', 1, 'P', base, gain, { deliveredDrop: 0.04 })]);
    cases.push(['part 3 at its bar: -0.06% on the paths both keep fails, -0.04% passes', `${R6.P.C.kept.d.toFixed(3)} ${R6.P.outcome} ${R4.P.C.kept.d.toFixed(3)} ${R4.P.outcome}`, '-0.060 FAILS -0.040 PASSES']); }
  { const R = rule([unit('w', 0, 'W', base, gain), unit('r', 1, 'R', base, harm), unit('l', 2, 'L', base, gain), unit('p', 3, 'P', base, harm), unit('nn', 4, 'N', base, harm)]);
    cases.push(['each class read on its own units, N never read', `${R.W.outcome} ${R.R.outcome} ${R.L.outcome} ${R.P.outcome} ${'N' in R}`, 'PASSES FAILS PASSES FAILS false']); }
  { const r = report([unit('w', 0, 'W', base, gain), unit('r', 1, 'R', base, harm)]).out.find(l => l.startsWith('OUTCOME'));
    cases.push(['W passing and R failing: R to the maintainer, W to the registered test', /^OUTCOME: W passes and goes to the registered test; R does not, and goes to the maintainer with its units \(/.test(r) ? 'as said' : r, 'as said']); }
  { const r = report([unit('w', 0, 'W', base, harm), unit('r', 1, 'R', base, gain)]).out.find(l => l.startsWith('OUTCOME'));
    cases.push(['W failing goes to the maintainer at once', /W does not, and goes to the maintainer with its units, W at once/.test(r) ? 'at once' : r, 'at once']); }
  // the registered read's outcomes (registrations/couples-any.md): opening by a change of default, W staying on, a failing class
  // keeping today's handling, W failing to the maintainer at once, L opening only with R
  { const r1 = report([unit('w', 0, 'W', base, gain), unit('r', 1, 'R', base, gain), unit('l', 2, 'L', base, gain)], { registered: true }).out.find(l => l.startsWith('OUTCOME'));
    const r2 = report([unit('w', 0, 'W', base, harm), unit('p', 1, 'P', base, gain), unit('r', 2, 'R', base, harm)], { registered: true }).out.find(l => l.startsWith('OUTCOME'));
    const ok1 = r1 === 'OUTCOME: R and L pass, each opening by its own change of default (the reviewer and B1\'s gate); W passes and stays on by default (D146) (the registered read: research/solver/registrations/couples-any.md)';
    const ok2 = r2 === 'OUTCOME: P passes, opening by its own change of default (the reviewer and B1\'s gate); R does not, keeps today\'s handling (today\'s route inside the guard before D143, the app\'s rules outside it) and goes to the maintainer with its units; W does not, and goes to the maintainer at once with its units (on by default since D146, its handling today the household route) (the registered read: research/solver/registrations/couples-any.md)';
    cases.push(['the registered read\'s outcomes: R and L open, W stays on; R failing keeps today\'s handling; W failing goes at once, not to today\'s two routes', `${ok1} ${ok2}`, 'true true']); }
  { const r3 = report([unit('r', 0, 'R', base, harm), unit('l', 1, 'L', base, gain), unit('p', 2, 'P', base, gain)], { registered: true }).out.find(l => l.startsWith('OUTCOME'));
    const r4 = report([unit('r', 0, 'R', base, gain), unit('l', 1, 'L', base, harm)], { registered: true }).out.find(l => l.startsWith('OUTCOME'));
    const ok3 = r3 === 'OUTCOME: P passes, opening by its own change of default (the reviewer and B1\'s gate); L passes but opens only with R, which does not pass, so L goes to the maintainer with its units and R\'s; R does not, keeps today\'s handling (today\'s route inside the guard before D143, the app\'s rules outside it) and goes to the maintainer with its units (the registered read: research/solver/registrations/couples-any.md)';
    const ok4 = /^OUTCOME: R passes, opening by its own change of default \(the reviewer and B1's gate\); L does not, keeps today's handling /.test(r4);
    cases.push(['L opens only with R: L passing with R failing goes to the maintainer; R passing with L failing opens R alone', `${ok3} ${ok4}`, 'true true']); }
  { const us = [unit('a', 0, 'R', base, gain, { deliveredDrop: 0.04 }), unit('b', 1, 'R', base, gain)], R = rule(us);
    const reg = report(us, { registered: true }).out.find(l => l.startsWith('OUTCOME')), exp = report(us).out.find(l => l.startsWith('OUTCOME'));
    cases.push(['a pass with a unit M1 names: the registered read goes to the maintainer first with it, the rehearsal\'s wording as it was', `${R.R.outcome} ${reg === 'OUTCOME: R passes, opening by its own change of default (the reviewer and B1\'s gate); the read going to the maintainer first with the units M1 names (a), before any default changes (the registered read: research/solver/registrations/couples-any.md)'} ${exp === 'OUTCOME: R passes and goes to the registered test (EXPLORATORY: nothing opens on this read; the registered test reads by this rule)'}`, 'PASSES true true']); }
  { const us = [unit('w', 0, 'W', base, gain), unit('r', 1, 'R', base, gain)], reg = report(us, { registered: true, identity: { ok: false, why: 'no identity file' } }).out.find(l => l.startsWith('OUTCOME'));
    cases.push(['W not read under the registration goes to the maintainer', reg === 'OUTCOME: R passes, opening by its own change of default (the reviewer and B1\'s gate); W not read (its identity not shown) and goes to the maintainer (the registered read: research/solver/registrations/couples-any.md)' ? 'to the maintainer' : reg, 'to the maintainer']); }
  // W's identity: read with it, not read without it, nor on another run's, nor with a unit not identical
  { const us = [unit('w1', 0, 'W', base, gain), unit('w2', 1, 'W', base, gain)], head = 'EVERY COUPLE ON THE SOLVER, W\'S IDENTITY (EXPLORATORY): the rehearsal\'s units, stamp code c audit a, against its ROUTE arrays; this tree: code c audit a; the couples\' form';
    const good = `${head}\nw1         IDENTICAL; ...\nw2         IDENTICAL; ...\n2 of 2 units IDENTICAL\n`;
    const reads = [good, null, good.replace('stamp code c audit a', 'stamp code c audit q'), good.replace('w2         IDENTICAL', 'w2         DIFFERS'), good.replace('2 of 2 units', '1 of 2 units')].map(t => rule(us, identityOf(t, us)).W.outcome).join(' ');
    cases.push(['W read with its identity, not without it, nor on another run\'s, nor with a unit differing, nor with a short count', reads, 'PASSES NOT READ NOT READ NOT READ NOT READ']);
    const trees = [good.replace('this tree: code c audit a', 'this tree: code c audit q'), good.replace('this tree: code c audit a', 'this tree: code d audit a'), good.replace('; this tree: code c audit a', '')].map(t => `${rule(us, identityOf(t, us)).W.outcome} (${identityOf(t, us).why})`).join(' | ');
    cases.push(['W not read where its identity ran on another tree than the run\'s (its audit stamp or its code), or names no tree', trees, 'NOT READ (the identity ran on another tree than the run\'s (this tree: code c audit q)) | NOT READ (the identity ran on another tree than the run\'s (this tree: code d audit a)) | NOT READ (the identity ran on another tree than the run\'s (no tree named))']);
    cases.push(['no W unit, no identity needed', `${identityOf(null, [unit('r', 0, 'R', base, gain)]).ok}`, 'true']); }
  // N reported: its lines printed, never a class outcome; spending beside; M1 by unit
  { const r = report([unit('r', 0, 'R', base, gain), unit('nn', 1, 'N', base, base)]).out;
    cases.push(['N reported with its units, not read', `${r.some(l => /^CLASS N, .*REPORTED, NOT READ/.test(l))} ${r.some(l => /^ +nn +APP 90\.00% ROUTE 90\.00%/.test(l))} ${/N reported, not read/.test(r.find(l => l.startsWith('OUTCOME')))}`, 'true true true']); }
  { const r = report([unit('a', 0, 'R', base, gain, { deliveredDrop: 1 }), unit('b', 1, 'R', base, gain)]).out.find(l => l.startsWith('SPENDING OVER ALL PATHS'));
    cases.push(['spending over all paths: a unit 1% below on every path named, one level not', /: a -1\.0000 /.test(r) && !/ b [-+]/.test(r) ? 'a' : r.slice(0, 120), 'a']); }
  { const M = m1ByUnit([unit('a', 0, 'R', base, gain, { deliveredDrop: 1 }), unit('b', 1, 'R', base, gain)]);
    cases.push(['M1 by unit: a unit keeping more paths but spending 1% less on the paths both keep named, one spending the same not', M.filter(x => x.named).map(x => x.id).join(','), 'a']); }
  { const us = Object.keys(R_KINDS).map((kd, i) => { const u = unit(`r${i}`, i, 'R', base, gain); u.kind = kd; u.variant = `${kd}-own`; return u; });
    const r = rParts(us);
    cases.push(['R by its parts: each group its units (6 a wrapper, 4 a step apart, 6 a way, 12 at the one holding planted)', r.map(l => (l.match(/\((\d+) units\)/) || [, 'none'])[1]).join(','), '6,6,4,4,4,6,6,12,none']); }
  // the gate: every refusal on its planted fault
  { const want = [{ id: 'a', cls: 'R', variant: 'Rp2t-own', kind: 'Rp2t', hold: 'own' }, { id: 'b', cls: 'R', variant: 'Rp2t-own', kind: 'Rp2t', hold: 'own' }];
    const ok = () => { const us = [unit('a', 0, 'R', base, gain), unit('b', 1, 'R', base, gain)]; for (const u of us) for (const a of ARMS) u.arms[a].config = configOf(a); return us; };
    const log = (u, done = true) => `stamp: code c audit a prediction NOT-LAUNCHED sha -\nEVERY COUPLE ON THE SOLVER: unit ${u.k}/2: ${u.id} (class R)\n${done ? `        done unit ${u.k} secs 1\n` : ''}`;
    const clean = gate(ok(), want, { n, audit: 'a', logs: { 'case0.txt': log({ id: 'a', k: 0 }), 'case1.txt': log({ id: 'b', k: 1 }) } });
    cases.push(['the gate: two clean units pass', clean.join('; '), '']);
    const faults = [
      ['a unit missing', us => us.slice(1), /a: missing/],
      ['a unit not of the read', us => [...us, { ...us[0], id: 'z', k: 2 }], /z: not a unit of the read/],
      ['another code', us => { us[1].stamp = { ...us[1].stamp, code: 'd' }; return us; }, /more than one code/],
      ['another Node version', us => { us[1].stamp = { ...us[1].stamp, node: 'w' }; return us; }, /more than one Node version/],
      ['another seed', us => { us[0].seed = 7001; return us; }, /seed 7001/],
      ['another count of paths', us => { us[0].N = 1000; return us; }, /1000 paths/],
      ['another count of points', us => { us[0].pts = 30; return us; }, /a: 30 points/],
      ['another estate weight', us => { us[0].W = 0.01; return us; }, /estate weight 0\.01/],
      ['a record\'s kind not the panel\'s', us => { us[0].kind = 'Rp1t'; return us; }, /a: class R, variant Rp2t-own, kind Rp1t and holding own, not the panel's/],
      ['a record\'s holding not the panel\'s', us => { us[0].hold = 'Y75'; return us; }, /holding Y75, not the panel's/],
      ['its shape unrecorded', us => { delete us[0].shape; return us; }, /a: its shape unrecorded/],
      ['its shape as it ran refused by the panel (the guard on the household route)', us => { us[0].shape = { ...us[0].shape, guard: { on: true, why: null, route: 'household' } }; return us; }, /a: its shape as it ran not the panel's: the guard on \(household\)/],
      ['its shape as it ran taken without its own', us => { us[0].shape = { ...us[0].shape, without: null }; return us; }, /a: its shape as it ran not the panel's: taken without its own shape/],
      ['ROUTE run on another context than the page\'s', us => { us[0].routeCtx = 'armA'; return us; }, /ROUTE's context 'armA'/],
      ['an arm missing', us => { delete us[0].arms.ROUTE; return us; }, /a ROUTE: missing/],
      ['another configuration', us => { us[0].arms.ROUTE.config = 'x'; return us; }, /configuration x/],
      ['an array not one a path', us => { us[0].arms.APP.tax = new Float64Array(3); return us; }, /tax not one a path/]
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
  // the gate and the rule are one code under APART; its planted checks build the rehearsal's units, so run them without it (the
  // panel's own APART checks are couples-any-panel.mjs --planted with APART=1)
  if (args.includes('--planted')) { if (APART) { console.error('reduce-couples-any: --planted runs without APART=1'); process.exit(2); } process.exit(planted() ? 1 : 0); }
  const PILOT = args.includes('--pilot'), REGISTERED = args.includes('--registered');
  // the pilot and the registered read take the registered panel (REG=1, so the stamp's data files are its)
  if ((PILOT || REGISTERED) !== (process.env.REG === '1')) { console.error(`reduce-couples-any: ${PILOT ? '--pilot' : REGISTERED ? '--registered' : 'the dress rehearsal'} reads ${PILOT || REGISTERED ? 'with' : 'without'} REG=1`); process.exit(2); }
  const seed = REGISTERED ? HELD : SEED;
  // APART=1: COUPLES-APART.md's test (EXPLORATORY), the rehearsal's read on its own panel and folder
  const DIR = args.find(a => !a.startsWith('--')) || join(HERE, 'results', REGISTERED ? 'couples-any-run' : PILOT ? 'couples-any-pilot' : APART ? `couples-apart-${SEED}` : `couples-any-${SEED}`);
  if (!existsSync(DIR)) { console.error(`reduce-couples-any: no ${DIR}`); process.exit(2); }
  const { readAnyPanel } = await import('./couples-any-panel.mjs');
  const panel = readAnyPanel().map(u => ({ id: u.id, cls: u.cls, variant: u.variant, kind: u.kind, hold: u.hold }));
  const smoke = args.includes('--smoke'), units = loadDir(DIR).sort((a, b) => a.k - b.k);
  const want = smoke ? panel.filter(w => units.some(u => u.id === w.id)) : panel;
  const logs = Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')]));
  const n = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')).N : PILOT ? PILOT_N : N_DEFAULT;
  console.log(`${APART ? 'COUPLES FOUR AND FIVE RISK LEVELS APART (EXPLORATORY; COUPLES-APART.md, D154 (5))' : `EVERY COUPLE ON THE SOLVER, ${REGISTERED ? `THE REGISTERED TEST (${REGISTRATION})` : PILOT ? 'THE REGISTERED TEST\'S PILOT (EXPLORATORY; its gate alone)' : 'THE DRESS REHEARSAL (EXPLORATORY; COUPLES-ANY.md amendment 2)'}`}: ${units.length} units from ${DIR.replace(/.*research\/solver\//, '')}, seed ${seed}${smoke ? ', a smoke' : ''}`);
  if (smoke && units.some(u => u.N === n && u.pts === APP_POINTS)) { console.log('a smoke at the read\'s own count of paths and points: refused (read it without --smoke)'); process.exit(1); }
  // the fair-test gate on the launch logs (CHECKLIST 3): under the registration every log stamped by the launcher with the
  // registration's git blob; the dress rehearsal's with PREDICTION none; a smoke, not launched, has none; the pilot runs directly
  if (REGISTERED && !smoke) requireFairLogs(Object.values(logs), REGISTRATION);
  else if (!smoke && !PILOT) requireFairLogs(Object.values(logs), 'none', { blob: () => '-' });
  const P = gate(units, want, { seed, audit: stampFilesHash(), logs, n: smoke ? units[0] && units[0].N : n, pts: smoke ? units[0] && units[0].pts : APP_POINTS });
  if (P.length) { console.log(`THE GATE: REFUSED\n  ${P.join('\n  ')}`); process.exit(1); }
  const identity = identityOf(existsSync(IDENTITY_FILE) ? readFileSync(IDENTITY_FILE, 'utf8') : null, units);
  if (smoke || PILOT) { const r = report(units, { identity, registered: REGISTERED }); console.log(`THE GATE: fair on ${smoke ? 'the smoke\'s' : 'the pilot\'s'} ${units.length} units; the rule ran (${r.out.length} lines), no figure printed`); process.exit(0); }
  const u0 = units[0];
  console.log(`THE GATE: fair; one code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${seed}, ${u0.N} paths, ${u0.pts} points; both arms at their configurations; each unit's record and shape the panel's; each unit's own log with its done line`);
  console.log(report(units, { identity, registered: REGISTERED }).out.join('\n'));
}
