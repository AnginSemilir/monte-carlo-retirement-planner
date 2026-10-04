# Per-item detail

A plan row (PLAN.md's register or schedule) is at most 3,000 bytes when new, and a longer row may not grow
(check-plan.mjs ROW_CAP; the process review, deep-review-log.md 4 Oct 13:52 UK). When a row needs more, its detail
moves here as `<id>.md` - the history of its design, the conditions it has carried, the figures behind it - and the
row keeps its status, its gate and a pointer: "detail: items/<id>.md". The row stays the one source for the item's
status; this file never restates it.
