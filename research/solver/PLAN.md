# The solver: a state-dependent plan in place of players and policies

*Plan of record, rewritten in full 23 Sep evening so that it holds only the CURRENT design. Completed work
is summarised in "Where things stand" below and kept in full, verbatim, in `PLAN-HISTORY.md`. Designs that
were superseded before they ran are not kept; they are in git history (this file at commit af670e8 and
earlier). Nothing in the app changes until Phase 4's gate passes.*

**Keeping this plan current - a standing rule (maintainer, 23 Sep).** This file holds only what is
current and what is still to do. **The moment a step, phase, gate or measurement is COMPLETED, its full
text moves to `PLAN-HISTORY.md`** - verbatim, with its outcome and the results file named - and in this
file it is replaced by one line in "Where things stand" pointing there. A design that is superseded
before it runs is deleted, not archived (git history keeps it). A decision changes the plan in place,
with the date and who decided. Nothing completed is ever deleted outright, and nothing superseded is left
here to be mistaken for the current plan.

**Where to read what.** The requirements the product must meet are first and do not move without the
maintainer. The schedule and every pending phase follow, each with its prediction written before it
runs. Results files sit beside this file as `results-*.txt`; `HOW-IT-WORKS.md` explains the machinery in
plain language.

---

## Fixed requirements: what the product must do

**Stated by the maintainer, 23 Sep, in a holistic check, and fixed here so the research does not drift
away from them.** Everything below this section exists to serve this section. Anything in this plan
that does not serve it is scope, and should be justified as scope or dropped.

### The journey

1. **The user enters their portfolio and their own details.** Accounts, salary, contributions, state
   pension, region, spending bands, one-off deposits and costs.
2. **They choose a retirement spending target, then a floor.** ~~And how often that floor must hold.~~
   **Changed 23 Sep, maintainer: survival is NOT a target.** It is a weighted priority - the largest by
   default - and the survival chance is an OUTCOME the plan reports, not a promise it is tuned to hit.
   The landing that bisected the trim penalty to a survival ask leaves the product (it stays as a
   research tool, below). One solve per plan instead of five to seven.
3. **They choose what they value**: survivability alone; or also a minimum end-of-life pot above zero;
   or also the size of the pot they leave. **More levers may come later. Not now.** The full set of
   user levers is fixed in the table below.
4. **The solver returns the predicted figures through retirement and the survivability of the plan**,
   using the levers it is allowed to pull.
5. **Trimming of retirement spending must be minimised, and the user must be able to trust that.** A
   default curve is supplied; letting the user adjust it may come in a later build. The user also sets
   how much cuts bother them (a slider), and can block cuts below target altogether.

### The levers the USER sets  (agreed with the maintainer, 23 Sep)

These are the only things the solver is told to value or respect, beyond the plan inputs. **Anything
the solver values that is not on this list is a defect**, which is how resilience was found and removed.

| user lever | what it does | status in the solver | exposed to the user |
|---|---|---|---|
| **survival priority** | how much not running out (and not breaching the floor or the minimum pot) matters | the survival term's weight, fixed at 1: the reference every other weight is measured against | **the fixed anchor, not a slider - option (a), decided 23 Sep.** Always the largest priority. Not a target: the chance is reported, not promised |
| **dislike of spending cuts, 0 to 100%** | how much a trim below target hurts | the trim penalty lambda - today found by the landing per household, ranging 0.005 to 2 (a 400x span) | **yes - a user level, agreed 23 Sep.** NOT BUILT as a level. Its DEFAULT is matched to how much the guardrails cut (K5, the Phase 4 fairness condition); K6 calibrates its spread around that |
| **spending target** | what they want to spend each year | yes | yes |
| **spending floor** | the lowest the solver may trim to | yes (0.8 of target in the research runs) | yes |
| **block trimming** | never spend below target: the floor set equal to the target | supported (a floor of 1 leaves no level below 1); **needs its honouring check** | **yes - agreed 23 Sep** |
| **trim curve** | how the cost of a trim grows with its depth, between target and floor | the shortfall exponent, 2 | **no - a fixed default; adjustable in a later build.** Its default is FITTED so the solver's cuts have the guardrails' shape (K5) |
| **raises above target** | whether, and how far, the solver may spend ABOVE target in good years | on, up to 1.2; the raise weight 0.003 sets how eagerly | **yes - agreed 23 Sep: allow, cap, or block** (block = no level above 1) |
| **minimum end-of-life pot** | a hard line: a future that ends below it counts as failed | yes (`solvencyFloor`) | yes, **with a sensible default above zero - agreed 23 Sep**, because it now carries the job resilience did |
| **estate priority, 0 to 100%** | how much the pot left above the minimum matters against everything else. One user-facing level; internally it sets BOTH the credit's weight and how steeply each extra pound's credit diminishes | **NOT BUILT (found 23 Sep).** Today: a fixed weight 0.02 on `min(net, 4K)` - every pound from ZERO (not from the minimum) counts the same up to the cap, then nothing. No diminishing curve, no level | **yes - a user level, agreed 23 Sep.** Moving it changes survival and other results, and that is the user choosing priorities, not a bug. **Phase K3's job is the SPREAD**: equal steps on the level must give roughly equal steps in outcome - 10% must not already have swung hard toward the estate, 100% may cost a lot |
| **permission to change investment risk** | may the solver move a pot to a lower risk tier | tiers, up to two below the plan's, at a switching cost | **yes - agreed 23 Sep, as consent** |

**Three priority levels, two degrees of freedom - resolved by option (a).** The solver balances weighted
priorities, and a weighted balance depends only on the RATIOS of the weights: survival 100% with cuts
100% and estate 100% gives exactly the same plan as all three at 50%. So three sliders have only two
independent settings, and a user who moves all three together sees nothing happen. Two honest ways to
present it: (a) survival is the fixed anchor and the other two levels are each measured against it; or
(b) three sliders shown, normalised underneath, with the copy saying they are relative. The maintainer's
"survival largest by default" fits either. To settle before Part C's copy; Phase K calibrates the two
free ratios whichever is chosen.
**Clarified 23 Sep: "moveable" means ON A SCALE.** The three priorities - survival, dislike of cuts,
estate credit - are each a slider, as distinct from the fixed rules (floor, block trimming, minimum pot,
raise permission, risk consent), which are set values or on/off. Three sliders are the requirement;
the ratio point above governs how they are implemented (normalised: each weight is its slider's share
of the total) and how the copy describes them ("relative importance").
**DECIDED 23 Sep, maintainer: option (a).** Survival is the fixed anchor - always the largest priority,
not a slider. The user moves TWO sliders, each measured against survival: how much spending cuts bother
them compared with running out, and how much their estate matters compared with running out. No
normalisation needed, no "move everything, nothing happens". Phase K calibrates exactly these two.

**Deliberately left out, 23 Sep:** a stability lever (how often spending may change). The drift penalty
stays off and unexposed.

**Removed 23 Sep: resilience.** It was a graded reward on the end pot up to opening wealth, on for every
user, chosen by nobody. Phase 6f measured it as the main source of trimming (years below target 1.6 ->
9.4 on S126, 2.8 -> 14.6 on S390, 4.0 -> 13.8 on S112 between weights 0 and 0.5) for 0.4 to 2.1 points of
floor rate. Its legitimate job - keeping bad futures from ending just above zero, which pass/fail survival
cannot see - passes to the user's own minimum end-of-life pot, with a default. Maintainer's decision.

### The levers the solver may pull  (confirmed against `buildActions`, 23 Sep)

