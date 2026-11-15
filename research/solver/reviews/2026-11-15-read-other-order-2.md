# Review at the read, second round: couples entered the other way round, stage A (`OTHER-ORDER.md`; D100, `PART-D.md` D7; EXPLORATORY, seed 7002)

Subject: the answer to my FAIL at the read (`reviews/2026-11-15-read-other-order.md`: finding 1 BLOCKING, 2 to 6 MINOR), in
two commits. 22ba4cb2 rewrote the report, added sections G to L to `other-order-beside.mjs` with their output, and changed the
decisions entry and STATE.md's D100 clause. 4ada22b4 fixed finding 6's defect in `src/solver/couple.js` `singlePlanFor`, with
`research/tests/couple-cut.test.mjs`.

Read (blobs at 22ba4cb2 unless named): `reports/2026-11-15-other-order-read.md` 02386cad, `DECISIONS-PENDING.md` 3bf5b6a8
(l.14-57), `STATE.md` ca343743 (section 6 action 3), `other-order-beside.mjs` 03ade3a4, `results-other-order-beside.txt`
da9fbdd1, `results-other-order.txt` 32fc4e16, `reduce-other-order.mjs` fe04fff2, `audit-other-order.mjs` d2d776aa,
`couple-order.mjs` b9a4fdfd, `OTHER-ORDER.md` da9edc88, `stats.mjs` 7cf309da, `reduce-share-choose.mjs` 9d53ead2,
`results-share-choose.txt` f9f06203. Also `src/solver/couple.js` 7ef7a675 (0eb988c1 at bb2c48dd),
`research/tests/couple-cut.test.mjs` e91655b0, `results-couple-cut.txt` 6f38c82d, `research/tests/run-all.mjs` f2e15894,
`e3pcls-pin.json` d547f5d3, `src/solverCouple.js` 74c3eaa3 (`householdPlan`, `couplePlans`), `src/solverSettings.js` fb3004da
(`prepareForSolve`, `appPlan`), `src/couplesSwitch.js` 35320217, `src/solver/fast.js` 0e962057 (l.225-238),
`src/solver/model.js` 7cfc7fec (l.440-448), `research/tests/couple-tables.test.mjs` b3a62624 (check 2), and `src/App.jsx`
30a4d4fa (l.1693, l.1806-1822, l.1949-1967, l.1994-2001, l.2083-2089, l.2165-2176, l.2275-2279, l.2344-2356, l.2437-2442,
l.2511, l.2747, l.13186, l.13700-13701).

Ran (read-only; my scripts are in the session scratchpad). I opened nothing of seed 7021, D4, `d4-backup` or `d4b-backup`, and
ran no solve.
- `node reduce-other-order.mjs`: byte-identical to its results file, the gate fair. `--planted`: all pass.
- `node other-order-beside.mjs`: byte-identical to its results file.
- `node research/tests/couple-cut.test.mjs` and `--planted`, on the working tree.
- The same test on a scratch tree of 4ada22b4 with bb2c48dd's `couple.js` (the code before the fix).
- The e3pcls fingerprint of the code now.
- My scripts: `incomes.mjs`, `incend.mjs`, `incend2.mjs`, `panels2.mjs`, `capid.mjs`, `working2.mjs`, `buffer.mjs`,
  `fracage.mjs`, `pagecosts.mjs`, `s155.mjs`, `sc-bars.mjs`, `wb.mjs`.

Verdict: FAIL

The read stands. The first round's findings 2 to 6 are answered, and so is finding 1 as far as it went:
- the recommendation is now stated as the condition it is;
- the tie's two readings are put fairly;
- every figure I checked is printed by a script;
- the beside script re-runs byte-identical and computes what its labels say;
- the cut's fix is right and its test fails on the code before.

The FAIL rests on a new finding (1 below). The route recommended in place of stage B lists two things that must change first,
and the code has at least three. The third is a defect on `main`. The test proposed for the route cannot fail on two of the
faults it should catch.

## What was checked and holds

- **Made once, by the rule.** Neither commit touches the rule's files (`OTHER-ORDER.md`, the audit, the reducer, the batch,
  `couple-order.mjs`). The reducer's output and its gate are as at the first review.
