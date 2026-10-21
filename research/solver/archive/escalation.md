# The escalation review: a fallback beyond the deep review

The maintainer, 12 Oct 12:57 UK (the session): a deep-research review at the model and effort the maintainer named (not
written here: no pushed file names a model, CLAUDE.md), "only in situations when the current deep review and subsequent
tests fail repeatedly, to get out of very difficult situations, or when you're planning a >2 hour run with low
confidence". This file is the rule in full; PLAN.md's method section points to it, and checklist item 11 carries the
trigger (added on the maintainer's unlock of 12 Oct 13:37 UK; RULES.md is at its byte budget). The checklist is loaded
at every start and restated after every compaction. Trigger 1's first half (two deep-review-designed closes in a row, the primary item
INCONCLUSIVE) is detected by `triggers.mjs --due` and warned by check-plan until a run is logged below (the maintainer's
go-ahead after NODE-AX's close); its other halves and triggers 2 and 3 are tested by no check or hook. The thresholds below are Claude's rendering of the
maintainer's words, which the maintainer may move.

## When (any one; outside these, never - a maximum-effort review is expensive)

1. **Repeated failure.** Two decisive tests in a row, each designed by a deep review for the same question or family,
   end without settling it: their primary items INCONCLUSIVE, or their cause maps leave every ranked cause open, or each
   is FALSIFIED on the cause it was designed to confirm.
2. **A very difficult situation.** The deep review finds no test the regimen can register for a family of three or more
   members; or the plan-auditor FAILs the same registration three times on findings of the same kind; or the maintainer
   asks.
3. **A long run planned with low confidence.** Before registering a run whose budget line puts it over 2 hours' wall,
   when its derivation puts the chance it leaves its question unsettled (the decision table's 'else' row) at 0.6 or
   more. The bar sits above the plan's usual long run: the last four (NE-SPLIT, NE-ROOT, NE-GRID B1, NE-GRID C) had
   'else' rows of 0.57, 0.53, 0.51 and 0.41, so the first draft's 0.35 would have fired on every one (the plan-auditor's
   MINOR 1 of 12 Oct 13:08 UK). A second clause (the primary item given no outcome at 0.4 or more) was dropped by the
   maintainer (12 Oct, the session: "Yes, drop it"): an uncertain outcome is what a test is for, and it would have
   fired on NE-ROOT (its item 1 at HELD 0.37, results-derive-neroot.txt). The check is made when the derivation's output
   lands, before the prediction is registered; the review's findings go into the design before launch.

## How

- **The brief** (Claude writes it; `research/solver/escalations/<D Mon>-<name>.md`), self-contained, since the reviewer
  starts cold: the question and why it is stuck (which trigger); the record - each test's prediction, result and verdict,
  the deep reviews' ranked causes and credences, with the results files named; the code paths, as file:line with the
  quoted line; what has been ruled out and by what evidence, with its grade; the constraints (the regimen, the gates, gate
  5's solve-time limit, the budget); the outside reviews already received (`drafts/`); and the asks - mechanisms the
  record has missed, methods and literature that bear on them, the root causes ranked with credences, the one decisive
  test with held / falsified / inconclusive lines and its cost, and, under trigger 3, what would leave the planned run
  wasted.
- **The run: by default the maintainer's** (the maintainer, 12 Oct, the session: "give me an hour to respond and if not,
  go ahead with fallback"). Only the maintainer's own run is sure of the model, the effort and a deep-research mode: the
  agent tool takes a model family, not a version, and reports no serving model, and its web search is not the
  deep-research mode. When a trigger fires, Claude commits the brief and asks the maintainer, in one message naming the
  trigger and the brief, to run it in a separate window at the model, effort and deep-research mode the maintainer chose,
  and to paste the report back; Claude schedules a check-in an hour later. Until the report or the fallback's is in,
  other work goes on, but a run held by trigger 3 does not launch.
- **The fallback, after an hour with no answer:** a general-purpose agent, at the model the maintainer named in the
  session if the session has it, otherwise the session's own model (the agent's default), at maximum effort, given the
  brief, the repository read-only (it writes no file) and web search; its report comes back to the session. Its record
  is labelled FALLBACK with what ran: the model family asked for or the session's own model as get_session reports it,
  maximum effort, web search rather than a deep-research mode (the serving model unconfirmed). The maintainer may still
  run the brief later; a later report sits beside the fallback's.
- **The record.** The report is saved verbatim beside its brief (`escalations/<D Mon>-<name>-report.md`) and a line added
  to the log below. It is outside evidence: grade C until a registered test repeats it, and each claim it rests a
  recommendation on is checked against the code and the records before it is acted on (the external review of 12 Oct
  read the plan's own setting as two households having no minimum end pot: O146, O147). It replaces nothing: the deep
  review, the plan-auditor and the registered test stand, and what it proposes goes through the regimen like any design
  (a derivation, a prediction, the plan-auditor's receipt).

## The log

| date | trigger | brief | run by | what it changed |
|---|---|---|---|---|
| 12 Oct | (before this rule) the maintainer's outside review of the bridge-year misreads and its addendum | none (the maintainer's own questions) | the maintainer, manually | NE-GRID C amended (items 9 and 10, the probe; the 12 Oct 09:22 row); the addendum's three leads filed for the deep review after C (drafts/external-review-12oct.md) |
| 12 Oct | 2: the maintainer asks (the session) | escalations/12-Oct-opening-near-ties.md (the opening tier decided by near-ties: O30's family, O67, O100) | FALLBACK, no answer within the hour: an agent at the model family the maintainer named, maximum effort, read-only, web search (launched by the check-in of 12 Oct 16:17 UK) | its report saved (escalations/12-Oct-opening-near-ties-report.md): ranked causes, the test OPEN-SWAP proposed, a missed mechanism (the product's part-year first year, confirmed in the code); nothing acted on, put to the maintainer |
| 12 Oct | (the same brief) | escalations/12-Oct-opening-near-ties.md | the maintainer, in a deep-research window (uploaded 12 Oct, with notes) | its report and notes saved (escalations/12-Oct-opening-near-ties-report-maintainer.md, -notes/); it agrees with the FALLBACK on the first cause (the hold priced as one year) and on guarding the product's keep-the-plan's-tier rule with a two-opening rollout; it proposes the factorial F1-F3; nothing acted on, put to the deep review after NE-GRID C |
| 14 Oct | 1 (REF-2 and NODE-1, each a deep review's decisive test for the reference's pessimism and the reader at the bridge, primary item INCONCLUSIVE) and 3 (NODE-AX over 2 h wall, else 0.95 at the only record of its spread) | escalations/14-Oct-bridge-under-read.md | FALLBACK, no answer within the hour: a general-purpose agent at the session's own model (serving model unconfirmed), maximum effort, read-only, web search (report: escalations/14-Oct-bridge-under-read-report.md) | NODE-AX re-cut before any launch: its primary items exact per-year sums of the grid residual, the known positive on the exact residual at half NODE-1's lift, the attributed axis split dropped (wrong sign and failed additivity at the only record; its two-point read not the reader's copy rule in the cliff band, checked against reader.js l.105-133), 4,000 paths a world; the read error e_S - c e_p and the adaptive reference (the policy's own bridge chance) filed for the deep review after NODE-AX |
