# Proposal: fixes that unmask other errors, and a deep review paced by uncertainty

Written 26 Sep, for the maintainer's next "unlock enforcement". **Built under the unlock of 26 Sep 16:47 UK** (RULES.md section 9,
"Enforced by"): the checklist's three changes were folded into items 1, 2 and 11 rather than added as item 13, since the
checklist is capped at 12 items; the deep review's start and receipt go through `record-deep-review.mjs`, and the index,
the recorder, the log and the agent are locked. Not built: check-plan.mjs printing the index (optional), the overnight Routine. What is already in force without an unlock: RULES.md
section 4 rule 13 and section 9 (the plan-auditor reads RULES.md), the register's family note in PLAN.md, and the two
unlocked pieces of the deep review below (`research/solver/uncertainty.mjs` and `.claude/agents/deep-reviewer.md`).
What needs the unlock is the enforcement: the checklist line, the prediction checker, the plan-auditor's check and the
Stop hook's trigger. Each change is written out exactly, with why it does not weaken any existing check.

## Why (the maintainer, 26 Sep)

"You may fix one thing and it highlights another issue that wasn't otherwise known about. We need to take this into
account when assigning responsibility ... how was this case missed before?" and "Perhaps we need to incorporate automated
deep thought review on a periodic basis based on the level of uncertainty of the model."

The same pattern ran three times: F1 v2 (O17, 24 Sep), the bridge reader (7e, 26 Sep) and F2 by design each read the
bridge accurately and each lost survival on the households where off's misread had pushed it, by accident, onto a safer
tier for life. Blame went to each fix in turn. The causes, in full: RULES.md section 9. The step that found it was not a
rule but a stepped-back review across the records (26 Sep, after 7s), which is what the deep review makes routine.

## 1. CHECKLIST.md (locked): one line, item 13

> 13. A fix that removes a known error and makes a result worse has unmasked another error until shown otherwise: its
> prediction carries the Unmasking field, and a harm verdict on it is settled as the fix's fault only after a
> decomposition (RULES.md section 9).

Why it does not weaken anything: it adds a requirement; nothing existing is removed.

## 2. check-prediction.mjs (locked): the Unmasking field

Every test carries `- **Unmasking:** <text>` or `- **Unmasking:** none: <why the thing tested removes no known error>`.
When it is not "none", the text must name (a) the known error the arm removes, (b) the baseline behaviour that error drives,
and (c) the arm or item that separates "harmful" from "unmasks another error". The checker enforces presence and the
"none: <reason>" form (as it does for Seeds); the plan-auditor judges the content. Predictions written before the field
are exempt by name (the BEFORE_SEEDS pattern). A planted test in research/tests/plan-checker.test.mjs: a test without the
field fails; "none:" with no reason fails; a full field passes.

## 3. The plan-auditor (.claude/agents/plan-auditor.md, locked): two checks

- A harm or FALSIFIED verdict on a change that removes a known error is BLOCKING unless the plan names its decomposition
  or marks the attribution grade C (RULES.md section 9, rules 1-2); a registered consequence that is "the next fix of
  the same kind" is BLOCKING until the unmasking check is answered.
- A new register item pointing the same way as an existing one must carry the family note; a family at three members
  without a scheduled root-cause diagnosis is BLOCKING for any further fix in that area (rule 5).

## 4. The deep review, paced by uncertainty

A separate reviewer from the plan-auditor. The auditor checks that a change follows the rules; the deep reviewer steps
back across the records and asks what the results together say - the analysis that found the clairvoyance hypothesis.

**What it does** (`.claude/agents/deep-reviewer.md`, unlocked, written now): reads the register, the last results since
its previous receipt, the traces where they exist and the solver's stated design premises; groups anomalies into
families; lists the premises decisions rest on with their grades; ranks candidate root causes with the evidence for and
against each; checks each open fix for unmasking; proposes the one decisive test; and records a receipt in
`research/solver/deep-review-log.md` (its own log, so the plan-auditor's lock is untouched).

**When it is due** (`research/solver/uncertainty.mjs`, unlocked, written now): an index from the records, printed with
its parts:
- calibration: the Brier score over the last 10 scored items (results-scorecard.txt's order);
- surprises since the last deep review: scored items missed at credence 0.8 or more, or held at 0.3 or less;
- families: the largest group of open register items sharing a family note;
- weak foundations: ledger rows since the last deep review whose evidence cell grades a decision C or D;
- unmasking flags: harm or FALSIFIED verdicts on fixes of known errors since the last deep review.
The review is due when any one trips: 2 surprises, a family of 3, a Brier over 0.25 on the last 10, or a number of
settled results since the last review that falls as uncertainty rises - 6 when the index is low, 3 when medium, 1 when
high (every result gets a deep review while the model is poorly understood).

**Enforcement (locked, proposed):** the Stop hook runs `uncertainty.mjs --due` and, when a review is due and
deep-review-log.md has no receipt after the trigger, blocks the turn's end with the reason - exactly as it does for the
plan-auditor's receipt. `check-plan.mjs` prints the index beside its pass line. Optionally, a scheduled Routine runs the
deep review overnight when due (it needs the maintainer's say-so to create: it runs unattended).

Why it does not weaken anything: it adds a gate and a reviewer; no existing check changes.
