/*
 * THE SIMPLE PAGE'S ANSWERS FROM THE SOLVER (Part C Phase 10, item 5; the launch plan's F12). Loaded lazily, with the switch on,
 * for a single household.
 *
 * The page's own two answers hold one input fixed and move the other under the app's rules. Under the switch the solved plan
 * gets its own, found by a search over solves (src/solverSearch.js) when asked: the highest target the solved plan keeps at
 * the page's goal (90%) at your retirement age, then the earliest retirement it keeps there at your spending. Each solve is a
 * variant of the plan solved in workers of its own, its tables let go (src/solverClient.js startFigures), its survival the
 * engine's run of it on the Strategy tab's first paths and seed. The progress is shown solve by solve, and the answers are
 * kept for the inputs they were found on. Named apart from the Strategy tab's "safe starting spend" (F12): these are the
 * highest TARGET and the earliest AGE the solved plan keeps at the goal. The full planner's "Spend and date" step asks the
 * same of its own plan, at the survival it is set to (src/App.jsx; item 2's rest).
 */
import React, { useEffect, useRef, useState } from 'react';
import { highestTarget, earliestAge, SEARCH_MOST, SEARCH_GOAL } from './solverSearch.js';
import { atSpend, atAge } from './solverSettings.js';

/*
 * The search card itself, for any page: `atSpend(x)` and `atAge(a)` give the plan to solve at a target and at an age (the
 * Simple page's inputs widened by toFullPlan; the full planner's plan with its spending bands scaled), `sig` the inputs the
 * answers belong to. `name` tells the two pages' cards apart for the harness.
 */
