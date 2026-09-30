/*
 * THE 7AP REDUCER: THE ALLOWANCE TEST (predictions/diag-7ap.md; PLAN.md 7ap; O71, O66, O69; the deep review after 7al,
 * deep-review-log.md 30 Sep 22:51 UK, its decisive test). Reads results/diag7ap/case*.txt (batch-7ap.sh: audit-7ap.mjs,
 * one process a unit) beside 7al's records (results/diag7al), each read through its own stamps.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7ap and of 7al;
 *   - every registered unit once and done, nothing unregistered;
 *   - each unit's settings, as 7al's gate holds them: lambda held, the plan's tier, 'auto' risk above, three worlds; 30
 *     points, seed 7002, 2,000 paths a world, the estate weight 0.02, the final year exact, the bridge read the arm's (reader
 *     on READER, false on OFF), the tier state and one move for every world, no readerRef; the switch margin 0.001, no
 *     pension death charge (O53);
 *   - THE AXIS: an axis line on every unit, the buckets 0,0.5,1, pclsStrict false, and pclsInterp true on the PCLSI units
 *     alone - the one setting the arms differ in;
 *   - IDENTITY: every DEFAULT unit is 7al's unit line for line - its table, ran line, gap and opening, joint line, access
 *     line, and every bridgeref, node, stage, resid, cell, wcell and band line (the same code with the option off, the
 *     same seed and paths: so the grid change is bit-identical off, and the DEFAULT arm is the one 7al read);
 *   - TWINS: every PCLSI unit's ran, joint (but the gap and opening, which the tables set) and access lines are its
 *     DEFAULT twin's;
 *   - COMPLETE, per world: 7al's lines (a bridgeref, a node line of 2,000 paths, both stage lines, a resid line for every
 *     year 0 to the plan's end, the 16 cell, wcell and band lines) and 7ap's (an lsa line for every year, the 8 pcell lines
 *     and the 4 wall lines);
 *   - CONSISTENT: 7al's checks (the paths through the bridge are the engine's paid count and the after stage's paths; the
 *     after stage's survivors are the node's sim; every path claims at year 0; each stage's mean times its paths is the
 *     resid lines' sum over its years); and 7ap's: each year's lsa paths are its resid paths, and the pcell and wall
 *     lines' path-years and residual sums over a stage are the resid lines' over the stage's years, to their rounding.
 * THE ITEMS, by the registered rule (the crossing units S370 and S130 READER, each pooled over its three worlds as 7al
 * pooled them: n paths alive at access, c their mean claim there, s the survivors; the margin D = 2 points, 7al's):
 *   1. THE SNAP'S SHARE (primary; cause 1 against cause 2): does interpolating the allowance axis remove at least half of
 *      the post-access optimism the DEFAULT arm carries? Per crossing unit, h = half the DEFAULT unit's point (c - 100 s/n,
 *      7al's figure, the gate holding it to 7al's record; taken as known - its own sampling error, about 0.5 points, is a
 *      stated limit). The PCLSI unit reads HALVED when the Clopper-Pearson 95% lower end of its s/n, in points, is c - h or
 *      more; NOT HALVED when the binomial lower tail P(Bin(n, (c - h)/100) <= s) is under 0.05 after Holm over the 2 units
 *      and its point is h or more; else INCONCLUSIVE (the tail conservative for unequal chances: Hoeffding 1956, as 7al).
 *      The item: HELD when both read HALVED; FALSIFIED when both read NOT HALVED; else INCONCLUSIVE.
 *   2. THE CURE: does the PCLSI arm read calibrated after access? 7al's rule on the PCLSI crossing units (OPTIMISTIC: the
 *      binomial tail at (c - D) under 0.05 after Holm over 2 and the point D or more; NO MATERIAL OPTIMISM: the CP lower
 *      end c - D or more; else INCONCLUSIVE). HELD when both read NO MATERIAL OPTIMISM; FALSIFIED when both read
 *      OPTIMISTIC; else INCONCLUSIVE.
 *   3. THE CONTROL: S194 OFF under PCLSI (a household that cannot cross 0.75 of the allowance): 7al's rule, one unit.
 *      HELD when it reads NO MATERIAL OPTIMISM (the option adds no optimism where the snap has none to remove); FALSIFIED
 *      when it reads OPTIMISTIC; else INCONCLUSIVE.
 * Reported, not items: both arms' per-unit and per-world after-stage reads side by side; the bridge stage; the residual
 * by bucket change and share position (pcell: the auditor's MINOR 3 of 30 Sep 23:04 UK - the concentration on bucket-change
 * path-years does not by itself separate the causes, so it is split by the share axis's cell position) and by the wall;
 * the used allowance by year (mean, at the wall, over it, bucket changes); the per-year residual in plan years (access
 * named by its year).
 *   node research/solver/reduce-7ap.mjs [dir] [dir7al] > research/solver/results-7ap.txt
 *   node research/solver/reduce-7ap.mjs --planted   the planted checks alone, and the outcomes they reach (OUTCOMES REACHED)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson, holm } from './stats.mjs';
import * as AL from './reduce-7al.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ap.md';
export const { field, LAMBDA, binomLower, readOf, poolOf, normRan } = AL;
export const PTS = '30', SEED = '7002', W = '0.02', NPW = 2000, K = 3, ALPHA = 0.05, D = 2;
// audit-7ap.mjs's units, in its order ([case, arm, setting, axis]); a planted check holds the two lists together
export const UNITS7 = [['S370', 'READER', 'TS+J', 'DEFAULT'], ['S370', 'READER', 'TS+J', 'PCLSI'], ['S130', 'READER', 'TS+J', 'DEFAULT'], ['S130', 'READER', 'TS+J', 'PCLSI'], ['S194', 'OFF', 'TS+J', 'DEFAULT'], ['S194', 'OFF', 'TS+J', 'PCLSI']];
export const labelOf = (s, x) => `${s}/W${W}${x === 'PCLSI' ? '/PCLSI' : ''}`;
export const UNITS = UNITS7.map(([id, a, s, x]) => [id, a, labelOf(s, x), x]);
export const CROSSING = ['S370', 'S130'], CONTROL = 'S194';
const isP = l => l.endsWith('/PCLSI'), twinOf = l => l.replace(/\/PCLSI$/, '');

const AXISL = /^\s+axis (\S+?)\/(\S+): pclsInterp (true|false) pcls (\S+) pclsStrict (true|false)$/;
const LSAL = /^\s+lsa (\S+?)\/(\S+) world (\d+) year (\d+): paths (\d+) used (\S+) wall (\d+) over (\d+) chg (\d+)$/;
const PCELLL = /^\s+pcell (\S+?)\/(\S+) world (\d+) (bridge|after) (chg|same) (mid|near): pathyears (\d+) table (\S+) next (\S+)$/;
const WALLL = /^\s+wall (\S+?)\/(\S+) world (\d+) (bridge|after) (wall|off): pathyears (\d+) table (\S+) next (\S+)$/;
const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \| lambda /;
const num = x => (x === '-' ? NaN : Number(x));

/* 7al's parse, and 7ap's own lines beside it */
export function parse(text) {
  const units = AL.parse(text);
  let cur = null, i = -1;
  for (const line of text.split('\n')) {
    if (CASEL.test(line)) { cur = units[++i]; Object.assign(cur, { axis: null, lsa: [], pcell: [], wall: [] }); continue; }
    if (!cur) continue;
    let m;
    const mine = (a, l) => a === cur.arm && l === cur.label;
    if ((m = AXISL.exec(line)) && mine(m[1], m[2])) cur.axis = { interp: m[3] === 'true', pcls: m[4], strict: m[5] === 'true' };
    else if ((m = LSAL.exec(line)) && mine(m[1], m[2])) cur.lsa.push({ k: +m[3], t: +m[4], n: +m[5], used: num(m[6]), wall: +m[7], over: +m[8], chg: +m[9] });
    else if ((m = PCELLL.exec(line)) && mine(m[1], m[2])) cur.pcell.push({ k: +m[3], stage: m[4], chg: m[5], pos: m[6], n: +m[7], table: num(m[8]), next: num(m[9]) });
    else if ((m = WALLL.exec(line)) && mine(m[1], m[2])) cur.wall.push({ k: +m[3], stage: m[4], at: m[5], n: +m[6], table: num(m[7]), next: num(m[8]) });
  }
  return units;
}
const one = (xs, f) => xs.filter(f);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byKT = xs => [...xs].sort((x, y) => x.k - y.k || (x.t ?? 0) - (y.t ?? 0) || String(x.stage + x.kind + x.key).localeCompare(String(y.stage + y.kind + y.key)));

