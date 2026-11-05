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
import { ageOptions, atAge, targetOptions, atSpend } from './solverSettings.js';
import { moreJob, costWords } from './solveStatus.js';

/*
 * Step U (LAYOUT.md sections 3.1, 3.3 and 8): a row waiting its turn says so, not "working it out…" (L11); `cost` is said under
 * the button before it is pressed; `table` lays the figures out as the dial's comparison table, every row on the same first
 * paths, the plan's own marked; `place` is where it was asked, for the status strip's count of solves still running;
 * `ownLine` false leaves the plan's own figures out of the list's head (the answer card beside it already shows them, L10).
 */
export function FiguresList({ plan, solve, own, options, order, sig, seed, upto, engine, opts, fmt, name, showLabel, ownLabel = 'At this setting', ownTag = ' (yours)', keyedId = null,
  cost = null, table = false, place = null, ownLine = true, lineOf = null, foot = null }) {
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
        if (place) moreJob(place, 1);
        try { const f = await job.done; if (live) put(id, { h: f.headline }); }
        catch (e) { if (live && e.message !== 'cancelled' && e.message !== 'closed') put(id, { error: e.message }); }
        finally { if (place) moreJob(place, -1); }
      }
    })();
    return () => { live = false; if (job) job.cancel(); };
  }, [solved, sig, own, mine.asked]);   // eslint-disable-line react-hooks/exhaustive-deps
  const here = mine.at[own] && mine.at[own].h && mine.at[own].key === (solve && solve.key) ? mine.at[own].h : null;
  if (!solved) return null;
  // the plan's own line comes first (its figures from the solve in hand, queued behind Your plan's): until then, say so
  if (!here) return <><p data-figures-own-wait className="text-xs text-slate-500">Working out your plan&apos;s own figures first&hellip;</p>{cost && <p data-figures-cost className="text-[11px] text-slate-500">{cost}</p>}</>;
  const line = lineOf || (h => dialLineWords(h, fmt));
  const rowOf = o => (o.id === own ? { h: here } : mine.at[o.id] || { queued: true });
  const said = f => (f.h ? line(f.h) : f.error ? 'could not be worked out' : f.working ? 'working it out…' : 'waiting its turn');
  return (
    <div data-figures={name} className="text-xs text-slate-600 space-y-1.5">
      {ownLine && <p data-figures-line data-figures-at={own} data-figures-survival={here.survival}><span className="font-semibold text-slate-800">{ownLabel}:</span> {line(here)}.</p>}
      {!mine.asked
        ? (<div className="space-y-1">
            <button type="button" data-figures-show onClick={() => setFigs({ ...mine, asked: true })} className="px-3 py-1.5 min-h-9 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer">{showLabel}</button>
            {cost && <p data-figures-cost className="text-[11px] text-slate-500">{cost}</p>}
          </div>)
        : table ? (
          <table data-figures-all data-figures-table className="w-full text-[11px] tabular-nums">
            <thead><tr className="text-slate-500"><th className="text-left font-medium py-1">Setting</th><th className="text-right font-medium">Starts at</th><th className="text-right font-medium">Back at target</th><th className="text-right font-medium">Lasts</th></tr></thead>
            <tbody>{options.map(o => {
              const f = rowOf(o), h = f.h, about = h && h.preview ? 'about ' : '';
              return (
                <tr key={o.id} data-figures-pos={o.id} data-figures-survival={h ? h.survival : ''} data-figures-wait={!h && !f.working && !f.error ? 'queued' : f.working ? 'working' : ''} className={`border-t border-slate-100 ${o.id === own ? 'font-semibold text-slate-800' : ''}`}>
                  <td className="py-1">{o.label}{o.id === own ? ownTag : ''}</td>
                  {h ? (<>
                    <td className="text-right">{about}{h.case === 'atTarget' ? fmt(h.startSpend) : `${fmt(h.startSpend)} (${Math.round(h.startLevel)}%)`}</td>
                    <td className="text-right">{h.case === 'atTarget' ? 'from the start' : h.backYear ? `${about}${h.backYear}` : 'not in half the markets'}</td>
                    <td className="text-right">{about}{Math.round(h.survival)}%</td>
                  </>) : <td colSpan={3} className="text-right text-slate-500">{said(f)}</td>}
                </tr>
              );
            })}</tbody>
          </table>
        ) : (
          <ul data-figures-all className="space-y-0.5">
            {options.map(o => {
              const f = rowOf(o);
              return (
                <li key={o.id} data-figures-pos={o.id} data-figures-survival={f.h ? f.h.survival : ''} data-figures-wait={!f.h && !f.working && !f.error ? 'queued' : f.working ? 'working' : ''} className={o.id === own ? 'font-semibold text-slate-800' : ''}>
                  {o.label}{o.id === own ? ownTag : ''}: {said(f)}
                </li>
              );
            })}
          </ul>
        )}
      {mine.asked && foot && <p className="text-[11px] text-slate-500">{foot}</p>}
    </div>
  );
}

