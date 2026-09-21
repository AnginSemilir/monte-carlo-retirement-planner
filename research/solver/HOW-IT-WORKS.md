# How the solver works, and why

*A plain-language companion to PLAN.md. No maths beyond arithmetic.*

## 1. The problem with rules

Everything the app does today to answer "what should I do" is a rule written in advance. "Draw from
cash, then the GIA, then the ISA, then the pension." "Fill the basic-rate band from the pension every
year." "Cut spending 10% when the withdrawal rate drifts too high." The app is good at testing these
rules: it runs thousands of possible futures through each one and tells you which rule survived most
often. The tournament and the policy search are contests between pre-written rules.

The weakness is that a rule gives the same answer whatever has happened. A household that has had
five good years and is now comfortably ahead should probably behave differently from the same
household after five bad years. The right amount to draw from the pension this year depends on how
big the pension is now, how big the ISA is now, how many years are left, and what costs are coming.
A fixed rule cannot look at all of that; it can only follow its recipe. The evolver we built was a
smarter way to search for the best recipe, and it found that the best recipe is only a fraction of a
point better than the ones we already had. That told us something important: the rules are not the
problem. Rigidity is.

The solver replaces the recipe with a lookup. For every year of the plan and every position the
household could be in, it has already worked out the best move. When the year comes, it looks at
where you actually are and reads off the answer.

## 2. The core idea: work backwards

It would be impossible to work out the best move for this year by thinking forwards, because the best
move this year depends on what you will do in every later year, which depends on what happens in the
markets, which you do not know. The trick is to start at the end.

Take the final year of the plan, say age 95. Whatever position you are in at 95, the best move is
obvious: pay the year's spending from whichever pot costs least in tax, and whatever is left is the
bequest. There is no future to worry about. So for every possible position at 95 we can write down two
numbers: whether the year can be paid (yes or no), and what is left.

Now step back to 94. For any position at 94, and any move you might make, the markets will then do
something over the year, landing you in some position at 95. You do not know which, but you know the
range of things markets do and roughly how likely each is. So for each move you can ask: across the
possible market outcomes, how often does this move land me in a 95 position that can be paid, and
what is left on average? The move with the best answer is the best move at 94, and its answer becomes
the number we write down for that position at 94.

Then 93, using the 94 table. Then 92. All the way back to today. At every step, the table for the
following year already holds the answer to "what is the best that can happen from there", so the
question "what is the best move now" only ever needs a one-year look ahead. That is the whole method.
It is called backward induction, or dynamic programming, and it is how chess engines, airline pricing
and hydroelectric dams are all run.

Two things are worth noticing. It is not cheating: no decision ever uses knowledge of what the markets
actually did afterwards, only the range of what they might do. And it is exact, in the sense that no
better plan exists for the model it is solved on. Every rule we have ever written is a special case of
something the table could contain.

## 3. What counts as "position", and why

The table has a row for every position the household could be in. Choosing what goes into "position"
is the most important design decision, because every extra thing multiplies the table's size.

**What is in it, per person:**

- **Pension balance.** Obviously.
- **ISA balance.** Obviously.
- **The taxable side**, meaning the GIA and any cash above the emergency buffer, as one number. They
  are both taxable-when-you-touch-them money that grows outside a shelter. Keeping them separate
  would double the table for very little.
- **How much of the GIA is unrealised gain**, in three rough bands. Selling from the GIA costs
  capital gains tax only on the gain, so a GIA that is mostly gain is a different thing from one that
  is mostly what you paid in.
- **How much of the pension is still uncrystallised**, in three bands. Each time you draw from a
  pension you take a quarter tax-free, until a cap. Whether that quarter is still available changes
  the cost of a draw.
- **Whether the MPAA has been triggered.** Once you take taxable money from a pension, the amount you
  can pay in falls to £10,000 a year. A solver that did not know this would happily draw the pension
  while still contributing and walk into the penalty.
- **Age**, which is the year of the plan.

**What is deliberately not in it:**

