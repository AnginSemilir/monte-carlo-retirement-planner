/*
 * 7AB'S REDUCER (predictions/diag-7ab.md; PLAN.md 7ab; the maintainer, 28 Sep 07:54 UK: "keep 7aa as is and queue that
 * follow-up run"): is the freed opening (FREED: the product's own tables, the year-0 move chosen at margin 0 and the
 * product's 0.001 after; 7w's /1e-3+open) as good as the joint tier state (TS+J, 7aa's) at a third of its solve time, and
 * does it do no harm where TS+J's harm legs are read? Reads the ten unit logs of audit-s126.mjs diag7ab
 * (results/diag7ab/case0-9.txt) and their traces, and 7aa's thirty (results/diag7aa) and their traces.
 * THE STAMP GATES: fair-gate.mjs's requireFairLogs on 7aa's logs against predictions/diag-7aa.md and on 7ab's against
 * predictions/diag-7ab.md. 7AA'S OWN GATE: reduce-7aa.mjs's gate() over its thirty units, every trace agreeing with its log.
 * 7AB'S GATE (before any figure): every registered unit present once (five cases, two estate weights); each unit's solve
 * the same as 7aa's PRODUCT unit of that case and weight - the ran line identical, no tier state, no one policy for every
 * world, no held tier, Q's fix or reader reference, the solved margin 0.001, the scale and cap, the solve's table and its
 * year-0 gap line identical - and a PRODUCT run line with 7aa's survival, a FREED run line and a done line on every unit;
 * every trace agreeing with its log in count, seed, arm, stamp and survival.
 * THE IDENTITY GATE (fair-test row 28: FREED runs on 7ab's code, TS+J on 7aa's): on every case and weight, 7ab's PRODUCT
 * trace equals 7aa's PRODUCT trace on every path - survival, spending level, tier, wealth, tax and failure year, byte for
 * byte - so the code between the two runs changed nothing the product's solve and run touch.
 * THE ITEMS, each read by the regimen's rule (exact tests against the case's margin - marginFor() of PRODUCT's survival at
 * the leg's weight - Holm over the item's legs, three outcomes, the unconditional interval printed beside), the no-harm
 * reads of items 1, 3 and 5 stricter (bothReads: no material harm needs the unconditional interval to agree):
 *   1. W0, as good as TS+J: on S126 (reader) and S194 (off), FREED shows no material harm against TS+J by survival
 *   2. W0.02, as good as TS+J: on S126 and S194, FREED shows no material loss against TS+J by the whole score within the
 *      survival limit
 *   3. W0.02, O37 unmasked: on S360 (off), FREED harms against PRODUCT by survival (predicted, O37); S360 (off) at W0 printed
 *      beside, not an item
 *   4. W0, the gain: on S126 and S194, FREED gains against PRODUCT by survival
 *   5. no harm elsewhere: on bridge 4 (reader) and S360 (reader) at both weights, FREED shows no material harm against
 *      PRODUCT by survival
 *   Items 3 and 5 read the legs of one harm family against PRODUCT (bridge 4, S360 reader and S360 off at both weights: six
 *   legs, Holm over the six), split as the plan-auditor asked on 7ab's registration (MINOR 1), before launch.
 * THE WHOLE-SCORE RULE for item 2 is reduce-7aa.mjs's (wholeLeg: the survival part unconditional and guarded, the rest by its
 * normal interval, each at half the leg's rate, added; the leg's rate 0.05 over the item's two legs, Bonferroni), read for a
 * LOSS instead of a gain: NO MATERIAL LOSS when the whole interval's lower end is above minus the case's margin and survival
 * shows no material harm by the unconditional interval (its lower end above minus the margin); LOSS when survival reads harm
 * (harmFamily's exact McNemar under Holm, the point loss at least the margin) or the whole interval's upper end is below 0
 * with the point loss at least the margin; else inconclusive. The exact (conditional) survival part is printed beside.
 * Reported, not items: every run's survival and its cells against PRODUCT and TS+J; the whole score of FREED against TS+J
 * and against PRODUCT on every leg; the pension tier each opens in; the path-years FREED and TS+J hold different tiers, in
 * year 0 and after (whether the two differ in the opening alone or in later switching too).
 *   node research/solver/reduce-7ab.mjs [dir7ab] [dir7aa] > research/solver/results-7ab.txt
 *   node research/solver/reduce-7ab.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { marginFor, zFor } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells, harmFamily, gainFamily, survivedShare } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ab.md';
export const { N, SEED, LAMBDA, LEVELS, PTS, SIM_TOL, ALPHA, WEIGHTS, CASE_ARMS, label, field } = A;
export const RULES = ['PRODUCT', 'FREED'];
// the registered units: [case, arm, weight], in audit-s126.mjs diag7ab's order (weight, case)
export const UNITS = WEIGHTS.flatMap(w => CASE_ARMS.map(([id, a]) => [id, a, w]));
export const TRACE_KEYS = ['survived', 'level', 'tier', 'wealth', 'taxPaid', 'failYear'];

const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/PRODUCT\/W(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+)$/;
const SOLVEL = /^\s+solve (\S+?)\/PRODUCT\/W(\S+): table (\S+) secs (\S+)$/;
const RANL = /^\s+ran (\S+?)\/PRODUCT\/W(\S+): (.*)$/;
const GAPL = /^\s+gap (\S+?)\/PRODUCT\/W(\S+): (\S+ opening \S+)$/;
const JOINTL = /^\s+joint (\S+?)\/PRODUCT\/W(\S+): (true|false) switchMargin (\S+) scale (\S+) cap (\S+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
const RUNL = /^\s+run (\S+?)\/(PRODUCT|FREED)\/W(\S+): sim (\S+) below (\S+) tier-below (\S+) changes (\S+) estate (\S+) secs (\S+)$/;

export function parse(text) {
  const units = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: m[2], w: m[3], lambda: m[4], tier: m[5], riskAbove: m[6], mix: m[7], runs: {}, done: false }; units.push(cur); continue; }
    if (!cur) continue;
    const mine = (a, w) => a === cur.arm && w === cur.w;
    if ((m = SOLVEL.exec(line)) && mine(m[1], m[2])) { cur.table = m[3]; continue; }
    if ((m = RANL.exec(line)) && mine(m[1], m[2])) { cur.ran = m[3]; continue; }
    if ((m = GAPL.exec(line)) && mine(m[1], m[2])) { cur.gap = m[3]; continue; }
    if ((m = JOINTL.exec(line)) && mine(m[1], m[2])) { cur.joint = { joint: m[3] === 'true', margin: m[4], scale: +m[5], cap: +m[6] }; continue; }
    if ((m = RUNL.exec(line)) && mine(m[1], m[3])) { cur.runs[m[2]] = { sim: +m[4], tier: +m[6], changes: +m[7], estate: +m[8] }; continue; }
    if (line.trim() === `done ${cur.arm}/W${cur.w}`) { cur.done = true; continue; }
  }
  return units;
}
/* 7ab's gate. `ref(id, arm, w)` is 7aa's parsed PRODUCT unit of that case and weight (reduce-7aa.mjs parse): its ran line,
   table, gap, joint and run. */
