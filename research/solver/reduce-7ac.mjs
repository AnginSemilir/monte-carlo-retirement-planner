/*
 * 7AC'S REDUCER, THE FOURTH CELL (predictions/diag-7ac.md; PLAN.md 7ac; the deep review after 7aa, deep-review-log.md 28 Sep
 * 11:44 UK; the maintainer, 28 Sep 11:59 UK): does TS+J price the opening right? OPEN0 is TS+J's own tables with the year-0
 * move held in the plan's tier (the chooser at an unbounded margin in year 0, 0.001 after). If OPEN0 keeps TS+J's gain, the
 * tables price the continuation right and the opening is not what carries it (cause 2); if OPEN0 loses TS+J's gain, the
 * opening carries it and one year's exposure is under-priced in every table (cause 1). Reads the four unit logs of
 * audit-s126.mjs diag7ac (results/diag7ac/case0-3.txt) and their traces, and 7aa's thirty (results/diag7aa) and their traces.
 * THE STAMP GATES: fair-gate.mjs's requireFairLogs on 7aa's logs against predictions/diag-7aa.md and on 7ac's against
 * predictions/diag-7ac.md. 7AA'S OWN GATE: reduce-7aa.mjs's gate() over its thirty units, every trace agreeing with its log.
 * 7AC'S GATE (before any figure): every registered unit present once (S126 reader at W0 and W0.02, bridge 4 reader at W0,
 * S194 off at W0.02: the four where 7aa's TS+J opens tier 2 at 1e-3 and 7aa's PRODUCT the plan's tier, both checked); each
 * unit's solve the same as 7aa's TS+J unit of that case and weight - the ran line, the table, the year-0 gap line, one
 * policy for every world at the solved margin 0.001, the scale and cap - its price line's mixture price equal to the gap
 * (within 0.1%: the gap line prints five figures), three world lines of 1,000 paths whose TS+J survival is 7aa's world line's,
 * a TS+J run line with 7aa's survival on which no path's year-0 move kept the plan's tiers (held0 0), an OPEN0 run line on
 * which every path's did (held0 8000), and a done line; every trace agreeing with its log in count, seed, arm, stamp and
 * survival.
 * THE IDENTITY GATE (fair-test row 28: OPEN0 runs on 7ac's code, the other arms on 7aa's): on every unit, 7ac's TS+J trace
 * equals 7aa's TS+J trace on every path - survival, spending level, tier, wealth, tax and failure year, byte for byte.
 * THE ITEMS, each read by the regimen's rule (exact tests against the case's margin - marginFor() of 7aa's PRODUCT survival at
 * the leg's weight - Holm over the item's legs, three outcomes, the unconditional interval printed beside):
 *   1. W0, the opening carries TS+J's gain by survival: on S126 (reader) and bridge 4 (reader), OPEN0 harms against TS+J
 *      (HELD on harm on both; FALSIFIED on no material harm on both, read by both intervals; else INCONCLUSIVE)
 *   2. W0.02, by the whole score within the survival limit: on S126 (reader) and S194 (off), OPEN0 loses against TS+J (read
 *      for a loss, reduce-7ab.mjs lossRead on reduce-7aa.mjs wholeLeg; HELD on a loss on both; FALSIFIED on no material loss
 *      on both; else INCONCLUSIVE)
 *   3. W0.02, O42's split: pooled over S126 and S194 on the paths 7aa's PRODUCT survives at W0.02, OPEN0 gains against TS
 *      (the two open alike there: the per-world rule's continuation against TS+J's; the pooled margin 0.1; HELD on a gain,
 *      FALSIFIED on no material gain, else INCONCLUSIVE)
 * Reported, not items: every unit's four runs (PRODUCT, TS and TS+J from 7aa; OPEN0) and OPEN0's cells and whole score
 * against PRODUCT and TS+J; the path-years OPEN0 and TS+J hold different tiers, in year 0 and after; each world's table price
 * of the opening against the survival TS+J and OPEN0 realise in that world, and their ratio.
 *   node research/solver/reduce-7ac.mjs [dir7ac] [dir7aa] > research/solver/results-7ac.txt
 *   node research/solver/reduce-7ac.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { marginFor, MARGINS } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells, harmFamily, gainFamily, survivedShare } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import { lossRead, bothReads, tierDiff, sameTrace, TRACE_KEYS } from './reduce-7ab.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ac.md';
export const { N, WP, SEED, LAMBDA, LEVELS, PTS, ALPHA, label, field } = A;
export { TRACE_KEYS };
export const RULES = ['TS+J', 'OPEN0'];
// the registered units: [case, arm, weight], in audit-s126.mjs diag7ac's order
export const UNITS = [['S126', 'READER', '0'], ['bridge 4', 'READER', '0'], ['S126', 'READER', '0.02'], ['S194', 'OFF', '0.02']];
export const PRICE_TOL = 1e-3;

const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/TS\+J\/W(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+)$/;
const SOLVEL = /^\s+solve (\S+?)\/TS\+J\/W(\S+): table (\S+) secs (\S+)$/;
const RANL = /^\s+ran (\S+?)\/TS\+J\/W(\S+): (.*)$/;
const GAPL = /^\s+gap (\S+?)\/TS\+J\/W(\S+): (\S+) opening (\d+),(\d+)$/;
const JOINTL = /^\s+joint (\S+?)\/TS\+J\/W(\S+): (true|false) switchMargin (\S+) scale (\S+) cap (\S+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
const PRICEL = /^\s+price (\S+?)\/TS\+J\/W(\S+): mixture (\S+) best (\S+) stay (\S+) held (\S+)$/;
const WORLDL = /^\s+world (\S+?)\/TS\+J\/W(\S+) (\d+) z (\S+) weight (\S+): price (\S+) best (\S+) stay (\S+) \| sim TS\+J (\S+) OPEN0 (\S+) paths (\d+)$/;
const RUNL = /^\s+run (\S+?)\/(TS\+J|OPEN0)\/W(\S+): sim (\S+) below (\S+) tier-below (\S+) changes (\S+) estate (\S+) held0 (\d+) secs (\S+)$/;

export function parse(text) {
  const units = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: m[2], w: m[3], lambda: m[4], tier: m[5], riskAbove: m[6], mix: m[7], worlds: [], runs: {}, done: false }; units.push(cur); continue; }
    if (!cur) continue;
    const mine = (a, w) => a === cur.arm && w === cur.w;
    if ((m = SOLVEL.exec(line)) && mine(m[1], m[2])) { cur.table = m[3]; continue; }
    if ((m = RANL.exec(line)) && mine(m[1], m[2])) { cur.ran = m[3]; continue; }
    if ((m = GAPL.exec(line)) && mine(m[1], m[2])) { cur.gap = { gap: m[3], open1e3: +m[4], open0: +m[5] }; continue; }
    if ((m = JOINTL.exec(line)) && mine(m[1], m[2])) { cur.joint = { joint: m[3] === 'true', margin: m[4], scale: +m[5], cap: +m[6] }; continue; }
    if ((m = PRICEL.exec(line)) && mine(m[1], m[2])) { cur.price = { mixture: +m[3], best: +m[4], stay: +m[5], held: m[6] }; continue; }
    if ((m = WORLDL.exec(line)) && mine(m[1], m[2])) { cur.worlds[+m[3]] = { z: +m[4], w: +m[5], price: +m[6], best: +m[7], stay: +m[8], simJ: +m[9], simO: +m[10], paths: +m[11] }; continue; }
    if ((m = RUNL.exec(line)) && mine(m[1], m[3])) { cur.runs[m[2]] = { sim: +m[4], tier: +m[6], changes: +m[7], estate: +m[8], held0: +m[9] }; continue; }
    if (line.trim() === `done ${cur.arm}/W${cur.w}`) { cur.done = true; continue; }
  }
  return units;
}
/* 7ac's gate. `refJ(id, arm, w)` and `refP(id, arm, w)` are 7aa's parsed TS+J and PRODUCT units of that case and weight
   (reduce-7aa.mjs parse). */