- **Cash inside the buffer.** The buffer is a fixed rule, months of spending held back, and the
  solver just obeys it. Holding more cash than that is never the best use of money in this model, so
  there is nothing to decide.
- **Known costs, the State Pension, other incomes, planned gifts.** These depend only on the year, not
  on what happened in the markets, so they are simply part of "what this year looks like" and cost no
  table space at all. This is also why the lookahead rule we built last week becomes unnecessary: the
  solver at age 65 already knows there is a £300,000 cost at 70 because the year-70 table was built
  with it in.
- **The spending target.** It is a setting, not something that changes with the markets. It is
  planned as an extra dimension later so the quick dials stay instant (section 9).
- **The guardrail multiplier.** The solver is asked to survive at the full spend. If you switch
  guardrails on, the projection still applies them on top; the solver just does not plan around them.

## 4. Why only a handful of moves need considering

A move is "how much to pay into or draw from each pot". In principle that is a continuous choice, and a
table cannot hold infinitely many options. The escape is that UK tax is made of straight lines with
corners, and the corners are the only places a best move can sit.

Think about drawing from a pension in retirement. The first £12,570 of income is free. The next
£37,700 costs 20p in the pound. Beyond that 40p, then 45p. If it is worth drawing a pound at 20p, it is
worth drawing the next pound at 20p too, because nothing changes between them. So you either stop at
the start of the band or go to the end of it. Stopping halfway is never better than one of the two
ends. That means the pension move each year is one of about five: draw nothing, draw up to the
allowance, draw to the basic-rate limit, draw to the higher-rate limit, or draw whatever the year needs.
The same reasoning gives two choices for the GIA (sell up to the capital gains exemption or not), two
for re-wrapping surplus into the ISA (do it or not), and in working years four for pension
contributions (none, up to basic relief, up to higher relief, up to the annual allowance), with the ISA
taking the rest. Paying into the GIA while there is ISA room left is always worse, so it is never
offered.

There is one honest caveat. The tax is straight lines, but the value of money in a pot is not quite:
having a little more in the ISA is worth slightly more or less depending on how full it is. So a point
halfway along a band can occasionally beat both ends. The plan adds one midpoint per band to catch
this. That takes the pension move to about nine choices instead of five, still tiny.

Put together, a retired person has roughly twenty possible moves a year and a working person about
eighty. Compare that with the evolver, which had to search a space of millions of rule combinations,
and you can see why an exact answer becomes affordable.

## 5. Handling uncertainty without thousands of paths

The Monte Carlo runs a thousand futures because it is measuring a rule over the whole range of what
might happen. The solver needs something different: at each step it needs the average outcome of a
move across next year's possible returns, and it needs that average for every position and every move.
A thousand samples per position per move would be absurd.

Instead it uses a standard trick from numerical maths. The range of next year's market return is
summarised by five representative values with weights: a very bad year, a bad year, an average year, a
good year and a very good year, weighted so that their average and spread match the real distribution.
Five outcomes stand in for the whole bell curve, and the average over those five is close enough to the
average over infinitely many that the difference does not matter for a survival rate.

All the risky wrappers move together with one market, scaled by how much equity each risk tier holds,
which is what the engine already assumes. The extra uncertainty the engine adds about what the average
return will turn out to be over a lifetime is folded in by making the five values a little more spread
out. The solver never sees a persistent good or bad world; it simply expects fatter tails.

## 6. Making it fast enough to run while you type

Even with a small set of moves, a table with three pots at twenty sizes each, a few buckets, forty-five
years and five market outcomes is tens of millions of calculations. That is seconds in a browser, not
milliseconds, and the following tricks are what get it to seconds.

- **Skip the positions whose answer is already known.** If you have enough that you could pay every
  remaining year even with zero growth and the worst possible tax, you will survive, full stop. If you
  cannot pay next year, you will not. Both boundaries can be found quickly, and only the positions in
  between need solving. For most households that band is a fraction of the table.
- **Skip the positions you can never reach.** A quick forward run from today's balances shows the range
  of wealth you could plausibly have at each age. Positions far outside that range, ten times your
  current wealth or a hundredth of it, are not solved. The range is padded generously, and after the
  solve the policy is run forward once to check it never wandered out.
