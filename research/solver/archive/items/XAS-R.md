# XAS-R: the deep reviewer's revision of the third read (quoted)

On 5 Oct, after the deep review after XAS (deep-review-log.md 18:48 UK) proposed XAS-R, the author asked the same reviewer
to define its third read ("the reader's read with the top node's continuation computed from its own value instead of
copied"). At the top share node p = 0, so c = S/p is undefined. The author offered four constructs: (i) c_top = S_top;
(ii) the continuation with the bill paid from outside; (iii) the top corner's weight dropped; (iv) 7at's read (b).

The reviewer's reply, a message to the author that wrote nothing to the logs, is quoted below verbatim (only the log's full file path, given after "18:48 receipt", is left out). It is the record
that predictions/diag-xasr.md cites for (v-a) and (v-b), for S370 alone deciding, and for the thresholds 0.6 and 0.3.
This file was written at the plan-auditor's MINOR 9 of 5 Oct on 967f853.

> ## XAS-R's third read: use none of (i)-(iv); read through one exact, supported virtual node instead
>
> Nothing was written. This revises my 18:48 receipt.
>
> **Why I reject each of your four constructs:**
> - **(i) c_top = S_top double-counts.** With p_top = 0, the node keeps R_top = S_top already. Off the node, p(acc)·w_top·S_top would be added on top. It has no meaning as a continuation.
> - **(ii) is ill-defined for a bridge of more than one year.** Funding this year's bill from outside leaves A = 0 next year, so the funded state is dead again at t + 1. The true value would need every remaining bridge bill funded, which is a new solver piece.
> - **(iii) does not separate the causes.** It makes the cell a pure function of the a = 0.8 node. Under YB-COPY its slope falls further; under YB-GRID it says nothing new.
> - **(iv) is the wrong thing to test.** It has only been run under BASE (O80, where it overshoots). It extrapolates the 0.6-0.8 trend, so it tests whether that trend exists, not whether the copy is to blame.
>
> **I also withdraw the plain reader-off read as a decider.** It still interpolates through the dead node, in log-odds, so it cannot tell YB-COPY from YB-GRID. Keep it as reported only.
>
> ### The construct I mean: one virtual node per read, never re-solved
> For each year-before read in the top cell, and each corner row of its bracket:
>
> - **(v-a) a supported node at the year-before's own support edge.**
>   - Place it at a*_k, the share on that row where the world's reference chance is p = 0.5 (A = acc*_k).
>   - Compute S* exactly as the cell loop builds a node: the best move by the full score, against the t + 1 table, at the solve's 5 points.
>   - Set c* = min(1, S*/p*) and R* = S* − p*c*.
>   - In [0.8, a*], read with c and R interpolated between the 0.8 node and a*. Leave everything beyond a* unchanged.
>   - This is candidate A, read-only.
> - **(v-b) a node at the cell's midpoint, a = 0.9, under the reader's own rule.**
>   - Same exact S, but c is copied if p < 0.5, as now.
>   - Under YB-GRID it helps whether or not it is supported. Under YB-COPY it helps only on reads where it is supported.
>
> ### Thresholds
> I would replace slope 0.8 / 0.4 with the share of COV's year-before rep that each read removes. Rep is the quantity the fix targets, and it has XAS's paired per-path sign-flip test. Read years 2 and 6 separately; both must agree.
>
> | Outcome | Condition |
> |---|---|
> | YB-COPY | (v-a) removes 60% or more of the rep, and (v-b) helps mainly on reads where the 0.9 node is supported |
> | YB-GRID | (v-a) removes 30% or less, and (v-b) removes about as much as (v-a) (within 15 points), whatever its support |
> | SPLIT | anything else |
>
> - **Pass-through slope:** report it as a secondary measure, as the share of the gap it closes: (slope_v − slope_reader) / (0.93 − slope_reader). 0.93 is the mean slope in years 1, 4 and 5.
> - **BASE guard:** run the same reads on BASE. Under BASE, (v-a) must not create optimism; BASE's year-before rep is about −2e-3 today.
>
> ### Households
> - **S370:** the only household whose result counts toward the outcome.
> - **bridge 4:** read it and report it, but it decides nothing. Its year-2 one-step change is −7e-4 on average, and 3,920 of 6,000 reads have no change at all, so it has no power. It is cheap: its solves took about 16 minutes in COV-B-STEP.
> - **S130:** leave it out of XAS-R. It has no year-before read (reads start at t ≥ 1, and its only step is year 1), so it is not even a control here. It stays as the identity control in the fix's forward test.
> - **S126:** keep it, for the opening-score split only.
>
> ### Cost
> (v-a) and (v-b) need about 8 to 32 exact one-step node values per read across the 11,859 year-before reads. That is roughly one extra core-hour on S370's XAS-scale read, so the total is about 2.5 core-hours, still on two cores.

## Where the registered prediction departs from it (each declared in predictions/diag-xasr.md)

- **(v-b)'s support condition:** it is reported, not part of item 1's outcome. Item 1 decides on (v-a)'s share alone.
- **The guard:**
  - registered as one-sided on S370 (8093a31);
  - made two-sided on S370 and bridge 4, with the share bounded to [-0.2, 1.2], before launch (4c4389b), on the plan-auditor's BLOCKING 1 and 2 of 5 Oct.
- **Item 2:**
  - The 18:48 receipt read S126-BLEND as "the bequest or shortfall term carries 0.035 or more of the 0.04".
  - The prediction reads it as q, the part of the score's rise carried by the three reads without a reader construct (resilience, bequest and shortfall), HELD at 0.8 or more on both opening moves.
  - This was committed in 8093a31 (19:13 UK), before the build check.