- **Finding 1 of the first review, as far as it went.**
  - The condition is stated as one: "provided the swap mirrors every field the engine and the solver read in the first
    partner's terms" (report l.78-79; decisions entry l.36-37).
  - The bands and the age cap are named, and I recomputed both sections. Section K: a band at the first person's 71 to 81 on
    S129-90 spends differently in plan years 15 to 17 and 26 to 28, and `otherOrder` applied twice gives the plan back. Section
    L: read after a swap, the guard is ON while the engine runs 40 years where the plan has 45.
  - The figures to map back are listed.
  - Stage C's PASS is said to cover the swapped solve exactly, and its comparison with the app's younger-first rules by
    inference. ELDER less APPY is at least +6.400 on every unit (section H).
  - The accounts-order qualifier is gone, and the route is put as the maintainer's call.
- **Finding 2, the tie.** Both readings appear with their outcomes, in the report (l.33-48, l.154-157), the decisions entry
  (l.24-28) and the beside's section A, and nothing was read again:
  - the committed sentence ("below -0.5"): -20 paths sits at the bar, so the outcome is THE OPTION;
  - the rule's named source, D4's "under 0.5": the outcome is NEITHER;
  - the reducer's floating point is given beside them.

  That is put fairly, but see finding 3.
- **Findings 3 and 4.**
  - (3a) Section I gives S129-90's 25 lost and 5 saved paths, all decided in the last year against the minimum pot of
    £1,080,000, with the margins I had. S389-90 has 13 at the floor and 3 run out; S389-75 has 13 and 6.
  - (3b) The pooled loss beyond noise is said (l.30-31).
  - (3c) Section H: APPY parts from APP on 9 units, 7 of them under the same policy, and S237-90 beyond noise.
  - (3d) Section J gives the features.
  - (4) The four sources are called leads (l.54-61). S155-75's deposit is routed by each order's policy name (section G). I
    checked G further: among the fields a single's plan reads, the elder's cut plan on S155-75 differs between the two orders
    only in the policy's name (`s155.mjs`). Unread fields also differ: the household's partner fields and a cost's owner. The
    MPAA ages are the same. So the routing is that plan's one effective difference.
- **Finding 5.** The class is named as I gave it. The share choice's four point-change bars hold no figure at a whole-path tie
  (`sc-bars.mjs`):
  - (ii) by unit, -118 to +245 paths against -20, none at -20;
  - (i) +0.464 against 0.2;
  - (iv) -0.145 and -0.241 against -0.2;
  - the means' share, -0.359 against -0.2.
- **Figures (CHECKLIST 6).** Every figure I checked in the report and the decisions entry is printed in
  `results-other-order.txt` or `results-other-order-beside.txt`. "The estate weight is the same to the bit" holds: YOUNGE's
  joint weight equals ELDER's on 24 of 24 (`wb.mjs`).
- **The beside script (question 2).** Its re-run is byte-identical. G to L compute what their labels say:
  - G compares the right digest pairs (ELDER.self against YOUNG.part). Its deposits are each order's plan under its own arm A
    policy, as `solverPlan` takes it. App.jsx's only change since the launch is D98's ceilings, which no deposit reads.
  - H's `change(APPY, X)` is X less APPY (reduce-other-order.mjs l.55-60).
  - I classifies by the audit's own `minPot` (a failure in year T below the floor) and `failYear < T`. Its three counts sum to
    each total.
  - J, K and L build contexts of the panel's plans and solve nothing.

  The script runs no gate; the reducer's gate passes on the same files.
