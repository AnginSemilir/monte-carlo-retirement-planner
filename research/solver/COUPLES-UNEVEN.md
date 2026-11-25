# The household route at uneven holdings: what makes it pay more tax at 25/75 (the deep review's one test; EXPLORATORY)

Written 25 Nov, before any unit of it runs. It is the one test the deep review of the registered read proposes
(`reviews/2026-11-25-deep-couples-any.md` section 3). EXPLORATORY on the tuning seed: it changes no default, no gate and
nothing in the candidate (CHECKLIST 1). It settles what M1's two names on the registered read are made of, which goes to the
maintainer with that read before any default changes (`registrations/couples-any.md`, Outcomes).

## The question

On the registered read, the household route (ROUTE) pays more lifetime tax with the younger holding 75% than at the
library's own 60/40, on the same markets and on every one of S041's 14 kinds: `+£440` a year on seed 7027 and `+£437` on the
pilot (post hoc, the deep review's section 2). The app's rules (APP), where arm A picks the same rule at both holdings, move
only `-£59` to `+£84`. The deep review's leading cause is that the household table taxes an uneven couple as one person: one
person's tax at k times one person's allowance and bands (the form 'pensionsPA', k = 1/s, `1.333` at 25/75), exact only when
the two draw their pensions in proportion, while the route carries each move out at the even split.

Which part, if either, makes the rise: the table's allowance at k, or the even split?

## What runs

- **Code and settings:** the registered code (d91a642206b9) and the registered configurations, APP `ef459a5c8ccb` and ROUTE
  `0fea0d25d803` (`audit-couples-any.mjs` `CONFIG`); seed 7002, the pilot's and not held out; `4,000` paths a unit; the
  app's 45 points; estate weight 0.02.
- **Units (28):** S041's registered units (`couples-any-registered-panel.json`, REG=1), its 14 kinds (W0, L, and R's twelve:
  the pension or the ISA one to three profiles apart, each way) at the library's holding ('own', the elder holding 60%) and
  at 'Y75' (the younger holding 75%), each at its registered landed target.
- **Arms**, every one in one process per unit and run by the engine on the same paths; each exists in code:
  - **APP:** arm A, the app's rules, as the registered audit runs it.
  - **ROUTE:** the household route as registered (`audit-couples-any.mjs` `solveRoute`: the form 'pensionsPA', every shape
    the household plan takes named, the even split), its paths on the page's own context (`solvedContext`).
  - **PA2:** the household plan solved and assembled at the form 'pensions' (HSP; the couples trade's PA2): its allowance
    two people's, its bands at k; everything else ROUTE's.
  - **SPLIT:** ROUTE's own table, its moves carried out at the pensions' split (`chooseHouseholdSingle` with `cp.split`
    'pensions', the remedy's part 2: the first person funds their pensions' share of the two people's pensions each year).
  - **FIX**, beside and deciding nothing: the household plan at the form 'pensionsPAown' (PRICING-FIX.md's candidate A),
    which D145 (2) left off.

## The checks: any failure is a STOP, the unit ends and nothing is read

At the app's points all five; at a smoke's points 3, 4 and 5.
1. ROUTE's household table, solved again, carries the registered run's digest and the pilot's, and its k the registered
   run's (tables do not depend on the seed).
2. APP and ROUTE on the first `1,000` paths equal the pilot's arrays (`results/couples-any-pilot`), every key.
3. SPLIT's construction with its split read as 'even' gives ROUTE's arrays bit for bit on the first `200` paths; and SPLIT
   as run parts from ROUTE on some path on every 25/75 unit.
4. PA2's household plan is ROUTE's but for its allowance (two people's against k times one person's, the k the same) and its
   tax thresholds, each moved by the allowance's difference (the bands above the allowance staying at k; found on the smoke
   and on all 28 units' plans before any unit ran). FIX's is ROUTE's but for its incomes, its k and allowance ROUTE's.
5. Each arm's first `200` paths are `E.runTrial`'s.
Before any solve, each unit's own premise as the registered audit checks it: arm A's pick the landing's, and its shape as the
panel requires (`audit-couples-any.mjs` `unitProblems`).

## How it is read (`reduce-couples-uneven.mjs`), once, after its gate

The gate: all 28 units in, each with all five arms; one code, audit, seed, path count, points and Node version; each arm at
its configuration; each unit's five checks recorded.

**An arm's tax rise at 25/75.** For each kind, on each path, the 25/75 unit's lifetime tax less the 60/40 unit's, a year (over
the plan's years from the first retirement, `T + 1 - tR`, as the deep review counts them); averaged over the 14 kinds on that
path; the arm's rise is the mean of that over the paths, its 95% interval by path (each path one market in all 28 units, the
kinds' differences averaged on it first). D is ROUTE's rise.

**The rule:**
0. **The premise.** ROUTE's rise D has its 95% interval's lower end above nought. If not, NO LOSS TO EXPLAIN: nothing else is
   read, and that goes to the maintainer with the registered read.
1. **An arm explains the loss** if its own rise is at most half of D, and its 95% interval's upper end lies below D's point.
   Read for PA2 and for SPLIT; FIX's rise is printed beside, deciding nothing.

**Outcomes:**
- **PA2 EXPLAINS IT** (PA2 alone): the cause is the household table's allowance at k, which cannot see that two people's state
  pensions and draws each have their own allowance: D143's pricing gap, reaching the draws as well as a partner's state
  pension. The pricing becomes the household line's next build, EXPLORATORY, read first by D34 for survival.
- **SPLIT EXPLAINS IT** (SPLIT alone): the even split at uneven holdings is the cause, for every couple on the household
  route. The split becomes the next build, EXPLORATORY, as its own change.
- **BOTH EXPLAIN IT:** both, the one with the smaller rise first.
- **NEITHER:** the household's tax pricing and its split are not the cause, and ROUTE's rise at 25/75 stays unexplained.
- **In every outcome:** the registered read and its passes stand, and nothing of seed 7027 runs again; M1's two names go to
  the maintainer before any default changes, with this read beside them; R's, L's and P's change of default is drafted
  beside it, since the rise is the household route's and not theirs.

**Beside, deciding nothing:**
- each arm's spending at 25/75 less 60/40 (lifetime spending delivered as a share of the unit's target, in points, on the
  paths the arm and APP keep at both holdings) and its end pot;
- each arm against APP at 25/75: the pooled survival change by path, and spending on the paths both keep;
- each arm against ROUTE, unit by unit: D34's statistic in whole paths (paths ROUTE keeps and the arm loses, less those it
  saves) against its threshold;
- APP's own rise on the kinds where arm A picks the same rule at both holdings, the yardstick.

## Cost and box

- **Cost:** three solves a unit (ROUTE, PA2, FIX) and four household arms' paths, about `12` minutes a unit; under `6`
  core-hours in all, about an hour and a half on four cores.
- **Box:** half a day to build (to 12:30 UTC on 25 Nov), an hour and a half to run, half a day to read. When it runs out, stop
  and report to the maintainer (CHECKLIST 8).
- **Launch:** through the launcher on frozen code, `PREDICTION="none:..."`, from the main tree once the build, its planted
  checks and a smoke are committed:
  `PREDICTION="none:the household route at uneven holdings, the deep review's one test (COUPLES-UNEVEN.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-couples-uneven.sh`