export function gate(units, ref) {
  const bad = [];
  for (const [id, arm, w] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.w === w).length; if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`); }
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/W${u.w}`;
    if (!UNITS.some(([id, a, w]) => id === u.id && a === u.arm && w === u.w)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const r = ref(u.id, u.arm, u.w);
    if (!r) { bad.push(`${tag}: no 7aa PRODUCT unit to compare with`); continue; }
    if (u.table === undefined) bad.push(`${tag}: no solve line`);
    else if (u.table !== r.table) bad.push(`${tag}: its table ${u.table}, 7aa's ${r.table}`);
    if (!u.ran) bad.push(`${tag}: no ran line`);
    else {
      if (u.ran !== r.ran) bad.push(`${tag}: its ran line is not 7aa's PRODUCT's`);
      if (field(u.ran, 'bequestWeight') !== u.w) bad.push(`${tag}: ran the estate weight ${field(u.ran, 'bequestWeight')}`);
      for (const k of ['tierState', 'holdTier', 'bridgeStep', 'readerRef']) if (field(u.ran, k)) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}`);
      if (field(u.ran, 'paths') !== String(N) || field(u.ran, 'seed') !== SEED || field(u.ran, 'pts') !== PTS) bad.push(`${tag}: ran at ${field(u.ran, 'pts')} points, ${field(u.ran, 'paths')} paths, seed ${field(u.ran, 'seed')}`);
    }
    if (!u.gap) bad.push(`${tag}: no gap line`);
    else if (!r.gap || u.gap !== `${r.gap.gap} opening ${r.gap.open1e3},${r.gap.open0}`) bad.push(`${tag}: its year-0 gap ${u.gap}, 7aa's ${r.gap ? `${r.gap.gap} opening ${r.gap.open1e3},${r.gap.open0}` : 'none'}`);
    if (!u.joint) bad.push(`${tag}: no joint line`);
    else {
      if (u.joint.joint) bad.push(`${tag}: one policy for every world`);
      if (u.joint.margin !== '0.001') bad.push(`${tag}: solved at margin ${u.joint.margin}`);
      if (!r.joint || u.joint.scale !== r.joint.scale || u.joint.cap !== r.joint.cap) bad.push(`${tag}: scale or cap not 7aa's`);
    }
    if (!u.runs.PRODUCT) bad.push(`${tag}: no PRODUCT run line`);
    else if (!r.run || Math.abs(u.runs.PRODUCT.sim - r.run.sim) > 1e-9) bad.push(`${tag}: PRODUCT's survival ${u.runs.PRODUCT.sim}, 7aa's ${r.run ? r.run.sim : 'none'}`);
    if (!u.runs.FREED) bad.push(`${tag}: no FREED run line`);
    if (!u.done) bad.push(`${tag}: no done line`);
  }
  return bad;
}
export const traceName = (id, arm, rule, w) => A.traceName(id, arm, label(rule, w));
/* the identity: 7ab's PRODUCT trace (raw JSON) against 7aa's, every array byte for byte */
export const sameTrace = (j, k) => !!(j && k && j.N === k.N && j.Y === k.Y && TRACE_KEYS.every(x => typeof j[x] === 'string' && j[x] === k[x]));

