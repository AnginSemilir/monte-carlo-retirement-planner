/*
 * THE TIER TEST'S READ (audit-tiers.mjs; STATE.md D39; EXPLORATORY, seed 7002). After the stamps (fair-gate.mjs
 * requireFairLogs: every unit's log launched through run-from-snapshot.sh as a measurement, PREDICTION=none, one version of
 * the code and the files across them) and its own gate (every household in every
 * arm, one code and one audit stamp across the units and the stamp the files' own, one seed that is not held out, one path
 * count, a household's five units on one inputs hash, target and retirement year):
 *   - survival per arm, pooled over the households path by path (path i draws the same shocks for every household), and
 *     each difference with its 95% interval by path; the spending delivered beside it, as a share of APP's mean per household;
 *   - THE TIERS' SHARE of each solver's gain over the app's rules: (X less X without consent) / (X less APP), for SHIP (the
 *     deep review's test) and the candidate, its interval by the delta method over paths. Read against the deep review's
 *     lines: the interval wholly at or above a half, HALF OR MORE (the consent wording and its default carry weight; M21's
 *     check follows); wholly at or below a third, A THIRD OR LESS (consent is not load-bearing); else BETWEEN;
 *   - what a user who declines risk changes gets: CANDNC less APP and CANDNC less SHIPNC;
 *   - each arm's spend as a share of target by retired year (years 0 to 4, 5 to 9, 10 on; on paths not yet failed) and the
 *     retired years at the 80% floor and at 90% or below;
 *   - per household: survival in each arm and the two shares; runPolicy beside the engine (paths that differ).
 *   node research/solver/reduce-tiers.mjs [dir]       (default research/solver/results/tiers)
 *   node research/solver/reduce-tiers.mjs --planted   the gate and the read on synthetic units with known answers
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ARMS = ['APP', 'SHIP', 'SHIPNC', 'CAND', 'CANDNC'], HELD_OUT = [7003, 7014, 7018], Z = 1.959964, FLOOR = 80, NINETY = 90;
const TYPES = { survived: Uint8Array, delivered: Float32Array, unmet: Float32Array, estate: Float32Array, failYear: Int16Array, level: Uint8Array };
const decode = u => ({ ...u, main: Object.fromEntries(Object.entries(u.main).map(([k, v]) => { const b = Buffer.from(v, 'base64'); return [k, new TYPES[k](b.buffer, b.byteOffset, b.byteLength / TYPES[k].BYTES_PER_ELEMENT)]; })) });

/* the gate: the problems that stop the read */
export function gate(units, ids, filesAudit) {
  const P = [], by = {};
  for (const u of units) (by[u.id] ||= {})[u.arm] = u;
  for (const id of ids) for (const arm of ARMS) if (!by[id] || !by[id][arm]) P.push(`${id} ${arm}: missing`);
  const one = (k, f) => { const s = new Set(units.map(f)); if (s.size !== 1) P.push(`${k}: ${[...s].join(', ')} (one wanted)`); return [...s][0]; };
  one('code', u => u.stamp.code); const audit = one('audit', u => u.stamp.audit); const seed = one('seed', u => u.seed); one('paths', u => u.N);
  if (filesAudit !== undefined && audit !== filesAudit) P.push(`the units' audit ${audit} is not the files' ${filesAudit}`);
  if (HELD_OUT.includes(seed)) P.push(`seed ${seed} is held out`);
  for (const id of ids) {
    const us = ARMS.map(a => by[id] && by[id][a]).filter(Boolean);
    for (const k of ['inputs', 'target', 'retireT', 'Y']) if (new Set(us.map(u => u[k])).size > 1) P.push(`${id}: its arms differ in ${k} (${us.map(u => `${u.arm} ${u[k]}`).join(', ')})`);
  }
  return P;
}
const stats = xs => { const n = xs.length, m = xs.reduce((a, x) => a + x, 0) / n, v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1 || 1), se = Math.sqrt(v / n); return { m, se, lo: m - Z * se, hi: m + Z * se }; };
const fmt = (s, unit = '') => `${s.m >= 0 ? '+' : ''}${s.m.toFixed(3)}${unit} (${s.lo.toFixed(3)} to ${s.hi.toFixed(3)}, se ${s.se.toFixed(4)})`;
/* a ratio of two pooled means, its interval by the delta method over paths */
function ratio(num, den) {
  const n = num.length, mn = num.reduce((a, x) => a + x, 0) / n, md = den.reduce((a, x) => a + x, 0) / n, r = mn / md;
  const inf = num.map((x, i) => (x - r * den[i]) / md), s = stats(inf);
  return { m: 100 * r, se: 100 * s.se, lo: 100 * (r - Z * s.se), hi: 100 * (r + Z * s.se) };
}
export const shareVerdict = s => (s.lo >= 50 - 1e-9 ? 'HALF OR MORE' : s.hi <= 100 / 3 + 1e-9 ? 'A THIRD OR LESS' : 'BETWEEN');

