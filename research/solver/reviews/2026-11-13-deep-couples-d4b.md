# Deep review after a confirmatory read: the couples' registered re-run (`couples-d4b.md`, seed 7021), read 13 Nov

Subject: what the couples' read (`results-couples-d4b.txt`, PASS; the reviewer at the read,
`reviews/2026-11-13-read-couples-d4b.md`, PASS with seven MINORs) says together with the singles' Phase 4, the tier
test, item 13's read and the couples' sweep check, for the maintainer's decision on couples under the switch.

Read: STATE.md whole, CHECKLIST.md, the registration and its amendment 1 with its review, the results file whole, the
read's review, PART-D.md, DECISIONS-PENDING.md, ITEM7-POT.md, `results-couple-sweep.txt`, STATE.md's blocks for Phase 4,
the tier test and item 13, `reviews/2026-10-28-deep-phase4.md`; `src/solver/couple.js` whole, `solve.js` (the estate
term l.597-608, `chooseAction`'s tie rules l.1902-1965), `model.js` `step` (the couple's year l.461-592), the engine's
capital gains settlement and failure flag (`src/App.jsx` l.2678-2711), `audit-phase4.mjs` `runPath`.

Ran (EXPLORATORY; nothing written to the repository but this file): reads of the 200 stored chunks of the registered
run and the panel's plans as every arm runs them (opening wealth by person; no solve). No path of seed 7021 was run, no
solve was made, `d4-backup` and D4 were not opened. Scripts in the session scratchpad (`deep/load.cjs`, `lost.cjs`,
`y23.cjs`, `estate.cjs`, `flows.cjs`, `more.cjs`, `ship.cjs`, `late.cjs`, `plans.mjs`). Every figure below that is not
in the results file or the read's review is from them: a post hoc read of units already read once by the registered
rule, so a lead, not a result.

## Summary

- The PASS is sound for what the rule asks: survival and spending delivered over the whole plan. +10.0 points on 40
  held-out couples, every couple between +7.3 and +14.2, scored by the engine. It is the singles' Phase 4 again, figure
  for figure, so the couples' rollout carries the singles' policy to two people without losing it.
- It does not show "better outcomes" on the estate as a plain reader would take the word, and the read prints no
  estate figure. As the solver values the pot (capped at four times the opening wealth) the couples are level with the
  app's rules; above that cap the pot is far smaller: about half at the median for the younger cohort.
- The leading cause of the pot's fall is the lower-risk tiers the solver holds, not the tie giveaway above the cap.
  Extra tax and extra spending together are about 2% of the gap on the younger couples. So the tie-break would not
  bring the pot back, and as built it does not reach a couple's joint move at all.
- The three younger couples' paths lost in plan year 23 are not households out of money. They are short by a few
  hundred pounds in the second person's last year before pension access, with millions in the first person's open
  pension. By the code, a capital gains bill in the second person's name that the engine's year will not let the first
  person's money pay. Small (0.015 and 0.030 points pooled), and an engine rule, not the candidate's.
- The one test: the couples' tier test (the candidate with consent to change risk withdrawn, beside the candidate and
  the app's rules), eight panel couples, seed 7002, about five core-hours.

## 1. What the result says, and what it does not

**It says.**
- The candidate for couples, executed by the app's engine, keeps more couples solvent than the app's rules and
  delivers more spending over the plan: A1 +10.008 and +9.927 points, A2 +6.485% and +7.618%, no flag, the smallest
  couple +7.30 (S311F at W0.01). The gate is fair; amendment 1 touches S293 alone and S293 reads like its cohort.
- It matches the singles. Phase 4: A1 +10.710 and +10.787, A2 +6.549% and +7.464%, S1 +0.830 and +0.973. Couples:
  +10.008 and +9.927, +6.485% and +7.618%, +0.875 and +1.000. The shape beside it matches too: the early cut (years 0
  to 4 at 92.5% of target against the app's 98.2%; singles 90.7% against 98.5% on the tier test's panel), the years at
  the floor (9.8 against 5.1; singles 8.8 against 5.8), nine-tenths of the gain being solving at all (SHIPC 93.62%,
  CANDC 94.49% on the first 1,000 paths).
