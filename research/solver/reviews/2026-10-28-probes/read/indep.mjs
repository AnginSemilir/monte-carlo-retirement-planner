// Independent recomputation of Phase 4's read from the unit files; imports nothing from the repository.
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
const [D, PANELF, PATHSF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PANELF, 'utf8')).panel, reg = JSON.parse(readFileSync(PATHSF, 'utf8'));
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const arr = x => x && { s: dec(x.survived, Uint8Array), d: dec(x.delivered, Float32Array), e: dec(x.estate, Float32Array), w: dec(x.wealth, Float32Array), f: dec(x.failYear, Int16Array), l: dec(x.level, Uint8Array), t: dec(x.tax, Float32Array) };
const U = {};
for (const f of readdirSync(D).filter(f => f.endsWith('.json.gz'))) { const j = JSON.parse(gunzipSync(readFileSync(join(D, f))).toString()); (U[j.id] ||= {})[`${j.arm}/${j.w}`] = { j, m: arr(j.main), r: arr(j.repl), fb: arr(j.fixbr) }; }
const Z = 1.959963984540054, N0 = 16000;
// per-path mean over households of f_h(i), then mean, se
function item(fs, n) { const x = new Float64Array(n); for (const f of fs) for (let i = 0; i < n; i++) x[i] += f(i); for (let i = 0; i < n; i++) x[i] /= fs.length; let m = 0; for (const v of x) m += v; m /= n; let v2 = 0; for (const v of x) v2 += (v - m) ** 2; const se = Math.sqrt(v2 / (n - 1) / n); return { d: m, se, lo: m - Z * se, hi: m + Z * se }; }
const mean = (a, n = a.length) => { let s = 0; for (let i = 0; i < n; i++) s += a[i]; return s / n; };
const surv = (pairs, n) => item(pairs.map(([c, o]) => i => 100 * (c.s[i] - o.s[i])), n);
const spend = (pairs, n) => item(pairs.map(([c, o]) => { const m = mean(o.d, n); return i => 100 * (c.d[i] - o.d[i]) / m; }), n);
const fmt = r => `${r.d >= 0 ? '+' : ''}${r.d.toFixed(3)} (${r.lo.toFixed(3)} to ${r.hi.toFixed(3)}, se ${r.se.toFixed(4)})`;
const H = sel => panel.filter(sel);
const run = (label, hs) => { for (const w of ['0.02', '0.01']) { const C = h => U[h.id][`CAND/${w}`].m, A = h => U[h.id]['APP/-'].m, S = h => U[h.id][`SHIP/${w}`].m;
  console.log(`${label} (${hs.length}) W${w}: A1 ${fmt(surv(hs.map(h => [C(h), A(h)]), N0))} | A2 ${fmt(spend(hs.map(h => [C(h), A(h)]), N0))}% | S1 ${fmt(surv(hs.map(h => [C(h), S(h)]), N0))} | spend vs SHIP ${fmt(spend(hs.map(h => [C(h), S(h)]), N0))}%`); } };
console.log('units', Object.values(U).reduce((t, u) => t + Object.keys(u).length, 0), 'households', Object.keys(U).length);
// path counts and paths file
let pc = 0; for (const h of panel) for (const k of Object.keys(U[h.id])) if (U[h.id][k].m.s.length !== reg.paths[h.id] || U[h.id][k].j.N !== reg.paths[h.id]) pc++;
console.log('units whose path count is not the registered', pc);
run('ALL', panel);
run('LUMP', H(h => /lump sum/.test(h.label)));
run('NOT LUMP', H(h => !/lump sum/.test(h.label)));
// labels in units agree with panel
let lab = 0; for (const h of panel) for (const k of Object.keys(U[h.id])) if (U[h.id][k].j.label !== h.label) lab++;
console.log('units whose arm A label differs from the panel', lab, '; lump count', H(h => /lump sum/.test(h.label)).length);
run('WITHOUT S368', H(h => h.id !== 'S368'));
run('WITHOUT S368,S132,S164,S384', H(h => !['S368', 'S132', 'S164', 'S384'].includes(h.id)));
run('LIB', H(h => h.cohort === 'lib'));
for (const w of ['0.02', '0.01']) { const nr = panel.filter(h => U[h.id][`CAND/${w}`].j.readerYears === 0); console.log(`no-reader W${w}: ${nr.length}: ${nr.map(h => h.id).join(',')}`); run(`NO-READER W${w} list`, nr); }
// replication
for (const w of ['0.02', '0.01']) { const C = h => U[h.id][`CAND/${w}`].r, A = h => U[h.id]['APP/-'].r, S = h => U[h.id][`SHIP/${w}`].r;
  console.log(`REPL W${w}: A1 ${fmt(surv(panel.map(h => [C(h), A(h)]), 4000))} A2 ${fmt(spend(panel.map(h => [C(h), A(h)]), 4000))} S1 ${fmt(surv(panel.map(h => [C(h), S(h)]), 4000))}`); }
