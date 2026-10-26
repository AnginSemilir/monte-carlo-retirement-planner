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

The third sweep (the smaller cuts, E6 to E11), on the speed checkout with `e11.patch` applied:

- `e11.patch`: the whole diff to the agent's code at 52b0b6c: E5 and the `realAt` cache as in `e5.patch`, then, each
  opt-in and each with a test-only plant: E6 (`packedReads: true`, the four next-year tables packed side by side; measured
  no faster, not to be ported), E7 (`mixOnce`, each move's mixture sums once a cell, staying and switching; plant
  `mixOncePlant: 'swap'`), E8 (`postIds`, each base move's position hashed once a cell to an id, the memo keyed by the id;
  plant `postIdsPlant: 'pen'`), E9 (`hoistNext`, next year's four tables of each world and layer looked up once a year;
  plant `hoistNextPlant: 'layer0'`), E10 (`gfnFast`, the gross-up without its per-call list, sort and closures; its plant
  `_grossForNetPair.planted`, a sort that never fills the first place) and E11 (`readerDirect`, the bridge reader's split
  found once a year and handed to the read; plant `readerDirectPlant: 'world0'`).
- `bundle-identity.mjs <household> <points>`: the reference (E5), each of E7 to E11 alone, all five, then each plant on
  top of all five, in one process; every table compared value by value; E10 also call by call on 200,000 inputs.
- `reader-years.mjs <household> [points]`: the years the bridge reader reads in, so a plant in E11 can bite only there.
- `memo-plant.mjs <household> <points>`: the memo's own plants ('noworld', 'nocls') under E5, alone and with the four
  cuts in E5's path: which of them a test of the memo can use there.
- `share-lines.mjs <file.cpuprofile> <file> "<label>=<from>-<to>[+...]" ...`: a profile's share in named spans of lines.
- `time-e5.mjs` takes arms `ALL` (E5 with the five) and `ALL-E<n>` (all but one); `prod-time.mjs <household> <PRODUCT |
  PRODUCTGFN>` times the product on this code (the cache in every path; `PRODUCTGFN` with E10 as well);
  `timeq-sweep.sh` queues both, deadline-aware; `pairq.sh <household ...>` times the product with and without E10 started
  together, one on each core; `split-time.mjs <household> <parts> <ALL | ALL-E<n> | E5> [points]` times the split
  (`research/solver/e2.mjs`, e3pcls off in both arms, declared).
- `sweep-read.mjs <time7> [time6] [split] [pair]`: the packed reads against E5, the five against E5, each cut's share on
  S370, the product on this code and E10's effect on it, the split's check, and gate 5 read from them.
  `assemble-sweep.sh` prints `results-speed-sweep.txt` from all of these.
- `cpu-lines.mjs <file.cpuprofile> <fn,fn> [top]`: a profile's hot lines in the named functions.
