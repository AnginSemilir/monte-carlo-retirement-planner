/*
 * NODE-1's READ (predictions/diag-node1.md; audit-node1.mjs; PLAN.md NODE-1, O152).
 *   node research/solver/reduce-node1.mjs [dir=results/diagnode1] [paths a world=4000] [scale=1] [--preflight] [--planted]
 * THE GATE (before any figure): the two jobs once each and done, every log stamped by one code, audit, prediction and
 *   sha, at the registered settings (paths a world, scale, seed 7002), each job's reference ('order'), nodes (BN the
 *   registered list, BO none), grid (total P x 15 x 6 and total P x 6 x 6), floor and support line in its solve's meta,
 *   armTook and forceIdentity passed, three worlds' tables and runs of the registered paths, every file the log's bits.
 *   In --preflight: also THE ARM'S REACH (O153): BN's own-opening tables must differ from BO's in at least one world, or
 *   the arm cannot reach the mechanism and the run is refused before launch.
 * THE ITEMS (every threshold read on the figure rounded to 1e-9):
 *   1 (O152): per world k in 0 and 1, the table's move D = BN's own-opening table less BO's (exact: both tables), the gap
 *     G = BN's runs less BO's table (points, BN's runs' exact interval at 2 x a1, a1 = ALPHA / 4), the share S = D / G with
 *     its interval from G's (shown only where G's bottom is above 0). HELD (O152-NODE: the nodes carry the gain) when S's
 *     bottom is at least 0.5 in both worlds; FALSIFIED (O152-MODEL: the table stays at the reference) when G's bottom is
 *     above 0 and S's top is at most 0.25 in both; INCONCLUSIVE otherwise. OVER-CORRECTION (read for the cause, never
 *     against it): BN's table less its runs, its bottom above 1 point, in any world (world 2 read too).
 *   2 (control): BO on this code is REF-2's BO (the option off): HELD when its own-opening tables equal REF-2's to the
 *     printed digit in every world and its runs' bits are REF-2's; FALSIFIED when any table differs; INCONCLUSIVE when
 *     the tables agree and some runs' bits do not. REF-2's files are read behind REF-2's own gate.
 * THE CAUSES: O152-NODE held and O152-MODEL not on 1 HELD with 2 HELD; O152-MODEL held and O152-NODE not on 1 FALSIFIED
 *   with 2 HELD; open otherwise (an option not inert off reads nothing).
 * REPORTED: per world D, G, S and both arms' table less runs; the year-0 reads at the initial state (READ, mixed) against
 *   the runs mixed; the paired runs (BN against BO); each solve's seconds.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-node1.md';
export const SEED = '7002', NPW = 4000, ALPHA = 0.05;
export const SHARE_HELD = 0.5, SHARE_FALS = 0.25, OVER = 1;
export const NODES_A = '0,0.2,0.4,0.6,0.7,0.75,0.8,0.825,0.85,0.875,0.9,0.925,0.95,0.975,1';
export const JOBS = [['S360', 'BN', 60, 15], ['S360', 'BO', 60, 6]];
export const jobLabel = ([, arm, pts, sh]) => `${arm}/P${pts}S${sh}Q5`;
export const key = (id, label) => `${id} ${label}`;
export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const a1 = ALPHA / 4;
const CASEL = /^(S360)\s+case \| job ((BN|BO)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^NODE-1: .*, (\d+) paths a world, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts0: Number(c[4]), pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label;
    let m;
    if ((m = new RegExp(`^solve CAND ${esc(L)}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^openings ${esc(L)}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerSplit: 'null', readerBlend: 'null', readerRef: 'order', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3', floor: '5000' };
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], byKey = {};
  for (const j of jobs) { const k = key(j.id, j.label); (byKey[k] = byKey[k] || []).push(j); }
  for (const jb of JOBS) { const k = key(jb[0], jobLabel(jb)), n = (byKey[k] || []).length; if (n !== 1) bad.push(`${k}: ${n ? 'run ' + n + ' times' : 'missing'}`); }
  const st0 = jobs[0] && jobs[0].stamp, FI = Math.min(npw, 1000);
  for (const j of jobs) {
    const k = key(j.id, j.label), reg = JOBS.find(jb => jb[0] === j.id && jobLabel(jb) === j.label);
    if (!reg) { bad.push(`${k}: not a registered job`); continue; }
    const pts = Math.max(4, Math.round(reg[2] / scale));
    if (!j.done) bad.push(`${k}: no done line`);
    if (!j.stamp || !st0 || ['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])) bad.push(`${k}: its stamp is not the other log's`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${k}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${k}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, pts: String(pts), grid: `total${pts}x${reg[3]}x6`, shareNodes: j.arm === 'BN' ? NODES_A : 'none' })) if (field(ran, f) !== v) bad.push(`${k}: ${f} is ${field(ran, f)}, not ${v}`);
    if (!j.checks.armTook || j.checks.armTook[0] !== 1) bad.push(`${k}: armTook did not pass`);
    if (!j.own) bad.push(`${k}: no openings line`);
    if (!j.solve) bad.push(`${k}: no solve line`);
    for (let w = 0; w < 3; w++) {
      if (!j.tables[w] || !Number.isFinite(j.tables[w].OWN) || !Number.isFinite(j.tables[w].READ)) bad.push(`${k}: world ${w}'s tables are missing`);
      const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(`${k}: no OWN run of ${npw} paths at its opening in world ${w}`);
    }
    if (!j.checks.forceIdentity || j.checks.forceIdentity[0] !== FI || j.checks.forceIdentity[1] !== FI) bad.push(`${k}: forceIdentity did not pass on world 0's first ${FI} paths`);
    if (files) {
      const f = j.file && files[j.file];
      if (!f) bad.push(`${k}: its file ${j.file} is missing`);
      else {
        if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${k}: its file is stamped by other code`);
        for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${k}: its file's ${b} bits are not the log's`); }
      }
    }
  }
  return bad;
}
/* O153: the worlds in which BN's own-opening table differs from BO's (the preflight refuses none) */
export function reach(J) { const bn = J[key('S360', 'BN/P60S15Q5')], bo = J[key('S360', 'BO/P60S6Q5')]; return [0, 1, 2].filter(k => bn.tables[k].OWN !== bo.tables[k].OWN).length; }

