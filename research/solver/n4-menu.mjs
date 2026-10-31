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
 * THE THIRD TIER STEP'S FACTORIAL (STATE.md D28; THIRD-STEP.md step 3; D6: HR and the step both help S370, so they are tested
 * together before either joins): V3's seven households, both weights, 45 points, V4's 8,000 paths of seed 7002 (56 units):
 *   CAND, CAND+HR    as N4's, on this code: checked bit for bit against N4's own units (the identity at full scale)
 *   CAND+T3          the candidate with the third joint tier step down (`tiersBelow: 3`, fast.js tiersFor)
 *   CAND+HR+T3       both; HR is HR whole, as the maintainer settled D27
 * The read (N4's bar, `bar` below): each arm against CAND; CAND+HR+T3 against CAND+HR (the step's own gain, HR in); the
 * interaction (HR+T3 less HR less T3 plus CAND), paired by path. THE DECISION RULE, committed before launch in the form
 * THIRD-STEP.md gives it: the step joins if CAND+HR+T3 beats CAND+HR beyond N4's bar at some weight - beyond noise (its
 * paired 95% interval above nothing), by more than 0.2 on the panel mean or 0.5 on a household, in survival or the whole
 * score - and loses more than 0.5 beyond noise on no household at either weight. If HR does not join, CAND+T3 against
 * CAND is read the same way. The read prints both verdicts; which one decides is the maintainer's call on HR. Exploratory
 * (CHECKLIST 1): a pass goes to the candidate only by D28, through the reviewer (THIRD-STEP.md step 4).
 *   node research/solver/n4-menu.mjs --t3 <household> <variant> <weight>   one unit, to results/n4t3 (N4T3_OUT)
 *   node research/solver/n4-menu.mjs --units-t3                            its units
 *   node research/solver/n4-menu.mjs --read-t3 [dir] [n4 dir]
 *   node research/solver/n4-menu.mjs --planted                             the bar's planted checks alone
 * THE TABLE WITHOUT THE DEALING COST, CHECKED (STATE.md D30; SPEED-PORT.md step 3; EXPLORATORY, D6): CAND+HR+T3 (the
 * candidate as D29 left it: the factorial's units, which stand as the first arm once the port reproduces them bit for bit -
 * step 2.1, two of them re-run on the ported code into results/n4nd-id) against CAND+HR+T3+ND, the same with
 * `tableDealing: false` (E5 on), on V3's seven households, both weights, 45 points, V4's 8,000 paths of seed 7002 (14 units).
 * THE DECISION RULE, committed before launch in the form SPEED-PORT.md gives it (ndRule below): the option joins if, at
 * both weights, no household loses more than 0.5 points beyond noise (its paired 95% interval below nothing) in survival or
 * the whole score, and the panel mean's paired 95% interval has its lower end above -0.2 in both. Otherwise it goes back to
 * the maintainer. The prediction: every household within noise; the panel mean within 0.1 either way; the solve about a
 * third of the first arm's. Exploratory: a pass changes the candidate only by D30, through the reviewer (step 4).
 *   node research/solver/n4-menu.mjs --nd <household> <weight>               one ND unit, to results/n4nd (N4ND_OUT)
 *   node research/solver/n4-menu.mjs --nd-id <household> <weight>            CAND+HR+T3 on this code, to results/n4nd-id
 *   node research/solver/n4-menu.mjs --units-nd                              the ND units
 *   node research/solver/n4-menu.mjs --read-nd [dir] [factorial dir] [identity dir]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUSEHOLDS } from './v3-convergence.mjs';
