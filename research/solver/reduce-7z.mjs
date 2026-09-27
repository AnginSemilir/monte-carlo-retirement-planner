/*
 * 7Z'S REDUCER (predictions/diag-7z.md; PLAN.md 7z): does integrating across the reader's step in the chooser (Q's fix,
 * solve.js bridgeStep 'exact') gain on share 0.95 without harm elsewhere? Reads the eight unit logs of audit-s126.mjs diag7z
 * (results/diag7z/case0-7.txt) and every run's trace.
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs (one code version, launched under predictions/diag-7z.md at the blob each
 * log carries). THE FAIR-TEST GATE (before any figure): every registered unit present once, its ran line at the registered
 * settings (30 points, seed 7002, 8,000 paths, lambda 7t's to 7x's, the exact final year, 5 return points, the reader on,
 * Q's fix on READER+STEP units alone), the two units of one case differing in nothing but the fix, the solved margin the
 * product's, the plan's tier and the risk-above decision as registered, the reader years (none on S194, some elsewhere), a
 * year-0 gap line, a run line and a done line; every trace agreeing with its log in count, seed, arm, stamp and survival
 * (within half the run line's last printed place).
 * THE ITEMS, each read by the regimen's rule (exact tests against the case's margin, Holm over the item's legs, three
 * outcomes), the gap item by its registered bounds:
 *   1. the gain: on share 0.95, READER+STEP against READER at the product's margin gains (FALSIFIED: no material gain)
 *   2. the opening: with the fix, share 0.95's year-0 gap is at least 2e-3 and it opens de-risked at the product's margin
 *      (FALSIFIED: the gap below the margin, 1e-3 - the chooser keeps the plan's tier)
 *   3. no harm: on S126 and bridge 4, READER+STEP against READER shows no material harm on both (FALSIFIED: harm on either)
 *   4. the control: on S194 (no reader year) the two runs are the same path by path: survival, spend level and tier in
 *      every year, and the table (FALSIFIED: anything differs - the fix acts where it cannot)
 * Reported, not items: every run's survival, saved/lost, pension switches a path, estate, years below target, the gaps.
 *   node research/solver/reduce-7z.mjs [dir] > research/solver/results-7z.txt
 *   node research/solver/reduce-7z.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { marginFor } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { switching } from './read-7t-deep.mjs';
import { cells, harmFamily, gainFamily, survivedShare } from './reduce-7v.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7z.md';
export const N = 8000, PTS = '30', SEED = '7002', LAMBDA = '0.0223606797749979', LEVELS = '1,1.1,0.95,0.9,0.8';
export const SIM_TOL = 5e-5 + 1e-9;
export const CASES = ['share 0.95', 'S126', 'bridge 4', 'S194'];
export const ARMS = ['READER', 'READER+STEP'];
export const UNITS = ARMS.flatMap(a => CASES.map(id => [id, a]));
export const DECIDED = 'off:_no_tier_above_the_plan';
export const MARGIN = 0.001, GAP_HELD = 2e-3;

const CASEL = /^(\S.*?)\s+case \| unit (\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+)$/;
const SOLVEL = /^\s+solve (\S+): table (\S+) secs (\S+)$/;
const GAPL = /^\s+gap (\S+): (\S+) opening (\d+),(\d+)$/;
const RANL = /^\s+ran (\S+): (.*)$/;
const JOINTL = /^\s+joint (\S+): (true|false) switchMargin (\S+) scale (\S+) cap (\S+) deathTax (\S+) tier (\S+) riskAbove (\S+) readerYears (\d+)$/;
const RUNL = /^\s+run (\S+): sim (\S+) below (\S+) tier-below (\S+) changes (\S+) estate (\S+) secs (\S+)$/;
export const field = (ran, k) => { const m = new RegExp(`(?:^|\\s)${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
export const gapNum = g => (g === '0' ? 0 : g === '>1' ? Infinity : Number(g));

export function parse(text) {
  const units = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), label: m[2], lambda: m[3], tier: m[4], riskAbove: m[5], mix: m[6], done: false }; units.push(cur); continue; }
    if (!cur) continue;
    if ((m = SOLVEL.exec(line)) && m[1] === cur.label) { cur.solve = { table: +m[2], secs: +m[3] }; continue; }
    if ((m = GAPL.exec(line)) && m[1] === cur.label) { cur.gap = { gap: m[2], open1e3: +m[3], open0: +m[4] }; continue; }
    if ((m = RANL.exec(line)) && m[1] === cur.label) { cur.ran = m[2]; continue; }
    if ((m = JOINTL.exec(line)) && m[1] === cur.label) { cur.joint = { joint: m[2] === 'true', margin: m[3], deathTax: +m[6], tier: m[7], decided: m[8], readerYears: +m[9] }; continue; }
    if ((m = RUNL.exec(line)) && m[1] === cur.label) { cur.run = { sim: +m[2], below: +m[3], tier: +m[4], changes: +m[5], estate: +m[6], secs: +m[7] }; continue; }
    if (/^\s+done (\S+)$/.test(line) && line.trim() === `done ${cur.label}`) { cur.done = true; continue; }
  }
  return units;
}
export function gate(units) {
  const bad = [];
  for (const [id, label] of UNITS) { const k = units.filter(u => u.id === id && u.label === label).length; if (k !== 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`); }
  const strip = s => (s || '').replace(/ bridgeStep \S+/, '');
  for (const u of units) {
    if (!UNITS.some(([id, l]) => id === u.id && l === u.label)) { bad.push(`${u.id} ${u.label}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${u.id} ${u.label}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    if (!u.solve) bad.push(`${u.id} ${u.label}: no solve line`);
    if (!u.gap) bad.push(`${u.id} ${u.label}: no year-0 gap line`);
    if (!u.ran) { bad.push(`${u.id} ${u.label}: no ran line`); continue; }
    const w = { mix: '3', pts: PTS, seed: SEED, paths: String(N), grid: `total${PTS}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', tiersAbove: '0', quad: '5', finalIntegral: 'true', bridgeRead: 'reader' };
    for (const [k, v] of Object.entries(w)) if (field(u.ran, k) !== v) bad.push(`${u.id} ${u.label}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
    const step = u.label === 'READER+STEP';
    if (field(u.ran, 'bridgeStep') !== (step ? 'exact' : null)) bad.push(`${u.id} ${u.label}: ran bridgeStep ${field(u.ran, 'bridgeStep')}`);
    const first = units.find(x => x.id === u.id && x.ran);
    if (strip(u.ran) !== strip(first.ran)) bad.push(`${u.id} ${u.label}: differs from ${first.label} beyond Q's fix`);
    if (!u.joint) bad.push(`${u.id} ${u.label}: no joint line`);
    else {
      if (u.joint.joint) bad.push(`${u.id} ${u.label}: ran jointWorlds`);
      if (u.joint.margin !== '0.001') bad.push(`${u.id} ${u.label}: solved with switch margin ${u.joint.margin}`);
      if (u.joint.deathTax !== 0) bad.push(`${u.id} ${u.label}: a pension death charge ${u.joint.deathTax}`);
      if (u.joint.tier !== 'own' || u.joint.decided !== DECIDED) bad.push(`${u.id} ${u.label}: plan tier ${u.joint.tier}, risk above ${u.joint.decided}`);
      if ((u.id === 'S194') !== (u.joint.readerYears === 0)) bad.push(`${u.id} ${u.label}: ${u.joint.readerYears} reader years (S194 has none, the bridge cases some)`);
    }
    if (!u.run) bad.push(`${u.id} ${u.label}: no run line`);
    if (!u.done) bad.push(`${u.id} ${u.label}: no done line`);
  }
  return bad;
}
export const traceName = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
export const traceAgrees = (j, ST, label, sim) => !!(j && ST && j.stamp && j.N === N && String(j.seed) === SEED && j.arm === label && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);

const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const legText = x => `${x.label} ${x.k.saved} saved/${x.k.lost} lost ${f3(x.iv.d)} (exact ${x.iv.lo.toFixed(3)} to ${x.iv.hi.toFixed(3)}; unconditional ${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)}${x.disagree ? ' <-- the readings DISAGREE' : ''}) ${x.o}`;
// two traces the same path by path: survival, and the spend level and tier in every year
export const sameRuns = (A, B) => { if (A.survived.length !== B.survived.length || A.level.length !== B.level.length || A.tier.length !== B.tier.length) return false; for (let i = 0; i < A.survived.length; i++) if (A.survived[i] !== B.survived[i]) return false; for (let i = 0; i < A.level.length; i++) if (A.level[i] !== B.level[i] || A.tier[i] !== B.tier[i]) return false; return true; };

/*
 * THE ITEMS. `U(id, label)` is a unit (its gap and solve lines), `S(id, label)` its run's survived array, `X(id, label)` its
 * decoded trace. The margin is the case's: marginFor() of its READER run's survival.
 */
