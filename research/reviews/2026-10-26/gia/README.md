# M15 v3, the GIA's own rungs: the prototype, its tests and the probe (EXPLORATORY; ../GIA-LADDER.md)

Run from a copy of the code at the agent's 5b7684a with `gia-ladder.patch` applied and the engine built. The scripts carry
the scratch folder they ran from (`G=` in `probeq.sh`); point it at this folder to rerun.

- `gia-ladder.patch`: the prototype (`giaLadder: true`, research only) and its test plants ('samerate', 'nocgt',
  'readlayer0'; empty in every probe arm).
- `gia-test.mjs`: the tests. `hash` (off: run on both codes), `all` (the gate, the structure, the rungs' rates, the plants,
  the inert rungs, the decision-time tax, the shared chooser), `superset` and `diagnose` (the superset measured; env
  `SOLVER_INTERP=linear`, `SUPERSET_EXTRA` for options), `inert` (env `PLANT2=readlayer0` for the planted fault).
- `gia-probe.mjs` (one household, one arm), `probeq.sh` (a queue of them on one core), `gia-read.mjs` (the read by the rule).
- Outputs, in order:
  - `hash-off.txt`: off, both codes, before the plant hooks.
  - `gia-test-all.txt`: the first full run. The tax check failed on a test bug: its expectation used the gain share
    before the year's flow. Fixed in the script.
  - `gia-test-all2.txt`: all pass but the superset.
  - `superset-*.txt`, `diagnose-linear-S330.txt`: the superset's failure and its cause (the amendment).
  - `inert-S330.txt`, `inert-plant-S330.txt`: its replacement and the planted fault.
  - `hash-off-final.txt`, `gia-test-all3.txt`: the same tests on the final code, the one the probe runs.
  - `smoke/`: S206 at 4 points, both arms, before the probe.
  - `probe/`: the ten arms (one JSON each, with every path's survival and whole score, and its log).
  - `results-gia-ladder.txt`: the read by the rule (`node gia-read.mjs probe`). The read gives no verdict until all five
    registered pairs are in and fair, a guard added while the first pairs came in.
