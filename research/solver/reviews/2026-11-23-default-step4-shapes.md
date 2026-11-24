# Review of a change of default: step 4's three shapes taken in the app (D145 (1); the D146 draft)

Subject: the change built and not committed in the working tree at 7b48f00f (branch claude/fervent-goodall-e2mrnf): the
household plan taking 'growth', 'cashisa' and 'year0' in the app (`src/solverSettings.js` `APP_COUPLE.takeShapes`, passed
by `src/solverCouple.js` to the page's cut and assembly; `src/solver/household.js` `householdForm`), the guard no longer
refusing them (`src/couplesSwitch.js` `HOUSEHOLD_TAKES`), the coverage line (`src/solverApproximations.js`), the
decided-defaults block's `takeShapes`, the edits to `couple-shape.test.mjs`, `couple-default.test.mjs`, `run-all.mjs` and
`household.test.mjs` (7d), the e3pcls pin, check 19 (b3) of the planner harness, and every claim of STATE.md's D146 draft.
`COUPLES-ANY.md`, `check-prediction.mjs`'s seed 7027 and the DECISIONS-PENDING.md entry staged with them are not reviewed.

## What I read

- The change (working-tree blobs, `git hash-object`): `src/solverSettings.js` 9f245314bb28, `src/solverCouple.js`
  e4c80964e07c, `src/solver/household.js` 59215d9f3874, `src/couplesSwitch.js` 8cc9e5c65e0a, `src/solverApproximations.js`
  15bfbfebdd50, `src/solverClient.js` 8c5b0c3828fb, `src/App.jsx` 1aca768f641f; `research/tests/couple-shape.test.mjs`
  47d33651058e, `couple-default.test.mjs` 13c34a124c57, `household.test.mjs` 309309f9d3e2, `run-all.mjs` b702ed686430;
  `research/ui-harnesses/solver-planner-ui.cjs` 6bf5e470f71d; `research/solver/STATE.md` fb7915b7936f (the D146 line, the
  block, section 5); `e3pcls-pin.json` 1f102df1db84.
- The records: `results-household-shapes.txt` e6863f19ce66, `results-household-shapes-identity.txt` 7ecb0999b762,
  `results-couple-shape.txt` 5072bca08087, `results-couple-default.txt` 1e22f9ff71ae.
- The plan and the rulings: `STEP4-SHAPES.md` bbc70b8e774b, `COUPLES-OPEN.md` 1006fb1d4f09 (step 4, amendments 1 to 3),
  `REFUSALS.md` d1c9ff554591, `COUPLES-ANY.md` cdacb0c0eac6 (for what it says the step rests on), `DECISIONS-PENDING.md`
  2169e937103d (the step 4 entry, l.31-60), D145 as committed at 7b48f00f, D136 and D144.
- What the claims rest on: `research/tests/household-shapes.test.mjs` c2b9d400065c; `src/solverStrategy.js` df881f8dd151
  (`solvedContext`, l.45); `src/solverWorker.js` (l.162, l.167); `research/engine.mjs` ca1de90535c9 (the cash ISA's fold
  l.1724, the one-off deposits' claim ledger and staging l.1811-1904, stepYear's contributions l.2227 and cash ISA l.2241 and
  7e l.2771, the working take-home l.2339, `resolveMpaa` l.2907, `wrapperHeadroomAtYear` l.3589);
  `research/solver/audit-couples-open.mjs` 8ccaa3118266 (l.138-140); `research/solver/couples-open-panel.mjs` d39c677d4f37
  (`routeOf`, l.173-178).
- Run on the working tree:
  - `couple-shape.test.mjs`: ALL PASS, 4 checks, the record's figures (1,680 refusals each way, none missed; check 4: 420,
    840 and 1,260 taken, none over-reached or missed; under 'notake' every one over-reached, under 'cutnotake' every one
    missed).
  - `household-shapes.test.mjs`: ALL PASS, 4 checks, the record's figures.
  - `household-client.test.mjs`: ALL PASS, 9 checks.
  - `couple-default.test.mjs`: ALL PASS, 9 checks, the record's figures. `--planted`: 20 of 20 plants
    failing exactly their checks (exit 0), 'notake' and 'cutnotake' exactly 9, 'beforetake' exactly 4, as the record.
  - `check-state.mjs`: passes (300 lines). `codeId()`: 54421a496690, as (7d) pins. `e3pcls-pin.mjs`: 53206d3921b19c2d, the
    pin MATCHES.
