import { useState, useEffect, lazy, Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import App from './App.jsx';
/*
 * ONLY ONE OF THESE PAGES IS EVER ON SCREEN, SO ONLY ONE NEEDS DOWNLOADING.
 *
 * The full planner is what most arrivals get, and it was carrying the streamlined page's entire interface
 * with it for nothing. Loading it on demand takes that out of the first download; it arrives while
 * somebody is reading the banner they just clicked.
 *
 * The full planner is NOT lazy, deliberately. It is the default page, so deferring it would only add a
 * round trip before the thing most people came for, and this file imports the number formatter from it
 * anyway, which would pin it into the first chunk regardless. The streamlined page imports the same
 * engine, so what moves out is its own interface rather than the shared arithmetic.
 */
const Simple = lazy(() => import('./Simple.jsx'));
import { toFullPlan, fromFullPlan, simpleHasInput, SIMPLE_BLANK } from './simplePlan.js';
import { useTheme, ThemeToggle } from './theme.jsx';
import { setNumberFormat, DEFAULT_NUMBER_FORMAT, NUMBER_FORMATS } from './App.jsx';
import { useViewport } from './viewport.js';

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
// Beside the theme's key, and for the same reason: a display preference, not plan data, so it is not
// carried in an exported plan and does not differ between the two pages.
const NUM_FORMAT_KEY = 'rp_number_format_v1';

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
            className="inline-flex items-center min-h-11 font-semibold text-blue-600 hover:text-blue-800 hover:underline">{FEEDBACK_LABEL} &rarr;</a>
        )}
      </div>
    </div>
  );
}
/*
 * THE CHAIN ACROSS THE TOP, ON A PHONE.
 *
 * One 44px row: which planner you are in, and the way to the other one. It replaces a 60px blue banner
 * that said the same thing in a sentence ("Just want the answer? Open the simple version") plus, on the
 * full planner's Start Here, a 79px card that said the app's name a second time.
 *
 * `extra` is for what a page has nowhere else to put: the simple page has no More sheet, so its theme
 * control rides here. The full planner's theme stays in More, because this bar scrolls away with the
 * page there and a setting you cannot reach from tab six is worse than a setting one tap in.
 */
function PhoneBar({ title, cta, onCross, extra = null }) {
  return (
    <header data-phone-bar className="shrink-0 flex items-center gap-1 pl-3 pr-1 h-11 bg-surface border-b border-slate-200">
      <span className="text-[13px] font-bold tracking-tight text-slate-900">{title}</span>
      <span className="flex-1" />
      {extra}
      <button type="button" onClick={onCross} data-crossover
        className="min-h-11 px-2 flex items-center gap-1 text-xs font-bold text-blue-700 cursor-pointer whitespace-nowrap">
        {cta} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </header>
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  /*
   * One viewport subscription for the whole app, for the same reason the theme is owned here: the switch
   * below unmounts whichever app is not showing, and two components each listening to the same media
   * query is two chances to disagree about what a phone is.
   */
  /*
   * The number convention is owned here for the same reason as the theme: it is a display preference that
   * has to outlive the switch below unmounting whichever app is not showing, and both pages have to agree
   * about it or a figure would read one way on one page and another way on the other.
   *
   * Applied during render rather than in an effect, because the formatter is module state read by a
   * hundred call sites that are not components: children render after this line, so they see it, whereas
   * an effect would run after the first paint and show one frame of the wrong convention.
   */
  const [numFormat, setNumFormat] = useState(() => {
    try { const v = localStorage.getItem(NUM_FORMAT_KEY); return NUMBER_FORMATS[v] ? v : DEFAULT_NUMBER_FORMAT; }
    catch { return DEFAULT_NUMBER_FORMAT; }
  });
  setNumberFormat(numFormat);
  useEffect(() => { try { localStorage.setItem(NUM_FORMAT_KEY, numFormat); } catch { /* private mode */ } }, [numFormat]);

  const { isPhone, isCoarse, width, height } = useViewport();
  const viewport = { width, height };
  const other = OTHER[which];
  // carryAcross is what copies the plan between the two pages; its return value (what could not come
  // along) used to be shown as a banner and is not any more. The copy still happens.
  const cross = () => { carryAcross(which); setWhich(other.to); };

  /*
   * THE SIMPLE PAGE ON A PHONE IS AN APP SCREEN, NOT A DOCUMENT.
   *
   * Everything else here scrolls: a page of chrome, then the content, then a footer. That is right for
   * the full planner, which has more to say than a screen holds however it is arranged. The simple page
   * does not - it is three tabs of one screen each - and a page that scrolls when it has no need to
   * makes every one of them feel half-finished, because you cannot tell by looking whether there is
   * something below the fold.
   *
   * So on a phone it is a fixed-height column: a 44px bar, the tab, the tab bar, and no document scroll
   * at all. The bar carries what the header used to - the name of the page, a way to the full planner,
   * and the theme as one cycling button - in the height the crossover banner alone used to take. The
   * page title goes: "Simple planner" beside "Full planner" says the same thing in the space of a line,
   * and the footer's beta notice moves to the foot of the Figures tab, beside the numbers it qualifies.
   */
  if (isPhone && which === 'simple') return (
    <div className="h-dvh flex flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <PhoneBar title="Simple planner" cta="Full planner" onCross={cross}
        extra={<ThemeToggle compact theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />} />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-slate-400">Loading&hellip;</div>}>
        <Simple isPhone={isPhone} isCoarse={isCoarse} viewport={viewport} />
      </Suspense>
    </div>
  );

  return (
    <>
      {/* The same chain the simple page carries, for the same reason: on a phone the banner was 60px of
          sentence above every tab, and the app's name was said again in a card under it. A desktop has
          the width for the sentence and keeps it. */}
      {isPhone ? (
        <PhoneBar title="Full planner" cta="Simple planner" onCross={cross} />
      ) : (
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-2">
          <button type="button" onClick={cross} data-crossover
            className="w-full group flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 hover:border-blue-300 transition-colors cursor-pointer flex-wrap gap-x-2.5 gap-y-1 px-5 py-3">
            <span className="text-sm text-blue-900/80">{other.lead}</span>
            <span className="text-sm font-bold text-blue-800 group-hover:text-blue-900 flex items-center gap-1.5">
              {other.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </div>
      )}

      {which === 'full' ? <App theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} numFormat={numFormat} setNumFormat={setNumFormat}
        isPhone={isPhone} isCoarse={isCoarse} viewport={viewport} /> : (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
          <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Can I retire?</h1>
              <ThemeToggle theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} touch={isPhone || isCoarse} />
            </div>
            {/* The fallback matches the card it replaces, so the page does not jump when it arrives. */}
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-400">Loading…</div>}>
              <Simple isPhone={isPhone} isCoarse={isCoarse} viewport={viewport} />
            </Suspense>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl">
              For educational and illustrative purposes only. This is not financial advice. Figures come from the same
              engine as the full planner, so the two agree on the same inputs.
            </p>
          </div>
        </div>
      )}
      {/* Not on a phone. It is one line of small print that was repeating under every one of eight tabs,
          on the screen with the least room to spare; the full planner says it once on Start Here and the
          simple page says it beside its figures. A desktop has the room and keeps it. */}
      {!isPhone && <Footer />}
    </>
  );
}
