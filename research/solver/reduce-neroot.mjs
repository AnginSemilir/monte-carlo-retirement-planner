/*
 * NE-ROOT's reducer (predictions/diag-neroot.md; PLAN.md NE-ROOT; audit-neroot.mjs). The gate runs first and refuses any
 * log it cannot vouch for; the items are read only by their registered rules.
 * THE GATE: every job of audit-neroot.mjs's JOBS once and done, one stamp (code, audit, prediction) across the logs and in
 *   every file; the registered settings (points, paths a world, seed); each arm's settings in its solve's meta (armTook and
 *   the ran line: BASE the reader with bridgeStep exact; R0 readerSplit r0; SIMP readerChance sim; READEROFF bridgeRead and
 *   bridgeStep off) and the candidate's others intact; on S364 and bridge 4 the same SS and SC moves under every arm; three
 *   world lines with every opening at the registered paths, their bits the file's; forceIdentity on world 0's first 1,000 paths; on S364's
 *   BASE jobs every split line, splitIdentity and splitCover on every one, and the reader tables' year lines.
 * THE ITEMS (S364 at 0.02 deciding; bridge 4 at 0.02 the control; ALPHA 0.05):
 *   the gap: SS's table survival less its simulated survival, in points, weighted over worlds 0 and 1 by the mixture's
 *   weights; each world's simulated survival bounded by the exact (Clopper-Pearson) interval one-sided at ALPHA / 6 (two
 *   worlds, three arms: Bonferroni, Holm's first step), the bounds combined at the same weights; Gb is BASE's gap.
 *   1-3. R0, SIMP, READEROFF: HELD when the arm's gap lies inside +-Gb/2 at both bounds, its SS table survival rises with
 *     the world (T0 <= T1 <= T2) and bridge 4 under the arm is not shown off its table by more than 0.3 points in any world
 *     (each world's interval of table less simulated, at the same bounds, reaches [-0.3, 0.3]: at 4,000 paths bridge 4's
 *     world-0 interval is about +-0.5 wide, and its point alone would block a true removal about 0.31 of the time,
 *     results-derive-neroot.txt section 2); FALSIFIED when the
 *     arm leaves at least three quarters of Gb at a bound's end (gap low end >= 0.75 Gb, or high end <= -0.75 Gb, an
 *     under-read as large); INCONCLUSIVE otherwise, and whenever Gb is not above 0.
 *   4. stage 1, BASE: the residual carries most of SS's year-1 read in worlds 0 and 1 and little in world 2 - HELD when
 *     r / sv >= 0.5 in worlds 0 and 1 and <= 0.25 in world 2; FALSIFIED when r / sv <= 0.25 in both worlds 0 and 1;
 *     INCONCLUSIVE otherwise (a table quantity: no sampling).
 *   5. the control, BASE on bridge 4: HELD when every world's table less simulated is within 0.3 points (the point);
 *     FALSIFIED when one world's interval, at the same bounds, lies wholly outside [-0.3, 0.3]; INCONCLUSIVE otherwise.
 * REPORTED: every job's world lines and gaps (SC beside SS), S364 at 0.01's split, S224's and S380's world lines at CAND's
 *   own opening, the reader tables' nodes by status.
 *   node research/solver/reduce-neroot.mjs [dir] [paths a world] [points] > research/solver/results-neroot.txt   (--preflight, --planted)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-neroot.md';
export const PTS = '30', SEED = '7002', NPW = 4000, ALPHA = 0.05, CTRL = 0.3, KEEP = 0.75, MOST = 0.5, LITTLE = 0.25;
export const JOBS = [['S364', '0.02', 'BASE'], ['S364', '0.02', 'R0'], ['S364', '0.02', 'SIMP'], ['S364', '0.02', 'READEROFF'],
  ['bridge 4', '0.02', 'BASE'], ['bridge 4', '0.02', 'R0'], ['bridge 4', '0.02', 'SIMP'], ['bridge 4', '0.02', 'READEROFF'],
  ['S364', '0.01', 'BASE'], ['S224', '0.02', 'BASE'], ['S380', '0.02', 'BASE']];
export const ARMS = ['R0', 'SIMP', 'READEROFF'], PAIRED = ['S364', 'bridge 4'], STATUS = ['sup', 'clip', 'share', 'row', 'none'];
const key = (id, w, arm) => `${id} ${arm}/W${w}`;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const CASEL = /^(S364|bridge 4|S224|S380)\s+case \| job (BASE|R0|SIMP|READEROFF)\/W(0\.0[12]) \| lambda (\S+)$/;
const HEAD = /^NE-ROOT: .*, (\d+) points, (\d+) paths a world \(seed (\d+)\)/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) { j = { id: c[1], arm: c[2], w: c[3], stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null, head: hd ? { pts: hd[1], npw: Number(hd[2]), seed: hd[3] } : null, split: [], years: [], world: [], checks: {}, done: false }; jobs.push(j); continue; }
    if (!j) continue;
    const l = raw.trim(), L = `${j.arm}/W${j.w}`;
    if (l.startsWith(`solve CAND ${L}:`)) j.table = Number(field(l, 'table'));
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const m of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[m[1]] = [Number(m[2]), Number(m[3])]; }
    else if (l.startsWith(`openings ${L}:`)) {
      const ss = /SS ai (\d+); SC ai (\d+)/.exec(l), lv = /SHIP's own level (\S+) tiers/.exec(l), own = /OWN ai (\d+)/.exec(l);
      j.openings = ss ? { SS: Number(ss[1]), SC: Number(ss[2]), shipLevel: lv ? lv[1] : null } : own ? { OWN: Number(own[1]) } : null;
    } else if (l.startsWith(`split ${L} `)) {
      const m = new RegExp(`^split ${esc(L)} (\\d) (SS|SC): sv (\\S+) pc (\\S+) r (\\S+) w1 (\\S+) p (\\S+) \\| (.*)$`).exec(l);
      if (m) j.split.push({ k: Number(m[1]), o: m[2], sv: Number(m[3]), pc: Number(m[4]), r: Number(m[5]), w1: Number(m[6]), p: Number(m[7]), shares: Object.fromEntries(STATUS.map(s => [s, Number(field(m[8], s))])) });
    } else if (l.startsWith(`year ${L} `)) j.years.push(l);
    else if (l.startsWith(`world ${L} `)) {
      const m = new RegExp(`^world ${esc(L)} (\\d) z (\\S+) weight (\\S+): (.*)$`).exec(l);
      if (m) {
        const by = {};
        for (const p of m[4].split('; ')) { const q = /^(SS|SC|OWN) table (\S+) sim (\d+)\/(\d+) bits (\S+)$/.exec(p); if (q) by[q[1]] = { table: Number(q[2]), ok: Number(q[3]), n: Number(q[4]), bits: q[5] }; }
        j.world.push({ k: Number(m[1]), z: Number(m[2]), weight: Number(m[3]), by });
      }
    } else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const WANT = {
  BASE: { bridgeRead: 'reader', bridgeStep: 'exact', readerSplit: 'null', readerChance: 'null' },
  R0: { bridgeRead: 'reader', readerChance: 'null' }, SIMP: { bridgeRead: 'reader', readerChance: 'sim', readerSplit: 'null' },
  READEROFF: { bridgeRead: 'false', bridgeStep: 'null', readerSplit: 'null', readerChance: 'null' } };
const COMMON = { jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001' };
export function gate(jobs, { pts = PTS, npw = NPW, seed = SEED, files = null } = {}) {
  const bad = [], byKey = {};
  for (const j of jobs) { const k = key(j.id, j.w, j.arm); (byKey[k] = byKey[k] || []).push(j); }
  for (const [id, w, arm] of JOBS) { const n = (byKey[key(id, w, arm)] || []).length; if (n !== 1) bad.push(`${key(id, w, arm)}: ${n ? 'run ' + n + ' times' : 'missing'}`); }
  const st0 = jobs[0] && jobs[0].stamp;
  for (const j of jobs) {
    const k = key(j.id, j.w, j.arm);
    if (!JOBS.some(([id, w, arm]) => id === j.id && w === j.w && arm === j.arm)) { bad.push(`${k}: not a registered job`); continue; }
    if (!j.done) bad.push(`${k}: no done line`);
    if (!j.stamp || !st0 || ['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])) bad.push(`${k}: its stamp is not the other logs'`);
    if (!j.head || j.head.pts !== pts || j.head.npw !== npw || j.head.seed !== seed) bad.push(`${k}: not at the registered settings (${pts} points, ${npw} a world, seed ${seed})`);
    if (!j.checks.armTook || j.checks.armTook[0] !== 1) bad.push(`${k}: armTook did not pass`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...WANT[j.arm], ...COMMON })) if (field(ran, f) !== v) bad.push(`${k}: ${f} is ${field(ran, f)}, not ${v}`);
    if (j.arm === 'R0' && !/readerSplit r0 /.test(ran)) bad.push(`${k}: readerSplit is not r0`);
    if (field(ran, 'bequestWeight') === null || Math.abs(Number(field(ran, 'bequestWeight')) - Number(j.w)) > 1e-12) bad.push(`${k}: not at its estate weight`);
    if (field(ran, 'pts') !== pts) bad.push(`${k}: not at ${pts} points`);
    const want = PAIRED.includes(j.id) ? ['SS', 'SC'] : ['OWN'];
    if (!j.openings || want.some(o => !Number.isInteger(j.openings[o]))) bad.push(`${k}: the openings line is missing or unread`);
    if (j.world.length !== 3 || j.world.some((x, i) => x.k !== i || want.some(o => !x.by[o] || x.by[o].n !== npw))) bad.push(`${k}: the world lines are not three worlds of ${npw} paths for every opening`);
    const fi = Math.min(npw, 1000); if (!j.checks.forceIdentity || j.checks.forceIdentity[0] !== fi || j.checks.forceIdentity[1] !== fi) bad.push(`${k}: forceIdentity did not pass on world 0's first ${fi} paths`);
    if (j.arm === 'BASE' && j.id === 'S364') {
      if (j.split.length !== 6 || [0, 1, 2].some(i => ['SS', 'SC'].some(o => !j.split.some(s => s.k === i && s.o === o)))) bad.push(`${k}: the split lines are not two openings in three worlds`);
      for (const c of ['splitIdentity', 'splitCover']) if (!j.checks[c] || !j.checks[c][1] || j.checks[c][0] !== j.checks[c][1]) bad.push(`${k}: ${c} did not pass on every read`);
      if (!j.years.length) bad.push(`${k}: no reader table's year line`);
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) bad.push(`${k}: its file ${j.file} is missing`);
      else {
        if (!f.stamp || !j.stamp || ['code', 'audit', 'prediction'].some(x => f.stamp[x] !== j.stamp[x])) bad.push(`${k}: its file is stamped by other code`);
        for (const x of j.world) for (const o of want) if (x.by[o] && (!f.bits[`${o}${x.k}`] || sha16(Buffer.from(f.bits[`${o}${x.k}`], 'base64')) !== x.by[o].bits)) bad.push(`${k}: world ${x.k} ${o}'s bits are not the log's`);
      }
    }
  }
  // the same SS and SC moves under every arm of a paired household
  for (const id of PAIRED) for (const w of ['0.02']) {
    const js = jobs.filter(j => j.id === id && j.w === w && j.openings);
    if (js.some(j => j.openings.SS !== js[0].openings.SS || j.openings.SC !== js[0].openings.SC || j.openings.shipLevel !== js[0].openings.shipLevel)) bad.push(`${id} W${w}: SS or SC differs between the arms`);
  }
  return bad;
}

/* the gap of one opening over worlds 0 and 1, in points: point and the bounds at the per-bound level a1 */
export function gapOf(job, o, a1 = ALPHA / 6, worlds = [0, 1]) {
  let sw = 0, pt = 0, hi = 0, lo = 0;
  for (const k of worlds) {
    const x = job.world.find(y => y.k === k).by[o], wt = job.world.find(y => y.k === k).weight;
    const [l, h] = clopperPearson(x.ok, x.n, 2 * a1);
    sw += wt; pt += wt * (x.table - 100 * x.ok / x.n); hi += wt * (x.table - 100 * l); lo += wt * (x.table - 100 * h);
  }
  return { point: pt / sw, hi: hi / sw, lo: lo / sw };
}
/* each world's table less simulated with its bounds: the control's reading */
export function ctrlOf(job, o, a1 = ALPHA / 6) {
  return job.world.map(y => { const x = y.by[o], [l, h] = clopperPearson(x.ok, x.n, 2 * a1); return { k: y.k, d: x.table - 100 * x.ok / x.n, lo: x.table - 100 * h, hi: x.table - 100 * l }; });
}
export function items(J) {
  const out = {}, base = J[key('S364', '0.02', 'BASE')], Gb = gapOf(base, 'SS').point;
  ARMS.forEach((arm, i) => {
    const a = J[key('S364', '0.02', arm)], g = gapOf(a, 'SS'), T = [0, 1, 2].map(k => a.world.find(y => y.k === k).by.SS.table);
    const order = T[0] <= T[1] && T[1] <= T[2];
    const ctrl = ctrlOf(J[key('bridge 4', '0.02', arm)], 'SS'), ctrlOk = ctrl.every(c => c.hi >= -CTRL && c.lo <= CTRL);
    let outcome;
    if (!(Gb > 0)) outcome = 'INCONCLUSIVE';
    else if (g.lo >= KEEP * Gb || g.hi <= -KEEP * Gb) outcome = 'FALSIFIED';
    else if (g.hi <= Gb / 2 && g.lo >= -Gb / 2 && order && ctrlOk) outcome = 'HELD';
    else outcome = 'INCONCLUSIVE';
    out[i + 1] = { outcome, arm, Gb, g, T, order, ctrl, ctrlOk, removed: Gb > 0 ? 1 - g.point / Gb : NaN };
  });
  const ratio = [0, 1, 2].map(k => { const s = base.split.find(x => x.k === k && x.o === 'SS'); return s && s.sv > 0 ? s.r / s.sv : NaN; });
  out[4] = { outcome: ratio.some(x => !Number.isFinite(x)) ? 'INCONCLUSIVE' : ratio[0] >= MOST && ratio[1] >= MOST && ratio[2] <= LITTLE ? 'HELD' : ratio[0] <= LITTLE && ratio[1] <= LITTLE ? 'FALSIFIED' : 'INCONCLUSIVE', ratio };
  const c5 = ctrlOf(J[key('bridge 4', '0.02', 'BASE')], 'SS');
  out[5] = { outcome: c5.every(c => Math.abs(c.d) <= CTRL) ? 'HELD' : c5.some(c => c.lo > CTRL || c.hi < -CTRL) ? 'FALSIFIED' : 'INCONCLUSIVE', ctrl: c5 };
  return out;
}

