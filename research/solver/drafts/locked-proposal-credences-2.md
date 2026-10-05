# Proposal: the locked half of the credence improvements (for the maintainer's "unlock enforcement")

Written 5 Oct after the maintainer's "Yes" to building the unlocked parts and writing up the locked ones. The unlocked
parts are built (scorecard.mjs KIND BASE RATES and DISCRIMINATION lines; new-prediction.mjs's base-rate scaffold). Each
change below is to a locked file; none weakens a check - each closes a gap a review found.

## 1. Judged credences written before the derivation (check-prediction.mjs)

- **The gap:** the rule asks for a judged credence beside the derived one, and the scorecard compares them (O29's decisive
  check), but nothing checks the judged lines existed before the derivation was run. EDGE-SPLIT's judged lines were written
  after its derivation, said so, and still passed; a judgement anchored on the derivation tells the check nothing.
- **The change:** for a test committed from the unlock on, the commit that first adds its "- **Judged, item N:**" lines
  must be an ancestor of, and not the same as, the commit that first adds the derive line's output file
  (git log --diff-filter=A on both). A test whose judged lines arrive with or after the derivation is refused, unless it
  says "Judged: none" (the author declines to judge) - then the decisive check leaves it out.
- **Planted:** judged first (passes); both in one commit (refused); judged after (refused); "Judged: none" (passes, left out).

## 2. A base rate on every item (check-prediction.mjs)

- **The gap:** the template now asks for each item's base rate, but nothing requires it.
- **The change:** each item carries "- **Base rate, item N:** <p>"; the value is within 0.01 of a kind's rate in
  results-scorecard.txt's KIND BASE RATES line at the prediction's commit, or of the deep-review record's rate.
- **Planted:** missing (refused); a number not in the line (refused); a kind's rate (passes).

## 3. The credence check's own gaps (RULES.md limit 31; the plan-auditor's MINOR 1 of 5 Oct 11:37 UK)

- every item the Decision rule names has an "- **Item N:**" line (today an item with none goes unchecked);
- a repeated outcome on one line is refused (today checked at its last value and scored at its first);
- the point is the first number on the item's Point and interval line (today any number on it passes);
- the boundary is the ancestry of the unlock's commit, not the committer date (today a back-dated commit or a reused file
  name exempts a prediction);
- two mutation survivors fixed: planted cases for checkPredictionText's call to credenceProblems and for heldToCredence's
  uncommitted branch.

## 4. Deep-review causes settled by a registered result, not by the author (record-deep-review.mjs, scorecard.mjs, pre-tool.mjs)

- **The gap:** review-causes.md is written by the author, unprotected; a cause can be settled by judgement, or a settled line
  removed, and CAUSE CREDENCES ids are not tied to the causes nor their sum bounded (the plan-auditor's MINOR 3 of 11:37 UK).
- **The change:** a settlement line names a prediction whose results file prints a SHARES or OUTCOME line deciding it
  ("- <receipt time> | <id> | held|not | results-x.txt | <the line, quoted>"); scorecard.mjs refuses a line whose quote is not
  in that file. review-causes.md joins pre-tool.mjs PROTECTED as append-only. A receipt's CAUSE CREDENCES ids must each
  appear in the findings text before the CAUSE CREDENCES segment, and the credences of causes the review calls exclusive sum
  to at most 1.05.
- **Planted:** a settlement quoting a line not in its file (refused); a removed settled line (refused by the hook); an id
  not in the findings (refused); exclusive causes summing to 1.4 (refused).

## 5. The retro check's hyphenated names (RULES.md limit 29)

- **The change already proposed there:** check-plan.mjs's retro regex /^(\S+) \(/ and closes ordered by date, so ADOPT-PI's,
  COV-B-STEP's and HYB's successors' windows are whole (HYB's close had to restate five codes by hand).

## Not proposed

- No cap on credences, and no rule that a derived credence must equal the base rate: the base rate is a start, and the
  derivation says why it moves.
