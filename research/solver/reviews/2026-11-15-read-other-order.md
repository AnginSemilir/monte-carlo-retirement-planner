# Review at the read: couples entered the other way round, stage A (`OTHER-ORDER.md`; D100, `PART-D.md` D7; EXPLORATORY, seed 7002), read 15 Nov

Subject: the read of D100's stage A, `results-other-order.txt` (OUTCOME NEITHER), the figures written after it
(`other-order-beside.mjs`, `results-other-order-beside.txt`, deciding nothing) and the write-up to the maintainer
(`reports/2026-11-15-other-order-read.md`; `DECISIONS-PENDING.md`'s 15 Nov entry; STATE.md section 6 action 3's D100 clause;
the messages of 2f41dde6 and ebcea866), against the rule committed in 159898ef, the code and the stored arrays.

Read (blobs at ebcea866): `OTHER-ORDER.md` da9edc88, `audit-other-order.mjs` d2d776aa, `reduce-other-order.mjs` fe04fff2,
`batch-other-order.sh` 8c86935e, `couple-order.mjs` b9a4fdfd, `other-order-beside.mjs` 46e10b6b, `results-other-order.txt`
32fc4e16, `results-other-order-beside.txt` acbc17ef, `reports/2026-11-15-other-order-read.md` 65cb6458 (4843a373 at
2f41dde6), `DECISIONS-PENDING.md` 40dafdb2 (l.14-38), `STATE.md` b8d5fe3c (D4 l.133; section 6), `stats.mjs` 7cf309da
(`survivalChangeU`, `pooledSummed`), `audit-couples.mjs` f50aa99d (`solverPlan`), `fair-gate.mjs` 4d4a2040, `runs.log`
733c6297 l.368, `couples-share-panel.json` 16ec3d23; `src/solver/couple.js` 0eb988c1 (`singlePlanFor` l.79-106,
`estateFrom` l.127-131, `chooseJoint` l.667-743), `src/solver/model.js` 7cfc7fec (l.275-285, l.404), `src/solver/fast.js`
0e962057 (l.226-231), `src/couplesSwitch.js` 35320217, `research/tests/couple-estate.test.mjs` 420ea7f6, `src/App.jsx`
30a4d4fa (the engine's source, `research/engine.mjs` built from it: l.837, l.1169-1180, l.1865-1869, l.2422-2428, l.2442,
l.2862, l.2942); the bar lines alone of `reduce-speed-b.mjs` ef65ecd0, `reduce-allowance-both.mjs` 58325c9b,
`reduce-tie-couple.mjs` a7e2eb1a and `reduce-share-choose.mjs` 9d53ead2; the 24 `case<k>.txt` logs and 24 `<id>.json.gz`
units in `results/other-order-7002/`. Nothing of seed 7021, D4, `d4-backup` or `d4b-backup` was opened; no solve or path
was run (engine contexts and the stored arrays only).

