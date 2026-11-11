# External review, 9 Nov 2026

Branch `claude/project-access-i58m0x` at f02e8741. Speed documents read from `review/external-2026-10-21`.
`d4-backup` was not fetched or opened, and no D4 result, partial or otherwise, was read or estimated.

**What to do about each finding is in `EXPERIMENTS-AND-PORTS.md`**: the experiment, its decision rule, the port if it
passes, the order, and the prompt to send the agent. This file is the findings and their evidence.

Everything I ran is EXPLORATORY (CHECKLIST 1). The runs of 9 Nov used seed 4242, which no registration names, mostly at
the diagnostic test's light settings (4 wealth points, lattice 48 x 9 x 32) and 300 paths. The runs of 10 Nov (the
engine against HMRC's order, the switch-off identity, the couples' planted fault) used the review's seeds 99001 and
99002. The scripts are beside this file. Tax rules were checked against GOV.UK and gov.scot on 9 Nov (sources at the end).

**Corrected on 10 Nov** (each was wrong or loose in the version of 9 Nov I sent the maintainer):
- 1.2 was called small. Under the plan's own rules it is not: the engine misses about £302,000 of tax over one
  library household's plan, and 24 of 237 households lose more than a point of survival when it is put right.
- 1.3's example was not the worst case. Interest of £20,000 alone is charged £1,486 where HMRC charges £286.
- 1.5's second bullet was overstated. A blank salary while working is read as "earnings unknown" on purpose, and a
  retired non-earner is capped correctly. What remains is narrower and is restated there.
- Review 3's "no change to the registration" was too strong. The registration says how D4 is launched, and running
  it any other way is a departure from that wording even though no stamp changes. The row now says who rules on it.
- Review 3's rented machine is withdrawn. The maintainer works only through cloud sessions, whose machines are a
  fixed size, so more cores now means more sessions, the units split between them. Item 1's first version, pushed
  earlier on 10 Nov, also compared two hosts by hashing whole arrays files. Those hold the seconds taken and the
  CPU's name, so the hashes would always have differed. The check now sets those aside, and runs on a preflight, not
  on a D4 chunk.
- Review 3 first advised finishing D4 faster. On the maintainer's question later on 10 Nov (is D4 still worth
  running at all?), the advice is to stop it unread and run it once on the code that ships. Review 3 now opens with
  that, and item 1 of `EXPERIMENTS-AND-PORTS.md` is how.

