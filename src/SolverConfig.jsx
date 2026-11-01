/*
 * THE CONFIG TAB'S SOLVER CARDS (Part C Phase 8, research/solver/PHASE-8.md). Shown only with the switch on, for a single
 * household (App.jsx `solverRules`), and loaded lazily, so the app with the switch off fetches none of it.
 *
 *   SolverAims    what the solver aims for: the dislike of cuts (the dial, D46), the estate's priority, raises, consent to
 *                 change risk and the minimum pot; under them, the solve's state, carrying its key (data-solve-key);
 *   SolverLocks   what the solver may change: the locks of Phase 7c.
 *
 * Each lever writes `plan.solver` (App.jsx normalizeSolverAims, normalizeSolverLocks), which the solve's key carries, so a
 * change re-solves (src/useSolver.js). Every position offered has been measured (PHASE-8.md); the defaults are the candidate's.
 */
import React from 'react';
import { Fine } from './phone.jsx';
import { fieldCls } from './ui.js';
import { MoneyInput } from './numberFormat.jsx';
import { APP_DIAL } from './solverSettings.js';

const AIMS_DEFAULT = Object.freeze({ cuts: 1, estate: 'standard', raises: 'capped', riskConsent: true });
const LOCKS_FREE = Object.freeze({ pensionBefore: null, tierCeiling: Object.freeze({ pen: null, isa: null }), lumpSum: 'free' });
const DIAL_LABELS = { 1: 'Low', 3: 'Medium', 6: 'High', 10: 'Very high' };
const RISK = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];

/* the plan's own riskiest tier in a wrapper (ids pen_ and isa_, as src/solverSettings.js lockedPlan reads them), or null */
const ownTier = (plan, prefix) => {
  const tiers = (plan.accounts || []).filter(a => a.id && a.id.startsWith(prefix) && RISK.includes(a.risk)).map(a => RISK.indexOf(a.risk));
  return tiers.length ? RISK[Math.min(...tiers)] : null;
};
/* plan.solver[part] merged with a patch, the part's defaults beneath what the plan already has */
const patchSolver = (setPlan, part, patch) => setPlan(prev => {
  const s = prev.solver || {}, base = part === 'aims' ? AIMS_DEFAULT : LOCKS_FREE;
  return { ...prev, solver: { ...s, [part]: { ...base, ...(s[part] || {}), ...patch } } };
});

function Choice({ name, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={name} data-solver-choice={name} className="flex flex-wrap gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 w-fit text-[11px] font-bold">
      {options.map(([v, label]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={value === v} data-value={String(v)} onClick={() => onChange(v)}
          className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${value === v ? 'bg-surface text-blue-700 border border-blue-300' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
      ))}
    </div>
  );
}

function Row({ title, children, help, isPhone }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-slate-800">{title}</div>
      {children}
      {help && <Fine isPhone={isPhone} label="What it changes"><p className="text-[11px] text-slate-500 leading-relaxed">{help}</p></Fine>}
    </div>
  );
}

/* the solve's state, in a line: what the solver is doing with the plan on screen */
function SolveLine({ solve }) {
  const { solveState, solveMeta, progress, key } = solve || {};
  const pct = progress && progress.total ? Math.round((100 * progress.done) / progress.total) : null;
  const text = solveMeta && solveMeta.error ? `The solver could not solve this plan: ${solveMeta.error}`
    : solveState === 'solving' ? `Solving your plan${progress ? `: ${progress.phase === 'years' ? 'year by year' : 'the years before your pension opens'}, ${pct}%` : '…'}`
    : solveState === 'stale' ? 'Your plan changed; solving it again…'
    : solveState === 'solved' ? `Solved${solveMeta && solveMeta.restored ? ', from the last time it was solved' : solveMeta && solveMeta.secs ? ` in ${Math.round(solveMeta.secs)} seconds` : ''}.`
    : 'Waiting to solve your plan.';
  return (
    <div data-solve-state={solveState || 'idle'} data-solve-key={key || ''} className="text-[11px] text-slate-600 pt-2 border-t border-slate-100">
      <span className="font-semibold text-slate-800">The solver: </span>{text}
      {solveState === 'solving' && pct !== null && (
        <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} /></div>
      )}
    </div>
  );
}

