# CARRY's carrying rule and its forecast for 7aw, committed before 7aw is read

Written 7 Oct, after 7aw launched (runs.log, 22:38 UK) and before any of its units finished or reduce-7aw.mjs ran. The deep
review of 7 Oct 22:06 UK (deep-review-log.md) asked for this: CARRY's rule, fitted on its three members (O38, O45, O121),
cannot be tested on them, and 7aw is a free held-out member - 7aj and 7aw are the same candidate, world, code
(6dfa9cfea59a), households and 8,000 paths of seed 7002, differing only in the estate weight (0.01 and 0.02). Nothing in
this file was read from 7aw. The reader that scores it is registered as its own test before it runs, with the saved files
of both runs fair-tested first (CHECKLIST item 3).

## The rule (from the three members)

A per-household record carried to a test that differs in one setting holds within its paired band unless:

1. **OMIT** - a measured part differs between the record and the test and was left out of the carry (O121's later parts,
   O38's sizes from another arm). In 7aw nothing is left out: the candidate is the same.
2. **SWITCH** - the changed setting moves a year-0 gap across the switch line, so the tier held from the opening flips
   (O45's bridge 4). In the record, a shipping-default unit whose year-0 gap lies within a factor 1.5 of the 0.001 margin
   (6.67e-4 to 1.5e-3) is at risk; the candidate runs at margin 0, so its opening flips only if its gap crosses 0.
3. **NARROW** - the band carries sampling spread only, so households with many discordant paths depart more often.

## The definitions the reader will use

- **The household's change:** for each path, x = (CAND at 0.02 survives - SHIP at 0.02 survives) - (CAND at 0.01 survives
  - SHIP at 0.01 survives), from the four traces; the change is 100 times the mean of x over the 8,000 paths, in points,
  and its standard error 100 times x's standard deviation over the square root of 8,000.
- **A departure:** the change is at least 0.1 point in size and at least 2.58 standard errors from 0 (a household with no
  path that moves has no departure).
- **A flip:** either arm's year-0 opening (the gap line's two figures) or risk-above decision differs between 7aj and 7aw.
- **The classes, fixed now from 7aj's record (results-7aj.txt):**
  - SWITCH-RISK (the shipping default's year-0 gap within 6.67e-4 to 1.5e-3): bridge 4+cost (9.7966e-4), S172
    (1.0806e-3), S124 (1.4634e-3).
  - HIGH-CHURN (the smaller of saved and lost at least 15): S128 (148), S370 (117), S130 (15).
  - The other nineteen households.

## The forecast

- **F1, flips:** a flip on bridge 4+cost's shipping default (O45: the weight raised the product's gap on bridge 4, and
  9.7966e-4 is 2% under the line); possibly on S172 or S124; on none of the nineteen others.
- **F2, where departures fall:** every departure is on a household that flips or on a HIGH-CHURN household.
- **F3, the nineteen:** no departure on any of the nineteen other households that does not flip.
- **F4, the sign at bridge 4+cost:** if its shipping default flips to hold a higher tier at year 0, CAND's gain there
  falls (from +3.712 at 0.01).

## The causes, as the review ranked them, and what each predicts here

| Cause | Credence (the review's, judged) | Predicts in 7aw |
|---|---|---|
| CARRY-OMIT | 0.43 | no departures at all (nothing is left out here) |
| CARRY-SWITCH | 0.30 | departures only on households that flip |
| CARRY-NARROW | 0.17 | departures on HIGH-CHURN households, flips or not |
| CARRY-OTHER | 0.10 | departures elsewhere, on the nineteen |

The author's judgement, written now: F1's bridge 4+cost flip 0.55; F2 holds 0.75; F3 holds 0.80; F4 holds given a flip
0.85.
