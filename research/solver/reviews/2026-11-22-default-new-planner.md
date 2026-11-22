# Review before a change of default: the new planner by default (9e24f7a1)

Subject: commit 9e24f7a1 on ccr-1a3c603e-9i4qgs, "The new planner by default". The maintainer's word: "Switch the new solver from
beta to the default". Before it, `readPlanner` read anything other than `'new'` as the classic planner (R6, D52). D91 leaves
on-by-default to the maintainer, who has now ruled. The switch (`PLANNER_BETA`) stays.

## What I read

- The change (`git show 9e24f7a1`, blobs at 9e24f7a1):
  - `src/App.jsx` 7d067beba8e7: `readPlanner` and `plannerOn` (l.7214-7222), the planner state, `solverOn`, the first
    `activeTab` and `setPlanner` (l.8708-8723), `coupleState` and `solverRules` (l.8734-8735), the solve hook's hold (l.8755-8757),
    the quick start (l.16528), the headers (l.13364-13452) and the More sheet (l.16646);
  - `src/Shell.jsx` 2874d6a9f145: `which` (l.169-172), `newPlanner` and `shown` (l.212-214), the crossover bar (l.249);
  - `research/ui-harnesses/lib/classic-default.cjs` 3c2687723388, `solver-planner-ui.cjs` a695bb0bed76 (`open`, checks 13 to 16,
    the plants), `load-perf-ui.cjs` ee6af70e28db, `run-all.sh` 6983b19cb8f3, and the 21 one-line requires.
- Beside them: `src/useSolver.js` c9b94ff81c9f (l.37-87), `src/isolation.js` 201080b72d2f, `public/coi-sw.js`,
  `src/couplesSwitch.js` b33f855de049, `src/PlannerStart.jsx` c22db4d1e95c, `src/solverDiagnostic.js` 3d8a675161b0,
  `research/ui-harnesses/solver-fullscale-ui.cjs` bacd9b221b16, `research/solver/launch-ready.mjs` ca2e64dad74f, Playwright
  1.63.0's `Browser.newPage` (`/tmp/node_modules/playwright-core/lib/coreBundle.js` l.62751-62759), STATE.md (the
  decided-defaults block, R6 in D52, D91).
- Run (Node only, as asked; no browser harness, no gate):
  - `E.normalizePlan(null)`: `planningMode 'couple'`, every balance and contribution `''`;
  - `coupleSolverOn(E.normalizePlan(null))`: `{"on":true,"share":0.5,"why":null,"swap":false}`;
  - `householdCut(E, M, blank, 'pensionsPA')` then `solveForApp(E, M, hplan, { points: 4 })`: solved in 5,206 ms, 61 years. S116 at
    4 points takes 5,035 ms over 36 years.

## Verdict

Verdict: FAIL

## Findings

1. BLOCKING. Every fresh desktop visitor now gets an unrequested full solve of a blank plan and, on GitHub Pages, a page reload
   within a second or two of landing. A brand-new visitor has no saved plan, so App's plan is `E.normalizePlan(null)`, a couple
   with nothing entered. The couples' guard passes it (`{"on":true,...}` above), so `solverRules` is true (App.jsx l.8735). On a
   desktop `asked` is true, so hold is false (l.8755-8757). `useSolver` then fetches the solver client 800 ms after the first
   render and calls `ensureIsolation()` (useSolver.js l.55). Next it keys and starts the solve of the blank plan: 4 workers at 45
   points, the household route, over 61 years. In Node at 4 points this blank solve costs as much as S116. Meanwhile the page
   shows the quick start, since `planStarted` is false (l.16528), and nothing tells the visitor a solve is running. Its result is
   thrown away when the quick start hands over a plan.
   Where the host sends no isolation headers (GitHub Pages), `ensureIsolation` registers `coi-sw.js`. That worker calls
   `skipWaiting` and `clients.claim`, so `controllerchange` reloads the page once. The quick start keeps its answers in React state
   only (PlannerStart.jsx l.34), so anything typed before the reload is lost.
   Before this commit no fresh visitor reached any of this: the classic planner fetches no solver code (check 14). An opted-in
   visitor with an empty plan already did, so the defect is the new planner's. The change makes it every fresh desktop visitor's
   first load. No harness measures it:
   - check 13 opens the quick start and only asks that something is solving after "Work out my plan". The blank solve begun at load
     would satisfy that too.
   - load-perf's "an empty plan" run is on a Pixel 7, where hold stops the solve. It also stops timing when the quick start appears,
     before the chunks are fetched.
   The commit's "No figure, solve or engine default changes" does not cover this.
   The smallest fix: hand the hook nothing to solve until the plan is started, e.g. `solverRules && planStarted` as `enabled`. Add
   a check of its class: a fresh desktop visitor on the new planner fetches no `solverClient`/`solverWorker` chunk until the quick
   start hands over a plan, with a plant that restores today's start, and show it failing on that plant. Otherwise the maintainer
   accepts it as it is, said to them in those words.

