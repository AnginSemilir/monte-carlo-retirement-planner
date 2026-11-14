# The allowance's step at both places, the solver choosing (D98; EXPLORATORY, seed 7002)

Committed before launch. Passing its rule is the ruling naming the run (D98): the option joins the candidate, with the
reviewer on the change of default. Failing it, the option is closed and reported, and nothing else changes.

## In plain words

When the solver draws from a pension "up to the personal allowance", it used to stop where the year's other non-savings
income and the draw together reached the allowance (£12,570). Since the harvest ceiling (on `main` since the first batch),
it stops earlier when the year has interest or dividends: where the year's whole tax bill would first rise. The test of 13
Nov (`CEILING-LEAD.md`) found that this one change is most of the extra lifetime tax on the three households with most in
their taxable accounts, and that it also leaves them a larger pot. So it is a trade, not plainly a loss.

You agreed (D98) that the solver should be offered both places and left to choose. This test builds that and asks whether
the choice pays: does a plan solved with both places on offer do better than one solved with today's place alone?

## What is built (an option, off in code)

`menuPlus: ['paraw']` (`src/solver/solve.js` `buildActions`) adds two things to the move menu:
- **a draw step, `penPAr`:** take pension income up to the personal allowance as given, counting only the year's
  non-savings income (no `pensionCeiling`). It sits on the ladder of pension steps between `penPA` (the allowance where the
  year's bill would first rise) and `penBasic`;
- **a re-wrap ceiling, `paraw`:** move pension money into the ISA up to the allowance as given, beside `pa` (the allowance
  where the bill would first rise).

The engine (`src/App.jsx`: `N4_PEN`, `N4_HARVEST`, `N4_RAW`, `drawPension`'s raw flag), the exact model (`model.js`) and the
forward run (`fast.js`) carry both alike, for a single and for each person of a couple. With no interest or dividends in a
year the two places are the same to the bit. Without the option nothing changes: the menu, every table and every run are as
before, bit for bit.

## Units

The review's eight (`audit-ceiling.mjs` `HOUSEHOLDS`: S030, S050, S090, S368, S188, S304F, S328F, S340F), as Phase 4 landed
them and as the harvest ceiling's read and `CEILING-LEAD.md` ran them.

## The arms

Each household is solved at 45 points by the app's own route (`solveForApp`), and its solved plan run on the same 16,000
paths of seed 7002 (`solverStrategy.js` `runPath`), its first 200 paths held to the engine's `E.runTrial`:
- **NOW:** the candidate as it is (`menuPlus: ['hr']`);
- **BOTH:** the candidate with `menuPlus: ['hr', 'paraw']`;
- **RAWPA**, beside the rule: the candidate on an engine whose `pensionCeiling` leaves the allowance as given everywhere
  (`CEILING-LEAD.md`'s RAWPA, its patch as there).

**Stored** for each path: survival, the year it fails, the spending delivered and target, each year's spending level, the
pot left, the estate and lifetime tax. For each arm: its menu's size, its tables' digest, its settings, its solve's
seconds, its whole score's inputs, its `pensionCeiling` read back, and how often its moves draw first through `penPAr` or
re-wrap to `paraw` over the first 200 paths. `audit-allowance-both.mjs` writes them; `batch-allowance-both.sh` runs it;
`reduce-allowance-both.mjs` reads them (its planted checks: each outcome, and the gate's refusals).

## The gate

- every household in every arm;
- one code and one audit stamp;
- seed 7002 and 16,000 paths in every arm;
- each arm's menu as named: NOW's moves are BOTH's less the new ones, and RAWPA's menu is NOW's;
- RAWPA's `pensionCeiling` read back as the allowance as given (`CEILING-LEAD.md`'s probe).

## The rule, BOTH against NOW, paired on the same paths

1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no household's interval lies wholly below -0.3 (`stats.mjs` `survivalChangeU`);
3. the pooled spending delivered is not lower than NOW's by more than 0.05 points of target;
4. the pooled mean pot left is not lower than NOW's by more than 0.5%, and the pot capped at the estate cap by more than
   0.1%;
5. **a gain:** the pooled whole score (the solver's own objective as the engine scores it: survival, the estate at the
   weight to its cap, the cost of years below target; `reduce-phase4.mjs` `wholeScore`, path by path over the eight,
   `byPath`) above NOW's, its 95% interval's lower end above nought; or pooled survival above NOW's, its lower end above
   nought.

Parts 1 and 2 are the harvest ceiling's (`HARVEST-CEILING.md`), on the same eight. Part 3 is one-sided here: spending may
rise. Part 4 adds the capped pot, as item 13's rule did, because the pot above the cap is where the step's trade showed.

**The outcomes:**
- **PASSES** (1 to 5): the ruling naming the run (D98). `paraw` joins the candidate's `menuPlus`, in `candidate.json` and
  the app's `APP_CANDIDATE` together, the decided-defaults block with them, the test that pins them, and gate 5 measured on
  it. The reviewer comes in on the change of default first.
- **NO GAIN** (1 to 4 hold, 5 fails): closed. The extra moves cost solve time and buy nothing measured; reported.
- **FAILS** (any of 1 to 4): closed and reported.

**Beside the rule, deciding nothing:**
- RAWPA against NOW and against BOTH, by the same parts;
- lifetime tax, overall and on the paths that end at or below the estate cap;
- each household's line in each arm;
- how often BOTH takes each new move;
- the solve's seconds, BOTH against NOW.

## Launch

On frozen code, through the launcher, after `SPEED-B.md`'s run frees the cores:
`PREDICTION="none:EXPLORATORY: the allowance's step at both places (ALLOWANCE-BOTH.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-allowance-both.sh`.
It runs as a harness-tracked task, relaunched under `RESUME=1` after a restart.

**Budget.** About 3 hours on four cores: 24 solves, BOTH's about half as long again as NOW's, and 384,000 paths.
**Time box:** half a day for the build with its test, half a day for the run and its read.
