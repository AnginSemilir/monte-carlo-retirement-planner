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
import { shareBy, SHARE_RULES, singlePlanFor, solveCouple, chooseJoint, rankFor, ownerState } from './solver/couple.js';
import { vecOf } from './solver/grid.js';
import { solvedContext, yourContext, lifeOf, runPath, partsOf, retireYearOf, firstSweep, joinSkipRuns, shownPolicy } from './solverStrategy.js';
import { wholeMenu, PRODUCT_DEFAULTS } from './solver/solve.js';
import { prepareForSolve, JOINT_KEYS, partCeilingsDiffer, APP_COUPLE } from './solverSettings.js';
import { appPlan } from './solverApp.js';
import { householdForm, householdFromTable, SCALES, mergedState, heldOf, perOwnerOf } from './solver/household.js';
import { TIER_ORDER } from './solver/fast.js';

/* research/tests/couple-solve-client.test.mjs only: 'swap' hands each person the other's table; 'noage' cuts the plans with no
   partner's age (each solved as a single would be); research/tests/couple-default.test.mjs only: 'rawages' leaves a blank age
   or end age as the plan has it, as before D99's fix round (householdPlan); research/tests/household-client.test.mjs only:
   'hhzerofloor' leaves a household's minimum pot at the plan's nought in the cut, and 'partceilkey' hands the household plan
   a partner's ceilings that are the first person's, both as before the reviewer's fix round on D135's change of default;
   research/tests/couple-shown.test.mjs only: 'noshown' reads the couple's policy as it is in the views, not through
   wholeMenu, as before the fix of 20 Nov; research/tests/couple-shape.test.mjs and couple-default.test.mjs only: 'cutnotake'
   cuts and assembles the household without the shapes step 4 takes (APP_COUPLE.takeShapes), as before its change of default */
export const PLANT = { rule: '' };
/* the shapes the household plan takes in the page's cut and assembly alike (step 4's change of default, D145: src/solverSettings.js
   APP_COUPLE.takeShapes; src/solver/household.js householdPlanFor), the same in both so the assembly's plan is the cut's */
const takeShapesOpt = () => (PLANT.rule === 'cutnotake' || !APP_COUPLE.takeShapes || !APP_COUPLE.takeShapes.length ? {} : { takeShapes: APP_COUPLE.takeShapes });
/* the shapes a cut and its assembly take: the app's (takeShapesOpt), or, where a research caller names them, those (COUPLES-ANY.md
   A's 'risks' and 'limits' before their change of default; research/tests/household-risks.test.mjs) */
