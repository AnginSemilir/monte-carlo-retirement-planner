# Review of a change of default: R, L and P on the household route (D148; commit 84f0aac7)

Subject: commit 84f0aac7 on claude/fervent-goodall-e2mrnf. It is the change of default opened by the registered read of every
couple on the solver (`registrations/couples-any.md`, seed 7027: W, R, L and P each PASS, M1 naming S041-Rp1t-Y75 and
S041-Ri1s-Y75). What it changes:
- the household plan takes 'risks', 'limits' and 'salaries' in the app (`src/solverSettings.js` `APP_COUPLE.takeShapes`; the
  page's cut and assembly, `src/solverCouple.js`);
- the guard reads them as taken (`src/couplesSwitch.js` `HOUSEHOLD_TAKES`, `limitsTaken`);
- the limits card (`src/limitsCard.js`, `src/SolverConfig.jsx`);
- the coverage line and the household sentence (`src/solverApproximations.js`);
- the decided-defaults block's `takeShapes`;
- the protected tests edited under the maintainer's unlock, `household-client.test.mjs` and the planner harness's check 19;
- the identity on the registered pilot.

Every claim of D148 is reviewed. COUPLES-UNEVEN, run beside the change, is not.

## What I read

- **The change**, git blobs at 84f0aac7:
  - `src/solverSettings.js` fe0c25452e2a, `src/couplesSwitch.js` c3ee79b635fd, `src/solverCouple.js` bf86465c0768,
    `src/limitsCard.js` 55f25aea93e8, `src/SolverConfig.jsx` 3a5ca8b02563, `src/solverApproximations.js` 4c33b6040ec6,
    `src/solverClient.js` 587a8bda30d0, `src/App.jsx` e2e9ee0fd5fa;
  - `research/tests/couple-default.test.mjs` 10be3c9e1fce, `couple-limits-card.test.mjs` 6e1ffcff3923,
    `couple-shape.test.mjs` 19628c8b4c86, `household-client.test.mjs` f0b81868d6c8;
  - `research/ui-harnesses/solver-planner-ui.cjs` 52d249dc6fab;
  - `research/solver/couples-any-default-identity.mjs` cb8597906e46 and `results-couples-any-default-identity.txt`
    4dcc9b7f12a4;
  - `research/solver/STATE.md` fea4a82d76a9 (D148, the decided-defaults block, sections 5 and 6).
- **What it rests on or reaches:**
  - `src/solver/household.js` 94aca9051d20 (`householdPlanFor` l.144-352, `tierMapOf`, `perOwnerOf`);
  - `src/solverCouple.js` (`householdCut` l.129-138, `personParts`, `householdSkipsOf`, `coupleActionsOf`);
  - `src/solverStrategy.js` f102cb2864a8 (`partsOf`, `stepsBelow`); `src/solverWords.js` (`PART_WORDS`, `actionWords`);
  - `src/PlannerCards.jsx` 7e3ebe39970c (`SHAPE_WORDS`); `src/solverWorker.js` (a couple's actions);
  - `research/ui-harnesses/solver-config-ui.cjs` 755a3ead5b93, `solver-strategy-ui.cjs` 00541b408871, `run-all.sh`
    6983b19cb8f3.
- **The draft the identity ran on**, at 84f0aac7~1: `drafts/couples-any-default.patch` ea2c17413c22 and
  `drafts/COUPLES-ANY-DEFAULT.md` d0f675f96714.
- **The rulings and reviews:**
  - the registration 69550ed2a68f (its Outcomes and by-inference list) and `COUPLES-ANY.md` bb48b165d663;
  - the reviews at the read b7bf14641d5f and ba2c6a18006f, the deep review 22f33e0470f1, and the write-up e7c4b259be4e (its
    Next);
  - D143 to D147, and the reviews of D144's and D146's changes of default, for their form.

## What I ran

All on 84f0aac7 at `nice -n 19`, beside COUPLES-UNEVEN. No held-out seed was used and no outcome of a registered run was read.

- **`couple-default.test.mjs`:** ALL PASS, 9 checks.
  - `--planted`: 23 of 23 plants fail exactly their checks.
  - 'beforeany' and 'cutbeforeany' each fail exactly 2 and 9, 'beforeanyline' exactly 4, and 'notake' and 'cutnotake' each
    exactly 2 and 9.
- **`couple-limits-card.test.mjs`:** ALL PASS, 6 checks.
  - Check 1: 9,856 edits, none leaving a couple off. Check 6: 193 plans, 0 wrong.
  - `--planted`: 7 of 7 fail exactly their checks; 'beforeany' fails exactly 1, 3 and 6.
- **`couple-shape.test.mjs`:** ALL PASS, 4 checks.
  - Check 4: risks 2,100, limits 420 and salaries 420 taken, none over-reached or missed.
  - Under 'beforeany' every R, L and P shape over-reaches and none of step 4's three does. Under 'cutbeforeany' every R, L
    and P shape is missed and none of step 4's three.
- **`household-client.test.mjs` under 'nofallback' and under 'partceilkey'**, each alone (finding 2).
- **The draft against the commit:** the draft patch applied to `git archive 84f0aac7~1`, then `diff -ru` against
  `git archive 84f0aac7` over `src/`, `household-client.test.mjs` and the planner harness.
- **The coverage words**, printed from `src/solverApproximations.js` at 84f0aac7 and at its parent.
- **Scratch scripts** in the session scratchpad (`chk/`). Each is a post hoc look and decides nothing.
  - `g19.mjs` and `uneven.mjs`: the harnesses' own couples through the guard and the page's cut, on the commit and on its
    parent (finding 1).
  - `half-noretire.mjs`: whether today's route's figures on a couple with nobody retiring move with the share (finding 1).
  - `reach.mjs`: the library's 210 couples as entered, before and after.
  - `smoke-r.mjs`, at light settings, at the dial's positions 1 and 3 and in the speed mode. Each couple goes through the
    page's cut, table, assembly, strategy, this year's actions and the next years:
    - an R couple: 25/75, the ISA one profile apart;
    - an L couple: 60/40, the pension limits apart;
    - an R couple with the partner's pension in Cash Equivalents.
  - `skip-r.mjs`: this year's tier actions of an R couple and their skips (finding 4).
  - `cash-look2.mjs`: R past three profiles apart on both routes, light settings, seed 7002 (finding 3).

Verdict: FAIL

One BLOCKING (finding 1) and four MINOR. The product code is as D148 says; the BLOCKING finding is in the gate's harnesses.

What holds:

- **The code does what D148 says and nothing else.**
  - `APP_COUPLE.takeShapes` holds the six shapes (`src/solverSettings.js` l.139). The cut and the assembly both take it
    (`src/solverCouple.js` l.35-40).
  - The guard reads the same six as taken (`src/couplesSwitch.js` l.78), and takes 'limits' only with 'risks' (l.89-90).
  - `householdShapeOf` skips exactly the three new shapes (l.196, l.205, l.208). 'noretire' is the one refusal left (l.222).
  - Every other edit under `src/` is a comment, App.jsx's plant list (l.8789) or the limits card.
  - Outside comments, the draft and the commit differ only in `householdLimits` (`src/limitsCard.js` l.36-37, l.68-71) and
    the card's words (`src/SolverConfig.jsx` l.18, l.189, l.201).
  - `householdLimits` has one caller, `SolverConfig.jsx`, so no solve reads it. The identity, run on the draft, therefore
    holds for the commit.
- **Every couple it moves is accounted for.** These are couples with 'risks', 'limits' or 'salaries' and not 'noretire'.
  - Inside the guard before D143, such a couple moves from today's route to the household route. The household plan no
    longer refuses it (`household.js` l.173, l.235, l.242), so the client's household form succeeds (`src/solverClient.js`
    l.269-276).
  - Outside the guard, where Y, E, S or G opened it, it moves from the app's rules ('shape') to the household route
    (`couplesSwitch.js` l.245, l.255).
  - Every couple the solver runs gets the limits card per person (`limitsCard.js` l.52-54).
  - None of the library's 210 couples as entered moves. All 210 are on the household route before and after (`reach.mjs`).
- **The rollback plants put back the code before.**
  - Under 'beforeany' the guard takes step 4's three shapes alone, and `limitsTaken` is false.
  - 'cutbeforeany' makes the cut take the parent's three.
  - The words' 'beforeany' gives `openBeforeAny` and `openFirstBeforeAny`, which are the parent's `open` and `openFirst` byte
    for byte.
  - 'beforeanycard' gives the parent's `limitsMode`, and 'lockseach' gives the card's words before.
- **The tests pin the new defaults, and their plants bite** (above).
  - Check 9 of `couple-default.test.mjs` puts all 24 of the couples-open panel's today's-route units on the household route.
  - The client fails closed on Y90 with nobody retiring.
- **The identity.** The script holds four things to the pilot's ROUTE (l.98-118): the guard, the page's cut at the app's own
  shapes, the table digest, and every key of every path. Result: `112 of 112 units IDENTICAL`.
- **Where the words speak of limits and of the one refused shape, they match the code.**
  - The coverage line names only nobody retiring. Such a couple goes to today's route inside the guard ("plans each of you
    separately") and keeps the app's rules outside it.
  - The card's new clause shows exactly where the household route takes the couple (check 6). It is true there:
    - the household plan's ceiling is the stricter of the two people's (`household.js` l.342-346);
    - that is applied after `lockedPlan` has held each person's wrapper at their own limit;
    - 'risks' holds the wrapper at the more cautious risk (l.191-197).
  - On today's route the card says each person's limit is their own, as that route takes them.
- **The by-inference list is the registration's, item by item.** It includes L's caveat and the stricter limit binding both
  people, as the reviewer at the read (finding 4) and the deep review asked.
- **Nothing listed by inference crashed.** The R and L couples ran through the page's functions at the dial's position 3 and
  in the speed mode without an error (`smoke-r.mjs`).
- **Whether check 19 may wait for B1's gate.** It may, as it did for D144 and D146, but not as committed: by the code it
  fails, and so do two other REQUIRED harnesses (finding 1). All three should run on the fixed code before the second look.

## Findings

1. **BLOCKING. Three REQUIRED harnesses of B1's gate still treat a shape this change takes as one the household plan
   refuses. Each fails on this code, and today's route loses its only check in the browser.**
   - **The planner harness, check 19 (g)** (`solver-planner-ui.cjs` l.808-823).
     - Its case is "a couple the household plan refuses ... solved on today's route": S001 re-held 90/10, with the partner's
       ISA one profile from the first person's.
     - It asserts that `householdRefusal(odd)` is a refusal (l.820). `householdRefusal` (l.296-300) is `householdCut` at the
       app's form, which now takes 'risks'.
     - It then compares the page's figures with `refCouple`, today's route.
     - `g19.mjs` reruns the harness's own fixture code:
       - on 84f0aac7, the guard is on with no route, `householdShapeOf` does not refuse, and the cut takes the plan, so
         `householdRefusal(odd)` is null;
       - on its parent, it gives "householdPlanFor: the two people's S&S ISAs hold different risks (Medium/High Risk, Medium
         Risk)".
     - So (g) fails on its first term. The page now solves that couple on the household route, so its figures would not
       match `refCouple`'s either.
     - The plants 'coupleage', 'couplehalf' and 'workernotie' reach check 19 only through (g) (l.111-120: "since D135 on
       today's route alone, so it fails the couple the household plan refuses"). While (g) fails without them, none of the
       three can show anything.
   - **`solver-config-ui.cjs` check 3 and `solver-strategy-ui.cjs` check 5.**
     - Their "couple the solver does not run" is S001 re-held 25/75, with the partner's pension at another risk, High against
       Low (`unevenOf`, config l.24-28, strategy l.32-36).
     - Their comments say it is kept off since D143 only for 'risks'.
     - `uneven.mjs` on 84f0aac7 gives the guard `{"on":true,"route":"household","lifted":["Y"]}`, and the page's cut takes
       it. On its parent it gives `{"on":false,"why":"shape","shape":"risks"}`.
     - So these fail: "the couples card and no solver card" and "nothing solved, no solver code fetched" (config l.192-195),
       and "the couples card, and nothing solved" (strategy l.228).
   - **All three are REQUIRED** (`run-all.sh` l.57). The commit leaves (g) and both harnesses as they were.
   - **D148's claim does not stand as written.** It gives "the planner harness's check 19 with (b5), (b6) and (b7) at B1's
     gate" and names no other harness. These three cases still pin the default before the change, that a couple holding one
     wrapper at two risks is refused. A change of default and the tests that pin it go in one commit.
   - **Fix:**
     - Move (g) to a couple inside the guard that the household plan still refuses; the shape card's own `noRetire` at 90/10
       would do. Today's route's figures on such a couple still move with the share (`half-noretire.mjs`, light settings:
       S001 90/10 with nobody retiring differs in compare and outlook between the pots' share and the half share).
     - Show 'coupleage', 'couplehalf' and 'workernotie' each failing exactly check 19, alone, on the new (g).
     - Give the config and strategy harnesses a couple the solver still does not run: nobody retiring outside the guard, or
       the age cap.
     - Correct check 19's header (l.73-85).
     - Run the three harnesses on the fixed code before the second look. None has run on this code.

2. **MINOR. Two plants of `household-client.test.mjs` no longer fail the checks its `--planted` list names.**
   - **The list** (l.69) has `['nofallback', ['7', '9']]` and `['partceilkey', ['9']]`. The commit changed the header (l.46)
     to "check 7" for 'nofallback', but not the list.
   - **'nofallback'.** Check 9's differing ceiling is now taken, so no refusal arises there. Run alone, the plant fails check
     7 only ("FAILED: 1 of 9 checks").
   - **'partceilkey'.** With 'limits' taken, handing the household plan a partner's ceilings equal to the first person's
     changes nothing: the stricter of two equal ceilings is the same (`household.js` l.342-346). Run alone, all 9 checks pass.
   - So `--planted` now reports both plants NO.
   - **Fix:**
     - 'nofallback' wants check 7 alone.
     - Retire 'partceilkey' with a dated note, since the cut's strip (`src/solverCouple.js` l.132) no longer reaches a solve.
       Or give it a check the strip still moves.

3. **MINOR. By inference, R's reach past three profiles includes a whole wrapper held in cash for the plan.**
   - **What the registration measured.** R's units hold a wrapper one to three profiles apart, from the library's High Risk
     (pension) or Medium/High Risk (ISA). D148 lists "more than three profiles apart" as by inference, "its weakest reach".
   - **What the code does past three.**
     - The household's wrapper sits at the more cautious of the two risks, whatever each person holds.
     - From Low Risk its ladder goes no further than Cash Equivalents, and Cash Equivalents has no ladder at all. The deep
       review found the same for the ISA.
   - **Example** (`smoke-r.mjs`): S001 at 60/40, with the partner's pension in Cash Equivalents.
     - This year's action is the first person's "Move your pension 5 steps lower in risk" (`tierPen` 5), with no other move
       differing. This holds at the dial's positions 1 and 3 and in the speed mode.
     - The first person's pension, 60% of the two, then stays in cash.
   - **A light look** (`cash-look2.mjs`: post hoc, deciding nothing; 6 points, 2,000 paths of seed 7002).
     - The unit: S123-Rp3t-own, a registered R unit inside the guard, the partner's pension three profiles safer. It was run
       as landed, then with that pension moved to Low Risk and to Cash Equivalents.
     - Today's route against the household route:

       | the partner's pension | survival, today's route | survival, household route | median pot, today's route | median pot, household route |
       |---|---|---|---|---|
       | three apart | `97.85%` | `98.05%` | `£239,493` | `£320,815` |
       | four apart | `98.35%` | `97.80%` | `£208,692` | `£240,406` |
       | five apart | `97.90%` | `97.65%` | `£229,591` | `£159,985` |

     - On this one couple survival stays within a few paths of today's route. At five apart the median pot is about 30%
       lower.
   - **Fix, the maintainer's call. Either:**
     - the guard keeps a wrapper more than three profiles apart off the household route until that reach is measured (today's
       route inside the guard, the app's rules outside it); or
     - the D-line says what this reach does, so the maintainer's go covers it knowingly.

4. **MINOR. Nothing the page says tells an R couple that the riskier wrapper moves to the more cautious risk. The skip shown
   for that move can never mean staying put.**
   - **The words that went.** The coverage line and the household sentence no longer carry the "different risk levels"
     clause, which said such a couple is planned separately (`solverApproximations.js` l.51, l.61, now used only for the
     rollback lines; l.74-76).
   - **The words that came.** The card's new clause (`SolverConfig.jsx` l.201) speaks of limits only. A couple with one
     wrapper at two risks and no limits is told nothing of two things:
     - the household holding that wrapper at the more cautious risk (`household.js` l.191-197);
     - the first year's switch that the table does not see.
   - **This year's action.**
     - It shows the riskier person's switch as a step down, e.g. "Move your ISA 1 step lower in risk" (`personParts` with
       the tier map).
     - "Skipping it costs ..." (`solverWords.js` l.100-102) is the cost of the household's best other tier, taken by that
       person alone (`householdSkipsOf`).
     - The household's ladder starts at the more cautious risk, so that other tier is never the person's own.
   - **`skip-r.mjs`**, S001 at 60/40, light settings:
     - the partner's ISA one profile safer: the first person's move is the ISA 1 step down; its skip is the ISA 3 steps and
       the pension 2 steps down;
     - the partner's pension at Medium Risk: the first person's move is the pension 2 steps down; its skip is the pension 4
       steps and the ISA 2 steps down.
   - **Fix.** The words are the maintainer's.
     - Say it where an R couple will read it: in the household sentence, or in the limits card beside its limits clause.
     - Word a skip that cannot keep the wrapper where it is as what it is, or offer no skip for that move.

5. **MINOR. The D-line leaves out two things the read's reviews asked of it.**
   - **The MPAA ages.** The deep review: "The D-line names them as an approximation" (l.341-342). D148 does not mention them.
   - **What COUPLES-UNEVEN's read does to the acceptance of M1.**
     - The deep review set its test "Before the maintainer's word on M1's names, which it settles" (l.329). Each of its
       outcomes gives the D-line a sentence on M1 (l.304-322).
     - The write-up told the maintainer that M1 would come "with the deep review and the test's read" before any default
       changed (l.217-218).
     - D148 takes the word on M1 before the test reads. It says only that nothing goes to `main` before the test reads.
   - **Fix.**
     - Say in D148 that the test's read goes to the maintainer with M1's names before the batch merges.
     - Say what each outcome means for the acceptance. By the deep review's section 3, none moves R, L or P.
