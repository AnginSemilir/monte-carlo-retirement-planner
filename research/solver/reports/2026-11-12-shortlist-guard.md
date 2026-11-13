# 12 Nov: the shortlist's guard (D90): a decision the pages show is made on the whole menu

A report under D81 (G). The maintainer ruled on D81 (D)'s message (D90, "I agree with your recommendations"): the
tie-break above the estate cap joins the candidate after the couples' re-run's read; the order shortlist is not switched
on as built, and first gets a guard. This is the guard. Nothing is switched on: both options stay off in code and out of
the candidate, and no figure moves.

## What was wrong

`chooserShortlist: 'order'` is an approximation for the paths that only count. Its own note in `solve.js` said "never
for a decision the pages show", and nothing kept it: this year's actions and their skips, the next ten years' rows, the
ledger, the history check and the rule of thumb all took their moves from the same chooser.

## What is built

- `src/solver/solve.js`: `wholeMenu(fn)`. A decision made inside it scores every move whatever the solve was handed, and
  is counted (`SHORTLIST.stats.shown`). The tie-break above the cap, where on, still applies: the whole menu a shown
  decision is held to is the whole menu as the paths' own would be without the shortlist.
- `src/solverStrategy.js`: `shownPolicy(base)`, the table policy asked through `wholeMenu`. `firstMove` (this year's
  move, and so the skips ranked from it), `aheadOf` (the next years' rows) and `rowsOf` (the ledger and the history
  check) read their moves through it. Where the counted paths took a shortlist, the typical run's levels are those of
  the whole menu's own run of the path the rows are shown on.
- `src/solverDistil.js`: the decisions the rule of thumb is learnt from are read through it too.
- The paths that are counted keep the solve's own policy: the strategy's runs, the skips' runs after the forced first
  year, the rule of thumb's cost.
- A couple's ranking calls the same chooser, so a couple's shown decision inside `wholeMenu` is held the same way; no
  page shows a couple's decision yet (Part D's D5).

## Its test

`research/tests/shortlist-shown.test.mjs` (the full tier; output whole in `results-shortlist-shown.txt`), S328F and
S116 at the light settings:

1. no shortlist on the solve: the guard changes nothing, the ledger's moves the solve's own policy's year for year;
2. the shortlist on: every part a page shows is what it shows with it off, and none of those decisions took a shortlist;
3. the counted paths still take it (the strategy's runs, and S116's skips' runs);
4. the typical run is the whole menu's own run of the path shown;
5. planted in the chooser (a decision inside `wholeMenu` takes the shortlist all the same): what the pages show differs;
6. planted in the page's policy (the ledger read without the guard): its moves differ; through `shownPolicy` they do not.

## What the guard leaves open, for when the shortlist comes back

- **The first year.** The page's first move is the whole menu's; the counted paths' first move is the shortlist's. Where
  the two differ, the survival shown is of a first year the page does not show. On the one household the test compares (S328F) they
  are the same move. Holding the counted paths' first year to the whole menu as well would close it, at one decision a
  path, and is not what stage A read, so it is not built: it is the maintainer's, with the trade.
- **A couple's path** under the shortlist is still unread: item 12's stage A (D84), after the registered run.
- The guard's cost in time is the pages' own decisions only (one path each, and the rule of thumb's fit); it was not
  timed in a browser.
