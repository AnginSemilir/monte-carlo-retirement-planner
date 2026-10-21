/*
 * 7U-F'S READ, ONCE, BY ITS REGISTERED RULE (registrations/fresh-7uf.md; STATE.md D3; the external review of 21 Oct, Part B
 * Step 4.3). Over audit-7uf.mjs's files (results/diag7uf):
 *   THE GATE (CHECKLIST.md item 3), before any figure: every unit present; each household's arms on the same seed, paths,
 *   code, audit, candidate hash and registration; their recorded settings (`ran`) differing only in the arm's own keys
 *   (CAND against SHIP: the candidate's settings; CAND against DECOMP: readerRef alone).
 *   P1, THE POOLED PRIMARY, at each estate weight: 7u's item 4, the paired survival change CAND less SHIP averaged over
 *   the floor households (the panel less 7u's gain set at the weight, panel-7uf.mjs floorOf), its 95% interval by path
 *   (each path's change averaged over the households, the spread across the independent paths): HELD when the lower end
 *   is above -0.1 points, FALSIFIED when the upper end is below it, else INCONCLUSIVE.
 *   P2, THE PER-HOUSEHOLD PRIMARY: for every household and weight where SHIP survives between 5% and 99.5% (the band),
 *   the one-sided exact McNemar p of the loss (mcnemarHarmP: the paths SHIP alone survives against those CAND alone
 *   survives), Holm-adjusted over the band's household-weight pairs; HARM where the adjusted p is below 0.05 and the loss
 *   is at least 1 point. Outside the band the change is reported, not gated.
 *   THE OUTCOME: PASS (P1 HELD at both weights, no household harmed): the candidate goes to Phase 4. HARM (a household
 *   harmed): the harmed households go to V4's measures (D4), no new reader or reference variant opened on them, no Phase 4
 *   until they read. P1 FALSIFIED at a weight (no harm): not to Phase 4; V4's measures on the floor households that lose
 *   most. P1 INCONCLUSIVE at a weight (no harm, no FALSIFIED): not a pass; to the maintainer with the figures, no re-run
 *   on seed 7014.
 *   REPORTED, never gating: each household's change and its interval at the 0.25 and 0.5 margins; estate, unmet spending,
 *   realised spend and years cut from the engine, the whole score from runPolicy's trace beside it; the fidelity check
 *   (the engine against runPolicy on the same paths: a household where they differ beyond noise is a fidelity gap, not a
 *   result); the reference's part (CAND against DECOMP, read by the mixture over the worlds' paired runs, and on the
 *   seed's own paths); the by-world item (each world's table at its own opening less the engine's runs in that world).
 *   node research/solver/reduce-7uf.mjs [diagDir]        the read
 *   node research/solver/reduce-7uf.mjs --planted        the rule on planted units (research/tests/reduce-7uf.test.mjs)
 *   node research/solver/reduce-7uf.mjs --preflight <dir> the preflight's files (the tuning seed, a few households): the gate
 *        over the households present, every figure printed, and on a household without bridge years DECOMP equal to CAND
 *        path for path (the reader reads no year there); never 7u-F's read
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mcnemarHarmP, holm, survivalChangeU, wilson, zFor, binomUpperHalf, mixtureChange, MIX3W } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
export const REGISTRATION = 'research/solver/registrations/fresh-7uf.md';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BAND = [5, 99.5], HARM_P = 0.05, HARM_LOSS = 1, POOLED = 0.1, LEVEL = 0.05, MARGINS = [0.25, 0.5];
const CAND_KEYS = ['bridgeRead', 'bridgeStep', 'tierState', 'readerRef', 'readerSplit', 'switchMargin', 'switchCharge', 'e3', 'e3pcls', 'pclsInterp', 'tiersAbove'];
export const ALLOWED = { 'CAND:SHIP': new Set(CAND_KEYS), 'CAND:DECOMP': new Set(['readerRef']) };

// a `ran` line as key-value pairs (audit-7uf.mjs's order: each key followed by its value)
export const ranPairs = ran => { const t = ran.trim().split(/\s+/), o = {}; for (let i = 0; i + 1 < t.length; i += 2) o[t[i]] = t[i + 1]; return o; };
const bitsOf = s => { const b = Buffer.from(s, 'base64'); return new Uint8Array(b.buffer, b.byteOffset, b.byteLength); };
const f32Of = s => { const b = Buffer.from(s, 'base64'); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const i16Of = s => { const b = Buffer.from(s, 'base64'); return new Int16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };

/* THE GATE: units { [id]: { [w]: { CAND, DECOMP?, SHIP } } }, each unit { seed, N, stamp, ran }; returns the problems */
export function gate(units, panel, weights, needsDecomp) {
  const out = [];
  for (const id of panel) for (const w of weights) {
    const u = (units[id] || {})[w] || {}, arms = ['CAND', 'SHIP', ...(needsDecomp(id) ? ['DECOMP'] : [])];
    const miss = arms.filter(a => !u[a]);
    if (miss.length) { out.push(`${id} W${w}: no ${miss.join(', ')} unit`); continue; }
    for (const a of arms.slice(1)) {
      const x = u.CAND, y = u[a];
      for (const k of ['seed', 'N']) if (x[k] !== y[k]) out.push(`${id} W${w}: CAND and ${a} differ in ${k} (${x[k]} against ${y[k]})`);
      for (const k of ['code', 'audit', 'candidate', 'prediction', 'sha']) if (x.stamp[k] !== y.stamp[k]) out.push(`${id} W${w}: CAND and ${a} differ in the stamp's ${k} (${x.stamp[k]} against ${y.stamp[k]})`);
      const px = ranPairs(x.ran), py = ranPairs(y.ran), ok = ALLOWED[`CAND:${a}`];
      for (const k of new Set([...Object.keys(px), ...Object.keys(py)])) if (px[k] !== py[k] && !ok.has(k)) out.push(`${id} W${w}: CAND and ${a} differ in ${k} (${px[k]} against ${py[k]}), not one of the arm's own settings`);
    }
  }
  return out;
}

