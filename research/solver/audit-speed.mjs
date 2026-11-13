/*
 * THE CHOOSER'S SHORTLIST AND THE SOLVE ON ANCHORS, STAGE A (the review of 9 Nov, items 7 and 10; D66, D68; SPEED-A.md;
 * EXPLORATORY, seed 7002, deciding nothing). Runs only on a scratch tree carrying the review's two prototypes
 * (prototype/shortlist.diff: SHORT; prototype/solve-coarse.diff: COARSE, opts.coarse). Three units a household:
 *   A  OFF and ON solved and timed, back to back in this process on one core; OFF's paths; on the review's eight each of
 *      item 7's widths on OFF's tables, and the replay (the review's short.mjs) on the first 100 paths;
 *   B  ON solved again (its tables' digest, for the reducer to hold against unit A's); ON's paths; on the eight ON's tables
 *      with each width;
 *   R  a 4-point probe for a bridge year (g.reader.adaptive); with one, OFF, REF and ON+REF solved and timed, REF's and
 *      ON+REF's paths.
 * Every arm scored by the engine (solverStrategy runPath) on the same paths of seed 7002. The units go to
 * results/speed-<seed>/ (SPEED_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and <id>-<part>.json.gz.
 * reduce-speed.mjs reads them.
 *   node research/solver/audit-speed.mjs part k/n          node research/solver/audit-speed.mjs --units
 *   SPEED_PTS the points (smoke only); SPEED_N the paths (smoke only); SPEED_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as SOLVE from '../../src/solver/solve.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext, runPath, partsOf } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readPanel } from './phase4-panel.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, N = 16000, PTS = 45, NREPLAY = 100;
// the review's eight as Phase 4 landed them; S224, S362, S366 and S370 as the library enters them (SPEED-A.md)
export const EIGHT = ['S030', 'S050', 'S090', 'S368', 'S188', 'S304F', 'S328F', 'S340F'];
export const FOUR = ['S224', 'S362', 'S366', 'S370'];
export const HOUSEHOLDS = [...EIGHT, ...FOUR];
// unit A's first (the longest), then R, then B; within a part, the households in order
export const PARTS = ['A', 'R', 'B'];
export const UNITS = PARTS.flatMap(part => HOUSEHOLDS.map(id => ({ id, part })));
// item 7's widths (short.mjs's names): structure; cells with the check at 0.5 points; order (read only if neither passes)
export const WIDTHS = ['structure', 'cells-held@0.005', 'order'];
// item 10's setting (w2a3b3g2c2-NT-LRVOH-h3, solve-cfg.mjs's form) and the thinner bridge reference (REF)
export const ON = { w: 2, a: 3, b: 3, g: 2, c: 2, src: 'NT', expand: 'LRVOH', plant: '', climb: 3 };
export const THIN = { na: 80, nb: 21, nz: 64, foot: true, stepAll: true };
export const SOLVES = { OFF: {}, ON: { coarse: ON }, REF: { adaptiveLattice: THIN }, ONREF: { coarse: ON, adaptiveLattice: THIN } };
export const STAMP_FILES = ['audit-speed.mjs', 'reduce-speed.mjs', 'SPEED-A.md', 'stats.mjs', 'phase4-panel.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}-${u.part}.json.gz`;
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
/* the plan a household is solved on */
export function planOf(id) {
  if (EIGHT.includes(id)) return readPanel().find(h => h.id === id).plan;
  return E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
}
/* every setting a solve recorded that an arm could differ on: the option under test named first, then the rest */
const lat = r => { const a = r.g.reader && r.g.reader.adaptive; return a && a.lattice ? `${a.lattice.na}x${a.lattice.nb}x${a.lattice.nz}` : a ? 'adaptive' : 'none'; };
const coarseOf = r => (r.meta.coarse ? `w${r.meta.coarse.w}a${r.meta.coarse.a}b${r.meta.coarse.b}g${r.meta.coarse.g}c${r.meta.coarse.c}-${r.meta.coarse.src}-${r.meta.coarse.expand}-h${r.meta.coarse.climb}` : 'off');
export const settingsOf = r => `pts ${r.g.np} mix ${r.meta.mixture} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} levels ${r.meta.spendLevels.join(',')} tierState ${r.meta.tierState} tiersBelow ${r.meta.tiersBelow} tableDealing ${r.meta.tableDealing} switchCharge ${r.switchCharge || 0} e3pcls ${!!r.meta.e3pcls} jointWorlds ${!!r.meta.jointWorlds} failDelivered ${!!r.meta.failDelivered} readerRef ${r.meta.readerRef} finalExact ${!!r.finalExact}`;
const ranOf = (r, width) => `coarse ${coarseOf(r)} | reference ${lat(r)} | chooser ${width || 'whole'} | ${settingsOf(r)}`;
/* short.mjs's setV: a width's switches */
export function setWidth(v0) {
  const S = SOLVE.SHORT, [v, dl] = v0.split('@');
  S.delta = dl ? Number(dl) : null; S.levels = true; S.time = v.endsWith('-time');
  const b = v.replace('-time', ''); S.mode = b.startsWith('cells') ? 'cells' : b; S.layers = b === 'cells-held' ? 'held' : 'all';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.part}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-speed: part k/${UNITS.length}`); process.exit(2); }
  if (!SOLVE.SHORT || !SOLVE.COARSE) { console.error('audit-speed: this tree has not the review\'s prototypes (SHORT, COARSE): run it on the scratch tree (SPEED-A.md)'); process.exit(2); }
  const OUT = process.env.SPEED_OUT || join(HERE, 'results', `speed-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.SPEED_PTS) || PTS, n = Number(process.env.SPEED_N) || N, nRep = Math.min(NREPLAY, n);
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], id = u.id, eight = EIGHT.includes(id);
  console.log(`SPEED-A (EXPLORATORY): unit ${pk}/${pn}: ${id} part ${u.part}, seed ${SEED}, ${n} paths, ${pts} points; node ${STAMP.node}`);
  const t0 = Date.now();
  const plan = planOf(id), inputs = hashOf(plan);
  const T = E.buildContext(E.resolveMpaa(E.normalizePlan(plan))).totalYears, paths = E.pathsForSeed(SEED, n, T);
  console.log(`${id.padEnd(8)} case | unit ${pk} part ${u.part} | years ${T + 1} | inputs ${inputs}`);
  // a solve, timed on this core (the thread's CPU, as the speed checks take it since 1604ac5, beside the wall clock)
  const solveOf = (name) => {
    SOLVE.COARSE.stats = { fine: 0, listed: 0, fallback: 0, flows: 0, hits: 0 };
    const c0 = process.cpuUsage(), w0 = process.hrtime.bigint();
    const r = solveForApp(E, M, plan, { points: pts, research: { ...light, ...SOLVES[name] } });
    const cpu = (() => { const c = process.cpuUsage(c0); return (c.user + c.system) / 1e6; })(), wall = Number(process.hrtime.bigint() - w0) / 1e9;
    const ref = r.g.reader && r.g.reader.adaptive ? r.g.reader.adaptive.secs || 0 : 0;
    return { r, name, cpu, wall, ref, bridge: !!(r.g.reader && r.g.reader.adaptive), stats: { ...SOLVE.COARSE.stats } };
  };
  const solves = {}, record = async (s) => { solves[s.name] = { cpu: s.cpu, wall: s.wall, ref: s.ref, bridge: s.bridge, stats: s.stats, digest: await digestOf(tablesOf(s.r)), ran: ranOf(s.r) }; console.log(`${''.padEnd(8)} solve ${s.name}: ${s.cpu.toFixed(1)} s on this core (wall ${s.wall.toFixed(1)} s), the bridge reference ${s.ref.toFixed(1)} s; ${s.name.includes('ON') ? `${s.stats.fine} cells on a shortlist; ` : ''}digest ${solves[s.name].digest.slice(0, 16)}`); };
  // an arm: a solved plan's paths, the chooser on the whole menu or a width; a path's milliseconds
  const arms = {};
  const runArm = (key, s, width) => {
    const sc = solvedContext(E, s.r), S = SOLVE.SHORT;
    const on = () => { if (width) { setWidth(width); S.on = true; } else S.on = false; };
    on(); for (const zs of paths.slice(0, 3)) runPath(E, sc, zs);   // warm the code paths before timing
    const f0 = S.stats.fallback, d0 = S.stats.decisions, l0 = S.stats.listed;
    const survived = new Uint8Array(n), delivered = new Float64Array(n), target = new Float64Array(n), pot = new Float64Array(n);
    on(); const e0 = process.hrtime.bigint();
    paths.forEach((zs, k) => { const o = runPath(E, sc, zs); survived[k] = o.survived ? 1 : 0; delivered[k] = o.delivered; target[k] = o.target; pot[k] = o.terminalPot; });
    const ms = Number(process.hrtime.bigint() - e0) / 1e6 / n; S.on = false;
    arms[key] = { ran: ranOf(s.r, width), inputs, width: width || null, ms, decisions: S.stats.decisions - d0, listed: S.stats.listed - l0, fallback: S.stats.fallback - f0, survived, delivered, target, pot };
    console.log(`${''.padEnd(8)} ran ${key}: ${arms[key].ran}`);
    console.log(`${''.padEnd(8)} done ${key}: a path ${ms.toFixed(2)} ms${width ? `; ${(arms[key].listed / Math.max(1, arms[key].decisions)).toFixed(1)} moves listed, ${arms[key].fallback} fell back to the whole menu` : ''}`);
  };
  // item 7's replay (the review's short.mjs): at each decision of the whole menu's own path, each width's choice
  const replayOf = (s) => {
    const sc = solvedContext(E, s.r), base = sc.policyOverride, S = SOLVE.SHORT;
    const mk = () => ({ decisions: 0, miss: 0, m4: 0, m3: 0, m2: 0, regret: 0, worst: 0, listed: 0, parts: { level: 0, draw: 0, isaFirst: 0, harvest: 0, tierPen: 0, tierIsa: 0 } });
    const R = Object.fromEntries(WIDTHS.map(v => [v, mk()]));
    const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) {
      S.on = false; const f = base.choose(st, t, held);
      if (t >= T) return f;
      const scF = Float64Array.from(s.r._sc);
      for (const v of WIDTHS) {
        const r = R[v], before = S.stats.listed;
        setWidth(v); S.on = true; const x = base.choose(st, t, held); S.on = false;
        r.decisions++; r.listed += S.stats.listed - before;
        if (x.index !== f.index) {
          const reg = scF[f.index] - scF[x.index];
          r.miss++; r.regret += reg; if (reg > r.worst) r.worst = reg;
          if (reg > 1e-4) r.m4++; if (reg > 1e-3) r.m3++; if (reg > 1e-2) r.m2++;
          const a = partsOf(s.r.actions[f.index], s.r.c.acts[f.index]), b = partsOf(s.r.actions[x.index], s.r.c.acts[x.index]);
          for (const k of Object.keys(r.parts)) if (a[k] !== b[k]) r.parts[k]++;
        }
      }
      return f;
    } } };
    for (let i = 0; i < nRep; i++) runPath(E, ctx, paths[i]);
    for (const v of WIDTHS) { const r = R[v]; console.log(`${''.padEnd(8)} replay ${v}: ${r.decisions} decisions, a different move at ${r.miss}, over 0.01 points of score given up at ${r.m4}, over 0.1 at ${r.m3}, over 1 at ${r.m2}; the worst ${(100 * r.worst).toFixed(3)} points`); }
    return R;
  };
  let replay = null, bridge = null;
  if (u.part === 'A') {
    const off = solveOf('OFF'); await record(off);
    const on = solveOf('ON'); await record(on); on.r = null;
    bridge = off.bridge;
    runArm('OFF', off);
    if (eight) { for (const w of WIDTHS) runArm(`OFF:${w}`, off, w); replay = replayOf(off); }
  } else if (u.part === 'B') {
    const on = solveOf('ON'); await record(on);
    bridge = on.bridge;
    runArm('ON', on);
    if (eight) for (const w of WIDTHS) runArm(`ON:${w}`, on, w);
  } else {
    const probe = solveForApp(E, M, plan, { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } });
    bridge = !!(probe.g.reader && probe.g.reader.adaptive);
    console.log(`${''.padEnd(8)} the bridge probe at 4 points: ${bridge ? 'a bridge year (the reference built)' : 'no bridge year'}`);
    if (bridge) {
      const off = solveOf('OFF'); await record(off); off.r = null;
      const ref = solveOf('REF'); await record(ref);
      const onref = solveOf('ONREF'); await record(onref);
      runArm('REF', ref); ref.r = null;
      runArm('ONREF', onref);
    }
  }
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id, part: u.part, seed: SEED, N: n, pts, inputs, bridge, stamp: STAMP, cpu: cpus()[0].model, solves, replay,
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { ran: x.ran, inputs: x.inputs, width: x.width, ms: x.ms, decisions: x.decisions, listed: x.listed, fallback: x.fallback,
      survived: b64(x.survived), delivered: b64(x.delivered), target: b64(x.target), pot: b64(x.pot) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