- **Finding 6's fix (question 3).**
  - On the code before: checks 1 to 3 FAIL and 4 PASSES with digest 3a6a0a04f7af558b, as the results file has it. On the fix
    all four pass with the same digest. So the library's 840 cut plans are the code before's, bit for bit, and no pinned
    figure resting on them moves. couple-tables check 2's made couple carries bands, but it compares amounts and skips ages,
    so it is unmoved too.
  - `--planted`: 'bandage' fails exactly checks 1 and 3, and 'giftwhole' exactly 2 and 3.
  - The cut is right. A band [F, T] in the first person's ages becomes [F + g, T + g] in the partner's plan, where g is the
    partner's age less the first person's, so it covers the same plan years. A blank end stays blank and runs to the partner's
    own end, which is the plan's end.
  - The page's route is right too. `couplePlans` cuts `householdPlan`'s plan, whose ages are written as the engine reads them.
    Check 1 covers the bands there, and the gifts are shared there as well (`pagecosts.mjs`): each person's costs are £47,009
    of the household's £94,009, item by item within the rounding, on S129, S059 and S307 under both share rules.
  - The code's e3pcls fingerprint is the pin's, d556873d2cc35ac2.

## Findings

1. **BLOCKING. The route recommended in place of stage B rests on an incomplete list of what must change, and on a test that
   cannot fail on two of the faults it should catch.** The report states the condition rightly, then gives it as complete:
   "Two things must change first" (l.80: the bands and the age cap; the decisions entry l.36-38 says the same).
   - (a) **A third field: an income's blank end age.** The household's year reads a blank "To age" as the plan's end age. That
     age is the first person's (App.jsx l.1818, taking `terminalAge` from l.1693), and it is compared with the income owner's
     own age (l.2275). For a partner older than the first person, the income stops before the plan ends. That contradicts the
     field's own hint, "Leave blank to run to the end of the plan" (l.13186).
     - Test case: couple-cut.test.mjs's own 'partner older' case (S129, the partner 60 against the first person's 56, the plan
       to plan year 39), with the partner's DB pension of £12,000 a year from 66, end age blank. The engine's own rows give the
       partner's taxable other income as £21,800 up to plan year 35 and £9,800 (the state pension alone) in plan years 36 to 39
       (`incend2.mjs`).
     - Three readings of that one plan disagree (`incend.mjs`). The household's year pays the income to plan year 35. The
       partner's cut plan pays it to 39, both through `singlePlanFor` and through `couplePlans`: its end age is the partner's
       own age at the plan's end (couple.js l.89), and the income keeps its blank (l.93). That is 4 plan years off. The mirror
       `otherOrder` also pays the elder's income to 39 (couple-order.mjs l.22, l.25). So the swap gives the household 4 years
       of income that its entry, as the engine reads it, does not have.
     - Consequence for the route: a younger-first couple whose elder has a blank-end income would be solved and shown on that
       income to the plan's end. The app's rules beside it, run on the plan as entered, stop the income (the age gap) years
       early. The comparison the page shows would then be between different sums of money. The report's "those differ a
       little" (l.99-100) holds for couples like this panel's: none of the 24 has an income in either order (`incomes.mjs`).
     - It is also a defect on `main` today, of finding 6's class. It reaches the app's rules for every couple entered with the
       elder second and a blank-end income, with or without the solver. Under the solver it reaches such a couple inside the
       40% to 60% band, which runs the solver in the order entered (couplesSwitch.js l.64-68): the elder's table is solved with
       the income running to the plan's end, while the household's year stops it.
     - No tested couple has the elder second: not the library's 210, the two D4 panels' 40 each, nor stage C's 36
       (`panels2.mjs`). Stage C's four units with a blank-end income all have the elder first, where the partner is younger and
       the defect does not bite.
   - (b) **The proposed test** (report l.94-97; the decisions entry l.39-40) enters plans younger first independently of the
     mirror, compares the two entries through the page with each other, and plants three faults. Two of those faults cannot
     fail it:
     - *The swap made before the age cap.* Section L's couple entered elder first (80/50 to 125) is itself a 40-year plan to
       the engine, which reads the end age as 120, and its guard is ON. Entered younger first (50/80 to 95), it is 45 years and
       kept to the app's rules (`capid.mjs`). With the fault, the younger-first entry is swapped to that same 40-year solve and
       the two entries agree. Without the fault, they differ. So the identity passes with the fault present and fails without
       it. This plant needs its own check: the guard's answer on the plan as entered.
     - *The income's blank end age (a).* The elder-first entry and the swapped younger-first entry both pay the income to the
       plan's end, so they agree. Only the younger-first plan as the engine reads it differs, and the identity never runs it.
   - **To clear:**
     - Name the third item among what must change first. Either the engine takes a blank end age as the income owner's own age
       at the plan's end, or the mirror writes the end age the entry implies. Either way it is a defect on `main`, to be fixed
       with a test of its class (each person's income, year by year, in the household against their own plan) and with its
       plant. Tell the maintainer which figures it moves for such couples.
     - Say the list is what has been found so far, not shown to be complete, and revise the route's estimate with it.
     - Revise the test plan. Compare each person's year in the swapped plan (spending, costs, incomes and the state pension,
       plan year by plan year) against the plan as entered, as the engine reads it. Read the guard on the plan as entered. Keep
       the identity of the two entries beside these, each check with its plant.
     - Change the decisions entry to match.

