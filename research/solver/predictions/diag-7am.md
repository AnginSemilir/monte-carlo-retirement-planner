# Prediction: diag-7am

- **Run:** `research/solver/batch-7am.sh` - results/diag7am/case0-28.txt (audit-7am.mjs, 29 solves, no forward run), read beside P's records (results/diagP, the open job) and 7ai's (results/diag7ai); reduced by `reduce-7am.mjs` in the real tree into results-7am.txt
- **Kind:** test
- **Written:** 30 Sept, before the run (its time is its registering commit's, git log); after 7ai's read (30 Sep 17:52 UK), the deep review after 7ai (30 Sep 18:03 UK), which designed it as its decisive test, the plan-auditor's MINOR 4 of 30 Sep (a second step size) and 7ak's read (30 Sep 19:35 UK)
- **Seeds:** 7002 tuning (path 0 only: the run reaches the year-0 state, which does not depend on the path, and reads the opening there, as 7ai's gap line does). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** none: the tier shift is 7ai's symmetric perturbation, used here as a probe of how the year-0 gap responds, not as a fix; nothing tested removes a known error. The comparison that bears on unmasking is item 1's: if P (the margin replaced by a charge valued in both passes) answers the sign where the bundle did not, the bundle's jitter is attributed to the stored margin, not to the reader or the grid, which the arms share
- **Plan section:** PLAN.md "7am"

## Question

Is the bundle's year-0 opening jitter (O67: its gap's response to 7ai's symmetric tier shift is 7 to 34% sign-blind on all seven households, more than every knife edge's distance to the margin) the tier state's stored margin (solve.js l.375-389), or the reader's reassembly or the grid, which P shares with the bundle? And is the bundle's sign-blind response non-smooth (a kink or jump) or smooth and strongly curved?

## Derivation

- **The rule on its own records** (derive-7am.mjs, results-derive-7am.txt): item 1's rule applied to 7ai's recorded arms calls the shipping default smooth and answering the sign (opposite on 6 of 7, the ratio under 0.3 on 6) and the bundle jittery (opposite on 3, the ratio 0.55 or more on 6) - so the thresholds separate the two behaviours 7ai saw; the bundle's least ratio, 0.55, is item 1's jittery bound.
- **P's linear gaps** (results/diagP, the open job; results-derive-7am.txt): 5.7824e-5 to 7.4500e-4, 5.8% to 74.5% of the charge; every household opens the de-risked tier (2) at margin 0; share 0.50 is the knife edge (the smallest gap, 5.8% of the charge), so a shift that moves a gap by 7ai's sizes (about 1e-4 to 3e-4) may take share 0.50's gap through 0 and change its opening, and item 2 leaves it out.
- **The mechanism:** under TS+J with the margin, the stored decisions carry the margin's later holds into every layer's value (solve.js l.375-389), so the gap takes the margin's scale and responds to anything that moves a later hold across it - a threshold response, blind to the sign of the input. Under P the margin is 0 and the charge is valued in both passes, so no later hold is stored against a threshold the chooser does not also price; a smooth input should then move the gap smoothly.
- **Item 3's reference points:** a response smooth to second order has a sign-blind part that scales with the step's square (q = 0.25 at half the step), a kink with the step (0.5), a jump not at all (1).
- **Claude's choices, before any run:** the seven households, 7ai's (the knife edges); P at the full shift each way (7ai's sets) and the bundle at half the shift each way (the auditor's second step size) - not P at half, nor the bundle at the full shift again (7ai's records are reused); the anchor on share 0.50 only (the knife edge, the most sensitive to a code change).

## Prediction

Item 1 HELD: P's gap answers the sign - the two shifts move it opposite ways on 6 or more of 7, and the ratio |blind|/|following| is under 0.3 on 5 or more. Item 2 HELD: no P opening at margin 0 moves under either shift but share 0.50's. Item 3 HELD: the bundle's sign-blind response is non-smooth - q, its size at half the step over its size at the full step, is 0.4 or more on 5 or more of 7.

## Falsified if

Item 1: the ratio is 0.55 or more on 5 or more of 7 (P as jittery as the bundle). Item 2: P's opening moves on 2 or more of the six households other than share 0.50. Item 3: q is 0.33 or less on 5 or more of 7 (smooth and curved).

## Fair-test table

Arm A is each unit with the import's linear tier returns - P's own open-job solve (results/diagP; its anchor on share 0.50 re-solved here and held to it) and 7ai's linear bundle unit (results/diag7ai); arm B the same unit with the tier returns shifted: P at 7ai's blend medians and at the same shift reversed, the bundle at half that shift each way. Nothing else differs, which the gate checks line by line.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | none: no forward run | none | N/A - the opening is read at the year-0 state, reached on path 0 of seed 7002, which it does not depend on |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the five blended tiers' returns as the import makes them (linear) | P: the medians of their blends and 2 x linear - blend (7ai's sets); the bundle: linear +- (blend - linear)/2; volatility, sigmaParam, charges and the cash tier untouched | TESTED - the tier returns alone; the gate holds every other line to arm A's |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | P's records (code 9637ede3a598); 7ai's linear bundle units | this run (the code as it stands) | ACCEPTED - P's linear solves are reused: the anchor re-solves share 0.50 on this code and the gate holds it to P's record (table, ran line, gap, opening, joint line), the knife edge being the unit most sensitive to a changed solve; 7ai's linear units were held to 7af's and 7ag's records by 7ai's gate; each shifted unit's ran and joint lines are held to its arm A's |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The gap:** the switch margin the held tiers need to stay at year 0, as audit-7am.mjs prints it; '0' and '>1' are not numbers. For a household with three numeric gaps L (linear), B (shifted up), R (shifted down): following F = (B - R)/2, blind C = (B + R)/2 - L, ratio |C|/|F| (look-7ai-split.mjs's split). Read exactly: no sampling enters a year-0 gap.
- **Item 1 (single look):** opposite = the two shifts move P's gap opposite ways against L, neither tied. HELD when opposite on 6 or more of 7 and the ratio under 0.3 on 5 or more; FALSIFIED when the ratio is 0.55 or more on 5 or more; else INCONCLUSIVE. A household with a gap '0' or '>1' is not split and counts toward neither bound.
- **Item 2:** P's opening is the pension tier at its own margin 0 (the gap line's second figure); of the six households other than share 0.50, the number on which either shift changes it. HELD at 0; FALSIFIED at 2 or more; INCONCLUSIVE at 1.
- **Item 3:** q = |C at half| / |C at full| for the bundle (the full shift 7ai's). HELD (non-smooth) when q >= 0.4 on 5 or more of 7; FALSIFIED (smooth and curved) when q <= 0.33 on 5 or more; else INCONCLUSIVE. A household not split at either step counts toward neither.
- **Reported, not items:** every household's gaps, openings and split for P and for the bundle at both steps; P's tables.
- **NOT SETTLED:** any gate fails (the stamps of 7am, P and 7ai; a unit missing, twice or unregistered; a missing opening2 or tiers line; a setting not the registered one; the anchor not P's own solve; a shifted unit's ran or joint line not its arm A's; a tiers line not its set's figures, or a tier moved under 0.1 point, 0.045 at the half step, the registered way).
- **Declared choices, not derived:** the thresholds (6 of 7 opposite; 0.3 and 0.55 for the ratio; 5 of 7; 0 and 2 openings; q 0.4 and 0.33); the seven households; the half step on the bundle only; share 0.50 as P's knife edge.

## Decision fed

- **Item 1 HELD:** the bundle's jitter is the stored margin's (grade B for these seven, exact solves): O67 resolves with that cause; the switch charge valued in both passes (P) is the design that removes it, and no opening rule is written from the bundle's flips; P's openings are the reference for O44's opening design. **FALSIFIED:** P is as jittery as the bundle, so the jitter is the reader's reassembly or the grid's, which both share: an OFF/TS+J arm on the same shift (the review's split) is registered next, beside 7an (the share axes, O49). **INCONCLUSIVE:** O67 stays open with both readings; no opening rule rests on either arm's flips.
- **Item 2 HELD / FALSIFIED / INCONCLUSIVE:** whether P's openings are stable to the tier convention off its knife edge - reported to the maintainer with O60 (the blend medians are decided before 7u, the 18:50 answers).
- **Item 3 HELD:** the bundle's response is non-smooth (a threshold), consistent with a stored margin; **FALSIFIED:** smooth and curved - the review's "jitter" is curvature, and O67's premise (a sign-blind part larger than the knife edges' distance means noise) is withdrawn for a curvature reading; **INCONCLUSIVE:** O67's two readings both stand.
- **In every branch:** no default change; no margin or charge default; no 7u; no seed 7013.

