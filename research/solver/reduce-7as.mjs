/*
 * THE 7AS REDUCER: THE CHARGE'S SIZE AND S194'S BAD-WORLD SLICE (predictions/diag-7as.md; PLAN.md 7as; the maintainer's
 * decision for the charge, 3 Oct 18:51 UK; O50). Reads results/diag7as/case*.txt and traces (batch-7as.sh: audit-7as.mjs, one
 * process a job) beside P's records (results/diagP), which pass P's own gate first (reduce-P.mjs loadRefs and gate: 7ae,
 * 7ad, 7ac, 7aa, 7af and 7ag through theirs) and whose traces are held to P's logs.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7as, and P's records through P's own gate;
 *   - every registered job once and done, nothing unregistered: core:C05 and core:C2 on the three units (switchCharge 0.0005
 *     and 0.002, switchMargin 0) and ident:P on each (P's 0.001 solved again);
 *   - the unit line's settings (lambda held, the plan's tier, 'auto' risk above, three worlds, 30 points, 5 return points);
 *     every job's solve, ran, gap, joint, moves and price lines and its three world lines;
 *   - THE RAN LINE: P's core:P ran line for the unit with the charge's value in place of 0.001 (ident: P's own, unchanged);
 *     the joint line one move for every world, the margin 0, the job's charge, no pension death charge, P's scale and cap;
 *   - IDENTITY (the code changed since P ran): every ident:P job's table, ran, gap and opening, joint, moves, price and world
 *     lines are P's core:P lines for the unit;
 *   - COMPLETE: every core job's all-world line on NA paths; S194's core jobs' node line on WN paths with TS+J, OPEN2 and WA, and
 *     ten decision-log lines a rule; no node line on bridge 4 or S126;
 *   - THE TRACES: every core job's all-world trace, and S194's node traces, present and agreeing with their log (count, seed,
 *     arm, stamp, survival); P's traces read (P's all-world TS+J at P and 1e-3 on the three units; S194's node TS+J, OPEN2 and WA
 *     at P, 0 and 1e-3) agreeing with P's logs; this run's node traces' and all-world traces' paths are P's first paths (the same
 *     seed's paths; the gate checks the trace's seed and count, and pairs on the first NA of P's all-world paths).
 * THE ITEMS (exact rule and whole score as P read them: survival by the exact conditional McNemar with Holm and the guarded
 * unconditional interval, regimen item 1; the whole score by reduce-7aa.mjs wholeLeg at 0.05; MW 0.25, P's):
 *   1. THE CHARGE'S SIZE ACROSS ALL WORLDS (primary): six legs, TS+J at 0.0005 and at 0.002 against TS+J at 0.001 (P's trace,
 *      its first NA paths) on each unit. A leg is FLAT when survival reads no material harm both ways (the exact rule, Holm
 *      over the six legs a direction, at the unit's margin: marginFor P's survival; and the guarded unconditional interval
 *      inside minus to plus the margin) and the whole score's interval lies inside -MW to +MW; it CHANGES when either way
 *      reads harm or the whole score's interval lies wholly beyond -MW or +MW; else it is INCONCLUSIVE. HELD (the value
 *      does not matter within the margins from 0.0005 to 0.002) when all six are FLAT; FALSIFIED when any CHANGES; else
 *      INCONCLUSIVE.
 *   2. S194'S SLICE AT DOUBLE THE CHARGE (a dose-response, attributing nothing by itself: the world-blind chooser is in both
 *      arms, and the margin and the charge change together; the plan-auditor's BLOCKING 1 of 3 Oct 20:06 UK): at world 0's
 *      node, OPEN2 at 0.002 against OPEN2 at 1e-3 (P's) by the whole score. HELD (more switching friction suppresses the
 *      re-risking at the node) when the lower end is above -MW; FALSIFIED (a material loss stays at twice the charge) when
 *      the upper end is below -MW; else INCONCLUSIVE.
 *   3. THE SPLIT (O50; redesigned before launch, the plan-auditor's FAIL of 3 Oct 20:14 UK: WA alone cannot split O50 - an
 *      informed chooser barely switches in the bad world - so the split is the contrast at the same charge, path by path):
 *      at S194's node, each path's whole score (reduce-7aa.mjs wholePaths) under OPEN2 at 0.002 less under OPEN2 at 1e-3 (o,
 *      the slice) and under WA at 0.002 less under WA at 1e-3 (a, the charge's move on a chooser that knows the world). The
 *      premise: a slice (the test of mean(-o) above 0, p under 0.05); without it INCONCLUSIVE (NO SLICE). HELD (the slice
 *      is the world-blind chooser's: WA's move a third of it or less) when the test of mean(a - o/3) above 0 is under 0.05
 *      after Holm over the two directions; FALSIFIED (the charge's own: WA loses two thirds of the slice or more) when the
 *      test of mean(2o/3 - a) above 0 is; else INCONCLUSIVE. Fisher's paired randomization test (reduce-7ar.mjs flipP, B
 *      20,000). The limit, stated: the contrast assumes the charge's own cost to a chooser does not depend on whether the
 *      chooser knows the world.
 * Reported, not items: the all-world legs at each charge against the margin (P's 1e-3); S194's node slice at every charge (0, P's margin-0 run; 0.0005; 0.001; 0.002) against OPEN2 at 1e-3,
 * by the whole score and survival, and TS+J beside it; every all-world leg's cells, survival and whole score; each job's
 * table, gap and opening by charge.
 *   node research/solver/reduce-7as.mjs [dir] [dirP] [dir7ae] [dir7ad] [dir7ac] [dir7aa] [dir7af] [dir7ag] > research/solver/results-7as.txt
 *   node research/solver/reduce-7as.mjs --planted   the planted checks, the outcomes they reach and the boundary cases (EDGES)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { survivalChangeU, mcnemarHarmP, holm, outcome, marginFor } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import * as F from './reduce-7af.mjs';
import * as P from './reduce-P.mjs';
import { flipP, readTwo } from './reduce-7ar.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7as.md';
export const N = 16000, WN = 16000, NA = 8000, SEED = '7002', ALPHA = 0.05, MW = P.MW;
export const CHARGES = { C05: '0.0005', C2: '0.002' };
export const CORE = P.CORE;   // [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02'], ['S126', 'READER', '0']]
export const NODE_UNITS = ['S194'];
export const RULES = ['TS+J', 'OPEN2', 'WA'];
// the traces items 2 and 3 read at S194's node: [the reference (P's, at the margin 1e-3), the run's rule]
export const NODE_ITEMS = { 2: ['S194|1e-3|OPEN2', 'OPEN2'], 3: ['S194|1e-3|WA', 'WA'] };   // item 3's contrast: its OPEN2 half is item 2's, its WA half this
export const JOBS = [...['C2', 'C05'].flatMap(m => CORE.map(([id, a, w]) => [`core:${m}`, id, a, w])), ...CORE.map(([id, a, w]) => ['ident:P', id, a, w])];
const settingOf = kind => kind.split(':')[1];

const CASEL = /^(\S.*?)\s+case \| job (core:\S+|ident:P) (\S+?)\/(\d+x\d+)\/W(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+) points (\d+) quad (\d+)$/;
const LBL = '(\\S+?)\\/TS\\+J\\/M(\\S+?)\\/(\\d+x\\d+)\\/W(\\S+)';
const SOLVEL = new RegExp(`^\\s+solve ${LBL}: table (\\S+) secs (\\S+)$`);
const RANL = new RegExp(`^\\s+ran ${LBL}: (.*)$`);
const GAPL = new RegExp(`^\\s+gap ${LBL}: (\\S+) opening (\\d+),(\\d+)$`);
const JOINTL = new RegExp(`^\\s+joint ${LBL}: (true|false) switchMargin (\\S+) switchCharge (\\S+) scale (\\S+) cap (\\S+) deathTax (\\S+) tier (\\S+) riskAbove (\\S+)$`);
const MOVESL = new RegExp(`^\\s+moves ${LBL}: (.*)$`);
const PRICEL = new RegExp(`^\\s+price ${LBL}: (.*)$`);
const WORLDL = new RegExp(`^\\s+world ${LBL} (\\d+) (.*)$`);
const NODEL = new RegExp(`^\\s+node ${LBL} 0 z (\\S+): TS\\+J (\\S+) held0 (\\d+) OPEN2 (\\S+) held0 (\\d+) WA (\\S+) held0 (\\d+) paths (\\d+) secs (\\S+)$`);
const LOGL = new RegExp(`^\\s+log ${LBL} (TS\\+J|OPEN2|WA) year (\\d+): (.*)$`);
const ALLL = new RegExp(`^\\s+all ${LBL}: TS\\+J (\\S+) held0 (\\d+) paths (\\d+) secs (\\S+)$`);

/* 7as's logs: one job a case line, its lines by setting tag (the job's own), raw where 7as compares them with P's */
export function parse(text) {
  const jobs = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { kind: m[2], id: m[1].trim(), arm: m[3], grid: m[4], w: m[5], lambda: m[6], tier: m[7], riskAbove: m[8], mix: m[9], points: +m[10], quad: +m[11], tags: {}, dup: [], done: false }; jobs.push(cur); continue; }
    if (!cur) continue;
    const T = (a, mg, g, w) => (a === cur.arm && g === cur.grid && w === cur.w ? (cur.tags[mg] || (cur.tags[mg] = { worlds: [], log: { 'TS+J': [], OPEN2: [], WA: [] } })) : null);
    const set = (t, k, v, name) => { if (t[k] !== undefined) cur.dup.push(name); t[k] = v; };
    let t;
    if ((m = SOLVEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'table', m[5], 'solve'); t.secs = +m[6]; continue; }
    if ((m = RANL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'ran', m[5], 'ran'); continue; }
    if ((m = GAPL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'gap', { gap: m[5], open1e3: +m[6], open0: +m[7] }, 'gap'); continue; }
    if ((m = JOINTL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'joint', { joint: m[5] === 'true', margin: m[6], charge: m[7], scale: +m[8], cap: +m[9], deathTax: +m[10], tier: m[11], decided: m[12] }, 'joint'); continue; }
    if ((m = MOVESL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'movesRaw', m[5], 'moves'); continue; }
    if ((m = PRICEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'priceRaw', m[5], 'price'); continue; }
    if ((m = WORLDL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { if (t.worlds[+m[5]]) cur.dup.push(`world ${m[5]}`); t.worlds[+m[5]] = m[6]; continue; }
    if ((m = NODEL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'node', { z: +m[5], sim: { 'TS+J': +m[6], OPEN2: +m[8], WA: +m[10] }, held0: { 'TS+J': +m[7], OPEN2: +m[9], WA: +m[11] }, paths: +m[12] }, 'node'); continue; }
    if ((m = LOGL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { const L = t.log[m[5]], y = +m[6]; if (L[y]) cur.dup.push(`log ${m[5]} year ${y}`); L[y] = m[7]; continue; }
    if ((m = ALLL.exec(line)) && (t = T(m[1], m[2], m[3], m[4]))) { set(t, 'all', { sim: +m[5], held0: +m[6], paths: +m[7] }, 'all'); continue; }
    if (line.trim() === `done ${cur.kind} ${cur.arm}/${cur.grid}/W${cur.w}`) { cur.done = true; continue; }
  }
  return jobs;
}

/* P's raw lines for a unit's P tag, as 7as's parse holds them (P's parse splits them into fields; the identity is on text) */
export function pRaw(text) {
  const out = {};
  let cur = null;
  for (const line of text.split('\n')) {
    let m = /^(\S.*?)\s+case \| job core:P (\S+?)\/30x5\/W(\S+) \|/.exec(line);
    if (m) { cur = `${m[1].trim()}|${m[2]}|${m[3]}`; out[cur] = { worlds: [] }; continue; }
    if (/^\S.*?\s+case \| job /.test(line)) { cur = null; continue; }
    if (!cur) continue;
    const o = out[cur];
    if ((m = MOVESL.exec(line)) && m[2] === 'P') o.movesRaw = m[5];
    else if ((m = PRICEL.exec(line)) && m[2] === 'P') o.priceRaw = m[5];
    else if ((m = WORLDL.exec(line)) && m[2] === 'P') o.worlds[+m[5]] = m[6];
  }
  return out;
}

const sameRan = (a, b) => a === b;
export const chargeRan = (ran, c) => ran.replace(/ switchCharge 0\.001$/, ` switchCharge ${c}`);
export const sizeRan = (ran, pts, n) => ran.replace(/(^| )pts \d+(?= |$)/, `$1pts ${pts}`).replace(/(^| )grid total\d+x/, `$1grid total${pts}x`).replace(/(^| )paths \d+(?= |$)/, `$1paths ${n}`);

/* THE GATE. `ref(id, arm, w)` P's core:P tag for the unit ({table, ran, gap, joint, movesRaw, priceRaw, worlds}); `n` the
   solve's paths, `wn` the node's, `na` the all-world run's, `pts` the wealth points */
export function gate(jobs, ref, { n = N, wn = WN, na = NA, pts = 30 } = {}) {
  const bad = [];
  for (const [kind, id, a, w] of JOBS) { const k = jobs.filter(j => j.kind === kind && j.id === id && j.arm === a && j.w === w).length; if (k !== 1) bad.push(`${kind} ${id} ${a}/W${w}: ${k} job lines, not 1`); }
  for (const j of jobs) {
    const tag = `${j.kind} ${j.id} ${j.arm}/W${j.w}`, m = settingOf(j.kind);
    if (!JOBS.some(([kind, id, a, w]) => kind === j.kind && id === j.id && a === j.arm && w === j.w)) { bad.push(`${tag}: not a registered job`); continue; }
    if (!j.done) bad.push(`${tag}: not done`);
    if (j.dup.length) bad.push(`${tag}: lines twice (${j.dup.join(', ')})`);
    if (j.lambda !== P.LAMBDA || j.tier !== 'own' || j.riskAbove !== 'auto' || j.mix !== '3' || j.points !== pts || j.quad !== 5 || j.grid !== '30x5') bad.push(`${tag}: unit line settings ${j.lambda} ${j.tier} ${j.riskAbove} ${j.mix} points ${j.points} quad ${j.quad} grid ${j.grid}`);
    const tags = Object.keys(j.tags);
    if (tags.length !== 1 || tags[0] !== m) { bad.push(`${tag}: its lines carry the settings ${tags.join(', ')}, not ${m}`); continue; }
    const t = j.tags[m], r = ref(j.id, j.arm, j.w);
    if (!t.table || !t.ran || !t.gap || !t.joint || !t.movesRaw || !t.priceRaw || t.worlds.filter(Boolean).length !== 3) { bad.push(`${tag}: a solve, ran, gap, joint, moves, price or world line missing`); continue; }
    if (!r) { bad.push(`${tag}: no P record of the unit`); continue; }
    const c = m === 'P' ? '0.001' : CHARGES[m];
    if (!sameRan(t.ran, sizeRan(chargeRan(r.ran, c), pts, n))) bad.push(`${tag}: its ran line is not P's with the charge ${c}`);
    if (t.joint.joint !== true || t.joint.margin !== '0' || t.joint.charge !== c || t.joint.deathTax !== 0 || t.joint.scale !== r.joint.scale || t.joint.cap !== r.joint.cap) bad.push(`${tag}: joint line ${JSON.stringify(t.joint)}`);
    if (j.kind === 'ident:P') {
      for (const f of ['table', 'gap', 'movesRaw', 'priceRaw', 'worlds']) if (JSON.stringify(t[f]) !== JSON.stringify(r[f])) bad.push(`${tag}: its ${f} is not P's (the code since P ran)`);
      if (t.node || t.all) bad.push(`${tag}: an identity job ran forward`);
      continue;
    }
    if (!t.all || t.all.paths !== na) bad.push(`${tag}: ${t.all ? `${t.all.paths} all-world paths` : 'no all-world line'}, not ${na}`);
    if (NODE_UNITS.includes(j.id)) {
      if (!t.node || t.node.paths !== wn) bad.push(`${tag}: ${t.node ? `${t.node.paths} node paths` : 'no node line'}, not ${wn}`);
      for (const rule of RULES) for (let y = 1; y <= 10; y++) if (!t.log[rule][y]) { bad.push(`${tag}: no ${rule} decision log for year ${y}`); break; }
      if (t.node && t.node.held0.OPEN2 !== 0) bad.push(`${tag}: OPEN2 held the plan's tiers at year 0 on ${t.node.held0.OPEN2} paths`);
    } else if (t.node) bad.push(`${tag}: a node line on a unit 7as does not run at the node`);
  }
  return bad;
}

const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());
export const slice = (T, n) => ({ N: n, Y: T.Y, survived: T.survived.subarray(0, n), level: T.level.subarray(0, n * T.Y), tier: T.tier ? T.tier.subarray(0, n * T.Y) : null, wealth: T.wealth.subarray(0, n * T.Y), failYear: T.failYear.subarray(0, n) });
/* the traces: 7as's (by `${id}|${m}|${rule}` and `${id}|${m}|all`) and P's (`${id}|P|all`, and S194's node rules at P, 0 and
   1e-3), each against its own log; `bad` gains every refusal */
export function loadTraces(jobs, DIR, ST, jobsP, DIRP, STP, bad, { wn = WN, na = NA } = {}) {
  const TR = {};
  const one = (dir, st, id, arm, w, m, rule, where, count, sim, key) => {
    const f = join(dir, P.traceName(id, arm, m, rule, w, where));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); return; }
    const t = readTrace(f);
    if (!P.traceAgrees(t, st, arm, m, rule, w, sim, count, where)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); return; }
    TR[key] = decode(t);
  };
  for (const j of jobs) {
    if (!j.kind.startsWith('core:')) continue;
    const m = settingOf(j.kind), t = j.tags[m];
    if (!t || !t.all) continue;
    one(DIR, ST, j.id, j.arm, j.w, m, 'TS+J', 'all', na, t.all.sim, `${j.id}|${m}|all`);
    if (NODE_UNITS.includes(j.id) && t.node) for (const rule of RULES) one(DIR, ST, j.id, j.arm, j.w, m, rule, 'world0', wn, t.node.sim[rule], `${j.id}|${m}|${rule}`);
  }
  for (const [id, arm, w] of CORE) {
    const jp = mg => jobsP.find(x => x.kind === `core:${mg}` && x.id === id && x.arm === arm && x.w === w);
    for (const mg of ['P', '1e-3']) { const x = jp(mg), u = x && x.tags[mg]; if (!u) { bad.push(`no P core:${mg} job for ${id}`); continue; } one(DIRP, STP, id, arm, w, mg, 'TS+J', 'all', P.NA, u.all.sim, `${id}|${mg}|all`); }
    if (NODE_UNITS.includes(id)) for (const mg of ['P', '0', '1e-3']) { const x = jp(mg), u = x && x.tags[mg]; if (!u) { bad.push(`no P core:${mg} job for ${id}`); continue; } for (const rule of RULES) one(DIRP, STP, id, arm, w, mg, rule, 'world0', P.WN, u.node.sim[rule], `${id}|${mg}|${rule}`); }
  }
  // the pairing: this run's paths are P's first paths (seed and count are checked above); the all-world legs read P's first na
  for (const k of Object.keys(TR)) if ((k.endsWith('|P|all') || k.endsWith('|1e-3|all')) && TR[k].N > na) TR[k] = slice(TR[k], na);
  // P's node traces at the run's node paths (equal at the registered size, WN = P's 16,000; the preflight's fewer)
  for (const k of Object.keys(TR)) { const [id, m, rule] = k.split('|'); if (NODE_UNITS.includes(id) && ['P', '0', '1e-3'].includes(m) && rule !== 'all' && TR[k].N > wn) TR[k] = slice(TR[k], wn); }
  return TR;
}

