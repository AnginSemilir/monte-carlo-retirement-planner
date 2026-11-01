/*
 * THE STRATEGY TAB UNDER THE SWITCH (Part C Phase 9; the launch plan section 4). Shown only with the switch on, for a single
 * household (App.jsx `solverRules`), and loaded lazily, so the app with the switch off fetches none of it.
 *
 * Its figures are the engine's simulation of the solved plan, asked of the worker that holds the solve (src/useSolver.js
 * `ask`, src/solverWorker.js 'strategy', src/solverStrategy.js): 2,000 paths first, then 5,000 (the launch plan's budget),
 * on the projection's own seed, so "your plan" is the projection's figure on the same paths (a harness's light settings may
 * name fewer: SOLVER_OPTS.strategySteps, App.jsx). Its words are
 * src/solverWords.js's table (B4).
 *
 *   the headline     the safe starting spend, the year a typical run is back at target, the chance the money lasts and the
 *                    spending delivered beside it (wording section 1)
 *   the explanation  the short note or the full text, by the length of the dip (wording section 2; B4: three years)
 *   the comparison   your plan against the solved plan on the same paths: survival, the median and unlucky-tenth pot, lifetime
 *                    tax, the estate net of the pension's death tax
 *   the late raise   what good markets would allow (wording section 4)
 * A solve that failed shows the line and "try again"; the tab below it keeps the app's rules (App.jsx shows the tournament).
 */
import React, { useEffect, useState } from 'react';
import { headlineWords, explanationWords, raiseWords, actionWords, aheadWords, COME_BACK } from './solverWords.js';

export const STEPS = [2000, 5000];

