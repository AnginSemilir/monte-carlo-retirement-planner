# Where running this project with an LLM has fallen short

As of 20 Oct 2026, for the external review. The period covered is 24 Sep to 20 Oct 2026, the life of the solver research
regimen (`RULES.md`, `PLAN.md`). The research was run by an LLM agent under the maintainer's direction; its reviewers (the
plan-auditor and the deep reviewer) are LLM agents too.

Every figure below comes from a committed file in this directory, and the command that reproduces it is in the last section.
Examples marked "20 Oct session" are from the agent's own work that day; each also appears in a committed record, named
beside it.

## Summary

Seven failure modes recur in the records:

| # | Failure mode | Headline evidence |
| --- | --- | --- |
| 1 | Claiming more than the evidence supports | 47 of 251 tagged blocking findings are overclaims; 17 more are wrong figures and 8 wrong claims about code |
| 2 | Dropping items when condensing long documents | 38 "relook" and 17 "stale" blocking findings; the same adoption slip recurred after it was written down as a lesson |
| 3 | Tests that can pass with the fault present | "design" is the largest lesson code (50 of 210) and ties for the most blocking findings (47) |
| 4 | Fixing a symptom locally, without searching for the pattern | a numerical bug survived a full test regimen and was found by accident, in research and in product code |
| 5 | Poorly calibrated forecasts, worst on "which cause" | overall Brier 0.217 against 0.238 for the base rate; attribution 0.255 against 0.261 |
| 6 | Drifting from standing decisions | 26 blocking findings for decisions that contradict a ruling or are ill-posed |
| 7 | Safeguards now cost more than the work they protect | 635 commits touch PLAN.md against 61 that touch the solver code; 282 of 589 audits failed |

## 1. Claiming more than the evidence supports

This is the most common reason the plan-auditor blocks a change, and its share is rising.

- **Counts.** 47 of the 251 tagged blocking findings in `review-log.md` are overclaims (`[T:overclaim]`), tied first with
  design faults. In the last 5 test closes, overclaims are 9 of 32 primary blocking findings (`triggers.mjs`).
- **Related slips.** 17 blocking findings are figures that do not match their cited output (`[T:figure]`). 8 are claims
  about the code that the code contradicts (`[T:code]`). These are why `check-plan.mjs` now refuses any figure in the plan
  that is not in a cited results file.
- **Example.** A gate was recorded as met before its evidence existed, twice (`lessons.md`, the ADOPT-PI close: "COV-B-STEP's
  registration was marked met before its evidence existed, twice").
- **Example, 20 Oct session.** The plan stated that S128's two references were the same, where the design review had said
  this was not checked (`review-log.md`, the FAIL of 20 Oct 18:48 UK, BLOCKING 1).

## 2. Dropping items when condensing long documents

When a review's findings are carried into the plan, some are lost, and rows that depend on a change are left unchanged.

- **Counts.** 38 blocking findings are rows left unmoved by an item the change moved (`[T:relook]`). 17 are text the change
  itself contradicts (`[T:stale]`).
- **It recurs after being written down.** The REF-STEP close recorded that an adoption had dropped a review's unmasking flag,
  its register flag and a premise (`lessons.md` l.352). The next adoption, on 20 Oct, dropped the same kinds of items. It
  failed the audit twice before it passed (`review-log.md`: 20 Oct 18:48 UK, BLOCKINGs 2 and 3; and the FAIL on plan
  da6655c200).
- **The same summary slip twice.** O189 records a deep review's conditional S128 arm dropped in a summary. The 18:48 FAIL
  found the same S128 condition dropped again.
- **Likely contributor (an inference, not measured).** The plan is 648,869 bytes against its 650,000-byte cap, and the rules
  add 66,608 bytes (`triggers.mjs`, "always-read bytes"). That is more than an LLM can read whole for each change, so each
  change works from partial reads and searches.

## 3. Tests that can pass with the fault present

The regimen requires every check to be shown failing on a planted fault (CHECKLIST item 6). Designs that miss this are
common.

- **Counts.** "design" is the largest code in `lessons.md` (50 of 210 lines) and ties for the most blocking findings (47).
- **Example.** PR31's gate test was judged not gate-ready at its first design review (`deep-review-log.md`, 20 Oct 13:40 UK)
  and needed revision and a second review (17:57 UK).
- **Example, 20 Oct session.** The extended `research/tests/reader-ru.test.mjs` took seven runs of about 25 minutes each.
  One failure was a real finding (the bug in section 4). Four came from checks placed where the fault could not act:
  - a planted fault at reads held at the reader's floor;
  - grid states where the relevant corners carry no weight;
  - reads where the fault's effect is far below any tolerance;
  - reads at the reader's bounds of 0 and 1.

  One came from a count threshold set arbitrarily. The final version and its result are in commit e7624ba
  (`results-reader-ru.txt`, 24 checks passed).
- **Also found by the reviewers.** Mutation records left stale by a later edit (`lessons.md`, the NODE-AX close), and a
  check that counted over grid nodes the policy never visits (the AN close).

## 4. Fixing a symptom locally, without searching for the pattern

The rule "after a bug, search for the same pattern elsewhere" (CHECKLIST item 9) only fires when the agent recognises a bug.

- **What happened (20 Oct session).** While revising PR31's test, the agent hit a probability rounding to exactly 1 near 8
  standard deviations. It handled this in the test (the check cut at plus or minus 7) and in PR31's own code (`solve.js`
  l.255 clamps the value), and treated it as calibration, not as a bug.
- **The same flaw elsewhere.** It was already in the exact-step code (`adaptive.js` l.274, since commit 05395be) and in the
  product's final-year read (`solve.js` l.222).
