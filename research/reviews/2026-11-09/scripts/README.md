# The review's scripts (9 to 11 Nov)

All EXPLORATORY. None is a registered run, and none reads a D4 result.

**To run one.** From a checkout of `claude/project-access-i58m0x` at f02e8741 with the engine built
(`python3 research/build-engine.py`):

- a script that needs no patch: `REPO_ROOT=$PWD node <script> ...`;
- a script that needs a patch: make a copy of the tree, `git apply` the patch there, build the engine there, and point
  `REPO_ROOT` at the copy. A patch is off unless its switch is on, so the copy's "as it is" arm is the branch's.

`root.mjs` finds the repository: `REPO_ROOT`, or the first folder above the script that holds
`research/build-engine.py`.

The runs of 9 Nov used seed 4242; `short.mjs`, `check.mjs`, `couple-fast.mjs` and `couple-share.mjs` take `SEED=` and
default to it, so they reproduce `results/`. The runs of 10 Nov used 99001 and 99002. The solve's runs (the `solve-*`
scripts) used 99003.

## The checks every prototype passes first

| Script | Command | Output |
|---|---|---|
| `ident-off.mjs` | `node ident-off.mjs <the branch> <a copy with all three patches>` | `results/out-ident-off.txt`: 1,760 paths, 0 differing. `PLANT=1`: `out-ident-off-planted.txt`, 1,444 differing |
| `id-audit.mjs` | `node id-audit.mjs <the working branch> <a folder>` | every library id a folder names, against the held-out books. Run it on a review folder before committing it |

## Review 1: the engine against HMRC's order

| Script | What it does | Needs | Output |
|---|---|---|---|
| `../tests/engine-hmrc.test.mjs` | the engine's year against an independent reference: 22 checks | none; `PROTOTYPE=1` with `engine-hmrc.diff` | `out-engine-hmrc-branch.txt` (12 passed, 10 failed), `out-engine-hmrc-prototype.txt` (21 passed, 1 failed) |
| `tax-library.mjs [paths] [seed]` | the plan's own rules on every household of the two `touched` lists: the engine as it is, with pay in the stack, with HMRC's order too | `engine-hmrc.diff` | `out-tax-library.txt` |
| `engine-variants.mjs <household> [points] [paths] [seed]` | one household solved once, then the rules and the solved plan on each corrected engine | `engine-hmrc.diff` | `out-variants-S116.txt`, `-S092.txt`, `-S210.txt` |
| `taxsize.mjs` | pay in the stack alone, six working households and the example couple, 2,000 paths | `engine-hmrc.diff` | figures in `REVIEW.md` 1.1 |
| `tax1.mjs`, `work.mjs` | a year's tax by hand against the engine's, on S116's solved plan and on two workers | none | figures in `REVIEW.md` 1.1, 1.2 |
| `relief.mjs`, `dep.mjs` | what a pension deposit and `grossUpNet` add | none | figures in `REVIEW.md` 1.5 |
| `s116b.mjs`, `gap.mjs` | S116's solved plan year by year; the engine's tax against HMRC's order on it | none | the S116 table in `REVIEW.md` |
| `sweep.mjs`, `sweep2.mjs` | the cash sweep's part in a cash-heavy household's solved plan | none | figures in `REVIEW.md` 1.4 |

## Review 2: speed

| Script | What it does | Needs | Output |
|---|---|---|---|
| `short.mjs <household> <points> <replay paths> <paths> [variants]` | the shortlist against the whole menu: the replay and the paired paths | `shortlist.diff` | `out-45-*.txt`, `out-45c-S370.txt`, `out-light.txt` |
| `check.mjs <household> <points> <replay paths> [variants]` | the shortlist's check against the table's own value, replayed | `shortlist.diff` | `out-check-S370.txt` |
| `summ.py <outputs>` | the table of `REVIEW.md` 2.1 from `short.mjs`'s outputs | | |
| `prof-couple.mjs` | where a couple's path spends its time | none | `out-prof-couple.txt` |
| `couple-fast.mjs <couple> [points] [paths]` | a couple's path ranked by the shared scoring: identity and time. `PLANT=faststale` must fail; `SHORTLIST=0` leaves the shortlist out | `couple-rank.diff` (and `shortlist.diff` unless `SHORTLIST=0`) | `out-couple-fast-45.txt`, `out-couple-rank-identity.txt` |