| lever | what it is |
|---|---|
| **draw order** | which pot to draw from first, and in what order; pension to the allowance or to the basic-rate limit; ISA before taxable or after |
| **CGT harvesting** | realising gains up to the annual exemption or the basic-rate limit |
| **risk tier** | per wrapper, pension and ISA independently, paying `SWITCH_COST` and having to beat `SWITCH_MARGIN` |
| **spending level** | 1.2 / 1.1 / 1 / 0.95 / 0.9 / floor - **down AND up** (six levels, decided 23 Sep; the lowest is always the user's floor). The solver raises spending in good years unless the user caps or blocks raises |
| **how the level is found** | a ternary search over the levels in each group, not a scan of all of them - measured safe (24 misses in 5.0 million, worst 0.009 survival points) and cheaper: four levels evaluated of six |

### Not the solver's to choose

- **contributions** during accumulation (`contrib: null`) - accumulation is taken as given
- **retirement age** - solved separately by the app
- **lump sum vs phased drawdown** - taken from the plan, not chosen, despite being a large real decision
- **when the household dies** - a fixed plan-to age. **No mortality, by design.**

### Resolved mismatches between the requirement and the build (decisions that bind the copy)

1. **The solver does not maximise a median, and no copy may say it does.** A backward induction carries
   EXPECTATIONS; a quantile does not decompose year by year. The estate credit is a MEAN (today capped;
   after K4, a diminishing curve above the minimum pot). Maintainer, 23 Sep: that is fine, and the
   wording follows the engine. **Report the median pot, never claim to optimise it**; wherever the
   credit is capped or diminishing, the copy says so in a sentence a person can read.
2. **Resilience removed (23 Sep).** It valued the unlucky tenth's end pot for every user, chosen by
   nobody, and 6f measured it as the main source of trimming. Its job passes to the user's minimum
   end-of-life pot, with a default.
3. **Still open: survival is judged on the GROSS pot and the estate on the NET.** Dormant only because
   every library household runs at a zero pension death-tax rate; needs a synthetic fixture (never the
   maintainer's own household) before it is worth touching.

### Standing constraints, not up for renegotiation

- **No mortality, no annuities, no regime belief.**
- **The maintainer's own household is never a fixture.**
- **A gate that fails is recorded and stopped on, not tuned until it passes.**
- **Nothing merges to `main` until `run-all.sh` prints ALL REQUIRED GREEN.**
- **One experiment at a time on the four cores**, enforced by the lock in `run-from-snapshot.sh`.
- **Nothing in the app changes until Phase 4's gate passes.** The solver has never been shown to beat
  the shipping pipeline on held-out households; everything before Phase 4 is a reason to reach it, not
  to polish.
- **Background runs are launched as harness-tracked tasks**, never detached: a detached run was killed
  when an idle container was reclaimed on 23 Sep.
- **The maintainer decides whether the solver ships.** Running Phase 4 and writing its verdict is the
  end of this plan's remit.

---

## The rule that comes before the conventions: DERIVE FIRST, RUN TO FALSIFY

**Added 23 Sep at the maintainer's direction, after it kept paying.** Where a question can be settled or
narrowed by mathematics, **do the mathematics first and write the hypothesis down BEFORE the run.** The
run then exists to prove or disprove a stated prediction, not to discover an answer.

This is not a preference about rigour. It is about what the runs cost and what they teach:

- **It deletes runs.** The lambda-curve run - 30 cells, 1.6 hours - was cancelled before it started
  once the search was recognised as a Lagrangian relaxation: the floor rate is provably piecewise
  constant, and the steps are microscopic because the trim cost sums over ~9,720 cells x 40 years and
  cells flip one at a time. The free by-product of another run then confirmed it: 0 reversals in 15
  pairs.
- **It finds things no run would have.** The lambda search stops before converging, so the landing
  always ends on the over-trimming side. That is arithmetic on two constants; no experiment was looking
  for it, and the evidence had been sitting unread in 22 landings that all overshoot their ask.
- **AND IT CATCHES ITS OWN ERRORS, WHICH IS THE POINT.** The first version of that finding said five
  halvings take a 400x bracket to 12.5x. **Wrong, by a factor of ten.** Bisection here takes the
  GEOMETRIC midpoint, so each step takes the SQUARE ROOT of the ratio rather than half of it:
  400 -> 20 -> 4.5 -> 2.1 -> 1.45 -> **1.21**. Redoing the arithmetic turned a claimed emergency into a
  real but modest one-point bias - and only redoing it found the better answer, that **eight steps
  suffice and twelve is overkill.** A mistake inside a derivation is findable. The same mistake buried
  in a run's interpretation is not.
- **It makes a run worth more.** A run that confirms a stated prediction tells you the mechanism was
  understood. A run with no prediction attached tells you only what happened, and invites the number to
  be explained after the fact, which is how a result gets read to taste.
- **A wrong prediction is the most valuable outcome of all.** I predicted the floor rate would show
  local reversals from tax kinks; it showed none in 15 pairs. That disagreement located the error
  exactly - the kinks move individual CELLS, and no cell is a meaningful fraction of a sum over ~9,720
  of them - which no amount of staring at output would have produced.

**It does not apply everywhere, and pretending otherwise is its own failure.** Anything resting on the
shape of the household library, on UK tax interacting with a 40-year horizon, or on what a person
prefers, is empirical and the run IS the argument. The test is simple: if you can state what the answer
should be and why, state it first. If you cannot, say so, and say what would change your mind.

### And before any run: is the answer already sitting in data we have?

**The sharper half of the rule, which the maintainer caught me missing.** I once wrote that whether last
year's best move is near this year's "depends on the household library and UK tax over a 40-year horizon,
so the run IS the argument". That confused *not derivable from first principles* with *not measurable*,
and only the first was true: the quantity was already computed by every ordinary solve, in the stored
policy tables, and one solve's worth of reading answered it. **Before writing "the run is the argument",
check whether the number is already sitting in something computed. It usually is.**

What checking the records has already settled or sharpened, at no compute:
- **The convergence test's outcome was predictable from the landings on file**: exactly the three
  households whose search margin sat above the stopping window were the ones that could move, and the
  one that did move was on that list.
- **The seed pair was cleared** by scoring the same policy on both draws across 41 households.
- **#109's target list was answered**: the phase-2 losers no longer lose in the current design.
- **The guardrail matching was reframed before it ran**: the records showed the guardrails cut three to
  fourteen times more, often and shallow, where the solver cuts rarely and deep - so matching needs two
  dials, and the solver's menu could not reach their shallowest cuts at all.
- **K2's minimum-pot prediction was sharpened** from 6f's end pots, down to which households it binds on.

**And the discipline that goes with it: claim only what the data settles cleanly.** Where the existing
records differ in configuration, or rest on one household, or were produced under a setting since
changed, say that the data cannot settle it and run the test. A clear "not settleable from saved data"
is a result; a borrowed number from a run that differs in some way nobody checked is not.

**So the order, for every question, is: (1) can the mathematics state the answer? (2) do the existing
records already contain it? (3) only then, run - and write the prediction down first.** Every phase from
here carries a HYPOTHESIS section stating what the mathematics and the records predict and what result
would falsify it, written before the batch is launched.

---

## Working conventions for whoever builds this

These are the rules this repository already runs on. They are not optional and none of them is
repeated in the phases below.

- **Branch and merge.** Develop on the session's designated branch. Merge to `main` with
  `git merge --no-ff` only after `bash research/ui-harnesses/run-all.sh 4173` prints
  `ALL REQUIRED GREEN`; that script builds, serves on the port given, runs every required harness and
  then every engine test. Never merge on a partial run. Commit after each gate passes, with a message
  that says what changed and why in prose; end it with the attribution lines the session provides, and
  never put a model identifier in a commit, a comment or a pushed file.
- **The engine is a slice, not a copy.** Everything from after the lucide-react import in
  `src/App.jsx` down to the single one-line `export { … }` is the engine, and `python3
  research/build-engine.py` slices it into `research/engine.mjs` (git-ignored) for the tests and
  studies. So: no JSX and no React in that region; any new engine function must be added to BOTH the
  `const E = { … }` map (App.jsx, one line, currently near line 6426) and the `export { … }` line, or
  the app sees `E.name` as undefined while the tests pass. `src/solver/` is a separate module the
  engine must not import at module level (the app imports it lazily); the studies import it directly.
- **Tests.** Engine tests are `research/tests/*.test.mjs`, plain node scripts printing PASS/FAIL lines
  and exiting non-zero on failure; `npm run test:engine` runs them all after rebuilding the slice.
  Harnesses are `research/ui-harnesses/*-ui.cjs`, Playwright from `/tmp/node_modules/playwright` with
  `executablePath: '/opt/pw-browsers/chromium'`, each with `open`, `tab` and `ok` helpers at the top
  and a fixture plan seeded through localStorage; a new harness is registered in `run-all.sh`'s
  `REQUIRED` list. The load-perf harness holds a 220 KB gzipped ceiling on the entry chunk and a
  typing-latency ceiling; both stand throughout.
- **Golden comparison is the method.** Every engine change in this repository has been proved by
  running the same households through the old and new code and diffing, and every study reports
  held-out figures. Do the same: the reference for "what the engine does" is `simulateDeterministic`
  and `monteCarlo` on `research/engine.mjs` built from `main`, kept in the scratchpad as
  `engine-main.mjs`, never a hand-written expectation.
- **Households come from the library.** `research/policy-study/scenarios.mjs` builds 420 households;
  the FIRE cohort is those under 45 with `retireAgeSelf` set to 52; the cost variants are built as in
  `research/policy-study/lookahead-study.mjs`. The versus protocol is `research/policy-study/versus.mjs`
  and its comment header is the specification of a fair comparison. Use `RATE_EPSILON_PTS` from the
  engine as the tie threshold everywhere; never invent one.
- **The person's own household is not a fixture.** No test, harness or study fixture may carry the
  maintainer's real figures; invent households.
- **Phones are first-class.** Anything on the Strategy or Projection tabs is checked on the phone
  harnesses too, with 44px targets and no horizontal scroll.
- **Words.** UI copy in the same voice as the existing tabs: plain sentences, no jargon without the
  glossary, numbers labelled as today's money. New copy is added to the editable-copy manifest the
  edit mode reads.

---

## Where things stand (23 Sep evening)

### Settled, with the evidence (full text in `PLAN-HISTORY.md`, results in the files named)

| area | settled | evidence |
|---|---|---|
| the reduced model | exact to the pound against the engine; the table override is exact | Phases 1 and 3, golden tests |
| the method | backward induction on a total-wealth grid (30 points x 6 x 6 shares x 3 gain x 3 lump-sum), 9,720 cells | Phase 2; 60x8x8 matched 40x6x6 to the decimal on eight households |
| robustness of the method | the edge grows in every perturbed world; every phase-2 loss has a named cause | Phase 2c, the loss ledger |
| flexible spending | at equal downside, years at target 0.85 against 0.51, 41 of 41 ahead | Phase 2d, re-run clean under the mixture |
| engine gaps closed | savings-interest and dividend tax, the Cash ISA wrapper | Phase 2e |
| the three-world mixture | the engine's return uncertainty carried as three tables; engine within 2 points of the model on 41 of 41 | Phase 3 |
| couples | +0.77 against the best fixed rule on 19 couples, by rollout | Phase 5 (backtest and perturbed worlds not yet run) |
| risk tier as a move | +6.16 in the real engine, 41 of 41 | Phase 6 |
| spending and tiers together | 6b ran; condition 1b failed as written on 9 of 41 and was recorded, not rewritten | Phase 6b |
| E0, one flow per cell across worlds | bit-equal, 1.66x / 1.33x faster | `results-part-e-measured.txt` |
| grid fidelity | quiet: every re-spacing inside 2%; the gain buckets stand | 6e stage 1, `results-p6e-screen.txt` |
| search paths | 5,400 stands; 2,400 fails | #108, `results-108-paths.txt` |
| the lambda search | no correctness fault; three of 22 landings were budget-limited; the +0.5 margin is load-bearing | `results-converge.txt` |
| the seed pair 7001/7002 | agree within noise across 41 (+0.18 against +/-0.91) | `results-converge.txt` |
| resilience | load-bearing for the unlucky tenth's end pot AND the main source of trimming -> **removed** | 6f, `results-p6f-kink.txt` |
| the S126 anomaly (#106) | confirmed: a dead corner in log-odds on a SHARE axis; only S126 of the 41 is in the class at t = 0 | `results-106-deadcorner.txt` |
| E4, interleaved value arrays | dead: 3.8% slower | `results-part-e-measured.txt` |
| E1, seeding from next year's move | fails its bar (98.68% coverage) - **to be re-run**, it read the byte-wide table | `results-probes-e1-unimodal.txt` |
| single-peakedness in level | confirmed over 5.0 million combinations; six levels plus ternary search evaluate four | `results-probes-e1-unimodal.txt` |
| the lambda curve | cancelled: answered by algebra (a Lagrangian relaxation; 0 reversals in 15 pairs) | history |
| 6c, the soft bequest shoulder | not passed on its control, S390; not re-specified | history |

### Bugs found and fixed on 23 Sep

- **The E0 world views lacked `value()`**, turning the engine suite red - fixed.
- **The stored policy was a byte while the menu has 360 moves** - in full below.
- **Probes that measured nothing:** the first E1 and single-peak run used the default three-level menu and
  the single-peak probe printed "safe" on zero tests. Both now refuse to run on the wrong menu or to
  give a verdict on nothing.

### The byte-wide policy bug, found 23 Sep ~15:00 - the stored policy was a byte, and the menu is wider than a byte

`pol` was a `Uint8Array`; with tiers and five levels the menu has 360 moves (432 with six), so any
stored move numbered above 255 read back as a different move. **One reader acted on it: the final year
of every simulated path**, where `chooseAction` returns the stored move. Every full-menu simulation -
flex-tiers, #108, the convergence test, 6f - played its last year with the wrong move wherever the
best was above 255. **Fixed** (`Uint16Array`, commit fc26c07, a test that fails on the old width).
Found while writing the ternary search, not by a test: no test had a menu wider than 255.

Consequences, handled in this order:
- **The Phase V run was stopped 15 minutes in and restarts on the fixed code** (its simulations read the
  final year the same way).
- **The E1 probe read its persistence figures from the same corrupted table**, so its verdict ("not
  built", 98.68% coverage) is re-run on the fixed code before it is trusted - one solve.
- **The size of the damage to existing results** is measured by `audit-pol-overflow.mjs`: the same
  paths simulated with the true and the wrapped final-year move, on four households. Prediction: small -
  one year in 35 to 61, and only where the best final move sits above 255 - but a final-year move that
  spends 20% more or draws from the wrong pot can fail a path that was about to survive, so it is
  measured, not assumed. Written up in `results-pol-overflow.txt`.
- Paired comparisons (6e, 6f, #108) shared the bug in both arms and are expected to survive it.

**MEASURED: NO EFFECT ON ANY SIMULATED RESULT** (`results-pol-overflow.txt`). On four households not
one final-year cell stores a move above 255 - those are the "draw all the pension first" families, which
no household chooses in its last year - so every simulation read the right move. Existing results stand.
The E1 probe, which compares stored moves across all years, was corrupted and is re-run in step 2.

---

## The schedule

**One rule sets the order: a step goes after everything it is conditional on.** Numerics before
anything that reads the table; solver changes before any calibration; the maintainer's product defaults
before the guardrail matching, because what the solver cuts depends on every other setting; the matching
last, immediately before Phase 4. Any step whose result redirects the plan stops the queue there.

| # | Step | Conditional on | Size | ETA (UTC) |
|---|---|---|---|---|
| 0 | ~~Measure the byte-wide policy bug's cost~~ **done: zero effect on any simulation** | the fix | - | done |
| 1 | **Phase V**, restarted on the fixed code, extended to the share axes | 0 | ~1.5 h | Wed ~16:45 (restarted 15:07) |
| 2 | **Solver changes + one field check**: the interpolation fix (#106 and whatever V finds); resilience off; lambda as a direct setting, no landing; six levels with the ternary search; the E1 probe re-run | 1 | build ~1.5 h, run ~1 h | Wed ~19:15 |
| 3 | **Lever builds**: the estate credit curve above the minimum pot; the raise cap and block; the minimum-pot default; block trimming (floor = target) | 2 | ~2.5 h, no cores | Wed ~21:45 |
| 4 | **K1 honouring checks** - exact; a failure is a bug | 3 | ~20 min | Wed ~22:15 |
| 5 | **K2-K4 screens** overnight: minimum-pot default, raise cap, estate slider spread | 4 | ~5 h | Thu ~03:15 |
| 6 | **The maintainer picks the product defaults**: minimum pot, raise cap, estate slider default | 5 | - | Thu morning |
| 7 | **K5 guardrail matching**: dislike of cuts and the trim curve fitted so the solver cuts as much as the guardrails | 6 | ~5 h | Thu ~14:30 |
| 8 | **K6 dislike slider spread, K7 monotone checks**, at the matched setting | 7 | ~1.5 h | Thu ~16:00 |
| 9 | **Phase 4**, the head-to-head, with its diagnostics | 8 | ~7 h | Thu ~23:30 |

Step 6 is the one point the maintainer is on the critical path.

**After Phase 4, in this order:** the speed work (E3; Brent with error-based stopping for any lambda
search that remains - K5's matching and Phase 4's equal-survival diagnostic); #109's remaining probes
(households whose landing saturates, households already on the Low tier; recommendations only, in a
scratch note); E2 after Phase 7.

---

## Phase V. Is the numerical machinery converged?

Nobody had asked whether the discretisation is converged: five Gauss-Hermite nodes, never varied; a
30-point wealth axis never run as a convergence sequence; six points on each share axis, never tested at
all; log-odds interpolation never compared against linear. **An unconverged discretisation biases
everything, invisibly, and identically in both arms of Phase 4, so Phase 4 cannot detect it.** #106 then
found a real fault on a share axis, which the original design could not have seen.

#### HYPOTHESES, derived before the run

**V1, and it is NOT simply "five is too few".** The rule integrates the next year's value against a
standard normal. Computed from the rule itself:

| nodes | nodes inside +/-2.2 sd | largest gap between nodes |
|---|---|---|
| 5 | **3** | **1.501 sd** |
| 9 | 5 | 1.307 sd |
| 15 | 5 | 1.174 sd |

So at five nodes, 95% of the probability is carried by THREE points and the widest blind spot is 1.5
standard deviations across. How wide is the cliff in the same units? Wealth grows by `exp(mu + sigma z)`,
so at an equity volatility near 0.13 a 10% band of wealth spans about **0.8 sd** - narrower than the
gap. On that alone five nodes look inadequate.

**But the integrand is not the cliff.** `V_{t+1}` is already an expectation over every remaining year,
so twenty years of future uncertainty have smoothed it into a sigmoid far wider than one year's cliff.
The smoothing is weakest at the END of the horizon, where little future remains to average over.

**So the prediction is specific: the quadrature error is concentrated in the last few years and largely
washes out of the opening value.** V1 PASSES on its headline (opening survival within 0.1 of a point)
**and** the policy differences it does find are concentrated at high `t`. **Falsified if** the opening
value moves more than 0.1 of a point, or if the differing moves are spread evenly across years - the
second would mean the smoothing argument is wrong and the error is everywhere.

**V2.** Total wealth sits on a LOG axis read by linear interpolation, whose error is order
`h^2 * |V''|` for spacing `h`. The axis spans roughly 600x, so `h = ln(600)/n = 6.4/n`: about 0.21 in
log-wealth at 30 points, near 24% steps. **Prediction: successive differences shrink roughly as
1/n^2**, so the 30-to-56 gap should be around three and a half times smaller than the 16-to-24 one.
**Falsified if** the steps shrink materially slower than quadratically - which would mean the
interpolation is resolving something non-smooth (the cliff) rather than a smooth function, and the
resolution is genuinely insufficient rather than merely finite.

**V3.** Survival as a function of log-wealth is approximately a normal CDF, being the probability that a
sum of lognormal returns clears a threshold. A logistic and a probit agree to under 1% across the
central range, so **log-odds interpolation should be close to exact near the cliff while plain linear
interpolation carries the full curvature error.** Prediction: log-odds beats linear near the cliff by a
visible margin and ties elsewhere. **Falsified if** linear matches or beats it - which would mean the
comment in `grid.js` is folklore.

#### V1. The quadrature: five nodes, hardcoded, never varied

`NODES` holds five Gauss-Hermite points and nothing in the repository has ever changed it.

Gauss-Hermite with five nodes is exact for polynomials to degree nine. **That guarantee does not apply
here.** The integrand is a value function containing a survival cliff; near the cliff it is closer to a
step than to a polynomial, and the degree-nine bound says nothing about steps.

Concretely: the nodes sit at 0, +/-1.356 and +/-2.857, and **the outer pair carry 1.1% weight each**. If a
cell's cliff falls near z = -2, the rule has NO NODE THERE - it spans the drop between a point worth
1.1% and one worth 22%.

**The check.** One household at 30 points, three arms: 5 nodes (today), 9, and 15. Node count multiplies
the expectation step linearly, so this is about 5.8 solve-equivalents, half an hour.

**Gate V1.** Five nodes stand if, against the 15-node answer: the opening position's survival is within
**0.1 of a point**, and the stored move differs on **under 1% of cells**. If either fails, every result
in this project carries an unmeasured bias and the node count must be raised before Phase 4.

#### V2. Grid resolution: is thirty points converged?

Runs exist at 20 and at 40 - but as ALTERNATIVES, chosen between, not as a convergence sequence. Nobody
has solved the same household at increasing resolution and shown the answer stop moving.

**And the code knows.** `solve()` carries a field `rich` - "a second solve at half the resolution, for
Richardson extrapolation of the move scores" - permanently set to `null`. Someone saw this question
coming and did not finish it.

**The check.** One household at 16 / 24 / 30 / 40 / 56 points, all else fixed. Cost scales with the
dense axis, so the five together are about 5.5 solve-equivalents.

**Gate V2.** Thirty points stand if the sequence is visibly converging - each successive difference
smaller than the last - **and** the gap from 30 to 56 is under **0.2 of a survival point** on the
opening position. A sequence that is NOT visibly converging is the worse outcome: it would mean the
answer depends on a resolution nobody chose on evidence.

#### V3. The interpolation scheme

Survival is read in log-odds "so the cliff between making it and not survives the read". A reasonable
choice, never compared against the alternative.

**It interacts with V2**, which is why it shares its run: better interpolation means fewer grid points
are needed for the same accuracy, so the two questions are cheaper together than apart.

**The check.** Take V2's 56-point solve as the reference. At positions BETWEEN coarse-grid nodes,
compare what a 30-point table predicts under log-odds against what it predicts under plain linear
interpolation, each against the fine-grid truth. No new solves.

**Gate V3.** Log-odds stands if its worst error against the reference is no larger than linear's. If
linear is better, the comment in `grid.js` is wrong and the read should change. If both are large, the
problem is V2's, not V3's.


#### Phase V as run, 23 Sep - extended, and its predictions written before the run

`audit-converge-numerics.mjs`, rewritten: runs on the objective that will SHIP (resilience off, six
levels, raises on, joint tiers, the household's landed lambda), reads every arm two ways - the table's
opening value AND the simulated survival of its policy on 1,000 held-out paths - because #106 showed
the first can be badly wrong while the second is fine. Adds **V2s** (the share axes at 6 / 9 / 12
points) and a **census** of cells reading 50% or more with a dead corner one step along a share axis.
Three households in parallel: S184 (the gate household, still working, no bridge), S330 (61-year
horizon, the largest smear in the old loss ledger) and S126 (the #106 household).

PREDICTIONS, derived:
- **V1 passes on S184 and S330** (table within 0.1, under 1% of moves): the outer nodes carry 1.1% each
  and the survival term is read in log-odds, where the cliff is a slope, not a step.
- **V2 passes on S184 and S330**: phase 2 found 60 x 8 x 8 matching 40 x 6 x 6 to the decimal.
- **V2s FAILS on S126 on the table read, and it is the dead corner, not resolution.** At 6 share points
  the nodes are 0.8 and 1.0 and S126's 0.85 puts a quarter of its read on the dead all-pension node; at
  9 points they are 0.75 and 0.875 and at 12 they are 0.818 and 0.909, so S126's read never touches the
  dead node and should JUMP from about 8% toward its simulated ~97%. The SIMULATED survival should move
  far less (within a point or two), because simulation walks real pots. V2s passes on S184 and S330.
- **V3: log-odds beats linear along total wealth** (that is what it is for), **and loses along the share
  axes where a dead corner sits** - which is the evidence for fix (a), reading linearly across a dead
  share corner.
- **Census: dead share corners in S126's bridge years only, near zero for S184 and S330**, whose
  all-pension node is alive in every year.

#### What each outcome costs

- **All three pass**: the foundation is sound, this is recorded once and never revisited, and Phase 4
  runs on a floor that has been checked rather than assumed. Cost: a few hours.
- **V1 or V2 fails**: every existing result carries an unmeasured bias in an unknown direction. The
  fix is more nodes or more points, both of which cost run time and neither of which is hard. **The
  6-series conclusions would need re-reading**, though the PAIRED ones (6e, 6f) survive,
  because a bias common to both arms cancels in a paired comparison - the same argument that saved
  them from the lambda under-convergence.
- **V2s fails on S126 only, as predicted**: the fix is the step-2 interpolation change, not more share
  points everywhere.

**Restart note, 23 Sep:** the first launch (14:59) was stopped after 15 minutes when the byte-wide policy
bug was found - its simulations read the final year from that table. It restarts on the fixed code.

---

## Step 2. The solver changes, and one field check

Each change is built behind an option, defaulting to today's behaviour, and bit-identity of the default
is tested before anything is switched on.

- **The interpolation fix** for #106, chosen by Phase V's measurements. Candidates: (a) read survival
  linearly across a corner at the clamp - the cliff log-odds is for runs along total wealth, not the
  shares; (b) a share node at each household's opening share, which only helps at t = 0; (c) mark cells
  that cannot fund a bridge and exclude them from the read. Prediction: (a), because V3 should show
  linear winning only across dead share corners.
- **Resilience off by default** (weight 0). Its effect at a fixed lambda is already measured by 6f.
- **Lambda as a direct setting** - one solve, no landing. The landing code stays for Phase 4's
  equal-survival diagnostic and K5's matching.
- **Six levels plus the ternary level search** (`levelSearch: 'ternary'`, written and waiting). Gate: on
  the field-check households, stored moves differ from the exhaustive scan on under 0.01% of cells, the
  simulated survival within noise, and the solve at least 15% faster.
- **The E1 probe re-run** on the fixed code before its verdict is trusted.

**The field check.** 12 households at a fixed lambda, arms: today's code; the fix only; the fix plus
resilience off plus six levels plus ternary. The last arm is the new baseline every later step builds on.

---

## Step 3. The lever builds

- **The estate credit curve** `credit(net) = w x s x ln(1 + (net - P)/s)` above the minimum pot P, with one
  level driving (w, s) along the path K4 calibrates.
- **Raises: allow, cap, or block** - the menu's top level set by the cap, none above 1 when blocked.
- **The minimum end-of-life pot default**, wired so a plan without one gets the default K2 settles.
- **Block trimming** - the floor set equal to the target, which leaves no level below 1.
- **Lambda exposed as the dislike-of-cuts level**, its map fitted in K6.

---

## Phase K. Calibrating the user's levers

Two different jobs that must not be confused. **A rule the user sets must be HONOURED** - exact, not
tuned. **A default or a slider's scale must be CHOSEN** - from measured curves, by the maintainer.
Screens run at a fixed lambda (the flex-tiers landed value) on 12 households unless stated.

**K1. Honouring checks - exact.** On every path of 12 households:
- block trimming (floor = target): zero years below target, by construction;
- block raises: no year above target; a cap c: no year above c;
- minimum end pot P: no future counted as surviving ends below P;
- risk permission off: every year at the plan's tier.

**K2. The minimum end-pot default - it replaces resilience.** P in {0, 1, 3, 5} years of target spending.
PREDICTION: trimmed years stay near resilience-off levels (1.6 to 4) and far below resilience-on (9 to
15) at every P, because resilience rewarded pounds up to opening wealth - 15 to 30 years of spending on
the unlucky tenth - and a hard floor of 1 to 5 years only binds on futures heading below it. FALSIFIED IF
P = 3 costs more than half of resilience's trimming.
SHARPENED FROM 6f's RECORDS, no run: with resilience off, the unlucky tenth ends at 7.7 (S126), 21.7
(S054), 4.5 (S252), 1.4 (S390), 0.1 (S206) and 6.7 (S112) years of spending. So at the tenth percentile a
1-year floor binds only on S206; 3 years on S206 and S390; 5 years adds S252; S126, S054 and S112 are
untouched up to 5. **The cost of the default lands on two or three households of six, not all of them.**

**K3. The raise cap default.** Cap in {1.0, 1.1, 1.2}. PREDICTION from records: raises are frequent (a
typical level of 1.15 to 1.2 in good states), so blocking them lifts median end pots substantially and
barely moves survival. A spend-now-or-leave-it choice for the maintainer.

**K4. The estate slider, 0 to 100%: build it, then calibrate its SPREAD.** Survival is the fixed anchor
(option (a)); this slider sets how much the pot above the minimum counts against running out, through

    credit(net) = w(level) x s(level) x ln(1 + (net - P) / s(level))      above the minimum pot P

w sets how much it counts; s how fast each extra pound's credit falls (a pound counts half at P + s). No
cap needed. Moving it changes survival and other results - that is the user choosing priorities. The job
is that equal steps give roughly equal steps in outcome: 10% a small tilt, 100% the estate first.
DERIVATION: phase 2's frontier put three quarters of S294's response in the first 4% of the weight
range, so a linear map fails; the map will be close to logarithmic. METHOD: sweep finely, express each
outcome as a fraction of the household's own 0-to-100% swing, fit the map so the median household
tracks the slider, report the worst. GATE: every household within 10 points of the slider; the last
step to 100% no bigger than three ordinary ones. PREDICTION: long-horizon households set the worst case;
the cost falls mainly on spending, since pounds kept for the estate also protect survival.

**K5. Guardrail matching: the trim curve and the dislike-of-cuts default (maintainer, 23 Sep) - the
fairness condition for Phase 4.** The solver must cut about as much as the guardrails do, so Phase 4's
survival comparison is not bought with spending. Fitted on the tuning 41, never the held-out panel.

WHAT THE RECORDS ALREADY SHOW - derived from flex-tiers and 6f, no run. **Arm A must honour the same
floor the user set**, so the comparison is against the guardrails WITH the floor (`gkFloor`), not the
unfloored guardrails (a first draft of this section used the unfloored arm; corrected the same day):

    household   guardrails with floor:                        |  solver, resilience off (6f, fixed lambda):
                years below  depth  total cut  survival        |  years below  depth  total cut  survival
    S126           18.8      0.87     2.4       99.3          |     1.6       0.73     0.44      98.8
    S054           22.7      0.92     1.9       97.6          |     1.3       0.87     0.17      97.6
    S252           13.7      0.90     1.4       95.0          |     0.3       0.67     0.10      96.2
    S390           27.9      0.88     3.3       99.2          |     2.8       0.63     1.01      97.2
    S206           22.1      0.93     1.5       99.5          |     2.5       0.84     0.39      99.5
    S112           26.4      0.91     2.4       98.5          |     4.0       0.82     0.72      98.8
    (total cut = years below x (1 - depth), in years of target spending)
    across the 41, guardrails with floor: years below median 18.7, depth 0.85 to 0.94 (median 0.88),
    survival median 92.1% (70.9 to 99.9), 27 of 41 below 95%

**Three derived findings.**
1. **The two cut in opposite shapes and very different amounts.** The guardrails cut OFTEN and SHALLOW;
   the solver RARELY and DEEP. By total amount cut the guardrails cut 3 to 14 times more (median about
   5) - for about the SAME survival on these six. Matching therefore needs both of the solver's dials:
   the dislike-of-cuts level for the AMOUNT, the trim curve's exponent for the SHAPE (a steeper curve
   makes deep cuts dearer and spreads the same total into more, shallower years).
2. **The spending menu cannot reach the guardrails' shallowest cuts.** Below target the solver has only
   0.9 and 0.8, so its average depth is at best 0.90. The guardrails' depth is above 0.90 on 11 of the
   41 (up to 0.94). No exponent can match those. **Recommended, for the maintainer to confirm before K5:
   add a 0.95 level** - six levels, 432 actions, about 20% more solve time, in the app as well.
   Without it, K5 matches the total amount only and reports the depth gap.
   **Options weighed 23 Sep, maintainer asked to keep the cost flat by swapping the deepest cut for a
   lighter one.** Derived: the deepest level is not an ordinary menu item - it IS the user's floor
   (`spendLevelsFor` builds the menu down to the floor), and it is the solver's emergency brake in the
   worst markets. Dropping it would make the floor lever meaningless and cut survival exactly where
   the comparison is judged. Note also that the code's OWN default menu already carries 0.95 ("mirrors
   the gentlest move the guardrails make"); the research runs overrode it with LEVELS=1.2,...,0.8.
   **Recommended instead - six levels at today's cost:** add 0.95 AND switch the level scan to the
   ternary search already confirmed safe (5.0 million combinations, never worse). On six levels it
   evaluates about five, the same as today's exhaustive five. It brings that speed item forward from
   after Phase 4 into step 3, and needs the single-peak probe re-run on the six-level menu first (one
   solve, minutes). Fallback if single-peakedness fails on six levels: drop 1.1 rather than the floor,
   making raises one step (1.0 -> 1.2). **DECIDED 23 Sep (maintainer): six levels plus the ternary
   search. Measured the same afternoon:** the ternary search evaluates 4.00 levels a group on six levels
   - FEWER than today's exhaustive five - with 24 misses in 5.0 million, worst 0.009 survival points,
   under the pre-set 1e-4 line. The lighter cut is free, and the solve gets slightly cheaper.
   `results-probes-e1-unimodal.txt`.
3. **The guardrails raise harder than the solver**: about 16 years above target at a typical 1.29,
   against the solver's 20 years at 1.16, and 1.29 is above the solver's 1.2 cap. Phase 4's
   condition 2 (total spending delivered within 1%) already nets raises against cuts; K3's raise-cap
   screen should report this comparison.

METHOD: a grid of lambda x exponent {1.5, 2, 3, 4} on 12 households, then the chosen point checked on
all 41. Match (i) total amount cut, median household, within 10%; (ii) depth when below within 3 points,
where the menu allows it. PREDICTION: matching needs a much LOWER dislike of cuts than today's landings,
and an exponent of 3 or 4; at matched cutting the solver's survival rises above the guardrails', which
is the claim. **The ceiling is a smaller problem than first feared**: with the floor honoured, the
guardrails' survival has a median of 92.1% and sits below 95% on 27 of 41, so a 75-95% held-out panel
is easy to draw.

**K6. The dislike-of-cuts slider's spread**, centred on K5's matched value. Same method as K4. Lambda's
landed values span 400x and 0 reversals in 15 adjacent pairs showed a smooth, monotone response, so the
map is close to logarithmic in lambda.

**K7. Monotone and sane.** Raising dislike of cuts never adds trimmed years; raising the estate slider
never lowers the median end pot; nothing reverses anywhere. A reversal is a bug.


---

## Phase 4. The head-to-head, and the decision

**Designed by the maintainer, 23 Sep.** The product's claim is that fixed policies which never change,
and wrappers that are never rebalanced, give LOWER survival - and that for a household that would in fact
adapt, the current app's survival figure is unfairly pessimistic. **Holding survival equal would hide
exactly the thing being claimed.** So survival is the headline, not a control.

### The arms

- **Arm A, the current app at its best**: its own strategy search's winner, **guardrails ON and honouring
  the user's floor** (so it has a flexible spending method under the same floor as the solver), the
  one-off cost lookahead at its settled value. No tier changes - the app cannot make them, and that is
  precisely what is being competed against.
- **Arm S, the solver at the DEFAULT settings** the maintainer picks in step 6, with its dislike of cuts
  and trim curve **matched to the guardrails' cutting (K5)**, so both sides cut about the same amount and
  the survival difference is not bought with spending.

Both arms' full configuration is written into the results file before the first household runs.

### The panel, the seed, and the ceiling

- **Panel H, held out:** 40 households none of which has appeared in any tuning run (the clean 41 and
  every household used in 2c, 2d, 6b, 6c, 6e, 6f, #106 and Phase K are excluded by id). Half from the
  library, half from the FIRE cohort retiring at 52. **Gate 4 is judged on Panel H alone.**
- **Panel T:** the clean 41, run identically and reported beside it. **The gap between the panels is
  itself a result** - a much larger edge on T means the defaults were fitted to those 41, and the
  write-up says so whatever the gate says.
- **Seed 7003 at 3,000 paths**, reserved for this study and never used for tuning afterwards.
- **The ceiling.** Two arms both near 100% cannot be told apart. With the floor honoured the guardrails'
  survival across the tuning 41 has a median of 92.1% and is below 95% on 27 of them, so this is a
  safeguard: Panel H is drawn where arm A survives 75 to 95%, by the clean 41's band-selection method
  applied to arm A, with targets fixed before either arm runs.

### What is reported, for every household, median run and unlucky tenth

Survival (the headline) and the floor rate; total spending delivered; years at or above target; total
amount cut below target, and its depth; median and unlucky-tenth end pot; lifetime tax; changes of plan;
solve time. **Reporting rule: no survival or floor rate anywhere without the spending delivered beside
it** - a survival figure alone can be bought with spending.

### Gate 4

1. **Survival:** arm S higher across Panel H by more than noise, with a clear sign test.
2. **Not paid for in spending:** spending delivered not lower on average by more than 1%.
3. **No household badly worse:** none loses more than 1 point of survival, and none more than 5% of
   spending delivered.
4. **Robust:** the sign holds on the historical backtest and on all three perturbed engines of Phase 2c.
5. **Fits the product:** solve time inside Phase 7's worker budget.

**Pass on all five**: the maintainer decides whether it ships behind the Part C switch. **Fail on 5
alone**: the accuracy result stands; speed becomes the blocker. **Fail on any of 1 to 4**: the app is
untouched, and the write-up says which condition failed and by how much. **A condition that fails is
recorded and stopped on, not tuned until it passes.**

### Two diagnostics, reported, not gated

- **Arm S without tier changes** - splits the win into what flexible spending and draw order buy and what
  rebalancing risk buys, which is the product's own claim.
- **The equal-survival check on 12 households**: the solver landed to arm A's survival, judged on
  spending. It answers the sceptic's first question - a genuinely better plan, or a different point on the
  same trade-off? When landing, both arms carry the same insurance: arm A is landed to the same
  `ask + margin` the solver uses (the solver's +0.5 margin is load-bearing and is not removed to match).

### Prediction

Arm S wins survival on most households, most where the app's fixed tier is wrong for the household
(pension-heavy, long horizons); the no-tiers diagnostic keeps most but not all of the win; spending
delivered is within 1% or ahead because the guardrails cut harder in bad markets; and the edge on Panel
H is SMALLER than on Panel T, because the defaults were fitted there. **The size of that shrinkage is the
real result.**

**What this study cannot decide.** It compares the solver against THIS pipeline on THIS library. It does
not show the solver is the best available method, only that it beats what ships, on households like these.

---

## Part C. The app (phases 7 to 12), behind a switch

A module constant `const SOLVER = false` beside `SHOW_INHERITANCE` in `src/App.jsx`. Everything in
Part C is gated on it, so main stays shippable throughout and beta users can be flipped to compare.

### Phase 7. Plumbing: worker, state, staleness, locks

- `src/solverWorker.js` (the `mcWorker.js` pattern, with `workerShim.js` first). Messages: `solve`
  with the plan and the years to re-solve, `progress` per year, `done` with the tables as transferable
  buffers. The app keeps `solveState: 'idle' | 'solving' | 'solved' | 'stale'` beside `solveMeta`.
- Every plan edit computes the earliest affected year (a small pure function `firstAffectedYear(prev,
  next)` in `src/solver/diff.js`) and either marks the tables `stale` and re-solves from there, or does
  nothing for a balance-only edit.
- **Locks**, `plan.solver.locks`, normalised in `normalizePlan`: per wrapper `contribution: 'free' |
  'fixed'`, `pensionBefore: age | null` ("do not draw the pension before"), `tierCeiling` per wrapper,
  `lumpSum: 'free' | 'never' | 'now'`. Locks shrink the action set in `model.js`; they never add
  actions.
- The solver chunk is a lazy `import('./solver/index.js')`, and `load-perf-ui.cjs`'s 220 KB ceiling
  stands.
- Tables are cached in IndexedDB under the plan hash so reopening the app does not re-solve; the cache
  is cleared when the model version changes.

### Phase 8. Config

Removed from the tab (the fields stay in the saved plan for the baseline and for import of old
exports): decumulation policy, drawdown strategy, harvest switch and ceiling, the lookahead field, and
the whole policy search block with its results and trade-off cards (lines around 12810 to 13060 today).
The bridge safety margin becomes a solver constraint, "hold at least this much liquid before access",
or is removed; recommendation: keep it as a lock.

Kept: guardrails (with the note that the solver assumes them off and the projection applies them on
top), cash buffer, returns and CMA presets, tax region, valuation date, inflation, solvency floor,
death-tax rate, number format.

Promoted: the user's levers from the Fixed requirements move to the top of the tab under "What the
solver aims for": the two sliders (dislike of spending cuts; estate priority), each measured against
survival, which is the fixed anchor; the minimum end-of-life pot with its default; raises allowed, capped
or blocked; block trimming; and consent to change investment risk. Each re-solves.

Added: a "What the solver may change" card holding the locks, one row per wrapper plus the pension-age
and lump-sum rows, with the equity ceiling per wrapper beside the tier from Plan Inputs.

### Phase 9. Strategy: one comparison, and what to do

The tournament, its players, the evolver and `data-strategy-card` go. The tab becomes, top to bottom:

1. **The comparison.** Your plan against the solved plan: survival, median and unlucky-tenth pot,
   lifetime tax, bequest net of death tax, each with the delta. "Your plan" is the baseline: the
   contributions as entered and the plain sequential draw order, or the policy an old export carried.
2. **This year's actions, per person.** A short list in the playbook vocabulary (`phraseFor`): "Pay
   £X into the pension and £Y into the ISA", "Draw the pension up to the basic-rate limit and re-wrap
   £Z into the ISA", "Move the ISA to the Medium tier". Each with the survival cost of skipping it,
   read from the table by valuing the next-best action.
3. **The rule of thumb.** A decision tree fitted to the policy (`src/solver/distil.js`, CART on the
   action table with depth 3), printed as the instruction sheet's steps, with its fidelity: "following
   these rules instead of the table costs 0.4 points". The printable sheet in `actionPlan.js` gets the
   same content.
4. **What changes over time.** A compact year-by-year action strip for the next ten years under the
   expected path, from the audit rows' `action` codes.
5. **Come back next year.** The line that says the plan is state-dependent and is re-solved from real
   balances.

`diffStrategyPlans` and `summarizeStrategyChange` survive for the comparison; `buildTournament`,
`resolveSearchPlayer`, `accumulationCandidate`, `bedAndSippFor`, `solveEscalation` and `evolve.js`
are removed from the app once the switch is on for good (Phase 12), and stay in `research/` as the
baseline's tooling until then.

### Phase 10. Projection, Simple, scenarios, audit, historical

- **Projection** runs the solved plan and reports it as the headline, with the baseline's survival
  beside it in one line ("as you are now: 71%"). The reporting rule applies throughout: no survival or
  floor rate anywhere without the spending delivered beside it. The run card gains a solve state and a progress bar;
  the guardrail note stays; the lookahead note goes.
- **Quick dials** read the table (Phase 6's spend dimension), so they stay instant; the retirement-age
  dial still re-solves, with the progress bar visible, unless the age table has been pre-solved for
  ±3 years, which is the recommended default.
- **The Simple page** switches its safe spend and safe age to the table once Phase 6 lands; until then
  it stays on `optimizeSpend` and `safeRetirementAge` unchanged.
- **Scenarios** each carry a solve; the overlay and the comparison table show a solving pill per
  scenario and compare solved outcomes.
- **Audit Data Table** gains an "Action" column from the row's code, replacing the guardrail and
  set-aside columns' role of showing what the rule did (the guardrail column stays while guardrails
  exist).
- **Historical backtest** is labelled the out-of-model check: "the policy was solved for the return
  model; this is how it would have fared on the actual sequences".

### Phase 11. Phone

- Solve in the worker with a coarser grid (14 points) and a visible progress bar on the run card; never
  block the UI.
- The Strategy tab's five blocks become the phone deck's slides, with this year's actions first.
- The locks card folds by default.

### Phase 12. Words, docs, tests, rollout

- **Rename pass:** "tournament", "player", "policy search", "entrant" leave the UI, the copy manifest,
  `Docs.jsx`, the README and the harness names. The glossary gains "solved plan", "your plan",
  "locks", "rule of thumb".
- **Documentation:** a new card, "How the solver decides", replacing the policies, tournament,
  guardrails-as-decision and lookahead explainers; the guardrails card stays as a spending rule; the
  coverage card lists the reduced model's approximations verbatim from Phase 1.
- **Tests retired:** `entrants.test.mjs`, `evolve.test.mjs`, `lookahead.test.mjs`, the tournament
  half of `escalation.test.mjs`, the search half of `policy.test.mjs`; **harnesses retired:**
  `tournament-ui.cjs`, `tradeoffs-ui.cjs`, `priorities-ui.cjs`. **Replaced by:** the three solver
  test files from Part A, `solver-couple.test.mjs`, `distil.test.mjs`, and harnesses
  `solver-strategy-ui.cjs` (comparison, actions, rule of thumb, fidelity figure, print sheet),
  `solver-config-ui.cjs` (removed fields gone, locks shrink the actions, prioritisation switch is
  instant), `solver-progress-ui.cjs` (stale and solving states, phone progress, balance edit needs no
  re-solve). `run-all.sh` updated; the 220 KB and typing-latency ceilings unchanged.
- **Rollout:** `SOLVER = true` for beta once the full suite is green with it on and off; two weeks of
  both paths shipping; then the retirements above and the switch removed.

---

## Known, recorded, and NOT planned

Everything here is a deliberate non-decision. It exists so that none of it is later
mistaken for an oversight, and so that anyone who notices one of these can see it was already seen.
**Nothing in this section is scheduled. Each entry says what would have to change for it to be.**

### 1. Out of scope by design, not by omission

| | |
|---|---|
| **Mortality** | No death probabilities. The horizon is a fixed plan-to age. A maintainer constraint, not a gap. |
| **Annuities** | Not modelled, not compared against. |
| **Regime belief** | No view that returns depend on a hidden state. The three-world mixture is uncertainty about the MEAN, which is a different and weaker claim. |
| **Contributions** | `contrib: null` - the solver does not choose what you save. Accumulation is taken as given. |
| **Retirement age** | Solved separately by the app, not by the solver. |
| **Lump sum vs phased** | Read from the plan, never chosen, despite being a large real decision. |

### 2. Constants never swept, and where each would go if it were

| constant | what it decides | status |
|---|---|---|
| trim curve exponent, 2 | one deep cut or several shallow ones | **fitted in K5** to the guardrails' shape |
| lambda (dislike of cuts) | how much is cut | **a user slider; default fitted in K5, spread in K6** |
| `mu = 0.003` (raise credit) | how readily good years are spent | unswept; K3 screens the raise cap, which bounds it |
| `SWITCH_COST = 0.0025`, `SWITCH_MARGIN = 0.001` | the price of changing risk tier | unswept, set by argument |
| gain buckets `[0.05, 0.25, 0.55]` | how finely capital-gains tax is tracked | **6e checked these and they stand** |
| search paths 5,400 | sampling noise in any landing | #108: 2,400 fails, 5,400 works; only landings use it now (K5, Phase 4's diagnostic) |

### 3. Measured, understood, and deliberately not acted on

- **The lump-taken flag.** The shipped grid reads a household that has spent part of its tax-free lump
  as having spent none. Measured on all eight affected households: **changing it moves nothing.** And
  the "fix" swaps a wrong flag for a wrong figure - 7.1% of allowance used would read as 50% instead of
  0%. Not a correction, a different approximation. `pclsStrict` stays in the code defaulted off, with
  its gate, so the next person to notice can test it in half an hour.
- **Gross against net.** See the resolved-mismatch list: needs a synthetic fixture first.

### 4. Gates recorded as NOT passed, and left that way

- **6b condition 1b** - the over-trim guard failed as written on 9 of 41. Seven of the nine took no
  trimming at all, at the top of the bracket, so the guard's own reasoning did not apply to them. **The
  condition was not rewritten after the fact.**
- **6c** - the soft bequest shoulder failed on its control, S390, whose estate sits at 97% of its bend
  and which was therefore never a control. Its clause had already been corrected once with partial
  sight; **a second re-specification with full sight was refused.** `soft` stays off.

### 5. Open questions

- **#109, single-household probes at the frontier** - its first target list is answered: the phase-2
  losers no longer lose (no household behind on floor rate by two standard errors in flex-tiers). The
  remaining probes run after Phase 4, as recommendations only.
- **The tolerance window** - a maintainer decision, relevant only where a landing remains. The +0.5
  margin is load-bearing (the worst held-out shortfall was -0.47); the window above it is discretionary.
- **41 households, no power analysis.** Fine for "41 of 41" claims, weaker for mean differences.
- **The eight-year bridge households** (retiring at 50) could drift past a 0.8 pension share on a bad
  path, into #106's zone, later in the bridge; a t = 0 read cannot test it. Covered once the
  interpolation fix lands, since the fix is general.

### 6. The boundary with the shipping engine

The projection engine is settled and in production, and this plan touches it only through the `table`
override. Settled there and **not** this project's to revisit: UK income tax with the personal-allowance
taper and the Scottish and Welsh bands; Class 1 and Class 4 NIC with salary sacrifice and employer
pass-through; the pension rules (PCLS, Lump Sum Allowance, annual allowance with taper and carry-forward,
MPAA, relief at source); ISA allowances and the Cash ISA wrapper; realisation-based CGT; savings-interest
and dividend tax; state pension timing; the pre-access bridge; spending bands; one-off deposits and
costs; Guyton-Klinger guardrails; the one-off cost lookahead; and the Monte Carlo percentile calibration
that reproduces BlackRock's published figures. Inheritance is built and switched off.

**The solver must not change any of it.** Phase 3's gate exists for exactly that: the table override is
exact to the pound against the engine's own arithmetic.

---

## Decisions in force that the maintainer may want to overrule

- **The baseline "your plan"** in Part C is the contributions as entered plus the plain sequential draw
  order, not the best of the old policy search, because the comparison is what you would do without the app.
- **The bridge safety margin** survives as a lock rather than being removed.
- **The retirement-age dial pre-solves +/-3 years** rather than making age a dimension.
- **Old exports** keep their policy fields and import as the baseline; nothing is migrated.
- **Habit** (a cut hurting more after a cut) is left out; it needs last year's spend as state.
- **The cash buffer** stays sized on the planned target rather than the chosen spend, which keeps cash out
  of the grid.
- **If couples by rollout ever fail**, the reserve is model-predictive control; not preferred.
- **E3 and E4 were taken before 6d** at the maintainer's decision, 22 Sep, against my recommendation; E4's
  measurement killed it, E3 now follows Phase 4.