export function items(U, S, X) {
  const out = [], mar = id => marginFor(survivedShare(S(id, 'READER')));
  const leg = id => ({ id, label: `${id}: READER+STEP against READER`, k: cells(S(id, 'READER'), S(id, 'READER+STEP')), margin: mar(id) });
  // 1. the gain
  const i1 = gainFamily([leg('share 0.95')]);
  out.push({ n: 1, text: 'the gain: on share 0.95 the fix gains against the reader without it, at the product\'s margin (FALSIFIED: no material gain)', legs: i1, outcome: tri(i1, x => x.o === 'gain', x => x.o === 'no material gain') });
  // 2. the opening
  const g = U('share 0.95', 'READER+STEP').gap, g0 = U('share 0.95', 'READER').gap, gn = gapNum(g.gap);
  out.push({ n: 2, text: `the opening: with the fix, share 0.95's year-0 gap is at least ${GAP_HELD} and it opens de-risked at the product's margin (FALSIFIED: the gap below ${MARGIN}, the plan's tier kept)`,
    extra: [`share 0.95: gap ${g0.gap} without the fix (opens ${g0.open1e3} at 1e-3), ${g.gap} with it (opens ${g.open1e3} at 1e-3, ${g.open0} at 0)`],
    outcome: gn >= GAP_HELD && g.open1e3 !== 0 ? 'HELD' : gn < MARGIN ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 3. no harm
  const i3 = harmFamily(['S126', 'bridge 4'].map(leg));
  out.push({ n: 3, text: 'no harm: on S126 and bridge 4 the fix shows no material harm against the reader without it (FALSIFIED: harm on either)', legs: i3,
    outcome: i3.every(x => x.o === 'no material harm') ? 'HELD' : i3.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 4. the control
  const same = sameRuns(X('S194', 'READER'), X('S194', 'READER+STEP')) && U('S194', 'READER').solve.table === U('S194', 'READER+STEP').solve.table;
  out.push({ n: 4, text: 'the control: on S194 (no reader year) the two runs are the same path by path and the tables the same (FALSIFIED: anything differs)',
    extra: [`S194: ${same ? 'the same' : 'DIFFERENT'} (survival, spend level and tier in every year of every path; the table ${U('S194', 'READER').solve.table} and ${U('S194', 'READER+STEP').solve.table})`],
    outcome: same ? 'HELD' : 'FALSIFIED' });
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, label) => `mix 3 pts 30 seed 7002 paths ${N} grid total30x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot ${id === 'S194' ? 31000 : 29000} quad 5${label === 'READER+STEP' ? ' bridgeStep exact' : ''} finalIntegral true bridgeRead reader`;
  const unitText = (id, label, { gap = '2.0000e-4', open = '0,2', ran = ranOf(id, label), margin = '0.001', ry = id === 'S194' ? 0 : 2, run = true, done = true, table = '90.0000' } = {}) => [
    `${id.padEnd(16)} case | unit ${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`,
    `${''.padEnd(16)} solve ${label}: table ${table} secs 1`, `${''.padEnd(16)} ran ${label}: ${ran}`, `${''.padEnd(16)} gap ${label}: ${gap} opening ${open}`,
    `${''.padEnd(16)} joint ${label}: false switchMargin ${margin} scale 1 cap 1 deathTax 0 tier own riskAbove ${DECIDED} readerYears ${ry}`,
    ...(run ? [`${''.padEnd(16)} run ${label}: sim 90.0000 below 1.00 tier-below 1.00 changes 0.100 estate 1 secs 1`] : []), ...(done ? [`${''.padEnd(16)} done ${label}`] : [])].join('\n');
  const good = () => UNITS.map(([id, l]) => unitText(id, l)).join('\n');
  const g0 = gate(parse(good()));
  cases.push(['a log parsed and gated: eight units, the gate passes', `${parse(good()).length} ${g0.length}`, '8 0']);
  const bent = (id, label, o) => UNITS.map(([i, l]) => unitText(i, l, i === id && l === label ? o : {})).join('\n');
  const refused = t => String(gate(parse(t)).length > 0);
  cases.push(['the gate refuses 16 points on one unit', refused(bent('S126', 'READER+STEP', { ran: ranOf('S126', 'READER+STEP').replace('pts 30', 'pts 16').replace('total30x6x6', 'total16x6x6') })), 'true']);
  cases.push(['the gate refuses the fix missing on a STEP unit', refused(bent('share 0.95', 'READER+STEP', { ran: ranOf('share 0.95', 'READER') })), 'true']);
  cases.push(['the gate refuses the fix on a READER unit', refused(bent('S126', 'READER', { ran: ranOf('S126', 'READER+STEP') })), 'true']);
  cases.push(['the gate refuses the reader off', refused(bent('bridge 4', 'READER', { ran: ranOf('bridge 4', 'READER').replace('bridgeRead reader', 'bridgeRead false') })), 'true']);
  cases.push(['the gate refuses 15 return points', refused(bent('share 0.95', 'READER', { ran: ranOf('share 0.95', 'READER').replace('quad 5', 'quad 15') })), 'true']);
  cases.push(['the gate refuses the wrong seed', refused(bent('S194', 'READER', { ran: ranOf('S194', 'READER').replace('seed 7002', 'seed 7013') })), 'true']);
  cases.push(['the gate refuses another path count', refused(bent('S194', 'READER', { ran: ranOf('S194', 'READER').replace(`paths ${N}`, 'paths 3000') })), 'true']);
  cases.push(['the gate refuses a second setting changed within a case (the minimum pot)', refused(bent('share 0.95', 'READER+STEP', { ran: ranOf('share 0.95', 'READER+STEP').replace('minPot 29000', 'minPot 30000') })), 'true']);
  // the same setting changed on EVERY unit (no within-case comparison can see it): each field must be read by itself
  const allBent = f => UNITS.map(([id, l]) => unitText(id, l, { ran: f(ranOf(id, l)) })).join('\n');
  cases.push(['the gate refuses the wrong seed on every unit', refused(allBent(r => r.replace('seed 7002', 'seed 7013'))), 'true']);
  cases.push(['the gate refuses another path count on every unit', refused(allBent(r => r.replace(`paths ${N}`, 'paths 3000'))), 'true']);
  cases.push(['the gate refuses 16 points on every unit (the grid unchanged)', refused(allBent(r => r.replace('pts 30', 'pts 16'))), 'true']);
  cases.push(['the gate refuses 15 return points on every unit', refused(allBent(r => r.replace('quad 5', 'quad 15'))), 'true']);
  cases.push(['the gate refuses the reader off on every unit', refused(allBent(r => r.replace('bridgeRead reader', 'bridgeRead false'))), 'true']);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, l]) => unitText(id, l)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(good() + '\n' + unitText('S126', 'READER')), 'true']);
  cases.push(['the gate refuses a solve at another margin', refused(bent('S126', 'READER', { margin: '0' })), 'true']);
  cases.push(['the gate refuses reader years on S194', refused(bent('S194', 'READER+STEP', { ry: 1 })), 'true']);
  cases.push(['the gate refuses no reader years on a bridge case', refused(bent('bridge 4', 'READER+STEP', { ry: 0 })), 'true']);
  cases.push(['the gate refuses a unit with no run line', refused(bent('bridge 4', 'READER', { run: false })), 'true']);
  cases.push(['the gate refuses a unit with no done line', refused(bent('bridge 4', 'READER+STEP', { done: false })), 'true']);
  cases.push(['the gate refuses a unit with no gap line', refused(good().split('\n').filter(l => !/^\s+gap READER\+STEP: /.test(l)).join('\n')), 'true']);
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, j = { N, seed: 7002, arm: 'READER', sim: 90.03333333, stamp: { ...ST } };
    cases.push(['a trace agrees within 0.00005 of its four-decimal line, and no further', [traceAgrees(j, ST, 'READER', 90.0333), traceAgrees({ ...j, sim: 90.03335 }, ST, 'READER', 90.0334), traceAgrees(j, ST, 'READER', 90.0335), traceAgrees({ ...j, seed: 7013 }, ST, 'READER', 90.0333), traceAgrees(j, ST, 'READER+STEP', 90.0333)].join(','), 'true,true,false,false,false']); }
  cases.push(['the gap as logged: 0, >1 and a number', `${gapNum('0')} ${gapNum('>1')} ${gapNum('2.5e-4')}`, '0 Infinity 0.00025']);
  // the items on planted stories: survived arrays built from counts against a reference; traces for the control
  const mkS = spec => (id, label) => { const k = spec[`${id}|${label}`] || [0, 0]; const a = new Uint8Array(N).fill(1); for (let i = 0; i < 100; i++) a[i] = 0; for (let i = 0; i < k[0]; i++) a[i] = 1; for (let i = 100; i < 100 + k[1]; i++) a[i] = 0; return a; };
  const mkU = (gaps, tables = {}) => (id, label) => ({ gap: gaps[`${id}|${label}`] || { gap: '2.0000e-4', open1e3: 0, open0: 2 }, solve: { table: tables[`${id}|${label}`] ?? 90 } });
  const mkX = (S, diff = null) => (id, label) => { const Y = 3, lv = new Uint8Array(N * Y).fill(100), tr = new Uint8Array(N * Y); if (diff && diff.id === id && diff.label === label) (diff.what === 'level' ? lv : tr)[5] = diff.what === 'level' ? 90 : 8; return { survived: S(id, label), level: lv, tier: tr }; };
  const qGaps = { 'share 0.95|READER|': null, 'share 0.95|READER+STEP': { gap: '2.0000e-2', open1e3: 2, open0: 2 } };
  const qS = { 'share 0.95|READER+STEP': [190, 0], 'S126|READER+STEP': [40, 0] };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  const run = (gaps, spec, opts = {}) => { const S = mkS(spec); return items(mkU(gaps, opts.tables), S, mkX(S, opts.diff)); };
  cases.push(['the fix as predicted: 1, 2, 3 and 4 HELD', outs(run(qGaps, qS)), '1 HELD, 2 HELD, 3 HELD, 4 HELD']);
  cases.push(['the fix doing nothing: 1 and 2 FALSIFIED, 3 and 4 HELD', outs(run({}, {})), '1 FALSIFIED, 2 FALSIFIED, 3 HELD, 4 HELD']);
  cases.push(['a gap past the margin but under 2e-3 is item 2 INCONCLUSIVE', run({ 'share 0.95|READER+STEP': { gap: '1.5000e-3', open1e3: 2, open0: 2 } }, qS)[1].outcome, 'INCONCLUSIVE']);
  cases.push(['a large gap that keeps the plan\'s tier at 1e-3 is not item 2 HELD', run({ 'share 0.95|READER+STEP': { gap: '5.0000e-3', open1e3: 0, open0: 2 } }, qS)[1].outcome, 'INCONCLUSIVE']);
  cases.push(['the gap exactly at the margin is not FALSIFIED', run({ 'share 0.95|READER+STEP': { gap: '1.0000e-3', open1e3: 0, open0: 2 } }, qS)[1].outcome, 'INCONCLUSIVE']);
  cases.push(['harm on bridge 4 alone is item 3 FALSIFIED', run(qGaps, { ...qS, 'bridge 4|READER+STEP': [0, 60] })[2].outcome, 'FALSIFIED']);
  cases.push(['harm on S126 alone is item 3 FALSIFIED', run(qGaps, { ...qS, 'S126|READER+STEP': [0, 60] })[2].outcome, 'FALSIFIED']);
  cases.push(['a small loss on bridge 4 (5 paths) is not item 3 FALSIFIED', run(qGaps, { ...qS, 'bridge 4|READER+STEP': [0, 5] })[2].outcome !== 'FALSIFIED' ? 'not falsified' : 'FALSIFIED', 'not falsified']);
  cases.push(['4 saved and none lost on share 0.95 (exact p 0.0625) is not a gain: item 1 FALSIFIED, its interval under the margin', run(qGaps, { ...qS, 'share 0.95|READER+STEP': [4, 0] })[0].outcome, 'FALSIFIED']);
  cases.push(['5 saved and none lost (exact p 0.031) is a gain by the regimen\'s family: item 1 HELD', run(qGaps, { ...qS, 'share 0.95|READER+STEP': [5, 0] })[0].outcome, 'HELD']);
  cases.push(['60 saved against 50 lost on share 0.95 is item 1 INCONCLUSIVE (neither a gain nor under the margin)', run(qGaps, { ...qS, 'share 0.95|READER+STEP': [60, 50] })[0].outcome, 'INCONCLUSIVE']);
  cases.push(['the control: one path saved on S194 is item 4 FALSIFIED', run(qGaps, { ...qS, 'S194|READER+STEP': [1, 0] })[3].outcome, 'FALSIFIED']);
  cases.push(['the control: one year\'s spend level differing is item 4 FALSIFIED', run(qGaps, qS, { diff: { id: 'S194', label: 'READER+STEP', what: 'level' } })[3].outcome, 'FALSIFIED']);
  cases.push(['the control: one year\'s tier differing is item 4 FALSIFIED', run(qGaps, qS, { diff: { id: 'S194', label: 'READER+STEP', what: 'tier' } })[3].outcome, 'FALSIFIED']);
  cases.push(['the control: the tables differing is item 4 FALSIFIED', run(qGaps, qS, { tables: { 'S194|READER+STEP': 90.0001 } })[3].outcome, 'FALSIFIED']);
  cases.push(['the margin is the case\'s own: S126 above 95% reads at 0.25, 30 lost is harm', run(qGaps, { ...qS, 'S126|READER+STEP': [0, 30] })[2].outcome, 'FALSIFIED']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(HERE, 'results', 'diag7z');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  const units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, l]) => !units.some(u => u.id === id && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const T = {};
  if (!bad.length) for (const u of units) {
    const f = join(DIR, traceName(u.id, u.label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, u.label, u.run.sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const X = decode(j);
    if (Math.abs(survivedShare(X.survived) - u.run.sim) > SIM_TOL) bad.push(`${f}: its survived paths give ${survivedShare(X.survived)}, the run line ${u.run.sim}`);
    T[`${u.id}|${u.label}`] = X;
  }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const U = (id, label) => units.find(u => u.id === id && u.label === label);
  const S = (id, label) => T[`${id}|${label}`].survived;
  const X = (id, label) => T[`${id}|${label}`];
  console.log(`7Z: DOES INTEGRATING ACROSS THE READER'S STEP IN THE CHOOSER GAIN ON SHARE 0.95 WITHOUT HARM ELSEWHERE? (predictions/diag-7z.md; ${N} paths of seed ${SEED}; the fair-test gate passed: the stamps, every unit's settings, every run and trace)\n`);
  console.log('EVERY RUN: survival; READER+STEP against READER on the same case saved/lost; pension switches a path; years below target; estate; the year-0 gap and the pension tier it opens in at 1e-3 and at 0; the table');
  for (const id of CASES) {
    console.log(id);
    for (const l of ARMS) {
      const u = U(id, l), k = cells(S(id, 'READER'), S(id, l));
      console.log(`  ${l.padEnd(12)} ${u.run.sim.toFixed(4).padStart(8)}  ${`${k.saved}/${k.lost}`.padStart(9)}  switches ${switching(X(id, l)).perPath.toFixed(2)}  below ${u.run.below.toFixed(2)}  estate ${u.run.estate}  gap ${u.gap.gap} opens ${u.gap.open1e3} at 1e-3, ${u.gap.open0} at 0  table ${u.solve.table}  (solve ${u.solve.secs} s)`);
    }
  }
  const it = items(U, S, X);
  console.log('\nTHE ITEMS (each a Holm family of its own where it tests paths, the regimen\'s reading deciding, the unconditional one beside it; the gap item by its registered bounds)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs || []) console.log(`     ${legText(l)}`);
    for (const e of x.extra || []) console.log(`     ${e}`);
  }
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
}
