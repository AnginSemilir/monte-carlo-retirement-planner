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
import { toBody } from './phone.jsx';
import { highestTarget, earliestAge, SEARCH_MOST, SEARCH_GOAL } from './solverSearch.js';
import { atSpend, atAge } from './solverSettings.js';
import { moreJob } from './solveStatus.js';

/*
 * The search card itself, for any page: `atSpend(x)` and `atAge(a)` give the plan to solve at a target and at an age (the
 * Simple page's inputs widened by toFullPlan; the full planner's plan with its spending bands scaled), `sig` the inputs the
 * answers belong to. `name` tells the two pages' cards apart for the harness.
 */
// step U: `title` and `cost` for What if's card ("The solved plan's limits"), `place` for the status strip's count of solves running
export function SolverAnswers({ sig, atSpend, atAge, fromSpend, fromAge, after, last, goal = SEARCH_GOAL, engine, opts, fmt, seed = 12345, name = 'simple', hint = null, title = null, cost = null, place = null }) {
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
      if (place) moreJob(place, 1);
      try { const f = await job.current.done; return f.headline.survival; } finally { if (place) moreJob(place, -1); }
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
      {title ? <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3> : <div className="text-sm font-semibold text-slate-900">The solved plan&apos;s answers</div>}
      {mine.state === 'idle' && (
        <>
          <p className="text-[11px] text-slate-500">{hint || 'The solver works your plan out again at a few targets and ages to find these. It takes several minutes.'}</p>
          <button type="button" data-simple-solver-ask onClick={ask} className="px-3 py-1.5 min-h-9 rounded-lg bg-accent hover:bg-accent-hover text-onaccent font-semibold cursor-pointer">Find the solved plan&apos;s answers</button>
          {cost && <p data-figures-cost className="text-[11px] text-slate-500">{cost}</p>}
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

/*
 * On a phone the Simple page's Figures tab is one screen with no scroll, and it has no room for the card (on a 664px iPhone
 * it ran 115px past its pane). So there the card is a button beside the export, the same height as it, and the card opens in
 * a sheet of its own. The sheet stays mounted once opened, hidden when closed, so a search in flight carries on and its
 * answers are there when it is opened again.
 */
export function SolverSimpleSheet(props) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" data-simple-solver-open aria-expanded={open} onClick={() => { setSeen(true); setOpen(true); }}
        className="shrink-0 flex items-center justify-center px-3 min-h-11 rounded-lg border border-slate-200 bg-surface text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-semibold cursor-pointer">
        The solved plan&apos;s answers
      </button>
      {seen && toBody(
        <div role="dialog" aria-modal="true" aria-label="The solved plan's answers" data-simple-solver-sheet={open ? 'open' : 'closed'}
          className={`fixed inset-0 z-[55] bg-surface fill-viewport flex flex-col ${open ? '' : 'hidden'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 shrink-0">
            <span className="text-sm font-semibold text-slate-900 truncate">The solved plan&apos;s answers</span>
            <button type="button" data-simple-solver-close onClick={() => setOpen(false)} aria-label="Close the solved plan's answers"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer shrink-0 text-lg leading-none">
              &times;
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3"><SolverSimple {...props} /></div>
        </div>
      )}
    </>
  );
}

/* the full planner's card, on its "Spend and date" step under the switch (item 2's rest): the plan on screen at each target
   (its bands scaled) and each age, at the survival the step is set to */
// step U (LAYOUT.md section 3.3): on What if, "The solved plan's limits", its goal an input (90% by default), its cost the most
// the search can take; the card as built, its data-solver-answers="full" kept
export function SolverPlanAnswers({ plan, fromSpend, goal: goal0 = SEARCH_GOAL, ageNow, last, engine, opts, fmt, seed = 12345, whatIf = false }) {
  const own = Number(plan && plan.demographics && plan.demographics.retireAgeSelf);
  const [g, setG] = useState(goal0);
  const goal = whatIf ? g : goal0;
  const most = SEARCH_MOST.target + (own > ageNow ? SEARCH_MOST.age : 0);
  return (
    <div className="space-y-2">
      {plan && plan.demographics && plan.demographics.planningMode === 'couple' && (
        <p data-limits-couple className="text-xs text-slate-500">The retirement age it searches is yours; your partner&apos;s stays as planned.</p>)}
      {whatIf && (
        <label className="flex items-center gap-2 text-xs text-slate-700">The chance your money lasts, at least
          <input type="number" min="50" max="99" step="1" data-limits-goal value={g} onChange={e => setG(Math.max(50, Math.min(99, Number(e.target.value) || SEARCH_GOAL)))}
            className="w-16 p-1.5 bg-surface border border-slate-300 rounded-lg text-xs font-bold text-slate-800" />%</label>
      )}
      <SolverAnswers sig={JSON.stringify([plan, goal])} atSpend={x => atSpend(plan, x)} atAge={a => atAge(plan, a)}
        fromSpend={fromSpend || Number(plan && plan.spending && plan.spending.targetSpend) || 20000} fromAge={own} after={ageNow} last={last}
        goal={goal} engine={engine} opts={opts} fmt={fmt} seed={seed} name="full"
        title={whatIf ? 'The solved plan\'s limits' : null} place={whatIf ? 'whatif' : null}
        cost={whatIf ? `Up to ${most} solves (${SEARCH_MOST.target} for the target${own > ageNow ? `, ${SEARCH_MOST.age} for the age` : ''})` : null}
        hint={whatIf ? 'The highest target the solved plan keeps at that chance, at your retirement age, and the earliest retirement it keeps there, at your spending. Not your safe starting spend: the solver works the plan out again at a few targets and ages to find them.'
          : 'The figures above follow your plan\'s rules. The solver works the plan out again at a few targets and ages to find its own; it takes several minutes.'} />
    </div>
  );
}
