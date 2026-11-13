/*
 * THE NEW PLANNER'S CARDS (step U, research/reviews/2026-11-03/LAYOUT.md sections 3.3, 3.4 and 6), in a chunk of their own: the
 * couples card, What if, the scenarios, Details with the solver's settings and how the solver decides, and You's heading and
 * section list. Only the new planner shows them, so
 * the page's first load carries none of them (LAYOUT.md section 11.2: the entry grows by the strip and the places' names only).
 */
import React, { Suspense } from 'react';
import { Bookmark, Download, Upload } from 'lucide-react';
import { PLANNER_PLANT } from './plannerPlant.js';
import { SectionTabs } from './tabs.jsx';
import { SolverAges, SolverTargets, SolverScenarios } from './SolverFigures.jsx';
import { SolverPlanAnswers } from './SolverSimple.jsx';
import { solverApproximations } from './solverApproximations.js';
import { DiagnosticCopy } from './DiagnosticCopy.jsx';

/* a couple's plan (LAYOUT.md section 6): the classic planner, or a plan for one person */
export function Couples({ isPhone, onClassic, onOnePerson }) {
  if (PLANNER_PLANT.has('nocouple')) return null;
  return (
  <section data-planner-couple className="p-5 bg-surface border border-slate-200/90 rounded-xl space-y-3 max-w-3xl">
    <h2 className="text-[15px] font-semibold text-slate-900">The new planner works out plans for one person for now</h2>
    <p className="text-sm text-slate-600">Your plan is for two people. Until the solver plans for couples, which is being built, a couple&apos;s plan follows the app&apos;s own rules in the classic planner. Your inputs are kept either way.</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" data-open-classic onClick={onClassic} className={`px-4 rounded-lg bg-accent hover:bg-accent-hover text-onaccent text-sm font-bold cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`}>Open the classic planner</button>
      <button type="button" onClick={onOnePerson} className={`px-4 rounded-lg border border-slate-300 bg-surface text-sm font-semibold text-slate-800 cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`}>Change to a plan for one person</button>
    </div>
  </section>
  );
}

/* What if (LAYOUT.md section 3.3): the age card, the target card, the solved plan's limits and the scenarios, each saying its
   cost before it is asked */
export function WhatIf({ solvedInHand, plan, solve, ageNow, last, seed, upto, engine, opts, fmt, scenarios }) {
  return (
    <div className="grid gap-6 min-[1100px]:grid-cols-2 items-start">
      {!solvedInHand && <p data-whatif-wait className="text-sm text-slate-600 min-[1100px]:col-span-2">Each card here works your plan out again at another setting, once your plan itself is worked out.</p>}
      <SolverAges plan={plan} solve={solve} ageNow={ageNow} seed={seed} upto={upto} engine={engine} opts={opts} fmt={fmt} />
      <SolverTargets plan={plan} solve={solve} seed={seed} upto={upto} engine={engine} opts={opts} fmt={fmt} />
      <div data-whatif-limits className="p-4 rounded-xl border border-slate-200/90 bg-surface">
        {solvedInHand ? <SolverPlanAnswers plan={plan} fromSpend={null} ageNow={ageNow} last={last} engine={engine} opts={opts} fmt={fmt} whatIf />
          : <><h3 className="text-[15px] font-semibold text-slate-900">The solved plan&apos;s limits</h3><p className="text-xs text-slate-500 mt-1">The highest target and the earliest retirement the solved plan keeps at the chance you choose, once your plan is worked out.</p></>}
      </div>
      <Scenarios {...scenarios} plan={plan} solve={solve} seed={seed} upto={upto} E={engine} opts={opts} fmt={fmt} />
    </div>
  );
}