const cp = (ok, n, al) => clopperPearson(ok, n, al);
export function offOf(table, ok, n, al) { const [l, h] = cp(ok, n, al); return { d: q(table - 100 * ok / n), lo: q(table - 100 * h), hi: q(table - 100 * l) }; }
/* item 1's share in world k: D exact, G from BN's runs' interval */
export function shareOf(bn, bo, k) {
  const s = bn.sims[`OWN${k}`], [l, h] = cp(s.ok, s.n, 2 * a1), D = bn.tables[k].OWN - bo.tables[k].OWN;
  const G = 100 * s.ok / s.n - bo.tables[k].OWN, Glo = 100 * l - bo.tables[k].OWN, Ghi = 100 * h - bo.tables[k].OWN;
  const shown = q(Glo) > 0, S = G > 0 ? D / G : NaN;
  const Slo = shown ? (D >= 0 ? D / Ghi : D / Glo) : -Infinity, Shi = shown ? (D >= 0 ? D / Glo : D / Ghi) : Infinity;
  return { k, D: q(D), G: q(G), Glo: q(Glo), Ghi: q(Ghi), S: q(S), Slo: q(Slo), Shi: q(Shi), shown };
}
/* J: this run's jobs by key; ref2: REF-2's BO job (parsed by reduce-ref2's parse) or null; bitsOf(j, name) */
export function items(J, ref2, bitsOf) {
  const out = {}, bn = J[key('S360', 'BN/P60S15Q5')], bo = J[key('S360', 'BO/P60S6Q5')];
  const c1 = [0, 1].map(k => shareOf(bn, bo, k));
  out['1'] = { outcome: c1.every(x => x.shown && x.Slo >= SHARE_HELD) ? 'HELD' : c1.every(x => x.shown && x.Shi <= SHARE_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c1 };
  out.off = [0, 1, 2].map(k => { const sb = bn.sims[`OWN${k}`], so = bo.sims[`OWN${k}`]; return { k, bn: offOf(bn.tables[k].OWN, sb.ok, sb.n, 2 * a1), bo: offOf(bo.tables[k].OWN, so.ok, so.n, 2 * a1) }; });
  out.over = out.off.some(x => x.bn.lo > OVER);
  const t2 = ref2 ? [0, 1, 2].map(k => !!ref2.tables[k] && bo.tables[k].OWN === ref2.tables[k].OWN) : [false, false, false];
  const r2 = ref2 ? [0, 1, 2].map(k => { const a = bo.sims[`OWN${k}`], b = ref2.sims[`OWN${k}`]; return !!b && a.bits === b.bits && a.bitsB === b.bitsB && a.ok === b.ok; }) : [false, false, false];
  out['2'] = { outcome: !ref2 ? 'INCONCLUSIVE' : t2.some(x => !x) ? 'FALSIFIED' : r2.every(Boolean) ? 'HELD' : 'INCONCLUSIVE', tables: t2, runs: r2 };
  const o1 = out['1'].outcome, ok2 = out['2'].outcome === 'HELD';
  out.causes = { 'O152-NODE': ok2 ? ({ HELD: 'held', FALSIFIED: 'not' }[o1] || 'open') : 'open', 'O152-MODEL': ok2 ? ({ HELD: 'not', FALSIFIED: 'held' }[o1] || 'open') : 'open' };
  out.paired = [0, 1, 2].map(k => { const A = bitsOf(bn, `OWN${k}`), B = bitsOf(bo, `OWN${k}`); let a = 0, b = 0; for (let i = 0; i < A.length; i++) { if (A[i] && !B[i]) a++; else if (!A[i] && B[i]) b++; } return { k, bnOnly: a, boOnly: b }; });
  out.read = ['BN', 'BO'].map(arm => { const j = arm === 'BN' ? bn : bo, w = j.tables.map(t => t.w), mix = f => [0, 1, 2].reduce((t, k) => t + w[k] * f(k), 0); return { arm, read: q(mix(k => j.tables[k].READ)), runs: q(mix(k => 100 * j.sims[`OWN${k}`].ok / j.sims[`OWN${k}`].n)), secs: j.solve.secs }; });
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
export function report(J, ref2, bitsOf) {
  const it = items(J, ref2, bitsOf), L = [];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. the explicit share nodes lift S360's table by at least half of its gap to the runs in worlds 0 and 1 (O152-NODE): ${it['1'].outcome}`, `     ${it['1'].cells.map(c => `world ${c.k}: the table's move ${f4(c.D)} of a gap ${f4(c.G)} (${f4(c.Glo)} to ${f4(c.Ghi)}), the share ${f4(c.S)} (${f4(c.Slo)} to ${f4(c.Shi)})`).join('; ')}`);
  L.push(`2. BO on this code is REF-2's BO in every world (the option inert off): ${it['2'].outcome}`, `     tables ${it['2'].tables.map(x => (x ? 'SAME' : 'DIFFERENT')).join(', ')}; runs ${it['2'].runs.map(x => (x ? 'SAME' : 'DIFFERENT')).join(', ')}`);
  L.push(`OVER-CORRECTION (BN's table above its runs by more than ${OVER} point, shown, in any world): ${it.over ? 'YES' : 'NO'}`);
  L.push('', 'THE CAUSES (the registered map)');
  for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);
  L.push('', 'REPORTED');
  for (const x of it.off) L.push(`  world ${x.k}: table less runs BN ${f4(x.bn.d)} (${f4(x.bn.lo)} to ${f4(x.bn.hi)}), BO ${f4(x.bo.d)} (${f4(x.bo.lo)} to ${f4(x.bo.hi)}); paired runs: ${it.paired[x.k].bnOnly} survive only under BN, ${it.paired[x.k].boOnly} only under BO`);
  for (const r of it.read) L.push(`  ${r.arm}: the year-0 read at the initial state ${f4(r.read)} against its runs ${f4(r.runs)} (mixed by the worlds' weights); solve ${r.secs} s`);
  L.push(`REALISED item 1: ${f4(it['1'].cells[0].S)}`);
  L.push(`OUTCOME: ${['1', '2'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['1', '2'], REACHED = { 1: new Set(), 2: new Set() };
function planted() {
  const cases = [], NP = 4000;
  const mk = (arm, t, ok, read) => ({ id: 'S360', label: arm === 'BN' ? 'BN/P60S15Q5' : 'BO/P60S6Q5', arm, tables: t.map((x, k) => ({ w: [1 / 6, 2 / 3, 1 / 6][k], OWN: x, READ: read ? read[k] : x })), sims: Object.fromEntries(ok.map((o, k) => [`OWN${k}`, { ai: 12, ok: o, n: NP, bridge: o, bits: `h${k}${o}`, bitsB: `b${k}${o}` }])), solve: { table: 40, secs: 100 } });
  const BO_T = [23.6259, 43.7384, 66.2316], RUNS = [1145, 1946, 2791];
  const base = (o = {}) => ({ [key('S360', 'BN/P60S15Q5')]: mk('BN', o.bnT || [28.5, 48.5, 69.7], o.bnOk || RUNS), [key('S360', 'BO/P60S6Q5')]: mk('BO', o.boT || BO_T, o.boOk || RUNS) });
  const ref = (o = {}) => mk('BO', o.t || BO_T, o.ok || RUNS);
  const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
  const bitsOf = (j, nm) => ones(NP, j.sims[nm].ok);
  const run = (o = {}, r = ref()) => items(base(o), r, bitsOf);
  const outc = (n, o, r, want, what) => { const got = run(o, r)[n].outcome; REACHED[n].add(got); cases.push([what, got, want]); };
  // item 1
  outc('1', {}, ref(), 'HELD', 'BN\'s table at its runs in worlds 0 and 1 (the whole gap closed): 1 HELD');
  outc('1', { bnT: BO_T }, ref(), 'FALSIFIED', 'BN\'s table BO\'s (no move): 1 FALSIFIED');
  outc('1', { bnT: [BO_T[0] + 2.5, BO_T[1] + 2.5, 66.2316] }, ref(), 'INCONCLUSIVE', 'BN\'s table half way: 1 INCONCLUSIVE');
  outc('1', { bnT: [28.5, BO_T[1], 69.7] }, ref(), 'INCONCLUSIVE', 'the gap closed in world 0 only: 1 INCONCLUSIVE');
  outc('1', { bnT: [BO_T[0] - 1, BO_T[1] - 1, 66] }, ref(), 'FALSIFIED', 'BN\'s table falls a point (a negative move): 1 FALSIFIED');
  outc('1', { bnT: [28.5, 48.5, 69.7], bnOk: [940, 1750, 2791] }, ref(), 'INCONCLUSIVE', 'BN\'s runs at BO\'s table (no gap shown): 1 INCONCLUSIVE'); EDGES.push('a gap not shown');
  { // the edges: the share's bottom exactly 0.5 in both worlds, and its top exactly 0.25
    const G = k => { const s = { ok: RUNS[k], n: NP }, [l, h] = cp(s.ok, s.n, 2 * a1); return [100 * l - BO_T[k], 100 * h - BO_T[k]]; };
    const held = [0, 1].map(k => BO_T[k] + 0.5 * G(k)[1]), fals = [0, 1].map(k => BO_T[k] + 0.25 * G(k)[0]);
    outc('1', { bnT: [held[0], held[1], 66] }, ref(), 'HELD', 'the share\'s bottom exactly 0.5 in both worlds: 1 HELD'); EDGES.push('a share exactly at the HELD line');
    outc('1', { bnT: [held[0] - 1e-6, held[1], 66] }, ref(), 'INCONCLUSIVE', 'the share\'s bottom a millionth of a point under 0.5 in world 0: 1 INCONCLUSIVE');
    outc('1', { bnT: [fals[0], fals[1], 66] }, ref(), 'FALSIFIED', 'the share\'s top exactly 0.25 in both worlds: 1 FALSIFIED'); EDGES.push('a share exactly at the FALSIFIED line');
    outc('1', { bnT: [fals[0] + 1e-6, fals[1], 66] }, ref(), 'INCONCLUSIVE', 'the share\'s top a millionth of a point over 0.25 in world 0: 1 INCONCLUSIVE');
    outc('1', { bnT: [held[0] - 1e-12, held[1], 66] }, ref(), 'HELD', 'the share\'s bottom 1e-12 under 0.5, equal on the rounding: 1 HELD'); EDGES.push('a share at the line only after rounding'); }
  outc('1', { bnT: [28.5, 48.5, 50] }, ref(), 'HELD', 'world 2 falling alone: 1 reads worlds 0 and 1, HELD');
  outc('1', { bnOk: [0, 0, 0], bnT: BO_T }, ref(), 'INCONCLUSIVE', 'BN\'s runs all failing (zero counts, the gap negative): 1 INCONCLUSIVE'); EDGES.push('a run count at zero');
  // the over-correction line
  cases.push(['BN at its runs: no OVER-CORRECTION', run({}).over, false]);
  { const [, h] = cp(2791, NP, 2 * a1); cases.push(['BN\'s world 2 table exactly a point above its runs\' top: no OVER-CORRECTION', run({ bnT: [28.5, 48.5, 100 * h + 1] }).over, false]);
    cases.push(['BN\'s world 2 table a millionth over a point above its runs\' top: OVER-CORRECTION', run({ bnT: [28.5, 48.5, 100 * h + 1 + 1e-6] }).over, true]); EDGES.push('an over-read exactly a point'); }
  // item 2
  outc('2', {}, ref(), 'HELD', 'BO\'s tables and runs REF-2\'s: 2 HELD');
  outc('2', {}, ref({ t: [BO_T[0], BO_T[1], 66.231601] }), 'FALSIFIED', 'BO\'s world 2 table a printed digit off REF-2\'s: 2 FALSIFIED');
  outc('2', {}, ref({ ok: [1145, 1946, 2790] }), 'INCONCLUSIVE', 'the tables alike, world 2\'s runs not: 2 INCONCLUSIVE');
  outc('2', {}, null, 'INCONCLUSIVE', 'REF-2\'s BO not read: 2 INCONCLUSIVE');
  // the causes
  const cz = (o, r, c) => run(o, r).causes[c];
  cases.push(['1 HELD, 2 HELD: O152-NODE held, O152-MODEL not', `${cz({}, ref(), 'O152-NODE')} ${cz({}, ref(), 'O152-MODEL')}`, 'held not']);
  cases.push(['1 FALSIFIED, 2 HELD: O152-NODE not, O152-MODEL held', `${cz({ bnT: BO_T }, ref(), 'O152-NODE')} ${cz({ bnT: BO_T }, ref(), 'O152-MODEL')}`, 'not held']);
  cases.push(['1 INCONCLUSIVE: both open', `${cz({ bnT: [BO_T[0] + 2.5, BO_T[1] + 2.5, 66] }, ref(), 'O152-NODE')} ${cz({ bnT: [BO_T[0] + 2.5, BO_T[1] + 2.5, 66] }, ref(), 'O152-MODEL')}`, 'open open']);
  cases.push(['1 HELD, 2 FALSIFIED (the option not inert off): both open', `${cz({}, ref({ t: [24, BO_T[1], BO_T[2]] }), 'O152-NODE')} ${cz({}, ref({ t: [24, BO_T[1], BO_T[2]] }), 'O152-MODEL')}`, 'open open']);
  cases.push(['1 FALSIFIED, 2 INCONCLUSIVE: both open', `${cz({ bnT: BO_T }, ref({ ok: [1145, 1946, 2790] }), 'O152-NODE')} ${cz({ bnT: BO_T }, ref({ ok: [1145, 1946, 2790] }), 'O152-MODEL')}`, 'open open']);
  // the paired runs and the reads
  { const it = run({ bnOk: [1150, 1946, 2791] }); cases.push(['the paired runs: 5 more survive under BN in world 0', `${it.paired[0].bnOnly} ${it.paired[0].boOnly}`, '5 0']); }
  { const it = items(base({}), ref(), bitsOf); cases.push(['the year-0 read mixed by the worlds\' weights', it.read[1].read, q(BO_T[0] / 6 + BO_T[1] * 2 / 3 + BO_T[2] / 6)]); }
  // the arm's reach (O153)
  cases.push(['BN\'s tables BO\'s in every world: reach 0', reach(base({ bnT: BO_T })), 0]);
  cases.push(['BN\'s tables moved in two worlds: reach 2', reach(base({ bnT: [28.5, 48.5, BO_T[2]] })), 2]); EDGES.push('an arm equal to its control everywhere');
  // the read end to end
  { let lines = [], err = null; try { lines = report(base(), ref(), bitsOf); } catch (e) { err = e.message; }
    const oc = lines.find(l => l.startsWith('OUTCOME: ')) || '';
    cases.push(['the read prints both items, the over-correction line, two causes, REALISED and an OUTCOME of two items, end to end', err || `${['1.', '2.'].every(p => lines.some(l => l.startsWith(p)))} ${lines.some(l => /^OVER-CORRECTION .*: (YES|NO)$/.test(l))} ${lines.filter(l => l.startsWith('=> ')).length} ${lines.some(l => l.startsWith('REALISED item 1: '))} ${oc.split(', ').length}`, 'true true 2 true 2']); }
  // the gate, on synthetic logs built as the audit prints
  const pad = ''.padEnd(16), G0 = { npw: 4, scale: 30 };
  const jobText = (jb, o = {}) => {
    const [id, arm, pts0, sh] = jb, L = jobLabel(jb), pts = o.pts || Math.max(4, Math.round(pts0 / 30));
    const ran = `bridgeRead reader bridgeStep exact readerSplit null readerBlend null readerRef ${o.ref || 'order'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls ${o.e3 || 'true'} switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${pts} grid ${o.grid || `total${pts}x${sh}x6`} shareNodes ${o.nodes || (arm === 'BN' ? NODES_A : 'none')} floor ${o.floor || 5000} line 0.5`;
    const out = [`${id.padEnd(16)} case | job ${L} | points ${pts} | lambda 0.0223606797749979`];
    if (!o.dropSolve) out.push(`${pad} solve CAND ${L}: table 40.0000 secs 10`);
    out.push(`${pad} ran CAND ${L}: ${ran}`, `${pad} checks ${L}: armTook ${o.armTook !== undefined ? o.armTook : 1}/1`, `${pad} openings ${L}: OWN ai 12 level 0.8 tiers 0,0`);
    for (let k = 0; k < 3; k++) if (o.dropTable !== k) out.push(`${pad} tables ${L} ${k} z 0.000000 weight 0.333333: OWN 40.000000 READ 39.000000`);
    for (let k = 0; k < 3; k++) if (o.dropRun !== k) out.push(`${pad} sim ${L} ${k} OWN ai ${o.simAi || 12}: 2/${o.runN || 4} bridge ${o.bridge || 2} bits aa bb`);
    out.push(`${pad} checks ${L}: forceIdentity ${o.fi || 4}/${o.fiN || 4} secs 1`, `${pad} file ${L}: ${id}-${L.replace(/\//g, '-')}.json.gz`);
    if (!o.noDone) out.push(`${pad} done ${L}`);
    return out.join('\n');
  };
  const logOf = (jb, o = {}) => `stamp: code ${o.code || 'c0'} audit a0 prediction p0 sha s0\nNODE-1: the candidate's own unit, ${o.headN || 4} paths a world, wealth points divided by ${o.headScale || 30} (seed ${o.seed || 7002}); 2 jobs; part 0/2\n${jobText(jb, o)}\n`;
  const all = (ov = {}) => JOBS.flatMap(jb => parse(logOf(jb, ov[jobLabel(jb)] || {}))).concat(ov.extra ? parse(logOf(JOBS[0])) : []);
  const refuses = (what, jobs, opt = {}) => cases.push([`the gate refuses ${what}`, gate(jobs, { ...G0, ...opt }).length > 0, true]);
  const KN = jobLabel(JOBS[0]), KB = jobLabel(JOBS[1]);
  cases.push(['the gate passes the two jobs as registered', gate(all(), G0).length, 0]);
  cases.push(['the gate refuses a missing job', gate(all().slice(1), G0).length > 0, true]);
  refuses('a job run twice', all({ extra: true }));
  refuses('a job with no done line', all({ [KB]: { noDone: true } }));
  refuses('a stamp from other code', all({ [KB]: { code: 'c9' } }));
  refuses('another seed', all({ [KN]: { seed: 7003 }, [KB]: { seed: 7003 } }));
  refuses('another path count in the head', all({ [KN]: { headN: 5 } }));
  refuses('another scale in the head', all({ [KN]: { headScale: 20 } }));
  refuses('BN at other points', all({ [KN]: { pts: 5 } }));
  refuses('BN without its nodes in the meta', all({ [KN]: { nodes: 'none' } }));
  refuses('BO with nodes in the meta', all({ [KB]: { nodes: NODES_A } }));
  refuses('BN on six shares', all({ [KN]: { grid: 'total2x6x6' } }));
  refuses('another reference', all({ [KB]: { ref: 'null' } }));
  refuses('e3pcls off', all({ [KN]: { e3: 'false' } }));
  refuses('another floor', all({ [KB]: { floor: 6000 } }));
  refuses('armTook failed', all({ [KN]: { armTook: 0 } }));
  refuses('no solve line', all({ [KB]: { dropSolve: true } }));
  refuses('a missing table in world 1', all({ [KN]: { dropTable: 1 } }));
  refuses('a missing run in world 2', all({ [KB]: { dropRun: 2 } }));
  refuses('runs on other paths than registered', all({ [KB]: { runN: 5 } }));
  refuses('runs at another opening', all({ [KN]: { simAi: 13 } }));
  refuses('fewer paying the bridge than surviving', all({ [KB]: { bridge: 1 } }));
  refuses('forceIdentity one path short', all({ [KN]: { fi: 3 } }));
  { const jobs = all(), files = {}, shOf = s => sha16(Buffer.from(s, 'base64'));
    for (const j of jobs) { const bits = {}; Object.keys(j.sims).forEach(nm => { bits[nm] = 'AAAA'; bits[`${nm}b`] = 'AQAA'; }); files[j.file] = { stamp: j.stamp, bits }; Object.values(j.sims).forEach(s => { s.bits = shOf('AAAA'); s.bitsB = shOf('AQAA'); }); }
    cases.push(['the gate passes files whose bits are the log\'s', gate(jobs, { ...G0, files }).length, 0]);
    refuses('a missing file', jobs, { files: { ...files, [jobs[1].file]: undefined } });
    refuses('a file stamped by other code', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], stamp: { ...jobs[0].stamp, code: 'c9' } } } });
    refuses('a file whose bits are not the log\'s', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], bits: { ...files[jobs[0].file].bits, OWN1b: 'AgAA' } } } }); }
  const bad = cases.filter(([, got, want]) => got !== want);
  for (const [what, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'BAD '} ${what}: ${JSON.stringify(got)}`);
  if (bad.length) { console.log(`PLANTED CHECK FAILED (${bad.length})`); process.exit(1); }
  const short = ITEMS.filter(i => REACHED[i].size < 3);
  if (short.length) { console.log(`PLANTED CHECK FAILED: items not planted to all three outcomes: ${short.map(i => `${i} (${[...REACHED[i]].join(', ')})`).join('; ')}`); process.exit(1); }
  if (EDGES.length < 2) { console.log('PLANTED CHECK FAILED: fewer than two edges'); process.exit(1); }
  return cases.length;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (const i of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagnode1'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  let ref2 = null;
  if (!PRE) {
    // REF-2's BO, behind REF-2's own reducer gate (its main, over its folder)
    const DR = join(HERE, 'results', 'diagref2'), red = spawnSync('node', [join(HERE, 'reduce-ref2.mjs'), DR], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) bad.push('REF-2\'s files did not pass REF-2\'s gate');
    else { const R2 = await import('./reduce-ref2.mjs'), rj = readdirSync(DR).filter(f => /^case\d+\.txt$/.test(f)).flatMap(f => R2.parse(readFileSync(join(DR, f), 'utf8'))).filter(j => j.id === 'S360' && j.arm === 'BO'); if (rj.length !== 1) bad.push('REF-2\'s S360 BO is not there once'); else ref2 = rj[0]; }
  }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.label), j]));
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the two jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); each job's reference, nodes and grid in its solve's meta; every self-check passed (armTook, forceIdentity); every file the log's${PRE ? '' : '; REF-2\'s BO behind REF-2\'s gate'}`);
  const rc = reach(J);
  console.log(`ARM'S REACH (O153): BN's own-opening tables differ from BO's in ${rc} of 3 worlds: ${[0, 1, 2].map(k => `world ${k} BN ${J[key('S360', 'BN/P60S15Q5')].tables[k].OWN} BO ${J[key('S360', 'BO/P60S6Q5')].tables[k].OWN}`).join('; ')}`);
  if (rc === 0) { console.log('REFUSED: the arm equals its control in every world, so it cannot reach the mechanism (O153)'); process.exit(1); }
  if (PRE) { console.log('PREFLIGHT: the gate, the files and the arm\'s reach read; no figure is read'); process.exit(0); }
  const bitsOf = (j, nm) => Buffer.from(files[j.file].bits[nm], 'base64');
  console.log('\nNODE-1: S360 under ORDER with explicit pension-share nodes (BN) against six shares (BO) (predictions/diag-node1.md)');
  for (const L of report(J, ref2, bitsOf)) console.log(L);
}