/* the path-years two runs hold different tiers, in year 0 and after (among the years both record a tier: live years) */
export function tierDiff(P, Q) {
  let y0 = 0, later = 0, paths = 0;
  for (let i = 0; i < P.N; i++) {
    let d = false;
    const endP = P.failYear[i] >= 0 ? P.failYear[i] : P.Y, endQ = Q.failYear[i] >= 0 ? Q.failYear[i] : Q.Y, end = Math.min(endP, endQ, P.Y);
    for (let t = 0; t < end; t++) if (P.tier[i * P.Y + t] !== Q.tier[i * Q.Y + t]) { if (t === 0) y0++; else later++; d = true; }
    if (d) paths++;
  }
  return { y0, later, paths };
}

/* THE ITEM-2 LEG: FREED (B) against TS+J (A) by the whole score, read for a loss */
export function lossRead(w, survO, unLo, m) {
  if (survO === 'harm' || (w.hi < 0 && -w.d >= m)) return 'loss';
  if (w.lo > -m && unLo > -m) return 'no material loss';
  return 'inconclusive';
}
/* NO MATERIAL HARM, READ BY BOTH INTERVALS (items 1, 3 and 5; the "no worse" claims are items 1 and 5): the regimen's exact reading of a leg (harmFamily) stands, except
   that "no material harm" needs the unconditional interval's lower end above minus the margin too; where it is not, the
   leg is inconclusive. Stricter than the regimen alone - it can turn no material harm into inconclusive, never the reverse -
   because a claim of "no worse" is where the exact interval is kind (its end on a one-sided side is the point estimate;
   stats.mjs survivalChange's comment; the plan-auditor on 7aa's item 4, 28 Sep) */
export const bothReads = legs => legs.map(x => ({ ...x, oExact: x.o, o: x.o === 'no material harm' && !(x.un.lo > -x.margin) ? 'inconclusive' : x.o }));
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const legText = x => `${x.label} ${x.k.saved} saved/${x.k.lost} lost ${f3(x.iv.d)} (exact ${x.iv.lo.toFixed(3)} to ${x.iv.hi.toFixed(3)}; unconditional ${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)}${x.disagree ? ' <-- the readings DISAGREE' : ''}) ${x.o}${x.oExact && x.oExact !== x.o ? ` (the exact reading alone: ${x.oExact})` : ''}`;
const wholeText = x => `${x.label}: whole ${f3(x.w.d)} (unconditional ${x.w.lo.toFixed(3)} to ${x.w.hi.toFixed(3)}; exact ${x.w.exLo.toFixed(3)} to ${x.w.exHi.toFixed(3)}; survival part ${f3(x.w.sd)}, the rest ${f3(x.w.rest)} +/- ${x.w.restSe.toFixed(3)}); survival ${x.w.k.saved}/${x.w.k.lost} ${x.survEx} (unconditional lower end ${x.unLo.toFixed(3)}); ${x.o}${x.o !== x.oEx ? ` <-- the exact form reads ${x.oEx}` : ''}`;

/*
 * THE ITEMS. `S(id, arm, rule, w)` is a run's survived array, rule PRODUCT, FREED (7ab) or TS+J (7aa); `WL(id, arm, rb, ra, w,
 * a)` the whole-score leg of rule rb against ra at weight w and error rate a (reduce-7aa.mjs wholeLeg on the traces). The
 * margin is the case's: marginFor() of PRODUCT's survival at the leg's weight.
 */
