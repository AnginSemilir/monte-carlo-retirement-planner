// DPC's SNAP traces and dp lines, read for the deep review after DPC's read (deep-review-log.md, 4 Oct): O87 (the plateau
// paths' pension share), O83 (the hold on plateau households) and O89 (survival by arm). No solve: results/diagdpc alone.
//   - per household, from <household>-snap.json.gz: the pension share at the start (path 0, year 0), the plateau paths (reach
//     0.6, never 0.75, alive at the plan's end; audit-dpc.mjs's definition, held to the SNAP plateau line of the household's
//     case file), their mean pension share at the plan's end, the mean years from first reaching 0.6 to the end, and the mean
//     growth of the used share a year after access in [0.6, 0.72) and in [0.72, 0.75);
//   - pooled: plateau paths on households starting at a pension share of 0.85 or more, and the pooled growth in each span;
//   - per household and arm, from the dp lines of the case files: paths survived;
//   - per household, from the sp lines: the State Pension year's drop under 0.6 in each arm (that year's growth of the used
//     share less the year before's, as results-dpc.txt prints it), and the households where the arms
//     differ by 0.001 or more (O88; the drops are printed to 4 places, so a difference of 0.0005 is rounding's size).
//   - per arm, the mean unit time (its solve's secs plus its dp line's) and from it ADOPT-PI's cost (SNAP against PCLSI on the
//     25 households: their two mean unit times x 25) and the hybrid's (three PCLSI units, S130, S370 and S128), in core-hours.
//   node research/solver/derive-dpc-traces.mjs > research/solver/results-derive-dpc-traces.txt
import { gunzipSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
const D = new URL('./results/diagdpc/', import.meta.url);
const f32 = s => { const b = Buffer.from(s, 'base64'); return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4); };
const ARMS = { 'OFF/PRODUCT/W0.02': 'SNAP', 'OFF/PRODUCT/W0.02/PCLSI': 'PCLSI', 'OFF/PRODUCT/W0.02/SHIFT': 'SHIFT' };
const unit = {};   // id -> { access, SNAP: { survived, plateau }, PCLSI: ..., SHIFT: ... }
for (const f of readdirSync(D).filter(f => /^case\d+\.txt$/.test(f))) {
  const t = readFileSync(new URL(f, D), 'utf8'), id = t.split('\n')[2]?.slice(0, 16).trim();
  for (const m of t.matchAll(/^\s+(access|solve|dp|plateau|sp) (\S+): (.*)$/gm)) {
    const arm = ARMS[m[2]]; if (!arm || !id) continue;
    const u = (unit[id] ||= {}); const a = (u[arm] ||= {});
    if (m[1] === 'access') u.access = +/year (\d+)/.exec(m[3])[1];
    if (m[1] === 'dp') { a.survived = +/survived (\d+)/.exec(m[3])[1]; a.dsecs = +/secs (\d+)/.exec(m[3])[1]; }
    if (m[1] === 'solve') a.ssecs = +/secs (\d+)/.exec(m[3])[1];
    if (m[1] === 'plateau') a.plateau = +/paths (\d+)/.exec(m[3])[1];
    if (m[1] === 'sp') { const x = /lo (\d+) (\S+) before (\d+) (\S+)/.exec(m[3]); a.spn = +x[1]; a.splo = x[2] === '-' || x[4] === '-' ? NaN : +x[2] - +x[4]; }
  }
}
const ids = Object.keys(unit).sort();
const bad = ids.filter(id => !Number.isInteger(unit[id].access) || Object.values(ARMS).some(a => !unit[id][a] || !Number.isInteger(unit[id][a].survived) || !Number.isInteger(unit[id][a].plateau) || !Number.isInteger(unit[id][a].ssecs) || !Number.isInteger(unit[id][a].dsecs)));
if (ids.length !== 25 || bad.length) { console.error(`derive-dpc-traces: ${ids.length} households, ${bad.length} incomplete (${bad.join(', ')})`); process.exit(1); }
const F = (x, k = 4) => (Number.isFinite(x) ? x.toFixed(k) : '-');
console.log('household        ps0    | plat   ps end  yrs 0.6->end | growth [0.6,0.72) (py)    [0.72,0.75) (py)');
let P85 = 0, PALL = 0, g1 = 0, n1 = 0, g2 = 0, n2 = 0; const ent = [], traced = new Set();
for (const f of readdirSync(D).filter(f => f.endsWith('-snap.json.gz')).sort()) {
  const j = JSON.parse(gunzipSync(readFileSync(new URL(f, D))));
  const U = f32(j.u), P = f32(j.pen), N = f32(j.non), Y = j.Y, T = Y - 1, u0 = unit[j.id];
  if (!u0) { console.error(`derive-dpc-traces: ${f} names ${j.id}, no case file`); process.exit(1); }
  traced.add(j.id);
  const ps0 = P[0] / (P[0] + N[0]);
  let n = 0, pe = 0, ey = 0, h1 = 0, k1 = 0, h2 = 0, k2 = 0;
  for (let p = 0; p < j.N; p++) {
    const o = p * Y; let first = -1, cross = false, last = -1;
    for (let t = 0; t < Y; t++) { const u = U[o + t]; if (u !== u) continue; last = t; if (u >= 0.6 && first < 0) first = t; if (u >= 0.75) cross = true; }
    if (!(first >= 0 && !cross && last === T)) continue;
    n++; pe += P[o + T] / (P[o + T] + N[o + T]); ey += T - first;
    for (let t = u0.access; t < T; t++) {
      const u = U[o + t], d = U[o + t + 1] - u; if (d !== d) continue;
      if (u >= 0.6 && u < 0.72) { h1 += d; k1++; } else if (u >= 0.72 && u < 0.75) { h2 += d; k2++; }
    }
  }
  if (n !== u0.SNAP.plateau) { console.error(`derive-dpc-traces: ${j.id} ${n} plateau paths in the trace, ${u0.SNAP.plateau} on its SNAP plateau line`); process.exit(1); }
  PALL += n; if (ps0 >= 0.85) P85 += n; g1 += h1; n1 += k1; g2 += h2; n2 += k2; if (n) ent.push(ey / n);
  console.log(`  ${j.id.padEnd(16)} ${F(ps0, 3)}  | ${String(n).padStart(5)}  ${F(n ? pe / n : NaN)}  ${F(n ? ey / n : NaN, 1).padStart(5)}       | ${F(k1 ? h1 / k1 : NaN)} (${k1})`.padEnd(88) + `${F(k2 ? h2 / k2 : NaN)} (${k2})`);
}
if (traced.size !== 25) { console.error(`derive-dpc-traces: ${traced.size} traces, not 25`); process.exit(1); }
console.log(`\nSNAP plateau paths ${PALL}, of which on households starting at a pension share of 0.85 or more ${P85}`);
console.log(`mean years from first reaching 0.6 to the plan's end, per household with plateau paths: ${F(Math.min(...ent), 1)} to ${F(Math.max(...ent), 1)} (${ent.length} households)`);
console.log(`pooled growth of the used share on plateau paths after access: [0.6, 0.72) ${F(g1 / n1)} a year (${n1} path-years), [0.72, 0.75) ${F(g2 / n2)} a year (${n2} path-years)`);
console.log('\nsurvived (of 2000 a household):  household        SNAP   PCLSI  SHIFT  PCLSI-SNAP');
const tot = { SNAP: 0, PCLSI: 0, SHIFT: 0 };
for (const id of ids) {
  const s = Object.values(ARMS).map(a => unit[id][a].survived); Object.keys(tot).forEach((a, i) => (tot[a] += s[i]));
  console.log(`  ${id.padEnd(16)} ${s.map(x => String(x).padStart(6)).join(' ')}  ${String(s[1] - s[0]).padStart(6)}`);
}
console.log(`  total            ${Object.values(tot).map(x => String(x).padStart(6)).join(' ')}  ${String(tot.PCLSI - tot.SNAP).padStart(6)}  (of ${25 * 2000})`);
console.log('\nState Pension year, the drop under 0.6 (its growth less the growth a year before; path-years):  household        SNAP              PCLSI             SHIFT');
let same = 0, printed = 0; const diff = [];
for (const id of ids) {
  const v = Object.values(ARMS).map(a => unit[id][a]);
  if (v.some(a => !Number.isFinite(a.splo))) continue;
  printed++; const lo = v.map(a => a.splo), d = Math.max(...lo) - Math.min(...lo);
  if (d >= 0.001 - 1e-9) diff.push(`${id} ${F(d)}`); else same++;
  console.log(`  ${id.padEnd(16)} ${v.map(a => `${F(a.splo)} (${a.spn})`.padEnd(17)).join(' ')} ${d >= 0.001 - 1e-9 ? 'DIFFERS' : ''}`);
}
console.log(`printed on ${printed} households; the arms within less than 0.001 on ${same}; differing by 0.001 or more on ${diff.length}: ${diff.join(', ')}`);
const usec = a => ids.reduce((t, id) => t + unit[id][a].ssecs + unit[id][a].dsecs, 0) / ids.length;
const us = Object.fromEntries(Object.values(ARMS).map(a => [a, usec(a)]));
console.log(`\nmean unit time (solve plus forward, secs): ${Object.entries(us).map(([a, v]) => `${a} ${v.toFixed(0)}`).join(', ')}`);
console.log(`ADOPT-PI (SNAP against PCLSI on the 25 households): ${(25 * (us.SNAP + us.PCLSI) / 3600).toFixed(1)} core-hours; the hybrid (three PCLSI units): ${(3 * us.PCLSI / 3600).toFixed(1)} core-hours`);