/* THE GATE. `ref(id, arm, label)` 7al's parsed unit (reduce-7al.mjs parse); `pts` and `npw` the run's size */
export function gate(units, ref, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const [id, a, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === a && u.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    if (u.table === undefined || !u.ran || !u.gap || !u.joint) { bad.push(`${tag}: a solve, ran, gap or joint line missing`); continue; }
    const want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, finalIntegral: 'true', bridgeRead: u.arm === 'OFF' ? 'false' : 'reader', mix: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (field(u.ran, 'tierState') === null) bad.push(`${tag}: no tier state`);
    if (field(u.ran, 'readerRef') !== null) bad.push(`${tag}: readerRef ${field(u.ran, 'readerRef')}`);
    if (u.joint.joint !== true) bad.push(`${tag}: not one move for every world`);
    if (u.joint.margin !== '0.001') bad.push(`${tag}: switch margin ${u.joint.margin}`);
    if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax} (O53)`);
    // the axis
    if (!u.axis) bad.push(`${tag}: no axis line`);
    else if (u.axis.interp !== isP(u.label) || u.axis.pcls !== '0,0.5,1' || u.axis.strict !== false) bad.push(`${tag}: the allowance axis pclsInterp ${u.axis.interp} pcls ${u.axis.pcls} pclsStrict ${u.axis.strict}`);
    const ac = u.access;
    if (!ac) { bad.push(`${tag}: no access line`); continue; }
    // identity (DEFAULT) and twins (PCLSI)
    if (!isP(u.label)) {
      const r = ref(u.id, u.arm, u.label);
      if (!r) bad.push(`${tag}: no unit in 7al's records`);
      else {
        for (const f of ['table', 'ran', 'gap', 'joint', 'access']) if (!same(r[f], u[f])) bad.push(`${tag}: its ${f} is not 7al's`);
        for (const f of ['bref', 'node', 'stage', 'resid', 'cells']) if (!same(byKT(r[f] || []), byKT(u[f]))) bad.push(`${tag}: its ${f} lines are not 7al's`);
      }
    } else {
      const tw = get(u.id, u.arm, twinOf(u.label));
      if (tw) {
        if (u.ran !== tw.ran) bad.push(`${tag}: its ran line is not its DEFAULT twin's`);
        if (!same(u.access, tw.access)) bad.push(`${tag}: its access line is not its DEFAULT twin's`);
        if (u.joint.scale !== tw.joint.scale || u.joint.cap !== tw.joint.cap || u.joint.decided !== tw.joint.decided) bad.push(`${tag}: its joint line is not its DEFAULT twin's`);
      }
    }
    // complete
    if (ac.worlds !== K) bad.push(`${tag}: ${ac.worlds} worlds, not ${K}`);
    if (!(ac.year >= 1 && ac.year <= ac.years)) bad.push(`${tag}: access at year ${ac.year} of ${ac.years}`);
    for (let k = 0; k < K; k++) {
      const br = one(u.bref, x => x.k === k), nd = one(u.node, x => x.k === k), sb = one(u.stage, x => x.k === k && x.stage === 'bridge'), sa = one(u.stage, x => x.k === k && x.stage === 'after');
      const rs = one(u.resid, x => x.k === k), cl = one(u.cells, x => x.k === k), ls = one(u.lsa, x => x.k === k), pc = one(u.pcell, x => x.k === k), wl = one(u.wall, x => x.k === k);
      if (br.length !== 1 || nd.length !== 1 || sb.length !== 1 || sa.length !== 1) { bad.push(`${tag} world ${k}: ${br.length} bridgeref, ${nd.length} node, ${sb.length} and ${sa.length} stage lines, not 1 each`); continue; }
      if ((u.arm === 'OFF') !== (br[0].ref === null)) bad.push(`${tag} world ${k}: a reference on the bridgeref line ${br[0].ref} with the arm ${u.arm}`);
      if (nd[0].paths !== npw || br[0].N !== npw) bad.push(`${tag} world ${k}: ${nd[0].paths} node paths, bridgeref of ${br[0].N}, not ${npw}`);
      let gap = false;
      for (let t = 0; t <= ac.years; t++) if (rs.filter(x => x.t === t).length !== 1 || ls.filter(x => x.t === t).length !== 1) { bad.push(`${tag} world ${k}: year ${t} has ${rs.filter(x => x.t === t).length} resid and ${ls.filter(x => x.t === t).length} lsa lines, not 1 each`); gap = true; break; }
      if (cl.length !== 16) bad.push(`${tag} world ${k}: ${cl.length} cell, wcell and band lines, not 16`);
      if (pc.length !== 8 || wl.length !== 4) { bad.push(`${tag} world ${k}: ${pc.length} pcell and ${wl.length} wall lines, not 8 and 4`); continue; }
      // consistent: 7al's
      const y0 = rs.find(x => x.t === 0);
      if (y0 && y0.n !== npw) bad.push(`${tag} world ${k}: ${y0.n} paths claim at year 0, not ${npw}`);
      if (sb[0].n !== npw) bad.push(`${tag} world ${k}: the bridge stage has ${sb[0].n} paths, not ${npw}`);
      if (sb[0].through !== br[0].paid) bad.push(`${tag} world ${k}: ${sb[0].through} through the bridge, the engine paid ${br[0].paid}`);
      if (sa[0].n !== br[0].paid) bad.push(`${tag} world ${k}: the after stage has ${sa[0].n} paths, ${br[0].paid} alive at access`);
      if (Math.abs(100 * sa[0].through / npw - nd[0].sim) > 5e-5 + 1e-9) bad.push(`${tag} world ${k}: ${sa[0].through} survive the after stage, the node line's sim ${nd[0].sim}`);
      for (const [st, s] of [['bridge', sb[0]], ['after', sa[0]]]) {
        const ys = rs.filter(x => (st === 'bridge' ? x.t < ac.year : x.t >= ac.year) && x.n > 0);
        const sum = ys.reduce((t, x) => t + x.n * (x.table - x.next), 0), tol = ys.reduce((t, x) => t + x.n, 0) * 1e-4 + s.n * 1e-4 + 1e-6;
        if (s.n > 0 && !(Math.abs(sum - s.n * s.mean) <= tol)) bad.push(`${tag} world ${k}: the ${st} stage's mean x paths ${(s.n * s.mean).toFixed(2)}, the resid lines' sum ${sum.toFixed(2)} (the telescoping)`);
        // 7ap's: the pcell and wall lines split the same path-years
        const n = ys.reduce((t, x) => t + x.n, 0);
        for (const [nm, xs] of [['pcell', pc.filter(x => x.stage === st)], ['wall', wl.filter(x => x.stage === st)]]) {
          const n2 = xs.reduce((t, x) => t + x.n, 0), s2 = xs.filter(x => x.n > 0).reduce((t, x) => t + x.n * (x.table - x.next), 0);
          if (n2 !== n) bad.push(`${tag} world ${k}: the ${st} stage's ${nm} lines hold ${n2} path-years, the resid lines ${n}`);
          else if (!(Math.abs(s2 - sum) <= xs.reduce((t, x) => t + x.n, 0) * 1e-4 + n * 1e-4 + 1e-6)) bad.push(`${tag} world ${k}: the ${st} stage's ${nm} residual sum ${s2.toFixed(2)}, the resid lines' ${sum.toFixed(2)}`);
        }
      }
      if (!gap) for (const l of ls) { const r = rs.find(x => x.t === l.t); if (r && r.n !== l.n) { bad.push(`${tag} world ${k} year ${l.t}: ${l.n} lsa paths, ${r.n} resid paths`); break; } if (l.wall + l.over > l.n || l.chg > l.n) { bad.push(`${tag} world ${k} year ${l.t}: wall ${l.wall}, over ${l.over}, chg ${l.chg} of ${l.n} paths`); break; } }
    }
  }
  return bad;
}

