# Couples four and five risk levels apart: the read (EXPLORATORY; D154 (5), COUPLES-APART.md)

27 Nov. EXPLORATORY: it decides nothing, changes no default, gate or candidate, and reads no held-out seed.

## What ran

The plan and its rule were committed before any unit was landed (`COUPLES-APART.md`, eb82e0b0; its batch script 014ee7cf).
The 64 units (S025, S273, S351F and S357F, each at the library's holding and with the younger holding `75%`; the pension or
the ISA held four or five profiles apart on the app's six levels, each way) were landed so that arm A survives `85 +/- 1%`
on `1,000` paths of seed 7005 (`results-couples-apart-panel.txt`). APP (the app's own rules) and ROUTE (the household route
as the app runs it) ran on the same `4,000` paths of seed 7002 through the launcher, from 27 Nov 21:24 UK (task bppyzfj0t,
its log `results/couples-apart-launch-1.log`, code 3fb20e2156f8, audit ed5abea79d38); the runs were done at 22:45 UK with
no unit exiting with an error.

The read was made once, by `APART=1 node research/solver/reduce-couples-any.mjs`, from a checkout at the launch commit
(014ee7cf): the solver's code had moved after the launch (b75232c2, the employee's pension question, D154 (3)), so the read
ran on the code and audit the units were run on. Its output, whole, is `results-couples-apart.txt`.

## The outcome: PASSES

By `COUPLES-APART.md`'s rule (D141's, as the rehearsal read R), ROUTE against APP, the 64 units together as one class:

1. No harm: D34's rule flags no unit.
2. A gain: the pooled survival change is `+9.355` points (`+8.799` to `+9.910`, by path). Its lower end is above nought.
3. Spending on the paths both keep: `+7.0661%` (`+6.9159` to `+7.2164`), with the units weighted equally. That is not below `-0.05%`.

By the plan, a pass means the household route's reach at four and five profiles apart is now measured on these couples,
where before it rested on inference (D148; D149 (2)). Nothing changes. The reducer's outcome line still has the dress
rehearsal's wording ("goes to the registered test"). This plan has no registered test to follow, so that line does not apply.

## Beside, deciding nothing (from the same file)

Each part of R holds on its own. Every interval is above nought:

| Part | Pooled survival | Spending on the paths both keep |
|---|---|---|
| The pension apart | `+8.766` | `+6.2770%` |
| The ISA apart | `+9.943` | `+7.8553%` |
| Four profiles apart | `+9.216` | `+6.8722%` |
| Five profiles apart | `+9.493` | `+7.2601%` |
| The first person the safer | `+9.259` | `+7.2284%` |
| The partner the safer | `+9.450` | `+6.9038%` |
| The elder holding `60%` | `+9.313` | `+6.9796%` |
| The younger holding `75%` | `+9.396` | `+7.1527%` |

M1 names no unit.

- **Spending over all paths:** `+7.2066%` pooled. One unit is below nought beyond noise: S025-Rp4t-own, at `-0.2249%`
  (`-0.3169` to `-0.1329`). On the same unit, survival rises from `84.60%` to `99.28%`.
- **The pot and lifetime tax.** These are counted from the unit lines by `couples-apart-beside.mjs` (committed). It refuses any
  count of lines but 64. Its output, whole, is `results-couples-apart-beside.txt`.
  - **The mean pot** is smaller under ROUTE on all 48 units of S273, S351F and S357F (`-49.864%` to `-86.676%`). It is larger on
    all 16 of S025's (`+44.127%` to `+108.046%`).
  - **The pot capped at the estate cap** is lower on 31 units and higher on 33.
    - Lower on all 16 of S273's (`-£336,632` to `-£1,672,275` a path), on S351F's 8 pension units, and on 7 of S357F's 8
      pension units (S357F-Rp4t-Y75 is `+1.700%`).
    - Higher on all 16 of S025's, and on the ISA units of S351F and S357F.
    - So it is lower on 23 of the 32 pension units and on 8 of the 32 ISA units (S273's).
  - **Lifetime tax** is higher under ROUTE on 51 of the 64 units: all 48 of S025, S351F and S357F, and 3 of S273's.
    - On S357F the extra tax is `+£799,919` to `+£1,524,544` a path. On each of its 16 units that is larger than the unit's
      change in the capped pot.
    - On S351F the extra is `+£133,958` to `+£227,179` a path, larger than the capped pot's change on 14 of its 16 units.
  - **Why the pot is smaller is not traced here.**
    - On the 48 units with a smaller mean pot, ROUTE also spends `+4.307%` to `+17.433%` more on the paths both keep. That
      lowers the pot by itself.
    - The household moves the riskier holding down to the safer person's risk on S025's units too, and there ROUTE's pot is
      larger.
    - The survival gain over the app's rules is about the same at one, two and three profiles apart on the same couples and
      paths (the dress rehearsal: `+10.492`, `+9.404` and `+8.581` points, `results-couples-any.txt`). So this read does not
      show the gain comes from the move down either.
  - **This read compares ROUTE with the app's rules, on the mean pot.** The reviewer's light look on D148 (MINOR 3) compared the
    household route with today's two-table route, on the median pot, on one unit (S123-Rp3t-own). At four profiles apart the
    household route's pot was higher there; at five, about `30%` lower. ROUTE against today's route at four and five apart is
    not measured.
- **What the stamp pins** (the reviewer at the read, MINOR 4). Under `APART=1` the audit's stamp covers the rehearsal's panel
  file and its batch script, not `couples-apart-panel.json` or `batch-couples-apart.sh`. The gate does not compare each unit's
  target or arm A's label with the panel's. It did not bite: every unit's target, arm A's label, class, kind and holding match
  the committed panel (the reviewer's check from the unit arrays).

## What it means

For these couples, four and five profiles apart, the household route keeps about nine points more paths than the app's rules,
and spends more on the paths both keep. That is the rule's pass, and nothing changes: such couples stay on the household
route, as D148 put them.

Beside it, deciding nothing, is the trade D116 names. Where the household plan keeps more paths and delivers no less
spending, a smaller pot left is recorded, not a bar, so it is counted here up to the cap and in pounds a path. On three of the
four couples the mean pot is smaller. The capped pot is lower on 31 of the 64 units. On S351F and S357F, lifetime tax is higher
by more than the capped pot moves. Why is not traced here.