- **Do the averaging once, not once per move.** Several different moves can leave you in the same
  position before the markets act. Averaging over the five market outcomes is done for each of those
  "after the move" positions once, and every move that leads there shares it.
- **Use the neighbours.** The best pension ceiling for someone with £400,000 in the pension is never
  lower than for someone with £390,000. So when solving the £400,000 position, the scan of moves
  starts from the £390,000 answer instead of from the beginning.
- **Only re-solve what changed.** Because each year's table depends only on later years, editing
  today's balances changes nothing in the tables: the answer for your new position is already there.
  Editing the spend target or adding a cost at 70 re-solves from the affected year backwards, not the
  whole thing.
- **Store it compactly and interpolate.** Twenty sizes per pot on a logarithmic scale, with positions
  between grid points read by interpolation. Survival probabilities are interpolated in a way that keeps
  the sharp edge between "makes it" and "doesn't", rather than smearing it.

The target is a solve in under four seconds on a laptop and under ten on a phone, running in a
background worker so the page never freezes, with a progress bar.

## 7. Keeping it honest

A solver that is exact for a simplified model is only as good as the simplification. The plan builds
three separate checks against that.

**The reduced model is tested against the real engine first.** Before any solving happens, the
simplified one-year step is run under the existing named policies and compared, year by year, with the
engine's own projection on the same household. Balances must agree within a small tolerance and the
failure year must match. Any difference must be traceable to one of the deliberate simplifications
listed in section 3, not to a bug. If this test cannot be passed, nothing further is built.

**The table only chooses; the real engine executes.** When the solved policy runs in the app, it is
not the simplified model that runs. Each year the engine looks up the recommended move and then carries
it out with all of its own machinery: exact tax, MPAA, carry-forward, capital gains basis, the audit
row. So every figure you see, the survival rate, the fan chart, the historical backtest, comes from the
same engine as today. If the simplification made the solver overconfident, that shows up as a lower
score here, which is exactly where it should show.

**It is scored on futures it never saw.** The solver is built against one set of random futures and
scored against a different set, the way the evolver was. A method that had learned to exploit the
particular sample it was solved on would be caught. And it is run through the historical sequences,
which the model did not generate at all.

Only then does it face the current pipeline, on the same households, with the same scoring, and it
has to win by a clear margin with no household left worse off. If it cannot, the app does not change.

## 8. Couples

Income tax is charged per person, so who draws what matters: filling both partners' basic-rate bands
is far cheaper than filling one partner's higher-rate band. The clean way to handle two people would be
one table with both people's pots in it, but that multiplies the table by itself and takes minutes.

The plan does something cheaper that is guaranteed not to be worse than its starting point. Each
partner gets a single-person table solved against their share of the household's spending, with the
share itself as a choice (all from one partner, three-quarters, half, and so on). Then, for each year's
actual decision, the app tries each candidate joint move by stepping the real engine forward one year
from the exact position and reading both partners' tables for where that lands. It picks the best.
This one-step look-ahead with the tables as the judge is called rollout, and there is a theorem that
says a rollout policy is never worse than the tables it rolls out from. It costs a few dozen engine
steps per decision, which is the kind of work the app already does for a tournament.

If the couple test shows this falls short, the fallback is the full joint table at a coarser grid,
solved in the background in a minute or two.

## 9. Two things added once the core works

**The risk tier as a move.** Today each wrapper's risk tier is set once and held forever. The solver
can be allowed to choose each year between the tier you set and one or two more cautious ones. A
household comfortably ahead can stop taking risk it no longer needs; one close to the edge with many
years left may need to keep it; one close to the edge with few years left should stop gambling. This
is what a good adviser does at a review, and no rule in the app does it now. It never goes above the
tier you chose, and it adds no table space, only a few more moves.

**The spending target as a dimension.** The quick dials on the projection let you drag the spend and
see the survival rate move instantly. Under the solver, a new spend target would mean a new solve,
which is seconds. Putting eight spend levels into the table up front, from 60% to 130% of your target,
keeps the dials instant, and as a bonus the safe spend, the safe retirement age and the whole
age-against-spend grid become reads from the table rather than the long searches they are today.

