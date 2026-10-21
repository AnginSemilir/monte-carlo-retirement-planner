# DRAFT, not registered: the dislike-of-cuts reference (O15), for the maintainer's decision

**DECIDED 25 Sep 20:31 UK (the maintainer: "Approve lambda 0.025 as the research reference"):** option (A), c = 0.001,
lambda 0.025 at exponent 2, as the RESEARCH reference. It is not solvePlan's default: that waits for K6 on held-out paths,
as recommended below.

**Status:** drafted 25 Sep, around 10:15 UK, during 7e's build gaps. The O15 gate asks for "a reference proposed with its
evidence". This is a proposal read from existing files, not a test.

**Source of every figure:** `results-o15-grid.txt`. That is `reduce-k5.mjs` run with `DETAIL=2` over K5 stage 1's
per-path records. It sits behind the fair-test gate twice:
- each cell against the guardrails' target, as stage 1 was read;
- each cell against the next, with row 20 (the dislike of cuts) as the thing tested. Checklist 3 applies because this is
  a new pairing of old files.

Both of the mode's own planted checks were shown failing on a planted fault before it was read:
- a flipped survival sign;
- a lost path counted as gained.

## What the dial is

The solver's score for a plan is:

- the chance the money lasts (a probability, 0 to 1);
- minus λ·(1 − level)² for each year spent below target;
- plus the estate term and the raise credit.

Write c = λ·0.2². c is **the cost of one year at the floor** (80% of target), in the same units as survival. So:

| c | λ at exponent 2 | the solver accepts one more year at the floor (on average across futures) if it buys at least | a year at 90% for |
|---|---|---|---|
| 0.0003 | 0.0075 | 0.03 points of survival | 0.0075 points |
| **0.001** | **0.025** | **0.1 points** | **0.025 points** |
| 0.003 | 0.075 | 0.3 points | 0.075 points |
| 0.03 | 0.75 | 3 points | 0.75 points |

**Today there is no default:** `solvePlan` refuses to run without one.

Recent tests held each household at an older value:
- M14b, O19 and 7h used each household's landed λ: 0.1 to 2, which is c 0.004 to 0.08.
  - Five of M14b's twelve were at λ 2 (c 0.08), above the whole of K5's grid.
  - So were two of O19's six and two of 7h's four.
- 7c, 7i and 7j used S126's λ of 0.0224 (c 0.00089).

## What the files show

