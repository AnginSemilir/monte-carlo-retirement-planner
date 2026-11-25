Verdict: FAIL

# Review at the read: every couple on the solver, the registered test (`registrations/couples-any.md`, seed 7027)

**Subject.** The registered read `results-couples-any-registered.txt`, W's identity on the run, the two files beside the read,
and the write-up `reports/2026-11-25-couples-any-read.md`, all as committed in dc4814d8. The read was written by
`REG=1 node research/solver/reduce-couples-any.mjs --registered` from the launch worktree `/home/user/couples-any-reg` at
48522d79, at 06:36 on 25 Nov.

**What I read** (git blobs, first 12):
- the registration 69550ed2a68f, `COUPLES-ANY.md` bb48b165d663, the write-up a101efa92c33 and STATE.md 6e8074a3572e (D116,
  D141, D144 to D147, sections 5 and 6);
- the results files: the read 041784d3ccc8, W's identity 21847ca4b632, the beside file e49b5ce7011b, the MPAA file
  29fdab5172a3 and the sizing 3a08845c3a75; also the rehearsal's read be232e8c528b and its beside file 05aaa7023eb2;
- at 48522d79:
  - the reducers: `reduce-couples-any.mjs` 7cade2e95b6b, `reduce-couples-open.mjs` 6a4a5735fe55,
    `reduce-share-rules.mjs` b46fa5187e99, `reduce-couples.mjs` cae05c5a8e75, `reduce-household-hsp.mjs` 153cbfeebc48 and
    `reduce-phase4.mjs` ac319aad1f44;
  - the run's machinery: `audit-couples-any.mjs` 2287e10c87a7, `couples-any-panel.mjs` 08edadc2eaef,
    `couples-any-port-identity.mjs` 283f98d3087c, `batch-couples-any.sh` 9d7ff8d915f1, `fair-gate.mjs` c6b3e87e1643 and
    `run-from-snapshot.sh` cf7ab99bb4ec;
  - its data files: `couples-any-paths.json` 519dab8b1360 and `couples-any-registered-panel.json` ee8b47fa0f5b;
  - the app's code: `src/solverSettings.js` 9f245314bb28, `src/solverCouple.js` cc5152b54a13, `src/solverStrategy.js`
    f102cb2864a8 and `src/solver/household.js` 94aca9051d20;
  - `research/engine.mjs`, which is built and not tracked. It has the same sha256 (48cb9eb1...) in the launch tree and in all
    three snapshots;
- outside the stamp: `couples-any-beside.mjs` ff69792b5d77, `couples-any-mpaa.mjs` 8071dae101ed and
  `drafts/COUPLES-ANY-DEFAULT.md` b020a347c6ea;
- the run itself:
  - its 136 records and 136 unit logs in `results/couples-any-run`, and the three launch logs;
  - the three snapshots, `/tmp/solver-snap-tb8nII`, `-xhNDkB` and `-kRqbri`, and the worktree's reflog;
  - W's identity's four part files (the session scratchpad, `reg-read/id-part0..3.txt`).

**What I ran.** None of it runs a solve, a path or a batch, and none of it decides anything.
- **The reducer's own functions on the stored arrays.** A scratch script imported the launch tree's files under REG=1 and ran
  `checkLogStamps`, `gate`, `identityOf`, `rule`, `m1ByUnit` and `allSpendOf`.
- **My own code.** It recomputed each class's pooled survival by path, its kept-path point and every unit's D34 statistic.
- **`REG=1 reduce-couples-any.mjs --planted`:** `PLANTED: ALL PASS (22)`.
- **`REG=1 couples-any-port-identity.mjs --combine` on the four part files.** It reproduces the committed identity file byte
  for byte.
- **`couples-any-beside.mjs` on both reads, and `couples-any-mpaa.mjs`.** Each reproduces its committed file byte for byte.
  The MPAA script's `--planted` prints `planted (5 lines): all read as they should`.
- **The snapshots.** `diff -rq` of each against `git archive 48522d79`, and each one's code, smoke and audit stamps.

