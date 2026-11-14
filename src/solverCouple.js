/*
 * A COUPLE'S SOLVE, FROM TWO SINGLE SOLVES (Part D, D5.1; research/solver/PART-D.md). The page solves a single's plan as one
 * solve (src/solverClient.js startSolve: its key, the store, the split across workers, a dial position's base first). A
 * couple's two tables are each such a solve: each person's plan, as src/solver/couple.js cuts it from the household's, solved
 * by solveForApp with their partner's age today (`ageWith`, D3: B3a's age weights on the chance that either lives), so each
 * is stored, restored and split as a single's is. The owner worker then assembles the couple: solveCouple with a `solveOne`
 * that hands back the two tables already solved, each checked to be the one solved for the plan solveCouple cuts for that
 * person. Nothing here is in src/solver (the code that solves, research/solver/code-id.mjs): it only calls couple.js's own
 * exports, so the couple assembled here is the one solveCouple makes whole (research/tests/couple-solve-client.test.mjs).
 *
 *   const { household, plans, ageWith, share, shareRule } = couplePlans(E, plan, { shareRule });   // in the worker
 *   const cp = assembleCouple(E, M, household, { self: tSelf, part: tPart }, { shareRule, solvedOn });
 */
import { shareFor, singlePlanFor, solveCouple, chooseJoint, rankFor, ownerState } from './solver/couple.js';
import { vecOf } from './solver/grid.js';
import { solvedContext, runPath, partsOf, retireYearOf, firstSweep, joinSkipRuns } from './solverStrategy.js';
import { prepareForSolve } from './solverSettings.js';
import { appPlan } from './solverApp.js';

/* research/tests/couple-solve-client.test.mjs only: 'swap' hands each person the other's table; 'noage' cuts the plans with no
   partner's age (each solved as a single would be); research/tests/couple-default.test.mjs only: 'rawages' leaves a blank age
   or end age as the plan has it, as before D99's fix round (householdPlan) */
export const PLANT = { rule: '' };

/* the household's plan as a couple's tables are solved on: prepared as a single's is (prepareForSolve, then appPlan, so the
   tiers' returns are the tables'), as research/solver/audit-couples.mjs solverPlan prepares the candidate's. Each person's age
   today and the plan's end age are then given as the engine reads them (App.jsx buildContext: a blank age 40 for the first
   person and the first person's for the partner, a blank end age 100, an end age at or below the first person's age a year
   past it), wherever the plan's own figures would read otherwise: couple.js singlePlanFor reads them as plain numbers, so a
   blank age cut that person's plan at age 0 and a blank end age gave each person no horizon (the reviewer on D99, finding 4;
   research/tests/couple-default.test.mjs check 5). A plan whose figures already read as the engine's is returned as it was,
   so every couple solved before is solved the same. */
export function householdPlan(E, plan) {
  const hp = appPlan(E, prepareForSolve(E, plan));
  if (PLANT.rule === 'rawages') return hp;
  const d = hp.demographics, ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(hp)));
  const want = { currentAgeSelf: ctx.ageSelf0, currentAgePart: ctx.agePart0, terminalAge: ctx.terminalAge };
  const reads = (v, x) => v !== '' && v !== null && v !== undefined && typeof v !== 'boolean' && Number(v) === x;
  const fix = Object.fromEntries(Object.entries(want).filter(([k, x]) => !reads(d[k], x)));
  return Object.keys(fix).length ? { ...hp, demographics: { ...d, ...fix } } : hp;
}

/*
 * The two people's plans as solveCouple cuts them (couple.js: the share of the household's spending, singlePlanFor, then
 * normalised and the MPAA resolved), each with its partner's age today, the age solveCouple hands each person's solve.
 */
export function couplePlans(E, plan, { shareRule = undefined } = {}) {
  const household = householdPlan(E, plan), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(household)));
  if (!ctx.isCouple) throw new Error('couplePlans takes a couple');
  const rule = shareRule === 'pots' ? 'pots' : 'half', share = rule === 'pots' ? shareFor(household) : 0.5;
  const plans = {
    self: E.resolveMpaa(E.normalizePlan(singlePlanFor(household, 'self', share))),
    part: E.resolveMpaa(E.normalizePlan(singlePlanFor(household, 'part', 1 - share)))
  };
  const ageWith = PLANT.rule === 'noage' ? { self: undefined, part: undefined } : { self: ctx.agePart0, part: ctx.ageSelf0 };
  return { household, plans, ageWith, share, shareRule: rule };
}