export function items(S, WL) {
  const out = [], mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, 'PRODUCT', w)));
  const leg = (id, arm, b, a, w) => ({ id, label: `${id} (${arm.toLowerCase()}): ${b} against ${a} at W${w}`, k: cells(S(id, arm, a, w), S(id, arm, b, w)), margin: mar(id, arm, w) });
  const two = [['S126', 'READER'], ['S194', 'OFF']], harmLegs = [['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']];
  // 1. W0, FREED as good as TS+J by survival
  const i1 = bothReads(harmFamily(two.map(([id, arm]) => leg(id, arm, 'FREED', 'TS+J', '0'))));
  out.push({ n: 1, text: 'W0, as good as TS+J: on S126 (reader) and S194 (off), FREED shows no material harm against TS+J by survival (FALSIFIED: harm on either)', legs: i1, outcome: i1.every(x => x.o === 'no material harm') ? 'HELD' : i1.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 2. W0.02, FREED as good as TS+J by the whole score within the survival limit
  const a2 = ALPHA / two.length, s2 = harmFamily(two.map(([id, arm]) => leg(id, arm, 'FREED', 'TS+J', '0.02')));
  const i2 = two.map(([id, arm], j) => {
    const w = WL(id, arm, 'FREED', 'TS+J', '0.02', a2), m = s2[j].margin, unLo = s2[j].un.lo, survEx = s2[j].o;
    const exW = { ...w, lo: w.exLo, hi: w.exHi };
    return { label: `${id} (${arm.toLowerCase()}): FREED against TS+J at W0.02`, w, survEx, unLo, margin: m, o: lossRead(w, survEx, unLo, m), oEx: lossRead(exW, survEx, survEx === 'no material harm' ? Infinity : -Infinity, m) };
  });
  out.push({ n: 2, text: 'W0.02, as good as TS+J: on S126 and S194, FREED shows no material loss against TS+J by the whole score within the survival limit (FALSIFIED: a loss on either)', whole: i2, outcome: i2.every(x => x.o === 'no material loss') ? 'HELD' : i2.some(x => x.o === 'loss') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // the harm family against PRODUCT: bridge 4, S360 (reader) and S360 (off) at W0 and W0.02, six legs, Holm over the six;
  // items 3 and 5 read its legs (the registered split: the plan-auditor on 7ab's registration, MINOR 1)
  const fam = bothReads(harmFamily(WEIGHTS.flatMap(w => harmLegs.map(([id, arm]) => leg(id, arm, 'FREED', 'PRODUCT', w)))));
  const at = (id, arm, w) => fam.find(x => x.id === id && x.label.includes(`(${arm.toLowerCase()})`) && x.label.endsWith(`at W${w}`));
  // 3. W0.02, O37 unmasked: FREED harms S360 under off against PRODUCT (predicted from 7v's openings in tier 2 and O37)
  const i3 = [at('S360', 'OFF', '0.02')], besides3 = [at('S360', 'OFF', '0')];
  out.push({ n: 3, text: 'W0.02, O37 unmasked: on S360 (off), FREED harms against PRODUCT by survival (in the six-leg harm family; FALSIFIED: no material harm)', legs: i3, besides: besides3, outcome: i3[0].o === 'harm' ? 'HELD' : i3[0].o === 'no material harm' ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 4. W0, FREED gains against PRODUCT
  const i4 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'FREED', 'PRODUCT', '0')));
  out.push({ n: 4, text: 'W0, the gain: on S126 and S194, FREED gains against PRODUCT by survival (FALSIFIED: no material gain on both)', legs: i4, outcome: tri(i4, x => x.o === 'gain', x => x.o === 'no material gain') });
  // 5. no harm elsewhere: bridge 4 (reader) and S360 (reader) at both weights, the four other legs of the family
  const i5 = [at('bridge 4', 'READER', '0'), at('S360', 'READER', '0'), at('bridge 4', 'READER', '0.02'), at('S360', 'READER', '0.02')];
  out.push({ n: 5, text: 'no harm elsewhere: on bridge 4 (reader) and S360 (reader) at W0 and W0.02, FREED shows no material harm against PRODUCT by survival (in the six-leg harm family; FALSIFIED: harm on any)', legs: i5, outcome: i5.every(x => x.o === 'no material harm') ? 'HELD' : i5.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, arm, w) => `mix 3 pts 30 seed 7002 paths ${N} grid total30x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot ${id === 'S194' ? 80000 : 29000} quad 5 bequestWeight ${w} finalIntegral true bridgeRead ${arm === 'READER' ? 'reader' : 'false'}`;
  const refUnit = (id, arm, w) => ({ id, arm, label: label('PRODUCT', w), table: '90.0000', ran: ranOf(id, arm, w), gap: { gap: '2.0000e-4', open1e3: 0, open0: 2 }, joint: { joint: false, margin: '0.001', scale: 950000, cap: 3800000 }, run: { sim: 98.75 } });
  const ref = (id, arm, w) => refUnit(id, arm, w);
  const unitText = (id, arm, w, o = {}) => {
    const p = ''.padEnd(16), L = `${arm}/PRODUCT/W${w}`, lines = [`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3`];
    if (!o.noSolve) lines.push(`${p} solve ${L}: table ${o.table || '90.0000'} secs 1`);
    lines.push(`${p} ran ${L}: ${o.ran || ranOf(id, arm, w)}`);
    if (!o.noGap) lines.push(`${p} gap ${L}: ${o.gap || '2.0000e-4 opening 0,2'}`);
    lines.push(`${p} joint ${L}: ${o.joint || false} switchMargin ${o.margin || '0.001'} scale ${o.scale || 950000} cap 3800000 deathTax 0 tier own riskAbove off:_no_tier_above_the_plan`);
    if (!o.noProduct) lines.push(`${p} run ${arm}/PRODUCT/W${w}: sim ${o.sim || '98.7500'} below 1.00 tier-below 1.00 changes 0.100 estate 1 secs 1`);
    if (!o.noFreed) lines.push(`${p} run ${arm}/FREED/W${w}: sim 99.0000 below 1.00 tier-below 1.00 changes 0.100 estate 1 secs 1`);
    if (!o.noDone) lines.push(`${p} done ${arm}/W${w}`);
    return lines.join('\n');
  };
  const good = () => UNITS.map(([id, a, w]) => unitText(id, a, w)).join('\n');
  cases.push(['a log parsed and gated: ten units, two runs each, the gate passes', `${parse(good()).length} ${parse(good()).every(u => u.runs.PRODUCT && u.runs.FREED && u.done)} ${gate(parse(good()), ref).length}`, '10 true 0']);
  const bent = (id, arm, w, o) => UNITS.map(([i, a, x]) => unitText(i, a, x, i === id && a === arm && x === w ? o : {})).join('\n');
  const refused = t => String(gate(parse(t), ref).length > 0);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, a, w]) => unitText(id, a, w)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(good() + '\n' + unitText('S126', 'READER', '0')), 'true']);
  cases.push(['the gate refuses a ran line not 7aa\'s (the minimum pot)', refused(bent('S126', 'READER', '0.02', { ran: ranOf('S126', 'READER', '0.02').replace('minPot 29000', 'minPot 30000') })), 'true']);
  cases.push(['the gate refuses the estate weight 0.02 on a W0 unit (7aa\'s ran line the same)', String(gate(parse(bent('S194', 'OFF', '0', { ran: ranOf('S194', 'OFF', '0.02') })), (id, arm, w) => ({ ...refUnit(id, arm, w), ran: id === 'S194' && w === '0' ? ranOf('S194', 'OFF', '0.02') : ranOf(id, arm, w) })).length > 0), 'true']);
  cases.push(['the gate refuses the tier state', refused(bent('S360', 'OFF', '0', { ran: ranOf('S360', 'OFF', '0').replace(' quad 5', ' quad 5 tierState 0/0,1/1,2/2') })), 'true']);
  cases.push(['the gate refuses one policy for every world', refused(bent('bridge 4', 'READER', '0', { joint: true })), 'true']);
  cases.push(['the gate refuses another solved margin', refused(bent('S194', 'OFF', '0.02', { margin: '0' })), 'true']);
  cases.push(['the gate refuses another scale', refused(bent('S126', 'READER', '0', { scale: 950001 })), 'true']);
  cases.push(['the gate refuses another table', refused(bent('S360', 'READER', '0.02', { table: '90.0001' })), 'true']);
  cases.push(['the gate refuses another year-0 gap', refused(bent('S126', 'READER', '0.02', { gap: '2.0000e-4 opening 2,2' })), 'true']);
  cases.push(['the gate refuses PRODUCT\'s survival not 7aa\'s', refused(bent('S194', 'OFF', '0', { sim: '98.7625' })), 'true']);
  cases.push(['the gate refuses a missing solve line', refused(bent('bridge 4', 'READER', '0.02', { noSolve: true })), 'true']);
  cases.push(['the gate refuses a missing gap line', refused(bent('S360', 'OFF', '0.02', { noGap: true })), 'true']);
  cases.push(['the gate refuses a missing PRODUCT run', refused(bent('S360', 'READER', '0', { noProduct: true })), 'true']);
  cases.push(['the gate refuses a missing FREED run', refused(bent('S126', 'READER', '0', { noFreed: true })), 'true']);
  cases.push(['the gate refuses a missing done line', refused(bent('S194', 'OFF', '0.02', { noDone: true })), 'true']);
  cases.push(['the gate refuses the tier state, a held tier, Q\'s fix and the reader\'s reference even where 7aa\'s ran line carries the same', ['tierState 0/0,1/1,2/2', 'holdTier 0/0', 'bridgeStep exact', 'readerRef held'].map(x => { const bentRan = ranOf('S126', 'READER', '0').replace(' finalIntegral', ` ${x} finalIntegral`); return String(gate(parse(bent('S126', 'READER', '0', { ran: bentRan })), (id, arm, w) => ({ ...refUnit(id, arm, w), ran: id === 'S126' && w === '0' ? bentRan : ranOf(id, arm, w) })).length > 0); }).join(','), 'true,true,true,true']);
  cases.push(['the gate refuses a held tier, Q\'s fix and the reader\'s reference', ['holdTier 0/0', 'bridgeStep exact', 'readerRef held'].map(x => refused(bent('S126', 'READER', '0', { ran: ranOf('S126', 'READER', '0').replace(' finalIntegral', ` ${x} finalIntegral`) }))).join(','), 'true,true,true']);
  cases.push(['the gate refuses a unit with no 7aa unit to compare', String(gate(parse(good()), (id, arm, w) => (id === 'S360' && arm === 'OFF' && w === '0' ? null : refUnit(id, arm, w))).length > 0), 'true']);
  cases.push(['the trace name is 7aa\'s form', traceName('bridge 4', 'READER', 'FREED', '0.02'), 'bridge_4-reader-freed@w0.02.json.gz']);
  // the identity
  { const j = { N, Y: 3, survived: 'AAE=', level: 'ZGQ=', tier: 'AAA=', wealth: 'AAAA', taxPaid: 'AAAA', failYear: '//8=' };
    cases.push(['the identity: the same trace passes; a flipped survival, a changed wealth, a missing tax array, another count, or a tax array missing from both fail', [sameTrace(j, { ...j }), sameTrace(j, { ...j, survived: 'AQE=' }), sameTrace(j, { ...j, wealth: 'AAAB' }), sameTrace(j, { ...j, taxPaid: undefined }), sameTrace(j, { ...j, N: N - 1 }), sameTrace({ ...j, taxPaid: undefined }, { ...j, taxPaid: undefined })].join(','), 'true,false,false,false,false,false']); }
  // the path-years in different tiers
  { const mk = (tiers, fail) => ({ N: tiers.length, Y: 3, tier: Uint8Array.from(tiers.flat()), failYear: Int16Array.from(fail) });
    const d = tierDiff(mk([[0, 0, 0], [2, 1, 1], [2, 2, 0], [0, 1, 1]], [-1, -1, -1, 1]), mk([[0, 0, 0], [0, 1, 1], [2, 2, 2], [0, 0, 0]], [-1, -1, -1, -1]));
    cases.push(['tier differences: path 2 in year 0, path 3 in year 2, path 4 not counted after it fails in year 1', `${d.y0} ${d.later} ${d.paths}`, '1 1 2']); }
  // the loss read
  cases.push(['the loss read: level and tight is no material loss; harm is a loss; the whole interval below 0 with the point past the margin is a loss; wide is inconclusive; survival\'s unconditional end past the margin is inconclusive',
    [lossRead({ d: 0, lo: -0.1, hi: 0.1 }, 'no material harm', -0.1, 0.25), lossRead({ d: 0, lo: -0.1, hi: 0.1 }, 'harm', -0.4, 0.25), lossRead({ d: -0.3, lo: -0.5, hi: -0.1 }, 'inconclusive', -0.4, 0.25), lossRead({ d: -0.1, lo: -0.4, hi: 0.2 }, 'no material harm', -0.1, 0.25), lossRead({ d: 0, lo: -0.1, hi: 0.1 }, 'no material harm', -0.26, 0.25), lossRead({ d: -0.2, lo: -0.3, hi: -0.1 }, 'inconclusive', -0.3, 0.25)].join(', '),
    'no material loss, loss, loss, inconclusive, inconclusive, inconclusive']);
  // the items on planted stories: S from counts; WL from a table of whole legs
  const mkS = spec => (id, arm, rule, w) => { const k = spec[`${id}|${arm}|${rule}|${w}`] || [0, 0]; const a = new Uint8Array(N).fill(1); for (let i = 0; i < 100; i++) a[i] = 0; for (let i = 0; i < k[0]; i++) a[i] = 1; const o = k[2] || 100; for (let i = o; i < o + k[1]; i++) a[i] = 0; return a; };
  const mkW = spec => (id, arm, rb, ra, w) => { const x = spec[`${id}|${rb}|${ra}|${w}`] || { d: 0, lo: -0.1, hi: 0.1 }; return { exLo: x.lo, exHi: x.hi, ...x, sd: 0, rest: x.d, restSe: 0.01, k: { saved: 0, lost: 0 } }; };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  const asTSJ = { 'S126|READER|FREED|0': [40, 0], 'S194|OFF|FREED|0': [43, 0], 'S126|READER|TS+J|0': [40, 0], 'S194|OFF|TS+J|0': [43, 0], 'S126|READER|FREED|0.02': [30, 0], 'S194|OFF|FREED|0.02': [30, 0], 'S126|READER|TS+J|0.02': [30, 0], 'S194|OFF|TS+J|0.02': [30, 0] };
  cases.push(['FREED as TS+J, both gaining, no harm anywhere: 1, 2, 4 and 5 HELD, 3 FALSIFIED (no harm on S360 under off)', outs(items(mkS(asTSJ), mkW({}))), '1 HELD, 2 HELD, 3 FALSIFIED, 4 HELD, 5 HELD']);
  cases.push(['the expected case: FREED as TS+J and S360 under off losing 480 at W0.02: 1 to 5 HELD', outs(items(mkS({ ...asTSJ, 'S360|OFF|FREED|0.02': [0, 480] }), mkW({}))), '1 HELD, 2 HELD, 3 HELD, 4 HELD, 5 HELD']);
  cases.push(['nothing gains anywhere: 1, 2 and 5 HELD, 3 and 4 FALSIFIED', outs(items(mkS({}), mkW({}))), '1 HELD, 2 HELD, 3 FALSIFIED, 4 FALSIFIED, 5 HELD']);
  cases.push(['TS+J saving 40 more than FREED on S126 at W0 (0.5 points, margin 0.25): item 1 FALSIFIED', items(mkS({ ...asTSJ, 'S126|READER|FREED|0': [0, 0] }), mkW({}))[0].outcome, 'FALSIFIED']);
  cases.push(['FREED losing 12 to TS+J on S126 at W0, none the other way (exact: the point -0.15; unconditional past -0.25): item 1 INCONCLUSIVE, not HELD', items(mkS({ ...asTSJ, 'S126|READER|FREED|0': [40, 12] }), mkW({}))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['the whole score of FREED 0.4 below TS+J on S194 at W0.02, its interval below 0: item 2 FALSIFIED', items(mkS(asTSJ), mkW({ 'S194|FREED|TS+J|0.02': { d: -0.4, lo: -0.6, hi: -0.2 } }))[1].outcome, 'FALSIFIED']);
  cases.push(['the whole score level but wide on S126 at W0.02: item 2 INCONCLUSIVE', items(mkS(asTSJ), mkW({ 'S126|FREED|TS+J|0.02': { d: 0, lo: -0.4, hi: 0.4 } }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 reads TS+J\'s survival too: FREED losing 40 to TS+J on S126 at W0.02 is a loss whatever the whole score says', items(mkS({ ...asTSJ, 'S126|READER|FREED|0.02': [0, 10] }), mkW({}))[1].whole[0].o, 'loss']);
  cases.push(['harm on S360 under off at W0.02 (80 lost, margin 0.25): item 3 HELD, item 5 HELD', (() => { const it = items(mkS({ ...asTSJ, 'S360|OFF|FREED|0.02': [0, 80] }), mkW({})); return `${it[2].outcome} ${it[4].outcome}`; })(), 'HELD HELD']);
  cases.push(['harm on S360 under off at W0 only: item 3 reads W0.02 (FALSIFIED), the W0 leg printed beside as harm', (() => { const it = items(mkS({ ...asTSJ, 'S360|OFF|FREED|0': [0, 80] }), mkW({})); return `${it[2].outcome} ${it[2].besides[0].o}`; })(), 'FALSIFIED harm']);
  cases.push(['harm on bridge 4 at W0 (30 lost): item 5 FALSIFIED; item 5 reads four legs, item 3 one', (() => { const it = items(mkS({ ...asTSJ, 'bridge 4|READER|FREED|0': [0, 30] }), mkW({})); return `${it[4].outcome} ${it[4].legs.length} ${it[2].legs.length}`; })(), 'FALSIFIED 4 1']);
  cases.push(['item 5 against PRODUCT, not TS+J: TS+J losing the same 30 on bridge 4 at W0 does not hide FREED\'s harm', items(mkS({ ...asTSJ, 'bridge 4|READER|FREED|0': [0, 30], 'bridge 4|READER|TS+J|0': [0, 30] }), mkW({}))[4].outcome, 'FALSIFIED']);
  cases.push(['item 4 against PRODUCT, not TS+J: FREED as TS+J but TS+J\'s gain gone from PRODUCT (PRODUCT saving as much): item 4 FALSIFIED', items(mkS({ ...asTSJ, 'S126|READER|PRODUCT|0': [40, 0], 'S194|OFF|PRODUCT|0': [43, 0] }), mkW({}))[3].outcome, 'FALSIFIED']);
  cases.push(['item 4 on one case only: INCONCLUSIVE', items(mkS({ ...asTSJ, 'S194|OFF|FREED|0': [0, 0] }), mkW({}))[3].outcome, 'INCONCLUSIVE']);
  cases.push(['the margin is PRODUCT\'s at the leg\'s own weight: bridge 4\'s PRODUCT at W0 below 95% (margin 0.5) and 20 lost there is no material harm (at 0.25 it would be harm), where 30 lost at W0.02 (98.75%, 0.25) is harm', (() => { const a = items(mkS({ 'bridge 4|READER|PRODUCT|0': [0, 350], 'bridge 4|READER|FREED|0': [0, 370] }), mkW({}))[4].legs[0].o, b = items(mkS({ 'bridge 4|READER|FREED|0.02': [0, 30] }), mkW({}))[4].legs[2].o; return `${a} ${b}`; })(), 'no material harm harm']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

const logsOf = D => (existsSync(D) ? Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')])) : {});
const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ab'), DIR7AA = args[1] || join(HERE, 'results', 'diag7aa');
  // 7aa: its stamps, its own gate, its traces
  const logsA = logsOf(DIR7AA), unitsA = Object.values(logsA).flatMap(A.parse);
  if (A.UNITS.some(([id, a, l]) => !unitsA.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - 7aa: ${unitsA.filter(u => u.done).length} of ${A.UNITS.length} units done in ${DIR7AA}`); process.exit(1); }
  requireFairLogs(logsA, A.PRED);
  const badA = A.gate(unitsA);
  if (badA.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${badA.join('\n  ')}`); process.exit(1); }
  const STA = stampOf(logsA), RAW = {}, T = {};
  for (const u of unitsA) {
    if (!/^(PRODUCT|TS\+J)\//.test(u.label)) continue;
    const f = join(DIR7AA, A.traceName(u.id, u.arm, u.label));
    if (!existsSync(f)) { console.log(`FAIR-TEST GATE (7aa): no trace ${f}`); process.exit(1); }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!A.traceAgrees(j, STA, u.arm, u.label, u.run.sim)) { console.log(`FAIR-TEST GATE (7aa): ${f}: count, seed, arm, stamp or survival is not the log's`); process.exit(1); }
    const [rule, wl] = u.label.split('/W');
    RAW[`${u.id}|${u.arm}|${rule}|${wl}|7aa`] = j; T[`${u.id}|${u.arm}|${rule}|${wl}`] = { X: decode(j), u };
  }
  // 7ab: its stamps, its gate against 7aa's PRODUCT units, its traces
  const logsB = logsOf(DIR), unitsB = Object.values(logsB).flatMap(parse);
  if (UNITS.some(([id, a, w]) => !unitsB.some(u => u.id === id && u.arm === a && u.w === w && u.done))) { console.log(`INCOMPLETE - ${unitsB.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logsB, PRED);
  const ref = (id, arm, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === label('PRODUCT', w));
  const bad = gate(unitsB, ref), STB = stampOf(logsB);
  if (!bad.length) for (const u of unitsB) for (const rule of RULES) {
    const f = join(DIR, traceName(u.id, u.arm, rule, u.w));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!A.traceAgrees(j, STB, u.arm, label(rule, u.w), u.runs[rule].sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    if (rule === 'PRODUCT') { if (!sameTrace(j, RAW[`${u.id}|${u.arm}|PRODUCT|${u.w}|7aa`])) bad.push(`${f}: THE IDENTITY FAILS - 7ab's PRODUCT trace is not 7aa's on every path`); continue; }
    T[`${u.id}|${u.arm}|FREED|${u.w}`] = { X: decode(j), u: { ...u, run: u.runs.FREED } };
  }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const S = (id, arm, rule, w) => T[`${id}|${arm}|${rule}|${w}`].X.survived;
  const cfgOf = (id, arm, w) => {
    const x = T[`${id}|${arm}|PRODUCT|${w}`];
    const cfg = { lambda: Number(field(x.u.ran, 'lambda')), floor: Math.min(...field(x.u.ran, 'levels').split(',').map(Number)), scale: x.u.joint.scale, cap: x.u.joint.cap, wb: Number(w) };
    cfg.spendYears = Array.from({ length: x.X.Y }, (_, t) => { for (let i = 0; i < x.X.N; i++) if (x.X.level[i * x.X.Y + t] > 0) return true; return false; });
    return cfg;
  };
  const WL = (id, arm, rb, ra, w, a) => A.wholeLeg(T[`${id}|${arm}|${ra}|${w}`].X, T[`${id}|${arm}|${rb}|${w}`].X, cfgOf(id, arm, w), a);
  console.log(`7AB: IS THE FREED OPENING AS GOOD AS TS+J WITHOUT ITS SOLVE TIME? (predictions/diag-7ab.md; ${N} paths of seed ${SEED}; the fair-test gates passed: both runs' stamps, 7aa's gate, 7ab's gate against 7aa's product, every trace, and 7ab's PRODUCT identical to 7aa's on every path)\n`);
  console.log('EVERY RUN: survival; FREED against PRODUCT and against TS+J saved/lost; the whole score of FREED against each (95%, the rule\'s interval at 0.05); the pension tier each opens in (FREED: the product\'s tables at margin 0; TS+J at 1e-3); the path-years FREED and TS+J hold different tiers, in year 0 and after, and the paths that differ anywhere');
  for (const w of WEIGHTS) for (const [id, arm] of CASE_ARMS) {
    const P = T[`${id}|${arm}|PRODUCT|${w}`], F = T[`${id}|${arm}|FREED|${w}`], J = T[`${id}|${arm}|TS+J|${w}`];
    const kP = cells(P.X.survived, F.X.survived), kJ = cells(J.X.survived, F.X.survived), wP = WL(id, arm, 'FREED', 'PRODUCT', w, ALPHA), wJ = WL(id, arm, 'FREED', 'TS+J', w, ALPHA), d = tierDiff(F.X, J.X);
    console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} PRODUCT ${P.u.run.sim.toFixed(4)}  FREED ${F.u.run.sim.toFixed(4)}  TS+J ${J.u.run.sim.toFixed(4)} | FREED v PRODUCT ${kP.saved}/${kP.lost} whole ${f3(wP.d)} (${wP.lo.toFixed(3)} to ${wP.hi.toFixed(3)}) | FREED v TS+J ${kJ.saved}/${kJ.lost} whole ${f3(wJ.d)} (${wJ.lo.toFixed(3)} to ${wJ.hi.toFixed(3)}) | opens FREED ${P.u.gap.open0}, TS+J ${J.u.gap.open1e3} | tiers differ: year 0 ${d.y0}, later ${d.later} path-years, ${d.paths} paths`);
  }
  const it = items(S, WL);
  console.log('\nTHE ITEMS (each a Holm family of its own, the regimen\'s reading deciding, the unconditional one beside it; item 2 by the whole-score rule read for a loss)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs || []) console.log(`     ${legText(l)}`);
    for (const l of x.besides || []) console.log(`     (reported, not the item) ${legText(l)}`);
    for (const l of x.whole || []) console.log(`     ${wholeText(l)}`);
  }
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
}
