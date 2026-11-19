# Step 8: the registered test of what holds, on HSPA (D129 (3), D130 (2); DRAFT, 19 Nov; its design review's first round FAIL)

The remedy's read (`results-household-remedy.txt`, EXPLORATORY) took HSP: the household plan with each income-tax band
above two personal allowances, and the tax-free cash cap, priced at `k = 1 / s` times one person's, `s` the larger
person's share of the two pensions, at the even split. By D129 (3) step 8's registration is drafted on it, put to the
design reviewer and brought to the maintainer before launch. The external review gives its outline
(`research/reviews/2026-11-17/ANSWERS.md` at f1f44727, its next step 6): "a registered test on a held-out seed of what
holds, against today's default and against the app's rules, with the pot's ruling in its rule, its design to the reviewer
first. Then the change of default, the reviewer on it, and the guard looked at again." This note is that design. The
registration (`registrations/household-hsp.md`) is drafted from it once the panel is landed and the pilot sized.

**REGISTERED ON HSPA (D130 (2), 19 Nov).** Step 8 was held while HSP and HSPA (the personal allowance priced at `k` as
well) were read by this note's own rule on the lead test's 28 units and step 5's 28 shapes, on the code with the ISA
allowance fixed (`HOUSEHOLD-ARM.md`, EXPLORATORY, seed 7002). The read (`results-household-arm.txt`,
`reports/2026-11-19-household-arm-read.md`; its reviewer PASS) took HSPA:
- HSP failed part 1, S191-90 flagged by D34 in whole paths (`26` net against `23`);
- HSPA passed all three parts, no unit flagged.

So step 8 is registered on HSPA: its arm, the audit's plan checks and the panel's refusals are HSPA's. The panel, the pilot
and the sizing are taken again on the fixed code:
- the panel landed again on 71fb4271c681, the same couples and units, every target and arm A's survival unchanged;
- the pilot on HSPA (19 Nov 15:05 to 15:53 UK; its gate fair) and its sizing (`results-household-hsp-sizing.txt`): every
  unit at 16,000 paths; were the pilot's changes the truth, S273-45 flagged with chance 0.145 and every other unit at most
  0.018; the budget 58.2 core-hours, about 14.7 hours on four cores, one relaunch at the 12-hour limit. D80 is lifted for the household table (D130 (3)). Seed 7024 is reserved
when the registration goes to its second design review (D130 (4)). Below, HSP's history stays as it was written; the arms,
the rule and the outcomes read HSPA.

## The question

Does the household plan (HSPA) keep more couples solvent than today's couples' default (K2), delivering no less spending,
with no harm to any couple? Its figures against the app's rules (APP) are read beside, by the rule D34 set for them.

## Arms

