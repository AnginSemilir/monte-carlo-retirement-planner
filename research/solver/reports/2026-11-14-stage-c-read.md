# Item 6's stage C, read (14 Nov): PASS, and couples on

## In plain words

Until now the solver could only plan for a couple whose money was split roughly evenly between the two of them, between
40% and 60% each. That was because it plans for each partner separately and then combines the two plans. It used to
assume each partner pays half the household's spending. When one partner holds most of the money, that assumption fails:
the partner with little money "runs out" on paper while the other has plenty.

The fix (`shareRule: 'pots'`) changes the split when the money sits outside 40% to 60%. Each partner then pays a share of
the spending in proportion to what they hold, kept between 5% and 95%; inside that range it is still half each.

Stage C was the registered test of that fix on couples who hold their money unevenly. It used 12 couples that none of the
solver's earlier work had used. Six of them are named in the app's own policy studies, which ran the app's rules alone.
Each couple was tested three ways, 36 cases in all:

- the elder partner holding 75% of the money;
- the elder partner holding 90%;
- an even 60/40 split, but with something the library never has: a final-salary (DB) pension, a large gain already
  sitting in the taxable account, or a state pension from 67.

Each case was set up so that the app's current rules keep the money lasting about 85 times in 100. The question was
whether the solver does better on every case, and never worse.

**On survival, the answer is yes on every one of the 36 cases.**

- Under the app's rules the money lasts about 85 times in 100. Under the solver it lasts between 89.5 and 99.1 times in
  100, depending on the case.
- Where the money is held unevenly, the solver keeps on average about 10.7 more couples in 100 solvent.
- On the cases with a DB pension, a large gain or a later state pension, it keeps about 9.9 more in 100.
- No case comes anywhere near the harm bar.

The old assumption, half the spending each, would have been badly wrong at 90/10. On those cases the money lasted 57 to
92 times in 100. On the same simulated markets that is below the app's own rules on 9 of the 12 couples, by up to 27
points. The new rule is what makes the solver safe for these couples.

**Not every measure improves on every couple.** Survival improves on every case, but:

- the typical pot left at the end is smaller on most uneven cases;
- lifetime tax is higher on 10 of the 36 cases, all of them on the youngest couples or those planning furthest ahead;
- spending is a little lower on 5 cases, all on the three oldest couples, who gain survival instead.

These are the trades the solver makes for keeping the money lasting. The details follow below.

