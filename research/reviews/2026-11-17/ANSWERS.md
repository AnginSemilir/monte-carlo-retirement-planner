# The external review's answers on one plan for the whole household, 17 Nov

The questions: `research/solver/QUESTIONS-2026-11-17.md` on `claude/project-access-i58m0x` (6bfbe905), with JOINT-WIDE's
read as it landed this morning (a7aed0f6: `results-joint-wide.txt`, `reports/2026-11-17-joint-wide-read.md`) and as the
handover carries it after its reviewer (c37505c: `results-joint-wide-beside.txt`). Each answer is a recommendation. The
ruling is the maintainer's own message.

Everything here is EXPLORATORY and decides nothing. I ran nothing on seed 7002, so the lead test's paths are unread. No
held-out seed was touched, `research/solver/archive/` was not edited, and no unit is the maintainer's household.

I was asked to look at the problem whole and not to take the path so far as right. So section 0 says what I think the
problem is, before the seven answers.

**What I ran to answer them** (`scripts/`, `units/`, the `results-*.txt` files; `README.md` says how to run them), on a
copy of the working branch at 6bfbe905, changing no file of it:

- **A pilot** (`results-pilot.txt`): twelve of the lead test's 28 units, each solved as the lead test's audit solves it,
  then run by the engine on 1,500 paths of seed 99003 under today's default (K2) and design A (HOUSE), each pair on the
  same paths. On four units also design A at other widths (its top one move, top six, nine splits). On every unit also
  the household table run on its own synthetic single plan (CEIL), which is what the table believes it can do.
- **The pilot, beside** (`results-pilot-extra.txt`, `results-above-cap.txt`): the same on three couples of shapes the
  library has none of (the partner eight years younger, on two units; the partner holding 90% of the pensions); design A
  with one defect of its plan put right; and the household's move taken from the single solver's own chooser.
- **Why the pot left differs** (`results-why-pot.txt`): on three units, each arm's spending level and the risk it holds,
  recorded at every decision.
- **Design A's plan under the app's own rules, taken apart** (`results-fidelity.txt`, `results-twin-trace.txt`,
  `results-bias-table.txt`, `results-coverage.txt`). No solve in any of these.

The pilot is not the lead test. It has other seeds, fewer units and paths, and no rule committed before it ran. Its
intervals are the paired difference's standard error, 1.96 of it either way. Read it as a lead.

## The answers in short

1. **The direction: yes, one plan for the household, and stop tuning the two tables.** On twelve of the lead test's
   units the household plan as built is `+1.72` points above today's default in survival, pooled (`+1.51` to `+1.94`),
   and `+0.97` without the one unit that carries half of it; no unit is lower beyond noise; its forecast is within
   `1.39` points of what happens where the two tables' is up to `51.87` off. JOINT-WIDE's widest move found `+0.454`
   (`+0.280` without that unit) at `x2.34` a path. The smaller fix mends one of three faults. Two things need settling
   first: what the plan does to the pot left (answer 2), and couples of shapes the library does not hold (answer 7).
2. **Design A as the lead test: run it, but not as written.** Its two named biases are fine for a lead test. Four things
   it leaves out are not: the rule has no word on the pot, which design A changes by as much as `-12.6%` where
   JOINT-WIDE was failed for `0.5%`; its move has no working tie rule above the estate cap and pays up to `x2.8` the tax
   there; its plan gives the household a capital gains band of £25,130 where two people have £75,400; and four of its
   eight "nearest exact" units carry a bias the handover does not list. Do not go straight to B.