/* one unit's after stage pooled over its worlds, as 7al's rows */
export const afterOf = u => poolOf([0, 1, 2].map(k => { const s = u.stage.find(x => x.k === k && x.stage === 'after'); return { n: s.n, c: s.start, s: s.through }; }));
/* ITEM 1: rows { id, def: {n, c, s}, pcl: {n, c, s} } for the crossing units */
export function item1(rows) {
  const us = rows.map(r => {
    const d = readOf(r.def.n, r.def.c, r.def.s), h = d.pt / 2, x = readOf(r.pcl.n, r.pcl.c, r.pcl.s);
    const p = x.n > 0 && h > 0 ? binomLower(x.s, x.n, Math.max(0, (x.c - h) / 100)) : 1;
    return { id: r.id, def: d, pcl: x, h, p };
  });
  const adj = holm(us.map(u => u.p));
  us.forEach((u, i) => { u.pH = adj[i]; u.read = !(u.h > 0) ? 'NO OPTIMISM TO HALVE' : u.pcl.lo >= u.pcl.c - u.h ? 'HALVED' : u.pH < ALPHA && u.pcl.pt >= u.h ? 'NOT HALVED' : 'INCONCLUSIVE'; });
  const outcome = us.length === CROSSING.length && us.every(u => u.read === 'HALVED') ? 'HELD' : us.length === CROSSING.length && us.every(u => u.read === 'NOT HALVED') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { units: us, outcome };
}
/* 7al's rule on a set of units { id, n, c, s }, Holm over them */
export function calib(xs) {
  const us = xs.map(x => ({ id: x.id, ...readOf(x.n, x.c, x.s) }));
  const adj = holm(us.map(u => u.p));
  us.forEach((u, i) => { u.pH = adj[i]; u.read = u.pH < ALPHA && u.pt >= D ? 'OPTIMISTIC' : u.lo >= u.c - D ? 'NO MATERIAL OPTIMISM' : 'INCONCLUSIVE'; });
  return us;
}
export function item2(xs) { const us = calib(xs); return { units: us, outcome: us.length === CROSSING.length && us.every(u => u.read === 'NO MATERIAL OPTIMISM') ? 'HELD' : us.length === CROSSING.length && us.every(u => u.read === 'OPTIMISTIC') ? 'FALSIFIED' : 'INCONCLUSIVE' }; }
export function item3(x) { const [u] = calib([x]); return { units: [u], outcome: u.read === 'NO MATERIAL OPTIMISM' ? 'HELD' : u.read === 'OPTIMISTIC' ? 'FALSIFIED' : 'INCONCLUSIVE' }; }

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
export function reading(units, out = console.log) {
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  const L0 = labelOf('TS+J', 'DEFAULT'), L1 = labelOf('TS+J', 'PCLSI');
  const arm = id => (id === CONTROL ? 'OFF' : 'READER');
  out(`7AP: THE ALLOWANCE TEST - 7al's audit on S370 and S130 (READER, TS+J) and S194 (OFF, TS+J), each with the used-allowance axis snapped (DEFAULT, the records') and interpolated (PCLSI); W${W}, 30 points, ${NPW} paths a world at each world's node (seed ${SEED}); every DEFAULT unit held line for line to 7al's record`);
  const line = (x, tag, extra = '') => `${tag} | ${String(x.n).padStart(6)}  ${f4(x.c).padStart(8)}  ${f4(x.n ? 100 * x.s / x.n : NaN).padStart(8)}  ${f4(x.pt).padStart(7)} | ${f4(x.lo).padStart(8)}${extra}`;
  // item 1
  const rows = CROSSING.map(id => ({ id, def: afterOf(get(id, 'READER', L0)), pcl: afterOf(get(id, 'READER', L1)) }));
  const I1 = item1(rows);
  out(`\nITEM 1 (the snap's share, primary): each crossing unit's three worlds pooled; h = half the DEFAULT arm's point (c - survived); the PCLSI arm HALVED when its CP 95% lower end is c - h or more, NOT HALVED when the binomial lower tail at (c - h) is under ${ALPHA} after Holm over ${I1.units.length} and its point is h or more`);
  out('  household arm    |  paths     claim c  survived  c - surv | CP 95% low | h       p         Holm p   | reading');
  for (const u of I1.units) {
    out(line(u.def, `  ${u.id.padEnd(9)} DEFAULT`));
    out(line(u.pcl, `  ${u.id.padEnd(9)} PCLSI  `, ` | ${f4(u.h).padStart(6)}  ${u.p.toExponential(2).padStart(8)}  ${u.pH.toExponential(2).padStart(8)} | ${u.read}`));
  }
  out(`  -> ${I1.outcome} (HELD when both read HALVED; FALSIFIED when both read NOT HALVED)`);
  // item 2
  const I2 = item2(CROSSING.map(id => ({ id, ...afterOf(get(id, 'READER', L1)) })));
  out(`\nITEM 2 (the cure): 7al's rule (margin ${D} points, binomial lower tail at (c - ${D}), Holm over ${I2.units.length}) on the PCLSI crossing units`);
  for (const u of I2.units) out(line(u, `  ${u.id.padEnd(9)} PCLSI  `, ` | p ${u.p.toExponential(2)} Holm ${u.pH.toExponential(2)} | ${u.read}`));
  out(`  -> ${I2.outcome} (HELD when both read NO MATERIAL OPTIMISM; FALSIFIED when both read OPTIMISTIC)`);
  // item 3
  const I3 = item3({ id: CONTROL, ...afterOf(get(CONTROL, 'OFF', L1)) });
  out(`\nITEM 3 (the control): 7al's rule on S194 OFF under PCLSI (it cannot cross 0.75 of the allowance)`);
  for (const u of I3.units) out(line(u, `  ${u.id.padEnd(9)} PCLSI  `, ` | p ${u.p.toExponential(2)} | ${u.read}`));
  out(`  -> ${I3.outcome} (HELD when it reads NO MATERIAL OPTIMISM; FALSIFIED when it reads OPTIMISTIC)`);
  // reported
  out(`\nREPORTED (not items):`);
  out(`  BOTH ARMS BY WORLD (the after stage: c - survived, points; the bridge stage's per-path mean, descriptive):`);
  for (const id of [...CROSSING, CONTROL]) for (let k = 0; k < K; k++) {
    const st = (l, s) => get(id, arm(id), l).stage.find(x => x.k === k && x.stage === s), af = s => (s.n ? s.start - 100 * s.through / s.n : NaN);
    out(`    ${id} world ${k}: after DEFAULT ${f2(af(st(L0, 'after')))} (${st(L0, 'after').n}) PCLSI ${f2(af(st(L1, 'after')))} (${st(L1, 'after').n})   bridge DEFAULT ${f2(st(L0, 'bridge').mean)} PCLSI ${f2(st(L1, 'bridge').mean)}   table DEFAULT ${get(id, arm(id), L0).table} PCLSI ${get(id, arm(id), L1).table}`);
  }
  out(`  THE RESIDUAL BY BUCKET CHANGE AND SHARE POSITION (pcell) AND BY THE WALL (0.6 to under 0.75 of the allowance), after access, pooled over the worlds (table - next over path-years; path-years):`);
  for (const id of [...CROSSING, CONTROL]) for (const l of [L0, L1]) {
    const u = get(id, arm(id), l), parts = [];
    const pool = xs => { const n = xs.reduce((t, x) => t + x.n, 0); return `${n ? f2(xs.filter(x => x.n > 0).reduce((t, x) => t + x.n * (x.table - x.next), 0) / n) : '-'} (${n})`; };
    for (const cg of ['chg', 'same']) for (const p of ['mid', 'near']) parts.push(`${cg} ${p} ${pool(u.pcell.filter(x => x.stage === 'after' && x.chg === cg && x.pos === p))}`);
    for (const w of ['wall', 'off']) parts.push(`${w} ${pool(u.wall.filter(x => x.stage === 'after' && x.at === w))}`);
    out(`    ${id.padEnd(5)} ${isP(l) ? 'PCLSI  ' : 'DEFAULT'} ${parts.join('; ')}`);
  }
  out(`  THE USED ALLOWANCE BY PLAN YEAR (world 0; mean used share / paths at the wall / over 0.75 / bucket changes to t+1, of the paths alive; access named):`);
  for (const id of [...CROSSING, CONTROL]) for (const l of [L0, L1]) {
    const u = get(id, arm(id), l);
    out(`    ${id.padEnd(5)} ${isP(l) ? 'PCLSI  ' : 'DEFAULT'} access year ${u.access.year}: ${u.lsa.filter(x => x.k === 0).sort((x, y) => x.t - y.t).map(x => `y${x.t} ${x.n ? `${f2(x.used)}/${x.wall}/${x.over}/${x.chg}` : '.'}`).join(' ')}`);
  }
  out(`  THE PER-YEAR RESIDUAL (table - next, points, by plan year from 0; access is year A, named), by world:`);
  for (const id of [...CROSSING, CONTROL]) for (const l of [L0, L1]) {
    const u = get(id, arm(id), l);
    for (let k = 0; k < K; k++) out(`    ${id.padEnd(5)} ${isP(l) ? 'PCLSI  ' : 'DEFAULT'} world ${k} (A = year ${u.access.year}): ${u.resid.filter(x => x.k === k).sort((x, y) => x.t - y.t).map(x => `${x.t === u.access.year ? 'A:' : ''}${x.n ? f2(x.table - x.next) : '.'}`).join(' ')}`);
  }
  out(`\nOUTCOME: 1 ${I1.outcome}; 2 ${I2.outcome}; 3 ${I3.outcome}`);
  return { I1, I2, I3 };
}