- The minimum pot is in it, as for singles. Failures in the last year are 3.32 points of the app's rules' survival
  and 1.13 of CANDC's at W0.02 (below the minimum pot with every year's spending met: 2.84 and 0.95). So about 2.2 of
  A1's 10.0 points are a pot the app's rules are scored on and never steer to (singles: 2.98 of 10.71).
- The couples' sweep check (+0.33 points, mostly S059) and item 13's read (no path's survival changes) take nothing
  from it: neither is in a registered arm's comparison with the app's rules beyond the sweep the tables were solved
  with.

**It does not say.**
- Anything about the estate. The rule has no estate item and the reducer prints none. Section 2 (b) reads it from the
  chunks.
- How much of the gain is the tier changes, the sweep, or the joint move. No arm isolates any of them. S1 is the same
  as the singles', so nothing shows the split or the shared bridge adding survival of its own; nothing shows them
  costing any either.
- The gain on a plan as entered. Every couple is landed where the app's rules survive 85%, holds the app's default top
  tiers, and holds its pots 60/40 with each table on half the spending. A couple who chose lower risk, who withholds
  consent, or who sits outside 40% to 60% (M4) is not in the panel.
- Harm at D34's rates. Every couple-weight stopped at 5,000 paths; the per-couple rule at 19,000 was never exercised.
  With the smallest gain at +7.3 points that is not a worry for survival.
- That the tables' own forecast for a couple is right. The run scores survival by the engine, and the rollout beside
  it is the same policy in the exact model. Neither compares what the two tables read at year 0 with simulation
  (section 2 (c)).

## 2. What is unexplained, and its leading cause

### (b) The estate's fall: the tiers held, not the tie above the cap

This is the largest thing beside the PASS, so it comes first. What the chunks show at W0.02 (`estate.cjs`,
`flows.cjs`):

| | all 40 | library 20 | younger 20 |
|---|---|---|---|
| mean pot, CANDC over APP, pooled | 0.18 | 0.37 | 0.16 |
| median pot, mean of the couples' ratios | 0.73 | 0.95 | 0.52 |
| the lowest tenth's pot higher under CANDC, couples | 40 of 40 | 20 | 20 |
| mean pot capped at 4 x opening wealth, mean of ratios (pooled) | 1.03 (0.99) | 1.05 (0.98) | 1.00 (1.00) |
| paths ending above the cap, APP / CANDC | 48% / 45% | 32% / 30% | 65% / 59% |
| lifetime tax, CANDC over APP, pooled | 1.17 | 0.68 | 1.34 |

- **Where the solver has a view, nothing is lost.** Capped as `solve.js` scores it, the couples' pot is the app's
  rules' or a little above, and the unlucky tenth ends with more on every couple. The whole fall is above the cap.
- **Above the cap it is large and it is not tax or spending.** On the paths both arms survive and the app's rules end
  above the cap, CANDC's pot is a third of APP's on the younger couples (the median path ratio, mean over couples 0.33)
  and two-thirds on the library's (0.66). Set beside that gap, what CANDC pays out more (spending delivered plus
  lifetime tax, undiscounted) is 2% of the median gap on the younger couples and 0.4% by means; on the library couples
  CANDC pays out less than APP. S309F: the median gap is £57.6m, the extra tax £144,000. No compounding turns 2% into
  the gap.