export function SolverAnswers({ sig, atSpend, atAge, fromSpend, fromAge, after, last, goal = SEARCH_GOAL, engine, opts, fmt, seed = 12345, name = 'simple', hint = null }) {
  const kept = useRef(new Map());            // the answers found, by the inputs they were found on
  const [run, setRun] = useState({ sig: null, state: 'idle', step: null, spend: null, age: null, error: null });
  const job = useRef(null), live = useRef(0);
  const upto = opts && opts.strategySteps ? opts.strategySteps[0] : 2000;
  // an edit drops a search in flight; the answers already found for other inputs stay kept
  useEffect(() => () => { live.current++; if (job.current) job.current.cancel(); }, [sig]);
  const mine = run.sig === sig ? run : (kept.current.get(sig) || { sig, state: 'idle', step: null, spend: null, age: null, error: null });

  const ask = async () => {
    const token = ++live.current, here = sig;
    const client = await import('./solverClient.js');
    const evalAt = make => async x => {
      if (live.current !== token) throw new Error('cancelled');
      job.current = client.startFigures(engine, make(x), { ...(opts || {}), seed, upto });
      const f = await job.current.done;
      return f.headline.survival;
    };
    const show = patch => { if (live.current === token) setRun(r => ({ ...(r.sig === here ? r : { sig: here, state: 'idle', step: null, spend: null, age: null, error: null }), ...patch })); };
    try {
      show({ state: 'target', step: null });
      const spend = await highestTarget(evalAt(atSpend), { from: fromSpend, goal, onStep: st => show({ step: { what: 'target', ...st } }) });
      show({ spend, state: 'age', step: null });
      const age = fromAge > after && atAge
        ? await earliestAge(evalAt(atAge), { from: fromAge, after, last, goal, onStep: st => show({ step: { what: 'age', ...st } }) })
        : null;
      const done = { sig: here, state: 'done', step: null, spend, age, error: null };
      kept.current.set(here, done);
      if (live.current === token) setRun(done);
    } catch (e) {
      if (e.message !== 'cancelled' && e.message !== 'closed') show({ state: 'failed', error: e.message });
    }
  };

  const target = mine.spend, age = mine.age;
  return (
    <div data-solver-answers={name} data-simple-solver={mine.state} data-simple-solver-from={fromSpend || ''} data-simple-solver-spend={target && target.spend !== null ? target.spend : ''}
      data-simple-solver-age={age && age.age !== null ? age.age : ''} data-simple-solver-tried={JSON.stringify({ spend: target ? target.tried.map(t => t.x) : [], age: age ? age.tried.map(t => t.x) : [] })}
      className="p-3 rounded-xl border border-slate-200 bg-surface text-xs text-slate-700 space-y-1.5">
      <div className="text-sm font-semibold text-slate-900">The solved plan&apos;s answers</div>
      {mine.state === 'idle' && (
        <>
          <p className="text-[11px] text-slate-500">{hint || 'The solver works your plan out again at a few targets and ages to find these. It takes several minutes.'}</p>
          <button type="button" data-simple-solver-ask onClick={ask} className="px-3 py-1.5 min-h-9 rounded-lg bg-accent hover:bg-accent-hover text-onaccent font-semibold cursor-pointer">Find the solved plan&apos;s answers</button>
        </>
      )}
      {(mine.state === 'target' || mine.state === 'age') && (
        <p data-simple-solver-progress>
          {mine.state === 'target' ? 'Finding the highest target' : 'Finding the earliest age'}: solve {mine.step ? mine.step.n + 1 : 1} of at most {SEARCH_MOST[mine.state]}
          {mine.step ? ` (the last, ${mine.step.what === 'target' ? fmt(mine.step.x) : `age ${mine.step.x}`}, kept ${mine.step.survival.toFixed(1)}%)` : ''}…
        </p>
      )}
      {target && (
        <p><span className="font-semibold text-slate-800">Highest target the solved plan keeps at {goal}%</span> (at your retirement age):{' '}
          {target.spend === null ? `none found down to ${fmt(target.tried[target.tried.length - 1].x)}` : `${fmt(target.spend)} a year${target.capped ? ' (at least; the search stopped)' : ''}`}</p>
      )}
      {age && (
        <p><span className="font-semibold text-slate-800">Earliest retirement the solved plan keeps at {goal}%</span> (at your spending):{' '}
          {age.age === null ? 'none found by the end of the plan' : `age ${age.age}${age.capped ? ' (or earlier; the search stopped)' : ''}`}</p>
      )}
      {mine.state === 'failed' && <p className="text-amber-800">The solver could not finish the search: {mine.error}</p>}
    </div>
  );
}

/* the Simple page's card: its inputs widened to the full plan at each target and age */
export function SolverSimple({ s, toFull, fromSpend, engine, opts, fmt, seed = 12345 }) {
  return (
    <SolverAnswers sig={JSON.stringify(s)} atSpend={x => toFull({ ...s, spend: x })} atAge={a => toFull({ ...s, retireSelf: a })}
      fromSpend={fromSpend || Number(s.spend) || 20000} fromAge={Number(s.retireSelf)} after={Number(s.ageSelf)} last={Number(s.terminalAge || 95) - 1}
      engine={engine} opts={opts} fmt={fmt} seed={seed} name="simple" />
  );
}

/* the full planner's card, on its "Spend and date" step under the switch (item 2's rest): the plan on screen at each target
   (its bands scaled) and each age, at the survival the step is set to */
export function SolverPlanAnswers({ plan, fromSpend, goal, ageNow, last, engine, opts, fmt, seed = 12345 }) {
  const own = Number(plan && plan.demographics && plan.demographics.retireAgeSelf);
  return (
    <SolverAnswers sig={JSON.stringify([plan, goal])} atSpend={x => atSpend(plan, x)} atAge={a => atAge(plan, a)}
      fromSpend={fromSpend || Number(plan && plan.spending && plan.spending.targetSpend) || 20000} fromAge={own} after={ageNow} last={last}
      goal={goal} engine={engine} opts={opts} fmt={fmt} seed={seed} name="full"
      hint="The figures above follow your plan's rules. The solver works the plan out again at a few targets and ages to find its own; it takes several minutes." />
  );
}