/* the read: every figure from decoded units */
export function read(units, ids) {
  const by = {}; for (const u of units) (by[u.id] ||= {})[u.arm] = u;
  const N = units[0].N, H = ids.length;
  const survPath = arm => Array.from({ length: N }, (_, i) => 100 * ids.reduce((a, id) => a + by[id][arm].main.survived[i], 0) / H);
  const S = Object.fromEntries(ARMS.map(a => [a, survPath(a)]));
  const appMean = Object.fromEntries(ids.map(id => [id, by[id].APP.main.delivered.reduce((a, x) => a + x, 0) / N]));
  const spendPath = (x, y) => Array.from({ length: N }, (_, i) => 100 * ids.reduce((a, id) => a + (by[id][x].main.delivered[i] - by[id][y].main.delivered[i]) / appMean[id], 0) / H);
  const d = (x, y) => S[x].map((v, i) => v - S[y][i]);
  const out = { N, H, surv: Object.fromEntries(ARMS.map(a => [a, stats(S[a])])), diff: {}, spend: {}, share: {}, levels: {}, house: [] };
  for (const [x, y] of [['SHIP', 'APP'], ['SHIPNC', 'APP'], ['SHIP', 'SHIPNC'], ['CAND', 'APP'], ['CANDNC', 'APP'], ['CAND', 'CANDNC'], ['CANDNC', 'SHIPNC'], ['CAND', 'SHIP']]) { out.diff[`${x}-${y}`] = stats(d(x, y)); out.spend[`${x}-${y}`] = stats(spendPath(x, y)); }
  out.share.SHIP = ratio(d('SHIP', 'SHIPNC'), d('SHIP', 'APP'));
  out.share.CAND = ratio(d('CAND', 'CANDNC'), d('CAND', 'APP'));
  for (const arm of ARMS) {
    const b = [[0, 0], [0, 0], [0, 0]], fl = [0, 0];
    for (const id of ids) {
      const u = by[id][arm], { Y } = u, lv = u.main.level, fy = u.main.failYear, sv = u.main.survived; let hb = [[0, 0], [0, 0], [0, 0]], atF = 0, at90 = 0;
      for (let k = 0; k < N; k++) for (let t = u.retireT; t < Y; t++) { if (!sv[k] && t >= fy[k]) break; const v = lv[k * Y + t]; if (!v) continue; const j = t - u.retireT < 5 ? 0 : t - u.retireT < 10 ? 1 : 2; hb[j][0] += v; hb[j][1]++; if (v <= FLOOR) atF++; if (v <= NINETY) at90++; }
      hb.forEach(([s, c], j) => { if (c) { b[j][0] += s / c; b[j][1]++; } }); fl[0] += atF / N; fl[1] += at90 / N;
    }
    out.levels[arm] = { buckets: b.map(([s, c]) => (c ? s / c : NaN)), atFloor: fl[0] / H, at90: fl[1] / H };
  }
  for (const id of ids) {
    const sv = Object.fromEntries(ARMS.map(a => [a, 100 * by[id][a].main.survived.reduce((x, y) => x + y, 0) / N]));
    const sh = (x, nc) => (sv[x] - sv.APP !== 0 ? 100 * (sv[x] - sv[nc]) / (sv[x] - sv.APP) : NaN);
    out.house.push({ id, cohort: by[id].APP.cohort, sv, shareShip: sh('SHIP', 'SHIPNC'), shareCand: sh('CAND', 'CANDNC'), beside: ARMS.filter(a => a !== 'APP').map(a => by[id][a].beside ? by[id][a].beside.engineOnly + by[id][a].beside.policyOnly : 0).reduce((x, y) => x + y, 0) });
  }
  return out;
}