3. **Design B's planned split: sound in kind, not yet, and not that form.** In the pilot design A loses at most `1.67`
   points against its own table, on a couple with eight locked years, and a third of a point or less on eleven of
   fifteen units: that is the most B could add in survival. If a later test shows a shape that needs more, carry the
   split as a coarse axis in the years it can matter (about 1.6 times a single's table), where it can still be held to
   the exact model. A planned path cannot be.
4. **The yearly decision: narrower, not wider.** The household table's one best move does as well as its top three, its
   top six, or nine splits. So does that one move at the even split with no search in the year, on the units tried, at a
   third to a half of today's path. Take the move from the single solver's own chooser and choose only the split. No
   asymmetric moves: the couple's exact year already runs one move on each person's own pots and bands.
5. **The fidelity bar is the wrong shape, and neither gap is one of the three leads.** S061-dbpart's `+11.3%` is the
   partner's DB pension taxed against the first person's spare allowance, a bias that lasts the plan. S227-90's `-13.6%`
   is the app's bracket-fill rule filling two bands. A twin couple (the first person twice) is an exact test of the
   merge; it found the capital gains band.
6. **The time model: its sizes about hold, its reason for the path does not.** The solve is `x0.50` of today's. Stepping
   joint moves is a fifth of today's path, so fewer of them saves little; the saving is one ranking for two and no look.
   The prototype's path is `x0.86` of today's because its value is the slow form, so the lead test will not show the
   saving. With the move from the single's chooser a couple's path is x0.29 to x0.44 of today's.
7. **Misread:** the `0.018` forecast is at a share the default does not use; the deep review's leading cause did not
   pass its own test; half of what the share moves is the minimum pot at the plan's end; the gain is smallest on the
   90/10 couples, the reverse of what was expected; and all 210 couples of the library, so every unit read so far, have
   one shape.

## 0. The problem, looked at whole

**A couple is one budget.** The two people spend from one pot of money for one set of bills. What belongs to a person
and cannot be pooled is short: their pension (its tax bands, its access age, its tax-free cash), their state pension and
other incomes, and their ISA allowance. Everything else is the household's.

**Today's method models the opposite.** It makes two budgets, each a fixed share of the spending and of the minimum pot,
each funded from one person's money, and joins them only in the year at hand. Three things follow, and they are separate
faults:

1. **The share.** It is a number the real household does not have. Five days of reads (13 to 17 Nov) tried to set it by
   a rule, by the solver's forecast and by simulation. The registered test read NEITHER.
2. **The product.** A year is valued by multiplying the two tables' chances. That is the chance that each person funds
   their own part for the rest of the plan with no help after this year. The household only needs the total to last.
3. **The clock and the floor.** Each table spends only from its own person's retirement and must end above its own share
   of the minimum pot. The household spends from the first retirement and has one minimum pot.

**The share reads were tuning a parameter of a model that is wrong in kind.** No setting of the share mends the product
or the clock. A wider move (JOINT-WIDE) mends none of the three: it gives the same judge more to choose from. That is
why it gained `+0.454` points pooled at `x2.34` a path and gave some of it back in spending and the pot.

**One table for the household removes all three at once.** That is the case for it, and it does not rest on any one of
the causes the reads proposed. It also brings its own questions, which the handover under-weights:

- **What it does to the pot left.** On most units it leaves less. On the three I measured it spends more and sooner on
  two, and holds less risk early on the third. JOINT-WIDE was failed for a far smaller fall. This needs a ruling before
  any run (section 2).
- **How exact the merged plan is.** Less than the handover says: I found one defect and two biases it does not list
  (sections 2 and 5).
- **What the panel can show.** Every couple in the library has one shape (section 7).

## The pilot, in one table

Twelve of the lead test's 28 units, seed 99003, 1,500 paths each, 45 points, the same paths for both arms
(`results-pilot.txt`; `scripts/pilot.mjs`, `scripts/pilot-read.mjs`). K2 is the couples' default as the lead test's
audit solves it. HOUSE is design A as that audit runs it. Spending is on the paths both arms keep. The capped pot is
JOINT-WIDE's measure: the mean over every path of the pot left, counted up to the estate cap. The forecasts are each
arm's own at the start, beside what that arm then does.

| unit | group | K2 | HOUSE | HOUSE less K2, points (95%) | spending | the capped pot | the household table's forecast, then HOUSE | the two tables' forecast, then K2 |
|---|---|---|---|---|---|---|---|---|
| S023-db | feature | 96.07% | 98.73% | `+2.67` (+1.79 to +3.54) | `-0.06%` | `-12.5%` | 98.8%, 98.7% | 71.7%, 96.1% |
| S061-dbpart | feature | 97.93% | 99.67% | `+1.73` (+1.07 to +2.39) | `+3.48%` | `-12.6%` | 99.8%, 99.7% | 95.4%, 97.9% |
| S147-db | feature | 89.27% | 99.27% | `+10.00` (+8.48 to +11.52) | `+4.26%` | `-5.2%` | 99.8%, 99.3% | 43.0%, 89.3% |
| S191-dbpart | feature | 97.13% | 98.13% | `+1.00` (+0.38 to +1.62) | `+0.97%` | `-8.4%` | 97.8%, 98.1% | 45.3%, 97.1% |
| S271-db | feature | 92.13% | 93.93% | `+1.80` (+0.97 to +2.63) | `+0.39%` | `-3.0%` | 95.3%, 93.9% | 82.5%, 92.1% |
| S149 | library | 97.60% | 97.87% | `+0.27` (-0.15 to +0.68) | `+1.12%` | `-1.5%` | 97.8%, 97.9% | 91.1%, 97.6% |
| S205 | library | 97.93% | 98.93% | `+1.00` (+0.43 to +1.57) | `+1.62%` | `-8.0%` | 98.8%, 98.9% | 90.0%, 97.9% |
| S327F | younger | 95.47% | 95.80% | `+0.33` (-0.14 to +0.80) | `+0.80%` | `-0.2%` | 95.0%, 95.8% | 85.0%, 95.5% |
| S337F | younger | 95.80% | 96.47% | `+0.67` (+0.05 to +1.28) | `+1.13%` | `-4.8%` | 95.4%, 96.5% | 80.5%, 95.8% |
| S023-90 | 90/10 | 97.60% | 98.53% | `+0.93` (+0.35 to +1.52) | `+0.37%` | `+0.9%` | 98.7%, 98.5% | 97.6%, 97.6% |
| S109-90 | 90/10 | 98.80% | 99.33% | `+0.53` (+0.05 to +1.02) | `+3.98%` | `+8.3%` | 99.6%, 99.3% | 80.4%, 98.8% |
| S227-90 | 90/10 | 96.13% | 95.87% | `-0.27` (-0.72 to +0.19) | `+0.21%` | `+0.7%` | 96.8%, 95.9% | 93.2%, 96.1% |

**Pooled, HOUSE less K2: `+1.72` points** (`+1.51` to `+1.94`), 353 paths saved and 43 lost of 18,000. By group: the
feature units `+3.44` (+3.00 to +3.88; 5), the library units `+0.63` (+0.28 to +0.98; 2), the younger units `+0.50`
(+0.11 to +0.89; 2), the 90/10 units `+0.40` (+0.10 to +0.70; 3).

**One unit carries about half of it.** S147-db's 150 net paths are 48% of the 310. Without it the pooled gain is `+0.97`
(`+0.78` to `+1.16`). JOINT-WIDE's top six moves, read the same way, are `+0.454` with S147-db and `+0.280` without
(`results-joint-wide-beside.txt`).

What it says, to the size a pilot can:

- **Survival is higher on 11 of the 12 units and beyond noise on 9.** No unit is lower beyond noise. The one unit below
  (S227-90, `-0.27`, `-0.72` to `+0.19`) is 4 paths saved and 8 lost.
- **By group, the feature units gain most and the 90/10 units least.** I do not show why. The gain follows the two
  tables' own forecast error only loosely (a rank correlation of `0.36` over the 12 units): S191-dbpart has the largest
  error, `45.3%` forecast where `97.1%` survive, and gains `+1.00`.
- **The household table's forecast is close to what happens:** within `0.49` points on average and `1.39` at worst. The
  two tables' product is `16.34` points off on average and `51.87` at worst.
- **The pot left is lower.** The capped pot is more than `0.5%` lower on 8 of the 12 units, by as much as `-12.6%`, and
  spending is higher on 11. Section 2 is about this.
- **Lifetime tax on the paths that end above the cap is far higher** on some units (S327F). Section 4.

## The pilot, beside: three shapes the library lacks, and two mends

`results-pilot-extra.txt`, `results-above-cap.txt`; `scripts/pilot-extra.mjs`. The same seed and paths.

**Three couples of shapes no couple in the library has** (section 7). Each is one of the panel's units changed in one
way, at the panel's own target, so the app's rules were not landed again on them:

| unit | what is changed | locked years | K2 | HOUSE | HOUSE less K2, points (95%) | the household table on its own plan (CEIL) |
|---|---|---|---|---|---|---|
| S147-db | the partner eight years younger | 8 | 74.33% | 98.07% | `+23.73` (+21.58 to +25.89) | 99.73% |
| S149 | the partner eight years younger | 8 | 94.20% | 96.33% | `+2.13` (+1.38 to +2.89) | 96.00% |
| S149 | the partner holding 90% of the pensions | 3 | 96.00% | 97.80% | `+1.80` (+1.05 to +2.55) | 97.93% |

- Today's default is worse on all three than on the unit it came from, and much worse on one: S147-db falls from
  `89.27%` to `74.33%` when the partner is eight years younger.
- Design A holds up on all three, where its own biases are at their largest: eight locked years, or nine tenths of the
  merged pension locked.
- **How far design A falls short of its own table** (CEIL less HOUSE) is the size of its biases in survival, and so the
  most that B or C could add. Over the 15 units with both it is `1.67` points on S147-db with eight locked years, `1.07`
  on S227-90, `0.53` on S147-db and S271-db, and a third of a point or less on the other eleven.
- Three units of my own making are a first look, not a result.

**Two mends, on the units they were tried on:**

- **The capital gains band put right (HOUSEC against HOUSE):** `+0.00` points (`+0.00` to `+0.00`), 0 saved and 0 lost
  of 7,500 paths on 5 units (S147-db, S147-db@gap8, S149@gap8, S149@penB90, S227-90). Lifetime tax `-0.6% to +0.3%`. It
  does not move survival here. It is still a defect in the plan (section 5).
- **The move taken from the single solver's own chooser, with its tie-break above the cap on.** At the even split (HT0
  against HOUSE): `+0.04` points (`-0.04` to `+0.13`), 3 saved and 1 lost of 4,500 paths on 3 units (S147-db, S227-90,
  S327F); spending `-0.17% to +0.02%`; lifetime tax `-55.2% to -14.7%`. With the best of five splits (HT5 against HT0):
  `-0.02` points (`-0.10` to `+0.05`), 1 saved and 2 lost of 4,500 paths on 3 units. Section 4.

