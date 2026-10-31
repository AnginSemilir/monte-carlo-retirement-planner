/*
 * REF-2'S REDUCER (PLAN.md REF-2; predictions/diag-ref2.md; audit-ref2.mjs).
 *   node research/solver/reduce-ref2.mjs [dir=results/diagref2] [paths=4000] [scale=1] [draws=1000000] [flow=40000] [--preflight]
 *   node research/solver/reduce-ref2.mjs --planted
 * THE GATE: the five jobs once and done, one stamp (code, audit, prediction) across the logs and in every file; each at the
 *   registered settings (paths a world, scale, seed, ledger draws, flow paths; L at 4 wealth points, the others at 60 over
 *   the scale), the candidate's settings, the job's readerSplit and readerRef in its solve's meta (armTook and the ran line),
 *   the household's minimum end pot and the support line 0.5. L: P found and among the two orders' flow moves, the opening
 *   weights summing to 1, a schedule, five ledger rows (with the sweep's counts), a quadrature line and one flow line an
 *   order in every world, counts out of the registered draws and flow paths, mirrorTook whole. The 60-point jobs: the own
 *   opening's tables and runs (with the bridge paid) in every world, forceIdentity on world 0's first min(paths, 1,000).
 *   Every file's bits the log's.
 *   THE REUSE (not in --preflight): NE-REF's files pass NE-REF's own reducer gate, its S360 BASE and RS jobs are read from
 *   them, and their stamp's code is this run's (the same solver code), so the 2 x 2 is one code's.
 * THE ITEMS (every threshold read on the figure rounded to 1e-9):
 *   1 (O151): S360 under RSO against BO, each at its own opening, paired by path. Per world, D = (RSO's table - BO's) less
 *     (RSO's runs - BO's), in points, its interval from the discordant paths' exact interval at 2 x a3 (a3 = ALPHA / 6).
 *     HELD (O151-REF: under ORDER, RS does not deepen S360) when every world's bottom is at least -0.5; FALSIFIED (O151-RS)
 *     when world 0's top is at most -1.0; INCONCLUSIVE otherwise. Reported: the 2 x 2 (NE-REF's BASE and RS beside BO and
 *     RSO), ORDER's effect (BO - BASE) and the interaction.
 *   2 (RR-MIXS): at S360's year-1 states (the ledger, worlds 0 and 1 deciding: the near-edge worlds), the gap between the
 *     order-drawn reference at the opening weights and the engine's own bridge payment under the better order's fixed
 *     move, GAP = ln FB - ln OW, and MIXS = ln OS - ln OW (the state's own pots). A world holds when GAP is shown (its
 *     interval bottom above 0) and MIXS's interval bottom is at least half of GAP's top; it falls when GAP's bottom is above 0 and MIXS's top is under half
 *     of it. HELD when both worlds hold; FALSIFIED when both fall; INCONCLUSIVE otherwise. Intervals: each weighted count's
 *     exact interval at 2 x a2 (a2 = ALPHA / 4). Reported: SWEEP (ln OSW - ln OS), the rest (ln FB - ln OSW), FORM, world 2.
 *   3 (ORDER's over-read on the 95% share household): BO's own-opening table less its runs per world, the runs' exact
 *     interval at 2 x a3. HELD when every world's point is at most 0.5; FALSIFIED when any world's bottom is above 0.5;
 *     INCONCLUSIVE otherwise (the runs' interval near 95% survival is about a point wide, so HELD reads the point, as
 *     NE-EDGE's controls did). Reported: BASE's alike (O36's under-read), and whether BO's runs are BASE's (SAME/DIFFERENT).
 * THE CAUSES (the deep review after NE-REF's, deep-review-log.md 13 Oct 18:36 UK): O151-REF held on 1 HELD; O151-RS not on
 *   1 HELD; on 1 FALSIFIED, O151-RS held and O151-REF not only when the ledger shows no gap beyond ORDER (GAP's bottom, a
 *   finite figure, at most 0 in worlds 0 and 1), since RS under RSO scales away whatever shortfall ORDER leaves (the
 *   auditor, review-log.md 13 Oct 19:56 UK), both open otherwise; RR-MIXS held on 2 HELD, not on 2 FALSIFIED; open otherwise.
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
export const PRED = 'research/solver/predictions/diag-ref2.md';
export const SEED = '7002', NPW = 4000, DRAWS = 1000000, FLOWN = 40000, ALPHA = 0.05;
export const HALF = 0.5, DEEP = -0.5, DEEPF = -1.0, OVER = 0.5;
export const JOBS = [['S360', 'L', 4], ['S360', 'BO', 60], ['S360', 'RSO', 60], ['share 0.95', 'BASE', 60], ['share 0.95', 'BO', 60]];
export const SPLIT = Object.freeze({ L: 'null', BO: 'null', RSO: 'rs', BASE: 'null' });
export const REFOF = Object.freeze({ L: 'null', BO: 'order', RSO: 'order', BASE: 'null' });
export const FLOORS = Object.freeze({ S360: 5000, 'share 0.95': 29000 });
export const jobLabel = ([, arm, pts]) => `${arm}/P${pts}S6Q5`;
export const key = (id, label) => `${id} ${label}`;
export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const a2 = ALPHA / 4, a3 = ALPHA / 6;
const CASEL = /^(S360|share 0\.95)\s+case \| job ((L|BO|RSO|BASE)\/P(\d+)S6Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^REF-2: .*, (\d+) paths a world, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\); ledger draws (\d+), flow paths (\d+);/;
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
      j = { id: c[1], label: c[2], arm: c[3], pts0: Number(c[4]), pts: Number(c[5]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3], draws: Number(hd[4]), flow: Number(hd[5]) } : null,
        checks: {}, tables: [], sims: {}, ledger: [[], [], []], schedule: [], quad: [], flow: [[], [], []], orders: null, opening: null, own: null, P: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label;
    let m;
    if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^openings ${esc(L)}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^P ${esc(L)}: ai (\\d+) `).exec(l))) j.P = Number(m[1]);
    else if ((m = new RegExp(`^orders ${esc(L)}: (.*)$`).exec(l))) j.orders = m[1].split('; ').map(x => { const y = /^(\d+) (\S+) ai (\d+)$/.exec(x); return y ? { i: Number(y[1]), order: y[2], ai: Number(y[3]) } : null; });
    else if ((m = new RegExp(`^opening ${esc(L)}: isa (\\S+) gia (\\S+) cash (\\S+)$`).exec(l))) j.opening = { isa: Number(m[1]), gia: Number(m[2]), cash: Number(m[3]) };
    else if ((m = new RegExp(`^schedule ${esc(L)} (\\d): t (\\d+) ai0 (\\d+) bills (\\S+) buffers (\\S+)$`).exec(l))) j.schedule[Number(m[1])] = { t: Number(m[2]), bills: m[4], buffers: m[5] };
    else if ((m = new RegExp(`^ledger ${esc(L)} (\\d) (\\d): z (\\S+) w (\\S+) acc (\\S+) isa (\\S+) gia (\\S+) cash (\\S+) pr (\\S+) form (\\d+)\\/(\\d+) ow (\\S+)\\/(\\d+) os (\\S+)\\/(\\d+) osw (\\S+)\\/(\\d+)$`).exec(l))) {
      j.ledger[Number(m[1])][Number(m[2])] = { w: Number(m[4]), pr: Number(m[9]), form: Number(m[10]), N: Number(m[11]), ow: m[12].split(',').map(Number), owN: Number(m[13]), os: m[14].split(',').map(Number), osN: Number(m[15]), osw: m[16].split(',').map(Number), oswN: Number(m[17]) };
    } else if ((m = new RegExp(`^quad ${esc(L)} (\\d): gh (\\S+) fine (\\S+) fit (\\S+)$`).exec(l))) j.quad[Number(m[1])] = { gh: Number(m[2]), fine: Number(m[3]) };
    else if ((m = new RegExp(`^flow ${esc(L)} (\\d) (\\d) ai (\\d+): bridge (\\d+)\\/(\\d+) survived (\\d+)\\/(\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.flow[Number(m[1])][Number(m[2])] = { ai: Number(m[3]), bridge: Number(m[4]), N: Number(m[5]), survived: Number(m[6]), N2: Number(m[7]), bitsB: m[8], bitsS: m[9] };
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): OWN (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { OWN: Number(m[4]) };
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3' };
/* neref: { code } of NE-REF's launch (behind NE-REF's gate); null in --preflight */
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, draws = DRAWS, flow = FLOWN, files = null, neref = null } = {}) {
  const bad = [], byKey = {};
  for (const j of jobs) { const k = key(j.id, j.label); (byKey[k] = byKey[k] || []).push(j); }
  for (const jb of JOBS) { const k = key(jb[0], jobLabel(jb)), n = (byKey[k] || []).length; if (n !== 1) bad.push(`${k}: ${n ? 'run ' + n + ' times' : 'missing'}`); }
  const st0 = jobs[0] && jobs[0].stamp, FI = Math.min(npw, 1000);
  for (const j of jobs) {
    const k = key(j.id, j.label), reg = JOBS.find(jb => jb[0] === j.id && jobLabel(jb) === j.label);
    if (!reg) { bad.push(`${k}: not a registered job`); continue; }
    const pts = j.arm === 'L' ? reg[2] : Math.max(4, Math.round(reg[2] / scale));
    if (!j.done) bad.push(`${k}: no done line`);
    if (!j.stamp || !st0 || ['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])) bad.push(`${k}: its stamp is not the other logs'`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale || j.head.draws !== draws || j.head.flow !== flow) bad.push(`${k}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed}, draws ${draws}, flow ${flow})`);
    if (j.pts !== pts) bad.push(`${k}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, readerSplit: SPLIT[j.arm], readerRef: REFOF[j.arm], floor: String(FLOORS[j.id]), pts: String(pts), grid: `total${pts}x6x6` })) if (field(ran, f) !== v) bad.push(`${k}: ${f} is ${field(ran, f)}, not ${v}`);
    if (!j.checks.armTook || j.checks.armTook[0] !== 1) bad.push(`${k}: armTook did not pass`);
    if (!j.own) bad.push(`${k}: no openings line`);
    if (j.arm === 'L') {
      const o = j.orders || [];
      if (!(j.P >= 0) || o.length !== 2 || o.some(x => !x) || !o.some(x => x.ai === j.P)) bad.push(`${k}: no P line, or not two draw orders with P among the flow moves`);
      if (!j.opening || !(Math.abs(j.opening.isa + j.opening.gia + j.opening.cash - 1) < 1e-5)) bad.push(`${k}: the opening weights are missing or do not sum to 1`);
      if (!j.checks.mirrorTook || !(j.checks.mirrorTook[1] > 0) || j.checks.mirrorTook[0] !== j.checks.mirrorTook[1]) bad.push(`${k}: mirrorTook did not pass`);
      for (let w = 0; w < 3; w++) {
        if (!j.schedule[w]) bad.push(`${k}: world ${w} has no schedule`);
        if (!j.quad[w]) bad.push(`${k}: world ${w} has no quadrature line`);
        const rows = j.ledger[w];
        if (rows.length !== 5 || [0, 1, 2, 3, 4].some(i => !rows[i])) { bad.push(`${k}: world ${w} has not five ledger rows`); continue; }
        if (Math.abs(rows.reduce((t, r) => t + r.w, 0) - 1) > 1e-5) bad.push(`${k}: world ${w}'s node weights do not sum to 1`);
        if (rows.some(r => r.N !== draws || r.owN !== draws || r.osN !== draws || r.oswN !== draws || [r.ow, r.os, r.osw].some(a => a.length !== 2) || [r.form, ...r.ow, ...r.os, ...r.osw].some(x => !(x >= 0 && x <= draws)))) bad.push(`${k}: world ${w}'s ledger counts are not out of ${draws} in two orders`);
        const fl = j.flow[w];
        if (fl.length !== 2 || [0, 1].some(i => !fl[i] || fl[i].N !== flow || fl[i].N2 !== flow || fl[i].survived > fl[i].bridge || (o[i] && fl[i].ai !== o[i].ai))) bad.push(`${k}: world ${w}'s flow lines are not one an order out of ${flow} paths`);
      }
    } else {
      for (let w = 0; w < 3; w++) {
        if (!j.tables[w] || !Number.isFinite(j.tables[w].OWN)) bad.push(`${k}: world ${w}'s table is missing`);
        const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || s.bridge < s.ok) bad.push(`${k}: no OWN run of ${npw} paths in world ${w}`);
      }
      if (!j.checks.forceIdentity || j.checks.forceIdentity[0] !== FI || j.checks.forceIdentity[1] !== FI) bad.push(`${k}: forceIdentity did not pass on world 0's first ${FI} paths`);
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) bad.push(`${k}: its file ${j.file} is missing`);
      else {
        if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${k}: its file is stamped by other code`);
        const want = j.arm === 'L' ? j.flow.flatMap((fl, w) => fl.flatMap((x, i) => [[`B${w}o${i}`, x.bitsB], [`S${w}o${i}`, x.bitsS]])) : Object.entries(j.sims).flatMap(([nm, s]) => [[nm, s.bits], [`${nm}b`, s.bitsB]]);
        for (const [nm, sh] of want) { const b = f.bits && f.bits[nm]; if (!b || sha16(Buffer.from(b, 'base64')) !== sh) bad.push(`${k}: its file's ${nm} bits are not the log's`); }
      }
    }
  }
  if (neref && st0 && neref.code !== st0.code) bad.push(`NE-REF's S360 jobs ran on code ${neref.code}, this run on ${st0.code}: the 2 x 2 is not one code's`);
  return bad;
}

const cp = (ok, n, al) => clopperPearson(ok, n, al);
const ln = x => (x > 0 ? Math.log(x) : -Infinity);
/* the ledger of one world of the L job */
export function ledgerOf(Lj, k) {
  const rows = Lj.ledger[k], N = rows[0].N, wsum = f => rows.reduce((t, x) => t + x.w * f(x), 0);
  const best = arr => arr.reduce((b, x, i) => (x > arr[b] ? i : b), 0);
  const lohi = get => [wsum(x => cp(get(x), N, 2 * a2)[0]), wsum(x => cp(get(x), N, 2 * a2)[1])];
  const REF = wsum(x => x.pr), FS = wsum(x => x.form / N);
  const owC = x => x.ow[best(x.ow)], osC = x => x.os[best(x.os)], oswC = x => x.osw[best(x.osw)];
  const OW = wsum(x => owC(x) / N), [OWlo, OWhi] = lohi(owC), OS = wsum(x => osC(x) / N), [OSlo, OShi] = lohi(osC), OSW = wsum(x => oswC(x) / N);
  const fl = Lj.flow[k], bi = fl[0].bridge >= fl[1].bridge ? 0 : 1, F = fl[bi], [fblo, fbhi] = cp(F.bridge, F.N, 2 * a2), FB = F.bridge / F.N;
  return { k, REF, FS, OW, OS, OSW, FB, order: bi, FORM: ln(FS) - ln(REF), MIXO: ln(OW) - ln(FS),
    GAP: ln(FB) - ln(OW), GAPlo: ln(fblo) - ln(OWhi), GAPhi: ln(fbhi) - ln(OWlo),
    MIXS: ln(OS) - ln(OW), MIXSlo: ln(OSlo) - ln(OWhi), MIXShi: ln(OShi) - ln(OWlo),
    SWEEP: ln(OSW) - ln(OS), REST: ln(FB) - ln(OSW) };
}
export function offOf(table, ok, n, al) { const [l, h] = cp(ok, n, al); return { d: q(table - 100 * ok / n), lo: q(table - 100 * h), hi: q(table - 100 * l) }; }
/* the paired difference of two arms' table-less-runs at their own openings, in points */
function paired(ja, jb, k, bitsOf) {
  const A = bitsOf(ja, `OWN${k}`), B = bitsOf(jb, `OWN${k}`), N = A.length;
  let b = 0, c = 0; for (let i = 0; i < N; i++) { if (B[i] && !A[i]) b++; else if (!B[i] && A[i]) c++; }
  const m = b + c, [lo, hi] = m ? cp(c, m, 2 * a3) : [0.5, 0.5], dT = ja.tables[k].OWN - jb.tables[k].OWN;
  const drLo = 100 * (2 * lo - 1) * m / N, drHi = 100 * (2 * hi - 1) * m / N, dr = 100 * (c - b) / N;
  return { k, b, c, N, D: q(dT - dr), lo: q(dT - drHi), hi: q(dT - drLo) };
}
/* J: this test's jobs by key (with NE-REF's S360 BASE and RS under 'S360 BASE/P60S6Q5' and 'S360 RS/P60S6Q5'); bitsOf(j, run) */
export function items(J, bitsOf) {
  const out = {}, jt = (id, arm) => J[key(id, `${arm}/P60S6Q5`)];
  // item 1: RSO against BO on S360
  const c1 = [0, 1, 2].map(k => paired(jt('S360', 'RSO'), jt('S360', 'BO'), k, bitsOf));
  out['1'] = { outcome: c1.every(x => x.lo >= DEEP) ? 'HELD' : c1[0].hi <= DEEPF ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c1 };
  out.twoByTwo = [0, 1, 2].map(k => ({ k, ...Object.fromEntries(['BASE', 'RS', 'BO', 'RSO'].map(a => { const j = jt('S360', a), s = j.sims[`OWN${k}`]; return [a, { t: j.tables[k].OWN, r: 100 * s.ok / s.n }]; })) }));
  // item 2: the state's own pots at S360's states, worlds 0 and 1
  const Lj = J[key('S360', 'L/P4S6Q5')], led = [0, 1, 2].map(k => ledgerOf(Lj, k));
  out.ledger = led;
  const w2 = [0, 1].map(k => { const l = led[k]; return { holds: Number.isFinite(l.GAPlo) && q(l.GAPlo) > 0 && Number.isFinite(l.MIXSlo) && q(l.MIXSlo) >= q(HALF * l.GAPhi), falls: Number.isFinite(l.GAPlo) && q(l.GAPlo) > 0 && q(l.MIXShi) < q(HALF * l.GAPlo) }; });
  out['2'] = { outcome: w2.every(x => x.holds) ? 'HELD' : w2.every(x => x.falls) ? 'FALSIFIED' : 'INCONCLUSIVE' };
  // item 3: ORDER on the 95% share household
  const c3 = [0, 1, 2].map(k => { const j = jt('share 0.95', 'BO'), s = j.sims[`OWN${k}`], jb = jt('share 0.95', 'BASE'), sb = jb.sims[`OWN${k}`]; return { k, bo: offOf(j.tables[k].OWN, s.ok, s.n, 2 * a3), base: offOf(jb.tables[k].OWN, sb.ok, sb.n, 2 * a3) }; });
  out['3'] = { outcome: c3.every(x => x.bo.d <= OVER) ? 'HELD' : c3.some(x => x.bo.lo > OVER) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c3,
    same: [0, 1, 2].every(k => jt('share 0.95', 'BO').sims[`OWN${k}`].bits === jt('share 0.95', 'BASE').sims[`OWN${k}`].bits) };
  const o1 = out['1'].outcome, o2 = out['2'].outcome;
  out.clear = [0, 1].every(k => Number.isFinite(led[k].GAPlo) && q(led[k].GAPlo) <= 0);
  const o1c = o1 === 'FALSIFIED' && !out.clear ? 'INCONCLUSIVE' : o1;
  out.causes = { 'O151-REF': { HELD: 'held', FALSIFIED: 'not' }[o1c] || 'open', 'O151-RS': { HELD: 'not', FALSIFIED: 'held' }[o1c] || 'open', 'RR-MIXS': { HELD: 'held', FALSIFIED: 'not' }[o2] || 'open' };
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), e4 = x => (Number.isFinite(x) ? x.toExponential(4) : String(x));
/* THE READ, from the items to the OUTCOME line, as lines */
export function report(J, bitsOf) {
  const it = items(J, bitsOf), L = [], Lj = J[key('S360', 'L/P4S6Q5')];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. under ORDER, RS does not deepen S360's read by more than half a point (O151): ${it['1'].outcome}`, `     ${it['1'].cells.map(c => `world ${c.k}: RSO less BO ${f4(c.D)} (${f4(c.lo)} to ${f4(c.hi)}), ${c.c} saved/${c.b} lost of ${c.N}`).join('; ')}`);
  L.push(`     the 2 x 2 (own opening's table / runs, points): ${it.twoByTwo.map(x => `world ${x.k}: ${['BASE', 'RS', 'BO', 'RSO'].map(a => `${a} ${f4(x[a].t)}/${f4(x[a].r)}`).join(', ')}`).join('; ')}`);
  L.push(`2. at S360's states the state's own pots carry at least half of the gap beyond the order-drawn reference (RR-MIXS): ${it['2'].outcome}`, `     ${[0, 1].map(k => { const l = it.ledger[k]; return `world ${k}: MIXS ${f4(l.MIXS)} (${f4(l.MIXSlo)} to ${f4(l.MIXShi)}) against GAP ${f4(l.GAP)} (${f4(l.GAPlo)} to ${f4(l.GAPhi)})`; }).join('; ')}`);
  L.push(`3. ORDER does not over-read the 95% share household by more than half a point: ${it['3'].outcome}`, `     ${it['3'].cells.map(c => `world ${c.k}: BO ${f4(c.bo.d)} (${f4(c.bo.lo)} to ${f4(c.bo.hi)}), BASE ${f4(c.base.d)} (${f4(c.base.lo)} to ${f4(c.base.hi)})`).join('; ')}`, `     BO's runs are BASE's in every world: ${it['3'].same ? 'SAME' : 'DIFFERENT'}`);
  L.push('', 'THE CAUSES (the registered map)', `   no gap shown beyond ORDER at S360's states (GAP's bottom at most 0 in worlds 0 and 1): ${it.clear ? 'YES' : 'NO'}`);
  for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);
  L.push('', 'THE LEDGER AT S360\'S YEAR-1 STATES (reported; per world, weighted by the year-0 nodes)');
  for (const l of it.ledger) L.push(`  world ${l.k}: REF ${e4(l.REF)} FS ${e4(l.FS)} OW ${e4(l.OW)} OS ${e4(l.OS)} OSW ${e4(l.OSW)} FB ${e4(l.FB)} (order ${l.order}); FORM ${f4(l.FORM)} MIXO ${f4(l.MIXO)} MIXS ${f4(l.MIXS)} SWEEP ${f4(l.SWEEP)} REST ${f4(l.REST)} (GAP ${f4(l.GAP)} = MIXS + SWEEP + REST)`);
  for (let k = 0; k < 3; k++) { const qd = Lj.quad[k]; L.push(`  quadrature world ${k}: five nodes ${e4(qd.gh)}, fine ${e4(qd.fine)}, ratio ${f4(qd.fine / qd.gh)}`); }
  L.push(`REALISED item 1: ${f4(it['1'].cells[0].D)}`, `REALISED item 3: ${f4(Math.max(...it['3'].cells.map(c => c.bo.d)))}`);
  L.push(`OUTCOME: ${['1', '2', '3'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  return L;
}

const EDGES = [], REACHED = {};
function planted() {
  const cases = [], ITEMS = ['1', '2', '3'];
  for (const i of ITEMS) REACHED[i] = new Set();
  const N = 1000000, FN = 40000, NP = 4000;
  // a base: S360's four arms at 40/45/60 against runs of 50/55/70 (an under-read of 10); RSO alike BO; the ledger with OW
  // at 0.2, OS at 0.3, FB at 0.4 in every world (MIXS ln 1.5 of a GAP of ln 2: 0.58 of it); the 95% share household's BO at
  // its runs, BASE ten under
  const mkO = (id, arm, tabs, oks) => ({ id, arm, label: `${arm}/P60S6Q5`, own: { ai: 0 }, tables: [0, 1, 2].map(k => ({ OWN: tabs[k] })), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { ok: oks[k], n: NP, bits: `h${oks[k]}` }])), bits: {} });
  const mkL = (spec = {}) => ({ id: 'S360', arm: 'L', label: 'L/P4S6Q5', quad: [0, 1, 2].map(() => ({ gh: 1, fine: 1 })),
    ledger: [0, 1, 2].map(k => { const s = spec[k] || {}, ow = s.ow ?? 0.2, os = s.os ?? 0.3, osw = s.osw ?? os; return [0, 1, 2, 3, 4].map(() => ({ w: 0.2, pr: 5e-4, form: Math.round(5e-4 * N), N, ow: [Math.round(ow * N), 0], owN: N, os: [Math.round(os * N), 0], osN: N, osw: [Math.round(osw * N), 0], oswN: N })); }),
    flow: [0, 1, 2].map(k => { const s = spec[k] || {}, fb = Math.round((s.fb ?? 0.4) * FN); return [{ ai: 0, bridge: fb, N: FN, survived: fb, N2: FN }, { ai: 1, bridge: 0, N: FN, survived: 0, N2: FN }]; }) });
  const base = (o = {}) => {
    const J = {}, R = [2000, 2200, 2800];
    J[key('S360', 'L/P4S6Q5')] = mkL(o.L || {});
    for (const a of ['BASE', 'RS', 'BO']) J[key('S360', `${a}/P60S6Q5`)] = mkO('S360', a, [40, 45, 60], R);
    J[key('S360', 'RSO/P60S6Q5')] = mkO('S360', 'RSO', o.rsoT || [40, 45, 60], R);
    J[key('share 0.95', 'BASE/P60S6Q5')] = mkO('share 0.95', 'BASE', [80, 85, 90], [3600, 3800, 3900]);
    J[key('share 0.95', 'BO/P60S6Q5')] = mkO('share 0.95', 'BO', o.boT || [90, 95, 97.5], o.boOk || [3600, 3800, 3900]);
    if (o.mut) o.mut(J);
    return J;
  };
  const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
  const bitsOf = (j, nm) => j.bits[nm] || ones(j.sims[nm].n, j.sims[nm].ok);
  const run = (o = {}) => items(base(o), bitsOf);
  const outc = (n, o, want, what) => { const got = run(o)[n].outcome; REACHED[n].add(got); cases.push([what, got, want]); };
  // item 1
  outc('1', {}, 'HELD', 'RSO reads S360 as BO: 1 HELD');
  outc('1', { rsoT: [38.5, 45, 60] }, 'FALSIFIED', 'RSO 1.5 lower than BO in world 0, the runs alike: 1 FALSIFIED');
  outc('1', { rsoT: [39.5, 45, 60] }, 'HELD', 'RSO exactly half a point lower in world 0: 1 HELD'); EDGES.push('a deepening exactly half a point');
  outc('1', { rsoT: [39, 45, 60] }, 'FALSIFIED', 'RSO exactly a point lower in world 0, 0 of 0 discordant: 1 FALSIFIED'); EDGES.push('a deepening exactly a point', '0 of 0 discordant paths');
  outc('1', { rsoT: [39.2, 45, 60] }, 'INCONCLUSIVE', 'RSO 0.8 lower in world 0: 1 INCONCLUSIVE');
  outc('1', { rsoT: [40, 44, 60] }, 'INCONCLUSIVE', 'RSO a point lower in world 1 only: 1 INCONCLUSIVE');
  { const J = base({ rsoT: [39.7, 45, 60] }), jr = J[key('S360', 'RSO/P60S6Q5')], jb = J[key('S360', 'BO/P60S6Q5')];
    const bB = ones(NP, 2000), bR = ones(NP, 2000); for (let i = 1980; i < 2000; i++) bR[i] = 0; for (let i = 2000; i < 2020; i++) bR[i] = 1; jb.bits.OWN0 = bB; jr.bits.OWN0 = bR;
    const got = items(J, bitsOf)['1'].outcome; REACHED['1'].add(got); cases.push(['RSO 0.3 lower in world 0 with 20 saved and 20 lost: 1 INCONCLUSIVE', got, 'INCONCLUSIVE']); }
  // item 2
  outc('2', {}, 'HELD', 'MIXS ln 1.5 of a GAP of ln 2 (0.58) in worlds 0 and 1: 2 HELD');
  outc('2', { L: { 0: { os: 0.21 }, 1: { os: 0.21 } } }, 'FALSIFIED', 'MIXS ln 1.05 of a GAP of ln 2 in worlds 0 and 1: 2 FALSIFIED');
  outc('2', { L: { 1: { os: 0.21 } } }, 'INCONCLUSIVE', 'MIXS carries the gap in world 0 only: 2 INCONCLUSIVE');
  outc('2', { L: { 2: { os: 0.21 } } }, 'HELD', 'MIXS small in world 2 only: 2 reads worlds 0 and 1, HELD');
  outc('2', { L: { 0: { fb: 0.2, os: 0.21 }, 1: { fb: 0.2, os: 0.21 } } }, 'INCONCLUSIVE', 'no gap beyond ORDER (FB at OW): 2 not FALSIFIED'); EDGES.push('a gap at zero');
  outc('2', { L: { 0: { os: 0 }, 1: { os: 0 } } }, 'FALSIFIED', 'the state\'s pots paying nothing (zero counts): 2 FALSIFIED');
  outc('2', { L: { 0: { fb: 0 }, 1: { fb: 0 } } }, 'INCONCLUSIVE', 'the engine paying no bridge (zero flow counts): 2 INCONCLUSIVE'); EDGES.push('a ledger count at zero');
  { // the edge: MIXS's bottom exactly half of GAP's top, by setting FB so that GAP's top is twice MIXS's bottom (computed apart from ledgerOf)
    const J = base(), Lj = J[key('S360', 'L/P4S6Q5')];
    for (const k of [0, 1]) { const rows = Lj.ledger[k], osLo = rows.reduce((t, x) => t + x.w * cp(Math.max(...x.os), x.N, 2 * a2)[0], 0), owHi = rows.reduce((t, x) => t + x.w * cp(Math.max(...x.ow), x.N, 2 * a2)[1], 0), owLo = rows.reduce((t, x) => t + x.w * cp(Math.max(...x.ow), x.N, 2 * a2)[0], 0);
      const target = Math.exp(2 * (Math.log(osLo) - Math.log(owHi))) * owLo; let lo = 0, hi = FN; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cp(mid, FN, 2 * a2)[1] <= target) lo = mid; else hi = mid; } Lj.flow[k][0].bridge = lo; Lj.flow[k][0].survived = lo; }
    const got = items(J, bitsOf)['2'].outcome; REACHED['2'].add(got); cases.push(['MIXS\'s bottom at or above half of GAP\'s top by under one path: 2 HELD', got, 'HELD']); EDGES.push('a share at half of the interval\'s edge'); }
  { // the exact edge: MIXS's bottom exactly half of GAP's top, by a continuous node weight (row 4's os differs), and just under it
    const edge = (eps) => { const J = base(), Lj = J[key('S360', 'L/P4S6Q5')];
      for (const k of [0, 1]) { const rows = Lj.ledger[k]; rows[4].os = [Math.round(0.6 * N), 0];
        const owHi = cp(rows[0].ow[0], N, 2 * a2)[1], owLo = cp(rows[0].ow[0], N, 2 * a2)[0], fbHi = cp(Lj.flow[k][0].bridge, FN, 2 * a2)[1];
        const target = Math.exp(0.5 * (Math.log(fbHi) - Math.log(owLo))) * owHi * (1 - eps), a = cp(rows[4].os[0], N, 2 * a2)[0], b = cp(rows[0].os[0], N, 2 * a2)[0];
        const w4 = (target - b) / (a - b); rows.forEach((x, i) => { x.w = i === 4 ? w4 : (1 - w4) / 4; }); }
      return items(J, bitsOf)['2'].outcome; };
    let g = edge(0); REACHED['2'].add(g); cases.push(['MIXS\'s bottom exactly half of GAP\'s top in worlds 0 and 1 (a continuous weight): 2 HELD', g, 'HELD']); EDGES.push('a share exactly half at the interval\'s edge');
    g = edge(0.001); REACHED['2'].add(g); cases.push(['MIXS\'s bottom a thousandth under half of GAP\'s top, above half its point: 2 INCONCLUSIVE', g, 'INCONCLUSIVE']);
    g = edge(1e-12); cases.push(['MIXS\'s bottom 1e-12 under half of GAP\'s top, equal on the rounding: 2 HELD', g, 'HELD']); EDGES.push('a share at the line only after rounding'); }
  outc('2', { L: { 0: { fb: 0.2, os: 0.1 }, 1: { fb: 0.2, os: 0.1 } } }, 'INCONCLUSIVE', 'no gap shown and MIXS negative: 2 not FALSIFIED');
  { const L = {}; for (const k of [0, 1]) { const gap = Math.log(0.4 / 0.2); L[k] = { os: 0.2 * Math.exp(0.5 * gap - 0.005) }; } outc('2', { L }, 'INCONCLUSIVE', 'MIXS just under half of GAP\'s point, its top above half GAP\'s bottom: 2 not FALSIFIED'); }
  { const L = {}; for (const k of [0, 1]) L[k] = { ow: 2e-5, os: 2e-5 * Math.exp(0.6 * Math.log(0.4 / 2e-5)), fb: 0.4 }; outc('2', { L }, 'HELD', 'small reference counts (20 of a million), MIXS 0.6 of a large GAP: 2 HELD'); }
  { const L = {}; for (const k of [0, 1]) { const ow = 3e-6, fb = 3e-4; L[k] = { ow, fb, os: ow * Math.exp(0.56 * Math.log(fb / ow)) }; } outc('2', { L }, 'INCONCLUSIVE', 'MIXS 0.56 of GAP on counts of 3 and 12 and a flow of 12 paths, the intervals deciding: 2 INCONCLUSIVE'); }
  // item 1 against the right arm: BO two points above BASE in world 0, RSO at BASE
  outc('1', { mut: J => { J[key('S360', 'BO/P60S6Q5')].tables[0].OWN = 42; } }, 'FALSIFIED', 'RSO two points under BO in world 0 (BO two above BASE, RSO at BASE): 1 FALSIFIED');
  // item 3
  outc('3', {}, 'HELD', 'BO at the 95% share household\'s runs: 3 HELD');
  outc('3', { boT: [92, 95, 97.5] }, 'FALSIFIED', 'BO two points above its runs in world 0: 3 FALSIFIED');
  outc('3', { boT: [90.8, 95, 97.5] }, 'INCONCLUSIVE', 'BO 0.8 above its runs in world 0, its interval reaching under 0.5: 3 INCONCLUSIVE');
  { const [, h] = cp(3600, NP, 2 * a3), t = 100 * h + 0.5; outc('3', { boT: [t, 95, 97.5] }, 'INCONCLUSIVE', 'BO\'s bottom exactly 0.5 above its runs: 3 not FALSIFIED'); EDGES.push('an over-read exactly half a point'); }
  outc('3', { boT: [90.5, 95, 97.5] }, 'HELD', 'BO\'s point exactly 0.5 above its runs: 3 HELD');
  cases.push(['BO\'s runs alike BASE\'s: SAME', run({})['3'].same, true]);
  cases.push(['BO\'s runs differing from BASE\'s in world 2: DIFFERENT', run({ boOk: [3600, 3800, 3901] })['3'].same, false]);
  // the causes
  const cz = (o, c) => run(o).causes[c];
  cases.push(['1 HELD: O151-REF held, O151-RS not', `${cz({}, 'O151-REF')} ${cz({}, 'O151-RS')}`, 'held not']);
  { const nogap = { 0: { fb: 0.2 }, 1: { fb: 0.2 } };
    cases.push(['1 FALSIFIED, GAP shown in worlds 0 and 1: both open (ORDER\'s shortfall may be the deepening)', `${cz({ rsoT: [38.5, 45, 60] }, 'O151-REF')} ${cz({ rsoT: [38.5, 45, 60] }, 'O151-RS')}`, 'open open']);
    cases.push(['1 FALSIFIED, no GAP shown (FB at OW) in worlds 0 and 1: O151-REF not, O151-RS held', `${cz({ rsoT: [38.5, 45, 60], L: nogap }, 'O151-REF')} ${cz({ rsoT: [38.5, 45, 60], L: nogap }, 'O151-RS')}`, 'not held']);
    cases.push(['1 FALSIFIED, GAP shown in world 1 only: both open', `${cz({ rsoT: [38.5, 45, 60], L: { 0: { fb: 0.2 } } }, 'O151-REF')} ${cz({ rsoT: [38.5, 45, 60], L: { 0: { fb: 0.2 } } }, 'O151-RS')}`, 'open open']);
    cases.push(['1 FALSIFIED, GAP shown in world 2 only: O151-RS held (worlds 0 and 1 decide)', cz({ rsoT: [38.5, 45, 60], L: { 0: { fb: 0.2 }, 1: { fb: 0.2 } } }, 'O151-RS'), 'held']);
    cases.push(['1 FALSIFIED, the engine paying no bridge (GAP\'s bottom not finite): both open', `${cz({ rsoT: [38.5, 45, 60], L: { 0: { fb: 0 }, 1: { fb: 0 } } }, 'O151-REF')} ${cz({ rsoT: [38.5, 45, 60], L: { 0: { fb: 0 }, 1: { fb: 0 } } }, 'O151-RS')}`, 'open open']); EDGES.push('a gap bound not finite');
    cases.push(['1 HELD, GAP shown: O151-REF held, O151-RS not (the clearance reads FALSIFIED only)', `${cz({}, 'O151-REF')} ${cz({}, 'O151-RS')}`, 'held not']);
    cases.push(['1 HELD, no GAP shown: O151-REF held, O151-RS not', `${cz({ L: nogap }, 'O151-REF')} ${cz({ L: nogap }, 'O151-RS')}`, 'held not']);
    cases.push(['the clearance: no GAP shown reads YES, GAP shown NO', `${run({ L: nogap }).clear} ${run({}).clear}`, 'true false']);
    cases.push(['1 FALSIFIED, GAP\'s point above 0 but its bottom under (FB 1% over OW): O151-RS held', cz({ rsoT: [38.5, 45, 60], L: { 0: { fb: 0.202 }, 1: { fb: 0.202 } } }, 'O151-RS'), 'held']); EDGES.push('a gap\'s point above 0, its bottom under');
    { const rd = o => (report(base(o), bitsOf).find(l => l.includes('no gap shown beyond ORDER')) || '').trim().split(': ').pop();
      cases.push(['the read prints the clearance: YES with no GAP shown, NO with it', `${rd({ L: nogap })} ${rd({})}`, 'YES NO']); } }
  cases.push(['1 INCONCLUSIVE: both open', `${cz({ rsoT: [39.2, 45, 60] }, 'O151-REF')} ${cz({ rsoT: [39.2, 45, 60] }, 'O151-RS')}`, 'open open']);
  cases.push(['2 HELD: RR-MIXS held', cz({}, 'RR-MIXS'), 'held']);
  cases.push(['2 FALSIFIED: RR-MIXS not', cz({ L: { 0: { os: 0.21 }, 1: { os: 0.21 } } }, 'RR-MIXS'), 'not']);
  // the ledger: GAP = MIXS + SWEEP + REST
  { const J = base({ L: { 0: { os: 0.3, osw: 0.35, fb: 0.45 } } }), l = ledgerOf(J[key('S360', 'L/P4S6Q5')], 0); cases.push(['the ledger: GAP is MIXS + SWEEP + REST', q(l.MIXS + l.SWEEP + l.REST) === q(l.GAP), true]); }
  // the read end to end
  { let lines = [], err = null; try { lines = report(base(), bitsOf); } catch (e) { err = e.message; }
    const oc = lines.find(l => l.startsWith('OUTCOME: ')) || '';
    cases.push(['the read prints every item, three causes and an OUTCOME line of three items, end to end', err || `${['1.', '2.', '3.'].every(p => lines.some(l => l.startsWith(p)))} ${lines.filter(l => l.startsWith('=> ')).length} ${oc.split(', ').length} ${lines.some(l => /runs are BASE's in every world: (SAME|DIFFERENT)$/.test(l))}`, 'true 3 3 true']); }
  // the gate, on synthetic logs built as the audit prints
  const pad = ''.padEnd(16);
  const jobText = (jb, o = {}) => {
    const [id, arm, pts0] = jb, L = jobLabel(jb), pts = o.pts || (arm === 'L' ? 4 : Math.max(4, Math.round(pts0 / 30)));
    const ran = `bridgeRead reader bridgeStep exact readerSplit ${o.split || SPLIT[arm]} readerBlend null readerRef ${o.ref || REFOF[arm]} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls ${o.e3 || 'true'} switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${o.ranPts || pts} grid ${o.grid || `total${pts}x6x6`} floor ${o.floor || FLOORS[id]} line ${o.line || 0.5}`;
    const out = [`${id.padEnd(16)} case | job ${L} | points ${pts} | lambda 0.0223606797749979`, `${pad} solve CAND ${L}: table 3.0 secs 1`, `${pad} ran CAND ${L}: ${ran}`, `${pad} checks ${L}: armTook ${o.armTook !== undefined ? o.armTook : 1}/1`, `${pad} openings ${L}: OWN ai 12 level 0.8 tiers 0,0`];
    const dr = o.draws || 10000, fn = o.flow || 400;
    if (arm === 'L') {
      const wts = o.fourRows ? [0.011257, 0.222076, 0.533333, 0.233334] : [0.011257, 0.222076, 0.533333, 0.222076, 0.011257];
      if (!o.dropP) out.push(`${pad} P ${L}: ai ${o.P !== undefined ? o.P : 12} level 0.8 steps cash>other>isa>penPA>penBasic>penAny`);
      out.push(`${pad} orders ${L}: 0 cash>gia>isa ai 12; 1 isa>cash>gia ai 57`, `${pad} opening ${L}: isa 5.000000e-1 gia 1.250000e-1 cash ${o.cashW || '3.750000e-1'}`);
      for (let k = 0; k < 3; k++) {
        out.push(`${pad} schedule ${L} ${k}: t 1 ai0 0 bills 4000.00,4000.00 buffers 2000.00,2000.00`);
        for (let i = 0; i < wts.length; i++) if (!(o.dropRow === `${k}${i}`)) out.push(`${pad} ledger ${L} ${k} ${i}: z 0.000000 w ${wts[i].toFixed(6)} acc 50000.00 isa 25000.00 gia 10000.00 cash 15000.00 pr 1.000000e-3 form 900/${dr} ow 950,940/${dr} os 990,980/${dr} osw 995,985/${o.oswN || dr}`);
        if (!o.dropQuad) out.push(`${pad} quad ${L} ${k}: gh 1.000000e-3 fine 1.000000e-3 fit 1.00e-4`);
        for (let i = 0; i < 2; i++) if (!(o.dropFlow === `${k}${i}`)) out.push(`${pad} flow ${L} ${k} ${i} ai ${i ? 57 : 12}: bridge 30/${o.flowN || fn} survived 20/${fn} bits ${'b'.repeat(16)} ${'s'.repeat(16)}`);
      }
      out.push(`${pad} checks ${L}: mirrorTook ${o.mirror || '300/300'}`);
    } else {
      for (let k = 0; k < 3; k++) if (!o.dropTable) out.push(`${pad} tables ${L} ${k} z 0 weight ${[1 / 6, 2 / 3, 1 / 6][k].toFixed(6)}: OWN 3.000000`);
      for (let k = 0; k < 3; k++) if (!(o.dropRun === k)) out.push(`${pad} sim ${L} ${k} OWN ai 12: 2/${o.runN || 4} bridge ${o.bridge !== undefined ? o.bridge : 3} bits ${'b'.repeat(16)} ${'c'.repeat(16)}`);
      out.push(`${pad} checks ${L}: forceIdentity ${o.fi !== undefined ? o.fi : 4}/${o.fiN || 4} secs 1`);
    }
    out.push(`${pad} file ${L}: f-${id}-${arm}`);
    if (!o.dropDone) out.push(`${pad} done ${L}`);
    return `stamp: code ${o.code || 'c0'} audit a0 prediction ${PRED} sha s0\nREF-2: the candidate's own unit, ${o.npw || 4} paths a world, wealth points divided by ${o.scale || 30} (seed ${o.seed || 7002}); ledger draws ${o.headDraws || dr}, flow paths ${o.headFlow || fn}; 5 jobs; part 0/1\n${out.join('\n')}\n`;
  };
  const all = (mod = {}) => JOBS.map(jb => parse(jobText(jb, mod[key(jb[0], jobLabel(jb))] || {}))).flat();
  const G0 = { npw: 4, scale: 30, draws: 10000, flow: 400 };
  const refuses = (what, jobs, opts = {}) => cases.push([`the gate refuses ${what}`, gate(jobs, { ...G0, ...opts }).length > 0, true]);
  const KL = key('S360', 'L/P4S6Q5'), KB = key('S360', 'BO/P60S6Q5'), KR = key('S360', 'RSO/P60S6Q5'), KS = key('share 0.95', 'BASE/P60S6Q5'), KT = key('share 0.95', 'BO/P60S6Q5');
  cases.push(['the gate passes the five jobs as registered', gate(all(), G0).length, 0]);
  refuses('a missing job', all().filter(j => j.label !== 'RSO/P60S6Q5'));
  refuses('a job run twice', [...all(), ...all().filter(j => j.id === 'share 0.95' && j.arm === 'BO')]);
  refuses('a job with no done line', all({ [KR]: { dropDone: true } }));
  refuses('a stamp from other code', all({ [KS]: { code: 'c1' } }));
  refuses('another seed', all({ [KT]: { seed: 7013 } }));
  refuses('another path count in the head', all({ [KT]: { npw: 5 } }));
  refuses('another scale in the head', all({ [KT]: { scale: 15 } }));
  refuses('other ledger draws in the head', all({ [KL]: { headDraws: 20000 } }));
  refuses('other flow paths in the head', all({ [KL]: { headFlow: 401 } }));
  refuses('the ledger at other points', all({ [KL]: { pts: 5 } }));
  refuses('a 60-point job at other points', all({ [KB]: { pts: 5 } }));
  refuses('a case line at other points than its ran line', all({ [KB]: { pts: 5, ranPts: 4, grid: 'total4x6x6' } }));
  refuses('armTook 0', all({ [KB]: { armTook: 0 } }));
  refuses('BO without readerRef order', all({ [KB]: { ref: 'null' } }));
  refuses('RSO without its split', all({ [KR]: { split: 'null' } }));
  refuses('the 95% share household\'s BASE under ORDER', all({ [KS]: { ref: 'order' } }));
  refuses('another minimum end pot', all({ [KT]: { floor: 5000 } }));
  refuses('another support line', all({ [KR]: { line: 0.25 } }));
  refuses('the candidate without e3pcls', all({ [KB]: { e3: 'false' } }));
  refuses('mirrorTook short', all({ [KL]: { mirror: '299/300' } }));
  refuses('mirrorTook over nothing', all({ [KL]: { mirror: '0/0' } }));
  refuses('no P line', all({ [KL]: { dropP: true } }));
  refuses('P not among the flow moves', all({ [KL]: { P: 27 } }));
  refuses('opening weights not summing to 1', all({ [KL]: { cashW: '4.750000e-1' } }));
  refuses('a ledger row missing', all({ [KL]: { dropRow: '13' } }));
  refuses('a world of four ledger rows whose weights sum to 1', all({ [KL]: { fourRows: true } }));
  refuses('the sweep\'s counts out of other draws', all({ [KL]: { oswN: 9999 } }));
  refuses('a quadrature line missing', all({ [KL]: { dropQuad: true } }));
  refuses('a flow line missing', all({ [KL]: { dropFlow: '21' } }));
  refuses('flow counts out of other paths', all({ [KL]: { flowN: 399 } }));
  refuses('a missing world table', all({ [KS]: { dropTable: true } }));
  refuses('a missing run in world 2', all({ [KT]: { dropRun: 2 } }));
  refuses('runs on other paths than registered', all({ [KT]: { runN: 5 } }));
  refuses('fewer paying the bridge than surviving', all({ [KB]: { bridge: 1 } }));
  refuses('forceIdentity one path short', all({ [KR]: { fi: 3 } }));
  refuses('forceIdentity over fewer paths than registered', all({ [KR]: { fi: 3, fiN: 3 } }));
  cases.push(['the gate passes NE-REF\'s S360 jobs on this run\'s code', gate(all(), { ...G0, neref: { code: 'c0' } }).length, 0]);
  refuses('NE-REF\'s S360 jobs on other code', all(), { neref: { code: 'c9' } }); EDGES.push('the 2 x 2 across two codes');
  { const jobs = all(), files = {}; for (const j of jobs) { const bits = {}; if (j.arm === 'L') j.flow.forEach((fl, w) => fl.forEach((x, i) => { bits[`B${w}o${i}`] = 'AAAA'; bits[`S${w}o${i}`] = 'AQAA'; })); else Object.keys(j.sims).forEach(nm => { bits[nm] = 'AAAA'; bits[`${nm}b`] = 'AQAA'; }); files[j.file] = { stamp: j.stamp, bits }; }
    const shOf = s => sha16(Buffer.from(s, 'base64'));
    for (const j of jobs) { if (j.arm === 'L') j.flow.forEach(fl => fl.forEach(x => { x.bitsB = shOf('AAAA'); x.bitsS = shOf('AQAA'); })); else Object.values(j.sims).forEach(s => { s.bits = shOf('AAAA'); s.bitsB = shOf('AQAA'); }); }
    cases.push(['the gate passes files whose bits are the log\'s', gate(jobs, { ...G0, files }).length, 0]);
    refuses('a missing file', jobs, { files: { ...files, [jobs[1].file]: undefined } });
    refuses('a file stamped by other code', jobs, { files: { ...files, [jobs[2].file]: { ...files[jobs[2].file], stamp: { ...jobs[2].stamp, code: 'c9' } } } });
    refuses('a file whose bits are not the log\'s', jobs, { files: { ...files, [jobs[0].file]: { ...files[jobs[0].file], bits: { ...files[jobs[0].file].bits, B1o0: 'AgAA' } } } });
  }
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
  const DIR = args[0] || join(HERE, 'results', 'diagref2'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1), drawsA = Number(args[3] || DRAWS), flowA = Number(args[4] || FLOWN);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const gz = d => Object.fromEntries(readdirSync(d).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(d, f))).toString())]));
  const files = gz(DIR), bad = [];
  let neref = null, extra = [], nerefFiles = null;
  if (!PRE) {
    // NE-REF's S360 BASE and RS jobs, behind NE-REF's own reducer gate (its main, over its folder)
    const DN = join(HERE, 'results', 'diagneref'), red = spawnSync('node', [join(HERE, 'reduce-neref.mjs'), DN], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) bad.push('NE-REF\'s files did not pass NE-REF\'s gate');
    else {
      const NR = await import('./reduce-neref.mjs'), txt = readdirSync(DN).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DN, f), 'utf8'));
      const nj = txt.flatMap(NR.parse).filter(j => j.id === 'S360' && (j.arm === 'BASE' || j.arm === 'RS'));
      if (nj.length !== 2) bad.push('NE-REF\'s S360 BASE and RS jobs are not both there');
      else { neref = { code: nj[0].stamp.code }; extra = nj.map(j => ({ ...j, tables: j.tables.map(t => ({ OWN: t.OWN })) })); nerefFiles = gz(DN); }
    }
  }
  bad.push(...gate(jobs, { npw: npwA, scale: scaleA, draws: drawsA, flow: flowA, files, neref }));
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the five jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}, ledger draws ${drawsA}, flow paths ${flowA}); every job's split and reference in its solve's meta; every self-check passed (armTook, mirrorTook, forceIdentity); every file the log's${PRE ? '' : '; NE-REF\'s S360 BASE and RS behind NE-REF\'s gate, on this run\'s code'}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const J = Object.fromEntries([...jobs, ...extra].map(j => [key(j.id, j.label), j]));
  const bitsOf = (j, nm) => Buffer.from(((extra.includes(j) ? nerefFiles : files)[j.file]).bits[nm], 'base64');
  console.log('\nREF-2: S360\'s 2 x 2 (BASE, RS, BO, RSO), the ledger at S360\'s states, the 95% share household under BASE and BO (predictions/diag-ref2.md)');
  for (const L of report(J, bitsOf)) console.log(L);
}