- **So the leading cause is the growth forgone on lower-risk tiers held for decades.** Evidence for: the arithmetic
  above leaves nothing else that large; the product's settings, which also move tiers, give the same pot through the
  same joint move (first 1,000 paths, younger cohort: median pot SHIPC 0.54, CANDC 0.49 of APP's; library 0.99 and
  0.96); the singles show it (Phase 4's deep review: S328F two tiers down for 56 of 61 years from age 37; the tier
  test: the tiers are 47% of the gain; the dial's read: the retirees' pension and ISA 25% in equities in years 1 to 5); a gap of 0.42 at the median over
  60 years is about 1.4% a year, the distance from High Risk (4.97%) to Medium/Low (3.55%). Evidence against: the
  chunks store no tier, so it is inferred, not seen; and it is APP's far right tail (means of over £100m from
  £2.4m) that makes the mean ratio what it is, which no couple would miss.
- **The tie giveaway is real too, but it is the tax line, not the pot.** Lifetime tax is many times APP's where APP
  pays almost none (S317F £1,981 to £195,952), and on those couples all of it falls on paths that end above the cap
  (S317F: £349,000 on those, £1,000 at or below, where APP pays £1,000 too). It is under SHIPC as well (S317F £87,000,
  S341F £170,000, S305F £228,000 on the first 1,000 paths), so it is not only the candidate's HR menu. On the larger
  younger couples the candidate adds to it (S319F, S323F, S347F: two to four times SHIPC's). Whether the split adds its own
  share the chunks cannot say.
- **The tie-break as built cannot reach a couple's path.** `chooseAction` applies `tieAboveCap` to the move it
  returns (solve.js l.1941-1951) and leaves the scores as they were. `rankFor` calls it for those scores and discards
  the return (couple.js l.536-540), taking each person's two highest. `chooseJoint` then keeps the first candidate with
  the strictly highest score (l.659), splits tried from 0 upward, with no tie rule of any kind: not the least tax, not
  even the larger estate that a single's chooser falls back on. STATE.md already records the consequence ("a couple's
  paths the same with the tie-break on each person's table"). And where it fired it would test each person's wealth
  against that person's own cap, not the household's.
- **One wrinkle in the joint score, not a cause.** It weighs both people's estates by the first person's weight
  (`A.wB`, l.372 and l.504: 0.02 over the first person's opening wealth). At 60/40 that is 0.033 per pound of household
  opening wealth, and each person's own table uses its own. The weight a couple gets therefore moves with how the pots
  are split. It works against a smaller pot, so it explains nothing here; it matters for item 6's stage C, whose
  couples sit outside 40% to 60%.

### (a) The three younger couples' paths lost in plan year 23: a bill the other person's money may not pay

- **What they are** (`y23.cjs`). The younger cohort is 37 and 34, each retiring at 52. The first person's pension
  opens in plan year 21 and the second's in 24, so year 23 is the second person's last year before access. CANDC fails
  there on 29 paths at W0.02 and 60 at W0.01 (S307F 5 and 9, S309F 3 and 18, S311F 21 and 33), 28 and 56 of them paths
  the app's rules keep. On those paths the whole plan's unmet spending is a median £61 to £816 by couple and weight,
  against targets of £63,300 to £127,700; the household ends the plan with a median £4m to £16m; and the failing year
  is spent at 110% of target.
- **Leading cause.** The engine settles a person's capital gains bill from that person's cash, taxable account and
  ISA, then either person's cash, then that person's own pension (`App.jsx` l.2698-2702; `model.js` l.533-535 the
  same). It never reaches the other person's ISA, taxable account or pension. A second person whose accessible pots the
  year's draw has emptied, and whose pension is still locked, owes a bill nothing may pay; `unmetDemand > 1` with locked
  pension wealth is a pre-access gap and the path fails.
- **Evidence for.** By the code it is the only term left: in year 23 the first person's pension is open, the year's
  spending is covered across the two at every step, and none of these couples has a one-off cost then. The amounts are
  the size of a bill, not of a year's spending. It appears only on the three pension-heavy younger couples (85% of the
  pots in pensions) and its size follows the second person's taxable account: £7,600 at the start on S307F (median
  unmet £61 and £147), £19,200 on S309F and S311F (£331 to £816); S305F, the same shape with £3,600, has none. The
  rollout beside the engine agrees these paths fail (two of them are among S311F's first 500), as the model's same
  rule would.
- **Evidence against, and what is not shown.** No path was replayed, so the bill is inferred. Why every candidate of
  the joint move fails that year (it skips any that leaves unmet spending) is not shown either; gains carried from a
  sale the year before would do it, since they fall due whatever this year's move is. The shared-bridge read may be
  part of it: it treats the first person's ISA as able to meet the second person's needs, which the engine allows for
  spending and not for this bill.
- **Size and whose it is.** 0.015 and 0.030 points pooled; 0.42 and 0.66 on S311F, the couple with the smallest gain.
  It is the engine's rule, in every arm: failures before the last year with unmet spending under a tenth of a year's
  target and an end wealth above the opening wealth are 167 of 200,000 paths under the app's rules (85 in S371's cost
  year, 60 in the first person's last year before access, where no pension is open and the gap is real), 79 and 116
  under CANDC. The
  candidate does not add to the class; it moves it to a year where the household plainly has the money.
- **The rest of the lost paths** (`late.cjs`): 30 of 75 and 82 of 164 fail in the last year, 25 and 72 of them below
  the minimum pot with every year's spending met, ending at a median 0.50 and 0.74 of the pot. More at the lower estate
  weight, as one would expect of a policy that spends nearer the line.

### (c) Could the two tables' read overstate survival relative to the engine?

- **Not in the registered figures.** A1 is the engine's survival under the engine's own failure rule, the same in
  every arm. The joint move's split and cross-cover are things a couple can do. Nothing the tables read enters the
  score.
- **In a forecast read from the tables, possibly, and nothing measures it.** Three places. The joint read multiplies
  the two tables' survival, each solved on half the spending as if the split stays even. In a bridge year
  `shareBridge` takes the best transfer separately at every market node, a maximum inside the expectation, of money the
  engine never moves that way. And that shared money is assumed to meet any need of the receiver, where the engine's
  bill settlement does not (section (a)). Against them, the giver's open pension is not counted. D2.4's own test allows
  the year-0 read to sit within 10 points of simulation on its planted couple. The read has no year-0 table against
  simulation for the 40 couples. A gap there would be a lead, not a verdict (D2); it matters only if a couple's screen
  shows a table's figure and not the engine's run of the solved plan, as a single's does.

## 3. The one test

**The couples' tier test**: the candidate for couples with consent to change risk withdrawn, beside the candidate and
the app's rules. It is D39's test for singles, on the lever D3 already built and tested for a couple (each table one
tier pair), so it opens no new variant. EXPLORATORY, deciding nothing, its rule committed before launch. Not launched.

- **Arms:** APP; CANDC as registered; CANDC-NC, the same with `riskConsent: false` in each person's aims (the solve
  then runs on the whole menu, D74). Estate weight 0.02.
