/*
 * NE-GRID C's reducer (predictions/diag-negrid-c.md; PLAN.md NE-GRID-C; audit-negridc.mjs). The gate runs first and refuses
 * any log it cannot vouch for; the items are read only by their registered rules.
 * THE GATE: the twelve jobs once and done, one stamp (code, audit, prediction) across the logs and in every file; the
 *   registered settings (each job's points, shares and return nodes, paths a world, seed); each job's settings in its
 *   solve's meta and the candidate's others intact (armTook, the ran line); the forced pair at the registered actions and
 *   tiers (pairTook); three world tables a job; P's and D's runs (and the own opening's where it is neither) of the
 *   registered paths in every world, P's at four times the paths where registered, their bits the file's; forceIdentity
 *   on world 0's first 1,000 paths; no LOR read counted off the LOR job; and NE-GRID B1's records (results/diagnegrid,
 *   behind B1's own gate) read for the coarse and fine tables the items set C's beside.
 * THE ITEMS (ALPHA 0.05; each world's runs bounded by their exact interval one-sided at ALPHA / 6; every threshold read on
 *   the figure rounded to 1e-9):
 *   1. The wealth axis converges at second order: at P and D, worlds 0 and 1, for S380 under BASE and LOR and S224 under
 *      BASE, m1 = the table at 60 points less at 30 (B1's), m2 = at 120 less at 60; a cell counted where |m1| is at least
 *      half a point; HELD when every counted |m2| / |m1| is at most 0.35; FALSIFIED when every one is at least 0.5;
 *      INCONCLUSIVE otherwise, or with none counted. Deterministic.
 *   2. S224's under-read stays at 120 points (O145): its table at P less P's runs on 16,000 paths a world, worlds 0 and 1;
 *      HELD when a world's interval lies wholly below -0.5; FALSIFIED when both worlds' points lie within 0.5 of 0;
 *      INCONCLUSIVE otherwise.
 *   3, 4. What carries S224's 60-point under-read (B1's table at P less its runs, worlds 0 and 1, where at least half a
 *      point under): 3 15 return nodes, 4 12 shares, each at 60 points; the table at P's rise from B1's 60-point table
 *      against the under-read; HELD when it rises by at least half the under-read in every counted world; FALSIFIED when
 *      by under a fifth of it in every one; INCONCLUSIVE otherwise, or with none counted. Deterministic.
 *   5, 6, 7. What carries S364's over-read at 60 points (C's S364 at 60 points and 6 shares: its table at P less P's runs,
 *      worlds 0 and 1, where at least half a point over): 5 12 shares, 6 120 points, 7 ORDER (at 60 points, 6
 *      shares); the table at P's fall from the baseline against the over-read; HELD when it falls by at least half the
 *      over-read in every counted world; FALSIFIED when by under a fifth in every one; INCONCLUSIVE otherwise, or with none.
 *   8. Bridge 4 at 120 points (the control): its own opening, every world's table less its runs within 0.3 points at the
 *      point (HELD); FALSIFIED when a world's interval lies wholly outside [-0.3, 0.3]; INCONCLUSIVE otherwise.
 * THE CAUSES each item decides, by the registered map (printed '=> <cause> held / not / open'): RG-WSLOW held on item 1
 *   FALSIFIED, not on HELD; RG-PATHS held on item 2 FALSIFIED with B1's 4,000-path under-read at least half a point in a
 *   world, not on item 2 HELD; RG-UNMASK held on item 2 HELD with 3 or 4 HELD, not on item 2 FALSIFIED; S364-SHARE,
 *   S364-W and S364-REF held on 5, 6 and 7 HELD, not on FALSIFIED; open otherwise.
 * REPORTED: every job's tables, own opening, runs and reader counts; S224's and S380's 120-point P against the first 4,000
 *   paths (B1's paths) and the other 12,000; each household's 120-point policy against its 60-point one at P on B1's paths.
 *   node research/solver/reduce-negrid-c.mjs [dir] [paths a world] [scale] > research/solver/results-negrid-c.txt   (--preflight, --planted)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson, survivalChangeU } from './stats.mjs';
import { parse as parseB1, gate as gateB1, records as recordsB1, key as keyB1 } from './reduce-negrid-b1.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-negrid-c.md';
export const SEED = '7002', NPW = 4000, ALPHA = 0.05;
export const GMIN = 0.5, SECOND = 0.35, FIRST = 0.5, UNDER = 0.5, CARRY = 0.5, LITTLE = 0.2, CTRL = 0.3, REACH = 0.5;
export const WEIGHTS = [1 / 6, 2 / 3, 1 / 6];
export const PAIRS = Object.freeze({ S380: [12, 14], 'bridge 4': [57, 59], S224: [0, 2], S364: [12, 14] });
export const JOBS = [['S380', 'BASE', 120, 6, 5, 4], ['S224', 'BASE', 120, 6, 5, 4], ['S224', 'BASE', 120, 6, 5, 4, { floor: 0 }], ['S364', 'BASE', 60, 12, 5, 1], ['S224', 'BASE', 60, 12, 5, 1],
  ['S380', 'LOR', 120, 6, 5, 1], ['bridge 4', 'BASE', 120, 6, 5, 1], ['S364', 'BASE', 120, 6, 5, 1], ['S224', 'BASE', 60, 6, 15, 1],
  ['S364', 'BASE', 60, 6, 5, 1], ['S364', 'BASE', 60, 6, 5, 1, { line: 0.25 }], ['S364', 'ORDER', 60, 6, 5, 1]];
export const jobLabel = ([, arm, pts, sh, qn, , ch = {}]) => `${arm}/P${pts}S${sh}Q${qn}${ch.floor === 0 ? 'F0' : ''}${ch.line ? `L${Math.round(ch.line * 100)}` : ''}`;
export const PROBED = new Set(['S364 BASE/P60S6Q5', 'S364 BASE/P60S6Q5L25', 'S380 BASE/P120S6Q5']);
// each household's minimum end pot, the solver's survival cliff at the end of the plan: the one solvePlan sets (the plan's
// own, else one year's target spend), read from the model's context by M.prepare on 12 Oct (audit-negridc.mjs's FLOORS)
export const FLOORS = Object.freeze({ S380: 52500, 'bridge 4': 29000, S224: 430000, S364: 205000 });
export const key = (id, label) => `${id} ${label}`;
export const q = x => Math.round(x * 1e9) / 1e9;
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const CASEL = /^(bridge 4|S380|S224|S364)\s+case \| job ((BASE|LOR|ORDER)\/P(\d+)S(\d+)Q(\d+)(?:F0)?(?:L\d+)?) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^NE-GRID C: .*, (\d+) paths a world .*divided by (\d+(?:\.\d+)?) \(seed (\d+)\)/;
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
    else if ((m = new RegExp(`^reader ${esc(L)}: tables (\\S+) unsupported (\\S+) copied (\\S+) copiedTop (\\S+) nodes (\\S+); clamps n (\\d+) lo (\\d+) hi (\\d+)$`).exec(l))) j.reader = { tables: m[1], unsupported: m[2], copied: m[3], copiedTop: m[4], nodes: m[5], clampN: Number(m[6]) };
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^pair ${esc(L)}: P ai (\\d+) level (\\S+) tiers (\\S+); D ai (\\d+) level (\\S+) tiers (\\S+)$`).exec(l))) j.pair = { P: Number(m[1]), D: Number(m[4]), tP: m[3], tD: m[6], lP: m[2], lD: m[5] };
    else if ((m = /OWN ai (\d+) level (\S+) tiers (\S+)/.exec(l)) && l.startsWith(`openings ${L}:`)) j.own = { ai: Number(m[1]), level: m[2], tiers: m[3] };
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): P (\\S+) D (\\S+) OWN (\\S+)$`).exec(l))) j.tables.push({ k: Number(m[1]), weight: Number(m[3]), P: Number(m[4]), D: Number(m[5]), OWN: Number(m[6]) });
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) (P|D|OWN) ai (\\d+): (\\d+)/(\\d+) bits (\\S+)$`).exec(l))) j.sims[`${m[2]}${m[1]}`] = { ai: Number(m[3]), ok: Number(m[4]), n: Number(m[5]), bits: m[6] };
    else if ((m = new RegExp(`^probe ${esc(L)} (\\d) P: reads (\\d+) pr (\\S+) plain (\\S+) deletion (\\S+) residual (\\S+) \\| sup w (\\S+) p (\\S+) S (\\S+) c (\\S+) R (\\S+) \\| clip w (\\S+) p (\\S+) S (\\S+) c (\\S+) R (\\S+) \\| copy w (\\S+) p (\\S+) S (\\S+) c (\\S+) R (\\S+)$`).exec(l))) { const n = m.slice(2).map(Number); (j.probe = j.probe || [])[Number(m[1])] = { reads: n[0], pr: n[1], plain: n[2], del: n[3], res: n[4], sup: n.slice(5, 10), clip: n.slice(10, 15), copy: n.slice(15, 20) }; }
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerSplit: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001' };
const BLEND = { BASE: 'null', LOR: 'logodds', ORDER: 'null' };
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], byKey = {};
  for (const j of jobs) { const k = key(j.id, j.label); (byKey[k] = byKey[k] || []).push(j); }
  for (const jb of JOBS) { const k = key(jb[0], jobLabel(jb)), n = (byKey[k] || []).length; if (n !== 1) bad.push(`${k}: ${n ? 'run ' + n + ' times' : 'missing'}`); }
  const st0 = jobs[0] && jobs[0].stamp, fi = Math.min(npw, 1000);
  for (const j of jobs) {
    const k = key(j.id, j.label), reg = JOBS.find(jb => jb[0] === j.id && jobLabel(jb) === j.label);
    if (!reg) { bad.push(`${k}: not a registered job`); continue; }
    const pts = Math.max(4, Math.round(reg[2] / scale)), mult = reg[5];
    if (!j.done) bad.push(`${k}: no done line`);
    if (!j.stamp || !st0 || ['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])) bad.push(`${k}: its stamp is not the other logs'`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${k}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${k}: solved at ${j.pts} points, not ${pts}`);
    if (!j.checks.armTook || j.checks.armTook[0] !== 1) bad.push(`${k}: armTook did not pass`);
    if (!j.checks.pairTook || j.checks.pairTook[0] !== 1) bad.push(`${k}: pairTook did not pass`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, readerBlend: BLEND[j.arm] })) if (field(ran, f) !== v) bad.push(`${k}: ${f} is ${field(ran, f)}, not ${v}`);
    if ((j.arm === 'ORDER') !== (field(ran, 'readerRef') === 'order')) bad.push(`${k}: readerRef is ${field(ran, 'readerRef')}`);
    if (field(ran, 'pts') !== String(pts)) bad.push(`${k}: not solved at ${pts} points`);
    if (field(ran, 'grid') !== `total${pts}x${reg[3]}x${reg[3]}`) bad.push(`${k}: its grid is ${field(ran, 'grid')}, not ${pts} x ${reg[3]} x ${reg[3]}`);
    if (field(ran, 'mix') !== '3') bad.push(`${k}: not three worlds`);
    const ch = reg[6] || {};
    if (field(ran, 'floor') !== String(ch.floor === 0 ? 0 : FLOORS[j.id])) bad.push(`${k}: its minimum end pot is ${field(ran, 'floor')}, not ${ch.floor === 0 ? 0 : FLOORS[j.id]}`);
    if (field(ran, 'line') !== String(ch.line || 0.5)) bad.push(`${k}: its support line is ${field(ran, 'line')}, not ${ch.line || 0.5}`);
    if (PROBED.has(k)) { const pb = j.probe || []; if ([0, 1, 2].some(w => !pb[w] || !(pb[w].reads > 0))) bad.push(`${k}: the probe logged no reads in a world`); else for (const [w, x] of pb.entries()) { if (Math.abs(x.sup[0] + x.clip[0] + x.copy[0] - 1) > 1e-5) bad.push(`${k}: world ${w}'s probe weights do not sum to 1`); if (Math.abs(x.plain - x.del - x.res) > 1e-4) bad.push(`${k}: world ${w}'s probe breaks plain = deletion + residual`); } }
    if (!j.pair || j.pair.P !== PAIRS[j.id][0] || j.pair.D !== PAIRS[j.id][1] || j.pair.tP !== '0,0' || j.pair.tD !== '2,2' || j.pair.lP !== j.pair.lD) bad.push(`${k}: the forced pair is not the registered one`);
    if (!j.own) bad.push(`${k}: the openings line is missing or unread`);
    if (!j.reader) bad.push(`${k}: the reader line is missing`);
    else if (j.arm !== 'LOR' && j.reader.clampN !== 0) bad.push(`${k}: ${j.reader.clampN} LOR reads counted off the LOR job`);
    if (j.tables.length !== 3 || j.tables.some((x, i) => x.k !== i)) bad.push(`${k}: not three world tables`);
    const need = [['P', npw * mult], ['D', npw], ...(j.own && j.pair && j.own.ai !== j.pair.P && j.own.ai !== j.pair.D ? [['OWN', npw]] : [])];
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
  return bad;
}

const a1 = ALPHA / 6;
export function offOf(table, ok, n) { const [l, h] = clopperPearson(ok, n, 2 * a1); return { d: table - 100 * ok / n, lo: table - 100 * h, hi: table - 100 * l }; }
const read3 = (cells, hold, fals) => { const cc = cells.filter(c => c.counted); return cc.length && cc.every(hold) ? 'HELD' : cc.length && cc.every(fals) ? 'FALSIFIED' : 'INCONCLUSIVE'; };
/* B1 = { S380: { BASE: { coarse, fine }, LOR: {...} }, S224: { BASE: {...} } } of tables by world { P, D }, and B1's S224 fine
   P runs ({ ok, n } by world) */
