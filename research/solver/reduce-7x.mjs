/*
 * 7X'S REDUCER (predictions/diag-7x.md; PLAN.md 7x): is the de-risk's undervaluing free switching (FS) or the three
 * worlds (W)? Reads the twenty unit logs of audit-s126.mjs diag7x (results/diag7x/case0-19.txt) and every unit's trace.
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs (one code version, launched under predictions/diag-7x.md at the blob each
 * log carries). THE FAIR-TEST GATE (before any figure): every registered unit present once; its ran line at the registered
 * settings (30 points, seed 7002, 8,000 paths, lambda 7t's, 5 return points, the exact final year, its own worlds, held
 * tier and bridge read); the units of one case differing in nothing but the held tier and the worlds; the joint line (one
 * policy off, the product's margin, no death charge, the plan's own tier, no tier above); the hold line naming the held
 * pair; one world line a world at 1,000 paths; the run and done lines; every trace agreeing with its log in count, seed,
 * arm, stamp and survival (within 0.00005, the run line's four decimals).
 * THE QUANTITIES, for each case and worlds: dT, the held tables' difference at the opening state (2/2 less 0/0, the mixture's
 * year-0 survival, points); dS, the realised difference on the same 8,000 paths (paired: 2/2 against 0/0, saved less lost,
 * points); R = dT / dS.
 * THE ITEMS, each read by the regimen's rule where it tests paths (the exact gain family, Holm over the item's legs, the
 * case's margin) and by its registered ratios:
 *   1. FS: on S126 (reader) and S194 (off), in three worlds, the realised gain is material and R lies within [1/1.5, 1.5]
 *      on both (FALSIFIED: R below 0.5 on both)
 *   2. W: on the same two cases, dT in five worlds is at least 1.5 times dT in three, on both (FALSIFIED: at most 1.2 times
 *      on both)
 *   3. the Q control: on share 0.95 (reader), in three worlds, the realised gain is material and R is below 0.5 (FALSIFIED:
 *      R within [1/1.5, 1.5])
 *   4. the sign control: on S360 (off), in three worlds, dT has dS's sign, each at least 0.1 points and dS material
 *      (FALSIFIED: the opposite sign, each at least 0.1 points and dS material)
 * Reported, not items: every unit's table and survival, each world's table against its own world run, survival on the paths
 * whose long-run shift lies below -sqrt 3, pension years below the plan's tier and tier changes a path; bridge 4's R.
 *   node research/solver/reduce-7x.mjs [dir] > research/solver/results-7x.txt
 *   node research/solver/reduce-7x.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { marginFor, survivalChange } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells, gainFamily, harmFamily, survivedShare, deepIdx } from './reduce-7v.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7x.md';
export const N = 8000, WP = 1000, PTS = '30', SEED = '7002', LAMBDA = '0.0223606797749979', LEVELS = '1,1.1,0.95,0.9,0.8';
export const DECIDED = 'off:_no_tier_above_the_plan';
export const SIM_TOL = 5e-5 + 1e-9;
export const CASES = [['S126', 'READER'], ['S194', 'OFF'], ['share 0.95', 'READER'], ['bridge 4', 'READER'], ['S360', 'OFF']];
export const UNITS = [];
for (const mix of [3, 5]) for (const hold of ['00', '22']) for (const [id, arm] of CASES) UNITS.push([id, `${arm}/H${hold}/M${mix}`]);
export const HI = 1.5, LO = 0.5, W_UP = 1.5, W_FLAT = 1.2, SIGN_MIN = 0.1;

const CASEL = /^(\S.*?)\s+case \| unit (\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+)$/;
const SOLVEL = /^\s+solve (\S+): table (-?[\d.]+) secs (\d+)$/;
const RANL = /^\s+ran (\S+): (.*)$/;
const JOINTL = /^\s+joint (\S+): (true|false) switchMargin (\S+) scale (\S+) cap (\S+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
const HOLDL = /^\s+hold (\S+): (\d\/\d) pension (\S+) isa (\S+) moves (\d+)$/;
const WORLDL = /^\s+world (\S+) (\d) z (-?[\d.]+) weight ([\d.]+): table (-?[\d.]+) sim (-?[\d.]+) paths (\d+)$/;
const RUNL = /^\s+run (\S+): sim (-?[\d.]+) tier-below (\S+) changes (\S+) secs (\d+)$/;
export const field = (ran, k) => { const m = new RegExp(`(?:^|\\s)${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const parts = label => { const [arm, h, mx] = label.split('/'); return { arm, hold: `${h[1]}/${h[2]}`, mix: mx.slice(1) }; };

export function parse(text) {
  const units = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), label: m[2], lambda: m[3], tier: m[4], riskAbove: m[5], worlds: [], done: false }; units.push(cur); continue; }
    if (!cur) continue;
    if ((m = SOLVEL.exec(line)) && m[1] === cur.label) { cur.table = +m[2]; cur.secs = +m[3]; continue; }
    if ((m = RANL.exec(line)) && m[1] === cur.label) { cur.ran = m[2]; continue; }
    if ((m = JOINTL.exec(line)) && m[1] === cur.label) { cur.joint = { joint: m[2] === 'true', margin: m[3], deathTax: +m[6], tier: m[7], decided: m[8] }; continue; }
    if ((m = HOLDL.exec(line)) && m[1] === cur.label) { cur.hold = { pair: m[2], pen: m[3], isa: m[4], moves: +m[5] }; continue; }
    if ((m = WORLDL.exec(line)) && m[1] === cur.label) { cur.worlds[+m[2]] = { z: +m[3], w: +m[4], table: +m[5], sim: +m[6], paths: +m[7] }; continue; }
    if ((m = RUNL.exec(line)) && m[1] === cur.label) { cur.run = { sim: +m[2], tierBelow: +m[3], changes: +m[4], secs: +m[5] }; continue; }
    if (/^\s+done (\S+)$/.test(line) && line.trim() === `done ${cur.label}`) { cur.done = true; continue; }
  }
  return units;
}
export function gate(units) {
  const bad = [];
  for (const [id, label] of UNITS) { const k = units.filter(u => u.id === id && u.label === label).length; if (k !== 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`); }
  const strip = s => (s || '').replace(/^mix \S+ /, '').replace(/ holdTier \S+/, '');
  for (const u of units) {
    if (!UNITS.some(([id, l]) => id === u.id && l === u.label)) { bad.push(`${u.id} ${u.label}: not a registered unit`); continue; }
    const p = parts(u.label);
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto') bad.push(`${u.id} ${u.label}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove}`);
    if (!(u.table >= 0)) bad.push(`${u.id} ${u.label}: no solve line`);
    if (!u.ran) { bad.push(`${u.id} ${u.label}: no ran line`); continue; }
    const w = { mix: p.mix, pts: PTS, seed: SEED, paths: String(N), grid: `total${PTS}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', tiersAbove: '0', quad: '5', holdTier: p.hold, finalIntegral: 'true', bridgeRead: p.arm === 'READER' ? 'reader' : 'false' };
    for (const [k, v] of Object.entries(w)) if (field(u.ran, k) !== v) bad.push(`${u.id} ${u.label}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
    const first = units.find(x => x.id === u.id && x.ran);
    if (strip(u.ran) !== strip(first.ran)) bad.push(`${u.id} ${u.label}: differs from ${first.label} beyond the worlds and the held tier`);
    if (!u.joint) bad.push(`${u.id} ${u.label}: no joint line`);
    else if (u.joint.joint || u.joint.margin !== '0.001' || u.joint.deathTax !== 0 || u.joint.tier !== 'own' || u.joint.decided !== DECIDED) bad.push(`${u.id} ${u.label}: joint line ${JSON.stringify(u.joint)}`);
    if (!u.hold || u.hold.pair !== p.hold) bad.push(`${u.id} ${u.label}: hold line ${u.hold ? u.hold.pair : 'missing'}, not ${p.hold}`);
    const nw = +p.mix;
    if (u.worlds.length !== nw || Array.from({ length: nw }, (_, k) => u.worlds[k]).some(x => !x || x.paths !== WP)) bad.push(`${u.id} ${u.label}: lacks its ${nw} world lines at ${WP} paths`);
    if (!u.run) bad.push(`${u.id} ${u.label}: no run line`);
    if (!u.done) bad.push(`${u.id} ${u.label}: no done line`);
  }
  return bad;
}
export const traceName = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
export const traceAgrees = (j, ST, label, sim) => !!(j && ST && j.stamp && j.N === N && String(j.seed) === SEED && j.arm === label && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);

/*
 * THE QUANTITIES AND ITEMS. `U(id, label)` is a unit; `S(id, label)` its survived array. dT and dS in points; R their ratio.
 * The case's margin: marginFor() of its 0/0-held run's survival in three worlds.
 */