import { WEIGHTS, SEED, NPATHS, LAMBDA, MEAN_TOL, HH_TOL } from './v4-ensemble.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const VARIANTS = { CAND: [], 'CAND+HR': ['hr'], 'CAND+MID': ['mid'], 'CAND+CGT': ['cgt'], 'CAND+HRDRAW': ['hrdraw'], 'CAND+HRWRAP': ['hrwrap'], 'CAND+T3': [], 'CAND+HR+T3': ['hr'], 'CAND+HR+T3+ND': ['hr'] }, PTS = 45;
export const BELOW = { 'CAND+T3': 3, 'CAND+HR+T3': 3, 'CAND+HR+T3+ND': 3 };   // D28's factorial: the arms with the third tier step (tiersBelow)
export const EXTRA = { 'CAND+HR+T3+ND': { tableDealing: false } };   // D30's check: the table without the dealing cost
const N4_ARMS = ['CAND', 'CAND+HR', 'CAND+MID', 'CAND+CGT'], HR_ARMS = ['CAND', 'CAND+HR', 'CAND+HRDRAW', 'CAND+HRWRAP'], HR_HH = ['S370', 'S248'], T3_ARMS = ['CAND', 'CAND+HR', 'CAND+T3', 'CAND+HR+T3'];
const OUT_ND = process.env.N4ND_OUT || join(HERE, 'results', 'n4nd'), OUT_NDID = process.env.N4NDID_OUT || join(HERE, 'results', 'n4nd-id'), ND_ID = [['S370', '0.02'], ['S224', '0.01']];
const OUT = process.env.N4_OUT || join(HERE, 'results', 'n4'), V3_DIR = process.env.V3_OUT || join(HERE, 'results', 'v3'), OUT_HR = process.env.N4HR_OUT || join(HERE, 'results', 'n4hr'), OUT_T3 = process.env.N4T3_OUT || join(HERE, 'results', 'n4t3');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
export const UNITS = HOUSEHOLDS.flatMap(id => N4_ARMS.flatMap(v => WEIGHTS.map(w => `${id} ${v} ${w}`)));
export const unitFile = u => { const [id, v, w] = u.split(' '); return join(OUT, `${id}-${v}-w${w}.json.gz`); };
export const HR_UNITS = HR_HH.flatMap(id => HR_ARMS.flatMap(v => WEIGHTS.map(w => `${id} ${v} ${w}`)));
export const hrUnitFile = u => { const [id, v, w] = u.split(' '); return join(OUT_HR, `${id}-${v}-w${w}.json.gz`); };
export const T3_UNITS = HOUSEHOLDS.flatMap(id => T3_ARMS.flatMap(v => WEIGHTS.map(w => `${id} ${v} ${w}`)));
export const t3UnitFile = u => { const [id, v, w] = u.split(' '); return join(OUT_T3, `${id}-${v}-w${w}.json.gz`); };
export const ND_UNITS = HOUSEHOLDS.flatMap(id => WEIGHTS.map(w => `${id} ${w}`));
export const ndUnitFile = u => { const [id, w] = u.split(' '); return join(OUT_ND, `${id}-CAND+HR+T3+ND-w${w}.json.gz`); };

