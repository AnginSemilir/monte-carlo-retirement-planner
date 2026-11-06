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
import { APP_DIAL, APP_FLOOR, AIMS_DEFAULT, dialOrder, dialSig, atDial } from './solverSettings.js';
import { FiguresList } from './SolverFigures.jsx';
import { costWords } from './solveStatus.js';
// the page's own pieces (phone.jsx's Fine and PhoneCollapse, numberFormat.jsx's MoneyInput, ui.js's fieldCls) come in as the
// `ui` prop from App.jsx: imported here, they split phone.jsx out of the page's first chunk into one of its own, a request
// more on every load (load-perf, with the switch on)

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

/* the floor the solver plans with (src/solverSettings.js prepareForSolve: the plan's own, else APP_FLOOR of the target; B2) */
function floorLine(plan) {
  const sp = plan.spending || {}, target = Number(sp.targetSpend) || 0, own = Number(sp.floorSpend) || 0;
  const pct = own > 0 && target > 0 ? Math.round((100 * Math.min(own, target)) / target) : Math.round(100 * APP_FLOOR);
  return `In a bad year the plan may spend as little as ${pct}% of your target${own > 0 ? ' (the floor in your plan)' : ''}; it never plans below that.`;
}

// each choice a segmented control the panel's full width, 36px tall, 44px on a phone (step U, LAYOUT.md section 3.1)
// in the phone's levers sheet the panel is shown whole, not folded
const Plain = ({ children }) => children;
function Choice({ name, options, value, onChange, isPhone }) {
  return (
    <div role="radiogroup" aria-label={name} data-solver-choice={name} className="grid grid-flow-col auto-cols-fr gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 w-full text-[11px] font-bold">
      {options.map(([v, label]) => (
        <button key={String(v)} type="button" role="radio" aria-checked={value === v} data-value={String(v)} onClick={() => onChange(v)}
          className={`px-2 rounded-md cursor-pointer transition-colors ${isPhone ? 'min-h-11' : 'min-h-9'} ${value === v ? 'bg-surface text-blue-700 border border-blue-300' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
      ))}
    </div>
  );
}

function Row({ title, children, help, isPhone, Fine }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-slate-800">{title}</div>
      {children}
      {help && <Fine isPhone={isPhone} label="What it changes"><p className="text-[11px] text-slate-500 leading-relaxed">{help}</p></Fine>}
    </div>
  );
}

/* the solve's state, in a line: what the solver is doing with the plan on screen; on a phone, until asked, a button that asks
   (the launch plan's B10: the phone solves on request) */
function SolveLine({ solve, onRequest }) {
  const { solveState, solveMeta, progress, key, storeNote } = solve || {};
  const pct = progress && progress.total ? Math.round((100 * progress.done) / progress.total) : null;
  // a dial position above Low solves the plan at Low first (its base, step L2), then at the position, on the base's investments
  const stage = progress && progress.stage === 'base' ? ' at the Low setting first' : progress && progress.stage === 'position' ? ' at your setting' : '';
  const text = solveMeta && solveMeta.error ? `The solver could not solve this plan: ${solveMeta.error}`
    : solveState === 'solving' ? `Solving your plan${stage}${progress ? `: ${progress.phase === 'years' ? 'year by year' : 'the years before your pension opens'}, ${pct}%` : '…'}`
    : solveState === 'stale' ? 'Your plan changed; solving it again…'
    : solveState === 'solved' ? `Solved${solveMeta && solveMeta.restored ? ', from the last time it was solved' : solveMeta && solveMeta.secs ? ` in ${Math.round(solveMeta.secs)} seconds` : ''}.${storeNote ? ` It is not kept on this device (${storeNote}), so it solves again next visit.` : ''}`
    : onRequest ? 'On a phone the solver runs when you ask, and it can take several minutes.'
    : 'Waiting to solve your plan.';
  return (
    <div data-solve-state={solveState || 'idle'} data-solve-key={key || ''} className="text-[11px] text-slate-600 pt-2 border-t border-slate-100">
      <span className="font-semibold text-slate-800">The solver: </span>{text}
      {onRequest && (
        <button type="button" data-solve-request onClick={onRequest} className="mt-2 min-h-11 px-4 rounded-lg bg-accent hover:bg-accent-hover text-onaccent text-xs font-bold cursor-pointer block">Solve my plan</button>
      )}
      {solveState === 'solving' && pct !== null && (
        <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} /></div>
      )}
    </div>
  );
}

/*
 * THE DIAL'S LIVE LINE (Part C Phase 10, item 3; PART-C-WORDING.md section 3): under the dial, the headline's figures at the
 * plan's own setting, from the solve in hand; on request ("Show the four settings") the other settings worked out in the
 * background, nearest first along the dial (src/SolverFigures.jsx FiguresList; a setting's base comes from the store, so a
 * setting costs one solve). The figures belong to the plan at the Low setting, so choosing another setting keeps them.
 */
// step U (finding L10): the answer card beside the panel already shows the plan's own setting on 5,000 paths, so the panel does
// not repeat it; on request a table of the four, every row on the same first 2,000 paths, the plan's own marked
function DialLive({ plan, solve, cuts, seed, upto, engine, opts, fmt }) {
  const others = APP_DIAL.filter(x => x !== cuts).length;
  return (
    <FiguresList plan={plan} solve={solve} own={cuts} options={APP_DIAL.map(x => ({ id: x, label: DIAL_LABELS[x], plan: atDial(plan, x) }))} order={dialOrder(cuts)}
      sig={dialSig(plan)} seed={seed} upto={upto} engine={engine} opts={opts} fmt={fmt} name="dial" showLabel="Compare the four settings" keyedId={1}
      table ownLine={false} place="plan" cost={costWords(others, { locked: true, more: true })}
      foot={`Each on the same ${upto.toLocaleString('en-GB')} simulated markets, so they compare fairly. The answer uses 5,000.`} />
  );
}

export function SolverAims({ plan, setPlan, solve, isPhone, fmt, updateConfig, terminalAge, onSolveRequest = null, ui, seed = 12345, upto = 2000, engine = null, opts = null, solveLine = true, collapse = true }) {
  const { MoneyInput, fieldCls } = ui;
  const PhoneCollapse = collapse ? ui.PhoneCollapse : Plain;
  const a = { ...AIMS_DEFAULT, ...((plan.solver && plan.solver.aims) || {}) };
  const set = patch => patchSolver(setPlan, 'aims', patch);
  const target = Number(plan.spending && plan.spending.targetSpend) || 0;
  return (
    <section data-solver-aims className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-4">
      <PhoneCollapse isPhone={isPhone}>
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900">What matters to you</h2>
        <p className="text-xs text-slate-500 mt-1">{isPhone ? 'Not running out comes first. These choices tell the solver what you want from the rest. A change is worked out when you tap Solve again.'
          : 'Not running out comes first. These choices tell the solver what you want from the rest, and each one solves your plan again.'}</p>
      </div>
      <Row Fine={ui.Fine} title="How much do you dislike cuts?" isPhone={isPhone}
        help="Low: protect against running out, even if spending dips for a while. High: keep spending steadier, accepting a higher chance of running out. Low is the default.">
        <Choice isPhone={isPhone} name="cuts" value={a.cuts} onChange={v => set({ cuts: v })} options={APP_DIAL.map(x => [x, DIAL_LABELS[x] || `${x}x`])} />
        {engine && <DialLive plan={plan} solve={solve} cuts={APP_DIAL.includes(a.cuts) ? a.cuts : 1} seed={seed} upto={upto} engine={engine} opts={opts} fmt={fmt} />}
      </Row>
      <Row Fine={ui.Fine} title="How much the estate matters" isPhone={isPhone}
        help="The solver weighs what you leave against what you spend. Lower gives the estate half the weight, so the plan spends a little more and leaves a little less.">
        <Choice isPhone={isPhone} name="estate" value={a.estate} onChange={v => set({ estate: v })} options={[['standard', 'Standard'], ['lower', 'Lower']]} />
      </Row>
      <Row Fine={ui.Fine} title="When markets do well" isPhone={isPhone}
        help="Raises let the plan spend more after good years. Blocked, it never spends above your target, and what good years leave goes to later years and the estate.">
        <Choice isPhone={isPhone} name="raises" value={a.raises} onChange={v => set({ raises: v })} options={[['capped', 'Up to 10% above target'], ['blocked', 'Never above target']]} />
      </Row>
      <Row Fine={ui.Fine} title="Investment risk" isPhone={isPhone}
        help="On, the solver may move your pension and ISA to a safer or riskier tier as the years go by. Off, each keeps the tier you chose in You.">
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer w-fit">
          <input type="checkbox" data-solver-consent checked={a.riskConsent} onChange={e => set({ riskConsent: e.target.checked })} className="accent-blue-600" />
          The solver may change how your pension and ISA are invested
        </label>
      </Row>
      <Row Fine={ui.Fine} title={`Minimum pot at ${terminalAge}`} isPhone={isPhone}
        help={`The least the plan aims to end with. Left at 0, the solver keeps one year of your target spending (${fmt(target)}). The same figure as the minimum pot in You.`}>
        <MoneyInput data-solver-minpot min="0" step="5000" placeholder="0" value={plan.config && plan.config.solvencyFloor !== undefined ? plan.config.solvencyFloor : ''}
          onChange={e => updateConfig('solvencyFloor', e.target.value)} className={`${fieldCls} max-w-[12rem]`} />
      </Row>
      <Row Fine={ui.Fine} title="The lowest spending in a bad year" isPhone={isPhone}>
        <p data-solver-floor className="text-xs text-slate-700">{floorLine(plan)}</p>
      </Row>
      </PhoneCollapse>
      {solveLine && <SolveLine solve={solve} onRequest={onSolveRequest} />}
    </section>
  );
}

export function SolverLocks({ plan, setPlan, isPhone, ui }) {
  const { PhoneCollapse, fieldCls } = ui;
  const L = { ...LOCKS_FREE, ...((plan.solver && plan.solver.locks) || {}) }, tc = { ...LOCKS_FREE.tierCeiling, ...(L.tierCeiling || {}) };
  const set = patch => patchSolver(setPlan, 'locks', patch);
  const d = plan.demographics || {}, strategy = (plan.spending && plan.spending.drawdownStrategy) || 'Phased Drawdown';
  const wrappers = [['pen', 'pen_', 'pension'], ['isa', 'isa_', 'ISA']].filter(([, prefix]) => ownTier(plan, prefix));
  return (
    <section data-solver-locks className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-4">
      <PhoneCollapse isPhone={isPhone}>
      <div>
        <h2 className="text-base font-semibold text-slate-900">What the solver may change</h2>
        <p className="text-xs text-slate-500 mt-1">Left free, the solver decides. A limit here holds in every year of the solved plan.</p>
      </div>
      <Row Fine={ui.Fine} title="Do not draw the pension before age" isPhone={isPhone}
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
      <Row Fine={ui.Fine} title="The tax-free lump sum" isPhone={isPhone}
        help="Free keeps the choice your plan carries; the solver does not choose the lump sum yet. Never draws the tax-free part with each withdrawal; now takes the full tax-free lump when the pension opens.">
        <select aria-label="The tax-free lump sum" data-solver-lock="lumpSum" value={L.lumpSum} onChange={e => set({ lumpSum: e.target.value })} className={`${fieldCls} max-w-[22rem]`}>
          <option value="free">Free: as your plan has it ({strategy === 'Full 25% Lump Sum' ? 'the full lump sum' : 'phased drawdown'})</option>
          <option value="never">Never as a lump sum</option>
          <option value="now">The full lump sum when the pension opens</option>
        </select>
      </Row>
      </PhoneCollapse>
    </section>
  );
}