## 10. What you will actually see

- **Two plans, side by side.** Your plan, meaning your contributions as entered and a plain draw order,
  and the solved plan. Survival, typical and unlucky-tenth pot, lifetime tax, bequest after death tax,
  and the difference on each.
- **This year's actions, per person.** Short, in the same words the instruction sheet uses now: pay
  this much into the pension and this much into the ISA; draw the pension to the basic-rate limit and
  re-wrap the surplus; move the ISA down one tier. Next to each, what skipping it would cost in survival,
  read from the table.
- **A rule of thumb.** The table is thousands of entries, which nobody can follow. So the app fits a
  short set of if-then rules to it, three or four levels deep, and prints those as the instruction sheet,
  together with an honest figure: "following these rules instead of the full table costs 0.4 points".
- **What may it change.** A short panel of locks: contributions you cannot alter, a pension you will not
  touch before a certain age, a ceiling on risk per wrapper, whether the lump sum is on the table. The
  solver only ever chooses among the moves you allow.
- **Come back next year.** Because the right move depends on where you are, the plan is an annual
  review. Enter this year's real balances and it re-solves in seconds.

Config loses the things the solver now decides: the draw policy, the drawdown strategy, the harvest
switch, the lookahead. It keeps the assumptions about the world: returns, tax region, inflation, the
cash buffer, guardrails as an optional spending rule. Prioritisation stays, and matters more, because
it is now the objective the solver optimises for, and switching between the presets is instant.

## 11. What it will not do yet, and why

- **Decide to cut spending.** That needs a view on how much a 10% cut hurts against a 1% better
  chance of never running out. That is a judgement about you, not about tax, and it needs a utility
  function. Guardrails stay as the flexible-spending rule until that phase.
- **Decide when to give money away.** A gift's inheritance-tax effect depends on how long ago it was
  made, which is a seven-year clock that would have to be part of "position". A later phase.
- **Choose your retirement age**, price an annuity, or account for mortality. All possible, all left
  out on purpose so the first version answers the question the app already asks.
- **Learn from experience that the world is bad.** The engine's returns have a persistent element, and
  a solver could carry a belief about it. Five years of returns barely move that belief, so the gain
  would be tiny for five times the table. Left out.

## 12. Why this is worth doing

The tournament and the policy search cost the app a great deal of computation to compare a handful
of recipes, and the evolver showed that better recipes are not out there to be found. What is out there
is the gap between any recipe and a decision that looks at where you actually are. The solver closes
that gap exactly, on a simplified model, and then proves itself on the real one. If it wins, the app
gets a single, explainable, state-aware plan and sheds most of its decision machinery. If it does not
win, we will know that too, by the same test that judged everything else, and the app stays as it is.

## Added since the first experiment

**The grid now measures total wealth, not each pot.** Whether the money lasts turns almost entirely on
how many years of spending the household has in total; how it is split between wrappers changes the
tax bill, not the outcome. So the table has one fine axis along total wealth (40 points) and two coarse
ones for the split (6 each): 1,440 positions instead of 8,000, six times faster, and the table's number
went from ten points too optimistic to honest within a few. Every loss shrank and no win was lost.

**Three tax gaps closed in the engine.** Cash Savings now earns its nominal rate and the interest is
taxed as savings income above the starting rate and the personal savings allowance. Other Investments
is assumed to pay a dividend yield (2% a year, a Config setting) out of its return, taxed above the
dividend allowance at the dividend rates. Both are costs the year has to fund, so they show on the
audit row and in lifetime tax.

**A Cash ISA wrapper that is one pot underneath.** A cash ISA and taxable cash are the same asset with
one difference, the tax on the interest. The person enters a Cash ISA row; inside the projection it is
merged with Cash Savings and the sheltered part is tracked. Money drawn comes out of taxable cash first,
and each year whatever ISA allowance the S&S subscription leaves shelters more of the taxable cash, up to
the cash ISA cap (the under-65 cap from 2027 is dated config). This "you will act logically" assumption
is what lets the two stay one pot, which keeps the solver's grid to three dimensions. The library now
splits every household's cash none, half or all into the ISA so the tax has households to bite on.

