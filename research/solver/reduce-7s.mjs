/*
 * 7s'S REDUCER (PLAN.md 7s; predictions/diag-7s.md): does sampling each year's return at 5 points, not 15, make the solver
 * with the bridge reader overrate the riskier tier on S126 and bridge 4? Reads batch-7s.sh's logs (results/diag7s/*.txt,
 * audit-s126.mjs's bridge7e mode: arms off, reader, off@15, reader@15 on the same 3,000 paths of seed 7002).
 *
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs (one code version, launched through run-from-snapshot.sh under
 * predictions/diag-7s.md at the blob each log carries, else PREDICTION EDITED).
 * THE RAN-LINE GATE: each case once, its arms exactly OFF, READER, OFF@15, READER@15 in that order, every arm a ran line,
 * the lines equal once the bridge read and the return points are taken out, each naming the registered settings (mix 3,
 * 16 points, seed 7002, 3,000 paths, lambda 0.0223606797749979, raiseSurv true, failShort floor, tiersAbove 1,
 * finalIntegral true) and its label's bridge read (OFF false, READER reader) and return points (@15 15, else 5); a pairs
 * line holding all six pairs. Any failure prints GATE FAILED and nothing else is read. COMPLETENESS: both cases, or
 * INCOMPLETE.
 * THE REPRODUCTION CHECK (item 1): the 5-point arms are 7r's arms on 7r's paths, so each must reproduce 7r's figures
 * (results/diag7r part0 and part1: tables and simulated survival to 0.1, and the reader's lost and saved against off).
 * If either case does not, something besides the return points differs and the outcome reads NOT SETTLED.
 *
 * THE RULE (the regimen: exact tests, Holm, a margin, three outcomes). Per case, paired on the same 3,000 paths:
 *   - g: the reader at 15 points against the reader at 5 (saved, lost). It GAINS when it saves more than it loses and
 *     the exact one-sided p for a gain, Holm over the two cases, is below 0.05; NO MATERIAL GAIN when the exact 95%
 *     interval for its survival change has its upper end below +0.25 points.
 *   - h: the reader at 15 points against off at 15 points. It HARMS when it loses more than it saves and the exact
 *     one-sided p for harm, Holm over the two cases, is below 0.05; NO MATERIAL HARM when the interval's lower end is
 *     above -0.25.
 *   - a case CURES when g gains and h shows no material harm; does NOT CURE when g neither gains nor shows a material
 *     gain and h harms; otherwise it is PARTIAL (a significant gain below the margin with the harm still there is partial).
 *   HELD: both cases cure. FALSIFIED: both cases do not cure. INCONCLUSIVE: otherwise. NOT SETTLED: the reproduction
 *   check fails.
 *   Reported, not tested: every arm's table, simulation, gap, tier-below and below-target years and solve seconds; off at
 *   15 against off at 5; the reader at 5 against off at 5.
 *
 *   node research/solver/reduce-7s.mjs [dir]     the verdict
 *   node research/solver/reduce-7s.mjs --planted  the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mcnemarHarmP, holm, survivalChange } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7s.md';
export const N = 3000, ALPHA = 0.05, MARGIN = 0.25;
const LAMBDA = '0.0223606797749979', SEED = '7002', PTS = '16';
export const CASES = ['S126', 'bridge 4'];
export const ARMS = ['OFF', 'READER', 'OFF@15', 'READER@15'];
const BR = { OFF: 'false', READER: 'reader' };
const PAIRS = ['READER-OFF', 'OFF@15-OFF', 'OFF@15-READER', 'READER@15-OFF', 'READER@15-READER', 'READER@15-OFF@15'];
// 7r's figures for the 5-point arms (results/diag7r/part0.txt and part1.txt, the case lines): table, sim; the reader's saved/lost against off
export const REPRO = {
  S126: { OFF: [55.8, 99.8], READER: [99.6, 99.3], saved: 0, lost: 15 },
  'bridge 4': { OFF: [7.8, 99.4], READER: [99.1, 99.0], saved: 0, lost: 12 },
};
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const CELL = /(\S+) table\s+(-?[\d.]+) sim\s+(-?[\d.]+) gap\s+(-?[\d.]+) tier-below\s+(-?[\d.]+) below\s+(-?[\d.]+) (\d+) s(?: d ([+-]?[\d.]+) se ([\d.]+) \((\d+)\/(\d+)\))?/;

// one log's cases (the bridge7e mode's format, as reduce-7e.mjs reads it): { id, arms: [{ label, table, sim, gap, tier, below, secs }], ran, pairs }
// a pair "X-Y u/d": X against Y on the same paths, u paths X saves, d paths X loses
export function parse(text) {
  const cases = []; let cur = null;
  for (const line of text.split('\n')) {
    const r = /^\s+ran (\S+): (.*)$/.exec(line);
    if (r && cur) { cur.ran[r[1]] = r[2]; continue; }
    const pr = /^\s+pairs (.*)$/.exec(line);
    if (pr && cur) { for (const m of pr[1].matchAll(/(\S+)-(\S+) (\d+)\/(\d+)/g)) cur.pairs[`${m[1]}-${m[2]}`] = { saved: +m[3], lost: +m[4] }; continue; }
    if (!/ \| \S+ table /.test(line)) continue;
    const parts = line.split(' | ');
    cur = { id: parts[0].slice(0, 16).trim(), arms: [], ran: {}, pairs: {} };
    for (const p of parts.slice(1)) {
      const m = CELL.exec(p); if (!m) continue;
      cur.arms.push({ label: m[1], table: +m[2], sim: +m[3], gap: +m[4], tier: +m[5], below: +m[6], secs: +m[7] });
    }
    cases.push(cur);
  }
  return cases;
}
export function gate(cases) {
  const bad = [];
  for (const id of CASES) { const k = cases.filter(c => c.id === id).length; if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }
  for (const c of cases) {
    if (!CASES.includes(c.id)) { bad.push(`${c.id}: not a registered case`); continue; }
    if (c.arms.map(a => a.label).join(',') !== ARMS.join(',')) { bad.push(`${c.id}: arms ${c.arms.map(a => a.label).join(',')}, not ${ARMS.join(',')}`); continue; }
    const strip = s => s.replace(/ bridgeRead \S+/, '').replace(/ quad \d+ /, ' ');
    const first = c.ran.OFF;
    for (const a of c.arms) {
      const ran = c.ran[a.label];
      if (!ran) { bad.push(`${c.id}: no ran line for ${a.label}`); continue; }
      if (strip(ran) !== strip(first || '')) bad.push(`${c.id}: ${a.label} differs beyond the bridge read and return points ("${ran}")`);
      const want = { mix: '3', pts: PTS, seed: SEED, paths: String(N), grid: `total${PTS}x6x6`, lambda: LAMBDA, raiseSurv: 'true', failShort: 'floor', tiersAbove: '1', finalIntegral: 'true' };
      for (const [k, v] of Object.entries(want)) if (field(ran, k) !== v) bad.push(`${c.id}: ${a.label} ${k} is ${field(ran, k)}, the prediction names ${v}`);
      const [name, q] = a.label.split('@');
      if (field(ran, 'bridgeRead') !== BR[name]) bad.push(`${c.id}: ${a.label} ran bridgeRead ${field(ran, 'bridgeRead')}`);
      if (field(ran, 'quad') !== (q || '5')) bad.push(`${c.id}: ${a.label} ran quad ${field(ran, 'quad')}`);
    }
    for (const p of PAIRS) if (!c.pairs[p]) bad.push(`${c.id}: no pair ${p}`);
  }
  return bad;
}
export function reproduced(c) {
  const R = REPRO[c.id], arm = l => c.arms.find(a => a.label === l), close = (x, y) => Math.abs(x - y) < 0.05;
  const why = [];
  for (const l of ['OFF', 'READER']) { const a = arm(l); if (!close(a.table, R[l][0]) || !close(a.sim, R[l][1])) why.push(`${l} table ${a.table} sim ${a.sim}, 7r ${R[l][0]} / ${R[l][1]}`); }
  const p = c.pairs['READER-OFF'];
  if (p.saved !== R.saved || p.lost !== R.lost) why.push(`the reader against off ${p.saved} saved, ${p.lost} lost; 7r ${R.saved} / ${R.lost}`);
  return why;
}
// the rule, on the counts alone: rows [{ id, g: { saved, lost }, h: { saved, lost } }] in CASES order
export function decide(rows) {
  const pGain = holm(rows.map(r => mcnemarHarmP(r.g.saved, r.g.lost)));
  const pHarm = holm(rows.map(r => mcnemarHarmP(r.h.lost, r.h.saved)));
  const reads = rows.map((r, j) => {
    const gi = survivalChange(r.g.lost, r.g.saved, N, ALPHA), hi = survivalChange(r.h.lost, r.h.saved, N, ALPHA);
    const gains = r.g.saved > r.g.lost && pGain[j] < ALPHA, noGain = gi.hi < MARGIN;
    const harms = r.h.lost > r.h.saved && pHarm[j] < ALPHA, noHarm = hi.lo > -MARGIN;
    const read = gains && noHarm ? 'cures' : !gains && noGain && harms ? 'does not cure' : 'partial';
    return { id: r.id, read, gi, hi, pGain: pGain[j], pHarm: pHarm[j], gains, noGain, harms, noHarm };
  });
  const o = reads.every(x => x.read === 'cures') ? 'HELD' : reads.every(x => x.read === 'does not cure') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { outcome: o, reads };
}
// the prediction's items 3-5 (item 1 is the reproduction check, item 2 the outcome): [text, held]
export function items(cases) {
  const c = CASES.map(id => cases.find(x => x.id === id)), arm = (x, l) => x.arms.find(a => a.label === l);
  const offMove = c.map(x => { const p = x.pairs['OFF@15-OFF'], iv = survivalChange(p.lost, p.saved, N, ALPHA); return { id: x.id, p, iv, ok: iv.lo > -MARGIN && iv.hi < MARGIN }; });
  const tier = c.map(x => ({ id: x.id, d: arm(x, 'READER@15').tier - arm(x, 'READER').tier }));
  const gap = c.map(x => ({ id: x.id, g: arm(x, 'READER@15').gap }));
  return [
    [`3. off at 15 points against off at 5 shows no material change on either case (the exact 95% interval inside +/-${MARGIN}): ${offMove.map(o => `${o.id} ${o.p.saved}/${o.p.lost} (${o.iv.lo.toFixed(2)} to ${o.iv.hi.toFixed(2)})`).join(', ')}`, offMove.every(o => o.ok)],
    [`4. the reader at 15 points holds the pension below its tier no more than 3 years more than at 5, on both: ${tier.map(t => `${t.id} ${t.d >= 0 ? '+' : ''}${t.d.toFixed(1)}`).join(', ')}`, tier.every(t => t.d <= 3)],
    [`5. the reader's table at 15 points reads within 1 point of its simulation, on both: ${gap.map(g => `${g.id} gap ${g.g.toFixed(1)}`).join(', ')}`, gap.every(g => Math.abs(g.g) <= 1)],
  ];
}
export const rowsOf = cases => CASES.map(id => { const c = cases.find(x => x.id === id); return { id, g: c.pairs['READER@15-READER'], h: c.pairs['READER@15-OFF@15'] }; });

// PLANTED, before any real file (rule 6)
function planted() {
  const ranOf = (br, q) => `mix 3 pts 16 seed 7002 paths 3000 grid total16x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 1 minPot 29000 quad ${q} finalIntegral true bridgeRead ${br}`;
  const cell = (l, t, s) => `${l} table ${t.toFixed(1).padStart(5)} sim ${s.toFixed(1).padStart(5)} gap ${(t - s).toFixed(1).padStart(6)} tier-below ${(l.startsWith('OFF') ? 40 : 8.7).toFixed(1).padStart(4)} below  2.7 556 s`;
  const log = (id, pairs, { ran = {}, repro = REPRO[id] } = {}) => [
    `${id.padEnd(16)} a0 0.85 B 2 class YES | ${cell('OFF', repro.OFF[0], repro.OFF[1])} | ${cell('READER', repro.READER[0], repro.READER[1])} | ${cell('OFF@15', 60, 99.8)} | ${cell('READER@15', 99.5, 99.6)}`,
    ...ARMS.map(l => `${''.padEnd(16)} ran ${l}: ${ran[l] || ranOf(BR[l.split('@')[0]], l.includes('@15') ? 15 : 5)}`),
    `${''.padEnd(16)} pairs ${PAIRS.map(p => `${p} ${(pairs[p] || [0, 0]).join('/')}`).join(' ')}`].join('\n');
  const good = { 'READER-OFF': [0, 15], 'READER@15-READER': [14, 0], 'READER@15-OFF@15': [0, 1] };
  const goodB4 = { 'READER-OFF': [0, 12], 'READER@15-READER': [11, 1], 'READER@15-OFF@15': [1, 1] };
  const c0 = parse(log('S126', good) + '\n' + log('bridge 4', goodB4));
  const row = (id, g, h) => ({ id, g: { saved: g[0], lost: g[1] }, h: { saved: h[0], lost: h[1] } });
  const cases = [
    ['a log parsed: two cases, four arms each, the pairs read as saved/lost', `${c0.length} ${c0[0].arms.length} ${c0[1].pairs['READER@15-READER'].saved}/${c0[1].pairs['READER@15-READER'].lost}`, '2 4 11/1'],
    ['the gate passes a log at the registered settings', String(gate(c0).length), '0'],
    ['the gate refuses a second setting changed between arms (the minimum pot)', String(gate(parse(log('S126', good, { ran: { 'READER@15': ranOf('reader', 15).replace('minPot 29000', 'minPot 30000') } }) + '\n' + log('bridge 4', goodB4))).length > 0), 'true'],
    ['the gate refuses the wrong seed', String(gate(parse(log('S126', good, { ran: Object.fromEntries(ARMS.map(l => [l, ranOf(BR[l.split('@')[0]], l.includes('@15') ? 15 : 5).replace('seed 7002', 'seed 7004')])) }) + '\n' + log('bridge 4', goodB4))).length > 0), 'true'],
    ['the gate refuses an @15 arm run at 5 points', String(gate(parse(log('S126', good, { ran: { 'READER@15': ranOf('reader', 5) } }) + '\n' + log('bridge 4', goodB4))).length > 0), 'true'],
    ['the gate refuses the wrong bridge read', String(gate(parse(log('S126', good, { ran: { 'READER@15': ranOf('false', 15) } }) + '\n' + log('bridge 4', goodB4))).length > 0), 'true'],
    ['the gate refuses a missing case', String(gate(parse(log('S126', good))).length > 0), 'true'],
    ['the gate refuses a missing pair', String(gate(parse(log('S126', good).replace(/ READER@15-OFF@15 \S+/, '') + '\n' + log('bridge 4', goodB4))).length > 0), 'true'],
    ['the reproduction check passes 7r\'s figures and refuses others', `${reproduced(c0[0]).length} ${reproduced(parse(log('S126', { ...good, 'READER-OFF': [0, 14] }))[0]).length} ${reproduced(parse(log('S126', good, { repro: { ...REPRO.S126, READER: [99.6, 99.2] } }))[0]).length}`, '0 1 1'],
    ['cures on both: HELD (14 saved 0 lost; 11 saved 1 lost; neither harms at 15)', decide([row('S126', [14, 0], [0, 1]), row('bridge 4', [11, 1], [1, 1])]).outcome, 'HELD'],
    ['no cure on both: FALSIFIED (the reader at 15 changes 1 or 2 paths, and still loses 14 and 12 against off at 15)', decide([row('S126', [1, 1], [0, 14]), row('bridge 4', [2, 0], [0, 12])]).outcome, 'FALSIFIED'],
    ['a cure on one case only: INCONCLUSIVE', decide([row('S126', [14, 0], [0, 1]), row('bridge 4', [1, 1], [0, 12])]).outcome, 'INCONCLUSIVE'],
    ['half a cure (7 and 6 saved, none lost: significant after Holm, below the margin; 8 still lost at 15): partial on each, INCONCLUSIVE', decide([row('S126', [7, 0], [0, 8]), row('bridge 4', [6, 0], [0, 8])]).reads.map(x => x.read).join(',') + ' ' + decide([row('S126', [7, 0], [0, 8]), row('bridge 4', [6, 0], [0, 8])]).outcome, 'partial,partial INCONCLUSIVE'],
    ['a gain needs Holm: 6 saved, 0 lost on each (raw p 0.016, Holm 0.031) gains; 5 and 0 (raw 0.031, Holm 0.062) does not', `${decide([row('S126', [6, 0], [0, 0]), row('bridge 4', [6, 0], [0, 0])]).reads.map(x => x.gains).join(',')} ${decide([row('S126', [5, 0], [0, 0]), row('bridge 4', [5, 0], [0, 0])]).reads.map(x => x.gains).join(',')}`, 'true,true false,false'],
    ['no material gain is read by the interval, not by significance: 5 saved 0 lost (p 0.031 raw) is not a material gain; 12 saved 0 lost is', `${decide([row('S126', [5, 0], [0, 0]), row('bridge 4', [0, 0], [0, 0])]).reads[0].noGain} ${decide([row('S126', [12, 0], [0, 0]), row('bridge 4', [0, 0], [0, 0])]).reads[0].noGain}`, 'true false'],
    ['harm at 15 needs Holm: 5 lost, 0 saved on each (raw p 0.031, Holm 0.062) does not harm', decide([row('S126', [0, 0], [0, 5]), row('bridge 4', [0, 0], [0, 5])]).reads.map(x => x.harms).join(','), 'false,false'],
    ['no material gain needs the interval\'s upper end below the margin: 9 saved, 4 lost (not significant, upper end 0.35) is not "no material gain"', String(decide([row('S126', [9, 4], [0, 0]), row('bridge 4', [0, 0], [0, 0])]).reads[0].noGain), 'false'],
    ['items 3-5 on the planted log: off unchanged at 15 (0/0), the reader at 15 no longer on a lower tier (+0.0), its gap 0.1 below 1: held, held, held', items(c0).map(x => x[1]).join(','), 'true,true,true'],
    ['items 3-5 miss: off at 15 saves 9 (upper end above the margin), the reader at 15 holds a lower tier 3.5 years more (off 40.0), its gap -1.2', items(parse(log('S126', { ...good, 'OFF@15-OFF': [9, 0] }).replace('READER@15 table  99.5 sim  99.6 gap   -0.1 tier-below  8.7', 'READER@15 table  98.4 sim  99.6 gap   -1.2 tier-below 12.2') + '\n' + log('bridge 4', goodB4))).map(x => x[1]).join(','), 'false,false,false'],
    ['each case\'s g is the reader at 15 against the reader at 5 and h the reader at 15 against off at 15', rowsOf(c0).map(r => `${r.g.saved}/${r.g.lost} ${r.h.saved}/${r.h.lost}`).join(','), '14/0 0/1,11/1 1/1'],
    ['harm at 15 needs more lost than saved and Holm: 8 lost 0 saved harms; 4 lost 4 saved does not', `${decide([row('S126', [0, 0], [0, 8]), row('bridge 4', [0, 0], [0, 8])]).reads[0].harms} ${decide([row('S126', [0, 0], [4, 4]), row('bridge 4', [0, 0], [0, 8])]).reads[0].harms}`, 'true false'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}

const main = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (main) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should`); process.exit(0); }
  const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7s');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^part\d+\.txt$/.test(f)).sort() : [];
  if (files.length !== 2) { console.log(`INCOMPLETE - ${files.length} of 2 logs in ${DIR}`); process.exit(1); }
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  requireFairLogs(logs, PRED);
  const cases = Object.values(logs).flatMap(parse);
  const bad = gate(cases);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const f = x => x.toFixed(1), fp = p => p.toExponential(1), iv = x => `${x.d >= 0 ? '+' : ''}${x.d.toFixed(2)} (${x.lo.toFixed(2)} to ${x.hi.toFixed(2)})`;
  console.log(`7s: DOES 15-POINT SAMPLING STOP THE READER OVERRATING THE TIER? Read against ${PRED}\n`);
  console.log(`FAIR-TEST GATE: passed - the stamps, and on both cases the four arms ran the same settings but the bridge read and the return points, at the registered settings (seed ${SEED}, ${N} paths, ${PTS} points)\n`);
  console.log('case       arm         table    sim    gap  tier-below  below   solve s');
  for (const c of CASES.map(id => cases.find(x => x.id === id))) for (const a of c.arms) console.log(`${c.id.padEnd(10)} ${a.label.padEnd(10)} ${f(a.table).padStart(6)} ${f(a.sim).padStart(6)} ${f(a.gap).padStart(6)} ${f(a.tier).padStart(11)} ${f(a.below).padStart(6)} ${String(a.secs).padStart(9)}`);
  console.log('\nPAIRED on the same paths (saved/lost), the survival change in points with its exact 95% interval:');
  for (const c of CASES.map(id => cases.find(x => x.id === id))) for (const p of PAIRS) { const x = c.pairs[p]; console.log(`  ${c.id.padEnd(9)} ${p.padEnd(18)} ${x.saved}/${x.lost}  ${iv(survivalChange(x.lost, x.saved, N, ALPHA))}`); }
  const why = CASES.flatMap(id => reproduced(cases.find(x => x.id === id)).map(w => `${id}: ${w}`));
  console.log(`\n1. the 5-point arms reproduce 7r: ${why.length ? `NO - ${why.join('; ')}` : 'yes, both cases (tables and survival to 0.1, the reader\'s saved and lost against off)'}`);
  const d = decide(rowsOf(cases));
  console.log('\nTHE RULE, per case (g: the reader at 15 against the reader at 5; h: the reader at 15 against off at 15; Holm over the two cases):');
  for (const r of d.reads) console.log(`  ${r.id.padEnd(9)} g ${iv(r.gi)}, p for a gain ${fp(r.pGain)} (Holm) -> ${r.gains ? 'gains' : r.noGain ? 'no material gain' : 'neither'}; h ${iv(r.hi)}, p for harm ${fp(r.pHarm)} (Holm) -> ${r.harms ? 'harms' : r.noHarm ? 'no material harm' : 'neither'}; the case ${r.read}`);
  console.log('\nTHE OTHER ITEMS (scored, not the outcome):');
  for (const [t, ok] of items(cases)) console.log(`  ${t} -> ${ok ? 'held' : 'MISSED'}`);
  console.log(`  2. the outcome as registered: see below`);
  console.log(`\nOUTCOME: ${why.length ? 'NOT SETTLED (the 5-point arms did not reproduce 7r)' : d.outcome}`);
}
