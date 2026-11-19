# Review at the read, second round: the windfall factorial on today's candidate (B7-FACTORIALS.md; B7 in D51; D129; EXPLORATORY, seed 7002)

Subject: the write-up `reports/2026-11-18-windfall-read.md` as corrected in d32f4ed1 and added to in b357a685. I checked it
against my first round (`reviews/2026-11-18-read-windfall.md`: FAIL, four BLOCKING and three MINORs), the results files and
the code. Also the check b357a685 added, that the engine defect cannot reach the savings factorial
(`save-isa-deposits.mjs`, `results-save-isa-deposits.txt`), and the same claim in DECISIONS-PENDING.md item 8 and STATE.md
section 6.

Read (blobs at b357a685, the branch's head):
- The write-up 5b1061ab9a98; my first round 2c9af14853df.
- The rule: `B7-FACTORIALS.md` 2181352602b3, `WINDFALL-SPLIT.md` b3f8f7aa09e2, `b7-verdict.mjs` 18aa46587747. None of the
  rule's files has changed since 1d23910d.
- The read: `reduce-windfall.mjs` 078fd80a988f and `results-windfall.txt` 0a2320681a5a. The 34 unit files in
  `results/windfall-7002`, for the arm A label each records.
- The fix's figures:
  - `windfall-beside.mjs` 13a11ca6f726 and `results-windfall-beside.txt` 614d368b3140;
  - `reduce-gainbucket.mjs` f7b4e88f1fe9 (its pooled form, lines 86 and 92 to 93) and `stats.mjs` a4095c8e339e.
- The check:
  - `save-isa-deposits.mjs` 0cec1e47fb6c and `results-save-isa-deposits.txt` f66afb88192d;
  - `audit-save.mjs` fd54695f1729 (`choiceYears`, `saveIds`, `STAMP_FILES`, arm A's pick), `batch-save.sh` 313435d6d119 and
    `reduce-save.mjs` c9e99e6ff9e0;
  - `audit-windfall.mjs` 6e204bf0574a, `select-phase4.mjs` 0d54f6a47a8a (`armA`), `audit-phase4.mjs` 5ace83959b96
    (`solverPlanOf`) and `phase4-panel.mjs` f5d8e7411e88.
- The engine:
  - `src/App.jsx` e8d5c4220dd5, and the `research/engine.mjs` generated from it (untracked; sha256 0d4997449826). In it:
    `stepYear` steps 0 to 7e, `buildContext`'s ledger, `autoSplitRoutes`, `saveSplitRoutes` and `wrapperHeadroomAtYear`;
  - `src/solver/model.js` 7cfc7fec8ff9, `src/solver/fast.js` 0e962057be54, and `src/solver/solve.js`'s menu builder;
  - origin/main's `src/App.jsx` at 91e8d009.
- `DECISIONS-PENDING.md` 5b5e6e1d36c6 item 8, `STATE.md` a9088cfeb09b section 6, and `reviews/2026-11-12-default-d73-2.md`
  a3be766b7d75 MINOR 4.

Ran. Scripts are in the session's scratchpad `rv2/`, and nothing in the tree was edited. Each ran at nice 19, after
`free -g` showed 11 to 14 GB free. I ran no solve and no engine paths of my own: the machine's memory and the caller's limits.
- **windfall-beside.mjs:** its output is `results-windfall-beside.txt` byte for byte after the first line.
- **save-isa-deposits.mjs:**
  - `save`: `results-save-isa-deposits.txt` byte for byte after the first line;
  - `windfall`: the windfall panel. Every ISA deposit falls at t4, t12 or t18, under Windfall to ISA alone, with no drip
    into an ISA, and the count reads "0 of 17".
- **The read and the planted checks.**
  - `reduce-windfall.mjs` gives `results-windfall.txt` byte for byte.
  - `b7-verdict.mjs --planted` ALL PASS (10); `reduce-windfall.mjs --planted` ALL PASS; `reduce-save.mjs --planted` ALL PASS.
- **Plan inputs, by `buildContext` alone:**
  - `labels.mjs`: the arm A label each windfall unit records;
  - `s310f.mjs` and `s310f-b.mjs`: S310F's and S090's plans under Windfall to ISA and under their own policy (deposits,
    staging, choice years, ages, incomes, lookahead, the cash ISA cap, the buffer).

What holds (no finding):
- **Finding 1, the engine defect.** It is answered as the caller says it may be: stated, its consequence for the read
  stated, and put to the maintainer with a fix proposed (DECISIONS-PENDING.md item 8). It is not fixed, since the fix needs
  an unlock. The statement is accurate:
  - Step 1 adds the year's deposits, the split's entries among them, and step 1.5 adds the staged drips (engine 2176 to 2198).
    Both come before `isaContribThisYear` is declared (2203).
  - Every later ISA flow's room reads that counter (2220, 2491, 2592, 2627, 2650, 2755).
  - `model.js` (220 to 250) and `fast.js` (453 to 462) do the same, and origin/main's `App.jsx` has the same order (2212 to
    2240).
  - The figures the write-up gives as mine are mine.
  - Its consequence is what the first round found: the defect can favour CANDW on the 15 households whose routing puts
    nothing into the ISA, so the five gains are not shown to be the split's own.

  Two gaps, neither of which moves anything here:
  - The report's "Where it is" names the dated deposit but not step 1.5's drips. DECISIONS-PENDING.md and STATE.md name both.
    No windfall household drips into an ISA under any policy (`save-isa-deposits.mjs windfall`; WINDFALL-SPLIT.md: all 17
    "park their overflow in the taxable account").
  - Its list of flows leaves out N4's CGT move. The candidate's menu does not carry it: `menuPlus` is ["hr"], and `cgtSale`
    comes only from the cgt menu (`solve.js` 133 and 157).
- **Finding 2.** Each point is answered:
  - survival is within noise, with its p and Holm (beside line 5);
  - spending -0.306% (Holm 8.50e-4) and the estate +£5,882 are stated as the read has them, with "Nothing here shows why";
  - "a trade" is gone;
  - the anchors' caveat is now in the plain words (lines 16 and 17). It was measured on S026 for the windfall split's copies
    (D73-2 MINOR 4).
- **Finding 3.** Each point is answered:
  - the five gains, each with its Holm (beside lines 7, 14, 16, 19 and 21);
  - the panel without S026, +0.0083% (+0.0060 to +0.0105), as the beside prints;
  - the panel pooled in pounds, +0.0020% (-0.0000 to +0.0039), as the beside prints. That pooled form is GAIN-BUCKET's: the
    sum of the differences over the sum of spending, its se from each household's n times var (`reduce-gainbucket.mjs` 86
    and 92 to 93).
