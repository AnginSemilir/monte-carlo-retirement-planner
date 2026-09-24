# The solver: a state-dependent plan in place of players and policies

*Plan of record, rewritten in full 23 Sep evening so that it holds only the CURRENT design. Completed work
is summarised in "Where things stand" below and kept in full, verbatim, in `PLAN-HISTORY.md`. Designs that
were superseded before they ran are not kept; they are in git history (this file at commit af670e8 and
earlier). Nothing in the app changes until Phase 4's gate passes.*

## THE METHOD, AND THE RULE ABOVE ALL OTHERS: MATHS IT, TEST IT, THEN RE-MATHS THE REST (maintainer, 24 Sep)

The work runs as a loop: **derive -> predict -> run -> settle -> re-derive everything downstream -> predict again.**
The first half (derive, and write the prediction before the run) is the rule in "Derive first, run to falsify"
below. **The second half is this: after every run that proves or disproves something, that result becomes the
basis for looking again at every later step in the plan, at the maths behind it, and at its prediction. They are
adjusted before the next run starts, not after.** A plan that runs its schedule unchanged after a result that
should have changed it is running on assumptions that have already been disproved.

**What counts as proved or disproved.** A result is settled only when all of these hold:
1. **Beyond noise.** A difference beyond two paired standard errors on the held-out paths. Or a deterministic
   check that could have failed and did not: bit-identity, a rule held on every path-year, an in-model bound.
   A result within noise settles nothing, except that the effect, if there is one, is smaller than the noise.
2. **Produced by a script from the files, not read by eye.** Every figure that changes the plan comes from a
   reducer or a one-off script over saved results, and that script is kept.
