/*
 * AO'S REDUCER (PLAN.md AREF, its AO step; predictions/diag-ao.md; the deep review after AN, deep-review-log.md 15 Oct 21:05
 * UK). Four jobs at six shares, the candidate's own unit, seed 7002, into results/diagao: AO, ARS and CO on S364
 * (audit-ao.mjs: the adaptive reference with the default split, with the RS split, and the order reference) and A6 on S360
 * (audit-an.mjs with AN_JOB=A6: NODE-AX's BO with its reference swapped), A6 read against NODE-AX's saved BO
 * (results/diagnodeax, behind NODE-AX's own gate) on the same 4,000 paths a world.
 * THE GATE: each job once and done at the registered settings (4,000 paths a world, P on ten times that on AO and ARS, 60
 *   points, seed 7002, the reference's lattice 160 by 41 with 128 draws), stamped as launched; its solve's meta reads the
 *   candidate's settings and the job's reference and split; every self-check in full (armTook, adaptTook, pairTook and
 *   forceIdentity on S364; armTook, adaptTook, refTook, ownTook, identity on 12,000 paths, qfTook and layerTook on A6); the
 *   registered pair (P ai 12, D ai 14); every run at its path count; the tail check's twelve cells printed on AO and ARS; the
 *   files whole and the logs'; NODE-AX's BO behind NODE-AX's gate, its file the one recorded (sha bc583b88e106e30a).
 * THE ITEMS:
 *   1 (primary): AO's read at P against its runs, ln(table / runs), in worlds 1 and 2: the table AO's P read at the year-0
 *     state in that world, the runs P forced in year 0 on 40,000 paths, each world's exact (Clopper-Pearson) interval on the
 *     count at 1 - 0.05 / 2 (two worlds): HELD when both intervals sit inside [-ln 2, +ln 2]; FALSIFIED when either lies wholly
 *     at or beyond +ln 3 (over: the table above its runs) or -ln 3 (under), the side named; otherwise INCONCLUSIVE.
 *   2: A6's bridge-years grid residual GB in worlds 0 and 1 (AN's item 1's rule, Z for two worlds, two sides): HELD inside
 *     [-0.5, +0.5]; FALSIFIED when either world's interval lies wholly at or beyond one point either way; otherwise INCONCLUSIVE.
 *   3: no material harm to A6's runs against BO's on the same paths, worlds 0 and 1 (AN's item 2's rule: the exact conditional
 *     McNemar interval, the margin marginFor(BO's survival), Holm across the two worlds).
 *   4: ARS's read at P against its runs, worlds 1 and 2, as item 1.
 * REPORTED: every S364 job's tables and runs at P, D and its own opening by world, with ln(table / runs); CO against NE-GRID C's
 *   S364 ORDER (its bits and tables, behind NE-GRID C's gate) and NE-GRID C's S364 BASE at six shares beside; the probe's corner
 *   status and R's share at the year-1 reads; the tail check and the engine run by world and p-decade; the tier slice by year,
 *   tiers and band (O158); A6's ledger beside BO's, its luck-adjusted T (O160: a linear control variate on years 0 to 7's
 *   shocks, the deep review's) and QF by year (O161); A6's refcheck cells.
 *   node research/solver/reduce-ao.mjs [dir] [paths a world] [scale] [--preflight] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';
import { mcnemarHarmP, holm, outcome, marginFor, zFor, clopperPearson } from './stats.mjs';
import { pathsForSeed } from '../engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-ao.md';
export const SEED = '7002', NPW = 4000, NQF = 1000, LATTICE = '160x41', NZ = 128, FIMAX = 1000;
export const PMULT = Object.freeze({ AO: 10, ARS: 10, CO: 1 }), PAIR = Object.freeze([12, 14]);
export const Z = 2.241402727604947, ALPHA1 = 0.05 / 2;   // Z: the 1 - 0.05 / 4 normal quantile (two worlds, two sides)
export const IN1 = Math.log(2), OUT1 = Math.log(3), IN2 = 0.5, OUT2 = 1.0;
export const NODEAX_BO_SHA = 'bc583b88e106e30a', BO_FILE = 'S360-BO-P60S6Q5.json.gz';
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const S364 = ['AO', 'ARS', 'CO'], LABELS = Object.freeze({ AO: 'AO/P60S6Q5', ARS: 'ARS/P60S6Q5', CO: 'CO/P60S6Q5', A6: 'A6/P60S6Q5' });
export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S364|S360)\s+case \| job ((AO|ARS|CO|A6|ORDER|BASE)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^(AO|AN|NE-GRID C): .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { kind: hd[1], npw: Number(hd[2]), scale: Number(hd[3]), seed: hd[4] } : null, checks: {}, tables: [], sims: {}, probe: [], tail: [], tier: [], refTail: null,
        ledger: [], qf: [], refcheck: [], adaptive: null, pair: null, bridge: null, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label, e = esc(L);
    let m;
    if ((m = new RegExp(`^solve CAND ${e}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^adaptive ${e}: moves (\\d+) nonMono (-?\\d+) lattice (\\d+)x(\\d+)x(\\d+) nz (\\d+) last year (\\d+) secs (\\S+)$`).exec(l))) j.adaptive = { moves: Number(m[1]), nonMono: Number(m[2]), lattice: `${m[3]}x${m[4]}`, ng: Number(m[5]), nz: Number(m[6]), TL: Number(m[7]), secs: Number(m[8]) };
    else if ((m = new RegExp(`^pair ${e}: P ai (\\d+) .*; D ai (\\d+) `).exec(l))) j.pair = [Number(m[1]), Number(m[2])];
    else if ((m = new RegExp(`^openings ${e}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^bridge ${e}: reader years ?(\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): P (\\S+) D (\\S+) OWN (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), P: Number(m[4]), D: Number(m[5]), OWN: Number(m[6]) };
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^sim ${e} (\\d) (P|D|OWN) ai (\\d+): (\\d+)\\/(\\d+) bits (\\S+)$`).exec(l))) j.sims[`${m[2]}${m[1]}`] = { ai: Number(m[3]), ok: Number(m[4]), n: Number(m[5]), bits: m[6] };
    else if ((m = new RegExp(`^sim ${e} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^probe ${e} (\\d) P: reads (\\d+) pr (\\S+) plain (\\S+) deletion (\\S+) residual (\\S+) \\| (.*)$`).exec(l))) {
      const part = nm => { const x = new RegExp(`${nm} w (\\S+) p (\\S+) S (\\S+) c (\\S+) R (\\S+)`).exec(m[7]); return x ? { w: Number(x[1]), p: Number(x[2]), S: Number(x[3]), c: Number(x[4]), R: Number(x[5]) } : null; };
      j.probe[Number(m[1])] = { reads: Number(m[2]), plain: Number(m[4]), deletion: Number(m[5]), residual: Number(m[6]), sup: part('sup'), clip: part('clip'), copy: part('copy') };
    }
    else if ((m = new RegExp(`^tail ${e} (\\d) (\\d): records (\\d+) states (\\d+)(.*)$`).exec(l))) {
      const part = nm => { const x = new RegExp(`${nm} (\\S+) ln (\\S+) \\((\\S+) to (\\S+)\\) (ok|off)`).exec(m[5]); return x ? { r: Number(x[1]), ln: Number(x[2]), lo: Number(x[3]), hi: Number(x[4]), off: x[5] === 'off' } : null; };
      const p = /years (\S+) p (\S+)/.exec(m[5]);
      j.tail.push({ k: Number(m[1]), bin: Number(m[2]), records: Number(m[3]), states: Number(m[4]), years: p ? p[1] : '', p: p ? Number(p[2]) : NaN, sim: part('simulated'), eng: part('engine') });
    }
    else if ((m = new RegExp(`^refTail ${e}: cells (\\d+) off (\\d+); engine off (\\d+);`).exec(l))) j.refTail = { cells: Number(m[1]), off: Number(m[2]), engOff: Number(m[3]) };
    else if ((m = new RegExp(`^tier ${e} (\\d) (\\d+) (\\d),(\\d) (band|low|high): records (\\d+) paths (\\d+) realised less p (\\S+) se (\\S+)$`).exec(l))) j.tier.push({ k: Number(m[1]), t: Number(m[2]), tiers: `${m[3]},${m[4]}`, band: m[5], n: Number(m[6]), paths: Number(m[7]), d: Number(m[8]), se: Number(m[9]) });
    else if ((m = new RegExp(`^ledger ${e} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^qf ${e} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
    else if ((m = new RegExp(`^refcheck ${e} (\\d) (\\d): (.*)$`).exec(l))) j.refcheck.push({ k: Number(m[1]), bin: Number(m[2]), text: m[3] });
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3', shareNodes: 'none' };
const ARMF = Object.freeze({ AO: { readerRef: 'adaptive', readerSplit: 'null', floor: '205000' }, ARS: { readerRef: 'adaptive', readerSplit: 'rs', floor: '205000' }, CO: { readerRef: 'order', readerSplit: 'null', floor: '205000' }, A6: { readerRef: 'adaptive', readerSplit: 'null', floor: '5000' } });
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], pts = Math.max(4, Math.round(60 / scale)), fi = Math.min(npw, FIMAX);
  for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(`a job that is not AO's: ${x.label}`);
  for (const [arm, label] of Object.entries(LABELS)) {
    const js = jobs.filter(x => x.label === label);
    if (js.length !== 1) { bad.push(`${arm}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0], adaptive = arm !== 'CO';
    if (!j.done) bad.push(`${arm}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${arm}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${arm}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${arm}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, ...ARMF[arm], pts: String(pts), grid: `total${pts}x6x6` })) if (field(ran, f) !== v) bad.push(`${arm}: ${f} is ${field(ran, f)}, not ${v}`);
    const need = arm === 'A6' ? ['armTook', 'adaptTook', 'refTook', 'ownTook', 'identity', 'qfTook', 'layerTook'] : ['armTook', 'pairTook', 'forceIdentity', ...(adaptive ? ['adaptTook'] : [])];
    for (const c of need) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || (['armTook', 'adaptTook', 'pairTook'].includes(c) && x[1] !== 1)) bad.push(`${arm}: ${c} did not pass in full`); }
    if (arm !== 'A6' && j.checks.forceIdentity && j.checks.forceIdentity[1] !== fi) bad.push(`${arm}: forceIdentity not on ${fi} paths`);
    if (adaptive && (!j.adaptive || j.adaptive.lattice !== LATTICE || j.adaptive.nz !== NZ || j.adaptive.nonMono !== 0 || !(j.adaptive.moves > 0))) bad.push(`${arm}: the reference was not built at the registered lattice (${LATTICE}, ${NZ} draws) with a monotone last year`);
    if (!j.own) bad.push(`${arm}: no openings line`);
    if (!j.solve) bad.push(`${arm}: no solve line`);
    if (arm === 'A6') {
      if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push('A6: the identity was not held on every path of three worlds');
      if (!j.bridge || !j.bridge.length) bad.push('A6: no bridge years printed');
      else if (j.adaptive && j.adaptive.TL !== j.bridge[j.bridge.length - 1]) bad.push('A6: the reference\'s last year is not the last bridge year');
      for (let w = 0; w < 3; w++) {
        if (!j.tables[w] || !Number.isFinite(j.tables[w].OWN) || !Number.isFinite(j.tables[w].READ)) bad.push(`A6: world ${w}'s tables are missing`);
        const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(`A6: no OWN run of ${npw} paths at its opening in world ${w}`);
        if (!j.ledger[w] || [...KEYS, ...(j.bridge || []).map(t => `Y${t}`)].some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`A6: world ${w}'s ledger line is missing or short`);
        if (!j.qf[w] || j.qf[w].n !== Math.min(npw, NQF) || !Number.isFinite(j.qf[w].QF)) bad.push(`A6: world ${w}'s QF line is missing or not on ${Math.min(npw, NQF)} paths`);
      }
    } else {
      if (!j.pair || j.pair[0] !== PAIR[0] || j.pair[1] !== PAIR[1]) bad.push(`${arm}: the pair is not the registered one (P ai ${PAIR[0]}, D ai ${PAIR[1]})`);
      for (let w = 0; w < 3; w++) {
        if (!j.tables[w] || !['P', 'D', 'OWN'].every(x => Number.isFinite(j.tables[w][x]))) bad.push(`${arm}: world ${w}'s tables are missing`);
        const sp = j.sims[`P${w}`], sd = j.sims[`D${w}`];
        if (!sp || sp.n !== npw * PMULT[arm] || sp.ai !== PAIR[0]) bad.push(`${arm}: no P run of ${npw * PMULT[arm]} paths in world ${w}`);
        if (!sd || sd.n !== npw || sd.ai !== PAIR[1]) bad.push(`${arm}: no D run of ${npw} paths in world ${w}`);
        if (j.own && j.own.ai !== PAIR[0] && j.own.ai !== PAIR[1] && (!j.sims[`OWN${w}`] || j.sims[`OWN${w}`].n !== npw)) bad.push(`${arm}: no run of its own opening in world ${w}`);
        if (!j.probe[w] || !j.probe[w].sup) bad.push(`${arm}: world ${w}'s probe is missing`);
      }
      if (adaptive) {
        if (!j.refTail) bad.push(`${arm}: no tail check summary`);
        for (let w = 0; w < 3; w++) for (let b = 0; b < 4; b++) if (!j.tail.some(x => x.k === w && x.bin === b)) bad.push(`${arm}: the tail check's cell ${w} ${b} is missing`);
      }
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) { bad.push(`${arm}: its file ${j.file} is missing`); continue; }
      if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${arm}: its file is stamped by other code`);
      if (f.NPW !== npw) bad.push(`${arm}: its file is not on ${npw} paths a world`);
      for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], ...(s.bitsB ? [[`${nm}b`, s.bitsB]] : [])]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${arm}: its file's ${b} bits are not the log's`); }
      if (arm === 'A6') for (let w = 0; w < 3; w++) for (const x of [...KEYS, ...(j.bridge || []).map(t => `Y${t}`)]) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`A6: its file's ${x}${w} paths are not ${npw}`); }
      if (arm === 'A6' && (!f.paths || !f.paths.meta || !f.paths.Q)) bad.push('A6: its file carries no bridge records');
    }
  }
  return bad;
}

// a mean's interval at z, in points
export function meanOf(a, z = Z) { const n = a.length, m = a.reduce((t, x) => t + x, 0) / n, v = n > 1 ? a.reduce((t, x) => t + (x - m) * (x - m), 0) / (n - 1) : 0; const se = Math.sqrt(v / n); return { m: q(m), lo: q(m - z * se), hi: q(m + z * se), se }; }
// the paired change in survival of A against B on the same paths: lost (alive under B only), saved (under A only)
export function paired(a, b) { let lost = 0, saved = 0, both = 0; for (let i = 0; i < a.length; i++) { if (b[i] && !a[i]) lost++; else if (a[i] && !b[i]) saved++; else if (a[i] && b[i]) both++; } return { lost, saved, both, N: a.length, bAlive: both + lost }; }
// ln(table / runs): the table in points, the runs c of N, the exact interval on c at 1 - alpha (a count of 0: no upper end)
export function lnRead(table, c, N, alpha = ALPHA1) {
  const [plo, phi] = clopperPearson(c, N, alpha), r = 100 * c / N;
  return { table, c, N, runs: q(r), m: c > 0 ? q(Math.log(table / r)) : Infinity, lo: q(Math.log(table / (100 * phi))), hi: plo > 0 ? q(Math.log(table / (100 * plo))) : Infinity };
}
export function readItem(cells) {
  const inside = x => x.lo >= -IN1 && x.hi <= IN1, over = x => x.lo >= OUT1, under = x => x.hi <= -OUT1;
  const side = cells.some(over) && cells.some(under) ? 'over and under' : cells.some(over) ? 'over' : cells.some(under) ? 'under' : null;
  return { outcome: side ? 'FALSIFIED' : cells.every(inside) ? 'HELD' : 'INCONCLUSIVE', side, cells };
}
// the luck-adjusted mean (O160; the deep review's control variate): y regressed on an intercept and the shocks, the intercept
// (the shocks' mean is 0), with its standard error from the residuals
export function luckAdjusted(y, X) {
  const p = X[0].length + 1, n = y.length, A = Array.from({ length: p }, () => new Float64Array(p + 1));
  for (let i = 0; i < n; i++) { const r = [1, ...X[i]]; for (let a = 0; a < p; a++) { A[a][p] += r[a] * y[i]; for (let b = 0; b < p; b++) A[a][b] += r[a] * r[b]; } }
  for (let c = 0; c < p; c++) { let mx = c; for (let r = c + 1; r < p; r++) if (Math.abs(A[r][c]) > Math.abs(A[mx][c])) mx = r; [A[c], A[mx]] = [A[mx], A[c]]; for (let r = 0; r < p; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= p; k++) A[r][k] -= f * A[c][k]; } }
  const beta = A.map((r, i) => r[p] / r[i]); let ss = 0;
  for (let i = 0; i < n; i++) { const e = y[i] - beta[0] - X[i].reduce((t, x, a) => t + x * beta[a + 1], 0); ss += e * e; }
  return { m: q(beta[0]), se: Math.sqrt(ss / (n - p) / n) };
}

/* R(arm, k): [table at P, P's runs, P's paths] in world k on S364; P(arm, x, k): per-path array in points (arm 'A6' or 'BO');
   S(arm, k): the OWN survival bits */
