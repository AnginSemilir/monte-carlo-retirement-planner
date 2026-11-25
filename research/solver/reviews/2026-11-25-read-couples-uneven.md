Verdict: FAIL

# Review at the read: the household route at uneven holdings (`COUPLES-UNEVEN.md`, EXPLORATORY, seed 7002), read 25 Nov

**Subject.** The read `results-couples-uneven.txt` (d42a26c1f4de: PA2 EXPLAINS IT), its write-up
`reports/2026-11-25-couples-uneven-read.md` (5d640a221d3f) and STATE.md section 5's line, as committed in c24c8ba4. The read
was written by `REG=1 node research/solver/reduce-couples-uneven.mjs <the main tree's results/couples-uneven-7002>` from the
worktree `/home/user/couples-uneven-read` at 03d91f0a, after a first attempt from the main tree was refused at the gate.

**What I read** (git blobs, first 12):
- the rule `COUPLES-UNEVEN.md` 5799b2c5d20b and its source, `reviews/2026-11-25-deep-couples-any.md` 22f33e0470f1 (sections 2
  and 3);
- the machinery: `audit-couples-uneven.mjs` 551c116927e6, `reduce-couples-uneven.mjs` 95b6b4d03876 and
  `batch-couples-uneven.sh` db6b4febf5a7. `git diff 58e29bbd c24c8ba4` on these three and on the rule is empty;
- what they reuse, at 03d91f0a: `audit-couples-any.mjs` 2287e10c87a7 (`CONFIG`, `KEYS`), `couples-any-panel.mjs`
  08edadc2eaef, `reduce-phase4.mjs` ac319aad1f44 (`byPath`, `survivalItem`), `reduce-share-rules.mjs` b46fa5187e99 and
  `reduce-couples.mjs` cae05c5a8e75 (`harmExact`, `harmOf`), `reduce-household-hsp.mjs` 153cbfeebc48 (`keptSpend`),
  `reduce-couples-open.mjs` 6a4a5735fe55 (`m1ByUnit`), `fair-gate.mjs` c6b3e87e1643, `audit-phase4.mjs` 5ace83959b96
  (`runPath`) and `run-from-snapshot.sh` cf7ab99bb4ec;
- the app's code at 03d91f0a: `src/solver/household.js` 94aca9051d20 (the forms, l.86 to 99; `assembleHousehold`, l.492 to
  511; `pensionsShare` and `chooseHouseholdSingle`, l.653 to 696), `src/solverCouple.js` cc5152b54a13 (l.126 to 143),
  `src/solverStrategy.js` f102cb2864a8 (`solvedContext`, l.46) and `src/App.jsx` dccf2fc5823b (the joint move's split,
  l.2610 to 2628);
- STATE.md 8a4c3018c891 (D134 l.33, D145, D148 l.19, section 5 l.296), `DECISIONS-PENDING.md` 833431100507, `LATE-TAIL.md`
  b0c41dd700b9, `results-pricing-fix.txt` 983a2b46560c with its beside file f10c0a55f6a2, and the 7027 write-up
  `reports/2026-11-25-couples-any-read.md` (its Next, l.203 to 222);
- the run: the launch log, the 28 unit logs and 28 records in `results/couples-uneven-7002`, the snapshot
  `/tmp/solver-snap-xQIQYH`, and the worktree, clean at 03d91f0a.

**What I ran.** Nothing here solves, runs a path or runs a batch. All of it comes after the read and decides nothing. The
scripts (r1 to r10) are in `/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/cu/`,
and each imports the worktree's own files.
- **The read again** in the worktree: byte for byte the results file (`diff` empty).
- **`--planted`:** the reducer prints `ALL PASS: 11 planted checks`. The audit prints `ALL PASS: 4 planted checks`, with 28 of
  28 units' PA2 plans clean.
- **The reducer on the main tree:** `THE GATE: REFUSED`, the stamp line and 112 configuration lines (four household arms on
  28 units), and no figure.
- **The stamps.** `stampFilesHash()` and `code-id.mjs` give `audit 1f70d72e8cf9 code d91a642206b9` in the worktree and in the
  snapshot, and `audit c8f3b3416f5a code d91a642206b9` on the main tree (the same in a `git archive` of c24c8ba4). Of the
  stamped files, the main tree differs from the worktree in exactly `src/couplesSwitch.js`, `src/solverCouple.js` and
  `src/solverSettings.js`.