All three on one plan for each unit, scored by the engine on the same paths of the held-out seed:
- **APP:** arm A, the app's withdrawal-policy search on the couple's plan, without the tournament (D36).
- **K2:** today's couples' default as the app solves a couple. Each person's table at the couples' candidate
  (af001697ce1b, 45 points, weight 0.02), the joint move `JOINT` (the pots' share and LOOKHOLD: D99, D109), the swap where
  the elder is entered second (D104 (1)). It is `audit-household.mjs`'s K2, held to JOINT-WIDE's byte for byte.
- **HSPA:** one household table at the candidate 17ff82379838 with its tie-break above the cap. Its plan is
  `householdPlanFor` with `scale: 'pensionsPA'`: the personal allowance, each income-tax band limit and the tax-free cash
  cap at `k` times one person's, its band for gains `k` times one person's, every other allowance design A's as built. The
  year's move is `chooseHouseholdSingle` at the even split. It is the arm read's HSPA (`audit-household-arm.mjs`).
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
- **Paths:** D34's size for each HSPA-against-K2 comparison, at the pilot's discordance and its upper 95% bound: the floor
  16,000 and at most D61's 19,000. A comparison whose 1-point rate at its realised discordance falls below 0.90 is read there
  and named with its rate (D34 (4), as D61 and D96 (2) ruled). The pilot is EXPLORATORY, on seed 7002, on three couples'
  units. Its budget is measured on this machine with nothing else running (D21).

## Primary metric and the rule

Survival scored by the engine (`runPath`, held to `E.runTrial` on the first 200 paths of every arm), paired on the same
paths. HSPA passes if all three hold against K2:
1. **No harm:** no unit flagged by D34's harm rule, the loss in whole paths against its threshold
   (`reduce-share-rules.mjs` `harmExact`).
2. **A gain:** the pooled survival change over the 40 units has its 95% interval's lower end above nought.
3. **Spending:** pooled spending delivered on the paths both keep is not lower than K2's by more than 0.05% (the lead
   test's form, `reduce-household.mjs` `spendOn`).

**The pot's ruling (D116, M1)** is in the rule as the maintainer gave it: where HSPA keeps more paths and delivers no less
spending, a smaller pot left is not a harm. It is recorded, capped at four times opening wealth and in pounds a path
beside the spending, and is not a bar. It is read pooled, as part 3 is, and by unit beside it: each unit's spending on the
paths both keep and its capped pot are printed. A unit where HSPA keeps more paths but spends less on the paths both keep,
beyond noise, is named with its pot, since M1's condition is not met there; it is not a bar. The remedy's read had two
such units under HSP (S023-db and S167; `results-household-remedy-beside.txt` section 4; its reviewer's MINOR 3). The arm
read had six under HSPA (S167, S023-90, S227-90, S023-db, S191-dbpart and S149@gap12; `results-household-arm.txt`).

**Against APP, beside the rule:** HSPA less APP on survival and spending, pooled and by unit, and D34's harm flags against
APP, each sending its unit to investigation without blocking on its own (D34 (3)).

## Outcomes

- **PASS:** HSPA becomes the couples' default, in the commit of the D-line naming this run. That is a build: the household
  plan's construction, its table and its move put into the app's solve of a couple (`src/`), with the decided-defaults
  block, the test that pins it and the reviewer on the change of default, to `main` on B1's gate. Then the guard is looked
  at again with its own units, as the review asks. Beyond the panel the D-line says what holds by inference: couples
  outside the guard (an age gap above three years with other taxable income, the younger holding more than 60%, either over
  90%), shapes the panel lacks, and the 'lower' estate aim.
- **FAIL:** today's default stays. The read goes to the maintainer, with each failing part and its units.
- **A unit flagged:** HSPA does not become the default whatever its pooled gain; the unit goes to investigation (D34 (3)).
- **Reported, deciding nothing:** each unit's `k` and three survivals; spending; the pot capped and in pounds; lifetime
  tax; the household table's forecast against its survival; the rollout beside the engine on K2's first 500 paths; the
  solve and path times.

## What the design reviewer is asked to weigh

1. **S191-90's margin.** The remedy took HSP on a pass by `0.38` of a path on S191-90
   (`results-household-remedy-beside.txt`). Under HSP that couple still lost beyond noise against K2, and the arm read
   flagged it. Under HSPA it is `+0.050` there (`16` saved, `14` lost), but in sample: HSPA was proposed after S191-90's
   loss was seen on those same paths. Under D34's rule a 90/10 unit like it is flagged if its loss passes its threshold,
   and one flag stops the default.
2. **Five units a couple, all inside the guard.** The review's "the guard looked at again" is left to its own units after
   a PASS, so a FAIL here cannot be read as the guard's.
3. **The rule against K2 alone, with APP beside it**, as stage C and the share rules were.
4. **M1 by unit.** It is printed and its exceptions named, not a bar. The alternative is to make a named unit block the
   default, as a flagged one does.
5. **The engine's ISA defect** (`reports/2026-11-18-windfall-read.md`) is fixed (675090f5, D130 (1)): a dated deposit
   or staged transfer into an ISA counts against that year's allowance in the engine, the exact model and the forward
   run. The code moved (603eeb595679 to 71fb4271c681), so the panel was landed again on it (the audit refuses a run on
   code other than the panel's). On the arm read the fix moved the household table on the units whose household plan
   carries the later retiree's ISA contributions as dated deposits (`results-household-arm-beside.txt` section A).
6. **The cost,** measured by the pilot on this machine with nothing else running (D21) before the registration is
   complete: K2's path is the slowest of the three (the decomposition's times, `results-household-decomp.txt`).

## The design review's first round (`reviews/2026-11-19-household-hsp-design.md`: FAIL, three BLOCKING, seven MINOR)

**Answered in the draft (`registrations/household-hsp.md`, the audit, the read, the sizing):**
- **BLOCKING 2, the pooled interval.** Part 2's interval is now by path (`reduce-phase4.mjs survivalItem`), since every unit
  runs the same paths. A planted case has ten units sharing a swing: summed cells clear nought, by path the interval
  straddles it, and part 2 fails. The mutant back on summed cells fails that case, and so does one reading the point.
  - The pattern search, by CHECKLIST 7 (`pooled-bypath.mjs`, `results-pooled-bypath.txt`, EXPLORATORY): 28 pooled parts of
    14 earlier reads recomputed by path from their stored arrays. They include TIE-C2's two parts, on which LOOKHOLD
    became the default. None would change its verdict; the reads stand as printed.
  - By path, the intervals are 1.3 to 6 times as wide on the household line's reads, whose units are variants of the same
    couples, and about the same width elsewhere.
  - The ISA sweep's arrays (D73's default) are no longer stored.
- **MINOR 4, the format.** Each field is on its own line, the hashes on the Arms line, and every unfilled field a `<...>`
  placeholder, so the launcher's check refuses the draft until each is filled.
- **MINOR 5, the ends.** Planted cases pin part 2's lower end and part 3's point; four mutants each fail their case.
- **MINOR 6, the record.** Each unit records its settings lines, the settings check's inputs, HSP's plan entries beside
  one person's, and the two bands; the gate checks each again. Each unit's own log must name it, with its done line. A
  resumed part must match the registration's hash and the Node version.
- **MINOR 7, the ISA defect** reaches HSP's table on 30 units (planning), and the engine on S027-gap8. Both are stated.
- **MINOR 8, part 3 weighting:** the units weighted equally, by path.
- **MINOR 9, the guard** is read at the launch commit.
- **MINOR 10, the port:** a PASS's port into the app must be shown identical to the tested arm, path for path.
- **The pilot and sizing:**
  - the sizing checks the pilot's code and runs its gate first;
  - it prints each unit's change and D34's chance of flagging it at the registered N;
  - the budget counts the 200 checked paths and one relaunch.
  - **The first pilot's gate refused it** (19 Nov 02:36 to 03:13 UK, audit 2227dc534415; no outcome read). On S273's five
    units, HSP's no-earnings pension limit was `18,624` (`21,591` on gap8), not twice one person's `3,600`. That is design
    A as built: `householdPlanFor` raises the limit to the most a later retiree pays into a pension in a year
    (`household.mjs`; `household.test.mjs` check 1 holds it at least doubled). The audit's own check before any path, which
    compares HSP's plan with design A's as built, passed on every unit. The gate's check from the record wanted twice one
    person's, so the fault was the gate's.
  - **Fixed:** the record carries design A's entries, and the gate holds HSP's other doubled entries to them, and design A's
    to one person's, with the no-earnings limit at least doubled (`reduce-household-hsp.mjs hspPlanProblems`, since the arm read `hspaPlanProblems` in HSPA's form). Four new
    refusals each fire on a planted fault, and a unit with the limit raised as on S273 reads fair. The pilot then ran
    again on the new stamp (19 Nov 03:29 to 04:04 UK, audit ceff89265751), the first kept aside unread
    (`results/household-hsp-pilot-1`). Its gate is fair.
  - **The sizing** (`results-household-hsp-sizing.txt`): every unit at `16,000` paths, the floor, the pilot's discordance at
    most `3.43%` at its upper bound. The budget is `44.3` core-hours, about `11.3` hours on four cores longest first, and the
    longest unit `2.71` hours. Were the pilot's changes the truth, S273-sppart (`-0.50` points) would be flagged with chance
    `0.901`, the same direction as BLOCKING 1.

