/*
 * THE SOLVED PLAN'S FIGURES AT OTHER SETTINGS (Part C Phase 10, items 3 and 4). Loaded lazily, with the switch on, for a single
 * household.
 *
 *   FiguresList   the headline's figures at the plan's own setting, from the solve in hand (the Strategy tab's first paths
 *                 and seed, read exactly), and on request the other settings' figures, worked out in the background nearest
 *                 first, one at a time, each in workers of its own that are let go once its figures are in
 *                 (src/solverClient.js startFigures; the launch plan's F6: a setting not chosen keeps only its figures). The
 *                 figures belong to the plan with every other input as it is (`sig`), so moving between its settings keeps
 *                 them and any other edit drops them.
 *   SolverAges    the retirement-age dial (B11), on the Strategy tab: the solved plan at the ages either side of the plan's
 *                 own, on request.
 *   SolverScenarios  under the scenario comparison: the solved plan's figures for each scenario, a solve each on request.
 *
 * The dial's line on the Config tab (src/SolverConfig.jsx) is a FiguresList over the dial's four settings.
 */
import React, { useEffect, useState } from 'react';
import { dialLineWords } from './solverWords.js';
import { ageOptions, atAge } from './solverSettings.js';

export function FiguresList({ plan, solve, own, options, order, sig, seed, upto, engine, opts, fmt, name, showLabel, ownLabel = 'At this setting', ownTag = ' (yours)', keyedId = null }) {
  const solved = !!(solve && solve.solveState === 'solved' && solve.solveMeta && !solve.solveMeta.error && solve.ask);
  const [figs, setFigs] = useState({ sig: null, asked: false, at: {} });
  const mine = figs.sig === sig ? figs : { sig, asked: false, at: {} };
  const put = (id, v) => setFigs(f => { const g = f.sig === sig ? f : { sig, asked: false, at: {} }; return { ...g, at: { ...g.at, [id]: v } }; });
  // the plan's own setting: the solve in hand's headline
  useEffect(() => {
    if (!solved) return undefined;
    let live = true;
    (async () => {
      try {
        const { strategy } = solve.strategy ? await solve.strategy(plan, seed, upto, { exact: true }) : await solve.ask('strategy', { plan, seed, upto, exact: true });
        if (live) put(own, { h: strategy.headline, key: solve.key });
      } catch (e) { /* the line waits for the next solve */ }
    })();
    return () => { live = false; };
  }, [solved, solve && solve.key, sig, own, seed, upto]);   // eslint-disable-line react-hooks/exhaustive-deps
  // the other settings, on request, in the order given, one at a time
  useEffect(() => {
    if (!solved || !mine.asked) return undefined;
    let live = true, job = null;
    (async () => {
      const client = await import('./solverClient.js');
      for (const id of order) {
        if (!live) return;
        if (mine.at[id] && mine.at[id].h) continue;
        const o = options.find(x => x.id === id);
        if (!o) continue;
        put(id, { working: true });
        job = client.startFigures(engine, o.plan, { ...(opts || {}), seed, upto, keyed: id === keyedId });
        try { const f = await job.done; if (live) put(id, { h: f.headline }); }
        catch (e) { if (live && e.message !== 'cancelled' && e.message !== 'closed') put(id, { error: e.message }); }
      }
    })();
    return () => { live = false; if (job) job.cancel(); };
  }, [solved, sig, own, mine.asked]);   // eslint-disable-line react-hooks/exhaustive-deps
  const here = mine.at[own] && mine.at[own].h && mine.at[own].key === (solve && solve.key) ? mine.at[own].h : null;
  if (!solved || !here) return null;
  return (
    <div data-figures={name} className="text-[11px] text-slate-600 space-y-1">
      <p data-figures-line data-figures-at={own} data-figures-survival={here.survival}><span className="font-semibold text-slate-800">{ownLabel}:</span> {dialLineWords(here, fmt)}.</p>
      {!mine.asked
        ? <button type="button" data-figures-show onClick={() => setFigs({ ...mine, asked: true })} className="px-2.5 py-1 min-h-9 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer">{showLabel}</button>
        : (
          <ul data-figures-all className="space-y-0.5">
            {options.map(o => {
              const f = o.id === own ? { h: here } : mine.at[o.id] || { working: true };
              return (
                <li key={o.id} data-figures-pos={o.id} data-figures-survival={f.h ? f.h.survival : ''} className={o.id === own ? 'font-semibold text-slate-800' : ''}>
                  {o.label}{o.id === own ? ownTag : ''}: {f.h ? dialLineWords(f.h, fmt) : f.error ? 'could not be worked out' : 'working it out…'}
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
}


/* the retirement-age dial (B11), on the Strategy tab: on request, the solved plan at each of the ages either side of the plan's
   own, one solve an age, each keeping its figures */
export function SolverAges({ plan, solve, ageNow, seed, upto, engine, opts, fmt }) {
  const ao = ageOptions(plan, ageNow);
  if (!ao) return null;
  const sig = JSON.stringify(atAge(plan, 0));
  return (
    <div data-solver-ages className="p-4 rounded-xl border border-slate-200/90 bg-surface space-y-1.5">
      <div className="text-sm font-semibold text-slate-900">Retiring earlier or later</div>
      <p className="text-[11px] text-slate-500">The solved plan at each age, worked out when you ask: one solve an age, so it takes a while.</p>
      <FiguresList plan={plan} solve={solve} own={ao.own} options={ao.ages.map(a => ({ id: a, label: `Retire at ${a}`, plan: atAge(plan, a) }))} order={ao.order} sig={sig}
        seed={seed} upto={upto} engine={engine} opts={opts} fmt={fmt} name="ages" showLabel={`Solve retiring at ${ao.ages[0]} to ${ao.ages[ao.ages.length - 1]}`}
        ownLabel={`Retiring at ${ao.own}, as planned`} ownTag=" (your plan)" />
    </div>
  );
}

/*
 * SCENARIOS EACH CARRY A SOLVE, ON REQUEST (item 6): under the scenario comparison, the solved plan's figures for the plan on
 * screen (the solve in hand) and, when asked, for each scenario compared, one solve a scenario in workers of its own, its
 * tables let go and its figures kept for the page's visit (by the scenario's plan, so a scenario saved again solves again).
 * A couple's scenario keeps the app's rules (D42).
 */
const scenarioFigs = new Map();   // the plan (as JSON) -> { h } | { error }
export function SolverScenarios({ rows, plan, solve, seed, upto, engine, opts, fmt }) {
  const solved = !!(solve && solve.solveState === 'solved' && solve.solveMeta && !solve.solveMeta.error && solve.ask);
  const [, bump] = useState(0);
  const [here, setHere] = useState({ key: null, h: null });
  const [working, setWorking] = useState(null);
  const job = React.useRef(null);
  useEffect(() => {
    if (!solved) return undefined;
    let live = true;
    (async () => {
      try {
        const { strategy } = solve.strategy ? await solve.strategy(plan, seed, upto, { exact: true }) : await solve.ask('strategy', { plan, seed, upto, exact: true });
        if (live) setHere({ key: solve.key, h: strategy.headline });
      } catch (e) { /* waits for the next solve */ }
    })();
    return () => { live = false; };
  }, [solved, solve && solve.key, seed, upto]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (job.current) job.current.cancel(); }, []);
  const ask = async (id, p) => {
    const k = JSON.stringify(p);
    setWorking(id);
    try {
      const client = await import('./solverClient.js');
      job.current = client.startFigures(engine, p, { ...(opts || {}), seed, upto });
      const f = await job.current.done;
      scenarioFigs.set(k, { h: f.headline });
    } catch (e) { if (e.message !== 'cancelled' && e.message !== 'closed') scenarioFigs.set(k, { error: e.message }); }
    job.current = null;
    setWorking(null); bump(x => x + 1);
  };
  if (!solved) return null;
  return (
    <div data-solver-scenarios className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
      <div className="text-xs font-semibold text-slate-800">The solved plan, scenario by scenario</div>
      <ul className="space-y-0.5">
        {rows.map(r => {
          const couple = r.plan && r.plan.demographics && r.plan.demographics.planningMode === 'couple';
          const f = r.isBase ? (here.key === solve.key && here.h ? { h: here.h } : null) : scenarioFigs.get(JSON.stringify(r.plan)) || null;
          return (
            <li key={r.id} data-solver-scenario={r.id} data-solver-scenario-survival={f && f.h ? f.h.survival : ''} className="flex flex-wrap items-center gap-x-2">
              <span className="font-semibold text-slate-800">{r.name}:</span>
              {couple ? <span>a couple&apos;s plan keeps the app&apos;s rules for now.</span>
                : f && f.h ? <span>{dialLineWords(f.h, fmt)}.</span>
                  : f && f.error ? <span>could not be worked out ({f.error}).</span>
                    : r.isBase ? <span>working it out…</span>
                      : working === r.id ? <span>solving it…</span>
                        : <button type="button" data-solver-scenario-ask disabled={!!working} onClick={() => ask(r.id, r.plan)} className="px-2 py-0.5 min-h-7 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer disabled:opacity-50">Solve this scenario</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
