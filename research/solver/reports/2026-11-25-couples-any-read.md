# Every couple on the solver, the registered read (25 Nov): W, R, L and P pass, and M1 names two of S041's units, so the read goes to the maintainer before any default changes

The registered test (`registrations/couples-any.md`; D145 (3), `COUPLES-ANY.md`), on the held-out seed 7027 and four
couples no run had used, read once by its rule.

**The run.** Launched 24 Nov 18:34 UK through the launcher from the launch worktree (`/home/user/couples-any-reg`, at the
launch commit 48522d79; code d91a642206b9, audit 3a5474defb4f): the 136 units at `26,000` paths of seed 7027, four at a
time (`results/couples-any-launch-1.log` there).
- The container restarted on 25 Nov at about 01:15 UTC with `96` of the `136` done. The run was relaunched there under
  `RESUME=1` at 01:18 UK (`results/couples-any-launch-2.log`), its stamp the same:
  - the units done kept by their logs' stamp line and done line, the arms saved for the four units in flight taken up (the
    registration's gate: only under the same stamp and the same tables), the `40` left run;
  - for the launcher's checks the worktree's HEAD pointed at the branch (575998b5) without touching any file, so the
    launcher counted five files as uncommitted, the branch's tree against the worktree's: `drafts/COUPLES-ANY-DEFAULT.md`
    and `drafts/couples-any-default.patch` (not in the worktree), `STATE.md`, `couples-any-beside.mjs` and `runs.log` (the
    launch commit's, `runs.log` with its two launch lines). None is under the stamp, and the snapshot copied the worktree's
    files, so the relaunch ran the launch commit's code;
  - its smoke stamp was the first launch's (`16d5ddc2462a`: the code, every script a batch runs and `smoke.sh`), so the
    launcher ran no second smoke;
  - the worktree was detached again at 48522d79 once the snapshot was taken.
- The container restarted again at about 03:56 UTC with `130` done. The run was relaunched the same way at 03:57 UK
  (`results/couples-any-launch-3.log`): the launcher's todo named only the six units not done, the arms saved for the four
  in flight were taken up, the same five files were counted as uncommitted (the branch then at 84ce77b2), and the smoke
  stamp was the first launch's.
- Its runs done 25 Nov 04:21 UK, no unit exiting with an error, and none left with an arm saved but unfinished.

**W's identity first.** Run from the launch worktree at 48522d79 in four parts, 25 Nov 04:22 to 06:36 UTC. The app's own
route at the app's own shapes was held to the run's ROUTE on all 24 W units: every table digest and every key of every
path the same, `24 of 24 units IDENTICAL` (`results-couples-any-registered-port-identity.txt`, naming the run's stamp and
the tree it ran on, the same).

**The read.** Read once at 06:36 UK by `reduce-couples-any.mjs --registered` (with `REG=1`) from the launch worktree, its
gate fair, its output whole in `results-couples-any-registered.txt`. The ranges below come from
`results-couples-any-registered-beside.txt`, which `couples-any-beside.mjs` prints from the read's own unit lines. That
script's change for this read was committed on 24 Nov at 22:04 UTC (575998b5), while the run was going and before the read,
and it decides nothing. The MPAA ages come from
`results-couples-any-registered-mpaa.txt`, which `couples-any-mpaa.mjs` prints from the same lines; it was written after the
read and decides nothing.

## In plain words

The household route took only some couples. `COUPLES-ANY.md`'s steps A and B built the ways in for three more shapes, off
in code:
- **R:** one wrapper, the pension or the ISA, held by the two people at different risks (A's 'risks');
- **L:** the partner's own limits differing from the first person's (A's 'limits'). Once the limits apply, the two pensions
  are held at different risks, so L's units take R's way too, and L opens only with R;
- **P:** two salaries growing at different rates (B's 'salaries').

Step 4's three shapes (**W**), on by default since D146 by inference, are measured here.

Each unit runs the household route taking every shape (ROUTE) against the app's own rules (APP), on the same `26,000`
paths of seed 7027. The couples are S041 (retired, 68 and 65), S123 (retired, 56 and 53), S207 (working, 55 and 52) and
S281 (working, 45 and 42), the library's untouched couples taken evenly. Where both people must still work (Wg, Wc and P),
S185 stands in S041's place and S197 in S123's. Each kind runs at two holdings, the library's own (the elder holding 60%)
and the younger holding 75%. Each unit is landed so APP survives 85 +/- 1% on 1,000 paths of seed 7005.

## What it found, by the rule

| class | units | 1. a unit flagged by D34 | 2. pooled survival, points, by path | 3. spending on the paths both keep | beside: over all paths |
|---|---|---|---|---|---|
| W | 24 | none | `+12.206` (`+11.927` to `+12.484`) | `+5.4173%` | `+5.6633%` |
| R | 96 | none | `+10.600` (`+10.381` to `+10.818`) | `+4.4103%` | `+4.3133%` |
| L | 8 | none | `+12.237` (`+11.982` to `+12.491`) | `+5.0560%` | `+5.3242%` |
| P | 8 | none | `+11.963` (`+11.652` to `+12.274`) | `+6.0426%` | `+6.3979%` |

**OUTCOME** (the read's line): "R, L and P pass, each opening by its own change of default (the reviewer and B1's gate); W
passes and stays on by default (D146); the read going to the maintainer first with the units M1 names (S041-Rp1t-Y75,
S041-Ri1s-Y75), before any default changes".

## The two units M1 names

M1 (D116) names a unit where ROUTE keeps more paths but spends less on the paths both keep, beyond noise. It is not a bar,
but under a pass each unit it names goes to the maintainer with the read before the default changes. It names two of S041's,
both with the younger holding 75% and their wrapper one profile apart:

| unit | the shape | survival, APP to ROUTE | paths kept net of `26,000` | spending on the paths both keep | over all paths | the capped pot, a path |
|---|---|---|---|---|---|---|
| S041-Rp1t-Y75 | the pension, the partner's the safer | `85.59%` to `98.98%` | `3,483` | `-0.9379%` (`-0.9936` to `-0.8823`) | `-0.753%` | `-4.597%` (`-£25,362`) |
| S041-Ri1s-Y75 | the ISA, the first person's the safer | `86.75%` to `98.85%` | `3,147` | `-0.3579%` (`-0.4091` to `-0.3066`) | `-0.397%` | `+6.309%` (`+£35,138`) |

- ROUTE loses no path on either and saves `3,483` and `3,147`, and spends less on the paths both keep. The read does not
  show why, or that one is the price of the other. Other units of S041 keep as many paths and spend more on the paths both
  keep: S041-W0-Y75, for one, saves `3,679` paths and loses none, and spends `+1.5096%` on the paths both keep.
- They are the two units the pilot's M1 named on `1,000` paths of seed 7002 (`results-couples-any-sizing.txt`), so the
  registration said the read would most likely come to the maintainer first.
- They are also the only two units where ROUTE delivers less lifetime spending over all paths than APP beyond noise: S041-Rp1t-Y75
  `-0.7531%` (`-0.8056` to `-0.7005`) and S041-Ri1s-Y75 `-0.3972%` (`-0.4451` to `-0.3494`).
- Lifetime tax rises on both: S041-Rp1t-Y75 from `£3,437` to `£16,545` a path, S041-Ri1s-Y75 from `£2,151` to `£18,917`.
- Every other S041 unit spends more on the paths both keep than APP.

## No harm

- D34 flags a unit where its paths lost less its paths saved pass its threshold (`harmExact`). On no unit does that come
  near: its statistic is at least `1459` paths below the threshold on every unit. The nearest is S281-Ri3t-own, `80` lost
  less `1409` saved, `-1329` against `130`.
- At `26,000` paths, D34 flags a true one-point loss `0.928` (S123-L-Y75) to `0.999` (S281-Ri3t-own) of the time, median
  `0.972`, and a quarter-point loss `0.048` to `0.050`. So, unlike the dress rehearsal's, this read's "no harm" has D34's
  power as registered: the discordance runs from `5.73%` to `14.70%`, inside the `17.04%` the paths were sized for.
- Paths lost alone, beside: at most `80` on a unit (S281-Ri3t-own). In W at most `6` (S207-W0-own), in L at most `2`, in P at
  most `4`. The units losing most hold the ISA two or three profiles apart, S281's most of all.
- ROUTE survives:
  - on R's units, from `90.12%` (S281-Ri2t-own) to `99.68%` (S123-Rp1s-Y75), where APP runs from `83.29%` to `87.2%`;
  - on W's, from `95.07%` (S281-Wc-Y75) to `99.36%` (S123-W0-Y75);
  - on L's, from `95.63%` to `99.62%`;
  - on P's, from `95.59%` to `99.23%`.
- R by its parts (pooled survival, points, by path; spending on the paths both keep within `4.0383%` to `4.7823%` in every
  part):
  - the pension apart `+11.367`, the ISA apart `+9.832`;
  - one profile apart `+11.687`, two `+10.554`, three `+9.558`: the gain is smaller the further apart the two risks, as in
    the dress rehearsal;
  - the first person the safer `+10.573`, the partner `+10.627`;
  - the elder holding 60% `+10.524`, the younger 75% `+10.675`.

## The pot, the tax and the MPAA, beside the rule

D116 records a smaller pot where the household route keeps more paths and delivers no less spending; it is not a bar.

**The pot, over W, R, L and P, by couple** (the capped pot in pounds a path, as D116 counts it):
- **S041's units:** the capped pot from `-15.059%` (S041-L-Y75) to `+63.638%` (S041-Ri2t-Y75), `-£82,052` to `+£203,562` a
  path.
- **S123's:** `-27.442%` (S123-Rp3s-Y75) to `+12.954%` (S123-Rp3t-Y75), `-£241,549` to `+£74,257` a path.
- **S207's:** `-11.229%` (S207-Ri1t-own) to `+0.57%` (S207-Rp3s-own), `-£115,287` to `+£5,166` a path.
- **S281's:** lower on every unit, `-10.202%` (S281-Rp3s-Y75) to `-0.701%` (S281-W0-own), `-£129,768` to `-£8,188` a path.
- **S185's and S197's** (the working kinds alone): lower on every unit, by `£112,437` to `£126,621` a path on S185's and
  `£129,196` to `£138,715` on S197's (`-10.54%` to `-12.804%`).
- The mean pot falls further than the capped one on most units: on S281's by `51.25%` to `82.45%`.

**Lifetime tax, ROUTE less APP, in pounds a path by couple:**
- **S041:** `-£40,259` (S041-W0-own) to `+£25,699` (S041-Rp3s-Y75), APP's `£1,036` to `£44,469`.
- **S123:** `-£38,310` (S123-L-own) to `+£27,181` (S123-Rp3s-Y75), APP's `£5,018` to `£45,645`.
- **S207:** `-£56,450` (S207-Ri1s-own) to `+£12,161` (S207-Ri2t-Y75), APP's `£31,360` to `£78,465`.
- **S281:** `-£85,258` (S281-Ri1t-Y75) to `+£64,475` (S281-Ri3t-own), APP's `£3,974` to `£139,291`.
- **S185:** higher on every unit, `+£19,724` to `+£31,855`, on APP's `£2,378` to `£6,597`.
- **S197:** lower on every unit, by `£530` to `£1,575`, on APP's `£546` to `£1,679`.
- On small bases these are large rises in percent, up to `+2040.961%` (S041-Ri3t-Y75, `£1,036` to `£22,177`). The rises in
  pounds are far smaller than the dress rehearsal's younger cohort's.

**Each arm's MPAA ages** (the first person's, then the partner's; the age from which the money purchase annual allowance
caps that person's pension saving):
- ROUTE's are earlier than APP's for one person or both on `62` of the `136` units, and never later:
  - S207's `30` of `34` and S281's `28` of `34`, the two couples still working, and S185's and S197's cash ISA units (Wc);
  - on none of S041's or S123's, the two retired couples;
  - `60/60` to `60/58` on `33` units, `60/60` to `58/58` on `27`, and `58/60` to `58/58` on `2`.
- In the dress rehearsal ROUTE's were earlier on `1` of `144` units.
- Where the ages come from, read from the code and not measured:
  - Each arm's ages are its own context's (`audit-couples-any.mjs` `mpaaOf`), and both are resolved by `resolveMpaa`: the
    first year a person takes taxable pension income on the expected path of the app's rules on a plan.
  - APP's are resolved on arm A's pick (its withdrawal policy, drawdown strategy and harvest setting; `select-phase4.mjs`),
    with the guardrails on and the five-year lookahead (`audit-couples-any.mjs`).
  - ROUTE's are resolved on the plan as the solvers are handed it, with the guardrails off and no lookahead, as the page
    prepares every plan it solves (`src/solverSettings.js` `prepareForSolve`). That plan keeps its own withdrawal policy,
    drawdown strategy and harvest setting, taking arm A's policy name only where its pick carries a deposit order of its own
    (`audit-phase4.mjs` `solverPlanOf`). The page's context for the solved couple carries these ages.
  - So neither arm's ages come from ROUTE's own moves. Why the two resolutions reach different ages on these couples is not
    shown.
- What the ages reach, read from the code and not measured:
  - The engine levies no charge on pension contributions past a person's MPAA age.
  - The age moves money only through a pension's room for a one-off deposit or a staged tranche
    (`mpaaAppliesAtYear`, through `wrapperHeadroomAtYear` in `buildContext`'s routing). Its other callers, the savings
    split's routes and the accumulation tool, are not in these runs.
  - Of the 62 units' plans, only S207's hold a one-off contribution: the first person's Auto deposit in 2033, at 62, past
    that person's MPAA age in both arms. S281's, S185's and S197's hold none.
  - So, by the code, the earlier ages move no money on any of the 62 units.

## What it does not show

- **What a pass reaches beyond the panel** is by inference only, as the registration lists:
  - contributions' growth other than Wg's (`3%` and flat), cash ISA payments other than Wc's, a later retiree's plans
    other than W0's;
  - R: risks apart in both wrappers at once, more than three profiles apart, or on the taxable account, cash or the cash
    ISA;
  - L: limits other than L's (the first person's pension ceiling Medium/High Risk, the partner's Medium Risk), the ISA's,
    and limits with risks apart;
  - P: salary growths other than `2%` and `-1%`;
  - two of the shapes at once;
  - the guard's classes D144 opened, with these shapes: every registered couple is three years apart with no other taxable
    income, held at the elder's 60% or the younger's 75%;
  - a couple entered younger first, and a couple with no minimum pot set;
  - the younger cohort, which had no couple left untouched (the dress rehearsal alone, EXPLORATORY);
  - the 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode.
- **The cost of L's limits.** APP reads no solver limits, so L compares the household route under the two people's limits
  with the app's rules without them, as the user would see it. L's pass does not show that the limits cost nothing (the
  registration; its design review, item 9).
- **N's class, C** (nobody retiring within the plan), which is not registered and is the maintainer's.
- **E** (today's two-table route leaving the app's solve), which is its own change of default.

## The reviewer at the read

- First look: FAIL, one BLOCKING and three MINOR (`reviews/2026-11-25-read-couples-any.md`). The read itself stands: the
  reviewer reproduced the gate, W's identity, each class's rule and M1's names from the stored arrays. Answered in one fix
  round:
  - **BLOCKING:** the two units M1 names were said to pay for the paths they keep with less spending, which no results
    file shows. Now the write-up says only that the two occur together, and that the read does not show why.
  - **The beside's timing:** its script's change was committed while the run was going, before the read, and not before
    any of seed 7027's outcome existed; corrected here and in the script's header.
  - **The MPAA ages:** what the code shows of where they come from and what they reach, marked as read from the code.
  - **L's limits:** the registration's caveat, that L's pass does not show the limits cost nothing, added to what the read
    does not show.
- Second look: PASS, one MINOR (`reviews/2026-11-25-read-couples-any-2.md`), answered: ROUTE's MPAA ages are resolved on
  the plan as the solvers are handed it, its own rules, and not on arm A's policy as the first fix round said (an error the
  reviewer traced to its own first look).

## Next

- The deep review.
- To the maintainer, before any default changes: the two units M1 names. The agent's recommendation is to accept both
  units' shortfalls, as D143 accepted S037's and D134 S273-90's, and to build R, L and P's change of default. It is drafted
  (`drafts/couples-any-default.patch`, `drafts/COUPLES-ANY-DEFAULT.md`); its protected edits are asked for by name:
  `couple-default.test.mjs`, `couple-limits-card.test.mjs` and `couple-shape.test.mjs`. Then the reviewer on the change of
  default and B1's gate.
- Still open with the maintainer: whether C opens, and the classic planner.
