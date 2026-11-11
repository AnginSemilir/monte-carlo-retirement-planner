# The review of 9 Nov: the experiments, the ports and the order (instructions for the agent, 10 Nov)

## The decision this carries out

The maintainer, 10 Nov, on the review of 9 Nov (`REVIEW.md`, beside this file): "Add your findings to the repo and
include the experiment design then port instructions if it works. Be prescriptive." And, the same morning, asked for
the order to do them in and a prompt to start the agent with.

Nothing here is done until the maintainer sends the prompt in the last section. When it arrives, record it in STATE.md
as the next D-line, in this form:

> The review of 9 Nov (`research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md`): its nine items in its order, each by its
> experiment, decision rule and port; the maintainer's answers as sent. Item 3 is a defect that changes a figure.

**Item 10 came later the same day** (the solve on anchors and shortlists), on the maintainer's "Ok, now focus on a
faster solve. Aim for 5x faster." It is not in that prompt or that D-line. It has its own follow-up prompt, after the
first, and its own D-line when that is sent.

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
  `d4-backup`. No D4 result, the stopped run's or the re-run's, is read or estimated before the re-run's registered
  read, by the agent or by a worker.
- Times are measured on one core of the review's machine: a single's solve at 45 points 400 to 510 s, its path on the
  whole menu 47 to 56 ms; a couple's solve 530 to 770 s, its path 390 to 610 ms.

Patches, scripts and outputs: `prototype/`, `scripts/` (see `scripts/README.md`), `tests/`, `results/`. Each patch
applies to f02e8741 with `git apply`, and is off unless switched on. Items 11 and 12's patches are the exception:
they stand on item 2 as ported, and apply to 61e8778 and 01825f2. With every switch off, a copy carrying all three
gives the branch's numbers bit for bit (`results/out-ident-off.txt`: 1,760 paths, 0 differing; its planted run fails).

## The items in the order to do them

| # | Item | Kind | The agent's time | The machine's time | Moves a figure? |
|---|---|---|---|---|---|
| 1 | D4 stopped unread, and run once on the code that ships | the maintainer's ruling; a stop now, a registration later | an hour now, a day later | 160 to 400 core-hours, later | no |
| 2 | A couple's path 2.4 times faster, exactly | port with an identity test | 3 hours | minutes | no |
| 3 | The engine's year in HMRC's order | a defect: test first, port, sizing | 2.5 days | 4 core-hours | **yes, every household's** |
| 4 | Relief on money the plan pays into a pension | port with a test; before the windfall factorial | 4 hours | minutes | only with the windfall split |
| 5 | The sweep keeps cash ISA money in an ISA, and the pages show the sweep | port, then an experiment | 1 day | 5 core-hours | yes |
| 6 | Couples who hold their money unevenly | A an experiment, B a port, C a registered test | 1.5 days over the three | A 25 core-hours; C about 60 | couples only |
| 7 | The chooser's shortlist (a single's path 3 times faster, approximately) | an experiment, then a port | 1 day | 4 core-hours | by under 0.1 points if it passes |
| 8 | What the library never contains; the dated rules | units in item 6C's panel; one caption now | 2 hours | with 6C | no |
| 9 | A two-stage rule for the couples' registered runs | registration text and its sizing | half a day | none | no |
| 10 | The solve on anchors and shortlists (a solve about 7 times faster, approximately) | an experiment, then a port | 1.5 days | 11 core-hours, and gate 5 again | by under 0.1 points if it passes |
| 11 | A couple's joint move on flat arrays (a couple's path 2 to 6 times faster, exactly) | port with an identity test | 3 hours | minutes | no |
| 12 | Approximate cuts on a couple's path (a further 1.4 to 2.1 times) | an experiment, then a port; waits on item 7's ruling | 1 day | 13 core-hours | by under 0.1 points if it passes |

Why this order:
1. **Item 1's stop first** because it frees the main session's four cores at once, and every machine-time item below
   was waiting behind D4.
2. **Item 2 next** because it is exact, takes three hours, and makes every couples' run after it 2.4 times cheaper,
   item 6's and the re-run among them.
3. **Item 6's stage A is launched as soon as item 2 is in.** It runs on the machine while the agent ports item 3. Its
   fault is large (32 points on the one couple run at 45 points) and does not depend on the tax fix.
4. **Item 3 is the largest piece of work and the only defect.** Items 4 and 5 touch the same files and re-pin the same
   tables, so they go in the same engine round, in that order.
5. **Item 9, then item 1's registration,** once that round is in: the couples' run then tests the code that ships.
6. **Item 7's experiment waits for item 3**, so the shortlist is measured once, on the tables that will ship.
7. **Item 6's stage C waits for the re-run's read.** If that does not turn the couples' solver on, it has nothing to
   fix.
8. **Item 10's stage A runs in item 7's batch**, after item 3: the same eight households, the same paths and the
   same whole-menu arm, so that arm is solved and run once for both. Like item 7 it is approximate, so it is measured
   once, on the tables that ship. Until its ruling nothing takes it: no registered run, and not item 6's stage A.
9. **Item 11 as soon as it is sent** (added 11 Nov). It is exact, takes three hours, and must be in before the
   couples are landed again for the re-run, which it makes 2 to 6 times cheaper a path (`ANSWERS-2026-11-11.md`).
10. **Item 12 only after the maintainer has ruled on item 7's read,** and only if a width is ruled on. It measures
    that width, and three small options, on couples. No registered couples' arm takes any of it.

---

## Item 1. D4 stopped unread, and run once on the code that ships

**The question.** The maintainer, 10 Nov: is D4 still worth running at all? The review's advice is to stop it now,
unread, and run it once more after the engine fix.

**Why.**
- **It tests code that will not ship.** D4 is frozen at e09ac60, on the engine with item 3's defect. Couples cannot
  go live before that fix, and the fix re-solves every table. D4's read would be evidence about a predecessor.
- **A whole re-run costs less than finishing.** About 700 core-hours remain (745 at 56 of 520 units on 9 Nov). With
  item 2 in, a whole D4 is about 400 core-hours, and about 160 with item 9's two-stage rule. Both are the review's
  estimates from D4's own budget and its measured 2.4 times.
