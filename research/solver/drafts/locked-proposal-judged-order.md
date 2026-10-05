# Proposal: the judged-before-derived check deadlocks a new prediction's first commit (for the maintainer's "unlock enforcement")

Written 5 Oct when XAS-R's registration was refused. This is the first test prediction held to the judged rule
(check-prediction.mjs `heldToJudged`: every prediction first added after JUDGED_BOUNDARY ed5db5c).

## The fault

`judgedOrderProblems` (check-prediction.mjs l.247) reads two commits from git:
- J, the first commit carrying the prediction's "- **Judged, item" lines;
- D, the first commit adding its derivation's output file.

When neither is committed it refuses: "commit the 'Judged, item' lines alone first, then run the derivation". But the
pre-commit hook (.githooks/pre-commit l.16-23) runs check-prediction.mjs on every staged prediction. The commit that
would carry the judged lines alone is checked before it exists, so J is still null and the check refuses it.

Committing the derivation's output first does not help: the check then refuses because the output is committed and the
judged lines are not. So no new test prediction can be committed at all, unless it writes "Judged: none", which takes it
out of the decisive check.

Evidence: XAS-R's prediction, written with its judged lines before derive-xasr.mjs existed, staged alone (the derivation's
output on disk, unstaged), refused by the hook:
`pre-commit: research/solver/predictions/diag-xasr.md is not a complete prediction`. The checker printed the "both
uncommitted" line, run by hand on the staged copy under its own name.

The planted cases for the rule cover J before D, J equal to D, J after D, and the judged lines edited after D. They do not
cover the hook's case: a first commit whose judged lines are staged, not yet committed.

## The change

In `judgedOrderProblems`, when neither J nor D is committed, refuse only if the derivation's output is staged in the same
commit; otherwise pass:

```js
if (!J && !D) {
  const staged = git(['diff', '--cached', '--name-only', '--', out]);
  return staged && staged.trim()
    ? [`the "Judged, item" lines and the derivation's output (${out}) are staged in one commit: commit the judgement first`]
    : [];
}
```

The later checks still hold:
- The commit that adds the output is checked when the prediction is next read (by the launcher, by check-prediction by
  hand, or by the hook if the prediction is staged too).
- At that point J must be a strict ancestor of D, and the judged lines must be unchanged since D.

Run outside a commit, with nothing staged, an uncommitted prediction also passes this one rule. That is the state while it
is being written; the launcher refuses an uncommitted prediction anyway.

## Its planted checks (hooks.test.mjs or plan-checker.test.mjs, locked)

1. Neither committed, and the output not staged (the hook's first commit): passes. This case is refused today.
2. Neither committed, and the output staged with the prediction: refused (one commit).
3. The existing four cases unchanged.

Then run the mutation runner on the new branch: drop the staged test, and invert it.

## What waits on it

XAS-R's registration (research/solver/drafts/diag-xasr.md, its judged lines committed there, so their time is on record).
FORCE and any later test are blocked the same way.