// flags
const flags = []; const losses = { '0.02': [], '0.01': [] };
for (const h of panel) for (const w of ['0.02', '0.01']) { const c = U[h.id][`CAND/${w}`].m;
  for (const arm of ['APP', 'SHIP']) { const o = arm === 'APP' ? U[h.id]['APP/-'].m : U[h.id][`SHIP/${w}`].m; let lost = 0, saved = 0; for (let i = 0; i < c.s.length; i++) { if (o.s[i] && !c.s[i]) lost++; else if (c.s[i] && !o.s[i]) saved++; }
    const loss = 100 * (lost - saved) / c.s.length, t = reg.thresholds[h.id][`${arm}/${w}`].t; if (loss > t) flags.push(`${h.id} W${w} ${arm} ${loss}`); if (arm === 'SHIP' && loss > 0) losses[w].push(`${h.id} ${loss.toFixed(3)} (t ${t.toFixed(4)})`); }
  const rel = 100 * (mean(c.d) / mean(U[h.id]['APP/-'].m.d) - 1); if (rel < -5) flags.push(`${h.id} W${w} spend ${rel}`); }
console.log('FLAGS', flags.length ? flags : 'none', '| observed loss vs SHIP W0.02:', losses['0.02'].join('; '), '| W0.01:', losses['0.01'].join('; ') || 'none');
// per household: estate lower, years below, spend vs APP < 0
for (const w of ['0.02', '0.01']) { let lower = [], higher = [], belowOK = 0, appR = [Infinity, -Infinity], candR = [Infinity, -Infinity], spendNeg = [], spendNegShip = [];
  for (const h of panel) { const c = U[h.id][`CAND/${w}`], a = U[h.id]['APP/-'], s = U[h.id][`SHIP/${w}`]; const de = mean(c.m.e) - mean(a.m.e); (de < 0 ? lower : higher).push(`${h.id} ${Math.round(de)}`);
    const yb = x => { const Y = x.j.Y, n = x.m.s.length; let k = 0; for (let i = 0; i < n * Y; i++) { const l = x.m.l[i]; if (l > 0 && l < 100) k++; } return k / n; };
    const yc = yb(c), ya = yb(a); if (yc < ya) belowOK++; appR = [Math.min(appR[0], ya), Math.max(appR[1], ya)]; candR = [Math.min(candR[0], yc), Math.max(candR[1], yc)];
    const sp = 100 * (mean(c.m.d) / mean(a.m.d) - 1); if (sp < 0) spendNeg.push(`${h.id} ${sp.toFixed(3)}`); const ss = 100 * (mean(c.m.d) / mean(s.m.d) - 1); if (ss < -1.5) spendNegShip.push(`${h.id} ${ss.toFixed(3)}`); }
  console.log(`W${w}: estate CAND lower than APP on ${lower.length}, higher on ${higher.length} (${higher.join(', ')}); fewer years below target on ${belowOK} of 40; APP ${appR.map(x => x.toFixed(2))} CAND ${candR.map(x => x.toFixed(2))}; spending below APP: ${spendNeg.join(', ')}; spending more than 1.5% below SHIP: ${spendNegShip.join(', ')}`); }
