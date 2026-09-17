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
import { Children, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';

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
 * A REFERENCE SECTION, FOLDED ON A PHONE.
 *
 * The Documentation tab is eleven cards of prose - the right thing on a desktop, where it sits beside
 * the app it documents. On a phone it is one seven-thousand-pixel scroll, and finding the section you
 * wanted means flicking past ten you did not.
 *
 * Each card keeps its heading visible and folds its body. The heading is simply the FIRST child, which
 * every one of these cards already leads with, so nothing had to be restructured to adopt this - and a
 * card that ever stops leading with its heading will show that immediately rather than silently.
 *
 * Native <details> again: the body stays in the DOM, so find-in-page and screen readers still reach it.
 */
export function PhoneCollapse({ isPhone, children }) {
  if (!isPhone) return children;
  const kids = Children.toArray(children);
  if (kids.length < 2) return children;
  return (
    <details>
      <summary className="cursor-pointer list-none min-h-11 flex items-center justify-between gap-2">
        {kids[0]}
        <span aria-hidden="true" className="text-slate-400 text-xs shrink-0">&#9662;</span>
      </summary>
      <div className="space-y-3 pt-3">{kids.slice(1)}</div>
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
    <div data-no-swipe ref={ref} data-sandbox-sheet data-mode={mode}
      className={`fixed inset-x-0 bg-surface border-t border-slate-200 rounded-t-2xl shadow-lg md:hidden ${full_ ? 'z-50 top-[8dvh] bottom-0 flex flex-col' : 'z-[45]'}`}
      style={full_ ? { paddingBottom: 'env(safe-area-inset-bottom)' } : { bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}>
      <button type="button" onClick={cycle} onPointerDown={onDown} onPointerUp={onUp}
        aria-expanded={mode !== 'collapsed'} aria-label={mode === 'collapsed' ? 'Open the sandbox controls' : 'Close the sandbox controls'}
        className="w-full min-h-11 flex flex-col items-center justify-center gap-1 cursor-pointer shrink-0 touch-none">
        <span className="h-1 w-10 rounded-full bg-slate-300" />
        {/* `summary` may be a node, not a string: the sandbox puts a spinner in it, and truncate on the
            wrapper would clip that off rather than the text. The node does its own truncating. */}
        {mode === 'collapsed' && <span className="text-[11px] text-slate-600 px-3 min-w-0 max-w-full">{summary}</span>}
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

/*
 * ONE FIELD, ONE ROW: LABEL LEADING, CONTROL TRAILING.
 *
 * The densest form shape a phone still reads is the one its own settings screens use - a label on the
 * left, the control on the right, one row per field, a hairline between rows. The alternative this
 * replaces was a desktop grid collapsing to one column: label above, a half-width input, and a seven-line
 * helper paragraph beside it. NN/g's finding is that labels should be visible and short; the helper is
 * the part that does not need to be visible until asked.
 *
 * So `hint` is a "?" that opens the explanation under the row. The button is 44px tall for a finger and
 * draws a 24px ring inside, so the hit area and the picture are sized for different jobs. Everything
 * stays in the DOM, as with every other fold on the phone.
 */
export function FieldRow({ label, hint, wide = false, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 min-h-11 py-0.5">
        <label className="flex-1 min-w-0 text-[13px] font-semibold text-slate-700 leading-tight">{label}</label>
        {hint && (
          <button type="button" aria-label={`About ${typeof label === 'string' ? label : 'this field'}`} aria-expanded={open}
            onClick={() => setOpen(v => !v)} className="min-w-11 h-11 flex items-center justify-center shrink-0 cursor-pointer">
            <span className={`w-6 h-6 rounded-full border text-[11px] font-bold flex items-center justify-center ${open ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-slate-300 text-slate-500'}`}>?</span>
          </button>
        )}
        <div className={`shrink-0 ${wide ? 'w-[184px]' : 'w-[152px]'} flex items-center justify-end gap-1`}>{children}</div>
      </div>
      {hint && open && <p className="text-[11px] text-slate-500 leading-relaxed pb-2.5 pr-1">{hint}</p>}
    </div>
  );
}

/*
 * SIX CHOICES, ALL VISIBLE, IN A GRID.
 *
 * Baymard's rule for a small set of mutually exclusive options is to show them all rather than hide
 * them in a drop-down, and Apple's is that a segmented control stops working at about five. The risk
 * tier has six, so it is a grid of chips three across, each a 44px target, in a radiogroup so a screen
 * reader hears one question with six answers rather than six buttons. The native select it replaces was
 * 410px wide inside a sideways-scrolling table, off the right edge of the screen.
 */
export function RiskChips({ name, value, options, onChange, collapsible = false }) {
  /*
   * Folded behind the current choice when asked. Six chips are the right control but they are two
   * rows per wrapper, and four wrappers of that put the Money section back over 2,200px. A balance is
   * edited often and a tier rarely, so the tier shows as one row naming what is set and opens the grid
   * on a tap; the grid closes again once a chip is chosen.
   */
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.key === value);
  if (collapsible && !open) {
    return (
      <button type="button" aria-haspopup="true" aria-expanded={false} onClick={() => setOpen(true)} data-risk-summary
        className="w-full min-h-11 flex items-center justify-between gap-2 cursor-pointer text-left">
        <span className="text-[13px] font-semibold text-slate-700">{name}</span>
        <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
          {current ? current.title : value}{current && current.sub ? <span className="font-medium opacity-80">{current.sub}</span> : null}
          <span aria-hidden="true" className="text-slate-400">&#9662;</span>
        </span>
      </button>
    );
  }
  const choose = (k) => { onChange(k); if (collapsible) setOpen(false); };
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-3 gap-1.5">
      {options.map(o => {
        const on = o.key === value;
        return (
          <button key={o.key} type="button" role="radio" aria-checked={on} title={o.long || o.title}
            onClick={() => choose(o.key)}
            className={`min-h-11 px-1.5 py-1 rounded-lg border text-center leading-tight cursor-pointer transition-colors ${
              on ? 'bg-blue-50 border-blue-600 text-blue-800' : 'bg-surface border-slate-200 text-slate-600'}`}>
            <span className="block text-xs font-bold">{o.title}</span>
            {o.sub && <span className="block text-[10px] font-medium opacity-80">{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

/*
 * A STEPPER FOR THE FEW NUMBERS THAT MOVE BY ONE.
 *
 * NN/g's rule: steppers suit a small range, roughly 0 to 10 steps. An age or a plan horizon moves by
 * one and is exactly that; a balance is not, and gets a keypad. Side by side, 44px tall for a finger,
 * beside the field rather than instead of it, so a big change is still typed.
 */
export function Stepper({ label, onDown, onUp }) {
  return (
    <span className="flex shrink-0">
      <button type="button" aria-label={`decrease ${label}`} onClick={onDown}
        className="w-9 h-11 flex items-center justify-center rounded-l-lg border border-slate-300 bg-slate-50 text-base text-slate-600 cursor-pointer active:bg-slate-200">&minus;</button>
      <button type="button" aria-label={`increase ${label}`} onClick={onUp}
        className="w-9 h-11 flex items-center justify-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 text-base text-slate-600 cursor-pointer active:bg-slate-200">+</button>
    </span>
  );
}

/*
 * ONE ITEM OF A LIST, AS ONE LINE UNTIL YOU TAP IT.
 *
 * A spending band is three numbers, an income stream is six fields. Laid out open, every item is a
 * card of controls and a list of four is a screen and a half of them, most of which nobody is editing.
 * Closed, an item is one line that says what it is - "Age 80 to 100, £40,000, 21 years" - with the
 * remove button on the right; tapping the line opens its fields underneath. An item with nothing in it
 * yet is opened by its caller, because there is nothing to summarise.
 */
export function CollapsedRow({ summary, sub, open, onToggle, onDelete, deleteLabel = 'Remove', warn = false, children }) {
  return (
    <div data-collapsed-row data-open={open ? 'true' : 'false'} className={`rounded-lg border ${warn ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200 bg-slate-50/60'}`}>
      <div className="flex items-center">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex-1 min-w-0 min-h-11 px-3 text-left cursor-pointer">
          <span className={`block text-[13px] font-semibold truncate ${warn ? 'text-rose-800' : 'text-slate-800'}`}>{summary}</span>
          {sub && <span className={`block text-[11px] truncate ${warn ? 'text-rose-700' : 'text-slate-500'}`}>{sub}</span>}
        </button>
        {onDelete && (
          <button type="button" aria-label={deleteLabel} onClick={onDelete}
            className="min-w-11 h-11 flex items-center justify-center text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
      {open && <div className="px-3 pb-1.5 border-t border-slate-200/70">{children}</div>}
    </div>
  );
}

/*
 * A PARAGRAPH CUT TO ITS FIRST FEW LINES, ON A PHONE.
 *
 * The explanatory paragraphs on this app are written to be read once and then never again: what the
 * tournament does, what each projection step is showing. At desktop width they are three or four lines
 * under a heading. At 390px the same words are eight, and they sit between you and the control you came
 * for every single time you open the tab.
 *
 * So on a phone they show their first two lines and end in an ellipsis - the browser's own, from
 * line-clamp - with one button to open the rest. Nothing is removed: the whole paragraph is in the DOM,
 * find-in-page reaches it, and a screen reader reads it in full.
 *
 * The clamp classes are written out rather than built, because Tailwind generates what it can see.
 */
const CLAMP = { 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4' };

/*
 * The markup is spans, not divs, because every one of these paragraphs is a <p>: the clamp has to go on
 * an element whose children are text, or -webkit-line-clamp has nothing to count, and a <div> inside a
 * <p> is invalid HTML that the browser silently closes the paragraph around.
 */
export function Clamp({ isPhone, lines = 2, label = 'Read more', children }) {
  const [open, setOpen] = useState(false);
  if (!isPhone) return children;
  return (
    <>
      {/* no `block` alongside the clamp: `line-clamp-*` sets `display:-webkit-box`, and a display
          utility next to it wins the cascade and quietly turns the clamp off */}
      <span className={open ? 'block' : (CLAMP[lines] || CLAMP[2])}>{children}</span>
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}
        className="min-h-11 flex items-center text-xs font-bold text-blue-700 cursor-pointer">
        {open ? 'Show less' : label}
      </button>
    </>
  );
}