## Review 2: the solve on anchors and shortlists (10 Nov; `REVIEW.md` 2.3, item 10)

All need `solve-coarse.diff` except `solve-coh.mjs`. A setting is one word, such as `w2a3b3g2c2-NT-LRVOH-h3`;
`solve-cfg.mjs` reads it and says what each part means.

| Script | What it does | Output |
|---|---|---|
| `solve-coh.mjs <household> <points>` | how often a cell's stored move is a neighbour's or its own next year's, by axis | `out-solve-coh-S116.txt` |
| `solve-anchors.mjs <household> <points> <paths> <setting>[,...]` | the solve as it is, then each setting: the time, the tables against the whole menu's, and both plans on the same paths. `BREAK=1` adds the score lost by wealth point and year; `TIME_ONLY=1` times the solves and nothing else | `out-solve-45a-*.txt` to `45d`, `out-solve-final-*.txt` |
| `solve-same.mjs <tree A> <tree B> <household> <points> <setting or off> [<setting for B>]` | two solves' tables, bit for bit. The port's check that the option off changes nothing (item 10, stage B, step 6) | printed |
| `solve-split.mjs <household> <points> <parts> <setting or off>[,...]` | one thread against the worker split: the tables bit for bit, and both times | `out-solve-split-S116.txt` |
| `solve-summ.py <setting> <outputs>` | the table of `REVIEW.md` 2.3 from `solve-anchors.mjs`'s outputs | |
| `../tests/solve-coarse.test.mjs` | the 12 checks of what must be exact, each plant failing | `out-solve-coarse-test.txt` |

`out-solve-size.txt` is `research/tests/solve-size.test.mjs` on the branch and on the patched tree.

How to read the `45` files. They are the search, in the order it ran, and each was made by the prototype as it stood
then:
- `45a` (S116, S370): the first settings, widened by level and tier only. Its `LRS` setting (every draw order) is
  no longer in the patch.
- `45b` and `45c`: every level, then one draw-order step and the other re-wraps. **Their times were taken with other
  jobs on the machine** and their "solve as it is" time is that loaded run's; read their tables and paths, not
  their times.
- `45d`: climbing, with the repeat-move rule. Its "solve as it is" time is `45a`'s, taken under the same load (one
  other job on the second core).
- `final`: the patch as committed, 4,000 paths. S116's and S370's "solve as it is" time is `45a`'s again; S224's
  and S188's are their own run's.
- A file that ends "stopped here by hand" was stopped before its remaining settings; the unfinished setting's
  half-printed lines were removed. Every other line of every file is as the script printed it.

## Review 2: a couple's joint move (11 Nov; `REVIEW.md` 2.4, items 11 and 12)

These run on a checkout of `claude/project-access-i58m0x` at 61e8778 or 01825f2 (not f02e8741), the engine built.
- Item 11 needs `couple-flat.diff` alone.
- Item 12 needs `couple-flat.diff`, then `shortlist.diff`, then `couple-approx.diff`, applied in that order. Every
  option of the last two is off unless an arm names it, and with all off the copy's flat path is checked against the
  path as it is inside each run.

Seed 4242 unless `SEED=` says otherwise; the test uses 7002. Every couple is in a `touched` list and none is in the
panel. `plan-of.mjs` names them: `S007` is the library plan; `S303@52:land` is S303 with each person retiring at 52
and its target set where the plan's own rules survive about 85% (a bisection on 500 paths of seed 990), the floor at
80% of it, which is how the panel's younger cohort is made from a library couple.

