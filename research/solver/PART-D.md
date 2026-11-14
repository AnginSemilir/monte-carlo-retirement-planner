# Part D: couples in the solver (during the singles' beta)

**Since D91 (12 Nov):** no beta with users is under way. The rule below against a single's number moving on `main`
mid-beta has lapsed, D6 is couples on under the switch (not a couples' beta), and a merge to `main` is the maintainer's
word on B1's gate. The rest stands as written.

The launch plan's section 6 (`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 90fcb10) and
B9: D1 to D3 build while the singles' beta runs, D4 is the registered held-out test (its registration to the maintainer
before its run), D5 the couples' screens in the new planner, D6 the couples' beta. The rules while the beta runs: the
singles' tables stay the same bit for bit, with an identity test on every commit; the e3pcls pin is retaken after each
solver change; nothing merges to `main` mid-beta that moves a single's number. Couples stay on the app's rules under the
switch (D42) until D4 reads and D6.

## D1. M4's three gaps (box one day, from 6 Nov 19:45 UTC)

The archive's M4 (`archive/PLAN.md`): the couples' rollout (`src/solver/couple.js`, the archived pilot: two single tables,
half the spending each, a yearly one-step rollout over the funding split) left out the cut term, took the year's spending
level from the first person's move, and fixed five quadrature nodes. Each is now scored as the single chooser
(`scoreMoves`) scores a move:

- **The cut term.** A joint move's score charges the household's cut. This year's is the two tables' own cost of the
  household's level (`costOf`: lambda x (1 - level)^2 below the target, a raise's credit above it, age-weighted under
  `ageWeight`), averaged: the household spends at one level, so a cut is counted once, not once a person. A raise's credit
  is weighted by the chance both last, as `raiseSurvival` weights a single's. The years ahead are the two tables' expected
  future cut cost (each table's `short`, read over the same corners as its survival), averaged. So the dial reaches
  couples.
- **The household's level.** Each joint candidate tries the level of either person's ranked move, and both tables value
  where it leaves them. **Found on the way:** the exact model the couples' year runs on (`src/solver/model.js` `step`) spent
  the scheduled target whatever the move's level, so the rollout chose a level its own year ignored. It now spends the
  target times the move's level, as the engine's year does (the same line, before the guardrails). Nothing in the singles'
  path calls `step`: a single's tables and runs use `fast.js`.
- **The quadrature.** The expectation takes the tables' own nodes and weights (`quadNodes`); unset, they are the five, so
  nothing changes there.

**Its test:** `research/tests/couple-quick.test.mjs` (named in `FAST_JOINING`, so in the fast tier as it exists; into FAST
at the next unlock), on S007 at light settings with the menu's levels, a dial setting and seven nodes, three paths:
1. the exact model's year at the move's level, as the engine's;
2. the expectation on the tables' own nodes (the cut held out on both sides);
3. the cut term in the value and in the joint move's score, against oracles built from the tables' own reads;
4. the rollout's pick the best of every candidate, both levels tried; some years take a level only the second person's
   moves proposed;
5. a single's tables (S116 at the library sweep's light settings) the code before D1's, bit for bit;
6. the dial reaches couples: the household spends higher with the cut term than without it.

Plants (`--plants`), each the old rule: `nolevel` (model.js) fails check 1; `fivenodes` checks 2, 3 and 4; `nocut` checks
3, 4 and 6; `firstlevel` checks 4 and 6. All four together are the code before D1, bit for bit: the couples' rollout on
S007, 60 paths, the same outcomes as on b4ea006. The old couples test (`solver-couple.test.mjs`, no dial and one level)
reads exactly as before. The results: `results-couple-quick.txt`.

## D2. The candidate's features on two tables (box three days, from 7 Nov 07:30 UTC)

The launch plan's D2: each person's table at the candidate's settings (the tier state per person, three steps below,
HR, the table without the dealing cost, the failure year at what it can pay, the floor), the bridge reader with the
household's money (O11), the two tables solved side by side; tested by the engine and the couples' year in step, O11's
case planted, and the singles' tables and the pin unchanged. In parts, each with its test:

