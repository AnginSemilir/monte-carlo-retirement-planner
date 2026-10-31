/*
 * NE-SPLIT'S REDUCER (PLAN.md NE-SPLIT; audit-nesplit.mjs; predictions/diag-nesplit.md). Why the candidate's tables choose
 * S364's opening: its four openings {SHIP's spend, CAND's} x {the plan's tiers 0/0, 2/2}, scored by their parts in CAND's
 * tables and forced in year 0 with CAND's moves after, on S364 at both estate weights; bridge 4 at 0.02 the control.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs); a plant line refuses the logs; the three units once and done; each
 *   arm's ran line the candidate's or the product's settings at the unit's weight and the registered points, the two arms
 *   at the same spending menu, grid and minimum pot; the four openings and CAND's own named, CAND's own one of them; every
 *   self-check line passed (partsSum, swapIdentity, chooserTop, forceIdentity over every path); the six runs each with a
 *   sim line; every file present, stamped as the logs, each run's survivors and bits hash the sim line's.
 * Openings: own = CAND's own opening (S364: CC); base = SS (SHIP's spend at the plan's tiers); for each, its chooser score
 *   (the mixture-weighted score less the switch charge) and its survival part sv in points.
 * ITEM 1 (NE-SURV, the survival read misses a real loss; S364, both weights; the deep review's test, deep-review-log.md
 *   10 Oct 04:17 UK, amended on the plan-auditor's BLOCKING 1 of 10 Oct): dT = sv(own) - sv(SS) in points in CAND's tables;
 *   d = the paired survival change of own against SS on the same paths, its exact one-sided McNemar p for the loss, Holm
 *   over the two weights. A weight MISREADS when the loss reads, d <= -0.25 and dT > -0.1 with dT >= d / 4 (the table sees
 *   at most a quarter of a real loss); it SEES when the loss reads and dT <= d / 2. HELD when both weights misread;
 *   FALSIFIED when both see; else INCONCLUSIVE.
  * ITEM 2 (correcting the survival read alone flips the choice; S364, both weights): G = chooser(own) - chooser(SS), and
 *   Gc = G - dT / 100 + d / 100, the gap with the table's survival difference replaced by the realised one, read at both
 *   ends of d's unconditional 97.5% interval (stats.mjs survivalChangeU; amended on the plan-auditor's BLOCKING 1 of
 *   10 Oct 18:14 UK): HELD when at both weights G > 0 and Gc at the interval's upper end (the least loss) is below 0;
 *   FALSIFIED when Gc at its lower end (the most loss) is at least G / 2 at both; else INCONCLUSIVE.
 * ITEM 3 (the year-1 held-tier layer carries it; S364, both weights): Gs = the swapped chooser(own) - chooser(SS), own read
 *   through its plan-tier partner's year-1 layer. HELD when Gs <= 0 at both weights; FALSIFIED when Gs >= G / 2 at both;
 *   else INCONCLUSIVE (and INCONCLUSIVE when own holds the plan's tiers: no layer to swap).
 * ITEM 4 (the de-risk, not the spend, carries the simulated loss; S364, both weights; amended on the plan-auditor's
 *   BLOCKING 2): D = SC against SS, P = CS against SS, and X = SC against CS on the same paths, each exact one-sided, Holm
 *   over the eight. HELD when at both weights D's loss reads and SC loses to CS; FALSIFIED when at both weights P's loss
 *   reads and CS loses to SC; else INCONCLUSIVE.
 * ITEM 5 (the control, bridge 4 at 0.02): own against its partner of the other tier at the same spend: dT and the paired
 *   survival, two-sided (the smaller one-sided p doubled). FALSIFIED when the signs disagree and the simulated difference
 *   reads (p below 0.05): the method reads a misranking where the table is calibrated; INCONCLUSIVE when the signs disagree
 *   and it does not read; HELD otherwise (the signs agree, or the table is level).
 * REPORTED: each opening's parts and swapped parts, its table survival by world beside its simulated survival by world, its
 *   survival part in SHIP's tables, failures by kind (a year with no money; the plan's end below its minimum pot), the
 *   reader's meter, and both arms' unforced runs paired (7u's S364 loss on the tuning seed).
 *   node research/solver/reduce-nesplit.mjs [dir] [paths] [points] [paths a world] > research/solver/results-nesplit.txt   (--preflight, --planted)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm, mcnemarHarmP, survivalChangeU } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-nesplit.md';
export const PTS = '30', SEED = '7002', NP = 8000, NPW = 2000, ALPHA = 0.05, MISREAD_D = -0.25, MISREAD_T = -0.1;
export const UNITS = [['S364', '0.02'], ['S364', '0.01'], ['bridge 4', '0.02']];
export const OPENINGS = ['SS', 'SC', 'CS', 'CC'], RUNS = [...OPENINGS, 'CANDOWN', 'SHIPOWN'];
const lab = w => `NE/W${w}`, key = (id, w) => `${id} ${lab(w)}`;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const CASEL = /^(S364|bridge 4)\s+case \| unit (NE\/W0\.0[12]) \| lambda (\S+)$/;
const HEAD = /^NE-SPLIT: .*, (\d+) points, (\d+) paths and (\d+) a world \(seed (\d+)\)/;
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null ? NaN : Number(v); };
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);

export function parse(text) {
  const us = []; let cur = null, head = null;
  for (const line of text.split('\n')) {
    let m;
    if (/^plant: /.test(line)) us.push({ plant: line });
    if ((m = HEAD.exec(line))) head = { pts: m[1], np: +m[2], npw: +m[3], seed: m[4] };
    if ((m = CASEL.exec(line))) { cur = { id: m[1], label: m[2], w: m[2].slice(4), head, done: false, ran: {}, solve: {}, parts: {}, swap: {}, sim: {}, world: [], checks: [] }; us.push(cur); continue; }
    if (!cur) continue;
    const L = esc(cur.label);
    if (new RegExp(`^\\s+done ${L}$`).test(line)) { cur.done = true; continue; }
    if ((m = new RegExp(`^\\s+solve (CAND|SHIP) ${L}: table (\\S+) secs (\\d+)$`).exec(line))) { cur.solve[m[1]] = { table: +m[2], secs: +m[3] }; continue; }
    if ((m = new RegExp(`^\\s+ran (CAND|SHIP) ${L}: (.*)$`).exec(line))) { cur.ran[m[1]] = m[2]; continue; }
    if ((m = new RegExp(`^\\s+own ${L}: CAND ai (\\d+) level (\\S+) tiers (\\d),(\\d) SHIP ai (\\d+) level (\\S+) tiers (\\d),(\\d)$`).exec(line))) { cur.ownLine = { candLevel: +m[2], candTiers: `${m[3]},${m[4]}`, shipLevel: +m[6], shipTiers: `${m[7]},${m[8]}` }; continue; }
    if ((m = new RegExp(`^\\s+openings ${L}: (.*); CAND's own (\\S+)$`).exec(line))) {
      cur.openings = Object.fromEntries(m[1].split('; ').map(x => { const y = /^(\S+) ai (\d+) level (\S+) tiers (\d),(\d)$/.exec(x); return y ? [y[1], { ai: +y[2], level: +y[3], tiers: `${y[4]},${y[5]}` }] : ['bad', x]; }));
      cur.ownKey = m[2]; continue;
    }
    if ((m = new RegExp(`^\\s+(parts|swap) ${L} (SS|SC|CS|CC): (.*)$`).exec(line))) {
      const s = m[3]; cur[m[1]][m[2]] = { sv: num(s, 'sv'), bq: num(s, 'bq'), rs: num(s, 'rs'), h: num(s, 'h'), wB: num(s, 'wB'), wR: num(s, 'wR'), score: num(s, 'score'), charge: num(s, 'charge'), chooser: num(s, 'chooser') }; continue;
    }
    if ((m = new RegExp(`^\\s+checks ${L}: (.*)$`).exec(line))) { cur.checks.push(m[1]); continue; }
    if ((m = new RegExp(`^\\s+sim ${L} (\\S+): survived (\\d+) of (\\d+) ran-out (\\d+) end-below-minpot (\\d+) bits (\\S+)$`).exec(line))) { cur.sim[m[1]] = { ok: +m[2], n: +m[3], early: +m[4], endBelow: +m[5], bits: m[6] }; continue; }
    if ((m = new RegExp(`^\\s+world ${L} (\\d) z (\\S+) weight (\\S+): (.*)$`).exec(line))) {
      cur.world.push({ k: +m[1], z: +m[2], weight: +m[3], by: Object.fromEntries(m[4].split('; ').map(x => { const y = /^(\S+) table (\S+) sim (\d+)\/(\d+)$/.exec(x); return y ? [y[1], { table: +y[2], ok: +y[3], n: +y[4] }] : ['bad', x]; })) }); continue;
    }
    if ((m = new RegExp(`^\\s+(shipparts|reader) ${L}: (.*)$`).exec(line))) { cur[m[1]] = m[2]; continue; }
    if ((m = new RegExp(`^\\s+file ${L}: (\\S+)$`).exec(line))) { cur.file = m[1]; continue; }
  }
  return us;
}

const CAND_WANT = { 'bridgeRead': 'reader', 'bridgeStep': 'exact', 'switchMargin': '0', 'switchCharge': '0.001', 'e3': 'true', 'e3pcls': 'true', 'pclsInterp': 'true', 'joint': 'true', 'tierState': '0/0,1/1,2/2' };
const SHIP_WANT = { 'bridgeRead': 'false', 'switchMargin': '0.001', 'switchCharge': '0', 'e3': 'false', 'e3pcls': 'false', 'pclsInterp': 'false', 'joint': 'false' };
const SAME = ['levels', 'grid', 'minPot', 'lambda', 'failShort', 'raiseSurv', 'mix', 'quad', 'finalIntegral'];
export function gate(units, { pts = PTS, np = NP, npw = NPW, seed = SEED, files = null } = {}) {
  const bad = [];
  for (const u of units) if (u.plant) bad.push(`a planted fault in the logs (${u.plant})`);
  const real = units.filter(u => !u.plant);
  for (const [id, w] of UNITS) { const n = real.filter(u => u.id === id && u.w === w).length; if (n !== 1) bad.push(`${key(id, w)}: ${n} unit lines, not 1`); }
  for (const u of real) {
    const k = key(u.id, u.w);
    if (!UNITS.some(([id, w]) => id === u.id && w === u.w)) { bad.push(`${k}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${k}: no done line`);
    if (!u.head || u.head.pts !== pts || u.head.np !== np || u.head.npw !== npw || u.head.seed !== seed) bad.push(`${k}: ran ${u.head ? `${u.head.pts} points, ${u.head.np} paths, ${u.head.npw} a world, seed ${u.head.seed}` : 'with no header'}, not ${pts}, ${np}, ${npw}, ${seed}`);
    for (const [arm, want] of [['CAND', CAND_WANT], ['SHIP', SHIP_WANT]]) {
      const r = u.ran[arm];
      if (!r) { bad.push(`${k}: no ran line for ${arm}`); continue; }
      for (const [f, v] of Object.entries(want)) if (field(r, f) !== v) bad.push(`${k} ${arm}: ${f} ${field(r, f)}, not ${v}`);
      if (field(r, 'pts') !== pts) bad.push(`${k} ${arm}: pts ${field(r, 'pts')}, not ${pts}`);
      if (!(Math.abs(num(r, 'bequestWeight') - Number(u.w)) < 1e-12)) bad.push(`${k} ${arm}: bequestWeight ${field(r, 'bequestWeight')}, not ${u.w}`);
    }
    if (u.ran.CAND && u.ran.SHIP) for (const f of SAME) if (field(u.ran.CAND, f) !== field(u.ran.SHIP, f)) bad.push(`${k}: the arms differ in ${f} (${field(u.ran.CAND, f)} against ${field(u.ran.SHIP, f)})`);
    if (!u.ownLine) bad.push(`${k}: no own line`);
    if (!u.openings || OPENINGS.some(o => !u.openings[o]) || u.openings.bad) bad.push(`${k}: the openings line is missing or unread`);
    else if (!OPENINGS.includes(u.ownKey)) bad.push(`${k}: CAND's own opening ${u.ownKey} is not one of the four`);
    for (const o of OPENINGS) if (!u.parts[o] || !u.swap[o] || Object.values(u.parts[o]).some(x => !Number.isFinite(x) && x !== -Infinity)) bad.push(`${k}: no parts or swap line for ${o}, or one unread`);
    const ck = u.checks.join(' ');
    const pass = (name, need) => { const m = new RegExp(`${name} (\\d+)/(\\d+)`).exec(ck); return m && +m[2] >= need && m[1] === m[2]; };
    if (!pass('partsSum', 1)) bad.push(`${k}: partsSum did not pass on every read`);
    if (!pass('swapIdentity', 1)) bad.push(`${k}: swapIdentity did not pass`);
    if (!pass('chooserTop', 1)) bad.push(`${k}: chooserTop did not pass`);
    if (!pass('forceIdentity', np)) bad.push(`${k}: forceIdentity did not pass on all ${np} paths`);
    for (const r of RUNS) if (!u.sim[r] || u.sim[r].n !== np) bad.push(`${k}: no sim line for ${r} over ${np} paths`);
    if (u.world.length !== 3 || u.world.some(x => OPENINGS.some(o => !x.by[o] || x.by[o].n !== npw))) bad.push(`${k}: the world lines are not three worlds of ${npw} paths for every opening`);
    if (files) {
      const f = files[u.file];
      if (!u.file || !f) { bad.push(`${k}: its file ${u.file} is missing`); continue; }
      if (!f.stamp || !u.stamp || JSON.stringify(f.stamp) !== JSON.stringify(u.stamp)) bad.push(`${k}: the file's stamp is not the log's`);
      for (const r of RUNS) {
        const b = f.bits && f.bits[r] ? Buffer.from(f.bits[r], 'base64') : null;
        if (!b || b.length !== np) { bad.push(`${k}: the file has no ${np} bits for ${r}`); continue; }
        if (u.sim[r] && sha16(b) !== u.sim[r].bits) bad.push(`${k}: ${r}'s bits hash ${sha16(b)}, not the log's ${u.sim[r].bits}`);
        if (u.sim[r] && b.reduce((t, x) => t + x, 0) !== u.sim[r].ok) bad.push(`${k}: ${r}'s survivors are not the log's`);
      }
    }
  }
  return bad;
}

// paired survival of run a against run b on the same paths: saved (a survives, b not), lost (b survives, a not)
export function pairOf(bitsA, bitsB) {
  let saved = 0, lost = 0, both = 0;
  for (let i = 0; i < bitsA.length; i++) { if (bitsA[i] && !bitsB[i]) saved++; else if (!bitsA[i] && bitsB[i]) lost++; else if (bitsA[i]) both++; }
  return { saved, lost, both, n: bitsA.length, d: 100 * (saved - lost) / bitsA.length };
}
const partnerOf = { SS: 'SC', SC: 'SS', CS: 'CC', CC: 'CS' };

// the items, from per-unit parts and pairs: S364's two units decide 1-4, bridge 4's decides 5
export function items(U) {
  const s = ['0.02', '0.01'].map(w => U[`S364 ${lab(w)}`]);
  const out = {};
  // item 1: the table's survival gap against the realised one (the review's NE-SURV test, deep-review-log.md 10 Oct 04:17 UK)
  const i1 = s.map(u => ({ dT: u.parts[u.own].sv - u.parts.SS.sv, pair: u.pairs.ownSS }));
  const p1 = holm(i1.map(x => mcnemarHarmP(x.pair.lost, x.pair.saved)));
  i1.forEach((x, j) => {
    x.pHolm = p1[j]; x.loss = p1[j] < ALPHA && x.pair.lost > x.pair.saved; const d = x.pair.d;
    x.misread = x.loss && d <= MISREAD_D && x.dT > MISREAD_T && x.dT >= d / 4;   // the table sees at most a quarter of a real loss
    x.sees = x.loss && x.dT <= d / 2;                                             // the table sees at least half of it
  });
  out[1] = { legs: i1, outcome: i1.every(x => x.misread) ? 'HELD' : i1.every(x => x.sees) ? 'FALSIFIED' : 'INCONCLUSIVE' };
  // item 2: the chooser's gap with the table's survival difference replaced by the realised one, read at both ends of the
  // realised change's unconditional interval (stats.mjs survivalChangeU, at ALPHA over the two weights): the sampled d
  // enters Gc, so a point read would call noise (the plan-auditor's BLOCKING 1 of 10 Oct 18:14 UK)
  const i2 = s.map((u, j) => {
    const G = u.parts[u.own].chooser - u.parts.SS.chooser, pr = i1[j].pair, dT = i1[j].dT;
    const ci = survivalChangeU(pr.both, pr.lost, pr.saved, pr.n - pr.both - pr.lost - pr.saved, ALPHA / 2);
    return { G, Gc: G - dT / 100 + pr.d / 100, GcHi: G - dT / 100 + ci.hi / 100, GcLo: G - dT / 100 + ci.lo / 100, lo: ci.lo, hi: ci.hi };
  });
  out[2] = { legs: i2, outcome: i2.every(x => x.G > 0 && x.GcHi < 0) ? 'HELD' : i2.every(x => x.GcLo >= x.G / 2) ? 'FALSIFIED' : 'INCONCLUSIVE' };
  // item 3
  const i3 = s.map((u, j) => { const planTier = u.openings[u.own].tiers === '0,0'; return { Gs: u.swap[u.own].chooser - u.swap.SS.chooser, G: i2[j].G, planTier }; });
  out[3] = { legs: i3, outcome: i3.some(x => x.planTier) ? 'INCONCLUSIVE' : i3.every(x => x.Gs <= 0) ? 'HELD' : i3.every(x => x.Gs >= x.G / 2) ? 'FALSIFIED' : 'INCONCLUSIVE' };
  // item 4: the de-risk (SC) and the spend (CS) each against SS, and against each other on the same paths
  const i4 = s.map(u => ({ D: u.pairs.SCSS, P: u.pairs.CSSS, X: u.pairs.SCCS }));
  const p4 = holm(i4.flatMap(x => [mcnemarHarmP(x.D.lost, x.D.saved), mcnemarHarmP(x.P.lost, x.P.saved), mcnemarHarmP(x.X.lost, x.X.saved), mcnemarHarmP(x.X.saved, x.X.lost)]));
  i4.forEach((x, j) => { [x.pD, x.pP, x.pX, x.pY] = p4.slice(4 * j, 4 * j + 4); x.readD = x.pD < ALPHA && x.D.lost > x.D.saved; x.readP = x.pP < ALPHA && x.P.lost > x.P.saved; x.readX = x.pX < ALPHA && x.X.lost > x.X.saved; x.readY = x.pY < ALPHA && x.X.saved > x.X.lost; });
  out[4] = { legs: i4, outcome: i4.every(x => x.readD && x.readX) ? 'HELD' : i4.every(x => x.readP && x.readY) ? 'FALSIFIED' : 'INCONCLUSIVE' };
  // item 5
  const b = U[`bridge 4 ${lab('0.02')}`];
  const dT = b.parts[b.own].sv - b.parts[partnerOf[b.own]].sv, pr = b.pairs.ownPartner;
  const p = Math.min(1, 2 * Math.min(mcnemarHarmP(pr.lost, pr.saved), mcnemarHarmP(pr.saved, pr.lost)));
  const dS = pr.saved - pr.lost, disagree = (dT > 0 && dS < 0) || (dT < 0 && dS > 0);
  out[5] = { legs: [{ dT, pair: pr, p }], outcome: disagree && p < ALPHA ? 'FALSIFIED' : disagree ? 'INCONCLUSIVE' : 'HELD' };
  return out;
}
export const unitOf = (u, file) => {
  const bits = Object.fromEntries(RUNS.map(r => [r, Buffer.from(file.bits[r], 'base64')]));
  return { ...u, own: u.ownKey, pairs: { ownSS: pairOf(bits[u.ownKey], bits.SS), SCSS: pairOf(bits.SC, bits.SS), CSSS: pairOf(bits.CS, bits.SS), SCCS: pairOf(bits.SC, bits.CS), ownPartner: pairOf(bits[u.ownKey], bits[partnerOf[u.ownKey]]), own: pairOf(bits.CANDOWN, bits.SHIPOWN) } };
};

// ---------------------------------------------------------------- planted checks
const EDGES = [];
function planted() {
  const cases = [];
  const P = (sv, chooser) => ({ sv, bq: 0, rs: 0, h: 0, wB: 0.02, wR: 0, score: chooser, charge: 0, chooser });
  const pr = (saved, lost, n = 8000, both = 3) => ({ saved, lost, both, n, d: 100 * (saved - lost) / n });
  const mk = ({ svOwn = 4.8, svSS = 0.5, chOwn = 0.06, chSS = 0.02, swOwn = 0.01, lostOwn = 30, savedOwn = 0, lostD = 25, savedD = 0, lostP = 5, savedP = 0, lostX = 20, savedX = 0, own = 'CC', tiersOwn = '2,2' } = {}) => {
    const parts = { SS: P(svSS, chSS), SC: P(1, 0), CS: P(1, 0), CC: P(1, 0) }; parts[own] = P(svOwn, chOwn);
    const swap = { ...parts, [own]: P(svOwn, swOwn) };
    return { own, openings: { SS: { tiers: '0,0' }, SC: { tiers: '2,2' }, CS: { tiers: '0,0' }, CC: { tiers: '2,2' }, [own]: { tiers: tiersOwn } }, parts, swap,
      pairs: { ownSS: pr(savedOwn, lostOwn), SCSS: pr(savedD, lostD), CSSS: pr(savedP, lostP), SCCS: pr(savedX, lostX), ownPartner: pr(savedOwn, lostOwn), own: pr(savedOwn, lostOwn) } };
  };
  const U = (a, b, c) => ({ [`S364 ${lab('0.02')}`]: a, [`S364 ${lab('0.01')}`]: b, [`bridge 4 ${lab('0.02')}`]: c });
  const base = mk(), ctl = mk({ svOwn: 99.8, svSS: 99.7, lostOwn: 0, savedOwn: 0 });
  let o = items(U(base, base, ctl));
  cases.push(['the review\'s geometry: the table favours own, own loses 0/30, survival over the whole gap, the swap removes it, the de-risk carries the loss: 1-4 HELD, 5 HELD', [1, 2, 3, 4, 5].map(i => o[i].outcome).join(), 'HELD,HELD,HELD,HELD,HELD']);
  o = items(U(mk({ svOwn: 0.3, svSS: 0.5 }), mk({ svOwn: 0.3, svSS: 0.5 }), ctl));
  cases.push(['the table sees over half the realised loss (dT -0.2 against -0.375) at both weights: 1 FALSIFIED, 2 FALSIFIED', [o[1].outcome, o[2].outcome].join(), 'FALSIFIED,FALSIFIED']);
  o = items(U(mk({ lostOwn: 20 }), mk({ lostOwn: 20 }), ctl));
  cases.push(['a realised loss exactly -0.25 (0 saved/20 lost) counts: 1 HELD', o[1].outcome, 'HELD']); EDGES.push('a realised loss exactly at -0.25');
  o = items(U(mk({ svOwn: 0.45, svSS: 0.5 }), mk({ svOwn: 0.45, svSS: 0.5 }), ctl));
  cases.push(['the review\'s case: dT -0.05 against a realised -0.375 is a misread, not a FALSIFIED: 1 HELD', o[1].outcome, 'HELD']);
  o = items(U(mk({ svOwn: 0.4, svSS: 0.5 }), mk({ svOwn: 0.4, svSS: 0.5 }), ctl));
  cases.push(['dT -0.1 against -0.375: the table sees over a quarter and under half, neither a misread nor a sight: 1 INCONCLUSIVE', o[1].outcome, 'INCONCLUSIVE']);
  o = items(U(mk({ lostOwn: 0, savedOwn: 0 }), base, ctl));
  cases.push(['no discordant path at one weight: 1 INCONCLUSIVE', o[1].outcome, 'INCONCLUSIVE']); EDGES.push('a pair with no discordant path');
  o = items(U(mk({ lostOwn: 4, savedOwn: 0 }), mk({ lostOwn: 4, savedOwn: 0 }), ctl));
  cases.push(['0 saved/4 lost at each weight (p 0.0625 alone): the loss does not read, 1 INCONCLUSIVE', o[1].outcome, 'INCONCLUSIVE']);
  o = items(U(mk({ svOwn: 2.0, svSS: 0.5, chOwn: 0.06, chSS: 0.02 }), base, ctl));
  cases.push(['correcting the survival read flips the choice at one weight only: 2 INCONCLUSIVE', o[2].outcome, 'INCONCLUSIVE']);
  o = items(U(mk({ svOwn: 4.5, svSS: 0.5, chOwn: 0.06, chSS: 0.02 }), mk({ svOwn: 4.5, svSS: 0.5, chOwn: 0.06, chSS: 0.02 }), ctl));
  cases.push(['correcting the survival read flips the choice at both weights: 2 HELD', o[2].outcome, 'HELD']);
  o = items(U(mk({ svOwn: 4.2, svSS: 0.5 }), mk({ svOwn: 4.2, svSS: 0.5 }), ctl));
  cases.push(['the corrected gap flips at its point (-7.5e-4) but not at the interval\'s upper end (+6e-4): 2 INCONCLUSIVE', o[2].outcome, 'INCONCLUSIVE']); EDGES.push('a corrected gap that flips at its point but not at its interval\'s end');
  o = items(U(mk({ svOwn: 2.0, svSS: 0.5 }), mk({ svOwn: 2.0, svSS: 0.5 }), ctl));
  cases.push(['the corrected gap is at least half at its point (0.02125 of 0.04) but not at the interval\'s lower end (0.01937): 2 INCONCLUSIVE', o[2].outcome, 'INCONCLUSIVE']); EDGES.push('a corrected gap at half the gap at its point but under it at its interval\'s end');
  o = items(U(mk({ swOwn: 0.04 }), mk({ swOwn: 0.04 }), ctl));
  cases.push(['the swap leaves the gap at G / 2 exactly (0.02 of 0.04) at both weights: 3 FALSIFIED', o[3].outcome, 'FALSIFIED']); EDGES.push('a swapped gap exactly half the gap');
  o = items(U(mk({ swOwn: 0.03 }), base, ctl));
  cases.push(['the swap shrinks the gap but leaves it positive and under half at one weight: 3 INCONCLUSIVE', o[3].outcome, 'INCONCLUSIVE']);
  o = items(U(mk({ own: 'CS', tiersOwn: '0,0' }), base, ctl));
  cases.push(['own holds the plan\'s tiers: no layer to swap, 3 INCONCLUSIVE', o[3].outcome, 'INCONCLUSIVE']); EDGES.push('an own opening at the plan\'s tiers');
  o = items(U(mk({ lostD: 5, lostP: 25, lostX: 0, savedX: 20 }), mk({ lostD: 5, lostP: 25, lostX: 0, savedX: 20 }), ctl));
  cases.push(['the spend carries the loss at both weights: 4 FALSIFIED', o[4].outcome, 'FALSIFIED']);
  o = items(U(mk({ lostD: 20, lostP: 20, lostX: 4, savedX: 3 }), mk({ lostD: 20, lostP: 20, lostX: 4, savedX: 3 }), ctl));
  cases.push(['the de-risk and the spend lose alike, SC against CS not reading: 4 INCONCLUSIVE', o[4].outcome, 'INCONCLUSIVE']); EDGES.push('equal losses under the de-risk and the spend');
  o = items(U(mk({ lostD: 25, lostP: 15, lostX: 6, savedX: 1 }), mk({ lostD: 25, lostP: 15, lostX: 6, savedX: 1 }), ctl));
  cases.push(['the de-risk loses more than the spend but SC against CS does not read: 4 INCONCLUSIVE', o[4].outcome, 'INCONCLUSIVE']);
  o = items(U(base, base, mk({ svOwn: 99.8, svSS: 99.7, lostOwn: 30, savedOwn: 0 })));
  cases.push(['the control misranks (table up, 0/30 in simulation): 5 FALSIFIED', o[5].outcome, 'FALSIFIED']);
  o = items(U(base, base, mk({ svOwn: 99.8, svSS: 99.7, lostOwn: 3, savedOwn: 0 })));
  cases.push(['the control disagrees in sign without reading: 5 INCONCLUSIVE', o[5].outcome, 'INCONCLUSIVE']);
  // the gate
  const good = () => {
    const hd = { pts: PTS, np: NP, npw: NPW, seed: SEED };
    const ran = (want, w) => `${Object.entries(want).map(([k, v]) => `${k} ${v}`).join(' ')} pts ${PTS} bequestWeight ${w} levels 1,1.1,0.95,0.9,0.8 grid total30x6x6 minPot 205000 lambda 0.0223606797749979 failShort floor raiseSurv true mix 3 quad 5 finalIntegral true`;
    return UNITS.map(([id, w]) => ({ id, label: lab(w), w, head: hd, done: true, ran: { CAND: ran(CAND_WANT, w), SHIP: ran(SHIP_WANT, w) }, openings: Object.fromEntries(OPENINGS.map(o => [o, { ai: 1, level: 0.9, tiers: '2,2' }])), ownKey: 'CC', ownLine: { candLevel: 0.9, candTiers: '2,2', shipLevel: 0.8, shipTiers: '0,0' },
      parts: Object.fromEntries(OPENINGS.map(o => [o, P(1, 0.01)])), swap: Object.fromEntries(OPENINGS.map(o => [o, P(1, 0.01)])),
      checks: ['partsSum 32/32 swapIdentity 2/2 chooserTop 1/1', `forceIdentity ${NP}/${NP} secs 1`], sim: Object.fromEntries(RUNS.map(r => [r, { ok: 0, n: NP, bits: 'x' }])),
      world: [0, 1, 2].map(k => ({ k, by: Object.fromEntries(OPENINGS.map(o => [o, { table: 1, ok: 0, n: NPW }])) })) }));
  };
  cases.push(['the gate passes a good set', gate(good()).join('; '), '']);
  const g = f => { const us = good(); f(us); return gate(us); };
  cases.push(['the gate refuses a plant line', g(us => us.push({ plant: 'plant: force' })).some(x => /planted fault/.test(x)), true]);
  cases.push(['the gate refuses a missing unit', g(us => us.pop()).some(x => /0 unit lines/.test(x)), true]);
  cases.push(['the gate refuses a unit run twice', g(us => us.push({ ...us[0] })).some(x => /2 unit lines/.test(x)), true]);
  cases.push(['the gate refuses a unit with no done line', g(us => { us[1].done = false; }).some(x => /no done line/.test(x)), true]);
  cases.push(['the gate refuses CAND at the stored margin', g(us => { us[0].ran.CAND = us[0].ran.CAND.replace('switchMargin 0 ', 'switchMargin 0.001 '); }).some(x => /CAND: switchMargin/.test(x)), true]);
  cases.push(['the gate refuses SHIP with the reader', g(us => { us[2].ran.SHIP = us[2].ran.SHIP.replace('bridgeRead false', 'bridgeRead reader'); }).some(x => /SHIP: bridgeRead/.test(x)), true]);
  cases.push(['the gate refuses a unit at the other weight', g(us => { us[1].ran.CAND = us[1].ran.CAND.replace('bequestWeight 0.01', 'bequestWeight 0.02'); }).some(x => /bequestWeight/.test(x)), true]);
  cases.push(['the gate refuses arms at different minimum pots', g(us => { us[0].ran.SHIP = us[0].ran.SHIP.replace('minPot 205000', 'minPot 0'); }).some(x => /differ in minPot/.test(x)), true]);
  cases.push(['the gate refuses other points', g(us => { us[0].ran.CAND = us[0].ran.CAND.replace(`pts ${PTS}`, 'pts 4'); }).some(x => /pts 4/.test(x)), true]);
  cases.push(['the gate refuses the held-out seed', g(us => { us[0].head = { ...us[0].head, seed: '7013' }; }).some(x => /seed 7013/.test(x)), true]);
  cases.push(['the gate refuses a failed partsSum', g(us => { us[0].checks[0] = 'partsSum 31/32 swapIdentity 2/2 chooserTop 1/1'; }).some(x => /partsSum/.test(x)), true]);
  cases.push(['the gate refuses a forceIdentity short of every path', g(us => { us[0].checks[1] = `forceIdentity ${NP - 1}/${NP - 1} secs 1`; }).some(x => /forceIdentity/.test(x)), true]);
  cases.push(['the gate refuses a missing run', g(us => { delete us[2].sim.SHIPOWN; }).some(x => /no sim line for SHIPOWN/.test(x)), true]);
  cases.push(['the gate refuses an own opening outside the four', g(us => { us[0].ownKey = 'XX'; }).some(x => /not one of the four/.test(x)), true]);
  cases.push(['the gate refuses a world short of its paths', g(us => { us[0].world[1].by.CC.n = NPW - 1; }).some(x => /world lines/.test(x)), true]);
  EDGES.push('a forceIdentity one path short');
  // the files
  const fb = Buffer.alloc(NP); fb[3] = 1;
  const ST = { code: 'c', audit: 'a', prediction: 'p', sha: '-' };
  const fileGood = { stamp: ST, bits: Object.fromEntries(RUNS.map(r => [r, fb.toString('base64')])) };
  const withFiles = (f, edit) => { const us = good(); us.forEach(u => { u.file = 'f'; u.stamp = ST; RUNS.forEach(r => { u.sim[r] = { ok: 1, n: NP, bits: sha16(fb) }; }); }); if (edit) edit(us); return gate(us, { files: { f } }); };
  cases.push(['the gate passes files whose bits are the log\'s', withFiles(fileGood).join('; '), '']);
  const fb2 = Buffer.from(fb); fb2[4] = 1;
  cases.push(['the gate refuses a file whose bits are not the log\'s', withFiles({ stamp: ST, bits: { ...fileGood.bits, CC: fb2.toString('base64') } }).some(x => /bits hash/.test(x)), true]);
  cases.push(['the gate refuses a missing file', withFiles(fileGood, us => { us[0].file = 'g'; }).some(x => /is missing/.test(x)), true]);
  cases.push(['the gate refuses a file stamped by other code', withFiles({ ...fileGood, stamp: { ...ST, code: 'other' } }).some(x => /stamp is not the log/.test(x)), true]);
  cases.push(['the gate refuses a unit with no own line', g(us => { delete us[0].ownLine; }).some(x => /no own line/.test(x)), true]);
  const failed = cases.filter(([, got, want]) => got !== want);
  for (const [name, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}`);
  if (failed.length) { console.log(`PLANTED CHECKS FAILED: ${failed.length} of ${cases.length}`); process.exit(1); }
  return cases.length;
}

// ---------------------------------------------------------------- main
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
  const DIR = args[0] || join(HERE, 'results', 'diagnesplit'), npA = Number(args[1] || NP), ptsA = args[2] || PTS, npwA = Number(args[3] || NPW);
  const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  // each unit carries its own log's stamp, compared with its file's (the stamp line opens every log)
  const units = Object.values(logs).flatMap(t => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t); return parse(t).map(u => (u.plant ? u : { ...u, stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null })); });
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(units, { pts: ptsA, np: npA, npw: npwA, files });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the three units once and done at the registered settings (${ptsA} points, ${npA} paths, ${npwA} a world, seed ${SEED}); every self-check passed (partsSum, swapIdentity, chooserTop, forceIdentity on every path); every file the log's`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const U = {};
  for (const u of units.filter(x => !x.plant)) U[key(u.id, u.w)] = unitOf(u, files[u.file]);
  const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), e4 = x => (Number.isFinite(x) ? x.toExponential(4) : String(x));
  console.log('\nNE-SPLIT: S364\'s opening split by parts in CAND\'s tables and forced on the tuning seed (predictions/diag-nesplit.md)');
  for (const [k, u] of Object.entries(U)) {
    console.log(`\n${k}: CAND's own ${u.own} (level ${u.ownLine.candLevel}, tiers ${u.ownLine.candTiers}); SHIP's own level ${u.ownLine.shipLevel}, tiers ${u.ownLine.shipTiers}`);
    for (const o of OPENINGS) {
      const p = u.parts[o], q = u.swap[o], sm = u.sim[o];
      console.log(`  ${o} (level ${u.openings[o].level}, tiers ${u.openings[o].tiers}): table sv ${f4(p.sv)} bq ${e4(p.bq)} rs ${e4(p.rs)} h ${e4(p.h)} score ${e4(p.score)} charge ${p.charge} chooser ${e4(p.chooser)} | swapped chooser ${e4(q.chooser)} | sim ${sm.ok}/${sm.n} (ran out ${sm.early}, end below the minimum pot ${sm.endBelow})`);
    }
    for (const x of u.world) console.log(`  world ${x.k} (z ${x.z}, weight ${x.weight}): ${OPENINGS.map(o => `${o} table ${f4(x.by[o].table)} sim ${f4(100 * x.by[o].ok / x.by[o].n)}`).join('; ')}`);
    console.log(`  SHIP's tables: ${u.shipparts}`);
    if (u.reader) console.log(`  reader: ${u.reader}`);
    const ow = u.pairs.own;
    console.log(`  REPORTED, the arms unforced: CAND ${u.sim.CANDOWN.ok}/${NP} (ran out ${u.sim.CANDOWN.early}, end below ${u.sim.CANDOWN.endBelow}) against SHIP ${u.sim.SHIPOWN.ok}/${NP} (ran out ${u.sim.SHIPOWN.early}, end below ${u.sim.SHIPOWN.endBelow}): ${ow.saved} saved/${ow.lost} lost, change ${f4(ow.d)}`);
  }
  const it = items(U);
  console.log('\nTHE ITEMS (each read by its registered rule)');
  const l1 = it[1].legs.map((x, j) => `W${['0.02', '0.01'][j]} dT ${f4(x.dT)} pair ${x.pair.saved} saved/${x.pair.lost} lost (change ${f4(x.pair.d)}) Holm p ${e4(x.pHolm)}${x.misread ? ' MISREADS' : x.sees ? ' SEES' : ''}`);
  console.log(`1. NE-SURV, the table's survival gap against the realised one, own against SS on S364: ${it[1].outcome}\n     ${l1.join('\n     ')}`);
  console.log(`2. correcting the survival read alone flips own's preference over SS: ${it[2].outcome}\n     ${it[2].legs.map((x, j) => `W${['0.02', '0.01'][j]} G ${e4(x.G)} corrected ${e4(x.Gc)} (at d's ends ${f4(x.lo)} and ${f4(x.hi)}: ${e4(x.GcLo)} to ${e4(x.GcHi)})`).join('\n     ')}`);
  console.log(`3. the year-1 held-tier layer carries it: ${it[3].outcome}\n     ${it[3].legs.map((x, j) => `W${['0.02', '0.01'][j]} G ${e4(x.G)} swapped ${e4(x.Gs)}${x.planTier ? ' (own at the plan\'s tiers)' : ''}`).join('\n     ')}`);
  console.log(`4. the de-risk, not the spend, carries the simulated loss: ${it[4].outcome}\n     ${it[4].legs.map((x, j) => `W${['0.02', '0.01'][j]} de-risk ${x.D.saved} saved/${x.D.lost} lost (Holm p ${e4(x.pD)}) spend ${x.P.saved} saved/${x.P.lost} lost (Holm p ${e4(x.pP)}) SC against CS ${x.X.saved} saved/${x.X.lost} lost (Holm p ${e4(x.pX)} / ${e4(x.pY)})`).join('\n     ')}`);
  const l5 = it[5].legs[0];
  console.log(`5. the control (bridge 4 at 0.02): no misranking where the table is calibrated: ${it[5].outcome}\n     dT ${f4(l5.dT)} pair ${l5.pair.saved} saved/${l5.pair.lost} lost p ${e4(l5.p)}`);
  console.log(`REALISED item 1: ${f4(it[1].legs[0].pair.d)}`);
  console.log(`REALISED item 4: ${f4(it[4].legs[0].D.d)}`);
  console.log(`OUTCOME: ${[1, 2, 3, 4, 5].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
}
