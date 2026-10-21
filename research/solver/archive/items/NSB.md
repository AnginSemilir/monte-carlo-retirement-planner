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

## NS-COND as registered (the plan-auditor's PASS on 49faa11, review-log.md 8 Oct 23:03 UK, MINORs 1 and 3)

- Item 2 runs the copy rule alone, not both rules as the deep review's test above asked.
  - drafts/ns-cond-design.md l.43 left the drop rule as an open build question; the registration
    (predictions/diag-nscond.md l.16 and l.59; audit-nscond.mjs swapIn, the copy arrays only) settles it by leaving
    it out, as NSB's item 2 did.
  - Why: item 1 already prints elive, the drop rule's read, per read, so the drop rule's direction is read there; a
    drop-rule census would only count where its move changes, and no branch of the Decision fed reads that count.
    Item 1 HELD designs no copy or drop rule (the STOP list above); FALSIFIED and INCONCLUSIVE go to 7an. The census
    of whatever rule a HELD designs belongs to that fix's own test.
- Item 1 FALSIFIED is not read as "the live error is resolution".
  - By the derivation's own chances (results-derive-nscond.txt section 2), FALSIFIED comes under NSL-WEALTH or
    NSL-SHARE with 0.14 x 0.40 each, under NSL-OTHER with 0.27 x 0.20 and under NSL-UNCOND with 0.45 x 0.02. Of
    0.175 in all, resolution is 0.112 (0.64), NSL-OTHER 0.054 (0.31) and NSL-UNCOND 0.009 (0.05).
  - So a FALSIFIED read is quoted as "not NSL-UNCOND's conditioned read: resolution or NSL-OTHER, 7an decides", its
    attribution graded C. The action is the same under either cause: 7an's resolution check first, no conditioned
    read.

## 9 Oct: NS-COND READ (PLAN.md's 01:24 row; results-nscond.txt)

- The gate passed: the fair-test gate, the five households once and done at XAS's unit, DEADSTEP and the census on each
  arm, every self-check where it must run, and the identity against XAS-R2's files.
- Item 1 INCONCLUSIVE, the cells apart:
  - bridge 4's three cells show N: its live corners carry the state's survival (rho 9.9971e-1 on BASE's reads), so
    dividing by rho cannot move the live read, and the conditioned read equals the copy read (6.2165e-1 both);
  - S370's three cells show R and K, each small beside the error: BASE's reads |elive| 9.3654e-1, divided by rho
    9.0184e-1, the conditioned read 9.0703e-1;
  - S126's one cell is not material (|elive| 7.9910e-3); no counted read leans on a kept or an off-axis dead corner
    (wK and w0x 0.000 on every cell).
- Item 2 HELD: under BASE the copy rule changes S126's opening (59 to 3), every state's move on bridge 4 in years 0 and
  1 and 5999 of 6000 in year 2, and up to 15.02% of S370's (year 6); under COV it changes none of S126's year 0.
- Item 3 INCONCLUSIVE (predicted FALSIFIED): S370 year 2 reads REF (s 0.606), year 6 NOTREF (s -0.000); PLAN.md O130.
- What follows (the Decision fed, as registered): a conditioned read is designed only for S370's cells, its reach
  bounded by the small R and K shown there; bridge 4's cells go to 7an's resolution question, quoted as "not
  NSL-UNCOND's conditioned read: resolution or NSL-OTHER, 7an decides" (grade C); the copy rule is not a fix candidate;
  YB2-NODEQ and CURV remain, and 7an's design names the year-before pessimism as untested on BASE.
- The STOP list above, after the read: no dead-node copy or drop rule is designed (item 2 HELD: it exposes the live
  over-reads); F3-NSBLEND stays unsettled (item 1 cannot test the blend, O114); NSB's and NS-COND's item 2 counts are
  XAS's unit's, never the candidate's; NSB's first run's item lines stay unread.

## 9 Oct: the deep review after NS-COND (deep-review-log.md 9 Oct 02:09 UK)

- elive is scored against the one-step reference bE, which reads year t+1 through the same plain bequest blend
  (solve.js l.1009): in every year whose next year touches a share-axis dead corner, bE carries that year's under-read.
  Where the next year is clean, elive is small; on every contaminated cell-year it is large (the review's scratch reads,
  grade C). NSL-PROP leads (PLAN.md PR12); NSL-UNCOND is ranked last (judged 0.03): none on bridge 4, a small part on S370,
  whose rho is 1 at its median with a near-dead tail
  (O131, results-nscond-rho.txt).
- Two constructs were inert: the copy read equals the drop read here (its source is the cell's own live share corner),
  and in item 3 the reference's read equals BASE's on 5763 of S370's 5859 year-6 reads (O130, results-nscond-rho.txt).
- The decisive test NS-PROP (PLAN.md's row) and its STOP list replace the "What follows" and STOP bullets of the 9 Oct
  section above: the conditioned read for S370, bridge 4 to 7an, and "the copy rule is not a fix candidate" all wait on
  NS-PROP.