export function quantities(U, S, id, arm, mix) {
  const a = `${arm}/H00/M${mix}`, b = `${arm}/H22/M${mix}`;
  const k = cells(S(id, a), S(id, b));
  const dT = U(id, b).table - U(id, a).table, dS = 100 * (k.saved - k.lost) / k.N;
  return { id, arm, mix, dT, dS, R: dS !== 0 ? dT / dS : NaN, k, margin: marginFor(survivedShare(S(id, `${arm}/H00/M3`))) };
}
const within = R => R >= 1 / HI && R <= HI;
export function items(U, S) {
  const q = (id, arm, mix) => quantities(U, S, id, arm, mix);
  const leg = x => ({ label: `${x.id}: ${x.arm}/H22/M${x.mix} against ${x.arm}/H00/M${x.mix}`, k: x.k, margin: x.margin });
  const out = [];
  // 1. FS
  const f = [q('S126', 'READER', 3), q('S194', 'OFF', 3)], fg = gainFamily(f.map(leg));
  out.push({ n: 1, text: `FS: on S126 and S194, in three worlds, the held tables' difference lies within ${HI} times the realised one (FALSIFIED: below ${LO} times on both)`, legs: fg, q: f,
    outcome: f.every((x, j) => fg[j].o === 'gain' && within(x.R)) ? 'HELD' : f.every((x, j) => fg[j].o === 'gain' && x.R < LO) ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 2. W
  const w = [['S126', 'READER'], ['S194', 'OFF']].map(([id, arm]) => ({ id, d3: q(id, arm, 3).dT, d5: q(id, arm, 5).dT }));
  const up = x => (x.d3 > 0 ? x.d5 / x.d3 : NaN);
  out.push({ n: 2, text: `W: on the same two cases, the held tables' difference in five worlds is at least ${W_UP} times that in three (FALSIFIED: at most ${W_FLAT} times on both)`,
    extra: w.map(x => `${x.id}: dT ${x.d3.toFixed(4)} in three worlds, ${x.d5.toFixed(4)} in five (${Number.isFinite(up(x)) ? up(x).toFixed(2) : 'no three-world difference'})`),
    outcome: w.every(x => up(x) >= W_UP) ? 'HELD' : w.every(x => up(x) <= W_FLAT) ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 3. the Q control
  const c = q('share 0.95', 'READER', 3), cg = gainFamily([leg(c)]);
  out.push({ n: 3, text: `the Q control: on share 0.95, in three worlds, the held tables' difference is below ${LO} times the realised one (FALSIFIED: within ${HI} times)`, legs: cg, q: [c],
    outcome: cg[0].o === 'gain' && c.R < LO ? 'HELD' : cg[0].o === 'gain' && within(c.R) ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 4. the sign control
  const s = q('S360', 'OFF', 3), sh = harmFamily([leg(s)]), sgn = gainFamily([leg(s)]);
  const material = sh[0].o === 'harm' || sgn[0].o === 'gain';
  const big = Math.abs(s.dT) >= SIGN_MIN && Math.abs(s.dS) >= SIGN_MIN;
  out.push({ n: 4, text: `the sign control: on S360 (off), in three worlds, the held tables' difference has the realised one's sign (FALSIFIED: the opposite sign)`, legs: [...sh, ...sgn], q: [s],
    outcome: material && big && Math.sign(s.dT) === Math.sign(s.dS) ? 'HELD' : material && big && Math.sign(s.dT) === -Math.sign(s.dS) ? 'FALSIFIED' : 'INCONCLUSIVE' });
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (label) => { const p = parts(label); return `mix ${p.mix} pts 30 seed 7002 paths 8000 grid total30x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad 5 holdTier ${p.hold} finalIntegral true bridgeRead ${p.arm === 'READER' ? 'reader' : 'false'}`; };
  const unitText = (id, label, { ran = ranOf(label), worlds = +parts(label).mix, wp = WP, hold = parts(label).hold, margin = '0.001', done = true, table = '90.0000', skip = -1 } = {}) => [
    `${id.padEnd(16)} case | unit ${label} | lambda ${LAMBDA} tier own riskAbove auto`,
    `${''.padEnd(16)} solve ${label}: table ${table} secs 1`, `${''.padEnd(16)} ran ${label}: ${ran}`,
    `${''.padEnd(16)} joint ${label}: false switchMargin ${margin} scale 1 cap 1 deathTax 0 tier own riskAbove ${DECIDED}`,
    `${''.padEnd(16)} hold ${label}: ${hold} pension Medium isa Medium moves 96`,
    ...Array.from({ length: worlds }, (_, k) => `${''.padEnd(16)} world ${label} ${k} z 0.0000 weight 0.3333: table 90.0000 sim 90.0000 paths ${wp}`).filter((_, k) => k !== skip),
    `${''.padEnd(16)} run ${label}: sim 90.0000 tier-below 0.00 changes 0.000 secs 1`, ...(done ? [`${''.padEnd(16)} done ${label}`] : [])].join('\n');
  const good = () => UNITS.map(([id, l]) => unitText(id, l)).join('\n');
  const bent = (id, label, o) => UNITS.map(([i, l]) => unitText(i, l, i === id && l === label ? o : {})).join('\n');
  cases.push(['a log parsed and gated: twenty units, the gate passes', `${parse(good()).length} ${gate(parse(good())).length}`, '20 0']);
  cases.push(['the gate refuses the wrong held tier on the ran line', String(gate(parse(bent('S126', 'READER/H22/M3', { ran: ranOf('READER/H22/M3').replace('holdTier 2/2', 'holdTier 0/0') }))).length > 0), 'true']);
  cases.push(['the gate refuses a hold line that disagrees', String(gate(parse(bent('S194', 'OFF/H22/M5', { hold: '1/1' }))).length > 0), 'true']);
  cases.push(['the gate refuses three worlds where five are named', String(gate(parse(bent('S360', 'OFF/H00/M5', { ran: ranOf('OFF/H00/M5').replace('mix 5', 'mix 3') }))).length > 0), 'true']);
  cases.push(['the gate refuses a missing world line', String(gate(parse(bent('S360', 'OFF/H00/M5', { worlds: 4 }))).length > 0), 'true']);
  cases.push(['the gate refuses world runs at another size', String(gate(parse(bent('bridge 4', 'READER/H00/M3', { wp: 500 }))).length > 0), 'true']);
  cases.push(['the gate refuses a second setting changed within a case (the minimum pot)', String(gate(parse(bent('share 0.95', 'READER/H22/M5', { ran: ranOf('READER/H22/M5').replace('minPot 29000', 'minPot 30000') }))).length > 0), 'true']);
  cases.push(['the gate refuses a missing unit', String(gate(parse(UNITS.slice(1).map(([id, l]) => unitText(id, l)).join('\n'))).length > 0), 'true']);
  cases.push(['the gate refuses a solve at another margin', String(gate(parse(bent('S126', 'READER/H00/M3', { margin: '0' }))).length > 0), 'true']);
  cases.push(['the gate refuses a unit with no done line', String(gate(parse(bent('S194', 'OFF/H00/M3', { done: false }))).length > 0), 'true']);
  cases.push(['the gate refuses the wrong seed on every unit of a case (so no within-case comparison sees it)', String(gate(parse(UNITS.map(([i, l]) => unitText(i, l, i === 'S194' ? { ran: ranOf(l).replace('seed 7002', 'seed 7013') } : {})).join('\n'))).length > 0), 'true']);
  cases.push(['the gate refuses a hole among the world lines (the middle world missing)', String(gate(parse(bent('S126', 'READER/H00/M3', { skip: 1 }))).length > 0), 'true']);
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, j = { N, seed: 7002, arm: 'OFF/H00/M3', sim: 90.03333333, stamp: { ...ST } };
    cases.push(['a trace agrees within 0.00005 of its four-decimal line, and no further', [traceAgrees(j, ST, 'OFF/H00/M3', 90.0333), traceAgrees({ ...j, sim: 90.03335 }, ST, 'OFF/H00/M3', 90.0334), traceAgrees(j, ST, 'OFF/H00/M3', 90.0335), traceAgrees({ ...j, seed: 7013 }, ST, 'OFF/H00/M3', 90.0333), traceAgrees(j, ST, 'OFF/H22/M3', 90.0333)].join(','), 'true,true,false,false,false']); }
  // the items on planted stories: survived arrays from [saved, lost] against a base where the first 100 paths fail
  const mkS = spec => (id, label) => { const k = spec[`${id}|${label}`] || [0, 0], nb = spec[`${id}|base`] || 100; const a = new Uint8Array(N).fill(1); for (let i = 0; i < nb; i++) a[i] = 0; for (let i = 0; i < k[0]; i++) a[i] = 1; for (let i = nb; i < nb + k[1]; i++) a[i] = 0; return a; };
  const mkU = tables => (id, label) => ({ table: tables[`${id}|${label}`] ?? 90 });
  // FS story: realised 40 saved of 8,000 (0.5 points) on S126 and S194, the held tables' difference 0.5; five worlds the same;
  // share 0.95: 192 saved (2.4 points), the tables 0.1; S360 off: 133 lost, the tables -0.3
  const fsS = { 'S126|READER/H22/M3': [40, 0], 'S194|OFF/H22/M3': [40, 0], 'share 0.95|base': 600, 'share 0.95|READER/H22/M3': [192, 0], 'S360|OFF/H22/M3': [0, 133] };   // saved paths come from the base's failures
  const fsT = { 'S126|READER/H22/M3': 90.5, 'S194|OFF/H22/M3': 90.5, 'S126|READER/H22/M5': 90.52, 'S194|OFF/H22/M5': 90.55, 'share 0.95|READER/H22/M3': 90.1, 'S360|OFF/H22/M3': 89.7 };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  cases.push(['FS as the deep review states it: 1 HELD, 2 FALSIFIED, 3 HELD, 4 HELD', outs(items(mkU(fsT), mkS(fsS))), '1 HELD, 2 FALSIFIED, 3 HELD, 4 HELD']);
  const wT = { ...fsT, 'S126|READER/H22/M3': 90.1, 'S194|OFF/H22/M3': 90.12, 'S126|READER/H22/M5': 90.2, 'S194|OFF/H22/M5': 90.25 };
  cases.push(['W as the deep review states it: 1 FALSIFIED, 2 HELD', outs(items(mkU(wT), mkS(fsS)).slice(0, 2)), '1 FALSIFIED, 2 HELD']);
  cases.push(['R at 1.6 is not within 1.5: item 1 INCONCLUSIVE', items(mkU({ ...fsT, 'S126|READER/H22/M3': 90.8 }), mkS(fsS))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['no material realised gain: item 1 INCONCLUSIVE whatever R', items(mkU(fsT), mkS({ ...fsS, 'S194|OFF/H22/M3': [2, 1] }))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['the Q control within 1.5 times: item 3 FALSIFIED', items(mkU({ ...fsT, 'share 0.95|READER/H22/M3': 92.4 }), mkS(fsS))[2].outcome, 'FALSIFIED']);
  cases.push(['the sign control reversed: item 4 FALSIFIED; the tables flat: INCONCLUSIVE', `${items(mkU({ ...fsT, 'S360|OFF/H22/M3': 90.5 }), mkS(fsS))[3].outcome} ${items(mkU({ ...fsT, 'S360|OFF/H22/M3': 90.0 }), mkS(fsS))[3].outcome}`, 'FALSIFIED INCONCLUSIVE']);
  cases.push(['W at 1.3 times on one case: item 2 INCONCLUSIVE', items(mkU({ ...fsT, 'S126|READER/H22/M5': 90.65 }), mkS(fsS))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['R within 1.5 but the realised gain not material (3 saved of 8,000): item 1 INCONCLUSIVE', items(mkU({ ...fsT, 'S194|OFF/H22/M3': 90.0375 }), mkS({ ...fsS, 'S194|OFF/H22/M3': [3, 0] }))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['R at 0.6 on both (between the bounds): item 1 INCONCLUSIVE', items(mkU({ ...fsT, 'S126|READER/H22/M3': 90.3, 'S194|OFF/H22/M3': 90.3 }), mkS(fsS))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['five worlds 1.3 times on both: item 2 INCONCLUSIVE; 1.6 and 1.0: INCONCLUSIVE', `${items(mkU({ ...fsT, 'S126|READER/H22/M5': 90.65, 'S194|OFF/H22/M5': 90.65 }), mkS(fsS))[1].outcome} ${items(mkU({ ...fsT, 'S126|READER/H22/M5': 90.8, 'S194|OFF/H22/M5': 90.5 }), mkS(fsS))[1].outcome}`, 'INCONCLUSIVE INCONCLUSIVE']);
  cases.push(['the Q control with no material realised gain: item 3 INCONCLUSIVE', items(mkU({ ...fsT, 'share 0.95|READER/H22/M3': 90 }), mkS({ ...fsS, 'share 0.95|READER/H22/M3': [3, 0] }))[2].outcome, 'INCONCLUSIVE']);
  cases.push(['the sign control with the tables under 0.1 points: item 4 INCONCLUSIVE', items(mkU({ ...fsT, 'S360|OFF/H22/M3': 89.95 }), mkS(fsS))[3].outcome, 'INCONCLUSIVE']);
  cases.push(['the sign control below 95% survival reads a 0.4-point loss at the 0.5 margin: not material, item 4 INCONCLUSIVE', items(mkU({ ...fsT, 'S360|OFF/H22/M3': 89.6 }), mkS({ ...fsS, 'S360|base': 1100, 'S360|OFF/H22/M3': [0, 32] }))[3].outcome, 'INCONCLUSIVE']);
  cases.push(['dT and dS by hand: S126 0.5 and 0.5, R 1', (() => { const x = quantities(mkU(fsT), mkS(fsS), 'S126', 'READER', 3); return `${x.dT.toFixed(3)} ${x.dS.toFixed(3)} ${x.R.toFixed(3)}`; })(), '0.500 0.500 1.000']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(HERE, 'results', 'diag7x');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  const units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, l]) => !units.some(u => u.id === id && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const T = {}, Y = {};
  if (!bad.length) for (const u of units) {
    const f = join(DIR, traceName(u.id, u.label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, u.label, u.run.sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const X = decode(j);
    if (Math.abs(survivedShare(X.survived) - u.run.sim) > SIM_TOL) bad.push(`${f}: its survived paths give ${survivedShare(X.survived)}, the run line ${u.run.sim}`);
    T[`${u.id}|${u.label}`] = X.survived; Y[u.id] = j.Y;
  }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const U = (id, label) => units.find(u => u.id === id && u.label === label);
  const S = (id, label) => T[`${id}|${label}`];
  console.log(`7X: IS THE DE-RISK'S UNDERVALUING FREE SWITCHING OR THE THREE WORLDS? (predictions/diag-7x.md; ${N} paths of seed ${SEED}, ${WP} a world; the fair-test gate passed: the stamps, every unit's settings, every world, run and trace)\n`);
  console.log('EVERY UNIT: the held tables\' opening survival against the aggregate run; each world\'s table against its own world run; survival on the paths whose shift lies below -sqrt 3');
  for (const [id, arm] of CASES) {
    const deep = deepIdx(Number(SEED), N, Y[id]);
    console.log(`${id} (${arm.toLowerCase()}; ${deep.length} paths below -sqrt 3)`);
    for (const mix of [3, 5]) for (const h of ['00', '22']) {
      const l = `${arm}/H${h}/M${mix}`, u = U(id, l), s = S(id, l), dsurv = deep.length ? 100 * deep.reduce((t, i) => t + s[i], 0) / deep.length : NaN;
      console.log(`  ${l.padEnd(15)} table ${u.table.toFixed(2).padStart(6)} sim ${u.run.sim.toFixed(2).padStart(6)} (table less sim ${(u.table - u.run.sim).toFixed(2)})  deep ${dsurv.toFixed(1)}  tier-below ${u.run.tierBelow.toFixed(2)} changes ${u.run.changes.toFixed(3)}  held ${u.hold.pen}/${u.hold.isa}  (solve ${u.secs} s)`);
      console.log(`  ${''.padEnd(15)} worlds ${u.worlds.map(w => `z ${w.z.toFixed(2)}: ${w.table.toFixed(2)}/${w.sim.toFixed(2)}`).join('  ')}`);
    }
  }
  console.log('\nTHE QUANTITIES (points): dT the held tables\' difference at the opening (2/2 less 0/0), dS the realised difference on the same paths (saved/lost), R = dT / dS');
  for (const [id, arm] of CASES) for (const mix of [3, 5]) {
    const x = quantities(U, S, id, arm, mix), iv = survivalChange(x.k.lost, x.k.saved, x.k.N, 0.05);
    console.log(`  ${id.padEnd(11)} ${arm.padEnd(7)} ${mix} worlds  dT ${x.dT.toFixed(4).padStart(8)}  dS ${x.dS.toFixed(4).padStart(8)} (${x.k.saved}/${x.k.lost}; exact ${iv.lo.toFixed(3)} to ${iv.hi.toFixed(3)})  R ${Number.isFinite(x.R) ? x.R.toFixed(3) : 'undefined'}`);
  }
  const it = items(U, S);
  const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
  console.log('\nTHE ITEMS (the path legs by the regimen\'s exact reading, Holm within each item, the unconditional interval beside; the ratios by their registered bounds)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs || []) console.log(`     ${l.label} ${l.k.saved} saved/${l.k.lost} lost ${f3(l.iv.d)} (exact ${l.iv.lo.toFixed(3)} to ${l.iv.hi.toFixed(3)}; unconditional ${l.un.lo.toFixed(3)} to ${l.un.hi.toFixed(3)}${l.disagree ? ' <-- the readings DISAGREE' : ''}) ${l.o}`);
    for (const q of x.q || []) console.log(`     ${q.id}: dT ${q.dT.toFixed(4)}, dS ${q.dS.toFixed(4)}, R ${Number.isFinite(q.R) ? q.R.toFixed(3) : 'undefined'}`);
    for (const e of x.extra || []) console.log(`     ${e}`);
  }
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
}
