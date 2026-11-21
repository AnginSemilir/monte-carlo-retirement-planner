# Review at the read: test K, the employees' split at income tax relief alone (EXPLORATORY; D137 (4))

Subject: the read of test K (`SAVE-K.md`, its rule committed at d56a2910; `results-save-k.txt`, committed at 28209bf9)
and its write-up `reports/2026-11-21-save-k-read.md`. Checked against the units, the registered units they read, the
code at a83cd90b and D137 (4).

Read (blobs at HEAD 28209bf9 unless named):
- `STATE.md` 27a86262bc7f, read whole (D137 whole); `CHECKLIST.md` 45e387294c8d; `reviews/2026-11-21-deep-save-v2.md`
  1a8fff55841e.
- The rule's four files, each the same blob at d56a2910 and at HEAD (`git diff d56a2910` is empty for all four):
  - `SAVE-K.md` 8d903defc206;
  - `save-k.mjs` 3494906dbca9;
  - `reduce-save-k.mjs` 158c7c191c12;
  - `batch-save-k.sh` 51223c6fe136.
  Their stamp now is `1f8c8545bc80`, the stamp in all 31 units' logs.
- `results-save-k.txt` 9c0203e987b1; the write-up a2c1581c27d3; `results/save-k-7025` (31 units and logs);
  `results/save-k-launch-1.log`.
- The launch tree `/home/user/sv2-launch` at a83cd90b:
  - `src/App.jsx` 4f649bd7bbd9: 1365-1484, 1745-1777, 1834-1958, 2285-2369, 3443-3455, 3555-3595, 3640-3757, 3914-3925;
  - `src/solver/model.js` ed0897d3c30b, 295-343;
  - `src/solver/fast.js` e30880dcc519, the flag's readers;
  - `audit-save-v2.mjs` 2e4e40bdb27a, `reduce-save-v2.mjs` 38de29071ba6, `audit-phase4.mjs` 5ace83959b96 (`inputsHash`);
  - `results/save-v2-run`, the 40 registered units.
- `reduce-phase4.mjs` ac319aad1f44 (`byPath`, `survivalItem`).

Ran. Every run was read only, one process at a time at `nice -n 19`; the scripts are in the session scratchpad's `k/`.
- `node research/solver/reduce-save-k.mjs`: its output is `results-save-k.txt` byte for byte. `--planted`: 9 of 9.
- An independent recomputation from the arrays, with my own decoding and arithmetic.
- S180's CANDSA-T solved first in a fresh process, held to the stored unit.
- Post hoc, deciding nothing:
  - the registered read's guards on CANDSA-T;
  - K by working years;
  - the panel's 40 plans, read only.

Verdict: FAIL

The read and its outcome stand: THE CAUSE HOLDS IN SIZE by the rule, far from every bar. The FAIL is one sentence of the
write-up (finding 1).

## Findings

