/*
 * THE 7AK REDUCER: THE ATTRIBUTION TEST (predictions/diag-7ak.md; PLAN.md 7ak; the deep review after P, 29 Sep 23:31 UK).
 * Reads results/diag7ak/case*.txt (batch-7ak.sh: audit-7ak.mjs, one process a unit) beside P's records (results/diagP),
 * read through their own stamps.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7ak and P;
 *   - both units once and done, each with its solve, ran, joint and node lines, snap lines for years 1 to 7 and four level
 *     lines; the counts consistent (disagree = oneWay + reverse, deadCell <= disagree, every snap's agreements at most
 *     disagree - deadCell);
 *   - IDENTITY: each unit's solve is P's core:P solve (its table and its ran line but the path count), and its OPEN0 and TS+J
 *     traces are P's first NP paths at world 0's node, field by field (survived, tier, level, wealth) - so the snaps re-score
 *     P's own run.
 * THE ITEMS, by the registered rule, pooled over years 1 to 7 on bridge 4 (S194's reported beside; under P its OPEN0 paths
 * all leave in year 1, P's decision log):
 *   1. Dead cells: of the disagreements, the share at a dead cell (stored survival under 0.02). HELD (they carry it) at 0.5
 *      or more; FALSIFIED under 0.2; else INCONCLUSIVE.
 *   2. The reader: of the live-cell disagreements, the share the reader snap turns to the cell's move. HELD at 0.5 or
 *      more; FALSIFIED under 0.2; else INCONCLUSIVE.
 *   3. The pension-share axis a: the same for the a snap.
 *   4. Switching boundaries: at year 1, OPEN0 and TS+J on both units pooled, the table's survival less the realised on
 *      boundary cells against interior cells, (tb - rb) - (ti - ri) in points, its 95% interval from the realised shares'
 *      binomial variance (the table's averages fixed). HELD when the lower end is above 0.5; FALSIFIED when the upper end
 *      is below 0.5; else INCONCLUSIVE.
 * NOT SETTLED (whatever the items read) when the all-snap - the cell's own state - turns under 0.95 of the live-cell
 * disagreements to the cell's move: the attribution's premise (research/tests/snap-7ak.test.mjs) fails in the field.
 * Reported, not items: every snap's share by year; the W, b, gain and lump-bucket snaps; S194's lines; the level lines.
 *   node research/solver/reduce-7ak.mjs [dir] [dirP] > research/solver/results-7ak.txt
 *   node research/solver/reduce-7ak.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ak.md', PRED_P = 'research/solver/predictions/diag-p.md';
export const NP = 8000, YEARS = 7, CARRY = 0.5, NONE = 0.2, ALLMIN = 0.95, LEVEL_M = 0.5, Z95 = 1.959963984540054;
export const UNITS = [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02']];
export const SNAPS = ['W', 'a', 'b', 'gain', 'pcls', 'reader', 'all'];
export const labelOf = (A, w) => `${A}/TS+J/MP/30x5/W${w}`;

const CASEL = /^(\S.*?)\s+case \| unit (\S+) \|/;
export function parse(text) {
  const out = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), label: m[2], snap: {}, level: {}, done: false }; out.push(cur); continue; }
    if (!cur) continue;
    const L = cur.label.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    if ((m = new RegExp(`^\\s+solve ${L}: table (\\S+) secs`).exec(line))) cur.table = m[1];
    else if ((m = new RegExp(`^\\s+ran ${L}: (.*)$`).exec(line))) cur.ran = m[1];
    else if ((m = new RegExp(`^\\s+node ${L} 0 z \\S+: OPEN0 (\\S+) TS\\+J (\\S+) paths (\\d+)`).exec(line))) cur.node = { open0: +m[1], tsj: +m[2], paths: +m[3] };
    else if ((m = new RegExp(`^\\s+snap ${L} OPEN0 year (\\d+): held (\\d+) disagree (\\d+) oneWay (\\d+) reverse (\\d+) deadCell (\\d+) \\| (.*)$`).exec(line))) {
      const ag = {}; m[7].trim().split(/\s+/).forEach((x, i, a) => { if (i % 2 === 0) ag[x] = +a[i + 1]; });
      cur.snap[+m[1]] = { held: +m[2], dis: +m[3], oneWay: +m[4], reverse: +m[5], dead: +m[6], agree: ag };
    } else if ((m = new RegExp(`^\\s+level ${L} (OPEN0|TS\\+J) year 1 (boundary|interior): paths (\\d+) table (\\S+) realised (\\S+)$`).exec(line))) cur.level[`${m[1]} ${m[2]}`] = { n: +m[3], table: +m[4], realised: +m[5] };
    else if (line.trim() === `done ${cur.label}`) cur.done = true;
  }
  return out;
}
export const normRan = ran => (ran || '').replace(/(^| )paths \d+/, '$1paths X');

/* THE GATE. `refP(id, label)` P's core:P unit {table, ran}; `traces(id, A, w, rule)` [7ak's, P's] decoded or null */
export function gate(units, refP, traces, { np = NP } = {}) {
  const bad = [];
  for (const [id, A, w] of UNITS) { const k = units.filter(u => u.id === id && u.label === labelOf(A, w)).length; if (k !== 1) bad.push(`${id} ${labelOf(A, w)}: ${k} unit lines, not 1`); }
  for (const u of units) {
    const tag = `${u.id} ${u.label}`, reg = UNITS.find(([id, A, w]) => id === u.id && labelOf(A, w) === u.label);
    if (!reg) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.table === undefined || !u.ran || !u.node) { bad.push(`${tag}: a solve, ran or node line missing`); continue; }
    if (u.node.paths !== np) bad.push(`${tag}: node paths ${u.node.paths}, not ${np}`);
    const P = refP(u.id, u.label);
    if (!P) bad.push(`${tag}: no P core:P unit`);
    else { if (P.table !== u.table) bad.push(`${tag}: table ${u.table}, P's ${P.table}`); if (normRan(P.ran) !== normRan(u.ran)) bad.push(`${tag}: its ran line is not P's but for the path count`); }
    for (let t = 1; t <= YEARS; t++) {
      const S = u.snap[t];
      if (!S) { bad.push(`${tag}: no snap line for year ${t}`); continue; }
      if (S.dis !== S.oneWay + S.reverse || S.dead > S.dis || S.dis > S.held) bad.push(`${tag}: year ${t}'s counts inconsistent`);
      for (const k of SNAPS) if (!(S.agree[k] >= 0 && S.agree[k] <= S.dis - S.dead)) bad.push(`${tag}: year ${t}'s ${k} agreements ${S.agree[k]} outside 0 to ${S.dis - S.dead}`);
    }
    for (const r of ['OPEN0', 'TS+J']) for (const c of ['boundary', 'interior']) if (!u.level[`${r} ${c}`]) bad.push(`${tag}: no level line ${r} ${c}`);
    for (const rule of ['OPEN0', 'TS+J']) {
      const tp = traces(u.id, reg[1], reg[2], rule);
      if (!tp || !tp[0] || !tp[1]) { bad.push(`${tag}: ${rule}'s trace or P's missing`); continue; }
      const [a, p] = tp;
      if (a.N !== np || a.Y !== p.Y) { bad.push(`${tag}: ${rule}'s trace ${a.N} x ${a.Y}, P's ${p.N} x ${p.Y}`); continue; }
      for (const f of ['survived', 'tier', 'level', 'wealth']) {
        const n = f === 'survived' ? np : np * a.Y;
        for (let i = 0; i < n; i++) if (a[f][i] !== p[f][i]) { bad.push(`${tag}: ${rule}'s ${f} is not P's (first at ${i})`); break; }
      }
    }
  }
  return bad;
}