- **The trees.** `diff -rq` of the snapshot against `git archive 58e29bbd` shows only the built `simplePlan.mjs`. 58e29bbd and
  03d91f0a differ only in STATE.md and runs.log. The built `research/engine.mjs` has one sha256 (48cb9eb1...) in all three
  trees.
- **The arrays**, with the reducer's own `loadDir`, `kindsOf` and `riseOf`: each arm's tax a year at each holding; each arm
  against ROUTE and against APP; where the lost paths fail; and M1's own rule with each arm in ROUTE's place.

The read stands. The way it was read is sound, the arms and checks are the rule's, the reducer applies the rule, and every
figure in the write-up is the file's. The FAIL is finding 1. The write-up leaves out what the rule was written to settle,
M1's two names, and the part of the rule that sends them to the maintainer with this read. The maintainer accepted them in
D148 before the read, and by the read they are, in ROUTE's part, the cost of the pricing gap D145 (2) left in the route.

## What holds

1. **How it was read** (the question put to me). It is sound, and the write-up (l.9 to 16) says it truthfully.
   - The units' stamp, `code d91a642206b9 audit 1f70d72e8cf9`, is what the worktree computes. 03d91f0a's `src/` and
     `research/` are the launch snapshot's (taken from 58e29bbd, the rule's commit) but for STATE.md and runs.log. So the
     reducer that read is the one the units were stamped with.
   - The gate's configurations are the launch's too. `configOf` hashes `audit-couples-any.mjs` `CONFIG`, whose ROUTE carries
     `couple: APP_COUPLE` (l.68), the object whose `takeShapes` D148 widened.
   - From the main tree the gate refuses before anything is computed (reducer l.171 to 172), so the refused attempt read no
     figure. Reading where the stamp holds, rather than loosening the gate, was the right course, and the read reproduces
     there byte for byte.
2. **The run.**
   - All 28 logs open with one stamp line (`... prediction none sha -`, Node v22.23.4), and each ends in its done line.
   - The launch log has no `exited` line and ends `runs done 25 Nov 09:48 UK`.
   - The rule and machinery were committed at 07:40 UTC (58e29bbd), before the launch at 07:46.
3. **The arms are the rule's.**
   - PA2 and FIX are `solveAt` (audit l.98 to 104) at the forms 'pensions' and 'pensionsPAown'; otherwise each is the
     registered `solveRoute`. SPLIT is ROUTE's own solve with `split: 'pensions'` (l.106), which `chooseHouseholdSingle`
     reads (household.js l.683 to 684).
   - Each household arm runs the couple's own plan in the engine (`assembleHousehold` keeps the couple's `plan`, and
     `solvedContext` builds on it), so only the table differs. The four household arms' recorded engine inputs are the same
     on 28 of 28 units.
   - The checks hold in every log:
     - check 1, the digest and k: I matched five units against the registered run's and the pilot's records;
     - check 4: the allowance moves by (2 - k) x £12,570, `4190.00` at k 1.6667 and `8380.00` at 1.3333 (arithmetic), and
       FIX's plan differs in 25 years of the partner's own income;
     - check 3: SPLIT parts from ROUTE on 3,958 to 4,000 of 4,000 paths at 25/75 (the check needs one);
     - checks 2 and 5 are recorded on every unit.
4. **The rule and its outcome.**
   - `riseOf` (reducer l.57) takes each kind's difference a year on each path and averages the kinds on that path (`byPath`,
     reduce-phase4.mjs l.116 to 123), as the rule's l.58 to 61 say. `explains` (l.58) is the rule's two bars. `rule` (l.59 to
     66) is its premise and outcomes, with BOTH taking the smaller rise first. The gate (l.115 to 131) and `requireFairLogs`
     (l.174) are the rule's gate.
   - From the reducer's own `rule`:
     - D is `437.42` (`434.69` to `440.14`), so half of D is `218.71`;
     - PA2 is `2.68` (`1.52` to `3.83`): 2.68 is at most 218.71, and 3.83 is below 437.42 (arithmetic);
     - SPLIT is `439.61` (`436.93` to `442.29`), above 218.71.
     - So PA2 EXPLAINS IT follows, far from either bar, and the outcome line is the rule's own wording (results l.7).
   - The figures hold in each block of 1,000 paths: D 435 to 439, PA2 2 to 3, SPLIT 438 to 441. The first 1,000 paths give D
     `+£436.9`, the deep review's `+£437` on the pilot.
