# After 7t: what the deep review found, the decisive test, and what goes to the maintainer (27 Sep)

**For the maintainer. Nothing here is registered or launched.** Every figure comes from a committed results file, and
each carries its grade. 7t itself is recorded in PLAN.md's ledger (27 Sep 01:46 UK). The second deep review's receipt
is in deep-review-log.md (27 Sep 02:07 UK).

## What 7t found

By the registered rule, four of the six suspected causes each removed the reader's harm on S126 and bridge 4
(results-7t.txt, grade B for each verdict, grade C between them):
- the one-pot learner (L);
- the weights known exactly (the oracle, O, a bound);
- both with five worlds (5L);
- the switch margin at 0 (M0).

The other two did not:
- one policy for every world (J) was partial;
- five worlds alone did nothing.

By the unconditional interval, L and 5L are partial: they leave 15 and 14 lost paths with none saved
(results-7t-unconditional.txt).

## What the deep review says it means (grade C, one seed)

**The mechanism is the forward chooser's switch margin, not the tables' level.**
- **The tables' level is close to right.** In the bad world the reader's tables read its realised survival within 1.54
  points on S126 and 0.45 on bridge 4 (results-7t.txt).
- **Two tiers usually tie within the margin.** The tables are solved as if switching were free, so two tiers' values
  differ by about one year's exposure, well inside the chooser's 0.001 margin (solve.js SWITCH_MARGIN).
- **The margin then holds the opening tier.** The chooser starts in the plan's tier and applies that margin every year,
  so it keeps whatever tier it opened in for decades:
  - 7t's off makes 0.03 pension switches a path on S126 and 0.04 on bridge 4;
  - the reader makes 0.33 and 0.45 (results-7t-deep.txt).
- **With the reader, the early de-risk falls inside the margin.** The reader's accurate bridge read shrinks the gain from
  de-risking in year 0 below the margin, so it keeps the plan's tier. Its risk step in years 0 to 5 on deep-bad-world
  paths is -0.18 on S126 and -0.55 on bridge 4, where off's is -2.00. That early exposure is where its lost paths come
  from.
- **The late re-risking is a symptom.** 7t's items 15 and 16 found it, but the cause is the early exposure the margin
  holds.

**At margin 0 the reader makes no difference on S126.** The reader and off become the same policy path for path, and 13
of the reader's 42 lost paths there are paths off itself loses at margin 0 (results-7t-vs-product.txt). So part of M0's
"cure" is off made safe by the margin.

**Margin 0 has costs.**
- **Tier churn.** Pension switches rise to 10.52 a path on S126 and 10.02 on bridge 4. 47% to 48% are reversed within
  three years (results-7t-deep.txt).
- **Noise where a table has no signal.** On S360, off's flat table (0.8 read against 34.6 simulated) sends margin 0 two
  tiers down, and it loses 520 paths (results-7t-vs-product.txt). With the reader it does not.
- **Estate, not survival.** Its whole-score gain against off comes as estate while survival falls: S126 survival -0.175,
  estate +0.499 (results-7t-deep.txt).

**One policy for every world (J) matters once the margin stops hiding it.** At the product's margin J changes nothing on
S126 (0 saved, 0 lost). At margin 0 it cuts off's 14 lost paths to 2 (results-7t-vs-product.txt). So "five worlds does
nothing" and J's partial read were measured at a margin that hides small table changes.

**The deep review's candidate is the reader with J at margin 0 (READER+J/M0).** Against 7t's off, among the arms that keep
the reader's gains, it is best or level with the best non-oracle arm on every case, by survival and by the whole score
(results-7t-vs-product.txt). The learner alone, without the reader, survives better on both harmed cases (5 saved and 0
lost on S126, 18 and 1 on bridge 4), but it gives up the reader's gains elsewhere (S360 0 saved and 1 lost; share 0.95
17 saved and 0 lost, where the reader's arms save over 1,500).

READER+J/M0 against 7t's off:

| Case | Saved / lost | Whole score |
|---|---|---|
| S126 | 0 / 2 | +0.400 |
| bridge 4 | 11 / 5 | +0.435 |
| S360 | 899 / 0 | +12.847 |
| share 0.95 | 1691 / 0 | +23.618 |

It still churns: 9.01 and 9.40 pension switches a path on the harmed cases (results-7t-deep.txt).

**7t's off is not the shipped product.** It ran at 16 wealth points, with lambda held at S126's 0.0224 on every case.
The product runs 30 points (solve.js PRODUCT_BASELINE). On these households the tier above offers the same menu as 'auto',
because the pension already sits at its top tier (the ninetieth review).

## The decisive test proposed before 7u (7v, not registered)

**The question.** Is the reader's harm the margin holding a sub-margin near-tie (procrastination)? Or is it table noise,
a separate clairvoyance error, or a separate learning error?

**The design.** It runs at the product's settings (30 points, each household's own lambda) on the tuning seed 7002:
- **Arms:** the reader and the reader with J, each at margins 0.001 (today's), 3e-4, 1e-4 and 0, all on shared tables.
  Each margin is only a forward run. J at margin 0 is also run with the learner.
- **Cases:** 7t's five, plus the family pairs S172 planned at Medium Risk with the tier above on and off (O16's own setup) and S330 with five against
  three worlds (O21).
- **Reported:** switches, reversals, the opening tier, the whole score against the product, and the world lines.

**What each explanation predicts.**
- **Procrastination:** the whole score rises steadily as the margin falls, and the family pairs converge at 0.
- **Table noise:** a peak at a small positive margin.
- **A separate clairvoyance error:** J gains at every small margin.
- **A separate learning error:** the learner adds survival at J with margin 0.

**Cost.** About 7t's size, 6 to 7 hours on four cores, mostly forward runs. It needs:
- an audit mode for the margins;
- a reducer with planted checks;
- a prediction with the regimen's fields, reviewed and pushed;
- the smoke run and a preflight.

## 7u after it

If 7v supports it, 7u carries the candidate against the product as it ships, on 7e's panel and on a solver-blind broad
panel:
- **Arms:** the product, the fix alone (on the bridge households, the unmasking arm), and the reader with the fix.
- **Reading:** each household by the corrected whole-score rule, with the pooled floor in its summed unconditional form
  (O28).
- **Paths:** looks of 3,000 paths or more, and about 8,000 or more where no gain is expected (O27).
- **Households:** the panel includes flat-table and low-survival ones, where margin 0 follows noise.

## What the maintainer is asked

1. **Run 7v before 7u?** The deep review recommends it. Until it is answered it would stop F2, 7q, 7n, 8b, the 'auto'
   re-tests and any default change.
2. **Is the churn acceptable advice?** Margin 0 means about 9 to 10 pension-tier changes over a retirement, about half
   reversed within three years; the margin was built to stop that. The principled alternative is to solve with the
   held tier as part of the state, so switching carries its own cost. It keeps switching rare and consistent, but it
   is not built and its cost is not measured.
3. **Is the estate trade acceptable?** Margin 0's gain by the default objective comes as estate while survival falls
   (S126: survival -0.175, estate +0.499). You described the default as "mostly survival". J at margin 0 largely avoids
   this (S126 survival -0.025, estate +0.462; results-7t-deep.txt).
4. **Still open from before:**
   - the corrected whole-score rule (drafts/whole-score-rule.md, rows 1-9);
   - 8f's reading;
   - whether the regimen's item 1 moves to the unconditional interval;
   - an "unlock enforcement" for plan-defaults.test.mjs to pin the rule's constants.
