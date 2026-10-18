# HO-DEP: the fixed adaptive reference against the order reference on deposit households (detail for PLAN.md's AREF row and its 18 Oct 09:43 ledger row)

Proposed by the deep review after FOOT-S366 (deep-review-log.md 18 Oct 09:43 UK); adopted under the maintainer's standing
go-ahead, with the maintainer's decision of 18 Oct that a reference change's harm is read by the mixture only.

## Why

FOOT-S366 read R1 on S366, where after the fix the adaptive reference makes the order reference's every move: S366 cannot tell
the two apart. The case for the fixed reference rests on S360 and S364 (no inflow) and on no deposit household read against the
order reference. On S362, FOOT-S366's reported lines show the fix trading runs across worlds against the unfixed reference
(O179), with no order-reference control.

## The jobs (seed 7004, the first 4,000 paths a world)

- S362 at 30 points: K1 (the adaptive reference, the RS split, no fix: FOOT-S366's unfixed control), K1F (with the fix,
  reproducing FOOT-S366's saved K1F file to the bit) and K2 (the order reference); the per-path whole score saved.
- One more deposit-mid household (not S362 or S366), chosen before registration by a 30-point differing-moves count, A
  against O, over four candidates with world-0 survival 20 to 80% (AX-HO's reach lesson); A (the adaptive reference, the RS
  split, the fix) and O (the order reference) at 60 points.

## The items (the review's; the registration sets the rules)

- No material harm, A against O on the chosen household, by the mixture-weighted paired survival and whole score (the
  chooser's weights, solve.js MIX3), each world's line reported.
- A's table at its own opening within 1.5 points of its runs in every world, O's beside.
- S362: K1F against K1 by the mixture-weighted whole score; K1F against K2 by the mixture-weighted survival and whole score,
  K1F's GB beside K2's (O179's control).

## The rule's steps before HO-DEP relies on it (the plan-auditor's MINOR 2 of its FAIL on the 09:43 row)

- RULES.md section 8 amended: a reference change's per-household test is the mixture of the per-world intervals, not the
  per-world exact conditional McNemar alone, by the maintainer's decision of 18 Oct (PLAN.md's 18 Oct 09:43 row).
- stats.mjs: mixtureChange and mixtureOutcome (survival), mixtureMean (the whole score), at the weights MIX3W; the margin
  marginRel at the control's mixture survival.
- The maintainer's rule of 29 Sep ("every new test reads survival by both") carried over: each world's interval is the
  unconditional one held at least as far out as the exact conditional bound at each end, before the worlds are combined.
- The combined interval's rate at a true weighted loss at the margin measured by simulation before HO-DEP registers
  (sim-mixture.mjs, results-sim-mixture.txt), and the interval's level set from it: at 95% the rule read "no material harm"
  3.67% to 4.21% of the time on S362-like cells, against the 2.5% stated, so it reads the interval at 98% (MIX_LEVEL), which
  holds 1.78% to 2.27% there, 0.95% to 0.98% at mid survival and 0.03% to 0.39% at high survival.
- The whole score (mixtureMean, a normal interval on each world's paired mean, combined at the weights, at the same 98%):
  its margin marginRel at the control's mixture survival, in points, as the survival read's; its rate at a true weighted loss
  at the margin 1.80% to 2.02% on S362-like discordance with a continuous part of sd 0.3 points a path
  (results-sim-mixture.txt), the plan-auditor's MINOR 2 of the re-audit's PASS.

## Its gate

The design-reviewed corner test: p against simulate() at the reader's corners, S362's year-3 cliff cells and its year-4 A = 0
node, the NaN top planted; design-reviewed by the deep-reviewer before it is relied on (CHECKLIST item 6).

## STOP until HO-DEP reads

A reference default; 7u-F with the adaptive reference; more S366 jobs for the reference question; a copy or split change aimed
at S362's GB; a single-world harm read of a reference change; FOOT-S366's item 4 cited as no-harm where the references differ.
