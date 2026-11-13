# Questions for the external review: items 3, 4 and 5 of the review of 9 Nov (10 Nov)

The maintainer passes these on (D66). The working branch is `claude/project-access-i58m0x`; the code for items 3, 4 and 5 is
built and tested in the working tree but not committed, because the pre-commit hook's fast tier fails on the pinned
figures below until the maintainer unlocks them. Item 3's code alone is in a scratch worktree (HEAD + item 3's diff), so
every figure below is attributed to the item that moves it. Questions 1 and 2 hold up items 3 and 4; questions 3 and 4 are
smaller and do not.

## 1. Item 4: case 6 fails, by the review's own step 1.2 (the STOP)

**What the review asks.** Step 1.2: "Every other route that adds to a pension from the household's own money: the staged
transfers (step 1.5) and any Auto deposit ... Each is relieved the same way, through one function shared with
`bedAndSippFor`." Case 6: "With no windfall split on the move, every figure is as before, bit for bit (S116 and S210 at
light settings)." And: "If case 6 fails: STOP; the change reached a path it should not have."

**What happened.** Built as step 1.2 says (`pensionRelief`, shared with `bedAndSippFor`: the room taken gross, the money
paying gross x 0.8, a higher-rate refund to cash), cases 1 to 5 pass as worked by hand, and the plant (no relief) fails all
five. Case 6 holds on S116 and fails on S210:

- S210's library plan has a £171,000 Auto deposit (an inheritance) in 2033. Its policy (Bracket Fill Basic, the default
  deposit order) routes it to the pension first, whose room that year is the £3,600 no-earnings limit. Before: £3,600 lands
  for £3,600 and £167,400 goes to the taxable account. Now: £3,600 lands for £2,880 and £168,120 goes on.
- That route is the whole of the move. S210's tables at light settings: item 3 alone `f43d4dfade269f0c`, items 3 to 5
  `cdd84a84415dbc56`. With the deposit removed, both `f9a4e63e00f6958e`; with it typed into the taxable account, both
  `c7785c6fc3ecdcb4`. S116, which has no deposit: `b954f145878ff460` both.
- S370 is the same case: a £432,000 Auto deposit in 2030, £3,600 into its pension now for £2,880 (£429,120 to the taxable
  account against £428,400). It is why speed-port's S370 identities move again (question 2).

So case 6 as written cannot hold together with step 1.2: the plan's own Auto routing into a pension is one of the routes
step 1.2 relieves, and two of the library's households take it.

**The choice.**
- **(a), the agent's recommendation:** keep step 1.2. Money a person pays into a pension is relieved at source whoever
  chose the wrapper. Case 6 restated: S116 bit for bit; S210 bit for bit with its deposit removed and with it typed into
  the taxable account; S210 as the library has it moving, its 2033 route checked to the pound (£3,600 for £2,880).
- **(b):** relieve only the windfall split's pension-first variant and the staged transfers; an Auto deposit the plan routes
  itself stays at face value. Case 6 holds as written; the plan's own route stays under-priced by a quarter, more for a
  higher-rate payer.

Under (a) item 4 changes figures for any user with an Auto deposit routed to a pension, so it waits for the beta's end with
item 3 (M2).

## 2. Item 3: the FAST tests whose pinned figures move (the unlock asked for)

Item 3 (the engine's year in HMRC's order) moves pinned figures in three FAST tests, which are protected; their edits need
the maintainer's unlock (D66). The evidence that each move is the defect's and nothing else: with no interest or dividends
in any year (cash interest untaxed, the dividend yield 0), the code before and item 3 give the same tables bit for bit on
S116, S370, S224 (working, with pay), S026, S090 and S040; the knock-on memo is exact (the same tables on and off, S116,
S370, S224, and its plant moving them).

**savings-tax.test.mjs B2 and B3** (the engine's year 1 of its fixture: a retired single, a £25,000 DB pension and the
£11,976 state pension, £200,000 of taxable cash earning £6,702.05, a pension drawn to fund £40,000):
- B2 pins the interest's tax to `P.savingsTax(otherTaxableSelf, interest)`, the interest above the DB and state pension
  alone: **£1,140.41**. In HMRC's order the interest sits above all the year's non-savings income, the draw's taxable
  £8,386.31 included: **£1,599.28**. Working: £36,976 + £8,386.31 = £45,362.31, less the £12,570 allowance, £32,792.31
  taxable; the interest runs to £39,494.36, past the £37,700 limit, so the savings allowance is £500: £500 at 0%, £4,407.69
  at 20% (£881.54), £1,794.36 at 40% (£717.74). The check becomes `P.savingsTax(otherTaxableSelf + taxablePensionSelf,
  interest)`.
