# Proposal: fixes that unmask other errors, and a deep review paced by uncertainty

Written 26 Sep, for the maintainer's next "unlock enforcement". **Built under the unlock of 26 Sep 16:47 UK** (RULES.md section 9,
"Enforced by"): the checklist's three changes were folded into items 1, 2 and 11 rather than added as item 13, since the
checklist is capped at 12 items; the deep review's start and receipt go through `record-deep-review.mjs`, and the index,
the recorder, the log and the agent are locked. Not built: check-plan.mjs printing the index (optional), the overnight Routine. Built differently from section 4 below (the
seventy-seventh review, MINOR 1; kept by the maintainer, 26 Sep 18:02 UK: "Do all"): a deep review is due by settled results only (the
surprises, a family of 3 and the Brier score raise the level, which then makes every settled result due), and the Stop hook
lets turns end for 30 minutes after a start, as it does for a plan review. What is already in force without an unlock: RULES.md
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


## How it was missed (moved word for word from RULES.md section 9 by the retirement pass of 15 Oct)

- **The baseline was treated as right because it was the product.** Off misread S126's bridge by 44 points and, because
  of that misread, held the pension two tiers down for all 40 years (7r's traces: 0.03 switches a path). Every fix that
  read the bridge more accurately (F1 v2, the reader, F2 by design; the reader not at top-cell step reads, PLAN.md PR1) stopped that accidental de-risking and lost survival on the
  same households. The fair-test table checked that the arms differed only in the bridge read - they did - but nothing
  asked whether the baseline's better outcome came from the very error being fixed. Equal settings are not equal errors.
- **The decision rule turned harm straight into blame.** 7e's registered consequence of harm on any case was "not carried
  forward, F2 is built": responsibility went to the fix, and the next step was another fix of the same kind, which the
  records suggest would have hit the same wall.
- **Related anomalies were chased one at a time.** O9 (the tables turn optimistic with F1), O17 (F1 v2 loses where it
  reads accurately, "not explained"), O18/O20 (M14b's tier-above bets lose on comfortable plans), O19 and 7h (the final
  year's staircase priced a riskier tier at nothing; the rest of the cost stayed), C5 (the switch margin decides
  near-ties) and O24 (the reader's tier scores below off by the solver's own objective) all point one way - the tables
  value extra risk too highly - but each was diagnosed in its own frame and no step asked what they had in common.
- **A design premise was never tested.** The mixture's comment says leaving out learning is harmless because twenty
  years of returns barely reveal the world; the backward pass nevertheless lets each world plan as if it knew its world.
  The premise argues the wrong way (slow learning makes the gap larger) and was never registered as a claim (7t tests it).
- **The table was checked in aggregate.** The reader's table read its own survival within 0.3 points (99.6 against 99.3
  on S126), so "the table is accurate" passed; a large error in the bad world and a small one elsewhere can net to that.
- **A prior test was missed.** 7s's derivation did not cite 7h, which had already found finer return sampling leaves the
  tier-above cost in place.
