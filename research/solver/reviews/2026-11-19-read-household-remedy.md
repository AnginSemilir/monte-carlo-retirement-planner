# Review at the read: the household plan's remedy (HOUSEHOLD-REMEDY-READ.md as amended; D129 (3); EXPLORATORY, seed 7002)

Subject: the read committed at 9ceb99e5: `results-household-remedy.txt`, the reducer's output whole (HSPB DOES NOT MEND,
HSP MENDS, HSPS DOES NOT MEND; the arm taken HSP), the figures beside it, and its write-up
`reports/2026-11-19-household-remedy-read.md`; whether the read was made by its rule as committed before any unit ran; and
the record (STATE.md section 6 action 3, DECISIONS-PENDING.md item 1).

Read at e25ec719 (work-i58m0x). Three commits landed while I read (30e3083d, 3e76d443, 3ec9faec: step 8's drafts). None
touches a file below, and the remedy's lines in STATE.md and DECISIONS-PENDING.md item 1 are the same in them.

Read (blobs at e25ec719):
- the rule and the design: `HOUSEHOLD-REMEDY-READ.md` f9292cd0753b, `HOUSEHOLD-REMEDY.md` efa6fb4c4592 (each with its
  amendment 1); D129 and D116 in STATE.md b21c4ef87d50; DECISIONS-PENDING.md fd4b96c25281; `runs.log` e59d4cfbede4.
- the code: `audit-household-remedy.mjs` 8c8df6cfd44c, `reduce-household-remedy.mjs` c17bdaa984ae,
  `batch-household-remedy.sh` 59812df3bbc6, `household.mjs` 83df4db5009b (`SINGLE_GROUPS`, `SCALED`, `pensionsSplit`,
  `bandsAt`, `householdPlanFor`'s `opts.scale`, `solveHousehold`, `pensionsShare`, `chooseHouseholdSingle`),
  `household-remedy-beside.mjs` 470323612519, `research/tests/household.test.mjs` 609eb6ac43bd (groups 9 and 10); what
  they import: `audit-household.mjs` f40361acbe6c, `audit-phase4.mjs` 5ace83959b96 (`runPath`), `reduce-household.mjs`
  2a762db28f98 (`armOf`, `cells`, `spendOn`), `stats.mjs` a4095c8e339e, `fair-gate.mjs` c6b3e87e1643,
  `audit-household-decomp.mjs` 01333c239c85; `src/solver/model.js` (a couple's `action.split`, line 464).
- the results: `results-household-remedy.txt` 85efb2a0eba1, `results-household-remedy-beside.txt` dec27c6ad79c,
  `results-household-remedy-planted.txt` 9062d4392160, `results-household-test.txt` 23012cf0b5ea,
  `results-household-decomp.txt` 275a35a60e13, `results-household-decomp-beside.txt` 9b742e1b3eeb, the decomposition's
  review 414631a25b10 (its finding 4).
- the run: `results/household-remedy-launch-1.log` f31628b3a817 and `-launch-2.log` 6532023ee22f;
  `results/household-remedy-7002/` (28 unit files, `case0.txt` to `case27.txt`, `parts/` empty; `S191-90.json.gz`
  0e775d77f1a1, `S329F.json.gz` c548e355b340, `S023-db.json.gz` 70677f306acb, `case1.txt` 1873530eb35d, `case16.txt`
  2e5b8e4d80f9); the lead test's and the decomposition's S191-90 unit files (bb31f810f976, eb3c3521d787). Every path
  read is seed 7002's.

Ran (each at `nice -n 19`, `free -g` showing 10 GB or more free; at most 200 paths of one household a probe):
- `node research/solver/reduce-household-remedy.mjs`: `results-household-remedy.txt` byte for byte, the gate fair.
  `--planted`: ALL PASS (14), as the committed file.
- `node research/solver/household-remedy-beside.mjs`: `results-household-remedy-beside.txt` byte for byte.
- My own Clopper-Pearson (exact binomial tails, bisection; not `stats.mjs`) for the three units under each arm.
- A probe (`probe-remedy.mjs` in my scratchpad, deciding nothing): a remedy arm's household table solved afresh in a new
  process, its digest against the unit file's, then the arm run by `runPath` on chosen paths in another order than the
  audit's, all seven stored keys compared with the unit file's arrays.

Verdict: PASS

## What I checked

1. **Committed before any unit ran.** The design 5b1eeed4 (18 Nov 20:23:30 UTC); the rule with its audit, batch and
   reducer f0d009b3 (20:28:58); the decomposition's review, whose finding 4 the amendments cite, 4e9c978b (20:37:41);
   both amendments with `household.mjs`'s build f93612fd (20:40:26); the last change to a stamped file d7f74d65 (20:49:06:
   the reducer's import of `UNITS` and its smoke line; by its commit message the smoke, at 6 points and 40 paths, printed
   no figure). `runs.log`: launched 18 Nov 22:17 UK (UTC in November) from e23af4ac; unit 1 relaunched 19 Nov 00:19 UK
   from 704a2b7a.
   `git diff d7f74d65 704a2b7a` and `704a2b7a HEAD` over the stamp's twenty files, `research/engine.mjs` and
   `src/solver`: empty. All 28 logs carry one stamp line (`code 603eeb595679 audit e0b1524d8f6b prediction none`) and a
   done line. The read (9ceb99e5, 00:40:47) follows unit 1's end (00:35).
2. **The rule read as written.** `armRule` (lines 96 to 102): part 1 `hi >= -0.3` on each of the three ("does not lie
   wholly below"); part 2 the pooled interval's `lo > 0`, no unit with `hi < -0.3`, pooled spending on the paths both keep
   `>= -0.05`; the outcome the first that holds; the arm taken `NEW.find(MENDS)` over HSPB, HSP, HSPS (line 105), the
   amendment's order (the header comment's order is wrong, as the write-up says). HSPB fails part 1 on S191-90 alone (its
   upper end -6.716; S333F +0.049 and S335F -0.031 clear the bar); HSP holds both parts; HSPS fails on S191-90 alone
   (-0.314). Each arm is what the design says: `solveHousehold` returns the couple's plan as `plan` and the household's as
   `hplan`, and the audit's `ctxOf` runs the engine on `plan`; S191-90's recorded plans (k 1.1111) have the allowance at
   25,140 in both forms, every SCALED limit at 2 x PA + k x (L - PA) (the basic limit 67,028.89, the taper threshold
   122,284.44), the cap 536,550 in 'bands' and 298,083.33 in 'pensions', every other entry HS's, and a band for gains of
   41,888.89 in both against a person's 37,700. A couple's `split` is the share of the need the first person funds
   (`model.js` line 464), so HSPS is what it says.
3. **S191-90's margin.** By `survivalChange` (10 saved, 35 lost of 4,000): -0.625 (-0.8729 to -0.2905). My own
   Clopper-Pearson agrees to four places. One more lost path gives an upper end of -0.337, one fewer saved -0.323: one path
   decides the outcome, as the write-up says. The interval D112 fixed (`survivalChangeU`, Newcombe's method 10; cells 3,870,
   35, 10, 85) gives -0.982 to -0.2946, also clear of the bar (by 0.22 of a path), so the choice of interval does not move
   it. K2's and HS's 4,000 paths on S191-90 were run again whole by the decomposition's audit and held to the lead test's
   arrays byte for byte (`audit-household-decomp.mjs` lines 183 to 186). This run's audit re-ran their first 200. My probe
   solved S191-90's 'pensions' table afresh: the unit file's digest. HSP's 45 discordant paths, path 928 (where HSPS
   differs) and HSP's nearest survivor to the minimum pot (path 3453) were run in reverse order with no path before them:
   47 of 47 are the unit file's on all seven keys. Nothing in the gate, the stats or the arms that I could check moves the
   count. Beside, for step 8: the count sits on paths that end close to the `£112,900` minimum pot after 40 years. HSP
   loses path 986 by ending `£373` short of it, and keeps paths 2346 and 1878, which K2 ends `£808` and `£1,081` short.
   HSP still loses 25 net paths there, beyond noise, as the write-up says.
4. **The resume.** Launch 1's log has "unit 1 exited 137" and no other unit exiting. `case1.txt` (the rerun's log) carries
   the same stamp, K2's and HS's first 200 paths the lead test's again, and "resumed HSPB at path 3000 of 4000, from a part
   saved by vm:19563:1795040271061". The unit file's HSPB chunks 0 to 3000 come from that process and 3000 to 4000 from
   vm:25555; HSP and HSPS come wholly from vm:25555. The resume needs the same code and audit stamp, seed, paths, points and
   chunk, all five tables' digests and the options (audit lines 151 to 157). The new process then held the saved paths 0
   to 199 to `E.runTrial` (line 173). My probe solved S329F's 'bands' table afresh: the unit file's digest. HSPB on paths
   200 to 249 and 2900 to 2999 (the killed process's part) and 3000 to 3049 (the rerun's): 200 of 200 are the unit file's
   on all seven keys. The resume is sound. It reaches only HSPB on S329F, which decides nothing in the outcome. That the
   kernel killed it for memory is as recorded, not checked: exit 137 is any SIGKILL, and the kernel's log did not survive
   the container's restart.
