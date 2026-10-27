1. Exploratory runs need no registration. Label them EXPLORATORY. They cannot change a default, a gate or the candidate, except by a maintainer's ruling naming the run.
2. A confirmatory run (7u-F, Phase 4, any change of default) has a one-page registration committed before launch (`registrations/`: question, arms (configuration hashes), households, held-out seed, paths, primary metric, decision rule, what each outcome decides). It is launched through `run-from-snapshot.sh` and read once, by that rule.
3. Every comparison is paired on the same paths and passes the fair-test diff of the settings each run recorded.
4. After any edit to src/solver, the fast verification suite (`node research/tests/run-all.mjs fast`: V1, V2 and the unit tests) passes before any batch.
5. A new check is shown failing on a planted fault once, in its own test.
6. Figures in documents are printed by scripts from results files (STATE.md's by `research/solver/state.mjs`).
7. A bug is fixed together with a test that catches its class; running that test over the code is the pattern search.
8. Every task has an acceptance test and a time box. When the box runs out, stop and report to the maintainer.
