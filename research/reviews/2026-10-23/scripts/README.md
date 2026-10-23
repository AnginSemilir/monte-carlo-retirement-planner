# The speed review's scripts (EXPLORATORY)

Each runs from the root of a copy of the code (`node <path>/script.mjs ...`), with the engine built
(`python3 research/build-engine.py`). PROTO is such a copy with `../speed-prototype.diff` applied (`patch -p1`).

- `speed-timing.mjs <household> <SHIP|CAND|JOINT> [weight]`: one household and arm (JOINT: the candidate without the
  tier state), solved as 7u-F's audit solves it; times the solve and the engine's run of the table and prints the hashes
  two versions of the code must share (its header lists them and the environment it reads).
- `run-speed.sh`: the runs behind SPEED-REVIEW.md, BASE beside PROTO (`BASE=... PROTO=... [LONG=1] bash run-speed.sh`).
- `speed-figures.mjs <results-speed.txt>`: the ratios the review quotes, printed from the results file's own lines.
- `profile-run.mjs` and `profsum.mjs`: the profiles (`node --cpu-prof --cpu-prof-interval 2000 profile-run.mjs S224 SHIP
  200`), summarised by function, self and inclusive, optionally only the samples under one function.
- `dupes.mjs <household> [points]`: how many of a cell's moves leave it in the same post-decision state (the memo's
  ceiling, counted before it was built).
- `stale-check.mjs <household> [points]`: finding 1, the same seven-slot positions scored on a table that has run
  forward paths and on a fresh copy of it.
