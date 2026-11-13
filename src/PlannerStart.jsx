/*
 * THE QUICK START, THE NEW PLANNER'S FIRST VISIT (step U; research/reviews/2026-11-03/LAYOUT.md section 5). The Simple page
 * folded in: shown on Your plan in place of the answer card while the plan is empty, its own lazy chunk (its words are not
 * solverWords.js's, which loads with the solved ledger).
 *
 * Its fields are the Simple page's, as src/simplePlan.js names them, filled from the Simple page's saved inputs where those
 * have any (rp_simple_v1; that key is left as it is). "Work out my plan" waits for readiness: your age, when you stop working,
 * what you want to spend and what you have saved; then it builds the plan with toFullPlan and hands it over, which solves it.
 * Each pot asks its balance today, its annual contribution and the contribution's yearly increase (the maintainer's ruling of
 * 8 Nov, D62; before it the quick start pointed to You, Your money for the two), the Simple page's penC and penG and their
 * kin, which toFullPlan already carries into each account's contrib and growth: left blank, a pot is paid nothing, so a plan
 * with none of them entered is the plan the quick start built before.
 */
import React, { useState } from 'react';
import '@fontsource/newsreader/latin-500.css';
import { SIMPLE_BLANK, toFullPlan, readiness, simpleHasInput } from './simplePlan.js';
import { PLANNER_PLANT } from './plannerPlant.js';
import { COUPLES } from './couplesSwitch.js';

const SIMPLE_KEY = 'rp_simple_v1';
const saved = () => { try { const s = JSON.parse(localStorage.getItem(SIMPLE_KEY) || 'null'); return simpleHasInput(s) ? { ...SIMPLE_BLANK, ...s } : null; } catch (e) { return null; } };

const FIELDS = [
  ['ageSelf', 'Your age', 'number', ''],
  ['retireSelf', 'When you stop working (age)', 'number', ''],
  ['spend', 'What you want to spend a year, in today\'s money', 'money', '']
];
// each pot: its balance key, as simplePlan.js names it; its annual contribution is key + 'C', the contribution's yearly increase key + 'G'
const POTS = [['pen', 'Pensions'], ['isa', 'ISAs'], ['gia', 'Other savings and investments'], ['cash', 'Cash']];
// the planted fault (solver-planner-ui.cjs check 13): the plan built without the contributions the quick start was given
const noContribs = s => ({ ...s, ...Object.fromEntries(POTS.flatMap(([k]) => [[k + 'C', ''], [k + 'G', '']])) });

