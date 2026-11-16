/*
 * THE SHARE REPLAY (D110; research/solver/SHARE-REPLAY.md, its rule committed before it runs; the deep review of the share
 * rules' read, reviews/2026-11-16-deep-share-rules.md section 3). EXPLORATORY, deciding nothing on its own: today's split
 * stays the couples' default in every outcome until a registered test reads.
 *
 * On the read's own code (the launch worktree at e1239959, code c0dcfa9ef2f2, given as <tree>) and on seed 7023's paths,
 * which the share rules' read has already read: for each comparison (a rule against TODAY on one unit), the paths the rule
 * lost (TODAY kept them), the paths it saved and paths both arms keep (the controls), replayed by the engine as the audit ran
 * them (audit-share-rules.mjs: each arm solved by solveArm, the engine at arm A's MPAA ages; audit-phase4.mjs runPath's loop),
 * each run under a policy that asks both arms' joint moves at the same household state each year (couple.js chooseJoint,
 * as couplePolicy maps the engine's state) and takes some parts of the move from TODAY's:
 *   X   no part from TODAY: the rule's own move. Every path must match the rule's stored arrays to the bit (survival, failure
 *       year, the pot, the estate, spending delivered, unmet spending, lifetime tax), or the replay stops;
 *   T   every part from TODAY: TODAY's own move. Every path must match TODAY's stored arrays to the bit, likewise;
 *   L   the rule's move with TODAY's spending level;
 *   R   the rule's move with TODAY's tiers for each person;
 *   S   the rule's move with TODAY's split;
 *   TK  the rule's own policy offering each person's top six moves, not two (solveCouple's topK).
 * The parts partition a joint move's fields (PARTS below: the level, the tiers, the split, and the draws: everything else),
 * so taking all four from TODAY is TODAY's move field for field, and none the rule's: checked on every year of X and T.
 * On X and T, a record of each year (REC_FIELDS): the move's level, split and each person's tiers (their place in fast.js
 * TIER_ORDER); the other arm's at the same state; each person's own table's reading of their own position at the start of
 * the year (its survival, at the tiers they hold); each person's pots; whether the move funds the year in the exact model
 * and, where it does not, the highest level of the menu that would at any split; the year's net drawdown under the move in
 * the exact model; the year's unmet spending and tax.
 *   node research/solver/share-replay.mjs <tree> <unit> [--smoke] [--plant swap]     one unit's comparisons
 *   node research/solver/share-replay.mjs --units                                       the units, one a line
 * --smoke: the first 3 lost, 2 saved and 2 control paths of each comparison (a check of the machinery, no read).
 * --plant swap: TODAY's replay takes the level from the rule's move; it must fail the match with TODAY's arrays.
 */
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { cpus } from 'node:os';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// the comparisons: the ten the read flagged, and S147-db under MEANS, the largest gain, as their mirror (reported only)
export const COMPARISONS = [
  ['FLAT', 'S023-45'], ['FLAT', 'S147-45'], ['FLAT', 'S191-45'], ['FLAT', 'S061-dbpart'],
  ['MEANS', 'S061-dbpart'], ['MEANS', 'S023-90'], ['MEANS', 'S147-90'], ['MEANS', 'S227-90'], ['MEANS', 'S191-45'], ['MEANS', 'S377-dbpart'],
  ['MEANS', 'S147-db', 'mirror']
];
export const CAPS = { lost: 400, saved: 400, ctrl: 200 }, SMOKE = { lost: 3, saved: 2, ctrl: 2 }, TOPK = 6;
export const RUNS = ['X', 'T', 'L', 'R', 'S', 'TK'];
// a joint move's fields by part (couple.js chooseJoint); every field of a move belongs to exactly one
export const PARTS = {
  level: ['spendLevel'],
  split: ['split'],
  tiers: ['perOwner.self.tierPen', 'perOwner.self.tierIsa', 'perOwner.self.tierPenName', 'perOwner.self.tierIsaName', 'perOwner.part.tierPen', 'perOwner.part.tierIsa', 'perOwner.part.tierPenName', 'perOwner.part.tierIsaName'],
  draws: ['steps', 'costSteps', 'harvest', 'harvestCeil', 'sweepCash', 'sweepIsa', 'lump', 'contrib', 'switchCost', 'ia', 'ib', 'score', 'perOwner.self.steps', 'perOwner.self.harvest', 'perOwner.self.harvestCeil', 'perOwner.part.steps', 'perOwner.part.harvest', 'perOwner.part.harvestCeil']
};
export const PARTS_OF = { X: [], T: ['level', 'split', 'tiers', 'draws'], L: ['level'], R: ['tiers'], S: ['split'] };
export const REC_FIELDS = ['level', 'split', 'penA', 'isaA', 'penB', 'isaB', 'oLevel', 'oSplit', 'oPenA', 'oIsaA', 'oPenB', 'oIsaB', 'readA', 'readB', 'potsA', 'potsB', 'funded', 'fundLevel', 'draw', 'unmet', 'tax'];