export function gate(units, refJ, refP) {
  const bad = [];
  for (const [id, arm, w] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.w === w).length; if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`); }
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/W${u.w}`;
    if (!UNITS.some(([id, a, w]) => id === u.id && a === u.arm && w === u.w)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const r = refJ(u.id, u.arm, u.w), p = refP(u.id, u.arm, u.w);
    if (!r || !p) { bad.push(`${tag}: no 7aa TS+J or PRODUCT unit to compare with`); continue; }
    if (!p.gap || p.gap.open1e3 !== 0) bad.push(`${tag}: 7aa's PRODUCT does not open in the plan's tier here (a registered unit is one where it does)`);
    if (u.table === undefined) bad.push(`${tag}: no solve line`);
    else if (u.table !== r.table) bad.push(`${tag}: its table ${u.table}, 7aa's TS+J ${r.table}`);
    if (!u.ran) bad.push(`${tag}: no ran line`);
    else {
      if (u.ran !== r.ran) bad.push(`${tag}: its ran line is not 7aa's TS+J's`);
      if (field(u.ran, 'bequestWeight') !== u.w) bad.push(`${tag}: ran the estate weight ${field(u.ran, 'bequestWeight')}`);
      if (!field(u.ran, 'tierState')) bad.push(`${tag}: ran no tier state`);
      for (const k of ['holdTier', 'bridgeStep', 'readerRef']) if (field(u.ran, k)) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}`);
      if (field(u.ran, 'paths') !== String(N) || field(u.ran, 'seed') !== SEED || field(u.ran, 'pts') !== PTS) bad.push(`${tag}: ran at ${field(u.ran, 'pts')} points, ${field(u.ran, 'paths')} paths, seed ${field(u.ran, 'seed')}`);
    }
    if (!u.gap) bad.push(`${tag}: no gap line`);
    else if (!r.gap || u.gap.gap !== r.gap.gap || u.gap.open1e3 !== r.gap.open1e3 || u.gap.open0 !== r.gap.open0) bad.push(`${tag}: its year-0 gap ${u.gap.gap} opening ${u.gap.open1e3},${u.gap.open0}, 7aa's TS+J ${r.gap ? `${r.gap.gap} opening ${r.gap.open1e3},${r.gap.open0}` : 'none'}`);
    else if (u.gap.open1e3 === 0) bad.push(`${tag}: TS+J opens in the plan's tier here (a registered unit is one where it opens apart)`);
    if (!u.joint) bad.push(`${tag}: no joint line`);
    else {
      if (!u.joint.joint) bad.push(`${tag}: not one policy for every world`);
      if (u.joint.margin !== '0.001') bad.push(`${tag}: solved at margin ${u.joint.margin}`);
      if (!r.joint || u.joint.scale !== r.joint.scale || u.joint.cap !== r.joint.cap) bad.push(`${tag}: scale or cap not 7aa's`);
    }
    if (!u.price) bad.push(`${tag}: no price line`);
    else if (u.gap && !(Math.abs(u.price.mixture / 100 - Number(u.gap.gap)) <= PRICE_TOL * Number(u.gap.gap))) bad.push(`${tag}: the mixture's price ${u.price.mixture} is not the gap ${u.gap.gap} (x100)`);
    if (u.worlds.length !== 3 || [0, 1, 2].some(k => !u.worlds[k] || u.worlds[k].paths !== WP)) bad.push(`${tag}: world lines ${u.worlds.filter(Boolean).length}, not 3 of ${WP} paths`);
    else if (!r.worlds || [0, 1, 2].some(k => !r.worlds[k] || Math.abs(u.worlds[k].simJ - r.worlds[k].sim) > 1e-9)) bad.push(`${tag}: a world line's TS+J survival is not 7aa's`);
    if (!u.runs['TS+J']) bad.push(`${tag}: no TS+J run line`);
    else {
      if (!r.run || Math.abs(u.runs['TS+J'].sim - r.run.sim) > 1e-9) bad.push(`${tag}: TS+J's survival ${u.runs['TS+J'].sim}, 7aa's ${r.run ? r.run.sim : 'none'}`);
      if (u.runs['TS+J'].held0 !== 0) bad.push(`${tag}: TS+J kept the plan's tiers in year 0 on ${u.runs['TS+J'].held0} paths, not 0`);
    }
    if (!u.runs.OPEN0) bad.push(`${tag}: no OPEN0 run line`);
    else if (u.runs.OPEN0.held0 !== N) bad.push(`${tag}: OPEN0 kept the plan's tiers in year 0 on ${u.runs.OPEN0.held0} paths, not ${N}`);
    if (!u.done) bad.push(`${tag}: no done line`);
  }
  return bad;
}
export const traceName = (id, arm, rule, w) => A.traceName(id, arm, label(rule, w));