async function unit(id, v, w, out = OUT) {
  if (!VARIANTS[v] || !WEIGHTS.includes(w)) { console.error(`n4: no variant ${v} or weight ${w}`); process.exit(2); }
  if (process.env.SOLVER_INTERP && process.env.SOLVER_INTERP !== 'logodds') { console.error('n4: runs with SOLVER_INTERP unset (the candidate\'s log-odds)'); process.exit(2); }
  const E = await import('../engine.mjs'), M = await import('../../src/solver/model.js'), S = await import('../../src/solver/solve.js');
  const C = await import('./candidate.mjs'), { buildScenarios } = await import('../policy-study/scenarios.mjs'), { makeTrace } = await import('./record.mjs'), { wholeScore } = await import('./reduce-7uf.mjs');
  const h = buildScenarios().find(s => s.id === id), code = execFileSync(process.execPath, [join(HERE, 'code-id.mjs')], { encoding: 'utf8' }).trim();
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const menuPlus = VARIANTS[v], base = { lambda: LAMBDA, points: PTS, bequestWeight: Number(w), ...(menuPlus.length ? { menuPlus } : {}), ...(BELOW[v] ? { tiersBelow: BELOW[v] } : {}), ...(EXTRA[v] || {}) };
  const t0 = Date.now();
  // 7u-F's candidate (ASSEMBLED_OPTS: candidate.json less the menu keys D28 and D29 added), so CAND and each arm mean what
  // they meant when N4, HR decomposed and the factorial ran; e3pcls guard: solveCandidate checks the pin itself
  const r = C.solveCandidate(E, M, plan, base, C.ASSEMBLED_OPTS);
  const secs = (Date.now() - t0) / 1000, T = r.m.ctx.totalYears;
  const paths = E.pathsForSeed(SEED, NPATHS, T), tr = makeTrace(NPATHS, T + 1), surv = new Uint8Array(NPATHS);
  paths.forEach((zs, k) => { tr.row = k; if (S.runPolicy(r, Float64Array.from(zs), { trace: tr }).survived) surv[k] = 1; });
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: tr.Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  const ws = Float32Array.from(wholeScore(bs, Number(w), tr.Y)), sim = 100 * surv.reduce((a, x) => a + x, 0) / NPATHS;
  console.log(`n4 ${id} ${v} W${w}: menuPlus ${menuPlus.join('+') || '-'}, tiersBelow ${r.meta.tiersBelow}, tableDealing ${r.meta.tableDealing}, tsOnce ${r.meta.tsOnce}, ${r.actions.length} moves, ${PTS} points; code ${code}; survival ${sim.toFixed(4)}, whole score ${(ws.reduce((a, x) => a + x, 0) / NPATHS).toFixed(4)} on ${NPATHS} (seed ${SEED}); solve ${Math.round(secs)} s`);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${id}-${v}-w${w}.json.gz`), gzipSync(JSON.stringify({ id, v, w, menuPlus, tiersBelow: r.meta.tiersBelow, tableDealing: r.meta.tableDealing, tsOnce: r.meta.tsOnce, moves: r.actions.length, points: PTS, candidate: C.ASSEMBLED_HASH, code, seed: SEED, N: NPATHS, sim, secs, survived: b64(surv), whole: b64(ws) })));
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

/*
 * N4'S BAR on one contrast (the factorial's read; the same tests as read() above): `per` maps each weight to its households'
 * paired changes { id, w, wse, s, sse } (score and survival points, each with its se). It beats where, at some weight, a
 * household gains more than HH_TOL, or the panel mean (every household present; its se from the households' independent se)
 * more than MEAN_TOL, with the paired 95% interval above nothing, in either measure; it loses where a household loses more
 * than HH_TOL with the interval below nothing. It passes when it beats somewhere and loses nowhere. A gain or loss of exactly
 * the target is not more than it. (`meanTol` is a parameter only so the planted edge can sit exactly on a target binary
 * floating point holds: 0.2 is not one.)
 */
export function bar(per, nHouseholds = HOUSEHOLDS.length, meanTol = MEAN_TOL) {
  const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), beats = [], loses = [], means = {};
  for (const [w, L] of Object.entries(per)) {
    for (const d of L) for (const [x, se, what] of [[d.w, d.wse, 'score'], [d.s, d.sse, 'survival']]) {
      if (x > HH_TOL && x - 1.96 * se > 0) beats.push(`${d.id} W${w} ${what} ${f3(x)}`);
      if (x < -HH_TOL && x + 1.96 * se < 0) loses.push(`${d.id} W${w} ${what} ${f3(x)}`);
    }
    if (L.length < nHouseholds) continue;
    const mw = L.reduce((t, x) => t + x.w, 0) / L.length, ms = L.reduce((t, x) => t + x.s, 0) / L.length;
    const sw = Math.sqrt(L.reduce((t, x) => t + x.wse * x.wse, 0)) / L.length, ss = Math.sqrt(L.reduce((t, x) => t + x.sse * x.sse, 0)) / L.length;
    means[w] = { w: mw, wse: sw, s: ms, sse: ss, hiW: Math.max(...L.map(x => x.w)), hiS: Math.max(...L.map(x => x.s)), loW: Math.min(...L.map(x => x.w)), loS: Math.min(...L.map(x => x.s)) };
    for (const [x, se, what] of [[mw, sw, 'score'], [ms, ss, 'survival']]) if (x > meanTol && x - 1.96 * se > 0) beats.push(`panel mean W${w} ${what} ${f3(x)}`);
  }
  return { beats, loses, means, pass: beats.length > 0 && loses.length === 0 };
}

/* the factorial (D28): each arm against CAND, CAND+HR+T3 against CAND+HR, the interaction; both decision readings */
const T3_CONTRASTS = [['CAND+HR', 'CAND'], ['CAND+T3', 'CAND'], ['CAND+HR+T3', 'CAND'], ['CAND+HR+T3', 'CAND+HR']];
function readT3(dir, n4dir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
  const sameBits = (a, b) => a.bits.length === b.bits.length && a.bits.every((x, i) => x === b.bits[i]) && a.ws.every((x, i) => Object.is(x, b.ws[i]));
  const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), nm = ([b, a]) => `${b.replace('CAND+', '')} - ${a.replace('CAND+', '')}`;
  console.log(`THE THIRD TIER STEP'S FACTORIAL (EXPLORATORY, the tuning seed, ${PTS} wealth points; D28, THIRD-STEP.md step 3): ${dir}, N4's units from ${n4dir}`);
  const loaded = [], per = Object.fromEntries(T3_CONTRASTS.map(c => [nm(c), Object.fromEntries(WEIGHTS.map(w => [w, []]))])), inter = Object.fromEntries(WEIGHTS.map(w => [w, []]));
  let complete = true, identical = 0, compared = 0;
  for (const w of WEIGHTS) {
    console.log(`AT W${w} (survival points (se) / whole score (se), paired by path):`);
    for (const id of HOUSEHOLDS) {
      const U = Object.fromEntries(T3_ARMS.map(v => [v, join(dir, `${id}-${v}-w${w}.json.gz`)]).filter(([, f]) => existsSync(f)).map(([v, f]) => [v, load(f)]));
      Object.values(U).forEach(x => loaded.push(x));
      const missing = T3_ARMS.filter(v => !U[v]);
      if (missing.length) { console.log(`  ${id}: missing ${missing.join(', ')}`); complete = false; continue; }
      // CAND and CAND+HR on this code against N4's own units (the code before the third step): the identity at full scale
      for (const v of ['CAND', 'CAND+HR']) { const f = join(n4dir, `${id}-${v}-w${w}.json.gz`); if (!existsSync(f)) { console.log(`  ${id}: no N4 unit for ${v}`); complete = false; continue; } compared++; if (sameBits(U[v], load(f))) identical++; else console.log(`  ${id}: ${v} on this code and N4's ${v} DIFFER`); }
      const row = [];
      for (const c of T3_CONTRASTS) { const d = paired(U[c[1]], U[c[0]]); per[nm(c)][w].push({ id, ...d }); row.push(`${nm(c)} ${f3(d.s)} (${d.sse.toFixed(3)}) / ${f3(d.w)} (${d.wse.toFixed(3)})`); }
      // the interaction, path by path: HR+T3 - HR - T3 + CAND
      const C = U.CAND, n = C.ws.length; let a = 0, a2 = 0, q = 0, q2 = 0;
      for (let i = 0; i < n; i++) { const x = U['CAND+HR+T3'].ws[i] - U['CAND+HR'].ws[i] - U['CAND+T3'].ws[i] + C.ws[i], y = 100 * (U['CAND+HR+T3'].bits[i] - U['CAND+HR'].bits[i] - U['CAND+T3'].bits[i] + C.bits[i]); a += x; a2 += x * x; q += y; q2 += y * y; }
      const mi = a / n, mq = q / n, sei = Math.sqrt(Math.max(0, a2 / n - mi * mi) / (n - 1)), seq = Math.sqrt(Math.max(0, q2 / n - mq * mq) / (n - 1));
      inter[w].push({ id, w: mi, wse: sei, s: mq, sse: seq });
      console.log(`  ${id}: CAND ${C.sim.toFixed(2)}% (${C.moves} moves), HR ${U['CAND+HR'].moves}, T3 ${U['CAND+T3'].moves}, HR+T3 ${U['CAND+HR+T3'].moves} moves (tiersBelow ${U['CAND+T3'].tiersBelow}); solve ${Math.round(C.secs)} / ${Math.round(U['CAND+HR'].secs)} / ${Math.round(U['CAND+T3'].secs)} / ${Math.round(U['CAND+HR+T3'].secs)} s`);
      console.log(`    ${row.join(' | ')} | the interaction ${f3(mq)} (${seq.toFixed(3)}) / ${f3(mi)} (${sei.toFixed(3)})`);
    }
  }
  // the solve's cost against CAND's, unit by unit (four units ran at a time, so a guide for gate 5, not its measurement)
  const secs = Object.fromEntries(T3_ARMS.map(v => [v, loaded.filter(x => x.v === v)])), med = a => { const q = [...a].sort((x, y) => x - y); return q.length % 2 ? q[q.length >> 1] : (q[q.length / 2 - 1] + q[q.length / 2]) / 2; };
  const ratio = v => secs[v].map(x => x.secs / secs.CAND.find(c => c.id === x.id && c.w === x.w).secs);
  if (complete) console.log(`THE SOLVE against CAND's (four units at a time on four cores: a guide for gate 5, not its measurement), the median over the ${secs.CAND.length} household-weights and the range: ${T3_ARMS.slice(1).map(v => { const r = ratio(v); return `${v.replace('CAND+', '')} x${med(r).toFixed(2)} (x${Math.min(...r).toFixed(2)} to x${Math.max(...r).toFixed(2)})`; }).join(', ')}`);
  const verdicts = {};
  console.log('THE PANEL (the mean over the seven households, its se from theirs; the largest and smallest on a household):');
  for (const c of [...T3_CONTRASTS.map(nm), 'interaction']) {
    const v = c === 'interaction' ? bar(inter) : bar(per[c]); verdicts[c] = v;
    for (const w of WEIGHTS) { const m = v.means[w]; if (m) console.log(`  ${c.padEnd(10)} W${w}: survival ${f3(m.s)} (se ${m.sse.toFixed(3)}) / score ${f3(m.w)} (se ${m.wse.toFixed(3)}); on a household survival ${f3(m.loS)} to ${f3(m.hiS)}, score ${f3(m.loW)} to ${f3(m.hiW)}`); }
  }
  const codes = new Set(loaded.map(x => x.code)), seeds = new Set(loaded.map(x => `${x.seed}/${x.N}`)), cands = new Set(loaded.map(x => x.candidate)), pts = new Set(loaded.map(x => x.points));
  const belowOk = loaded.every(x => x.tiersBelow === (BELOW[x.v] || 2));
  const fair = codes.size === 1 && seeds.size === 1 && cands.size === 1 && pts.size === 1 && pts.has(PTS) && belowOk;
  console.log(fair ? `the gate: one code (${[...codes][0]}), seed and paths ${[...seeds][0]}, candidate ${[...cands][0]}, ${PTS} points; tiersBelow 3 on the T3 arms and 2 on the others, as each unit recorded` : `NOT FAIR: the units differ in code (${[...codes].join(' ')}), seed and paths (${[...seeds].join(' ')}), candidate (${[...cands].join(' ')}) or points (${[...pts].join(' ')}), or a unit's tiersBelow is not its arm's (${belowOk ? 'all as they should be' : 'some not'})`);
  console.log(`N4's units reproduced on this code: CAND and CAND+HR the same bit for bit on ${identical} of ${compared} household-weight-arms`);
  for (const c of T3_CONTRASTS.map(nm)) { const v = verdicts[c]; console.log(`${c}: ${v.pass ? 'PASSES N4\'s bar' : 'does not pass N4\'s bar'}: beyond the targets ${v.beats.length ? v.beats.join('; ') : 'nowhere'}; a household loss beyond 0.5 ${v.loses.length ? v.loses.join('; ') : 'nowhere'}`); }
  const ok = fair && complete && identical === compared && compared === HOUSEHOLDS.length * WEIGHTS.length * 2;
  if (!ok) { console.log('THE FACTORIAL: NOT COMPLETE OR NOT FAIR (see above); not read'); process.exit(1); }
  const withHr = verdicts['HR+T3 - HR'], alone = verdicts['T3 - CAND'];
  console.log(`DECISION (D28, the rule committed before launch): with HR in the candidate, CAND+HR+T3 against CAND+HR ${withHr.pass ? 'PASSES: the third step joins' : 'does not pass: the third step goes back to the maintainer'}; without HR, CAND+T3 against CAND ${alone.pass ? 'PASSES: the third step joins' : 'does not pass: the third step goes back to the maintainer'}. Which reading decides is the maintainer's call on HR (D27)`);
  process.exit(0);
}