/* the paired cells of two arms' bit arrays: a both survive, b lost (the control alone), c saved (the arm alone), d neither */
export function cells(ctrl, arm, n = ctrl.length) { let a = 0, b = 0, c = 0, d = 0; for (let i = 0; i < n; i++) { const x = ctrl[i], y = arm[i]; if (x && y) a++; else if (x) b++; else if (y) c++; else d++; } return { a, b, c, d }; }

/* P1: the pooled change over the floor households, by path; pairs [{ ship, cand }] of equal-length bit arrays */
export function pooledByPath(pairs) {
  const N = pairs[0].ship.length, m = new Float64Array(N);
  for (const { ship, cand } of pairs) { if (ship.length !== N || cand.length !== N) throw new Error('pooledByPath: unequal path counts'); for (let i = 0; i < N; i++) m[i] += (cand[i] - ship[i]) / pairs.length; }
  let mu = 0; for (let i = 0; i < N; i++) mu += m[i]; mu /= N;
  let v = 0; for (let i = 0; i < N; i++) v += (m[i] - mu) ** 2;
  const z = zFor(LEVEL), se = Math.sqrt(v / (N - 1) / N), d = 100 * mu, lo = 100 * (mu - z * se), hi = 100 * (mu + z * se);
  return { d, lo, hi, se: 100 * se, k: pairs.length, N, outcome: lo > -POOLED ? 'HELD' : hi < -POOLED ? 'FALSIFIED' : 'INCONCLUSIVE' };
}

/* P2: rows [{ id, w, ship, cand }] (bit arrays); the band, the exact one-sided McNemar p, Holm over the band, harm */
export function perHousehold(rows) {
  const out = rows.map(r => {
    const N = r.ship.length, c = cells(r.ship, r.cand), shipS = 100 * (c.a + c.b) / N, candS = 100 * (c.a + c.c) / N, change = 100 * (c.c - c.b) / N;
    const inBand = shipS >= BAND[0] && shipS <= BAND[1];
    return { id: r.id, w: r.w, N, ...c, shipS, candS, change, inBand, p: mcnemarHarmP(c.b, c.c), iv: survivalChangeU(c.a, c.b, c.c, c.d, LEVEL) };
  });
  const band = out.filter(x => x.inBand), adj = holm(band.map(x => x.p));
  band.forEach((x, i) => { x.pHolm = adj[i]; x.harm = x.pHolm < HARM_P && x.change <= -HARM_LOSS; });
  return out;
}