const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const legText = x => `${x.label} ${x.k.saved} saved/${x.k.lost} lost ${f3(x.iv.d)} (exact ${x.iv.lo.toFixed(3)} to ${x.iv.hi.toFixed(3)}; unconditional ${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)}${x.disagree ? ' <-- the readings DISAGREE' : ''}) ${x.o}${x.oExact && x.oExact !== x.o ? ` (the exact reading alone: ${x.oExact})` : ''}`;
const wholeText = x => `${x.label}: whole ${f3(x.w.d)} (unconditional ${x.w.lo.toFixed(3)} to ${x.w.hi.toFixed(3)}; exact ${x.w.exLo.toFixed(3)} to ${x.w.exHi.toFixed(3)}; survival part ${f3(x.w.sd)}, the rest ${f3(x.w.rest)} +/- ${x.w.restSe.toFixed(3)}); survival ${x.w.k.saved}/${x.w.k.lost} ${x.survEx} (unconditional lower end ${x.unLo.toFixed(3)}); ${x.o}${x.o !== x.oEx ? ` <-- the exact form reads ${x.oEx}` : ''}`;

/*
 * THE ITEMS. `S(id, arm, rule, w)` is a run's survived array, rule PRODUCT, TS or TS+J (7aa) or OPEN0 (7ac); `WL(id, arm, rb,
 * ra, w, a)` the whole-score leg of rule rb against ra at weight w and error rate a (reduce-7aa.mjs wholeLeg on the traces).
 * The margin is the case's: marginFor() of PRODUCT's survival at the leg's weight.
 */
