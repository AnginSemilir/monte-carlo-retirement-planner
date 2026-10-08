/*
 * CARRY'S READER, the reducer of the test CARRY (predictions/diag-carry.md; research/solver/items/CARRY.md; the deep review of 8 Oct 05:58 UK, its item 2). Scores the carry family's
 * forecast for 7aw (drafts/carry-forecast-7aw.md, committed in 770cfb2 before any 7aw unit finished) from the saved records
 * of 7aj (the estate weight 0.01) and 7aw (0.02): the same candidate and shipping default, households, 8,000 paths of seed
 * 7002 and code, the weight alone changed. The forecast's points can be read off the two committed results files, so the
 * read is protected by a reader with no free choices: the forecast's text fixed, each ambiguity resolved here by its
 * literal reading with the alternative printed, and an outcome that turns on an ambiguity marked EDGE and void.
 *   THE GATE (CHECKLIST item 3: two runs' saved files reused for a new question), each refusal planted: first each run's
 *     logs through the fair-test gate's requireFairLogs against the prediction it was launched under (diag-7aj.md, diag-7aw.md);
 *     G1 one stamp per run; the same code in both (6dfa9cfea59a); each audit stamp the sha256 of that run's audit; the two
 *        audits the same code once comment lines, the W line and the run's own name (7aj/7aw in its messages, output
 *        folder and variable) are set aside (plant: a code line changed);
 *     G2 50 units a run, each (household, arm) once and done, the same 25 households, the forecast's panel;
 *     G3 per (household, arm), the ran and joint lines the same across the runs once bequestWeight is removed (plant: minPot)
 *        and the joint line's risk-above decision set aside, since the forecast reads its change as a flip (plant: a cap),
 *        with the ran line's tiersAbove and tierState, which move with it, when it differs (plants through the parser);
 *     G4 N 8000 and seed 7002 in all 100 traces, each trace's stamp and survival its log's, Y the same in a household's four
 *        traces; the 50 saved/lost pairs recomputed from the traces equal to both results files' item-1 lines;
 *     G5 S120's shipping default the same in both runs, bit for bit in its six fields (plant: one trace rotated by a path -
 *        G5 refuses; the review also asked that the statistic print departures, which a rotation cannot make, since sum x is
 *        the four survival totals added and subtracted: the plant shows the paths it moves both ways and the se it widens).
 *   THE STATISTIC (the forecast's, verbatim): per path x = (C2 - S2) - (C1 - S1), survival 1 or 0 (C the candidate, S the
 *     shipping default, 1 at 0.01, 2 at 0.02); the change 100 mean(x) in points; its se 100 sd(x)/sqrt(8000), sd with n-1;
 *     a departure iff |sum x| >= 8 in integers (0.1 point is exactly 8 of 8,000; floats do not decide it) and
 *     |change| >= 2.58 se. A household with no path that moves has no departure.
 *   A FLIP: either arm's opening pair (both figures, as strings) or risk-above decision (the joint line's) differs. The pair
 *     is [the tier at margin 0.001, the tier at margin 0] (audit-7aw.mjs openGap): the shipping default runs at 0.001, so its
 *     first figure is the one it holds and its second counterfactual; the candidate runs at margin 0, so its second is held
 *     and its first counterfactual. An outcome that a flip decides only through a counterfactual figure is EDGE.
 *   THE CLASSES, re-derived from results-7aj.txt by the forecast's rules and refused if not its lists: SWITCH-RISK, the
 *     shipping default's year-0 gap in [6.67e-4, 1.5e-3]; HIGH-CHURN, the smaller of saved and lost at least 15.
 *   SCORED (Brier over the scored): F1 bridge 4+cost's shipping default flips (0.55); F2, every departure on a household
 *     that flips or is HIGH-CHURN (0.75); F3, no departure on a household of the nineteen that does not flip (0.80) - F2 and
 *     F3 held when there is no departure; F4, only if bridge 4+cost's shipping default's first figure rises: held iff its
 *     change < 0 (0.85), else void.
 *   THE CAUSES of 7 Oct 22:06 UK, a partition, each a line `=> CARRY-<id> held|not|unsettled`: OMIT held iff no departure;
 *     SWITCH iff departures, all on flips; NARROW iff departures, all on HIGH-CHURN, SWITCH not; OTHER iff any departure on
 *     a household neither flipping nor HIGH-CHURN (a non-flipping SWITCH-RISK one counts; EDGE if that decides it); split
 *     between flips and HIGH-CHURN leaves SWITCH and NARROW unsettled, OMIT and OTHER not.
 *   REPORTED, not scored: each arm's own paired change from 0.01 to 0.02 with its se; O121's WEIGHT leg (`=> O121-WEIGHT`
 *     held iff the shipping default's survival at 0.02 is at least 0.5 above 0.01 on both S130 and S370); each shipping
 *     default's gap direction (O45); an exact sign test on the moved paths beside z.
 *   ITEM 2, the fixed-policy re-score (the review's own causes for O123): 7aj's traces scored at 0.02 by reduce-7aa.mjs
 *     wholeLeg with 7aw's settings; controls, 7aw's traces at 0.02 and 7aj's at 0.01 reproduce their files' item-2 lines;
 *     plant, the weight at 0.03 moves them. The least household point against 7aw's derived 80% interval (-0.12 to +0.03,
 *     predictions/diag-7aw.md): `=> O123-REOPT held` iff inside it, `=> O123-SCALE held` iff above it, `=> O123-OTHER held`
 *     iff below it.
 *   THE ITEMS (each read by its registered rule; predictions/diag-carry.md):
 *     1. CARRY's rule, held out on 7aw: HELD iff F2 and F3 both hold, read literally; FALSIFIED iff either fails, read
 *        literally and not EDGE; INCONCLUSIVE iff neither fails but one is EDGE (an outcome turning on a counterfactual
 *        figure). The causes' lines settle the 22:06 credences beside it.
 *     2. O123's cause: HELD iff the least fixed-policy household point at 0.02 lies in 7aw's derived 80% interval (-0.12 to
 *        +0.03), the cause O123-REOPT; FALSIFIED iff it lies outside and so does its whole 95% interval (wholeLeg's
 *        unconditional one); INCONCLUSIVE iff it lies outside but its interval reaches the band.
 *     NOT SETTLED if the gate, the classes or item 2's controls refuse.
 *   node research/solver/reduce-carry.mjs [--planted]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import * as A from './reduce-7aa.mjs';
import { PANEL } from './reduce-7aw.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import { spendYears } from './reduce-7af.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const RUNS = {
  aj: { w: '0.01', dir: join(HERE, 'results', 'diag7aj'), audit: join(HERE, 'audit-7aj.mjs'), results: join(HERE, 'results-7aj.txt'), pred: 'research/solver/predictions/diag-7aj.md' },
  aw: { w: '0.02', dir: join(HERE, 'results', 'diag7aw'), audit: join(HERE, 'audit-7aw.mjs'), results: join(HERE, 'results-7aw.txt'), pred: 'research/solver/predictions/diag-7aw.md' }
};
export const CODE = '6dfa9cfea59a', N = 8000, SEED = '7002', Z = 2.58, MIN_SUM = 8;
export const SWITCH_RISK = ['bridge 4+cost', 'S172', 'S124'], HIGH_CHURN = ['S128', 'S370', 'S130'];
export const GAP_LO = 6.67e-4, GAP_HI = 1.5e-3, CHURN = 15;
export const P = { F1: 0.55, F2: 0.75, F3: 0.80, F4: 0.85 };
export const O123_IV = [-0.12, 0.03];
export const ARM = { C: 'CAND', S: 'SHIP' };
const labelOf = (arm, w) => `${arm === 'CAND' ? 'CANDIDATE' : 'PRODUCT'}/W${w}`;

/* ---------- G1: the audits the same code but for comments, W and the run's own name ---------- */
const isComment = l => /^\s*(\/\/|\/?\*)/.test(l) || /^\s*\*\//.test(l);
export function auditCode(text, tag) {
  // the run's own name, wherever it stands (audit-7aj, 7AJ:, DIAG7AJ_OUT, diag7aj) -> RUN, both runs mapped the same way
  const re = new RegExp(tag, 'gi');
  return text.split('\n').filter(l => !isComment(l)).map(l => l.replace(re, 'RUN')).filter(l => !/^export const W = /.test(l));
}
export function g1(logs, audits) {
  const bad = [], st = {};
  for (const k of ['aj', 'aw']) {
    const lines = Object.values(logs[k]).map(t => (/^stamp: .*$/m.exec(t) || [''])[0]);
    const uniq = [...new Set(lines)];
    if (uniq.length !== 1 || !uniq[0]) { bad.push(`G1: run ${k} has ${uniq.length} stamps`); continue; }
    const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/.exec(uniq[0]);
    st[k] = m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null;
    if (!st[k]) { bad.push(`G1: run ${k}'s stamp unreadable`); continue; }
    if (st[k].code !== CODE) bad.push(`G1: run ${k} ran code ${st[k].code}, not ${CODE}`);
    const own = createHash('sha256').update(audits[k]).digest('hex').slice(0, 12);
    if (st[k].audit !== own) bad.push(`G1: run ${k}'s audit stamp ${st[k].audit} is not its audit's sha256 ${own}`);
  }
  const a = auditCode(audits.aj, '7aj'), b = auditCode(audits.aw, '7aw');
  if (a.length !== b.length || a.some((l, i) => l !== b[i])) { const i = a.findIndex((l, j) => l !== b[j]); bad.push(`G1: the audits differ in code beyond W, comments and their names (first at code line ${i}: ${String(a[i]).slice(0, 80)} | ${String(b[i]).slice(0, 80)})`); }
  return { bad, st };
}