- **Finding 4.** Both of B7's consequences are stated (lines 62 to 64), with the agent's recommendation apart.
- **MINORs 5, 6 and 7.** Answered:
  - the 9.36 core-hours is the units' 5.48 plus the engine's 3.88 once more (beside line 27);
  - `audit-save.mjs` `STAMP_FILES` (line 46) now hashes `reduce-gainbucket.mjs` and `stats.mjs`, and `batch-save.sh` (16) and
    `reduce-save.mjs` (133, 142) take the stamp from it.
- **The figures.** Every figure in the corrected write-up is in `results-windfall.txt` or `results-windfall-beside.txt`, and
  reads as the rule reads it.
- **The check's own question is answered right.**
  - **The savings split's ISA route is the year's contributions, and they are counted.**
    - In the engine (2204 to 2212) a variant's amount replaces the account's, and an ISA account's amount counts. Likewise
      `model.js` 252 to 261 and `fast.js` 465 to 467.
    - The split's ISA room is the allowance less the ledger's deposit and drip claims and the cash ISA subscription (engine
      3533 to 3535). So in a year with a save choice, the split's own saving cannot pass the allowance.
  - **The choice years.** `choiceYears` (`audit-save.mjs` 43) gives `saveSplitAt`'s working years, as the units record
    them.
  - **Arm A's pick.** The script takes it as the savings audit does (`audit-save.mjs` 88 and 91; the script's 28 and 41).
  - **The result.** Under arm A's pick, no household has an ISA deposit or drip in a year with a save choice. S290's deposit
    would be one under Windfall to ISA, but its pick is Bracket Fill: the script, and the windfall units' label "Bracket
    Fill, lump sum".

Verdict: PASS

## Findings

