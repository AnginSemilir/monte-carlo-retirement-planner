/*
 * AOR'S REDUCER (PLAN.md AREF, its AOR step; predictions/diag-aor.md; the deep review after AO, deep-review-log.md 16 Oct
 * 05:36 UK). Three jobs at six shares, the candidate's own unit, seed 7002, into results/diagaor: AOP and ARS on S364
 * (audit-aor.mjs: AO re-solved with the read decomposed at P; the RS split under the adaptive reference) and A6RS on S360
 * (audit-an.mjs with AN_JOB=A6RS: A6 under the RS split), read against AO's and A6's saved files (results/diagao, behind
 * AO's gate) on the same paths.
 * THE GATE: each job once and done at the registered settings (4,000 paths a world, 60 points, seed 7002, the reference's
 *   lattice 160 by 41 with 128 draws), stamped as launched, the fair-test gate called on each audit's logs (two audits under
 *   one code, AO's correction); its solve's meta reads the adaptive reference and the job's split; every self-check in full
 *   (armTook, adaptTook, pairTook, forceIdentity and decompTook on S364; AN's on A6RS); the pair P ai 12, D ai 14; five reads
 *   a world in the decomposition; AOP's tables AO's to the printed digit and its P and D runs AO's first 4,000 bit for bit;
 *   the files whole and the logs'; AO's files behind AO's gate, its and A6's files the ones recorded.
 * THE ITEMS:
 *   1 (primary): the deletion term at P in world 0 (sum q pr c, AOP's decomposition) against AO's runs there (P on 40,000
 *     paths), ln(deletion / runs), the exact interval on the count at 1 - 0.05: HELD inside [-ln 2, +ln 2] (O169-COPY: the read
 *     without R is near its runs); FALSIFIED wholly at or beyond +ln 3 (over: the read without R still over-reads, CONT,
 *     POST or PTAIL) or -ln 3 (under), the side named; otherwise INCONCLUSIVE.
 *   2: ARS's read at P in world 0 against its runs, ln(table / runs), as item 1: HELD inside ln 2; FALSIFIED wholly past ln 3,
 *     over (the RS split leaves the over-read) or under (O165's pessimistic tail unmasked). The runs are AO's 40,000 where
 *     ARS's P runs on the first 4,000 are AO's bit for bit in that world, else ARS's own 4,000 (declared, printed).
 *   3: ARS's read at P in worlds 1 and 2, AO's item 1's rule (two worlds, 1 - 0.05 / 2), the runs as item 2's.
 *   4: no material harm to A6RS's runs against A6's on the same paths, worlds 0 and 1 (AO's item 3's rule).
 * REPORTED: AOP's and ARS's reads node by node (q, pr, c, R, v) and their deletion and residual; ARS's tables beside AOP's;
 *   the bit matches; AOP's tail check with the engine run at the record's and at the typical sheltered cash (O165); A6RS's
 *   GB beside A6's and BO's (O151's decomposition under a reference free of ORDER's gap), its ledger by year, luck-adjusted
 *   T and QF by year, its runs against BO's.
 *   node research/solver/reduce-aor.mjs [dir] [paths a world] [scale] [--preflight] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';
import { mcnemarHarmP, holm, outcome, marginFor } from './stats.mjs';
import { pathsForSeed } from '../engine.mjs';
import { parse as parseAO, meanOf, paired, lnRead, readItem, luckT, qfByYear, sha16, q } from './reduce-ao.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-aor.md';
export const SEED = '7002', NPW = 4000, NQF = 1000, FIMAX = 1000, NP_AO = 40000, LATTICE = '160x41', NZ = 128;
export const IN = Math.log(2), OUT = Math.log(3);
export const AO_SHA = 'eac3b290764d8332', A6_SHA = '334f25ede52dea67', AO_FILE = 'S364-AO-P60S6Q5.json.gz', A6_FILE = 'S360-A6-P60S6Q5.json.gz';
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const S364 = ['AOP', 'ARS'], LABELS = Object.freeze({ AOP: 'AOP/P60S6Q5', ARS: 'ARS/P60S6Q5', A6RS: 'A6RS/P60S6Q5' });
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S364|S360)\s+case \| job ((AOP|ARS|A6RS)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^(AOR|AN): .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { kind: hd[1], npw: Number(hd[2]), scale: Number(hd[3]), seed: hd[4] } : null, checks: {}, tables: [], sims: {}, reads: [], decomp: [], tail: [], refTail: null,
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
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): P (\\S+) D (\\S+) OWN (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), P: Number(m[4]), D: Number(m[5]), OWN: Number(m[6]), text: `${m[4]} ${m[5]} ${m[6]}` };
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^read ${e} (\\d) (\\d): q (\\S+) pr (\\S+) cc (\\S+) rr (\\S+) v (\\S+)$`).exec(l))) (j.reads[Number(m[1])] = j.reads[Number(m[1])] || [])[Number(m[2])] = { q: Number(m[3]), pr: Number(m[4]), cc: Number(m[5]), rr: Number(m[6]), v: Number(m[7]) };
    else if ((m = new RegExp(`^decomp ${e} (\\d): reads (\\d+) table (\\S+) sum (\\S+) deletion (\\S+) residual (\\S+) (ok|OFF)$`).exec(l))) j.decomp[Number(m[1])] = { reads: Number(m[2]), table: Number(m[3]), sum: Number(m[4]), deletion: Number(m[5]), residual: Number(m[6]), ok: m[7] === 'ok' };
    else if ((m = new RegExp(`^sim ${e} (\\d) (P|D|OWN) ai (\\d+): (\\d+)\\/(\\d+) bits (\\S+)$`).exec(l))) j.sims[`${m[2]}${m[1]}`] = { ai: Number(m[3]), ok: Number(m[4]), n: Number(m[5]), bits: m[6] };
    else if ((m = new RegExp(`^sim ${e} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^tail ${e} (\\d) (\\d): records (\\d+) states (\\d+)(.*)$`).exec(l))) {
      const part = nm => { const x = new RegExp(`${nm} (\\S+) ln (\\S+) \\((\\S+) to (\\S+)\\) (ok|off)`).exec(m[5]); return x ? { r: Number(x[1]), ln: Number(x[2]), lo: Number(x[3]), hi: Number(x[4]), off: x[5] === 'off' } : null; };
      const p = /years (\S+) p (\S+)/.exec(m[5]);
      j.tail.push({ k: Number(m[1]), bin: Number(m[2]), records: Number(m[3]), states: Number(m[4]), years: p ? p[1] : '', p: p ? Number(p[2]) : NaN, sim: part('simulated'), eng: part('engine'), typ: part('typical') });
    }
    else if ((m = new RegExp(`^refTail ${e}: cells (\\d+) off (\\d+); engine off (\\d+); typical off (\\d+);`).exec(l))) j.refTail = { cells: Number(m[1]), off: Number(m[2]), engOff: Number(m[3]), typOff: Number(m[4]) };
    else if ((m = new RegExp(`^ledger ${e} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^qf ${e} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
    else if ((m = new RegExp(`^refcheck ${e} (\\d) (\\d): (.*)$`).exec(l))) j.refcheck.push({ k: Number(m[1]), bin: Number(m[2]), text: m[3] });
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

// the stamps by audit (AO's correction): exactly two audits under one code, one holding only the S364 jobs, the other A6RS
export function stampGroups(logs) {
  const bad = [], groups = {}, codes = new Set();
  for (const [f, t] of Object.entries(logs)) {
    const m = /^stamp: code (\S+) audit (\S+)/m.exec(t);
    if (!m) { bad.push(`${f}: no stamp`); continue; }
    codes.add(m[1]); (groups[m[2]] = groups[m[2]] || {})[f] = t;
  }
  if (codes.size !== 1) bad.push(`the logs carry ${codes.size} versions of the code`);
  const kinds = Object.values(groups).map(g => { const ls = Object.values(g).flatMap(parse).map(j => j.label); return ls.length && ls.every(l => l === LABELS.A6RS) ? 'A6RS' : ls.length && ls.every(l => S364.some(a => LABELS[a] === l)) ? 'S364' : 'mixed'; });
  if (kinds.length !== 2 || !kinds.includes('A6RS') || !kinds.includes('S364')) bad.push(`the audits do not split the jobs as registered (${kinds.join(', ') || 'none'})`);
  return { bad, groups: Object.values(groups) };
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3', shareNodes: 'none', readerRef: 'adaptive' };
const ARMF = Object.freeze({ AOP: { readerSplit: 'null', floor: '205000' }, ARS: { readerSplit: 'rs', floor: '205000' }, A6RS: { readerSplit: 'rs', floor: '5000' } });
/* ao: AO's parsed job (its tables) and AO's file (its bits), for AOP's identity; null skips it (the preflight) */
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null, ao = null } = {}) {
  const bad = [], pts = Math.max(4, Math.round(60 / scale)), fi = Math.min(npw, FIMAX);
  for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(`a job that is not AOR's: ${x.label}`);
  for (const [arm, label] of Object.entries(LABELS)) {
    const js = jobs.filter(x => x.label === label);
    if (js.length !== 1) { bad.push(`${arm}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0];
    if (!j.done) bad.push(`${arm}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${arm}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${arm}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${arm}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, ...ARMF[arm], pts: String(pts), grid: `total${pts}x6x6` })) if (field(ran, f) !== v) bad.push(`${arm}: ${f} is ${field(ran, f)}, not ${v}`);
    const need = arm === 'A6RS' ? ['armTook', 'adaptTook', 'refTook', 'ownTook', 'identity', 'qfTook', 'layerTook'] : ['armTook', 'adaptTook', 'pairTook', 'forceIdentity', 'decompTook'];
    for (const c of need) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || (['armTook', 'adaptTook', 'pairTook'].includes(c) && x[1] !== 1)) bad.push(`${arm}: ${c} did not pass in full`); }
    if (!j.adaptive || j.adaptive.lattice !== LATTICE || j.adaptive.nz !== NZ || j.adaptive.nonMono !== 0 || !(j.adaptive.moves > 0)) bad.push(`${arm}: the reference was not built at the registered lattice (${LATTICE}, ${NZ} draws) with a monotone last year`);
    if (!j.own) bad.push(`${arm}: no openings line`);
    if (!j.solve) bad.push(`${arm}: no solve line`);
    if (arm === 'A6RS') {
      if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push('A6RS: the identity was not held on every path of three worlds');
      if (!j.bridge || !j.bridge.length) bad.push('A6RS: no bridge years printed');
      for (let w = 0; w < 3; w++) {
        const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push(`A6RS: no OWN run of ${npw} paths at its opening in world ${w}`);
        if (!j.ledger[w] || [...KEYS, ...(j.bridge || []).map(t => `Y${t}`)].some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`A6RS: world ${w}'s ledger line is missing or short`);
        if (!j.qf[w] || j.qf[w].n !== Math.min(npw, NQF)) bad.push(`A6RS: world ${w}'s QF line is missing`);
      }
    } else {
      if (j.checks.forceIdentity && j.checks.forceIdentity[1] !== fi) bad.push(`${arm}: forceIdentity not on ${fi} paths`);
      if (!j.pair || j.pair[0] !== 12 || j.pair[1] !== 14) bad.push(`${arm}: the pair is not the registered one (P ai 12, D ai 14)`);
      for (let w = 0; w < 3; w++) {
        if (!j.tables[w] || !['P', 'D', 'OWN'].every(x => Number.isFinite(j.tables[w][x]))) bad.push(`${arm}: world ${w}'s tables are missing`);
        for (const nm of ['P', 'D']) { const s = j.sims[`${nm}${w}`]; if (!s || s.n !== npw) bad.push(`${arm}: no ${nm} run of ${npw} paths in world ${w}`); }
        const d = j.decomp[w], r = j.reads[w];
        if (!d || !d.ok || d.reads !== 5 || !r || r.filter(Boolean).length !== 5) bad.push(`${arm}: world ${w}'s decomposition is missing, short or off`);
      }
      if (arm === 'AOP') {
        if (!j.refTail) bad.push('AOP: no tail check summary');
        for (let w = 0; w < 3; w++) for (let b = 0; b < 4; b++) if (!j.tail.some(x => x.k === w && x.bin === b)) bad.push(`AOP: the tail check's cell ${w} ${b} is missing`);
        if (ao) for (let w = 0; w < 3; w++) {
          if (!ao.job.tables[w] || !j.tables[w] || ['P', 'D', 'OWN'].some(x => ao.job.tables[w][x] !== j.tables[w][x])) bad.push(`AOP: world ${w}'s tables are not AO's to the printed digit`);
          for (const nm of ['P', 'D']) { const a = files && j.file && files[j.file] && files[j.file].bits[`${nm}${w}`], b = ao.file.bits[`${nm}${w}`]; if (!a || !b || !Buffer.from(a, 'base64').equals(Buffer.from(b, 'base64').subarray(0, npw))) bad.push(`AOP: world ${w}'s ${nm} runs are not AO's first ${npw} bit for bit`); }
        }
      }
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) { bad.push(`${arm}: its file ${j.file} is missing`); continue; }
      if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${arm}: its file is stamped by other code`);
      if (f.NPW !== npw) bad.push(`${arm}: its file is not on ${npw} paths a world`);
      for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], ...(s.bitsB ? [[`${nm}b`, s.bitsB]] : [])]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${arm}: its file's ${b} bits are not the log's`); }
      if (arm === 'A6RS') for (let w = 0; w < 3; w++) for (const x of KEYS) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`A6RS: its file's ${x}${w} paths are not ${npw}`); }
    }
  }
  return bad;
}

