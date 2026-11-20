/*
 * THE LATE TAIL, THE READ (LATE-TAIL.md; D134 (1); EXPLORATORY): the units audit-late-tail.mjs wrote, read once by the rule
 * committed before they ran.
 * The gate first: the ten units each there once with its six arms at its paths; one code (step 8's), audit, seed (7002),
 * count of points (45), estate weight and Node version; K2 and HSPA at step 8's configurations; each unit's checks as
 * recorded (the variants' wiring, what each variant took, step 8's pilot where it ran the unit); each unit's launch log with
 * its stamp and done line.
 * Then the rule: the worst tenth of each unit's markets, its paths ranked by APP's end pot (lowest first, ties by path); D,
 * the mean over the seven units below nought of K2's worst-tenth mean end pot less HSPA's; each of L, R and CEIL explaining
 * the loss where D is above nought and its restoration (the mean over the seven of its worst-tenth mean end pot less
 * HSPA's) is at least half of D; the outcome NO SHORTFALL, THE GROWTH, THE EARLY SPENDING, BOTH, THE TRANSLATION or THE
 * DRAWS, with CEIL NEAR K2 under the second to the fourth where CEIL also restores half.
 * Beside, deciding nothing: net whole paths lost against K2 by arm, unit and pooled over the seven; the controls; the worst
 * tenth's spending level and risk held over the first ten retired years and from the eleventh, and lifetime tax; M1's unit.
 *   node research/solver/reduce-late-tail.mjs [dir] > research/solver/results-late-tail.txt
 *   node research/solver/reduce-late-tail.mjs --planted
 * AMENDMENT 1 (20 Nov; LATE-TAIL.md, its amendment 1): the first read's CEIL ran through a recorder that dropped the tiers
 * held. CEIL is run again alone on the amended audit (results/late-tail-7002-ceil) and the read takes it from there, every
 * other arm from the first run, by the same rule:
 *   node research/solver/reduce-late-tail.mjs research/solver/results/late-tail-7002 --ceil research/solver/results/late-tail-7002-ceil > research/solver/results-late-tail-2.txt
 * Its gate: the first run's units as before on their own audit (FIRST_AUDIT), the re-run's on these files' (ceilGate: each
 * unit once, CEIL alone, the first run's code, seed, paths, points, household table, horizon and first year, check 5 on
 * CEIL and on the first run's K2, HSPA, L and R), and the logs on exactly those two versions. Beside, added (the reviewer's
 * findings 2 and 5): each arm's survivors on the worst tenth, and APP's paths ending at nought.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNITS, BELOW, CONTROLS, M1_UNIT, SEED, N, PTS, W, ARMS, TABLE_ARMS, YEAR_KEYS, dec, stampFilesHash } from './audit-late-tail.mjs';
import { KEYS, configOf as hspConfigOf } from './audit-household-hsp.mjs';
import { codeId } from './code-id.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const mean = a => (a.length ? sum(a) / a.length : NaN);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
export const OUTCOMES = Object.freeze(['NO SHORTFALL', 'THE GROWTH', 'THE EARLY SPENDING', 'BOTH', 'THE TRANSLATION', 'THE DRAWS']);
// amendment 1: the first run's audit stamp (its five arms unaffected by the recorder's fault: its check 5 on the re-run)
export const FIRST_AUDIT = '57cc9f06eafb';

export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])), ...(x.years ? Object.fromEntries(Object.entries(YEAR_KEYS).map(([k, Ty]) => [k, dec(x.years[k], Ty)])) : {}) });
export function loadDir(dir) {
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).map(x => { const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()); for (const a of Object.keys(U.arms)) U.arms[a] = armOf(U.arms[a]); return U; });
}

/* the gate: refusals, each a line. `logs` the launch logs (file -> text), or null */
export function gate(units, { audit = null, code = null, logs = null, n = N, pts = PTS, smoke = false } = {}) {
  const P = [], ids = units.map(u => u.id);
  for (const id of UNITS) { const c = ids.filter(x => x === id).length; if (c !== 1) P.push(`${id}: ${c === 0 ? 'missing' : `${c} times`}`); }
  for (const id of ids) if (!UNITS.includes(id)) P.push(`${id}: not a unit of the test`);
  const one = (what, g) => { const vs = [...new Set(units.map(g))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('Node version', u => u.stamp.node);
  if (units.some(u => u.seed !== SEED)) P.push(`a unit is not on seed ${SEED}`);
  if (units.some(u => u.pts !== pts)) P.push(`a unit is not at ${pts} points`);
  if (units.some(u => u.W !== W)) P.push(`a unit is not at the estate weight ${W}`);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (code && units.some(u => u.stamp.code !== code)) P.push(`a unit's code is not step 8's (${code})`);
  for (const u of units) {
    if (u.N !== n) P.push(`${u.id}: ${u.N} paths, not ${n}`);
    if (!u.configs || u.configs.K2 !== hspConfigOf('K2') || u.configs.HSPA !== hspConfigOf('HSPA')) P.push(`${u.id}: K2 or HSPA not at step 8's configuration`);
    for (const arm of ARMS) {
      const A = u.arms[arm];
      if (!A) { P.push(`${u.id} ${arm}: missing`); continue; }
      for (const k of Object.keys(KEYS)) if (!A[k] || A[k].length !== u.N) P.push(`${u.id} ${arm}: ${k} not one a path`);
      if (TABLE_ARMS.includes(arm)) for (const k of Object.keys(YEAR_KEYS)) if (!A[k] || A[k].length !== u.N * u.Y) P.push(`${u.id} ${arm}: ${k} not one a year of every path`);
    }
    const c = u.checks || {};
    if (!c.wire || !/^HSPA on \d+ paths$/.test(c.wire.NONE || '') || !/^K2 on \d+ paths$/.test(c.wire.ALL || '')) P.push(`${u.id}: the variants' wiring not checked`);
    if (!c.takes || c.takes.L !== 0 || c.takes.R !== 0) P.push(`${u.id}: a variant not taking K2's part at every checked decision`);
    if (!smoke && ['S025-45', 'S273-own', 'S273-sppart', 'S273-90'].includes(u.id) && !/^K2 and HSPA equal to step 8's pilot on 1000 paths$/.test(c.pilot || '')) P.push(`${u.id}: not held to step 8's pilot`);
    if (!(u.firstSpend >= 0 && u.firstSpend <= u.T)) P.push(`${u.id}: no first year of spending`);
  }
  if (logs !== null) {
    const texts = Object.values(logs);
    for (const u of units) { const own = texts.filter(t => new RegExp(`unit ${u.k}/\\d+: ${u.id} `).test(t)); if (own.length !== 1 || !new RegExp(`^ +done unit ${u.k} secs `, 'm').test(own[0]) || !/^stamp: code \S+ audit \S+/.test(own[0])) P.push(`${u.id}: ${own.length} launch logs name it, or without its stamp or done line`); }
  }
  return P;
}

/* amendment 1: the CEIL re-run's units against the first run's (refusals, each a line). `logs` the re-run's launch logs */
export function ceilGate(ceil, firstUnits, { audit = null, code = null, logs = null, check = CHECK } = {}) {
  const P = [], ids = ceil.map(u => u.id), byId = Object.fromEntries(firstUnits.map(u => [u.id, u]));
  for (const id of UNITS) { const c = ids.filter(x => x === id).length; if (c !== 1) P.push(`CEIL re-run ${id}: ${c === 0 ? 'missing' : `${c} times`}`); }
  for (const c of ceil) {
    const f = byId[c.id], tag = `CEIL re-run ${c.id}`;
    if (!f) { P.push(`${tag}: not a unit of the first run`); continue; }
    if (code && c.stamp.code !== code) P.push(`${tag}: its code is not step 8's (${code})`);
    if (c.stamp.code !== f.stamp.code) P.push(`${tag}: another code than the first run's`);
    if (audit && c.stamp.audit !== audit) P.push(`${tag}: its audit is not these files' (${audit})`);
    if (c.stamp.audit === f.stamp.audit) P.push(`${tag}: on the first run's audit, not the amended one`);
    if (c.stamp.node !== f.stamp.node) P.push(`${tag}: another Node version than the first run's`);
    if (c.seed !== f.seed || c.N !== f.N || c.pts !== f.pts || c.W !== f.W) P.push(`${tag}: another seed, count of paths, points or estate weight than the first run's`);
    if (JSON.stringify(c.armsRun) !== JSON.stringify(['CEIL']) || Object.keys(c.arms).join() !== 'CEIL') P.push(`${tag}: not CEIL alone`);
    const A = c.arms.CEIL;
    if (A) { for (const k of Object.keys(KEYS)) if (!A[k] || A[k].length !== c.N) P.push(`${tag}: ${k} not one a path`); for (const k of Object.keys(YEAR_KEYS)) if (!A[k] || A[k].length !== c.N * c.Y) P.push(`${tag}: ${k} not one a year of every path`); }
    if (!c.digests || c.digests.household !== f.digests.household) P.push(`${tag}: another household table than the first run's`);
    if (c.T !== f.T || c.Y !== f.Y || c.firstSpend !== f.firstSpend) P.push(`${tag}: another horizon or first year of spending than the first run's`);
    const b = (c.checks && c.checks.bare) || {}, m = Math.min(check, c.N);
    if (b.CEIL !== `equal without the recorder on ${m} paths`) P.push(`${tag}: check 5 not passed on CEIL`);
    for (const a of ['K2', 'HSPA', 'L', 'R']) if (b[`first ${a}`] !== `the first run's equal without the recorder on ${m} paths`) P.push(`${tag}: the first run's ${a} not held without the recorder`);
    if (!c.checks || !c.checks.first || c.checks.first.audit !== f.stamp.audit || c.checks.first.household !== f.digests.household) P.push(`${tag}: not held to the first run's unit`);
  }
  if (logs !== null) {
    const texts = Object.values(logs);
    for (const c of ceil) { const own = texts.filter(t => new RegExp(`unit ${c.k}/\\d+: ${c.id} `).test(t)); if (own.length !== 1 || !new RegExp(`^ +done unit ${c.k} secs `, 'm').test(own[0]) || !/^stamp: code \S+ audit \S+/.test(own[0])) P.push(`CEIL re-run ${c.id}: its log not there once with its stamp and done line`); }
  }
  return P;
}
/* amendment 1: the first run's units with each one's CEIL from the re-run */
export const withCeil = (firstUnits, ceil) => firstUnits.map(u => { const c = ceil.find(x => x.id === u.id); return c ? { ...u, arms: { ...u.arms, CEIL: c.arms.CEIL }, ceilFrom: c.stamp.audit } : u; });

/* the worst tenth of a unit's markets: its paths ranked by APP's end pot, lowest first, ties by path */
export function worstTenth(u) {
  const n = u.N, idx = Array.from({ length: n }, (_, i) => i), pot = u.arms.APP.pot;
  idx.sort((a, b) => pot[a] - pot[b] || a - b);
  return idx.slice(0, Math.floor(n / 10));
}
export const potOn = (A, idx) => mean(idx.map(i => A.pot[i]));
/* the rule (LATE-TAIL.md) */
export function rule(units) {
  const byId = Object.fromEntries(units.map(u => [u.id, u])), below = BELOW.map(id => byId[id]).filter(Boolean);
  const wt = Object.fromEntries(units.map(u => { const idx = worstTenth(u); return [u.id, Object.fromEntries(ARMS.map(a => [a, potOn(u.arms[a], idx)]))]; }));
  const D = mean(below.map(u => wt[u.id].K2 - wt[u.id].HSPA));
  const rest = Object.fromEntries(['L', 'R', 'CEIL'].map(v => [v, mean(below.map(u => wt[u.id][v] - wt[u.id].HSPA))]));
  const explains = Object.fromEntries(Object.entries(rest).map(([v, r]) => [v, D > 0 && r >= D / 2]));
  let outcome;
  if (!(D > 0)) outcome = 'NO SHORTFALL';
  else if (explains.R && !explains.L) outcome = 'THE GROWTH';
  else if (explains.L && !explains.R) outcome = 'THE EARLY SPENDING';
  else if (explains.L && explains.R) outcome = 'BOTH';
  else if (explains.CEIL) outcome = 'THE TRANSLATION';
  else outcome = 'THE DRAWS';
  const ceilNear = ['THE GROWTH', 'THE EARLY SPENDING', 'BOTH'].includes(outcome) && explains.CEIL;
  const goesOn = outcome === 'NO SHORTFALL' || (['THE GROWTH', 'THE EARLY SPENDING', 'BOTH'].includes(outcome) && !ceilNear);
  return { wt, D, rest, explains, outcome, ceilNear, goesOn };
}
/* net whole paths lost against K2 (paths K2 keeps that the arm loses, less the reverse) */
export function netLost(u, arm) { const k = u.arms.K2.survived, x = u.arms[arm].survived; let l = 0, s = 0; for (let i = 0; i < u.N; i++) { if (k[i] && !x[i]) l++; else if (!k[i] && x[i]) s++; } return l - s; }
/* on given paths, a table arm's mean level (% of target) and risk held (% real return) over retired years [lo, hi) from the
   first year of spending */
export function yearsOn(u, A, idx, lo, hi) {
  let lv = 0, rk = 0, c = 0;
  for (const i of idx) for (let t = u.firstSpend + lo; t < Math.min(u.Y, u.firstSpend + hi); t++) { lv += A.level[i * u.Y + t]; rk += A.risk[i * u.Y + t]; c++; }
  return c ? { level: lv / c, risk: rk / c / 100 } : { level: NaN, risk: NaN };
}

export function report(units) {
  const out = [], log = x => out.push(x), R = rule(units), byId = Object.fromEntries(units.map(u => [u.id, u]));
  log('\nTHE RULE (LATE-TAIL.md), on the worst tenth of each unit\'s markets (its paths ranked by APP\'s end pot):');
  log(`  D, K2's mean end pot less HSPA's over the seven units below nought: ${gbp(R.D)} a path`);
  for (const v of ['L', 'R', 'CEIL']) log(`  ${v.padEnd(4)} restores ${gbp(R.rest[v])} a path (${Number.isFinite(R.D) && R.D !== 0 ? `${(100 * R.rest[v] / R.D).toFixed(1)}% of D` : '-'}): ${R.explains[v] ? 'EXPLAINS IT (at least half of D)' : 'does not explain it'}`);
  log(`OUTCOME: ${R.outcome}${R.ceilNear ? '; CEIL NEAR K2' : ''}: ${R.goesOn ? "step 8's build goes on to main on B1's gate, this read reported (D134 (1))" : "step 8's build stops before main and comes back to the maintainer (D134 (1))"}`);
  log('\nBESIDE THE RULE, deciding nothing:');
  log(`  net whole paths lost against K2, pooled over the seven: ${['HSPA', 'L', 'R', 'CEIL'].map(a => `${a} ${sum(BELOW.filter(id => byId[id]).map(id => netLost(byId[id], a)))}`).join(', ')}`);
  log('  by unit (worst-tenth mean end pot by arm; net whole paths lost against K2 by arm; the worst tenth\'s level and risk held, years 0-9 and 10 on, K2 / HSPA / L / R; lifetime tax on the worst tenth by arm):');
  for (const id of UNITS) {
    const u = byId[id]; if (!u) continue;
    const idx = worstTenth(u), w = R.wt[id], yr = (a, lo, hi) => { const y = yearsOn(u, u.arms[a], idx, lo, hi); return `${f1(y.level)}% ${f2(y.risk)}%`; };
    const tag = BELOW.includes(id) ? 'below' : id === M1_UNIT ? 'M1' : CONTROLS.includes(id) ? 'control' : '';
    log(`    ${id.padEnd(12)} ${tag.padEnd(7)} pot ${ARMS.map(a => `${a} ${gbp(w[a])}`).join(', ')}; lost ${['HSPA', 'L', 'R', 'CEIL'].map(a => `${a} ${netLost(u, a)}`).join(', ')}; years 0-9 ${['K2', 'HSPA', 'L', 'R'].map(a => yr(a, 0, 10)).join(' / ')}; 10 on ${['K2', 'HSPA', 'L', 'R'].map(a => yr(a, 10, 1e9)).join(' / ')}; tax ${ARMS.map(a => gbp(mean(idx.map(i => u.arms[a].tax[i])))).join(' / ')}`);
  }
  log(`  survival by arm (% of paths): ${UNITS.filter(id => byId[id]).map(id => `${id} ${ARMS.map(a => (100 * sum(byId[id].arms[a].survived) / byId[id].N).toFixed(2)).join('/')}`).join('; ')} (APP/K2/HSPA/L/R/CEIL)`);
  // amendment 1, the reviewer's findings 2 and 5: each arm's survivors on the worst tenth; APP's paths ending at nought, of
  // which the worst tenth then takes the lowest-numbered
  { const surv = id => { const u = byId[id], idx = worstTenth(u); return Object.fromEntries(ARMS.map(a => [a, idx.reduce((t, i) => t + u.arms[a].survived[i], 0)])); };
    log(`  survivors on the worst tenth (of ${Math.floor(N / 10)} a unit, APP/K2/HSPA/L/R/CEIL): ${UNITS.filter(id => byId[id]).map(id => `${id} ${ARMS.map(a => surv(id)[a]).join('/')}`).join('; ')}; pooled over the seven ${ARMS.map(a => sum(BELOW.filter(id => byId[id]).map(id => surv(id)[a]))).join('/')}`);
    log(`  APP's end pot at nought (paths of ${N}; the worst tenth, ties by path, then the lowest-numbered of them, its highest path): ${UNITS.filter(id => byId[id]).map(id => { const u = byId[id], idx = worstTenth(u); return `${id} ${u.arms.APP.pot.reduce((t, x) => t + (x === 0 ? 1 : 0), 0)} (${Math.max(...idx)})`; }).join('; ')}`); }
  log(`  the time a path (CPU, the mean a unit): ${ARMS.map(a => `${a} ${(mean(units.map(u => u.arms[a].cpuUs / u.arms[a].n)) / 1e3).toFixed(1)} ms`).join(', ')}`);
  return { R, out };
}

function planted() {
  const cases = [], n = 100, Y = 6;
  // a planted unit: APP's end pot rising with the path (the worst tenth paths 0 to 9), each arm's pot set per path
  const mk = (id, pots, o = {}) => ({ id, k: 0, N: n, Y, T: Y - 1, firstSpend: 1, seed: SEED, pts: PTS, W, stamp: { code: 'c', audit: 'a', node: 'v' }, configs: { K2: hspConfigOf('K2'), HSPA: hspConfigOf('HSPA') }, checks: { wire: { NONE: 'HSPA on 100 paths', ALL: 'K2 on 100 paths' }, takes: { L: 0, R: 0 }, pilot: ['S025-45', 'S273-own', 'S273-sppart', 'S273-90'].includes(id) ? "K2 and HSPA equal to step 8's pilot on 1000 paths" : 'not in the pilot' },
    arms: Object.fromEntries(ARMS.map(a => [a, { n, cpuUs: 1, survived: Uint8Array.from({ length: n }, (_, i) => (o.lost && o.lost[a] && i < o.lost[a] ? 0 : 1)), failYear: new Int16Array(n), pot: Float64Array.from({ length: n }, (_, i) => (a === 'APP' ? i : (pots[a] || 0) + (i < 10 ? 0 : 1e6))), estate: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n), unmet: new Float64Array(n), ...(TABLE_ARMS.includes(a) ? { level: new Uint8Array(n * Y).fill(100), risk: new Int16Array(n * Y).fill(400), taxYear: new Float32Array(n * Y) } : {}) }])) });
  const set = pots => UNITS.map(id => mk(id, pots));
  const out = pots => rule(set(pots));
  { const u = mk('S025-45', { K2: 100 }); cases.push(['the worst tenth: the ten paths APP ends lowest', worstTenth(u).join(','), '0,1,2,3,4,5,6,7,8,9']); }
  { const r = out({ K2: 100, HSPA: 0, L: 10, R: 60, CEIL: 10 }); cases.push(['R restores 60% of D, L 10%: THE GROWTH, the build goes on', `${r.D} ${r.outcome} ${r.ceilNear} ${r.goesOn}`, '100 THE GROWTH false true']); }
  { const r = out({ K2: 100, HSPA: 0, L: 50, R: 10, CEIL: 0 }); cases.push(['L restores exactly half: THE EARLY SPENDING', `${r.outcome} ${r.goesOn}`, 'THE EARLY SPENDING true']); }
  { const r = out({ K2: 100, HSPA: 0, L: 49, R: 10, CEIL: 0 }); cases.push(['L restores just under half, nothing else: THE DRAWS, the build stops', `${r.outcome} ${r.goesOn}`, 'THE DRAWS false']); }
  { const r = out({ K2: 100, HSPA: 0, L: 70, R: 80, CEIL: 0 }); cases.push(['both restore half: BOTH', `${r.outcome}`, 'BOTH']); }
  { const r = out({ K2: 100, HSPA: 0, L: 70, R: 10, CEIL: 60 }); cases.push(['L explains it and CEIL is near K2: the build stops', `${r.outcome} ${r.ceilNear} ${r.goesOn}`, 'THE EARLY SPENDING true false']); }
  { const r = out({ K2: 100, HSPA: 0, L: 10, R: 10, CEIL: 60 }); cases.push(['neither variant, CEIL half way: THE TRANSLATION, the build stops', `${r.outcome} ${r.goesOn}`, 'THE TRANSLATION false']); }
  { const r = out({ K2: 0, HSPA: 10, L: 0, R: 0, CEIL: 0 }); cases.push(['HSPA no lower than K2 on the worst tenth: NO SHORTFALL, the build goes on', `${r.outcome} ${r.goesOn}`, 'NO SHORTFALL true']); }
  // only the seven below nought make D: a control with a large shortfall moves nothing
  { const us = set({ K2: 100, HSPA: 0, L: 60, R: 0, CEIL: 0 }); us[UNITS.indexOf('S349F-own')] = mk('S349F-own', { K2: 1e5, HSPA: 0 }); const r = rule(us); cases.push(['a control\'s shortfall does not enter D', `${r.D}`, '100']); }
  { const u = mk('S025-45', { K2: 1, HSPA: 1 }, { lost: { HSPA: 7, L: 3 } }); cases.push(['net whole paths lost against K2', `${netLost(u, 'HSPA')} ${netLost(u, 'L')} ${netLost(u, 'R')}`, '7 3 0']); }
  // the gate on built units: fair; each refusal on its planted fault
  { const G = mod => { const us = set({ K2: 1, HSPA: 1 }); if (mod) mod(us); return gate(us, { n }); };
    const g0 = G(); cases.push(['the gate: the built units fair', g0.length ? g0.slice(0, 3).join(' | ') : '0', '0']);
    const faults = [
      ['a unit missing', us => us.pop(), /S355F-own: missing/],
      ['a unit twice', us => us.push({ ...us[0] }), /S025-45: 2 times/],
      ['another audit', us => { us[1].stamp = { ...us[1].stamp, audit: 'z' }; }, /more than one audit/],
      ['another seed', us => { us[2].seed = 7024; }, /not on seed 7002/],
      ['an arm missing', us => { delete us[0].arms.R; }, /S025-45 R: missing/],
      ['a table arm without its years', us => { us[0].arms.L.level = new Uint8Array(3); }, /S025-45 L: level not one a year/],
      ['K2 not at step 8\'s configuration', us => { us[3].configs = { ...us[3].configs, K2: 'x' }; }, /S357F-45: K2 or HSPA not at step 8's configuration/],
      ['the wiring not checked', us => { us[4].checks = { ...us[4].checks, wire: { NONE: 'no', ALL: 'K2 on 100 paths' } }; }, /S357F-db: the variants' wiring not checked/],
      ['a variant not taking K2\'s part', us => { us[5].checks = { ...us[5].checks, takes: { L: 2, R: 0 } }; }, /S357F-gap8: a variant not taking/],
      ['a pilot unit not held to the pilot', us => { us[1].checks = { ...us[1].checks, pilot: 'not in the pilot' }; }, /S273-own: not held to step 8's pilot/],
      ['no first year of spending', us => { us[6].firstSpend = -1; }, /S357F-own: no first year of spending/]
    ];
    const missed = faults.filter(([, mod, re]) => !G(mod).some(x => re.test(x))).map(([nm]) => nm);
    cases.push([`the gate: every refusal on its planted fault (${faults.length})`, missed.join(', ') || 'all fire', 'all fire']); }
  // amendment 1: the read takes CEIL from the re-run; the re-run's gate, fair on built units and each refusal on its fault
  { const first = set({ K2: 100, HSPA: 0, L: 10, R: 60, CEIL: 60 }).map(u => ({ ...u, digests: { household: `h-${u.id}` } }));
    const ceilOf = (u, cpot) => { const c = mk(u.id, { CEIL: cpot }); return { ...c, stamp: { ...c.stamp, audit: 'b' }, digests: { household: `h-${u.id}` }, armsRun: ['CEIL'], arms: { CEIL: c.arms.CEIL },
      checks: { bare: { CEIL: `equal without the recorder on ${n} paths`, ...Object.fromEntries(['K2', 'HSPA', 'L', 'R'].map(a => [`first ${a}`, `the first run's equal without the recorder on ${n} paths`])) }, first: { audit: 'a', household: `h-${u.id}` } } }; };
    const ceil = first.map(u => ceilOf(u, 0)), r0 = rule(first), r1 = rule(withCeil(first, ceil));
    cases.push(['the read takes CEIL from the re-run: CEIL NEAR K2 on the first run\'s CEIL, not on the re-run\'s', `${r0.outcome} ${r0.ceilNear} ${r0.goesOn} | ${r1.outcome} ${r1.ceilNear} ${r1.goesOn}`, 'THE GROWTH true false | THE GROWTH false true']);
    const CG = mod => { const cs = first.map(u => ceilOf(u, 0)); if (mod) mod(cs); return ceilGate(cs, first, { audit: 'b', check: n }); };
    const g0 = CG(); cases.push(['the re-run\'s gate: the built units fair', g0.length ? g0.slice(0, 3).join(' | ') : '0', '0']);
    const faults = [
      ['a re-run unit missing', cs => cs.pop(), /CEIL re-run S355F-own: missing/],
      ['a re-run unit twice', cs => cs.push({ ...cs[0] }), /CEIL re-run S025-45: 2 times/],
      ['a re-run on the first run\'s audit', cs => { cs[1].stamp = { ...cs[1].stamp, audit: 'a' }; }, /S273-own: on the first run's audit/],
      ['a re-run on a third audit', cs => { cs[1].stamp = { ...cs[1].stamp, audit: 'z' }; }, /S273-own: its audit is not these files'/],
      ['another household table', cs => { cs[2].digests = { household: 'x' }; }, /S273-sppart: another household table/],
      ['another seed', cs => { cs[3].seed = 7024; }, /S357F-45: another seed/],
      ['not CEIL alone', cs => { cs[4].armsRun = ['CEIL', 'K2']; }, /S357F-db: not CEIL alone/],
      ['check 5 not passed on CEIL', cs => { cs[5].checks = { ...cs[5].checks, bare: { ...cs[5].checks.bare, CEIL: 'no' } }; }, /S357F-gap8: check 5 not passed on CEIL/],
      ['the first run\'s R not held without the recorder', cs => { cs[6].checks = { ...cs[6].checks, bare: { ...cs[6].checks.bare, 'first R': 'no' } }; }, /S357F-own: the first run's R not held/],
      ['not held to the first run\'s unit', cs => { cs[7].checks = { ...cs[7].checks, first: { audit: 'a', household: 'x' } }; }, /S273-90: not held to the first run's unit/],
      ['another first year of spending', cs => { cs[8].firstSpend = 2; }, /S349F-own: another horizon or first year/]
    ];
    const missed = faults.filter(([, mod, re]) => !CG(mod).some(x => re.test(x))).map(([nm]) => nm);
    cases.push([`the re-run's gate: every refusal on its planted fault (${faults.length})`, missed.join(', ') || 'all fire', 'all fire']); }
  let bad = 0;
  for (const [nm, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const SMOKE = args.includes('--smoke'), ci = args.indexOf('--ceil'), CEIL_DIR = ci >= 0 ? args[ci + 1] : null;
  const DIR = args.find((a, i) => !a.startsWith('--') && !(ci >= 0 && i === ci + 1)) || join(HERE, 'results', 'late-tail-7002');
  if (!existsSync(DIR) || (CEIL_DIR && !existsSync(CEIL_DIR))) { console.error(`reduce-late-tail: no ${!existsSync(DIR) ? DIR : CEIL_DIR}`); process.exit(2); }
  const logsOf = d => Object.fromEntries(readdirSync(d).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(d, x), 'utf8')]));
  const firstUnits = loadDir(DIR), logs = logsOf(DIR), ceilUnits = CEIL_DIR ? loadDir(CEIL_DIR) : null, ceilLogs = CEIL_DIR ? logsOf(CEIL_DIR) : null;
  // the fair-test gate's stamps (CHECKLIST 3): every log stamped by the launcher on one code and these files, an EXPLORATORY
  // run's prediction 'none' (as reduce-household-arm.mjs takes it); with the CEIL re-run (amendment 1), on exactly two
  // versions: the first run's audit and these files'
  const cc = codeId(), now = stampFilesHash();
  if (!SMOKE) requireFairLogs([...Object.values(logs), ...Object.values(ceilLogs || {})], 'none', { blob: () => '-', ...(CEIL_DIR ? { allowed: [`code ${cc ? cc.hash : '?'} audit ${FIRST_AUDIT}`, `code ${cc ? cc.hash : '?'} audit ${now}`] } : {}) });
  const units = CEIL_DIR ? withCeil(firstUnits, ceilUnits) : firstUnits;
  const P = [...gate(units, { audit: CEIL_DIR ? FIRST_AUDIT : now, code: cc ? cc.hash : null, logs, ...(SMOKE ? { n: units[0] ? units[0].N : N, pts: units[0] ? units[0].pts : PTS, smoke: true } : {}) }),
    ...(CEIL_DIR ? ceilGate(ceilUnits, firstUnits, { audit: now, code: SMOKE ? null : cc ? cc.hash : null, logs: ceilLogs }) : [])];
  console.log(`THE LATE TAIL (LATE-TAIL.md; EXPLORATORY): ${units.length} units from ${DIR}${CEIL_DIR ? `, CEIL from ${CEIL_DIR} (amendment 1: the first run's CEIL ran through a recorder dropping the tiers held)` : ''}${SMOKE ? ' (A SMOKE: no result)' : ''}`);
  if (P.length) { console.log(`THE GATE: REFUSED\n  ${P.join('\n  ')}`); process.exit(3); }
  console.log(`THE GATE: fair; one code ${units[0].stamp.code}, audit ${units[0].stamp.audit}${CEIL_DIR ? ` (APP, K2, HSPA, L and R; CEIL on ${now}, amendment 1, its checks passed and the first run's arms held to their contexts without the recorder)` : ''}, seed ${SEED}, ${units[0].pts} points; every unit's six arms at its paths, its checks passed`);
  if (SMOKE) process.exit(0);
  console.log(report(units).out.join('\n'));
}