function report(o, label) {
  const L = [`THE TIER TEST (EXPLORATORY): ${label}; ${o.H} households, ${o.N} paths, W0.02`];
  L.push(`survival: ${ARMS.map(a => `${a} ${o.surv[a].m.toFixed(3)}%`).join(', ')}`);
  for (const k of Object.keys(o.diff)) L.push(`${k.replace('-', ' less ')}: survival ${fmt(o.diff[k])} points; spending delivered ${fmt(o.spend[k], '%')}`);
  for (const x of ['SHIP', 'CAND']) L.push(`THE TIERS' SHARE of ${x}'s gain over APP, (${x} less ${x}NC) / (${x} less APP): ${o.share[x].m.toFixed(1)}% (${o.share[x].lo.toFixed(1)} to ${o.share[x].hi.toFixed(1)}): ${shareVerdict(o.share[x])}`);
  L.push(`spend as a share of target by retired year (0 to 4, 5 to 9, 10 on; paths not yet failed), and retired years a path at the ${FLOOR}% floor / at ${NINETY}% or below:`);
  for (const a of ARMS) L.push(`  ${a.padEnd(6)} ${o.levels[a].buckets.map(x => x.toFixed(1)).join(' / ')}; at the floor ${o.levels[a].atFloor.toFixed(2)}, at ${NINETY}% or below ${o.levels[a].at90.toFixed(2)}`);
  L.push('per household, survival (APP, SHIP, SHIPNC, CAND, CANDNC) and the tiers\' share of SHIP\'s and of CAND\'s gain:');
  for (const h of o.house) L.push(`  ${h.id.padEnd(6)} ${h.cohort.padEnd(4)} ${ARMS.map(a => h.sv[a].toFixed(2)).join(' ')} | SHIP ${Number.isFinite(h.shareShip) ? h.shareShip.toFixed(0) : '-'}% CAND ${Number.isFinite(h.shareCand) ? h.shareCand.toFixed(0) : '-'}%`);
  L.push(`runPolicy beside the engine: paths that differ ${o.house.reduce((a, h) => a + h.beside, 0)}`);
  return L.join('\n');
}