## 1. The direction

**Yes: one plan for the household is the right next step, ahead of the smaller fix and ahead of stopping at JOINT-WIDE.
And stop tuning the two tables.**

**Against stopping at JOINT-WIDE.** Its read is clear and its rule closed it. The wider move gained `+0.236` and
`+0.454` points pooled and cost `x1.51` and `x2.34` a path. On the units the pilot shares with it, the household plan
gains more at less than today's cost:

| unit | group | the household plan: survival, points | spending | the capped pot | a path | the top six moves: survival, points | spending | the capped pot | a path |
|---|---|---|---|---|---|---|---|---|---|
| S023-db | feature | `+2.67` | `+0.23%` | `-12.5%` | `x0.85` | `+1.225` | `-0.33%` | `-0.4%` | `x2.11` |
| S061-dbpart | feature | `+1.73` | `+3.49%` | `-12.6%` | `x0.95` | `+0.450` | `-0.61%` | `-0.6%` | `x1.87` |
| S147-db | feature | `+10.00` | `+3.69%` | `-5.2%` | `x0.77` | `+5.150` | `+0.02%` | `+2.4%` | `x2.36` |
| S191-dbpart | feature | `+1.00` | `+1.11%` | `-8.4%` | `x0.85` | `+0.350` | `+0.06%` | `+1.3%` | `x2.70` |
| S271-db | feature | `+1.80` | `+0.70%` | `-3.0%` | `x0.79` | `+0.675` | `-0.07%` | `+0.3%` | `x3.10` |
| S149 | library | `+0.27` | `+1.08%` | `-1.5%` | `x0.82` | `+0.300` | `-0.50%` | `+2.5%` | `x2.22` |
| S205 | library | `+1.00` | `+1.63%` | `-8.0%` | `x0.88` | `+0.525` | `-0.38%` | `+0.5%` | `x2.56` |
| S327F | younger | `+0.33` | `+0.84%` | `-0.2%` | `x0.64` | `+0.175` | `-0.57%` | `+0.9%` | `x2.55` |
| S337F | younger | `+0.67` | `+1.22%` | `-4.8%` | `x0.66` | `+0.425` | `+0.18%` | `-1.3%` | `x3.47` |
| S023-90 | 90/10 | `+0.93` | `+0.35%` | `+0.9%` | `x1.02` | `+0.825` | `-0.06%` | `+1.5%` | `x2.03` |
| S109-90 | 90/10 | `+0.53` | `+3.88%` | `+8.3%` | `x1.09` | `+0.100` | `+0.15%` | `-1.9%` | `x2.46` |
| S227-90 | 90/10 | `-0.27` | `+0.22%` | `+0.7%` | `x0.92` | `+0.025` | `+0.20%` | `+0.0%` | `x2.31` |

The mean over these 12 units: the household plan +1.72 points, the top six moves +0.852; spending here is over every
path, as JOINT-WIDE's rule takes it (`results-pilot-beside-joint-wide.txt`).

Those are other seeds and fewer paths, so only the larger gaps mean anything. But the direction is not close.

**Against the smaller fix** (each person's table on the household's clock). It mends one of the three faults of section
0 and keeps the other two. The share is still there, and with it the question the registered test could not answer. The
product is still there: a pound still counts by whose pot it is in. And it adds a clock rule to each person's plan that
is its own approximation (which person's table carries the partner's take-home in the gap years?). It keeps two things
the household plan gives up: each person's own tiers and limits, and exact per-person tax in the tables. The pilot says
those are worth less than what the product costs. I would keep the two tables only as the way to solve a couple the
household plan refuses (the two people's pensions at different risks, the partner's own limits), until it is shown how
to take those.

**For the household plan, beyond the pilot's survival:**
- **Its forecast is the household's.** In the pilot it is within `0.49` points of what its own arm does on average and
  `1.39` at worst. The two tables' product is `16.34` points off on average and `51.87` at worst. That is what the page
  needs to show a couple their own figure, and what a safe spend read from the table needs.
- **It is cheaper** (section 6), and in the mended form of section 4 it removes the couples' own machinery from the
  path: the ranking of several moves, the tie rule, the look, the hold, the flat path.
- **Its approximations are in the plan's construction,** where an exact test exists (the twin, section 5), not in the
  value of every year.

**What it does not settle, and what I would want before any change of default:**
- the pot's ruling (section 2);
- the shapes the library lacks (section 7). The pilot's second table is a first look at three of them: design A is
  `+23.73`, `+2.13` and `+1.80` points above today's default there. They are three units of my own making.
- what it does for the couples it refuses today.

**What the literature points to.** Short, from prior knowledge of the papers and a brief search for each; I mark how
firmly each is held, as `LITERATURE.md` does. That file has nothing on couples.

- **The household is the unit, and its state is pooled wealth plus what cannot be pooled** (firm). The life-cycle models
  of couples solve one problem for the household: Love (2010, *Review of Financial Studies* 23); Hubener, Maurer and
  Mitchell (2016, *Review of Financial Studies* 29(4), 937 to 978); De Nardi, French, Jones and McGee ("Why Do Couples
  and Singles Save During Retirement?", NBER working paper 28828, 2021). Wealth is one number. What is carried per
  person is what the law or nature ties to a person: who is alive, each person's earnings and benefit entitlement, each
  person's claiming age. None carries each person's share of the wealth, because in their settings it changes nothing.
- **For the UK what cannot be pooled is short** (firm on the law, my reading of it on the model). A pension is its
  holder's for tax and for access. An ISA cannot change hands between living spouses, though either's can pay the
  household's bills. A taxable account and cash can be given to a spouse at no tax (the transfer is at no gain and no
  loss). So the exact household state is the single's state plus one number, how the pension is split between the two,
  and each person's tax-free cash used where they differ. That is design C with one axis. Design A is that state with
  the axis dropped; design B replaces it with a path.
