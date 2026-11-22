# Open decisions and where the plan stands (1 Nov)

An index for finalising the plan. Each item names the file that holds its detail. Where the work stands in full is
`STATE.md`; the rules are `CHECKLIST.md`. The plan from 1 Nov is the launch plan
(`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 0e24e1b), adopted by the maintainer as
D51 to D54, and at 90fcb10 since D58 (step U, Phases 11 and 12 and Part D's D5 recast).

## The order from 12 Nov (D91)

The maintainer, 12 Nov: the app is for the maintainer alone for now and has not been launched properly; the link and the
repository are public, knowingly. So no beta with users is under way and nothing waits on a beta's end. Where a line
below this section says "the beta", read it as history. The order from here:

**OPEN (22 Nov, early), found by the full tier on D138's build, for your word: an unlock, by name, for four protected
tests' hand-built moves.**
- **What.** Four tests of the fast tier (protected) build the move they hand the engine by hand from the solver's action:
  `state-check.test.mjs` (V2's state check), `n4-menu.test.mjs`, `speed-port.test.mjs` and `tier-steps.test.mjs`. None
  hands the engine the move's `windfall` or `save`, as the engine's own policy does (`src/solver/bridge.js` `withTable`).
  Since D138 a working saver's move carries `save`, so on a working saver under the new default the engine runs the plan's
  own saving where the forward run runs the move's.
- **Where it shows** (`results-d138-lockstep.txt`, in D138's build until its commit; EXPLORATORY). V2's state check in full (`state-check-full.test.mjs`, the
  full tier) fails 3 of 14 on the build: S224 parts (the pension £904,569 apart at the worst), 194 mismatched moves. The same test with its builder handing the engine
  `windfall` and `save` (a copy, the protected file untouched) passes all 14, the pension in step to £1.9e-9 (S224) and no mismatched move. The
  fast tier's quick forms reach no working saver and pass. The `--full` forms of the other three are not in the full tier;
  two of them name S224.
- **The same class as D73's `sweepIsa`**, answered then under D82's unlock. The same builder, unprotected, is fixed in
  D138's build: `gaps-sweep.test.mjs` (12 of its 60 cases had failed, on S224 and S330F; all 60 pass with the fix) and
  `allowance-both.test.mjs` (passing before and after).
- **The ask:** the unlock for exactly those four files' builders, the two fields added as `bridge.js` has them, each file
  named in its commit; no figure any of them pins moves (each run before and after).
- **The agent recommends it.** Until then the full tier is red on `state-check-full.test.mjs`. B1's gate needs both CI
  tiers green on the batch's release branch (D92), so batch 11 waits for this unlock.

**OPEN (21 Nov, night), from the reviewer on D138's change of default (MINOR 6, `reviews/2026-11-21-default-save-split.md`),
for your word: two unlocks, by name, for what D138 adds that no protected file records.**
- **The couples' exclusion.** A couple's solves keep the savings split off on both of the page's routes (`src/solverApp.js`
  `solveForApp`, a solve with a partner's age). Only `save-default.test.mjs` check 4 pins it (the full tier, unprotected).
  Every other decided couples default is pinned against the decided-defaults block by `couple-default.test.mjs`
  (protected), and the block's `couples` entry says nothing of it. The ask: the unlock for `couple-default.test.mjs`, so
  that the block's `couples` entry records the exclusion and the test pins it there, with a plant.
- **The fair-test rows.** `fair-variables.mjs` (protected) has no row for the split's two keys (`saveSplit`,
  `saveIsaFirst`), now candidate keys; D73 (rows 35, 36), D81 (37, 38) and D93 (39 to 43) gave each new setting a row. The
  settings line each run records names the menu's size, which catches the copies and the hold indirectly, but a
  registration's fair-test table does not list them. The ask: the unlock for `fair-variables.mjs`, one row for the two.
- **The agent recommends both**, in one unlock, each protected file named in the commit that edits it. Until then D138's
  D-line says each is missing and why.

**OPEN (21 Nov, night), from test K's read (D137 (4)), for your word: does the app ask how an employee pays into their
pension?**
- **Where it comes from.** Test K (EXPLORATORY; `results-save-k.txt`, `reports/2026-11-21-save-k-read.md`) read THE CAUSE
  HOLDS IN SIZE. By D137 (4), the change of default prices the split's routes at the law's price for a salary sacrificer:
  employee NIC relief on the first £2,000 a year alone from April 2029, in full before (`src/App.jsx` `SAVE_NIC_CAP`).
- **What it leaves** (corrected on the reviewer's second look at K's read, finding 1, `reviews/2026-11-21-read-save-k-2.md`;
  that FAIL stands after one fix, so this entry and K's write-up are yours, D81 (F)).
  - An employee who pays in by net pay or relief at source is relieved of income tax only, in every year. The app cannot
    tell the two kinds of employee apart, so it prices every employee as a sacrificer.
  - As the app prices it (the whole pension figure taken as the employee's own sacrifice), from April 2029 an employee's
    pension first is K's on all 30 of the panel's employees: in `260` of their `260` working years from 2029, to the
    penny (the change's identity, `results-save-default-identity.txt` part 2, in the change's build).
  - So the question decides the routes of 2026 to 2028 alone: `90` of the 30 employees' `350` working years with a
    saving to place (`results-save-k-beside.txt` A). Nothing measures them.
  - K (`0.726`; the 13 basic-rate employees outside the three `0.580`) is the share of the gain at K's price against the
    engine's uncapped price, in every year, with the ISA first offered. It is not the change's arm.
  - In law the cap counts the employee's own sacrifice, which the app does not record: its pension figure includes the
    employer's part.
- **The ways on:**
  - **(A)** Ask it: one question beside the employment status ("salary sacrifice", "net pay or relief at source", "not
    sure"), the split pricing each employee by their own route. The app's own contribution strategies could read it too.
  - **(B)** Leave it: every employee priced as a sacrificer, the D-line saying so.
- **The agent recommends (A), with the work on the screens:** "salary sacrifice" the default answer, as the app assumes
  today. Until then, (B) stands, said in the change's D-line.

**RULED (21 Nov, evening, D137): the savings split's change of default, built and not committed.** The maintainer: "Unlock
enforcement. Go ahead with your recommendations": (C) for the time, the speed work right after the change; the unlock for
`candidate.test.mjs`'s pins, the three joining tests taking their solves without the split; the deep review's test K on
seed 7025's first 4,000 paths before the change is committed (D110's form); ISA first held back for an employee, with its
test and plant. The change is D138's, once K has read and the reviewer on the change of default has passed it. The items
as they were put, kept as history:
1. **The time and the speed mode for a working saver** (the reviewer at the read, MINOR 1;
   `results-save-v2-beside.txt` section A).
   - **The cost.** With the split, a working saver's path takes about twice as long on anchors, the menu the app solves on:
     each arm's CPU a path, the median `x2.10` (`x1.84` to `x2.31`). The solve takes the median `x1.10`. So the page's
     figures for a plan still saving take about twice as long. Gate 5 does not move, since its four households are all
     retired.
   - **The speed mode does nothing for them.** A menu with the split's copies sets `r.nAt`, which takes P1's memo and the
     chooser's shortlist off in every year (`src/solver/solve.js` `decisionRepeats`, the chooser's `shortMask`). The speed
     mode is the shortlist alone, so its "faster" would not hold for a working saver.
   - **The ways on:**
     - **(A)** Take the change as registered now, with the time cost.
     - **(B)** Exact speed work first: P1's memo, and the shortlist, kept in the years where the copies are left out, each
       with its identity test. Then the change, the time measured again. Box: half a day to a day.
     - **(C)** Both: the change now as in (A), and (B) queued right after it as its own change.

     In (A) and (C), the speed mode's words are yours to change for a plan still saving, or to keep.
   - **The agent recommends (C).** The registered PASS makes the change. You took the same kind of trade for a couple's path
     (D109). The memo is most of the loss: a five-working-year plan scores three times the moves in 5 of 41 years, which
     alone would cost about `x1.25`, and it costs `x1.90`.
2. **An unlock, asked for by name, before the change's commit:** `research/tests/candidate.test.mjs`'s pins. The candidate
   moves from 17ff82379838 to bf1cac401c13; the new check pins `BEFORE_D137_OPTS` at 17ff82379838, and D90's check is
   re-based on it.
   - The classifier refused the edit as a re-pin of a test's expected value, and the agent has not worked around it.
   - The exact edit is kept as `research/solver/drafts/d137-candidate-test.py`, a script that applies it.
   - **The fast tier on the build** (`results-d137-fast-pins.txt`): 73 of 77 pass, `chooser-share` among them (see item 5).
     `check-state` fails only on STATE.md's printed candidate line, which the change's commit takes. Three tests of the
     joining list fail, each on a working saver the split now reaches:
     - `windfall-relief.test.mjs` check 6 (pinned under D83's unlock): S210 with its deposit removed, 14c9a95ebb1b8c49 to
       5c3195f474943629; S210 with its deposit typed into the taxable account, 70e557bd71a3d75b to 11666732d554a51f. S116,
       retired, is unchanged.
     - `chooser-tie.test.mjs` check 1: S328F's paths with the option off, against the code before the option,
       f2fe4e1e6d872dc3 to 41612ebb2cf51a77.
     - `chooser-shortlist.test.mjs` check 1, the same S328F digest; checks 2 to 5 have nothing to test, since the split
       leaves the shortlist idle on S328F (item 1).
   - **The working:** each of the three, run on the build with the split taken out of its solves, passes whole with every
     figure as pinned. So the split alone moves them.
   - **The agent proposes** that each of the three takes its solves without the split, every pinned figure the same, as
     `save-split`, `windfall-split` and `isa-allowance` now do. These tests check another option's identity, and the
     split's own effect is tested by `save-default.test.mjs`. The other way is to re-pin the three figures to the new
     digests; `chooser-shortlist`'s checks 2 to 5 would still need the split out. The unlock asked for covers whichever you
     choose, named in the commit.
3. **Done without an unlock, to say so:** three tests of the full tier now solve on the candidate before D137, so every
   figure they pin stays the same: `save-split`, `windfall-split` and `isa-allowance`. None is protected.
   - `solve.js` refuses the windfall split beside the savings split, so those tests would otherwise fail outright.
   - Without the re-base, `save-split`'s "option unset" arm would become the option on.
   - Say if you would rather they waited for the unlock.
4. **The deep review** (`reviews/2026-11-21-deep-save-v2.md`) finds the PASS sound for what it tested. Two of its items bear
   on the change of default.
   - **ISA first for an employee moves the employer's money** (its section 4, item 1).
     - The app asks for the pension contribution gross, "including tax relief and employer amounts" (`src/App.jsx`). The
       split's budget prices all of it as the employee's own sacrifice.
     - So ISA first puts the net cost of the employer's part into the ISA. In law that is stopping a workplace pension and
       forfeiting the employer's money.
     - On the panel ISA first is 17% or more of the decisions on six younger employees, who carry 22% of the gain. The cost
       of holding it back is not measured.
     - The app's own contribution strategies build the same budget, so this is inherited, not new. The split would make it
       the solver's default and this year's action on the page.
     - **Its recommendation, which the agent shares:** until the plan records the employer's part, an employee's split
       offers the plan's own saving and the pension first. ISA first stays for the self-employed. This is a change to the
       split's routes, with its test and plant. The other way is that you take the trade, with words saying what ISA first
       means.
   - **The leading cause of the employees' 87% of the gain** is the price the engine puts on an employee's pension pound:
     salary sacrifice relieved of employee NIC, uncapped and for every employee. Only the split's arm reads that price.
   - **Its one test** (EXPLORATORY, its rule committed first): the 30 employees' plans priced on income tax relief alone,
     the split on anchors, with an identity arm and a control, reading K, the share of the gain left at that price.
     - **K at least 0.85:** the default goes ahead as the PASS has it.
     - **K from 0.33 to 0.85:** the default goes with the law's price in the split's routes (D134 (3)'s cap brought
       forward).
     - **K under 0.33:** the default is held for employees and comes back to you.
     - **Its seed is yours.** Seed 7025's first 4,000 paths, the registered arms' own, cost about 5.5 core-hours. That is
       D110's form, run directly as a tracked task, since the launcher refuses a reserved seed outside its registration.
       Otherwise seed 7002, with the two arms beside it, costs about 13 core-hours. The build is half a day.
   - **The agent recommends** running the test before the change is committed, on seed 7025 (cheaper, and paired with the
     registered arms), and holding back ISA first for an employee as above. The time (item 1) goes with it as (C).
5. **A defect the fast tier found on the build, fixed with a test of its class** (CHECKLIST 7; `results-d137-fast-pins.txt`).
   - **What it was.** Under the split, the chooser scores each market world's table. In a year where the copies are left
     out, the year's shared flows (`src/solver/solve.js` `decisionFlows`) are taken for the year's moves alone, but each
     world's table did not carry the solve's moves a year. So the worlds scored the copies from flows left over from an
     earlier decision, and the chooser's argmax, over every move, could pick one on them. `movesAt`'s own comment meant those
     copies to be unchoosable there; the mask reached the solve, not its worlds.
   - **How it showed.** `chooser-share.test.mjs` (protected) on S224 under the split: the shared flows and `scoreMoves`
     parted at move 800, a copy, in year 5.
   - **The fix** (in the build): each world's table carries the solve's moves a year (set on `r.worlds` at the solve's
     finish), and `movesAt` also gives the moves it makes unchoosable a tax of nought, so both scorers agree on every move.
     A solve with no split's copies is untouched (`movesAt` returns at once). `chooser-share` passes on the build.
   - **Its test:** `save-default.test.mjs` check 6, on S188 under the split: every world carries the moves a year; with the
     share check on, the two scorers agree at all 820 decisions of 20 paths; no decision picks a copy in a year it is left
     out. Its plant `nattables`, the worlds left without it, fails exactly check 6.
   - **Its reach, measured as far as it goes.** A probe (EXPLORATORY, seed 7002, light settings; S188 and S224, 100 paths
     each) found the stale copies never won: no copy picked in such a year at any of 8,200 decisions, and the decisions and
     outcomes the same with the shared flows on and off. So it is not shown to have changed a decision.
     - Whether it changed any decision in the registered run cannot be read from its records, which keep the save only in
       the working years.
     - The windfall split's copies, research and closed, had the same defect; the fix covers both.
   - **Corrected (21 Nov, night; the reviewer on D138's change of default, MINOR 3,
     `reviews/2026-11-21-default-save-split.md`).** No decision could change on the stale flows, in the registered run or
     anywhere, so "could pick one on them" and "cannot be read from its records" above are withdrawn:
     - the centre world is the solve itself (`solve.js`, the worlds built `k === centre ? r : {...}`), which carried the
       moves a year before the fix;
     - its scorer makes each copy left out unchoosable (`movesAt`), and the mixture fails a move that fails in any table;
     - so a left-out copy's combined score was minus infinity at every decision, whatever the other worlds read.
     - What the stale flows reached was the other worlds' scores and tax for those copies, which the share check (a test
       mode) compares, and work wasted on them. Check 6's count of copies picked is a guard its plant cannot fail.

**OPEN (20 Nov, evening), found while porting step 8; nothing decided, for your word:**
1. **The speed mode reaches the household plan's table, unmeasured.** The opt-in "Beta - speed mode" (D97 (3)) hands a
   solve the chooser's shortlist, and since the household default (D135) a couple's one table takes it as a single's does.
   Its couples' warning ("usually only a little faster, spent a little less, ... about 5 in 1,000") was measured on
   today's two-table route (SPEED-B). On a household nothing was measured: on S025-own at light settings, 185 of 200
   paths end differently with it on (EXPLORATORY scratch, not kept). Options:
   - leave it, the warning saying couples are less tested;
   - measure it on the household (an EXPLORATORY read like SPEED-B's couples);
   - or keep the speed mode off for couples.

   The agent recommends measuring it before the next batch merges, and meanwhile leaving the warning as it stands. The
   reviewer on the change of default agrees (`reviews/2026-11-20-default-household.md`, finding 5). The measure is ready:
   `SPEED-H.md`, its rule committed, on SPEED-B's twelve couples, EXPLORATORY.

   **Read (20 Nov, 22:04 UK): HOLDS** (`results-speed-h.txt`, beside it `results-speed-h-beside.txt`;
   `reports/2026-11-20-speed-h-read.md`; the reviewer at the read PASS, four MINOR answered,
   `reviews/2026-11-20-read-speed-h.md`). On the household the speed mode loses nothing beyond item 7's bars:
   - pooled survival `-0.008` points (`-0.030` to `+0.013`);
   - spending `-0.0082%`;
   - the capped pot `-0.034%`, the part nearest its bar.

   S047 carries nearly all of the spending and capped pot. Without it they are `+0.0006%` and `+0.003%`; S047's own capped
   pot is `-0.442%`.

   The largest loss on a unit, `-0.050` points, is a point estimate. Every unit's interval stays above the warning's 5 in
   1,000, and S047's reaches lowest, to `-0.273`.

   The twelve are of one shape: 60/40, three years apart, each with its own minimum pot. A path and its solve take the median
   `x0.72` of the time, a guide (WHOLE was timed first, which flatters SPEED by a few percent). Beside it, SPEED-B on today's
   route, the same twelve couples: LOSES on spending (`-0.0683%`), at `x0.82` by the same measure.

   The couples' warning's figures ("about 5 in 1,000") are SPEED-B's, and today's route is still what a couple the household
   plan refuses takes. Whether to keep its words or change them is yours. The agent recommends keeping them as they stand:
   they err towards caution, and twelve couples of one shape on one seed is a narrow read.
2. **FIXED (D136's fix round): under the speed mode a couple's shown decisions were made on the shortlist, on either route.** This year's actions,
   the next years and the rows (`src/solverCouple.js`) run the couple's policy as it is. D90's guard, that a decision the
   pages show is made on the whole menu (`src/solverStrategy.js` `shownPolicy`, `research/tests/shortlist-shown.test.mjs`),
   wraps only a single's views. This predates the port, and is a defect by D90's words. The agent proposes to fix it with a
   test of its class (a couple's and a household's shown decisions the whole menu's under the speed mode, the paths that
   count keeping the shortlist) after the reviewer's verdict on the change of default, in the same batch.

**RULED (D135, 20 Nov, evening: "Unlock enforcement, launch"): the two items below. Seed 7025 reserved and the savings split's v2
launched as registered; the late tail's rule taking the build on, the unlock covering `couple-default.test.mjs` for step 8's
change of default.**
1. **The late tail, read twice: by the rule, step 8's build goes on to `main`** (D134 (1); `results-late-tail.txt`,
   `results-late-tail-2.txt`, `reports/2026-11-20-late-tail-read.md`; the reviewer again PASS, three MINORs answered,
   `reviews/2026-11-20-read-late-tail-2.md`).
   - **The first read** printed THE GROWTH with CEIL NEAR K2, which would have stopped the build. The reviewer FAILED it:
     its CEIL arm ran through a recorder that dropped the tiers held, so CEIL's chooser weighed no switch charge (the
     engine still charged each switch)
     (confirmed; no other wrapper of a chooser in the research or the app drops it).
   - **The fix and the second read:** the recorder fixed with a check of its class (amendment 1); CEIL run again alone on
     the ten units, each held to the first run, whose other arms the fault did not touch. Second read, by the same rule:
     THE GROWTH. CEIL restores `-21.1%` of D, not `87.4%`, so by the rule's measure the table does not read the couple as
     safer than it is. The read does not test the deep review's other sign of a gap: HSPA's forecast above what it
     delivers on four of S273's units, by `0.52` to `0.82` points (`reviews/2026-11-20-deep-household-hsp.md`, item 4).
     THE GROWTH is a lead, not a shown cause: R, which explains it, keeps fewer paths than HSPA on every unit.
   - **What the rule decides:** the build goes on to `main` on B1's gate, this read reported. Left: the words, the default
     and its pin (`couple-default.test.mjs`, which needs your unlock), the identity at 45 points, the reviewer on the change
     of default, and the gate.
   - **The trade, beside the rule:** on the seven units below nought HSPA keeps `28` paths fewer than K2 in `28,000` and
     ends the worst tenth `£52,873` a path lower; step 8's registered read has HSPA ahead over 40 held-out units, pooled
     `+0.762` points. A wish to hold couples to survival more strictly than singles would be yours to ask for, not a
     build (`LATE-TAIL.md`'s words).
2. **The savings split's v2 is ready to launch** (`registrations/save-v2.md`; the design review PASS on its final look,
   `reviews/2026-11-20-save-v2-design-2.md`). It waits on your typed unlock to reserve seed 7025 for `save-v2*.md` in
   `check-prediction.mjs`, that edit alone, and your word to launch: about `12.3` hours on four cores.

**RULED (D134, 20 Nov, morning: "Go, test beside", "Yes, come back", "Run as is"): the three decisions below, each as the
agent recommended.**
1. **Step 8 read PASS, and M1 names one unit, so the couples' default waits for your word** (`results-household-hsp.txt`,
   `reports/2026-11-20-household-hsp-read.md`; the reviewer at the read PASS, three MINORs answered; the deep review
   `reviews/2026-11-20-deep-household-hsp.md`).
   - **The rule, HSPA against K2 on 40 held-out units:** no unit flagged by D34; pooled survival `+0.762` (`+0.718` to
     `+0.807`); spending on the paths both keep `+1.7223%`.
   - **M1's unit, S273-90:** `81` more paths kept, but `-0.1665%` spending on the paths both keep and a capped pot
     `-1.034%`.
   - **Beside:** three units lose survival beyond noise but under D34's threshold (`-0.200` to `-0.281`, each interval
     reaching past a quarter point); S357F gains nothing pooled; the near-even shape gains nothing beyond noise; HSPA's
     paths about three times as fast as K2's.
   - **The deep review's leading cause, a lead:** the household table's thinner late cushion, the paths it loses failing
     late. **Its one test,** about a day: whether that is the table's own trade (the default then a word on that trade)
     or the table reading the couple as safer than it is (design B before the default).
   - **The agent's recommendation:** go, the build begun now (the household plan in the app's solve of a couple, shown
     identical to the tested arm path for path, the reviewer on the change of default), the deep review's test run beside
     it, and nothing to `main` before the test reads: if it shows the table over-reading the couple, the build stops there
     and comes back. The other ways: the test first and then the word; or hold, today's default staying.
2. **The savings split's v2, the design review's MINOR 2: a spending harm on anchors** (`reviews/2026-11-20-save-v2-design.md`).
   Anchors is the menu that ships, and the factorial's S308F harm was seen there, but under a PASS only D34's survival flags on
   anchors come back to you (D133 (3)). **The agent's recommendation:** under a PASS, each household failing part 3's
   household clause on anchors, and the pair on anchors if its pooled survival interval lies wholly below nought, also comes
   back to you before any change of default, deciding nothing in the rule. The other way: the registration says plainly that
   a spending harm on anchors does not stop the change.
3. **The savings split's v2, the design review's MINOR 3: the 2029 cap on salary sacrifice's NIC relief.** The engine leaves
   it uncapped (stated, not modelled: D112 (M6)), which favours the pension first, one of the split's two answers (about 11%
   more pension a net pound above the cap in the main band); 30 of the 40 households are employees. **The agent's
   recommendation:** run as is, the read printing beside the rule the share of the employees' decisions from 2029 that take
   the pension first (built), the limitation and its direction in the registration (written), and modelling the cap queued as
   its own engine change for every plan, not this test's. The other way: model the cap before the run, which changes the
   engine and so the landing, the pilot and the preflight.
- **Also yours, when ready:** seed 7025's reservation for `save-v2*.md` needs your typed "unlock enforcement" (an answer in a
  question dialog does not open the hook). The launch comes after the preflight, the pilot on the final files and the
  reviewer's look at the answers.

**RULED (D130, 19 Nov, morning: "Proceed"): the agent's seven recommendations after D129's queue, in this order.**
1. **The engine's ISA defect, fixed first:** a dated deposit or staged drip into an ISA counted against that year's
   subscription, in the engine, the exact model and the forward run, with a test of its class shown failing; sized on the
   library; to `main` with the next batch on B1's gate. Step 8's panel is then landed again on the fixed code.
   - **DONE (19 Nov), on the working branch:** `isa-allowance.test.mjs` (the full tier) passes on the fix and fails on the
     code before and on each of its two plants (`results-isa-allowance.txt`); gaps-sweep's case on such a year, its plant
     parting the forward run from the engine; the fast tier green, no figure pinned in it moving, so no unlock was needed.
   - **Sized** (`results-isa-allowance-sizing.txt`, EXPLORATORY): no library plan as entered holds such a deposit; under
     Windfall to ISA, 68 of 210 plans run differently on some path, each within one path of `1,000` on survival.
   - The code id moves from `603eeb595679` to `71fb4271c681`. **On `main`** with the ninth batch (pull request 20, b2ba847b,
     19 Nov). Step 8's panel is landed
     again after the arm read (item 2), whose outcome names the arm the panel's refusals follow.
2. **Step 8 held; HSP and HSP with the personal allowance at `k`** read by step 8's own rule on the lead test's 28 units and
   step 5's 28 shapes (EXPLORATORY, seed 7002, the fixed code), its rule committed first. Step 8 is registered on the arm
   that passes on every unit, or comes back with the units that flag.
   - **UNDER WAY:** HSPA built off in code (`household.mjs` `scale: 'pensionsPA'`; `household.test.mjs` (10d), its plant
     `pakdouble`). The rule is `HOUSEHOLD-ARM.md`, committed before any unit runs, with `audit-household-arm.mjs`,
     `reduce-household-arm.mjs` (its planted checks) and `batch-household-arm.sh`. Every unit was run through the gate at
     smoke settings first. **Launched** 19 Nov 08:37 UK through the launcher (task bm4u4jfjz, its log
     `results/household-arm-launch-1.log`; code 71fb4271c681, audit b5a75b884258), its runs done 13:55 UK, no restart.
   - **READ once: HSPA** (`results-household-arm.txt`; `reports/2026-11-19-household-arm-read.md`). HSP FAILS part 1,
     S191-90 flagged by D34 in whole paths (`26` net against `23`). HSPA PASSES all three: no unit flagged, pooled survival
     `+3.746` (`+3.542` to `+3.949`), spending on the paths both keep `+1.7544%`. Beside it
     (`results-household-arm-beside.txt`): a pass at 4,000 paths is weaker than at step 8's 16,000, and S191-90's is in
     sample; every arm that moved since the earlier runs is on a unit the ISA fix reaches. The reviewer at the read: PASS,
     four MINORs, each answered (`reviews/2026-11-19-read-household-arm.md`).
   - **Next, by the rule:** step 8 registered on HSPA. Its arm, the audit's plan checks and the panel's refusals become
     HSPA's; the panel landed again on the fixed code, the pilot and the sizing taken again; then the design reviewer's
     second round, seed 7024's unlock with it (item 4), and the registration to you before launch.
   - **Done (9c1dc08d):** the machinery switched to HSPA (its planted checks pass); the panel landed again on code
     71fb4271c681, the same eight couples and 40 units with every target and arm A's survival unchanged. The pilot on the
     fixed code ran (19 Nov 15:05 to 15:53 UK), and its sizing filled Paths and the pilot's figures (90f0757b).
   - **The design review's second round: PASS, four MINOR** (`reviews/2026-11-19-household-hsp-design-2.md`), each answered
     before the launch commit (`STEP8.md`): the 25 units the pilot did not run go through every check before any path (a
     preflight, two paths of seed 7002); under a PASS each unit M1 names goes to you with the read before the default
     changes; the gate's re-checks gain planted cases on a real record; the launch stamp is filled by hand. The edits move
     the audit's stamp, so the pilot runs again on the final files and the Budget is taken from it.
   - **Seed 7024 reserved** under your unlock (D131, 744eee1a). Done since: the preflight (the 25 units, none refused), the
     pilot again on the final files (its arrays the same as before the edits), the Budget (54.5 core-hours, about 14.8
     hours on four cores, one relaunch at the 12-hour limit), and the reviewer's third look at the second round's answers,
     PASS, two MINOR (`reviews/2026-11-19-household-hsp-design-3.md`: the Design review line fixed; eight of the gate's
     refusals without a planted case, each correct by inspection, left as they are before the launch on its advice).
     `registrations/household-hsp.md` is complete but for the launch stamp, filled by hand at the launch commit.
   - **Ruled (D132, "Yes"):** launched as registered on seed 7024 through the launcher from a worktree at the launch commit
     (its stamp `code 71fb4271c681 audit 4cc4d37c0c19`), about 15 hours, relaunched under `RESUME=1` at the 12-hour limit;
     read once by its rule. The savings split's v2 registration is drafted meanwhile (item 7).
3. **D80 lifted for the household table alone** (its tie-break kept).
4. **Seed 7024** reserved when the registration goes to its second design review.
5. **The guard kept as built**, so D129 (5)'s words on the couples card go with the next batch: **on `main`** with the
   ninth (pull request 20, b2ba847b, 19 Nov).
   - **IN** (`src/PlannerCards.jsx`): the words, and the planner harness's check 19 reading them, with its plant `gapwords`
     (the words before), to fail at the next gate.
6. **The windfall split closed**, no v2.
7. **The savings split's v2**, a registered test, after step 8; its registration drafted while step 8 runs.
   - **Its design drafted** (`SAVE-V2.md`, DRAFT, not run), and its registration drafted while step 8 runs
     (`registrations/save-v2.md`, DRAFT).
   - **RULED (D133, 19 Nov, night), each as the agent recommended:** the library has no held-out pool of single savers
     (of its 90, 27 were the factorial's, 58 touched by other runs, 5 untouched and none of them younger:
     `results-save-v2-pool.txt`), so v2 draws on the 63 no run has taken the split on, held out for this question and
     not from every run; 40 of them (the younger cohort's 10 and 30 of the 53 older); the pair on anchors beside on each
     household's first `4,000` paths, a household flagged there coming back before any change of default; the spending
     bar `0.1%`.
   - **Next:** its machinery built while step 8 runs (nothing heavy run); the panel, the pilot and the sizing when the
     cores are free; seed 7025's reservation, your unlock of `check-prediction.mjs` by name, asked for when the
     registration goes to its design review.
- **Unlocks:** "Proceed" does not open the hook; each protected edit or moved pin in a fast-tier test is asked for by name.

**RULED (D129, 18 Nov, evening: "Go ahead. Add the windfall and savings tests to the end"): the agent's seven
recommendations after D128, in this order, then B7's two factorials at the end.** Each run is EXPLORATORY on seed 7002,
its rule committed before it runs; none changes anything in the app on its own.
1. **DONE: the decomposition of the household plan's three losses** (S191-90, S333F and S335F, wholly below the lead
   test's bar), read once (`results-household-decomp.txt`; `reports/2026-11-18-household-decomp-read.md`).
   - S333F RESTS ON THE BANDS; S191-90 and S335F EITHER.
   - Leaving the bands single recovers `99.0%`, `67.3%` and `74.6%` of the paths lost. Once the bands are single,
     leaving the cap single as well adds nothing.
   - On the paths it recovers, the bands single spend no less and pay far less tax.
   - The reviewer at the read: PASS, four MINORs in the write-up, each answered
     (`reviews/2026-11-18-read-household-decomp.md`).
   - **READ: the remedy** its rule calls for (`HOUSEHOLD-REMEDY.md` and its amendment 1; the rule
     `HOUSEHOLD-REMEDY-READ.md`; `results-household-remedy.txt`; `reports/2026-11-19-household-remedy-read.md`). Three
     forms on the lead test's 28 units, each against today's couples' default (K2):
     - HSPB, the bands above two personal allowances priced at `k = 1/s` of the pensions' split: DOES NOT MEND
       (S191-90 `-7.000`);
     - **HSP, the bands and the tax-free cash cap priced at `k`: MENDS.** S191-90 `-0.625` (`-0.873` to `-0.291`), S333F
       `+0.125`, S335F `-0.150`; pooled `+1.163` (`+1.110` to `+1.213`) over the 28, no unit wholly below the bar;
     - HSPS, HSP with the year's need funded at the pensions' share: DOES NOT MEND (S191-90 `-0.650`, `-0.898` to
       `-0.314`).
     - HSP's pass on S191-90 is by `0.38` of a path, and S191-90 still loses beyond noise under it
       (`results-household-remedy-beside.txt`).
     - By the rule, step 8's registration is drafted on HSP (item 3). The reviewer at the read: PASS, three MINORs, each
       answered (`reviews/2026-11-19-read-household-remedy.md`). Among them, **M1 by unit:** on S023-db and S167 HSP
       keeps more paths but spends less on the paths both keep beyond noise, S023-db with the largest fall in the capped
       pot (`-13.055%`); the rule reads spending pooled, so the outcome stands, and step 8 names such units.
2. Design B, the axis (`AXIS.md`), is not built unless the decomposition points to it.
3. **DRAFTED ON HSP, ITS DESIGN REVIEW FAILED: TWO RULINGS ARE YOURS** (`STEP8.md`, `registrations/household-hsp.md`;
   `reviews/2026-11-19-household-hsp-design.md`: FAIL, three BLOCKING and seven MINOR).
   - The panel is landed: eight held-out couples, 40 units (`results-household-hsp-panel.txt`). The audit, read, sizing
     and batch are built with their planted checks.
   - **The pilot and the sizing are done** (`results-household-hsp-sizing.txt`; EXPLORATORY, seed 7002). Every unit runs at
     `16,000` paths: `44.3` core-hours, about `11.3` hours on four cores. The pilot's first run was refused by its gate on
     the gate's own fault (design A raises the no-earnings pension limit to a later retiree's pension saving), fixed, and run
     again (`STEP8.md`).
   - **The pilot points the same way as BLOCKING 1:** were its changes the truth, S273-sppart (`-0.50` points on 1,000
     paths) would be flagged at `16,000` with chance `0.901`.
   - **Answered:** the pooled interval by path (BLOCKING 2) and every MINOR. The pattern search
     (`results-pooled-bypath.txt`) re-read 28 pooled parts of 14 earlier reads by path: no verdict changes.
   - **BLOCKING 1, yours: HSP fails step 8's own rule on the read that took it.** By D34's whole-path harm rule, S191-90
     is flagged (25 paths against a threshold of 23). The choices:
     - (a) step 8 stays held, and an EXPLORATORY variant that also prices the personal allowance at `k` is read on the 28
       units by step 8's rule first;
     - (b) S191-90 runs on 7024 as a named replication unit whose flag fails the run;
     - (c) a PASS is read as advice, not a change of default.
     - **The agent recommends (a).**
   - **BLOCKING 3, yours: the tie-break and D80.** HSP's table carries the candidate's tie-break above the cap, which D80
     keeps out of a registered couples' arm. The choices: lift D80 for the household table, or run HSP without it.
     - **The agent recommends lifting it:** the household's move is the single chooser, where the tie-break has been the
       default since D95, and every read of the household plan ran with it.
   - **Also yours before launch:** the held-out seed (7024 proposed) reserved in `check-prediction.mjs`, a protected file,
     so your unlock. If the ISA defect is fixed first, the panel is landed again (about an hour). Step 8, the registered test, is held until those losses are fixed and re-checked on the couples that lose. Then its
   registration is drafted, put to the design reviewer and brought to the maintainer before launch.
4. **READ, FOR THE MAINTAINER: what keys D128's guard** (`results-guard.txt`; `reports/2026-11-18-guard-key-read.md`;
   its reviewer FAIL on the write-up, answered in one fix, then PASS).
   - With S147-db's DB pension, today's default still beats the app's rules on all four gap couples that did well
     without one: pooled `+7.150` (`+6.867` to `+7.402`). By the rule, NO HARM, so **the guard is keyed on the wrong
     thing**, and re-keying it is yours (a change of default). Nothing in the app changes until you rule.
   - With rent instead it is HARM, pooled `-0.500`, resting on S149@gap12 (`-6.850`).
     - The rent ran from now only on S149's two couples (pooled `-3.200`): the engine counts an income from its owner's
       retirement at the earliest.
     - On S337F's two it ran from the first person's retirement at 52 (pooled `+2.200`; `results-guard-beside.txt`).
   - **No key fits what has been seen.** Among the gap couples, the default has lost to the app's rules on four: S147-db
     at gap8 and gap12 and S061-dbpart at gap12 (each with a DB pension) and S149@gap12 with rent. It gained or held
     level on the other eight with an income.
   - **The choice:**
     - keep the guard as built: it errs towards the app's rules, and also keeps couples off where the default gains;
     - re-key it now: on what is not shown;
     - find the cause first: a decomposition of the default's loss on the harmed couples, holding arm A's own pick fixed
       or naming it.
   - **The agent recommends** keeping the guard as built and finding the cause before re-keying.
   - Item 5 (the card's words) waits on this ruling.
   - **The test, as ruled:** the four couples 8 or 12 years apart without a DB pension (S149 and S337F at gap8 and
     gap12), which step 5 read above the app's rules, given first S147-db's `£15,000` a year DB pension from the state
     pension age, then `£15,000` a year of rent instead; today's couples' default (K2) against the app's rules (APP).
     - If the DB pension brings the harm back, the guard stays. If it does not, the guard is keyed on the wrong thing,
       and re-keying it comes back to the maintainer as a change of default.
     - The rent case sizes the guard's reach past a DB pension (the reviewer's MINOR 1, below). Box: half a day.
5. Once item 4 has read, if the guard stays, the couples card says what was found: "In our tests the solver did worse
   than the app's own rules for some couples like this, so for now your plan follows the app's own rules in the classic
   planner." It goes to `main` with the next batch on B1's gate.
6. The first load's ceiling is left as it is. A later batch past it comes to the maintainer as before (D94 (2)).
7. The speed work on LOOKHOLD stays held.
8. **At the end: B7's two factorials**, the windfall split's and the savings split's (`WINDFALL-SPLIT.md`,
   `SAVINGS-SPLIT.md`), each arm saying which menu it takes (D73's reviewer, MINOR 3). A gain goes to the maintainer as a
   proposal; a harm goes to them at once.
   - **READ, FOR THE MAINTAINER: the windfall factorial** (`results-windfall.txt`; `reports/2026-11-18-windfall-read.md`):
     A GAIN AND A HARM, both small and in spending alone.
     - Survival: no effect beyond noise, on the panel (`+0.012` points) or on any household after Holm.
     - The harm: S026 spends `0.306%` less over its lifetime. The gains: five households spend more, by under a twentieth
       of a percent each.
     - The reviewer at the read: FAIL, four BLOCKING and three MINORs, answered in one fix (d32f4ed1); then PASS, two
       MINORs, each answered (`reviews/2026-11-18-read-windfall-2.md`).
   - **AN ENGINE DEFECT, FOR THE MAINTAINER (found by that reviewer):** in a year with a dated deposit or a staged drip
     into an ISA, the deposit is not counted against the year's ISA subscription. The same year's cash ISA shelter,
     surplus sweep and re-wraps read that subscription, so they can put more than the allowance into the ISA. It is in
     the engine (on `main`), the exact model and the forward run.
     - It can favour the windfall split's ISA routes, so the five gains are not shown to be the split's own.
     - **The agent proposes:** fix it with a test of its class across the three, sized on the library, to `main` with the
       next batch on B1's gate; then the windfall factorial run again on the fixed engine and on the whole menu, where
       the split's copies are skipped exactly outside the deposit year (or on anchors with the skip's part measured
       beside it: the reviewer's second round, MINOR 2). The fix moves the solver's code id and may move pinned figures
       in protected tests, so it needs the maintainer's "unlock enforcement".
   - **READ, FOR THE MAINTAINER: the savings factorial** (`results-save.txt`; `reports/2026-11-19-save-read.md`): A GAIN
     AND A HARM.
     - Survival up on the panel (`+0.398` points) and on 14 of 27 households beyond noise, down on none.
     - Spending up on the panel (`+0.4233%`) and on 23; down on S308F (`-0.250%`), the harm, at once by B7.
     - **The harm, with what is beside it** (`results-save-beside.txt`, section 7): S308F loses `£4,904` of `£1,963,500` a
       path. Its survival is level (`-0.050`), but its failures move from the bridge to late life (CANDD 50 in the bridge
       and 38 after it, CANDS 3 and 87). Three-fifths of the loss (`-£2,923`) is in the years both arms pay, where its
       policy sets higher levels in the bridge and lower after. Two-fifths (`-£1,981`) is deeper ruin from the first
       failure year on (unmet spending `+£2,567` a path). Its estate's mean is `+£424,840` a path, the upper tail's: on the
       median path it is `-£25,840`. It retires with `£115,652` more in its ISA and `£116,968` less in its pension on
       average. Why that policy, from that state, sets lower levels after the bridge and fails later but deeper is not
       shown.
     - The split put the saving pension first on 12 households, and ISA first on five of the younger cohort (S308F among
       them).
     - **In retirement the two arms run one policy:** on anchors a copy reaches a year without a choice only where such a
       year comes before one with a choice, and here the years with a choice run from each household's first year. Probed on
       all 27 (`results-save-skip.txt`): outside the working years the tables, the bridge reader's and its reference are the
       same to the bit in both arms, and the control (the windfall split on S026) differs. So the gains are the split's
       working-year choices, not the skip's. The write-up's first claim otherwise, from
       `B7-FACTORIALS.md` item 2 (measured on the windfall's copies), is struck (the reviewer at the read, finding 1).
     - **The ISA defect's part is bounded by the read:** S310F is not among the households the verdict names, and without
       it the panel stays beyond noise (survival `+0.399`, spending `+0.4341%`; section 6).
     - **The agent recommends** a v2 registered test of the savings split on the whole menu (within the working years, on
       anchors, CANDS's shortlists are drawn from a menu three times as long as CANDD's, unmeasured), after the ISA
       defect is fixed.
     - The reviewer at the read: FAIL, one BLOCKING and two MINORs (`reviews/2026-11-19-read-save.md`), answered in one fix;
       the reviewer again: PASS, one MINOR (S308F's bands were the levels set, years after ruin included, and the
       failures' move was not said), answered (`reviews/2026-11-19-read-save-2.md`).
   - **The savings factorial ran as D129 ordered, the defect said beside its read: it reaches one household, in both arms
     alike.** Checked on plan inputs alone (`save-isa-deposits.mjs`, `results-save-isa-deposits.txt`):
     - under arm A's own pick, none of its 27 households has a dated deposit or drip into an ISA in a working year with
       a save choice (S290 would only under a policy it does not take on this code);
     - one, S310F, puts its windfall into its ISA in a retired year (plan year 18) under its own pick, in both arms. The
       defect then lets that year's cash ISA shelter add more, which parts the arms only where their moves that year
       leave different cash, by at most a year's shelter. Unmeasured;
     - the check's first form missed S310F and said "not reached" (the windfall reviewer's second round, MINOR 1).

**RULED (D128, 18 Nov, morning: "Go with your recommendations. Unlock enforcement"): the four recommendations of the
report on steps 4 to 7, as below.**
1. Step 4's write-up is accepted as corrected, with no third round of its reviewer (D81 (F)).
2. **The guard: a couple more than three years apart with a DB pension keeps the app's rules** until a test of such couples
   reads. It is built and committed (cf9f8790), with the reviewer on the change of default before it: PASS, four MINORs,
   each answered (`reviews/2026-11-18-default-gap-guard.md`). It is on `main` with the eighth batch (pull request 19,
   91e8d009, 18 Nov 13:52 UTC), merged on B1's gate.
   - On step 5's 28 couples it keeps exactly the four 8 or 12 years apart with a DB pension on the app's rules. The four
     as far apart without one stay with the solver, and every other unit is as before.
   - The couples card says why ("more than three years apart in age, and your plan has other taxable income, such as a
     DB (final salary) pension or an annuity"). The coverage line and the scenario list say the same.
3. **D112's stats fix is in** (c1109d38): `stats-newcombe.test.mjs` in the fast tier, and `plan-defaults.test.mjs`'s
   floor re-pinned (identical arms clear from 43 surviving paths, not 39; 45 at 0.045, not 40; 83 at 0.005, not 78).
   - The pattern search ran each stored read's own rule before and after the fix: 560 decisions over seven reads,
     none differing (`results-stats-newcombe-rules.txt`). The reads stand as printed.
   - Steps 4 and 5, and every registered read but 7u-F's, use the exact interval, which the fix does not touch.
4. The speed work on LOOKHOLD stays held. Step 8 waits for the maintainer's word. The decomposition on S191-90 is not run
   (D129 (1) now runs it).

**FOR THE MAINTAINER (from the guard's review, 18 Nov):**
- **Its reach (the reviewer's MINOR 1).** The app has no kind of income for a DB pension: one is entered as "Other
  taxable income", beside rent, annuities, and interest or dividends entered as an income. So the guard reads any such
  income above nought, even one the plan never pays. That is the only reading the page's inputs allow, and it errs
  towards the app's rules. Its cost to the couples it reaches beyond a DB pension is unsized: on the four gap couples
  tested without one, today's default was `+10.744` points over the app's rules. A floor (on the amount, or an income
  paid within the plan) is yours to set if you want one.
- **The words (the reviewer's (d)).** The card says the solver's plans "have not yet been shown to do better than the
  app's own rules" for such couples. That is true, but it says less than step 5 found: worse on three of the four tested.
  How much more to say is yours.
- **Headroom.** The guard adds about 165 compressed bytes (gzip) to the page's first load. The new planner's first load on an empty
  plan is now 240KB against its 240KB ceiling (239 before), so the next batch has none. And every stored solve is worked
  out again once after the deploy, the solver worker's code having changed, as with every change to the couples' guard.

**UNDER WAY (D115 to D123, 17 Nov, late morning): the household line restarts on the external review's plan.** The
review's answers to `QUESTIONS-2026-11-17.md` (`research/reviews/2026-11-17/ANSWERS.md`, review/external-2026-10-21 at
f1f44727) turned into steps (`PRESCRIPTIVE-PLAN.md` beside it), each taken as written: step 1, the household's move from
the single solver's own chooser, held to the review's arrays (3 hours); step 2, the household plan's capital gains band
(1 hour); step 3, the twin, the biases recorded, two traces (half a day); step 4, the lead test amended, its amendment
committed first, HS5 deciding, on JOINT-WIDE's 28 units, seed 7002 (D118: `results-household.txt` whole to the
maintainer with the report); step 5, the shapes the library lacks, without waiting on A LEAD or A LEAD, WITH A UNIT TO
PLACE (D120); step 6's `AXIS.md` only if a read calls for it (D121); step 7's `REFUSALS.md` after step 5 (D122); step 8 not
started (D123). The pot is recorded and not a bar (D116). EXPLORATORY throughout; nothing under `src/` and not
`research/engine.mjs` edited, the solver's code id 603eeb595679.

**RULED (D124, 17 Nov, late morning: "Go with your recommendations"): three items from the household plan's steps 1 to 3, each as the agent suggested below; step 4 next.**
Steps 1 and 2 are done as written (75267bdd, 742125f5). Step 3 is built (the twin, `biasesOf`'s five things, check 3's
lifetime tax, the two traces) and stopped where the plan says stop.
1. **Step 1's settings check cannot pass as worded.** The plan: the audit "holds the household table's line to the first
   person's line with the tie-break the one difference". Every one of the 28 units sets a minimum pot, and each person's
   table is solved on that person's share of it, the household table on the whole (S149: 102,500 against 205,000;
   `results-household-line-check.txt`), so the lines differ in `minPot` too. Built as worded, it refuses every unit. The
   agent's suggestion, not built: the same comparison with the minimum pot left out, since the audit already holds the
   household table's minimum pot to the household's own.
2. **STOP (the plan's step 3, bar 5): S205's twin outside bar 2 on seed 99001.** On 2 of 100 paths a wrapper parts by more
   than a pound (the couple's dividend tax £3 over the household plan's in one late year; the largest gap in end wealth
   £5), where the review's seed 99002 had none. The cause, shown by decomposition (`twin-why.mjs`, `results-twin-why.txt`;
   `results-twin-step3.txt`): the engine takes a one-off cost person by person, the first person first, so the two twins
   hold unequal amounts from the cost's year on and one twin's allowance goes partly unused where the household plan has
   both people's. With the one-off costs taken out and arm A's policy held, the twins are equal in every year of every
   path on all six units, and S205's twin is 0 of 100 apart on seed 99001. The bar is not moved. The agent's suggestion,
   not built: hold S205's twin to bar 2 with its one-off cost taken out (the cost's person order is the engine's, not the
   merge's), bar 1 staying on the twins as they are.
3. **S149 (trace 2) fits neither of the plan's two branches.** In its cost's year the first figure apart is the capital
   gains tax on the cost's sale (seed 99002, path 17: the couple £1,210, the household plan £670, the gain £9,724 in both):
   the couple takes the cost from the first twin's taxable account, so the gain uses one person's exempt amount where the
   household plan has two. That is the engine's cost order against design A's doubled exempt amount: no defect in
   `householdPlanFor` to mend, and not arm A's rule. The agent's suggestion: name S149 in the check as the one exception
   with its size (on seed 99001 its capital gains tax over the plan £968 against the couple's £1,057, income tax £35,306
   against £35,490), the cause as found. Meanwhile it is printed and held to no bar.
Applied with the ruling's commit: the settings check with the minimum pot left out, S205's twin held to bar 2 without its
one-off cost, S149 named the one exception with its size.

**READ (17 Nov, evening): the household plan's lead test (step 4), A LEAD, WITH A UNIT TO PLACE; THE SEARCH GOES.**
`results-household.txt`, read once; `reports/2026-11-17-household-read.md`.
- Pooled survival up `+0.291` points, and spending up on the paths both keep.
- Three units placed: S333F, S335F and S191-90.
- The even split is as good as the best of five.
- Checked for a fault first (far from the pilot on survival): no fault found in the table's solve, its forecast or the
  arm's run. The loss on the three units lies between the household plan and the couple, and its cause is not shown.
  The figures are sizes: the bands' part of the couple's income tax is of the same order on the paths kept as on those
  lost; the first person ending at their own tax-free cash cap is an association on S333F and S335F.
- The reviewer at the read: FAIL, two BLOCKING (the cause the write-up first gave; three pooled figures without their
  largest unit), answered in one fix (`reviews/2026-11-17-read-household.md`). Then FAIL again on one BLOCKING, this
  entry still carrying the withdrawn cause, and two MINORs in the report's words (`-2.md`). Each was corrected as the
  reviewer gave it, unreviewed. The FAIL stands after one fix, so the write-up was the maintainer's (D81 (F)):
  accepted as corrected (D128 (1)). The read and its outcome stand by both rounds.
- Step 5 was launched without waiting (D120). `AXIS.md` comes after it (D121), then `REFUSALS.md` (D122).

**READ (17 Nov, night): step 5, the shapes the library lacks, A SHAPE TO PLACE (gap12).** `results-shapes.txt`, read once;
`reports/2026-11-17-shapes-read.md`; the reviewer at the read PASS, two MINORs answered.
- The household plan is above today's default by `+5.865` points pooled, most of it on the two bases with a DB pension.
- gap12 is placed on its CEIL less HS (`+1.675`, `+0.883` without S061-dbpart@gap12).
- `AXIS.md` (step 6) and `REFUSALS.md` (step 7) are written and sent; nothing is built.
- What remains is the maintainer's:

**RULED (D128 (2)): today's couples' default on couples with an age gap and a DB pension. The guard is built, above.**
- **The finding.** On three couples the app's guard hands to the solver under the opt-in, K2 survives below the app's
  own rules: S147-db@gap8 `-6.800`, S147-db@gap12 `-10.950`, S061-dbpart@gap12 `-20.250`. Each is 60/40 with an 8- or
  12-year age gap and a DB pension. It was found on seed 7002, EXPLORATORY.
- **It is the app's own route.** It matched the stored K2 path for path on these couples (the reviewer at the read).
- **The guard.** It reads no age gap, and every couple tested before was three years apart.
- **The agent's recommendation, made (D128 (2)):** keep a couple whose age gap is beyond three years and who hold a DB
  pension on the app's rules until a test reads. That is a change of default, and the reviewer checked it first.
- **Its trade.** A guard on the gap alone would also take the gain of the gap couples without a DB pension (`+10.744`
  over the app's rules here). The cause is not shown.

**FOR THE MAINTAINER: the axis (`AXIS.md`).**
- Design B, the axis on the smaller pension's share, is not built. Whether to build it is the maintainer's.
- On the lead test's three units the household plan's two-band pricing departs from the couple's mostly outside the
  axis's window.
- The decomposition on S191-90 is offered, not run: HS5 with the household table's income bands single, and again with
  its tax-free cash cap single.

**WAITS (D123): step 8, the registered test**, for the maintainer's word now that steps 4 and 5 have read.

**RULED (17 Nov, evening; D125 to D127): step 5's two refused units run again on an amended check, the read on two stamps.**
- D125 amends the check, D126 unlocks the fair-test gate's allowed versions, and D127 adds unit 27 and extends the box.
- The reviewer before use FAILed the amendment's first form (`reviews/2026-11-17-shapes-amendment-1.md`). Its fix
  follows D127, with the reviewer again before use.
- The two stop entries below are kept as the account.

**STOP AGAIN (17 Nov, evening): D125's remedy meets the fair-test gate.** The maintainer chose option 1 below (D125).
Before anything was built, the agent found the block, which its recommendation had not checked:
- **The block.** `fair-gate.mjs` `checkLogStamps` (protected; the reducers' fair-test gate) refuses the logs of a read on
  more than one code-and-audit version.
- **Why it applies.** Unit 20 run again on an amended audit carries a new audit stamp, and the other 27 carry the
  launch's. So the read cannot pass the gate.
- **What would be a bypass.** Calling the gate on each group of units apart would get past it. The agent counts that as
  a bypass and does not do it.
- **Ways on:**
  - (a) Unlock enforcement for exactly `fair-gate.mjs`'s stamp check, so this read alone takes the two versions the
    amendment names, with a dated note and its planted case. Then D125 as ruled, about 40 minutes of run.
  - (b) Option 3 below: all 28 units again on the amended check, about 3.5 hours. One version, no unlock, past step 5's
    4-hour run box.
  - (c) Option 2 below: S147-db@penA100 left out. The reducer, amended, names the launch's audit stamp and reads the
    panel less the unit. One version, no unlock.

**STOP (17 Nov, evening): step 5 cannot be read as written; one unit refused by the audit's settings check.**
- **What happened.** Unit 20, S147-db@penA100, exited before any arm ran. Its log, `results/shapes-7002/case20.txt`,
  reads: "household: levels 1,1.1,0.95,0.9,0.8, the first person's 1,1.1,0.95,0.9,0.799985".
- **The cause.** Each table's lowest spending level is its plan's own floor over its own target (the engine's
  `floorFrac`). The first person's table is solved on their share of the household's target and floor, and on this
  shape that ratio comes to 0.799985. The household table's is 0.8. This is the same class as D124 (1)'s minimum pot: a
  person's table is solved on its share of the household's figures. D124 left only the minimum pot out of this check.
- **Why the read is blocked.** The reducer's gate, as committed, refuses a read with a unit missing. Every remedy
  touches a stamped file, so no remedy is made: nothing is substituted and no outcome is read. The units already queued
  are left to finish, since every remedy below uses them.
- **The options:**
  1. **(Recommended)** As D124 (1) did for the minimum pot, and in D94 (1)'s form:
     - a dated amendment to step 5's settings check, with the lowest spending level left out of the comparison and the
       household table's held to the household's own floor over its target, in `audit-shapes.mjs` alone, so the lead
       test's reducer still reproduces its read;
     - unit 20 run again alone on the amended audit (about 40 minutes);
     - the reducer's gate amended to accept exactly the two audit stamps, the launch's for the other units and the
       amended one for unit 20, and nothing wider;
     - each amended file with its planted case, and the reviewer on the amendment before it is used.
  2. Leave S147-db@penA100 out, printed with its refusal, as SHAPES.md leaves out a unit `householdPlanFor` refuses. The
     gate is amended to read the panel less it, and penA100 is read on its other three units.
  3. Run all 28 units again on the amended check: about 3.5 hours.

**RULED (D128 (4): stays held): D111 (3)'s speed work on LOOKHOLD.** D119 held it until the lead test read;
it has read. The review held it because LOOKHOLD's tie rule, look and hold leave a couple's path if the household's move
holds, and the move holds here, as a lead. The agent recommends it stays held until the maintainer rules on step 8's
registered test. Not started.

**RESTARTED (D115) after its stop (D114, 17 Nov, morning: "Handover your thoughts and the problem so far as a prompt for an external reviewer, stop that line of thought for now"; the lead test not run). As it was opened (D113): one plan for the whole household, before the speed work.** The maintainer: "Look at bigger -
one plan for the whole household. Think deeply about how that would work and how much more accurate you'd expect to be,
and if it could be done without significant increase in timing. After that if you're confident at least there's a good
lead, follow up on it with tests as needed and then get back to me. Do this before the speed work." The design, the gain
expected and the timing model first (`HOUSEHOLD.md`); a prototype off in code and its tests, EXPLORATORY, each rule
committed first; then back to the maintainer. D111 (3)'s speed work waits for it.

**RULED (D111, 16 Nov, night: "Go with your recommendations"): after the share replay's read, MIXED** (D110;
`SHARE-REPLAY.md`, its rule committed first; `results-share-replay.txt`; the report `reports/2026-11-16-share-replay-read.md`;
the reviewer at the read before this went to you).
- **Ruled, each as the agent recommended in the day's report:**
  1. The read stands as corrected after the reviewer's second round; no third round.
  2. Option 1 below: a wider joint move for couples, tested on today's split (`JOINT-WIDE.md`, its rule committed before
     any launch; EXPLORATORY, seed 7002).
  3. Speed work on LOOKHOLD's cost (the forward look's, D109) waits until the wider joint move is settled, and is then done
     once, on the joint move as it then stands.
- **What it found:** no single part of a couple's move carries the share rules' lost paths, pooled. Swapping in TODAY's
  tiers recovers `+0.4367` of them and the top six moves `+0.4835`; TODAY's level `+0.1555`; TODAY's split loses ground.
  - Which part recovers differs by comparison: TODAY's tiers on MEANS S061-dbpart (most of their pooled figure), TODAY's
    level on S023-90 and S147-90, the top six on S023-90 and S227-90, and nothing on FLAT S061-dbpart.
  - The top six moves are the most consistent (`0.35` or more on eight of ten) and the only variant one could run as a
    policy; they fail on FLAT S061-dbpart and MEANS S147-90, and their time was not measured.
  - The deep review's mechanism shows on `42.3%` of the lost paths (the first print's `51.8%` was a rounding fault, fixed).
  - The reviewer at the read: FAIL, answered in one fix, then FAIL again on one new BLOCKING and four MINORs
    (`reviews/2026-11-16-read-share-replay-2.md`). The BLOCKING was one sentence of the report's: the mechanism shows on
    more than half of the lost paths on three units, not two. It stands after one fix, so the read is yours (D81 (F)).
    The sentence and the MINORs are corrected as the reviewer gave them, unreviewed: yours to accept, or to send to the
    reviewer a third time.
- **Your options:**
  1. **A wider joint move for couples, tested on today's split** (the agent's recommendation): each person's top four and
     top six moves against today's two, on today's default (with LOOKHOLD), EXPLORATORY on a panel at seed 7002, its rule
     committed first, survival, spending and the pot beside the solve and path times. No new solver code; a gain comes back
     to you as a trade of survival against time.
  2. **Leave the share and the joint move as they are,** and go on to the research queue's two factorials, then your work
     on the screens.

**RULED (D108, 16 Nov, night: "Clean timing decides (Recommended)"; then D109, 16 Nov, morning: "Just take `1.25`, let's not waste taste, speed work will happen anyway right?"): the improved couples' tie rule passes, and its speed sits at the bar you set.** The trade is taken: LOOKHOLD is the couples' default on the working branch (ef2e4d72), the reviewer on the change PASS with three MINORs (`reviews/2026-11-16-default-lookhold.md`), the two to answer before its batch merges answered (597a549c), to `main` with the next batch on B1's gate; the clean timing (`TIE-C2-TIMING.md`) is not run. On speed work: none is queued (D103's lapsed with D104 (5)); the forward look's cost is offered as an item. TIE-C2
read once (EXPLORATORY, seed 7001): `results-tie-c2.txt`, the report `reports/2026-11-16-tie-c2-read.md`, beside it
`results-tie-c2-beside.txt`. The reviewer at the read: FAIL on the first write-up's speed claim, answered in one fix, then
PASS (`reviews/2026-11-16-read-tie-c2.md`, `-2.md`).
- **What passed:** LOOKHOLD, the forward look with the hold, holds all eight parts against today's couples' candidate.
  - Survival and spending are unchanged.
  - The pot left on the typical path is `+0.288%` pooled and higher on all twelve couples (`+0.409%` on the younger
    eight). Lifetime tax is `-2.11%`.
  - The hold alone changed nothing on these couples: its outcomes are the candidate's on every path. So the gain is the
    look's.
- **The one measure that moved the other way:** the pot up to the household's cap, `-0.002%` pooled. It is lower on 990
  paths of 96,000 and higher on 488, and four paths end below the cap `11.5%` to `23.7%` lower. The look ranks moves on
  the median path, not on a path that later turns bad.
- **The speed, which is yours (D105):** the arm taken comes back as a trade if it adds more than a quarter to a couple's
  path.
  - The rule reads `x1.219` (the median over the twelve), under the bar.
  - But every unit ran today's candidate first, and the first arm is timed 1% to 3% slow even on a quiet machine. With
    that undone, the readings are `x1.236` to `x1.260`.
  - On the younger eight it is about `x1.26`; on the library's four about `x1.0`. So it sits at the bar.
- **What a path's time means in the page:** on the one couple measured in the browser (S069, a library couple, under
  load), the paths took `300.8` of `458.2` s on a first solve. As an inference only: on that split, a path at `x1.25`
  would make the wait `x1.164`.
- **Your options:**
  1. **Take LOOKHOLD as the rule reads it.** The change of default follows at once, the reviewer on it before it is
     committed.
  2. **Weigh the trade now:** the gain above, against about a quarter more on a younger couple's paths.
  3. **A clean timing decides it.** Today's candidate and LOOKHOLD each in a fresh process, their paths alternated, on
     all twelve couples, on a quiet machine after the share test (from about 15:00 UK, about an hour on four cores as
     estimated). Its rule would be committed before it runs:
     - at or under `x1.25`, LOOKHOLD goes in, as D105 rules;
     - over, the trade comes back to you.
- **The agent's recommendation: 3.**
  - It lets the bar you set decide, on a measurement that is not tilted by which arm ran first.
  - It costs a few hours and an hour of the machine, and nothing else waits on it.
  - If you would rather settle it now, 2. The gain costs nothing in survival or spending, and the time falls only on
    couples far above their caps.
- **Whichever way it goes in, one point is settled in the change:** at the dial's locked positions the hold, as built,
  would put back a step down that the lock takes.
  - The agent's recommendation is that the hold act there as at position 1. Past twice a table's top the misread is the
    same at every position.
  - The lock's tests would allow exactly that, with the reviewer on it.

**RULED (D107, 15 Nov, evening: "Launch it (Recommended)"): the share rules' registered test, `registrations/share-rules.md`.** Complete,
its design review PASS on the second round (`reviews/2026-11-15-share-rules-design-2.md`). **Launched 16 Nov 00:37 UK** from
the worktree at e1239959 (code c0dcfa9ef2f2, audit 28712df5935f), relaunched under `RESUME=1` at its 12-hour limit (12:33 UK),
its runs done 14:57 UK. **Read once, 16 Nov: NEITHER, today's split stays** (`results-share-rules.txt`; the report
`reports/2026-11-16-share-rules-read.md`, beside it `results-share-rules-beside.txt`): FLAT flags four units and its spending
falls past the bar; MEANS flags six, S061-dbpart losing `12.381` points; each rule's pooled survival holds. Nothing changes in
the app. The reviewer at the read: PASS, four MINORs, answered (`reviews/2026-11-16-read-share-rules.md`).
- **The deep review** (`reviews/2026-11-16-deep-share-rules.md`): taken with the share ensemble and the share choice, the
  fixed-share route is spent. Its leading cause: each person's table plans a part of the household that the household
  never lives, and the joint move prices the household's money and room to spend by those parts.
- **Its one test, yours to take (the report's "For the maintainer"):** replay the flagged units' lost and saved paths on
  the read's own code with each year recorded, plus four variants of the move (today's spending level, tiers, split; each
  person's top six moves). EXPLORATORY, about 4.5 core-hours and a day's work, on seed 7023's already-read paths, run
  directly since the launcher refuses a reserved seed outside its registration; or on 7002 at about three times the cost.
- **The agent's recommendation:** run it. The other way is to leave the share where it is.
- **RULED (D110, 16 Nov, evening: "Run the deep review's test on seed 7023"):** the test as the deep review's section 3
  sets it out, its rule committed before it runs, on seed 7023's already-read paths, run directly as a tracked task.
- **What it tests:** two fixed rules for a couple's share against today's (the pots' share outside 40% to 60%, half
  inside), each on the couples' candidate:
  - FLAT: the pots' share for every couple, the band dropped;
  - MEANS: each person's share of the two people's means.
  On eight held-out couples (32 units: 45/55, 55/45, 90/10 and a feature where the means and the pots part), seed 7023,
  16,000 paths a unit. A rule passes only with no unit harmed, a pooled survival gain beyond noise and spending held. A pass
  makes it the couples' default.
- **Cost:** 58.1 core-hours, about 14.5 hours on four cores. TIE-C2's run holds the cores until about 01:00 to 02:00 UK,
  so a go tonight starts it then and it ends about mid-afternoon Monday.
- **What the pilot shows** (EXPLORATORY, 1,000 paths of three couples, seed 7002): FLAT loses survival on all three 45/55
  units, and MEANS on two of S023's units (0.70 and 2.40 points). Were those true, each would be flagged at 16,000 paths
  with chance 0.93 to 1.00, so the run would most likely read NEITHER and today's split would stay. A loss of that size on
  1,000 paths could still be noise.
- **The agent's recommendation:** launch it. The machine does the work, mostly overnight, and the question is settled
  properly either way. The work on the screens can start alongside it, since a passing rule changes one default and no
  screen.

**RUN AND READ (D105, 15 Nov, morning; launched 15 Nov 19:33 UK, read 16 Nov: PASSES, its speed at the bar, above): a better tie rule for couples, `TIE-C2.md`.** You reopened the couples' tie rule that
its read closed: "Plan out and add a test to the queue for an improved couples tie rule based on learnings so far".
- **Two changes, each from what the first read found** (`results-tie-couple-trace.txt`):
  - **The hold.** The late step down in risk that cut S311F's pot came from a misread. Each person's table covers wealth
    only up to six times what they opened with (or 60 years of spending), and any pot beyond that is read as the top. So a
    pot of billions was read as one at about one and a half times the cap. Past twice the top, a person never steps down in
    risk.
  - **The forward look.** "This year's least tax" drew the ISAs down and left a taxable account that paid tax for decades.
    Near-ties are ranked instead by what each move leaves at the plan's end, on a typical (median) market path.
- **The test**, EXPLORATORY: the hold alone, and the hold with the look, each against the couples' candidate.
  - Twelve couples not used in any earlier tie or speed read, seed 7001 (not the seed whose paths shaped the changes),
    8,000 paths.
  - The first rule runs beside the others and decides nothing.
  - Each couple's pot is judged two ways: each path's own change averaged, and the average pound with an allowance for
    noise.
- **In the queue:**
  - built (15 Nov), off in code, with its test and the read's files (STATE.md action 3);
  - before the launch, deciding nothing (`results-tie-c2-precheck.txt`): S311F's two deciding paths of the first read
    under each arm. The step down at 90 came from each person's shortlist reading a pot of billions at the table's top;
    the move keeping the risk scored higher but was not on offer. The hold removes the step, and the look kept the pots
    within 0.03% while cutting lifetime tax by £9,065 and £84,755;
  - launched when the cores are free, after the share rules' pilot;
  - about five and a half hours on four cores as planned (the first units' times to confirm), half a day to read.
- **Your two choices before the launch:**
  1. RULED (15 Nov): "1 - pass goes straight into default". A pass is the ruling naming the run: the arm the rule takes
     becomes the couples' default, the reviewer on the change of default. One exception stands from the plan: if the
     version taken is the one with the forward look and it adds more than a quarter to a couple's path, it comes back to
     you as the speed trade.
  2. RULED (15 Nov): "Agree", to the exception above and to the agent's recommendation here: the pot is judged with the
     allowance for noise, not the first read's point bar on every couple.

**FOR THE MAINTAINER (15 Nov, morning), to note: the allowance's step at both places reads FAILS, so it is closed.**
`results-allowance-both.txt` (EXPLORATORY, seed 7002; `ALLOWANCE-BOTH.md`, D98); in plain words,
`reports/2026-11-15-allowance-both-read.md`; beside it, `results-allowance-both-beside.txt`.
- Offered the allowance at its old place as well as its new, the solver gains a hair of survival (+0.019 points pooled,
  beyond noise) with spending level, but leaves less below the cap: the capped pot -0.187% against the bar of 0.1%.
- S090 carries both effects: 54.2% of the survival gain and 71.3% of the capped fall (-1.130%). Without it the capped pot
  would be -0.061% and the gain would go too: the rule would read NO GAIN.
- On S090 the solver's own score takes the trade, a little survival for a little pot below the cap (+0.047, within noise).
  So the FAIL is the rule's bar on the capped pot declining the trade the ceiling-lead test found, not the solver's own
  objective rejecting it.
- By the rule the offer is closed and nothing changes; the allowance step stays where the harvest ceiling put it.
- The reviewer at the read: FAIL, one BLOCKING. The report's count of how often the new draw was taken was wrong: three
  in four of the moves it counted are the old ladders. Answered in one fix with its five MINORs
  (`reviews/2026-11-15-read-allowance-both.md`). The reviewer again: PASS, two MINORs, both answered (`-2.md`).

**RULED (D104, 15 Nov, morning): the morning report's five decisions, "Go with your recommendations".** Each read is in
full in its report: `reports/2026-11-15-other-order-read.md`, `reports/2026-11-15-speed-b-read.md`,
`reports/2026-11-15-tie-couple-read.md` and `reports/2026-11-14-share-choose-read.md`.
1. **Couples entered the other way round (D100):** a couple whose elder is entered second is handed to the solver elder
   first, and its figures are shown back the way it was entered. It replaces D100's stage B.
   - Every field read in the first person's terms is mirrored, and the age cap is read on the plan as entered.
   - Its tests: each partner's year in the swapped plan against the plan as entered; the guard on the plan as entered; an
     identity on plans entered younger first independently of the mirror; planted faults (a band left unmoved, the swap
     before the cap, an income's end read the old way, the mapping back left out).
   - The reviewer on the change of default. About three days with its tests.
   - Stage A's read stands as printed (NEITHER, its tie at the bar noted): the route does not rest on which reading holds.
2. **The speed mode for singles:** it stays a beta, its warning's figures on survival as they stand.
3. **The speed mode's words** (the maintainer's to change), as the agent drafted them:
   - the singles' "about twice as fast" made "faster";
   - the couples': "For couples, speed mode is less tested. It was usually only a little faster, it spent a little less,
     and for some couples it lowered the chance your money lasts by about 5 in 1,000. Use the full calculation for
     decisions."
4. **The couples' share:** a registered test of the two fixed rules against today's split, the 40%-to-60% band dropped and
   the means' split. Its registration comes to the maintainer before launch.
   - D103's speed work lapses: the fixed rules add no solve time.
   - The forecast test offered on 14 Nov is not run unless asked.
5. **The couples' tie rule** (to note): FAILS, closed, nothing changes; reopening it is the maintainer's alone.

**RULED (D103, 14 Nov, evening): speed work to gain back the share choice's time.** The maintainer, on D102: "But after
that run speed work to try to gain back that added time". After D102's build and its exploratory read, and before its
registered test (so the test is of what would ship), the share choice is made faster:
- the target: a couple's solve with the choice at most a quarter more than today's (gate 5's measure);
- each cut exact or, where approximate, a large saving for a small measured loss (D65), each with its test;
- the routes to try: a light first pass choosing the share, fewer candidates by a bracketing search, and work shared
  between the candidates' solves (`PART-D.md` D8).

**RULED (D102, 14 Nov, evening): the solver chooses a couple's share ("Option 2.").** The share ensemble
(`results-share-ensemble.txt`, EXPLORATORY; in plain words and in full, `reports/2026-11-14-share-ensemble.md`) read THE
SHARE'S MEASURE.
- On 7 of 10 couples another share beat the pots' share, by about 2 points on average.
- Every share of every couple was above the app's rules.
- No single rule fitted every couple. The reviewer at the read (PASS, eight MINORs) found that the 40% to 60% band itself may
  be the cost for 60/40 couples.

Of a fixed share from each person's means and the solver choosing the share, the maintainer chose the second. In full in
`PART-D.md` D8:
- built as an option, off in code;
- read EXPLORATORY beside the means' share and the pots';
- then a registered test, its registration to the maintainer before launch.

D99 stands until then.

**RULED (D101, 14 Nov, afternoon): the new planner's first-load ceiling to 240KB.** B1's gate on the third batch found the
new planner's first load on an empty plan at 239KB against its ceiling of 237KB, a saved plan at 235KB. The growth since
batch 3's first gate is about 1.2KB compressed: the speed mode's and the couples' screens' code, not the engine's, so by
D94 (2) it stopped for the maintainer. The maintainer: "Go with your recco": the measured figure plus one, 240KB, with a
dated note in `load-perf-ui.cjs`; the classic mode run again on it.

**RULED (D100, 14 Nov, afternoon): couples in the other order get their own test.** The maintainer: "Ensure a follow up test
is placed in the plan so we can open up couples in the other order." Since D99 the solver plans for an uneven couple only
when the older partner is entered first, as every couple stage C tested was. The test, in full in `PART-D.md` D7:
- stage A, EXPLORATORY: the joint estate weight made the same whichever partner is entered first (couples entered elder
  first unchanged bit for bit), then stage C's couples entered both ways and compared on the same paths;
- stage B, registered on a new held-out seed: the couples entered the other way against the app's rules by stage C's rule.
  Its PASS opens the guard for them, the reviewer on the change of default.

It comes after the share ensemble, ahead of (c) to (e) below. Stage B's registration comes to the maintainer before its
launch, as stage C's did, unless the maintainer says to launch it once its design review passes.

**RULED (D98, 14 Nov, morning): "Agreed with all"**, on the agent's reply to D97: (2) as read, a couple's tie rule
passing its rule joins the couples' candidate with no further word (the reviewer on the change of default); (3) the speed
mode's warnings as drafted, for a single: "Speed mode works out your figures about twice as fast by looking at fewer
options in each simulated year. In our tests it very slightly lowered the chance your money lasts: about 2 in 10,000 on
average, and at most about 2 in 1,000. This year's recommended actions still use every option." and for a couple: "For
couples, speed mode is less tested. It ranged from slightly slower to nearly twice as fast, and it spent a little less and
held slightly less in shares than the full calculation. Use the full calculation for decisions."; (4) the harvest
ceiling's allowance step offered at both places, where it stood before and where it stands now, the solver choosing:
built off in code with its test, read EXPLORATORY by its rule committed first, its passing the ruling naming the run (in
the candidate, the reviewer on the change of default), failing closed and reported.

**RULED (D97, 14 Nov, morning): the four items of the morning report.** The maintainer: "1 - go with your
recommendation 2 - add the test to the plan after couples, but don't wait for me to ok it. 3 - run a wider test on it.
For now add as an optional 'beta - speed mode' toggle with a warning to singles and couples. 4 - wouldn't the point of
backward induction be that we don't add a hardcoded rule and let the solver choose? But please let me know if this has
been disproven or is less likely to work in this scenario from tests seen so far". As the agent reads them: (1) couples
run the candidate under the opt-in once item 6's stage C has read, by its outcome (PASS: couples whose elder holds more
than 60% and at most 90% too; THE GUARD STAYS: couples outside 40% to 60% keep the app's rules; STOP: back to the
maintainer first, as the registration says), the reviewer on the change of default, merged on B1's gate; (2) a tie rule
for a couple's joint move, measured after couples are on, as item 13 was (its rule committed first, EXPLORATORY, off in
code): passing its rule is the ruling naming the run, built and in the couples' candidate with the reviewer on the change
of default and no further word; failing, closed and reported; (3) `chooserShortlist: 'order'` read again, wider, on singles
and couples (EXPLORATORY, its rule committed first, when stage C frees the cores), and meanwhile offered in the app as an
opt-in "Beta - speed mode", off by default, with a warning for singles and one for couples; (4) a question, answered in the
reply of 14 Nov: nothing so far disproves letting the solver choose; the agent's recommendation was that (the allowance's
step offered at both places, the solver choosing); building it waits on the maintainer's word. The four entries below are
kept as they were put.

**RULED (D96, 13 Nov, night): item 6's stage C, launched on the agent's three recommendations.** The maintainer:
"Proceed with your recommendation": launched as registered, at 19,000 paths a unit, no mirror. It runs once batch 2's
gate ends, from a worktree at the commit recording D96; its read comes back with the outcome as registered. In full:
`reports/2026-11-13-stage-c-registration.md`; the registration `registrations/couples-share.md`, its design review's PASS
after one fix. Twelve held-out couples, 36 units (each re-held 75/25 and 90/10, and once with a DB pension, an existing gain or
a state pension age of 67), seed 7022, about 61 core-hours. Three choices: (1) launch: the agent recommends yes; (2) the
paths: 19,000 a unit (D34's rate held only below about 12% discordance; D61's choice for D4, yours here) or 30,000 (about 95
core-hours); the agent recommends 19,000; (3) the mirror, the younger partner holding more (about 40 core-hours more): the agent
recommends not now, so a PASS lifts the guard only where the elder holds 60% to 90%.

**For the maintainer and the external review (13 Nov, night): the harvest ceiling's allowance step trades tax for pot
below the cap.** `results-ceiling-lead.txt` (EXPLORATORY, seed 7002; `CEILING-LEAD.md`); the reviewer at the read: PASS,
three MINORs (`reviews/2026-11-13-read-ceiling-lead.md`). The ceiling (on `main` since the first batch) moved the
allowance's ceiling down to where the year's bill would first rise. On the three households with most in the taxable
account, that one step is 95% of the extra tax they pay on paths that end below the estate cap (S090: about £11,000 over
a lifetime). On the same paths it also leaves a larger pot (S090: about £29,000 more on average; the pot capped at the
estate cap, over all paths, about £26,500 or 2% more). With the allowance's step as before, survival is a shade higher
(pooled +0.02 points, at the edge of noise) and spending a hair higher, for less tax and a smaller pot. How the step
does it is not shown: the runs store no moves. With the tie-break in, the tax saving above the cap that the ceiling's
first read showed is gone; the ceiling still passes its own rule. By this test's rule nothing changes in the code: the
question goes to the external review with the trade as it stands, whether the allowance's step should also be offered
at its old place so the solver chooses between the two. The agent's view: worth asking, as a trade rather than a loss;
a small change with its own test if the review agrees.

**For the maintainer (13 Nov, evening): the couples' tier test reads "both"; a tie rule for a couple's joint move?**
`results-couple-tiers.txt`; in full in `reports/2026-11-13-couples-read.md`. With consent to change risk withdrawn the
younger couples' median pot recovers from 0.37 of the app's rules' to 0.79: the lower-risk funds are most of the pot's
fall, not all. What is left is not shown by the read (corrected after the reviewer, PASS with nine MINORs,
`reviews/2026-11-13-read-couple-tiers.md`): its trace of one couple, a lead, puts it mostly in tax once the tiers are
taken away, and with consent given the tiers are nearly all of the fall and tax a few percent. No tie rule reaches a
couple's joint move, and what one would save is unmeasured (pooled tax above the cap: the candidate £303,000, the
app's rules £133,000, a ceiling). The lost paths were the capital gains bill, now fixed and replayed. The agent's
recommendation, revised: a tie rule for couples is a tax matter and need not hold couples back; measure it in the
research queue as item 13 was (its rule first, EXPLORATORY, off in code until ruled), and have the couples' screens
say the smaller pot is the price of the lower-risk funds. By the test's own rule nothing is built until the maintainer
says.

**For the maintainer (13 Nov): item 12 is closed; the shortlist's trade (D90 (2)).** Item 12's stage A read
(`results-item12-a.txt`, EXPLORATORY): neither arm passes, so by D84 item 12 is closed and nothing is built. Both fail
the same two parts, narrowly: spending delivered 0.11 and 0.12 points of target lower (the bar 0.1), and two couples'
equity weight just over a point from the whole menu's. Survival, the pot and tax hold. The first arm is the built
shortlist (`chooserShortlist: 'order'`) on a couple's path, so the trade D90 (2) left open now reads: for a single, a
path about 1.9 times as fast for a pooled 0.019 points of survival, beyond noise (`results-tie-a.txt`); for a couple,
a path 0.9 to 1.8 times as fast and a fail of its own rule on spending and on the risk held. The agent's
recommendation: leave the shortlist off. Its guard stays in, so it costs nothing where it is. Switching it on is the
maintainer's.
The reviewer at the read (`reviews/2026-11-13-read-item12-a.md`: PASS) adds, beside "closed": the spending fail is
real on these paths but depends on which couples were drawn (without any one of three couples the first arm would hold
that part; the review's own eight held it); the risk drifts towards less equity, by just over a point on two couples;
the first arm would pass only with both of those couples left out, the second not even then; one couple (S253) loses
survival beyond noise in both arms while the pooled figure is level; and the run was on the code before the harvest
ceiling and the capital gains bill's fix. The rule was the maintainer's and is not run again by the agent; if the
maintainer wants item 12 read again on other couples or on the current engine, that is a new ruling.

**For the maintainer (13 Nov): the couples' re-run has read, PASS; do couples run the candidate under the switch?**
In full: `reports/2026-11-13-couples-read.md`. On 40 held-out couples the candidate against the app's rules: survival
about +10 points and spending delivered +6.5% (the standard estate weight), no harm flag. Beside it, from the reviewer
at the read: a couple spends less in its first retired years; the pot left is much smaller (the giveaway above the
estate cap, which the tie-break as built does not reach in a couple's joint move); the gain is the gain at an 85%
landing; a few paths are lost that the app's rules keep. The deep review (`reviews/2026-11-13-deep-couples-d4b.md`): the PASS is
sound for survival and spending; the smaller pot is probably the lower-risk funds the solver holds, not the giveaway
(capped, the pot is level with the app's rules'); the paths lost in one year are an engine defect (one person's capital
gains bill cannot be paid from the other's ISA or pension), in every arm. The agent's recommendation: yes, under the
opt-in, after (1) that defect's fix with its test, (2) the deep review's one test, the couples' tier test (EXPLORATORY,
about five core-hours), which says whether anything in the solver must change first, (3) the tie-break for singles
(D90 (1)), (4) item 6's stage C, (5) Part D's D5, the couples' screens showing the early cut and the pot plainly; a
couple outside 40% to 60% keeps the app's rules until item 6 reads (M4). The agent carries on with (1) to (5) in that
order meanwhile; switching couples on waits for the maintainer's word.

**RULED (D94, 13 Nov): "Proceed with your recommendations"**: the stage gate and the read amended for S293's one
difference, reviewed before use, the chunks kept (the fallback: fix the audit and run the first stage again); the first
load's ceilings at the measured figures plus one, 235 and 237, engine code moving them the same way at a later batch.
The two entries below are kept as they were put.

**For the maintainer (13 Nov): the first load's size, and the gate's reference.** B1's gate on the first batch came
back red in both modes, so nothing is merged (`results-reference.txt`; STATE.md section 5).
- *The ruling needed: the first load's ceilings.* On the working branch's head the classic planner's first load is
  234KB against its ceiling of 232, which is D58 (2)'s limit, and the new planner's is 234KB (a saved plan) and 236KB
  (an empty one) against 234. `main` reads 232 and 232 / 233. The growth is the engine's own code: the year in HMRC's
  order, relief on pension contributions, the pages naming the sweep, the harvest ceiling. Options: (1) the ceilings
  move to the measured figures plus one, 235 and 237, as D57 and D58 (2) did, and a later batch whose growth is engine
  code moves them the same way, reported at its merge (the agent's recommendation: it saves a stop at every batch that
  corrects the tax engine); (2) the same, this once; (3) hold 232 and 234: the agent looks for about 3KB to move out of
  the first load before anything merges, box half a day, with no promise it is there.
- *Done, for the maintainer's eye: where the harnesses' reference is worked out.* The container's restart brought a
  newer Chromium, and its exp and log no longer agree with Node's to the last place; `main`'s own code fails the
  bit-for-bit checks here. The reference is now the same source, unbundled, run in the harness's own browser
  (`research/ui-harnesses/lib/reference.cjs`), so the checks are bit for bit again and now cover the money too; what
  they no longer hold is that a browser computes exactly what Node does, which stopped being true. Say if this should
  be done another way.
- *Read, for the maintainer's eye: the harvest ceiling's step 4 passes its rule* (`results-harvest-ceiling-solved.txt`;
  the reviewer's PASS, `reviews/2026-11-13-read-harvest-ceiling.md`), so by the rule it goes to `main` with the first
  batch. What the pooled figures hide: the lower tax and larger pot are two households' (S328F, S340F), on paths that
  end above the estate cap; on paths at or below the cap lifetime tax is higher on S090 (about a fifth), S328F and
  S030, the three with most money in the taxable account. Survival is a shade lower, beyond noise and well inside the
  rule. A lead, not shown: under the review's rule the allowance's ceiling now stops where the year's bill would first
  rise, which removes a slice these households drew cheaply. The agent runs the one test that would tell (EXPLORATORY)
  after item 12's stage A and brings it back; if it shows the allowance's step is the cost, that is a question for the
  external review, not a change the agent makes.
- *Done: the skip costs' fixture* is S064 where it was S116, whose re-wrap costs nothing to skip on the new code.

**STOP (13 Nov): the couples' re-run's stage gate refused.** The first stage's 200 chunks are in and backed up; the
registered stage gate decided nothing, because S293's solver arms and APP were run on plans that hash differently. The
cause, from the plans alone: the second person's MPAA age (58 against 60), a derived field that moves no money on this
couple (`results-d4b-plan-check.txt`). No outcome of seed 7021 has been read. Every route forward changes a stamped
file, so it is the maintainer's: (1) amend the gate and the read for this one known difference, reviewed before use,
and keep the chunks (the agent's recommendation); (2) fix the cause in the audit and run the first stage again, about
twelve hours of four cores; (3) drop S293, not recommended. In full: `reports/2026-11-13-d4b-stage-gate.md`.

1. **The improvements laid out**, in this order; the first not done is the next.
   - **On `main`:** batches 1 and 2 (pull requests 12 and 13): the newest candidate (D73; D95's tie-break for singles),
     the engine's year in HMRC's order (item 3), relief on money paid into a pension (item 4), the pages naming the sweep
     (item 5), item 8's caption, a couple's path faster (items 2 and 11), Part D's D1 to D3, the harvest ceiling, the
     capital gains bill's fix; built and off: `shareRule: 'pots'` (item 6), `chooserShortlist: 'order'` with its guard
     (item 7).
   - **Batch 3, at its gate (14 Nov):** Part D's D5 behind `COUPLES` (off), the store in chunks, a restored solve shared
     across its parts, the limits per person.
   - **Read (14 Nov): item 6's stage C, PASS** (`results-couples-share.txt`; in plain words and in full,
     `reports/2026-11-14-stage-c-read.md`): every one of the 36 units gains on the app's rules, none flagged; the pooled
     gain over the 24 re-held units +10.7 points (+10.4 to +10.9). By the registration and D97 (1) it decides the couples'
     default (`shareRule: 'pots'`) and lifts the guard for couples whose elder holds more than 60% and at most 90%. The
     reviewer at the read: PASS, six MINORs, the write-up corrected (by unit the gain is survival's: the median pot lower
     on 20 of 24 uneven units, tax higher on 10 of 36, spending lower on 5 of 36, the oldest couples). The deep review: the
     PASS sound; **the guard opens only where the older partner is entered first**, as every tested couple was: the joint
     move weighs both estates at the first person's own weight, which for an elder entered second would be three to nine
     times any tested (D99 holds them back, "for what the panel tested"). Two leads for the maintainer, neither blocking:
     the share is read from today's pots alone, not from each person's incomes (its one test, a share ensemble,
     EXPLORATORY, about 6 core-hours, queued after the gate); and the joint estate weight itself (a household-level weight
     would need its own test). For the maintainer's UI work: the couples' screens should say the pot is smaller on most
     uneven couples, tax higher on the long-horizon ones, and the oldest couples gain survival, not spending.
   - **Next, in this order (D97):** (a) the speed mode: `chooserShortlist: 'order'` offered as an opt-in "Beta - speed
     mode", off by default, a warning for singles and one for couples, with its tests, to `main` with the next batch
     (built, 11293476; its browser checks to run); (b) couples on under the opt-in by stage C's PASS (D99, built 14 Nov): the
     share rule, the guard on the elder's share and the switch, in one commit with the D-line naming the run
     (`couple-default.test.mjs`; `PART-D.md` D6), the reviewer on the change of default, then one gate for batch 3, the
     speed mode and couples on; then the share ensemble (`SHARE-ENSEMBLE.md`, its rule committed, EXPLORATORY) and
     the solver choosing a couple's share (D102: `PART-D.md` D8, built off, read EXPLORATORY), then speed work to gain back
     its time (D103), then its registered test;
     couples in the other order (D100: `PART-D.md` D7, stage A EXPLORATORY, then stage B registered, its PASS opening the
     guard for the elder entered second); the guard's age cap (a partner who would pass 120 before the plan ends kept on the
     app's rules, with its check: the reviewer on D99, second round, MINOR 1), with the next batch; a couple's solve
     measured on the phone's budget (each part holds both tables;
     Phase 11 measured a single's), before sharing publicly; (c) the
     shortlist's wider read (EXPLORATORY, its rule committed first) when stage C frees the cores, to the maintainer;
     (d) after couples are on, a tie rule for a couple's joint move (EXPLORATORY, its rule committed first): passing, it
     joins the couples' candidate without another word, the reviewer on the change of default; failing, closed and
     reported; (e) the harvest ceiling's allowance step offered at both places, the solver choosing (D98): built off
     with its test, read EXPLORATORY by its rule committed first; passing, it joins the candidate without another word,
     the reviewer on the change of default; failing, closed and reported.
   - **Where they stand (14 Nov, evening).** D102's stage A running (`SHARE-CHOOSE.md`, launched 17:37 UK, its read near
     midnight); then three reads in turn, each with its rule committed: couples in the other order (D100's stage A,
     `OTHER-ORDER.md`; its option `estateWeight: 'elder'` built off in code), a couple's tie rule (`TIE-C.md`; `tieJoint`
     built off in code) and the speed mode on more singles and couples (`SPEED-B.md`). Found at D100's smoke, for the
     maintainer: some of a couple's household choices follow whoever is entered first (whether the lump sum is taken, the
     order a one-off cost is met in), so the other order parts from the tested one even at the same estate weight.
   - **Whenever cores are free:** the research queue (B7), the windfall factorial then the savings factorial,
     EXPLORATORY; a gain comes to the maintainer as a proposal with its registered test.
   - **Ruled (D112, 17 Nov), the four left open with the maintainer** (below): M3 and M6 in the page's words with the next
     batch, the cash buffer's size left for now, `survivalChangeU`'s interval fixed after JOINT-WIDE's read.
2. **The maintainer's work on the UI.** Its scope is the maintainer's; nothing is planned for it here yet.
3. **Sharing it publicly.** Before it: the readiness checklist taken again on that commit, and the maintainer's word on
   the solver on by default and the switch's removal.

**RULED (D92, 12 Nov): when `main` takes the work.** "Merge each batch as it passes the gate." `main`, which the public
link serves, runs the launch candidate; everything under "Built" is ahead of it and is the first batch, gated when the
re-run's cores are free (the gate's browser harnesses time themselves, so they are not run beside it). Each batch after
it merges the same way, on B1's gate, from a release branch cut at the gate's commit.

## Where it stands

- **The candidate.** It passed Phase 4 against the app's rules and the product's settings (`results-phase4.txt`). It
  ships behind Part C's switch (D40), with the failure year charged at what it can pay (D43). The launch candidate is
  d71f65ae871e with the floor at 80% of target (B2) and the dial's positions on its locked tiers (B3, D54).
- **Part C** (`PART-C-PLAN.md`, single households only, D42), in the launch plan's order:
  - Phase 7, the plumbing (`PHASE-7.md`), is merged to `main` (pull request 2).
  - Step 0 (CI and the hooks, B14) is accepted.
  - Phase 8, the Config tab (`PHASE-8.md`), is merged to `main` (pull request 3, 8b54321) on B1's gate (D55: the
    browser harnesses in both modes, the engine suites in CI).
  - Step L (the levers; L4 and L5 read) is merged to `main` (pull request 4, 3370960) on B1's gate.
  - Phase 9, the Strategy tab (`PHASE-9.md`), is merged to `main` (pull request 5, 725c661) on B1's gate, its budgets
    recorded as not met (D56), step P taking the chooser's cost per path first.
  - Phase 10, isolation and the projection (`PHASE-10.md`), is merged to `main` (pull request 6, 08dcff6) on B1's
    gate.
  - Step P, the cost (the cuts exact, Phase 9's budgets met again, gate 5 MET; the 30-point preview not shipped by R5 (a)),
    is merged to `main` (pull request 7, 6e3e4e0) on B1's gate.
  - Step U, the new planner (D58: `research/reviews/2026-11-03/LAYOUT.md`, the launch plan at 90fcb10), is merged to
    `main` (pull request 8, d3e9fe8) on B1's gate, behind the beta.
  - Phase 11, the phone on the new planner (`PHASE-11.md`), is merged to `main` (pull request 9, 9407889) on B1's gate.
  - Phase 12, the opt-in between the two planners (`PHASE-12.md`), is merged to `main` (pull request 10, 0ee3a3b) on
    B1's gate, its readiness checklist all PASS (eight lines, D60): the beta started (R6). Then couples as Part D during
    the singles' beta (B9), D5 the couples' screens in the new planner.
- **The research queue** (B7, EXPLORATORY): GAIN-BUCKET read (`results-gainbucket.txt`, STATE.md's open items): survival
  unchanged; spending beyond noise on three households, two up and one down, each under a fiftieth of a percent of lifetime
  spending. By B7 a gain is a v2 proposal: to the maintainer, below. The windfall factorial is next, whenever cores are free.
- **Research options built, off by default, not run** (EXPLORATORY): the windfall split (`WINDFALL-SPLIT.md`), the
  savings split (`SAVINGS-SPLIT.md`), the age weights and the candidate's tiers (D48, wired by L2 under B3).

## The twelve decisions of 31 Oct, closed on 1 Nov

| # | decision | closed by |
|---|---|---|
| 1 | Merge Phase 8 to `main` | B1 (D51): the agent merges each step's pull request, from a release branch cut at the gate's commit, once `run-all.sh` prints ALL REQUIRED GREEN in both modes, both CI tiers are green on its head and each new test has failed on its plant. |
| 2 | The spending curve's wording: three questions | B4 (D51): the length of the dip; three years; no second rate in the headline; the agent's proposal for a household still working; built as a table of strings. |
| 3 | A higher estate priority than the default | B12 (D51): not now. |
| 4 | The lump sum's route | B12 (D51): the lock alone. |
| 5 | The windfall split's factorial | B7 (D51): in the research queue, second, whenever cores are free, EXPLORATORY, deciding nothing. |
| 6 | The savings split's factorial | B7 (D51): in the research queue, third, at 4,000 paths. |
| 7 | The gain bucket on the candidate's harvest moves (GAIN-BUCKET) | B7 (D51): in the research queue, first, at the 20 households whose taxable account is 10% of wealth or more (about 8 core-hours). |
| 8 | `pay-where.test.mjs` out of the fast suite | B8 (D51, D53): out; it stays in the full tier. |
| 9 | Couples in the solver | B9 (D51): Part D, built during the singles' beta; D4's registration to the maintainer before its run. |
| 10 | Cross-origin isolation in production | B5 (D51): a service worker on GitHub Pages, in Phase 10; the one-worker fallback kept. |
| 11 | Held unless asked (D44 (3)) | B12 (D51): set aside. |
| 12 | The nightly run has never fired | B14 (D51): no nightly run; the full tier on every push in its own workflow (two shards, one run at a time per branch), weekly on `main`, and a watchdog at the session start. Since: it fired once, after this was written (Verify 138 on `main` at 899e5f0, created 1 Nov 09:18 UTC, seven hours after its 02:17 cron; green; the suite 1 h 58 min of the 300-minute cap, on a `main` without the tests added since, the gaps sweep among them); none on 2 Nov by 07:37 UTC. The schedule leaves `main` with Phase 8's merge. |

Also decided on 1 Nov: B2 (the floor at 80%), B3 with B3a (the dial's positions, the age weights: D54), B6 (a per-browser
opt-in for the beta), B10 (the phone at 45 points), B11 (the age dial on request), B13 (the bridge safety margin hidden
for singles under the switch), and the rules R1 to R6 that decide on their measurements (D52).

## What still comes to the maintainer (the launch plan, section 5's stops)

- An unlock the plan needs that D53 did not give (a later edit to a protected test asks again).
- The couples' registration (D4) before its run, and its read.
- The solver on by default, and the switch's removal: before sharing it publicly (D91).
- Any change of default not settled in section 3.
- Any result showing the launch candidate harming a household beyond D34's threshold, or a defect that changes a figure:
  at once.
- A time box running out; a red CI not fixed within a session.
- The reads of L4 and L5 (as reports; R1 to R3 decide them), and what R2 leaves off the dial.
- **Closed on 8 Nov (D62), the seven items left open on 7 Nov**, the maintainer: "1,2 ho with your recommendations, 3b, 4b,
  5,6,7 your recommendations". (1) GAIN-BUCKET's v2 test declined as immaterial (B7): survival unchanged, spending beyond
  noise on three households, two up and one down, each under a fiftieth of a percent of lifetime spending (`results-gainbucket.txt`);
  `gainInterp` stays a research option, off. (2) phone-perf's long-task ceiling moved from 2,200ms to 2,700ms, above main's
  own worst in twelve alternated runs (`results-phone-perf-step-u.txt`). (3) The quick start asks each pot's annual
  contribution and the contribution's yearly increase, beside its balance (beyond LAYOUT.md section 5, which pointed to You,
  Your money). (4) The phone's budget lifted: a solve with a base splits four ways on a touch device, as on any other
  (faster, at more memory; set in the harness's browser, not on a phone: `results-phone-memory.txt`). (5) A restored solve's
  paths stay on one worker for the beta (speed only, never a figure). (6) The browser check page
  (`public/browser-check.html`) removed, with its Chromium harness and its reader. (7) load-perf's switch-on ceiling at D58
  (2)'s limit, noted: the next kilobyte on a switch-on build's classic first load comes to the maintainer. Items 2, 3, 4 and
  6 are one change of the site's code, from a release branch cut from `main` (Part D's code stays off it), merged on B1's
  gate.

## Open from the review of 9 Nov (D66; `research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md` at f77ca16c)

- **Item 1's statement (a STOP, 10 Nov; closed by D67: "Keep panel, seed 7021").** D4 stopped unread with 76 of 520 chunks finished, all on `d4-backup`. The
  statement item 1 asks for ("no arrays file of D4 has been opened, and nothing of a unit's log has been read or printed
  by anyone beyond its stamp line, its second line and whether it holds a done line") cannot be made as worded: each
  log's third line (registered inputs: the couple, the unit, its cohort, its landed target, its paths) and its timings
  (the solve's seconds, the engine's seconds and milliseconds a path, the done line's seconds) were read and printed on
  9 Nov, to time the run. No outcome of any unit was printed or read, and no arrays file was decompressed (STATE.md
  section 5 has the statement in full). By item 1, the re-run then needs a new seed and couples the scan does not list,
  and the maintainer rules on the panel. The agent's recommendation: keep the panel and seed 7021, since nothing read
  carries an outcome, and record the statement as made in the re-run's registration for the design review to check.
- **M3. A one-off pension deposit: what the household pays, or what arrives?** The review's advice: ask in the input's
  label; until then typed deposits stay as they are, and item 4 fixes only the plan's own routing (the windfall split's
  pension-first variant, the staged transfers, an Auto deposit). **RULED (D112, 17 Nov): "Pension - yes it depends on
  input label".** The label says what the engine does: a deposit typed into a pension lands as typed, tax relief not
  added (the app's own Bed & SIPP route enters the relief as its own deposit from External). The words are the agent's to
  draft and the maintainer's to change; with the next batch.
- **M6. The dated rules** (savings rates of 22, 42 and 47% from April 2027; NIC relief on salary sacrifice capped at
  the first £2,000 from April 2029; the thresholds frozen in cash to April 2031, held constant in real terms by the
  engine): carry them by tax year, or state the assumption? The review's advice: state it now (one line on the page,
  beside item 8's caption), and carry the 2027 savings rates when the 2027/28 figures are next updated. **RULED (D112, 17
  Nov): "Tax - yes just state".** One line beside item 8's caption, with the next batch; the rules are not carried by
  tax year.
- **Items 5 and 10 ruled (D73, 11 Nov) and ported (4e6c6a09; D74, D82, D83): the candidate is af001697ce1b.** The reviewer on the change of
  default: FAIL, then PASS after one fix (`reviews/2026-11-11-default-d73.md`, `2026-11-12-default-d73-2.md`). Item 7 answered by the
  external review and read again in item 13's stage A (D85, D86).
- **Noted for the maintainer (D88, 12 Nov): the sweep as the solver's own choice is not built.** The destination is not a
  real choice (the ISA is never worse than the taxable account in tax, access or allowance). What would be one is how much
  is kept in cash: the cash buffer's size, a standing rule (D18), the same for singles and couples and in every arm so far.
  Making it a lever is new solver work with its own experiment (the windfall split, D37, is the nearest thing built). Say if
  it should join the research queue. **Left for now (D112, 17 Nov): "Cash buffer - leave for now".** Not queued.
- **Read, passing (D89): what D73's sweep to the ISA means for a couple, measured before the re-run (`COUPLE-SWEEP.md`, `results-couple-sweep.txt`, EXPLORATORY).** All three parts of the rule hold. For the maintainer to know: the pot's part
  holds on one couple (S059, whose cash ISA money is the largest); six of the twelve leave a smaller mean pot under the sweep to
  the ISA, with survival the same or higher on ten of the twelve and no loss beyond noise. As D87 put it:
  The maintainer, after "go with your recommendations" and before the launch: "but is a fixed rule here really the best way to do
  this? are we sure of that?" The agent's reply: not sure. Measured: the sweep to the ISA against the sweep to the taxable
  account on singles alone (item 5, `results-isasweep.txt`, EXPLORATORY). Not measured: either on a couple; the sweep as the
  solver's own choice (never built; the windfall split, D37, is the nearest, off, its factorial not run). Options: (1) launch
  as it stands, the sweep to the ISA for couples; (2) first the two fixed sweeps side by side on touched couples outside the
  panel, EXPLORATORY, about half a day, then launch on what holds; (3) build the sweep as a solver choice first: days, and the
  couples landed and reviewed again. The agent would take (1), with (2) run afterwards as a check. As it was first put: The reviewer found that a couple's joint
  move left the sweep out, so under tables solved for the ISA the engine swept a couple's cash ISAs to the taxable account
  (S059: all of it). The agent chose: a couple's move carries the sweep its tables were solved with (0b047efd,
  `couple-sweep.test.mjs`), so couples get item 5 as singles do. The other reading: a couple's person-solves leave the key
  out, and couples keep the sweep to the taxable account until measured (item 5's experiment was on singles). The couples
  are landed and piloted on the first reading; choosing the second means a small code change, landing again (ten minutes),
  the pilot and the design review again, before any launch.
  The design review of the revised registration (`reviews/2026-11-12-couples-d4b-design-2.md`, MINOR 5): most of the
  panel's couples hold cash ISA money, so the choice touches most of the panel; launching `couples-d4b.md` as it stands is
  choosing the first reading, and the read has no split by cash ISA holding. A word from the maintainer before the launch
  settles it, recorded as its own D-line.
- **LAUNCHED by D88 and D89, the couples' sweep check having passed: the couples' re-run** (`registrations/couples-d4b.md`, complete; its
  design review PASS, eight MINORs, none blocking). It was launched 12 Nov 12:27 UK from a worktree at 4e4174b1, the commit recording the sweep check's read: the
  registration's blob, `src/`, the engine and the audit's stamp files the same there as at the registration's own commit
  (e6f0179a; the reviewer checked it, `reviews/2026-11-12-read-couple-sweep.md`).
- **RULED (D90, 12 Nov): switching on `tieAboveCap` (D85) and `chooserShortlist: 'order'` (D86).** "I agree with your
  recommendations" (`reports/2026-11-12-stage-b-switch-on.md`; the figures in `results-stage-b-figures.txt`, EXPLORATORY).
  (1) The tie-break joins the candidate after the couples' re-run's read, never between (D78, D80); its wait for the
  beta's end lapsed with the beta (D91). (2) The shortlist is not switched on as built. Its guard is in: a decision the pages
  show is made on the whole menu whatever the solve was handed (`wholeMenu`, `shownPolicy`; `shortlist-shown.test.mjs`,
  `results-shortlist-shown.txt`; `reports/2026-11-12-shortlist-guard.md`). **Still to come back to the maintainer, after
  item 12's stage A has read its effect on a couple's path (D84):** the trade itself, about half a path's time against
  the survival its read lost (pooled, and on S030 and S370), and with it one point the guard leaves open: the first
  year's move the counted paths take is the shortlist's, the page's the whole menu's; where they differ the survival
  shown is of a first year the page does not show (the same move on the one household the test compares, S328F).
- **The couples' re-run: held (D71, 11 Nov) until items 5 and 10 are ported (D73) and item 7 is settled, then landed again; the registration revised after the external review's SHIPC write-up.** As it stood (`registrations/couples-d4b.md`, its design review's PASS):
  On the same 40 couples (landed again) and seed 7021, on the code after items 2 to 5, in item 9's two stages, its budget
  about 188 core-hours if every couple and weight stops at the first stage as the pilot suggests (about 51 hours on one
  four-core session, about 13 over four), 673 at most. To decide: launch it; and whether to run it in up to four cloud
  sessions (item 1, part 3). Item 5's ruling first, if it is to be the default for couples: a change of code means landing
  again and a new pilot.
