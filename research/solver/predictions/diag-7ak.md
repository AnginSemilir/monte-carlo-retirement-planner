# Prediction: diag-7ak

- **Run:** `research/solver/batch-7ak.sh` - results/diag7ak/case0-1.txt and each unit's OPEN0 and TS+J traces (audit-7ak.mjs), read beside P's records (results/diagP); reduced by `reduce-7ak.mjs` in the real tree into results-7ak.txt
- **Kind:** test
- **Written:** 30 Sept, before the run (its time is its registering commit's, git log); designed by the deep review after P (deep-review-log.md, 29 Sep 23:31 UK), the families' root-cause step after P (RULES.md section 9 rule 5)
- **Seeds:** 7002 tuning (the first 8,000 of P's 16,000 node paths, the same paths P ran). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched. **Disclosed (RULES.md Known limits item 18):** the snaps' premise was measured before this prediction was written, by research/tests/snap-7ak.test.mjs (a unit test on a 6-point bridge 4 under P, not this test's run): the chooser at a live cell's own state reproduces the cell's stored move on 582 of 582 cells, while on dead cells (stored survival under 0.02) it matches 44.5% - which is why item 1 exists; and its preflight (4 points, 20 paths; no figure read)
- **Unmasking:** none - nothing is fixed or judged for harm: the test re-scores P's own run, one piece of the table at a time, to locate its forward-against-cell disagreement
- **Plan section:** PLAN.md "7ak"

## Question

Under P, on bridge 4 the forward run holds where its own table's cell leaves, and the reverse, on 8,959 of 27,448 held path-years (P's 16,000 node paths, years 1 to 7; results-P-slices.txt), following the bridge's calendar. Which part of the table carries that: dead cells' arbitrary stored ties, the reader's chance read at the cell's accessible money, the pension-share axis a, or another single coordinate - and does the table misprice the de-risk on switching boundaries?

## Derivation

- **The records** (derive-7ak.mjs, results-derive-7ak.txt): bridge 4 under P holds 27,448 path-years in years 1 to 7 on P's 16,000 node paths and disagrees on 8,959, so about 4,480 on 7ak's 8,000; S194 disagrees on none (every OPEN0 path leaves in year 1). A share's standard error at 4,480 disagreements is 0.60 points at 0.2 and 0.75 at 0.5: the thresholds sit about 40 standard errors apart, so items 1 to 3 read decisively if most disagreements are live.
- **The premise** (research/tests/snap-7ak.test.mjs, 8 passed): at a live cell's own state the chooser reproduces the stored move (582 of 582 at 6 points), so a snap that turns the chooser to the cell's move names a coordinate whose off-grid value makes the difference; at a dead cell the stored move is an arbitrary tie (44.5% agreement), so a disagreement there is no mispricing.
- **The ranking to test** (the deep review after P): (1) the reader's reference and bridge read - the disagreement follows the bridge's calendar (bridge 4 years 1 and 2 one way, year 3, its last bridge year, the other); (2) the pension-share axis a and the snapped buckets before access; (3) TS+J's joint layers across switching boundaries; the world-blind chooser is a trade, not mispricing.
- **Item 4's resolution** (results-derive-7ak.txt): at 32,000 year-1 paths (two units, two rules, 8,000 a run) the boundary's excess mispricing resolves to about +/- 0.5 points split evenly, +/- 0.8 at one boundary path in ten; the paths of the two rules are the same paths, so the rules are not independent (declared: the interval treats them as if they were, and so is too narrow by up to about 1.4 times).
- **Claude's choices, before any run:** the two units and P's settings (the review's); OPEN0 for the snaps (TS+J holds no plan-tier years under P on these units); years 1 to 7 (P's log); the snaps (the review's list; the reader's at the nearest cell's accessible money, W (1 - a) at the grown position's nearest W and a, through grid.js g.readerAcc, a research hook unset in every other path); dead at a stored survival under 0.02 (the unit test's split); a boundary as a neighbour along W, a or b whose stored move leaves or holds the other way.

## Prediction

Item 1 FALSIFIED: under a fifth of the disagreements sit at dead cells (bridge 4's node survival is 98%). Item 2 HELD: the reader snap turns half or more of the live disagreements to the cell's move. Item 3 FALSIFIED: the a snap turns under a fifth. Item 4 INCONCLUSIVE.

## Falsified if

Item 1: half or more of the disagreements sit at dead cells. Item 2: the reader snap turns under a fifth of the live disagreements. Item 3: the a snap turns half or more. Item 4: the boundary's excess mispricing's lower end is above 0.5 points (a clear boundary mispricing).

## Fair-test table

The "arms" are the chooser re-scored at the path's own state and at the state with one thing snapped to the nearest cell, on P's own solve and paths; the reference is the cell's stored move.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | P's first 8,000 node paths (seed 7002, world 0's node) | the same path-years | SAME - each snap re-scores the same path-year; the runs are held to P's traces field by field |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing: lambda held |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the chooser at the path's own state | the chooser with one coordinate (or the reader's accessible money) at the nearest cell's | TESTED - one thing at a time |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against its own table |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code | this code | SAME - one code; the code since P adds E3's copy option (off here) and the reader hook (unset but for the reader snap): each solve is held to P's table and ran line and each run to P's traces, so the code is P's where it runs unhooked |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | the share of disagreements a snap turns to the cell's move; the year-1 table survival of the chosen move against the realised | the same | SAME - declared |
| 31 | Paired or not, and the standard error used | shares of counts over path-years; item 4 a normal interval on realised shares | the same | SAME - declared (item 4's rules share paths: its interval too narrow by up to about 1.4 times) |
| 32 | The table's number is never the result: survival is simulated | items 1 to 3 read decisions, not survival | item 4 reads the table against the simulated survival | N/A for items 1 to 3; item 4 compares them, which is its point |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Pooled over years 1 to 7 on bridge 4** (S194 reported beside): a disagreement is a held path-year (holding the plan's tiers) where the forward move and the nearest cell's stored move for that layer differ in leaving; dead when the cell's stored survival is under 0.02; the snaps are scored on the live ones.
- **Item 1 (dead cells):** the share of disagreements at dead cells. HELD at 0.5 or more; FALSIFIED under 0.2; else INCONCLUSIVE.
- **Item 2 (the reader):** the share of live disagreements the reader snap turns to the cell's move. HELD at 0.5 or more; FALSIFIED under 0.2; else INCONCLUSIVE.
- **Item 3 (the pension-share axis a):** the same for the a snap.
- **Item 4 (switching boundaries):** at year 1, OPEN0 and TS+J on both units pooled, (table - realised) on boundary cells less (table - realised) on interior cells, in points, with a 95% interval from the realised shares' binomial variance (the table's averages fixed). HELD when its lower end is above 0.5; FALSIFIED when its upper end is below 0.5; else INCONCLUSIVE.
- **NOT SETTLED:** any gate fails (the stamps of 7ak and P; a unit missing or not done; a solve not P's table and ran line; a run not P's first 8,000 node paths field by field; inconsistent counts), or the all-snap - the cell's own state - turns under 0.95 of the live disagreements to the cell's move (the premise fails in the field).
- **Reported, not items:** each snap's share by year; the W, b, gain and lump-bucket snaps; S194's lines; the level lines by rule and unit; and world 0's table survival of the chosen move against realised survival by year, on the paths alive that year, pooled by stage - the bridge (years before access) and after access (added before registration by the deep review after 7ah, 30 Sep 14:39 UK, adopted by the maintainer 30 Sep 15:19 UK: so a level error, O66 - S194's bad world reads +8.16 under OFF, results-7t.txt - can be located by year; it decides nothing here). The reducer gates it: an access line, a line for every year for both rules, and year 1's paths equal to the year-1 level lines' paths.
- **Declared choices, not derived:** the thresholds (0.5 and 0.2; 0.5 points for item 4; 0.95 for the premise); dead under 0.02; the pooled years 1 to 7.

## Decision fed

- **Item 1 HELD:** the forward-against-cell disagreement is dead cells' arbitrary ties, not a mispricing: O49 closes as a reading artefact (P's item 7 and 7ae's item 2 re-read on live cells), no grid or reader change rests on it, and the decision log counts live cells from here.
- **Item 2 HELD:** the reader's bridge read carries it: the reader's reference, read at the plan's tiers in every layer (solve.js), is the lever - a design for it (the reader at the bridge family, O35, O36, O63) goes to the maintainer; 30x12x12 does not run.
- **Item 3 HELD:** the pension-share axis carries it: 30x12x12 (O49's conditional, the share axes) is registered next.
- **Items 1, 2 and 3 all FALSIFIED:** no single piece carries it; a two-snap follow-up (the review's pairs) is sized before any build.
- **Item 4 HELD:** the tier state's layers misprice the de-risk on switching boundaries: an interpolation design question to the maintainer (the review's third cause). **FALSIFIED:** the boundary is priced as the interior.
- **Items 1 to 4 INCONCLUSIVE:** the share lies between 0.2 and 0.5 - that piece carries a part: reported with its size beside the others, and the two-snap follow-up includes it; item 4 inconclusive leaves the boundary question open, no design rests on it.
- **In every branch:** no default change; no margin or charge default; no 7u; no seed 7013.

## Provenance

- The design: the deep review after P (deep-review-log.md, 29 Sep 23:31 UK); P's records (results-P.txt, results-P-slices.txt); the plan's 7ak row.
- The build: grid.js g.readerAcc (research hook, unset in every other path), research/solver/snap.mjs, audit-7ak.mjs, reduce-7ak.mjs (planted 16; mutations 13 of 13 caught, results-reduce-7ak-mutations.txt), preflight-7ak.sh, preflight-parse-7ak.mjs, batch-7ak.sh, derive-7ak.mjs; research/tests/snap-7ak.test.mjs (8 passed, results-snap-7ak.txt).
- The records: P's runs (results/diagP), read through their stamps and held by the gate.

## Derivation script

- `derive: research/solver/derive-7ak.mjs > research/solver/results-derive-7ak.txt sha256 156dea27844748f6`
  (P's decision log and node lines; the disagreement counts, the shares' standard errors, item 4's resolution).

## Point and interval

80% intervals, the author's:
- Item 1: 8% of disagreements at dead cells (2% to 25%).
- Item 2: the reader snap turns 55% of the live ones (25% to 85%).
- Item 3: the a snap 15% (3% to 40%).
- Item 4: the boundary's excess mispricing +0.3 points (-0.5 to +1.2).
- The all-snap turns 99% or more (the premise).

## Credence

The author's probability that each item reads as predicted: 1 (FALSIFIED), 0.70; 2 (HELD), 0.45; 3 (FALSIFIED), 0.55; 4 (INCONCLUSIVE), 0.45. Item 1: bridge 4's node survival is 98%, so few of its states should sit at dead cells, but P's disagreements cluster at the bridge's end, where a thin accessible pot sits near the cliff. Item 2: the calendar structure points at the bridge read, and the review ranks it first; against it, the a axis also moves the accessible money, and 7x priced S194 (off, no reader) right while the reader households read low. Item 3: the a axis is coarse (6 linear points) where the bridge cliff runs, so it may carry a part. Item 4: untested; the resolution is about 0.5 to 0.8 points.

## Power

- **Items 1 to 3** (results-derive-7ak.txt): about 4,480 disagreements on bridge 4 at 8,000 paths; a share's standard error 0.60 to 0.75 points, the thresholds about 40 standard errors apart - decisive if half or more are live. If most are dead (item 1 HELD), items 2 and 3 read on few and may be INCONCLUSIVE; item 1's branch then decides.
- **Item 4:** resolves about +/- 0.5 points split evenly, +/- 0.8 at one in ten on a boundary (too narrow by up to 1.4 times, the rules sharing paths); an excess under about 1 point will read INCONCLUSIVE.
- **Time:** on last week's host: two solves at P's measured 699 to 814 s (results-P.txt), two runs of 8,000 node paths a unit at about 600 s each (7ae's and 7ad's measured rules), the snaps about 4,480 x 7 chooser calls on bridge 4 (a few minutes): about 45 minutes, about 1.2 core-hours. On this session's machine TS+J solves run about 2.1 times slower (7ah's 1,525 to 2,287 s against 7af's and 7ag's 723 to 1,019 s on the same households; results-7ah-secs.txt, predictions/diag-7ah.md), and the per-year table read adds one scoreMoves a path-year beside the chooser's own (its cost NOT MEASURED at 30 points; perhaps a third more run time): about 1.5 to 2 hours with both units at once, about 3 to 4 core-hours.

## Budget line

The families' root-cause step after P (the deep review after P; section 9 rule 5): which part of the table carries the forward-against-cell disagreement and whether the tier state misprices on switching boundaries; about 3 to 4 core-hours, about 1.5 to 2 hours on two cores on this machine (the Time line), after 7ai.

## Pre-mortem

- **Most likely:** item 2 HELD or INCONCLUSIVE with the a snap taking a part: the reader and the share axis both move the accessible money, and the snaps overlap.
- **Second:** item 1 HELD - the bridge's last years put the forward states near the cliff, where the cells are dead and their ties arbitrary; the disagreement is then a reading artefact.
- **Third:** NOT SETTLED by the premise - the all-snap under 0.95 in the field (the unit test ran at 6 points; at 30 points the cells differ): the attribution is then unsound as designed.
- **Fourth:** NOT SETTLED by the gate - a solve not P's (a code change since P touched TS+J: E3's option is off and the reader hook unset, both held by tests; the gate would catch any drift).
- **The smoke run:** smoke.sh (locked) does not run audit-7ak.mjs; the preflight through the launcher (preflight-7ak.sh: both units at 6 points and 60 paths, the reducer's parse and gate read on its output) and the unit tests stand in.

## Changes after seeing results

None.
