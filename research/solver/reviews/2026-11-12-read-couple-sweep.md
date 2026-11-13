# Review at a read: the couples' sweep check (COUPLE-SWEEP.md; D88, D89; EXPLORATORY, seed 7002)

12 Nov 2026. The subject: the read of the couples' sweep check, which by D88 and D89 decided that the registered
couples' re-run (`registrations/couples-d4b.md`) is launched. Every claim of the read checked against the rule, the
code and the raw unit files.

Verdict: PASS

No finding is BLOCKING. Nothing here means the registered run should be stopped unread.

## What I read

At head 4e4174b1 (git blobs):

- `research/solver/COUPLE-SWEEP.md` a64d4373d7; `ISA-SWEEP.md` 1223836a02 (the rule it takes).
- `audit-couple-sweep.mjs` b1cbd9fdac; `batch-couple-sweep.sh` 71e4c57929; `reduce-couple-sweep.mjs` 7beeda15bc;
  `reduce-isasweep.mjs` cf1146ad3a (`rule`, `pairOf`); `stats.mjs` 7cf309da01 (`survivalChangeU`); `audit-item12.mjs`
  75b303d35d (`planOf`, `choiceProblems`); `audit-phase4.mjs` 5ace83959b (`runPath`); `audit-speed.mjs` d277f333d6
  (`settingsOf`).
- `src/solverApp.js` 9b354ce6f9 (`solveForApp`), `src/solver/solve.js` 9372e3c5ac (`menuMove`, lines 2892 to 2918),
  `src/solver/couple.js` f66038d648 (`sweepOf`, `solveCouple`), `research/engine.mjs` (the sweep, line 2658 on).
- The write-up: `results-couple-sweep.txt` ebeb41b9a0, `reports/2026-11-12-couple-sweep.md` 8a237ed8fd, STATE.md
  5d39ab96d2 (D87, D88, D89, sections 5 and 6), `DECISIONS-PENDING.md` cafc5b08e4.
- The raw units, `/home/user/scratch-sweep/research/solver/results/couple-sweep-7002/`: the twelve logs whole and the
  twelve arrays files (sha256, first 16: S017 4398147eaa0877c6, S029 7e5eac35915d1304, S035 d0b73f26d488cc6d, S053
  ab14cbd2b2f18ce7, S059 1c648c6b8077c96d, S079 d9f858fc99477dd6, S091 8fce9f5e0d6dd1cf, S173 44d8f8cf457105f1, S175
  6add99808cc2a4c5, S235 78822a3926c22e38, S391 ed9f454b371d847d, S415 5041ab3c7c3bd4ef). The launch log
  (`csweep-launch.log`).
- Of the couples' re-run: the registration's blob id, `audit-couples.mjs` (how CANDC is solved, its stamp files, its
  weights), the panel file's ids, `built`, `code` and `from`, and the code stamp on four lines of
  `results-couples-panel-d4b.txt` (the landing, seed 7005; registered inputs). Nothing under
  `/home/user/d4b-launch/research/solver/results/` or `/home/user/d4b-backup-wt` was opened or listed; neither backup
  branch was fetched, listed or opened; no result of D4 or of seed 7021 was read, printed or estimated.

