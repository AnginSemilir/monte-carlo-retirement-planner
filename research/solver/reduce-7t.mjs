/*
 * 7t'S REDUCER (PLAN.md 7t; predictions/diag-7t.md): do the mixture's tables overrate the riskier tier because each world
 * plans as if it knew its world? Reads batch-7t.sh's logs (results/diag7t/part*.txt, audit-s126.mjs's diag7t mode) and
 * the traces beside them.
 *
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs (one code version, launched under predictions/diag-7t.md at the blob each
 * log carries). THE RUN GATE: every registered case once, its arms exactly as registered (OFF, READER, OFF+J, READER+J;
 * S194 OFF and OFF+J); every arm a ran line, the lines equal once the bridge read is taken out, each naming the registered
 * settings (mix 3, 16 points, seed 7002, 8,000 paths, lambda 0.0223606797749979, raiseSurv true, failShort floor,
 * tiersAbove 1, finalIntegral true, quad 5) and its label's bridge read; a joint line per arm saying jointWorlds exactly
 * when the label carries +J, the switch margin 0.001 and a pension death charge of 0; a margin-0 run per arm; every pair
 * of the runs; three world lines per arm at 2,000 paths; every run's trace with the log's count, seed, arm and stamp.
 * COMPLETENESS: all five cases, or INCOMPLETE.
 * THE REPRODUCTION CHECK (item 1): OFF and READER on S126 and bridge 4 are 7r's arms, and the first 3,000 of the 8,000
 * paths are 7r's (pathsForSeed builds path i from the seed and i alone), so the tables (which do not depend on the paths)
 * and the prefix line's survival and the reader's lost paths must be 7r's; if not, the outcome reads NOT SETTLED.
 *
 * THE RULE (the regimen's; 7s's rule, reduce-7s.mjs decide(), copied here with the path count 8,000 and its planted checks
 * and planted faults of its own), on S126 and bridge 4, paired on the same 8,000 paths: g, the reader with one policy for every world against the reader as the product solves
 * it (READER+J against READER): a gain (Holm over the two, exact) or no material gain (the exact 95% interval's upper end
 * below +0.25); h, READER+J against OFF+J: a harm (Holm, exact, the point loss at the margin) or no material harm (lower
 * end above -0.25). A case CURES when g gains and h shows no material harm; does NOT CURE when g does not gain, shows no
 * material gain, and h harms; otherwise PARTIAL. HELD: both cure. FALSIFIED: both do not cure. INCONCLUSIVE otherwise.
 *
 * Reported and scored as items (the prediction words them): the bad world's table against what the policy realises there;
 * the margin at 0; the reader's gains on S360 and share 0.95 with one policy; S194's tier-above family; the realised
 * whole score (survival, the capped estate at 0.02 of opening wealth, the dislike of cuts, the raise credit), per path
 * against a reference run, from the traces, as read-7r-failures.mjs computes it.
 *   node research/solver/reduce-7t.mjs [dir]     the verdict
 *   node research/solver/reduce-7t.mjs --planted  the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { mcnemarHarmP, holm, survivalChange } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7t.md';
export const N = 8000, WP = 2000, P0 = 3000, ALPHA = 0.05, MARGIN = 0.25;
const LAMBDA = '0.0223606797749979', SEED = '7002', PTS = '16', SWITCH_MARGIN = '0.001';
export const PANEL = { 'S126': ['OFF', 'READER', 'OFF+J', 'READER+J'], 'bridge 4': ['OFF', 'READER', 'OFF+J', 'READER+J'], 'S360': ['OFF', 'READER', 'OFF+J', 'READER+J'], 'share 0.95': ['OFF', 'READER', 'OFF+J', 'READER+J'], 'S194': ['OFF', 'OFF+J'] };
export const HARMED = ['S126', 'bridge 4'], GAINED = ['S360', 'share 0.95'];
const BR = { OFF: 'false', READER: 'reader' };
export const NODES = [-Math.sqrt(3), 0, Math.sqrt(3)];
// 7r's figures for OFF and READER (results/diag7r/part0.txt and part1.txt): table, sim; the reader's saved/lost against off
export const REPRO = { S126: { OFF: [55.8, 99.8], READER: [99.6, 99.3], saved: 0, lost: 15 }, 'bridge 4': { OFF: [7.8, 99.4], READER: [99.1, 99.0], saved: 0, lost: 12 } };
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const CELL = /(\S+) table\s+(-?[\d.]+|-) sim\s+(-?[\d.]+) gap\s+(-?[\d.]+|-) tier-below\s+(-?[\d.]+) below\s+(-?[\d.]+) (\d+) s/;
const M0CELL = /(\S+) sim\s+(-?[\d.]+) tier-below\s+(-?[\d.]+) below\s+(-?[\d.]+) (\d+) s/;
const WORLD = /^\s+world (\S+) (\d) z (-?[\d.]+): table (-?[\d.]+) sim (-?[\d.]+) estate table (-?\d+) sim (-?\d+) tier-below (-?[\d.]+) paths (\d+)$/;
const JOINTL = /^\s+joint (\S+): (true|false) switchMargin (\S+) scale (\d+) cap (\d+) deathTax (\S+)$/;

// one log's cases: { id, arms: [{ label, table, sim, gap, tier, below, secs }], m0: {label: {...}}, ran, joint, pairs, worlds }
export function parse(text) {
  const cases = []; let cur = null;
  for (const line of text.split('\n')) {
    if (cur) {
      let m;
      if ((m = /^\s+ran (\S+): (.*)$/.exec(line))) { cur.ran[m[1]] = m[2]; continue; }
      if ((m = JOINTL.exec(line))) { cur.joint[m[1]] = { joint: m[2] === 'true', margin: m[3], scale: +m[4], cap: +m[5], deathTax: +m[6] }; continue; }
      if ((m = /^\s+pairs (.*)$/.exec(line))) { for (const x of m[1].matchAll(/(\S+)-(\S+) (\d+)\/(\d+)/g)) cur.pairs[`${x[1]}-${x[2]}`] = { saved: +x[3], lost: +x[4] }; continue; }
      if ((m = WORLD.exec(line))) { (cur.worlds[m[1]] = cur.worlds[m[1]] || [])[+m[2]] = { z: +m[3], table: +m[4], sim: +m[5], estTable: +m[6], estSim: +m[7], tier: +m[8], paths: +m[9] }; continue; }
      if ((m = /^\s+prefix (\d+) \| (.*)$/.exec(line))) { cur.prefix = { n: +m[1], sims: {}, pair: null }; for (const p of m[2].split(' | ')) { let x; if ((x = /^(\S+) sim (-?[\d.]+)$/.exec(p))) cur.prefix.sims[x[1]] = +x[2]; else if ((x = /^READER-OFF (\d+)\/(\d+)$/.exec(p))) cur.prefix.pair = { saved: +x[1], lost: +x[2] }; } continue; }
      if (/^\s+margin0 \| /.test(line)) { for (const p of line.split(' | ').slice(1)) { const x = M0CELL.exec(p); if (x) cur.m0[x[1]] = { sim: +x[2], tier: +x[3], below: +x[4], secs: +x[5] }; } continue; }
    }
    if (!/ \| \S+ table /.test(line)) continue;
    const parts = line.split(' | ');
    cur = { id: parts[0].slice(0, 16).trim(), arms: [], m0: {}, ran: {}, joint: {}, pairs: {}, worlds: {}, prefix: null };
    for (const p of parts.slice(1)) { const x = CELL.exec(p); if (x) cur.arms.push({ label: x[1], table: +x[2], sim: +x[3], gap: +x[4], tier: +x[5], below: +x[6], secs: +x[7] }); }
    cases.push(cur);
  }
  return cases;
}
const runsOf = id => PANEL[id].flatMap(l => [l, `${l}/M0`]);
export function gate(cases) {
  const bad = [];
  for (const id of Object.keys(PANEL)) { const k = cases.filter(c => c.id === id).length; if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }
  for (const c of cases) {
    const want = PANEL[c.id];
    if (!want) { bad.push(`${c.id}: not a registered case`); continue; }
    if (c.arms.map(a => a.label).join(',') !== want.join(',')) { bad.push(`${c.id}: arms ${c.arms.map(a => a.label).join(',')}, not ${want.join(',')}`); continue; }
    const strip = s => s.replace(/ bridgeRead \S+/, '');
    for (const l of want) {
      const ran = c.ran[l];
      if (!ran) { bad.push(`${c.id}: no ran line for ${l}`); continue; }
      if (strip(ran) !== strip(c.ran[want[0]] || '')) bad.push(`${c.id}: ${l} differs beyond the bridge read ("${ran}")`);
      const w = { mix: '3', pts: PTS, seed: SEED, paths: String(N), grid: `total${PTS}x6x6`, lambda: LAMBDA, raiseSurv: 'true', failShort: 'floor', tiersAbove: '1', finalIntegral: 'true', quad: '5' };
      for (const [k, v] of Object.entries(w)) if (field(ran, k) !== v) bad.push(`${c.id}: ${l} ${k} is ${field(ran, k)}, the prediction names ${v}`);
      if (field(ran, 'bridgeRead') !== BR[l.replace('+J', '')]) bad.push(`${c.id}: ${l} ran bridgeRead ${field(ran, 'bridgeRead')}`);
      const j = c.joint[l];
      if (!j) bad.push(`${c.id}: no joint line for ${l}`);
      else {
        if (j.joint !== l.endsWith('+J')) bad.push(`${c.id}: ${l} ran jointWorlds ${j.joint}`);
        if (j.margin !== SWITCH_MARGIN) bad.push(`${c.id}: ${l} solved with switch margin ${j.margin}`);
        if (j.deathTax !== 0) bad.push(`${c.id}: ${l} has a pension death charge ${j.deathTax}; the estate needs the pension share`);
      }
      if (!c.m0[`${l}/M0`]) bad.push(`${c.id}: no margin-0 run for ${l}`);
      const ws = c.worlds[l] || [];
      // each world by its index: ws.some would skip a missing world's hole
      if (ws.length !== 3 || [0, 1, 2].some(k => !ws[k] || Math.abs(ws[k].z - NODES[k]) > 1e-3 || ws[k].paths !== WP)) bad.push(`${c.id}: ${l} lacks its three world runs at ${WP} paths`);
    }
    if (!c.prefix || c.prefix.n !== P0 || want.some(l => c.prefix.sims[l] === undefined) || (want.includes('READER') && !c.prefix.pair)) bad.push(`${c.id}: no prefix line for the first ${P0} paths`);
    const runs = runsOf(c.id);
    for (let j = 1; j < runs.length; j++) for (let q = 0; q < j; q++) if (!c.pairs[`${runs[j]}-${runs[q]}`]) bad.push(`${c.id}: no pair ${runs[j]}-${runs[q]}`);
  }
  return bad;
}
export function reproduced(c) {
  const R = REPRO[c.id], arm = l => c.arms.find(a => a.label === l), close = (x, y) => Math.abs(x - y) < 0.05, why = [];
  for (const l of ['OFF', 'READER']) { const a = arm(l), sim = c.prefix.sims[l]; if (!close(a.table, R[l][0]) || !close(sim, R[l][1])) why.push(`${l} table ${a.table} sim ${sim} on the first ${P0} paths, 7r ${R[l][0]} / ${R[l][1]}`); }
  const p = c.prefix.pair;
  if (p.saved !== R.saved || p.lost !== R.lost) why.push(`the reader against off ${p.saved} saved, ${p.lost} lost; 7r ${R.saved} / ${R.lost}`);
  return why;
}
// 7s's rule (reduce-7s.mjs decide()) with the path count n: g a gain or no material gain, h a harm or no material harm, a case
// cures, does not cure or is partial; HELD, FALSIFIED or INCONCLUSIVE over the harmed cases
export function decide(rows, n = N) {
  const pGain = holm(rows.map(r => mcnemarHarmP(r.g.saved, r.g.lost)));
  const pHarm = holm(rows.map(r => mcnemarHarmP(r.h.lost, r.h.saved)));
  const reads = rows.map((r, j) => {
    const gi = survivalChange(r.g.lost, r.g.saved, n, ALPHA), hi = survivalChange(r.h.lost, r.h.saved, n, ALPHA);
    const gains = r.g.saved > r.g.lost && pGain[j] < ALPHA, noGain = gi.hi < MARGIN;
    const harms = r.h.lost > r.h.saved && pHarm[j] < ALPHA && -hi.d >= MARGIN, noHarm = hi.lo > -MARGIN;
    const read = gains && noHarm ? 'cures' : !gains && noGain && harms ? 'does not cure' : 'partial';
    return { id: r.id, read, gi, hi, pGain: pGain[j], pHarm: pHarm[j], gains, noGain, harms, noHarm };
  });
  const o = reads.every(x => x.read === 'cures') ? 'HELD' : reads.every(x => x.read === 'does not cure') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { outcome: o, reads };
}
export const rowsOf = cases => HARMED.map(id => { const c = cases.find(x => x.id === id); return { id, g: c.pairs['READER+J-READER'], h: c.pairs['READER+J-OFF+J'] }; });
// the clairvoyance gap: each world's table survival minus what the policy realises in that world (points)
export const gaps = (c, l) => (c.worlds[l] || []).map(w => w.table - w.sim);

// THE REALISED WHOLE SCORE, per path, in points (read-7r-failures.mjs's arithmetic): survival; the capped estate priced at
// WB of opening wealth (a failed path's 0; no death charge, the gate checks); the dislike of cuts, lambda x (1 - level)^2 a
// paid year below target and a failure in life charged every spending year from its year at the floor level; the raise
// credit, MU x sqrt(min(0.2, level - 1)), only on paths that survive
export const WB = 0.02, MU = 0.003;
const b = s => Buffer.from(s, 'base64');
export const decode = j => ({ N: j.N, Y: j.Y, survived: new Uint8Array(b(j.survived)), level: new Uint8Array(b(j.level)), wealth: (x => new Float32Array(x.buffer, x.byteOffset, x.byteLength / 4))(b(j.wealth)), failYear: (x => new Int16Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)))(b(j.failYear)) });
export function scorePaths(T, { lambda, floor, scale, cap, spendYears }) {
  const out = new Float64Array(T.N);
  for (let i = 0; i < T.N; i++) {
    let cut = 0, raise = 0;
    for (let t = 0; t < T.Y; t++) { const l = T.level[i * T.Y + t] / 100; if (l > 0 && l < 1) cut += lambda * (1 - l) ** 2; else if (l > 1) raise += MU * Math.sqrt(Math.min(0.2, l - 1)); }
    if (T.failYear[i] >= 0) for (let t = T.failYear[i]; t < T.Y; t++) if (spendYears[t]) cut += lambda * (1 - floor) ** 2;
    const alive = T.survived[i] === 1, est = alive ? Math.min(T.wealth[i * T.Y + T.Y - 1], cap) : 0;
    out[i] = 100 * ((alive ? 1 : 0) + WB * est / scale - cut + (alive ? raise : 0));
  }
  return out;
}
// a trace agrees with the logs: its count, seed, arm and every field of the stamp
export const traceAgrees = (j, ST, label) => !!(j && ST && j.stamp && j.N === N && String(j.seed) === SEED && j.arm === label && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]));
export const mean = xs => xs.reduce((a, c) => a + c, 0) / xs.length;
export const se = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((a, c) => a + (c - m) ** 2, 0) / (xs.length - 1) / xs.length); };
export const paired = (a, z) => { const d = Array.from(z, (x, i) => x - a[i]); return { d: mean(d), se: se(d) }; };

// the prediction's items 3-8 (1 the reproduction, 2 the outcome): [text, held]
export function items(cases, whole) {
  const C = id => cases.find(x => x.id === id), iv = p => survivalChange(p.lost, p.saved, N, ALPHA);
  const out = [];
  const g3 = HARMED.map(id => ({ id, g: gaps(C(id), 'READER') }));
  out.push([`3. the mixture's bad-world table overrates the reader's policy there by at least 1 point, and by more than its normal world, on both harmed cases: ${g3.map(x => `${x.id} bad ${x.g[0].toFixed(2)}, normal ${x.g[1].toFixed(2)}, good ${x.g[2].toFixed(2)}`).join('; ')}`, g3.every(x => x.g[0] >= 1 && x.g[0] > x.g[1])]);
  const g4 = HARMED.map(id => ({ id, a: gaps(C(id), 'READER')[0], j: gaps(C(id), 'READER+J')[0] }));
  out.push([`4. one policy for every world halves the bad world's overrating at least, on both harmed cases: ${g4.map(x => `${x.id} ${x.a.toFixed(2)} -> ${x.j.toFixed(2)}`).join('; ')}`, g4.every(x => Math.abs(x.j) <= Math.abs(x.a) / 2)]);
  const m5 = HARMED.map(id => { const p = C(id).pairs['READER/M0-READER'], v = iv(p); return { id, p, v }; });
  out.push([`5. the switch margin at 0 changes the reader's survival immaterially (the exact 95% interval inside +/-${MARGIN}), on both harmed cases: ${m5.map(x => `${x.id} ${x.p.saved}/${x.p.lost} (${x.v.lo.toFixed(2)} to ${x.v.hi.toFixed(2)})`).join('; ')}`, m5.every(x => x.v.lo > -MARGIN && x.v.hi < MARGIN)]);
  const g6 = GAINED.map(id => { const p = C(id).pairs['READER+J-OFF+J'], q = C(id).pairs['READER+J-READER']; return { id, p, q, gain: p.saved > p.lost && mcnemarHarmP(p.saved, p.lost) < ALPHA, noHarm: iv(q).lo > -MARGIN }; });
  out.push([`6. the reader keeps its gains with one policy: against off with one policy it gains (exact p below 0.05) and against itself as solved today it loses nothing material, on S360 and share 0.95: ${g6.map(x => `${x.id} ${x.p.saved}/${x.p.lost} against OFF+J, ${x.q.saved}/${x.q.lost} against READER`).join('; ')}`, g6.every(x => x.gain && x.noHarm)]);
  const p7 = C('S194').pairs['OFF+J-OFF'];
  out.push([`7. on S194 (M14b's family) one policy gains survival (exact p for a gain below 0.05): ${p7.saved}/${p7.lost}`, p7.saved > p7.lost && mcnemarHarmP(p7.saved, p7.lost) < ALPHA]);
  const w8 = HARMED.map(id => ({ id, a: whole[id]['READER+J-READER'], b: whole[id]['READER+J-OFF+J'] }));
  out.push([`8. by the realised whole score the reader with one policy is above itself as solved today, and not more than two standard errors below off with one policy, on both harmed cases: ${w8.map(x => `${x.id} ${x.a.d.toFixed(3)} +/- ${x.a.se.toFixed(3)} against READER, ${x.b.d.toFixed(3)} +/- ${x.b.se.toFixed(3)} against OFF+J`).join('; ')}`, w8.every(x => x.a.d > 0 && x.b.d > -2 * x.b.se)]);
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const ranOf = br => `mix 3 pts 16 seed 7002 paths 8000 grid total16x6x6 lambda ${LAMBDA} levels 1,1.1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 1 minPot 29000 quad 5 finalIntegral true bridgeRead ${br}`;
  const cell = (l, t, s) => `${l} table ${t.toFixed(1).padStart(5)} sim ${s.toFixed(1).padStart(5)} gap ${(t - s).toFixed(1).padStart(6)} tier-below  8.7 below  2.7 556 s`;
  const log = (id, { pairs = {}, ran = {}, joint = {}, worlds = {}, repro = REPRO[id] || { OFF: [55.8, 99.8], READER: [99.6, 99.3] }, drop = '', prefix = null } = {}) => {
    const labels = PANEL[id], runs = runsOf(id);
    const L = [`${id.padEnd(16)} a0 0.85 B 2 class YES | ${labels.map(l => cell(l, ...(repro[l] || [99.5, 99.6]))).join(' | ')}`,
      `${''.padEnd(16)} margin0 | ${labels.map(l => `${l}/M0 sim  99.5 tier-below  8.7 below  2.7 250 s`).join(' | ')}`,
      ...labels.map(l => `${''.padEnd(16)} ran ${l}: ${ran[l] || ranOf(BR[l.replace('+J', '')])}`),
      ...labels.map(l => `${''.padEnd(16)} joint ${l}: ${joint[l] !== undefined ? joint[l] : l.endsWith('+J')} switchMargin 0.001 scale 950000 cap 3800000 deathTax 0`)];
    const pr = []; for (let j = 1; j < runs.length; j++) for (let q = 0; q < j; q++) { const k = `${runs[j]}-${runs[q]}`; pr.push(`${k} ${(pairs[k] || [0, 0]).join('/')}`); }
    L.push(`${''.padEnd(16)} pairs ${pr.join(' ')}`);
    const pre = prefix || { OFF: repro.OFF[1], READER: repro.READER[1], pair: [0, (REPRO[id] || { lost: 15 }).lost] };
    L.push(`${''.padEnd(16)} prefix ${P0} | ${labels.map(l => `${l} sim ${(pre[l] !== undefined ? pre[l] : 99.5).toFixed(2)}`).join(' | ')}${labels.includes('READER') ? ` | READER-OFF ${pre.pair.join('/')}` : ''}`);
    for (const l of labels) NODES.forEach((z, k) => { const w = (worlds[l] || [])[k] || [95, 95]; L.push(`${''.padEnd(16)} world ${l} ${k} z ${z.toFixed(4)}: table ${w[0].toFixed(2)} sim ${w[1].toFixed(2)} estate table 900000 sim 880000 tier-below 8.7 paths 2000`); });
    return L.filter(x => !drop || !x.includes(drop)).join('\n');
  };
  const good = { S126: { 'READER-OFF': [0, 40], 'READER+J-READER': [38, 0], 'READER+J-OFF+J': [0, 1] }, 'bridge 4': { 'READER-OFF': [0, 32], 'READER+J-READER': [30, 1], 'READER+J-OFF+J': [1, 1] } };
  const all5 = (over = {}) => Object.keys(PANEL).map(id => log(id, { pairs: good[id] || {}, ...(over[id] || {}) })).join('\n');
  const c0 = parse(all5());
  const row = (id, g, h) => ({ id, g: { saved: g[0], lost: g[1] }, h: { saved: h[0], lost: h[1] } });
  const cases = [
    ['a log parsed: five cases; S126 four arms, a margin-0 run each, three worlds each, a pair read as saved/lost, the prefix line', `${c0.length} ${c0[0].arms.length} ${Object.keys(c0[0].m0).length} ${c0[0].worlds.READER.length} ${c0[0].pairs['READER+J-READER'].saved}/${c0[0].pairs['READER+J-READER'].lost} ${c0[0].prefix.n} ${c0[0].prefix.sims.READER} ${c0[0].prefix.pair.saved}/${c0[0].prefix.pair.lost}`, '5 4 4 3 38/0 3000 99.3 0/15'],
    ['the gate refuses a missing prefix line', String(gate(parse(all5().replace(/\n\s+prefix 3000 \|[^\n]*/, ''))).length > 0), 'true'],
    ['the gate passes a log at the registered settings', String(gate(c0).length), '0'],
    ['the gate refuses a second setting changed between arms', String(gate(parse(all5({ S126: { ran: { 'READER+J': ranOf('reader').replace('minPot 29000', 'minPot 30000') } } }))).length > 0), 'true'],
    ['the gate refuses the wrong seed', String(gate(parse(all5({ S126: { ran: Object.fromEntries(PANEL.S126.map(l => [l, ranOf(BR[l.replace('+J', '')]).replace('seed 7002', 'seed 7004')])) } }))).length > 0), 'true'],
    ['the gate refuses an arm whose joint line does not match its label', String(gate(parse(all5({ S126: { joint: { 'READER+J': false } } }))).length > 0), 'true'],
    ['the gate refuses a missing margin-0 run', String(gate(parse(all5({ S126: { drop: 'READER+J/M0 sim' } }).replace(/ \| READER\+J\/M0 sim[^|\n]*/, ''))).length > 0), 'true'],
    ['the gate refuses a missing world line', String(gate(parse(all5({ S126: { drop: 'world READER 0 ' } }))).length > 0), 'true'],
    ['the gate refuses a missing case', String(gate(parse(Object.keys(PANEL).filter(id => id !== 'S194').map(id => log(id, { pairs: good[id] || {} })).join('\n'))).length > 0), 'true'],
    ['the reproduction check passes 7r\'s figures on the first 3,000 paths and refuses others (14 lost; the reader\'s survival 99.2)', `${reproduced(c0[0]).length} ${reproduced(parse(log('S126', { pairs: good.S126, prefix: { OFF: 99.8, READER: 99.3, pair: [0, 14] } }))[0]).length} ${reproduced(parse(log('S126', { pairs: good.S126, prefix: { OFF: 99.8, READER: 99.2, pair: [0, 15] } }))[0]).length}`, '0 1 1'],
    ['the rule reads a cure on both harmed cases as HELD, and g and h are the joint reader against the reader and against joint off', `${decide(rowsOf(c0)).outcome} ${rowsOf(c0).map(r => `${r.g.saved}/${r.g.lost} ${r.h.saved}/${r.h.lost}`).join(',')}`, 'HELD 38/0 0/1,30/1 1/1'],
    ['the rule reads no cure on both as FALSIFIED (one policy changes 1 or 2 paths; 40 and 32 still lost against off with one policy)', decide([row('S126', [1, 1], [0, 40]), row('bridge 4', [2, 0], [0, 32])]).outcome, 'FALSIFIED'],
    ['a cure on one case only: INCONCLUSIVE', decide([row('S126', [38, 0], [0, 1]), row('bridge 4', [1, 1], [0, 32])]).outcome, 'INCONCLUSIVE'],
    ['half a cure (20 saved, none lost: significant, the interval not below the margin; 20 still lost): partial on each, INCONCLUSIVE', decide([row('S126', [20, 0], [0, 20]), row('bridge 4', [20, 0], [0, 20])]).reads.map(x => x.read).join(',') + ' ' + decide([row('S126', [20, 0], [0, 20]), row('bridge 4', [20, 0], [0, 20])]).outcome, 'partial,partial INCONCLUSIVE'],
    ['a significant gain below the margin with the harm still there is partial, not "does not cure" (15 saved, none lost: Holm p tiny, upper end 0.19; 21 still lost)', decide([row('S126', [15, 0], [0, 21]), row('bridge 4', [15, 0], [0, 21])]).reads.map(x => x.read).join(','), 'partial,partial'],
    ['a gain needs Holm: 6 saved, 0 lost on each (Holm 0.031) gains; 5 and 0 (Holm 0.062) does not', `${decide([row('S126', [6, 0], [0, 0]), row('bridge 4', [6, 0], [0, 0])]).reads.map(x => x.gains).join(',')} ${decide([row('S126', [5, 0], [0, 0]), row('bridge 4', [5, 0], [0, 0])]).reads.map(x => x.gains).join(',')}`, 'true,true false,false'],
    ['no material gain needs the interval\'s upper end below the margin: 30 saved, 20 lost (not significant, upper end 0.30) is not', String(decide([row('S126', [30, 20], [0, 0]), row('bridge 4', [0, 0], [0, 0])]).reads[0].noGain), 'false'],
    ['harm needs Holm: 70 lost, 48 saved on each (raw p 0.026, Holm 0.053; a loss of 0.275, past the margin) does not harm', decide([row('S126', [0, 0], [48, 70]), row('bridge 4', [0, 0], [48, 70])]).reads.map(x => x.harms).join(','), 'false,false'],
    ['harm needs the point loss at the margin: 19 lost, 0 saved (0.2375 points) does not harm; 21 does', `${decide([row('S126', [0, 0], [0, 19]), row('bridge 4', [0, 0], [0, 19])]).reads[0].harms} ${decide([row('S126', [0, 0], [0, 21]), row('bridge 4', [0, 0], [0, 21])]).reads[0].harms}`, 'false true'],
    ['the clairvoyance gap: world table minus world realised, per world', gaps(parse(log('S126', { pairs: good.S126, worlds: { READER: [[97, 93.5], [99.8, 99.6], [100, 100]] } }))[0], 'READER').map(x => x.toFixed(1)).join(','), '3.5,0.2,0.0'],
    ['the whole score of a path: survival, capped estate at 0.02, a cut, a raise on a survivor; a failed path in life (which raised before it failed: no credit) charged its remaining years at the floor', (() => {
      const T = { N: 2, Y: 3, survived: Uint8Array.from([1, 0]), level: Uint8Array.from([90, 110, 100, 110, 0, 0]), wealth: Float32Array.from([1, 1, 500000, 1, 1, 0]), failYear: Int16Array.from([-1, 1]) };
      const s = scorePaths(T, { lambda: 0.1, floor: 0.8, scale: 100000, cap: 400000, spendYears: [true, true, true] });
      return `${s[0].toFixed(4)} ${s[1].toFixed(4)}`; })(), `${(100 * (1 + 0.02 * 4 - 0.1 * 0.01 + 0.003 * Math.sqrt(0.1))).toFixed(4)} ${(100 * (0 - 2 * 0.1 * 0.04)).toFixed(4)}`],
    ['paired: the mean of the differences and its standard error', (() => { const p = paired(Float64Array.from([1, 2, 3, 4]), Float64Array.from([2, 2, 5, 4])); return `${p.d.toFixed(3)} ${p.se.toFixed(3)}`; })(), '0.750 0.479'],
  ];
  // items on the planted log, with a whole score that holds item 8
  const whole = Object.fromEntries(HARMED.map(id => [id, { 'READER+J-READER': { d: 0.2, se: 0.05 }, 'READER+J-OFF+J': { d: -0.05, se: 0.1 } }]));
  const it = items(parse(Object.keys(PANEL).map(id => log(id, { pairs: { ...(good[id] || {}), ...(GAINED.includes(id) ? { 'READER+J-OFF+J': [100, 0] } : {}), ...(id === 'S194' ? { 'OFF+J-OFF': [9, 0] } : {}) }, worlds: { READER: [[97, 93.5], [99.8, 99.6], [100, 100]], 'READER+J': [[95, 94.5], [99.7, 99.6], [100, 100]] } })).join('\n')), whole);
  cases.push(['items 3-8 on a planted log where each holds', it.map(x => x[1]).join(','), 'true,true,true,true,true,true']);
  const it2 = items(parse(Object.keys(PANEL).map(id => log(id, { pairs: { ...(good[id] || {}), 'READER/M0-READER': [0, 25], ...(GAINED.includes(id) ? { 'READER+J-OFF+J': [100, 0], 'READER+J-READER': [0, 25] } : {}), ...(id === 'S194' ? { 'OFF+J-OFF': [0, 9] } : {}) }, worlds: { READER: [[99.5, 99.0], [99.8, 99.6], [100, 100]], 'READER+J': [[99.4, 99.0], [99.7, 99.6], [100, 100]] } })).join('\n')),
    Object.fromEntries(HARMED.map(id => [id, { 'READER+J-READER': { d: -0.1, se: 0.05 }, 'READER+J-OFF+J': { d: -0.5, se: 0.1 } }])));
  cases.push(['items 3-8 on a planted log where each misses (gap 0.5; 0.4 not halved; margin 0 loses 25; the gain cases lose 25 to themselves; S194 loses; the whole score below)', it2.map(x => x[1]).join(','), 'false,false,false,false,false,false']);
  const it3 = items(parse(Object.keys(PANEL).map(id => log(id, { pairs: { ...(good[id] || {}), 'READER/M0-READER': [25, 0], ...(GAINED.includes(id) ? { 'READER+J-OFF+J': [100, 0] } : {}), ...(id === 'S194' ? { 'OFF+J-OFF': [3, 1] } : {}) }, worlds: { READER: [[97, 95.5], [99, 97], [100, 100]], 'READER+J': [[93, 95], [99.7, 99.6], [100, 100]] } })).join('\n')),
    Object.fromEntries(HARMED.map(id => [id, { 'READER+J-READER': { d: 0.2, se: 0.05 }, 'READER+J-OFF+J': { d: -0.5, se: 0.1 } }])));
  cases.push(['items 3-8 missing other ways (the normal world overrated more than the bad; the joint gap -2.0 not half of 1.5; margin 0 gains 25; S194 3/1 not significant; 0.5 below off with one policy at 0.1 se)', it3.map(x => x[1]).join(','), 'false,false,false,true,false,false']);
  { const ST = { code: 'a', audit: 'b', prediction: 'c', sha: 'd' }, j = { N, seed: 7002, arm: 'READER+J', stamp: { ...ST } };
    cases.push(['a trace agrees only with the logs\' count, seed, arm and every stamp field', [traceAgrees(j, ST, 'READER+J'), traceAgrees({ ...j, seed: 7004 }, ST, 'READER+J'), traceAgrees(j, ST, 'READER'), traceAgrees({ ...j, stamp: { ...ST, sha: 'e' } }, ST, 'READER+J'), traceAgrees({ ...j, N: 20 }, ST, 'READER+J')].join(','), 'true,false,false,false,false']); }
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}