- Reviewer's scratch scripts, EXPLORATORY, no held-out seed and no outcome read (session scratchpad): `landed3.mjs` (each
  later-retiree pension deposit the household plan lists, as its own engine context lands it), `landed2.mjs` and `s199.mjs` (their
  staged drips, by unit), `cashisa-binds.mjs` (check 4's binding years by variant and by limit), `b3.mjs` (check 19 (b3)'s couple),
  `e2e.mjs` (a light end-to-end solve), `phased.mjs` (dated contributions).

Verdict: FAIL

One BLOCKING (finding 1), five MINOR. What holds:

- The cut and the assembly build one household plan: both take `takeShapesOpt()` (`src/solverCouple.js` l.33, l.129,
  l.137), the worker runs both from that module (`src/solverWorker.js` l.162, l.167), and the assembly refuses a table solved
  on another plan (`householdFromTable`, `household.js` l.361-364).
- The guard skips exactly what `householdPlanFor` now takes (`couplesSwitch.js` l.186-188, l.197; `household.js` l.152-156,
  l.185, l.196): no refusal missed either way round, no over-reach on the library as entered, check 4 failing under both
  plants. With the guard's set and the app's held equal (couple-shape check 4, couple-default check 1), no shape of the
  battery that the guard opens is refused by the cut, so none fails closed in the client.
- An unknown shape is an `opts.` fault (`household.js` l.142), which the client lets stand and does not fall back on
  (`solverClient.js` l.271).
- A couple with none of the shapes keeps its household plan byte for byte (household-shapes check 1, the three named, 420
  plans).
- The figures a household-route couple is shown are the engine's run of the couple's own plan under the table's moves:
  `solvedContext` builds `withHouseholdSingle(solved.plan, solved)` (`solverStrategy.js` l.45), `solved.plan` being the
  cut's `household`, the couple's plan (`solverCouple.js` l.137; `household.js` l.379).
- The coverage line names the four refusals still made, in the guard's order, and none taken; 'beforetake' fails check 4.
- The D146 draft's claims of the code, the block, the tests and the records are true, but for findings 1 and 2.

## Findings