/* THE SPLIT: `o` and `a` per-path whole-score differences (the charge less the margin) under OPEN2 and under WA */
export const B = 20000;
export function splitItem(o, a, { b = B } = {}) {
  const mean = xs => xs.reduce((t, x) => t + x, 0) / (xs.length || 1);
  const pSlice = flipP(o.map(x => -x), b, 7101), slice = pSlice < ALPHA && mean(o) < 0;
  const L = -mean(o), A = -mean(a);
  if (!slice) return { L, A, share: NaN, pSlice, read: 'INCONCLUSIVE', note: 'NO SLICE' };
  const r = readTwo(flipP(a.map((x, j) => x - o[j] / 3), b, 7102), flipP(a.map((x, j) => (2 / 3) * o[j] - x), b, 7103));
  return { L, A, share: A / L, pSlice, ...r };
}
/* THE ITEMS over pure inputs, so the planted set reaches them. K(id, m) - the all-world paired cells of TS+J at m against
   TS+J at P ({a, lost, saved, d, N}: lost = P survives and m fails); W(id, m) - wholeLeg of TS+J at m against TS+J at P across
   all worlds; NL(n, m) - item n's node leg at S194 (NODE_ITEMS: 2 OPEN2, 3 the world-aware chooser) at m against
   P's at 1e-3; mar(id) - the unit's survival margin */