1. **BLOCKING. The write-up's bound on what the law keeps for a salary sacrificer does not follow from the read, and it
   leaves out what the code and the plans show.** The write-up (lines 50-53) says: "The law's price for a sacrificer lies
   between the engine's and K's [...] So for a sacrificer, the share of the employees' gain the law keeps lies between
   `0.726` and all of it, pooled. Nothing here measures it."
   - **The price per pound does lie between.** The share does not follow from that. It needs the pooled gain to move
     monotonically with the price, and the read does not test this. The deep review's own mechanism says it can go the
     other way: ISA first's budget rises when a pension pound costs more net, so it predicted the three would keep "more
     than all". On S302F the gain went from `+0.225` to `+0.500`.
   - **The fact it leaves out.** Every one of the 30 plans pays 12% of salary into the pension, from 2026, growing 3% a
     year: £3,540 to £10,200 in 2026. Pass-through is 0 on all 40 (the panel's plans through `buildContext`). The split
     prices that whole figure as the employee's sacrifice (D137 (4); `saveSplitRoutes`, App.jsx 3568-3569).
     - Under the cap as the law has it (NIC relief on the first £2,000 a year of the sacrifice), a sacrifice already past
       £2,000 costs K's net cost less a constant. So the gross-up of the year's budget (3579-3582) returns K's pension-first
       route to the penny.
     - Worked on S180 in 2029. The plan's own saving puts £4,458 in the pension and £2,229 in the ISA. Pension first is
       £7,554 at the engine's price and £7,245 at K's, which is £4,458 + £2,229 / 0.8. Under the cap, the budget is
       £3,407 + £2,229 = £5,636, and 0.8 s - £160 = £5,636 gives s = £7,245: K's route again. (Both routes were printed
       from the tree's `saveSplitAt`.)
     - This holds from 2029 on all 30 households: 260 of their 350 working years, 74.3%. Once ISA first is held back for
       an employee (D137 (4)), a sacrificer's routes under the law match K's except in 2026 to 2028. In those three years
       alone a sacrificer's routes also differ from a non-sacrificer's. In law this needs the employee's own sacrifice to
       reach £2,000 a year already, and the app does not record the employer's part.
   - **Post hoc, a lead and not a result:**
     - the 20 employees with fifteen working years (12 of them from 2029) carry 88.4% of the registered gain over the 30,
       and their K is `0.698` (`0.648` to `0.748`);
     - the ten with five working years (two from 2029) carry 11.6%, with K `0.939` (`0.785` to `1.093`).
   - **Why it must not stand.** This is the only sentence that tells the maintainer what the law keeps for most employees.
     It bears directly on the question the outcome sends to the maintainer: whether the app asks how an employee pays in.
     - As worded it allows "all of it". But on the app's own figures, from April 2029 the law's routes are K's on every
       household here.
     - It spreads the stakes of the pay-in question across the whole gain. On these plans they sit in the three years
       before April 2029.
   - **Fix.**
     - Replace the sentence with the facts above, labelled as not measured.
     - Say that neither figure measures the arm the change ships for employees: the cap, with ISA first held back.
     - If the maintainer wants that arm measured before the commit, it costs about CANDSA-T's 4.9 core-hours on the same
       4,000 paths.
     - The change's test can hold the capped route to the flipped plan's route from 2029 on these households. That is an
       exact identity.

2. **MINOR. The write-up's account of what the outcome decides leaves out the other half of D137 (4), which applies in
   every outcome: ISA first held back for an employee.** Under it, an employee's split offers only the plan's own saving
   and the pension first. `SAVE-K.md` carries this only under THE CAUSE FAILS. The write-up's "By D137 (4)" list
   (lines 40-44) leaves it out.
   - It matters for the figures, because both arms read here offer ISA first:
     - from 2029 the three take it on 89.2% (CANDSA) and 93.5% (CANDSA-T) of their decisions;
     - the 30 as a whole take it on 17.6% and 19.1%;
     - S336F is the one household below nought at K's price: `-0.275` (`-0.539` to `-0.011`) by path, its interval
       wholly below nought. It takes ISA first on 73.8% and 85.2% of its working-year decisions.
   - So the three's K, S336F's fall and part of each pooled figure rest on a route the change removes for employees.
     Neither figure the D-line gives is the employees' gain as shipped. D137 (4) accepted that cost unmeasured; the
     write-up should say so beside the outcome.

3. **MINOR. The read prints survival alone. The registered read's two guards are not applied at K's price.** From April
   2029 K's price is the one the change ships (finding 1). Post hoc, I applied the registered read's own `compare`
   (`reduce-save-v2.mjs` at a83cd90b, Holm over the 30) to CANDSA-T against CANDDA:
   - D34 flags none. S336F lost 20 paths and saved 9: a net 11 against its threshold of 21.
   - Part 3's household clause fails none. S348F's lifetime spending is `-0.0750%` beyond noise (Holm `4.50e-3`), inside
     the 0.1% bar. It is the only fall beyond noise.
   - Pooled spending is `+0.3902%` (`+0.3803` to `+0.4002`). The registered CANDSA over the same 30 gives `+0.4943%`, with
     no flag and no fall beyond noise.

   Nothing here trips a guard, but the maintainer needs these figures beside K before the change of default ("no material
   harm to any household"). The D-line can give them, labelled post hoc.

## Checked, and holding

- **The rule came first.**
  - The four files are unchanged since d56a2910.
  - The first unit's log was created at 18:17:58 UK, after the commit at 18:17:46.
  - All 31 logs carry the stamp `code 71fb4271c681 tree-audit ffc59974f036 k 1f8c8545bc80 node v22.23.4`.
  - The launch log shows 31 of 31 units run, 18:17 to 20:26 UK, and no unit exiting with an error.
- **The arithmetic.** Recomputed independently from the arrays:
  - K: `0.7260` (`0.6787` to `0.7733`);
  - by group: basic `0.5797` (`0.5051` to `0.6542`), higher `0.8755` (`0.8059` to `0.9451`), the three `0.8987`
    (`0.7333` to `1.0641`);
  - the signature: `+0.2958` (`+0.1872` to `+0.4044`);
  - pooled by path: CANDSA less CANDDA `+0.590` (`+0.518` to `+0.662`), CANDSA-T less CANDDA `+0.428` (`+0.371` to
    `+0.486`), CANDSA-T less CANDSA `-0.162` (`-0.197` to `-0.126`).
- **The method.**
  - The delta method's standard error, taken as the spread of a - K b over B, equals the reducer's covariance form.
  - `ratioDiff`'s gradient is right.
  - A bootstrap over paths (2,000 replicates) agrees: K `0.680` to `0.774`, the signature `0.189` to `0.405`.
  - The reducer's `pathSeries` builds the same series as `byPath`, so the pooling matches `survivalItem`'s.
- **The other printed figures reproduce:**
  - every by-household line;
  - the saved and lost paths by kind: 813 saved (528 running out, 285 the pot) and 105 lost; 655 saved (414, 241) and
    141 lost;
  - the saves from 2029, of 260,000 decisions;
  - the tier steps.
- **The identity, 30 of 30.** On each employee's first 500 paths:
  - the table digest, settings line and configuration are the registered CANDDA's;
  - all seven arrays are identical, and so is each year's level, which the gate does not check.
- **The control, S280.** Its CANDSA-T matches the registered CANDSA on all 4,000 paths in every array, and in its digest,
  settings line, levels and `runPolicy`'s saves and tier pairs.
- **Each unit against its registered arms:**
  - its inputs hash with the flag set back is theirs, and so are its horizon, retirement year and working years;
  - the registered files reproduce the registered read's anchors pair: `+0.487` (`+0.427` to `+0.548`).
- **The arm order inside a unit.** The employees' CANDSA-T ran second, after CANDDA-T; the control's ran first. S180's
  CANDSA-T, solved first in a fresh process, gives the stored digest and the stored first 300 paths (0 of 2,100 values
  differ).
- **The lever.** For a working single the flag is read in five places:
  - `saveSplitRoutes`' price (App.jsx 3567-3583: the budget's net cost and the gross-up). This is the only reader inside
    the split.
  - `taxablePayOf` (1436-1440; also `fast.js` 256-257 and `model.js` 311). The pass-through factor is 1 for every plan
    here, since `erPass` is 0 on all 40.
  - The take-home (2357-2368; `model.js` 333-342). It is computed only once someone has retired, so never for a working
    single.
  - The app's contribution strategies (3654-3757, 3951). No run here calls them; arm A's pick is made on the plan as
    entered.
  - The Auto deposits' relief (`pensionRelief`, 3918-3923) does not read the flag.

  So the identity shows no reach outside the split, and the code shows the price is the only reader inside it.
- **What K measures.** `calculateMarginalRelief` with the flag set (1420-1423) relieves income tax alone, at the marginal
  rate, including Scotland's 21%. That is the law for an employee paying by net pay or relief at source. It is also the
  law for a sacrificer's pound above £2,000 a year from April 2029. Per pound, the law's price for a sacrificer lies
  between the engine's and K's; for the share, see finding 1.
- **The groups.**
  - They are `SAVE-K.md`'s lists and form a partition of the panel's employees: by the panel's own employment field,
    30 employees and 10 self-employed, S280 among the self-employed.
  - Each salary sits on its side of its region's threshold: rUK £50,270 (basic at most £37,500, higher at least £67,500);
    Scotland £43,662 (basic at most £37,500, higher at least £77,500).
  - Within each length of working life the basic-rate K sits below the higher-rate K (post hoc: fifteen years `0.535`
    against `0.856`; five years `0.891` against `1.000`).
- **The outcome.**
  - It is the rule's: K `0.726` is at least `0.33`, K and the basic-rate K are not both at least `0.85`, and the gain's
    lower end `+0.371` is above nought.
  - No bar is close: K's interval lies wholly between `0.33` and `0.85`, and the basic-rate K's wholly below `0.85`.
  - What it decides is as D137 (4) and the deep review set it, except for finding 2.
- **The times.** The identity arm's solve is the same computation as the registered CANDDA's and took x1.49 its time; the
  split's took x1.46. The slower times are the load, not the price.
