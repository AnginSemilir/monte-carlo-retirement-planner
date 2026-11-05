/*
 * P2 (a), THE 30-POINT PREVIEW, MEASURED FOR R5 (the launch plan's step P2 and rule R5 (a), D52: "the 30-point preview ships
 * for the dial's live line and the search's bracket only. It requires that its engine survival is within 0.5 points of the
 * 45-point solve's on each of the eight households. Its figures are labelled 'about'"). EXPLORATORY: R5 decides on it.
 *
 * One household of the review's eight (audit-curve.mjs HOUSEHOLDS, landed as Phase 4's panel: phase4-panel.mjs readPanel),
 * with its floor at 80% of its target where the plan sets none (B2): the app's solve (solveForApp, the candidate) at 45
 * points and at 30, each solved plan run by the engine on the same 2,000 paths of the app's seed (the dial's live line's
 * count; src/solverStrategy.js runPath), and the survival of each, their difference and the paths that differ printed on
 * one line. preview-30-reduce (below, --reduce FILE) reads the eight lines and prints R5's verdict.
 *   node research/solver/preview-30.mjs <id> [--paths N]          one household, one line
 *   node research/solver/preview-30.mjs --reduce <file>           R5 (a) on the eight lines
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
if (args[0] === '--reduce') {
  const lines = readFileSync(args[1], 'utf8').split('\n').filter(l => l.startsWith('PREVIEW '));
  const rows = lines.map(l => JSON.parse(l.slice(8)));
  const HH = ['S030', 'S050', 'S090', 'S368', 'S188', 'S304F', 'S328F', 'S340F'];
  const missing = HH.filter(id => !rows.some(r => r.id === id));
  const codes = [...new Set(rows.map(r => r.code))], seeds = [...new Set(rows.map(r => `${r.seed}/${r.paths}`))];
  console.log(`P2 (a), THE 30-POINT PREVIEW AGAINST THE 45-POINT SOLVE (R5 (a); EXPLORATORY): ${rows.length} households; code ${codes.join(', ')}; seed/paths ${seeds.join(', ')}`);
  for (const r of rows) console.log(`${r.id}: 45 points ${r.s45.toFixed(2)}%, 30 points ${r.s30.toFixed(2)}%, the preview less the solve ${(r.s30 - r.s45 >= 0 ? '+' : '')}${(r.s30 - r.s45).toFixed(2)} points (${r.lost} paths lost, ${r.saved} saved of ${r.paths}); the solve ${r.t45.toFixed(0)} s at 45 points, ${r.t30.toFixed(0)} s at 30 (x${(r.t30 / r.t45).toFixed(2)})`);
  const worst = rows.reduce((w, r) => (Math.abs(r.s30 - r.s45) > Math.abs(w.s30 - w.s45) ? r : w), rows[0]);
  const fair = missing.length === 0 && codes.length === 1 && seeds.length === 1;
  const within = fair && rows.every(r => Math.abs(r.s30 - r.s45) <= 0.5);
  console.log(`the gate: ${fair ? 'fair' : 'NOT FAIR'}${missing.length ? ` (missing ${missing.join(', ')})` : ''}${codes.length > 1 ? ' (more than one code)' : ''}${seeds.length > 1 ? ' (more than one seed or path count)' : ''}`);
  console.log(`VERDICT (R5 (a)): the largest difference ${worst ? `${(worst.s30 - worst.s45).toFixed(2)} points on ${worst.id}` : 'none'}; ${within ? 'WITHIN 0.5 points on every household: the 30-point preview ships for the dial\'s live line and the search\'s bracket only, labelled "about"' : fair ? 'NOT within 0.5 points on every household: the preview does not ship' : 'not read'}`);
  console.log('EXPLORATORY: R5 (a) decides on it (D52).');
  process.exit(0);
}

const E = await import('../engine.mjs');
const M = await import('../../src/solver/model.js');
const { solveForApp } = await import('../../src/solverApp.js');
const { runPath, solvedContext } = await import('../../src/solverStrategy.js');
const { readPanel } = await import('./phase4-panel.mjs');
const { codeId } = await import('./code-id.mjs');
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = Number(args[i + 1]); args.splice(i, 2); return v; };
const N = opt('--paths', 2000), SEED = 12345, id = args[0];
const h = readPanel().find(x => x.id === id);
if (!h) throw new Error(`no household ${id} on Phase 4's panel`);
const plan0 = E.normalizePlan(h.plan);
const plan = E.num(plan0.spending.floorSpend, 0) > 0 ? plan0 : E.normalizePlan({ ...plan0, spending: { ...plan0.spending, floorSpend: Math.round(0.8 * E.num(plan0.spending.targetSpend, 0)) } });
const run = points => { const t = performance.now(); const r = solveForApp(E, M, plan, { points }); const secs = (performance.now() - t) / 1000; const sc = solvedContext(E, r); const paths = E.pathsForSeed(SEED, N, sc.totalYears); return { secs, ok: paths.map(zs => runPath(E, sc, zs).survived) }; };
const a = run(45), b = run(30);
let lost = 0, saved = 0;
for (let i = 0; i < N; i++) { if (a.ok[i] && !b.ok[i]) lost++; if (!a.ok[i] && b.ok[i]) saved++; }
const pct = ok => 100 * ok.filter(Boolean).length / N;
const cid = codeId();
console.log('PREVIEW ' + JSON.stringify({ id, code: cid ? cid.hash : 'unknown', seed: SEED, paths: N, s45: pct(a.ok), s30: pct(b.ok), lost, saved, t45: a.secs, t30: b.secs }));
