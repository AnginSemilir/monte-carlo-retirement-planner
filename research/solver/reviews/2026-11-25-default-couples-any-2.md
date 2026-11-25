# Review of a change of default, second look: R, L and P on the household route (D148; its fix round, commit f5ded75c)

Subject: the fix round, commit f5ded75c on claude/fervent-goodall-e2mrnf (its parent c24c8ba4 the COUPLES-UNEVEN read, the
change itself 84f0aac7), against my first look (`reviews/2026-11-25-default-couples-any.md`: FAIL, one BLOCKING and four
MINOR). D81 (F): this is the look after the one fix round. The same commit answers the reviewer at the COUPLES-UNEVEN read;
that answer is that reviewer's (`reviews/2026-11-25-read-couples-uneven-2.md`), and I read only what D148's line takes from it.

## What I read

- The first look, and each finding's answer below.
- **The fix**, blobs at f5ded75c:
  - `src/solverCouple.js` c16b7bdae0cd: `householdCut` l.134 (the plant's branch gone), `householdSkipsOf` l.288-293
    (`noStay`), `skipNames` l.301, `coupleSkipRuns` l.313, `coupleActionsOf` l.329;
  - `src/solverWords.js` 6555ce758fb4: `NO_STAY_WORDS` l.101, `actionWords` l.104, `coupleActionWords` l.212-214;
  - `src/solverApproximations.js` 654c16e140bd: `RISKS_CLAUSE` l.56, `sentenceOf` l.57, `COUPLES_LINE` l.99-111;
  - `research/tests/household-client.test.mjs` b97ec191343d, `household-views.test.mjs` 1684f51ef9fd (check 6 l.133-148);
  - `research/ui-harnesses/solver-planner-ui.cjs` 223d2a9a0a2b ((g) l.811-827, the header l.73-88),
    `solver-config-ui.cjs` f557da114c4e (`unevenOf` l.29, the check l.193), `solver-strategy-ui.cjs` e5bf693f9aa1
    (`unevenOf` l.37, the check l.229);
  - `research/solver/STATE.md` 2b399ee9cd47 (D148 l.19, section 5 l.296, section 6), `DECISIONS-PENDING.md` 5482132bd460
    (the OPEN entry of 25 Nov, midday).
- **What it rests on or reaches:** `src/solver/household.js` 94aca9051d20 (the 'risks' merge l.185-196, `tierMapOf`
  l.385-403, `heldOf`, `perOwnerOf`, the move's tier fields l.671 and l.705); `src/coupleOrder.js` bf2578bd6ccc
  (`backActions` l.111-114); `src/solverClient.js` (`actions`, l.178-182 and l.381); `src/solverWorker.js` a60761ccc464
  (l.195, l.218); `src/PlannerPlan.jsx` 303bc30b82d7 (l.412-415); `src/solvedSheet.js` 38781e82bde6 (l.18);
  `vite-plugin-solver-code.js` (the store's key, the worker's module graph); `research/solver/couples-any-default-identity.mjs`
  cb8597906e46; `research/solver/household-port-floor.mjs` bc9436c5290d (the retired plant's one other user).
- **The records:** `results-planner-ui-d148.txt` 080d99c653c9, `results-config-strategy-ui-d148.txt` b81d007824a9; what D148
  cites: `results-couples-uneven.txt` d42a26c1f4de, `results-couples-uneven-beside.txt` 9ff61a0fa7cd,
  `results-couples-any-registered-mpaa.txt` 29fdab5172a3, `COUPLES-UNEVEN.md` 5799b2c5d20b (its Outcomes),
  `results-couples-any-registered.txt` (class R).
- **The agent's raw outputs** (the session scratchpad):
  - `fix-solver-planner-ui.txt` (1,555 s, ended 10:49:16 UTC) and `fix-solver-config-ui.txt`, `fix-solver-strategy-ui.txt`;
  - `plant-couplehalf.txt`, `plant-coupleage.txt`, `plant-workernotie.txt` and the runner's log (`tasks/b7rmax2f2.output`);
  - the pre-commit hook's `commit-fix.log` and `/tmp/.precommit-fast.txt`.
  - File times: the last write under `src/` was 10:17:12 UTC (`solverApproximations.js`), the three harnesses 10:14, the
    commit 11:10:16; the tree is clean at f5ded75c.

## What I ran

All on f5ded75c at `nice -n 19`, beside the agent's plant runs. No held-out seed was used and no outcome of a registered run
was read.

- **`household-views.test.mjs`:** ALL PASS, 7 checks (210 s).
  - Check 6: "self tierIsa 1 (no skip: noStay)"; "marked on the units held alike 0".
  - `--planted`: 'hhpersonrank' exactly 3, 'nosplit' exactly 2 and 3, 'skipstay' exactly 6.
- **`household-client.test.mjs`:** ALL PASS, 9 checks (169 s).
  - `--planted` (stopped by its time limit before its last plant): 'bandsunkeyed' exactly 3, 'partnobands' exactly 1, 2, 4,
    5 and 6, 'noformcheck' exactly 4, 'keyvariant' exactly 5, 'nofallback' exactly 7.
  - 'hhzerofloor' alone: "FAILED: 1 of 9 checks", check 8.
- **`couple-default.test.mjs --planted`**, the words' clause being new (1,038 s): 23 of 23 plants each fail exactly their
  checks. Among them, 'beforeanyline' and 'nohouseline' fail exactly 4, and 'beforeany' and 'cutbeforeany' exactly 2 and 9.
- **`couples-any-default-identity.mjs`** on three units, one of each class (S041-Ri1s-Y75, S041-L-own, S207-P-Y75): "3 of 3
  units IDENTICAL", each "the table the pilot's; all 1000 paths the same".
- **`node .claude/hooks/protected-changes.mjs 03d91f0a..f5ded75c`:** none.
- **Scratch scripts** in the session scratchpad (`chk2/`). Each is a post hoc look and decides nothing.
  - `words.mjs`: the couples' lines at f5ded75c, 84f0aac7 and 03d91f0a.
  - `g19-new.mjs` and `uneven-new.mjs` (no path run): the new fixtures of (g) and of the config and strategy harnesses through
    the guard and the page's cut.
  - `skip-r2.mjs` (light settings, 40 paths): this year's actions of S001 held 60/40 with the partner's ISA one profile safer,
    the partner's pension at Medium Risk, the partner's pension in Cash Equivalents, and the first again with consent to change
    risk withdrawn.
  - `gia-risk.mjs` (no path run): the household plan's risk for each of S001's five kinds of account, held 60/40 with the first
    person at High Risk and the partner at Low Risk.
  - `consent-look.mjs`: my first look's `cash-look2.mjs` (6 points, 2,000 paths of seed 7002) on S123-Rp3t-own as landed, with
    consent withdrawn.

Verdict: PASS

No BLOCKING finding; two MINOR. Every finding of the first look is answered.

## What holds

1. **Finding 1 (BLOCKING) is answered.**
   - **Check 19 (g)** (`solver-planner-ui.cjs` l.811-827) now re-holds S001 90/10 with both people working to 120 on £30,000,
     no growth.
     - `householdRefusal` gives "householdPlanFor: nobody retires within the plan". The guard has the couple on, with no
       route of its own: `{"on":true,"share":0.9,"why":null,"swap":false}` (`g19-new.mjs`).
     - The page solves it on today's route, every figure `refCouple`'s: "done true; card false; survival 100% the
       reference's" (`results-planner-ui-d148.txt`).
     - The header (l.73-88) says so.
   - **The config and strategy harnesses.** `unevenOf` (config l.29, strategy l.37) now gives S001 at 25/75 with neither
     person retiring within the plan. That is Y's class, refused for 'noretire', so 'shape' and off:
     `{"on":false,"share":0.25,"why":"shape","shape":"noretire","swap":false}` (`uneven-new.mjs`).
     - Config: all ok, 29 checks, "the couples card and no solver card" and "nothing solved, no solver code fetched".
     - Strategy: all ok, 27 checks, "the couples card, and nothing solved".
   - **All three ran on the committed code.**
     - The planner run took 1,555 s and ended at 10:49:16 UTC, so it began about 10:23. That is after the last write under
       `src/` (10:17:12) and to the harnesses (10:14); nothing under either was written after.
     - The config and strategy run built and served the new mode after 10:49 (the first try found no server on :4173) and
       ended at 11:06.
   - **(g) can fail again**, alone on each plant, exactly check 19 each time (the agent's runs, each "PLANTED (...): checks
     failing 19; their own 19"):
     - 'couplehalf' on the figures: ".compare.solved.medianPot: page 698478.5414568782 against the reference
       723422.1659246183";
     - 'coupleage' on the assembly's refusal: "done false; no figures";
     - 'workernotie' on the client's read-back of the joint move: "done false" (ended 11:35, after the commit).
   - **The agent's question.** I do not need 'beforeany' and 'lockseach' before this verdict.
     - Both are D148's own plants for (b5) to (b7), which my first look left to B1's gate, as D144's and D146's check-19
       plants were.
     - B1's gate requires each new check failed on its plant. But see finding 1 below on what the line may claim before the
       record exists.
2. **Finding 2 is answered.**
   - 'nofallback' now wants check 7 alone (`household-client.test.mjs` l.74), and check 7's couple is the one still refused,
     nobody retiring (l.261-281).
   - 'partceilkey' is retired with a dated note (l.50-53). Its branch is gone from `householdCut` (l.134) and from the test's
     plant list (l.168).
   - Its one other user is `research/solver/household-port-floor.mjs` (l.32, l.42, l.56). That script's record was taken on
     D136's code, and since D148 the plant could not move a cut there either, the household plan taking 'limits'. Nothing is
     lost.
3. **Finding 3 is answered as I offered it.**
   - D148 (3) says what the reach does, with my light look's figures.
   - `DECISIONS-PENDING.md` puts to the maintainer whether the guard keeps such couples off, with the agent's recommendation.
     The `+10.600` it cites is class R's pooled survival (`results-couples-any-registered.txt` l.35).
4. **Finding 4 is answered.**
   - **The skip** (`householdSkipsOf` l.288-293). A person's tier move has no skip, marked `noStay`, where the household's
     ladder for that wrapper lacks the tier the person holds.
     - `tierMapOf` (`household.js` l.385-403) maps each household tier into each person's ladder by name, the household's
       ladder starting at the more cautious risk. The riskier person holds index 0 of their own ladder, which the map lacks
       unless the household's ladder holds their risk. Where it does, a skip that stays put exists and is still offered.
     - `skipNames` gives null for such an entry (l.301), and so does `coupleSkipRuns` (l.313). The worker's parts therefore
       rank and run the same skips, and they still join.
   - **It reaches the page.**
     - `coupleActionsOf` carries the mark (l.329). `backActions` spreads each action (`coupleOrder.js` l.113).
     - `coupleActionWords` spreads it into `actionWords` (`solverWords.js` l.214), which gives `NO_STAY_WORDS` (l.104).
     - `PlannerPlan.jsx` l.412-415 and `solvedSheet.js` l.18 render through `coupleActionWords`.
     - A stored solve is keyed on the worker's module graph, which holds `solverCouple.js`, so no action stored before the fix
       is restored without the mark.
   - **`skip-r2.mjs`:**
     - the ISA one profile apart: "self tierIsa 1: noStay, no skip";
     - the pension at Medium Risk: "self tierPen 2: noStay";
     - the pension in cash: "self tierPen 5: noStay";
     - every other action keeps its skip.
   - **The clause** is added only where 'risks' is taken (`solverApproximations.js` l.57). `words.mjs` gives:
     - `openBeforeAny` and `openFirstBeforeAny` are 03d91f0a's `open` and `openFirst` byte for byte;
     - `open` and `openFirst` are 84f0aac7's with the clause once;
     - `on` and `onFirst` carry it too, true there as well, since the cut takes 'risks' whatever the guard.
     - What the clause says is finding 2 below.
5. **Finding 5 is answered.**
   - **The MPAA ages.** D148 (5) names them as an approximation: "62 earlier, 0 later, 0 both ways, 74 the same"
     (`results-couples-any-registered-mpaa.txt` l.2).
   - **The COUPLES-UNEVEN read.** D148 gives PA2 EXPLAINS IT and its figures as the file prints them:
     - D `+£437`, PA2 `+£3`, SPLIT `+£440`;
     - on the two named kinds, ROUTE `+£525` and `+£539`, PA2 `-£11` and `-£20` (`results-couples-uneven.txt`).
   - **"By its rule no outcome moves R, L or P"** is the rule's "in every outcome ... R's, L's and P's change of default is
     drafted beside it" (`COUPLES-UNEVEN.md`, Outcomes).
   - **The hold.** The read goes to the maintainer beside D148 before `main`. Section 5, section 6's action 2 and
     `DECISIONS-PENDING.md` all hold batch 18 for that word.
- **Nothing else moved.**
  - **The source.** Since 84f0aac7 the fix changes `solverApproximations.js` (the clause), `solverWords.js` (the words) and
    `solverCouple.js` (the cut's plant branch, the skips and their mark). No protected file was touched.
  - **The identity.** Its path is the guard, `householdCut`, `bandsAt` with `solveForApp`, `householdSolved`, `solvedContext`
    and `runPath`. Of these only `householdCut` moved, and only in the branch taken under 'partceilkey', which the identity
    never sets. On f5ded75c, the three units I ran are IDENTICAL (above).
  - **The fast tier in the pre-commit hook.**
    - The first try: "83 tests, 18 run, ... 18 passed", among them `couple-default`, `couple-shape`, `couple-limits-card`,
      `household-shapes` and `household-landing`.
    - It asked for `fast-inputs.json`. The second try: "3 run ... 3 passed". `check-state` passes at 300 lines.
    - `household-views` and `household-client` are full-tier tests, which I ran above.

## Findings

1. **MINOR. D148's line states check 19 (g)'s three plants as shown. At the commit one had been, and no record of any of them
   is committed.**
   - **The line.** D148 (STATE.md l.19, the fix round's (1)): "its plants 'coupleage', 'couplehalf' and 'workernotie' each
     failing exactly check 19 alone".
   - **The runs.** The runner logged 'couplehalf' after 1,590 s, ending at 10:49:51. 'coupleage' ended at 11:11:50 and
     'workernotie' at 11:35, both after the commit at 11:10:16 (`tasks/b7rmax2f2.output`, `plant-*.txt`).
   - **The outcome.** Each did fail exactly check 19, so the claim is now true. But it rests on scratch files, and section 5
     still lists "check 19's plants on the fixed code" as running.
   - **Fix:**
     - commit the five plants' record ('couplehalf', 'coupleage', 'workernotie', and D148's 'beforeany' and 'lockseach' once
       they end) as earlier batches did (`results-planner-ui-couplehalf.txt`, `-gapwords.txt`), and cite it in the line;
     - if 'beforeany' or 'lockseach' fails other than exactly check 19, correct the line before B1's gate.

2. **MINOR. The new household sentence says what happens to any kind of account the two hold at different risks. The code
   does it for the pension and the ISA only.**
   - **The clause** (`solverApproximations.js` l.56; D148 (4) the same): "Where the two of you keep one kind of account at
     different risk levels, it plans that account for both of you from the more cautious of the two, so the one held at more
     risk is usually moved down in the first year."
   - **The code.** The household plan holds the pension and the ISA at the more cautious risk. "The other investments, cash
     and cash ISA, which carry no moves, take the risk of the larger holding ...; each person's grows at their own in the
     engine" (`household.js` l.186-189, l.191-196).
   - **`gia-risk.mjs`.** S001 at 60/40, the first person at High Risk and the partner at Low Risk:
     - the household plan's pension and ISA are at Low Risk;
     - its taxable account, cash and cash ISA are at High Risk, the larger holding's; they carry no moves, so nothing of them
       is moved down.
     - D148 takes R on those three kinds, by inference ("or on the taxable account, cash or the cash ISA").
   - **Consent withdrawn** (by inference in D148) is the other case where the clause is not what happens.
     - The table has no tier moves, so `tierMapOf` gives null (l.386) and the move carries no tiers (l.671, l.705). The
       riskier person's pension or ISA is never moved: `skip-r2.mjs`, "tier map off; the move {"self":{"pen":0,"isa":0}...}".
     - The household table still plans that wrapper at the more cautious risk, for the whole plan.
     - Its size is not measured. One light look (S123-Rp3t-own, 2,000 paths, post hoc, deciding nothing), with consent
       withdrawn: today's route "survival 92.55%, median pot £343915", the household route "survival 93.6%, median pot
       £487153".
   - **Fix** (the words are the maintainer's):
     - the clause names the pension and the ISA;
     - D148's by-inference list says what the other three kinds and consent withdrawn do.
