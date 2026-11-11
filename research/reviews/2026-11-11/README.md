# The external review, 11 Nov: item 7's extra pot and the estate cap

`ANSWERS.md` is the document: the review's answers to the agent's five questions (`research/solver/ITEM7-POT.md` on
`claude/project-access-i58m0x`, ab93f4e4), item 13 (the experiment and the port it proposes), and the prompt to send.
Everything here is EXPLORATORY and decides nothing.

## What is here

| | |
|---|---|
| `prototype/chooser-tie.diff` | the tie-break, three switches on a solved table: `tieMargin` (the chooser's existing option), `tieSame` (only moves at the best move's spending level and tier pair), `tieAbove` (only where the household's wealth is above the estate cap). `solve.js` only. Off unless an arm sets them |
| `prototype/shortlist-slice.diff` | on top of it, for item 7's shortlist: above the cap, with the tie-break on, every move at the shortlist's chosen level and tier pair joins the list and the decision is made again (`SHORT.slice`). A second scoring in the prototype; a port scores only the added moves |
| `scripts/chooser-tie.mjs <household> [points 45] [paths 3000]` | one household solved once, then the same tables run forward with the chooser changed, every arm on the same paths against the whole menu. Its header gives the arms. `SOFT=1` solves the household again with the estate shape `'soft'` |
| `scripts/root.mjs` | finds the copy to run on (`REPO_ROOT`) |
| `results/` | every output, as the script printed it |

## To run it

On a copy of `claude/project-access-i58m0x` at 6331361 or 01825f2 (the candidate d71f65ae871e: item 3 in, item 10
not yet), the engine built (`python3 research/build-engine.py`):

```
git apply research/reviews/2026-11-09/prototype/shortlist.diff
git apply research/reviews/2026-11-11/prototype/chooser-tie.diff
git apply research/reviews/2026-11-11/prototype/shortlist-slice.diff     # only for a +slice arm
REPO_ROOT=<the copy> ARMS='whole+tieC@1e-4,whole+tieC@1e-3' SOFT=1 node chooser-tie.mjs S328F 45 3000
```

With the first two applied `src/solver/solve.js` has the sha256 prefix 216e897679bd4bb1, and with all three
d910e98baa0da3c2: the two files the review's runs used.

The copy the review ran on also carried the couples' patches of items 11 and 12. They change `couple.js` and add
one function to `grid.js` (no line of it removed) that only a couple's path calls.

Households are Phase 4's eight as it landed them (`research/solver/phase4-panel.mjs` `readPanel`). Seed 99004: not
the tuning seed and not the seed of any registered run or prediction on the working branch. About 8 minutes a solve
and 3 to 4 minutes an arm on S328F.

## The outputs

An arm's name: a width (`whole`, `structure`, `order`, `cells-held@0.005`), then optionally `+slice`, then
optionally a tie-break:
- `tieA@m`: any move within `m` of the best score (the chooser's `tieMargin` as it is);
- `tieS@m`: only moves at the best move's level and tier pair, anywhere;
- `tieC@m`: as `tieS`, and only above the cap. This is the one item 13 proposes.

`m` is in score units: `1e-4` is 0.01 points of survival.

| File | Arms |
|---|---|
| `out-chooser-tie-45-S328F.txt`, `-S188.txt` | round 1: `tieS` at two margins, `tieA`, `structure`, `structure+tieS` |
| `out-chooser-tie-45-S328F-above.txt`, `-S188-above.txt` | round 2: `tieC` at two margins; then the household solved again with `'soft'` |
| `out-chooser-tie-45-S328F-margins.txt` | round 3: `tieC` at three margins; `structure` and `order` with it |
| `out-chooser-tie-45-S304F.txt` | round 3: a third household: `tieC` at two margins, `structure`, `structure+tieC` |
| `out-chooser-tie-45-S328F-slice.txt`, `-S304F-slice.txt` | round 4, with all three patches: `structure` and `order` with the tie-break and the slice |

Three things to know when reading them:
- **Round 1's two files were printed before the script gained `tieC` and `SOFT`,** and rounds 1 to 3 before it
  gained `+slice`. Round 1's arm column is narrower. Their arms run the same code today.
- **The last line of each `-above` file (`soft: whole+tieC@1e-4`) is no result.** The prototype finds the cap from
  the estate term at a very large sum. Under `'soft'` that is about 28 times the cap, so the rule fires almost
  nowhere and the line all but repeats the one above it. `ANSWERS.md` item 13, stage B, step 2 says how the port
  must find the cap.
- **Times are not the point here** and were taken two runs at a time on a two-core machine.

`../2026-11-09/` was corrected the same day on the maintainer's point about the pot: `REVIEW.md` 2.4, item 12 and a
note under item 7 in `EXPERIMENTS-AND-PORTS.md`, and a note at the top of `ANSWERS-2026-11-11.md`.
