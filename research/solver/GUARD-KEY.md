# What keys the guard: a DB pension, or rent, on the couples that did well without one (D129 (4); EXPLORATORY)

Written 18 Nov (evening), and committed before any unit is landed or run. The maintainer's ruling: "Go ahead" on the
agent's fourth recommendation after D128 (D129 (4)). EXPLORATORY on the tuning seed: it changes no default, no gate and
nothing in the candidate. What it finds about the guard comes back to the maintainer, as below.

## The question

D128's guard keeps a couple on the app's rules when the two are more than three years apart and the plan has other
taxable income. It rests on step 5 (`results-shapes-beside.txt`, seed 7002):
- today's couples' default (K2) ran below the app's rules (APP) on three couples 8 or 12 years apart with a `£15,000` a
  year DB pension (S147-db@gap8 `-6.800`, S147-db@gap12 `-10.950`, S061-dbpart@gap12 `-20.250` points);
- K2 ran above APP on the four as far apart without one (S149 and S337F at gap8 and gap12, `+10.744` pooled).

But S147-db and S061-dbpart differ from S149 and S337F in more than the DB pension: tax region, minimum pot and where
their cash sits among them. So the DB pension may not be what brings the harm.

**Does giving S149 and S337F at gap8 and gap12 the same DB pension bring the harm? And does `£15,000` a year of rent
instead, which the guard also reaches, bring it?**

## Units

Eight units, named `<step 5 unit>+<income>`: S149@gap8, S149@gap12, S337F@gap8 and S337F@gap12, each built as step 5
built it (`shapes-panel.mjs` `unitOf`), and each given one income, both the first person's and taxed as other taxable
income:
- **+db:** S147-db's DB pension, `£15,000` a year from the state pension age to the plan's end
  (`share-rules-panel.mjs` `withFeature`, `'db'`);
- **+rent:** `£15,000` a year of rent, from plan year 0 to the plan's end.

Each is landed as step 5 landed its units: arm A, searched anew at each target, 85 within a point on `1,000` paths of
seed 7005 (`phase4-panel.mjs` `landTarget`), from its step 5 unit's landed target. A unit that does not land is printed
and left out. Fewer than three units of an income landed is a STOP.

## Arms

On the same `4,000` paths of seed 7002, at `45` points and estate weight `0.02`, as step 5 ran them:
- **APP:** arm A, the app's rules, on the plan as entered;
- **K2:** today's couples' default, solved by `solveCouple` whatever the guard says of the couple.

Each arm is held to `E.runTrial` on its first `200` paths, and saved in chunks of `1,000`.

## The measure and the rule

K2 less APP, paired by path (`stats.mjs` `survivalChange`, the exact interval), on each unit and pooled over the units of
an income (their cells summed).

For each income, the first of these that holds:
1. **HARM:** the pooled K2 less APP lies wholly below nought.
2. **SOME HARM:** a unit's K2 less APP lies wholly below `-0.3` points (the lead test's unit bar).
3. **NO HARM:** otherwise.

## What each outcome leads to

- **+db HARM or SOME HARM: the guard stays as built.** A DB pension brings the harm to couples that did well without
  one. The couples card then says what was found (D129 (5)), to `main` with the next batch on B1's gate.
- **+db NO HARM: the guard is keyed on the wrong thing.** Re-keying it comes back to the maintainer as a change of
  default, with this read. Nothing in the app changes until that is ruled.
- **+rent** decides nothing on its own; it sizes the guard's reach past a DB pension:
  - HARM or SOME HARM: the reach holds on these couples too;
  - NO HARM: the reach costs these couples K2's gain over APP, whose pooled size goes to the maintainer.
  - Where +db brings harm and +rent does not, an income's start may be what matters (a DB pension from the state pension
    age, rent from now). That is said to the maintainer as a lead, not a cause.

## Beside, deciding nothing

- each unit's K2 and APP survival, and K2 less APP with its counts;
- spending delivered on the paths both keep, K2 against APP; the end pot and the capped pot; lifetime tax;
- the same four couples without the income, from step 5's stored arms (`results/shapes-7002`), at their own landings;
- each unit's landed target against its step 5 unit's;
- the app's guard's answer on each unit's plan as entered (`src/couplesSwitch.js` `coupleSolverOn`: `gapincome` on all
  eight, the guard as built).

## Box

Half a day from 18 Nov 19:20 UTC: this rule, the panel and its landing, the audit, the batch and the read with its
planted checks, a smoke, the run (about forty minutes on four cores, after the decomposition), and the read. The read
goes to the maintainer with the `reviewer` agent at the read. When the box runs out, stop and report.
