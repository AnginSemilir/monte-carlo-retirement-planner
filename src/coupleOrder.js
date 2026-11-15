/*
 * A COUPLE ENTERED THE OTHER WAY ROUND, FOR THE APP (D104 (1); research/solver/PART-D.md D7). The app calls the first partner
 * entered "you"; a couple whose elder is entered second is handed to the solver elder first, its figures shown back the way it
 * was entered. The mirror is the same household with the two people's places swapped, every field the engine and the solver
 * read in the first person's terms moved with them:
 *   - each person's own fields (the demographics' Self and Part pairs: age, retirement age, salary and its growth, employment,
 *     gains used, losses brought forward, the MPAA age, the state pension), each account's owner and id, each income's,
 *     deposit's and one-off cost's owner, and the limits per person (a tier ceiling each);
 *   - the plan's end age, so the plan ends in the same year (a plan's horizon is counted from the first person's age);
 *   - the spending bands, entered in the first person's ages (App.jsx "Myself" ages), each mapped through the plan years it
 *     covers to the whole ages that cover exactly those years at the new first person's age, as couple.js singlePlanFor maps
 *     a band to the partner's plan; a blank end age stays blank, running to the plan's end.
 * Ages are taken as the engine reads them (a blank age 40 for the first person, the first person's for the partner; a blank
 * end age 100). The end age is the new first person's age plus the plan's whole years as the engine counts them (App.jsx
 * buildContext: the years between the first person's age and the end age, rounded), so the mirror runs the same years with
 * any ages (the reviewer on D104 (1)'s change of default, MINOR 2: with a first age of 60.5 the sum of the ages ran a year
 * short). Mirrored twice, a plan with whole ages is itself. research/tests/couple-order.test.mjs holds each person's year in
 * the mirror to the plan as entered, as the engine reads it; couple-horizon.test.mjs the years over fractional ages.
 *   import { otherOrder, PAIRED } from './coupleOrder.js'; const q = otherOrder(E, plan);
 * PLANT.rule (tests only, a comma list): 'bandstay' leaves the bands where they were entered, as research/solver/couple-order.mjs
 * does; 'mirrorsum' sets the end age by the sum of the ages, as before; 'locksstay' leaves the limits per person where they
 * were entered; below, each answer's: 'noback', 'nostrategy', 'noaheadparts', 'norowsparts', 'noverdict'.
 */
export const PAIRED = ['currentAge', 'retireAge', 'salary', 'salaryGrowth', 'employment', 'cgtGainsUsed', 'cfBroughtForward', 'mpaaAge', 'statePension'];
export const PLANT = { rule: '' };
const planted = k => PLANT.rule.split(',').includes(k);
const swapOwner = o => (o === 'Myself' ? 'Partner' : o === 'Partner' ? 'Myself' : o);
const swapId = id => (typeof id === 'string' && /_(self|part)$/.test(id) ? id.replace(/_(self|part)$/, (_, w) => (w === 'self' ? '_part' : '_self')) : id);
const given = v => v !== '' && v !== undefined && v !== null && Number.isFinite(Number(v));

/* a band in one person's ages (`from0` their age today) as the whole ages covering the same plan years at another's (`to0`) */
export function bandTo(b, from0, to0) {
  if (!given(b.fromAge) || from0 === to0) return b;
  const fromAge = Math.floor(to0 + Math.ceil(Math.round(Number(b.fromAge)) - from0));
  return given(b.toAge) ? { ...b, fromAge, toAge: Math.ceil(to0 + Math.floor(Math.round(Number(b.toAge)) - from0)) } : { ...b, fromAge };
}

export function otherOrder(E, plan) {
  const p = JSON.parse(JSON.stringify(plan)), d = p.demographics;
  if (!d || d.planningMode === 'single') throw new Error('otherOrder takes a couple');
  const ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(plan)));
  for (const k of PAIRED) { const a = d[`${k}Self`], b = d[`${k}Part`]; d[`${k}Self`] = b; d[`${k}Part`] = a; }
  // the ages as the engine reads them, swapped; the end age moved so the plan runs the same whole years from the new first
  // person's age (plant 'mirrorsum': the sum of the ages, which can lose a year to rounding)
  d.currentAgeSelf = ctx.agePart0; d.currentAgePart = ctx.ageSelf0;
  d.terminalAge = planted('mirrorsum') ? ctx.terminalAge - ctx.ageSelf0 + ctx.agePart0 : ctx.agePart0 + ctx.totalYears;
  // each account to the other person, its id's ending with it
  p.accounts = (p.accounts || []).map(a => ({ ...a, owner: swapOwner(a.owner), id: swapId(a.id) }));
  p.otherIncomes = (p.otherIncomes || []).map(i => ({ ...i, owner: swapOwner(i.owner) }));
  // a deposit without an owner is the first person's (couple.js singlePlanFor's reading), so it moves to the partner
  p.oneOffContributions = (p.oneOffContributions || []).map(c => ({ ...c, owner: swapOwner(c.owner || 'Myself') }));
  p.oneOffCosts = (p.oneOffCosts || []).map(c => (c.owner ? { ...c, owner: swapOwner(c.owner) } : c));
  // the bands, entered in the first person's ages, to the new first person's: the old partner's
  if (p.spending && Array.isArray(p.spending.spendBands) && !planted('bandstay')) p.spending.spendBands = p.spending.spendBands.map(b => bandTo(b, ctx.ageSelf0, ctx.agePart0));
  // the limits per person (couple.js personLocks): the first person's ceiling and the partner's swap places
  const L = p.solver && p.solver.locks;
  if (L && 'tierCeilingPart' in L && !planted('locksstay')) { const a = L.tierCeiling, b = L.tierCeilingPart; L.tierCeiling = b; L.tierCeilingPart = a; }
  return E.normalizePlan(p);
}