export function items(J, B1, b1Runs224, extra) {
  const out = {}, jt = (id, label) => J[key(id, label)];
  // item 1: convergence, m2 against m1, on the candidate's read (BASE: the plan-auditor's MINOR 3 of 12 Oct 08:12 UK); LOR's
  // cells computed alike and reported
  const cells = [], lorCells = [];
  for (const [id, arm, label] of [['S380', 'BASE', 'BASE/P120S6Q5'], ['S224', 'BASE', 'BASE/P120S6Q5'], ['S380', 'LOR', 'LOR/P120S6Q5']]) for (const o of ['P', 'D']) for (const k of [0, 1]) {
    const t30 = B1[id][arm].coarse[k][o], t60 = B1[id][arm].fine[k][o], t120 = jt(id, label).tables[k][o], m1 = t60 - t30, m2 = t120 - t60;
    const counted = q(Math.abs(m1)) >= GMIN;
    (arm === 'LOR' ? lorCells : cells).push({ id, arm, o, k, t30, t60, t120, m1, m2, counted, r: counted ? q(Math.abs(m2) / Math.abs(m1)) : null });
  }
  out[1] = { outcome: read3(cells, c => c.r <= SECOND, c => c.r >= FIRST), cells, lorCells };
  // item 2: S224's table at P less its 16,000-path runs at 120 points, worlds 0 and 1
  const j2 = jt('S224', 'BASE/P120S6Q5'), u2 = [0, 1].map(k => { const s = j2.sims[`P${k}`]; return { k, ...offOf(j2.tables[k].P, s.ok, s.n) }; });
  out[2] = { outcome: u2.some(x => q(x.hi) < -UNDER) ? 'HELD' : u2.every(x => q(Math.abs(x.d)) <= UNDER) ? 'FALSIFIED' : 'INCONCLUSIVE', w: u2 };
  // item 3: what carries S224's 60-point under-read
  const under60 = [0, 1].map(k => { const s = b1Runs224[k]; return { k, u: B1.S224.BASE.fine[k].P - 100 * s.ok / s.n }; });
  const carry = label => { const j = jt('S224', label); const c = under60.map(x => { const rise = j.tables[x.k].P - B1.S224.BASE.fine[x.k].P, counted = q(-x.u) >= GMIN; return { k: x.k, u: x.u, rise, counted, frac: counted ? q(rise / -x.u) : null }; }); return { outcome: read3(c, x => x.frac >= CARRY, x => x.frac < LITTLE), cells: c }; };
  out['3'] = carry('BASE/P60S6Q15'); out['4'] = carry('BASE/P60S12Q5');
  // items 5-7: what carries S364's 60-point over-read
  const b4 = jt('S364', 'BASE/P60S6Q5'), over60 = [0, 1].map(k => { const s = b4.sims[`P${k}`]; return { k, o: b4.tables[k].P - 100 * s.ok / s.n }; });
  const fall = label => { const j = jt('S364', label); const c = over60.map(x => { const dropped = b4.tables[x.k].P - j.tables[x.k].P, counted = q(x.o) >= GMIN; return { k: x.k, o: x.o, dropped, counted, frac: counted ? q(dropped / x.o) : null }; }); return { outcome: read3(c, x => x.frac >= CARRY, x => x.frac < LITTLE), cells: c }; };
  out['5'] = fall('BASE/P60S12Q5'); out['6'] = fall('BASE/P120S6Q5'); out['7'] = fall('ORDER/P60S6Q5');
  out['10'] = fall('BASE/P60S6Q5L25');
  // the line's reach (the plan-auditor's BLOCKING 1 of 12 Oct 10:33 UK): the share of the 0.5 job's copied-corner weight at P
  // that the 0.25 job no longer copies, by world (the probe); a line that moves under half of it in a counted world has not
  // reached S364's copied corners there, and item 10 FALSIFIED then leaves S364-COPY open
  const pb0 = (J[key('S364', 'BASE/P60S6Q5')] || {}).probe, pbL = (J[key('S364', 'BASE/P60S6Q5L25')] || {}).probe;
  const reach = k => (pb0 && pbL && pb0[k] && pbL[k] && pb0[k].copy[0] > 0 ? q((pb0[k].copy[0] - pbL[k].copy[0]) / pb0[k].copy[0]) : null);
  const c10 = out['10'].cells.filter(c => c.counted), reaches = c10.length > 0 && c10.every(c => reach(c.k) !== null && reach(c.k) >= REACH);
  out['10'].reach = [0, 1].map(reach);
  // item 9: S224 at 120 points with its minimum end pot removed, its table at P less its 16,000-path runs, worlds 0 and 1
  const j9 = jt('S224', 'BASE/P120S6Q5F0'), u9 = [0, 1].map(k => { const s = j9.sims[`P${k}`]; return { k, ...offOf(j9.tables[k].P, s.ok, s.n) }; });
  out['9'] = { outcome: u9.every(x => q(Math.abs(x.d)) <= UNDER) ? 'HELD' : u9.some(x => q(x.hi) < -UNDER) ? 'FALSIFIED' : 'INCONCLUSIVE', w: u9 };
  // item 8: bridge 4 at 120 points, its own opening
  const j5 = jt('bridge 4', 'BASE/P120S6Q5'), o5 = j5.own.ai === j5.pair.P ? 'P' : j5.own.ai === j5.pair.D ? 'D' : 'OWN';
  const w5 = [0, 1, 2].map(k => { const s = j5.sims[`${o5}${k}`]; return { k, ...offOf(j5.tables[k][o5], s.ok, s.n) }; });
  out[8] = { outcome: w5.every(x => q(Math.abs(x.d)) <= CTRL) ? 'HELD' : w5.some(x => q(x.lo) > CTRL || q(x.hi) < -CTRL) ? 'FALSIFIED' : 'INCONCLUSIVE', o: o5, w: w5 };
  // the causes, by the registered map
  // RG-PATHS splits on the first 4,000 paths (B1's) against the 16,000: held when the 16,000 show no under-read (item 2
  // FALSIFIED) and the first 4,000 do (the table under them by more than half a point in a world); S364-W's 'not' needs
  // the 60-point over-read to keep at least half the 30-point one (NE-ROOT's) in every counted world, or the axis may have
  // carried most of it between 30 and 60 (the plan-auditor's BLOCKING 2 of 12 Oct 08:12 UK)
  const lucky = [0, 1].some(k => q(j2.tables[k].P - 100 * extra.first4k(k) / NPW) < -UNDER);
  const keepsMost = over60.every((x, k) => !(q(x.o) >= GMIN) || q(x.o) >= q(0.5 * extra.over30[k]));
  out.causes = {
    'RG-WSLOW': out[1].outcome === 'FALSIFIED' ? 'held' : out[1].outcome === 'HELD' ? 'not' : 'open',
    'RG-PATHS': out[2].outcome === 'FALSIFIED' && lucky ? 'held' : out[2].outcome === 'HELD' ? 'not' : 'open',
    'RG-UNMASK': out[2].outcome === 'HELD' && (out['3'].outcome === 'HELD' || out['4'].outcome === 'HELD') ? 'held' : out[2].outcome === 'FALSIFIED' ? 'not' : 'open',
    'S364-SHARE': { HELD: 'held', FALSIFIED: 'not' }[out['5'].outcome] || 'open',
    'S364-W': out['6'].outcome === 'HELD' ? 'held' : out['6'].outcome === 'FALSIFIED' && keepsMost ? 'not' : 'open',
    'S364-REF': { HELD: 'held', FALSIFIED: 'not' }[out['7'].outcome] || 'open',
    'RG-FLOOR': out[2].outcome === 'HELD' && out['9'].outcome === 'HELD' ? 'held' : out['9'].outcome === 'FALSIFIED' ? 'not' : 'open',
    'S364-COPY': out['10'].outcome === 'HELD' ? 'held' : out['10'].outcome === 'FALSIFIED' && reaches ? 'not' : 'open',
  };
  return out;
}