export function SolverStrategy({ plan, solve, seed, fmt, isPhone, onRetry, onSolveRequest = null, steps = STEPS, actionsN = 1000 }) {
  const [view, setView] = useState({ key: null, strategy: null, error: null });
  const [more, setMore] = useState({ key: null, actions: null, ahead: null });
  const solved = solve.solveState === 'solved' && solve.solveMeta && !solve.solveMeta.error && solve.ask;
  useEffect(() => {
    if (!solved) return undefined;
    let live = true;
    (async () => {
      for (const upto of steps) {
        try {
          const { strategy } = await solve.ask('strategy', { plan, seed, upto });
          if (!live) return;
          setView({ key: solve.key, strategy, error: null });
          // after the headline's first paths: the next years on its median path, then this year's actions and their skips
          if (upto === steps[0]) {
            const { ahead } = await solve.ask('ahead', { plan, seed, years: 10 });
            if (!live) return;
            setMore(m => ({ ...m, key: solve.key, ahead }));
          }
        } catch (e) { if (live && e.message !== 'closed') setView({ key: solve.key, strategy: null, error: e.message }); return; }
      }
      try {
        const { actions } = await solve.ask('actions', { plan, seed, n: actionsN });
        if (live) setMore(m => ({ ...m, key: solve.key, actions }));
      } catch (e) { /* the actions are extra; the headline stands without them */ }
    })();
    return () => { live = false; };
  }, [solved, solve.key, plan, seed]);   // eslint-disable-line react-hooks/exhaustive-deps

  const failed = solve.solveMeta && solve.solveMeta.error;
  if (failed || view.error) {
    return (
      <div data-solver-strategy data-strategy-state="failed" className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-slate-700 space-y-2">
        <p className="font-semibold text-amber-900">The solver could not finish this plan, so the figures below follow the app&apos;s own rules.</p>
        <p className="text-[11px] text-slate-500">{failed || view.error}</p>
        {onRetry && <button type="button" data-strategy-retry onClick={onRetry} className={`px-3 py-1.5 rounded-lg bg-surface border border-amber-300 text-amber-900 font-semibold cursor-pointer ${isPhone ? 'min-h-11' : ''}`}>Try again</button>}
      </div>
    );
  }
  const s = view.key === solve.key ? view.strategy : null;
  if (!s && solve.solveState === 'idle' && onSolveRequest) {
    return (
      <div data-solver-strategy data-strategy-state="idle" className="p-4 bg-surface border border-slate-200/90 rounded-xl text-xs text-slate-600 space-y-2">
        <p>On a phone the plan is worked out when you ask.</p>
        <button type="button" data-solve-request onClick={onSolveRequest} className="px-3 py-1.5 min-h-11 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer">Solve my plan</button>
      </div>
    );
  }
  if (!s) {
    const p = solve.progress;
    return (
      <div data-solver-strategy data-strategy-state={solve.solveState === 'solved' ? 'simulating' : 'solving'} className="p-4 bg-surface border border-slate-200/90 rounded-xl text-xs text-slate-600">
        {solve.solveState === 'solved' ? `Running your plan through ${steps[0].toLocaleString()} markets…` : `Working out your plan${p && p.total ? ` (${Math.round((100 * p.done) / p.total)}%)` : ''}…`}
      </div>
    );
  }
  const h = s.headline, w = headlineWords(h, fmt), x = explanationWords(h), raise = raiseWords(s.raise), c = s.compare;
  const rows = [
    ['Chance the money lasts', v => `${v.survival.toFixed(1)}%`, 'survival'],
    ['Pot left at the end, typical', v => fmt(v.medianPot), 'medianPot'],
    ['Pot left at the end, unlucky tenth', v => fmt(v.p10Pot), 'p10Pot'],
    ['Tax over your lifetime, typical', v => fmt(v.lifetimeTax), 'lifetimeTax'],
    ['Estate after the pension\'s death tax, typical', v => fmt(v.estate), 'estate']
  ];
  return (
    <div data-solver-strategy data-strategy-state={s.trials >= steps[steps.length - 1] ? 'done' : 'partial'} data-strategy-trials={s.trials} data-strategy-case={h.case}
      data-strategy-figures={JSON.stringify(s)} className="space-y-4">
      <div className="p-5 bg-surface border border-indigo-200 rounded-xl space-y-2" data-strategy-headline>
        <div className="text-xs font-semibold text-indigo-900">{w.title}</div>
        <div className="text-2xl font-bold text-slate-900">{w.amount}</div>
        {w.share && <p className="text-xs text-slate-700">{w.share} {w.back}</p>}
        <p className="text-sm text-slate-800">{w.chance.replace(/: .*/, ': ')}<strong>{w.chance.replace(/.*: /, '')}</strong></p>
        <p className="text-[11px] text-slate-500">{w.delivered}. On {s.trials.toLocaleString()} simulated markets.</p>
        {raise && <p className="text-[11px] text-emerald-800" data-strategy-raise>{raise}</p>}
      </div>
      {x && (
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-slate-700 space-y-2" data-strategy-explanation={x.kind}>
          {x.title && <div className="font-semibold text-slate-900">{x.title}</div>}
          {x.paras.map((t, i) => <p key={i} className="leading-relaxed">{t}</p>)}
        </div>
      )}
      {(() => {
        const mine = more.key === solve.key ? more : {}, ctx = { target: h.target, fmt };
        return (<>
          <div className="p-4 bg-surface border border-slate-200/90 rounded-xl space-y-2" data-strategy-actions={mine.actions ? 'done' : 'pending'}>
            <div className="text-xs font-semibold text-slate-900">{h.retired ? 'This year' : 'This year, before you retire'}</div>
            {!mine.actions ? <p className="text-[11px] text-slate-500">Working out what each of this year&apos;s steps is worth…</p>
              : !mine.actions.actions.length ? <p className="text-xs text-slate-700" data-strategy-action="none">Nothing to change this year: keep to your plan as it stands.</p>
                : mine.actions.actions.map(x => { const t = actionWords(x, ctx); return (
                  <div key={x.part} className="text-xs" data-strategy-action={x.part} data-strategy-cost={x.cost === null ? '' : x.cost}>
                    <div className="text-slate-800 font-medium">{t.what}</div><div className="text-[11px] text-slate-500">{t.cost}</div>
                  </div>); })}
          </div>
          {mine.ahead && (
            <div className="p-4 bg-surface border border-slate-200/90 rounded-xl" data-strategy-ahead={mine.ahead.rows.length}>
              <div className="text-xs font-semibold text-slate-900 mb-2">The next ten years on a typical run of the markets</div>
              <table className="w-full text-[11px]"><tbody>
                {mine.ahead.rows.map(r => { const t = aheadWords(r, ctx); return (
                  <tr key={r.t} className="border-t border-slate-100"><td className="py-1 pr-2 text-slate-500 whitespace-nowrap">{t.when}</td><td className="pr-2 text-slate-800 whitespace-nowrap">{t.spend}</td><td className="text-slate-600">{t.notes}</td></tr>); })}
              </tbody></table>
              <p className="text-[11px] text-slate-500 mt-2">{COME_BACK}</p>
            </div>
          )}
        </>);
      })()}
      <div className="p-4 bg-surface border border-slate-200/90 rounded-xl" data-strategy-compare>
        <div className="text-xs font-semibold text-slate-900 mb-2">Your plan against the solved plan, on the same {s.trials.toLocaleString()} markets</div>
        <table className="w-full text-xs">
          <thead><tr className="text-slate-500"><th className="text-left font-medium py-1"></th><th className="text-right font-medium">Your plan</th><th className="text-right font-medium">Solved</th></tr></thead>
          <tbody>
            {rows.map(([label, f, k]) => (
              <tr key={k} className="border-t border-slate-100" data-strategy-row={k}><td className="py-1.5 text-slate-700">{label}</td><td className="text-right text-slate-700">{f(c.yours)}</td><td className="text-right font-semibold text-slate-900">{f(c.solved)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