// the runs ARS's items read in world k: AO's 40,000 where ARS's first 4,000 are AO's bit for bit, else ARS's own
export function runsFor(arsBits, aoBits, k) {
  const a = arsBits(k), b = aoBits(k), match = a.length <= b.length && a.equals(b.subarray(0, a.length));
  const src = match ? b : a; let c = 0; for (const x of src) c += x;
  return { c, N: src.length, match };
}
/* D0: the deletion term in world 0, points; RUN(k): { c, N } the runs at P; TAB(k): ARS's table at P; S(arm, k): the OWN bits */
export function items(D0, AO0, RUN, TAB, S) {
  const out = {};
  const one = (x, alpha) => { const r = lnRead(x[0], x[1], x[2], alpha); return r; };
  const judge = c => (c.lo >= -IN && c.hi <= IN ? 'HELD' : c.lo >= OUT || c.hi <= -OUT ? 'FALSIFIED' : 'INCONCLUSIVE');
  const side = c => (c.lo >= OUT ? 'over' : c.hi <= -OUT ? 'under' : null);
  const c1 = { k: 0, ...one([D0, AO0.c, AO0.N], 0.05) };
  out['1'] = { outcome: judge(c1), side: side(c1), cell: c1 };
  const r0 = RUN(0), c2 = { k: 0, match: r0.match, ...one([TAB(0), r0.c, r0.N], 0.05) };
  out['2'] = { outcome: judge(c2), side: side(c2), cell: c2 };
  out['3'] = readItem([1, 2].map(k => { const r = RUN(k); return { k, match: r.match, ...lnRead(TAB(k), r.c, r.N) }; }));
  const pr = [0, 1].map(k => ({ k, ...paired(S('A6RS', k), S('A6', k)) }));
  const ph = holm(pr.map(x => mcnemarHarmP(x.lost, x.saved)));
  const oc = pr.map((x, i) => ({ ...x, margin: marginFor(100 * x.bAlive / x.N), ...outcome({ b: x.lost, c: x.saved, N: x.N, margin: marginFor(100 * x.bAlive / x.N), pHolm: ph[i] }) }));
  out['4'] = { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED' : oc.every(x => x.outcome === 'no material harm') ? 'HELD' : 'INCONCLUSIVE', cells: oc };
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), iv = x => `${f4(x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
const lnLine = x => `world ${x.k}: table ${f4(x.table)} runs ${x.c}/${x.N} (${f4(x.runs)})${x.match === undefined ? '' : x.match ? ' (AO\'s runs: the first 4,000 bit for bit)' : ' (ARS\'s own runs)'}, ln ${iv(x)}`;
export function report(D0, AO0, RUN, TAB, S) {
  const it = items(D0, AO0, RUN, TAB, S), L = [];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. the deletion term at P in world 0 against AO's runs, ln(deletion / runs) inside ln 2 (FALSIFIED at a whole interval past ln 3 either way): ${it['1'].outcome}${it['1'].side ? ` (${it['1'].side})` : ''}`);
  L.push(`     ${lnLine(it['1'].cell).replace('table', 'deletion')}`);
  L.push(`2. ARS's read at P in world 0 against its runs, as item 1: ${it['2'].outcome}${it['2'].side ? ` (${it['2'].side})` : ''}`, `     ${lnLine(it['2'].cell)}`);
  L.push(`3. ARS's read at P in worlds 1 and 2 inside ln 2 (FALSIFIED at a whole interval past ln 3): ${it['3'].outcome}${it['3'].side ? ` (${it['3'].side})` : ''}`, `     ${it['3'].cells.map(lnLine).join('; ')}`);
  L.push(`4. no material harm to A6RS's runs against A6's on the same paths, worlds 0 and 1: ${it['4'].outcome}`);
  L.push(`     ${it['4'].cells.map(x => `world ${x.k}: lost ${x.lost} saved ${x.saved} of ${x.N}, change ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)}) at margin ${x.margin}: ${x.outcome}`).join('; ')}`);
  L.push(`OUTCOME: ${['1', '2', '3', '4'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  for (const [i, x] of [['1', it['1'].cell.m], ['2', it['2'].cell.m], ['3', it['3'].cells[0].m], ['4', it['4'].cells[0].d]]) L.push(`REALISED item ${i}: ${f4(x)}`);
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['1', '2', '3', '4'], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
function planted() {
  const cases = [], N = 4000;
  const bitsOf = (alive, n = N, lose = 0, gain = 0) => { const b = Buffer.alloc(n); for (let i = 0; i < alive; i++) b[i] = 1; for (let i = 0; i < lose; i++) b[i] = 0; for (let i = 0; i < gain; i++) b[alive + i] = 1; return b; };
  // AO's runs: 37 of 40,000 in world 0 (0.0925 points), 164 and 696 in worlds 1 and 2; ARS's first 4,000 AO's unless o.diff
  const mk = (o = {}) => {
    const aoB = [37, 164, 696].map(c => { const b = Buffer.alloc(NP_AO); for (let i = 0; i < c; i++) b[i * 97 % NP_AO] = 1; return b; });
    const arsB = [0, 1, 2].map(k => { const b = Buffer.from(aoB[k].subarray(0, N)); if (o.diff && o.diff[k]) b[N - 1] = b[N - 1] ? 0 : 1; return b; });
    const tab = o.tab || [0.0925, 0.41, 1.74], A6 = [0, 1].map(() => bitsOf(2000)), RS = [0, 1].map(k => bitsOf(2000, N, o.lose ? o.lose[k] : 0, o.gain ? o.gain[k] : 0));
    return [o.d0 !== undefined ? o.d0 : 0.0925, { c: 37, N: NP_AO }, k => runsFor(j => arsB[j], j => aoB[j], k), k => tab[k], (arm, k) => (arm === 'A6RS' ? RS[k] : A6[k])];
  };
  const outc = (i, o, want, what) => { const got = items(...mk(o))[i].outcome; REACHED[i].add(got); cases.push([what, got, want]); };
  // item 1 (37 runs of 40,000: ln interval at 95% about +-0.33)
  outc('1', {}, 'HELD', 'the deletion term at its runs: 1 HELD');
  outc('1', { d0: 1.0 }, 'FALSIFIED', 'the deletion term at eleven times its runs: 1 FALSIFIED (over)');
  outc('1', { d0: 0.005 }, 'FALSIFIED', 'the deletion term at a twentieth of its runs: 1 FALSIFIED (under)');
  outc('1', { d0: 0.2 }, 'INCONCLUSIVE', 'the deletion term at about twice its runs: 1 INCONCLUSIVE');
  outc('1', { d0: 0.1603 }, 'INCONCLUSIVE', 'the deletion term at ln 0.55 over its runs, its 95% interval across ln 2: 1 INCONCLUSIVE'); EDGES.push('an interval across the HELD line');
  outc('1', { d0: 0 }, 'FALSIFIED', 'a deletion term of zero: 1 FALSIFIED (under)'); EDGES.push('a deletion term of zero');
  { const x = items(...mk({ d0: 1.0 }))['1']; cases.push(['item 1 names its side', `${x.outcome} ${x.side}`, 'FALSIFIED over']); }
  // item 2: ARS's world 0, AO's runs when the bits match, ARS's own 4,000 otherwise
  outc('2', {}, 'HELD', 'ARS world 0 at its runs (bits AO\'s): 2 HELD');
  outc('2', { tab: [1.0, 0.41, 1.74] }, 'FALSIFIED', 'ARS world 0 at eleven times its runs: 2 FALSIFIED (over)');
  outc('2', { tab: [0.005, 0.41, 1.74] }, 'FALSIFIED', 'ARS world 0 at a twentieth of its runs: 2 FALSIFIED (under)');
  outc('2', { tab: [0.2, 0.41, 1.74] }, 'INCONCLUSIVE', 'ARS world 0 at twice its runs: 2 INCONCLUSIVE');
  { const r = runsFor(k => Buffer.from([1, 0, 0]), k => Buffer.from([1, 0, 0, 1, 0]), 0); cases.push(['the runs: ARS\'s first bits AO\'s - AO\'s whole count', `${r.c} ${r.N} ${r.match}`, '2 5 true']); }
  { const r = runsFor(k => Buffer.from([0, 0, 1]), k => Buffer.from([1, 0, 0, 1, 0]), 0); cases.push(['the runs: ARS\'s first bits not AO\'s - ARS\'s own count', `${r.c} ${r.N} ${r.match}`, '1 3 false']); EDGES.push('ARS\'s runs not AO\'s'); }
  { const x = items(...mk({ diff: [1, 0, 0] }))['2'].cell; cases.push(['a world whose first 4,000 differ by one path reads ARS\'s own 4,000', `${x.N} ${x.match}`, '4000 false']); }
  // item 3
  outc('3', {}, 'HELD', 'ARS worlds 1 and 2 at their runs: 3 HELD');
  outc('3', { tab: [0.0925, 2.0, 1.74] }, 'FALSIFIED', 'ARS world 1 at five times its runs: 3 FALSIFIED');
  outc('3', { tab: [0.0925, 0.85, 1.74] }, 'INCONCLUSIVE', 'ARS world 1 at about twice its runs: 3 INCONCLUSIVE');
  outc('3', { tab: [5, 0.41, 1.74] }, 'HELD', 'ARS world 0 far over (not item 3\'s): 3 HELD');
  // item 4 (A6 alive on 2,000 of 4,000: margin 0.5)
  outc('4', {}, 'HELD', 'A6RS equal to A6 on every path: 4 HELD'); EDGES.push('no discordant path');
  outc('4', { lose: [400, 0] }, 'FALSIFIED', 'A6RS loses 400 paths in world 0: 4 FALSIFIED');
  outc('4', { lose: [0, 25], gain: [0, 10] }, 'INCONCLUSIVE', 'A6RS loses 25 and saves 10 in world 1: 4 INCONCLUSIVE');
  outc('4', { lose: [0, 15], gain: [0, 3] }, 'HELD', 'A6RS loses 15 and saves 3 in world 1: 4 HELD');
  { let L = [], err = null; try { L = report(...mk()); } catch (e) { err = e.message; } cases.push(['the read prints four items, an OUTCOME of four and four REALISED lines', err || `${['1.', '2.', '3.', '4.'].every(p => L.some(l => l.startsWith(p)))} ${(L.find(l => l.startsWith('OUTCOME: ')) || '').split(',').length} ${L.filter(l => l.startsWith('REALISED item ')).length}`, 'true 4 4']); }
  // the gate, on synthetic logs as the audits print them
  const pad = ''.padEnd(16), bits = 'aaaaaaaaaaaaaaaa';
  const ranOf = (arm, o) => `bridgeRead reader bridgeStep exact readerSplit ${o.split || ARMF[arm].readerSplit} readerBlend null readerRef ${o.ref || 'adaptive'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts 60 grid total60x6x6 shareNodes none floor ${ARMF[arm].floor} line 0.5`;
  const aorLog = (arm, o = {}) => {
    const Lb = LABELS[arm];
    const L = ['stamp: code c0 audit aa prediction p0 sha s0', `AOR: the candidate's own unit, ${o.headNpw || o.npw || NPW} paths a world, wealth points divided by 1 (seed 7002); 2 jobs; part 0/2`];
    L.push(`S364             case | job ${Lb} | points 60 | lambda 0.0223606797749979`, `${pad} solve CAND ${Lb}: table 1.28 secs 3000`, `${pad} ran CAND ${Lb}: ${ranOf(arm, o)}`, `${pad} checks ${Lb}: armTook 1/1`);
    L.push(`${pad} adaptive ${Lb}: moves 24 nonMono 0 lattice 160x41x3 nz 128 last year 7 secs 300.0`, `${pad} checks ${Lb}: adaptTook 1/1`, `${pad} pair ${Lb}: P ai 12 level 0.8 tiers 0,0; D ai 14 level 0.8 tiers 2,2`, `${pad} checks ${Lb}: pairTook 1/1`, `${pad} openings ${Lb}: OWN ai 12 level 0.8 tiers 0,0`);
    for (let k = 0; k < 3; k++) L.push(`${pad} tables ${Lb} ${k} z 0 weight 0.3: P ${o.tabP || o.onlyP || '1.839500'} D 1.870800 OWN ${o.tabP || '1.839500'}`);
    for (let k = 0; k < 3; k++) { for (let n = 0; n < (o.nreads || 5); n++) L.push(`${pad} read ${Lb} ${k} ${n}: q 0.200000 pr 1.0e-3 cc 0.900000 rr 0.100000 v 0.190000`); L.push(`${pad} decomp ${Lb} ${k}: reads ${o.nreads || 5} table 1.8 sum 1.8 deletion 0.9 residual 0.9 ${o.off ? 'OFF' : 'ok'}`); }
    L.push(`${pad} checks ${Lb}: decompTook ${o.dec !== undefined ? o.dec : 3}/3`);
    for (let k = 0; k < 3; k++) L.push(`${pad} sim ${Lb} ${k} P ai 12: 4/${o.npw || NPW} bits ${bits}`, `${pad} sim ${Lb} ${k} D ai 14: 0/${o.npw || NPW} bits ${bits}`);
    L.push(`${pad} checks ${Lb}: forceIdentity ${o.fi !== undefined ? o.fi : 1000}/1000 secs 100`);
    if (arm === 'AOP') { for (let k = 0; k < 3; k++) for (let b = 0; b < (o.bins || 4); b++) L.push(`${pad} tail ${Lb} ${k} ${b}: records 90 states 25 years 1,2 p 1.0e-3 | simulated 1.0e-3 ln 0.0 (-0.1 to 0.1) ok | engine 1.0e-3 ln 0.0 (-0.3 to 0.3) ok | typical 1.0e-3 ln 0.0 (-0.3 to 0.3) ok`); L.push(`${pad} refTail ${Lb}: cells 12 off 0; engine off 0; typical off 0; 100000 runs a state simulated, 1000 in the engine twice, secs 200`); }
    L.push(`${pad} file ${Lb}: S364-${arm}-P60S6Q5.json.gz`, ...(o.noDone ? [] : [`${pad} done ${Lb}`]));
    return L.join('\n');
  };
  const a6Log = (o = {}) => {
    const Lb = LABELS.A6RS;
    const L = ['stamp: code c0 audit bb prediction p0 sha s0', `AN: the candidate's own unit, ${NPW} paths a world, wealth points divided by 1 (seed 7002); 1 jobs; part 0/1`];
    L.push(`S360             case | job ${Lb} | points 60 | lambda 0.0223606797749979`, `${pad} solve CAND ${Lb}: table 49 secs 3000`, `${pad} ran CAND ${Lb}: ${ranOf('A6RS', o)}`, `${pad} checks ${Lb}: armTook 1/1`);
    L.push(`${pad} adaptive ${Lb}: moves 24 nonMono 0 lattice 160x41x3 nz 128 last year 7 secs 300.0`, `${pad} checks ${Lb}: adaptTook 1/1`, `${pad} openings ${Lb}: OWN ai 12 level 0.8 tiers 0,0`, `${pad} bridge ${Lb}: reader years 1,2,3,4,5,6,7`);
    for (let k = 0; k < 3; k++) L.push(`${pad} tables ${Lb} ${k} z 0 weight 0.3: OWN 40 READ 40`, `${pad} sim ${Lb} ${k} OWN ai 12: 2000/${NPW} bridge 2000 bits ${bits} ${bits}`, `${pad} ledger ${Lb} ${k}: ${[...KEYS, 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'].map(x => `${x} 0.1`).join(' ')}`, `${pad} qf ${Lb} ${k}: paths 1000 QF 0.01`);
    L.push(`${pad} checks ${Lb}: refTook ${o.ref1 !== undefined ? o.ref1 : 33}/33 (p above its simulation in 7 of 33 cells)`, `${pad} checks ${Lb}: ownTook 12000/12000 identity 12000/12000 qfTook 9/9 layerTook 9/9 secs 100`);
    L.push(`${pad} file ${Lb}: S360-A6RS-P60S6Q5.json.gz`, `${pad} done ${Lb}`);
    return L.join('\n');
  };
  const all = (o = {}) => [...S364.map(a => parse(aorLog(a, o[a] || {}))).flat(), ...parse(a6Log(o.A6RS || {})), ...(o.extra || [])];
  const refuses = (what, o, opt = {}) => cases.push([`the gate refuses ${what}`, gate(all(o), opt).length > 0, true]);
  cases.push(['the gate passes the three jobs as registered', gate(all()).join('; '), '']);
  refuses('a job run twice', { extra: parse(aorLog('AOP')) });
  refuses('a job of another test', { extra: [{ ...parse(aorLog('ARS'))[0], label: 'AO/P60S6Q5' }] });
  refuses('a header naming another path count (the runs right)', { ARS: { headNpw: 2000 } });
  refuses('AOP with no done line', { AOP: { noDone: true } });
  refuses('AOP at another path count', { AOP: { npw: 2000 } });
  refuses('ARS without the RS split', { ARS: { split: 'null' } });
  refuses('AOP under the RS split', { AOP: { split: 'rs' } });
  refuses('A6RS without the RS split', { A6RS: { split: 'null' } });
  refuses('AOP under the order reference (the arm plant)', { AOP: { ref: 'order' } });
  refuses('a decomposition off in a world', { ARS: { off: true } });
  refuses('a decomposition of four reads', { AOP: { nreads: 4 } });
  refuses('decompTook short (the weights and rs plants)', { AOP: { dec: 2 } });
  refuses('forceIdentity short (the force plant)', { ARS: { fi: 999 } });
  refuses('AOP\'s tail check short of a p-decade', { AOP: { bins: 3 } });
  refuses('A6RS\'s refTook short', { A6RS: { ref1: 32 } });
  { const js = all(), aoJob = { tables: [0, 1, 2].map(() => ({ P: 1.8395, D: 1.8708, OWN: 1.8395 })) };
    cases.push(['the gate passes AOP\'s tables equal to AO\'s', gate(js, { ao: { job: aoJob, file: { bits: {} } } }).filter(x => /tables are not AO/.test(x)).length, 0]);
    cases.push(['the gate refuses AOP\'s tables a digit off AO\'s', gate(all({ AOP: { tabP: '1.839501' } }), { ao: { job: aoJob, file: { bits: {} } } }).some(x => /tables are not AO/.test(x)), true]);
    cases.push(['the gate refuses AOP\'s P table alone a digit off AO\'s', gate(all({ AOP: { onlyP: '1.839501' } }), { ao: { job: aoJob, file: { bits: {} } } }).some(x => /tables are not AO/.test(x)), true]);
    const zb = n => Buffer.alloc(n).toString('base64'), aoBits = {}, aopBits = {};
    for (let k = 0; k < 3; k++) { aoBits[`P${k}`] = zb(NP_AO); aoBits[`D${k}`] = zb(N); aopBits[`P${k}`] = zb(N); aopBits[`D${k}`] = zb(N); }
    const ones = Buffer.alloc(N); ones[7] = 1;
    const runsOff = n => gate(js, { ao: { job: aoJob, file: { bits: aoBits } }, files: { 'S364-AOP-P60S6Q5.json.gz': { stamp: js[0].stamp, NPW, bits: { ...aopBits, ...(n ? { P0: ones.toString('base64') } : {}) } } } }).some(x => /not AO's first/.test(x));
    cases.push(['the gate passes AOP\'s runs equal to AO\'s first 4,000', runsOff(false), false]);
    cases.push(['the gate refuses AOP\'s runs a path off AO\'s first 4,000', runsOff(true), true]); }
  // the stamps by audit
  { const two = { 'case0.txt': aorLog('AOP'), 'case1.txt': aorLog('ARS'), 'case2.txt': a6Log() };
    cases.push(['the stamps by audit pass two audits split as registered under one code', `${stampGroups(two).bad.join('; ')} ${stampGroups(two).groups.length}`, ' 2']);
    cases.push(['the stamps by audit refuse two versions of the code', stampGroups({ ...two, 'case2.txt': a6Log().replace('code c0', 'code c9') }).bad.length > 0, true]);
    cases.push(['the stamps by audit refuse A6RS under the S364 jobs\' audit', stampGroups({ ...two, 'case2.txt': a6Log().replace('audit bb', 'audit aa') }).bad.length > 0, true]);
    cases.push(['the stamps by audit refuse a third audit', stampGroups({ ...two, 'case1.txt': aorLog('ARS').replace('audit aa', 'audit cc') }).bad.length > 0, true]); }
  const bad = cases.filter(([, got, want]) => got !== want);
  for (const [what, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'BAD '} ${what}: ${JSON.stringify(got)}`);
  if (bad.length) { console.log(`PLANTED CHECK FAILED (${bad.length})`); process.exit(1); }
  const short = ITEMS.filter(i => REACHED[i].size < 3);
  if (short.length) { console.log(`PLANTED CHECK FAILED: items not planted to all three outcomes: ${short.map(i => `${i} (${[...REACHED[i]].join(', ')})`).join('; ')}`); process.exit(1); }
  if (EDGES.length < 2) { console.log('PLANTED CHECK FAILED: fewer than two edges'); process.exit(1); }
  return cases.length;
}

const dec = x => { const b = Buffer.from(x, 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (const i of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagaor'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  const sg = stampGroups(logs);
  if (sg.bad.length) { console.log(`FAIR-TEST GATE: FAILED (stamps by audit)\n  ${sg.bad.join('\n  ')}`); process.exit(1); }
  if (!PRE) for (const g of sg.groups) requireFairLogs(g, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  // the controls: AO's and A6's saved files, behind AO's gate, the files the ones recorded
  const AOD = join(HERE, 'results', 'diagao'), bad0 = [];
  let ao = null, a6File = null;
  if (!PRE) {
    const red = spawnSync('node', [join(HERE, 'reduce-ao.mjs'), AOD], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) bad0.push('AO\'s files did not pass AO\'s gate');
    const fa = join(AOD, AO_FILE), f6 = join(AOD, A6_FILE);
    if (!existsSync(fa) || sha16(readFileSync(fa)) !== AO_SHA) bad0.push(`AO's file is not the one recorded (${AO_SHA})`);
    if (!existsSync(f6) || sha16(readFileSync(f6)) !== A6_SHA) bad0.push(`A6's file is not the one recorded (${A6_SHA})`);
    if (!bad0.length) {
      const aoJob = readdirSync(AOD).filter(f => /^case\d+\.txt$/.test(f)).flatMap(f => parseAO(readFileSync(join(AOD, f), 'utf8'))).find(x => x.label === 'AO/P60S6Q5');
      ao = { job: aoJob, file: JSON.parse(gunzipSync(readFileSync(fa)).toString()) }; a6File = JSON.parse(gunzipSync(readFileSync(f6)).toString());
    }
  }
  const bad = [...bad0, ...gate(jobs, { npw: npwA, scale: scaleA, files, ao })];
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(Object.entries(LABELS).map(([a, l]) => [a, jobs.find(x => x.label === l)]));
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - AOP, ARS and A6RS once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); the fair-test gate on each audit's logs under one code; the adaptive reference and each job's split in its solve's meta; every self-check in full, the decomposition summing to the table in every world${PRE ? '' : `; AOP's tables AO's to the digit and its runs AO's first ${npwA} bit for bit; AO's files behind AO's gate (${AO_SHA}, ${A6_SHA})`}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const bitsF = (f, nm) => Buffer.from(f.bits[nm], 'base64');
  const D0 = J.AOP.decomp[0].deletion, aoP = k => bitsF(ao.file, `P${k}`), AO0 = (() => { const b = aoP(0); let c = 0; for (const x of b) c += x; return { c, N: b.length }; })();
  const RUN = k => runsFor(j => bitsF(files[J.ARS.file], `P${j}`), aoP, k), TAB = k => J.ARS.tables[k].P;
  const S = (arm, k) => (arm === 'A6RS' ? bitsF(files[J.A6RS.file], `OWN${k}`) : bitsF(a6File, `OWN${k}`));
  console.log('\nAOR: the read at P decomposed (AOP), the RS split under the adaptive reference on S364 (ARS) and on S360 (A6RS against A6) (predictions/diag-aor.md)');
  for (const L of report(D0, AO0, RUN, TAB, S)) console.log(L);
  console.log('\nREPORTED');
  for (const a of S364) for (let k = 0; k < 3; k++) {
    const d = J[a].decomp[k];
    console.log(`  ${a} world ${k}: table ${f4(d.table)} = deletion ${f4(d.deletion)} + residual ${f4(d.residual)} (R's part ${f4(d.sum > 0 ? d.residual / d.sum : NaN)}); P runs ${J[a].sims[`P${k}`].ok}/${J[a].sims[`P${k}`].n}${a === 'ARS' ? `, its first ${npwA} ${RUN(k).match ? 'AO\'s bit for bit' : 'not AO\'s'}` : ''}`);
    console.log(`    reads: ${J[a].reads[k].map((x, n) => `${n}: q ${x.q} pr ${x.pr.toExponential(3)} c ${x.cc} R ${x.rr} v ${x.v}`).join(' | ')}`);
  }
  for (let k = 0; k < 3; k++) console.log(`  ARS against AOP world ${k}: P table ${f4(J.ARS.tables[k].P)} against ${f4(J.AOP.tables[k].P)}; D ${f4(J.ARS.tables[k].D)} against ${f4(J.AOP.tables[k].D)}`);
  { const t = J.AOP.refTail; console.log(`  tail AOP: cells ${t.cells}, off ${t.off} simulated, ${t.engOff} in the engine at the record's sheltered cash, ${t.typOff} at the typical (off: an interval wholly beyond ln 1.5)`);
    for (const x of J.AOP.tail) console.log(`    world ${x.k} p-decade ${x.bin}: records ${x.records} states ${x.states}${x.states ? ` p ${x.p.toExponential(4)} | simulated ln ${f4(x.sim.ln)} | engine ln ${f4(x.eng.ln)} (${f4(x.eng.lo)} to ${f4(x.eng.hi)}) | typical ln ${f4(x.typ.ln)} (${f4(x.typ.lo)} to ${f4(x.typ.hi)})` : ''}`); }
  // A6RS against A6 and BO (O151's decomposition under a reference free of ORDER's gap)
  const AX = join(HERE, 'results', 'diagnodeax'), bo = existsSync(join(AX, 'S360-BO-P60S6Q5.json.gz')) ? JSON.parse(gunzipSync(readFileSync(join(AX, 'S360-BO-P60S6Q5.json.gz'))).toString()) : null;
  const fR = files[J.A6RS.file], P6 = (f, x, k) => dec(f.per[`${x}${k}`]), paths = pathsForSeed(Number(SEED), npwA, 60);
  for (let k = 0; k < 3; k++) {
    const a = x => meanOf(P6(fR, x, k)), b = x => meanOf(P6(a6File, x, k)), d = meanOf(P6(fR, 'GB', k).map((v, i) => v - P6(a6File, 'GB', k)[i]));
    console.log(`  A6RS world ${k}: OWN less runs ${f4(a('B0').m - a('X').m)} = T ${f4(a('T').m)} + GB ${f4(a('GB').m)} + GA ${f4(a('GA').m)}; A6's GB ${iv(b('GB'))}; A6RS less A6 in GB ${iv(d)}; survival A6RS ${f4(a('X').m)} A6 ${f4(b('X').m)}${bo ? ` BO ${f4(meanOf(P6(bo, 'X', k)).m)}` : ''}`);
    console.log(`  A6RS world ${k} by year (A6RS; A6): ${J.A6RS.bridge.map(t => `${t}: ${f4(a(`Y${t}`).m)}; ${f4(b(`Y${t}`).m)}`).join(' | ')}`);
    const la = luckT(fR, k, paths); console.log(`  A6RS world ${k}: T luck-adjusted ${f4(la.m)} (se ${f4(la.se)})`);
    const qa = qfByYear(fR, k); console.log(`  A6RS world ${k} QF by year: ${Object.keys(qa).map(t => `${t}: ${f4(qa[t].m)} (${f4(qa[t].se)})`).join(' | ')}`);
    if (bo && k < 2) { const x = paired(bitsF(fR, `OWN${k}`), bitsF(bo, `OWN${k}`)); console.log(`  A6RS against BO world ${k}: lost ${x.lost} saved ${x.saved} of ${x.N}`); }
  }
  for (const r of J.A6RS.refcheck) console.log(`  A6RS refcheck world ${r.k} bin ${r.bin}: ${r.text}`);
}
