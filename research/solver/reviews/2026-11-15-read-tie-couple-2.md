# Review at the read, second round: a couple's tie rule above the estate caps, stage A (`TIE-C.md`; D97 (2); EXPLORATORY, seed 7002)

Subject: the answer, in 2ccbada0, to my first verdict at the read (`reviews/2026-11-15-read-tie-couple.md`: FAIL, findings 1
and 2 BLOCKING, 3 and 4 MINOR). The read itself stands as the first round found it.

Read (blobs at 2ccbada0):
- The answer:
  - `tie-couple-beside.mjs` d9fdb2f5 and `results-tie-couple-beside.txt` 1ed28ef1;
  - `tie-couple-trace.mjs` 69627212 and `results-tie-couple-trace.txt` dd3abc14;
  - `reports/2026-11-15-tie-couple-read.md` 6b0ba873;
  - `DECISIONS-PENDING.md` d31b76a4 (l.14-28);
  - `STATE.md` c41f84f8 (section 6 action 3, the TIE-C clause);
  - the commit message.
- The rule's files and the read, unchanged since the first round: `TIE-C.md` 6628900c, `audit-tie-couple.mjs` 86b3a072,
  `reduce-tie-couple.mjs` a7e2eb1a, `results-tie-couple.txt` ae71b79e.
- The code the trace rests on:
  - `audit-phase4.mjs` 5ace8395 (`runPath`, l.89-105);
  - `src/solver/couple.js` ad2f2a95 (`tiePick` l.681-690, `chooseJoint` l.691-797, `couplePolicy` l.807-823, `withCouple`
    l.824-826);
  - `research/engine.mjs` as generated at 2ccbada0: `stepYear`, which asks the table's `choose` at the top of the year
    (l.2116); the tier switch and its charge (l.2767-2791); the year's row (l.2822-2858); `freshState` (l.2059).

Ran (read-only on the repository; my scripts and their outputs are in the session scratchpad):
- `node research/solver/reduce-tie-couple.mjs` and `node research/solver/tie-couple-beside.mjs`: each is byte-identical to its
  results file.
- My own decoding of the eight units' arrays, not the reducer's functions (`check-arrays.mjs`, `boot2.mjs`). It gives:
  - every figure of sections D and E that the write-up uses;
  - each couple's z for the change in its pot and in its tax;
  - each couple's concentration;
  - a bootstrap of S311F's change.
- A probe (`probe-tiec.mjs`, EXPLORATORY, deciding nothing), 15 Nov 04:44 to 04:46 UK:
  - S311F solved as `tie-couple-trace.mjs` solves it (136 s);
  - paths 4468 and 5461 run by the engine year by year under CANDS and TIE5, with the counterfactuals in finding 1;
  - each arm's pot and lifetime tax as run equal the stored arrays exactly.
  - It ran at nice 19 beside SPEED-B's four units, which are also at nice 19, so for about two and a half minutes five
    processes shared four cores. SPEED-B's times are a guide only (`SPEED-B.md` l.36-37).

I opened nothing of seed 7021, D4, `d4-backup` or `d4b-backup`.

Verdict: FAIL

The four findings of the first round are answered, and the new sections and the trace compute what their labels say. The FAIL
is one new sentence in the account to the maintainer (finding 1). It gives the extra tax on the two deciding paths to the
tables' later choice of risk, and a decomposition shows that most of that tax is the rule's own.

## What holds

- **Finding 1 (a) and (b) of the first round.**
  - Section C now gives the tax by its direction (beside l.21, l.24): at TIE5, lower on 2,541 paths by £263,188 on average
    and higher on 686 by £68,334.
  - It also gives what each side carries (l.22, l.25): the paths paying more tax carry -£605,572 and -£608,218.
  - The report uses these rightly (l.32-33, l.38-39).
- **Finding 1 (c).** Section D prints the deciding paths, the change without them and the paired standard errors.
  - From the arrays, without the one, two and four largest losses: -0.180%, +0.263%, +0.298% at TIE5 and -0.294%, +0.146%,
    +0.456% at TIE4. The standard errors are 0.6709% and 0.7199%.
  - The report (l.30-36) and DECISIONS-PENDING (l.20-22) say what these show.
