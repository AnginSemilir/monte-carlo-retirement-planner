# The fixed share rules' registered test, read (16 Nov): NEITHER, today's split stays

Registered (`registrations/share-rules.md`; D104 (5), D107), on the held-out seed 7023, read once by its rule. The read
whole is `results-share-rules.txt` (`reduce-share-rules.mjs`, run from the launch worktree at e1239959). Beside it,
written after the read and deciding nothing: `results-share-rules-beside.txt` (`share-rules-beside.mjs`). Section A has
each unit's three shares and figures, section B the units by kind, section C the direction of each share's move against
survival's, section D FLAT's spending unit by unit, and section E the means' share against the pots'. Added for the
reviewer at the read: C (cont.) counts the direction once a unit and gives each change's noise, F splits the lost and saved
paths by kind, G follows S061-dbpart's failing paths, and H gives the solve and engine times by unit. Every figure below is
printed in one of those two files or in the registration's pilot section.

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
  - "Harm" here is a loss of survival as the registration counts it. A path fails when it runs short in some year, or
    else ends the plan below the household's minimum pot, so not every lost path runs out of money (below).
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

  | unit | the share | survival | the loss against its threshold | lost paths: running short / below the minimum pot |
  |---|---|---|---|---|
  | S023-45 | `0.500` to `0.450` | `97.61%` to `97.04%` | `+0.563` against `0.381` | `29` / `77` |
  | S147-45 | `0.500` to `0.450` | `97.46%` to `96.01%` | `+1.456` against `0.425` | `67` / `174` |
  | S191-45 | `0.500` to `0.450` | `96.96%` to `96.17%` | `+0.787` against `0.406` | `104` / `56` |
  | S061-dbpart | `0.500` to `0.600` | `97.79%` to `95.19%` | `+2.606` against `0.481` | `440` / `0` |

- **Part 2 holds:** pooled survival `+0.421` (`+0.387` to `+0.454`, se `0.0172`).
- **Part 3 fails:** pooled spending delivered `-0.0746%` of today's (`-0.0802` to `-0.0690`).

**MEANS, on 32 units: FAILS part 1.**
- **Part 1, six units flagged:**

  | unit | the share | survival | the loss against its threshold | lost paths: running short / below the minimum pot |
  |---|---|---|---|---|
  | S061-dbpart | `0.500` to `0.385` | `97.79%` to `85.41%` | `+12.381` against `0.719` | `1985` / `0` |
  | S023-90 | `0.900` to `0.854` | `96.78%` to `94.30%` | `+2.475` against `0.494` | `17` / `434` |
  | S147-90 | `0.900` to `0.765` | `95.85%` to `94.64%` | `+1.206` against `0.456` | `2` / `272` |
  | S227-90 | `0.900` to `0.837` | `95.94%` to `95.06%` | `+0.881` against `0.406` | `2` / `167` |
  | S191-45 | `0.500` to `0.470` | `96.96%` to `96.42%` | `+0.537` against `0.388` | `54` / `63` |
  | S377-dbpart | `0.500` to `0.470` | `96.61%` to `96.14%` | `+0.463` against `0.381` | `100` / `1` |

  S061-dbpart's discordance is `12.43%`, and its 1-point rate there is `0.836`, below `0.90`. It is named so by D34 (4),
  and is flagged regardless.
- **Part 2 holds:** pooled survival `+0.217` (`+0.178` to `+0.256`, se `0.0200`).
- **Part 3 holds:** spending delivered `+0.3729%` (`+0.3660` to `+0.3798`).

**MEANS against FLAT,** on the 32 units: `-0.099` (`-0.131` to `-0.066`). It would have decided between the two had both
passed.

**OUTCOME: NEITHER.** Today's split stays. By the registration, a flagged unit goes to investigation (D34 (3)): the deep
review takes the ten flags together.

