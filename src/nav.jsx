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
import { MoreHorizontal } from 'lucide-react';
import { PLANNER_PLANT } from './plannerPlant.js';

const tone = (active, accent) => active
  ? (accent === 'indigo' ? 'text-indigo-600' : 'text-blue-600')
  : 'text-slate-500';

// `more={false}`: the new planner's form (step U, LAYOUT.md section 2.2), its four places in four columns and no More
export function BottomNav({ tabs, primaryIds, activeTab, onSelect, onMore, moreOpen, more = true }) {
  const primary = primaryIds.map(id => tabs.find(t => t.id === id)).filter(Boolean);
  const overflow = tabs.filter(t => !primaryIds.includes(t.id));
  const inOverflow = overflow.some(t => t.id === activeTab);
  return (
    <nav data-bottomnav aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-surface border-t border-slate-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* h-14 not min-h: the global .touch-ui min-height rule out-specifies a Tailwind min-h class
          and would quietly shrink this bar to 44px. A fixed row height is not overridable that way. */}
      <div className={`grid ${more ? 'grid-cols-5' : 'grid-cols-4'} ${!more && PLANNER_PLANT.has('navtarget40') ? 'h-10' : 'h-14'}`}>
        {primary.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} type="button" onClick={() => onSelect(t.id)}
              aria-current={active ? 'page' : undefined}
              style={!more && PLANNER_PLANT.has('navtarget40') ? { minHeight: 0, height: 40 } : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 h-full px-1 text-[10px] font-semibold cursor-pointer transition-colors ${tone(active, t.accent)}`}>
              <t.Icon className="w-5 h-5 shrink-0" />
              <span className="truncate max-w-full">{t.short}</span>
            </button>
          );
        })}
        {/* More carries the active dot when the tab you are on lives inside it, so the bar never looks
            as though nothing is selected. */}
        {more && <button type="button" onClick={onMore}
          aria-haspopup="dialog" aria-expanded={moreOpen} aria-label="More sections"
          className={`relative flex flex-col items-center justify-center gap-0.5 h-full px-1 text-[10px] font-semibold cursor-pointer transition-colors ${tone(inOverflow || moreOpen, 'blue')}`}>
          <MoreHorizontal className="w-5 h-5 shrink-0" />
          <span>More</span>
          {inOverflow && <span className="absolute top-1.5 right-1/2 translate-x-3 w-1.5 h-1.5 rounded-full bg-blue-600" />}
        </button>}
      </div>
    </nav>
  );
}