/*
 * The couple from its two tables, solved elsewhere: solveCouple (couple.js) with a solveOne that hands back the table solved
 * for each person. `solvedOn` names, for each person, the plan and the partner's age their table was solved on: solveCouple
 * cuts each person's plan again here and hands it to solveOne with the partner's age; either differing refuses, so a table is
 * never valued as another's, or as solved for another age.
 */
export function assembleCouple(E, M, household, tables, { shareRule = undefined, solvedOn } = {}) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  return solveCouple(E, M, household, {
    ...(shareRule === 'pots' ? { shareRule: 'pots' } : {}),
    solveOne: (p, o) => {
      const who = PLANT.rule === 'swap' ? (o.who === 'self' ? 'part' : 'self') : o.who, on = solvedOn && solvedOn[o.who];
      if (!on) throw new Error(`assembleCouple: no record of the plan ${o.who}'s table was solved on`);
      if (!same(on.plan, p)) throw new Error(`assembleCouple: ${o.who}'s table was solved on another plan than the one cut for them`);
      if (on.ageWith !== o.partnerAge0) throw new Error(`assembleCouple: ${o.who}'s table was solved with their partner aged ${on.ageWith}, not ${o.partnerAge0}`);
      if (!tables[who]) throw new Error(`assembleCouple: no table for ${o.who}`);
      return tables[who];
    }
  });
}

/* a couple's solve in hand (solveCouple's result), as against a single's table */
export const isCouple = x => !!(x && x.tables && x.tables.self && x.tables.part && x.plans);
/* the page's record of a couple's solve: the household's figures and each person's table's own record, plain data */
export function coupleMeta(cp) {
  const plain = r => JSON.parse(JSON.stringify(r.meta));
  return { couple: true, share: cp.share, shareRule: (cp.meta && cp.meta.shareRule) || 'half', tiersBelow: cp.tiersBelow, self: plain(cp.tables.self), part: plain(cp.tables.part) };
}

/*
 * A COUPLE'S MOVES, PERSON BY PERSON (Part D, D5.3). The joint move the engine takes each year (couple.js chooseJoint: the
 * household's spending level, the split of the year's spending between the two, and each person's move: their draw order,
 * harvest and tiers, `perOwner`) is taken apart for each person as a single's move is (solverStrategy.js partsOf). This year's
 * skips are a single's: for each part a person's move takes, the best-ranked move of theirs that differs in that part, the
 * other person's move and the split held, forced in the first year, the plan run on after; the household's level skipped to
 * the level of the first person's best-ranked move at another. The research's own tests hold every reading here to the joint
 * move the engine took (research/tests/couple-actions.test.mjs). PLANT.rule (tests only): 'skipother' forces the skip on the
 * other person; 'nosplit' drops the split from a forced move.
 */
export const WHO = ['self', 'part'];
export const PERSON_SKIPS = ['draw', 'harvest', 'tierPen', 'tierIsa'];
// couple.js's own: whether a table's moves change a tier, and a tier's name
const tiered = tab => !!(tab.c && tab.c.acts && tab.c.acts.some(a => (a.tierPen || 0) > 0 || (a.tierIsa || 0) > 0));
const tierName = (tab, cat, k) => (tab.c && tab.c.tiers && tab.c.tiers[cat] && tab.c.tiers[cat][k] ? tab.c.tiers[cat][k].name : null);
/* the engine's state as the joint move reads it (couple.js couplePolicy's own reading) */
export function modelStateOfCouple(cp, engineState) {
  const tierHeld = {};
  for (const o of cp.m.ctx.owners) { const h = engineState.tierHeld && engineState.tierHeld[o.key]; tierHeld[o.key] = { pen: h ? h.pen || 0 : 0, isa: h ? h.isa || 0 : 0 }; }
  return { pots: { ...engineState.pots }, basis: { ...engineState.giaBasis }, cgtCarry: { ...engineState.cgtCarry }, cumPcls: { ...engineState.cumPcls },
    lumpTaken: { ...engineState.lumpSumTaken }, cashIsa: { ...(engineState.cashIsa || {}) }, guard: null, tierHeld };
}
/* one person's part of a joint move, as a single's move is taken apart; the split and the household's level beside it */
export function personParts(joint, who) {
  const o = joint.perOwner[who];
  return { ...partsOf({ steps: o.steps, harvest: o.harvest, harvestCeil: o.harvestCeil, spendLevel: joint.spendLevel }, { tierPen: o.tierPen || 0, tierIsa: o.tierIsa || 0 }) };
}
export const jointParts = joint => ({ level: joint.spendLevel !== undefined ? joint.spendLevel : 1, split: joint.split, self: personParts(joint, 'self'), part: personParts(joint, 'part') });
/* the joint move with one person's move replaced by their move `ai` (the first person's also sets the household's draw, as
   chooseJoint takes it from theirs) */
