/*
 * GAIN-BUCKET'S READ (the research queue's first, B7 in D51; D49; HARVEST-SIZING.md; EXPLORATORY, deciding nothing):
 * audit-gainbucket.mjs's units, CANDGI (the gain axis interpolated) against CANDD (the candidate), paired on the same paths.
 * The gate first: every household of the measured set in, one code, one audit (this test's files as they are), one seed, one
 * count of paths, both arms in every unit on the same inputs, and the arms' recorded settings the same but for gainInterp.
 * Then, reported: survival (paired by path; saved and lost; an exact one-sided test each way, Holm over the households) and
 * the lifetime spending delivered (paired by path, in % of CANDD's; on each household a sign-flip test of the mean each way,
 * seeded so the read reproduces, Holm over the households, the paths up and down beside it; on the panel the interval each
 * way), on the panel and each household; the taxable account's
 * re-wraps, gains realised and bucket-edge crossings a path under each arm; the solve's time CANDGI against CANDD; runPolicy
 * beside the engine. A gain beyond noise, in survival or spending, goes to the maintainer as a v2 proposal (B7), not a change,
 * with every effect beside it (the read's review of 3 Nov, finding 1: the verdict read survival alone).
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
  const extra = [...got].filter(id => !want.includes(id));
  if (extra.length) P.push(`households not in the measured set: ${extra.join(', ')}`);
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
  if (k > n) return 0;
  // the binomial coefficients in logs, so the tail holds for thousands of paths (2 ** n overflows past 1,023)
  let p = 0, lc = 0;
  const half = n * Math.LN2;
  for (let i = 0; i <= n; i++) { if (i > 0) lc += Math.log((n - i + 1) / i); if (i >= k) p += Math.exp(lc - half); }
  return Math.min(1, p);
}
/* a sign-flip (randomisation) test of a paired mean each way: under no effect each path's difference is as likely either sign,
   so the observed sum is set against B sums with the signs drawn at random (a fixed seed, so the read reproduces); a sign test
   would test the median path instead, and can point the other way from the mean (most paths a little down, a few well up) */