The read stands. The gate is fair, the rule ran as registered, every class passes on figures I reproduced, and the outcome
line follows the registration. The FAIL is one claim in the write-up (finding 1), a one-sentence fix.

## What holds

1. **The gate** (check 1).
   - `checkLogStamps` finds no fault. All 136 unit logs open with the same line: `stamp: code d91a642206b9 audit
     3a5474defb4f prediction research/solver/registrations/couples-any.md sha 69550ed2a68f9c77b8018d1df6bd6ccbe529f0a0`.
     That sha is the registration's blob at 9b954035, at 48522d79 and now.
   - `gate()` makes no refusal. Every record has:
     - mode `registered`, seed 7027 and N 26000 (`couples-any-paths.json`);
     - 45 points, W 0.02 and Node v22.23.4;
     - APP `ef459a5c8ccb` and ROUTE `0fea0d25d803`, with ROUTE on `solvedContext`.
   - `stampFilesHash()` on the launch tree is `3a5474defb4f`.
   - Each recorded shape passes `unitProblems` (0 problems):
     - W's guard is on, with no route of its own at 'own' (12) and on the household route at Y75 (12);
     - R's, L's and P's guard is on with no route at 'own', and off for 'shape' at Y75.
   - The arms' recorded engine inputs (`audit-phase4.mjs` `inputsHash`) are the same on 70 units. They differ on 66: the 62
     where the MPAA ages differ, and S041-L-own, S041-L-Y75, S123-L-own and S123-L-Y75, where ROUTE's pensions sit at the two
     limits by design. Nothing else differs between the arms.
2. **The relaunches** (checks 1 and 9).
   - **What was done before each restart.** 96 records were written before 01:15:09 UTC and 130 before 03:56:27.
   - **The units resumed.** `resumed` appears only in cases 96 to 99 and 130 to 133. Each passed the audit's take-up test
     (`audit-couples-any.mjs` l.212 to 217): the stamp including the registration's sha, the seed, N, the points, the
     re-solved table's digest and the configuration.
   - **Nothing left unfinished.** `parts/` is empty and no launch log has an `exited` line.
   - **The snapshots.** Each holds 48522d79's `src/`, `research/` (results left out) and `package.json` exactly, except:
     - `runs.log`, which differs by the launcher's own lines;
     - the two gitignored built files.

     Each snapshot gives code `d91a642206b9`, smoke `16d5ddc2462a` and audit `3a5474defb4f`.
   - **The five uncommitted files.** The branch at 575998b5 and at 84ce77b2 differs from 48522d79 in exactly the five files
     the launcher counted. The drafts sit outside what the snapshot copies.
   - **The reflog.** HEAD went to 575998b5 at 01:17:29 and back to 48522d79 at 01:18:31. It went to 84ce77b2 at 03:57:42 and
     back at 03:58:30. Neither move was a checkout.
   - **A check on the resume.** W's identity re-solved the four resumed W units (S197-Wg-own, -Wg-Y75, -Wc-own and -Wc-Y75)
     in one fresh process and matched all 26,000 paths of ROUTE on each. So on those four units the take-up is confirmed
     path for path.
3. **W's identity** (check 2).
   - Each part ends `part k/4: 6 of 6 units IDENTICAL (this tree: code d91a642206b9 audit 3a5474defb4f)`.
   - Combined, the parts make the committed file. Its header names the run's stamp and the same tree, every W unit is
     IDENTICAL, and the count is `24 of 24 units IDENTICAL`.
   - `identityOf` returns ok.
4. **The rule** (check 3). Reproduced to the printed digits, both ways:

   | class | pooled survival, by path | spending on the paths both keep (point) | units flagged | nearest unit to its threshold |
   |---|---|---|---|---|
   | W | `+12.2058` (`+11.9272` to `+12.4843`) | `+5.41727` | 0 | a margin of 2,922 paths |
   | R | `+10.5996` (`+10.3809` to `+10.8183`) | `+4.41027` | 0 | S281-Ri3t-own, 80 lost and 1,409 saved against 130, a margin of 1,459 paths |
   | L | `+12.2365` (`+11.9819` to `+12.4912`) | `+5.05602` | 0 | a margin of 2,825 paths |
   | P | `+11.9630` (`+11.6518` to `+12.2742`) | `+6.04260` | 0 | a margin of 2,987 paths |

   - The planted cases fail each part on its fault, and L passing without R goes to the maintainer.
   - R passes, so L opens with it. The outcome line is the one the registration's Outcomes give.
