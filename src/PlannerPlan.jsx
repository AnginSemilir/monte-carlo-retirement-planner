/*
 * YOUR PLAN, THE NEW PLANNER'S FIRST PLACE (step U; research/reviews/2026-11-03/LAYOUT.md sections 3.1, 4.2 and 9). Loaded
 * lazily, only in the new planner, for a single household (App.jsx `solverRules`).
 *
 * The answer first, its levers beside it (`aside`, "What matters to you"), then the outlook's two charts, this year, the rule
 * of thumb, the next ten years and the solved plan against your current approach. Every figure is the engine's simulation of
 * the solved plan, asked of the worker that holds the solve (src/solverWorker.js 'strategy', src/solverStrategy.js), on
 * `steps` paths in turn (2,000 then 5,000), the outlook's charts from the same paths, so they cost no second simulation.
 *
 * The answer card's states (data-plan-answer): 'solving' (the first solve, no answer yet), 'filling' (the first step's paths
 * in), 'done', 'stale' (the last answer kept, dimmed, behind a band, until the new plan's first figures arrive; never asked
 * anything while stale), 'failed', 'ask' (a phone that has not asked). On a phone the place is a deck of six slides.
 */
import React, { useEffect, useRef, useState } from 'react';
import '@fontsource/newsreader/latin-500.css';
import { headlineWords, explanationWords, raiseWords, actionWords, aheadRowsWords, ruleWords, COME_BACK } from './solverWords.js';
import { useSwipe } from './swipe.js';
import { PLANNER_PLANT } from './plannerPlant.js';
import { timings } from './solveStatus.js';

export const STEPS = [2000, 5000];
const pct = x => `${Math.round(x)}%`;

// the answer card's footnote and the stale band's words (LAYOUT.md section 8)
const BAND = pctDone => `Before your last change. Working out the new plan${pctDone === null ? '…' : `: ${pctDone}%`}`;

