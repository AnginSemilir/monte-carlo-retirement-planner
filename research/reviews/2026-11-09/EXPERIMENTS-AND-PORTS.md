# The review of 9 Nov: the experiments, the ports and the order (instructions for the agent, 10 Nov)

## The decision this carries out

The maintainer, 10 Nov, on the review of 9 Nov (`REVIEW.md`, beside this file): "Add your findings to the repo and
include the experiment design then port instructions if it works. Be prescriptive." And, the same morning, asked for
the order to do them in and a prompt to start the agent with.

Nothing here is done until the maintainer sends the prompt in the last section. When it arrives, record it in STATE.md
as the next D-line, in this form:

> The review of 9 Nov (`research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md`): its nine items in its order, each by its
> experiment, decision rule and port; the maintainer's answers as sent. Item 3 is a defect that changes a figure.

## How to read it

- Each item gives: what was found (the evidence is in `REVIEW.md` and `results/`), the experiment, the rule that
  reads it, the port if it passes, what to do if it fails, what to report back, and a time box.
- **EXPLORATORY** runs use seed 7002 and decide nothing by themselves (CHECKLIST 1). Where an item says a default
  changes, it names which of the two routes it takes: a registration (CHECKLIST 2), or the maintainer's ruling naming
  the run.
- **STOP** means stop and report to the maintainer. Each is also one of the launch plan's section 5 stops.
- Experiments use only households already in a `touched` list. A registered test takes the next untouched ones in a
  frozen order. `held-out.mjs` reads this folder, and now adds S021, S085, S091 and S261 to `touched()` (`REVIEW.md`'s
  note; S301, which the review also names, was there already). Fetch the review branch before any panel is built.
- **D4 is not touched** by anything here except item 1: not its worktree, its registration, seed 7021, its results or
  `d4-backup`. No D4 result is read or estimated before its registered read, by the agent or by a worker.
- Times are measured on one core of the review's machine: a single's solve at 45 points 400 to 510 s, its path on the
  whole menu 47 to 56 ms; a couple's solve 530 to 770 s, its path 390 to 610 ms.

Patches, scripts and outputs: `prototype/`, `scripts/` (see `scripts/README.md`), `tests/`, `results/`. Each patch
applies to f02e8741 with `git apply`, and is off unless switched on. With every switch off, a copy carrying all three
gives the branch's numbers bit for bit (`results/out-ident-off.txt`: 1,760 paths, 0 differing; its planted run fails).

## The items in the order to do them

| # | Item | Kind | The agent's time | The machine's time | Moves a figure? |
|---|---|---|---|---|---|
| 1 | D4 on more cloud sessions | the maintainer's ruling, then a procedure | half a day | about two days on four more sessions | no |
| 2 | A couple's path 2.4 times faster, exactly | port with an identity test | 3 hours | minutes | no |
| 3 | The engine's year in HMRC's order | a defect: test first, port, sizing | 2.5 days | 6 core-hours | **yes, every household's** |
| 4 | Relief on money the plan pays into a pension | port with a test; before the windfall factorial | 4 hours | minutes | only with the windfall split |
| 5 | The sweep keeps cash ISA money in an ISA, and the pages show the sweep | port, then an experiment | 1 day | 5 core-hours | yes |
| 6 | Couples who hold their money unevenly | A an experiment, B a port, C a registered test | 1.5 days over the three | A 25 core-hours; C about 60 | couples only |
| 7 | The chooser's shortlist (a single's path 3 times faster, approximately) | an experiment, then a port | 1 day | 4 core-hours | by under 0.1 points if it passes |
| 8 | What the library never contains; the dated rules | units in item 6C's panel; one caption now | 2 hours | with 6C | no |
| 9 | A two-stage rule for the registered runs after D4 | registration text and its sizing | half a day | none | no |

Why this order:
1. **Item 1 first** because D4 holds the main session's four cores for about eight more days (745 core-hours remained
   at 56 of 520 units on 9 Nov), and every machine-time item below waits behind it. Moved to its own sessions, D4
   finishes in about two days and the main session's cores are free.
2. **Item 2 next** because it is exact, takes three hours, and makes every couples' run after it 2.4 times cheaper,
   item 6's among them.
3. **Item 6's stage A is launched as soon as item 2 is in**, at low priority. It runs on the machine while the agent
   ports item 3. Its fault is large (32 points on the one couple run at 45 points) and does not depend on the tax fix.
4. **Item 3 is the largest piece of work and the only defect.** Items 4 and 5 touch the same files and re-pin the same
   tables, so they go in the same engine round, in that order.
5. **Item 7's experiment waits for item 3**, so the shortlist is measured once, on the tables that will ship.
6. **Item 6's stages B and C wait for D4's read.** If D4 does not turn the couples' solver on, they have nothing to
   fix.

---

## Item 1. D4 on more cloud sessions

**Found.** `batch-couples.sh` runs D4's 520 units four at a time, on the four cores of the one session it runs in. The
units are independent: path i of seed 7021 is drawn from 7021 + 7919 i wherever it runs. A unit's stamp is the code
hash, the audit hash, the registration's blob and the Node version (`audit-couples.mjs` line 156): it holds neither the
host nor the commit. A cloud session's machine is a fixed size (about 4 vCPUs, 16 GB, 30 GB of disk) and cannot be made
larger, but every session has its own. So more sessions are more cores.

**Withdrawn.** This item first said "rented cores". The maintainer works only through cloud sessions (10 Nov), so
there is no machine to rent. Its check that two hosts agree was also wrong: it compared `sha256sum` of whole arrays
files, and those hold the seconds taken and the CPU's name, so any two runs differ. Both are corrected below.

**The change.** One edit to `batch-couples.sh`, `prototype/d4-shard.diff`: with `D4_SHARD=i/n` set, a launch runs only
the units still to do whose number leaves i when divided by n. Unset, it runs all of them, as registered. Checked on
the launch commit e09ac60 (`results/out-d4-shard.txt`; no unit was launched):
- the code hash, the audit hash and the smoke stamp are the same with the patch and without (a8d0e9568319,
  3b700ddd7940, 07f96d05c3e1), and the launcher's seed registry passes on the patched batch;
