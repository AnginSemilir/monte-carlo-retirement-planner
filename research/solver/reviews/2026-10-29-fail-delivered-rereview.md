# Re-review: `failDelivered` (the port, its test, the candidate's default, registrations/fail-delivered.md), after the FAIL

Subject: the working tree of 29 Oct (HEAD 89c8215) as changed to answer reviews/2026-10-29-fail-delivered-design.md (FAIL,
two BLOCKING, six MINOR). The protected edits (speed-port.test.mjs, run-all.mjs, check-prediction.mjs) were made under the
maintainer's "unlock enforcement", as the coordinator reports.

## What I read

Working-tree blobs (git hash-object, first 12): src/solver/solve.js 113e3da7d08b (unchanged since the first review);
research/tests/fail-delivered.test.mjs and results-fail-delivered.txt (new forms); speed-port.test.mjs 7923ca0c6258;
run-all.mjs 013248a58959; check-prediction.mjs 37e208f33478; registrations/fail-delivered.md 2741af0cf7fc;
reduce-curve.mjs 97b07bf331f4; audit-curve.mjs b71813586a9c (unchanged); batch-fail-delivered.sh 660ea8834d38;
batch-curve-dial.sh ba96826ea367 (batch-curve.sh removed). STATE.md 8fcf0abcf464, state.mjs 3a361fbf49af, candidate.json
6ecabd1100ef, candidate.mjs 8e17a0268f01 and candidate.test.mjs 97932e95db83 are unchanged since the first review.

What I ran (no batch, not the whole FAST suite, as asked):
- `node research/tests/e3pcls-guard.test.mjs`: 37 passed, the committed pin matching the code (f7239113db074d9e);
  check-prediction.test.mjs ALL PASS 17; hygiene ALL PASS 10; hooks ALL PASS 26; `check-state.mjs` passes.
- `check-prediction.mjs --seeds research/solver/registrations/fail-delivered.md --text "bash research/solver/batch-fail-delivered.sh" research/solver/batch-fail-delivered.sh`:
  "seeds: 7019 (held out: ...)", exit 0; `--seeds none ... batch-curve-dial.sh`: "seeds: 7002 (tuning)", exit 0;
  `--seeds none ... batch-fail-delivered.sh`: refused (7019 under a measurement), as it should be.
- `node research/solver/reduce-curve.mjs --planted`: 20 of 20.
- Scratch (my scratchpad): smokeread.mjs, the revised gate and registered read on the harness's own smoke units
  (results/curve-smoke): the gate passes the dial arms, refuses the registered read on 7002, and every line of the read
  prints, the equity line among them. harm2.mjs: the revised HARM rule on synthetic units (finding 1).

Verdict: PASS

## The first review's findings, checked

- 1a, closed. fail-delivered.test.mjs carries the `// e3pcls guard:` line with its reason and solves on PHASE4_OPTS, with
  failDelivered set by each check. e3pcls-guard.test.mjs passes.
- 1b, closed as far as I can see without the full run. speed-port.test.mjs l.48 strips failDelivered from D29_OPTS, so
  check 1 again compares the candidate as D29 left it with the hashes recorded before the port. The other checks set their
  own options and passed before, with the option on. I have not seen its final line; the pre-commit hook runs it.
- 2, closed. One seed per batch script; both launches pass the seed registry, and the registered seed is refused under a
  measurement. The registration's launch line names batch-fail-delivered.sh.
- 3, answered. raiseWithin reports a 110% year in any of the three years before ruin, beside P3 in both reads. The
  registration records the backward pass's failing-move cells, before the run.
- 4, answered. HARM now needs the pooled interval wholly below -0.1 points. P1's paths are split by kind. The registration
  says before the run that P1 may miss on a few minimum-pot paths. Planted at the margin: two paths a household reads
  MISSED, eight of 1,000 reads HARM.
- 5, answered. The power text cites CANDD's own se, about 0.001%.
- 6, answered. The gate checks each unit's failDelivered and lambda against its arm (ranOf), and one pts, levels,
  switchCharge, raiseWeight and failureShortfall across the units read. Each has a planted refusal. runPolicy differences
  are printed, not gated.
- 7, closed. The registered read prints each arm's equity at years 1, 5, 10 and 20; on the smoke units, CAND 43.3% and
  CANDD 83.3% in year 1, as in case0.txt.
- 8, closed. The test runs all five routes (TERN, E5, TSLOOP, JOINT, PASS2), each held to its route by what meta recorded.
  results-fail-delivered.txt (--full, ALL PASS 19) has the BASE identity on every route. Its JOINT, TSLOOP and PASS2 hashes
  are the ones my probe found (5e61cc17a35b042d / 9e05cde25d860ace / 00473093abde3917; 9519c7c96bcb5634 /
  9ff9791aeb3c8d3a / 30b136ab611c3621; 5ab2c7a042870dcf / b93c3adf9b541310 / e3e762f2d66fdb5e), and its E5 and S304F
  hashes are the review's. The quick form (checks 2 to 4) is in FAST and the --full identity is not.

## Findings

1. MINOR (before launch: the reducer is frozen by the audit stamp). With HARM pooled only, a loss confined to one household
   reads MISSED, and the registered read prints no per-household figure that would show it. harm2.mjs, one household of
   eight losing paths by running out:
   - 40 of its 4,000 (1.00 point): pooled -0.125 (-0.164 to -0.086), MISSED;
   - 60 (1.5 points): HARM;
   - the same 40 spread over all eight households: also MISSED.

   The read's lines (reduce-curve.mjs readRegistered) are pooled throughout, so the maintainer would see "40 lost" but not
   that one household lost a point. That is D34's level of harm for a household, which it sends to investigation. MISSED
   still goes to the maintainer and the units hold every path, so this does not block the launch. But the read is once and
   on frozen files.

   Fix before launch: print each household's survival under both arms and its saved and lost paths by kind. Consider also
   flagging, not deciding, a household whose observed loss passes D34's 0.25 + 1.645 x se.

2. MINOR. e3pcls-guard.test.mjs's scan for unguarded direct solves matches only CANDIDATE_OPTS, FROZEN_OPTS and
   RESEARCH_OPTS (l.88). The new PHASE4_OPTS, and ASSEMBLED_OPTS, also carry e3pcls true. fail-delivered.test.mjs now
   solves PHASE4_OPTS through solvePlan and is guarded only by its marker. A later script doing the same without one would
   pass unseen. Add both names to the pattern (a protected file: at the next unlock).

3. MINOR. FAST grows by fail-delivered.test.mjs's quick form, about 8 minutes on one core: fifteen light solves of S090,
   the E5 and TSLOOP routes the slowest. That is the maintainer's unlock and my own recommendation. If the suite's wall
   time matters, one household at 3 points would keep checks 2 to 4.

## Still sound from the first review

The port (all five sites, the unmet at both flow sites with the tier variant's copy, tierBase, the formula, the refusal,
meta), the memo and E5, the chooser, the default change and its pin, and the design's arms, households, measures, seed and
budget are as the first review found them; solve.js, candidate.json, candidate.mjs, STATE.md and state.mjs are unchanged.
The gate's single menu across households is stricter than per household, but it would refuse loudly, and the review's
eight share 0.8 to 1.1.