/* THE OUTCOME from P1 at each weight and P2 */
export function decide(pooled, rows) {
  const harmed = rows.filter(x => x.harm);
  if (harmed.length) return { outcome: 'HARM', decides: `the harmed households (${harmed.map(x => `${x.id} W${x.w}`).join(', ')}) go to V4's measures (D4); no new reader or reference variant opened on them; no Phase 4 until they read` };
  const fals = Object.entries(pooled).filter(([, p]) => p.outcome === 'FALSIFIED').map(([w]) => w), inc = Object.entries(pooled).filter(([, p]) => p.outcome === 'INCONCLUSIVE').map(([w]) => w);
  if (fals.length) return { outcome: 'POOLED FALSIFIED', decides: `not to Phase 4: the pooled change is below -${POOLED} at W${fals.join(', W')}; V4's measures on the floor households that lose most` };
  if (inc.length) return { outcome: 'POOLED INCONCLUSIVE', decides: `not a pass: the pooled interval straddles -${POOLED} at W${inc.join(', W')}; to the maintainer with the figures, no re-run on seed 7014` };
  return { outcome: 'PASS', decides: 'the candidate goes to Phase 4' };
}

/* the whole score per path from runPolicy's trace (reduce-7t.mjs scorePaths' arithmetic, the estate priced at the unit's weight) */
export function wholeScore(bs, w, Y, MU = 0.003) {
  const N = bs.survived.length, out = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let cut = 0, raise = 0;
    for (let t = 0; t < Y; t++) { const l = bs.level[i * Y + t] / 100; if (l > 0 && l < 1) cut += bs.lambda * (1 - l) ** 2; else if (l > 1) raise += MU * Math.sqrt(Math.min(0.2, l - 1)); }
    if (bs.failYear[i] >= 0) for (let t = bs.failYear[i]; t < Y; t++) if (bs.spendYears[t]) cut += bs.lambda * (1 - bs.floor) ** 2;
    const alive = bs.survived[i] === 1, est = alive ? Math.min(bs.wealth[i * Y + Y - 1], bs.capR) : 0;
    out[i] = 100 * ((alive ? 1 : 0) + w * est / bs.scale - cut + (alive ? raise : 0));
  }
  return out;
}
const pairedMean = (A, B) => { const n = A.length; let s = 0; for (let i = 0; i < n; i++) s += B[i] - A[i]; const m = s / n; let v = 0; for (let i = 0; i < n; i++) v += (B[i] - A[i] - m) ** 2; return { d: m, se: Math.sqrt(v / (n - 1) / n) }; };
const twoSidedExact = (x, y) => Math.min(1, 2 * binomUpperHalf(Math.max(x, y), x + y));

function load(dir, file) {
  const j = JSON.parse(gunzipSync(readFileSync(join(dir, file))).toString());
  const bs = j.beside, Y = j.Y;
  return { ...j, bits: bitsOf(j.survived), estateA: f32Of(j.estate), unmetA: f32Of(j.unmet), spendA: f32Of(j.spend), cutA: bitsOf(j.cut),
    bs: { ...bs, survived: bitsOf(bs.survived), level: bitsOf(bs.level), wealth: f32Of(bs.wealth), failYear: i16Of(bs.failYear) }, Y,
    worlds: (j.worlds || []).map(x => ({ ...x, bitsA: bitsOf(x.bits) })) };
}