export function QuickStart({ onStart, onFillAll, onClassic, isPhone, regions, statePensionFull, fmt }) {
  const [s, setS] = useState(() => ({ ...(saved() || SIMPLE_BLANK), couple: false }));
  const set = (k, v) => setS(p => ({ ...p, [k]: v }));
  const r = readiness(s);
  const field = `w-full p-2 bg-surface border border-slate-300 rounded-lg text-sm text-slate-800 ${isPhone ? 'min-h-11' : 'min-h-9'}`;
  return (
    <section data-quick-start data-quick-ready={r.ready ? 'yes' : 'no'} className="p-5 bg-surface border border-indigo-200 rounded-xl space-y-4 max-w-3xl">
      <div>
        <h2 className="font-display text-[28px] font-medium text-slate-900 leading-tight">Let&apos;s work out your plan</h2>
        <p className="text-sm text-slate-600 mt-1">Tell us the basics and the solver works out how to run your money: how much to spend each year, which pot to draw from, and how to invest. You can add the details later in You.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map(([k, label, kind]) => (
          <label key={k} className="text-xs font-semibold text-slate-700 space-y-1 block">
            <span>{label}</span>
            <input data-quick-field={k} type="number" min="0" step={kind === 'money' ? 1000 : 1} inputMode="numeric" value={s[k]} onChange={e => set(k, e.target.value)} className={field} />
          </label>
        ))}
        <label className="text-xs font-semibold text-slate-700 space-y-1 block">
          <span>Where you pay tax</span>
          <select data-quick-field="region" value={s.region} onChange={e => set('region', e.target.value)} className={field}>
            {Object.entries(regions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700 space-y-1 block">
          <span>Your State Pension a year</span>
          <input data-quick-field="statePensionSelf" type="number" min="0" step="100" inputMode="numeric" placeholder={fmt ? fmt(statePensionFull) : String(statePensionFull)} value={s.statePensionSelf} onChange={e => set('statePensionSelf', e.target.value)} className={field} />
        </label>
      </div>
      <fieldset data-quick-pots className="space-y-3">
        <legend className="text-xs font-semibold text-slate-800">What you have saved, and what you pay in</legend>
        <p data-quick-contrib className="text-xs text-slate-600">For each pot, what is in it today, what you pay in each year until you stop working, and how much that rises each year. Leave a box blank for nothing.</p>
        {POTS.map(([k, label]) => (
          <div key={k} data-quick-pot={k} className="grid grid-cols-3 gap-2 items-end">
            <span className="col-span-3 text-xs font-semibold text-slate-800">{label}</span>
            {[[k, 'Balance today (\u00a3)', 1000], [k + 'C', 'Annual contribution (\u00a3)', 500], [k + 'G', 'Contribution increase (%)', 0.5]].map(([f, l, step]) => (
              <label key={f} className="text-xs text-slate-600 space-y-1 block min-w-0">
                <span className="block leading-tight">{l}</span>
                <input data-quick-field={f} type="number" min="0" step={step} inputMode={f === k + 'G' ? 'decimal' : 'numeric'} aria-label={`${label}: ${l}`} value={s[f]} onChange={e => set(f, e.target.value)} className={`${field} min-w-0`} />
              </label>
            ))}
          </div>
        ))}
      </fieldset>
      <div className="space-y-1">
        <button type="button" data-quick-go disabled={!r.ready} onClick={() => onStart(toFullPlan(PLANNER_PLANT.has('noquickcontrib') ? noContribs(s) : s))}
          className={`px-4 rounded-lg bg-accent hover:bg-accent-hover text-onaccent text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isPhone ? 'w-full min-h-11' : 'min-h-9'}`}>Work out my plan</button>
        <p className="text-xs text-slate-500">{r.ready ? 'It takes a few minutes. The other places fill in as it works.' : `Still needed: ${r.missing.join(', ')}.`}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <button type="button" data-quick-all onClick={onFillAll} className={`font-semibold text-indigo-700 hover:underline cursor-pointer ${isPhone ? 'min-h-11' : ''}`}>Or fill in everything now</button>
      </div>
      {/* Part D, D5: with couples on (src/couplesSwitch.js, D6 the maintainer's word) a couple fills in You for both of them */}
      {COUPLES ? (
      <div className="text-xs text-slate-600 border-t border-slate-100 pt-3" data-quick-couple="on">
        <span className="font-semibold text-slate-800">Planning for two?</span> Fill in everything now, choosing a plan for two people under You: the plan is worked out for the two of you together.{' '}
        <button type="button" onClick={onFillAll} className={`font-semibold text-indigo-700 hover:underline cursor-pointer ${isPhone ? 'min-h-11' : ''}`}>Fill in a plan for two</button>
      </div>
      ) : (
      <div className="text-xs text-slate-600 border-t border-slate-100 pt-3" data-quick-couple>
        <span className="font-semibold text-slate-800">Planning for two?</span> The new planner works out plans for one person for now. A couple&apos;s plan uses the classic planner.{' '}
        <button type="button" onClick={onClassic} className={`font-semibold text-indigo-700 hover:underline cursor-pointer ${isPhone ? 'min-h-11' : ''}`}>Open the classic planner</button>
      </div>
      )}
    </section>
  );
}
