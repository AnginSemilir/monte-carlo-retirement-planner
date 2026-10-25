/*
 * N4, THE RICHER MENU THROUGH V4'S ENSEMBLE (the external review of 21 Oct, Part B Step 6 N4; STATE.md D22: before N1, and
 * Phase 4 registers after it reads; research/solver/n4-design.md; EXPLORATORY, the tuning seed). V3's seven households, the
 * candidate solved with each of the three move kinds the product's menu lacks (src/solver/solve.js buildActions' menuPlus),
 * every policy simulated on V4's 8,000 paths of seed 7002, at 45 wealth points (the coarsest V3 accepts; the maintainer, 24
 * Oct: N4 at 45), at both estate weights:
 *   CAND          the assembled candidate at 45 points, on this code: checked bit for bit against V3's 45-point unit (the
 *                 code before N4), the identity of the product's menu at full scale, and the arm each kind is paired with
 *   CAND+HR       with a pension ceiling at the taper threshold, as a draw-first and a re-wrap ceiling
 *   CAND+MID      with the allowance's and the basic band's midpoints, likewise
 *   CAND+CGT      with the sale of the taxable account up to the capital gains exemption
 * The read (D4's targets, as V4 reads them): each kind's gain over CAND, paired on the paths, in the whole score (the
 * solver's own objective) and in survival, per household and on the panel mean, with its paired 95% interval. A kind
 * passes N4's bar where, at some weight, it beats the current menu by more than a target (0.2 points on the panel mean, 0.5
 * on a household, in either measure) beyond noise (the interval above nothing), and at neither weight loses more than 0.5
 * on a household beyond noise. Exploratory: a kind that passes goes to the maintainer; it does not join the candidate here
 * (CHECKLIST 1), and two that pass are tested together as a factorial first (D6).
 *   node research/solver/n4-menu.mjs <household> <variant> <weight>   one unit, to results/n4 (N4_OUT)
 *   node research/solver/n4-menu.mjs --units                          the units, one a line
 *   node research/solver/n4-menu.mjs --read [dir] [v3 dir]
 * HR DECOMPOSED (the maintainer, 25 Oct, D27: before HR joins the candidate, which of its halves earns its gain): on the two
 * households where it passed (S370, S248), at both weights, the candidate with HR, with its draw-first ceiling alone
 * (HRDRAW), with its re-wrap ceiling alone (HRWRAP), and without it, on the same paths and grid; CAND and CAND+HR checked
 * bit for bit against N4's own units (the code moved since: instruction 6 and the two kinds); each half's gain against
 * CAND and their interaction (HR less HRDRAW less HRWRAP plus CAND), paired by path.
 *   node research/solver/n4-menu.mjs --hr <household> <variant> <weight>   one unit, to results/n4hr (N4HR_OUT)
 *   node research/solver/n4-menu.mjs --units-hr                            its units
 *   node research/solver/n4-menu.mjs --read-hr [dir] [n4 dir]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUSEHOLDS } from './v3-convergence.mjs';
import { WEIGHTS, SEED, NPATHS, LAMBDA, MEAN_TOL, HH_TOL } from './v4-ensemble.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const VARIANTS = { CAND: [], 'CAND+HR': ['hr'], 'CAND+MID': ['mid'], 'CAND+CGT': ['cgt'], 'CAND+HRDRAW': ['hrdraw'], 'CAND+HRWRAP': ['hrwrap'] }, PTS = 45;
const N4_ARMS = ['CAND', 'CAND+HR', 'CAND+MID', 'CAND+CGT'], HR_ARMS = ['CAND', 'CAND+HR', 'CAND+HRDRAW', 'CAND+HRWRAP'], HR_HH = ['S370', 'S248'];
const OUT = process.env.N4_OUT || join(HERE, 'results', 'n4'), V3_DIR = process.env.V3_OUT || join(HERE, 'results', 'v3'), OUT_HR = process.env.N4HR_OUT || join(HERE, 'results', 'n4hr');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
export const UNITS = HOUSEHOLDS.flatMap(id => N4_ARMS.flatMap(v => WEIGHTS.map(w => `${id} ${v} ${w}`)));
export const unitFile = u => { const [id, v, w] = u.split(' '); return join(OUT, `${id}-${v}-w${w}.json.gz`); };
export const HR_UNITS = HR_HH.flatMap(id => HR_ARMS.flatMap(v => WEIGHTS.map(w => `${id} ${v} ${w}`)));
export const hrUnitFile = u => { const [id, v, w] = u.split(' '); return join(OUT_HR, `${id}-${v}-w${w}.json.gz`); };

async function unit(id, v, w, out = OUT) {
  if (!VARIANTS[v] || !WEIGHTS.includes(w)) { console.error(`n4: no variant ${v} or weight ${w}`); process.exit(2); }
  if (process.env.SOLVER_INTERP && process.env.SOLVER_INTERP !== 'logodds') { console.error('n4: runs with SOLVER_INTERP unset (the candidate\'s log-odds)'); process.exit(2); }
  const E = await import('../engine.mjs'), M = await import('../../src/solver/model.js'), S = await import('../../src/solver/solve.js');
  const C = await import('./candidate.mjs'), { buildScenarios } = await import('../policy-study/scenarios.mjs'), { makeTrace } = await import('./record.mjs'), { wholeScore } = await import('./reduce-7uf.mjs');
  const h = buildScenarios().find(s => s.id === id), code = execFileSync(process.execPath, [join(HERE, 'code-id.mjs')], { encoding: 'utf8' }).trim();
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const menuPlus = VARIANTS[v], base = { lambda: LAMBDA, points: PTS, bequestWeight: Number(w), ...(menuPlus.length ? { menuPlus } : {}) };
  const t0 = Date.now();
  const r = C.solveCandidate(E, M, plan, base);   // e3pcls guard: solveCandidate checks the pin itself
  const secs = (Date.now() - t0) / 1000, T = r.m.ctx.totalYears;
  const paths = E.pathsForSeed(SEED, NPATHS, T), tr = makeTrace(NPATHS, T + 1), surv = new Uint8Array(NPATHS);
  paths.forEach((zs, k) => { tr.row = k; if (S.runPolicy(r, Float64Array.from(zs), { trace: tr }).survived) surv[k] = 1; });
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: tr.Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  const ws = Float32Array.from(wholeScore(bs, Number(w), tr.Y)), sim = 100 * surv.reduce((a, x) => a + x, 0) / NPATHS;
  console.log(`n4 ${id} ${v} W${w}: menuPlus ${menuPlus.join('+') || '-'}, ${r.actions.length} moves, ${PTS} points; code ${code}; survival ${sim.toFixed(4)}, whole score ${(ws.reduce((a, x) => a + x, 0) / NPATHS).toFixed(4)} on ${NPATHS} (seed ${SEED}); solve ${Math.round(secs)} s`);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${id}-${v}-w${w}.json.gz`), gzipSync(JSON.stringify({ id, v, w, menuPlus, moves: r.actions.length, points: PTS, candidate: C.CANDIDATE_HASH, code, seed: SEED, N: NPATHS, sim, secs, survived: b64(surv), whole: b64(ws) })));
}

/* the paired change b - a over the paths, in the whole score and in survival points, each with its se */
export function paired(a, b) {
  const n = a.ws.length;
  let dw = 0, dw2 = 0, ds = 0, ds2 = 0;
  for (let i = 0; i < n; i++) { const x = b.ws[i] - a.ws[i], y = 100 * (b.bits[i] - a.bits[i]); dw += x; dw2 += x * x; ds += y; ds2 += y * y; }
  const mw = dw / n, ms = ds / n;
  return { w: mw, wse: Math.sqrt(Math.max(0, dw2 / n - mw * mw) / (n - 1)), s: ms, sse: Math.sqrt(Math.max(0, ds2 / n - ms * ms) / (n - 1)) };
}

