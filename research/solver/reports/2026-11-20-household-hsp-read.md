# Step 8, read (20 Nov): PASS; M1 names S273-90, so the read comes to the maintainer first

Registered (`registrations/household-hsp.md`, held-out seed 7024; D129 (3), D130 (2), D131, D132). The run: launched
19 Nov 20:59 UK through the launcher from the launch worktree at dc85dfaf (`/home/user/hsp-launch`; code 71fb4271c681,
audit 4cc4d37c0c19), relaunched under `RESUME=1` at 23:41, 00:37 and 04:58 UK after three container restarts, its
runs done 20 Nov 08:19 UK: 40 units, none exiting with an error. Read once at 08:20 UK by `reduce-household-hsp.mjs` from
the launch worktree, its output whole in `results-household-hsp.txt`. The figures the read does not print are in
`results-household-hsp-beside.txt` (`household-hsp-beside.mjs`, written after the read, on the read's own functions,
deciding nothing).

## In plain words

Step 8 is the registered test of the household plan: one plan for the couple, solved as one table for the whole
household. Its income-tax bands, its tax-free cash cap and its personal allowance are each priced at `k = 1 / s` times
one person's, where `s` is the larger person's share of the two pensions (HSPA, D130 (2)). It runs against today's
couples' default (K2: each person's own table at the couples' candidate, the joint move on the pots' share with LOOKHOLD,
D99 and D109). The panel is 40 held-out units: eight couples in five shapes each, every unit landed so the app's own rules
(APP) survive about 85 in 100 (`registrations/household-hsp.md`, Households):
- `own`: the couple as entered, 60/40;
- `45` and `90`: every wrapper re-held so the first person holds that share of the pots;
- a feature at 60/40: the first person's `£15,000` a year DB pension (`db`), the same of the partner's (`dbpart`), or the
  partner's state pension at 60 (`sppart`);
- `gap8`: the partner eight years younger.

Each arm ran on the same `16,000` paths of seed 7024.

**What it found, by the rule** (`results-household-hsp.txt`):
1. **No unit is flagged by D34's harm rule:** HOLDS.
2. **Pooled survival `+0.762` points (`+0.718` to `+0.807`)** over the 40 units, the interval by path, its lower end
   above nought: HOLDS.
3. **Spending on the paths both keep `+1.7223%` (`+1.7106` to `+1.7340`)** of K2's, the units weighted equally, not
   below `-0.05%`: HOLDS.

**OUTCOME: PASS.** By the registration, HSPA becomes the couples' default by a build, with the reviewer on the change of
default. But M1 names one unit, so the read comes to the maintainer first, and **the default changes only on the
maintainer's word.** Nothing is built before it.

## The one unit M1 names: S273-90

M1 (D116): where the household plan keeps more paths and delivers no less spending, a smaller pot left is not a harm.
On S273-90 HSPA keeps more paths but delivers less on the paths both keep, beyond noise, so M1's condition is not met
there (the read's M1 line):
- **Survival:** HSPA keeps `81` more paths net, `+0.506` points (`+0.356` to `+0.638`).
- **Spending on the paths both keep:** `-0.1665%` (se `0.0074`). Over all paths, `-0.0256%`.
- **The capped pot:** `-1.034%`, `-£64,271` a path.

So on this unit the trade is about half a point more survival for about a sixth of a percent less spending on the paths
both keep, and a pot about one percent smaller.

## Said beside the outcome

From the read and the beside file:
- **Three units lose survival beyond noise, each under D34's threshold** (beside, section C). Each interval lies wholly
  below nought:
  - S025-45 `-0.200` (`-0.251` to `-0.122`), net `32` paths lost against its threshold of `61`;
  - S357F-gap8 `-0.225` (`-0.329` to `-0.106`), net `36` against `61`;
  - S357F-own `-0.281` (`-0.401` to `-0.147`), net `45` against `61`.
  - 29 units lie wholly above nought and 8 across it.
- **One couple gains nothing.** S357F's five units pooled: `-0.043` (`-0.104` to `+0.019`), four of them below nought at
  their point. S273's: `+0.145` (`+0.065` to `+0.225`). The other six couples run from `+0.489` (S351) to `+1.659`
  (S349) (beside, section B).
- **No couple carries the pooled gain** (section A). Without each couple in turn the pooled change runs from `+0.634`
  (without S349) to `+0.878` (without S357). Without its largest unit, S193-90 (`+4.950`), it is `+0.655` (`+0.613` to
  `+0.698`).
- **Where the gain lies, by shape** (section B). The first person holding `90%` of the pots: `+1.702` (`+1.600` to
  `+1.805`). The first person's DB pension (`db`, four units): `+1.567` (`+1.456` to `+1.678`). The first person holding
  `45%`, near even: `+0.034` (`-0.005` to `+0.074`), no gain beyond noise.
- **Lifetime tax** (section E). Lower under HSPA on 26 of the 40 units. Higher on 14, among them all five of S357F's and
  four of S273's (all but S273-90). On those nine units K2's lifetime tax runs from `£920,041` to `£1,342,891` a path. That
  the band pricing misplaces a higher-rate couple's draws is a lead, not shown.
- **The pot** (the read; section F). The pot capped at the two people's estate caps is lower under HSPA on 35 of the 40
  units: the units' mean `-3.630%` (`-£30,732` a path). By M1 it is recorded and is not a bar.
- **The forecast** (section D). HSPA's one table forecasts the household's survival at the start within one point of
  what the engine delivers on every one of the 40 units (the mean gap `+0.099`). K2's figure is the product of the two
  people's own tables, each planning its own part, so it is no forecast of the household (the mean gap `-10.909`).
- **Speed** (the read). A path's CPU time, the mean a unit: HSPA `50.5` ms, K2 `159.5` ms. The solve, the median a unit:
  HSPA `58` s, K2 `122` s.
- **Against the app's rules** (the read, beside). HSPA `+11.605` points (`+11.292` to `+11.917`), K2 `+10.842`
  (`+10.549` to `+11.135`); neither flagged against APP by D34.
- **The checks beside the engine.** The rollout and the engine agree on all `20,000` of K2's first paths checked. No
  comparison's 1-point rate falls below `0.90`.

**By inference only** (the registration's Outcomes): what a pass reaches beyond the panel.
- Couples the guard keeps on the app's rules: an age gap above three years with other taxable income, the younger
  partner holding more than `60%`, either over `90%`.
- Shapes the panel lacks: gaps other than eight years, an elder entered second, pensions held unlike the pots.
- The 'lower' estate aim, consent to change risk withdrawn, the dial's other positions and the speed mode.

## What the maintainer's word decides

- **Go:** HSPA becomes the couples' default, the trade on S273-90 accepted. That is the build the registration names:
  - the household plan's construction, its table and its move put into the app's solve of a couple (`src/`);
  - the port shown identical to the tested arm, path for path, as D99 and D109's changes of default were;
  - the decided-defaults block and the test that pins it;
  - the reviewer on the change of default, then `main` on B1's gate.
  - Then the guard is looked at again with its own units, as the external review asks.
- **Hold:** today's default stays, and S273-90 goes to investigation first.
