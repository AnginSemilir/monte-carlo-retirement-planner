/*
 * WHAT THE WORDS MEAN, WITHOUT SENDING ANYBODY TO THE DOCUMENTATION TAB.
 *
 * This planner is written in the vocabulary of UK retirement: GIA, NMPA, MPAA, PCLS, RNRB. Every one of
 * those is the right word - they are what the rules are called, and a page that said "the other account"
 * would be harder to check against anything official - but between them they are a wall to somebody who
 * has simply been paying into a workplace pension for twenty years.
 *
 * So each term keeps its name and gains a definition on hover. One sentence of what it stands for, one
 * of what it means for this plan. The Documentation tab still holds the long version; this is for the
 * moment you meet the word, which is the moment you want it explained.
 *
 * ONE TRIGGER, ONE BUBBLE: THE WORD ITSELF, ON EVERY DEVICE.
 *
 * The phone used to get a 24px "?" after the term instead of a tappable word, on the theory that a word
 * cannot advertise itself as a control. It could not be tapped at all: the global touch rule lifts every
 * button to 44px, so that "?" had a 44px-tall box inside a 20px line, the box overflowed into the block
 * below it, and the block - later in the document - painted on top. The visible glyph was not the hit
 * target, and a finger landed on whatever was behind it.
 *
 * So the word is the target everywhere, and it advertises itself the way a link does: a shimmering
 * underline, drawn as a moving gradient under the text rather than a text-decoration, since a decoration
 * cannot hold a gradient. Hover opens it on a desktop, a tap opens it under a finger, and both close on
 * Escape, on scroll, and on a tap outside.
 *
 * This is deliberately NOT the "?" that the rest of the app uses (`Fine` in phone.jsx). That one folds
 * out a paragraph of optional explanation in place. This one is a word that has a definition - a
 * different promise, so a different mark.
 *
 * The bubble is a portal to the body, positioned fixed. It has to be: half these terms sit inside table
 * cells and cards with their own `overflow`, and an absolutely positioned tooltip inside one of those is
 * clipped by it. Fixed coordinates from getBoundingClientRect are immune to that, at the cost of going
 * stale on scroll - so it closes on scroll rather than following.
 */
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PHONE_MAX, phoneLayout } from './viewport.js';

/*
 * The phone question on its own, rather than useViewport: that hook also follows width and height for
 * the chart boxes, so it re-renders on every resize event. A term only cares whether the breakpoint has
 * been crossed, and there can be twenty of them on a tab.
 */
const PHONE_Q = `(max-width: ${PHONE_MAX}px)`;
function useIsPhone() {
  // `phoneLayout` rather than the width alone, so a word behaves the same way here as the layout around
  // it does: a trackpad hovers to open, a finger taps.
  const [phone, setPhone] = useState(phoneLayout);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(PHONE_Q);
    const on = () => setPhone(phoneLayout());
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
}

