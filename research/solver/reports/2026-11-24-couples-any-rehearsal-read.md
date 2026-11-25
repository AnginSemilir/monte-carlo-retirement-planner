# Every couple on the solver, the dress rehearsal's read (24 Nov): W, R, L and P pass, N is reported, and C's question goes to the maintainer

EXPLORATORY (`COUPLES-ANY.md` amendment 2; D145 (3)), on the tuning seed 7002 and on touched couples: nothing opens on
this read.

**The run.** Launched 24 Nov 10:36 UK through the launcher from `/home/user/couples-a` at 605524f0 (code d91a642206b9,
audit 82b6d08fc60b); its runs done 13:16 UK. 144 units, none exiting with an error.

**W's identity first.** The app's own route, held to the rehearsal's ROUTE on all 24 W units: every table digest and every
key of every path the same, `24 of 24 units IDENTICAL` (`results-couples-any-port-identity.txt`).

**The read.** Read once by `reduce-couples-any.mjs`, its output whole in `results-couples-any.txt`. The ranges below come
from `results-couples-any-beside.txt`, which `couples-any-beside.mjs` prints from the read's own unit lines; it was written
after the read and decides nothing.

## In plain words

The household route takes only some couples today. `COUPLES-ANY.md`'s steps A to C built the ways in for the rest, off in
code:
- **R:** one wrapper held by the two people at different risks (A's 'risks');
- **L:** the partner's own limits differing from the first person's (A's 'limits');
- **P:** two salaries growing at different rates (B's 'salaries');
- **N:** nobody retiring within the plan (C's 'noretire').

Step 4's three shapes (**W**), on by default since D146, are measured here for the first time.

Each unit runs the household route taking every shape (ROUTE) against the app's own rules (APP), on the same 4,000 paths.
The couples are S025 and S273 of the library and S351F and S357F of the younger cohort, with S227 in S025's place where both
people work. Each kind runs at two holdings: the library's own, the elder holding 60%, and with the younger holding 75%.
Each unit but N's is landed so APP survives 85 +/- 1% on 1,000 paths of seed 7005. N's run at the library's own target,
since where nobody retires both arms survive every path at any target (amendment 2).

## What it found, by the rule

| class | units | 1. a unit flagged by D34 | 2. pooled survival, points, by path | 3. spending on the paths both keep | beside: over all paths |
|---|---|---|---|---|---|
| W | 24 | none | `+10.567` (`+9.962` to `+11.171`) | `+7.2474%` | `+8.1003%` |
| R | 96 | none | `+9.492` (`+8.922` to `+10.063`) | `+6.5525%` | `+6.8073%` |
| L | 8 | none | `+10.662` (`+10.022` to `+11.303`) | `+7.1462%` | `+7.8972%` |
| P | 8 | none | `+9.731` (`+9.124` to `+10.338`) | `+8.6327%` | `+9.6367%` |

**OUTCOME: W, R, L and P pass and go to the registered test; N is reported, not read.**
- No unit delivers less lifetime spending over all paths than APP beyond noise.
- M1 (D116) names no unit.

## No harm

- D34 flags a unit where its paths lost less its paths saved pass its threshold (`harmExact`). On no unit does that come
  near: it runs from `-599` paths (S025-L-Y75) to `-152`, against thresholds of `33` to `52` paths. The nearest is S273-Ri3t-own: `10`
  lost less `162` saved, `-152` against `33`, a margin of `185` paths. The nearest margin in W is `355` paths, in L `347`,
  in P `339`.
- D34's thresholds here are `0.825` to `1.300` points (`33` to `52` of `4,000` paths), about the one-point loss D34 is meant
  to catch. At `4,000` paths D34 would flag a true one-point loss only `0.311` (S025-Rp3t-own) to `0.677` (S273-Ri3t-own)
  of the time, median `0.414`, and a quarter-point loss `0.044` to `0.050`.
- So this read's "no harm" rests on the size of the gains, D34's statistic at least `185` paths below its threshold on
  every unit, and not on D34's power to see a one-point loss. The discordance, `4.30%` to `14.97%`, sizes the registered
  test's paths by D34.
- Paths lost alone, beside: at most `10` on a unit (S273-Ri3t-own); in W at most `1`, in L none, in P at most `2`.
- ROUTE survives:
  - on R's units, from `88.92%` (S273-Ri3t-Y75) to `99.55%` (S025-Rp3t-own), where APP runs from `84.38%` to `86.83%`;
  - on W's, from `92.53%` (S273-Wc-own) to `99.3%` (S025-W0-own);
  - on L's, from `93.22%` to `99.45%`;
  - on P's, from `93.08%` to `96.13%`.
- R by its parts (pooled survival, points; spending on the paths both keep within `6.3245%` to `6.7805%` in every part):
  - the pension apart `+9.931`, the ISA apart `+9.054`;
  - one profile apart `+10.492`, two `+9.404`, three `+8.581`: the gain is smaller the further apart the two risks;
  - the first person the safer `+9.437`, the partner `+9.548`;
  - the elder holding 60% `+9.393`, the younger 75% `+9.592`.

## The pot and the tax, beside the rule

D116 records a smaller pot where the household route keeps more paths and delivers no less spending; it is not a bar.

**The pot, over W, R, L and P, by couple** (the capped pot in pounds a path, as D116 counts it):
- **S025's units:** the mean pot rises, `+20.419%` to `+91.562%`, and so does the capped pot, `+£50,003` to `+£103,304` a
  path (`+25.584%` to `+65.113%`).
- **The other four couples' units:** the mean pot falls, from `-46.869%` (S273-Ri3t-Y75) to `-85.05%` (S351F-W0-own).
  - The capped pot falls on S227's, by `£328,172` to `£529,093` a path (`-5.631%` to `-9.071%`), and on S273's, by
    `£323,685` to `£859,669` a path (`-5.073%` to `-13.109%`).
  - It moves either way on S351F's, `-£40,493` to `+£39,506` a path (`-3.124%` to `+3.267%`), and on S357F's, `-£162,660`
    to `+£501,382` a path (`-2.339%` to `+7.686%`).

**Lifetime tax, ROUTE less APP, in pounds a path by couple:**
- **S025:** `-£265` to `+£1,160` (APP's `£217` to `£711`).
- **S227:** lower on every unit, by `£248,611` to `£336,258`.
- **S273:** `-£232,464` to `+£114,002`.
- **S351F:** higher on every unit, `+£15,482` to `+£223,218`. On its small bases (APP's `£7,063` to `£137,162`) these are
  the largest rises in percent, up to `+1283.934%` (S351F-Ri3s-Y75, `£17,386` to `£240,604`).
- **S357F:** higher on every unit, `+£214,460` to `+£1,461,638` (APP's `£230,555` to `£788,591`): the largest rises in
  pounds.
- Why the younger cohort's tax rises so far is not shown here.

## N, and C's question for the maintainer

N's eight units: both arms survive every path, since nothing is spent from the pots before the first retirement.
- ROUTE's capped pot is higher on all eight, `+0.216%` (S351F-N-own) to `+2.475%` (S227-N-own); its mean pot runs from
  `-55.178%` to `+4.348%`.
- In pounds a path, the capped pot and lifetime tax, ROUTE less APP:
  - S227's two: the capped pot `+£226,042` and `+£223,119`; tax `-£125,861` and `-£125,375`;
  - S273's two: the capped pot `+£100,398` and `+£102,997`; tax `-£93,270` and `-£106,622`;
  - S351F's two: the capped pot `+£3,871` and `+£3,880`; tax `+£315,971` and `+£301,509`;
  - S357F's two: the capped pot `+£120,226` and `+£121,897`; tax `+£1,649,050` and `+£1,536,487`.
- So on the younger cohort's N units ROUTE pays far more tax for a small gain in the capped pot: on S357F's, `+£1,649,050`
  and `+£1,536,487` a path for `+£120,226` and `+£121,897`. Why is not shown here.

By amendment 2, the maintainer decides whether C opens by inference from its exactness, or not at all. The exactness is
`household-salaries.test.mjs` check 4: the household's salary and contributions are the couple's two added, in every year,
to a penny. Even registered, the rule could not read C, because both arms survive every path.

## What it does not show

- **Not the registered read.** This is EXPLORATORY, on touched couples and the tuning seed, and nothing opens on it. The
  registered test reads by this rule on couples no run has used (the library's untouched couples, D147) and on seed 7027.
- **The panel's own make-up.** Two holdings; the R kinds one to three profiles apart on the library's own risks; L with
  the first person's pension ceiling Medium/High Risk and the partner's Medium Risk; P's salaries growing at `2%` and `-1%`.
  Other shapes are by inference only.

## The reviewer at the read

- First look: FAIL, one BLOCKING and three MINOR (`reviews/2026-11-24-read-couples-any-rehearsal.md`), answered in one fix
  round: lifetime tax given in pounds a path by couple (the BLOCKING); D34's own statistic against each threshold; the
  capped pot in pounds a path; each part of a unit line read on its own.
- Second look: PASS, two MINOR (`reviews/2026-11-24-read-couples-any-rehearsal-2.md`), each answered: D34's rates stated
  under "No harm", printed by the beside from each unit's paths, its thresholds the read's on all `136` units; and an N
  line saying "no cap" where a unit has none, with its planted check.

## Next

To the maintainer: C's question, and the registered test's design. Its panel comes from the library's untouched couples,
its paths by D34 from this rehearsal's discordance, and its design review, pilot and budget all come before any launch.