1. **MINOR: "the savings factorial is not reached by the defect" is not what the check shows.** The defect is live in both
   savings arms of S310F, in its windfall year.
   - **What the check counts.**
     - `save-isa-deposits.mjs` takes arm A's pick only for a household with an ISA deposit in a year with a save choice
       (line 41), and it counts only those (42, 45).
     - For the ten households with an ISA deposit at t18 under Windfall to ISA, it prints no pick (`results-save-isa-deposits.txt`,
       the lines S306F to S358F).
     - Run on the windfall panel, it prints "0 of 17". That is the panel where the defect is shown live under arm A's own
       pick: S090, 42 of 200 paths over the allowance (my first round). So the count is not the defect's reach.
   - **S310F's pick on this code is Windfall to ISA.**
     - The label "Windfall to ISA, lump sum" is in `results/windfall-7002/S310F-candd.json.gz` and `-candw.json.gz`.
     - It comes from the call the savings audit makes (`audit-windfall.mjs` 85, `audit-save.mjs` 88). `src/App.jsx` and
       `src/solver` last changed in cf9f8790, before the windfall launch from 6e053362.
     - Under that pick, `solverPlanOf` gives the plan the policy (`audit-phase4.mjs` 137 to 141).
     - `buildContext` then puts £20,000 of the £432,000 windfall into `isa_self` at t18, and £412,000 into the taxable
       account, with no drip.
   - **What the defect does there.**
     - t18 is age 55: retired since t15 (52), and before pension access at 58 (t21). There is no other income, and the
       audit's lookahead is nought.
     - So none of these later flows that read the year's subscription runs that year:
       - 2a needs a working owner (engine 2219);
       - the surplus sweep needs income above the target (2483);
       - the draw-first re-wrap needs a lookahead (2575);
       - the harvest needs pension access (2623);
       - N4's CGT move needs a move the candidate's menu lacks (2644).
     - That leaves 7e (2751 to 2757). Its room is the smaller of two figures:
       - the cash ISA cap at 55 in 2044, £12,000;
       - £20,000 less the year's subscription.

       That is £12,000 with the deposit uncounted, and nought with it counted.
     - So in either arm, 7e can shelter up to £12,000 more of the £50,450 buffer that year.
   - **Whether it can part the arms.**
     - Both arms route the windfall alike: neither takes the windfall split.
     - The buffer after 7d is the plan's target times 0.5 (engine 2715), the same in both arms.
     - But the unsheltered part 7e takes depends on whether the year's move drew cash. "Taxable before ISA" draws cash first;
       "ISA before taxable" draws it after the ISA (`solve.js` 146). The two arms' moves and states at t18 can differ.
     - So on S310F the defect can part the arms by at most a year's shelter on £12,000, on the paths where their t18 moves
       draw cash differently.
     - This is not measured. The units store no ISA flows, and no solve was run here. Under S310F's own rules my first
       round found no path over the allowance in 200. But the tables hold cash at the buffer, and draw it as the move says.
   - **Where the claim stands:**
     - the report, line 69;
     - DECISIONS-PENDING.md item 8's headline, line 81. Lines 84 and 85 say the other ISA deposits fall outside the choice
       years, where both arms route them alike. They do not say that one of them is under arm A's own pick;
     - STATE.md section 6 (line 293): "none of its 27 households under arm A's own pick". `results-save-isa-deposits.txt`
       does not say that: its 0 of 27 is "in a save-choice year";
     - b357a685's commit message: "cannot reach the savings factorial's comparison".
   - **Why MINOR.** The route never meets a save choice. It acts in both arms by one rule, on one household in one year, and
     it is bounded. The savings factorial can run as D129 orders. But its read must not cite "not reached" for S310F.
   - **To answer it:**
     - in the three places, say what the check shows: no ISA deposit or drip in a year with a save choice under arm A's pick;
       and on S310F, whose pick is Windfall to ISA, the windfall lands in the ISA at t18 in both arms, where the defect
       lets that year's cash ISA shelter take up to £12,000 more;
     - have the script print arm A's pick for every household with an ISA deposit, and count those outside the choice
       years apart.

2. **MINOR: the recommended re-run on the fixed engine would not, by itself, say "whether the gains are the split's own".**
   - **The re-run.** The recommendation (report line 67) runs "this factorial" again on the fixed engine. Its menu is the
     candidate's own: anchors on all 17 (B7-FACTORIALS.md item 2; `results-windfall.txt` line 20).
   - **The skip.** On anchors the copies' skip is not exact. Outside the deposit year, "a solve with the copies on the menu
     is not bit for bit the solve without them" (B7-FACTORIALS.md item 2: 31 of 3,048,192 entries on S026, D73-2 MINOR 4).
     The report says so itself (lines 16 and 17).
   - **So** the re-run separates the defect's part of the gains, not the skip's. The gains are +0.008% to +0.047%: small
     enough that a confound of unmeasured size cannot be set aside.
   - **To answer it.** Say so. Or plan the re-run on the whole menu, where the skip is exact (`windfall-split` check 5), or
     with the skip's part measured beside it.
