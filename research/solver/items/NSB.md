# NSB: the dead node's non-survival values in every bridge year, and its re-scope (NS-COND)

From PLAN.md's NSB row (moved here to keep the row inside its size limit, 8 Oct).

## History

- PROPOSED by the deep review after XAS-R2 (deep-review-log.md 6 Oct 03:10 UK) as its decisive test; put before 7u
  registers by the maintainer (PLAN.md's 6 Oct 15:45 row).
- BUILT 8 Oct (539a49f, then the build checks' fixes): audit-nsb.mjs, reduce-nsb.mjs (its mutation run,
  results-reduce-nsb-mutations.txt), derive-nsb.mjs (results-derive-nsb.txt), batch-nsb.sh and preflight-nsb.sh.
- REGISTERED 8 Oct (a5f4cbd; O115 answered). The preflight passed: the gate on all five households at 4 points, and
  the deadshift, norestore and rebuild plants each refused by their own check.
- The plan-auditor FAILed that registration (review-log.md 8 Oct 12:37 UK). The Provenance had misattributed a
  4-point build-check figure to the wealth cliff, and the item lines the preflight printed were undeclared.
  RE-REGISTERED (c84202c): the account corrected, every 4-point item line declared, and item 1 re-derived from those
  previews (derive-nsb.mjs section 2b), INCONCLUSIVE now its likeliest outcome. PASS on 66d32322fa; its two MINORs
  were fixed before launch (98e460b).
- RAN 8 Oct (runs.log 13:46 UK, done 15:45 UK) and NOT SETTLED by its gate (PLAN.md's 15:45 row; results-nsb.txt;
  O127). deadExact refused on S370, both arms. The other four households' item lines were never read.
- The census of S370's tables at 30 points (results-nsb-census.txt, PREDICTION none, runs.log 16:28 UK; audit-nsb.mjs
  NSB_CENSUS=1):
  - the off-clamp dead nodes are in years 5 and 6 only (BASE 108 and 979, COV 108 and 857), log-odds -13.816 to
    -13.280, shortfall 0.9496 to 0.9751 of the clamped dead's;
  - they are moves that survive the year into a next year that reads as all but dead, not failing states
    (solve.js l.990-1018);
  - nodes at or below DEAD_LS that keep a bequest appear in every year: 2900 to 8030 a year outside year 4, and in
    year 4 every such node (29787 under BASE, 34533 under COV; O128).

## The deep review after NSB (deep-review-log.md 8 Oct 17:19 UK)

- FLAG 1 [T:design]: item 1 cannot test the blend.
  - The dead class requires a stored bequest of 0, so eb/bE + wd = wL x elive - w0x by an identity: wL is the weight
    on corners storing a bequest, elive their weighted bequest over bE less 1, and w0x the weight on bequest-0
    corners off the share axis.
  - So r measures the live corners alone, and the blend itself is certain from the code wherever wd > 0.
  - The 4-point previews say the blend cancels a live over-read on S370 (elive about +3.3) and bridge 4 (about +0.8),
    where S126's is about 0.01. A dead-node copy or drop rule would expose those over-reads.
  - Item 1 joins O114.
- FLAG 2 [T:decision-fed]: no NSB outcome can change 7u.
  - NSB's Decision fed leaves 7u's gates in every branch, and its unit is XAS's, not the candidate's.
  - O55's gate is met, so NSB is 7u's last test gate.
  - The review recommends that 7u registers now with NS-COND beside it or after it, as family 3's design input. The
    other branch gives NSB a way to stop 7u by running item 2 on the candidate's own unit.
  - The order is put to the maintainer, since the 6 Oct 15:45 order was the maintainer's. DECIDED (the maintainer,
    8 Oct 19:56 UK, PLAN.md's ledger: 'Go ahead'): 7u registers now, and NS-COND runs beside it or after it.
- FLAG 3 [T:code]: the bequests kept at or below DEAD_LS break the bound survival x the largest estate (O128).
- The re-scoped check, replacing deadExact:
  - the clamp clause is demoted to a census report: FAIL, NEXT and KEPT counts by arm and year, KEPT's bequest over
    survival x the largest estate, and each read's weight on kept corners beside elive;
  - the refusing check "some no-access node is classed dead" is kept;
  - a new refusing check, DEADSTEP: every share-axis dead node a read touches reproduces its stored survival, bequest
    and shortfall by a one-step recompute at the node, counted as FAIL (every move fails, so survival 0, bequest 0
    and shortfall failCostAt[t]) and NEXT (the rest);
  - DEADSTEP's plants: deadh (one FAIL node's shortfall moved by 1e-3 of itself) and deadnext (one NEXT node's
    survival moved by 1%), each caught inside its own slice, with effect over tolerance and tolerance over clean
    error printed, each at least 2;
  - the re-scoped checks run at 30 points in census mode on all five households before relaunch (the plan-auditor's
    advice, 8 Oct 16:38 UK).
- The decisive test, NS-COND: NSB's states, arms and households, with DEADSTEP and the census.
  - Per read it prints: elive (the drop rule's read), rho (the live corners' stored survival over the state's
    one-step survival), the copy rule's read, and a survival-conditioned read (the live corners' bequest x the
    reader's survival read at the state / their survival).
  - Ranked causes of the live corners' error: NSL-UNCOND 0.45 (1 + elive about rho: the non-survival reads are not
    conditioned on the state's accessible money while survival is), NSL-WEALTH 0.14, NSL-SHARE 0.14,
    NSL-OTHER 0.27.
  - NSL-UNCOND holds in a counting cell when dividing by rho brings the live read nearer bE on most paths (a paired
    sign test, Holm) and the conditioned read beats the copy read.
  - Item 2's census runs for both rules; item 3 is unchanged.
- STOP until NS-COND reads:
  - designing a dead-node copy or drop rule for the non-survival reads;
  - settling F3-NSBLEND on item 1;
  - quoting NSB's item 2 counts as the candidate's;
  - reading the first run's unread item lines (declared in the re-registration; batch-nsb.sh's rm -rf clears them);
  - taking a 4-point pass of a premise check as a pass.
