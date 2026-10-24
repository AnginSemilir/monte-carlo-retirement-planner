/*
 * N4, THE RICHER MENU THROUGH V4'S ENSEMBLE (the external review of 21 Oct, Part B Step 6 N4; STATE.md D22: before N1, and
 * Phase 4 registers after it reads; research/solver/n4-design.md; EXPLORATORY, the tuning seed). V3's seven households, the
 * candidate solved with each of the three move kinds the product's menu lacks (src/solver/solve.js buildActions' menuPlus),
 * every policy simulated on V4's 8,000 paths of seed 7002 at V4's 30 wealth points, at both estate weights:
 *   CAND          the assembled candidate, on this code: checked bit for bit against V4's CAND unit (the code before N4),
 *                 the identity of the product's menu at full scale, and the arm each kind is paired with
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
 *   node research/solver/n4-menu.mjs --read [dir] [v4 dir]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUSEHOLDS } from './v3-convergence.mjs';
import { WEIGHTS, SEED, NPATHS, PTS, LAMBDA, MEAN_TOL, HH_TOL } from './v4-ensemble.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const VARIANTS = { CAND: [], 'CAND+HR': ['hr'], 'CAND+MID': ['mid'], 'CAND+CGT': ['cgt'] };
const OUT = process.env.N4_OUT || join(HERE, 'results', 'n4'), V4_DIR = process.env.V4_OUT || join(HERE, 'results', 'v4');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
export const UNITS = HOUSEHOLDS.flatMap(id => Object.keys(VARIANTS).flatMap(v => WEIGHTS.map(w => `${id} ${v} ${w}`)));
export const unitFile = u => { const [id, v, w] = u.split(' '); return join(OUT, `${id}-${v}-w${w}.json.gz`); };

async function unit(id, v, w) {
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
  console.log(`n4 ${id} ${v} W${w}: menuPlus ${menuPlus.join('+') || '-'}, ${r.actions.length} moves; code ${code}; survival ${sim.toFixed(4)}, whole score ${(ws.reduce((a, x) => a + x, 0) / NPATHS).toFixed(4)} on ${NPATHS} (seed ${SEED}); solve ${Math.round(secs)} s`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id}-${v}-w${w}.json.gz`), gzipSync(JSON.stringify({ id, v, w, menuPlus, moves: r.actions.length, candidate: C.CANDIDATE_HASH, code, seed: SEED, N: NPATHS, sim, secs, survived: b64(surv), whole: b64(ws) })));
}

/* the paired change b - a over the paths, in the whole score and in survival points, each with its se */
export function paired(a, b) {
  const n = a.ws.length;
  let dw = 0, dw2 = 0, ds = 0, ds2 = 0;
  for (let i = 0; i < n; i++) { const x = b.ws[i] - a.ws[i], y = 100 * (b.bits[i] - a.bits[i]); dw += x; dw2 += x * x; ds += y; ds2 += y * y; }
  const mw = dw / n, ms = ds / n;
  return { w: mw, wse: Math.sqrt(Math.max(0, dw2 / n - mw * mw) / (n - 1)), s: ms, sse: Math.sqrt(Math.max(0, ds2 / n - ms * ms) / (n - 1)) };
}

function read(dir, v4dir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
  const sameBits = (a, b) => a.bits.length === b.bits.length && a.bits.every((x, i) => x === b.bits[i]) && a.ws.every((x, i) => Object.is(x, b.ws[i]));
  const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
  console.log(`N4 READ (EXPLORATORY, the tuning seed): ${dir}, V4's CAND units from ${v4dir}`);
  const loaded = [], kinds = Object.keys(VARIANTS).filter(v => v !== 'CAND');
  let complete = true, identical = 0, compared = 0;
  const verdict = Object.fromEntries(kinds.map(k => [k, { beats: [], loses: [] }]));
  for (const w of WEIGHTS) {
    console.log(`AT W${w}:`);
    const per = Object.fromEntries(kinds.map(k => [k, []]));
    for (const id of HOUSEHOLDS) {
      const U = Object.fromEntries(Object.keys(VARIANTS).map(v => [v, join(dir, `${id}-${v}-w${w}.json.gz`)]).filter(([, f]) => existsSync(f)).map(([v, f]) => [v, load(f)]));
      Object.values(U).forEach(x => loaded.push(x));
      const missing = Object.keys(VARIANTS).filter(v => !U[v]);
      if (missing.length) { console.log(`  ${id}: missing ${missing.join(', ')}`); complete = false; }
      if (!U.CAND) continue;
      const v4 = join(v4dir, `${id}-CAND-w${w}.json.gz`);
      if (existsSync(v4)) { compared++; if (sameBits(U.CAND, load(v4))) identical++; else console.log(`  ${id}: CAND on this code and V4's CAND (the code before N4) DIFFER`); }
      else { console.log(`  ${id}: no V4 CAND unit to check against`); complete = false; }
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
  const codes = new Set(loaded.map(x => x.code)), seeds = new Set(loaded.map(x => `${x.seed}/${x.N}`)), cands = new Set(loaded.map(x => x.candidate));
  const fair = codes.size === 1 && seeds.size === 1 && cands.size === 1;
  console.log(fair ? `the gate: one code (${[...codes][0]}), seed and paths ${[...seeds][0]}, candidate ${[...cands][0]}` : `NOT FAIR: the units differ in code (${[...codes].join(' ')}), seed and paths (${[...seeds].join(' ')}) or candidate (${[...cands].join(' ')})`);
  console.log(`the product's menu at full scale: CAND on this code the same as V4's CAND bit for bit on ${identical} of ${compared} household-weights`);
  for (const k of kinds) {
    const v = verdict[k], pass = v.beats.length > 0 && v.loses.length === 0;
    console.log(`${k}: ${pass ? 'PASSES N4\'s bar' : 'does not pass N4\'s bar'}: beyond the targets ${v.beats.length ? v.beats.join('; ') : 'nowhere'}; a household loss beyond 0.5 ${v.loses.length ? v.loses.join('; ') : 'nowhere'}`);
  }
  const ok = fair && complete && identical === compared && compared === HOUSEHOLDS.length * WEIGHTS.length;
  console.log(`N4: ${ok ? 'read complete' : 'NOT COMPLETE OR NOT FAIR (see above)'}; a kind that passes goes to the maintainer (exploratory: it does not join the candidate here)`);
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--units') UNITS.forEach(u => console.log(u));
  else if (process.argv[2] === '--read') read(process.argv[3] || OUT, process.argv[4] || V4_DIR);
  else await unit(process.argv[2], process.argv[3], process.argv[4]);
}
