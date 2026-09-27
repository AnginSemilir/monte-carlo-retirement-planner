# Morning summary: the night of 27 to 28 Sep (kept current through the night)

## 7x: read (results-7x.txt; the gate passed; the ledger 27 Sep 22:17)

**In one sentence:** the solver's tables undervalue lowering risk at the start because they assume switching tiers
later is free. Once a tier is held for life, the tables see most of what lowering risk buys on S126 and S194 (79% and
97%). Adding more market worlds changes nothing. On share 0.95 a second error remains: the held tables see only 21% of
the gain there.

| item | outcome | the numbers (results-7x.txt) |
|---|---|---|
| 1. free switching (FS) | HELD | held tables see 0.790 (S126) and 0.970 (S194) of the realised gain |
| 2. three worlds (W) | FALSIFIED | five worlds move the tables' difference 0.98 and 0.99 times |
| 3. the Q control (share 0.95) | HELD | held tables see 0.206 of the gain: a second error there |
| 4. the sign control (S360, off) | FALSIFIED | off's tables read S360 at 0.61% against 41.06% simulated, so they carried no sign (O37) |

Scorecard for 7x: Brier 0.218 over 4 items. Cumulative: 0.221 over 63 (results-scorecard.txt).

The reader's pessimism on share 0.95 (O36, results-7x-o36.txt) persists with the tier held for life: 15 of 16 worlds
read more than 2 points low, and at worst 14.33 points low. So switching does not explain it, and neither does the
number of worlds.

## The path from here (the Decision fed, as the 21:22 row maps it)

Item 1 HELD with item 2 FALSIFIED: build the held tier in the solved state as a research option and run 7y. The deep
review you asked for comes first, to lay out the path. In parallel, following the 21:29 row, comes Q's fix (7z),
gated on O35's diagnostic.

## Things to tell you

- **The order was changed.** The order first put to you for Q's fix in parallel was revised for its review (the ledger
  27 Sep 21:29 row); the revision narrows what you were shown.
- **Q's fix: the first attempt is parked.** It is in drafts/q-step-exact.patch. Its test failed check C for a reason
  still unexplained. An earlier note gave a reason; it rested on an unsaved probe at the wrong bill and is withdrawn.
- **gaussHermite(201) underflows.** Its weights sum to 3.6e-162, which voided the first O35 diagnostic run
  (kept as results-o35-diag-first.txt). The diagnostic now uses 4,000 equal-probability points. A related find: the
  product's 5-point weights are printed to six decimals and sum to 0.999999, a bias of 1e-6, below materiality.
- **hooks.test.mjs timing check.** It failed twice under the batch's load (2.10 s and 2.20 s against its 2 s limit).
  Both commits passed when retried. It was not bypassed. The check is locked, so any change to it is yours.