**Households I touched, for the held-out books.** `held-out.mjs` reads every id named under this folder, so this
commit marks them by itself.
- `couples-orders.json` lists 146 held-out library couples, D4's 20 first. Of the other 126 I solved S091 and ran the
  engine alone on S021 (altered) and S085 (the plan's rules, 40 paths). Those three are newly used.
- **One slip.** The engine's switch-off identity check of 10 Nov (`ident-off.mjs`, its first version) took eight
  households, and one was S301, the library plan D4's younger cohort re-ages as S301F. It ran the plan as entered on the
  engine alone, 200 paths of seed 4242, no solve, and printed only the count of differing paths (0). No survival figure
  for it was printed or read. D4's panel is frozen in `couples-orders.json` and no arm's code is involved, so D4 is
  not affected, but it should not have been in the list. The version committed here uses couples from the `touched`
  list instead and was re-run.
- Every other household was already used: the couples S127, S007, S187, S201, S053 and S261 are in a `touched` list;
  the singles S116, S054, S022, S224, S370, S126, S002, S380, S092, S208, S210 and S214 are in `phase4-orders.json`'s,
  and S030 and S188 were in Phase 4's own panel. `tax-library.mjs` runs the engine alone over the 237 households in the
  two `touched` lists and prints 17 of them by id.
- **On 11 Nov (2.4):** I solved the couples S007, S127, S303 and S391, and S303 again with each person retiring at
  52 and its target lowered (how the panel dresses a younger couple, done here to a couple that is not in the
  panel). S365 was solved once and set aside: it never survives, so it can show no path saved or lost. Item 12 also
  names S209, S261 and S313 for its experiment. All eight are in `couples-orders.json`'s frozen `touched` list, and
  `scripts/id-audit.mjs` on this folder still finds the same three newly used ids and S301, no more.
- No other D4 couple is named or was run. `scripts/d4exp.mjs` describes D4's couples from their plan inputs by place
  in the panel, without ids.
- **What the agent's scan prints on this folder as pushed** (`node research/solver/held-out.mjs`, at f02e8741): "118
  ids named, 4 not in touched() (269): S021, S085, S091, S261". S261 is in `couples-orders.json`'s frozen `touched`
  list but not in `touched()` today; I ran the engine alone on it (the plan's rules, 2,000 paths, `taxsize.mjs`).
  S301 was in `touched()` already, so naming it adds nothing. `held-out.test.mjs` passes on the pushed branch.

## The five things that matter

1. **The couples' solver breaks when the two people hold the money unevenly, and D4 cannot see it** (Review 4). Every
   one of the library's 210 couples holds its money 60/40 in every wrapper with a 3-year age gap, so all 40 of D4's
   couples do. On S091 at the product's 45 points, with the same household totals re-held 90/10, the couples' rollout
   went from 8.7 points above the app's rules to 32.3 points below them. A setting that already exists
   (`solveCouple`'s `share`, each table solved on that person's share of the spending) put it 10.7 points above. Two
   more couples at light settings did the same: 9 to 10 points below, then about 8 above.
2. **The engine does not stack a year's incomes as HMRC does** (Review 1). A worker's salary is left out of the
   income their interest, dividends, gains and pension draws are taxed on, and interest and dividends are taxed before
   the year's pension is drawn. A pension drawn from a partner who is still working is taxed as if they earned
   nothing: £72 charged where HMRC would take £5,172 in my example. Under the plan's own rules the engine misses
   £302,000 of tax over one library household's plan. Put right, 24 of 237 library households lose more than a point
   of survival (the worst 3.7), and 196 move by half a point or less. A test of 22 checks against an independent
   reference fails 10 on the branch; the prototype passes all but one, which it does not build.
3. **Four speed cuts, prototyped at 45 points** (Review 2). A couple's path runs 2.4 times faster with every
   path bit for bit the same, by ranking each person through the single chooser's shared scoring. A single's path
   runs 3 to 10 times faster on a shortlist of the moves the tables already stored, with no survival loss visible
   on 4,000 paths. And, added on 10 Nov, the solve itself runs about 7 times faster on one core (49 to 53 s against
   341 to 370) by scoring the whole menu at 828 of the year's 14,580 cells and a shortlist at the rest: 9 paths saved
   and 15 lost of 16,000 (-0.04 points, se 0.03). A household with years before pension access gets 3.3 times from
   that alone, and 5.8 with a thinner bridge reference. Added on 11 Nov: a couple's path runs a further 2 to 6
   times faster, again bit for bit, by valuing the joint move on flat arrays and each position once (2.4).
4. **D4 is better stopped unread and run once on the code that ships** (Review 3; advised on 10 Nov, on the
   maintainer's question). It is frozen on the engine with the tax defect of point 2. About 700 core-hours remain,
   where a whole re-run costs about 400 with the exact cut of point 3, and about 160 with a two-stage rule that keeps
   D34's error rates (simulated). Stopping unread keeps the 40 couples and the seed for it; the younger cohort has
   only 6 held-out couples beyond D4's 20.
5. **The published figures in the engine are right.** Bands (Scotland included), the allowance taper, the lump sum,
   the ISA allowance and CGT all matched by hand. The errors are in how incomes are stacked, not in the figures.

---

## Review 1: the engine's money rules against 2026/27 rules

### What matches

| Rule | Check | Result |
|---|---|---|
| rUK income tax | 8 incomes from £12,570 to £150,000 by hand | equal to the pound |
| Scottish income tax, 2026/27 bands (19% to £16,537, 20% to £29,526, 21% to £43,662, 42% to £75,000, 45% to £125,140, 48%) | 11 incomes by hand; bands against gov.scot | equal to the penny |
| Allowance taper | £110,000: allowance £7,570, 60% effective (67.5% in Scotland) | right |
| Tax-free lump sum | 25% of each draw, capped at £268,275 less what is used; the full-lump option is one setting for the whole solve (`lump: !!opts.lump`), so it cannot be taken twice | right |
| MPAA | starts with the first taxable pension income, not tax-free cash; £10,000 | right |
| ISA allowance | £20,000 shared by the re-wrap, the surplus sweep and the cash ISA; £12,000 cash ISA cap under 65 from April 2027 | right |
| CGT | £3,000 exempt, 18% and 24%, the UK basic band (£37,700) for a Scottish taxpayer, pro-rata basis | right |
| Dividends | £500 at 0%, 10.75 / 35.75 / 39.35%, UK bands | right |
| Non-earner's pension limit | £3,600 gross on headroom; Bed & SIPP relieved at 20% (D36's fix) | right |

### S116 this year, by hand (solved at the product's 45 points)

S116 is 61, retired, a Scottish taxpayer: pension £332,500, ISA £142,500, taxable account £47,500, cash ISA £427,500.

| The solved plan's year | Engine | By hand |
|---|---|---|
| Draw £16,760 from the pension | £4,190 tax-free, £12,570 taxable, tax £0 | the same: the taxable part fills the allowance exactly |
| Re-wrap the £16,760 into the ISA | within £20,000 | allowed |
| Spend £41,600 (80% of target) from cash | no tax | right: it is cash ISA money |
| Move the cash above six months' spending (about £360,000) into the taxable account | allowed, no tax now | allowed, but it leaves the ISA for good. A cash ISA can transfer to a stocks and shares ISA without using any allowance (finding 1.4) |
| Next year's dividends on that account, £8,489 | tax £0 | £859: the pension draw has already used the allowance (finding 1.2) |

### What the engine gets wrong, largest first

**1.1 A worker's salary is not in their income stack.** `taxable[owner]` starts from other incomes and the state
pension (App.jsx step 4). Salary is taxed separately inside `workingTakeHome`. So for anyone still working:

- interest and dividends are taxed as if the salary were nil. S214 (salary £142,500, taxable account about £1.1m):
  dividend tax £1,468 against £8,616, interest tax £0 against £1,721. S210 (salary £77,500): £0 against £2,991 and
  £0 against £938. That is £3,900 to £8,900 a year too little for each working year;
- gains are charged at 18% where a higher-rate earner pays 24% (from the code; not run);
- a pension drawn from a working partner past access age is taxed alone. My example (partner 61, salary £60,000,
  the household's spending drawn from their pension): £12,929 taxable, engine tax £72, HMRC £5,172. It also triggers
  the MPAA, which the engine only warns about. One of the engine's own tests pins this behaviour: `uktax.test.mjs` D2
  expects the plan's rules to draw a 58-year-old's pension beside their £70,000 salary and so trigger the MPAA.

Size under the plan's own rules, with the salary put at the bottom of the stack (`prototype/engine-hmrc.diff`,
`__STACK_SALARY` alone):
- 2,000 paths of seed 4242 (`taxsize.mjs`): survival falls 0.05 to 0.95 points on six working library households
  (S214 61.35% to 60.40%), and 3.65 points on the example couple;
- every household in the two `touched` lists, 1,000 paths of seed 99001 (`results/out-tax-library.txt`): mean -0.2
  points, worst -2.9, and 12 of 237 lose more than a point.

That is the picture's error before any solver looks for the cheap draw.

Moves it changes: the couples' joint move (the split, and each person's draw order) wherever one partner works past
58. Seven of D4's 20 library couples have a two-year window (the 11th to the 17th of the panel's library list,
`scripts/d4exp.mjs`); none of the 20 younger ones does. All three arms share the engine, so D4's comparison is touched
only at the margin, but the survival shown to any working household with a large taxable account is too high. Fix
before the couples' beta: add salary to the stack for interest, dividends, gains and draws.

**1.2 Interest and dividend tax is fixed before the year's pension is drawn.** Step 4a/4b tax them on the income known
then; the pension drawn afterwards is taxed on its own. HMRC sets the allowance against pension income first. So the
allowance, the starting-rate band and the basic band can each be used twice. This is the mispricing sitting under the
solver's favourite move (draw to the allowance and re-wrap). The engine's own comment at 4a names it: "a pension draw
later in the year can push it up a band, and that second-order shift is deliberately not chased".

It is not second-order for a household heavy in the taxable account. Each year's `taxPaid` on the expected path
against an independent reference on the same year's incomes (`tests/engine-hmrc.test.mjs`, section C; the plan's own
rules, the workers' saving switched off so the pay is the salary):

| Household | Years the row's tax differs from HMRC's by over £1 | Tax missed over the plan | Worst year |
|---|---|---|---|
| S116 as the library has it (Scottish, retired) | 20 of 36 | £423 (and £699 over-charged in other years) | 2032: £1,571 against £1,645 |
| S116 with its cash ISA held in the taxable account, the pension drawn to the allowance first | 16 of 36 | £5,950 | 2026: £0 against £968 |
| S210 (working, £77,500) | 41 of 41 | £33,146 | 2026: £0 against £4,021 |
| S214 (working, £142,500, 45% in the taxable account) | 41 of 41 | **£302,307** | 2035: £10,295 against £21,016 |
| The example couple (one drawing a pension beside a £60,000 salary) | 6 of 28 | £41,067 | 2029: £61,278 against £76,846 |

Across the 237 households of the two `touched` lists, the plan as entered, 1,000 paths of seed 99001, with 1.1 to 1.3
put right (`results/out-tax-library.txt`):
- survival changes by -0.3 points on average and 0 at the median; 196 households move by half a point or less;
- 24 lose more than a point, 2 more than 3 (the worst -3.7, S330), none more than 5, and none gains more than 0.1;
- the 47 with a quarter or more in the taxable account lose 0.9 on average, and the tax on their expected path rises
  by £65,727 a household (S214: £521,022 to £773,308);
