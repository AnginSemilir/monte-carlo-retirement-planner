# The record counts behind Part A (external review, 21 Oct 2026)

Run from the repository root. Each reads `research/solver/`'s records and prints the figures the review cites.

| File | What it gives | Cited in |
|---|---|---|
| `saves-and-misses.md` | The 28 documented catches (saves) and the misses, 24 Sep to 20 Oct, each with its source | Summary, F9, section 3 |
| `since7u.py research/solver` | Test reads, launches, audits, deep-review entries, register rows and premises since 7u's read (10 Oct 03:46 UK) | F7 |
| `blocking.py research/solver/review-log.md [--show]` | The tagged BLOCKING findings by kind, and how many of the 47 overclaims name a grade; `--show` lists them | F9, section 3 |
| `overclaim-labels.txt` | A hand reading of the 47 overclaims: 10 pure evidence-grade disputes, 4 more on related labels, 2 ambiguous | Summary, F9 |
| `u7count.py research/solver/results-7u.txt` | 7u's households by verdict and sign of change, the gains, and each household's interval half-width | F6 |

The counts were made by independent readers of the records for this review and re-run before it was committed.