Ran (read-only; my scripts in the session scratchpad): `node reduce-other-order.mjs` again (the gate fair, the output
byte-identical to the results file, so the fourteen stamp files are as launched) and `--planted` (8 of 8 pass);
`node other-order-beside.mjs` again (byte-identical); `bars.mjs` (each unit's cells and change in whole paths against each
bar); `lost.mjs`, `edge.mjs` (the discordant paths by failure kind, and their pots against the floor); `app.mjs` (APPY less
APP, ELDER against each); `digests.mjs` (each person's digest in each order); `s155.mjs` (S155-75's elder's plan under each
order's policy name); `bands.mjs`, `bandcut.mjs`, `cap.mjs`, `lib.mjs` (findings 1 and 6).

Verdict: FAIL

The read stands: made once by the rule as committed, the gate fair, every figure reproduced, the outcome NEITHER as the
reducer printed it. The FAIL is the report's recommendation (finding 1); the rest are MINOR.

## What was checked and holds

- **Once, by the rule as committed.** No commit since 159898ef touches `OTHER-ORDER.md`, the audit, the reducer, the batch
  or `couple-order.mjs`; the launch is `runs.log` l.368 (14 Nov 21:57 UK, from f82fec86, code df5511a96f99); every log
  opens `stamp: code df5511a96f99 audit af4f9ea14c3a prediction none` and holds its done line, with no error line; the last
  unit was written 15 Nov 01:15 UK; the units' clocks sum to 12.6 core-hours against the rule's 11. Between 159898ef and the
  launch, `couple.js` moved only by af04f0f4's tie rule, off in code and not passed by the audit.
- **Question 1, the tie.** S129-90 under YOUNGE: cells a 3781, lost 25, saved 5, d 189; ELDER survives 3806 of 4,000 and
  YOUNGE 3786, a change of exactly -20 paths, -0.5 points. The reducer's FAIL is floating point: `survivalChangeU` forms the
  change as (a + c)/N - (a + b)/N (`stats.mjs` l.117), here 0.9465 - 0.9515, which in binary is -0.0050000000000000044, so
  `d < RULE.unit` (`reduce-other-order.mjs` l.75) holds; from the counts, 100 x (-20/4000) is -0.5 exactly and the
  comparison does not. The committed sentence ((b): "below -0.5 points") and the reducer's own strict `<` both read -20
  paths as at the bar and not below it, so that is the right whole-path reading of the rule as written (but see finding 2).
  Reporting NEITHER as printed and putting the tie to the maintainer is right: a reducer changed once the outcome is known
  and read again would choose its reading by the result, and both outcomes go back to the maintainer before stage B is
  registered (`OTHER-ORDER.md` l.86-92). No other part is at a bar: under YOUNGE the next units are S389-90 at -16 paths
  (-0.400) and S389-75 at -11, pooled (a) -46 paths against the bar's -192 (-0.2 x 96,000), (c) +0.075% against -0.1%; under
  YOUNG the worst unit is S389-90 at -17 paths and (c) -0.905%; on the beside's 22 units the same.
- **Question 2, the beside script.** It imports the reducer's `armOf`, `rule`, `RULE` and `OTHERS`, reads the same folder in
  `unitsOf()`'s order and re-runs byte-identical. Each section is computed as labelled: A's whole-path (b) is `saved - lost <
  -20` with the interval wholly below nought, (a) and (c) the reducer's; C's ranges and means are of the units' percentage
  changes; D's counts are the summed cells; E is the reducer's `rule` on the 22 units; F reads each plan's ages through
  `buildContext`. B's "each person's table DIFFERS" is the reducer's joint flag: on S155-75 the elder's table alone differs
  (`ELDER.self` against `YOUNG.part`; the younger's digests equal), as the report says, though neither file prints which. It
  runs no gate of its own; the reducer's gate passes on the same files today.
- **The mechanisms the report names are in the code.** The joint move takes `steps`, `costSteps`, `harvest` and `lump` from
  the first person's move (`couple.js` l.692); `lump` takes both people's lump sums on first access (`model.js` l.275-285);
  the engine meets each cost step from the first person's wrapper before the partner's (`App.jsx` l.2422-2428); the loop
  keeps the first strictly best of `splits x kA x kB` (`couple.js` l.686, l.716).

## Findings

1. **BLOCKING. The recommendation's central claim, that a couple entered younger first "then gets, bit for bit, the plan the
   app already gives the same couple entered older first" (report l.55-58; `DECISIONS-PENDING.md` l.30-31, "the plan stage C
   tested, bit for bit"), offered as the reason to open the guard without D100's registered stage B, is not established, and
   with the module it cites it is false for a class of plans.**
   - (a) The mirror is incomplete. `couple-order.mjs` swaps the demographics' pairs, the owners and ids, the end age and the
     per-person ceilings, but spending bands are entered in the first person's ages (`App.jsx` l.837, "in "Myself" ages";
     read at `ageSelf`, l.2442) and `otherOrder` leaves them where they are. S129-90 with one band (the first person's 75 to
     85, at 70% of target): the plan and its mirror spend differently in 6 plan years (the band in plan years 19 to 29
     against 22 to 32), and `otherOrder` twice still gives the plan back (`bands.mjs`). The app takes bands (`App.jsx`
     l.13162, "From age").
   - (b) The cited test cannot see it, nor can the proposed one. `couple-estate.test.mjs` check 6 is an involution on S007,
     which has no band: a field the mirror leaves unmoved is unmoved both ways and passes. None of the library's 210
     couples nor any of stage C's units has a band, and every one is entered elder first (`lib.mjs`; the beside's F). So the
     identity the report proposes, "each of stage C's 24 couples, entered younger first", passes with this fault present;
     and if its younger-first plans are made by `otherOrder` and swapped back by the same mirror, it passes by the involution
     whatever the mirror omits.
   - (c) The age cap. A couple entered younger first at 50 and 80 with its plan to 95 keeps the app's rules today (the
     reducer's last line). Swapped, its plan ends at 125: `horizonFits` passes on it, the engine runs 40 years where the
     plan has 45, and `coupleSolverOn` says on (`cap.mjs`). The cap has to be read on the plan as entered, before any swap.
   - (d) Beyond "each figure the couples' screens show per partner" (l.68-69): the year rows' `ageSelf` and `agePart`
     (`App.jsx` l.2862), a failure age (l.2942, the first person's age) and the bands are the elder's under the swap and
     need mapping back, as does a stored solve and its restore.
   - (e) What stage C's PASS covers. It is the solve against APP, the app's rules on the plan entered elder first. A couple
     entered younger first meets APPY, which differs from APP on 9 of 24 units here, 7 of them under the same policy
     (S237-90 -0.200, -0.356 to -0.049; 8 lost, 0 saved). So the swapped solve is stage C's, and its comparison is stage C's
     by inference; on this read ELDER less APPY is at least +6.400 points on every unit (S265-90; EXPLORATORY, seed 7002),
     a strong inference on this panel, to be said as one.
   - (f) ebcea866's qualifier ("with its accounts listed in the same order", "couple-order.mjs keeps the list's order")
     bears on none of this: `normalizePlan` rebuilds the ten accounts in canonical order whatever the entry (`App.jsx`
     l.1169).
   To clear: "would get, provided the swap mirrors every field the engine and the solver read in the first person's terms",
   naming the bands and the age cap; the identity's younger-first plans made independently of `otherOrder` (entered both
   ways through the page harness, or written by hand), with planted cases failing it: a band left unmoved, the swap made
   before the age cap, the mapping back left out; and (e) said beside. Then "in place of stage B" is a fair framing for the
   maintainer to rule on: the rule's NEITHER branch names this route (`OTHER-ORDER.md` l.29-30), and the report says it
   replaces D100's stage B and is the maintainer's call.

