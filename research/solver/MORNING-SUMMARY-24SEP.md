# Morning summary, Thursday 24 September (step 6: the product defaults)

Written overnight for the maintainer, in plain words. Every figure is from a results file named beside it,
and every test had its prediction written down before it ran. Where a prediction failed, it says so.

**DRAFT - sections marked PENDING are filled as the night's runs finish.**

---

## 1. The purpose test: does the solver find the best plan? (M18)

**Your test passes.** At 160 moments in 8 households' retirements (half of them on a knife-edge), the solver's
top six ideas were each played out on the same simulated markets, the best picked on half the markets and
measured on the other half. **At 159 of 160, no rival survived measurably better than the solver's own pick**;
on average the best rival survived 0.02 points *worse*. Chart: "Best Plan Test"
(https://claude.ai/artifact/Th7nNKELo3mi5j1yQCTVQi). `results-bestof.txt`.

- The solver's internal table runs 3-5 points optimistic (section 4), but it ranks moves correctly: moves it
  puts well behind do worse in simulation (ahead in 1 of 30).
- One small lean on the full score (estate, cuts, raises): in comfortable positions it holds a tier more
  caution than its own estate setting pays for. Ten of the 13 "beyond noise" cases are ties under 0.06 points.
- What it does not cover: a completely different strategy (that is Phase 4, against the app's best), and
  futures that are already failing (section 2).

## 2. What the plan does in bad markets, and the fix (M17)

**Today's solver behaves badly in futures that are going to fail.** In the two or three years before the
money runs out, it raises spending to 120% on 82-89% of failing paths and holds the riskiest tier allowed.

**Why:** the penalty for spending cuts is charged only while there is money. Running out ends the charges, so
spending more to run out sooner scores better than cutting. It is a flaw in the scoring, not in the
arithmetic.

**Two fixes, both built and tested, both off until you choose:**

| fix | a year with no money costs... | hopeless positions still raising | comfortable plans |
|---|---|---|---|
| today | nothing | 88% | - |
| **floor** | the same as a year at your floor | 13% (the rest are genuine ties) | 96% unchanged |
| zero | the same as a cut to nothing | 0.2% | about a fifth fewer raises |

**Simulated on six households** (`results-m17.txt`, same 3,000 markets as today's plan):

| on the four thin households | floor fix | zero fix |
|---|---|---|
| overspending in the last 3 years before running out | 82-89% of failing paths -> **6-11%** | -> 0-8% |
| survival | **up 0.2 to 0.9 points** (never down) | up 0 to 9.8 points |
| years with no money, per path | **down 20-40%** | down 40-90% |
| extra years below target, per path | 2 to 5 | 5 to 11 |

The two comfortable households did not move. The zero fix is really a different, much more cautious objective
("make the money last at almost any cost"); the floor fix is the targeted one.

**Recommendation: switch on the floor fix** (with the survival-weighted raise credit). It makes the year-by-year
plan sensible in bad markets and raises survival a little. Its price is more cutting in futures that are
struggling; the guardrail matching (K5), which sets the default dislike of cuts, runs after it and re-balances
the total amount cut.

## 3. The defaults

### Minimum end-of-life pot (K2)

| minimum pot | survival (median household) | plans never cut | unlucky tenth ends with |
|---|---|---|---|
| none | 99.7% | 71% | 4.5 years of spending |
| **1 year** | 99.6% | 70% | 5.7 years |
| 3 years | 99.3% | 68% | 6.8 years |
| 5 years | 98.5% | 66% | 7.8 years |

A minimum pot redefines survival as "never ran out AND ended with at least this much", so thin households
pay most: S070 goes 79.0 -> 77.6 -> 74.7 -> 72.4. The buffer is kept partly by cutting in bad years, not only
by raising less (that part of my prediction failed).

**Recommendation: 1 year.** It costs almost nothing and stops the plan aiming to end at zero. Wording (M8):
"before any tax on the pension at death".

### Raises above target (K3)

| raises | extra spending over retirement | survival | end pot |
|---|---|---|---|
| up to 20% (today) | full | - | - |
| **capped at 10%** | about half (49-60%) | the same (within 0.2) | higher |
| blocked | none | +0.1 to +0.4 at most | much higher |

**Recommendation: cap at 10%.** Half the extra spending, no survival cost.
**Warning (M19):** blocking raises for someone who says cuts barely bother them makes the solver cut 5% in
most years to build the estate (S390: 30 years below target). Blocking needs a minimum on the dislike of cuts.

### Estate priority (K4)

- **0% must not mean zero weight (M20).** With no estate credit the plan pays far more tax (S162: GBP88k of
  lifetime tax against GBP12k), because nothing then rewards a pound saved from tax. The slider's 0% should be
  a small weight (0.01), which changes nothing else measurable.
- Most of the slider's effect sits between weights 0.1 and 0.3; the top of the range is not found yet.
- At the heaviest setting tested, the estate comes first: spending falls to about target and survival drops
  up to 3 points (my prediction that survival never falls was wrong).

**Recommendation:** default at the low end (0.01-0.03, which is today's behaviour); the slider's full map
needs one more sweep above 0.3.

## 4. Numbers you can and cannot trust (M16)

The survival rate the app shows comes from simulating the plan, so it is accurate for that plan. The
solver's internal table is 3-5 points too hopeful in the middle of the range (published chart: "Survival
Forecast Calibration"), so it must never be shown as a number - which is already the rule.

## 4b. Phase 4's panel cannot be drawn as written (stopped, for you)

Phase 4 needs 40 held-out households where the app's own best plan survives 75-95%, so the two sides can
differ. **Only 1 of 158 candidates lands there** (`results-p4-select.txt`): the library's households are either
safe (53 at 99-100%) or thin (70 below 75%), and every FIRE household retiring at 52 is below 50% (median 14%).
My prediction (half to two thirds in the band) was drawn from the tuning 41, which were themselves picked for
their survival - that was the mistake.

| option | what it does | households available |
|---|---|---|
| widen the band to 50-98% | takes the library as it is | 44 (no FIRE) |
| **land each household** | set each one's spending target so the app's plan survives about 85%, keeping its wealth, pots and ages | all of them, both cohorts |
| redefine FIRE | retire at 55 or 57 instead of 52 | unknown until run |

**Recommendation: land each household at about 85%.** It keeps the point of the band (survival can move either
way) without testing only the households the library happens to contain; the write-up would call them landed
households. It costs minutes to run.

## 5. Open decisions for you

1. Minimum pot default (recommended: 1 year).
2. Raise cap default (recommended: 10%), and a minimum dislike of cuts when raises are blocked (M19).
3. Estate slider: 0% = weight 0.01 (M20).
4. The fix for failing futures (M17): recommended - the floor fix, on.
5. S126's dead corner (#106): still open; the table reads 38.5% where the plan survives 99.8%.
6. Every library household holds its pension at the top tier (M21), so nothing has tested a cautious user.
   Recommended: a Phase 4 diagnostic at Medium tiers.
7. Risk above the user's tier (M14): PENDING.
8. Phase 4's panel (section 4b): recommended - land each household at about 85%.

## 6. What changed in the plan overnight

- The plan was audited against its history. It had said two things were never measured when they had
  been (Richardson extrapolation, the raise weight), and one Phase 4 prediction contradicted the history.
  All corrected.
- 19 of the 192 overnight cells were already on file and were reused.
- New findings M16-M21.