/* the bar's planted checks: built households with one fault each (CHECKLIST 5) */
function planted() {
  const hh = (o = {}) => HOUSEHOLDS.map(id => ({ id, w: 0, wse: 0.05, s: 0, sse: 0.05, ...(o[id] || {}) })), both = o => Object.fromEntries(WEIGHTS.map(w => [w, hh(o)]));
  const one = (o, w = WEIGHTS[0]) => ({ ...Object.fromEntries(WEIGHTS.map(x => [x, hh()])), [w]: hh(o) });
  const cases = [
    ['nothing anywhere: does not pass', bar(both()).pass, false],
    ['a household +0.6 survival beyond noise: passes', bar(one({ S370: { s: 0.6, sse: 0.1 } })).pass, true],
    ['a household +0.6 inside noise (se 0.4): does not pass', bar(one({ S370: { s: 0.6, sse: 0.4 } })).pass, false],
    ['a household at exactly +0.5: not more than the target', bar(one({ S370: { s: 0.5, sse: 0.01 } })).pass, false],
    ['the panel mean +0.25 score beyond noise: passes', bar(one(Object.fromEntries(HOUSEHOLDS.map(id => [id, { w: 0.25, wse: 0.05 }])))).pass, true],
    ['the panel mean +0.25 inside noise (its se 0.38): does not pass', bar(one(Object.fromEntries(HOUSEHOLDS.map(id => [id, { w: 0.25, wse: 1 }])))).pass, false],
    ['the panel mean exactly at its target (0.25 here, exact in floating point): not more than it', bar(one(Object.fromEntries(HOUSEHOLDS.map(id => [id, { w: 0.25, wse: 0.001 }]))), HOUSEHOLDS.length, 0.25).pass, false],
    ['a gain at one weight, a household -0.6 beyond noise at the other: does not pass', bar({ [WEIGHTS[0]]: hh({ S370: { s: 0.9, sse: 0.1 } }), [WEIGHTS[1]]: hh({ S224: { w: -0.6, wse: 0.05 } }) }).pass, false],
    ['a household -0.6 inside noise (se 0.4) beside a gain: passes (not a loss beyond noise)', bar({ [WEIGHTS[0]]: hh({ S370: { s: 0.9, sse: 0.1 } }), [WEIGHTS[1]]: hh({ S224: { s: -0.6, sse: 0.4 } }) }).pass, true],
    ['a household at exactly -0.5 beside a gain: passes (not a loss beyond the target)', bar({ [WEIGHTS[0]]: hh({ S370: { s: 0.9, sse: 0.1 } }), [WEIGHTS[1]]: hh({ S224: { s: -0.5, sse: 0.01 } }) }).pass, true],
    ['a household missing: the panel mean not read', bar({ [WEIGHTS[0]]: hh(Object.fromEntries(HOUSEHOLDS.map(id => [id, { w: 0.4, wse: 0.05 }]))).slice(1), [WEIGHTS[1]]: hh() }).beats.some(b => b.startsWith('panel')), false]
  ];
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([n, got, want]) => `${n}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}

/*
 * D30'S RULE (SPEED-PORT.md step 3) on the paired changes ND less HR+T3: `per` maps each weight to its households' { id, w,
 * wse, s, sse } (score and survival points, each with its se). Harm: a household losing more than HH_TOL with its paired 95%
 * interval below nothing, in either measure at either weight. The panel: at each weight and in each measure, the mean's
 * paired 95% interval (its se from the households' independent se) has its lower end above -floor. It joins when there is
 * no harm and every panel lower end clears; a loss of exactly the target is not more than it, a lower end exactly at the
 * floor does not clear it. (`floor` is a parameter only so the planted edge can sit exactly on a target floating point
 * holds: 0.2 is not one.)
 */
export function ndRule(per, nHouseholds = HOUSEHOLDS.length, floor = MEAN_TOL) {
  const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), harm = [], panel = [];
  let complete = true;
  for (const [w, L] of Object.entries(per)) {
    for (const d of L) for (const [x, se, what] of [[d.w, d.wse, 'score'], [d.s, d.sse, 'survival']]) if (x < -HH_TOL && x + 1.96 * se < 0) harm.push(`${d.id} W${w} ${what} ${f3(x)} (se ${se.toFixed(3)})`);
    if (L.length < nHouseholds) { complete = false; continue; }
    const mw = L.reduce((t, x) => t + x.w, 0) / L.length, ms = L.reduce((t, x) => t + x.s, 0) / L.length;
    const sw = Math.sqrt(L.reduce((t, x) => t + x.wse * x.wse, 0)) / L.length, ss = Math.sqrt(L.reduce((t, x) => t + x.sse * x.sse, 0)) / L.length;
    for (const [x, se, what] of [[ms, ss, 'survival'], [mw, sw, 'score']]) panel.push({ w, what, mean: x, se, lo: x - 1.96 * se, clears: x - 1.96 * se > -floor });
  }
  const panelOk = complete && panel.length === 2 * Object.keys(per).length && panel.every(p => p.clears);
  return { harm, panel, joins: harm.length === 0 && panelOk, complete };
}

/* the check (D30): each household's ND against the factorial's HR+T3, paired by path; the identity units first */
function readNd(dir, t3dir, iddir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
  const sameBits = (a, b) => a.bits.length === b.bits.length && a.bits.every((x, i) => x === b.bits[i]) && a.ws.every((x, i) => Object.is(x, b.ws[i]));
  const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
  console.log(`THE TABLE WITHOUT THE DEALING COST, CHECKED (EXPLORATORY, the tuning seed, ${PTS} wealth points; D30, SPEED-PORT.md step 3): ND units ${dir}, the factorial's HR+T3 units ${t3dir}, the identity units ${iddir}`);
  let complete = true, identical = 0, compared = 0;
  const ids = [];
  for (const [id, w] of ND_ID) {
    const f = join(iddir, `${id}-CAND+HR+T3-w${w}.json.gz`), g = join(t3dir, `${id}-CAND+HR+T3-w${w}.json.gz`);
    if (!existsSync(f) || !existsSync(g)) { console.log(`  identity ${id} W${w}: missing`); complete = false; continue; }
    const a = load(f), b = load(g); ids.push(a); compared++;
    if (sameBits(a, b)) identical++; else console.log(`  identity ${id} W${w}: CAND+HR+T3 on this code and the factorial's DIFFER`);
  }
  console.log(`THE IDENTITY (step 2.1): CAND+HR+T3 on the ported code the same as the factorial's units bit for bit on ${identical} of ${compared} (${ND_ID.map(([i, w]) => `${i} W${w}`).join(', ')}), so the factorial's units stand as the first arm`);
  const per = Object.fromEntries(WEIGHTS.map(w => [w, []])), nds = [], t3s = [], ratios = [];
  for (const w of WEIGHTS) {
    console.log(`AT W${w} (ND less HR+T3: survival points (se) / whole score (se), paired by path):`);
    for (const id of HOUSEHOLDS) {
      const f = join(dir, `${id}-CAND+HR+T3+ND-w${w}.json.gz`), g = join(t3dir, `${id}-CAND+HR+T3-w${w}.json.gz`);
      if (!existsSync(f) || !existsSync(g)) { console.log(`  ${id}: missing ${existsSync(f) ? 'the factorial\'s unit' : 'the ND unit'}`); complete = false; continue; }
      const nd = load(f), t3 = load(g); nds.push(nd); t3s.push(t3);
      const d = paired(t3, nd); per[w].push({ id, ...d }); ratios.push(nd.secs / t3.secs);
      console.log(`  ${id}: HR+T3 ${t3.sim.toFixed(2)}%, ND ${nd.sim.toFixed(2)}% (${nd.moves} moves): survival ${f3(d.s)} (${d.sse.toFixed(3)}) / score ${f3(d.w)} (${d.wse.toFixed(3)}); solve ${Math.round(t3.secs)} s against ${Math.round(nd.secs)} s`);
    }
  }
  // the factorial's units (the first arm) share the seed, paths, points and candidate; their code is the factorial's, the
  // identity units standing for it on this code (the reviewer of 26 Oct, finding 4)
  const codes = new Set([...nds, ...ids].map(x => x.code)), seeds = new Set([...nds, ...t3s, ...ids].map(x => `${x.seed}/${x.N}`)), cands = new Set([...nds, ...t3s, ...ids].map(x => x.candidate)), pts = new Set([...nds, ...t3s, ...ids].map(x => x.points));
  const flags = nds.every(x => x.tableDealing === false && x.tsOnce === true && x.tiersBelow === 3 && JSON.stringify(x.menuPlus) === '["hr"]') && ids.every(x => x.tableDealing === true && x.tiersBelow === 3);
  const fair = codes.size === 1 && seeds.size === 1 && cands.size === 1 && pts.size === 1 && pts.has(PTS) && flags;
  console.log(fair ? `the gate: the ND and identity units from one code (${[...codes][0]}); every unit, the factorial's too, seed and paths ${[...seeds][0]}, candidate ${[...cands][0]}, ${PTS} points; ND tableDealing false with E5, HR and the third step; the identity units tableDealing true` : `NOT FAIR: codes (${[...codes].join(' ')}), seeds (${[...seeds].join(' ')}), candidates (${[...cands].join(' ')}), points (${[...pts].join(' ')}), flags ${flags ? 'as they should be' : 'not as they should be'}`);
  const med = a => { const q = [...a].sort((x, y) => x - y); return q.length % 2 ? q[q.length >> 1] : (q[q.length / 2 - 1] + q[q.length / 2]) / 2; };
  if (ratios.length) console.log(`THE SOLVE, ND against HR+T3 (four units at a time; the factorial's under its own load): the median x${med(ratios).toFixed(2)} (x${Math.min(...ratios).toFixed(2)} to x${Math.max(...ratios).toFixed(2)}) over ${ratios.length} household-weights`);
  const v = ndRule(per);
  for (const p of v.panel) console.log(`  the panel W${p.w} ${p.what}: ${f3(p.mean)} (se ${p.se.toFixed(3)}), its 95% interval's lower end ${f3(p.lo)}: ${p.clears ? 'clears' : 'does not clear'} -0.2`);
  console.log(`  a household losing more than 0.5 beyond noise: ${v.harm.length ? v.harm.join('; ') : 'none'}`);
  const ok = fair && complete && identical === compared && compared === ND_ID.length && v.complete;
  if (!ok) { console.log('THE CHECK: NOT COMPLETE, NOT FAIR, OR THE IDENTITY FAILED (see above); not read'); process.exit(1); }
  console.log(`DECISION (D30, the rule committed before launch): tableDealing false ${v.joins ? 'JOINS the candidate' : 'does NOT join: it goes back to the maintainer'}`);
  process.exit(0);
}