async function read(dir, pre = false) {
  const P = await import('./panel-7uf.mjs'), E = await import('../engine.mjs'), { buildScenarios } = await import('../policy-study/scenarios.mjs');
  const all = buildScenarios(), prep = id => { const h = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 } })); };
  const needsDecomp = id => P.bridgeYears(E, prep(id)) > 0;
  // the launch's provenance first (fair-gate.mjs): every unit's log stamped by the launcher under the registration, the
  // registration unedited since, one code version across the logs
  if (!pre) requireFairLogs(Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => [f, readFileSync(join(dir, f), 'utf8')])), REGISTRATION);
  const units = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) { const j = load(dir, f); ((units[j.id] = units[j.id] || {})[j.w] = units[j.id][j.w] || {})[j.arm] = j; }
  const PANEL = pre ? P.PANEL.filter(id => units[id]) : P.PANEL, WEIGHTS = pre ? P.WEIGHTS.filter(w => PANEL.some(id => units[id][w])) : P.WEIGHTS;
  const problems = gate(units, PANEL, WEIGHTS, id => needsDecomp(id) || (pre && WEIGHTS.every(w => units[id][w] && units[id][w].DECOMP)));
  const any = Object.values(units).flatMap(x => Object.values(x)).flatMap(x => Object.values(x))[0];
  console.log(`7U-F READ: ${dir}; ${Object.keys(units).length} households; seed ${any ? any.seed : '-'}, ${any ? any.N : '-'} paths; stamp ${any ? JSON.stringify(any.stamp) : '-'}`);
  if (problems.length) { console.log(`THE GATE: NOT FAIR (${problems.length})`); problems.forEach(p => console.log(`  ${p}`)); console.log('No figure is read.'); process.exit(1); }
  if (!pre && (any.seed !== P.SEED || any.N !== P.N)) { console.log(`THE GATE: the files are seed ${any.seed}, ${any.N} paths, not the registration's ${P.SEED} and ${P.N}: not 7u-F's read`); process.exit(1); }
  console.log('THE GATE: fair (every unit present; each household\'s arms on the same seed, paths, stamps; settings differing only in the arm\'s own)');
  const f2 = x => x.toFixed(2), f3 = x => x.toFixed(3), f4 = x => x.toFixed(4), sgn = x => (x >= 0 ? '+' : '') + f3(x);
  // P1
  const pooled = {};
  for (const w of WEIGHTS) { const fl = P.floorOf(w).filter(id => PANEL.includes(id)); pooled[w] = pooledByPath(fl.map(id => ({ ship: units[id][w].SHIP.bits, cand: units[id][w].CAND.bits }))); }
  // P2
  const rows = perHousehold(PANEL.flatMap(id => WEIGHTS.map(w => ({ id, w, ship: units[id][w].SHIP.bits, cand: units[id][w].CAND.bits }))));
  const res = decide(pooled, rows);
  console.log('');
  for (const w of WEIGHTS) { const p = pooled[w]; console.log(`P1 at W${w}: the pooled change over the ${p.k} floor households ${sgn(p.d)} points (by path ${f3(p.lo)} to ${f3(p.hi)}, se ${f4(p.se)}): ${p.outcome}`); }
  console.log(`P2: ${rows.filter(x => x.inBand).length} household-weight pairs in the band [${BAND.join(', ')}], Holm over them; harmed: ${rows.filter(x => x.harm).map(x => `${x.id} W${x.w}`).join(', ') || 'none'}`);
  for (const x of rows) console.log(`  ${x.id.padEnd(6)} W${x.w}: SHIP ${f2(x.shipS)} CAND ${f2(x.candS)} change ${sgn(x.change)} (${f3(x.iv.lo)} to ${f3(x.iv.hi)}; ${x.c} saved, ${x.b} lost) ${x.inBand ? `p ${x.p.toExponential(2)} Holm ${x.pHolm.toExponential(2)}${x.harm ? ' HARM' : ''}` : 'outside the band: reported'}; at the margins ${MARGINS.map(mg => `${mg} ${x.iv.lo > -mg ? 'clear' : 'not clear'}`).join(', ')}`);
  console.log(`OUTCOME: ${res.outcome}: ${res.decides}`);
  // REPORTED
  console.log('\nREPORTED (not gating)');
  if (pre) for (const id of PANEL.filter(x => !needsDecomp(x))) for (const w of WEIGHTS) { const u = units[id][w]; if (!u.DECOMP) continue; const same = u.DECOMP.bits.every((b, i) => b === u.CAND.bits[i]) && u.DECOMP.table === u.CAND.table;
    console.log(`PREFLIGHT ${id} W${w}: no bridge years; DECOMP ${same ? 'is' : 'IS NOT'} CAND path for path (table ${u.CAND.table.toFixed(4)} and ${u.DECOMP.table.toFixed(4)})`); if (!same) process.exitCode = 1; }
  for (const id of PANEL) for (const w of WEIGHTS) {
    const u = units[id][w], S = u.SHIP, C = u.CAND, est = pairedMean(S.estateA, C.estateA), un = pairedMean(S.unmetA, C.unmetA), sp = pairedMean(S.spendA, C.spendA), ct = pairedMean(S.cutA, C.cutA);
    const NB = Math.min(S.NB, C.NB), wsS = wholeScore(S.bs, Number(w), S.Y), wsC = wholeScore(C.bs, Number(w), C.Y), ws = pairedMean(wsS.subarray(0, NB), wsC.subarray(0, NB));
    console.log(`  ${id.padEnd(6)} W${w}: estate ${sgn(est.d)} (se ${f3(est.se)}), unmet ${sgn(un.d)}, realised spend ${sgn(sp.d)}, years cut ${sgn(ct.d)}; whole score ${sgn(ws.d)} (se ${f4(ws.se)}) on ${NB} paths${S.bs.death || C.bs.death ? ' (a pension death charge: the whole score omits it)' : ''}`);
    console.log(`    the reader: ${C.readerYears || 0} bridge years read; the adaptive reference ${C.adaptive ? 'consulted' : 'not consulted (CAND is DECOMP here by construction)'}`);
    for (const [a, U] of [['SHIP', S], ['CAND', C], ...(u.DECOMP ? [['DECOMP', u.DECOMP]] : [])]) { const nb = U.NB; let eo = 0, po = 0; for (let i = 0; i < nb; i++) { if (U.bits[i] && !U.bs.survived[i]) eo++; if (U.bs.survived[i] && !U.bits[i]) po++; } const p = twoSidedExact(eo, po);
      console.log(`    fidelity ${a}: the engine alone ${eo}, runPolicy alone ${po} of ${nb} (two-sided exact p ${p.toFixed(4)})${p < 0.05 ? ' FIDELITY GAP' : ''}`); }
    if (u.DECOMP) {
      const D = u.DECOMP, cs = C.worlds.map((x, k) => cells(D.worlds[k].bitsA, x.bitsA)), mx = mixtureChange(cs, MIX3W), seedC = cells(D.bits, C.bits), iv = survivalChangeU(seedC.a, seedC.b, seedC.c, seedC.d, LEVEL);
      console.log(`    the reference's part (CAND less DECOMP): by the mixture ${sgn(mx.d)} (${f3(mx.lo)} to ${f3(mx.hi)}; by world ${mx.per.map(x => sgn(x.d)).join(', ')}); on the seed's paths ${sgn(iv.d)} (${f3(iv.lo)} to ${f3(iv.hi)}; ${seedC.c} saved, ${seedC.b} lost)`);
    }
    for (const [a, U] of [['CAND', C], ...(u.DECOMP ? [['DECOMP', u.DECOMP]] : [])]) console.log(`    by world ${a}: ${U.worlds.map((x, k) => { const n = x.bitsA.length, s = x.bitsA.reduce((t, v) => t + v, 0), [lo, hi] = wilson(s, n, zFor(LEVEL)); return `${k} table ${f2(x.table)} less the engine ${f2(x.sim)} = ${sgn(x.table - x.sim)} (the runs ${f2(100 * lo)} to ${f2(100 * hi)})`; }).join('; ')}`);
  }
}