- unset, the list of units to do is unchanged, in order; for n from 1 to 9, every unit is in exactly one shard, on a
  full list and on one with gaps; a value that is not i/n with i below n is refused (`scripts/d4-shard-test.sh`; its
  plant fails it).

**What it is not.** It is not free of the registration. That says D4 is "launched only as" the batch through the
launcher, "from a git worktree at the launch commit ... where every relaunch under `RESUME=1` and the read also run".
Here one file of that commit gains seven lines, the relaunches run in several worktrees in several sessions, and D63's
backup goes to more than one branch. No stamp moves, and the read still runs once at e09ac60. It is a departure the
maintainer rules on, not a mechanical step.

**The ruling asked (M1).** "D4's remaining units run in more cloud sessions, the batch split between them by
`D4_SHARD` and nothing else changed, each session's finished chunks backed up to its own branch as D63 has it; the
read as registered." Without it, skip this item: D4 finishes in the session it is in, and the rest of this document
stands, with its machine time at low priority beside D4.

**The procedure, if ruled.** STOP at any step that does not hold. "The main session" is the agent's own, where D4
runs now. A "worker" is a new cloud session that does nothing but run one shard.
1. **The reviewer's four checks**, written up as `research/solver/reviews/<date>-d4-sessions.md`:
   - at e09ac60, `batch-couples.sh` is in neither `code-id.mjs`'s files nor `audit-couples.mjs`'s `STAMP_FILES`, and
     names no script the smoke stamp does not already hold;
   - `reduce-couples.mjs`'s gate reads no host, commit, core count or finishing order;
   - no unit's paths depend on which other units run beside it, or in which session;
   - with `D4_SHARD` unset the patched batch computes the list the unpatched one does
     (`scripts/d4-shard-test.sh <the patched batch>` prints ALL PASS, and FAILED under `PLANT=1`).
2. **The edit:** one commit on a branch cut at e09ac60 (`d4-shard`), `prototype/d4-shard.diff` and nothing else,
   pushed. In a worktree at that commit, `node research/solver/code-id.mjs` and the batch's `AUDIT` line print the two
   hashes on the finished logs' stamp line. Print a log's first line only. Print nothing else of a log: its "beside"
   lines are results.