/* the rule's planted checks: built households with one fault each (CHECKLIST 5) */
function plantedNd() {
  const hh = (o = {}) => HOUSEHOLDS.map(id => ({ id, w: 0, wse: 0.05, s: 0, sse: 0.05, ...(o[id] || {}) })), both = (o = {}) => Object.fromEntries(WEIGHTS.map(w => [w, hh(o)]));
  const at = (w, o) => ({ ...both(), [w]: hh(o) }), all7 = v => Object.fromEntries(HOUSEHOLDS.map(id => [id, v]));
  const cases = [
    ['nothing anywhere: joins', ndRule(both()).joins, true],
    ['a household -0.6 survival beyond noise at one weight: does not join', ndRule(at(WEIGHTS[1], { S370: { s: -0.6, sse: 0.1 } })).joins, false],
    ['a household -0.6 score inside noise (se 0.32; the panel clears): joins', ndRule(at(WEIGHTS[0], { S370: { w: -0.6, wse: 0.32 } })).joins, true],
    ['a household at exactly -0.5: joins (not more than the target)', ndRule(at(WEIGHTS[0], { S370: { s: -0.5, sse: 0.01 } })).joins, true],
    ['the panel mean -0.3 survival: its lower end below -0.2, does not join', ndRule(at(WEIGHTS[0], all7({ s: -0.3, sse: 0.01 }))).joins, false],
    ['the panel mean -0.1 score with a wide se (lower end -0.35): does not join', ndRule(at(WEIGHTS[1], all7({ w: -0.1, wse: 0.338 }))).joins, false],
    ['the panel lower end exactly at the floor (0.25 here, exact in floating point): does not join', ndRule(at(WEIGHTS[0], all7({ s: -0.25, sse: 0 })), HOUSEHOLDS.length, 0.25).joins, false],
    ['a household missing at one weight: not complete, does not join', ndRule({ ...both(), [WEIGHTS[0]]: hh().slice(1) }).joins, false]
  ];
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--units') UNITS.forEach(u => console.log(u));
  else if (process.argv[2] === '--units-hr') HR_UNITS.forEach(u => console.log(u));
  else if (process.argv[2] === '--read-hr') readHr(process.argv[3] || OUT_HR, process.argv[4] || OUT);
  else if (process.argv[2] === '--hr') await unit(process.argv[3], process.argv[4], process.argv[5], OUT_HR);
  else if (process.argv[2] === '--read') read(process.argv[3] || OUT, process.argv[4] || V3_DIR);
  else if (process.argv[2] === '--units-t3') T3_UNITS.forEach(u => console.log(u));
  else if (process.argv[2] === '--units-nd') ND_UNITS.forEach(u => console.log(u));
  else if (process.argv[2] === '--nd') await unit(process.argv[3], 'CAND+HR+T3+ND', process.argv[4], OUT_ND);
  else if (process.argv[2] === '--nd-id') await unit(process.argv[3], 'CAND+HR+T3', process.argv[4], OUT_NDID);
  else if (process.argv[2] === '--planted-nd') console.log(`planted (${plantedNd()}): the rule reads each as it should\nEDGES: a loss of exactly 0.5 on a household, the panel's lower end exactly at the floor, a household missing at one weight`);
  else if (process.argv[2] === '--read-nd') { const np = plantedNd(); console.log(`(the rule's ${np} planted checks pass)`); readNd(process.argv[3] || OUT_ND, process.argv[4] || OUT_T3, process.argv[5] || OUT_NDID); }
  else if (process.argv[2] === '--t3') await unit(process.argv[3], process.argv[4], process.argv[5], OUT_T3);
  else if (process.argv[2] === '--planted') console.log(`planted (${planted()}): the bar reads each as it should\nEDGES: a gain of exactly 0.5 on a household, the panel mean exactly at its target, a loss of exactly 0.5, a household missing from the panel`);
  else if (process.argv[2] === '--read-t3') { const np = planted(); console.log(`(the bar's ${np} planted checks pass)`); readT3(process.argv[3] || OUT_T3, process.argv[4] || OUT); }
  else await unit(process.argv[2], process.argv[3], process.argv[4]);
}