export function SolverAims({ plan, setPlan, solve, isPhone, fmt, updateConfig, terminalAge }) {
  const a = { ...AIMS_DEFAULT, ...((plan.solver && plan.solver.aims) || {}) };
  const set = patch => patchSolver(setPlan, 'aims', patch);
  const target = Number(plan.spending && plan.spending.targetSpend) || 0;
  return (
    <section data-solver-aims className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">What the solver aims for</h2>
        <p className="text-xs text-slate-500 mt-1">Not running out comes first. These choices tell the solver what you want from the rest, and each one solves your plan again.</p>
      </div>
      <Row title="How much do you dislike cuts?" isPhone={isPhone}
        help="Low: protect against running out, even if spending dips for a while. High: keep spending steadier, accepting a higher chance of running out. Low is the default.">
        <Choice name="cuts" value={a.cuts} onChange={v => set({ cuts: v })} options={APP_DIAL.map(x => [x, DIAL_LABELS[x] || `${x}x`])} />
      </Row>
      <Row title="How much the estate matters" isPhone={isPhone}
        help="The solver weighs what you leave against what you spend. Lower gives the estate half the weight, so the plan spends a little more and leaves a little less.">
        <Choice name="estate" value={a.estate} onChange={v => set({ estate: v })} options={[['standard', 'Standard'], ['lower', 'Lower']]} />
      </Row>
      <Row title="When markets do well" isPhone={isPhone}
        help="Raises let the plan spend more after good years. Blocked, it never spends above your target, and what good years leave goes to later years and the estate.">
        <Choice name="raises" value={a.raises} onChange={v => set({ raises: v })} options={[['capped', 'Up to 10% above target'], ['blocked', 'Never above target']]} />
      </Row>
      <Row title="Investment risk" isPhone={isPhone}
        help="On, the solver may move your pension and ISA to a safer or riskier tier as the years go by. Off, each keeps the tier you chose in Plan Inputs.">
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer w-fit">
          <input type="checkbox" data-solver-consent checked={a.riskConsent} onChange={e => set({ riskConsent: e.target.checked })} className="accent-blue-600" />
          The solver may change how your pension and ISA are invested
        </label>
      </Row>
      <Row title={`Minimum pot at ${terminalAge}`} isPhone={isPhone}
        help={`The least the plan aims to end with. Left at 0, the solver keeps one year of your target spending (${fmt(target)}). The same figure as the minimum pot in Plan Inputs.`}>
        <MoneyInput data-solver-minpot min="0" step="5000" placeholder="0" value={plan.config && plan.config.solvencyFloor !== undefined ? plan.config.solvencyFloor : ''}
          onChange={e => updateConfig('solvencyFloor', e.target.value)} className={`${fieldCls} max-w-[12rem]`} />
      </Row>
      <SolveLine solve={solve} />
    </section>
  );
}

export function SolverLocks({ plan, setPlan, isPhone }) {
  const L = { ...LOCKS_FREE, ...((plan.solver && plan.solver.locks) || {}) }, tc = { ...LOCKS_FREE.tierCeiling, ...(L.tierCeiling || {}) };
  const set = patch => patchSolver(setPlan, 'locks', patch);
  const d = plan.demographics || {}, strategy = (plan.spending && plan.spending.drawdownStrategy) || 'Phased Drawdown';
  const wrappers = [['pen', 'pen_', 'pension'], ['isa', 'isa_', 'ISA']].filter(([, prefix]) => ownTier(plan, prefix));
  return (
    <section data-solver-locks className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">What the solver may change</h2>
        <p className="text-xs text-slate-500 mt-1">Left free, the solver decides. A limit here holds in every year of the solved plan.</p>
      </div>
      <Row title="Do not draw the pension before age" isPhone={isPhone}
        help={`Blank leaves it to the solver, from your pension access age${d.privatePensionAge ? ` (${d.privatePensionAge})` : ''}. An age before that changes nothing.`}>
        <input type="number" min="0" max="120" data-solver-lock="pensionBefore" placeholder="free" value={L.pensionBefore ?? ''}
          onChange={e => set({ pensionBefore: e.target.value === '' ? null : Number(e.target.value) })} className={`${fieldCls} max-w-[8rem]`} />
      </Row>
      {wrappers.map(([w, prefix, name]) => (
        <Row key={w} title={`The riskiest tier your ${name} may hold`} isPhone={isPhone}>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select aria-label={`Riskiest tier for the ${name}`} data-solver-lock={`tier-${w}`} value={tc[w] || ''} onChange={e => set({ tierCeiling: { ...tc, [w]: e.target.value || null } })} className={`${fieldCls} max-w-[14rem]`}>
              <option value="">No limit</option>
              {RISK.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="text-slate-500">Your plan: {ownTier(plan, prefix)}</span>
          </div>
        </Row>
      ))}
      <Row title="The tax-free lump sum" isPhone={isPhone}
        help="Free keeps the choice your plan carries; the solver does not choose the lump sum yet. Never draws the tax-free part with each withdrawal; now takes the full tax-free lump when the pension opens.">
        <select aria-label="The tax-free lump sum" data-solver-lock="lumpSum" value={L.lumpSum} onChange={e => set({ lumpSum: e.target.value })} className={`${fieldCls} max-w-[22rem]`}>
          <option value="free">Free: as your plan has it ({strategy === 'Full 25% Lump Sum' ? 'the full lump sum' : 'phased drawdown'})</option>
          <option value="never">Never as a lump sum</option>
          <option value="now">The full lump sum when the pension opens</option>
        </select>
      </Row>
    </section>
  );
}