- **Finding 2.** The re-test remark is gone.
  - The report (l.58-59) and DECISIONS-PENDING (l.27) say that by the rule nothing is run again and that reopening it is the
    maintainer's alone, as `TIE-C.md` l.4-5 and D97 (2) have it.
  - The question is put as a question, with what the two paths did (l.59-61). Its account of the tax is finding 1.
- **Findings 3 and 4.**
  - Finding 3: the report l.51-56 and l.103-105, with section F printing the 11 paths I counted.
  - Finding 4: section E, with the report l.24-25 and l.28 and DECISIONS-PENDING l.17-19.
- **The couple-by-couple claims** (report l.26-28).
  - The pot's change on the seven couples is beyond two standard errors, z 4.21 (S011, TIE5) to 27.47 (S323F, TIE4). Every
    one passes Holm over the 16 comparisons. On none of the seven do the ten largest paths hold more than 3.9% of the summed
    pots, so a normal standard error suits them.
  - S311F's z is -1.03 and -1.12, so "within noise" is fair. A sound bootstrap agrees (the correction below).
  - Tax: |z| is 4.56 or more on every couple at both margins except S293 at TIE4 (-1.56). S317F's rise has z 4.63 and 9.48.
  - The capped pot changes by at most -0.00397% (S311F, TIE4), so "within 0.004%" holds.
- **The trace is built as the run was:**
  - the plan: `solverPlan('CANDC', ...)` under arm A's policy;
  - the solves: `solveForApp` with the audit's options, memoised as the audit's (trace l.31-37 against audit l.66-72);
  - the context: `buildContext(withCouple(...))` with arm A's MPAA ages (trace l.43, audit l.82);
  - the paths: `pathsForSeed(7002, 8000, T)`, path k as a `Float64Array` (trace l.45, audit l.83);
  - the year loop and its sums: `runPath`'s (trace l.48-58 against `audit-phase4.mjs` l.89-101).
  - Its pot and tax are compared with `===` against the stored doubles (l.63) and match on all six path-arms.
- **The counterfactual gives CANDS's chooser the state the tie arm's chooser saw.**
  - `stepYear` asks the table at the top of the year, on the state as it stands (engine l.2116).
  - `couplePolicy`'s `choose` reads only plain numbers and flags, and these survive the trace's JSON copy: the pots, the
    bases, the gains carried, the tax-free cash, the lump sum, the cash ISAs and the tiers held (couple.js l.810-819).
  - My probe: each arm's own chooser, handed that copy, gives its own move in every year of both paths, under CANDS and TIE5.
  - The trace's wrapper drops `choose`'s third argument. `couplePolicy` does not read it.
- **What the trace's lines imply but do not print also holds** (my probe, TIE5).
  - The tiers stay apart to the end: plan years 53 to 60, the first person at 3/3 on TIE5's path and at 0/0 on CANDS's.
  - The first differing year is 23 on both paths even with the household's lump sum, cost order and move indices in the key.
  - On TIE5's own path its pick differs from CANDS's chooser at the same state in 32 years on 4468 (every year from 23 to 50,
    then 52, 53, 54 and 57) and in 34 on 5461. It never differs at another tier pair, so the report's l.51 holds on the arm's
    own path too.

## A correction to my first review

My first review (finding 1 (c)) said that a paired bootstrap of S311F's percent change ran from -1.61% to -0.18% at TIE5,
with its median at -1.09%. That figure was wrong. My generator computed `seed * 1103515245` in floating point, past 2^53,
and is not sound. A variant of it put path 4468 or 5461 into every one of 4,000 resamples, where a sound generator leaves
both out of about 13.5%.

With a sound generator (mulberry32, 4,000 resamples):
- TIE5: -2.20% to +0.30%, median -0.66%;
- TIE4: -2.43% to +0.42%, median -0.74%;
- 13.2% of resamples hold neither deciding path, and in those the change is +0.265% and +0.139%.

