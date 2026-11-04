/*
 * THE STATUS STRIP (step U; research/reviews/2026-11-03/LAYOUT.md section 4.1): one line for the whole new planner, at the right
 * end of the desktop's tab strip and under the phone's top bar, saying what the solver is doing. It carries data-solve-state and
 * data-solve-key (from the solve in hand, as src/SolverConfig.jsx's SolveLine did) and its own state (data-strip-state). In the
 * page's entry, with its words (src/solveStatus.js), since it shows before any of the solver's chunks arrive.
 * A polite live region announces the state's changes, not each percent.
 */
import React, { useEffect, useRef, useState } from 'react';
import { statusOf, running } from './solveStatus.js';

const PLACE_SAYS = { request: 'Solve my plan', again: 'Solve again', retry: 'Try again' };
export function StatusStrip({ solve, isPhone, asked, simulating, trials, place, onAction }) {
  const [more, setMore] = useState(() => ({ ...running.n }));
  useEffect(() => { const f = e => setMore(e.detail); window.addEventListener('rp-solver-more', f); return () => window.removeEventListener('rp-solver-more', f); }, []);
  // when the stage began, for the time left: a new key, a solve's base or position, another pass or phase
  const p = solve.progress, stage = useRef({ id: null, at: 0 });
  const id = `${solve.key}|${p && p.stage}|${p && p.pass}|${p && p.phase}`;
  if (solve.solveState === 'solving' && stage.current.id !== id) stage.current = { id, at: Date.now() };
  const [, tick] = useState(0);
  useEffect(() => { if (solve.solveState !== 'solving') return undefined; const t = setInterval(() => tick(x => x + 1), 5000); return () => clearInterval(t); }, [solve.solveState]);
  const n = Object.values(more).reduce((a, b) => a + b, 0);
  const st = statusOf(solve, { isPhone, asked, simulating, trials, more: n, here: !!(place && more[place]), elapsed: (Date.now() - stage.current.at) / 1000 });
  const dot = st.state === 'solved' ? 'bg-emerald-600' : st.state === 'stale' || st.state === 'failed' ? 'bg-amber-600' : st.state === 'idle' ? 'bg-slate-300' : 'bg-blue-600';
  const tone = st.state === 'stale' || st.state === 'failed' ? 'text-amber-800' : 'text-slate-600';
  return (
    <div data-solve-status data-solve-state={solve.solveState || 'idle'} data-solve-key={solve.key || ''} data-strip-state={st.state}
      className={isPhone ? `min-h-8 px-3 flex items-center gap-2 text-xs bg-surface border-b border-slate-200 ${st.state === 'stale' || st.state === 'failed' ? 'bg-amber-50' : ''}` : 'flex items-center gap-2 text-xs min-w-0'}>
      <span className="sr-only" role="status" aria-live="polite">{st.state === 'solving' ? 'Working out your plan' : st.text}</span>
      <span aria-hidden="true" className={`shrink-0 w-2 h-2 rounded-full ${dot}`} />
      <span aria-hidden="true" className={`truncate ${tone}`}>{st.text}{!isPhone && st.note ? ` ${st.note}` : ''}</span>
      {st.state === 'solving' && st.pct !== null && (
        <span aria-hidden="true" className={`shrink-0 h-1.5 bg-slate-200 rounded-full overflow-hidden ${isPhone ? 'w-16' : 'w-24'}`}><span className="block h-full bg-blue-600 transition-all" style={{ width: `${st.pct}%` }} /></span>
      )}
      {st.left && <span aria-hidden="true" className="shrink-0 text-slate-500">{st.left}</span>}
      {st.action && onAction && (
        <button type="button" data-solve-request={st.action === 'retry' ? undefined : st.action} data-strategy-retry={st.action === 'retry' ? '' : undefined} onClick={() => onAction(st.action)}
          className={`shrink-0 px-2.5 rounded-lg bg-accent hover:bg-accent-hover text-onaccent font-bold cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-7'}`}>{PLACE_SAYS[st.action]}</button>
      )}
    </div>
  );
}
