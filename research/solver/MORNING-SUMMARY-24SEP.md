# Morning summary, Thursday 24 September (step 6: the product defaults)

Written overnight for the maintainer, in plain words. Every figure is from a results file named beside it,
and every test had its prediction written down before it ran. Where a prediction failed, it says so.

**DRAFT - sections marked PENDING are filled as the night's runs finish.**

---

## 1. The purpose test: does the solver find the best plan? (M18)

PENDING (`results-bestof.txt`).

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

Simulated on six households: PENDING (`reduce-m17.mjs`).

**Recommendation:** PENDING.

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

## 5. Open decisions for you

1. Minimum pot default (recommended: 1 year).
2. Raise cap default (recommended: 10%), and a minimum dislike of cuts when raises are blocked (M19).
3. Estate slider: 0% = weight 0.01 (M20).
4. The fix for failing futures (M17): PENDING.
5. S126's dead corner (#106): still open; the table reads 38.5% where the plan survives 99.8%.
6. Every library household holds its pension at the top tier (M21), so nothing has tested a cautious user.
   Recommended: a Phase 4 diagnostic at Medium tiers.
7. Risk above the user's tier (M14): PENDING.

## 6. What changed in the plan overnight

- The plan was audited against its history. It had said two things were never measured when they had
  been (Richardson extrapolation, the raise weight), and one Phase 4 prediction contradicted the history.
  All corrected.
- 19 of the 192 overnight cells were already on file and were reused.
- New findings M16-M21.
