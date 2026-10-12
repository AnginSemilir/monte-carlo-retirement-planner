# The escalation review: a fallback beyond the deep review

The maintainer, 12 Oct 12:57 UK (the session): a deep-research review at the model and effort the maintainer named (not
written here: no pushed file names a model, CLAUDE.md), "only in situations when the current deep review and subsequent
tests fail repeatedly, to get out of very difficult situations, or when you're planning a >2 hour run with low
confidence". This file is the rule in full; PLAN.md's method section points to it, and checklist item 11 carries the
trigger (added on the maintainer's unlock of 12 Oct 13:37 UK; RULES.md is at its byte budget). The checklist is loaded
at every start and restated after every compaction; no check or hook tests the triggers themselves. The thresholds below are Claude's rendering of the
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
   more, or gives its primary item no outcome at 0.4 or more. The bar sits above the plan's usual long run: the last four
   (NE-SPLIT, NE-ROOT, NE-GRID B1, NE-GRID C) had 'else' rows of 0.57, 0.53, 0.51 and 0.41, so the first draft's 0.35
   would have fired on every one (the plan-auditor's MINOR 1 of 12 Oct 13:08 UK). The second clause alone is not above the usual run: it would
   have fired on NE-ROOT, whose primary item 1 read HELD 0.37, INCONCLUSIVE 0.35, FALSIFIED 0.29 (results-derive-neroot.txt),
   and the maintainer was first asked about the bar with the 'else' rows' count only (the plan-auditor's MINOR 3 of
   12 Oct 13:53 UK). The check is made when the derivation's output lands, before
   the prediction is registered; the review's findings go into the design before launch.

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
