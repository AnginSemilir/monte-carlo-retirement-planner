# The purpose test's scripts (EXPLORATORY)

- `audit-bestof-latest.mjs`: the agent's `research/solver/audit-bestof-cand.mjs` with the changes in
  `audit-bestof-latest.diff`. Copy it into `research/solver/` of the agent's code at 52b0b6c or later, with the engine
  built (`python3 research/build-engine.py`):

      PTS=45 MENUPLUS=hr TIERS_BELOW=3 OUTDIR=out node research/solver/audit-bestof-latest.mjs S370 0.0223606797749979 0.02 20 800 6

- `ptq.sh "<household> <weight>" ...`: runs the units one after another on one core, skipping any already done. It stops
  before a unit it could not finish inside two hours, and a rerun carries on.
- `purpose-read.mjs <file.json> ...`: D4's measure by household and over the panel, with the plant beside it.