/* ---------- G2, G3: the units ---------- */
export function g2(units) {
  const bad = [];
  for (const k of ['aj', 'aw']) {
    const us = units[k];
    if (us.length !== 50) bad.push(`G2: run ${k} has ${us.length} units, not 50`);
    for (const id of PANEL) for (const arm of ['CAND', 'SHIP']) {
      const m = us.filter(u => u.id === id && u.arm === arm && u.label === labelOf(arm, RUNS[k].w));
      if (m.length !== 1 || !m[0].done) bad.push(`G2: run ${k} ${id} ${arm}: ${m.length} units${m[0] && !m[0].done ? ', not done' : ''}`);
    }
    const ids = [...new Set(us.map(u => u.id))].sort();
    if (ids.join('|') !== [...PANEL].sort().join('|')) bad.push(`G2: run ${k}'s households are not the panel's 25`);
  }
  return bad;
}
const noWeight = s => String(s || '').replace(/\s*bequestWeight \S+/g, '');
export function g3(units) {
  const bad = [];
  for (const id of PANEL) for (const arm of ['CAND', 'SHIP']) {
    const [x, y] = ['aj', 'aw'].map(k => units[k].find(u => u.id === id && u.arm === arm));
    if (!x || !y) continue;
    // the joint line's risk-above decision is a solve's outcome, which the forecast reads as a flip, so it is set aside
    // here (the plan-auditor's MINOR 2 of 8 Oct 08:23 UK; a fourth correction, made before any read); when it differs,
    // the ran line's tiersAbove and tierState move with it (solve.js sets both from the decision), so they are set aside
    // too (its MINOR 1 of 8 Oct 08:36 UK)
    const moved = (x.joint && x.joint.decided) !== (y.joint && y.joint.decided);
    const ranOf = r => { const s = noWeight(r); return moved ? s.replace(/\s*(tiersAbove|tierState) \S+/g, '') : s; };
    if (ranOf(x.ran) !== ranOf(y.ran)) bad.push(`G3: ${id} ${arm}: the ran lines differ beyond bequestWeight${moved ? ' and the tiers the risk-above decision sets' : ''}`);
    const settings = j => JSON.stringify({ ...(j || {}), decided: undefined });
    if (settings(x.joint) !== settings(y.joint)) bad.push(`G3: ${id} ${arm}: the joint lines differ beyond the risk-above decision`);
  }
  return bad;
}

