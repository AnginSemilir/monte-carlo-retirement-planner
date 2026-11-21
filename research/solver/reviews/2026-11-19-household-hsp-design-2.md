# Design review, second round: step 8, the household plan with its allowances priced at the pensions' split (HSPA) against today's couples' default (K2), `registrations/household-hsp.md` (D129 (3), D130 (2); before launch)

19 Nov 2026, about 15:55 to 16:35 UTC. The `reviewer` agent, second round (the first: `reviews/2026-11-19-household-hsp-design.md`).
Main tree at 90f0757b, clean, HEAD unmoved during the review: code-id 71fb4271c681 (the panel's), `stampFilesHash()` 64b3f42b016c,
the registration's blob b1bcaa624477. No unit was run, and nothing of seed 7024 was run, read or estimated. The only outcomes read
are seed 7002's: the pilot's 15 unit files (EXPLORATORY, already read for the sizing) and the arm read's results file. Every probe
ran at nice 19; a browser gate started on the machine at about 15:55, after the pilot had ended. The sizing script was not run as
committed, because it rewrites `household-hsp-paths.json`, a stamped file: its arithmetic was recomputed by importing its
functions. Scripts and outputs: `/tmp/claude-0/-home-user-monte-carlo-retirement-planner/4e4f86b0-577d-55d5-8df9-2dbd990f8aaf/scratchpad/hsp-design-2/`.
No repository file but this one was written.

## What I read (git blobs at 90f0757b)

- The design: `registrations/household-hsp.md` b1bcaa624477 (and its diff since 086e2626, before the pilot was read);
  `STEP8.md` f39be7ff82df; `STATE.md` d82e53952ae3 (D34, D61, D80, D116, D128 to D130); `DECISIONS-PENDING.md` e879b7291f03
  (items 1 to 5); `CHECKLIST.md`; the first round 0f7f3184c4cd.
- The arm read: `HOUSEHOLD-ARM.md` 517cac71823a, `results-household-arm.txt` 0eef14d8b4e6, its reviewer
  `reviews/2026-11-19-read-household-arm.md` 025806bb5316, commit 32318730's message.
- The run and its read: `audit-household-hsp.mjs` fb49a41baa12, `reduce-household-hsp.mjs` 75ea7ff6a1cc,
  `size-household-hsp.mjs` deb6c36fddd8, `household-hsp-panel.mjs` 35d848112b3f, `batch-household-hsp.sh` a379bc9e7d09; the data
  `household-hsp-panel.json` 78e4b83eb4d0, `household-hsp-orders.json` 3d2c295ae95a, `household-hsp-paths.json` fae341efcc27;
  `results-household-hsp-sizing.txt` ca03f9598625, `results-household-hsp-panel.txt` 9dfe35bd0db2; the diffs of 9c1dc08d and
  90f0757b, and of the audit, the read and `household.mjs` since 96c26bab (the first round's head).
- What they build on: `household.mjs` 5d316e011b3b (`householdPlanFor` 'pensionsPA', `bandsAt`, `solveHousehold`,
  `chooseHouseholdSingle`), `audit-household-arm.mjs` 585f5b62e32e (`scalePAProblems`, `CONFIG`), `audit-shapes.mjs` 94180a00e4ae
  (`shapesLineProblems`), `audit-household.mjs` f40361acbe6c (`JOINT`, `lineOf`, `householdSolveOne`), `audit-couples.mjs`
  f50aa99da601 (`wantProblems`, `d80Of`), `audit-couples-share.mjs` ac476126024d, `shapes-panel.mjs` af92d5e2e71a
  (`solverPlanOf`), `reduce-share-rules.mjs` b46fa5187e99, `reduce-couples.mjs` cae05c5a8e75, `reduce-phase4.mjs` ac319aad1f44,
  `stats.mjs` a4095c8e339e, `fair-gate.mjs` c6b3e87e1643, `size-phase4.mjs` f66f13d055ed, `reduce-household.mjs` 2a762db28f98,
  `check-prediction.mjs` ec4dfb8038ad, `run-from-snapshot.sh` cf7ab99bb4ec, `run-unit.sh` 57c3654f9162, `src/couplesSwitch.js`
  b33f855de049, `src/solverSettings.js` 0684649ddee3, `src/solver/couple.js` 7a12a4340749 (`solveCouple`'s plan); the ISA fix's
  diff in `src/App.jsx`, `src/solver/fast.js` and `model.js`. Every shared file whose blob the first round listed is unchanged.
- The pilot: `results/household-hsp-pilot/` (15 unit files, `case0.txt` to `case14.txt`), `results/household-hsp-pilot-3.log`,
  `-4.log`; the landings `results/household-hsp-land/` and `household-hsp-land.log`; for a timing comparison only,
  `results/household-hsp-pilot-603eeb595679-hsp/`.

## What I ran

1. The planted suites: `audit-household-hsp.mjs` 9, `reduce-household-hsp.mjs` 12 (the gate's 27 refusals among them),
   `size-household-hsp.mjs` 6, `household-hsp-panel.mjs` 11, `audit-household-arm.mjs` 6. All read as they should.
2. `node research/solver/check-prediction.mjs research/solver/registrations/household-hsp.md`: NOT COMPLETE on four lines, two
   for the Seed (a placeholder; no seed of the registry) and two for the Design review (a placeholder; the file missing).
3. `configOf` in both audits: APP ef459a5c8ccb, K2 21ca0ea6a7f0, HSPA e7913cca6fcd in step 8's. The arm read's HSPA is
   e7913cca6fcd, its configuration object the same byte for byte (`scale` 'pensionsPA'). `hashOf(APP_CANDIDATE)` 17ff82379838,
   `hashOf(COUPLES_CANDIDATE)` af001697ce1b. `JOINT` equals `APP_COUPLE`: `{"shareRule":"pots","tieJoint":0.0001,"tieLook":true,"holdPast":2}`.
4. The pilot's integrity:
   - every record is stamped `code 71fb4271c681 audit a11dd70ee278 prediction NOT-LAUNCHED sha - node v22.23.4`;
   - the stamp recomputed from git is a11dd70ee278 at 9c1dc08d (so the pilot ran on committed files) and 64b3f42b016c at
     90f0757b (the tree's);
   - `gate()` at the pilot's own stamp: fair;
   - `reduce-household-hsp.mjs --pilot` now: REFUSED on the audit stamp alone. The sizing has since rewritten the stamped paths
     file, as the first round foresaw.
5. The sizing recomputed, nothing written: N 16,000, 58.2 core-hours, 14.71 hours longest first, the longest unit 3.81 hours,
   all as printed. In the batch's own order (units 0 to 39, each to the slot that frees first) the run takes 15.93 hours.
6. The pilot's records, unit by unit:
   - each arm's engine inputs (`inputsHash`) are the same in all three arms on all 15;
   - HSPA's allowance, basic band and band for gains are k times one person's (S025-90 at k 1.1111: 13,966.7, 55,855.6 and
     41,888.9);
   - design A's raised no-earnings limit is kept (S273: 18,624.29; its gap8 21,590.65), and `hspaPlanProblems` finds nothing;
   - the household line carries the tie-break 0.0001 and the first person's line 0;
   - the rollout beside K2 differs from the engine on 0 and 0 of 500 paths on every unit.
7. The gate on real pilot records, one fault planted in S025-90's record at a time (finding 3): all nine refused, each by its
   own line (`gate-faults.mjs`).
8. Eight mutants of the rule in a scratch copy of the read: part 2 on summed cells, on its point, on its upper end; part 3 on
   its lower end, on its upper end; part 1 with the arms swapped; the pooled survival with the arms swapped; part 3 by pounds.
   Each fails at least one planted case.
9. `keptSpend` on two planted units (K2 spending 1,000 and 10,000 a path, HSPA -1% and +0.1%): -0.4500, so the units are
   weighted equally (by pounds it would be about -0.009).
10. D34 at 16,000 paths (`size-phase4.mjs thresholdFor`, `harmRate`) for a 90 unit, at S191-90's discordance and at the pilot's
    90 units' upper bounds.
11. Plan level, no solve: each of the 40 units' ages, retirement ages, pension access and the household plan's retirement
    (`retire-order.mjs`; finding 1).
12. Held out: `git grep -nw 7024`; the eight couples and the three reserves in every file changed since 96c26bab.
13. The panel: `git diff 9c1dc08d^ 9c1dc08d -- household-hsp-panel.json`; the twelve landings' recorded code.

## Verdict

Verdict: PASS

No BLOCKING finding, four MINOR.
- The switch to HSPA is complete in the code. The audit's check before any path, the gate's check from the record and
  `household.mjs` agree on what HSPA's plan is.
- BLOCKING 1's answer holds as a design.
- The registration is complete for the launcher but for the Seed (7024's reservation, the maintainer's unlock) and this review.
- Paths and Budget follow D34 and D21 from this pilot.
- Findings 1 and 3 are best answered before the launch commit (finding 3's file is stamped). Finding 2 is the half of the first
  round's MINOR 8 that was not answered.

## The four questions

1. **The switch to HSPA is complete and consistent.**
   - **The hash.** e7913cca6fcd in step 8's audit and in the arm read's, the two configuration objects identical. The household
     table's solve and the engine's context are the same calls in both:
     `solveHousehold(..., { solveOne: householdSolveOne(pts, light), topK: 3, tieJoint, holdPast, scale: 'pensionsPA' })` and
     `withHouseholdSingle(withAges(house.plan), { ...house, split: 'even' })`. Step 8's adds only a `counts` object, which
     `chooseHouseholdSingle` increments. This is by inspection, not by running both audits on one unit.
   - **What HSPA's plan is.** `householdPlanFor` 'pensionsPA' (`household.mjs` lines 191 to 195) prices these at k times one
     person's: the allowance, each SCALED limit (k x PA + k x (L - PA) = k x L) and the cap. Every other DOUBLED entry is
     doubled, and the no-earnings limit is then raised as design A raises it.
     - `scalePAProblems` (the audit, before any path) and `hspaPlanProblems` (the gate, from the record) both want exactly that.
       The latter also holds design A's own entries to twice one person's.
     - The band for gains is k times one person's in both: `bandsAt` with paK sets the default basic limit to k x L.
     - Neither found a problem on any pilot record.
   - **The panel's refusals.** `refusalOf` takes `HOUSE_OPTS` ('pensionsPA'). Every refusal in `householdPlanFor` comes
     before the scale branch, so either form refuses the same plans. The landings on 71fb4271c681 print "takes it" for every
     variant (84 lines, no refusal). Their recorded head is 978c948f, whose committed panel script still carried HSP's form;
     since the refusals are the same either way, nothing turns on it.
   - **HSP left where HSPA is meant.** None in the code. Two texts still describe what no longer runs:
     - the audit's header (lines 11 to 13: scale 'pensions', the bands above two allowances);
     - the sizing's printed line (line 95: "the panel's 45 and gap8 units are shapes HSPA has not run before"). The arm read ran
       HSPA on four gap8 shapes, two of them inside the guard (S149@gap8, S337F@gap8).

     No figure or decision rests on either. Both files are stamped, so any correction goes in before the launch commit.
2. **BLOCKING 1's answer holds as a design.**
   - **What decided the arm.** A rule committed before any unit ran (32318730), on seed 7002, on 56 units, none of them a
     step 8 couple: the arm audit refuses those, and its planted case reads `true 1111000 0`. HSP failed on S191-90 (26 net
     against 23). HSPA passed with no unit losing net, the nearest S149@elder2nd at 11 saved and 11 lost. Seed 7024 is
     untouched, and none of the 40 units was in the arm read.
   - **The panel carries S191-90's shape eight times, on held-out couples.** Every wrapper is at 90/10, k 1.111. At 16,000
     paths, a loss the size of HSP's on S191-90 (0.65 points) is flagged with chance 0.999 at S191-90's discordance (1.15%) and
     0.922 at the largest of the pilot's 90 units' upper bounds (2.71%), with thresholds of 0.388 and 0.463 points. A
     quarter-point loss is flagged with chance 0.049 at both. So if the mechanism behind BLOCKING 1 recurs under HSPA on a 90/10
     couple of this panel, the run fails.
   - **What the registration cannot do is confirm S191-90 itself.** Its +0.050 under HSPA stays in sample, and the
     registration says so (Question, lines 27 and 28). With (a) ruled, that is where it belongs, and the rule and the Outcomes
     need nothing more for the decision they make. The first round's (b), S191-90 as a named unit on 7024 outside the 40, stays
     open to the maintainer; I do not require it.
   - **The pilot's HSP figures were seen before the arm changed** (S273-sppart, chance 0.901). They did not decide it: the arm
     read's rule did, on other units. The registration names them (lines 116 and 117), as the first round's "what may change
     after the pilot" asked.
3. **Complete for the launcher; Paths and Budget.**
   - **The check.** check-prediction names only the Seed and the Design review. Every other field is present, and the hashes
     are on the Arms line. It does not read The launch at all (finding 4).
   - **Paths.** At the pilot's 15 discordances, the upper 95% bounds are at most 3.43% (S025-gap8), and each one's D34 size is
     the 16,000 floor. At 16,000 the 1-point rate holds to 10.50% discordance. Every one of the 40 units is at 16,000 in
     `household-hsp-paths.json`. That is D34 (2) as D61 applied it.
   - **Budget.** It is measured from this pilot on this machine (an Intel Xeon at 2.10GHz), with four processes on four cores
     (the chunks' load 4.0 to 4.5); the browser gate began after the pilot. It counts the solves, each arm's 200 checked paths,
     the rollout beside and one relaunch of the longest unit. The longest unit is inside the 12-hour limit.
     - Two refinements, neither changing the plan of one relaunch at the 12-hour limit:
       - in the batch's own order the run takes 15.93 hours, not the 14.7 of longest first;
       - the longest unit's 3.81 hours, and the four younger gap8 units' share of the core-hours, come from S351F-gap8. It ran
         in the resumed window three at a time, and its K2 arm's process used about 1.6 cores (629 s of CPU in 383 s of wall
         for 1,000 paths). So they are likely high, not low.
     - The whole pilot ran slower than the HSP pilot on the same units, the app's rules included: K2 192.8 against 146.4 ms a
       path on average, APP 0.67 against 0.49. The budget is the slower measurement, and its cause is not shown, as the
       registration says.
4. **The first round.**
   - **BLOCKING 1 and 3** are ruled and carried out (D130 (2), (3)). D80's check covers K2's tables alone, and
     `shapesLineProblems` holds the household line to the candidate's tie-break.
   - **BLOCKING 2:** part 2 is by path, pinned (the mutants above).
   - **MINOR 4:** answered, but for The launch (finding 4).
   - **MINOR 5:** answered.
   - **MINOR 6:** the record, the gate's re-checks, each log's done line, and the resume's registration blob and Node version
     are all in. The gate's settings and line re-checks have no planted case at the gate (finding 3).
   - **MINOR 7:** fixed first.
   - **MINOR 8:** the units are weighted equally (checked), and the measure is stated. A named unit is not sent to the
     maintainer, and only one measure is printed (finding 2).
   - **MINOR 9:** the guard is kept as built (D130 (5)). The registration's line 97 still reads as if its key were open,
     which does no harm.
   - **MINOR 10:** answered.
   - **The pilot and the sizing:** the requirements are met.
   - **New:** findings 1 and 3.

## Findings

1. **MINOR. Twenty-five of the 40 units have never been through the audit's checks before any path, and a refusal there under
   the registration stops the run on the held-out seed.**
   - **What the checks are.** `solveProblems` checks, before any path: arm A's pick; the guard; each table's settings line
     against CANDC; the household line against the first person's, each lowest level held to its table's floor over its
     target; the minimum pots; HSPA's plan; the band.
   - **Where they have run.** On the pilot's 15 units at 45 points, and on three of S025's at 6 points (3e76d443's smoke).
     The 25 units of S193, S027, S349F, S355F and S357F have never been through them.
   - **What a refusal costs.** Under the registration a failure is exit 3 for that unit (`audit-household-hsp.mjs` line 184).
     The read's gate then refuses on "missing", so the run stops after spending part of 7024 and needs an amendment and the
     maintainer. This is the class that stopped step 1's settings check (D124 (1)) and step 5 on units 20 and 27 (D125 to D127).
   - **The risk is small.** At plan level each unpiloted couple has a piloted couple's structure (access at 58 throughout):
     - S193 retires 60/60, three years apart, with six deposits, like S273;
     - S027 is 68/65 and retired, like S025;
     - S349F, S355F and S357F are 37/34 and retire at 52, like S351F.

     But the checks that bit before turn on each unit's own target, floor and share, which differ by couple.
   - **The precedent.** The arm read ran all 56 of its units through its checks at smoke settings before its launch (32318730).
   - **Fix, before the launch commit.** Run the 25 through `solveProblems` at 45 points with two paths, so the settings check
     runs too. Either a scratch panel in pilot mode, as 3e76d443's smoke did, or a driver that calls the exported
     `solveProblems`. From the pilot's solve times this is about 1.5 core-hours, under half an hour on four cores. No path of
     7024 is needed.

2. **MINOR. Under a PASS, a unit that M1 names does not go to the maintainer, and the pilot already names one. This is the half
   of the first round's MINOR 8 that was not answered.**
   - **What D116 covers.** D116 rules on the pot only where the household plan keeps more paths and delivers no less
     spending. On a unit that keeps more paths but spends less on the paths both keep, beyond noise, that condition fails, so
     D116 does not cover that unit's smaller pot.
   - **What the registration does.** It names such units "not a bar" (line 71). Its PASS commits the change of default in the
     D-line naming the run (line 75).
   - **It is likely to arise.**
     - The arm read named six under HSPA, among them S167 (-0.783%), S227-90 (-0.324%) and S023-db (-0.291%).
     - The pilot names S273-90: net +3 paths, spending -0.183%, se 0.033 (`m1ByUnit` on the pilot's records).
   - **Fix.** Keeping M1 out of the bars is right, so the fix is a line in the Outcomes and one in the read:
     - under a PASS, the named units go to the maintainer with the read, each with its pot capped and in pounds, before the
       change of default is committed;
     - beside each named unit, the read prints its spending over all paths as well as on the paths both keep. On the first
       round's S023-db the two measures had opposite signs.

3. **MINOR. The gate's re-checks of the settings lines and the household line have no planted case at the gate, though the
   registration says each refusal has one (line 100).**
   - **Why they have none.** The planted gate drops every line those two checks print (`reduce-household-hsp.mjs` line 210,
     the filter `/^\S+ (self|part|household): |^\S+: (self|household): /`), because hand-made lines cannot pass
     `wantProblems`. So none of the 27 planted refusals is one of them. `wantProblems` and `shapesLineProblems` have planted
     cases in their own files, but this gate's wiring of the record has none.
   - **The wiring is right.** I planted faults in S025-90's real record and ran `gate()` on the 15 pilot records. Each fault was
     refused by its own line:
     - the household table without the tie-break;
     - the first person's table with it;
     - the partner's table without HR;
     - the household table on another lattice;
     - the household line at another lambda;
     - the household's minimum pot moved;
     - HSPA's allowance doubled;
     - the band for gains two people's;
     - K2 and HSPA swapped.
   - **Fix, before the launch commit** (the read is stamped and read once). Add a planted case through the gate that takes a
     real line, with one fault for each of the two checks. The line can be one of the pilot's, or one built from `WANT` as
     `audit-couples.mjs --planted` builds it.

4. **MINOR. `check-prediction.mjs` does not read The launch, so the launch stamp is not enforced.**
   - **The claim.** The registration says the launcher's check refuses it until each placeholder is filled (lines 8 to 10).
   - **What the check reads.** Its fields are Question, Arms, Households, Seed, Paths, Primary metric, Decision rule, Outcomes
     and Design review (line 16), so the `<...>` in The launch (line 130) passes.
   - **Why it matters.** Nothing reads the stamp from the registration: the read checks the files and the logs. So nothing
     breaks, but the registration is the record of the launch, and it cannot change after it (`fair-gate.mjs` refuses an edited
     registration).
   - **Fix.** Fill it by hand at the launch commit, as `share-rules.md` did, and do not rely on the launcher for it.

## What holds (checked, no finding)

- **Held out.**
  - 7024 appears only in step 8's files and the planning documents; `SAVE-V2.md` takes 7025.
  - The eight couples and three reserves appear in no file changed since the first round except these three: step 8's own
    files, the arm audit's planted check, and `results-isa-allowance-sizing.txt`. The last ran S027's library plan under the
    app's own rule (Windfall to ISA) to size the ISA fix: no arm of this test, deciding nothing.
  - The frozen orders are unchanged (3d2c295ae95a).
- **The panel.** It was landed again on 71fb4271c681. In `household-hsp-panel.json` only `built` and `code` move, and the
  twelve landings record that code.
- **The pilot.** It ran on committed files: the stamp recomputed from git at 9c1dc08d. Its three resumed units ran each arm in
  one process, their saved parts taken up only with the tables' digests matched, and its gate is fair at its stamp.
- **Since the pilot was read,** the registration's changes are to Paths, What the pilot shows and Budget, and one statement of
  fact in Households (the landing again on the fixed code), reviewed here.
- **The arms are fair.**
  - The three arms' engine inputs hash alike on every pilot unit.
  - Before any path, K2's minimum pot is checked to be the unit's, and the household table's to be K2's.
  - K2's joint move is the app's own (`APP_COUPLE`).
  - K2's tables carry no tie-break and the household table carries the candidate's, both pinned from the record by
    `shapesLineProblems`.
- **The rule.**
  - Part 1 is D34 in whole paths, unit by unit; part 2 is by path; part 3 weights the units equally and reads its point. Each
    is pinned by the planted cases against the eight mutants.
  - On the pilot the pooled survival is +0.433 (+0.237 to +0.629) by path at 1,000 paths, an se of about 0.025 at 16,000.
    Spending on the paths both keep is +2.001%. So the outcome will turn on part 1, as the registration's per-unit chances say.
- **The launch path.**
  - The launcher reads the batch's `HELD_SEED=7024` alone, comment lines left out.
  - The registered mode refuses limits, any other prediction, and any code but the panel's.
  - Under the registration a log carries no outcome.
  - A resumed part is held to the stamp, the registration's blob and the Node version.