const main = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (main) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should`); process.exit(0); }
  const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7t');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^part\d+\.txt$/.test(f)).sort() : [];
  if (files.length !== 5) { console.log(`INCOMPLETE - ${files.length} of 5 logs in ${DIR}`); process.exit(1); }
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  requireFairLogs(logs, PRED);
  const cases = Object.values(logs).flatMap(parse);
  const bad = gate(cases);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const traces = {};
  const load = (id, label) => {
    const f = join(DIR, `${id.replace(/ /g, '_')}-${label.toLowerCase().replace('+j', '_j').replace('/m0', '_m0')}.json.gz`);
    if (!existsSync(f)) { bad.push(`no trace ${f}`); return null; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, label)) bad.push(`${f}: count, seed, arm or stamp is not the logs'`);
    return decode(j);
  };
  if (!bad.length) for (const c of cases) for (const l of runsOf(c.id)) traces[`${c.id}|${l}`] = load(c.id, l);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  // the realised whole score per run, paired against the comparisons the items read
  const whole = {};
  for (const c of cases) {
    const ran = c.ran[PANEL[c.id][0]], j = c.joint[PANEL[c.id][0]];
    const cfg = { lambda: Number(field(ran, 'lambda')), floor: Math.min(...field(ran, 'levels').split(',').map(Number)), scale: j.scale, cap: j.cap };
    const ref = traces[`${c.id}|${PANEL[c.id][0]}`];
    cfg.spendYears = Array.from({ length: ref.Y }, (_, t) => { for (let i = 0; i < ref.N; i++) if (ref.level[i * ref.Y + t] > 0) return true; return false; });
    const sc = Object.fromEntries(runsOf(c.id).map(l => [l, scorePaths(traces[`${c.id}|${l}`], cfg)]));
    whole[c.id] = {};
    const cmp = c.id === 'S194' ? [['OFF+J', 'OFF'], ['OFF/M0', 'OFF'], ['OFF+J/M0', 'OFF']] : [['READER', 'OFF'], ['READER+J', 'READER'], ['READER+J', 'OFF+J'], ['READER+J', 'OFF'], ['OFF+J', 'OFF'], ['READER/M0', 'READER'], ['READER+J/M0', 'OFF']];
    for (const [a, z] of cmp) whole[c.id][`${a}-${z}`] = paired(sc[z], sc[a]);
  }
  const f1 = x => x.toFixed(1), iv = x => `${x.d >= 0 ? '+' : ''}${x.d.toFixed(2)} (${x.lo.toFixed(2)} to ${x.hi.toFixed(2)})`;
  console.log(`7t: DO THE MIXTURE'S TABLES OVERRATE THE RISKIER TIER BECAUSE EACH WORLD PLANS AS IF IT KNEW ITS WORLD? Read against ${PRED}\n`);
  console.log(`FAIR-TEST GATE: passed - the stamps; on all five cases the arms ran the same settings but the bridge read, the joint lines match the labels, every margin-0 run, pair, world run and trace is there (seed ${SEED}, ${N} paths, ${WP} a world, ${PTS} points)\n`);
  console.log('case        run           table    sim    gap  tier-below  below   secs');
  for (const id of Object.keys(PANEL)) { const c = cases.find(x => x.id === id); for (const a of c.arms) { const m0 = c.m0[`${a.label}/M0`]; console.log(`${id.padEnd(11)} ${a.label.padEnd(12)} ${f1(a.table).padStart(6)} ${f1(a.sim).padStart(6)} ${f1(a.gap).padStart(6)} ${f1(a.tier).padStart(11)} ${f1(a.below).padStart(6)} ${String(a.secs).padStart(6)}`); console.log(`${''.padEnd(11)} ${(a.label + '/M0').padEnd(12)} ${''.padStart(6)} ${f1(m0.sim).padStart(6)} ${''.padStart(6)} ${f1(m0.tier).padStart(11)} ${f1(m0.below).padStart(6)} ${String(m0.secs).padStart(6)}`); } }
  console.log('\nIN EACH WORLD (2,000 paths a world, each path\'s persistent shift at the world\'s node): the world\'s own table against what the policy realises there');
  for (const id of Object.keys(PANEL)) { const c = cases.find(x => x.id === id); for (const l of PANEL[id]) console.log(`  ${id.padEnd(10)} ${l.padEnd(9)} ${c.worlds[l].map((w, k) => `${['bad', 'normal', 'good'][k]}: table ${w.table.toFixed(2)} sim ${w.sim.toFixed(2)} (gap ${(w.table - w.sim).toFixed(2)}), estate ${Math.round(w.estTable / 1000)}k / ${Math.round(w.estSim / 1000)}k, tier-below ${w.tier.toFixed(1)}`).join('; ')}`); }
  console.log('\nPAIRED on the same paths (saved/lost), the survival change in points with its exact 95% interval:');
  const show = { default: ['READER-OFF', 'READER+J-READER', 'READER+J-OFF+J', 'READER+J-OFF', 'OFF+J-OFF', 'READER/M0-READER', 'OFF/M0-OFF', 'READER+J/M0-READER+J', 'READER+J/M0-OFF'], S194: ['OFF+J-OFF', 'OFF/M0-OFF', 'OFF+J/M0-OFF+J', 'OFF+J/M0-OFF'] };
  for (const id of Object.keys(PANEL)) { const c = cases.find(x => x.id === id); for (const p of (show[id] || show.default)) { const x = c.pairs[p]; console.log(`  ${id.padEnd(10)} ${p.padEnd(22)} ${x.saved}/${x.lost}  ${iv(survivalChange(x.lost, x.saved, N, ALPHA))}`); } }
  console.log('\nTHE REALISED WHOLE SCORE (survival, the capped estate at 0.02, the dislike of cuts, the raise credit), per path, points, paired:');
  for (const id of Object.keys(PANEL)) for (const [k, v] of Object.entries(whole[id])) console.log(`  ${id.padEnd(10)} ${k.padEnd(22)} ${v.d >= 0 ? '+' : ''}${v.d.toFixed(3)} +/- ${v.se.toFixed(3)}`);
  const why = HARMED.flatMap(id => reproduced(cases.find(x => x.id === id)).map(w => `${id}: ${w}`));
  const d = decide(rowsOf(cases));
  console.log('\nTHE RULE, per harmed case (g: READER+J against READER; h: READER+J against OFF+J; Holm over the two):');
  for (const r of d.reads) console.log(`  ${r.id.padEnd(9)} g ${iv(r.gi)}, p for a gain ${r.pGain.toExponential(1)} (Holm) -> ${r.gains ? 'gains' : r.noGain ? 'no material gain' : 'neither'}; h ${iv(r.hi)}, p for harm ${r.pHarm.toExponential(1)} (Holm) -> ${r.harms ? 'harms' : r.noHarm ? 'no material harm' : 'neither'}; the case ${r.read}`);
  console.log("\nTHE PREDICTION'S ITEMS:");
  console.log(`1. OFF and READER reproduce 7r on S126 and bridge 4 (tables and survival to 0.1, the reader's saved and lost against off): ${why.length ? why.join('; ') : 'both cases'} -> ${why.length ? 'MISSED' : 'held'}`);
  console.log(`2. the outcome is HELD: ${why.length ? 'NOT SETTLED' : d.outcome} -> ${!why.length && d.outcome === 'HELD' ? 'held' : 'MISSED'}`);
  for (const [t, ok] of items(cases, whole)) console.log(`${t} -> ${ok ? 'held' : 'MISSED'}`);
  console.log(`\nOUTCOME: ${why.length ? 'NOT SETTLED (OFF and READER did not reproduce 7r)' : d.outcome}`);
}
