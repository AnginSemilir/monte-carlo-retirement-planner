/*
 * PHASE 4 PANEL SELECTION (PLAN.md step 5b). Finds Panel H: 40 held-out single households where ARM A -
 * the app at its best - survives 75 to 95%, half from the library and half from the FIRE cohort.
 *
 * ARM A, exactly as Phase 4 defines it: the app's own pipeline (its policy search, then its strategy
 * tournament, both judged by `explainPick` with the default priorities - the same code `versus.mjs` runs as
 * its arm A), on the household's plan with the guardrails ON and honouring a floor of 80% of target, and the
 * one-off cost lookahead at its settled default (5 years). No tier changes: the app cannot make them.
 *
 * RULES, fixed before the run (written into PLAN.md step 5b with the prediction):
 *   - excluded: every household id that appears in any file under results/ (the clean 41 and every tuning,
 *     screen and probe household since), collected at run time, so nothing seen in tuning can enter;
 *   - library candidates: the free single households in library order;
 *   - FIRE candidates: every single household aged 44 or under, retiring at 52 instead (id + 'F', as in
 *     versus.mjs). No 'F' id has ever been run. Those whose library id is also free go first;
 *   - the pipeline searches on seed 7001 (its own search draw); the band is measured on 1,000 paths of seed
 *     7005, a draw used for nothing else; Phase 4 itself is judged on seed 7003, never touched here;
 *   - the band is measured with no minimum end pot (the default is chosen at step 6, after this); it is a
 *     ceiling safeguard, not a gate, so the panel is not re-selected when the default arrives;
 *   - the panel: walking each list in order, the first 20 library and first 20 FIRE households in [75, 95].
 *     If the FIRE list runs out first, the library list fills the panel to 40 and the split is reported.
 *
 *   node select-phase4.mjs list                  the two candidate lists, in order
 *   node select-phase4.mjs one <lib|fire> <k>    run arm A on candidate k of that list, write its result
 *   node select-phase4.mjs combine               build panel-H.json from the results so far
 */
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS = join(HERE, 'results');
const OUT = join(RESULTS, 'p4-select');
const SEARCH_SEED = 7001, BAND_SEED = 7005, BAND_PATHS = 1000, TP = 300, TT = 400;
const LO = 75, HI = 95, PER_COHORT = 20;
const mode = process.argv[2] || 'list';

/* every id any earlier run has touched: file names under results/, at any depth, plus the band files */
function usedIds() {
  const ids = new Set();
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      if (d === OUT) continue;
      const p = join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      const m = f.match(/^(S\d+F?)[._]/); if (m) ids.add(m[1]);
      if (/^(couple-)?band-.*\.json$/.test(f)) JSON.parse(readFileSync(p, 'utf8')).forEach(r => r.id && ids.add(r.id));
    }
  };
  walk(RESULTS);
  return ids;
}

