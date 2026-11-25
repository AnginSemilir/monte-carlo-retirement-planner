# The household route at uneven holdings, read once (25 Nov): PA2 EXPLAINS IT

EXPLORATORY (`COUPLES-UNEVEN.md`, its rule and machinery committed before any unit ran, 58e29bbd). This is the deep
review's one test after the registered read of every couple on the solver (`reviews/2026-11-25-deep-couples-any.md`,
section 3). It changes no default, no gate and nothing in the candidate.
- **The run.** Launched 25 Nov 07:46 UK through the launcher from the main tree at 58e29bbd (code d91a642206b9, audit
  1f70d72e8cf9; task b3k3jhf5b, its log `results/couples-uneven-launch-1.log`). Its runs were done 09:48 UK: 28 units, none
  exiting with an error, every unit's log ending in its done line.
- **The read.** Read once by `reduce-couples-uneven.mjs`. Its output is whole in `results-couples-uneven.txt`.
  - A first attempt from the main tree, after D148's commit (84f0aac7), was refused at the gate before any figure was
    printed. Three files the audit's stamp covers had moved with D148 (`src/couplesSwitch.js`, `src/solverCouple.js`,
    `src/solverSettings.js`), so the stamp read `c8f3b3416f5a` against the run's `1f70d72e8cf9`. And every household
    arm's configuration records the app's couples defaults (`APP_COUPLE`), whose `takeShapes` D148 widened. The arms'
    own named shapes are unchanged: each takes every shape the household plan takes.
  - It was then read from a worktree at 03d91f0a, the launch's record: code d91a642206b9, audit stamp 1f70d72e8cf9, and the
    five configurations the logs carry. The gate was fair.
- **The gate.** Fair: every unit, one stamp, each arm's configuration, every check recorded and the logs' stamps.
- **The checks.** Every unit passed all five:
  - ROUTE's table carries the registered run's digest and the pilot's.
  - APP and ROUTE match the pilot's arrays on the first 1,000 paths.
  - SPLIT built at the even split is ROUTE, bit for bit, on the first 200 paths; and SPLIT as run parts from ROUTE on every
    25/75 unit.
  - PA2's household plan is ROUTE's but for its allowance and its tax thresholds, each moved by the allowance's difference;
    FIX's is ROUTE's but for its incomes.
  - Every arm matches `E.runTrial` on its first 200 paths.
- **The reviewer at the read** (`reviews/2026-11-25-read-couples-uneven.md`): first look FAIL, one BLOCKING (the write-up
  left out M1's two names, which the rule sends to the maintainer with this read) and one MINOR (the D134 paragraph said
  more than the test can show), answered in one fix round; second look PASS (`-2.md`), three MINOR, each answered (where the
  survival cost falls, a count in `DECISIONS-PENDING.md`, and STATE.md's next actions carrying the hold before `main`).
- **The figures.** Every figure below is the read's own, from `results-couples-uneven.txt`, unless it is marked post hoc.
  Counts of its lines are marked as such. The post hoc figures come from `results-couples-uneven-beside.txt`
  (`couples-uneven-beside.mjs`, written after the read from the reviewer's leads, on the run's own arrays, deciding
  nothing).

## In plain words

On the registered read, the household route (ROUTE) paid more tax with the younger person holding 75% (Y75) than at the
library's own 60/40 ('own'), on every one of S041's 14 kinds. The deep review's leading cause was the household table taxing
an uneven couple as one person. Its table taxes the household at `k` times one person's allowance and bands (the form
'pensionsPA'). That is exact only when the two draw their pensions in proportion, and the route carries each move out at
the even split.

So the test asks which part makes the rise:
- **PA2**, the table's allowance at two people's (its bands still at `k`), with everything else ROUTE's; or
- **SPLIT**, ROUTE's own table with its moves carried out at the pensions' split.

## What it found, by the rule

**ROUTE's rise (D).** On each path, the Y75 unit's lifetime tax less the 'own' unit's, a year, is averaged over the 14
kinds. D is `+£437` (`+£435` to `+£440`) a year, so the premise holds.