- **The engine is stricter than the law on the taxable account.** It keeps each person's taxable account and cash with
  that person and has no transfer between spouses (nor the marriage allowance). So where design A assumes the two
  people's interest, dividends and gains can use both sets of allowances, it is biased against the engine and close to
  what a real couple can do. Whether the engine should let a couple even up their taxable holdings is a product
  question, not part of this one. It bears on how much of design A's "bias" is A's.
- **On drawing order under tax** (moderately firm): the work on tax-efficient withdrawal (DiLellio and Ostrov on
  tax-deferred against tax-free accounts; Cook, Meyer and Reichenstein, 2015, *Financial Analysts Journal*) finds the
  near-best rule is to fill the low bands with taxable income every year, that is, to even out the marginal rate over
  time. With two people taxed apart it evens out over people too. I found no paper that solves two separately taxed
  people's pensions by dynamic programming; the nearest setting is Canada's, where the law itself lets a couple split
  eligible pension income between them, which is design A's assumption made statute (firm that the rule exists).
- **The state the literature always carries for a couple, and neither the engine nor any of the three designs does, is
  who is alive.** After a first death the survivor has one allowance, one set of bands and one state pension, and the
  bills fall by less than half. `App.jsx` says so itself and leaves it to a later change of the year. A household table
  is the form that could take it later, as one more state the incomes and allowances depend on. Two per-person tables
  cannot. I raise it because it is likely worth more to a real couple than the pension's split, not because it belongs
  in this step.

## 2. Design A as the lead test

**Run design A, but not as written. Its two named biases are acceptable for a lead test. What I would change is what the
test leaves out: the pot, the tie rule above the cap, one defect in the plan, and what "nearest exact" means. I would
not go straight to B.**

**(a) The pot: the rule is silent on it, and it is the largest thing the household plan changes after survival.**

- JOINT-WIDE was failed this morning because the pot counted up to the estate cap fell by more than `0.5%` on five and
  seven units (`-5.020%` at most).
- By that same measure design A is lower by `-12.6% (S061-dbpart)`, `-12.5% (S023-db)`, `-8.4% (S191-dbpart)`, `-8.0%
  (S205)`, `-5.2% (S147-db)`, `-4.8% (S337F)`, `-3.0% (S271-db)`, `-1.5% (S149)` on the pilot's units, level on S327F,
  and higher on the three 90/10 units (`results-pilot.txt` part 2). The lead test's rule has no pot clause, so it would
  pass what JOINT-WIDE's rule failed.
- **Why it falls, as far as I measured.** JOINT-WIDE's reviewer was right that a cause needs a decomposition, so I ran
  one on three units (`results-why-pot.txt`: 300 paths each, both arms' spending level and the risk they hold recorded
  at every decision). The cause is not the same on each:
  - **S061-dbpart and S205: the same risk, more spending, and sooner.** The risk held is level (an expected return of
    `4.298%` a year against `4.260%`, and `4.286%` against `4.267%`). In the first third of the spending years today's
    default cuts at `84.3%` of S061-dbpart's decisions and takes an average level of `0.8509` of the target; the
    household plan cuts at `68.3%` and takes `0.9109`. Over the plan that is `+£27,644` of spending and a pot `£85,446`
    lower. Money spent in the first years would have grown for 25 to 35 more, so the two sizes are consistent, though I
    did not account for it pound by pound.
  - **S023-db: the same spending, less risk early.** Spending is level (`£4,107,737` and `£4,111,977`). The household
    plan holds `3.787%` of expected return in the first third against `4.329%`, and the pot is `£661,517` lower.
  - On the other nine units I measured nothing, so nothing is shown.
- **It comes with the two things the objective ranks first.** Spending is higher on 11 of the 12 units and survival on
  11. And the household table run on its own single plan (CEIL) leaves about the pot design A leaves on the couple:
  `-11.1%` against `-12.5%` on S023-db, `-1.9%` against `-3.0%` on S271-db, `-2.1%` against `-1.5%` on S149. So the pot
  is what that table does with that money, not something the couple's rollout adds.
- **So the bar must be ruled before the run, or the read will be argued after it.** My recommendation: record the pot
  and show it in pounds beside the spending and the survival it comes with; do not hold the household plan to today's
  default's pot. Today's default forecasts `43.0%` where `89.3%` survive on S147-db; a rule that makes its pot the bar
  asks a table that reads the household truly to behave as one that does not. If the maintainer wants couples to leave
  more, the lever is the estate aim, measured on singles and couples alike.
- **One thing the measurement shows that is not about the pot.** Both arms cut spending in most of the early years
  (today's default to `0.85` of the target on S061-dbpart, `0.89` on S205) and raise it to the cap of 110% late.
  "Spending delivered" near the target is the sum of the two. A couple may care which years the cuts fall in more than
  about the sum. The household plan's early cuts are the smaller on those two units and the larger on S023-db (`0.9081`
  against `0.9570`).

**(b) The tie rule above the cap.** Design A as built pays `£580,027` of tax where today's default pays `£205,439`, on
S327F's paths that end above the cap. Section 4 has the cause and the mend. As written, the lead test would record a
lifetime tax far above K2's on the younger units and start a second argument.

**(c) One defect in the plan: the capital gains band** (section 5). The household table is solved with a basic-rate band
for gains of £25,130 where two people have £75,400. Putting it right moves no path's survival on the units tried
(S147-db, S147-db@gap8, S149@gap8, S149@penB90, S227-90: `+0.00` points (`+0.00` to `+0.00`), 0 saved and 0 lost of
7,500 paths on 5 units), and lifetime tax by `-0.6% to +0.3%`. So it will not change the lead test's survival much. It
is still wrong, and it is one setting: under the app's rules it is 17% of a wealthy twin's capital gains tax (section
5). Mend it first: a known defect in an arm is a reason to doubt whatever the arm reads.

**(d) "Nearest exact" is not.** The amended rule lets eight units decide NO LEAD, chosen by two things: at most one
locked year, and the first person holding 25% to 75% of the pensions. `results-bias-table.txt` prints three more for
every unit:

- four of the eight leave out income tax on a guaranteed income for the whole plan (S061-dbpart, S023-db, S271-db,
  S191-dbpart: section 5);
- five of the eight have a one-off deposit owned by one person (S223, S023-db, S191-dbpart, S227-sppart, S271-db);
- all eight have the capital gains band.

Only S205 and S109-sppart are free of the first two. So a loss on a "nearest exact" unit can be a bias of A's, which is
the reading the rule was written to exclude. I would drop the clause and put in its place: every unit's loss beyond the
bar is reported against all of that unit's recorded biases; NO LEAD needs pooled survival not above 0, or a loss beyond
the bar on a unit whose recorded biases are all nil.

**(e) It changes the judge and the menu together.** A win or a loss cannot be put down to either. Add the arm of section
4 (the single's chooser and a split). If it reads level with HOUSE, as its nearest forms do in the pilot, the judge is
the whole of it.

**(f) Spending as the rule counts it rewards survival twice.** "Pooled spending delivered" takes every path, and a path
that fails delivers less. So an arm that keeps more paths shows more spending for that alone, and the rule lets spending
carry A LEAD when survival does not. Report it on the paths both arms keep, as part 2 of `results-pilot.txt` does; on
S147-db the two readings are `+4.26%` and `+3.69%`.

**(g) The forecast should be an outcome with a bar.** It is the second gain HOUSEHOLD.md names and the one the page
needs. In the pilot the household table's forecast is within `0.49` points of what its own arm does on average and
`1.39` at worst; the two tables' is `16.34` and `51.87`. A bar of two points on every unit would be a fair first one.

**(h) The time.** Read it as the prototype's (section 6).

**(i) The panel has one shape** (section 7). The lead test cannot mend that, but its read should say so, and step 4 of
"what next" should follow it.

**Why not straight to B.** A is built, its run costs two to three hours, and where it loses is what says whether B is
needed at all. B costs two to three days before its first figure, and puts an approximation where it cannot be tested
exactly (section 3).

## 3. Design B's planned split

**Sound in kind, but I would not build it yet, and if more exactness is needed I would build the coarse axis for the
years the split can matter, not the planned path.**

**What is right about it.**
- Carrying a slow state as a planned path is a standard cut, and the share is the right thing to carry. Returns move the
  two pensions together (design A already requires one risk a wrapper), so only the draws move the share.
- The household's year does not need the split as a move. Given what each person holds, who draws is a sum inside the
  year: fill the cheaper band first. That part of the handover's third option is right and worth keeping in any design.

**Three reservations.**

1. **What each person holds is still a state, whoever chooses the split.** "Equalise marginal rates each year" removes a
   decision from the menu. It does not tell the table when the smaller pension runs out, which is the only thing the
   split changes. So that option is a part of B or C, not a design without the state.
2. **The path fixes the one choice that is worth money.** Whether to draw the smaller pension first (use its allowance
   while it is there) or keep it is the choice the split's whole value turns on, about the `£2,500` a year the bias is
   worth. A table solved on a planned path takes the forward run's answer as given in every state. On paths that wander
   from the plan it is wrong in the direction the wander takes: the smaller pot empties early on poor paths.
3. **It moves the approximation into the table's year, where it can no longer be tested exactly.** Design A's table is a
   single's: its year is the fast year, held to `model.js` to the pound, on a plan whose construction can be tested
   exactly (the twin, section 5). A household year with a planned split can be held to the couple's exact year only at
   states that sit on the plan. Everywhere else it is an approximation by design. CHECKLIST 5 and 7 have no exact test
   for that. It is also circular: the path needs a forward run of a policy that needs the table, so two solves, or one
   on the coarse anchors first.

**The cheaper treatment I would take, if one is needed: the axis, only in the years the split matters.**
- The split can change the money in three kinds of year: one pension is locked; a person is short of their state pension
  with allowance unused; the household's taxable draw reaches the higher rate.
- For a household that stays in the basic rate, nothing after the younger person's state pension age depends on it. Nor
  does any year before the first retirement.
- So carry the smaller pension's share of the two on three points from the first retirement to the younger's state
  pension age, and drop it at both ends. On the panel that is 3 of 28 plan years on S023, 15 of 40 on S149, 19 of 61 on
  the younger couples and 21 of 46 on S377. With two more points in those years the table is 1.2 to 1.9 times a
  single's, 1.6 on average over the 28 units: about what today's two tables cost (section 6).
- In those years each person's pension is known, so the year can be held to the couple's exact year as a single's is.

**Whether anything beyond A is needed is a question the pilot can start to answer.**
- **On the panel's own shapes, no.** Design A is at or above today's default on every unit but one, which is inside
  noise, with up to three locked years and up to 90% of the pensions with one person.
- **On the three shapes that stretch its biases furthest, not yet.** With eight locked years, and with nine tenths of
  the merged pension locked for three, it is `+23.73`, `+2.13` and `+1.80` points above today's default (the pilot's
  second table).