5. **HSB against HSPB.** `SINGLE_GROUPS.bands` holds `personalAllowance` (`household.mjs` line 58). `SCALED` does not (line
   86), and `householdPlanFor` doubles the allowance under `opts.scale` (line 183). The recorded plans agree: HSB 12,570,
   HSPB 25,140. What else differs is finding 2.
6. **The record.** STATE.md section 6 action 3's remedy lines and DECISIONS-PENDING.md item 1 match the results files
   figure for figure. So does every figure in the write-up, but one count (finding 2).

## Findings

1. **MINOR. The planted checks do not pin which end of the interval the unit bar reads, and that reading decides this
   read.**
   - The plant "a unit of the three 0.2 points below K2" (8 lost, none saved) has its point, lower end and upper end at
     -0.200, -0.200 and -0.052, all above the bar. The 7.5-point plant has all three below it (-7.500, -7.500, -7.317).
   - I copied the reducer to my scratchpad and switched `armRule`'s two comparisons (lines 98 and 99) to `h.ch.d`, then
     to `h.ch.lo`. `--planted` still prints ALL PASS (14) each time. On the units, either reading would make HSP DOES NOT
     MEND (S191-90 -0.625 and -0.873).
   - The code reads `hi`, as the rule says, and the figure is right (check 3), so the outcome stands.
   - For step 8's reducer, which reads a bar the same way: plant a unit one path each side of its bar.