- **D2.1, the engine executes a couple's joint move** (done). A solved couple's year needs the engine (`src/App.jsx`
  `stepYear`, under a table's move) to carry what the joint move says: the share of the net need the first person funds
  and each person's own draw order, harvest and ceiling, as the exact model's year (`model.js` `step`) applies them. Before
  it the engine split a couple's need evenly in one order whatever the move. A single's move, and a couple's year with no
  table, run as before. **Found on the way:** the exact model's couple year had no case for N4's pension ceilings
  (`menuPlus: ['hr']`, the candidate's): a `penHR` step in a couple's order or one-off cost order reached `drawPot` with no
  pot id and threw a TypeError, and an `hr` harvest ceiling fell to the personal allowance. Both now draw as the engine
  draws (the engine's own `N4_PEN` and `N4_HARVEST`), and any other step the year knows nothing of throws by name.
  **Its test:** `couple-lockstep.test.mjs` (the full tier): eight library couples, three paths each, every year a random
  joint move from the candidate's menu (an uneven split, two orders, HR's ceilings, every spending level, now and then the
  lump sum): the engine and the model within a pound on every pot, basis, gain carried, tax-free cash, cash ISA, lump-sum
  flag and the year's flows; the engine's years with no table and a single's years under a solved table the code before
  D2's bit for bit; an unknown step throws by name. The plant `non4` (the model before D2) fails checks 1 and 4; the
  engine of c6f9456 fails check 1 (`results-couple-lockstep.txt`).
- **D2.2, tiers per person** (done). Under a couple's joint move each person's pension and ISA move to the tier their own
  move holds, are charged the round trip on the slice traded, and grow at it, in the engine (before it, `self` only) and in
  the exact model (before it, none: `model.js` gains each person's `tierHeld`, the switch at the engine's place, after the
  cash ISA and before growth, and `profileOf`, the profile a pot grows at; `prepare` takes `tiersBelow`, so the model's
  lists are the engine's). couple.js grows each pot at its person's tier held, in the forward run and the rollout's
  expectation. And each person's tier lists take the third step down by their own wrappers: before it the engine built the
  second person's lists by the first person's rule. **Its test:** `couple-lockstep.test.mjs` as above, each person's tiers
  switched at random (the third step down on half the couples) and the tiers held and the switch charged compared too; a
  single under a tiered table the code before D2's bit for bit; check 5, every library couple's per-person lists that
  person's own table's (`tiersFor`), with one couple made where the two people take the third step differently (no
  library couple does). The plant `notier` fails checks 1 and 2; the engines of c6f9456 and a82c904 fail checks 1 and 5.
- **D2.3, the tables at the candidate's settings** (done). `solveCouple`'s `solveOne` solves each person's plan as a
  single's is solved (`solveForApp`: the tier state three steps below, HR, the table without the dealing cost, the
  failure year at what it can pay, the floor at 80% of their share), the two side by side. The rollout ranks each
  person's moves with the tiers they hold, as their own chooser does (`rankFor`: the round trip in the flows, a move that
  leaves the tiers held paying `switchCharge`, the mixture's worlds weighted), charges each person's switch in the joint
  score, and reads each person at the tier pair their move goes to (`solve.js` `value(s, t, layer)`, the tier state's
  layer). The engine runs a solved couple (`couplePolicy`, `withCouple`: its state read as the model's). **Found on the
  way:** each person's plan carried the household's whole minimum pot (`singlePlanFor`; 84 of the library's 210 couples
  set one), and a household whose plan sets none was judged against none while each person's table set one
  (`solvePlan`'s `minPotYears`); the two now add up. **Its test:** `couple-tables.test.mjs` (the full tier), S007 and
  S105 at the library sweep's light settings: (1) each table a single's at the candidate's settings, the two minimum
  pots the household's; (2) on every library couple and one made, the two plans add back to the household's on every
  money amount; (3) the layer reads against grid.js's own reads of that layer, world views too, and the expectation
  against an oracle that reads each person's layer by hand; (4) each person's candidates their chooser's pick, the joint
  score against an oracle with each switch charged, the chosen move the best; (5) the engine under the solved couple and
  the rollout, the same joint move every year and the same end; (6) S116's and S224's tables, value reads and runs the
  code before D2.3's bit for bit. Plants: `fullfloor` fails checks 1 and 2, `nohhfloor` 1, `baselayer` 3 and 4, `nocharge` 4,
  `noheld` 5 (`results-couple-tables.txt`).
- **D2.4, the bridge with the household's money** (the archive's O11, done). Each person's table reads their bridge as
  paid from their own ISA, taxable account and cash (the bridge reader's chance). In a year either person's table reads
  as a bridge year, the rollout reads the two people with their accessible money shared between them as best serves both
  (`shareBridge`): x moved from one to the other, each wrapper to the same wrapper (the taxable account with its share of
  the basis), x at most what the giver holds and the receiver's floor bills ahead to their access (`bridgeTable`'s
  need), x = 0 always among those tried (nine points, then a golden-section refinement). Pensions never move. Two limits,
  which no test isolates: the giver's pension, where they can draw it, is not counted, and a year before a bridge starts still
  reads it on the person's own money (only bridge years are read with the household's); D4 reports A1 and S1 over the couples
  either of whose candidate tables reads a bridge year, a measure of the bridge's handling as a whole, not of either limit. **Its test:**
  `couple-tables.test.mjs` checks 7 and 8, on a planted O11 couple (made from S105: the second person retired at 50,
  eight years from their pension, with £40,000 they can reach; the first past access with a large ISA): (7) the share
  within its bounds, the read at it the best the search tried, never below the own-money read and above it at every
  bridge decision, short of a 41-point scan by nothing, each wrapper's household total, the pensions, the basis and the
  giver's gain share kept, and after the bridge the expectation the own-money one bit for bit; (8) the year-0 read of
  both lasting with the household's money within 10 points of the household's simulated survival, on each person's own
  money more than 50 points below it. Plant `ownmoney` fails both (`results-couple-tables.txt`).

## D3. The levers for couples (box one day, from 7 Nov 12:25 UTC)

Each person's table is a single's solved by `solveForApp` on their own plan (D2.3), so the plan's aims and locks reach
both tables as they reach a single's; D3 makes each lever hold for the household:

- **The dial**, through D1's cut term: each table at lambda times the position, the household's cut counted once.
- **B3a's age weights on the chance that at least one partner is alive.** A single's weights are the Gompertz chance of
  being alive at each year. A couple spends while either lives, so each person's table now weighs a cut by
  1 - (1 - w_self)(1 - w_other), the other person's age given to the solve (`solveForApp`'s `ageWith`, `solve.js`
  `ageWeighted`'s `with`); the two tables' weights are the same. A single's are as before.
- **The candidate's tiers locked per person.** Each person's table above position 1 is solved on their own base (their
  plan at position 1), and the rollout now keeps each person to the tier pair their base's chooser picks where they
  stand (`rankFor`, as `chooseAction`'s `lockMask` does a single's). Before D3 the rollout ranked each person's moves
  unlocked.
- **Consent** withdrawn: each table one tier pair, so neither person's tiers move.
- **The locks, for each person.** The plan's locks are the household's (the pension age, the tier ceiling on every
  pension and ISA, the lump sum), applied to both people's plans and the household's; each is checked on each person.
  Locks that differ between the two people wait on D5's screens ("the limits per person").

**Its test:** `couple-levers.test.mjs` (the full tier), the singles' all-pairs design (`lever-matrix.mjs`) on two
library couples (S007, S127), each person's table at the library sweep's light settings: (1) the design covers every
pair; (2) each combination solves, each person's run record (lambda, the age weights with the other's age, the floor,
the base and its lock), each person's pair the base's at every decision of 20 paths, and on 100 engine paths consent,
raises blocked and each lock held for each person; (3) the age weights by hand; (4) plants: the lock dropped in the
rollout (`nolock`, the code before D3), the age weights each person's own (before D3), the base with the other estate
weight, the floor at 0 (`results-couple-levers.txt`).

## D4. The registered held-out test (built as Phase 4's; its registration to the maintainer before its run)

The launch plan's D4, its arms, panel and rule as given there; the build, from 7 Nov 15:00 UTC:

- **The panel** (`couple-panel.mjs`, `couples-panel.json`): the held-out scan (`held-out.mjs` touchedAll: this branch's
  results, the archive, the old manifest, the tests and the review branch's reviews), and the couples the tests take by
  their place in the library rather than by name (couple-lockstep's eight couples and twelve households, engine-side checks
  only, left out all the same), frozen once in `couples-orders.json`; 20 library couples whose first person is older than
  44, taken evenly, and 20 whose first person is 44 or under, each person retiring at 52 (the id with an F); each landed
  so the app's rules (arm A, searched on seed 7001, no tournament) survive 85 +/- 1% on 1,000 paths of seed 7005; the floor
  at 80%, the minimum pot the couple's own or one year's target, the one-off costs as the library has them, the
  candidate's return assumptions on every arm.
- **The arms** (`audit-couples.mjs`): APP as Phase 4's; CANDC, each person's table solved as the app solves a single's
  (`solveForApp`, 45 points, the estate aim at 0.02 or 0.01) and the couples' rollout of D1 to D3; SHIPC, each person's
  table at the product's settings (30 points) and the same rollout; each executed by the engine, a couple's five units on
  one inputs hash; the rollout in the exact model beside the engine on 500 paths of each solver unit.
- **The read** (`reduce-couples.mjs`): Phase 4's rule, A1, A2 and S1 at both estate weights; D34's harm flags, each
  couple's threshold from its own realised discordance at its paths (a two-couple pilot cannot size forty couples one by
  one, `size-couples.mjs`); the cost years' spending delivered apart.
- **The seed:** 7021, used by no run before (the held-out scan of seeds: no file in the tree or the review branch names
  it as a seed); reserving it in `check-prediction.mjs`'s registry is a protected edit, asked of the maintainer with the
  registration.

## D5. The couples' screens in the new planner (box three days, from 13 Nov 22:00 UTC; the launch plan's two, D58's recast)

The launch plan's D5 (section 6; LAYOUT.md sections 6 and 13): "What matters to you" and the limits per person, this
year's actions per person on Your plan, the wording for a household, the couples card retired, `solver-planner-ui.cjs` with
a couple. Behind a switch, `COUPLES`, off in the source: D6, couples on, is the maintainer's word (D91), so until then a
couple's plan keeps the card and the app's rules exactly as now, and the harnesses' light build turns it on. With it on, a
couple whose first person holds less than 40% or more than 60% of the pots keeps the app's rules until item 6's stage C
reads (M4 in D66), and the page says why. The box is a day over the launch plan's two: the worker and the figures below
were built for one table, and a couple brings two and the joint move.

- **D5.1 The couple's solve, from two single solves** (no screen). Each person's table is solved as an ordinary single
  solve on the plan couple.js cuts for them (`couplePlans`, factored out of `solveCouple` so both take the same plans),
  with their partner's age today (`ageWith`, D3): its own key, so the store keeps and restores it; split across the
  workers; a dial position's base first; progress named for whose table it is. The owner then assembles the couple
  (`solveCouple`'s `solveOne` handing back the two tables, each checked to be the one solved for that person's plan), and
  keeps it as the solve in hand. Test (`couple-solve-client.test.mjs`, in Node, calling `couplePlans`, `assembleCouple` and
  `solveCouple` directly, with no worker, client or store): the assembled couple the same as `solveCouple` run whole, its
  two tables' digests and the engine's run of the couple on 200 paths bit for bit; every single keyed as on the code before
  D5 (the digest of the library's 210 singles' keys, pinned on fefdb387's parent); plants: the two tables swapped, a table
  solved without `ageWith`, a partner's age of null in every key. The couple restored from the store is
  `couple-split.test.mjs` check 2's (the client, stand-in workers) and the browser harness's check 19's (light settings).
- **D5.2 The couple's figures.** The worker's questions on a couple: `simulate`, `strategy` (the headline, the comparison,
  the outlook) on the engine's run of the solved couple (`withCouple`), the first retired year the household's (either
  person retired, the engine's rule), `digest` over both tables. The rule of thumb (`distil`) is for one table and says so
  for a couple. Test (`couple-figures.test.mjs`): each figure against the engine's own run of the solved couple, path for
  path; the plan as entered beside it as for a single; plants: the household's first year read from the first person
  alone, the solved couple's context swapped for one person's.
- **D5.3 This year's actions, the next years and the ledger, per person.** The joint move taken apart for each person (their
  spending share, draw, harvest and tiers) and the split; each part's skip cost as a single's (the best-ranked move that
  differs in that part, for that person, the other's move and the split held, forced in the first year, the plan on after),
  split across the parts as a single's; the next ten years and the audit rows with both people's moves. Test
  (`couple-actions.test.mjs`): the parts read back from the joint move the engine took, each skip forced as stated, the
  costs the same with the plan's runs handed in as run afresh (split against whole is `couple-split.test.mjs` check 1's);
  plants: a skip that moves the other person, the split dropped from the forced move.
- **D5.4 The screens.** `solverRules` widened to a couple under `COUPLES`, inside the band; Your plan's answer card, the
  outlook and this year's actions in a household's words ("you and your partner"; each person's actions under their
  name); What matters to you (the household's aims) and the limits per person (each person's locks, as D3 built them); What
  if's target card and scenarios for a couple, the age card per person where it can (else it says why); Details with both
  tables' settings and the ledger; the couples card shown only where `COUPLES` is off or the couple is outside the band,
  then saying why; the quick start's "Planning for two?" line moved with it. Tests: the wording table's household strings
  (`solver-words` checks), and the next step's harness.
- **D5.5 The harness.** `solver-planner-ui.cjs` gains a couple: the couple solves (two tables, the progress naming each),
  the answer card and actions per person, the figures the worker's own, bit for bit as the single's checks are; a couple
  outside the band shown the card with its reason; `COUPLES` off, the card and the app's rules exactly as before; each
  check failed once on its plant. Then B1's gate in both modes, the reviewer, a report to the maintainer with the
  screenshots; D6 (couples on) stays the maintainer's.

**D5's state (13 Nov, night; uncommitted parts committed with their tests).** D5.1: `src/solverCouple.js` (couplePlans,
assembleCouple), the worker's slot for each person and its `couple-plans` and `couple` asks, the client's couple phases
(`startSolve`'s `couple`; `useSolver` and What if's `startFigures` route a couple there), each person's key carrying their
partner's age (`solverKey.js`, a single's key unchanged); `couple-solve-client.test.mjs` 6 checks, the couple from two
solves bit for bit `solveCouple`'s whole, plants 'swap' and 'noage' failing, and (14 Nov, the reviewer's finding 7) check 6
pinned to the singles' keys before D5, its plant 'agenull' (`results-couple-solve-client.txt`). D5.2: `solvedContext` and `retireYearOf` for a
couple (the household retired from the first year either person is); `couple-figures.test.mjs`. D5.3: the joint move taken
apart for each person, each skip forced on its own person, the next years and the rows (`coupleActionsOf`, `coupleAheadOf`,
`coupleRowsOf`, dispatched by the worker; the rule of thumb is one table's and says so); `couple-actions.test.mjs` 5 checks,
plants 'skipother' and 'nosplit' failing. D5.4: `src/couplesSwitch.js` (COUPLES, off; the band, held to couple.js's);
`solverRules` widened to an in-band couple with couples on; the couples card only for a couple the solver does not run,
giving its reason ('off' or 'uneven', with the shares); Your plan's headline, actions, split and next years, the ledger and
the printed sheet in a household's words (`couple-words.test.mjs` 5 checks, plant 'partneryour'); What if's age card and
limits card saying the age moved is the first person's; a couple's scenario solved where couples are on and it is in the
band; the quick start's line for two; the strip naming whose half is being worked out. D5.5: `solver-planner-ui.cjs` check
19 (a build with COUPLES_ON=1: an in-band couple solved, its figures the reference's bit for bit; re-held 90/10, the card
'uneven'), check 10's card 'off', plants 'couplecard' and 'coupleage'.
The limits per person (14 Nov, after stage C's launch, as planned): each person's ceiling on the riskiest tier of their own
pension and ISA (`plan.solver.locks.tierCeilingPart` for the partner; App.jsx normalizeSolverLocks keeps it only where a plan
carries it, so every other plan and every stored solve's key are as before); src/solver/couple.js cuts it into the partner's
plan, and src/solverSettings.js lockedPlan holds each person's accounts to their own on a couple's plan; on a single's plan it
neither reads the field nor keeps it in the plan the solver takes, so a couple's plan made a single's locks, keys and solves
as without it (the reviewer of 14 Nov, finding 2: before, a single carrying it had the tier above switched off). The Limits
card gives each person a row for each wrapper they hold only where the couple is solved (couples on, inside the band), the
first change writing both; anywhere else it is the card as before D5, a row a wrapper for the household (finding 1: with
couples off it had changed). The pension age and the lump sum stay the household's (the engine keeps one access age and one
lump-sum choice for a household), and the card says so; the diagnostic names the partner's ceilings.
`couple-limits.test.mjs` (the full tier) 5 checks: the cut and the household's accounts; every one of the library's 420
households under three settings the same through lockedPlan as through the function before (1,260, none differing); solved,
the partner's pension never riskier than their ceiling on 40 paths while the first person's menu runs to High Risk; the
partner's ceiling changed alone leaving the first person's plan and key as they were (their stored table restored); every one
of the library's 210 singles carrying a partner's ceilings the same through lockedPlan as without them, and S126 keyed as
without them; plants 'nopartlock' (checks 1 and 4: the cut before D5), 'nopartceil' (checks 1 and 3: the household and the
partner's table disagree, and model.js step refuses the move, never runs it), 'partfree' (check 2: the partner's wrappers
left free where they have no ceilings of their own) and 'singlepart' (check 5: the field read on a single's plan, as before
14 Nov); `results-couple-limits.txt`. The browser harness's check 10 reads You's Limits with couples off (as before D5, its
first change writing the household's ceiling alone), its plant 'lockspart'.
D5.6 (14 Nov): a couple's figures shared across the solve's parts. A couple's path costs about 150 to 200 ms at the app's
settings (the couples' re-run's pilot); profiled (EXPLORATORY, light settings, `results-couple-path-profile.txt`), about 77% of it is each person's own ranking
(the single's chooser, once per person per year) and about 14% valuing the joint moves, so the paths are what to share. A
stored solve was restored in the owner alone (solve.js refused a split restore), so a couple with either table from the store,
and a returning single, kept no parts. Now: a stored solve is restored split (solve.js and adaptive.js: every part makes the
same tables on the arena, part 0 copies the record in, the others follow it with the record's small fields alone,
src/solverCache.js followRecord; no table is copied per part), and a couple's two solves run on the same parts, which then
assemble the couple beside the owner and run their shares of its paths ('runs') and skips ('skipruns', coupleSkipRuns, joined in
path order). Found on the way and fixed: under a split dial position every part carried the base reference's counts, so their
sum was the parts times them (a diagnostic, no figure). The restore's code in solve.js sits in two helpers at the file's end,
keeping solve() under V8's optimised bytecode limit (`solve-size.test.mjs`). Tests (the full tier): `restore-split.test.mjs` 5 checks (S370 restored
split three ways: every part's tables, reference and its counts the whole restore's bit for bit, the figures on 120 paths
joined the whole's; a split dial position's counts the same as unsplit), failing 4 of 5 on the code before, plants 'stale' (2)
and 'noasty' (2, 3, 4) (`results-restore-split.txt`); `couple-split.test.mjs` 5 checks (the client driven through stand-ins: S069 with three parts, each part
holding both tables and assembling the couple, the figures and the skip costs the whole run's; again from the store, restored
split; a single restored split; a part's share of the skips missing a path refused; and, 14 Nov, the reviewer's finding 6, a
couple's What if variant neither restored nor stored, each person's solve keyed only where the job is), plants
'coupleowner' (1, 2), 'wholerestore' (2, 3) and 'keyvariant' (5) (`results-couple-split.txt`). In the browser:
`solver-planner-ui.cjs` check 19 reloads the couple at the harness's light settings: both tables restored and every figure
the reference's again; whether the parts then ran shares of the paths it cannot see (the diagnostic's parts are the last
phase's count), which `couple-split.test.mjs` shows for the client.
The store in chunks (14 Nov, found by the reviewer's finding 3 and fixed): this container's Chromium (153 since the restart of
13 Nov) refuses any one IndexedDB value over 133,169,152 bytes, and a solve's record at the app's settings is about 200 to
290 MB (`results-profile.txt`: 204 to 291 MB, kept and restored in about 2 s on Chromium 141 on 4 Nov), so since then no solve
at 45 points was kept, a single's or a couple's, and every visit solved again. The store said only "the store failed (null)":
during the refused put Chromium fires an error event at the transaction before setting its error, and the store's
transaction rejected on that event; the next request then threw at once, an unhandled rejection in the worker (the probe in
`results-couple-timing.txt`). `src/solverCache.js` now keeps a record as a head beside chunks of at most 64 MB of its typed
arrays, each its own value, joined back on a load; a record kept whole before loads as it was; an evicted or replaced solve
drops all its chunks; a store that fails names the browser's own words, taken at the abort, and what the transaction's work
throws aborts it. `cache-chunks.test.mjs` (the full tier) 15 checks on an in-memory IndexedDB that refuses a value over a set
size in Chromium's order (a 140 MB record whole refused with the browser's reason and in chunks kept and loaded bit for bit;
S370's light record restored from chunks to the same tables; no rejection left unhandled), failing 12 of 15 on the code
before, plants 'whole' (2, 3, 5) and 'keepparts' (3) (`results-cache-chunks.txt`). In the browser at the app's settings
(`results-couple-timing.txt`, EXPLORATORY, on 59315a29: S069, four workers, stage C's four runs beside it at the lowest
priority): both of the couple's tables kept, and after a reload restored in 8.1 s, where the run before the fix solved them
again in 176.4 s; the reloaded headline's 2,000 paths 101.0 s against 92.2 s fresh, so a restored couple shares its paths as a
fresh one does; a headline path 46.1 ms shared against 86.4 ms in one worker (1.87 times as fast).
Known limits, each said where it shows: the store keeps two solves (CACHE_MAX), so a couple at a dial position above the first
restores in part; the age searched by the age card and the limits card is the first person's; a dial position's parts each
restore its base from a shared copy, so a couple at a dial position above the first holds more memory than a single's, and a
returning single at a dial position above the first now holds its base in every part as a fresh split position does (the
reviewer's finding 5: more than before D5.6, not measured for a restore).
The reviewer at D5 (14 Nov): FAIL, three BLOCKING (`reviews/2026-11-14-d5.md`: the limits card with couples off, a single
carrying a partner's ceiling, no restore at the app's settings), each answered in one fix (D81 (F)); then PASS
(`reviews/2026-11-14-d5-2.md`), its two MINORs answered: `profile-couple.cjs` keys its couple's job as the page does (a
couple's job without a key now keys neither person's solve), and the page's note that a solve is not kept keeps the first
store not kept where a job stores more than one solve (src/solveStatus.js storeNoteAfter; `store-note.test.mjs`, the full
tier, 3 checks, its plant 'lastnote' failing 1 and 3; `results-store-note.txt`).
What the tests leave unshown (the reviewer's finding 4): on the follow path only the strategy's figures run
(`restore-split.test.mjs` check 4; a restored single's skip costs shared out run nowhere); `couple-split.test.mjs`'s stand-ins
solve each table whole and never follow, so it tests the client's sequence and not the worker's 'follow', 'part' with a
restore, 'couple' or 'skipruns', which run only in the browser; a restored dial position split, the branch where the two
people do not split alike, and a cancel or close with the shared parts alive run in no test; check 19's couple (S001 at the
light settings) survives every path, so of its figures the bands alone test much, and no plant fails its reload by a fault in
the restore.

## D6. Couples on (14 Nov; D97 (1), D99)

By item 6's stage C, read once on 14 Nov: PASS (`registrations/couples-share.md`, `results-couples-share.txt`,
`reports/2026-11-14-stage-c-read.md`), and the maintainer's D97 (1), in one commit with the D-line naming the run (D99):
- **the couples' default:** each person's table solved on their share of the pots outside 40% to 60%
  (`src/solverSettings.js` `APP_COUPLE`, `shareRule: 'pots'`), the page's solve of a couple taking it
  (`src/solverClient.js` `startSolve`). The solver's own default stays the half share, a research option there;
- **the guard:** a couple runs the solver when its first person holds 40% to 60% of the pots, or when its first person
  is the elder by age and holds more than 60% and at most 90% (`src/couplesSwitch.js` `ELDER_UP_TO`, `ELDER_FIRST`, the
  ages read as the engine reads them). Every tested couple had its elder entered first. The deep review found why an
  elder entered second is a different case: the joint move weighs both estates at the first person's own table's weight.
  A couple that keeps the app's rules, and the couples card (which now says what has been tested):
  - its younger partner holds more;
  - its elder is entered second and holds more;
  - its elder holds over 90%;
  - its two people are the same age and are outside the band;
- **the switch:** `COUPLES` on. Off, the rollback, is a harness's build with `COUPLES_OFF=1` (vite.config.js), which
  `solver-planner-ui.cjs` check 10 builds to see a couple's screens exactly as before D5.

Its tests:
- `couple-default.test.mjs` (fast tier): the decided-defaults block against the code. The guard over the library's 210
  couples re-held at twelve shares under four arrangements of their ages, held to the engine's own reading of the ages. The
  page's solve of a couple held 90/10, cut and assembled on the pots' share. Its plants 'firstnotelder', 'eldereither'
  and 'halfdefault' each fail exactly their check.
- `couple-default-identity.mjs` (EXPLORATORY, `results-couple-default-identity.txt`): a couple's solve at the new defaults,
  by the audit's route and the page's, against the code stage C tested, on four of its units.
- `couple-solve-client.test.mjs` check 5: the switch on wherever the half share holds.
- The harnesses:
  - `solver-planner-ui.cjs` check 19, on the site's build: a 60/40 couple solved bit for bit; 90/10 with the elder solved;
    25/75 the card 'uneven'.
  - `solver-config-ui.cjs` and `solver-strategy-ui.cjs`: their couple a couple outside the guard.

Not yet measured: a couple's solve on a phone. Each part holds both people's tables, about twice a single's memory, and
Phase 11's phone budget and memory were measured on a single's. It is in the queue.

The reviewer on the change of default: FAIL, one BLOCKING, answered in one fix with its five MINORs
(`reviews/2026-11-14-default-d99.md`; `reports/2026-11-14-stage-c-read.md`):
- the coverage list follows the switch;
- the 90/10 couple is solved to the end in the harness, against a reference on the pots' share;
- a blank age or end age is read as the engine reads it;
- the words at the guard's edges are corrected.

The reviewer again before `main`; merged on B1's gate with batch 3 and the speed mode (D92).

## D7. Couples in the other order (planned; D100)

The maintainer, 14 Nov: "Ensure a follow up test is placed in the plan so we can open up couples in the other order."

**In plain words.** The app calls the first partner entered "you". Stage C tested couples where "you" are the older
partner and hold most of the money. So since D99 the solver plans for a couple holding its money unevenly only when the
older partner is entered first. The other way round is common: "you" are the younger partner and your older partner holds
the larger pension. Those couples keep the app's rules until this test reads.

**Why it was held back.** The deep review of stage C (`reviews/2026-11-14-deep-couples-share.md`, section 2) found the
joint move is not symmetric in the two partners. It weighs both estates at the first-entered person's own table's weight,
which is 0.02 of that person's opening wealth. When the first person holds little, the estate counts three to nine times
more than in any tested couple. A plan entered the other way is also a different plan, its horizon counted from the first
person's age.

**Stage A (EXPLORATORY, seed 7002, its rule committed first; after the share ensemble).**
1. The build. The joint estate weight is made the same whichever partner is entered first: the elder's table's weight, as
   an option, off in code. Its test:
   - a couple entered elder first, every couple stage C and the couples' re-run tested among them, is solved the same bit
     for bit;
   - the weight is the same whichever partner a couple has first;
   - equal ages keep the first person's weight.
2. The read. Stage C's twelve couples are entered both ways: the elder first as tested, and the younger first with the
   horizon held to the same year. Each is held so the elder holds 75% and 90%, each order is solved with and without the
   option, and all are run on the same paths. The rule, committed first: the other order within D4's targets of the
   tested order (0.5 points a couple, 0.2 pooled), with the option and without it.
   - With the option within the targets: stage B tests it.
   - Within them without it too: stage B tests the candidate as it is.
   - Neither: back to the maintainer.
   - Cost: about half a day to build and a few core-hours to run.

**Stage B (registered: a new held-out seed, its registration and design review first).**
- The twelve couples entered the other way, the younger first and the elder holding 75% and 90%, landed so the app's rules
  survive about 85 in 100.
- The candidate, with stage A's option if its read chose it, against the app's rules by stage C's rule: D34's harm rule on
  each couple and the pooled gain.
- Its PASS opens the guard for the elder entered second (`src/couplesSwitch.js` `ELDER_FIRST` off), with stage A's option
  in the candidate if it was chosen, in one commit with the D-line naming the run, the reviewer on the change of default.
- About 40 core-hours, the registration of stage C's estimate for twelve couples mirrored.

**Not in it.** A couple whose younger partner holds more than 60% is still untested, in either order; the same machinery
could cover it in a later run. Also untested: a couple whose elder holds over 90%, and a couple whose two people are the
same age outside the band.
