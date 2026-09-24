> **SUPERSEDED 25 Sep 00:43 UK** by the registered `predictions/bridge-quad.md` (7i), revised with M14c and O19 (the final year left at 5 nodes in both arms, as the product has it).

# DRAFT - not registered. Test design: is the bridge misread an averaging problem or a representation problem?

**Status:** drafted 24 Sep ~21:35 UK with quad-oracle.md, under the same instruction (revise after M14c and O19 are read,
then register as `predictions/<name>.md` with the full fair-test table, commit, push, launch through the launcher).
Nothing below is a result.

## Why

With F1 off, the table's opening survival on retired bridge households was 43-98 points too low (results-f1v2.txt). F1 is
a patch on the read. The outside review's second idea - a boundary model plus a residual table (its variant B) - is the
candidate to replace F1 (7e). That is worth building only if the bridge misread is a representation problem: the cliff
runs across the 6-point pension-share axis, and no amount of better averaging over returns can see a cliff that falls
between two grid columns. If instead more return points close the gap, the cheaper fix is averaging (the template
integral), and F1's job is done differently.

## Design

`audit-s126.mjs`'s f1v2 mode (solvePlan, step-6 defaults, three worlds, paired on 1,000 paths of seed 7002), with F1 OFF,
at 5 return points against 15 (a small change: the mode passes `quadNodes` from an environment setting, recorded in each
arm's "ran" line so read-f1v2's gate sees it). Cases: S126, bridge 4, bridge 6, share 0.95, S366, S360 (the in-class
case, the short and long bridges, the edge case and the two with money arriving). Measured: the opening table read against
simulated survival (the gap), and simulated survival, paired.

**Draft prediction:** the gap barely moves - every case that misreads by more than 40 points at 5 points still misreads by
more than 30 at 15 - because the error is in the grid read across the share axis, not in the averaging. **Falsified if**
15 points closes the gap to within 10 points on at least half the cases: the bridge misread is mostly averaging, and the
template integral (not a new representation) is the fix to build.

## To revisit after M14c and O19 (before registering)

- If O19 shows the exact final year changes survival on its households, check whether any of these six cases reach the
  end-of-plan line in the paths that fail (then the final-year setting must be held fixed across both arms, and stated).
- Decide whether the exact final year is on in both arms (it should match whatever 7e will use as its baseline).
- Re-estimate the time: 12 solves at 16 points, 15-point arms ~3x; from 7c's measured ~10 min a case at 5 points.
