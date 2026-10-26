# The smaller cuts: how to port them and test them (instructions for the agent, 26 Oct)

## The decision this carries out

The maintainer, 25 Oct: "do another sweep and see what more time savings can be made", then "test all the best
candidates". The sweep is the last section of `SPEED-GROUNDWORK.md`, its figures in `results-speed-sweep.txt`. This is the
port of the four cuts that touch only the candidate's path, to carry out once the maintainer says so, after
`SPEED-PORT.md`'s steps 1 and 2. Record the decision in their words in STATE.md as the next D-line, in this form:

> The smaller cuts (SPEED-PORT-2.md): E7, E8, E9 and E11 as exact speed-ups in E5's path. E10 is not ported now (it
> speeds the product's solve more than the candidate's). Gate 5 is measured after.

## What it is

Four changes in `src/solver/solve.js`, and the reader's split handed to `readValues` in `grid.js`. All four sit inside E5's
block (the joint tier state's loop with `tableDealing: false`), so the product's path and the candidate as it stands do
not change. `scripts/speed/e11.patch` is the prototype that was measured: the whole diff to your code at 52b0b6c, with E5
and the cache as in `e5.patch`. E6 and E10 are in it too: do not port them.

1. **E7, each move's mixture once a cell.** Phase B sums each move's score over the worlds once for every layer held, and
   the sums differ between layers only by the switch charge. Take the sum once for staying (no charge) and once for
   switching (the charge added to each world's term, as now). Each layer then takes the one its move needs. The additions
   are the same, in the same order.
2. **E8, the memo keyed by an id.** Hash each base move's position (its 14 words) once a cell to an id; a tier variant
   takes its base's id. The memo's key becomes three integers (the id, the growth class, the layer and world read). Today
   the 14 words are hashed again for each world.
3. **E9, next year's tables once a year.** Look up the four next-year tables of each world and layer (`lsurv`, `beq`,
   `lresil` and `short` at t + 1) once a year, not once for every move and world.
4. **E11, the bridge reader's split once a year.** For each world and layer, find what `readValues` would find in
   `g.reader.of` once a year, after the year below has built it, and hand it to the read.

What was measured (this machine, two jobs on two cores):
- each of the four alone, and all five cuts together, gives E5's tables bit for bit: S224 at 6 points and S370 at 4,
  every value. The four together give E5's hash at 45 points on S126, S248 and S370;
- each plant parts them, on top of all five (E11's on S370);
- the four together at 45 points: S370's solve 517.0 s against E5's 577.5 s (10.5% less), S126's 390.1 s against 438.7 s
  (11.1%), S248's 409.9 s against 485.7 s (15.6%);
- gate 5 against the product as it stands, over four cores at E2X's 4.3 to 3.7: S370 0.82 to 0.96, S126 0.60 to 0.70,
  S248 0.66 to 0.76. After the first port alone the same reading is S370 0.92 to 1.07;
- the split keeps its speed-up with the four in: S370 1.97 times on two parts, alone on the machine, the same tables.

## Step 1. The port

1. The four go inside E5's block, on whenever E5 is. One test-only option, `tsLean: false`, turns all four off for the
   identity test. It goes in `meta` when set, so the fair-test diff sees it.
2. Each keeps its test-only plant, as in the patch: `mixOncePlant: 'swap'`, `postIdsPlant: 'pen'`,
   `hoistNextPlant: 'layer0'` and `readerDirectPlant: 'world0'`.
3. `readValues` takes the reader's split as an argument (`rdGiven` and `rdIn` in the patch). Its other callers are
   unchanged.
4. Re-pin e3pcls after the change (D9).

## Step 2. Its tests

They join `speed-port.test.mjs`, each shown failing on its plant (CHECKLIST 5).

1. **Identity.** With `tableDealing: false`, every table must be the same bit for bit with `tsLean` on and off: on S224
   and S370 at 6 points, and S370 at 45. The candidate as it stands (the option unset) must be unchanged.
2. **The plants.** Each must part the tables, on top of the other three. Test E11's on S370: S224's bridge reader builds
   no table, so it cannot bite there.
3. **Not the memo's growth-class plant.** Under E5, `expMemoPlant: 'nocls'` parts nothing: the layer read fixes the tiers,
   and S224 and S370 have no tiers on the GIA. Use `'noworld'`: it parts 1,956,322 values on S224 at 6 points and
   1,437,011 on S370 at 4, with the four in or out.
4. **The split.** With the four on, the split must give the unsplit tables (S370, two parts, 4 points).
5. **The fast suite** passes.

**Time box:** two hours.

## Step 3. Then

Gate 5 as `SPEED-PORT.md` step 4, against the product as it stands.

## E10, for the maintainer

E10 is `gfnFast` in the patch: the tax gross-up without the list, sort and closures it built on every call.
- **It is exact.** 200,000 calls give the same answers, and the product's tables are the same at 30 points on S126, S248
  and S370.
- **It helps the app more than the candidate.** It makes the product's solve 9.8%, 10.0% and 6.9% faster on those three
  households, against about 1% for the candidate.
- **So it makes gate 5 harder.** With all five cuts, S370's gate 5 reads 0.88 to 1.02 against the faster product.
- **The call:** it changes no number, so D24's precedent lets it into the product's path now, and gate 5 then measures
  against the faster product. Or it waits for the product's changes after Phase 4 (D12).

## What to report back

- The identity hashes and the plants' counts.
- Gate 5's ratio on each household.