3. **Checked against my own error range.** I am a language model, and my errors are of known kinds. This
   session alone made each of these:
   - an arithmetic slip in a derivation (the M15 v2 rung table's first figures);
   - a wrong assumption about the data (that S162 had no minimum pot of its own; that a tier above High exists);
   - a mechanism that was right in part and missing a piece (the first M15 write-up missed the switch margin);
   - text left stale after the facts moved (the mathematician's page).

   So before a result changes the plan: recompute the derivation with a script, check every quoted figure
   against the file it came from, and test the mechanism with a check that could have failed (the M15
   diagnostic is the model). A result that has not been through this is marked "provisional" and changes
   nothing downstream.
4. **The prediction and its falsifier were written before the run.** A result read without one is a finding
   to be predicted and tested next, not a settled fact.

**What the re-look does, every time.** For each settled result:
- (a) List every later step, prediction, gate and default whose premise it touches, including ones in other
  sections.
- (b) Re-derive the maths for each, from the files where possible, with no new run.
- (c) Change the plan in place: a prediction re-derived, a stage made conditional or cancelled, a design
  corrected, a question sent to the mathematician, or a decision put to the maintainer.
- (d) Log it in the re-look ledger below (one row per result: what settled it, what it changed, where).
- (e) Update the mathematician's page and any affected artifact the same day.

**The re-look ledger**

| date | the settled result | what it changed |
|---|---|---|
| 24 Sep 06:30 | M15 probe (falsified), M17/M18-floor, K2-K4, and the diagnostic of the M15 mechanism | R1-R10 in "the maths reassessed": M15 v2 made nested; M22 and the third-step sibling; M23 (gate 4's spending condition at risk, a maintainer decision); K5 stage 2 made conditional; K6 and K7 restated in c; Phase 4 reconfigured and its prediction re-derived; Q12 |

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
plain language **as it stood before the 23 Sep scope changes** (it still describes the floor landing and
resilience; rewritten with Part C Phase 12's documentation). The mathematician's page (the artifact
"Drawdown by Dynamic Programming") is the current layer-by-layer description.

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
| **estate priority, 0 to 100%** | how much the pot left above the minimum matters against everything else. One user-facing level; internally it sets BOTH the credit's weight and how steeply each extra pound's credit diminishes | **NOT BUILT (found 23 Sep).** Today: a fixed weight 0.02 on `min(net, 4K)` - every pound from ZERO (not from the minimum) counts the same up to the cap, then nothing. No diminishing curve, no level | **yes - a user level, agreed 23 Sep.** Moving it changes survival and other results, and that is the user choosing priorities, not a bug. **Phase K4's job is the SPREAD** (corrected 23 Sep plan review: this said K3, the raise cap): equal steps on the level must give roughly equal steps in outcome - 10% must not already have swung hard toward the estate, 100% may cost a lot |
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
| **pension harvesting** | drawing pension BEYOND the year's need, up to the personal allowance or the basic-rate limit, and re-wrapping it into the ISA (then the taxable account). Band filling for income tax, not capital-gains harvesting (corrected 23 Sep plan review; capital gains are realised only by the draws themselves) |
| **risk tier** | the pension and the ISA moved TOGETHER, by the same step (0/0, 1/1, 2/2 below the plan's tier; independent pairs were measured to add nothing), paying `SWITCH_COST` and having to beat `SWITCH_MARGIN` (corrected 23 Sep plan review: this said independently) |
| **spending level** | 1.2 / 1.1 / 1 / 0.95 / 0.9 / floor - **down AND up** (six levels, decided 23 Sep; the lowest is always the user's floor). The solver raises spending in good years unless the user caps or blocks raises |
| **how the level is found** | **the full scan of all six levels (decided 19:45 by the rule written before the re-check).** The ternary search lost 0.20 points on S112 and S390 at 2.4 paired standard errors with the exact final year, and gained on none, so it is out. Cost: about 35% more solve time than ternary, and six levels now cost about 20% more than the old five - **the maintainer's "six levels at today's cost" no longer holds** |

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
- **The value table is never a reported number.** Every survival, spending or pot figure a user sees
  comes from simulating the plan. Phase V showed the table's own reading is off by several points and
  does not converge at practical sizes, while the plans it produces are stable (23 Sep).
- **The maintainer decides whether the solver ships.** Running Phase 4 and writing its verdict is the
  end of this plan's remit.

---

## The rule that comes before the conventions: DERIVE FIRST, RUN TO FALSIFY

*(The first half of the loop at the top of this file. The second half, re-deriving everything downstream after
each settled result, is the headline rule.)*

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

## Where things stand (23 Sep, updated 21:30)

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
| numerical convergence (Phase V) | plans stable, table numbers not (optimistic 2-3 points, not converged at 56 points); judged on simulation, decision A | `results-phase-v.txt`; full text in history |
| step 2 and its re-check | the final year read the nearest cell's move (M10) - fixed, survival up on 9 of 12; ternary OUT (-0.20 at 2.4 se on two households, none better); 15 nodes no better than 5; 56 points within half a point either way (one household outside, noise-shaped); no #106 option passed | `results-step2.txt`; full text in history |
| the ranking check (2b) | at 479 positions the plan reaches, the table's first and second choices mostly do the same thing (387 identical); where they differ in survival it is a coin toss (8 better, 8 worse), none beyond noise, worst 0.6 points. No tie-break, rollout or cliff points. Clear-margin positions were never sampled, so that part of the prediction is untested | `results-ranking.txt` |
| K1 honouring | every rule the user can set (no cuts, no raises, a raise cap, no cuts with raises, no risk change, a minimum pot) held on every path-year of 24 records | `results-k1.txt` |
| the table's calibration (M16) | along the paths the plan takes (1.5 million positions, 12 households) the table ranks positions in the right order and is right at both ends, but is 3-5 points too hopeful between 50% and 95% (up to 10 on S070), household by household differently; S126's year-0 read is 38.5% against 99.8% simulated (#106). The table stays out of every reported number | `results-calibration.txt` |
| K2, the minimum end pot | a 1-year pot costs almost nothing (median survival -0.1, fully funded -0.8 points) and lifts the unlucky tenth from 4.5 to 5.7 years; 3 years costs thin households up to 4 points; the buffer is kept partly by CUTTING in bad paths (falsifier fired on S206, S390, S126), not only by raising less. Six library plans carry their own pot, which the screen replaced | `results-k-screens.txt` |
| K3, the raise cap | 1.1 leaves half the extra spending at no survival cost (held on 11 of 12); blocking lifts end pots 1.3-4.3x the extra spent but survival only 0.1-0.4 (the 0.5-2.5 prediction failed); S070's extra cutting was resilience's removal, not raises (falsifier fired). **Blocking raises makes low-lambda households cut in up to 30 years** (M19) | `results-k-screens.txt` |
| K4, the estate credit | nothing moves spending or survival below w = 0.03, but **w = 0 pays far more tax** (M20); most of the response is between 0.1 and 0.3; at 0.3 x scale 4 the estate comes first (median spending 1.025) and survival falls up to 3.2 points (prediction (iv) falsified); the slider's top is not yet found | `results-k-screens.txt` |
| the purpose test (M18) | at 160 positions on 8 households (half on the cliff), the solver's pick is the best-surviving of its top six distinct moves within noise at 159; the table's order tracks simulation; a small lean toward caution in comfortable positions. **Re-run with the M17 floor fix on: passed again** - 158 of 159 within noise, mean -0.01; where a rival is ahead it is by spending less at 2 of 14 (was 10 of 23) | `results-bestof.txt`, `results-bestof-floor.txt` |
| failing futures (M17) | the solver overspent and held maximum risk before running out because the trim penalty stops when the money does; the floor charge fixes it (raises before failure 82-89% -> 6-11%, survival up 0.2-0.9, years without money down 20-40%, 2-5 more years below target) | `results-m17.txt` |
| risk above the user's tier (M14) | with the plan at Medium and one tier up allowed: survival up 2-3 points on the thin households, only ever used when behind, the tail not worse; comfortable households barely use it | `results-m14.txt` |
| the S126 anomaly (#106) | confirmed: a dead corner in log-odds on a SHARE axis; only S126 of the 41 is in the class at t = 0. **Still open (step 2):** neither fix passed; without one S126 holds its pension off-tier for 40 years, with `drop` 9, a 38% larger median pot, a 74% smaller unlucky tenth, 0.3 points less survival. It changes the plan's character; put to the maintainer and the mathematician (Q5) | `results-106-deadcorner.txt`, `results-step2.txt` |
| E4, interleaved value arrays | dead: 3.8% slower | `results-part-e-measured.txt` |
| E1, seeding from next year's move | **re-read from step 2's full-width stored moves, 19:20: not built.** The best candidate set (41 of 432 moves) covers 97.72% of this year's best moves across 4.1 million retired cell-years, against a 99.5% bar; the corrupted first read said 98.68%. Prediction (98-99%, verdict stands) held on the verdict, slightly low on the figure | `results-e1-records.txt` |
| single-peakedness in level | measured over 5.0 million combinations (24 misses) on an earlier configuration; on step 2's households the ternary search was not bit-identical and lost 0.20 points on two, so it is **OUT** (M11); the full scan is used | `results-probes-e1-unimodal.txt`, `results-step2.txt` |
| the lambda curve | cancelled: answered by algebra (a Lagrangian relaxation; 0 reversals in 15 pairs) | history |
| 6c, the soft bequest shoulder | not passed on its control, S390; not re-specified | history |

### What removing the survival target saved (derived from the flex-tiers records, no run)

A landing searched the trim penalty: each step is a solve (314 s) plus 5,400 forward paths to measure
the floor rate (373 s), and the flex-tiers landings took 3.46 steps on average (18 of 41 needed one; the
23 that trimmed needed 5.4). Without a target a plan is ONE solve plus one forward run for the reported
figures (3,000 paths, ~207 s):

| | before (landing) | after (one solve) | faster by |
|---|---|---|---|
| average household | ~2,580 s | ~520 s | **about 5x** |
| households that trim | ~3,920 s | ~520 s | **about 7.5x** |
| households needing no trim | ~890 s | ~520 s | about 1.7x |

Research timings (three-world mixture, 30 points, one core); the ratio carries to the app. Cutting the
reporting run to 1,000 paths in the app makes the average about 6.7x. **Corrected 21:30:** these timings
are for five levels. The sixth level with the full scan (the ternary search failed its re-check, M11)
makes the solve about 20% dearer - about 380 s - so a plan is about 590 s and the saving about 4.4x on
average (6.6x for households that trim). **The solve is now almost the whole cost**, which changes what the
speed work is worth - see "After Phase 4".

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

### Findings from the method audit, 23 Sep evening - each with its action and slot

Found while writing every calculation of the solver into the mathematician's page (the artifact
"Drawdown by Dynamic Programming"), reading the source line by line rather than from memory. None
changes a result on file; four need work before something downstream is trusted.

| # | finding | why it matters | action | slot |
|---|---|---|---|---|
| M1 | **The code's defaults are still the OLD objective.** Bare `solve()` means resilience 0.5, the full level scan, no raises (raise weight 0, menu from `spendLevelsFor`: 1 / 0.95 / 0.9 / 0.8 / floor), the capped estate credit, and no #106 fix. Every research run sets the new baseline explicitly through its flags, so no result is affected. | Anything that calls `solve()` without those flags - the app in Part C, or a script that forgets one - silently gets the old objective. The step-2 `today` arm relies on the 0.5 default, so it would change if the default moved underneath it. | **Revised 18:45 after scoping:** 14 test suites call `solve()` on its bare defaults, so flipping them would break every one for no gain. Instead a single product entry point, `solvePlan()`, carries the decided baseline (resilience 0, six levels, raise weight 0.003, ternary search, the chosen `shareDead`; the estate curve and minimum pot join after step 6), and the app calls only that. `solve()` keeps its historical defaults, documented as the research engine's and never the product's. Gate: `solvePlan()` equals `solve()` with the same options written out, bit for bit. | **done 18:47**: `solvePlan`, `solver-plan.test.mjs` 10 passed |
| M2 | **DONE 21:13: K1 passed on all three arms** (`results-k1.txt`). **K1 tested the rules only at their extreme.** With trimming AND raises blocked the menu has one level, so "no cut" passes trivially; a raise cap between levels, and block-trimming alongside raises and tier changes, were never exercised. | K1 is the only check that the user's rules hold. | **Done:** `batch-k1.sh` gains `k1-cap` (cap 1.1, trimming allowed, tiers on) and `k1-block` (block trimming, raises allowed, tiers on), 6 households each, all with a 3-year minimum pot; `check-k1.mjs` checks each arm against its own rules. K1 becomes about an hour. | K1 |
| M3 | **Pension draws are only ever tried at the tax corners** (the allowance, the basic-rate limit, unlimited). The argument (tax is linear between corners) is exact only if the value of next year's position is linear in the amount drawn along a stretch; it is curved. Amounts between corners have never been searched. | An assumption every household's plan rests on, never measured. | A table-only probe: at positions the plan reaches, score draws at 25 / 50 / 75% of the way between the chosen move's corners with the one-step lookahead; simulate any that beat the corner by more than 0.1 points. PREDICTION: rare and sub-point, since over one year's draw the continuation value is close to linear. FALSIFIED IF an in-between draw beats the corners by more than half a point in simulation on any household. About 2 h to build (custom-ceiling moves in a probe copy), 30 min to run. | after Phase 4 (or a free Thursday gap) |
| M4 | **The couples rollout has three gaps.** Its value omits the trim table, so it never weighs cuts; the year's spending level comes from the first person's move only; its expectation hard-codes five nodes and ignores `quadNodes`. | Couples were validated under the old objective, where the trim penalty was landed per household; under the dislike-of-cuts slider the rollout would ignore the slider. | Fix all three before the couples re-validation; added to the mathematician's question 9. | "Couples under the new objective", after Phase 4 |
| M5 | **The Phase 4 power statement was loose.** With a per-household spread of 0.82 points, the edge detectable at 80% power is 2.80 x 0.82/sqrt(40) = **0.36 points**; at 0.4 the power is about 87%. | The panel is stronger than stated; no change to its size. | Text corrected below. | done |
| M6 | **The landings run five bisection steps, not eight.** The derive-first section says eight suffice; `experiment.mjs` defaults to five, leaving the bracket ratio at 1.21 (eight would leave 1.024). | Only two landings remain: Phase 4's equal-survival diagnostic and any K5 landing. | Run those with `BISECT=8`: three more solves per landing, about 45 minutes on the 12-household diagnostic. | Phase 4 diagnostic |
| M7 | **RESOLVED 21:00: not needed - 2b landed in its "nothing" row.** **Step 2b's first remedy already exists.** `tieMargin` (among moves within a margin of the best, take the least tax this year) is in `chooseAction`, off, measured on the old grid at +1.5 points on S070 and -0.5 on the largest wins. Richardson extrapolation (`rich`) also exists - **corrected 21:30 (plan audit): it WAS measured, in Phase 2c's smear batch on the old per-pot grid (S070 and S342, 24 + 12 points), and "moved nothing beyond noise" (`ledger-smear-fixes.txt`, history line ~391); never measured on the total-wealth grid.** | If the ranking check calls for a tie-break, it is a re-measurement, not a build. | Re-measure `tieMargin` on the new grid if 2b's result calls for it. | after 2b, only if needed |
| M8 | **The minimum pot is tested on the GROSS pot**, the estate on the NET (after pension death tax). Dormant: every library household has a zero death-tax rate. | With a minimum-pot default the product now has a user-visible number whose meaning depends on this. | The copy says "before any tax on the pension at death" until a synthetic fixture tests the net version. Put to the maintainer with the step-6 defaults. | step 6 |
| M9 | **The questions for the mathematician now have owners.** Q1 (does monotonicity survive an approximate solver) before K7; Q2 (fitting two dials to a stepped response) before K5; Q3 (a path for the estate slider) before K4's fit; Q4 (why the choice is stable) alongside 2b; Q5 (drop's discontinuity) only if step 2 picks `drop`; Q6 (noisy rollout) only if 2b calls for rollout; Q9 before couples ship; Q7, Q8, Q10 not blocking. **Updated 21:30:** 2b needed nothing, so Q6 is moot; step 2 picked neither #106 option, so Q5 is the open defect's question, not a precondition; the ternary search is out, so Q10 is withdrawn (removed from the page); Q4 now also bears on the calibration curve (M16). **24 Sep 02:15:** Q4 is no longer blocking (2b and M18 found the choice right within noise despite M16's bias); **Q11 added - is a year with no money priced correctly (M17's floor charge, or a terminal penalty tied to the survival weight)? - needed before K5**, which re-matches lambda with the fix on. | Nothing tonight waits on an answer; K5 on Thursday is the first step that could. | Send the page when the maintainer has shared it. | - |
| M10 | **The final year read the NEAREST CELL's stored move** - the one read `chooseAction` exists to avoid. Found from the step-2 records at 18:43: all 53 paths S206 lost at 56 points, and 27 of the 28 S390 lost under the ternary search (plus all 8 it gained), failed in the final year from a near-empty position. On 300 random final-year positions of S206 the nearest-cell move fails outright on 81 where a paying move exists. | It affects every simulated result on file in its last year, and it decided both step-2 gate failures. Paired comparisons share it, so their direction mostly survives; absolute survival is slightly understated on thin households. | **Built:** `finalExact` scores the final year's moves at the true position against the same end-of-plan rule the backward pass applies at t = T. Off by default (bit-identical, tested); on in `PRODUCT_BASELINE` and in every run from here (`FINALEXACT=1`). `solver-final.test.mjs`: tables untouched, the choice is the exact argmax on 300 positions, never a failing move when a paying one exists. The two failed comparisons are re-run with it on (`batch-step2-recheck.sh`); the failures stand as recorded. | before 2b |
| M11 | **RESOLVED 19:45: ternary OUT.** **The ternary search is not bit-identical where it "finds the peak".** In a year with no spending every level scores the same and the search never evaluates level 1, so it stores a different, equivalent move (all 9,720 year-0 cells on four working households). Separately S112 lost 8 paths (0.27 points, 2.8 se), none in the final year: a genuine miss. | The probe's "24 misses in 5.0 million" was on a different configuration; stored moves differ from the full scan on 2-48% of cell-years here, mostly harmless ties. | Judged by the re-check: if the ternary gate passes once the final year is exact, ternary stays; if not, downstream runs use the full scan (+35% solve time) and the six-levels-at-today's-cost decision is reported back to the maintainer. | re-check |
| M12 | **The solver's handling of one-off COSTS has never been tested on a single household.** Found 23 Sep 20:30 answering the maintainer. The library puts a cost (6% of wealth, always 3 years in) only on its 210 couples; its 210 singles have none. So the 41, the 12 of step 2, Phase K and Phase 4's panel H (singles only) contain no cost at all. The arithmetic is exact (the golden test has a large cost, worst difference £0.00); the DECISIONS around a cost are untested. Also: a cost is paid in the same draw order as that year's living spending (`costSteps: steps` in `buildActions`), although the model and the app's policies allow a separate cost order - a large cost can push a year's pension draw through a band on its own, which is why the app keeps them separate. | The solver replaces the app's lookahead rule (draw early within the basic-rate limit, park it) on the claim that it "sees the calendar" and can do the same with its harvest move. That claim is plausible from the maths and unmeasured. | **Probe M12** (written before any run): step 2's 12 households plus a cost of 10% and 30% of opening wealth at retirement + 3 and + 10 years (48 cells), solver against arm A with the lookahead at 5, paired, 3,000 paths. PREDICTION: the solver is no worse than arm A on survival beyond noise on every cell, and pays less tax in the cost year on most; FALSIFIED IF any cell is worse by more than two paired se. If falsified, a separate cost order joins the move set in the cost year only (x8 moves in one year, not every year). | after K5, in a run gap, ~2.5 h |
| M13 | **Where a deposit goes is fixed before the solver runs.** A deposit's wrapper is the user's choice or, marked "Auto", the plan's policy's deposit order (pension, ISA, taxable, cash: the first with room this year); what does not fit lands in the taxable account and is moved in over later years as allowances allow. All of it is set by `buildContext`, so the solver plans around a deposit but never chooses its wrapper. Separately, the top of the wealth axis is set from opening balances only (`max(60, 6 x opening)` years), so a very large later deposit can land above the grid. | Routing is a real decision (the engine's own note calls it worth more than most contribution decisions) that the solver is not making. The grid top matters only for a windfall several times the opening wealth. | Recorded, no run tonight. Routing as a solver move is a design question for the maintainer (it is a one-year decision, so it would cost little). The grid top: check `buildGrid` against the largest dated deposit when E3 is built. | maintainer; E3 |
| M14 | **Allowing risk ABOVE the user's tier: what a survival objective does with it.** Maintainer's question, 23 Sep 21:00: would up-moves be gambles, given each move is averaged over five markets? Toy (`toy-tier-up.mjs`, `results-toy-tier-up.txt`: one pot, the app's tier returns, 5-node average, backward induction, user tier Medium, 30 years): up-moves are NEVER chosen above 90% survival and 30-76% of them are made below 50% - the averaging is what makes spread attractive when behind (survival is convex in wealth below the cliff). Survival rises a lot (4% withdrawal 88.8 -> 93.4; 5%: 51.2 -> 72.9; with cuts 78.4 -> 84.2) and mean years unfunded falls in 5 of 6 cases, but the tail worsens: running out before year 20 rises in 4 of 6 (5%: 8.5 -> 13.5%) and the worst 5% are funded 2-3 years fewer in 5 of 6. A charge of 0.02 per unfunded year barely changes this. Side result (toy only): with cuts, a hopeless position chose LOW risk and no cut - nothing rewards lasting longer once survival is near 0, and failing sooner avoids trim charges. | The ceiling is a values trade, not a pure consent question: more households make it, those that do not run out sooner, and the moves come exactly when a plan is in trouble. | **Probe M14** on the real solver (written before any run): 12 step-2 households, tiers allowed one above the plan's, research only. PREDICTION: up-moves only below 90% survival; survival up; run-out-before-year-20 up on most. FALSIFIED IF up-moves appear in comfortable positions or the early-ruin rate falls on most. Product question for the maintainer: an opt-in "may take more risk than my setting", shown with the early-ruin figure beside survival. Also check the hopeless-position behaviour on the real records. **Built 00:55 (research only):** `tiersAbove` appends the tiers above the plan's after the ones below, so the joint step pairs like with like; `PLANTIER` holds pension and ISA at a chosen tier in the plan. **Needed because every library household holds its pension at the TOP tier (M21)**, so no library plan can go higher. Check on S070 at Medium, 8 points: off bit for bit; on, 576 moves and 21% of cells choose one above. `batch-m14.sh` (12 households, plan at Medium, down-only against one above), `reduce-m14.mjs`. **PREDICTION (00:55, before the run), from the toy:** survival up on most (by 1-10 points on the thin ones); running out within 20 years up on most; the worst 5% funded fewer years on most; and at least three quarters of up-move years fall in states BEHIND the year's median wealth. FALSIFIED IF up-moves sit mostly ahead of the median, or early ruin falls on most. **PROBE DONE 02:25 (`results-m14.txt`):** survival up 2.1-2.9 points on the four thin households (5-7 se), years without money down about 15%, up-moves made only when behind (99.7-100% of up-years below the year's median wealth); the tail did NOT worsen (early ruin and the worst 5% unchanged) - the toy's tail result did not carry over; the comfortable eight barely use it. Prediction: thin-household survival and "only when behind" HELD; "on most", early ruin and tail NOT held; no falsifier fired. **The maintainer's intuition held better than the toy.** Still a consent question for the product. | maintainer |
| M15 | **The taxable account (GIA) never changes tier** - Phase 6 left it at the plan's tier because a switch there can realise gain, and the tier held is not in the state. Maintainer, 23 Sep 21:10: a big artificiality? Measured: 42 of the 210 library singles hold 45% of wealth in the GIA (the rest 2-10%); every library GIA is Medium with no unrealised gain. On step 2's records (`s2-fnew`, retired path-years) the pension and ISA sit at the LOWEST step allowed (two down) 88% of the time on S330 (45% GIA), and 85-89% on S184 and S070 - the floor binds, and on S330 almost half the wealth cannot follow. What makes it cheap: a tier step trades only the slice whose equity weight changes (20% of the pot per step), and the model already tracks the gain fraction and taxes pro-rata sales - one step on a GBP300k GIA with 25% gain realises GBP15k, about GBP2-3k of CGT after the GBP3,000 exemption, and nothing when gains are small. | Material for about a fifth of households; nothing for the rest. | **Design at no solve cost:** the GIA joins the joint step - (pension, ISA, GIA) = (0,0,0), (1,1,1), (2,2,2): the same 432 moves, the same table reads, one more rate per node already computed per pot. The tables treat a GIA switch as untaxed (as they treat dealing costs now); the CGT on the slice is charged at decision time from the true gain and tier held, so no switch is made that is not worth its tax. To avoid forcing a GIA sale whenever the pension de-risks, the decision also scores the winning move with the GIA held where it is (about six more evaluations a decision, ~1-2% of a forward run). **Probe M15** (written before any run): S206, S330, S390 plus S054, S112, S184 as controls, and the three GIA-heavy ones again with a 40% unrealised gain. PREDICTION: S330 gains survival beyond noise; the controls are unchanged within noise; the solve time is unchanged within 3%; with 40% gains fewer GIA switches, none that lowers survival. FALSIFIED IF any household is worse by more than two paired se, or the solve slows by more than 5%. Also worth a separate look: whether a third step down should exist, since the floor binds so often. **Built 24 Sep 02:30-03:05, as designed** with three details fixed in the build: the GIA's step is the larger of the pension's and the ISA's (equal on the joint menu; it keeps a household with no pension moving); the tax on the slice uses what the year's own disposals left of the exemption and the basic band, and the rebought slice starts with no gain (gain fraction x (1 - share sold)); "keep it where it is" wins unless switching beats it by the switch margin, and it is skipped for a mixture or an extrapolated score (single table only). `research/tests/solver-giatiers.test.mjs`: 10 passed; on S330 at 8 points and 60 paths the GIA sits below its tier 8.7 years a path with no gain and 2.1 with a 40% gain (0.43 and 0.20 switches). **Probe run 03:33-03:48: FALSIFIED** - S330 loses 3.2 points (3.7 at 40% gain), S054 0.23; solve time held. Cause: on the joint menu a pension step now drags the GIA (already at Medium) down with it, the bundled move ranks below the pension-only step it replaced, and the pension stays at High (S330: 38.1 -> 9.7 years below plan tier); the hold check rescues only the winner. A working version must score "GIA follows / GIA stays" for every tier move, in the tables too (~1.7x solve) - or give the GIA a menu of its own; derive before building. `results-m15.txt`. **From the history (plan audit 21:30):** Phase 6 already flagged "the GIA's tier, which needs a memory bucket" as a follow-up - the decision-time charge above is the way round that bucket; Phase 6 also measured independent tier pairs at 4-5x the cost for no gain in value, which is why the GIA joins the JOINT step rather than getting a step of its own; and Phase 6 saw the same floor-binding (one or two tiers down for 72-91% of years). | build Thu in a gap (no cores); probe ~1.5 h after K5 and before Phase 4, whose panel includes GIA-heavy households |
| M16 | **Is the table's survival number calibrated along the paths the plan takes?** Maintainer, 23 Sep 21:10: "is the solver score linear with Monte Carlo survivability?" Phase V measured the table only at year 0 (2-3 points optimistic); 2b measured ranking, not level. No new simulation is needed: each held-out path visits one position a year, the table's forecast for the move taken there is one read, and the path's own outcome labels every visit on it - about 100,000 (forecast, outcome) pairs a household, binned into a calibration curve. `audit-calibration.mjs`, `batch-calibration.sh`: 12 step-2 households, 3,000 paths, ~8 min each, ~25 min on four cores. | On the diagonal, the table could give the app instant survival figures (the quick dials without a simulation); off it, the rule "the table is never a reported number" stands, with the curve showing where and by how much. | **DONE 21:33** (`results-calibration.txt`; chart published as the artifact "Survival Forecast Calibration"): monotone once S126 is set aside; right below 10% and above 99.5%; **3-5 points too hopeful between 50% and 95%**, up to 10 on S070; household-specific, so no single correction fixes it. The standing rule stands: the table is never a reported number. | done |
| M17 | **In futures that fail, the solver spends ABOVE target and holds the riskiest tier allowed until the money runs out.** Found 21:30 from `s2-fnewex`'s records, no run. On the five households with material failure (S184, S330, S070, S354, S252), two to three years before a path fails the solver raises spending (mostly to 1.2) on 94-100% of failing paths and holds the plan's own, highest tier on 97-100%, while survivors in the same years sit two tiers down 94-96% of the time. Five years out it was still cutting on some (S070 50%, S330 36%). **Mechanism (derived):** once a position's survival chance is near zero, the survival term barely moves with the move, so the live terms are the raise credit, which rewards 1.2, and the trim penalty, which punishes cuts: the score says "spend it while you can". The tier then maximises whatever sliver of survival remains, and below the cliff that is the most risk (M14's convexity). Same root cause as the toy's side result in M14: nothing in the objective rewards making the money last. | A plan that tells a household heading for trouble to spend 20% more and hold maximum risk is the opposite of what anyone would do, and it shortens how long the money lasts in exactly the futures that fail. Survival cannot see it (the path fails either way), which is why no gate caught it. | **Candidate fix (derived, to probe): count a raise only in futures that survive** - credit x the survival chance from the position it leads to, S(t+1). It decomposes in the backward pass, because S(t+1) is already read at every node: no extra reads, no extra state. A raise in a hopeless position is then worth nothing and the plan's own level wins the tie. Comfortable households barely move (their S is close to 1). **Probe M17** (prediction written now): the four thin households and S126, S112 as controls. PREDICTION: raises in the last three years before failure fall from ~95% to under 20%; money lasts longer in failing futures (mean years unfunded down by 0.3-1.5 on the thin four); survival unchanged within noise or slightly up; controls within noise. FALSIFIED IF survival falls beyond two paired se on any household, or raises before failure stay above half. The tier gamble is left alone (it is survival-maximising; M14's product question covers it). An alternative, if the maintainer prefers: a small credit per year funded. **BUILT 22:10 and root cause corrected:** weighting the raise credit alone does NOT cure it (hopeless cells raising 16,779 of 19,089 -> 16,588 on S070's tables): the TRIM PENALTY is charged only while the money lasts, so failing sooner skips the cuts that staying alive would cost - at a hopeless cell 1.2 beat 1.0 purely through a smaller expected future trim cost. `failureShortfall` charges a year with no money as a year at the floor (default) or, `'zero'`, as a cut to nothing. Tables (`solver-raisesurv.test.mjs`, 7 passed): hopeless cells raising -> 2,400 (floor; the rest are exact ties) or 39 (zero); comfortable cells keep 96% (floor) or 79% (zero) of their raises. The pre-set bar "under 5% of hopeless cells raise" is met by 'zero' only - recorded, not moved. **Probe M17 now runs both** (`batch-m17.sh`, baseline reused from `s2-fnewex`): PREDICTION floor - raises in the last three years before failure under 30%, survival within noise, controls within noise; zero - under 10%, survival up 0.5-3 points on the thin four with more years below target, mean years unfunded down 0.3-1.5; FALSIFIED IF either lowers survival beyond two paired se on any household, or floor leaves raises before failure above half. **PROBE DONE 01:47 (`results-m17.txt`):** floor - raises before failure 82-89% -> 6-11%, survival UP on all four thin households (beyond noise on S070 +0.90 and S330 +0.77), years without money down 20-40%, controls unchanged; the price is 2-5 more years below target per path. zero - raises before failure 0-8%, survival up 0 to 9.8, but 5-11 more years below target: a different, far more cautious objective. Predictions: floor HELD and better on survival; zero's survival range missed both ways; no falsifier fired. **Recommended: 'floor' in the baseline, K5 re-matching lambda after.** | maintainer, step 6 |
| M18 | **The maintainer's test of the purpose, 23 Sep 22:00:** "the purpose of the solver is to give the user an accurate survival rate at the best possible policy, and to show what that policy looks like by year - take many scenarios, run them through the solver, and check how far from the top score was the one with the best survivability; if it is less than noise alone we are successful." What M16 does and does not say about it: the survival rate a user sees is SIMULATED from the policy, so the table's 3-5 point optimism does not make the reported rate wrong - it could only make the POLICY worse than the best, by ranking moves with a biased map. That is what this measures directly. Three things stand between today's solver and the purpose, each with its test: (1) is the policy the best available? - **M18, below**; (2) does the year-by-year policy make sense in bad markets? - **M17** (it does not today: spend more, hold maximum risk); (3) S126's dead corner (#106) - open, question 5. | This is the acceptance test the plan lacked: 2b compared only the top two moves, at random positions that were nearly all near-ties. | **`audit-bestof.mjs`, `batch-bestof.sh`:** 8 households (the four thin, four middle), 20 positions each - half on the cliff (forecast 30-97%) - the top 6 DISTINCT moves simulated on 800 shared paths, the best picked on 400 and measured on the other 400 against the solver's pick (picking and measuring on the same paths would hand noise to the challenger). Two yardsticks: survival, and the solver's own objective simulated per path. PREDICTION (written 22:20, before the run): on the objective, the challenger beats the solver's pick beyond two paired se at no more than 5% of positions and the mean advantage is within noise; on survival the best candidate is ahead by under half a point on average, within noise at 90% of positions, and where it is ahead it cut more. FALSIFIED IF more than 10% of positions show the challenger ahead beyond two se on the objective, or the mean advantage exceeds half a point of score beyond noise. **If falsified**, the numerics are the first suspect (M16's bias), tested in order: 56 points, linear interpolation near the cliff, 15 nodes - each re-run through this same test, which is the proof of any fix. **DONE 01:33 (`results-bestof.txt`): SUCCESS on the maintainer's criterion** - the best-surviving candidate is within noise of the solver's pick at 159 of 160 positions (mean -0.02 +/- 0.03 points). On the objective, the 5% clause FAILED as written (13 of 160) but the falsifier did not fire; 10 of the 13 are deterministic sub-0.06-point ties, two are comfortable positions where one tier more risk pays more estate, one is near-hopeless. The table's ranking tracks simulation (moves it puts over half a point behind simulate 1.42 behind, ahead in 1 of 30). | done |
| M19 | **Blocking raises turns them into frequent small cuts for users who say cuts barely bother them.** K3, 00:40: with raises blocked, S390 (lambda 0.005) goes from 3.2 to 30 years below target at depth 0.91, S126 (0.022) to 10.9, S112 (0.022) to 16.5; fully funded falls to 0 on all three. Derived: a 5% cut costs lambda x 0.0025 a year - 1.3e-5 at lambda 0.005 - while the estate credit pays for the pounds kept, so the solver trims to build the estate. With raises allowed the same trade shows up as "raise less", which nobody sees. | A user-visible absurdity: "no raises" produces cuts in most years. | The dislike-of-cuts slider needs a floor, or the estate credit must not be able to buy a cut: for K5 and the maintainer. Recorded; no run. | step 6, K5 |
| M20 | **An estate weight of zero makes the plan pay needless tax.** K4, 00:40: at w = 0 lifetime tax rises from GBP12k to 88k on S162 and 28k to 101k on S390 against w = 0.01, with the same survival and spending: once survival is safe, nothing rewards a pound saved from tax except the estate credit. | The estate slider's 0% cannot mean weight 0. | Map the slider's 0% to a small weight (0.01 at scale 1 moves nothing else measurable). Recorded; no run. | Part C, the slider map |
| M21 | **Every library household holds the same tiers: pension at High (the top), ISA Medium/High, taxable Medium, cash.** Found 00:50 building M14. So every tier result on file - Phase 6's +5.03, the 41 of 41, the floor binding in M15 - measures de-risking FROM THE TOP, and no test has ever had a user who chose less risk. | The product's users will choose their own tiers; the solver's edge for a cautious user is unmeasured, and "risk above the user's tier" (M14) cannot arise on the library at all. | M14's probe holds the plan at Medium to test it. Phase 4's panel is drawn from the same library, so it inherits the gap: recorded for the maintainer, with the option of a Phase 4 diagnostic at Medium plan tiers (12 households, ~30 min). | step 6; Phase 4 |
| M22 | **The lower tier limit binds for every thin household** (24 Sep 06:00, from `m17-floor` and `s2-fnewex` records): pension and ISA at the lowest step allowed in 87-91% of spending years on S330, S070, S184, S354, 55-57% of them ahead of the median; the middle step used 0-2%. | The solver wants less equity than the menu allows, ahead or behind. | A third pension/ISA step is the sibling arm in the M15 v2 probe (R2). | M15 v2 probe, after K5 |
| M23 | **The decided raise cap (1.1) and the guardrails' raises cannot be matched per household** (24 Sep 06:20, from `k3-cap1.1` and `flex-tiers`): the medians agree (3.22 vs 3.42 years of target), but the guardrails reach 1.5-1.7x target on S184 and S252. With cuts matched, the solver delivers about 4% less spending on average, and 20-30% less on the big raisers. | Gate 4's spending conditions fail by construction unless arm A carries the user's cap. | **Maintainer:** a research-only guardrail cap in the engine for arm A (recommended), or judge gate 2 on spending up to the cap. | before Phase 4 |

### The plan audit against the history and the records, 23 Sep 21:15-21:45 (maintainer: "make sure it hasn't been answered previously")

Every pending item in this file was searched for in `PLAN-HISTORY.md` and, where the records could
settle it, read from them before any run. What it found:

| item | verdict | where |
|---|---|---|
| K2-K4 screens | **19 of 192 cells already on file** (cap 1.2 everywhere; minimum pot 0 on the six plans with no floor of their own; minimum pot 5 on S112) - copied from `s2-fnewex`, not re-run. **Six of the twelve plans carry their own minimum pot**, which `MINPOTYEARS` replaces - found checking the duplicates, and now in K2's prediction | `batch-k-screens.sh`, K2 |
| K2, K3, K4 predictions | re-derived from the step-2 records (the exact baseline the screens run on), written before launch | K2, K3, K4 |
| Richardson extrapolation | **measured before** (Phase 2c, old grid, "moved nothing beyond noise") - the plan said never | M7 corrected |
| the raise weight mu | **swept before** (2d.4, 0.005-0.15, calibrated against the guardrails' raise count) - the constants table said unswept; K5 now matches raise years with mu | K5, constants table |
| Phase 4's no-tiers diagnostic | the prediction said the solver keeps "most" of its win without tiers; **the history says a minority** (Phase 6 +0.73 of +5.03; 6b flexible spending alone p = 0.755) | Phase 4 prediction corrected |
| M15, the taxable account's tier | Phase 6 had flagged it, measured independent pairs as worthless, and seen the floor bind; references added | M15 |
| the eight-year bridge question | **answered from the records**: S390's pension share never exceeds 51% in its bridge; closed | open questions |
| M14's "check the hopeless positions on the real records" | **answered from the records - and it is a finding**: M17 | M17 |
| K7 | a reading of K4's and K6's sweeps; no run of its own | K7, schedule |
| the table's calibration (M16) | **not done before**: Phase V and the 2c bias ledger read the table only at year 0 | M16 (running) |
| 6c-screen and 6d (estate curve shape and levers) | pre-registered on 22 Sep, never run, superseded by K4; nothing to reuse | history 1732-1734 |
| M3 (draws between tax corners), M12 (one-off costs), the phone grid, the second seed 7004 | nothing in the history answers them; the runs stay | - |
| stale statements | the ternary search in step 3, K5 and the speed note; single-peakedness "re-checked"; Q5/Q6/Q10 status; K1's size - all corrected in place, marked "21:30" | throughout |

### The plan review, 23 Sep evening - errors corrected in place

A line-by-line check of this file against the code and the results files. Each correction is marked in
place ("corrected 23 Sep plan review"). The substantive ones: **harvesting** was described as capital-gains
harvesting - it is pension band filling re-wrapped into the ISA; **tiers** were described as independent -
the menu moves the pension and ISA together; **K7** claimed the median pot is monotone - only the expected
credited pot is; **Part C** had quick dials and "cost of skipping" read from the table (both violate the
standing rule that the table is never a reported number), a contribution lock and contribution actions
(the solver does not choose contributions), and guardrails applied on top of a solved plan (cutting twice);
and **re-weighting without a re-solve** was implied (Phase 12's harness, the solver's header comment) - it is
not possible, because every stored continuation value was chosen under the weights in force. Smaller: K3/K4
mislabelled, a sign error in a Phase V figure in the predictions register, "single-peakedness confirmed",
"never worse", "lever builds built", a duplicated sentence, a stale count of test files.

---

### The maths reassessed against the night's results (24 Sep 06:30; maintainer: "reassess the maths in the plan based on the latest results and use it to apply learnings and predictions as needed")

Every item below is derived from files already on disk; no run was made for this section.

| # | What the results changed | The maths | What it changes in the plan |
|---|---|---|---|
| R1 | **Why M15 v1 lost (corrected).** | The joint menu removed (2,2,0), the most efficient de-risking move. The three families left were within ~1e-4 of each other, a tenth of the switch margin (0.001), so the margin kept the tier the path started with, which was the plan's (diagnostic table in "M15 v2"). | M15 v2 must be NESTED (a superset of today's menu); written into the design. New question Q12 below. |
| R2 | **M22: the lower limit binds for every thin household.** Under the fixed solver (`m17-floor`) S330, S070, S184, S354 hold the pension and ISA at the lowest step allowed in 87-91% of spending years, 55-57% of them AHEAD of the median; the middle step is used 0-2%. Comfortable households mostly hold the plan tier (S206 92%, S390 79%). | With every pot on one draw, a step off the riskiest sleeve buys the most calm per point of return (S330: 1.6 and 1.5 points of spread for 0.07 and 0.11 of growth, falling to 1.4 for 0.14 and 0.8 for 0.19 below today's floor). A choice pinned at the boundary in both halves of the wealth distribution means the unconstrained optimum lies below the boundary. | The third pension/ISA step is a sibling arm in the M15 v2 probe, open to every household, not only GIA-heavy ones. Phase 4's prediction: the tier edge is broad on a panel landed at ~85% (thin by construction), not confined to pension-heavy households. |
| R3 | **M23: the raise cap of 1.1 against the guardrails' raises.** On the twelve, the guardrails' raises add a median 3.42 years of target spending over a retirement (0.20 to 12.0; S184 raises 17.7 years at 1.68 x target, S252 21 years at 1.51). The capped solver adds a median 3.22 (0.60 to 4.30). | Medians match already: capped raises are frequent and small (15-43 years at 1.1), the guardrails' rare and large. Per household they do not. With cuts matched by K5 (mean 2.36), net extra spending is about +0.30 years for the solver against +1.84 for the guardrails (means of the twelve), about 4% of ~36 years of spending, and 20-30% on S184 and S252. | **Gate 4's condition 2 (spending within 1%) is predicted to FAIL by about 4%, and condition 3 (no household 5% lower) on the big raisers, unless arm A carries the same cap.** The cap is the user's rule, like the minimum pot, which is already set on every arm. **Recommended (maintainer to decide; it touches the shipping engine): a research-only option in the engine's guardrails to hold the multiplier at the user's raise cap, as it is held at the floor today (`gs.mult` beside `minMult`), used for arm A in Phase 4.** Otherwise the gate is judged against a rival spending up to 68% over target that the user said they did not want. |
| R4 | **K5 stage 2 (the raise weight mu) is conditional now.** | By R3 the median raise total already matches within 6% at mu 0.003 under the cap. | Stage 2 runs only if stage 1's chosen point moves the median raise total outside +/-10% of the guardrails' 3.42 (3.08 to 3.76). |
| R5 | **K6 in the units K5 uses.** | lambda means nothing across exponents; c (the cost of a floor year, lambda x 0.2^exponent) does. | K6 sweeps c from a tenth to ten times K5's value at K5's exponent; the slider maps to c on a log scale. |
| R6 | **K7's monotone quantity, with the floor fix on.** | The Lagrangian argument covers the PENALISED quantity. With the fix that is the trim cost PLUS the charge for years with no money, not years below target alone. | K7 checks E[trim cost + unfunded-year charge] for monotonicity (a reversal is a bug, subject to Q1), and reports years below as a finding. K5's grid already gives 12 x 4 x 5 = 240 adjacent pairs to read; no run. |
| R7 | **Phase 4's configuration after step 6.** | - | Arm S: floor fix on, cap 1.1, minimum pot 1 year, estate as today, risk above the tier OFF (an opt-in is not a default), GIA tier off, K5's c and exponent. The panel is LANDED at ~85% for arm A (decided): each household's target is set so arm A survives 85% +/- 2 on seed 7005 with the minimum pot on (the panel is now drawn after the defaults, so it is landed with them). Added diagnostic: **arm S with pension and ISA held at Medium** (M21: the library never tests a cautious user; this is also the only place M14's opt-in can show anything, since at High there is no tier above). |
| R8 | **Phase 4's survival prediction, re-derived.** | The floor fix adds 0.2-0.9 points on thin households (M17); the tiers' edge is concentrated where the lower limit binds (R2); the landed panel sits where decisions are not near-ties. Against that, K5's matched cutting is ~6x today's, which moves survival UP (cuts are the solver's other protective lever). | Prediction strengthened: arm S wins survival on at least 30 of 40, and the no-tiers diagnostic keeps a minority, as before. Spending: see R3, which is the condition most at risk, not survival. |
| R9 | **The calibration (M16) and the ranking (M18) under the new defaults.** | M16 was measured without the fix. M18 passed with it (158 of 159), and its looser table-vs-simulation correlation is explained by the old yardstick. | "The table is never a reported number" stands. Phase 4's records re-read the calibration offline with the fix on (no extra run). |
| R10 | **The mathematician's questions.** | Q2 (two dials, stepped response) is handled by K5's grid, with no curve trusted between points. Q11 (pricing a year with no money) is settled by the maintainer's decision for the floor price; it stays on the page as a check, not a blocker. | **New Q12:** when the table is nearly indifferent between tiers (R1: families within 1e-4), the switch margin decides, and a path stays wherever it started. Is a fixed margin of 0.001 right, or should it scale with the table's own resolution (M16's 3-5 point optimism)? Before M15 v2's build. |

## The schedule

**One rule sets the order: a step goes after everything it is conditional on.** Numerics before
anything that reads the table; solver changes before any calibration; the maintainer's product defaults
before the guardrail matching, because what the solver cuts depends on every other setting; the matching
last, immediately before Phase 4. Any step whose result redirects the plan stops the queue there.

| # | Step | Conditional on | Size | ETA (UTC) |
|---|---|---|---|---|
| 0 | ~~Byte-wide policy bug's cost~~ **zero effect** | - | - | done |
| 1 | ~~Phase V~~ **done: plans stable, table numbers not; judged on simulation (decision A)** | - | - | done |
| 2 | ~~Step 2 and its re-check~~ **done 19:45**: finalExact on, ternary out, 30 points kept, no #106 option (history) | 1 | - | done |
| 2b | ~~Ranking check~~ **done 21:00**: nothing to fix - the first choice did worse at 8 of 479 positions, none beyond noise, worst 0.6 points (`results-ranking.txt`; history) | 2 | - | done |
| 3 | **Lever builds** - estate curve, raise cap/block, block trimming and `solvePlan` (M1) built and tested; the minimum-pot default waits on step 6 and lambda's slider map on K6 | 2w | done except those two | - |
| 4 | ~~K1 honouring checks~~ **done 21:13: PASSED** - every rule held on every path-year of 24 records (`results-k1.txt`) | 2b | - | done |
| 4b | ~~Calibration check (M16)~~ **done ~21:35** | 4 | ~25 min | done |
| 5 | ~~K2-K4 screens~~ **done 00:33** (173 cells, 19 reused; `results-k-screens.txt`) | 4 | - | done |
| 5b | ~~Phase 4 panel selection~~ **run 02:05: its FALSIFIER FIRED - 1 of 158 candidates in the 75-95% band (FIRE 0 of 30, median 13.7%; library split between 99-100% and below 75%). Stopped for the maintainer; options (widen, land each household at ~85%, redefine FIRE) in `results-p4-select.txt`, recommended: land** | 5d | - | maintainer |
| 5d | **The purpose test and the probes, in order (maintainer, 22:00):** M18 (is the policy the best available, within noise), M17 (the two cures for failing futures), then Phase 4 selection; M15, M14 and M12 are built and run only if time allows | 5 | ~2.5 h | Thu ~03:30 |
| 5c | **The morning summary for step 6**: K2-K4 in plain words, a recommended default for each lever, M8's wording, the #106 trade-off, the ternary decision, **M17 and the probes' verdicts, and the calibration curve** | 5 | no cores | Thu ~07:00 |
| 6 | ~~The maintainer picks the product defaults~~ **DECIDED 24 Sep ~05:30: every recommendation taken** - minimum pot 1 year; raise cap 1.1; estate slider 0% = weight 0.01; the M17 floor fix ON; risk above the user's tier as an opt-in; Phase 4's panel landed at ~85%; the taxable-account tier NOT allowed as built - **fully plan a version that works first** (M15, "the full design" below) | 5c | - | done |
| 7 | **K5 guardrail matching** - stage 1 running since ~05:45 (288 cells at ~6.5 min each, four at a time: **~8 h, not 4.5**); stage 2 conditional (R4); stage 3 on the 41 | 6 | ~9.5 h | Thu ~15:30 |
| 8 | **K6 slider spread** (in c, R5), with **K7 read off K4's, K5's and K6's sweeps** (no run of its own) | 7 | ~1.5 h | Thu ~17:00 |
| 8b | **M15 v2**: build in K5's run gaps (no cores), after Q12 is put to the mathematician; probe (4 arms, 8 households + 3 at 40% gain, ~2 h) | 7 | ~2 h | Thu ~19:00 |
| 9 | **Phase 4**, with its bundled extras (below); **needs the maintainer's M23 decision first** | 8, M23 | ~6 h | Fri ~01:00 |

### The next 12 hours (rewritten Wed 21:30 UTC, after K1 finished in 8 minutes and the plan audit)

| UTC | cores | alongside, no cores |
|---|---|---|
| ~~18:35 - 21:13~~ | ~~step 2 and its re-check, the ranking check, K1~~ **done** | write-ups, history moves |
| ~~21:13 - ~21:35~~ | ~~calibration check (M16)~~ | plan audit against the history; K2-K4 predictions re-derived; M17 found |
| ~21:35 - ~00:30 | K2-K4 screens, 173 cells (measured: about a cell a minute) | calibration chart (published); M17 built and tested; M18 built |
| ~00:30 - ~01:20 | M18, the purpose test | K2-K4 reduced against their predictions |
| ~01:20 - ~01:50 | M17 probe, both cures | M18 reduced |
| ~01:50 - ~02:50 | Phase 4 panel selection | M17 reduced (**done: floor fix recommended**); M18 passed, so no numerics follow-ups |
| ~02:50 - ~03:20 | M14, one tier above (plan held at Medium) | M14 reduced |
| ~~02:26 - 03:31~~ | **M18 again with the floor fix on - done: PASSED, falsifier not fired** (158 of 159 within noise, mean -0.01 +/- 0.02; rivals ahead by cutting more 2 of 14, was 10 of 23; `results-bestof-floor.txt`) (`batch-bestof-floor.sh`): the purpose test is the proof of any objective change. PREDICTION: the survival criterion still passes (best rival within noise at 90%+ of positions, mean advantage under half a point); positions where a rival wins now cut less, not more. FALSIFIED IF the best rival is ahead beyond noise at over 5% of positions on survival | morning summary finalised |
| ~~02:30 - 03:05~~ | - | **M15 built** (while M18-floor ran): `giaTiers`, off by default and bit-identical off (table hashes S070 d12c6e177e97cb6a, S330 d9ad3e66a9b6d52c before and after); `solver-giatiers.test.mjs` 10 passed; solver-fast, -tiers, -model green |
| ~~03:33 - 03:48~~ | **Probe M15 - done: FALSIFIED** (S330 -3.2 +/- 0.35 and -3.7 at 40% gain, S054 -0.23 +/- 0.10): bundling the GIA into the joint step makes pension-only de-risking unavailable, so the pension stays at High (S330 38.1 -> 9.7 years below plan tier); the GIA itself barely moves. Not offered; what a working version needs is in `results-m15.txt` | M18-floor reduced |
| 05:00 - 07:00 | - | the morning summary; the mathematician's page brought up to date |

Stops that would change this: a K2-K4 cell failing to run (re-run once, then recorded); a probe build that
is not bit-identical with its option off (it does not run until it is); nothing else tonight is gated.

**Bundled into the runs, now that a plan is one solve (maintainer, 23 Sep: "we've bought back a lot of
time").** Every run from step 2 on writes a RUN RECORD (`record.mjs`): every path-year's spending level,
tier, wealth, pension share and tax, per-path outcomes, per-year aggregates, and with STOREPOL the solver's
stored moves - so a later question is a script over saved data, not a re-run. Phase 4 adds, at little
cost: **a second held-out seed (7004) on 12 households**, closing the open item that absolute levels were
never checked on a third draw; **the phone grid (14 points) on 12 households**, because Part C Phase 11
plans a coarser phone grid that has never been tested against the full one; **records for arm A too**, so
the guardrails' year-by-year cutting can be compared with the solver's directly; and **the E1 and ranking
analyses re-read offline** from Phase 4's stored moves. Panel size: from the tuning records the
per-household survival difference has a spread of 0.82 points, so 40 households detect an edge of
2.80 x 0.82/sqrt(40) = 0.36 points with 80% power, and 0.4 points with about 87% (corrected 23 Sep, M5) -
enough; 80 would only buy power within each half of the panel.

Step 6 is the one point the maintainer is on the critical path.

**After Phase 4, in this order - re-weighted 23 Sep now that the solve is the whole cost:**
- **E3, collapse the empty-pot dimensions** - was 13.8% of a landing because forward runs were half the
  cost; with no landing it is close to its full **30.2% of the solve**. Worth roughly twice what it was.
  **Its BUILD can start earlier, in the gaps while Thursday's runs occupy the cores**: its gate is
  bit-equality, so it cannot disturb any result, and it lands whenever it passes - never on the
  critical path, and never ahead of the step 2 and 3 builds.
- **E2, split one solve across cores** - in the app the user waits on one household's single solve, so
  near-4x on four cores is now most of the waiting time. Still designed with Phase 7's workers.
- **Couples under the new objective** - Phase 5 was validated with resilience on and a landed penalty,
  and its backtest and perturbed worlds were never run. Before couples can ship: the same levers and
  defaults, the same head-to-head against the app at its best, on the couples panel.
- **#109's remaining probes** - recommendations only, in a scratch note.
- **Brent with error-based stopping** - downgraded for the plan itself, which never searches, but it
  returns for the Simple page's safe spend and safe age (decided 23 Sep, option (b)), where every step of
  the search is a full solve and a user is waiting. Built with Part C Phase 10.

---

## Predictions register - every planned run, derived before it goes (audited 23 Sep, 17:45)

The derive-first rule applied to the whole queue, not only the runs that happened to get one. Where a
prediction lives in its own section it is pointed to; the six that were MISSING when audited are
written here, each derived from records already on file.

| run | prediction | falsified if | source |
|---|---|---|---|
| step 2, today against the new baseline | **At the same lambda the new baseline cuts far less and raises far more**: years below target fall from about 9-15 to about 1-4, years above target rise to 27-43, survival falls 0.3 to 2 points, lifetime tax RISES (more is spent, so more pension is drawn), the median end pot falls. The 0.95 level makes cuts shallower: depth when below rises from 0.63-0.87 toward 0.85-0.95 | the new baseline cuts MORE than today on any household, or loses more than 3 points of survival | **written now**, from 6f's resilience 0 and 0.5 arms at the same lambda |
| step 2, ternary against exhaustive | simulated survival and spending identical within noise on every household (24 misses in 5.0 million); the backward pass 20-30% faster (four level evaluations of six, and flows computed only for levels visited) | any household beyond 0.5 of survival or 1% of spending, or under 15% faster | **written now**, from the single-peak probe |
| step 2, 15 nodes and 56 points | within half a point of survival and 1% of spending, but NOT comfortably: Phase V put the 30-to-56 simulation gap at -0.4 to +0.1 and 5-to-15 at -0.3 to +0.4 at 1,000 paths (the first range corrected 23 Sep plan review: it said +0.2 to +0.4), so one borderline household is likely | a gap over 1 point, or a systematic sign across all twelve | **written now**, from Phase V's simulated columns |
| step 2, the #106 fix | in its section (step 2) | - | step 2 |
| ranking check | where the table's first choice beats its second by a clear margin in score, it simulates at least as well in over 80% of sampled positions; where the margin is tiny, it is close to a coin toss; the average loss when it is wrong is under half a point, and no loss exceeds 2 points on the current grid (S070's 6-point misranking was on the old per-pot grid) | wrong in over 30% of positions with a clear margin, or any loss above 2 points | **HELD 21:00** on near-ties (8 better, 8 worse), average loss (0.25) and worst loss (0.60); the clear-margin clause UNTESTED - none sampled. Falsifier not triggered (`results-ranking.txt`) |
| calibration (M16) | realised survival rises with the table's forecast in every bin with 1,000+ visits; close to the diagonal below 10% and above 99%; optimistic by 2-6 points between 20% and 90%, where the cliff is; the visit-weighted mean forecast above the realised rate by 1-3 points | a well-filled bin realising more than a lower bin beyond noise, or the table pessimistic on average | **written 21:15, before the run**, from Phase V's 2-3 points at year 0 and its slow 1/n decay. **RESULT 21:33:** the ends and the 50-90% gap HELD; the 20-50% gap smaller than predicted; the mean gap at the edge (0.97); the monotone falsifier FIRED on all 12 because of S126's dead corner, and holds without it (`results-calibration.txt`) |
| K1 honouring | exact by construction: every rule holds on every path | any path breaks any rule - a bug | **PASSED 21:13** (`results-k1.txt`) |
| K2 minimum pot | in K2 (re-derived 21:45: the buffer is kept by raising less, not by cutting or losing survival) | in K2 | **00:40: the years-below falsifier FIRED (S206, S390, S126); survival under a quarter of the mechanical loss on 4 of 6, 0.26-0.28 on two; own-floor bounds held on 3, exceeded on 3** (`results-k-screens.txt`) |
| K3 raise cap | in K3 (re-derived 21:45: cap 1.1 leaves 50-65%; blocking lifts thin households 0.5-2.5 points and S070 under 4.5 years below) | in K3 | **00:40: cap 1.1 HELD (11 of 12); survival lift FAILED (0.1-0.4); S070 falsifier FIRED (6.5); comfortable within a point HELD; unpredicted: M19** |
| K4 estate slider | in K4 (derived 21:45: nothing below w = 0.03; the response between 0.1 and 0.3; survival never falls) | in K4 | **00:40: (i) HELD as written, but tax moves (M20); (ii) partly; (iii) not held, falsifier not fired; (iv) FALSIFIED (-3.2 on S184 at 0.3 x 4); (v) HELD** |
| Phase 4 panel selection | FIRE: 12 to 20 of the 30 candidates land in the band (retiring at 52 adds a six-year bridge, which pushes survival down into the band more often than out of it), so the FIRE half may fall short and the library fill in; library: about half to two thirds of library candidates land in the app's 75-95% band (the tuning 41 ran from 70.9% to 99.9% with a median of 92.1%, 27 of 41 under 95%), so filling 40 needs roughly 60 to 80 candidates | under a third land in the band - the library would then be too comfortable for the test, and the band is revisited with the maintainer | **FALSIFIED 02:05: 1 of 158** - FIRE all below 50%, the library split between safe and thin; the tuning 41 were themselves selected on survival, which the prediction missed. Band revisited with the maintainer (`results-p4-select.txt`) |
| K5 guardrail matching | in K5 | - | K5 |
| K6 dislike slider | in K6 | - | K6 |
| K7 monotone | **two parts are PROVABLE, one is not.** Raising dislike of cuts can never add trimming, and raising the estate slider can never lower the EXPECTED credited end pot - both follow from the same relaxation argument that settled the lambda curve. The MEDIAN end pot and the survival chance are not guaranteed monotone and are empirical. So a reversal in the first two is a bug; in the last two it is a finding | a reversal in trimming or in expected credited pot | **written now** |
| Phase 4 | in Phase 4 | - | Phase 4 |
| Phase 4, second seed on 12 | every household within about +/-0.9 of seed 7003, the average within +/-0.3 (the 7001/7002 pair differed by +0.18 on average) | the average moves by more than half a point | **written now** |
| Phase 4, phone grid (14 points) on 12 | simulated survival within about a point of the 30-point grid - Phase V's 16-point arm simulated within 0.7 of 30 points on all three households - while the table's own reading is further off | any household more than 1.5 points worse | **written now**, from Phase V |
| E1 re-run from stored moves | coverage stays near 98-99% and the verdict (not built) stands: the moves above 255 that corrupted it are the "draw the pension first" families, rarely chosen | coverage above 99.5% with a small set - E1 would then be worth building | **DONE 19:20: 97.72%, not built** (`results-e1-records.txt`) |
| E3 | bit-identical results; about 30% off the solve | any bit differs | E3 |

---

## M15 v2. The taxable account's tier: the full design (maintainer, 24 Sep: "fully plan out the taxable tier change so it works, don't allow it as is")

**Status: designed, not built. The product refuses the option (`solvePlan` throws on `giaTiers`; `solver-plan.test.mjs`).**

### Why v1 failed: the mechanism, measured (diagnostic 24 Sep 05:55, S330, 12 points, 20 paths, 548 decisions)

| | best-score shortfall from the top, by tier family (x1e-4, mean) | family chosen | table's best overruled by the switch margin |
|---|---|---|---|
| option off: (0,0,0), (1,1,0), (2,2,0) | 3.11, 1.18, **0.03** | (2,2,0) 91% | 30% |
| option on: (0,0,0), (1,1,1), (2,2,2) | 1.60, 0.76, 0.75 | (0,0,0) 40%, (1,1,1) 38%, (2,2,2) 23% | 44% (and the GIA hold check kept the GIA at 60%) |

v1 REMOVED the best option. (2,2,0) takes the two riskiest sleeves down and leaves the GIA at Medium. Once it
was gone, the three families that remained were within about 1e-4 of each other, a tenth of the switch margin
(SWITCH_MARGIN = 0.001). The margin then keeps whatever tier is held, and a path starts at the plan's tier. So
the solver sat at the plan tier: the 3.2-point loss is the solver losing its best de-risking move. It says
nothing about the value of a GIA tier. (The M15 write-up's "the bundled move ranks below" was right about the
menu but missed the margin's part; corrected here.)

### The arithmetic that sets the design

Every pot sees the same yearly draw, so the portfolio's return and spread are the wealth-weighted sums of the
sleeves'. S330's tiers: return 4.79 / 4.24 / 3.69 / 3.14 / 2.60% and spread 17.1 / 13.4 / 9.9 / 6.9 / 5.2%
(High -> Low). Return falls about 0.55 points a step, but spread falls 3.7, 3.5, 3.0, then 1.7. So a step off a
risky sleeve buys more calm per point of return given up than a step off a calm sleeve: **de-risk the riskiest
sleeve first.** Where two sleeves are equally risky, de-risk inside the pension or ISA first, where a switch
costs no capital gains tax. With pots 30 / 15 / 45 / 10%:

| rung | pension, ISA, GIA tiers | equity | return | spread | growth after spread |
|---|---|---|---|---|---|
| 0 (plan) | High, M/High, Medium | 0.60 | 3.83% | 11.6% | 3.16% |
| 1 | M/High, Medium, Medium | 0.51 | 3.59% | 10.0% | 3.09% |
| 2 (today's floor) | Medium, M/Low, Medium | 0.42 | 3.34% | 8.5% | 2.98% |
| **3 (new)** | Medium, M/Low, **M/Low** | 0.33 | 3.09% | 7.1% | 2.84% |
| **4 (new)** | Medium, M/Low, **Low** | 0.24 | 2.85% | 6.3% | 2.65% |
| v1's (1,1,1), for comparison | M/High, Medium, M/Low | 0.42 | 3.34% | 8.6% | 2.97% |
| the sibling's third step | M/Low, Low, Medium | 0.33 | 3.09% | 7.3% | 2.83% |

(Cash at 1.01%, no spread. "Growth after spread" = return - spread^2/2.) Rungs 0 to 2 cost 0.07 and 0.11 points
of growth for 1.6 and 1.5 points of spread. Rungs 3 and 4 cost 0.14 and 0.19 for 1.4 and 0.8: each step down buys
less calm for more growth, so the value of going further is real but falling. v1's (1,1,1) is as good as (2,2,0)
in this arithmetic, which is why the tables found the families within 1e-4 of each other and the switch margin
decided. On S330 the third pension/ISA step is almost as calm as the GIA's rung 3 (7.3% against 7.1%) with no tax,
which is why the sibling arm is a real rival.

### The design

1. **A nested ladder, never a swap.** Rungs 0-2 are exactly today's joint steps, and the GIA adds rungs 3 and 4
   after them. The menu is a strict superset of today's, so the table's value can only rise (a maximum over more
   moves) and every plan today's solver finds is still available. This is the property v1 lacked. A test
   checks it: with the rungs added, the year-0 table value is at or above today's at every cell.
2. **Only where it can matter.** The GIA rungs are added only when the GIA holds at least 10% of opening
   investable wealth. Otherwise the menu is today's, bit for bit, at no cost (42 of the 210 library singles
   qualify, at 45%; the rest hold 2-10%).
3. **Cost: +67% on the households that qualify** (five tier variants in place of three), none elsewhere.
   Tier variants share each move's flow (`tierBase`), so the true figure is measured in the build; bar: at most
   1.7x the solve on a qualifying household.
4. **Capital gains tax at decision time.** Keep v1's charge: the slice sold x its gain fraction, against what is
   left of the year's exemption and basic band; the rebought slice starts with no gain. The tables treat a GIA
   switch as untaxed (as they treat dealing costs today). That is optimistic by at most about 0.3% of the GIA per
   rung change at a 40% gain. The decision-time charge and the switch margin keep switches rare, and the probe
   counts them.
5. **No hold check.** The ladder is explicit, so v1's "keep the GIA where it is" check goes: it scored only the
   winner, and at 60% it was doing the menu's job badly.
6. **Above the plan (M14's opt-in) stays on the pension and ISA only.** The GIA does not go above its tier.

### The sibling it must beat: a third step for the pension and ISA

The same records say the lower limit is the wider constraint. Under the fixed solver (`m17-floor`), the four thin
households hold the pension and ISA at the lowest step allowed in 87-91% of spending years, as often when ahead
of the median as behind (55% ahead), and the middle step is almost never used (0-2%). Three of the four hold
almost nothing in a GIA. So the probe carries an arm with a **third pension/ISA step** (rung 3 = Medium/Low, Low,
GIA held; no capital gains tax, same +33% cost for every household). If that arm gets most of the gain, the
GIA ladder is not worth its tax and complexity, and the third step is what ships.

### Probe M15 v2 (runs after K5 fixes the default dislike of cuts; derived before any run)

Arms, all on the step-6 defaults and K5's c, paired on the same 3,000 paths: today; the GIA ladder; the third
step; both. Households: S330, S206, S390 (GIA 45%), the thin S070, S184, S354 (lower limit binding, GIA 2-5%),
and S054, S112 as controls; the three GIA-heavy ones again at a 40% unrealised gain.

PREDICTION:
- In-model: the year-0 table value is never below today's (by construction). A failure there is a bug and stops the probe.
- Where the GIA holds under 10%, the ladder arm equals today's bit for bit (the rungs are not added).
- S330: the ladder raises survival 0.5 to 2 points, reached from rungs 3-4 in at least half the years it sits at
  rung 2 today. At a 40% gain, fewer rung-3/4 years and a smaller gain, never a loss beyond noise.
- The third step: +0.3 to +1.5 points on each of the four thin households, and on S330 at least half the
  ladder's gain.
- S206 and S390 (mostly at the plan tier today): unchanged within noise under every arm.

FALSIFIED IF any arm is worse than today by more than two paired se on any household, or the ladder's solve on a
qualifying household exceeds 1.7x. **What ships:** the cheaper arm that gets at least 80% of the best arm's
gain, and nothing if no arm gains beyond noise.

## Step 3. The lever builds

- **The estate credit curve** `credit(net) = w x s x ln(1 + (net - P)/s)` above the minimum pot P, with one
  level driving (w, s) along the path K4 calibrates.
- **Raises: allow, cap, or block** - the menu's top level set by the cap, none above 1 when blocked.
- **The minimum end-of-life pot default**, wired so a plan without one gets the default K2 settles.
- **Block trimming** - the floor set equal to the target, which leaves no level below 1.
- **Lambda exposed as the dislike-of-cuts level**, its map fitted in K6.
- **`solvePlan()`, the product entry point with the decided baseline** (finding M1, revised) - **built 18:47,
  updated 19:45**: resilience 0, six levels, raise weight 0.003, the full level scan (ternary out), the exact
  final year, no #106 option (neither passed); the estate curve and minimum pot after step 6. `solve()` keeps
  its research defaults. Gate: bit-identity with the options written out - passing (`solver-plan.test.mjs`).

---

## Phase K. Calibrating the user's levers

Two different jobs that must not be confused. **A rule the user sets must be HONOURED** - exact, not
tuned. **A default or a slider's scale must be CHOSEN** - from measured curves, by the maintainer.
Screens run at a fixed lambda (the flex-tiers landed value) on 12 households unless stated.

**K1. Honouring checks - exact.** On every path-year, three arms (the last two added 23 Sep, finding M2):
- `k1-rules`, 12 households, every rule at its extreme: trimming and raises blocked (every spending year at
  exactly the target), risk permission off (every year at the plan's tier), minimum pot 3 years;
- `k1-cap`, 6 households: raise cap 1.1 with trimming allowed and tiers on - no year above 1.1;
- `k1-block`, 6 households: trimming blocked with raises allowed and tiers on - no year below target;
- in every arm: no future counted as surviving ends below the minimum pot.

**K2. The minimum end-pot default - it replaces resilience.** P in {0, 1, 3, 5} years of target spending.
PREDICTION: trimmed years stay near resilience-off levels (1.6 to 4) and far below resilience-on (9 to
15) at every P, because resilience rewarded pounds up to opening wealth - 15 to 30 years of spending on
the unlucky tenth - and a hard floor of 1 to 5 years only binds on futures heading below it. FALSIFIED IF
P = 3 costs more than half of resilience's trimming.
SHARPENED FROM 6f's RECORDS, no run: with resilience off, the unlucky tenth ends at 7.7 (S126), 21.7
(S054), 4.5 (S252), 1.4 (S390), 0.1 (S206) and 6.7 (S112) years of spending. So at the tenth percentile a
1-year floor binds only on S206; 3 years on S206 and S390; 5 years adds S252; S126, S054 and S112 are
untouched up to 5. **The cost of the default lands on two or three households of six, not all of them.**
**RE-DERIVED 23 Sep 21:45 from the step-2 full-scan records (`s2-fnewex`, the exact baseline the screens run
on), before launch.** Two facts the 6f reading missed. (1) **Six of the twelve carry a minimum pot of their
own in the library plan** (S054 15.1 years of target, S184 7.9, S162 6.6, S112 5.0, S354 3.8, S252 2.3), and
`MINPOTYEARS` REPLACES it - so for them a small P is a LOWER floor than today's, and survival should rise,
by up to the share of paths that fail only at the end: S184 4.87 points, S354 1.63, S054 1.57, S112 and S162
0.77, S252 0.27. (2) **For the six with no floor, the mechanical loss is large on some**: the share of paths
that survive but end below P years is, at P = 1 / 3 / 5: S206 11.9 / 15.4 / 18.6, S070 12.4 / 19.2 / 23.7,
S390 5.7 / 7.9 / 9.8, S330 5.5 / 8.4 / 11.3, S126 3.5 / 4.9 / 6.4, S100 3.4 / 7.0 / 10.2. Those futures end near
zero by CHOICE, not by luck: the baseline raises to 1.2 in 32-93% of retired years, because nothing values
the end pot above the raise credit. **PREDICTION: the solver keeps the buffer by raising less, not by
cutting and not by losing survival** - on the six without a floor, survival falls by under a quarter of
the mechanical loss at every P; years ABOVE target fall; years below target move by under one year.
FALSIFIED IF survival falls by more than half the mechanical loss on two or more of those six, or years
below target rise by more than one year on any. Reused from the baseline, not re-run: P = 0 on the six
without a floor, and P = 5 on S112 (its own floor).

**K3. The raise cap default.** Cap in {1.0, 1.1, 1.2}.
FROM 6f's RESILIENCE-OFF RECORDS, no run - the objective that will ship: **the solver raises in almost
every year.** Years above target 26.6 to 43.2 (of 35 to 61), at a typical 1.18 to 1.19 - worth 5.1 to 7.8
years of target spending over a retirement. With resilience gone, nothing restrains raising except the
cap and the raise credit, so **the raise default is a first-order product choice, not a detail**: a user
who sets a target of 30,000 would, by default, be shown a plan spending about 35,000 in most years.
PREDICTION: capping at 1.1 roughly halves that extra spending; blocking moves all of it into the pot,
lifting median end pots by more than the 5-8 years spent (it compounds), and helps survival most on the
thin-tailed households (S390 and S206, whose unlucky tenth ends with under 1.5 years of spending).
FALSIFIED IF blocking raises changes survival by more than a point on the households with comfortable
tails - that would mean raises are feeding back into cuts, not just spending surplus.
**RE-DERIVED 23 Sep 21:45 from `s2-fnewex`, before launch.** Of retired years the baseline spends at 1.2 in
32-93% and at 1.1 in 0-19%; the extra spending is 2.5 (S070) to 8.5 (S390) years of target per retirement.
(a) **Cap 1.1:** the raise credit is concave (mu x sqrt(level - 1)), so a year that raised to 1.2 still
raises to 1.1 (71% of the credit for half the money): the extra becomes (y1.2 + y1.1) x 0.1 against
0.2 y1.2 + 0.1 y1.1 - **51 to 58% of today's on every household**, a little more as the kept money funds
more raising years. PREDICTION: 50-65% of the baseline extra on every household. (b) **Block (cap 1.0):** the
extra is zero; the median end pot rises by 1 to 2.5 times the extra that was spent (it compounds). The
raise credit is worth at most mu x sqrt(0.2) = 0.0013 a year - about 1.7 to 5 survival points over a
retirement - so that is the most survival the baseline can be trading for raises: **on the thin households
(S070, S184, S330, S354, survival 79-84%) blocking raises lifts survival by 0.5 to 2.5 points**, never by more
than the baseline's own total raise credit; on the eight comfortable ones by under a point (the falsifier
above). **And S070's step-2 rise in years below target (3.0 -> 6.7) was raises paid back as cuts**: blocked, it
falls below 4.5. FALSIFIED IF S070's years below target stay above 5 with raises blocked (the rise was then the
removal of resilience, not raising). Cap 1.2 is the baseline, reused from `s2-fnewex`, not re-run.

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
**DERIVED 23 Sep 21:45, before the screen (the weight grid 0 / 0.01 / 0.03 / 0.1 / 0.3 x scale 1, 4).** The
estate credit competes with the RAISE credit, not with survival. A year of target spending kept at the
margin reaches the end grown by G (about 2), worth w/W0 x 1/(1 + (m - P)/(k W0)) there, against a raise
credit of 0.0039 per year of target for 1.1 -> 1.2 and 0.0095 for 1.0 -> 1.1. So the weight at which the
estate starts to win, at each household's median end pot m (from `s2-fnewex`) and opening wealth W0
(7.6 to 33 years of target), is: for 1.1 -> 1.2, **w* = 0.06-0.25 at scale 1 and 0.03-0.11 at scale 4**; for
1.0 -> 1.1, 0.15-0.61 and 0.07-0.27. (Checked against today's capped credit, 0.02 on min(net, 4 W0): by the
same arithmetic it restrains raises on S330 alone, W0 = 7.6 years - which raises to 1.2 in 58% of years
against 75-93% on the comfortable households.) **PREDICTIONS:** (i) w = 0, 0.01 and 0.03 at scale 1 are
the same plan within noise on every household (survival within 0.5, spending within 1%) - the slider's
bottom third does nothing; (ii) w = 0.1 restrains raises on about half at scale 1 (S252, S206, S184, S330,
S070, S100, S354) and nearly all at scale 4; (iii) w = 0.3 at scale 4 stops raises almost everywhere,
spending falling by the baseline extra (2.5-8.5 years of target) and the median end pot rising by about
twice that; (iv) survival never falls beyond noise as w rises (a pound kept for the estate is a pound
that protects survival); (v) scale 4 moves more than scale 1 at every w. **So the useful range of w is
about 0.03 to 0.3-1 and the slider must map onto it logarithmically**, with nothing to find below 0.03.
FALSIFIED IF w = 0.03 differs from w = 0 by more than 1% of spending on three or more households, or
w = 0.3 at scale 4 leaves years above target at more than half the baseline's on most.

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
   ternary search, measured over 5.0 million combinations with 24 misses (not "never worse"; see finding M11). On six levels it
   evaluates about five, the same as today's exhaustive five. It brings that speed item forward from
   after Phase 4 into step 3, and needs the single-peak probe re-run on the six-level menu first (one
   solve, minutes). Fallback if single-peakedness fails on six levels: drop 1.1 rather than the floor,
   making raises one step (1.0 -> 1.2). **DECIDED 23 Sep (maintainer): six levels plus the ternary
   search. Measured the same afternoon:** the ternary search evaluates 4.00 levels a group on six levels
   - FEWER than today's exhaustive five - with 24 misses in 5.0 million, worst 0.009 survival points,
   under the pre-set 1e-4 line. The lighter cut is free, and the solve gets slightly cheaper.
   `results-probes-e1-unimodal.txt`. **SUPERSEDED 19:45 by the step-2 re-check:** the ternary search lost
   0.20 points on two households and is out, so the sixth level costs about 20% more solve time; the 0.95
   level stays.
3. **Raises must be matched as well as cuts.** The guardrails raise about 16 years at a typical 1.29;
   the solver WITH resilience raised about 20 years at 1.16, and WITHOUT it raises 27 to 43 years at about
   1.18 (K3). Matching cuts alone while one side raises far more would compare different spending
   policies. So K5 matches the cut side AND checks the total spending delivered, with raises capped at
   the maintainer's step-6 default. Phase 4's condition 2 (total spending delivered within 1%) nets raises
   against cuts and is the backstop; K3's raise-cap screen reports the comparison. **Step 2 bears on this
   (23 Sep):** without resilience the new baseline cut MORE than today's on several thinner households
   (S070 3.0 -> 6.7 years below target), consistent with raises being paid back as cuts - K3's own falsifier.
   **Already in the history (plan audit, 21:30): the raise weight mu is the dial for HOW OFTEN the solver
   raises, and it was calibrated once against the guardrails.** Phase 2d.4 swept mu over 0.005-0.15 on eight
   households and ran 0.003 on the 41 because the guardrails' 16-17 raise years sat below the smallest weight
   swept; at 0.003 the solver raised 23 years against the guardrails' 17, and the history notes "the
   calibration point sits lower still (about 0.0015)" - all under the old objective, with resilience on.
   Without resilience the solver now raises 15-43 years at 0.003 (`s2-fnewex`). So matching raises is a
   second dial pair, not only the cap: K5 matches cuts with (lambda, exponent) and raise years with mu,
   reporting the cap's effect from K3 beside it. The history also records that an absolute raise credit
   fights the lambda bisection above 0.05, and recommends a credit scaled to lambda if a heavier preference
   is ever wanted - irrelevant at the weights that land, noted for K6.

**AS RUN, from 24 Sep ~06:00 (after the maintainer's step-6 decisions), three stages:**
- **Stage 1** (`batch-k5.sh`, 288 cells, ~4.5 h): the step-2 twelve, with the chosen defaults on (the M17
  floor fix, raises capped at 1.1, a minimum pot of 1 year, estate weight as today). The dial is gridded as
  **c, the cost of one year at the floor**, with lambda = c / 0.2^exponent, so "how much a floor year hurts" is
  the same at every curve shape (with the floor fix on, c is also the price of a year with no money): c in
  {0.0001, 0.0003, 0.001, 0.003, 0.01, 0.03} x exponent {1.5, 2, 3, 4}. The guardrails-with-floor figures
  are read from `results/flex-tiers` (the same 3,000 paths, seed 7002); cutting is the guardrails' own
  statistic, so the minimum pot (a rule at the end) does not change them.
- **Stage 2** (~36 cells): the raise weight mu in {0.0015, 0.003, 0.006} at the stage-1 point, to match raise years.
- **Stage 3** (~41 cells): the chosen point on all 41, reported against the guardrails household by household.
- **Q2 (fitting two dials to a stepped response)** is handled by the grid itself: no fitted curve is trusted
  between grid points; the chosen point is a grid point, and the report says how far the nearest neighbours miss.

**THE STARTING GAP (from the files, no run):** on the twelve the guardrails-with-floor cut a median 2.36 years
of target spending over a retirement (1.40 to 3.33), at a median depth of 0.88. Today's solver (s2-fnewex, landed
lambdas) cuts a median 0.40 (0.03 to 2.78), at depths of 0.52 to 0.90. So matching needs about six times more
cutting.

**PREDICTION (written 24 Sep 05:55, before stage 1):**
1. The total cut rises smoothly as c falls, at every exponent; the median household's total matches the
   guardrails' (within 10%) at c between 0.0003 and 0.001, a quarter to a tenth of the median landed value (0.004).
2. Depth: at exponent 2 the solver still cuts deeper than the guardrails at the matching c. At exponent 3 or 4 the
   median depth comes within 3 points of 0.88, because the 0.95 level becomes the cheap cut.
3. At the matching point the solver's survival is at or above the guardrails' on at least 9 of 12 (the Phase 4 claim,
   previewed here, not tested).
FALSIFIED IF no grid point brings the median total cut within 10% of the guardrails' (the dials cannot reach it),
or the best match on both criteria needs exponent 2 or below.

METHOD: a grid of lambda x exponent {1.5, 2, 3, 4} on 12 households, then the chosen point checked on
all 41. Match (i) total amount cut, median household, within 10%; (ii) depth when below within 3 points,
where the menu allows it. PREDICTION: matching needs a much LOWER dislike of cuts than today's landings,
and an exponent of 3 or 4; at matched cutting the solver's survival rises above the guardrails', which
is the claim. **The ceiling is a smaller problem than first feared**: with the floor honoured, the
guardrails' survival has a median of 92.1% and sits below 95% on 27 of 41, so a 75-95% held-out panel
is easy to draw.

**K6. The dislike-of-cuts slider's spread**, centred on K5's matched value. Same method as K4. **In c, the cost of
a floor year, not lambda (R5).** Lambda's
landed values span 400x and 0 reversals in 15 adjacent pairs showed a smooth, monotone response, so the
map is close to logarithmic in lambda.

**K7. Monotone and sane - a reading of K4's and K6's sweeps, not a run of its own (plan audit, 21:30).** **With the
floor fix on, the monotone quantity is the trim cost plus the unfunded-year charge, and K5's grid adds 240 pairs (R6).**
Raising dislike of cuts never adds EXPECTED trimming, and raising the estate
slider never lowers the EXPECTED credited end pot: both follow from the Lagrangian argument, so a reversal
in either is a bug (subject to question 1 to the mathematician: the argument is for the exact optimum,
and the solver is an approximation). The median end pot and the survival chance carry no such guarantee:
a reversal there is a finding, not a bug. (Corrected 23 Sep plan review: this said the MEDIAN pot never
falls and that any reversal anywhere is a bug, contradicting the predictions register.)


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
- **Selection rules, fixed 23 Sep 18:45 before the run (`select-phase4.mjs`, `batch-p4-select.sh`).**
  Arm A for selection is exactly Phase 4's arm A: the app's own policy search then its strategy tournament
  (`versus.mjs`'s arm A code), guardrails on with a floor of 80% of target, the lookahead at 5 years.
  Excluded: every household id appearing in any file under `results/` (156 at writing). Library
  candidates in library order (128 free); FIRE candidates are every single household aged 44 or under,
  retiring at 52 instead (30 in the whole library; the 21 whose library id is unused go first; no 'F' id
  has ever been run). The pipeline searches on seed 7001; the band is measured on 1,000 paths of seed
  7005, used for nothing else; Phase 4 is judged on 7003, never touched by selection. The band is measured
  with no minimum pot, since the default is chosen afterwards; it is a ceiling safeguard, so the panel is
  not re-selected when the default arrives. Walking each list in order: the first 20 of each cohort in
  [75, 95]. **The FIRE pool is small** - 30 candidates for 20 places - so if it runs out, the library fills
  the panel to 40 and the write-up reports the split.
  **A known tilt, conservative against the solver:** arm A's tournament may change a working household's
  contributions, which the solver takes as given.

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
  Landed with `BISECT=8` (bracket ratio 1.024, not five steps' 1.21; finding M6).

### Prediction

**Re-derived 24 Sep 06:30 (R2, R3, R7, R8 in "the maths reassessed"): arm S wins survival on at least 30 of 40;
gate 2 is predicted to FAIL by about 4% unless arm A carries the user's raise cap (M23), which is the condition
most at risk.** The earlier text follows.

Arm S wins survival on most households, most where the app's fixed tier is wrong for the household
(pension-heavy, long horizons); **the no-tiers diagnostic keeps a MINORITY of the win** (corrected 21:30 plan
audit: this said "most", against the history - Phase 6 put +0.73 of the +5.03 edge over fixed rules in the
withdrawal order and the rest in the tiers, and 6b found flexible spending alone NOT significantly ahead of
the guardrails with the floor, +13.43 fully-funded at p = 0.755, against +54.93 with tiers); spending
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
- **Locks**, `plan.solver.locks`, normalised in `normalizePlan`: `pensionBefore: age | null` ("do not draw the pension before"), `tierCeiling` per wrapper,
  `lumpSum: 'free' | 'never' | 'now'`. Locks shrink the action set in `model.js`; they never add
  actions. (No contribution lock: contributions are not the solver's to choose - corrected 23 Sep plan
  review.)
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

Kept: guardrails **for the baseline plan only** - the solver's spending levels ARE its spending rule, so
applying the guardrails on top of a solved plan would cut twice (corrected 23 Sep plan review: this said the
projection applies them on top), cash buffer, returns and CMA presets, tax region, valuation date, inflation, solvency floor,
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
2. **This year's actions, per person.** A short list in the playbook vocabulary (`phraseFor`): "Draw
   the pension up to the basic-rate limit and re-wrap £Z into the ISA", "Spend £Y this year", "Move the
   ISA to the Medium tier". Each with the survival cost of skipping it, **measured by simulation** (take
   the next-best move this year, then follow the plan: the ranking check's method), never read from the
   table. (Corrected 23 Sep plan review: this read the cost from the table, against the standing rule,
   and listed contributions, which the solver does not choose.)
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
- **Quick dials** re-solve and re-simulate (a dial is a change of plan; the table has no spend dimension -
  spending levels are moves - and is never a reported number). Corrected 23 Sep plan review: this said the
  dials read the table and stay instant. At about one solve per dial movement they need the phone grid and
  E2's parallel solve to feel quick; the retirement-age dial likewise re-solves, with the progress bar visible, unless the age table has been pre-solved for
  ±3 years, which is the recommended default.
- **The Simple page** (decided 23 Sep, option (b)): "safe spend" is the highest target at which the
  solver's plan keeps reported survival at or above the user's chosen X%, and "safe age" the earliest
  stop that does the same - found by a search over solves, run only when the user asks. Until the
  switch is on it stays on `optimizeSpend` and `safeRetirementAge` unchanged.
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
  `tournament-ui.cjs`, `tradeoffs-ui.cjs`, `priorities-ui.cjs`. **Replaced by:** the solver test files
  (`research/tests/solver-*.test.mjs`, sixteen at 23 Sep), `solver-couple.test.mjs`, `distil.test.mjs`, and harnesses
  `solver-strategy-ui.cjs` (comparison, actions, rule of thumb, fidelity figure, print sheet),
  `solver-config-ui.cjs` (removed fields gone, locks shrink the actions, a slider change marks the plan
  stale and re-solves - not instant, since every stored continuation value was chosen under the old weights), `solver-progress-ui.cjs` (stale and solving states, phone progress, balance edit needs no
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
| `mu = 0.003` (raise credit) | how readily good years are spent | **swept in 2d.4** (0.005-0.15 on 8 households, old objective; 0.003 chosen to approach the guardrails' raise count, 0.0015 noted as closer) - corrected 21:30 plan audit, which found it listed as unswept; K3 screens the cap, K5 matches raise years with it |
| `SWITCH_COST = 0.0025`, `SWITCH_MARGIN = 0.001` | the price of changing risk tier | the cost set by argument (a round trip on the slice traded); the margin SWEPT on six households in phase 6 (0 to 0.01; changes halve by 0.001 with survival unmoved) - corrected 23 Sep plan review, which found it listed as unswept |
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

**Reopened by the 23 Sep scope changes (survival no longer a target, resilience gone, two sliders):**
- **The Simple page's "safe spend" and "safe retirement age", and the quick dials - DECIDED 23 Sep,
  maintainer: option (b), redefined on the solver.** "Safe spend" becomes the most a household can set
  as its target while the SOLVER's plan keeps its reported survival at or above X%; "safe age" the
  earliest stop that does the same. That reintroduces a search, but only for this feature and only when
  a user asks the question - the plan itself stays one solve. Built in Part C Phase 10; the search is
  where Brent with error-based stopping earns its place again, since each step is a full solve.
- **Couples (Phase 5) were validated under the old objective** (resilience on, a landed penalty) and
  their backtest and perturbed worlds were never run. The rollout also has three gaps to fix first
  (finding M4): it omits the trim table, takes the level from one person's move, and hard-codes five nodes. Phase 4 is singles only; couples need their own
  check under the new objective and levers before couples can ship.
- **Phase 2c's tuned weights (resilience 0.5, bequest 0.02) are obsolete** - one term is gone and the
  other becomes the estate curve. The robustness half of 2c (the edge holding in perturbed worlds) is
  re-checked by Phase 4's condition 4 under the new objective, so nothing extra is scheduled.
- **Moot now, recorded so nobody revives them by accident:** 6b's over-trim guard (condition 1b) and
  the landing's tolerance window only concern landing to a survival ask; 6c's cliff above the 4x cap
  disappears when the capped credit is replaced by K4's diminishing curve, which needs no cap; the
  search-path count (#108) matters only to the two landings that remain.

**Still open from before:**

- **#109, single-household probes at the frontier** - its first target list is answered: the phase-2
  losers no longer lose (no household behind on floor rate by two standard errors in flex-tiers). The
  remaining probes run after Phase 4, as recommendations only.
- **The tolerance window** - a maintainer decision, relevant only where a landing remains. The +0.5
  margin is load-bearing (the worst held-out shortfall was -0.47); the window above it is discretionary.
- **~~41 households, no power analysis~~ answered 23 Sep:** the per-household spread is 0.82 points, so 41
  households detect about 0.36 points of mean edge at 80% power (finding M5).
- **The eight-year bridge households** (retiring at 50) could drift past a 0.8 pension share on a bad
  path, into #106's zone, later in the bridge; a t = 0 read cannot test it. ~~Covered once the
  interpolation fix lands~~ - no fix landed. **Answered from the records, 21:30:** on S390 (retires at 50)
  the pension share never exceeds 51% in any bridge year of 3,000 paths (`s2-fnewex`), because the bridge
  is drawn from the ISA and taxable pots; S162 peaks at 57%. Only a household that STARTS pension-heavy is in
  the zone - S126 (88%), which is #106 itself. Closed for the bridge; the defect stays open for S126's kind.

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
