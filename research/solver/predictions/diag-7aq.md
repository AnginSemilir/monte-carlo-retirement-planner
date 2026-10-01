# Prediction: diag-7aq

- **Run:** `research/solver/batch-7aq.sh` - results/diag7aq/case0-19.txt (audit-7aq.mjs, 20 solves, no forward run), read beside 7am's records (results/diag7am), P's (results/diagP, the open job) and 7ai's (results/diag7ai); reduced by `reduce-7aq.mjs` in the real tree into results-7aq.txt
- **Kind:** test
- **Written:** 1 Oct, before the run (its time is its registering commit's, git log); designed by the deep review after 7am (deep-review-log.md, 1 Oct 02:00 UK) as its decisive next step for O67; on 7am's linear tier convention before O60's switch (the maintainer, 1 Oct 06:45 UK); the signed gap per O74, the families per O73, bridge 0's bound per O75; amended before launch after the plan-auditor's BLOCKING 1 of 1 Oct 07:22 UK (item 1's lower band: a snap beyond the half step no longer reads as smooth)
- **Seeds:** 7002 tuning (path 0 only: the run reaches the year-0 state, which does not depend on the path, and reads the opening there, as 7am's gap line does). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** none: the tier shift is 7ai's symmetric perturbation used as a probe, and the signed gap is a reading, not a fix (it prints what the clipped gap hid; the bisected gap it extends is held equal to it on every unit). Nothing tested removes a known error.
- **Plan section:** PLAN.md "7aq"

## Question

Is P's year-0 gap (the switch charged in both passes, no stored margin) smooth in the tier returns, where the bundle's (the margin stored as holds) is not - so that the bundle's opening jitter (O67) is the stored margin, its ranked cause (A)? Or is P non-smooth too, which points to what P and the bundle share: grid snaps (B) or the reader's reassembly (C)?

## Derivation

- **The mechanism** (grade A, the code): under the bundle the stored decisions keep the held tiers wherever a stay is within the margin (solve.js l.925 and l.940, `bestScore - stayScore <= switchMargin`), so a stored value can jump where a later hold starts or stops - a threshold the tables do not price. P has margin 0 and charges a switch in both passes, so no stored hold sits against an unpriced threshold; if the margin is the cause, P's gap moves smoothly with the tier returns.
- **The reading:** for a household's signed gaps L (linear), B (shifted up), R (shifted down): following F = (B - R)/2, blind C = (B + R)/2 - L. C is even in the step and F odd, so a response smooth to second order has q = |C at half| / |C at full| about 0.25 and r = F at half / F at full about 0.5; a kink or jump within the half step gives q about 0.5 or 1 (7am's item 3); a snap between the half and the full step leaves C at half near 0 - q near 0 - and moves r off 0.5 (the bundle's share 0.50 in 7am: q 0.04, results-7am.txt; the plan-auditor's BLOCKING 1 of 1 Oct 07:22 UK).
- **What the records give** (derive-7aq.mjs, results-derive-7aq.txt): P's full-step C where 7am split it - bridge 1 -4.2340e-5, S126 1.6640e-5, S194 -2.0280e-5, S162 -2.8830e-5; on the three a clipped gap left unsplit, bounds only (share 0.50: C at most 6.6021e-5; share 0.90: at most 9.8090e-5; bridge 0: at most -1.1588e-4, so |C| at least 1.1588e-4 - O75's bound). Item 1's threshold in each household's units (q 0.33): |C at half| at most 1.3972e-5, 5.4912e-6, 6.6924e-6 and 9.5139e-6 on those four. The bundle's half-step C (7am's halves): share 0.50 -3.7150e-6, share 0.90 6.0035e-4, bridge 0 9.2900e-5, bridge 1 -3.1348e-4, S126 6.4550e-4, S194 -1.2913e-4, S162 6.3050e-5.
- **Items 1 and 2 together:** were P smooth to second order on the four split households, its half-step C would be 0.01 to 0.11 of the bundle's (results-derive-7aq.txt), so item 2 follows item 1 there; share 0.50's bundle half-step C (3.7150e-6) is so small that share 0.50 can read 'under' only if P's is under 1.2383e-6 - the S126 family's majority carries it.
- **Claude's choices, before any run:** the families (O73: share 0.50, share 0.90, bridge 0 and bridge 1 are S126 re-weighted or re-aged, so the five count as one); a family's read by its members' majority; item 2 at the half step (all new data: 7am split four households at the full step, which this prediction has seen); a third and two thirds as item 2's bounds; P's full-step units re-solved only where 7am's gap was clipped (the other four are 7am's records, whose gaps are positive and so are their own signed gaps).

## Prediction

Item 1 HELD: P's year-0 gap is smooth - q from 0.15 to 0.33, and r from 0.35 to 0.65 where it is read, in each of the three families (a majority of the S126 family's five; S194; S162). Item 2 HELD: P's sign-blind part at half the step is a third of the bundle's or less in each family.

