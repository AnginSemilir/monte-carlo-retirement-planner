# The missing-moves check's scripts (EXPLORATORY)

Each runs from the root of a copy of the code at eb8709d or later (N4's build is needed: a finer ceiling rides on its
step code 6), with the engine built (`python3 research/build-engine.py`).

- `menu-gap.mjs <household> <weight> [paths] [paths for the greedy runs]`:
  - solves the candidate as `n4-menu.mjs` does (45 wealth points) and runs it on seed 7002's paths;
  - scores a far finer menu, and N4's, at every decision the run records;
  - runs the greedy policies over both on the same paths;
  - throws unless its checks 1 to 3 pass (its header lists the four);
  - `OUT=<file>` writes a JSON summary.
- `menu-gap-read.mjs <summary.json> ...`: the figures the note quotes, printed from those summaries.
- `third-step.mjs <household> <weight> [paths] [below]`:
  - solves the candidate with one more joint step down and runs it on the same paths, paired against the candidate;
  - runs on a copy with `third-step.diff` applied (a two-line option, `tiersBelow`), with e3pcls off, since the pin is
    stale on an edited copy;
  - `BASEJSON=<menu-gap summary>` takes the candidate's run from that summary instead of solving it again.
- `twin.mjs <household> <points> '<options>'`: the candidate's tables and its run on 100 paths, each hashed. It shows the
  copy with the option unset is the candidate.
- `routing.mjs <household> ...`: where a deposit left to the policy lands, under the plan's policy and under the app's
  'Windfall to ISA'.

The code in `menu-gap.mjs` is the code that ran; only its header comment changed afterwards. On one core,
`menu-gap.mjs` took about 45 minutes a household (1,000 and 3,000 paths) and `third-step.mjs` about 20.
