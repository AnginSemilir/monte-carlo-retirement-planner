# Step 8's arm, read by step 8's own rule before step 8 is registered (D130 (2); EXPLORATORY, seed 7002)

Committed before any unit runs. EXPLORATORY: it changes no default, no gate and nothing in the candidate; it decides which
arm step 8's registration carries, as D130 (2) rules.

## Why

The remedy's read took HSP, the household plan with its income-tax bands and its tax-free cash cap priced at `k = 1/s` of
the pensions' split (`HOUSEHOLD-REMEDY-READ.md`; `results-household-remedy.txt`). Read by step 8's own rule, HSP fails there:
S191-90 is flagged by D34's harm rule, 25 paths against a threshold of 23 (the design review's BLOCKING 1,
`reviews/2026-11-19-household-hsp-design.md`). Step 8's pilot points the same way: were its changes the truth, S273-sppart
would be flagged at 16,000 paths with chance 0.901 (`results-household-hsp-sizing.txt`).

D130 (2): step 8 is held; HSP, and HSP with the personal allowance priced at `k` as well (HSPA), are read by step 8's own
rule on the lead test's 28 units and step 5's 28 shapes, on the code with the ISA allowance fixed (D130 (1)); step 8 is
registered on the arm that passes on every unit, or comes back to the maintainer with the units that flag.

## Units

- **The lead test's 28** (`audit-household.mjs` `UNITS`), each at its landed target.
- **Step 5's 28 shapes** (`shapes-panel.json`): S149, S337F, S147-db and S061-dbpart, each even, gap8, gap12, elder2nd,
  part60, penB90 and penA100, each at its landed target.
- None of them is in step 8's panel: the audit refuses a unit whose base is one of step 8's eight couples
  (`household-hsp-panel.json`).

## Arms

Each on the same 4,000 paths of seed 7002, at 45 points and the estate weight 0.02, executed by the engine:

- **APP:** arm A, the app's withdrawal-policy search on the couple's plan, no tournament. Beside, deciding nothing.
- **K2:** today's couples' default, as the lead test's K2: each person's table at the couples' candidate, the joint move
  `JOINT` (the pots' share, D99; LOOKHOLD, D109), arm A's MPAA ages.
- **HSP:** the household plan, `householdPlanFor` with `scale: 'pensions'` (the allowance doubled, each band limit
  `2 x PA + k x (L - PA)`, the cap `k` times one person's, the band for gains `k` times one person's), the move at the even
  split. The remedy's HSP.
- **HSPA:** as HSP with `scale: 'pensionsPA'`: the allowance `k` times one person's as well, so each band limit is
  `k x L`. Each band's width above the allowance, the cap and the band for gains are `k` times one person's, as HSP's.
  Its build and test: `household.mjs`, `household.test.mjs` (10d), the plant `pakdouble`.

Each household table is solved once a unit at the candidate 17ff82379838 with its tie-break above the cap, as every read of
the household plan has been (D130 (3) lifts D80 for the household table).

## The rule (step 8's, `STEP8.md` and `registrations/household-hsp.md`, at this read's 4,000 paths)

For each of HSP and HSPA against K2, over the 56 units (`reduce-household-hsp.mjs` `compare`, its parts as `rule` reads
them):

1. **No harm:** no unit flagged by D34's harm rule at its realised discordance, compared in whole paths
   (`reduce-share-rules.mjs` `harmExact`).
2. **A gain:** the pooled survival change by path (`reduce-phase4.mjs` `survivalItem`), its 95% interval's lower end above 0.
3. **Spending:** the pooled spending delivered on the paths both keep, each unit's change in percent of K2's mean on those
   paths and the units weighted equally, by path (`keptSpend`), its point estimate not below -0.05%.

An arm PASSES when all three hold.

## Outcomes

- **HSP PASSES:** step 8 is registered on HSP. Its registration stays as drafted, its pilot, sizing and panel taken again
  on the fixed code.
- **HSP FAILS and HSPA PASSES:** step 8 is registered on HSPA. Its registration's arm, the audit's plan checks and the
  panel's refusals become HSPA's, and the design review sees it again.
- **NEITHER PASSES:** step 8 stays held. The read goes to the maintainer with each arm's flagged units and failing parts.

**Beside, deciding nothing:**
- each arm against APP;
- M1 by unit (`m1ByUnit`);
- each unit's `k`;
- each table's forecast against its survival;
- the pooled figures without their largest unit.

At 4,000 paths D34's threshold flags only larger losses than at step 8's 16,000, so a pass here is weaker evidence than a
pass there. That is said beside the outcome.

## Checks before any path, and the gate

- Before any path, on every unit:
  - HSP's and HSPA's plans as their forms say, each other doubled entry design A's as built;
  - each household table's band for gains `k` times one person's, its settings line and its line against the first
    person's (`audit-shapes.mjs` `unitLineProblems`, step 5's check as `SHAPES.md` amendment 1 has it and step 8's own:
    the minimum pot and the lowest spending level left out of the comparison, each table's lowest level held to its own
    floor over its target);
  - the minimum pot K2's;
  - arm A's pick the landing's.
- Each arm is held to `E.runTrial` on its first 200 paths, and saved in chunks of 1,000 so a restart loses at most a chunk.
- The read's gate: the fair-test gate on the launch logs (`fair-gate.mjs` `requireFairLogs`, an exploratory run's stamps);
  one code and audit stamp, seed and Node version; every unit with its four arms at their configurations; every array one
  a path; and each unit's own launch log with its done line.
- Every refusal of the gate and each part of the rule has its planted case (`reduce-household-arm.mjs --planted`).

## Box

Build and smoke: half a day. The run: about five hours on four cores. The read and its reviewer: two hours.