| arm | its rise a year (95% by path) | at most half of D (`+£219`) | its upper end below D's point | |
|---|---|---|---|---|
| PA2 | `+£3` (`+£2` to `+£4`) | yes | yes | EXPLAINS IT |
| SPLIT | `+£440` (`+£437` to `+£442`) | no | no | does not |

**OUTCOME: PA2 EXPLAINS IT.** By the rule's outcomes, the cause is the household table's allowance at `k`, which cannot see
that each person's state pension and draws have their own allowance. That is D143's pricing gap, reaching the draws as
well as a partner's state pension. The even split is not the cause: SPLIT's rise is ROUTE's.

The rule's clause for every outcome (`COUPLES-UNEVEN.md`): "the registered read and its passes stand, and nothing of seed
7027 runs again; M1's two names go to the maintainer before any default changes, with this read beside them; R's, L's and
P's change of default is drafted beside it, since the rise is the household route's and not theirs." For PA2 EXPLAINS IT,
the rule sends the pricing to the household line's next build, EXPLORATORY, read first by D34 for survival.

## M1's two names, by this read

The registered read's M1 named S041-Rp1t-Y75 and S041-Ri1s-Y75 (more paths kept than the app's rules, less spent on the
paths both keep). The maintainer's word on them, D148, came before this read: it accepted both shortfalls on the agent's
recommendation, and R's, L's and P's change of default was built and committed (84f0aac7) beside the running test.
- **What the read prints of their two kinds** (counts of its lines): ROUTE's tax rise at 25/75 is `+£525` a year on Rp1t
  and `+£539` on Ri1s; PA2's is `-£11` and `-£20`.
- **So, by the read,** ROUTE's part of each name is the household table's allowance at `k`. That is D143's pricing gap,
  which D145 (2) left in the route when the pricing fix lost paths. The other part, by the deep review, is the app's rules
  doing better at 25/75 (arm A's pick moving to ISA First).
- **The read itself prints no M1 by arm.** Post hoc (`results-couples-uneven-beside.txt` A and B):
  - M1's own rule names the same two units under ROUTE (`519` and `472` paths kept net, spending on the paths both keep
    `-1.0706%` and `-0.4909%`), and under SPLIT, but none under PA2 or FIX. On the two units PA2 spends `+0.7616%` and
    `+1.4299%` more than APP on the paths both keep.
  - The price is survival elsewhere: PA2 less ROUTE is `-0.537` points (`-0.656` to `-0.419`) at 60/40 and `-0.507`
    (`-0.632` to `-0.382`) at 25/75, by path.
  - It is not paid on the two named units, where PA2 keeps more paths than ROUTE (the read's D34 lines: lost 3 and saved
    8 on Rp1t-Y75, lost 3 and saved 17 on Ri1s-Y75). It falls on the units with a wrapper two or three profiles apart,
    where D34 flags PA2. So the trade is between couples, not within the two named ones.
- **So the maintainer's word on M1 is a word on that gap.** Keeping the route as shipped keeps the gap and its two M1
  names; pricing it out (PA2) takes the names away and gives up about half a point of survival. This read goes to the
  maintainer beside D148 before anything goes to `main` (`DECISIONS-PENDING.md`).

## Beside, deciding nothing

**The rise, kind by kind.** ROUTE's rise is positive on all 14 kinds, from `+£161` (Rp3t) to `+£705` (Ri2s and Ri2t). PA2's
runs from `-£44` (Rp3t) to `+£118` (Ri3s). FIX's rise is `-£149` (`-£151` to `-£146`).
- **APP's own rise** is `-£352` (`-£358` to `-£346`) over the 14 kinds. Over the 8 kinds where arm A picks the same rule
  at both holdings it is `+£35` (`+£34` to `+£37`), the yardstick.

**Spending and the end pot,** each arm at 25/75 less 60/40 (spending on the paths it and APP keep at both holdings):

| arm | spending, points of target | the end pot a path |
|---|---|---|
| APP | `+0.50` | `+£87,085` |
| ROUTE | `-1.06` | `-£20,614` |
| PA2 | `-0.04` | `+£3,541` |
| SPLIT | `-1.06` | `-£21,490` |
| FIX | `-0.23` | `+£11,633` |