- the 98 still working lose 0.6 on average, the 139 retired 0.2 (worst -2.6, S034), the 38 couples 0.2 (worst -1.7).

On a solved plan (45 points, solved once on the engine as it is, then run on the corrected engine without re-solving,
so a floor on a re-solved plan; 1,000 paths of seed 99001; `results/out-variants-*.txt`):

| | Solved plan's survival | Its tax on the expected path | Solved less the rules |
|---|---|---|---|
| S116 (retired, Scottish) | 90.4% to 89.8% | £60,813 to £66,293 | 48.7 to 48.1 points |
| S092 (retired, nearly half in the taxable account) | 86.5% to 86.1% | £35,109 to £42,174 | 41.1 to 41.4 |
| S210 (working, £77,500) | 99.9% to 99.9% | £57,320 to £71,859 | 2.9 to 3.8 |

So the solver's margin over the rules holds on these three; what moves is the level both are shown at.

Three smaller errors of the same family, all in the test:
- the £500 dividend allowance is placed from the other income upward, so it overlaps unused personal allowance
  (worth up to £53.75 a year);
- the basic band left for capital gains ignores the year's interest and dividends;
- the allowance's taper above £100,000 is applied to non-savings income alone, where HMRC tapers on all income
  (worth up to £5,028 a year; £105,753 over the plan on the test's fixture C7, a £95,000 pension in payment beside a
  large taxable account). The prototype does not fix this one; the reference does, so the port must.

**1.3 `savingsTax` over-taxes when other income is below the allowance.** The starting-rate band and the savings
allowance are placed from the other income upward, so they overlap the unused allowance instead of sitting above it.
£8,000 of other income and £9,000 of interest: engine £600, HMRC £0. £10,000 and £10,000: £800 against £286. The worst
on the test's grid is interest of £20,000 with no other income: £1,486 against £286. At most £2,514 a year (20% of the
allowance). It runs the opposite way to 1.2 and is why S116's plan as entered is £276 over.

**1.4 The solved plan's sweep takes cash out of a cash ISA and never says so.** Under a table, cash above the buffer
goes to the taxable account every year (step 7d), whether or not it sits in a cash ISA. On S116 that is about £360,000
in year 0, then taxed for life: about £12,000 of dividend tax and CGT over the plan on HMRC's order, against about
£3,000 on the plan as entered. A transfer to a stocks and shares ISA would pay none of the difference. 126 of the 420
library households hold over £50,000 in a cash ISA. The sweep is also not among the actions the pages show
(`SKIP_PARTS` is level, draw, harvest and the two tiers; no solver wording mentions cash). On S116 at light settings
it does not move survival (98.0% with and without, two paths differing) but lifts the mean end pot by 28%, so the
estate shown assumes an action the user is never told to take.

Prototyped (`__ISA_SWEEP`: the part of the swept cash that is cash ISA money goes to the stocks and shares ISA, the
rest to the taxable account as now). At 45 points, the plan solved once on the engine as it is and run on the engine
with 1.1 to 1.3 put right, 1,000 paths of seed 99001:

| | Sweep to the taxable account | Cash ISA money kept in an ISA |
|---|---|---|
| S116, solved plan | 89.8%; mean pot left £1,248,748; tax on the expected path £66,293 | 90.4%; £1,360,497 (+8.9%); £47,252 |
| S092, solved plan | 86.1%; £1,224,133; £42,174 | 85.9%; £1,235,170 (+0.9%); £37,539 |
| S210, solved plan (almost no cash ISA) | 99.9%; £4,383,997; £71,859 | 99.9%; £4,383,992; £71,854 |

The plan was not re-solved for it, and the ISA's money then follows the solver's chosen tier where the taxable
account's follows its fixed mix, so part of the gain in the pot is the investment and not the tax.

**1.5 Relief on money paid into a pension.**
- Money the plan routes into a pension from the household's own funds lands at face value, with no relief
  (`pots[x.id] += x.amount`, step 1). That covers the windfall split's pension-first variant (`autoSplitRoutes`
  variant 1: `pen1 = min(A, penRoom)`) and a transfer from the household's own accounts. A £3,600 deposit adds £3,600,
  where £2,880 paid in would add £3,600. The windfall factorial is next in the research queue and its pension-first
  split is under-priced by the missing 25% (more for a higher-rate payer). Fix first. A deposit the user types in as
  a one-off may be meant gross; that is a wording question for the input, not an engine error.
- Narrower than I first wrote: `grossUpNet` with a nil salary gives relief at the higher rate and the upper NIC
  rate (£2,880 net buys £4,966), but `wrapperHeadroomAtYear` reads a blank salary while still working as "earnings
  unknown" on purpose and caps a retired non-earner at the no-earnings limit correctly. What remains is one line: the
  savings split's own cap (`saveSplitRoutes`, App.jsx line 3368: `o.salary <= 0 && earnings <= 0` gives the full
  allowance) has no retired check, where `bedAndSippFor`'s has since D36. It matters only to the savings factorial.
- Not on the menu: a non-earner under 75 paying £2,880 for £3,600 each year. Worth up to £720 a person a year.

**1.6 Dated changes the engine does not carry.**
- Savings rates rise to 22 / 42 / 47% from April 2027; interest is taxed on the 20 / 40 / 45 ladder throughout.
- NIC relief on salary sacrifice is capped at the first £2,000 from April 2029; the engine gives it in full (28% on
  £10,000 sacrificed from £40,000, where it will be about 21.6%).
- Thresholds are frozen in cash to April 2031, and the lump sum allowance, the ISA allowance and the £3,600 limit have
  no indexation at all. The engine holds every one constant in real terms. From 2027/28 the full new State Pension
  exceeds the allowance. Small for a retiree (about £240 a person a year by 2031); larger for the 61-year horizons,
  where a lump sum allowance fixed in cash is worth about £145,000 of today's money in 25 years, not £268,275. This is
  an assumption to state, not a bug; the Config caption still says "2025/26 (frozen to April 2028)".

### Why no internal test sees these

`src/solver/model.js` repeats the engine's stacking line for line (its lines 304, 305, 337 and 346 to 348; `fast.js`
462 to 464), so the solver and the engine agree with each other and both differ from HMRC. The existing tax tests
(`tax-2026`, `scottax`, `savings-tax`) pin the published figures and each function alone on stated inputs; none pins a
whole year's stacking against a reference that is not the engine.

`tests/engine-hmrc.test.mjs` does: an independent reference of about 20 lines, 12 hand-worked years, the engine's
`savingsTax` and `dividendTax` over a grid, and every year's `taxPaid` on seven fixtures against the reference on that
row's own incomes. On the branch it prints 12 passed, 10 failed; on the prototype, 21 passed, 1 failed (C7, the taper
on all income, which the prototype does not build) (`results/out-engine-hmrc-branch.txt`, `-prototype.txt`).

---