function lists() {
  const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
  const used = usedIds();
  const lib = singles.filter(s => !used.has(s.id)).map(s => ({ id: s.id, name: s.name, cohort: 'library', plan: s.plan }));
  const young = singles.filter(s => Number(s.plan.demographics.currentAgeSelf) <= 44 && !used.has(s.id + 'F'));
  const fireOf = (s) => { const p = JSON.parse(JSON.stringify(s.plan)); p.demographics.retireAgeSelf = 52; return { id: s.id + 'F', name: s.name.replace(/^[a-z-]+\//, 'fire/'), cohort: 'fire', plan: p, baseUsed: used.has(s.id) }; };
  const fire = [...young.filter(s => !used.has(s.id)), ...young.filter(s => used.has(s.id))].map(fireOf);
  return { lib, fire, usedCount: used.size };
}

/* the household's plan as arm A runs it: guardrails on, the floor at 80% of target, the lookahead at 5 years */
function armAPlan(raw) {
  const p = JSON.parse(JSON.stringify(raw));
  const target = E.num(p.spending.targetSpend, 0);
  p.config = { ...p.config, guardrails: true, lookaheadYears: 5 };
  p.spending = { ...p.spending, floorSpend: Math.round(0.8 * target) };
  return E.normalizePlan(p);
}

/* the app's own pipeline: policy search, then the tournament under that policy (versus.mjs arm A) */
function armA(plan) {
  let used = 0;
  const cands = E.buildPolicyCandidates(plan).map(c => {
    const stats = E.monteCarlo(E.buildContext(E.resolveMpaa(c.planState)), { trials: TP, seed: SEARCH_SEED }); used += TP;
    return { ...c, stats };
  });
  const pol = E.explainPick(cands, { priorities: E.DEFAULT_PRIORITIES }).winner;
  const withPolicy = E.normalizePlan(JSON.parse(JSON.stringify(plan)));
  withPolicy.spending.decumulationPolicy = pol.decumulationPolicy;
  withPolicy.spending.drawdownStrategy = pol.drawdownStrategy;
  withPolicy.config.harvestPersonalAllowance = pol.harvestPersonalAllowance;
  const t = E.buildTournament(withPolicy, { scope: 'full' });
  const players = t.strategies.filter(s => !s.isEntrant && !s.evolve).map(s => {
    if (s.candidates) { used += s.candidates.length * TT; return E.resolveSearchPlayer(s, { trials: TT, seed: SEARCH_SEED, priorities: E.DEFAULT_PRIORITIES }); }
    return s;
  }).map(p => { const stats = p.stats || E.monteCarlo(p.planState, { trials: TT, seed: SEARCH_SEED }); if (!p.stats) used += TT; return { ...p, stats }; });
  const won = E.explainPick(players, { priorities: E.DEFAULT_PRIORITIES }).winner;
  return { planState: won.planState, used, label: `${won.name} + ${pol.decumulationPolicy}${pol.harvestPersonalAllowance ? '' : ' (harvest off)'}${pol.drawdownStrategy === 'Full 25% Lump Sum' ? ', lump sum' : ''}` };
}

if (mode === 'list') {
  const { lib, fire, usedCount } = lists();
  console.log(`${usedCount} ids excluded as used; ${lib.length} library candidates, ${fire.length} FIRE candidates (${fire.filter(f => !f.baseUsed).length} whose library id is also unused)`);
  lib.forEach((c, k) => console.log(`  lib  ${String(k).padStart(3)}  ${c.id} ${c.name}`));
  fire.forEach((c, k) => console.log(`  fire ${String(k).padStart(3)}  ${c.id} ${c.name}${c.baseUsed ? '  (library id used in tuning)' : ''}`));
}

if (mode === 'one') {
  const which = process.argv[3], k = Number(process.argv[4]);
  const { lib, fire } = lists();
  const list = which === 'fire' ? fire : lib;
  if (!(k >= 0 && k < list.length)) { console.error(`k must be 0..${list.length - 1}`); process.exit(2); }
  const cand = list[k];
  const t0 = Date.now();
  const plan = armAPlan(cand.plan);
  const a = armA(plan);
  const band = E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: BAND_PATHS, seed: BAND_SEED });
  const out = { id: cand.id, name: cand.name, cohort: cand.cohort, list: which, k, baseUsed: !!cand.baseUsed, label: a.label, used: a.used,
    bandSurvival: band.successRate, inBand: band.successRate >= LO && band.successRate <= HI, bandSeed: BAND_SEED, bandPaths: BAND_PATHS, searchSeed: SEARCH_SEED,
    planState: a.planState, ms: Date.now() - t0 };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${cand.id}.json`), JSON.stringify(out));
  console.log(`${which.padEnd(4)} ${String(k).padStart(3)} ${cand.id.padEnd(6)} ${cand.name.slice(0, 38).padEnd(39)} arm A ${band.successRate.toFixed(1).padStart(5)}  ${out.inBand ? 'IN BAND' : '-'}  ${a.label.slice(0, 50)}  ${(out.ms / 1000).toFixed(0)}s`);
}

if (mode === 'combine') {
  const { lib, fire } = lists();
  const got = (c) => { const f = join(OUT, `${c.id}.json`); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; };
  const walk = (list, want) => { const picked = []; let tried = 0, gap = null; for (const c of list) { const r = got(c); if (!r) { gap = c.id; break; } tried++; if (r.inBand) picked.push(r); if (picked.length === want) break; } return { picked, tried, gap }; };
  const F = walk(fire, PER_COHORT);
  const L = walk(lib, 2 * PER_COHORT - F.picked.length);
  const yield_ = (w) => (w.tried ? `${w.picked.length} of ${w.tried} tried (${(100 * w.picked.length / w.tried).toFixed(0)}%)` : 'none tried');
  console.log(`FIRE: ${yield_(F)}${F.gap ? `, stopped at the first unrun candidate ${F.gap}` : ''}`);
  console.log(`library: ${yield_(L)}${L.gap ? `, stopped at the first unrun candidate ${L.gap}` : ''}`);
  const panel = [...L.picked, ...F.picked].map(({ planState, ...r }) => r);
  const complete = panel.length === 2 * PER_COHORT && (F.picked.length === PER_COHORT || !F.gap);
  console.log(`panel: ${panel.length} households (${L.picked.length} library, ${F.picked.length} FIRE) ${complete ? '- COMPLETE' : '- INCOMPLETE, run more candidates'}`);
  console.log('prediction (PLAN.md step 5b): half to two thirds of candidates in the band');
  if (complete) writeFileSync(join(RESULTS, 'panel-H.json'), JSON.stringify(panel, null, 1));
}