1. **BLOCKING. A later retiree's pension saving does not land in the household plan as it does in the couple, so 'year0'
   (and 'growth' after the first retirement) is not exact, and the maintainer's go was given on "exact".**
   - What the maintainer was told: `DECISIONS-PENDING.md` l.37-41, "'growth' ... exact" and "'year0' ... exact", with the
     cash ISA's limits the one inexactness to say (l.58); D145 (1) is the go on that. The D146 draft: "exact for 'growth'
     and 'year0' on what their checks measure".
   - What the checks measure: the deposits the household plan lists (`household-shapes.test.mjs` l.107 and l.144 read
     `after.oneOffContributions`), not what the household plan's engine lands.
   - What the code does. From the first retirement the later retiree's contributions are dated External deposits of the
     household person (`household.js` l.189-211, l.209). A 'year0' couple's first retirement is plan year 0, so all of its
     later retiree's saving goes this way. The engine claims each deposit against the household person's pension room
     (`engine.mjs` l.1821-1834, l.1889) and sends the rest to the GIA, staged (l.1902-1904). That room
     (`wrapperHeadroomAtYear`, l.3589-3611) is:
     - the no-earnings limit, which the household plan raises only to its largest single deposit (`household.js`
       l.265-266), shared with the plan's own pension deposits and their staged drips;
     - the household's doubled MPAA, once the household person draws taxable pension on the expected path (`resolveMpaa`,
       l.2907-2916; l.3604-3606);
     - nothing from the first person's 75 (l.3596).
     In the couple's own run the same money is the later retiree's regular contribution, which takes no room (l.2227-2240).
   - Measured (`landed3.mjs`: `householdCut` at 'pensionsPA', then each listed `dep_house_pen` deposit's entry in
     `E.buildContext(cut.hplan).oneOffStaging`; no path run):
     - RWY75, the registered panel's units this change moves onto the household route: S279-RWY75 6 of its 18 deposit years
       short, £59,266 of £97,779 into the pension when listed. From plan year 12, where the plan's own £81,000 Auto windfall
       takes the household's £7,200 room, each later deposit lands in the GIA, and £5,760 a year is staged from the GIA into
       the pension (`s199.mjs` on the unit). S199-RWY75 1 of 8, £42,757 of £49,619.
     - S001 (inside the guard, 60/40), the first person 76 and retired, the partner 62, paid £40,000 and paying £5,000 a
       year into their pension to 66: 4 of 4 short, £0 of £20,000, none dripped back (no room from 75). The table never sees
       that saving in a pension.
     - S001, the first person 66 and retired (the household's MPAA from 66), the partner 58, paid £120,000 and paying
       £35,000 a year to 63: 5 of 5 short, £21,250 of £175,000; £153,750 into the GIA, £127,000 of it staged back into the
       pension by plan year 8 (`landed2.mjs`).
   - Reproduce the first constructed case from the repository root (`node --input-type=module`):
     ```js
     import * as E from './research/engine.mjs'; import * as M from './src/solver/model.js';
     import { householdCut } from './src/solverCouple.js'; import { APP_COUPLE } from './src/solverSettings.js';
     import { buildScenarios } from './research/policy-study/scenarios.mjs';
     const p = structuredClone(buildScenarios().find(s => s.id === 'S001').plan);
     Object.assign(p.demographics, { currentAgeSelf: 76, retireAgeSelf: 66, currentAgePart: 62, retireAgePart: 66, salaryPart: 40000, terminalAge: 100 });
     Object.assign(p.accounts.find(a => a.id === 'pen_part'), { contrib: 5000, growth: 0 });
     const hp = householdCut(E, M, p, APP_COUPLE.household).hplan, ctx = E.buildContext(hp);
     for (const d of hp.oneOffContributions.filter(x => /^dep_house_pen/.test(x.id))) { const s = ctx.oneOffStaging.get(d.id); console.log(d.year, d.amount, s.direct ? s.amount : s.H0); }
     ```
     It prints each year's £5,000 and £0 into the pension.
   - Not new in kind. The same household with both working today (64 to 66, 56 to 63) gives the same £21,250 of £175,000,
     and the registered couples-open read's own arm had it on S199's ten household-route units (Y75 to E100 1 of 3 years
     short; G8 and G8Y75 6 of 8; G12, G12P and G12R 10 of 12). It is a defect on `main` since D136. What this change adds:
     - a class of couple whose later retiree's every working year runs through it, usually with the household drawing from
       year 0;
     - the elder past 75 with a younger partner paying into a pension, which no unit of the registered couples-open panel
       had (`landed3.mjs`: only S199's ten were short, none of them past 75).
   - What it costs: the figures shown stay the engine's run of the couple (above), so the cost is in the table's decisions,
     which nothing has measured. But the inference the D146 draft and `COUPLES-ANY.md` rest on (l.29-33: "where the household
     plan is exact this follows from the tested classes by inference, as step 4's shapes do") assumes an exactness the code
     does not give these couples.
   - Fix, either way:
     - (a) The later retiree's pension saving lands in the household plan as the couple's engine lands it, not against the
       household person's room (its no-earnings limit, its MPAA, the first person's 75). With a check of its class: each
       listed later-retiree deposit landed in the household plan's pension in every year, over the library's 'year0' and
       later-retiree variants, among them a saver above the household's doubled MPAA, an elder past 75, and a plan with its
       own pension deposit. With its plant. It is a defect on `main` (CHECKLIST 7).
     - (b) The D-line and DECISIONS-PENDING.md say it, with these figures, and it goes back to the maintainer before the
       change is committed, as the cash ISA's limits did.

2. **MINOR. The cash ISA's stated limit is put on the wrong allowance.**
   - The D146 draft says that where one person's own cash ISA limit binds, "the household's doubled cap shelters more, by as
     much as £7,428.38". `STEP4-SHAPES.md` ("As built") says all 1,385 years bind on "the first person's own cash ISA cap".
     DECISIONS-PENDING.md l.43-44 says the same.
   - My reproduction of check 4's binding years (`cashisa-binds.mjs`; the same 1,385, all in the uneven variant):
     - 900 bind on the first person's own cash ISA cap, the household subscribing up to £3,000 more;
     - 335 bind on their ISA allowance left after their S&S ISA contributions, up to £7,297.19 more;
     - 150 bind on that and on the household's own limit, up to £7,428.38 more.
   - So the largest gap is the household pooling the partner's unused ISA allowance, not its doubled cash ISA cap. What is
     measured is the year's subscription (step 2a), not what is sheltered at the year's end (step 7e, on the household's
     pooled cash at its doubled caps, design A's for every household plan).
   - Fix: "where one person's own cash ISA cap or ISA allowance binds, the household's pooled allowances subscribe more, by
     as much as £7,428.38 a year", and the same in `STEP4-SHAPES.md`.

3. **MINOR. The inference for couples inside the guard before D143 names the wrong read.**
   - The D146 draft gives such couples "the household route's classes' outcomes by inference". Those are couples-open's Y, E,
     S and G, read against the app's rules outside the guard.
   - A couple inside the guard with one of these shapes moves from today's route to the household route. That is the
     comparison step 8's registered read made (HSPA against K2, PASS, M1 naming S273-90; D134, D136), on couples with none
     of these shapes. D136's by-inference list said such couples keep today's route.
   - Fix: name step 8's read as their inference.

4. **MINOR. D145 (1)'s "the app's route held to the audit's household route on such couples" is neither made nor said.**
   - The research arm calls the same `householdCut` and `householdSolved` (`audit-couples-open.mjs` l.138-140; `routeOf`,
     `couples-open-panel.mjs` l.173-178). So the cut and the assembly are shared by construction, and RWY75 now routes to the
     household in the audit too.
   - What an identity adds, as `couples-open-port-identity.mjs` did for D144 (the client's mirror, each part's bands, the
     context, path for path), has no arm on these shapes to be held to: RWY75 was landed and not run.
   - Fix: the D-line says what holds it (the shared functions, and check 19 (b3) on one couple at B1's gate) and that
     `COUPLES-ANY.md`'s class W makes the identity before its read.

5. **MINOR. Check 19 (b3) exercises 'year0' alone, and no test solves a household with a schedule.**
   - The fixture's first person is retired in plan year 0, so the household person retires at plan year 0 (`b3.mjs`: "its
     schedules: isa_self: sum 0; cash_self: sum 0; its own cash ISA subscription £2000, made in no year").
   - No page check solves a household with a 'growth' schedule or a merged subscription, nor a shaped couple inside the
     guard leaving today's route.
   - In Node a light end-to-end solve did go through cleanly (`e2e.mjs`): S241 with both working, ISA contributions £6,000
     rising 3% and £4,000 flat, cash ISA £3,000 and £1,000. The schedules were isa_self 10000/10180/10365..., cash_self
     4000/4120/4244...; the cut, the table, the assembly and 50 engine paths ran without error.
   - Fix: give (b3) a both-working case (or add one), so the page meets a schedule.

6. **MINOR. A defect on `main` in the same merge: dated contributions with the same growth field.**
   - Where both people's accounts of one wrapper carry a dated schedule (`contribByYear`, which the app's phased strategy
     writes for each person's pension and ISA, App.jsx `applyAllocationToPlan`) and the same growth field, the merged
     account keeps the first account's schedule (`household.js` l.150), and only `contrib` is summed (l.161). So the
     household plan drops the partner's contributions before the first retirement.
   - `phased.mjs`, S241, pensions phased (£5,000 rising £1,000 a year; £3,000 flat): the household £5,000, £6,000, £7,000,
     £8,000 in plan years 0 to 3, against the couple's £8,000 to £11,000. With the growth fields apart, step 4's 'growth'
     schedule gives the couple's to the pound.
   - This change does not move such couples (taken before and after), but it is 'growth''s own class (`STEP4-SHAPES.md`'s
     check: each wrapper's contribution the two added in every year before the first retirement).
   - Fix: with its test (CHECKLIST 7), e.g. the schedule wherever either account carries one.
