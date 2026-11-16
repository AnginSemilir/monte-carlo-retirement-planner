# The fixed share rules' registered test, read (16 Nov): NEITHER, today's split stays

Registered (`registrations/share-rules.md`; D104 (5), D107), on the held-out seed 7023, read once by its rule. The read
whole is `results-share-rules.txt` (`reduce-share-rules.mjs`, run from the launch worktree at e1239959). Beside it,
written after the read and deciding nothing: `results-share-rules-beside.txt` (`share-rules-beside.mjs`). Section A has
each unit's three shares and figures, section B the units by kind, section C the direction of each share's move against
survival's, section D FLAT's spending unit by unit, and section E the means' share against the pots'. Every figure below
is printed in one of those two files or in the registration's pilot section.

The run: eight held-out couples (S023, S061, S109, S147, S191, S227, S271 and S377), each landed four ways (32 units),
each so the app's rules survive about 85 in 100. TODAY and MEANS ran on every unit, and FLAT on the 24 where its share
differs from today's: 88 runs at 16,000 paths each, estate weight 0.02.
- **The launch:** 16 Nov 00:37 UK, through the launcher from the worktree at e1239959 (code c0dcfa9ef2f2, audit
  28712df5935f).
- **The restart:** the run stopped at its task's 12-hour limit with 77 of 88 runs done (counted by their done lines alone).
  It was relaunched under `RESUME=1` at 12:33 UK with the same stamps.
- **The finish:** the runs were done at 14:57 UK, and no run exited with an error.
- **The gate is fair:**
  - every run's log is stamped under the registration as it stands, with one code, audit, seed, prediction and Node
    version;
  - every unit ran at its registered paths, and each arm at its rule's share;
  - each person's settings are stage C's;
  - D80's three are none.

## In plain words

A couple's solve gives each person a table solved for their part of the household's spending: the share. Today's split
(`'pots'`, the couples' default since D99) is half where the elder holds 40% to 60% of the pots, and their share of the
pots outside that band. The test asked whether either of two fixed rules keeps more couples solvent than today's split,
with no couple harmed:
- **FLAT** (`'potsflat'`): the pots' share always, the band dropped.
- **MEANS** (`'means'`): each person's share of the household's means, pots and incomes.

**What it found: neither passes, so today's split stays.**
- **FLAT holds on survival but fails on harm and on spending.** Pooled survival is `+0.421` points (`+0.387` to
  `+0.454`) over its 24 units. But D34's rule flags four units for harm, and its pooled spending delivered is
  `-0.0746%` of today's, past the `-0.05%` bar.
- **MEANS holds on survival and on spending but fails on harm.** Pooled survival is `+0.217` points (`+0.178` to
  `+0.256`) over all 32 units, and spending delivered `+0.3729%`. But six units are flagged, one of them losing `12.381`
  points.
- **The pilot pointed this way.** On `1,000` paths of three couples (EXPLORATORY, seed 7002), both rules lost on some
  unit, and the registration said before launch that the run "would most likely read NEITHER".

## The read, by its rule

Each rule is read against TODAY on the units where its share differs. It passes only if all three parts hold:
1. no unit flagged by D34's rule (the loss over the unit's paths beyond the threshold its discordance sets, in whole
   paths);
2. a pooled survival change whose lower end is above nought;
3. pooled spending delivered not lower by more than `0.05%`.

**FLAT, on 24 units: FAILS parts 1 and 3.**
- **Part 1, four units flagged:**

  | unit | the share | survival | the loss against its threshold |
  |---|---|---|---|
  | S023-45 | `0.500` to `0.450` | `97.61%` to `97.04%` | `+0.563` against `0.381` |
  | S147-45 | `0.500` to `0.450` | `97.46%` to `96.01%` | `+1.456` against `0.425` |
  | S191-45 | `0.500` to `0.450` | `96.96%` to `96.17%` | `+0.787` against `0.406` |
  | S061-dbpart | `0.500` to `0.600` | `97.79%` to `95.19%` | `+2.606` against `0.481` |

- **Part 2 holds:** pooled survival `+0.421` (`+0.387` to `+0.454`, se `0.0172`).
- **Part 3 fails:** pooled spending delivered `-0.0746%` of today's (`-0.0802` to `-0.0690`).

**MEANS, on 32 units: FAILS part 1.**
- **Part 1, six units flagged:**

  | unit | the share | survival | the loss against its threshold |
  |---|---|---|---|
  | S061-dbpart | `0.500` to `0.385` | `97.79%` to `85.41%` | `+12.381` against `0.719` |
  | S023-90 | `0.900` to `0.854` | `96.78%` to `94.30%` | `+2.475` against `0.494` |
  | S147-90 | `0.900` to `0.765` | `95.85%` to `94.64%` | `+1.206` against `0.456` |
  | S227-90 | `0.900` to `0.837` | `95.94%` to `95.06%` | `+0.881` against `0.406` |
  | S191-45 | `0.500` to `0.470` | `96.96%` to `96.42%` | `+0.537` against `0.388` |
  | S377-dbpart | `0.500` to `0.470` | `96.61%` to `96.14%` | `+0.463` against `0.381` |

  S061-dbpart's discordance is `12.43%`, and its 1-point rate there is `0.836`, below `0.90`. It is named so by D34 (4),
  and is flagged regardless.
