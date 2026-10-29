# How the app explains the spending curve (Part C; D44 (2)): a draft for the maintainer

The external review of 29 Oct found the early cut sound (the price of the success rate) and the late raise a reward for good
markets (SPENDING-CURVE.md on review/external-2026-10-21 at 37fdbf7, section 10). The maintainer's requirement: for risky
plans, explain that spending will tend to fall below the target because survival comes first, unless the user turns up the
dislike-of-cuts dial, and that turning it up keeps spending closer to the target while the chance of running out rises.
This page is the wording, for Phases 8 and 9 (the Config and Strategy tabs). Words in [brackets] are the plan's own
figures, computed by the app for each plan; nothing here is a research result.

## 1. The headline: a safe starting spend

Always shown at the top of the Strategy tab, in place of a single "you can spend" figure.

> **Your safe starting spend: [£24,000] a year**
> That is [80%] of your [£30,000] target. On a typical run of the markets you are back at your full target by [2032]
> ([6] years in).
>
> Chance your money lasts: **[97%]**

- "A typical run of the markets" is the plan's median path: the first year its spending reaches the target. If the median
  path never gets back, the second sentence becomes: "On a typical run of the markets you stay below your target; see why
  below."
- Where the first year is at the target, the card reads "Your safe starting spend: [£30,000] a year, your full target."

## 2. The explanation, when the plan starts below the target

Shown under the headline whenever the recommended first year is below the target (the maintainer's trigger), in one of
two lengths (the proposed refinement, below).

**The full explanation** (the plan stays below target for more than [3] years on a typical run, or never gets back):

> **Why your plan starts below your target**
> Your target is high for what you have saved, so the plan puts not running out first. It spends less in the early years,
> when a bad run in the markets would do the most damage, and moves back up as your savings allow. Expect to spend below
> your target for a while; if markets are kind, you will get back to it sooner.
>
> If steady spending matters more to you than the last few points of safety, turn up **How much do you dislike cuts?**
> in Settings. Your spending will stay closer to your target, and your chance of running out will rise. The two figures
> move together as you change it, so you can see the trade before you choose.

**The short note** (back at target within [3] years on a typical run):

> The plan starts a little below your target for the first [two] years, to protect you against a bad start in the markets.

**The proposed trigger, for the maintainer's choice.** "Below target in the first year" alone will show the full text on
most retired plans the panel has seen: the candidate started every household retired at the start at the floor
(SPENDING-CURVE.md section 10, question 1), though each was landed to be a stretch (the app's rules surviving about 85%, D35). The length of the dip is what separates a brief
precaution from a plan whose target is high for its savings. So: the short note when the typical path is back at target
within three years, the full explanation when it takes longer or never gets back. The threshold is a placeholder for the
maintainer; the full text could also key on the plan's own chance of lasting at its full target (below 85%, the threshold
the 'auto' risk rule already uses, D16).

## 3. The dial, in Settings

> **How much do you dislike cuts?**
> Low: protect against running out, even if spending dips for a while. High: keep spending steadier, accepting a higher
> chance of running out. [Today's setting is the default.]
>
> At this setting: start at [£24,000] ([80%] of target), back at target by [2032]; chance your money lasts [97%].

The live line under the dial is the headline's figures re-solved at the dial's setting (Phase 10's quick dials re-solve).
The dial's settings beyond today's wait on the test of the candidate's own lambda at three and ten times (D44 (1)).

## 4. The late raise: what good markets would allow

Not in the headline. Shown on the fan of outcomes, on the upper band:

> **If markets do well,** you could spend up to [10%] above your target from about [age 75].

- The [10%] is the menu's cap (raises to 110% of target, D43 (2)); the age is the first year the fan's upper quartile path
  spends above target.
- In the year-by-year table the raise shows as "up to [£33,000] if markets have done well", never as the plan's expected
  spend.

## Open for the maintainer

1. The trigger: the first year below target alone (as asked), or the length of the dip (proposed), or the chance of lasting
   at the full target.
2. The three-year threshold between the short note and the full explanation.
3. Whether the headline also shows the chance of lasting at the full target from day one beside the safe starting spend's
   (it makes the trade explicit, but it is a second success rate to explain).