**What this decides** (the registration, and the maintainer's ruling D97 (1)):

- the new share rule becomes the couples' default;
- couples can now use the solver when they hold 40% to 60% each, or when the older partner holds more than 60% and at
  most 90%, as long as the older partner is the one entered first, as "you";
- a couple whose younger partner holds more, whose older partner is entered second and holds more than 60%, or where
  one holds more than 90%, keeps the app's rules until a test of those reads. Inside 40% to 60% a couple runs whichever
  way round it is entered, as before.

The second reviewer found the reason for "entered first", described below. Every tested couple had the older partner
first. The guard therefore opens only for that case, which is what the registration's "for what the panel tested" allows.
The reviewer checks the change of default before it is made, and it reaches `main` only through the release gate (B1).

## The outcome

`registrations/couples-share.md`, seed 7022, read once on 14 Nov from the launch worktree at ce8ca278, stamp `code
7002a1fec94c audit 327661b4d2fc`, by `reduce-couples-share.mjs`. Its output whole is `results-couples-share.txt`.

The gate is fair:
- 36 units in every arm, one stamp, every unit at its registered paths, and each unit's arms on one plan;
- on the twelve units with a feature, CANDS and CANDH are the same path for path on CANDH's paths.

| part of the rule | result |
|---|---|
| 1. D34's harm rule on the 24 re-held units | none flagged |
| 2. the pooled gain over the 24 re-held units, 19,000 paths each | +10.682 points (95% +10.442 to +10.921): holds |
| 3. D34's harm rule on the 12 units with a feature, read apart | none flagged; their pooled change +9.930 points (+9.707 to +10.153) |

**OUTCOME: PASS.** No unit is flagged and the pooled gain's interval lies above 0.

- **By unit.** The candidate's gain over the app's rules runs from +4.6 points (S211-db) to +14.3 (S015-90). Every
  unit's interval lies above +4.28.
- **Lost paths.** At most 49 paths of 19,000 are lost on any unit (S155-75, against 1,501 saved).
- **D34 (4).** Eight comparisons fall below the 1-point rate of 0.90 at their realised discordance, and are named as
  D96 (2) ruled: S015-75, S015-90, S015-db, S043-90, S129-75, S237-75, S237-gain and S389-75, with rates from 0.848 to
  0.897. Each is discordant because the candidate saves 12 to 14 points of paths there, not because it is near neutral.
- **The solver's own model.** It agrees with the engine on survival on all 18,000 paths checked. The check compares
  survival only, not money.

## The reviewer at the read: PASS, six MINORs (`reviews/2026-11-14-read-couples-share.md`)

The reviewer confirmed the read was made once, by the rule as registered:
- every stamped file is unchanged between the registration, the launch and the read;
- all 108 logs carry the registered stamp and no outcome;
- re-running the reducer reproduces the results file byte for byte;
- the planted checks pass.

It recomputed every figure from the arrays. The corrections are made above: "99.1", not "99.2"; "9 of the 12", paired on
the same paths, not "10"; and the plain words on the panel, the share and the model check. Its other findings follow.

**Beside the outcome (its finding 4).** The pot, tax and spending figures the read prints are pooled means. By unit they
run differently:

- **The pot left.**
  - Its median is lower under the candidate on 20 of the 24 re-held units: the median ratio is 0.88, and S129-75's is
    0.59.
  - Capped at four times the opening pots it is about level.
  - Over all paths the lowest tenth is higher on all 36 units. Counted only on the paths both arms keep, the deep review
    finds it lower on 23 of 36.
- **Lifetime tax** is higher on 10 of the 36 units: every unit of S265, S291 and S129, and S183-75. On S291-75 it goes
  from £32,572 to £209,812.
- **Spending delivered** is lower on 5 of the 36 units, all on the three couples aged 68 and 65. The largest fall is
  -2.9% on S015-db.

So "never worse" holds for survival only. This is the shape the couples' read and its tier test found: a smaller pot on
the paths that end well off, most of it the lower-risk funds the solver holds (`results-couple-tiers.txt`).

**A limit for the D-line (its finding 5).**
- The twelve units with a feature were all held 60/40, where the share is half. So the share rule never acted on a couple
  with a DB pension, a gain or a later state pension.
- The share counts pots, not incomes.
- Every DB pension in the panel is the elder's.
- The least covered case is an uneven couple whose pension income sits with the partner holding fewer of the pots.

**The code has moved since the launch (its finding 6).** The identity check that answers it is below.

## The deep review (`reviews/2026-11-14-deep-couples-share.md`)

**The PASS is sound.**
- It recomputed the pooled figures with its own code.
- It is the size of gain the singles (+10.71) and the 60/40 couples (+10.01) showed.
- The pots' share carries it: +5.0 points over the half share at 75/25, and +20.7 at 90/10.
- No path in any arm falls in the capital gains bill's class (0 of 1.40 million).

**One part of the switch-on was held back: the older partner entered second.**
- The joint move weighs both people's estates at the first person's own weight (`src/solver/couple.js`, the joint move's
  value), and that weight is 0.02 of the first person's opening wealth.
- When the older partner is entered second and holds most of the money, the first person holds 10% to 40%. Their weight
  per pound of the household's money is then three to nine times what any tested couple ran.
- The guard therefore opens only where the elder is the first person (`src/couplesSwitch.js` `ELDER_FIRST`, pinned in the
  decided defaults).
- The same weight is 0.05 per household pound inside the band when the first person holds 40%: higher than the 60/40
  couples' 0.033, though less so. It is a lead for the test below, not changed here; the band is the maintainer's M4.

**What the couples' screens should say**, for the maintainer's work on the UI:
- the pot is smaller on most uneven couples, and about level once capped;
- tax is higher on the long-horizon couples;
- the oldest couples gain survival, not spending.

The progress strip's "your half" was no longer true at 90/10. It now reads "your part" and "your partner's part"
(`src/solveStatus.js`).

**Unexplained, and its one test.**
- Three things are unexplained:
  - the gain is 0.66 points smaller at 90/10 than at 75/25 on the same couples and paths;
  - the DB units gain least (S211-db +4.6);
  - on the two working couples the share rule changes little.
- The leading cause: each table's share is read from today's pots alone. It does not see each person's state pension, a
  DB pension or the contributions still to come.
- The one test, a share ensemble: each of ten units solved at fixed shares around the rule's, through `solveCouple`'s own
  `share`. EXPLORATORY, seed 7002, 4,000 paths, about 6 core-hours, its rule committed first.
  - If a share by means wins by more than D4's targets, it is built off in code with its own registered test.
  - If not, the pots' share stands, and the joint estate weight is the next lead.
- It is in the queue with the maintainer's word below.

## The identity: a couple's solve at the new defaults against the tested code

`results-couple-default-identity.txt` (EXPLORATORY; `couple-default-identity.mjs`), answering the reviewer's finding 6.

**What was compared.** Four of stage C's units, chosen to span the panel: S015-90 (68 and 65, the elder holding 90%),
S129-75 (56 and 53, 75%), S211-db (55 and 52, a DB pension, 60/40) and S389-gain (50 and 47, a gain, 60/40). Each was
solved three ways at the app's 45 points:
- the registered CANDS arm, as stage C's audit solves it, on the code stage C tested (the launch worktree, code
  7002a1fec94c);