**Each arm against APP at 25/75,** over the 14 Y75 units:

| arm | survival, points | spending on the paths both keep |
|---|---|---|
| ROUTE | `+12.377` (`+11.460` to `+13.294`) | `+0.6271%` (`+0.5135` to `+0.7406`) |
| PA2 | `+11.870` (`+10.983` to `+12.757`) | `+2.3624%` (`+2.2406` to `+2.4841`) |
| SPLIT | `+12.379` (`+11.462` to `+13.295`) | `+0.6434%` (`+0.5301` to `+0.7566`) |
| FIX | `+11.625` (`+10.752` to `+12.498`) | `+2.5602%` (`+2.4379` to `+2.6825`) |

**D34 against ROUTE**, unit by unit (paths ROUTE keeps and the arm loses, less those it saves, against the threshold;
counts of the read's lines):
- **PA2 is flagged on 10 of the 28 units.** They are S041-Rp2s-own, Rp3s-own, Rp3s-Y75, Rp3t-own, Rp3t-Y75, Ri2s-Y75,
  Ri2t-Y75, Ri3s-Y75, Ri3t-own and Ri3t-Y75. On these ten it loses 696 paths ROUTE keeps and saves 132.
- **FIX is flagged on 13:** PA2's ten, and Rp2t-own, Ri3s-own and L-own.
- **SPLIT on none.**
- **Where PA2's flags fall.** Each of its ten units holds one wrapper two or three profiles apart, six of them at 25/75 and
  four at 60/40. So the two-allowance pricing loses paths against ROUTE where the two people's risks differ widely, at
  60/40 as well as at 25/75.

## What it shows and what it does not

- **It shows** that the rise in tax at 25/75 goes with the household table's allowance at `k`. Changing that allowance
  alone (PA2) takes the rise from `+£437` to `+£3` a year and the fall in spending from `-1.06` to `-0.04` points. Moving
  the split alone (SPLIT) changes neither.
- **It shows that the pricing is not free.** PA2 keeps fewer paths than ROUTE on 10 of the 28 units by D34. Against APP at
  25/75 its survival gain is `+11.870` against ROUTE's `+12.377`, and its spending gain is `+2.3624%` against `+0.6271%`.
  - This is the same pattern as the pricing fix's read (`results-pricing-fix.txt`, FIX DOES NOT HOLD), on other units.
- **It cannot speak to D134's stop** (a table reading a couple as safer than it is). No arm here reads a table against
  simulation, so the test can show neither that stop nor its absence.
- **Where the pricing arms lose paths** (post hoc, `results-couples-uneven-beside.txt` C; a lead, not a result):
  - Of the 932 paths PA2 loses against ROUTE, 931 fail in the plan's last year, 910 of them with no spending unmet, so they
    end below the minimum pot.
  - FIX's are the same: 1,495 of 1,509 in the last year, 1,445 with no spending unmet.
  - That is the late tail D134's test took apart. Whether it is a trade made on a right reading or on a misreading, nothing
    here measures.
- **It does not show why the two-allowance table loses paths,** nor whether some other pricing would remove the tax rise
  and keep ROUTE's survival. Nothing here tests one.
- **It reads one couple,** S041 (retired, 68 and 65), at two holdings, on the tuning seed.

## What follows

- **The pricing as the next build.** By the rule, the pricing is the household line's next build, EXPLORATORY, read first
  by D34 for survival. Both pricings tested so far lose paths against ROUTE by D34: FIX here and on the pricing fix's read
  (D145 (2): the pricing fix not taken), PA2 here. So whether to build another, and against what bar, goes to the
  maintainer with this read (`DECISIONS-PENDING.md`).
- **R, L and P's change of default (D148) is not stopped by the rule:** no outcome stops it, since the rise is the household
  route's and not those classes'. But the rule sends M1's two names to the maintainer with this read beside them before any
  default changes, and D148 took them before the read. So the maintainer's word, with this read beside it, comes before
  `main`. The reviewer on the change of default and B1's gate go on meanwhile.