The settings: exponent 2 (the fixed trim curve), K5's twelve households, on K5 stage 1's settings (see "What this does
not cover").

**Survival above the guardrails-with-floor (points):**

| household (guardrails' survival) | c 0.0001 | 0.0003 | **0.001** | 0.003 | 0.01 | 0.03 |
|---|---|---|---|---|---|---|
| S070 (78.2) | 12.6 | 12.5 | **12.2** | 10.7 | 8.2 | 2.9 |
| S184 (85.0) | 11.2 | 11.1 | **11.0** | 10.7 | 9.6 | 7.6 |
| S330 (80.5) | 7.4 | 7.4 | **7.5** | 6.9 | 5.5 | 2.4 |
| S354 (84.1) | 7.2 | 7.2 | **7.2** | 7.0 | 6.0 | 3.8 |
| the other eight (96.4 to 100.0) | -0.0 to 3.2 | 0.0 to 3.2 | **-0.0 to 3.2** | 0.0 to 3.1 | 0.0 to 3.0 | 0.0 to 2.8 |

**The survival change from each c to the next, paired on the same 3,000 paths.** Each cell is the change ± se
(paths gained / paths lost). "Beyond two se" follows the whole-count rule (net² > 4 × discordant).

| household | 0.0003 → 0.001 | 0.001 → 0.003 | 0.003 → 0.01 | 0.01 → 0.03 |
|---|---|---|---|---|
| S070 | **-0.30 ± 0.11 (1/10)** | **-1.50 ± 0.24 (4/49)** | **-2.47 ± 0.32 (8/82)** | **-5.27 ± 0.43 (5/163)** |
| S184 | -0.17 ± 0.11 (3/8) | -0.23 ± 0.13 (4/11) | **-1.10 ± 0.21 (4/37)** | **-2.03 ± 0.28 (6/67)** |
| S330 | +0.03 ± 0.14 (9/8) | **-0.57 ± 0.17 (5/22)** | **-1.40 ± 0.26 (10/52)** | **-3.07 ± 0.33 (4/96)** |
| S354 | -0.03 ± 0.10 (4/5) | -0.20 ± 0.17 (10/16) | **-0.93 ± 0.21 (6/34)** | **-2.20 ± 0.29 (6/72)** |

Bold is beyond two se.

The 0.0001 → 0.0003 step is not in the table: all four thin households are within two se there. It is in the results
file.

**The comfortable eight** stay within two se at every step, with three exceptions beyond it:
- S100, 0.001 → 0.003: +0.17 ± 0.07 (5/0). This one gains from the higher c.
- S252 and S390, 0.01 → 0.03: each -0.17 ± 0.07 (0/5).

Four more steps sit exactly on the line (net² = 4 × discordant), each a change of 0.13 ± 0.07, signed by its counts:
- S206, 0.0003 → 0.001 (0/4);
- S252, 0.003 → 0.01 (0/4);
- S390, 0.003 → 0.01 (4/0);
- S162, 0.01 → 0.03 (0/4).

**So the thin households' survival has a knee at c ≈ 0.001:**
- Below it, the steps change little: S070 -0.30 is the only step beyond two se. S206's is on the line.
- Above it, every step costs survival, and the cost grows with each step.

**How cut depth moves with c:**
- At c 0.0003 and below, every cut goes to the floor: the depth, meaning the mean level in years below target, is 0.800 to 0.803.
- At 0.001 the depth is 0.81 to 0.84.
- At 0.003 it is 0.845 to 0.908. That is about the guardrails' own depth, 0.859 to 0.925 on these twelve.

**How spending moves with c.** Spending delivered rises a little with c on every household, because the solver cuts
less. Gate 4's unlucky-tenth measure (the mean level on the path at the tenth percentile) moves most. On S330, for
example:

| c | S330's unlucky tenth against the guardrails' |
|---|---|
| 0.0001 | -2.3% |
| 0.0003 | -1.6% |
| **0.001** | **+0.5%** |
| 0.003 | +2.3% |
| 0.03 | +12.4% |

At **c 0.001 the unlucky tenth is at or above the guardrails' on all twelve**. The lowest are:
- S070, +0.3%;
- S330, +0.5%.

On the median path, the lowest is S070 at -0.7%.

At c 0.0003, three households are below the guardrails on the unlucky tenth:
- S070, -0.6%;
- S330, -1.6%;
- S354, -0.1%.

**Gate 4's conditions 2 and 3 pass on these twelve at every c**, as stage 1 found. So they do not choose between the
values.

## Recommendation: c = 0.001 (λ = 0.025 at exponent 2)

- **Survival.** It gives the most survival the grid offers the thin households:
  - within 0.43 points of the grid's best on every household. The largest gap is S070's: 12.2 against 12.6 at c 0.0001,
    -0.43 paired over the two steps.
  - one step up costs S070 1.50 points and S330 0.57 points (beyond two se);
  - every step after that costs all four thin households more.
- **Spending.** It is the lowest c at which no household's unlucky tenth spends less than the guardrails'. The margins
  are thin, though: S070 +0.3% and S330 +0.5%, with no se computed. They were read on the same seed-7002 paths that
  chose c, so they are not evidence until K6 reports them on other paths.
- **Continuity.** It is where 7c, 7i and 7j already ran: S126's λ 0.0224 is c 0.00089.
- **In a user's words:** "the planner will cut you to your floor for a year if that buys about a tenth of a point more
  chance that the money lasts."

**The alternatives:**

- **(B) c = 0.003 (λ 0.075).** The solver cuts as deep as the guardrails do. It costs S070 1.50 ± 0.24 points and S330
  0.57 ± 0.17 points against (A). S100 gains 0.17 ± 0.07.
- **(C) c = 0.0003 (λ 0.0075).** S070 gains 0.30 over (A). The cost: every cut goes to the floor, and the unlucky tenth
  spends less than the guardrails' on S070, S330 and S354.

## What this does not cover: the reference is provisional until checked

1. **The single market table, not the mixture.**
   - K5 ran with a single table (MIX=0); the product runs the three-world mixture (MIX=3).
   - On the twelve, the mixture's guardrails cut 15% more than under the single table (PLAN.md's K5 stage 3 text).
   - The knee in the mixture is NOT CHECKED.
2. **Top-tier plans only (stage 3b's question).**
   - All twelve are library households at the top tier, where one tier above does nothing.
   - Where 'auto' can take a riskier tier, below the top tier, is NOT CHECKED.
   - A bet made while behind could move the knee.
3. **Older code.**
   - Stage 1 ran from 31a1b52: the final year averaged (exact is now the default) and F1 off.
   - These are the defaults stage 1's fair-test rows assume, since the files predate recording them.
4. **Sample and settings.** Twelve households, 3,000 paths of seed 7002, and the exponent held at 2.

## The proposed check: K6 run in the product configuration

K6 already sweeps c from a tenth to ten times the reference, which here is 0.0001 to 0.01 (R5). The proposal is that K6
runs:
- in the mixture, with the exact final year and 'auto';
- on the twelve at their own tier AND held at Medium. Holding them at Medium answers stage 3b's question;
- **on held-out paths: 3,000 of seed 7012, not seed 7002** (7012 since 25 Sep 22:01 UK: 7011 is registered to M14b and 7e, the seed registry, RULES.md section 8). c was chosen here on seed 7002's paths, and so were K5's
  twelve. What is chosen on one sample is reported from another (RULES.md section 4, rule 7), as M14b did. The unlucky
  tenth is reported with its se.

Its prediction is registered first:
- **(i)** from 0.001 to 0.003 the thin households lose survival, with S070 and S330 beyond two se;
- **(ii)** below 0.001, no household gains more than 0.5 points.

**Falsified if** the knee moves by a grid step either way. The reference then moves with it before Phase 4.

The run time is to be measured from its first cells under the same load, not estimated here.

## What a decision changes

The reference becomes the centre for:
- arm S in Phase 4;
- K6's sweep;
- M15 v2's probe.

The maintainer is asked two things:

1. **The value:** (A) 0.001, (B) 0.003 or (C) 0.0003.
2. **Whether `solvePlan` takes it as its default now.** Today it refuses to run without one.
   - **Recommended: not yet.** The value is a research reference until K6 confirms it on the held-out paths. The
     product default is decided then, on K6's figures rather than the seed-7002 ones that chose it.
   - If it is made the default now, the same commit changes PRODUCT_DEFAULTS, the decided-defaults block and
     `plan-defaults.test.mjs` (rule 4). That test is locked, so the change needs "unlock enforcement".

The slider's two ends (0% and 100%) come from K6's sweep. They are not part of this decision.
