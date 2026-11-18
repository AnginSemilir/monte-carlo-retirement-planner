# Review at the read: the windfall factorial on today's candidate (B7-FACTORIALS.md; B7 in D51; D129; EXPLORATORY, seed 7002)

Subject: the read committed at e3431900. That is `results-windfall.txt`, the reducer's whole output ("A GAIN AND A HARM"),
and its write-up `reports/2026-11-18-windfall-read.md`.

Read (blobs at e3431900, the branch's head; the tree clean):
- The rule:
  - `B7-FACTORIALS.md` 2181352602b3 (6369b4b8, 19:18:35 UTC; its two amendments in 1d23910d, 19:31:13 UTC);
  - `WINDFALL-SPLIT.md` b3f8f7aa09e2;
  - D129 and B7 (D51) in STATE.md.
- The rule's code, each last changed in 1d23910d:
  - `b7-verdict.mjs` 18aa46587747, `audit-windfall.mjs` 6e204bf0574a;
  - `reduce-windfall.mjs` 078fd80a988f, `batch-windfall.sh` d46ba4999635;
  - `results-b7-planted.txt` 5265a75714ad, `results-b7-labels.txt` 7f1e5b107904.
- What the verdict computes with:
  - `reduce-gainbucket.mjs` f7b4e88f1fe9 (`tail`, `flipTest`);
  - `stats.mjs` a4095c8e339e (`holm`);
  - `audit-phase4.mjs` 5ace83959b96 (`runPath`, `solverPlanOf`).
- The read `results-windfall.txt` 0a2320681a5a and the write-up 45bdf5247c73.
- The launch log `results/windfall-launch-1.log`, the 34 unit logs and the 34 unit files in `results/windfall-7002`.
- The engine:
  - `src/App.jsx` e8d5c4220dd5, and the `research/engine.mjs` generated from it;
  - `src/solver/model.js` 7cfc7fec8ff9 and `src/solver/fast.js` 0e962057be54.
- The smoke's own log and units: `wf-smoke/` in the session's scratchpad, written 19:24 to 19:27 UTC.
- `reviews/2026-11-12-default-d73-2.md`, MINOR 4.

Ran (scripts in the session's scratchpad `rv-windfall/`; nothing in the tree edited):
- **The reducer and the planted checks.**
  - `node research/solver/reduce-windfall.mjs` printed `results-windfall.txt` byte for byte, the gate fair.
  - `b7-verdict.mjs --planted` ALL PASS (10); `reduce-windfall.mjs --planted` ALL PASS (11).
- **An independent recomputation from the unit files** (`recompute.mjs`). It has its own exact binomial tail (BigInt), its
  own Holm, and a sign-flip test with another generator (50,000 flips) beside a normal approximation. Also `panel.mjs`,
  the panel by path and in pounds, and `levels.mjs`, where the arms' spending levels part.
- **The engine's ISA allowance** (finding 1). A scratch copy of `research/engine.mjs` adds counters only: the year's
  deposits and staged transfers into the ISA, and each place that counts against `isaContribThisYear`.
  - Under each household's own rules: `isa-notable.mjs`, 200 paths of seed 7002.
  - Under the candidate's tables at a smoke's grid: `isa-table.mjs`, S026, 4 points, 200 paths.
  - The rebuilt plans hash as the units' inputs on 17 of 17 (`inputs.mjs`).
- **An incident.** The 4-point probe ran next to the remedy's read, which had four units of about 3.4 GB each. The
  container's memory limit was reached. About 22:30 UK the kernel killed one of the remedy's units: unit 1, S329F,
  pid 19563. `results/household-remedy-7002/case1.txt` ends "Killed", and `results/household-remedy-launch-1.log` says
  "unit 1 exited 137".
  - The batch went on to unit 4. Unit 1 has to run again: the batch's `RESUME=1`, which resumes from its saved parts.
  - I ran nothing heavier after it.

What holds (no finding):
- **The order of events.** The rule was committed at 19:18:35 UTC, and its code and both amendments at 19:31:13.
  - The launch was at 20:18 UK, from 6e053362. That commit differs from 1d23910d only in `runs.log`.
  - None of the rule's files has changed since (`git diff 1d23910d HEAD` is empty for them).
  - `stampFilesHash()` at the head gives 12d96f140e9a, the audit stamp of all 34 logs and units.
  - No unit ran before the amendments. The smoke is taken in finding 5.
- **The gate.** All 34 units and logs carry one stamp: code 603eeb595679, audit 12d96f140e9a, candidate 17ff82379838,
  seed 7002, 4,000 paths.
  - Within each household, both arms have the same inputs hash, target, retirement year, Y, deposit years and rooms.
  - Both arms have one arm A pick. On 10 of the 17 it differs from the landing's, as amendment 1 records.
  - All 34 units ran on anchors. pts 45, the levels 0.8 to 1.1, lambda, failDelivered, the raise weight 0.003, the switch
    charge 0.001, the tier state and the bequest weight 0.02 are the same on every unit.
  - windfallSplit is off on CANDD and on on CANDW, with 800 and 3,200 moves.
  - `runPolicy` beside the engine: 0 of 34,000 paths differ.
- **The verdict, recomputed.** Every household's survival and spending figures match the read's, and so do its exact
  tests, its sign-flip tests and its estate figures. The panel's figures match too:
  - survival +0.012 (se 0.0136);
  - spending -0.010% (se 0.0013);
  - the estate -£4,242 (se 1,519).

  Reading by the rule:
  - survival: no household beyond noise (the smallest Holm-adjusted p is S026's gain, 0.488);
  - spending: up on S050, S314F, S326F, S346F and S358F and down on S026, both by the reducer's test and by mine;
  - the panel's spending is down beyond 1.96 se.

  So A GAIN AND A HARM, as printed. The by-path se agrees with the independent one: the households' spending differences
  correlate with a median of 0.001.
- **The write-up's figures and counts.** Each one is the read's: +0.012, the six households' spending, +0.200 with 11
  saved and 3 lost, -£4,242, 34,000 paths, and 0.33 against 0.36 and 3.88 core-hours.
  - "The pension then the ISA on 85% to 100% of paths on twelve households" is right (S290's 85% is the lowest).
  - So is "the ISA alone (S338F, S346F, S358F)" (53%, 90% and 80%).
  - So is "kept most of it taxable (S306F, S310F)" (91% and 66%).

Verdict: FAIL

## Findings

1. **BLOCKING: the engine lets an ISA take a deposit and then a full year's allowance on top. The split's deposits reach
   this and the plan's routing mostly does not.**
   - **The code.** Lines are those of the generated `research/engine.mjs`; `src/App.jsx` has the same code at 2222, 2240
     and 2792.
     - Step 1 adds the year's deposits to the pots, with the split's entries in place of the Auto ones (2178 to 2185).
       Step 1.5 adds the staged transfers (2189 to 2197).
     - `isaContribThisYear` is declared only after that, at 2203, so it counts only what follows: the regular
       contributions (2212), the cash ISA's subscription (2220), the surplus sweep (2491), the draw-first and harvest
       re-wraps (2592, 2627), N4's CGT move (2650) and the cash ISA's shelter at 7e (2755).
     - Each of those rooms is `P.isaAllowance - isaContribThisYear[o.key]`.
     - The exact model repeats this (`model.js` 228 to 261), and so does the forward run (`fast.js` 452 to 467:
       `isa += p` at step 1, `isaContrib` from 462).
     - `buildContext`'s ledger does count a deposit against the allowance (1862 to 1920, `wrapperHeadroomAtYear`). So the
       engine counts the same allowance two ways.
   - **Under a household's own rules.** S090's pick, Windfall to ISA, routes £20,000 of its Auto deposit into the ISA in
     plan year 4. On 42 of the first 200 paths of seed 7002 the ISA takes more than the £20,000 allowance that year, by
     up to £8,471 (path 173: the deposit £20,000 and the cash ISA's shelter £8,471). This is the app's own projection; no
     other household of the 17 goes over under its own rules.
   - **Under the candidate's tables, at a smoke's grid** (4 points, the audit's options, 200 paths):
     - S026's CANDW goes over the allowance in its deposit year on 48 of 200 paths, by £78 on average and £228 at most.
       All of it is the cash ISA's shelter on top of split 1's £20,000.
     - S026's CANDD goes over on none.
   - **Its reach here.** On 15 of the 17 households the plan's routing (split 0, CANDD's) puts none of the windfall into
     the ISA. It puts £3,600 gross into the pension (S290 £31,084) and the rest into the taxable account. Splits 1 and 2
     put £20,000 into the ISA (S290 £7,533 or £16,792); this is `buildContext`'s `oneOffContribs` and `autoSplit` for
     each deposit year.
     - CANDW chose a split into the ISA on most paths of 14 of those 15. S306F is the exception, at 10%.
     - On S090 and S310F every split puts £20,000 into the ISA.
     - So on 14 households only CANDW can take the windfall into the ISA and then another allowance from the year's own
       flows.
   - **Its size here is not measured.** The units store no ISA flows, and a replay needs the 34 solves at 45 points. On
     S026 at a smoke's grid it is small. The larger households hold larger cash buffers for the shelter to take, up to
     the cash ISA's cap.
   - **What follows.** The read's effects are the split as this engine runs it, and the engine favours CANDW. The five
     gains are not shown to be the split's own. S026's harm is not explained by this, because it favours CANDW.
   - **To answer it:**
     - say this beside the gains;
     - put the defect to the maintainer with the read ("every effect beside it");
     - by CHECKLIST 7, fix it with a test of its class: a year's deposits and staged transfers into the ISA count in that
       year's allowance, in the engine, the exact model and the forward run together, with their lockstep kept;
     - measure its share of the gains before a v2 of the split, or anything else, leans on them;
     - size its reach in the app's own plans: any plan with a dated deposit into an ISA or a staged transfer into one.
     The savings factorial, queued on this engine, moves regular contributions, which the engine does count.

2. **BLOCKING: "a trade" on S026 is not what the read shows.** The write-up says "S026's -0.306%, which it trades for
   +0.200 points of survival" and "this is a trade on one household" (lines 38 to 41).
   - **Survival.** S026's survival change, +0.200 (se 0.093; 11 saved, 3 lost), is within noise by the rule: exact
     one-sided p 0.0287, Holm 0.488 (the reducer's own rows and mine). The write-up says as much at lines 19 and 20.
   - **What moves beyond noise on S026:**
     - spending -0.306% (sign-flip Holm 8.5e-4);
     - the estate +£5,882 (se 677).
   - **Nothing decomposes the change.**
     - On anchors the split's arm also differs outside its own years (B7-FACTORIALS.md item 2; the read's line 20).
       S026 is the household on which that inexact skip was measured: 31 of 3,048,192 table entries
       (`reviews/2026-11-12-default-d73-2.md`, MINOR 4).
     - The write-up does not carry that caveat at all.
   - **Where the arms part** (from the units' levels). The arms' spending levels first part:
     - after the deposit year on 2,377 of S026's 4,000 paths;
     - in the deposit year on 37;
     - before it on 12.

     The summed level difference is -8.46 points of schedule a path after the deposit year, against -0.20 before and in
     it. So the fall comes in the later years, where the arms hold different pots: the year after, CANDW's ISA is
     +£20,174 and its taxable account -£20,565. Whether the split, the anchors' shortlists or finding 1 drives it is not
     shown.
   - **To answer it.** Say what the read shows: S026 spends 0.306% less and leaves £5,882 more, both beyond noise; its
     survival change is within noise; the cause is not shown.

3. **BLOCKING: "noise-sized spending everywhere else" goes against the read.** By the rule, five households spend more
   beyond noise.
   - Holm-adjusted sign-flip p from the reducer: S050 8.5e-4, S326F 8.5e-4, S314F 2.25e-3, S346F 1.12e-2, S358F 3.70e-2.
   - Mine, 50,000 flips with another generator: 3.4e-4, 3.4e-4, 2.4e-3, 9.8e-3, 2.9e-2.
   - The normal approximation's z: 7.12, 6.06, 3.47, 3.09, 2.78.

   Without S026 the panel's spending is +0.0083% (se 0.0012; 95% +0.0059 to +0.0106, by path), up beyond noise.
   - These effects are small, "each under a twentieth of a percent" as line 40 says, but they are not noise.
   - The recommendation rests on this sentence, so the sentence cannot stand.

4. **BLOCKING: "What it leads to" gives half of B7.**
   - **What the rule says.** For a gain: "to the maintainer as a proposal for a registered test (v2), with every effect
     beside it" (B7-FACTORIALS.md line 53). D129 says "a gain to the maintainer as a proposal and a harm at once (B7)".
     This outcome holds a gain and a harm, so both apply.
   - **What the write-up says.**
     - It gives only the harm's consequence (line 36).
     - It then says "Nothing here asks for a registered test (v2)" and recommends "closing the windfall split as
       measured" (lines 41 and 42). That is the rule's consequence for NO EFFECT (B7-FACTORIALS.md line 54).
   - **Fair, and not.** The recommendation is labelled the agent's, which is fair. But the rule's own consequence for the
     gains is never stated, and "nothing here asks for" a v2 says the opposite of what B7 and D129 say. The reducer's
     line ("to the maintainer at once, every effect beside it", `b7-verdict.mjs` `leadsTo`) covers the harm.
   - **To answer it:**
     - state both consequences: the harm at once, and the gains as a v2 proposal with every effect beside them
       (finding 1 among them);
     - then give the agent's recommendation to decline the v2 and close the split, on grounds the read shows (findings 2
       and 3).

5. **MINOR: amendment 2's "Nothing has run, and no figure has been seen" (line 87) is not so.**
   - **The smoke ran first.** It ran on S026 and S090, 4 points, 100 paths of seed 7002, audit 430022bae7c1, its units
     written 19:24 to 19:27 UTC. Commit 1d23910d followed at 19:31:13.
   - **Its figures were printed and seen.** Survival: S026 CANDD 97.0 and CANDW 97.0; S090 88.0 and 87.0. All of its
     splits were "pension then ISA". The commit message says these were seen.
   - **Whether it "rests on the timings alone".** I find that it holds. Those figures say nothing about a 45-point read on
     4,000 paths, and halving the paths favours no outcome by itself.
   - **Its premise did not hold.**
     - The run's own unit times total 5.48 core-hours at 4,000 paths: solve 0.69, engine 3.89, the rest 0.90. At 8,000
       paths that is about 9.4, inside the design's 10, against the amendment's "near 19".
     - The smoke was timed with three other runs on the machine: CANDD at 113 and 116 ms a path, against 50 and 56 in the
       run.
     - The design's solve figure (0.115 core-hours a household) is the tier test's, from before D73's anchors. The run's
       CANDD solves took 77 s on average.
     - So the read has the power of 4,000 paths where its design gave 8,000, on a cost the run itself disproves.
   - **The run's times are ordered by arm.** Parts 0 to 16 are CANDD and 17 to 33 are CANDW, run four at a time, with
     other runs on the machine at the launch. So the solve ratio printed (x0.90) is not the split's cost.
   - **To answer it.** Say this in the write-up. Do not edit B7-FACTORIALS.md: the run's stamp hashes it, and so will the
     savings factorial's.

6. **MINOR: the panel's harm in spending is S026's, and depends on the weighting.**
   - **The weighting.** The reducer weights each household once and gets -0.0103% (se 0.0013). Pooled in pounds, as
     GAIN-BUCKET's corrected form pooled them (`reduce-gainbucket.mjs` lines 92 and 93), the panel is +0.0020% (se
     0.0011; -0.0001 to +0.0040): not beyond noise.
     - B7-FACTORIALS.md item 3 says "in GAIN-BUCKET's corrected form", but writes "each household counted once" for
       survival only.
     - The committed reducer decides, and the outcome is the same either way: S026's own test reads down.
   - **One household, not two harms.** "The harm is in spending: the panel's -0.010%, and S026's -0.306%" reads as two
     harms. It is one household's, and that household's lifetime spending (£495,473 a path) is among the panel's smallest.

7. **MINOR: the stamp leaves out the module the verdict computes with.**
   - `audit-windfall.mjs` `STAMP_FILES` (line 43) hashes `b7-verdict.mjs`, but not `reduce-gainbucket.mjs` (`tail`,
     `flipTest`, `FLIPS`) or `stats.mjs` (`holm`).
   - Both are unchanged since before the launch (3 Nov; 18 Nov 08:48 UTC), so this read is the launched one.
   - An edit to either would move a verdict while its stamp check passes. The queued savings factorial has the same list
     (`audit-save.mjs` line 46).
