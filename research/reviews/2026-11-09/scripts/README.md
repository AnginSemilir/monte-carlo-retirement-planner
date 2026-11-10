# The review's scripts (9 and 10 Nov)

All EXPLORATORY. None is a registered run, and none reads a D4 result.

**To run one.** From a checkout of `claude/project-access-i58m0x` at f02e8741 with the engine built
(`python3 research/build-engine.py`):

- a script that needs no patch: `REPO_ROOT=$PWD node <script> ...`;
- a script that needs a patch: make a copy of the tree, `git apply` the patch there, build the engine there, and point
  `REPO_ROOT` at the copy. A patch is off unless its switch is on, so the copy's "as it is" arm is the branch's.

`root.mjs` finds the repository: `REPO_ROOT`, or the first folder above the script that holds
`research/build-engine.py`.

The runs of 9 Nov used seed 4242; `short.mjs`, `check.mjs`, `couple-fast.mjs` and `couple-share.mjs` take `SEED=` and
default to it, so they reproduce `results/`. The runs of 10 Nov used 99001 and 99002.

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