**The maintainer's, before the second round (ruled by D130, 19 Nov: (a) for BLOCKING 1, the arm read then taking HSPA;
D80 lifted for the household table; the seed reserved at the second round; the ISA defect fixed first):**

1. **BLOCKING 1: HSP fails this rule on the read that took it.** The remedy's own units, read by step 8's rule, FAIL:
   S191-90 is flagged by D34 at 25 paths against a threshold of 23. The remedy's bar (the interval's upper end above -0.3)
   passed it by 0.38 of a path. At 16,000 paths a unit with its discordance and its loss is flagged with chance 0.996 (the
   reviewer's figure). The choices:
   - **(a) step 8 stays held** under its own bar, as D129 (3)'s "until those losses are fixed" reads. The next step would
     be an EXPLORATORY variant that prices the personal allowance at `k` as well, read on the lead test's 28 units by this
     registration's own rule; step 8 would then be registered on whichever form passes. The decomposition's bands single,
     which left one personal allowance, kept S191-90 above K2 (`98.13%` against `97.63%`).
   - **(b) S191-90 runs on 7024 as a named replication unit**, where a flag fails the run.
   - **(c) a PASS goes to the maintainer** with S191-90's flag unresolved, and does not by itself change the default.
   - **The agent recommends (a).** Registering HSP now spends a held-out seed, and the run the pilot will size, on an arm the
     rule already flags on a couple it has run.
2. **BLOCKING 3: the tie-break and D80.** HSP's table carries the candidate's tie-break above the cap (`tieAboveCap`
   0.0001, D95). D80 keeps a tie-break out of any registered couples' arm. The choices:
   - lift D80 for the household table;
   - or run HSP without the tie-break, a new configuration none of the household plan's reads ran.
   - **The agent recommends lifting D80 for the household table:**
     - its move is the single solver's own chooser, where the tie-break has been the default since D95;
     - every read of the household plan ran with it;
     - D80 (11 Nov) was written for the two tables' joint move, before D95.
3. **The seed:** 7024 reserved in `check-prediction.mjs`, a protected file: an unlock.
4. **The ISA defect:** if it is fixed first (the maintainer's ruling pending), the panel is landed again, about an hour.

## The design review's second round (`reviews/2026-11-19-household-hsp-design-2.md`: PASS, four MINOR)

The switch to HSPA is complete and consistent, BLOCKING 1's answer holds as a design, and the registration is complete but
for the seed, the launch stamp and this review. Each MINOR is answered before the launch commit:
1. **25 of the 40 units had never been through the audit's checks before any path.** A refusal under the registration would
   end its unit and so refuse the whole run on the held-out seed. The audit and the batch gain a `preflight` mode: each
   unit the pilot did not run goes through every check before any path at 45 points, then two paths of the pilot's seed
   (EXPLORATORY, no outcome, nothing of 7024; `results/household-hsp-preflight`).
2. **Under a PASS, a unit M1 names did not reach the maintainer.** Under a PASS each unit M1 names now goes to the
   maintainer with the read before the default changes. The read's outcome line names them, and each one's spending over
   all paths is printed beside its spending on the paths both keep. `reduce-household-hsp.mjs` `report` is a function now,
   with a planted case: a PASS with such a unit names it, and without it does not.
3. **The gate's re-checks of the settings lines and the household line had no planted case.** Six planted faults on a real
   pilot record's lines (S025-own, 19 Nov) are each refused by their own check and nothing else. Each of two mutants, one
   with the settings re-check removed and one with the line re-check removed, fails that case.
4. **`check-prediction.mjs` does not read "The launch".** The launch stamp is filled by hand at the launch commit, as the
   share rules' registration's was.

Also from the round: the audit's header and the sizing's line on shapes were stale and are corrected. The sizing prints the
batch's own order beside longest first (the reviewer's figure: 15.93 hours against 14.7), with a planted case. The edits
move the audit's stamp, so the pilot runs again on the final files before the sizing is taken.

Done before the launch commit:
- the preflight (`results-household-hsp-preflight.txt`): the 25 units, none refused;
- the pilot again on the final files (19 Nov 19:10 to 19:53 UK, audit 7fa755346a65, its gate fair): its arrays the same in
  every stored figure on every path as the run before the edits;
- the sizing (`results-household-hsp-sizing.txt`): every unit at 16,000 paths; the budget 54.5 core-hours, 14.8 hours on
  four cores in the batch's own order, the longest unit 3.48 hours.

Because the answers changed the registration's Outcomes and its gate after the pilot was read, they go back to the reviewer
for a check of exactly those answers (`reviews/2026-11-19-household-hsp-design-3.md`), as the registration's own rule asks.

## Box

A day to build, land, pilot and size (from 19 Nov 01:00 UK). Then the design reviewer, then the maintainer before launch.
The launch waits for the maintainer and for the unlock that reserves the seed.
