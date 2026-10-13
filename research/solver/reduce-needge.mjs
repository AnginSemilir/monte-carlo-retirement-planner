/*
 * NE-EDGE'S REDUCER (PLAN.md NE-EDGE; predictions/diag-needge.md; audit-needge.mjs).
 *   node research/solver/reduce-needge.mjs [dir=results/diagneedge] [paths=4000] [scale=1] [--preflight]
 *   node research/solver/reduce-needge.mjs --planted
 * THE GATE: the seven jobs once and done, one stamp (code, audit, prediction) across the logs and in every file; each at the
 *   registered settings (paths a world, scale, seed, wealth points, its grid, three worlds), the candidate's settings and
 *   the job's readerSplit in its solve's meta (armTook and the ran line), the household's minimum end pot and the support
 *   line 0.5; the forced pair at its registered actions (pairTook); forceIdentity on world 0's first 1,000 paths; three
 *   world tables; P, D and (where the own opening is neither) OWN runs of the registered paths in every world; the probe on
 *   S364's three jobs (reads in every world, weights summing to 1, plain = deletion + residual); every file's bits the
 *   log's. THE IDENTITY CONTROL (not in --preflight): S364's BASE job reproduces NE-GRID C's S364 BASE/P60S6Q5 - its three
 *   world tables at P, D and OWN to the printed digits and every run's count and bits (C's records behind C's gate).
 * THE ITEMS (ALPHA 0.05; runs bounded by their exact interval one-sided at ALPHA / 4 in items 1-3; every threshold read on
 *   the figure rounded to 1e-9):
 *   1 (RZ) and 2 (RS): S364's 60-point over-read removed. In worlds 0 and 1, BASE's over-read is its table at P less its P
 *     runs, counted where at least half a point; the arm's removal is 1 less the arm's over-read over BASE's. HELD when
 *     every counted world's removal is at least 0.8 with the arm's over-read at its interval's top; FALSIFIED when every
 *     counted world's removal is under 0.5 with it at its interval's bottom; INCONCLUSIVE otherwise, or with none counted.
 *   3 (control): bridge 4 under RZ and RS, its own opening's table less its runs. HELD when every world's point is within
 *     0.3 under both arms; FALSIFIED when a world's interval lies wholly outside [-0.3, 0.3] under either; INCONCLUSIVE
 *     otherwise.
 *   4 (control): S380 under RZ and RS against NE-GRID B1's 60-point BASE tables (behind B1's gate), worlds 0 and 1, P and
 *     D. HELD when every |difference| is at most 0.3; FALSIFIED when any is 0.6 or more; INCONCLUSIVE otherwise.
 *   5 (RZ) and 6 (RS): S364's own opening under the arm against the arm's P on the same paths, worlds 0, 1 and 2, by the
 *     regimen's outcome() at the relative margin (PR13: the margin or a tenth of P's survival, the smaller), Holm across
 *     the three worlds; 0 of 0 discordant is no material harm. HELD when every world reads no material harm; FALSIFIED
 *     when any world reads harm; INCONCLUSIVE otherwise. Reported: BASE's own opening read alike (the positive control).
 * THE CAUSES (the deep review after NE-GRID C's): R-CARRIES (S364's over-read is the residual's) held on 1 HELD, not on 1
 *   FALSIFIED (RZ zeroes every corner's R, so it reaches the mechanism by construction); S364-RUNSCALED (R added unscaled by
 *   the query's chance) held on 2 HELD, not on 2 FALSIFIED with 1 HELD or FALSIFIED only where RS's reach - the share of
 *   the corners' absolute residual on corners whose chance is above the query's, the RS job's probe - is at least 0.5 in
 *   every world item 2 counts; open otherwise.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson, mcnemarHarmP, holm, outcome as harmOutcome, marginRel } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-needge.md';
export const SEED = '7002', NPW = 4000, ALPHA = 0.05;
export const GMIN = 0.5, REMOVE = 0.8, KEEP = 0.5, CTRL = 0.3, TBL = 0.3, TBLF = 0.6, REACH = 0.5;
export const WEIGHTS = [1 / 6, 2 / 3, 1 / 6];
export const PAIRS = Object.freeze({ S380: [12, 14], 'bridge 4': [57, 59], S364: [12, 14] });
export const JOBS = [['S364', 'BASE', 60, 6, 5, 1], ['S364', 'RZ', 60, 6, 5, 1], ['S364', 'RS', 60, 6, 5, 1], ['bridge 4', 'RZ', 60, 6, 5, 1], ['bridge 4', 'RS', 60, 6, 5, 1],
  ['S380', 'RZ', 60, 6, 5, 1], ['S380', 'RS', 60, 6, 5, 1]];
export const SPLIT = Object.freeze({ BASE: 'null', RZ: 'rz', RS: 'rs' });
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
export const PROBED = new Set(['S364 BASE/P60S6Q5', 'S364 RZ/P60S6Q5', 'S364 RS/P60S6Q5']);
export const FLOORS = Object.freeze({ S380: 52500, 'bridge 4': 29000, S364: 205000 });
export const key = (id, label) => `${id} ${label}`;
export const q = x => Math.round(x * 1e9) / 1e9;
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const CASEL = /^(bridge 4|S380|S364)\s+case \| job ((BASE|RZ|RS)\/P(\d+)S(\d+)Q(\d+)) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^NE-EDGE: .*, (\d+) paths a world, .*divided by (\d+(?:\.\d+)?) \(seed (\d+)\)/;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) { j = { id: c[1], label: c[2], arm: c[3], pts0: Number(c[4]), shares: Number(c[5]), quad: Number(c[6]), pts: Number(c[7]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null, head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, tables: [], sims: {}, checks: {}, done: false }; jobs.push(j); continue; }
    if (!j) continue;
    const l = raw.trim(), L = j.label;
    let m;
    if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if ((m = new RegExp(`^reader ${esc(L)}: tables (\\S+) unsupported (\\S+) copied (\\S+) copiedTop (\\S+) nodes (\\S+); clamps n (\\d+) lo (\\d+) hi (\\d+)$`).exec(l))) j.reader = { copied: m[3], nodes: m[5], clampN: Number(m[6]) };
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^pair ${esc(L)}: P ai (\\d+) level (\\S+) tiers (\\S+); D ai (\\d+) level (\\S+) tiers (\\S+)$`).exec(l))) j.pair = { P: Number(m[1]), D: Number(m[4]), tP: m[3], tD: m[6], lP: m[2], lD: m[5] };
    else if ((m = /OWN ai (\d+) level (\S+) tiers (\S+)/.exec(l)) && l.startsWith(`openings ${L}:`)) j.own = { ai: Number(m[1]), level: m[2], tiers: m[3] };
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): P (\\S+) D (\\S+) OWN (\\S+)$`).exec(l))) j.tables.push({ k: Number(m[1]), weight: Number(m[3]), P: Number(m[4]), D: Number(m[5]), OWN: Number(m[6]), raw: [m[4], m[5], m[6]] });
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) (P|D|OWN) ai (\\d+): (\\d+)/(\\d+) bits (\\S+)$`).exec(l))) j.sims[`${m[2]}${m[1]}`] = { ai: Number(m[3]), ok: Number(m[4]), n: Number(m[5]), bits: m[6] };
    else if ((m = new RegExp(`^probe ${esc(L)} (\\d) P: reads (\\d+) pr (\\S+) plain (\\S+) deletion (\\S+) residual (\\S+) \\| sup w (\\S+) p (\\S+) S (\\S+) c (\\S+) R (\\S+) \\| clip w (\\S+) p (\\S+) S (\\S+) c (\\S+) R (\\S+) \\| copy w (\\S+) p (\\S+) S (\\S+) c (\\S+) R (\\S+) \\| rs reach (\\S+) rweight (\\S+)$`).exec(l))) { const n = m.slice(2).map(Number); (j.probe = j.probe || [])[Number(m[1])] = { reads: n[0], pr: n[1], plain: n[2], del: n[3], res: n[4], sup: n.slice(5, 10), clip: n.slice(10, 15), copy: n.slice(15, 20), reach: n[20], rweight: n[21] }; }
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerRef: 'plan', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001' };
/* refC: NE-GRID C's S364 BASE/P60S6Q5 job (parsed, behind C's gate), for the identity control; null in --preflight */
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null, refC = null } = {}) {
  const bad = [], byKey = {};
  for (const j of jobs) { const k = key(j.id, j.label); (byKey[k] = byKey[k] || []).push(j); }
  for (const jb of JOBS) { const k = key(jb[0], jobLabel(jb)), n = (byKey[k] || []).length; if (n !== 1) bad.push(`${k}: ${n ? 'run ' + n + ' times' : 'missing'}`); }
  const st0 = jobs[0] && jobs[0].stamp, fi = Math.min(npw, 1000);
  for (const j of jobs) {
    const k = key(j.id, j.label), reg = JOBS.find(jb => jb[0] === j.id && jobLabel(jb) === j.label);
    if (!reg) { bad.push(`${k}: not a registered job`); continue; }
    const pts = Math.max(4, Math.round(reg[2] / scale));
    if (!j.done) bad.push(`${k}: no done line`);
    if (!j.stamp || !st0 || ['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])) bad.push(`${k}: its stamp is not the other logs'`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${k}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${k}: solved at ${j.pts} points, not ${pts}`);
    if (!j.checks.armTook || j.checks.armTook[0] !== 1) bad.push(`${k}: armTook did not pass`);
    if (!j.checks.pairTook || j.checks.pairTook[0] !== 1) bad.push(`${k}: pairTook did not pass`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, readerSplit: SPLIT[j.arm] })) if (field(ran, f) !== v) bad.push(`${k}: ${f} is ${field(ran, f)}, not ${v}`);
    if (field(ran, 'pts') !== String(pts)) bad.push(`${k}: not solved at ${pts} points`);
    if (field(ran, 'grid') !== `total${pts}x${reg[3]}x${reg[3]}`) bad.push(`${k}: its grid is ${field(ran, 'grid')}, not ${pts} x ${reg[3]} x ${reg[3]}`);
    if (field(ran, 'mix') !== '3') bad.push(`${k}: not three worlds`);
    if (field(ran, 'floor') !== String(FLOORS[j.id])) bad.push(`${k}: its minimum end pot is ${field(ran, 'floor')}, not ${FLOORS[j.id]}`);
    if (field(ran, 'line') !== '0.5') bad.push(`${k}: its support line is ${field(ran, 'line')}, not 0.5`);
    if (PROBED.has(k)) { const pb = j.probe || []; if ([0, 1, 2].some(w => !pb[w] || !(pb[w].reads > 0))) bad.push(`${k}: the probe logged no reads in a world`); else for (const [w, x] of pb.entries()) { if (Math.abs(x.sup[0] + x.clip[0] + x.copy[0] - 1) > 1e-5) bad.push(`${k}: world ${w}'s probe weights do not sum to 1`); if (Math.abs(x.plain - x.del - x.res) > 1e-4) bad.push(`${k}: world ${w}'s probe breaks plain = deletion + residual`); if (!(x.reach >= 0 && x.reach <= 1)) bad.push(`${k}: world ${w}'s RS reach is not a share`); } }
    if (!j.pair || j.pair.P !== PAIRS[j.id][0] || j.pair.D !== PAIRS[j.id][1] || j.pair.tP !== '0,0' || j.pair.tD !== '2,2' || j.pair.lP !== j.pair.lD) bad.push(`${k}: the forced pair is not the registered one`);
    if (!j.own) bad.push(`${k}: the openings line is missing or unread`);
    if (!j.reader) bad.push(`${k}: the reader line is missing`);
    else if (j.reader.clampN !== 0) bad.push(`${k}: ${j.reader.clampN} LOR reads counted`);
    if (j.tables.length !== 3 || j.tables.some((x, i) => x.k !== i)) bad.push(`${k}: not three world tables`);
    const need = [['P', npw], ['D', npw], ...(j.own && j.pair && j.own.ai !== j.pair.P && j.own.ai !== j.pair.D ? [['OWN', npw]] : [])];
    for (let w = 0; w < 3; w++) for (const [nm, np] of need) { const s = j.sims[`${nm}${w}`]; if (!s || s.n !== np) bad.push(`${k}: no ${nm} run of ${np} paths in world ${w}`); }
    if (!j.checks.forceIdentity || j.checks.forceIdentity[0] !== fi || j.checks.forceIdentity[1] !== fi) bad.push(`${k}: forceIdentity did not pass on world 0's first ${fi} paths`);
    if (files) {
      const f = j.file && files[j.file];
      if (!f) bad.push(`${k}: its file ${j.file} is missing`);
      else {
        if (!f.stamp || !j.stamp || ['code', 'audit', 'prediction'].some(x => f.stamp[x] !== j.stamp[x])) bad.push(`${k}: its file is stamped by other code`);
        for (const [nm, s] of Object.entries(j.sims)) if (typeof f.bits[nm] !== 'string' || sha16(Buffer.from(f.bits[nm], 'base64')) !== s.bits) bad.push(`${k}: ${nm}'s bits are not the log's`);
      }
    }
  }
  if (refC) {
    const j = (byKey['S364 BASE/P60S6Q5'] || [])[0];
    if (j) {
      for (let w = 0; w < 3; w++) { const a = j.tables[w], b = refC.tables[w]; if (!a || !b || a.raw.join(' ') !== b.raw.join(' ')) bad.push(`S364 BASE/P60S6Q5: world ${w}'s tables are not NE-GRID C's`); }
      for (const [nm, s] of Object.entries(refC.sims)) { const t = j.sims[nm]; if (!t || t.ok !== s.ok || t.n !== s.n || t.bits !== s.bits) bad.push(`S364 BASE/P60S6Q5: its ${nm} run is not NE-GRID C's`); }
      if (Object.keys(j.sims).length !== Object.keys(refC.sims).length) bad.push('S364 BASE/P60S6Q5: its runs are not NE-GRID C\'s set');
    }
  }
  return bad;
}

