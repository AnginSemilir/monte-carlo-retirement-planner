/*
 * THE BOTTOM BAR, AND THE SHEET BEHIND "MORE".
 *
 * A phone holds a tab bar at the bottom because that is where the thumb is. The same eight tabs across
 * the top of a 390px screen wrapped on to two rows and put every target at 32px, which is both hard to
 * hit and a large slice of the screen spent on navigation before anything is read.
 *
 * Four tabs get a permanent place and the rest live behind More. Five is the most that fits at a width a
 * thumb can aim for: 390 / 5 = 78px each, against a 44px minimum. Squeezing all eight in would mean 48px
 * cells with labels too small to read, and a scrolling strip would hide half of them off-screen with no
 * indication they exist.
 *
 * Z-INDEX LADDER, so these never fight:
 *   40  this bar
 *   45  the sandbox sheet in its collapsed and quick modes - above the bar, but the bar stays usable
 *   50  the More sheet, and the sandbox sheet when fully expanded - both deliberately cover the bar
 *   55  a chart opened fullscreen
 *   60+ the in-app editor's dev chrome, which is not part of the shipped app
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

const tone = (active, accent) => active
  ? (accent === 'indigo' ? 'text-indigo-600' : 'text-blue-600')
  : 'text-slate-500';

export function BottomNav({ tabs, primaryIds, activeTab, onSelect, onMore, moreOpen }) {
  const primary = primaryIds.map(id => tabs.find(t => t.id === id)).filter(Boolean);
  const overflow = tabs.filter(t => !primaryIds.includes(t.id));
  const inOverflow = overflow.some(t => t.id === activeTab);
  return (
    <nav data-bottomnav aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-surface border-t border-slate-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* h-14 not min-h: the global .touch-ui min-height rule out-specifies a Tailwind min-h class
          and would quietly shrink this bar to 44px. A fixed row height is not overridable that way. */}
      <div className="grid grid-cols-5 h-14">
        {primary.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} type="button" onClick={() => onSelect(t.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 h-full px-1 text-[10px] font-semibold cursor-pointer transition-colors ${tone(active, t.accent)}`}>
              <t.Icon className="w-5 h-5 shrink-0" />
              <span className="truncate max-w-full">{t.short}</span>
            </button>
          );
        })}
        {/* More carries the active dot when the tab you are on lives inside it, so the bar never looks
            as though nothing is selected. */}
        <button type="button" onClick={onMore}
          aria-haspopup="dialog" aria-expanded={moreOpen} aria-label="More sections"
          className={`relative flex flex-col items-center justify-center gap-0.5 h-full px-1 text-[10px] font-semibold cursor-pointer transition-colors ${tone(inOverflow || moreOpen, 'blue')}`}>
          <MoreHorizontal className="w-5 h-5 shrink-0" />
          <span>More</span>
          {inOverflow && <span className="absolute top-1.5 right-1/2 translate-x-3 w-1.5 h-1.5 rounded-full bg-blue-600" />}
        </button>
      </div>
    </nav>
  );
}

/*
 * `extras` is what the header could not afford on a phone: the theme toggle, and on Plan Inputs the
 * export / import / clear actions. They are settings and file operations, which is what an overflow
 * sheet is for, and moving them here is what let the title card drop from 366px to one row. `foot` is
 * the version string, for the same reason.
 */
export function MoreSheet({ open, tabs, primaryIds, activeTab, onSelect, onClose, extras = null, foot = null }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const overflow = tabs.filter(t => !primaryIds.includes(t.id));
  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 md:hidden" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="More sections"
        className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-surface border-t border-slate-200 rounded-t-2xl p-2 shadow-lg"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-slate-300" />
        {extras && <div className="pb-1 mb-1 border-b border-slate-100">{extras}</div>}
        {overflow.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} type="button" onClick={() => { onSelect(t.id); onClose(); }}
              aria-current={active ? 'page' : undefined}
              className={`w-full min-h-[48px] flex items-center gap-3 px-3 rounded-lg text-sm font-semibold cursor-pointer ${
                active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              <t.Icon className="w-4 h-4 shrink-0" /> {t.label}
            </button>
          );
        })}
        <button type="button" onClick={onClose}
          className="w-full min-h-[44px] mt-1 text-xs font-semibold text-slate-500 cursor-pointer">Close</button>
        {foot && <div className="text-center text-[10px] font-mono text-slate-400 pb-0.5">{foot}</div>}
      </div>
    </>,
    document.body
  );
}

/*
 * THE SIMPLE PAGE'S THREE.
 *
 * Same bar, same rung on the z-index ladder, three cells instead of five and no overflow: the simple
 * page has exactly three places to be and every one of them earns a permanent slot. 390 / 3 = 130px a
 * cell, so the label can be a word rather than an abbreviation.
 *
 * It is a separate component rather than BottomNav with a shorter list because BottomNav owns the More
 * button and the overflow dot, neither of which exists here, and threading "no overflow" through that
 * one would leave both components harder to read than the two of them are apart.
 */
export function SimpleTabs({ tabs, active, onSelect }) {
  return (
    <nav data-simple-tabs aria-label="Simple planner sections"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-surface border-t border-slate-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* h-14, for the same reason BottomNav uses it: .touch-ui's min-height rule out-specifies a
          Tailwind min-h class and would quietly shrink the bar to 44px. */}
      <div className="grid grid-cols-3 h-14">
        {tabs.map(t => {
          const on = active === t.id;
          return (
            <button key={t.id} type="button" onClick={() => onSelect(t.id)}
              aria-current={on ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 h-full px-1 text-[10px] font-semibold cursor-pointer transition-colors ${on ? 'text-blue-600' : 'text-slate-500'}`}>
              <t.Icon className="w-5 h-5 shrink-0" />
              <span className="truncate max-w-full">{t.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