5. **The write-up's figures are the file's.**
   - D and the table (l.43 to 49) are results l.3 to 6.
   - The kinds (l.60 to 63), from results l.10 to 25:
     - ROUTE runs from +£161 (Rp3t) to +£705 (Ri2s, Ri2t) and is positive on all 14;
     - PA2 runs from -£44 (Rp3t) to +£118 (Ri3s);
     - FIX is -£149, and APP is -£352, or +£35 on its eight same-pick kinds.
   - The spending and pot table (l.67 to 73) is results l.27 to 31. The table against APP (l.77 to 82) is l.33 to 36.
   - D34 (l.86 to 92), counting results l.38 to 65:
     - PA2 is flagged on 10 units, where it loses 696 paths and saves 132 (23+108+60+85+62+56+58+85+79+80 and
       1+3+8+7+4+19+18+22+28+22, arithmetic);
     - FIX is flagged on 13: PA2's ten, and Rp2t-own, Ri3s-own and L-own;
     - SPLIT is flagged on none;
     - of PA2's ten, six are at 25/75 and four at 60/40, all two or three profiles apart.
6. **Two readings the arrays bear out.**
   - "Changing that allowance alone (PA2) takes the rise from `+£437` to `+£3`" (l.96 to 97). PA2 removes the excess at
     25/75; it does not add tax at 60/40. ROUTE pays £278 a year at 60/40 and £715 at 25/75. PA2 pays £274 and £277 (r1).
   - "Moving the split alone (SPLIT) changes neither" (l.97 to 98). SPLIT's rise less ROUTE's, paired by path, is +£2 (+£2 to
     +£3) a year. Its spending on the paths both keep is +0.016% against ROUTE's at 60/40 and +0.012% at 25/75 (r1, r6).

7. **The other readings in the write-up hold, and the read prints what the rule asks.**
   - "It shows that the pricing is not free" (l.99 to 100). A D34 flag is a loss past the threshold set for a quarter-point
     loss to be flagged at most 5% of the time, so ten flags are a loss and not noise.
   - "The even split is not the cause" (l.53). PA2 removes the rise with the even split kept, and SPLIT moves it by +£2.
   - "loses paths against ROUTE where the two people's risks differ widely" (l.91 to 92) says where the flags fall, which is
     so; it does not say why, and the write-up says the read does not show why (l.106 to 107).
   - Every item of the rule's read and its "beside" list (COUPLES-UNEVEN.md l.55 to 87) is printed (results l.3 to 65). What
     the write-up leaves out is the rule's clause about M1 (finding 1).

## Findings