// 1,100px and wider: the levers beside the answer (LAYOUT.md section 3.1); narrower, under its explanation
const WIDE_Q = '(min-width: 1100px)';
function useWide() {
  const read = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(WIDE_Q).matches;
  const [wide, setWide] = useState(read);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const m = window.matchMedia(WIDE_Q), on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

export function PlannerPlan({ plan, solve, seed, fmt, isPhone, steps = STEPS, actionsN = 1000, aside = null, onPhase = null, onRetry = null,
  onOpenClassic = null, onSolveRequest = null, failedFigures = null, rulesLine = '', onPrint = null, levers = '', onOpenLevers = null, floorShare = 0.8, minPot = 0, onFigures = null }) {
  const wide = useWide();
  const [view, setView] = useState({ key: null, strategy: null, error: null });
  const [more, setMore] = useState({ key: null, actions: null, ahead: null, distil: null });
  // the last answer, kept while a changed plan solves (LAYOUT.md section 4.2)
  const kept = useRef(null);
  const solved = solve.solveState === 'solved' && solve.solveMeta && !solve.solveMeta.error && solve.ask;
  useEffect(() => {
    if (!solved) return undefined;
    let live = true;
    (async () => {
      const t0 = performance.now();
      for (const upto of steps) {
        try {
          const ask = PLANNER_PLANT.has('onefewer') ? upto - 1 : upto;
          const { strategy } = solve.strategy ? await solve.strategy(plan, seed, ask) : await solve.ask('strategy', { plan, seed, upto: ask });
          if (!live) return;
          setView({ key: solve.key, strategy, error: null });
          // the first paths' time, for What if's cost lines (src/solveStatus.js costWords)
          if (upto === steps[0]) timings.paths = (performance.now() - t0) / 1000;
          // after the first step's paths: the next years on the typical run, picked over those paths (finding L12), so a later
          // visit with more paths held follows the same one; then this year's actions and their skips
          if (upto === steps[0]) {
            const { ahead } = await solve.ask('ahead', { plan, seed, years: 10, upto: steps[0] });
            if (!live) return;
            setMore(m => ({ ...m, key: solve.key, ahead }));
          }
        } catch (e) { if (live && e.message !== 'closed') setView({ key: solve.key, strategy: null, error: e.message }); return; }
      }
      try {
        const { actions } = solve.actions ? await solve.actions(plan, seed, actionsN) : await solve.ask('actions', { plan, seed, n: actionsN });
        if (live) setMore(m => ({ ...m, key: solve.key, actions }));
        const { distil } = await solve.ask('distil', { plan, seed, n: actionsN });
        if (live) setMore(m => ({ ...m, key: solve.key, distil }));
      } catch (e) { /* the actions and the rule are extra; the headline stands without them */ }
    })();
    return () => { live = false; };
  }, [solved, solve.key, plan, seed]);   // eslint-disable-line react-hooks/exhaustive-deps

  const failed = (solve.solveMeta && solve.solveMeta.error) || view.error;
  const current = view.key === solve.key && solve.solveState === 'solved' ? view.strategy : null;
  if (current) kept.current = { key: view.key, strategy: view.strategy, more: more.key === view.key ? more : null };
  // stale: any state but solved-and-shown once an answer has been shown (useSolver keeps the old key while it marks the plan
  // stale, and moves to the new key when that solve starts)
  const stale = !current && !failed && kept.current && (kept.current.key !== solve.key || solve.solveState !== 'solved' || view.key !== solve.key) ? kept.current : null;
  const s = current || (stale ? stale.strategy : null);
  const mine = current ? (more.key === solve.key ? more : {}) : stale ? stale.more || {} : {};
  const askPhone = isPhone && onSolveRequest;
  const state = failed ? 'failed' : current ? (s.trials >= steps[steps.length - 1] ? 'done' : 'filling') : stale ? 'stale' : askPhone && solve.solveState === 'idle' ? 'ask' : 'solving';
  const simulating = solve.solveState === 'solved' && !failed && (!current || s.trials < steps[steps.length - 1]);
  useEffect(() => { if (onPhase) onPhase({ simulating, trials: steps[steps.length - 1] }); }, [simulating]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (onFigures) onFigures(current ? { strategy: current, more: mine } : null); }, [current, mine.actions, mine.ahead, mine.distil]);   // eslint-disable-line react-hooks/exhaustive-deps

  const pctDone = solve.progress && solve.progress.total ? Math.round((100 * solve.progress.done) / solve.progress.total) : null;
  const ctx = s ? { target: s.headline.target, fmt } : null;
  const card = <AnswerCard s={s} state={state} steps={steps} fmt={fmt} isPhone={isPhone} pctDone={pctDone} failed={failed} onRetry={onRetry}
    onOpenClassic={onOpenClassic} onSolveRequest={onSolveRequest} onPrint={onPrint} hasActions={!!mine.actions} failedFigures={failedFigures} fmt2={fmt} />;
  const expl = s ? explanationWords(s.headline) : null;
  const explanation = expl && state !== 'failed' && (
    <div className={`p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-sm text-slate-700 space-y-2 ${stale ? 'opacity-55' : ''}`} data-strategy-explanation={expl.kind}>
      {expl.title && <div className="font-semibold text-slate-900 text-[15px]">{expl.title}</div>}
      {expl.paras.map((t, i) => <p key={i} className="leading-relaxed">{t}</p>)}
    </div>
  );
  const outlook = s && state !== 'failed' && s.outlook ? outlookParts({ s, ahead: mine.ahead, fmt, floorShare, minPot, dim: !!stale, isPhone }) : null;
  const below = s && state !== 'failed' ? belowParts({ s, mine, ctx, dim: !!stale, isPhone, rulesLine }) : null;

  // step U's plant 'staleask' (solver-planner-ui check 12): the page asks the worker about the plan while it is stale
  useEffect(() => { if (PLANNER_PLANT.has('staleask') && solve.solveState === 'stale' && solve.ask) solve.ask('strategy', { plan, seed, upto: steps[0] }).catch(() => {}); }, [solve.solveState, plan]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (isPhone) return <Deck card={card} explanation={explanation} outlook={outlook} below={below} levers={levers} onOpenLevers={onOpenLevers} state={state} />;
  const side = wide && !PLANNER_PLANT.has('leversunder');   // the plant: the levers under the card on a wide screen too
  return (
    <div data-planner-plan className="grid gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_380px] items-start">
      <div className="min-w-0 space-y-6 min-[1100px]:col-start-1">
        {card}
        {explanation}
        {/* below 1,100px the levers sit under the explanation, not at the page's end; one copy of them on the page either way,
            so the dial's figures are asked for once */}
        {aside && !side && <div data-plan-aside="under">{aside}</div>}
        {outlook && outlook.full}
        {below && below.all}
        <p className="text-[11px] text-slate-400">Educational and illustrative only. This is not financial advice.</p>
      </div>
      {aside && side && (
        <div data-plan-aside="beside" className="min-[1100px]:col-start-2 min-[1100px]:row-start-1 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
          {aside}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- the answer card (LAYOUT.md sections 3.1 and 4.2) */
function AnswerCard({ s, state, steps, fmt, isPhone, pctDone, failed, onRetry, onOpenClassic, onSolveRequest, onPrint, hasActions, failedFigures }) {
  if (state === 'failed') {
    return (
      <div data-plan-answer="failed" data-solver-strategy data-strategy-state="failed" className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-3">
        <p className="font-semibold text-amber-900">The solver could not finish this plan.</p>
        <p className="text-[11px] text-amber-800">{failed}</p>
        <div className="flex flex-wrap gap-2">
          {onRetry && <button type="button" data-strategy-retry onClick={onRetry} className={`px-3 rounded-lg bg-surface border border-amber-300 text-amber-900 text-xs font-semibold cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`}>Try again</button>}
        </div>
        <p className="text-xs text-amber-800">Meanwhile the classic planner shows your plan under the app&apos;s own rules.{' '}
          {onOpenClassic && <button type="button" data-open-classic onClick={onOpenClassic} className={`font-semibold underline cursor-pointer ${isPhone ? 'min-h-11' : ''}`}>Open the classic planner</button>}</p>
        {/* your current approach's figures under it: the projection's first stage, run once when the card shows */}
        <div data-failed-current={failedFigures ? 'in' : 'pending'} className="pt-2 border-t border-amber-200 space-y-2 text-slate-700">
          {!failedFigures ? <p className="text-xs">Running your current approach through 5,000 markets…</p> : (<>
            <p className="text-sm">Your current approach: chance your money lasts <strong className="tabular-nums">{pct(failedFigures.survival)}</strong></p>
            {failedFigures.bands && failedFigures.bands.length > 1 && <WealthChart pts={failedFigures.bands.map(b => ({ ...b, at: (failedFigures.age0 || 0) + b.t }))} yours={failedFigures.bands.map(b => ({ ...b, at: (failedFigures.age0 || 0) + b.t }))} minPot={0} fmt={fmt} isPhone={isPhone} />}
          </>)}
        </div>
      </div>
    );
  }
  if (state === 'ask') {
    return (
      <div data-plan-answer="ask" data-solver-strategy data-strategy-state="idle" className="p-5 bg-surface border border-indigo-200 rounded-xl space-y-3">
        <div className="text-[15px] font-semibold text-slate-900">Your plan is ready to work out</div>
        <p className="text-sm text-slate-600">It can take several minutes on a phone. Keep this page open while it works.</p>
        <div className="text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">What you will see</div>
          <p>Your safe starting spend and the chance your money lasts.</p>
          <p>What to do this year, and over the next ten.</p>
          <p>The solved plan against your current approach.</p>
        </div>
        <button type="button" data-solve-request onClick={onSolveRequest} className="w-full min-h-11 rounded-lg bg-accent hover:bg-accent-hover text-onaccent text-sm font-bold cursor-pointer">Solve my plan</button>
      </div>
    );
  }
  if (!s) {
    return (
      <div data-plan-answer="solving" data-solver-strategy data-strategy-state="solving" className="p-5 bg-surface border border-indigo-200 rounded-xl space-y-2">
        <div className="text-xs font-semibold text-indigo-900">Your safe starting spend</div>
        <div className="text-[22px] font-semibold text-slate-900">Working out your plan</div>
        <p className="text-sm text-slate-600">The solver tries each year&apos;s choices, how much to spend, which pot to draw from and how to invest, against thousands of simulated markets, and keeps the plan that lasts best.</p>
        <p className="text-sm text-slate-600">It takes a few minutes; the strip at the top says how far it has got.</p>
        <p className="text-sm text-slate-600">{isPhone ? 'Keep this page open. You can read the other places, or change more on You; another change starts the work again when you ask.' : 'You can read the other places meanwhile, or change your inputs in You.'}</p>
      </div>
    );
  }
  const h = s.headline, w = headlineWords(h, fmt);
  const [lead, rest] = splitAmount(w.amount);
  const stale = state === 'stale';
  return (
    <div data-plan-answer={state} data-solver-strategy data-strategy-state={state === 'done' ? 'done' : state === 'filling' ? 'partial' : 'stale'}
      data-strategy-trials={s.trials} data-strategy-case={h.case} data-strategy-figures={JSON.stringify(s)} className="relative">
      {stale && !PLANNER_PLANT.has('noband') && (
        <div data-stale-band role="status" className="mb-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center justify-between gap-2">
          <span>{isPhone && onSolveRequest ? 'Before your last change.' : BAND(pctDone)}</span>
          {isPhone && onSolveRequest && <button type="button" data-solve-request onClick={onSolveRequest} className="min-h-11 px-3 rounded-lg bg-surface border border-amber-300 text-amber-900 font-bold cursor-pointer">Solve again</button>}
        </div>
      )}
      <div className={`p-5 bg-surface border border-indigo-200 rounded-xl space-y-2 ${stale ? 'opacity-55' : ''}`} data-strategy-headline>
        <div className="text-xs font-semibold text-indigo-900">{w.title}</div>
        <div className="font-display text-slate-900 leading-tight whitespace-nowrap" data-plan-amount>
          <span className={`${isPhone ? 'text-[30px] min-[360px]:text-[40px]' : 'text-[52px]'} font-medium tabular-nums`}>{lead}</span>
          <span className={`${isPhone ? 'text-[15px] min-[360px]:text-[20px]' : 'text-[26px]'} font-medium`}> a year</span>
        </div>
        {rest && <p className="text-sm text-slate-700">{rest}</p>}
        {w.share && <p className="text-sm text-slate-700">{w.share} {w.back}</p>}
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 pt-1">
          <p className="text-sm text-slate-800">Chance your money lasts <strong className="text-[22px] font-semibold tabular-nums">{pct(h.survival)}</strong></p>
          <p className="text-xs text-slate-600">{w.delivered}</p>
        </div>
        <p className="text-[11px] text-slate-500">{s.trials >= steps[steps.length - 1] ? `On ${s.trials.toLocaleString('en-GB')} simulated markets.` : `On ${s.trials.toLocaleString('en-GB')} simulated markets so far.`}</p>
        {!stale && hasActions && onPrint && <button type="button" data-plan-print onClick={onPrint} className={`text-xs font-semibold text-indigo-700 hover:underline cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`}>Print this plan</button>}
      </div>
    </div>
  );
}
// "£41,600 a year" -> ["£41,600", null]; "£31,350 a year, above your £28,500 target" -> ["£31,350", "Above your £28,500 target."]
export function splitAmount(amount) {
  const m = /^(.*?) a year(?:, (.*))?$/.exec(amount);
  if (!m) return [amount, null];
  return [m[1], m[2] ? `${m[2][0].toUpperCase()}${m[2].slice(1)}.` : null];
}

/* ---------------------------------------------------------------- the outlook (LAYOUT.md section 3.1, item 3) */
// a linear scale with its inverse, so each mark carries the figures it was drawn from, read back from where it was drawn
const lin = (d0, d1, r0, r1) => { const f = v => r0 + ((v - d0) * (r1 - r0)) / (d1 - d0 || 1); f.invert = p => d0 + ((p - r0) * (d1 - d0)) / (r1 - r0 || 1); return f; };
const W = 600, H = 240, PAD = { l: 44, r: 16, t: 14, b: 26 };
const area = (pts, lo, hi, x, y) => `${pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(2)},${y(p[hi]).toFixed(2)}`).join('')}${[...pts].reverse().map(p => `L${x(p.at).toFixed(2)},${y(p[lo]).toFixed(2)}`).join('')}Z`;
const path = (pts, k, x, y) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(2)},${y(p[k]).toFixed(2)}`).join('');

function outlookParts({ s, ahead, fmt, floorShare, minPot, dim, isPhone }) {
  const spend = <SpendCard s={s} ahead={ahead} fmt={fmt} floorShare={floorShare} dim={dim} isPhone={isPhone} />;
  const wealth = <WealthCard s={s} fmt={fmt} minPot={minPot} dim={dim} isPhone={isPhone} />;
  return { spend, wealth, full: <div data-outlook className="grid gap-6 min-[900px]:grid-cols-2">{spend}{wealth}</div> };
}
const ageAt0Of = s => (s.outlook.spend.length ? s.outlook.spend[0].age - s.outlook.spend[0].t : 0);
function SpendCard({ s, ahead, fmt, floorShare, dim, isPhone }) {
  const [show, setShow] = useState(false);
  const h = s.headline, o = s.outlook, ageAt0 = ageAt0Of(s);
  const spend = o.spend.map(b => ({ ...b, at: b.age }));
  const typical = ahead && ahead.typical ? spend.map(b => ({ at: b.age, t: b.t, level: ahead.typical[b.t] })) : null;
  // the raise line, not where it adds nothing to the headline: no higher than the start, from the first retired year (L13)
  const raise = s.raise && !(s.raise.t === h.retireT && s.raise.level <= h.startLevel) ? raiseWords(s.raise) : null;
  const backAge = h.backT !== null && h.backT !== undefined ? ageAt0 + h.backT : null;
  return (
    <section data-outlook="spend" data-outlook-bands={JSON.stringify(o.spend)} data-outlook-typical={typical ? JSON.stringify(ahead.typical) : ''} data-outlook-back={h.backYear || ''}
      data-outlook-raise={raise ? 'shown' : 'none'} className={`p-4 bg-surface border border-slate-200/90 rounded-xl space-y-2 ${dim ? 'opacity-55' : ''}`}>
      <h3 className="text-[15px] font-semibold text-slate-900">What you could spend</h3>
      <SpendChart pts={spend} typical={typical} floorShare={floorShare} target={h.target} backAge={backAge} backYear={h.backYear} fmt={fmt} label={sentence(typical, h, s.raise, raise)} isPhone={isPhone} />
      {raise && <p className="text-xs text-emerald-800" data-strategy-raise>{raise}</p>}
      <button type="button" onClick={() => setShow(v => !v)} className={`text-xs font-semibold text-indigo-700 hover:underline cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`}>{show ? 'Hide the figures' : 'Show the figures'}</button>
      {show && (
        <table className="w-full text-[11px] tabular-nums" data-outlook-table="spend"><thead><tr className="text-slate-500"><th className="text-left font-medium">Age</th><th className="text-right font-medium">Lowest tenth</th><th className="text-right font-medium">Middle half</th><th className="text-right font-medium">Highest tenth</th><th className="text-right font-medium">Typical run</th></tr></thead>
          <tbody>{spend.map(b => <tr key={b.t} className="border-t border-slate-100"><td>{b.age}</td><td className="text-right">{pct(b.p10)}</td><td className="text-right">{pct(b.p25)} to {pct(b.p75)}</td><td className="text-right">{pct(b.p90)}</td><td className="text-right">{typical ? pct(ahead.typical[b.t]) : ''}</td></tr>)}</tbody></table>
      )}
    </section>
  );
}
function WealthCard({ s, fmt, minPot, dim, isPhone }) {
  const [show, setShow] = useState(false);
  const o = s.outlook, ageAt0 = ageAt0Of(s);
  const wealth = o.wealth.solved.map(b => ({ ...b, at: ageAt0 + b.t })), yours = o.wealth.yours.map(b => ({ ...b, at: ageAt0 + b.t }));
  return (
    <section data-outlook="wealth" data-outlook-bands={JSON.stringify(o.wealth)} className={`p-4 bg-surface border border-slate-200/90 rounded-xl space-y-2 ${dim ? 'opacity-55' : ''}`}>
      <h3 className="text-[15px] font-semibold text-slate-900">What you would have</h3>
      <WealthChart pts={wealth} yours={yours} minPot={minPot} fmt={fmt} isPhone={isPhone} />
      <button type="button" onClick={() => setShow(v => !v)} className={`text-xs font-semibold text-indigo-700 hover:underline cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`}>{show ? 'Hide the figures' : 'Show the figures'}</button>
      {show && (
        <table className="w-full text-[11px] tabular-nums" data-outlook-table="wealth"><thead><tr className="text-slate-500"><th className="text-left font-medium">Age</th><th className="text-right font-medium">Lowest tenth</th><th className="text-right font-medium">Typical</th><th className="text-right font-medium">Highest tenth</th><th className="text-right font-medium">Your current approach, typical</th></tr></thead>
          <tbody>{wealth.map((b, i) => <tr key={b.t} className="border-t border-slate-100"><td>{b.at}</td><td className="text-right">{fmt(b.p10)}</td><td className="text-right">{fmt(b.p50)}</td><td className="text-right">{fmt(b.p90)}</td><td className="text-right">{fmt(yours[i] ? yours[i].p50 : 0)}</td></tr>)}</tbody></table>
      )}
    </section>
  );
}
// the chart's sentence (LAYOUT.md section 10): the typical run's levels in stretches, the headline's back year and the raise
function sentence(typical, h, rz, raise) {
  const parts = [];
  if (typical && typical.length) {
    let i = 0;
    const runs = [];
    while (i < typical.length) { let j = i; while (j + 1 < typical.length && typical[j + 1].level === typical[i].level) j++; runs.push([typical[i].at, typical[j].at, typical[i].level]); i = j + 1; }
    parts.push(`On a typical run: ${runs.slice(0, 4).map(([a, b, l], k) => (k === 0 ? `${l}% of your target to ${b}` : k === runs.length - 1 || k === 3 ? `${l}% from ${a}` : `${l}% from ${a} to ${b}`)).join(', ')}.`);
  }
  if (h.backYear) parts.push(`Half the markets are back at your target by ${h.backYear}.`);
  if (raise && rz) parts.push(`In good markets, up to ${Math.round(rz.level)}% from about ${rz.age}.`);
  return parts.join(' ');
}

function SpendChart({ pts, typical, floorShare, target, backAge, backYear, fmt, label, isPhone }) {
  if (!pts.length) return null;
  const shift = PLANNER_PLANT.has('chartyear') ? 1 : 0;   // the plant: drawn a year out, its data untouched
  const a0 = pts[0].at, a1 = pts[pts.length - 1].at;
  const ymax = Math.max(115, ...pts.map(p => p.p90)), ymin = Math.min(70, Math.floor(100 * floorShare) - 5, ...pts.map(p => p.p10));
  const x = lin(a0, a1, PAD.l, W - PAD.r), y = lin(ymin, ymax, H - PAD.b, PAD.t), xs = v => x(v + shift);
  const tl = typical ? typical.filter(p => Number.isFinite(p.level)) : [];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label} data-chart="spend">
      {[80, 90, 100, 110].map(v => <g key={v}><line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-slate-200" /><text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="fill-slate-500 text-[10px]">{v}%</text></g>)}
      <path d={area(pts, 'p10', 'p90', xs, y)} className="fill-indigo-100" />
      <path d={area(pts, 'p25', 'p75', xs, y)} className="fill-indigo-200" />
      <line x1={PAD.l} x2={W - PAD.r} y1={y(100)} y2={y(100)} className="stroke-slate-400" strokeDasharray="5 4" />
      <text x={W - PAD.r} y={y(100) - 4} textAnchor="end" className="fill-slate-600 text-[10px]">your target, {fmt(target)}</text>
      <line x1={PAD.l} x2={W - PAD.r} y1={y(100 * floorShare)} y2={y(100 * floorShare)} className="stroke-amber-700" strokeDasharray="1 3" />
      <text x={W - PAD.r} y={y(100 * floorShare) + 12} textAnchor="end" className="fill-amber-700 text-[10px]">the lowest it plans, {pct(100 * floorShare)}</text>
      {backAge !== null && backAge >= a0 && backAge <= a1 && (
        <g data-outlook-backmark data-x={x.invert(xs(backAge))}>
          <line x1={xs(backAge)} x2={xs(backAge)} y1={PAD.t} y2={H - PAD.b} className="stroke-indigo-400" strokeDasharray="2 3" />
          {/* on the line's far side from the nearer edge, so it never runs off the chart */}
          <text x={backAge > (a0 + a1) / 2 ? xs(backAge) - 4 : xs(backAge) + 4} y={PAD.t + 10} textAnchor={backAge > (a0 + a1) / 2 ? 'end' : 'start'} className="fill-indigo-800 text-[10px]">{isPhone ? `half back by ${backYear}` : `Half the markets back at your target by ${backYear}`}</text>
        </g>
      )}
      {tl.length > 0 && <path d={path(tl, 'level', xs, y)} className="stroke-indigo-700 fill-none" strokeWidth="2.5" data-outlook-line="typical" />}
      {/* named where it starts, at the left, clear of the back year's mark at the top and the target's and floor's names at the right */}
      {tl.length > 0 && <text x={xs(tl[0].at) + 2} y={y(tl[0].level) - 6} textAnchor="start" className="fill-indigo-800 text-[10px]">{isPhone ? 'a typical run' : 'a typical run (the next ten years follow it)'}</text>}
      <g data-points="typical">{tl.map(p => <circle key={p.at} r="0" cx={xs(p.at)} cy={y(p.level)} data-x={x.invert(xs(p.at))} data-y={y.invert(y(p.level))} />)}</g>
      <g data-points="bands">{pts.map(p => <circle key={p.at} r="0" cx={xs(p.at)} cy={y(p.p50)} data-x={x.invert(xs(p.at))} data-p10={y.invert(y(p.p10))} data-p25={y.invert(y(p.p25))} data-p75={y.invert(y(p.p75))} data-p90={y.invert(y(p.p90))} />)}</g>
      {[a0, Math.round((a0 + a1) / 2), a1].map(v => <text key={v} x={x(v)} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[10px]">{v}</text>)}
    </svg>
  );
}

function WealthChart({ pts, yours, minPot, fmt, isPhone }) {
  if (!pts.length) return null;
  const a0 = pts[0].at, a1 = pts[pts.length - 1].at;
  const ymax = Math.max(1, ...pts.map(p => p.p90), ...yours.map(p => p.p50));
  const x = lin(a0, a1, PAD.l + 14, W - PAD.r), y = lin(0, ymax * 1.05, H - PAD.b, PAD.t);
  const ticks = [0, ymax / 2, ymax].map(v => Math.round(v / 10000) * 10000);
  // the two end names: the current approach's under its line, kept above the age axis; the solved plan's above its own, a line
  // clear of the other's where the two ends meet
  const yy = Math.min(y(yours[yours.length - 1].p50) + 12, H - PAD.b - 4), ys0 = y(pts[pts.length - 1].p50) - 6;
  const endY = { yours: yy, solved: Math.abs(ys0 - yy) < 12 ? yy - 12 : ys0 };
  const label = `The solved plan's money, typical: ${fmt(pts[0].p50)} now, ${fmt(pts[Math.floor(pts.length / 2)].p50)} at ${pts[Math.floor(pts.length / 2)].at}, ${fmt(pts[pts.length - 1].p50)} at ${a1}; your current approach, typical, ${fmt(yours[yours.length - 1].p50)} at ${a1}.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label} data-chart="wealth">
      {ticks.map(v => <g key={v}><line x1={PAD.l + 14} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-slate-200" /><text x={PAD.l + 10} y={y(v) + 3} textAnchor="end" className="fill-slate-500 text-[10px]">{v >= 1e6 ? `£${(v / 1e6).toFixed(1)}m` : `£${Math.round(v / 1000)}k`}</text></g>)}
      <path d={area(pts, 'p10', 'p90', x, y)} className="fill-indigo-100" />
      <path d={area(pts, 'p25', 'p75', x, y)} className="fill-indigo-200" />
      <path d={path(pts, 'p50', x, y)} className="stroke-indigo-700 fill-none" strokeWidth="2.5" />
      <path d={path(yours, 'p50', x, y)} className="stroke-slate-500 fill-none" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x={x(a1)} y={endY.solved} textAnchor="end" className="fill-indigo-800 text-[10px]">the solved plan, typical</text>
      <text x={x(a1)} y={endY.yours} textAnchor="end" className="fill-slate-600 text-[10px]">{isPhone ? 'current approach' : 'your current approach, typical'}</text>
      {minPot > 0 && <line x1={PAD.l + 14} x2={W - PAD.r} y1={y(minPot)} y2={y(minPot)} className="stroke-amber-700" strokeDasharray="1 3" data-outlook-minpot />}
      <g data-points="bands">{pts.map(p => <circle key={p.at} r="0" cx={x(p.at)} cy={y(p.p50)} data-x={x.invert(x(p.at))} data-p10={y.invert(y(p.p10))} data-p50={y.invert(y(p.p50))} data-p90={y.invert(y(p.p90))} />)}</g>
      {[a0, Math.round((a0 + a1) / 2), a1].map(v => <text key={v} x={x(v)} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[10px]">{v}</text>)}
    </svg>
  );
}

/* ---------------------------------------------------------------- this year, the rule, ten years, the comparison */
function belowParts({ s, mine, ctx, dim, isPhone, rulesLine }) {
  const h = s.headline, c = s.compare;
  const rows = [
    ['Chance the money lasts', v => `${v.survival.toFixed(1)}%`, 'survival'],
    ['Pot left at the end, typical', v => ctx.fmt(v.medianPot), 'medianPot'],
    ['Pot left at the end, unlucky tenth', v => ctx.fmt(v.p10Pot), 'p10Pot'],
    ['Tax over your lifetime, typical', v => ctx.fmt(v.lifetimeTax), 'lifetimeTax'],
    ['Estate after the pension\'s death tax, typical', v => ctx.fmt(v.estate), 'estate']
  ];
  const op = dim ? 'opacity-55' : '';
  const thisYear = (
    <div className={`p-4 bg-surface border border-slate-200/90 rounded-xl space-y-3 ${op}`} data-strategy-actions={mine.actions ? 'done' : 'pending'}>
      <h3 className="text-[15px] font-semibold text-slate-900">{h.retired ? 'This year' : 'This year, before you retire'}</h3>
      {isPhone && <p className="text-xs text-slate-500">Each shows what skipping it, this year only, would cost.</p>}
      {!mine.actions ? <p className="text-xs text-slate-500">Working out what each of this year&apos;s steps is worth…</p>
        : !mine.actions.actions.length ? <p className="text-sm text-slate-700" data-strategy-action="none">Nothing to change this year: keep to your plan as it stands.</p>
          : <ol className="space-y-2">{mine.actions.actions.map((x, i) => { const t = actionWords(x, ctx); return (
            <li key={x.part} className="flex gap-3" data-strategy-action={x.part} data-strategy-cost={x.cost === null ? '' : x.cost}>
              <span className="text-xs font-semibold text-indigo-700 tabular-nums">{i + 1}</span>
              <div><div className="text-sm font-medium text-slate-800">{t.what}</div><div className="text-xs text-slate-500">{t.cost}</div></div>
            </li>); })}</ol>}
    </div>
  );
  const rule = mine.distil && (mine.distil.show ? (() => { const t = ruleWords(mine.distil, ctx); return (
    <div className={`p-4 bg-surface border border-slate-200/90 rounded-xl space-y-1.5 ${op}`} data-strategy-rule="shown" data-strategy-rule-cost={mine.distil.cost}>
      <h3 className="text-[15px] font-semibold text-slate-900">{t.title}</h3>
      {t.lines.map((l, i) => <p key={i} className="text-sm text-slate-800">{l}</p>)}
      <p className="text-xs text-slate-500">{t.note}</p>
    </div>); })() : <div hidden data-strategy-rule="hidden" data-strategy-rule-cost={mine.distil.cost} />);
  const groups = mine.ahead ? aheadRowsWords(mine.ahead.rows, ctx) : null;
  const ahead = groups && (
    <div className={`p-4 bg-surface border border-slate-200/90 rounded-xl ${op}`} data-strategy-ahead={mine.ahead.rows.length} data-ahead-groups={groups.length}
      data-ahead-spend={JSON.stringify(mine.ahead.rows.map(r => [r.age, r.spend]))}>
      <h3 className="text-[15px] font-semibold text-slate-900 mb-2">The next ten years on a typical run of the markets</h3>
      {isPhone ? (
        <ul className="space-y-2">{groups.map(g => <li key={g.from.t} className="border-t border-slate-100 pt-2" data-ahead-row={g.from.t}><div className="text-xs text-slate-500">{g.when}</div><div className="text-sm text-slate-800">{g.spend}</div>{g.lines.map((l, i) => <div key={i} className="text-xs text-slate-600">{l}</div>)}</li>)}</ul>
      ) : (
        <table className="w-full text-xs"><thead><tr className="text-slate-500"><th className="text-left font-medium py-1">Year (age)</th><th className="text-left font-medium">Spending (level)</th><th className="text-left font-medium">The year&apos;s move</th></tr></thead>
          <tbody>{groups.map(g => (
            <tr key={g.from.t} className="border-t border-slate-100 align-top" data-ahead-row={g.from.t}><td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap">{g.when}</td><td className="pr-3 text-slate-800 whitespace-nowrap tabular-nums">{g.spend}</td><td className="text-slate-600">{g.lines.map((l, i) => <div key={i}>{l}</div>)}</td></tr>
          ))}</tbody></table>
      )}
      <p className="text-xs text-slate-500 mt-2">{COME_BACK}</p>
    </div>
  );
  const compare = (
    <div className={`p-4 bg-surface border border-slate-200/90 rounded-xl ${op}`} data-strategy-compare>
      <h3 className="text-[15px] font-semibold text-slate-900 mb-2">The solved plan against your current approach, on the same {s.trials.toLocaleString('en-GB')} markets</h3>
      <table className="w-full text-xs tabular-nums">
        <thead><tr className="text-slate-500"><th className="text-left font-medium py-1"></th><th className="text-right font-medium">Your current approach</th><th className="text-right font-medium">Solved</th></tr></thead>
        <tbody>{rows.map(([label, f, k]) => (
          <tr key={k} className="border-t border-slate-100" data-strategy-row={k}><td className="py-1.5 text-slate-700">{label}</td><td className="text-right text-slate-700">{f(c.yours)}</td><td className="text-right font-semibold text-slate-900">{f(c.solved)}</td></tr>
        ))}</tbody>
      </table>
      {rulesLine && <p className="text-xs text-slate-500 mt-2" data-compare-rules>{rulesLine}</p>}
    </div>
  );
  return { thisYear, rule, ahead, compare, all: <>{thisYear}{rule}{ahead}{compare}</> };
}

/* ---------------------------------------------------------------- the phone's deck (LAYOUT.md section 9) */
const SLIDES = ['The answer', 'What you could spend', 'What you would have', 'This year', 'The next ten years', 'Against your current approach'];
function Deck({ card, explanation, outlook, below, levers, onOpenLevers, state }) {
  const [slide, setSlide] = useState(1), [all, setAll] = useState(false), [why, setWhy] = useState(false);
  const ref = useRef(null);
  useSwipe(ref, { enabled: !all, onLeft: () => setSlide(n => Math.min(SLIDES.length, n + 1)), onRight: () => setSlide(n => Math.max(1, n - 1)) });
  const ready = !!outlook;
  const body = n => {
    if (n === 1) return (<>
      {card}
      {explanation && <button type="button" data-plan-why onClick={() => setWhy(true)} className="w-full min-h-11 rounded-lg border border-indigo-200 bg-indigo-50/60 text-sm font-semibold text-indigo-900 cursor-pointer">Why your plan starts below your target</button>}
      <div className="p-3 bg-surface border border-slate-200/90 rounded-xl flex items-center justify-between gap-2" data-plan-choices>
        <div className="min-w-0"><div className="text-xs font-semibold text-slate-900">Your choices</div><div className="text-xs text-slate-600 truncate">{levers}</div></div>
        {onOpenLevers && <button type="button" data-open-levers onClick={onOpenLevers} className="min-h-11 px-3 rounded-lg bg-surface border border-slate-300 text-sm font-semibold text-slate-800 cursor-pointer">Change</button>}
      </div>
    </>);
    if (!ready) return <p className="text-sm text-slate-500 p-4">The figures arrive once your plan is worked out.</p>;
    if (n === 2) return outlook.spend;
    if (n === 3) return outlook.wealth;
    if (n === 4) return <>{below.thisYear}{below.rule}</>;
    if (n === 5) return below.ahead || <p className="text-sm text-slate-500 p-4">Working out the next ten years…</p>;
    return below.compare;
  };
  return (
    <div data-planner-plan data-deck data-deck-state={state} ref={ref} className="space-y-3 swipe-x">
      <div className="flex items-center gap-1 overflow-x-auto" data-no-swipe role="tablist" aria-label="Your plan, a slide at a time">
        {SLIDES.map((t, i) => (
          <button key={t} type="button" role="tab" aria-selected={!all && slide === i + 1} aria-label={t} data-deck-step={i + 1} onClick={() => { setAll(false); setSlide(i + 1); }}
            className={`min-h-11 min-w-11 px-2 rounded-lg text-xs font-bold border cursor-pointer ${!all && slide === i + 1 ? 'bg-accent text-onaccent border-blue-600' : 'bg-surface text-slate-600 border-slate-200'}`}>{i + 1}</button>
        ))}
        <button type="button" onClick={() => setAll(v => !v)} className="ml-auto min-h-11 px-3 rounded-lg text-xs font-bold border border-slate-200 bg-surface text-slate-700 cursor-pointer">{all ? 'One at a time' : 'See all'}</button>
      </div>
      {all ? SLIDES.map((t, i) => <div key={t} data-deck-slide={i + 1} className="space-y-3">{body(i + 1)}</div>) : (
        <div data-deck-slide={slide} className="space-y-3">{body(slide)}</div>
      )}
      {!all && (
        <div className="flex gap-2">
          <button type="button" disabled={slide === 1} onClick={() => setSlide(slide - 1)} className="min-h-11 px-4 rounded-lg border border-slate-200 bg-surface text-sm font-semibold text-slate-700 disabled:opacity-40 cursor-pointer">Back</button>
          {slide < SLIDES.length && <button type="button" data-deck-next onClick={() => setSlide(slide + 1)} className="flex-1 min-h-11 px-4 rounded-lg bg-accent text-onaccent text-sm font-bold cursor-pointer">Next: {SLIDES[slide].toLowerCase()}</button>}
        </div>
      )}
      <p className="text-[11px] text-slate-400">Educational and illustrative only. This is not financial advice.</p>
      {why && explanation && (
        <div role="dialog" aria-modal="true" aria-label="Why your plan starts below your target" className="fixed inset-0 z-50 bg-surface overflow-y-auto p-4 space-y-3" onKeyDown={e => { if (e.key === 'Escape') setWhy(false); }}>
          <div className="flex justify-end"><button type="button" onClick={() => setWhy(false)} className="min-h-11 px-3 text-sm font-semibold text-slate-700 cursor-pointer">Close</button></div>
          {explanation}
        </div>
      )}
    </div>
  );
}
