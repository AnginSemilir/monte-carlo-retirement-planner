# The couples' tier test: its rule, committed before launch (13 Nov)

EXPLORATORY, seed 7002 (the tuning seed), deciding nothing in the code: it tells the maintainer what must be true before
couples run the candidate under the switch. It is the deep review's one test after the couples' registered read
(`reviews/2026-11-13-deep-couples-d4b.md` section 3), and D39's test for singles carried to couples.

## The question

The registered read passed on survival and spending, and the pot a couple leaves is much smaller than under the app's
rules: about half at the median for the younger couples. The deep review's leading cause is the lower-risk funds the
solver holds (the tier changes), not money given away above the estate cap. It is inferred: the registered run stored
no tier. If it is right, nothing in the solver needs to change before couples go on, and a couple controls the trade
by consent. If it is wrong, the fall is in what the joint move draws and spends, and a tie rule for the joint move
comes first.

## The run

`audit-couple-tiers.mjs`, through the launcher, `batch-couple-tiers.sh`; read by `reduce-couple-tiers.mjs`.

- **Couples:** eight of the panel (read on 13 Nov, so no longer held out), each plan as landed: the younger cohort's
  S309F, S311F, S317F, S323F and the library's S189, S293, S011, S083.
- **Arms**, at estate weight 0.02, each solved at 45 points and run by the engine on the same 4,000 paths of seed 7002:
  APP (the app's rules, arm A's pick); CANDC (the candidate for couples as registered); CANDCNC (the same with consent
  to change risk withdrawn for each person, so each table holds the plan's own tier pair and no other).
- **Stored:** each path's survival, pot left, lifetime tax, the tax paid in years the household stood above the estate
  cap (four times its opening wealth) and the spending delivered; by plan year, each person's tier steps held below
  the plan's own.
- **Beside it, the capital gains bill's replay** (open item CGT-BILL): CANDC's solved couple run also on the engine
  before that fix, counting by year the paths that fail while the household holds more than it opened with.

## The gate

One code, audit stamp, seed, path count and points across the eight units; the candidate the registered run's
(af001697ce1b: the test is of what the registered read read, so it is launched before the tie-break's port, D95, joins
the working branch); every arm's arrays one a path; APP on arm
A's pick; CANDC with more than one tier pair for each person; CANDCNC with exactly one pair for each person and no tier
step held in any year.

## The rule

1. **The pot.** For each couple, on the paths all three arms survive: the median pot left under CANDC and under
   CANDCNC, each over APP's. Over the four younger couples, the mean of those ratios:
   - CANDC's at 0.85 or more: **NOT REPRODUCED** on these paths; no verdict, and the registered run's figures stand
     as the only evidence;
   - otherwise CANDCNC's at 0.85 or more: **THE TIERS ARE THE CAUSE**;
   - CANDCNC's under 0.65: **NOT THE TIERS**;
   - between: **BOTH**, reported as such.
2. **The tiers' share of the gain.** (CANDC less CANDCNC) over (CANDC less APP), survival pooled over the eight, its
   interval by path. Reported; the singles' 47.5% beside it.
3. **The bill's replay.** On S309F and S311F, CANDC's paths failing with more than the household opened with, on the
   engine before the fix and on this one. **THE BILL** if the engine before the fix has such paths in one year before
   the last and this engine has none of them; otherwise **NOT SHOWN**.

Beside the rule, deciding nothing: lifetime tax and the tax paid above the cap in each arm (with the tiers out of it,
CANDCNC's against APP's sizes what a tie rule in the joint move could save); the tier steps held by year.

## What each outcome changes

- **The tiers are the cause:** nothing in the solver changes before couples go on. The couples' screens (Part D's D5)
  show the pot beside the survival figure, and what withholding consent does to each. A tie rule for a couple's joint
  move becomes a tax matter, sized by the figures beside the rule, and goes to the maintainer as such.
- **Not the tiers:** a tie rule in the joint move is built and read (its own rule committed first) before couples run
  the candidate; they keep the app's rules meanwhile.
- **Both, or not reproduced:** to the maintainer with the figures; no build is started on it.
- Part 2's figure is what a couple who withholds consent should be shown, whichever way part 1 reads.
- Part 3, THE BILL: open item CGT-BILL's replay is done. NOT SHOWN: the lost year is still unexplained and stays open.