So the interval includes nought, as the report's "within noise" says. The answer did not use my figure, and my conclusion
there stands: no interval from these paths says whether the rule lowers S311F's mean pot.

## Findings

1. **BLOCKING. The account to the maintainer says the extra tax on the two deciding paths came through the tables' later
   choice of risk. Most of it is the rule's own.**

   Where it sits:
   - DECISIONS-PENDING l.25: "So the rule's earlier picks led, through the tables' later choice of risk, to more tax and a
     smaller pot."
   - It rests on the report's l.46-50, which puts the extra tax after the step ("After the step the tie arm pays more tax
     (£896,660 against £120,439 ...)") without saying where it comes from.
   - "What it does not show" (l.100-107) does not say that this is not shown.
   - The trace prints the tax before and after the step and nothing that splits it. So the clause claims a cause with no
     decomposition behind it.

   The decomposition, from my probe at TIE5. The two runs as made match the stored arrays exactly. The runs with the first
   person's tiers forced (held at 0/0 on TIE5's path, stepped to 3/3 on CANDS's, each from plan year 53) are the probe's own.

   | path | run | end pot against CANDS | lifetime tax against CANDS | tax from plan year 53 to the end |
   |---|---|---|---|---|
   | 4468 | TIE5 as run | -34.15% | +£763,916 | £896,660 (CANDS £120,439) |
   | 4468 | TIE5, the first person held at 0/0 | +0.06% | +£614,483 | £747,227 |
   | 4468 | CANDS, the first person stepped to 3/3 | -34.21% | +£55,428 | £175,866 |
   | 5461 | TIE5 as run | -16.76% | +£420,250 | £1,346,404 (CANDS £863,323) |
   | 5461 | TIE5, held at 0/0 | +0.02% | +£379,403 | £1,305,557 |
   | 5461 | CANDS, stepped to 3/3 | -16.77% | +£98,212 | £961,535 |

   - **The pot's half of the sentence holds.** Undo the step and the tie arm's pot is CANDS's. Impose the step on CANDS and
     CANDS falls as far. The write-up asserted this without a decomposition, but it is right.
   - **The tax's half does not.**
     - With the step undone, the tie arm still pays 80% (4468) and 90% (5461) of its extra lifetime tax.
     - The step itself adds only £149,434 and £40,847 on the tie arm's wrappers.
   - **What the extra tax is: the wrappers the rule's picks left.**
     - On 4468 in plan year 52, the first person's taxable account is £7,078,624 under TIE5 against £544,549 under CANDS, and
       the partner's ISA is £4,020 against £3,528,519.
     - From plan year 53, TIE5's dividend tax is £45,150 to £84,478 a year against CANDS's £2,576 to £4,903. Its capital gains
       tax is £34,862 to £47,108 a year against £157 to £21,941.
     - TIE5's yearly tax (income tax and capital gains) is already above CANDS's in plan years 50 to 52, before the step:
       £31,867, £63,067 and £73,783 against £21,298, £21,814 and £22,451.
     - The rule's pick parts from CANDS's chooser in every year from 23 to 50 on 4468, never at another tier pair (What
       holds). So the wrappers part through the rule's picks, and the step is the only difference in risk.
   - **What follows.**
     - On the two paths that decide part 5, the rule's picks alone raised lifetime tax by £614,483 and £379,403. Each year's
       least tax left a taxable account whose dividends and gains are taxed in every later year. Then the tables' step cut
       the pot.
     - This bears on the question the write-up leaves the maintainer: whether pots of billions far above the cap should count
       against a rule like this. On the very paths that decide it, the rule raised lifetime tax (the measure part 6 pools),
       whatever measure of the pot is taken.
     - Told that the tax came through the tables' choice of risk, the maintainer would weigh that question on the wrong
       mechanism.

   To answer, either:
   - restate DECISIONS-PENDING l.23-26, and the report's l.46-50 where they give the tax, from a decomposition a script
     prints (the trace with the two forced runs): the pot to the step, the tax to the wrappers; or
   - take the tax out of the causal clause, and say in "What it does not show" that the trace does not show where the extra
     tax comes from.
