/*
 * THE SIMPLE PAGE'S SEARCHES OVER SOLVES (Part C Phase 10, item 5; the launch plan's F12). Under the switch the Simple page's
 * two answers are the solved plan's: found by solving the plan at a few settings, each solve's survival read from the
 * engine's run of the solved plan (src/solverClient.js startFigures). Both run only when asked, report each solve as it lands
 * and keep their answers; each holds one input fixed and moves the other, and its name says which.
 *
 *   highestTarget(evalAt, { from, step, most, goal, onStep })
 *        the highest target spend the solved plan keeps at goal% or above, on a £step grid: from `from` (the page's own answer
 *        under the app's rules), up a fifth at a time until a target fails or down a fifth at a time until one passes, then
 *        halving the gap between the highest pass and the lowest fail to one step. At most `most` solves; where that runs out
 *        first the answer is the highest pass found, marked `capped`. { spend, bracket: [pass, fail], tried, capped }; spend
 *        null where nothing passed.
 *   earliestAge(evalAt, { from, after, last, most, goal, onStep })
 *        the earliest whole retirement age at which the solved plan keeps goal% or above: from the plan's own age, a year
 *        earlier at a time while it passes, or a year later at a time until one does; never at or before `after` (today's
 *        age) nor after `last`. At most `most` solves. { age, tried, capped }; age null where none passed.
 * evalAt(x) is async and gives the survival in percent; onStep({ n, x, survival }) reports each solve. Survival falls as the
 * target rises and rises as retirement comes later, so each search reads its edge from one side; a plan that is not
 * monotone gives the edge nearest the start.
 */
export const SEARCH_STEP = 500, SEARCH_MOST = { target: 8, age: 6 }, SEARCH_GOAL = 90;
export const PLANT = { rule: '' };   // research/tests/solver-search.test.mjs only: 'gt' passes only above the goal, 'nohalve' stops at the bracket

const tryAt = (evalAt, goal, tried, onStep) => async x => {
  const survival = await evalAt(x);
  tried.push({ x, survival });
  if (onStep) onStep({ n: tried.length, x, survival });
  return PLANT.rule === 'gt' ? survival > goal : survival >= goal;
};

export async function highestTarget(evalAt, { from, step = SEARCH_STEP, most = SEARCH_MOST.target, goal = SEARCH_GOAL, onStep = null } = {}) {
  const tried = [], at = tryAt(evalAt, goal, tried, onStep), grid = x => Math.max(step, Math.round(x / step) * step);
  let lo = null, hi = null, x = grid(from);
  if (await at(x)) {
    lo = x;
    while (tried.length < most) { const y = grid(lo * 1.2); if (y <= lo) break; if (await at(y)) lo = y; else { hi = y; break; } }
  } else {
    hi = x;
    while (tried.length < most && hi > step) { const y = grid(hi / 1.2); if (y >= hi) break; if (await at(y)) { lo = y; break; } hi = y; }
  }
  while (PLANT.rule !== 'nohalve' && lo !== null && hi !== null && hi - lo > step && tried.length < most) {
    const m = grid((lo + hi) / 2);
    if (m <= lo || m >= hi) break;
    if (await at(m)) lo = m; else hi = m;
  }
  const capped = lo !== null && hi !== null && hi - lo > step;
  return { spend: lo, bracket: [lo, hi], tried, capped: capped || (lo !== null && hi === null && tried.length >= most) };
}

export async function earliestAge(evalAt, { from, after, last, most = SEARCH_MOST.age, goal = SEARCH_GOAL, onStep = null } = {}) {
  const tried = [], at = tryAt(evalAt, goal, tried, onStep);
  if (await at(from)) {
    let best = from;
    for (let a = from - 1; a > after && tried.length < most; a--) { if (await at(a)) best = a; else return { age: best, tried, capped: false }; }
    return { age: best, tried, capped: best - 1 > after };
  }
  for (let a = from + 1; a <= last && tried.length < most; a++) if (await at(a)) return { age: a, tried, capped: false };
  return { age: null, tried, capped: from + tried.length <= last };
}
