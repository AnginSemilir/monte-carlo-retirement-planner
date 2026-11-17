# The external review of 17 Nov: one plan for the whole household

The questions are `research/solver/QUESTIONS-2026-11-17.md` on `claude/project-access-i58m0x` (6bfbe905). The answers are
`ANSWERS.md`. Everything here is EXPLORATORY and decides nothing.

## What is here

| file | what it is |
|---|---|
| `ANSWERS.md` | the seven answers, with what I would do next |
| `PRESCRIPTION.md` | the answers as steps for the agent: each step's build, test, rule and time box, what is asked of the maintainer, and the prompt to send |
| `results-pilot.txt` | the pilot: today's couples default against design A on twelve of the lead test's units |
| `results-pilot-beside-joint-wide.txt` | the pilot's units beside JOINT-WIDE's read of the same units |
| `results-pilot-extra.txt` | the same on couples of shapes the library has none of; design A with the capital gains band put right; design A's move taken from the single solver's own chooser |
| `results-above-cap.txt` | each arm's lifetime tax on the paths that end above the estate cap, and below it |
| `results-why-pot.txt` | on three units, the spending level each arm takes and the risk it holds, year by year |
| `results-answers-figures.txt` | every pooled figure, count and range `ANSWERS.md` quotes from the pilot, printed from the unit files |
| `results-fidelity.txt` | design A's household plan against the couple under the app's own rules, taken apart |
| `results-twin-trace.txt` | where a twin couple and its household plan first part, and on what |
| `results-twin-trace-mended.txt` | the same with the household plan's capital gains band put right |
| `results-bias-table.txt` | what design A states differently from the couple, on each of the lead test's 28 units |
| `results-coverage.txt` | what the household library's 210 couples look like, and what design A's merge refuses of them |
| `scripts/` | the scripts that printed each of those |
| `units/` | the pilot's stored paths, one gzipped file a unit, which `scripts/pilot-read.mjs` reads; `caps.json`, each unit's estate cap |

## How it was run

On a copy of the working branch at 6bfbe905, with this folder placed at `research/reviews/2026-11-17/` and
`python3 research/build-engine.py` run first. No file of the working branch was changed. Node v22, four cores, four
units at a time. The solver's code id there is `603eeb595679` and the couples' candidate `af001697ce1b`, the same as
JOINT-WIDE's run.

```sh
# the pilot: one unit, its arms on the same paths (about 8 to 25 minutes a unit on one core)
node research/reviews/2026-11-17/scripts/pilot.mjs S147-db 99003 1500 45 K2,HOUSE,H1,H6,HS9,CEIL
node research/reviews/2026-11-17/scripts/pilot-extra.mjs S149@gap8 99003 1500 45 K2,HOUSE,HOUSEC,CEIL
node research/reviews/2026-11-17/scripts/pilot-extra.mjs S227-90 99003 1500 45 HOUSE,HOUSEC,H0,HT0,HT5
node research/reviews/2026-11-17/scripts/caps.mjs S147-db S227-90
node research/reviews/2026-11-17/scripts/why-pot.mjs S061-dbpart 99003 300 45
# the reads (the unit files are stored gzipped; the readers take either form)
node research/reviews/2026-11-17/scripts/pilot-read.mjs research/reviews/2026-11-17/units/pilot-99003-45
node research/reviews/2026-11-17/scripts/pilot-read.mjs research/reviews/2026-11-17/units/pilot-extra-99003-45
node research/reviews/2026-11-17/scripts/above-cap.mjs
node research/reviews/2026-11-17/scripts/jw-compare.mjs research/solver/results-joint-wide.txt
node research/reviews/2026-11-17/scripts/answers-figures.mjs
# no solve in any of these: the engine under the app's own rules, or plan arithmetic
node research/reviews/2026-11-17/scripts/fidelity.mjs 300
node research/reviews/2026-11-17/scripts/twin-trace.mjs S205 S061-dbpart S327F S227-90 S023-db S149 --paths 100
node research/reviews/2026-11-17/scripts/twin-trace.mjs S205 S061-dbpart S327F S227-90 S023-db S149 --paths 100 --mend
node research/reviews/2026-11-17/scripts/bias-table.mjs
node research/reviews/2026-11-17/scripts/coverage.mjs
```

**The arms.** K2: today's couples default, as the lead test's audit solves it. HOUSE: design A as that audit runs it
(its top three moves, five splits, the tie rule without the look, the hold). H1, H6, HS9: design A at its top one
move, its top six, and nine splits. H0: its top one move at the even split. HT0, HT5: the household's move taken from
the single solver's own chooser, the candidate's tie-break above the cap left on, at the even split and at the best of
five. HOUSEC: design A with the household plan's capital gains band put right. CEIL: the household table run on its
own single plan.

**What the pilot does not have.** No rule committed before it ran, and no fair-test gate. Within a unit K2, HOUSE and
its widths are solved in one process by the same call at the same settings, on the same code, and HOUSEC, HT0 and HT5
differ from HOUSE's table in the one thing each is named for; but nothing checks that as the reducers' gate does. Its intervals are the paired difference's standard error, 1.96 of it
either way, not `stats.mjs`'s.

## The rules it kept

- Seeds 99002 and 99003 only (the review's), and 99005 for smoke runs at six points whose figures are not kept. Nothing
  of seed 7002 was run, so the lead test's 4,000 paths a unit are unread, and no held-out seed was touched.
- `research/solver/archive/` was not opened for writing. No test, hook or protected file was changed.
- Every unit is one of the lead test's 28, or one of those changed in one stated way. The maintainer's own household is
  not among them.
- The pilot is not the lead test of `HOUSEHOLD.md` section 5. It has other seeds, fewer units and paths, and no rule.
  It is a lead and nothing more.