2. **MINOR. "Why the bands alone do not mend S191-90, where the decomposition's did" reads as a cause that no run shows.
   Each sentence in it is right.**
   - The two runs' recorded plans for S191-90 differ in more than the personal allowance:
     - the allowance itself, 12,570 in HSB against 25,140 in HSPB;
     - every limit SCALED names. HSB's bands above the allowance are one person's, and HSPB's are k = 1.111 times that:
       the basic limit is 50,270 against 67,029, so 37,700 against 41,889 above the allowance; the taper threshold is
       100,000 against 122,284;
     - the band for gains, 37,700 against 41,889.
   - The cap is 536,550 in both.
   - No run separates which of these carries HSB's 98.13% against HSPB's 90.63%. Say that they price these three things
     differently, and that which one carries the mend is not measured.
   - The plain-words line that the decomposition found the losses "resting on the doubled income-tax bands" leaves out
     that it read S191-90 and S335F EITHER. The cap single alone recovered 56.7% and 64.8% of their lost paths
     (`results-household-decomp.txt`). HSP needing its cap on S191-90 is in line with that.
   - In the same section, "the widest of the 84 remedy tables" counts arm-unit forecasts. HSP and HSPS read one table
     (the gate checks it), so there are 56 tables.
3. **MINOR. The pot line applies M1 to the pooled figure, where M1's condition holds. Unit by unit, the condition fails
   on one unit whose pot is smaller.**
   - On S023-db, HSP against K2:
     - keeps more paths (+3.050);
     - delivers less spending on the paths both keep, the rule's own measure: -0.174%, se 0.042 (over all paths
       +0.095%, se 0.048);
     - leaves a capped pot 13.06% smaller, -£476,417 a path, the largest fall in pounds of the 28.
   - D116 says a smaller pot is not a harm only "where the household plan keeps more paths and delivers no less
     spending". On the rule's measure that does not cover S023-db.
   - S167 also spends less on the paths both keep (-0.621%, se 0.019), but its pot is larger (+0.90%).
   - These figures come from the unit files, through the reducers' own `spendOn` and `cappedOf`, in a script in my
     scratchpad.
   - The rule's beside list promised "the capped pot, pooled and by unit". The reducer prints it pooled only, which is
     how this was missed.
   - Name S023-db beside the pot line. Step 8's rule carries the pot's ruling, so it has to say whether M1 is read pooled
     or unit by unit.
