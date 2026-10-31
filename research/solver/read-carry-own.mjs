// read-only (grade C, post hoc): EACH ARM'S OWN POLICY AT THE TWO WEIGHTS, at each weight's objective (the deep review of
// 8 Oct 09:32 UK, flag (a) and P2; the plan-auditor's BLOCKING 1 and MINOR 2 of 8 Oct on PLAN.md 0c7e1b64af). On the same
// 8,000 paths (seed 7002), an arm's policy solved at 0.02 (7aw's traces) against its own policy solved at 0.01 (7aj's),
// both scored by reduce-7aa.mjs's wholeLeg with reduce-carry.mjs item 2's settings (7aw's lambda, floor, scale and cap;
// the estate weight the objective's): at 0.02, the objective the second was solved for, and at 0.01, the first's. A
// policy that loses at its own objective is a table error the switch charge does not explain; one that wins at the other
// policy's objective is a move that paid there and was not taken. The path-level se is of the whole score's per-path
// change. Controls first: each arm's 0.01 policy against itself reads 0 at both weights, and reduce-carry.mjs's item-2
// leg (7aj's SHIP against CAND at 0.02) is reproduced. And the charge's arithmetic for PR11: the candidate's tier changes
// a path at each weight (the traces), at 0.1 points a change (PR11's switch charge, 0.001 a change in score units).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import * as A from './reduce-7aa.mjs';
import { RUNS } from './reduce-carry.mjs';
import { PANEL } from './reduce-7aw.mjs';
import { decode } from './reduce-7t.mjs';
import { spendYears } from './reduce-7af.mjs';

const logsOf = dir => Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')]));
const units = {}, TR = {};
for (const k of ['aj', 'aw']) {
  units[k] = Object.values(logsOf(RUNS[k].dir)).flatMap(A.parse);
  TR[k] = {};
  for (const u of units[k]) { const f = join(RUNS[k].dir, A.traceName(u.id, u.arm, u.label)); if (existsSync(f)) TR[k][`${u.id}|${u.arm}`] = decode(JSON.parse(gunzipSync(readFileSync(f)).toString())); }
}
const U = (k, id, arm) => units[k].find(u => u.id === id && u.arm === arm), T = (k, id, arm) => TR[k][`${id}|${arm}`];
const cfgOf = (id, wb, X, Y) => { const u = U('aw', id, 'CAND'); return { lambda: Number(A.field(u.ran, 'lambda')), floor: Math.min(...A.field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb, spendYears: spendYears(X, Y) }; };
// the whole score's per-path change of Y against X at weight wb: its mean and se (points)
const pathSe = (X, Y, cfg) => { const a = A.wholePaths(X, cfg), b = A.wholePaths(Y, cfg), n = X.N; let m = 0; for (let i = 0; i < n; i++) m += b[i] - a[i]; m /= n; let v = 0; for (let i = 0; i < n; i++) v += (b[i] - a[i] - m) ** 2; return { m, se: Math.sqrt(v / (n - 1) / n) }; };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
// controls
const bad = [];
for (const id of PANEL) for (const arm of ['CAND', 'SHIP']) {
  const X = T('aj', id, arm);
  for (const wb of [0.01, 0.02]) { const l = A.wholeLeg(X, X, cfgOf(id, wb, X, X), 0.05); if (Math.abs(l.d) > 1e-12) bad.push(`${id} ${arm} against itself at ${wb}: ${l.d}`); }
}
const it2 = (() => { const o = {}; for (const l of readFileSync(join(RUNS.aj.results, '..', 'results-carry.txt'), 'utf8').split('\n')) { const m = /^  (.+?)\s+fixed-policy whole at 0\.02 ([+-]\d+\.\d{3})/.exec(l); if (m) o[m[1].trim()] = +m[2]; } return o; })();
for (const id of PANEL) { const X = T('aj', id, 'SHIP'), Y = T('aj', id, 'CAND'), l = A.wholeLeg(X, Y, cfgOf(id, 0.02, X, Y), 0.05); if (!(id in it2) || Math.abs(l.d - it2[id]) > 5e-4 + 1e-9) bad.push(`${id}: item 2's leg ${l.d.toFixed(3)} against results-carry.txt's ${it2[id]}`); }
if (bad.length) { console.log(`REFUSED: a control failed\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`EACH ARM'S OWN POLICY AT THE TWO WEIGHTS (read-only, grade C, post hoc; 7aj's and 7aw's traces, 8,000 paths of seed 7002)`);
console.log(`controls: each arm's 0.01 policy against itself reads 0 at both weights (50 units); reduce-carry.mjs item 2's 25 legs reproduced to 0.0005 (results-carry.txt)`);
console.log(`household      arm  | the 0.02 policy against the 0.01 policy: at the 0.02 objective, whole (95% unconditional) path se z | at the 0.01 objective, the same`);
const rows = [];
for (const id of PANEL) for (const arm of ['CAND', 'SHIP']) {
  const X = T('aj', id, arm), Y = T('aw', id, arm), out = [];
  for (const wb of [0.02, 0.01]) { const cfg = cfgOf(id, wb, X, Y), l = A.wholeLeg(X, Y, cfg, 0.05), p = pathSe(X, Y, cfg); out.push({ wb, d: l.d, lo: l.lo, hi: l.hi, se: p.se, z: p.se > 0 ? p.m / p.se : 0 }); }
  rows.push({ id, arm, out });
  console.log(`${id.padEnd(14)} ${arm} | ${out.map(o => `${f3(o.d)} (${o.lo.toFixed(3)} to ${o.hi.toFixed(3)}) se ${o.se.toFixed(3)} z ${o.z.toFixed(1)}`).join(' | ')}`);
}
const own = rows.filter(r => r.out[0].z <= -2), other = rows.filter(r => r.out[1].z >= 2);
console.log(`LOSES AT ITS OWN 0.02 OBJECTIVE (z at or below -2): ${own.map(r => `${r.id} ${r.arm} ${f3(r.out[0].d)} (se ${r.out[0].se.toFixed(3)}, z ${r.out[0].z.toFixed(1)})`).join('; ') || 'none'}`);
console.log(`WINS AT THE 0.01 POLICY'S OWN OBJECTIVE (z at or above 2): ${other.map(r => `${r.id} ${r.arm} ${f3(r.out[1].d)} (se ${r.out[1].se.toFixed(3)}, z ${r.out[1].z.toFixed(1)})`).join('; ') || 'none'}`);
// PR11's arithmetic: the candidate's tier changes a path at each weight (each run's results file, its CAND line's 'changes'),
// at the charge's 0.1 points a change
const chg = (k, id) => { const m = new RegExp(`^  ${id} CAND .* changes (\\d+\\.\\d+) `, 'm').exec(readFileSync(RUNS[k].results, 'utf8')); if (!m) { console.log(`REFUSED: no CAND changes line for ${id} in ${RUNS[k].results}`); process.exit(1); } return +m[1]; };
for (const id of ['S120', 'S168', 'S122']) { const c1 = chg('aj', id), c2 = chg('aw', id); console.log(`CHARGE ${id.padEnd(5)} CAND tier changes a path ${c1.toFixed(3)} at 0.01, ${c2.toFixed(3)} at 0.02 (results-7aj.txt, results-7aw.txt); the charge a path ${(0.1 * c1).toFixed(3)} and ${(0.1 * c2).toFixed(3)} points`); }