/*
 * THE SOLVER'S ANSWERS PUT BACK IN THE ORDER THE COUPLE WAS ENTERED (D104 (1)). A couple whose elder is entered second is
 * solved on its mirror, so each answer the page reads names the elder 'self' and the plan's years by the elder's age. Each
 * function below takes one kind of answer for the mirror and gives it back as the couple was entered: each person's figures
 * under their own name, the household's split of the year's spending the entered first person's fraction, and each age
 * the entered first person's (`gap`, the entered first person's age today less the mirror's first person's). Answers about
 * the household alone (survival, spending delivered, the pot, the tax) are the same in either order and pass through.
 * research/tests/couple-order.test.mjs holds each to the couple as entered.
 */
const flipWho = w => (w === 'self' ? 'part' : w === 'part' ? 'self' : w);
const flipKey = k => (/Self$/.test(k) ? k.replace(/Self$/, 'Part') : /Part$/.test(k) ? k.replace(/Part$/, 'Self') : k);
/* a joint move taken apart (solverCouple.js jointParts): each person's part to the other, the split the other's fraction */
export const backParts = jp => (jp ? { ...jp, ...(jp.split !== undefined && jp.split !== null ? { split: 1 - jp.split } : {}), self: jp.part, part: jp.self } : jp);
/* the couple's meta (solverCouple.js coupleMeta): each person's table's meta and the share, the entered first person's */
export const backMeta = m => (m && m.couple ? { ...m, share: 1 - m.share, self: m.part, part: m.self } : m);
/* this year's actions (solverCouple.js coupleActionsOf) */
export const backActions = a => (a && a.couple ? {
  ...a, move: a.move ? { ...a.move, parts: backParts(a.move.parts) } : a.move,
  actions: (a.actions || []).map(x => ({ ...x, who: flipWho(x.who), ...(x.skip ? { skip: { ...x.skip, parts: backParts(x.skip.parts) } } : {}) }))
} : a);
/* the next years (solverCouple.js coupleAheadOf): each row's age the entered first person's, each person's moves under their
   own name (plant 'noaheadparts': the parts left as the mirror's) */
export const backAhead = (a, gap) => (a && a.couple ? { ...a, rows: (a.rows || []).map(r => ({ ...r, age: r.age + gap, parts: planted('noaheadparts') ? r.parts : backParts(r.parts) })) } : a);
/* one engine row of the mirror: each person's fields to the other's name, each account's id to the other's, the tiers the
   entered first person's (a row carries the first person's alone: taken from the year's move, `parts`, where given) */
export function backRow(row, parts = null) {
  const out = {};
  for (const [k, v] of Object.entries(row)) out[flipKey(k)] = v;
  if (row.pots) out.pots = Object.fromEntries(Object.entries(row.pots).map(([id, v]) => [swapId(id), v]));
  if (parts && parts.part) {
    for (const k of ['tierPen', 'tierIsa']) if (parts.part[k] !== undefined) out[k] = parts.part[k];
    // the row's tier names are the mirror's first person's, and no page reads them: left out rather than misnamed
    delete out.tierPenName; delete out.tierIsaName;
  }
  return out;
}
/* a run's verdict (App.jsx evaluateRows): the failure age the entered first person's (plant 'noverdict': the mirror's) */
export const backVerdict = (v, gap) => (v && v.failAge !== null && v.failAge !== undefined && !planted('noverdict') ? { ...v, failAge: v.failAge + gap } : v);
/* the year rows (solverCouple.js coupleRowsOf); plant 'norowsparts': each year's parts left as the mirror's */
export const backRows = (r, gap) => (r && r.couple ? { ...r, rows: r.rows.map((row, t) => backRow(row, r.parts[t])), parts: planted('norowsparts') ? r.parts : r.parts.map(backParts), verdict: backVerdict(r.verdict, gap) } : r);
/* the Strategy tab's figures (src/solverStrategy.js strategySummary, worked out on the mirror's context): the raise's age and
   each outlook year's age the entered first person's. The page reads the wealth chart's ages and the back mark's from the
   outlook's first year (src/PlannerPlan.jsx ageAt0Of), so those follow; the rest of the figures are the household's and pass
   through (the reviewer on D104 (1)'s change of default, BLOCKING 1). Plant 'nostrategy': left as the mirror's */
export const backStrategy = (s, gap) => (s && !planted('nostrategy') ? {
  ...s,
  raise: s.raise ? { ...s.raise, age: s.raise.age + gap } : s.raise,
  outlook: s.outlook ? { ...s.outlook, spend: (s.outlook.spend || []).map(p => ({ ...p, age: p.age + gap })) } : s.outlook
} : s);
/* one answer of the owner worker's (src/solverWorker.js), by its kind, put back as entered: the Strategy tab's figures, the
   year rows, the next years and this year's actions; the plant 'noback' leaves every one as the mirror's
   (research/tests/couple-swap.test.mjs) */
export function backAnswer(kind, r, gap) {
  if (!r || planted('noback')) return r;
  if (kind === 'strategy') return { ...r, strategy: backStrategy(r.strategy, gap) };
  if (kind === 'rows') return { ...r, rows: backRows(r.rows, gap) };
  if (kind === 'ahead') return { ...r, ahead: backAhead(r.ahead, gap) };
  if (kind === 'actions') return { ...r, actions: backActions(r.actions) };
  return r;
}