const tri = (x, held, fals) => (x >= held ? 'HELD' : x < fals ? 'FALSIFIED' : 'INCONCLUSIVE');
export function pool(u) { const o = { held: 0, dis: 0, dead: 0, agree: Object.fromEntries(SNAPS.map(k => [k, 0])) }; for (let t = 1; t <= YEARS; t++) { const S = u.snap[t]; o.held += S.held; o.dis += S.dis; o.dead += S.dead; for (const k of SNAPS) o.agree[k] += S.agree[k]; } o.live = o.dis - o.dead; return o; }
export function levelGap(units) {
  const c = { boundary: { n: 0, t: 0, ok: 0 }, interior: { n: 0, t: 0, ok: 0 } };
  for (const u of units) for (const r of ['OPEN0', 'TS+J']) for (const k of ['boundary', 'interior']) { const x = u.level[`${r} ${k}`]; c[k].n += x.n; c[k].t += x.n * x.table; c[k].ok += x.n * x.realised / 100; }
  const B = c.boundary, I = c.interior;
  if (!B.n || !I.n) return { d: NaN, lo: NaN, hi: NaN, B, I };
  const tb = B.t / B.n, ti = I.t / I.n, rb = 100 * B.ok / B.n, ri = 100 * I.ok / I.n;
  const se = Math.sqrt((rb * (100 - rb)) / B.n + (ri * (100 - ri)) / I.n), d = (tb - rb) - (ti - ri);
  return { d, lo: d - Z95 * se, hi: d + Z95 * se, B: { n: B.n, table: tb, realised: rb }, I: { n: I.n, table: ti, realised: ri } };
}
export function items(units) {
  const b4 = units.find(u => u.id === 'bridge 4'), p = pool(b4), share = k => (p.live ? p.agree[k] / p.live : NaN), lg = levelGap(units);
  const deadShare = p.dis ? p.dead / p.dis : NaN;
  return {
    pooled: p, allShare: share('all'), settled: p.live > 0 && share('all') >= ALLMIN,
    items: [
      { n: 1, x: deadShare, outcome: tri(deadShare, CARRY, NONE) },
      { n: 2, x: share('reader'), outcome: tri(share('reader'), CARRY, NONE) },
      { n: 3, x: share('a'), outcome: tri(share('a'), CARRY, NONE) },
      { n: 4, lg, outcome: lg.lo > LEVEL_M ? 'HELD' : lg.hi < LEVEL_M ? 'FALSIFIED' : 'INCONCLUSIVE' }]
  };
}
export function reading(units, out = console.log) {
  const R = items(units);
  out(`7AK: THE ATTRIBUTION TEST - under P, world 0's node, ${NP} of P's paths: OPEN0's forward-against-cell disagreements re-scored with one thing snapped to the nearest cell, and the year-1 table against realised survival by boundary and interior cells`);
  for (const u of units) {
    const p = pool(u);
    out(`\n${u.id} (${u.label}): held path-years ${p.held}, disagreements ${p.dis} (dead cells ${p.dead}, live ${p.live}); node survival OPEN0 ${u.node.open0.toFixed(4)} TS+J ${u.node.tsj.toFixed(4)}`);
    out(`  pooled, the share of live disagreements each snap turns to the cell's move: ${SNAPS.map(k => `${k} ${p.live ? (100 * p.agree[k] / p.live).toFixed(1) : '-'}%`).join(', ')}`);
    for (let t = 1; t <= YEARS; t++) { const S = u.snap[t], lv = S.dis - S.dead; out(`  year ${t}: held ${S.held} disagree ${S.dis} (one-way ${S.oneWay}, reverse ${S.reverse}, dead ${S.dead}) | ${SNAPS.map(k => `${k} ${lv ? (100 * S.agree[k] / lv).toFixed(0) : '-'}%`).join(' ')}`); }
    for (const r of ['OPEN0', 'TS+J']) for (const c of ['boundary', 'interior']) { const x = u.level[`${r} ${c}`]; out(`  year-1 ${r} ${c}: paths ${x.n}, table ${x.table.toFixed(2)} realised ${x.realised.toFixed(2)}`); }
  }
  const [i1, i2, i3, i4] = R.items;
  out(`\nITEM 1 (dead cells carry bridge 4's disagreement): ${(100 * i1.x).toFixed(1)}% of ${R.pooled.dis} at a dead cell (HELD at ${100 * CARRY}%, FALSIFIED under ${100 * NONE}%) -> ${i1.outcome}`);
  out(`ITEM 2 (the reader): ${(100 * i2.x).toFixed(1)}% of ${R.pooled.live} live disagreements turned by the reader snap -> ${i2.outcome}`);
  out(`ITEM 3 (the pension-share axis a): ${(100 * i3.x).toFixed(1)}% turned by the a snap -> ${i3.outcome}`);
  out(`ITEM 4 (switching boundaries, both units, OPEN0 and TS+J, year 1): boundary ${i4.lg.B.n} paths, table ${i4.lg.B.table.toFixed(2)} realised ${i4.lg.B.realised.toFixed(2)}; interior ${i4.lg.I.n}, table ${i4.lg.I.table.toFixed(2)} realised ${i4.lg.I.realised.toFixed(2)}; the boundary's excess mispricing ${i4.lg.d.toFixed(2)} points (${i4.lg.lo.toFixed(2)} to ${i4.lg.hi.toFixed(2)}; HELD above ${LEVEL_M}) -> ${i4.outcome}`);
  out(`THE PREMISE: the all-snap turns ${(100 * R.allShare).toFixed(1)}% of the live disagreements (at least ${100 * ALLMIN}% needed) -> ${R.settled ? 'holds' : 'FAILS: NOT SETTLED'}`);
  out(`\nOUTCOME: ${R.settled ? R.items.map(i => `${i.n} ${i.outcome}`).join(', ') : 'NOT SETTLED'}`);
  return R;
}