export function withPersonMove(cp, joint, who, ai) {
  const tab = cp.tables[who], a = tab.actions[ai], on = tiered(tab);
  const per = { steps: a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', ...(on ? { tierPen: a.tierPen || 0, tierIsa: a.tierIsa || 0, tierPenName: tierName(tab, 'pen', a.tierPen || 0), tierIsaName: tierName(tab, 'isa', a.tierIsa || 0) } : {}) };
  const top = who === 'self' ? { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump } : {};
  const out = { ...joint, ...top, perOwner: { ...joint.perOwner, [who]: per }, ...(who === 'self' ? { ia: ai } : { ib: ai }) };
  if (PLANT.rule === 'nosplit') delete out.split;
  delete out.score;
  return out;
}
/* the first year's joint move as the engine took it, the model's state then, and the couple's engine context */
export function coupleFirstMove(E, cp) {
  const sc = solvedContext(E, cp), base = sc.policyOverride, T = sc.totalYears;
  let rec = null;
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t) { const j = base.choose(st, t); if (t === 0 && !rec) rec = { joint: j, state: modelStateOfCouple(cp, st) }; return j; } } };
  E.runTrial(ctx, Float64Array.from(E.pathsForSeed(1, 1, T)[0]));
  return { ...rec, sc, base };
}
/* this year's skips, each { who, part, value, joint } with the forced joint move, or joint null where no move differs */
export function coupleSkipsOf(E, cp) {
  const f = coupleFirstMove(E, cp), j0 = f.joint, list = [];
  const lvl = (tab, ai) => (tab.levelOf ? tab.levelOf[ai] : tab.actions[ai].spendLevel !== undefined ? tab.actions[ai].spendLevel : 1);
  const ranked = {};
  for (const who of WHO) {
    const tab = cp.tables[who], s = vecOf(tab.m, ownerState(f.state, who)), held = f.state.tierHeld[who];
    ranked[who] = rankFor(tab, s, 0, tiered(tab) ? { pen: held.pen, isa: held.isa } : null, tab.actions.length);
  }
  const level0 = j0.spendLevel !== undefined ? j0.spendLevel : 1;
  if (level0 !== 1) {
    const alt = ranked.self.find(ai => lvl(cp.tables.self, ai) !== level0);
    list.push({ who: 'household', part: 'level', value: level0, joint: alt === undefined ? null : { ...j0, spendLevel: lvl(cp.tables.self, alt) } });
  }
  for (const who of WHO) {
    const tab = cp.tables[who], p0 = personParts(j0, who);
    for (const part of PERSON_SKIPS) {
      const taken = part === 'draw' ? p0.draw !== 'none' : part === 'harvest' ? p0.harvest !== null : p0[part] > 0;
      if (!taken) continue;
      const alt = ranked[who].find(ai => { const p = partsOf(tab.actions[ai], { tierPen: tab.actions[ai].tierPen || 0, tierIsa: tab.actions[ai].tierIsa || 0 }); return part === 'draw' ? p.draw !== p0.draw : p[part] !== p0[part]; });
      // plant 'skipother': the other person moved to their next-ranked move instead, this person's move left as it was
      const other = who === 'self' ? 'part' : 'self', otherAlt = ranked[other].find(ai => ai !== (other === 'self' ? j0.ia : j0.ib));
      const forced = alt === undefined ? null : PLANT.rule === 'skipother' && otherAlt !== undefined ? withPersonMove(cp, j0, other, otherAlt) : withPersonMove(cp, j0, who, alt);
      list.push({ who, part, value: p0[part], joint: forced });
    }
  }
  return { f, list };
}
/* each skip's name, the same in every part that ranks it (joinSkipRuns refuses parts that ran other skips) */
const skipNames = sk => sk.list.map(x => (x.joint ? `${x.who} ${x.part} ${JSON.stringify(jointParts(x.joint))}` : null));
/*
 * This year's skips run on paths from..to-1 of `seed` (a single's skipRuns, for a couple, D5.6): each skip's joint move forced
 * in the first year, the plan after; a split solve's part runs its share and the owner joins them in path order
 * (solverStrategy.js joinSkipRuns), so the costs are the whole run's (research/tests/couple-split.test.mjs). Plant 'skipdrop'
 * (that test): a part after the first leaves out the first path of its share, which the join refuses.
 */