**What the lost paths are** (section F; the last column above). A path fails when it runs short in some year (a year's
unmet spending over `£1`, the engine's rule), or else ends the plan below the household's minimum pot. The registered
survival counts both kinds, so the outcome stands, but the flags are not all money running out.
- **Three of MEANS's six flags are almost wholly the minimum pot's:** S023-90, S147-90 and S227-90, all at 90/10.
- **On S147-90, MEANS runs short on fewer paths than TODAY** (`562` to `386`) while more end below the minimum pot (`102`
  to `471`).
- **The flags that run short:** S061-dbpart under both rules, and S377-dbpart under MEANS (`100` of its `101`). FLAT's
  three at 45/55 are mixed.
- **Over the 56 comparisons:** `2,448` of the `5,646` lost paths, and `2,983` of the `8,371` saved, are the minimum pot's.
- **Checked:** every one of the `12,405` failing paths read as the minimum pot's fails in the plan's last year, below the
  household's floor.

**Reported, deciding nothing:**
- **Fidelity:** the rollout and the engine agree on survival on every path checked, `16,000` in TODAY, `12,000` in FLAT and
  `16,000` in MEANS.
- **Pooled over the 32 units, the mean pot left and lifetime tax a path:**

  | rule | the mean pot left | lifetime tax |
  |---|---|---|
  | TODAY | `£3,710,009` | `£171,855` |
  | FLAT | `£3,654,995` | `£172,741` |
  | MEANS | `£3,698,475` | `£169,115` |

- **The solves:** `69` to `147` s (TODAY), `77` to `206` s (FLAT), `66` to `337` s (MEANS). These are a guide only.
  - The arms ran in a fixed order, every TODAY first, then every MEANS, then FLAT (`audit-share-rules.mjs` `unitsOf`),
    beside the day's other work.
  - The six MEANS solves over `280` s ran when the same runs' engine took `161` to `215` ms a path, against TODAY's `108`
    to `132` on those units (section H). So the machine was busier then.
  - S023's MEANS solves (`66` to `69` s) are TODAY's (`69` to `73` s).
  - The registration says neither rule adds solve time: each changes only the share.

## What the units show (beside, deciding nothing)

These are leads read off the run after the read. Every panel couple's first person is the elder, three years older than
the partner, so a share above today's gives the elder more of the spending.
- **The share moves survival a lot, both ways, and mostly in one direction** (sections C and C (cont.)).
  - On 19 units FLAT and MEANS move the share the same way from the same run of today's, and the two always agree in
    sign. Counted once a unit and direction, 24 of the 37 follow the direction: the elder's part up and survival up, or
    down and down. 13 go against it.
  - The changes are mostly beyond noise: `43` of the 56 (a two-sided exact McNemar test at 5%, unadjusted). Where the
    elder's part went up, 20 rose and 4 fell; where it went down, 13 fell and 6 rose.
  - **On the paths that run short alone, the direction holds.** With the elder's part up, fewer run short on 24 of 33
    comparisons; with it down, more on 16 of 23. The paths below the minimum pot rise on 33 of the 56, whichever way the
    share moves.
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
    - That nets two movements going opposite ways (section F). Fewer paths run short on six of the eight couples, and
      more end below the minimum pot on seven.
  - **S061 and S109 at 45/55 and 55/45, where survival is above 99%:** seven of the comparisons against the direction are
    theirs, each under `0.3` points. Four of them are beyond noise (S061-45 under MEANS, `57` lost and `11` saved, p
    `1.3e-8`): small in points near 100%, but not noise.
- **S061-dbpart's failing paths all run short, and early** (section G).
  - They fail in the run's years 5 to 9 under TODAY and FLAT, and 4 to 9 under MEANS, when the partner is 62 to 67.
    That is before the partner's `£15,000` DB pension starts at 68 (year 10); the state pension age is 68.
  - They end the plan with a median pot of `£276,372` under MEANS (TODAY `£292,606`, FLAT `£304,779`).
  - So the shortfall is in the years before the partner's pensions start, with money left later. That is a lead for the
    deep review; its cause is not shown.
- **FLAT's spending** (section D): the 24 units' changes average `-0.0746%`.
  - Where the elder's part goes up, the 16 units average `+0.0776%`; where it goes down, the eight at 45/55 average
    `-0.3791%`.
  - The lowest: S109-45 `-2.0966%`, S377-dbpart `-1.8087%`, S061-dbpart `-1.7821%`, S061-45 `-1.5837%`.
- **The means' share against the pots'** (section E):
  - the means give the elder more than the pots at 45/55 (`+0.020` to `+0.077`) and with the elder's DB pension
    (`+0.038` to `+0.081`);
  - they give the elder less at 90/10 (`-0.046` to `-0.183`) and with the partner's DB pension (`-0.044` to `-0.215`).

So neither fixed rule suits every one of these couples. Each helps some and harms others, by up to `12.38` points on one.
And none of the three shares is best on every unit: half on S061-dbpart, the means' `0.681` on S147-db. Whether some
other fixed rule could pass, the read does not say: it tested two.

## What the read cannot show

- **It ran on the couples' candidate as it stood at launch (code c0dcfa9ef2f2), without LOOKHOLD.** LOOKHOLD became the
  couples' default after the launch (D109), and its registration lists it among what a passing rule would reach only by
  inference. With NEITHER nothing changes, so this bears only on a follow-up.
- **The panel's shape:**
  - every couple's first person is three years older than the partner, so equal ages are untested;
  - the estate aim is `'standard'` alone;
  - the features are three: the elder's DB pension (on three couples), the partner's (three) and the partner's state
    pension at 60% (two);
  - the elder holds 45%, 55%, 60% (with the features) or 90% of every wrapper, never less than 45%. The read says nothing
    of couples whose younger partner holds more than 55%.
- **The direction above is read on the units after the fact.** It is a lead for the deep review, not a finding. Its
  exceptions (the 90/10 units, S061-dbpart, the couples near 100%) are as large as some of its cases.
- **What a lost path is depends on the plan's minimum pot** (section F). On S023, S061, S191 and S271 it is the unit's own
  landed target. On the others it is a fixed amount: `£80,000` (S109), `£90,000` (S147 and S377) and `£480,000` (S227).
  A rule's harm is read the registered way, counting both kinds.

## The reviews

- **The reviewer at the read: PASS, four MINORs** (`reviews/2026-11-16-read-share-rules.md`). It re-ran the read byte for
  byte, recomputed every figure from the arrays, and checked the thresholds independently. Its four MINORs are answered
  above, each figure printed by the beside script:
  1. the lost paths' two kinds beside the flags (section F), and S061-dbpart's early shortfalls (section G);
  2. the direction counted once a unit and direction, with its noise (C (cont.));
  3. the closing sentence brought within the read, and the holdings added to its limits;
  4. the solve times given their conditions (section H).
- **The deep review** (`reviews/2026-11-16-deep-share-rules.md`). NEITHER stands.
  - **The fixed-share route is spent,** taken with the earlier reads:
    - the share ensemble found that the best share differs by couple;
    - the share choice found that the solver's own forecast cannot pick it;
    - and now neither fixed rule passes on held-out couples.
  - **Its leading cause:** each person's table plans a part of the household that the household never lives. It is a
    fixed share of the spending and the minimum pot, met from that person's own pots and incomes, from their own
    retirement. The joint move then prices the household's money, and its room to spend, by those parts.
  - Its evidence for that and against it is in its section 2. Those figures are from its own scripts on the stored
    arrays: a post hoc read, so leads, not results.
  - **Its one test (EXPLORATORY):** the read's lost and saved paths, replayed on the read's own code with a record of each
    year, and four variants of each rule's policy, each changing one part of its move:
    - today's spending level;
    - today's tiers;
    - today's split;
    - each person's top six moves offered.
  - **Its cost:** about 4.5 core-hours, with half a day to build and half a day to read.
  - **What it decides:** whichever variant recovers the lost paths names what to build next. In every outcome today's split
    stays until a registered test reads.
  - **It also moves the open items:** a new line for the couples' share, with its measured effect (STATE.md); CGT-BILL's
    absence check, which should also read the size of a path's unmet spending; and FD-RAISE's lead on couples, which the
    test would answer.

## For the maintainer

The read decides itself: today's split stays as the couples' default, and nothing changes in the app. What comes next is
yours.
1. **Run the deep review's test** (the agent's recommendation).
   - The share moves a couple's survival by up to 12 points either way. Today's split leaves up to 9 points on the couples
     with the elder's DB pension, S147-db for one.
   - The test is the cheapest way to learn whether the fault is in the joint move, which no choice of share can fix, and
     which part of the move it is.
   - **How it would run:** on seed 7023's paths, the ones already read, so no new outcome of a held-out seed is read. The
     launcher refuses a reserved seed outside its registration, so the test would run directly, as the pilot did, from a
     worktree at a fixed commit.
   - Or it could run on seed 7002, with the flagged units' arms run there first, at about three times the cost.
2. **Leave the share where it is,** and go on to the research queue's two factorials and then your work on the screens.