2. MINOR. A returning Simple-page visitor (`rp_which_app` 'simple', no `rp_planner`) lands on the new planner, and then "Classic
   planner" opens the Simple page, not the classic planner. `Shell`'s `shown` is `newPlanner ? 'full' : which` (Shell.jsx l.213-214).
   `which` stays 'simple', and Shell's effect keeps writing it (l.172). After `setPlanner('classic')`, `onPlanner` re-renders the
   shell, `solverSwitch().on` is false, and `shown` becomes 'simple'. Before this commit the state {which 'simple', planner new}
   could not be reached from the UI: the Simple page shows only with the switch off, and the new planner offers no way to it. Now
   every returning Simple-page visitor is in that state.
   Their Simple answers are kept (`rp_simple_v1` untouched) but surface only as the quick start's prefill, and only while the full
   plan is empty. If they once crossed to the full planner, they see that older full plan instead.
   No check covers this: `open` in solver-planner-ui seeds `rp_which_app` 'full' every time (l.181). Fix: Shell sets `which` to
   'full' when App reports a planner change, or `readPlanner`'s unset default applies to `shown` only once the visitor is on the
   full planner. Add a case with `rp_which_app` 'simple' and `rp_planner` unset, and its plant.

3. MINOR. With storage throwing, App and Shell now disagree after "Classic planner". `readPlanner` gives 'new' on a throw
   (App.jsx l.7217). `setPlanner('classic')` writes nothing (`safeStorageSet` swallows the throw) but App's own state turns
   classic. Shell's `solverSwitch()` reads storage again, gets 'new', and keeps `newPlanner` true. So the classic planner shows
   without the shell's "Just want the answer? Open the simple version" bar (Shell.jsx l.249). Every reload goes back to the new
   planner, so such a visitor cannot stay on the classic planner. Before the change the same split ran the other way. It is
   unlikely, but it is a path the ask names, and it is untested.

4. MINOR. Some browser scripts that open the page without choosing a planner are not shimmed, and now load the new planner
   silently.
   - `solver-fullscale-ui.cjs` feeds the readiness checklist's line 3. It opens the shipped site with no plan, so per finding 1
     the page's own blank-plan solve starts beside the harness's timed S116 solve (preview sends the isolation headers, so there
     is no reload). The digest is unaffected, but the "time recorded" is no longer one solve's. Shim it, or seed
     `rp_planner` 'classic' in it.
   - `profile-browser.cjs` and `profile-couple.cjs` (browser timings), `research/qa/{axe,contrast,fuzz,latency,storage}-ui.cjs`
     and `research/desktop-review/*.cjs` now measure the new planner without saying so. None of them gates.
   Every gate harness in run-all.sh's CLASSIC list, the BOTHSTATES list (phone-perf) and the OPTIONAL list, plus `closecall-ui`
   and `doc-landing`, requires the shim, and the solver harnesses set `rp_planner` themselves.
   The shim itself is sound:
   - it patches the shared `chromium` BrowserType in place, so the earlier destructured reference sees the patch;
   - Playwright 1.63's `Browser.newPage` calls `this.newContext`, so the seed is in place before the page exists (the second
     copy that newPage adds is harmless);
   - `launchPersistentContext` is covered;
   - it only fills an empty key. So whatever the init-script order (Playwright leaves context and page order undefined), a
     harness's unconditional `setItem('rp_planner','new')` wins (load-perf l.151, phone-perf l.225). None of the shimmed harnesses
     clears storage or removes `rp_planner`.