export function coupleSkipRuns(E, cp, { seed = 12345, from = 0, to = 1000 } = {}, sk = coupleSkipsOf(E, cp)) {
  const { f, list } = sk, paths = E.pathsForSeed(seed, to, f.sc.totalYears).slice(PLANT.rule === 'skipdrop' && from > 0 ? from + 1 : from);
  return {
    seed, from, to, skips: skipNames(sk),
    survived: list.map(x => {
      if (!x.joint) return null;
      const forced = { ...f.sc, policyOverride: { ...f.base, choose: (st, t) => (t === 0 ? x.joint : f.base.choose(st, t)) } };
      return Uint8Array.from(paths, zs => (runPath(E, forced, Float64Array.from(zs)).survived ? 1 : 0));
    })
  };
}
/* this year's actions for a couple: the joint move taken apart and each skip's survival cost on paths 0..n-1 of `seed`,
   against the plan's own runs (`base`, the strategy's, where held), as a single's actionsOf; `parts`, the split solve's parts'
   skip runs (coupleSkipRuns), joined in path order, else run here whole */
export function coupleActionsOf(E, cp, plan, { seed = 12345, n = 1000, base = null, parts = null } = {}) {
  const sk = coupleSkipsOf(E, cp), { f } = sk;
  const runs = parts && parts.length ? joinSkipRuns(parts) : coupleSkipRuns(E, cp, { seed, from: 0, to: n }, sk);
  if (runs.from !== 0 || runs.to !== n || runs.seed !== seed) throw new Error(`coupleActionsOf: the skips' runs are paths ${runs.from} to ${runs.to - 1} of seed ${runs.seed}, not 0 to ${n - 1} of ${seed}`);
  if (JSON.stringify(runs.skips) !== JSON.stringify(skipNames(sk))) throw new Error('coupleActionsOf: the parts ran other skips than this couple ranks');
  const planRuns = base && base.length >= n ? base.slice(0, n) : E.pathsForSeed(seed, n, f.sc.totalYears).map(zs => runPath(E, f.sc, Float64Array.from(zs)));
  const actions = sk.list.map((x, j) => {
    if (!x.joint) return { who: x.who, part: x.part, value: x.value, skip: null, cost: null };
    const sv = runs.survived[j];
    let saved = 0, lost = 0;
    for (let k = 0; k < n; k++) { if (planRuns[k].survived && !sv[k]) lost++; else if (!planRuns[k].survived && sv[k]) saved++; }
    return { who: x.who, part: x.part, value: x.value, skip: { parts: jointParts(x.joint) }, cost: (100 * (lost - saved)) / n, lost, saved, n };
  });
  return { couple: true, move: { parts: jointParts(f.joint) }, actions, retired: retireYearOf(f.sc) === 0, sweep: firstSweep(E, f.sc) };
}
/* the next years for a couple: each year's joint move taken apart on the median path of the runs given (a single's aheadOf) */
export function coupleAheadOf(E, cp, plan, runs, { years = 10 } = {}) {
  const sc = solvedContext(E, cp), base = sc.policyOverride, n = runs.solved.length;
  const order = runs.solved.map((r, k) => [r.terminalPot, k]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const k = order[Math.min(n - 1, Math.floor(n * 0.5))][1];
  const zs = E.pathsForSeed(runs.seed, k + 1, sc.totalYears)[k], rows = [];
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t) { const j = base.choose(st, t); if (t < years) rows.push({ t, age: sc.ageSelf0 + t, year: sc.baseYear + t, parts: jointParts(j) }); return j; } } };
  const state = E.freshState(ctx), zPath = zs.length > sc.totalYears + 1 ? zs[sc.totalYears + 1] : 0;
  for (let t = 0; t < Math.min(years, sc.totalYears + 1); t++) {
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    if (rows[t]) Object.assign(rows[t], { spend: row.targetSpend > 0 ? row.targetSpend : 0, pot: Math.max(0, row.totalCombined), swept: { toGia: row.sweptToGia || 0, fromGia: row.sweptFromGia || 0, toIsa: row.sweptToIsa || 0 } });
  }
  return { couple: true, path: k, rows, typical: Array.from(runs.solved[k].level) };
}
/* one market's run of the solved couple year by year, each year's joint move taken apart (a single's rowsOf) */
export function coupleRowsOf(E, cp, market) {
  const sc = solvedContext(E, cp), base = sc.policyOverride, moves = [];
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t) { const j = base.choose(st, t); moves[t] = j ? jointParts(j) : null; return j; } } };
  const state = E.freshState(ctx), rows = [];
  for (let t = 0; t <= ctx.totalYears; t++) rows.push(E.stepYear(ctx, state, t, market));
  return { couple: true, rows, parts: rows.map((_, t) => moves[t] || null), verdict: E.evaluateRows(ctx, rows) };
}