const a1 = ALPHA / 4;
export function offOf(table, ok, n) { const [l, h] = clopperPearson(ok, n, 2 * a1); return { d: table - 100 * ok / n, lo: table - 100 * h, hi: table - 100 * l }; }
const nameOf = j => (j.own.ai === j.pair.P ? 'P' : j.own.ai === j.pair.D ? 'D' : 'OWN');
/* J: this test's jobs by key; B1S380: NE-GRID B1's S380 BASE 60-point tables by world ({ P, D }); bitsOf(j, run): the run's
   per-path survival bits (Uint8Array) */
export function items(J, B1S380, bitsOf) {
  const out = {}, jt = (id, arm) => J[key(id, `${arm}/P60S6Q5`)];
  const base = jt('S364', 'BASE');
  const removal = arm => {
    const j = jt('S364', arm), cells = [0, 1].map(k => {
      const sb = base.sims[`P${k}`], ob = q(base.tables[k].P - 100 * sb.ok / sb.n), s = j.sims[`P${k}`], o = offOf(j.tables[k].P, s.ok, s.n), counted = ob >= GMIN;
      return { k, over: ob, armOver: o.d, worst: counted ? q(1 - o.hi / ob) : null, best: counted ? q(1 - o.lo / ob) : null, point: counted ? q(1 - o.d / ob) : null, counted };
    });
    const cc = cells.filter(c => c.counted);
    return { outcome: cc.length && cc.every(c => c.worst >= REMOVE) ? 'HELD' : cc.length && cc.every(c => c.best < KEEP) ? 'FALSIFIED' : 'INCONCLUSIVE', cells };
  };
  out['1'] = removal('RZ'); out['2'] = removal('RS');
  // item 3: bridge 4's own opening under each arm against its runs
  const c3 = ['RZ', 'RS'].flatMap(arm => { const j = jt('bridge 4', arm), nm = nameOf(j); return [0, 1, 2].map(k => { const s = j.sims[`${nm}${k}`]; return { arm, k, open: nm, ...offOf(j.tables[k].OWN, s.ok, s.n) }; }); });
  out['3'] = { outcome: c3.every(x => q(Math.abs(x.d)) <= CTRL) ? 'HELD' : c3.some(x => q(x.lo) > CTRL || q(x.hi) < -CTRL) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c3 };
  // item 4: S380's tables under each arm against B1's BASE
  const c4 = ['RZ', 'RS'].flatMap(arm => { const j = jt('S380', arm); return [0, 1].flatMap(k => ['P', 'D'].map(o => ({ arm, k, o, d: q(j.tables[k][o] - B1S380[k][o]) }))); });
  out['4'] = { outcome: c4.every(x => Math.abs(x.d) <= TBL) ? 'HELD' : c4.some(x => Math.abs(x.d) >= TBLF) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c4 };
  // items 5 and 6: S364's own opening under the arm against the arm's P, paired, worlds 0-2
  const opening = arm => {
    const j = jt('S364', arm), nm = nameOf(j);
    const cells = [0, 1, 2].map(k => {
      const p = bitsOf(j, `P${k}`), o = nm === 'P' ? p : bitsOf(j, `${nm}${k}`);
      let b = 0, c = 0; for (let i = 0; i < p.length; i++) { if (p[i] && !o[i]) b++; else if (!p[i] && o[i]) c++; }
      return { k, open: nm, b, c, N: p.length, sP: 100 * j.sims[`P${k}`].ok / j.sims[`P${k}`].n, p: mcnemarHarmP(b, c) };
    });
    const adj = holm(cells.map(x => x.p));
    cells.forEach((x, i) => { x.pHolm = adj[i]; x.margin = marginRel(x.sP); x.read = x.b + x.c === 0 ? { d: 0, lo: 0, hi: 0, outcome: 'no material harm' } : harmOutcome({ b: x.b, c: x.c, N: x.N, margin: x.margin, pHolm: x.pHolm }); });
    return { outcome: cells.every(x => x.read.outcome === 'no material harm') ? 'HELD' : cells.some(x => x.read.outcome === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE', cells };
  };
  out['5'] = opening('RZ'); out['6'] = opening('RS'); out.baseOpening = opening('BASE');
  const o1 = out['1'].outcome, o2 = out['2'].outcome;
  // RS's reach (the plan-auditor's BLOCKING 1 of 13 Oct 02:54 UK): RS scales only the residual on corners whose chance is
  // above the query's; S364-RUNSCALED reads 'not' only where that share of the residual is at least REACH in every world
  // item 2 counted (the RS job's probe)
  const pbS = (jt('S364', 'RS') || {}).probe, c2 = out['2'].cells.filter(c => c.counted);
  const reachS = k => (pbS && pbS[k] ? q(pbS[k].reach) : null);
  const reaches = c2.length > 0 && c2.every(c => reachS(c.k) !== null && reachS(c.k) >= REACH);
  out['2'].reach = [0, 1].map(reachS);
  out.causes = {
    'R-CARRIES': { HELD: 'held', FALSIFIED: 'not' }[o1] || 'open',
    'S364-RUNSCALED': o2 === 'HELD' ? 'held' : o2 === 'FALSIFIED' && (o1 === 'HELD' || o1 === 'FALSIFIED') && reaches ? 'not' : 'open',
  };
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
/* THE READ, from the items to the OUTCOME line, as lines: the main prints them, and a planted check runs it end to end */
export function report(J, B1S380, bitsOf) {
  const it = items(J, B1S380, bitsOf), L = [];
  const rem = n => it[n].cells.map(c => `world ${c.k}: BASE's over-read ${f4(c.over)}, the arm's ${f4(c.armOver)}${c.counted ? `, removal ${f4(c.point)} (worst ${f4(c.worst)}, best ${f4(c.best)})` : ' (not counted)'}`).join('; ');
  const opn = o => o.cells.map(c => `world ${c.k} own ${c.open}: ${c.c} saved/${c.b} lost of ${c.N}, ${c.read.outcome} (margin ${f4(c.margin)}, Holm p ${f4(c.pHolm)})`).join('; ');
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. RZ removes S364's 60-point over-read: ${it['1'].outcome}`, `     ${rem('1')}`);
  L.push(`2. RS removes S364's 60-point over-read: ${it['2'].outcome}`, `     ${rem('2')}`, `     RS's reach on the residual (S364-RUNSCALED's 'not' needs at least ${REACH} in every counted world): ${it['2'].reach.map((r, k) => `world ${k} ${r === null ? 'none' : f4(r)}`).join(', ')}`);
  L.push(`3. bridge 4 within 0.3 at its own opening under RZ and RS: ${it['3'].outcome}`, `     ${it['3'].cells.map(c => `${c.arm} world ${c.k} at ${c.open}: ${f4(c.d)} (${f4(c.lo)} to ${f4(c.hi)})`).join('; ')}`);
  L.push(`4. S380's tables within 0.3 of B1's BASE under RZ and RS: ${it['4'].outcome}`, `     ${it['4'].cells.map(c => `${c.arm} world ${c.k} ${c.o}: ${f4(c.d)}`).join('; ')}`);
  L.push(`5. under RZ, S364's own opening does no material harm against P: ${it['5'].outcome}`, `     ${opn(it['5'])}`);
  L.push(`6. under RS, S364's own opening does no material harm against P: ${it['6'].outcome}`, `     ${opn(it['6'])}`);
  L.push('', 'THE CAUSES (the registered map)');
  for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);
  L.push('', 'REPORTED', `  BASE's own opening against P on S364 (the positive control): ${opn(it.baseOpening)}`);
  for (const k of PROBED) { const j = J[k]; if (!j || !j.probe) continue; for (const [w, x] of j.probe.entries()) L.push(`  probe ${k} world ${w} at P: plain ${f4(x.plain)}, deletion ${f4(x.del)}, residual ${f4(x.res)}; copy weight ${f4(x.copy[0])} chance ${f4(x.copy[1])} R ${f4(x.copy[4])}`); }
  const c1 = it['1'].cells[0], c2 = it['2'].cells[0];
  L.push(`REALISED item 1: ${c1.counted ? f4(c1.point) : 'none'}`, `REALISED item 2: ${c2.counted ? f4(c2.point) : 'none'}`);
  L.push(`OUTCOME: ${['1', '2', '3', '4', '5', '6'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  return L;
}

/* PLANTED: every boundary the items, the causes and the gate turn on, read as it should */
const EDGES = [], REACHED = {};
function planted() {
  const N = NPW, cases = [], ITEMS = ['1', '2', '3', '4', '5', '6'];
  for (const i of ITEMS) REACHED[i] = new Set();
  const tab = v => [0, 1, 2].map(k => ({ k, weight: WEIGHTS[k], P: v, D: v, OWN: v }));
  // a base set: every job's tables at 3 (S364) or 50, every run at 1 in 4,000 (S364) or 2,000; S364's BASE over-read
  // 3 - 0.025 = 2.975 in worlds 0 and 1; the arms remove all of it (tables at 0.025); own opening P everywhere
  const base = () => {
    const J = {};
    for (const jb of JOBS) {
      const [id, arm] = jb, s364 = id === 'S364', ok = s364 ? 1 : 2000, t = s364 ? (arm === 'BASE' ? 3 : 0.025) : 50;
      J[key(id, jobLabel(jb))] = { id, arm, label: jobLabel(jb), own: { ai: PAIRS[id][0] }, pair: { P: PAIRS[id][0], D: PAIRS[id][1] }, tables: tab(t), sims: Object.fromEntries([0, 1, 2].flatMap(k => [[`P${k}`, { ok, n: N }], [`D${k}`, { ok, n: N }], [`OWN${k}`, { ok, n: N }]])), bits: {} };
    }
    return { J, B1: [0, 1, 2].map(() => ({ P: 50, D: 50 })) };
  };
  const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
  const bitsOf = (j, nm) => j.bits[nm] || ones(j.sims[nm].n, j.sims[nm].ok);
  const run = mut => { const s = base(); mut(s); return items(s.J, s.B1, bitsOf); };
  const jt = (s, id, arm) => s.J[key(id, `${arm}/P60S6Q5`)];
  const setT = (s, id, arm, o, v, ks = [0, 1, 2]) => { for (const k of ks) jt(s, id, arm).tables[k][o] = v; };
  // the arm's P runs at ok of 4,000: over-read = table - 100 ok / N; BASE's over-read 2.975
  const armOver = (arm, table, ks = [0, 1]) => s => setT(s, 'S364', arm, 'P', table, ks);
  for (const [n, arm] of [['1', 'RZ'], ['2', 'RS']]) {
    cases.push([`${arm} removes all of it: ${n} HELD`, run(s => {})[n].outcome, 'HELD']);
    { const [l] = clopperPearson(1, N, 0.025), t = 0.2 * 2.975 + 100 * l; cases.push([`${arm} leaves exactly a fifth at its interval's top: ${n} HELD`, run(armOver(arm, t))[n].outcome, 'HELD']); EDGES.push(`${arm}: a removal exactly 0.8 at the worst`); }
    { const [l] = clopperPearson(1, N, 0.025), t = 0.2 * 2.975 + 100 * l + 1e-6; cases.push([`${arm} leaves just over a fifth at its interval's top: ${n} INCONCLUSIVE`, run(armOver(arm, t))[n].outcome, 'INCONCLUSIVE']); }
    cases.push([`${arm} removes nothing: ${n} FALSIFIED`, run(armOver(arm, 3))[n].outcome, 'FALSIFIED']);
    { const [, h] = clopperPearson(1, N, 0.025), t = 0.5 * 2.975 + 100 * h; cases.push([`${arm} removes exactly half at its interval's bottom: ${n} INCONCLUSIVE`, run(armOver(arm, t))[n].outcome, 'INCONCLUSIVE']); EDGES.push(`${arm}: a removal exactly 0.5 at the best`); }
    { const [, h] = clopperPearson(1, N, 0.025), t = 0.5 * 2.975 + 100 * h + 1e-6; cases.push([`${arm} removes just under half at its interval's bottom: ${n} FALSIFIED`, run(armOver(arm, t))[n].outcome, 'FALSIFIED']); }
    cases.push([`${arm} removes all in world 0, nothing in world 1: ${n} INCONCLUSIVE`, run(armOver(arm, 3, [1]))[n].outcome, 'INCONCLUSIVE']);
    cases.push([`${n} reads worlds 0 and 1, not 2 (world 2 unremoved): ${n} HELD`, run(armOver(arm, 3, [2]))[n].outcome, 'HELD']);
    cases.push([`BASE's over-read under half a point in both worlds: ${n} INCONCLUSIVE`, run(s => setT(s, 'S364', 'BASE', 'P', 0.5249, [0, 1]))[n].outcome, 'INCONCLUSIVE']); EDGES.push('no world counted');
    cases.push([`BASE's over-read exactly half a point (counted), the arm removing all: ${n} HELD`, run(s => setT(s, 'S364', 'BASE', 'P', 0.525, [0, 1]))[n].outcome, 'HELD']); EDGES.push('an over-read exactly half a point');
    cases.push([`world 1 not counted, world 0 removed: ${n} HELD`, run(s => setT(s, 'S364', 'BASE', 'P', 0.3, [1]))[n].outcome, 'HELD']);
  }
  // item 3: bridge 4's own opening (P) under each arm, runs at 2,000 of 4,000 (50)
  cases.push(['bridge 4 at its runs under both arms: 3 HELD', run(s => {})['3'].outcome, 'HELD']);
  cases.push(['bridge 4 under RS exactly 0.3 over at the point: 3 HELD', run(s => setT(s, 'bridge 4', 'RS', 'OWN', 50.3))['3'].outcome, 'HELD']); EDGES.push('a control exactly 0.3 off');
  cases.push(['bridge 4 under RZ 0.4 over in world 1, not shown: 3 INCONCLUSIVE', run(s => setT(s, 'bridge 4', 'RZ', 'OWN', 50.4, [1]))['3'].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 under RS 3 under in world 2: 3 FALSIFIED', run(s => setT(s, 'bridge 4', 'RS', 'OWN', 47, [2]))['3'].outcome, 'FALSIFIED']);
  cases.push(['3 reads the own opening at D where it is D (D runs at its table): 3 HELD', run(s => { const j = jt(s, 'bridge 4', 'RZ'); j.own.ai = j.pair.D; for (const k of [0, 1, 2]) j.sims[`D${k}`] = { ok: 1880, n: N }; setT(s, 'bridge 4', 'RZ', 'OWN', 47); })['3'].outcome, 'HELD']);
  // item 4: S380 against B1's 50
  cases.push(['S380 at B1\'s tables: 4 HELD', run(s => {})['4'].outcome, 'HELD']);
  cases.push(['S380 under RS 0.3 off at D in world 1: 4 HELD', run(s => setT(s, 'S380', 'RS', 'D', 50.3, [1]))['4'].outcome, 'HELD']); EDGES.push('a table exactly 0.3 off');
  cases.push(['S380 under RZ 0.45 off at P in world 0: 4 INCONCLUSIVE', run(s => setT(s, 'S380', 'RZ', 'P', 49.55, [0]))['4'].outcome, 'INCONCLUSIVE']);
  cases.push(['S380 under RS exactly 0.6 off at P in world 1: 4 FALSIFIED', run(s => setT(s, 'S380', 'RS', 'P', 50.6, [1]))['4'].outcome, 'FALSIFIED']); EDGES.push('a table exactly 0.6 off');
  cases.push(['S380 under RS 0.1 + 0.2 off (0.3 to the rounding): 4 HELD', run(s => { s.B1[1].D = 0; setT(s, 'S380', 'RZ', 'D', 0, [1]); setT(s, 'S380', 'RS', 'D', 0.1 + 0.2, [1]); })['4'].outcome, 'HELD']); EDGES.push('a difference at 0.3 only after rounding');
  cases.push(['4 reads worlds 0 and 1 only (world 2 off by 5): 4 HELD', run(s => setT(s, 'S380', 'RZ', 'P', 45, [2]))['4'].outcome, 'HELD']);
  // items 5 and 6: S364's own opening (OWN) against P, bits planted; P runs at 40 of 4,000 (1 point: margin a tenth = 0.1)
  const openWith = (arm, lostBy, savedBy = [0, 0, 0]) => s => {
    const j = jt(s, 'S364', arm); j.own.ai = 8;
    for (const k of [0, 1, 2]) { const p = ones(N, 40), o = Uint8Array.from(p); for (let i = 0; i < lostBy[k]; i++) o[i] = 0; for (let i = 0; i < savedBy[k]; i++) o[40 + i] = 1; j.bits[`P${k}`] = p; j.bits[`OWN${k}`] = o; j.sims[`P${k}`] = { ok: 40, n: N }; j.sims[`OWN${k}`] = { ok: o.reduce((t, x) => t + x, 0), n: N }; }
  };
  for (const [n, arm] of [['5', 'RZ'], ['6', 'RS']]) {
    cases.push([`${arm} opens at P (0 of 0): ${n} HELD`, run(s => {})[n].outcome, 'HELD']); EDGES.push(`${arm}: 0 of 0 discordant`);
    cases.push([`${arm}'s own opening loses 40 of 4,000 in world 2: ${n} FALSIFIED`, run(openWith(arm, [0, 0, 40]))[n].outcome, 'FALSIFIED']);
    cases.push([`${arm}'s own opening loses 2 in world 1, inside the tenth margin: ${n} HELD`, run(openWith(arm, [0, 2, 0]))[n].outcome, 'HELD']);
    cases.push([`${arm}'s own opening loses 4 in world 1, at the margin, not shown: ${n} INCONCLUSIVE`, run(openWith(arm, [0, 4, 0]))[n].outcome, 'INCONCLUSIVE']); EDGES.push(`${arm}: a loss exactly at the tenth margin`);
    cases.push([`${arm}'s own opening gains 3 in each world: ${n} HELD`, run(openWith(arm, [0, 0, 0], [3, 3, 3]))[n].outcome, 'HELD']);
  }
  for (const [n, arm] of [['5', 'RZ'], ['6', 'RS']]) {
    cases.push([`${arm} opens at P where P survives none in world 0 (0 of 0 at a zero margin): ${n} HELD`, run(s => { const j = jt(s, 'S364', arm); j.sims.P0 = { ok: 0, n: N }; j.bits.P0 = new Uint8Array(N); })[n].outcome, 'HELD']);
    cases.push([`${arm}'s own opening loses 5 in world 1, beyond the margin but not shown after Holm: ${n} INCONCLUSIVE`, run(openWith(arm, [0, 5, 0]))[n].outcome, 'INCONCLUSIVE']);
  }
  { const o = run(openWith('RZ', [0, 0, 40])).baseOpening; cases.push(['the BASE control is read from BASE\'s own job (unplanted: 0 of 0)', o.cells.every(c => c.b + c.c === 0), true]); }
  // the causes
  const cz = (mut, c) => run(mut).causes[c];
  cases.push(['1 HELD: R-CARRIES held', cz(s => {}, 'R-CARRIES'), 'held']);
  cases.push(['1 FALSIFIED: R-CARRIES not', cz(armOver('RZ', 3), 'R-CARRIES'), 'not']);
  cases.push(['1 INCONCLUSIVE: R-CARRIES open', cz(armOver('RZ', 3, [1]), 'R-CARRIES'), 'open']);
  cases.push(['2 HELD: S364-RUNSCALED held', cz(s => {}, 'S364-RUNSCALED'), 'held']);
  const reachRS = r => s => { jt(s, 'S364', 'RS').probe = [0, 1, 2].map(k => ({ reach: Array.isArray(r) ? r[k] : r })); };
  cases.push(['2 FALSIFIED, 1 HELD, RS reaching 0.9: S364-RUNSCALED not', cz(s => { armOver('RS', 3)(s); reachRS(0.9)(s); }, 'S364-RUNSCALED'), 'not']);
  cases.push(['2 and 1 FALSIFIED, RS reaching exactly half: S364-RUNSCALED not', cz(s => { armOver('RS', 3)(s); armOver('RZ', 3)(s); reachRS(0.5)(s); }, 'S364-RUNSCALED'), 'not']); EDGES.push('an RS reach exactly at half');
  cases.push(['2 FALSIFIED, 1 HELD, RS reaching 0.4999: S364-RUNSCALED open', cz(s => { armOver('RS', 3)(s); reachRS(0.4999)(s); }, 'S364-RUNSCALED'), 'open']);
  cases.push(['2 FALSIFIED, 1 HELD, no probe: S364-RUNSCALED open', cz(armOver('RS', 3), 'S364-RUNSCALED'), 'open']);
  cases.push(['2 FALSIFIED, 1 HELD, RS reaching world 0 only: S364-RUNSCALED open', cz(s => { armOver('RS', 3)(s); reachRS([0.9, 0.1, 0.9])(s); }, 'S364-RUNSCALED'), 'open']);
  cases.push(['2 FALSIFIED, 1 HELD, world 1 not counted, RS reaching world 0: S364-RUNSCALED not', cz(s => { armOver('RS', 3)(s); setT(s, 'S364', 'BASE', 'P', 0.3, [1]); setT(s, 'S364', 'RS', 'P', 0.3, [1]); reachRS([0.9, 0.1, 0.9])(s); }, 'S364-RUNSCALED'), 'not']);
  cases.push(['2 FALSIFIED, 1 INCONCLUSIVE, RS reaching 0.9: S364-RUNSCALED open', cz(s => { armOver('RS', 3)(s); armOver('RZ', 3, [1])(s); reachRS(0.9)(s); }, 'S364-RUNSCALED'), 'open']);
  cases.push(['2 INCONCLUSIVE: S364-RUNSCALED open', cz(armOver('RS', 3, [1]), 'S364-RUNSCALED'), 'open']);
  // the read end to end
  { const st = base(); let lines = [], err = null; try { lines = report(st.J, st.B1, bitsOf); } catch (e) { err = e.message; }
    const oc = lines.find(l => l.startsWith('OUTCOME: ')) || '';
    cases.push(['the read prints every item, both causes and an OUTCOME line of six items, end to end', err || `${['1.', '2.', '3.', '4.', '5.', '6.'].every(p => lines.some(l => l.startsWith(p)))} ${lines.filter(l => l.startsWith('=> ')).length} ${oc.split(', ').length}`, 'true 2 6']); }
  // the gate, on a synthetic log built as the audit prints
  const jobText = (jb, o = {}) => {
    const [id, arm, pts0, sh, qn] = jb, L = jobLabel(jb), pad = ''.padEnd(16), pts = o.pts || Math.max(4, Math.round(pts0 / 30)), [P, D] = PAIRS[id], own = o.own !== undefined ? o.own : P, npw = 4;
    const ran = o.ran || `bridgeRead reader bridgeStep exact readerSplit ${o.split || SPLIT[arm]} readerBlend ${o.blend || 'null'} readerRef plan readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls ${o.e3 || 'true'} switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix ${o.mix || 3} pts ${o.ranPts || pts} grid ${o.grid || `total${pts}x${sh}x${sh}`} floor ${o.floor !== undefined ? o.floor : FLOORS[id]} line ${o.line || 0.5}`;
    const out = [`${id.padEnd(16)} case | job ${L} | points ${pts} | lambda 0.0223606797749979`, `${pad} solve CAND ${L}: table 3.0 secs 1`, `${pad} ran CAND ${L}: ${ran}`,
      `${pad} reader ${L}: tables 1 unsupported 0 copied 0 copiedTop 0 nodes 1; clamps n ${o.clampN || 0} lo 0 hi 0`, `${pad} checks ${L}: armTook ${o.armTook !== undefined ? o.armTook : 1}/1`,
      `${pad} pair ${L}: P ai ${o.P !== undefined ? o.P : P} level 0.8 tiers 0,0; D ai ${D} level 0.8 tiers ${o.tD || '2,2'}`, `${pad} checks ${L}: pairTook ${o.pairTook !== undefined ? o.pairTook : 1}/1`, `${pad} openings ${L}: OWN ai ${own} level 0.8 tiers 0,0`];
    if (!o.dropTable) for (let k = 0; k < 3; k++) out.push(`${pad} tables ${L} ${k} z 0 weight ${WEIGHTS[k].toFixed(6)}: P ${o.tableP || '3.000000'} D 3.000000 OWN 3.000000`);
    if (PROBED.has(key(id, L)) && !o.dropProbe) for (let k = 0; k < 3; k++) out.push(`${pad} probe ${L} ${k} P: reads 9 pr 1.0e-4 plain 3.000000 deletion ${o.probeDel || '1.000000'} residual 2.000000 | sup w 0.100000 p 0.6 S 0.7 c 1 R 0.1 | clip w 0.200000 p 0.6 S 0.9 c 1 R 0.3 | copy w ${o.copyW || '0.700000'} p 0.01 S 0.04 c 1 R 0.03 | rs reach ${o.reach || '0.900000'} rweight 2.000000`);
    for (let k = 0; k < 3; k++) for (const [nm, ai] of [['P', P], ['D', D], ...(own !== P && own !== D ? [['OWN', own]] : [])]) if (!(o.dropRun === `${nm}${k}`)) out.push(`${pad} sim ${L} ${k} ${nm} ai ${ai}: ${o.ok || 2}/${o.runN || npw} bits ${o.bits || 'b'.repeat(16)}`);
    out.push(`${pad} checks ${L}: forceIdentity ${o.fi !== undefined ? o.fi : 4}/${o.fiN || 4} secs 1`, `${pad} file ${L}: f-${id.replace(/ /g, '_')}-${arm}`);
    if (!o.dropDone) out.push(`${pad} done ${L}`);
    return `stamp: code ${o.code || 'c0'} audit a0 prediction ${PRED} sha s0\nNE-EDGE: the candidate's own unit, ${o.npw || 4} paths a world, wealth points divided by ${o.scale || 30} (seed ${o.seed || 7002}); 7 jobs; part 0/1\n${out.join('\n')}\n`;
  };
  const all = (mod = {}) => JOBS.map(jb => parse(jobText(jb, mod[key(jb[0], jobLabel(jb))] || {}))).flat();
  const K = (id, L) => key(id, L);
  const refuses = (what, jobs, opts = {}) => cases.push([`the gate refuses ${what}`, gate(jobs, { npw: 4, scale: 30, ...opts }).length > 0, true]);
  cases.push(['the gate passes the seven jobs as registered', gate(all(), { npw: 4, scale: 30 }).length, 0]);
  refuses('a missing job', all().filter(j => j.label !== 'RS/P60S6Q5' || j.id !== 'S380'));
  refuses('a job run twice', [...all(), ...all().filter(j => j.id === 'S364' && j.arm === 'RZ')]);
  refuses('a job with no done line', all({ [K('S364', 'RS/P60S6Q5')]: { dropDone: true } }));
  refuses('a stamp from other code', all({ [K('bridge 4', 'RZ/P60S6Q5')]: { code: 'c1' } }));
  refuses('another seed', all({ [K('S380', 'RZ/P60S6Q5')]: { seed: 7013 } }));
  refuses('another path count in the head', all({ [K('S380', 'RZ/P60S6Q5')]: { npw: 5 } }));
  refuses('another scale in the head', all({ [K('S380', 'RZ/P60S6Q5')]: { scale: 15 } }));
  refuses('a job solved at other points', all({ [K('S364', 'RZ/P60S6Q5')]: { pts: 5 } }));
  refuses('a case line at other points than its ran line', all({ [K('S364', 'RZ/P60S6Q5')]: { pts: 5, ranPts: 4, grid: 'total4x6x6' } }));
  refuses('a ran line at other points than its job', all({ [K('S364', 'RZ/P60S6Q5')]: { ranPts: 5 } }));
  refuses('a job on another grid', all({ [K('S364', 'RZ/P60S6Q5')]: { grid: 'total4x12x12' } }));
  refuses('a job on other worlds', all({ [K('S364', 'RZ/P60S6Q5')]: { mix: 5 } }));
  refuses('armTook 0', all({ [K('S364', 'RS/P60S6Q5')]: { armTook: 0 } }));
  refuses('RS whose solve carries RZ', all({ [K('S364', 'RS/P60S6Q5')]: { split: 'rz' } }));
  refuses('RZ whose solve carries no split', all({ [K('bridge 4', 'RZ/P60S6Q5')]: { split: 'null' } }));
  refuses('BASE carrying a split', all({ [K('S364', 'BASE/P60S6Q5')]: { split: 'rs' } }));
  refuses('a job under the log-odds blend', all({ [K('S380', 'RS/P60S6Q5')]: { blend: 'logodds' } }));
  refuses('the candidate without e3pcls', all({ [K('S380', 'RS/P60S6Q5')]: { e3: 'false' } }));
  refuses('another minimum end pot', all({ [K('S364', 'RS/P60S6Q5')]: { floor: 0 } }));
  refuses('another support line', all({ [K('S364', 'RS/P60S6Q5')]: { line: 0.25 } }));
  refuses('a probed job with no probe', all({ [K('S364', 'RZ/P60S6Q5')]: { dropProbe: true } }));
  refuses('a probe whose weights do not sum to 1', all({ [K('S364', 'RS/P60S6Q5')]: { copyW: '0.690000' } }));
  refuses('a probe breaking plain = deletion + residual', all({ [K('S364', 'BASE/P60S6Q5')]: { probeDel: '1.001000' } }));
  refuses('a probe whose RS reach is not a share', all({ [K('S364', 'RS/P60S6Q5')]: { reach: '1.200000' } }));
  refuses('pairTook 0', all({ [K('S364', 'RS/P60S6Q5')]: { pairTook: 0 } }));
  refuses('a forced pair at other tiers', all({ [K('S364', 'RS/P60S6Q5')]: { tD: '1,1' } }));
  refuses('a forced pair at another action', all({ [K('S364', 'RS/P60S6Q5')]: { P: 11, own: 11 } }));
  refuses('a missing world table', all({ [K('S380', 'RS/P60S6Q5')]: { dropTable: true } }));
  refuses('a missing D run in world 2', all({ [K('S380', 'RS/P60S6Q5')]: { dropRun: 'D2' } }));
  refuses('runs on other paths than registered', all({ [K('S380', 'RS/P60S6Q5')]: { runN: 5 } }));
  refuses('an own opening that is neither P nor D, unrun', (() => { const js = all(); const j = js.find(x => x.id === 'S364' && x.arm === 'RS'); j.own.ai = 3; return js; })());
  refuses('LOR reads counted', all({ [K('S380', 'RZ/P60S6Q5')]: { clampN: 4 } }));
  refuses('a forceIdentity one path short', all({ [K('S364', 'RS/P60S6Q5')]: { fi: 3 } }));
  refuses('a forceIdentity over too few paths', all({ [K('S364', 'RS/P60S6Q5')]: { fi: 3, fiN: 3 } }));
  // the identity control against NE-GRID C's S364 BASE job
  const refOf = jobs => { const j = jobs.find(x => x.id === 'S364' && x.arm === 'BASE'); return { tables: j.tables, sims: j.sims }; };
  cases.push(['the gate passes S364 BASE as NE-GRID C\'s', gate(all(), { npw: 4, scale: 30, refC: refOf(all()) }).length, 0]);
  refuses('S364 BASE whose table is not C\'s by a printed digit', all({ [K('S364', 'BASE/P60S6Q5')]: { tableP: '3.000001' } }), { refC: refOf(all()) }); EDGES.push('an identity off by one printed digit');
  refuses('S364 BASE whose runs are not C\'s', all({ [K('S364', 'BASE/P60S6Q5')]: { ok: 3 } }), { refC: refOf(all()) });
  refuses('S364 BASE whose bits are not C\'s', all({ [K('S364', 'BASE/P60S6Q5')]: { bits: 'c'.repeat(16) } }), { refC: refOf(all()) });
  // the files
  const filesOf = (jobs, code = 'c0', drop = null) => Object.fromEntries(jobs.map(j => [j.file, { stamp: { code, audit: 'a0', prediction: PRED }, bits: Object.fromEntries(Object.keys(j.sims).filter(nm => nm !== drop).map(nm => [nm, 'AAAA'])) }]));
  { const js = all(); const fs = filesOf(js); const s = sha16(Buffer.from('AAAA', 'base64')); for (const j of js) for (const x of Object.values(j.sims)) x.bits = s;
    cases.push(['the gate passes files whose bits are the log\'s', gate(js, { npw: 4, scale: 30, files: fs }).length, 0]);
    refuses('a missing file', js, { files: Object.fromEntries(Object.entries(fs).slice(1)) });
    refuses('a file missing one run\'s bits', js, { files: filesOf(js, 'c0', 'D1') });
    refuses('a file stamped by other code', js, { files: filesOf(js, 'X') });
    { const js2 = all(); for (const j of js2) for (const x of Object.values(j.sims)) x.bits = s; js2[0].sims.P0.bits = 'f'.repeat(16); refuses('a file whose bits are not the log\'s', js2, { files: filesOf(js2) }); } }
  let failed = 0;
  for (const [what, got, want] of cases) {
    const okc = String(got) === String(want); if (!okc) failed++; console.log(`${okc ? 'ok  ' : 'FAIL'} ${what}: ${JSON.stringify(got)}`);
    const m = /: (\d+) (HELD|INCONCLUSIVE|FALSIFIED)$/.exec(what); if (m && !REACHED[m[1]]) { failed++; console.log(`FAIL a case names item ${m[1]}, not one of the items`); } else if (okc && m) REACHED[m[1]].add(m[2]);
  }
  if (failed) { console.log(`PLANTED CHECK FAILED: ${failed} of ${cases.length}`); process.exit(1); }
  const short = ITEMS.filter(i => REACHED[i].size !== 3);   // every item planted to all three of its outcomes
  if (short.length) { console.log(`PLANTED CHECK FAILED: item ${short.join(', ')} not planted to all three outcomes`); process.exit(1); }
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
  const DIR = args[0] || join(HERE, 'results', 'diagneedge'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const gz = d => Object.fromEntries(readdirSync(d).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(d, f))).toString())]));
  const files = gz(DIR);
  let refC = null, B1S380 = null;
  const bad = [];
  if (!PRE) {
    // NE-GRID C's S364 BASE job, behind C's own gate; NE-GRID B1's S380 BASE 60-point tables, behind B1's
    const C = await import('./reduce-negrid-c.mjs'), B = await import('./reduce-negrid-b1.mjs');
    const rd = d => Object.fromEntries(readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(d, f), 'utf8')]));
    const DC = join(HERE, 'results', 'diagnegridc'), logsC = rd(DC);
    if (!requireFairLogs(logsC, C.PRED, { exit: false })) bad.push('NE-GRID C\'s files did not pass the fair-test gate');
    const cJobs = Object.values(logsC).flatMap(C.parse), badC = C.gate(cJobs, { files: gz(DC) });
    if (badC.length) bad.push(`NE-GRID C's gate refused: ${badC.join('; ')}`);
    else { const c = cJobs.find(j => j.id === 'S364' && j.label === 'BASE/P60S6Q5'); refC = { tables: c.tables.map(x => ({ ...x, raw: [x.P, x.D, x.OWN].map(v => v.toFixed(6)) })), sims: c.sims }; }
    const DB1 = join(HERE, 'results', 'diagnegrid'), logsB1 = rd(DB1);
    if (!requireFairLogs(logsB1, 'research/solver/predictions/diag-negrid-b1.md', { exit: false })) bad.push('NE-GRID B1\'s files did not pass the fair-test gate');
    const b1Jobs = Object.values(logsB1).flatMap(B.parse), rf = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : null);
    const badB1 = B.gate(b1Jobs, { files: gz(DB1), rec: B.records(rf('results-neblend-a.txt'), rf('results-neroot.txt')) });
    if (badB1.length) bad.push(`NE-GRID B1's gate refused: ${badB1.join('; ')}`);
    else B1S380 = b1Jobs.find(j => j.id === 'S380' && j.arm === 'BASE' && j.grid === 'fine').tables.map(x => ({ P: x.P, D: x.D }));
  }
  bad.push(...gate(jobs, { npw: npwA, scale: scaleA, files, refC }));
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the seven jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); every job's split in its solve's meta; every self-check passed (armTook, pairTook, forceIdentity on world 0's first 1,000 paths); every probe whole; every file the log's${PRE ? '' : '; S364 BASE reproduces NE-GRID C\'s job to the printed digits and bits'}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.label), j]));
  const bitsOf = (j, nm) => Buffer.from(files[j.file].bits[nm], 'base64');
  console.log('\nNE-EDGE: the near-dead read, S364 under BASE, RZ and RS at 60 points, bridge 4 and S380 under RZ and RS, the tuning seed (predictions/diag-needge.md)');
  for (const L of report(J, B1S380, bitsOf)) console.log(L);
}
