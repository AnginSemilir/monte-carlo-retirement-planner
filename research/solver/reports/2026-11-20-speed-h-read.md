# The speed mode on the household plan, read (20 Nov; EXPLORATORY; `SPEED-H.md`)

**Outcome, by the rule committed before any unit ran: HOLDS.** On SPEED-B's twelve couples, each solved as the page now
solves a couple (one household at 'pensionsPA'), the speed mode loses nothing beyond item 7's bars. It decides nothing: the
read goes to the maintainer as the trade it is, with the time it saves (`results-speed-h.txt`, the reducer's output whole).

## The run

- Twelve couples, SPEED-B's (`couples-panel-d4b.json`, at their landed targets). Each solved twice as the page solves a
  couple at the default: as it stands (WHOLE) and with the speed mode on (SPEED).
- Seed 7002 (not held out), `4,000` paths, 45 points.
- Through the launcher from a41b90e8 (code 9f9857213b75, audit 23744283ca8d): 20 Nov 20:47 to 22:04 UK, its smoke passed, no
  unit exiting with an error.
- It ran in the launcher's light lane, one unit at a time beside the savings split's registered run, so its times are a guide.
- The gate is fair: every unit in both arms; one code, audit, seed, count of paths and points; each arm's speed mode as named;
  the household's table the same in both arms; each household at 'pensionsPA' at the even split.

## The rule's figures (`results-speed-h.txt`)

SPEED against WHOLE, paired on the same paths:
1. **pooled survival** `-0.008` points (`-0.030` to `+0.013`); its lower end above `-0.1`: HOLDS;
2. **no unit wholly below `-0.3`**: none: HOLDS;
3. **pooled spending delivered** `-0.0082%`; within `0.05%` either way: HOLDS;
4. **the mean pot left** `-0.008%` pooled, the capped pot `-0.034%`; not lower by more than `0.5%` and `0.1%`: HOLDS.

**A path's time,** SPEED over WHOLE: the median `x0.63` (`x0.38` to `x0.80`), a guide.

## Beside the rule, deciding nothing

- **By unit:**
  - Six of the twelve lose no path and save none (S063, S097, S133, S301F, S305F, S319F).
  - The largest loss is on S047 and S115, `-0.050` points each:
    - S047: `7` saved, `9` lost;
    - S115: `0` saved, `2` lost.
  - S047's spending is `-0.069%`, and its lifetime tax `+10.04%`.
- **SPEED-B on today's route, for the same twelve couples** (`results-speed-b.txt`, its run of 15 Nov, before the couples'
  joint move took its tie rule and hold, D109):
  - outcome LOSES on part 3;
  - pooled spending `-0.0683%`;
  - pooled survival `-0.023` (`-0.084` to `+0.038`);
  - a path's time the median `x0.79`.

  The two reads differ in route, code and date, so the comparison is not paired.
- **The couples' warning:** "usually only a little faster, it spent a little less, and for some couples it lowered the chance
  your money lasts by about 5 in 1,000". Its figures are SPEED-B's, on today's route. On these households the largest loss on a
  unit is `-0.050` points, a half in 1,000; whether to keep the warning as it stands or change it is the maintainer's.
