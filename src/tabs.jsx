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

export function SectionTabs({ sections, active, onSelect, className = '' }) {
  const rowRef = useRef(null);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const el = row.querySelector('[aria-selected="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);
  return (
    <div data-section-tabs role="tablist" aria-label="Sections" ref={rowRef}
      className={`sticky top-0 z-30 -mx-4 px-4 bg-slate-50/95 backdrop-blur border-b border-slate-200 flex gap-1 overflow-x-auto [scrollbar-width:none] ${className}`}
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