- **Part 2 holds:** pooled survival `+0.217` (`+0.178` to `+0.256`, se `0.0200`).
- **Part 3 holds:** spending delivered `+0.3729%` (`+0.3660` to `+0.3798`).

**MEANS against FLAT,** on the 32 units: `-0.099` (`-0.131` to `-0.066`). It would have decided between the two had both
passed.

**OUTCOME: NEITHER.** Today's split stays. By the registration, a flagged unit goes to investigation (D34 (3)): the deep
review takes the ten flags together.

**Reported, deciding nothing:**
- **Fidelity:** the rollout and the engine agree on survival on every path checked, `16,000` in TODAY, `12,000` in FLAT and
  `16,000` in MEANS.
- **Pooled over the 32 units, the mean pot left and lifetime tax a path:**

  | rule | the mean pot left | lifetime tax |
  |---|---|---|
  | TODAY | `£3,710,009` | `£171,855` |
  | FLAT | `£3,654,995` | `£172,741` |
  | MEANS | `£3,698,475` | `£169,115` |

- **The solves:** `69` to `147` s (TODAY), `77` to `206` s (FLAT), `66` to `337` s (MEANS).

## What the units show (beside, deciding nothing)

These are leads read off the run after the read. Every panel couple's first person is the elder, three years older than
the partner, so a share above today's gives the elder more of the spending.
- **The share moves survival a lot, both ways, and mostly in one direction** (section C).
  - Over the 56 comparisons, where a rule moved the elder's part up, survival rose in 25 and fell in 8.
  - Where it moved the elder's part down, survival rose in 8 and fell in 15.
- **Holdings of 45/55 and 55/45 under FLAT** (section B), a move of `0.050` either way:
  - at 45/55 the elder's part goes down, and survival is lower on six of the eight couples, the mean `-0.389` points;
  - at 55/45 the elder's part goes up, and survival is higher on six of the eight, the mean `+0.416`.
- **The elder's DB pension.** Both rules move the elder's part up (FLAT by `0.100`, MEANS by `0.138` to `0.181`).
  - Survival rises on all three couples: the mean `+3.525` points under FLAT and `+4.765` under MEANS.
  - S147-db goes from `89.51%` to `96.17%` under FLAT, and to `98.85%` under MEANS.
- **But not on every couple, nor for every feature:**
  - **The partner's DB pension, S061-dbpart:** it loses whichever way its share moves. With the elder's part up to
    `0.600` (FLAT) it loses `2.61` points; down to `0.385` (MEANS) it loses `12.38`. Today's half is the best of the
    three there.
  - **90/10 under MEANS:** the elder's part comes down by `0.046` to `0.183`. Survival rises on five couples and falls on
    three (S023 `-2.48`, S147 `-1.21`, S227 `-0.88`).
  - **S061 and S109 at 45/55 and 55/45, where survival is above 99%:** seven of the sixteen exceptions are theirs, each
    under `0.3` points.
- **FLAT's spending** (section D): the 24 units' changes average `-0.0746%`.
  - Where the elder's part goes up, the 16 units average `+0.0776%`; where it goes down, the eight at 45/55 average
    `-0.3791%`.
  - The lowest: S109-45 `-2.0966%`, S377-dbpart `-1.8087%`, S061-dbpart `-1.7821%`, S061-45 `-1.5837%`.
- **The means' share against the pots'** (section E):
  - the means give the elder more than the pots at 45/55 (`+0.020` to `+0.077`) and with the elder's DB pension
    (`+0.038` to `+0.081`);
  - they give the elder less at 90/10 (`-0.046` to `-0.183`) and with the partner's DB pension (`-0.044` to `-0.215`).

So no single fixed share suits these couples. Each rule helps some and harms others, by up to `12.38` points on one. The
best of the three shares differs by couple: half on S061-dbpart, the most for the elder on S147-db.

## What the read cannot show

- **It ran on the couples' candidate as it stood at launch (code c0dcfa9ef2f2), without LOOKHOLD.** LOOKHOLD became the
  couples' default after the launch (D109), and its registration lists it among what a passing rule would reach only by
  inference. With NEITHER nothing changes, so this bears only on a follow-up.
- **The panel's shape:**
  - every couple's first person is three years older than the partner, so equal ages are untested;
  - the estate aim is `'standard'` alone;
  - the features are three: the elder's DB pension (on three couples), the partner's (three) and the partner's state
    pension at 60% (two).
- **The direction above is read on the units after the fact.** It is a lead for the deep review, not a finding. Its
  exceptions (the 90/10 units, S061-dbpart, the couples near 100%) are as large as some of its cases.

## The reviews

- The reviewer at the read: (to come).
- The deep review: (to come), and with it the one test it would propose.

## For the maintainer

The read decides itself: today's split stays as the couples' default, and nothing changes in the app. What comes next
waits on the deep review. The agent will put it to you with the deep review's test, if one is proposed, and the option of
leaving the share where it is.