function read(dir, v3dir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
  const sameBits = (a, b) => a.bits.length === b.bits.length && a.bits.every((x, i) => x === b.bits[i]) && a.ws.every((x, i) => Object.is(x, b.ws[i]));
  const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
  console.log(`N4 READ (EXPLORATORY, the tuning seed, ${PTS} wealth points): ${dir}, V3's ${PTS}-point units from ${v3dir}`);
  const loaded = [], kinds = N4_ARMS.filter(v => v !== 'CAND');
  let complete = true, identical = 0, compared = 0;
  const verdict = Object.fromEntries(kinds.map(k => [k, { beats: [], loses: [] }]));
  for (const w of WEIGHTS) {
    console.log(`AT W${w}:`);
    const per = Object.fromEntries(kinds.map(k => [k, []]));
    for (const id of HOUSEHOLDS) {
      const U = Object.fromEntries(N4_ARMS.map(v => [v, join(dir, `${id}-${v}-w${w}.json.gz`)]).filter(([, f]) => existsSync(f)).map(([v, f]) => [v, load(f)]));
      Object.values(U).forEach(x => loaded.push(x));
      const missing = N4_ARMS.filter(v => !U[v]);
      if (missing.length) { console.log(`  ${id}: missing ${missing.join(', ')}`); complete = false; }
      if (!U.CAND) continue;
      const v3 = join(v3dir, `${id}-p${PTS}-w${w}.json.gz`);
      if (existsSync(v3)) { compared++; if (sameBits(U.CAND, load(v3))) identical++; else console.log(`  ${id}: CAND on this code and V3's ${PTS}-point unit (the code before N4) DIFFER`); }
      else { console.log(`  ${id}: no V3 ${PTS}-point unit to check against`); complete = false; }
      const row = [];
      for (const k of kinds) {
        if (!U[k]) continue;
        const d = paired(U.CAND, U[k]); per[k].push({ id, ...d });
        row.push(`${k} ${U[k].sim.toFixed(2)}% (${U[k].moves} moves): score ${f3(d.w)} (se ${d.wse.toFixed(3)}), survival ${f3(d.s)} (se ${d.sse.toFixed(3)})`);
        for (const [x, se, what] of [[d.w, d.wse, 'score'], [d.s, d.sse, 'survival']]) {
          if (x > HH_TOL && x - 1.96 * se > 0) verdict[k].beats.push(`${id} W${w} ${what} ${f3(x)}`);
          if (x < -HH_TOL && x + 1.96 * se < 0) verdict[k].loses.push(`${id} W${w} ${what} ${f3(x)}`);
        }
      }
      console.log(`  ${id}: CAND ${U.CAND.sim.toFixed(2)}% | ${row.join(' | ')}`);
    }
    for (const k of kinds) {
      const L = per[k];
      if (L.length < HOUSEHOLDS.length) continue;
      // the panel mean's se from the households' independent paired se (each household's paths are its own draw)
      const mw = L.reduce((t, x) => t + x.w, 0) / L.length, ms = L.reduce((t, x) => t + x.s, 0) / L.length;
      const sw = Math.sqrt(L.reduce((t, x) => t + x.wse * x.wse, 0)) / L.length, ss = Math.sqrt(L.reduce((t, x) => t + x.sse * x.sse, 0)) / L.length;
      for (const [x, se, what] of [[mw, sw, 'score'], [ms, ss, 'survival']]) if (x > MEAN_TOL && x - 1.96 * se > 0) verdict[k].beats.push(`panel mean W${w} ${what} ${f3(x)}`);
      console.log(`  ${k} at W${w}: the panel mean gain ${f3(mw)} score (se ${sw.toFixed(3)}) and ${f3(ms)} survival (se ${ss.toFixed(3)}); the largest on a household ${f3(Math.max(...L.map(x => x.w)))} and ${f3(Math.max(...L.map(x => x.s)))}, the smallest ${f3(Math.min(...L.map(x => x.w)))} and ${f3(Math.min(...L.map(x => x.s)))}`);
    }
  }
  const codes = new Set(loaded.map(x => x.code)), seeds = new Set(loaded.map(x => `${x.seed}/${x.N}`)), cands = new Set(loaded.map(x => x.candidate)), pts = new Set(loaded.map(x => x.points));
  const fair = codes.size === 1 && seeds.size === 1 && cands.size === 1 && pts.size === 1 && pts.has(PTS);
  console.log(fair ? `the gate: one code (${[...codes][0]}), seed and paths ${[...seeds][0]}, candidate ${[...cands][0]}, ${PTS} points` : `NOT FAIR: the units differ in code (${[...codes].join(' ')}), seed and paths (${[...seeds].join(' ')}), candidate (${[...cands].join(' ')}) or points (${[...pts].join(' ')})`);
  console.log(`the product's menu at full scale: CAND on this code the same as V3's ${PTS}-point unit bit for bit on ${identical} of ${compared} household-weights`);
  for (const k of kinds) {
    const v = verdict[k], pass = v.beats.length > 0 && v.loses.length === 0;
    console.log(`${k}: ${pass ? 'PASSES N4\'s bar' : 'does not pass N4\'s bar'}: beyond the targets ${v.beats.length ? v.beats.join('; ') : 'nowhere'}; a household loss beyond 0.5 ${v.loses.length ? v.loses.join('; ') : 'nowhere'}`);
  }
  const ok = fair && complete && identical === compared && compared === HOUSEHOLDS.length * WEIGHTS.length;
  console.log(`N4: ${ok ? 'read complete' : 'NOT COMPLETE OR NOT FAIR (see above)'}; a kind that passes goes to the maintainer (exploratory: it does not join the candidate here)`);
  process.exit(ok ? 0 : 1);
}

