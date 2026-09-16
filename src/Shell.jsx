import { useState, useEffect } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import App from './App.jsx';
import Simple from './Simple.jsx';
import { toFullPlan, fromFullPlan, simpleHasInput, SIMPLE_BLANK } from './simplePlan.js';
import { useTheme, ThemeToggle } from './theme.jsx';

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
 * WHERE FEEDBACK GOES: A PREFILLED GITHUB ISSUE.
 *
 * A form rather than a mailbox, because an address on a public page gets scraped and no obfuscation
 * reliably prevents it. This particular form because the repository is public and already has issues:
 * no third-party service, nothing to keep signed up for, and a report can be replied to in the place
 * the fix will happen. The cost is honest and worth stating - it needs a GitHub account, which plenty
 * of people reading about pensions will not have - so the link says GitHub rather than springing it.
 *
 * Prefilled through the query string rather than an issue TEMPLATE, because GitHub only reads
 * .github/ISSUE_TEMPLATE from a repository's default branch. The query string works from any branch,
 * today. If this ever lands on the default branch, a template is the better home for these prompts.
 *
 * The warning in the body is the important line. This is a retirement planner: the inputs ARE somebody's
 * finances, an issue is public and permanent, and the natural way to report a bug is to paste what you
 * typed in. Asking for rounded figures up front costs nothing and is far easier than deleting a comment
 * that has already been indexed.
 */
const FEEDBACK_REPO = 'hapsariandforward/monte-carlo-retirement-planner';
const FEEDBACK_BODY = [
  '**Which version were you using?** The simple page, or the full planner?',
  '',
  '**What happened?**',
  '',
  '**What did you expect instead?**',
  '',
  '**Browser and device** (if it looked wrong rather than read wrong):',
  '',
  '---',
  '',
  'Please keep the figures rounded — this issue is public and permanent. "A pot around £500k, retiring',
  'at 60" is enough to reproduce almost anything; real balances and dates of birth are not needed.'
].join('\n');
const FEEDBACK_URL = `https://github.com/${FEEDBACK_REPO}/issues/new`
  + `?title=${encodeURIComponent('Beta feedback: ')}&body=${encodeURIComponent(FEEDBACK_BODY)}`;
const FEEDBACK_LABEL = 'Report a problem on GitHub';

/*
 * The one line every visitor should see, in both apps. The beta wording is the point: it asks people to
 * treat the figures as a draft, which is the honest framing while the model is still being checked, and
 * it is the same sentence in both apps so neither looks more finished than the other.
 */
function Footer() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span>A beta, for education and illustration only &mdash; this is not financial advice. Everything is modelled, every figure is in today&rsquo;s money, and your plan stays in this browser.</span>
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

/*
 * CROSSING OVER WITHOUT RETYPING ANYTHING.
 *
 * The two pages keep separate saved plans, which is right - they are different applications and one is
 * not a view of the other. But a visitor who fills in the simple page and then wants the full model was
 * being handed a blank form, and the same in reverse, which makes the switch a punishment for having
 * explored.
 *
 * So the switch carries the plan across, through the adapters in simplePlan.js. Three rules keep that
 * honest:
 *
 *   1 NEVER OVERWRITE WORK WITH A BLANK. If the page being left has nothing typed in it, nothing is
 *     written. Otherwise pressing the button twice on a fresh visit would wipe a saved plan.
 *   2 SAY WHAT DID NOT FIT. Going down from the full planner is lossy - it holds spending bands, income
 *     streams and a whole Config tab the small page has nowhere to put. The adapter returns that list
 *     and the banner shows it, rather than letting figures vanish quietly.
 *   3 THE PLAN LEFT BEHIND IS NOT TOUCHED. Each page keeps its own key, so switching back and forth
 *     never destroys the version you came from.
 */
const FULL_KEY = 'rp_plan_full_v28';
const SIMPLE_KEY = 'rp_simple_v1';
const readKey = (k) => { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; } catch { return null; } };
const writeKey = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

function carryAcross(from) {
  try {
    if (from === 'simple') {
      const s = readKey(SIMPLE_KEY);
      if (!simpleHasInput(s)) return null;
      writeKey(FULL_KEY, toFullPlan(s));
      return { to: 'full', dropped: [] };
    }
    const plan = readKey(FULL_KEY);
    if (!plan || !plan.accounts) return null;
    const { simple, dropped } = fromFullPlan(plan, { ...SIMPLE_BLANK, ...(readKey(SIMPLE_KEY) || {}) });
    if (!simpleHasInput(simple)) return null;
    writeKey(SIMPLE_KEY, simple);
    return { to: 'simple', dropped };
  } catch {
    return null;   // a corrupt saved plan must not stop somebody changing pages
  }
}

export default function Shell() {
  const [which, setWhich] = useState(() => {
    try { return localStorage.getItem(KEY) === 'simple' ? 'simple' : 'full'; } catch { return 'full'; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, which); } catch { /* private mode */ } }, [which]);

  /*
   * The shell owns the theme, because the switch below unmounts whichever app is not showing and the
   * preference has to outlive that. Both pages are painted from the same CSS variables, so both get the
   * same control: the full planner renders it in its header from these props, the simple page beside
   * its own heading.
   */
  const { theme, setTheme } = useTheme();
  const other = OTHER[which];
  // what the last crossing could not bring with it, shown once on arrival
  const [carried, setCarried] = useState(null);
  const cross = () => { setCarried(carryAcross(which)); setWhich(other.to); };

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-2">
          <button type="button" onClick={cross}
            className="w-full group flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-5 py-3 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 hover:border-blue-300 transition-colors cursor-pointer">
            <span className="text-sm text-blue-900/80">{other.lead}</span>
            <span className="text-sm font-bold text-blue-800 group-hover:text-blue-900 flex items-center gap-1.5">
              {other.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
          {carried && carried.to === which && (
            <div className="flex items-start gap-2 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
              <Info className="w-4 h-4 shrink-0 mt-px text-amber-700" />
              <div className="min-w-0">
                <strong className="font-semibold">Your figures came with you.</strong>{' '}
                {carried.dropped.length === 0
                  ? 'Everything the simple page holds is now in the full planner, and the simple version is still saved as you left it.'
                  : <>The full planner holds more than this page can, so these stayed behind and are still saved there: {carried.dropped.join('; ')}.</>}
                <button type="button" onClick={() => setCarried(null)} className="ml-2 font-semibold underline hover:text-amber-950 cursor-pointer">Got it</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {which === 'full' ? <App theme={theme} setTheme={setTheme} /> : (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
          <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Can I retire?</h1>
              <ThemeToggle theme={theme} setTheme={setTheme} />
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
