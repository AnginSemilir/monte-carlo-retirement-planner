/*
 * GAIN-BUCKET'S READ (the research queue's first, B7 in D51; D49; HARVEST-SIZING.md; EXPLORATORY, deciding nothing):
 * audit-gainbucket.mjs's units, CANDGI (the gain axis interpolated) against CANDD (the candidate), paired on the same paths.
 * The gate first: every household of the measured set in, one code, one audit (this test's files as they are), one seed, one
 * count of paths, both arms in every unit on the same inputs, and the arms' recorded settings the same but for gainInterp.
 * Then, reported: survival (paired by path; saved and lost; an exact one-sided test each way, Holm over the households) and
 * the lifetime spending delivered (paired by path, in % of CANDD's), on the panel and each household; the taxable account's
 * re-wraps, gains realised and bucket-edge crossings a path under each arm; the solve's time CANDGI against CANDD; runPolicy
 * beside the engine. A gain beyond noise goes to the maintainer as a v2 proposal (B7), not a change.
 *   node research/solver/reduce-gainbucket.mjs [seed]      node research/solver/reduce-gainbucket.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const dec = (b64, T) => { const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const TYPES = { survived: Uint8Array, delivered: Float32Array, unmet: Float32Array, failYear: Int16Array, cross: Uint8Array, rewrap: Uint8Array, dispose: Uint8Array, giaYears: Uint8Array };
export const armOf = a => Object.fromEntries(Object.entries(a.main).map(([k, v]) => [k, dec(v, TYPES[k])]));

/* the gate: what makes the comparison fair; [] when it is */
export function gate(units, want, filesAudit) {
  const P = [], got = new Set(units.map(u => u.id));
  const missing = want.filter(id => !got.has(id));
  if (missing.length) P.push(`households missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); return vs[0]; };
  one('code', u => u.stamp && u.stamp.code); const audit = one('audit', u => u.stamp && u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N);
  if (filesAudit !== undefined && audit !== undefined && audit !== filesAudit) P.push(`the units' audit ${audit} is not the files' ${filesAudit}`);
  for (const u of units) {
    const D = u.arms && u.arms.CANDD, G = u.arms && u.arms.CANDGI;
    if (!D || !G) { P.push(`${u.id}: an arm missing (${Object.keys(u.arms || {}).join(', ') || 'none'})`); continue; }
    if (D.inputs !== G.inputs) P.push(`${u.id}: the arms ran other inputs`);
    const strip = r => JSON.stringify({ ...r, arm: undefined, gainInterp: undefined });
    if (strip(D.ran) !== strip(G.ran)) P.push(`${u.id}: the arms differ in a setting besides gainInterp (${strip(D.ran)} against ${strip(G.ran)})`);
    if (D.ran.gainInterp !== false || G.ran.gainInterp !== true) P.push(`${u.id}: gainInterp ${D.ran.gainInterp} / ${G.ran.gainInterp}, not false / true`);
    const nD = armOf(D).survived.length, nG = armOf(G).survived.length;
    if (nD !== u.N || nG !== u.N) P.push(`${u.id}: ${nD} and ${nG} paths, not ${u.N}`);
  }
  return P;
}
/* an exact one-sided binomial tail: P(X >= k) for X ~ Bin(n, 1/2) */
export function tail(k, n) {
  if (k <= 0) return 1;
  let p = 0, c = 1;
  for (let i = 0; i <= n; i++) { if (i > 0) c = (c * (n - i + 1)) / i; if (i >= k) p += c; }
  return p / 2 ** n;
}
const holm = ps => { const o = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]), out = new Array(ps.length); let run = 0; o.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (ps.length - r) * p)); out[i] = run; }); return out; };
/* each household's paired figures and the panel's */
export function read(units) {
  const rows = units.map(u => {
    const D = armOf(u.arms.CANDD), G = armOf(u.arms.CANDGI), n = D.survived.length;
    let saved = 0, lost = 0, sumD = 0, sumE = 0, sumE2 = 0;
    for (let k = 0; k < n; k++) {
      if (G.survived[k] && !D.survived[k]) saved++; else if (!G.survived[k] && D.survived[k]) lost++;
      const e = G.delivered[k] - D.delivered[k]; sumD += D.delivered[k]; sumE += e; sumE2 += e * e;
    }
    const d = (saved - lost) / n, varD = ((saved + lost) / n - d * d) / n;          // var of the mean of d in {-1, 0, 1}
    const meanE = sumE / n, varE = (sumE2 / n - meanE * meanE) / n;
    const sumsOf = A => ({ cross: A.cross.reduce((s, v) => s + v, 0), crossPaths: A.cross.reduce((s, v) => s + (v > 0), 0), rewrap: A.rewrap.reduce((s, v) => s + v, 0), dispose: A.dispose.reduce((s, v) => s + v, 0), survived: A.survived.reduce((s, v) => s + v, 0) });
    return { id: u.id, n, saved, lost, d, varD, spend: (100 * sumE) / sumD, spendSe: (100 * Math.sqrt(varE) * n) / sumD, sumD, sumE, nVarE: n * n * varE,
      pHarm: tail(lost, saved + lost), pGain: tail(saved, saved + lost), D: sumsOf(D), G: sumsOf(G),
      solve: u.arms.CANDGI.solveSecs / u.arms.CANDD.solveSecs, beside: [u.arms.CANDD.beside, u.arms.CANDGI.beside] };
  });
  const H = rows.length, hHarm = holm(rows.map(r => r.pHarm)), hGain = holm(rows.map(r => r.pGain));
  rows.forEach((r, i) => { r.holmHarm = hHarm[i]; r.holmGain = hGain[i]; });
  const panel = { surv: rows.reduce((s, r) => s + r.d, 0) / H, survSe: Math.sqrt(rows.reduce((s, r) => s + r.varD, 0)) / H,
    spend: (100 * rows.reduce((s, r) => s + r.sumE, 0)) / rows.reduce((s, r) => s + r.sumD, 0), spendSe: (100 * Math.sqrt(rows.reduce((s, r) => s + r.nVarE, 0))) / rows.reduce((s, r) => s + r.sumD, 0) };
  return { rows, panel };
}
const f = (x, d = 3) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
export function report(rows, panel) {
  const lines = [], N = rows.reduce((s, r) => s + r.n, 0), lo = x => x - 1.96, ci = (m, se) => `${f(m - 1.96 * se)} to ${f(m + 1.96 * se)}`;
  void lo;
  lines.push(`Survival, CANDGI less CANDD, the panel (${rows.length} households): ${f(100 * panel.surv)} points (${ci(100 * panel.surv, 100 * panel.survSe)}, se ${(100 * panel.survSe).toFixed(4)}); lifetime spending delivered ${f(panel.spend, 4)}% (${ci(panel.spend, panel.spendSe)}%, se ${panel.spendSe.toFixed(4)}).`);
  for (const r of rows) lines.push(`  ${r.id}: survival ${f(100 * r.d)} points (${r.saved} saved, ${r.lost} lost of ${r.n}; Holm one-sided: harm ${r.holmHarm.toExponential(2)}, gain ${r.holmGain.toExponential(2)}); spending ${f(r.spend, 4)}% (se ${r.spendSe.toFixed(4)}); a path's edge crossings ${(r.D.cross / r.n).toFixed(2)} / ${(r.G.cross / r.n).toFixed(2)}, re-wrap years ${(r.D.rewrap / r.n).toFixed(2)} / ${(r.G.rewrap / r.n).toFixed(2)}, gain years ${(r.D.dispose / r.n).toFixed(2)} / ${(r.G.dispose / r.n).toFixed(2)} (CANDD / CANDGI); the solve x${r.solve.toFixed(2)}`);
  const tot = k => [rows.reduce((s, r) => s + r.D[k], 0), rows.reduce((s, r) => s + r.G[k], 0)];
  const [cD, cG] = tot('cross'), [pD, pG] = tot('crossPaths'), [rD, rG] = tot('rewrap'), [gD, gG] = tot('dispose');
  lines.push(`The taxable account, a path on the panel (CANDD / CANDGI): a bucket's edge crossed ${(cD / N).toFixed(2)} / ${(cG / N).toFixed(2)} times, on ${(100 * pD / N).toFixed(1)}% / ${(100 * pG / N).toFixed(1)}% of paths; re-wrap years ${(rD / N).toFixed(2)} / ${(rG / N).toFixed(2)}; years a gain is realised ${(gD / N).toFixed(2)} / ${(gG / N).toFixed(2)}.`);
  const solves = rows.map(r => r.solve).sort((a, b) => a - b), med = solves[Math.floor(solves.length / 2)];
  const bes = rows.flatMap(r => r.beside), eo = bes.reduce((s, b) => s + b.engineOnly, 0), po = bes.reduce((s, b) => s + b.policyOnly, 0), bn = bes.reduce((s, b) => s + b.N, 0);
  lines.push(`The solve, CANDGI against CANDD: the median x${med.toFixed(2)} (x${solves[0].toFixed(2)} to x${solves[solves.length - 1].toFixed(2)}). runPolicy beside the engine: the engine alone ${eo}, runPolicy alone ${po}, of ${bn} paths.`);
  const gains = rows.filter(r => r.holmGain < 0.05), harms = rows.filter(r => r.holmHarm < 0.05), panelGain = panel.surv - 1.96 * panel.survSe > 0 || panel.spend - 1.96 * panel.spendSe > 0, panelHarm = panel.surv + 1.96 * panel.survSe < 0;
  lines.push(gains.length || panelGain
    ? `VERDICT: A GAIN beyond noise (${panelGain ? 'the panel' : ''}${panelGain && gains.length ? '; ' : ''}${gains.map(r => r.id).join(', ')}): to the maintainer as a v2 proposal (B7: a registered test after the launch).`
    : harms.length || panelHarm ? `VERDICT: CANDGI WORSE beyond noise (${panelHarm ? 'the panel' : ''}${harms.map(r => r.id).join(', ')}): the launch candidate (CANDD) keeps its bucket read; reported.`
      : 'VERDICT: NO EFFECT beyond noise: GAIN-BUCKET closed as measured.');
  return lines;
}

/* planted units: the gate's refusals and a known effect read as planted */
function plantedUnits() {
  const n = 400, b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const arm = (gi, surv, deliv) => ({ inputs: 'h', ran: { arm: gi ? 'CANDGI' : 'CANDD', gainInterp: gi, pts: 45, lambda: 0.02 }, solveSecs: gi ? 12 : 10, beside: { N: 100, engineOnly: 0, policyOnly: 0 },
    main: { survived: b64(Uint8Array.from({ length: n }, (_, k) => surv(k))), delivered: b64(Float32Array.from({ length: n }, (_, k) => deliv(k))), unmet: b64(new Float32Array(n)), failYear: b64(new Int16Array(n)), cross: b64(new Uint8Array(n)), rewrap: b64(new Uint8Array(n)), dispose: b64(new Uint8Array(n)), giaYears: b64(new Uint8Array(n)) } });
  const unit = (id, G, D, extra = {}) => ({ id, seed: 7002, N: n, stamp: { code: 'c', audit: 'a' }, arms: { CANDD: D, CANDGI: G }, ...extra });
  const same = unit('P1', arm(true, k => (k % 10 ? 1 : 0), () => 100), arm(false, k => (k % 10 ? 1 : 0), () => 100));
  const gain = unit('P2', arm(true, k => (k % 10 ? 1 : 0) || (k < 40 ? 1 : 0), () => 101), arm(false, k => (k % 10 ? 1 : 0), () => 100));
  return { same, gain, arm, unit, n };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') {
    const { same, gain, arm, unit, n } = plantedUnits(), out = [];
    const check = (label, cond) => { out.push(`${cond ? 'PASS' : 'FAIL'}  ${label}`); return cond; };
    check('a household missing is refused', gate([same], ['P1', 'P2']).some(p => /missing: P2/.test(p)));
    check('an arm missing is refused', gate([{ ...same, arms: { CANDD: same.arms.CANDD } }], ['P1']).some(p => /an arm missing/.test(p)));
    check('arms differing in a setting besides gainInterp are refused', gate([unit('P1', { ...same.arms.CANDGI, ran: { ...same.arms.CANDGI.ran, lambda: 0.06 } }, same.arms.CANDD)], ['P1']).some(p => /besides gainInterp/.test(p)));
    check('two codes are refused', gate([same, { ...gain, stamp: { code: 'd', audit: 'a' } }], ['P1', 'P2']).some(p => /more than one code/.test(p)));
    check('the files\' audit differing is refused', gate([same], ['P1'], 'b').some(p => /not the files'/.test(p)));
    check('a unit short of its paths is refused (an empty arm at the edge)', gate([unit('P1', arm(true, () => 1, () => 1), { ...arm(false, () => 1, () => 1), main: { ...arm(false, () => 1, () => 1).main, survived: Buffer.from(new Uint8Array(0)).toString('base64') } })], ['P1']).some(p => /paths, not/.test(p)));
    check('the fair pair passes the gate', gate([same, gain], ['P1', 'P2']).length === 0);
    const { rows, panel } = read([same, gain]), r2 = rows.find(r => r.id === 'P2'), r1 = rows.find(r => r.id === 'P1');
    check(`no change reads as none (P1 ${f(100 * r1.d)} points, ${r1.saved} saved, ${r1.lost} lost)`, r1.saved === 0 && r1.lost === 0 && r1.spend === 0);
    check(`the planted gain reads as planted: 4 paths saved of ${n} (+1.000 points) and spending +1% (P2 ${f(100 * r2.d)} points, spending ${f(r2.spend, 4)}%)`, r2.saved === 4 && r2.lost === 0 && Math.abs(100 * r2.d - 1) < 1e-12 && Math.abs(r2.spend - 1) < 1e-9);
    check(`the panel is the households' mean (${f(100 * panel.surv)} points)`, Math.abs(100 * panel.surv - 0.5) < 1e-12);
    console.log(out.join('\n'));
    console.log('EDGES: a household missing, an arm missing, a unit with no paths in one arm, the files\' audit differing, a change of exactly zero');
    const bad = out.filter(l => l.startsWith('FAIL')).length;
    console.log(bad ? `FAILED: ${bad} of ${out.length}` : `ALL PASS: ${out.length}`);
    process.exit(bad ? 1 : 0);
  }
  const SEED = Number(process.argv[2] || 7002), DIR = join(HERE, 'results', `gainbucket-${SEED}`);
  const { readPanel } = await import('./phase4-panel.mjs'), { gainHouseholds, stampFilesHash } = await import('./audit-gainbucket.mjs');
  const want = gainHouseholds(readPanel());
  // the stamps first (CHECKLIST 3; fair-gate.mjs requireFairLogs): every log stamped, one code and one audit across them,
  // launched through run-from-snapshot.sh as EXPLORATORY (PREDICTION="none:..."); then the reducer's own gate
  const { requireFairLogs } = await import('./fair-gate.mjs');
  requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  const units = existsSync(DIR) ? readdirSync(DIR).filter(x => x.endsWith('.json.gz')).sort().map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString())) : [];
  const u0 = units[0] || {};
  console.log(`GAIN-BUCKET (EXPLORATORY; B7, D49): CANDGI (the gain axis interpolated) against CANDD on ${want.length} households, the taxable account 10% of wealth or more; seed ${u0.seed}, ${u0.N} paths, code ${u0.stamp && u0.stamp.code}, audit ${u0.stamp && u0.stamp.audit}`);
  const P = gate(units, want, stampFilesHash());
  if (P.length) { console.log(`The gate: NOT FAIR - ${P.join('; ')}`); process.exit(2); }
  console.log('The gate: fair.');
  const { rows, panel } = read(units);
  console.log(report(rows, panel).join('\n'));
}
