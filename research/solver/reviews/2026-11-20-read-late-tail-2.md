Verdict: PASS

# Review at the read, second round: the late tail (`LATE-TAIL.md` and its amendment 1; EXPLORATORY, seed 7002)

Subject: the fix round on my FAIL (`reviews/2026-11-20-read-late-tail.md`): 14c04485 (the first outcome withdrawn);
be0ac7e9 and f3094f1b (amendment 1); the CEIL re-run (`results/late-tail-7002-ceil`, `results/late-tail-ceil-launch-1.log`);
d9aa0055 (`results-late-tail-2.txt`); 3ca41b2b (the write-up, STATE.md line 299, `DECISIONS-PENDING.md` item 1).

Read (blobs at HEAD 3ca41b2b): `LATE-TAIL.md` b0c41dd700b9; `audit-late-tail.mjs` 6c79118fb9e8; `reduce-late-tail.mjs`
60266d44abdd; `results-late-tail-2.txt` f94956ec671a; `reports/2026-11-20-late-tail-read.md` 9fa1a3950f39;
`DECISIONS-PENDING.md` 2ebd9ed5d319; STATE.md cbc0bdaaa1df; the re-run's ten unit files and `case0.txt` to `case9.txt`;
`research/engine.mjs` lines 2785 to 2795.

Ran (at nice 19; my scripts in the session's scratchpad; nothing in the tree edited; seed 7002 only):
- `node research/solver/reduce-late-tail.mjs research/solver/results/late-tail-7002 --ceil research/solver/results/late-tail-7002-ceil`:
  the same as `results-late-tail-2.txt` byte for byte. The stamp of the files now is 5bbb8c62b042, the re-run's.
- `--planted`: the read ALL PASS (15); the audit, all 8 read as they should.
- `git diff 180432fe f3094f1b` over every stamped file and every code file: only `LATE-TAIL.md`, `audit-late-tail.mjs` and
  `reduce-late-tail.mjs` changed between the two launches.
- A recount from the unit files, independent of the reducer (`lt-check-2.mjs`): every rule and beside figure below.
- The plant at smoke settings: finding 3.

What holds:
1. **Finding 1 is answered.**
   - The recorder passes every argument (`recorded`, `choose(es, t, ...rest)`). The audit's planted case gives `3 2`: the
     recorder hands on three arguments, the planted one two.
   - Check 5 passed on CEIL in all ten re-run logs. Its plant fails it (finding 3, my run).
   - The re-run's units carry the amended stamp 5bbb8c62b042. They were launched from f3094f1b at 16:29 UK, after both
     amendment commits (16:08, 16:17).
   - Each unit is CEIL alone, on the first run's code, seed, paths, points, Node, household table (by digest), horizon and
     first year. The first run's K2, HSPA, L and R each equal the same arm without the recorder, bit for bit, on 200 paths
     (each log's check line; each unit file's `checks.bare` and `checks.first`).
   - The second read's gate is fair on exactly the two stamps.
   - My recount reproduces every figure:
     - D `£52,873`; L `-97.2%`, R `136.8%`, CEIL `-21.1%`;
     - net paths lost against K2 pooled over the seven: HSPA 28, L 745, R 351, CEIL 46;
     - survivors on the worst tenth pooled `0/1,877/1,852/1,335/1,618/1,841`;
     - APP's paths at nought and the highest taken, as printed.
   - CEIL's worst-tenth pots equal my first round's probe to the pound.
   - The outcome follows. R explains the shortfall, and neither L nor CEIL does. That is THE GROWTH without CEIL NEAR K2,
     so the build goes on (`LATE-TAIL.md` lines 74 to 76).
   - The outcome is firm. CEIL's margin below half of D is `-£37,615` (se `£3,156`). Leaving any one unit out, CEIL reads
     `-10.6%` to `-26.5%` of D. R and L stand as in my first round.
2. **Findings 2 to 6 are answered in the write-up.**
   - Finding 2: R is given as a lead, the causal sentences are gone, and the survivors and risk lines are beside it
     (lines 41 to 48).
   - Finding 3: the controls do not show one trade (lines 64 to 67), and option (b) is gone from the pending list.
   - Finding 4: what L is (lines 55 to 59).
   - Finding 5: what the worst tenth is (lines 60 to 63; results line 26).
   - Finding 6: M1's unit on the beside's lines (lines 68 to 73).
   - Each figure is printed in `results-late-tail-2.txt`, except `+0.762` (`results-household-hsp.txt` line 6) and the run
     times and stamps, which are in the launch logs.
3. **STATE.md's line says no more than the read shows.** `DECISIONS-PENDING.md` item 1 carries what the maintainer needs:
   the fault, both reads, what the rule decides, and the trade beside it. Its wording is in findings 1 and 2.

## Findings

1. **MINOR. "CEIL charged nothing for a switch of risk" misdescribes the fault.**
   - Where: the write-up line 19 and `DECISIONS-PENDING.md` line 18 (and amendment 1's own account in `LATE-TAIL.md`).
   - The engine charges every tier switch at the policy's `switchCost`, whatever the chooser weighed (`engine.mjs` lines
     2785 to 2795, `switchPaid`). The dropped argument took the charge out of the chooser's scoring only (`solve.js` lines
     1905 and 2019). So the first CEIL chose as if a switch were free, and still paid for each one.
   - What answers it: "its chooser weighed no charge for a switch; the engine still charged each one", in the write-up and
     the pending list. `LATE-TAIL.md` is in the audit's stamp, so its amendment stays as committed.

2. **MINOR. The pending list says a little more than the read shows.**
   - Line 22 says flatly that "the table does not read the couple as safer than it is". The write-up gives it as the rule's
     reading (line 50, "By the rule").
     - The read shows it by one measure: on the worst tenth, the household table on its own plan ends no nearer K2 than
       HSPA does.
     - It does not test the gap the deep review found in step 8's records: HSPA's forecast above what it delivers on four
       of S273's units, by 0.52 to 0.82 points (`reviews/2026-11-20-deep-household-hsp.md` line 163).
   - Line 28 says "Holding couples to the late pot more strictly". The rule's words are "to survival more strictly than
     singles" (`LATE-TAIL.md` lines 75 to 76), and on these seven the loss is in paths as well (28).
   - The pending list names THE GROWTH without saying what it is.
   - What answers it:
     - "by the rule's measure" on line 22;
     - the rule's words on line 28;
     - half a line on THE GROWTH: R, HSPA's move with K2's tiers, restores the worst tenth's pot. It is a lead, and R keeps
       fewer paths than HSPA on every unit.

3. **MINOR. Check 5's planted failure is not in any results file.**
   - The write-up (line 25) says the plant failed check 5 on both units tried in the smoke. A search for `recorderdrop`
     over the results files finds nothing.
   - I reproduced it. `LT_PTS=6 LT_N=30 LT_ONLY=S273-own LT_OUT=<scratchpad> LT_PLANT=recorderdrop node
     research/solver/audit-late-tail.mjs run part 0/1` exits 3 with "audit-late-tail: S273-own CEIL: the recorded arm
     differs from the same arm without the recorder (survived at path 1)".
   - What answers it: the smoke's output kept in a results file (CHECKLIST 5), or this review cited.