const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);
export function readLeg(l, mg) {
  const flat = l.down.outcome === 'no material harm' && l.up.outcome === 'no material harm' && l.u.lo > -mg && l.u.hi < mg && l.w.lo > -MW && l.w.hi < MW;
  const changes = l.down.outcome === 'harm' || l.up.outcome === 'harm' || l.w.hi < -MW || l.w.lo > MW;
  return changes ? 'CHANGES' : flat ? 'FLAT' : 'INCONCLUSIVE';
}
export function items(K, W, NL, SP, mar) {
  const legs = CORE.flatMap(([id]) => Object.keys(CHARGES).map(m => ({ id, m, k: K(id, m), w: W(id, m), mg: mar(id) })));
  // each direction's exact one-sided harm p, Holm over the six legs a direction
  legs.forEach(l => { l.pDown = mcnemarHarmP(l.k.lost, l.k.saved); l.pUp = mcnemarHarmP(l.k.saved, l.k.lost); });
  const hD = holm(legs.map(l => l.pDown)), hU = holm(legs.map(l => l.pUp));
  legs.forEach((l, i) => {
    l.down = outcome({ b: l.k.lost, c: l.k.saved, N: l.k.N, margin: l.mg, pHolm: hD[i], level: ALPHA });
    l.up = outcome({ b: l.k.saved, c: l.k.lost, N: l.k.N, margin: l.mg, pHolm: hU[i], level: ALPHA });
    l.u = guardedU(l.k); l.read = readLeg(l, l.mg);
  });
  const o1 = legs.every(l => l.read === 'FLAT') ? 'HELD' : legs.some(l => l.read === 'CHANGES') ? 'FALSIFIED' : 'INCONCLUSIVE';
  const w2 = NL(2, 'C2'), o2 = w2.lo > -MW ? 'HELD' : w2.hi < -MW ? 'FALSIFIED' : 'INCONCLUSIVE';
  const s3 = SP('C2'), o3 = s3.read;
  return { legs, o1, w2, o2, s3, o3 };
}

