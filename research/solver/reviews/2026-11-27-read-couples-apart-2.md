# Review at the read, second look: couples four and five risk levels apart (`COUPLES-APART.md`; EXPLORATORY, seed 7002), 27 Nov

**Subject.** The fix round (9d27c455, claude/fervent-goodall-e2mrnf) answering my first look's FAIL
(`reviews/2026-11-27-read-couples-apart.md`: two BLOCKING, three MINOR) on COUPLES-APART's read. Under review: the write-up
`reports/2026-11-27-couples-apart-read.md`, STATE.md section 5's line on the read (D154 (5)), and `couples-apart-beside.mjs`
with its output. The commit also carries the employee's pension question's fix round and D155. Neither is reviewed here.

**What I read** (git blobs at 9d27c455, first 12, unless named):
- the write-up 7b08dd663cec;
- STATE.md fe43cbb7cc4e (section 5, l.292, and the D154 line);
- `DECISIONS-PENDING.md` 1e648e943320 (its entries on R past three profiles);
- `couples-apart-beside.mjs` 9c448c1e55bc and `results-couples-apart-beside.txt` 1804ff4b02ab;
- `results-couples-apart.txt` 16fe5f2e12ab, the blob my first look read (untracked then);
- `results-couples-any.txt` be232e8c528b (l.33, l.134-143);
- `reviews/2026-11-25-default-couples-any.md` 19f405148a8d (MINOR 3, l.181-208);
- my first look, 0b256de0f5eb. It was committed as I left it: the file was last written at 23:09 UTC, before the commit;
- `COUPLES-APART.md` fde5e84b9e99 and `couples-apart-panel.json` a04b859b3762;
- at 014ee7cf:
  - `audit-couples-any.mjs` 2287e10c87a7 (the stamp's roots and data, l.78-81);
  - `reduce-couples-any.mjs` 299db737f0bc (the gate, l.61-97);
  - `couples-any-panel.mjs` 640d62d44ec2 (the kinds, `unitPlan`, `unitProblems`);
  - `src/solver/household.js` 94aca9051d20 (the 'risks' merge, l.185-196; `tierMapOf`, `perOwnerOf`, l.374-428);
- the launch log `results/couples-apart-launch-1.log`.

**What I ran** (nothing that launches units):
- `node research/solver/couples-apart-beside.mjs`: exit 0. Its output is `diff`-identical to `results-couples-apart-beside.txt`.
- The script on four planted copies of the results file (scratchpad `review-apart-2/`):
  - one unit line removed: refused, exit 2 ("63 unit lines, not 64");
  - one unit line duplicated: refused, exit 2 ("65 unit lines, not 64");
  - one id mangled (`Rp4x`): refused, exit 2 ("63 unit lines, not 64");
  - one unit line's capped pot removed: it throws, exit 1.
- In the checkout at 014ee7cf (`/home/user/couples-apart-read`, clean): `APART=1 node research/solver/reduce-couples-any.mjs`.
  Exit 0; its output is `diff`-identical to the committed `results-couples-apart.txt`.
- `git diff 014ee7cf HEAD` on the reducer, the panel module, the audit, the batch script, the panel json, the plan and the
  helpers the reducer calls: no change.
- My first look's array script again (scratchpad `review-apart/verify.mjs`):
  - each of the 64 units' target, arm A's label, variant, class, kind and holding is the committed panel's, with no mismatch;
  - by couple and wrapper, the capped pot, the mean pot and lifetime tax in pounds a path, and R's parts by path, each the
    beside file's and the results file's (below).
- `review-apart-2/accts.mjs` and `moved.mjs` (`APART=1`, in the checkout): each unit's accounts and risks, and the riskier
  person's holding in the wrapper held apart.
- `node research/solver/check-state.mjs`: passes (297 lines).

Verdict: PASS

## Findings

1. **MINOR: "What it means" says of all S351F's units what the file gives for 14 of its 16 (write-up l.88-89).**
   - It says: "On S351F and S357F, lifetime tax is higher by more than the capped pot moves."
   - The beside file gives the extra tax larger than the capped pot's change on all 16 of S357F's units, but on 14 of S351F's
     (`results-couples-apart-beside.txt` l.5-6; l.13, 6 of S351F's 8 pension units).
   - The two exceptions (`results-couples-apart.txt`):
     - S351F-Rp5s-Y75 (l.45): tax `+£157,075` a path (APP `£17,791`, ROUTE `£174,866`) against the capped pot's
       `-£172,871`;
     - S351F-Rp5t-own (l.46): `+£133,958` (`£32,041`, `£165,999`) against `-£168,855`.
   - The bullet above it has the count right (l.62: "on 14 of its 16 units"). Nothing rests on the sentence.
   - **Fix:** "on all 16 of S357F's units and 14 of S351F's".

## The first look's findings, as answered

1. **BLOCKING, the light look: answered.**
   - l.71-74 now say what each look measured:
     - this read: ROUTE against APP, on the mean pot;
     - the light look: the household route against today's two-table route, on the median pot, on one couple
       (S123-Rp3t-own and its variants). Its pot was higher at four apart and about 30% lower at five (its table, l.197-201:
       `£240,406` against `£208,692`; `£159,985` against `£229,591`, that is `-30.3%`);
     - ROUTE against today's route at four and five apart is not measured.
   - "Now on 64" and "That fits" are gone. Nothing carries `COUPLES-APART.md` l.12's "This test measures it" forward as a
     result. l.27-28 restate the plan's PASSES outcome (`COUPLES-APART.md` l.50-51), and the plan's rule reads ROUTE against APP.
   - l.63-70 say the smaller pot's cause is not traced here. Each reason given holds:
     - **The kept spending.** On the 48 units, `+4.307%` to `+17.433%` (beside l.17; results l.45 and l.39).
     - **S025's move down.** It holds by construction:
       - under 'risks' the household holds the pension and the ISA at the more cautious of the two risks (`household.js`
         l.191-196);
       - each person takes the household's tier by name from the plan's first year (`perOwnerOf`; the plant 'nofirstswitch'
         is the one that would leave the riskier person at their own tier in year 0);
       - every unit line, S025's included, marks the tier map in use.
     - **The size of that move on S025.** It is not smaller than elsewhere. The riskier holding is `3.8%` to `22.5%` of
       S025's accounts, the same range as S273's (`3.8%` to `26.3%` on S351F and S357F; `moved.mjs`). And S025's pot is larger,
       mean and capped, on all 16 units.
     - **The rehearsal's figures.** The rehearsal's R by distance, `+10.492`, `+9.404` and `+8.581`, is
       `results-couples-any.txt` l.137-139. Its 96 R units were on the same four couples at both holdings (12 kinds each) and
       the same 4,000 paths of seed 7002, on its own landings and code d91a642206b9. The claim drawn is only that this read
       does not show the gain comes from the move down, which it does not.
   - "What it means" now names the tax beside the pot. Finding 1 above is the one count it overstates.
2. **BLOCKING, STATE.md's count: answered.**
   - Section 5's line now says "lifetime tax higher on `51` of the `64`" (beside l.2).
   - Its other counts are the beside file's:
     - the mean pot smaller on S273's, S351F's and S357F's 48 units and larger on S025's 16 (l.3-6);
     - the capped pot lower on 31 of 64: 23 of the 32 pension units and 8 of the 32 ISA units (l.2, l.7-8).
   - Its survival, spending and M1 figures are the results file's (l.4-6, l.82).
3. **MINOR, the pounds: answered.**
   - The beside file gives the capped pot and lifetime tax in pounds a path, by couple and by couple and wrapper. My array
     script gives the same ranges and counts.
   - The write-up quotes S273's capped pot, S357F's tax and S351F's tax, and cites the file whole. That meets D116's "counted up
     to the cap and in pounds a path".
   - The pension-units sentence is now "lower on 23 of the 32 pension units and on 8 of the 32 ISA units (S273's)" (l.58).
     That is right, and so is l.55-56, which names S357F-Rp4t-Y75.
   - Not material: the script takes the tax in pounds as the difference of the two arms' rounded figures. So two range ends
     are £1 off the arrays: S273's `+£442,592` (arrays `+£442,591`) and S351F's `+£227,179` (`+£227,178`), the latter quoted
     at l.62. No count moves: the nearest comparison is £10,171 apart (S351F-Rp5s-own, tax `+£136,890` against the capped
     pot's `-£126,719`).
4. **MINOR, the stamp: answered by disclosure.**
   - l.75-78 say what the audit's stamp pins under `APART=1`, that the gate does not compare target or label, and that it did
     not bite. Each part is as the code has it (`audit-couples-any.mjs` l.78-81, `reduce-couples-any.mjs` l.76), and my
     rerun finds no mismatch.
   - The machinery is unchanged. The read is done, so this suffices. Any rerun of APART would need the fix first.
5. **MINOR, the uncommitted script: answered.**
   - `couples-apart-beside.mjs` is committed and reproduces its committed output byte for byte.
   - It refuses a count of unit lines other than 64, and throws on a unit line it cannot parse (the plants above).

The read itself is unchanged since my first look (the same results blob, reproduced from the launch checkout), and what that
look found to hold still holds. The outcome stands: PASSES, and nothing changes.