## Provenance

- The design: O67 (PLAN.md register); the deep review after 7ai (30 Sep 18:03 UK, its decisive test); the plan-auditor's MINOR 4 of 30 Sep (a second step size); the plan's 7am row.
- The build: audit-7am.mjs (99cc406); reduce-7am.mjs (planted 38, OUTCOMES REACHED on all three items; mutations 28 of 28 caught, results-reduce-7am-mutations.txt - the first run caught 21, results-mutation-history.txt, and seven isolating plants were added); preflight-7am.sh, preflight-parse-7am.mjs (three planted faults); derive-7am.mjs; batch-7am.sh.
- The records: results-7ai.txt and its runs (results/diag7ai), P's (results/diagP), each read only through its stamps.

## Derivation script

- `derive: research/solver/derive-7am.mjs > research/solver/results-derive-7am.txt sha256 f7f72ac191731cef`
  (item 1's rule on 7ai's records; P's linear gaps and openings; item 3's reference points; the time from the measured solves).

## Point and interval

80% intervals, the author's:
- Item 1: opposite on 6 of 7 (4 to 7); the ratio under 0.3 on 4 (2 to 7), 0.55 or more on 2 (0 to 5).
- Item 2: P's opening moves on 0 of the six (0 to 2).
- Item 3: q 0.4 or more on 5 of 7 (3 to 7).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.40; 2 (HELD), 0.55; 3 (HELD), 0.55. Item 1: the review ranked the stored margin first, and the shipping default (no tier state, no reader) answered the sign; against it, 7ak found the pension-share axis carries P's own disagreement on bridge 4, and the grid is shared by P and the bundle, so P may jitter too. Item 2: P's gaps sit 15% to 75% of the charge off 0 on the six, and 7ai's shifts moved gaps by about 1e-4 to 3e-4, so share 0.90 (1.4698e-4) could cross. Item 3: a stored threshold makes kinks, but at half the step a kink may not be crossed at all, which reads as a small q.

