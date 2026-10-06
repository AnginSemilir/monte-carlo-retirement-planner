# Prediction: diag-forcex

- **Run:** `research/solver/batch-forcex.sh` - results/diagforcex/case0-5.txt and the per-arm files (audit-forcex.mjs, six parts: a household and a set of tables each, one solve each), read by `reduce-forcex.mjs` into results-forcex.txt
- **Kind:** test
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log); the design: the deep review after PAUSE (deep-review-log.md 6 Oct 01:52 UK), FORCE-X, under the maintainer's standing go-ahead of 4 Oct ("I go ahead with your recommendations ... until I say stop"). The judged credences were committed first as drafts/diag-forcex.md (abf0365), the derivation's output after (3e501ac); moved here unchanged but for the derived lines, the sections below and three edits (the Judged line reworded to name each outcome once - its numbers and the scratch figures unchanged - and the Prediction and Mechanism lines; the plan-auditor's MINOR 4 of 6 Oct on 9386fc7), after PAUSE-S128 read HELD (the 04:02 row), whose Decision fed registers FORCE-X as proposed. Declared (RULES.md known limit 31): the move itself restarts git's first commit of this path.
- **Seeds:** 7005 selection: EDGE-SPLIT's and HYB's paths (6,000 a household), so every forced arm is paired path for path with its unforced partner and with PCLSI; no held-out seed is touched.
- **Unmasking:** FORCE-X removes no error from the product. It overrides the chooser in one place - a year where the arm would hold just below its own read's first price point (a move leaving u under the point and growing it by under 0.02, from u within 0.10 below it: the zero draw after the State Pension and the allowance-only draw before it, which grows u by 0.0156 a year; the deep review after PAUSE-S128, FLAG 1) - and lets the chooser run free after. P-LO and HYB run on PCLSI's tables, so their survival gaps to PCLSI are wholly the read's (FLAG 2): if the hold is what costs them (LOSS-HOLD), forcing the draw past the point recovers the gap; if the snapped read's other moves cost it (LOSS-READ: P-LO's rush through (0.5, 0.75), HYB's at access) or the forced draw's own tax outweighs it, the force recovers little; a force that raises survival and lowers the net (LOSS-OPT) says the hold was the score's own optimum. HYB+X is forced at both its read's edges (0.25 and 0.75: audit-forcex.mjs PRICE), so it is HYB with neither hold. SNAP+X is reported only: SNAP's gap carries a tables part (O104's tables-alone -49) and begins about ten years before its hold (FLAG 3). PCLSI+X, which has no edge, is the control. An override of the snapped read is itself a fix on the symptom of a known error (O71's snap, whose fix is ADOPT-PI's consistent pair), so no branch builds on it (Decision fed).
- **Mechanism:** src/solver/fast.js:533 "if (c.forceTF > 0) {" (step 7b' : the forced draw, tested by research/tests/solver-forcex.test.mjs, 12 of 12, and mutate-fast-forcex.py, 10 of 10); audit-forcex.mjs forcePoint (a would-be hold: u in [p - 0.10, p), the move's next u under p, u growing by under 0.02; the move run on a copy first; the force carries u at least 0.01 past p)
- **Plan section:** PLAN.md "FORCE-X", "PAUSE-S128", "O101", "O103", "O104", "O111", "O112", "O114"

## Question

On S130, does forcing the draw past P-LO's and HYB's first price point, at the year each would hold below it (flat or allowance-only), recover their survival gap to PCLSI, whose tables they share (LOSS-HOLD), leave it (LOSS-READ or the force's own cost), or trade survival for net (LOSS-OPT)?

## Derivation

- **The gaps and the power** (results-derive-forcexc.txt sections 1 and 2; EDGE-SPLIT's and HYB's S130 files through their own gates): PCLSI's survival gap over P-LO 137 paths (it saves 148, loses 11), over HYB 192 (202, 10); SNAP's (143) reported. Each deciding arm has its own true rescue share r (the share of the paths PCLSI saves that the force saves too), with a symmetric flip on 0.03 of the other paths (the arms' decided paths against PCLSI are 0.027 to 0.035 of 6,000: the deep review's premise (g); the flip share itself NOT CHECKED); section 2 gives the rule's reading over a grid of (r P-LO, r HYB).
- **The force acts where the arms hold:** PAUSE-S128 (results-pause128.txt) puts the post-allowance pauses at each arm's first price point out of sample; the allowance-only holds before the State Pension sit in the same cells (the deep review after PAUSE-S128, FLAG 1: S130 HYB 17,585 such years, P-LO 5,955; grade C, its scratch reads). The acting share, from the unforced partners' files (FLAG 4: inside the forced run the force removes the holds it targets), is the share of each deciding arm's S130 hold years (pension live, u in [0.15, 0.99), u growing by under 0.02) that lie in a force cell; the run is refused under a half on either deciding arm.
- **The checks, each failed on a planted fault first:** reduce-forcex.mjs's 25 planted checks (every outcome of item 1 reached; EDGES, among them an allowance-only hold growing u by 0.0156), mutate-reduce-forcex.py 29 of 29 (results-reduce-forcex-mutations.txt); the leak plant (FORCEX_PLANT=leak) the identity must refuse, in the preflight.

## Prediction

- **Item 1 HELD (LOSS-HOLD):** on S130 P-LO+X and HYB+X each recover 0.7 or more of their survival gap to PCLSI (the LO test shown after Holm).

## Falsified if

- **Item 1 FALSIFIED (LOSS-READ or the force's own cost):** both recover 0.3 or less (the HI test shown after Holm). INCONCLUSIVE otherwise.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 15 | The tax-free lump sum rule | the arm's chooser | the same chooser, with one draw forced past its read's first price point at a would-be hold (fast.js step 7b') | TESTED - the thing tested |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | audit-edge.mjs and audit-hyb.mjs (EDGE-SPLIT's and HYB's files) | audit-forcex.mjs with fast.js step 7b' | TESTED - the force is the change; otherwise held by the identity to each path's first force, and fast.js unchanged when the force is unset (the c.forceTF > 0 guard, and PAUSE-S128 ran on this code, aefe1e31fe04, with its identity against EDGE-SPLIT's S128 files passing: results-pause128.txt) |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 12 | The paths | EDGE-SPLIT's 6,000 a household (seed 7005) | the same | SAME - held path for path to EDGE-SPLIT's and HYB's files up to each path's first force by the identity |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | paired by path | the same | SAME - sign-flip tests on per-path differences |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1 (primary; single look):** per deciding arm a (P-LO, HYB: PCLSI's tables) on S130, per path D = (a+X) - a and P = PCLSI - a in survival; R = sum D / sum P. LO: mean(D - 0.3 P) above 0; HI: mean(0.7 P - D) above 0; sign-flip tests (B 20,000, fixed seeds), Holm over the four. An arm RECOVERS when LO shows and R >= 0.7, KEEPS when HI shows and R <= 0.3, else PARTIAL; NO GAP when sum P <= 0. HELD when both RECOVER; FALSIFIED when both KEEP; else INCONCLUSIVE.
- **Reported, not items:** SNAP+X's R on every household at raw p (the tables' share); P-LO+X and HYB+X on S128 and S370 at raw p; each forced arm against its partner in survival, tax and net (OPT: survival up and net down on every forced arm but the control); on S130's saved paths (P = 1) the year each arm first leaves PCLSI, its first force year and its other pots' gap to PCLSI at the force; hold years after a path's first force within 0.05 past the price point it crossed (the re-pause read); PCLSI+X's acting share.
- **NOT SETTLED**, if any gate fails: the stamps; a plant line; a unit missing, repeated or not done; a ran line off EDGE-SPLIT's unit, the arm's price points or the registered cell 0.10, carry 0.01 and flat 0.02; the arms of a household on different paths; a force that did not carry u to its price point; the acting share under a half on a deciding arm on S130; the identity before each path's first force against EDGE-SPLIT's or HYB's files.
- **Declared choices, not derived:** the thresholds 0.7 and 0.3 (the deep review's, deep-review-log.md 6 Oct 01:52 UK); the force cell 0.10, the flat bound 0.02 (above the 0.0156 allowance-only step) and the carry 0.01 past the price point (the deep review after PAUSE-S128, 6 Oct 04:34 UK).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | LOSS-HOLD: the hold below the price point costs P-LO and HYB their survival; the fix stays the read's and the tables' (ADOPT-PI's consistent pair, O97), not a chooser-side override | 0.55 |
| item 1 INCONCLUSIVE | the hold explains part; if P-LO+X reads PARTIAL, the next split is P-LO's rush against its hold (the read interpolated on [0.5, 0.70) only) | 0.28 |
| item 1 FALSIFIED | LOSS-READ or the force's own cost: the hold is not what costs survival; the snapped read's other moves are tested next (the rush, HYB at access) | 0.17 |

## Decision fed

- **Item 1 HELD:** LOSS-HOLD supported (O111, O112 read through the hold, flat or allowance-only); the consistent pair (ADOPT-PI, O97) stays the route; no chooser-side fix is designed (an override on the snap would be unmasked when the snap goes: the deep review after PAUSE-S128).
- **Item 1 INCONCLUSIVE:** no fix designed on FORCE-X alone; if P-LO+X is PARTIAL, P-LO's rush is split from its hold next; the next deep review decides on the reported reads.
- **Item 1 FALSIFIED:** the snapped read's other moves (LOSS-READ: P-LO's rush, HYB at access) are tested next; no chooser-side fix.
- **In every branch:** no product change; the force stays a research flag.

## Provenance

- **The design:** the deep review after PAUSE (deep-review-log.md 6 Oct 01:52 UK), FORCE-X; amended before launch by the deep review after PAUSE-S128 (6 Oct 04:34 UK, its DECISIVE TEST items 1-6).
- **The build:** 640d690 (fast.js step 7b', the tests and mutations); the amendment (audit-forcex.mjs's hold and arms, reduce-forcex.mjs's item 1, acting share and reports, 25 planted checks, 29 of 29 mutations) in the commit before this one; derive-forcex.mjs for the two deciding arms after the judged credences.
- **Seen before registration (declared):** PAUSE's and PAUSE-S128's results and the re-read; EDGE-SPLIT's and HYB's results (the gaps); the deep review's scratch reads of their files (FLAGS 1-5); no forced run has been made.

## Derivation script

- `derive: research/solver/derive-forcex.mjs > research/solver/results-derive-forcexc.txt sha256 327b3aeb45ba97e9`
  (the gaps, the power per arm, the credences; run after the amended judged credences were committed in this file, which carries its "Judged, item" lines since 3545702; the first design's output stays as results-derive-forcexb.txt, superseded)

## Point and interval

- **Item 1:** the rescue share r about 0.65 on each deciding arm (0.1 to 1.0; the CREDENCE line's point, the stories' mean r); R under the derived flip share a little lower, the flip costing about 10 paths an arm on gaps of 137 and 192.

## Credence

- **Base rate, item 1:** 0.10 (it leans on the deep review's ranked cause LOSS-HOLD: results-scorecard.txt KIND BASE RATES, a rate frozen since 5 Oct, O115); the review's own cause credences already carry it (its receipt, deep-review-log.md 6 Oct 04:34 UK, shades from the 01:52 receipt's, which named the base rate), so the derivation does not shade them again (the deep review after XAS-R2, FLAG 2)
- **Item 1:** HELD 0.55, INCONCLUSIVE 0.28, FALSIFIED 0.17 (derived, results-derive-forcexc.txt section 3: the review's causes LOSS-HOLD 0.55 at r 0.9 on both arms (times each arm's reach, 1.000 on both: section 1b), LOSS-READ 0.15 at r 0.1, LOSS-OPT 0.08 at r 0.5, LOSS-NOISE 0.02 at r 0, the rest 0.20 at r 0.5 (the unassigned 0.10 and LOSS-TABLES' 0.10, which is SNAP's alone), each through section 2's power. The derivation gives LOSS-HOLD the same r on P-LO as on HYB, although P-LO leaves PCLSI before its first would-be hold on 0.973 of its saved paths (section 1b; the pre-mortem's second): the judged line weighs that and the derived one does not)
- **Judged, item 1:** HELD 0.35, INCONCLUSIVE 0.45, FALSIFIED 0.20 (the author's judgement for the design as amended by the deep review after PAUSE-S128, written before its derivation: the review puts LOSS-HOLD at 0.55 and LOSS-READ at 0.15; with the hold counted flat or allowance-only, HYB is forced at its first allowance-only year, where it first leaves PCLSI, so HYB+X should recover if the hold is the cause; P-LO leaves PCLSI by its rush before its hold, so even under LOSS-HOLD it may recover only part; both must recover 0.7 or more against a flip noise that pulls R down, so the middle outcome carries the most weight; both keeping 0.3 or less needs the hold to matter little on both). Declared: before writing these the author saw the review's own forecast for the amended run (0.40, 0.40 and 0.20 in the order above), the first design's derivation (results-derive-forcexb.txt: the S130 gaps and the power at one r for all arms) and its derived credences (0.50, 0.23 and 0.27); so these judged credences are not blind to either.
- **Kinds:** 1 ATTRIB
- **Declared (seen before the derived line):** a first run of the amended derivation used a flip share 0.03, read from the deep review's premise (g) (the arms' decided paths against PCLSI, 0.027 to 0.035 of 6,000); those count the gap paths themselves, so the script now derives the share per arm from the paths PCLSI loses (0.004 on both) and keeps 0.03 and 0.01 as sensitivity rows. That first run's credence line read 0.00, 0.57 and 0.43 (in the order of the derived line above); its power rows are the 0.03 sensitivity rows now printed. The judged line was committed before either run (03a1164, drafts/diag-forcex-amended.md).

## Power

From results-derive-forcexc.txt section 2, in the rescue share r, not R, with the flip share on the other paths derived per arm from the files (P-LO 0.004, HYB 0.004: twice the paths PCLSI loses that the arm keeps, over the arm's survivors; grade C, an upper analogue, since PCLSI differs from the arm far more than one forced draw does): HELD on every draw at r 0.8 and above on both arms, 0.10 at r 0.7; FALSIFIED on every draw at r 0.1 and below, 0.68 at r 0.3; INCONCLUSIVE at r 0.5 and whenever one arm recovers and the other does not (0.9 against 0.5 either way). Sensitivity: at a flip share 0.01 (the first design's assumption) much the same; at 0.03 the rule cannot read HELD (0.05 at r 1.0): there the force's own flips on the other paths cost more than the gap's margin. The reported tax, net and survival of each forced arm against its partner show which holds.

## Budget line

Six parts, four at once: per household a SNAP part (one solve, one forward run) and a PCLSI part (one solve, three forward runs), each forward run with the move run twice a hold year. From EDGE-SPLIT's measured times (results/diagedge/case0.txt: solves 389 to 618 s, forward runs 638 to 1,019 s) and about half again for the copy runs: about 0.6 hours a SNAP part and 0.9 a PCLSI part, about 4.5 core-hours, about 2 hours in two waves at four at once; each part stopped at 6 hours.

## Pre-mortem

- **First:** HYB diverges from PCLSI at year 5, but its first hold in [0.15, 0.25) at its first allowance-only year may still come after its other pots have begun to fall, so HYB+X recovers part of its gap and reads PARTIAL while P-LO+X recovers: INCONCLUSIVE for a reason about the force's reach (FLAG 3), not the hold.
- **Second:** P-LO's gap begins with its rush through (0.5, 0.75) at year 9, before its hold (FLAG 3); forcing past 0.75 cannot undo the rush, so P-LO+X reads PARTIAL even if the hold costs survival (LOSS-READ and LOSS-HOLD both acting: O114).
- **Third:** the force rescues the paths PCLSI saves but loses others (the forced tax on paths that would have survived anyway), so D and P disagree path by path and R sits in the middle with a wide spread; the flip share is NOT CHECKED.
- **Fourth:** the identity before the first force fails because the copy run of the move is not the move the run takes (a hidden state the flow touches, as O109's cache was): the gate refuses the run.

## Changes after seeing results

None: no result has been seen. Amended before launch twice: (1) on the plan-auditor's PASS of 6 Oct on 9386fc7, its MINORs 1-6 (the power in the rescue share r; S-INT+X's cell declared; HYB+X forced at both edges; the move's edits; the budget; row 28's evidence); (2) on the deep review after PAUSE-S128 (deep-review-log.md 6 Oct 04:34 UK, its DECISIVE TEST): a would-be hold is u in [p - 0.10, p) with next u under p and growth under 0.02, counting the allowance-only draw (was a cell 0.05 and growth under 0.01); item 1 decides on P-LO+X and HYB+X only, Holm over four, HELD (LOSS-HOLD) both RECOVER, FALSIFIED (LOSS-READ or the force's own cost) both KEEP, SNAP+X reported (was three arms with LOSS-TABLES as FALSIFIED); the acting share read from the partners' files; S-INT+X dropped; the divergence and force years and the other pots' gap reported; HELD feeds the consistent pair, not a chooser-side fix; the credences re-judged and re-derived per arm; the budget re-estimated. The thresholds 0.7 and 0.3 and the carry 0.01 are unchanged.
