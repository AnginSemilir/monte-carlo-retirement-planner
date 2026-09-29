# Prediction: diag-7ai

- **Run:** `research/solver/batch-7ai.sh` - results/diag7ai/case0-41.txt (audit-7ai.mjs, 42 solves, no forward run), read beside 7af's (results/diag7af) and 7ag's (results/diag7ag) records; reduced by `reduce-7ai.mjs` in the real tree into results-7ai.txt
- **Kind:** test
- **Written:** 29 Sept, before the run (its time is its registering commit's, git log); after O60's size was computed (look-o60.mjs, results-o60.txt), the deep review of 29 Sep 21:08 named this check its single most decisive, and the deep review after P (29 Sep 23:31) asked for four changes before it registered - all made here
- **Seeds:** 7002 tuning (path 0 only: the run reaches the year-0 state, which does not depend on the path, and reads the opening there, as 7af's gap line does). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched. **Disclosed (RULES.md Known limits item 18):** before this prediction was final the audit script ran under "none": a build check (runs.log 29 Sep 23:08, share 0.50's CAND and SHIP linear units at 4 wealth points; its lines read for format), the first preflight (runs.log 23:13, the first design's 28 units at 4 points, parsed and gated; no figure read) and the second on the redesign (runs.log 29 Sep 23:53, all 42 units at 4 points; no figure read; a launch of it a few minutes before, from a snapshot carrying the redesign uncommitted, was stopped by its task ID before its smoke run finished and wrote no runs.log line and no unit)
- **Unmasking:** the blend removes a known input error - O60: the import blends each tier's return linearly, so the model overcharges the pension's de-risk (High to Medium) by 0.31 of its 1.10 points a year and understates every tier by 0.17 to 0.49 points a year (results-o60.txt). What that error may drive in the baseline: the knife-edge year-0 openings (O44), 7 of the 14 pairs here within a 10% move of the product's margin (results-derive-7ai.txt). No harm is read, so nothing can be charged to the blend; the arm that tells an answer to the tier convention from knife-edge jitter is arm C, the same shift reversed (item 1): the items ask whether the gap answers the change's sign and which way the blend moves it; whether a moved opening is better needs a forward test of its own
- **Plan section:** PLAN.md "7ai"

## Question

On the seven households whose bundle openings sit nearest the switch margin (S126, S194, S162, bridge 0, bridge 1, share 0.50, share 0.90), for the bundle (READER/TS+J) and the shipping default (OFF/PRODUCT) at the product's settings: does the year-0 gap - the de-risk's advantage at year 0 - answer the tier returns systematically (moving one way when each tier's return is the median of its blend, results-o60.txt, and the other way when the same shift is reversed), and which way does the blend move it? And, reported: which openings, the pension's and the ISA's tier, move?

## Derivation

- **The premise:** the engine and the solver grow a pot by exp(ln(1 + R) + V z) - R is the median (engine.mjs, the market branch: "Log-return with median equal to the stated expected (geometric) real return"; the plan's 7m row) - and the source's figures read as medians (7m). So the import's linear blend of two medians is not the blend's median; results-o60.txt gives the medians of the blends rebalanced yearly.
- **The records** (derive-7ai.mjs, results-derive-7ai.txt; 7af's and 7ag's gap lines): the bundle's gaps are 9.1220e-4 to 1.0735e-3, every one within a 10% move of the margin - share 0.50 and share 0.90 keep the plan's tiers and flip on a rise of 6.4% and 9.6%; bridge 0, bridge 1, S126, S194 and S162 de-risk and flip on a fall of 2.6%, 3.2%, 5.7%, 5.0% and 6.8%. The shipping default's gaps sit far from it but for S194 (+32.3%) and S162 (+106.1%). 7 of 14 pairs flip on a gap move of 10% or less; the median move needed is 20.9%.
- **The input change** (results-o60.txt, results-derive-7ai.txt): the de-risk (High to Medium) costs 1.10 points a year with the linear tiers, 0.79 with the blend medians (28% less) and 1.41 with the reversed shift; every tier's return rises 0.17 to 0.49 points a year with the blend and falls as much reversed. The step's cost moves the gap one way (a cheaper de-risk raises it), the level the other (higher returns lower what a de-risk protects); by arithmetic the step effect is first order in the gap, the level effect second order through survival - so the gap should rise with the blend and fall reversed, unless the level effect, large where survival is low, dominates.
- **Why the reference arm:** openings chosen for knife edges move under almost any perturbation (7ad moved these gaps -26% to +28% with the grid alone), so "an opening moves" cannot fail here (the deep review after P). The reversed shift, the same size the other way, can: a gap that answers the tier returns moves opposite ways under the two; one that only jitters with any perturbation does not.
- **Scope:** seven households chosen for their knife edges cannot say how often openings move across the panel; 7u's panel reads each gap (O44).
- **Claude's choices, before any run:** the seven households and the two arms (the plan's 7ai row); the blend medians as results-o60.txt prints them, at the import's rounding (0.01), and the reversed tiers at 2 x linear - blend (O60's columns); every other tier field, and the cash tier, untouched; solves only.

## Prediction

Item 1 HELD: the gaps answer the tier returns' sign - opposite moves under the blend and the reversed shift on 80% or more of the untied pairs. Item 2 HELD: the blend raises the gap (favours the de-risk) on 70% or more of the untied pairs. Reported: the blend moves some bundle openings from the plan's tiers to the de-risked pair (share 0.50 and share 0.90 the nearest), and the reversed shift moves some the other way.

## Falsified if

Item 1: the blend and the reversed shift move the gap the same way on 40% or more of the untied pairs (7 or more untied). Item 2: the blend lowers the gap on 70% or more of the untied pairs (7 or more untied).

## Fair-test table

Arm A is each unit with the import's linear tier returns (the engine's default); arm B the same unit with each tier's return the median of its blend (results-o60.txt); arm C, the reference, the same unit with the shift reversed (2 x linear - blend); all three solved on this code, CAND (READER/TS+J/W0.02) and SHIP (OFF/PRODUCT/W0.02) on each household.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | none: no forward run | none | N/A - the opening is read at the year-0 state, reached on path 0 of seed 7002, which it does not depend on |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the five blended tiers' returns as the import makes them (linear) | B: the medians of their blends; C (the reference): 2 x linear - blend, the same shift reversed; volatility, sigmaParam, charges and the cash tier the same in all three | TESTED - checked before any solve against results-o60.txt and after each solve against its tier menu, printed on a tiers line and gated |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code | this code | SAME - both arms on this code; each arm-A solve is also held to 7af's or 7ag's own unit (table, ran line but the path count, gap, opening, joint line), read for identity only: a code change since that touched them refuses the read |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | the year-0 gap (audit-s126.mjs openGap, copied) and the opening - the pension's and the ISA's tier at 0.001 and at 0 (an opening2 line) | the same | SAME - declared: the items read the solve's own gap, no survival; the openings and the table's survival reading are reported |
| 31 | Paired or not, and the standard error used | none: no sampling | none | N/A - a year-0 opening is a deterministic function of the tables; read exactly |
| 32 | The table's number is never the result: survival is simulated | no survival read | no survival read | N/A - the items are the tables' decisions, not an outcome claim; any worth of a moved opening needs a forward test |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **The gap and a change:** the gap is the switch margin the held tiers need to stay at year 0 (the de-risk's advantage), ordered '0' < a number < '>1'; a change against linear is up, down or tied (equal, '0' to '0' and '>1' to '>1' included). Read exactly: no sampling enters a year-0 gap.
- **Item 1 (single look):** on each of the 14 pairs (household, arm), the blend's change and the reversed arm's change; "opposite" when one is up and the other down, "same" when both up or both down; a pair with either tied is left out; U = opposite + same. HELD when U >= 7 and opposite >= 0.8 U; FALSIFIED when U >= 7 and same >= 0.4 U; else INCONCLUSIVE.
- **Item 2:** of the pairs whose blend change is not tied (B of them): HELD (the blend favours the de-risk) when B >= 7 and up >= 0.7 B; FALSIFIED (it favours holding) when B >= 7 and down >= 0.7 B; else INCONCLUSIVE.
- **Reported, not items:** every pair's gaps and openings (the pension's and the ISA's tier at 0.001 and at 0) with each tier set; the openings at 0.001 the blend moves and the reversed shift moves; the gap's relative change; the table's survival reading.
- **NOT SETTLED:** any gate fails (the stamps of 7ai, 7af and 7ag; a unit missing, twice or unregistered; a missing opening2 line; a setting not the registered one; a linear solve not 7af's or 7ag's own; a shifted solve differing from its linear pair beyond the tier returns; a tiers line not the registered figures, or a tier moved under 0.1 point the registered way).
- **Declared choices, not derived:** the thresholds (0.8 and 0.4 for item 1, 0.7 for item 2, 7 untied pairs at least); the seven households and two arms; the shifts at the import's rounding; the plan row's rule, a declared rule and not an item: if the blend moves any opening at 0.001, O60's decision (the tier returns) goes to the maintainer before 7u registers.

## Decision fed

- **The plan row's rule (whatever the items read):** if the blend moves any opening at 0.001, the tier returns (the import's linear figures or the blend medians, O60 - the product's decision, grade A as a computation) go to the maintainer before 7u registers, the moved openings named; the bundle's recommendation (7af, 7ag; grade B) carries the qualifier that its openings there rest on the linear tiers. If none moves, O60 stays open as a question of survival levels and stops gating 7u's openings. In both branches O60 still gates any default decided after P (the plan's 7ai row and O60): nothing here closes that gate.
- **Item 1 HELD:** the openings answer the tier convention, not only knife-edge jitter - O60's choice is a real input to the bundle's openings (grade A for these seven, exact solves). **FALSIFIED:** the gaps move with any perturbation regardless of sign - the openings' sensitivity is the knife edge's (O44), and O60's direction carries no information about them; O44's design (after 7ak) is the lever, not the tier convention. **INCONCLUSIVE:** reported beside the plan row's rule; no test rests on it.
- **Item 2 HELD / FALSIFIED / INCONCLUSIVE:** the direction in which the linear tiers bias the year-0 choice (toward holding the plan's tiers, toward de-risking, or neither), reported to the maintainer with O60.
- **In every branch:** no default change; the engine's tiers stay the import's; no 7u; no seed 7013.

## Provenance

- The design: O60 (PLAN.md register; look-o60.mjs, results-o60.txt); the deep review of 29 Sep 21:08; the deep review after P (29 Sep 23:31: the reference arm, both tiers, ties, premise and scope); the plan's 7ai row.
- The build: audit-7ai.mjs (0b96bbe, 30f3053; the reversed arm and the opening2 line in 8538ce6); reduce-7ai.mjs, preflight-7ai.sh and preflight-parse-7ai.mjs (e452cc5, 21c4751; redesigned in 8538ce6 - planted 29, mutations 24 of 24 caught, results-reduce-7ai-mutations.txt); derive-7ai.mjs; batch-7ai.sh.
- The records: results-7af.txt, results-7ag.txt and their runs (read only through their stamps; each linear solve held to its unit).

## Derivation script

- `derive: research/solver/derive-7ai.mjs > research/solver/results-derive-7ai.txt sha256 6752d23efb678076`
  (7af's and 7ag's gap lines read by reduce-7aa.mjs parse; the gap move that flips each 0.001 opening; O60's overcharge from results-o60.txt; the reversed tiers and their de-risk step).

## Point and interval

80% intervals, the author's:
- Item 1: opposite on 11 of 13 untied pairs (8 to 13 of 10 to 14).
- Item 2: up on 10 of 13 untied (6 to 13).
- Reported: the blend moves 2 bundle openings at 0.001 (0 to 5), the reversed shift 3 (0 to 5); the shipping default's openings move under neither (0 to 1); the tables' survival readings rise with the blend by 0.05 to 1 point.

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.65; 2 (HELD), 0.50. Item 1: the tier returns enter the tables smoothly, so a sign-reversed shift of the same size should move a smooth gap the other way; against it, the gaps sit on a coarse grid (7ad) where a shift of either sign can cross a cell and move a gap the same way. Item 2: the step effect is first order in the arithmetic, but the level effect is not measured and is largest where survival is low; about even.

## Power

- **Not statistical:** no sampling enters a year-0 gap; each item is read exactly from the solves' own numbers.
- **Ties:** a pair ties when a gap reads '0' or '>1' under both arms or is unchanged; the shipping default's gaps on share 0.50, share 0.90, bridge 0 and bridge 1 (1.3351e-4 to 3.4884e-4) and S126 (9.9930e-3) are numbers, not '0' or '>1', so ties need an unchanged gap; the 7-pair floor leaves room for seven ties.
- **What the records give:** 7 of 14 pairs flip their 0.001 opening on a gap move of 10% or less, the median move needed 20.9% (results-derive-7ai.txt).
- **Time:** 42 solves at 30 points; the bundle's solves on these seven households took 652 to 777 s and the shipping default's 230 to 280 s under four-way load (7af's and 7ag's solve lines; the plan's 7ai row); at the slowest measured solves 3 x (4,951 + 1,751) = 20,106 core-seconds, about 5.6 core-hours, about 1.4 to 1.6 hours on four cores, the bundle's 21 solves first.

## Budget line

O60's openings check, the deep review's most decisive check (29 Sep 21:08), made able to fail by the deep review after P: whether 7u's openings answer how the tiers' returns are blended; about 5.6 core-hours, about 1.4 to 1.6 hours on four cores, after 7ah.

## Pre-mortem

- **Most likely:** item 1 HELD on the bundle's pairs with a few ties on the shipping default's; item 2 HELD or INCONCLUSIVE; the blend moves one to three bundle openings.
- **Second:** item 1 FALSIFIED - the grid's coarseness (the share axes, O49) moves gaps the same way under both shifts: the openings' sensitivity is the grid's, O44's and 7ak's to design, not O60's.
- **Third:** NOT SETTLED - a linear solve is not 7af's or 7ag's own (a code change since touched the bundle or the product's solve: P's switchCharge and the order reference are options unset here, grade B by the diff; 7ah's preflight held READER/TS+J to 7af's and 7ag's at the preflight's size).
- **Fourth:** the risk-above decision differs between the tier sets: every household here holds High Risk with no tier above ("off: no tier above the plan"), so it cannot - the gate refuses if it does.
- **The smoke run:** smoke.sh (locked) does not run audit-7ai.mjs; the build check and the preflights through the launcher stand in, and the launcher's smoke run covers the solver code every solve here calls.

## Changes after seeing results

None.