## Power

- **Not statistical:** no sampling enters a year-0 gap; each item is read exactly from the solves' own numbers.
- **Ties and gaps that are not numbers:** P's seven linear gaps are all numbers (5.7824e-5 to 7.4500e-4, results-derive-7am.txt); a shift that takes one to '0' leaves that household unsplit, and item 1's 5-of-7 bounds leave room for two.
- **What the records give:** item 1's rule reads the shipping default HELD and the bundle FALSIFIED on 7ai's own records (results-derive-7am.txt), so it can tell the two behaviours apart.
- **Time:** 29 solves at 30 points: P's measured open-job solves 770 to 1594 s and 7ai's bundle blend and reversed solves 1422 to 2144 s; at those times about 11.9 core-hours, about 3 hours on four cores (results-derive-7am.txt).

## Budget line

The deep review's decisive test for O67 after 7ai: whether the bundle's opening jitter is the stored margin (P answers the sign) or shared with P (the reader or the grid); about 12 core-hours, about 3 hours on four cores, after 7al.

## Pre-mortem

- **Most likely:** item 1 INCONCLUSIVE - P smoother than the bundle but not under 0.3 on five (the grid's share axes, 7ak's finding, add their own jitter); item 2 HELD; item 3 HELD.
- **Second:** item 1 FALSIFIED - the grid carries the jitter in both, and 7an (30x12x12) is then the lever for both O49 and O67.
- **Third:** NOT SETTLED - the anchor is not P's own solve (a code change since P touched the charged solve; the code id moved from 9637ede3a598 to 05be10bd7b34): P's six other linear solves would then be re-run, 7 solves more.
- **Fourth:** a shift takes a P gap to '0' on two or more households, leaving item 1 short of its counts.
- **The smoke run:** smoke.sh (locked) does not run audit-7am.mjs; the preflight through the launcher (preflight-7am.sh: all 29 units at 4 points, read by preflight-parse-7am.mjs through the reducer's own parse, gate and reading, with three planted faults) stands in, and the launcher's smoke run covers the solver code every solve here calls.

## Changes after seeing results

None.