/* PLANTED */
function built(o = {}) {
  const ran = 'mix 3 pts 30 seed 7002 paths 8000 grid total30x6x6 lambda x tierState 0/0,1/1,2/2 bequestWeight 0 finalIntegral true bridgeRead reader switchMargin 0 switchCharge 0.001';
  const us = UNITS.map(([id, A, w]) => {
    const snap = {}; for (let t = 1; t <= YEARS; t++) { const dis = 100, dead = o.dead ? 60 : 10, live = dis - dead; snap[t] = { held: 1000, dis, oneWay: 70, reverse: 30, dead, agree: { W: 5, a: o.aCarry ? 60 : 5, b: 5, gain: 0, pcls: 0, reader: o.readerCarry ? Math.min(live, 60) : o.readerHalf ? live / 2 : 10, all: o.allLow ? 50 : live } }; }
    if (o.badCount && id === 'bridge 4') snap[3].oneWay = 71;
    const lv = (tb, rb) => ({ n: 4000, table: tb, realised: rb });
    return { id, label: labelOf(A, w), table: '99.7135', ran: o.ranOff && id === 'S194' ? ran.replace('minPot', 'minPot') + ' extra' : ran, node: { open0: 97.7, tsj: 98.2, paths: o.paths && id === 'S194' ? 16000 : NP }, snap, done: !(o.noDone && id === 'bridge 4'),
      level: { 'OPEN0 boundary': lv(o.bnd ? 99 : 98, 97), 'OPEN0 interior': lv(98, 97), 'TS+J boundary': lv(o.bnd ? 99 : 98, 97), 'TS+J interior': lv(98, 97) } };
  });
  const refP = (id, label) => (o.noRef ? null : { table: o.table && id === 'bridge 4' ? '99.7000' : '99.7135', ran: ran.replace('paths 8000', 'paths 16000') });
  const tr = (N, v) => ({ N, Y: 3, survived: new Uint8Array(N).fill(1), tier: new Uint8Array(N * 3).fill(v), level: new Uint8Array(N * 3).fill(100), wealth: new Float32Array(N * 3).fill(1) });
  const traces = (id, A, w, rule) => [tr(NP, 0), (() => { const p = tr(2 * NP, 0); if (o.traceOff && rule === 'OPEN0' && id === 'S194') p.tier[5] = 10; return p; })()];
  return { us, refP, traces };
}
function planted() {
  const cases = [];
  const refused = o => { const b = built(o); return String(gate(b.us, b.refP, b.traces).length > 0); };
  { const b = built(); const bad = gate(b.us, b.refP, b.traces); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o] of [['a unit not done', { noDone: true }], ['a table not P\'s', { table: true }], ['a ran line not P\'s', { ranOff: true }], ['no P unit', { noRef: true }], ['other node paths', { paths: true }], ['inconsistent counts', { badCount: true }], ['a trace not P\'s', { traceOff: true }]])
    cases.push([`the gate refuses ${nm}`, refused(o), 'true']);
  const out = o => { const R = items(built(o).us); return R.settled ? R.items.map(i => i.outcome).join(' ') : 'NOT SETTLED'; };
  cases.push(['the base: dead 10%, reader 11%, a 6%, no boundary excess', out({}), 'FALSIFIED FALSIFIED FALSIFIED FALSIFIED']);
  cases.push(['dead cells 60%: item 1 HELD', out({ dead: true }).split(' ')[0], 'HELD']);
  cases.push(['the reader snap turns 60 of 90: item 2 HELD', out({ readerCarry: true }).split(' ')[1], 'HELD']);
  cases.push(['the reader snap turns exactly half (45 of 90): item 2 HELD at the edge', out({ readerHalf: true }).split(' ')[1], 'HELD']);
  cases.push(['the a snap turns 60 of 90: item 3 HELD', out({ aCarry: true }).split(' ')[2], 'HELD']);
  cases.push(['the boundary mispriced by a point more: item 4 HELD', out({ bnd: true }).split(' ')[3], 'HELD']);
  cases.push(['the all-snap under 0.95: NOT SETTLED', out({ allLow: true }), 'NOT SETTLED']);
  cases.push(['parse reads a snap line', JSON.stringify(parse('bridge 4         case | unit READER/TS+J/MP/30x5/W0 | lambda x\n                 snap READER/TS+J/MP/30x5/W0 OPEN0 year 2: held 50 disagree 9 oneWay 6 reverse 3 deadCell 2 | W 1 a 2 b 0 gain 0 pcls 0 reader 5 all 7\n')[0].snap[2]), '{"held":50,"dis":9,"oneWay":6,"reverse":3,"dead":2,"agree":{"W":1,"a":2,"b":0,"gain":0,"pcls":0,"reader":5,"all":7}}']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
const b64 = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
export function readTrace(f) { if (!existsSync(f)) return null; const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); return { N: j.N, Y: j.Y, survived: b64(j.survived, Uint8Array), tier: b64(j.tier, Uint8Array), level: b64(j.level, Uint8Array), wealth: b64(j.wealth, Float32Array) }; }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ak'), DIRP = args[1] || join(HERE, 'results', 'diagP');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, A, w]) => !units.some(u => u.id === id && u.label === labelOf(A, w) && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const logsP = logsOf(DIRP); requireFairLogs(logsP, PRED_P);
  const refP = (id, label) => {
    const t = Object.values(logsP).find(x => new RegExp(`^${id.replace(/ /g, ' ')}\\s+case \\| job core:P ${label.split('/')[0]}/30x5/W${label.split('/W')[1]} `, 'm').test(x));
    if (!t) return null;
    const L = label.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), tb = new RegExp(`^\\s+solve ${L}: table (\\S+) secs`, 'm').exec(t), rn = new RegExp(`^\\s+ran ${L}: (.*)$`, 'm').exec(t);
    return tb && rn ? { table: tb[1], ran: rn[1] } : null;
  };
  const traces = (id, A, w, rule) => {
    const base = `${id.replace(/ /g, '_')}-${A.toLowerCase()}`, r = rule.toLowerCase().replace(/\+/g, '_');
    return [readTrace(join(DIR, `${base}-${r}-world0@w${w}.json.gz`)), readTrace(join(DIRP, `${base}-mp-${r}-world0@w${w}.json.gz`))];
  };
  const bad = gate(units, refP, traces);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - both units P's own solve (table, ran line) and their OPEN0 and TS+J runs P's first ${NP} node paths field by field; the counts consistent (planted ${np})\n`);
  reading(units);
}
