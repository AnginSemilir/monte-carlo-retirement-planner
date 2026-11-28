# Couples four and five risk levels apart (EXPLORATORY; D154 (5), D149 (2))

Written 27 Nov, before any unit is landed or run. EXPLORATORY: it decides nothing, changes no default, gate or candidate, and
reads no held-out seed.

## The question

Since D148 a couple whose two people hold their pensions, or their ISAs, at different risk levels runs the household route: the
household plans that wrapper from the more cautious of the two risks, so the one held at more risk is usually moved down in the
first year. The registered test (`registrations/couples-any.md`, seed 7027) read R one, two and three profiles apart, and it
passed. A couple further apart was left on the household route by inference (D148; D149 (2)), its weakest reach: the
reviewer's light look on D148 (MINOR 3) found the median pot about a third lower at five apart. This test measures it.

## The units

The dress rehearsal's four couples, S025, S273, S351F and S357F (COUPLES-ANY.md amendment 2: touched, on the tuning seed), each
at the rehearsal's two holdings, `own` (the library's) and `Y75` (the younger holding `75%`). On the app's six risk levels
(High, Medium/High, Medium, Medium/Low, Low, Cash Equivalents), the R kinds two profiles further than the registered test's:

- the pension four apart (the safer at Low Risk, the other at the library's High Risk) and five apart (the safer at Cash
  Equivalents), each way (the first person the safer, `s`, or the partner, `t`): `Rp4s`, `Rp4t`, `Rp5s`, `Rp5t`;
- the ISA four apart (the safer at Cash Equivalents, the other at the library's Medium/High Risk): `Ri4s`, `Ri4t`;
- the ISA five apart, which the library's ISAs cannot reach: the other's ISA raised to High Risk, the safer at Cash
  Equivalents: `Ri5s`, `Ri5t` (the only kinds that change the other person's account from the library's).

Eight kinds, two holdings, four couples: `64` units. Each landed as the rehearsal's were (D4's procedure,
`couples-any-panel.mjs`): arm A, searched anew at each target, survives `85 +/- 1%` on `1,000` paths of seed 7005. Each unit
checked before it runs: the household plan takes it with its shape named and refuses it without it for its shape ('different
risks'), and the app's guard puts it on the household route (since D148).

## The arms and the paths

The rehearsal's two arms, on the same `4,000` paths of seed 7002, at estate weight `0.02` and the app's points
(`audit-couples-any.mjs`): APP, the app's own rules on the plan as entered; ROUTE, the household route as the app runs it for
such a couple. Launched through the launcher with `PREDICTION=none` (`batch-couples-apart.sh`, the rehearsal's audit with `APART=1`), from a snapshot.

## The rule (D141's, as the rehearsal read R; `reduce-couples-any.mjs`, `APART=1`)

ROUTE against APP, the units together as one class:

1. NO HARM: no unit flagged by D34's harm rule, compared in whole paths;
2. A GAIN: the pooled survival change with its `95%` interval's lower end above nought, the interval by path;
3. SPENDING: the pooled spending delivered on the paths both keep, the units weighted equally, not lower than `-0.05%`.

Beside, deciding nothing: each unit's survival under both arms, the mean pot left (and capped at the estate cap), lifetime tax,
spending over all paths, the parts (the wrapper, four or five apart, who is the safer), and M1 by unit.

## What each outcome means

- PASSES (all three parts): the household route's reach at four and five apart, so far by inference, is measured on these
  couples; nothing changes.
- FAILS (any part): to the maintainer with its units, beside the ways on (keeping such couples off the household route until
  the household plan prices them, a change of default only on the maintainer's word; or leaving them on). Nothing changes
  without that word.

Box: a day, to land, run and read.
