# Open decisions and where the plan stands (1 Nov)

An index for finalising the plan. Each item names the file that holds its detail. Where the work stands in full is
`STATE.md`; the rules are `CHECKLIST.md`.

## Where it stands

- **The candidate.** It passed Phase 4 against the app's rules and the product's settings (`results-phase4.txt`). The
  maintainer decided it ships behind Part C's switch (D40), with the failure year charged at what it can pay (D43). Its
  settings: `candidate.json` (STATE.md section 2).
- **Part C** (`PART-C-PLAN.md`, single households only, D42):
  - Phase 7, the plumbing (`PHASE-7.md`), is merged to `main` (pull request 2).
  - Phase 8, the Config tab (`PHASE-8.md`), is built on the branch. Its pull request goes to `main` once
    `research/ui-harnesses/run-all.sh` prints ALL REQUIRED GREEN.
  - Phases 9 to 12 are not started.
- **Research options built, off by default, not run** (EXPLORATORY):
  - the windfall split (`WINDFALL-SPLIT.md`);
  - the savings split (`SAVINGS-SPLIT.md`);
  - the age weights and the candidate's tiers (D48).
- **The branch.** Everything since Phase 7's merge is on `claude/project-access-i58m0x`, not yet on `main`: the windfall
  and savings splits, the gaps sweep in the nightly tier, and Phase 8.

## Decisions open for the maintainer

| # | decision | options, and the agent's recommendation | cost | detail |
|---|---|---|---|---|
| 1 | Merge Phase 8 to `main` | Merge once the gate is green and CI is green on its head. D50's leave to merge covered Phase 7 only. | none | `PHASE-8.md` |
| 2 | The spending curve's wording: three questions | (a) When the full explanation shows: the first year below target alone (as asked), the length of the dip (proposed), or the chance of lasting at the full target. (b) The threshold between the short note and the full text (three years proposed). (c) Whether the headline also shows the chance of lasting at the full target. Recommended: the length of the dip, three years, and no second rate in the headline. Phase 9's headline waits on this. | none | `PART-C-WORDING.md`, "Open for the maintainer" |
| 3 | A higher estate priority than the default | Phase 8 offers standard and lower, the two weights Phase 4 measured. A higher one is unmeasured. If wanted, it is measured first, as the dial was (D44 (1)). Recommended: not now. | a dial-sized run | `PHASE-8.md` |
| 4 | The lump sum's route | The solver choosing the lump in one solve (a "taken" bucket in the table's state, two to three days); two solves keeping the better (half a day, but gate 5 at about 1.7 times unless the two run side by side); or the lock alone, already built (free, never, now). The evidence says the gain is small. Recommended: the lock alone for now. | as listed | `AFTER-PHASE4.md` section 2 |
| 5 | Run the windfall split's factorial | The panel's 17 households with an Auto deposit, CANDD against CANDW, seed 7002. Reported, deciding nothing. Recommended: run. | 34 units, about 10 core-hours | `WINDFALL-SPLIT.md`, "The run" |
| 6 | Run the savings split's factorial | The panel's 27 households with a working year to choose, CANDD against CANDS, seed 7002. Reported, deciding nothing. Recommended: run, at 4,000 paths. | 54 units, about 19 core-hours at 8,000 paths (upper guide 32), about 13 at 4,000 | `SAVINGS-SPLIT.md`, "The run" |
| 7 | Measure the gain bucket on the candidate's harvest moves (open item GAIN-BUCKET, D49) | The candidate with and without the interpolated gain axis, on the households with a taxable account. Recommended: run, since it is the one open item with no measured effect on the candidate. | about 16 core-hours | `HARVEST-SIZING.md` |
| 8 | `pay-where.test.mjs` out of the fast suite | It tests an option off in the app and in the candidate, and takes about half an hour of each commit's suite. It stays in the nightly suite. Needs the maintainer's "unlock enforcement". Recommended: yes. | none | STATE.md section 6 item 2 |
| 9 | Couples in the solver | After Part C (D42). What it needs: the three known gaps, the candidate's features for two tables, and a held-out couples test with its harm rule. Its build plan comes to the maintainer then. | to be sized | `PART-C-PLAN.md`, "After Part C" |
| 10 | Cross-origin isolation in production (for the split solve) | GitHub Pages cannot send the two headers. Cloudflare Pages or Netlify can, or a service worker on Pages. Phase 12's call; until then the solve runs whole in one worker. | none now | `PHASE-7.md`, "Deferred to Phase 12" |
| 11 | Held unless asked (D44 (3)) | The first year held at the target; Epstein-Zin preferences. | not sized | STATE.md D44 |
| 12 | The nightly run has never fired | `main`'s `verify.yml` has carried the nightly schedule (the full suite) since Phase 7's merge, but GitHub lists no scheduled run in the repository's history. The repository's Actions settings are the maintainer's to check. Until then the full suite runs by hand (workflow_dispatch, tier `all`). | none | `.github/workflows/verify.yml` |

## Next, without a decision

- Phase 9 (the Strategy tab, `PART-C-PLAN.md` item 4): the comparison, this year's actions with their cost measured by
  simulation, the rule of thumb (`distil.js`) and the next ten years. Its headline and explanation wait on item 2.
- The gaps sweep joins the nightly tier on `main` when the branch is merged (item 12 permitting).