/* ---------- G4, G5: the traces ---------- */
export function g4(units, TR, stamps, item1) {
  const bad = [];
  for (const k of ['aj', 'aw']) for (const u of units[k]) {
    const t = TR[k][`${u.id}|${u.arm}`];
    if (!t) { bad.push(`G4: run ${k} ${u.id} ${u.arm}: no trace`); continue; }
    if (t.raw.N !== N || String(t.raw.seed) !== SEED) bad.push(`G4: run ${k} ${u.id} ${u.arm}: N ${t.raw.N} seed ${t.raw.seed}`);
    if (!A.traceAgrees(t.raw, stamps[k], u.arm, u.label, u.run.sim)) bad.push(`G4: run ${k} ${u.id} ${u.arm}: the trace's stamp, arm or survival is not its log's`);
  }
  for (const id of PANEL) {
    const ys = ['aj', 'aw'].flatMap(k => ['CAND', 'SHIP'].map(a => TR[k][`${id}|${a}`] && TR[k][`${id}|${a}`].Y));
    if (new Set(ys).size !== 1) bad.push(`G4: ${id}: Y differs across its four traces (${ys.join(', ')})`);
    for (const k of ['aj', 'aw']) {
      const S = TR[k][`${id}|SHIP`], C = TR[k][`${id}|CAND`];
      if (!S || !C) continue;
      const c = cells(S.survived, C.survived), f = item1[k][id];
      if (!f || f.saved !== c.saved || f.lost !== c.lost) bad.push(`G4: run ${k} ${id}: the traces give ${c.saved} saved/${c.lost} lost, the results file ${f ? `${f.saved}/${f.lost}` : 'none'}`);
    }
  }
  return bad;
}
export const SIX = ['survived', 'level', 'tier', 'wealth', 'taxPaid', 'failYear'];
export function g5(TR) {
  const a = TR.aj['S120|SHIP'], b = TR.aw['S120|SHIP'];
  if (!a || !b) return ['G5: no S120 shipping-default trace'];
  return SIX.filter(f => a.raw[f] !== b.raw[f]).map(f => `G5: S120's shipping default differs across the runs in ${f}`);
}

/* ---------- the statistic ---------- */
export function change(C1, S1, C2, S2) {
  const n = C1.length; let sum = 0, sq = 0, up = 0, down = 0;
  for (let i = 0; i < n; i++) { const x = (C2[i] - S2[i]) - (C1[i] - S1[i]); sum += x; sq += x * x; if (x > 0) up++; else if (x < 0) down++; }
  const mean = sum / n, sd = n > 1 ? Math.sqrt(Math.max(0, (sq - n * mean * mean) / (n - 1))) : 0;
  const ch = 100 * mean, se = 100 * sd / Math.sqrt(n);
  const departs = Math.abs(sum) >= MIN_SUM && sum !== 0 && Math.abs(ch) >= Z * se;
  // the exact sign test on the paths that moved (two-sided), beside z
  const m = up + down, sign = m ? Math.min(1, 2 * binomTail(Math.min(up, down), m)) : 1;
  return { sum, change: ch, se, z: se > 0 ? ch / se : 0, departs, up, down, sign };
}
function binomTail(k, m) { let p = 0, c = 1; for (let i = 0; i <= k; i++) { if (i > 0) c = c * (m - i + 1) / i; p += c; } return p / 2 ** m; }   // P(X <= k), X ~ Bin(m, 1/2)
// the paired change of one arm from 0.01 to 0.02 (reported)
export function armChange(X1, X2) { const n = X1.length; let s = 0, q = 0; for (let i = 0; i < n; i++) { const x = X2[i] - X1[i]; s += x; q += x * x; } const m = s / n, sd = Math.sqrt(Math.max(0, (q - n * m * m) / (n - 1))); return { change: 100 * m, se: 100 * sd / Math.sqrt(n) }; }

/* ---------- flips ---------- */
export function flip(uj, uw) {
  const f = {};
  for (const arm of ['CAND', 'SHIP']) {
    const a = uj[arm], b = uw[arm];
    const first = String(a.gap.open1e3) !== String(b.gap.open1e3), second = String(a.gap.open0) !== String(b.gap.open0), ra = (a.joint && a.joint.decided) !== (b.joint && b.joint.decided);   // the decision, from the joint line (the case line's riskAbove is the constant setting 'auto')
    const held = arm === 'SHIP' ? first : second, counter = arm === 'SHIP' ? second : first;
    f[arm] = { first, second, ra, held, counter, any: first || second || ra, real: held || ra, firstRises: Number(b.gap.open1e3) > Number(a.gap.open1e3) };
  }
  return { ...f, any: f.CAND.any || f.SHIP.any, real: f.CAND.real || f.SHIP.real };
}

