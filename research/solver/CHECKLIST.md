# The checklist: every run, every result, every plan update (in full, with the evidence: research/solver/RULES.md)

1. Before a run: write `predictions/<name>.md` (prediction, falsifier, all 33 fair-test rows, and the regimen's fields: decision rule, power, credence, pre-mortem), commit and push it, and launch only through `run-from-snapshot.sh` with `PREDICTION=`.
2. Before reading a result: the reducer's fair-test gate must pass, then read it by its registered decision rule (exact tests against a margin, Holm, three outcomes), never "beyond two se". Anything that differs other than the thing tested means the result is not settled.
3. Reusing old result files for a new question is a new test: fair-test those files first.
4. Every figure in the plan comes from a script's output over the files; cite the results file and the evidence grade (A-D) in the ledger's evidence cell.
5. "No effect", "unaffected", "can't happen": add `evidence: <file or proof>` of grade A or B on the same line, or write NOT CHECKED.
6. Trust a check only after it has failed on a planted fault. A check that ran on nothing is an error, not a pass.
7. After any code edit, the launcher's smoke run must pass on that code before a batch; re-test every caller.
8. A decision changes the code default in the same commit, and the decided-defaults block; a test pins the two together.
9. After a bug, search for the same pattern elsewhere and write "Same pattern searched:" with what was found.
10. Log every odd result in the register with an owner and a gate, or as "noted, below materiality" with its size estimate. Never note it and move on.
11. After a settled result: re-derive everything downstream, add a ledger row with its evidence, run the plan-auditor at the change's tier.
12. Times in UK time. Report evidence (the command and its output), not claims.