/* PLANTED: the rule on synthetic units, each case the outcome it must read */
export function planted() {
  const mk = (N, surv, seed) => { const b = new Uint8Array(N); let s = seed; for (let i = 0; i < N; i++) { s = (s * 1103515245 + 12345) >>> 0; b[i] = (s / 4294967296) < surv ? 1 : 0; } return b; };
  // an arm from a control: flip `lose` of its survivors to failure and `save` of its failures to survival
  const arm = (ctrl, lose, save) => { const b = Uint8Array.from(ctrl); let l = 0, s = 0; for (let i = 0; i < b.length; i++) { if (b[i] && l < lose) { b[i] = 0; l++; } else if (!b[i] && s < save) { b[i] = 1; s++; } } return b; };
  const N = 16000, cases = [];
  const ship = [0.6, 0.9, 0.3].map((p, k) => mk(N, p, 11 + k));
  const pool = (ds) => pooledByPath(ship.map((s, k) => ({ ship: s, cand: arm(s, ds[k][0], ds[k][1]) })));
  cases.push(['P1: three households each 40 saved, 20 lost: HELD', pool([[20, 40], [20, 40], [20, 40]]).outcome, 'HELD']);
  cases.push(['P1: each 0 saved, 60 lost (-0.375 points): FALSIFIED', pool([[60, 0], [60, 0], [60, 0]]).outcome, 'FALSIFIED']);
  cases.push(['P1: each 0 saved, 16 lost (-0.1 points, its interval straddling -0.1): INCONCLUSIVE', pool([[16, 0], [16, 0], [16, 0]]).outcome, 'INCONCLUSIVE']);
  cases.push(['P1 EDGE: no change on any path: HELD, the interval a point', (p => `${p.outcome} ${p.lo === p.hi}`)(pool([[0, 0], [0, 0], [0, 0]])), 'HELD true']);
  const rowsOf = spec => perHousehold(spec.map(([id, p, lose, save], k) => { const s = mk(N, p, 101 + k); return { id, w: '0.02', ship: s, cand: arm(s, lose, save) }; }));
  const harmOf = rows => rows.filter(x => x.harm).map(x => x.id).join(',') || 'none';
  cases.push(['P2: a 2-point loss (320 lost, 0 saved) on one of five: HARM there only', harmOf(rowsOf([['A', 0.5, 320, 0], ['B', 0.5, 10, 10], ['C', 0.7, 0, 5], ['D', 0.8, 5, 0], ['E', 0.4, 0, 0]])), 'A']);
  cases.push(['P2: a significant loss under 1 point (150 lost, 0 saved, -0.94): not harm', harmOf(rowsOf([['A', 0.5, 150, 0], ['B', 0.5, 0, 0]])), 'none']);
  cases.push(['P2: a 2-point loss where SHIP survives 3% (outside the band): not gated', harmOf(rowsOf([['A', 0.03, 320, 0], ['B', 0.5, 0, 0]])), 'none']);
  cases.push(['P2 EDGE: SHIP at 99.8% (above the band) losing 1 point: not gated; at 99.4% (inside): harm', `${harmOf(rowsOf([['A', 0.998, 160, 0]]))} ${harmOf(rowsOf([['B', 0.994, 175, 0]]))}`, 'none B']);
  // a 1-point loss at p about 0.01 (2,440 lost, 2,280 saved: z 2.33): harm alone, not after Holm over twenty households
  cases.push(['P2 EDGE: a 1-point loss at p about 0.01: HARM alone; Holm over twenty households leaves it above 0.05: not harm', `${harmOf(rowsOf([['A', 0.5, 2440, 2280]]))} ${harmOf(rowsOf([['A', 0.5, 2440, 2280], ...Array.from({ length: 19 }, (_, k) => [`Z${k}`, 0.5, 0, 0])]))}`, 'A none']);
  const held = { '0.02': { outcome: 'HELD' }, '0.01': { outcome: 'HELD' } };
  cases.push(['OUTCOME: P1 HELD at both, no harm: PASS', decide(held, [{ harm: false }]).outcome, 'PASS']);
  cases.push(['OUTCOME: harm wins over a held pool: HARM', decide(held, [{ id: 'A', w: '0.02', harm: true }]).outcome, 'HARM']);
  cases.push(['OUTCOME: P1 FALSIFIED at one weight: POOLED FALSIFIED', decide({ ...held, '0.01': { outcome: 'FALSIFIED' } }, []).outcome, 'POOLED FALSIFIED']);
  cases.push(['OUTCOME: P1 INCONCLUSIVE at one weight: not a pass', decide({ ...held, '0.02': { outcome: 'INCONCLUSIVE' } }, []).outcome, 'POOLED INCONCLUSIVE']);
  // the gate
  const stamp = { code: 'c', audit: 'a', candidate: 'h', prediction: 'p', sha: 's' };
  const ran = (o = {}) => Object.entries({ mix: 3, pts: 30, seed: 7014, paths: 16000, bequestWeight: 0.02, bridgeRead: 'reader', readerRef: 'adaptive', readerSplit: 'rs', e3: true, ...o }).map(([k, v]) => `${k} ${v}`).join(' ');
  const U = (o = {}, r = {}) => ({ seed: 7014, N: 16000, stamp: { ...stamp, ...(o.stamp || {}) }, ran: ran(r), ...o, ...(o.stamp ? { stamp: { ...stamp, ...o.stamp } } : {}) });
  const g = (cand, dec, shp) => gate({ X: { '0.02': { CAND: cand, DECOMP: dec, SHIP: shp } } }, ['X'], ['0.02'], () => true).length;
  cases.push(['GATE: the three arms as registered: fair', g(U(), U({}, { readerRef: 'null' }), U({}, { bridgeRead: 'false', readerRef: 'null', readerSplit: 'null', e3: false })), 0]);
  cases.push(['GATE: DECOMP on another seed: refused', g(U(), U({ seed: 7002 }, { readerRef: 'null' }), U({}, { bridgeRead: 'false', readerRef: 'null', readerSplit: 'null', e3: false })) > 0, true]);
  cases.push(['GATE: SHIP at another grid (pts 20): refused', g(U(), U({}, { readerRef: 'null' }), U({}, { pts: 20, bridgeRead: 'false', readerRef: 'null', readerSplit: 'null', e3: false })) > 0, true]);
  cases.push(['GATE: DECOMP differing in e3 as well as readerRef: refused', g(U(), U({}, { readerRef: 'null', e3: false }), U({}, { bridgeRead: 'false', readerRef: 'null', readerSplit: 'null', e3: false })) > 0, true]);
  cases.push(['GATE: SHIP from another candidate hash: refused', g(U(), U({}, { readerRef: 'null' }), U({ stamp: { candidate: 'other' } }, { bridgeRead: 'false', readerRef: 'null', readerSplit: 'null', e3: false })) > 0, true]);
  cases.push(['GATE EDGE: a missing DECOMP unit: refused', gate({ X: { '0.02': { CAND: U(), SHIP: U() } } }, ['X'], ['0.02'], () => true).length > 0, true]);
  return cases;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--planted') {
    const cases = planted(); let bad = 0;
    for (const [what, got, want] of cases) { const okc = String(got) === String(want); if (!okc) bad++; console.log(`${okc ? 'ok  ' : 'FAIL'} ${what}: ${got}`); }
    console.log('EDGES: P1 no change (the interval a point), P2 at the band\'s top and inside it, P2 Holm over twenty, a missing unit');
    console.log(bad ? `PLANTED FAILED: ${bad} of ${cases.length}` : `PLANTED: all ${cases.length} cases read as written`);
    process.exit(bad ? 1 : 0);
  }
  const pre = process.argv[2] === '--preflight', dir = (pre ? process.argv[3] : process.argv[2]) || join(HERE, 'results', 'diag7uf');
  if (!existsSync(dir)) { console.error(`reduce-7uf: no ${dir}`); process.exit(2); }
  if (pre) console.log('=== THE PREFLIGHT: the tuning seed, not 7u-F\'s read ===');
  await read(dir, pre);
}