## Review 2: the speed work

**Is it sound?** Yes, as far as reading shows. The exact cuts I read (S1 to S3, the E2 split, step P) each carry a
bit-for-bit identity check, and S1 to S3 and E2 a planted fault that fails it. I did not re-run those tests, and I did
not read E5 or E7 to E11 line by line.

Four cuts are prototyped below, in scratch copies (`prototype/shortlist.diff`, `prototype/couple-rank.diff`, since
10 Nov `prototype/solve-coarse.diff`, and since 11 Nov `prototype/couple-flat.diff` with `couple-approx.diff`). Each
is off unless switched on, and each is measured at the product's 45 points.

### 2.1 A single's path: score a shortlist, not all 800 moves (approximate; 3 to 10 times)

The chooser scores every move at the position each year: 97.8% of a solved path. The backward pass already stored its
best move at every cell (`pol`). The prototype scores, at the exact position as now, only the moves stored at the cells
around it in every world, and scores the whole menu if none of those is affordable. Three widths:

- **cells**: those moves for the tier pair held, and one spending level either way (6 to 9 moves a decision);
- **structure**: every spending level and tier pair of those moves' draw order and re-wrap (55 to 75 moves);
- **order**: every re-wrap too (175 to 215 moves).

Each household solved once at 45 points; the whole menu and each shortlist run on the same 1,000 paths. "Saved, lost"
are paths the shortlist survives and the whole menu does not, and the reverse. Spending is the change in spending
delivered, in points of target.

| | Whole menu | cells | structure | order |
|---|---|---|---|---|
| S116 | 55.1 ms a path, 88.9% | 5.4 ms, 10.3 times; 4 saved, 2 lost; +0.017 | 12.3 ms, 4.5 times; 2, 1; +0.005 | 26.1 ms, 2.1 times; 3, 1; -0.002 |
| S224 | 47.5 ms, 70.4% | 6.6 ms, 7.2 times; 6, 7; +0.001 | 15.2 ms, 3.1 times; 0, 1; +0.012 | 28.1 ms, 1.7 times; 0, 0; +0.006 |
| S188 | 46.8 ms, 69.7% | 5.7 ms, 8.2 times; 7, 9; -0.150 | 15.0 ms, 3.1 times; 2, 3; -0.079 | 27.6 ms, 1.7 times; 3, 4; +0.002 |
| S370 | 56.3 ms, 84.2% | 6.0 ms, 9.4 times; 3, 3; -0.064 | 17.9 ms, 3.1 times; 2, 0; -0.018 | 26.2 ms, 2.2 times; 1, 0; -0.023 |
| all four | | 20 saved, 21 lost of 4,000: -0.03 points (se 0.16) | 6 saved, 5 lost: +0.03 (se 0.08) | 7 saved, 5 lost |

Replayed decision by decision along the whole menu's own paths (2,100 to 2,700 decisions a household), **cells** gives
up more than 0.1 points of score at 0.5 to 1.1% of decisions and, on the two bridge households, more than 1 point at
0.04 to 0.07% (the worst single decision 10.2 points, S370). **structure** gives up more than 0.1 points at 0 to 0.5%.

**A check that removes the large misses.** Read the table's own value at the position; where the shortlist's best is
more than 0.5 points below it, score the whole menu. On S370, the hardest of the four, that scores the whole menu at
10% of decisions and leaves no decision giving up more than 0.3 points. Timed there: cells with the check 10.4 ms a
path (5.5 times; 1 saved, 2 lost), structure with it 22.0 ms (2.6 times; 1 saved, 0 lost).

What this shows and does not:
- No survival loss is visible at 4,000 paths for any width. That bounds it at about 0.3 points for cells and 0.15 for
  structure, not at the maintainer's 0.1%.
- cells delivers slightly less spending on the two bridge households (0.06 to 0.15 points of target).
- **It must be tested at 45 points.** At the light settings (4 points) cells loses 9 points of survival on S116, because
  the stored level and tiers are unreliable on a coarse grid. At 45 points the misses are in the draw order and re-wrap.
- To hold it to D65's bar: the eight households, 16,000 paired paths each (se about 0.09 points a household, 0.03
  pooled), survival and spending delivered, with the replay's counts beside them.

My recommendation: structure, or cells with the check, for the Strategy tab's paths and the research runs. Either takes
the headline's 2,000 paths from 17 to 31 seconds to roughly 4 to 8.

### 2.2 A couple's path: an exact cut of 2.4 times

A couple's solved path costs 540 to 1,806 ms in D4's pilot, about 15 times a single's. Profiled (S091, light settings):
78% of it is `rankFor` ranking each person's 800 moves with `scoreMoves`, the unshared scorer the speed review replaced
in the single chooser. Valuing the joint candidates is 16% and the model's step 1%.

`rankFor` can take the same scores from the single chooser's shared path (`chooseAction` leaves every move's score,
with the switch charged, in `_sc`). Prototyped:

| S091, 100 paths | A path as it is | Ranked by the shared scoring | Identity |
|---|---|---|---|
| 4 points | 573 ms | 238 ms (2.4 times) | every path's survival and pot left the same bit for bit |
| 45 points | 575 ms | 235 ms (2.4 times) | the same bit for bit |

Checked again on 10 Nov on a copy carrying exactly `prototype/couple-rank.diff` (S007 at 4 points, 100 paths of seed
99002): 478 ms to 192, every path the same bit for bit; with the patch's planted fault (`faststale`, the scores of the
decision before) all 100 paths differ (`results/out-couple-rank-identity.txt`). The patch's guard keeps the old path
for a locked dial position, for Richardson's second table and for a table without the exact final year.

This changes no number, so it is a port, not a trade. It applies to D5's screens and to every registered couples' run
after D4 (D4's code is frozen). With the structure shortlist on top the path was 141 ms at 45 points (4.1 times; no
path saved or lost of 100, the mean pot left 0.5% lower), which needs its own paired measurement on more paths.
2.4 has that measurement, made on 11 Nov: over 15,000 paths `structure` loses 0.16 points on couples.

### 2.3 The solve: the whole menu at the anchors, a shortlist everywhere else (approximate; about 7 times)

Added on 10 Nov, on the maintainer's "Ok, now focus on a faster solve. Aim for 5x faster."

The backward pass scores all 800 moves at every cell: 14,580 cells a year at 45 points, 36 to 46 years. But the moves
it stores are alike from cell to cell. On S116 at 45 points a cell's move is one of its two wealth neighbours' or its
own next year's at 94.5% of cell-layers, and at 94% to 99% along the other four axes
(`results/out-solve-coh-S116.txt`). Where it is neither, it usually differs in one thing alone: the spending level,
the tier, or the draw order or re-wrap.

The prototype (`prototype/solve-coarse.diff`, `opts.coarse`, off unless set) solves each year in two passes:

- **The anchors take the whole menu, as now.** An anchor is a cell on every 2nd wealth point, every 3rd pension-share
  and ISA-share point and every 2nd gain and allowance bucket, with each axis's last point: 828 of 14,580 cells.