3. **Two sessions agree, shown without touching a D4 chunk.** D63 has nothing on `d4-backup` read before all 520
   units are in, so this runs on a preflight (the audit's own mode): one of the pilot's two couples, APP and CANDC at
   one estate weight, 200 paths of seed 7002, the same command in the main session and in the first worker. Then
   `node scripts/d4-same.mjs <the main session's arrays file> <the worker's>`, once for each arm. It sets aside the
   seconds and the CPU's name, compares the rest whole, and prints two hashes and no value. It must print "the same"
   for both. `DIFFERENT`: STOP, and no worker runs a D4 unit. Both sessions also print `node --version`: it must be
   the version on the finished logs' second line, or a worker's chunks would carry a second stamp.
4. **The first worker, alone.** Start one worker with the worker prompt below, as shard 0 of n. If the main session
   can start a cloud session itself (a scheduled task run once), it does; if not, it sends the maintainer the prompt
   to paste into a new session. A session with nothing but a tracked batch running may be paused as idle. So the
   worker pushes a heartbeat with every backup (the time, and the numbers of the units in flight), and the rest of the
   workers start only when the first one's branch has moved three times, 30 minutes apart, with no one prompting it.
   If it stops moving: STOP. Workers cannot be left alone, and D4 stays in the main session.
5. **The main session lets go.** At its window's end it stops its own D4 batch and launches no D4 unit again. Its
   finished chunks are on `d4-backup` already. Its four cores are then free for items 2 to 7.
6. **Each worker**, by the worker prompt:
   - a worktree on the branch `d4-shard`, the engine built, `node --version` as step 3 has it;
   - the finished chunks of `d4-backup` and of every `d4-backup-w*` branch copied into its results folder, byte for
     byte and unread, so `RESUME=1` skips them;
   - `RESUME=1 D4_SHARD=<i>/<n> PREDICTION=research/solver/registrations/couples-d4.md
     research/solver/run-from-snapshot.sh bash research/solver/batch-couples.sh`, as a tracked task, relaunched the
     same way at each 12-hour limit;
   - every 30 minutes, each finished chunk (its log and its arrays, byte for byte) and the heartbeat pushed to its own
     orphan branch `d4-backup-w<i>`, by a loop inside the tracked task, not by a turn of the model;
   - when the batch prints `0 to run`, one last push, a report, and nothing more.
7. **The gather and the read.** When every worker has reported, the main session copies every chunk on `d4-backup`
   and on each `d4-backup-w<i>` into the results folder of its worktree at e09ac60, byte for byte and unread. A unit
   found on two branches keeps one copy; list such units by number. Then the registered command, unedited, under
   `RESUME=1` there: it must print `0 to run`. If it prints more, it runs them, as registered. Then the read, once, as
   registered, and the backup branches go as D63 has it.

**The worker prompt.** The same for each, but for its number.

```
You are worker <i> of <n> for D4's registered run. Fetch review/external-2026-10-21 and claude/project-access-i58m0x.
Read item 1 of research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md on the first, and D63 and D61 in
research/solver/STATE.md on the second. Do item 1's step 6 with D4_SHARD=<i>/<n>, and step 3's preflight if you are
worker 0. Do nothing else: no other work, no edit to any file, and no D4 result read, printed or estimated. Report
when your shard has nothing left to run, or at once if a step does not hold.
```

**Size.** About 745 core-hours remained at 56 of 520 units on 9 Nov. Four workers are 16 cores: about two days. Eight
are 32: about one. Each worker still loses its units in flight at each 12-hour limit, as the one session does now. The
machines cost nothing extra, but every session draws on the same plan's usage limits; a worker that only waits on its
batch and pushes from a loop draws little.

**Report back:** the review file, the two stamp lines, step 3's two lines from `d4-same.mjs`, the first worker's three
heartbeats, and at the end the count of units from each branch.
**Time box:** half a day of the agent's time, apart from the run.

---

## Item 2. A couple's path 2.4 times faster, exactly

**Found.** 78% of a couple's solved path is `rankFor` (`src/solver/couple.js`) ranking each person's 800 moves with
`scoreMoves`, the unshared scorer the speed review replaced in the single chooser. `chooseAction` already leaves every
move's score, with the switch charged, in `tab._sc`, and its bequest in `tab._bq`. Ranking from those: S091, 100 paths,
575 ms a path to 235 ms at 45 points and 573 to 238 at 4, every path's survival and pot left the same bit for bit
(`results/out-couple-fast-45.txt`). On S007 at 4 points, 100 paths of seed 99002, on a copy carrying exactly the
patch here: 478 ms to 192, the same bit for bit; and with the planted fault all 100 paths differ
(`results/out-couple-rank-identity.txt`).

**Kind.** An exact port (D24's rule: one differing bit stops it). No experiment beyond its identity test.

**Step 1. The port.** `prototype/couple-rank.diff` is the code that was measured.
1. In `rankFor`, after the early return for a table with no switch charge and before the old scoring, the block of the
   patch. Its guard is `tab.mix && !tab.lockTiers && !tab.rich && tab.finalExact`:
   - a locked dial position (`lockTiers`) and Richardson's second table (`rich`) keep the old path, because
     `chooseAction` does more than score there;
   - so does a table without the exact final year, because the old path scores another year for it.
2. `COUPLE.fast`, on by default once step 2 passes. The test turns it off to compare.
3. `COUPLE.check` (test only): `rankFor` computes both rankings and counts any that differ, as `CHOOSER.check` does
   for the shared scoring. Counters: decisions, those that took the new path, those that differed.
4. The plant `faststale` (in the patch): the scores of the decision before.
5. Re-pin e3pcls (D9): its fingerprint covers every file under `src/solver`.

**Step 2. Its test.** A new `research/tests/couple-rank.test.mjs`, quick and `--full`. Each check is shown failing on
its plant (CHECKLIST 5).
1. **Every ranking the same.** S007 (couple-quick's fixture) at 6 points, 60 paths of seed 7002, `COUPLE.check` on:
   no ranking differs, at any decision, for either person.
2. **Every path the same.** Survival and pot left bit for bit with `COUPLE.fast` on and off, on the same 60 paths.
3. **Not vacuous.** The count of decisions that took the new path is printed, and none is a failure: a check that
   ran on nothing is an error, not a pass.
4. **The guard.** With a locked dial position (and with Richardson's second table, if a couple's table can carry
   one), the new path is taken at no decision, and the paths are the same.
5. **The plant.** With `faststale`, checks 1 and 2 fail.
6. **`--full`:** checks 1 to 3 at 45 points, 100 paths, on S007 and on S127 (bridge years).
7. `couple-tables.test.mjs` (its check that `rankFor`'s first move is `chooseAction`'s), `couple-quick.test.mjs` and
   `couple-lockstep.test.mjs` pass unchanged with the default on.
8. The fast suite passes (CHECKLIST 4).

**Acceptance.** Checks 1 to 8, and a couple's path at 45 points at least twice as fast on the `--full` couples.

**If it fails.** Any ranking that differs: STOP. Report the first one: the couple, the year, the person, the state,
the two rankings and the two score vectors. Do not widen the guard to make it pass.

**If it passes.** `COUPLE.fast` on in code. D5's time budget for a couple is measured on it. Every registered
couples' run after D4 takes it through its code hash. D4 does not: its code is frozen.

**Report back:** the identity counts, the planted failures, the two timings. **Time box:** three hours.

---

## Item 3. The engine's year in HMRC's order (a defect that changes a figure)

**Found** (`REVIEW.md` 1.1 to 1.3). The engine does not stack a person's year as HMRC does:
- a worker's pay is left out of the income their interest, dividends, gains and pension draws are taxed on;
- interest and dividends are taxed before the year's pension is drawn, so the allowance and the lower bands can be
  used twice (the engine's own comment at 4a: "deliberately not chased");
- `savingsTax` places the starting rate band and the savings allowance over unused personal allowance, and
  `dividendTax` does the same with the £500;
- the basic band left for gains ignores the year's interest and dividends;
- the allowance's taper is applied to non-savings income alone.

`src/solver/model.js` and `fast.js` repeat it line for line, so the engine and the solver agree and both differ from
HMRC.

**Measured.**
- `tests/engine-hmrc.test.mjs` (22 checks against a reference that is not the engine): 12 passed, 10 failed on the
  branch. On the prototype, 21 passed, 1 failed: C7, the taper, which the prototype does not build.
- The engine misses £302,307 of tax over S214's plan and £33,146 over S210's, under the plan's own rules.
- Put right across the 237 households of the two `touched` lists, the plan as entered, 1,000 paths of seed 99001:
  survival -0.3 points on average, 0 at the median; 24 lose more than a point; the worst -3.7; none gains more than
  0.1 (`results/out-tax-library.txt`).
- On three plans solved at 45 points, the solved plan loses 0.0 to 0.6 points and its margin over the rules holds
  (`results/out-variants-*.txt`).

**Kind.** A bug fix (CHECKLIST 7: fixed together with a test that catches its class). It is "a defect that changes a
figure", so it is on the beta's go or no-go list and is one of the launch plan's stops. By the rules as they stand it
merges to `main` after the beta's two weeks and before on by default: B9 holds it until then, and the go or no-go list
requires it. The maintainer can have it sooner (M2).

**Step 0. The test first, shown failing.**
- Do **not** add the test to `research/tests/` yet: it joins the fast tier when its file exists, and it fails until
  step 2.
- Reproduce its failure on your code from the review's copy:
  `git show origin/review/external-2026-10-21:research/reviews/2026-11-09/tests/engine-hmrc.test.mjs > /tmp/engine-hmrc.test.mjs`
  then `REPO_ROOT=$PWD node /tmp/engine-hmrc.test.mjs`. It must print `12 passed, 10 failed`, as
  `results/out-engine-hmrc-branch.txt` has it. Keep the output as `research/tests/results-engine-hmrc-before.txt`.
- The test's reference (`hmrcYear`, about 20 lines) and its twelve hand-worked years stay in the test. **Do not import
  it into the engine or paste it there.** The test is worth something only while the two are written apart.

**Step 1. The engine (`src/App.jsx`).** `prototype/engine-hmrc.diff` is the code that was measured. It is a sizing
tool, switched by three globals; the port is cleaner and has no switches.
1. **One function for a person's year**, on `taxParams`' own fields: `personTax(P, { nonSavings, interest, dividends })`
   returning the tax on each and the allowance used. HMRC's order:
   - the allowance, tapered on all three together, against non-savings income, then interest, then dividends;
   - non-savings income on the region's ladder; interest and dividends on the UK's bands above it;
   - the starting rate band (£5,000 less taxable non-savings income) and the savings allowance at 0% at the bottom of
     the taxable interest; £500 at 0% at the bottom of the taxable dividends.
   `savingsTax` and `dividendTax` become calls to it, or go.
2. **Pay at the bottom of the stack.** In step 4, each working person's taxable pay for the year: the pay
   `workingTakeHome` taxes, after salary sacrifice and net-pay contributions, not `salaryAtYear` (the prototype uses
   `salaryAtYear`, which is right only with no saving). Every tax in the year stands on it: 4a, 4b, the draw's ceiling,
   gross-up and net, the gains' band, and `taxPaid`, which is the person's whole bill less the tax on the pay alone.
3. **A draw pays for what it does to the interest and dividends.** The net a pension draw delivers is the tax-free
   part, plus the change in the person's net income, less the rise in their interest and dividend tax. Fold that into
   `grossPensionNeededForNet`'s own solve, so the draw delivers what was asked in one pass. The prototype tops up in
   up to four passes instead; do not port the loop.
4. **The gains' band** takes the basic band less all the year's taxable income, interest and dividends included.
5. **The row** gains, per person: taxable pay, interest, dividends and income tax. The test's section C then checks a
   couple who hold cash and a taxable account, which it cannot today (it refuses, by design).
6. **The comment at 4a** ("deliberately not chased") goes.

**Step 2. The solver's model, in step.** The same order at each place the model repeats the engine:
- `src/solver/model.js`: 4a and 4b (lines 299 to 308), the draw (333 to 349), the gains' band, `taxPaid` (611);
- `src/solver/fast.js`: 4a and 4b (461 to 464), the two draws (478 to 480, 599 to 601), `taxPaid` (673), the gross-up
  (703 to 704), and `netOf(tb, ·)`, which now starts from the pay: `netOf(tb, pay + x) - netOf(tb, pay)`.
- **The solve's time.** The draw's inner loop gains two tax evaluations. Time the solve before and after on S116 and
  S370 at 45 points. Slower by more than 10%: tabulate the interest and dividend tax against taxable income once a
  decision (the interest and the dividends are fixed within one), then time it again.

**Step 3. Its tests.**
1. `research/tests/engine-hmrc.test.mjs` (the review's file, its `REPO_ROOT` and `PROTOTYPE` lines dropped, section C
   reading the row's taxable pay): every check passes, C7 among them. Add:
   - C4 and C5 again with the library's saving left on (the taxable pay after contributions);
   - C6 again with £200,000 of cash and a £300,000 taxable account split between the two (the row's new split).
2. **Its plant:** pay dropped from the dividends' stack. C5 must fail. One plant in its own run (CHECKLIST 5).
3. **Checks that pin the old behaviour and must be re-derived by hand**, found by running the existing tests on the
   prototype with its switches on:
   - `savings-tax.test.mjs` B2 and B3 (25 passed, 2 failed): B2 pins the interest's tax to `savingsTax` on the other
     income alone, which is the defect;
   - `uktax.test.mjs` D2 and D2b (30 passed, 2 failed): the fixture expects the engine to draw a 58-year-old's
     pension beside their £70,000 salary and so trigger the MPAA. With pay in the stack the rules no longer make that
     draw.
   `tax-2026`, `scottax` and `bed-sipp` pass unchanged. I did not run `known-answer`, `engine-fidelity` or
   `check-state` on it: the prototype does not change the model, so they would fail for that reason alone.
   Each pinned figure that moves is listed in `results-engine-hmrc.txt` with its old value, its new value and the
   working. `savings-tax.test.mjs` is protected (FAST names it): that edit needs the maintainer's unlock.
4. V1 and V2 (`engine-fidelity.test.mjs`, `check-state.test.mjs`): the engine and the model in step, every slot within
   a pound, on a working household with a taxable account (S210) as well as the households they use now.
5. The fast suite passes. Re-pin e3pcls (D9).
6. **The pattern search** (CHECKLIST 7): grep `src/` for every call of `incomeTax(`, `calculateUKNetIncome(`,
   `savingsTax(`, `dividendTax(` and `paAt(`. For each, write in the results file which income it stands on and
   whether pay, interest and dividends are in it. `netGuaranteed`, the Bed and SIPP relief, the accumulation
   tournament and the Simple page's figures are the ones I did not read.

**Step 4. Size it** (EXPLORATORY, seed 7002; the engine before against the engine after, same paths).
1. **The plan's own rules, every household in the two `touched` lists**, 1,000 paths (`scripts/tax-library.mjs` is
   the form). Expect about what the review measured: mean -0.3, about 24 of 237 losing over a point, the worst near
   -3.7. STOP if any household moves by more than 6 points, or the mean by more than 1: that is not this defect.
2. **Solved plans:** the review's eight households (`audit-curve.mjs` `HOUSEHOLDS`), each solved at 45 points on the
   engine before and again on the engine after, 4,000 paths. Report, for each: survival before and after, the margin
   over the rules before and after, the expected path's tax. STOP if the pooled margin over the rules falls by more
   than 2 points: the solver was leaning on the mispricing more than the three households here suggest.
3. **Does D4's read carry to the fixed engine?** After D4's read, on D4's two pilot couples (already used, seed
   7002), CANDC less APP at 4,000 paths on the engine before and after. If the difference between the two differences
   is within 1.5 points on both, D4's read carries. If not, STOP: the maintainer rules whether part of D4 is run
   again.

**If a step-3 test cannot be made to pass.** STOP with the failing row: the fixture, the year, the engine's tax, the
reference's, and each income. Either the engine or the reference is wrong, and that is found by hand on that one
year, not by adjusting either to match.

**Step 5. What the pages say.** One line where the beta's users will see it, in the maintainer's words. A draft:
"We corrected how income tax is worked out when you have a salary, savings interest or dividends in the same year as
a pension withdrawal. Most plans change by less than half a point. Plans with a large taxable account, or a salary,
change by up to four."

**Report back:** `results-engine-hmrc-before.txt` and `results-engine-hmrc.txt`; the pinned figures that moved; step
4's three reads; the solve's time before and after.
**Time box:** two days for steps 0 to 3; half a day for step 4.

---

## Item 4. Relief on money the plan pays into a pension (before the windfall factorial)

**Found** (`REVIEW.md` 1.5). Money the plan routes into a pension from the household's own funds lands at face value
(`pots[x.id] += x.amount`, step 1 of `stepYear`). The windfall split's pension-first variant is one such route
(`autoSplitRoutes`: `pen1 = min(A, penRoom)`). £2,880 paid in should add £3,600. `bedAndSippFor` already does this
correctly since D36. The windfall factorial is next in the research queue (B7), and its pension-first arm is
under-priced by the missing 25%, more for a higher-rate payer.

**Kind.** A rule fix with a test. No experiment: the factorial is the experiment, and it must not run before this.

**Step 1. The port.**
1. In `autoSplitRoutes`, variant 1: the pension takes `gross = min(penRoom, A / (1 - P.reliefAtSource))` and costs
   `net = gross * (1 - P.reliefAtSource)`; the ISA and the rest share `A - net`. A payer above the basic band gets the
   rest of their relief as `bedAndSippFor` works it out (`refund`), paid to their cash.
2. **Every other route that adds to a pension from the household's own money:** the staged transfers (step 1.5) and
   any Auto deposit. List each in the results file with what it does today. Each is relieved the same way, through one
   function shared with `bedAndSippFor`.
3. **A typed one-off deposit stays as it is.** Whether the amount typed is what the household pays or what arrives is
   a wording question for the input, and the maintainer's (M3, a row for `DECISIONS-PENDING.md`).
4. The model repeats it wherever `model.js` and `fast.js` book the split.

**Step 2. Its test.** A new `research/tests/windfall-relief.test.mjs`, each case worked by hand in a comment:
1. no earnings, a £10,000 windfall, room £3,600: the pension gains £3,600 for £2,880; £7,120 goes on;
2. pay £40,000, a £20,000 windfall, room above £25,000: the pension gains £25,000 for £20,000;
3. pay £80,000 in England, the same: the pension gains £25,000 for £20,000 and £5,000 comes back as a refund (the
   £25,000 sits in the 40% band; 20% of it came at source);
4. the MPAA triggered: room £10,000, so the pension gains £10,000 for £8,000;
5. **the plant:** relief dropped. Case 1 fails.
6. With no windfall split on the move, every figure is as before, bit for bit (S116 and S210 at light settings).

**If it passes:** the windfall factorial runs as planned. **If case 6 fails:** STOP; the change reached a path it
should not have.

**Report back:** the test's output, the list of step 1.2. **Time box:** four hours.

---

## Item 5. The sweep keeps cash ISA money in an ISA, and the pages show the sweep

**Found** (`REVIEW.md` 1.4). Under a table, cash above the buffer moves to the taxable account each year (step 7d),
whether or not it is cash ISA money. A cash ISA can transfer to a stocks and shares ISA without using any allowance.
On S116 about £360,000 leaves the ISA in year 0. The sweep is also not among the actions the pages show. Prototyped
(`__ISA_SWEEP`), at 45 points on a plan not re-solved for it: S116 89.8% to 90.4% with the mean pot left 8.9% higher
and the expected path's tax £19,041 lower; S092 86.1% to 85.9% with the pot 0.9% higher.

**Two parts, and only the second is conditional.**

**Part 1, not conditional: the pages show the sweep.** Wherever the solved plan's actions are listed, a year with a
sweep says so: how much, from which account, to which. Its test: on S116's solved plan, year 0's actions name the
move and its amount to the pound. It needs no experiment: the estate shown already assumes the move.

**Part 2: where the swept money goes.**

*Step 1. The port, as an option, off.* `sweepCashIsaTo: 'isa' | 'gia'` (the default `'gia'`, as now), recorded in
`meta`:
- the engine's 7d as the prototype has it: of the excess, the part that is cash ISA money (the buffer keeps the
  sheltered cash first, as 7e does) goes to the stocks and shares ISA where the person holds one; the rest to the
  taxable account with its basis;
- the same in `model.js` (the sweep at line 540) and in `fast.js`;
- V2's state check passes on S116 with the option on, in a year with a sweep.

*Step 2. The experiment* (EXPLORATORY, seed 7002, on the engine after item 3).
- **Households:** the review's eight, and the four singles in `phase4-orders.json`'s `touched` list with the most
  money in a cash ISA (print them with their balances; S116 will be one).
- **Arms:** `'gia'` and `'isa'`, each household solved at 45 points under each.
- **Paths:** 4,000, paired.
- **Read:** survival, spending delivered, the mean pot left, the expected path's tax.

*The decision rule, committed before launch.* The option becomes the default if all three hold:
- pooled over the twelve, the paired survival difference's 95% interval has its lower end above -0.2 points;
- no household's interval lies wholly below -0.5;
- the pooled mean pot left is not lower.

*Outcomes.*
- **Passes:** the maintainer's ruling naming the run makes `'isa'` the default; the page's line names the ISA.
- **Fails on survival:** the default stays; report which households and why. My guess at the cause, to check first:
  the ISA's money follows the tier the solver picked for the ISA, the taxable account's follows its fixed mix, so the
  move changes the household's risk as well as its tax.

**Report back:** part 1's screenshot; the experiment's read. **Time box:** one day.

---

## Item 6. Couples who hold their money unevenly

**Found** (`REVIEW.md` 4.1). `solveCouple` solves each person's table on half the household's spending (`share`, 0.5)
from their own pots. If one person cannot fund half alone, their table reads ruin everywhere and the rollout chooses
blind. Every library couple holds 60/40, so D4 cannot see it. With the same household totals re-held, the rules arm
landed at 85.3%:

| | Rollout, each table on half | Rollout, each table on that person's share of the pots |
|---|---|---|
| S091, 90/10, 45 points | 53.0% (0 saved, 97 lost of 300) | 96.0% (32 saved, 0 lost) |
| S127, 90/10, 4 points | 75.0% (4, 35) | 93.0% (23, 0) |
| S007, 90/10, 4 points | 76.0% (1, 29) | 93.7% (25, 0) |
| S007, one person holding everything, 4 points | 65.0% (0, 61) | 91.0% (17, 0), the table on 0.95 |

As the library holds it, S091 at 45 points reads 94.0% (27 saved, 1 lost).

**A constraint on the remedy.** D4 tests `share` at 0.5 on couples who hold 60/40. A rule that sets `share` from the
pots would give them 0.6, which D4 never ran. So the rule keeps 0.5 wherever the first person's share of the pots is
between 0.40 and 0.60, and takes the pot share outside it, held to 0.05 to 0.95. That puts a step in the rule at the
band's edge, which stage A tests.

### Stage A. The experiment (EXPLORATORY, seed 7002; launch as soon as item 2 is in)

- **The unit:** `scripts/couple-share.mjs` is the form. Build it as your own audit, batch and reducer, so each unit
  records its settings and the fair-test diff sees them.
- **Your batch reproduces the review first.** Its first unit is S091, `ninety-ten`, `GUARD=1`, 45 points, 300 paths
  of seed 4242. It must print 53.0% against 85.3% (0 saved, 97 lost), as `results/out-share-S091.txt` has it. If the
  working branch has changed the rollout since f02e8741, say so and report what it prints.
- **Couples:** one from each of the library's age patterns but the youngest (37 and 34, whose paths are the
  longest), all in a `touched` list: S007, S079, S127, S187, S391, S267. The review probed S007 and S127 at light
  settings; the other four are new to this question.
- **Who holds the money:** as the library has it; 65/35; 75/25; 90/10; one person holding everything.
- **The share rule:** 0.5; the pot share (`SHARE=auto`).
- **Settings:** 45 points, the rules arm with guardrails, the 80% floor and the 5-year lookahead, the target landed so
  the rules arm survives 85% on the unit's own paths, 500 paths.
- **Size:** 60 units of about 25 minutes: 25 core-hours.

**The decision rule, committed before launch.** Write d for the rollout's survival less the rules arm's, in points,
paired.
1. **The fault is real** if, at 90/10 under 0.5, d is below -5 on at least four of the six couples.
2. **The remedy works** if, under the pot share:
   - at every uneven holding, on every couple, d's 95% interval is not wholly below 0;
   - at each uneven holding, the six couples' mean d is within 3 points of their mean d as the library holds it under
     0.5.
3. **The band's edge is safe** if, at 65/35, the six couples' mean d under the pot share is within 3 points of their
   mean d as the library holds it under 0.5.

**Outcomes.**
- **1 fails:** the review's finding did not hold at 45 points on other couples. Report, and stop this item.
- **1 holds, 2 or 3 fails:** the guard alone (below), and report which couples and holdings failed. A better remedy
  (one table for the couple, or a search over `share`) is a new design for the maintainer, not this port.
- **All three hold:** stages B and C, after D4's read.

**The guard, in either case (M4).** When D4's read turns the couples' solver on, a couple whose first person holds
less than 0.40 or more than 0.60 of the pots keeps the app's rules, and the page says why, until stage C reads. It is
one test where D5 decides whether a couple gets the solver, with its own check: a 90/10 couple gets the rules.

### Stage B. The port (a research option, off)

1. `solveCouple`'s `share` taken from `shareFor(plan)` when `opts.shareRule === 'pots'`: 0.5 inside 0.40 to 0.60, the
   first person's share of the pots outside it, held to 0.05 to 0.95. `meta` records `share` and `shareRule`;
   `fair-variables.mjs` takes the keys (protected: the maintainer's unlock).
2. A new `research/tests/couple-share.test.mjs`:
   - `shareFor` on five couples worked by hand: 60/40 gives 0.5; 45/55 gives 0.5; 75/25 gives 0.75; 90/10 gives 0.9;
     one person holding everything gives 0.95;
   - with the rule off, a couple's tables are bit for bit as before;
   - S007 re-held 90/10 at 6 points, 200 paths: the rollout under the rule is not more than 2 points below the rules
     arm;
   - **the plant:** the rule forced to 0.5. That check fails (the review measured -9.3 at 4 points).
3. The fast suite; re-pin e3pcls.

**Time box:** four hours.

### Stage C. The registered test (CONFIRMATORY; after D4's read says the couples' solver ships)

`registrations/couples-share.md`, design-reviewed before launch, its seed reserved by the maintainer.
- **Question:** does the couples' solver with `shareRule: 'pots'` keep more couples solvent than the app's rules,
  with no harm, when the couple holds its money unevenly?
- **Arms:** CANDC with `shareRule: 'pots'`; APP as D4 defines it; and, reported but not gating, CANDC at 0.5.
- **Households:** the next 12 library couples in `couples-orders.json`'s library order that `held-out.mjs touchedAll`,
  run on the day, does not list. Each is taken three times: re-held 75/25; re-held 90/10 (the household's totals in
  every wrapper kept); and as the library holds it with one feature the library lacks (item 8). The panel is built by
  a script and frozen before the seed is read.
- **Seed:** a new held-out seed, reserved in `check-prediction.mjs`'s registry (protected: the maintainer's unlock).
- **Paths:** by D34 from a pilot on seed 7002, as D4's were.
- **Primary metric and rule:** D34's harm rule on each of the 24 re-held units against APP, and their pooled gain
  against APP. The 12 units with a feature are read by the same harm rule and reported apart.
- **Outcomes:**
  - no re-held unit flagged and the pooled gain's 95% interval above 0: `shareRule: 'pots'` becomes the couples'
    default and the guard comes off, in the same commit as the D-line;
  - a re-held unit flagged: the guard stays for couples outside the band, and the maintainer rules on a new design;
  - a unit with a feature flagged: STOP. The couples' solver harms a kind of household the library does not hold, and
    the maintainer rules before the couples' beta.
- **Size:** about 60 core-hours with item 2 in.

**Report back:** stage A's read whole; stage B's test; stage C's registration before its run.

---

## Item 7. The chooser's shortlist (a single's path about 3 times faster, approximately)

**Found** (`REVIEW.md` 2.1). The chooser scores every move at every decision: 97.8% of a solved path. Scoring only
the moves the tables stored around the position, widened to every spending level and tier pair of those moves' draw
order and re-wrap (`structure`), ran 3.1 to 4.5 times faster on four households at 45 points, with 6 paths saved and
5 lost of 4,000. The narrowest width (`cells`) ran 7 to 10 times faster with 20 saved and 21 lost, and with a check
against the table's own value 5.5 times on the hardest household. That bounds the loss near 0.15 to 0.3 points, not
at D65's 0.1. It must be measured at 45 points: at 4 points `cells` loses 9.

**Kind.** An approximate cut under D65. An experiment, then the maintainer's ruling naming the run, then the port.

### Stage A. The experiment (EXPLORATORY, seed 7002; on the tables after item 3)

- **Households:** the review's eight (`audit-curve.mjs` `HOUSEHOLDS`).
- **Arms, on one solve a household at 45 points:** the whole menu; `structure`; `cells` with the check at 0.5 points
  (`SHORT.delta = 0.005`; `short.mjs`'s variant `cells-held@0.005`). `prototype/shortlist.diff` and
  `scripts/short.mjs` are the code and the unit.
- **Paths:** 16,000, the same for every arm.
- **Also:** the replay of `short.mjs` on 100 of those paths: at each decision of the whole menu's own path, the score
  each width gives up.
- **Size:** about 4 core-hours.

**The decision rule, committed before launch.** A width passes if all four hold:
- pooled over the eight, the paired survival difference's 95% interval has its lower end above -0.1 points;
- no household's interval lies wholly below -0.3;
- pooled spending delivered is within 0.05 points of target of the whole menu's;
- the pooled mean pot left is within 0.5%.

The pooled interval's half-width at 128,000 paths is about 0.03 points for `structure` and 0.06 for `cells`, at the
discordance the review saw, so the rule can tell a loss of 0.1 from none.

**Outcomes.**
- **Both pass:** the faster. **One passes:** that one.
- **Neither:** measure `order` (every re-wrap too; 1.7 to 2.2 times) by the same rule, report, and stop.

### Stage B. The port (after the maintainer's ruling naming stage A's run)

1. `chooserShortlist: false | 'structure' | 'cellsChecked'` beside the chooser's other options, off in code, recorded
   in `meta`; `fair-variables.mjs` takes the key.
2. **Where it is used:** the paths that only count (the headline's 2,000, the Strategy tab's paths, research runs).
   **Where it is not:** the expected path and any path whose decisions the pages show. Those keep the whole menu: one
   path costs 55 ms, and a shown decision should be the best one.
3. A new `research/tests/chooser-shortlist.test.mjs`:
   - the option off: every table and every path bit for bit as before;
   - the shortlist is part of the menu, never empty where a move is affordable, and the whole menu is scored where it
     is empty (counted, and above nothing on S370);
   - **plant 1:** the mask emptied. Every decision falls back, and the paths equal the whole menu's bit for bit;
   - **plant 2:** the stored best move dropped from the mask. The replay's count of decisions giving up score rises
     above the unplanted run's;
   - a coarse known answer: S116 at 45 points, 1,000 paths, survival within 0.5 points of the whole menu's.
4. The fast suite; re-pin e3pcls. A registered run that uses it names it in its arms.

**Not in this item.** With item 2 and `structure` together a couple's path was 141 ms against 575 (4.1 times, 100
paths). That needs its own paired measurement on couples before a couples' run takes it.

**Report back:** stage A's read whole, with the replay's counts. **Time box:** one day.

---

## Item 8. What the library never contains; the dated rules

**Found** (`REVIEW.md` 4.2, 1.6). All held-out evidence is drawn from 420 households on seven age patterns. None has
another income (a DB pension, an annuity, rent), a gain already in the taxable account, a state pension age other than
68, or a couple other than 60/40 with a 3-year gap. A probe on S116 at light settings showed no warning sign, on one
household.

1. **In item 6C's panel**, each couple is also run as the library holds it with one of: a £15,000 DB pension from
   the first person's state pension age; half the taxable account already a gain; a state pension age of 67. Which
   couple gets which is set by its place in the frozen order, in the registration. Any later registered panel of
   singles does the same.
2. **One caption, now.** `src/App.jsx` line 12409 says "Defaults are 2025/26 (frozen to April 2028), and all
   thresholds are held constant in real terms." The figures are 2026/27 and the freeze runs to April 2031. No figure
   moves.
3. **For the maintainer (M6), nothing to build yet:** savings rates rise to 22, 42 and 47% from April 2027; NIC
   relief on salary sacrifice is capped at the first £2,000 from April 2029; the thresholds are frozen in cash to
   April 2031 and the engine holds them constant in real terms. Either the engine carries rules by tax year, or the
   page states the assumption. A row for `DECISIONS-PENDING.md`.

**Time box:** two hours, apart from the panel.

---

## Item 9. A two-stage rule for the registered runs after D4

**Found** (`REVIEW.md`, Review 3; `scripts/twostage.py`, `results/out-twostage.txt`). D4's registration records a
second stage, more paths for a comparison past D34's limit, as not chosen (D61). This is a different one, and it is
for the runs after D4. After 5,000 paths a unit stops, unflagged, when its observed change against the app's rules
is +0.5 points or more; otherwise it runs to its full paths and is read as now. Simulated at 400,000 runs a case: a
true 1-point loss is flagged 0.9647 of the time against 0.9648 with one stage at 9% discordance, and 0.9005 against
0.9010 at 12.45%; the quarter-point false alarm stays at 0.050. A couple gaining 2 points or more uses 26% of the
paths.

**Kind.** A design for a registration's Paths field. It changes no code default and is used first in item 6C.

1. **Exact, not simulated.** Extend `size-phase4.mjs`'s exact rates to the two-stage rule (the first stage's count
   and the second's are independent given the chances of a path saved and a path lost). The simulation is the check on
   it, not the evidence.
2. **Its test:** the exact two-stage rates equal the one-stage rates when the first stage's threshold is set where it
   never stops; and `twostage.py`'s figures are reproduced to three decimals. **The plant:** the stopping rule applied
   to a loss as well as a gain. The 1-point rate falls, and the test fails.
3. **The registration's text**, for the Paths field: "Two stages. After 5,000 paths a unit whose observed change
   against APP is +0.5 points or more stops and is read as not harmed. Every other unit runs to N paths and is read by
   D34's rule at N. Both rates are the exact two-stage rates of `size-phase4.mjs`, printed in the sizing file."
4. The design review reads it before the first registration that uses it.

**If the exact rates differ from the simulation by more than 0.002:** STOP and report both. **Time box:** half a day.

---

## What is asked of the maintainer

| | The question | What I would do |
|---|---|---|
| M1 | D4's remaining units in more cloud sessions (item 1)? | Yes, four of them, after the reviewer's four checks. It saves about six days, frees the main session's cores, costs nothing for the machines and changes no number. |
| M2 | Item 3 moves every household's figure. Merge during the beta, or at its end? | At its end, before on by default, which is what B9 and the go or no-go list already say. It needs no new ruling. Sooner only if a beta user's decision is resting on a figure it moves by points. |
| M3 | Is an amount typed as a one-off pension deposit what the household pays, or what arrives? | Ask in the input's label. Until then leave typed deposits as they are and fix only the plan's own routing (item 4). |
| M4 | Couples outside the 40 to 60 band keep the app's rules until item 6C reads? | Yes. |
| M5 | The shortlist on, after item 7's stage A? | By your ruling naming the run, if it passes its rule. |
| M6 | The dated rules: carry them by tax year, or state the assumption? | State it now (one line on the page); carry the 2027 savings rates when the 2027/28 figures are next updated. |

## The prompt for the agent

The maintainer sends it. The lines under "The maintainer's answers" are the maintainer's own words, and each can be
struck:
- **The first** is M1. Struck, step 2 is skipped and D4 stays in the session it is in.
- **The second** is M4. Struck, there is no guard, and a couple who hold their money unevenly gets the solver as soon
  as D4's read turns it on.
- **The third** lets the agent add the new tests' names to the fast tier's joining list in one edit, so each joins
  when its file exists. The pre-tool hook honours an unlock only while it is the maintainer's latest message, so the
  agent makes that edit first. The later protected edits (a pinned figure in a FAST test, `fair-variables.mjs`, the
  seed registry) are asked for when they are due, each naming its file and its change.
- **To have item 3 on `main` sooner (M2)**, replace step 5's second sentence with: "It merges to main during the beta
  when its tests pass, on B1's gate, with the line to the beta's users."

```
Read research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md and REVIEW.md on review/external-2026-10-21 at its head.
Fetch that branch first: held-out.mjs reads it, and it now adds S021, S085, S091 and S261 to touched().

The maintainer's answers:
- D4's remaining units run in four more cloud sessions as item 1 sets out, the batch split between them by D4_SHARD
  and nothing else changed, each session's finished chunks backed up to its own branch as D63 has it, the read as
  registered.
- When D4's read turns the couples' solver on, a couple whose first person holds less than 0.40 or more than 0.60 of
  the pots keeps the app's rules until item 6's registered test reads.
- Unlock enforcement for exactly: couple-rank.test.mjs, engine-hmrc.test.mjs, windfall-relief.test.mjs,
  couple-share.test.mjs and chooser-shortlist.test.mjs added to FAST_JOINING in research/tests/run-all.mjs.

1. Make the FAST_JOINING edit first. Then record the document as the next D-line in STATE.md, with my answers, and
   item 3 as an open defect that changes a figure. Put M3 and M6 in DECISIONS-PENDING.md.
2. Item 1: the reviewer's four checks and the one commit on its branch. Send me the review file. Then the first
   worker: start it yourself if you can, or send me its prompt to paste. When its branch has moved three times, the
   other three. Stop this session's own D4 batch at its window's end.
3. Item 2: the port and its test. Three hours.
4. Launch item 6's stage A at low priority (EXPLORATORY, seed 7002), its decision rule committed first. It decides
   nothing. Send me its read as a report.
5. Item 3: the test shown failing from the review's copy, then the engine, the model and the tests, then its sizing.
   It does not merge to main before the beta's two weeks end. Ask me for the unlock when a FAST test's pinned figure
   has to move, naming the test, the old figure, the new figure and the working.
6. Items 4 and 5 in the same engine round: item 4 before the windfall factorial runs; item 5's part 1, then its
   option and its experiment.
7. Item 7's stage A on the tables after item 3 (EXPLORATORY, seed 7002). Send me the read. No default changes
   without my ruling naming the run.
8. After D4's read: item 6's stages B and C, with item 8's features in its panel and item 9's rule in its paths.
   Stage C's registration comes to me before its run. Item 8's caption can go in any time.

Nothing here touches D4 except item 1: not its worktree, its registration, seed 7021, its results or d4-backup. Do
not read or estimate a D4 result before its registered read.

Stop at each STOP the document names and at the launch plan's section 5 stops. Each item has a time box: when one
runs out, stop and report.
```
