/*
 * THE STATUS STRIP'S WORDS (step U, the new planner: LAYOUT.md section 4.1). One strip for the whole planner says what the
 * solver is doing, in place of each card's own line. In the page's entry, since it shows before any solver chunk arrives.
 *   statusOf(solve, { isPhone, asked, simulating, trials, more, here, elapsed })
 *     solve       useSolver's state ({ solveState, solveMeta, progress, storeNote })
 *     asked       a phone's request for this version of the plan (B10, per version)
 *     simulating  the solve is in and Your plan's paths are not yet; trials, how many it runs
 *     more        solves asked for on What if or by the dial's comparison, still running; here, on this place
 *     elapsed     seconds since the stage began, for the time left
 *   -> { state, text, pct, left, action }   state: 'idle' | 'ask' | 'solving' | 'stale' | 'simulating' | 'solved' | 'failed';
 *                                            action: 'request' | 'again' | 'retry' | null
 */
const PCT = p => (p && p.total ? Math.round((100 * p.done) / p.total) : null);

// a solve's time: seconds under 90 seconds, whole minutes from there
export const solveTime = secs => (secs < 90 ? `${Math.round(secs)} seconds` : `${Math.round(secs / 60)} minutes`);

// the time left, from the progress and the time since the stage began: from 10%, and only when over a minute
export function timeLeft(progress, elapsed) {
  const f = progress && progress.total ? progress.done / progress.total : 0;
  if (!(f >= 0.1) || !(elapsed > 0) || f >= 1) return null;
  const left = (elapsed * (1 - f)) / f;
  return left > 60 ? `about ${Math.max(2, Math.round(left / 60))} minutes left` : null;
}

export function statusOf(solve, { isPhone = false, asked = true, simulating = false, trials = 5000, more = 0, here = false, elapsed = 0 } = {}) {
  const { solveState = 'idle', solveMeta = null, progress = null, storeNote = null } = solve || {};
  const n = trials.toLocaleString('en-GB');
  const tail = more > 0 ? ` · ${more} more being worked out${here ? ' here' : ''}` : '';
  if (solveMeta && solveMeta.error) return { state: 'failed', text: 'The solver could not finish this plan', pct: null, left: null, action: 'retry' };
  if (solveState === 'stale' && isPhone && !asked) return { state: 'stale', text: 'Your plan changed', pct: null, left: null, action: 'again' };
  if (solveState === 'idle' && isPhone && !asked) return { state: 'ask', text: 'Not worked out on this phone yet', pct: null, left: null, action: 'request' };
  if (solveState === 'stale') return { state: 'stale', text: isPhone ? 'Your plan changed: working it out again' : `Your plan changed: working it out again${tail}`, pct: null, left: null, action: null };
  if (solveState === 'solving') {
    const pct = PCT(progress), stage = progress && progress.stage === 'base' ? ' at the Low setting first' : '';
    const what = !progress ? '' : progress.phase === 'years' ? 'year by year, ' : 'the years before your pension opens, ';
    const text = isPhone ? `Working out${stage}: ${pct === null ? '…' : `${pct}%`}` : `Working out your plan${stage}${pct === null ? '…' : `: ${what}${pct}%`}${tail}`;
    return { state: 'solving', text, pct, left: isPhone ? null : timeLeft(progress, elapsed), action: null };
  }
  if (solveState === 'solved' && simulating) return { state: 'simulating', text: isPhone ? `Running ${n} markets…` : `Worked out. Running it through ${n} markets…${tail}`, pct: null, left: null, action: null };
  if (solveState === 'solved') {
    const done = isPhone ? 'Worked out' : solveMeta && solveMeta.restored ? 'Worked out on this device before' : solveMeta && solveMeta.secs ? `Worked out in ${solveTime(solveMeta.secs)}` : 'Worked out';
    const kept = storeNote ? ` It is not kept on this device (${storeNote}), so it solves again next visit.` : '';
    return { state: 'solved', text: `${done}${isPhone ? '' : tail}`, note: kept || null, pct: null, left: null, action: null };
  }
  return { state: 'idle', text: '', pct: null, left: null, action: null };
}

/*
 * Solves asked for on What if or by the dial's comparison, still running, by the place that asked (src/SolverFigures.jsx
 * FiguresList and the scenarios card report them); the strip listens. And the timings the cards' cost lines read: this
 * device's last solve and how long its first paths took (LAYOUT.md section 3.3).
 */
export const running = { n: {} };
export function moreJob(place, d) {
  running.n[place] = Math.max(0, (running.n[place] || 0) + d);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('rp-solver-more', { detail: { ...running.n } }));
}
export const timings = { solve: null, paths: null, restored: false };
// "N solves, about M minutes on this device": N times one setting's cost, the solve plus its first paths (twice for a dial
// position above Low, whose simulation runs the base's chooser too); "several minutes each" when the solve was restored
const WORD = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
export function costWords(n, { locked = false, more = false } = {}) {
  const solves = more ? `${WORD[n] || n} more ${n === 1 ? 'solve' : 'solves'}` : `${n} ${n === 1 ? 'solve' : 'solves'}`;
  if (timings.restored || !timings.solve) return `${solves}, several minutes each`;
  const each = timings.solve + (timings.paths || 0) * (locked ? 2 : 1);
  const mins = Math.round((n * each) / 60);
  return `${solves}, ${mins < 2 ? 'about a minute' : `about ${mins} minutes`} on this device`;
}
