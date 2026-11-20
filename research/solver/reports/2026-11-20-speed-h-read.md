# The speed mode on the household plan, read (20 Nov; EXPLORATORY; `SPEED-H.md`)

**Outcome, by the rule committed before any unit ran: HOLDS.** On SPEED-B's twelve couples, each solved as the page now
solves a couple (one household at 'pensionsPA'), the speed mode loses nothing beyond item 7's bars. The read decides
nothing. It goes to the maintainer as the trade it is, with the time it saves (`results-speed-h.txt`, the reducer's output
whole; beside it `results-speed-h-beside.txt`, written after the read on the reviewer's findings). The reviewer at the read:
PASS, four MINOR (`reviews/2026-11-20-read-speed-h.md`), answered below.

## The run

- **The twelve couples**, SPEED-B's (`couples-panel-d4b.json`, at their landed targets). Each was solved twice as the page
  solves a couple at the default: as it stands (WHOLE) and with the speed mode on (SPEED).
- **Settings:** seed 7002 (not held out), `4,000` paths, 45 points.
- **Through the launcher** from a41b90e8 (code 9f9857213b75, audit 23744283ca8d): 20 Nov 20:47 to 22:04 UK, its smoke passed,
  no unit exiting with an error.
- **Launched in the light lane**, one unit at a time, beside the savings split's registered run. `SPEED-H.md` had said it
  would wait for that run to free the cores; that touches the times alone.
- **The gate is fair:**
  - every unit in both arms;
  - one code, audit, seed, count of paths and points;
  - each arm's speed mode as named;
  - the household's table the same in both arms;
  - each household at 'pensionsPA' at the even split.

## The rule's figures (`results-speed-h.txt`)

SPEED against WHOLE, paired on the same paths:
1. **pooled survival** `-0.008` points (`-0.030` to `+0.013`); its lower end above `-0.1`: HOLDS;
2. **no unit wholly below `-0.3`**: none: HOLDS;
3. **pooled spending delivered** `-0.0082%`; within `0.05%` either way: HOLDS;
4. **the mean pot left** `-0.008%` pooled, the capped pot `-0.034%`; not lower by more than `0.5%` and `0.1%`: HOLDS. The
   capped pot is the part-4 figure nearest its bar.

## Beside the rule, deciding nothing (`results-speed-h-beside.txt`)

- **By unit (A):**
  - Six of the twelve lose no path and save none (S063, S097, S133, S301F, S305F, S319F).
  - The largest loss on a unit is S047's and S115's, `-0.050` points each: S047 `7` saved and `9` lost, S115 `0` and `2`.
  - That `-0.050` is a point estimate. Every unit's interval stays above `-0.5` points (the warning's 5 in 1,000), and
    S047's reaches lowest, to `-0.273`.
- **S047 carries nearly all of parts 3 and 4.**
  - S047: spending `-0.0687%`, the capped pot `-0.442%`, lifetime tax `+10.04%`.
  - Without S047 (C): pooled spending `+0.0006%`, the capped pot `+0.003%`.
- **The cohorts apart (B):**
  - the library's six `-0.021` points (`-0.061` to `+0.018`), spending `-0.0246%`;
  - the younger six `+0.004` (`-0.021` to `+0.029`), spending `+0.0014%`.
  - SPEED-B's largest losses were on two of the library's cohort, S031 `-0.550` and S063 `-0.500` (`results-speed-b.txt`).
- **The units' shape (E):** every unit is three years apart, the first person holding `60.0%` of the pots, each with a minimum
  pot of its own (k `1.6667`). What the read says reaches no other shape. A couple the household plan refuses keeps today's
  route, where SPEED-B's figures stand.
- **The time (D)**, SPEED over WHOLE; a guide, since the units ran beside the registered run:
  - a path's, as the read prints it: the median `x0.63` (`x0.38` to `x0.80`);
  - the solve and the `4,000` paths together: the median `x0.72` (`x0.49` to `x0.86`). This is the measure SPEED-B's
    beside file gave the warning's speed by, `x0.82` on today's route.
  - **The order of timing:** WHOLE was solved and timed first in every unit, and its table is the same as SPEED's. The
    second solve took the median `x0.957` of the first's time (below 1 on `11` of `12` units). So the order alone flatters
    SPEED by a few percent.
- **SPEED-B on today's route, for the same twelve couples** (`results-speed-b.txt`, its run of 15 Nov, before the couples'
  joint move took its tie rule and hold, D109):
  - outcome LOSES on part 3;
  - pooled spending `-0.0683%`;
  - pooled survival `-0.023` (`-0.084` to `+0.038`);
  - a path's time the median `x0.79`.

  The two reads differ in route, code and date, so the comparison is not paired.

## For the maintainer

The couples' warning reads: "usually only a little faster, it spent a little less, and for some couples it lowered the chance
your money lasts by about 5 in 1,000". Its figures are SPEED-B's, on today's route, and today's route is still what a couple
the household plan refuses takes.

On these twelve households, all of one shape, the losses are smaller (above), and a path and its solve take about `x0.72`
of the time.

Whether to keep the warning's words or change them is the maintainer's. The agent recommends keeping them as they stand:
they err towards caution, and twelve couples of one shape on one seed is a narrow read.