/* PLANTED: every boundary the items and the gate turn on, read as it should */
const EDGES = [];
function planted() {
  const W = [1 / 6, 2 / 3, 1 / 6];
  // a job from per-world (table, survivors) for SS (and SC equal); n paths a world
  const job = (id, arm, w, worlds, n = NPW, extra = {}) => ({ id, arm, w, world: worlds.map(([t, ok], k) => ({ k, z: 0, weight: W[k], by: { SS: { table: t, ok, n, bits: '-' }, SC: { table: t, ok, n, bits: '-' } } })), split: [], ...extra });
  const split = (r0, r1, r2, sv = 3) => [r0, r1, r2].map((r, k) => ({ k, o: 'SS', sv, pc: sv - r, r, w1: 1, p: 1, shares: {} }));
  const calibrated = [[98.5, 3940], [99.9, 3996], [100, 4000]];
  const set = (over = {}) => {
    const J = {};
    J[key('S364', '0.02', 'BASE')] = job('S364', 'BASE', '0.02', [[3.6, 2], [3.2, 14], [1.8, 70]], NPW, { split: split(2.5, 2.4, 0.2) });
    for (const a of ARMS) J[key('S364', '0.02', a)] = job('S364', a, '0.02', [[3.6, 2], [3.2, 14], [1.8, 70]]);
    for (const a of ['BASE', ...ARMS]) J[key('bridge 4', '0.02', a)] = job('bridge 4', a, '0.02', calibrated);
    return Object.assign(J, over);
  };
  const cases = [], o = J => items(J);
  // BASE's gap over worlds 0 and 1, to build arms against
  const J0 = set(), Gb = gapOf(J0[key('S364', '0.02', 'BASE')], 'SS').point;
  cases.push(['an arm that changes nothing: 1-3 FALSIFIED', [1, 2, 3].map(i => o(J0)[i].outcome).join(), 'FALSIFIED,FALSIFIED,FALSIFIED']);
  // an arm whose gap's high end is exactly Gb / 2: tables set so that the bound lands on it
  const atHalf = (() => { const a = job('S364', 'R0', '0.02', [[0, 2], [0, 14], [1.8, 70]]); const g = gapOf(a, 'SS'); const shift = Gb / 2 - g.hi; return job('S364', 'R0', '0.02', [[shift, 2], [shift, 14], [1.8 + shift, 70]]); })();
  cases.push(['an arm whose gap\'s high end is exactly half of Gb, the world order kept: 1 HELD', o(set({ [key('S364', '0.02', 'R0')]: atHalf }))[1].outcome, 'HELD']); EDGES.push('a gap removed exactly by half at its bound');
  const pastHalf = job('S364', 'R0', '0.02', atHalf.world.map(y => [y.by.SS.table + 0.01, y.by.SS.ok]));
  cases.push(['the same a hundredth of a point higher: 1 INCONCLUSIVE', o(set({ [key('S364', '0.02', 'R0')]: pastHalf }))[1].outcome, 'INCONCLUSIVE']);
  const flipped = job('S364', 'SIMP', '0.02', [[-3.6 + 0.05, 2], [-3.2 + 0.35, 14], [1.8, 70]].map(([t, k]) => [t, k]));
  const fl = gapOf(flipped, 'SS');
  cases.push([`an arm that flips the gap into an under-read as large (gap ${fl.point.toFixed(3)} of Gb ${Gb.toFixed(3)}): 2 FALSIFIED`, o(set({ [key('S364', '0.02', 'SIMP')]: flipped }))[2].outcome, fl.hi <= -KEEP * Gb ? 'FALSIFIED' : 'INCONCLUSIVE']); EDGES.push('a gap flipped into an under-read of the same size');
  const tie = job('S364', 'R0', '0.02', [[0.3, 2], [0.3, 14], [1.8, 70]]);
  cases.push(['a world-order tie (T0 = T1) with the gap removed: 1 HELD', o(set({ [key('S364', '0.02', 'R0')]: tie }))[1].outcome, 'HELD']); EDGES.push('a world-order tie');
  const unordered = job('S364', 'R0', '0.02', [[0.4, 2], [0.3, 14], [1.8, 70]]);
  cases.push(['the gap removed but the world order not restored: 1 INCONCLUSIVE', o(set({ [key('S364', '0.02', 'R0')]: unordered }))[1].outcome, 'INCONCLUSIVE']);
  const brokenCtrl = job('bridge 4', 'R0', '0.02', [[98.5, 3900], [99.9, 3996], [100, 4000]]);
  cases.push(['the gap removed but bridge 4 shown a point off in world 0: 1 INCONCLUSIVE', o(set({ [key('S364', '0.02', 'R0')]: tie, [key('bridge 4', '0.02', 'R0')]: brokenCtrl }))[1].outcome, 'INCONCLUSIVE']);
  const nearCtrl = job('bridge 4', 'R0', '0.02', [[98.8, 3934], [99.9, 3996], [100, 4000]]);
  cases.push(['the gap removed, bridge 4 off by 0.45 in world 0 but not shown past 0.3: 1 HELD', o(set({ [key('S364', '0.02', 'R0')]: tie, [key('bridge 4', '0.02', 'R0')]: nearCtrl }))[1].outcome, 'HELD']); EDGES.push('an arm\'s control off at its point but not shown');
  const none0 = job('S364', 'R0', '0.02', [[0.02, 0], [0.3, 14], [1.8, 70]]);
  cases.push(['a world with no surviving path, its table near 0: 1 HELD', o(set({ [key('S364', '0.02', 'R0')]: none0 }))[1].outcome, 'HELD']); EDGES.push('a world with no surviving path');
  const noGap = set({ [key('S364', '0.02', 'BASE')]: job('S364', 'BASE', '0.02', [[0.05, 2], [0.35, 14], [1.8, 70]], NPW, { split: split(0.04, 0.3, 0.2) }) });
  cases.push(['a BASE with no gap: 1-3 INCONCLUSIVE', [1, 2, 3].map(i => o(noGap)[i].outcome).join(), 'INCONCLUSIVE,INCONCLUSIVE,INCONCLUSIVE']); EDGES.push('a base with no gap');
  // item 4
  const s4 = sp => set({ [key('S364', '0.02', 'BASE')]: job('S364', 'BASE', '0.02', [[3.6, 2], [3.2, 14], [1.8, 70]], NPW, { split: sp }) });
  cases.push(['residual shares exactly 0.5, 0.5 and 0.25: 4 HELD', o(s4(split(1.5, 1.5, 0.75)))[4].outcome, 'HELD']); EDGES.push('a residual share exactly at one half and one quarter');
  cases.push(['residual shares 0.25 and 0.25 in worlds 0 and 1: 4 FALSIFIED', o(s4(split(0.75, 0.75, 2)))[4].outcome, 'FALSIFIED']);
  cases.push(['a world whose survival part is 0: 4 INCONCLUSIVE', o(s4(split(1.5, 1.5, 0.75).map((x, k) => (k === 2 ? { ...x, sv: 0 } : x))))[4].outcome, 'INCONCLUSIVE']); EDGES.push('a survival part of zero');
  cases.push(['residual shares 0.6, 0.6 and 0.4: 4 INCONCLUSIVE', o(s4(split(1.8, 1.8, 1.2)))[4].outcome, 'INCONCLUSIVE']);
  // item 5: a world whose interval ends exactly at 0.3
  const at03 = job('bridge 4', 'BASE', '0.02', [[CTRL + 100, NPW], [99.9, 3996], [100, NPW]]);
  cases.push(['bridge 4\'s world 0 off by exactly 0.3 points: 5 HELD', o(set({ [key('bridge 4', '0.02', 'BASE')]: at03 }))[5].outcome, 'HELD']); EDGES.push('a control point exactly at 0.3');
  cases.push(['bridge 4 shown a point off in world 0: 5 FALSIFIED', o(set({ [key('bridge 4', '0.02', 'BASE')]: brokenCtrl }))[5].outcome, 'FALSIFIED']);
  const straddle = job('bridge 4', 'BASE', '0.02', [[98.8, 3934], [99.9, 3996], [100, 4000]]);
  cases.push(['bridge 4 off by 0.45 in world 0, its interval reaching inside 0.3: 5 INCONCLUSIVE', o(set({ [key('bridge 4', '0.02', 'BASE')]: straddle }))[5].outcome, 'INCONCLUSIVE']);
  // the gate, on a synthetic log built as the audit prints
  const st = 'stamp: code C audit A prediction P sha S';
  const jobText = (id, w, arm, { done = true, armTook = 1, force = 4, ran = null, ss = 11, pts = '4', seedx = '7002' } = {}) => {
    const L = `${arm}/W${w}`, pad = ''.padEnd(16), paired = PAIRED.includes(id), os = paired ? ['SS', 'SC'] : ['OWN'];
    const r = ran || { BASE: 'bridgeRead reader bridgeStep exact readerSplit null readerChance null', R0: 'bridgeRead reader bridgeStep exact readerSplit r0 (zeroP 0) readerChance null', SIMP: 'bridgeRead reader bridgeStep exact readerSplit null readerChance sim', READEROFF: 'bridgeRead false bridgeStep null readerSplit null readerChance null' }[arm];
    const out = [`${id.padEnd(16)} case | job ${L} | lambda 0.0223606797749979`, `${pad} solve CAND ${L}: table 3.0 secs 1`,
      `${pad} ran CAND ${L}: ${r} tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight ${w} mix 3 pts ${pts} minPot 29000`,
      `${pad} checks ${L}: armTook ${armTook}/1`, paired ? `${pad} openings ${L}: SHIP's own level 0.8 tiers 0,0 secs 1; SS ai ${ss}; SC ai 12; CAND's own ai 13 level 0.9 tiers 2,2` : `${pad} openings ${L}: OWN ai 13 level 0.9 tiers 2,2`];
    if (id === 'S364' && arm === 'BASE') {
      for (const o2 of ['SS', 'SC']) for (let k = 0; k < 3; k++) out.push(`${pad} split ${L} ${k} ${o2}: sv 3 pc 1 r 2 w1 1 p 1 | sup 0.2 clip 0.1 share 0.3 row 0.3 none 0.1`);
      out.push(`${pad} checks ${L}: splitIdentity 6/6 splitCover 6/6`, `${pad} year ${L} t 1 k 0: nodes 10 sup 2 clip 1 share 3 row 3 none 1 | funded 2 Rmean 1e-2 Rmax 2e-2 S-p 1e-2`);
    }
    for (let k = 0; k < 3; k++) out.push(`${pad} world ${L} ${k} z 0 weight ${W[k].toFixed(6)}: ${os.map(o2 => `${o2} table 3.0 sim 1/4 bits B`).join('; ')}`);
    out.push(`${pad} checks ${L}: forceIdentity ${force}/4 secs 1`, `${pad} file ${L}: f.json.gz`);
    if (done) out.push(`${pad} done ${L}`);
    return { text: [st, `NE-ROOT: x, ${pts} points, 4 paths a world (seed ${seedx}); 11 jobs; part 0/1`, ...out].join('\n'), id, w, arm };
  };
  const all = (mod = {}) => JOBS.map(([id, w, arm]) => jobText(id, w, arm, mod[key(id, w, arm)] || {})).flatMap(x => parse(x.text));
  const G = (js, o2 = {}) => gate(js, { pts: '4', npw: 4, seed: '7002', ...o2 });
  cases.push(['the gate passes eleven good jobs', G(all()).join(' / '), '']);
  cases.push(['the gate refuses a missing job', G(all().slice(1)).length > 0, true]);
  cases.push(['the gate refuses a job run twice', G([...all(), ...all().slice(0, 1)]).length > 0, true]);
  cases.push(['the gate refuses a job with no done line', G(all({ [key('S224', '0.02', 'BASE')]: { done: false } })).length > 0, true]);
  cases.push(['the gate refuses an arm that did not take (armTook 0)', G(all({ [key('S364', '0.02', 'R0')]: { armTook: 0 } })).length > 0, true]);
  cases.push(['the gate refuses R0 whose solve carries no r0 split', G(all({ [key('S364', '0.02', 'R0')]: { ran: 'bridgeRead reader bridgeStep exact readerSplit null readerChance null' } })).length > 0, true]); EDGES.push('an arm named but not in the meta');
  cases.push(['the gate refuses a forceIdentity one path short', G(all({ [key('bridge 4', '0.02', 'SIMP')]: { force: 3 } })).length > 0, true]);
  cases.push(['the gate refuses SS differing between the arms', G(all({ [key('S364', '0.02', 'SIMP')]: { ss: 99 } })).length > 0, true]);
  cases.push(['the gate refuses other points', G(all({ [key('S380', '0.02', 'BASE')]: { pts: '5' } })).length > 0, true]);
  cases.push(['the gate refuses another seed', G(all({ [key('S380', '0.02', 'BASE')]: { seedx: '7013' } })).length > 0, true]);
  const filesGood = f => Object.fromEntries([['f.json.gz', f]]);
  const bitsB = { stamp: { code: 'C', audit: 'A', prediction: 'P' }, bits: {} };
  cases.push(['the gate refuses a file whose bits are not the log\'s', G(all(), { files: filesGood(bitsB) }).length > 0, true]);
  cases.push(['the gate refuses a missing file', G(all(), { files: {} }).length > 0, true]);
  let failed = 0;
  for (const [what, got, want] of cases) { const okc = String(got) === String(want); if (!okc) failed++; console.log(`${okc ? 'ok  ' : 'FAIL'} ${what}: ${JSON.stringify(got)}`); }
  if (failed) { console.log(`PLANTED CHECKS FAILED: ${failed} of ${cases.length}`); process.exit(1); }
  return cases.length;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (let i = 1; i <= 5; i++) console.log(`OUTCOMES REACHED: item ${i}: FALSIFIED, HELD, INCONCLUSIVE`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagneroot'), npwA = Number(args[1] || NPW), ptsA = args[2] || PTS;
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { pts: ptsA, npw: npwA, files });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the eleven jobs once and done at the registered settings (${ptsA} points, ${npwA} paths a world, seed ${SEED}); every arm in its solve's meta; the same SS and SC under every arm; every self-check passed (armTook, splitIdentity, splitCover, forceIdentity on world 0's first 1,000 paths); every file the log's`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.w, j.arm), j]));
  const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
  console.log('\nNE-ROOT: the candidate\'s S364 survival read, split and its causes armed one at a time, on the tuning seed (predictions/diag-neroot.md)');
  for (const j of jobs) {
    console.log(`\n${key(j.id, j.w, j.arm)}: table ${f4(j.table)}; ${j.ran.trim()}`);
    for (const x of j.world) console.log(`  world ${x.k} (z ${x.z}, weight ${x.weight}): ${Object.entries(x.by).map(([o, y]) => `${o} table ${f4(y.table)} sim ${f4(100 * y.ok / y.n)} (${y.ok}/${y.n})`).join('; ')}`);
    for (const s of j.split) console.log(`  split ${s.k} ${s.o}: sv ${f4(s.sv)} pc ${f4(s.pc)} r ${f4(s.r)} (r/sv ${f4(s.r / s.sv)}) p ${f4(s.p)} w1 ${s.w1} | ${STATUS.map(x => `${x} ${f4(s.shares[x])}`).join(' ')}`);
    if (j.years.length) {
      const tot = STATUS.map(s => j.years.reduce((t, l) => t + Number(field(l, s)), 0));
      console.log(`  reader tables: ${j.years.length}; nodes by status ${STATUS.map((s, i) => `${s} ${tot[i]}`).join(' ')}`);
    }
    if (PAIRED.includes(j.id)) { const g = gapOf(j, 'SS'), h = gapOf(j, 'SC'); console.log(`  gap over worlds 0 and 1: SS ${f4(g.point)} (${f4(g.lo)} to ${f4(g.hi)}); SC ${f4(h.point)} (${f4(h.lo)} to ${f4(h.hi)})`); }
    else { const g = gapOf(j, 'OWN'), c = ctrlOf(j, 'OWN'); console.log(`  REPORTED, CAND's own opening: gap over worlds 0 and 1 ${f4(g.point)} (${f4(g.lo)} to ${f4(g.hi)}); by world ${c.map(x => `${x.k} ${f4(x.d)}`).join(', ')}`); }
  }
  const it = items(J);
  console.log('\nTHE ITEMS (each read by its registered rule)');
  for (const i of [1, 2, 3]) {
    const x = it[i];
    console.log(`${i}. ${x.arm} removes at least half of SS's gap in worlds 0 and 1, restores the world order, bridge 4 kept: ${x.outcome}\n     Gb ${f4(x.Gb)}; arm's gap ${f4(x.g.point)} (${f4(x.g.lo)} to ${f4(x.g.hi)}); removed ${f4(x.removed)}; SS tables by world ${x.T.map(f4).join(', ')} (order ${x.order ? 'rising' : 'not rising'}); bridge 4 table less simulated by world ${x.ctrl.map(c => `${f4(c.d)} (${f4(c.lo)} to ${f4(c.hi)})`).join(', ')} (${x.ctrlOk ? 'kept' : 'shown off'})`);
  }
  console.log(`4. stage 1: the residual carries most of SS's year-1 read in worlds 0 and 1 and little in world 2: ${it[4].outcome}\n     r/sv by world ${it[4].ratio.map(f4).join(', ')}`);
  console.log(`5. the control, bridge 4 under BASE within 0.3 points in every world: ${it[5].outcome}\n     ${it[5].ctrl.map(c => `world ${c.k} ${f4(c.d)} (${f4(c.lo)} to ${f4(c.hi)})`).join('; ')}`);
  for (const i of [1, 2, 3]) console.log(`REALISED item ${i}: ${f4(it[i].removed)}`);
  console.log(`OUTCOME: ${[1, 2, 3, 4, 5].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
}