- B3 pins the net drawdown rising by the whole savings tax. It now rises by **£1,140.41** (the interest's tax on the income
  before the draw), and the draw pays its own knock-on inside the gross-up: the gross draw rises by **£1,881.50** (£11,181.74
  against £9,300.24) and the year's tax by **£1,881.50** (£8,157.74 against £6,276.24: the extra pension's own tax, £1,411.13
  more taxable at 20%, £282.23, plus the £1,599.28). B3 becomes the net drawdown's rise against `P.savingsTax(otherTaxableSelf,
  interest)` within £1, and a new B3b the gross draw's rise against the tax's rise within £1. B4 passes unchanged (1.18).

**couple-quick.test.mjs check 5** ("a single's tables are the code before D1's, bit for bit", S116 at the library sweep's
light settings): `b12130607dc6ceb4` (the code before D1, b4ea006) becomes `b954f145878ff460`. S116 holds taxable cash and a
taxable account, so every year carries interest and dividends. Items 4 and 5 leave it.

**speed-port.test.mjs check 1** ("the option unset: the same as before the port"; the tables, the layers, the adaptive
reference and the engine's outcomes on 50 paths):

| arm | quick (4 points): old, then item 3 | --full (6 points): old, then item 3 |
|---|---|---|
| S224 SHIP | table 1e7cb1868f1e3ee8 -> bbe79a835b7e4f81, layer 0f2baf48de46bb59 -> 670835efe8724270, run f86a428710404f38 -> 30cb766b8871eaea | table 5dd89c0ef1bc4aad -> 8c6e1e51ba300ebf, layer 0a1db04e01ce4006 -> 24797c8c59f2d12d, run c909633f6c90da3c -> f9915342617f92de |
| S370 SHIP | table c818f491471a363f -> 5d1db7e3976d8539, layer 6e99a4198bd55789 -> a57025bfad98fa0f, run 9291e4b208bfc7f2 -> 7590b06881d951aa | table 1b6ec15444d9e032 -> c05ac829b37dd28d, layer cba22d0450f4cab9 -> 430ecadff067a9be, run 563d54ee2038647b -> fe29b7fdbe5408bc |
| S224 CAND | table b3aee4e120470d44 -> 12e3ee5548d3dbb4, layer 9c63773b72b98676 -> 4ff5a3b368123b4f, run 76a93a8197e10a36 -> e8021a9e5dc285cb | table 4268de771a289678 -> dd42b14c1fbc3e3a, layer 958f37834f7f4b76 -> f15212bef3432e43, run dc9e97f6bdb44afb -> badc7a1ae9ee4938 |
| S370 CAND | table b84ebf1d6c25052c -> e1e8d5665f5868b5, layer 2d1c886ece7e4b0f -> 08633d4b1ed6c481, run 8055e77b0a15da5a -> 23f06bbe4832b4d2; the reference 26a9868a554fdb23 unchanged | table a0b1792426a29d6e -> 05b6173d2e1bb06f, layer 68e88a44a93db1eb -> f61589710165f884, run ab382b36ee46175d -> 26fca04b1ecc49df; the reference 35b72dc2dc22750d unchanged |

Under question 1's (a), item 4's commit then moves S370's again (its Auto route): quick SHIP table 572feb4a3c0c129e, layer
219ee6ebe2370504, run 727a78e82d66f90a; quick CAND table e9852794d9c407ef, layer b8274efd10337928, reference
bf852694ed07cef1, run 68e2cee1fc7bee8a; full SHIP table 7bac7b3333a0d666, layer 7d42f25fd016b17d, run b0369498b5f5f0b1;
full CAND table 78aebbb838f596e3, layer 26f82baf4fa996fb, reference 54e184b7e46e15d4, run 9f1770179ada36d1. S224's stay.

**uktax.test.mjs D2 and D2b**, which the review expected to fail, pass unchanged: the port prices the pay at the bottom of
the stack but leaves the rules' decision to draw where it was. No unlock needed.

## 3. Three full-tier tests that compare with an old commit's code

`lock-tiers`, `windfall-split` and `save-split` each build the code from before their option (0223182, 82e4ad6, 574cb57) in
a temporary worktree, and their check 1 asks that the option unset gives that code's tables bit for bit. Item 3 moves their
households (each holds cash or a taxable account), and under question 1's (a) item 4 moves a household whose Auto deposit
the plan routes into a pension. These tests are not protected, but the change alters what check 1 means, so it is put here
first. The agent's proposal: check 1 runs both codes with cash interest untaxed and the dividend yield 0 (item 3 is then bit
for bit, as shown above), and with any Auto deposit typed into the taxable account (as S210's check above); the rest of
each test unchanged. Two other full-tier tests pin digests taken on older code (`couple-tables` check 6, `couple-lockstep`
check 3) and are re-taken on the round's code, each with its working in the results file.

## 4. Item 5's experiment: S116 is not among the four

Item 5 step 2 names "the four singles in `phase4-orders.json`'s `touched` list with the most money in a cash ISA ...;
S116 will be one". By the engine's sheltered cash at the start, five tie at £540,000 (S058, S118, S178, S238, S418) and S116
is seventh at £427,500. `ISA-SWEEP.md` (the rule, written before launch) takes the four by library order and adds S116 as a
thirteenth household, since its year-0 sweep is the review's own measurement; the pooled rule is over thirteen.

## Beside, for the record

- Item 3's solve time (step 2's rule: over 10% slower, tabulate the year's tax once a decision, then time again). Without the
  memo, S116 400 to 485 s and S370 556 to 664 s; with it, the same process alternating, S116 346.1 to 365.8 s (+5.7%) and
  S370 505.9 to 556.4 s (+10.0%).
- Item 3's sizing on the library (the plan's own rules, 237 households, 1,000 paths): mean -0.35 points, median 0, the worst
  S214 -3.70; 24 lose over a point, 6 over 3, none over 6: the step's STOP not met. The eight solved plans are running.
