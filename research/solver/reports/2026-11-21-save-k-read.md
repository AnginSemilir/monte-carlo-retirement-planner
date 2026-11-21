# Test K read: the employees' split at income tax relief alone (21 Nov, EXPLORATORY)

The deep review's one test of the savings split's v2 (`reviews/2026-11-21-deep-save-v2.md` section 3), ruled by D137 (4);
its rule `SAVE-K.md`, committed before any unit ran (d56a2910). Run directly as a tracked task on the read's code, from the
launch worktree at a83cd90b (code 71fb4271c681), 21 Nov 18:17 to 20:26 UK: 31 units, none stopped, none exiting with an
error. Read once by `reduce-save-k.mjs`; its output whole is `results-save-k.txt`.

## The gate

Fair:
- the registered run it reads, its 40 launch logs stamped under `registrations/save-v2.md` as it stands;
- one stamp across the 31 units (the tree's code and audit, this test's files, one Node), seed 7025, `4,000` paths, 45 points;
- **the identity on 30 of 30 employees**: on the flipped plan, the candidate's table digest, its settings line and every
  array on the first `500` paths are the registered CANDDA's. So the flag reaches the run only through the split's price,
  as the deep review found from the code;
- **the control**: S280's CANDSA-T is its registered CANDSA, the digest, the settings line and every array on all `4,000`
  paths.

## The result

Pooled survival by path over the 30 employees, in points:
- the registered gain, CANDSA less CANDDA: `+0.590` (`+0.518` to `+0.662`);
- at income tax relief alone, CANDSA-T less CANDDA: `+0.428` (`+0.371` to `+0.486`), beyond noise;
- **K** `0.726` (`0.679` to `0.773`).

K by group:
- the 13 basic-rate employees outside the three: `0.580` (`0.505` to `0.654`);
- the 14 higher-rate employees: `0.875` (`0.806` to `0.945`);
- the three that save ISA first most (S300F, S302F, S336F): `0.899` (`0.733` to `1.064`).

The higher-rate group's K less the basic-rate group's is `+0.296` (`+0.187` to `+0.404`), beyond its noise: the cause's
signature.

Against the deep review's prediction:
- the basic-rate group keeps a little more than half (predicted about half or less);
- the higher-rate group keeps about nine-tenths, as predicted;
- the three keep about nine-tenths, within noise of all of it, where "more than all" was predicted;
- pooled, `0.726` against about `0.7`.

**OUTCOME: THE CAUSE HOLDS IN SIZE.** By D137 (4):
- the change of default goes with the law's price in the split's two routes: D134 (3)'s cap on salary sacrifice's NIC
  relief, from April 2029, brought forward for `saveSplitRoutes`, with its test;
- its D-line gives both figures;
- whether the app asks how an employee pays in goes to the maintainer.

## Beside, deciding nothing

- **What K measures.** K prices an employee's pension pound at income tax relief alone. That is the law for an employee who
  does not sacrifice salary, in every year, and for a sacrificer's pound above £2,000 a year from April 2029.
  - The law's price for a sacrificer lies between the engine's and K's: NIC relief in full to April 2029, and on the first
    £2,000 a year after.
  - So for a sacrificer, the share of the employees' gain the law keeps lies between `0.726` and all of it, pooled. Nothing
    here measures it.
- **One household falls below nought at the lower price:** S336F `-0.275` (9 saved, 20 lost of `4,000`), where CANDSA gave
  `+0.125` (17 saved, 12 lost). In the registered run it saves ISA first `74.6%` of the time (the deep review's figure,
  not printed by this read). This is not a harm test, and D34's rule is not applied here.
- **The working-year decisions from 2029, over the 30:**
  - the pension first `77.6%` under CANDSA, `74.3%` under CANDSA-T;
  - the ISA first `17.6%` and `19.1%`;
  - the plan's own `4.8%` and `6.6%`.

  The basic-rate group moves most (the pension first `81.7%` to `75.5%`); the higher-rate group hardly moves (`94.7%` to
  `94.5%`).
- **The paths saved and lost against CANDDA:**
  - CANDSA saved `813` (`528` running out, `285` the pot below the minimum) and lost `105`;
  - CANDSA-T saved `655` (`414`, `241`) and lost `141`.
- **The late working years' tier step**, below the plan's tiers in the last five working years, CANDDA, CANDSA and
  CANDSA-T: basic `2.28`, `2.45` and `2.39`; higher `2.22`, `2.39` and `2.39`; the three `2.47`, `2.62` and `2.59`.
- **The times** (a guide, four units at a time beside other jobs): CANDSA-T's solve the median `86` s against the
  registered CANDSA's `53` s; a path `115.4` ms against `103.7` ms.