- **It passed everything.** The exact-step code had gone through REF-STEP's whole regimen: a unit test with a plant,
  preflights, mutation runs and audits. The bug was found by accident, when an unrelated test was extended.
- **Its reach.**
  - 2,484 and 2,700 non-finite values in REF-STEP's saved tables on S360 and S364 (`results-nan-census.txt`).
  - NaN from the product code on a planted call (`results-finalyear-nan.txt`).
  - Logged as O199 and O200 in `PLAN.md`, with REF-STEP's two affected results marked provisional.

## 5. Poorly calibrated forecasts, worst on "which cause"

Before each test the agent states a credence for each outcome. `results-scorecard.txt` scores them (Brier: lower is better;
always guessing the base rate scores 0.238).

- **Overall.** Brier 0.217 over 276 items, against 0.238 for the base rate: little skill.
- **By kind (the agent's Brier, then the base rate's).**
  - Attribution ("which cause"): 0.255 against 0.261 over 96 items, so no real skill.
  - No harm: 0.202 against 0.205.
  - Effect: 0.226 against 0.233.
  - Skill shows only on size (0.209 against 0.276) and controls (0.120 against 0.167).
- **Ranges too narrow.** 53 of 75 stated 80% ranges contained the result (71%). On 7u, the held-out confirmation, 6 of 8
  fell outside.
- **Causes.** Before 5 Oct, the deep reviews' leading causes were confirmed 1 time in 19 (the "hand record",
  `deep-review-log.md`). Since then, 21 of 23 settled leading causes held; counting the unsettled ones as not held, 21 of
  41. Of 509 causes stated, 40 have been settled by a result.
- **Derived against judged.** On the 21 items where both exist, the derivation scripts' credences scored worse than the
  agent's judgement (Brier 0.267 against 0.228), though they separated outcomes better (resolution 0.204 against 0.117).
  The comparison is still accruing (21 of 30 items).

## 6. Drifting from standing decisions

- **Count.** 26 blocking findings are decisions that are ill-posed, unreachable from their own rule, or contrary to a
  standing decision or STOP list (`[T:decision-fed]`).
- **Example, 20 Oct session.** The agent planned to change the candidate's settings, against the maintainer's ruling of
  19 Oct 09:26 that each fix is tested against a frozen candidate. The maintainer's question caught it before any change
  (`PLAN.md`, the 20 Oct 14:30 row).

## 7. The safeguards now cost more than the work they protect

Each failure mode above led to a new check, hook or review (`RULES.md`). Together they now dominate the effort, and the load
per test is rising.

- **Commits, 24 Sep to 20 Oct.** 1,844 in all: 635 touch `PLAN.md`, 275 touch predictions, and 61 touch the solver code
  (`src/solver`).
- **Audits.** The plan-auditor has issued 589 receipts, 282 of them FAILs (48%).
- **Load per test close (`triggers.mjs`).**
  - Last 20 closes: 153 audits (about 7.7 a close), 53 FAILs (about 2.65 a close).
  - Last 5 closes: 50 audits (10 a close), 21 FAILs (4.2 a close).
- **Repeated fixes.** One blocking finding was carried through 5 consecutive FAILs (`review-log.md`, 4 Oct 17:13 to
  17:25 UK, "carried 3" to "carried 5").
- **Rulings.** 88 maintainer rulings are recorded in the ledgers (`PLAN.md`, `PLAN-HISTORY.md`).

## Limits of this evidence

- The reviewers are LLM agents too, so the counts are what they caught, not everything there was. The NaN bug (section 4)
  passed every review.
- Finding codes were added from 30 Sep, so the tagged counts cover less than the whole period; receipt and FAIL counts cover
  all of it.
- No record ties a slip to context compaction (the session-start hook re-loads the rules after each compaction), so it is
  not listed here.
- Some of the slow progress comes from the research itself, not from the agent: 7u's held-out results came out
  inconclusive on three households. This document does not try to split the two.

## How each figure was produced

Run from `research/solver/` at commit e7624ba:

```sh
# audits, FAILs, and blocking findings by code (first tag of each "BLOCKING n." in a FAIL receipt)
grep -cE '\| (PASS|FAIL) \| plan-auditor' review-log.md
grep -cE '\| FAIL \| plan-auditor' review-log.md
grep -E '\| FAIL \| plan-auditor' review-log.md | grep -oE 'BLOCKING [0-9]+\.? \[T:[a-z-]+(:[a-z0-9-]+)?\]' \
  | grep -oE '\[T:[a-z-]+(:[a-z0-9-]+)?\]' | sort | uniq -c | sort -rn
# lesson lines by code, and the loop's measure (audits, FAILs and blocking codes per close; always-read bytes)
grep -oE '\[T:[a-z-]+(:[a-z0-9-]+)?\]' lessons.md | sort | uniq -c | sort -rn
node triggers.mjs
# calibration: CUMULATIVE, INTERVALS, BY KIND, DEEP-REVIEW CAUSES, LEAD RATE, JUDGED AGAINST DERIVED
cat results-scorecard.txt
# the numerical bug
node nan-census.mjs; node finalyear-nan.mjs
# commits, 24 Sep to 20 Oct (from the repository root; full days, UTC)
W='--since=2026-09-24T00:00:00+00:00 --until=2026-10-21T00:00:00+00:00'
git log $W --oneline | wc -l
git log $W --oneline -- research/solver/PLAN.md | wc -l
git log $W --oneline -- research/solver/predictions | wc -l
git log $W --oneline -- src/solver | wc -l
```