- **Stopping unread keeps the panel and the seed.** No result has been read, so the same 40 couples and seed 7021
  serve the re-run. The registry gives 7021 to `couples-d4*.md`, so a registration named `couples-d4b.md` owns it
  with no protected edit. `couples-orders.json`'s younger order holds 26 couples and D4 has 20 of them: a second
  held-out panel of young couples does not exist, and reading D4 on the old code would spend the only one.
- **Its read is not on the critical path.** A pass could not turn couples on before item 3 and item 6's guard exist.

**What is given up.** An early answer (the re-run reads about a week from now, and only if item 3 keeps to its time
box); the units finished so far; about a day of the agent's time to register again.

**The ruling asked (M1).** "D4 as registered stops now, unread. Its finished chunks stay on `d4-backup`, unread,
until the re-run reads. It runs once more on the same 40 couples and seed 7021, on the code after items 2 to 5."
Without it, D4 runs on as it is and this item is skipped; items 3's and 6's references to "the re-run" then mean D4.

### Part 1. The stop (now; one hour)

1. Stop the tracked D4 batch now. Nothing waits for a window's end: the units in flight will not be used.
2. One last push of the finished chunks to `d4-backup`, as D63 has it, and the backup stops. Nothing on that branch
   is read or printed, now or later. It stays until the re-run's read, then goes as D63 has it.
3. The worktree at e09ac60 and its results folder stay as they are. They are the fallback below.
4. Record in STATE.md, with the D-line: how many units had finished (the count only), and this statement, which the
   reviewer checks against `runs.log` and the receipts: no arrays file of D4 has been opened, and nothing of a
   unit's log has been read or printed by anyone beyond its stamp line, its second line and whether it holds a done
   line. **If that cannot be stated: STOP.** The re-run then needs a new seed and couples the scan does not list, and
   the maintainer rules on the panel.

### Part 2. The re-run's registration (after items 2 to 5 and item 9; one day)

`registrations/couples-d4b.md`. It is `couples-d4.md` in its question, its arms, its 40 couples, its seed, its primary
metric, its decision rule and its outcomes. It differs only in these, each stated in it:
1. **The code:** the working branch after items 2, 3 and 4, with item 5's default as the maintainer has ruled by
   then; each arm's configuration hash as that code gives it.
2. **The targets, landed again.** D4's couples were landed so arm A survives 85% within a point on the old engine.
   The fix moves a couple's survival under the rules by 0.2 points on average and up to 1.7 (the review's sizing on
   38 library couples as entered). So each of the 40 is
   landed again on the fixed engine, by `couple-panel.mjs` as before (seed 7005), before the seed is read. The couples
   and their order do not change.
3. **The paths:** item 9's two-stage rule, if its exact rates are in and design-reviewed. If not, 19,000 a unit in
   one stage, as D61 ruled.
4. **Where it runs:** its batch carries `D4_SHARD` (`prototype/d4-shard.diff`) from its launch commit, and the
   registration says the units may run in up to four cloud sessions, each backing its finished chunks up to its own
   branch, the read in one worktree. Registered so, more sessions are no departure. Part 3 is how.
5. **What became of D4:** stopped unread on the maintainer's ruling, with part 1's statement.