5. **M1** (check 4).
   - `m1ByUnit` names S041-Rp1t-Y75 (3,483 net, `-0.9379` (`-0.9936` to `-0.8823`)) and S041-Ri1s-Y75 (3,147 net, `-0.3579`
     (`-0.4091` to `-0.3066`)).
   - They are the only two units below APP over all paths beyond noise. They are also the only two below nought on the kept
     paths at all.
   - The write-up sends them to the maintainer before any default changes (l.173), as the registration asks.
6. **The figures** (check 5). Every other figure in the write-up is in the file it cites:
   - the class table and the M1 table;
   - D34's margins, rates and discordance;
   - the paths lost, both arms' survival ranges and R by its parts;
   - the pot and the tax by couple;
   - the MPAA counts (the rehearsal's six units with an age missing are N's, blank in both arms, so "1 of 144" holds);
   - the pilot's two M1 names (`results-couples-any-sizing.txt` l.140);
   - "the mean pot falls further than the capped one on most units" (124 of 136);
   - the times and counts in "The run".
7. **The reach and the next steps** (checks 6 and 7).
   - The inference list is the registration's, and nothing is claimed for N, C or E.
   - Next names the change of default with the reviewer on it, the protected tests asked by name, and B1's gate.
   - The draft (`drafts/COUPLES-ANY-DEFAULT.md`) carries the identity the Outcomes require.
8. **The MPAA tally** (check 10).
   - `mpaaOfLine` reads the read's unit lines as they are.
   - Its planted lines separate earlier, later, both ways, the same, and a blank in both arms.
   - The write-up says why is not shown (l.145), but see finding 3.

## Findings