/* What if's scenarios: the current plan first, each saved one with what differs, its solved line, Load and Delete */
function Scenarios({ scenarios, activeScenarioId, plan, solve, seed: mcSeed, upto, E, opts: SOLVER_OPTS, fmt: formatGBP, isPhone, onLoad: handleSelectScenario, onDelete: handleDeleteScenario }) {
const scenarioDiff = d => {
  const out = [], a = E.normalizePlan(d), t = E.num(a.spending.targetSpend, 0), r = E.num(a.demographics.retireAgeSelf, 0);
  if (t !== E.num(plan.spending.targetSpend, 0)) out.push(`spends ${formatGBP(t)} a year`);
  if (r !== E.num(plan.demographics.retireAgeSelf, 0)) out.push(`retires at ${r}`);
  const tot = x => (x.accounts || []).reduce((s2, ac) => s2 + E.num(ac.balance, 0), 0);
  if (Math.round(tot(a)) !== Math.round(tot(plan))) out.push(`holds ${formatGBP(tot(a))}`);
  return out.length ? out.join(', ') : 'the same as your plan on these figures';
};
  return (
  <section data-whatif-scenarios className="p-4 rounded-xl border border-slate-200/90 bg-surface space-y-2">
    <h3 className="text-[15px] font-semibold text-slate-900">Your scenarios</h3>
    <p className="text-xs text-slate-500">A change to try is a scenario: save one in You, then edit it. Each is solved only when you ask: one solve a scenario.</p>
    <ul className="space-y-1.5 text-xs">
      {scenarios.filter(sc => sc.id !== activeScenarioId).map(sc => (
        <li key={sc.id} data-scenario-row={sc.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-1.5">
          <span className="font-semibold text-slate-800">{sc.name}</span><span className="text-slate-500">{scenarioDiff(sc.data)}</span>
          <span className="flex-1" />
          <button type="button" onClick={() => handleSelectScenario(sc.id)} className={`px-2 rounded border border-slate-200 bg-slate-50 font-semibold text-slate-700 cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-7'}`}>Load</button>
          <button type="button" onClick={() => handleDeleteScenario(sc.id)} className={`px-2 rounded border border-slate-200 bg-slate-50 font-semibold text-rose-700 cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-7'}`}>Delete</button>
        </li>
      ))}
    </ul>
    <Suspense fallback={null}>
      <SolverScenarios rows={[{ id: '__current__', name: 'Current plan', isBase: true, plan }, ...scenarios.filter(sc => sc.id !== activeScenarioId).map(sc => ({ id: sc.id, name: sc.name, plan: sc.data }))]}
        plan={plan} solve={solve} seed={mcSeed} upto={upto} engine={E} opts={SOLVER_OPTS} fmt={formatGBP} />
    </Suspense>
  </section>
  );
}

/* Details' Assumptions: the solver's settings, read only, and the details for a bug report (Phase 12 item 4) */
export function SolverSettings({ points, paths, solve = null, plan = null, isPhone = false }) {
  return (
  <section data-solver-settings className="p-4 bg-surface border border-slate-200/90 rounded-xl text-xs text-slate-600 space-y-1">
    <h3 className="text-[15px] font-semibold text-slate-900">The solver&apos;s settings</h3>
    <p>{points} wealth points. The floor at 80% of your target where you set none. The dislike of cuts at 1, 3, 6 or 10 times its lowest setting. The headline on {paths.toLocaleString('en-GB')} simulated markets. The candidate 17ff82379838.</p>
    {solve && <div className="pt-2"><DiagnosticCopy solve={solve} plan={plan} points={points} paths={paths} isPhone={isPhone} /></div>}
  </section>
  );
}

/* Details: how the solver decides, the glossary's words, the coverage card with the solver's approximations (Phase 12 item 1),
   and the full documentation on request (children) */
export function DocsSolver({ isPhone, open, onOpen, points = 45, paths = 5000, comparePaths = 2000, children }) {
  return (
  <section data-docs-solver className="p-4 bg-surface border border-slate-200/90 rounded-xl text-sm text-slate-700 space-y-3">
    <h3 className="text-[15px] font-semibold text-slate-900">How the solver decides</h3>
    <p>Each year the solver chooses how much to spend, which pot to draw from and how to invest, by working backwards from the end of your plan over thousands of simulated markets. Not running out comes first; what matters to you decides the rest.</p>
    <dl className="grid gap-2 text-xs">
      <div><dt className="font-semibold text-slate-900">The solved plan</dt><dd>What the solver works out for your money, year by year.</dd></div>
      <div><dt className="font-semibold text-slate-900">Your current approach</dt><dd>Your plan run by the app&apos;s own rules; the yardstick.</dd></div>
      <div><dt className="font-semibold text-slate-900">Limits</dt><dd>What the solver may not change (the locks).</dd></div>
      <div><dt className="font-semibold text-slate-900">A rule of thumb</dt><dd>The plan&apos;s own choices in three lines, shown where following it costs under half a point.</dd></div>
    </dl>
    <div data-docs-coverage className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-600">
      <h4 className="text-sm font-semibold text-slate-900">What this model will not tell you</h4>
      <p>It is a model of markets, tax and your plan, not a forecast. It covers UK income tax and National Insurance, the pension allowances, ISA limits and capital gains tax on other investments; it does not cover inheritance tax on the wider estate, defined benefit accrual or care costs. Educational and illustrative only. This is not financial advice.</p>
      <p className="font-semibold text-slate-800">The solver&apos;s approximations</p>
      <ul data-solver-approximations className="list-disc pl-5 space-y-1">
        {solverApproximations({ points, paths, comparePaths }).map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
    {!open ? <button type="button" data-docs-open onClick={onOpen} className={`text-xs font-semibold text-indigo-700 hover:underline cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`}>Read the full documentation</button> : children}
  </section>
  );
}

/* Details (LAYOUT.md section 3.4), inside the place's <main> (App.jsx): print and export, then year by year, the history check, Assumptions (with Display and the
   solver's settings) and how the solver decides; on a phone one section at a time. Its contents come from the page, as render
   functions, so each is drawn only where it shows */
export function Details({ isPhone, sections, section, onSection, onPrint, onExport, onImport, fileInput, couple, ledger, history, taxRules, assumptions, theme, numberFormat, settings, docs }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold text-slate-900">Details</h1>
        <div className="flex flex-wrap gap-2">
          {onPrint && <button type="button" data-details-print onClick={onPrint} className={`px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`}>Print this plan</button>}
          <button type="button" onClick={onExport} className={`px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5 ${isPhone ? 'min-h-11' : 'min-h-9'}`}><Download className="w-3.5 h-3.5" /> Export plan (JSON)</button>
          <button type="button" onClick={onImport} className={`px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5 ${isPhone ? 'min-h-11' : 'min-h-9'}`}><Upload className="w-3.5 h-3.5" /> Import plan (JSON)</button>
          {fileInput}
        </div>
      </div>
      {isPhone ? <SectionTabs sections={sections} active={section} onSelect={onSection} top="top-[76px]" /> : (
        <div role="group" aria-label="The sections of Details" data-details-control className="inline-flex flex-wrap gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
          {sections.map(x => <button key={x.id} type="button" onClick={() => { onSection(x.id); const el = document.querySelector(`[data-details="${x.id}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
            aria-pressed={section === x.id} className={`px-3 min-h-9 rounded-md cursor-pointer ${section === x.id ? 'bg-surface text-blue-700 border border-blue-300' : 'text-slate-600 hover:text-slate-900'}`}>{x.short}</button>)}
        </div>
      )}
      {couple && couple()}
      {(!isPhone || section === 'ledger') && <section data-details="ledger" className="scroll-mt-32">{ledger()}</section>}
      {(!isPhone || section === 'history') && <section data-details="history" className="scroll-mt-32 space-y-6">{history()}</section>}
      {(!isPhone || section === 'assumptions') && (
        <section data-details="assumptions" data-assumptions className="scroll-mt-32 space-y-4">
          <div className="bg-surface border border-slate-200/90 p-5 rounded-xl text-xs">{taxRules()}</div>
          {assumptions()}
          <div data-display className="space-y-2">
            <div className="bg-surface border border-slate-200/90 p-5 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-base font-semibold text-slate-900">Display</h2><p className="text-xs text-slate-500 mt-1">The theme, and how numbers are written.</p></div>
              {theme}
            </div>
            {numberFormat()}
          </div>
          {settings()}
        </section>
      )}
      {(!isPhone || section === 'docs') && <section data-details="docs" className="scroll-mt-32">{docs()}</section>}
    </>
  );
}

/* You's section list, beside its sections on a desktop (LAYOUT.md section 3.2) */
export function YouNav({ sections, names }) {
  return (
    <nav aria-label="The sections of You" className="sticky top-32 space-y-0.5">
      {sections.map(x => (
        <button key={x.id} type="button" data-you-nav={x.id} onClick={() => { const el = document.querySelector(`[data-section="${x.id}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          className="block w-full text-left px-3 min-h-9 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer">{names[x.id] || x.short}</button>
      ))}
    </nav>
  );
}

/* You's heading, with "Save as a scenario" */
export function YouHeader({ isPhone, onSave }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold text-slate-900">You</h1>
        <p className="text-sm text-slate-600 mt-1">Who you are, what you have and what you want to spend. Changes here work your plan out again, unless the control says otherwise.</p>
      </div>
      <button type="button" data-save-scenario onClick={onSave} className={`px-3 rounded-lg border border-slate-300 bg-surface text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5 ${isPhone ? 'min-h-11' : 'min-h-9'}`}><Bookmark className="w-3.5 h-3.5" /> Save as a scenario</button>
    </div>
  );
}
