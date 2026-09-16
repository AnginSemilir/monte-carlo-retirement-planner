/*
 * THE PIECES A PHONE NEEDS AND A DESKTOP DOES NOT.
 *
 * Z-INDEX LADDER, shared with src/nav.jsx so these never fight:
 *   40  the bottom navigation bar
 *   45  the sandbox sheet, collapsed or in quick mode - above the bar, but the bar stays usable
 *   50  the More sheet, and the sandbox sheet fully expanded - both deliberately cover the bar
 *   55  a chart opened fullscreen
 *   60+ the in-app editor's dev chrome, which never ships
 *
 * Everything that needs to escape the page flow is rendered through a portal to document.body. A `fixed`
 * element is positioned against its nearest ancestor that has a transform, filter or perspective rather
 * than against the viewport, and this app has transforms in the charts - so a sheet left in place would
 * work until somebody nested it one level deeper, then silently stop filling the screen.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/*
 * A CHART, AS BIG AS THE SCREEN GETS.
 *
 * Even edge to edge, a chart on a phone is about 390 by 310. That is enough to read a shape and not
 * enough to read a year off the axis, so this exists to give the chart the whole viewport - and, because
 * it is sized from the viewport rather than from a fixed aspect, turning the phone sideways just works.
 *
 * The area is MEASURED with a ResizeObserver and handed back through `onBox`, rather than computed from
 * window.innerHeight minus some guesses. The toolbar's height depends on how many controls wrap on to a
 * second row, which depends on the width - so anything calculated up front is wrong on some device.
 */
export function ChartFullscreen({ open, title, toolbar, onBox, onClose, children }) {
  const areaRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    /*
     * Scroll lock, the way iOS needs it. `overflow: hidden` on the body is ignored by Safari, which
     * scrolls the page behind the overlay anyway; pinning the body at a negative offset is the form
     * that works, and the offset has to be restored on close or the page jumps to the top.
     */
    const y = window.scrollY;
    const prev = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      window.scrollTo(0, y);
      if (openerRef.current && openerRef.current.focus) openerRef.current.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !areaRef.current || typeof ResizeObserver === 'undefined') return undefined;
    const el = areaRef.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 10 && r.height > 10) onBox({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, onBox]);

  if (!open) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title}
      className="fixed inset-0 z-[55] bg-surface fill-viewport flex flex-col"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 shrink-0">
        <span className="text-sm font-semibold text-slate-900 truncate">{title}</span>
        <button type="button" onClick={onClose} aria-label="Close chart" autoFocus
          className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div ref={areaRef} className="flex-1 min-h-0 relative">{children}</div>
      {toolbar && <div className="shrink-0 border-t border-slate-200 p-2 flex flex-wrap items-center gap-2 overflow-x-auto">{toolbar}</div>}
    </div>,
    document.body
  );
}

/*
 * LONG EXPLANATIONS, FOLDED AWAY ON A PHONE ONLY.
 *
 * This app explains itself, at length, and that is the right call on a desktop where the prose sits
 * beside the figure it describes. On a 390px screen the same paragraph is eight lines and pushes the
 * number it is explaining off the bottom of the screen.
 *
 * Native <details>, so the content is ALWAYS in the DOM - collapsed, not removed. Nothing is deleted,
 * screen readers and find-in-page still reach it, and on a desktop this component does nothing at all.
 */
export function Fine({ isPhone, label = 'Why?', children }) {
  if (!isPhone) return children;
  return (
    <details className="text-xs">
      <summary className="cursor-pointer min-h-11 flex items-center text-blue-700 font-semibold">{label}</summary>
      <div className="pt-1">{children}</div>
    </details>
  );
}

/*
 * A PANEL THAT LIVES AT THE BOTTOM OF THE SCREEN.
 *
 * The sandbox is a set of dials whose whole purpose is to move a line on a chart. Side by side that is
 * obvious; stacked on a phone the chart scrolls away the moment you reach the controls, so you are
 * editing blind - which is the thing the sandbox exists to avoid.
 *
 * Three modes rather than open/closed. `collapsed` is a single line of summary, for when the chart is
 * what you want. `quick` is the dials that matter, capped at 45% of the screen so the chart stays
 * visible above it. `full` is the entire original panel, unchanged, for everything else. Nothing is
 * removed from the phone build - it is one tap further away.
 *
 * In collapsed and quick the sheet sits ABOVE the navigation bar, so you can still change tab while
 * adjusting. Only `full` covers it, which is the one mode where the sheet is the whole task.
 */
export function SheetPanel({ mode, onMode, summary, quick, full, onHeight }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    if (!ref.current || !onHeight) return undefined;
    const el = ref.current;
    const report = () => onHeight(Math.round(el.getBoundingClientRect().height));
    report();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight, mode]);

  const cycle = () => onMode(mode === 'collapsed' ? 'quick' : mode === 'quick' ? 'full' : 'quick');
  const onDown = (e) => setDrag(e.clientY);
  const onUp = (e) => {
    if (drag === null) return;
    const dy = e.clientY - drag;
    setDrag(null);
    if (Math.abs(dy) < 40) return;          // a tap, not a drag - the handle's onClick deals with it
    if (dy < 0) onMode(mode === 'collapsed' ? 'quick' : 'full');
    else onMode(mode === 'full' ? 'quick' : 'collapsed');
  };

  const full_ = mode === 'full';
  return createPortal(
    <div ref={ref} data-sandbox-sheet data-mode={mode}
      className={`fixed inset-x-0 bg-surface border-t border-slate-200 rounded-t-2xl shadow-lg md:hidden ${full_ ? 'z-50 top-[8dvh] bottom-0 flex flex-col' : 'z-[45]'}`}
      style={full_ ? { paddingBottom: 'env(safe-area-inset-bottom)' } : { bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}>
      <button type="button" onClick={cycle} onPointerDown={onDown} onPointerUp={onUp}
        aria-expanded={mode !== 'collapsed'} aria-label={mode === 'collapsed' ? 'Open the sandbox controls' : 'Close the sandbox controls'}
        className="w-full min-h-11 flex flex-col items-center justify-center gap-1 cursor-pointer shrink-0 touch-none">
        <span className="h-1 w-10 rounded-full bg-slate-300" />
        {mode === 'collapsed' && <span className="text-[11px] text-slate-600 px-3 truncate max-w-full">{summary}</span>}
      </button>
      {/*
        * 28dvh, not 45. The sheet exists so the chart stays visible while you adjust, and on a 664px
        * phone a 45% sheet plus its handle plus the nav bar reached far enough up to cover the bottom of
        * the chart - which defeats the whole arrangement. The dials scroll inside this, so a shorter cap
        * costs nothing; `full` is there for anyone who wants the screen.
        */}
      {mode === 'quick' && <div className="max-h-[28dvh] overflow-y-auto overscroll-contain px-3 pb-3">{quick}</div>}
      {full_ && <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-3">{full}</div>}
    </div>,
    document.body
  );
}
