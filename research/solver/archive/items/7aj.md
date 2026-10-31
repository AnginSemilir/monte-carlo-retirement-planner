# 7aj: the runs and the code they ran on (detail for PLAN.md's 7 Oct 11:29 ledger row)

## The three runs (runs.log; results/7aj-run.log)

- Run 1: launched 00:55 UK on code 2572c8443234 (snapshot cca7914). A container restart stopped it with 4 of 50 units
  finished. 773e8d9's commit message says the restart came before any unit finished; 4 had. They were discarded when run 2's
  batch cleared its folder.
- Run 2: launched 02:18 UK on code 6dfa9cfea59a (773e8d9). A second restart stopped it with 4 units finished.
- Run 3: launched 03:36 UK on 6dfa9cfea59a (14cb09d), the batch made resumable: a unit is kept only when its log's stamp names
  this code and its last line is its done line. It kept run 2's 4 units and ran the other 46; done 11:25 UK. Every unit read is
  stamped 6dfa9cfea59a, and the reducer's gate checked every unit's stamp and trace against the others.

## The departure: 7aj ran on the code with the e3pcls merge

The deep review of 7 Oct 00:01 UK asked to keep the e3pcls merge out of 7aj's snapshot, and the 6 Oct 23:04 ledger row said
nothing of it reaches 7aj's launch. Run 1 met that (cca7914); the restart moved runs 2 and 3 onto 6dfa9cfea59a, which carries
the merge (773e8d9). The merge changes nothing in 7aj's units, grade B:

- `git diff cca7914 14cb09d -- src/solver/` touches only solve.js (57 lines added, 2 removed); every executable line it adds
  is behind the option e3pcls (E3P), but E2.sum(pclsCopied), which runs only under the cross-core split (E2).
- Neither candidate.mjs (CANDIDATE_OPTS) nor audit-7aj.mjs sets e3pcls or the split, so neither path runs in 7aj.
- The launcher's smoke run passed on 6dfa9cfea59a before run 3 (results/7aj-run.log).

Found by the plan-auditor on PLAN.md 83765e710e (BLOCKING 2, 7 Oct).