## Falsified if

Item 1: two or more families read non-smooth - q 0.4 or more, q under 0.15, or r, where read, outside 0.25 to 0.75. Item 2: P's sign-blind part at half the step is two thirds of the bundle's or more in two or more families.

## Fair-test table

Arm A is P's linear solve of each household (P's records, results/diagP), with the bundle's gaps (7ai's linear and full-step, 7am's halves) as the comparison; arm B the same P solve with the tier returns shifted - half 7ai's shift each way on the seven (this run), and the full shift each way (7am's records on four households; re-solved here on the three a clipped gap left unsplit, each held to 7am's record of the same unit). Nothing but the tier returns differs between arms, which the gate checks line by line.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | none: no forward run | none | N/A - the opening is read at the year-0 state, reached on path 0 of seed 7002, which it does not depend on |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the five blended tiers' returns as the import makes them (linear) | the halves linear +- (blend - linear)/2 (7am's sets, unrounded); the full shift's blend medians and 2 x linear - blend (7ai's sets); volatility, sigmaParam, charges and the cash tier untouched | TESTED - the tier returns alone; the gate holds every other line to arm A's |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | P's records (code 9637ede3a598); 7ai's and 7am's records | this run (the code as it stands) | ACCEPTED - P's linear solves and 7am's four split full-step pairs are reused; the six full-step units re-solved here are held to 7am's records of the same units (table, ran line, bisected gap, opening, joint line), which 7am held to P's record through its anchor; the signed gap is new reading code (signed-gap.mjs), not solver code, held equal to the bisected gap on every unit |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The signed gap:** the best score among the moves that leave the held tiers less the best among those that keep them, as chooseAction compares them at margin 0 (the mixture's weighted score, the charge paid on a move that leaves); positive, it is the bisected gap; 0 or below, the held pair wins by that much. Read exactly: no sampling enters a year-0 gap. L is P's record's gap; B and R at the full step are 7am's records' gaps on bridge 1, S126, S194 and S162 (positive, so their own signed gaps) and this run's signed gaps on share 0.50, share 0.90 and bridge 0; the halves are this run's signed gaps.
- **Item 1 (single look):** q = |C at half| / |C at full| for P; r = F at half / F at full, read only where |F at full| is at least |C at full|. A household reads smooth at q from 0.15 to 0.33 with r, where read, from 0.35 to 0.65; non-smooth at q 0.4 or more (a kink or jump within the half step), at q under 0.15 (a feature beyond the half step, or fourth-order curvature as large as the second: not separated), or at r, where read, outside 0.25 to 0.75; else neither. A family reads a way when a majority of its members do (3 of the S126 family's 5; S194 and S162 alone). HELD when all three families read smooth; FALSIFIED when two or more read non-smooth; else INCONCLUSIVE. A household with C at full exactly 0 has no q and counts neither way.
- **Item 2 (single look):** v = |C_P at half| / |C_bundle at half| (7ai's linear bundle gap, 7am's halves). Under at v of a third or less; not under at two thirds or more. HELD when all three families read under; FALSIFIED when two or more read not under; else INCONCLUSIVE.
- **Reported, not items:** every household's signed gaps and splits for P at both steps; the bundle's C at both steps and its q (7am's item 3) beside P's; F at half over F at full (a smooth response gives 0.5); the households with q above 1 (a jump: grid snaps, O67's (B), predict jumps); P's q grouped by whether the year-0 choice reads a reader year (O67's (C): none in bridge 0 and bridge 1, both in the S126 family); bridge 0's full-step |C| against O75's bound (1.159e-4; 0.68 of the bundle's 1.714e-4) and P's |C| over the bundle's at the full step on every household.
- **NOT SETTLED:** any gate fails (the stamps of 7aq, 7am, P and 7ai; 7am's records failing 7am's own gate; a unit missing, twice, not done or unregistered; a missing opening2, tiers or signed line, or two signed lines; a setting not the registered one; a re-solved full-step unit not 7am's own solve of it; a half unit's ran or joint line not P's record's; a signed gap off its bisected gap; a gap read from the records not a positive number; a tiers line not its set's figures, or a tier moved under 0.045 point the registered way at the half step, 0.1 at the full).
- **Declared choices, not derived:** q 0.33 and 0.4 (7am's); q 0.15 and r's bands 0.35 to 0.65 and 0.25 to 0.75 (around the second-order values 0.25 and 0.5); the third and two thirds; the families and the majority rule; item 2 at the half step.

## Decision fed

- **Item 1 HELD and item 2 HELD:** O67 rises from C toward B for the stored margin as the cause (A) (P smooth in all three families; exact solves, one grid, one seed); 7an's added P arm is dropped (P needs no more share points at 30x5); the margin-against-charge structural fix goes to the maintainer with P's whole record (results-P.txt: harm intervals on items 2 and 3 wholly below 0, O50) - the question the maintainer held for this read (1 Oct 06:45 UK).
- **Item 1 HELD, item 2 not HELD:** P smooth but its sign-blind part not small against the bundle's at the half step: the margin is not the whole of the bundle's jitter; reported with the per-household sizes; the maintainer's question goes with both readings.
- **Item 1 FALSIFIED:** P is non-smooth in two or more families, so a cause P and the bundle share carries the jitter: grid snaps (B) rank first if the non-smooth reads are jumps (q above 1); a q under 0.15 does not separate a snap beyond the half step from strong fourth-order curvature (two step sizes cannot; the plan-auditor's MINOR 1 of 1 Oct 07:27 UK), so it ranks (B) no higher alone; the reader's reassembly (C) if P is non-smooth only where reader years are read; 7an's added P arm goes ahead (P at more share points under the same shift), and the margin-against-charge question goes to the maintainer resting on P's survival record alone, not on its smoothness.
- **Item 1 INCONCLUSIVE:** O67 stays at grade C with the per-family reads; 7an's added P arm goes ahead on the households that read non-smooth; the maintainer's question goes with the readings as they are.
- **O75:** read directly from bridge 0's re-solve in every branch: the bound holds by construction if the reversed gap is 0 or below; its size against the bundle's is reported, and O75 closes with the figure.
- **In every branch:** no default change; no margin or charge default; no 7u; no seed 7013; no opening rule written from 30x5 solves (results-7ad.txt: gaps move -26% to +28% with the grid alone).

## Provenance

- The design: the deep review after 7am (deep-review-log.md, 1 Oct 02:00 UK; PLAN.md the 1 Oct 02:00 row); O67, O73, O74, O75 (PLAN.md register); the maintainer's answer of 1 Oct 06:45 UK (the linear base, before O60's switch); the plan's 7aq row.
- The build: signed-gap.mjs and research/tests/solver-signedgap.test.mjs (P and the bundle on S126 at 8 points, eight years of one path, every tier pair: the signed gap equals the bisected one on every case, both signs occur, and four planted faults - the charge left out, the sign flipped, the held and moved sets swapped, the mixture's weights ignored - are each refused); audit-7aq.mjs; reduce-7aq.mjs (planted 50, OUTCOMES REACHED on both items; mutations 47 of 47 caught, results-reduce-7aq-mutations.txt - the first run caught 34 of 42, results-mutation-history.txt, and five isolating plants and one robust parse check were added, one mutation recorded as equivalent; item 1's lower band and r added after the plan-auditor's BLOCKING 1, with four planted cases and six mutations); preflight-7aq.sh, preflight-parse-7aq.mjs (three planted faults); derive-7aq.mjs; batch-7aq.sh.
- The records: results-7am.txt and its runs (results/diag7am), P's (results/diagP), 7ai's (results/diag7ai), each read only through its stamps; 7am's through its own gate as well.

## Derivation script

- `derive: research/solver/derive-7aq.mjs > research/solver/results-derive-7aq.txt sha256 0fadf6543d24cec1`
  (P's full-step split and the clipped households' bounds; item 1's and item 2's thresholds in each household's units; item 2 under a second-order-smooth P; the time from 7am's measured solves).

## Point and interval

80% intervals, the author's:
- Item 1: households reading smooth 3 of 7 (1 to 6); families reading smooth 1 of 3 (0 to 3).
- Item 2: households reading under 5 of 7 (3 to 6); families reading under 3 of 3 (2 to 3).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.25; 2 (HELD), 0.55. Item 1: the review ranked the stored margin first and P's full-step sign-blind part is small where split (1.7% to 4.2% of the charge), but P shares the grid's gain and allowance snaps, the share points and the quadrature with the bundle, and bridge 0's bound already puts P's full-step sign-blind part there at 0.68 of the bundle's or more (O75) - a snap crossed at the full step but not at the half reads as a small q (non-smooth, beyond the half step), crossed at both as q near 1; the band that reads smooth (0.15 to 0.33) is narrow. Item 2: on the four split households a smooth P is 0.01 to 0.11 of the bundle's at the half step, and even a non-smooth P with q near 1 stays under a third on bridge 1, S126 and S194 (|C at full| 2e-5 to 4e-5 against the bundle's 1.3e-4 to 6.5e-4); S162 (2.883e-5 against 6.305e-5) reads not under only at q 1.46 or more, and share 0.50 (the bundle's half-step C 3.7150e-6) can read not under at any q.

## Power

- **Not statistical:** no sampling enters a year-0 gap; each item is read exactly from the solves' own numbers.
- **Resolution:** the signed gaps print to seven figures; the record gaps (P's linear, 7am's full step) to five, so C from them carries at most about 1e-8 of rounding against item 1's smallest threshold, 5.4912e-6 (S126; results-derive-7aq.txt).
- **Gaps that are not numbers:** none in the items: the signed gap is a number on every unit, and the gate requires every record gap it reads to be positive (results-derive-7aq.txt: P's seven linear gaps and 7am's eight full-step gaps on the four split households are positive).
- **Time** (results-derive-7aq.txt): 7am's measured P solves 844 to 994 s; 20 units 17,621 core-seconds, 4.89 core-hours, 1.23 hours on four cores, measured on the host 7am ran on; whether today's host (results-host.txt, 1 Oct 06:49 UK) is faster is NOT CHECKED.

## Budget line

The deep review after 7am's decisive next step for O67, and the read the margin-against-charge decision waits on: about 5 core-hours, about 1.3 hours on four cores, after 7ap.

## Pre-mortem

- **Most likely:** item 1 INCONCLUSIVE - P smooth on S194 or S162 and mixed in the S126 family, where share 0.50 and bridge 0 sit near a snap (bridge 0's bound); item 2 HELD.
- **Second:** item 1 FALSIFIED - P's small sign-blind part is a grid snap crossed at both steps (q near 1), shared with the bundle: (B) rises, and the margin-against-charge decision rests on survival records alone.
- **Third:** NOT SETTLED - a re-solved full-step unit is not 7am's solve. Unlikely from code: 7am's case files carry the code id bd34d3259ad9 and so does the tree this run launches from (code-id.mjs, 1 Oct); a difference would point to state the code id does not cover (results-o60.txt, read by both audits, or the scenario library).
- **Fourth:** a half unit's bisected gap reads '>1' (the held pair losing by more than the whole margin range) - the cross-check then holds the signed gap above 1, and the split reads it as a number.
- **The smoke run:** smoke.sh (locked) does not run audit-7aq.mjs; the preflight through the launcher (preflight-7aq.sh: all 20 units at 4 points, read by preflight-parse-7aq.mjs through the reducer's own parse, gate and reading, with three planted faults) stands in, and the launcher's smoke run covers the solver code every solve here calls.

## Changes after seeing results

None.
