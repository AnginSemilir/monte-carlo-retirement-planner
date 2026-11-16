# The change of default: LOOKHOLD (TIE-C2's forward look with the hold) as the couples' default (D105, D108, D109)

The reviewer on a change of default, 16 Nov. The change is uncommitted in the worktree `/home/user/wt-default` (branch
`work-default`, base bfc34806, the working branch's head).

## What I read

In the worktree. The changed files are uncommitted, so their blobs are from `git hash-object`.
- **The change** (`git -C /home/user/wt-default diff`, whole):
  - `src/solverSettings.js` 3bfa7c1cc0fd, `src/solverCouple.js` e62aff1d8bc6, `src/solverWorker.js` 237874662fcf,
    `src/solverClient.js` 524cda712d93;
  - `research/ui-harnesses/solver-planner-ui.cjs` 3f018265afb5;
  - `research/tests/couple-default.test.mjs` d8db1c468e07, `research/tests/couple-split.test.mjs` 2ae590c07a35;
  - `research/solver/STATE.md` 491b590058dc (the couples entry of the decided-defaults block);
  - `research/solver/couple-joint-identity.mjs` ec74ec6535eb, and `results-couple-joint-identity.txt` 982b599d80e8
    (untracked).
- **The code it rests on:**
  - `src/solver/couple.js` 9fa640a0ceca: solveCouple, rankFor, rankScored, lookPick, holdMove, chooseJoint;
  - `src/coupleOrder.js` bf2578bd6ccc: backMeta;
  - every caller of startSolve and startFigures: `src/useSolver.js`, `src/SolverFigures.jsx`, `src/SolverSimple.jsx`;
  - the record's readers: `src/solverKey.js`, `src/solverDiagnostic.js`, `src/PlannerPlan.jsx`;
  - where a couple's tiers are applied: `research/engine.mjs` l.2769 and `src/solver/model.js` l.630;
  - `src/solver/solve.js` l.2895 (lockSetup).
- **The read and its record:**
  - `TIE-C2.md` 2aabd13c8524, `results-tie-c2.txt` 6e85383a8393, `results-tie-c2-precheck.txt` a776d9a20da2,
    `audit-tie-c2.mjs` cd9c2ce6bca3;
  - `reports/2026-11-16-tie-c2-read.md` 53a5b8af0842;
  - `reviews/2026-11-16-read-tie-c2.md` de08f81611b9 and `-2.md` 06d0a9dacdfb;
  - `research/tests/couple-tie-look.test.mjs` 52d8c296b927, and `chooser-tie.test.mjs` 4b655e89c35a (check 8);
  - `research/ui-harnesses/load-perf-ui.cjs` a48272a73a73;
  - STATE.md's D105 and D107 to D109, and `registrations/share-rules.md` (where its read runs).
- **Not opened:** nothing under `research/solver/results/share-rules-run` or `/home/user/sr-launch`, and neither backup
  branch.

Run in the worktree:
- `node research/tests/couple-default.test.mjs`: ALL PASS, 6 checks, 5 s.
- The same with `--planted`: each plant fails exactly its own checks, and `notie` fails exactly check 3.
- `node research/tests/plan-defaults.test.mjs`: 26 passed.
- A scratchpad script that reads TIE-C2's twelve couples from `couples-panel-d4b.json` and applies couple.js `shareFor`:
  - each first person holds `0.6000` of the pots and is given the half share, `0.5`;
  - each couple is entered elder first (ages 37 and 34, 56 and 53, 55 and 52).

Not re-run:
- `couple-split.test.mjs` (about five minutes, as asked);
- the identity check (solves at 45 points);
- the browser harness.

Verdict: PASS

By reading, every route by which the page assembles a couple carries the joint move. The research side is unchanged, and
the decided-defaults block and the code agree, pinned by a test that fails on its plants. There are three findings, all
MINOR:
- findings 1 and 2 should be answered before the batch carrying the change is merged (B1's gate), which is when the
  default reaches the page;
- finding 3 belongs in the commit.

## Findings

1. **MINOR. The worker's half of the route has no check that can fail, and the browser check may not see the joint move.**
   - The worker passes the joint move on correctly. `src/solverWorker.js` l.154-160 hands `joint: data.joint || null` to
     assembleCouple.
   - No node test runs that handler:
     - `couple-default.test.mjs`'s stand-in (l.143) records the message and replies `meta: {}`;
     - `couple-split.test.mjs`'s in-process worker has its own copy of the line (l.103);
     - both `notie` plants drop the joint move in the client, before the worker. Dropping it in the worker is planted
       nowhere.
   - The job's record proves only what the client asked for:
     - `couple.joint` (`src/solverClient.js` l.274) is the client's own variable, not read back from the couple;
     - check 3 reads that variable as "the record naming it";
     - a read-back exists: coupleMeta's `joint` (`src/solverCouple.js` l.90), taken from `cp.meta` and sent in the
       worker's reply. Nothing reads it.
   - Whether the browser check can see the joint move is not shown, and it has no plant:
     - check 19 compares the page's couples with a reference now assembled with appJoint
       (`solver-planner-ui.cjs` l.230 and l.244);
     - it runs library couples at 4 points, 500 paths, seed 12345.
   - The agent's own plant run suggests it cannot:
     - under `COUPLE_SPLIT_PLANT=notie` only check 1 fails, and it fails on its message check;
     - so check 2 passed with the joint move absent. Check 2 compares the page's figures and skip costs for S069, on 120
       and 60 paths (l.152-157), with `wantCouple` and `wantActions`, both built with appJoint (l.125-127);
     - so on that couple, at those settings, no figure moves with the joint move. That is to be expected: the look acts
       only above both estate caps, and the hold only past twice a table's top.
   - So a worker that dropped the joint move would pass every check named for this change. The page's couples would then
     run without LOOKHOLD while the record says they run with it.
   - What is needed, before the merge: a check that fails on that fault, shown failing on its plant once (CHECKLIST 5),
     as D99's `couplehalf` was at B1's gate. Two ways:
     - (the cheaper) the client compares each `couple` reply's `meta.joint`, the owner's and each part's, with the joint
       move it sent, refuses a difference, and takes the record from the reply. A worker that drops the joint move then
       stops the solve, which check 19 sees whatever the figures. A preview plant (`PLANNER_PLANT`: the worker assembling
       without it) would show it failing.
     - a node test that runs the worker's own handler.

2. **MINOR. Point 5, the hold at the dial's locked positions: I agree with the recommendation. It needs a check and a line
   in the record.**
   - How the code behaves:
     - at a locked position, couple.js keeps each person to the layer that their base table's own chooser picks
       (l.645, and l.704-709: `chooseAction(LK.rc, s, t, held)`);
     - chooseJoint applies holdMove after that ranking (l.890);
     - holdMove (l.793-815) reads no lock. So for a person past twice their table's top, a step down that the lock takes
       is put back.
   - This is unmeasured:
     - TIE-C2 read position 1 only (report l.134-138);
     - the hold never acted on the paths counted (`results-tie-c2.txt` l.58: "hold 0" for every couple in every arm).
   - Why I agree:
     - lockSetup refuses a base solved on another grid (`solve.js` l.2895), so a position's table and its base share the
       wealth axis and its top;
     - past twice the top, the base's chooser reads the pot at the top, as the position's table does. So the lock's step
       down there is the same misread the hold removes;
     - at position 1 the hold already keeps the tier. Exempting positions 3, 6 and 10 would make the dial move a person's
       risk past the limit, which B3's lock exists to prevent. Holding keeps those positions where position 1 is;
     - it is also D105's own wording: such a person "never steps down in risk there".
   - The check it needs, as D95's reviewer asked for the singles' tie-break (`chooser-tie.test.mjs` check 8):
     - a couple solved at the dial's position 3 the way the app solves each person, with lockTiers on their base;
     - the joint move on, and the hold's limit set low, as `couple-tie-look.test.mjs` check 2 sets it, so that some
       persons pass it on the household's own states;
     - at every decision, the move is the lock's move with each step down of a person past the limit put back, and
       nothing else changed. Below the limit, the move is the lock's pair exactly;
     - the engine and the rollout in step there (check 4's form);
     - a plant (the hold skipping a locked table) that fails it.
   - The line in the record: at the dial's positions 3, 6 and 10, the hold acts over the lock for a person past the limit.
     D3's lock is otherwise unchanged.

3. **MINOR. The default reaches couples TIE-C2 did not read. The record of the change should say what stands by
   inference.**
   - What TIE-C2 read:
     - twelve couples, each held 60/40, so each solved at the half share (my script; the identity check prints share 0.5
       on S337F and S205);
     - each entered elder first, at the dial's position 1, with consent given, on the whole menu (report l.133-135);
     - one seed and one estate weight;
     - the hold never acted on the counted paths. What stands for it is `couple-tie-look.test.mjs`, and S311F's two paths
       in `results-tie-c2-precheck.txt`.
   - What the default reaches: every couple the page solves, including:
     - an elder holding more than 60% and up to 90% of the pots, cut on the pots' share (couple.js `shareFor`);
     - couples entered younger first, solved on the mirror (`solverClient.js` l.130 and l.242);
     - the dial's positions 3, 6 and 10 (finding 2);
     - consent withdrawn, where there is one tier pair and the hold is idle (couple.js l.798);
     - the speed mode, where the shortlist feeds each person's ranking.
   - About the speed mode:
     - the couples' warning figures (SPEED-B) were measured without the joint move;
     - the look's cost, about a fifth of a younger couple's path (`results-tie-c2.txt` l.59: 164.4 to 196.3 ms), is the
       same with the shortlist on, so the speed mode now saves a smaller share of a couple's time than SPEED-B measured.
   - The share rules' registered run (D107) runs every arm without the joint move. A rule it passes would become a
     default beside a joint move it was not run with.
   - None of this is a reason to hold the change:
     - the look acts only above both caps, and only among moves at the best move's spending level and tier pair;
     - the report put most of this scope to the maintainer before D109.
   - But the STATE.md record of the change, in the same commit, should carry what stands by inference and what is not
     shown, as D99's line did, and should name this review.

## The six points asked

1. **Every route carries the joint move: yes, by reading.** How it is tested is finding 1.
   - The joint move is computed once per job (`src/solverClient.js` l.241). The owner gets it (l.262), and so does each
     part of a split solve (l.267). The worker passes it on (`src/solverWorker.js` l.157).
   - A solve restored from the store:
     - only each person's table is stored, keyed on their plan, the settings and `ageWith` (`src/solverKey.js`);
     - the joint move is forward only and changes no table;
     - the couple is assembled afresh, with the joint move.
   - Every caller reaches startSolve with `couple: { engine }` and no `joint`, so each gets appJoint:
     - the page's own solve (`useSolver.js` l.66);
     - every variant through startFigures: What if, the dial's live line, the scenarios, the age dial and the Simple
       page's search (`SolverFigures.jsx` l.59 and l.184, `SolverSimple.jsx` l.40).
   - The dial's positions: each person's base is solved or restored, then their table at the position, then the couple
     is assembled once, with the joint move (l.245-262).
   - A couple entered elder second is cut from the mirror and given the same joint move (l.242, l.262).
   - The speed mode:
     - each person's plan keeps `solver.speed`, because couple.js `singlePlanFor` spreads the plan
       (`speed-mode.test.mjs` check 6);
     - the joint move is assembled whatever the speed setting.
   - The engine carries out the hold, not only the choice: it reads each person's tiers from `perOwner`
     (`research/engine.mjs` l.2769; `model.js` l.630), which holdMove rewrites.
2. **The research side is unchanged.**
   - solveCouple sets the three options only when they are given (couple.js l.237-241, l.270). assembleCouple's `joint`
     defaults to null.
   - No audit reads APP_COUPLE or appJoint. A grep finds only the two identity scripts, the two tests and the harness.
   - No file under `src/solver` changes, so `code-id.mjs`'s code hash does not move.
   - The share rules' registered run, its relaunches and its read all run in its launch worktree
     (`registrations/share-rules.md` l.4-6), which this commit does not touch.
3. **coupleMeta's new key is harmless.**
   - backMeta spreads the record and swaps only the share and the two people's tables (`coupleOrder.js` l.109). The three
     options belong to the household and treat both people alike, so they need no swap. `couple-swap.test.mjs` check 4
     compares only the share, `self` and `part`.
   - The page reads `solveMeta.couple` only as true or false (`PlannerPlan.jsx` l.77 and l.188).
   - The diagnostic prints a fixed list of fields (`solverDiagnostic.js` l.45-62).
   - Nothing reads `meta.joint` or `couple.joint`.
4. **The block and the tests pin the code**, apart from the gap in finding 1.
   - The block's couples entry gains `tieJoint 0.0001`, `tieLook true` and `holdPast 2`, which are APP_COUPLE's values.
   - `couple-default.test.mjs`:
     - check 1 compares the entry with the code, key for key, refuses a planted block without the three keys, and pins
       the three values;
     - check 3 checks the client's message and the record;
     - each fails on its plant as claimed (run above).
   - `plan-defaults` passes.
   - Neither edited test is protected (`couple-default` is in FAST_JOINING, `couple-split` in the full tier), so no
     unlock is needed.
   - The evidence is an EXPLORATORY read. CHECKLIST 1 lets that change a default through a ruling naming the run, which
     D105 (in advance) and D109 are.
5. **The hold at locked positions:** finding 2.
6. **The D-line, the commit and B1's gate.**
   - D109 is the ruling. The commit makes the change and names this review. The record follows findings 2 and 3.
   - B1's gate on the batch that carries the change:
     - `run-all.sh 4173 --both`: ALL REQUIRED GREEN in both modes. The solver-planner harness's check 19 now runs against
       the joint move's reference; its plants run in one run.
     - Finding 1's check, shown failing on its plant there, before the merge.
     - `load-perf`: the classic planner's first load on a switch-on build was 236KB against a ceiling of 237 on the fifth
       batch (`load-perf-ui.cjs` l.86-93; whole KB, l.184). This change adds code to `src/solverClient.js` and
       `src/solverSettings.js`, which that load carries. Growth that is not the engine's code is D94 (2)'s stop.
     - Verify and both Full shards green on the head (`couple-split` runs in Full).
     - Each plant failing as named: `couple-default --planted` and `couple-split --planted` (`notie`), and finding 2's
       check with its plant.
