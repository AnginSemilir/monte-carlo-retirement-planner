# Item 6's stage C: the registration, for the maintainer's word before launch (13 Nov, night)

**What it tests.** Whether the couples' solver, with each person's table solved on their own share of the pots
(`shareRule: 'pots'`), keeps couples who hold their money unevenly safer than the app's rules, with no harm; and, read apart,
whether the couples' solver harms a kind of household the library never holds: a DB pension, a gain already in the taxable
account, a state pension age of 67. Until it reads, a couple holding less than 40% or more than 60% of the pots with one
person keeps the app's rules (M4).

**The run.** Twelve held-out couples spread over the library's six age patterns, each re-held 75/25 and 90/10 and once with
one of the three features: 36 units, each tuned so the app's rules survive about 85%. Seed 7022, never used before (reserved
under D93). 19,000 paths a unit, about 61 core-hours, roughly 15 hours on four cores. The registration:
`registrations/couples-share.md`. Design review: the first FAILED on two counts (`reviews/2026-11-13-couples-share-design.md`), answered in one fix
(3cec591e); the second PASSED with four MINORs (`reviews/2026-11-13-couples-share-design-2.md`), each fixed before launch, the
launch stamp `audit 327661b4d2fc` on code 7002a1fec94c.

**What each outcome does.**
- A unit with a feature harmed: STOP, to you, whatever else reads.
- A re-held unit harmed: the guard stays for uneven couples; a new design is yours to rule on.
- No harm and the pooled gain clearly above nought: `shareRule: 'pots'` becomes the couples' default and the guard comes off
  for what was tested, couples whose elder holds more than 60% and at most 90%.
- No harm but the gain not clear: the guard stays; to you.

**Your three choices before launch.**
1. **Launch it.** The agent's recommendation: yes.
2. **The paths.** At 19,000 a unit, a true one-point loss is caught at least 90% of the time only where fewer than about one
   path in eight differs between the arms. On a near-neutral unit with more differing it is caught about 75% to 80% of the time
   (stage A had one such case). D61 accepted the same shortfall for the couples' re-run, but for that run alone. The
   alternative is 30,000 paths a unit, about 95 core-hours and a day on four cores. The agent's recommendation: 19,000, the
   shortfall named at the read for each unit it touches.
3. **The mirror.** The panel's uneven units are all the elder partner holding more (in every library couple the first
   person is three years older), so a pass lifts the guard only for those. Adding the same units with the younger partner
   holding more costs about 40 core-hours more. The agent's recommendation: run it as registered; add the mirror later only
   if a pass comes back and uneven couples where the younger holds more matter to you.

Nothing of seed 7022 has been read or run.