export function items(S, WL) {
  const out = [], mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, 'PRODUCT', w)));
  const leg = (id, arm, b, a, w) => ({ id, label: `${id} (${arm.toLowerCase()}): ${b} against ${a} at W${w}`, k: cells(S(id, arm, a, w), S(id, arm, b, w)), margin: mar(id, arm, w) });
  // 1. W0: OPEN0 against TS+J by survival on S126 and bridge 4 (harm predicted: the opening carries TS+J's gain)
  const one = [['S126', 'READER'], ['bridge 4', 'READER']];
  const i1 = bothReads(harmFamily(one.map(([id, arm]) => leg(id, arm, 'OPEN0', 'TS+J', '0'))));
  out.push({ n: 1, text: 'W0, the opening carries TS+J\'s gain: on S126 (reader) and bridge 4 (reader), OPEN0 harms against TS+J by survival (FALSIFIED: no material harm on both, read by both intervals)', legs: i1, outcome: tri(i1, x => x.o === 'harm', x => x.o === 'no material harm') });
  // 2. W0.02: OPEN0 against TS+J by the whole score within the survival limit on S126 and S194 (a loss predicted)
  const two = [['S126', 'READER'], ['S194', 'OFF']], a2 = ALPHA / two.length;
  const s2 = harmFamily(two.map(([id, arm]) => leg(id, arm, 'OPEN0', 'TS+J', '0.02')));
  const i2 = two.map(([id, arm], j) => {
    const w = WL(id, arm, 'OPEN0', 'TS+J', '0.02', a2), m = s2[j].margin, unLo = s2[j].un.lo, survEx = s2[j].o;
    const exW = { ...w, lo: w.exLo, hi: w.exHi };
    return { label: `${id} (${arm.toLowerCase()}): OPEN0 against TS+J at W0.02`, w, survEx, unLo, margin: m, o: lossRead(w, survEx, unLo, m), oEx: lossRead(exW, survEx, survEx === 'no material harm' ? Infinity : -Infinity, m) };
  });
  out.push({ n: 2, text: 'W0.02, by the whole score within the survival limit: on S126 (reader) and S194 (off), OPEN0 loses against TS+J (FALSIFIED: no material loss on both)', whole: i2, outcome: tri(i2, x => x.o === 'loss', x => x.o === 'no material loss') });
  // 3. W0.02, O42's split: pooled over S126 and S194 on the paths PRODUCT survives, OPEN0 against TS
  const kp = two.map(([id, arm]) => A.cellsWhere(S(id, arm, 'PRODUCT', '0.02'), S(id, arm, 'TS', '0.02'), S(id, arm, 'OPEN0', '0.02'))).reduce((s, k) => ({ a: s.a + k.a, lost: s.lost + k.lost, saved: s.saved + k.saved, d: s.d + k.d, N: s.N + k.N }), { a: 0, lost: 0, saved: 0, d: 0, N: 0 });
  const i3 = gainFamily([{ id: 'pooled', label: 'pooled over S126 and S194, on the paths PRODUCT survives: OPEN0 against TS at W0.02', k: kp, margin: MARGINS.pooled }]);
  out.push({ n: 3, text: 'W0.02, O42\'s split: pooled over S126 and S194 on the paths PRODUCT survives at 0.02, OPEN0 survives more than TS (FALSIFIED: no material gain, the pooled margin 0.1)', legs: i3, outcome: i3[0].o === 'gain' ? 'HELD' : i3[0].o === 'no material gain' ? 'FALSIFIED' : 'INCONCLUSIVE' });
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, arm, w) => `mix 3 pts 30 seed 7002 paths ${N} grid total30x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot ${id === 'S194' ? 80000 : 29000} quad 5 bequestWeight ${w} finalIntegral true bridgeRead ${arm === 'READER' ? 'reader' : 'false'} tierState 0/0,1/1,2/2`;
  const worldsJ = [{ sim: 99.3 }, { sim: 100 }, { sim: 100 }];
  const refUnitJ = (id, arm, w) => ({ id, arm, label: label('TS+J', w), table: '99.8514', ran: ranOf(id, arm, w), gap: { gap: '1.0649e-3', open1e3: 2, open0: 2 }, joint: { joint: true, margin: '0.001', scale: 950000, cap: 3800000 }, worlds: worldsJ, run: { sim: 99.85 } });
  const refUnitP = (id, arm, w) => ({ id, arm, label: label('PRODUCT', w), gap: { gap: '5.9469e-4', open1e3: 0, open0: 2 }, run: { sim: 99.35 } });
  const refJ = (id, arm, w) => refUnitJ(id, arm, w), refP = (id, arm, w) => refUnitP(id, arm, w);
  const unitText = (id, arm, w, o = {}) => {
    const p = ''.padEnd(16), L = `${arm}/TS+J/W${w}`, lines = [`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3`];
    if (!o.noSolve) lines.push(`${p} solve ${L}: table ${o.table || '99.8514'} secs 1`);
    lines.push(`${p} ran ${L}: ${o.ran || ranOf(id, arm, w)}`);
    if (!o.noGap) lines.push(`${p} gap ${L}: ${o.gap || '1.0649e-3 opening 2,2'}`);
    lines.push(`${p} joint ${L}: ${o.joint === undefined ? true : o.joint} switchMargin ${o.margin || '0.001'} scale ${o.scale || 950000} cap 3800000 deathTax 0 tier own riskAbove off:_no_tier_above_the_plan`);
    if (!o.noPrice) lines.push(`${p} price ${L}: mixture ${o.price || '1.064900e-1'} best 99.900000 stay 99.793500 held 0/0`);
    for (let k = 0; k < (o.worlds === undefined ? 3 : o.worlds); k++) lines.push(`${p} world ${L} ${k} z 0.0000 weight 0.3333: price 0.1000 best 99.0000 stay 98.9000 | sim TS+J ${k === 0 && o.worldSim ? o.worldSim : worldsJ[k].sim.toFixed(4)} OPEN0 98.0000 paths ${WP}`);
    if (!o.noJ) lines.push(`${p} run ${arm}/TS+J/W${w}: sim ${o.sim || '99.8500'} below 1.00 tier-below 1.00 changes 0.100 estate 1 held0 ${o.heldJ === undefined ? 0 : o.heldJ} secs 1`);
    if (!o.noOpen) lines.push(`${p} run ${arm}/OPEN0/W${w}: sim 99.3500 below 1.00 tier-below 1.00 changes 0.100 estate 1 held0 ${o.heldO === undefined ? N : o.heldO} secs 1`);
    if (!o.noDone) lines.push(`${p} done ${arm}/W${w}`);
    return lines.join('\n');
  };
  const good = () => UNITS.map(([id, a, w]) => unitText(id, a, w)).join('\n');
  cases.push(['a log parsed and gated: four units, two runs and three worlds each, the gate passes', `${parse(good()).length} ${parse(good()).every(u => u.runs['TS+J'] && u.runs.OPEN0 && u.worlds.length === 3 && u.price && u.done)} ${gate(parse(good()), refJ, refP).length}`, '4 true 0']);
  const bent = (id, arm, w, o) => UNITS.map(([i, a, x]) => unitText(i, a, x, i === id && a === arm && x === w ? o : {})).join('\n');
  const refused = t => String(gate(parse(t), refJ, refP).length > 0);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, a, w]) => unitText(id, a, w)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(good() + '\n' + unitText('S126', 'READER', '0')), 'true']);
  cases.push(['the gate refuses an unregistered unit (S360 off at W0)', refused(good() + '\n' + unitText('S360', 'OFF', '0')), 'true']);
  cases.push(['the gate refuses a ran line not 7aa\'s TS+J\'s', refused(bent('S126', 'READER', '0.02', { ran: ranOf('S126', 'READER', '0.02').replace('minPot 29000', 'minPot 30000') })), 'true']);
  cases.push(['the gate refuses no tier state, even where 7aa\'s ran line has none', String(gate(parse(bent('S194', 'OFF', '0.02', { ran: ranOf('S194', 'OFF', '0.02').replace(' tierState 0/0,1/1,2/2', '') })), (id, arm, w) => ({ ...refUnitJ(id, arm, w), ran: id === 'S194' ? ranOf(id, arm, w).replace(' tierState 0/0,1/1,2/2', '') : ranOf(id, arm, w) }), refP).length > 0), 'true']);
  cases.push(['the gate refuses a held tier, Q\'s fix and the reader\'s reference', ['holdTier 0/0', 'bridgeStep exact', 'readerRef held'].map(x => refused(bent('S126', 'READER', '0', { ran: ranOf('S126', 'READER', '0').replace(' finalIntegral', ` ${x} finalIntegral`) }))).join(','), 'true,true,true']);
  cases.push(['the gate refuses a held tier, Q\'s fix and the reader\'s reference even where 7aa\'s ran line carries the same', ['holdTier 0/0', 'bridgeStep exact', 'readerRef held'].map(x => { const bentRan = ranOf('S126', 'READER', '0').replace(' finalIntegral', ` ${x} finalIntegral`); return String(gate(parse(bent('S126', 'READER', '0', { ran: bentRan })), (id, arm, w) => ({ ...refUnitJ(id, arm, w), ran: id === 'S126' && w === '0' ? bentRan : ranOf(id, arm, w) }), refP).length > 0); }).join(','), 'true,true,true']);
  cases.push(['the gate refuses another table', refused(bent('bridge 4', 'READER', '0', { table: '99.8515' })), 'true']);
  cases.push(['the gate refuses another year-0 gap', refused(bent('S126', 'READER', '0', { gap: '1.0650e-3 opening 2,2' })), 'true']);
  cases.push(['the gate refuses a unit where TS+J opens in the plan\'s tier (7aa\'s the same)', String(gate(parse(bent('S126', 'READER', '0', { gap: '1.0649e-3 opening 0,2' })), (id, arm, w) => ({ ...refUnitJ(id, arm, w), gap: id === 'S126' && w === '0' ? { gap: '1.0649e-3', open1e3: 0, open0: 2 } : refUnitJ(id, arm, w).gap }), refP).length > 0), 'true']);
  cases.push(['the gate refuses a unit where 7aa\'s PRODUCT opens tier 2 (not a registered opening apart)', String(gate(parse(good()), refJ, (id, arm, w) => ({ ...refUnitP(id, arm, w), gap: id === 'S194' ? { gap: '1.0510e-3', open1e3: 2, open0: 2 } : refUnitP(id, arm, w).gap })).length > 0), 'true']);
  cases.push(['the gate refuses per-world tables (not one policy for every world)', refused(bent('S194', 'OFF', '0.02', { joint: false })), 'true']);
  cases.push(['the gate refuses another solved margin', refused(bent('S126', 'READER', '0.02', { margin: '0' })), 'true']);
  cases.push(['the gate refuses another scale', refused(bent('bridge 4', 'READER', '0', { scale: 950001 })), 'true']);
  cases.push(['the gate refuses a mixture price not the gap (0.1% off)', refused(bent('S126', 'READER', '0', { price: '1.066100e-1' })), 'true']);
  cases.push(['the gate takes a mixture price within the gap line\'s five figures', String(gate(parse(bent('S126', 'READER', '0', { price: '1.064940e-1' })), refJ, refP).length), '0']);
  cases.push(['the gate refuses a missing price line', refused(bent('S194', 'OFF', '0.02', { noPrice: true })), 'true']);
  cases.push(['the gate refuses two world lines', refused(bent('S126', 'READER', '0.02', { worlds: 2 })), 'true']);
  cases.push(['the gate refuses a world line whose TS+J survival is not 7aa\'s', refused(bent('bridge 4', 'READER', '0', { worldSim: '99.4000' })), 'true']);
  cases.push(['the gate refuses TS+J\'s survival not 7aa\'s', refused(bent('S126', 'READER', '0', { sim: '99.8375' })), 'true']);
  cases.push(['the gate refuses a TS+J run that kept the plan\'s tiers in year 0 on any path', refused(bent('S194', 'OFF', '0.02', { heldJ: 1 })), 'true']);
  cases.push(['the gate refuses an OPEN0 run that left the plan\'s tiers in year 0 on any path', refused(bent('S126', 'READER', '0.02', { heldO: N - 1 })), 'true']);
  cases.push(['the gate refuses a missing TS+J run', refused(bent('bridge 4', 'READER', '0', { noJ: true })), 'true']);
  cases.push(['the gate refuses a missing OPEN0 run', refused(bent('S126', 'READER', '0', { noOpen: true })), 'true']);
  cases.push(['the gate refuses a missing solve line', refused(bent('S194', 'OFF', '0.02', { noSolve: true })), 'true']);
  cases.push(['the gate refuses a missing gap line', refused(bent('S126', 'READER', '0.02', { noGap: true })), 'true']);
  cases.push(['the gate refuses a missing done line', refused(bent('bridge 4', 'READER', '0', { noDone: true })), 'true']);
  cases.push(['the gate refuses a unit with no 7aa unit to compare', String(gate(parse(good()), (id, arm, w) => (id === 'S194' ? null : refUnitJ(id, arm, w)), refP).length > 0), 'true']);
  cases.push(['the trace name is 7aa\'s form', traceName('bridge 4', 'READER', 'OPEN0', '0'), 'bridge_4-reader-open0@w0.json.gz']);
  // the identity (reduce-7ab.mjs's, reused)
  { const j = { N, Y: 3, survived: 'AAE=', level: 'ZGQ=', tier: 'AAA=', wealth: 'AAAA', taxPaid: 'AAAA', failYear: '//8=' };
    cases.push(['the identity: the same trace passes; a flipped survival or a changed tier fails', [sameTrace(j, { ...j }), sameTrace(j, { ...j, survived: 'AQE=' }), sameTrace(j, { ...j, tier: 'AgA=' })].join(','), 'true,false,false']); }
  // the items on planted stories: S from counts (each run's survived array: 100 failing, the first k[0] of them saved, k[1]
  // lost from path k[2] on); WL from a table of whole legs
  const mkS = spec => (id, arm, rule, w) => { const k = spec[`${id}|${arm}|${rule}|${w}`] || [0, 0]; const a = new Uint8Array(N).fill(1); for (let i = 0; i < 100; i++) a[i] = 0; for (let i = 0; i < k[0]; i++) a[i] = 1; const o = k[2] || 100; for (let i = o; i < o + k[1]; i++) a[i] = 0; return a; };
  const mkW = spec => (id, arm, rb, ra, w) => { const x = spec[`${id}|${rb}|${ra}|${w}`] || { d: 0, lo: -0.1, hi: 0.1 }; return { exLo: x.lo, exHi: x.hi, ...x, sd: 0, rest: x.d, restSe: 0.01, k: { saved: 0, lost: 0 } }; };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  // TS+J saves 40 on every unit against PRODUCT; TS loses 25 of PRODUCT's survivors at W0.02 (paths 200 on)
  const tsj = { 'S126|READER|TS+J|0': [40, 0], 'bridge 4|READER|TS+J|0': [40, 0], 'S126|READER|TS+J|0.02': [40, 0], 'S194|OFF|TS+J|0.02': [40, 0], 'S126|READER|TS|0.02': [0, 12, 200], 'S194|OFF|TS|0.02': [0, 13, 200] };
  const cause1 = { ...tsj }; // OPEN0 as PRODUCT: saves none, loses none against PRODUCT
  const cause2 = { ...tsj, 'S126|READER|OPEN0|0': [40, 0], 'bridge 4|READER|OPEN0|0': [40, 0], 'S126|READER|OPEN0|0.02': [40, 0], 'S194|OFF|OPEN0|0.02': [40, 0] };
  const loss = { 'S126|OPEN0|TS+J|0.02': { d: -0.5, lo: -0.7, hi: -0.3 }, 'S194|OPEN0|TS+J|0.02': { d: -0.5, lo: -0.7, hi: -0.3 } };
  cases.push(['cause 1 (OPEN0 as the product, the whole score half a point below TS+J): 1, 2 and 3 HELD', outs(items(mkS(cause1), mkW(loss))), '1 HELD, 2 HELD, 3 HELD']);
  cases.push(['cause 2 (OPEN0 as TS+J, the whole score level): 1 and 2 FALSIFIED, 3 HELD', outs(items(mkS(cause2), mkW({}))), '1 FALSIFIED, 2 FALSIFIED, 3 HELD']);
  cases.push(['OPEN0 as TS on the product\'s survivors (losing the same 25): item 3 FALSIFIED', items(mkS({ ...cause1, 'S126|READER|OPEN0|0.02': [0, 12, 200], 'S194|OFF|OPEN0|0.02': [0, 13, 200] }), mkW(loss))[2].outcome, 'FALSIFIED']);
  cases.push(['item 3 reads the product\'s survivors only: OPEN0 saving 30 of the product\'s failures does not count', items(mkS({ ...cause1, 'S126|READER|OPEN0|0.02': [30, 12, 200], 'S194|OFF|OPEN0|0.02': [0, 13, 200] }), mkW(loss))[2].legs[0].k.N.toString(), String(2 * (N - 100))]);
  cases.push(['item 3 at the pooled margin 0.1: OPEN0 saving 20 and losing 12 of the product\'s survivors against TS is INCONCLUSIVE (at 0.25 it would read no material gain)', items(mkS({ ...tsj, 'S126|READER|OPEN0|0.02': [0, 12, 300], 'S194|OFF|OPEN0|0.02': [0, 5, 204] }), mkW({}))[2].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 split: OPEN0 losing 40 on S126, as TS+J on bridge 4: INCONCLUSIVE', items(mkS({ ...cause2, 'S126|READER|OPEN0|0': [0, 0] }), mkW({}))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 reads OPEN0 against TS+J, not PRODUCT: OPEN0 as PRODUCT and TS+J as PRODUCT is no harm, not harm', items(mkS({}), mkW({}))[0].outcome, 'FALSIFIED']);
  cases.push(['item 1\'s no material harm needs both intervals: OPEN0 losing 12 to TS+J on both (exact -0.15; unconditional past -0.25) is INCONCLUSIVE, not FALSIFIED', items(mkS({ ...cause2, 'S126|READER|OPEN0|0': [40, 12, 200], 'bridge 4|READER|OPEN0|0': [40, 12, 200] }), mkW({}))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 on one case only (a loss on S126, level on S194): INCONCLUSIVE', items(mkS(cause2), mkW({ 'S126|OPEN0|TS+J|0.02': { d: -0.5, lo: -0.7, hi: -0.3 } }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 reads survival harm as a loss whatever the whole score says (OPEN0 losing 40 on both at W0.02)', items(mkS(cause1), mkW({}))[1].outcome, 'HELD']);
  cases.push(['item 2 at W0.02, not W0: a whole-score loss planted at W0 does not count', items(mkS(cause2), mkW({ 'S126|OPEN0|TS+J|0': { d: -0.5, lo: -0.7, hi: -0.3 }, 'S194|OPEN0|TS+J|0': { d: -0.5, lo: -0.7, hi: -0.3 } }))[1].outcome, 'FALSIFIED']);
  cases.push(['the margin is PRODUCT\'s at the leg\'s own weight: bridge 4\'s PRODUCT at W0 below 95% (margin 0.5): OPEN0 losing 20 to TS+J there is no material harm, where at bridge 4\'s own 99% (margin 0.25) it is harm', (() => { const a = items(mkS({ ...cause2, 'bridge 4|READER|PRODUCT|0': [0, 350], 'bridge 4|READER|OPEN0|0': [20, 0] }), mkW({}))[0].legs[1].o, b = items(mkS({ ...cause2, 'bridge 4|READER|OPEN0|0': [20, 0] }), mkW({}))[0].legs[1].o; return `${a} ${b}`; })(), 'no material harm harm']);
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
  const DIR = args[0] || join(HERE, 'results', 'diag7ac'), DIR7AA = args[1] || join(HERE, 'results', 'diag7aa');
  // 7aa: its stamps, its own gate, its traces (PRODUCT, TS, TS+J)
  const logsA = logsOf(DIR7AA), unitsA = Object.values(logsA).flatMap(A.parse);
  if (A.UNITS.some(([id, a, l]) => !unitsA.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - 7aa: ${unitsA.filter(u => u.done).length} of ${A.UNITS.length} units done in ${DIR7AA}`); process.exit(1); }
  requireFairLogs(logsA, A.PRED);
  const badA = A.gate(unitsA);
  if (badA.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${badA.join('\n  ')}`); process.exit(1); }
  const STA = stampOf(logsA), RAW = {}, T = {};
  for (const u of unitsA) {
    const f = join(DIR7AA, A.traceName(u.id, u.arm, u.label));
    if (!existsSync(f)) { console.log(`FAIR-TEST GATE (7aa): no trace ${f}`); process.exit(1); }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!A.traceAgrees(j, STA, u.arm, u.label, u.run.sim)) { console.log(`FAIR-TEST GATE (7aa): ${f}: count, seed, arm, stamp or survival is not the log's`); process.exit(1); }
    const [rule, wl] = u.label.split('/W');
    RAW[`${u.id}|${u.arm}|${rule}|${wl}`] = j; T[`${u.id}|${u.arm}|${rule}|${wl}`] = { X: decode(j), u };
  }
  // 7ac: its stamps, its gate against 7aa's TS+J and PRODUCT units, its traces
  const logsC = logsOf(DIR), unitsC = Object.values(logsC).flatMap(parse);
  if (UNITS.some(([id, a, w]) => !unitsC.some(u => u.id === id && u.arm === a && u.w === w && u.done))) { console.log(`INCOMPLETE - ${unitsC.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logsC, PRED);
  const refOf = tag => (id, arm, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === label(tag, w));
  const bad = gate(unitsC, refOf('TS+J'), refOf('PRODUCT')), STC = stampOf(logsC);
  if (!bad.length) for (const u of unitsC) for (const rule of RULES) {
    const f = join(DIR, traceName(u.id, u.arm, rule, u.w));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!A.traceAgrees(j, STC, u.arm, label(rule, u.w), u.runs[rule].sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    if (rule === 'TS+J') { if (!sameTrace(j, RAW[`${u.id}|${u.arm}|TS+J|${u.w}`])) bad.push(`${f}: THE IDENTITY FAILS - 7ac's TS+J trace is not 7aa's on every path`); continue; }
    T[`${u.id}|${u.arm}|OPEN0|${u.w}`] = { X: decode(j), u: { ...u, run: u.runs.OPEN0 } };
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
  console.log(`7AC: DOES TS+J PRICE THE OPENING RIGHT? THE FOURTH CELL (predictions/diag-7ac.md; ${N} paths of seed ${SEED}; the fair-test gates passed: both runs' stamps, 7aa's gate, 7ac's gate against 7aa's TS+J and PRODUCT, every trace, and 7ac's TS+J identical to 7aa's on every path)\n`);
  console.log('EVERY UNIT: survival of PRODUCT, TS and TS+J (7aa) and OPEN0; OPEN0 against PRODUCT and against TS+J saved/lost and the whole score (95%, the rule\'s interval at 0.05); the path-years OPEN0 and TS+J hold different tiers, in year 0 and after, and the paths that differ anywhere');
  for (const [id, arm, w] of UNITS) {
    const P = T[`${id}|${arm}|PRODUCT|${w}`], TS = T[`${id}|${arm}|TS|${w}`], J = T[`${id}|${arm}|TS+J|${w}`], O = T[`${id}|${arm}|OPEN0|${w}`];
    const kP = cells(P.X.survived, O.X.survived), kJ = cells(J.X.survived, O.X.survived), wP = WL(id, arm, 'OPEN0', 'PRODUCT', w, ALPHA), wJ = WL(id, arm, 'OPEN0', 'TS+J', w, ALPHA), d = tierDiff(O.X, J.X);
    console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} PRODUCT ${P.u.run.sim.toFixed(4)}  TS ${TS.u.run.sim.toFixed(4)}  TS+J ${J.u.run.sim.toFixed(4)}  OPEN0 ${O.u.run.sim.toFixed(4)} | OPEN0 v PRODUCT ${kP.saved}/${kP.lost} whole ${f3(wP.d)} (${wP.lo.toFixed(3)} to ${wP.hi.toFixed(3)}) | OPEN0 v TS+J ${kJ.saved}/${kJ.lost} whole ${f3(wJ.d)} (${wJ.lo.toFixed(3)} to ${wJ.hi.toFixed(3)}) | tiers differ from TS+J: year 0 ${d.y0}, later ${d.later} path-years, ${d.paths} paths`);
  }
  console.log('\nEACH WORLD: the world table\'s own price of the opening at the true year-0 position (its best move less its best plan\'s-tier move, points) against the survival TS+J and OPEN0 realise in that world (1,000 paths, the shift at the world\'s node), and the realised difference over the price; the mixture\'s price (the gap) beside');
  for (const [id, arm, w] of UNITS) {
    const u = unitsC.find(x => x.id === id && x.arm === arm && x.w === w);
    const ws = u.worlds.map((x, k) => `world ${k} price ${x.price.toFixed(3)} realised ${(x.simJ - x.simO).toFixed(3)}${x.price > 0 ? ` (x${((x.simJ - x.simO) / x.price).toFixed(1)})` : ''}`).join(' | ');
    console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} mixture price ${u.price.mixture.toFixed(4)} | ${ws}`);
  }
  const it = items(S, WL);
  console.log('\nTHE ITEMS (each a Holm family of its own, the regimen\'s reading deciding, the unconditional one beside it; item 2 by the whole-score rule read for a loss)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs || []) console.log(`     ${legText(l)}`);
    for (const l of x.whole || []) console.log(`     ${wholeText(l)}`);
  }
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
}
