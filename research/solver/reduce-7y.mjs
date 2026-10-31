/*
 * 7Y'S REDUCER (predictions/diag-7y.md; PLAN.md 7y): does the tier state (solve.js tierState: the tier held entering the year
 * part of the solved state, the chooser's switching cost and margin in the backward pass) recover what free switching
 * loses, and is it the tier that carries it? Reads the fourteen unit logs of audit-s126.mjs diag7y
 * (results/diag7y/case0-13.txt) and every run's trace.
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs. THE FAIR-TEST GATE (before any figure): every registered unit present
 * once, each solve's ran line at the registered settings (30 points, seed 7002, 8,000 paths, lambda held, the exact final
 * year, 5 return points, the bridge read as registered), the tier state on the TS solves alone, the plan's tier held on the
 * H0 solves alone, every solve of one case and arm differing in nothing else; the solved margin the product's; the plan's
 * tier and the risk-above decision as registered; a gap line on every PRODUCT and TS solve; every registered run and swap
 * line and the done line; the swap unit's re-solves reproducing the P and T units' tables (the same table to the printed
 * digit); every trace agreeing with its log in count, seed, arm, stamp and survival.
 * THE ITEMS, each read by the regimen's rule (exact tests against the case's margin, Holm over the item's legs, three
 * outcomes), the gap item by its registered ratios:
 *   1. the gain: on S126 (reader) and S194 (off), TS gains against PRODUCT (FALSIFIED: no material gain on both)
 *   2. the tier carries it: on both, TS-TIER gains against PRODUCT and TS-REST shows no material gain (FALSIFIED: TS-REST
 *      gains on both and TS-TIER shows no material gain on both)
 *   3. free switching at the opening: on both, TS's year-0 gap is at least 5 times PRODUCT's (FALSIFIED: under 2 times on both)
 *   4. no harm with the reader: on share 0.95, bridge 4 and S360 (reader), TS shows no material harm against PRODUCT
 *      (FALSIFIED: harm on any)
 *   5. O37's harm leg: on S360 under off, TS harms against PRODUCT (FALSIFIED: no material harm)
 * Reported, not items: every run's survival, saved/lost against PRODUCT, switches a path, years below target, estate; the
 * gaps and openings; the swaps; H0 against PRODUCT and TS against H0 on S126 and S194 (O39's arm).
 *   node research/solver/reduce-7y.mjs [dir] > research/solver/results-7y.txt
 *   node research/solver/reduce-7y.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { marginFor, survivalChange } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { switching } from './read-7t-deep.mjs';
import { cells, harmFamily, gainFamily, survivedShare } from './reduce-7v.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7y.md';
export const N = 8000, PTS = '30', SEED = '7002', LAMBDA = '0.0223606797749979', LEVELS = '1,1.1,0.95,0.9,0.8';
export const SIM_TOL = 5e-5 + 1e-9;
export const DECIDED = 'off:_no_tier_above_the_plan';
export const UP = 5, FLAT = 2;
// the registered units: [case, arm, kind]; what each solves and runs
export const UNITS = [['S126', 'READER', 'P'], ['S126', 'READER', 'T'], ['S126', 'READER', 'S'], ['S194', 'OFF', 'P'], ['S194', 'OFF', 'T'], ['S194', 'OFF', 'S'],
  ['share 0.95', 'READER', 'P'], ['share 0.95', 'READER', 'T'], ['bridge 4', 'READER', 'P'], ['bridge 4', 'READER', 'T'],
  ['S360', 'READER', 'P'], ['S360', 'READER', 'T'], ['S360', 'OFF', 'P'], ['S360', 'OFF', 'T']];
const DECOMP = id => id === 'S126' || id === 'S194';
export const SOLVES = (id, kind) => (kind === 'P' ? (DECOMP(id) ? ['PRODUCT', 'H0'] : ['PRODUCT']) : kind === 'T' ? ['TS'] : ['PRODUCT', 'TS']);
export const RUNS = (id, kind) => (kind === 'P' ? (DECOMP(id) ? ['PRODUCT', 'H0'] : ['PRODUCT']) : kind === 'T' ? ['TS'] : ['TS-TIER', 'TS-REST']);

const CASEL = /^(\S.*?)\s+case \| unit (\S+)\/([PTS]) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+)$/;
const SOLVEL = /^\s+solve (\S+)\/(\S+): table (\S+) secs (\S+)$/;
const GAPL = /^\s+gap (\S+)\/(\S+): (\S+) opening (\d+),(\d+)$/;
const RANL = /^\s+ran (\S+)\/(\S+): (.*)$/;
const JOINTL = /^\s+joint (\S+)\/(\S+): (true|false) switchMargin (\S+) scale (\S+) cap (\S+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
const RUNL = /^\s+run (\S+)\/(\S+): sim (\S+) below (\S+) tier-below (\S+) changes (\S+) estate (\S+) secs (\S+)$/;
const SWAPL = /^\s+swap (\S+)\/(\S+): swapped (\d+) same (\d+)$/;
export const field = (ran, k) => { const m = new RegExp(`(?:^|\\s)${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
export const gapNum = g => (g === '0' ? 0 : g === '>1' ? Infinity : Number(g));

export function parse(text) {
  const units = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: m[2], kind: m[3], lambda: m[4], tier: m[5], riskAbove: m[6], mix: m[7], solves: {}, runs: {}, swaps: {}, done: false }; units.push(cur); continue; }
    if (!cur) continue;
    const S = tag => (cur.solves[tag] = cur.solves[tag] || {});
    if ((m = SOLVEL.exec(line)) && m[1] === cur.arm) { Object.assign(S(m[2]), { table: m[3], secs: +m[4] }); continue; }
    if ((m = RANL.exec(line)) && m[1] === cur.arm) { S(m[2]).ran = m[3]; continue; }
    if ((m = GAPL.exec(line)) && m[1] === cur.arm) { S(m[2]).gap = { gap: m[3], open1e3: +m[4], open0: +m[5] }; continue; }
    if ((m = JOINTL.exec(line)) && m[1] === cur.arm) { S(m[2]).joint = { joint: m[3] === 'true', margin: m[4], deathTax: +m[7], tier: m[8], decided: m[9] }; continue; }
    if ((m = RUNL.exec(line)) && m[1] === cur.arm) { cur.runs[m[2]] = { sim: +m[3], below: +m[4], tier: +m[5], changes: +m[6], estate: +m[7], secs: +m[8] }; continue; }
    if ((m = SWAPL.exec(line)) && m[1] === cur.arm) { cur.swaps[m[2]] = { swapped: +m[3], same: +m[4] }; continue; }
    if (line.trim() === `done ${cur.arm}/${cur.kind}`) { cur.done = true; continue; }
  }
  return units;
}
const key = (id, arm, kind) => `${id}|${arm}|${kind}`;
export function gate(units) {
  const bad = [];
  for (const [id, arm, kind] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.kind === kind).length; if (k !== 1) bad.push(`${id} ${arm}/${kind}: ${k} unit lines, not 1`); }
  const strip = s => (s || '').replace(/ tierState \S+/, '').replace(/ holdTier \S+/, '');
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.kind}`;
    if (!UNITS.some(([id, a, k]) => id === u.id && a === u.arm && k === u.kind)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const want = SOLVES(u.id, u.kind);
    if (Object.keys(u.solves).sort().join(',') !== [...want].sort().join(',')) bad.push(`${tag}: solves ${Object.keys(u.solves).join(',') || 'none'}, not ${want.join(',')}`);
    for (const s of want) {
      const x = u.solves[s]; if (!x) continue;
      if (x.table === undefined) bad.push(`${tag} ${s}: no solve line`);
      if (!x.ran) { bad.push(`${tag} ${s}: no ran line`); continue; }
      const w = { mix: '3', pts: PTS, seed: SEED, paths: String(N), grid: `total${PTS}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', tiersAbove: '0', quad: '5', finalIntegral: 'true', bridgeRead: u.arm === 'READER' ? 'reader' : 'false' };
      for (const [k, v] of Object.entries(w)) if (field(x.ran, k) !== v) bad.push(`${tag} ${s}: ${k} is ${field(x.ran, k)}, the prediction names ${v}`);
      if (!!field(x.ran, 'tierState') !== (s === 'TS')) bad.push(`${tag} ${s}: ran tierState ${field(x.ran, 'tierState')}`);
      if ((field(x.ran, 'holdTier') === '0/0') !== (s === 'H0') || (s !== 'H0' && field(x.ran, 'holdTier') !== null)) bad.push(`${tag} ${s}: ran holdTier ${field(x.ran, 'holdTier')}`);
      if (field(x.ran, 'bridgeStep') !== null) bad.push(`${tag} ${s}: ran bridgeStep ${field(x.ran, 'bridgeStep')}`);
      if (s !== 'H0' && !x.gap) bad.push(`${tag} ${s}: no year-0 gap line`);
      if (!x.joint) bad.push(`${tag} ${s}: no joint line`);
      else {
        if (x.joint.joint) bad.push(`${tag} ${s}: ran jointWorlds`);
        if (x.joint.margin !== '0.001') bad.push(`${tag} ${s}: solved with switch margin ${x.joint.margin}`);
        if (x.joint.deathTax !== 0) bad.push(`${tag} ${s}: a pension death charge ${x.joint.deathTax}`);
        if (x.joint.tier !== 'own' || x.joint.decided !== DECIDED) bad.push(`${tag} ${s}: plan tier ${x.joint.tier}, risk above ${x.joint.decided}`);
      }
    }
    // every solve of one case and arm, in every unit, differs in nothing but the tier state and the held tier
    const ref = units.filter(v => v.id === u.id && v.arm === u.arm).flatMap(v => Object.values(v.solves)).find(x => x.ran);
    for (const s of want) if (u.solves[s] && u.solves[s].ran && ref && strip(u.solves[s].ran) !== strip(ref.ran)) bad.push(`${tag} ${s}: differs from another solve of the case beyond the tier state and the held tier`);
    const rw = RUNS(u.id, u.kind);
    if (Object.keys(u.runs).sort().join(',') !== [...rw].sort().join(',')) bad.push(`${tag}: runs ${Object.keys(u.runs).join(',') || 'none'}, not ${rw.join(',')}`);
    if (u.kind === 'S' && Object.keys(u.swaps).sort().join(',') !== 'TS-REST,TS-TIER') bad.push(`${tag}: swap lines ${Object.keys(u.swaps).join(',') || 'none'}`);
    if (!u.done) bad.push(`${tag}: no done line`);
  }
  // the swap unit's re-solves reproduce the P and T units' tables
  for (const id of ['S126', 'S194']) {
    const arm = id === 'S126' ? 'READER' : 'OFF', U = k => units.find(v => v.id === id && v.arm === arm && v.kind === k);
    const P = U('P'), T = U('T'), S = U('S');
    if (P && S && P.solves.PRODUCT && S.solves.PRODUCT && P.solves.PRODUCT.table !== S.solves.PRODUCT.table) bad.push(`${id}: the swap unit's PRODUCT table ${S.solves.PRODUCT.table} is not the P unit's ${P.solves.PRODUCT.table}`);
    if (T && S && T.solves.TS && S.solves.TS && T.solves.TS.table !== S.solves.TS.table) bad.push(`${id}: the swap unit's TS table ${S.solves.TS.table} is not the T unit's ${T.solves.TS.table}`);
  }
  return bad;
}
export const traceName = (id, arm, label) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
export const traceAgrees = (j, ST, arm, label, sim) => !!(j && ST && j.stamp && j.N === N && String(j.seed) === SEED && j.arm === `${arm}/${label}` && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);

const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const legText = x => `${x.label} ${x.k.saved} saved/${x.k.lost} lost ${f3(x.iv.d)} (exact ${x.iv.lo.toFixed(3)} to ${x.iv.hi.toFixed(3)}; unconditional ${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)}${x.disagree ? ' <-- the readings DISAGREE' : ''}) ${x.o}`;
export const ratio = (gT, gP) => { const a = gapNum(gT), b = gapNum(gP); return b === 0 ? (a === 0 ? 1 : Infinity) : a / b; };
export const CASE_ARMS = [['S126', 'READER'], ['S194', 'OFF'], ['share 0.95', 'READER'], ['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']];

/*
 * THE ITEMS. `G(id, arm, tag)` is a solve's gap line, `S(id, arm, label)` a run's survived array. The margin is the case's:
 * marginFor() of its PRODUCT run's survival.
 */