- **The most that B or C could add in survival is what design A loses against its own table** (CEIL less HOUSE, the
  pilot's second table): `1.67` points at the worst, on the couple with eight locked years and a DB pension, and a third
  of a point or less on eleven of fifteen. That one couple is the case for an axis, and its size. It is one unit,
  changed by me.
- What B or C would add in tax and the pot I did not measure.

**Where B's household year would be hardest** is in section 6.

## 4. The decision step

**It is not too narrow. It is wider than it needs to be, and built from the wrong piece. Take the household's move whole
from the single solver's own chooser, then choose the split. I would not add asymmetric moves.**

**Width buys nothing** (`results-pilot.txt` part 1, four units, 6,000 paths):

- the top one move against the top three: `+0.05` points (`-0.01` to `+0.11`), 3 paths saved and none lost;
- the top six against the top three: `+0.00`, one path each way;
- nine splits against five: not one path differs;
- spending and the capped pot: the top six and the nine splits are within a hundredth of a point of design A's on every
  unit; the top one is within `0.16` points on spending and one point on the capped pot (S147-db), and its lifetime tax
  moves either way (S205 `-11.1%` against `-21.1%`, S147-db `+14.2%` against `+7.1%`).

**Why one move for both people is less narrow than it sounds.** The couple's exact year (`model.js`) runs the move's
draw order for each person on their own pots, their own bands and their own access, and each covers the other's
shortfall. So "pension up to the allowance, then the ISA" already has each person fill their own allowance, and a person
whose pension is locked or empty passes to their next pot. The move is one; what is drawn is not.

**What design A's menu cannot do** is give the two people different orders or different tiers. Today's default can. It
gains nothing from it against design A on any unit here.

**The split.** It can be chosen from five, and may not need choosing at all.
- Design A's top one move at the even split only (H0 against HOUSE): `+0.07` points (`-0.06` to `+0.20`), 3 saved and 1
  lost of 3,000 paths on 2 units (S147-db, S227-90); spending `-0.17% to +0.02%`.
- The single's chooser's move, the best of five splits against the even split (HT5 against HT0): `-0.02` points (`-0.10`
  to `+0.05`), 1 saved and 2 lost of 4,500 paths on 3 units (S147-db, S227-90, S327F).
- One of those units holds 90/10, where the split should matter most. The couple's exact year already has each person
  cover the other's shortfall, which is likely why the even split loses nothing here. Where a chosen split could still
  earn its place is tax, when one person's bands are fuller than the other's. Three units cannot settle it, so the lead
  test should carry both forms.

**What the wide move costs, beyond time: the tie rule above the estate cap.**
- A single's chooser has had a tie-break above the cap since D95: among near-equal moves, the one that pays the least
  tax. It works over the whole menu.
- The lead test's audit switches that off in every table it solves (`tieAboveCap: undefined`). That is right for two
  tables, whose joint move has its own rule. It is wrong for the household's one table.
- Design A then ranks the top three moves by score, where above the cap the scores are near-equal and the order is
  arbitrary, and picks among those 15 candidates by the least tax this year. That is the first couples' tie rule, the
  one TIE-C's read failed, and without the look that replaced it.
- **The result is item 13's waste, back again.** On S327F's paths that end above the cap under both arms (863 of 1,500),
  today's default pays `£205,439` of tax over the plan and design A `£580,027`. On its paths that end below the cap the
  two pay `£11,241` and `£13,674`. S149 and S271-db show the same in smaller size (`results-pilot.txt` part 2: lifetime
  tax `+28.0%` and `+16.5%` on the paths both keep). It moves neither survival nor spending. It is the heirs' money.

**The mend, tried** (`results-pilot-extra.txt`, `results-above-cap.txt`): the household's move taken whole from the
single's chooser, with the candidate's tie-break left on in the household table.
- **Survival and spending are design A's:** at the even split (HT0 against HOUSE) `+0.04` points (`-0.04` to `+0.13`), 3
  saved and 1 lost of 4,500 paths on 3 units (S147-db, S227-90, S327F); spending `-0.17% to +0.02%`; the capped pot
  `-0.1% to +1.0%`.
- **The tax above the cap comes down, on two units below today's default's.** On the paths that end above the cap
  (`results-above-cap.txt`): on S327F `£255,401`, where design A pays `£580,027` and today's default `£206,355`; on
  S227-90 `£56,887`, against `£256,571` and `£331,309`; on S147-db `£82,878`, against `£153,176` and `£129,940`. More is
  left there on all three. Over every path its lifetime tax is `-55.2% to -14.7%` against design A's.
- **It is the cheapest form:** a path costs x0.29 to x0.44 of today's default's (S147-db 46 ms against 135, S227-90 56
  ms against 126, S327F 69 ms against 238), and x0.42 to x0.60 with the best of five splits.

**So, for the mended form:** the household's move is `chooseAction` on the household table where the household stands,
as `bridge.js` asks it for a single, with the candidate's tie-break left on; then the best of five splits by the
household table's own value, or the even split if step 3 of "what next" shows no difference. Nothing of the couple's own
remains on the path: no ranking of several moves, no tie rule, no look, no hold. Each of those was built to mend
something the two tables did.

## 5. The fidelity check and the two wealth gaps

**The bar is the wrong shape: too loose to catch a fault in the plan's construction, and too tight for what the app's
rules do to a merged plan. Neither gap is one of the three leads in the handover.** `results-fidelity.txt`,
`results-twin-trace.txt`, `results-bias-table.txt`.

**What the two gaps are.** I ran the check's own comparison on seed 99002, with what the end wealth's gap is made of,
and with one group of allowances left single in turn.

- **S061-dbpart (`+10.4%` here, `+11.3%` in the test): the partner's DB pension taxed against the first person's spare
  allowance.**
  - The partner has a state pension of £6,800 and a DB pension of £15,000 from 68. That is £9,230 over their own
    allowance, taxed at 20%. The first person has a state pension of £8,200, so £4,370 of their allowance is spare.
  - The household plan adds the incomes and the allowances, so the DB pension uses the first person's spare allowance.
    It leaves out up to `£874` of tax a year, for the rest of the plan (`results-bias-table.txt`).
  - Under the app's rules that is what happens: the household plan pays `£23,637` less tax over the plan than the
    couple's `£48,921`. Survival is `+2.0` points on these paths.
  - Leaving the ISA allowance, the tax-free cash cap or the CGT and savings allowances single changes nothing (`+10.4%`
    each time). Leaving the income bands single turns the gap to `-29.9%`.
- **S227-90 (`-15.3%` here, `-13.6%` in the test): the app's own rule filling two tax bands.**
  - Arm A's policy on this unit is "Bracket Fill, lump sum". It draws pension up to the top of a band every year. Given
    doubled bands it fills two of them from the merged pension. In the couple the partner holds 10% of the pension and
    their band is soon empty.
  - So the household plan pays `£88,329` more tax over the plan than the couple's `£390,959`, early, and ends lower.
  - With the income bands left single the gap closes to `+3.2%`. The ISA, tax-free cash and CGT changes do nothing
    (`-15.9%`, `-14.2%`, `-15.7%`).
  - This says nothing about the merge as the solver uses it. It is a rule that reads the band as its target.
- **The three leads** (the doubled ISA allowance, the taxable account's starting basis, the lump sum on the merged
  pension) explain neither. The basis is blank on both people's accounts in these plans.
- **On seed 99002 S227-90 is past the bar** (`-15.3%` against 15%). It passed on seed 99001 by 1.4 points. A check that
  passes on one seed and fails on the next is not measuring the plan's construction.

**What the gaps point to.** Two things the handover does not list:

1. **Bias 1 is wider than stated.** The handover has it as wrong "where one person holds little of the pension, before
   the state pension fills the personal allowances". It is also wrong wherever one person's guaranteed income is over
   their allowance and the other's is under, and that lasts the plan. It is realised whenever the person with spare
   allowance has no taxable income of their own to fill it: under the app's rules here, in full. On the panel it is
   there on S061-dbpart (`£874` a year, `2.95%` of the plan's spending), S023-db (`£594`), S147-db and S271-db (`£554`),
   S377-dbpart (`£474`) and S191-dbpart (`£158`).
2. **A one-off deposit owned by one person** (the "Inheritance" on 16 of the 28 units) lands in one person's wrappers.
   The household plan has two ISA allowances and two sets of savings, dividend and gains allowances to shelter it with.

**A better check: the twin.** A couple made of the first person twice is the one couple the merge should state exactly.
Under the app's rules, with their even split, the household plan and the couple should hold the same money in every year
of every path. I built that for six units (`results-twin-trace.txt`, 100 paths each).

- **S205 and S061-dbpart: exact.** No wrapper parts by more than a pound, bar one path in its last year.
- **S327F, S227-90 and S023-db: they part, and first on capital gains tax.** Over the plan the household plan pays
  `£40,494` of it against the couple's `£38,079` on S327F, `£126,479` against `£108,498` on S227-90, and `£1,975`
  against `£1,607` on S023-db.
- **The cause is a defect in design A's plan.** The engine takes the basic-rate band for capital gains from its own
  default less the plan's allowance (`App.jsx` `taxParams`, `cgtBandWidth`: 50,270 less the allowance, on purpose, so a
  Scottish taxpayer gets the UK band). The household plan doubles the allowance, so its band is **£25,130**. Two people
  have **£75,400**. No entry in `DOUBLED` can reach it. Every household plan has it (`results-bias-table.txt`), and the
  household table is solved on it.
- **S149 parts on a second thing I did not trace:** dividend tax and the year's target in plan year 3, the year of its
  one-off cost, `£160` of `£34,649` of income tax over the plan.

The test's own bar hides all of this. A 17% error in a twin's capital gains tax moves median wealth by under 1%.

**What I would change.**

- **Add the twin identity to `household.test.mjs`:** each fidelity unit's twin under the app's rules, every wrapper
  within a pound in every year, on 100 paths. Its plants: the capital gains band as it is today; one allowance left
  single. It is exact, so it needs no bar.
- **Keep the six couples as they are, but compare lifetime tax as well as survival and wealth,** and state for each what
  the difference should be from the unit's recorded biases. S061-dbpart's `-£23,637` is then a pass: it is the bias, at
  the size predicted.
- **Run that comparison under a rule that does not read the bands** (a fixed order, no bracket fill), or expect the
  bracket-fill units to part and say so.
- **Fix the capital gains band before any solve of design A is read.** It needs the engine to take the band's width as a
  setting; the household plan then doubles it. `scripts/pilot-extra.mjs` does it by doubling the engine's default for
  the household's solve alone, which is good enough for research and not for the app.

## 6. The time model

**Its sizes about hold for design A. The reason it gives for the path is wrong, and the prototype as built will not show
the path's saving.** `results-pilot.txt` part 4, `results-pilot-extra.txt` part 4; every time is this machine's, four
units at a time, so rough.

**The solve holds.** The household table took `x0.50` of the two tables' time over the pilot's 12 units (from `x0.39` to
`x0.67`). In the browser the two people's tables are solved one after the other on the same parts
(`src/solverClient.js`), so one table in place of two shortens the wait there as it does in Node.

**The path: the premise is wrong.**
- The model says a path gets cheaper because about 15 joint moves are stepped in place of 20 to 40, with one table read
  each in place of two.
- Stepping joint moves is about a fifth of today's path. JOINT-WIDE's own times say so: `129.8` ms a path at 20 pairings
  a decision, `219.6` at 80 and `358.4` at 180. That is about 1.4 to 1.5 ms a pairing and about 100 ms that does not
  depend on the pairings at all.
- I did not profile that 100 ms. What is in it is each person's ranking (a single's chooser run on every move, twice a
  decision), the engine's own year, the look and the hold. The household plan saves there: one ranking, and no look if
  the move comes from the single's chooser.
