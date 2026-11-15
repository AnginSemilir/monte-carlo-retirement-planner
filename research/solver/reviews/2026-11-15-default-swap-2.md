# Review before a change of default, second round: a couple whose elder is entered second, solved on its mirror (D104 (1), `SWAP_ELDER` on)

Subject: the answer to the first round's FAIL (`reviews/2026-11-15-default-swap.md`: BLOCKING 1, MINORs 2 to 4), made in one
fix (0a805eb7), with the page's check run again on it (3b730566, and its plant in 0f51ee06). The working branch is at
0f51ee06. The commits after it (5f1a25af, 2b69f779, 108d5075: the share rules' test) change no file in `src`,
`research/ui-harnesses`, or `research/tests` beyond `fast-inputs.json`.

Read (blobs at 0f51ee06):
- the fix: `src/coupleOrder.js` 54bee414, `src/solverClient.js` 494afb99, `src/solver/couple.js` 1a51d82b;
- the tests and results: `research/tests/couple-swap.test.mjs` 3183b0dd, `couple-order.test.mjs` 5921e6c1,
  `couple-horizon.test.mjs` b8126fce, `couple-default.test.mjs` dad9d761, `run-all.mjs` 862435bc,
  `research/ui-harnesses/solver-planner-ui.cjs` 1f7fda92, `results-planner-ui-swap.txt` ee9642e5,
  `results-planner-ui-noback.txt` e70ffd52, `e3pcls-pin.json` e8647b7f, `STATE.md` cca1f004;
- what the answers feed: `src/solverStrategy.js` a4bbb1c4, `src/solverWorker.js` ba539012, `src/useSolver.js` c9b94ff8,
  `src/PlannerPlan.jsx` ddcaa68d, `src/solverWords.js` dff35b17, `src/solverCouple.js` c3a00206, `src/couplesSwitch.js`
  84f2038f, `src/SolverFigures.jsx` 29984662, and `src/App.jsx` 6f9e21aa (`buildContext` l.1689-1705, `planEndAge` l.1819,
  the bands l.1999-2004, `spendTargetAtAge` l.2088, `stepYear`'s row l.2866-2898, `evaluateRows`, the ledger l.9302, the
  history check l.9478-9507).

Ran (read-only on the repository). My scripts are in the session scratchpad, `review-swap-2/`. They run in a `--shared` clone
at 0f51ee06 and in two archives, one at 0f51ee06 and one at d37b3f31 (the code the first round read). The engine was built in
each; its bytes are the repository's. I opened nothing of seed 7021, D4, `d4-backup` or `d4b-backup`.
- `couple-swap`, `couple-order`, `couple-horizon` and `couple-default`, each plain and with `--planted`: all pass. Every plant
  fails exactly its checks:

  | test | plant: checks failing |
  |---|---|
  | couple-swap | capafter: 2; noback: 4, 5; noaheadparts: 4; norowsparts: 4; noverdict: 4; nostrategy: 5 |
  | couple-order | bandstay: 2, 4; locksstay: 5 |
  | couple-horizon | rawyears: 1; mirrorsum: 2 |
  | couple-default | firstnotelder: 2; eldereither: 2; halfdefault: 3; oldcouples: 4; rawages: 5; noagecap: 6 |

- The fast tier and the full tier's couple tests the change reaches: see the end.
- `whole-identity.mjs`: the cut (`couplePlans`, the pots' share) and the mirror (`otherOrder`), on the code before
  (d37b3f31, no plant) against the fix (finding 1 for the last row):

  | plans | cut differs | mirror differs |
  |---|---|---|
  | the library's 210 couples as entered | 0 | 0 |
  | the same mirrored | 0 | 0 |
  | 6,720 whole-age plans (first age 40 to 85; partner 11 younger to 10 older; end age blank, 85 to 130, or at or below the first age; with and without an open band, open incomes and limits per person) | 0 | 0 |
  | the same 6,720 with the first age left blank | 0 | 0 |
  | whole current ages, a fractional end age | 216 of 216 | 216 of 216 |

- `probe-horizon-solve-new.mjs`, the first round's probe on the fix: 60.5 and 62.1 to 95 now solves. The plan as entered runs
  35 years, the mirror 35, each person's plan 35, and the Strategy answer comes back.
- For finding 1: `frac-lastyear.mjs`, `frac-example.mjs`, and copies of couple-order check 2 and couple-cut check 1 with a
  fractional horizon added (`couple-order-frac.mjs`, `couple-cut-frac.mjs`).
- For finding 2: `fp-noise.mjs` and `frac-putback-60.mjs`.

Verdict: PASS

## What holds

- **BLOCKING 1 is answered.**
  - The code:
    - `backStrategy` (`coupleOrder.js` l.105-109) moves `raise.age` and every `outlook.spend[].age` by the gap.
      `backAnswer` takes the 'strategy' kind (l.115).
    - The job's `strategy` goes through it (`solverClient.js` l.289), as `ask` already did (l.288).
    - Nothing is put back twice: `strategyNow` asks the worker through the bare `ask`.
  - Those two are the only ages the page reads from the Strategy answer:
    - the spending chart and its table, and the sentence's stretches and raise age (`PlannerPlan.jsx` l.241-286);
    - `ageAt0Of` from the first outlook year, for the wealth chart, its table and the back mark;
    - the raise words.
  - The rest of the Strategy answer passes through: the headline (`target`, `retireT`, `backT`, `backYear`), the comparison and
    the money bands are household figures or keyed by plan year.
  - What the page asks:
    - `PlannerPlan.jsx`: 'strategy', 'ahead', 'actions' ('distil' is refused for a couple);
    - `SolverFigures.jsx` and `startFigures`: the headline and the comparison;
    - `App.jsx`: 'rows'.
    - No page reads 'simulate'. 'runs' is asked only inside the client, of the kept parts, and joined before the put-back.
  - Pinned:
    - Couple-swap check 5: 28 outlook years and the raise at 65 and 67 as entered, where the mirror reads 68 and 70. Every
      other figure is unchanged. Its plants 'nostrategy' and 'noback' fail it.
    - Harness check 19 (e): its first line is now compared with a reference whose ages the harness puts back itself. A new
      line compares the outlook and the raise with the elder-first entry's, moved by the gap.
    - The results: 69 ok. Under 'noback', exactly check 19's three lines fail (the outlook from 68 against 65).
  - These results are of the fixed code. Under 'noback' the first line fails, which it could not have done against the old
    reference.
- **MINOR 2: the loud failure is gone.**
  - Couple-horizon passes over 3,618 fractional couples, and its plants are exact.
  - The first round's failing couple now solves (above).
  - For whole ages, independently of the test's plants, the cut and the mirror are the code before's to the bit (above).
  - Finding 1 is what the change does where the horizon is fractional.
- **MINOR 3 is answered.**
  - The built couples now carry `{ pen, isa }` ceilings, which `normalizeSolverLocks` keeps (`App.jsx` l.1062-1068).
  - Check 5 holds the mirror's ceilings to the entered ones swapped, and 'locksstay' fails exactly check 5.
- **MINOR 4 is answered.** Check 4 now covers:
  - each person's moves in the next years (10 of 10 years differ between the two) and in the year rows (28 of 28);
  - the failure age, on a run at z -2.5 that fails at 84 as the mirror reads it and 81 as entered.
  - Each of the three plants fails exactly check 4.
- **Nothing else the page shows a couple entered younger first is left in the mirror's ages or names**, for whole ages
  (finding 2 for ages in tenths):
  - put back: the meta and the share, the progress label, this year's actions, the next years, the year rows with their
    verdict, and the Strategy answer;
  - row keys: `backRow` turns every Self/Part key and every account id. The row's other fields are the household's
    (`workingTakeHome`, `switchPaid` and the sweeps are sums over owners). The tier names are dropped, and no page reads them;
  - read from the plan as entered, or naming no person: the store note, the bug-report details, the age card (the entered
    first person's retirement age) and the scenarios.
- **The e3pcls pin was re-taken.** `e3pcls-guard` passes in the fast tier at 0f51ee06, and `check-state.mjs` passes.

## Findings

1. **MINOR. The whole-year end age changes what the last plan year holds where the horizon is fractional.**
   - **The change.** The fix writes the mirror's end age as the new first person's age plus the rounded years
     (`coupleOrder.js` l.46). It gives each person's cut plan its age plus the rounded years (`couple.js` l.121, l.126). That
     was the first round's own remedy.
   - **What the remedy missed.** The engine reads the end age for more than the count:
     - a band with no end age runs to the unrounded `terminalAge` (`App.jsx` l.2002);
     - an income with no end age runs to `planEndAge` (l.1819).
   - **Where it bites.** Where the plan's years end in .5 or more, they round up. The plan as entered then reads its last year
     without the open band and the open income. The mirror and the cut plans now read them in.
   - **Measured** (`frac-lastyear.mjs`, an open band and open incomes, first ages in tenths, end ages 90, 95, 95.5, 100.3):

     | | the code before | the fix |
     |---|---|---|
     | the mirror (496 couples, elder second): a year short | 22 | 0 |
     | the mirror: the household's band differs in some year from the plan as entered | 0 | 244 |
     | the mirror: an income's paid years differ | 176 (of the 474 that ran) | 244 |
     | the cut (868 couples): a person's plan a year short | 22 | 0 |
     | the cut: a person's band differs in some year from the household's | 0 | 427 |

     The income column was already wrong before: a younger first person's open income in the mirror.
   - **Example, a swapped couple** (`frac-example.mjs`): 55 and 58 to 95.5, the target £30,000, a band of £24,000 from 65
     with no end age.
     - As entered, the last year (at 96) reads £30,000.
     - The code before's mirror reads £30,000 there.
     - The fix's mirror reads £24,000.
   - **Example, a couple entered elder first, not swapped:** 55 and 53 to 95.5.
     - The household's last year reads £30,000.
     - Each half-share table read £15,000 there before the fix, and reads £12,000 after it.
   - **The project's own checks catch it once they are given the case:**
     - Couple-order check 2's year-by-year comparison, with two fractional-horizon couples added, fails on the fix: the
       scheduled target and the partner's incomes in the last plan year. It passes under 'mirrorsum'.
     - Couple-cut check 1, with S129's end age half a year on (56 to 95.5), fails at every share and by the page's
       route, in plan year 40, its last. It passes under 'rawyears'.
   - **Why no test fails:** couple-horizon compares the count of years alone, and both suites' built couples have whole
     horizons.
   - **The first round is also corrected.** Its "What holds" said `bandTo` covers the same plan years "for any fractional
     age". That no longer holds at an open band's end.
   - **Severity.** It needs a first age or an end age with a fraction, and a band or an income with no end age. It moves one
     year, the last. Before the fix, a smaller set failed loudly instead. No library couple has any of these (0 of 210 has a
     fractional age or end age, an open band or an open income), so no tested unit or panel moves; the inputs accept all
     three.
   - **It reaches couples entered either way**, through the cut. So it belongs before the next batch takes the cut's change to
     `main`.
   - **To clear, either:**
     - keep the end age's reading (the sum of the ages, as each plan's engine would read it) and make the count agree
       separately; or
     - move the engine's reading of a blank end age to the plan's last year (a change on `main` for every fractional plan).
   - **Either way:** add the fractional-horizon couples to couple-order check 2 and couple-cut check 1. Each should fail on
     the fix as it stands.

2. **MINOR. Ages put back by adding a floating-point gap carry rounding noise where an age has a tenth.**
   - **The code.** `backStrategy`, `backAhead` and `backVerdict` add `gap` (`coupleOrder.js` l.83, l.98, l.107-108).
   - **Measured** (`frac-putback-60.mjs`): solved by the page's route at the light settings, S007's people entered younger
     first at 60 and 63.1, to 92. The gap is -3.1000000000000014.
     - The next ten years' ages read 60.99999999999999, 61.99999999999999, 62.99999999999999 and 63.99999999999999 for 61 to
       64.
     - The outlook reads 62.99999999999999 and 63.99999999999999.
     - The raise is at age 62.99999999999999 in year 3, where the age as entered is 63.
   - **The page prints these ages raw:**
     - "(age …)" (`solverWords.js` l.217);
     - "from about age …" (l.34);
     - the outlook table and the chart's sentence (`PlannerPlan.jsx` l.255, l.286).
   - **The failure age goes through the same addition.** It feeds the history check's "Ran dry after … of … drawdown years",
     and its comparison with the start of drawdown, which decides the words (`App.jsx` l.9489, l.9502-9503).
   - **How often** (`fp-noise.mjs`):
     - of 1,920 couples with the first person 40 to 63 and the elder 0.1 to 10 years older in tenths (halves left out), 732
       show it in some plan year, 390 of them in the year the first person turns 64;
     - half years are exact;
     - the year rows are exact, because `backRow` takes the mirror's `agePart`.
   - **Not a regression for whole ages.** `backAhead` and `backVerdict` already did this in the first round's code; the first
     round missed it. The tests and the harness use whole ages.
   - **To clear:**
     - put each age back as the entered first person's age in its plan year: `ageSelf0 + t` of the plan as entered, and the
       verdict's from its year;
     - add a check over ages in tenths.

## The suites

- **The fast tier** (`node research/tests/run-all.mjs fast`, in the clone at 0f51ee06): "75 files found, 75 run, 75 passed"
  (71 minutes).
- **The full tier's couple tests the change reaches**, at 0f51ee06: couple-actions, couple-figures, couple-levers,
  couple-limits, couple-lockstep, couple-solve-client, couple-split, couple-tables, solver-couple and speed-mode. Each exits 0.
- **CI:**
  - Verify is green on 0a805eb7 and on 5f1a25af (the same code).
  - No Full run has finished on this code: each was superseded, and the one on 108d5075 was running when I wrote this.