export const FLIPS = 20000;
export function flipTest(diffs, seed, B = FLIPS) {
  const d = diffs.filter(x => x !== 0), obs = d.reduce((a, x) => a + x, 0), eps = 1e-9 * d.reduce((a, x) => a + Math.abs(x), 0);
  let st = seed >>> 0, ge = 0, le = 0;
  const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let b = 0; b < B; b++) { let sum = 0; for (let i = 0; i < d.length; i++) sum += rnd() < 0.5 ? d[i] : -d[i]; if (sum >= obs - eps) ge++; if (sum <= obs + eps) le++; }
  return { gain: d.length ? (ge + 1) / (B + 1) : 1, loss: d.length ? (le + 1) / (B + 1) : 1 };
}
const seedOf = id => [...id].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const holm = ps => { const o = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]), out = new Array(ps.length); let run = 0; o.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (ps.length - r) * p)); out[i] = run; }); return out; };
/* each household's paired figures and the panel's */
export function read(units) {
  const rows = units.map(u => {
    const D = armOf(u.arms.CANDD), G = armOf(u.arms.CANDGI), n = D.survived.length;
    let saved = 0, lost = 0, sumD = 0, sumE = 0, sumE2 = 0, up = 0, down = 0;
    const diffs = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      if (G.survived[k] && !D.survived[k]) saved++; else if (!G.survived[k] && D.survived[k]) lost++;
      const e = G.delivered[k] - D.delivered[k]; sumD += D.delivered[k]; sumE += e; sumE2 += e * e;
      // a path's spending differs when it moves by more than a millionth of it (the stored float's own grain is under that)
      const tol = 1e-6 * Math.max(Math.abs(D.delivered[k]), Math.abs(G.delivered[k]));
      if (e > tol) { up++; diffs[k] = e; } else if (e < -tol) { down++; diffs[k] = e; }
    }
    const d = (saved - lost) / n, varD = ((saved + lost) / n - d * d) / n;          // var of the mean of d in {-1, 0, 1}
    const meanE = sumE / n, varE = (sumE2 / n - meanE * meanE) / n;
    const sumsOf = A => ({ cross: A.cross.reduce((s, v) => s + v, 0), crossPaths: A.cross.reduce((s, v) => s + (v > 0), 0), rewrap: A.rewrap.reduce((s, v) => s + v, 0), dispose: A.dispose.reduce((s, v) => s + v, 0), survived: A.survived.reduce((s, v) => s + v, 0) });
    return { id: u.id, n, saved, lost, d, varD, spend: (100 * sumE) / sumD, spendSe: (100 * Math.sqrt(varE) * n) / sumD, sumD, sumE, nVarE: n * n * varE,
      pHarm: tail(lost, saved + lost), pGain: tail(saved, saved + lost), up, down, ...(fl => ({ pSpendLoss: fl.loss, pSpendGain: fl.gain }))(flipTest(diffs, seedOf(u.id))), D: sumsOf(D), G: sumsOf(G),
      solve: u.arms.CANDGI.solveSecs / u.arms.CANDD.solveSecs, beside: [u.arms.CANDD.beside, u.arms.CANDGI.beside] };
  });
  const H = rows.length, hHarm = holm(rows.map(r => r.pHarm)), hGain = holm(rows.map(r => r.pGain)), hSL = holm(rows.map(r => r.pSpendLoss)), hSG = holm(rows.map(r => r.pSpendGain));
  rows.forEach((r, i) => { r.holmHarm = hHarm[i]; r.holmGain = hGain[i]; r.holmSpendLoss = hSL[i]; r.holmSpendGain = hSG[i]; });
  const panel = { surv: rows.reduce((s, r) => s + r.d, 0) / H, survSe: Math.sqrt(rows.reduce((s, r) => s + r.varD, 0)) / H,
    spend: (100 * rows.reduce((s, r) => s + r.sumE, 0)) / rows.reduce((s, r) => s + r.sumD, 0), spendSe: (100 * Math.sqrt(rows.reduce((s, r) => s + r.nVarE, 0))) / rows.reduce((s, r) => s + r.sumD, 0) };
  return { rows, panel };
}
const f = (x, d = 3) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
/* the verdict: every effect beyond noise, survival and spending, the panel and each household, gains and losses together */
export function verdict(rows, panel) {
  const at = (k, up) => rows.filter(r => r[k] < 0.05).map(r => r.id), ids = xs => xs.join(', ');
  const part = (what, pUp, pDown, up, down) => {
    const xs = [];
    if (pUp) xs.push('the panel up'); if (pDown) xs.push('the panel down');
    if (up.length) xs.push(`up on ${ids(up)}`); if (down.length) xs.push(`down on ${ids(down)}`);
    return { text: `${what} ${xs.length ? xs.join(', ') : 'no effect beyond noise'}`, up: pUp || up.length > 0, down: pDown || down.length > 0 };
  };
  const sv = part('survival:', panel.surv - 1.96 * panel.survSe > 0, panel.surv + 1.96 * panel.survSe < 0, at('holmGain'), at('holmHarm'));
  const sp = part('spending:', panel.spend - 1.96 * panel.spendSe > 0, panel.spend + 1.96 * panel.spendSe < 0, at('holmSpendGain'), at('holmSpendLoss'));
  const what = `${sv.text}; ${sp.text}`;
  if (sv.up || sp.up) return `VERDICT: A GAIN beyond noise (${what}): to the maintainer as a v2 proposal (B7: a registered test after the launch), every effect beside it.`;
  if (sv.down || sp.down) return `VERDICT: CANDGI WORSE beyond noise (${what}): the launch candidate (CANDD) keeps its bucket read; reported.`;
  return `VERDICT: NO EFFECT beyond noise (${what}): GAIN-BUCKET closed as measured.`;
}
export function report(rows, panel) {
  const lines = [], N = rows.reduce((s, r) => s + r.n, 0), lo = x => x - 1.96, ci = (m, se) => `${f(m - 1.96 * se)} to ${f(m + 1.96 * se)}`;
  void lo;
  lines.push(`Survival, CANDGI less CANDD, the panel (${rows.length} households): ${f(100 * panel.surv)} points (${ci(100 * panel.surv, 100 * panel.survSe)}, se ${(100 * panel.survSe).toFixed(4)}); lifetime spending delivered ${f(panel.spend, 4)}% (${ci(panel.spend, panel.spendSe)}%, se ${panel.spendSe.toFixed(4)}).`);
  for (const r of rows) lines.push(`  ${r.id}: survival ${f(100 * r.d)} points (${r.saved} saved, ${r.lost} lost of ${r.n}; Holm one-sided: harm ${r.holmHarm.toExponential(2)}, gain ${r.holmGain.toExponential(2)}); spending ${f(r.spend, 4)}% (se ${r.spendSe.toFixed(4)}; ${r.up} up, ${r.down} down; Holm one-sided: loss ${r.holmSpendLoss.toExponential(2)}, gain ${r.holmSpendGain.toExponential(2)}); a path's edge crossings ${(r.D.cross / r.n).toFixed(2)} / ${(r.G.cross / r.n).toFixed(2)}, pension re-wrap years ${(r.D.rewrap / r.n).toFixed(2)} / ${(r.G.rewrap / r.n).toFixed(2)}, realised-gain years ${(r.D.dispose / r.n).toFixed(2)} / ${(r.G.dispose / r.n).toFixed(2)} (CANDD / CANDGI); the solve x${r.solve.toFixed(2)}`);
  const tot = k => [rows.reduce((s, r) => s + r.D[k], 0), rows.reduce((s, r) => s + r.G[k], 0)];
  const [cD, cG] = tot('cross'), [pD, pG] = tot('crossPaths'), [rD, rG] = tot('rewrap'), [gD, gG] = tot('dispose');
  lines.push(`The taxable account, a path on the panel (CANDD / CANDGI): a bucket's edge crossed ${(cD / N).toFixed(2)} / ${(cG / N).toFixed(2)} times, on ${(100 * pD / N).toFixed(1)}% / ${(100 * pG / N).toFixed(1)}% of paths; pension re-wrap years (the engine's harvested) ${(rD / N).toFixed(2)} / ${(rG / N).toFixed(2)}; years with a realised gain (the engine's realisedGains, gains carried in included) ${(gD / N).toFixed(2)} / ${(gG / N).toFixed(2)}; the taxable account's tier switches and sweeps into the ISA not counted.`);
  const solves = rows.map(r => r.solve).sort((a, b) => a - b), med = solves[Math.floor(solves.length / 2)];
  const bes = rows.flatMap(r => r.beside), eo = bes.reduce((s, b) => s + b.engineOnly, 0), po = bes.reduce((s, b) => s + b.policyOnly, 0), bn = bes.reduce((s, b) => s + b.N, 0);
  lines.push(`The solve, CANDGI against CANDD: the median x${med.toFixed(2)} (x${solves[0].toFixed(2)} to x${solves[solves.length - 1].toFixed(2)}). runPolicy beside the engine: the engine alone ${eo}, runPolicy alone ${po}, of ${bn} paths.`);
  lines.push(verdict(rows, panel));
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
  const spendUp = unit('P3', arm(true, k => (k % 10 ? 1 : 0), k => (k < 40 ? 101 : 100)), arm(false, k => (k % 10 ? 1 : 0), () => 100));
  const spendDown = unit('P4', arm(true, k => (k % 10 ? 1 : 0), k => (k < 40 ? 99 : 100)), arm(false, k => (k % 10 ? 1 : 0), () => 100));
  const meanUp = unit('P5', arm(true, k => (k % 10 ? 1 : 0), k => (k < 80 ? 99 : k < 110 ? 106 : 100)), arm(false, k => (k % 10 ? 1 : 0), () => 100));
  return { same, gain, spendUp, spendDown, meanUp, arm, unit, n };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') {
    const { same, gain, spendUp, spendDown, meanUp, arm, unit, n } = plantedUnits(), out = [];
    const check = (label, cond) => { out.push(`${cond ? 'PASS' : 'FAIL'}  ${label}`); return cond; };
    check('a household missing is refused', gate([same], ['P1', 'P2']).some(p => /missing: P2/.test(p)));
    check('an arm missing is refused', gate([{ ...same, arms: { CANDD: same.arms.CANDD } }], ['P1']).some(p => /an arm missing/.test(p)));
    check('arms differing in a setting besides gainInterp are refused', gate([unit('P1', { ...same.arms.CANDGI, ran: { ...same.arms.CANDGI.ran, lambda: 0.06 } }, same.arms.CANDD)], ['P1']).some(p => /besides gainInterp/.test(p)));
    check('two codes are refused', gate([same, { ...gain, stamp: { code: 'd', audit: 'a' } }], ['P1', 'P2']).some(p => /more than one code/.test(p)));
    check('the files\' audit differing is refused', gate([same], ['P1'], 'b').some(p => /not the files'/.test(p)));
    check('a unit short of its paths is refused (an empty arm at the edge)', gate([unit('P1', arm(true, () => 1, () => 1), { ...arm(false, () => 1, () => 1), main: { ...arm(false, () => 1, () => 1).main, survived: Buffer.from(new Uint8Array(0)).toString('base64') } })], ['P1']).some(p => /paths, not/.test(p)));
    check('the fair pair passes the gate', gate([same, gain], ['P1', 'P2']).length === 0);
    check('a household not in the measured set is refused (a stale unit left in the folder)', gate([same, gain], ['P1']).some(p => /not in the measured set: P2/.test(p)));
    check(`the tail holds at thousands of paths (P(X >= 2100 | 4000) ${tail(2100, 4000).toExponential(2)}, P(X >= 2000 | 4000) ${tail(2000, 4000).toFixed(4)})`, tail(2100, 4000) > 0 && tail(2100, 4000) < 1e-3 && Math.abs(tail(2000, 4000) - 0.5063) < 1e-3 && tail(5, 4) === 0);
    {
      const sv = read([same, spendUp, spendDown]), v = verdict(sv.rows, sv.panel), r3 = sv.rows.find(r => r.id === 'P3'), r4 = sv.rows.find(r => r.id === 'P4');
      check(`spending moved with survival unchanged reads as a spending effect each way (P3 ${r3.up} up, Holm gain ${r3.holmSpendGain.toExponential(2)}; P4 ${r4.down} down, Holm loss ${r4.holmSpendLoss.toExponential(2)})`, r3.saved + r3.lost + r4.saved + r4.lost === 0 && r3.up === 40 && r3.down === 0 && r4.down === 40 && r3.holmSpendGain < 0.05 && r4.holmSpendLoss < 0.05);
      check(`a gain does not hide a loss: the verdict names both (${v})`, /^VERDICT: A GAIN/.test(v) && /spending: up on P3, down on P4/.test(v) && /survival: no effect beyond noise/.test(v));
      const nv = verdict(read([same]).rows, read([same]).panel), wv = verdict(read([same, spendDown]).rows, read([same, spendDown]).panel);
      const mv = read([same, meanUp]), r5 = mv.rows.find(r => r.id === 'P5'), v5 = verdict(mv.rows, mv.panel);
      check(`most paths down but the mean up reads as the mean's gain, not a loss (P5 ${r5.up} up, ${r5.down} down, spending ${f(r5.spend, 2)}%; Holm gain ${r5.holmSpendGain.toExponential(2)}, loss ${r5.holmSpendLoss.toExponential(2)})`, r5.down > r5.up && r5.spend > 0 && r5.holmSpendGain < 0.05 && r5.holmSpendLoss > 0.5 && /spending:[^;]*up on P5/.test(v5) && !/down on P5/.test(v5));
      const again = read([same, spendUp, spendDown]);
      check('the flips are seeded: a second read gives the same p-values', again.rows.every((r, i) => r.pSpendGain === sv.rows[i].pSpendGain && r.pSpendLoss === sv.rows[i].pSpendLoss));
      check(`no change reads as no effect, and a loss alone as worse (${nv.slice(0, 40)}...; ${wv.slice(0, 40)}...)`, /^VERDICT: NO EFFECT/.test(nv) && /^VERDICT: CANDGI WORSE/.test(wv) && /down on P4/.test(wv));
    }
    const { rows, panel } = read([same, gain]), r2 = rows.find(r => r.id === 'P2'), r1 = rows.find(r => r.id === 'P1');
    check(`no change reads as none (P1 ${f(100 * r1.d)} points, ${r1.saved} saved, ${r1.lost} lost)`, r1.saved === 0 && r1.lost === 0 && r1.spend === 0);
    check(`the planted gain reads as planted: 4 paths saved of ${n} (+1.000 points) and spending +1% (P2 ${f(100 * r2.d)} points, spending ${f(r2.spend, 4)}%)`, r2.saved === 4 && r2.lost === 0 && Math.abs(100 * r2.d - 1) < 1e-12 && Math.abs(r2.spend - 1) < 1e-9);
    check(`the panel is the households' mean (${f(100 * panel.surv)} points)`, Math.abs(100 * panel.surv - 0.5) < 1e-12);
    console.log(out.join('\n'));
    console.log('EDGES: a household missing, a household extra, an arm missing, a unit with no paths in one arm, the files\' audit differing, a change of exactly zero, spending moved with survival unchanged, a gain and a loss at once, most paths down with the mean up, the tail at thousands of paths');
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
  // A reducer changed after its run (the read's review of 3 Nov, finding 1) cannot match the units' audit, which hashes it. With
  // LAUNCH_REV (the git revision the run was launched from) the gate compares the units against the files as launched, the
  // reducer taken at that revision and every other file as it is now, so any other change still refuses; the read itself is by
  // this reducer, and says so.
  let filesAudit = stampFilesHash(), changed = null;
  if (process.env.LAUNCH_REV) {
    const { execFileSync } = await import('node:child_process'), { createHash } = await import('node:crypto');
    const { STAMP_FILES } = await import('./audit-gainbucket.mjs'), { PANEL_FILE } = await import('./phase4-panel.mjs');
    const atRev = execFileSync('git', ['show', `${process.env.LAUNCH_REV}:research/solver/reduce-gainbucket.mjs`]), h = createHash('sha256');
    for (const x of STAMP_FILES) h.update(x === 'reduce-gainbucket.mjs' ? atRev : readFileSync(x === 'phase4-panel.json' ? PANEL_FILE : join(HERE, x)));
    const blob = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex').slice(0, 12);
    filesAudit = h.digest('hex').slice(0, 12);
    changed = `the reducer at ${process.env.LAUNCH_REV} (blob ${blob(atRev)}) against this one (blob ${blob(readFileSync(fileURLToPath(import.meta.url)))})`;
  }
  const P = gate(units, want, filesAudit);
  if (P.length) { console.log(`The gate: NOT FAIR - ${P.join('; ')}`); process.exit(2); }
  console.log(changed ? `The gate: fair, on the files as launched (audit ${filesAudit}): this reducer changed after the run, ${changed}, every other file as launched.` : 'The gate: fair.');
  const { rows, panel } = read(units);
  console.log(report(rows, panel).join('\n'));
}