2. **MINOR. The tie's two readings, for the ruling.** The rule calls its bars "D4's targets, 0.5 points a couple and 0.2
   pooled" (`OTHER-ORDER.md` l.79-80), and D4 reads "the policy ensemble's gap under 0.2 points on the panel mean and 0.5 on
   every household" (STATE.md l.133): a loss of exactly 0.5 is not under 0.5, so D4's own words put S129-90 outside its
   target, on grounds that are not floating point. Part (a) keeps D4's strictness ("above -0.2": exactly -0.2 fails); part
   (b) as written turns it round ("below -0.5": exactly -0.5 holds). The committed sentence is the rule and the report reads
   it rightly, but the report and `DECISIONS-PENDING.md` give the tie as floating point against whole paths, and stage B on
   the option as "the rule's words" (report l.72; `DECISIONS-PENDING.md` l.35; the beside's A): the maintainer should see,
   before ruling, that the rule's named source reads the tie the other way.

3. **MINOR. Beside the outcome, not said (question 5).**
   - (a) The deciding unit's loss is all at the plan's end. Under YOUNGE every one of S129-90's 25 lost and 5 saved paths is
     decided in the last year by the pot against the couple's own minimum pot of £1,080,000, about 18 times its target
     spend; none runs out. On the 25, ELDER's pot cleared the floor by a median £26,244 (£777 to £212,302) and YOUNGE's
     missed it by a median £44,145 (£256 to £495,940) (`lost.mjs`, `edge.mjs`). S389-90's and S389-75's losses are 13 of 16
     and 13 of 19 the same. It is the floor D102's read turned on (S129, "every lost path ending below the minimum pot").
     The outcome turns on whether one couple's last-year pot clears that floor, which the maintainer should weigh with the
     tie.
   - (b) With the option, pooled survival is -0.048 (-0.085 to -0.011): its interval is wholly below nought, a pooled loss
     beyond noise though inside the bar, where the report has "survival nearly so" (l.29).
   - (c) The app's own rules depend on the order, with no solver: APPY differs from APP on 7 of the 22 units whose policy
     is the same, S237-90 beyond noise (`app.mjs`). It is the most direct evidence for the report's "the engine's year",
     and it bears on finding 1 (e).
   - (d) No couple in the read has a spending band, a DB pension, a gain or a state pension from 67 (stage C's feature
     units are not in it), so `otherOrder`'s mirror is untested on those (finding 1).

4. **MINOR. The causes: what is shown and what is a lead (question 3).**
   - With the option, that what remains lies in the joint move and the engine's year is shown by elimination on the 23
     units whose two tables are the same by digest and whose estate weight is the same to the bit. The four mechanisms
     (the lump sum and the cost order from the first person's move, the draws first person first, ties to the first found)
     are in the code, and one was seen on one smoke path of S129-90 at 6 points; how much of the 182 lost and 136 saved
     paths, or of the three units beyond noise, each produces is not shown (no trace was kept, as l.121 says). "Its known
     causes are" (l.40-41) claims more: they are known sources, leads.
   - S155-75: that its elder's table differs where arm A's pick differs is shown as a co-occurrence (the one unit whose
     tables differ is one of the two whose pick differs; S237-75, whose pick differs and which holds no deposit, has the
     same tables), and the report says why was not traced. The difference is in the plan: the solver arms take each order's
     arm A policy name (`solverPlan`, as D37 has it), and the elder's £432,000 Auto deposit of 2030 goes £3,600 to the
     pension and £429,120 to the taxable account under Bracket Fill Basic, £20,000 to the ISA and £412,000 to the taxable
     account under Windfall to ISA (`policyRoute`, `App.jsx` l.1865-1869; `s155.mjs`). So on S155-75 the solver arms hold
     different wrappers from 2030 and not the order alone (`OTHER-ORDER.md`'s "only the order swapped" does not hold
     there); it is the arms' policy-name rule, not anything the app's entry order does, and the beside's E already shows the
     read the same without it. Said so, the S155-75 line is shown rather than "not traced".

5. **MINOR. The class, for the proposal on the bars (report l.79-82).** The artefact comes from forming a paired change as
   the difference of two rounded proportions, not from "20 of 4,000" (l.34: 100 x (-20/4000) is exactly -0.5). The
   reducer's planted checks hold no case at a bar (`reduce-other-order.mjs` l.99-117: 40 paths, 11 and 6 paths, 0.2% and
   0.05%), so the side of the tie was never tested. The class is a point change compared with a bar a whole number of paths
   away (this reducer's (a) and (b); `reduce-share-choose.mjs` l.116-121). The reads the report names put their survival
   bars on interval ends (`reduce-speed-b.mjs` l.59, `reduce-allowance-both.mjs` l.38 and l.43, TIE-C's
   `reduce-tie-couple.mjs` l.66-67), where a whole-path tie cannot arise and "in whole paths" has no meaning, so the
   proposal should name the bars it changes. Its test of the class needs a planted unit exactly at each such bar, on the
   side each part's words give: exactly -0.2 pooled fails (a) ("above"), exactly -20 of 4,000 holds (b) ("below"), exactly
   -0.1% holds (c) ("not lower by more than").

6. **MINOR, outside this read, for the maintainer (found checking finding 1): a couple's spending bands reach the partner's
   table at the partner's own ages.** `singlePlanFor` copies the household's bands with their amounts scaled and their ages
   unchanged (`couple.js` l.98), and a table reads its plan's bands at its own age (`model.js` l.404, `fast.js` l.226-231),
   while the household's year reads them at the first person's (`App.jsx` l.837, l.2442). S129-90 with a band at the first
   person's 75 to 85: the household and the first person's table apply it in plan years 19 to 29, the partner's table in
   22 to 32 (`bandcut.mjs`). It reaches every couple with a band that the couples' solver plans for since D99, in either
   order, and no test has seen it, the library holding no couple with a band. A defect to fix with a test of its class
   (CHECKLIST 7): each person's cut plan spending, plan year by plan year, their share of the household's.