/* the retirement-age dial (B11), What if's first card (step U): on request, the solved plan at each of the ages either side of
   the plan's own, one solve an age, each keeping its figures; its cost said before it is asked */
const NEAREST = 'Nearest first. Each on the same 2,000 simulated markets; your plan\'s answer uses 5,000.';
export function SolverAges({ plan, solve, ageNow, seed, upto, engine, opts, fmt }) {
  const ao = ageOptions(plan, ageNow);
  if (!ao) return null;
  const sig = JSON.stringify(atAge(plan, 0));
  return (
    <div data-solver-ages className="p-4 rounded-xl border border-slate-200/90 bg-surface space-y-1.5">
      <h3 className="text-[15px] font-semibold text-slate-900">Retiring earlier or later</h3>
      <p className="text-xs text-slate-500">The solved plan at each age, worked out when you ask: one solve an age, so it takes a while.</p>
      <FiguresList plan={plan} solve={solve} own={ao.own} options={ao.ages.map(a => ({ id: a, label: `Retire at ${a}`, plan: atAge(plan, a) }))} order={ao.order} sig={sig}
        seed={seed} upto={upto} engine={engine} opts={opts} fmt={fmt} name="ages" showLabel={`Solve retiring at ${ao.ages[0]} to ${ao.ages[ao.ages.length - 1]}`}
        ownLabel={`Retiring at ${ao.own}, as planned`} ownTag=" (your plan)" cost={costWords(ao.order.length)} place="whatif" foot={NEAREST} />
    </div>
  );
}

/* "Spending more or less" (step U, new; LAYOUT.md section 3.3): the age card's twin over the target, one solve a target, the
   headline on the first 2,000 paths; the figures belong to the plan with every other input as it is */
export function SolverTargets({ plan, solve, seed, upto, engine, opts, fmt }) {
  const to = targetOptions(plan);
  if (!to) return null;
  const sig = JSON.stringify(atSpend(plan, 1));
  const lo = to.order.reduce((a, b) => Math.min(a, b)), hi = to.order.reduce((a, b) => Math.max(a, b));
  return (
    <div data-solver-targets data-targets-options={to.targets.length} className="p-4 rounded-xl border border-slate-200/90 bg-surface space-y-1.5">
      <h3 className="text-[15px] font-semibold text-slate-900">Spending more or less</h3>
      <p className="text-xs text-slate-500">The solved plan at each target, worked out when you ask: one solve a target, every other input as it is.</p>
      <FiguresList plan={plan} solve={solve} own={to.own} options={to.targets.map(x => ({ id: x, label: `Spend ${fmt(x)} a year`, plan: atSpend(plan, x) }))} order={to.order} sig={sig}
        seed={seed} upto={upto} engine={engine} opts={opts} fmt={fmt} name="targets" showLabel={`Solve ${fmt(lo)} to ${fmt(hi)} a year`}
        ownLabel={`Spend ${fmt(to.own)} a year, as planned`} ownTag=" (your plan)" cost={costWords(to.order.length)} place="whatif" foot={NEAREST} />
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
      moreJob('whatif', 1);
      try { const f = await job.current.done; scenarioFigs.set(k, { h: f.headline }); } finally { moreJob('whatif', -1); }
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

/*
 * Phase 10, item 7: under the switch the backtest runs the solved plan, and says what it is: the check outside the model the
 * plan was solved in, with your plan's verdict on the same history beside it. Its own chunk, with the solver's other cards,
 * not the page's entry.
 */
export function SolverHistory({ verdict, start, yours, floor, fmt }) {
  return (
    <div className="p-4 bg-surface border border-indigo-200/80 rounded-xl text-xs text-slate-700 space-y-1" data-history-solved={verdict.survived ? 'survived' : 'failed'} data-history-start={start} data-history-terminal={verdict.terminalPot} data-history-yours={yours && yours.survived ? 'survived' : 'failed'}>
      <div className="font-bold text-indigo-900 text-sm">The out-of-model check: the solved plan through real history</div>
      <p>The solver worked your plan out on the model&apos;s markets. This runs the solved plan through what markets actually did from {start} instead, outside that model: a check on the plan, not a forecast.</p>
      {yours && <p>Your current approach, on the same history: {yours.survived ? <strong>the money lasts</strong> : <strong>{yours.failReason === 'floor' ? `ends below the ${fmt(floor)} floor` : `runs short at age ${yours.failAge}`}</strong>}, ending with {fmt(yours.terminalPot)}.</p>}
    </div>
  );
}