export function items(G, S) {
  const out = [], mar = (id, arm) => marginFor(survivedShare(S(id, arm, 'PRODUCT')));
  const leg = (id, arm, label) => ({ id, label: `${id} (${arm.toLowerCase()}): ${label} against PRODUCT`, k: cells(S(id, arm, 'PRODUCT'), S(id, arm, label)), margin: mar(id, arm) });
  const two = [['S126', 'READER'], ['S194', 'OFF']];
  // 1. the gain
  const i1 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS')));
  out.push({ n: 1, text: 'the gain: on S126 (reader) and S194 (off) the tier state gains against the product (FALSIFIED: no material gain on both)', legs: i1, outcome: tri(i1, x => x.o === 'gain', x => x.o === 'no material gain') });
  // 2. the tier carries it
  const tier = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS-TIER'))), rest = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS-REST')));
  const held2 = tier.every(x => x.o === 'gain') && rest.every(x => x.o === 'no material gain');
  const fals2 = rest.every(x => x.o === 'gain') && tier.every(x => x.o === 'no material gain');
  out.push({ n: 2, text: 'the tier carries it: on both, TS-TIER (the tier state\'s tiers, the product\'s rest) gains against the product and TS-REST (the product\'s tiers, the tier state\'s rest) shows no material gain (FALSIFIED: the reverse on both)', legs: [...tier, ...rest], outcome: held2 ? 'HELD' : fals2 ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 3. free switching at the opening
  const r3 = two.map(([id, arm]) => ({ id, gP: G(id, arm, 'PRODUCT').gap, gT: G(id, arm, 'TS').gap, r: ratio(G(id, arm, 'TS').gap, G(id, arm, 'PRODUCT').gap) }));
  out.push({ n: 3, text: `free switching at the opening: on both, the tier state's year-0 gap is at least ${UP} times the product's (FALSIFIED: under ${FLAT} times on both)`,
    extra: r3.map(x => `${x.id}: gap ${x.gP} with the product, ${x.gT} with the tier state (ratio ${Number.isFinite(x.r) ? x.r.toFixed(2) : 'unbounded'})`),
    outcome: r3.every(x => x.r >= UP) ? 'HELD' : r3.every(x => x.r < FLAT) ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 4. no harm with the reader
  const i4 = harmFamily([['share 0.95', 'READER'], ['bridge 4', 'READER'], ['S360', 'READER']].map(([id, arm]) => leg(id, arm, 'TS')));
  out.push({ n: 4, text: 'no harm with the reader: on share 0.95, bridge 4 and S360, the tier state shows no material harm against the product (FALSIFIED: harm on any)', legs: i4,
    outcome: i4.every(x => x.o === 'no material harm') ? 'HELD' : i4.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 5. O37's harm leg
  const i5 = harmFamily([leg('S360', 'OFF', 'TS')]);
  out.push({ n: 5, text: 'O37\'s harm leg: on S360 under off the tier state harms against the product (FALSIFIED: no material harm)', legs: i5, outcome: i5[0].o === 'harm' ? 'HELD' : i5[0].o === 'no material harm' ? 'FALSIFIED' : 'INCONCLUSIVE' });
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, arm, s) => `mix 3 pts 30 seed 7002 paths ${N} grid total30x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot ${id === 'S194' ? 31000 : 29000} quad 5${s === 'H0' ? ' holdTier 0/0' : ''}${s === 'TS' ? ' tierState 0/0,1/1,2/2' : ''} finalIntegral true bridgeRead ${arm === 'READER' ? 'reader' : 'false'}`;
  const unitText = (id, arm, kind, o = {}) => {
    const lines = [`${id.padEnd(16)} case | unit ${arm}/${kind} | lambda ${LAMBDA} tier own riskAbove auto mix 3`];
    for (const s of (o.solves || SOLVES(id, kind))) {
      lines.push(`${''.padEnd(16)} solve ${arm}/${s}: table ${(o.table && o.table[s]) || (s === 'TS' ? '91.0000' : '90.0000')} secs 1`, `${''.padEnd(16)} ran ${arm}/${s}: ${(o.ran && o.ran[s]) || ranOf(id, arm, s)}`);
      if (s !== 'H0' && !o.noGap) lines.push(`${''.padEnd(16)} gap ${arm}/${s}: 2.0000e-4 opening 0,2`);
      lines.push(`${''.padEnd(16)} joint ${arm}/${s}: false switchMargin ${o.margin || '0.001'} scale 1 cap 1 deathTax 0 tier own riskAbove ${DECIDED}`);
    }
    for (const r of (o.runs || RUNS(id, kind))) {
      lines.push(`${''.padEnd(16)} run ${arm}/${r}: sim 90.0000 below 1.00 tier-below 1.00 changes 0.100 estate 1 secs 1`);
      if (kind === 'S' && !o.noSwap) lines.push(`${''.padEnd(16)} swap ${arm}/${r}: swapped 10 same 90`);
    }
    if (!o.noDone) lines.push(`${''.padEnd(16)} done ${arm}/${kind}`);
    return lines.join('\n');
  };
  const good = () => UNITS.map(([id, a, k]) => unitText(id, a, k)).join('\n');
  cases.push(['a log parsed and gated: fourteen units, the gate passes', `${parse(good()).length} ${gate(parse(good())).length}`, '14 0']);
  const bent = (id, arm, kind, o) => UNITS.map(([i, a, k]) => unitText(i, a, k, i === id && a === arm && k === kind ? o : {})).join('\n');
  const refused = t => String(gate(parse(t)).length > 0);
  const allBent = f => UNITS.map(([id, a, k]) => unitText(id, a, k, { ran: Object.fromEntries(SOLVES(id, k).map(s => [s, f(ranOf(id, a, s))])) })).join('\n');
  cases.push(['the gate refuses 16 points on one solve', refused(bent('S126', 'READER', 'T', { ran: { TS: ranOf('S126', 'READER', 'TS').replace('pts 30', 'pts 16').replace('total30x6x6', 'total16x6x6') } })), 'true']);
  cases.push(['the gate refuses the tier state missing on a TS solve', refused(bent('S194', 'OFF', 'T', { ran: { TS: ranOf('S194', 'OFF', 'PRODUCT') } })), 'true']);
  cases.push(['the gate refuses the tier state on a PRODUCT solve', refused(bent('bridge 4', 'READER', 'P', { ran: { PRODUCT: ranOf('bridge 4', 'READER', 'TS') } })), 'true']);
  cases.push(['the gate refuses the held tier missing on H0', refused(bent('S126', 'READER', 'P', { ran: { H0: ranOf('S126', 'READER', 'PRODUCT') } })), 'true']);
  cases.push(['the gate refuses a held tier on PRODUCT', refused(bent('S194', 'OFF', 'P', { ran: { PRODUCT: ranOf('S194', 'OFF', 'H0') } })), 'true']);
  cases.push(['the gate refuses Q\'s fix on any solve', refused(bent('share 0.95', 'READER', 'T', { ran: { TS: ranOf('share 0.95', 'READER', 'TS').replace(' finalIntegral', ' bridgeStep exact finalIntegral') } })), 'true']);
  cases.push(['the gate refuses the reader off on a READER unit', refused(bent('S360', 'READER', 'T', { ran: { TS: ranOf('S360', 'READER', 'TS').replace('bridgeRead reader', 'bridgeRead false') } })), 'true']);
  cases.push(['the gate refuses the reader on an OFF unit', refused(bent('S360', 'OFF', 'P', { ran: { PRODUCT: ranOf('S360', 'OFF', 'PRODUCT').replace('bridgeRead false', 'bridgeRead reader') } })), 'true']);
  cases.push(['the gate refuses a second setting changed within a case (the minimum pot)', refused(bent('S126', 'READER', 'T', { ran: { TS: ranOf('S126', 'READER', 'TS').replace('minPot 29000', 'minPot 30000') } })), 'true']);
  cases.push(['the gate refuses the wrong seed on every solve', refused(allBent(r => r.replace('seed 7002', 'seed 7013'))), 'true']);
  cases.push(['the gate refuses another path count on every solve', refused(allBent(r => r.replace(`paths ${N}`, 'paths 3000'))), 'true']);
  cases.push(['the gate refuses 16 points on every solve (the grid unchanged)', refused(allBent(r => r.replace('pts 30', 'pts 16'))), 'true']);
  cases.push(['the gate refuses 15 return points on every solve', refused(allBent(r => r.replace('quad 5', 'quad 15'))), 'true']);
  cases.push(['the gate refuses an averaged final year on every solve', refused(allBent(r => r.replace('finalIntegral true', 'finalIntegral false'))), 'true']);
  cases.push(['the gate refuses Q\'s fix on every solve', refused(allBent(r => r.replace(' finalIntegral', ' bridgeStep exact finalIntegral'))), 'true']);
  cases.push(['the gate refuses a missing H0 solve, its run still logged', refused(bent('S194', 'OFF', 'P', { solves: ['PRODUCT'] })), 'true']);
  cases.push(['the gate refuses a missing H0 run, its solve still logged', refused(bent('S126', 'READER', 'P', { runs: ['PRODUCT'] })), 'true']);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, a, k]) => unitText(id, a, k)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(good() + '\n' + unitText('S126', 'READER', 'T')), 'true']);
  cases.push(['the gate refuses a solve at another margin', refused(bent('S194', 'OFF', 'S', { margin: '0' })), 'true']);
  cases.push(['the gate refuses a missing H0 solve on S126', refused(bent('S126', 'READER', 'P', { solves: ['PRODUCT'], runs: ['PRODUCT'] })), 'true']);
  cases.push(['the gate refuses a missing run', refused(bent('S194', 'OFF', 'S', { runs: ['TS-TIER'] })), 'true']);
  cases.push(['the gate refuses a missing swap line', refused(bent('S126', 'READER', 'S', { noSwap: true })), 'true']);
  cases.push(['the gate refuses a missing gap line', refused(bent('share 0.95', 'READER', 'P', { noGap: true })), 'true']);
  cases.push(['the gate refuses a missing done line', refused(bent('bridge 4', 'READER', 'T', { noDone: true })), 'true']);
  cases.push(['the gate refuses a swap unit whose PRODUCT re-solve differs from the P unit\'s', refused(bent('S126', 'READER', 'S', { table: { PRODUCT: '90.0001' } })), 'true']);
  cases.push(['the gate refuses a swap unit whose TS re-solve differs from the T unit\'s', refused(bent('S194', 'OFF', 'S', { table: { TS: '91.0001' } })), 'true']);
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, j = { N, seed: 7002, arm: 'READER/TS', sim: 90.03333333, stamp: { ...ST } };
    cases.push(['a trace agrees within 0.00005 of its four-decimal line, and no further', [traceAgrees(j, ST, 'READER', 'TS', 90.0333), traceAgrees({ ...j, sim: 90.03335 }, ST, 'READER', 'TS', 90.0334), traceAgrees(j, ST, 'READER', 'TS', 90.0335), traceAgrees({ ...j, seed: 7013 }, ST, 'READER', 'TS', 90.0333), traceAgrees(j, ST, 'OFF', 'TS', 90.0333)].join(','), 'true,true,false,false,false']); }
  cases.push(['the trace name carries the case, the arm and the run', traceName('share 0.95', 'READER', 'TS-TIER'), 'share_0.95-reader-ts-tier.json.gz']);
  // the items on planted stories
  const mkS = spec => (id, arm, label) => { const k = spec[`${id}|${arm}|${label}`] || [0, 0]; const a = new Uint8Array(N).fill(1); for (let i = 0; i < 100; i++) a[i] = 0; for (let i = 0; i < k[0]; i++) a[i] = 1; for (let i = 100; i < 100 + k[1]; i++) a[i] = 0; return a; };
  const mkG = gaps => (id, arm, tag) => ({ gap: gaps[`${id}|${tag}`] || '2.0000e-4', open1e3: 0, open0: 2 });
  const fsS = { 'S126|READER|TS': [40, 0], 'S194|OFF|TS': [43, 0], 'S126|READER|TS-TIER': [38, 0], 'S194|OFF|TS-TIER': [41, 0], 'S360|OFF|TS': [5, 400] };
  const fsG = { 'S126|PRODUCT': '8.0000e-4', 'S126|TS': '6.0000e-3', 'S194|PRODUCT': '7.5000e-4', 'S194|TS': '5.0000e-3' };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  cases.push(['FS as the deep review states it: 1 to 5 HELD', outs(items(mkG(fsG), mkS(fsS))), '1 HELD, 2 HELD, 3 HELD, 4 HELD, 5 HELD']);
  cases.push(['the tier state doing nothing: 1, 2 and 3 not HELD, 5 FALSIFIED', outs(items(mkG({}), mkS({}))), '1 FALSIFIED, 2 INCONCLUSIVE, 3 FALSIFIED, 4 HELD, 5 FALSIFIED']);
  cases.push(['the rest carries it: item 2 FALSIFIED', items(mkG(fsG), mkS({ ...fsS, 'S126|READER|TS-TIER': [0, 0], 'S194|OFF|TS-TIER': [0, 0], 'S126|READER|TS-REST': [38, 0], 'S194|OFF|TS-REST': [41, 0] }))[1].outcome, 'FALSIFIED']);
  cases.push(['both carry some: item 2 INCONCLUSIVE', items(mkG(fsG), mkS({ ...fsS, 'S126|READER|TS-REST': [30, 0], 'S194|OFF|TS-REST': [30, 0] }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['the tier carries it on one case only: item 2 INCONCLUSIVE', items(mkG(fsG), mkS({ ...fsS, 'S194|OFF|TS-TIER': [0, 0] }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['a gain on one case only: item 1 INCONCLUSIVE', items(mkG(fsG), mkS({ ...fsS, 'S194|OFF|TS': [0, 0] }))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['the gap three times on both: item 3 INCONCLUSIVE; five times on one: INCONCLUSIVE', `${items(mkG({ ...fsG, 'S126|TS': '2.4000e-3', 'S194|TS': '2.2500e-3' }), mkS(fsS))[2].outcome} ${items(mkG({ ...fsG, 'S194|TS': '1.0000e-3' }), mkS(fsS))[2].outcome}`, 'INCONCLUSIVE INCONCLUSIVE']);
  cases.push(['the product\'s gap 0 and the tier state\'s above it: unbounded, item 3 HELD', items(mkG({ ...fsG, 'S126|PRODUCT': '0', 'S194|PRODUCT': '0' }), mkS(fsS))[2].outcome, 'HELD']);
  cases.push(['harm on bridge 4 with the reader: item 4 FALSIFIED', items(mkG(fsG), mkS({ ...fsS, 'bridge 4|READER|TS': [0, 60] }))[3].outcome, 'FALSIFIED']);
  cases.push(['harm on S360 with the reader: item 4 FALSIFIED', items(mkG(fsG), mkS({ ...fsS, 'S360|READER|TS': [0, 60] }))[3].outcome, 'FALSIFIED']);
  cases.push(['S360 under off level: item 5 FALSIFIED', items(mkG(fsG), mkS({ ...fsS, 'S360|OFF|TS': [0, 0] }))[4].outcome, 'FALSIFIED']);
  cases.push(['S360 under off saving 40 and losing 55: item 5 INCONCLUSIVE (neither harm nor under the margin)', items(mkG(fsG), mkS({ ...fsS, 'S360|OFF|TS': [40, 55] }))[4].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 losing 30 paths (0.375 points) is harm at its own margin, 0.25: item 4 FALSIFIED', items(mkG(fsG), mkS({ ...fsS, 'bridge 4|READER|TS': [0, 30] }))[3].outcome, 'FALSIFIED']);
  cases.push(['the margin is the case\'s own: S126 at 0.25, 30 lost reads harm', harmFamily([{ label: 'x', k: cells(mkS({})('S126', 'READER', 'PRODUCT'), mkS({ 'S126|READER|TS': [0, 30] })('S126', 'READER', 'TS')), margin: marginFor(survivedShare(mkS({})('S126', 'READER', 'PRODUCT'))) }])[0].o, 'harm']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(HERE, 'results', 'diag7y');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  const units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, k]) => !units.some(u => u.id === id && u.arm === a && u.kind === k && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const T = {};
  if (!bad.length) for (const u of units) for (const label of Object.keys(u.runs)) {
    const f = join(DIR, traceName(u.id, u.arm, label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, u.arm, label, u.runs[label].sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const X = decode(j);
    if (Math.abs(survivedShare(X.survived) - u.runs[label].sim) > SIM_TOL) bad.push(`${f}: its survived paths give ${survivedShare(X.survived)}, the run line ${u.runs[label].sim}`);
    T[`${u.id}|${u.arm}|${label}`] = { X, run: u.runs[label], swap: u.swaps[label] };
  }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const S = (id, arm, label) => T[`${id}|${arm}|${label}`].X.survived;
  const G = (id, arm, tag) => { const u = units.find(v => v.id === id && v.arm === arm && v.solves[tag] && v.solves[tag].gap); return u.solves[tag].gap; };
  console.log(`7Y: DOES THE TIER STATE RECOVER WHAT FREE SWITCHING LOSES, AND IS IT THE TIER THAT CARRIES IT? (predictions/diag-7y.md; ${N} paths of seed ${SEED}; the fair-test gate passed: the stamps, every unit's solves and settings, every run and trace, the re-solves reproducing)\n`);
  console.log('EVERY RUN: survival; against PRODUCT on the same case and arm saved/lost; pension switches a path; years below target; estate; the swaps');
  for (const [id, arm] of CASE_ARMS) {
    console.log(`${id} (${arm.toLowerCase()})`);
    for (const label of ['PRODUCT', 'TS', 'TS-TIER', 'TS-REST', 'H0']) {
      const x = T[`${id}|${arm}|${label}`]; if (!x) continue;
      const k = cells(S(id, arm, 'PRODUCT'), x.X.survived);
      console.log(`  ${label.padEnd(8)} ${x.run.sim.toFixed(4).padStart(8)}  ${`${k.saved}/${k.lost}`.padStart(9)}  switches ${switching(x.X).perPath.toFixed(2)}  below ${x.run.below.toFixed(2)}  estate ${x.run.estate}${x.swap ? `  swapped ${x.swap.swapped} of ${x.swap.swapped + x.swap.same} path-years` : ''}`);
    }
    for (const tag of ['PRODUCT', 'TS']) { const g = G(id, arm, tag); console.log(`  ${tag} gap ${g.gap}, opens ${g.open1e3} at 1e-3, ${g.open0} at 0`); }
  }
  console.log('\nO39\'S ARM (reported): the plan\'s tier held for life against PRODUCT, and the tier state against it, on S126 and S194 (saved/lost, the exact interval beside)');
  for (const [id, arm] of [['S126', 'READER'], ['S194', 'OFF']]) for (const [a, b] of [['PRODUCT', 'H0'], ['H0', 'TS']]) { const k = cells(S(id, arm, a), S(id, arm, b)), iv = survivalChange(k.lost, k.saved, k.N, 0.05); console.log(`  ${id.padEnd(5)} ${b} against ${a}: ${k.saved}/${k.lost} ${f3(iv.d)} (exact ${iv.lo.toFixed(3)} to ${iv.hi.toFixed(3)})`); }
  const it = items(G, S);
  console.log('\nTHE ITEMS (each a Holm family of its own where it tests paths, the regimen\'s reading deciding, the unconditional one beside it; the gap item by its registered ratios)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs || []) console.log(`     ${legText(l)}`);
    for (const e of x.extra || []) console.log(`     ${e}`);
  }
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
}