The design review reads it, and it comes to the maintainer before its run (the launch plan's stop). When it
launches, `couples-d4.md` is marked superseded.

### Part 3. The run, in one session or several

In one session it runs as D4 did. To use more, a "worker" is a new cloud session that does nothing but run one shard.
STOP at any step that does not hold.
1. **Two sessions agree, shown on a preflight** (the audit's own mode): one of the pilot's two couples, APP and CANDC
   at one estate weight, 200 paths of seed 7002, the same command in the main session and in the first worker. Then
   `node scripts/d4-same.mjs <the main session's arrays file> <the worker's>`, once for each arm. An arrays file holds
   the seconds taken and the CPU's name, so two runs never match byte for byte; the script sets those aside, compares
   the rest whole, and prints two hashes and no value. It must print "the same" for both. Both sessions also print
   `node --version`, which must be the same.
2. **The first worker, alone,** as shard 0 of n, by the worker prompt below. If the main session can start a cloud
   session itself (a scheduled task run once), it does; if not, it sends the maintainer the prompt to paste. A
   session with nothing but a tracked batch running may be paused as idle. So a worker pushes a heartbeat with every
   backup (the time, and the numbers of the units in flight), and the other workers start only when the first one's
   branch has moved three times, 30 minutes apart, with no one prompting it. If it stops moving: the run stays in
   the main session.
3. **Each worker:** a worktree on the launch commit's branch, the engine built; the finished chunks of every backup
   branch copied into its results folder, byte for byte and unread; `RESUME=1 D4_SHARD=<i>/<n>` before the registered
   command, as a tracked task, relaunched the same way at each 12-hour limit; every 30 minutes each finished chunk and
   the heartbeat pushed to its own orphan branch, by a loop inside the tracked task and not by a turn of the model;
   when the batch prints `0 to run`, one last push, a report, and nothing more.
4. **The gather and the read.** The main session copies every chunk on every backup branch into its worktree's
   results folder, byte for byte and unread; a unit found on two branches keeps one copy. The registered command
   under `RESUME=1` with `D4_SHARD` unset must print `0 to run`. Then the read, once, as registered.

```
You are worker <i> of <n> for the couples' registered run. Fetch review/external-2026-10-21 and
claude/project-access-i58m0x. Read item 1, part 3, of research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md on the
first, and research/solver/registrations/couples-d4b.md on the second. Do part 3's step 3 with D4_SHARD=<i>/<n>, and
step 1's preflight if you are worker 0. Do nothing else: no other work, no edit to any file, and no result of the run
read, printed or estimated. Report when your shard has nothing left to run, or at once if a step does not hold.
```

`prototype/d4-shard.diff` was checked on D4's launch commit without launching a unit (`results/out-d4-shard.txt`):
the code hash, the audit hash and the smoke stamp are the same with it and without; unset, the list of units is
unchanged; for n from 1 to 9 every unit is in exactly one shard; its plant fails `scripts/d4-shard-test.sh`.

**The fallback.** If item 3's tests have not passed two days after its time box: STOP. The maintainer chooses between
waiting and resuming D4 as registered, at e09ac60 under `RESUME=1`, its chunks intact on `d4-backup`.

**Size.** One stage, about 400 core-hours: four days on the main session's four cores, about a day on four more
sessions. Two stages, about 160: under two days, or about half a day.

**Report back:** part 1's count and statement; the registration; at the end, the count of units from each branch.

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

**If it passes.** `COUPLE.fast` on in code. D5's time budget for a couple is measured on it. Item 1's re-run and
every registered couples' run after it take it through their code hash.

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
3. **Couples** need no carry-over check: item 1 runs D4 again on this engine. If the maintainer struck item 1's
   ruling and D4 ran on, then after its read, on D4's two pilot couples (seed 7002), CANDC less APP at 4,000 paths on
   the engine before and after; a difference between the two differences of over 1.5 points on either is a STOP.

**If a step-3 test cannot be made to pass.** STOP with the failing row: the fixture, the year, the engine's tax, the
reference's, and each income. Either the engine or the reference is wrong, and that is found by hand on that one
year, not by adjusting either to match.

**Step 5. What the pages say.** One line where the beta's users will see it, in the maintainer's words. A draft:
"We corrected how income tax is worked out when you have a salary, savings interest or dividends in the same year as
a pension withdrawal. Most plans change by less than half a point. Plans with a large taxable account, or a salary,
change by up to four."

**Report back:** `results-engine-hmrc-before.txt` and `results-engine-hmrc.txt`; the pinned figures that moved; step
4's reads; the solve's time before and after.
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
   function shared with `bedAndSippFor`. *(Added 10 Nov, `ANSWERS-2026-11-10.md` 1: 210 of the library's 420 plans
   carry an Auto deposit, so this moves figures widely and is sized before it is committed; and no relief, and no
   room for a one-off deposit, once the owner is 75.)*
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
6. *(Corrected 10 Nov: as first written, "every figure as before on S116 and S210", this contradicted step 1.2,
   because S210's own Auto deposit is routed to its pension. The review's mistake; `ANSWERS-2026-11-10.md` 1.)*
   Nothing but the pension route moves, at light settings: S116 as before, bit for bit; S210 with its deposit
   removed, and again with it typed into the taxable account, as before, bit for bit; S210 as the library enters
   it, its 2033 route to the pound (£3,600 lands for £2,880; £168,120 goes on).
7. *(Added 10 Nov.)* Aged 76, no earnings, a £10,000 windfall: nothing to the pension, £10,000 goes on.

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
  money in a cash ISA (print them with their balances; S116 will be one). *(Corrected 10 Nov: S116 is not one. It
  is seventh by pounds; five tie above it. The agent's thirteen stand: the eight, four of the five by library
  order, and S116, with the pooled figures also printed without S116; `ANSWERS-2026-11-10.md` 4.)*
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
- **All three hold:** stage B now, and stage C after item 1's re-run reads.

**The guard, in either case (M4).** When the re-run's read turns the couples' solver on, a couple whose first person holds
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

### Stage C. The registered test (CONFIRMATORY; after item 1's re-run says the couples' solver ships)

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

## Item 9. A two-stage rule for the couples' registered runs

**Found** (`REVIEW.md`, Review 3; `scripts/twostage.py`, `results/out-twostage.txt`). D4's registration records a
second stage, more paths for a comparison past D34's limit, as not chosen (D61). This is a different one, for item
1's re-run and the runs after it. After 5,000 paths a unit stops, unflagged, when its observed change against the app's rules
is +0.5 points or more; otherwise it runs to its full paths and is read as now. Simulated at 400,000 runs a case: a
true 1-point loss is flagged 0.9647 of the time against 0.9648 with one stage at 9% discordance, and 0.9005 against
0.9010 at 12.45%; the quarter-point false alarm stays at 0.050. A couple gaining 2 points or more uses 26% of the
paths.

**Kind.** A design for a registration's Paths field. It changes no code default and is used first in item 1's re-run.

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

## Item 10. The solve on anchors and shortlists (a solve about 7 times faster, approximately)

**Added later on 10 Nov,** on the maintainer's "Ok, now focus on a faster solve. Aim for 5x faster." It is not in the
prompt already sent. Its own follow-up prompt is at the end of this file; when that arrives, record it as its own
D-line.

**Found** (`REVIEW.md` 2.3). The backward pass scores all 800 moves at every one of 14,580 cells a year. The prototype
(`prototype/solve-coarse.diff`, `opts.coarse`, off unless set) solves a year's cells in two passes:

- **The anchors take the whole menu, as now.** An anchor is a cell on every 2nd wealth point, every 3rd pension-share
  and ISA-share point and every 2nd gain and allowance bucket, with each axis's last point: 828 of 14,580 cells.
- **Every other cell scores a shortlist.** It starts from the moves the anchors around it stored this year and the
  move the cell itself stored next year. Then, for three rounds, each tier layer's best move so far is widened by one
  step (every spending level, one tier step, one draw-order step, the same draw order's other re-wraps) and the new
  moves are scored. About 38 moves a cell.
- **A listed move is scored exactly as the whole menu scores it.** Only the choice is narrowed.

At 45 points on one core, 4,000 paths a household (`results/out-solve-final-*.txt`; the table in `REVIEW.md` 2.3):

- **Time.** S116 341 s to 49 s, S224 369 to 53, S188 370 to 51: 6.9 to 7.2 times. S370, which has years before
  pension access, 486 to 146 (3.3 times): 76 of the 146 s is its bridge reference, which the shortlist does not touch.
  On a thinner reference lattice it is 84 s (5.8 times; 75 s in the 1,000-path run before). Those times had another
  job on the second core. With nothing else running, S116 is 337 s to 43 on one thread (7.9 times) and 212 s to 26
  split across two workers (8.2 times), the tables bit for bit the same (`results/out-solve-split-S116.txt`).
- **Outcomes.** 9 paths saved and 15 lost of 16,000: -0.04 points of survival (se 0.03), each household between
  -0.03 and -0.05. Spending delivered is within 0.02 points of target on every household, and the mean pot left
  within 0.2%.
- **Tables.** Their own score falls by 0.003 to 0.004 points on average. The worst single cell loses 2.3.
- **The thinner reference** left S370's 4,000 paths exactly as they were: the same 5 saved and 6 lost, the same
  spending and pot.
- **What must be exact, is.** With every move listed, the two-pass solve gives the whole menu's tables bit for bit.
  Split across two workers it equals one thread bit for bit. Each plant is caught
  (`tests/solve-coarse.test.mjs`, 12 checks).

**Kind.** An approximate cut under D65. An experiment, then the maintainer's ruling naming the run, then the port. The
thinner bridge reference is a second approximation with its own arms and its own ruling.

**The setting, in full.** `coarse: { w: 2, a: 3, b: 3, g: 2, c: 2, src: 'NT', expand: 'LRVOH', climb: 3 }`
(`solve-cfg.mjs` writes it `w2a3b3g2c2-NT-LRVOH-h3`). The thinner reference:
`adaptiveLattice: { na: 80, nb: 21, nz: 64, foot: true, stepAll: true }` (the candidate's is 160, 41, 128).

### Stage A. The experiment (EXPLORATORY, seed 7002; in item 7's batch, on the tables after item 3)

- **Households:** the review's eight (`audit-curve.mjs` `HOUSEHOLDS`) and S224, S362, S366 and S370. Twelve. A
  household "has a bridge year" where its solve builds the reference (`g.reader.adaptive` is set).
- **Arms, one solve each at 45 points:**
  - OFF: the candidate as it is. On the review's eight this is item 7's whole-menu arm: solve it and run it once.
  - ON: OFF with `coarse` at the setting.
  - REF: OFF with the thinner reference. Households with a bridge year only.
  - ON+REF: both. Households with a bridge year only.
  - If a width of item 7 has passed: ON's tables run with that width, on the review's eight. The two ship together
    only if this arm passes too.
- **Paths:** 16,000, the same for every arm, scored by the engine.
- **Times:** each unit records its solve's seconds and its reference's (`g.reader.adaptive.secs`). Then gate 5's own
  measurement (`batch-gate5.sh`, the machine running nothing else) with ON, and ON+REF, in the candidate's place.
- **First, the port's check against the review.** Before the batch, run
  `node research/reviews/2026-11-09/scripts/solve-anchors.mjs S116 45 1000 w2a3b3g2c2-NT-LRVOH-h3` on the tree with
  the patch. It must print 964,205 of 2,099,520 table entries differing and 3.60e-3 points lost on average
  (`results/out-solve-45d-S116.txt`, the same command; `out-solve-final-S116.txt` has the same two figures from the
  patch as committed). On tables after item 3 those two figures move, so run this check on f02e8741 with the patch.
- **Size:** about 11 core-hours, and gate 5's hour.

**The decision rule, committed before launch.** ON passes if all five hold, ON against OFF, paired:
1. pooled over the twelve, the survival difference's 95% interval has its lower end above -0.1 points;
2. no household's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05 points of target of OFF's;
4. the pooled mean pot left is within 0.5%;
5. the solve is at least 5 times as fast on one core on every household without a bridge year, by the units' own
   times and by gate 5's.

REF passes if 1 to 4 hold for REF against OFF and for ON+REF against OFF, on the households with a bridge year, and
ON+REF is at least 5 times as fast as OFF on each of them.

The pooled interval's half-width is about 0.02 points at 192,000 paths, at the discordance the review saw (0.5 to 3
paths in 1,000), so the rule can tell a loss of 0.1 from none. On three bridge households alone it is about 0.05.

**Outcomes.**
- **ON passes:** to the maintainer, for the ruling naming the run. Then stage B.
- **ON fails 1 to 4:** run `w2a2b2g2c2-NT-LRVOH-h3` (every 2nd share point an anchor, 1,472 anchors) once, by the
  same rule. If that fails too, report and stop.
- **ON passes 1 to 4 and fails 5:** report the times. Nothing is ported until the maintainer has seen them.
- **REF fails:** the reference stays as it is. Households with a bridge year then get ON alone, about 3 times
  faster, and the report says so.

### Stage B. The port (after the maintainer's ruling naming stage A's run)

1. **The code.** `git apply research/reviews/2026-11-09/prototype/solve-coarse.diff`, or its hunks by hand where
   `src/solver/solve.js` has moved since f02e8741. Keep its names. It is:
   - inside `solve()`: `copyPass(t, only)`; the `CTF` line after `splitCounts`; the cell loop wrapped in
     `for (let pass = 0; pass < NPASS; pass++)` with its two `if (CTF !== null ...)` lines; `coarseSync` after the
     loop;
   - at the file's end: `COARSE`, `coarseSetup`, `coarseAdd`, `coarseWiden`, `coarseMask`, `coarseCell`,
     `coarseSync`;
   - one line in `researchFinish` (`meta.coarse`).
2. **V8's limit.** With the hooks, `solve()` is 61,395 bytes of 61,440 (the branch: 60,516;
   `results/out-solve-size.txt`). `solve-size.test.mjs` must pass unchanged. If the working branch's `solve()` has
   grown, move other code out to a helper at the file's end first. Do not raise the limit, and do not put any of the
   shortlist's code inside `solve()`: that is what made the first prototype 2.7 times slower.
3. **The setting.** `coarse` is off in code. The setting is one constant in `src/solverSettings.js`
   (`APP_COARSE`), the object above. `solveForApp` hands it to the solve at the dial's first position only: a
   single's, and each person's of a couple. `meta.coarse` records it (the patch does this). `candidate.json` takes
   `coarse`, and the thinner lattice if REF passed, by the ruling; the candidate's hash changes, and the D-line
   records the old and the new. `fair-variables.mjs` takes the key `coarse` (a protected file: ask for the unlock,
   naming the key).
4. **A locked dial position keeps the whole menu.** Positions 3, 6 and 10 solve on `tsOnce: false`, the layer
   loop, where `coarseSetup` throws. `solveForApp` must not pass `coarse` to that solve. Its base solve takes it. So
   a user at a position above 1 saves less than half the wait, not six sevenths of it. Bringing the shortlist to the layer loop is
   its own item after this one: `lockMask`'s rule in `coarseCell`'s choice, and the every-move identity against the
   layer loop.
5. **The test.** `tests/solve-coarse.test.mjs` moves to `research/tests/solve-coarse.test.mjs`, its imports
   changed to the repository's own and its split run through `solveSplit`. Twelve checks, each plant failing
   (`results/out-solve-coarse-test.txt`):
   - every cell an anchor: the solve's tables bit for bit;
   - every move listed: the solve's tables bit for bit, on S116 and on S370. Plant `staleflow` parts them;
   - the repeat-move rule on and off: bit for bit. Plant `posonly` parts them;
   - split across two parts against one thread: bit for bit. Plant `nocopy` parts them;
   - `meta.coarse`, no cell without a list, the anchors' share;
   - refused on `tsOnce: false`.
   It takes about six minutes, so it joins the full tier, not FAST. Under `--full` add the known answer: S116 at 45
   points, 1,000 paths, survival within 0.5 points of the whole menu's.
6. **The option off changes nothing.** The fast suite's pinned hashes are the check. Beside them, once:
   `node scripts/solve-same.mjs <the tree before the port> <the tree after> S116 4 off`, and the same for S370. Each
   must print 0 table values differing.
7. **The fast suite; re-pin e3pcls** (D9): the solver's code hash changes.
8. **Stored solves.** A solve stored with the option must not be restored as one without, nor the reverse. Check
   that `coarse` is in what names a stored solve, and add that case to `cache-key.test.mjs`.
9. **Gate 5 again,** with the option on, reported beside the old block. Its "0 of N values differ split" is the
   four-part check of the split.

**Not in this item.**
- The locked dial positions (step 4 above).
- The product baseline's path (no tier state). Under the switch the app does not run it.
- A coarser wealth stride. Every 3rd wealth point took the three households without a bridge year from 49 to 53 s
  down to 44 to 47, but it raised the table score lost on S370 (0.0074 against 0.0040) and on S188 (0.0105 against
  0.0041). Every 4th lost 11 to 13 points of score at single cells. Neither is offered.

**Report back:** stage A's read whole, each household's two times, and gate 5's block. **Time box:** a day for
stage A, half a day for stage B.

---

## Item 11. A couple's joint move on flat arrays (a couple's path 2 to 6 times faster, exactly)

Added on 11 Nov, on the maintainer's "Prototype the couples path speed up first, again aim for 5x."

**Found** (`REVIEW.md` 2.4). With item 2 in, what is left of a couple's path is the rollout's own valuing of each
candidate (`expectedValue` in `src/solver/couple.js`), and in a year before pension access the search for the money
to move between the two (`shareBridge`), which does that valuing about 22 times a market node. Profiled at light
settings (`results/out-couple-prof-before-*.txt`): valuing is 44% of S007's path and 76% of a couple dressed as the
panel's younger cohort (62% in the bridge's search). On that couple most of it is bookkeeping: each person's state
rebuilt as an object (12% of the path), their vector built as an array and copied (16%), the couple's state copied
(6%), and each table read twice at one position. And of the 25 to 27 candidates a decision, only 19% to 40% leave a
position that was not already valued in that decision (`results/out-couple-same-*.txt`).

Done on flat arrays, with each position valued once a decision:

| At 45 points | Years | Years each person's table reads as before pension access | A path as it is | Flat | Faster |
|---|---|---|---|---|---|
| S007, retired | 28 | none | 158 ms | 80 ms | 2.0 times |
| S303, both working to 65 | 61 | none | 292 ms | 118 ms | 2.5 |
| S127 | 40 | 2 and 3 | 442 ms | 113 ms | 3.9 |
| S391 | 46 | 8 and 8 | 1,071 ms | 181 ms | 5.9 |
| S303 retiring at 52, its target landed (the younger cohort's kind) | 61 | 6 and 6 | 1,087 ms | 177 ms | 6.2 |

The path as it is ran the first 40 paths and the flat path 3,000, with one other job on a two-core machine
(`results/out-couple-approx-45-*.txt`, each file's first line). Under heavier load the path as it is slows more than
the flat path: the last couple ran 7.8 times faster then (`results/out-couple-flat-45-S303at52.txt`).

Every decision is the same and every path is the same, bit for bit:
- **On a copy carrying exactly the patch** (`results/out-couple-flat-45-S007.txt`, `-S303at52.txt`; 100 paths each):
  none of S007's 2,800 decisions and none of the last couple's 6,100 differs, nor any path. With every position
  valued both ways on 20 paths, none of 12,850 and 32,000 values differs, and none of 1,120 and 2,440 rankings.
  Each plant changes values and decisions; the bridge's plant is run on the couple with bridge years, where it
  changes 3,790 of 31,920 values and 307 of 1,220 decisions.
- **On the copy that also carries item 12's options, all off:** each of the five couples' first 40 paths is the
  same bit for bit, and none of 117,950 values and 9,440 rankings differs.
- **At the product's settings** (30 points, as the re-run's SHIPC arm solves): none of 2,800 and 6,100 decisions
  differs (`results/out-couple-flat-ship-30-*.txt`). The path is 1.9 and 1.6 times faster there.
- **The test, in the exact model:** 9 passed, and each plant fails exactly checks 1 and 2.

**Kind.** An exact port (D24's rule: one differing bit stops it). No experiment beyond its identity test, and no
figure moves, so it needs no ruling beyond the one that lets it in.

**Step 1. The port.** `prototype/couple-flat.diff` is the code that was measured. It applies to 61e8778 (and to
01825f2) with `git apply`, and touches two files.
1. `src/solver/grid.js`: `interpPair`, after `interp`. It reads two tables at one location, each sum taken in
   `interp`'s order, so each figure is `interp`'s bit for bit.
2. `src/solver/couple.js`:
   - the block headed THE FLAT PATH, before `expectedValue`;
   - `expectedValue` becomes the dispatcher. Its old body is `expectedValueSlow`, unchanged, and stays the reference;
   - in `chooseJoint`, one line empties the decision's list of positions already valued;
   - in `rankFor`, `topOf` picks a person's first K moves without sorting the other 798.
3. What the flat path stands on. Each line is a guard in the patch or a check in the test:
   - **The accounts.** Every account is one of the two people's four under the engine's own names (`pen_self` to
     `cash_part`), and each person's table reads its own four under the first person's names. Anything else keeps
     the path as it was (`flatOf` returns null).
   - **The position.** 18 numbers: the 8 pots, then for each person the taxable account's basis, the tax-free cash
     taken, the lump sum taken, the cash ISA part and the gains carried. Every `|| 0` of `ownerState` and `vecOf`
     is taken in the same place.
   - **The growth factors.** One table a couple, by year, account, tier held, world and node, filled as asked for.
   - **The reads.** One `readValues` gives survival and the cut ahead (it is `value()`'s own read of survival with
     the cut's table added). Resilience and the estate come from `interpPair`, and only where `value()` reads them
     by `interp`: a table with the reader or the bridge on and linear resilience. A coverage grid takes all four
     from the one read. Any other table keeps `value()` and `cutAhead`.
   - **The positions already valued.** The key is the 18 numbers, each account's tier, the year and each world's
     two layers, compared bit for bit. The list is emptied each decision and holds 64.
   - **The bridge's search.** `movedState`'s sums in its order, on the flat position. x = 0 is not valued a second
     time (the search asks for it again whenever a bound is 0).
   - **Stood aside.** Under any plant but its own three, under a reader probe, and for a table on the log-odds
     blend (both count every read), the path as it was runs.
4. `COUPLE.flat`, on by default once step 2 passes. `COUPLE.flatCheck` (tests only) values every position both ways
   and counts any that differ. `COUPLE_FLAT` holds the counts. The plants: `flatrate`, `flatmemo`, `flatmove`.
5. Re-pin e3pcls (D9), as for item 2: its fingerprint covers every file under `src/solver`.

**Step 2. Its test.** `tests/couple-flat.test.mjs` becomes `research/tests/couple-flat.test.mjs`, its imports made
the static ones of `couple-rank.test.mjs`. It sits where `couple-rank.test.mjs` sits. Quick, `--plants` and `--full`.
As run here: 9 passed, each plant fails exactly checks 1 and 2, and `--full` passed 19
(`results/out-couple-flat-test.txt`, `out-couple-flat-test-plants.txt`, `out-couple-flat-test-full.txt`).
1. **Every value the same.** S007 (no bridge year) and S127 (bridge years) at 6 points on the light lattice, 40
   paths of seed 7002 in the exact model, `COUPLE.flatCheck` on: no position differs in its value, its chance both
   last or its cut ahead.
2. **Every path the same.** Each year's joint move and its score, survival, pot left and tax, bit for bit with
   `COUPLE.flat` on and off.
3. **Not vacuous.** Positions valued, positions taken from one already valued, and S127's bridge years are counted,
   and none is nought.
4. **Every ranking the same.** `COUPLE.check` on with `COUPLE.flat` on: `topOf` against scoring every move again
   and sorting.
5. **The guard.** With `nocut` planted, and with an account that is not one of the two people's four, no position
   takes the flat path and each is valued as before.
6. **`--full`:** checks 1 to 4 at 45 points, 100 paths, on both couples, and each couple's path timed.
7. `couple-quick`, `couple-tables`, `couple-lockstep`, `couple-levers`, `couple-share`, `couple-rank` and
   `solver-couple` pass unchanged with the default on. I did not run these seven: run them before the commit.
8. The fast suite passes (CHECKLIST 4).

**Acceptance.** Checks 1 to 8, and at 45 points S007's path at least 1.5 times as fast and S127's at least 3. Here
they were 1.77 and 4.16 in the exact model with one other job running (`results/out-couple-flat-test-full.txt`:
19 passed; it was run while the test's first threshold still stood at 1.7).

**If it fails.** Any value that differs: STOP. Report `COUPLE_FLAT.first`: the year, the two moves, and the three
figures each way. Do not narrow the comparison to make it pass.

**If it passes.** `COUPLE.flat` on in code. D5's time budget for a couple is measured on it. The couples' re-run
takes it through its code hash, which means landing again, a new pilot and its design review, as the registration
already says of any change of code: do that once, after the rulings that are pending (`ANSWERS-2026-11-11.md`).

**Not in the patch, and exact too.** In a year the household draws nothing, the model reads no split
(`model.js` step reads `action.split` only where the net need is above nought), so one split's candidate stands for
all five. It is `nodraw` in `prototype/couple-approx.diff` (item 12): run alone, it leaves all 200 paths the same
bit for bit on each of the five couples. It saves a fifth of
the model's steps on a couple with working years and nothing on a retired one. Port it with item 11 or leave it: it
is worth 1% to 2% of a path.

**Report back:** the identity counts, the planted failures, the seven tests of check 7, the two timings.
**Time box:** three hours.

---

## Item 12. Approximate cuts on a couple's path (measured; an experiment before any is ported)

Added on 11 Nov, on the maintainer's "go further still, still keeping cuts within noise but not necessarily exact."

**Found** (`REVIEW.md` 2.4; `results/out-couple-approx-45-*.txt`, pooled by `scripts/couple-approx-summ.py` in
`results/out-couple-approx-summ.txt`). After item 11 a couple's path is mostly each person's own chooser, so the
cut that matters is item 7's shortlist in each person's ranking. Four smaller options act on the joint move itself.
Each arm ran against the flat path on the same 3,000 paths a couple, at 45 points:

| Pooled over five couples, 15,000 paths | Faster than the flat path | Faster than as it is | Paths saved, lost | Survival, points (se) | Spending delivered | Pot left |
|---|---|---|---|---|---|---|
| The joint options alone (`one`, `thin4x3`, `near`) | 1.00 to 1.18 times | 2.0 to 7.0 | 13, 12 | +0.01 (0.03) | -0.02% | -0.01% |
| `order` in each person's ranking | 1.42 to 1.76 | 3.5 to 8.8 | 33, 42 | -0.06 (0.06) | -0.07% | -0.25% |
| `order` and the joint options | 1.90 to 2.14 | 4.0 to 12.7 | 36, 50 | -0.09 (0.06) | -0.09% | -0.26% |
| `structure` | 1.18 to 2.67 | 5.3 to 7.4 | 37, 61 | -0.16 (0.07) | -0.03% | +0.87% |
| `cells` with its check at 0.5 points | 1.58 to 3.73 | 7.4 to 11.3 | 46, 56 | -0.07 (0.07) | -0.21% | +2.74% |

- The joint options alone are inside noise on every measure and worth 0% to 18%. With `order` on they are worth
  1.14 to 1.45 times.
- `order`, the one width that passed on singles, leans the wrong way on every measure here, and spending is past
  the rule's 0.05. The couple furthest down is S127: 5 saved, 12 lost. The shortlist's check against the table's own
  value does not change that (11 and 10 lost, 5 and 4 saved, at 0.5 and 0.2 points:
  `results/out-couple-approx-45-S127-checked.txt`).
- `structure` and `cells` fail plainly: S127 loses 31 and 24 paths and saves 3 and 4; S391's pot left moves by +5.9%
  and +9.7%. They are not in the experiment below.

**Kind.** Approximate cuts under D65. An experiment, then the maintainer's ruling naming the run, then the port.
Nothing here is ported on the review's 15,000 paths: they cannot tell a loss of 0.1 points from none.

**What each option is** (`prototype/couple-approx.diff`, on top of `couple-flat.diff` and `shortlist.diff`; all off
unless set, under `COUPLE_APPROX`):
- **The ranking's shortlist** (`SHORT`, item 7's patch): each person's two best moves are picked from the shortlist,
  not from all 800. `rankFor` takes whatever `chooseAction` scored, so nothing in `couple.js` changes.
- **`oneRead`:** resilience and the estate are taken from the read that already gives survival and the cut ahead,
  not from a second location. The same corners and weights summed in another order: a value moves in its last
  places.
- **`shareN`, `shareIters`** (`thin4x3`): the bridge's search for the money to move tries 5 points and at most 3
  golden-section steps, not 9 and 10.
- **`near`:** a pair holding a second-ranked move is tried only at the first pair's best split and the splits beside
  it, not at all five.
- **`nodraw`** is exact (item 11's last note) and is in this patch only because it was written second.
- **`screen`** was tried and dropped (`REVIEW.md` 2.4). It stays in the patch, off, so its light record can be run
  again.

### Stage A. The experiment (EXPLORATORY, seed 7002; after item 11 is in, and only if the maintainer rules a width of item 7 on)

- **Households:** eight touched couples, none in the panel, by `scripts/plan-of.mjs`'s names: S007, S127, S391, S303,
  S261, S209, and two dressed as the panel's younger cohort, `S303@52:land` and `S313@52:land`.
- **Arms, on one solve a couple at 45 points, all on the flat path:** the whole menu; the width the maintainer
  ruled on for singles (`order`, on item 7's read of 11 Nov); that width with `thin4x3`; that width with `thin4x3`,
  `oneRead` and `near`. `scripts/couple-approx.mjs` is the unit: `ARMS=order,order+thin4x3,order+one+thin4x3+near`.
- **Paths:** 16,000, the same for every arm.
- **First, the port's check against the review:** `scripts/couple-approx.mjs S303@52:land 45 3000` on a copy with the
  three patches must print the review's line for each arm it shares (`results/out-couple-approx-45-S303at52.txt`):
  the same paths saved and lost.
- **Size:** about 13 core-hours.

**The decision rule, committed before launch.** Item 7's four parts, read on the eight couples. An arm passes if:
1. pooled, the paired survival difference's 95% interval has its lower end above -0.1 points;
2. no couple's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05 points of target of the whole menu's;
4. the pooled mean pot left is within 0.5%.

At 128,000 paths the pooled half-width is about 0.04 points at the discordance seen here (5 to 6 paths in 1,000).

**Outcomes.**
- **The stack passes:** it goes to the maintainer. **Only the plain width passes:** that alone.
- **Neither passes:** couples keep the whole menu in each person's ranking. Item 11's exact cut stands by itself.

### Stage B. The port (after the maintainer's ruling naming stage A's run)

1. The shortlist reaches a couple through item 7's own option (`chooserShortlist`), passed to each person's table.
   It is used where item 7's stage B says: the paths that only count. The expected path and any path whose
   decisions the pages show keep the whole menu.
2. The joint options that passed become options of `solveCouple` (`jointSearch: { shareSearch: [4, 3], oneRead,
   near }`), off in code, recorded in the couple's `meta`; `fair-variables.mjs` takes the keys.
3. `research/tests/couple-approx.test.mjs`: every option off, every path bit for bit as item 11 left it; `thin` with
   the registered 8 and 10 is the path as it was; a plant for each option (the search's bounds halved; `near`
   keeping only the first pair's own split) moves the paths; a coarse known answer (S127 at 45 points, 1,000 paths,
   survival within 0.5 points of the whole menu's).
4. No registered couples' arm takes any of it (`ANSWERS-2026-11-11.md`, section 4).

**Report back:** stage A's read whole. **Time box:** half a day for stage A, half a day for stage B.

---

## What is asked of the maintainer

| | The question | What I would do |
|---|---|---|
| M1 | Stop D4 unread and run it once on the code that ships (item 1)? | Yes. It tests code that will not ship, a whole re-run costs less than finishing it, and stopping unread keeps the only held-out panel of young couples. What is given up: an answer this week. |
| M2 | Item 3 moves every household's figure. Merge during the beta, or at its end? | At its end, before on by default, which is what B9 and the go or no-go list already say. It needs no new ruling. Sooner only if a beta user's decision is resting on a figure it moves by points. |
| M3 | Is an amount typed as a one-off pension deposit what the household pays, or what arrives? | Ask in the input's label. Until then leave typed deposits as they are and fix only the plan's own routing (item 4). |
| M4 | Couples outside the 40 to 60 band keep the app's rules until item 6C reads? | Yes. |
| M5 | The shortlist on, after item 7's stage A? | By your ruling naming the run, if it passes its rule. |
| M6 | The dated rules: carry them by tax year, or state the assumption? | State it now (one line on the page); carry the 2027 savings rates when the 2027/28 figures are next updated. |
| M7 | Item 10's stage A now, on today's tables, or in item 7's batch after item 3? | In item 7's batch. Item 3 changes every table, so a run now is run again then: 11 core-hours twice. Now only if the beta's wait matters more this week than those hours. |
| M8 | The solve on anchors and shortlists on, and the thinner bridge reference, after item 10's stage A? | By your ruling naming the run, each if it passes its rule. They are two approximations and get two answers. |
| M9 | Item 11 in (exact; no figure moves)? | Yes. Three hours, and every couples' run after it is 2 to 6 times cheaper a path. |
| M10 | In the couples' re-run: S1 reported, not deciding, and SHIPC on the first 1,000 paths a unit (`ANSWERS-2026-11-11.md`)? | Yes. No couple has had SHIPC, and as a gate it can only take the candidate away. |
| M11 | The re-run launched only after items 5 and 10 are ruled and item 11 is in, on one session? | Yes. One landing, one pilot, one design review; about 60 core-hours, not 188. |
| M12 | Item 12's experiment on couples? | Only if you rule item 7's `order` on for singles and still want a faster couple's path. I would expect it to be marginal on spending. |

## The prompt for the agent

The maintainer sends it. The lines under "The maintainer's answers" are the maintainer's own words, and each can be
struck:
- **The first** is M1. Struck, D4 runs on as it is, step 1 loses its stop and step 6 its registration.
- **The second** is M4. Struck, there is no guard, and a couple who hold their money unevenly gets the solver as soon
  as the re-run's read turns it on.
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
- D4 as registered stops now, unread. Its finished chunks stay on d4-backup, unread, until the re-run reads. It runs
  once more as item 1 sets out, on the same 40 couples and seed 7021, on the code after items 2 to 5.
- When the re-run's read turns the couples' solver on, a couple whose first person holds less than 0.40 or more than
  0.60 of the pots keeps the app's rules until item 6's registered test reads.
- Unlock enforcement for exactly: couple-rank.test.mjs, engine-hmrc.test.mjs, windfall-relief.test.mjs,
  couple-share.test.mjs and chooser-shortlist.test.mjs added to FAST_JOINING in research/tests/run-all.mjs.

1. Make the FAST_JOINING edit first. Then item 1's part 1: stop D4, the last backup, the count and the statement.
   Record the document as the next D-line in STATE.md, with my answers, and item 3 as an open defect that changes a
   figure. Put M3 and M6 in DECISIONS-PENDING.md.
2. Item 2: the port and its test. Three hours.
3. Launch item 6's stage A (EXPLORATORY, seed 7002), its decision rule committed first. It decides nothing. Send me
   its read as a report. If it passes, stage B.
4. Item 3: the test shown failing from the review's copy, then the engine, the model and the tests, then its sizing.
   It does not merge to main before the beta's two weeks end. Ask me for the unlock when a FAST test's pinned figure
   has to move, naming the test, the old figure, the new figure and the working.
5. Items 4 and 5 in the same engine round: item 4 before the windfall factorial runs; item 5's part 1, then its
   option and its experiment. Send me the experiment's read.
6. Item 9, then item 1's part 2: the re-run's registration, its targets landed again. It comes to me before its run.
7. Item 7's stage A on the tables after item 3, when cores are free (EXPLORATORY, seed 7002). Send me the read. No
   default changes without my ruling naming the run.
8. After the re-run's read: item 6's stage C, with item 8's features in its panel. Its registration comes to me
   before its run. Item 8's caption can go in any time.

No result of D4, the stopped run's or the re-run's, is read, printed or estimated before the re-run's registered
read. d4-backup is not opened.

Stop at each STOP the document names and at the launch plan's section 5 stops. Each item has a time box: when one
runs out, stop and report.
```

## The follow-up prompt for item 10

The maintainer sends it when the faster solve is wanted. It adds to the first prompt and replaces none of it.
- **To have stage A now as well (M7)**, replace step 1's first sentence with: "Run item 10's stage A now, on the
  tables as they are, without item 7's arm, and again in item 7's batch after item 3."

```
Read item 10 of research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md and REVIEW.md 2.3 on
review/external-2026-10-21 at its head. Fetch that branch first. Record it as its own D-line.

1. Item 10's stage A runs in item 7's batch, on the tables after item 3 (EXPLORATORY, seed 7002), its decision rule
   committed first. Before the batch, apply the review's patch to a scratch tree at f02e8741, run the review's test
   there (12 checks, each plant failing) and reproduce the review's check on S116: the two figures item 10 names.
2. Send me stage A's read whole, with each household's two times and gate 5's block. It decides nothing by itself.
3. Stage B only after my ruling naming the run: the port by its nine steps. Until then the option is off in code
   and out of candidate.json. Its test joins the full tier, not FAST. Where a step needs a protected file
   (fair-variables.mjs, a test list), ask me for the unlock, naming the file and the change.
4. A locked dial position keeps the whole menu: the option is never passed to a locked solve.

No result of D4 is read, printed or estimated. Stop at each STOP the document names. Time box: a day for stage A,
half a day for stage B. When one runs out, stop and report.
```

---

## The follow-up prompt for item 11 and the couples' re-run

The maintainer sends it when ready. It adds to the earlier prompts and replaces none of them. It carries M9 to M11
as I would answer them: change a line you rule differently before sending.

```
Read item 11 of research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md, REVIEW.md 2.4 and ANSWERS-2026-11-11.md on
review/external-2026-10-21 at its head. Fetch that branch first. Record each ruling as its own D-line.

1. Item 11 now: the port by its steps, and its test. It is exact: any value that differs is a STOP. Before the
   commit, run the review's test on a scratch tree with the patch (9 checks; --plants: each plant fails checks 1
   and 2), then the seven couples' tests of its check 7 and the fast suite on the port. Report the identity counts,
   the planted failures and the two 45-point timings.
2. The couples' re-run stays held (D71) until I have ruled on items 5 and 10 and item 11 is in. Then, once: land
   the 40 couples again on that code, run the pilot again, and revise couples-d4b.md as ANSWERS-2026-11-11.md
   sections 3 and 4 say: S1 reported, not deciding; SHIPC on the first 1,000 paths a unit, its per-couple flags
   dropped; item 11 named in the code paragraph; one session. Send the revised registration to the design review.
   Do not launch until I say so.
3. Item 12 is not started. It waits for my ruling on item 7's read.
4. No registered couples' arm takes a shortlist or any option of item 12.

No result of D4 or of seed 7021 is read, printed or estimated, and d4-backup is not opened. Stop at each STOP the
documents name. Time box: three hours for item 11. When it runs out, stop and report.
```
