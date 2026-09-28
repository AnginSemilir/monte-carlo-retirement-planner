/*
 * THE DEEP REVIEW AFTER 7AB: ITS READ-ONLY SLICES (deep-review-log.md, 28 Sep 13:56 UK). Written by the deep reviewer in the
 * session scratchpad; committed here unchanged but for its paths, two unused imports dropped and this header, so the ledger's figures come from a
 * committed script's output. 7ab's traces with 7aa's, each read only through its reducer's gates (reduce-7aa.mjs's gate and
 * trace agreement over results/diag7aa; reduce-7ab.mjs's gate, trace agreement and PRODUCT's identity with 7aa's over
 * results/diag7ab). Reported, not registered: grade C. It reads nothing of 7ac.
 *   1. the whole score split (survival, estate, cuts, the failure floor, raises): FREED against PRODUCT, TS+J against FREED,
 *      TS+J against PRODUCT on five units;
 *   2. the path-years TS+J holds a riskier or safer pension tier than FREED, by year band; and TS+J against FREED by the
 *      long-run shift's bin;
 *   3. on the paths FREED saves against PRODUCT, the year PRODUCT first leaves the plan's pension tier;
 *   4. by the long-run shift's bin, per path within the bin, B against A: survival, estate, cuts and raises, whole;
 *   5. FREED's saved paths: the year-0 draw and the long-run shift.
 *   node research/solver/read-7ab-deep.mjs > research/solver/results-7ab-deep.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
const R = dirname(fileURLToPath(import.meta.url));
const B = await import('./reduce-7ab.mjs');
const A = await import('./reduce-7aa.mjs');
const { requireFairLogs } = await import('./fair-gate.mjs');
const { decode, MU, Z_BINS, binOf } = await import('./reduce-7t.mjs');
const { pathsForSeed } = await import('../engine.mjs');
const DIR = join(R, 'results', 'diag7ab'), DIR7AA = join(R, 'results', 'diag7aa');
const logsOf = D => Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const logsA = logsOf(DIR7AA), unitsA = Object.values(logsA).flatMap(A.parse);
requireFairLogs(logsA, A.PRED);
const badA = A.gate(unitsA); if (badA.length) { console.log('GATE 7aa FAILED', badA); process.exit(1); }
const STA = stampOf(logsA), RAW = {}, T = {};
for (const u of unitsA) {
  const f = join(DIR7AA, A.traceName(u.id, u.arm, u.label));
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (!A.traceAgrees(j, STA, u.arm, u.label, u.run.sim)) { console.log('7aa trace disagrees', f); process.exit(1); }
  const [rule, wl] = u.label.split('/W');
  RAW[`${u.id}|${u.arm}|${rule}|${wl}|7aa`] = j; T[`${u.id}|${u.arm}|${rule}|${wl}`] = { X: decode(j), u };
}
const logsB = logsOf(DIR), unitsB = Object.values(logsB).flatMap(B.parse);
requireFairLogs(logsB, B.PRED);
const ref = (id, arm, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label('PRODUCT', w));
const bad = B.gate(unitsB, ref), STB = stampOf(logsB);
if (!bad.length) for (const u of unitsB) for (const rule of B.RULES) {
  const f = join(DIR, B.traceName(u.id, u.arm, rule, u.w));
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (!A.traceAgrees(j, STB, u.arm, A.label(rule, u.w), u.runs[rule].sim)) { bad.push(`${f} disagrees`); continue; }
  if (rule === 'PRODUCT') { if (!B.sameTrace(j, RAW[`${u.id}|${u.arm}|PRODUCT|${u.w}|7aa`])) bad.push(`${f}: identity fails`); continue; }
  T[`${u.id}|${u.arm}|FREED|${u.w}`] = { X: decode(j), u: { ...u, run: u.runs.FREED } };
}
if (bad.length) { console.log('GATE 7ab FAILED', bad); process.exit(1); }
console.log('gates passed: 7aa (thirty units, traces), 7ab (ten units, traces, identity)\n');
const cfgOf = (id, arm, w) => { const x = T[`${id}|${arm}|PRODUCT|${w}`]; const cfg = { lambda: Number(A.field(x.u.ran, 'lambda')), floor: Math.min(...A.field(x.u.ran, 'levels').split(',').map(Number)), scale: x.u.joint.scale, cap: x.u.joint.cap, wb: Number(w) }; cfg.spendYears = Array.from({ length: x.X.Y }, (_, t) => { for (let i = 0; i < x.X.N; i++) if (x.X.level[i * x.X.Y + t] > 0) return true; return false; }); return cfg; };
// the whole score per path split: survival, estate, cuts (incl. failure's floor years), raises
function parts(X, { lambda, floor, scale, cap, spendYears, wb }) {
  const o = { surv: new Float64Array(X.N), est: new Float64Array(X.N), cut: new Float64Array(X.N), cutFail: new Float64Array(X.N), raise: new Float64Array(X.N) };
  for (let i = 0; i < X.N; i++) {
    let cut = 0, raise = 0, cf = 0;
    for (let t = 0; t < X.Y; t++) { const l = X.level[i * X.Y + t] / 100; if (l > 0 && l < 1) cut += lambda * (1 - l) ** 2; else if (l > 1) raise += MU * Math.sqrt(Math.min(0.2, l - 1)); }
    if (X.failYear[i] >= 0) for (let t = X.failYear[i]; t < X.Y; t++) if (spendYears[t]) cf += lambda * (1 - floor) ** 2;
    const alive = X.survived[i] === 1, e = alive ? Math.min(X.wealth[i * X.Y + X.Y - 1], cap) : 0;
    o.surv[i] = 100 * (alive ? 1 : 0); o.est[i] = 100 * wb * e / scale; o.cut[i] = -100 * cut; o.cutFail[i] = -100 * cf; o.raise[i] = 100 * (alive ? raise : 0);
  }
  return o;
}
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
function split(id, arm, w, b, a) { // b against a
  const cfg = cfgOf(id, arm, w), pb = parts(T[`${id}|${arm}|${b}|${w}`].X, cfg), pa = parts(T[`${id}|${arm}|${a}|${w}`].X, cfg);
  const d = k => mean(pb[k]) - mean(pa[k]);
  return `surv ${f3(d('surv'))} estate ${f3(d('est'))} cuts ${f3(d('cut'))} failfloor ${f3(d('cutFail'))} raises ${f3(d('raise'))} | rest ${f3(d('est') + d('cut') + d('cutFail') + d('raise'))}`;
}
const UN = [['S126', 'READER', '0'], ['bridge 4', 'READER', '0'], ['S126', 'READER', '0.02'], ['S194', 'OFF', '0.02'], ['bridge 4', 'READER', '0.02']];
console.log('1. THE WHOLE SCORE SPLIT (points, per path x100): B against A');
for (const [id, arm, w] of UN) for (const [b, a] of [['FREED', 'PRODUCT'], ['TS+J', 'FREED'], ['TS+J', 'PRODUCT']]) console.log(`  ${`${id} W${w}`.padEnd(16)} ${`${b} v ${a}`.padEnd(18)} ${split(id, arm, w, b, a)}`);
// 2. tier differences FREED v TS+J by year band and direction (lower code riskier)
const bands = [[1, 5], [6, 15], [16, 25], [26, 99]];
console.log('\n2. PATH-YEARS TS+J RISKIER / SAFER THAN FREED (pension tier), by year band; and TS+J v FREED rest by long-run shift bin');
const shiftsCache = {};
for (const [id, arm, w] of UN) {
  const F = T[`${id}|${arm}|FREED|${w}`].X, J = T[`${id}|${arm}|TS+J|${w}`].X;
  const row = bands.map(([lo, hi]) => { let rk = 0, sf = 0; for (let i = 0; i < F.N; i++) { const end = Math.min(F.failYear[i] >= 0 ? F.failYear[i] : F.Y, J.failYear[i] >= 0 ? J.failYear[i] : J.Y); for (let t = lo; t <= Math.min(hi, end - 1); t++) { const pf = F.tier[i * F.Y + t] >> 2, pj = J.tier[i * J.Y + t] >> 2; if (pj < pf) rk++; else if (pj > pf) sf++; } } return `y${lo}-${hi}: ${rk}/${sf}`; });
  const shifts = shiftsCache[F.Y] || (shiftsCache[F.Y] = pathsForSeed(7002, F.N, F.Y - 1).map(z => z[F.Y]));
  const cfg = cfgOf(id, arm, w), pf = parts(F, cfg), pj = parts(J, cfg);
  const bins = Z_BINS.map(([nm], bi) => { let n = 0, dr = 0, sv = 0, ls = 0; for (let i = 0; i < F.N; i++) { if (binOf(shifts[i]) !== bi) continue; n++; dr += (pj.est[i] + pj.cut[i] + pj.cutFail[i] + pj.raise[i]) - (pf.est[i] + pf.cut[i] + pf.cutFail[i] + pf.raise[i]); if (J.survived[i] && !F.survived[i]) sv++; if (!J.survived[i] && F.survived[i]) ls++; } return `${nm} (${n}): ${sv}/${ls} rest ${f3(dr / F.N)}`; });
  console.log(`  ${`${id} W${w}`.padEnd(16)} ${row.join('  ')}\n  ${''.padEnd(16)} ${bins.join(' | ')}`);
}
// 3. the opening under the product's continuation: on the paths FREED saves against PRODUCT, PRODUCT's first year off the plan's pension tier
console.log('\n3. FREED v PRODUCT: on the paths FREED saves, the year PRODUCT first leaves the plan\'s pension tier (never = n), and the long-run shift bin');
for (const [id, arm, w] of UN.slice(0, 4)) {
  const F = T[`${id}|${arm}|FREED|${w}`].X, P = T[`${id}|${arm}|PRODUCT|${w}`].X, shifts = shiftsCache[F.Y];
  const ys = [], bs = [0, 0, 0, 0];
  for (let i = 0; i < F.N; i++) { if (!(F.survived[i] && !P.survived[i])) continue; let y = 'n'; for (let t = 0; t < P.Y; t++) if ((P.tier[i * P.Y + t] >> 2) > 0) { y = t; break; } ys.push(y); bs[binOf(shifts[i])]++; }
  const hist = {}; for (const y of ys) { const k = y === 'n' ? 'n' : y <= 1 ? '1' : y <= 2 ? '2' : y <= 5 ? '3-5' : y <= 10 ? '6-10' : '11+'; hist[k] = (hist[k] || 0) + 1; }
  console.log(`  ${`${id} W${w}`.padEnd(16)} saved ${ys.length}: first de-risk ${JSON.stringify(hist)}; by shift bin ${bs.join('/')}`);
}
// 4. by long-run shift bin, per path WITHIN the bin (x100, points): B v A survival, estate, cuts+raises (the whole score's parts)
console.log('\n4. BY SHIFT BIN, per path within the bin (points): B v A  survival | estate | cuts+raises | whole');
for (const [id, arm, w] of UN.slice(0, 4)) for (const [b, a] of [['FREED', 'PRODUCT'], ['TS+J', 'PRODUCT']]) {
  const cfg = cfgOf(id, arm, w), XB = T[`${id}|${arm}|${b}|${w}`].X, XA = T[`${id}|${arm}|${a}|${w}`].X, pb = parts(XB, cfg), pa = parts(XA, cfg), shifts = shiftsCache[XB.Y];
  const row = Z_BINS.map(([nm], bi) => { let n = 0, s = 0, e = 0, c = 0; for (let i = 0; i < XB.N; i++) { if (binOf(shifts[i]) !== bi) continue; n++; s += pb.surv[i] - pa.surv[i]; e += pb.est[i] - pa.est[i]; c += (pb.cut[i] + pb.cutFail[i] + pb.raise[i]) - (pa.cut[i] + pa.cutFail[i] + pa.raise[i]); } return `${nm}: ${f3(s / n)} | ${f3(e / n)} | ${f3(c / n)} | ${f3((s + e + c) / n)}`; });
  console.log(`  ${`${id} W${w}`.padEnd(16)} ${`${b} v ${a}`.padEnd(16)} ${row.join('   ')}`);
}
// 5. FREED's saves against PRODUCT: the year-0 draw (standard normal shock) and the long-run shift, and the product's pension tier path
console.log('\n5. FREED v PRODUCT saved paths: year-0 draw z0 (quartiles), share with z0 < -1; long-run shift median; paths whose z0 < -1 among all');
for (const [id, arm, w] of UN.slice(0, 4)) {
  const F = T[`${id}|${arm}|FREED|${w}`].X, P = T[`${id}|${arm}|PRODUCT|${w}`].X;
  const zs = pathsForSeed(7002, F.N, F.Y - 1), d0 = zs.map(z => z[0]), sh = zs.map(z => z[F.Y]);
  const idx = []; for (let i = 0; i < F.N; i++) if (F.survived[i] && !P.survived[i]) idx.push(i);
  const q = a => { const s = [...a].sort((x, y) => x - y); return [0.25, 0.5, 0.75].map(p => s[Math.floor(p * (s.length - 1))].toFixed(2)).join('/'); };
  const allLow = d0.filter(x => x < -1).length / F.N;
  console.log(`  ${`${id} W${w}`.padEnd(16)} saved ${idx.length}: z0 quartiles ${q(idx.map(i => d0[i]))}, z0 < -1 on ${idx.filter(i => d0[i] < -1).length} (all paths ${(100 * allLow).toFixed(1)}%); shift quartiles ${q(idx.map(i => sh[i]))}; shift >= -1 with z0 < -1: ${idx.filter(i => sh[i] >= -1 && d0[i] < -1).length} of ${idx.filter(i => sh[i] >= -1).length}`);
}