// FIXBR
{ const fb = panel.filter(h => U[h.id]['CAND/0.02'].fb); const n = Math.min(...fb.map(h => U[h.id]['CAND/0.02'].fb.s.length));
  console.log(`FIXBR on ${fb.length}, ${n} paths: ${fmt(surv(fb.map(h => [U[h.id]['CAND/0.02'].fb, U[h.id]['CAND/0.02'].m]), n))} spend ${fmt(spend(fb.map(h => [U[h.id]['CAND/0.02'].fb, U[h.id]['CAND/0.02'].m]), n))}`);
  for (const h of fb) { const u = U[h.id]['CAND/0.02'], m = u.fb.s.length; const fs = 100 * mean(u.fb.s), cs = 100 * mean(u.m.s, m), as = 100 * mean(U[h.id]['APP/-'].m.s, m); if (fs - cs < -3) console.log(`  ${h.id} FIXBR ${fs.toFixed(2)} CAND ${cs.toFixed(2)} APP ${as.toFixed(2)} (first ${m}) years ${u.j.fixbr.years}`); } }
// history and worlds
{ let cb = 0, ab = 0, better = [], worse = [], hs = 0; for (const h of panel) { const c = dec(U[h.id]['CAND/0.02'].j.hist.bits, Uint8Array), a = dec(U[h.id]['APP/-'].j.hist.bits, Uint8Array); const mc = mean(c), ma = mean(a); cb += mc; ab += ma; if (mc > ma) better.push(h.id); if (mc < ma) worse.push(`${h.id} ${(100 * mc).toFixed(1)} vs ${(100 * ma).toFixed(1)}`);
  hs += mean(dec(U[h.id]['CAND/0.02'].j.hist.delivered, Float32Array)) / mean(dec(U[h.id]['APP/-'].j.hist.delivered, Float32Array)) - 1; }
  console.log(`history: CAND ${(100 * cb / 40).toFixed(2)} APP ${(100 * ab / 40).toFixed(2)}; better ${better.length} (${better}), worse ${worse.length} (${worse.join('; ')}); spend ${(100 * hs / 40).toFixed(3)}`); }
for (const wd of ['return-1', 'vol+25', 'left-tail']) { const pr = panel.map(h => [{ s: dec(U[h.id]['CAND/0.02'].j.worlds[wd], Uint8Array), d: dec(U[h.id]['CAND/0.02'].j.worlds[`${wd}:delivered`], Float32Array) }, { s: dec(U[h.id]['APP/-'].j.worlds[wd], Uint8Array), d: dec(U[h.id]['APP/-'].j.worlds[`${wd}:delivered`], Float32Array) }]);
  console.log(`world ${wd}: ${fmt(surv(pr, 2000))} spend ${fmt(spend(pr, 2000))}`); }
// beside
{ let g = 0, n = 0; for (const h of panel) for (const k of ['CAND/0.02', 'CAND/0.01', 'SHIP/0.02', 'SHIP/0.01']) { const b = U[h.id][k].j.beside; n++; g += b.engineOnly + b.policyOnly; const pb = dec(b.survived, Uint8Array); const ms = U[h.id][k].m.s; let x = 0; for (let i = 0; i < pb.length; i++) if (pb[i] !== ms[i]) x++; g += 0; if (x) console.log('beside recount differs', h.id, k, x); } console.log(`beside: ${n} solver units, gaps ${g}`); }
// per-household A1 extremes, S1 per household at 16000 vs all paths
for (const w of ['0.02']) { const rows = panel.map(h => { const c = U[h.id][`CAND/${w}`].m, a = U[h.id]['APP/-'].m; return [h.id, 100 * (mean(c.s) - mean(a.s))]; }).sort((x, y) => x[1] - y[1]); console.log(`A1 per household W${w}: min ${rows[0]} max ${rows[rows.length - 1]}`); }