/* ---------- the classes from 7aj's record ---------- */
export function classesFrom(text) {
  const gap = {}, it = {};
  for (const l of text.split('\n')) {
    let m;
    if ((m = /^  (.+?)\s+SHIP\s+table \S+ sim \S+ error \S+ gap (\S+) \(opening/.exec(l))) gap[m[1].trim()] = m[2];
    if ((m = /^     (.+?)\s+(\d+) saved\/(\d+) lost of (\d+)\s/.exec(l))) it[m[1].trim()] = { saved: +m[2], lost: +m[3], N: +m[4] };
  }
  const sw = PANEL.filter(id => gap[id] !== undefined && /^[0-9.e+-]+$/.test(gap[id]) && Number(gap[id]) >= GAP_LO && Number(gap[id]) <= GAP_HI);
  const hc = PANEL.filter(id => it[id] && Math.min(it[id].saved, it[id].lost) >= CHURN);
  return { sw, hc, gap, item1: it };
}
export const item1Of = text => classesFrom(text).item1;
export const item2Of = text => { const o = {}; for (const l of text.split('\n')) { const m = /^     (.+?)\s+whole ([+-]\d+\.\d{3}) \(unconditional (\S+) to (\S+);/.exec(l); if (m) o[m[1].trim()] = { d: +m[2], lo: +m[3], hi: +m[4] }; } return o; };

/* ---------- scoring and the causes ---------- */
export function score(H, cls) {
  // H: per household { dep, flipAny, flipReal, highChurn, switchRisk, ship: flip.SHIP, change }
  const ids = Object.keys(H), dep = ids.filter(id => H[id].dep), nineteen = ids.filter(id => !cls.sw.includes(id) && !cls.hc.includes(id));
  const at = useReal => {
    const fl = id => (useReal ? H[id].flipReal : H[id].flipAny);
    const F2 = dep.every(id => fl(id) || cls.hc.includes(id));
    const F3 = !nineteen.some(id => H[id].dep && !fl(id));
    const allFlip = dep.length > 0 && dep.every(fl), allHC = dep.length > 0 && dep.every(id => cls.hc.includes(id));
    const anyOther = dep.some(id => !fl(id) && !cls.hc.includes(id));
    const split = dep.length > 0 && !allFlip && !allHC && !anyOther;
    const C = { OMIT: dep.length === 0 ? 'held' : 'not', SWITCH: split ? 'unsettled' : allFlip ? 'held' : 'not', NARROW: split ? 'unsettled' : (allHC && !allFlip) ? 'held' : 'not', OTHER: anyOther ? 'held' : 'not' };
    return { F2, F3, C };
  };
  const lit = at(false), alt = at(true);
  // OTHER decided only by a non-flipping SWITCH-RISK household is EDGE (the review's ruling)
  const otherBy = dep.filter(id => !H[id].flipAny && !cls.hc.includes(id));
  const otherEdge = lit.C.OTHER === 'held' && otherBy.length > 0 && otherBy.every(id => cls.sw.includes(id));
  const b4 = H['bridge 4+cost'];
  const F1 = { p: P.F1, held: b4.ship.any, edge: b4.ship.any && !b4.ship.real };
  const F4 = b4.ship.firstRises ? { p: P.F4, held: b4.change < 0, edge: false } : { p: P.F4, void: true };
  const F2 = { p: P.F2, held: lit.F2, edge: lit.F2 !== alt.F2 }, F3 = { p: P.F3, held: lit.F3, edge: lit.F3 !== alt.F3 };
  const Fs = { F1, F2, F3, F4 };
  const scored = Object.values(Fs).filter(f => !f.void && !f.edge);
  const brier = scored.length ? scored.reduce((t, f) => t + (f.p - (f.held ? 1 : 0)) ** 2, 0) / scored.length : null;
  const causes = Object.fromEntries(Object.entries(lit.C).map(([k, v]) => [k, { v, edge: v !== alt.C[k] || (k === 'OTHER' && otherEdge) }]));
  return { Fs, brier, causes, dep };
}
export function o123(least) { const [lo, hi] = O123_IV; return { REOPT: least >= lo && least <= hi, SCALE: least > hi, OTHER: least < lo }; }

/* ---------- the items ---------- */
export function item1(s) {
  const F = [s.Fs.F2, s.Fs.F3];
  if (F.some(f => !f.edge && !f.held)) return 'FALSIFIED';
  if (F.some(f => f.edge)) return 'INCONCLUSIVE';
  return 'HELD';
}
export function item2(least) {
  const [lo, hi] = O123_IV;
  if (least.d >= lo && least.d <= hi) return 'HELD';
  return (least.hi < lo || least.lo > hi) ? 'FALSIFIED' : 'INCONCLUSIVE';
}

/* ---------- the planted checks (synthetic) ---------- */
function planted() {
  const out = [], ok = (c, m) => { if (!c) throw new Error(`planted: ${m}`); out.push(m); };
  // the statistic
  const z = n => new Uint8Array(n), one = n => new Uint8Array(n).fill(1);
  { const C1 = one(N), S1 = one(N), C2 = one(N), S2 = one(N); ok(!change(C1, S1, C2, S2).departs, 'no path moves: no departure'); }
  { const C1 = one(N), S1 = one(N), C2 = one(N), S2 = one(N); for (let i = 0; i < 7; i++) C2[i] = 0; ok(!change(C1, S1, C2, S2).departs, 'EDGE: 7 paths moved one way (sum -7): under the integer threshold, no departure'); }
  { const C1 = one(N), S1 = one(N), C2 = one(N), S2 = one(N); for (let i = 0; i < 8; i++) C2[i] = 0; const r = change(C1, S1, C2, S2); ok(r.departs && r.sum === -8, `EDGE: 8 paths one way (sum -8, change ${r.change.toFixed(3)}, ${(r.change / r.se).toFixed(2)} se): a departure`); }
  { const C1 = one(N), S1 = one(N), C2 = one(N), S2 = one(N); for (let i = 0; i < 30; i++) C2[i] = 0; for (let i = 30; i < 52; i++) { C1[i] = 0; } const r = change(C1, S1, C2, S2); ok(!r.departs && r.sum === -8, `EDGE: sum -8 from 30 down and 22 up is under 2.58 se (z ${r.z.toFixed(2)}): no departure`); }
  // flips: a counterfactual figure alone
  const U = (o1, o0, ra = 'off') => ({ gap: { open1e3: o1, open0: o0 }, joint: { decided: ra } });
  { const f = flip({ CAND: U(0, 2), SHIP: U(1, 1) }, { CAND: U(1, 2), SHIP: U(1, 1) }); ok(f.any && !f.real, "the candidate's first figure alone moving is a flip, its counterfactual: any, not real"); }
  { const f = flip({ CAND: U(0, 2), SHIP: U(1, 1) }, { CAND: U(0, 2), SHIP: U(2, 1) }); ok(f.real && f.SHIP.firstRises, "the shipping default's first figure rising is a real flip"); }
  { const f = flip({ CAND: U(0, 2), SHIP: U(1, 1, 'a') }, { CAND: U(0, 2), SHIP: U(1, 1, 'b') }); ok(f.real, 'a risk-above decision changed is a flip'); }
  { // the same through the parser, from log lines as the audits print them (the plan-auditor's MINOR 2: the decision is the
    // joint line's, not the case line's constant riskAbove 'auto')
    const log = (w, decided) => [`S120             case | unit SHIP/PRODUCT/W${w} | lambda 0.0223606797749979 tier own riskAbove auto mix 3`,
      `                 gap SHIP/PRODUCT/W${w}: 9.0e-4 opening 1,1`,
      `                 joint SHIP/PRODUCT/W${w}: false switchMargin 0.001 scale 100 cap 400 deathTax 0 tier own riskAbove ${decided}`,
      `                 done SHIP/PRODUCT/W${w}`].join('\n');
    const [a] = A.parse(log('0.01', 'off:_no_tier_above_the_plan')), [b] = A.parse(log('0.02', 'on:_tier_3')), [c] = A.parse(log('0.02', 'off:_no_tier_above_the_plan'));
    const C = U(0, 2);
    ok(flip({ CAND: C, SHIP: a }, { CAND: C, SHIP: b }).real && !flip({ CAND: C, SHIP: a }, { CAND: C, SHIP: c }).any, 'planted, through the parser: the joint line\'s risk-above decision changed is a flip, unchanged is none');
    const unitsOf = (x, y) => ({ aj: [{ ...x, ran: 'r' }], aw: [{ ...y, ran: 'r' }] });
    ok(g3(unitsOf(a, b)).length === 0 && g3(unitsOf(a, { ...c, joint: { ...c.joint, cap: 401 } })).length === 1, 'G3 sets the risk-above decision aside and refuses a cap changed');
    // and the ran line's tiers that move with the decision, through the parser (the plan-auditor's MINOR 1 of 08:36 UK)
    const ranLog = (w, decided, tiersAbove, tierState, minPot = 29000) => [`S120             case | unit CAND/CANDIDATE/W${w} | lambda 0.0223606797749979 tier own riskAbove auto mix 3`,
      `                 ran CAND/CANDIDATE/W${w}: mix 3 pts 30 bequestWeight ${w} tiersAbove ${tiersAbove} minPot ${minPot} quad 5 tierState ${tierState} b x`,
      `                 gap CAND/CANDIDATE/W${w}: 1.0e-4 opening 0,2`,
      `                 joint CAND/CANDIDATE/W${w}: true switchMargin 0 scale 100 cap 400 deathTax 0 tier own riskAbove ${decided}`,
      `                 done CAND/CANDIDATE/W${w}`].join('\n');
    const r = (...q) => A.parse(ranLog(...q))[0], pair = (x, y) => ({ aj: [x], aw: [y] });
    const off = r('0.01', 'off:_no_tier_above_the_plan', 0, '0/0,1/1'), on = r('0.02', 'on:_tier_3', 1, '0/0,1/1,2/2'), offTiers = r('0.02', 'off:_no_tier_above_the_plan', 1, '0/0,1/1,2/2');
    ok(g3(pair(off, on)).length === 0, 'G3, through the parser: a decision moving off to on, with the tiers it sets, passes (a flip, not a refusal)');
    ok(g3(pair(off, offTiers)).length === 1, 'planted: the tiers moving with the decision unchanged - G3 refuses');
    ok(g3(pair(off, r('0.02', 'on:_tier_3', 1, '0/0,1/1,2/2', 29001))).length === 1, 'planted: a minPot changed beside a moved decision - G3 still refuses'); }
  // the classes
  { const t = ['  bridge 4+cost SHIP      table 1 sim 1 error 0 gap 9.7966e-4 (opening 1,1)', '  S172 SHIP      table 1 sim 1 error 0 gap 1.5e-3 (opening 1,1)', '  S126 SHIP      table 1 sim 1 error 0 gap 1.5001e-3 (opening 1,1)', '  S124 SHIP      table 1 sim 1 error 0 gap 6.67e-4 (opening 1,1)', '  S122 SHIP      table 1 sim 1 error 0 gap 6.6699e-4 (opening 1,1)', '  S120 SHIP      table 1 sim 1 error 0 gap >1 (opening 1,1)',
      '     S128           148 saved/150 lost of 8000  p', '     S130           15 saved/16 lost of 8000  p', '     S126           14 saved/90 lost of 8000  p'].join('\n');
    const c = classesFrom(t);
    ok(c.sw.length === 3 && SWITCH_RISK.every(x => c.sw.includes(x)), `EDGE: gaps at both ends of [6.67e-4, 1.5e-3] in; 1.5001e-3, 6.6699e-4 and '>1' out (${c.sw.join(', ')})`);
    ok(c.hc.length === 2 && c.hc.includes('S130') && c.hc.includes('S128'), `EDGE: churn exactly 15 in, 14 out (${c.hc.join(', ')})`); }
  // the scoring
  const base = () => Object.fromEntries(PANEL.map(id => [id, { dep: false, flipAny: false, flipReal: false, ship: { any: false, real: false, firstRises: false }, change: 0 }]));
  const cls = { sw: SWITCH_RISK, hc: HIGH_CHURN };
  { const s = score(base(), cls); ok(s.causes.OMIT.v === 'held' && s.causes.SWITCH.v === 'not' && s.Fs.F2.held && s.Fs.F3.held && s.Fs.F4.void && !s.Fs.F1.held, 'no departure: OMIT held, F2 and F3 held, F4 void, F1 not'); }
  { const H = base(); H.S120.dep = true; const s = score(H, cls); ok(s.causes.OTHER.v === 'held' && !s.causes.OTHER.edge && !s.Fs.F3.held, 'a departure on a non-flipping household of the nineteen: OTHER held, F3 not'); }
  { const H = base(); H.S172.dep = true; const s = score(H, cls); ok(s.causes.OTHER.v === 'held' && s.causes.OTHER.edge, 'EDGE: a departure on a non-flipping SWITCH-RISK household alone: OTHER held, marked EDGE'); }
  { const H = base(); H.S128.dep = true; H.S120.dep = true; H.S120.flipAny = H.S120.flipReal = true; const s = score(H, cls); ok(s.causes.SWITCH.v === 'unsettled' && s.causes.NARROW.v === 'unsettled' && s.causes.OTHER.v === 'not' && s.causes.OMIT.v === 'not', 'departures split between a flip and HIGH-CHURN: SWITCH and NARROW unsettled'); }
  { const H = base(); H.S120.dep = true; H.S120.flipAny = true; const s = score(H, cls); ok(s.causes.SWITCH.v === 'held' && s.causes.SWITCH.edge && s.Fs.F3.edge, 'EDGE: a departure on a household whose flip is counterfactual only: SWITCH held but EDGE, F3 EDGE'); }
  { const H = base(); H['bridge 4+cost'].ship = { any: true, real: true, firstRises: true }; H['bridge 4+cost'].change = -0.5; const s = score(H, cls); ok(s.Fs.F1.held && !s.Fs.F4.void && s.Fs.F4.held, 'bridge 4+cost flips up with its change below 0: F1 held, F4 scored and held'); }
  { const H = base(); H['bridge 4+cost'].ship = { any: true, real: false, firstRises: false }; const s = score(H, cls); ok(s.Fs.F1.edge && s.Fs.F4.void, "EDGE: bridge 4+cost's flip only in the shipping default's counterfactual figure: F1 EDGE, F4 void"); }
  // O123's partition at both ends of the interval
  ok(o123(-0.12).REOPT && o123(0.03).REOPT && o123(0.0301).SCALE && o123(-0.1201).OTHER, 'EDGE: the least point at -0.12 and +0.03 is inside, beyond either end outside');
  // the gate's plants
  { const aj = "// c\nexport const W = 0.01;\nconst OUT = process.env.DIAG7AJ_OUT || join(x, 'diag7aj');\nconsole.error('audit-7aj: no case');\nconst a = 1;";
    const aw = "// d\nexport const W = 0.02;\nconst OUT = process.env.DIAG7AW_OUT || join(x, 'diag7aw');\nconsole.error('audit-7aw: no case');\nconst a = 1;";
    const st = t => ({ 'case0.txt': `stamp: code ${CODE} audit ${createHash('sha256').update(t).digest('hex').slice(0, 12)} prediction p sha s\n` });
    ok(g1({ aj: st(aj), aw: st(aw) }, { aj, aw }).bad.length === 0, 'G1 passes two audits differing only in W, comments and their own names');
    const aw2 = aw.replace('const a = 1;', 'const a = 2;');
    ok(g1({ aj: st(aj), aw: st(aw2) }, { aj, aw: aw2 }).bad.some(b => /differ in code/.test(b)), 'planted: a code line changed in one audit - G1 refuses');
    ok(g1({ aj: st(aj), aw: st(aw) }, { aj, aw: aw + ' ' }).bad.some(b => /sha256/.test(b)), "planted: an audit not the one its stamp names - G1 refuses");
    ok(g1({ aj: { ...st(aj), 'case1.txt': 'stamp: code x audit y prediction p sha s\n' }, aw: st(aw) }, { aj, aw }).bad.some(b => /stamps/.test(b)), 'planted: two stamps in one run - G1 refuses'); }
  { const u = (k, arm, ran) => ({ id: 'S120', arm, label: labelOf(arm, RUNS[k].w), ran, joint: { scale: 1 }, done: true });
    const ran = 'mix 3 minPot 29000 bequestWeight 0.01 quad 5';
    const units = { aj: [u('aj', 'CAND', ran), u('aj', 'SHIP', ran)], aw: [u('aw', 'CAND', ran.replace('0.01', '0.02')), u('aw', 'SHIP', ran.replace('0.01', '0.02'))] };
    ok(g3(units).length === 0, 'G3 passes ran lines differing only in bequestWeight');
    units.aw[0].ran = units.aw[0].ran.replace('minPot 29000', 'minPot 29001');
    ok(g3(units).length === 1, 'planted: a minPot changed on one ran line - G3 refuses'); }
  { // G2: the panel's 50 units a run, each once and done
    const full = k => PANEL.flatMap(id => ['CAND', 'SHIP'].map(arm => ({ id, arm, label: labelOf(arm, RUNS[k].w), done: true })));
    const units = { aj: full('aj'), aw: full('aw') };
    ok(g2(units).length === 0, 'G2 passes 50 units a run, each once and done');
    ok(g2({ ...units, aw: units.aw.slice(1) }).length > 0, 'planted: a unit missing - G2 refuses');
    ok(g2({ ...units, aj: [...units.aj, units.aj[0]] }).length > 0, 'planted: a unit repeated - G2 refuses');
    ok(g2({ ...units, aj: units.aj.map((u, i) => (i === 3 ? { ...u, done: false } : u)) }).length > 0, 'planted: a unit not done - G2 refuses'); }
  { // G4: a household's four traces against their logs and the results files' item-1 lines
    const ST = { code: CODE, audit: 'a', prediction: 'p', sha: 's' }, n = N;
    const surv = (lost) => { const s = new Uint8Array(n).fill(1); for (let i = 0; i < lost; i++) s[i] = 0; return s; };
    const mkT = (k, arm, s, seed = 7002) => { const label = labelOf(arm, RUNS[k].w), sim = 100 * s.reduce((t, x) => t + x, 0) / n; return { u: { id: 'S120', arm, label, run: { sim } }, t: { survived: s, Y: 40, raw: { stamp: ST, N: n, seed, arm: `${arm}/${label}`, sim } } }; };
    const build = (seedAw = 7002) => { const units = { aj: [], aw: [] }, TR = { aj: {}, aw: {} };
      for (const k of ['aj', 'aw']) for (const [arm, s] of [['SHIP', surv(10)], ['CAND', surv(4)]]) { const x = mkT(k, arm, s, k === 'aw' ? seedAw : 7002); units[k].push(x.u); TR[k][`S120|${arm}`] = x.t; }
      return { units, TR }; };
    const one = { S120: { saved: 6, lost: 0 } }, b = build();
    ok(g4(b.units, b.TR, { aj: ST, aw: ST }, { aj: one, aw: one }).length === 0, 'G4 passes traces that agree with their logs and the item-1 lines');
    ok(g4(b.units, b.TR, { aj: ST, aw: ST }, { aj: one, aw: { S120: { saved: 7, lost: 0 } } }).length > 0, "planted: a results file's saved count off by one - G4 refuses");
    const c = build(7003); ok(g4(c.units, c.TR, { aj: ST, aw: ST }, { aj: one, aw: one }).length > 0, 'planted: a trace of another seed - G4 refuses');
    const d = build(); d.TR.aw['S120|CAND'].Y = 41; ok(g4(d.units, d.TR, { aj: ST, aw: ST }, { aj: one, aw: one }).length > 0, "planted: one of a household's traces of another length - G4 refuses"); }
  { // the review's G5 plant. A rotation cannot make a departure: sum x is the four survival totals added and subtracted,
    // and a rotation keeps each total, so the plant checks that G5 refuses and that the statistic sees the broken pairing
    // (paths moved both ways, the se widened, the sum unchanged)
    const mk = () => { const s = new Uint8Array(N).fill(1); for (let i = 0; i < 400; i++) s[i * 20] = 0; return s; };
    const S1 = mk(), C1 = mk(), C2 = mk(), S2 = new Uint8Array(N); for (let i = 0; i < N; i++) S2[i] = S1[(i + 1) % N];
    const raw = s => ({ survived: Buffer.from(s).toString('base64'), level: 'a', tier: 'a', wealth: 'a', taxPaid: 'a', failYear: 'a' });
    const TR = { aj: { 'S120|SHIP': { raw: raw(S1) } }, aw: { 'S120|SHIP': { raw: raw(S2) } } };
    const r0 = change(C1, S1, C2, S1), r = change(C1, S1, C2, S2);
    ok(g5({ aj: TR.aj, aw: { 'S120|SHIP': { raw: raw(S1) } } }).length === 0 && g5(TR).length === 1, 'planted: one trace rotated by a path - G5 refuses (and passes the unrotated pair)');
    ok(r0.up + r0.down === 0 && r.up === 400 && r.down === 400 && r.sum === 0 && r.se > r0.se && !r.departs, `planted: the rotation moves ${r.up + r.down} paths both ways and widens the se (${r0.se.toFixed(3)} to ${r.se.toFixed(3)}) with the sum unchanged, so no departure: G5 is what catches it`); }
  // the items' outcomes, each reached
  { const reach = { 1: new Set(), 2: new Set() };
    const H0 = base(); reach[1].add(item1(score(H0, cls)));                                         // no departure: HELD
    const H1 = base(); H1.S120.dep = true; reach[1].add(item1(score(H1, cls)));                     // a nineteen departs, no flip: FALSIFIED
    const H2 = base(); H2.S120.dep = true; H2.S120.flipAny = true; reach[1].add(item1(score(H2, cls)));   // its flip counterfactual only: INCONCLUSIVE
    ok(reach[1].size === 3, `item 1 reaches ${[...reach[1]].join(', ')}`);
    reach[2].add(item2({ d: -0.12, lo: -0.2, hi: 0 })); reach[2].add(item2({ d: 0.064, lo: 0.02, hi: 0.1 })); reach[2].add(item2({ d: 0.064, lo: 0.031, hi: 0.1 }));
    ok(reach[2].size === 3 && item2({ d: 0.03, lo: 0, hi: 0.06 }) === 'HELD' && item2({ d: -0.1201, lo: -0.2, hi: -0.1202 }) === 'FALSIFIED', `EDGE: item 2 at the band's end is HELD, past it with its interval clear FALSIFIED, reaching ${[...reach[2]].join(', ')}`);
    out.reach = reach; }
  return out;
}

/* ---------- loading ---------- */
const logsOf = dir => Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')]));
function loadTraces(units, dir) {
  const TR = {};
  for (const u of units) { const f = join(dir, A.traceName(u.id, u.arm, u.label)); if (!existsSync(f)) continue; const raw = JSON.parse(gunzipSync(readFileSync(f)).toString()); TR[`${u.id}|${u.arm}`] = { ...decode(raw), raw }; }
  return TR;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let P0;
  try { P0 = planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: ${e.message}`); process.exit(1); }
  if (process.argv.includes('--planted')) {
    P0.forEach(m => console.log(`ok   ${m}`));
    for (const k of [1, 2]) console.log(`OUTCOMES REACHED: item ${k}: ${[...P0.reach[k]].sort().join(', ')}`);
    console.log(`EDGES: 7 and 8 paths one way at the integer threshold, sum -8 under 2.58 se, gaps at both ends of the SWITCH-RISK range, churn exactly 15, a non-flipping SWITCH-RISK departure deciding OTHER, a flip in a counterfactual figure only, O123's least point at both ends of its interval`);
    process.exit(0);
  }
  const logs = {}, units = {}, TR = {}, audits = {}, text = {};
  for (const k of ['aj', 'aw']) { logs[k] = logsOf(RUNS[k].dir); units[k] = Object.values(logs[k]).flatMap(A.parse); audits[k] = readFileSync(RUNS[k].audit, 'utf8'); text[k] = readFileSync(RUNS[k].results, 'utf8'); }
  // each run's logs through the fair-test gate against the prediction it was launched under (one code and audit version
  // across the run, launched through the launcher under that prediction, its blob unchanged since)
  for (const k of ['aj', 'aw']) requireFairLogs(logs[k], RUNS[k].pred);
  const G1 = g1(logs, audits), bad = [...G1.bad, ...g2(units), ...g3(units)];
  if (!bad.length) { for (const k of ['aj', 'aw']) TR[k] = loadTraces(units[k], RUNS[k].dir); bad.push(...g4(units, TR, G1.st, { aj: item1Of(text.aj), aw: item1Of(text.aw) }), ...g5(TR)); }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - G1 one stamp a run, code ${CODE} in both, each audit its stamp's, the audits the same code but W, comments and their names; G2 50 units a run, each once and done, the panel's 25; G3 ran and joint lines the same but bequestWeight; G4 N ${N} and seed ${SEED} in all 100 traces, each its log's, Y the same in each household's four, the 50 saved/lost pairs both files'; G5 S120's shipping default bit for bit the same`);
  const cls = classesFrom(text.aj);
  if (cls.sw.slice().sort().join('|') !== SWITCH_RISK.slice().sort().join('|') || cls.hc.slice().sort().join('|') !== HIGH_CHURN.slice().sort().join('|')) { console.log(`REFUSED: the classes re-derived from results-7aj.txt (SWITCH-RISK ${cls.sw.join(', ')}; HIGH-CHURN ${cls.hc.join(', ')}) are not the forecast's lists`); process.exit(1); }
  console.log(`CLASSES (re-derived from results-7aj.txt, the forecast's lists): SWITCH-RISK ${SWITCH_RISK.join(', ')}; HIGH-CHURN ${HIGH_CHURN.join(', ')}; the nineteen others`);
  const H = {}, U = (k, id, arm) => units[k].find(u => u.id === id && u.arm === arm), T = (k, id, arm) => TR[k][`${id}|${arm}`];
  console.log('\nEVERY HOUSEHOLD: the change in the candidate\'s gain from 0.01 to 0.02 (points), its se, sum x, the moved paths up/down with the exact sign test, departure; each arm\'s opening pair and risk-above at 0.01 -> 0.02 (* the figure the arm holds)');
  for (const id of PANEL) {
    const r = change(T('aj', id, 'CAND').survived, T('aj', id, 'SHIP').survived, T('aw', id, 'CAND').survived, T('aw', id, 'SHIP').survived);
    const f = flip({ CAND: U('aj', id, 'CAND'), SHIP: U('aj', id, 'SHIP') }, { CAND: U('aw', id, 'CAND'), SHIP: U('aw', id, 'SHIP') });
    H[id] = { dep: r.departs, flipAny: f.any, flipReal: f.real, ship: f.SHIP, change: r.change };
    const op = (arm, k) => { const u = U(k, id, arm); return arm === 'SHIP' ? `*${u.gap.open1e3},${u.gap.open0}` : `${u.gap.open1e3},*${u.gap.open0}`; };
    const cl = SWITCH_RISK.includes(id) ? 'SWITCH-RISK' : HIGH_CHURN.includes(id) ? 'HIGH-CHURN' : '';
    console.log(`  ${id.padEnd(14)} ${cl.padEnd(11)} change ${r.change >= 0 ? '+' : ''}${r.change.toFixed(3)} se ${r.se.toFixed(3)} sum ${r.sum} (up ${r.up}, down ${r.down}; sign p ${r.sign.toExponential(1)}) ${r.departs ? 'DEPARTS' : '-'} | CAND ${op('CAND', 'aj')} -> ${op('CAND', 'aw')} ${U('aj', id, 'CAND').joint.decided === U('aw', id, 'CAND').joint.decided ? '' : 'riskAbove moved '}| SHIP ${op('SHIP', 'aj')} -> ${op('SHIP', 'aw')} ${U('aj', id, 'SHIP').joint.decided === U('aw', id, 'SHIP').joint.decided ? '' : 'riskAbove moved '}| flip ${f.real ? 'yes' : f.any ? 'counterfactual only' : 'no'}`);
  }
  const s = score(H, cls);
  console.log('\nTHE FORECAST, SCORED');
  for (const [k, f] of Object.entries(s.Fs)) console.log(`  ${k} (${f.p}): ${f.void ? 'void' : f.edge ? `EDGE, void (literal reading: ${f.held ? 'held' : 'not'})` : f.held ? 'held' : 'not'}`);
  console.log(`  Brier over the scored: ${s.brier === null ? 'none scored' : s.brier.toFixed(4)}`);
  console.log(`  reported, unpriced: flips on S172 ${H.S172.flipReal ? 'yes' : 'no'}, S124 ${H.S124.flipReal ? 'yes' : 'no'}; on the nineteen: ${PANEL.filter(id => !SWITCH_RISK.includes(id) && !HIGH_CHURN.includes(id) && H[id].flipReal).join(', ') || 'none'}`);
  console.log('\nTHE CAUSES OF 7 OCT 22:06 UK');
  for (const [k, c] of Object.entries(s.causes)) console.log(`=> CARRY-${k} ${c.edge ? `EDGE (literal: ${c.v})` : c.v}`);
  console.log('\nREPORTED, NOT SCORED');
  for (const id of PANEL) { const c = armChange(T('aj', id, 'CAND').survived, T('aw', id, 'CAND').survived), sh = armChange(T('aj', id, 'SHIP').survived, T('aw', id, 'SHIP').survived);
    const g1v = U('aj', id, 'SHIP').gap.gap, g2v = U('aw', id, 'SHIP').gap.gap, dir = g1v === g2v ? 'same' : (/^[0-9.e+-]+$/.test(g1v) && /^[0-9.e+-]+$/.test(g2v)) ? (Number(g2v) > Number(g1v) ? 'up' : 'down') : `${g1v} -> ${g2v}`;
    console.log(`  ${id.padEnd(14)} CAND ${c.change >= 0 ? '+' : ''}${c.change.toFixed(3)} (se ${c.se.toFixed(3)}) SHIP ${sh.change >= 0 ? '+' : ''}${sh.change.toFixed(3)} (se ${sh.se.toFixed(3)}) | SHIP's gap ${g1v} -> ${g2v} (${dir})`); }
  { const sh = id => armChange(T('aj', id, 'SHIP').survived, T('aw', id, 'SHIP').survived).change; console.log(`=> O121-WEIGHT ${sh('S130') >= 0.5 && sh('S370') >= 0.5 ? 'held' : 'not'} (SHIP 0.01 -> 0.02: S130 ${sh('S130').toFixed(3)}, S370 ${sh('S370').toFixed(3)})`); }
  // ITEM 2: the fixed-policy re-score
  console.log('\nITEM 2: THE FIXED-POLICY RE-SCORE (7aj\'s traces scored at 0.02 with 7aw\'s settings; the controls first)');
  const cfgOf = (k, id, wb, traces) => { const u = U('aw', id, 'CAND'); return { lambda: Number(A.field(u.ran, 'lambda')), floor: Math.min(...A.field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb, spendYears: spendYears(traces.X, traces.Y) }; };
  const leg = (k, id, wb) => { const X = T(k, id, 'SHIP'), Y = T(k, id, 'CAND'); return A.wholeLeg(X, Y, cfgOf(k, id, wb, { X, Y }), 0.05); };
  const files = { aj: item2Of(text.aj), aw: item2Of(text.aw) };
  const ctl = [];
  for (const id of PANEL) for (const [k, wb] of [['aj', 0.01], ['aw', 0.02]]) { const l = leg(k, id, wb), f = files[k][id]; if (!f || Math.abs(l.d - f.d) > 5e-4 + 1e-9 || Math.abs(l.lo - f.lo) > 5e-4 + 1e-9 || Math.abs(l.hi - f.hi) > 5e-4 + 1e-9) ctl.push(`${k} ${id}: ${l.d.toFixed(3)} (${l.lo.toFixed(3)} to ${l.hi.toFixed(3)}) against the file's ${f ? `${f.d} (${f.lo} to ${f.hi})` : 'none'}`); }
  if (ctl.length) { console.log(`REFUSED: the controls do not reproduce their files' item-2 lines:\n  ${ctl.join('\n  ')}`); process.exit(1); }
  const moved = PANEL.filter(id => Math.abs(leg('aw', id, 0.03).d - files.aw[id].d) > 5e-4).length;
  if (moved === 0) { console.log('REFUSED: the plant (the weight at 0.03) moved no household'); process.exit(1); }
  console.log(`  controls: 7aw's traces at 0.02 and 7aj's at 0.01 reproduce all 50 item-2 lines of their files to 0.0005; plant: the weight at 0.03 moves ${moved} of 25`);
  const fixed = PANEL.map(id => ({ id, l: leg('aj', id, 0.02) })).sort((a, b) => a.l.d - b.l.d);
  for (const { id, l } of fixed) console.log(`  ${id.padEnd(14)} fixed-policy whole at 0.02 ${l.d >= 0 ? '+' : ''}${l.d.toFixed(3)} (unconditional ${l.lo.toFixed(3)} to ${l.hi.toFixed(3)}); 7aw's measured ${files.aw[id].d >= 0 ? '+' : ''}${files.aw[id].d.toFixed(3)}`);
  const least = fixed[0].l.d, o = o123(least);
  console.log(`  the least fixed-policy point ${least.toFixed(3)} (${fixed[0].id}) against 7aw's derived 80% interval ${O123_IV[0]} to +${O123_IV[1]}`);
  for (const k of ['REOPT', 'SCALE', 'OTHER']) console.log(`=> O123-${k} ${o[k] ? 'held' : 'not'}`);
  const i1 = item1(s), i2 = item2(fixed[0].l);
  console.log(`\nTHE ITEMS\n1. CARRY's rule held out on 7aw (F2 and F3, read literally): ${i1}\n2. O123's cause (the least fixed-policy point ${least.toFixed(3)}, 95% ${fixed[0].l.lo.toFixed(3)} to ${fixed[0].l.hi.toFixed(3)}, against ${O123_IV[0]} to +${O123_IV[1]}): ${i2}`);
  console.log(`\nOUTCOME: 1 ${i1}, 2 ${i2}`);
}
