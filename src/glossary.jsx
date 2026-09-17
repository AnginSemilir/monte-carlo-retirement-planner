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
 * DESKTOP ONLY, and not as a hedge: a tooltip needs a pointer that can rest somewhere without pressing
 * it. On a phone there is no hover, a tap would fight the control underneath, and the same explanations
 * are already one tap away behind the "?" folds. So on a phone `Term` renders its text and nothing else
 * - no button, no underline, no target to miss.
 *
 * The bubble is a portal to the body, positioned fixed. It has to be: half these terms sit inside table
 * cells and cards with their own `overflow`, and an absolutely positioned tooltip inside one of those is
 * clipped by it. Fixed coordinates from getBoundingClientRect are immune to that, at the cost of going
 * stale on scroll - so it closes on scroll rather than following.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PHONE_MAX } from './viewport.js';

/*
 * The phone question on its own, rather than useViewport: that hook also follows width and height for
 * the chart boxes, so it re-renders on every resize event. A term only cares whether the breakpoint has
 * been crossed, and there can be twenty of them on a tab.
 */
const PHONE_Q = `(max-width: ${PHONE_MAX}px)`;
function useIsPhone() {
  const [phone, setPhone] = useState(() => (typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(PHONE_Q).matches : false));
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(PHONE_Q);
    const on = () => setPhone(mq.matches);
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
  bridge: { title: 'The bridge',
    body: 'The years between stopping work and the pension unlocking, funded from ISAs, a GIA and cash. A plan can hold plenty and still fail here, because the money is in the wrong place.' }
};

/*
 * `k` is the glossary key; the children are what is shown, so the same entry can be reached from "GIA",
 * "a GIA" or "General Investment Account" without three copies of the definition. An unknown key renders
 * as plain text rather than throwing, because a typo in a label should not take a tab down.
 */
export function Term({ k, isPhone, children }) {
  const entry = GLOSSARY[k];
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  const id = useId();
  const phone = useIsPhone();
  const off = isPhone === undefined ? phone : isPhone;

  useEffect(() => {
    if (!box) return;
    // Fixed coordinates go stale the moment anything moves, so the bubble closes rather than drifts.
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

  if (!entry || off) return <>{children ?? k}</>;

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

  return (
    // The span is the anchor AND the inline exception the 24px rule is measured by: a definition inside a
    // sentence is text, not a control, and stretching it to 24px would break the line it sits in.
    <span className="whitespace-normal">
      <button ref={ref} type="button" data-term={k} aria-describedby={box ? id : undefined}
        onMouseEnter={open} onMouseLeave={() => setBox(null)}
        onFocus={open} onBlur={() => setBox(null)}
        onClick={() => (box ? setBox(null) : open())}
        className="inline p-0 m-0 bg-transparent border-0 border-b border-dotted border-slate-400 cursor-help text-inherit">
        {children ?? k}
      </button>
      {box && createPortal(
        /* z-58: above the fullscreen chart at 55, below the in-app editor's dev chrome at 60. */
        <span role="tooltip" id={id}
          style={{ left: box.left, top: box.top, width: box.W, transform: box.below ? undefined : 'translateY(-100%)' }}
          className="fixed z-[58] pointer-events-none rounded-lg bg-surface border border-slate-300 shadow-lg px-3 py-2">
          <span className="block text-[12px] font-bold text-slate-900 leading-snug">{entry.title}</span>
          <span className="block text-[12px] text-slate-600 leading-snug mt-0.5">{entry.body}</span>
        </span>,
        document.body)}
    </span>
  );
}
