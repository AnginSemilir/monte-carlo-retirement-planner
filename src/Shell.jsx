import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import App from './App.jsx';
import Simple from './Simple.jsx';

/*
 * ONE ENTRANCE, TWO APPS.
 *
 * The shell owns the switch and nothing else. Neither App nor Simple imports the other or knows this
 * exists, which is what makes the eventual split a deletion rather than an untangling: point two builds
 * at the two components and this file goes away.
 *
 * The switch sits ABOVE the header, outside the tab bar. Inside it, it would read as a ninth tab and
 * behave like one - the whole point is that it changes which application you are in, not which view of
 * one you are looking at.
 */

const KEY = 'rp_which_app';

/*
 * WHERE FEEDBACK GOES.
 *
 * Blank ships no link at all rather than a dead one; anything else - a form, a thread, a mailbox -
 * appears as a footer line in both apps.
 *
 * This is a mailbox, by choice, and the trade that comes with it is real: an address on a public page
 * is an address that gets scraped, and no amount of obfuscation reliably prevents that. Swapping this
 * one line for a form URL is the whole of changing your mind later. The subject line is prefilled so
 * beta replies sort themselves out of an inbox.
 */
const FEEDBACK_URL = 'mailto:forwardsamuel@gmail.com?subject=Retirement%20planner%20feedback';
const FEEDBACK_LABEL = 'Tell me what broke';

/*
 * The one line every visitor should see, in both apps. The beta wording is the point: it asks people to
 * treat the figures as a draft, which is the honest framing while the model is still being checked, and
 * it is the same sentence in both apps so neither looks more finished than the other.
 */
function Footer() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span>A beta. Everything is modelled, nothing is advice, and your figures stay in this browser.</span>
        {FEEDBACK_URL && (
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer noopener"
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">{FEEDBACK_LABEL} &rarr;</a>
        )}
      </div>
    </div>
  );
}
const OTHER = {
  full: { to: 'simple', lead: 'Just want the answer?', cta: 'Open the simple version' },
  simple: { to: 'full', lead: 'Need the full model?', cta: 'Open the full planner' }
};

export default function Shell() {
  const [which, setWhich] = useState(() => {
    try { return localStorage.getItem(KEY) === 'simple' ? 'simple' : 'full'; } catch { return 'full'; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, which); } catch { /* private mode */ } }, [which]);

  const other = OTHER[which];

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <button type="button" onClick={() => setWhich(other.to)}
            className="w-full group flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-5 py-3 rounded-2xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 hover:border-blue-300 transition-colors cursor-pointer">
            <span className="text-sm text-blue-900/80">{other.lead}</span>
            <span className="text-sm font-bold text-blue-800 group-hover:text-blue-900 flex items-center gap-1.5">
              {other.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </div>

      {which === 'full' ? <App /> : (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
          <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Can I retire?</h1>
            </div>
            <Simple />
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl">
              For educational and illustrative purposes only. This is not financial advice. Figures come from the same
              engine as the full planner, so the two agree on the same inputs.
            </p>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