1. **BLOCKING. The write-up says why the two M1 units spend less, and the read does not show it.**
   - **The claim.** Write-up l.80: "ROUTE loses no path on either and saves `3,483` and `3,147`, and pays for it with a little
     less spending."
   - **What "pays for it" asserts.** It makes the lower spending the price of the saved paths.
     - No results file links the two. The spending is measured on the paths both arms keep, the saved paths are other paths,
       and nothing decomposes one into the other.
     - This is the claim the reviewer at the guard's own read held BLOCKING for S037 ("trades spending for survival",
       `reviews/2026-11-22-read-couples-open.md` finding 1). D143 then accepted S037's "shortfall".
   - **S041's own records go against it** (`results-couples-any-registered.txt`). Units of the same couple keep as many or
     more paths net while spending more on the paths both keep:

     | unit | paths kept net | spending on the paths both keep | line |
     |---|---|---|---|
     | S041-W0-Y75 | 3,679 | `+1.5096%` | l.10 |
     | S041-L-Y75 | 3,650 | `+0.3017%` | l.150 |
     | S041-Rp1t-own (the same kind at the elder's holding) | 3,579 | `+2.3651%` | l.40 |
     | S041-Rp3t-Y75 | 3,569 | `+0.6373%` | l.49 |
     | S041-Rp1s-Y75 | 3,563 | `+0.1352%` | l.39 |
     | S041-Ri1s-own | 3,462 | `+2.0492%` | l.50 |

     The write-up's own l.86 says the same: every other S041 unit spends more on the paths both keep.
   - **Where else the money went.** On S041-Rp1t-Y75 the capped pot is also lower (`-£25,362` a path) and lifetime tax
     higher (`£3,437` to `£16,545` a path) (l.41). So the lower spending is not shown to have gone to survival rather than to
     tax.
   - **Fix.** State the co-occurrence. For example: "ROUTE loses no path on either and saves `3,483` and `3,147`, and spends
     less on the paths both keep; the read does not show why, or that one is the price of the other." In Next (l.173 to 174)
     and in STATE.md action 2 ("both trades accepted"), say "both units' shortfalls", as D143 worded S037's.

2. **MINOR. "that script was written on 24 Nov, before any of seed 7027's outcome existed" (l.34 to 35) is not so.**
   - **When it was written.** The change for the registered read was committed at 22:04:11 UTC on 24 Nov (575998b5). By then
     54 of the 136 unit records, each holding both arms' arrays, were already in `results/couples-any-run`. The count is
     `find ... -name '*.json.gz' ! -newermt '2026-11-24 22:04:11'`; the first record is S041-W0-Y75's, at 18:48:58.
   - **What holds:**
     - it was written before the read;
     - the run's logs carry no outcome (the registered done line);
     - its change is the heading, N's section and a flagged unit's line;
     - the rehearsal's file reproduces through it byte for byte;
     - it decides nothing.
   - **Fix.** Say that: "committed 24 Nov at 22:04 UTC, while the run was going and before the read". Correct the same words
     in `couples-any-beside.mjs`'s header (l.18 to 20).

3. **MINOR. The MPAA bullet claims more than the code supports, and leaves out where ROUTE's ages come from.**
   - **The claim.** l.143 to 144: "ROUTE's the page's own context for the solved couple. Each arm's paths run on its own
     ages, so every figure above carries them."
   - **Where the ages come from** (code):
     - ROUTE's context builds the couple's plan as `householdCut` prepared it (`src/solverStrategy.js` l.46,
       `withHouseholdSingle(solved.plan, ...)`; `src/solverCouple.js` l.130 `householdPlan`, then l.48
       `appPlan(prepareForSolve(...))`).
     - `prepareForSolve` resolves the MPAA on arm A's policy with the guardrails off and no lookahead
       (`src/solverSettings.js` l.261 to 263).
     - APP's ages are resolved on arm A's plan with the guardrails on and the five-year lookahead (`audit-couples-any.mjs`
       l.195 to 196).
     - So both arms' ages come from the app's rules' expected path under two settings, and neither comes from ROUTE's moves.
   - **What the ages reach** (code; `research/engine.mjs`, built):
     - The engine levies nothing on a contribution past the MPAA ("which the model does not itself levy", l.1777 to 1778).
     - A person's MPAA age moves money in a run in one way only: through a pension's room for a one-off deposit or a staged
       tranche (`mpaaAppliesAtYear` l.3485, used by `wrapperHeadroomAtYear` l.3653 to 3655, used by `buildContext`'s routing
       l.1834 to 1956).
     - Two other callers do not reach these runs: the savings split's routes (l.3607, off for a couple's solve, D138) and the
       accumulation tool (l.3694).
   - **On the 62 units:**
     - The plans of S281, S185 and S197 hold no one-off contribution.
     - S207's one is the first person's Auto deposit dated 2033 (valuation date 2026-01-01, so the first person is 62). That
       is past both arms' ages for the first person (58 or 60), and in retirement. So its pension room is the no-earnings
       limit in either arm (l.3657 to 3659).
     - So by the code, the earlier ages move no money on any of the 62 units.
   - **Fix.** Replace the sentence with what the code shows, marked as read from the code and not measured. Or say that the
     ages' effect on the figures is not shown either.

4. **MINOR. The write-up drops the registration's limit on what L's pass shows.**
   - **The limit.** Registration l.21 to 24: APP "reads no solver limits ... L compares the household route under the two
     people's limits with the app's rules without them, as the user would see it, and a pass does not show the limits cost
     nothing (the design review, its item 9)."
   - **The records show the difference.** The arms' engine inputs differ on S041-L-own, S041-L-Y75, S123-L-own and
     S123-L-Y75, where the MPAA ages agree: ROUTE's pensions are held at the two limits, APP's at the plan's own risks.
   - **Why it matters.** The maintainer reads L's pass from the write-up (l.44 to 45, and "What it does not show",
     l.147 to 164).
   - **Fix.** Add the limit to "What it does not show", and to the D-line.