/* synthetic units with known answers */
function synth({ shipNcGain, n = 400, ids = ['A', 'B'], seed = 7002, noise = 0, drop = null, inputsOf = () => 'x' }) {
  let k = 1; const rnd = () => { k = (k * 16807) % 2147483647; return k / 2147483647; };
  const units = [];
  for (const id of ids) for (const arm of ARMS) {
    if (drop && drop[0] === id && drop[1] === arm) continue;
    const p = { APP: 0.80, SHIP: 0.90, SHIPNC: 0.80 + shipNcGain * 0.10, CAND: 0.92, CANDNC: 0.80 + shipNcGain * 0.12 }[arm], Y = 3;
    const survived = new Uint8Array(n), delivered = new Float32Array(n).fill(100), level = new Uint8Array(n * Y).fill(100), failYear = new Int16Array(n).fill(-1);
    for (let i = 0; i < n; i++) survived[i] = (noise ? rnd() : (i + 0.5) / n) < p ? 1 : 0;
    units.push({ id, arm, cohort: 'lib', target: 1, inputs: inputsOf(id, arm), retireT: 0, Y, seed, N: n, stamp: { code: 'c', audit: 'a' }, beside: null, main: { survived, delivered, unmet: new Float32Array(n), estate: new Float32Array(n), failYear, level } });
  }
  return units;
}
function planted() {
  const res = [], ok = (c, m) => res.push([c, m]);
  { const U = synth({ shipNcGain: 0.5 }); ok(gate(U, ['A', 'B'], 'a').length === 0, 'a complete synthetic set passes the gate'); const o = read(U, ['A', 'B']); ok(Math.abs(o.share.SHIP.m - 50) < 1e-6 && o.share.SHIP.lo < 50 && shareVerdict(o.share.SHIP) === 'BETWEEN', `the tiers carry exactly half, its interval across the line (${o.share.SHIP.lo.toFixed(1)} to ${o.share.SHIP.hi.toFixed(1)}): read BETWEEN, not HALF OR MORE`); }
  { const o = read(synth({ shipNcGain: 0.2 }), ['A', 'B']); ok(Math.abs(o.share.SHIP.m - 80) < 1e-6 && shareVerdict(o.share.SHIP) === 'HALF OR MORE', `four-fifths: ${o.share.SHIP.m.toFixed(3)}% (${o.share.SHIP.lo.toFixed(1)} to ${o.share.SHIP.hi.toFixed(1)}) read HALF OR MORE`); }
  { const o = read(synth({ shipNcGain: 0.8 }), ['A', 'B']); ok(Math.abs(o.share.SHIP.m - 20) < 1e-6 && shareVerdict(o.share.SHIP) === 'A THIRD OR LESS', `a fifth: ${o.share.SHIP.m.toFixed(3)}% read A THIRD OR LESS`); }
  { const o = read(synth({ shipNcGain: 0.6, noise: 1 }), ['A', 'B']); ok(shareVerdict(o.share.SHIP) === 'BETWEEN', `about two-fifths with noise: ${o.share.SHIP.m.toFixed(1)}% (${o.share.SHIP.lo.toFixed(1)} to ${o.share.SHIP.hi.toFixed(1)}) read BETWEEN`); }
  ok(gate(synth({ shipNcGain: 0.5, drop: ['B', 'CANDNC'] }), ['A', 'B'], 'a').some(p => /B CANDNC: missing/.test(p)), 'a missing unit is refused');
  ok(gate(synth({ shipNcGain: 0.5, inputsOf: (id, arm) => (id === 'A' && arm === 'SHIPNC' ? 'y' : 'x') }), ['A', 'B'], 'a').some(p => /A: its arms differ in inputs/.test(p)), 'a household whose arms ran on other inputs is refused');
  ok(gate(synth({ shipNcGain: 0.5, seed: 7003 }), ['A', 'B'], 'a').some(p => /held out/.test(p)), 'a held-out seed is refused');
  ok(gate(synth({ shipNcGain: 0.5 }), ['A', 'B'], 'b').some(p => /not the files'/.test(p)), 'units stamped on other files are refused');
  for (const [c, m] of res) console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`);
  const bad = res.filter(([c]) => !c).length;
  console.log(bad ? `planted (${res.length}): ${bad} misread` : `planted (${res.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const bad = planted();
  if (bad) process.exit(1);
  if (process.argv[2] === '--planted') process.exit(0);
  const dir = process.argv[2] || join(HERE, 'results', 'tiers');
  const { requireFairLogs } = await import('./fair-gate.mjs');
  const logs = Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => [f, readFileSync(join(dir, f), 'utf8')]));
  requireFairLogs(logs, 'none', { blob: () => '-' });
  const units = readdirSync(dir).filter(f => f.endsWith('.json.gz')).map(f => decode(JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString())));
  const { readPanel } = await import('./phase4-panel.mjs'), { stampFilesHash } = await import('./audit-tiers.mjs');
  const ids = readPanel().map(h => h.id), P = gate(units, ids, stampFilesHash());
  if (P.length) { console.log(`THE GATE: NOT FAIR\n${P.map(p => `  - ${p}`).join('\n')}`); process.exit(2); }
  console.log(`THE GATE: fair - ${ids.length} households in every arm, seed ${units[0].seed}, ${units[0].N} paths, one stamp (code ${units[0].stamp.code}, audit ${units[0].stamp.audit})`);
  console.log(report(read(units, ids), `seed ${units[0].seed}`));
}
