# Prediction: diag-carry

- **Run:** `research/solver/batch-carry.sh` - results/carry/read.txt (reduce-carry.mjs, the reader: no solve, no new path; it reads 7aj's and 7aw's saved records)
- **Kind:** test
- **Written:** 8 Oct, 07:59 UK, before the run. The forecast it scores (drafts/carry-forecast-7aw.md) was committed in 770cfb2 on 7 Oct, before any 7aw unit finished; the reader's design is the deep review of 8 Oct 05:58 UK's item 2 (items/CARRY.md), with four corrections made before any read (below, Derivation). Registered in 9fc9b76; corrected before any launch or read (no result seen) on the plan-auditor's FAIL of 8 Oct 08:23 UK: the credences re-derived from the base rate without counting REOPT's spread twice (its BLOCKING 1), the risk-above flip read from the joint line (MINOR 2), the third and fourth corrections declared (MINOR 3), the decision table's overclaim cut (MINOR 5); then on its PASS of 08:36 UK, G3 setting aside the ran line's tiers that move with a risk-above decision, and item 2's 80% interval stated for the mixture, not REOPT's band alone (its two MINORs)
- **Seeds:** 7002 tuning: read only - the 8,000 saved paths of 7aj and of 7aw, both of seed 7002; no path is drawn
- **Unmasking:** none: the test fixes nothing and changes no setting; it reads two finished runs that differ in the estate weight alone, so no known error is removed and nothing can be unmasked
- **Mechanism:** O123-REOPT, the deep review's leading cause for O123: the estate term scales with the weight, `src/solver/solve.js:504 "const wB = (opts.bequestWeight !== undefined ? opts.bequestWeight : 0.02) / scale;"`, and scores nothing above the cap, `src/solver/solve.js:506 "const beqCap = opts.bequestCap !== undefined ? opts.bequestCap : 4 * scale;"`, so at 0.02 the candidate's tables value a de-risk toward the cap that at 0.01 they did not, and its policy moves; the switch charge that prices such a move is fixed in score units, `src/solver/solve.js:423 "const switchCharge = opts.switchCharge !== undefined ? opts.switchCharge : 0;"` (PR11). How often each cause applies, per unit, is derived (results-derive-carry.txt: the reviews' cause credences through the reader's rules); the fixed-policy re-score (item 2) holds the policy and reads what is left
- **Plan section:** PLAN.md "CARRY", "O123", "O38", "O45", "O121", "7u"

## Question

CARRY's carrying rule, fitted on three members of the carry family (O38, O45, O121), says a per-household record carried to a test that differs in one setting holds within its paired band unless a measured part is left out (OMIT), the setting moves a year-0 gap across the switch line (SWITCH), or the band carries sampling spread only on a household with many discordant paths (NARROW). Held out of the fit, 7aj (estate weight 0.01) and 7aw (0.02) are the same candidate, shipping default, households, code and 8,000 paths. Does the rule predict 7aw: is every departure of the candidate's paired survival gain from 0.01 to 0.02 on a household that flips its year-0 opening or churns heavily (item 1)? And is O123 - 7aw's whole-score least point above its derived interval - the candidate's re-optimisation for the weight (O123-REOPT): with 7aj's policies held, does the least household's whole score at 0.02 fall inside 7aw's derived 80% interval (item 2)?

## Derivation

What the mathematics and the records say (results-derive-carry.txt; derive-carry.mjs reads no trace and compares nothing between 7aj and 7aw):