export function items(R, P, S) {
  const out = {};
  out['1'] = readItem([1, 2].map(k => ({ k, ...lnRead(...R('AO', k)) })));
  const g = [0, 1].map(k => ({ k, ...meanOf(P('A6', 'GB', k)) }));
  const inside = x => x.lo >= -IN2 && x.hi <= IN2, under = x => x.hi <= -OUT2, over = x => x.lo >= OUT2;
  out['2'] = { outcome: g.some(x => under(x) || over(x)) ? 'FALSIFIED' : g.every(inside) ? 'HELD' : 'INCONCLUSIVE', side: g.some(under) ? 'under' : g.some(over) ? 'over' : null, cells: g };
  const pr = [0, 1].map(k => ({ k, ...paired(S('A6', k), S('BO', k)) }));
  const ph = holm(pr.map(x => mcnemarHarmP(x.lost, x.saved)));
  const oc = pr.map((x, i) => ({ ...x, margin: marginFor(100 * x.bAlive / x.N), ...outcome({ b: x.lost, c: x.saved, N: x.N, margin: marginFor(100 * x.bAlive / x.N), pHolm: ph[i] }) }));
  out['3'] = { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED' : oc.every(x => x.outcome === 'no material harm') ? 'HELD' : 'INCONCLUSIVE', cells: oc };
  out['4'] = readItem([1, 2].map(k => ({ k, ...lnRead(...R('ARS', k)) })));
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), iv = x => `${f4(x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
const lnLine = x => `world ${x.k}: table ${f4(x.table)} runs ${x.c}/${x.N} (${f4(x.runs)}), ln ${iv(x)}`;
export function report(R, P, S) {
  const it = items(R, P, S), L = [];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. AO's read at P against its runs, ln(table / runs), inside ln 2 in worlds 1 and 2 (FALSIFIED at a whole interval past ln 3 either way): ${it['1'].outcome}${it['1'].side ? ` (${it['1'].side})` : ''}`);
  L.push(`     ${it['1'].cells.map(lnLine).join('; ')}`);
  L.push(`2. A6's bridge-years grid residual GB within half a point in worlds 0 and 1 (FALSIFIED at a whole interval past one point either way): ${it['2'].outcome}${it['2'].side ? ` (${it['2'].side})` : ''}`);
  L.push(`     ${it['2'].cells.map(x => `world ${x.k}: ${iv(x)}`).join('; ')}`);
  L.push(`3. no material harm to A6's runs against BO's on the same paths, worlds 0 and 1: ${it['3'].outcome}`);
  L.push(`     ${it['3'].cells.map(x => `world ${x.k}: lost ${x.lost} saved ${x.saved} of ${x.N}, change ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)}) at margin ${x.margin}: ${x.outcome}`).join('; ')}`);
  L.push(`4. ARS's read at P against its runs, as item 1: ${it['4'].outcome}${it['4'].side ? ` (${it['4'].side})` : ''}`);
  L.push(`     ${it['4'].cells.map(lnLine).join('; ')}`);
  L.push(`OUTCOME: ${['1', '2', '3', '4'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  for (const i of ['1', '2', '3', '4']) { const x = i === '1' || i === '4' ? it[i].cells[0].m : i === '2' ? it[i].cells[0].m : it[i].cells[0].d; L.push(`REALISED item ${i}: ${f4(x)}`); }
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['1', '2', '3', '4'], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
function planted() {
  const cases = [], N = 4000, NP = 40000;
  const arr = (m, s = 1) => Float64Array.from({ length: N }, (_, i) => (i % 2 ? m + s : m - s));
  const bitsOf = (alive, lose = 0, gain = 0) => { const b = new Uint8Array(N); for (let i = 0; i < alive; i++) b[i] = 1; for (let i = 0; i < lose; i++) b[i] = 0; for (let i = 0; i < gain; i++) b[alive + i] = 1; return b; };
  // o.ao / o.ars: [table, runs] in worlds 1 and 2 (world 0 unread); o.gb: A6's GB by world; o.lose / o.gain: A6 against BO
  const mk = (o = {}) => {
    const per = { A6: {}, BO: {} };
    for (const arm of ['A6', 'BO']) for (const k of [0, 1, 2]) for (const x of KEYS) per[arm][`${x}${k}`] = arr(0);
    for (const k of [0, 1, 2]) per.A6[`GB${k}`] = arr(o.gb ? o.gb[k] : 0, o.s !== undefined ? o.s : 1);
    const bits = { BO: [0, 1, 2].map(() => bitsOf(2000)), A6: [0, 1, 2].map(k => bitsOf(2000, o.lose ? o.lose[k] : 0, o.gain ? o.gain[k] : 0)) };
    const rd = { AO: o.ao || [[0.5, 200], [0.3, 120], [1.5, 600]], ARS: o.ars || [[0.5, 200], [0.3, 120], [1.5, 600]] };
    return { R: (arm, k) => [rd[arm][k][0], rd[arm][k][1], NP], P: (arm, x, k) => per[arm][`${x}${k}`], S: (arm, k) => bits[arm][k] };
  };
  const outc = (i, o, want, what) => { const r = mk(o), got = items(r.R, r.P, r.S)[i].outcome; REACHED[i].add(got); cases.push([what, got, want]); };
  // items 1 and 4: runs 120 of 40,000 (0.3 points) and 600 (1.5 points)
  outc('1', {}, 'HELD', 'the tables at their runs in worlds 1 and 2: 1 HELD');
  outc('1', { ao: [[9, 200], [1.5, 120], [1.5, 600]] }, 'FALSIFIED', 'world 1 read at five times its runs: 1 FALSIFIED');
  outc('1', { ao: [[0.5, 200], [0.3, 120], [0.3, 600]] }, 'FALSIFIED', 'world 2 read at a fifth of its runs: 1 FALSIFIED');
  outc('1', { ao: [[0.5, 200], [0.6, 120], [1.5, 600]] }, 'INCONCLUSIVE', 'world 1 read at twice its runs: 1 INCONCLUSIVE');
  outc('1', { ao: [[0.5, 200], [0.135, 120], [1.5, 600]] }, 'INCONCLUSIVE', 'world 1 read at 0.45 of its runs (under, short of ln 3): 1 INCONCLUSIVE');
  outc('1', { ao: [[50, 200], [0.3, 120], [1.5, 600]] }, 'HELD', 'world 0 read at a hundred times its runs (not read): 1 HELD');
  outc('1', { ao: [[0.5, 200], [0.02, 0], [1.5, 600]] }, 'INCONCLUSIVE', 'no run alive in world 1, its table 0.02 points (no upper end; the foot ln 0.6): 1 INCONCLUSIVE'); EDGES.push('a world with no run alive');
  outc('1', { ao: [[0.5, 200], [0.3, 0], [1.5, 600]] }, 'FALSIFIED', 'no run alive in world 1, its table 0.3 points (the foot past ln 3): 1 FALSIFIED');
  outc('1', { ao: [[0.5, 200], [0, 120], [1.5, 600]] }, 'FALSIFIED', 'a table of 0 against 120 runs: 1 FALSIFIED (under)'); EDGES.push('a table of zero');
  { const [lo, hi] = clopperPearson(600, NP, ALPHA1); const at = t => mk({ ao: [[0.5, 200], [0.3, 120], [t, 600]] });
    // world 2's interval's top at +ln 2 exactly: the table at 2 x 100 x lo; just inside and just past
    const tIn = 2 * 100 * lo * (1 - 1e-9), tOut = 2 * 100 * lo * (1 + 1e-9);
    { const r = at(tIn), x = items(r.R, r.P, r.S)['1']; REACHED['1'].add(x.outcome); cases.push(['world 2\'s interval\'s top just inside +ln 2: 1 HELD', x.outcome, 'HELD']); EDGES.push('an interval\'s end at the HELD line'); }
    { const r = at(tOut), x = items(r.R, r.P, r.S)['1']; cases.push(['world 2\'s interval\'s top just past +ln 2: 1 INCONCLUSIVE', x.outcome, 'INCONCLUSIVE']); }
    const fIn = 3 * 100 * hi * (1 + 1e-9), fOut = 3 * 100 * hi * (1 - 1e-9);
    { const r = at(fIn), x = items(r.R, r.P, r.S)['1']; cases.push(['world 2\'s interval\'s foot just at or past +ln 3: 1 FALSIFIED (over)', `${x.outcome} ${x.side}`, 'FALSIFIED over']); }
    { const r = at(fOut), x = items(r.R, r.P, r.S)['1']; cases.push(['world 2\'s interval\'s foot just short of +ln 3: 1 INCONCLUSIVE', x.outcome, 'INCONCLUSIVE']); } }
  { const r = mk({ ao: [[0.5, 200], [9, 120], [0.1, 600]] }), x = items(r.R, r.P, r.S)['1']; cases.push(['over in world 1 and under in world 2: FALSIFIED, both sides named', `${x.outcome} ${x.side}`, 'FALSIFIED over and under']); }
  { const x = lnRead(1.5, 600, NP); cases.push(['ln(table / runs) at the table equal to the runs is 0, its interval about it', `${x.m} ${x.lo < 0 && x.hi > 0}`, '0 true']); }
  outc('4', {}, 'HELD', 'ARS at its runs: 4 HELD');
  outc('4', { ars: [[0.5, 200], [1.5, 120], [1.5, 600]] }, 'FALSIFIED', 'ARS world 1 at five times its runs: 4 FALSIFIED');
  outc('4', { ars: [[0.5, 200], [0.3, 120], [2.8, 600]] }, 'INCONCLUSIVE', 'ARS world 2 at 1.9 times its runs: 4 INCONCLUSIVE');
  outc('4', { ao: [[0.5, 200], [9, 120], [1.5, 600]] }, 'HELD', 'AO falsified, ARS at its runs (each item reads its own job): 4 HELD');
  // item 2 (se of a mean of 4,000 paths at spread 1: 1/sqrt(4000) = 0.0158)
  outc('2', {}, 'HELD', 'GB 0 in both worlds: 2 HELD');
  outc('2', { gb: [-1.5, 0, 0] }, 'FALSIFIED', 'GB -1.5 in world 0: 2 FALSIFIED (under)');
  outc('2', { gb: [0, 1.5, 0] }, 'FALSIFIED', 'GB +1.5 in world 1: 2 FALSIFIED (over)');
  outc('2', { gb: [0.7, 0, 0] }, 'INCONCLUSIVE', 'GB +0.7 in world 0: 2 INCONCLUSIVE');
  outc('2', { gb: [-0.7, 0, 0] }, 'INCONCLUSIVE', 'GB -0.7 in world 0: 2 INCONCLUSIVE');
  outc('2', { gb: [0, 0, -3] }, 'HELD', 'GB -3 in world 2 only (not read): 2 HELD');
  const hw = zFor(0.025) * Math.sqrt(N / (N - 1)) / Math.sqrt(N);
  outc('2', { gb: [0.5 - hw - 1e-6, 0, 0] }, 'HELD', 'the interval\'s top just inside +0.5: 2 HELD');
  outc('2', { gb: [0.5 - hw + 1e-6, 0, 0] }, 'INCONCLUSIVE', 'the interval\'s top just past +0.5: 2 INCONCLUSIVE');
  outc('2', { gb: [-1 - hw - 1e-6, 0, 0] }, 'FALSIFIED', 'the interval\'s top just below -1.0: 2 FALSIFIED');
  outc('2', { gb: [0.3, 0, 0], s: 0 }, 'HELD', 'GB +0.3 with no spread: 2 HELD'); EDGES.push('a world with no spread');
  // item 3 (BO alive on 2,000 of 4,000: margin 0.5 points)
  outc('3', {}, 'HELD', 'A6 equal to BO on every path: 3 HELD'); EDGES.push('no discordant path');
  outc('3', { lose: [400, 0, 0] }, 'FALSIFIED', 'A6 loses 400 paths in world 0: 3 FALSIFIED');
  outc('3', { lose: [0, 25, 0], gain: [0, 10, 0] }, 'INCONCLUSIVE', 'A6 loses 25 and saves 10 in world 1: 3 INCONCLUSIVE');
  outc('3', { lose: [0, 15, 0], gain: [0, 3, 0] }, 'HELD', 'A6 loses 15 and saves 3 in world 1: 3 HELD');
  outc('3', { lose: [0, 0, 400] }, 'HELD', 'A6 loses 400 in world 2 only (not read): 3 HELD');
  { const r = mk({ lose: [3, 0, 0] }); cases.push(['the paired counts: lost 3 saved 0 of 4,000, BO alive 2,000', JSON.stringify(paired(r.S('A6', 0), r.S('BO', 0))), JSON.stringify({ lost: 3, saved: 0, both: 1997, N: 4000, bAlive: 2000 })]); }
  // the luck adjustment: y = 2 + 0.5 z0 - 0.3 z1 + a small spread, on shocks of mean not 0: the intercept 2 recovered
  { let st = 7; const rnd = () => { st = (st * 1103515245 + 12345) % 2147483648; return st / 2147483648; };
    const X = Array.from({ length: 2000 }, () => [rnd() * 2 - 0.8, rnd() * 2 - 1.2]), y = X.map(([a, b], i) => 2 + 0.5 * a - 0.3 * b + (i % 2 ? 1e-3 : -1e-3));
    const r = luckAdjusted(y, X); cases.push(['the luck adjustment recovers a known intercept (2) from shocks with a non-zero mean', f4(r.m), '2.0000']); }
  { let L = [], err = null; const r = mk(); try { L = report(r.R, r.P, r.S); } catch (e) { err = e.message; } cases.push(['the read prints four items, an OUTCOME of four and four REALISED lines, end to end', err || `${['1.', '2.', '3.', '4.'].every(p => L.some(l => l.startsWith(p)))} ${(L.find(l => l.startsWith('OUTCOME: ')) || '').split(',').length} ${L.filter(l => l.startsWith('REALISED item ')).length}`, 'true 4 4']); }
  // the gate, on synthetic logs as the audits print them
  const pad = ''.padEnd(16);
  const ranOf = (arm, o) => `bridgeRead reader bridgeStep exact readerSplit ${o.split || ARMF[arm].readerSplit} readerBlend null readerRef ${o.ref || ARMF[arm].readerRef} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts 60 grid total60x6x6 shareNodes ${o.nodes || 'none'} floor ${ARMF[arm].floor} line 0.5`;
  const aoLog = (arm, o = {}) => {
    const Lb = LABELS[arm], npw = o.npw || NPW, ad = arm !== 'CO', bits = 'aaaaaaaaaaaaaaaa';
    const L = ['stamp: code c0 audit a0 prediction p0 sha s0', `AO: the candidate's own unit, ${o.headNpw || npw} paths a world (P ten times that where marked), wealth points divided by 1 (seed ${o.seed || 7002}); 3 jobs; part 0/3`];
    L.push(`S364             case | job ${Lb} | points 60 | lambda 0.0223606797749979`, `${pad} solve CAND ${Lb}: table 1.8 secs 3400`, `${pad} ran CAND ${Lb}: ${ranOf(arm, o)}`, `${pad} checks ${Lb}: armTook 1/1`);
    if (ad) L.push(`${pad} adaptive ${Lb}: moves 24 nonMono ${o.nonMono || 0} lattice ${o.lattice || '160x41'}x3 nz 128 last year 7 secs 300.0`, `${pad} checks ${Lb}: adaptTook ${o.adapt !== undefined ? o.adapt : 1}/1`);
    L.push(`${pad} pair ${Lb}: P ai ${o.p || 12} level 0.8 tiers 0,0; D ai 14 level 0.8 tiers 2,2`, `${pad} checks ${Lb}: pairTook ${o.pairTook !== undefined ? o.pairTook : 1}/1`, `${pad} openings ${Lb}: OWN ai 12 level 0.8 tiers 0,0`);
    for (let k = 0; k < 3; k++) L.push(`${pad} tables ${Lb} ${k} z 0 weight 0.3: P 1.5 D 1.1 OWN 1.5`, `${pad} probe ${Lb} ${k} P: reads 9 pr 1e-3 plain 1.5 deletion 0.1 residual 1.4 | sup w 0.1 p 0.6 S 60 c 1 R 0 | clip w 0 p 0 S 0 c 0 R 0 | copy w 0.9 p 0.01 S 1.5 c 1 R 1.4`);
    for (let k = 0; k < 3; k++) L.push(`${pad} sim ${Lb} ${k} P ai 12: 60/${(o.pn || npw * PMULT[arm])} bits ${bits}`, `${pad} sim ${Lb} ${k} D ai 14: 20/${npw} bits ${bits}`);
    L.push(`${pad} checks ${Lb}: forceIdentity ${o.fi !== undefined ? o.fi : 1000}/1000 secs 100`);
    if (ad) { for (let k = 0; k < 3; k++) for (let b = 0; b < (o.bins || 4); b++) L.push(`${pad} tail ${Lb} ${k} ${b}: records 90 states 25 years 1,2 p 1.0e-3 | simulated 1.0e-3 ln 0.0 (-0.1 to 0.1) ok | engine 1.0e-3 ln 0.0 (-0.3 to 0.3) ok`); if (!o.noTail) L.push(`${pad} refTail ${Lb}: cells 12 off 0; engine off 0; 100000 runs a state simulated, 1000 in the engine, secs 200`); }
    L.push(`${pad} file ${Lb}: S364-${arm}-P60S6Q5.json.gz`, ...(o.noDone ? [] : [`${pad} done ${Lb}`]));
    return L.join('\n');
  };
  const a6Log = (o = {}) => {
    const Lb = LABELS.A6, npw = NPW, bits = 'aaaaaaaaaaaaaaaa';
    const L = ['stamp: code c0 audit a0 prediction p0 sha s0', `AN: the candidate's own unit, ${npw} paths a world, wealth points divided by 1 (seed 7002); 1 jobs; part 0/1`];
    L.push(`S360             case | job ${Lb} | points 60 | lambda 0.0223606797749979`, `${pad} solve CAND ${Lb}: table 43 secs 3000`, `${pad} ran CAND ${Lb}: ${ranOf('A6', o)}`, `${pad} checks ${Lb}: armTook 1/1`);
    L.push(`${pad} adaptive ${Lb}: moves 24 nonMono 0 lattice 160x41x3 nz 128 last year 7 secs 300.0`, `${pad} checks ${Lb}: adaptTook 1/1`, `${pad} openings ${Lb}: OWN ai 12 level 0.8 tiers 0,0`, `${pad} bridge ${Lb}: reader years 1,2,3,4,5,6,7`);
    for (let k = 0; k < 3; k++) L.push(`${pad} tables ${Lb} ${k} z 0 weight 0.3: OWN 40 READ 40`, `${pad} sim ${Lb} ${k} OWN ai 12: ${npw / 2}/${npw} bridge ${npw / 2} bits ${bits} ${bits}`, `${pad} ledger ${Lb} ${k}: ${[...KEYS, 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'].map(x => `${x} 0.1`).join(' ')}`, `${pad} qf ${Lb} ${k}: paths 1000 QF 0.01`);
    L.push(`${pad} checks ${Lb}: refTook ${o.ref1 !== undefined ? o.ref1 : 33}/33 (p above its simulation in 7 of 33 cells)`, `${pad} checks ${Lb}: ownTook ${3 * npw}/${3 * npw} identity ${o.id !== undefined ? o.id : (o.idN || 3 * npw)}/${o.idN || 3 * npw} qfTook 9/9 layerTook 9/9 secs 100`);
    L.push(`${pad} file ${Lb}: S360-A6-P60S6Q5.json.gz`, `${pad} done ${Lb}`);
    return L.join('\n');
  };
  const all = (o = {}) => [...S364.map(a => parse(aoLog(a, o[a] || {}))).flat(), ...parse(a6Log(o.A6 || {})), ...(o.extra || [])];
  const refuses = (what, o, opt = {}) => cases.push([`the gate refuses ${what}`, gate(all(o), opt).length > 0, true]);
  cases.push(['the gate passes the four jobs as registered', gate(all()).join('; '), '']);
  refuses('a job run twice', { extra: parse(aoLog('AO')) });
  refuses('a job of another test', { extra: [{ ...parse(aoLog('CO'))[0], label: 'BASE/P60S6Q5' }] });
  cases.push(['the gate refuses A6 missing', gate(S364.map(a => parse(aoLog(a))).flat()).length > 0, true]);
  refuses('AO with no done line', { AO: { noDone: true } });
  refuses('AO at another seed', { AO: { seed: 7003 } });
  refuses('AO at another path count', { AO: { npw: 2000 } });
  refuses('a header naming another path count (the runs right)', { CO: { headNpw: 2000 } });
  refuses('pairTook failed on CO', { CO: { pairTook: 0 } });
  refuses('A6\'s identity held on another count of paths', { A6: { idN: 3 * 2000 } });
  refuses('AO run under the order reference (the arm plant)', { AO: { ref: 'order' } });
  refuses('ARS without its RS split', { ARS: { split: 'null' } });
  refuses('CO under the adaptive reference', { CO: { ref: 'adaptive' } });
  refuses('A6 on share nodes', { A6: { nodes: '0,0.2,0.4,0.6,0.8,1' } });
  refuses('AO\'s reference on another lattice', { AO: { lattice: '40x11' } });
  refuses('AO\'s last year not monotone', { AO: { nonMono: 2 } });
  refuses('adaptTook failed on ARS', { ARS: { adapt: 0 } });
  refuses('P on 4,000 paths on AO (not ten times)', { AO: { pn: NPW } });
  refuses('another forced pair on CO (the pair plant)', { CO: { p: 11 } });
  refuses('forceIdentity short on CO (the force plant)', { CO: { fi: 999 } });
  refuses('AO\'s tail check short of a p-decade', { AO: { bins: 3 } });
  refuses('AO\'s tail check with no summary', { AO: { noTail: true } });
  refuses('A6\'s refTook short', { A6: { ref1: 32 } });
  refuses('A6\'s identity short', { A6: { id: 3 * NPW - 1 } });
  { const js = all(), b64 = a => Buffer.from(a.buffer).toString('base64'), per = {};
    for (let k = 0; k < 3; k++) for (const x of [...KEYS, 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7']) per[`${x}${k}`] = b64(new Float64Array(NPW));
    const sh = sha16(Buffer.from('x', 'base64')), fix = js.map(j => ({ ...j, sims: Object.fromEntries(Object.entries(j.sims).map(([k, s]) => [k, { ...s, bits: sh, ...(s.bitsB ? { bitsB: sh } : {}) }])) }));
    const fileOf = j => ({ stamp: j.stamp, NPW, per, paths: { meta: 'x', Q: 'x' }, bits: Object.fromEntries(Object.keys(j.sims).flatMap(k => [[k, 'x'], [`${k}b`, 'x']])) });
    const files = Object.fromEntries(fix.map(j => [j.file, fileOf(j)]));
    cases.push(['the gate passes files that are the logs\'', gate(fix, { files }).join('; '), '']);
    cases.push(['the gate refuses a missing file', gate(fix, { files: { ...files, 'S364-AO-P60S6Q5.json.gz': undefined } }).length > 0, true]);
    cases.push(['the gate refuses a file stamped by other code', gate(fix, { files: { ...files, 'S364-CO-P60S6Q5.json.gz': { ...files['S364-CO-P60S6Q5.json.gz'], stamp: { code: 'c9' } } } }).length > 0, true]);
    cases.push(['the gate refuses a file whose bits are not the log\'s', gate(js, { files }).length > 0, true]);
    cases.push(['the gate refuses A6\'s file short of one world\'s GB', gate(fix, { files: { ...files, 'S360-A6-P60S6Q5.json.gz': { ...files['S360-A6-P60S6Q5.json.gz'], per: { ...per, GB1: b64(new Float64Array(5)) } } } }).length > 0, true]); }
  const bad = cases.filter(([, got, want]) => got !== want);
  for (const [what, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'BAD '} ${what}: ${JSON.stringify(got)}`);
  if (bad.length) { console.log(`PLANTED CHECK FAILED (${bad.length})`); process.exit(1); }
  const short = ITEMS.filter(i => REACHED[i].size < 3);
  if (short.length) { console.log(`PLANTED CHECK FAILED: items not planted to all three outcomes: ${short.map(i => `${i} (${[...REACHED[i]].join(', ')})`).join('; ')}`); process.exit(1); }
  if (EDGES.length < 2) { console.log('PLANTED CHECK FAILED: fewer than two edges'); process.exit(1); }
  return cases.length;
}

const dec = x => { const b = Buffer.from(x, 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
// QF by bridge year (O161), from a NODE-AX-ledger file's bridge records: per world, the mean over its first NQ paths of each
// year's QF terms, in points, with its standard error across paths
export function qfByYear(f, k) {
  const mb = Buffer.from(f.paths.meta, 'base64'), meta = new Int32Array(mb.buffer.slice(mb.byteOffset, mb.byteOffset + mb.length));
  const qb = Buffer.from(f.paths.Q, 'base64'), Q = new Float32Array(qb.buffer.slice(qb.byteOffset, qb.byteOffset + qb.length));
  const NQ = Math.min(f.NPW, f.nqf), out = {};
  for (const t of f.bridge) out[t] = new Float64Array(NQ);
  for (let r = 0; r < Q.length; r++) { const w = meta[7 * r], i = meta[7 * r + 1], t = meta[7 * r + 2]; if (w === k && i < NQ && out[t] && Number.isFinite(Q[r])) out[t][i] += 100 * Q[r]; }
  return Object.fromEntries(Object.entries(out).map(([t, a]) => [t, meanOf(Array.from(a), 1)]));
}
export function luckT(f, k, paths) {
  const T = dec(f.per[`T${k}`]), yrs = [0, ...f.bridge];
  return luckAdjusted(T, T.map((_, i) => yrs.map(t => paths[i][t])));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (const i of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagao'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  // the control: NODE-AX's BO, behind NODE-AX's own gate, its file the one recorded
  const AX = join(HERE, 'results', 'diagnodeax'), axf = join(AX, BO_FILE);
  let boFile = null;
  if (!PRE) {
    const red = spawnSync('node', [join(HERE, 'reduce-nodeax.mjs'), AX], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) bad.push('NODE-AX\'s files did not pass NODE-AX\'s gate');
    if (!existsSync(axf) || sha16(readFileSync(axf)) !== NODEAX_BO_SHA) bad.push(`NODE-AX's BO file is not the one recorded (${NODEAX_BO_SHA})`);
    else boFile = JSON.parse(gunzipSync(readFileSync(axf)).toString());
    if (boFile && boFile.NPW !== npwA) bad.push('NODE-AX\'s BO is not on the same paths');
  }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(Object.entries(LABELS).map(([a, l]) => [a, jobs.find(x => x.label === l)]));
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - AO, ARS, CO and A6 once and done at the registered settings (${npwA} paths a world, P at ten times on AO and ARS, scale ${scaleA}, seed ${SEED}); each job's reference and split in its solve's meta, the candidate's settings otherwise; every self-check in full; the pair P ai ${PAIR[0]}, D ai ${PAIR[1]}; the tail check's cells printed; the files the logs'${PRE ? '' : `; NODE-AX's BO behind NODE-AX's gate (${NODEAX_BO_SHA})`}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const bitsOf = (f, nm) => Buffer.from(f.bits[nm], 'base64');
  const R = (arm, k) => { const j = J[arm], s = j.sims[`P${k}`]; return [j.tables[k].P, s.ok, s.n]; };
  const P = (arm, x, k) => dec((arm === 'A6' ? files[J.A6.file] : boFile).per[`${x}${k}`]);
  const S = (arm, k) => (arm === 'A6' ? bitsOf(files[J.A6.file], `OWN${k}`) : bitsOf(boFile, `OWN${k}`));
  console.log('\nAO: the adaptive reference out of sample on S364 (AO, ARS; CO the order control) and at six shares on S360 (A6 against NODE-AX\'s BO) (predictions/diag-ao.md)');
  for (const a of ['AO', 'ARS', 'A6']) { const x = J[a].adaptive; console.log(`  ${a}'s reference: ${x.moves} floor moves, lattice ${x.lattice} by ${x.ng} gain nodes, ${x.nz} draws, last bridge year ${x.TL}, built in ${x.secs} s; solve ${J[a].solve.secs} s`); }
  for (const L of report(R, P, S)) console.log(L);
  console.log('\nREPORTED');
  // S364's tables and runs (no survival item on S364: 7u-F's STOP)
  for (const a of S364) for (let k = 0; k < 3; k++) {
    const j = J[a], t = j.tables[k], cell = nm => { const s = j.sims[`${nm}${k}`]; return s ? `${nm} table ${f4(t[nm])} runs ${s.ok}/${s.n} ln ${iv(lnRead(t[nm], s.ok, s.n, 0.05))}` : ''; };
    console.log(`  ${a} world ${k}: ${['P', 'D', 'OWN'].map(cell).filter(Boolean).join('; ')}${j.own.ai === PAIR[0] ? ' (its own opening P)' : j.own.ai === PAIR[1] ? ' (its own opening D)' : ''}`);
  }
  // CO against NE-GRID C's S364 ORDER, and NE-GRID C's BASE beside, behind NE-GRID C's gate
  { const NG = join(HERE, 'results', 'diagnegridc'), red = spawnSync('node', [join(HERE, 'reduce-negrid-c.mjs'), NG], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) console.log('  NE-GRID C\'s files did not pass NE-GRID C\'s gate: CO not compared');
    else {
      const ng = readdirSync(NG).filter(f => /^case\d+\.txt$/.test(f)).flatMap(f => parse(readFileSync(join(NG, f), 'utf8'))).filter(x => x.id === 'S364');
      const ord = ng.find(x => x.label === 'ORDER/P60S6Q5'), bas = ng.find(x => x.label === 'BASE/P60S6Q5');
      for (let k = 0; k < 3; k++) {
        const same = ['P', 'D'].map(nm => `${nm} ${J.CO.sims[`${nm}${k}`].bits === ord.sims[`${nm}${k}`].bits ? 'same bits' : 'other bits'}, table ${f4(J.CO.tables[k][nm])} against ${f4(ord.tables[k][nm])}`).join('; ');
        console.log(`  CO world ${k} against NE-GRID C's ORDER (code ${ord.stamp.code}): ${same}`);
        console.log(`  NE-GRID C's BASE world ${k} (six shares): P table ${f4(bas.tables[k].P)} runs ${bas.sims[`P${k}`].ok}/${bas.sims[`P${k}`].n}; D table ${f4(bas.tables[k].D)} runs ${bas.sims[`D${k}`].ok}/${bas.sims[`D${k}`].n}`);
      }
    } }
  // the probe: corner status and R's share at the year-1 reads the year-0 score at P makes
  for (const a of S364) for (let k = 0; k < 3; k++) { const x = J[a].probe[k], st = nm => `${nm} ${f4(x[nm].w)} (p ${f4(x[nm].p)}, R ${f4(x[nm].R)})`; console.log(`  probe ${a} world ${k}: reads ${x.reads}; weight ${['sup', 'clip', 'copy'].map(st).join(', ')}; S ${f4(x.plain)} = deletion ${f4(x.deletion)} + residual ${f4(x.residual)} (R's share ${f4(x.plain > 0 ? x.residual / x.plain : NaN)})`); }
  // the tail check and the engine run
  for (const a of ['AO', 'ARS']) {
    const j = J[a]; console.log(`  tail ${a}: cells ${j.refTail.cells}, off ${j.refTail.off} simulated, ${j.refTail.engOff} in the engine (off: an interval wholly beyond ln 1.5)`);
    for (const x of j.tail) console.log(`    world ${x.k} p-decade ${x.bin}: records ${x.records} states ${x.states}${x.states ? ` years ${x.years} p ${x.p.toExponential(4)} | simulated ln ${f4(x.sim.ln)} (${f4(x.sim.lo)} to ${f4(x.sim.hi)})${x.sim.off ? ' off' : ''} | engine ln ${f4(x.eng.ln)} (${f4(x.eng.lo)} to ${f4(x.eng.hi)})${x.eng.off ? ' off' : ''}` : ''}`);
  }
  // the tier slice (O158): realised bridge outcome less p by year, the move's tiers and band
  for (const a of ['AO', 'ARS']) for (const x of J[a].tier) console.log(`  tier ${a} world ${x.k} year ${x.t} tiers ${x.tiers} ${x.band}: records ${x.n} paths ${x.paths} realised less p ${f4(x.d)} (se ${f4(x.se)})`);
  // A6's ledger beside BO's, its luck-adjusted T and QF by year
  const fA6 = files[J.A6.file], paths = pathsForSeed(Number(SEED), npwA, 60);
  for (let k = 0; k < 3; k++) {
    const a = x => meanOf(P('A6', x, k)), b = x => meanOf(P('BO', x, k)), d = meanOf(P('A6', 'GB', k).map((v, i) => v - P('BO', 'GB', k)[i]));
    console.log(`  A6 world ${k}: OWN less runs ${f4(a('B0').m - a('X').m)} = T ${f4(a('T').m)} + GB ${f4(a('GB').m)} + GA ${f4(a('GA').m)}; BO's GB ${iv(b('GB'))}; A6 less BO in GB ${iv(d)}; survival A6 ${f4(a('X').m)} BO ${f4(b('X').m)}`);
    console.log(`  A6 world ${k} by year (A6; BO): ${J.A6.bridge.map(t => `${t}: ${f4(a(`Y${t}`).m)}; ${f4(b(`Y${t}`).m)}`).join(' | ')}`);
    const la = luckT(fA6, k, paths), lb = luckT(boFile, k, paths);
    console.log(`  A6 world ${k}: T luck-adjusted (years 0 to ${J.A6.bridge[J.A6.bridge.length - 1]}'s shocks) ${f4(la.m)} (se ${f4(la.se)}); BO's ${f4(lb.m)} (se ${f4(lb.se)})`);
    const qa = qfByYear(fA6, k), qb = qfByYear(boFile, k);
    console.log(`  A6 world ${k} QF by year (A6; BO, se): ${Object.keys(qa).map(t => `${t}: ${f4(qa[t].m)} (${f4(qa[t].se)}); ${f4(qb[t].m)} (${f4(qb[t].se)})`).join(' | ')}`);
  }
  for (const r of J.A6.refcheck) console.log(`  A6 refcheck world ${r.k} bin ${r.bin}: ${r.text}`);
}