What I ran (all light; no solve): `reduce-couple-sweep.mjs` on the raw folder and its `--planted`;
`audit-couple-sweep.mjs --choice`; `code-id.mjs`; and my own scripts in the session's scratchpad, `review-sweep/`
(`recompute.mjs`, importing nothing from the repository; `choice.mjs`; `cash.mjs`). I did not re-solve any couple (the
cores are the registered run's), so the tables behind the units are not reproduced here: what the units ran is taken
from their own records and from the code.

## The six questions

**1. The rule before the launch, unchanged since; one code and audit; the panel's code.** Yes.
`COUPLE-SWEEP.md`, the audit, the batch and the reducer were first committed in c3b4a9a5 (09:55:43 UTC) and have no
later commit; `ISA-SWEEP.md` and `reduce-isasweep.mjs` last changed 10 Nov, `stats.mjs` 18 Oct. The launch log:
snapshot "from c3b4a9a5", smoke passed, "12 to run, 4 at a time, from 12 Nov 10:02 UK", done 12:18 UK; the results
folder was made at 10:02:17 UTC and the unit files are dated 10:40 to 12:18 UTC. `git diff c3b4a9a5 HEAD` over the
rule's files, the audit's stamp files, `src/` and `research/engine.mjs` is empty; the scratch worktree is clean but for
the launcher's line in `runs.log`. All twelve logs' first line: `stamp: code 1d5d2421c9ab audit 771a9eb6c328
prediction none sha -`, and each arrays file's stamp the same; the reducer, run on today's files, accepts the audit
hash (its gate refuses a unit whose audit is not these files'). The panel: `couples-panel-d4b.json` `code`
1d5d2421c9ab, built 12 Nov 07:34:57 UTC; the last commit touching `src/` is 21b58645 (07:27:39 UTC), before it, and
`code-id.mjs` on the main checkout prints 1d5d2421c9ab now.

**2. The gate.** Fair, with one qualification (finding 3). Each unit: seed 7002, 4,000 paths, 45 points; both arms
solved in one process from one plan object and run on one array of paths, generated once; GIA's two tables record
`gia (no move)` and ISA's `isa (every move)`; the recorded settings lines are the same string in both arms on every
couple (`coarse on and on`, `flat true fast true`, `share 0.5`, the thirteen settings `settingsOf` prints); the engine
swept nothing to the ISA on any GIA arm's first 500 paths and a positive sum on every ISA arm; `runPath` the same as
`E.runTrial` on each arm's first 200 paths. By the code the arms differ in one key: `solveForApp` spreads `research`
over `APP_CANDIDATE` (solverApp.js line 53), and `sweepCashIsaTo` is read in two places only, `menuMove` (solve.js
2895 to 2897) and the meta (2918). The ISA arm is the registered run's CANDC call (`audit-couples.mjs` line 170: the
same `solveCouple` over `solveForApp` with `ageWith`), at the estate weight 0.02. On six couples the ISA arm also
swept money to the taxable account (S175 £169,821 a path beside £195,115 to the ISA); the two sum to the GIA arm's
sweep within £600 on each of the six, and by the engine's line 2661 only cash ISA money above the buffer goes to the ISA, so that is the
couple's other cash, not a leak.

**3. The three parts, recomputed from the arrays.** They match. My script (its own decoding, counts, variance and
interval): pooled d `+0.329` (`+0.262` to `+0.397`, se `0.0345`); every couple's survival, d, saved and lost, mean
pot, tax and spending as the results file prints them; the mean pot left, ISA less GIA averaged over the couples,
`+£6,463`; the six with a lower mean pot S175, S235, S415, S173, S079, S391; S415 `-4.02%`. The reducer run on the raw
folder gives `results-couple-sweep.txt` byte for byte, and its ten planted checks pass. Each couple's interval, by
Newcombe's method with the correlation corrected as his paper has it, is up to `0.011` points wider than the
reducer's (finding 4); the lowest upper end is `+0.077` (S029) against a bar of `-0.5`. PASSES is the right reading of
the rule as written: part 1's lower end `+0.262` is above `-0.2`; no couple's interval is wholly below `-0.5`; part 3
is a point estimate at or above nought and it is `+£6,463`.

**4. Is the write-up honest about what the pass rests on?** On the pot, yes, in all four places: D89 ("the pot's part
resting on one couple, S059: six of the twelve leave a smaller mean pot under the sweep to the ISA, the largest S415
`-4.02%`"), the report ("Part 3, the pot, holds on one couple"), `DECISIONS-PENDING.md` and the results file's own
list. What it rests on, from my recomputation: without S059 the other eleven average `-£16,018`, and part 3 would
fail; leaving out any other one couple it holds. Two things are said less plainly than the pot (finding 1), and one
bound on the claim is not said (finding 2). Nothing about survival, tax or spending is false.

**5. The choice of the twelve.** Follows the rule. My own enumeration: 210 couples in the library, 81 touched
(`touchedAll`), 40 of those the panel's bases, 41 touched and outside it; by cash ISA money at the start, ties in the
library's order, the first twelve are S059, S035, S175, S235, S415, S053, S173, S079, S091, S391, S017, S029, the
audit's list in the audit's order; the next at £45,000 (S101, S137, S209, S221) are left out by the library's order as
the document says. None is a panel id or base (both panel files). `--choice` prints the same and exits 0.

**6. Anything that should have stopped the launch.** No. The rule passes as written on a fair gate; the outcomes
section sends a pass to the launch; the code has not moved (the registration's blob 3b9d5fc8c9 is the same at e6f0179a
and at 4e4174b1; nothing under `src/`, the engine, the library or any of `audit-couples.mjs`'s twenty stamp files
differs between them; the code id is the panel's). The findings below bear on what the maintainer is told and on what
the registered read may claim, not on whether the run is sound.

## Findings

1. MINOR. The size of the survival gain and of the tax cut is S059's too, and only the pot is said to rest on it. D89
   gives pooled survival `+0.329` beside "the pot's part resting on one couple"; the report says "Lifetime tax is
   lower pooled". From the arrays: S059's d of `+3.325` is 84% of the pooled figure; without it the eleven give
   `+0.057` (`+0.006` to `+0.107`), so part 1 still holds by a wide margin, but the gain a couple can expect is a
   twentieth of a point or so, not a third. Tax: S059's £122,118 to £36,344 is 68% of the pooled fall; without it £47,059 to
   £43,439 (`-7.69%`, not `-19.63%`), and four couples pay more under the sweep to the ISA (S053 £7,166 to £11,240,
   S173, S091, S017). The lower pots are not noise: by path, paired, S415 is `-£115,239` (se £7,187), S173 `-£31,858`
   (se £2,922), S175 `-£36,036` (se £6,041), S235 `-£48,460` (se £10,125), S391 `-£7,409` (se £2,595); S415's median
   pot is lower too (`-3.68%`), where S175's and S235's medians are higher. The report to the maintainer should carry
   the without-S059 line for all three parts, as `ISA-SWEEP.md` printed its figures without S116. Evidence:
   `review-sweep/recompute.mjs`, its "no S059" line.

2. MINOR. "The sweep to the ISA stands for a couple" is measured at one estate weight and on couples under little
   strain; the registered run is neither. The check ran the candidate's default alone (every unit's log:
   `bequestWeight 0.02`); the registered CANDC runs at 0.02 and 0.01 (`audit-couples.mjs` line 74). The twelve are as
   the library enters them: ten survive `97.5%` or more under either arm (S035 `93.3%`) and only S059 (`81.7%`) is near
   where the panel is landed (arm A about `85%`). The document's design says both, so the rule was kept; the read's claim
   should carry them. It matters at the registered read: `DECISIONS-PENDING.md` already notes that most of the panel
   holds cash ISA money and that the read has no split by it, so nothing in the registered run can show what the sweep
   does to a landed couple, and this check does not either. No claim about the sweep on the panel's couples should be
   made from the two together.

3. MINOR. The gate's "both arms on the couple's plan" cannot fail, and "their settings the same but the sweep" is
   narrower than it reads. `inputs` is one variable hashed once before the first solve and written to the unit and to
   both arms (`audit-couple-sweep.mjs` lines 75, 100, 105), so `x.inputs !== U.inputs` compares it with itself; the
   same paths are held by nothing in the gate. Both hold by construction here (one plan object, one paths array;
   `prepareForSolve` builds new objects), which I checked by reading, not by a record. The settings compared are
   `settingsOf`'s thirteen with `coarse`, `flat`, `fast` and `share`; the candidate's `menuPlus`, `adaptiveLattice`,
   `readerSplit`, `bridgeRead`, `e3`, `pclsInterp`, `bridgeStep` and `switchMargin` are not in the string. Fair by the
   code (question 2), not by what each run recorded. If this audit is used again, hash the plan after each arm's solve
   and record the solve's whole options.

4. MINOR. `survivalChangeU` (stats.mjs line 119) takes the paired correlation without the correction Newcombe's
   method 10 applies to it (the numerator less half the paths where it is above that), which as I read the paper makes
   it his method 8; its comment names method 10, and `ISA-SWEEP.md` part 2 names both. The intervals are a little
   narrow where nearly every path survives: S017 `-0.118` to `+0.118` against `-0.128` to `+0.128`, S029's upper end
   `+0.077` against `+0.088`. No effect on this read (the bar is `-0.5`); it could matter to a read whose interval
   ends within a hundredth of a point of its bar. The function is older than this run and other rules name it, so it
   is for the maintainer's list, not a change to make here.

5. MINOR. No forward run in the solver's own model beside the engine. Each arm is held to `E.runTrial` on 200 paths,
   which is the engine against itself; the registered run has `runCouplePolicy` beside its solver arms, and this check
   has nothing of the kind, so a fidelity gap between a couple's rollout and the engine under the GIA arm would not
   show. The engine's own sweep was measured in both
   arms and is as each arm's tables say, which covers the fault this check was built around.

6. MINOR. The record of the launch differs from D88's words, and the run ran over its size. D88, `COUPLE-SWEEP.md`
   and `DECISIONS-PENDING.md` (line 129) say the re-run is launched "from a tree at the registration's commit"; D89
   says "a worktree at the commit that records this", and `git worktree list` shows `/home/user/d4b-launch` at
   4e4174b1, not e6f0179a. The purpose holds (question 6); the pending line should say what was done. The check's
   units sum to 29,787 seconds, 8.3 core-hours against "about 6" (the launcher's line shows a load of 3 to 4 at the
   start); the report does not say so.