const shapesOf = (takeShapes) => (takeShapes ? { takeShapes } : takeShapesOpt());

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
  // the share by its rule (couple.js shareBy: 'pots' the app's since D99; 'potsflat' and 'means' research options, D104 (4))
  const rule = SHARE_RULES.includes(shareRule) ? shareRule : 'half', share = rule === 'half' ? 0.5 : shareBy(E, household, rule);
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
 * never valued as another's, or as solved for another age. `joint`, the joint move's options the couple is assembled with
 * (src/solverSettings.js appJoint, the couples' default since D108: tieJoint, tieLook, holdPast; couple.js solveCouple), none
 * where it is not given, as before.
 */
export function assembleCouple(E, M, household, tables, { shareRule = undefined, joint = null, solvedOn } = {}) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  return solveCouple(E, M, household, {
    ...(SHARE_RULES.includes(shareRule) ? { shareRule } : {}),
    ...(joint ? Object.fromEntries(JOINT_KEYS.filter(k => joint[k] !== undefined).map(k => [k, joint[k]])) : {}),
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
/* a household's solve (step 8's port: one table through its one move, src/solver/household.js), and a couple's solve of either
   kind, as the page's couple views take it (this year's actions, the next years, the ledger: the move taken apart per person) */
export const isHousehold = x => !!(x && x.household === true && x.H);
export const isPair = x => isCouple(x) || isHousehold(x);
/* the page's record of a couple's solve: the household's figures and each person's table's own record, plain data */
/*
 * THE HOUSEHOLD PLAN IN THE PAGE (step 8's port, research/solver/HSP-PORT.md; D134 (1)): the worker's two steps, here so a
 * test can run them as the worker does. householdCut ('household-plan'): the couple's plan as the solver takes it
 * (householdPlan), cut at a form (src/solver/household.js householdForm), with the band scaling its table is solved inside
 * ({ k, paOne, paK }, src/solverWorker.js inBands) and the partner's age today; only a scaled form (SCALES), whose bands the
 * cut names. householdSolved ('household'): the household assembled from a table solved on that cut (householdFromTable,
 * which refuses a table solved on another plan or outside the bands), as the solve in hand, at the even split.
 */
/*
 * Two things the page's plans carry that step 8's panel did not (the reviewer on D135's change of default, findings 1 and 3),
 * read here before the cut:
 *   - a minimum pot left at nought, the page's default. The solver keeps one year of the target for any plan with none
 *     (src/solver/solve.js solvePlan's minPotYears), so the household's table is solved with one. The household plan is
 *     given that minimum pot before it is cut, so its table, the couple's model each year is stepped on
 *     (src/solver/household.js assembleHousehold) and the engine's context judge the household's year against the same
 *     one, as a couple's on today's route are (src/solver/couple.js solveCouple: the two tables' together). Without it the
 *     assembly refused every such couple (plant 'hhzerofloor').
 *   - a partner's own ceilings that are, wrapper for wrapper, the first person's (partCeilingsDiffer), which the limits card
 *     keeps once written. They hold the same accounts as none (lockedPlan), so the household plan is handed none. Ceilings
 *     that differ stay, and the household plan refuses them, so such a couple keeps today's route (plant 'partceilkey').
 */
export function householdCut(E, M, plan, form, { takeShapes = null } = {}) {
  if (!SCALES.includes(form)) throw new Error(`householdCut: the page solves a household at a scaled form (${SCALES.join(', ')}), not ${form}`);
  const L = plan && plan.solver && plan.solver.locks;
  const own = L && L.tierCeilingPart && !partCeilingsDiffer(plan) && PLANT.rule !== 'partceilkey' ? (({ tierCeilingPart, ...rest }) => ({ ...plan, solver: { ...plan.solver, locks: rest } }))(L) : plan;
  const h0 = householdPlan(E, own), floorOwn = Math.max(0, E.num(h0.config && h0.config.solvencyFloor, 0));
  const floorKept = Math.round(PRODUCT_DEFAULTS.minPotYears * Math.max(0, E.num(h0.spending && h0.spending.targetSpend, 0)));
  const household = !(floorOwn > 0) && floorKept > 0 && PLANT.rule !== 'hhzerofloor' ? { ...h0, config: { ...h0.config, solvencyFloor: floorKept } } : h0;
  const f = householdForm(E, household, { scale: form, ...shapesOf(takeShapes) }), sc = f.hopts.scale;
  return { household, hplan: f.hp, bands: { k: sc.k, paOne: sc.paOne, paK: !!sc.paK }, ageWith: M.prepare(E, household).ctx.agePart0 };
}
/* the household assembled at the even split: its move the table's own, both people taking it (src/solver/household.js
   chooseHouseholdSingle). `topK`, `tieJoint` and `holdPast` are passed as step 8's arm passed them (audit-household-hsp.mjs's
   HSPA) and do not reach that move (the reviewer on D135's change of default, finding 2): the form and the split are what
   move it */
export function householdSolved(E, M, { household, form, topK, tieJoint, holdPast, takeShapes = null }, table) {
  const cp = householdFromTable(E, M, household, table.plan, table.r, { scale: form, topK, tieJoint, holdPast, ...shapesOf(takeShapes) });
  return { ...cp, split: 'even', counts: null };
}
/* the page's record of a household's solve (step 8's port, research/solver/HSP-PORT.md), plain data: its table's record, and
   the setting it was assembled with as the assembly recorded it (src/solver/household.js assembleHousehold's meta, and the
   split), which the client reads back against what it asked (src/solverClient.js) */
export const householdMeta = cp => ({ household: true, setting: { form: cp.meta && cp.meta.scale ? cp.meta.scale.rule : null, split: cp.split, topK: cp.meta.topK, tieJoint: cp.meta.tieJoint || 0, holdPast: cp.meta.holdPast || 0 }, k: cp.meta && cp.meta.scale ? cp.meta.scale.k : null, split: cp.split, tiersBelow: cp.tiersBelow, table: JSON.parse(JSON.stringify(cp.H.meta)) });

export function coupleMeta(cp) {
  const plain = r => JSON.parse(JSON.stringify(r.meta));
  const joint = Object.fromEntries(JOINT_KEYS.filter(k => cp.meta && cp.meta[k] !== undefined).map(k => [k, cp.meta[k]]));
  return { couple: true, share: cp.share, shareRule: (cp.meta && cp.meta.shareRule) || 'half', joint, tiersBelow: cp.tiersBelow, self: plain(cp.tables.self), part: plain(cp.tables.part) };
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
/* one person's part of a joint move, as a single's move is taken apart; the split and the household's level beside it. With
   `cp` a household whose two people's ladders differ (src/solver/household.js tierMapOf; COUPLES-ANY.md A, amendment 1), a
   person's tier is read as its steps below their own risk, by name, as the page's words read a tier: where the engine added
   the household's tiers past a person's riskier ones, the index is not the steps */
export function personParts(joint, who, cp = null) {
  const o = joint.perOwner[who], ca = { tierPen: o.tierPen || 0, tierIsa: o.tierIsa || 0 };
  // each person's tiers as their own ladder names them (the tier above negative, solverStrategy.js stepsBelow): on today's
  // route their own table's, on the household route the household table's, or, where its two people's ladders differ, their
  // own; with no cp, the indices
  const own = cp && cp.tierMap ? cp.tierMap.own[who] : null;
  const tiers = own ? { pen: own.pen.map(name => ({ name })), isa: own.isa.map(name => ({ name })) } : isHousehold(cp) ? cp.H.c.tiers : cp && cp.tables && cp.tables[who] ? cp.tables[who].c.tiers : null;
  return { ...partsOf({ steps: o.steps, harvest: o.harvest, harvestCeil: o.harvestCeil, spendLevel: joint.spendLevel }, ca, tiers) };
}
export const jointParts = (joint, cp = null) => ({ level: joint.spendLevel !== undefined ? joint.spendLevel : 1, split: joint.split, self: personParts(joint, 'self', cp), part: personParts(joint, 'part', cp) });
/* the joint move with one person's move replaced by their move `ai` (the first person's also sets the household's draw, as
   chooseJoint takes it from theirs) */
export function withPersonMove(cp, joint, who, ai) {
  // a household's (step 8's port): each person's alternative one of the household table's own moves
  const tab = isHousehold(cp) ? cp.H : cp.tables[who], a = tab.actions[ai], on = tiered(tab);
  const per0 = { steps: a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', ...(on ? { tierPen: a.tierPen || 0, tierIsa: a.tierIsa || 0, tierPenName: tierName(tab, 'pen', a.tierPen || 0), tierIsaName: tierName(tab, 'isa', a.tierIsa || 0) } : {}) };
  // a household's whose two people's ladders differ: the household's tier at this person's own index (perOwnerOf)
  const per = isHousehold(cp) && cp.tierMap && on ? perOwnerOf(cp, per0)[who] : per0;
  const top = who === 'self' ? { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump } : {};
  const out = { ...joint, ...top, perOwner: { ...joint.perOwner, [who]: per }, ...(who === 'self' ? { ia: ai } : { ib: ai }) };
  if (PLANT.rule === 'nosplit') delete out.split;
  delete out.score;
  return out;
}
/*
 * A DECISION THE PAGES SHOW IS MADE ON THE WHOLE MENU (D90, for a couple: research/tests/couple-shown.test.mjs). Under the
 * speed mode each of a couple's tables carries the chooser's shortlist (src/solver/solve.js), an approximation for the paths
 * that only count. This year's move and its skips' alternatives, the next years and a market's rows are decisions the pages
 * show, so they ask through wholeMenu (src/solverStrategy.js shownPolicy), as a single's views do. The skips' runs after the
 * forced first year and the counted runs keep the couple's own policy (`base`). With no shortlist on the tables it is the
 * same policy, decision for decision.
 */
const shownOf = base => (PLANT.rule === 'noshown' ? base : shownPolicy(base));
const shownRank = fn => (PLANT.rule === 'noshown' ? fn() : wholeMenu(fn));
const shortlisted = cp => (isHousehold(cp) ? [cp.H] : [cp.tables.self, cp.tables.part]).some(r => r && r.chooserShortlist);
/* the first year's joint move as the engine took it, the model's state then, and the couple's engine context */
export function coupleFirstMove(E, cp) {
  const sc = solvedContext(E, cp), base = sc.policyOverride, T = sc.totalYears, shown = shownOf(base);
  let rec = null;
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t) { const j = shown.choose(st, t); if (t === 0 && !rec) rec = { joint: j, state: modelStateOfCouple(cp, st) }; return j; } } };
  E.runTrial(ctx, Float64Array.from(E.pathsForSeed(1, 1, T)[0]));
  return { ...rec, sc, base };
}
/* this year's skips, each { who, part, value, joint } with the forced joint move, or joint null where no move differs (a
   household's, householdSkipsOf) */
export function coupleSkipsOf(E, cp) {
  if (isHousehold(cp)) return householdSkipsOf(E, cp);
  const f = coupleFirstMove(E, cp), j0 = f.joint, list = [];
  const lvl = (tab, ai) => (tab.levelOf ? tab.levelOf[ai] : tab.actions[ai].spendLevel !== undefined ? tab.actions[ai].spendLevel : 1);
  const ranked = {};
  for (const who of WHO) {
    const tab = cp.tables[who], s = vecOf(tab.m, ownerState(f.state, who)), held = f.state.tierHeld[who];
    ranked[who] = shownRank(() => rankFor(tab, s, 0, tiered(tab) ? { pen: held.pen, isa: held.isa } : null, tab.actions.length));
  }
  const level0 = j0.spendLevel !== undefined ? j0.spendLevel : 1;
  if (level0 !== 1) {
    const alt = ranked.self.find(ai => lvl(cp.tables.self, ai) !== level0);
    list.push({ who: 'household', part: 'level', value: level0, joint: alt === undefined ? null : { ...j0, spendLevel: lvl(cp.tables.self, alt) } });
  }
  for (const who of WHO) {
    const tab = cp.tables[who], p0 = personParts(j0, who, cp);
    for (const part of PERSON_SKIPS) {
      const taken = part === 'draw' ? p0.draw !== 'none' : part === 'harvest' ? p0.harvest !== null : p0[part] > 0;
      if (!taken) continue;
      const alt = ranked[who].find(ai => { const p = partsOf(tab.actions[ai], { tierPen: tab.actions[ai].tierPen || 0, tierIsa: tab.actions[ai].tierIsa || 0 }, tab.c.tiers); return part === 'draw' ? p.draw !== p0.draw : p[part] !== p0[part]; });
      // plant 'skipother': the other person moved to their next-ranked move instead, this person's move left as it was
      const other = who === 'self' ? 'part' : 'self', otherAlt = ranked[other].find(ai => ai !== (other === 'self' ? j0.ia : j0.ib));
      const forced = alt === undefined ? null : PLANT.rule === 'skipother' && otherAlt !== undefined ? withPersonMove(cp, j0, other, otherAlt) : withPersonMove(cp, j0, who, alt);
      list.push({ who, part, value: p0[part], joint: forced });
    }
  }
  return { f, list };
}
/* A HOUSEHOLD'S SKIPS THIS YEAR (step 8's port, research/solver/HSP-PORT.md step 3): coupleSkipsOf's, with the household's moves
   ranked once on its table at the household's merged state, as its chooser reads them (src/solver/household.js
   chooseHouseholdSingle, the tiers held the first person's); for each part each person's move takes, the best-ranked household
   move that differs in that part, taken by that person alone (withPersonMove), the other person's move and the split held; the
   household's level skipped to the level of its best-ranked move at another. Plant 'hhpersonrank' (household-views.test.mjs):
   the moves ranked at the first person's own state, not the household's. */
export function householdSkipsOf(E, cp) {
  const f = coupleFirstMove(E, cp), j0 = f.joint, list = [], H = cp.H;
  const lvl = ai => (H.levelOf ? H.levelOf[ai] : H.actions[ai].spendLevel !== undefined ? H.actions[ai].spendLevel : 1);
  const held = heldOf(cp, f.state), s = vecOf(H.m, PLANT.rule === 'hhpersonrank' ? ownerState(f.state, 'self') : mergedState(cp, f.state));
  const ranked = shownRank(() => rankFor(H, s, 0, tiered(H) ? { pen: held.pen, isa: held.isa } : null, H.actions.length));
  // where the two people's ladders differ, a move differs in a part for a person where its household parts differ (each
  // person takes the household's tier by name), and each skip's value is the person's own (personParts with cp)
  const hParts = ai => partsOf(H.actions[ai], { tierPen: H.actions[ai].tierPen || 0, tierIsa: H.actions[ai].tierIsa || 0 }, H.c.tiers);
  const level0 = j0.spendLevel !== undefined ? j0.spendLevel : 1;
  if (level0 !== 1) {
    const alt = ranked.find(ai => lvl(ai) !== level0);
    list.push({ who: 'household', part: 'level', value: level0, joint: alt === undefined ? null : { ...j0, spendLevel: lvl(alt) } });
  }
  for (const who of WHO) {
    const p0 = personParts(j0, who, cp), c0 = cp.tierMap ? hParts(j0.ia) : p0;
    for (const part of PERSON_SKIPS) {
      const taken = part === 'draw' ? p0.draw !== 'none' : part === 'harvest' ? p0.harvest !== null : p0[part] > 0;
      if (!taken) continue;
      const alt = ranked.find(ai => { const p = hParts(ai); return part === 'draw' ? p.draw !== c0.draw : p[part] !== c0[part]; });
      list.push({ who, part, value: p0[part], joint: alt === undefined ? null : withPersonMove(cp, j0, who, alt) });
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
    return { who: x.who, part: x.part, value: x.value, skip: { parts: jointParts(x.joint, cp) }, cost: (100 * (lost - saved)) / n, lost, saved, n };
  });
  return { couple: true, move: { parts: jointParts(f.joint, cp) }, actions, retired: retireYearOf(f.sc) === 0, sweep: firstSweep(E, f.sc) };
}
/* the next years for a couple: each year's joint move taken apart on the median path of the runs given (a single's aheadOf) */
export function coupleAheadOf(E, cp, plan, runs, { years = 10 } = {}) {
  const sc = solvedContext(E, cp), base = sc.policyOverride, n = runs.solved.length, shown = shownOf(base);
  const order = runs.solved.map((r, k) => [r.terminalPot, k]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const k = order[Math.min(n - 1, Math.floor(n * 0.5))][1];
  const zs = E.pathsForSeed(runs.seed, k + 1, sc.totalYears)[k], rows = [];
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t) { const j = shown.choose(st, t); if (t < years) rows.push({ t, age: sc.ageSelf0 + t, year: sc.baseYear + t, parts: jointParts(j, cp) }); return j; } } };
  const state = E.freshState(ctx), zPath = zs.length > sc.totalYears + 1 ? zs[sc.totalYears + 1] : 0;
  for (let t = 0; t < Math.min(years, sc.totalYears + 1); t++) {
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    if (rows[t]) Object.assign(rows[t], { spend: row.targetSpend > 0 ? row.targetSpend : 0, pot: Math.max(0, row.totalCombined), swept: { toGia: row.sweptToGia || 0, fromGia: row.sweptFromGia || 0, toIsa: row.sweptToIsa || 0 } });
  }
  // the typical run: where the counted runs took the shortlist, the whole menu's own run of the path the rows are shown on
  const onShown = shortlisted(cp) && PLANT.rule !== 'noshown';
  return { couple: true, path: k, rows, typical: onShown ? Array.from(runPath(E, { ...sc, policyOverride: shown }, zs).level) : Array.from(runs.solved[k].level),
    // the typical run's whole life, both arms (the UI pass of 20 Nov; src/solverStrategy.js lifeOf), on the moves the rows show
    life: lifeOf(E, onShown ? { ...sc, policyOverride: shown } : sc, yourContext(E, plan), zs) };
}
/* one market's run of the solved couple year by year, each year's joint move taken apart (a single's rowsOf) */
export function coupleRowsOf(E, cp, market) {
  const sc = solvedContext(E, cp), base = sc.policyOverride, moves = [], shown = shownOf(base);
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t) { const j = shown.choose(st, t); moves[t] = j ? jointParts(j, cp) : null; return j; } } };
  const state = E.freshState(ctx), rows = [];
  for (let t = 0; t <= ctx.totalYears; t++) rows.push(E.stepYear(ctx, state, t, market));
  return { couple: true, rows, parts: rows.map((_, t) => moves[t] || null), verdict: E.evaluateRows(ctx, rows) };
}