/* HR decomposed (D27): each half's gain against CAND, and their interaction, on S370 and S248 at both weights */
function readHr(dir, n4dir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
  const sameBits = (a, b) => a.bits.length === b.bits.length && a.bits.every((x, i) => x === b.bits[i]) && a.ws.every((x, i) => Object.is(x, b.ws[i]));
  const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
  console.log(`N4'S HR DECOMPOSED (EXPLORATORY, the tuning seed, ${PTS} wealth points; D27): ${dir}, N4's units from ${n4dir}`);
  const loaded = [];
  let complete = true, identical = 0, compared = 0;
  for (const w of WEIGHTS) {
    console.log(`AT W${w}:`);
    for (const id of HR_HH) {
      const U = Object.fromEntries(HR_ARMS.map(v => [v, join(dir, `${id}-${v}-w${w}.json.gz`)]).filter(([, f]) => existsSync(f)).map(([v, f]) => [v, load(f)]));
      Object.values(U).forEach(x => loaded.push(x));
      const missing = HR_ARMS.filter(v => !U[v]);
      if (missing.length) { console.log(`  ${id}: missing ${missing.join(', ')}`); complete = false; continue; }
      // CAND and CAND+HR on this code against N4's own units (the code before instruction 6 and the two kinds)
      for (const v of ['CAND', 'CAND+HR']) { const f = join(n4dir, `${id}-${v}-w${w}.json.gz`); if (!existsSync(f)) { complete = false; continue; } compared++; if (sameBits(U[v], load(f))) identical++; else console.log(`  ${id}: ${v} on this code and N4's ${v} DIFFER`); }
      const C = U.CAND, n = C.ws.length, part = v => paired(C, U[v]);
      // the interaction, path by path: HR - HRDRAW - HRWRAP + CAND
      let s = 0, s2 = 0, q = 0, q2 = 0;
      for (let i = 0; i < n; i++) { const x = U['CAND+HR'].ws[i] - U['CAND+HRDRAW'].ws[i] - U['CAND+HRWRAP'].ws[i] + C.ws[i], y = 100 * (U['CAND+HR'].bits[i] - U['CAND+HRDRAW'].bits[i] - U['CAND+HRWRAP'].bits[i] + C.bits[i]); s += x; s2 += x * x; q += y; q2 += y * y; }
      const mi = s / n, mq = q / n, sei = Math.sqrt(Math.max(0, s2 / n - mi * mi) / (n - 1)), seq = Math.sqrt(Math.max(0, q2 / n - mq * mq) / (n - 1));
      const hr = part('CAND+HR'), dr = part('CAND+HRDRAW'), wr = part('CAND+HRWRAP');
      console.log(`  ${id}: CAND ${C.sim.toFixed(2)}%; against it, survival (se) / whole score (se): HR ${f3(hr.s)} (${hr.sse.toFixed(3)}) / ${f3(hr.w)} (${hr.wse.toFixed(3)}) | HRDRAW ${f3(dr.s)} (${dr.sse.toFixed(3)}) / ${f3(dr.w)} (${dr.wse.toFixed(3)}) | HRWRAP ${f3(wr.s)} (${wr.sse.toFixed(3)}) / ${f3(wr.w)} (${wr.wse.toFixed(3)}) | the interaction ${f3(mq)} (${seq.toFixed(3)}) / ${f3(mi)} (${sei.toFixed(3)}); HR's survival gain ${hr.s !== 0 ? `${(100 * dr.s / hr.s).toFixed(0)}% in HRDRAW alone, ${(100 * wr.s / hr.s).toFixed(0)}% in HRWRAP alone` : 'nothing to share'}`);
    }
  }
  const codes = new Set(loaded.map(x => x.code)), seeds = new Set(loaded.map(x => `${x.seed}/${x.N}`)), pts = new Set(loaded.map(x => x.points));
  const fair = codes.size === 1 && seeds.size === 1 && pts.size === 1 && pts.has(PTS);
  console.log(fair ? `the gate: one code (${[...codes][0]}), seed and paths ${[...seeds][0]}, ${PTS} points` : `NOT FAIR: the units differ in code (${[...codes].join(' ')}), seed and paths (${[...seeds].join(' ')}) or points (${[...pts].join(' ')})`);
  console.log(`N4's units reproduced on this code: CAND and CAND+HR the same bit for bit on ${identical} of ${compared} household-weight-arms`);
  const ok = fair && complete && identical === compared && compared === HR_HH.length * WEIGHTS.length * 2;
  console.log(`HR DECOMPOSED: ${ok ? 'read complete' : 'NOT COMPLETE OR NOT FAIR (see above)'}; exploratory, for the maintainer's call on HR (D27)`);
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--units') UNITS.forEach(u => console.log(u));
  else if (process.argv[2] === '--units-hr') HR_UNITS.forEach(u => console.log(u));
  else if (process.argv[2] === '--read-hr') readHr(process.argv[3] || OUT_HR, process.argv[4] || OUT);
  else if (process.argv[2] === '--hr') await unit(process.argv[3], process.argv[4], process.argv[5], OUT_HR);
  else if (process.argv[2] === '--read') read(process.argv[3] || OUT, process.argv[4] || V3_DIR);
  else await unit(process.argv[2], process.argv[3], process.argv[4]);
}
