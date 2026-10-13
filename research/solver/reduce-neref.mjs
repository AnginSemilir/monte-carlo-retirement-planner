/*
 * NE-REF'S REDUCER (PLAN.md NE-REF; predictions/diag-neref.md; audit-neref.mjs).
 *   node research/solver/reduce-neref.mjs [dir=results/diagneref] [paths=4000] [scale=1] [draws=1000000] [flow=40000] [--preflight]
 *   node research/solver/reduce-neref.mjs --planted
 * THE GATE: the five jobs once and done, one stamp (code, audit, prediction) across the logs and in every file; each at the
 *   registered settings (paths a world, scale, seed, ledger draws, flow paths; L at 4 wealth points, the others at 60 over
 *   the scale), the candidate's settings, the job's readerSplit and readerRef in its solve's meta (armTook and the ran line),
 *   the household's minimum end pot and the support line 0.5. L: the two draw orders with P (ai 12) among the flow moves,
 *   a schedule, five ledger rows, a quadrature line and one flow line an order in every world, counts out of the registered
 *   draws and flow paths, mirrorTook whole. RSP: the forced pair, P's tables, P's runs of the registered paths in world 0 and
 *   of the flow paths in worlds 1 and 2, with their first paths' count and bits. RSO: the forced pair (pairTook), P, D and
 *   (where the own opening is neither) OWN tables and runs in every world. S360's two: OWN tables and runs in every world. Every non-ledger job: forceIdentity on
 *   world 0's first min(paths, 1,000). Every file's bits the log's.
 *   THE IDENTITY CONTROL (not in --preflight): NE-EDGE's files pass NE-EDGE's own reducer gate; L's mean reference chance
 *   in each world (its five reads) is NE-EDGE's RS probe line's to the printed digits, so the ledger's states are the
 *   60-point read's (the states are the grid's flow, not its tables); RSP's tables at P are NE-EDGE's RS job's to the
 *   printed digits and its first paths' runs NE-EDGE's RS P runs, count and bits, in every world.
 * THE LEDGER (per world k, the five reads weighted by the year-0 nodes; a count's interval its exact one at 2 x a1, a1 =
 *   ALPHA / 4): T, RS's 60-point table at P (RSP's, NE-EDGE's by the identity control); r, RSP's runs at P; REF, the closed form; FS, the mix
 *   simulated; OW and OS, pot by pot at the opening weights and at the state's own pots, the better order a read; FB and
 *   FSV, the engine under the better order's fixed move (by its bridge count), its bridge paid and its survival. The log
 *   gap G = ln r - ln T telescopes: COPY (ln REF - ln T) + FORM (ln FS - ln REF) + MIXO (ln OW - ln FS) + MIXS (ln OS -
 *   ln OW) + FLOW (ln FB - ln OS) + AFTER (ln FSV - ln FB) + POLICY (ln r - ln FSV). MIX = MIXO + MIXS.
 * THE ITEMS (every threshold read on the figure rounded to 1e-9; worlds 1 and 2 decide items 1-3, world 0 reported):
 *   1 (O150-REFMIX): MIX carries at least half of G. A world holds when MIX's interval bottom is at least half G's top
 *     (G's top above 0); it falls when G's bottom is above 0 and MIX's top is under half of it. HELD when both worlds hold;
 *     FALSIFIED when both fall; INCONCLUSIVE otherwise.
 *   2 (O150-REFFLOW): the engine beyond the reference - FLOW + AFTER + POLICY, ln r - ln OS - carries at least half of G,
 *     read as item 1 (the deep review's REFFLOW: the engine's payment beyond the best fixed order, the policy's yearly
 *     choices and the flow's bills).
 *   3 (O150-FORM): the closed form is not pessimistic against its own mix. A world holds when FS's top is at most 1.1 x
 *     REF; it falls when FS's bottom is at least 1.5 x REF. HELD when both worlds hold; FALSIFIED when either falls;
 *     INCONCLUSIVE otherwise.
 *   4: RS with readerRef 'order' halves S364's world-2 under-read at P. d, RSO's world-2 table at P less its P runs (its
 *     exact interval at ALPHA), against d2, RSP's (the same paths' first 4,000 as RSO's, its 40,000 for the point). HELD when d's bottom is above d2 and d is at least d2 / 2; FALSIFIED
 *     when d's top is under d2 / 2; INCONCLUSIVE otherwise.
 *   5: RS does not deepen S360's under-read. Per world, D = (RS's own table - BASE's) less (RS's own runs - BASE's), the
 *     runs paired by path (the discordant paths' exact interval at 2 x a5, a5 = ALPHA / 6), in points. HELD when every
 *     world's D bottom is at least -0.5; FALSIFIED when any world's D top is under -0.5; INCONCLUSIVE otherwise.
 * THE CAUSES (the deep review after NE-EDGE's, deep-review-log.md 13 Oct 11:00 UK): O150-REFMIX held on 1 HELD, not on 1
 *   FALSIFIED; O150-REFFLOW held on 2 HELD, not on 2 FALSIFIED; O150-FORM not on 3 HELD, held on 3 FALSIFIED; open
 *   otherwise. The ledger is a measurement at every state, so each term reaches its mechanism by construction. COPY (O150-
 *   COPYC) and the quadrature's ratio (O150-QUAD) are reported.
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
export const PRED = 'research/solver/predictions/diag-neref.md';
export const SEED = '7002', NPW = 4000, DRAWS = 1000000, FLOWN = 40000, ALPHA = 0.05;
export const HALF = 0.5, FORM_OK = 1.1, FORM_BAD = 1.5, DEEP = -0.5;
export const JOBS = [['S364', 'L', 4], ['S364', 'RSP', 60], ['S364', 'RSO', 60], ['S360', 'BASE', 60], ['S360', 'RS', 60]];
export const SPLIT = Object.freeze({ L: 'rs', RSP: 'rs', RSO: 'rs', BASE: 'null', RS: 'rs' });
export const REFOF = Object.freeze({ L: 'null', RSP: 'null', RSO: 'order', BASE: 'null', RS: 'null' });
export const FLOORS = Object.freeze({ S364: 205000, S360: 5000 });
export const PAIRS = Object.freeze({ S364: [12, 14] });
export const WEIGHTS = [1 / 6, 2 / 3, 1 / 6];
export const jobLabel = ([, arm, pts]) => `${arm}/P${pts}S6Q5`;
export const key = (id, label) => `${id} ${label}`;
export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const a1 = ALPHA / 4, a5 = ALPHA / 6;
const CASEL = /^(S364|S360)\s+case \| job ((L|RSP|RSO|BASE|RS)\/P(\d+)S6Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^NE-REF: .*, (\d+) paths a world, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\); ledger draws (\d+), flow paths (\d+);/;
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
        checks: {}, tables: [], sims: {}, first: {}, ledger: [[], [], []], schedule: [], quad: [], flow: [[], [], []], orders: null, opening: null, own: null, pair: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label;
    let m;
    if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^openings ${esc(L)}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^pair ${esc(L)}: P ai (\\d+) level (\\S+) tiers (\\S+); D ai (\\d+) level (\\S+) tiers (\\S+)$`).exec(l))) j.pair = { P: Number(m[1]), D: Number(m[4]) };
    else if ((m = new RegExp(`^orders ${esc(L)}: (.*)$`).exec(l))) j.orders = m[1].split('; ').map(x => { const y = /^(\d+) (\S+) ai (\d+)$/.exec(x); return y ? { i: Number(y[1]), order: y[2], ai: Number(y[3]) } : null; });
    else if ((m = new RegExp(`^opening ${esc(L)}: isa (\\S+) gia (\\S+) cash (\\S+)$`).exec(l))) j.opening = { isa: Number(m[1]), gia: Number(m[2]), cash: Number(m[3]) };
    else if ((m = new RegExp(`^schedule ${esc(L)} (\\d): t (\\d+) ai0 (\\d+) bills (\\S+)$`).exec(l))) j.schedule[Number(m[1])] = { t: Number(m[2]), ai0: Number(m[3]), bills: m[4] };
    else if ((m = new RegExp(`^ledger ${esc(L)} (\\d) (\\d): z (\\S+) w (\\S+) acc (\\S+) isa (\\S+) gia (\\S+) cash (\\S+) pr (\\S+) form (\\d+)\\/(\\d+) ow (\\S+)\\/(\\d+) os (\\S+)\\/(\\d+)$`).exec(l))) {
      const k = Number(m[1]);
      j.ledger[k][Number(m[2])] = { z: Number(m[3]), w: Number(m[4]), acc: Number(m[5]), pr: Number(m[9]), prRaw: m[9], form: Number(m[10]), N: Number(m[11]), ow: m[12].split(',').map(Number), owN: Number(m[13]), os: m[14].split(',').map(Number), osN: Number(m[15]) };
    } else if ((m = new RegExp(`^quad ${esc(L)} (\\d): gh (\\S+) fine (\\S+) fit (\\S+)$`).exec(l))) j.quad[Number(m[1])] = { gh: Number(m[2]), fine: Number(m[3]), fit: Number(m[4]) };
    else if ((m = new RegExp(`^flow ${esc(L)} (\\d) (\\d) ai (\\d+): bridge (\\d+)\\/(\\d+) survived (\\d+)\\/(\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.flow[Number(m[1])][Number(m[2])] = { ai: Number(m[3]), bridge: Number(m[4]), N: Number(m[5]), survived: Number(m[6]), N2: Number(m[7]), bitsB: m[8], bitsS: m[9] };
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): (.*)$`).exec(l))) { const t = { k: Number(m[1]), weight: Number(m[3]) }; for (const x of m[4].matchAll(/(P|D|OWN) (\S+)/g)) { t[x[1]] = Number(x[2]); } j.tables[Number(m[1])] = t; }
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) (P|D|OWN) ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`${m[2]}${m[1]}`] = { ai: Number(m[3]), ok: Number(m[4]), n: Number(m[5]), bridge: Number(m[6]), bits: m[7], bitsB: m[8] };
    else if ((m = new RegExp(`^first ${esc(L)} (\\d) (P|D|OWN): (\\d+)\\/(\\d+) bits (\\S+)$`).exec(l))) j.first[`${m[2]}${m[1]}`] = { ok: Number(m[3]), n: Number(m[4]), bits: m[5] };
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3' };
/* edge: NE-EDGE's S364 RS job ({ pr: [the probe's printed mean pr by world] }), behind NE-EDGE's gate; null in --preflight */
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, draws = DRAWS, flow = FLOWN, files = null, edge = null } = {}) {
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
      if (o.length !== 2 || o.some(x => !x) || !o.some(x => x.ai === PAIRS.S364[0])) bad.push(`${k}: not two draw orders with P among the flow moves`);
      if (!j.opening || !(Math.abs(j.opening.isa + j.opening.gia + j.opening.cash - 1) < 1e-5)) bad.push(`${k}: the opening weights are missing or do not sum to 1`);
      if (!j.checks.mirrorTook || !(j.checks.mirrorTook[1] > 0) || j.checks.mirrorTook[0] !== j.checks.mirrorTook[1]) bad.push(`${k}: mirrorTook did not pass`);
      for (let w = 0; w < 3; w++) {
        if (!j.schedule[w]) bad.push(`${k}: world ${w} has no schedule`);
        if (!j.quad[w]) bad.push(`${k}: world ${w} has no quadrature line`);
        const rows = j.ledger[w];
        if (rows.length !== 5 || [0, 1, 2, 3, 4].some(i => !rows[i])) { bad.push(`${k}: world ${w} has not five ledger rows`); continue; }
        if (Math.abs(rows.reduce((t, r) => t + r.w, 0) - 1) > 1e-5) bad.push(`${k}: world ${w}'s node weights do not sum to 1`);
        if (rows.some(r => r.N !== draws || r.owN !== draws || r.osN !== draws || r.ow.length !== 2 || r.os.length !== 2 || [r.form, ...r.ow, ...r.os].some(x => !(x >= 0 && x <= draws)))) bad.push(`${k}: world ${w}'s ledger counts are not out of ${draws} in two orders`);
        const fl = j.flow[w];
        if (fl.length !== 2 || [0, 1].some(i => !fl[i] || fl[i].N !== flow || fl[i].N2 !== flow || fl[i].survived > fl[i].bridge || (o[i] && fl[i].ai !== o[i].ai))) bad.push(`${k}: world ${w}'s flow lines are not one an order out of ${flow} paths`);
      }
    } else {
      const pair = PAIRS[j.id];
      if (pair && (!j.pair || j.pair.P !== pair[0] || j.pair.D !== pair[1] || !j.checks.pairTook || j.checks.pairTook[0] !== 1)) bad.push(`${k}: the forced pair is not the registered one`);
      const nm = j.own ? (pair && j.own.ai === pair[0] ? 'P' : pair && j.own.ai === pair[1] ? 'D' : 'OWN') : null;
      const runs = j.arm === 'RSP' ? ['P'] : pair ? ['P', 'D', ...(nm === 'OWN' ? ['OWN'] : [])] : ['OWN'];
      for (let w = 0; w < 3; w++) {
        const t = j.tables[w];
        if (!t || runs.some(r => !Number.isFinite(t[r === 'OWN' && nm !== 'OWN' ? nm : r] ?? NaN))) bad.push(`${k}: world ${w}'s tables are missing`);
        const nw = j.arm === 'RSP' && w > 0 ? flow : npw;
        for (const r of runs) { const s = j.sims[`${r}${w}`]; if (!s || s.n !== nw || s.bridge < s.ok) bad.push(`${k}: no ${r} run of ${nw} paths in world ${w}`); }
        if (j.arm === 'RSP' && w > 0) { const f = j.first[`P${w}`]; if (!f || f.n !== npw || f.ok > j.sims[`P${w}`].ok) bad.push(`${k}: no first ${npw} paths' line in world ${w}`); }
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
  if (edge) {
    const P = jobs.find(j => j.arm === 'RSP');
    if (P && edge.rs) for (let w = 0; w < 3; w++) {
      if (!P.tables[w] || P.tables[w].P.toFixed(6) !== edge.rs.tables[w].P.toFixed(6)) bad.push(`RSP: world ${w}'s table at P is not NE-EDGE's RS job's`);
      const mine = w > 0 ? P.first[`P${w}`] : P.sims[`P${w}`], theirs = edge.rs.sims[`P${w}`];
      if (!mine || !theirs || mine.ok !== theirs.ok || mine.bits !== theirs.bits) bad.push(`RSP: world ${w}'s first runs are not NE-EDGE's RS P runs`);
    }
    const Lj = jobs.find(j => j.arm === 'L');
    if (Lj) for (let w = 0; w < 3; w++) { const rows = Lj.ledger[w]; if (rows.length !== 5) continue; const mean = rows.reduce((t, r) => t + r.pr, 0) / 5; if (mean.toExponential(4) !== edge.pr[w]) bad.push(`L: world ${w}'s mean reference chance ${mean.toExponential(4)} is not NE-EDGE's RS probe's ${edge.pr[w]}`); }
  }
  return bad;
}

const cp = (ok, n, al) => clopperPearson(ok, n, al);
const ln = x => (x > 0 ? Math.log(x) : -Infinity);
/* the ledger of one world: Lj the L job, k the world, T RS's table at P (points), r RS's runs at P { ok, n } */
export function ledgerOf(Lj, k, T, r) {
  const rows = Lj.ledger[k], N = rows[0].N, wsum = f => rows.reduce((t, x) => t + x.w * f(x), 0);
  const best = arr => arr.reduce((b, x, i) => (x > arr[b] ? i : b), 0);
  const REF = wsum(x => x.pr);
  const FS = wsum(x => x.form / N), FSlo = wsum(x => cp(x.form, N, 2 * a1)[0]), FShi = wsum(x => cp(x.form, N, 2 * a1)[1]);
  const OW = wsum(x => x.ow[best(x.ow)] / N);
  const OS = wsum(x => x.os[best(x.os)] / N), OSlo = wsum(x => cp(x.os[best(x.os)], N, 2 * a1)[0]), OShi = wsum(x => cp(x.os[best(x.os)], N, 2 * a1)[1]);
  const fl = Lj.flow[k], bi = fl[0].bridge >= fl[1].bridge ? 0 : 1, F = fl[bi], [fblo, fbhi] = cp(F.bridge, F.N, 2 * a1);
  const FB = F.bridge / F.N, FSV = F.survived / F.N;
  const tt = T / 100, rr = r.ok / r.n, [rlo, rhi] = cp(r.ok, r.n, 2 * a1);
  const G = ln(rr) - ln(tt), Glo = ln(rlo) - ln(tt), Ghi = ln(rhi) - ln(tt);
  const terms = { COPY: ln(REF) - ln(tt), FORM: ln(FS) - ln(REF), MIXO: ln(OW) - ln(FS), MIXS: ln(OS) - ln(OW), FLOW: ln(FB) - ln(OS), AFTER: ln(FSV) - ln(FB), POLICY: ln(rr) - ln(FSV) };
  return { k, T, r, REF, FS, FSlo, FShi, OW, OS, OSlo, OShi, FB, fblo, fbhi, FSV, order: bi, G, Glo, Ghi, terms,
    MIX: ln(OS) - ln(FS), MIXlo: ln(OSlo) - ln(FShi), MIXhi: ln(OShi) - ln(FSlo),
    FL: ln(FB) - ln(OS), FLlo: ln(fblo) - ln(OShi), FLhi: ln(fbhi) - ln(OSlo),
    EN: ln(rr) - ln(OS), ENlo: ln(rlo) - ln(OShi), ENhi: ln(rhi) - ln(OSlo),
    FORMlo: ln(FSlo) - ln(REF), FORMhi: ln(FShi) - ln(REF) };
}
const shareRead = (lo, hi, Glo, Ghi) => ({ holds: q(Ghi) > 0 && Number.isFinite(lo) && q(lo) >= q(HALF * Ghi), falls: Number.isFinite(Glo) && q(Glo) > 0 && q(hi) < q(HALF * Glo) });
export function offOf(table, ok, n, al = ALPHA) { const [l, h] = cp(ok, n, al); return { d: q(table - 100 * ok / n), lo: q(table - 100 * h), hi: q(table - 100 * l) }; }
/* J: this test's jobs by key; bitsOf(j, run) */
export function items(J, bitsOf) {
  const out = {}, Lj = J[key('S364', 'L/P4S6Q5')], rsp = J[key('S364', 'RSP/P60S6Q5')];
  const T = [0, 1, 2].map(k => rsp.tables[k].P), Rr = [0, 1, 2].map(k => ({ ok: rsp.sims[`P${k}`].ok, n: rsp.sims[`P${k}`].n }));
  const led = [0, 1, 2].map(k => ledgerOf(Lj, k, T[k], Rr[k]));
  out.ledger = led;
  const shareItem = (lo, hi) => { const w = [1, 2].map(k => shareRead(led[k][lo], led[k][hi], led[k].Glo, led[k].Ghi)); return w.every(x => x.holds) ? 'HELD' : w.every(x => x.falls) ? 'FALSIFIED' : 'INCONCLUSIVE'; };
  out['1'] = { outcome: shareItem('MIXlo', 'MIXhi') };
  out['2'] = { outcome: shareItem('ENlo', 'ENhi') };
  const f3 = [1, 2].map(k => ({ holds: q(led[k].FORMhi) <= q(Math.log(FORM_OK)), falls: Number.isFinite(led[k].FORMlo) && q(led[k].FORMlo) >= q(Math.log(FORM_BAD)) }));
  out['3'] = { outcome: f3.every(x => x.holds) ? 'HELD' : f3.some(x => x.falls) ? 'FALSIFIED' : 'INCONCLUSIVE' };
  // item 4: RSO's world-2 under-read at P against RS's (NE-EDGE)
  const rso = J[key('S364', 'RSO/P60S6Q5')], s2 = rso.sims.P2, o4 = offOf(rso.tables[2].P, s2.ok, s2.n), d2 = q(T[2] - 100 * Rr[2].ok / Rr[2].n);
  out['4'] = { outcome: o4.lo > d2 && o4.d >= q(d2 / 2) ? 'HELD' : o4.hi < q(d2 / 2) ? 'FALSIFIED' : 'INCONCLUSIVE', d: o4, d2 };
  // item 5: S360 under RS against BASE, each at its own opening, paired by path
  const jb = J[key('S360', 'BASE/P60S6Q5')], jr = J[key('S360', 'RS/P60S6Q5')];
  const c5 = [0, 1, 2].map(k => {
    const B = bitsOf(jb, `OWN${k}`), R = bitsOf(jr, `OWN${k}`), N = B.length;
    let b = 0, c = 0; for (let i = 0; i < N; i++) { if (B[i] && !R[i]) b++; else if (!B[i] && R[i]) c++; }
    const m = b + c, [lo, hi] = m ? cp(c, m, 2 * a5) : [0.5, 0.5], dT = jr.tables[k].OWN - jb.tables[k].OWN;
    const drLo = 100 * (2 * lo - 1) * m / N, drHi = 100 * (2 * hi - 1) * m / N, dr = 100 * (c - b) / N;
    return { k, b, c, N, dT: q(dT), D: q(dT - dr), lo: q(dT - drHi), hi: q(dT - drLo), tB: jb.tables[k].OWN, tR: jr.tables[k].OWN, sB: 100 * jb.sims[`OWN${k}`].ok / N, sR: 100 * jr.sims[`OWN${k}`].ok / N };
  });
  out['5'] = { outcome: c5.every(x => x.lo >= DEEP) ? 'HELD' : c5.some(x => x.hi < DEEP) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c5 };
  const o1 = out['1'].outcome, o2 = out['2'].outcome, o3 = out['3'].outcome;
  out.causes = {
    'O150-REFMIX': { HELD: 'held', FALSIFIED: 'not' }[o1] || 'open',
    'O150-REFFLOW': { HELD: 'held', FALSIFIED: 'not' }[o2] || 'open',
    'O150-FORM': { HELD: 'not', FALSIFIED: 'held' }[o3] || 'open',
  };
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), e4 = x => (Number.isFinite(x) ? x.toExponential(4) : String(x));
/* THE READ, from the items to the OUTCOME line, as lines: the main prints them, and a planted check runs it end to end */
export function report(J, bitsOf) {
  const it = items(J, bitsOf), L = [], Lj = J[key('S364', 'L/P4S6Q5')];
  const sh = (x, l) => `${l.k ? '' : ''}${f4(x)} of G ${f4(l.G)} (${f4(l.Glo)} to ${f4(l.Ghi)})`;
  L.push('', 'THE ITEMS (each read by its registered rule; worlds 1 and 2 decide items 1-3)');
  L.push(`1. MIX (the reference drawn pot by pot, at the state's own pots) carries at least half of S364's log gap: ${it['1'].outcome}`, `     ${[1, 2].map(k => { const l = it.ledger[k]; return `world ${k}: MIX ${f4(l.MIX)} (${f4(l.MIXlo)} to ${f4(l.MIXhi)}) against ${sh(0, l).replace(/^0\.0000 of /, '')}`; }).join('; ')}`);
  L.push(`2. the engine beyond the reference (FLOW + AFTER + POLICY) carries at least half of the log gap: ${it['2'].outcome}`, `     ${[1, 2].map(k => { const l = it.ledger[k]; return `world ${k}: ENGINE ${f4(l.EN)} (${f4(l.ENlo)} to ${f4(l.ENhi)}) against G ${f4(l.G)} (${f4(l.Glo)} to ${f4(l.Ghi)})`; }).join('; ')}`);
  L.push(`3. the closed form is not pessimistic against its own mix: ${it['3'].outcome}`, `     ${[1, 2].map(k => { const l = it.ledger[k]; return `world ${k}: FS ${e4(l.FS)} (${e4(l.FSlo)} to ${e4(l.FShi)}) against REF ${e4(l.REF)}`; }).join('; ')}`);
  L.push(`4. RS with readerRef 'order' halves S364's world-2 under-read at P: ${it['4'].outcome}`, `     RSO world 2 at P: ${f4(it['4'].d.d)} (${f4(it['4'].d.lo)} to ${f4(it['4'].d.hi)}) against RS's ${f4(it['4'].d2)}`);
  L.push(`5. RS does not deepen S360's under-read by more than half a point: ${it['5'].outcome}`, `     ${it['5'].cells.map(c => `world ${c.k}: BASE table ${f4(c.tB)} runs ${f4(c.sB)}, RS table ${f4(c.tR)} runs ${f4(c.sR)}; D ${f4(c.D)} (${f4(c.lo)} to ${f4(c.hi)}), ${c.c} saved/${c.b} lost of ${c.N}`).join('; ')}`);
  L.push('', 'THE CAUSES (the registered map)');
  for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);
  L.push('', 'THE LEDGER (per world: the log gap G = ln runs - ln table and its terms; reported, world 0 not deciding)');
  for (const l of it.ledger) {
    const sum = Object.values(l.terms).reduce((t, x) => t + x, 0);
    L.push(`  world ${l.k}: table ${f4(l.T)} runs ${l.r.ok}/${l.r.n} REF ${e4(l.REF)} FS ${e4(l.FS)} OW ${e4(l.OW)} OS ${e4(l.OS)} FB ${e4(l.FB)} (order ${l.order}) FSV ${e4(l.FSV)}`);
    L.push(`    G ${f4(l.G)} = ${Object.entries(l.terms).map(([t, x]) => `${t} ${f4(x)}`).join(' + ')} (sum ${f4(sum)})`);
  }
  for (let k = 0; k < 3; k++) { const qd = Lj.quad[k]; L.push(`  quadrature world ${k}: five nodes ${e4(qd.gh)}, fine ${e4(qd.fine)}, ratio ${f4(qd.fine / qd.gh)}`); }
  L.push(`REALISED item 1: ${f4(it.ledger[1].MIX / it.ledger[1].G)}`, `REALISED item 4: ${f4(it['4'].d.d)}`);
  L.push(`OUTCOME: ${['1', '2', '3', '4', '5'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  return L;
}

const EDGES = [], REACHED = {};
function planted() {
  const cases = [], ITEMS = ['1', '2', '3', '4', '5'];
  for (const i of ITEMS) REACHED[i] = new Set();
  const N = 1000000, FN = 40000, NP = 4000;
  // a base world: NE-EDGE's RS figures; the ledger's reads all alike, REF at the table, FS at 0.9 of REF, OW at FS, OS at 0.9 of
  // the way to the runs in log terms, FB at OS, FSV at FB, so MIX carries 0.9 of G and FLOW nothing
  const T = [0.0016, 0.0255, 0.2238], R = [{ ok: 2, n: NP }, { ok: 120, n: FN }, { ok: 620, n: FN }];   // RSP's runs: 4,000 in world 0, 40,000 in worlds 1 and 2
  const mkL = (spec = {}) => {
    const ledger = [0, 1, 2].map(k => {
      const t = T[k] / 100, r = R[k].ok / R[k].n, G = Math.log(r / t), s = spec[k] || {};
      const ref = s.ref !== undefined ? s.ref : t, fs = s.fs !== undefined ? s.fs : 0.9 * ref, os = s.os !== undefined ? s.os : fs * Math.exp(0.9 * G);
      return [0, 1, 2, 3, 4].map(i => ({ z: 0, w: 0.2, acc: 1, pr: ref, prRaw: ref.toExponential(6), form: Math.round(fs * N), N, ow: [Math.round(fs * N), 0], owN: N, os: [Math.round(os * N), 0], osN: N }));
    });
    const flow = [0, 1, 2].map(k => { const s = spec[k] || {}, l = ledger[k][0], fb = s.fb !== undefined ? s.fb : l.os[0] / N; const nb = Math.round(fb * FN); return [{ ai: 12, bridge: nb, N: FN, survived: s.fsv !== undefined ? Math.round(s.fsv * FN) : nb, N2: FN }, { ai: 57, bridge: 0, N: FN, survived: 0, N2: FN }]; });
    return { id: 'S364', arm: 'L', label: 'L/P4S6Q5', ledger, flow, quad: [0, 1, 2].map(() => ({ gh: 1, fine: 1, fit: 0 })) };
  };
  const mkO = (id, arm, tabs, oks) => ({ id, arm, label: `${arm}/P60S6Q5`, own: { ai: 12 }, pair: id === 'S364' ? { P: 12, D: 14 } : null,
    tables: [0, 1, 2].map(k => ({ k, P: tabs[k], D: tabs[k], OWN: tabs[k] })), sims: Object.fromEntries([0, 1, 2].flatMap(k => ['P', 'D', 'OWN'].map(nm => [`${nm}${k}`, { ok: oks[k], n: NP }]))), bits: {} });
  const base = (o = {}) => {
    const J = {};
    J[key('S364', 'L/P4S6Q5')] = mkL(o.L || {});
    J[key('S364', 'RSO/P60S6Q5')] = mkO('S364', 'RSO', o.rsoT || [0.05, 0.3, 1.55], o.rsoOk || [2, 12, 62]);
    J[key('S360', 'BASE/P60S6Q5')] = mkO('S360', 'BASE', [40, 45, 50], [2000, 2000, 2000]);
    J[key('S360', 'RS/P60S6Q5')] = mkO('S360', 'RS', o.rsT || [40, 45, 50], [2000, 2000, 2000]);
    J[key('S364', 'RSP/P60S6Q5')] = { id: 'S364', arm: 'RSP', label: 'RSP/P60S6Q5', own: { ai: 12 }, pair: { P: 12, D: 14 }, tables: T.map((t, k) => ({ k, P: t, D: t, OWN: t })), sims: Object.fromEntries([0, 1, 2].map(k => [`P${k}`, { ...R[k] }])), bits: {}, first: {} };
    if (o.mut) o.mut(J);
    return { J };
  };
  const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
  const bitsOf = (j, nm) => j.bits[nm] || ones(j.sims[nm].n, j.sims[nm].ok);
  const run = (o = {}) => { const s = base(o); return items(s.J, bitsOf); };
  // RSP's tables and runs (the ledger's T and r) set for one case
  const withTR = (s, Tarr, Rarr) => { const j = s.J[key('S364', 'RSP/P60S6Q5')]; Tarr.forEach((t, k) => { j.tables[k].P = t; }); if (Rarr) Rarr.forEach((r, k) => { j.sims[`P${k}`] = { ...r }; }); return s.J; };
  const outc = (n, o, want, what) => { const got = run(o)[n].outcome; REACHED[n].add(got); cases.push([what, got, want]); };
  const G = k => Math.log((R[k].ok / R[k].n) / (T[k] / 100));
  const [r1hi, r2hi] = [1, 2].map(k => cp(R[k].ok, R[k].n, 2 * a1)[1]), [r1lo, r2lo] = [1, 2].map(k => cp(R[k].ok, R[k].n, 2 * a1)[0]);
  // item 1 (MIX's share)
  outc('1', {}, 'HELD', 'MIX carries 0.9 of G in both worlds: 1 HELD');
  outc('1', { L: { 1: { os: (T[1] / 100) * Math.exp(0.1 * G(1)) }, 2: { os: (T[2] / 100) * Math.exp(0.1 * G(2)) } } }, 'FALSIFIED', 'MIX carries 0.1 of G in both worlds: 1 FALSIFIED');
  outc('1', { L: { 1: { os: (T[1] / 100) * Math.exp(0.1 * G(1)) } } }, 'INCONCLUSIVE', 'MIX carries 0.9 in world 2 and 0.1 in world 1: 1 INCONCLUSIVE');
  outc('1', { L: { 0: { os: T[0] / 100 } } }, 'HELD', 'MIX carries nothing in world 0 only: 1 reads worlds 1 and 2, HELD');
  { // the edge: MIX's interval bottom exactly half G's top, built by moving the table (T) so that 0.5 G_hi = MIX_lo
    // MIX's bottom computed here from the counts' own exact intervals, apart from ledgerOf, so a fault there cannot move the edge
    const s = base(), Lj = s.J[key('S364', 'L/P4S6Q5')], mixLo = k => { const rows = Lj.ledger[k]; return Math.log(rows.reduce((t, x) => t + x.w * cp(Math.max(...x.os), x.N, 2 * a1)[0], 0)) - Math.log(rows.reduce((t, x) => t + x.w * cp(x.form, x.N, 2 * a1)[1], 0)); };
    const t1 = 100 * r1hi / Math.exp(2 * mixLo(1)), t2 = 100 * r2hi / Math.exp(2 * mixLo(2));
    const e = { T: [T[0], t1, t2], r: R }, got = items(withTR(s, e.T, e.r), bitsOf)['1'].outcome; REACHED['1'].add(got);
    cases.push(['MIX\'s bottom exactly half of G\'s top in both worlds: 1 HELD', got, 'HELD']); EDGES.push('a share exactly half at the interval\'s edge');
    const e2 = { T: [T[0], t1 * 0.999, t2], r: R }; cases.push(['MIX\'s bottom just under half of G\'s top in world 1: 1 INCONCLUSIVE', items(withTR(s, e2.T, e2.r), bitsOf)['1'].outcome, 'INCONCLUSIVE']);
  }
  { // no gap shown: runs at zero in a world, so G's bottom is not above 0 and the item cannot fall
    const s = base({ L: { 1: { os: (T[1] / 100) * Math.exp(0.1 * G(1)) }, 2: { os: (T[2] / 100) * Math.exp(0.1 * G(2)) } } }), e = { T, r: [R[0], { ok: 0, n: NP }, R[2]] };
    cases.push(['world 1\'s runs at zero (no gap shown): 1 not FALSIFIED', items(withTR(s, e.T, e.r), bitsOf)['1'].outcome, 'INCONCLUSIVE']); EDGES.push('a world with no runs (zero)');
  }
  outc('1', { L: { 1: { os: 0, fs: 0 }, 2: { os: 0, fs: 0 } } }, 'INCONCLUSIVE', 'the mix and the pots pay nothing (zero counts): 1 INCONCLUSIVE');
  EDGES.push('a ledger count at zero');
  // item 2 (FLOW's share): FB carried to the runs from OS at the table
  const flowShare = f => ({ L: { 1: { os: T[1] / 100, fb: (T[1] / 100) * Math.exp(f * G(1)) }, 2: { os: T[2] / 100, fb: (T[2] / 100) * Math.exp(f * G(2)) } } });
  outc('2', flowShare(0.9), 'HELD', 'the engine carries all of G in both worlds: 2 HELD');
  outc('2', {}, 'FALSIFIED', 'the engine carries a tenth of G in both worlds: 2 FALSIFIED');
  outc('2', { L: { 1: flowShare(0.9).L[1] } }, 'INCONCLUSIVE', 'the engine carries all of G in world 1 only: 2 INCONCLUSIVE');
  // item 3 (the form)
  outc('3', {}, 'HELD', 'the mix simulated at 0.9 of the closed form: 3 HELD');
  outc('3', { L: { 1: { fs: 2 * T[1] / 100, os: 2 * T[1] / 100 } } }, 'FALSIFIED', 'the mix simulated at twice the closed form in world 1: 3 FALSIFIED');
  outc('3', { L: { 1: { fs: 1.3 * T[1] / 100, os: 1.3 * T[1] / 100 } } }, 'INCONCLUSIVE', 'the mix simulated at 1.3 times the closed form in world 1: 3 INCONCLUSIVE');
  { // the edge: FS's top exactly 1.1 x REF, by setting REF from FS's own interval
    const s = base(); for (const k of [1, 2]) { const Lj = s.J[key('S364', 'L/P4S6Q5')], rows = Lj.ledger[k], hi = cp(rows[0].form, N, 2 * a1)[1]; rows.forEach(x => { x.pr = hi / FORM_OK; }); }
    const got = items(s.J, bitsOf)['3'].outcome; REACHED['3'].add(got); cases.push(['FS\'s top exactly 1.1 times the closed form: 3 HELD', got, 'HELD']); EDGES.push('a form ratio exactly at 1.1');
  }
  // item 4 (RSO)
  const d2 = q(T[2] - 100 * R[2].ok / R[2].n);
  outc('4', { rsoT: [0.05, 0.3, 1.55] }, 'HELD', 'RSO reads world 2 at its runs: 4 HELD');
  outc('4', { rsoT: [0.05, 0.3, 0.2238] }, 'FALSIFIED', 'RSO reads world 2 as RS did: 4 FALSIFIED');
  { const [, h] = cp(62, NP, ALPHA), t = 100 * 62 / NP + d2 / 2; outc('4', { rsoT: [0.05, 0.3, t] }, 'HELD', 'RSO exactly halves world 2\'s under-read: 4 HELD'); EDGES.push('an under-read exactly halved'); void h; }
  { const t = 100 * 62 / NP + d2 * 0.6; outc('4', { rsoT: [0.05, 0.3, t] }, 'INCONCLUSIVE', 'RSO removes four tenths of world 2\'s under-read: 4 INCONCLUSIVE'); }
  // item 5 (S360)
  outc('5', {}, 'HELD', 'RS reads S360 as BASE: 5 HELD');
  outc('5', { rsT: [40, 44, 50] }, 'FALSIFIED', 'RS a point lower in world 1, the runs alike: 5 FALSIFIED');
  outc('5', { rsT: [40, 44.5, 50] }, 'HELD', 'RS exactly half a point lower in world 1, 0 of 0 discordant: 5 HELD');
  EDGES.push('a deepening exactly half a point', '0 of 0 discordant paths');
  { // discordant paths widen the interval past -0.5 without placing it below: INCONCLUSIVE
    const s = base({ rsT: [40, 44.7, 50] }), jr = s.J[key('S360', 'RS/P60S6Q5')], jb = s.J[key('S360', 'BASE/P60S6Q5')];
    const bB = ones(NP, 2000), bR = ones(NP, 2000); for (let i = 1990; i < 2000; i++) bR[i] = 0; for (let i = 2000; i < 2010; i++) bR[i] = 1; jb.bits.OWN1 = bB; jr.bits.OWN1 = bR;
    const got = items(s.J, bitsOf)['5'].outcome; REACHED['5'].add(got); cases.push(['RS 0.3 lower in world 1 with 10 saved and 10 lost: 5 INCONCLUSIVE', got, 'INCONCLUSIVE']);
  }
  { // the intervals decide: MIX's point 0.55 of G's top in both worlds on small counts (FS at 2 in a million), its interval's bottom under half
    const L = {}; for (const k of [1, 2]) { const ghi = Math.log(cp(R[k].ok, R[k].n, 2 * a1)[1] / (T[k] / 100)); L[k] = { fs: 2e-6, os: 2e-6 * Math.exp(0.55 * ghi) }; }
    outc('1', { L }, 'INCONCLUSIVE', 'MIX\'s point 0.55 of G\'s top on small counts, its bottom under half: 1 INCONCLUSIVE'); }
  outc('1', { mut: J => { const Lj = J[key('S364', 'L/P4S6Q5')]; for (const k of [1, 2]) Lj.ledger[k].forEach(x => { x.os = [0, x.os[0]]; }); } }, 'HELD', 'the better order the second in every read: 1 HELD');
  { const s = base(), e = { T: [T[0], 100 * r1hi * 2, 100 * r2hi * 2], r: R }, got = items(withTR(s, e.T, e.r), bitsOf)['1'].outcome; REACHED['1'].add(got); cases.push(['the tables above their runs\' tops (G\'s top below 0): 1 INCONCLUSIVE', got, 'INCONCLUSIVE']); EDGES.push('a log gap at or below zero'); }
  { const s = base({ L: { 1: { os: 0.3 * 0.9 * 0.002 * 1.5 }, 2: { os: 0.3 * 0.9 * 0.0155 * 0.9 } } }), e = { T: [T[0], 100 * r1lo * 1.5, 100 * r2lo * 1.2], r: R };
    for (const k of [1, 2]) { const Lj = s.J[key('S364', 'L/P4S6Q5')], fsc = Math.round(0.9 * (e.T[k] / 100) * N); Lj.ledger[k].forEach(x => { x.form = fsc; x.ow = [fsc, 0]; x.os = [Math.round(0.3 * fsc), 0]; }); }
    const got = items(withTR(s, e.T, e.r), bitsOf)['1'].outcome; REACHED['1'].add(got); cases.push(['G\'s bottom below 0 and MIX negative: 1 not FALSIFIED', got, 'INCONCLUSIVE']); }
  // MIX at 0.48 of G on large counts (the reference a hundredfold, so MIX's interval is narrow): under half of G's top, not under half its bottom
  outc('1', { L: Object.fromEntries([1, 2].map(k => { const ref = T[k], fs = 0.9 * ref; return [k, { ref, fs, os: fs * Math.exp(0.48 * G(k)) }]; })) }, 'INCONCLUSIVE', 'MIX carries 0.48 of G in both worlds: 1 INCONCLUSIVE');
  { // the engine's point 0.05 above half G's top in both worlds, its interval's bottom (the runs' exact one) under it
    const L = {}; for (const k of [1, 2]) { const ghi = Math.log(cp(R[k].ok, R[k].n, 2 * a1)[1] / (T[k] / 100)); L[k] = { os: (R[k].ok / R[k].n) / Math.exp(0.5 * ghi + 0.05) }; }
    outc('2', { L }, 'INCONCLUSIVE', 'the engine\'s point just over half G\'s top, its bottom under: 2 INCONCLUSIVE'); }
  { const s = base(); for (const k of [1, 2]) { const Lj = s.J[key('S364', 'L/P4S6Q5')], rows = Lj.ledger[k], hi = cp(rows[0].form, N, 2 * a1)[1]; rows.forEach(x => { x.pr = hi / FORM_OK * 0.99; }); }
    const got = items(s.J, bitsOf)['3'].outcome; REACHED['3'].add(got); cases.push(['FS\'s top just over 1.1 times the closed form, its point under: 3 INCONCLUSIVE', got, 'INCONCLUSIVE']); }
  outc('4', { rsoOk: [2, 12, 1200], rsoT: [0.05, 0.3, 30 + d2 / 2] }, 'INCONCLUSIVE', 'RSO halving world 2 on a wide interval reaching RS\'s: 4 INCONCLUSIVE');
  // the causes
  const cz = (o, c) => run(o).causes[c];
  cases.push(['1 HELD: O150-REFMIX held', cz({}, 'O150-REFMIX'), 'held']);
  cases.push(['1 FALSIFIED: O150-REFMIX not', cz({ L: { 1: { os: (T[1] / 100) * Math.exp(0.1 * G(1)) }, 2: { os: (T[2] / 100) * Math.exp(0.1 * G(2)) } } }, 'O150-REFMIX'), 'not']);
  cases.push(['1 INCONCLUSIVE: O150-REFMIX open', cz({ L: { 1: { os: (T[1] / 100) * Math.exp(0.1 * G(1)) } } }, 'O150-REFMIX'), 'open']);
  cases.push(['2 HELD: O150-REFFLOW held', cz(flowShare(0.9), 'O150-REFFLOW'), 'held']);
  cases.push(['2 FALSIFIED: O150-REFFLOW not', cz({}, 'O150-REFFLOW'), 'not']);
  cases.push(['3 HELD: O150-FORM not', cz({}, 'O150-FORM'), 'not']);
  cases.push(['3 FALSIFIED: O150-FORM held', cz({ L: { 1: { fs: 2 * T[1] / 100, os: 2 * T[1] / 100 } } }, 'O150-FORM'), 'held']);
  // the ledger telescopes: its terms sum to G in every world
  { const s = base({ L: { 1: { fs: 1.2 * T[1] / 100, os: 3 * T[1] / 100, fb: 5 * T[1] / 100, fsv: 4 * T[1] / 100 } } }); const l = ledgerOf(s.J[key('S364', 'L/P4S6Q5')], 1, T[1], R[1]); cases.push(['the ledger\'s terms sum to G', q(Object.values(l.terms).reduce((t, x) => t + x, 0)) === q(l.G), true]); }
  // the read end to end
  { const st = base(); let lines = [], err = null; try { lines = report(st.J, bitsOf); } catch (e) { err = e.message; }
    const oc = lines.find(l => l.startsWith('OUTCOME: ')) || '';
    cases.push(['the read prints every item, three causes and an OUTCOME line of five items, end to end', err || `${['1.', '2.', '3.', '4.', '5.'].every(p => lines.some(l => l.startsWith(p)))} ${lines.filter(l => l.startsWith('=> ')).length} ${oc.split(', ').length}`, 'true 3 5']); }
  // the gate, on synthetic logs built as the audit prints
  const pad = ''.padEnd(16);
  const jobText = (jb, o = {}) => {
    const [id, arm, pts0] = jb, L = jobLabel(jb), pts = o.pts || (arm === 'L' ? 4 : Math.max(4, Math.round(pts0 / 30))), own = o.own !== undefined ? o.own : 12;
    const ran = `bridgeRead reader bridgeStep exact readerSplit ${o.split || SPLIT[arm]} readerBlend null readerRef ${o.ref || REFOF[arm]} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls ${o.e3 || 'true'} switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${o.ranPts || pts} grid ${o.grid || `total${pts}x6x6`} floor ${o.floor || FLOORS[id]} line ${o.line || 0.5}`;
    const out = [`${id.padEnd(16)} case | job ${L} | points ${pts} | lambda 0.0223606797749979`, `${pad} solve CAND ${L}: table 3.0 secs 1`, `${pad} ran CAND ${L}: ${ran}`, `${pad} checks ${L}: armTook ${o.armTook !== undefined ? o.armTook : 1}/1`, `${pad} openings ${L}: OWN ai ${own} level 0.8 tiers 0,0`];
    const dr = o.draws || 10000, fn = o.flow || 400;
    if (arm === 'L') {
      out.push(`${pad} orders ${L}: 0 cash>gia>isa ai ${o.flowP !== undefined ? o.flowP : 12}; 1 isa>cash>gia ai 57`, `${pad} opening ${L}: isa 5.000000e-1 gia 1.250000e-1 cash ${o.cashW || '3.750000e-1'}`);
      for (let k = 0; k < 3; k++) {
        out.push(`${pad} schedule ${L} ${k}: t 1 ai0 0 bills 14800.00,14800.00`);
        const wts = o.fourRows && k === 1 ? [0.011257, 0.222076, 0.533333, 0.233334] : [0.011257, 0.222076, 0.533333, 0.222076, 0.011257];
        for (let i = 0; i < wts.length; i++) if (!(o.dropRow === `${k}${i}`)) out.push(`${pad} ledger ${L} ${k} ${i}: z 0.000000 w ${wts[i].toFixed(6)} acc 50000.00 isa 25000.00 gia 10000.00 cash 15000.00 pr ${o.pr ? o.pr[k] : '1.000000e-3'} form 900/${o.rowN || dr} ow 950,940/${dr} os 990,980/${dr}`);
        if (!o.dropQuad) out.push(`${pad} quad ${L} ${k}: gh 1.000000e-3 fine 1.000000e-3 fit 1.00e-4`);
        for (let i = 0; i < 2; i++) if (!(o.dropFlow === `${k}${i}`)) out.push(`${pad} flow ${L} ${k} ${i} ai ${i ? 57 : (o.flowP !== undefined ? o.flowP : 12)}: bridge 30/${o.flowN || fn} survived ${o.surv || 20}/${fn} bits ${o.bits || 'b'.repeat(16)} ${'s'.repeat(16)}`);
      }
      out.push(`${pad} checks ${L}: mirrorTook ${o.mirror || '300/300'}`);
    } else {
      const pair = PAIRS[id];
      if (pair) out.push(`${pad} pair ${L}: P ai 12 level 0.8 tiers 0,0; D ai ${o.D || 14} level 0.8 tiers 2,2`, `${pad} checks ${L}: pairTook ${o.pairTook !== undefined ? o.pairTook : 1}/1`);
      const runs = arm === 'RSP' ? ['P'] : pair ? ['P', 'D'] : ['OWN'];
      for (let k = 0; k < 3; k++) if (!o.dropTable) out.push(`${pad} tables ${L} ${k} z 0 weight ${WEIGHTS[k].toFixed(6)}: ${runs.map(r => `${r} 3.000000`).join(' ')}`);
      for (let k = 0; k < 3; k++) if (arm === 'RSP' && k > 0 && !(o.dropFirst === k)) out.push(`${pad} first ${L} ${k} P: 2/4 bits ${o.firstBits || 'f'.repeat(16)}`);
      for (let k = 0; k < 3; k++) for (const r of runs) if (!(o.dropRun === `${r}${k}`)) out.push(`${pad} sim ${L} ${k} ${r} ai 12: 2/${o.runN || (arm === 'RSP' && k > 0 ? fn : 4)} bridge ${o.bridge !== undefined ? o.bridge : 3} bits ${o.bits || 'b'.repeat(16)} ${'c'.repeat(16)}`);
      out.push(`${pad} checks ${L}: forceIdentity ${o.fi !== undefined ? o.fi : 4}/${o.fiN || 4} secs 1`);
    }
    out.push(`${pad} file ${L}: f-${id}-${arm}`);
    if (!o.dropDone) out.push(`${pad} done ${L}`);
    return `stamp: code ${o.code || 'c0'} audit a0 prediction ${PRED} sha s0\nNE-REF: the candidate's own unit, ${o.npw || 4} paths a world, wealth points divided by ${o.scale || 30} (seed ${o.seed || 7002}); ledger draws ${o.headDraws || dr}, flow paths ${o.headFlow || fn}; 4 jobs; part 0/1\n${out.join('\n')}\n`;
  };
  const all = (mod = {}) => JOBS.map(jb => parse(jobText(jb, mod[key(jb[0], jobLabel(jb))] || {}))).flat();
  const G0 = { npw: 4, scale: 30, draws: 10000, flow: 400 };
  const refuses = (what, jobs, opts = {}) => cases.push([`the gate refuses ${what}`, gate(jobs, { ...G0, ...opts }).length > 0, true]);
  const KL = key('S364', 'L/P4S6Q5'), KP = key('S364', 'RSP/P60S6Q5'), KO = key('S364', 'RSO/P60S6Q5'), KB = key('S360', 'BASE/P60S6Q5'), KR = key('S360', 'RS/P60S6Q5');
  cases.push(['the gate passes the five jobs as registered', gate(all(), G0).length, 0]);
  refuses('RSP without its first paths\' line in world 2', all({ [KP]: { dropFirst: 2 } }));
  refuses('RSP\'s runs in world 1 not of the flow paths', all({ [KP]: { runN: 4 } }));
  { const rs = { tables: [0, 1, 2].map(() => ({ P: 3 })), sims: Object.fromEntries([0, 1, 2].map(k => [`P${k}`, { ok: 2, bits: k ? 'f'.repeat(16) : 'b'.repeat(16) }])) }, pr = ['1.0000e-3', '1.0000e-3', '1.0000e-3'];
    cases.push(['the gate passes RSP at NE-EDGE\'s RS job', gate(all(), { ...G0, edge: { pr, rs } }).length, 0]);
    refuses('RSP whose table is not NE-EDGE\'s by a printed digit', all(), { edge: { pr, rs: { ...rs, tables: [{ P: 3 }, { P: 3.000001 }, { P: 3 }] } } });
    refuses('RSP whose first runs\' bits are not NE-EDGE\'s', all({ [KP]: { firstBits: 'e'.repeat(16) } }), { edge: { pr, rs } }); EDGES.push('an identity off by one printed digit'); }
  refuses('a missing job', all().filter(j => j.label !== 'RS/P60S6Q5'));
  refuses('a job run twice', [...all(), ...all().filter(j => j.arm === 'RSO')]);
  refuses('a job with no done line', all({ [KO]: { dropDone: true } }));
  refuses('a stamp from other code', all({ [KB]: { code: 'c1' } }));
  refuses('another seed', all({ [KR]: { seed: 7013 } }));
  refuses('another path count in the head', all({ [KR]: { npw: 5 } }));
  refuses('another scale in the head', all({ [KR]: { scale: 15 } }));
  refuses('other ledger draws in the head', all({ [KL]: { headDraws: 20000 } }));
  refuses('the ledger solved at 60 over the scale, not 4', all({ [KL]: { pts: 5 } }));
  refuses('a 60-point job at other points', all({ [KO]: { pts: 5 } }));
  refuses('a ran line at other points than its job', all({ [KO]: { ranPts: 5 } }));
  refuses('armTook 0', all({ [KL]: { armTook: 0 } }));
  refuses('the ledger without its split', all({ [KL]: { split: 'null' } }));
  refuses('RSO without readerRef order', all({ [KO]: { ref: 'null' } }));
  refuses('S360 BASE carrying a split', all({ [KB]: { split: 'rs' } }));
  refuses('S360 RS carrying readerRef order', all({ [KR]: { ref: 'order' } }));
  refuses('another minimum end pot', all({ [KB]: { floor: 4000 } }));
  refuses('another support line', all({ [KR]: { line: 0.25 } }));
  refuses('the candidate without e3pcls', all({ [KO]: { e3: 'false' } }));
  refuses('mirrorTook short', all({ [KL]: { mirror: '299/300' } }));
  refuses('mirrorTook over nothing', all({ [KL]: { mirror: '0/0' } }));
  refuses('P not among the flow moves', all({ [KL]: { flowP: 27 } }));
  refuses('opening weights not summing to 1', all({ [KL]: { cashW: '4.750000e-1' } }));
  refuses('a ledger row missing', all({ [KL]: { dropRow: '13' } }));
  refuses('ledger counts out of other draws', all({ [KL]: { rowN: 9999 } }));
  refuses('a quadrature line missing', all({ [KL]: { dropQuad: true } }));
  refuses('a flow line missing', all({ [KL]: { dropFlow: '21' } }));
  refuses('flow counts out of other paths', all({ [KL]: { flowN: 399 } }));
  refuses('other flow paths in the head', all({ [KL]: { headFlow: 401 } }));
  refuses('P in neither the orders nor the flow lines', all({ [KL]: { flowP: 27 } }));
  refuses('a world of four ledger rows whose weights sum to 1', all({ [KL]: { fourRows: true } }));
  refuses('a case line at other points than its ran line', all({ [KO]: { pts: 5, ranPts: 4, grid: 'total4x6x6' } }));
  refuses('forceIdentity over fewer paths than registered', all({ [KO]: { fi: 3, fiN: 3 } }));
  refuses('more survived than paid the bridge', all({ [KL]: { surv: 31 } }));
  refuses('pairTook 0', all({ [KO]: { pairTook: 0 } }));
  refuses('a forced pair at another D', all({ [KO]: { D: 13 } }));
  refuses('a missing world table', all({ [KB]: { dropTable: true } }));
  refuses('a missing run in world 2', all({ [KR]: { dropRun: 'OWN2' } }));
  refuses('runs on other paths than registered', all({ [KR]: { runN: 5 } }));
  refuses('fewer paying the bridge than surviving', all({ [KB]: { bridge: 1 } }));
  refuses('forceIdentity one path short', all({ [KO]: { fi: 3 } }));
  { const e = { pr: ['1.0000e-3', '1.0000e-3', '1.0000e-3'] }; cases.push(['the gate passes the ledger at NE-EDGE\'s probe chances', gate(all(), { ...G0, edge: e }).length, 0]); refuses('a ledger chance off NE-EDGE\'s probe by a printed digit', all(), { edge: { pr: ['1.0000e-3', '1.0001e-3', '1.0000e-3'] } }); EDGES.push('a reference chance off by one printed digit'); }
  // the files
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
  const DIR = args[0] || join(HERE, 'results', 'diagneref'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1), drawsA = Number(args[3] || DRAWS), flowA = Number(args[4] || FLOWN);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const gz = d => Object.fromEntries(readdirSync(d).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(d, f))).toString())]));
  const files = gz(DIR), bad = [];
  let edge = null;
  if (!PRE) {
    // NE-EDGE's S364 RS job, behind NE-EDGE's own reducer gate (its main, over its folder)
    const DE = join(HERE, 'results', 'diagneedge'), red = spawnSync('node', [join(HERE, 'reduce-needge.mjs'), DE], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) bad.push('NE-EDGE\'s files did not pass NE-EDGE\'s gate');
    else {
      const NE = await import('./reduce-needge.mjs'), txt = readdirSync(DE).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DE, f), 'utf8'));
      const rs = txt.flatMap(NE.parse).find(j => j.id === 'S364' && j.label === 'RS/P60S6Q5');
      const pr = [0, 1, 2].map(k => { const t = txt.join('\n'), m = new RegExp(`probe RS\\/P60S6Q5 ${k} P: reads \\d+ pr (\\S+) `).exec(t); return m ? m[1] : null; });
      if (!rs || pr.some(x => !x)) bad.push('NE-EDGE\'s S364 RS job or its probe lines are missing');
      else edge = { pr, rs };
    }
  }
  bad.push(...gate(jobs, { npw: npwA, scale: scaleA, draws: drawsA, flow: flowA, files, edge }));
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the five jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}, ledger draws ${drawsA}, flow paths ${flowA}); every job's split and reference in its solve's meta; every self-check passed (armTook, mirrorTook, pairTook, forceIdentity); every file the log's${PRE ? '' : '; the ledger\'s chances NE-EDGE\'s probe\'s and RSP\'s tables and first runs NE-EDGE\'s RS job\'s, NE-EDGE behind its own gate'}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.label), j]));
  const bitsOf = (j, nm) => Buffer.from(files[j.file].bits[nm], 'base64');
  console.log('\nNE-REF: S364\'s log gap under RS split into the reference\'s parts, S364 under RS with the order-drawn reference, S360 under BASE and RS (predictions/diag-neref.md)');
  for (const L of report(J, bitsOf)) console.log(L);
}
