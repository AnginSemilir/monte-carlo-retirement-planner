# CARRY: the carry family's root-cause step, and the reader that scores its forecast for 7aw

The family (PLAN.md O38, O45, O121, O123): a derivation carrying records from another setting misses its 80% interval.
CARRY fits its carrying rule on O38, O45 and O121; 7aw is held out of the fit. Its forecast for 7aw was committed before
any 7aw unit finished (drafts/carry-forecast-7aw.md, 770cfb2). Since then the forecast's points and flips can be read
off two committed results files (results-7aj.txt, results-7aw.txt), so the read is protected not by blindness but by a
reader with no free choices (the deep review of 8 Oct 05:58 UK): the forecast's text stays fixed, each ambiguity is
resolved now by its literal reading with the alternative printed, and any outcome that turns on an ambiguity is EDGE
and void. Its plants run on synthetic traces; the prediction and the reader are committed; then it reads once.

## The reader's gate (CHECKLIST item 3: the two runs' saved files are reused for a new question)

Each refusal has its plant (the deep review of 8 Oct 05:58 UK, its item 2, as it lists them):

- **G1:** one stamp per run; the same code in both runs (6dfa9cfea59a); each audit stamp the sha256 of that run's audit;
  the two audits the same code once comment lines, the `W` line and each run's own name are set aside. Plant: a code
  line changed in one audit's copy - G1 must refuse. (Corrected before any read: the review's "differ only in W and
  comment lines" is not so - `diff audit-7aj.mjs audit-7aw.mjs` shows each audit's name in its error messages, output
  folder and variable, 7aj/7AJ/DIAG7AJ_OUT/diag7aj; reduce-carry.mjs maps each run's name to one token first.)
- **G2:** 50 units per run, each (household, arm) once and done, the same 25 households in both.
- **G3:** per (household, arm), the ran and joint lines equal across the runs once bequestWeight is removed. Plant: a
  minPot changed on one unit's ran line - G3 must refuse.
- **G4:** N 8000, Y 40 and seed 7002 in all 100 traces; each trace's survival its log's; the 50 saved/lost pairs
  recomputed from the traces equal both files' item-1 lines.
- **G5:** S120's shipping-default six fields bit for bit the same across the runs. Plant: one trace rotated by a path -
  G5 must refuse. (Corrected before any read: the review also asked that the statistic print departures, which a
  rotation cannot make - sum x is the four survival totals added and subtracted, and a rotation keeps each total - so
  the plant checks that the rotation moves paths both ways and widens the se, and G5 is what catches it.)
- **G2 and G4** carry plants too (CHECKLIST item 6): a unit missing, repeated or not done; a saved count off by one, a
  trace of another seed, one of a household's traces of another length.

## The statistic (the forecast's, verbatim)

- The standard error from the n-1 standard deviation. A departure needs |sum of x| at least 8 counted in integers (0.1
  point is exactly 8 of 8,000 paths, so floating point does not decide it) and |change| at least 2.58 se.
- Flips: the opening pair is [the tier at margin 0.001, the tier at margin 0] (audit-7aw.mjs), so the candidate's
  chosen tier is the second figure and its first is counterfactual. The reader prints which figure moved and marks
  EDGE an outcome that turns on a counterfactual figure. It re-derives the classes from results-7aj.txt and refuses
  if they are not the forecast's lists.

## Scoring

- F1 (bridge 4+cost's shipping default flips) at 0.55; F2 at 0.75 and F3 at 0.80, each held if there are no
  departures; F4 at 0.85, scored only if bridge 4+cost's first figure rises, else void. A Brier score over the scored.
- The causes of 7 Oct 22:06 UK, as a partition: OMIT held if no departures; SWITCH if every departure is on a flip;
  NARROW if every departure is on a HIGH-CHURN household and SWITCH does not hold; OTHER if any departure is on a
  household neither flipping nor HIGH-CHURN; departures split between flips and HIGH-CHURN leave SWITCH and NARROW
  unsettled. Deciding lines: `=> CARRY-<id> held|not|unsettled`.
- Reported, not scored: each arm's paired change from 0.01 to 0.02; O121's WEIGHT leg by the 11:42 criterion
  (`=> O121-WEIGHT`); each shipping-default unit's gap direction (O45); an exact sign test beside z.

## Item 2: O123's decisive test

7aj's traces re-scored at 0.02 with reduce-7aa.mjs wholeLeg (wb a config field of wholePaths), the policy held:
O123-REOPT predicts the fixed-policy least point lands inside 7aw's item 2 interval. Controls: each run's traces
reproduce its own item-2 lines. Plant: wb at 0.03 must move them.

## Stop until it reads

Fitting CARRY's rule on its three members without this forecast scored; reading CARRY's per-household changes or flips
before the reader's file exists; scaling any 0.01 record to 0.02.

## Registered

predictions/diag-carry.md (the reader reduce-carry.mjs; the derivation derive-carry.mjs, results-derive-carry.txt). Two
items: 1, CARRY's rule held out (F2 and F3, read literally, EDGE void); 2, O123's cause by the fixed-policy re-score. It
runs through the launcher (batch-carry.sh), zero cores, and its output is saved as results-carry.txt.