- **Every other cell scores a shortlist.** It starts from the moves the anchors around it stored this year and the
  move the cell itself stored next year. Then, for three rounds, each tier layer's best move so far is widened by one
  step (every spending level, one tier step, one draw-order step, the same draw order's other re-wraps) and the new
  moves are scored. About 38 moves a cell, against 800.
- **A listed move is scored exactly as the whole menu scores it.** Only the choice is narrowed.

Each household solved at 45 points on one core, the whole menu and the setting, and both plans run by the engine on
the same 4,000 paths (`results/out-solve-final-*.txt`; the table is `scripts/solve-summ.py`'s, less S370's
reference times, which are in the text below). "Score lost" is the
tables' own score, in points, averaged over every cell, year and layer. S370 is the one household of the four with
years before pension access; its row is on the thinner bridge reference described below.

| | The solve as it is | The setting | Table score lost (average; worst cell) | Paths saved, lost | Spending delivered | Mean pot left |
|---|---|---|---|---|---|---|
| S116 | 341 s, 89.33% | 49 s, 6.91 times | 0.0036; 1.86 | 3, 5 of 4,000 (-0.05 points, se 0.07) | -0.006 points of target | 0.00% |
| S224 | 369 s, 70.33% | 53 s, 6.94 times | 0.0028; 0.58 | 1, 2 of 4,000 (-0.03 points, se 0.04) | -0.005 points of target | -0.09% |
| S188 | 370 s, 69.22% | 51 s, 7.21 times | 0.0041; 2.26 | 0, 2 of 4,000 (-0.05 points, se 0.04) | -0.005 points of target | +0.17% |
| S370 | 486 s, 84.30% | 84 s, 5.77 times | 0.0040; 1.32 | 5, 6 of 4,000 (-0.03 points, se 0.08) | -0.017 points of target | +0.02% |
| all | | | | 9 saved, 15 lost of 16,000: -0.037 points (se 0.031) | | |

On the bridge reference as it is, S370's solve is 146 s (3.34 times), with the same paths, spending and pot.

The table's times were taken with another job on the machine's second core. With nothing else running, S116's pair
was 337 s and 43 s: 7.9 times (`results/out-solve-split-S116.txt`).

**How it got there** (S116 and S370, 1,000 paths; `results/out-solve-45a-*.txt` to `45d`). "Score lost" is the tables'
own score, in points, averaged over every cell, year and layer.

| Step (the setting's word in the outputs) | S116: score lost, worst cell | S370: score lost, worst cell | What it showed |
|---|---|---|---|
| Every 4th wealth point, every 2nd share point; widened by one level and one tier step (`w4a2b2-NT-LR`) | 0.180, 83.7 | 0.211, 88.6 | Too coarse, and 211 moves a cell (every draw order) did not help |
| Every 2nd wealth point, every 3rd share point, every 2nd bucket; every level (`w2a3b3g2c2-NT-LRV`) | 0.014, 7.5 | 0.043, 7.5 | The misses are now in draw order and re-wrap. S370's pot left fell 5.0% |
| The same, widened by one draw-order step and the other re-wraps (`-LRVOH`) | 0.0029, 1.7 | 0.0065, 5.4 | Accurate, but 66 moves a cell: 4.5 times faster on S116 |
| The same, climbing from each layer's best for three rounds (`-LRVOH-h3`) | 0.0036, 1.9 | 0.0040, 1.3 | 38 moves a cell: 7.0 times faster on S116 |

Two things tried and dropped. A check that sent a cell back to the whole menu when its shortlist's best fell short of
what the anchors predicted: at the light settings it sent a third of the cells back and improved no table (that
run's output was not kept, and the check is not in the patch). And every 4th wealth point with the climb: 8.7 times
faster on S116, but single cells lost 11 to 13 points of score on both households.

**The bridge reference is the other half for a household with years before pension access.** S370's solve builds
it in 76 s, and the shortlist does not touch it: 146 s in all. A thinner lattice (80 by 21 by 64 in place of 160 by 41
by 128) builds in 14.5 s, which is the 84 s of the table. S370's 4,000 paths end exactly as on the full reference: the
same 5 saved and 6 lost, the same spending and pot. The tables move a little: the worst year-0 cell is 0.73 points off
the whole menu's, against 0.08 on the full reference. A far thinner lattice (48 by 9 by 32, the tests' own) built in
2 s and left the 1,000-path counts as they were (`results/out-solve-45d-S370.txt`). This is a second approximation,
measured on one household, so it gets its own arms in item 10.

**What must be exact, is** (`tests/solve-coarse.test.mjs`, 12 checks, `results/out-solve-coarse-test.txt`):
- every cell an anchor: the solve's tables bit for bit;
- every move listed: the solve's tables bit for bit, on S116 (3,919,104 values) and on S370 (5,007,744). The cell's
  arithmetic is a second copy of the whole menu's, and this is what holds the two together;
- the repeat-move rule on and off: bit for bit;
- split across two workers against one thread: bit for bit;
- each of the three plants parts the tables.

What this shows and does not:
- **No loss beyond noise on 16,000 paths, and a hint of a small one.** 9 saved, 15 lost: -0.04 points (se 0.03), and
  every household is slightly negative. A narrower choice cannot score better at a cell given the same tables ahead,
  so a real loss of a few hundredths of a point is the likely reading. That is inside D65's 0.1. Item 10's stage A
  (twelve households, 16,000 paths each) is sized to tell 0.1 from none.
- **One bridge household.** The thinner reference rests on S370 alone.
- **Not measured on four cores.** This machine has two. On those two, with nothing else running, S116's solve split
  across two workers took 26 s against the whole menu's 212 s (8.2 times), and on one thread 43 s against 337 (7.9
  times). Split and one thread gave the same 44,089,920 table values bit for bit, for the whole menu and for the
  setting (`results/out-solve-split-S116.txt`). So the second pass does not cost the split anything here. Gate 5 has
  to be measured again on the port.
- **A locked dial position is not covered.** Positions 3, 6 and 10 solve on the layer loop, and the prototype refuses
  to run there. Their base solve is faster; the locked solve is not. So a user at a position above 1 saves less
  than half the wait.
- **`solve()` is 45 bytes under V8's optimiser limit with the hooks in** (61,395 of 61,440; the branch has 924 to
  spare; `results/out-solve-size.txt`). All of the shortlist's code is in helpers at the file's end. The first
  prototype put a closure inside `solve()`, went 449 bytes over, and the whole solve ran three times slower (85 s
  against 28 at the light settings; not kept as a file).
- **Where the time goes now** (S116, 49 s). By proportion about 19 s is the anchors (5.7% of the whole menu's
  341 s), and most of the other 30 is the cells between them: 38 moves at 344,000 cell-years. Every 3rd wealth point
  takes S116 to 44 s (7.8 times) and S224 and S188 to 47 s, but it raises the table score lost on S370 (0.0074
  against 0.0040) and on S188 (0.0105 against 0.0041). It is not part of the setting.

