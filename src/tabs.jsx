/*
 * SECONDARY TABS: ONE SECTION OF A LONG FORM AT A TIME.
 *
 * The Plan Inputs tab was 4,379px on a phone - five sections and an advanced fold in one column, five
 * screens of scrolling to see what was there. The sections are parallel rather than sequential (nothing
 * in "Income" depends on having finished "You"), which is exactly the case Material 3 gives secondary
 * tabs to: a row inside the content area that divides it, scrollable when the labels do not fit, with
 * the content swipeable between them.
 *
 * Sticky at the top so it stays reachable while a long section scrolls under it. The active tab is
 * scrolled into view on change, because the sixth label is off the right edge of a 390px screen.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// The row cancels its parent's side padding so the strip runs edge to edge; `gutter` is which padding.
const GUTTER = { 3: '-mx-3 px-3', 4: '-mx-4 px-4' };

export function SectionTabs({ sections, active, onSelect, gutter = 4, className = '' }) {
  const rowRef = useRef(null);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const el = row.querySelector('[aria-selected="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);
  return (
    <div data-section-tabs role="tablist" aria-label="Sections" ref={rowRef}
      className={`sticky top-0 z-30 ${GUTTER[gutter] || GUTTER[4]} bg-slate-50/95 backdrop-blur border-b border-slate-200 flex gap-1 overflow-x-auto [scrollbar-width:none] ${className}`}
      data-no-swipe>
      {sections.map(s => {
        const on = s.id === active;
        return (
          <button key={s.id} type="button" role="tab" aria-selected={on} onClick={() => onSelect(s.id)}
            className={`shrink-0 min-h-11 px-3 text-[13px] font-semibold border-b-2 -mb-px cursor-pointer whitespace-nowrap transition-colors ${
              on ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}>
            {s.short}
          </button>
        );
      })}
    </div>
  );
}

/*
 * THE DECK'S OWN STEPS, AS A BAR ABOVE THE NAVIGATION.
 *
 * The projection is eight steps on a phone, and they used to be chosen from a strip at the FOOT of each
 * card - so moving from step 3 to step 6 meant scrolling to the bottom of step 3 first. A card is one to
 * three screens; its own controls were the furthest thing on it from a thumb.
 *
 * So the steps sit where the tabs sit: a row fixed above the bottom navigation, scrollable because eight
 * labels do not fit across 390px, with the current one scrolled into view. It is the same relationship
 * the Inputs tab's section tabs have to that form, one level down - the app's tabs choose the screen,
 * this chooses which part of the screen you are on.
 *
 * A portal to the body, like the sheet and the nav: a `fixed` element is positioned against the nearest
 * ancestor with a transform rather than against the viewport, and the charts on these very steps have
 * transforms in them.
 *
 * z-[41]: above the navigation at 40, below the sandbox sheet at 45. The sheet is pushed up by this
 * bar's height rather than covering it - on the step where both are on screen, both are usable.
 */
export function DeckBar({ steps, active, onSelect }) {
  const rowRef = useRef(null);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const el = row.querySelector('[aria-selected="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div data-deck-bar role="tablist" aria-label="Projection steps" ref={rowRef} data-no-swipe
      className="fixed inset-x-0 z-[41] md:hidden bg-surface border-t border-slate-200 flex gap-1 px-2 overflow-x-auto [scrollbar-width:none]"
      style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}>
      {steps.map(st => {
        const on = st.n === active;
        return (
          <button key={st.n} type="button" role="tab" aria-selected={on} data-deck-step={st.n}
            onClick={() => onSelect(st.n)}
            className={`shrink-0 h-11 px-2.5 flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap border-b-2 -mb-px cursor-pointer transition-colors ${
              on ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}>
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center tabular-nums ${on ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{st.n}</span>
            {st.short}
          </button>
        );
      })}
    </div>,
    document.body
  );
}