export const GLOSSARY = {
  GIA: { title: 'General Investment Account',
    body: 'Any investments you hold outside an ISA or a pension. There is no limit on what you can put in, but gains are taxed when you sell and income is taxed as it arises.' },
  ISA: { title: 'Individual Savings Account',
    body: 'Paid in from money you have already been taxed on, and free of UK tax on growth, income and withdrawal. £20,000 a year across all your ISAs.' },
  'S&S ISA': { title: 'Stocks and Shares ISA',
    body: 'An ISA holding investments rather than cash. Same £20,000 yearly limit, same freedom from UK tax on the way out.' },
  SIPP: { title: 'Self-Invested Personal Pension',
    body: 'A personal pension you choose the investments in. Money in gets tax relief; money out is locked until the pension access age.' },
  DB: { title: 'Defined Benefit pension',
    body: 'A pension that pays a set income for life, worked out from your salary and years of service — a final-salary or career-average scheme. It is income, not a pot you can draw from as you like.' },
  DC: { title: 'Defined Contribution pension',
    body: 'A pot of money you and your employer pay into. What it eventually pays depends on what it grows to and how you draw it — which is what this planner models.' },
  NMPA: { title: 'Normal Minimum Pension Age',
    body: 'The earliest you can touch a private pension: 55 today, rising to 57 in April 2028. Retiring before it means funding the gap from ISAs, a GIA or cash.' },
  MPAA: { title: 'Money Purchase Annual Allowance',
    body: 'Once you flexibly draw taxable income from a DC pension, the most you can pay back into pensions drops to £10,000 a year. Taking only tax-free cash does not trigger it.' },
  PCLS: { title: 'Pension Commencement Lump Sum',
    body: 'The tax-free cash from a pension — normally up to 25% of what you crystallise, and capped overall by the lump sum allowance.' },
  'tax-free cash': { title: 'Tax-free cash (PCLS)',
    body: 'Normally up to 25% of a pension, taken free of income tax. Capped overall by the lump sum allowance, currently £268,275.' },
  UFPLS: { title: 'Uncrystallised Funds Pension Lump Sum',
    body: 'Taking money straight out of an untouched pension, where each withdrawal is 25% tax free and 75% taxed as income — rather than separating the tax-free cash first.' },
  CGT: { title: 'Capital Gains Tax',
    body: 'Tax on the profit when you sell an investment held outside an ISA or pension. Nothing is charged on gains still unrealised at death.' },
  CPI: { title: 'Consumer Prices Index',
    body: 'The official measure of inflation. Every figure here is in today’s money, so CPI only affects the nominal series shown for comparison.' },
  CAGR: { title: 'Compound Annual Growth Rate',
    body: 'The single steady yearly rate that would take you from the starting value to the ending one. A smooth stand-in for returns that were anything but.' },
  IHT: { title: 'Inheritance Tax',
    body: '40% on whatever is left above the allowances when an estate passes on. Anything passing to a spouse or civil partner is exempt.' },
  NRB: { title: 'Nil-Rate Band',
    body: 'The first £325,000 of an estate, taxed at 0%. Unused band can transfer to a surviving spouse, so a couple can have £650,000 between them.' },
  RNRB: { title: 'Residence Nil-Rate Band',
    body: 'A further £175,000 when a home passes to children or grandchildren. It tapers away by £1 for every £2 the estate exceeds £2m.' },
  QSR: { title: 'Quick Succession Relief',
    body: 'Relief where the same money is hit by Inheritance Tax twice within five years. It falls by 20 percentage points for each year that passes.' },
  'Monte Carlo': { title: 'Monte Carlo simulation',
    body: 'Running the plan thousands of times over randomly drawn market returns and counting how often it lasts, rather than assuming one smooth rate.' },
  percentile: { title: 'Percentile',
    body: 'A rank out of a hundred. The 10th percentile is the outcome only one run in ten falls below; the 90th is the one only one in ten beats.' },
  drawdown: { title: 'Drawdown',
    body: 'Taking income by selling from your pot as you go, rather than buying a guaranteed income. Your money stays invested and the risk stays yours.' },
  decumulation: { title: 'Decumulation',
    body: 'The spending-down half of a plan, after the paying-in half. It is a different problem: the order you sell things in starts to matter as much as what you own.' },
  SWR: { title: 'Safe Withdrawal Rate',
    body: 'The share of the pot you could take in the first year, rising with inflation after that, without running out over the plan. The famous figure is 4%; this planner works it out for your plan instead.' },
  annuity: { title: 'Annuity',
    body: 'An insurance contract that turns a pot into a guaranteed income for life. It removes the risk of running out, and with it the chance of anything being left.' },
  volatility: { title: 'Volatility',
    body: 'How far returns bounce around from year to year, as a standard deviation. Two portfolios with the same average return can be very different plans.' },
  'sequence risk': { title: 'Sequence-of-returns risk',
    body: 'The risk from when bad years land rather than whether they do. A crash in the first years of drawing down does far more damage than the same crash later on.' },
  'today’s money': { title: 'Today’s money (real terms)',
    body: 'Figures with inflation stripped out, so £40,000 at 80 buys what £40,000 buys today. It is what makes a number forty years out mean anything.' },
  'Bed & SIPP': { title: 'Bed and SIPP',
    body: 'Selling investments held outside a pension and paying the proceeds in, to pick up the tax relief. The gain on the sale is realised, so it can cost Capital Gains Tax to save income tax.' },
  'annual allowance': { title: 'Pension annual allowance',
    body: 'The most that can go into pensions in a tax year with tax relief — £60,000 for most people, tapered for high earners, and replaced by the MPAA once you flexibly draw.' },
  'gross salary': { title: 'Gross salary',
    body: 'Pay before income tax and National Insurance \u2014 what the contract says, not what lands in the bank. It is asked for two reasons: it caps the pension contributions that can attract tax relief, and the take-home pay behind it is what funds the years before retirement. Self-employed? Set the employment type under Advanced and this becomes your trading profit, which is relieved differently.' },
  'living spend': { title: 'Net living spend',
    body: 'What the household wants to spend in a year once it has stopped work, after tax, drawn from the first retirement onwards. A partner still working offsets it with their take-home pay when a salary is entered.' },
  'minimum pot': { title: 'Minimum pot (bequest floor)',
    body: 'What must still be there at the final age, tested at that age only rather than every year. It is in today\u2019s money, so \u00a3100,000 here means \u00a3100,000 of today\u2019s purchasing power and needs no grossing up for inflation.' },
  bridge: { title: 'The bridge',
    body: 'The years between stopping work and the pension unlocking, funded from ISAs, a GIA and cash. A plan can hold plenty and still fail here, because the money is in the wrong place.' }
};