My recommendation: measure it by item 10's rule and, if it passes, turn it on for the solve at the dial's first
position, with the thinner reference if that passes its own arms.

### 2.4 A couple's joint move on flat arrays (exact; 2 to 6 times), and what approximate cuts add

Added on 11 Nov, on the maintainer's "Prototype the couples path speed up first, again aim for 5x", and then "go
further still, still keeping cuts within noise but not necessarily exact."

**Where a couple's path went after 2.2.** With each person's moves ranked from the chooser's shared scores, the
time moved to the rollout's own valuing of each candidate. For every candidate (a split, each person's move, a
level) and every market node, `expectedValue` builds a rates object, copies the couple's state, builds each person's
state and vector as new objects, and reads each person's table twice at the same position. In a year before pension
access `shareBridge` does all of that about 22 times a node. Profiled at light settings
(`results/out-couple-prof-before-*.txt`, `out-couple-prof-after-*.txt`; S303@52 is S303 with each person retiring
at 52 and its target landed, which is how the panel's younger cohort is made from a library couple):

| Share of a path | S007, as it is | S007, flat | S303@52, as it is | S303@52, flat |
|---|---|---|---|---|
| Each person's ranking (the single chooser, twice) | 42% | 74% | 13% | 63% |
| Valuing the candidates | 44% | 6% | 76% | 19% |
| of which the bridge's search | none | none | 62% | 15% |
| The model's step for each candidate | 4% | 7% | 2% | 7% |
| A decision | 7.1 ms | 3.4 ms | 18.1 ms | 3.2 ms |

Two things made the valuing dear. Its bookkeeping: on S303@52, 12% of the path rebuilt each person's state as an
object, 16% built their vector as an array and copied it, and 6% copied the couple's state. And repetition: of the
25 to 27 candidates a decision, only 19% (S303) to 40% (S007) leave a position that was not already valued in that
same decision, because a split often changes nothing and two of a person's ranked moves often differ only in a
level the household does not take (`scripts/couple-same.mjs`, `results/out-couple-same-*.txt`).

**The exact cut** (`prototype/couple-flat.diff`, `COUPLE.flat`). The same sums in the same order on flat arrays; each
account's growth factors kept in a table; each person's table read once for survival and the cut ahead; a position
valued once a decision; a person's two best moves picked without sorting all 800. At 45 points, the path as it is on
the first 40 paths against the flat path on 3,000, two runs side by side on a two-core machine:

| At 45 points | Years | Years each person's table reads as before pension access | A path as it is | Flat | Faster |
|---|---|---|---|---|---|
| S007, retired | 28 | none | 158 ms | 80 ms | 2.0 times |
| S303, both working to 65 | 61 | none | 292 ms | 118 ms | 2.5 |
| S127 | 40 | 2 and 3 | 442 ms | 113 ms | 3.9 |
| S391 | 46 | 8 and 8 | 1,071 ms | 181 ms | 5.9 |
| S303@52 | 61 | 6 and 6 | 1,087 ms | 177 ms | 6.2 |

Every decision and every path is the same bit for bit (`results/out-couple-approx-45-*.txt`, each file's first two
lines; `out-couple-flat-45-*.txt` on a copy carrying exactly the patch; `out-couple-flat-test.txt`):
- on the copy with exactly the patch, none of 2,800 decisions (S007) and 6,100 (S303@52) differs over 100 paths, and
  with every position valued both ways none of 12,850 and 32,000 values does;
- on the five couples above, the first 40 paths are the same and none of 117,950 values valued both ways differs;
- each of three planted faults changes values and decisions, and the test passes its 9 checks in the exact model.

**The ratio depends on the machine's load.** The path as it is allocates far more, so it slows more when another job
shares the machine. The table was taken with one other job running. With two or three, S303@52 ran 7.8 times faster
(1,294 ms against 166). In two runs each with one other job, S007 ran 1.95 and 1.98 times faster and S127 3.9 and
3.7.

It changes no figure, so it is a port with an identity test (item 11), like 2.2. It is worth most where the path was
dearest: the couples with years before pension access, which are the couples that make the re-run's younger cohort
cost four times its library cohort.

**What is left is the single chooser.** After the cut, 63% to 74% of a couple's path is each person's own chooser,
the code a single's path runs once a year. Nothing exact is left in the rollout that is worth more than a few
percent, so going further means approximating, and almost all of what there is to win is in the ranking.

**The approximate cuts, each against the flat path on the same 3,000 paths a couple**
(`prototype/couple-approx.diff` with `shortlist.diff`; `scripts/couple-approx.mjs`; `results/out-couple-approx-45-*.txt`):

| Pooled over the five couples, 15,000 paths | Faster than the flat path | Faster than as it is | Paths saved, lost | Survival, points (se) | Spending delivered | Pot left |
|---|---|---|---|---|---|---|
| The joint options alone | 1.00 to 1.18 times | 2.0 to 7.0 | 13, 12 | +0.01 (0.03) | -0.02% | -0.01% |
| `order` in each person's ranking | 1.42 to 1.76 | 3.5 to 8.8 | 33, 42 | -0.06 (0.06) | -0.07% | -0.25% |
| `order` and the joint options | 1.90 to 2.14 | 4.0 to 12.7 | 36, 50 | -0.09 (0.06) | -0.09% | -0.26% |
| `structure` | 1.18 to 2.67 | 5.3 to 7.4 | 37, 61 | -0.16 (0.07) | -0.03% | +0.87% |
| `cells` with its check | 1.58 to 3.73 | 7.4 to 11.3 | 46, 56 | -0.07 (0.07) | -0.21% | +2.74% |

The joint options: one table read where the flat path makes two (`one`); the bridge's search on 5 points and 3
steps, not 9 and 10 (`thin4x3`); a pair with a second-ranked move tried only beside the first pair's best split
(`near`). `order`, `structure` and `cells` are item 7's shortlist widths, here in each person's ranking.

How to read it, against the rule the maintainer set for item 7 (survival's interval above -0.1 points, spending
within 0.05 points, the pot left within 0.5%):
- **The joint options alone are inside noise on every measure, and worth little:** nothing on a retired couple, 6%
  to 18% elsewhere. With `order` on they are worth 1.14 to 1.45 times, because the chooser no longer hides them.
- **`order` is the one width that passed on singles** (the agent's read of 11 Nov: 2.1 times, the pot left +0.1%).
  On couples it is 1.4 to 1.8 times, and it is not clearly inside noise. Every measure leans the wrong way: survival
  -0.06 points (the interval -0.17 to +0.05), spending -0.07%, the pot -0.25%. S127 loses 12 paths and saves 5.
  Spending is already past the rule's 0.05 (the table's figure is the change in the mean yearly spending delivered;
  the rule's is in points of target, which is nearly the same thing for plans that deliver about their target).
  Checking the shortlist's best move against the table's own value, as item 7 does for `cells`, does not help: on
  S127, `order` with the check at 0.5 or at 0.2 points loses 11 and 10 paths and saves 5 and 4
  (`results/out-couple-approx-45-S127-checked.txt`).
- **`structure` and `cells` failed on singles for the pot left, and fail on couples more plainly.** Under
  `structure` S127 loses 31 paths and saves 3. On S391 the pot left moves by +5.9% and +9.7%.
- **15,000 paths cannot pass any of them.** The pooled half-width is 0.11 to 0.13 points, wider than the rule's
  0.1. They can only show which are worth the proper experiment.

**Tried and dropped** (light settings, `results/out-couple-approx-light-S127.txt`): valuing every candidate in the
middle market world first and only the best four in every world (1.12 times, and 97 of 150 paths change, because
positions already valued are skipped anyway); and each person's first-ranked move only (1.16 times, 143 of 150
paths change: it is a change to what the rollout is, not a cut).

**Where that leaves the aim of 5 times.** The exact cut alone gives it on the couples that were dear (5.9 and 6.2
times) and not on the others (2.0 to 3.9). Everything measured, by couple, as it is against `order` with the joint
options: S007 158 ms to 40 (4.0 times), S303 292 to 62 (4.7), S127 442 to 57 (7.8), S391 1,071 to 84 (12.7),
S303@52 1,087 to 90 (12.1).

My recommendation: port the exact cut now (item 11). Port nothing else on this evidence. If a faster couple's path
is still wanted afterwards, item 12 is the experiment; I would expect `order` to be marginal on spending and would
not expect `structure` or `cells` to pass.

### 2.5 Not prototyped

- **D5 still has no time budget for a couple.** After 2.4, 2,000 paths is about 3 core-minutes for a retired
  28-year couple (80 ms a path) and about 6 for a couple with years before pension access (180 ms), before each
  person's skip costs. Before 2.4 it was 5 and 36.
- **Phone memory has never been measured on a phone.** The harness's desktop browser peaks at 755 MB for the default
  solve and 1.8 GB with a dial position (`results-phone-memory.txt`). D59 dropped the device run and D60 the Safari
  check. One solve on a real iPhone and a mid-range Android settles it.

---

## Review 3: does D4 have to run this way?

**The advice of 10 Nov: stop D4 now, unread, and run it once on the code that ships.**
- D4 is frozen at e09ac60, on the engine with 1.1 to 1.3's defect. Couples cannot go live before that is fixed, and
  the fix re-solves every table, so D4's read would be evidence about a predecessor of what ships.
- About 700 core-hours remain. With 2.2's exact cut a whole D4 is about 400 core-hours, and about 160 with the
  two-stage rule below. A whole re-run costs less than finishing.
- Nothing has been read, so the same 40 couples and seed 7021 serve the re-run. `couples-orders.json`'s younger order
  holds 26 couples and D4 has 20 of them: there is no second held-out panel of young couples.
- D4 cannot see 4.1's fault, and a pass could not turn couples on before the engine fix and 4.1's guard exist.

What is given up: an answer this week (the re-run reads about a week later, if the engine fix keeps to its time box),
the units finished so far, and about a day to register again. The case for letting it run is an early kill signal, if
the pilot left real doubt that couples gain at all. I have not read the pilot. The one library-like couple I ran at 45
points gained 8.7 points on 300 paths.

The table below is what was found before that advice. Its rows now apply to the re-run.

| Change | Saves | D4 now? |
|---|---|---|
| **More cores, by more cloud sessions.** The 520 units are independent, path i is the seed's path i wherever it runs, and a unit's stamp (code, audit, registration blob, Node version) holds neither the host nor the commit. A cloud session's machine is a fixed size (about 4 vCPUs), but every session has its own | about 745 core-hours remained at 56 of 520. Four more sessions finish it in about two days and eight in about one, at no charge for the machines, and the main session's cores come free. Each session still loses its units in flight at each 12-hour limit | **For the re-run, registered from the start.** Splitting the units between sessions takes one edit to `batch-couples.sh` (`D4_SHARD=i/n`, `prototype/d4-shard.diff`). At the launch commit e09ac60 the code hash, the audit hash and the smoke stamp are the same with it and without (`results/out-d4-shard.txt`). On D4 as launched it would be a departure from the registration, which says D4 is "launched only as" the batch from a worktree at the launch commit. In the re-run's registration it is part of the design. The steps are item 1, part 3, of `EXPERIMENTS-AND-PORTS.md` |
| **A two-stage rule.** (D4's registration records a different second stage, more paths for a comparison past D34's limit, as not chosen: D61. This one stops early, and is for the runs after D4.) After 5,000 paths a couple stops, unflagged, when its observed change against APP is +0.5 points or more; otherwise it runs to 19,000 and is read as now. 5,000 already covers every comparison against SHIPC (they size at 2,800 to 4,700) | simulated (`twostage.py`, 400,000 runs a case): a true 1-point loss is flagged 0.9647 of the time against 0.9648 with one stage at 9% discordance, and 0.9005 against 0.9010 at 12.45%; the quarter-point false alarm is unchanged at 0.050. A couple gaining 2 points or more uses 26% of the paths, one gaining 1 point 36%, one gaining nothing 90%. Singles gained 10.7 points in Phase 4 | No: new registration. The pooled items were already judged decisive at 8,000 |
| **Rank each person through the shared scoring** (Review 2.2) | the engine's 746 core-hours fall by the path's 2.4 times, with every number the same | No: D4's code is frozen. Every run after it |
| Reuse a couple's solve across its chunks | about 50 of the 73 solve core-hours (6%) | No: chunking is in the stamp |
| Checkpoint inside a chunk, or 16 short chunks once solves are shared | the 89 core-hours run again at window ends (11%) | No |
| The shortlist (Review 2.1) | a further 3 times or more on the engine's hours | No: it changes the solver, so the product takes it first |
| Variance reduction (control variates from the free APP arm, stratifying on APP's margin) | 20% from the survival indicator alone; perhaps 2 times from stratifying | No, and not worth building once the two-stage rule exists |

Together, for the registered runs after D4: the exact ranking cut and the two-stage rule take a D4-sized run from
about 835 core-hours to roughly 160, before any shortlist.

---

## Review 4: large gaps not yet investigated

### 4.1 Couples who hold their money unevenly

`solveCouple` gives each person a single's table for half the household's spending from their own pots, and the
rollout scores a joint move by the product of the two tables' survival (`expectedValue`: "both must last"). Pensions
never move between them; only accessible money is shared, and only in bridge years (PART-D.md D2.4 names both limits).
If one person cannot fund half alone, their table reads ruin everywhere, the product is near nil for every move, and
the rollout chooses blind.

S091 (61 and 58; the first retired, the second stopping at 60 with no salary entered), the target landed so the rules survive about 85%, 300 paths. The rules arm is the plan
with guardrails on, the 80% floor and the 5-year lookahead, as arm A sets them (without arm A's policy search):

| Who holds the money | Wealth points | Rules | Couples' rollout | Change |
|---|---|---|---|---|
| as the library has it, 60/40 | 45 | 85.3% | 94.0% | +8.7 (27 saved, 1 lost) |
| 90/10 | 45 | 85.3% | 53.0% | **-32.3** (0 saved, 97 lost) |
| 90/10, each table solved on that person's share of the spending (`share: 0.9`) | 45 | 85.3% | 96.0% | +10.7 (32 saved, 0 lost) |
| as the library has it, 60/40 | 4 | 85.3% | 89.3% | +4.0 (15 saved, 3 lost) |
| 90/10 | 4 | 85.3% | 68.3% | -17.0 (1 saved, 52 lost) |
| 90/10, `share: 0.9` | 4 | 85.3% | 89.7% | +4.3 (15 saved, 2 lost) |

Against the plan as entered (no guardrails, a weaker rules arm), at 4 points: 60/40 +11.3; one person holding all the
pension and the other everything else +13.3; one holding all the pension and the rest 60/40 +8.3; 90/10 -0.7. So it
is not which wrapper each person holds that matters, but whether each can fund half the spending alone.

Two more couples of other ages, each re-held 90/10, at 4 points (both already in the `touched` list):

| Couple | Rules | Rollout, each table on half the spending | Rollout, each table on that person's share of the pots |
|---|---|---|---|
| S127 (56 and 53, retired at 55, bridge years) | 85.3% | 75.0%: -10.3 (4 saved, 35 lost) | 93.0%: +7.7 (23 saved, 0 lost) |
| S007 (68 and 65, both retired) | 85.3% | 76.0%: -9.3 (1 saved, 29 lost) | 93.7%: +8.3 (25 saved, 0 lost) |

Limits: three couples, 300 paths each, and not arm A's policy search. The 60/40 control ran the same way at each
setting, so the 41-point swing at 45 points is the holding, not the setup. Only S091 was run at 45 points.

What I would do: (1) run this at 45 points on six couples re-held 75/25 and 90/10, and with one person much older;
(2) set `share` from each person's share of the household's pots, as the runs above did (`couple-share.mjs`, `SHARE=auto`),
or search a few values, since `audit-couples.mjs` never passes it. The state pensions and the ages are not in that rule
and should be; (3) keep couples on the app's rules under the switch where either person's share is far from half
until that has a registered test. D4's read still stands for couples like the library's. It says nothing about these.

Two limits on that advice, both carried into item 6 of `EXPERIMENTS-AND-PORTS.md`:
- D4 tests `share` at 0.5 on couples who hold 60/40. A rule that sets `share` from the pots would give those couples
  0.6, which D4 never ran. So the rule has to leave 0.5 in place wherever D4's evidence covers, and that makes a step
  in the rule at the edge of the band, which needs its own test.
- One person holding nothing at all was not run at 45 points. At light settings it behaves like 90/10: S007 with the
  first person holding everything, 300 paths of seed 99002, reads 65.0% against the rules' 85.3% (0 saved, 61 lost),
  and 91.0% (17 saved, 0 lost) with the first person's table on 0.95 of the spending (`results/out-share-all-one.txt`).

### 4.2 What the library never contains

All held-out evidence is drawn from 420 households built on seven age patterns. None has:

- any other income (no DB pension, annuity, rent or part-time work);
- a gain already in the taxable account;
- a state pension age other than 68 or a pension access age other than 58;
- a couple other than 60/40 with a 3-year gap.

I probed the first two on S116 (light settings, 300 paths, rules without guardrails). The solver's margin did not move:
+12.7 points as the library has it, +13.7 with a £15,000 DB pension, +13.3 with £30,000, +12.7 with half the taxable
account a gain. No warning sign, on one household. Worth a registered panel that includes them before the claim "no
harm to any household" is made for real users.

### 4.3 No upper bound

I did not build one. Nothing I read suggests the single's solver is far from optimal on households like the
library's; the gaps above are about households unlike it.

---

## Prototypes, scripts and raw output (beside this file)

- `prototype/`: `shortlist.diff` (solve.js: the shortlist, its check and its switches under `SHORT`), `couple-rank.diff`
  (couple.js: `COUPLE.fast` and its plant) and `engine-hmrc.diff` (App.jsx: `__STACK_SALARY`, `__HMRC_ORDER`,
  `__ISA_SWEEP`). Each applies to f02e8741 with `git apply` from the repository root, and each is off unless switched
  on. The engine patch changes the engine only, so the solver's model disagrees with it once a switch is on: it is for
  sizing, not for merging. `d4-shard.diff` (batch-couples.sh: `D4_SHARD`) is item 1's edit; it applies to D4's launch
  commit e09ac60 and to f02e8741, and does nothing unless `D4_SHARD` is set. `solve-coarse.diff` (solve.js:
  `opts.coarse`, Review 2.3) was written and measured on a tree without the other patches. It also applies on top of
  `shortlist.diff`, and `solve()` stays 45 bytes under V8's limit with both in; the two together were not run.
  `couple-flat.diff` (couple.js and grid.js: `COUPLE.flat`, Review 2.4, item 11) applies to 61e8778 and to 01825f2,
  not to f02e8741: it stands on item 2 as the agent ported it. `couple-approx.diff` (couple.js: `COUPLE_APPROX`,
  item 12) applies on top of `couple-flat.diff` and `shortlist.diff`, in that order.
- `tests/engine-hmrc.test.mjs`: the engine's year against an independent reference (Review 1).
- `tests/solve-coarse.test.mjs`: what must be exact about the solve on anchors and shortlists (Review 2.3).
- `tests/couple-flat.test.mjs`: a couple's joint move on flat arrays against the path as it was (Review 2.4).
- `scripts/`: `scripts/README.md` lists each script, its command and the output it gave. Each finds the repository
  from `REPO_ROOT` or from its own place in the tree; run `python3 research/build-engine.py` there first.
- `results/`: every run's output as printed. The 45-point uneven-couple lines (`out-share-S091.txt`) were recovered
  from the session's log, not written by the script to a file at the time.
- With every switch off, a copy carrying all three patches gives the branch's numbers bit for bit
  (`scripts/ident-off.mjs`; `results/out-ident-off.txt`: 1,760 paths, 0 differing; `out-ident-off-planted.txt`: its
  planted run fails).

## Sources

- [Scottish Income Tax 2026 to 2027, gov.scot](https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/pages/rates-and-bands-2026-to-2027/)
- [Budget 2025, Annex A: rates and allowances, GOV.UK](https://www.gov.uk/government/publications/budget-2025-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances)
- [Tax on savings interest: how much is tax-free, GOV.UK](https://www.gov.uk/apply-tax-free-interest-on-savings/how-much-is-tax-free)
- [Autumn Budget 2025, M&G technical summary](https://www.mandg.com/adviser/tech-matters/government/autumn-budget-2025) (the freeze to April 2031, savings rates from April 2027, the cash ISA limit, the salary sacrifice cap from April 2029)