- In the pilot the prototype's path outside its candidates is 33 to 64 ms. A single's own path on the same plan (CEIL)
  is 27 to 63 ms.

**The prototype will not show it.**
- Its value of a position is the slow form: at every node a state is copied and a rates object built. Today's default
  has the flat form of item 11, with its memo.
- So a candidate costs the prototype about 3.5 ms a path, where a pairing costs today's default about 1.4.
- The prototype's path is `x0.86` of today's (from `x0.64` to `x1.09`), not a half to a third. The lead test's fourth
  figure will read about that. It is the prototype's time, not the design's.

**What the design's path should cost.**
- As built but with the flat form: 15 candidates at today's cost a pairing or less is about 20 ms, on top of the fixed
  part: about half of today's path.
- With the move from the single's chooser and the best of five splits (HT5): x0.42 to x0.60 of today's default's path on
  the units tried (S147-db 67 ms against 135, S227-90 76 ms against 126, S327F 99 ms against 238).
- With that move at the even split and no search in the year (HT0): x0.29 to x0.44 (S147-db 46 ms against 135, S227-90
  56 ms against 126, S327F 69 ms against 238). That is a little over a single's own path.

**The wait in the browser** (an inference, as the agent's is). Today's was 157 s of solves and 301 s of paths. With the
solve at `x0.50` and the path at a half, that is about 229 s, `x0.50` of today's. With the path at `x0.36` it is about
187 s, `x0.41`. So the handover's "0.4 to 0.5" holds: its upper end for design A as built once its value is the flat
form, its lower end for the simpler move.

**B and C.** "1.5 to 2 times a single's year" for B is a guess I cannot check without the year being written. For an
axis in the years the split matters, section 3 has 1.2 to 1.9 times a single's table from the plans' own years.

**Where B's household year would be hardest. Not the inversion.**
- **The inversion is a merge.** `fast.js` already holds a person's net income for a gross one as straight segments
  (`netTable`) and inverts a net need segment by segment. For two people, the household's best net for a gross draw is
  the two lists merged in order of rate, each cut off at what that person holds. That is a walk over two short sorted
  lists. It fails in one place: where the allowance tapers away between £100,000 and £125,140 a person's rate rises and
  then falls, so cheapest first is not best there, and the year should keep a fixed order of people.
- **What is hard is the state the household does not have.**
  1. **Who holds the money outside the pensions.** Interest, dividends and gains are taxed on a person, and the ISA
     allowance is a person's. The household's state has one taxable pot and one ISA. The year must assume a holding
     (even, or by a share it carries), and the fast year's memo of the year's interest and dividends tax (`KNOCK`) is
     keyed for one person.
  2. **Each person's tax-free cash.** The quarter is of each person's own draw up to their own cap, and whether each has
     taken their lump. The merged state has one figure and one flag (`mergedState`: taken only where both have).
  3. **The ceilings in the draw steps and the re-wrap** (`penPA`, `penBasic`, the harvest's) are each person's, on each
     person's own income that year.
- **And holding it to `model.js`.** The couple's exact year draws by a split it is handed and each person's order, each
  covering the other's shortfall. A household fast year that splits inside the year has no exact twin there. So the test
  that holds a fast year to the exact one "to the pound" needs a new exact year written first. That is the larger part
  of the two to three days, and the part most likely to overrun.

## 7. What I think is misread

Seven things, the first three about the evidence in the handover's section 1, the rest about the expectation.

1. **The forecast of 0.018 is at a share the default does not use.** S129-90 holds 90/10, so the default solves it at
   0.9, where the forecast read `0.920` and `95.15%` survive (`results-share-choose.txt`). The `0.018` beside `79.13%`
   is the half share. The misreading is real at the default's own shares, and those are the examples to quote: S129-db
   `0.318` where `96.85%` survive, S211-db `0.805` where `89.22%` do, and in the pilot here S147-db `43.0%` where
   `89.3%` do and S023-db `71.7%` where `96.1%` do (`results-pilot.txt`, part 3). The figures in
   `results-share-choose.txt` are also scores and not chances (several are above 1); the pilot's are the product of the
   two tables' own chances.

2. **The deep review's leading cause did not pass its own test.** Its rule said the cause holds if giving the rule's
   move today's spending level recovers at least half of the lost paths. It recovered `0.1555`. Today's tiers recovered
   `0.4367` and the top six moves `0.4835` (`results-share-replay.txt`: MIXED). The handover gives the cause and the
   replay as two separate bullets and does not say the second failed to confirm the first. The rival the deep review
   named, a part that reads itself short and holds more risk, did as well as anything. The household plan is still the
   right answer to this, but because it removes the parts, and so every cause that lives in them, not because one cause
   was found.

3. **Half of what the share moves is the minimum pot, not money running out.** On the share ensemble 180 of S129-90's
   194 failures at the default are paths that end the plan below the minimum pot, 104 of S129-db's 126, 135 of S019-90's
   142. On the registered run 2,448 of 5,646 lost paths end that way, and in the replay 1,198 of 2,368. Eight of the
   lead test's 28 units set a minimum pot of four to eight and a half years of spending. "The money lasts" on those
   units mostly means "ends above the minimum pot", and the two tables cut that pot by the share. Section 1 does not
   mention it. In the pilot every one of S149's failures, under either arm, is at the minimum pot.

4. **"It can do anything a fixed share does" is not so, and the 1.5 to 2 points was never a floor.**
   - Design A cannot do what the two tables do: its two people take one move and one pair of tiers. It is another
     policy, not a wider one.
   - The `+1.978` is the best of two or three shares picked on the paths it is scored on. The `+1.55` picked on other
     paths is the honest figure.
   - The share's swings measure how sensitive a wrong model is to its parameter. They do not bound what a right model
     gains. In the pilot it gains more than the best share did where a share helped most (S147-db `+10.0`, against
     `+9.34` at the means' share on other paths and `+5.150` under the top six moves).

5. **The gain is not where the handover expects it.** It expected 1 to 3 points on "uneven and feature couples" and half
   a point on even ones. In the pilot the three 90/10 units, the most uneven on the panel, gain least (`+0.40` pooled)
   and the feature units, which hold 60/40, gain most (`+3.44`). I can offer a reading and not a finding: at a 90% share
   the first person's table is nearly the household's already, so there is less for one table to mend; what differs on
   the feature units is when and how large each person's incomes are. The pilot does not test that, and the gain does
   not track the two tables' forecast error closely (the pilot's table).

6. **"Every couple on both panels has one to three years in which one person has retired and the other has not" is how
   the library was built, not a fact about couples.** All 210 of its couples are three years apart, retire at one age,
   and have the first person holding more (`results-coverage.txt`). So are all 28 units. Nothing read so far, for
   today's default or for the household plan, says anything about a couple eight years apart, the same age, with the
   younger holding more, or with the two people's pensions at different risks (which design A refuses). The pilot's
   second table has a first look at three of those shapes.

7. **The time model's premise** (a path is cheaper because fewer joint moves are stepped) is wrong, though its size is
   about right. Section 6.

## What I would do next

In this order. Each step has its test and a box, as CHECKLIST 8 asks. Everything up to step 6 is EXPLORATORY and changes
no default.

1. **The maintainer rules on the pot** (no run). The question is in section 2: when the household plan raises survival
   and spending and leaves less, is that a harm? My recommendation: no. On the units I measured it is more spending
   sooner, or less risk held early, which is what the household's own table does once it reads the household truly. So
   the pot is recorded and shown in pounds beside the spending, and not held to today's default's. If you want couples
   to leave more, that is the estate aim, and it should be measured for singles and couples alike.
2. **Mend design A's plan and its move** (half a day).
   - The capital gains band: the engine takes its width as a setting, the household plan doubles it. Its test: the twin
     identity (section 5), with the band as it is today as the plant.
   - The year's move: the single solver's own chooser where the household stands, its tie-break above the cap left on,
     and a split (section 4). Its test: `household.test.mjs` check 4 as it stands, and above the cap the pick equal to a
     single's chooser's on the same table.
   - `biasesOf` records all five things `results-bias-table.txt` prints, not two.
   - Acceptance: the twin exact on the six fidelity units; the fast suite untouched (nothing in `src/solver` changes but
     the engine's one setting).
3. **Run the lead test, amended** (2 to 3 hours on four cores, seed 7002 as planned; the amendments dated before
   launch). The arms: K2; HOUSE as built, so the read joins the handover; the mended form at the even split and at the
   best of five. The rule's changes are in section 2. K2 must still equal JOINT-WIDE's byte for byte.
4. **A small panel of the shapes the library lacks** (a day to build and land, EXPLORATORY): the two the same age; the
   partner eight and twelve years younger; the younger holding more of the pots and of the pensions; one person with no
   pension at all; the two people's pensions at different risks, which design A refuses today, so decide first whether a
   blended risk or the two tables serves those. Today's default has never been run on any of these either.
5. **Decide on B or the axis from steps 3 and 4.** My expectation is that neither is needed for the shapes read so far.
   If a shape loses, build the axis for the years the split matters (section 3), not the planned path.
6. **A registered test on a held-out seed** of what holds, against today's default and against the app's rules, with the
   pot's ruling in its rule, its design to the reviewer first. Then the change of default, the reviewer on it, and the
   guard looked at again: a household table has no first person to weigh the estate by, so D99's limits on who is
   entered first may no longer be needed, but that needs its own units.
7. **Speed work on the household move, not on LOOKHOLD.** If the mended form holds, the tie rule, the look and the hold
   are no longer on a couple's path, and D111 (3)'s target is gone. The agent's recommendation to hold that work is
   right.

**What I would not do:** tune the share further; port a wider joint move; build B before a test shows where A loses;
read the prototype's path time as the design's.