/* PLANTED: built logs the gate must pass clean, faults it must refuse; the items over built rows; the arithmetic */
export function builtLog(o = {}) {
  const T = 30, AC = 5, lines = [];
  for (const [id, a, l] of UNITS) {
    if (o.skip === `${id}|${l}`) continue;
    const L = `${a}/${l}`, P = isP(l);
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda ${o.lambda && id === 'S130' && P ? '0.03' : LAMBDA} tier own riskAbove auto mix 3`);
    lines.push(`${''.padEnd(16)} solve ${L}: table ${o.table && id === 'S130' && !P ? '90.0000' : P ? '94.0000' : '95.0000'} secs 100`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed 7002 paths ${o.paths && id === 'S370' ? 1000 : NPW} grid total30x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 quad 5${o.tsOff && id === 'S194' ? '' : ' tierState true'} bequestWeight ${W} finalIntegral true bridgeRead ${a === 'OFF' ? 'false' : 'reader'}${o.ref && id === 'S370' ? ' readerRef order' : ''}${o.ranTwin && id === 'S130' && P ? ' extra 1' : ''}`);
    lines.push(`${''.padEnd(16)} gap ${L}: 1.0000e-3 opening 2,2`);
    lines.push(`${''.padEnd(16)} joint ${L}: true switchMargin ${o.margin && id === 'S194' ? '0' : '0.001'} scale 180000 cap 720000 deathTax ${o.death && id === 'S370' ? 0.4 : 0} tier own riskAbove off:_no_tier_above_the_plan`);
    if (!(o.noAccess && id === 'S130' && P)) lines.push(`${''.padEnd(16)} access ${L}: year ${AC} years ${T} worlds 3`);
    if (!(o.noAxis && id === 'S370' && P)) lines.push(`${''.padEnd(16)} axis ${L}: pclsInterp ${o.axisOff && id === 'S130' && P ? false : o.axisOn && id === 'S194' && !P ? true : P} pcls ${o.buckets && id === 'S194' ? '0,0.25,0.5,1' : '0,0.5,1'} pclsStrict false`);
    for (let k = 0; k < K; k++) {
      const paid = o.paidOff && id === 'S370' && k === 1 ? 1799 : 1800, surv = 1440, sim = 100 * (o.simOff && id === 'S130' && k === 2 && P ? 1441 : surv) / NPW;
      lines.push(`${''.padEnd(16)} bridgeref ${L} world ${k}: reference ${a === 'OFF' ? '-' : `95.0000 at 100000 own 94.5000 drawn 1890 of ${NPW}`} engine ${(100 * paid / NPW).toFixed(4)} paid ${paid} of ${NPW}`);
      lines.push(`${''.padEnd(16)} node ${L} world ${k} z 0.0000: sim ${sim.toFixed(4)} paths ${NPW} secs 10`);
      // per year: bridge years 0..4 claim 90 -> 80 (2 a year), 200 paths fail at year 4; after access 1,800 paths claim 80
      for (let t = 0; t <= T; t++) {
        const n = t < AC ? NPW : 1800, c = t < AC ? 90 - 2 * t : 80, nx = t < AC ? (t < 4 ? 88 - 2 * t : (1800 * 80) / NPW) : t < T ? 80 : 100 * surv / 1800;
        if (!(o.noResid && id === 'S194' && P && k === 0 && t === 7)) lines.push(`${''.padEnd(16)} resid ${L} world ${k} year ${t}: paths ${n} table ${c.toFixed(4)} next ${nx.toFixed(4)}`);
        if (!(o.noLsa && id === 'S370' && !P && k === 1 && t === 9)) lines.push(`${''.padEnd(16)} lsa ${L} world ${k} year ${t}: paths ${o.lsaOff && id === 'S130' && P && k === 0 && t === 3 ? n - 1 : n} used ${(t / T).toFixed(4)} wall ${t === 20 ? 100 : 0} over ${t > 22 ? n : 0} chg ${t === 22 ? 50 : 0}`);
      }
      const bm = 18;
      lines.push(`${''.padEnd(16)} stage ${L} world ${k} bridge: paths ${NPW} start 90.0000 end ${(1800 * 80 / NPW).toFixed(4)} through ${paid} mean ${bm.toFixed(4)} sd 25.0000`);
      lines.push(`${''.padEnd(16)} stage ${L} world ${k} after: paths 1800 start 80.0000 end 80.0000 through ${surv} mean 0.0000 sd 40.0000`);
      for (const [kind, keys] of [['cell', ['mid', 'near']], ['wcell', ['mid', 'near']], ['band', ['lt50', '50-90', '90-99', 'ge99']]]) for (const st of ['bridge', 'after']) for (const key of keys) lines.push(`${''.padEnd(16)} ${kind} ${L} world ${k} ${st} ${key}: pathyears 0 table - next -`);
      // the pcell and wall lines split the resid lines' path-years: bridge 5 x 2,000 (residual 2 a path-year but year 4's),
      // after 26 x 1,800 (residual 0 but the last year's); all on 'same near' / 'off', but the planted splits
      const bridgeN = AC * NPW, afterN = (T - AC + 1) * 1800;
      const bridgeTab = (4 * NPW * 2 + NPW * (82 - 72)) / bridgeN, afterRes = 1800 * (80 - 80) / afterN;
      const afterNext = 80 - 1800 * (80 - 100 * surv / 1800) / afterN;
      for (const st of ['bridge', 'after']) for (const cg of ['chg', 'same']) for (const p of ['mid', 'near']) {
        if (o.noPcell && id === 'S194' && !P && k === 2 && st === 'after' && cg === 'chg' && p === 'mid') continue;
        const main = cg === 'same' && p === 'near', n = main ? (st === 'bridge' ? bridgeN : afterN) - (o.pcellOff && id === 'S370' && P && k === 0 && st === 'after' ? 1 : 0) : 0;
        lines.push(`${''.padEnd(16)} pcell ${L} world ${k} ${st} ${cg} ${p}: pathyears ${n} table ${n ? (st === 'bridge' ? (bridgeTab + 10).toFixed(4) : '80.0000') : '-'} next ${n ? (st === 'bridge' ? 10 .toFixed(4) : afterNext.toFixed(4)) : '-'}`);
      }
      for (const st of ['bridge', 'after']) for (const w of ['wall', 'off']) {
        const main = w === 'off', n = main ? (st === 'bridge' ? bridgeN : afterN) : 0;
        const nxt = st === 'bridge' ? 10 : afterNext + (o.wallOff && id === 'S130' && !P && k === 1 && st === 'after' ? 0.5 : 0);
        lines.push(`${''.padEnd(16)} wall ${L} world ${k} ${st} ${w}: pathyears ${n} table ${n ? (st === 'bridge' ? (bridgeTab + 10).toFixed(4) : '80.0000') : '-'} next ${n ? nxt.toFixed(4) : '-'}`);
      }
      void afterRes;
    }
    if (!(o.noDone && id === 'S194' && P)) lines.push(`${''.padEnd(16)} done ${L}`);
  }
  if (o.twice) { const i = lines.findIndex(x => x.trim() === `done READER/${labelOf('TS+J', 'DEFAULT')}`); lines.push(...lines.slice(0, i + 1)); }
  if (o.extra) lines.push(`S999             case | unit READER/TS+J/W0.02 | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  return lines.join('\n') + '\n';
}
// the outcomes the plants reach (every registered outcome reachable by a plant)
const REACHED = { 1: new Set(), 2: new Set(), 3: new Set() };
function planted() {
  const cases = [];
  // 7al's records, built: the DEFAULT units' lines of a clean build (a plant on a DEFAULT unit's own lines is a plant on 7ap
  // alone; a 7al-side plant is made on the reference)
  const SETTINGS = ['paths', 'tsOff', 'ref', 'margin', 'death', 'paidOff'];
  const refOf = (o = {}) => { const us = AL.parse(builtLog(Object.keys(o).some(k => SETTINGS.includes(k)) ? o : {})); return (id, a, l) => { const r = us.find(u => u.id === id && u.arm === a && u.label === l) || null; if (r && o.refTable && id === 'S370') return { ...r, table: '96.0000' }; if (r && o.refStage && id === 'S194') return { ...r, stage: r.stage.map(s => (s.stage === 'after' && s.k === 1 ? { ...s, through: 1439 } : s)) }; return r; }; };
  const refused = o => String(gate(parse(builtLog(o)), refOf(o)).length > 0);
  { const bad = gate(parse(builtLog()), refOf()); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o] of [['a missing unit', { skip: `S194|${labelOf('TS+J', 'PCLSI')}` }], ['a unit twice', { twice: true }], ['an unregistered unit', { extra: true }], ['other unit settings (lambda)', { lambda: true }],
    ['a unit not done', { noDone: true }], ['a DEFAULT table that is not 7al\'s', { table: true }], ['a 7al table that differs', { refTable: true }], ['a 7al stage line that differs', { refStage: true }],
    ['1,000 paths a world', { paths: true }], ['a unit without the tier state', { tsOff: true }], ['readerRef on a unit', { ref: true }], ['a PCLSI ran line off its twin\'s', { ranTwin: true }],
    ['a switch margin of 0', { margin: true }], ['a pension death charge', { death: true }], ['no access line', { noAccess: true }], ['no axis line', { noAxis: true }], ['a PCLSI unit solved snapped', { axisOff: true }],
    ['a DEFAULT unit solved interpolated', { axisOn: true }], ['other buckets', { buckets: true }], ['a missing resid year', { noResid: true }], ['a missing lsa year', { noLsa: true }], ['an lsa count off the resid paths', { lsaOff: true }],
    ['a missing pcell line', { noPcell: true }], ['pcell path-years off the resid lines', { pcellOff: true }], ['a wall residual off the resid lines', { wallOff: true }],
    ['the after stage\'s paths off the engine\'s paid count', { paidOff: true }], ['the node sim off the survivors', { simOff: true }]]) cases.push([`the gate refuses ${nm}`, refused(o), 'true']);
  // the items
  const R = (n, c, s) => ({ n, c, s });
  const it1 = (d1, p1, d2, p2) => { const o = item1([{ id: 'S370', def: d1, pcl: p1 }, { id: 'S130', def: d2, pcl: p2 }]).outcome; REACHED[1].add(o); return o; };
  const opt7 = R(6000, 79, 4320), opt5 = R(6000, 80, 4500);            // 7 and 5 points optimistic
  cases.push(['item 1: both PCLSI calibrated (80 claimed, 80 survive): HALVED twice, HELD', it1(opt7, R(6000, 80, 4800), opt5, R(6000, 80, 4800)), 'HELD']);
  cases.push(['item 1: both PCLSI as optimistic as the DEFAULT: NOT HALVED twice, FALSIFIED', it1(opt7, R(6000, 79, 4320), opt5, R(6000, 80, 4500)), 'FALSIFIED']);
  cases.push(['item 1: one halved, one not: INCONCLUSIVE', it1(opt7, R(6000, 80, 4800), opt5, R(6000, 80, 4500)), 'INCONCLUSIVE']);
  { const u = item1([{ id: 'S370', def: opt7, pcl: R(6000, 80, 4620) }]).units[0]; cases.push(['item 1: 3 of 7 points left (h 3.5): CP low 75.9 >= 76.5? no; the tail at 76.5 not small: INCONCLUSIVE', u.read, 'INCONCLUSIVE']); }
  { const u = item1([{ id: 'S370', def: opt7, pcl: R(6000, 80, 4680) }]).units[0]; cases.push(['item 1: 2 of 7 points left: HALVED (CP low 76.9 >= 76.5)', u.read, 'HALVED']); }
  { const I = item1([{ id: 'S370', def: opt7, pcl: R(6000, 79, 4470) }, { id: 'S130', def: opt5, pcl: R(6000, 80, 4800) }]), u = I.units[0];
    cases.push(['item 1: p 0.036 at (c - h) beside a unit at p 1: Holm lifts it to 0.07, not NOT HALVED', `${u.p < 0.05 && u.pH >= 0.05} ${u.read}`, 'true INCONCLUSIVE']); }
  { const u = item1([{ id: 'S370', def: R(6000, 80, 4800), pcl: R(6000, 80, 4800) }]).units[0]; cases.push(['item 1: a DEFAULT with no optimism has none to halve', u.read, 'NO OPTIMISM TO HALVE']); }
  cases.push(['item 1: a unit with no optimism to halve is not HALVED: INCONCLUSIVE', it1(R(6000, 80, 4800), R(6000, 80, 4800), opt5, R(6000, 80, 4800)), 'INCONCLUSIVE']);
  const it2 = xs => { const o = item2(xs).outcome; REACHED[2].add(o); return o; };
  cases.push(['item 2: both calibrated: HELD', it2([{ id: 'S370', ...R(6000, 80, 4800) }, { id: 'S130', ...R(6000, 80, 4800) }]), 'HELD']);
  cases.push(['item 2: both 5 points optimistic: FALSIFIED', it2([{ id: 'S370', ...R(6000, 80, 4500) }, { id: 'S130', ...R(6000, 80, 4500) }]), 'FALSIFIED']);
  cases.push(['item 2: one each: INCONCLUSIVE', it2([{ id: 'S370', ...R(6000, 80, 4800) }, { id: 'S130', ...R(6000, 80, 4500) }]), 'INCONCLUSIVE']);
  const it3 = x => { const o = item3(x).outcome; REACHED[3].add(o); return o; };
  cases.push(['item 3: the control calibrated: HELD', it3({ id: 'S194', ...R(6000, 97, 5820) }), 'HELD']);
  cases.push(['item 3: the control 4 points optimistic: FALSIFIED', it3({ id: 'S194', ...R(6000, 97, 5580) }), 'FALSIFIED']);
  cases.push(['item 3: the control 1.5 points optimistic on 1,000 paths: INCONCLUSIVE', it3({ id: 'S194', ...R(1000, 97, 955) }), 'INCONCLUSIVE']);
  // the arithmetic, and the lists held together
  cases.push(['binomLower: P(Bin(10, 0.5) <= 2) = 56/1024', binomLower(2, 10, 0.5).toFixed(7), (56 / 1024).toFixed(7)]);
  cases.push(['the CP 95% interval of 4800 of 6000 holds 0.8', String(clopperPearson(4800, 6000)[0] < 0.8 && clopperPearson(4800, 6000)[1] > 0.8), 'true']);
  {
    const src = readFileSync(join(HERE, 'audit-7ap.mjs'), 'utf8'), m = /^export const UNITS = (\[.*\]);$/m.exec(src);
    cases.push(['the units are audit-7ap.mjs\'s, in its order', m ? String(JSON.stringify(JSON.parse(m[1].replace(/'/g, '"'))) === JSON.stringify(UNITS7)) : 'no UNITS line', 'true']);
  }
  {
    const src = readFileSync(join(HERE, 'audit-7al.mjs'), 'utf8'), m = /^export const UNITS = (\[.*\]);$/m.exec(src), al = m ? JSON.parse(m[1].replace(/'/g, '"')) : [];
    cases.push(['every DEFAULT unit is a 7al unit', String(UNITS7.filter(u => u[3] === 'DEFAULT').every(([id, a, s]) => al.some(x => x[0] === id && x[1] === a && x[2] === s))), 'true']);
  }
  cases.push(['parse reads a pcell line', JSON.stringify(parse('S130             case | unit READER/TS+J/W0.02/PCLSI | lambda x tier own riskAbove auto mix 3\n                 pcell READER/TS+J/W0.02/PCLSI world 1 after chg mid: pathyears 120 table 83.1000 next 80.0000\n')[0].pcell), JSON.stringify([{ k: 1, stage: 'after', chg: 'chg', pos: 'mid', n: 120, table: 83.1, next: 80 }])]);
  cases.push(['parse reads an lsa line and an axis line', JSON.stringify((u => [u.lsa, u.axis])(parse('S130             case | unit READER/TS+J/W0.02/PCLSI | lambda x tier own riskAbove auto mix 3\n                 axis READER/TS+J/W0.02/PCLSI: pclsInterp true pcls 0,0.5,1 pclsStrict false\n                 lsa READER/TS+J/W0.02/PCLSI world 0 year 17: paths 1900 used 0.7012 wall 812 over 301 chg 95\n')[0])), JSON.stringify([[{ k: 0, t: 17, n: 1900, used: 0.7012, wall: 812, over: 301, chg: 95 }], { interp: true, pcls: '0,0.5,1', strict: false }])]);
  cases.push(['7al\'s parse keeps a PCLSI unit\'s stage line on its own label', String(parse('S130             case | unit READER/TS+J/W0.02/PCLSI | lambda x tier own riskAbove auto mix 3\n                 stage READER/TS+J/W0.02/PCLSI world 2 after: paths 1799 start 83.1234 end 80.0000 through 1440 mean 3.1234 sd 40.0000\n')[0].stage.length), '1']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3].map(i => `OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`).join('\n')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ap'), DIR_AL = args[1] || join(HERE, 'results', 'diag7al');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const LA = logsOf(DIR_AL); requireFairLogs(LA, AL.PRED);
  const refUnits = Object.values(LA).flatMap(AL.parse);
  const ref = (id, a, l) => refUnits.find(u => u.id === id && u.arm === a && u.label === l && u.done) || null;
  const bad = gate(units, ref);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; every DEFAULT unit 7al's line for line (table, ran, gap, joint, access, bridgeref, node, stage, resid, cell lines); every PCLSI unit its twin's ran, joint and access lines and interpolated on the allowance axis alone; every line present; the stages, payments, survivors, telescoping and the pcell, wall and lsa lines consistent`);
  reading(units);
}