1. **BLOCKING. The write-up never says what the read means for M1's two names, which the rule was written to settle. It also
   quotes the rule's "in every outcome" clause without the part about them.**
   - **What the rule asks.**
     - Its purpose (COUPLES-UNEVEN.md l.5 to 6): "It settles what M1's two names on the registered read are made of, which
       goes to the maintainer with that read before any default changes."
     - In every outcome (l.77 to 79): "M1's two names go to the maintainer before any default changes, with this read beside
       them; R's, L's and P's change of default is drafted beside it".
     - Its source, the deep review, under PA2 explains it (l.308 to 309): "M1's two names are that gap's cost plus the app's
       better rule at 25/75, not a survival trade. The D-line says so, and the maintainer's word on them is a word on that
       gap, which D145 (2) left in the route."
     - The 7027 write-up's Next (l.217 to 218) said the maintainer would have, before any default changes, "the two units M1
       names, with the deep review and the test's read".
   - **What happened.**
     - The maintainer's word on M1's names came before this read: D148 (STATE.md l.19) accepted "both units' shortfalls".
     - The change was committed (84f0aac7, 09:20 UTC) before the runs ended (09:48 UK), and D148 held `main` until the read.
     - So a ruling that was the maintainer's to make overtook the rule's order. What is left of the clause is for the read
       to reach the maintainer beside M1's names, and that has not happened.
   - **What the write-up says.**
     - It never names M1 or the two units.
     - l.55 to 56 quote the clause's first part, and l.116 its last ("By the rule, no outcome stops it"). The middle part is
       left out.
     - l.117 to 118: "It goes on to the reviewer on the change of default and B1's gate. This read was its last condition
       before `main`."
     - l.114 to 115 send only the next pricing build to the maintainer, "with this read (`DECISIONS-PENDING.md`)". But
       `DECISIONS-PENDING.md` (833431100507) has not changed since 8e74a47f, before the 7027 read, and holds nothing on this
       read, D148 or M1.
     - STATE.md l.296 says the same: the two reviewers, then B1's gate.
   - **Why it matters.**
     - The read prints the two names' kinds. On Rp1t, ROUTE's rise is +£525 and PA2's -£11. On Ri1s they are +£539 and -£20
       (results l.20 and l.13).
     - So by the read, ROUTE's part of each name is the table's allowance at k. That is D143's gap, which D143 meant to fix
       as its own change and D145 (2) left in the route when the fix lost paths.
     - The rule's "beside" list dropped the deep review's "each arm against APP at 25/75: M1" (deep review l.299), so the read
       cannot settle the names by itself.
     - Post hoc the arrays say more (r6, r9: this run's arrays, seed 7002, already read; a lead and not a result):
       - M1's own rule (`reduce-couples-open.mjs` `m1ByUnit`) names exactly the registered read's two units under ROUTE:
         S041-Rp1t-Y75 (519 paths kept net; spending on the paths both keep `-1.0706%`, `-1.2117` to `-0.9296`) and
         S041-Ri1s-Y75 (472; `-0.4909%`, `-0.6206` to `-0.3612`).
       - With PA2 or FIX in ROUTE's place it names none. On the two units PA2 spends `+0.7616%` and `+1.4299%` more than APP
         on the paths both keep, and keeps 524 and 486 paths net against APP.
       - The price is survival elsewhere. PA2 less ROUTE is `-0.537` points (`-0.656` to `-0.419`) at 60/40 and `-0.507`
         (`-0.632` to `-0.382`) at 25/75, by path, beside the read's ten flags.
     - That is the trade the maintainer took in D148 without seeing it.
   - **Fix.**
     - In "What follows", and in STATE.md's line, give the whole clause.
     - Say that D148 took M1's names before the read, and say what the read says of them: the two kinds' rises from the
       file, ROUTE's part of each name being D143's gap that D145 (2) left in the route, and no M1 by arm in the read.
     - Put the read to the maintainer beside D148 before `main`, in the `DECISIONS-PENDING.md` entry the write-up already
       cites.
     - Drop "This read was its last condition before `main`", or say that the maintainer's word, with this read beside it,
       comes first.
     - Before the write-up quotes any figure of M1 by arm, print it by a script into a results file beside the read
       (CHECKLIST 6).

2. **MINOR. The D134 paragraph (l.102 to 105) argues for more than the test can show.**
   - **What is right.** The first two sentences say the test has no arm that reads a table against the engine, so it cannot
     show D134's stop, or its absence. D134's stop was read through CEIL, the household table on its own plan (LATE-TAIL.md
     l.69 to 70 and l.77 to 78), and no arm here is CEIL.
   - **What is offered as support but is not a table against simulation.**
     - "The table at k prices more tax than the two-allowance table" compares two tables. It is true by construction: check
       4 moves every threshold by the same amount, so ROUTE's schedule is PA2's moved down. At S041's incomes that makes the
       pricing at k err towards more tax than the couple pays, so it is not the part that would make ROUTE's table read the
       couple as safer. That is all it shows.
     - "At 25/75, ROUTE's survival gain over APP is above both pricing arms'" compares the outcomes of policies. The figures
       are points whose intervals overlap (results l.33 to 36).
   - **What the arrays hold on it** (post hoc, r4; a lead).
     - Every path PA2 loses against ROUTE fails in the plan's last years: 931 of 932 in plan year 27, the last, and 910 of
       them with no spending unmet, so ending below the minimum pot.
     - FIX's lost paths are the same: 1,495 of 1,509 in plan year 27, and 1,445 with no spending unmet.
     - That is the late tail D134's test took apart (LATE-TAIL.md l.12 to 13), and what the pricing fix's beside file found
       (l.38). Whether it is a trade made on a right reading or a misreading, nothing here measures.
   - **Fix.** Say plainly that the test cannot speak to D134's stop. Keep the two sentences, if at all, as what they are.