const get = (o, p) => p.split('.').reduce((x, k) => (x === undefined || x === null ? undefined : x[k]), o);
const set = (o, p, v) => { const ks = p.split('.'), last = ks.pop(), at = ks.reduce((x, k) => x[k], o); if (v === undefined) delete at[last]; else at[last] = v; };
const fieldsOf = (j, pre = '') => Object.entries(j).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) && k === 'perOwner' ? Object.entries(v).flatMap(([w, o]) => Object.keys(o).map(f => `perOwner.${w}.${f}`)) : v && typeof v === 'object' && k === 'perOwner' ? [] : [`${pre}${k}`]));
/* the rule's move with the named parts taken from TODAY's; a field outside every part is an error (the partition is checked) */
export function mixMove(jX, jT, parts, plant = '') {
  const known = new Set(Object.values(PARTS).flat());
  for (const f of [...fieldsOf(jX), ...fieldsOf(jT)]) if (!known.has(f)) throw new Error(`share-replay: a joint move's field ${f} in no part`);
  const out = { ...jX, perOwner: { self: { ...jX.perOwner.self }, part: { ...jX.perOwner.part } } };
  for (const part of parts) for (const f of PARTS[part]) { if (plant === 'swap' && part === 'level') continue; set(out, f, get(jT, f)); }
  return out;
}
const sameMove = (a, b) => [...new Set([...fieldsOf(a), ...fieldsOf(b)])].every(f => Object.is(get(a, f), get(b, f)));

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { [...new Set(COMPARISONS.map(c => c[1]))].forEach(u => console.log(u)); process.exit(0); }
  const [treeArg, unit] = args, SMOKE_RUN = args.includes('--smoke'), PLANT = args.includes('--plant') ? args[args.indexOf('--plant') + 1] : '';
  if (!treeArg || !unit || (PLANT && PLANT !== 'swap')) { console.error('usage: share-replay.mjs <tree> <unit> [--smoke] [--plant swap]'); process.exit(2); }
  const comps = COMPARISONS.filter(c => c[1] === unit);
  if (!comps.length) { console.error(`share-replay: no comparison on ${unit}`); process.exit(2); }
  const root = resolve(treeArg), imp = p => import(pathToFileURL(join(root, p)).href);
  const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), CPL = await imp('src/solver/couple.js');
  const G = await imp('src/solver/grid.js'), F = await imp('src/solver/fast.js'), CID = await imp('research/solver/code-id.mjs');
  const ASR = await imp('research/solver/audit-share-rules.mjs'), SRP = await imp('research/solver/share-rules-panel.mjs');
  const SEL = await imp('research/solver/select-phase4.mjs'), CPN = await imp('research/solver/couple-panel.mjs'), AC = await imp('research/solver/audit-couples.mjs');
  const code = CID.codeId(), OUT = join(HERE, 'results', SMOKE_RUN ? 'share-replay-smoke' : 'share-replay');
  mkdirSync(OUT, { recursive: true });
  const u = SRP.readSharePanel().find(x => x.id === unit), base = u.plan;
  const reg = JSON.parse(readFileSync(join(root, 'research/solver/share-rules-paths.json'), 'utf8')), N = reg.paths[unit];
  console.log(`share replay: ${unit}, comparisons ${comps.map(c => c[0]).join(', ')}; the tree ${root} (code ${code ? code.hash : 'unknown'}); seed ${ASR.SEED}, ${N} paths, ${ASR.PTS} points${SMOKE_RUN ? '; SMOKE' : ''}${PLANT ? `; PLANTED ${PLANT}` : ''}; node ${process.version}`);
  const a = SEL.armA(CPN.appPlan(base), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  if (a.label !== u.label) { console.error(`share-replay: arm A's pick ${a.label} is not the landing's ${u.label}`); process.exit(3); }
  const aDemo = E.resolveMpaa(a.planState).demographics, hp = AC.solverPlan('CANDC', base, aPol, ASR.W);
  const stored = arm => { const r = JSON.parse(gunzipSync(readFileSync(join(root, 'research/solver/results/share-rules-run', ASR.fileOf(unit, arm)))).toString());
    const dec = (b64, C) => { const b = Buffer.from(b64, 'base64'), c = new Uint8Array(b.length); c.set(b); return new C(c.buffer, 0, b.length / C.BYTES_PER_ELEMENT); };
    return { r, A: { survived: dec(r.main.survived, Uint8Array), wealth: dec(r.main.wealth, Float32Array), estate: dec(r.main.estate, Float32Array), delivered: dec(r.main.delivered, Float32Array), unmet: dec(r.main.unmet, Float32Array), tax: dec(r.main.tax, Float32Array), failYear: dec(r.main.failYear, Int16Array) } }; };
  const t0 = Date.now(), cps = {};
  for (const arm of ['TODAY', ...new Set(comps.map(c => c[0]))]) {
    const s0 = Date.now(); cps[arm] = ASR.solveArm(arm, hp, ASR.PTS);
    if (Math.abs(cps[arm].share - ASR.shareOfArm(arm, base)) > 1e-12) { console.error(`share-replay: ${arm}'s share ${cps[arm].share} is not its rule's`); process.exit(3); }
    console.log(`  solved ${arm}: share ${cps[arm].share.toFixed(4)}, ${Math.round((Date.now() - s0) / 1000)} s`);
  }
  const planOf = cp => CPL.withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp);
  // the engine's state as the exact model's (couple.js couplePolicy's map)
  const modelState = (cp, es) => { const tierHeld = {}; for (const o of cp.m.ctx.owners) { const h = es.tierHeld && es.tierHeld[o.key]; tierHeld[o.key] = { pen: h ? h.pen || 0 : 0, isa: h ? h.isa || 0 : 0 }; }
    return { pots: { ...es.pots }, basis: { ...es.giaBasis }, cgtCarry: { ...es.cgtCarry }, cumPcls: { ...es.cumPcls }, lumpTaken: { ...es.lumpSumTaken }, cashIsa: { ...(es.cashIsa || {}) }, guard: null, tierHeld }; };
  const heldLayer = (tab, h) => { if (!tab.tsLayers || !tab.tsLayerOf) return null; for (let i = 0; i < tab.actions.length; i++) if ((tab.actions[i].tierPen || 0) === h.pen && (tab.actions[i].tierIsa || 0) === h.isa) return tab.tsLayerOf[i]; return null; };
  // each person's own table's reading of their own position at the start of year t, at the tiers they hold (its survival)
  const readingOf = (cp, st, who, t) => { const tab = cp.tables[who], tabs = tab.mix ? tab.mix.tables : [tab], w = tab.mix ? tab.mix.weights : [1];
    let v = 0; for (let j = 0; j < tabs.length; j++) v += w[j] * tabs[j].value(G.vecOf(tabs[j].m, CPL.ownerState(st, who)), Math.min(t, tabs[j].m.ctx.totalYears), heldLayer(tabs[j], st.tierHeld[who])).survival; return v; };
  const potsOf = (cp, st, who) => { const o = cp.m.ctx.owners.find(x => x.key === who); return Object.values(o.ids).filter(Boolean).reduce((s, id) => s + (st.pots[id] || 0), 0); };
  const risk = name => F.TIER_ORDER.indexOf(name);   // the place in TIER_ORDER: lower is more equity; -1 untiered
  const levelsOf = cp => [...new Set(['self', 'part'].flatMap(w => cp.tables[w].actions.map((x, i) => (cp.tables[w].levelOf ? cp.tables[w].levelOf[i] : x.spendLevel !== undefined ? x.spendLevel : 1))))].sort((x, y) => y - x);
  const yearOf = (cp, st, j, t) => M.step(cp.m, M.cloneState(st), j, t, null, true);   // the year's flows in the exact model, before growth (chooseJoint's test)
  const fundsYear = (cp, st, j, t) => { const row = yearOf(cp, st, j, t); return !(row.unmetDemand > 1 || row.preNmpaInsolvent); };
  const R = REC_FIELDS.length, ix = Object.fromEntries(REC_FIELDS.map((f, i) => [f, i]));
  let REC = null;   // the path being run: its Float32Array record, or null (no record)
  // the policy: both arms' moves at the same state, the parts taken from TODAY's; the record of the year, when kept
  const mixPolicy = (cpX, cpT, parts, keepOther) => ({
    kind: 'table', switchCost: cpX.switchCost || 0, tiersBelow: cpX.tiersBelow || 2,
    choose(es, t) {
      const sX = modelState(cpX, es), jX = CPL.chooseJoint(cpX, sX, t);
      const need = parts.length > 0 || keepOther;
      const jT = need ? CPL.chooseJoint(cpT, modelState(cpT, es), t) : null;
      const j = parts.length ? mixMove(jX, jT, parts, PLANT === 'swap' && parts.length === 4 ? 'swap' : '') : jX;
      if (parts.length === 4 && PLANT !== 'swap' && !sameMove(j, jT)) throw new Error(`share-replay: every part from TODAY is not TODAY's move (year ${t})`);
      if (parts.length === 0 && !sameMove(j, jX)) throw new Error(`share-replay: no part from TODAY is not the rule's move (year ${t})`);
      if (REC) {
        const o = t * R, other = parts.length === 4 ? jX : jT, own = (cp, x, w, c) => risk(get(x, `perOwner.${w}.tier${c}Name`));
        REC[o + ix.level] = j.spendLevel; REC[o + ix.split] = j.split;
        REC[o + ix.penA] = own(cpX, j, 'self', 'Pen'); REC[o + ix.isaA] = own(cpX, j, 'self', 'Isa'); REC[o + ix.penB] = own(cpX, j, 'part', 'Pen'); REC[o + ix.isaB] = own(cpX, j, 'part', 'Isa');
        if (other) { REC[o + ix.oLevel] = other.spendLevel; REC[o + ix.oSplit] = other.split; REC[o + ix.oPenA] = own(cpX, other, 'self', 'Pen'); REC[o + ix.oIsaA] = own(cpX, other, 'self', 'Isa'); REC[o + ix.oPenB] = own(cpX, other, 'part', 'Pen'); REC[o + ix.oIsaB] = own(cpX, other, 'part', 'Isa'); }
        const cpR = parts.length === 4 ? cpT : cpX;   // each person read on the tables of the arm whose move this is
        REC[o + ix.readA] = readingOf(cpR, sX, 'self', t); REC[o + ix.readB] = readingOf(cpR, sX, 'part', t);
        REC[o + ix.potsA] = potsOf(cpX, sX, 'self'); REC[o + ix.potsB] = potsOf(cpX, sX, 'part');
        const y = yearOf(cpR, sX, j, t), f = !(y.unmetDemand > 1 || y.preNmpaInsolvent); REC[o + ix.funded] = f ? 1 : 0; REC[o + ix.draw] = y.netDrawdown || 0;
        if (!f) { let best = -1; for (const L of levelsOf(cpR)) { if (best >= 0) break; for (const sp of cpR.splits) if (fundsYear(cpR, sX, { ...j, spendLevel: L, split: sp }, t)) { best = L; break; } } REC[o + ix.fundLevel] = best; } else REC[o + ix.fundLevel] = NaN;
      }
      return j;
    }
  });
  // the engine's path (audit-phase4.mjs runPath's loop, keep false), with each year's unmet spending and tax in the record
  const runRec = (ctx, zs) => {
    const state = E.freshState(ctx), T = ctx.totalYears, Y = T + 1, zPath = zs.length > Y ? zs[Y] : 0;
    let failed = false, failYear = -1, unmet = 0, tax = 0, delivered = 0, last = null;
    for (let t = 0; t <= T; t++) {
      const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
      tax += row.taxPaid + (row.cgtPaid || 0);
      const um = Math.max(0, row.unmetDemand || 0); unmet += um;
      if (row.targetSpend > 0) delivered += Math.max(0, row.targetSpend - um);
      if (REC) { REC[t * R + ix.unmet] = um; REC[t * R + ix.tax] = row.taxPaid + (row.cgtPaid || 0); }
      if (!failed && (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent)) { failed = true; failYear = t; }
      last = row;
    }
    const wealth = Math.max(0, last.totalCombined);
    if (!failed && ctx.solvencyFloor > 0 && wealth < ctx.solvencyFloor) { failed = true; failYear = T; }
    const estate = Math.max(0, wealth - Math.max(0, last.pensions) * ctx.pensionDeathTaxRate);
    return { survived: !failed, failYear, wealth, estate, unmet, tax, delivered };
  };
  const KEYS = ['survived', 'failYear', 'wealth', 'estate', 'delivered', 'unmet', 'tax'];
  const asStored = o => ({ survived: o.survived ? 1 : 0, failYear: o.failYear, wealth: Math.fround(o.wealth), estate: Math.fround(o.estate), delivered: Math.fround(o.delivered), unmet: Math.fround(o.unmet), tax: Math.fround(o.tax) });
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');

  for (const [rule, , mirror] of comps) {
    const c0 = Date.now(), cpX = cps[rule], cpT = cps.TODAY, SX = stored(rule), ST = stored('TODAY');
    for (const [nm, s] of [['TODAY', ST], [rule, SX]]) if (s.r.seed !== ASR.SEED || s.r.N !== N || s.r.stamp.code !== (code && code.hash)) { console.error(`share-replay: ${unit} ${nm}'s stored run is not seed ${ASR.SEED}, ${N} paths and code ${code && code.hash}`); process.exit(3); }
    const idx = { lost: [], saved: [], ctrl: [] }, pop = { lost: 0, saved: 0, ctrl: 0, neither: 0 }, caps = SMOKE_RUN ? SMOKE : CAPS;
    for (let k = 0; k < N; k++) {
      const tk = ST.A.survived[k], xk = SX.A.survived[k], cat = tk && !xk ? 'lost' : xk && !tk ? 'saved' : tk && xk ? 'ctrl' : 'neither';
      pop[cat]++; if (cat !== 'neither' && idx[cat].length < caps[cat]) idx[cat].push(k);
    }
    const plan = planOf(cpX), T = E.buildContext(plan).totalYears, paths = E.pathsForSeed(ASR.SEED, N, T);
    const ctxOf = pol => E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: pol } });
    const cpK = { ...cpX, topK: TOPK };
    const ctx = { X: ctxOf(mixPolicy(cpX, cpT, PARTS_OF.X, true)), T: ctxOf(mixPolicy(cpX, cpT, PARTS_OF.T, true)), L: ctxOf(mixPolicy(cpX, cpT, PARTS_OF.L, false)), R: ctxOf(mixPolicy(cpX, cpT, PARTS_OF.R, false)), S: ctxOf(mixPolicy(cpX, cpT, PARTS_OF.S, false)), TK: E.buildContext(planOf(cpK)) };
    const order = [...idx.lost.map(k => ['lost', k]), ...idx.saved.map(k => ['saved', k]), ...idx.ctrl.map(k => ['ctrl', k])], n = order.length, Y = T + 1;
    const out = Object.fromEntries(RUNS.map(r => [r, { survived: new Uint8Array(n), failYear: new Int16Array(n), wealth: new Float32Array(n), estate: new Float32Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), tax: new Float32Array(n) }]));
    const rec = { X: new Float32Array(n * Y * R).fill(NaN), T: new Float32Array(n * Y * R).fill(NaN) };
    console.log(`  ${rule} against TODAY on ${unit}${mirror ? ' (the mirror)' : ''}: lost ${pop.lost}, saved ${pop.saved}, both keep ${pop.ctrl}, neither ${pop.neither} of ${N}; replaying ${idx.lost.length} lost, ${idx.saved.length} saved, ${idx.ctrl.length} controls`);
    order.forEach(([cat, k], i) => {
      const zs = Float64Array.from(paths[k]);
      for (const run of RUNS) {
        REC = run === 'X' || run === 'T' ? rec[run].subarray(i * Y * R, (i + 1) * Y * R) : null;
        const o = runRec(ctx[run], zs); REC = null;
        const s = asStored(o);
        for (const key of KEYS) out[run][key][i] = s[key];
        if (run === 'X' || run === 'T') {
          const want = run === 'X' ? SX.A : ST.A;
          const bad = KEYS.filter(key => !Object.is(s[key], key === 'survived' ? want.survived[k] : want[key][k]));
          if (bad.length) { console.error(`share-replay: ${unit} ${rule} path ${k} (${cat}): the ${run} replay differs from the stored ${run === 'X' ? rule : 'TODAY'} run in ${bad.map(b => `${b} ${s[b]} against ${want[b][k]}`).join(', ')}`); process.exit(3); }
        }
      }
      if ((i + 1) % 50 === 0) console.log(`    ${i + 1} of ${n} paths, ${Math.round((Date.now() - c0) / 1000)} s`);
    });
    const kept = (run, cat) => order.reduce((s, [c], i) => s + (c === cat && out[run].survived[i] ? 1 : 0), 0);
    // a smoke prints no variant's outcome (the rule's runs are read once, by reduce-share-replay.mjs)
    console.log(`    every path of X and T the stored runs' to the bit${SMOKE_RUN ? '' : `; kept (lost / saved / controls): ${RUNS.map(r => `${r} ${kept(r, 'lost')}/${kept(r, 'saved')}/${kept(r, 'ctrl')}`).join(', ')}`}; ${Math.round((Date.now() - c0) / 1000)} s`);
    writeFileSync(join(OUT, `${unit}-${rule.toLowerCase()}.json.gz`), gzipSync(JSON.stringify({
      unit, rule, mirror: !!mirror, seed: ASR.SEED, N, Y, code: code && code.hash, tree: root, node: process.version, cpu: cpus()[0].model, smoke: SMOKE_RUN, topK: TOPK,
      shares: { TODAY: cpT.share, [rule]: cpX.share }, pop, idx, order: order.map(([c, k]) => [c, k]), fields: REC_FIELDS,
      runs: Object.fromEntries(RUNS.map(r => [r, Object.fromEntries(KEYS.map(key => [key, b64(out[r][key])]))])),
      rec: { X: b64(rec.X), T: b64(rec.T) }, secs: (Date.now() - c0) / 1000
    })));
  }
  console.log(`  done ${unit} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
