/*
 * 7e'S REDUCER (PLAN.md 7e; predictions/bridge-reader.md): reads batch-7e.sh's logs (results/bridge7e/*.txt), gates each
 * case's arms on their ran lines, and scores the prediction's items.
 *
 * THE GATE (its own; read-f1v2.mjs refuses exact-final-year arms): for every case, every arm has a ran line; the lines are
 * equal once the bridge read (and, for an @q arm, the return points) are taken out; each names the settings the
 * prediction registers - mix 3, the grid's points, the held-out paths' seed 7011, lambda 0.0223606797749979, raiseSurv
 * true, failShort floor, tiersAbove 1, finalIntegral true - and each arm's bridgeRead and quad are its label's (OFF false, V1 true, V2 2, READER reader;
 * @15 quad 15, else 5). Any failure prints GATE FAILED and nothing else is read.
 * SURVIVAL, paired against the first arm on the same paths: net = gained - lost, se = sqrt(discordant) / N; beyond two
 * se when net^2 > 4 x discordant, at the line when equal (the whole-count rule, the bugs list 25 Sep 00:25 UK).
 * Planted, before any real file is read: a clean synthetic log reads NOT FALSIFIED; an arm with the final year averaged,
 * one in the fold, one with the wrong bridge read and one on seed 7002's paths each fail the gate; a reader loss beyond two se, an in-class misread
 * of 12 and a time ratio of 1.25 each falsify.
 *   node research/solver/reduce-7e.mjs [dir]
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'bridge7e');
const LAMBDA = '0.0223606797749979';
const BR = { OFF: 'false', V1: 'true', V2: '2', READER: 'reader' };
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const CELL = /(\S+) table\s+(-?[\d.]+) sim\s+(-?[\d.]+) gap\s+(-?[\d.]+) tier-below\s+(-?[\d.]+) below\s+(-?[\d.]+) (\d+) s(?: d ([+-]?[\d.]+) se ([\d.]+) \((\d+)\/(\d+)\))?/;

// one log's cases: { id, arms: [{ label, table, sim, gap, tier, below, secs, up, dn }], ran: { label: line } }
function parse(text) {
  const cases = []; let cur = null;
  for (const line of text.split('\n')) {
    const r = /^\s+ran (\S+): (.*)$/.exec(line);
    if (r && cur) { cur.ran[r[1]] = r[2]; continue; }
    if (!/ \| \S+ table /.test(line)) continue;
    const parts = line.split(' | ');
    cur = { id: parts[0].slice(0, 16).trim(), arms: [], ran: {} };
    for (const p of parts.slice(1)) {
      const m = CELL.exec(p); if (!m) continue;
      cur.arms.push({ label: m[1], table: +m[2], sim: +m[3], gap: +m[4], tier: +m[5], below: +m[6], secs: +m[7], d: m[8] !== undefined ? +m[8] : 0, se: m[9] !== undefined ? +m[9] : 0, up: m[10] !== undefined ? +m[10] : 0, dn: m[11] !== undefined ? +m[11] : 0 });
    }
    cases.push(cur);
  }
  return cases;
}
function gate(cases, pts) {
  const bad = [];
  for (const c of cases) {
    if (!c.arms.length) { bad.push(`${c.id}: no arms`); continue; }
    const strip = s => s.replace(/ bridgeRead \S+/, '').replace(/ quad \d+ /, ' ');
    const first = c.ran[c.arms[0].label];
    for (const a of c.arms) {
      const ran = c.ran[a.label];
      if (!ran) { bad.push(`${c.id}: no ran line for ${a.label}`); continue; }
      if (strip(ran) !== strip(first)) bad.push(`${c.id}: ${a.label} differs beyond the bridge read and return points ("${ran}")`);
      const want = { mix: '3', pts: String(pts), seed: '7011', grid: `total${pts}x6x6`, lambda: LAMBDA, raiseSurv: 'true', failShort: 'floor', tiersAbove: '1', finalIntegral: 'true' };
      for (const [k, v] of Object.entries(want)) if (field(ran, k) !== v) bad.push(`${c.id}: ${a.label} ${k} is ${field(ran, k)}, the prediction names ${v}`);
      const [name, q] = a.label.split('@');
      if (field(ran, 'bridgeRead') !== BR[name]) bad.push(`${c.id}: ${a.label} ran bridgeRead ${field(ran, 'bridgeRead')}`);
      if (field(ran, 'quad') !== (q || '5')) bad.push(`${c.id}: ${a.label} ran quad ${field(ran, 'quad')}`);
    }
  }
  return bad;
}
const beyond = a => (a.up - a.dn) ** 2 > 4 * (a.up + a.dn);
const atLine = a => a.up + a.dn > 0 && (a.up - a.dn) ** 2 === 4 * (a.up + a.dn);
const IN_CLASS = ['S126', 'share 0.90', 'bridge 1', 'bridge 4', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124'];
const THIN = ['S128', 'S130'];

// the items, from parsed logs: { main: cases (wave 1, 16 points), controls, s360, p30, time: { id: ratio } }
function score({ main, controls, s360, p30, time }) {
  const out = [], fire = [];
  const by = id => main.find(c => c.id === id), arm = (c, l) => c && c.arms.find(a => a.label === l);
  const gapOf = (id, l = 'READER') => { const a = arm(by(id), l); return a ? a.gap : NaN; };
  const within = (id, lim) => Math.abs(gapOf(id)) <= lim;
  // 1. in class away from the edge, and the thin two
  const i1 = IN_CLASS.filter(id => by(id)), bad1 = i1.filter(id => !within(id, 5)), thin = THIN.filter(id => by(id) && !within(id, 8));
  out.push(`1. in class (${i1.length} cases): the reader's gap within +/-5 on ${i1.length - bad1.length}${bad1.length ? `; outside: ${bad1.map(id => `${id} ${gapOf(id).toFixed(1)}`).join(', ')}` : ''}; the thin S128 and S130 within +/-8 on ${THIN.length - thin.length} of ${THIN.length} -> ${bad1.length || thin.length ? 'MISSED' : 'held'}`);
  const far = i1.filter(id => Math.abs(gapOf(id)) > 10);
  if (far.length) fire.push(`an in-class case misreads by more than 10 with the reader (${far.map(id => `${id} ${gapOf(id).toFixed(1)}`).join(', ')})`);
  // 2. money arriving in the bridge
  const i2 = ['bridge 6', 'S366'].filter(id => by(id)), bad2 = i2.filter(id => !within(id, 5));
  out.push(`2. bridge 6 and S366 within +/-5: ${i2.map(id => `${id} ${gapOf(id).toFixed(1)}`).join(', ')} -> ${bad2.length ? 'MISSED' : 'held'}; S370 reported: ${by('S370') ? gapOf('S370').toFixed(1) : '-'}`);
  const far2 = i2.filter(id => Math.abs(gapOf(id)) > 15);
  if (far2.length) fire.push(`bridge 6 or S366 misreads by more than 15 (${far2.join(', ')})`);
  // 3. the edge and the short
  const i3 = ['share 0.95', 'S360'].filter(id => by(id)), bad3 = i3.filter(id => !within(id, 10));
  out.push(`3. share 0.95 and S360 within +/-10: ${i3.map(id => `${id} ${gapOf(id).toFixed(1)}`).join(', ')} -> ${bad3.length ? 'MISSED' : 'held'}`);
  // 4. the cost case
  out.push(`4. bridge 4+cost within +/-8: ${by('bridge 4+cost') ? gapOf('bridge 4+cost').toFixed(1) : '-'} -> ${by('bridge 4+cost') && within('bridge 4+cost', 8) ? 'held' : 'MISSED'}`);
  // 5. no survival cost, on every case of every log, the reader against off
  const all = [...main, ...controls, ...p30];
  const losses = all.filter(c => { const r = arm(c, 'READER'); return r && r.up < r.dn && beyond(r); });
  const lines = all.filter(c => { const r = arm(c, 'READER'); return r && r.up < r.dn && atLine(r); });
  out.push(`5. no case loses survival with the reader beyond two se: ${losses.length ? `LOSSES ${losses.map(c => { const r = arm(c, 'READER'); return `${c.id} ${r.d} +/- ${r.se} (${r.up}/${r.dn})`; }).join(', ')}` : 'none'}${lines.length ? `; at the line: ${lines.map(c => c.id).join(', ')}` : ''} -> ${losses.length ? 'MISSED' : 'held'}`);
  if (losses.length) fire.push('the reader loses survival beyond two se on a case');
  // 6. gains where v2 gained most
  const i6 = ['share 0.95', 'S360'].filter(id => by(id)), gain = i6.filter(id => { const r = arm(by(id), 'READER'); return r && r.up > r.dn && beyond(r); });
  out.push(`6. the reader gains survival beyond two se on share 0.95 and S360: ${i6.map(id => { const r = arm(by(id), 'READER'); return `${id} ${r.d} +/- ${r.se} (${r.up}/${r.dn})`; }).join(', ')} -> ${gain.length === i6.length && i6.length === 2 ? 'held' : 'MISSED'}`);
  // 7. out of class and the no-bridge controls
  const same = c => { const o = arm(c, 'OFF'), r = arm(c, 'READER'); return o && r && o.table === r.table && o.sim === r.sim && o.tier === r.tier; };
  const near = c => { const o = arm(c, 'OFF'), r = arm(c, 'READER'); return o && r && Math.abs(o.table - r.table) <= 0.5 && Math.abs(o.sim - r.sim) <= 0.5; };
  const b0 = by('bridge 0'), s50 = by('share 0.50'), s70 = by('share 0.70');
  const ctlSame = controls.filter(same).length;
  const ok7 = b0 && same(b0) && s50 && near(s50) && s70 && near(s70) && ctlSame === controls.length && controls.length === 3;
  out.push(`7. bridge 0 identical: ${b0 && same(b0) ? 'yes' : 'NO'}; share 0.50 and 0.70 within 0.5: ${s50 && near(s50) && s70 && near(s70) ? 'yes' : 'NO'}; the no-bridge controls identical: ${ctlSame} of ${controls.length} -> ${ok7 ? 'held' : 'MISSED'}`);
  // 8. the product's 30 points
  const bad8 = p30.filter(c => { const r = arm(c, 'READER'); return !r || Math.abs(r.gap) > 5; });
  out.push(`8. at 30 points the reader's gap within +/-5: ${p30.map(c => `${c.id} ${arm(c, 'READER') ? arm(c, 'READER').gap.toFixed(1) : '-'}`).join(', ')} -> ${bad8.length || p30.length !== 3 ? 'MISSED' : 'held'}`);
  // 9. the time bar at 30 points
  const ratios = Object.entries(time), worst = ratios.length ? Math.max(...ratios.map(r => r[1])) : NaN;
  out.push(`9. the reader's added solve time at 30 points at most 20% on each case: ${ratios.map(([id, r]) => `${id} ${r.toFixed(3)}`).join(', ')} -> ${ratios.length === 3 && worst <= 1.2 ? 'held' : 'MISSED'}`);
  if (!(ratios.length === 3 && worst <= 1.2)) fire.push(`the time bar: ${ratios.length === 3 ? `the largest ratio is ${worst.toFixed(3)}` : `${ratios.length} of 3 cases timed`}`);
  // reported, not predicted
  const rep = [];
  for (const c of main) rep.push(`   ${c.id.padEnd(14)} ${c.arms.map(a => `${a.label} gap ${a.gap.toFixed(1).padStart(6)} sim ${a.sim.toFixed(1).padStart(5)}${a.label === 'OFF' ? '' : ` d ${a.d >= 0 ? '+' : ''}${a.d} +/- ${a.se}`}`).join(' | ')}`);
  const q = s360[0];
  if (q) { const b = arm(q, 'READER@15'); rep.push(`   S360 with the reader, 15 against 5 return points: ${b ? `${b.d >= 0 ? '+' : ''}${b.d} +/- ${b.se} (${b.up}/${b.dn})${beyond(b) ? ', beyond two se' : atLine(b) ? ', at the line' : ', within two se'}` : '-'} (7j: +2.00 +/- 0.47 with no bridge read)`); }
  return { out, fire, rep };
}
function report(s) {
  console.log('7e: THE BRIDGE FIXES SIDE BY SIDE, READ AGAINST predictions/bridge-reader.md');
  s.out.forEach(l => console.log(l));
  console.log(`\nFALSIFIER: ${s.fire.length ? `fired - ${s.fire.join('; ')}` : 'not fired'}\n=> ${s.fire.length ? 'FALSIFIED' : 'NOT FALSIFIED'}`);
  console.log('\nREPORTED, NOT PREDICTED (each arm against off, paired):');
  s.rep.forEach(l => console.log(l));
}

// PLANTED, before any real file is read
{
  const ran = (br, pts = 16, over = '') => `mix 3 pts ${pts} seed 7011 grid total${pts}x6x6 lambda ${LAMBDA} levels 1.1,1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 1 minPot 25000 quad 5 finalIntegral true bridgeRead ${br}${over}`;
  const cell = (l, g, sim, d = null) => `${l} table ${(sim + g).toFixed(1)} sim ${sim.toFixed(1)} gap ${g.toFixed(1)} tier-below 10.0 below 1.0 300 s${d ? ` d ${d[0]} se ${d[1]} (${d[2]}/${d[3]})` : ''}`;
  const mkCase = (id, gR = 1, dR = ['+0.0', '0.0', 0, 0], ranR = ran('reader'), pts = 16, simO = 90) => [`${id.padEnd(16)} a0 0.85 B 2 class YES | ${cell('OFF', -50, simO)} | ${cell('READER', gR, simO + (+dR[0]), dR)}`, `${''.padEnd(16)} ran OFF: ${ran('false', pts)}`, `${''.padEnd(16)} ran READER: ${pts === 16 ? ranR : ran('reader', pts)}`].join('\n');
  const ids = [...IN_CLASS, ...THIN, 'bridge 6', 'S366', 'S370', 'share 0.95', 'S360', 'bridge 4+cost', 'share 0.50', 'share 0.70', 'bridge 0', 'S162', 'S172'];
  const clean = over => parse(ids.map(id => (over[id] ? over[id]() : (id === 'share 0.95' || id === 'S360') ? mkCase(id, 1, ['+10.0', '1.0', 100, 0]) : (id === 'bridge 0' || id === 'share 0.50' || id === 'share 0.70') ? [`${id.padEnd(16)} a0 0.85 B 2 class no  | ${cell('OFF', 0.5, 99)} | ${cell('READER', 0.5, 99, ['+0.0', '0.0', 0, 0])}`, `${''.padEnd(16)} ran OFF: ${ran('false')}`, `${''.padEnd(16)} ran READER: ${ran('reader')}`].join('\n') : mkCase(id))).join('\n'));
  const ctl = parse(['S194', 'S252', 'S330'].map(id => [`${id.padEnd(16)} a0 0.10 B 0 class no  | ${cell('OFF', 0.5, 99)} | ${cell('READER', 0.5, 99, ['+0.0', '0.0', 0, 0])}`, `${''.padEnd(16)} ran OFF: ${ran('false')}`, `${''.padEnd(16)} ran READER: ${ran('reader')}`].join('\n')).join('\n'));
  const p30 = parse(['S126', 'bridge 6', 'S366'].map(id => mkCase(id, 1, ['+0.0', '0.0', 0, 0], null, 30)).join('\n'));
  const time = { S126: 1.1, 'bridge 6': 1.1, S366: 1.1 };
  const run = (over = {}, t = time) => { const main = clean(over); const g = gate(main, 16); return g.length ? 'GATE' : (score({ main, controls: ctl, s360: [], p30, time: t }).fire.length ? 'FALSIFIED' : 'NOT FALSIFIED'); };
  const want = [
    ['clean', run(), 'NOT FALSIFIED'],
    ['final year averaged', run({ S126: () => mkCase('S126', 1, ['+0.0', '0.0', 0, 0], ran('reader').replace('finalIntegral true', 'finalIntegral false')) }), 'GATE'],
    ['the fold', run({ S126: () => mkCase('S126', 1, ['+0.0', '0.0', 0, 0], ran('reader').replace('mix 3', 'mix 0')) }), 'GATE'],
    ['wrong bridge read', run({ S126: () => mkCase('S126', 1, ['+0.0', '0.0', 0, 0], ran('2')) }), 'GATE'],
    ['the paths that chose the reader', run({ S126: () => mkCase('S126', 1, ['+0.0', '0.0', 0, 0], ran('reader').replace('seed 7011', 'seed 7002')) }), 'GATE'],
    ['a loss beyond two se', run({ 'bridge 4': () => mkCase('bridge 4', 1, ['-1.0', '0.3', 0, 10]) }), 'FALSIFIED'],
    ['an in-class misread of 12', run({ S124: () => mkCase('S124', 12) }), 'FALSIFIED'],
    ['a time ratio of 1.25', run({}, { ...time, S366: 1.25 }), 'FALSIFIED'],
  ];
  const wrong = want.filter(([, got, w]) => got !== w);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  if (process.argv.includes('--planted')) { console.log(`planted: ${want.map(([n, got]) => `${n} -> ${got}`).join('; ')}`); process.exit(0); }
}

// the real logs
const read = f => (existsSync(join(DIR, f)) ? readFileSync(join(DIR, f), 'utf8') : null);
const parts = ['part0.txt', 'part1.txt', 'part2.txt', 'part3.txt'].map(read);
if (parts.some(p => p === null)) { console.log(`reduce-7e: missing wave-1 logs in ${DIR}`); process.exit(1); }
const main = parts.flatMap(parse), controls = parse(read('controls.txt') || ''), s360 = parse(read('s360-quad.txt') || ''), p30 = parse(read('p30.txt') || '');
if (main.length !== 23) { console.log(`reduce-7e: ${main.length} wave-1 cases, the prediction registers 23`); process.exit(1); }
const bad = [...gate(main, 16), ...gate(controls, 16), ...gate(s360, 16), ...gate(p30, 30)];
if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`FAIR-TEST GATE: passed - ${main.length + controls.length + s360.length + p30.length} cases, each case's arms the same but the bridge read (and the return points for an @15 arm), at the registered settings\n`);
const time = {}; for (const l of (read('time30.txt') || '').split('\n')) { const m = /^(.+): median [\d.]+ s off, [\d.]+ s with the reader -> ratio ([\d.]+)$/.exec(l); if (m) time[m[1]] = +m[2]; }
report(score({ main, controls, s360, p30, time }));
