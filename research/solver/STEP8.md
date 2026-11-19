# Step 8: the registered test of what holds, on HSP (D129 (3); DRAFT, 19 Nov)

The remedy's read (`results-household-remedy.txt`, EXPLORATORY) took HSP: the household plan with each income-tax band
above two personal allowances, and the tax-free cash cap, priced at `k = 1 / s` times one person's, `s` the larger
person's share of the two pensions, at the even split. By D129 (3) step 8's registration is drafted on it, put to the
design reviewer and brought to the maintainer before launch. The external review gives its outline
(`research/reviews/2026-11-17/ANSWERS.md` at f1f44727, its next step 6): "a registered test on a held-out seed of what
holds, against today's default and against the app's rules, with the pot's ruling in its rule, its design to the reviewer
first. Then the change of default, the reviewer on it, and the guard looked at again." This note is that design. The
registration (`registrations/household-hsp.md`) is drafted from it once the panel is landed and the pilot sized.

## The question

Does the household plan (HSP) keep more couples solvent than today's couples' default (K2), delivering no less spending,
with no harm to any couple? Its figures against the app's rules (APP) are read beside, by the rule D34 set for them.

## Arms

All three on one plan for each unit, scored by the engine on the same paths of the held-out seed:
- **APP:** arm A, the app's withdrawal-policy search on the couple's plan, without the tournament (D36).
- **K2:** today's couples' default as the app solves a couple. Each person's table at the couples' candidate
  (af001697ce1b, 45 points, weight 0.02), the joint move `JOINT` (the pots' share and LOOKHOLD: D99, D109), the swap where
  the elder is entered second (D104 (1)). It is `audit-household.mjs`'s K2, held to JOINT-WIDE's byte for byte.
- **HSP:** one household table at the candidate 17ff82379838 with its tie-break above the cap. Its plan is
  `householdPlanFor` with `scale: 'pensions'`, and the year's move is `chooseHouseholdSingle` at the even split. It is
  `audit-household-remedy.mjs`'s HSP.
Each arm's configuration hash printed by the audit (`configOf`), as the share rules' registration gives its arms.

## Households

Eight held-out couples, five units each (40 units), every unit inside today's guard, so that K2 is what the app runs for
it today and the comparison against K2 is the change of default's:
- **own:** as the library holds it (60/40, the first person the elder);
- **45:** every wrapper re-held so the elder holds 45% (inside the band; `s` is the larger share of the pensions);
- **90:** the elder holding 90% (`k` 1.111, the case S191-90 placed at the bar);
- **a feature** at 60/40, set by the couple's place: the first person's `£15,000` a year DB pension from the state pension
  age, the same of the partner's, or the partner's state pension at 60% (the share rules' three);
- **gap8:** the partner eight years younger, no other income (inside D128's guard; step 5's gap8 shape).

How they are found and landed, as the share rules' panel was (`share-rules-panel.mjs`):
- the library order of `couples-orders.json` (D4's, first person older than 44);
- the touched left out by `held-out.mjs touchedAll` on the day, with every couple of the household line's reads (the lead
  test's 28, step 5's bases, the guard test's, the remedy's), frozen with the order;
- eight taken evenly (`select-7u-broad.mjs pick`), the rest reserves;
- each unit landed so APP survives 85 +/- 1% on 1,000 paths of seed 7005 (`landTarget`, D4's procedure);
- a unit `householdPlanFor` refuses is reported and its couple passed over for the next reserve (`REFUSALS.md` names what
  it refuses);
- each unit's verdict from the app's own guard (`src/couplesSwitch.js` `coupleSolverOn`) required on, so that K2 is what
  the app runs for it: a unit the guard keeps on the app's rules (an exact 90% held a hair over the bound, say) is reported
  and its couple passed over too.

## Seed and paths

- **Seed:** 7024, not used before as a whole number anywhere in the repository. It is reserved in `check-prediction.mjs`
  for `household-hsp*.md`, a protected file: that needs the maintainer's unlock, named in its commit.
- **Paths:** D34's size for each HSP-against-K2 comparison, at the pilot's discordance and its upper 95% bound: the floor
  16,000 and at most D61's 19,000. A comparison whose 1-point rate at its realised discordance falls below 0.90 is read there
  and named with its rate (D34 (4), as D61 and D96 (2) ruled). The pilot is EXPLORATORY, on seed 7002, on three couples'
  units. Its budget is measured on this machine with nothing else running (D21).

## Primary metric and the rule

Survival scored by the engine (`runPath`, held to `E.runTrial` on the first 200 paths of every arm), paired on the same
paths. HSP passes if all three hold against K2:
1. **No harm:** no unit flagged by D34's harm rule, the loss in whole paths against its threshold
   (`reduce-share-rules.mjs` `harmExact`).
2. **A gain:** the pooled survival change over the 40 units has its 95% interval's lower end above nought.
3. **Spending:** pooled spending delivered on the paths both keep is not lower than K2's by more than 0.05% (the lead
   test's form, `reduce-household.mjs` `spendOn`).

**The pot's ruling (D116, M1)** is in the rule as the maintainer gave it: where HSP keeps more paths and delivers no less
spending, a smaller pot left is not a harm. It is recorded, capped at four times opening wealth and in pounds a path
beside the spending, and is not a bar. It is read pooled, as part 3 is, and by unit beside it: each unit's spending on the
paths both keep and its capped pot are printed. A unit where HSP keeps more paths but spends less on the paths both keep,
beyond noise, is named with its pot, since M1's condition is not met there; it is not a bar. The remedy's read had two
such units (S023-db and S167; `results-household-remedy-beside.txt` section 4; its reviewer's MINOR 3).

**Against APP, beside the rule:** HSP less APP on survival and spending, pooled and by unit, and D34's harm flags against
APP, each sending its unit to investigation without blocking on its own (D34 (3)).

## Outcomes

- **PASS:** HSP becomes the couples' default, in the commit of the D-line naming this run. That is a build: the household
  plan's construction, its table and its move put into the app's solve of a couple (`src/`), with the decided-defaults
  block, the test that pins it and the reviewer on the change of default, to `main` on B1's gate. Then the guard is looked
  at again with its own units, as the review asks. Beyond the panel the D-line says what holds by inference: couples
  outside the guard (an age gap above three years with other taxable income, the younger holding more than 60%, either over
  90%), shapes the panel lacks, and the 'lower' estate aim.
- **FAIL:** today's default stays. The read goes to the maintainer, with each failing part and its units.
- **A unit flagged:** HSP does not become the default whatever its pooled gain; the unit goes to investigation (D34 (3)).
- **Reported, deciding nothing:** each unit's `k` and three survivals; spending; the pot capped and in pounds; lifetime
  tax; the household table's forecast against its survival; the rollout beside the engine on K2's first 500 paths; the
  solve and path times.

## What the design reviewer is asked to weigh

1. **S191-90's margin.** The remedy took HSP on a pass by `0.38` of a path on S191-90
   (`results-household-remedy-beside.txt`). Under HSP that couple still loses beyond noise against K2. Under D34's rule a
   90/10 unit like it is flagged if its loss passes its threshold, and one flag stops the default.
2. **Five units a couple, all inside the guard.** The review's "the guard looked at again" is left to its own units after
   a PASS, so a FAIL here cannot be read as the guard's.
3. **The rule against K2 alone, with APP beside it**, as stage C and the share rules were.
4. **M1 by unit.** It is printed and its exceptions named, not a bar. The alternative is to make a named unit block the
   default, as a flagged one does.
5. **The cost,** measured by the pilot on this machine with nothing else running (D21) before the registration is
   complete: K2's path is the slowest of the three (the decomposition's times, `results-household-decomp.txt`).

## Box

A day to build, land, pilot and size (from 19 Nov 01:00 UK). Then the design reviewer, then the maintainer before launch.
The launch waits for the maintainer and for the unlock that reserves the seed.
