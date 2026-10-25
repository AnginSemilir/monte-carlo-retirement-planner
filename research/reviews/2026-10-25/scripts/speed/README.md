# The speed groundwork's scripts (EXPLORATORY)

Each runs from the root of the agent's code at 52b0b6c (`src/solver` the same at c28e729), with the engine built
(`python3 research/build-engine.py`). The queue scripts name the folder they ran in (`D`); set it to your own.

- `prof-arm.mjs <household> <PRODUCT | CAND | HRT3> [points]`: one solve of gate 5's arms, timed. With
  `node --cpu-prof` and `SOLVER_PROFILE=1` it profiles too (`profq.sh`); without, it is a plain timing (`timeq.sh`).
- `cpu-top.mjs <file.cpuprofile> [top]`: a profile's self time by function and by file.
- `n1.patch`: the prototype, `tableDealing: false` in `src/solver/solve.js` (the tier state's table without a switch's
  dealing cost; off, nothing changes). `n1-count.patch`: the same with a local counter of the loop's expectations by kind.
- `time-n1.mjs <household>`: the prototype's solve, timed (`timeq-n1.sh`; `prof-n1.sh` profiles it). It calls
  `solvePlan` as `solveCandidate` does, since the patched code makes the e3pcls pin stale.
- `n1-compare.mjs <household> [points] [paths]`: the candidate as it stands and the prototype in one process: each
  solve's time, how far the tables moved, then both on the same paths of the tuning seed, paired.
- `count.mjs <household> <points> [n1]`: the loop's expectations by kind, on `n1-count.patch` with `SPEED_COUNT=1`.
- `speed-read.mjs <timings> <purpose-test logs>`: gate 5's gap by household, with the prototype's beside it.
- `e5.patch`: the second cut on top of the prototype, the whole diff to the agent's code: with `tableDealing: false`
  the joint tier state's loop computes each move's terms once a cell and world and scores each layer with the switch
  charge alone (`tsOnce`, on with it; `tsOncePlant: 'nocharge'` for the test), and `realAt` keeps each rate vector's
  logs (`REALAT_NOCACHE=1` for the old path).
- `e5-identity.mjs <household> <points>`: the candidate, the prototype's loop, E5 and E5 planted in one process; E5
  must give the loop's tables bit for bit and the plant must part them. Run it with `REALAT_NOCACHE=1` too.
- `time-e5.mjs <household> <points> <N1LOOP | E5 | CAND>`: one solve timed, its tables hashed (`timeq-e5.sh`).