/* THE READ, from the items to the OUTCOME line, as lines: the main prints them, and a planted check runs it end to end on a
   synthetic set (the plan-auditor's BLOCKING 1 of 12 Oct 08:12 UK: a print path no check ran) */
export function report(J, B1, runs224, extra, bitsOf, b1BitsOf) {
  const L = [], f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), it = items(J, B1, runs224, extra);
  const cellsOf = cs => cs.map(c => `${c.id} ${c.arm} ${c.o} world ${c.k}: 30 ${f4(c.t30)}, 60 ${f4(c.t60)}, 120 ${f4(c.t120)}${c.counted ? ` ratio ${f4(c.r)}` : ' (not counted)'}`).join('; ');
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. the wealth axis converges at second order under BASE (|m2| / |m1| at most 0.35): ${it[1].outcome}`, `     ${cellsOf(it[1].cells)}`, `     REPORTED, LOR: ${cellsOf(it[1].lorCells)}`);
  L.push(`2. S224's under-read stays at 120 points on 16,000 paths a world: ${it[2].outcome}`, `     ${it[2].w.map(x => `world ${x.k} ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)})`).join('; ')}`);
  for (const [i, what] of [['3', '15 return nodes'], ['4', '12 shares']]) L.push(`${i}. ${what} carry S224's 60-point under-read: ${it[i].outcome}`, `     ${it[i].cells.map(c => `world ${c.k}: under-read ${f4(c.u)}, rise ${f4(c.rise)}${c.counted ? ` share ${f4(c.frac)}` : ' (not counted)'}`).join('; ')}`);
  for (const [i, what] of [['5', '12 shares'], ['6', '120 points'], ['7', 'ORDER']]) L.push(`${i}. ${what} carry S364's 60-point over-read: ${it[i].outcome}`, `     ${it[i].cells.map(c => `world ${c.k}: over-read ${f4(c.o)}, fall ${f4(c.dropped)}${c.counted ? ` share ${f4(c.frac)}` : ' (not counted)'}`).join('; ')}`);
  L.push(`9. S224 without its minimum end pot reads within half a point of its 16,000-path runs at 120 points: ${it['9'].outcome}`, `     ${it['9'].w.map(x => `world ${x.k} ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)})`).join('; ')}`);
  L.push(`10. the support line at 0.25 carries S364's 60-point over-read: ${it['10'].outcome}`, `     ${it['10'].cells.map(c => `world ${c.k}: over-read ${f4(c.o)}, fall ${f4(c.dropped)}${c.counted ? ` share ${f4(c.frac)}` : ' (not counted)'}`).join('; ')}`, `     the line's reach on the 0.5 job's copied-corner weight at P (S364-COPY's 'not' needs at least ${REACH} in every counted world): ${it['10'].reach.map((r, k) => `world ${k} ${r === null ? 'none (no probe or no copied weight)' : f4(r)}`).join(', ')}`);
  L.push(`8. bridge 4 within 0.3 points at 120 points: ${it[8].outcome}`, `     at ${it[8].o}: ${it[8].w.map(x => `world ${x.k} ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)})`).join('; ')}`);
  L.push('', 'THE CAUSES (the registered map)');
  for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);
  L.push('', 'REPORTED');
  L.push(`  S364's over-read at 30 points (NE-ROOT, results-neroot.txt) by world: ${extra.over30.map(f4).join(', ')}`);
  for (const k of PROBED) { const j = J[k]; if (!j || !j.probe) continue; for (const [w, x] of j.probe.entries()) L.push(`  probe ${k} world ${w} at P: reads ${x.reads}, mean query chance ${x.pr.toExponential(3)}; plain blend ${f4(x.plain)}, deletion ${f4(x.del)}, residual ${f4(x.res)}; ${['sup', 'clip', 'copy'].map(nm => `${nm} weight ${f4(x[nm][0])} p ${f4(x[nm][1])} S ${f4(x[nm][2])} c ${f4(x[nm][3])} R ${f4(x[nm][4])}`).join('; ')}`); }
  const sum = x => x.reduce((t, v) => t + v, 0);
  for (const id of ['S224', 'S380']) { const j = J[key(id, 'BASE/P120S6Q5')]; L.push(`  ${id} BASE at 120 points, P: ${[0, 1, 2].map(k => { const b = bitsOf(j, `P${k}`), a = b.subarray(0, NPW), r = b.subarray(NPW); return `world ${k} the first 4,000 paths ${f4(100 * sum(a) / a.length)}, the other 12,000 ${f4(r.length ? 100 * sum(r) / r.length : NaN)}, table ${f4(j.tables[k].P)}`; }).join('; ')}`); }
  for (const [id, label, arm] of [['S380', 'BASE/P120S6Q5', 'BASE'], ['S380', 'LOR/P120S6Q5', 'LOR'], ['S224', 'BASE/P120S6Q5', 'BASE'], ['bridge 4', 'BASE/P120S6Q5', 'BASE']]) {
    const j = J[key(id, label)];
    L.push(`  ${id} ${arm} at P, the 120-point policy against the 60-point one on B1's 4,000 paths: ${[0, 1, 2].map(k => { const a = b1BitsOf(id, arm, k), b = bitsOf(j, `P${k}`).subarray(0, NPW); let lost = 0, saved = 0; for (let i = 0; i < NPW; i++) { if (a[i] && !b[i]) lost++; else if (!a[i] && b[i]) saved++; } return `world ${k} ${saved} saved/${lost} lost (${f4(100 * (saved - lost) / NPW)})`; }).join('; ')}`);
  }
  L.push(`REALISED item 1: ${f4(Math.max(...it[1].cells.filter(c => c.counted).map(c => c.r)))}`);
  L.push(`REALISED item 2: ${f4(Math.min(...it[2].w.map(x => x.d)))}`);
  L.push(`OUTCOME: ${['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  return L;
}

/* PLANTED: every boundary the items, the causes and the gate turn on, read as it should, each at a value the double holds
   exactly (or rounded to it, with the overshooting case planted) */
const EDGES = [], REACHED = {};
function planted() {
  const N = NPW, cases = [], ITEMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  for (const i of ITEMS) REACHED[i] = new Set();
  const tab = (P, D, OWN = P) => [0, 1, 2].map(k => ({ k, weight: WEIGHTS[k], P: P[k], D: D[k], OWN: OWN[k] }));
  const flat = v => tab([v, v, v], [v, v, v]);
  const base = () => {
    const J = {};
    for (const jb of JOBS) { const [id, , , , , mult] = jb; J[key(id, jobLabel(jb))] = { id, label: jobLabel(jb), own: { ai: PAIRS[id][0] }, pair: { P: PAIRS[id][0], D: PAIRS[id][1] }, tables: flat(50), sims: Object.fromEntries([0, 1, 2].flatMap(k => [[`P${k}`, { ok: N * mult / 2, n: N * mult }], [`D${k}`, { ok: N / 2, n: N }]])) }; }
    // B1's records: S380 and S224 coarse 48 and fine 50 everywhere (m1 = 2); S224's fine runs at its table (no under-read)
    const g = () => ({ coarse: [0, 1, 2].map(() => ({ P: 48, D: 48 })), fine: [0, 1, 2].map(() => ({ P: 50, D: 50 })) });
    const B1 = { S380: { BASE: g(), LOR: g() }, S224: { BASE: g() } };
    return { J, B1, runs: [0, 1, 2].map(() => ({ ok: 2000, n: N })), f4k: [2000, 2000, 2000], over30: [4, 4] };
  };
  const xOf = s => ({ first4k: k => s.f4k[k], over30: s.over30 });
  const run = mut => { const s = base(); mut(s); return items(s.J, s.B1, s.runs, xOf(s)); };
  const jt = (s, id, label) => s.J[key(id, label)];
  const setP = (s, id, label, v, ks = [0, 1]) => { for (const k of ks) jt(s, id, label).tables[k].P = v; };
  // item 1: m1 = 2 everywhere; m2 sets the ratio
  const m2 = (v, cells = null) => s => { for (const [id, label] of [['S380', 'BASE/P120S6Q5'], ['S380', 'LOR/P120S6Q5'], ['S224', 'BASE/P120S6Q5']]) for (const k of [0, 1]) { const j = jt(s, id, label); j.tables[k].P = 50 + v; j.tables[k].D = 50 + v; } if (cells) cells(s); };
  cases.push(['every move at 120 points 0.7 of 2 (ratio exactly 0.35): 1 HELD', run(m2(0.7))[1].outcome, 'HELD']); EDGES.push('a convergence ratio exactly at 0.35');
  cases.push(['every move 0.7000001 of 2: 1 INCONCLUSIVE', run(m2(0.7000001))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['every move 1 of 2 (ratio exactly 0.5, first order): 1 FALSIFIED', run(m2(1))[1].outcome, 'FALSIFIED']); EDGES.push('a convergence ratio exactly at 0.5');
  cases.push(['every move 0.9999 of 2: 1 INCONCLUSIVE', run(m2(0.9999))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['every move back the other way at the same size (overshooting): 1 FALSIFIED', run(m2(-2))[1].outcome, 'FALSIFIED']);
  cases.push(['one cell slow (S224 LOR not read: S224 BASE world 1 D at 1 of 2), the rest 0.25: 1 INCONCLUSIVE', run(m2(0.5, s => { jt(s, 'S224', 'BASE/P120S6Q5').tables[1].D = 51; }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['world 2 not read (its move 2 of 2), the rest 0.25: 1 HELD', run(m2(0.5, s => { for (const [id, l] of [['S380', 'BASE/P120S6Q5'], ['S380', 'LOR/P120S6Q5']]) jt(s, id, l).tables[2].P = 52; }))[1].outcome, 'HELD']);
  cases.push(['no cell moved half a point from 30 to 60: 1 INCONCLUSIVE', run(s => { for (const id of ['S380', 'S224']) for (const arm of Object.keys(s.B1[id])) for (const k of [0, 1, 2]) { s.B1[id][arm].coarse[k].P = 49.75; s.B1[id][arm].coarse[k].D = 49.75; } })[1].outcome, 'INCONCLUSIVE']); EDGES.push('no cell counted');
  cases.push(['a 30-to-60 move exactly half a point is counted (and its 120 move a tenth of it): 1 HELD', run(s => { for (const id of ['S380', 'S224']) for (const arm of Object.keys(s.B1[id])) for (const k of [0, 1, 2]) { s.B1[id][arm].coarse[k].P = 49.5; s.B1[id][arm].coarse[k].D = 49.5; } m2(0.05)(s); })[1].outcome, 'HELD']); EDGES.push('a move exactly at half a point');
  cases.push(['S380 LOR\'s cells reported, not read (LOR slow alone, BASE at 0.25): 1 HELD', run(m2(0.5, s => { jt(s, 'S380', 'LOR/P120S6Q5').tables[0].P = 51.5; }))[1].outcome, 'HELD']); EDGES.push('the other read slow, the candidate\'s converging');
  cases.push(['S380 BASE\'s cells read (BASE slow in one cell): 1 INCONCLUSIVE', run(m2(0.5, s => { jt(s, 'S380', 'BASE/P120S6Q5').tables[0].P = 51.5; }))[1].outcome, 'INCONCLUSIVE']);
  // item 2: S224 at 120, P's runs on 16,000 paths at 8,000 (50); the table sets the under-read
  cases.push(['S224 at its runs: 2 FALSIFIED', run(s => {})[2].outcome, 'FALSIFIED']);
  cases.push(['S224 under its runs by exactly 0.5 at the point: 2 FALSIFIED', run(s => setP(s, 'S224', 'BASE/P120S6Q5', 49.5))[2].outcome, 'FALSIFIED']); EDGES.push('an under-read exactly at half a point');
  cases.push(['S224 under by 0.5000001 (its interval reaching above -0.5): 2 INCONCLUSIVE', run(s => setP(s, 'S224', 'BASE/P120S6Q5', 49.4999999))[2].outcome, 'INCONCLUSIVE']);
  cases.push(['S224 under by 1 at its point (its interval on 16,000 paths reaching above -0.5): 2 INCONCLUSIVE', run(s => setP(s, 'S224', 'BASE/P120S6Q5', 49))[2].outcome, 'INCONCLUSIVE']); EDGES.push('an under-read past half a point at its point but not shown');
  { const [l] = clopperPearson(8000, 16000, 2 * a1); cases.push(['S224\'s interval reaching exactly -0.5 (its table half a point under the runs\' lower bound): 2 INCONCLUSIVE', run(s => setP(s, 'S224', 'BASE/P120S6Q5', 100 * l - 0.5))[2].outcome, 'INCONCLUSIVE']); EDGES.push('an interval ending exactly at -0.5'); }
  cases.push(['S224 under by 3 in world 1 alone: 2 HELD', run(s => setP(s, 'S224', 'BASE/P120S6Q5', 47, [1]))[2].outcome, 'HELD']);
  cases.push(['S224 over by 3 (not an under-read): 2 INCONCLUSIVE', run(s => setP(s, 'S224', 'BASE/P120S6Q5', 53))[2].outcome, 'INCONCLUSIVE']);
  cases.push(['S224 under by 3 in world 2 only (not read): 2 FALSIFIED', run(s => setP(s, 'S224', 'BASE/P120S6Q5', 47, [2]))[2].outcome, 'FALSIFIED']);
  cases.push(['S224\'s under-read read on the 16,000-path runs (the first 4,000 not read alone): an under-read of 2 on 16,000 paths: 2 HELD', run(s => { setP(s, 'S224', 'BASE/P120S6Q5', 48); })[2].outcome, 'HELD']);
  // item 3: B1's S224 60-point runs set an under-read of 2 (runs at 52 against the table's 50)
  const u2 = s => { s.runs = [0, 1, 2].map(() => ({ ok: 2080, n: N })); };
  cases.push(['15 nodes raise S224 by exactly half its under-read (1 of 2): 3 HELD', run(s => { u2(s); setP(s, 'S224', 'BASE/P60S6Q15', 51); })['3'].outcome, 'HELD']); EDGES.push('a carry exactly at half');
  cases.push(['15 nodes raise it by 0.9999: 3 INCONCLUSIVE', run(s => { u2(s); setP(s, 'S224', 'BASE/P60S6Q15', 50.9999); })['3'].outcome, 'INCONCLUSIVE']);
  cases.push(['15 nodes raise it by under a fifth (0.39): 3 FALSIFIED', run(s => { u2(s); setP(s, 'S224', 'BASE/P60S6Q15', 50.39); })['3'].outcome, 'FALSIFIED']);
  cases.push(['15 nodes raise it by exactly a fifth (0.4): 3 INCONCLUSIVE', run(s => { u2(s); setP(s, 'S224', 'BASE/P60S6Q15', 50.4); })['3'].outcome, 'INCONCLUSIVE']); EDGES.push('a carry exactly at a fifth');
  cases.push(['15 nodes lower it (a fall is under a fifth): 3 FALSIFIED', run(s => { u2(s); setP(s, 'S224', 'BASE/P60S6Q15', 49); })['3'].outcome, 'FALSIFIED']);
  cases.push(['12 shares raise it by all of it: 4 HELD', run(s => { u2(s); setP(s, 'S224', 'BASE/P60S12Q5', 52); })['4'].outcome, 'HELD']);
  cases.push(['12 shares carry it in world 0 only: 4 INCONCLUSIVE', run(s => { u2(s); setP(s, 'S224', 'BASE/P60S12Q5', 52, [0]); })['4'].outcome, 'INCONCLUSIVE']);
  cases.push(['an over-read at 60 points is not an under-read to carry (runs 48 under the table 50): 4 INCONCLUSIVE', run(s => { s.runs = [0, 1, 2].map(() => ({ ok: 1920, n: N })); setP(s, 'S224', 'BASE/P60S12Q5', 52); })['4'].outcome, 'INCONCLUSIVE']);
  cases.push(['12 shares change nothing: 4 FALSIFIED', run(s => { u2(s); })['4'].outcome, 'FALSIFIED']);
  cases.push(['no 60-point under-read of half a point (runs at the table): 4 INCONCLUSIVE', run(s => { setP(s, 'S224', 'BASE/P60S12Q5', 52); })['4'].outcome, 'INCONCLUSIVE']); EDGES.push('no under-read to carry');
  cases.push(['an under-read exactly half a point is counted (runs 50.5, a rise of 0.5): 4 HELD', run(s => { s.runs = [0, 1, 2].map(() => ({ ok: 2020, n: N })); setP(s, 'S224', 'BASE/P60S12Q5', 50.5); })['4'].outcome, 'HELD']);
  cases.push(['3 reads the 15-node job, not the 12-share one (12 shares raise it, 15 nodes not): 3 FALSIFIED', run(s => { u2(s); setP(s, 'S224', 'BASE/P60S12Q5', 52); })['3'].outcome, 'FALSIFIED']);
  // item 4: S364 at 60 points and 6 shares over its runs by 4 (table 54 against 50)
  const o4 = s => { for (const l of ['BASE/P60S6Q5', 'BASE/P60S12Q5', 'BASE/P120S6Q5', 'ORDER/P60S6Q5', 'BASE/P60S6Q5L25']) setP(s, 'S364', l, 54); };
  const lowered = (label, v, ks) => s => { o4(s); setP(s, 'S364', label, v, ks); };
  cases.push(['12 shares lower S364 by exactly half its over-read (54 to 52): 5 HELD', run(lowered('BASE/P60S12Q5', 52))['5'].outcome, 'HELD']);
  cases.push(['12 shares lower it by 1.9999: 5 INCONCLUSIVE', run(lowered('BASE/P60S12Q5', 52.0001))['5'].outcome, 'INCONCLUSIVE']);
  cases.push(['12 shares lower it by under a fifth (0.79): 5 FALSIFIED', run(lowered('BASE/P60S12Q5', 53.21))['5'].outcome, 'FALSIFIED']);
  cases.push(['120 points lower it by all of it: 6 HELD', run(lowered('BASE/P120S6Q5', 50))['6'].outcome, 'HELD']);
  cases.push(['120 points raise it (a rise is under a fifth of a fall): 6 FALSIFIED', run(lowered('BASE/P120S6Q5', 55))['6'].outcome, 'FALSIFIED']);
  cases.push(['ORDER lowers it by half in world 0 only: 7 INCONCLUSIVE', run(lowered('ORDER/P60S6Q5', 52, [0]))['7'].outcome, 'INCONCLUSIVE']);
  cases.push(['ORDER lowers it by 3 of 4: 7 HELD', run(lowered('ORDER/P60S6Q5', 51))['7'].outcome, 'HELD']);
  cases.push(['120 points lower it by a quarter (1 of 4): 6 INCONCLUSIVE', run(lowered('BASE/P120S6Q5', 53))['6'].outcome, 'INCONCLUSIVE']);
  cases.push(['ORDER changes nothing: 7 FALSIFIED', run(o4)['7'].outcome, 'FALSIFIED']);
  cases.push(['an under-read at 60 points is not an over-read to carry (S364 2 under its runs): 5 INCONCLUSIVE', run(s => { for (const l of ['BASE/P60S6Q5', 'BASE/P60S12Q5', 'BASE/P120S6Q5', 'ORDER/P60S6Q5']) setP(s, 'S364', l, 48); setP(s, 'S364', 'BASE/P60S12Q5', 47); })['5'].outcome, 'INCONCLUSIVE']);
  cases.push(['no 60-point over-read (S364 at its runs): 7 INCONCLUSIVE', run(s => setP(s, 'S364', 'ORDER/P60S6Q5', 48))['7'].outcome, 'INCONCLUSIVE']); EDGES.push('no over-read to carry');
  cases.push(['an over-read under half a point is not counted (0.4999): 5 INCONCLUSIVE', run(s => { setP(s, 'S364', 'BASE/P60S6Q5', 50.4999); setP(s, 'S364', 'BASE/P60S12Q5', 50); })['5'].outcome, 'INCONCLUSIVE']);
  cases.push(['6 reads the 120-point job, not ORDER (ORDER lowers it, 120 not): 6 FALSIFIED', run(lowered('ORDER/P60S6Q5', 50))['6'].outcome, 'FALSIFIED']);
  // item 9: S224 at 120 points without its floor, P's runs on 16,000 paths at 8,000 (50)
  cases.push(['S224 without its floor at its runs: 9 HELD', run(s => {})['9'].outcome, 'HELD']);
  cases.push(['S224 without its floor under by exactly 0.5 at the point: 9 HELD', run(s => setP(s, 'S224', 'BASE/P120S6Q5F0', 49.5))['9'].outcome, 'HELD']); EDGES.push('a floor-free read exactly half a point under');
  cases.push(['S224 without its floor under by 1 (not shown): 9 INCONCLUSIVE', run(s => setP(s, 'S224', 'BASE/P120S6Q5F0', 49))['9'].outcome, 'INCONCLUSIVE']);
  cases.push(['S224 without its floor under by 3 in world 1: 9 FALSIFIED', run(s => setP(s, 'S224', 'BASE/P120S6Q5F0', 47, [1]))['9'].outcome, 'FALSIFIED']);
  cases.push(['S224 without its floor over by 1 (within half a point fails): 9 INCONCLUSIVE', run(s => setP(s, 'S224', 'BASE/P120S6Q5F0', 51))['9'].outcome, 'INCONCLUSIVE']);
  { const [l] = clopperPearson(8000, 16000, 2 * a1); cases.push(['S224 without its floor, its interval ending exactly at -0.5: 9 INCONCLUSIVE', run(s => setP(s, 'S224', 'BASE/P120S6Q5F0', 100 * l - 0.5))['9'].outcome, 'INCONCLUSIVE']); }
  cases.push(['9 reads the floor-free job, not the floored one (the floored under by 3): 9 HELD', run(s => setP(s, 'S224', 'BASE/P120S6Q5', 47))['9'].outcome, 'HELD']);
  // item 10: the support line at 0.25 against S364's 60-point over-read of 4
  cases.push(['the line at 0.25 lowers S364 by exactly half its over-read: 10 HELD', run(lowered('BASE/P60S6Q5L25', 52))['10'].outcome, 'HELD']);
  cases.push(['the line at 0.25 lowers it by 1.9999: 10 INCONCLUSIVE', run(lowered('BASE/P60S6Q5L25', 52.0001))['10'].outcome, 'INCONCLUSIVE']);
  cases.push(['the line at 0.25 changes nothing: 10 FALSIFIED', run(o4)['10'].outcome, 'FALSIFIED']);
  cases.push(['10 reads the line job, not ORDER (ORDER lowers it, the line not): 10 FALSIFIED', run(lowered('ORDER/P60S6Q5', 50))['10'].outcome, 'FALSIFIED']);
  // item 8: bridge 4 at 120 points, its own opening (P here), runs 3900 of 4000 (97.5)
  const b5 = (d, own = null) => s => { const j = jt(s, 'bridge 4', 'BASE/P120S6Q5'); j.sims.P0 = { ok: 3900, n: N }; j.tables[0].P = 97.5 + d; if (own !== null) { j.own.ai = own; j.sims.D0 = { ok: 3900, n: N }; j.tables[0].D = 97.5 + d; } };
  cases.push(['bridge 4 off by exactly 0.3: 8 HELD', run(b5(0.3))[8].outcome, 'HELD']); EDGES.push('a control point exactly at 0.3');
  cases.push(['bridge 4 off by 0.3000001: 8 INCONCLUSIVE', run(b5(0.3000001))[8].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 off by 0.8 (its interval at ALPHA / 6 reaching inside 0.3): 8 INCONCLUSIVE', run(b5(0.8))[8].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 off by 2: 8 FALSIFIED', run(b5(2))[8].outcome, 'FALSIFIED']);
  cases.push(['bridge 4 under by 2: 8 FALSIFIED', run(b5(-2))[8].outcome, 'FALSIFIED']);
  cases.push(['bridge 4 off by 0.3 computed as 0.30000000000000004 (1.3 against 1): 8 HELD', run(s => { const j = jt(s, 'bridge 4', 'BASE/P120S6Q5'); j.sims.P0 = { ok: 40, n: N }; j.tables[0].P = 1.3; })[8].outcome, 'HELD']); EDGES.push('a boundary the double overshoots');
  cases.push(['bridge 4\'s own opening D, its D off by 5: 8 FALSIFIED', run(s => { const j = jt(s, 'bridge 4', 'BASE/P120S6Q5'); j.own.ai = PAIRS['bridge 4'][1]; j.tables[0].D = 55; })[8].outcome, 'FALSIFIED']);
  // the causes
  const cz = (mut, c) => run(mut).causes[c];
  cases.push(['item 1 FALSIFIED: RG-WSLOW held', cz(m2(1), 'RG-WSLOW'), 'held']);
  cases.push(['item 1 HELD: RG-WSLOW not', cz(m2(0.5), 'RG-WSLOW'), 'not']);
  cases.push(['item 1 INCONCLUSIVE: RG-WSLOW open', cz(m2(0.8), 'RG-WSLOW'), 'open']);
  cases.push(['item 2 FALSIFIED, the table 2 under the first 4,000 paths\' runs: RG-PATHS held', cz(s => { s.f4k = [2080, 2080, 2000]; }, 'RG-PATHS'), 'held']);
  cases.push(['item 2 FALSIFIED, the table 2 under the first 4,000\'s runs in world 1 only: RG-PATHS held', cz(s => { s.f4k = [2000, 2080, 2000]; }, 'RG-PATHS'), 'held']);
  cases.push(['item 2 FALSIFIED, the table at the first 4,000 paths\' runs: RG-PATHS open', cz(s => {}, 'RG-PATHS'), 'open']); EDGES.push('a cause left open');
  cases.push(['item 2 FALSIFIED, the table exactly 0.5 under the first 4,000\'s runs: RG-PATHS open', cz(s => { s.f4k = [2020, 2020, 2000]; }, 'RG-PATHS'), 'open']); EDGES.push('a path-luck gap exactly at half a point');
  cases.push(['item 2 FALSIFIED, B1\'s 60-point under-read alone (the first 4,000 at the table): RG-PATHS open', cz(u2, 'RG-PATHS'), 'open']);
  cases.push(['item 2 HELD: RG-PATHS not', cz(s => setP(s, 'S224', 'BASE/P120S6Q5', 47), 'RG-PATHS'), 'not']);
  cases.push(['item 2 HELD and 4 HELD: RG-UNMASK held', cz(s => { u2(s); setP(s, 'S224', 'BASE/P120S6Q5', 47); setP(s, 'S224', 'BASE/P60S12Q5', 52); }, 'RG-UNMASK'), 'held']);
  cases.push(['item 2 HELD, 3 and 4 not: RG-UNMASK open', cz(s => { u2(s); setP(s, 'S224', 'BASE/P120S6Q5', 47); }, 'RG-UNMASK'), 'open']);
  cases.push(['item 2 FALSIFIED: RG-UNMASK not', cz(s => {}, 'RG-UNMASK'), 'not']);
  cases.push(['5 HELD: S364-SHARE held', cz(lowered('BASE/P60S12Q5', 50), 'S364-SHARE'), 'held']);
  cases.push(['6 FALSIFIED, the 60-point over-read keeping at least half the 30-point one (4 of 4): S364-W not', cz(o4, 'S364-W'), 'not']);
  cases.push(['6 FALSIFIED, the 60-point over-read under half the 30-point one (4 of 10): S364-W open', cz(s => { o4(s); s.over30 = [10, 10]; }, 'S364-W'), 'open']); EDGES.push('an axis that carried most of an over-read before 60 points');
  cases.push(['6 FALSIFIED, the 60-point over-read exactly half the 30-point one (4 of 8): S364-W not', cz(s => { o4(s); s.over30 = [8, 8]; }, 'S364-W'), 'not']);
  cases.push(['6 HELD with 5 not: S364-W held', cz(lowered('BASE/P120S6Q5', 50), 'S364-W'), 'held']);
  cases.push(['7 FALSIFIED: S364-REF not', cz(o4, 'S364-REF'), 'not']);
  cases.push(['items 2 and 9 HELD: RG-FLOOR held', cz(s => setP(s, 'S224', 'BASE/P120S6Q5', 47), 'RG-FLOOR'), 'held']);
  cases.push(['item 9 HELD, item 2 not: RG-FLOOR open', cz(s => {}, 'RG-FLOOR'), 'open']);
  cases.push(['item 9 FALSIFIED: RG-FLOOR not', cz(s => { setP(s, 'S224', 'BASE/P120S6Q5', 47); setP(s, 'S224', 'BASE/P120S6Q5F0', 47); }, 'RG-FLOOR'), 'not']);
  cases.push(['10 HELD: S364-COPY held', cz(lowered('BASE/P60S6Q5L25', 50), 'S364-COPY'), 'held']);
  const probes = (w0, wL) => s => { for (const [l, w] of [['BASE/P60S6Q5', w0], ['BASE/P60S6Q5L25', wL]]) jt(s, 'S364', l).probe = [0, 1, 2].map(k => ({ copy: [Array.isArray(w) ? w[k] : w, 0, 0, 0, 0] })); };
  const both = (...fs) => s => { for (const f of fs) f(s); };
  cases.push(['10 FALSIFIED, the line moving exactly half the copied weight in both worlds: S364-COPY not', cz(both(o4, probes(0.7, 0.35)), 'S364-COPY'), 'not']); EDGES.push('a reach exactly at half');
  cases.push(['10 FALSIFIED, the line moving 0.4999 of it: S364-COPY open', cz(both(o4, probes(0.7, 0.7 * 0.5001)), 'S364-COPY'), 'open']);
  cases.push(['10 FALSIFIED with no probe: S364-COPY open', cz(o4, 'S364-COPY'), 'open']);
  cases.push(['10 FALSIFIED, the line reaching world 0 only: S364-COPY open', cz(both(o4, probes(0.7, [0.1, 0.7, 0.7])), 'S364-COPY'), 'open']);
  cases.push(['10 FALSIFIED, the 0.5 job copying nothing: S364-COPY open', cz(both(o4, probes(0, 0)), 'S364-COPY'), 'open']);
  cases.push(['10 FALSIFIED, reaching world 0, world 1 not counted: S364-COPY not', cz(both(o4, s => { setP(s, 'S364', 'BASE/P60S6Q5', 50.3, [1]); setP(s, 'S364', 'BASE/P60S6Q5L25', 50.3, [1]); }, probes(0.7, [0.1, 0.7, 0.7])), 'S364-COPY'), 'not']);
  cases.push(['10 HELD, the line reaching nothing: S364-COPY held', cz(both(lowered('BASE/P60S6Q5L25', 50), probes(0.7, 0.7)), 'S364-COPY'), 'held']);
  cases.push(['10 FALSIFIED, the line moving all the copied weight (a reach of 1): S364-COPY not', cz(both(o4, probes(0.7, 0)), 'S364-COPY'), 'not']);
  cases.push(['7 INCONCLUSIVE: S364-REF open', cz(lowered('ORDER/P60S6Q5', 52, [0]), 'S364-REF'), 'open']);
  // the read end to end: report() on a synthetic set prints every item, every cause and the OUTCOME line
  { const st = base(); const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
    let lines = [], err = null; try { lines = report(st.J, st.B1, st.runs, xOf(st), (j, nm) => ones(j.sims[nm].n, j.sims[nm].ok), () => ones(N, 2000)); } catch (e) { err = e.message; }
    const oc = lines.find(l => l.startsWith('OUTCOME: ')) || '';
    cases.push(['the read prints every item\'s line, all eight causes and an OUTCOME line of ten items, end to end', err || `${['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.'].every(p => lines.some(l => l.startsWith(p)))} ${lines.filter(l => l.startsWith('=> ')).length} ${oc.split(', ').length}`, 'true 8 10']); EDGES.push('the whole read printed'); }
  // the gate, on a synthetic log built as the audit prints
  const jobText = (jb, o = {}) => {
    const [id, arm, pts0, sh, qn, mult, ch = {}] = jb, L = jobLabel(jb), pad = ''.padEnd(16), pts = o.pts || Math.max(4, Math.round(pts0 / 30)), [P, D] = PAIRS[id], own = o.own !== undefined ? o.own : P, npw = 4;
    const ran = o.ran || `bridgeRead reader bridgeStep exact readerSplit null readerBlend ${arm === 'LOR' ? 'logodds' : 'null'} readerRef ${o.ref || (arm === 'ORDER' ? 'order' : 'plan')} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls ${o.e3 || 'true'} switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix ${o.mix || 3} pts ${o.ranPts || pts} grid ${o.grid || `total${pts}x${sh}x${sh}`} floor ${o.floor !== undefined ? o.floor : ch.floor === 0 ? 0 : FLOORS[id]} line ${o.line || ch.line || 0.5}`;
    const out = [`${id.padEnd(16)} case | job ${L} | points ${pts} | lambda 0.0223606797749979`, `${pad} solve CAND ${L}: table 3.0 secs 1`, `${pad} ran CAND ${L}: ${ran}`,
      `${pad} reader ${L}: tables 1 unsupported 0 copied 0 copiedTop 0 nodes 1; clamps n ${o.clampN !== undefined ? o.clampN : arm === 'LOR' ? 9 : 0} lo 0 hi 0`, `${pad} checks ${L}: armTook ${o.armTook !== undefined ? o.armTook : 1}/1`,
      `${pad} pair ${L}: P ai ${o.P !== undefined ? o.P : P} level 0.8 tiers 0,0; D ai ${D} level ${o.lD || '0.8'} tiers ${o.tD || '2,2'}`, `${pad} checks ${L}: pairTook ${o.pairTook !== undefined ? o.pairTook : 1}/1`, `${pad} openings ${L}: OWN ai ${own} level 0.8 tiers 0,0`];
    if (!o.dropTable) for (let k = 0; k < 3; k++) out.push(`${pad} tables ${L} ${k} z 0 weight ${WEIGHTS[k].toFixed(6)}: P 50.000000 D 50.000000 OWN 50.000000`);
    if (PROBED.has(key(id, L)) && !o.dropProbe) for (let k = 0; k < 3; k++) out.push(`${pad} probe ${L} ${k} P: reads ${k === 1 && o.probeReads0 ? 0 : 9} pr 1.0e-4 plain 3.000000 deletion ${o.probeDel || '1.000000'} residual 2.000000 | sup w 0.100000 p 0.6 S 0.7 c 1 R 0.1 | clip w 0.200000 p 0.6 S 0.9 c 1 R 0.3 | copy w ${o.copyW || '0.700000'} p 0.01 S 0.04 c 1 R 0.03`);
    for (let k = 0; k < 3; k++) for (const [nm, np] of [['P', npw * mult], ['D', npw], ...(own !== P && own !== D ? [['OWN', npw]] : [])]) if (o.dropSim !== `${nm}${k}`) out.push(`${pad} sim ${L} ${k} ${nm} ai 1: 2/${nm === 'P' && o.pN ? o.pN : np} bits ${o.bitsHash || 'B' + nm + k}`);
    out.push(`${pad} checks ${L}: forceIdentity ${o.force !== undefined ? o.force : 4}/${o.forceOf || 4} secs 1`, `${pad} file ${L}: ${id.replace(/ /g, '_')}-${L.replace(/\//g, '-')}.json.gz`);
    if (o.done !== false) out.push(`${pad} done ${L}`);
    return [`stamp: code ${o.code || 'C'} audit A prediction P sha S`, `NE-GRID C: x, ${o.npw || npw} paths a world (P four times that where marked), wealth points divided by ${o.scale || 30} (seed ${o.seed || '7002'}); 10 jobs; part 0/1`, ...out].join('\n');
  };
  const all = (mod = {}) => JOBS.map(jb => parse(jobText(jb, mod[key(jb[0], jobLabel(jb))] || {}))).flat();
  const G = (js, o2 = {}) => gate(js, { npw: 4, seed: '7002', scale: 30, ...o2 });
  const refuses = (what, js, o2) => cases.push([`the gate refuses ${what}`, G(js, o2).length > 0, true]);
  const K = (id, l) => key(id, l), good = all();
  cases.push(['the gate passes ten good jobs', G(good).join(' / '), '']);
  refuses('a missing job', good.slice(1));
  refuses('a job run twice', [...good, good[0]]);
  refuses('a job with no done line', all({ [K('S380', 'LOR/P120S6Q5')]: { done: false } }));
  refuses('a stamp from other code', all({ [K('S224', 'BASE/P60S6Q15')]: { code: 'X' } }));
  refuses('another seed', all({ [K('S380', 'BASE/P120S6Q5')]: { seed: '7013' } }));
  refuses('another path count in the head', all({ [K('S380', 'BASE/P120S6Q5')]: { npw: 5 } }));
  refuses('another scale in the head', all({ [K('S380', 'BASE/P120S6Q5')]: { scale: 15 } }));
  refuses('a job solved at other points than registered', all({ [K('S364', 'BASE/P120S6Q5')]: { pts: 2, ranPts: '4', grid: 'total4x6x6' } }));
  refuses('a ran line at other points than its job', all({ [K('S364', 'BASE/P120S6Q5')]: { ranPts: '2' } }));
  refuses('a 12-share job solved on 6 shares', all({ [K('S224', 'BASE/P60S12Q5')]: { grid: 'total4x6x6' } })); EDGES.push('a job at other shares than its label');
  refuses('a job on other worlds', all({ [K('S224', 'BASE/P60S6Q15')]: { mix: 5 } }));
  refuses('armTook 0', all({ [K('S364', 'ORDER/P60S6Q5')]: { armTook: 0 } }));
  refuses('ORDER whose solve carries no order reference', all({ [K('S364', 'ORDER/P60S6Q5')]: { ref: 'plan' } })); EDGES.push('an arm named but not in the meta');
  refuses('BASE carrying the order reference', all({ [K('S364', 'BASE/P60S6Q5')]: { ref: 'order' } }));
  refuses('LOR whose solve carries no blend', all({ [K('S380', 'LOR/P120S6Q5')]: { ran: 'bridgeRead reader bridgeStep exact readerSplit null readerBlend null readerRef plan readerChance null jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 mix 3 pts 4 grid total4x6x6 floor 52500 line 0.5' } }));
  refuses('the candidate without e3pcls', all({ [K('S364', 'BASE/P60S6Q5')]: { e3: 'false' } }));
  refuses('pairTook 0', all({ [K('S364', 'ORDER/P60S6Q5')]: { pairTook: 0 } }));
  refuses('a forced pair at other tiers', all({ [K('S380', 'BASE/P120S6Q5')]: { tD: '1,1' } }));
  refuses('a forced pair at two levels', all({ [K('S380', 'BASE/P120S6Q5')]: { lD: '0.9' } }));
  refuses('a forced pair at another action', all({ [K('S380', 'BASE/P120S6Q5')]: { P: 11, own: 11 } }));
  refuses('a missing world table', all({ [K('S380', 'BASE/P120S6Q5')]: { dropTable: true } }));
  refuses('S224\'s floor-free job solved with its floor', all({ [K('S224', 'BASE/P120S6Q5F0')]: { floor: 430000 } })); EDGES.push('a floor that did not take');
  refuses('S224 solved without its floor where registered', all({ [K('S224', 'BASE/P120S6Q5')]: { floor: 0 } }));
  refuses('the line job solved at the default line', all({ [K('S364', 'BASE/P60S6Q5L25')]: { line: 0.5 } }));
  refuses('a probed job with no probe lines', all({ [K('S364', 'BASE/P60S6Q5')]: { dropProbe: true } }));
  refuses('a probe that logged no reads in a world', all({ [K('S380', 'BASE/P120S6Q5')]: { probeReads0: true } }));
  refuses('a probe whose weights do not sum to 1', all({ [K('S364', 'BASE/P60S6Q5L25')]: { copyW: '0.690000' } }));
  refuses('a probe breaking plain = deletion + residual', all({ [K('S364', 'BASE/P60S6Q5')]: { probeDel: '1.001000' } })); EDGES.push('a probe identity broken by a thousandth');
  refuses('a LOR read counted off the LOR job', all({ [K('S380', 'BASE/P120S6Q5')]: { clampN: 1 } })); EDGES.push('a clamp count of one');
  refuses('a missing D run in world 2', all({ [K('S380', 'LOR/P120S6Q5')]: { dropSim: 'D2' } }));
  refuses('P\'s runs at the base paths where four times were registered', all({ [K('S224', 'BASE/P120S6Q5')]: { pN: 4 } })); EDGES.push('runs at a quarter of the registered paths');
  refuses('P\'s runs at four times the paths where the base was registered', all({ [K('S364', 'BASE/P60S6Q5')]: { pN: 16 } }));
  refuses('an own opening that is neither P nor D, unrun', all().map(j => (j.id === 'S380' && j.label === 'BASE/P120S6Q5' ? { ...j, own: { ai: 13 } } : j)));
  refuses('a forceIdentity one path short', all({ [K('bridge 4', 'BASE/P120S6Q5')]: { force: 3 } }));
  refuses('a forceIdentity over too few paths', all({ [K('bridge 4', 'BASE/P120S6Q5')]: { force: 3, forceOf: 3 } }));
  refuses('a forceIdentity over other paths than the first 1,000', all({ [K('bridge 4', 'BASE/P120S6Q5')]: { force: 4, forceOf: 5 } }));
  const E = sha16(Buffer.alloc(0)), goodF = all(Object.fromEntries(JOBS.map(jb => [K(jb[0], jobLabel(jb)), { bitsHash: E }])));
  const filesOf = (js, code = 'C', drop = null) => Object.fromEntries(js.filter(j => j.file).map(j => [j.file, { stamp: { code, audit: 'A', prediction: 'P' }, bits: Object.fromEntries(Object.keys(j.sims).filter(nm => nm !== drop).map(nm => [nm, ''])) }]));
  cases.push(['the gate passes ten good jobs with their files', G(goodF, { files: filesOf(goodF) }).join(' / '), '']);
  refuses('a missing file', goodF, { files: {} });
  refuses('a file whose bits are not the log\'s', good, { files: filesOf(good) });
  refuses('a file missing one run\'s bits', goodF, { files: filesOf(goodF, 'C', 'D1') });
  refuses('a file stamped by other code', goodF, { files: filesOf(goodF, 'X') });
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
  const DIR = args[0] || join(HERE, 'results', 'diagnegridc'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const gz = d => Object.fromEntries(readdirSync(d).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(d, f))).toString())]));
  const files = gz(DIR);
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  // NE-GRID B1's records, behind B1's own gate
  let B1 = null, runs224 = null, b1Jobs = null, b1Files = null;
  if (!PRE) {
    const DB1 = join(HERE, 'results', 'diagnegrid'), logsB1 = Object.fromEntries(readdirSync(DB1).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DB1, f), 'utf8')]));
    if (!requireFairLogs(logsB1, 'research/solver/predictions/diag-negrid-b1.md', { exit: false })) bad.push('NE-GRID B1\'s files did not pass the fair-test gate');
    b1Jobs = Object.values(logsB1).flatMap(parseB1); b1Files = gz(DB1);
    const rf = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : null);
    const badB1 = gateB1(b1Jobs, { files: b1Files, rec: recordsB1(rf('results-neblend-a.txt'), rf('results-neroot.txt')) });
    if (badB1.length) bad.push(`NE-GRID B1's gate refused: ${badB1.join('; ')}`);
    else {
      const t = (id, arm, g) => b1Jobs.find(j => j.id === id && j.arm === arm && j.grid === g).tables.map(x => ({ P: x.P, D: x.D }));
      B1 = { S380: { BASE: { coarse: t('S380', 'BASE', 'coarse'), fine: t('S380', 'BASE', 'fine') }, LOR: { coarse: t('S380', 'LOR', 'coarse'), fine: t('S380', 'LOR', 'fine') } }, S224: { BASE: { coarse: t('S224', 'BASE', 'coarse'), fine: t('S224', 'BASE', 'fine') } } };
      const j224 = b1Jobs.find(j => j.id === 'S224' && j.arm === 'BASE' && j.grid === 'fine'); runs224 = [0, 1, 2].map(k => j224.sims[`P${k}`]);
    }
  }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the twelve jobs once and done at the registered settings (${npwA} paths a world, P at four times where registered, scale ${scaleA}, seed ${SEED}); every job's settings in its solve's meta; every self-check passed (armTook, pairTook, forceIdentity on world 0's first 1,000 paths); no LOR read counted off the LOR job; every file the log's${PRE ? '' : '; NE-GRID B1\'s records behind its own gate'}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.label), j]));
  const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
  console.log('\nNE-GRID C: the wealth axis at 120 points, S224 three ways, S364 at 60 points (B2), the tuning seed (predictions/diag-negrid-c.md)');
  for (const j of jobs) {
    console.log(`\n${key(j.id, j.label)} (${j.pts} points): own ai ${j.own.ai} level ${j.own.level} tiers ${j.own.tiers}; reader tables ${j.reader.tables} unsupported ${j.reader.unsupported} copied ${j.reader.copied} copiedTop ${j.reader.copiedTop}; clamps n ${j.reader.clampN}`);
    for (const x of j.tables) { const sim = o => { const s = j.sims[`${o}${x.k}`]; return s ? ` sim ${f4(100 * s.ok / s.n)} (${s.ok}/${s.n})` : ''; }; console.log(`  world ${x.k} (weight ${x.weight}): P ${f4(x.P)}${sim('P')}; D ${f4(x.D)}${sim('D')}; OWN ${f4(x.OWN)}${sim('OWN')}`); }
  }
  const bitsOf = (j, nm) => Buffer.from(files[j.file].bits[nm], 'base64');
  const b1BitsOf = (id, arm, k) => { const b1 = b1Jobs.find(x => x.id === id && x.arm === arm && x.grid === 'fine'); return Buffer.from(b1Files[b1.file].bits[`P${k}`], 'base64'); };
  const j224 = J[key('S224', 'BASE/P120S6Q5')], nr = readFileSync(join(HERE, 'results-neroot.txt'), 'utf8'), blk = nr.slice(nr.indexOf('\nS364 BASE/W0.02:') + 1);
  const over30 = [0, 1].map(k => { const m = new RegExp(`world ${k} .*?SS table (\\S+) sim \\S+ \\((\\d+)\\/(\\d+)\\)`).exec(blk); return Number(m[1]) - 100 * Number(m[2]) / Number(m[3]); });
  const extra = { first4k: k => bitsOf(j224, `P${k}`).subarray(0, NPW).reduce((t, v) => t + v, 0), over30 };
  for (const l of report(J, B1, runs224, extra, bitsOf, b1BitsOf)) console.log(l);
}
