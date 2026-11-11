# The external review's answers on item 7's extra pot and the estate cap, 11 Nov

The questions: `research/solver/ITEM7-POT.md` on `claude/project-access-i58m0x` (ab93f4e4), its evidence in
`results-speed-a.txt` and `results-item7-pot.txt`, and the fifth question from D72. Each answer is a recommendation.
The ruling is the maintainer's own message.

Everything here is EXPLORATORY and decides nothing. No result of D4 or of seed 7021 was read, printed or estimated,
and `d4-backup` was not opened.

**What I ran to answer them** (`scripts/chooser-tie.mjs`, `prototype/chooser-tie.diff` and `shortlist-slice.diff`,
`results/`; `README.md` says how to run and read them). Three of Phase 4's
eight as it landed them, S328F, S188 and S304F, each solved once at 45 points on the working branch's tables at
6331361 (the candidate d71f65ae871e, before D73's port), then run forward on 3,000 paths of seed 99004 with the
chooser changed and the tables left alone. Every arm is paired against the whole menu on the same paths. Its
`structure` arm reproduces the agent's figure on other paths: S328F's mean pot +4.01% here, +4.02% in SPEED-A.

## The answers in short

1. **The reading is right in kind and far too small in size.** The extra pot is not the shortlists' doing. It is the
   whole menu giving money away above the cap, and on S328F `structure` recovers about a sixth of it. With a
   tie-break on the whole menu, S328F's mean pot is 23% higher and its lifetime tax 48% lower, with survival,
   spending and the tiers held unchanged.
2. **Do not change the estate shape. Add a tie-break to the forward chooser, above the cap only.** `'soft'` is a
   change of preference: it lowers spending by 0.3 and 0.9 points on the two households I solved it on. A tie-break
   everywhere does harm below the cap. A tie-break only where wealth is already above the cap changes nothing below
   it, by construction, and takes the gain above it.
3. **Item 7: measure it again, in that same batch, against the whole menu with the tie-break.** The maintainer's
   point is right: more pot at the same survival, spending and risk is not a failure, and the rule's fourth part
   should only have counted a fall. But the extra pot was the baseline's waste, not the shortlist's merit. With the
   tie-break on both, `structure` is 1% to 3% *behind* above the cap. A small addition to the shortlist (the slice,
   section 3) brings it level, still 2.3 to 2.5 times faster than the whole menu. `cells` is dropped: on S188 it
   changes the tiers held.
4. **Order:** the tie-break's experiment as soon as D73's port is committed; its port either before the couples are
   landed or after the re-run's read, never between; no estate-shape change before the beta ends.
5. **The basic ceiling: yes,** it should stop where the year's whole taxable income reaches the higher-rate
   threshold. After the beta, with a sizing first.

## 1. Is the reading right?

**Yes: it is the objective's indifference above the cap, not an unfaithful shortlist.** The agent's own split already
shows it (`structure`'s extra pot is +0.13% on the paths below the cap and +0.02% as the solver scores it). It is
also an old finding, met three times:
- `solve.js`'s note on the estate shape (phase 6c): above the cap "the solver is INDIFFERENT and will trade the pot
  away for any gain at all". `'soft'` was built for it, and the cap "stays the default until gate 6c is judged".
- The archive's O97, the same thing seen on the allowance axis: "the loss sits on the tail, paths ending above the
  score's cap where the score weighs nothing".
- 5 Oct: a tie margin was probed, found not neutral, and "how should the solver choose when survival is assured"
  was left to the maintainer as a design question.

D64 (the largest pot, whatever it is in) makes it worth settling now.

**But "the shortlist lands on moves that leave more" understates it.** The shortlist is not where the money is. I
left the whole menu in place and changed only how it breaks near-ties: among the moves at the best move's spending
level and tier pair that score within 0.01 points of it, take the one that pays least tax this year. Only the draw
order and the re-wrap can change; the level and the risk cannot.

| S328F, 3,000 paths (54% end above its cap of £1.8m) | Mean pot left | As scored (capped) | Lifetime tax | Paths saved, lost | Spending, points of target | A re-wrap at |
|---|---|---|---|---|---|---|
| The whole menu as it is | £4,594,823 | £1,226,024 | £398,543 | | 101.71% | 54% of decisions |
| `structure` | +4.0% | +0.04% | -19% | 0, 1 | -0.001 | 53% |
| The whole menu, tie-break everywhere | +27.0% | -0.13% | -42% | 0, 0 | -0.023 | 20% |
| The whole menu, tie-break above the cap only | **+23.2%** | -0.05% | **-48%** | 0, 0 | 0.000 | 35% |

So on this household the whole menu re-wraps at more than half its decisions, and about half the tax it pays over
the plan buys nothing the objective values. The tiers held are the same in every row (1.835 on average, 1.840 at
most), so none of it is risk.

**What the stored arrays cannot show, and what I would have the next run store:**
- **Lifetime tax.** It is the clearest sign of the waste and SPEED-A did not keep it. `runPath` already returns it.
- **Which side is wrong.** A paired difference cannot say whether the shortlist is lucky or the whole menu is
  wasteful. Only changing the whole menu can, which is the table above.
- **That the same change does harm below the cap.** This is the part that matters for question 2:

| S188, 3,000 paths (26% end above its cap of £3.8m) | Mean pot left | As scored (capped) | On the paths below the cap | Lifetime tax | Paths saved, lost |
|---|---|---|---|---|---|
| `structure` | +0.14% | +0.08% | +0.39% | -3% | 2, 3 |
| The whole menu, tie-break everywhere, within 0.01 points | +0.85% | -0.69% | -0.90% | +15% | 3, 1 |
| The same, within 0.1 points | -2.32% | -1.18% | -1.93% | +19% | 5, 2 |
| The whole menu, tie-break above the cap only | +1.37% | 0.00% | 0.00% | -7% | 0, 0 |

Below the cap the tables do have a view, and it is worth more than it looks: with the estate weight at 0.02 of
opening wealth, 0.01 points of score is £4,750 of expected estate on S188. The re-wraps the whole menu chooses there
are tax planning that pays, and a tie-break that removes them raises lifetime tax by 15% to 19%. "Within the
chooser's tolerance" is therefore not safe as a general rule. It is safe where the tables are blind.

## 2. Should the objective change, and how?

| Option | What it did here | Verdict |
|---|---|---|
| `'soft'` (S328F and S188 solved again with it) | S328F: pot +7.7%, tax -60%, but spending -0.31 points. S188: pot +14.2%, spending **-0.87 points**, 6 paths lost and none saved (-0.20 points, se 0.08), tiers held 2.12 to 1.92 | **No.** It is not a tie-break. Once the lucky tail has value, a pound today is worth more as estate everywhere, and the solver takes fewer raises to keep it. That is a change of what the household is assumed to want |
| A higher cap | not run | No. It moves the cliff and has the same effect as `'soft'` below the new cap |
| `'logfloor'` | not run | A product choice tied to the estate slider. Not a repair |
| A tie-break within a tolerance, everywhere | S188: capped pot -0.7% to -1.2%, tax +15% to +19% | **No** |
| The chooser's existing `tieMargin` (any move within the margin) | spending -11.8 points on S328F, -15.5 on S188: it cuts the level | **No, and it should never be set.** The probe of 5 Oct had already found it not neutral (`results-probe-tailm.txt`: at a margin of 1e-10 the end pot moved by £6.2m a path on one household, and 8 paths were lost and 6 saved of 500 on another) |
| **A tie-break only where wealth is already above the cap,** kept to the best move's level and tier pair | S328F: pot +23.2%, tax -48%. S188: pot +1.4%, tax -7%. On both: no path saved or lost, spending 0.000, the capped pot -0.05% and 0.00%, the tiers the same | **Yes** |

**This is the agent's fourth option made exact in three places.**
- *"Within the chooser's tolerance"* has to mean within it **and at the best move's spending level and tier pair**.
  Without that the rule changes what the household spends or the risk it holds, which is what went wrong on 5 Oct
  and in the row above.
- *"No score change below the cap"* has to be a test of the household's wealth at that decision, not something read
  off the score. Below the cap near-ties are common and they are real (S188).
- *"Toward the larger pot"* has to be something the chooser can see. The tables hold only the capped estate, which
  is flat exactly where the rule is needed. What the chooser does see is this year's tax, and among moves at one
  level and tier pair the money that leaves the household this year differs only by that. So: the least tax this
  year, then the larger estate term, then the lower index.

**The margin matters, and 0.01 points is where it stops mattering.**

| The whole menu, tie-break above the cap, within | S328F: mean pot | S328F: its paths below the cap | S328F: lifetime tax | S304F: mean pot | S304F: lifetime tax |
|---|---|---|---|---|---|
| 0.0001 points (`tieC@1e-6`) | +6.8% | 0.00% | -39% | not run | not run |
| 0.001 points (`1e-5`) | +17.8% | -0.01% | -66% | +4.60% | -44% |
| 0.01 points (`1e-4`) | +23.2% | -0.21% | -48% | +4.66% | -42% |
| 0.1 points (`1e-3`) | +23.2% | -0.21% | -48% | not run | not run |

- Above the cap these moves are near-ties, not exact ties. The score separates them by up to 0.01 points and by
  nothing more (S188 too: the same at 0.01 and at 0.1).
- On S328F the smaller margin leaves a quarter of the gain behind and costs nothing below the cap. The larger takes
  all of it and costs the paths that end below the cap 0.2%. On S304F the two are the same. Both are arms of the
  experiment.
- Lifetime tax does not fall in step with the pot (-66% at the smaller margin, -48% at the larger). The rule looks
  one year ahead and a larger pot is taxed on more later, but I did not take that apart. The pot is what the rule
  is judged on, and lifetime tax is the check that it is not paying for it some other way.
- On all three households, at every margin: no path saved or lost, spending 0.000 points, the tiers held the same.

**Why forward only.** The tables are right where they have a view and flat where they do not. The rule acts only in
the flat part, so the tables need not change, the solve's time does not move, and gate 5 is not touched. A change
to the tables (the backward pass taking the same rule) would only matter if the forward rule left money behind, and
there is no sign of that yet.

**Its one known cost.** A household that is above the cap for a while and then falls back below it has skipped
re-wraps that would have paid. On S328F the paths that end below the cap are 0.21% lower. The capped pot over all
paths is 0.05% lower.

### Item 13. The chooser stops paying avoidable tax above the estate cap (an experiment, then a port)

**Stage A. The experiment (EXPLORATORY, seed 7002; on af001697ce1b's tables, as soon as D73's port is committed).**
- **Households:** SPEED-A's twelve, as it took them.
- **One solve a household** at 45 points, the candidate as ported. Then, on those tables, 16,000 paths each:
  1. the whole menu;
  2. the whole menu with the tie-break above the cap, within 0.001 points (`tieC@1e-5`);
  3. the same within 0.01 points (`tieC@1e-4`);
  4. `structure` with arm 3's tie-break and the slice (`structure+slice+tieC@1e-4`);
  5. `order` with the same;
  6. `structure` with arm 3's tie-break and no slice, to show the slice's part.

  Arms 4 to 6 are item 7's second read (section 3).
- **Stored for each path:** survival, spending delivered and target, the pot left, **and lifetime tax**.
- **The replay** (the first 100 paths): at each decision of arm 1's own path, arm 3's choice. Count the decisions
  that differ, and of those the ones at another level, at another tier pair, or with wealth at or below the cap.
  Then the same for arms 4 to 6 at each decision of arm 3's own path: the count at another tier pair is part 5 of
  section 3's rule.
- **First, the port's check against the review.** `scripts/chooser-tie.mjs S328F 45 3000` on a copy at 6331361 with
  the three patches (`README.md`) must print the review's lines (`results/out-chooser-tie-45-S328F-slice.txt`):
  `whole+tieC@1e-4` mean pot 23.19%, lifetime tax -48.38%, 0 saved, 0 lost; `structure+slice+tieC@1e-4` mean pot
  23.54%, 0 saved, 1 lost.
- **Size:** about 14 core-hours (three arms on the whole menu at 45 to 70 ms a path, three on a shortlist at 18 to
  40). No solve changes, so gate 5 is not run again; instead check once that the tables' digest is the same with
  the option on and off.

**The decision rule, committed before launch.** The tie-break passes if all hold, arm 3 against arm 1:
1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no household's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05 points of target, either way;
4. the pot as the solver scores it (capped) is not lower by more than 0.1% pooled, nor by more than 0.5% on any
   household;
5. no household's mean pot left is lower by more than 0.1%;
6. pooled lifetime tax is not higher;
7. in the replay, no differing decision is at another level, at another tier pair, or at or below the cap. One is a
   bug in the port: STOP.

Arm 2 is read the same way. If both pass, take arm 3 (the larger pot), unless the two pooled mean pots are within
0.5% of each other: then arm 2, the smaller margin.

**Outcomes.**
- **Passes:** to the maintainer, for a ruling naming the run. Then stage B.
- **Fails 1 to 3 or 6:** STOP and report. That would mean the rule reaches further than this review found.
- **Fails 4 or 5 on a household:** report that household's paths that were above the cap and ended below it. The
  remedy to measure next is a threshold above the cap (wealth above 1.25 times it).

**Stage B. The port (after the ruling).**
1. `solve.js`: the result carries `estateCap` (the cap where the shape is `'cap'`, null otherwise), on the mixture
   and each world.
2. `chooseAction`, after the best move is settled (the switch charge and margin applied): where `r.tieAboveCap > 0`,
   `r.estateCap` is set and the household's wealth is above it, take among the moves at the best move's level and
   tier pair, scoring within `tieAboveCap` of it, the one with the least tax this year; then the larger estate; then
   the lower index.
   - **Wealth** is the sum the estate term would take if the plan ended now. The prototype uses the three balances
     (`s[0] + s[1] + s[2]`), which is that sum only while `pensionDeathTaxRate` is 0 (D64). Use the terminal's own
     net, so a death tax set later does not make the test wrong.
   - **Do not find the cap from the estate term at a large sum,** as the prototype does. Under `'soft'` that gives
     about 28 times the cap, and the rule then fires almost nowhere. The last line of each `-above` file here is
     that, and is no result.
3. `tieAboveCap` at the margin the ruling names, in the candidate, a chooser setting. The candidate's hash
   changes; no table does.
4. Where it acts: every forward use of a single's chooser (the engine under a table, the expected path, the
   Strategy tab's paths). **Not** the couples' rollout: `rankFor` ranks from the scores the chooser leaves, and the
   only thing it takes from the chooser's returned move is a lock's tier pair, which the rule cannot change. So a
   couple's path should be the same with it on. The test checks that and does not assume it.
5. `research/tests/chooser-tie.test.mjs`: the option off, every path bit for bit; on, a household that never reaches
   its cap, bit for bit; on S328F, every differing decision at the best's level and tier pair, with no more tax that
   year, and above the cap; a couple's paths the same with it on. Plants: the level restriction dropped (spending
   falls); the cap test dropped (S188's capped pot falls).
6. The existing `tieMargin` stays off, with a line in its comment giving what it did here.
7. It moves the pot and lifetime tax a user is shown wherever a plan can reach four times its opening wealth. To
   `main` with item 3, after the beta.

**Time box:** half a day for stage A, half a day for stage B.

## 3. Item 7

**The maintainer's point, which I agree with.** I wrote the rule's fourth part as "within 0.5%", either way. Its
purpose was to catch a shortlist that loses money. More pot at the same survival, the same spending and the same
tiers is not that. The part should read "not lower by more than 0.5%", with a check that the tiers held are the
same.

**Same pattern searched,** over every decision rule in `2026-11-09/EXPERIMENTS-AND-PORTS.md` that names the pot.
Item 10's has the same two-sided part 4: its pot was inside 0.5% either way, so its read and D73 stand. Item 12's
(couples) had it too and is now one-sided. Item 5's was one-sided from the start ("not lower").

**But I would not rule `structure` in on this run.** Its extra pot is not the shortlist's merit, and the figure
reverses once the whole menu is fixed:

| Each against the whole menu as it is, 3,000 paths | S328F: mean pot | S328F: a path | S304F: mean pot | S304F: a path |
|---|---|---|---|---|
| The whole menu with the tie-break (within 0.01 points) | +23.2% | 65 ms | +4.66% | 54 ms |
| `structure` with it | +19.5% | 18 ms | +3.52% | 18 ms |
| `order` with it | +19.2% | 32 ms | not run | not run |
| `structure` with it **and the slice** | +23.5% | 26 ms | +4.64% | 23 ms |
| `order` with it and the slice | +23.2% | 41 ms | +4.64% | 38 ms |

- **A shortlist is too short for the tie-break.** It holds a few draw orders, and the tie-break picks among the
  moves at one spending level and tier pair. So `structure` leaves 3% of the pot behind on S328F and 1% on S304F,
  all of it above the cap (on the capped pot and on the paths below the cap it is level or ahead).
- **The slice fixes that** (`prototype/shortlist-slice.diff`). Above the cap, with the tie-break on, every move at
  the shortlist's chosen level and tier pair (40 moves) joins the list and the decision is made again. It acts at a
  quarter of decisions. `structure` with it is level with the whole menu on both households: the capped pot -0.02%
  and 0.00%, the paths below the cap +0.01% and +0.10%, no path saved and 0 or 1 lost, the tiers held the same
  (1.836 against 1.835, and 2.833 against 2.833).
- **It keeps most of the speed:** 2.3 to 2.5 times the whole menu's, against 3.0 to 3.6 without the slice. The
  prototype scores the shortlist twice where it slices. A port scores only the added moves.
- **The tables have changed too.** Item 7 ran on d71f65ae871e's. The candidate is now af001697ce1b, whose stored
  moves come from item 10's anchors and shortlists, and item 10's stage A already said a width that passed is run
  again on those tables before the two ship together.

**So item 7's second read is arms 4 to 6 of item 13's batch.** A width passes, against arm 3, if:
1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no household's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05 points of target;
4. the pooled mean pot left is not lower by more than 0.5%, and the capped pot not lower by more than 0.1%;
5. in the replay its tier pair differs from the whole menu's at under 1% of decisions.

More pot than arm 3 passes. If `structure` with the slice passes, item 7's stage B is ported with the slice in it:
where the tie-break is on and wealth is above the cap, the shortlist's best is found, then every move at its level
and tier pair not already listed is scored, and the choice is made over both.

"Read its pot check on the capped pot" would pass `structure` on this run (+0.02%), and that reading is fair to the
objective as it stands. It is not the reading D64 wants: the capped pot cannot see the 3% that is left behind.

**S188 under `cells`, and `cells` generally: drop it.** That household is where the shortlist changes the risk held
(68 tier changes in the replay; +3.71% on the paths below the cap, where the tables have a view). It delivers 0.19
points less spending there, with survival leaning down (-0.044, -0.094 to +0.005). S368 loses 18 paths and saves 1
(-0.106, wholly below nought). Its check against the table's own value does not see either. By the maintainer's
own test, more pot from more risk is not kept.

## 4. Order

1. **Now:** D73's port, and item 11 (`2026-11-09/EXPERIMENTS-AND-PORTS.md`), which is exact.
2. **Item 13's stage A as soon as that port is committed.** It needs af001697ce1b's tables and about 14
   core-hours, and it can share the machine with the couples' landing.
3. **The couples' re-run is not held for it.** Item 13 does not reach a couple's path (stage B, step 4). But its
   port edits `src/solver`, and the registration refuses any code but the landing's. So the port goes in **before
   the couples are landed, if its ruling has come by then, and otherwise after the re-run's read. Never between.**
4. **No change of estate shape before the beta ends,** and none on this evidence at all. If the maintainer wants
   money above the cap to count for something, that is a new question about what the household wants, with spending
   as its gate, registered, after the beta.
5. **To `main`:** item 13 with item 3, after 20 Nov. Both move figures a user sees.

## 5. The basic harvest ceiling (D72)

**Yes. The ceiling should stop where the year's whole taxable income reaches the higher-rate threshold, not where
the non-savings part of it does.**

Since item 3 the engine stacks interest and dividends above the pension draw, as HMRC does. `drawPension` still
tests its ceiling against pay and other non-savings income alone (`taxablePay + taxable`), so a harvest to the basic
ceiling fills the whole band and leaves every pound of interest and dividends above it. By hand, 2026/27, other
income £20,000 and interest £8,000:

| | The harvest's taxable part | Tax on it | Tax on the interest |
|---|---|---|---|
| To the threshold less the interest (£42,270) | £22,270 | £4,454 | £1,400 (£7,000 at 20% after the £1,000 allowance) |
| To the threshold (£50,270), as now | £30,270 | £6,054 | £3,000 (£7,500 at 40% after a £500 allowance) |

The last £8,000 of the harvest costs £1,600 on itself and £1,600 on the interest: 40%, not the 20% the move is
there to buy. That is why `optimize.test.mjs` H went from +£36,471 to -£3,822. The page already promises the fix:
its explainer says the two pension steps "are ceilings on TOTAL taxable income for the year, not on the pension
alone".

**The rule.**
- **The basic ceiling, and N4's ceilings above it:** the threshold less the year's interest and dividends.
- **The personal-allowance ceiling:** the largest draw that leaves the year's whole bill unchanged, never past the
  allowance. With little interest that is the allowance itself, as now (the starting rate and the savings allowance
  still cover the interest). With interest above about £6,000 it is less.
- It applies to every pension draw with a ceiling: the harvest, and the draw-order steps that stop at a band
  (`penPA`, `penBasic`).
- **Scotland:** savings income is taxed on the UK bands whatever the draw's own ceiling is, so the test for the
  interest is against the UK threshold. One hand case.
- The draw already has what it needs. Since item 3 `drawPension` passes the owner's interest and dividends for the
  year to `grossPensionNeededForNet` (`grossWithSavingsAbove`). Only the ceiling ignores them: the `T0 >= ceiling`
  test before the call, and the room inside it.
- Three places, kept in step: the engine's year (`App.jsx`), `model.js` and `fast.js`.
- **Same pattern searched:** every place a band is used as a draw's ceiling or as "room". The review found, in
  `App.jsx`: the harvest's `ceilOf`, the `penPA` and `penBasic` draw steps (four sites), `taxableRoom`, and the
  pages' own "of it free" figure. Each takes the same subtraction or a line saying why not.

**How to do it (after the beta; it changes the rules' figures and every table).**
1. Cases first, in `engine-hmrc.test.mjs`: the table above; the same with dividends; a personal-allowance harvest
   with interest of £3,000 (unchanged) and of £9,000 (stops £3,000 short).
2. The prediction, written before the run: `optimize.test.mjs` H's basic ceiling at death 90 gains again, by less
   than the old +£36,471, part of which was the engine's error.
3. A sizing as item 3's: the plan's own rules on the two `touched` lists, 1,000 paths. **STOP if any household's
   survival falls by more than 1 point:** a ceiling that only ever draws less cannot do that.
4. Then the review's eight solved at 45 points before and after, EXPLORATORY, read by SPEED-A's rule with the pot
   one-sided.

I did not prototype this.

## 6. What this changes in the review's own item 12 (couples)

The maintainer's point applies to my figures of this morning too, so I read them again
(`2026-11-09/REVIEW.md` 2.4, now corrected):
- **`structure` and `cells` on couples still fail, but on survival and spending, not on a higher pot.** S127 loses
  31 paths and saves 3 under `structure` (-0.93 points, -1.31 to -0.55) and 24 against 4 under `cells` (-0.67, -1.01
  to -0.32): each wholly below -0.3. `cells` delivers 0.21% less spending. I had also counted S391's pot (+5.9% and
  +9.7%) against them. That was wrong. It is probably this same effect, though I did not tally a couple's tiers, so
  I cannot say it is not risk.
- **The pot moves both ways on couples.** Under the same two widths S303@52's pot is 2.1% and 2.3% lower. A fall of
  that size does count.
- **`order` on couples is undecided, not failed.** Survival -0.06 points (-0.17 to +0.05), spending -0.07%, the pot
  -0.25%, for a path 1.4 to 1.8 times faster. Survival and spending are inside D65's example (a loss of 0.1% for a
  large saving is a win) and the pot is inside the rule's 0.5%. My rule's 0.05 for spending was tighter than D65.
  Item 12's experiment now says so, leaves that figure to the maintainer, makes the pot part one-sided and adds a
  tally of the tiers held.
- **A couple very probably has the same waste above the cap** (not measured): each person's ranked moves come
  from the same scores. It does not move A1 or A2 of the re-run (survival and spending). A tie-break in `rankFor` is
  its own small item after the re-run's read.

## 7. Also on this branch since 10 Nov, not yet sent to the agent

- **Item 11** (`2026-11-09/EXPERIMENTS-AND-PORTS.md`; `REVIEW.md` 2.4): a couple's joint move on flat arrays. Exact.
  A couple's path 2.0 to 6.2 times faster at 45 points, every decision bit for bit. Port it with D73's.
- **Item 12:** approximate cuts on a couple's path, measured, nothing proposed for porting.
- **`2026-11-09/ANSWERS-2026-11-11.md`:** how the couples' re-run should run. Since it was written D73 has ruled
  items 5 and 10 in, so what stands between now and the landing is D73's port and item 11. Its advice is unchanged:
  S1 reported, not deciding; SHIPC on the first 1,000 paths a unit; one session; about 60 core-hours, not 188.

## What is asked of the maintainer

| | The question | What I would do |
|---|---|---|
| M13 | Item 13's stage A now (the tie-break above the cap, on the twelve)? | Yes. About 14 core-hours, and on S328F the gain is a quarter of the pot and half the tax. |
| M14 | Item 7 read again in that batch (`structure` and `order` with the tie-break and the slice), its pot part one-sided, `cells` dropped? | Yes. `structure` is then level with the whole menu on the pot and 2.3 to 2.5 times faster. |
| M15 | Any change of estate shape? | No. `'soft'` costs spending. |
| M16 | The basic ceiling fixed as section 5, after the beta? | Yes. |
| M9 to M12 | From this morning (`2026-11-09/EXPERIMENTS-AND-PORTS.md`): item 11 in; S1 reported; the re-run on one session after the ports; item 12 | Yes, yes, yes, and item 12 only if `order` is ruled on and a faster couple's path is still wanted. |

## The prompt for the agent

It carries M9 to M11 and M13 to M16 as I would answer them. Change any line you rule differently before sending. It
replaces the prompt at the end of `2026-11-09/EXPERIMENTS-AND-PORTS.md`. It is written for a new session: its first
line sends the agent to its own state and handoff before the review.

```
This is a new session. On claude/project-access-i58m0x, read research/solver/STATE.md whole and
research/solver/HANDOFF-2026-11-11.md first.

Then read research/reviews/2026-11-11/ANSWERS.md, then item 11 of research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md,
REVIEW.md 2.4 and ANSWERS-2026-11-11.md, all on review/external-2026-10-21 at its head. Fetch that branch first.
Record each ruling as its own D-line.

1. Finish D73's port as the handoff's section 2 sets out.
2. Item 11 with it: the port by its steps and its test. It is exact: any value that differs is a STOP. Run the
   review's test on a scratch tree with the patch first (9 checks; --plants: each plant fails checks 1 and 2), then
   the seven couples' tests of its check 7 and the fast suite on the port. Report the identity counts, the planted
   failures and the two 45-point timings.
3. Item 13, stage A (ANSWERS.md section 2), as soon as the port is committed: EXPLORATORY, seed 7002, its rule
   committed first, the review's check on S328F reproduced first. Store lifetime tax for each path. Arms 4 to 6 are
   item 7's second read, by section 3's rule; cells is not run. Send me the read whole. Nothing is ported before my
   ruling.
4. No change of estate shape.
5. The couples' re-run stays held (D71) until the port and item 11 are in. Then, once: land the 40 couples again,
   run the pilot again, and revise couples-d4b.md as ANSWERS-2026-11-11.md sections 3 and 4 say (S1 reported, not
   deciding; SHIPC on the first 1,000 paths a unit, its per-couple flags dropped; item 11 named; one session). Send
   the revised registration to the design review. Do not launch until I say so. Item 13's port goes in before the
   landing if I have ruled by then, otherwise after the re-run's read, never between.
6. The basic harvest ceiling (section 5) and item 12 are not started. The ceiling waits for the end of the beta.
7. No registered couples' arm takes a shortlist, item 12's options or item 13's tie-break.

No result of D4 or of seed 7021 is read, printed or estimated, and d4-backup is not opened. Stop at each STOP the
documents name. Time boxes: three hours for item 11, half a day for item 13's stage A. When one runs out, stop and
report.
```