5. MINOR. Since the shim, load-perf's guard of "what every visitor loads" covers a visitor who chose the classic planner, not a
   fresh one.
   - The three first-load runs and the classic ceiling of 237 KB now measure the classic planner chosen.
   - A fresh visitor's download is still guarded, but only as the "opted in" empty-plan run against the 240 KB ceiling:
     `rp_planner` 'new' and unset read the same in `readPlanner`, and Shell's `which` defaults to 'full'.
   - "The page calls no host but its own" (l.318-332), the footer's promise, and the typing latency now run on the classic
     planner only. Nothing checks a fresh visitor's new planner for foreign hosts.
   Fix: run the origin check with `rp_planner` unset or 'new', and say in the CLASSIC list's entry which planner each figure is.

6. MINOR. Check 15 can fail on both plants, but the plants run cannot show `optinloses` on its own.
   - Under `classicdefault`, `fresh.place` is false, so 15 fails.
   - Under `optinloses`, the first crossing writes `normalizePlan(null)`. The plan is saved at once (App.jsx l.8831), so
     `back.plan` is false and 15 fails.
   - No other check opens with `planner: null` (l.588 only), so each plant should fail exactly 15.
   - But `PLANTS_RUN` builds every plant into one build and compares the union of failing checks (l.860-862). With both mapped to
     15, `classicdefault` alone fails 15, so the plants run would still say EXACT if `optinloses` stopped biting.
   Run each of the two alone once and keep the outputs (as `results-planner-ui-<plant>.txt` for earlier plants).
   Check 16 still means what it says. `plannerOn` is `SOLVER && BETA_ON && planner === 'new'`, and with the new default unset reads
   as 'new'. So the rollback build's opened-with-'new' case is the same branch a fresh visitor takes, and both get the classic
   planner, no "Try the new planner", and `activeTab` 'inputs' or 'home'.

7. MINOR. The decision has no record in STATE.md, and no fast-tier test pins it. The commit changes no D-line, and R6 in D52 still
   says "off by default". The decided-defaults block has no planner entry. The default is pinned only by check 15, a browser
   harness run at B1's gate. Record the maintainer's words as their own D-line amending R6, in this commit or before the merge.
   Ideally also add `planner: 'new'` to the block, with a Node check of `readPlanner`'s three cases (unset, 'classic', a throw)
   beside `couple-default.test.mjs`. The planner default was never in the block, so this is for the maintainer.

8. MINOR. `launch-ready.mjs` line 8 still reads correctly. It reads `solver-planner`'s row in `results-gate-new.txt`, whose check 15
   still crosses both ways and holds the plan each time. Its closing line still prints "the opt-in may go on main, off by default
   (R6)", which is now untrue of the code it certifies. Line 3 inherits finding 4's timing.

9. MINOR. One user-facing string still calls the new planner a beta: `src/solverDiagnostic.js` l.72, "The new planner (beta):
   details for a bug report.". That is the text a visitor copies into an issue from the failure card (check 18). The site-wide
   "A beta" footer (Shell.jsx l.86), the issue title "Beta feedback:" (l.74) and the Simple page's own note (Simple.jsx l.1505) are
   the site's notice, which the commit keeps on purpose. The speed mode's beta label is its own. No user-facing "opt-in" remains.
   What a returning classic user meets, beside findings 1 and 2:
   - their saved plan, scenarios and settings are under the same keys and untouched;
   - they land on Your plan, where a desktop starts a 45-point solve of their plan and the isolation reload at once;
   - a couple the guard refuses gets the couples card, whose button takes them back to the classic planner, and that choice then
     holds;
   - the tournament, Backtest and Audit tabs are behind "Classic planner".
   This is as designed, and is for the maintainer to have heard.
