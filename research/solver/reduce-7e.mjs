/*
 * 7e'S REDUCER (PLAN.md 7e; predictions/bridge-reader.md): reads batch-7e.sh's logs (results/bridge7e/*.txt), gates each
 * case's arms on their ran lines, and reads the prediction by THE EXACT RULE (the outside review's section 19, in the
 * regimen the maintainer adopted 25 Sep 20:47 UK; the arithmetic is stats.mjs, tested in research/tests/stats.test.mjs).
 *
 * THE GATE (its own; read-f1v2.mjs refuses exact-final-year arms): for every case, every arm has a ran line; the lines are
 * equal once the bridge read (and, for an @q arm, the return points) are taken out; each names the settings the
 * prediction registers - mix 3, the grid's points, the held-out paths' seed 7011 and their count (1000; 3000 in the second
 * look's file), lambda 0.0223606797749979, raiseSurv true, failShort floor, tiersAbove 1, finalIntegral true - and each
 * arm's bridgeRead and quad are its label's (OFF false, V1 true, V2 2, READER reader; @15 quad 15, else 5). Any failure
 * prints GATE FAILED and nothing else is read.
 * THE STAMP GATE (fair-gate.mjs's requireFairLogs, the shared gate for audit-s126.mjs's text logs):
 * every log carries at least one stamp; one version of the code (code-id.mjs) and of audit-s126.mjs across them all;
 * launched through run-from-snapshot.sh under predictions/bridge-reader.md, whose git blob now is the one each log was
 * launched under (else PREDICTION EDITED). A measurement's stamp ("none") or NOT-LAUNCHED is refused.
 * COMPLETENESS (the forty-sixth review): 24 wave-1 cases with four arms and a pairs line, the 3 no-bridge controls with off
 * and the reader, S360 with the reader at 5 and 15 points, the 3 cases at 30 points, 3 timing ratios, and a second-look
 * file holding exactly the cases the first look left open. Anything short prints INCOMPLETE and stops: a check that ran
 * on nothing is an error, not a pass.
 *
 * THE RULE (section 19). Primary: the reader against off, per wave-1 case, b paths lost and c saved of N.
 *   - exact one-sided McNemar for harm; Holm across the 24 cases; the margin 0.25 points where off simulates 95% or more,
 *     0.5 below (the review's proposed margins, adopted with the regimen)
 *   - look 1 at 1,000 paths, error rate 0.005; look 2 at 3,000 paths (the same first 1,000 and 2,000 more: pathsForSeed
 *     builds path i from seed + i x 7919) for the cases look 1 left open, at 0.045, Holm on each case's latest p
 *   - no material harm: the exact interval (at 1 - the look's rate) lies above minus the margin; harm: the Holm-adjusted p
 *     is below the look's rate and the point loss is at least the margin; else inconclusive, its bound reported
 *   - the 30-point cases and the no-bridge controls: each its own family, one look at 0.05
 *   - pooled over the bridge class (the mode's "class YES"): a DerSimonian-Laird mean with its 95% interval, and the
 *     sign test
 *   - the read gap (table minus simulation) per case: scored against the prediction's items, not tested
 *   Secondary (reported): the reader against v1 and against v2 from the pairs line, look 1, Holm across the 24, at 0.05.
 * FALSIFIED (so NOT CARRIED FORWARD, and F2 is built: the maintainer, 25 Sep 07:29 UK) if any of: harm on a case; the
 * pooled interval's lower end at or below -0.1 points; a time ratio above 1.20 at 30 points; an in-class case misread by
 * more than 10 ("in class" is 7c's reading in read-f1v2.mjs: every class case but the edge, share 0.95, and the inflow
 * cases, bridge 6 and S366, so the thin S128 and S130 and the cost case are in it); bridge 6 or S366 misread by more than
 * 15. Otherwise NOT FALSIFIED, and the reader goes to the maintainer as the bridge read, with any inconclusive case and
 * its bound listed.
 *
 * Planted, before any real file is read (the reducer's own verdict on synthetic logs; the table is at the end of the
 * planted block): section 19's four outcome checks (4 lost 0 saved of 3,000 at 0.25 no material harm; 9 lost 1 saved of
 * 1,000 at 0.5 inconclusive; 30 lost 2 saved of 3,000 harm; 0 of 0 no material harm), a second setting changed between
 * arms refused by the gate, and the older checks: the final year averaged, the fold, the wrong bridge read, seed 7002 and
 * 3,000 paths at look 1 refused; the misreads, the time bar and a pooled loss falsify; missing files read INCOMPLETE.
 *   node research/solver/reduce-7e.mjs [dir]          the verdict
 *   node research/solver/reduce-7e.mjs --look1 [dir]  the cases look 1 leaves open, comma-joined, or "none"
 *   node research/solver/reduce-7e.mjs --planted      the planted checks alone
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mcnemarHarmP, holm, outcome, pooledRE, signTest, MARGINS, marginFor } from './stats.mjs';
import { checkLogStamps, requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'bridge7e');
const LAMBDA = '0.0223606797749979';
const BR = { OFF: 'false', V1: 'true', V2: '2', READER: 'reader' };
const WAVE1 = 24, LOOK1 = 0.005, LOOK2 = 0.045, ONE_LOOK = 0.05, POOL_FLOOR = -MARGINS.pooled, TIME_BAR = 1.2;
const marginOf = marginFor;   // stats.mjs: the decided margins (PLAN.md's decided-defaults block carries them)
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const CELL = /(\S+) table\s+(-?[\d.]+) sim\s+(-?[\d.]+) gap\s+(-?[\d.]+) tier-below\s+(-?[\d.]+) below\s+(-?[\d.]+) (\d+) s(?: d ([+-]?[\d.]+) se ([\d.]+) \((\d+)\/(\d+)\))?/;

// one log's cases: { id, cls, arms: [{ label, table, sim, gap, tier, below, secs, d, se, up, dn }], ran, pairs, unsupported }
// up and dn are against the case's first arm: up = paths this arm saves, dn = paths it loses
function parse(text) {
  const cases = []; let cur = null;
  for (const line of text.split('\n')) {
    const r = /^\s+ran (\S+): (.*)$/.exec(line);
    if (r && cur) { cur.ran[r[1]] = r[2]; continue; }
    const u = /^\s+tables (\S+): (\d+) reader tables, (\d+) unsupported nodes$/.exec(line);
    if (u && cur) { cur.unsupported[u[1]] = +u[3]; continue; }
    const pr = /^\s+pairs (.*)$/.exec(line);
    if (pr && cur) { for (const m of pr[1].matchAll(/(\S+)-(\S+) (\d+)\/(\d+)/g)) cur.pairs[`${m[1]}-${m[2]}`] = { up: +m[3], dn: +m[4] }; continue; }
    if (!/ \| \S+ table /.test(line)) continue;
    const parts = line.split(' | ');
    cur = { id: parts[0].slice(0, 16).trim(), cls: / class YES/.test(parts[0]), arms: [], ran: {}, pairs: {}, unsupported: {} };
    for (const p of parts.slice(1)) {
      const m = CELL.exec(p); if (!m) continue;
      cur.arms.push({ label: m[1], table: +m[2], sim: +m[3], gap: +m[4], tier: +m[5], below: +m[6], secs: +m[7], d: m[8] !== undefined ? +m[8] : 0, se: m[9] !== undefined ? +m[9] : 0, up: m[10] !== undefined ? +m[10] : 0, dn: m[11] !== undefined ? +m[11] : 0 });
    }
    cases.push(cur);
  }
  return cases;
}
function gate(cases, pts, paths = 1000) {
  const bad = [];
  for (const c of cases) {
    if (!c.arms.length) { bad.push(`${c.id}: no arms`); continue; }
    const strip = s => s.replace(/ bridgeRead \S+/, '').replace(/ quad \d+ /, ' ');
    const first = c.ran[c.arms[0].label];
    for (const a of c.arms) {
      const ran = c.ran[a.label];
      if (!ran) { bad.push(`${c.id}: no ran line for ${a.label}`); continue; }
      if (strip(ran) !== strip(first)) bad.push(`${c.id}: ${a.label} differs beyond the bridge read and return points ("${ran}")`);
      const want = { mix: '3', pts: String(pts), seed: '7011', paths: String(paths), grid: `total${pts}x6x6`, lambda: LAMBDA, raiseSurv: 'true', failShort: 'floor', tiersAbove: '1', finalIntegral: 'true' };
      for (const [k, v] of Object.entries(want)) if (field(ran, k) !== v) bad.push(`${c.id}: ${a.label} ${k} is ${field(ran, k)}, the prediction names ${v}`);
      const [name, q] = a.label.split('@');
      if (field(ran, 'bridgeRead') !== BR[name]) bad.push(`${c.id}: ${a.label} ran bridgeRead ${field(ran, 'bridgeRead')}`);
      if (field(ran, 'quad') !== (q || '5')) bad.push(`${c.id}: ${a.label} ran quad ${field(ran, 'quad')}`);
    }
  }
  return bad;
}
const PRED = 'research/solver/predictions/bridge-reader.md';
const labels = c => c.arms.map(a => a.label).join(',');
const arm = (c, l) => c && c.arms.find(a => a.label === l);
const IN_CLASS = ['S126', 'share 0.90', 'bridge 1', 'bridge 4', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124'];
const THIN = ['S128', 'S130'];
// the falsifier's class: 7c's reading of the same words (read-f1v2.mjs), the thin two and the cost case included
const FALSIFIER_CLASS = [...IN_CLASS, ...THIN, 'bridge 4+cost'];

// one family: rows { id, b, c, N, margin }, Holm across them, each read at its own look's rate
function family(rows) {
  rows.forEach(x => { x.p = mcnemarHarmP(x.b, x.c); });
  const adj = holm(rows.map(x => x.p));
  rows.forEach((x, i) => { x.pHolm = adj[i]; x.res = outcome({ b: x.b, c: x.c, N: x.N, margin: x.margin, pHolm: x.pHolm, level: x.level }); });
  return rows;
}
const versusOff = (c, N = 1000, level = ONE_LOOK, tag = '') => { const r = arm(c, 'READER'); return { id: `${c.id}${tag}`, b: r.dn, c: r.up, N, margin: marginOf(arm(c, 'OFF').sim), level }; };
// look 1 on wave 1, at 0.005
const look1 = main => family(main.map(c => versusOff(c, 1000, LOOK1)));
const openAfter1 = main => look1(main).filter(x => x.res.outcome === 'inconclusive').map(x => x.id);

// the full counts, or the reasons it is short
function complete({ main, controls, s360, p30, time, look2 }) {
  const bad = [];
  if (main.length !== WAVE1) bad.push(`${main.length} wave-1 cases, the prediction registers ${WAVE1}`);
  main.filter(c => labels(c) !== 'OFF,V1,V2,READER').forEach(c => bad.push(`${c.id}: arms ${labels(c)}, not OFF,V1,V2,READER`));
  main.filter(c => !c.pairs['READER-V1'] || !c.pairs['READER-V2']).forEach(c => bad.push(`${c.id}: no pairs line for the reader against v1 and v2`));
  if (controls.length !== 3 || controls.some(c => labels(c) !== 'OFF,READER')) bad.push(`controls: ${controls.length} of 3 with OFF,READER`);
  if (s360.length !== 1 || s360[0].id !== 'S360' || labels(s360[0]) !== 'READER,READER@15') bad.push(`S360 at 5 and 15 points: ${s360.map(c => `${c.id} ${labels(c)}`).join('; ') || 'missing'}`);
  if (p30.length !== 3 || p30.some(c => labels(c) !== 'OFF,READER')) bad.push(`30 points: ${p30.length} of 3 with OFF,READER`);
  if (Object.keys(time).length !== 3) bad.push(`timing: ${Object.keys(time).length} of 3 ratios`);
  if (!bad.length) {
    const want = openAfter1(main).sort().join(', ');
    if (look2 === null) bad.push(`look 2: no file (look 1 left open: ${want || 'none'})`);
    else if (look2.map(c => c.id).sort().join(', ') !== want) bad.push(`look 2: holds [${look2.map(c => c.id).sort().join(', ')}], look 1 left open [${want}]`);
    else look2.filter(c => labels(c) !== 'OFF,READER').forEach(c => bad.push(`look 2: ${c.id} arms ${labels(c)}, not OFF,READER`));
  }
  return bad;
}

// the rule, from complete and gated logs
function decide({ main, controls, p30, time, look2 }) {
  // look 1, then look 2 for the open cases; Holm across the 24 on each case's latest p
  const open = new Set(openAfter1(main));
  const rows = family(main.map(c => (open.has(c.id) ? { ...versusOff(look2.find(k => k.id === c.id), 3000, LOOK2), look: 2 } : versusOff(c, 1000, LOOK1))));
  const r30 = family(p30.map(c => versusOff(c, 1000, ONE_LOOK, ' @30')));
  const rCtl = family(controls.map(c => versusOff(c, 1000, ONE_LOOK, ' (control)')));
  const cls = rows.filter(x => main.find(c => c.id === x.id).cls);
  const pool = pooledRE(cls.map(x => ({ b: x.b, c: x.c, N: x.N }))), sign = signTest(cls.map(x => 100 * (x.c - x.b) / x.N));
  const ratios = Object.entries(time), worst = Math.max(...ratios.map(r => r[1]));
  const all = [...rows, ...r30, ...rCtl];
  const harm = all.filter(x => x.res.outcome === 'harm'), inconclusive = all.filter(x => x.res.outcome === 'inconclusive');
  const by = id => main.find(c => c.id === id), gapOf = id => arm(by(id), 'READER').gap;
  const fire = [];
  if (harm.length) fire.push(`harm on ${harm.map(x => x.id).join(', ')}`);
  if (!(pool.lo > POOL_FLOOR)) fire.push(`the pooled bridge-class interval's lower end ${pool.lo.toFixed(2)} is not above ${POOL_FLOOR}`);
  if (!(worst <= TIME_BAR)) fire.push(`the time bar: the largest ratio is ${worst.toFixed(3)}`);
  const far = FALSIFIER_CLASS.filter(id => by(id) && Math.abs(gapOf(id)) > 10);
  if (far.length) fire.push(`an in-class case misreads by more than 10 (${far.map(id => `${id} ${gapOf(id).toFixed(1)}`).join(', ')})`);
  const far2 = ['bridge 6', 'S366'].filter(id => by(id) && Math.abs(gapOf(id)) > 15);
  if (far2.length) fire.push(`bridge 6 or S366 misreads by more than 15 (${far2.map(id => `${id} ${gapOf(id).toFixed(1)}`).join(', ')})`);
  return { rows, r30, rCtl, pool, sign, ratios, harm, inconclusive, fire };
}
// the secondary comparisons, reported: the reader against v1 and v2, look 1, Holm across the 24, at 0.05
const secondary = (main, other) => family(main.map(c => { const q = c.pairs[`READER-${other}`]; return { id: c.id, b: q.dn, c: q.up, N: 1000, margin: marginOf(arm(c, other).sim), level: ONE_LOOK }; }));

// the prediction's items, scored against what it says (a miss is recorded, never re-read)
function items({ main, controls, s360, p30, look2 }, d) {
  const out = [], rep = [], by = id => main.find(c => c.id === id), gapOf = id => arm(by(id), 'READER').gap;
  const show = ids => ids.map(id => `${id} ${gapOf(id).toFixed(1)}`).join(', ');
  const b1 = IN_CLASS.filter(id => Math.abs(gapOf(id)) > 5), t1 = THIN.filter(id => Math.abs(gapOf(id)) > 8);
  out.push(`1. in class (${IN_CLASS.length} cases) the reader's gap within +/-5, the thin S128 and S130 within +/-8: ${b1.length || t1.length ? `outside: ${show([...b1, ...t1])} -> MISSED` : 'held'}`);
  const b2 = ['bridge 6', 'S366'].filter(id => Math.abs(gapOf(id)) > 5);
  out.push(`2. bridge 6 and S366 within +/-5: ${show(['bridge 6', 'S366'])} -> ${b2.length ? 'MISSED' : 'held'}; S370 reported: ${show(['S370'])}`);
  const b3 = ['share 0.95', 'S360'].filter(id => Math.abs(gapOf(id)) > 10);
  out.push(`3. share 0.95 and S360 within +/-10: ${show(['share 0.95', 'S360'])} -> ${b3.length ? 'MISSED' : 'held'}`);
  out.push(`4. bridge 4+cost within +/-8: ${show(['bridge 4+cost'])} -> ${Math.abs(gapOf('bridge 4+cost')) <= 8 ? 'held' : 'MISSED'}`);
  out.push(`5. no case shows harm by the exact rule: ${d.harm.length ? `harm on ${d.harm.map(x => x.id).join(', ')} -> MISSED` : 'held'}`);
  const g6 = ['share 0.95', 'S360'].map(id => { const r = arm(by(id), 'READER'); return { id, r, p: mcnemarHarmP(r.up, r.dn) }; });
  out.push(`6. the reader gains survival on share 0.95 and S360 (the exact one-sided p for a gain below 0.05): ${g6.map(x => `${x.id} ${x.r.d >= 0 ? '+' : ''}${x.r.d} (${x.r.up} saved, ${x.r.dn} lost; p ${x.p.toExponential(1)})`).join(', ')} -> ${g6.every(x => x.r.up > x.r.dn && x.p < 0.05) ? 'held' : 'MISSED'}`);
  const same = c => { const o = arm(c, 'OFF'), r = arm(c, 'READER'); return o.table === r.table && o.sim === r.sim && o.tier === r.tier; };
  const near = c => { const o = arm(c, 'OFF'), r = arm(c, 'READER'); return Math.abs(o.table - r.table) <= 0.5 && Math.abs(o.sim - r.sim) <= 0.5; };
  const ctlSame = controls.filter(same).length, ok7 = same(by('bridge 0')) && near(by('share 0.50')) && near(by('share 0.70')) && ctlSame === 3;
  out.push(`7. bridge 0 identical: ${same(by('bridge 0')) ? 'yes' : 'NO'}; share 0.50 and 0.70 within 0.5: ${near(by('share 0.50')) && near(by('share 0.70')) ? 'yes' : 'NO'}; the no-bridge controls identical: ${ctlSame} of 3 -> ${ok7 ? 'held' : 'MISSED'}`);
  const b8 = p30.filter(c => Math.abs(arm(c, 'READER').gap) > 5);
  out.push(`8. at 30 points the reader's gap within +/-5: ${p30.map(c => `${c.id} ${arm(c, 'READER').gap.toFixed(1)}`).join(', ')} -> ${b8.length ? 'MISSED' : 'held'}`);
  out.push(`9. the reader's added solve time at 30 points at most 20% on each case: ${d.ratios.map(([id, r]) => `${id} ${r.toFixed(3)}`).join(', ')} -> ${d.ratios.every(r => r[1] <= TIME_BAR) ? 'held' : 'MISSED'}`);
  // reported, not predicted
  for (const c of main) rep.push(`   ${c.id.padEnd(14)} ${c.arms.map(a => `${a.label} gap ${a.gap.toFixed(1).padStart(6)} sim ${a.sim.toFixed(1).padStart(5)} tier-below ${a.tier.toFixed(1).padStart(4)}`).join(' | ')}`);
  // O5 (the thin households' lower tier: a sound choice or a second misread?), read on S124, S128 and S130
  for (const id of ['S124', 'S128', 'S130']) {
    const o = arm(by(id), 'OFF'), r = arm(by(id), 'READER'), row = d.rows.find(x => x.id === id), pGain = mcnemarHarmP(r.up, r.dn);
    const v = Math.abs(r.tier - o.tier) <= 5 && row.res.outcome !== 'harm' ? 'the lower tier holds with an accurate read: a sound choice'
      : r.tier <= o.tier / 2 && r.up > r.dn && pGain < 0.05 ? 'the reader lifts the tier and gains survival: it was a second misread' : 'neither: open';
    rep.push(`   O5 ${id}: years below tier ${o.tier.toFixed(1)} off -> ${r.tier.toFixed(1)} reader; survival ${r.up} saved, ${r.dn} lost (${row.res.outcome}; p for a gain ${pGain.toExponential(1)}) - ${v}`);
  }
  const b = arm(s360[0], 'READER@15');
  rep.push(`   S360 with the reader, 15 against 5 return points: ${b.d >= 0 ? '+' : ''}${b.d} (${b.up} saved, ${b.dn} lost; exact p for a gain ${mcnemarHarmP(b.up, b.dn).toExponential(1)}) (7j: +2.00 +/- 0.47 with no bridge read)`);
  const uns = [...main, ...controls, ...s360, ...p30, ...look2].reduce((t, c) => t + Object.values(c.unsupported).reduce((a, x) => a + x, 0), 0);
  rep.push(`   the reader's unsupported nodes, over every solve: ${uns}`);
  return { out, rep };
}
function report(set) {
  const d = decide(set), it = items(set, d);
  const f = x => `   ${x.id.padEnd(22)} ${String(x.b).padStart(3)} lost ${String(x.c).padStart(3)} saved of ${x.N}  p ${x.p.toExponential(1).padStart(7)}  Holm ${x.pHolm.toExponential(1).padStart(7)}  change ${x.res.d >= 0 ? '+' : ''}${x.res.d.toFixed(2)} (${x.res.lo.toFixed(2)} to ${x.res.hi.toFixed(2)})  margin ${x.margin}  -> ${x.res.outcome}${x.look === 2 ? ' (look 2)' : ''}`;
  console.log('7e: THE BRIDGE FIXES SIDE BY SIDE, READ AGAINST predictions/bridge-reader.md BY THE EXACT RULE (section 19)\n');
  console.log('PRIMARY - the reader against off, per case (look 1 at 0.005, look 2 at 0.045; Holm across the 24):'); d.rows.forEach(x => console.log(f(x)));
  console.log('the 30-point cases and the no-bridge controls (each its own family, one look at 0.05):'); [...d.r30, ...d.rCtl].forEach(x => console.log(f(x)));
  console.log(`POOLED over the bridge class (${d.pool.k} cases): ${d.pool.mean >= 0 ? '+' : ''}${d.pool.mean.toFixed(3)} points (${d.pool.lo.toFixed(3)} to ${d.pool.hi.toFixed(3)}), tau^2 ${d.pool.tau2.toFixed(4)}; sign test ${d.sign.pos} up, ${d.sign.neg} down, p ${d.sign.p.toFixed(3)}`);
  console.log(`\nTHE PREDICTION'S ITEMS:`); it.out.forEach(l => console.log(l));
  console.log(`\nFALSIFIER: ${d.fire.length ? `fired - ${d.fire.join('; ')}` : 'not fired'}`);
  console.log(`=> ${d.fire.length ? 'FALSIFIED - NOT CARRIED FORWARD (F2 is built and tested the same way)' : 'NOT FALSIFIED - CARRIED FORWARD to the maintainer as the bridge read'}`);
  if (d.inconclusive.length) console.log(`   inconclusive, with their bounds, for the maintainer: ${d.inconclusive.map(x => `${x.id} (${x.res.lo.toFixed(2)} to ${x.res.hi.toFixed(2)})`).join('; ')}`);
  console.log('\nSECONDARY, REPORTED - the reader against v1 and against v2 (look 1, Holm across the 24, at 0.05):');
  for (const other of ['V1', 'V2']) { const s = secondary(set.main, other), n = o => s.filter(x => x.res.outcome === o);
    console.log(`   against ${other}: harm ${n('harm').map(x => x.id).join(', ') || 'none'}; inconclusive ${n('inconclusive').map(x => `${x.id} (${x.res.lo.toFixed(2)} to ${x.res.hi.toFixed(2)})`).join(', ') || 'none'}; no material harm on ${n('no material harm').length}`); }
  console.log('\nREPORTED, NOT PREDICTED:'); it.rep.forEach(l => console.log(l));
}

// PLANTED, before any real file is read
{
  const ran = (br, pts = 16, paths = 1000) => `mix 3 pts ${pts} seed 7011 paths ${paths} grid total${pts}x6x6 lambda ${LAMBDA} levels 1.1,1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 1 minPot 25000 quad 5 finalIntegral true bridgeRead ${br}`;
  const cell = (l, sim, gap = 1, lost = 0, saved = 0, N = 1000) => `${l} table ${(sim + gap).toFixed(1)} sim ${sim.toFixed(1)} gap ${gap.toFixed(1)} tier-below 10.0 below 1.0 300 s${l === 'OFF' ? '' : ` d ${(100 * (saved - lost) / N).toFixed(2)} se 0.10 (${saved}/${lost})`}`;
  const pad = s => `${''.padEnd(16)} ${s}`;
  // a wave-1 case: the reader's losses and saves against off, its gap, whether in class, off's survival
  const w1 = (id, { lost = 0, saved = 0, gap = 1, cls = true, sim = 90, ranR = ran('reader') } = {}) => [
    `${id.padEnd(16)} a0 0.85 B 2 class ${cls ? 'YES' : 'no '} | ${cell('OFF', sim)} | ${cell('V1', sim)} | ${cell('V2', sim)} | ${cell('READER', sim + 100 * (saved - lost) / 1000, gap, lost, saved)}`,
    pad(`ran OFF: ${ran('false')}`), pad(`ran V1: ${ran('true')}`), pad(`ran V2: ${ran('2')}`), pad(`ran READER: ${ranR}`),
    pad(`pairs V1-OFF 0/0 V2-OFF 0/0 V2-V1 0/0 READER-OFF ${saved}/${lost} READER-V1 ${saved}/${lost} READER-V2 ${saved}/${lost}`)].join('\n');
  const two = (id, { lost = 0, saved = 0, pts = 16, paths = 1000, sim = 90, cls = true } = {}) => [
    `${id.padEnd(16)} a0 0.85 B 2 class ${cls ? 'YES' : 'no '} | ${cell('OFF', sim)} | ${cell('READER', sim + 100 * (saved - lost) / paths, 1, lost, saved, paths)}`,
    pad(`ran OFF: ${ran('false', pts, paths)}`), pad(`ran READER: ${ran('reader', pts, paths)}`)].join('\n');
  const ids = ['S126', 'share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 4', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124', 'S128', 'S130', 'S360', 'S366', 'S370', 'bridge 4+cost', 'S162', 'S172', 'S168'];
  const base = { 'share 0.95': { saved: 30 }, S360: { saved: 30 }, 'bridge 0': { cls: false, gap: 0.5, sim: 99 }, 'share 0.50': { cls: false, gap: 0.5, sim: 99 }, 'share 0.70': { cls: false, gap: 0.5, sim: 99 } };
  const mk = (over = {}, look2 = []) => ({
    main: parse(ids.map(id => (typeof over[id] === 'string' ? over[id] : w1(id, { ...(base[id] || {}), ...(over[id] || {}) }))).join('\n')),
    controls: parse(['S194', 'S252', 'S330'].map(id => two(id, { sim: 99, cls: false })).join('\n')),
    s360: parse([`${'S360'.padEnd(16)} a0 0.85 B 8 class no  | ${cell('READER', 40)} | ${cell('READER@15', 40)}`, pad(`ran READER: ${ran('reader')}`), pad(`ran READER@15: ${ran('reader').replace('quad 5', 'quad 15')}`)].join('\n')),
    p30: parse(['S126', 'bridge 6', 'S366'].map(id => two(id, { pts: 30 })).join('\n')),
    time: { S126: 1.1, 'bridge 6': 1.1, S366: 1.1 },
    look2: look2 === null ? null : parse(look2.map(([id, o]) => two(id, { paths: 3000, ...o })).join('\n')),
  });
  const verdict = set => {
    if (complete(set).length) return 'INCOMPLETE';
    if ([...gate(set.main, 16), ...gate(set.controls, 16), ...gate(set.s360, 16), ...gate(set.p30, 30), ...gate(set.look2, 16, 3000)].length) return 'GATE';
    let d; try { d = decide(set); } catch (e) { return `ERROR (${e.message})`; }
    return `${d.fire.length ? 'FALSIFIED' : 'CARRIED'}${d.inconclusive.length ? `, ${d.inconclusive.length} inconclusive` : ''}`;
  };
  const outcomeOf = (set, id) => { const d = decide(set); return d.rows.find(x => x.id === id).res.outcome; };
  const fifteen = mk({ S126: w1('S126', { sim: 90 }) });
  const cases = [
    // section 19's planted outcomes, through the reducer's own looks
    ['4 lost 0 saved of 3,000 at a 0.25 margin (look 1: 3 lost 0 saved)', outcomeOf(mk({ 'bridge 1': { lost: 3, sim: 97 } }, [['bridge 1', { lost: 4, sim: 97 }]]), 'bridge 1'), 'no material harm'],
    ['9 lost 1 saved of 1,000 at a 0.5 margin, at look 1', look1(mk({ 'bridge 4': { lost: 9, saved: 1 } }).main).find(x => x.id === 'bridge 4').res.outcome, 'inconclusive'],
    ['30 lost 2 saved of 3,000 (look 1: 9 lost 1 saved)', verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } }, [['bridge 4', { lost: 30, saved: 2 }]])), 'FALSIFIED'],
    ['0 of 0 discordant', outcomeOf(fifteen, 'S126'), 'no material harm'],
    ['a second setting changed between arms (minPot)', verdict(mk({ S126: { ranR: ran('reader').replace('minPot 25000', 'minPot 30000') } })), 'GATE'],
    // the rest of the rule
    ['clean', verdict(mk()), 'CARRIED'],
    ['9 lost 1 saved, look 2 clears it (10 lost, 8 saved of 3,000)', verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } }, [['bridge 4', { lost: 10, saved: 8 }]])), 'CARRIED'],
    ['9 lost 1 saved, look 2 still open (15 lost, 5 saved of 3,000)', verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } }, [['bridge 4', { lost: 15, saved: 5 }]])), 'CARRIED, 1 inconclusive'],
    ['30 lost 2 saved at look 1', verdict(mk({ 'bridge 4': { lost: 30, saved: 2 } })), 'FALSIFIED'],
    ['Holm: 35 lost 17 saved of 3,000 at look 2 (p 0.009 alone, 0.21 across the 24)', verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } }, [['bridge 4', { lost: 35, saved: 17 }]])), 'CARRIED, 1 inconclusive'],
    ['harm needs the margin: 16 lost 2 saved of 3,000 (Holm 0.016, a loss of 0.47 against 0.5)', verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } }, [['bridge 4', { lost: 16, saved: 2 }]])), 'CARRIED, 1 inconclusive'],
    ['the pool holds the class cases only (21 of the 24 here)', String(decide(mk()).pool.k), '21'],
    ["look 2's rate: 30 lost 10 saved of 3,000 (Holm 0.027, harm at 0.045)", verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } }, [['bridge 4', { lost: 30, saved: 10 }]])), 'FALSIFIED'],
    ['the 0.25 margin where off simulates 95% or more: 3 lost 0 saved of 1,000 at off 97% goes to look 2', look1(mk({ 'bridge 1': { lost: 3, sim: 97 } }).main).find(x => x.id === 'bridge 1').res.outcome, 'inconclusive'],
    ["look 1's rate: 15 lost 2 saved of 1,000 (Holm 0.028) goes to look 2", look1(mk({ 'bridge 4': { lost: 15, saved: 2 } }).main).find(x => x.id === 'bridge 4').res.outcome, 'inconclusive'],
    ['a pooled loss (twelve class cases lose 4 each, each no material harm alone)', verdict(mk(Object.fromEntries(['S126', 'bridge 1', 'bridge 4', 'S120', 'S122', 'S124', 'S128', 'S130', 'wealth x0.5', 'wealth x2', 'share 0.90', 'S162'].map(id => [id, { lost: 4 }])))), 'FALSIFIED'],
    ['a time ratio of 1.25', verdict({ ...mk(), time: { S126: 1.1, 'bridge 6': 1.1, S366: 1.25 } }), 'FALSIFIED'],
    ['an in-class misread of 12', verdict(mk({ S124: { gap: 12 } })), 'FALSIFIED'],
    ['S130 misread by 12', verdict(mk({ S130: { gap: 12 } })), 'FALSIFIED'],
    ['the cost case misread by 12', verdict(mk({ 'bridge 4+cost': { gap: 12 } })), 'FALSIFIED'],
    ['bridge 6 misread by 16', verdict(mk({ 'bridge 6': { gap: 16 } })), 'FALSIFIED'],
    ['harm on a control', verdict({ ...mk(), controls: parse(['S194', 'S252', 'S330'].map(id => two(id, { sim: 99, cls: false, lost: id === 'S252' ? 30 : 0 })).join('\n')) }), 'FALSIFIED'],
    // the gate and completeness
    ['final year averaged', verdict(mk({ S126: { ranR: ran('reader').replace('finalIntegral true', 'finalIntegral false') } })), 'GATE'],
    ['the fold', verdict(mk({ S126: { ranR: ran('reader').replace('mix 3', 'mix 0') } })), 'GATE'],
    ['wrong bridge read', verdict(mk({ S126: { ranR: ran('2') } })), 'GATE'],
    ['the paths that chose the reader (seed 7002)', verdict(mk({ S126: { ranR: ran('reader').replace('seed 7011', 'seed 7002') } })), 'GATE'],
    ['every arm of a case on seed 7002', verdict(mk({ S126: w1('S126').replaceAll('seed 7011', 'seed 7002') })), 'GATE'],
    ['every arm of a case with the final year averaged', verdict(mk({ S126: w1('S126').replaceAll('finalIntegral true', 'finalIntegral false') })), 'GATE'],
    ['every arm of a case in the fold', verdict(mk({ S126: w1('S126').replaceAll('mix 3', 'mix 0') })), 'GATE'],
    ["S360's 15-point arm ran at 5 points", verdict({ ...mk(), s360: parse([`${'S360'.padEnd(16)} a0 0.85 B 8 class no  | ${cell('READER', 40)} | ${cell('READER@15', 40)}`, pad(`ran READER: ${ran('reader')}`), pad(`ran READER@15: ${ran('reader')}`)].join('\n')) }), 'GATE'],
    ['3,000 paths at look 1', verdict(mk({ S126: { ranR: ran('reader').replace('paths 1000', 'paths 3000') } })), 'GATE'],
    ['1,000 paths in the look-2 file', verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } }, [['bridge 4', { lost: 10, saved: 8, paths: 1000 }]])), 'GATE'],
    ['the controls missing', verdict({ ...mk(), controls: [] }), 'INCOMPLETE'],
    ['S360 at 15 points missing', verdict({ ...mk(), s360: [] }), 'INCOMPLETE'],
    ['the timing missing', verdict({ ...mk(), time: {} }), 'INCOMPLETE'],
    ['a pairs line missing', verdict(mk({ S126: w1('S126').split('\n').slice(0, 5).join('\n') })), 'INCOMPLETE'],
    ['look 1 left a case open, no look-2 file', verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } }, null)), 'INCOMPLETE'],
    ['look 1 left a case open, the look-2 file holds none', verdict(mk({ 'bridge 4': { lost: 9, saved: 1 } })), 'INCOMPLETE'],
  ];
  // the stamp gate
  const st = (code = 'c1', audit = 'a1', pred = PRED, sha = 'b1') => `stamp: code ${code} audit ${audit} prediction ${pred} sha ${sha}\nx`;
  const sg = (texts, b = 'b1') => (checkLogStamps(texts, PRED, { blob: () => b }).length ? 'REFUSED' : 'PASSED');
  cases.push(
    ['stamps: every log launched under the prediction, one code', sg({ p0: st(), p1: st(), look2: `${st()}\n${st()}` }), 'PASSED'],
    ['stamps: a log made by other code', sg({ p0: st(), p1: st('c2') }), 'REFUSED'],
    ['stamps: a log made by another version of audit-s126.mjs', sg({ p0: st(), p1: st('c1', 'a2') }), 'REFUSED'],
    ['stamps: the prediction edited after launch', sg({ p0: st(), p1: st() }, 'b2'), 'REFUSED'],
    ['stamps: a log launched outside the launcher, said so', String(checkLogStamps({ p0: st(), p1: st('c1', 'a1', 'NOT-LAUNCHED', '-') }, PRED, { blob: () => 'b1' }).some(e => /outside run-from-snapshot\.sh/.test(e))), 'true'],
    ['stamps: a log launched as a measurement', sg({ p0: st(), p1: st('c1', 'a1', 'none', '-') }), 'REFUSED'],
    ['stamps: a log with no stamp', sg({ p0: st(), p1: 'S126 | OFF table 1' }), 'REFUSED']);
  const wrong = cases.filter(([, got, w]) => got !== w);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  if (process.argv.includes('--planted')) { console.log(`planted (${cases.length}): ${cases.map(([n, got]) => `${n} -> ${got}`).join('; ')}`); process.exit(0); }
}

// the real logs
const read = f => (existsSync(join(DIR, f)) ? readFileSync(join(DIR, f), 'utf8') : null);
const parts = ['part0.txt', 'part1.txt', 'part2.txt', 'part3.txt'].map(read);
if (parts.some(p => p === null)) { console.log(`INCOMPLETE - missing wave-1 logs in ${DIR}`); process.exit(1); }
const main = parts.flatMap(parse);
requireFairLogs(Object.fromEntries(parts.map((t, k) => [`part${k}.txt`, t])), PRED);
if (process.argv.includes('--look1')) {
  const g = gate(main, 16), short = main.length !== WAVE1 || main.some(c => labels(c) !== 'OFF,V1,V2,READER');
  if (short || g.length) { console.log(`INCOMPLETE - wave 1 is not ready for look 1 (${main.length} cases${g.length ? `; ${g.length} gate problems: ${g.join('; ')}` : ''})`); process.exit(1); }
  const open = openAfter1(main);
  console.log(open.length ? open.join(',') : 'none');
  process.exit(0);
}
const controls = parse(read('controls.txt') || ''), s360 = parse(read('s360-quad.txt') || ''), p30 = parse(read('p30.txt') || '');
const l2 = read('look2.txt'), look2 = l2 === null ? null : parse(l2);
const time = {}; for (const l of (read('time30.txt') || '').split('\n')) { const m = /^(.+): median [\d.]+ s off, [\d.]+ s with the reader -> ratio ([\d.]+)$/.exec(l); if (m) time[m[1]] = +m[2]; }
const set = { main, controls, s360, p30, time, look2 };
const short = complete(set);
if (short.length) { console.log(`INCOMPLETE - nothing is scored:\n  ${short.join('\n  ')}`); process.exit(1); }
const logs = { 'controls.txt': read('controls.txt'), 's360-quad.txt': read('s360-quad.txt'), 'p30.txt': read('p30.txt'), 'time30.txt': read('time30.txt') };
if (look2.length) logs['look2.txt'] = l2;
requireFairLogs({ ...Object.fromEntries(parts.map((t, k) => [`part${k}.txt`, t])), ...logs }, PRED);
const bad = [...gate(main, 16), ...gate(controls, 16), ...gate(s360, 16), ...gate(p30, 30), ...gate(look2, 16, 3000)];
if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`FAIR-TEST GATE: passed - ${main.length + controls.length + s360.length + p30.length + look2.length} case logs, each case's arms the same but the bridge read (and the return points for an @15 arm), at the registered settings and path counts\n`);
report(set);
