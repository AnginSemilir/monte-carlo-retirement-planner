# N4: the richer move menu (Part B Step 6, D22), the design

EXPLORATORY, the tuning seed 7002. Part B Step 6 N4 of the external review of 21 Oct: "Add, as research options, the
moves the design describes and the code lacks (Part A, F2b): a ceiling at the higher-rate limit, a midpoint in each band,
selling the taxable account up to the capital gains exemption. Run each through V4's ensemble on the six V3 households.
Adopt a move only where it beats the current menu by more than the targets." It runs after V3 and V4 read on the ported
code, and before N1 (D22); Phase 4 registers after it reads, so Phase 4 tests the final menu.

## The question

Does any of the three move kinds beat the current menu by more than D4's targets (0.2 points on the panel mean, 0.5 on
any household, in survival and in the whole score, at both estate weights) on V3's seven households (S362, S370, S224,
S380, S248, S002, S330)?

## The three kinds

Each is a research option (`opts.menuPlus`, a list of kinds), off by default. With it off, the menu, every table and
every outcome stay the same bit for bit.

1. **HR, a pension ceiling at the higher-rate limit.** The rUK schedule's rising corners in gross income are the
   allowance (0% to 20%), the basic-rate limit (20% to 40%) and the taper threshold `P.thr` (£100,000: 40% to 60% while
   the allowance is withdrawn). The higher band's own top (£125,140) is a falling corner (60% to 45%), and by the
   corner argument a draw never stops at a falling corner: if a pound at 60% is worth drawing, so is the next at 45%.
   So the ceiling is `P.thr`. The taper applies in Scotland too, where it is a rising corner as well. New token
   `penHR`, a fifth draw-first prefix after `penBasic`, and a re-wrap ceiling `hr`. That gives 5 prefixes × 2 orders ×
   4 re-wraps = 40 moves, against 24.
2. **MID, a midpoint in each band the menu stops in.** Half the allowance, and the middle of the basic band
   (`(P.pa + P.higherRateStartsAt) / 2`). Each is a draw-first ceiling (`penPAm` and `penBm`, two more prefixes) and a
   re-wrap ceiling (`pam` and `bm`). That gives 6 prefixes × 2 × 5 = 60 moves. The higher band's midpoint comes in
   only if HR joins.
3. **CGT, selling the taxable account up to the capital gains exemption.** This happens after the re-wrap and before
   the year's CGT bill. Where the taxable account holds a gain and this year's realised gains are below the exempt
   amount, the move sells enough that the realised gain reaches the exempt amount. The proceeds go to the ISA up to the
   room left this year; the rest is bought back in the taxable account at cost, so its basis rises by the gain
   realised. A new move field, `cgtHarvest`, doubles the menu: 48 moves.

## Where each kind is carried

Each place carries a kind the same way, so V2's state check holds on it:

- **The engine (App.jsx `stepYear`):**
  - The three pension loops (the one-off cost, living costs and the re-wrap) read a token's ceiling from one map.
  - The CGT sale is a new step between 7b and 7c.
  - A new token reaches the engine only through a research table. The product's menu and its own policies are
    unchanged.
- **The solver's model (`model.js`, couples):** the same changes as the engine.
- **The forward run (`fast.js`):**
  - Step codes 6 and up for the new tokens, in `drawStep`'s switch.
  - The re-wrap ceiling's values.
  - The CGT sale.
- **The menu (`solve.js` `buildActions(opts.menuPlus)`):**
  - S1's memo keys the post-state, so it is unaffected.
  - S2's shared year keys moves by their flows. It stays on under `menuPlus` only if `chooser-share.test.mjs`'s
    check passes on each new menu; otherwise it is off there.
- **The labels:** `bridge.js`'s short names, the move's label, and the instruction sheet's vocabulary (App.jsx) where a
  token can reach it.

## Tests

Each test is shown failing on a plant (CHECKLIST 5).

- **Identity, with `menuPlus` off:**
  - `solver-memo`'s and `chooser-share`'s table hashes are unchanged.
  - The e3pcls pin's tables hash the same after the re-pin.
  - V1 and V2 pass.
- **Flows by hand.** For one household-year per new move, the engine's pots are checked to a penny against a hand
  calculation:
  - a `penHR` draw through the basic band into the higher;
  - a midpoint draw and a midpoint re-wrap;
  - a CGT sale with the ISA's room part used, and one with no gain to take.
- **V2's state check on each new menu.** The engine and a forward run stay in step, every slot within a pound.
- **The plants:**
  - HR's ceiling read as the higher band's top in `fast.js` only.
  - The CGT sale's rise in basis left out in `fast.js` only.
  - A midpoint taken from the wrong band.

  Each plant must fail the state check or the hand check.

## The run and its read

- **The run.** V4's harness (`v4-ensemble.mjs`) gets three variants: CAND+HR, CAND+MID and CAND+CGT. Each runs on V3's
  seven households at both weights, on V4's seed and path count, so it is paired with V4's CAND unit on the same paths.
- **Cost.** The solve grows with the menu (40, 60 and 48 moves against 24), so about 7 core-hours, two hours on four
  cores.
- **The read.** By D4's targets, against CAND:
  - A kind joins only where it beats the current menu by more than the targets. Otherwise it is recorded and dropped.
  - If two kinds both pass, they are tested together as a factorial (D6) before either joins.
  - A kind that joins changes the candidate after 7u-F, so Phase 4 carries its no-harm item against SHIP (section 6).
- **HOW-IT-WORKS.** Section 4 already states the menu the code offers (e80fa96), which is N4's "either way" item. It
  changes only if a kind joins.

## Acceptance and time box

- **Acceptance:**
  - With `menuPlus` off, every identity hash is unchanged.
  - Each kind's flows match the hand calculation.
  - V2's state check passes on each new menu.
  - Each plant fails.
  - The read is printed by the reducer from the units.
- **Time box:** the build and its tests by 25 Oct 18:00 UK, the runs and the read the same evening. If the box runs out,
  the build stops and the state goes to the maintainer.