- the same on today's code;
- the page's own route on today's code: the couples' default share rule, each person solved at the app's candidate with
  the tie-break in it, then the couple assembled.

**The result: the same on all four.** On every unit the three give both people's tables bit for bit and the same outcome
on every one of 500 paths: survival, pot, estate, spending delivered and tax.

**What it shows.**
- What has moved in the code since the launch does not move these couples' solves:
  - in `src/solver`, the limits per person and a stored solve restored split (f1b2b457);
  - in the app's settings, the speed mode.
- The tie-break in the app's candidate does not reach a couple (D95).
- The page solves a couple as the registered arm did.

## The reviewer on the change of default: FAIL, one fix (`reviews/2026-11-14-default-d99.md`)

**The blocking finding.** The new planner's coverage list still said "It solves for one person. A couple's plan keeps the
app's own rules." That is false for every couple the solver now runs. The list feeds the Details card and the
documentation, and nothing checked its words. It now follows the switch: it names the couples the solver plans for and
says any other keeps the app's rules, and the rollback build shows the old line (`couple-default.test.mjs` check 4, its
plant failing it).

**The minor findings, each answered in the same fix round:**
- **No check ran an uneven couple to the end in the page.** The harness's couple reference now solves on the couples'
  default share rule, and the 90/10 couple is solved to the end and checked against it bit for bit. That check first runs
  in B1's gate on this commit. Its plant `couplehalf`, a page solving the couple on the half share, is run alone before the
  merge; it must fail exactly that line, and the run is recorded.
- **A blank age broke a couple's cut.** A partner's age, the first person's age or the plan's end age left blank was read
  as nought, so that partner's half was solved from age 0, or with no horizon. The engine reads a blank as 40, as the
  first person's age, or as 100. The household's plan now carries the engine's reading wherever the plan's own would differ,
  and every plan that was already readable is unchanged. The test of its class: `couple-default.test.mjs` check 5, which
  compares 30 couples under seven kinds of blank or odd entry against the couple's own run. With the fix taken out, it
  fails.
- **Inside 40% to 60% a couple runs whichever way round it is entered.** The records now say "the elder entered second and
  holding more than 60%". When the first person holds 40%, the estate weight is 0.05 per household pound, above the 0.033
  the 60/40 couples ran. That is a lead for D100's stage A; the band is the maintainer's.
- **Two pieces of wording** a couple outside the guard could read:
  - the quick start no longer says every couple is worked out together;
  - the couples card no longer rounds a share onto the guard's edge: 90.4% shows as "just over 90%".
- **A couple's solve on a phone has not been measured.** It holds two tables in every part. This is recorded, and the
  measurement is in the queue.

**The reviewer again: PASS, two MINORs** (`reviews/2026-11-14-default-d99-2.md`). Every fix is in. The household's plan
moved none of 246 couples' plans: the library's 210 and stage C's 36. The two MINORs:
- **A partner entered second who would pass 120 before the plan ends gets a shorter table than the couple's horizon.**
  - The cut gives each person the couple's years from their own age, and a single plan's end age stops at 120.
  - The solve's figures then fail with the failure card. It is loud, and no figure is wrong.
  - It is rare: it needs an age gap wider than 120 less the end age. One case is 70 and 49 with an end age of 100. Another
    is a blank first age read as 40 beside a partner of 66, with an end age of 95.
  - It predates D99, but couples on make it reachable. Its fix, the guard keeping such a couple on the app's rules with a
    check of its class, goes with the next batch. D7's stage A enters one such couple.
- **The 90/10 check and its plant** were described as shown before they had run. They are corrected above, and the plant's
  run alone is recorded before the merge.

## What a PASS reaches, and what it does not

The panel's uneven units hold 75% and 90% with the elder entered first.

**Covered by inference**, as the registration names:
- holdings from 60% to 75%, between the band and the panel's 75% units;
- a couple uneven in some wrappers only, since the panel re-held every wrapper alike.

**Not covered, so these keep the app's rules:**
- the younger partner holding more;
- the elder entered second and holding more than 60% (inside 40% to 60% either order runs, the maintainer's band);
- the elder holding over 90%;
- equal ages outside the band.

**Not shown by this test:** the share rule on a couple with a DB pension, a gain or a later state pension, or with
incomes uneven in another way.

## Next

1. The reviewer on the change of default (D99).
2. B1's gate on the combined batch: batch 3, the speed mode and couples on. Then the release branch, CI and the merge
   (D92).
3. In the research queue, EXPLORATORY: the share ensemble (about 6 core-hours) when the cores are free after the gate,
   then the shortlist's wider read, the couples' tie rule and the allowance step (D97, D98).