**Spending that responds to the pot (Part D, the pilot).** The household names a target, a floor
(80% of it in the pilot) and how sure it wants to be of never going below the floor. The solver gets
the trims as moves (spend 90%, spend the floor) and a penalty on trimming; the penalty is turned up
until the plan just meets the confidence on a set of search paths, so it trims as little as it can
while keeping the promise. Against Guyton-Klinger guardrails asked to keep the same promise, on 41
households, it delivered the full target in 92% of retired years against 52%, changed the spend level
twice a run against 26 times, and ended with more money. The guardrails' one advantage was the raises:
they spend above the target after good years and the solver did not, so its total spending delivered
was a little lower and its end pot larger.

**Raises after a good run (2d.4).** So a raise is now a move too (spend 110% or 120%), with a small,
bounded credit for spending above the target that grows more slowly the bigger the raise. The value
table already knows what a smaller pot next year costs in survival and bequest, so a raise is taken
only where the credit beats that cost; a rule of thumb cannot make that comparison. The credit's
weight is a preference, like the bequest weight: at the smallest weight tried the solver raised more
often than the guardrails, delivered more spending in the median run and in the unlucky tenth, with a
quarter of the whipsaw, and still landed the floor. Turned up too far the credit fights the floor and
the landing fails, so it stays small.

**The risk tier as a move (Phase 6).** Each year the pension's and the ISA's tier is part of the move:
the tier set on Plan Inputs, or one or two below it, never above. Switching funds inside those wrappers
is free and leaves nothing to remember, so the table gains no dimension, only more moves; and because
the year's draws and tax do not depend on what the funds hold, a move's tier variants share its
arithmetic and differ only in growth. The two wrappers step down together by default: every pair of
tiers was tried and scored the same to four places at more than twice the cost. The GIA keeps its
tier, because a switch there realises gain and the cost of the next switch depends on the last, which
the table cannot remember. What it does with the freedom: a lean household near the edge de-risks for
most of its retirement and its survival rises several points; a comfortable one de-risks the years it
no longer needs the return. A tier change is not free: the slice that moves is sold and bought, so
a quarter of a percent of that slice (about a tenth of a percent each way for the spread and dealing,
and a day or two out of the market) is charged to the wrapper the year it changes. That cut the
flipping by a third; a realistic cost is too small to do more. So a change is also made only when it
is worth noticing: the table's gain from switching has to beat a tenth of a survival point, or the
household stays where it is. With both, the household changes tier about twice in a retirement and
pays about £3k to do it, and the survival gain is intact (+4.9 points against +5.0 with free
switching). Both this and the raises are presets, off unless the person turns them on, because each
trades bequest for spending or survival.

**The check the real engine failed, and the fix (Phase 3).** A solved table now drives the real
engine as its policy, and on the 41 households the engine scored the solver four points below what
the solver's own model had forecast. The cause: the engine draws the long-run mean's error once per
future and holds it, and the solver's model had folded that into each year's noise, which understates
how far a held error spreads a thirty-year outcome. The repair is not a fold but a mixture: solve five
tables, each in a world where the held error takes one of five values chosen to stand in for the bell
curve, and choose each move by the weighted average of their scores. The engine and the forecast now
agree to a sixth of a point on average and within a point on 39 of 41 households, with nothing tuned by
hand; the price is five solves, which run in parallel. It changed the forecasts, not the moves.

**What is still fixed, on purpose.** Mortality, annuities and market regimes stay out by design.

**The risk term is a shortfall, not a step.** The table's downside term used to be "the chance of
ending with at least what you started with", a step that rewards a gamble right at the line. It is now
the expected shortfall below that line, which is smooth. It changed no decision; it removes the
incentive. The weights were then tuned on the households the experiment never sees and the pair in
use, (0.5, 0.02), was confirmed.