- **The causes, as recorded, and from the base rate:** CARRY-OMIT 0.43, CARRY-SWITCH 0.30, CARRY-NARROW 0.17, CARRY-OTHER 0.10 (deep-review-log.md 7 Oct 22:06 UK); O123-REOPT 0.85, O123-SCALE 0.05, O123-OTHER 0.10 (8 Oct 05:58 UK). Neither receipt says it shaded toward the base rate of an item leaning on a deep review's cause (0.10, results-scorecard.txt), so the derivation starts there: each lead halfway from the review's credence to 0.10, the others sharing the rest in proportion (derive-xasr2.mjs's rule) - CARRY-OMIT 0.265, SWITCH 0.387, NARROW 0.219, OTHER 0.129; O123-REOPT 0.475, SCALE 0.175, OTHER 0.350. In 7aw nothing is left out of the carry (the candidate is the same), so OMIT predicts no departure at all.
- **Item 1's power** (section 2, the reader's own departure rule over the binomial, with each household's 7aj discordant count as the proxy for the paths that can move between the weights, grade C): a false departure under a symmetric null is at most 0.014 a household, 0.124 over the 22 not HIGH-CHURN - the forecast's statistic tests each household at 2.58 se with no correction across them, and was fixed so before 7aw ran. A one-margin departure (0.25 point, 20 net paths) on one of the nineteen is seen with chance 0.830 on average (least 0.019, share 0.95's 1,741 discordant paths). An EDGE decides item 1 only under SWITCH, on the share of departures whose flip is in a counterfactual figure alone: 20 of 7aj's 50 units have their two opening figures apart, 0.400 (grade C), with sensitivity rows at twice and three times it.
- **Item 2's outcomes** (section 3): under REOPT the least fixed-policy point lies in the band by the cause's own statement (S120's fixed-policy whole is its derived -0.016 and the least of 25 is at most that; the paths are saved, so no sampling spread is added - counting one would count REOPT's own uncertainty twice). SCALE (declared uniform +0.03 to +0.10, the measured +0.064 inside it) and OTHER (declared uniform -0.25 to -0.12) are read by the registered rule with the least household's 95% half-width on record (7aj S120 0.068, 7aw wealth x2 0.100, mean 0.084): SCALE reads INCONCLUSIVE on every draw, OTHER FALSIFIED on 0.354. So item 2 tells REOPT from the rest, and the `=> O123-` lines report the side. Sensitivity at twice and three times the half-width is printed, and the review's credences unshaded beside (HELD 0.85).
- **Four corrections to the review's design, made before any read** (items/CARRY.md): (1) G1's "the audits differ only in W and comment lines" is not so - `diff audit-7aj.mjs audit-7aw.mjs` shows each audit's own name in its error messages, output folder and variable (7aj/7AJ/DIAG7AJ_OUT/diag7aj) as well; the gate maps each run's name to one token before comparing, and any other code difference refuses (plant: a code line). (2) G5's plant (one trace rotated by a path) cannot make the statistic print departures: sum x is the four survival totals added and subtracted, and a rotation keeps each total; the plant checks that G5 refuses and that the rotation moves paths both ways and widens the se. (3) G4's "Y 40 in all 100 traces" would refuse the records - Y runs 38 to 46 across households (the plan-auditor's count) - so G4 checks Y the same across each household's four traces. (4) The risk-above decision is the joint line's (the case line's riskAbove is the constant setting 'auto'); since the forecast reads its change as a flip, G3 sets that field aside rather than refusing it (the plan-auditor's MINOR 2; all 100 units on record read 'off: no tier above the plan', so nothing rests on it).
- **The reader's plants** (`node research/solver/reduce-carry.mjs --planted`, quoted): 7 paths one way read no departure and 8 read one (sum -8, -2.83 se); sum -8 from 30 down and 22 up reads none (z -1.11); a candidate's first figure alone moving is a counterfactual flip; gaps at both ends of [6.67e-4, 1.5e-3] in, 1.5001e-3, 6.6699e-4 and '>1' out; churn exactly 15 in, 14 out; a departure on a non-flipping SWITCH-RISK household alone marks OTHER EDGE; departures split between a flip and HIGH-CHURN leave SWITCH and NARROW unsettled; G1 passes the two audits' shape and refuses a code line, a stamp naming another audit and two stamps in a run; G2 refuses a unit missing, repeated or not done; G3 refuses a minPot and a cap and sets the risk-above decision aside, with the ran line's tiers that move with it, which the parser-planted cases read as a flip (and refuse the tiers moving alone, or a minPot beside them); G4 refuses a saved count off by one, another seed and a trace of another length; G5 refuses a rotated trace. OUTCOMES REACHED: item 1: FALSIFIED, HELD, INCONCLUSIVE; item 2: FALSIFIED, HELD, INCONCLUSIVE.

## Prediction

- **Item 1 HELD:** every departure (if any) falls on a household that flips its year-0 opening or is HIGH-CHURN (S128, S370, S130); none on a household of the 22 others that does not flip - CARRY's rule holds out of sample.
- **Item 2 HELD:** with 7aj's policies held, the least household's whole score at 0.02 lies in -0.12 to +0.03 - O123 is the candidate's re-optimisation for the weight.

## Falsified if

- **Item 1:** a departure, read literally and not EDGE, on a household that neither flips nor is HIGH-CHURN (F2 or F3 failing).
- **Item 2:** the least fixed-policy point outside -0.12 to +0.03 with its whole 95% interval outside it too.

## Fair-test table

Arm A is 7aj's saved records (the estate weight 0.01), arm B 7aw's (0.02); the reader's gate checks each SAME row below that the files can show (G1-G5).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 12 | The estate preference | bequestWeight 0.01 (7aj) | bequestWeight 0.02 (7aw) | TESTED - the one setting the two runs differ in; G3 checks every ran and joint line equal once bequestWeight is removed |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | code 6dfa9cfea59a, audit-7aj.mjs | code 6dfa9cfea59a, audit-7aw.mjs | SAME - G1: one stamp a run, the same code, each audit its stamp's, the audits the same code but W, comments and their own names |
| 30 | The reducer and its version | reduce-carry.mjs | reduce-carry.mjs | SAME - one reader reads both; item 2's controls first reproduce both files' item-2 lines (reduce-7aa.mjs wholeLeg) |
| 33 | For timings: what else the machine was running | - | - | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The gate first** (NOT SETTLED if any refuses): G1-G5 as reduce-carry.mjs's header states them; the classes re-derived from results-7aj.txt equal to the forecast's lists; item 2's controls (7aw's traces at 0.02 and 7aj's at 0.01 reproduce all 50 item-2 lines of their files to 0.0005) and plant (the weight at 0.03 moves at least one).
- **Item 1 (single look):** HELD iff the forecast's F2 and F3 both hold, read literally; FALSIFIED iff either fails, read literally and not EDGE; INCONCLUSIVE iff neither fails but one is EDGE (an outcome turning on a counterfactual figure: the shipping default's second opening figure, the candidate's first). The departure is the forecast's, verbatim: |sum x| at least 8 in integers and |change| at least 2.58 se, se from the n-1 sd. F1 and F4 are scored with F2 and F3 by Brier; the 22:06 causes are settled by the `=> CARRY-` lines (a partition, as items/CARRY.md states it).
- **Item 2 (single look):** HELD iff the least of the 25 fixed-policy whole points at 0.02 (7aj's traces, wholeLeg at 0.05 with 7aw's settings) lies in -0.12 to +0.03; FALSIFIED iff it lies outside and so does its whole 95% interval; INCONCLUSIVE iff it lies outside but its interval reaches the band. The `=> O123-` lines name the side.
- **Reported, not items:** each arm's own paired change 0.01 to 0.02; O121's WEIGHT leg; each shipping default's gap direction (O45); the exact sign test beside z; the 25 fixed-policy points beside 7aw's measured ones.
- **Declared choices, not derived:** the forecast's statistic as it was fixed before 7aw ran (no correction across households: its false-departure chance 0.124 is derived above and carried into the credence); the band of item 2 is 7aw's registered 80% interval; INCONCLUSIVE on item 2 by the household's own 95% interval; the single look.

## Decision table

| outcomes | action | credence |
|---|---|---|
| 1 HELD, 2 HELD | CARRY's rule stands for 7u's derivation: a per-household record carries to a test differing in one setting within its band, except on households that flip or churn heavily, which take their own record; O123 closes on REOPT, and a whole score carried to another weight is re-scored on the record's own traces with the policy held, beside each weight's own record | 0.31 |
| 1 HELD, 2 not HELD | the rule stands as above; O123 stays open on the side the O123 lines name, and 7u's whole-score derivation takes each weight's own record only | 0.34 |
| 1 not HELD, 2 HELD | no survival record is carried across a setting in 7u's derivation (each setting's own record, or an interval declared wide); CARRY goes back to a deep review with 7aw in the fit; O123 closes on REOPT | 0.17 |
| neither HELD | as the row above for the carry; O123 open | 0.19 |

## Decision fed

- **Item 1 HELD:** CARRY's rule is written into RULES.md section 9 as the carrying rule for derivations, with its exceptions; 7u's derivation carries 7aj's and 7aw's records by it.
- **Item 1 FALSIFIED:** the rule fails out of sample; 7u's derivation carries no survival record across a setting; the family returns to a deep review with 7aw in the fit.
- **Item 1 INCONCLUSIVE:** as FALSIFIED for the households the EDGE concerns; the rule stands elsewhere, and the EDGE goes to the register.
- **Item 2 HELD:** O123 closes as REOPT; lessons.md's 7aw AUTOMATE (re-score on the record's traces with the policy held) becomes the rule for carried whole scores.
- **Item 2 FALSIFIED or INCONCLUSIVE:** O123 stays open on the side named; the AUTOMATE is not adopted; 7u's whole-score derivation uses each weight's own record.
- **In every branch:** no product change and no solver setting changed.

## Provenance

- **The design:** items/CARRY.md (the deep review of 8 Oct 05:58 UK, item 2; the plan-auditor's BLOCKING 2 of 8 Oct restored G1's same-code condition and the plants); the forecast drafts/carry-forecast-7aw.md (770cfb2); the causes of 7 Oct 22:06 and 8 Oct 05:58 UK.
- **The build:** reduce-carry.mjs, derive-carry.mjs and batch-carry.sh, on f3b3fd0.
- **Seen before registration (declared):** results-7aj.txt and results-7aw.txt in full (7aw was recorded from them), so the forecast's points and flips were readable by subtraction, as the 05:58 review says; while building the reader, the head of 7aw's case0.txt (share 0.50's candidate unit) and some of results-7aw.txt's item-1 lines; this test's derivation output (results-derive-carry.txt), run before this file was written. No change, se, departure, flip or class was computed from the two runs together before the reader exists.

## Derivation script

- `derive: research/solver/derive-carry.mjs > research/solver/results-derive-carry.txt sha256 afae22148175a3cc`
  (the inputs and the causes shaded from the base rate, item 1's power by the reader's rule, item 2's outcomes under each cause, the credences and the decision table's rows)

## Point and interval

- **Item 1:** 0 departures off flips and HIGH-CHURN, the rule's point under every cause but OTHER; 80% interval 0 to 1 (the derived false-departure chance 0.124 over the 22, and OTHER's 0.129 from the base rate)
- **Item 2:** -0.016, the least fixed-policy whole point at 0.02 (the 7aw derivation's point, which REOPT says holds with the policy held); 80% interval -0.213 to +0.060 under the shaded mixture of causes (results-derive-carry.txt section 3), with REOPT's band -0.12 to +0.03 beside it, which holds 0.475 of the mass

## Power

From results-derive-carry.txt section 2: a false departure 0.124 over the 22 households not HIGH-CHURN (each at most 0.014); a one-margin departure on one of the nineteen seen with chance 0.830 on average, least 0.019 (share 0.95, where 20 net paths are lost among 1,741); under SWITCH an EDGE decides 0.350 of reads at the EDGE share 0.400, and at twice and three times that share the item reads HELD 0.51 and 0.44. Section 3: under REOPT item 2 reads HELD by the cause's own statement; under SCALE INCONCLUSIVE on every draw; under OTHER FALSIFIED 0.354; at twice and three times the half-width FALSIFIED is 0.00 overall (HELD 0.47 either way). Item 2 tells REOPT from the rest, not SCALE from OTHER, which the `=> O123-` lines report.

## Budget line

Zero cores for a solve: the reader decodes 100 saved traces and runs 50 control legs, 25 at the planted weight and 25 fixed-policy legs (reduce-7aa.mjs wholeLeg over 8,000 paths each). About five minutes on one core, by reduce-7aw.mjs's reading of the same traces (its 50 legs in about two); the batch stops it at an hour.

## Credence

- **Base rate, item 1:** 0.10 (it leans on the deep review's ranked causes: results-scorecard.txt KIND BASE RATES, an item leaning on a deep review's cause, 1 of 19). Neither receipt (deep-review-log.md 7 Oct 22:06 and 8 Oct 05:58 UK) says it shaded toward it, so the derivation starts there (the plan-auditor's BLOCKING 1 of 8 Oct 08:23 UK, as on diag-xasr2)
- **Base rate, item 2:** 0.10 (as item 1)
- **Item 1:** HELD 0.65, INCONCLUSIVE 0.13, FALSIFIED 0.22 (derived, results-derive-carry.txt sections 1, 2 and 4: the 22:06 causes shaded from the base rate - OMIT 0.265, SWITCH 0.387, NARROW 0.219, OTHER 0.129 - through the reader's departure rule, the false-departure chance 0.124 and the EDGE share 0.400 under SWITCH)
- **Item 2:** HELD 0.48, INCONCLUSIVE 0.40, FALSIFIED 0.12 (derived, sections 1, 3 and 4: the 05:58 causes shaded from the base rate - REOPT 0.475, SCALE 0.175, OTHER 0.350 - REOPT HELD by its own statement, the others through the registered rule)
- **Judged:** none - the author has read both results files in full (above), so a judgement now would not be blind, and the derivation's output was run before this file; the blind judgements are the forecast's own (F1 0.55, F2 0.75, F3 0.80, F4 0.85, committed in 770cfb2 before 7aw finished), which the reader scores by Brier.
- **Kinds:** 1 ATTRIB, 2 ATTRIB

## Pre-mortem

- **First:** a false departure on one of the 22 by the forecast's uncorrected 2.58 rule (0.124 derived): item 1 FALSIFIED though the rule holds. Read with the sign test and each household's moved paths beside it, and recorded as a statistic's failure if the departure is a lone one at the threshold; the item's outcome is not re-read.
- **Second:** an EDGE: bridge 4+cost (the forecast's F1) or another flip moving only in a counterfactual figure, which decides F2, F3 or a cause; read as void by the registered rule, and the flip goes to the register.
- **Third:** G1 refuses on a difference the name mapping misses (an inline comment changed on a code line): NOT SETTLED, the audits' diff printed; an amendment is registered before any re-read.
- **Fourth:** item 2's controls fail to reproduce a file's item-2 line (a field the leg reads from the ran line, or spendYears, taken differently from reduce-7aw.mjs): NOT SETTLED until the control is fixed and re-run, before the fixed-policy legs are read.
- **Near the band:** the least fixed-policy point within 0.084 (the half-width) of either end reads INCONCLUSIVE, not FALSIFIED; S120's composition puts REOPT's point near -0.016, inside.

## Changes after seeing results

None yet.