2. **MINOR. `couple-cut.test.mjs` tests what it says for the bands and the costs, but its class is narrower than its header
   claims.** The header and the commit describe the class as "each person's plan spends its share of the household's, plan
   year by plan year" (l.2-3). Besides the incomes (finding 1), the household's year shares three more things with the cut
   plans that the test does not see:
   - (a) **Years when one person is retired and the other works.** Once either person is retired, the household spends its
     whole scheduled target, offset by the worker's take-home pay (App.jsx l.2437, l.2344-2356, l.2511). A person's own plan
     schedules nothing while that person works, and their pay goes into no pot (fast.js l.231). So in those years the worker's
     share of the spending is planned by neither table; with a salary, the household draws less than the two tables plan.
     - At the pots' share, every library couple has 1 to 3 such years (30, 60 and 120 of the 210), and every stage C unit has at
       least one (`working2.mjs`).
     - S129-90: plan years 0 and 1, with £6,060 a year of the household's scheduled spending in no plan (the younger works,
       with no salary).
     - S265-90: plan years 15 to 17, with £3,190 a year (the younger works, on £24,500).
     - Check 3 sums `spendTargetAtAge`, which does not apply the working rule, so it passes with this gap present.
   - (b) **The cash buffer under a table.** The engine splits the household's buffer evenly between the two people (App.jsx
     l.2747, `/ owners.length`). Each table holds its own plan's buffer, set by its share (fast.js l.238). At the pots' share
     these part (`buffer.mjs`):
     - S129-90: the engine holds £15,150 for each person, while the elder's table plans £27,270 and the younger's £3,030;
     - S389-90: £5,250 each, against £9,450 and £1,050.
   - (c) **An age typed with a fraction.** The age inputs accept one (App.jsx l.13700-13701). The engine rounds a band's ages
     but not a person's, so the shifted band is one plan year off at one edge, through the cut and `couplePlans` alike
     (`fracage.mjs`): S129 with the partner at 53.5, plan year 15; at 53.4, plan year 25; at 53, none.

   (a) has been Part D's design since D2, and (b) comes from D99's pots' share; neither comes from this fix, and neither's
   effect on outcomes has been measured. They are leads for the maintainer's list. The test's header, and the report's and the
   commit's "the class", should say it covers the schedule and the costs.

3. **MINOR. The bars' proposal is not neutral to the tie it sits beside.** If the change is formed from the counts (l.125-127),
   this read's own rule reads S129-90's -20 paths as at the bar, not below it, and the outcome becomes THE OPTION. The beside's
   section A computes exactly that ("YOUNGE with (b) in whole paths ... WITHIN THE TARGETS"). The proposal's planted case for
   (b), "exactly -20 of 4,000 holds 'below -0.5'", is the committed sentence's reading. So adopting the proposal writes into
   the code one of the two readings the maintainer is asked to choose between (l.33-48).
   - "It moves no printed figure beyond the last digit" (l.128-129) is not so for this read. Re-run under the change,
     `other-order-beside.mjs` prints THE OPTION as the reducer's outcome: it has no gate of its own and takes the reducer's
     `rule`. `reduce-other-order.mjs` refuses its own files at the gate instead, because stats.mjs is in the audit's stamp
     (audit-other-order.mjs l.45) and the gate checks against the files' hash as they are now (reduce-other-order.mjs l.134).
   - The proposal should say that it and the tie are one question, with its (b) case placed on whichever side the maintainer
     rules.