| Script | What it does | Output |
|---|---|---|
| `couple-prof.mjs <couple> [points] [paths]` | where a couple's path spends its time under the engine. `FLAT=0` on a patched copy profiles the path as it was | `out-couple-prof-before-*.txt`, `out-couple-prof-after-*.txt` (light settings) |
| `couple-same.mjs <couple> [points] [paths]` | how many of a decision's candidates leave a position another has already left | `out-couple-same-S007.txt`, `-S303.txt` (light settings) |
| `couple-flat.mjs <couple> [points] [paths]` | the flat path against the path as it is: every decision and path bit for bit, and both times. `CHECK=1` values every position both ways; `PLANT=` runs the plants; `ARM=SHIPC` solves at the product's settings | `out-couple-flat-45-S007.txt`, `-S303at52.txt`; `out-couple-flat-ship-30-*.txt` |
| `../tests/couple-flat.test.mjs [--full] [--plants]` | item 11's test: 5 checks on two couples in the exact model, each plant failing checks 1 and 2 | `out-couple-flat-test.txt` (9 passed), `out-couple-flat-test-plants.txt` (all plants exact), `out-couple-flat-test-full.txt` (19 passed at 45 points; run while its first timing threshold stood at 1.7, now 1.5) |
| `couple-approx.mjs <couple> [points] [paths]` | approximate arms stacked on the flat path, each against the flat path on the same paths. `ARMS=` names them; the header says how | `out-couple-approx-45-*.txt` (3,000 paths a couple; `-S127-checked.txt` is `order` with its check); at light settings, where a shortlist's outcomes mean nothing and only the times are read, `out-couple-approx-light-S127.txt` (every option tried) and `-S303at52.txt` (the joint options one by one with `order` on) |
| `couple-approx-summ.py <outputs>` | the pooled table of `REVIEW.md` 2.4 | `out-couple-approx-summ.txt` |
| `couples-budget.py <the sizing file> --candc L Y --shipc L Y [--solve F] [--shipc-paths N]` | the re-run's first stage from the agent's own pilot timings, with a path made faster by the factors given | `out-couples-budget.txt` |

**Times.** The 45-point runs ran two at a time on a two-core machine, each its own process. A path as it is slows more
under that load than the flat path does (it allocates far more), so the ratio depends on what else the machine is
doing: S007 ran 1.95 and 1.98 times faster with one other job on the machine, and S303@52 6.15 times with one other
job and 7.78 with two or three (`out-couple-flat-45-S303at52.txt`, taken while light test runs were also going).
Read the ratios as "about", and re-time on the machine that matters.

**One script changed after its runs.** `couple-flat.mjs` gained `ARM=` after the two 45-point outputs were
printed. Without `ARM=` it solves and runs exactly as it did.

**One file restored.** `out-couple-approx-45-S303.txt`: a second run opened the same file by mistake and emptied it
while the first was still writing. Its first four lines were restored from the session's log; its other four are
as the script wrote them.

## The answers of 10 Nov (`ANSWERS-2026-11-10.md`)

| Script | What it does | Output |
|---|---|---|
| `answers.mjs` | the plan inputs behind the answers: the named households' deposits and pay, a working single's taxed income beside pay under the app's rules, the library's Auto deposits, the touched singles by cash ISA money. No solve and no run | `out-answers.txt` |

## Review 3: D4's cost

| Script | What it does | Output |
|---|---|---|
| `twostage.py` | D34's two error rates under a two-stage rule, simulated | figures in `REVIEW.md`, Review 3 |
| `d4exp.mjs` | what D4's couples can show about a pension drawn beside a salary: plan inputs only, by place in the panel, no ids | 7 of 40 couples have such a year |
| `d4-shard-test.sh <the patched batch-couples.sh>` | the split of D4's units between sessions (`prototype/d4-shard.diff`), on the lines the patch adds: launches nothing. `PLANT=1` must fail | `out-d4-shard.txt` |
| `d4-same.mjs <arrays file A> <arrays file B>` | whether two sessions gave the same arrays for a unit, the seconds and the CPU's name set aside; prints two hashes and no value. For a preflight's files, not D4's | `out-d4-shard.txt` (on made-up files) |

## Review 4: gaps

| Script | What it does | Output |
|---|---|---|
| `couple-share.mjs <couple> <holding> [paths]` | the couples' rollout against the rules with the money re-held; `GUARD=1`, `SHARE=auto` or a number, `POINTS=45` | `out-share-S091.txt`, `out-share.txt`, `out-share-S007.txt`, `out-share-all-one.txt` |
| `asymrun.mjs`, `asym.mjs` | the first probe of the same, and what the library's couples hold | |
| `lib.mjs`, `cover.mjs` | what the library's 420 households contain | figures in `REVIEW.md` 4.2 |
| `cover-probe.mjs` | S116 with a DB pension, and with a gain already in the taxable account | figures in `REVIEW.md` 4.2 |
