# Item 6's stage C, read (14 Nov): PASS

## In plain words

Until now the solver could only plan for a couple whose money was split roughly evenly between the two of them, between
40% and 60% each. That was because it plans for each partner separately and then combines the two plans. It used to
assume each partner pays half the household's spending. When one partner holds most of the money, that assumption fails:
the partner with little money "runs out" on paper while the other has plenty.

The fix (`shareRule: 'pots'`) gives each partner a share of the spending in proportion to what they hold. Stage C was the
registered test of that fix on couples who hold their money unevenly. It used 12 couples held out from all earlier work,
each tested three ways (36 cases in all):

- the elder partner holding 75% of the money;
- the elder partner holding 90%;
- an even 60/40 split, but with something the library never has: a final-salary (DB) pension, a large gain already
  sitting in the taxable account, or a state pension from 67.

Each case was set up so that the app's current rules keep the money lasting about 85 times in 100. The question was
whether the solver does better on every case, and never worse.

**The answer is yes, on every one of the 36 cases.** Under the app's rules about 85 in 100 couples' money lasts. Under the
solver it is between 89.5 and 99.2 in 100, depending on the case. On average the solver keeps about 10.7 more couples in
100 solvent where the money is held unevenly, and about 9.9 more on the cases with a DB pension, a large gain or a later
state pension. No case comes anywhere near the harm bar.

The old assumption, half the spending each, would have been badly wrong at 90/10. On those cases the money lasted 57 to
92 times in 100. That is below the app's own rules on 10 of the 12 couples, by up to 27 points. The new rule is what
makes the solver safe for these couples.

**What this decides** (the registration, and the maintainer's ruling D97 (1)):

- the new share rule becomes the couples' default;
- couples whose elder partner holds more than 60% and at most 90% of the money can now use the solver, as can couples
  inside 40% to 60%;
- a couple whose younger partner holds more, or where either holds more than 90%, keeps the app's rules until a test
  of those reads.

The reviewer checks the change of default before it is made, and it reaches `main` only through the release gate (B1).

## The outcome

`registrations/couples-share.md`, seed 7022, read once on 14 Nov from the launch worktree at ce8ca278, its stamp `code
7002a1fec94c audit 327661b4d2fc`, by `reduce-couples-share.mjs`. Its output whole is `results-couples-share.txt`. The gate
is fair: 36 units in every arm, one stamp, every unit at its registered paths, and each unit's arms on one plan. On the
twelve units with a feature, CANDS and CANDH are the same path for path on CANDH's paths.

| part of the rule | result |
|---|---|
| 1. D34's harm rule on the 24 re-held units | none flagged |
| 2. the pooled gain over the 24 re-held units, 19,000 paths each | +10.682 points (95% +10.442 to +10.921): holds |
| 3. D34's harm rule on the 12 units with a feature, read apart | none flagged; their pooled change +9.930 points (+9.707 to +10.153) |

**OUTCOME: PASS.** No unit is flagged and the pooled gain's interval lies above 0.

By unit, the candidate's gain over the app's rules runs from +4.6 points (S211-db) to +14.3 (S015-90). At most 49 paths
of 19,000 are lost on any unit (S155-75, against 1,501 saved).

D34 (4): eight comparisons fall below the 1-point rate of 0.90 at their realised discordance, and are named as D96 (2)
ruled. They are S015-75, S015-90, S015-db, S043-90, S129-75, S237-75, S237-gain and S389-75, with rates from 0.848 to
0.897. Each is discordant because the candidate saves 12 to 14 points of paths there, not because it is near neutral.

The solver's own model of a couple's path agrees with the engine on all 18,000 paths checked.

## Beside the rule, deciding nothing

- **The share rule's own effect.** CANDS less CANDH, the same candidate at half shares, on the re-held units' first
  1,000 paths: +12.867 points pooled (+11.946 to +13.787).
  - At 90/10 half shares fail badly on most couples, CANDS gaining +11.8 to +38.3 points over them.
  - On the two youngest couples (S265 and S291, aged 45 and 42 and working to 60) the rule changes little: -0.9 to +2.6
    points.
  - Half shares at 90/10 survive from 57.30% (S103-90) to 91.60% (S291-90), against the app's rules at about 85% there.
- **Spending delivered** over the re-held units, CANDS less APP: +4.024% of APP's (+3.992 to +4.055).
- **The pot left is smaller, and lifetime tax lower.**
  - The mean pot left on the re-held units: APP £7,552,317, CANDS £3,017,579. On the units with a feature: £6,934,109 and
    £3,049,652.
  - Lifetime tax on the re-held units: £144,075 and £113,220. On the units with a feature: £184,035 and £129,710.
  - These are means, so they are dominated by the paths that end rich. The couples' read and its tier test found the same
    shape: a smaller pot on the upper paths, most of it the lower-risk funds the solver holds (`results-couple-tiers.txt`).
  - Not decomposed here.
- **MPAA ages.** On seven units a solver arm's own MPAA ages differed from arm A's, which it took (the report D94
  adopted), as the registration expected from the plans: S015-db, S183-75, S265-75, S265-90, S265-spa67, S291-75 and
  S291-90.
- **Speed.** The median solve took 136 s under CANDS and 97 s under CANDH. The engine ran 153.8 ms a path under CANDS.
  All runs were on one host type.

## What a PASS reaches, and what it does not

The panel's uneven units hold 75% and 90% with the elder. The registration's limits, which go into the D-line:

- holdings from 60% to 75% are covered by inference, between the band and the panel's 75% units;
- a couple uneven in some wrappers only is also covered by inference, since the panel re-holds every wrapper alike;
- a couple whose younger partner holds more, or where either holds over 90%, is not covered;
- every library couple's first person is the elder by three years. The guard therefore reads the elder by age, and
  equal ages, with no elder, keep the 40% to 60% band.

## Next

1. The reviewer at the read (`reviews/2026-11-14-read-couples-share.md`), then the deep review.
2. The change of default in one commit with the D-line naming this run:
   - `shareRule: 'pots'` for the app's couples;
   - the guard on the elder's share;
   - couples on under the opt-in (D97 (1));
   - its test, with the reviewer on the change of default.
3. B1's gate on the combined batch: batch 3, the speed mode and couples on. Then the release branch, CI and the merge
   (D92).