- **Couples:** eight of the panel, four younger and four library, chosen for their pot shapes: S309F and S311F
  (pension-heavy, the year-23 couples), S317F (ISA-heavy, tax 99 times APP's), S323F; S189, S293, S011, S083.
- **Seed and paths:** 7002, its first 4,000 paths a unit, paired.
- **Cost:** from this run's recorded times, the solves 0.33 core-hours an arm and the engine 1.5 at 4,000 paths: about
  3.7 core-hours for the two solver arms, more if the whole-menu solve is slower; allow five, an hour and a half on
  four free cores.
- **Stored beside each path,** so the read sees what these chunks cannot: each person's tier held by year, and the
  year's tax with whether the household was above the cap that year.
- **How it is read.**
  1. The pot: each couple's median pot under CANDC-NC and under CANDC, over APP's, on the paths all three survive.
     The tiers are the cause if on the four younger couples CANDC-NC's median is 0.85 of APP's or more with CANDC's
     near 0.5. They are not if it is under 0.65. Between, both, reported as such.
  2. The tiers' share of the gain, (CANDC less CANDC-NC) over (CANDC less APP), pooled, its interval by path; the
     singles' 47.5% beside it. The pooled standard error is about 0.2 points.
  3. Beside: CANDC-NC's lifetime tax against APP's on the paths ending above the cap. With the tiers out of it, that
     sizes what a tie rule in the joint move could save.
- **What each outcome changes.**
  - The tiers are the cause: nothing in the solver needs to change before couples are switched on. The smaller pot is
    the price of the survival the tier changes buy, and a couple already controls it by consent and the tier lock. The
    couples' screens (D5) then owe the couple the pot beside the survival figure, and what withholding consent does to
    each. A tie rule for couples becomes a tax matter, sized by part 3.
  - Not the tiers: the fall is in what the joint move draws and spends, which the arithmetic here says is unlikely.
    Then a tie rule in the joint move is built and read before couples run the candidate, and they keep the app's
    rules meanwhile.
  - Either way part 2 gives the figure a couple who withholds consent should be shown, where today there is none.

The year-23 lead needs no arm: one replay of S311F's year 23 on a path of seed 7002 that fails there with a small
shortfall, printing the year's `unmetCgt`, settles whether it is the bill. It can ride on the same solve.

## 4. Open items the result moves

- **D90 (1), the tie-break's port after this read.** As built it changes no couple's path (section 2 (b)). Porting it
  into the candidate serves singles only. For couples the remedy is a rule in `chooseJoint` over the joint candidates,
  with a wider shortlist than each person's two highest, and its own read: a new build, the maintainer's (D80, D81
  (F)).
- **A new item for the register, the engine's.** A person's capital gains bill is not payable from the other
  person's ISA, taxable account or pension, and an unpaid bill of any size above a pound fails the path. Measured so
  far: 29 and 60 of 200,000 paths under CANDC in plan year 23 on three couples, inferred, not replayed. It is a
  product-path rule, so it belongs with Step 1's class: a test of the class first, then the fix.
- **Item 6's stage C.** The joint score's estate weight follows the first person's share of the pots; say so in its
  rule, or its couples outside 40% to 60% are compared at weights that differ with the split.
- **FD-RAISE (closed, reported).** Part C shows no raise on a path heading for ruin. The year-23 paths take 110% in
  the year they fail; the couples' screens inherit the rule and it should hold there too.
- **T-GAPS.** No couples' line exists. If D5 shows any figure read from the two tables, the year-0 read against
  simulation on these 40 is the first check; if it shows only the engine's run, none is needed.
- **The harvest ceiling's lead** (lower tax and larger pot on paths above the cap, S328F and S340F): the same region
  the couples' tax excess sits in. Its test and this one read the same thing for singles and couples.

## 5. For the maintainer, before deciding

1. Survival and lifetime spending are better on every one of the 40 couples (+7.3 to +14.2 points), on held-out
   paths, scored by the engine: the same result as the singles'. It is the gain on plans stretched until the app's
   rules survive 85%, for couples at 60/40 in the default top-risk funds; about 2 of the 10 points are the minimum pot.
2. The price is early: the first five retired years at 92.5% of target against 98.2%, and 9.8 years at the floor
   against 5.1. The singles' shape; the dial is the lever.
3. The pot left is level where the solver values it (up to four times the opening wealth) and better in the worst
   tenth on every couple, but about half at the median for the younger couples and a tenth to a fifth at the mean. That
   is very probably the lower-risk funds the solver holds for decades, not wasted tax; the tie-break will not bring it
   back. One short test (section 3) would settle it.
4. Tax is 1.34 times the app's rules' on the younger couples (0.68 on the library's), and up to £250,000 where
   the app's rules pay almost none, all on paths that end rich. The tie-break built for singles does not reach a
   couple's joint move, so switching couples on ships that as it is.
5. A small defect of the engine, not the candidate: a few dozen paths on three couples fail for a bill of a few
   hundred pounds that the first person's open pension could pay. Worth a test and a fix before a couple's screen shows
   a failure there.