// Set by a container that cannot hold a button - a <summary> - so the term renders as its word alone.
export const TermPlain = createContext(false);

/*
 * THE BUBBLE, SHARED.
 *
 * Both the glossary word and the odd one-off note (the simple page's spending taper) want the same
 * thing: a short title and a sentence or two, anchored to a word, over the top of whatever the word sits
 * inside. This holds the position and the dismissal rules; the callers supply the trigger and the text.
 *
 * The portal is not decoration. Half these words sit inside table cells and cards with their own
 * `overflow`, and an absolutely positioned bubble inside one of those is clipped by it. Fixed
 * coordinates from getBoundingClientRect are immune, at the cost of going stale on scroll - so it closes
 * on scroll rather than following.
 */
function useBubble() {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  useEffect(() => {
    if (!box) return undefined;
    const shut = () => setBox(null);
    const key = (e) => { if (e.key === 'Escape') setBox(null); };
    window.addEventListener('scroll', shut, true);
    window.addEventListener('resize', shut);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('scroll', shut, true);
      window.removeEventListener('resize', shut);
      window.removeEventListener('keydown', key);
    };
  }, [box]);
  const open = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const W = 280, M = 8;
    // centred on the word, then pulled back inside the window rather than hanging off the edge
    const left = Math.min(Math.max(M, r.left + r.width / 2 - W / 2), Math.max(M, window.innerWidth - W - M));
    const below = r.top < 150;   // no room above: flip under the word instead
    setBox({ left, top: below ? r.bottom + 8 : r.top - 8, below, W });
  };
  return { ref, box, open, close: () => setBox(null) };
}

/*
 * The trigger and its bubble. `sticky` is the touch behaviour - a backdrop that dismisses, and a close
 * button in the bubble - and it is on whenever there is no hover to close the bubble for us.
 */