const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const iv = p => `${f3(p.d)} (${p.lo.toFixed(3)} to ${p.hi.toFixed(3)})`;
/* THE READING, after every gate has passed. `TR` the traces; `tagP(id, m)` P's parsed tag; `tag(id, m)` 7as's */
export function reading(TR, tagP, tag, out = console.log) {
  const cfgOf = (id, X, Y) => { const u = tagP(id, 'P'); return { lambda: Number(P.field(u.ran, 'lambda')), floor: Math.min(...P.field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(CORE.find(c => c[0] === id)[2]), spendYears: F.spendYears(X, Y) }; };
  const leg = (id, X, Y) => A.wholeLeg(X, Y, cfgOf(id, X, Y), ALPHA);
  const K = (id, m) => cells(TR[`${id}|P|all`].survived, TR[`${id}|${m}|all`].survived);
  const W = (id, m) => leg(id, TR[`${id}|P|all`], TR[`${id}|${m}|all`]);
  const NL = (n, m) => leg('S194', TR[NODE_ITEMS[n][0]], TR[`S194|${m}|${NODE_ITEMS[n][1]}`]);
  const perPath = (X, Y) => { const c = cfgOf('S194', X, Y), x = A.wholePaths(X, c), y = A.wholePaths(Y, c); return Array.from(y, (v, j) => v - x[j]); };
  const SP = m => splitItem(perPath(TR[NODE_ITEMS[2][0]], TR[`S194|${m}|${NODE_ITEMS[2][1]}`]), perPath(TR[NODE_ITEMS[3][0]], TR[`S194|${m}|${NODE_ITEMS[3][1]}`]));
  const mar = id => { const s = TR[`${id}|P|all`].survived; let k = 0; for (let i = 0; i < s.length; i++) k += s[i]; return marginFor(100 * k / s.length); };
  const I = items(K, W, NL, SP, mar);
  out(`7AS: THE CHARGE'S SIZE AND S194'S BAD-WORLD SLICE (predictions/diag-7as.md): P's three units at switchCharge 0.0005 and 0.002 (margin 0) against P's 0.001, ${NA} paths of seed ${SEED} across all worlds, ${WN} at S194's bad node; P's records through P's gate, P's 0.001 solved again and identical`);
  out('\nTHE JOBS: the table, the year-0 gap on top of the charge, the opening, by charge');
  for (const [id] of CORE) out(`  ${id.padEnd(9)} ${[['0.0005', tag(id, 'C05')], ['0.001', tagP(id, 'P')], ['0.002', tag(id, 'C2')]].map(([c, u]) => `${c}: table ${u.table} gap ${u.gap.gap} opening ${u.gap.open0}`).join(' | ')}`);
  out(`\nITEM 1 (the charge's size across all worlds, primary): TS+J at each charge against TS+J at 0.001 (P's first ${NA} paths), survival both ways by the exact rule (Holm over 6 a direction) and the guarded interval at the unit's margin, and the whole score inside +/-${MW}`);
  for (const l of I.legs) out(`  ${l.id.padEnd(9)} ${CHARGES[l.m].padEnd(6)} ${l.k.saved} saved/${l.k.lost} lost of ${l.k.N} | survival ${f3(l.down.d)} (exact ${l.down.lo.toFixed(3)} to ${l.down.hi.toFixed(3)}; guarded ${l.u.lo.toFixed(3)} to ${l.u.hi.toFixed(3)}; margin ${l.mg}) down ${l.down.outcome}, up ${l.up.outcome} | whole ${iv(l.w)} | ${l.read}`);
  out(`  -> ${I.o1} (HELD when all six legs are FLAT; FALSIFIED when any CHANGES)`);
  out(`\nITEM 2 (S194's slice at double the charge): OPEN2 at 0.002 against OPEN2 at 1e-3 at the node, the whole score: ${iv(I.w2)} (survival part ${f3(I.w2.sd)}, the rest ${f3(I.w2.rest)})`);
  out(`  -> ${I.o2} (HELD when the lower end is above -${MW}; FALSIFIED when the upper end is below -${MW}; a dose-response - more switching friction against the re-risking - that attributes nothing by itself)`);
  { const t = I.s3; out(`\nITEM 3 (the split, O50): at the node, path by path, OPEN2's move (0.002 less the margin; the slice ${f3(-t.L)} a path, its test p ${t.pSlice.toExponential(2)}) against WA's move (${f3(-t.A)} a path): WA's share of the slice ${Number.isFinite(t.share) ? t.share.toFixed(2) : '-'}${t.note ? '' : `; HELD side mean(a - o/3) p ${t.pU.toExponential(2)} Holm ${t.hU.toExponential(2)}; FALSIFIED side mean(2o/3 - a) p ${t.pD.toExponential(2)} Holm ${t.hD.toExponential(2)}`}`);
    out(`  -> ${t.read}${t.note ? ` (${t.note})` : ''} (HELD: WA's move a third of the slice or less, the slice the world-blind chooser's; FALSIFIED: two thirds or more, the charge's own)`); }
  out('  the same contrast at the other charges (reported): ' + ['C05', 'P'].map(m => { const t = SP(m); return `${m === 'P' ? '0.001' : '0.0005'}: slice ${f3(-t.L)}, WA ${f3(-t.A)}, share ${Number.isFinite(t.share) ? t.share.toFixed(2) : '-'} (${t.read}${t.note ? ', ' + t.note : ''})`; }).join('; '));
  out('\nREPORTED: S194\'S NODE SLICE BY CHARGE (against OPEN2 at 1e-3, P\'s; saved/lost, survival, the whole score), and TS+J against TS+J at 1e-3 beside it');
  for (const [c, m] of [['0 (margin 0)', '0'], ['0.0005', 'C05'], ['0.001', 'P'], ['0.002', 'C2']]) {
    const row = RULES.map(rule => { const X = TR[`S194|1e-3|${rule}`], Y = TR[`S194|${m}|${rule}`], k = cells(X.survived, Y.survived), w = leg('S194', X, Y); return `${rule} ${k.saved}/${k.lost} whole ${iv(w)}`; });
    out(`  ${c.padEnd(13)} ${row.join(' | ')}`);
  }
  out('\nREPORTED: ACROSS ALL WORLDS AGAINST THE MARGIN (TS+J at each charge against TS+J at 1e-3, P\'s first paths; saved/lost and the whole score)');
  for (const [id] of CORE) out(`  ${id.padEnd(9)} ${[['0.0005', 'C05'], ['0.001', 'P'], ['0.002', 'C2']].map(([c, m]) => { const X = TR[`${id}|1e-3|all`], Y = TR[`${id}|${m}|all`], k = cells(X.survived, Y.survived); return `${c}: ${k.saved}/${k.lost} whole ${iv(leg(id, X, Y))}`; }).join(' | ')}`);
  out(`\nOUTCOME: 1 ${I.o1}; 2 ${I.o2}; 3 ${I.o3}`);
  return I;
}

/* PLANTED */
const REACHED = { 1: new Set(), 2: new Set(), 3: new Set() }, EDGES = [];
export function builtLog(o = {}) {
  const lines = [], ranP = id => `mix 3 pts 30 seed 7002 paths ${N} grid total30x5x5 lambda ${P.LAMBDA} levels 1,0.9,0.8 quad 5 tierState true bequestWeight ${CORE.find(c => c[0] === id)[2]} finalIntegral true bridgeRead x switchMargin 0 switchCharge 0.001`;
  for (const [kind, id, a, w] of JOBS) {
    if (o.skip === `${kind}|${id}`) continue;
    const m = settingOf(kind), c = m === 'P' ? '0.001' : CHARGES[m], L = `${a}/TS+J/M${m}/30x5/W${w}`;
    lines.push(`${id.padEnd(16)} case | job ${kind} ${a}/30x5/W${w} | lambda ${P.LAMBDA} tier own riskAbove auto mix 3 points 30 quad 5`);
    lines.push(`${''.padEnd(16)} solve ${L}: table ${o.table && kind === 'ident:P' && id === 'S126' ? '91.0000' : '90.0000'} secs 100`);
    lines.push(`${''.padEnd(16)} ran ${L}: ${o.ran && m === 'C2' && id === 'S194' ? chargeRan(ranP(id), '0.001') : chargeRan(ranP(id), c)}`);
    lines.push(`${''.padEnd(16)} gap ${L}: 1.0000e-3 opening 2,2`);
    lines.push(`${''.padEnd(16)} joint ${L}: true switchMargin ${o.margin && m === 'C05' ? '0.001' : '0'} switchCharge ${o.charge && m === 'C05' && id === 'bridge 4' ? '0.001' : c} scale 180000 cap 720000 deathTax 0 tier own riskAbove off`);
    lines.push(`${''.padEnd(16)} moves ${L}: best 3 2/2 stay 1 0/0 chosen 3 2/2 held 0/0`);
    lines.push(`${''.padEnd(16)} price ${L}: mixture 1.0e-1 like-for-like whole 1.0e-1 survival 1.0e-1`);
    for (let k = 0; k < 3; k++) if (!(o.noWorld && kind === 'core:C2' && id === 'S126' && k === 2)) lines.push(`${''.padEnd(16)} world ${L} ${k} z 0.0000 weight 0.3333: whole 0.1 survival 0.1`);
    if (kind.startsWith('core:')) {
      if (NODE_UNITS.includes(id) || (o.extraNode && id === 'bridge 4' && m === 'C2')) {
        if (!(o.noNode && m === 'C05')) lines.push(`${''.padEnd(16)} node ${L} 0 z -1.7321: TS+J 91.0000 held0 0 OPEN2 91.0000 held0 ${o.held && m === 'C2' ? 5 : 0} WA 93.0000 held0 0 paths ${o.nodePaths && m === 'C2' ? 8000 : WN} secs 10`);
        for (const rule of RULES) for (let y = 1; y <= 10; y++) if (!(o.noLog && m === 'C2' && rule === 'OPEN2' && y === 4)) lines.push(`${''.padEnd(16)} log ${L} ${rule} year ${y}: held 10 fwdLeave 1 cellLeave 1 fwdHoldCellLeave 0 fwdLeaveCellHold 0 marginHold 0`);
      }
      if (!(o.noAll && m === 'C2' && id === 'bridge 4')) lines.push(`${''.padEnd(16)} all ${L}: TS+J 98.0000 held0 0 paths ${o.allPaths && m === 'C05' && id === 'S126' ? 16000 : NA} secs 10`);
    } else if (o.identRan && id === 'S194') lines.push(`${''.padEnd(16)} all ${L}: TS+J 98.0000 held0 0 paths ${NA} secs 10`);
    if (!(o.noDone && kind === 'core:C05' && id === 'S194')) lines.push(`${''.padEnd(16)} done ${kind} ${a}/30x5/W${w}`);
  }
  if (o.extra) lines.push(`S999             case | job core:C2 READER/30x5/W0 | lambda ${P.LAMBDA} tier own riskAbove auto mix 3 points 30 quad 5`);
  return lines.join('\n') + '\n';
}
function planted() {
  const cases = [];
  const base = parse(builtLog());
  const refOf = (o = {}) => id => { const j = base.find(x => x.kind === 'ident:P' && x.id === id); if (!j) return null; const t = { ...j.tags.P }; if (o.refGap && id === 'S194') t.gap = { ...t.gap, gap: '2.0000e-3' }; if (o.refScale && id === 'S126') t.joint = { ...t.joint, scale: 1 }; return t; };
  const refused = (o, ro = {}) => { try { return String(gate(parse(builtLog(o)), refOf(ro)).length > 0); } catch (e) { return `crash: ${e.message}`; } };
  { const bad = gate(base, refOf()); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o, ro] of [['a missing job', { skip: 'core:C05|S126' }], ['an unregistered job', { extra: true }], ['a job not done', { noDone: true }], ['a ran line with P\'s charge on a 0.002 job', { ran: true }],
    ['a margin on a charged job', { margin: true }], ['the wrong charge on the joint line', { charge: true }], ['a missing world line', { noWorld: true }], ['a missing node line', { noNode: true }],
    ['8,000 node paths', { nodePaths: true }], ['a missing decision-log year', { noLog: true }], ['OPEN2 holding the plan\'s tiers', { held: true }], ['a missing all-world line', { noAll: true }],
    ['16,000 all-world paths', { allPaths: true }], ['a node line on bridge 4', { extraNode: true }], ['an identity job that ran forward', { identRan: true }],
    ['an identity table off P\'s', { table: true }], ['an identity gap off P\'s', {}, { refGap: true }], ['a scale off P\'s', {}, { refScale: true }]]) cases.push([`the gate refuses ${nm}`, refused(o, ro), 'true']);
  // the items, on built cells and legs
  const k = (lost, saved, n = 8000) => ({ a: n - lost - saved - 100, lost, saved, d: 100, N: n });
  const w = (d, h = 0.1) => ({ d, lo: d - h, hi: d + h, sd: d, rest: 0 });
  // a node leg read at any charge but 0.002 reads -9, so a misread charge shows
  const run = (K, W, w2, mg = 0.25, w3 = { read: 'HELD' }) => { const I = items(K, W, (n, m) => (m !== 'C2' ? w(-9) : n === 2 ? w2 : null), m => (m !== 'C2' ? { read: 'WRONG' } : w3), () => mg); REACHED[1].add(I.o1); REACHED[2].add(I.o2); REACHED[3].add(I.o3); return I; };
  { const I = run(() => k(2, 2), () => w(0), w(0)); cases.push(['every leg level, the slice gone at 0.002: 1 HELD, 2 HELD', `${I.o1} ${I.o2}`, 'HELD HELD']); }
  { const I = run((id, m) => (id === 'S194' && m === 'C2' ? k(60, 0) : k(2, 2)), () => w(0), w(-0.5)); cases.push(['0.002 loses 60 paths of 8,000 on S194 (harm), the slice stays at -0.5: 1 FALSIFIED, 2 FALSIFIED', `${I.o1} ${I.o2}`, 'FALSIFIED FALSIFIED']); }
  { const I = run((id, m) => (id === 'S126' && m === 'C05' ? k(0, 60) : k(2, 2)), () => w(0), w(0)); cases.push(['0.0005 saves 60 paths on S126: harm the other way, so the value matters: 1 FALSIFIED', I.o1, 'FALSIFIED']); }
  { const I = run(() => k(2, 2), (id, m) => (id === 'bridge 4' && m === 'C2' ? w(0.4) : w(0)), w(-0.2)); cases.push(['a whole score wholly above +MW on one leg: FALSIFIED; the slice at -0.2 (lower end -0.3): 2 INCONCLUSIVE', `${I.o1} ${I.o2}`, 'FALSIFIED INCONCLUSIVE']); }
  { const I = run(() => k(2, 2), (id, m) => (id === 'S194' && m === 'C05' ? w(0.2) : w(0)), w(0)); cases.push(['a whole score at +0.2 (upper end +0.3) on one leg: INCONCLUSIVE, not FLAT', `${I.o1} ${I.legs.find(l => l.id === 'S194' && l.m === 'C05').read}`, 'INCONCLUSIVE INCONCLUSIVE']); }
  { const I = run(() => k(0, 0), () => w(0), w(0)); cases.push(['no discordant path on any leg: FLAT, HELD (0 of 0 is no material harm)', I.o1, 'HELD']); EDGES.push('no discordant path'); }
  { const I = run(() => k(2, 2), () => w(0, MW), w(0)); cases.push(['a whole interval with its ends exactly at -MW and +MW: not inside, INCONCLUSIVE', I.o1, 'INCONCLUSIVE']); EDGES.push('a whole interval ending exactly at the margin'); }
  { const I = run(() => k(2, 2), () => w(0), w(-MW + 0.1, 0.1)); cases.push(['the slice\'s lower end exactly at -MW: not HELD', I.o2, 'INCONCLUSIVE']); EDGES.push('the slice at the margin'); }
  { const I = run((id, m) => (id === 'S194' && m === 'C2' ? k(60, 40) : k(2, 2)), () => w(0), w(0)); const l = I.legs.find(x => x.id === 'S194' && x.m === 'C2');
    cases.push(['60 lost against 40 saved on one leg (point -0.25, one-sided p about 0.03): Holm over 6 lifts p over 0.05, so not harm and not flat: INCONCLUSIVE', `${l.pDown < 0.05} ${l.down.outcome} ${I.o1}`, 'true inconclusive INCONCLUSIVE']); EDGES.push('p at the Holm boundary'); }
  { const I = run((id, m) => (id === 'S126' && m === 'C2' ? k(12, 0) : k(2, 2)), () => w(0), w(0)); const l = I.legs.find(x => x.id === 'S126' && x.m === 'C2');
    cases.push(['12 lost, none saved: the exact rule reads no material harm, the guarded interval does not (lower end under -0.25): not FLAT, INCONCLUSIVE', `${l.down.outcome} ${l.u.lo < -0.25} ${I.o1}`, 'no material harm true INCONCLUSIVE']); }
  { const I = run((id, m) => (id === 'S126' && m === 'C05' ? k(34, 37) : k(2, 2)), () => w(0), w(0)); const l = I.legs.find(x => x.id === 'S126' && x.m === 'C05');
    cases.push(['34 lost against 37 saved: the guarded interval inside the margin, the exact rule the other way (up) not no material harm: not FLAT, INCONCLUSIVE', `${l.u.lo > -0.25 && l.u.hi < 0.25} ${l.up.outcome} ${I.o1}`, 'true inconclusive INCONCLUSIVE']); }
  { // item 3 over built per-path differences (400 paths): o the slice, a WA's move
    const n = 400, noise = j => 0.3 * Math.sin(j * 1.7), o = Array.from({ length: n }, (_, j) => -0.3 + noise(j)), mk = f => Array.from({ length: n }, (_, j) => f(j));
    const r = (oo, aa) => { const t = splitItem(oo, aa, { b: 2000 }); REACHED[3].add(t.read); return t; };
    cases.push(['item 3: WA unmoved, the slice -0.3: HELD (the world-blind chooser\'s)', r(o, mk(j => 0.1 * Math.cos(j * 2.3))).read, 'HELD']);
    cases.push(['item 3: WA moves as OPEN2 does: FALSIFIED (the charge\'s own)', r(o, mk(j => o[j] + 0.02 * Math.cos(j * 2.3))).read, 'FALSIFIED']);
    cases.push(['item 3: WA moves half the slice: INCONCLUSIVE', r(o, mk(j => o[j] / 2)).read, 'INCONCLUSIVE']);
    cases.push(['item 3: WA gains while OPEN2 loses: HELD, not FALSIFIED (the charge helps an informed chooser)', r(o, mk(j => 0.3 + 0.05 * Math.cos(j))).read, 'HELD']);
    { const t = r(mk(j => noise(j)), mk(() => 0)); cases.push(['item 3: no slice (OPEN2 noise about 0): INCONCLUSIVE, NO SLICE', `${t.read} ${t.note}`, 'INCONCLUSIVE NO SLICE']); EDGES.push('no slice to split'); }
    { const t = r(o, mk(j => o[j] / 3)); cases.push(['item 3: WA exactly a third of the slice on every path: not HELD (the mean of a - o/3 is 0)', t.read, 'INCONCLUSIVE']); EDGES.push('WA at exactly a third of the slice'); }
    cases.push(['items carries item 3\'s split through', run(() => k(2, 2), () => w(0), w(0), 0.25, { read: 'FALSIFIED' }).o3, 'FALSIFIED']); }
  cases.push(['item 2 reads OPEN2 against P\'s OPEN2 at the margin, item 3 the world-aware chooser against P\'s at the margin', JSON.stringify(NODE_ITEMS), JSON.stringify({ 2: ['S194|1e-3|OPEN2', 'OPEN2'], 3: ['S194|1e-3|WA', 'WA'] })]);
  cases.push(['chargeRan swaps the charge at the ran line\'s end only', chargeRan('a switchCharge 0.001 b switchCharge 0.001', '0.002'), 'a switchCharge 0.001 b switchCharge 0.002']);
  cases.push(['slice keeps the first paths', (() => { const T = { N: 3, Y: 2, survived: Uint8Array.from([1, 0, 1]), level: Uint8Array.from([1, 2, 3, 4, 5, 6]), tier: null, wealth: Float32Array.from([1, 2, 3, 4, 5, 6]), failYear: Int16Array.from([-1, 1, -1]) }; const S = slice(T, 2); return `${S.N} ${[...S.survived]} ${[...S.level]} ${[...S.failYear]}`; })(), '2 1,0 1,2,3,4 -1,1']);
  { const src = readFileSync(join(HERE, 'audit-7as.mjs'), 'utf8');
    cases.push(['the jobs are audit-7as.mjs\'s: C2 and C05 on the three units, then P\'s identity', String(/\['C2', 'C05'\]\.flatMap/.test(src) && /'ident:P'/.test(src) && /C05: \{ switchMargin: 0, switchCharge: 0\.0005 \}/.test(src) && /C2: \{ switchMargin: 0, switchCharge: 0\.002 \}/.test(src) && /NODE_UNITS = \['S194'\]/.test(src) && /RULESP = \['TS\+J', 'OPEN2', 'WA'\]/.test(src)), 'true']); }
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3].map(i => `OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const d = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = d(0, 'diag7as'), DIRP = d(1, 'diagP');
  const logs = logsOf(DIR), jobs = Object.values(logs).flatMap(parse);
  if (JOBS.some(([kind, id, a, w]) => !jobs.some(j => j.kind === kind && j.id === id && j.arm === a && j.w === w && j.done))) { console.log(`INCOMPLETE - ${jobs.filter(j => j.done).length} of ${JOBS.length} jobs done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  // P's records through P's own gate (its chain through theirs)
  const { R } = P.loadRefs(d(2, 'diag7ae'), d(3, 'diag7ad'), d(4, 'diag7ac'), d(5, 'diag7aa'), d(6, 'diag7af'), d(7, 'diag7ag'));
  const logsP = logsOf(DIRP), jobsP = Object.values(logsP).flatMap(P.parse);
  requireFairLogs(logsP, P.PRED);
  { const b = P.gate(jobsP, R); if (b.length) { console.log(`FAIR-TEST GATE (P): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
  const raw = Object.assign({}, ...Object.values(logsP).map(pRaw));
  const tagP = (id, m) => { const j = jobsP.find(x => x.kind === `core:${m}` && x.id === id); return j ? j.tags[m] : null; };
  const ref = (id, arm, w) => { const t = tagP(id, 'P'), r = raw[`${id}|${arm}|${w}`]; return t && r ? { table: t.table, ran: t.ran, gap: t.gap, joint: t.joint, movesRaw: r.movesRaw, priceRaw: r.priceRaw, worlds: r.worlds } : null; };
  const bad = gate(jobs, ref);
  const TR = bad.length ? {} : loadTraces(jobs, DIR, P.stampOf(logs), jobsP, DIRP, P.stampOf(logsP), bad);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${JOBS.length} jobs; P's records through P's gate; P's 0.001 solved again identical to P's on the three units (table, ran, gap, joint, moves, price, worlds); every charged job P's ran line but the charge; every line and trace present and agreeing with its log; the pairing on P's first paths`);
  const tag = (id, m) => { const j = jobs.find(x => x.kind === `core:${m}` && x.id === id); return j.tags[m]; };
  reading(TR, tagP, tag);
}
