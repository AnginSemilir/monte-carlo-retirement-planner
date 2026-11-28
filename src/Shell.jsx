import { useState, useEffect } from 'react';
import App from './App.jsx';
import { useTheme } from './theme.jsx';
import { setNumberFormat, DEFAULT_NUMBER_FORMAT, NUMBER_FORMATS } from './App.jsx';
import { useViewport } from './viewport.js';
import { Boundary } from './boundary.jsx';

/*
 * THE SHELL: the one planner (the new planner, the app's only one since D155: the maintainer, 27 Nov 2026, "We don't need the
 * classic anymore, just the new one"; the Simple page and the way across between the two pages retired with the classic planner,
 * the quick start in the new planner standing where the Simple page stood), and the display preferences that outlive it: the
 * theme, the number convention and the viewport.
 */

// A display preference, not plan data, so it is not carried in an exported plan.
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
const FEEDBACK_REPO = 'AnginSemilir/monte-carlo-retirement-planner';
const FEEDBACK_BODY = [
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
 * The one line every visitor should see. The beta wording is the point: it asks people to treat the figures
 * as a draft, which is the honest framing while the model is still being checked.
 */
function Footer() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span>A beta, for education and illustration only &mdash; this is not financial advice. Everything is modelled and your plan stays in this browser.</span>
        {FEEDBACK_URL && (
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer noopener"
            className="inline-flex items-center min-h-11 font-semibold text-blue-600 hover:text-blue-800 hover:underline">{FEEDBACK_LABEL} &rarr;</a>
        )}
      </div>
    </div>
  );
}
export default function Shell() {
  /*
   * The shell owns the theme, the number convention and the viewport: display preferences every screen reads. The number
   * convention is applied during render rather than in an effect, because the formatter is module state read by a hundred call
   * sites that are not components: children render after this line, so they see it, whereas an effect would run after the
   * first paint and show one frame of the wrong convention.
   */
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [numFormat, setNumFormat] = useState(() => {
    try { const v = localStorage.getItem(NUM_FORMAT_KEY); return NUMBER_FORMATS[v] ? v : DEFAULT_NUMBER_FORMAT; }
    catch { return DEFAULT_NUMBER_FORMAT; }
  });
  setNumberFormat(numFormat);
  useEffect(() => { try { localStorage.setItem(NUM_FORMAT_KEY, numFormat); } catch { /* private mode */ } }, [numFormat]);
  const { isPhone, isCoarse, width, height } = useViewport();
  return (
    <>
      {/* One boundary round the planner, so a render error inside it leaves the page standing. */}
      <Boundary resetKey="full"><App theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} numFormat={numFormat} setNumFormat={setNumFormat}
        isPhone={isPhone} isCoarse={isCoarse} viewport={{ width, height }} /></Boundary>
      {/* Not on a phone: one line of small print, on the screen with the least room to spare. A desktop has the room. */}
      {!isPhone && <Footer />}
    </>
  );
}