function Bubble({ id, title, body, box, close, sticky }) {
  return (
    <>
      {sticky && createPortal(
        <span role="presentation" onClick={close} className="fixed inset-0 z-[57]" />, document.body)}
      {createPortal(
        /* z-58: above the fullscreen chart at 55, below the in-app editor's dev chrome at 60. */
        <span role="tooltip" id={id}
          style={{ left: box.left, top: box.top, width: box.W, transform: box.below ? undefined : 'translateY(-100%)' }}
          className={`fixed z-[58] ${sticky ? '' : 'pointer-events-none'} rounded-lg bg-surface border border-slate-300 shadow-lg px-3 py-2`}>
          <span className="block text-[12px] font-bold text-slate-900 leading-snug pr-6">{title}</span>
          <span className="block text-[12px] text-slate-600 leading-snug mt-0.5">{body}</span>
          {sticky && (
            <button type="button" onClick={close} aria-label="Close"
              className="absolute top-0 right-0 w-9 h-9 flex items-center justify-center text-slate-400 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </span>,
        document.body)}
    </>
  );
}

/*
 * `k` is the glossary key; the children are what is shown, so the same entry can be reached from "GIA",
 * "a GIA" or "General Investment Account" without three copies of the definition. An unknown key renders
 * as plain text rather than throwing, because a typo in a label should not take a tab down.
 */
export function Term({ k, isPhone, children }) {
  const entry = GLOSSARY[k];
  const plain = useContext(TermPlain);
  const { ref, box, open, close } = useBubble();
  const id = useId();
  const phone = useIsPhone();
  const off = isPhone === undefined ? phone : isPhone;

  if (!entry || plain) return <>{children ?? k}</>;

  return (
    <span className="whitespace-normal">
      {/*
        * `term-link` carries the shimmering underline and, with `inline-control`, opts out of the
        * global 44px touch floor: a definition inside a sentence is text with a meaning, not a control
        * on its own line, and a 44px box in the middle of a paragraph is what broke this before.
        */}
      <button ref={ref} type="button" data-term={k} aria-expanded={!!box}
        aria-describedby={box ? id : undefined} aria-label={`What is ${entry.title}?`}
        onMouseEnter={off ? undefined : open} onMouseLeave={off ? undefined : close}
        onFocus={off ? undefined : open} onBlur={off ? undefined : close}
        /* Where there is hover, a click must not undo what the hover just did: the pointer arriving
           opens the bubble, so a toggle here would close it the instant somebody clicked the word. */
        onClick={() => (off ? (box ? close() : open()) : open())}
        className="term-link inline-control inline p-0 m-0 bg-transparent border-0 text-inherit text-left cursor-pointer">
        {children ?? k}
      </button>
      {box && <Bubble id={id} title={entry.title} body={entry.body} box={box} close={close} sticky={off} />}
    </span>
  );
}

/*
 * The same affordance for a note that is not a glossary word: a phrase that names an explanation, which
 * opens in the same bubble. Used where the alternative would be a paragraph of small print sitting under
 * a field forever - the simple page's spending taper is the case it was built for.
 */
export function Hint({ label, title, children, isPhone }) {
  const { ref, box, open, close } = useBubble();
  const id = useId();
  const phone = useIsPhone();
  const off = isPhone === undefined ? phone : isPhone;
  return (
    <span className="whitespace-normal">
      <button ref={ref} type="button" data-hint aria-expanded={!!box} aria-describedby={box ? id : undefined}
        onMouseEnter={off ? undefined : open} onMouseLeave={off ? undefined : close}
        onFocus={off ? undefined : open} onBlur={off ? undefined : close}
        /* Where there is hover, a click must not undo what the hover just did: the pointer arriving
           opens the bubble, so a toggle here would close it the instant somebody clicked the word. */
        onClick={() => (off ? (box ? close() : open()) : open())}
        className="term-link inline-control inline p-0 m-0 bg-transparent border-0 text-inherit text-left cursor-pointer">
        {label}
      </button>
      {box && <Bubble id={id} title={title ?? label} body={children} box={box} close={close} sticky={off} />}
    </span>
  );
}
